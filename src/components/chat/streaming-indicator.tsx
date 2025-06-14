'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StreamingIndicatorProps {
  isStreaming?: boolean;
  className?: string;
}

export function StreamingIndicator({
  isStreaming = false,
  className,
}: StreamingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isStreaming) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!isStreaming) return null;

  return (
    <div
      className={cn(
        'text-muted-foreground flex animate-pulse items-center gap-2 text-sm',
        className
      )}
    >
      <div className="flex space-x-1">
        <div className="h-1 w-1 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
        <div className="h-1 w-1 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></div>
        <div className="h-1 w-1 animate-bounce rounded-full bg-blue-500"></div>
      </div>
      <span>Penny Wise está pensando{dots}</span>
    </div>
  );
}

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'bg-muted flex w-fit items-center gap-2 rounded-lg px-4 py-2',
        className
      )}
    >
      <div className="flex space-x-1">
        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
      </div>
      <span className="text-muted-foreground text-sm">Digitando...</span>
    </div>
  );
}

interface StreamingTextProps {
  content: string;
  isComplete?: boolean;
  className?: string;
}

export function StreamingText({
  content,
  isComplete = false,
  className,
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (isComplete) {
      setDisplayedContent(content);
      setShowCursor(false);
      return;
    }

    // Simulate typing effect for streamed content
    setDisplayedContent(content);

    // Cursor blinking effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [content, isComplete]);

  return (
    <div className={cn('relative', className)}>
      <span>{displayedContent}</span>
      {!isComplete && showCursor && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-blue-500" />
      )}
    </div>
  );
}
