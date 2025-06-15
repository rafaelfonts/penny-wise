// ==========================================
// REDIS CONFIGURATION SERVICE
// Handles Redis connections with fallback
// ==========================================

import Redis from 'ioredis';

export interface RedisConfig {
  url: string;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  enableAutoPipelining: boolean;
  lazyConnect: boolean;
  connectTimeout: number;
  commandTimeout: number;
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RedisService {
  private client: Redis | null = null;
  private fallbackCache = new Map<string, CacheEntry>();
  private isRedisAvailable = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private config: RedisConfig;

  constructor() {
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableAutoPipelining: true,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
    };

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.warn(
        '[Redis] Max connection attempts reached, using fallback cache'
      );
      return;
    }

    try {
      this.client = new Redis(this.config.url, {
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        enableAutoPipelining: this.config.enableAutoPipelining,
        lazyConnect: this.config.lazyConnect,
        connectTimeout: this.config.connectTimeout,
        commandTimeout: this.config.commandTimeout,
      });

      // Event handlers
      this.client.on('connect', () => {
        console.log('[Redis] Connected successfully');
        this.isRedisAvailable = true;
        this.connectionAttempts = 0;
      });

      this.client.on('error', error => {
        console.error('[Redis] Connection error:', error.message);
        this.isRedisAvailable = false;
        this.connectionAttempts++;

        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          console.warn('[Redis] Switching to fallback cache mode');
          this.client?.disconnect();
          this.client = null;
        }
      });

      this.client.on('close', () => {
        console.warn('[Redis] Connection closed');
        this.isRedisAvailable = false;
      });

      this.client.on('reconnecting', () => {
        console.log('[Redis] Attempting to reconnect...');
      });

      // Test connection
      await this.client.ping();
    } catch (error) {
      console.error('[Redis] Initialization failed:', error);
      this.connectionAttempts++;
      this.isRedisAvailable = false;

      if (this.client) {
        this.client.disconnect();
        this.client = null;
      }
    }
  }

  // ==========================================
  // CACHE OPERATIONS
  // ==========================================

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisAvailable && this.client) {
        const data = await this.client.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
      }
    } catch (error) {
      console.warn('[Redis] Get operation failed, using fallback:', error);
      this.isRedisAvailable = false;
    }

    // Fallback to in-memory cache
    return this.getFallback<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.client) {
        const serialized = JSON.stringify(value);

        if (ttlSeconds) {
          await this.client.setex(key, ttlSeconds, serialized);
        } else {
          await this.client.set(key, serialized);
        }

        return true;
      }
    } catch (error) {
      console.warn('[Redis] Set operation failed, using fallback:', error);
      this.isRedisAvailable = false;
    }

    // Fallback to in-memory cache
    return this.setFallback(key, value, ttlSeconds);
  }

  async del(key: string): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.client) {
        const result = await this.client.del(key);
        return result > 0;
      }
    } catch (error) {
      console.warn('[Redis] Delete operation failed, using fallback:', error);
      this.isRedisAvailable = false;
    }

    // Fallback to in-memory cache
    this.fallbackCache.delete(key);
    return true;
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.client) {
        const result = await this.client.exists(key);
        return result === 1;
      }
    } catch (error) {
      console.warn('[Redis] Exists operation failed, using fallback:', error);
      this.isRedisAvailable = false;
    }

    // Fallback to in-memory cache
    return this.fallbackCache.has(key);
  }

  async incr(key: string): Promise<number> {
    try {
      if (this.isRedisAvailable && this.client) {
        return await this.client.incr(key);
      }
    } catch (error) {
      console.warn('[Redis] Incr operation failed, using fallback:', error);
      this.isRedisAvailable = false;
    }

    // Fallback implementation
    const current = this.fallbackCache.get(key);
    const value = current ? (current.data as number) + 1 : 1;
    this.setFallback(key, value);
    return value;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.client) {
        const result = await this.client.expire(key, ttlSeconds);
        return result === 1;
      }
    } catch (error) {
      console.warn('[Redis] Expire operation failed, using fallback:', error);
    }

    // Update TTL in fallback cache
    const entry = this.fallbackCache.get(key);
    if (entry) {
      entry.ttl = ttlSeconds * 1000; // Convert to milliseconds
      entry.timestamp = Date.now();
    }
    return !!entry;
  }

  // ==========================================
  // FALLBACK CACHE OPERATIONS
  // ==========================================

  private getFallback<T>(key: string): T | null {
    const entry = this.fallbackCache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
      this.fallbackCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setFallback<T>(key: string, value: T, ttlSeconds?: number): boolean {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds ? ttlSeconds * 1000 : 0, // Convert to milliseconds or 0 for no expiry
    };

    this.fallbackCache.set(key, entry);
    return true;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  isConnected(): boolean {
    return this.isRedisAvailable && this.client !== null;
  }

  getConnectionStatus(): string {
    if (this.isRedisAvailable && this.client) {
      return 'redis-connected';
    } else if (this.fallbackCache.size > 0) {
      return 'fallback-active';
    } else {
      return 'no-cache';
    }
  }

  getStats(): {
    redis: boolean;
    fallbackSize: number;
    connectionAttempts: number;
    status: string;
  } {
    return {
      redis: this.isRedisAvailable,
      fallbackSize: this.fallbackCache.size,
      connectionAttempts: this.connectionAttempts,
      status: this.getConnectionStatus(),
    };
  }

  // Clean up expired entries in fallback cache
  cleanupFallbackCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.fallbackCache.entries()) {
      if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.fallbackCache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(
        `[Redis] Cleaned up ${keysToDelete.length} expired fallback entries`
      );
    }
  }

  // Attempt to reconnect Redis
  async attemptReconnection(): Promise<boolean> {
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      console.log('[Redis] Attempting manual reconnection...');
      await this.initializeRedis();
      return this.isRedisAvailable;
    }
    return false;
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.client) {
      console.log('[Redis] Disconnecting...');
      await this.client.quit();
      this.client = null;
    }
    this.isRedisAvailable = false;
    this.fallbackCache.clear();
  }
}

// Singleton instance
const redisService = new RedisService();

// Cleanup fallback cache every 5 minutes
setInterval(
  () => {
    redisService.cleanupFallbackCache();
  },
  5 * 60 * 1000
);

export default redisService;
