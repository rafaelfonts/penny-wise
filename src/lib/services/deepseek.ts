// ==========================================
// DEEPSEEK API SERVICE - Day 6 Implementation
// ==========================================

import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
} from 'openai/resources/chat/completions';

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<DeepSeekMessageContent>;
}

export interface DeepSeekMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface FileUpload {
  name: string;
  type: string;
  size: number;
  content: string; // base64 encoded content
  url?: string;
}

export interface DeepSeekResponse {
  response: string;
  metadata: {
    model: string;
    tokens: number;
    processing_time: number;
    finish_reason: string;
  };
}

export interface DeepSeekStreamResponse {
  content: string;
  done: boolean;
  metadata?: {
    model: string;
    tokens: number;
    processing_time: number;
    finish_reason: string;
  };
}

class DeepSeekService {
  private client: OpenAI;
  private readonly model = 'deepseek-chat';
  private readonly maxTokens = 4000;
  private readonly temperature = 0.7;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL + '/v1',
    });
  }

  /**
   * Convert DeepSeek messages to OpenAI compatible format
   */
  private convertToOpenAIMessages(
    messages: DeepSeekMessage[]
  ): ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content,
        } as ChatCompletionMessageParam;
      } else {
        // Handle multimodal content
        const content: ChatCompletionContentPart[] = msg.content.map(part => {
          if (part.type === 'text') {
            return {
              type: 'text',
              text: part.text || '',
            };
          } else {
            return {
              type: 'image_url',
              image_url: {
                url: part.image_url?.url || '',
                detail: part.image_url?.detail || 'auto',
              },
            };
          }
        });

        return {
          role: msg.role,
          content,
        } as ChatCompletionMessageParam;
      }
    });
  }

  /**
   * Convert files to base64 format for DeepSeek API
   */
  async processFileUpload(file: File): Promise<FileUpload> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Content = result.split(',')[1]; // Remove data:mime;base64, prefix

        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64Content,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create multimodal message content from text and files
   */
  createMultimodalContent(
    text: string,
    files: FileUpload[] = []
  ): Array<DeepSeekMessageContent> {
    const content: Array<DeepSeekMessageContent> = [];

    // Start with user text if provided
    let combinedText = text.trim();

    // Process each file
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        // Add image files as image_url content
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${file.content}`,
            detail: 'high', // Use high detail for better analysis
          },
        });
      } else {
        // For text-based files, decode and include content
        try {
          const fileContent = this.decodeFileContent(file);
          const fileSection = `\n\n--- ARQUIVO: ${file.name} (${file.type}) ---\n${fileContent}\n--- FIM DO ARQUIVO ---\n`;
          combinedText += fileSection;
        } catch (error) {
          console.warn(`Failed to decode file ${file.name}:`, error);
          // Fallback to file info only
          const fileInfo = `\n\n[Arquivo: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB) - Não foi possível ler o conteúdo]`;
          combinedText += fileInfo;
        }
      }
    });

    // Add combined text content if there's any text
    if (combinedText.trim()) {
      content.unshift({
        type: 'text',
        text: combinedText.trim(),
      });
    }

    return content;
  }

  /**
   * Decode file content from base64 based on file type
   */
  private decodeFileContent(file: FileUpload): string {
    try {
      // For text-based files, decode from base64
      const textTypes = [
        'text/plain',
        'text/csv',
        'text/markdown',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
        'text/xml',
        'application/xml',
      ];

      if (textTypes.includes(file.type)) {
        // Decode base64 to text
        const decodedContent = atob(file.content);
        return decodedContent;
      } else {
        // For binary files like PDF, Word docs, etc., provide metadata
        return `[Arquivo binário: ${file.name} - Tipo: ${file.type} - Tamanho: ${Math.round(file.size / 1024)}KB]
        
