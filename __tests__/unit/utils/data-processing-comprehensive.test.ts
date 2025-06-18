import { describe, test, expect, jest } from '@jest/globals';
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

describe('Data Processing Utilities Comprehensive Tests', () => {
  describe('Array Processing', () => {
    test('should chunk arrays into smaller arrays', () => {
      expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
      expect(chunk([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
      expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
      expect(chunk([], 2)).toEqual([]);
      expect(chunk([1, 2, 3], 0)).toEqual([]);
      expect(chunk([1, 2, 3], -1)).toEqual([]);
    });

    test('should remove duplicates from arrays', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(unique([])).toEqual([]);
      expect(unique([1])).toEqual([1]);
      expect(unique([null, undefined, null])).toEqual([null, undefined]);
    });

    test('should flatten nested arrays', () => {
      expect(flatten([1, [2, 3], [4, [5, 6]]])).toEqual([1, 2, 3, 4, 5, 6]);
      expect(flatten(['a', ['b', 'c'], 'd'])).toEqual(['a', 'b', 'c', 'd']);
      expect(flatten([])).toEqual([]);
      expect(flatten([1, 2, 3])).toEqual([1, 2, 3]);
      expect(flatten([[[[1]]]])).toEqual([1]);
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
      expect(grouped.Financial[0].symbol).toBe('JPM');
    });

    test('should sort arrays by multiple criteria', () => {
      const data = [
        { name: 'John', age: 30, score: 85 },
        { name: 'Jane', age: 25, score: 90 },
        { name: 'Bob', age: 30, score: 80 },
      ];

      const sorted = multiSort(data, [
        { key: 'age', direction: 'desc' },
        { key: 'score', direction: 'asc' }
      ]);

      expect(sorted[0].name).toBe('Bob'); // age 30, score 80
      expect(sorted[1].name).toBe('John'); // age 30, score 85
      expect(sorted[2].name).toBe('Jane'); // age 25, score 90
    });
  });

  describe('Object Processing', () => {
    test('should deep clone objects', () => {
      const original = {
        name: 'Test',
        nested: { value: 42, array: [1, 2, 3] },
        date: new Date('2023-01-01')
      };

      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.array).not.toBe(original.nested.array);
      expect(cloned.date).toEqual(original.date);
      expect(cloned.date).not.toBe(original.date);
    });

    test('should deep merge objects', () => {
      const target = {
        a: 1,
        b: { x: 1, y: 2 },
        c: [1, 2]
      };

      const source = {
        b: { y: 3, z: 4 },
        c: [3, 4],
        d: 5
      };

      const merged = deepMerge(target, source);
      
      expect(merged.a).toBe(1);
      expect(merged.b).toEqual({ x: 1, y: 3, z: 4 });
      expect(merged.c).toEqual([3, 4]);
      expect(merged.d).toBe(5);
    });

    test('should pick specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = pick(obj, ['a', 'c']);
      
      expect(picked).toEqual({ a: 1, c: 3 });
      expect(Object.keys(picked)).toHaveLength(2);
    });

    test('should omit specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const omitted = omit(obj, ['b', 'd']);
      
      expect(omitted).toEqual({ a: 1, c: 3 });
      expect(Object.keys(omitted)).toHaveLength(2);
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
      const obj = { name: 'John', age: 30, email: '' };
      
      const result1 = validateRequired(obj, ['name', 'age']);
      expect(result1.isValid).toBe(true);
      expect(result1.missingFields).toEqual([]);
      
      const result2 = validateRequired(obj, ['name', 'email', 'phone']);
      expect(result2.isValid).toBe(false);
      expect(result2.missingFields).toEqual(['email', 'phone']);
    });
  });

  describe('Data Transformation', () => {
    test('should transform quote response', () => {
      const apiResponse = {
        symbol: 'AAPL',
        price: '150.25',
        change: '2.50',
        changePercent: '1.69',
        volume: '1000000',
        timestamp: '2023-01-01T10:00:00Z'
      };

      const transformed = transformQuoteResponse(apiResponse);
      
      expect(transformed.symbol).toBe('AAPL');
      expect(transformed.price).toBe(150.25);
      expect(transformed.change).toBe(2.5);
      expect(transformed.changePercent).toBe(1.69);
      expect(transformed.volume).toBe(1000000);
      expect(transformed.timestamp).toBe('2023-01-01T10:00:00Z');
    });

    test('should normalize portfolio data', () => {
      const portfolio = [
        { symbol: 'AAPL', quantity: '10', price: '150', gainLoss: '100' },
        { ticker: 'MSFT', shares: '-5', currentPrice: '200', unrealizedPnL: '-50' }
      ];

      const normalized = normalizePortfolio(portfolio);
      
      expect(normalized).toHaveLength(2);
      expect(normalized[0].symbol).toBe('AAPL');
      expect(normalized[0].quantity).toBe(10);
      expect(normalized[0].price).toBe(150);
      expect(normalized[0].value).toBe(1500);
      expect(normalized[0].gainLoss).toBe(100);
      
      expect(normalized[1].symbol).toBe('MSFT');
      expect(normalized[1].quantity).toBe(5); // absolute value
      expect(normalized[1].value).toBe(1000); // absolute value
    });

    test('should aggregate data by period', () => {
      const data = [
        { timestamp: '2023-01-01T10:00:00Z', value: 100 },
        { timestamp: '2023-01-01T11:00:00Z', value: 150 },
        { timestamp: '2023-01-01T12:00:00Z', value: 200 },
        { timestamp: '2023-01-02T10:00:00Z', value: 120 },
      ];

      const aggregated = aggregateByPeriod(data, 'day');
      
      expect(aggregated).toHaveLength(2);
      expect(aggregated[0].count).toBe(3);
      expect(aggregated[0].total).toBe(450);
      expect(aggregated[0].average).toBe(150);
      expect(aggregated[0].min).toBe(100);
      expect(aggregated[0].max).toBe(200);
      
      expect(aggregated[1].count).toBe(1);
      expect(aggregated[1].total).toBe(120);
    });
  });

  describe('Data Filtering and Searching', () => {
    test('should filter data with multiple criteria', () => {
      const data = [
        { name: 'Apple', price: 150, category: 'tech' },
        { name: 'Microsoft', price: 200, category: 'tech' },
        { name: 'JPMorgan', price: 100, category: 'finance' },
        { name: 'Tesla', price: 300, category: 'auto' },
      ];

      const filtered = multiFilter(data, [
        { key: 'category', operator: 'eq', value: 'tech' },
        { key: 'price', operator: 'gt', value: 160 }
      ]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Microsoft');
    });

    test('should perform fuzzy search', () => {
      const items = ['Apple', 'Application', 'Pineapple', 'Orange', 'Grape'];
      
      const results = fuzzySearch(items, 'app', 0.3);
      
      expect(results).toContain('Apple');
      expect(results).toContain('Application');
      expect(results).toContain('Pineapple');
      expect(results[0]).toBe('Application'); // highest similarity first
    });
  });

  describe('Pagination and Utility', () => {
    test('should paginate data correctly', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      
      const page1 = paginate(data, 1, 10);
      expect(page1.data).toHaveLength(10);
      expect(page1.data[0].id).toBe(1);
      expect(page1.pagination.currentPage).toBe(1);
      expect(page1.pagination.totalPages).toBe(3);
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.hasPreviousPage).toBe(false);
      
      const page3 = paginate(data, 3, 10);
      expect(page3.data).toHaveLength(5);
      expect(page3.data[0].id).toBe(21);
      expect(page3.pagination.hasNextPage).toBe(false);
      expect(page3.pagination.hasPreviousPage).toBe(true);
    });
  });

  describe('Performance Utilities', () => {
    test('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');
      
      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();
      
      setTimeout(() => {
        // Should be called once with the last arguments
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('call3');
        done();
      }, 150);
    });

    test('should throttle function calls', (done) => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');
      
      // Should be called immediately for first call
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');
      
      setTimeout(() => {
        throttledFn('call4');
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenCalledWith('call4');
        done();
      }, 150);
    });

    test('should memoize function results', () => {
      const expensiveFn = jest.fn((x: number) => x * 2);
      const memoizedFn = memoize(expensiveFn);
      
      const result1 = memoizedFn(5);
      const result2 = memoizedFn(5);
      const result3 = memoizedFn(10);
      
      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(result3).toBe(20);
      
      // Should only call the original function twice (once for each unique input)
      expect(expensiveFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty arrays and objects', () => {
      expect(chunk([], 5)).toEqual([]);
      expect(unique([])).toEqual([]);
      expect(flatten([])).toEqual([]);
      expect(groupBy([], 'key')).toEqual({});
      expect(multiSort([], [])).toEqual([]);
    });

    test('should handle null and undefined values', () => {
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
      expect(deepMerge(null, { a: 1 })).toEqual({ a: 1 });
      expect(deepMerge({ a: 1 }, null)).toBe(null);
    });

    test('should handle invalid inputs gracefully', () => {
      expect(isInRange(NaN, 1, 10)).toBe(false);
      expect(isValidSymbol(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
    });

    test('should handle large datasets efficiently', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      const chunked = chunk(largeArray, 100);
      
      expect(chunked).toHaveLength(100);
      expect(chunked[0]).toHaveLength(100);
      expect(chunked[99]).toHaveLength(100);
    });
  });
}); 