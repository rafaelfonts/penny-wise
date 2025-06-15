// ==========================================
// CHAT STREAMING API - Day 6 Implementation
// ==========================================

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import chatMarketIntegrationService from '@/lib/services/chat-market-integration';
import deepSeekService from '@/lib/services/deepseek';
import { generateUUID } from '@/lib/utils/uuid';

export interface StreamChatRequest {
  message: string;
  conversation_id: string;
  includeMarketData?: boolean;
  files?: Array<{
    name: string;
    type: string;
    size: number;
    content: string; // base64 encoded
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user (more secure than getSession)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body: StreamChatRequest = await request.json();
    const {
      message,
      conversation_id,
      includeMarketData = true,
      files = [],
    } = body;

    if (!message || !conversation_id) {
      return new Response(
        JSON.stringify({ error: 'Message and conversation_id are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
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
      // If conversation doesn't exist, create it
      if (convError.code === 'PGRST116') {
        console.log(
          'Conversation not found, creating new one:',
          conversation_id
        );

        const { error: createError } = await supabase
          .from('conversations')
          .insert({
            id: conversation_id,
            user_id: user.id,
            title: 'Nova Conversa',
            is_pinned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createError) {
          console.error('Error creating conversation:', createError);
          return new Response(
            JSON.stringify({
              error: 'Failed to create conversation',
              details: createError.message,
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Continue with empty conversation (no messages yet)
      } else {
        console.error('Conversation query error:', convError);
        return new Response(
          JSON.stringify({
            error: 'Failed to fetch conversation',
            details: convError.message,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Save user message first
    const { error: userMessageError } = await supabase.from('messages').insert({
      conversation_id,
      role: 'user',
      content: message,
    });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      return new Response(JSON.stringify({ error: 'Failed to save message' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process market context
    let marketContext = '';
    let directMarketResponse: {
      response: string;
      metadata: Record<string, unknown>;
    } | null = null;

    if (includeMarketData) {
      try {
        const marketResponse =
          await chatMarketIntegrationService.processMessage(message);

        // Se o market response já contém uma análise completa (ex: símbolos brasileiros via intelligent-market),
        // retornar diretamente sem reprocessar no DeepSeek
        if (
          marketResponse.response &&
          marketResponse.metadata.model === 'intelligent-market'
        ) {
          directMarketResponse = marketResponse;
        } else if (
          marketResponse.metadata.symbols &&
          marketResponse.metadata.symbols.length > 0
        ) {
          marketContext = `Símbolos mencionados: ${marketResponse.metadata.symbols.join(', ')}`;
        }
      } catch (error) {
        console.error('Market context error:', error);
      }
    }

    // Se temos uma resposta direta do market analysis, retorná-la imediatamente
    if (directMarketResponse) {
      // Create readable stream for direct market response
      const encoder = new TextEncoder();
      const assistantMessageId = generateUUID();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'start',
                  message: 'Análise de mercado processada...',
                })}\n\n`
              )
            );

            // Send the market analysis content directly
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'content',
                  content: directMarketResponse.response,
                  messageId: assistantMessageId,
                })}\n\n`
              )
            );

            // Send final event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'done',
                  metadata: directMarketResponse.metadata,
                  messageId: assistantMessageId,
                })}\n\n`
              )
            );

            // Save complete assistant message
            const { error: aiMessageError } = await supabase
              .from('messages')
              .insert({
                id: assistantMessageId,
                conversation_id,
                role: 'assistant',
                content: directMarketResponse.response,
                metadata: directMarketResponse.metadata
                  ? JSON.parse(JSON.stringify(directMarketResponse.metadata))
                  : null,
              });

            if (aiMessageError) {
              console.error('Error saving AI message:', aiMessageError);
            }

            // Update conversation timestamp
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversation_id)
              .eq('user_id', user.id);
          } catch (error) {
            console.error('Direct market response error:', error);

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Erro na análise de mercado',
                })}\n\n`
              )
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Get conversation history for AI context
    const conversationHistory = deepSeekService.convertToDeepSeekMessages(
      conversation?.messages?.map(msg => ({
        role: msg.role,
        content: msg.content,
      })) || []
    );

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    let assistantMessageId: string;
    let accumulatedContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'start',
                message: 'Processando sua pergunta...',
              })}\n\n`
            )
          );

          // Create placeholder for assistant message
          assistantMessageId = generateUUID();

          // Stream from DeepSeek, including files if provided
          const streamGenerator = deepSeekService.processChatMessageStream(
            message,
            conversationHistory,
            marketContext,
            '',
            files.length > 0 ? files : undefined
          );

          for await (const chunk of streamGenerator) {
            if (chunk.done) {
              // Final event with metadata
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'done',
                    metadata: chunk.metadata,
                    messageId: assistantMessageId,
                  })}\n\n`
                )
              );

              // Save complete assistant message
              const { error: aiMessageError } = await supabase
                .from('messages')
                .insert({
                  id: assistantMessageId,
                  conversation_id,
                  role: 'assistant',
                  content: accumulatedContent,
                  metadata: chunk.metadata
                    ? JSON.parse(JSON.stringify(chunk.metadata))
                    : null,
                });

              if (aiMessageError) {
                console.error('Error saving AI message:', aiMessageError);
              }

              // Update conversation timestamp
              await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversation_id)
                .eq('user_id', user.id);

              break;
            } else {
              // Stream content chunk
              accumulatedContent += chunk.content;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'content',
                    content: chunk.content,
                    messageId: assistantMessageId,
                  })}\n\n`
                )
              );
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error:
                  error instanceof Error ? error.message : 'Erro desconhecido',
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Stream chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Health check for streaming
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      streaming: true,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
