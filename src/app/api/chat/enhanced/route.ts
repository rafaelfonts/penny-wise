// ==========================================
// ENHANCED CHAT API - Day 6 Implementation
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import marketContextService from '@/lib/services/market-context';
import chatCommandsService from '@/lib/services/chat-commands';
import portfolioAnalysisService from '@/lib/services/portfolio-analysis';

export interface EnhancedChatRequest {
  message: string;
  conversationId?: string;
  includeMarketData?: boolean;
  executeCommands?: boolean;
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: EnhancedChatRequest = await request.json();
    const { 
      message, 
      conversationId, 
      includeMarketData = true, 
      executeCommands = true 
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Process market context
    let marketContext;
    let marketPromptContext = '';
    
    if (includeMarketData) {
      const { marketContext: context } = await marketContextService.processMessage(message);
      marketContext = context;
      marketPromptContext = marketContextService.formatContextForPrompt(context);
    }

    // Process commands
    let executedCommands;
    let commandsResponse = '';
    
    if (executeCommands) {
      const commands = chatCommandsService.parseAllCommands(message);
      
      if (commands.hasCommands) {
        // Execute alert commands (integrate with existing alert system)
        if (commands.alerts.length > 0) {
          for (const alertCommand of commands.alerts) {
            try {
                             // Integration with existing alert creation API
               const { data, error } = await supabase
                 .from('user_alerts')
                 .insert({
                  user_id: user.id,
                  symbol: alertCommand.symbol,
                  alert_type: 'price',
                  condition_type: alertCommand.condition,
                  target_value: alertCommand.threshold,
                  is_active: true,
                  metadata: {
                    created_via: 'chat_command',
                    original_message: message
                  }
                })
                .select()
                .single();

              if (error) {
                console.error('Error creating alert:', error);
              } else {
                console.log('Alert created successfully:', data);
              }
            } catch (error) {
              console.error('Error creating alert:', error);
            }
          }
        }

        // Execute portfolio commands
        if (commands.portfolio.length > 0) {
          for (const portfolioCommand of commands.portfolio) {
            try {
              // Get user's portfolio data (mock for now, would come from database)
              const mockPortfolio = [
                { symbol: 'AAPL', quantity: 10, averageCost: 150 },
                { symbol: 'GOOGL', quantity: 5, averageCost: 2500 },
                { symbol: 'MSFT', quantity: 15, averageCost: 300 },
                { symbol: 'TSLA', quantity: 8, averageCost: 250 }
              ];

              const analysis = await portfolioAnalysisService.analyzePortfolio({
                holdings: mockPortfolio,
                timeframe: portfolioCommand.timeframe || '1m',
                analysisType: portfolioCommand.action === 'analyze' ? 'complete' : portfolioCommand.action,
                includeRecommendations: portfolioCommand.includeRecommendations
              });

              const portfolioSummary = portfolioAnalysisService.generateAnalysisSummary(analysis);
              commandsResponse += '\n\n' + portfolioSummary;

            } catch (error) {
              console.error('Error analyzing portfolio:', error);
              commandsResponse += '\n\n❌ Erro ao analisar portfólio. Tente novamente.';
            }
          }
        }

        commandsResponse = chatCommandsService.generateCommandResponse(commands);
        executedCommands = commands;
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

    // Call AI service (using existing chat endpoint logic)
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        message: enhancedPrompt,
        conversationId: conversationId
      })
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to get AI response');
    }

    const aiData = await aiResponse.json();
    const processingTime = Date.now() - startTime;

    // Build enhanced response
    const response: EnhancedChatResponse = {
      response: aiData.response || '',
      conversationId: aiData.conversationId || conversationId || '',
      metadata: {
        processingTime,
        dataSource: marketContext?.source
      }
    };

    // Add market context if available
    if (marketContext && marketContext.symbols.length > 0) {
      response.marketContext = {
        symbols: marketContext.symbols,
        prices: marketContext.prices,
        changes: marketContext.changes,
        changePercents: marketContext.changePercents,
        lastUpdated: marketContext.lastUpdated
      };
    }

    // Add executed commands if any
    if (executedCommands?.hasCommands) {
      response.executedCommands = {
        alerts: executedCommands.alerts,
        analysis: executedCommands.analysis,
        portfolio: executedCommands.portfolio
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Enhanced chat error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        processingTime
      }
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Test market data service
    const symbols = await marketContextService.getSymbolSuggestions('PETR', 1);
    
    // Test commands service
    const hasCommands = chatCommandsService.hasCommands('test message');
    
    return NextResponse.json({
      status: 'healthy',
      services: {
        marketContext: symbols.length > 0,
        chatCommands: typeof hasCommands === 'boolean'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 