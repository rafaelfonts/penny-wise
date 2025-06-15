// ==========================================
// UNIFIED CHAT API - Consolidates all chat functionality
// Replaces: /enhanced, /send, /stream routes
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import marketContextService from '@/lib/services/market-context';
import { executeCommand, isCommand } from '@/lib/services/chat-commands';
import { generateUUID } from '@/lib/utils/uuid';

// ==========================================
// TYPES
// ==========================================

export interface UnifiedChatRequest {
  message: string;
  conversationId?: string;
  userId?: string;

  // Feature flags
  mode?: 'enhanced' | 'basic' | 'stream';
  includeMarketData?: boolean;
  executeCommands?: boolean;
  persistConversation?: boolean;

  // Optional data
  files?: Array<{
    name: string;
    type: string;
    size: number;
    content: string; // base64 encoded
  }>;

  // AI Configuration
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

export interface UnifiedChatResponse {
  success: boolean;
  response: string;
  conversationId: string;

  // Enhanced features
  marketContext?: {
    symbols: string[];
    prices: Record<string, number>;
    changes: Record<string, number>;
    changePercents: Record<string, number>;
    lastUpdated: string;
  };

  executedCommands?: {
    alerts: unknown[];
    analysis: unknown[];
    portfolio: unknown[];
  };

  // Metadata
  metadata: {
    mode: string;
    processingTime: number;
    tokensUsed?: number;
    dataSource?: string;
    error?: string;
    cacheHit?: boolean;
  };
}

// ==========================================
// MAIN ENDPOINT
// ==========================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          metadata: {
            processingTime: Date.now() - startTime,
            mode: 'auth-error',
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body: UnifiedChatRequest = await request.json();
    const { message, mode = 'enhanced' } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required',
          metadata: {
            processingTime: Date.now() - startTime,
            mode: 'validation-error',
          },
        },
        { status: 400 }
      );
    }

    console.log(
      `[Unified API] Processing message in ${mode} mode: ${message.slice(0, 50)}...`
    );

    // Route to appropriate handler based on mode
    switch (mode) {
      case 'stream':
        return handleStreamMode(request, user, body, startTime);

      case 'basic':
        return handleBasicMode(user, body, startTime);

      case 'enhanced':
      default:
        return handleEnhancedMode(user, body, startTime);
    }
  } catch (error) {
    console.error('[Unified API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime,
          mode: 'error',
        },
      },
      { status: 500 }
    );
  }
}

// ==========================================
// MODE HANDLERS
// ==========================================

