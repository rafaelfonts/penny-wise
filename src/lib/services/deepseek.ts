// ==========================================
// DEEPSEEK API SERVICE - Day 6 Implementation
// ==========================================

import OpenAI from 'openai'

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekResponse {
  response: string
  metadata: {
    model: string
    tokens: number
    processing_time: number
    finish_reason: string
  }
}

export interface DeepSeekStreamResponse {
  content: string
  done: boolean
  metadata?: {
    model: string
    tokens: number
    processing_time: number
    finish_reason: string
  }
}

class DeepSeekService {
  private client: OpenAI
  private readonly model = 'deepseek-chat'
  private readonly maxTokens = 4000
  private readonly temperature = 0.7

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL + '/v1'
    })
  }

  /**
   * Generate a complete response from DeepSeek
   */
  async generateResponse(
    messages: DeepSeekMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
      stream?: false
    }
  ): Promise<DeepSeekResponse> {
    const startTime = Date.now()

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        stream: false
      })

      const response = completion.choices[0]?.message?.content || ''
      const processingTime = Date.now() - startTime

      return {
        response,
        metadata: {
          model: this.model,
          tokens: completion.usage?.total_tokens || 0,
          processing_time: processingTime,
          finish_reason: completion.choices[0]?.finish_reason || 'unknown'
        }
      }
    } catch (error) {
      console.error('DeepSeek API error:', error)
      throw new Error(`DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a streaming response from DeepSeek
   */
  async *generateStreamingResponse(
    messages: DeepSeekMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): AsyncGenerator<DeepSeekStreamResponse, void, unknown> {
    const startTime = Date.now()

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        stream: true
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        
        if (delta) {
          yield {
            content: delta,
            done: false
          }
        }

        // Handle finish
        if (chunk.choices[0]?.finish_reason) {
          const processingTime = Date.now() - startTime
          
          yield {
            content: '',
            done: true,
            metadata: {
              model: this.model,
              tokens: 0, // Note: Streaming doesn't provide token count
              processing_time: processingTime,
              finish_reason: chunk.choices[0].finish_reason
            }
          }
        }
      }
    } catch (error) {
      console.error('DeepSeek streaming error:', error)
      throw new Error(`DeepSeek streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process a chat message with financial context
   */
  async processChatMessage(
    userMessage: string,
    conversationHistory: DeepSeekMessage[] = [],
    marketContext?: string,
    commandsContext?: string
  ): Promise<DeepSeekResponse> {
    // Check for analyze commands and process them with intelligent market service
    if (userMessage.toLowerCase().includes('/analyze ')) {
      const symbolMatch = userMessage.match(/\/analyze\s+([A-Z0-9.]+)/i)
      if (symbolMatch) {
        const symbol = symbolMatch[1]
        try {
          const intelligentMarket = await import('./intelligent-market')
          const analysis = await intelligentMarket.intelligentMarket.analyzeSymbol(symbol)
          
          return {
            response: analysis,
            metadata: {
              model: 'intelligent-market-analysis',
              tokens: 0,
              processing_time: 150,
              finish_reason: 'stop'
            }
          }
        } catch (error) {
          console.error('Error in intelligent market analysis:', error)
          // Fall through to regular processing
        }
      }
    }

    const systemPrompt = this.buildFinancialSystemPrompt(marketContext, commandsContext)
    
    const messages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userMessage }
    ]

    return this.generateResponse(messages)
  }

  /**
   * Process a chat message with streaming response
   */
  async *processChatMessageStream(
    userMessage: string,
    conversationHistory: DeepSeekMessage[] = [],
    marketContext?: string,
    commandsContext?: string
  ): AsyncGenerator<DeepSeekStreamResponse, void, unknown> {
    const systemPrompt = this.buildFinancialSystemPrompt(marketContext, commandsContext)
    
    const messages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userMessage }
    ]

    yield* this.generateStreamingResponse(messages)
  }

  /**
   * Build specialized system prompt for financial chat
   */
  private buildFinancialSystemPrompt(marketContext?: string, commandsContext?: string): string {
    let prompt = `Você é o Penny Wise, um assistente financeiro inteligente especializado no mercado brasileiro.

CARACTERÍSTICAS:
- Especialista em ações brasileiras (B3), fundos, renda fixa e criptomoedas
- Fornece análises técnicas e fundamentalistas precisas
- Linguagem profissional mas acessível
- Sempre contextualiza dados com data e fonte
- Sugere comandos relevantes quando apropriado

IMPORTANTE: 
- NUNCA use placeholders como "[inserir valor]" ou templates genéricos
- Se não houver dados reais, informe claramente que os dados não estão disponíveis
- Para empresas brasileiras (PETR4, VALE3, etc.), indique se OpLab não está configurado

COMANDOS DISPONÍVEIS:
- /analyze [SÍMBOLO] - Análise técnica e fundamentalista
- /compare [SYM1] [SYM2] - Comparação entre ativos
- /portfolio - Análise do portfólio
- /alert [SÍMBOLO] [CONDIÇÃO] [VALOR] - Criar alertas
- /help - Ajuda completa

DIRETRIZES:
1. Use dados reais quando fornecidos no contexto
2. Indique claramente quando são estimativas ou dados históricos
3. Forneça sempre disclaimers apropriados sobre investimentos
4. Sugira próximos passos ou análises complementares
5. Use emojis financeiros para melhor visualização (📈📉💹📊🎯)

FORMATO DE RESPOSTA:
- Resposta direta e objetiva
- Dados organizados em tópicos/bullets
- Conclusões claras e actionables
- Próximos passos sugeridos`

    if (marketContext) {
      prompt += `\n\nCONTEXTO DE MERCADO ATUAL:\n${marketContext}`
    }

    if (commandsContext) {
      prompt += `\n\nCOMANDOS EXECUTADOS:\n${commandsContext}`
    }

    prompt += `\n\nLembre-se: Investimentos envolvem risco. Esta é uma análise educacional, não uma recomendação de investimento.`

    return prompt
  }

  /**
   * Convert conversation messages to DeepSeek format
   */
  convertToDeepSeekMessages(messages: Array<{ role: string; content: string }>): DeepSeekMessage[] {
    return messages
      .filter(msg => ['user', 'assistant'].includes(msg.role))
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
  }

  /**
   * Summarize long conversation for context management
   */
  async summarizeConversation(messages: DeepSeekMessage[]): Promise<string> {
    if (messages.length <= 4) return ''

    const summaryMessages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'Resuma esta conversa de chat financeiro em 2-3 frases, mantendo os pontos-chave sobre investimentos, análises e decisões discutidas.'
      },
      ...messages.slice(0, -2), // All except last 2 messages
      {
        role: 'user',
        content: 'Resuma nossa conversa anterior mantendo o contexto financeiro relevante.'
      }
    ]

    const response = await this.generateResponse(summaryMessages, { maxTokens: 200 })
    return response.response
  }

  /**
   * Check if API is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.generateResponse([
        { role: 'user', content: 'Hello' }
      ], { maxTokens: 10 })
      
      return !!response.response
    } catch (error) {
      console.error('DeepSeek health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const deepSeekService = new DeepSeekService()
export default deepSeekService 