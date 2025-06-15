// ==========================================
// ENHANCED CHAT API - Day 6 Implementation
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Process commands (simplified for now)
    let executedCommands;
    let commandsResponse = '';

    if (executeCommands && isCommand(message)) {
      try {
        const result = await executeCommand(message, user.id);
        if (result) {
          commandsResponse = result.content;
          executedCommands = { result };
        }
      } catch (error) {
        console.error('Error executing command:', error);
        commandsResponse = 'Erro ao executar comando.';
      }
    }

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
    console.error('Enhanced chat error:', error);

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
