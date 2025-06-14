'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChatStoreClient } from '@/hooks/use-chat-store'
import { Send, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommandSuggestions } from './command-suggestions'

interface ChatInputProps {
  className?: string
}

export function ChatInput({ className }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
    const { 
    sendMessage, 
    sendMessageStream,
    isLoading, 
    isStreaming,
    currentConversationId,
    createNewConversation 
  } = useChatStoreClient()

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, [message])

  // Commands detection
  const isCommand = message.startsWith('/')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || isLoading || isStreaming) return

    // Create new conversation if none exists
    if (!currentConversationId) {
      try {
        await createNewConversation()
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to create new conversation:', error instanceof Error ? error.message : 'Unknown error')
        }
        return
      }
    }

    const messageContent = message.trim()
    setMessage('')
    setShowCommands(false)
    
    try {
      // Use streaming by default for better UX
      await sendMessageStream(messageContent)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Streaming failed, falling back to regular:', error instanceof Error ? error.message : 'Unknown error')
      }
      // Fallback to regular message sending
      try {
        await sendMessage(messageContent)
      } catch (fallbackError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Both streaming and regular send failed:', fallbackError instanceof Error ? fallbackError.message : 'Unknown error')
        }
        // Restore the message if both methods fail
        setMessage(messageContent)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as React.FormEvent)
    }
    
    if (e.key === 'Escape') {
      setShowCommands(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)
    setShowCommands(value.startsWith('/') && value.length > 1)
  }

  const handleSelectCommand = (command: string) => {
    setMessage(command + ' ')
    setShowCommands(false)
    textareaRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)}>
      {/* Command suggestions */}
      {showCommands && (
        <CommandSuggestions
          input={message}
          onSelectCommand={handleSelectCommand}
        />
      )}

      {/* Main input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isCommand 
                ? "Digite um comando ou pressione Tab para sugestões..."
                : "Digite sua pergunta sobre o mercado financeiro..."
            }
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none pr-20",
              isCommand && "border-blue-500 dark:border-blue-400"
            )}
            disabled={isLoading}
          />
          
          {/* Character count for long messages */}
          {message.length > 100 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {message.length}/2000
            </div>
          )}
        </div>

        <div className="flex gap-1">
          {/* New conversation button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => createNewConversation().catch((error) => {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Failed to create conversation from button:', error instanceof Error ? error.message : 'Unknown error')
              }
            })}
            className="shrink-0"
            title="Nova conversa"
            disabled={isLoading || isStreaming}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Send button */}
          <Button
            type="submit"
            disabled={!message.trim() || isLoading || isStreaming}
            className="shrink-0"
            title="Enviar mensagem (Enter)"
          >
            {(isLoading || isStreaming) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Helper text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Pressione Enter para enviar, Shift+Enter para nova linha
        {isCommand && " • Digite / para ver comandos disponíveis"}
      </div>
    </div>
  )
} 