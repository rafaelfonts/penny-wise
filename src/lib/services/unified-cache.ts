// ==========================================
// UNIFIED CACHE SERVICE
// Combines in-memory and Redis caching with intelligent fallback
// Replaces fragmented cache implementations
// ==========================================

import redisService from './redis-config';
import { StandardApiResponse } from '@/lib/types/api-response';

export interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  expiry: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
  source: 'memory' | 'redis';
}

export interface CacheStats {
  memory: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    totalMemory: number;
  };
  redis: {
    connected: boolean;
    hits: number;
    misses: number;
    hitRate: number;
  };
  combined: {
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
  };
}

export interface UnifiedCacheConfig {
  maxMemorySize: number;
  defaultTTL: number;
  cleanupInterval: number;
  redisEnabled: boolean;
  enableStats: boolean;
  fallbackStrategy: 'memory-first' | 'redis-first' | 'memory-only';
}

class UnifiedCacheService {
  private memoryCache = new Map<string, CacheItem>();
  private stats = {
    memory: { hits: 0, misses: 0 },
    redis: { hits: 0, misses: 0 },
  };
  private cleanupTimer?: NodeJS.Timeout;
  private config: UnifiedCacheConfig;

  constructor(config: Partial<UnifiedCacheConfig> = {}) {
    this.config = {
      maxMemorySize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      redisEnabled: true,
      enableStats: true,
      fallbackStrategy: 'memory-first',
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

    // Clean expired items from memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // LRU eviction if memory cache is too large
    if (this.memoryCache.size > this.config.maxMemorySize) {
      const sortedEntries = Array.from(this.memoryCache.entries()).sort(
        ([, a], [, b]) => a.lastAccessed - b.lastAccessed
      );

      const toEvict = sortedEntries.slice(
        0,
        this.memoryCache.size - this.config.maxMemorySize
      );
      toEvict.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  private updateStats(source: 'memory' | 'redis', hit: boolean): void {
    if (!this.config.enableStats) return;

    if (hit) {
      this.stats[source].hits++;
    } else {
      this.stats[source].misses++;
    }
  }

  // ==========================================
  // CORE CACHE OPERATIONS
  // ==========================================

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const actualTTL = ttl || this.config.defaultTTL;

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiry: now + actualTTL,
      ttl: actualTTL,
      hitCount: 0,
      lastAccessed: now,
      source: 'memory',
    };

    // Always set in memory cache
    this.memoryCache.set(key, item);

    // Also set in Redis if available and enabled
    if (this.config.redisEnabled && redisService.isConnected()) {
      try {
        await redisService.set(key, data, Math.floor(actualTTL / 1000));
      } catch (error) {
        console.warn(
          '[UnifiedCache] Redis set failed, using memory only:',
          error
        );
      }
    }

    // Trigger cleanup if memory cache is getting too large
    if (this.memoryCache.size > this.config.maxMemorySize * 1.1) {
      this.cleanup();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    switch (this.config.fallbackStrategy) {
      case 'memory-first':
        return this.getMemoryFirst<T>(key);
      case 'redis-first':
        return this.getRedisFirst<T>(key);
      case 'memory-only':
        return this.getMemoryOnly<T>(key);
      default:
        return this.getMemoryFirst<T>(key);
    }
  }

  private async getMemoryFirst<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      this.updateStats('memory', true);
      return memoryResult;
    }

    // Try Redis if memory miss
    if (this.config.redisEnabled && redisService.isConnected()) {
      try {
        const redisResult = await redisService.get<T>(key);
        if (redisResult !== null) {
          // Store in memory for faster future access
          await this.setInMemory(key, redisResult, this.config.defaultTTL);
          this.updateStats('redis', true);
          return redisResult;
        }
      } catch (error) {
        console.warn('[UnifiedCache] Redis get failed:', error);
      }
    }

    // Both caches missed
    this.updateStats('memory', false);
    if (this.config.redisEnabled) {
      this.updateStats('redis', false);
    }
    return null;
  }

