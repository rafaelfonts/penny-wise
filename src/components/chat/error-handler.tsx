'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  Server,
  MessageCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatError {
  type: 'network' | 'server' | 'auth' | 'streaming' | 'unknown';
  message: string;
  details?: string;
  retryable?: boolean;
  timestamp: string;
}

interface ErrorHandlerProps {
  error: ChatError | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ChatErrorHandler({
  error,
  onRetry,
  onDismiss,
  className,
}: ErrorHandlerProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  // Normalize error to ChatError object
  const chatError: ChatError =
    typeof error === 'string'
      ? {
          type: 'unknown',
          message: error,
          retryable: true,
          timestamp: new Date().toISOString(),
        }
      : error;

  const getErrorIcon = () => {
    switch (chatError.type) {
      case 'network':
        return <Wifi className="h-5 w-5 text-orange-500" />;
      case 'server':
        return <Server className="h-5 w-5 text-red-500" />;
      case 'auth':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'streaming':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (chatError.type) {
      case 'network':
        return 'Problema de Conexão';
      case 'server':
        return 'Erro do Servidor';
      case 'auth':
        return 'Erro de Autenticação';
      case 'streaming':
        return 'Erro de Streaming';
      default:
        return 'Erro Inesperado';
    }
  };

  const getErrorDescription = () => {
    switch (chatError.type) {
      case 'network':
        return 'Verifique sua conexão com a internet e tente novamente.';
      case 'server':
        return 'Nossos servidores estão temporariamente indisponíveis.';
      case 'auth':
        return 'Sua sessão pode ter expirado. Clique em "Fazer Login" para continuar.';
      case 'streaming':
        return 'Houve um problema ao receber a resposta em tempo real.';
      default:
        return 'Algo deu errado. Nossa equipe foi notificada.';
    }
  };

  const handleAuthError = () => {
    // Redirect to login page
    window.location.href =
      '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
  };

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card
      className={cn('border-destructive/20 bg-destructive/5 p-4', className)}
    >
      <div className="flex items-start gap-3">
        {getErrorIcon()}

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{getErrorTitle()}</h4>
            <span className="text-muted-foreground text-xs">
              {new Date(chatError.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <p className="text-muted-foreground text-sm">{chatError.message}</p>

          <p className="text-muted-foreground text-xs">
            {getErrorDescription()}
          </p>

          {chatError.details && (
            <details className="text-xs">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
                Detalhes técnicos
              </summary>
              <pre className="bg-muted mt-2 overflow-x-auto rounded p-2 text-xs">
                {chatError.details}
              </pre>
            </details>
          )}

          <div className="flex gap-2 pt-2">
            {chatError.type === 'auth' ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleAuthError}
                className="h-8"
              >
                Fazer Login
              </Button>
            ) : (
              chatError.retryable &&
              onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="h-8"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      Tentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Tentar Novamente
                    </>
                  )}
                </Button>
              )
            )}

            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8"
              >
                Dispensar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  if (isOnline) return null;

  return (
    <Alert
      className={cn(
        'border-orange-200 bg-orange-50 dark:bg-orange-950/20',
        className
      )}
    >
      <Wifi className="h-4 w-4 text-orange-500" />
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        Você está offline. Algumas funcionalidades podem não estar disponíveis.
      </AlertDescription>
    </Alert>
  );
}

export function createChatError(
  type: ChatError['type'],
  message: string,
  details?: string,
  retryable: boolean = true
): ChatError {
  return {
    type,
    message,
    details,
    retryable,
    timestamp: new Date().toISOString(),
  };
}