async function handleEnhancedMode(
  user: { id: string },
  body: UnifiedChatRequest,
  startTime: number
): Promise<NextResponse> {
  const { message, conversationId, includeMarketData, executeCommands, files } =
    body;

  // Process market context
  let marketContext;
  let marketPromptContext = '';

  if (includeMarketData) {
    const { marketContext: context } =
      await marketContextService.processMessage(message);
    marketContext = context;
    marketPromptContext = marketContextService.formatContextForPrompt(context);
  }

  // Priority 1: Handle OpLab commands directly
  if (executeCommands && isCommand(message)) {
    console.log(`[Unified API] Processing OpLab command: ${message}`);

    try {
      const result = await executeCommand(message, user.id);
      if (result) {
        const response: UnifiedChatResponse = {
          success: true,
          response: result.content,
          conversationId: conversationId!,
          metadata: {
            mode: 'enhanced-oplab',
            processingTime: Date.now() - startTime,
            tokensUsed: Math.ceil(result.content.length / 4),
            dataSource: 'oplab-commands',
          },
        };

        // Add command execution metadata
        if (result.data && typeof result.data === 'object') {
          response.executedCommands = {
            alerts: [],
            analysis: [result.data],
            portfolio: [],
          };
        }

        return NextResponse.json(response);
      }
    } catch (error) {
      console.error('[Unified API] OpLab command failed:', error);

      return NextResponse.json({
        success: false,
        response: `❌ **Erro no comando OpLab**: ${message}

Detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}

**Comandos disponíveis:**
• Digite \`/help\` para ver todos os comandos OpLab
• Use \`/market-status\` para verificar o mercado
• Experimente \`/stocks\` para ver ações disponíveis

*Problema técnico reportado automaticamente.*`,
        conversationId: conversationId!,
        metadata: {
          mode: 'enhanced-oplab-error',
          processingTime: Date.now() - startTime,
          tokensUsed: 50,
          dataSource: 'oplab-error-handler',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  // Priority 2: Process with AI
  const enhancedPrompt = `
${message}

${marketPromptContext}

---
CONTEXTO: Você é um assistente financeiro especializado. Use os dados de mercado acima (se disponíveis) para contextualizar sua resposta.
  `.trim();

  try {
    // Import DeepSeek service
    const deepSeekService = (await import('@/lib/services/deepseek')).default;

    // Process with AI
    const aiData = await deepSeekService.processChatMessage(
      enhancedPrompt,
      [], // TODO: Add conversation history
      marketPromptContext,
      '',
      files && files.length > 0 ? files : undefined
    );

    const response: UnifiedChatResponse = {
      success: true,
      response: aiData.response || '',
      conversationId: conversationId!,
      metadata: {
        mode: 'enhanced-ai',
        processingTime: Date.now() - startTime,
        dataSource: marketContext?.source,
        tokensUsed: aiData.metadata.tokens,
      },
    };

    // Add market context if available
    if (marketContext && marketContext.symbols.length > 0) {
      response.marketContext = {
        symbols: marketContext.symbols,
        prices: marketContext.prices,
        changes: marketContext.changes,
        changePercents: marketContext.changePercents,
        lastUpdated: marketContext.lastUpdated,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Unified API] AI processing failed:', error);

    return NextResponse.json({
      success: false,
      response:
        'Desculpe, estou enfrentando dificuldades técnicas no momento. Tente novamente em alguns instantes.',
      conversationId: conversationId!,
      metadata: {
        mode: 'enhanced-fallback',
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

async function handleBasicMode(
  user: { id: string },
  body: UnifiedChatRequest,
  startTime: number
): Promise<NextResponse> {
  // Basic mode: Direct AI processing without market context
  const { message, conversationId, files } = body;

  try {
    const deepSeekService = (await import('@/lib/services/deepseek')).default;

    const aiData = await deepSeekService.processChatMessage(
      message,
      [], // No conversation history in basic mode
      '',
      '',
      files && files.length > 0 ? files : undefined
    );

    const response: UnifiedChatResponse = {
      success: true,
      response: aiData.response || '',
      conversationId: conversationId!,
      metadata: {
        mode: 'basic',
        processingTime: Date.now() - startTime,
        tokensUsed: aiData.metadata.tokens,
        dataSource: 'basic-ai',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Unified API] Basic mode failed:', error);

    return NextResponse.json({
      success: false,
      response: 'Erro no processamento básico. Tente novamente.',
      conversationId: conversationId!,
      metadata: {
        mode: 'basic-error',
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

async function handleStreamMode(
  request: NextRequest,
  user: { id: string },
  body: UnifiedChatRequest,
  startTime: number
): Promise<NextResponse> {
  // Stream mode: Return streaming response
  // TODO: Implement proper streaming with Server-Sent Events

  return NextResponse.json({
    success: false,
    response: 'Streaming mode not yet implemented in unified API',
    conversationId: body.conversationId || generateUUID(),
    metadata: {
      mode: 'stream-not-implemented',
      processingTime: Date.now() - startTime,
      tokensUsed: 0,
    },
  });
}

// ==========================================
// HEALTH CHECK
// ==========================================

export async function GET() {
  try {
    // Test services availability
    const marketTest = await marketContextService.getSymbolSuggestions(
      'PETR',
      1
    );
    const commandTest = isCommand('/test');

    return NextResponse.json({
      status: 'healthy',
      version: '1.0.0',
      modes: ['enhanced', 'basic', 'stream'],
      services: {
        marketContext: marketTest.length > 0,
        chatCommands: typeof commandTest === 'boolean',
        deepseek: !!process.env.DEEPSEEK_API_KEY,
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
