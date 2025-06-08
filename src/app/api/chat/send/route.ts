import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import chatMarketIntegrationService from '@/lib/services/chat-market-integration'

// Mock DeepSeek API client for now - will be replaced with actual implementation
const mockDeepSeekResponse = async (message: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Default intelligent response for non-market queries
  return {
    response: `Entendo sua pergunta sobre "${message}".

Como assistente especializado em análise financeira, posso ajudar com:

🔍 **Análise de Ativos**: Análise técnica e fundamentalista
📊 **Comparações**: Entre diferentes investimentos  
📈 **Tendências**: Interpretação de movimentos do mercado
💡 **Educação**: Explicações sobre conceitos financeiros

Você pode fazer perguntas específicas ou usar comandos como:
- \`/analyze PETR4\` para análise de ações
- \`/compare VALE3 ITUB4\` para comparações
- \`/help\` para ver todos os comandos

Como posso ajudar com sua estratégia de investimentos?`,
    metadata: {
      model: 'deepseek-v3',
      tokens: 124,
      processing_time: 1200
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message, conversation_id } = body

    if (!message || !conversation_id) {
      return NextResponse.json(
        { error: 'Message and conversation_id are required' },
        { status: 400 }
      )
    }

    // Get conversation history for context
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('id', conversation_id)
      .eq('user_id', session.user.id)
      .single()

    if (convError) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Save user message
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        role: 'user',
        content: message,
        user_id: session.user.id
      })

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Try to process with market integration first
    let aiResponse: { response: string; metadata?: Record<string, unknown> }
    
    try {
      const marketResponse = await chatMarketIntegrationService.processMessage(message)
      
      // Se o serviço de mercado processou com sucesso (comando ou símbolo detectado)
      if (marketResponse.metadata.command || (marketResponse.metadata.symbols && marketResponse.metadata.symbols.length > 0)) {
        aiResponse = {
          response: marketResponse.response,
          metadata: {
            model: marketResponse.metadata.model,
            tokens: marketResponse.metadata.tokens,
            processing_time: marketResponse.metadata.processing_time,
            market_data: true,
            command: marketResponse.metadata.command,
            symbols: marketResponse.metadata.symbols,
            follow_up: marketResponse.followUp
          }
        }
      } else {
        // Se não foi um comando de mercado, usar resposta padrão
        aiResponse = await mockDeepSeekResponse(message)
        aiResponse.metadata = {
          ...aiResponse.metadata,
          market_data: false
        }
      }
    } catch (marketError) {
      console.error('Market integration error:', marketError)
      // Fallback para resposta padrão em caso de erro
      aiResponse = await mockDeepSeekResponse(message)
      aiResponse.metadata = {
        ...aiResponse.metadata,
        market_data: false,
        market_error: marketError instanceof Error ? marketError.message : 'Unknown error'
      }
    }

    // Save AI response
    const { error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        role: 'assistant',
        content: aiResponse.response,
        metadata: aiResponse.metadata ? JSON.parse(JSON.stringify(aiResponse.metadata)) : null,
        user_id: session.user.id
      })

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError)
      return NextResponse.json(
        { error: 'Failed to save AI response' },
        { status: 500 }
      )
    }

    // Update conversation title if it's the first message
    if (conversation.messages.length === 0) {
      const title = message.length > 50 
        ? message.substring(0, 47) + '...'
        : message

      await supabase
        .from('conversations')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation_id)
        .eq('user_id', session.user.id)
    } else {
      // Just update the timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation_id)
        .eq('user_id', session.user.id)
    }

    return NextResponse.json({
      response: aiResponse.response,
      metadata: aiResponse.metadata
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 