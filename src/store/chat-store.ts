import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import {
  createChatError,
  type ChatError,
} from '@/components/chat/error-handler';
import { generateUUID } from '@/lib/utils/uuid';
import { executeCommand, isCommand } from '@/lib/services/chat-commands';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    tokens?: number;
    model?: string;
    processing_time?: number;
    isEnhanced?: boolean;
    isCommand?: boolean;
    commandType?: 'success' | 'error' | 'info';
    commandData?: unknown;
    marketContext?: {
      symbols: string[];
      prices: Record<string, number>;
      changes: Record<string, number>;
      changePercents: Record<string, number>;
      volume: Record<string, number>;
      lastUpdated: string;
      source: string;
    };
    executedCommands?: {
      alerts: unknown[];
      analysis: unknown[];
      portfolio: unknown[];
    };
  };
}

export interface Conversation {
  id: string;
  title: string;
  description?: string;
  messages: Message[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatState {
  // Current state
  currentConversationId: string | null;
  conversations: Conversation[];
  isLoading: boolean;
  isStreaming: boolean;
  error: ChatError | string | null;

  // UI state
  sidebarOpen: boolean;

  // Actions
  setCurrentConversation: (id: string) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => Promise<void>;

  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    content: string
  ) => void;

  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: ChatError | string | null) => void;
  setSidebarOpen: (open: boolean) => void;

  // Chat actions
  sendMessage: (content: string) => Promise<void>;
  sendMessageStream: (content: string) => Promise<void>;
  createNewConversation: () => Promise<string>;
  clearCurrentConversation: () => void;

  // Streaming state management
  streamingMessageId: string | null;
  setStreamingMessageId: (id: string | null) => void;
  appendToStreamingMessage: (content: string) => void;
  finalizeStreamingMessage: (
    messageId: string,
    metadata?: Record<string, unknown>
  ) => void;

  // Persistence actions
  loadConversations: () => Promise<void>;
  syncConversation: (conversation: Conversation) => Promise<void>;
  cleanupEmptyConversations: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  currentConversationId: null,
  conversations: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  sidebarOpen: true,
  streamingMessageId: null,

  // Basic setters
  setCurrentConversation: id => set({ currentConversationId: id }),
  setLoading: loading => set({ isLoading: loading }),
  setStreaming: streaming => set({ isStreaming: streaming }),
  setError: error => set({ error }),
  setSidebarOpen: open => set({ sidebarOpen: open }),

