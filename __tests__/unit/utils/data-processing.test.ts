import { describe, test, expect } from '@jest/globals';
import {
  chunk,
  unique,
  flatten,
  groupBy,
  multiSort,
  deepClone,
  deepMerge,
  pick,
  omit,
  isValidSymbol,
  isValidEmail,
  isInRange,
  validateRequired,
  transformQuoteResponse,
  normalizePortfolio,
  aggregateByPeriod,
  multiFilter,
  fuzzySearch,
  paginate,
  debounce,
  throttle,
  memoize
} from '../../../src/lib/utils/data-processing';

describe('Data Processing Utilities Tests', () => {
  describe('Array Processing', () => {
    test('should chunk arrays into smaller arrays', () => {
      expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
      expect(chunk([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
      expect(chunk([], 2)).toEqual([]);
      expect(chunk([1, 2, 3], 0)).toEqual([]);
    });

    test('should remove duplicates from arrays', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(unique([])).toEqual([]);
      expect(unique([1])).toEqual([1]);
    });

    test('should flatten nested arrays', () => {
      expect(flatten([1, [2, 3], [4, [5, 6]]])).toEqual([1, 2, 3, 4, 5, 6]);
      expect(flatten(['a', ['b', 'c'], 'd'])).toEqual(['a', 'b', 'c', 'd']);
      expect(flatten([])).toEqual([]);
    });

    test('should group array elements by key', () => {
      const stocks = [
        { symbol: 'AAPL', sector: 'Technology' },
        { symbol: 'MSFT', sector: 'Technology' },
        { symbol: 'JPM', sector: 'Financial' },
        { symbol: 'BAC', sector: 'Financial' },
      ];

      const grouped = groupBy(stocks, 'sector');
      expect(grouped.Technology).toHaveLength(2);
      expect(grouped.Financial).toHaveLength(2);
      expect(grouped.Technology[0].symbol).toBe('AAPL');
    });

    test('should sort arrays by multiple criteria', () => {
      const portfolio = [
        { symbol: 'AAPL', price: 150, volume: 1000000 },
        { symbol: 'MSFT', price: 300, volume: 500000 },
        { symbol: 'GOOGL', price: 150, volume: 2000000 },
      ];

      const sorted = multiSort(portfolio, [
        { key: 'price', direction: 'asc' },
        { key: 'volume', direction: 'desc' },
      ]);

      expect(sorted[0].symbol).toBe('GOOGL'); // Same price as AAPL but higher volume
      expect(sorted[1].symbol).toBe('AAPL');
      expect(sorted[2].symbol).toBe('MSFT');
    });
  });

  describe('Object Processing', () => {
    test('should deep clone objects', () => {
      const original = {
        name: 'Portfolio',
        positions: [{ symbol: 'AAPL', quantity: 100 }],
        metadata: { created: new Date('2024-01-01') },
      };

      const cloned = deepClone(original);
      cloned.positions[0].quantity = 200;

      expect(original.positions[0].quantity).toBe(100);
      expect(cloned.positions[0].quantity).toBe(200);
      expect(cloned.metadata.created).toBeInstanceOf(Date);
    });

    test('should merge objects deeply', () => {
      const config1 = {
        api: { timeout: 5000, retries: 3 },
        features: { alerts: true },
      };

      const config2 = {
        api: { timeout: 10000, baseUrl: 'https://api.example.com' },
        features: { charts: true },
      };

      const merged = deepMerge(config1, config2);

      expect(merged.api.timeout).toBe(10000);
      expect(merged.api.retries).toBe(3);
      expect(merged.api.baseUrl).toBe('https://api.example.com');
      expect(merged.features.alerts).toBe(true);
      expect(merged.features.charts).toBe(true);
    });

    test('should pick specific properties from objects', () => {
      const stock = {
        symbol: 'AAPL',
        price: 150.25,
        volume: 1000000,
        marketCap: 2500000000000,
        sector: 'Technology',
        description: 'Apple Inc.',
      };

      const summary = pick(stock, ['symbol', 'price', 'volume']);

      expect(summary).toEqual({
        symbol: 'AAPL',
        price: 150.25,
        volume: 1000000,
      });
      expect(summary).not.toHaveProperty('marketCap');
    });

    test('should omit specific properties from objects', () => {
      const stock = {
        symbol: 'AAPL',
        price: 150.25,
        volume: 1000000,
        marketCap: 2500000000000,
        sector: 'Technology',
        description: 'Apple Inc.',
      };

      const summary = omit(stock, ['marketCap', 'description']);

      expect(summary).toEqual({
        symbol: 'AAPL',
        price: 150.25,
        volume: 1000000,
        sector: 'Technology',
      });
      expect(summary).not.toHaveProperty('marketCap');
      expect(summary).not.toHaveProperty('description');
    });
  });

  describe('Data Validation', () => {
    test('should validate stock symbols', () => {
      expect(isValidSymbol('AAPL')).toBe(true);
      expect(isValidSymbol('MSFT')).toBe(true);
      expect(isValidSymbol('BRK')).toBe(true);
      expect(isValidSymbol('A')).toBe(true);
      expect(isValidSymbol('GOOGL')).toBe(true);
      
      expect(isValidSymbol('aapl')).toBe(false); // lowercase
      expect(isValidSymbol('TOOLONG')).toBe(false); // too long
      expect(isValidSymbol('123')).toBe(false); // numbers
      expect(isValidSymbol('BRK.B')).toBe(false); // contains dot
      expect(isValidSymbol('')).toBe(false); // empty
    });

    test('should validate email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@test-domain.org')).toBe(true);
      
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('user name@domain.com')).toBe(false);
    });

    test('should validate numeric ranges', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
      
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
      expect(isInRange(-5, 1, 10)).toBe(false);
    });

    test('should validate required fields', () => {
      const validObj = { name: 'John', email: 'john@example.com', age: 30 };
      const invalidObj = { name: 'John', email: '', age: null };

      const validResult = validateRequired(validObj, ['name', 'email', 'age']);
      const invalidResult = validateRequired(invalidObj, ['name', 'email', 'age']);

      expect(validResult.isValid).toBe(true);
      expect(validResult.missingFields).toEqual([]);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.missingFields).toEqual(['email', 'age']);
    });
  });

  describe('Data Transformation', () => {
    test('should transform API quote responses', () => {
      const apiResponse = {
        ticker: 'AAPL',
        currentPrice: 150.25,
        priceChange: 2.5,
        percentChange: 1.69,
        tradingVolume: 50000000,
        lastUpdated: '2024-01-15T16:00:00Z',
      };

      const transformed = transformQuoteResponse(apiResponse);

      expect(transformed.symbol).toBe('AAPL');
      expect(transformed.price).toBe(150.25);
      expect(transformed.change).toBe(2.5);
      expect(transformed.changePercent).toBe(1.69);
      expect(transformed.volume).toBe(50000000);
      expect(transformed.timestamp).toBe('2024-01-15T16:00:00Z');
    });

    test('should normalize data structures', () => {
      const rawPortfolio = [
        { symbol: 'aapl', quantity: -100, averagePrice: 140, currentPrice: 150 },
        { symbol: 'MSFT', quantity: 50, price: 300 },
        { id: 'pos-1', symbol: 'googl', quantity: 25, averagePrice: 2800, currentPrice: 2850 },
      ];

      const normalized = normalizePortfolio(rawPortfolio);

      expect(normalized[0].symbol).toBe('aapl');
      expect(normalized[0].quantity).toBe(100); // Absolute value
      expect(normalized[0].value).toBe(15000); // 100 * 150
      expect(normalized[0].gainLoss).toBe(0); // No gainLoss in raw data
      expect(normalized[1].id).toMatch(/MSFT-\d+/);
      expect(normalized[2].id).toBe('pos-1');
    });

    test('should aggregate data by time periods', () => {
      const priceData = [
        { timestamp: '2024-01-01T10:00:00Z', value: 100 },
        { timestamp: '2024-01-01T10:30:00Z', value: 105 },
        { timestamp: '2024-01-01T11:00:00Z', value: 102 },
        { timestamp: '2024-01-01T11:30:00Z', value: 108 },
      ];

      const hourlyAgg = aggregateByPeriod(priceData, 'hour');

      expect(hourlyAgg).toHaveLength(2);
      expect(hourlyAgg[0].count).toBe(2);
      expect(hourlyAgg[0].average).toBe(102.5);
      expect(hourlyAgg[1].count).toBe(2);
      expect(hourlyAgg[1].average).toBe(105);
    });
  });

  describe('Data Filtering and Searching', () => {
    test('should filter data by multiple criteria', () => {
      const stocks = [
        { symbol: 'AAPL', price: 150, sector: 'Technology', marketCap: 2500000000000 },
        { symbol: 'MSFT', price: 300, sector: 'Technology', marketCap: 2000000000000 },
        { symbol: 'JPM', price: 140, sector: 'Financial', marketCap: 400000000000 },
        { symbol: 'BAC', price: 35, sector: 'Financial', marketCap: 250000000000 },
      ];

      const filtered = multiFilter(stocks, [
        { key: 'sector', operator: 'eq', value: 'Technology' },
        { key: 'price', operator: 'gt', value: 140 },
      ]);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(stock => stock.sector === 'Technology')).toBe(true);
      expect(filtered.every(stock => stock.price > 140)).toBe(true);
    });

    test('should implement fuzzy search', () => {
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'];
      const results = fuzzySearch(symbols, 'APL', 0.5);

      expect(results).toContain('AAPL');
      expect(results[0]).toBe('AAPL'); // Should be the best match
    });

    test('should paginate data', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
      const result = paginate(items, 2, 10);

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe(11);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    test('should debounce function calls', (done) => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const debouncedFunction = debounce(testFunction, 100);

      // Call multiple times rapidly
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();

      // Should not have been called yet
      expect(callCount).toBe(0);

      // Wait for debounce delay
      setTimeout(() => {
        expect(callCount).toBe(1); // Should only be called once
        done();
      }, 150);
    });

    test('should throttle function calls', (done) => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const throttledFunction = throttle(testFunction, 100);

      // Call multiple times rapidly
      throttledFunction(); // Should execute immediately
      throttledFunction(); // Should be throttled
      throttledFunction(); // Should be throttled

      expect(callCount).toBe(1);

      // Wait for throttle delay
      setTimeout(() => {
        throttledFunction(); // Should execute now
        expect(callCount).toBe(2);
        done();
      }, 150);
    });

    test('should memoize function results', () => {
      let calculationCount = 0;
      const expensiveCalculation = (n: number): number => {
        calculationCount++;
        return n * n;
      };

      const memoizedCalculation = memoize(expensiveCalculation);

      // First call
      expect(memoizedCalculation(5)).toBe(25);
      expect(calculationCount).toBe(1);

      // Second call with same argument - should use cache
      expect(memoizedCalculation(5)).toBe(25);
      expect(calculationCount).toBe(1); // Should not increment

      // Call with different argument
      expect(memoizedCalculation(10)).toBe(100);
      expect(calculationCount).toBe(2);
    });
  });
}); 