  private async getRedisFirst<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.config.redisEnabled && redisService.isConnected()) {
      try {
        const redisResult = await redisService.get<T>(key);
        if (redisResult !== null) {
          this.updateStats('redis', true);
          return redisResult;
        }
      } catch (error) {
        console.warn(
          '[UnifiedCache] Redis get failed, falling back to memory:',
          error
        );
      }
    }

    // Try memory cache if Redis miss or unavailable
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      this.updateStats('memory', true);
      return memoryResult;
    }

    // Both caches missed
    this.updateStats('memory', false);
    if (this.config.redisEnabled) {
      this.updateStats('redis', false);
    }
    return null;
  }

  private getMemoryOnly<T>(key: string): T | null {
    const result = this.getFromMemory<T>(key);
    this.updateStats('memory', result !== null);
    return result;
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key) as CacheItem<T> | undefined;

    if (!item) {
      return null;
    }

    const now = Date.now();

    if (now > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    // Update access statistics
    item.hitCount++;
    item.lastAccessed = now;

    return item.data;
  }

  private setInMemory<T>(key: string, data: T, ttl: number): void {
    const now = Date.now();

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiry: now + ttl,
      ttl,
      hitCount: 0,
      lastAccessed: now,
      source: 'memory',
    };

    this.memoryCache.set(key, item);
  }

  // ==========================================
  // ADVANCED OPERATIONS
  // ==========================================

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  async batchGet<T>(
    keys: string[],
    fetcher: (missingKeys: string[]) => Promise<Record<string, T>>,
    ttl?: number
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};
    const missingKeys: string[] = [];

    // Check cache for each key
    for (const key of keys) {
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        results[key] = cachedValue;
      } else {
        missingKeys.push(key);
      }
    }

    // Fetch missing values
    if (missingKeys.length > 0) {
      try {
        const fetchedData = await fetcher(missingKeys);

        // Cache and add to results
        for (const [key, value] of Object.entries(fetchedData)) {
          await this.set(key, value, ttl);
          results[key] = value;
        }
      } catch (error) {
        console.error('[UnifiedCache] Batch fetch failed:', error);
      }
    }

    return results;
  }

  async has(key: string): Promise<boolean> {
    // Check memory first
    if (this.memoryCache.has(key)) {
      const item = this.memoryCache.get(key);
      if (item && Date.now() <= item.expiry) {
        return true;
      }
    }

    // Check Redis if enabled
    if (this.config.redisEnabled && redisService.isConnected()) {
      try {
        return await redisService.exists(key);
      } catch (error) {
        console.warn('[UnifiedCache] Redis has check failed:', error);
      }
    }

    return false;
  }

  async delete(key: string): Promise<boolean> {
    let deleted = false;

    // Delete from memory
    if (this.memoryCache.delete(key)) {
      deleted = true;
    }

    // Delete from Redis if enabled
    if (this.config.redisEnabled && redisService.isConnected()) {
      try {
        const redisDeleted = await redisService.del(key);
        deleted = deleted || redisDeleted;
      } catch (error) {
        console.warn('[UnifiedCache] Redis delete failed:', error);
      }
    }

    return deleted;
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.stats.memory.hits = 0;
    this.stats.memory.misses = 0;

    // Clear Redis cache - using fallback cache cleanup since Redis doesn't have clearAll
    if (this.config.redisEnabled && redisService.isConnected()) {
      try {
        redisService.cleanupFallbackCache();
        this.stats.redis.hits = 0;
        this.stats.redis.misses = 0;
      } catch (error) {
        console.warn('[UnifiedCache] Redis clear failed:', error);
      }
    }
  }

  // ==========================================
  // STATS AND MONITORING
  // ==========================================

  getStats(): CacheStats {
    const memoryTotal = this.stats.memory.hits + this.stats.memory.misses;
    const redisTotal = this.stats.redis.hits + this.stats.redis.misses;
    const overallTotal = memoryTotal + redisTotal;

    return {
      memory: {
        size: this.memoryCache.size,
        hits: this.stats.memory.hits,
        misses: this.stats.memory.misses,
        hitRate: memoryTotal > 0 ? this.stats.memory.hits / memoryTotal : 0,
        totalMemory: this.getMemoryUsage(),
      },
      redis: {
        connected: redisService.isConnected(),
        hits: this.stats.redis.hits,
        misses: this.stats.redis.misses,
        hitRate: redisTotal > 0 ? this.stats.redis.hits / redisTotal : 0,
      },
      combined: {
        totalHits: this.stats.memory.hits + this.stats.redis.hits,
        totalMisses: this.stats.memory.misses + this.stats.redis.misses,
        overallHitRate:
          overallTotal > 0
            ? (this.stats.memory.hits + this.stats.redis.hits) / overallTotal
            : 0,
      },
    };
  }

  private getMemoryUsage(): number {
    let size = 0;
    for (const [key, item] of this.memoryCache.entries()) {
      size += key.length * 2; // Approximate string size
      size += JSON.stringify(item.data).length * 2; // Approximate data size
      size += 64; // Overhead for timestamps, etc.
    }
    return size;
  }

  getStatus() {
    return {
      memorySize: this.memoryCache.size,
      redisConnected: redisService.isConnected(),
      strategy: this.config.fallbackStrategy,
      config: this.config,
      stats: this.getStats(),
    };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.memoryCache.clear();
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export async function withUnifiedCache<T>(
  key: string,
  fetcher: () => Promise<StandardApiResponse<T>>,
  ttl?: number
): Promise<StandardApiResponse<T>> {
  const cached = await unifiedCacheService.get<StandardApiResponse<T>>(key);

  if (cached) {
    return { ...cached, cached: true };
  }

  const result = await fetcher();
  await unifiedCacheService.set(key, result, ttl);

  return { ...result, cached: false };
}

// Cache key generators for different data types
export const generateUnifiedCacheKey = {
  quote: (symbol: string) => `quote:${symbol.toUpperCase()}`,
  intraday: (symbol: string, interval: string) =>
    `intraday:${symbol.toUpperCase()}:${interval}`,
  daily: (symbol: string) => `daily:${symbol.toUpperCase()}`,
  overview: (symbol: string) => `overview:${symbol.toUpperCase()}`,
  news: (tickers?: string[], topics?: string[], limit = 50) =>
    `news:${(tickers || []).join(',')}:${(topics || []).join(',')}:${limit}`,
  topMovers: () => 'top-gainers-losers',
  marketStatus: () => 'market-status',
  chatResponse: (userId: string, message: string) =>
    `chat:${userId}:${message}`,
  userPreferences: (userId: string) => `user:${userId}:preferences`,
};

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const unifiedCacheService = new UnifiedCacheService();
export default unifiedCacheService;
