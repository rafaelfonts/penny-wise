// Mock NextResponse before importing the route
const mockNextResponse = {
  json: jest.fn().mockImplementation((data, options) => ({
    json: jest.fn().mockResolvedValue(data),
    status: options?.status || 200,
    headers: options?.headers || {},
  })),
  redirect: jest.fn(),
  rewrite: jest.fn(),
};

jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(Object.entries(options?.headers || {})),
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    searchParams: new URLSearchParams(new URL(url).search),
    nextUrl: new URL(url),
  })),
  NextResponse: mockNextResponse,
}));

import { NextRequest } from "next/server";
import { GET, POST } from '@/app/api/market/oplab/route';

// Mock external dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }),
    },
  })),
}));

jest.mock('@/lib/utils/error-handler', () => ({
  handleApiError: jest.fn((error, context) => {
    return Response.json(
      { error: error.message || 'Internal server error', context },
      { status: 500 }
    );
  }),
}));

// Mock fetch for external API calls
global.fetch = jest.fn();

describe('OPLAB API Route Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET /api/market/oplab', () => {
    test('should handle quote requests successfully', async () => {
      const mockQuoteResponse = {
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuoteResponse,
      });

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=quote&symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
      expect(data.price).toBe(150.25);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('quote'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });

    test('should handle bulk quote requests', async () => {
      const mockBulkResponse = {
        quotes: [
          { symbol: 'AAPL', price: 150.25, change: 2.50, changePercent: 1.69 },
          { symbol: 'GOOGL', price: 2800.50, change: -15.25, changePercent: -0.54 },
          { symbol: 'MSFT', price: 380.75, change: 5.80, changePercent: 1.55 },
        ],
        timestamp: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBulkResponse,
      });

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=bulk_quote&symbols=AAPL,GOOGL,MSFT');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotes).toHaveLength(3);
      expect(data.quotes[0].symbol).toBe('AAPL');
      expect(data.quotes[1].symbol).toBe('GOOGL');
      expect(data.quotes[2].symbol).toBe('MSFT');
    });

    test('should handle historical data requests', async () => {
      const mockHistoricalData = {
        symbol: 'AAPL',
        timeframe: '1M',
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

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=historical&symbol=AAPL&period=1M');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
      expect(data.data).toHaveLength(3);
      expect(data.data[0]).toHaveProperty('date');
      expect(data.data[0]).toHaveProperty('close');
      expect(data.metadata.totalRecords).toBe(3);
    });

    test('should handle options chain requests', async () => {
      const mockOptionsData = {
        symbol: 'AAPL',
        underlyingPrice: 150.25,
        expirationDates: ['2024-02-16', '2024-03-15', '2024-04-19'],
        options: {
          calls: [
            { 
              strike: 150, 
              bid: 5.25, 
              ask: 5.50, 
              volume: 1250, 
              openInterest: 5000,
              impliedVolatility: 0.28,
              delta: 0.52,
              gamma: 0.03,
              theta: -0.15,
              vega: 0.25
            },
            { 
              strike: 155, 
              bid: 2.75, 
              ask: 3.00, 
              volume: 850, 
              openInterest: 3200,
              impliedVolatility: 0.31,
              delta: 0.35,
              gamma: 0.04,
              theta: -0.18,
              vega: 0.22
            },
          ],
          puts: [
            { 
              strike: 150, 
              bid: 4.50, 
              ask: 4.75, 
              volume: 950, 
              openInterest: 4100,
              impliedVolatility: 0.29,
              delta: -0.48,
              gamma: 0.03,
              theta: -0.14,
              vega: 0.24
            },
            { 
              strike: 145, 
              bid: 2.25, 
              ask: 2.50, 
              volume: 650, 
              openInterest: 2800,
              impliedVolatility: 0.26,
              delta: -0.28,
              gamma: 0.02,
              theta: -0.12,
              vega: 0.20
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOptionsData,
      });

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=options&symbol=AAPL&expiration=2024-02-16');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
      expect(data.underlyingPrice).toBe(150.25);
      expect(data.options.calls).toHaveLength(2);
      expect(data.options.puts).toHaveLength(2);
      expect(data.expirationDates).toContain('2024-02-16');
      expect(data.options.calls[0]).toHaveProperty('delta');
      expect(data.options.puts[0]).toHaveProperty('impliedVolatility');
    });

    test('should handle market news requests', async () => {
      const mockNewsData = {
        articles: [
          {
            id: 'news-1',
            title: 'Apple Reports Strong Q4 Earnings',
            summary: 'Apple exceeded expectations with record revenue of $123.9 billion...',
            url: 'https://example.com/news/1',
            publishedAt: '2024-01-15T10:30:00Z',
            source: 'Financial Times',
            sentiment: 'positive',
            relevanceScore: 0.95,
            categories: ['earnings', 'technology'],
            relatedSymbols: ['AAPL'],
          },
          {
            id: 'news-2',
            title: 'Tech Stocks Rally on Fed Decision',
            summary: 'Technology stocks surged following the Federal Reserve decision...',
            url: 'https://example.com/news/2',
            publishedAt: '2024-01-15T09:15:00Z',
            source: 'Reuters',
            sentiment: 'positive',
            relevanceScore: 0.87,
            categories: ['federal-reserve', 'technology'],
            relatedSymbols: ['AAPL', 'GOOGL', 'MSFT'],
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsData,
      });

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=news&symbol=AAPL&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.articles).toHaveLength(2);
      expect(data.articles[0]).toHaveProperty('title');
      expect(data.articles[0]).toHaveProperty('sentiment');
      expect(data.articles[0].sentiment).toBe('positive');
      expect(data.pagination.total).toBe(2);
    });

    test('should handle technical analysis requests', async () => {
      const mockTechnicalData = {
        symbol: 'AAPL',
        timestamp: new Date().toISOString(),
        indicators: {
          rsi: {
            value: 65.5,
            signal: 'neutral',
            period: 14,
          },
          macd: {
            macd: 1.25,
            signal: 0.85,
            histogram: 0.40,
            interpretation: 'bullish_crossover',
          },
          movingAverages: {
            sma20: 148.75,
            sma50: 145.20,
            sma200: 140.80,
            ema12: 149.80,
            ema26: 147.30,
          },
          bollinger: {
            upper: 155.25,
            middle: 150.00,
            lower: 144.75,
            bandwidth: 0.07,
            percentB: 0.52,
          },
          stochastic: {
            k: 72.5,
            d: 68.3,
            signal: 'overbought',
          },
        },
        signals: {
          trend: 'bullish',
          strength: 'moderate',
          recommendation: 'buy',
          confidence: 0.78,
          supportLevels: [145.50, 142.80, 140.00],
          resistanceLevels: [155.00, 158.25, 162.50],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTechnicalData,
      });

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=technical&symbol=AAPL&indicators=rsi,macd,sma');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
      expect(data.indicators.rsi.value).toBe(65.5);
      expect(data.indicators.macd).toHaveProperty('macd');
      expect(data.signals.trend).toBe('bullish');
      expect(data.signals.confidence).toBe(0.78);
    });

    test('should return 400 for missing action parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/oplab');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('action');
    });

    test('should return 400 for invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=invalid_action');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    test('should return 400 for missing symbol in quote request', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=quote');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('symbol');
    });

    test('should handle API rate limiting', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded', retryAfter: 60 }),
      });

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=quote&symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit');
    });

    test('should handle external API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'External API error' }),
      });

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=quote&symbol=AAPL');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    test('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=quote&symbol=AAPL');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/market/oplab', () => {
    test('should handle portfolio analysis requests', async () => {
      const mockPortfolioData = {
        portfolio: {
          totalValue: 125000,
          totalGainLoss: 15000,
          totalGainLossPercent: 13.64,
          dayChange: 2500,
          dayChangePercent: 2.04,
          positions: [
            {
              symbol: 'AAPL',
              shares: 100,
              avgCost: 140.50,
              currentPrice: 150.25,
              value: 15025,
              gainLoss: 975,
              gainLossPercent: 6.94,
              dayChange: 250,
              dayChangePercent: 1.69,
              weight: 12.02,
            },
            {
              symbol: 'GOOGL',
              shares: 25,
              avgCost: 2750.00,
              currentPrice: 2800.50,
              value: 70012.50,
              gainLoss: 1262.50,
              gainLossPercent: 1.84,
              dayChange: -381.25,
              dayChangePercent: -0.54,
              weight: 56.01,
            },
          ],
          allocation: {
            sectors: {
              'Technology': 85.5,
              'Healthcare': 10.2,
              'Finance': 4.3,
            },
            assets: {
              'Stocks': 92.5,
              'Cash': 7.5,
            },
          },
          metrics: {
            beta: 1.15,
            sharpeRatio: 1.25,
            volatility: 18.5,
            maxDrawdown: -12.3,
            alpha: 2.8,
            informationRatio: 0.95,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPortfolioData,
      });

      const portfolioRequest = {
        action: 'portfolio_analysis',
        positions: [
          { symbol: 'AAPL', shares: 100, avgCost: 140.50 },
          { symbol: 'GOOGL', shares: 25, avgCost: 2750.00 },
        ],
        benchmark: 'SPY',
        timeframe: '1Y',
      };

      const request = new NextRequest('http://localhost:3000/api/market/oplab', {
        method: 'POST',
        body: JSON.stringify(portfolioRequest),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.portfolio.totalValue).toBe(125000);
      expect(data.portfolio.positions).toHaveLength(2);
      expect(data.portfolio.metrics).toHaveProperty('beta');
      expect(data.portfolio.metrics.sharpeRatio).toBe(1.25);
    });

    test('should handle options strategy analysis', async () => {
      const mockStrategyData = {
        strategy: {
          name: 'Covered Call',
          type: 'income',
          complexity: 'beginner',
          legs: [
            { 
              action: 'buy', 
              type: 'stock', 
              symbol: 'AAPL', 
              quantity: 100, 
              price: 150.25,
              cost: 15025
            },
            { 
              action: 'sell', 
              type: 'call', 
              symbol: 'AAPL', 
              strike: 155, 
              expiration: '2024-02-16', 
              quantity: 1, 
              price: 3.50,
              premium: 350
            },
          ],
          analysis: {
            maxProfit: 850,
            maxLoss: -14675,
            breakeven: 146.75,
            probabilityOfProfit: 0.65,
            expectedReturn: 5.8,
            riskReward: 0.058,
            timeDecay: 'positive',
            volatilityImpact: 'negative',
          },
          greeks: {
            delta: 0.85,
            gamma: 0.02,
            theta: -0.15,
            vega: 0.25,
            rho: 0.08,
          },
          scenarios: [
            { price: 140, profit: -1475, probability: 0.15 },
            { price: 150, profit: 475, probability: 0.35 },
            { price: 155, profit: 850, probability: 0.30 },
            { price: 160, profit: 850, probability: 0.20 },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStrategyData,
      });

      const strategyRequest = {
        action: 'options_strategy',
        strategy: 'covered_call',
        symbol: 'AAPL',
        legs: [
          { action: 'buy', type: 'stock', quantity: 100 },
          { action: 'sell', type: 'call', strike: 155, expiration: '2024-02-16', quantity: 1 },
        ],
        analysis: {
          includeGreeks: true,
          includeScenarios: true,
          volatilityRange: [0.20, 0.40],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/market/oplab', {
        method: 'POST',
        body: JSON.stringify(strategyRequest),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.strategy.name).toBe('Covered Call');
      expect(data.strategy.legs).toHaveLength(2);
      expect(data.strategy.analysis).toHaveProperty('maxProfit');
      expect(data.strategy.greeks).toHaveProperty('delta');
      expect(data.strategy.scenarios).toHaveLength(4);
    });

    test('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/oplab', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    test('should return 400 for missing action in POST body', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/oplab', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('action');
    });
  });

  describe('Authentication and Authorization', () => {
    test('should handle authenticated requests', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ symbol: 'AAPL', price: 150.25 }),
      });

      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=quote&symbol=AAPL');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });
  });

  describe('Data Validation and Sanitization', () => {
    test('should validate symbol format', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=quote&symbol=invalid-symbol-123!@#');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid symbol format');
    });

    test('should validate date parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=historical&symbol=AAPL&from=invalid-date&to=also-invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });

    test('should validate numeric parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/oplab?action=news&symbol=AAPL&limit=not-a-number');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid limit parameter');
    });
  });
});
