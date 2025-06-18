import Redis from 'ioredis';
import { loggers } from '@/lib/utils/logger';

const logger = loggers.application;

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  keyPrefix?: string;
  defaultTTL?: number;
  maxRetries?: number;
}

export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  namespace?: string;
}

export class RedisCache {
  private redis: Redis;
  private config: CacheConfig;
  private isConnected = false;

  constructor(config: CacheConfig) {
    this.config = {
      keyPrefix: 'penny-wise:',
      defaultTTL: 3600, // 1 hour
      maxRetries: 3,
      retryDelayOnFailover: 100,
      ...config,
    };

    this.redis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      keyPrefix: this.config.keyPrefix,
      maxRetriesPerRequest: this.config.maxRetries,
      retryDelayOnFailover: this.config.retryDelayOnFailover,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis cache connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis cache error:', { error: error.message });
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis cache connection closed');
    });
  }

  private generateKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private compress(data: string): string {
    // Simple compression for large data
    return data.length > 1000 ? 
      Buffer.from(data).toString('base64') : 
      data;
  }

  private decompress(data: string): string {
    try {
      // Try to decompress if it looks like base64
      if (data.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(data)) {
        return Buffer.from(data, 'base64').toString();
      }
      return data;
    } catch {
      return data;
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.redis.quit();
    } catch (error) {
      logger.error('Error disconnecting from Redis:', { error });
    }
  }

  async get<T = string>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, returning null');
      return null;
    }

    try {
      const fullKey = this.generateKey(key, options.namespace);
      const cached = await this.redis.get(fullKey);
      
      if (!cached) return null;

      const decompressed = options.compress ? this.decompress(cached) : cached;
      
      try {
        return JSON.parse(decompressed) as T;
      } catch {
        return decompressed as T;
      }
    } catch (error) {
      logger.error('Redis get error:', { key, error });
      return null;
    }
  }

  async set(
    key: string, 
    value: unknown, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping set');
      return false;
    }

    try {
      const fullKey = this.generateKey(key, options.namespace);
      const ttl = options.ttl || this.config.defaultTTL!;
      
      let data = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (options.compress) {
        data = this.compress(data);
      }

      await this.redis.setex(fullKey, ttl, data);
      return true;
    } catch (error) {
      logger.error('Redis set error:', { key, error });
      return false;
    }
  }

  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const fullKey = this.generateKey(key, options.namespace);
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete error:', { key, error });
      return false;
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const fullKey = this.generateKey(key, options.namespace);
      const result = await this.redis.exists(fullKey);
      return result > 0;
    } catch (error) {
      logger.error('Redis exists error:', { key, error });
      return false;
    }
  }

  async mget<T = string>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    if (!this.isConnected) return keys.map(() => null);

    try {
      const fullKeys = keys.map(key => this.generateKey(key, options.namespace));
      const results = await this.redis.mget(...fullKeys);
      
      return results.map(result => {
        if (!result) return null;
        
        const decompressed = options.compress ? this.decompress(result) : result;
        
        try {
          return JSON.parse(decompressed) as T;
        } catch {
          return decompressed as T;
        }
      });
    } catch (error) {
      logger.error('Redis mget error:', { keys, error });
      return keys.map(() => null);
    }
  }

  async mset(
    keyValuePairs: Array<{ key: string; value: unknown }>,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const pipeline = this.redis.pipeline();
      const ttl = options.ttl || this.config.defaultTTL!;

      for (const { key, value } of keyValuePairs) {
        const fullKey = this.generateKey(key, options.namespace);
        let data = typeof value === 'string' ? value : JSON.stringify(value);
        
        if (options.compress) {
          data = this.compress(data);
        }

        pipeline.setex(fullKey, ttl, data);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Redis mset error:', { keyValuePairs, error });
      return false;
    }
  }

  async flush(namespace?: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      if (namespace) {
        const pattern = this.generateKey('*', namespace);
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.flushdb();
      }
      return true;
    } catch (error) {
      logger.error('Redis flush error:', { namespace, error });
      return false;
    }
  }

  async increment(key: string, by: number = 1, options: CacheOptions = {}): Promise<number | null> {
    if (!this.isConnected) return null;

    try {
      const fullKey = this.generateKey(key, options.namespace);
      const result = await this.redis.incrby(fullKey, by);
      
      // Set TTL if key is new
      const ttl = options.ttl || this.config.defaultTTL!;
      await this.redis.expire(fullKey, ttl);
      
      return result;
    } catch (error) {
      logger.error('Redis increment error:', { key, error });
      return null;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    memory: string;
    keys: number;
    hits: number;
    misses: number;
  }> {
    if (!this.isConnected) {
      return {
        connected: false,
        memory: '0',
        keys: 0,
        hits: 0,
        misses: 0,
      };
    }

    try {
      const info = await this.redis.info('memory');
      const stats = await this.redis.info('stats');
      const keyCount = await this.redis.dbsize();

      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
      const missesMatch = stats.match(/keyspace_misses:(\d+)/);

      return {
        connected: true,
        memory: memoryMatch ? memoryMatch[1].trim() : '0',
        keys: keyCount,
        hits: hitsMatch ? parseInt(hitsMatch[1]) : 0,
        misses: missesMatch ? parseInt(missesMatch[1]) : 0,
      };
    } catch (error) {
      logger.error('Redis stats error:', { error });
      return {
        connected: this.isConnected,
        memory: '0',
        keys: 0,
        hits: 0,
        misses: 0,
      };
    }
  }
}

