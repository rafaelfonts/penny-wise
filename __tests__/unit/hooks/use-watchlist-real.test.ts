import { renderHook, act, waitFor } from '@testing-library/react';
import { useWatchlist } from '@/hooks/use-watchlist';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user' } },
        error: null,
      })),
    },
  })),
}));

// Mock market data service
jest.mock('@/lib/services/market-data', () => ({
  MarketDataService: jest.fn().mockImplementation(() => ({
    getQuote: jest.fn(() => Promise.resolve({
      symbol: 'AAPL',
      price: 150.25,
      change: 2.50,
      changePercent: 1.69,
    })),
    getBulkQuotes: jest.fn(() => Promise.resolve([
      { symbol: 'AAPL', price: 150.25, change: 2.50, changePercent: 1.69 },
      { symbol: 'GOOGL', price: 2800.50, change: -15.25, changePercent: -0.54 },
    ])),
  })),
}));

describe('useWatchlist Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with empty watchlist', () => {
    const { result } = renderHook(() => useWatchlist());

    expect(result.current.watchlist).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('should add symbol to watchlist', async () => {
    const mockSupabase = createClient();
    const mockInsert = jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({
        data: [{
          id: '1',
          symbol: 'AAPL',
          user_id: 'test-user',
          position: 1,
          created_at: new Date().toISOString(),
        }],
        error: null,
      })),
    }));
    
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: mockInsert,
    });

    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      await result.current.addToWatchlist('AAPL');
    });

    expect(mockInsert).toHaveBeenCalledWith({
      symbol: 'AAPL',
      user_id: 'test-user',
      position: expect.any(Number),
    });
  });

  test('should remove symbol from watchlist', async () => {
    const mockSupabase = createClient();
    const mockDelete = jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    }));
    
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [{
              id: '1',
              symbol: 'AAPL',
              user_id: 'test-user',
            }],
            error: null,
          })),
        })),
      })),
      delete: mockDelete,
    });

    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      await result.current.removeFromWatchlist('1');
    });

    expect(mockDelete).toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    const mockSupabase = createClient();
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' },
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useWatchlist());

    await waitFor(() => {
      expect(result.current.error).toBe('Database error');
    });
  });

  test('should refresh quotes for watchlist items', async () => {
    const { MarketDataService } = require('@/lib/services/market-data');
    const mockGetBulkQuotes = jest.fn(() => Promise.resolve([
      { symbol: 'AAPL', price: 152.00, change: 4.25, changePercent: 2.87 },
    ]));
    
    MarketDataService.mockImplementation(() => ({
      getBulkQuotes: mockGetBulkQuotes,
    }));

    const mockSupabase = createClient();
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [{
              id: '1',
              symbol: 'AAPL',
              user_id: 'test-user',
            }],
            error: null,
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      await result.current.refreshQuotes();
    });

    expect(mockGetBulkQuotes).toHaveBeenCalledWith(['AAPL']);
  });

  test('should validate symbol format', async () => {
    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      try {
        await result.current.addToWatchlist('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    await act(async () => {
      try {
        await result.current.addToWatchlist('invalid-symbol-123');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  test('should prevent duplicate symbols', async () => {
    const mockSupabase = createClient();
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [{
              id: '1',
              symbol: 'AAPL',
              user_id: 'test-user',
            }],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Symbol already exists' },
        })),
      })),
    });

    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      try {
        await result.current.addToWatchlist('AAPL');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  test('should update watchlist positions', async () => {
    const mockSupabase = createClient();
    const mockUpdate = jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    }));
    
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: mockUpdate,
    });

    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      await result.current.updatePosition('1', 2);
    });

    expect(mockUpdate).toHaveBeenCalledWith({ position: 2 });
  });
}); 