'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ChatErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ChatErrorBoundaryProps {
  children: React.ReactNode
}

export class ChatErrorBoundary extends React.Component<
  ChatErrorBoundaryProps,
  ChatErrorBoundaryState
> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log in development to avoid console pollution
    if (process.env.NODE_ENV === 'development') {
      console.warn('Chat Error Boundary caught an error:', error.message, errorInfo)
    }
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Card className="max-w-md p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-lg font-semibold mb-2">
              Oops! Algo deu errado no chat
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                <summary className="font-medium cursor-pointer">
                  Detalhes do erro (dev)
                </summary>
                <pre className="mt-2 overflow-x-auto">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button onClick={() => window.location.reload()}>
                Recarregar Página
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
} 