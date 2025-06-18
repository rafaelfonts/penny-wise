import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CacheService } from '../../../src/lib/utils/cache-service';

describe('Cache Service Comprehensive Tests', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      maxSize: 100,
      defaultTTL: 1000, // 1 second for testing
      cleanupInterval: 500,
      enableStats: true
    });
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Basic Cache Operations', () => {
    test('should set and get cache items', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.get('key1')).toBe('value1');
    });

    test('should return null for non-existent keys', () => {
      expect(cacheService.get('nonexistent')).toBe(null);
    });

    test('should handle different data types', () => {
      const testData = {
        string: 'test',
        number: 42,
        boolean: true,
        object: { nested: 'value' },
        array: [1, 2, 3],
        null: null
      };

      Object.entries(testData).forEach(([key, value]) => {
        cacheService.set(key, value);
        expect(cacheService.get(key)).toEqual(value);
      });
    });

    test('should check if key exists', () => {
      cacheService.set('exists', 'value');
      expect(cacheService.has('exists')).toBe(true);
      expect(cacheService.has('notexists')).toBe(false);
    });

    test('should delete cache items', () => {
      cacheService.set('toDelete', 'value');
      expect(cacheService.has('toDelete')).toBe(true);
      
      const deleted = cacheService.delete('toDelete');
      expect(deleted).toBe(true);
      expect(cacheService.has('toDelete')).toBe(false);
      
      const notDeleted = cacheService.delete('notexists');
      expect(notDeleted).toBe(false);
    });

    test('should clear all cache items', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);
      
      cacheService.clear();
      
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });
  });

  describe('TTL and Expiration', () => {
    test('should respect custom TTL', () => {
      cacheService.set('shortLived', 'value', 100); // 100ms TTL
      expect(cacheService.get('shortLived')).toBe('value');
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cacheService.get('shortLived')).toBe(null);
          resolve();
        }, 150);
      });
    });

    test('should use default TTL when not specified', () => {
      cacheService.set('defaultTTL', 'value');
      expect(cacheService.get('defaultTTL')).toBe('value');
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cacheService.get('defaultTTL')).toBe(null);
          resolve();
        }, 1100); // Default TTL is 1000ms
      });
    });

    test('should remove expired items on access', () => {
      cacheService.set('expired', 'value', 50);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cacheService.has('expired')).toBe(false);
          expect(cacheService.get('expired')).toBe(null);
          resolve();
        }, 100);
      });
    });
  });

  describe('Advanced Operations', () => {
    test('should implement getOrSet pattern', async () => {
      const fetcher = jest.fn().mockResolvedValue('fetched-value');
      
      // First call should fetch
      const result1 = await cacheService.getOrSet('fetchKey', fetcher);
      expect(result1).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      const result2 = await cacheService.getOrSet('fetchKey', fetcher);
      expect(result2).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalledTimes(1); // Not called again
    });

    test('should handle batch operations', async () => {
      const fetcher = jest.fn().mockImplementation((keys: string[]) => {
        const result: Record<string, string> = {};
        keys.forEach(key => {
          result[key] = `value-${key}`;
        });
        return Promise.resolve(result);
      });

      // Pre-populate some cache
      cacheService.set('key1', 'cached-value-1');
      
      const result = await cacheService.batchGet(
        ['key1', 'key2', 'key3'],
        fetcher
      );

      expect(result).toEqual({
        key1: 'cached-value-1', // From cache
        key2: 'value-key2',     // From fetcher
        key3: 'value-key3'      // From fetcher
      });

      expect(fetcher).toHaveBeenCalledWith(['key2', 'key3']);
    });

    test('should handle batch fetch failures gracefully', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));
      
      // Pre-populate expired cache
      cacheService.set('key1', 'expired-value', 1);
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Let it expire
      
      const result = await cacheService.batchGet(['key1', 'key2'], fetcher);
      
      // Should return expired data as fallback
      expect(result.key1).toBe('expired-value');
      expect(result.key2).toBeUndefined();
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should track cache statistics', () => {
      // Generate some hits and misses
      cacheService.set('hit1', 'value1');
      cacheService.set('hit2', 'value2');
      
      cacheService.get('hit1'); // Hit
      cacheService.get('hit2'); // Hit
      cacheService.get('miss1'); // Miss
      cacheService.get('miss2'); // Miss
      
      const stats = cacheService.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.size).toBe(2);
      expect(stats.totalMemory).toBeGreaterThan(0);
    });

    test('should track oldest and newest entries', () => {
      const now = Date.now();
      
      cacheService.set('old', 'value1');
      
      // Small delay to ensure different timestamps
      setTimeout(() => {
        cacheService.set('new', 'value2');
        
        const stats = cacheService.getStats();
        expect(stats.oldestEntry).toBeLessThanOrEqual(stats.newestEntry);
        expect(stats.newestEntry).toBeGreaterThanOrEqual(now);
      }, 10);
    });

    test('should identify expired items', () => {
      cacheService.set('expired1', 'value1', 50);
      cacheService.set('expired2', 'value2', 50);
      cacheService.set('valid', 'value3', 5000);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const expired = cacheService.getExpiredItems();
          expect(expired).toContain('expired1');
          expect(expired).toContain('expired2');
          expect(expired).not.toContain('valid');
          resolve();
        }, 100);
      });
    });
  });

  describe('Memory Management', () => {
    test('should enforce maximum cache size', () => {
      const smallCache = new CacheService({ maxSize: 3 });
      
      // Add more items than max size
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      smallCache.set('key4', 'value4'); // Should trigger eviction
      
      const stats = smallCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(3);
    });

    test('should implement LRU eviction', () => {
      const smallCache = new CacheService({ maxSize: 2 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      
      // Access key1 to make it recently used
      smallCache.get('key1');
      
      // Add key3, should evict key2 (least recently used)
      smallCache.set('key3', 'value3');
      
      expect(smallCache.has('key1')).toBe(true);  // Recently accessed
      expect(smallCache.has('key2')).toBe(false); // Should be evicted
      expect(smallCache.has('key3')).toBe(true);  // Newly added
    });

    test('should estimate memory usage', () => {
      const stats1 = cacheService.getStats();
      const initialMemory = stats1.totalMemory;
      
      cacheService.set('largeKey', 'a'.repeat(1000));
      
      const stats2 = cacheService.getStats();
      expect(stats2.totalMemory).toBeGreaterThan(initialMemory);
    });
  });

  describe('Configuration and Lifecycle', () => {
    test('should accept custom configuration', () => {
      const customCache = new CacheService({
        maxSize: 50,
        defaultTTL: 2000,
        cleanupInterval: 1000,
        enableStats: false
      });
      
      customCache.set('test', 'value');
      customCache.get('nonexistent'); // This would normally increment miss count
      
      const stats = customCache.getStats();
      expect(stats.misses).toBe(0); // Stats disabled
    });

    test('should handle cleanup timer lifecycle', () => {
      const cache = new CacheService({ cleanupInterval: 100 });
      
      cache.set('shortLived', 'value', 50);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Cleanup should have run and removed expired item
          expect(cache.has('shortLived')).toBe(false);
          resolve();
        }, 200);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero and negative TTL', () => {
      cacheService.set('zeroTTL', 'value', 0);
      expect(cacheService.get('zeroTTL')).toBe(null); // Should be immediately expired
      
      cacheService.set('negativeTTL', 'value', -100);
      expect(cacheService.get('negativeTTL')).toBe(null); // Should be immediately expired
    });

    test('should handle very large TTL values', () => {
      const largeValue = Number.MAX_SAFE_INTEGER;
      cacheService.set('largeTTL', 'value', largeValue);
      expect(cacheService.get('largeTTL')).toBe('value');
    });

    test('should handle special key values', () => {
      const specialKeys = ['', ' ', '\n', '\t', '🚀', '中文', 'key with spaces'];
      
      specialKeys.forEach(key => {
        cacheService.set(key, `value-${key}`);
        expect(cacheService.get(key)).toBe(`value-${key}`);
      });
    });

    test('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => {
        return Promise.resolve().then(() => {
          cacheService.set(`key${i}`, `value${i}`);
          return cacheService.get(`key${i}`);
        });
      });
      
      const results = await Promise.all(promises);
      
      results.forEach((result, i) => {
        expect(result).toBe(`value${i}`);
      });
    });

    test('should handle circular references in objects', () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Create circular reference
      
      // Should not throw error, but may not preserve circular structure
      expect(() => {
        cacheService.set('circular', obj);
      }).not.toThrow();
    });
  });
});
