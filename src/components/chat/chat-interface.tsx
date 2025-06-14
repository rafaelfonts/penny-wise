'use client';

import { useEffect, useRef, useState } from 'react';
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

export function ChatInterface() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
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
    };

    checkAuth();
  }, [router, supabase.auth]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Initialize chat on mount - only after authentication
  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    const controller = new AbortController();

    const initializeChat = async () => {
      try {
        if (!mounted || controller.signal.aborted) return;

        // Load conversations from database
        await loadConversations();

        if (!mounted || controller.signal.aborted) return;

        // Clean up empty conversations after loading with better error handling
        try {
          await cleanupEmptyConversations();
        } catch (cleanupError) {
          // Log cleanup errors but don't fail the initialization
          if (process.env.NODE_ENV === 'development') {
            console.warn('Non-critical cleanup error:', cleanupError);
          }
        }
      } catch (error) {
        // Only log errors if component is still mounted and not aborted
        if (mounted && !controller.signal.aborted) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error initializing chat:', error);
          }
        }
      }
    };

    // Use setTimeout to prevent blocking the render cycle
    const timeoutId = setTimeout(() => {
      if (mounted && !controller.signal.aborted) {
        initializeChat();
      }
    }, 100);

    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only initialize after authentication is confirmed

  // No automatic conversation creation - will create when user sends first message

  const handleNewChat = async () => {
    await createNewConversation();
  };

  const handleClearChat = () => {
    if (currentConversationId) {
      clearCurrentConversation();
    }
  };

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
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
      {/* Sidebar - Conversations List */}
      <div className="flex w-80 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Penny Wise Chat
            </h1>
            <Button
              onClick={handleNewChat}
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
                <div
                  key={conversation.id}
                  onClick={() => setCurrentConversation(conversation.id)}
                  className={cn(
                    'group cursor-pointer rounded-lg p-3 transition-colors',
                    currentConversationId === conversation.id
                      ? 'border border-blue-200 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        {conversation.is_pinned && (
                          <Pin className="h-3 w-3 text-blue-500" />
                        )}
                        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {conversation.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {conversation.messages.length} mensagem
                        {conversation.messages.length !== 1 ? 's' : ''}
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
                      onClick={async e => {
                        e.stopPropagation();
                        try {
                          await deleteConversation(conversation.id);
                        } catch (error) {
                          // Only log in development and if it's a real error
                          if (
                            process.env.NODE_ENV === 'development' &&
                            error instanceof Error
                          ) {
                            console.warn(
                              'Failed to delete conversation:',
                              error.message
                            );
                          }
                        }
                      }}
                      className="h-6 w-6 p-0 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500"
                      title="Excluir conversa"
                    >
                      <Trash2 className="h-3 w-3" />
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
        {conversations.length === 0 ? (
          /* Initial welcome state when no conversations exist */
          <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md py-12 text-center">
              <MessageSquare className="mx-auto mb-6 h-16 w-16 text-gray-400 dark:text-gray-500" />
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                Bem-vindo ao Penny Wise!
              </h2>
              <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-400">
                Seu assistente de análise financeira com IA. Comece uma nova
                conversa para analisar ações, obter insights do mercado ou usar
                comandos especiais.
              </p>
              <Button onClick={handleNewChat} size="lg" className="mb-4">
                <Plus className="mr-2 h-5 w-5" />
                Iniciar Nova Conversa
              </Button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Experimente comandos como:</p>
                <div className="mt-2 space-y-1">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                    /analyze PETR4
                  </code>
                  <br />
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                    /compare VALE5 ITUB4
                  </code>
                </div>
              </div>
            </div>
          </div>
        ) : currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {currentConversation.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentConversation.messages.length} mensagem
                    {currentConversation.messages.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearChat}
                    disabled={currentConversation.messages.length === 0}
                    title="Limpar conversa"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900">
              <div className="mx-auto max-w-4xl">
                {currentConversation.messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="py-12 text-center">
                      <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <h3 className="mb-2 text-lg font-medium">
                        Bem-vindo ao Penny Wise!
                      </h3>
                      <p className="mx-auto max-w-md text-sm">
                        Faça perguntas sobre o mercado financeiro, analise
                        ações, compare ativos ou use comandos especiais como{' '}
                        <code>/analyze PETR4</code>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {currentConversation.messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLast={
                          index === currentConversation.messages.length - 1
                        }
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Error Display */}
            {error && (
              <div className="px-4 py-2">
                <ChatErrorHandler
                  error={error}
                  onRetry={() => {
                    // Retry last message if available
                    const lastUserMessage = currentConversation?.messages
                      .filter(m => m.role === 'user')
                      .pop();
                    if (lastUserMessage) {
                      // TODO: Implement retry logic
                      console.log('Retrying:', lastUserMessage.content);
                    }
                  }}
                  onDismiss={() => {
                    setError(null);
                  }}
                />
              </div>
            )}

            {/* Network Status */}
            <NetworkStatus className="mx-4 mb-2" />

            {/* Chat Input */}
            <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mx-auto max-w-4xl">
                <ChatInput />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 h-16 w-16 opacity-50" />
              <h3 className="mb-2 text-xl font-medium">
                Selecione uma conversa
              </h3>
              <p className="text-sm">
                Escolha uma conversa da lista ou crie uma nova para começar
              </p>
            </div>
          </div>
        )}

        {/* Loading/Streaming Overlay */}
        {(isLoading || isStreaming) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-sm font-medium">
                  {isStreaming ? 'Recebendo resposta...' : 'Processando...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
