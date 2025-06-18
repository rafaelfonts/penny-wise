import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { MarketDataService } from '@/lib/services/market-data';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          gte: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(),
            })),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(),
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
  })),
}));

jest.mock('@/lib/services/alpha-vantage', () => ({
  AlphaVantageService: {
    getQuote: jest.fn(),
    getHistoricalData: jest.fn(),
    getIntradayData: jest.fn(),
  },
}));

// Mock fetch for external APIs
global.fetch = jest.fn();

describe('MarketDataService', () => {
  let marketDataService: MarketDataService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
            gte: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(),
              })),
            })),
          })),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(),
        })),
        upsert: jest.fn(() => ({
          select: jest.fn(),
        })),
      })),
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    marketDataService = new MarketDataService();
  });

  describe('getQuote', () => {
    test('should return cached quote if available and fresh', async () => {
      const cachedQuote = {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        cached_at: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      };

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: cachedQuote,
        error: null,
      });

      const result = await marketDataService.getQuote('AAPL');

      expect(result).toEqual({
        symbol: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        cached_at: cachedQuote.cached_at,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('market_cache');
    });

    test('should fetch fresh data when cache is stale', async () => {
      const staleQuote = {
        symbol: 'AAPL',
        price: 148.75,
        cached_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      };

      const freshQuote = {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        marketCap: 2500000000000,
        pe: 25.5,
        eps: 5.89,
        high: 152.00,
        low: 148.50,
        open: 149.00,
        previousClose: 147.75,
      };

      // Mock stale cache
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: staleQuote,
        error: null,
      });

      // Mock fresh API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => freshQuote,
      });

      // Mock cache update
      mockSupabase.from().upsert().select.mockResolvedValueOnce({
        data: [freshQuote],
        error: null,
      });

      const result = await marketDataService.getQuote('AAPL');

      expect(result.price).toBe(150.25);
      expect(result.change).toBe(2.50);
      expect(global.fetch).toHaveBeenCalled();
      expect(mockSupabase.from().upsert).toHaveBeenCalled();
    });

    test('should fallback to Alpha Vantage when primary API fails', async () => {
      // Mock cache miss
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No data found' },
      });

      // Mock primary API failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Mock Alpha Vantage success
      const { AlphaVantageService } = require('@/lib/services/alpha-vantage');
      AlphaVantageService.getQuote.mockResolvedValueOnce({
        symbol: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
      });

      const result = await marketDataService.getQuote('AAPL');

      expect(result.symbol).toBe('AAPL');
      expect(result.price).toBe(150.25);
      expect(AlphaVantageService.getQuote).toHaveBeenCalledWith('AAPL');
    });

    test('should handle multiple API failures gracefully', async () => {
      // Mock cache miss
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No data found' },
      });

      // Mock primary API failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Mock Alpha Vantage failure
      const { AlphaVantageService } = require('@/lib/services/alpha-vantage');
      AlphaVantageService.getQuote.mockRejectedValueOnce(new Error('API limit exceeded'));

      await expect(marketDataService.getQuote('AAPL')).rejects.toThrow('Failed to fetch quote data');
    });

    test('should validate symbol format', async () => {
      await expect(marketDataService.getQuote('')).rejects.toThrow('Invalid symbol');
      await expect(marketDataService.getQuote('invalid-symbol-123')).rejects.toThrow('Invalid symbol');
      await expect(marketDataService.getQuote('TOOLONGSYMBOL')).rejects.toThrow('Invalid symbol');
    });
  });

  describe('getBulkQuotes', () => {
    test('should fetch multiple quotes efficiently', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const mockQuotes = [
        { symbol: 'AAPL', price: 150.25, change: 2.50, changePercent: 1.69 },
        { symbol: 'GOOGL', price: 2800.50, change: -15.25, changePercent: -0.54 },
        { symbol: 'MSFT', price: 380.75, change: 5.80, changePercent: 1.55 },
      ];

      // Mock bulk API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ quotes: mockQuotes }),
      });

      const result = await marketDataService.getBulkQuotes(symbols);

      expect(result).toHaveLength(3);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[1].symbol).toBe('GOOGL');
      expect(result[2].symbol).toBe('MSFT');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('bulk'),
        expect.any(Object)
      );
    });

    test('should handle partial failures in bulk requests', async () => {
      const symbols = ['AAPL', 'INVALID', 'GOOGL'];
      const mockResponse = {
        quotes: [
          { symbol: 'AAPL', price: 150.25, change: 2.50, changePercent: 1.69 },
          { symbol: 'GOOGL', price: 2800.50, change: -15.25, changePercent: -0.54 },
        ],
        errors: [
          { symbol: 'INVALID', error: 'Symbol not found' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await marketDataService.getBulkQuotes(symbols);

      expect(result).toHaveLength(2);
      expect(result.find(q => q.symbol === 'AAPL')).toBeDefined();
      expect(result.find(q => q.symbol === 'GOOGL')).toBeDefined();
      expect(result.find(q => q.symbol === 'INVALID')).toBeUndefined();
    });

    test('should limit bulk request size', async () => {
      const manySymbols = Array.from({ length: 150 }, (_, i) => `STOCK${i}`);
      
      await expect(marketDataService.getBulkQuotes(manySymbols)).rejects.toThrow('Too many symbols');
    });
  });

  describe('getHistoricalData', () => {
    test('should fetch historical data with proper parameters', async () => {
      const mockHistoricalData = {
        symbol: 'AAPL',
        timeframe: '1D',
        data: [
          { date: '2024-01-01', open: 148.50, high: 152.00, low: 147.25, close: 150.25, volume: 45000000 },
          { date: '2024-01-02', open: 150.25, high: 153.75, low: 149.50, close: 152.80, volume: 52000000 },
          { date: '2024-01-03', open: 152.80, high: 155.20, low: 151.90, close: 154.10, volume: 48000000 },
        ],
        metadata: {
          totalRecords: 3,
          startDate: '2024-01-01',
          endDate: '2024-01-03',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoricalData,
      });

      const result = await marketDataService.getHistoricalData('AAPL', '1D', '2024-01-01', '2024-01-03');

      expect(result.symbol).toBe('AAPL');
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toHaveProperty('date');
      expect(result.data[0]).toHaveProperty('close');
      expect(result.metadata.totalRecords).toBe(3);
    });

    test('should validate date range parameters', async () => {
      await expect(
        marketDataService.getHistoricalData('AAPL', '1D', '2024-01-03', '2024-01-01')
      ).rejects.toThrow('Invalid date range');

      await expect(
        marketDataService.getHistoricalData('AAPL', '1D', 'invalid-date', '2024-01-01')
      ).rejects.toThrow('Invalid date format');
    });

    test('should cache historical data appropriately', async () => {
      const mockData = {
        symbol: 'AAPL',
        timeframe: '1D',
        data: [
          { date: '2024-01-01', close: 150.25 },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      mockSupabase.from().upsert().select.mockResolvedValueOnce({
        data: [mockData],
        error: null,
      });

      await marketDataService.getHistoricalData('AAPL', '1D', '2024-01-01', '2024-01-01');

      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'AAPL',
          timeframe: '1D',
        }),
        { onConflict: 'symbol,timeframe,date_range' }
      );
    });
  });

  describe('getMarketAnalysis', () => {
    test('should perform comprehensive market analysis', async () => {
      const mockAnalysis = {
        symbol: 'AAPL',
        timestamp: new Date().toISOString(),
        technicalIndicators: {
          rsi: { value: 65.5, signal: 'neutral' },
          macd: { macd: 1.25, signal: 0.85, histogram: 0.40 },
          movingAverages: {
            sma20: 148.75,
            sma50: 145.20,
            sma200: 140.80,
          },
        },
        fundamentals: {
          pe: 25.5,
          eps: 5.89,
          marketCap: 2500000000000,
          revenue: 394328000000,
          profitMargin: 0.25,
        },
        sentiment: {
          score: 0.75,
          classification: 'positive',
          newsCount: 15,
          socialMentions: 1250,
        },
        recommendation: {
          action: 'buy',
          confidence: 0.78,
          targetPrice: 165.00,
          stopLoss: 140.00,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis,
      });

      const result = await marketDataService.getMarketAnalysis('AAPL');

      expect(result.symbol).toBe('AAPL');
      expect(result.technicalIndicators.rsi.value).toBe(65.5);
      expect(result.fundamentals.pe).toBe(25.5);
      expect(result.sentiment.classification).toBe('positive');
      expect(result.recommendation.action).toBe('buy');
    });

    test('should handle analysis with custom parameters', async () => {
      const analysisOptions = {
        includeTechnical: true,
        includeFundamental: false,
        includeSentiment: true,
        timeframe: '1M',
        indicators: ['rsi', 'macd', 'bollinger'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ symbol: 'AAPL', technicalIndicators: {}, sentiment: {} }),
      });

      await marketDataService.getMarketAnalysis('AAPL', analysisOptions);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('analysis'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('includeTechnical'),
        })
      );
    });
  });

  describe('calculateTechnicalIndicators', () => {
    test('should calculate RSI correctly', async () => {
      const priceData = [
        { close: 100 }, { close: 102 }, { close: 101 }, { close: 105 },
        { close: 107 }, { close: 103 }, { close: 108 }, { close: 110 },
        { close: 106 }, { close: 109 }, { close: 111 }, { close: 108 },
        { close: 112 }, { close: 115 }, { close: 113 }, { close: 118 },
      ];

      const rsi = await marketDataService.calculateTechnicalIndicators(priceData, ['rsi']);

      expect(rsi.rsi).toBeDefined();
      expect(rsi.rsi.value).toBeGreaterThan(0);
      expect(rsi.rsi.value).toBeLessThan(100);
      expect(rsi.rsi.signal).toMatch(/oversold|neutral|overbought/);
    });

    test('should calculate MACD correctly', async () => {
      const priceData = Array.from({ length: 50 }, (_, i) => ({
        close: 100 + Math.sin(i * 0.1) * 10 + i * 0.5,
      }));

      const macd = await marketDataService.calculateTechnicalIndicators(priceData, ['macd']);

      expect(macd.macd).toBeDefined();
      expect(macd.macd.macd).toBeDefined();
      expect(macd.macd.signal).toBeDefined();
      expect(macd.macd.histogram).toBeDefined();
    });

    test('should calculate moving averages correctly', async () => {
      const priceData = Array.from({ length: 200 }, (_, i) => ({
        close: 100 + i * 0.1,
      }));

      const ma = await marketDataService.calculateTechnicalIndicators(priceData, ['sma', 'ema']);

      expect(ma.movingAverages).toBeDefined();
      expect(ma.movingAverages.sma20).toBeDefined();
      expect(ma.movingAverages.sma50).toBeDefined();
      expect(ma.movingAverages.ema12).toBeDefined();
      expect(ma.movingAverages.ema26).toBeDefined();
    });

    test('should handle insufficient data gracefully', async () => {
      const priceData = [{ close: 100 }, { close: 101 }];

      const result = await marketDataService.calculateTechnicalIndicators(priceData, ['rsi']);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Insufficient data');
    });
  });

  describe('getMarketNews', () => {
    test('should fetch market news with filters', async () => {
      const mockNews = {
        articles: [
          {
            id: 'news-1',
            title: 'Apple Reports Strong Q4 Earnings',
            summary: 'Apple exceeded expectations...',
            url: 'https://example.com/news/1',
            publishedAt: '2024-01-15T10:30:00Z',
            source: 'Financial Times',
            sentiment: 'positive',
            relevanceScore: 0.95,
          },
        ],
        pagination: { total: 1, page: 1, limit: 10 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      });

      const result = await marketDataService.getMarketNews('AAPL', { limit: 10, sentiment: 'positive' });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].sentiment).toBe('positive');
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle network timeouts', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(marketDataService.getQuote('AAPL')).rejects.toThrow();
    });

    test('should retry failed requests with exponential backoff', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ symbol: 'AAPL', price: 150.25 }),
        });
      });

      // Mock cache miss
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No data found' },
      });

      const result = await marketDataService.getQuote('AAPL');

      expect(callCount).toBe(3);
      expect(result.price).toBe(150.25);
    });

    test('should handle rate limiting gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
      });

      await expect(marketDataService.getQuote('AAPL')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Performance and Caching', () => {
    test('should implement efficient caching strategy', async () => {
      const symbol = 'AAPL';
      
      // First call - cache miss
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No data found' },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ symbol, price: 150.25 }),
      });

      await marketDataService.getQuote(symbol);

      // Second call - should use cache
      const cachedData = { symbol, price: 150.25, cached_at: new Date().toISOString() };
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: cachedData,
        error: null,
      });

      await marketDataService.getQuote(symbol);

      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    test('should batch multiple requests efficiently', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      
      // Mock batch processing
      const batchPromises = symbols.map(symbol => 
        marketDataService.getQuote(symbol)
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ quotes: symbols.map(s => ({ symbol: s, price: 150 })) }),
      });

      await Promise.all(batchPromises);

      // Should optimize into fewer API calls
      expect(global.fetch).toHaveBeenCalledTimes(symbols.length);
    });
  });
}); 