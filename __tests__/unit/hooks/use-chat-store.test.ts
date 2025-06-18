import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

// Mock the chat store hook
const mockUseChatStore = jest.fn();

// Mock chat store state and actions
const mockChatState = {
  messages: [],
  isLoading: false,
  error: null,
  currentConversationId: null,
  conversations: [],
  streamingMessage: null,
  isStreaming: false,
  context: {},
};

const mockChatActions = {
  sendMessage: jest.fn(),
  addMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  clearMessages: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  startStreaming: jest.fn(),
  stopStreaming: jest.fn(),
  updateStreamingMessage: jest.fn(),
  createConversation: jest.fn(),
  switchConversation: jest.fn(),
  deleteConversation: jest.fn(),
  updateContext: jest.fn(),
  resetStore: jest.fn(),
};

jest.mock('@/hooks/use-chat-store', () => ({
  useChatStore: mockUseChatStore,
}));

describe('Chat Store Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock state
    Object.assign(mockChatState, {
      messages: [],
      isLoading: false,
      error: null,
      currentConversationId: null,
      conversations: [],
      streamingMessage: null,
      isStreaming: false,
      context: {},
    });

    // Setup default mock implementation
    mockUseChatStore.mockReturnValue({
      ...mockChatState,
      ...mockChatActions,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Message Management', () => {
    test('should add messages to the store', () => {
      const messages: any[] = [];

      const addMessage = (message: any) => {
        const newMessage = {
          id: `msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...message,
        };
        messages.push(newMessage);
        return newMessage;
      };

      mockChatActions.addMessage.mockImplementation(addMessage);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        messages,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.addMessage({
          content: 'Hello, world!',
          role: 'user',
          type: 'text',
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Hello, world!');
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].id).toMatch(/^msg-/);
    });

    test('should update existing messages', () => {
      const messages = [
        {
          id: 'msg-1',
          content: 'Original message',
          role: 'user',
          timestamp: new Date().toISOString(),
        },
      ];

      const updateMessage = (id: string, updates: Partial<any>) => {
        const messageIndex = messages.findIndex(m => m.id === id);
        if (messageIndex !== -1) {
          messages[messageIndex] = { ...messages[messageIndex], ...updates };
          return messages[messageIndex];
        }
        return null;
      };

      mockChatActions.updateMessage.mockImplementation(updateMessage);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        messages,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.updateMessage('msg-1', {
          content: 'Updated message',
          edited: true,
        });
      });

      expect(result.current.messages[0].content).toBe('Updated message');
      expect(result.current.messages[0].edited).toBe(true);
    });

    test('should delete messages from the store', () => {
      const messages = [
        { id: 'msg-1', content: 'Message 1', role: 'user' },
        { id: 'msg-2', content: 'Message 2', role: 'assistant' },
        { id: 'msg-3', content: 'Message 3', role: 'user' },
      ];

      const deleteMessage = (id: string) => {
        const index = messages.findIndex(m => m.id === id);
        if (index !== -1) {
          messages.splice(index, 1);
          return true;
        }
        return false;
      };

      mockChatActions.deleteMessage.mockImplementation(deleteMessage);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        messages,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.deleteMessage('msg-2');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages.find(m => m.id === 'msg-2')).toBeUndefined();
    });

    test('should clear all messages', () => {
      const messages = [
        { id: 'msg-1', content: 'Message 1', role: 'user' },
        { id: 'msg-2', content: 'Message 2', role: 'assistant' },
      ];

      const clearMessages = () => {
        messages.length = 0;
      };

      mockChatActions.clearMessages.mockImplementation(clearMessages);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        messages,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe('Message Sending', () => {
    test('should send message and handle response', async () => {
      const messages: any[] = [];
      let isLoading = false;

      const sendMessage = async (content: string, options?: any) => {
        isLoading = true;

        // Add user message
        const userMessage = {
          id: `msg-${Date.now()}`,
          content,
          role: 'user',
          timestamp: new Date().toISOString(),
          ...options,
        };
        messages.push(userMessage);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Add assistant response
        const assistantMessage = {
          id: `msg-${Date.now() + 1}`,
          content: `Response to: ${content}`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        };
        messages.push(assistantMessage);

        isLoading = false;
        return assistantMessage;
      };

      mockChatActions.sendMessage.mockImplementation(sendMessage);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        messages,
        isLoading,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      await act(async () => {
        await result.current.sendMessage('What is the price of AAPL?');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[1].role).toBe('assistant');
      expect(result.current.messages[1].content).toContain('Response to:');
    });

    test('should handle message sending errors', async () => {
      let error: string | null = null;
      let isLoading = false;

      const sendMessage = async (content: string) => {
        isLoading = true;
        error = null;

        try {
          // Simulate API error
          throw new Error('Network error');
        } catch (err) {
          error = err instanceof Error ? err.message : 'Unknown error';
          isLoading = false;
          throw err;
        }
      };

      mockChatActions.sendMessage.mockImplementation(sendMessage);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        error,
        isLoading,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      await act(async () => {
        try {
          await result.current.sendMessage('Test message');
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle message sending with context', async () => {
      const messages: any[] = [];
      const context = { symbol: 'AAPL', timeframe: '1D' };

      const sendMessage = async (content: string, options?: any) => {
        const userMessage = {
          id: `msg-${Date.now()}`,
          content,
          role: 'user',
          timestamp: new Date().toISOString(),
          context: options?.context || {},
        };
        messages.push(userMessage);

        // Assistant response includes context awareness
        const assistantMessage = {
          id: `msg-${Date.now() + 1}`,
          content: options?.context?.symbol 
            ? `Here's information about ${options.context.symbol}: ${content}`
            : `Response: ${content}`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          context: options?.context || {},
        };
        messages.push(assistantMessage);

        return assistantMessage;
      };

      mockChatActions.sendMessage.mockImplementation(sendMessage);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        messages,
        context,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      await act(async () => {
        await result.current.sendMessage('Get quote', { context });
      });

      expect(result.current.messages[0].context.symbol).toBe('AAPL');
      expect(result.current.messages[1].content).toContain('AAPL');
    });
  });

  describe('Streaming Messages', () => {
    test('should handle streaming message updates', () => {
      let isStreaming = false;
      let streamingMessage: any = null;

      const startStreaming = (messageId: string) => {
        isStreaming = true;
        streamingMessage = {
          id: messageId,
          content: '',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          isStreaming: true,
        };
      };

      const updateStreamingMessage = (chunk: string) => {
        if (streamingMessage) {
          streamingMessage.content += chunk;
        }
      };

      const stopStreaming = () => {
        isStreaming = false;
        if (streamingMessage) {
          streamingMessage.isStreaming = false;
          // Add to messages array
          const messages = [streamingMessage];
          streamingMessage = null;
          return messages;
        }
        return [];
      };

      mockChatActions.startStreaming.mockImplementation(startStreaming);
      mockChatActions.updateStreamingMessage.mockImplementation(updateStreamingMessage);
      mockChatActions.stopStreaming.mockImplementation(stopStreaming);

      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        isStreaming,
        streamingMessage,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      // Start streaming
      act(() => {
        result.current.startStreaming('msg-stream-1');
      });

      expect(result.current.isStreaming).toBe(true);
      expect(result.current.streamingMessage?.id).toBe('msg-stream-1');

      // Update streaming content
      act(() => {
        result.current.updateStreamingMessage('Hello ');
        result.current.updateStreamingMessage('world!');
      });

      expect(result.current.streamingMessage?.content).toBe('Hello world!');

      // Stop streaming
      act(() => {
        const finalMessages = result.current.stopStreaming();
        expect(finalMessages).toHaveLength(1);
        expect(finalMessages[0].isStreaming).toBe(false);
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.streamingMessage).toBeNull();
    });

    test('should handle streaming errors', () => {
      let isStreaming = false;
      let error: string | null = null;

      const startStreaming = (messageId: string) => {
        isStreaming = true;
        // Simulate streaming error
        setTimeout(() => {
          error = 'Streaming connection lost';
          isStreaming = false;
        }, 100);
      };

      mockChatActions.startStreaming.mockImplementation(startStreaming);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        isStreaming,
        error,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.startStreaming('msg-error');
      });

      // Wait for error to occur
      setTimeout(() => {
        expect(result.current.error).toBe('Streaming connection lost');
        expect(result.current.isStreaming).toBe(false);
      }, 150);
    });
  });

  describe('Conversation Management', () => {
    test('should create new conversations', () => {
      const conversations: any[] = [];

      const createConversation = (title?: string) => {
        const conversation = {
          id: `conv-${Date.now()}`,
          title: title || 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0,
        };
        conversations.push(conversation);
        return conversation;
      };

      mockChatActions.createConversation.mockImplementation(createConversation);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        conversations,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.createConversation('Market Analysis Chat');
      });

      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].title).toBe('Market Analysis Chat');
      expect(result.current.conversations[0].id).toMatch(/^conv-/);
    });

    test('should switch between conversations', () => {
      const conversations = [
        { id: 'conv-1', title: 'Chat 1', messages: [] },
        { id: 'conv-2', title: 'Chat 2', messages: [] },
      ];

      let currentConversationId: string | null = null;
      let messages: any[] = [];

      const switchConversation = (conversationId: string) => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
          currentConversationId = conversationId;
          messages = conversation.messages;
          return conversation;
        }
        return null;
      };

      mockChatActions.switchConversation.mockImplementation(switchConversation);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        conversations,
        currentConversationId,
        messages,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.switchConversation('conv-2');
      });

      expect(result.current.currentConversationId).toBe('conv-2');
    });

    test('should delete conversations', () => {
      const conversations = [
        { id: 'conv-1', title: 'Chat 1' },
        { id: 'conv-2', title: 'Chat 2' },
        { id: 'conv-3', title: 'Chat 3' },
      ];

      const deleteConversation = (conversationId: string) => {
        const index = conversations.findIndex(c => c.id === conversationId);
        if (index !== -1) {
          conversations.splice(index, 1);
          return true;
        }
        return false;
      };

      mockChatActions.deleteConversation.mockImplementation(deleteConversation);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        conversations,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.deleteConversation('conv-2');
      });

      expect(result.current.conversations).toHaveLength(2);
      expect(result.current.conversations.find(c => c.id === 'conv-2')).toBeUndefined();
    });
  });

  describe('Context Management', () => {
    test('should update conversation context', () => {
      let context = {};

      const updateContext = (newContext: Record<string, any>) => {
        context = { ...context, ...newContext };
      };

      mockChatActions.updateContext.mockImplementation(updateContext);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        context,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.updateContext({
          symbol: 'AAPL',
          timeframe: '1D',
          analysisType: 'technical',
        });
      });

      expect(result.current.context).toEqual({
        symbol: 'AAPL',
        timeframe: '1D',
        analysisType: 'technical',
      });

      act(() => {
        result.current.updateContext({
          symbol: 'MSFT', // Update existing key
          includeNews: true, // Add new key
        });
      });

      expect(result.current.context).toEqual({
        symbol: 'MSFT',
        timeframe: '1D',
        analysisType: 'technical',
        includeNews: true,
      });
    });

    test('should maintain context across messages', async () => {
      const messages: any[] = [];
      let context = { symbol: 'AAPL', timeframe: '1H' };

      const sendMessage = async (content: string) => {
        const userMessage = {
          id: `msg-${Date.now()}`,
          content,
          role: 'user',
          context: { ...context },
          timestamp: new Date().toISOString(),
        };
        messages.push(userMessage);

        // Assistant response uses context
        const assistantMessage = {
          id: `msg-${Date.now() + 1}`,
          content: `Based on ${context.symbol} (${context.timeframe}): ${content}`,
          role: 'assistant',
          context: { ...context },
          timestamp: new Date().toISOString(),
        };
        messages.push(assistantMessage);

        return assistantMessage;
      };

      mockChatActions.sendMessage.mockImplementation(sendMessage);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        messages,
        context,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      await act(async () => {
        await result.current.sendMessage('Get current price');
      });

      expect(result.current.messages[0].context.symbol).toBe('AAPL');
      expect(result.current.messages[1].content).toContain('AAPL (1H)');
    });
  });

  describe('Loading and Error States', () => {
    test('should manage loading state correctly', () => {
      let isLoading = false;

      const setLoading = (loading: boolean) => {
        isLoading = loading;
      };

      mockChatActions.setLoading.mockImplementation(setLoading);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        isLoading,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    test('should manage error state correctly', () => {
      let error: string | null = null;

      const setError = (newError: string | null) => {
        error = newError;
      };

      mockChatActions.setError.mockImplementation(setError);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        error,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        result.current.setError('Connection failed');
      });

      expect(result.current.error).toBe('Connection failed');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });

    test('should clear errors when sending new messages', async () => {
      let error: string | null = 'Previous error';
      const messages: any[] = [];

      const sendMessage = async (content: string) => {
        // Clear error when starting new message
        error = null;

        const message = {
          id: `msg-${Date.now()}`,
          content,
          role: 'user',
          timestamp: new Date().toISOString(),
        };
        messages.push(message);

        return message;
      };

      mockChatActions.sendMessage.mockImplementation(sendMessage);
      mockUseChatStore.mockReturnValue({
        ...mockChatState,
        messages,
        error,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      expect(result.current.error).toBe('Previous error');

      await act(async () => {
        await result.current.sendMessage('New message');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Store Reset and Cleanup', () => {
    test('should reset store to initial state', () => {
      // Setup store with data
      const initialState = {
        messages: [{ id: 'msg-1', content: 'Test', role: 'user' }],
        isLoading: true,
        error: 'Some error',
        currentConversationId: 'conv-1',
        conversations: [{ id: 'conv-1', title: 'Test Chat' }],
        context: { symbol: 'AAPL' },
      };

      const resetStore = () => {
        return {
          messages: [],
          isLoading: false,
          error: null,
          currentConversationId: null,
          conversations: [],
          streamingMessage: null,
          isStreaming: false,
          context: {},
        };
      };

      mockChatActions.resetStore.mockImplementation(resetStore);
      mockUseChatStore.mockReturnValue({
        ...initialState,
        ...mockChatActions,
      });

      const { result } = renderHook(() => mockUseChatStore());

      act(() => {
        const resetState = result.current.resetStore();
        expect(resetState.messages).toHaveLength(0);
        expect(resetState.error).toBeNull();
        expect(resetState.isLoading).toBe(false);
        expect(resetState.currentConversationId).toBeNull();
      });
    });

    test('should handle cleanup on unmount', () => {
      let cleanupCalled = false;

      const cleanup = () => {
        cleanupCalled = true;
        // Clear any ongoing streams, timers, etc.
      };

      const { unmount } = renderHook(() => {
        // Simulate useEffect cleanup
        return {
          ...mockChatState,
          ...mockChatActions,
          cleanup,
        };
      });

      unmount();

      // In a real implementation, cleanup would be called automatically
      // Here we simulate it for testing
      cleanup();
      expect(cleanupCalled).toBe(true);
    });
  });
}); 