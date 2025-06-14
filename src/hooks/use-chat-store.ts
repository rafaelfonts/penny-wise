'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '@/store/chat-store'

/**
 * Custom hook for safe chat store usage with SSR compatibility
 */
export function useChatStoreInit() {
  const loadConversations = useChatStore(state => state.loadConversations)
  const store = useChatStore()
  
  useEffect(() => {
    // Only load conversations after client-side hydration
    if (typeof window !== 'undefined' && store.conversations.length === 0) {
      loadConversations()
    }
  }, [loadConversations, store.conversations.length]) // ✅ FIX: Stable function reference + length check
  
  return store
}

/**
 * Hook for safe client-side only store access
 */
export function useChatStoreClient() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const store = useChatStore()
  
  // Only return store methods and state after hydration
  if (!isClient || typeof window === 'undefined') {
    return {
      currentConversationId: null,
      conversations: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      sidebarOpen: true,
      streamingMessageId: null,
      // Stub methods for SSR
      setCurrentConversation: () => {},
      addConversation: () => {},
      updateConversation: () => {},
      deleteConversation: async () => {},
      addMessage: () => {},
      updateMessage: () => {},
      setLoading: () => {},
      setStreaming: () => {},
      setError: () => {},
      setSidebarOpen: () => {},
      sendMessage: async () => {},
      sendMessageStream: async () => {},
      createNewConversation: async () => '',
      clearCurrentConversation: () => {},
      setStreamingMessageId: () => {},
      appendToStreamingMessage: () => {},
      finalizeStreamingMessage: () => {},
      loadConversations: async () => {},
      syncConversation: async () => {},
      cleanupEmptyConversations: async () => {},
    }
  }
  
  return store
} 