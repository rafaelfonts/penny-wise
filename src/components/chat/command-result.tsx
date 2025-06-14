/**
 * Command Result Component
 * Displays the results of chat commands with appropriate styling
 */

import { CommandResult } from '@/lib/services/chat-commands'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandResultProps {
  result: CommandResult
  className?: string
}

export function CommandResultComponent({ result, className }: CommandResultProps) {
  const getIcon = () => {
    switch (result.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getVariant = () => {
    switch (result.type) {
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      case 'info':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStyles = () => {
    switch (result.type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
      default:
        return ''
    }
  }

  return (
    <Alert variant={getVariant()} className={cn(getStyles(), className)}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <AlertDescription className="flex-1">
          <div className="whitespace-pre-line">
            {result.content}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  )
} 