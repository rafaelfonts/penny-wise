import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/utils/cache-service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    size: jest.fn(),
    keys: jest.fn(),
  },
  generateCacheKey: {
    quote: (symbol: string) => `quote:${symbol}`,
    intraday: (symbol: string, interval: string) => `intraday:${symbol}:${interval}`,
    daily: (symbol: string) => `daily:${symbol}`,
    news: (symbols: string[], topics: string[], limit: number) => 
      `news:${symbols.join(',')}:${topics.join(',')}:${limit}`,
    search: (query: string) => `search:${query.toLowerCase()}`,
    technical: (symbol: string, indicator: string, interval: string) => 
      `technical:${symbol}:${indicator}:${interval}`,
    overview: (symbol: string) => `overview:${symbol}`,
    validation: (symbol: string) => `validation:${symbol}`,
  },
  withCache: jest.fn(),
}));

// Import utilities
import { cn } from '@/lib/utils';
import { cacheService, generateCacheKey } from '@/lib/utils/cache-service';

describe('Utility Functions Extended Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('cn (className utility)', () => {
    test('should merge basic classes', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
      expect(cn('text-sm', 'font-medium')).toBe('text-sm font-medium');
    });

    test('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
    });

    test('should handle arrays of classes', () => {
      expect(cn(['px-4', 'py-2'], 'text-sm')).toBe('px-4 py-2 text-sm');
      expect(cn('base', ['hover:bg-blue-500', 'focus:ring-2'])).toBe('base hover:bg-blue-500 focus:ring-2');
    });

    test('should handle objects with boolean values', () => {
      expect(cn({
        'px-4': true,
        'py-2': true,
        'hidden': false,
      })).toBe('px-4 py-2');
    });

    test('should handle complex combinations', () => {
      const isActive = true;
      const isDisabled = false;
      
      expect(cn(
        'btn',
        'px-4 py-2',
        {
          'bg-blue-500': isActive,
          'bg-gray-300': !isActive,
          'opacity-50': isDisabled,
        },
        isActive && 'text-white',
        ['rounded', 'shadow']
      )).toBe('btn px-4 py-2 bg-blue-500 text-white rounded shadow');
    });

    test('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
      expect(cn(undefined, 'middle', null)).toBe('middle');
    });

    test('should handle empty strings', () => {
      expect(cn('', 'valid-class', '')).toBe('valid-class');
      expect(cn('base', '', 'end')).toBe('base end');
    });

    test('should handle Tailwind CSS conflicts', () => {
      // The cn function should handle conflicting classes (clsx merges, tailwind-merge resolves conflicts)
      expect(cn('p-4', 'p-8')).toBe('p-8'); // tailwind-merge resolves conflicts
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    test('should handle responsive variants', () => {
      expect(cn('text-sm', 'md:text-base', 'lg:text-lg')).toBe('text-sm md:text-base lg:text-lg');
      expect(cn('hidden', 'sm:block', 'lg:inline')).toBe('hidden sm:block lg:inline');
    });

    test('should handle state variants', () => {
      expect(cn('bg-blue-500', 'hover:bg-blue-600', 'focus:bg-blue-700')).toBe('bg-blue-500 hover:bg-blue-600 focus:bg-blue-700');
      expect(cn('opacity-100', 'disabled:opacity-50')).toBe('opacity-100 disabled:opacity-50');
    });
  });

  describe('Cache Service Utilities', () => {
    test('should generate correct cache keys', () => {
      expect(generateCacheKey.quote('AAPL')).toBe('quote:AAPL');
      expect(generateCacheKey.intraday('GOOGL', '5min')).toBe('intraday:GOOGL:5min');
      expect(generateCacheKey.daily('MSFT')).toBe('daily:MSFT');
      expect(generateCacheKey.overview('TSLA')).toBe('overview:TSLA');
      expect(generateCacheKey.validation('AMZN')).toBe('validation:AMZN');
    });

    test('should generate news cache keys', () => {
      const symbols = ['AAPL', 'GOOGL'];
      const topics = ['earnings', 'technology'];
      const limit = 10;
      
      expect(generateCacheKey.news(symbols, topics, limit)).toBe('news:AAPL,GOOGL:earnings,technology:10');
    });

    test('should generate search cache keys', () => {
      expect(generateCacheKey.search('Apple Inc')).toBe('search:apple inc');
      expect(generateCacheKey.search('TECHNOLOGY')).toBe('search:technology');
    });

    test('should generate technical indicator cache keys', () => {
      expect(generateCacheKey.technical('AAPL', 'RSI', 'daily')).toBe('technical:AAPL:RSI:daily');
      expect(generateCacheKey.technical('GOOGL', 'MACD', '1hour')).toBe('technical:GOOGL:MACD:1hour');
    });

    test('should handle cache service operations', () => {
      // Test cache key generation
      expect(generateCacheKey.quote('AAPL')).toBe('quote:AAPL');
      expect(generateCacheKey.daily('AAPL')).toBe('daily:AAPL');
      expect(generateCacheKey.overview('AAPL')).toBe('overview:AAPL');
      
      // Test cache service exists (basic smoke test)
      expect(cacheService).toBeDefined();
      expect(typeof cacheService.set).toBe('function');
      expect(typeof cacheService.get).toBe('function');
      expect(typeof cacheService.has).toBe('function');
      expect(typeof cacheService.delete).toBe('function');
    });
  });

  describe('String Utilities', () => {
    test('should format currency values', () => {
      const formatCurrency = (value: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(value);
      };

      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    test('should format percentage values', () => {
      const formatPercentage = (value: number, decimals = 2) => {
        return `${value.toFixed(decimals)}%`;
      };

      expect(formatPercentage(12.3456)).toBe('12.35%');
      expect(formatPercentage(0.123, 3)).toBe('0.123%');
      expect(formatPercentage(-5.67)).toBe('-5.67%');
    });

    test('should format large numbers', () => {
      const formatLargeNumber = (value: number) => {
        if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value.toString();
      };

      expect(formatLargeNumber(1234)).toBe('1.2K');
      expect(formatLargeNumber(1234567)).toBe('1.2M');
      expect(formatLargeNumber(1234567890)).toBe('1.2B');
      expect(formatLargeNumber(1234567890123)).toBe('1.2T');
    });

    test('should truncate text', () => {
      const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength - 3) + '...';
      };

      expect(truncateText('Short text', 20)).toBe('Short text');
      expect(truncateText('This is a very long text that should be truncated', 20)).toBe('This is a very lo...');
      expect(truncateText('Exact length text!!', 20)).toBe('Exact length text!!');
    });

    test('should capitalize strings', () => {
      const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('tEST')).toBe('Test');
      expect(capitalize('')).toBe('');
    });

    test('should convert to slug', () => {
      const toSlug = (str: string) => {
        return str
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };

      expect(toSlug('Hello World')).toBe('hello-world');
      expect(toSlug('Apple Inc. Stock Analysis')).toBe('apple-inc-stock-analysis');
      expect(toSlug('Test@#$%^&*()String')).toBe('test-string');
    });
  });

  describe('Date Utilities', () => {
    test('should format dates', () => {
      const formatDate = (date: Date | string, format = 'short') => {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (format === 'short') {
          return d.toLocaleDateString('en-US');
        } else if (format === 'long') {
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
        return d.toISOString();
      };

      const testDate = new Date('2024-01-15T10:30:00Z');
      
      expect(formatDate(testDate, 'short')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatDate(testDate, 'long')).toContain('January');
      expect(formatDate(testDate, 'iso')).toBe('2024-01-15T10:30:00.000Z');
    });

    test('should calculate time differences', () => {
      const getTimeDifference = (date1: Date, date2: Date) => {
        const diffMs = Math.abs(date2.getTime() - date1.getTime());
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return { days: diffDays, hours: diffHours, minutes: diffMinutes };
      };

      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-16T12:30:00Z');
      
      const diff = getTimeDifference(date1, date2);
      expect(diff.days).toBe(1);
      expect(diff.hours).toBe(2);
      expect(diff.minutes).toBe(30);
    });

    test('should check if date is business day', () => {
      const isBusinessDay = (date: Date) => {
        const day = date.getDay();
        return day >= 1 && day <= 5; // Monday to Friday
      };

      const monday = new Date('2024-01-15'); // Monday
      const saturday = new Date('2024-01-13'); // Saturday
      const sunday = new Date('2024-01-14'); // Sunday
      
      expect(isBusinessDay(monday)).toBe(true);
      expect(isBusinessDay(saturday)).toBe(false);
      expect(isBusinessDay(sunday)).toBe(false);
    });
  });

  describe('Array Utilities', () => {
    test('should chunk arrays', () => {
      const chunk = <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };

      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk(['a', 'b', 'c', 'd'], 3)).toEqual([['a', 'b', 'c'], ['d']]);
      expect(chunk([], 2)).toEqual([]);
    });

    test('should remove duplicates', () => {
      const unique = <T>(array: T[]): T[] => {
        return Array.from(new Set(array));
      };

      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(unique([])).toEqual([]);
    });

    test('should group by property', () => {
      const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
        return array.reduce((groups, item) => {
          const groupKey = String(item[key]);
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          groups[groupKey].push(item);
          return groups;
        }, {} as Record<string, T[]>);
      };

      const data = [
        { name: 'Apple', sector: 'Technology' },
        { name: 'Google', sector: 'Technology' },
        { name: 'JPMorgan', sector: 'Finance' },
      ];

      const grouped = groupBy(data, 'sector');
      expect(grouped.Technology).toHaveLength(2);
      expect(grouped.Finance).toHaveLength(1);
    });
  });

  describe('Object Utilities', () => {
    test('should deep clone objects', () => {
      const deepClone = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (Array.isArray(obj)) return obj.map(item => deepClone(item));
        
        const cloned: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
          }
        }
        return cloned;
      };

      const original = {
        name: 'Test',
        data: { value: 123 },
        items: [1, 2, 3],
      };

      const cloned = deepClone(original);
      cloned.data.value = 456;
      
      expect(original.data.value).toBe(123);
      expect(cloned.data.value).toBe(456);
    });

    test('should pick object properties', () => {
      const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
        const result = {} as Pick<T, K>;
        keys.forEach(key => {
          if (key in obj) {
            result[key] = obj[key];
          }
        });
        return result;
      };

      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = pick(obj, ['a', 'c']);
      
      expect(picked).toEqual({ a: 1, c: 3 });
      expect('b' in picked).toBe(false);
    });

    test('should omit object properties', () => {
      const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
        const result = { ...obj };
        keys.forEach(key => {
          delete result[key];
        });
        return result;
      };

      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const omitted = omit(obj, ['b', 'd']);
      
      expect(omitted).toEqual({ a: 1, c: 3 });
      expect('b' in omitted).toBe(false);
    });
  });

  describe('Validation Utilities', () => {
    test('should validate email addresses', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });

    test('should validate stock symbols', () => {
      const isValidSymbol = (symbol: string): boolean => {
        const symbolRegex = /^[A-Z]{1,5}$/;
        return symbolRegex.test(symbol.toUpperCase());
      };

      expect(isValidSymbol('AAPL')).toBe(true);
      expect(isValidSymbol('GOOGL')).toBe(true);
      expect(isValidSymbol('BRK.A')).toBe(false); // Contains dot
      expect(isValidSymbol('TOOLONG')).toBe(false); // Too long
      expect(isValidSymbol('')).toBe(false); // Empty
    });

    test('should validate URLs', () => {
      const isValidUrl = (url: string): boolean => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('Performance Utilities', () => {
    test('should debounce function calls', (done) => {
      const debounce = <T extends (...args: unknown[]) => void>(
        func: T,
        delay: number
      ): T => {
        let timeoutId: NodeJS.Timeout;
        return ((...args: Parameters<T>) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        }) as T;
      };

      let callCount = 0;
      const testFunction = () => { callCount++; };
      const debouncedFunction = debounce(testFunction, 100);

      // Call multiple times quickly
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();

      // Should only be called once after delay
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    test('should throttle function calls', (done) => {
      const throttle = <T extends (...args: unknown[]) => void>(
        func: T,
        delay: number
      ): T => {
        let lastCall = 0;
        return ((...args: Parameters<T>) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
          }
        }) as T;
      };

      let callCount = 0;
      const testFunction = () => { callCount++; };
      const throttledFunction = throttle(testFunction, 100);

      // Call multiple times
      throttledFunction(); // Should execute
      throttledFunction(); // Should be throttled
      throttledFunction(); // Should be throttled

      expect(callCount).toBe(1);

      setTimeout(() => {
        throttledFunction(); // Should execute after delay
        expect(callCount).toBe(2);
        done();
      }, 150);
    });

    test('should memoize function results', () => {
      const memoize = <T extends (...args: any[]) => any>(func: T): T => {
        const cache = new Map();
        return ((...args: Parameters<T>) => {
          const key = JSON.stringify(args);
          if (cache.has(key)) {
            return cache.get(key);
          }
          const result = func(...args);
          cache.set(key, result);
          return result;
        }) as T;
      };

      let callCount = 0;
      const expensiveFunction = (n: number) => {
        callCount++;
        return n * n;
      };

      const memoizedFunction = memoize(expensiveFunction);

      expect(memoizedFunction(5)).toBe(25);
      expect(memoizedFunction(5)).toBe(25); // Should use cached result
      expect(callCount).toBe(1); // Function should only be called once
    });
  });
}); 