// Singleton instance
let cacheInstance: RedisCache | null = null;

export function createRedisCache(config: CacheConfig): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache(config);
  }
  return cacheInstance;
}

export function getRedisCache(): RedisCache | null {
  return cacheInstance;
}

// High-level cache utilities
export class HighPerformanceCache {
  private cache: RedisCache;

  constructor(cache: RedisCache) {
    this.cache = cache;
  }

  // Market data caching with compression
  async cacheMarketData(symbol: string, data: unknown, ttl: number = 300): Promise<void> {
    await this.cache.set(
      `market:${symbol}`,
      data,
      { ttl, compress: true, namespace: 'market' }
    );
  }

  async getMarketData<T>(symbol: string): Promise<T | null> {
    return await this.cache.get<T>(
      `market:${symbol}`,
      { compress: true, namespace: 'market' }
    );
  }

  // User session caching
  async cacheUserSession(userId: string, sessionData: unknown, ttl: number = 86400): Promise<void> {
    await this.cache.set(
      `session:${userId}`,
      sessionData,
      { ttl, namespace: 'sessions' }
    );
  }

  async getUserSession<T>(userId: string): Promise<T | null> {
    return await this.cache.get<T>(
      `session:${userId}`,
      { namespace: 'sessions' }
    );
  }

  // API response caching
  async cacheApiResponse(endpoint: string, params: Record<string, unknown>, response: unknown, ttl: number = 600): Promise<void> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    await this.cache.set(key, response, { ttl, compress: true, namespace: 'api' });
  }

  async getApiResponse<T>(endpoint: string, params: Record<string, unknown>): Promise<T | null> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await this.cache.get<T>(key, { compress: true, namespace: 'api' });
  }

  // Bulk operations for performance
  async cacheBulkMarketData(dataMap: Map<string, unknown>, ttl: number = 300): Promise<void> {
    const keyValuePairs = Array.from(dataMap.entries()).map(([symbol, data]) => ({
      key: `market:${symbol}`,
      value: data,
    }));

    await this.cache.mset(keyValuePairs, { ttl, compress: true, namespace: 'market' });
  }

  async getBulkMarketData<T>(symbols: string[]): Promise<Map<string, T | null>> {
    const keys = symbols.map(symbol => `market:${symbol}`);
    const results = await this.cache.mget<T>(keys, { compress: true, namespace: 'market' });
    
    const resultMap = new Map<string, T | null>();
    symbols.forEach((symbol, index) => {
      resultMap.set(symbol, results[index]);
    });
    
    return resultMap;
  }

  // Cache warming for critical data
  async warmCache(symbols: string[]): Promise<void> {
    logger.info('Warming cache for symbols:', { symbols });
    
    // Pre-load critical market data
    for (const symbol of symbols) {
      try {
        // This would typically fetch from your data source
        const marketData = await this.fetchMarketDataFromSource(symbol);
        await this.cacheMarketData(symbol, marketData, 600);
      } catch (error) {
        logger.error(`Failed to warm cache for ${symbol}:`, { error });
      }
    }
  }

  private async fetchMarketDataFromSource(symbol: string): Promise<unknown> {
    // Placeholder - implement your data source fetching logic
    logger.info(`Fetching market data for ${symbol} from source`);
    return { symbol, price: 100, timestamp: Date.now() };
  }
}

export default RedisCache; 