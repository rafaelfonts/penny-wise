/**
 * Command Suggestions Component
 * Shows command suggestions as user types
 */

import { useState, useEffect } from 'react';
import {
  getCommandSuggestions,
  type ChatCommand,
} from '@/lib/services/chat-commands';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, HelpCircle } from 'lucide-react';

interface CommandSuggestionsProps {
  input: string;
  onSelectCommand: (command: string) => void;
  className?: string;
}

export function CommandSuggestions({
  input,
  onSelectCommand,
  className,
}: CommandSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ChatCommand[]>([]);

  useEffect(() => {
    if (input.startsWith('/') && input.length > 1) {
      const commandSuggestions = getCommandSuggestions(input);
      setSuggestions(commandSuggestions.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setSuggestions([]);
    }
  }, [input]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className={`absolute bottom-full z-50 mb-2 w-full ${className}`}>
      <CardContent className="p-2">
        <div className="space-y-1">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
            <Terminal className="h-3 w-3" />
            <span>Comandos disponíveis</span>
          </div>

          {suggestions.map(command => (
            <div
              key={command.name}
              className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors"
              onClick={() => onSelectCommand(command.usage)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    /{command.name}
                  </Badge>
                  <span className="text-sm">{command.description}</span>
                </div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {command.usage}
                </div>
              </div>

              <HelpCircle className="text-muted-foreground h-3 w-3" />
            </div>
          ))}

          <div className="text-muted-foreground border-t pt-1 text-xs">
            Digite <code>/help</code> para ver todos os comandos
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
