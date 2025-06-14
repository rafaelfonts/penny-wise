/**
 * Advanced Cache Service
 * Provides intelligent caching with TTL, cleanup, and performance optimization
 */

import { StandardApiResponse } from '@/lib/types/api-response';

interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  expiry: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalMemory: number;
  oldestEntry: number;
  newestEntry: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableStats: boolean;
}

export class CacheService {
  private cache = new Map<string, CacheItem>();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private cleanupTimer?: NodeJS.Timeout;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableStats: true,
      ...config,
    };

    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // LRU eviction if cache is too large
    if (this.cache.size > this.config.maxSize) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.lastAccessed - b.lastAccessed
      );

      const toEvict = sortedEntries.slice(
        0,
        this.cache.size - this.config.maxSize
      );
      toEvict.forEach(([key]) => this.cache.delete(key));
    }
  }

  private updateStats(hit: boolean): void {
    if (!this.config.enableStats) return;

    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
  }

  private getMemoryUsage(): number {
    // Rough estimate of memory usage
    let size = 0;
    for (const [key, item] of this.cache.entries()) {
      size += key.length * 2; // Approximate string size
      size += JSON.stringify(item.data).length * 2; // Approximate data size
      size += 64; // Overhead for timestamps, etc.
    }
    return size;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const actualTTL = ttl || this.config.defaultTTL;

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiry: now + actualTTL,
      ttl: actualTTL,
      hitCount: 0,
      lastAccessed: now,
    };

    this.cache.set(key, item);

    // Trigger cleanup if cache is getting too large
    if (this.cache.size > this.config.maxSize * 1.1) {
      this.cleanup();
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;

    if (!item) {
      this.updateStats(false);
      return null;
    }

    const now = Date.now();

    if (now > item.expiry) {
      this.cache.delete(key);
      this.updateStats(false);
      return null;
    }

    // Update access statistics
    item.hitCount++;
    item.lastAccessed = now;

    this.updateStats(true);
    return item.data;
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  async batchGet<T>(
    keys: string[],
    fetcher: (missingKeys: string[]) => Promise<Record<string, T>>,
    ttl?: number
  ): Promise<Record<string, T>> {
    const result: Record<string, T> = {};
    const missingKeys: string[] = [];

    // Check cache for existing items
    for (const key of keys) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        result[key] = cached;
      } else {
        missingKeys.push(key);
      }
    }

    // Fetch missing items
    if (missingKeys.length > 0) {
      try {
        const fetchedData = await fetcher(missingKeys);

        // Cache the fetched data
        for (const [key, value] of Object.entries(fetchedData)) {
          this.set(key, value, ttl);
          result[key] = value;
        }
      } catch {
        // If fetch fails, try to return expired cached data for missing keys
        for (const key of missingKeys) {
          const cached = this.cache.get(key);
          if (cached) {
            result[key] = cached.data as T;
          }
        }
      }
    }

    return result;
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const item of this.cache.values()) {
      if (item.timestamp < oldestEntry) {
        oldestEntry = item.timestamp;
      }
      if (item.timestamp > newestEntry) {
        newestEntry = item.timestamp;
      }
    }

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      totalMemory: this.getMemoryUsage(),
      oldestEntry: this.cache.size > 0 ? oldestEntry : Date.now(),
      newestEntry: this.cache.size > 0 ? newestEntry : Date.now(),
    };
  }

  getExpiredItems(): string[] {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expired.push(key);
      }
    }

    return expired;
  }

  extendTTL(key: string, additionalTTL: number): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    item.expiry += additionalTTL;
    return true;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Utility functions
export const generateCacheKey = {
  quote: (symbol: string) => `quote:${symbol}`,
  intraday: (symbol: string, interval: string) =>
    `intraday:${symbol}:${interval}`,
  daily: (symbol: string) => `daily:${symbol}`,
  news: (symbols: string[], topics: string[], limit: number) =>
    `news:${symbols.join(',')}:${topics.join(',')}:${limit}`,
  search: (query: string) => `search:${query.toLowerCase()}`,
  technical: (symbol: string, indicator: string, interval: string) =>
    `technical:${symbol}:${indicator}:${interval}`,
  overview: (symbol: string) => `overview:${symbol}`,
  validation: (symbol: string) => `validation:${symbol}`,
};

// Wrapper function for StandardApiResponse caching
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<StandardApiResponse<T>>,
  ttl?: number
): Promise<StandardApiResponse<T>> {
  return cacheService.getOrSet(key, fetcher, ttl);
}

// Export cache instance for direct usage
export default cacheService;
