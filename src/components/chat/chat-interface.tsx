'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useChatStoreClient } from '@/hooks/use-chat-store';
import { ChatInput } from './chat-input';
import { ChatMessage } from './message';
import { ChatErrorHandler, NetworkStatus } from './error-handler';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/store/chat-store';

export function ChatInterface() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const {
    currentConversationId,
    conversations,
    isLoading,
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentConversation = conversations.find(
    c => c.id === currentConversationId
  );

  // Simplified auth check using context instead of direct supabase calls
  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return;

    // If no user after loading completes, redirect to login
    if (!user) {
      console.debug('🔐 No authenticated user, redirecting to login');
      router.push('/auth/login?redirect=/chat');
      return;
    }

    console.debug('🔐 User authenticated, initializing chat');
  }, [user, authLoading, router]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Load conversations when user is authenticated and store is ready
  useEffect(() => {
    if (user && !isLoading && conversations.length === 0) {
      console.debug('🔄 Loading conversations for authenticated user');
      loadConversations();
    }
  }, [user, isLoading, conversations.length, loadConversations]);

  // Cleanup empty conversations periodically (less aggressive)
  useEffect(() => {
    if (!user) return;

    const cleanup = () => {
      // Only cleanup if we have conversations and page is visible
      if (conversations.length > 0 && document.visibilityState === 'visible') {
        cleanupEmptyConversations();
      }
    };

    // Run cleanup less frequently and only when page is active
    const interval = setInterval(cleanup, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [user, conversations.length, cleanupEmptyConversations]);

  const handleNewConversation = async () => {
    try {
      const newId = await createNewConversation();
      setCurrentConversation(newId);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      setError('Falha ao criar nova conversa. Tente novamente.');
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (conversations.length <= 1) {
      setError('Não é possível excluir a última conversa');
      return;
    }

    try {
      await deleteConversation(id);
      if (currentConversationId === id) {
        const remainingConversations = conversations.filter(c => c.id !== id);
        if (remainingConversations.length > 0) {
          setCurrentConversation(remainingConversations[0].id);
        } else {
          clearCurrentConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setError('Falha ao excluir conversa. Tente novamente.');
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title && conversation.title !== 'Nova Conversa') {
      return conversation.title;
    }

    const firstUserMessage = conversation.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 30) + '...';
    }

    return 'Nova Conversa';
  };

  // Show loading state while auth is being determined
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render chat (redirect will happen via useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="flex w-80 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Conversas
            </h1>
            <Button
              onClick={handleNewConversation}
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              Nova
            </Button>
          </div>
          <NetworkStatus />
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-2">
            {conversations.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs">
                  Clique em &ldquo;Nova&rdquo; para começar
                </p>
              </div>
            ) : (
              conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={cn(
                    'group relative cursor-pointer rounded-lg p-3 transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    currentConversationId === conversation.id
                      ? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border border-transparent'
                  )}
                  onClick={() => setCurrentConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {conversation.is_pinned && (
                          <Pin className="h-3 w-3 text-blue-500" />
                        )}
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {getConversationTitle(conversation)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.messages.length} mensagens
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(conversation.updated_at).toLocaleDateString(
                          'pt-BR'
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getConversationTitle(currentConversation)}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentConversation.messages.length} mensagens
              </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="mx-auto max-w-4xl space-y-4">
                {currentConversation.messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
                        <div className="animation-delay-200 h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
                        <div className="animation-delay-400 h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Error Display */}
            {error && (
              <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                <ChatErrorHandler
                  error={error}
                  onRetry={() => setError(null)}
                  onDismiss={() => setError(null)}
                />
              </div>
            )}

            {/* Chat Input */}
            <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <ChatInput />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Bem-vindo ao Penny Wise Chat
              </h3>
              <p className="mb-4 max-w-md text-gray-500 dark:text-gray-400">
                Converse com nossa IA especializada em mercado financeiro.
                Analise ações, faça previsões e tire suas dúvidas.
              </p>
              <Button onClick={handleNewConversation} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Iniciar Conversa
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
