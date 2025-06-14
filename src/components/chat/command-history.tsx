/**
 * Command History Component
 * Shows recent commands and allows quick re-execution
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, Trash2, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: string;
  result: 'success' | 'error' | 'info';
  description?: string;
}

interface CommandHistoryProps {
  onExecuteCommand?: (command: string) => void;
  className?: string;
}

export function CommandHistory({
  onExecuteCommand,
  className,
}: CommandHistoryProps) {
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('penny-wise-command-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading command history:', error);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('penny-wise-command-history', JSON.stringify(history));
  }, [history]);

  // Listen for external command additions
  useEffect(() => {
    const addToHistory = (
      command: string,
      result: CommandHistoryItem['result'],
      description?: string
    ) => {
      const newItem: CommandHistoryItem = {
        id: Date.now().toString(),
        command,
        timestamp: new Date().toISOString(),
        result,
        description,
      };

      setHistory(prev => [newItem, ...prev.slice(0, 49)]); // Keep last 50 commands
    };

    const handleAddCommand = (event: CustomEvent) => {
      const { command, result, description } = event.detail;
      addToHistory(command, result, description);
    };

    window.addEventListener(
      'addCommandToHistory',
      handleAddCommand as EventListener
    );
    return () => {
      window.removeEventListener(
        'addCommandToHistory',
        handleAddCommand as EventListener
      );
    };
  }, []);

  const clearHistory = () => {
    setHistory([]);
  };

  const executeCommand = (command: string) => {
    if (onExecuteCommand) {
      onExecuteCommand(command);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const getResultColor = (result: CommandHistoryItem['result']) => {
    switch (result) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Mock some recent commands for demo
  useEffect(() => {
    if (history.length === 0) {
      setHistory([
        {
          id: '1',
          command: '/quote AAPL',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
          result: 'success',
          description: 'Cotação da Apple',
        },
        {
          id: '2',
          command: '/analyze MSFT',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
          result: 'success',
          description: 'Análise da Microsoft',
        },
        {
          id: '3',
          command: '/help',
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          result: 'info',
          description: 'Lista de comandos',
        },
      ]);
    }
  }, [history.length]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de Comandos
          </CardTitle>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-8 w-8 p-0"
              title="Limpar histórico"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {history.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <Terminal className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Nenhum comando executado ainda</p>
            <p className="mt-1 text-xs">
              Digite /help para ver comandos disponíveis
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {history.map(item => (
                <div
                  key={item.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <code className="bg-muted rounded px-1 font-mono text-sm">
                        {item.command}
                      </code>
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', getResultColor(item.result))}
                      >
                        {item.result}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>{formatTime(item.timestamp)}</span>
                      {item.description && (
                        <>
                          <span>•</span>
                          <span>{item.description}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeCommand(item.command)}
                    className="h-8 w-8 shrink-0 p-0"
                    title="Executar novamente"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Export function to add commands to history from outside
export const addCommandToHistory = (
  command: string,
  result: CommandHistoryItem['result'],
  description?: string
) => {
  // This would be better handled by a context or store
  const event = new CustomEvent('addCommandToHistory', {
    detail: { command, result, description },
  });
  window.dispatchEvent(event);
};
