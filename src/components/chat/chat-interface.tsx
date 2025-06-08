'use client'

import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chat-store'
import { ChatInput } from './chat-input'
import { ChatMessage } from './message'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, MessageSquare, Trash2, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatInterface() {
  const {
    currentConversationId,
    conversations,
    isLoading,
    error,
    createNewConversation,
    setCurrentConversation,
    deleteConversation,
    clearCurrentConversation
  } = useChatStore()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentConversation = conversations.find(c => c.id === currentConversationId)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation()
    }
  }, [conversations.length, createNewConversation])

  const handleNewChat = () => {
    createNewConversation()
  }

  const handleClearChat = () => {
    if (currentConversationId) {
      clearCurrentConversation()
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
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
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs">Clique em + para começar</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setCurrentConversation(conversation.id)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-colors group',
                    currentConversationId === conversation.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {conversation.is_pinned && (
                          <Pin className="h-3 w-3 text-blue-500" />
                        )}
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {conversation.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {conversation.messages.length} mensagem{conversation.messages.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(conversation.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conversation.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-red-500"
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
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {currentConversation.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentConversation.messages.length} mensagem{currentConversation.messages.length !== 1 ? 's' : ''}
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
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900">
              <div className="max-w-4xl mx-auto">
                {currentConversation.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Bem-vindo ao Penny Wise!</h3>
                      <p className="text-sm max-w-md mx-auto">
                        Faça perguntas sobre o mercado financeiro, analise ações, 
                        compare ativos ou use comandos especiais como <code>/analyze PETR4</code>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {currentConversation.messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLast={index === currentConversation.messages.length - 1}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Error Display */}
            {error && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="max-w-4xl mx-auto">
                <ChatInput />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm">
                Escolha uma conversa da lista ou crie uma nova para começar
              </p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                <span className="text-sm font-medium">Processando...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 