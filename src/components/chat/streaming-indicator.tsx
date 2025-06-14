'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StreamingIndicatorProps {
  isStreaming?: boolean
  className?: string
}

export function StreamingIndicator({ isStreaming = false, className }: StreamingIndicatorProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isStreaming) {
      setDots('')
      return
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isStreaming])

  if (!isStreaming) return null

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm text-muted-foreground animate-pulse',
      className
    )}>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
      </div>
      <span>Penny Wise está pensando{dots}</span>
    </div>
  )
}

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-4 py-2 bg-muted rounded-lg w-fit',
      className
    )}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      </div>
      <span className="text-sm text-muted-foreground">Digitando...</span>
    </div>
  )
}

interface StreamingTextProps {
  content: string
  isComplete?: boolean
  className?: string
}

export function StreamingText({ content, isComplete = false, className }: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (isComplete) {
      setDisplayedContent(content)
      setShowCursor(false)
      return
    }

    // Simulate typing effect for streamed content
    setDisplayedContent(content)
    
    // Cursor blinking effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [content, isComplete])

  return (
    <div className={cn('relative', className)}>
      <span>{displayedContent}</span>
      {!isComplete && showCursor && (
        <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse" />
      )}
    </div>
  )
} 