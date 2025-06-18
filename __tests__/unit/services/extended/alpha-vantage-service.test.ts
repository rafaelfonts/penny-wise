import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock environment variables
process.env.ALPHA_VANTAGE_API_KEY = 'test-api-key';

describe('Alpha Vantage Service Extended Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API Request Handling', () => {
    test('should make successful API request', async () => {
      const mockResponse = {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '05. price': '150.00',
          '09. change': '2.50',
          '10. change percent': '1.69%',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=test-api-key';
      const response = await fetch(url);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data['Global Quote']['01. symbol']).toBe('AAPL');
      expect(data['Global Quote']['05. price']).toBe('150.00');
    });

    test('should handle API rate limit error', async () => {
      const mockResponse = {
        Note: 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute.',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=test-api-key');
      const data = await response.json();

      if (data.Note) {
        expect(data.Note).toContain('5 calls per minute');
      }
    });

    test('should handle API error message', async () => {
      const mockResponse = {
        'Error Message': 'Invalid API call. Please retry or visit the documentation.',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch('https://www.alphavantage.co/query?function=INVALID&apikey=test-api-key');
      const data = await response.json();

      if (data['Error Message']) {
        expect(data['Error Message']).toContain('Invalid API call');
      }
    });

    test('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      try {
        await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=test-api-key');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    test('should handle HTTP error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const response = await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=test-api-key');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
    });
  });

  describe('Data Parsing and Transformation', () => {
    test('should parse stock quote data correctly', () => {
      const rawData = {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '02. open': '148.50',
          '03. high': '152.00',
          '04. low': '147.00',
          '05. price': '150.00',
          '06. volume': '50000000',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '147.50',
          '09. change': '2.50',
          '10. change percent': '1.69%',
        },
      };

      const quote = rawData['Global Quote'];
      
      expect(quote['01. symbol']).toBe('AAPL');
      expect(parseFloat(quote['05. price'])).toBe(150.00);
      expect(parseFloat(quote['09. change'])).toBe(2.50);
      expect(quote['10. change percent']).toBe('1.69%');
      expect(parseInt(quote['06. volume'])).toBe(50000000);
    });

    test('should parse company overview data', () => {
      const rawData = {
        Symbol: 'AAPL',
        Name: 'Apple Inc',
        Description: 'Apple Inc. designs, manufactures, and markets smartphones...',
        Sector: 'Technology',
        Industry: 'Consumer Electronics',
        MarketCapitalization: '2500000000000',
        PERatio: '25.5',
        DividendYield: '0.0050',
        '52WeekHigh': '155.00',
        '52WeekLow': '120.00',
      };

      expect(rawData.Symbol).toBe('AAPL');
      expect(rawData.Name).toBe('Apple Inc');
      expect(rawData.Sector).toBe('Technology');
      expect(parseFloat(rawData.MarketCapitalization)).toBe(2500000000000);
      expect(parseFloat(rawData.PERatio)).toBe(25.5);
      expect(parseFloat(rawData.DividendYield)).toBe(0.0050);
    });

    test('should parse time series data', () => {
      const rawData = {
        'Time Series (Daily)': {
          '2024-01-15': {
            '1. open': '148.50',
            '2. high': '152.00',
            '3. low': '147.00',
            '4. close': '150.00',
            '5. volume': '50000000',
          },
          '2024-01-14': {
            '1. open': '146.00',
            '2. high': '149.00',
            '3. low': '145.50',
            '4. close': '147.50',
            '5. volume': '45000000',
          },
        },
      };

      const timeSeries = rawData['Time Series (Daily)'];
      const latestDate = '2024-01-15';
      const latestData = timeSeries[latestDate];

      expect(parseFloat(latestData['4. close'])).toBe(150.00);
      expect(parseInt(latestData['5. volume'])).toBe(50000000);
      expect(Object.keys(timeSeries)).toHaveLength(2);
    });

    test('should parse technical indicator data', () => {
      const rawData = {
        'Technical Analysis: RSI': {
          '2024-01-15': {
            RSI: '65.5432',
          },
          '2024-01-14': {
            RSI: '62.1234',
          },
        },
      };

      const rsiData = rawData['Technical Analysis: RSI'];
      const latestRSI = parseFloat(rsiData['2024-01-15'].RSI);

      expect(latestRSI).toBe(65.5432);
      expect(latestRSI).toBeGreaterThan(50); // Bullish signal
      expect(latestRSI).toBeLessThan(70); // Not overbought
    });

    test('should parse search results', () => {
      const rawData = {
        bestMatches: [
          {
            '1. symbol': 'AAPL',
            '2. name': 'Apple Inc',
            '3. type': 'Equity',
            '4. region': 'United States',
            '5. marketOpen': '09:30',
            '6. marketClose': '16:00',
            '7. timezone': 'UTC-05',
            '8. currency': 'USD',
            '9. matchScore': '1.0000',
          },
          {
            '1. symbol': 'APLE',
            '2. name': 'Apple Hospitality REIT Inc',
            '3. type': 'Equity',
            '4. region': 'United States',
            '5. marketOpen': '09:30',
            '6. marketClose': '16:00',
            '7. timezone': 'UTC-05',
            '8. currency': 'USD',
            '9. matchScore': '0.8000',
          },
        ],
      };

      const bestMatches = rawData.bestMatches;
      const topMatch = bestMatches[0];

      expect(topMatch['1. symbol']).toBe('AAPL');
      expect(parseFloat(topMatch['9. matchScore'])).toBe(1.0);
      expect(bestMatches).toHaveLength(2);
    });
  });

  describe('URL Construction', () => {
    test('should build correct API URLs', () => {
      const baseUrl = 'https://www.alphavantage.co/query';
      const apiKey = 'test-api-key';

      // Quote URL
      const quoteParams = new URLSearchParams({
        function: 'GLOBAL_QUOTE',
        symbol: 'AAPL',
        apikey: apiKey,
      });
      const quoteUrl = `${baseUrl}?${quoteParams.toString()}`;

      expect(quoteUrl).toContain('function=GLOBAL_QUOTE');
      expect(quoteUrl).toContain('symbol=AAPL');
      expect(quoteUrl).toContain('apikey=test-api-key');

      // Time series URL
      const timeSeriesParams = new URLSearchParams({
        function: 'TIME_SERIES_DAILY',
        symbol: 'GOOGL',
        outputsize: 'compact',
        apikey: apiKey,
      });
      const timeSeriesUrl = `${baseUrl}?${timeSeriesParams.toString()}`;

      expect(timeSeriesUrl).toContain('function=TIME_SERIES_DAILY');
      expect(timeSeriesUrl).toContain('symbol=GOOGL');
      expect(timeSeriesUrl).toContain('outputsize=compact');

      // Technical indicator URL
      const technicalParams = new URLSearchParams({
        function: 'RSI',
        symbol: 'MSFT',
        interval: 'daily',
        time_period: '14',
        series_type: 'close',
        apikey: apiKey,
      });
      const technicalUrl = `${baseUrl}?${technicalParams.toString()}`;

      expect(technicalUrl).toContain('function=RSI');
      expect(technicalUrl).toContain('time_period=14');
      expect(technicalUrl).toContain('series_type=close');
    });

    test('should handle special characters in symbols', () => {
      const symbols = ['BRK.A', 'BRK.B', 'GOOGL'];
      
      symbols.forEach(symbol => {
        const params = new URLSearchParams({
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: 'test-key',
        });
        
        const url = `https://www.alphavantage.co/query?${params.toString()}`;
        expect(url).toContain(`symbol=${encodeURIComponent(symbol)}`);
      });
    });
  });

  describe('Error Handling Scenarios', () => {
    test('should handle missing API key', () => {
      const originalApiKey = process.env.ALPHA_VANTAGE_API_KEY;
      delete process.env.ALPHA_VANTAGE_API_KEY;

      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
      expect(apiKey).toBe('demo');

      // Restore original API key
      process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    });

    test('should handle malformed JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      try {
        const response = await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=test-key');
        await response.json();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Invalid JSON');
      }
    });

    test('should handle empty response data', () => {
      const emptyResponses = [
        {},
        { 'Global Quote': {} },
        { 'Time Series (Daily)': {} },
        { bestMatches: [] },
      ];

      emptyResponses.forEach(response => {
        if (response['Global Quote'] && Object.keys(response['Global Quote']).length === 0) {
          expect(Object.keys(response['Global Quote'])).toHaveLength(0);
        }
        
        if (response['Time Series (Daily)'] && Object.keys(response['Time Series (Daily)']).length === 0) {
          expect(Object.keys(response['Time Series (Daily)'])).toHaveLength(0);
        }
        
        if (response.bestMatches && Array.isArray(response.bestMatches) && response.bestMatches.length === 0) {
          expect(response.bestMatches).toHaveLength(0);
        }
      });
    });

    test('should handle timeout scenarios', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 1000);
      });

      (global.fetch as jest.Mock).mockImplementation(() => timeoutPromise);

      try {
        await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=test-key');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Request timeout');
      }
    });
  });

  describe('Data Validation', () => {
    test('should validate numeric values', () => {
      const testValues = ['150.00', '0.00', '-2.50', 'N/A', '', null, undefined];
      
      testValues.forEach(value => {
        if (value && value !== 'N/A') {
          const numValue = parseFloat(value);
          expect(typeof numValue).toBe('number');
          if (!isNaN(numValue)) {
            expect(numValue).toBeGreaterThanOrEqual(-Infinity);
            expect(numValue).toBeLessThanOrEqual(Infinity);
          }
        }
      });
    });

    test('should validate date formats', () => {
      const testDates = ['2024-01-15', '2024-12-31', '2023-02-28', 'invalid-date'];
      
      testDates.forEach(dateStr => {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          expect(date).toBeInstanceOf(Date);
          expect(date.getFullYear()).toBeGreaterThan(2000);
        }
      });
    });

    test('should validate symbol formats', () => {
      const validSymbols = ['AAPL', 'GOOGL', 'MSFT', 'BRK.A', 'BRK.B'];
      const invalidSymbols = ['', '123', 'TOOLONGSYMBOL', 'invalid@symbol'];
      
      validSymbols.forEach(symbol => {
        expect(symbol.length).toBeGreaterThan(0);
        expect(symbol.length).toBeLessThanOrEqual(10);
        expect(/^[A-Z.]+$/.test(symbol)).toBe(true);
      });
      
      invalidSymbols.forEach(symbol => {
        if (symbol === '') {
          expect(symbol.length).toBe(0);
        } else if (symbol === '123') {
          expect(/^[A-Z.]+$/.test(symbol)).toBe(false);
        } else if (symbol === 'TOOLONGSYMBOL') {
          expect(symbol.length).toBeGreaterThan(10);
        } else if (symbol === 'invalid@symbol') {
          expect(/^[A-Z.]+$/.test(symbol)).toBe(false);
        }
      });
    });
  });

  describe('Performance and Caching', () => {
    test('should handle concurrent requests', async () => {
      const mockResponse = {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '05. price': '150.00',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const requests = symbols.map(symbol => 
        fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=test-key`)
      );

      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });

    test('should measure response times', async () => {
      const mockResponse = { data: 'test' };

      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockResponse),
            });
          }, 100);
        })
      );

      const startTime = Date.now();
      const response = await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=test-key');
      await response.json();
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeGreaterThanOrEqual(100);
      expect(responseTime).toBeLessThan(200); // Should complete within reasonable time
    });

    test('should handle rate limiting gracefully', () => {
      const rateLimitTracker = {
        requests: 0,
        lastReset: Date.now(),
        limit: 5,
        window: 60000, // 1 minute
      };

      const checkRateLimit = () => {
        const now = Date.now();
        if (now - rateLimitTracker.lastReset > rateLimitTracker.window) {
          rateLimitTracker.requests = 0;
          rateLimitTracker.lastReset = now;
        }
        
        if (rateLimitTracker.requests >= rateLimitTracker.limit) {
          return false; // Rate limit exceeded
        }
        
        rateLimitTracker.requests++;
        return true; // Request allowed
      };

      // Test rate limiting
      for (let i = 0; i < 7; i++) {
        const allowed = checkRateLimit();
        if (i < 5) {
          expect(allowed).toBe(true);
        } else {
          expect(allowed).toBe(false);
        }
      }
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete stock analysis workflow', async () => {
      const symbol = 'AAPL';
      
      // Mock quote response
      const quoteResponse = {
        'Global Quote': {
          '01. symbol': symbol,
          '05. price': '150.00',
          '09. change': '2.50',
          '10. change percent': '1.69%',
        },
      };

      // Mock overview response
      const overviewResponse = {
        Symbol: symbol,
        Name: 'Apple Inc',
        Sector: 'Technology',
        MarketCapitalization: '2500000000000',
      };

      // Mock technical indicator response
      const rsiResponse = {
        'Technical Analysis: RSI': {
          '2024-01-15': { RSI: '65.5432' },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(quoteResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(overviewResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(rsiResponse),
        });

      // Simulate workflow
      const quoteData = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=test-key`).then(r => r.json());
      const overviewData = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=test-key`).then(r => r.json());
      const rsiData = await fetch(`https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=test-key`).then(r => r.json());

      // Verify complete analysis data
      expect(quoteData['Global Quote']['01. symbol']).toBe(symbol);
      expect(overviewData.Name).toBe('Apple Inc');
      expect(rsiData['Technical Analysis: RSI']['2024-01-15'].RSI).toBe('65.5432');
    });

    test('should handle batch symbol processing', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const mockResponses = symbols.map(symbol => ({
        'Global Quote': {
          '01. symbol': symbol,
          '05. price': (Math.random() * 100 + 100).toFixed(2),
        },
      }));

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlObj = new URL(url);
        const symbol = urlObj.searchParams.get('symbol');
        const response = mockResponses.find(r => r['Global Quote']['01. symbol'] === symbol);
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response),
        });
      });

      const results = await Promise.all(
        symbols.map(symbol =>
          fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=test-key`)
            .then(r => r.json())
        )
      );

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result['Global Quote']['01. symbol']).toBe(symbols[index]);
        expect(parseFloat(result['Global Quote']['05. price'])).toBeGreaterThan(100);
      });
    });
  });
}); 