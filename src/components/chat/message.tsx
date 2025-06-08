'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Message } from '@/store/chat-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Copy, User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/context'
import { MarketContextCard } from './market-context-card'

interface MessageProps {
  message: Message
  isLast?: boolean
}

export const ChatMessage = memo(function ChatMessage({ message, isLast }: MessageProps) {
  const { user } = useAuth()
  const isUser = message.role === 'user'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      // TODO: Add toast notification
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div
      className={cn(
        'group flex gap-3 p-4 transition-colors',
        isUser 
          ? 'bg-blue-50 dark:bg-blue-950/20' 
          : 'bg-white dark:bg-gray-900',
        isLast && 'mb-4'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          {isUser ? (
            <>
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-blue-600 text-white">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-gray-600 text-white">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? (
              user?.user_metadata?.first_name ? 
                `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() :
                user?.user_metadata?.full_name || 'Você'
            ) : 'Penny Wise'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.timestamp)}
          </span>
          {message.metadata?.model && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 rounded">
              {message.metadata.model}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {isUser ? (
            <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 m-0">
              {message.content}
            </p>
          ) : (
            <div className="text-gray-900 dark:text-gray-100">
              <ReactMarkdown
                components={{
                  // Custom components for better styling
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code 
                        className="bg-gray-100 dark:bg-gray-800 rounded px-1 text-sm" 
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                  ),
                  h3: ({ children }) => (
                    <h3 className="font-semibold text-lg mb-2 mt-4 first:mt-0">{children}</h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic my-2">
                      {children}
                    </blockquote>
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Market Context (for enhanced responses) */}
        {!isUser && message.metadata?.marketContext && (
          <div className="mt-3">
            <MarketContextCard 
              marketContext={message.metadata.marketContext}
              className="max-w-md"
            />
          </div>
        )}

        {/* Metadata footer */}
        {message.metadata && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {message.metadata.tokens && (
              <span>Tokens: {message.metadata.tokens}</span>
            )}
            {message.metadata.processing_time && (
              <span>Tempo: {message.metadata.processing_time}ms</span>
            )}
            {message.metadata.isEnhanced && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                Enhanced
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0"
          title="Copiar mensagem"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}) 