// ==========================================
// LANGCHAIN INTEGRATION SERVICE - Penny Wise
// Integração robusta entre DeepSeek e OpLab APIs
// ==========================================

import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredTool } from '@langchain/core/tools';
import Redis from 'ioredis';

// Import existing services
import { executeCommand } from './chat-commands';
import deepSeekService from './deepseek';

// ==========================================
// TYPES & SCHEMAS
// ==========================================

// Request validation schema
const LangChainRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  userId: z.string().min(1, 'User ID is required'),
  conversationId: z.string().optional(),
  includeMarketData: z.boolean().default(true),
  context: z.record(z.unknown()).optional(),
  options: z
    .object({
      temperature: z.number().min(0).max(2).default(0.3),
      maxTokens: z.number().min(1).max(8000).default(2000),
      enableCache: z.boolean().default(true),
      retryAttempts: z.number().min(0).max(5).default(3),
      timeout: z.number().min(1000).max(60000).default(30000),
    })
    .optional(),
});

type LangChainRequest = z.infer<typeof LangChainRequestSchema>;

interface LangChainResponse {
  response: string;
  conversationId: string;
  executedTools: string[];
  processingTime: number;
  tokensUsed: number;
  cacheHit: boolean;
  metadata: {
    model: string;
    temperature: number;
    retries: number;
    dataSource: string[];
    error?: string;
  };
  data?: Record<string, unknown>;
}

interface ProcessingContext {
  userId: string;
  conversationId: string;
  startTime: number;
  retryCount: number;
  cacheKey: string;
  executedTools: string[];
}

// ==========================================
// RATE LIMITING & CACHE
// ==========================================

class RateLimiter {
  private redis: Redis;
  private keyPrefix = 'rate_limit:';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const redisKey = `${this.keyPrefix}${key}`;
    const current = await this.redis.get(redisKey);

    if (!current) {
      await this.redis.setex(redisKey, Math.ceil(windowMs / 1000), '1');
      return true;
    }

    const count = parseInt(current, 10);
    if (count >= limit) {
      return false;
    }

    await this.redis.incr(redisKey);
    return true;
  }

  async getRemainingRequests(key: string, limit: number): Promise<number> {
    const redisKey = `${this.keyPrefix}${key}`;
    const current = await this.redis.get(redisKey);
    return current ? Math.max(0, limit - parseInt(current, 10)) : limit;
  }
}

class CacheManager {
  private redis: Redis;
  private keyPrefix = 'langchain_cache:';
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  private generateKey(
    message: string,
    userId: string,
    context?: Record<string, unknown>
  ): string {
    const hash = Buffer.from(
      JSON.stringify({ message, userId, context })
    ).toString('base64');
    return `${this.keyPrefix}${hash}`;
  }

  async get(
    message: string,
    userId: string,
    context?: Record<string, unknown>
  ): Promise<LangChainResponse | null> {
    try {
      const key = this.generateKey(message, userId, context);
      const cached = await this.redis.get(key);

      if (cached) {
        const parsed = JSON.parse(cached) as LangChainResponse;
        return { ...parsed, cacheHit: true };
      }
    } catch (error) {
      console.error('[CacheManager] Error getting cached response:', error);
    }
    return null;
  }

  async set(
    message: string,
    userId: string,
    response: LangChainResponse,
    context?: Record<string, unknown>,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const key = this.generateKey(message, userId, context);
      await this.redis.setex(
        key,
        ttl,
        JSON.stringify({ ...response, cacheHit: false })
      );
    } catch (error) {
      console.error('[CacheManager] Error caching response:', error);
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}*${userId}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('[CacheManager] Error invalidating cache:', error);
    }
  }
}

// ==========================================
// LANGCHAIN TOOLS
// ==========================================

class OpLabTool extends StructuredTool {
  name = 'oplab_market_data';
  description =
    'Execute OpLab commands for Brazilian market data and analysis. Use this for /commands starting with slash.';

  schema = z.object({
    command: z
      .string()
      .describe(
        'The OpLab command to execute (e.g., /market-status, /options PETR4)'
      ),
    userId: z.string().describe('User ID for the request'),
  });

