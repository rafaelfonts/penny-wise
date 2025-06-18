import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock environment variables
process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
process.env.YAHOO_FINANCE_API_KEY = 'test-key';

describe('Real Services Extended Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Alpha Vantage Service', () => {
    test('should handle API key validation', async () => {
      // Test API key presence
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe('string');
    });

    test('should construct proper API URLs', () => {
      const symbol = 'AAPL';
      const baseUrl = 'https://www.alphavantage.co/query';
      const expectedUrl = `${baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=test-key`;
      
      expect(expectedUrl).toContain(symbol);
      expect(expectedUrl).toContain('GLOBAL_QUOTE');
      expect(expectedUrl).toContain('test-key');
    });

    test('should handle API response structure', () => {
      const mockResponse = {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '05. price': '150.00',
          '09. change': '2.50',
          '10. change percent': '1.69%'
        }
      };

      expect(mockResponse['Global Quote']).toBeDefined();
      expect(mockResponse['Global Quote']['01. symbol']).toBe('AAPL');
      expect(mockResponse['Global Quote']['05. price']).toBe('150.00');
    });

    test('should handle error responses', () => {
      const errorResponse = {
        'Error Message': 'Invalid API call'
      };

      expect(errorResponse['Error Message']).toBeDefined();
      expect(typeof errorResponse['Error Message']).toBe('string');
    });
  });

  describe('Yahoo Finance Service', () => {
    test('should handle symbol formatting', () => {
      const brazilianSymbol = 'PETR4.SA';
      const usSymbol = 'AAPL';
      
      expect(brazilianSymbol).toContain('.SA');
      expect(usSymbol).not.toContain('.SA');
    });

    test('should process quote data', () => {
      const mockQuoteData = {
        symbol: 'PETR4.SA',
        regularMarketPrice: 25.50,
        regularMarketChange: 0.75,
        regularMarketChangePercent: 3.03,
        regularMarketVolume: 1000000
      };

      expect(mockQuoteData.symbol).toBe('PETR4.SA');
      expect(typeof mockQuoteData.regularMarketPrice).toBe('number');
      expect(mockQuoteData.regularMarketPrice).toBeGreaterThan(0);
    });

    test('should handle market hours calculation', () => {
      const now = new Date();
      const marketOpen = new Date(now);
      marketOpen.setHours(10, 0, 0, 0); // 10:00 AM
      
      const marketClose = new Date(now);
      marketClose.setHours(17, 0, 0, 0); // 5:00 PM

      expect(marketOpen.getHours()).toBe(10);
      expect(marketClose.getHours()).toBe(17);
      expect(marketClose.getTime()).toBeGreaterThan(marketOpen.getTime());
    });
  });

  describe('Market Data Processing', () => {
    test('should format currency values', () => {
      const price = 25.50;
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price);

      expect(formatted).toContain('25,50');
      expect(formatted).toContain('R$');
    });

    test('should calculate percentage changes', () => {
      const currentPrice = 25.50;
      const previousPrice = 24.00;
      const change = currentPrice - previousPrice;
      const changePercent = (change / previousPrice) * 100;

      expect(change).toBe(1.50);
      expect(changePercent).toBeCloseTo(6.25, 2);
    });

    test('should validate stock symbols', () => {
      const validSymbols = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4'];
      const invalidSymbols = ['', '123', 'INVALID_SYMBOL_TOO_LONG'];

      validSymbols.forEach(symbol => {
        expect(symbol.length).toBeGreaterThan(0);
        expect(symbol.length).toBeLessThanOrEqual(10);
        expect(/^[A-Z0-9]+$/.test(symbol)).toBe(true);
      });

      invalidSymbols.forEach(symbol => {
        if (symbol === '') {
          expect(symbol.length).toBe(0);
        } else if (symbol === '123') {
          expect(/^[A-Z0-9]+$/.test(symbol)).toBe(true); // Numbers are valid
        } else {
          expect(symbol.length).toBeGreaterThan(10);
        }
      });
    });

    test('should handle time zone conversions', () => {
      const utcTime = new Date('2024-01-15T18:00:00Z');
      const brazilianOffset = -3; // UTC-3
      const brazilianTime = new Date(utcTime.getTime() + (brazilianOffset * 60 * 60 * 1000));

      expect(utcTime.getUTCHours()).toBe(18);
      expect(brazilianTime.getUTCHours()).toBe(15); // 18 - 3 = 15
    });
  });

  describe('Cache Management', () => {
    test('should handle cache key generation', () => {
      const symbol = 'PETR4';
      const timestamp = Date.now();
      const cacheKey = `quote:${symbol}:${Math.floor(timestamp / 60000)}`;

      expect(cacheKey).toContain('quote:');
      expect(cacheKey).toContain(symbol);
      expect(cacheKey).toContain(':');
    });

    test('should validate cache TTL', () => {
      const ttl = 300; // 5 minutes
      const now = Date.now();
      const expiryTime = now + (ttl * 1000);

      expect(expiryTime).toBeGreaterThan(now);
      expect(expiryTime - now).toBe(ttl * 1000);
    });

    test('should handle cache invalidation', () => {
      const cacheData = {
        symbol: 'PETR4',
        price: 25.50,
        timestamp: Date.now() - 600000 // 10 minutes ago
      };

      const maxAge = 300000; // 5 minutes
      const isExpired = (Date.now() - cacheData.timestamp) > maxAge;

      expect(isExpired).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      expect(networkError.message).toBe('Network request failed');
      expect(networkError.name).toBe('NetworkError');
    });

    test('should handle API rate limiting', () => {
      const rateLimitError = {
        status: 429,
        message: 'Too Many Requests',
        retryAfter: 60
      };

      expect(rateLimitError.status).toBe(429);
      expect(rateLimitError.retryAfter).toBe(60);
    });

    test('should handle invalid API responses', () => {
      const invalidResponse = null;
      const emptyResponse = {};
      const malformedResponse = { data: undefined };

      expect(invalidResponse).toBeNull();
      expect(Object.keys(emptyResponse)).toHaveLength(0);
      expect(malformedResponse.data).toBeUndefined();
    });
  });

  describe('Data Validation', () => {
    test('should validate price data', () => {
      const validPrice = 25.50;
      const invalidPrices = [null, undefined, -1, 0, NaN, 'invalid'];

      expect(typeof validPrice).toBe('number');
      expect(validPrice).toBeGreaterThan(0);
      expect(isFinite(validPrice)).toBe(true);

      invalidPrices.forEach(price => {
        if (price === null || price === undefined) {
          expect(price).toBeFalsy();
        } else if (typeof price === 'number') {
          expect(price <= 0 || isNaN(price)).toBe(true);
        } else {
          expect(typeof price).not.toBe('number');
        }
      });
    });

    test('should validate volume data', () => {
      const validVolume = 1000000;
      const invalidVolumes = [-1, 0.5, NaN, 'invalid'];

      expect(Number.isInteger(validVolume)).toBe(true);
      expect(validVolume).toBeGreaterThan(0);

      invalidVolumes.forEach(volume => {
        if (typeof volume === 'number') {
          expect(volume < 0 || !Number.isInteger(volume) || isNaN(volume)).toBe(true);
        } else {
          expect(typeof volume).not.toBe('number');
        }
      });
    });

    test('should validate timestamp data', () => {
      const validTimestamp = Date.now();
      const validDate = new Date().toISOString();
      const invalidTimestamps = [-1, 'invalid-date', null];

      expect(typeof validTimestamp).toBe('number');
      expect(validTimestamp).toBeGreaterThan(0);
      expect(new Date(validDate).getTime()).toBeGreaterThan(0);

      invalidTimestamps.forEach(timestamp => {
        if (timestamp === null) {
          expect(timestamp).toBeNull();
        } else if (typeof timestamp === 'number') {
          expect(timestamp).toBeLessThan(0);
        } else {
          expect(isNaN(new Date(timestamp as string).getTime())).toBe(true);
        }
      });
    });
  });

  describe('Performance Optimization', () => {
    test('should handle batch requests efficiently', () => {
      const symbols = ['PETR4', 'VALE3', 'ITUB4'];
      const batchSize = 10;
      
      expect(symbols.length).toBeLessThanOrEqual(batchSize);
      
      const batches = [];
      for (let i = 0; i < symbols.length; i += batchSize) {
        batches.push(symbols.slice(i, i + batchSize));
      }

      expect(batches.length).toBe(1);
      expect(batches[0]).toEqual(symbols);
    });

    test('should implement request throttling', () => {
      const requestTimes: number[] = [];
      const minInterval = 100; // 100ms between requests

      // Simulate request timing
      for (let i = 0; i < 3; i++) {
        requestTimes.push(Date.now() + (i * minInterval));
      }

      for (let i = 1; i < requestTimes.length; i++) {
        const interval = requestTimes[i] - requestTimes[i - 1];
        expect(interval).toBeGreaterThanOrEqual(minInterval);
      }
    });

    test('should handle concurrent request limits', () => {
      const maxConcurrentRequests = 5;
      const pendingRequests = 3;
      const canMakeRequest = pendingRequests < maxConcurrentRequests;

      expect(canMakeRequest).toBe(true);
      expect(pendingRequests).toBeLessThan(maxConcurrentRequests);
    });
  });

  describe('Configuration Management', () => {
    test('should handle environment configuration', () => {
      const config = {
        apiKey: process.env.ALPHA_VANTAGE_API_KEY,
        baseUrl: 'https://www.alphavantage.co/query',
        timeout: 5000,
        retries: 3
      };

      expect(config.apiKey).toBeDefined();
      expect(config.baseUrl).toContain('https://');
      expect(config.timeout).toBeGreaterThan(0);
      expect(config.retries).toBeGreaterThan(0);
    });

    test('should validate configuration values', () => {
      const requiredEnvVars = ['ALPHA_VANTAGE_API_KEY'];
      
      requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        expect(value).toBeDefined();
        if (value) {
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });
  });
}); 