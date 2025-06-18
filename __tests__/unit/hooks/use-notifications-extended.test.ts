import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from '@/hooks/use-notifications';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(),
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
      unsubscribe: jest.fn(),
    })),
  })),
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

describe('useNotifications Hook', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(),
            eq: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      channel: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn(),
        })),
        unsubscribe: jest.fn(),
      })),
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State and Loading', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('should fetch notifications on mount', async () => {
      const mockNotifications = [
        {
          id: '1',
          title: 'Price Alert',
          message: 'AAPL reached $150',
          type: 'price_alert',
          priority: 'high',
          read: false,
          created_at: '2024-01-15T10:30:00Z',
          user_id: 'test-user-id',
        },
        {
          id: '2',
          title: 'Market Update',
          message: 'Market opened higher',
          type: 'market_update',
          priority: 'medium',
          read: true,
          created_at: '2024-01-15T09:00:00Z',
          user_id: 'test-user-id',
        },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.unreadCount).toBe(1);
      expect(result.current.notifications[0].title).toBe('Price Alert');
    });

    test('should handle fetch errors gracefully', async () => {
      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.notifications).toEqual([]);
    });
  });

  describe('Creating Notifications', () => {
    test('should create notification successfully', async () => {
      const newNotification = {
        title: 'New Alert',
        message: 'Test notification',
        type: 'info',
        priority: 'medium',
      };

      const createdNotification = {
        id: '3',
        ...newNotification,
        read: false,
        created_at: new Date().toISOString(),
        user_id: 'test-user-id',
      };

      mockSupabase.from().insert().select.mockResolvedValueOnce({
        data: [createdNotification],
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.createNotification(newNotification);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Alert',
          message: 'Test notification',
          type: 'info',
          priority: 'medium',
          user_id: 'test-user-id',
        })
      );
    });

    test('should handle creation errors', async () => {
      mockSupabase.from().insert().select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await expect(
          result.current.createNotification({
            title: 'Test',
            message: 'Test',
            type: 'info',
          })
        ).rejects.toThrow('Insert failed');
      });
    });

    test('should validate notification data before creation', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await expect(
          result.current.createNotification({
            title: '',
            message: 'Test',
            type: 'info',
          })
        ).rejects.toThrow('Title is required');
      });

      await act(async () => {
        await expect(
          result.current.createNotification({
            title: 'Test',
            message: '',
            type: 'info',
          })
        ).rejects.toThrow('Message is required');
      });
    });
  });

  describe('Marking Notifications as Read', () => {
    test('should mark single notification as read', async () => {
      const mockNotifications = [
        {
          id: '1',
          title: 'Test',
          message: 'Test message',
          type: 'info',
          priority: 'medium',
          read: false,
          created_at: '2024-01-15T10:30:00Z',
          user_id: 'test-user-id',
        },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      mockSupabase.from().update().eq().select.mockResolvedValueOnce({
        data: [{ ...mockNotifications[0], read: true }],
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.markAsRead('1');
      });

      expect(mockSupabase.from().update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', '1');
    });

    test('should mark all notifications as read', async () => {
      const mockNotifications = [
        {
          id: '1',
          title: 'Test 1',
          read: false,
          user_id: 'test-user-id',
        },
        {
          id: '2',
          title: 'Test 2',
          read: false,
          user_id: 'test-user-id',
        },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      mockSupabase.from().update().eq().select.mockResolvedValueOnce({
        data: mockNotifications.map(n => ({ ...n, read: true })),
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(mockSupabase.from().update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });
  });

  describe('Deleting Notifications', () => {
    test('should delete single notification', async () => {
      const mockNotifications = [
        {
          id: '1',
          title: 'Test',
          message: 'Test message',
          user_id: 'test-user-id',
        },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteNotification('1');
      });

      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', '1');
    });

    test('should delete all notifications', async () => {
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.deleteAllNotifications();
      });

      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });
  });

  describe('Filtering and Sorting', () => {
    test('should filter notifications by type', async () => {
      const mockNotifications = [
        { id: '1', type: 'price_alert', title: 'Price Alert' },
        { id: '2', type: 'market_update', title: 'Market Update' },
        { id: '3', type: 'price_alert', title: 'Another Price Alert' },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(3);
      });

      act(() => {
        result.current.setFilter({ type: 'price_alert' });
      });

      expect(result.current.filteredNotifications).toHaveLength(2);
      expect(result.current.filteredNotifications.every(n => n.type === 'price_alert')).toBe(true);
    });

    test('should filter notifications by read status', async () => {
      const mockNotifications = [
        { id: '1', read: false, title: 'Unread 1' },
        { id: '2', read: true, title: 'Read 1' },
        { id: '3', read: false, title: 'Unread 2' },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(3);
      });

      act(() => {
        result.current.setFilter({ read: false });
      });

      expect(result.current.filteredNotifications).toHaveLength(2);
      expect(result.current.filteredNotifications.every(n => !n.read)).toBe(true);
    });

    test('should sort notifications by priority', async () => {
      const mockNotifications = [
        { id: '1', priority: 'low', title: 'Low Priority' },
        { id: '2', priority: 'high', title: 'High Priority' },
        { id: '3', priority: 'medium', title: 'Medium Priority' },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(3);
      });

      act(() => {
        result.current.setSortBy('priority');
      });

      const sorted = result.current.sortedNotifications;
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
      expect(sorted[2].priority).toBe('low');
    });
  });

  describe('Real-time Updates', () => {
    test('should subscribe to real-time updates', async () => {
      const mockChannel = {
        on: jest.fn(() => ({
          subscribe: jest.fn(),
        })),
        unsubscribe: jest.fn(),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      renderHook(() => useNotifications());

      expect(mockSupabase.channel).toHaveBeenCalledWith('notifications');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'notifications',
        }),
        expect.any(Function)
      );
    });

    test('should handle real-time insert events', async () => {
      const mockChannel = {
        on: jest.fn((event, config, callback) => {
          // Simulate real-time insert
          setTimeout(() => {
            callback({
              eventType: 'INSERT',
              new: {
                id: '4',
                title: 'Real-time Notification',
                message: 'New notification received',
                type: 'info',
                priority: 'medium',
                read: false,
                created_at: new Date().toISOString(),
                user_id: 'test-user-id',
              },
            });
          }, 100);
          
          return { subscribe: jest.fn() };
        }),
        unsubscribe: jest.fn(),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);
      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].title).toBe('Real-time Notification');
      });
    });

    test('should handle real-time update events', async () => {
      const initialNotification = {
        id: '1',
        title: 'Test',
        read: false,
        user_id: 'test-user-id',
      };

      const mockChannel = {
        on: jest.fn((event, config, callback) => {
          setTimeout(() => {
            callback({
              eventType: 'UPDATE',
              old: initialNotification,
              new: { ...initialNotification, read: true },
            });
          }, 100);
          
          return { subscribe: jest.fn() };
        }),
        unsubscribe: jest.fn(),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);
      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: [initialNotification],
        error: null,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(0);
        expect(result.current.notifications[0].read).toBe(true);
      });
    });
  });

  describe('Auto-refresh and Polling', () => {
    test('should auto-refresh notifications at intervals', async () => {
      mockSupabase.from().select().order().limit
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ 
          data: [{ id: '1', title: 'New notification' }], 
          error: null 
        });

      const { result } = renderHook(() => useNotifications({ autoRefresh: true, refreshInterval: 5000 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(0);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      expect(mockSupabase.from().select().order().limit).toHaveBeenCalledTimes(2);
    });

    test('should stop auto-refresh when component unmounts', async () => {
      const { unmount } = renderHook(() => useNotifications({ autoRefresh: true }));

      unmount();

      // Advance timers to ensure no more calls are made
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should only have been called once during initial load
      expect(mockSupabase.from().select().order().limit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance and Optimization', () => {
    test('should debounce rapid filter changes', async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.setFilter({ type: 'alert' });
        result.current.setFilter({ type: 'update' });
        result.current.setFilter({ type: 'info' });
      });

      // Should only apply the last filter
      expect(result.current.filter.type).toBe('info');
    });

    test('should memoize filtered and sorted results', async () => {
      const mockNotifications = [
        { id: '1', type: 'alert', priority: 'high' },
        { id: '2', type: 'update', priority: 'low' },
      ];

      mockSupabase.from().select().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      const { result, rerender } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      const firstFilteredResult = result.current.filteredNotifications;
      
      // Re-render without changing dependencies
      rerender();
      
      const secondFilteredResult = result.current.filteredNotifications;
      
      // Should be the same reference (memoized)
      expect(firstFilteredResult).toBe(secondFilteredResult);
    });
  });

  describe('Error Recovery', () => {
    test('should retry failed operations', async () => {
      let callCount = 0;
      mockSupabase.from().select().order().limit.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({ data: null, error: { message: 'Network error' } });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const { result } = renderHook(() => useNotifications({ retryAttempts: 3 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(callCount).toBe(3);
      expect(result.current.error).toBeNull();
    });

    test('should handle authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.error).toBe('Not authenticated');
      });
    });
  });
}); 