  async _call({ command, userId }: { command: string; userId: string }) {
    try {
      console.log(`[OpLabTool] Executing command: ${command}`);
      const result = await executeCommand(command, userId);

      if (result) {
        return {
          success: true,
          content: result.content,
          data: result.data || {},
          type: result.type,
        };
      }

      return {
        success: false,
        content: 'Command execution failed',
        error: 'No result returned from OpLab',
      };
    } catch (error) {
      console.error('[OpLabTool] Error executing command:', error);
      return {
        success: false,
        content: 'Error executing OpLab command',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class DeepSeekTool extends StructuredTool {
  name = 'deepseek_analysis';
  description =
    'Use DeepSeek AI for intelligent analysis, explanations, and insights. Best for complex analysis and explanations.';

  schema = z.object({
    prompt: z.string().describe('The prompt to send to DeepSeek AI'),
    context: z
      .string()
      .optional()
      .describe('Additional context for the analysis'),
    temperature: z
      .number()
      .min(0)
      .max(2)
      .default(0.3)
      .describe('Creativity level (0-2)'),
  });

  async _call({
    prompt,
    context,
  }: {
    prompt: string;
    context?: string;
    temperature?: number;
  }) {
    try {
      console.log(`[DeepSeekTool] Processing analysis request`);

      const enhancedPrompt = context
        ? `${prompt}\n\n**Context:**\n${context}`
        : prompt;

      const result = await deepSeekService.processChatMessage(
        enhancedPrompt,
        [], // No conversation history for tools
        context || '',
        '',
        undefined
      );

      return {
        success: true,
        response: result.response,
        tokensUsed: result.metadata.tokens,
        model: result.metadata.model,
      };
    } catch (error) {
      console.error('[DeepSeekTool] Error processing request:', error);
      return {
        success: false,
        response: 'Error processing AI analysis',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ==========================================
// MAIN LANGCHAIN INTEGRATION SERVICE
// ==========================================

class LangChainIntegrationService {
  private rateLimiter: RateLimiter;
  private cacheManager: CacheManager;
  private model: ChatOpenAI;
  private tools: StructuredTool[];

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.cacheManager = new CacheManager();

    // Initialize DeepSeek model via OpenAI compatible API
    this.model = new ChatOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: {
        baseURL:
          process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL ||
          'https://api.deepseek.com',
      },
      modelName: 'deepseek-chat',
      temperature: 0.3,
      maxTokens: 2000,
      timeout: 30000,
    });

    // Initialize tools
    this.tools = [new OpLabTool(), new DeepSeekTool()];

    console.log(
      '[LangChain] Service initialized with tools:',
      this.tools.map(t => t.name)
    );
  }

  // ==========================================
  // VALIDATION & ERROR HANDLING
  // ==========================================

  private validateRequest(request: unknown): LangChainRequest {
    try {
      return LangChainRequestSchema.parse(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new Error(
          `Validation error: ${firstError.path.join('.')} - ${firstError.message}`
        );
      }
      throw error;
    }
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const allowed = await this.rateLimiter.checkLimit(
      `user:${userId}`,
      100, // 100 requests
      3600000 // per hour
    );

    if (!allowed) {
      const remaining = await this.rateLimiter.getRemainingRequests(
        `user:${userId}`,
        100
      );
      throw new Error(`Rate limit exceeded. Remaining requests: ${remaining}`);
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ProcessingContext,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        context.retryCount = attempt;
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`[LangChain] Attempt ${attempt + 1} failed:`, error);

        if (attempt === maxRetries) break;

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // ==========================================
  // INTELLIGENT ROUTING
  // ==========================================

  private async intelligentRouting(message: string): Promise<{
    useOpLab: boolean;
    command?: string;
    needsAnalysis: boolean;
  }> {
    // Check if message is a direct OpLab command
    if (message.startsWith('/')) {
      return {
        useOpLab: true,
        command: message,
        needsAnalysis: false,
      };
    }

    // Check for market data requests in natural language
    const marketKeywords = [
      'cotação',
      'preço',
      'ação',
      'opção',
      'mercado',
      'bolsa',
      'petr4',
      'vale3',
      'itub4',
      'status',
      'análise fundamentalista',
    ];

    const hasMarketKeywords = marketKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );

    // Check for analysis requests
    const analysisKeywords = [
      'explique',
      'analise',
      'compare',
      'como',
      'por que',
      'qual',
      'estratégia',
      'recomendação',
      'opinião',
    ];

    const needsAnalysis = analysisKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );

    return {
      useOpLab: hasMarketKeywords,
      needsAnalysis: needsAnalysis || hasMarketKeywords,
    };
  }

  // ==========================================
  // MAIN PROCESSING METHOD
  // ==========================================

  async processMessage(request: unknown): Promise<LangChainResponse> {
    // Validate request
    const validatedRequest = this.validateRequest(request);
    const startTime = Date.now();

    // Create processing context
    const context: ProcessingContext = {
      userId: validatedRequest.userId,
      conversationId: validatedRequest.conversationId || `conv_${Date.now()}`,
      startTime,
      retryCount: 0,
      cacheKey: `${validatedRequest.userId}_${validatedRequest.message}`,
      executedTools: [],
    };

    try {
      // Check rate limiting
      await this.checkRateLimit(validatedRequest.userId);

      // Check cache if enabled
      if (validatedRequest.options?.enableCache) {
        const cached = await this.cacheManager.get(
          validatedRequest.message,
          validatedRequest.userId,
          validatedRequest.context
        );

        if (cached) {
          console.log('[LangChain] Cache hit');
          return {
            ...cached,
            conversationId: context.conversationId,
            processingTime: Date.now() - startTime,
          };
        }
      }

      // Intelligent routing
      const routing = await this.intelligentRouting(validatedRequest.message);
      console.log('[LangChain] Routing decision:', routing);

      let finalResponse = '';
      let responseData: Record<string, unknown> = {};

      // Execute OpLab command if needed
      if (routing.useOpLab && routing.command) {
        try {
          const opLabTool = new OpLabTool();
          const opLabResult = await opLabTool._call({
            command: routing.command,
            userId: validatedRequest.userId,
          });

          if (opLabResult.success) {
            finalResponse = opLabResult.content;
            responseData = { oplab: opLabResult.data };
            context.executedTools.push('oplab_market_data');
          }
        } catch (error) {
          console.error('[LangChain] OpLab execution failed:', error);
        }
      }

      // Use DeepSeek for analysis if needed
      if (routing.needsAnalysis || !finalResponse) {
        try {
          const deepSeekTool = new DeepSeekTool();
          const analysisResult = await deepSeekTool._call({
            prompt: validatedRequest.message,
            context: finalResponse
              ? `Dados do mercado: ${finalResponse}`
              : undefined,
            temperature: validatedRequest.options?.temperature || 0.3,
          });

          if (analysisResult.success) {
            finalResponse = finalResponse
              ? `${finalResponse}\n\n## 🤖 Análise AI\n\n${analysisResult.response}`
              : analysisResult.response;
            responseData.deepseek = {
              tokensUsed: analysisResult.tokensUsed,
              model: analysisResult.model,
            };
            context.executedTools.push('deepseek_analysis');
          }
        } catch (error) {
          console.error('[LangChain] DeepSeek analysis failed:', error);
        }
      }

      // Fallback if no response
      if (!finalResponse) {
        finalResponse = `❌ **Não foi possível processar sua solicitação**

Ocorreu um erro ao executar os comandos necessários. Tente:
- Reformular sua pergunta
- Usar comandos específicos (ex: /market-status)
- Verificar se os serviços estão funcionando

**Comandos disponíveis:** Digite \`/help\` para ver a lista completa.`;
      }

      // Build response
      const response: LangChainResponse = {
        response: finalResponse,
        conversationId: context.conversationId,
        executedTools: context.executedTools,
        processingTime: Date.now() - startTime,
        tokensUsed: this.estimateTokens(finalResponse),
        cacheHit: false,
        metadata: {
          model: 'langchain-orchestrator',
          temperature: validatedRequest.options?.temperature || 0.3,
          retries: context.retryCount,
          dataSource: context.executedTools,
        },
        data: responseData,
      };

      // Cache response if enabled
      if (validatedRequest.options?.enableCache) {
        await this.cacheManager.set(
          validatedRequest.message,
          validatedRequest.userId,
          response,
          validatedRequest.context
        );
      }

      console.log(
        `[LangChain] Request processed successfully in ${response.processingTime}ms`
      );
      return response;
    } catch (error) {
      console.error('[LangChain] Request processing failed:', error);

      const errorResponse: LangChainResponse = {
        response: `❌ **Erro no processamento da solicitação**

${error instanceof Error ? error.message : 'Erro desconhecido'}

**Ações sugeridas:**
- Verifique se sua solicitação está clara e bem formatada
- Tente novamente em alguns segundos
- Entre em contato com o suporte se o problema persistir`,
        conversationId: context.conversationId,
        executedTools: context.executedTools,
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        cacheHit: false,
        metadata: {
          model: 'error-handler',
          temperature: 0,
          retries: context.retryCount,
          dataSource: ['error'],
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };

      return errorResponse;
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English, adjust for Portuguese
    return Math.ceil(text.length / 3.5);
  }

  async getStatus(): Promise<{
    tools_count: number;
    cache_connected: boolean;
    rate_limiter_connected: boolean;
    model_configured: boolean;
  }> {
    return {
      tools_count: this.tools.length,
      cache_connected: await this.testCacheConnection(),
      rate_limiter_connected: await this.testRateLimiterConnection(),
      model_configured: !!process.env.DEEPSEEK_API_KEY,
    };
  }

  private async testCacheConnection(): Promise<boolean> {
    try {
      await this.cacheManager.get('test', 'test');
      return true;
    } catch {
      return false;
    }
  }

  private async testRateLimiterConnection(): Promise<boolean> {
    try {
      await this.rateLimiter.checkLimit('test', 1, 1000);
      return true;
    } catch {
      return false;
    }
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  async cleanup(): Promise<void> {
    try {
      // Close Redis connections
      this.cacheManager['redis'].disconnect();
      this.rateLimiter['redis'].disconnect();
      console.log('[LangChain] Cleanup completed');
    } catch (error) {
      console.error('[LangChain] Cleanup error:', error);
    }
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

const langChainIntegrationService = new LangChainIntegrationService();

export default langChainIntegrationService;
export type { LangChainRequest, LangChainResponse };