Para arquivos como PDF, DOC, DOCX, XLS, PPT, é recomendado converter para texto ou extrair o conteúdo antes do upload para melhor análise.`;
      }
    } catch (error) {
      throw new Error(
        `Failed to decode file content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate file types and sizes according to DeepSeek documentation
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const supportedDocumentTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'text/xml',
      'application/xml',
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB as per DeepSeek documentation

    // Check file size
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Tamanho máximo: 10MB (atual: ${Math.round(file.size / (1024 * 1024))}MB)`,
      };
    }

    // Check file type
    const isImage = supportedImageTypes.includes(file.type);
    const isDocument = supportedDocumentTypes.includes(file.type);

    if (!isImage && !isDocument) {
      return {
        isValid: false,
        error: `Tipo de arquivo não suportado: ${file.type}. Formatos aceitos: JPEG, PNG, WebP, PDF, DOC, TXT, MD, CSV, entre outros.`,
      };
    }

    // Additional validation for images
    if (isImage && file.size > 5 * 1024 * 1024) {
      // 5MB for images
      return {
        isValid: false,
        error: 'Imagens devem ter no máximo 5MB',
      };
    }

    return { isValid: true };
  }

  /**
   * Generate a complete response from DeepSeek
   */
  async generateResponse(
    messages: DeepSeekMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: false;
    }
  ): Promise<DeepSeekResponse> {
    const startTime = Date.now();

    try {
      const openAIMessages = this.convertToOpenAIMessages(messages);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: openAIMessages,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;

      return {
        response,
        metadata: {
          model: this.model,
          tokens: completion.usage?.total_tokens || 0,
          processing_time: processingTime,
          finish_reason: completion.choices[0]?.finish_reason || 'unknown',
        },
      };
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw new Error(
        `DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate a streaming response from DeepSeek
   */
  async *generateStreamingResponse(
    messages: DeepSeekMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<DeepSeekStreamResponse, void, unknown> {
    const startTime = Date.now();

    try {
      const openAIMessages = this.convertToOpenAIMessages(messages);

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: openAIMessages,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';

        if (delta) {
          yield {
            content: delta,
            done: false,
          };
        }

        // Handle finish
        if (chunk.choices[0]?.finish_reason) {
          const processingTime = Date.now() - startTime;

          yield {
            content: '',
            done: true,
            metadata: {
              model: this.model,
              tokens: 0, // Note: Streaming doesn't provide token count
              processing_time: processingTime,
              finish_reason: chunk.choices[0].finish_reason,
            },
          };
        }
      }
    } catch (error) {
      console.error('DeepSeek streaming error:', error);
      throw new Error(
        `DeepSeek streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process a chat message with financial context and file support
   */
  async processChatMessage(
    userMessage: string,
    conversationHistory: DeepSeekMessage[] = [],
    marketContext?: string,
    commandsContext?: string,
    files: FileUpload[] = []
  ): Promise<DeepSeekResponse> {
    // Check for analyze commands and process them with intelligent market service
    if (userMessage.toLowerCase().includes('/analyze ')) {
      const symbolMatch = userMessage.match(/\/analyze\s+([A-Z0-9.]+)/i);
      if (symbolMatch) {
        const symbol = symbolMatch[1];
        try {
          const intelligentMarket = await import('./intelligent-market');
          const analysis =
            await intelligentMarket.intelligentMarket.analyzeSymbol(symbol);

          return {
            response: analysis,
            metadata: {
              model: 'intelligent-market-analysis',
              tokens: 0,
              processing_time: 150,
              finish_reason: 'stop',
            },
          };
        } catch (error) {
          console.error('Error in intelligent market analysis:', error);
          // Fall through to regular processing
        }
      }
    }

    const systemPrompt = this.buildFinancialSystemPrompt(
      marketContext,
      commandsContext,
      files.length > 0
    );

    // Create user message with multimodal content if files are present
    let userContent: string | Array<DeepSeekMessageContent>;
    if (files.length > 0) {
      userContent = this.createMultimodalContent(userMessage, files);
    } else {
      userContent = userMessage;
    }

    const messages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userContent },
    ];

    return this.generateResponse(messages);
  }

  /**
   * Process a chat message with streaming response and file support
   */
  async *processChatMessageStream(
    userMessage: string,
    conversationHistory: DeepSeekMessage[] = [],
    marketContext?: string,
    commandsContext?: string,
    files: FileUpload[] = []
  ): AsyncGenerator<DeepSeekStreamResponse, void, unknown> {
    const systemPrompt = this.buildFinancialSystemPrompt(
      marketContext,
      commandsContext,
      files.length > 0
    );

    // Create user message with multimodal content if files are present
    let userContent: string | Array<DeepSeekMessageContent>;
    if (files.length > 0) {
      userContent = this.createMultimodalContent(userMessage, files);
    } else {
      userContent = userMessage;
    }

    const messages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userContent },
    ];

    yield* this.generateStreamingResponse(messages);
  }

  /**
   * Build enhanced system prompt for financial AI assistant with file support
   */
  private buildFinancialSystemPrompt(
    marketContext?: string,
    commandsContext?: string,
    hasFiles?: boolean
  ): string {
    let systemPrompt = `Você é o Penny Wise, um assistente de IA especializado em mercado financeiro e investimentos. Sua função é ajudar usuários com:

- Análise de ações, índices e mercados financeiros
- Interpretação de dados de mercado e tendências
- Educação financeira e estratégias de investimento
- Análise técnica e fundamentalista
- Notícias e eventos que impactam o mercado`;

    if (hasFiles) {
      systemPrompt += `

CAPACIDADES MULTIMODAIS:
- Você pode analisar imagens, gráficos, tabelas e documentos enviados pelo usuário
- Para imagens de gráficos financeiros: identifique padrões, tendências, suporte/resistência
- Para documentos de texto (TXT, CSV, MD, JSON, XML): analise o conteúdo completo fornecido
- Para arquivos CSV: interprete dados tabulares, identifique trends e faça análises estatísticas
- Para arquivos JSON/XML: extraia estruturas de dados e forneça insights
- Para documentos financeiros: extraia informações relevantes e forneça análises detalhadas
- Para tabelas de dados: interprete números, calcule métricas e forneça insights financeiros
- Para arquivos binários (PDF, DOC, etc.): oriente sobre conversão para texto se necessário
- Sempre cite informações específicas dos arquivos em suas respostas
- Organize a resposta separando análises por arquivo quando múltiplos arquivos forem enviados`;
    }

    if (marketContext) {
      systemPrompt += `

CONTEXTO DE MERCADO ATUAL:
${marketContext}

Use essas informações para contextualizar suas respostas com dados atuais do mercado.`;
    }

    if (commandsContext) {
      systemPrompt += `

COMANDOS DISPONÍVEIS:
${commandsContext}

Quando apropriado, sugira comandos específicos que o usuário pode usar.`;
    }

    systemPrompt += `

DIRETRIZES:
- Mantenha respostas objetivas e fundamentadas em dados
- Sempre inclua avisos sobre riscos de investimento
- Use linguagem acessível mas tecnicamente precisa
- Forneça exemplos práticos quando relevante
- Nunca dê conselhos financeiros específicos, apenas educação e análise

Responda sempre em português brasileiro.`;

    return systemPrompt;
  }

  /**
   * Convert conversation history to DeepSeek message format
   */
  convertToDeepSeekMessages(
    messages: Array<{ role: string; content: string }>
  ): DeepSeekMessage[] {
    return messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));
  }

  /**
   * Summarize conversation for context management
   */
  async summarizeConversation(messages: DeepSeekMessage[]): Promise<string> {
    if (messages.length === 0) return '';

    const summaryMessages: DeepSeekMessage[] = [
      {
        role: 'system',
        content:
          'Resuma brevemente os pontos principais desta conversa sobre mercado financeiro em português, mantendo informações relevantes sobre análises, decisões e contexto.',
      },
      {
        role: 'user',
        content: `Resuma esta conversa: ${messages
          .map(
            m =>
              `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`
          )
          .join('\n')}`,
      },
    ];

    try {
      const response = await this.generateResponse(summaryMessages, {
        maxTokens: 500,
        temperature: 0.3,
      });
      return response.response;
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return 'Conversa sobre análise financeira e mercado.';
    }
  }

  /**
   * Health check for DeepSeek service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testMessages: DeepSeekMessage[] = [
        {
          role: 'user',
          content: 'Test message',
        },
      ];

      await this.generateResponse(testMessages, {
        maxTokens: 10,
        temperature: 0,
      });

      return true;
    } catch (error) {
      console.error('DeepSeek health check failed:', error);
      return false;
    }
  }
}

const deepSeekService = new DeepSeekService();
export default deepSeekService;
