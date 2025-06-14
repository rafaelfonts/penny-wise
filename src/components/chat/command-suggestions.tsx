/**
 * Command Suggestions Component
 * Shows command suggestions as user types
 */

import { useState, useEffect } from 'react'
import { getCommandSuggestions, type ChatCommand } from '@/lib/services/chat-commands'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Terminal, HelpCircle } from 'lucide-react'

interface CommandSuggestionsProps {
  input: string
  onSelectCommand: (command: string) => void
  className?: string
}

export function CommandSuggestions({ input, onSelectCommand, className }: CommandSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ChatCommand[]>([])

  useEffect(() => {
    if (input.startsWith('/') && input.length > 1) {
      const commandSuggestions = getCommandSuggestions(input)
      setSuggestions(commandSuggestions.slice(0, 5)) // Limit to 5 suggestions
    } else {
      setSuggestions([])
    }
  }, [input])

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className={`absolute bottom-full mb-2 w-full z-50 ${className}`}>
      <CardContent className="p-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Terminal className="h-3 w-3" />
            <span>Comandos disponíveis</span>
          </div>
          
          {suggestions.map((command) => (
            <div
              key={command.name}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
              onClick={() => onSelectCommand(command.usage)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    /{command.name}
                  </Badge>
                  <span className="text-sm">{command.description}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {command.usage}
                </div>
              </div>
              
              <HelpCircle className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
          
          <div className="text-xs text-muted-foreground pt-1 border-t">
            Digite <code>/help</code> para ver todos os comandos
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 