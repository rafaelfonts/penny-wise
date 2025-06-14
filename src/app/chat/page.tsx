import { ChatInterface } from '@/components/chat/chat-interface'
import { ChatErrorBoundary } from '@/components/chat/chat-error-boundary'

export default function ChatPage() {
  return (
    <div className="h-screen">
      <ChatErrorBoundary>
        <ChatInterface />
      </ChatErrorBoundary>
    </div>
  )
}

// Note: Metadata removed since this became a client component during development 