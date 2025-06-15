import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import chatMarketIntegrationService from '@/lib/services/chat-market-integration';
import deepSeekService from '@/lib/services/deepseek';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user (more secure than getSession)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversation_id, files = [] } = body;

    if (!message || !conversation_id) {
      return NextResponse.json(
        { error: 'Message and conversation_id are required' },
        { status: 400 }
      );
    }

    // Get conversation history for context
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (convError) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Save user message
    const { error: userMessageError } = await supabase.from('messages').insert({
      conversation_id,
      role: 'user',
      content: message,
    });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Try to process with market integration first for specific commands
    let aiResponse: { response: string; metadata?: Record<string, unknown> };
    let marketContext = '';
    const commandsContext = '';

    try {
      const marketResponse =
        await chatMarketIntegrationService.processMessage(message);

      // Se o serviço de mercado processou com sucesso (comando ou símbolo detectado)
      if (
        marketResponse.metadata.command ||
        (marketResponse.metadata.symbols &&
          marketResponse.metadata.symbols.length > 0)
      ) {
        // Use market-specific response for commands
        aiResponse = {
          response: marketResponse.response,
          metadata: {
            model: marketResponse.metadata.model,
            tokens: marketResponse.metadata.tokens,
            processing_time: marketResponse.metadata.processing_time,
            market_data: true,
            command: marketResponse.metadata.command,
            symbols: marketResponse.metadata.symbols,
            follow_up: marketResponse.followUp,
          },
        };
      } else {
        // For general chat, use DeepSeek with market context if available
        if (
          marketResponse.metadata.symbols &&
          marketResponse.metadata.symbols.length > 0
        ) {
          marketContext = `Símbolos mencionados: ${marketResponse.metadata.symbols.join(', ')}`;
        }

        // Get conversation history for context
        const conversationHistory = deepSeekService.convertToDeepSeekMessages(
          conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          }))
        );

        // Use DeepSeek for general financial chat
        const deepSeekResponse = await deepSeekService.processChatMessage(
          message,
          conversationHistory,
          marketContext,
          commandsContext,
          files.length > 0 ? files : undefined
        );

        aiResponse = {
          response: deepSeekResponse.response,
          metadata: {
            model: deepSeekResponse.metadata.model,
            tokens: deepSeekResponse.metadata.tokens,
            processing_time: deepSeekResponse.metadata.processing_time,
            finish_reason: deepSeekResponse.metadata.finish_reason,
            market_data: !!marketContext,
            ai_powered: true,
          },
        };
      }
    } catch (error) {
      console.error('Chat processing error:', error);

      // Fallback to basic DeepSeek response
      try {
        const fallbackResponse = await deepSeekService.processChatMessage(
          message,
          [],
          '',
          '',
          files.length > 0 ? files : undefined
        );

        aiResponse = {
          response: fallbackResponse.response,
          metadata: {
            model: fallbackResponse.metadata.model,
            tokens: fallbackResponse.metadata.tokens,
            processing_time: fallbackResponse.metadata.processing_time,
            finish_reason: fallbackResponse.metadata.finish_reason,
            market_data: false,
            ai_powered: true,
            fallback: true,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      } catch (deepSeekError) {
        console.error('DeepSeek fallback error:', deepSeekError);

        // Ultimate fallback
        aiResponse = {
          response:
            'Desculpe, estou enfrentando dificuldades técnicas no momento. Tente novamente em alguns instantes.',
          metadata: {
            model: 'fallback',
            tokens: 0,
            processing_time: 0,
            error:
              deepSeekError instanceof Error
                ? deepSeekError.message
                : 'Service unavailable',
          },
        };
      }
    }

    // Save AI response
    const { error: aiMessageError } = await supabase.from('messages').insert({
      conversation_id,
      role: 'assistant',
      content: aiResponse.response,
      metadata: aiResponse.metadata
        ? JSON.parse(JSON.stringify(aiResponse.metadata))
        : null,
    });

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError);
      return NextResponse.json(
        { error: 'Failed to save AI response' },
        { status: 500 }
      );
    }

    // Update conversation title if it's the first message
    if (conversation.messages.length === 0) {
      const title =
        message.length > 50 ? message.substring(0, 47) + '...' : message;

      await supabase
        .from('conversations')
        .update({
          title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation_id)
        .eq('user_id', user.id);
    } else {
      // Just update the timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation_id)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      response: aiResponse.response,
      metadata: aiResponse.metadata,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
