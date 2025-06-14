import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import marketDataService from '@/lib/services/market-data';
import type { StockQuote } from '@/lib/types/market';

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  market: string;
  alerts: Record<string, unknown>;
  notes: string | null;
  position: number | null;
  created_at: string;
  updated_at: string;
  quote?: StockQuote | null;
  isLoading?: boolean;
}

export interface UseWatchlistReturn {
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  addSymbol: (symbol: string) => Promise<boolean>;
  removeSymbol: (symbol: string) => Promise<boolean>;
  updatePosition: (symbol: string, position: number) => Promise<boolean>;
  refreshQuote: (symbol: string) => Promise<boolean>;
  refreshAll: () => Promise<void>;
  reorderWatchlist: (startIndex: number, endIndex: number) => Promise<boolean>;
}

export function useWatchlist(): UseWatchlistReturn {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch watchlist from database
  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('User not authenticated');
        return;
      }

      const { data, error: dbError } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', session.user.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (dbError) {
        setError(dbError.message);
        return;
      }

      // Transform database data to match our interface
      const transformedData: WatchlistItem[] = (data || []).map(item => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name || item.symbol, // Fallback to symbol if name is null
        market: item.market || 'US',
        alerts:
          typeof item.alerts === 'object' && item.alerts !== null
            ? (item.alerts as Record<string, unknown>)
            : {},
        notes: item.notes,
        position: item.position,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        quote: null,
        isLoading: false,
      }));

      setWatchlist(transformedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch watchlist'
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Add symbol to watchlist
  const addSymbol = useCallback(
    async (symbol: string): Promise<boolean> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError('User not authenticated');
          return false;
        }

        // First get quote to validate symbol and get name
        const quoteResponse = await marketDataService.getQuote(
          symbol.toUpperCase()
        );
        if (!quoteResponse.success || !quoteResponse.data) {
          setError('Symbol not found or invalid');
          return false;
        }

        const quote = quoteResponse.data;

        // Check if symbol already exists
        const { data: existing } = await supabase
          .from('watchlist')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('symbol', quote.symbol)
          .single();

        if (existing) {
          setError('Symbol already in watchlist');
          return false;
        }

        // Get current max position
        const { data: maxPosData } = await supabase
          .from('watchlist')
          .select('position')
          .eq('user_id', session.user.id)
          .order('position', { ascending: false, nullsFirst: false })
          .limit(1);

        const nextPosition = (maxPosData?.[0]?.position || 0) + 1;

        // Insert new watchlist item
        const { data, error: insertError } = await supabase
          .from('watchlist')
          .insert({
            user_id: session.user.id,
            symbol: quote.symbol,
            name: quote.name,
            market: quote.source.toUpperCase(),
            position: nextPosition,
            alerts: {},
            notes: null,
          })
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          return false;
        }

        // Update local state
        const newItem: WatchlistItem = {
          id: data.id,
          symbol: data.symbol,
          name: data.name || quote.name,
          market: data.market || 'US',
          alerts:
            typeof data.alerts === 'object' && data.alerts !== null
              ? (data.alerts as Record<string, unknown>)
              : {},
          notes: data.notes,
          position: data.position,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          quote,
          isLoading: false,
        };

        setWatchlist(prev => [newItem, ...prev]);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add symbol');
        return false;
      }
    },
    [supabase]
  );

  // Remove symbol from watchlist
  const removeSymbol = useCallback(
    async (symbol: string): Promise<boolean> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return false;

        const { error: deleteError } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', session.user.id)
          .eq('symbol', symbol);

        if (deleteError) {
          setError(deleteError.message);
          return false;
        }

        setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to remove symbol'
        );
        return false;
      }
    },
    [supabase]
  );

  // Update position
  const updatePosition = useCallback(
    async (symbol: string, position: number): Promise<boolean> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return false;

        const { error: updateError } = await supabase
          .from('watchlist')
          .update({ position })
          .eq('user_id', session.user.id)
          .eq('symbol', symbol);

        if (updateError) {
          setError(updateError.message);
          return false;
        }

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update position'
        );
        return false;
      }
    },
    [supabase]
  );

  // Refresh quote for single symbol
  const refreshQuote = useCallback(async (symbol: string): Promise<boolean> => {
    try {
      // Set loading state
      setWatchlist(prev =>
        prev.map(item =>
          item.symbol === symbol ? { ...item, isLoading: true } : item
        )
      );

      const response = await marketDataService.getQuote(symbol);

      if (response.success && response.data) {
        setWatchlist(prev =>
          prev.map(item =>
            item.symbol === symbol
              ? { ...item, quote: response.data, isLoading: false }
              : item
          )
        );
        return true;
      } else {
        setWatchlist(prev =>
          prev.map(item =>
            item.symbol === symbol ? { ...item, isLoading: false } : item
          )
        );
        return false;
      }
    } catch {
      setWatchlist(prev =>
        prev.map(item =>
          item.symbol === symbol ? { ...item, isLoading: false } : item
        )
      );
      return false;
    }
  }, []);

  // Refresh all quotes
  const refreshAll = useCallback(async () => {
    const symbols = watchlist.map(item => item.symbol);

    // Set all to loading
    setWatchlist(prev => prev.map(item => ({ ...item, isLoading: true })));

    try {
      const response = await marketDataService.getMultipleQuotes(symbols);

      if (response.success && response.data) {
        const quotesMap = new Map(
          response.data.map((quote: StockQuote) => [quote.symbol, quote])
        );

        setWatchlist(prev =>
          prev.map(item => ({
            ...item,
            quote: quotesMap.get(item.symbol) || item.quote || null,
            isLoading: false,
          }))
        );
      } else {
        // Remove loading state on error
        setWatchlist(prev => prev.map(item => ({ ...item, isLoading: false })));
      }
    } catch {
      setWatchlist(prev => prev.map(item => ({ ...item, isLoading: false })));
    }
  }, [watchlist]);

  // Reorder watchlist
  const reorderWatchlist = useCallback(
    async (startIndex: number, endIndex: number): Promise<boolean> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return false;

        const reorderedItems = Array.from(watchlist);
        const [removed] = reorderedItems.splice(startIndex, 1);
        reorderedItems.splice(endIndex, 0, removed);

        // Update positions in database
        const updates = reorderedItems.map((item, index) => ({
          id: item.id,
          symbol: item.symbol,
          position: index + 1,
        }));

        const { error: updateError } = await supabase
          .from('watchlist')
          .upsert(updates);

        if (updateError) {
          setError(updateError.message);
          return false;
        }

        // Update local state with new positions
        setWatchlist(
          reorderedItems.map((item, index) => ({
            ...item,
            position: index + 1,
          }))
        );

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to reorder watchlist'
        );
        return false;
      }
    },
    [watchlist, supabase]
  );

  // Load watchlist on mount
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Auto-refresh quotes every 5 minutes
  useEffect(() => {
    if (watchlist.length === 0) return;

    const interval = setInterval(
      () => {
        refreshAll();
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [watchlist.length, refreshAll]);

  return {
    watchlist,
    loading,
    error,
    addSymbol,
    removeSymbol,
    updatePosition,
    refreshQuote,
    refreshAll,
    reorderWatchlist,
  };
}