  // Conversation management
  addConversation: conversation =>
    set(state => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    })),

  deleteConversation: async id => {
    try {
      // Delete from database first
      const supabase = createClient();
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting conversation from database:', error);
        // Continue with local deletion anyway
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }

    // Remove from local state
    set(state => ({
      conversations: state.conversations.filter(conv => conv.id !== id),
      currentConversationId:
        state.currentConversationId === id ? null : state.currentConversationId,
    }));
  },

  // Message management
  addMessage: (conversationId, message) => {
    // Update local state immediately
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      ),
    }));

    // Persist to database asynchronously
    const persistMessage = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.warn('No user found when trying to persist message');
          return;
        }

        // Check if conversation exists in database
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .single();

        // Create conversation if it doesn't exist
        if (!conversation) {
          await supabase.from('conversations').insert({
            id: conversationId,
            user_id: user.id,
            title: 'Nova Conversa',
            is_pinned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Save message to database
        const { error } = await supabase.from('messages').insert({
          id: message.id,
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          metadata: message.metadata
            ? JSON.parse(JSON.stringify(message.metadata))
            : null,
          created_at: message.timestamp,
        });

        if (error) {
          console.error('Error persisting message:', error);
        }

        // Update conversation timestamp and title if it's a user message and conversation is new
        const updateData: { updated_at: string; title?: string } = {
          updated_at: new Date().toISOString(),
        };

        if (message.role === 'user') {
          // Check if this is the first message to update title
          const { data: existingMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .limit(2);

          if (existingMessages && existingMessages.length === 1) {
            // This is the first message, update title
            const title =
              message.content.length > 50
                ? message.content.substring(0, 47) + '...'
                : message.content;
            updateData.title = title;
          }
        }

        await supabase
          .from('conversations')
          .update(updateData)
          .eq('id', conversationId)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error in persistMessage:', error);
      }
    };

    // Don't await - let it run in background
    persistMessage();
  },

  updateMessage: (conversationId, messageId, content) =>
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === messageId ? { ...msg, content } : msg
              ),
            }
          : conv
      ),
    })),

  // Chat actions
  createNewConversation: async () => {
    // Check if there's already an empty conversation
    const { conversations, currentConversationId } = get();
    const currentConv = conversations.find(c => c.id === currentConversationId);

    // If current conversation is empty, don't create a new one
    if (currentConv && currentConv.messages.length === 0) {
      return currentConv.id;
    }

    // Check if there are any other empty conversations
    const emptyConv = conversations.find(c => c.messages.length === 0);
    if (emptyConv) {
      // Use existing empty conversation
      get().setCurrentConversation(emptyConv.id);
      return emptyConv.id;
    }

    const newConversation: Conversation = {
      id: generateUUID(),
      title: 'Nova Conversa',
      messages: [],
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to database immediately
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from('conversations').insert({
          id: newConversation.id,
          user_id: user.id,
          title: newConversation.title,
          description: newConversation.description,
          is_pinned: newConversation.is_pinned,
          created_at: newConversation.created_at,
          updated_at: newConversation.updated_at,
        });

        if (error) {
          console.error('Error creating conversation in database:', error);
          // Continue anyway - will be created on first message
        }
      }
    } catch (error) {
      console.error('Error saving new conversation:', error);
      // Continue anyway - will be created on first message
    }

    get().addConversation(newConversation);
    get().setCurrentConversation(newConversation.id);

    return newConversation.id;
  },

  clearCurrentConversation: () => {
    const { currentConversationId } = get();
    if (currentConversationId) {
      get().updateConversation(currentConversationId, { messages: [] });
    }
  },

  sendMessage: async (content: string) => {
    const { currentConversationId, addMessage, setLoading, setError } = get();

    if (!currentConversationId) {
      setError('Nenhuma conversa selecionada');
      return;
    }

    // Check if this is a command
    if (isCommand(content)) {
      try {
        setLoading(true);
        setError(null);

        // Get user ID for commands that need authentication
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const result = await executeCommand(content, user?.id);

        if (result) {
          // Add user message
          const userMessage: Message = {
            id: generateUUID(),
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
          };
          addMessage(currentConversationId, userMessage);

          // Add command result as assistant message
          const assistantMessage: Message = {
            id: generateUUID(),
            role: 'assistant',
            content: result.content,
            timestamp: new Date().toISOString(),
            metadata: {
              isCommand: true,
              commandType: result.type,
              commandData: result.data,
            },
          };
          addMessage(currentConversationId, assistantMessage);

          return;
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Erro ao executar comando'
        );
        return;
      } finally {
        setLoading(false);
      }
    }

    // Add user message
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    addMessage(currentConversationId, userMessage);
    setLoading(true);
    setError(null);

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
          executeCommands: true,
        }),
      });

      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json();

        // Add assistant response with enhanced data
        const assistantMessage: Message = {
          id: generateUUID(),
          role: 'assistant',
          content: enhancedData.response,
          timestamp: new Date().toISOString(),
          metadata: {
            ...enhancedData.metadata,
            marketContext: enhancedData.marketContext,
            executedCommands: enhancedData.executedCommands,
            isEnhanced: true,
          },
        };

        addMessage(currentConversationId, assistantMessage);
        return;
      }

      // Fallback to regular API if enhanced fails
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversation_id: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: data.metadata,
      };

      addMessage(currentConversationId, assistantMessage);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  },

  // Persistence functions
  loadConversations: async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(
          `
          id,
          title,
          description,
          is_pinned,
          created_at,
          updated_at,
          messages (
            id,
            role,
            content,
            metadata,
            created_at
          )
        `
        )
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      // Transform to store format
      const formattedConversations: Conversation[] = conversations.map(
        conv => ({
          id: conv.id,
          title: conv.title || 'Nova Conversa',
          description: conv.description || undefined,
          is_pinned: conv.is_pinned || false,
          created_at: conv.created_at || new Date().toISOString(),
          updated_at: conv.updated_at || new Date().toISOString(),
          messages: conv.messages
            .map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: msg.created_at || new Date().toISOString(),
              metadata: msg.metadata
                ? (msg.metadata as Message['metadata'])
                : undefined,
            }))
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            ),
        })
      );

      set({ conversations: formattedConversations });
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  },

  syncConversation: async (conversation: Conversation) => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if conversation exists in database
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversation.id)
        .single();

      if (!existingConv) {
        // Create new conversation
        const { error: convError } = await supabase
          .from('conversations')
          .insert({
            id: conversation.id,
            user_id: user.id,
            title: conversation.title,
            description: conversation.description,
            is_pinned: conversation.is_pinned,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
          });

        if (convError) {
          console.error('Error creating conversation:', convError);
          return;
        }
      } else {
        // Update existing conversation
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            title: conversation.title,
            description: conversation.description,
            is_pinned: conversation.is_pinned,
            updated_at: conversation.updated_at,
          })
          .eq('id', conversation.id);

        if (updateError) {
          console.error('Error updating conversation:', updateError);
          return;
        }
      }
    } catch (error) {
      console.error('Error syncing conversation:', error);
    }
  },

  // Streaming functions
  setStreamingMessageId: id => set({ streamingMessageId: id }),

  appendToStreamingMessage: content => {
    const { currentConversationId, streamingMessageId } = get();
    if (!currentConversationId || !streamingMessageId) return;

    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === streamingMessageId
                  ? { ...msg, content: msg.content + content }
                  : msg
              ),
            }
          : conv
      ),
    }));
  },

  finalizeStreamingMessage: (messageId, metadata) => {
    const { currentConversationId } = get();
    if (!currentConversationId) return;

    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === messageId ? { ...msg, metadata } : msg
              ),
            }
          : conv
      ),
      streamingMessageId: null,
      isStreaming: false,
    }));
  },

  sendMessageStream: async (content: string) => {
    const {
      currentConversationId,
      addMessage,
      setStreaming,
      setError,
      setStreamingMessageId,
      appendToStreamingMessage,
      finalizeStreamingMessage,
    } = get();

    if (!currentConversationId) {
      setError('Nenhuma conversa selecionada');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    addMessage(currentConversationId, userMessage);
    setStreaming(true);
    setError(null);

    // Create placeholder assistant message
    const assistantMessageId = generateUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      metadata: { processing_time: 0 },
    };

    addMessage(currentConversationId, assistantMessage);
    setStreamingMessageId(assistantMessageId);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversation_id: currentConversationId,
          includeMarketData: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar mensagem');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream não disponível');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'start':
                  // Message started processing
                  break;
                case 'content':
                  appendToStreamingMessage(data.content);
                  break;
                case 'done':
                  finalizeStreamingMessage(assistantMessageId, data.metadata);
                  break;
                case 'error':
                  setError(data.error);
                  setStreaming(false);
                  setStreamingMessageId(null);
                  break;
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      let errorType: ChatError['type'] = 'streaming';
      let errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      // Categorize error types
      if (
        errorMessage.includes('Sessão expirada') ||
        errorMessage.includes('Unauthorized')
      ) {
        errorType = 'auth';
        errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
      } else if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Network')
      ) {
        errorType = 'network';
        errorMessage = 'Problema de conexão. Verifique sua internet.';
      }

      const chatError = createChatError(
        errorType,
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        errorType !== 'auth' // Auth errors usually need manual intervention
      );
      setError(chatError);
      setStreaming(false);
      setStreamingMessageId(null);
    }
  },

  // Cleanup empty conversations
  cleanupEmptyConversations: async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Silently clear local state if no user
        set({
          conversations: [],
          currentConversationId: null,
        });
        return;
      }

      // Delete conversations with no messages from database (older than 5 minutes to avoid race conditions)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Only delete if older than 5 minutes
        .not(
          'id',
          'in',
          `(SELECT DISTINCT conversation_id FROM messages WHERE conversation_id IS NOT NULL)`
        );

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (OK)
        if (process.env.NODE_ENV === 'development') {
          console.warn('Cleanup warning:', error.message);
        }
        return; // Don't proceed if database error
      }

      // Reload conversations but avoid calling cleanup again to prevent recursion
      const { data: conversations, error: loadError } = await supabase
        .from('conversations')
        .select(
          `
          id,
          title,
          description,
          is_pinned,
          created_at,
          updated_at,
          messages (
            id,
            role,
            content,
            metadata,
            created_at
          )
        `
        )
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (loadError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error reloading conversations:', loadError.message);
        }
        return;
      }

      // Transform to store format
      const formattedConversations: Conversation[] = conversations.map(
        conv => ({
          id: conv.id,
          title: conv.title || 'Nova Conversa',
          description: conv.description || undefined,
          is_pinned: conv.is_pinned || false,
          created_at: conv.created_at || new Date().toISOString(),
          updated_at: conv.updated_at || new Date().toISOString(),
          messages: conv.messages
            .map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: msg.created_at || new Date().toISOString(),
              metadata: msg.metadata
                ? (msg.metadata as Message['metadata'])
                : undefined,
            }))
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            ),
        })
      );

      set({ conversations: formattedConversations });
    } catch (error) {
      // Silently handle cleanup errors to prevent UI disruption
      if (process.env.NODE_ENV === 'development' && error instanceof Error) {
        console.warn('Cleanup function warning:', error.message);
      }
      // On error, don't clear state to prevent data loss
    }
  },
}));
