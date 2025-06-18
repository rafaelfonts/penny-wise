'use client';

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useChatStoreClient } from '@/hooks/use-chat-store';
import { ChatInput } from './chat-input';
import { ChatMessage } from './message';
import { ChatErrorHandler, NetworkStatus } from './error-handler';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Memoized conversation item component
const ConversationItem = memo(
  ({
    conversation,
    isActive,
    onSelect,
    onDelete,
  }: {
    conversation: {
      id: string;
      title?: string;
      messages?: Array<{ content: string; role: string }>;
      pinned?: boolean;
      updated_at: string;
    };
    isActive: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const handleSelect = useCallback(() => {
      onSelect(conversation.id);
    }, [conversation.id, onSelect]);

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(conversation.id);
      },
      [conversation.id, onDelete]
    );

    const title = useMemo(() => {
      return (
        conversation.title ||
        conversation.messages?.[0]?.content?.slice(0, 50) + '...' ||
        'Nova conversa'
      );
    }, [conversation.title, conversation.messages]);

    const lastMessage = useMemo(() => {
      const messages = conversation.messages || [];
      return messages[messages.length - 1];
    }, [conversation.messages]);

    const messageCount = useMemo(() => {
      return conversation.messages?.length || 0;
    }, [conversation.messages]);

    return (
      <div
        onClick={handleSelect}
        className={cn(
          'group cursor-pointer rounded-lg p-3 transition-colors',
          isActive
            ? 'border border-blue-200 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {title}
              </h3>
              {conversation.pinned && (
                <Pin className="h-3 w-3 flex-shrink-0 text-blue-500" />
              )}
            </div>

            {lastMessage && (
              <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                {lastMessage.role === 'user' ? 'Você: ' : 'IA: '}
                {lastMessage.content.slice(0, 60)}...
              </p>
            )}

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {messageCount} mensagens
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(conversation.updated_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <Button
            onClick={handleDelete}
            size="sm"
            variant="ghost"
            className="ml-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            title="Excluir conversa"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }
);

ConversationItem.displayName = 'ConversationItem';

// Memoized sidebar component
const ChatSidebar = memo(
  ({
    conversations,
    currentConversationId,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
  }: {
    conversations: Array<{
      id: string;
      title?: string;
      messages?: Array<{ content: string; role: string }>;
      pinned?: boolean;
      updated_at: string;
    }>;
    currentConversationId: string | null;
    onNewChat: () => void;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
  }) => {
    return (
      <div className="flex w-80 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Penny Wise Chat
            </h1>
            <Button
              onClick={onNewChat}
              size="sm"
              className="h-8 w-8 p-0"
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Análise financeira com IA
          </p>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {conversations.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs">Clique em + para começar</p>
              </div>
            ) : (
              conversations.map(conversation => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversationId === conversation.id}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

ChatSidebar.displayName = 'ChatSidebar';

// Memoized loading component
const LoadingSpinner = memo(({ message }: { message: string }) => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized messages list component
const MessagesList = memo(
  ({
    messages,
    isStreaming,
  }: {
    messages: Array<{
      id: string;
      content: string;
      role: 'user' | 'assistant';
      timestamp: string;
    }>;
    isStreaming: boolean;
  }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, isStreaming]);

    return (
      <ScrollArea className="flex-1 p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <h3 className="mb-2 text-lg font-medium">
                Bem-vindo ao Penny Wise!
              </h3>
              <p className="mx-auto max-w-md text-sm">
                Faça perguntas sobre investimentos, análise de ações, mercado
                financeiro e muito mais.
              </p>
            </div>
          ) : (
            messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    );
  }
);

MessagesList.displayName = 'MessagesList';

export function OptimizedChatInterface() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    currentConversationId,
    conversations,
    isStreaming,
    error,
    createNewConversation,
    setCurrentConversation,
    deleteConversation,
    clearCurrentConversation,
    loadConversations,
    cleanupEmptyConversations,
    setError,
  } = useChatStoreClient();

  // Memoized current conversation
  const currentConversation = useMemo(
    () => conversations.find(c => c.id === currentConversationId),
    [conversations, currentConversationId]
  );

  // Memoized messages
  const messages = useMemo(
    () => currentConversation?.messages || [],
    [currentConversation?.messages]
  );

  // Authentication check with useCallback
  const checkAuth = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login?redirect=/chat');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth/login?redirect=/chat');
    } finally {
      setIsAuthLoading(false);
    }
  }, [router, supabase.auth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize chat with better error handling and cleanup
  const initializeChat = useCallback(
    async (signal: AbortSignal) => {
      try {
        if (signal.aborted) return;

        await loadConversations();

        if (signal.aborted) return;

        try {
          await cleanupEmptyConversations();
        } catch (cleanupError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Non-critical cleanup error:', cleanupError);
          }
        }
      } catch (error) {
        if (!signal.aborted && process.env.NODE_ENV === 'development') {
          console.error('Error initializing chat:', error);
        }
      }
    },
    [loadConversations, cleanupEmptyConversations]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();

    // Use requestIdleCallback for better performance
    const scheduleInit = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          if (!controller.signal.aborted) {
            initializeChat(controller.signal);
          }
        });
      } else {
        setTimeout(() => {
          if (!controller.signal.aborted) {
            initializeChat(controller.signal);
          }
        }, 100);
      }
    };

    scheduleInit();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, initializeChat]);

  // Memoized event handlers
  const handleNewChat = useCallback(async () => {
    await createNewConversation();
  }, [createNewConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setCurrentConversation(id);
    },
    [setCurrentConversation]
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
    },
    [deleteConversation]
  );

  const handleClearChat = useCallback(() => {
    if (currentConversationId) {
      clearCurrentConversation();
    }
  }, [currentConversationId, clearCurrentConversation]);

  // Show loading while checking authentication
  if (isAuthLoading) {
    return <LoadingSpinner message="Verificando autenticação..." />;
  }

  // Show redirect message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 animate-pulse text-blue-600">
            <MessageSquare className="mx-auto h-12 w-12" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecionando para login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Chat Header */}
        {currentConversation && (
          <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentConversation.title || 'Nova Conversa'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {messages.length} mensagens
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NetworkStatus />
                <Button
                  onClick={handleClearChat}
                  size="sm"
                  variant="outline"
                  title="Limpar conversa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <MessagesList messages={messages} isStreaming={isStreaming} />

        {/* Error Handler */}
        {error && (
          <ChatErrorHandler error={error} onRetry={() => setError(null)} />
        )}

        {/* Chat Input */}
        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-4xl">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
}
