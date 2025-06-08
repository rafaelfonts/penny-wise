'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChatStore } from '@/store/chat-store'
import { Send, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  className?: string
}

export function ChatInput({ className }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { 
    sendMessage, 
    isLoading, 
    currentConversationId, 
    createNewConversation 
  } = useChatStore()

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
  const commandSuggestions = [
    { command: '/analyze', description: 'Analisar ação ou mercado' },
    { command: '/compare', description: 'Comparar ativos' },
    { command: '/alert', description: 'Criar alerta de preço' },
    { command: '/portfolio', description: 'Visualizar portfólio' },
    { command: '/help', description: 'Ver todos os comandos' }
  ]

  const filteredCommands = commandSuggestions.filter(cmd =>
    cmd.command.toLowerCase().includes(message.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || isLoading) return

    // Create new conversation if none exists
    if (!currentConversationId) {
      createNewConversation()
    }

    const messageContent = message.trim()
    setMessage('')
    setShowCommands(false)
    
    await sendMessage(messageContent)
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

  const insertCommand = (command: string) => {
    setMessage(command + ' ')
    setShowCommands(false)
    textareaRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)}>
      {/* Command suggestions */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => insertCommand(cmd.command)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="font-medium text-sm">{cmd.command}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</div>
            </button>
          ))}
        </div>
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
            onClick={createNewConversation}
            className="shrink-0"
            title="Nova conversa"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Send button */}
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="shrink-0"
            title="Enviar mensagem (Enter)"
          >
            {isLoading ? (
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