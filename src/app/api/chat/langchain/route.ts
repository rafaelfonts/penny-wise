// ==========================================
// LANGCHAIN CHAT API ENDPOINT - Penny Wise
// Endpoint robusto usando LangChain para orquestrar DeepSeek e OpLab
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import langChainIntegrationService, {
  type LangChainRequest,
  type LangChainResponse,
} from '@/lib/services/langchain-integration';
import { generateUUID } from '@/lib/utils/uuid';

// ==========================================
// REQUEST/RESPONSE INTERFACES
// ==========================================

export interface LangChainChatRequest {
  message: string;
  conversationId?: string;
  includeMarketData?: boolean;
  context?: Record<string, unknown>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    enableCache?: boolean;
    retryAttempts?: number;
    timeout?: number;
  };
}

export interface LangChainChatResponse {
  success: boolean;
  response?: string;
  conversationId?: string;
  executedTools?: string[];
  processingTime?: number;
  tokensUsed?: number;
  cacheHit?: boolean;
  metadata?: {
    model: string;
    temperature: number;
    retries: number;
    dataSource: string[];
    error?: string;
  };
  data?: Record<string, unknown>;
  error?: string;
  status?: 'success' | 'error' | 'partial';
}

// ==========================================
// MAIN API HANDLERS
// ==========================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Initialize Supabase and check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          status: 'error',
        } as LangChainChatResponse,
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: LangChainChatRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          status: 'error',
        } as LangChainChatResponse,
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required and cannot be empty',
          status: 'error',
        } as LangChainChatResponse,
        { status: 400 }
      );
    }

    // Prepare LangChain request
    const langChainRequest: LangChainRequest = {
      message: body.message.trim(),
      userId: user.id,
      conversationId: body.conversationId || generateUUID(),
      includeMarketData: body.includeMarketData ?? true,
      context: body.context || {},
      options: {
        temperature: body.options?.temperature ?? 0.3,
        maxTokens: body.options?.maxTokens ?? 2000,
        enableCache: body.options?.enableCache ?? true,
        retryAttempts: body.options?.retryAttempts ?? 3,
        timeout: body.options?.timeout ?? 30000,
      },
    };

    console.log(
      `[LangChain API] Processing request for user ${user.id}: "${body.message.substring(0, 100)}..."`
    );

    // Process with LangChain service
    const result: LangChainResponse =
      await langChainIntegrationService.processMessage(langChainRequest);

    // Build API response
    const apiResponse: LangChainChatResponse = {
      success: true,
      response: result.response,
      conversationId: result.conversationId,
      executedTools: result.executedTools,
      processingTime: result.processingTime,
      tokensUsed: result.tokensUsed,
      cacheHit: result.cacheHit,
      metadata: result.metadata,
      data: result.data,
      status: 'success',
    };

    // Log successful request
    const totalTime = Date.now() - startTime;
    console.log(
      `[LangChain API] Request completed successfully in ${totalTime}ms`
    );
    console.log(
      `[LangChain API] Tools executed: ${result.executedTools.join(', ')}`
    );
    console.log(`[LangChain API] Tokens used: ${result.tokensUsed}`);
    console.log(`[LangChain API] Cache hit: ${result.cacheHit}`);

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('[LangChain API] Request failed:', error);

    const totalTime = Date.now() - startTime;
    const errorResponse: LangChainChatResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      processingTime: totalTime,
      tokensUsed: 0,
      cacheHit: false,
      metadata: {
        model: 'error-handler',
        temperature: 0,
        retries: 0,
        dataSource: ['error'],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      status: 'error',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ==========================================
// HEALTH CHECK & STATUS
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'status') {
      // Get detailed service status
      const status = await langChainIntegrationService.getStatus();

      return NextResponse.json({
        success: true,
        service: 'langchain-integration',
        timestamp: new Date().toISOString(),
        status: {
          ...status,
          environment: process.env.NODE_ENV,
          endpoints: {
            deepseek_configured: !!process.env.DEEPSEEK_API_KEY,
            oplab_configured: !!process.env.OPLAB_ACCESS_TOKEN,
            redis_configured: !!process.env.REDIS_URL,
          },
        },
      });
    }

    // Default health check
    return NextResponse.json({
      success: true,
      service: 'langchain-integration',
      message: 'LangChain integration service is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: [
        'POST /api/chat/langchain - Process chat messages',
        'GET /api/chat/langchain?action=status - Get service status',
      ],
    });
  } catch (error) {
    console.error('[LangChain API] Health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        service: 'langchain-integration',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ==========================================
// OPTIONS - CORS SUPPORT
// ==========================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
