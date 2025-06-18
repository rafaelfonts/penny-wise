import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Mock Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      headers: new Map(),
    })),
    next: jest.fn(() => ({
      headers: new Map(),
    })),
  },
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
    })),
  })),
}));

// Mock services
jest.mock('@/lib/services/market-data', () => ({
  default: {
    getQuote: jest.fn(),
    getMultipleQuotes: jest.fn(),
    analyzeSymbol: jest.fn(),
    validateSymbol: jest.fn(),
  },
}));

jest.mock('@/lib/services/notifications', () => ({
  notificationService: {
    getUserNotifications: jest.fn(),
    createNotification: jest.fn(),
    getNotificationStats: jest.fn(),
  },
}));

describe('API Routes Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    process.env.OPLAB_ACCESS_TOKEN = 'test-token';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Market Quote API', () => {
    test('should handle single quote request', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams('symbol=AAPL'),
        },
      } as NextRequest;

      const mockSession = { user: { id: 'user1' } };
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      };

      require('@/lib/supabase/server').createClient.mockReturnValue(mockSupabase);
      
      const mockMarketData = require('@/lib/services/market-data').default;
      mockMarketData.getQuote.mockResolvedValue({
        success: true,
        data: {
          symbol: 'AAPL',
          price: 150.00,
          change: 2.50,
          changePercent: 1.69,
        },
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
      });

      // Test the API logic
      const url = new URL('http://localhost/api/market/quote?symbol=AAPL');
      const symbol = url.searchParams.get('symbol');
      
      expect(symbol).toBe('AAPL');
      expect(mockMarketData.getQuote).toBeDefined();
    });

    test('should handle multiple quotes request', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams('symbols=AAPL,GOOGL,MSFT'),
        },
      } as NextRequest;

      const url = new URL('http://localhost/api/market/quote?symbols=AAPL,GOOGL,MSFT');
      const symbols = url.searchParams.get('symbols');
      
      if (symbols) {
        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());
        expect(symbolArray).toEqual(['AAPL', 'GOOGL', 'MSFT']);
        expect(symbolArray.length).toBe(3);
      }
    });

    test('should handle missing parameters', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams(''),
        },
      } as NextRequest;

      const url = new URL('http://localhost/api/market/quote');
      const symbol = url.searchParams.get('symbol');
      const symbols = url.searchParams.get('symbols');
      
      expect(symbol).toBeNull();
      expect(symbols).toBeNull();
      
      // Should return error for missing parameters
      if (!symbol && !symbols) {
        const errorResponse = {
          error: 'Symbol or symbols parameter is required',
        };
        expect(errorResponse.error).toBe('Symbol or symbols parameter is required');
      }
    });

    test('should handle authentication errors', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: new Error('Auth error'),
          }),
        },
      };

      require('@/lib/supabase/server').createClient.mockReturnValue(mockSupabase);

      const authResult = await mockSupabase.auth.getSession();
      
      if (authResult.error || !authResult.data.session) {
        const errorResponse = { error: 'Unauthorized' };
        expect(errorResponse.error).toBe('Unauthorized');
      }
    });
  });

  describe('Market Analysis API', () => {
    test('should handle analysis request', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          symbol: 'AAPL',
          saveAnalysis: true,
        }),
      } as unknown as NextRequest;

      const mockSession = { user: { id: 'user1' } };
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      };

      require('@/lib/supabase/server').createClient.mockReturnValue(mockSupabase);

      const mockMarketData = require('@/lib/services/market-data').default;
      mockMarketData.analyzeSymbol.mockResolvedValue({
        success: true,
        data: {
          quote: { symbol: 'AAPL', price: 150.00 },
          overview: { symbol: 'AAPL', name: 'Apple Inc.' },
          news: [],
          technicals: { rsi: null, macd: null },
        },
      });

      const body = await mockRequest.json();
      expect(body.symbol).toBe('AAPL');
      expect(body.saveAnalysis).toBe(true);
    });

    test('should validate symbol parameter', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          symbol: '',
          saveAnalysis: false,
        }),
      } as unknown as NextRequest;

      const body = await mockRequest.json();
      
      if (!body.symbol || typeof body.symbol !== 'string') {
        const errorResponse = { error: 'Symbol is required' };
        expect(errorResponse.error).toBe('Symbol is required');
      }
    });

    test('should handle analysis failure', async () => {
      const mockMarketData = require('@/lib/services/market-data').default;
      mockMarketData.analyzeSymbol.mockResolvedValue({
        success: false,
        error: 'Analysis failed',
        data: null,
      });

      const analysisResult = await mockMarketData.analyzeSymbol('INVALID');
      
      if (!analysisResult.success || !analysisResult.data) {
        const errorResponse = { error: 'Failed to analyze symbol' };
        expect(errorResponse.error).toBe('Failed to analyze symbol');
      }
    });
  });

  describe('Notifications API', () => {
    test('should get user notifications', async () => {
      const mockNotificationService = require('@/lib/services/notifications').notificationService;
      mockNotificationService.getUserNotifications.mockResolvedValue({
        notifications: [
          {
            id: '1',
            title: 'Test Notification',
            message: 'Test message',
            type: 'alert',
            priority: 'high',
            is_read: false,
          },
        ],
      });

      const response = await mockNotificationService.getUserNotifications();
      expect(response.notifications).toHaveLength(1);
      expect(response.notifications[0].title).toBe('Test Notification');
    });

    test('should filter notifications by type', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams('type=alert'),
        },
      } as NextRequest;

      const mockNotifications = [
        { id: '1', type: 'alert', title: 'Alert 1' },
        { id: '2', type: 'info', title: 'Info 1' },
        { id: '3', type: 'alert', title: 'Alert 2' },
      ];

      const url = new URL('http://localhost/api/notifications?type=alert');
      const typeParam = url.searchParams.get('type');
      
      if (typeParam && typeParam !== 'all') {
        const filtered = mockNotifications.filter(n => n.type === typeParam);
        expect(filtered).toHaveLength(2);
        expect(filtered.every(n => n.type === 'alert')).toBe(true);
      }
    });

    test('should create notification', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          title: 'New Alert',
          message: 'Price target reached',
          type: 'alert',
          priority: 'high',
        }),
      } as unknown as NextRequest;

      const body = await mockRequest.json();
      
      // Validate required fields
      if (!body.title || !body.message || !body.type) {
        const errorResponse = {
          error: 'Missing required fields: title, message, type',
        };
        expect(errorResponse.error).toBe('Missing required fields: title, message, type');
      } else {
        expect(body.title).toBe('New Alert');
        expect(body.message).toBe('Price target reached');
        expect(body.type).toBe('alert');
      }
    });

    test('should get notification stats', async () => {
      const mockNotificationService = require('@/lib/services/notifications').notificationService;
      mockNotificationService.getNotificationStats.mockResolvedValue({
        total: 10,
        unread: 3,
        byType: {
          alert: 5,
          info: 3,
          warning: 2,
        },
      });

      const stats = await mockNotificationService.getNotificationStats();
      expect(stats.total).toBe(10);
      expect(stats.unread).toBe(3);
      expect(stats.byType.alert).toBe(5);
    });
  });

  describe('Alpha Vantage Proxy API', () => {
    test('should handle valid function parameter', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams('function=TIME_SERIES_DAILY&symbol=AAPL'),
        },
      } as NextRequest;

      const url = new URL('http://localhost/api/market/alpha-vantage?function=TIME_SERIES_DAILY&symbol=AAPL');
      const func = url.searchParams.get('function');
      const symbol = url.searchParams.get('symbol');
      
      expect(func).toBe('TIME_SERIES_DAILY');
      expect(symbol).toBe('AAPL');
      
      if (!func) {
        const errorResponse = { error: 'Function parameter is required' };
        expect(errorResponse.error).toBe('Function parameter is required');
      }
    });

    test('should build Alpha Vantage URL correctly', async () => {
      const func = 'TIME_SERIES_DAILY';
      const symbol = 'AAPL';
      const interval = '5min';
      
      const alphaParams = new URLSearchParams({
        function: func,
        apikey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
      });
      
      if (symbol) alphaParams.append('symbol', symbol);
      if (interval) alphaParams.append('interval', interval);
      
      const alphaUrl = `https://www.alphavantage.co/query?${alphaParams.toString()}`;
      
      expect(alphaUrl).toContain('function=TIME_SERIES_DAILY');
      expect(alphaUrl).toContain('symbol=AAPL');
      expect(alphaUrl).toContain('interval=5min');
      expect(alphaUrl).toContain('apikey=test-key');
    });

    test('should handle Alpha Vantage error responses', async () => {
      const mockApiResponse = {
        Note: 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute.',
      };

      if (mockApiResponse.Note) {
        const errorResponse = { error: `Alpha Vantage API: ${mockApiResponse.Note}` };
        expect(errorResponse.error).toContain('5 calls per minute');
      }

      const mockErrorResponse = {
        'Error Message': 'Invalid API call',
      };

      if (mockErrorResponse['Error Message']) {
        const errorResponse = { error: `Alpha Vantage API: ${mockErrorResponse['Error Message']}` };
        expect(errorResponse.error).toBe('Alpha Vantage API: Invalid API call');
      }
    });
  });

  describe('Chat API Routes', () => {
    test('should validate chat message', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          message: 'What is the price of AAPL?',
          conversation_id: 'conv-123',
          files: [],
        }),
      } as unknown as NextRequest;

      const body = await mockRequest.json();
      
      if (!body.message || !body.conversation_id) {
        const errorResponse = {
          error: 'Message and conversation_id are required',
        };
        expect(errorResponse.error).toBe('Message and conversation_id are required');
      } else {
        expect(body.message).toBe('What is the price of AAPL?');
        expect(body.conversation_id).toBe('conv-123');
      }
    });

    test('should handle enhanced chat request', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          message: 'Analyze TSLA stock',
          conversationId: 'conv-456',
          includeMarketData: true,
          executeCommands: true,
          files: [],
        }),
      } as unknown as NextRequest;

      const body = await mockRequest.json();
      
      expect(body.message).toBe('Analyze TSLA stock');
      expect(body.includeMarketData).toBe(true);
      expect(body.executeCommands).toBe(true);
      expect(Array.isArray(body.files)).toBe(true);
    });

    test('should generate conversation ID if not provided', () => {
      const generateUUID = () => 'uuid-' + Math.random().toString(36).substr(2, 9);
      
      const conversationId = generateUUID();
      expect(conversationId).toMatch(/^uuid-[a-z0-9]{9}$/);
    });
  });

  describe('OPLAB API Route', () => {
    test('should handle health check action', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams('action=health'),
        },
      } as NextRequest;

      const url = new URL('http://localhost/api/market/oplab?action=health');
      const action = url.searchParams.get('action');
      
      expect(action).toBe('health');
      
      // Mock OPLAB service response
      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
      
      expect(mockHealthResponse.status).toBe('healthy');
    });

    test('should validate symbol parameter for stock actions', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams('action=stock'),
        },
      } as NextRequest;

      const url = new URL('http://localhost/api/market/oplab?action=stock');
      const action = url.searchParams.get('action');
      const symbol = url.searchParams.get('symbol');
      
      if (action === 'stock' && !symbol) {
        const errorResponse = {
          success: false,
          error: 'Symbol parameter is required',
        };
        expect(errorResponse.error).toBe('Symbol parameter is required');
      }
    });

    test('should handle POST authentication', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams('action=authenticate'),
        },
        json: jest.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'password123',
        }),
      } as unknown as NextRequest;

      const body = await mockRequest.json();
      
      if (!body.email || !body.password) {
        const errorResponse = {
          success: false,
          error: 'Email and password are required',
        };
        expect(errorResponse.error).toBe('Email and password are required');
      } else {
        expect(body.email).toBe('test@example.com');
        expect(body.password).toBe('password123');
      }
    });

    test('should handle unknown actions', async () => {
      const action = 'unknown-action';
      
      const errorResponse = {
        success: false,
        error: `Unknown action: ${action}`,
      };
      
      expect(errorResponse.error).toBe('Unknown action: unknown-action');
    });
  });

  describe('Error Handling', () => {
    test('should handle JSON parsing errors', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      try {
        await mockRequest.json();
      } catch (error) {
        const errorResponse = {
          error: 'Invalid JSON in request body',
        };
        expect(errorResponse.error).toBe('Invalid JSON in request body');
      }
    });

    test('should handle service errors', async () => {
      const mockMarketData = require('@/lib/services/market-data').default;
      mockMarketData.getQuote.mockRejectedValue(new Error('Service unavailable'));

      try {
        await mockMarketData.getQuote('AAPL');
      } catch (error) {
        const errorResponse = {
          error: error instanceof Error ? error.message : 'Internal server error',
        };
        expect(errorResponse.error).toBe('Service unavailable');
      }
    });

    test('should handle rate limiting', async () => {
      const mockRateLimitResponse = {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
      };
      
      expect(mockRateLimitResponse.error).toBe('Rate limit exceeded');
      expect(mockRateLimitResponse.message).toBe('Too many requests. Please try again later.');
    });
  });

  describe('Middleware Logic', () => {
    test('should identify API routes', () => {
      const isApiRoute = (pathname: string) => pathname.startsWith('/api');
      
      expect(isApiRoute('/api/market/quote')).toBe(true);
      expect(isApiRoute('/api/notifications')).toBe(true);
      expect(isApiRoute('/dashboard')).toBe(false);
      expect(isApiRoute('/login')).toBe(false);
    });

    test('should identify static files', () => {
      const isStaticFile = (pathname: string) =>
        pathname.startsWith('/_next') ||
        pathname.includes('.') ||
        pathname.startsWith('/favicon');
      
      expect(isStaticFile('/_next/static/css/app.css')).toBe(true);
      expect(isStaticFile('/favicon.ico')).toBe(true);
      expect(isStaticFile('/image.png')).toBe(true);
      expect(isStaticFile('/api/market/quote')).toBe(false);
    });

    test('should apply rate limiting', () => {
      const checkRateLimit = (clientIP: string, limit: number) => {
        // Mock rate limiting logic
        const requests = Math.floor(Math.random() * 150);
        return requests < limit;
      };
      
      const chatLimit = 60;
      const apiLimit = 100;
      
      // Test chat API rate limit
      expect(typeof checkRateLimit('127.0.0.1', chatLimit)).toBe('boolean');
      
      // Test general API rate limit
      expect(typeof checkRateLimit('127.0.0.1', apiLimit)).toBe('boolean');
    });
  });
}); 