import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    tokens?: number
    model?: string
    processing_time?: number
    isEnhanced?: boolean
    marketContext?: {
      symbols: string[]
      prices: Record<string, number>
      changes: Record<string, number>
      changePercents: Record<string, number>
      volume: Record<string, number>
      lastUpdated: string
      source: string
    }
    executedCommands?: {
      alerts: unknown[]
      analysis: unknown[]
      portfolio: unknown[]
    }
  }
}

export interface Conversation {
  id: string
  title: string
  description?: string
  messages: Message[]
  is_pinned: boolean
  created_at: string
  updated_at: string
}

interface ChatState {
  // Current state
  currentConversationId: string | null
  conversations: Conversation[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  
  // UI state
  sidebarOpen: boolean
  
  // Actions
  setCurrentConversation: (id: string) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, content: string) => void
  
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
  setSidebarOpen: (open: boolean) => void
  
  // Chat actions
  sendMessage: (content: string) => Promise<void>
  createNewConversation: () => string
  clearCurrentConversation: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  currentConversationId: null,
  conversations: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  sidebarOpen: true,
  
  // Basic setters
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setError: (error) => set({ error }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Conversation management
  addConversation: (conversation) => 
    set((state) => ({ 
      conversations: [conversation, ...state.conversations] 
    })),
    
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.id === id ? { ...conv, ...updates } : conv
      )
    })),
    
  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter(conv => conv.id !== id),
      currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
    })),
  
  // Message management
  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      )
    })),
    
  updateMessage: (conversationId, messageId, content) =>
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === messageId ? { ...msg, content } : msg
              )
            }
          : conv
      )
    })),
  
  // Chat actions
  createNewConversation: () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'Nova Conversa',
      messages: [],
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    get().addConversation(newConversation)
    get().setCurrentConversation(newConversation.id)
    
    return newConversation.id
  },
  
  clearCurrentConversation: () => {
    const { currentConversationId } = get()
    if (currentConversationId) {
      get().updateConversation(currentConversationId, { messages: [] })
    }
  },
  
  sendMessage: async (content: string) => {
    const { currentConversationId, addMessage, setLoading, setError } = get()
    
    if (!currentConversationId) {
      setError('Nenhuma conversa selecionada')
      return
    }
    
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    
    addMessage(currentConversationId, userMessage)
    setLoading(true)
    setError(null)
    
    try {
      // Try enhanced API first (Day 6 feature)
      const enhancedResponse = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId: currentConversationId,
          includeMarketData: true,
          executeCommands: true
        })
      })
      
      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json()
        
        // Add assistant response with enhanced data
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: enhancedData.response,
          timestamp: new Date().toISOString(),
          metadata: {
            ...enhancedData.metadata,
            marketContext: enhancedData.marketContext,
            executedCommands: enhancedData.executedCommands,
            isEnhanced: true
          }
        }
        
        addMessage(currentConversationId, assistantMessage)
        return
      }
      
      // Fallback to regular API if enhanced fails
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversation_id: currentConversationId
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }
      
      const data = await response.json()
      
      // Add assistant response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: data.metadata
      }
      
      addMessage(currentConversationId, assistantMessage)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }
})) 