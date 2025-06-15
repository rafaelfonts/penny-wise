// ==========================================
// ENHANCED CHAT API - Day 6 Implementation
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loggers } from '@/lib/utils/logger';
import marketContextService from '@/lib/services/market-context';
import { executeCommand, isCommand } from '@/lib/services/chat-commands';

import { generateUUID } from '@/lib/utils/uuid';

export interface EnhancedChatRequest {
  message: string;
  conversationId?: string;
  includeMarketData?: boolean;
  executeCommands?: boolean;
  files?: Array<{
    name: string;
    type: string;
    size: number;
    content: string; // base64 encoded
  }>;
}

export interface EnhancedChatResponse {
  response: string;
  conversationId: string;
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
  metadata?: {
    tokensUsed?: number;
    processingTime: number;
    dataSource?: string;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: EnhancedChatRequest = await request.json();
    const {
      message,
      conversationId,
      includeMarketData = true,
      executeCommands = true,
      files = [],
    } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Process market context
    let marketContext;
    let marketPromptContext = '';

    if (includeMarketData) {
      const { marketContext: context } =
        await marketContextService.processMessage(message);
      marketContext = context;
      marketPromptContext =
        marketContextService.formatContextForPrompt(context);
    }

    // Process commands - PRIORITY: Return OpLab commands directly without AI reprocessing
    if (executeCommands && isCommand(message)) {
      loggers.api.info('Processing OpLab command', { message });
      try {
        const result = await executeCommand(message, user.id);
        if (result) {
          loggers.api.info('OpLab command successful', { type: result.type });
          // ✅ RETURN OPLAB RESPONSE DIRECTLY - DO NOT REPROCESS WITH DEEPSEEK
          const processingTime = Date.now() - startTime;

          const response: EnhancedChatResponse = {
            response: result.content,
            conversationId: conversationId || generateUUID(),
            metadata: {
              processingTime,
              tokensUsed: Math.ceil(result.content.length / 4), // Estimate tokens
              dataSource: 'oplab-commands',
            },
          };

          // Add metadata for OpLab commands
          if (result.data && typeof result.data === 'object') {
            response.executedCommands = {
              alerts: [],
              analysis: [result.data],
              portfolio: [],
            };
          }

          loggers.api.info('Returning OpLab response directly', {
            contentLength: result.content.length,
          });
          return NextResponse.json(response);
        }
      } catch (error) {
        loggers.api.error('OpLab command execution failed', error);
        // Return error for failed OpLab commands instead of fallback to AI
        const processingTime = Date.now() - startTime;

        return NextResponse.json({
          response: `❌ **Erro no comando OpLab**: ${message}

Detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}

**Comandos disponíveis:**
• Digite \`/help\` para ver todos os comandos OpLab
• Use \`/market-status\` para verificar o mercado
• Experimente \`/stocks\` para ver ações disponíveis

*Problema técnico reportado automaticamente.*`,
          conversationId: conversationId || generateUUID(),
          metadata: {
            processingTime,
            tokensUsed: 50,
            dataSource: 'oplab-error-handler',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    // For non-command messages, continue with AI processing
    let executedCommands;
    const commandsResponse = '';

    // Prepare enhanced prompt for AI
    const enhancedPrompt = `
${message}

${marketPromptContext}

${commandsResponse ? `\nComandos executados:\n${commandsResponse}` : ''}

---
CONTEXTO: Você é um assistente financeiro especializado. Use os dados de mercado acima (se disponíveis) para contextualizar sua resposta. Se comandos foram executados, confirme-os na sua resposta.
    `.trim();

    // Import and use DeepSeek service directly
    const deepSeekService = (await import('@/lib/services/deepseek')).default;

    // Process with DeepSeek, including files if provided
    const aiData = await deepSeekService.processChatMessage(
      enhancedPrompt,
      [], // No conversation history for enhanced mode for now
      marketPromptContext,
      commandsResponse,
      files.length > 0 ? files : undefined
    );
    const processingTime = Date.now() - startTime;

    // Build enhanced response
    const response: EnhancedChatResponse = {
      response: aiData.response || '',
      conversationId: conversationId || generateUUID(),
      metadata: {
        processingTime,
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

    // Add executed commands if any
    if (executedCommands) {
      response.executedCommands = {
        alerts: [],
        analysis: [],
        portfolio: [],
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    loggers.api.error('Enhanced chat error', error);

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime,
        },
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Test market data service
    const symbols = await marketContextService.getSymbolSuggestions('PETR', 1);

    // Test commands service
    const hasCommands = isCommand('/test');

    return NextResponse.json({
      status: 'healthy',
      services: {
        marketContext: symbols.length > 0,
        chatCommands: typeof hasCommands === 'boolean',
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
