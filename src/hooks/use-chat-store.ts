'use client';

import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';

/**
 * Custom hook for safe chat store usage with SSR compatibility
 */
export function useChatStoreInit() {
  const loadConversations = useChatStore(state => state.loadConversations);
  const store = useChatStore();

  useEffect(() => {
    // Only load conversations after client-side hydration
    if (typeof window !== 'undefined' && store.conversations.length === 0) {
      loadConversations();
    }
  }, [loadConversations, store.conversations.length]); // ✅ FIX: Stable function reference + length check

  return store;
}

/**
 * Hook for safe client-side only store access with improved stability
 */
export function useChatStoreClient() {
  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const initializationRef = useRef(false);
  const mountTimeRef = useRef<number>(0);

  const store = useChatStore();

  // Handle client-side hydration with improved persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentTime = Date.now();

      // Prevent rapid re-initialization (within 1 second)
      if (currentTime - mountTimeRef.current < 1000) {
        console.debug('⚡ Skipping initialization - too soon after last mount');
        setIsClient(true);
        return;
      }

      mountTimeRef.current = currentTime;

      // Check session-based initialization state
      const sessionKey = 'chat-initialized';
      const hasInitialized = sessionStorage.getItem(sessionKey);

      if (!hasInitialized) {
        sessionStorage.setItem(sessionKey, 'true');
        console.debug('🚀 First initialization this session');
      } else {
        console.debug('🔄 Re-initialization detected');
      }

      setIsClient(true);
      initializationRef.current = Boolean(hasInitialized);
    }
  }, []);

  // Handle page visibility changes with better stability
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const newState = !document.hidden;
      setIsVisible(newState);

      if (newState) {
        console.debug('📱 Page became visible');
      } else {
        console.debug('📱 Page became hidden');
      }
    };

    const handleFocus = () => {
      setIsVisible(true);
      console.debug('🎯 Window focused');
    };

    const handleBlur = () => {
      // Don't immediately mark as not visible on blur
      // This prevents unnecessary state changes during quick tab switches
      console.debug('💤 Window blurred');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Enhanced store methods with better error handling
  const enhancedStore = {
    ...store,

    // Improved cleanup that respects visibility and timing
    cleanupEmptyConversations: async () => {
      // Skip cleanup if conditions aren't met
      if (!isVisible) {
        console.debug('⏭️ Skipping cleanup - tab not visible');
        return;
      }

      // Don't cleanup too soon after initialization
      if (Date.now() - mountTimeRef.current < 30000) {
        // 30 seconds
        console.debug('⏭️ Skipping cleanup - too soon after mount');
        return;
      }

      try {
        return await store.cleanupEmptyConversations();
      } catch (error) {
        // Silent error handling for cleanup
        if (process.env.NODE_ENV === 'development') {
          console.warn('🧹 Cleanup warning:', error);
        }
      }
    },

    // Enhanced conversation creation with session tracking
    createNewConversation: async () => {
      try {
        const newId = await store.createNewConversation();

        // Update session storage with new conversation
        if (typeof window !== 'undefined' && newId) {
          sessionStorage.setItem('current-conversation', newId);
        }

        return newId;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        throw error;
      }
    },

    // Enhanced conversation selection with persistence
    setCurrentConversation: (id: string) => {
      store.setCurrentConversation(id);

      // Persist to session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('current-conversation', id);
      }
    },

    // Track initialization state
    isInitialized: initializationRef.current,
  };

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
      isInitialized: false,
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
    };
  }

  return enhancedStore;
}
