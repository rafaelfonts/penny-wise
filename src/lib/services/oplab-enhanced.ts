// ==========================================
// ENHANCED OPLAB API SERVICE - Penny Wise
// ==========================================

import {
  OplabService,
  OplabConfig,
  OplabResponse,
  Stock,
  MarketStatus,
  Portfolio,
} from './oplab';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  responseTime: number;
  timestamp: string;
  cacheStats: { size: number; keys: string[] };
}

export interface EnhancedOplabConfig extends OplabConfig {
  retryAttempts?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  enableLogging?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RateLimitInfo {
  requestsRemaining: number;
  resetTime: number;
  dailyLimit: number;
}

export interface EnhancedOplabResponse<T> extends OplabResponse<T> {
  cached?: boolean;
  retryCount?: number;
  responseTime?: number;
  rateLimit?: RateLimitInfo;
}

export class EnhancedOplabService {
  private oplabService: OplabService;
  private cache = new Map<string, CacheEntry<unknown>>();
  private config: EnhancedOplabConfig;
  private requestCount = 0;
  private startTime = Date.now();

  constructor(config: EnhancedOplabConfig) {
    this.oplabService = new OplabService(config);
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 60000, // 1 minute default
      enableLogging: true,
      ...config,
    };
  }

  private log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: unknown
  ) {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: 'OpLab Enhanced',
      message,
      data,
      requestCount: this.requestCount,
    };

    console[level](
      `[${timestamp}] OpLab Enhanced [${level.toUpperCase()}]:`,
      message,
      data || ''
    );

    // Store critical errors for later analysis
    if (level === 'error') {
      this.storeCriticalError(logEntry);
    }
  }

  private storeCriticalError(error: unknown) {
    try {
      const errors = JSON.parse(localStorage.getItem('oplab_errors') || '[]');
      errors.push(error);
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      localStorage.setItem('oplab_errors', JSON.stringify(errors));
    } catch (e) {
      // Fallback to console if localStorage fails
      console.error('Failed to store critical error:', e);
    }
  }

  private getCacheKey(endpoint: string, params?: unknown): string {
    return `oplab:${endpoint}:${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.config.cacheEnabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    this.log('info', `Cache hit for ${key}`);
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL!,
    });

    this.log('info', `Cached data for ${key}`);
  }

  private async executeWithRetry<T>(
    operation: () => Promise<OplabResponse<T>>,
    operationName: string
  ): Promise<EnhancedOplabResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;

        this.log('info', `${operationName} completed in ${duration}ms`);

        return {
          ...result,
          retryCount: attempt,
          responseTime: duration,
        };
      } catch (error) {
        lastError = error as Error;
        this.log(
          'warn',
          `${operationName} attempt ${attempt + 1} failed: ${lastError.message}`
        );

        if (attempt < this.config.retryAttempts!) {
          const delay = this.config.retryDelay! * Math.pow(2, attempt);
          this.log('info', `Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const errorMessage = `${operationName} failed after ${this.config.retryAttempts! + 1} attempts: ${lastError?.message}`;
    this.log('error', errorMessage);

    if (this.config.enableLogging) {
      this.storeCriticalError({
        operation: operationName,
        error: lastError?.message || 'Unknown error',
        attempts: this.config.retryAttempts! + 1,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: false,
      error: errorMessage,
      retryCount: this.config.retryAttempts!,
      status: 500,
    };
  }

  async getStocksEnhanced(
    useCache: boolean = true
  ): Promise<EnhancedOplabResponse<Stock[]>> {
    const cacheKey = 'stocks_list';

    if (useCache && this.config.cacheEnabled) {
      const cached = this.getFromCache<OplabResponse<Stock[]>>(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    return this.executeWithRetry(async () => {
      const result = await this.oplabService.getStocks();
      if (result.success && this.config.cacheEnabled) {
        this.setCache(cacheKey, result, this.config.cacheTTL);
      }
      return result;
    }, 'getStocksEnhanced');
  }

  async getStockEnhanced(
    symbol: string,
    useCache: boolean = true
  ): Promise<EnhancedOplabResponse<Stock>> {
    const cacheKey = `stock_${symbol}`;

    if (useCache && this.config.cacheEnabled) {
      const cached = this.getFromCache<OplabResponse<Stock>>(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    return this.executeWithRetry(async () => {
      const result = await this.oplabService.getStock(symbol);
      if (result.success && this.config.cacheEnabled) {
        this.setCache(cacheKey, result, this.config.cacheTTL);
      }
      return result;
    }, `getStockEnhanced(${symbol})`);
  }

  async getMarketStatusEnhanced(
    useCache: boolean = true
  ): Promise<EnhancedOplabResponse<MarketStatus>> {
    const cacheKey = 'market_status';

    if (useCache && this.config.cacheEnabled) {
      const cached = this.getFromCache<OplabResponse<MarketStatus>>(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    return this.executeWithRetry(async () => {
      const result = await this.oplabService.getMarketStatus();
      if (result.success && this.config.cacheEnabled) {
        this.setCache(cacheKey, result, this.config.cacheTTL);
      }
      return result;
    }, 'getMarketStatusEnhanced');
  }

  async getPortfoliosEnhanced(
    useCache: boolean = true
  ): Promise<EnhancedOplabResponse<Portfolio[]>> {
    const cacheKey = 'portfolios_list';

    if (useCache && this.config.cacheEnabled) {
      const cached = this.getFromCache<OplabResponse<Portfolio[]>>(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    return this.executeWithRetry(async () => {
      const result = await this.oplabService.getPortfolios();
      if (result.success && this.config.cacheEnabled) {
        this.setCache(cacheKey, result, this.config.cacheTTL);
      }
      return result;
    }, 'getPortfoliosEnhanced');
  }

  // Delegate methods to base service
  async authorize() {
    return this.oplabService.authorize();
  }

  async getStocks() {
    return this.oplabService.getStocks();
  }

  async getStock(symbol: string) {
    return this.oplabService.getStock(symbol);
  }

  async getMarketStatus() {
    return this.oplabService.getMarketStatus();
  }

  async getPortfolios() {
    return this.oplabService.getPortfolios();
  }

  async getMultipleStocks(
    symbols: string[]
  ): Promise<EnhancedOplabResponse<Record<string, Stock>>> {
    const startTime = Date.now();

    try {
      const promises = symbols.map(symbol =>
        this.getStockEnhanced(symbol).catch(error => {
          this.log('warn', `Failed to fetch ${symbol}: ${error.message}`);
          return null;
        })
      );

      const results = await Promise.all(promises);
      const stockData: Record<string, Stock> = {};

      results.forEach((result, index) => {
        if (result && result.success && result.data) {
          stockData[symbols[index]] = result.data;
        }
      });

      const duration = Date.now() - startTime;
      this.log(
        'info',
        `Batch operation completed in ${duration}ms for ${symbols.length} symbols`
      );

      return {
        success: true,
        data: stockData,
        status: 200,
        responseTime: duration,
      };
    } catch (error) {
      const errorMessage = `Batch operation failed: ${(error as Error).message}`;
      this.log('error', errorMessage);

      return {
        success: false,
        error: errorMessage,
        status: 500,
      };
    }
  }

  async healthCheckEnhanced(): Promise<
    EnhancedOplabResponse<HealthCheckResult>
  > {
    const startTime = Date.now();
    const checks: Record<string, boolean> = {};

    try {
      // Test authorization
      const authResult = await this.authorize();
      checks.authorization = authResult.success;

      // Test market status
      const marketResult = await this.getMarketStatus();
      checks.marketStatus = marketResult.success;

      // Test stocks endpoint
      const stocksResult = await this.getStocks();
      checks.stocksEndpoint = stocksResult.success;

      const allHealthy = Object.values(checks).every(check => check);
      const duration = Date.now() - startTime;

      const healthData: HealthCheckResult = {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        responseTime: duration,
        timestamp: new Date().toISOString(),
        cacheStats: this.getCacheStats(),
      };

      return {
        success: true,
        data: healthData,
        status: 200,
        responseTime: duration,
      };
    } catch (error) {
      const errorMessage = `Health check failed: ${(error as Error).message}`;
      this.log('error', errorMessage);

      return {
        success: false,
        error: errorMessage,
        status: 500,
      };
    }
  }

  // Clear cache method
  clearCache(): void {
    this.cache.clear();
    this.log('info', 'Cache cleared');
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Get error logs
  getErrorLogs(): Record<string, unknown>[] {
    try {
      return JSON.parse(localStorage.getItem('oplab_errors') || '[]');
    } catch {
      return [];
    }
  }

  // Clear error logs
  clearErrorLogs(): void {
    try {
      localStorage.removeItem('oplab_errors');
      this.log('info', 'Error logs cleared');
    } catch (error) {
      this.log('error', 'Failed to clear error logs', { error });
    }
  }
}

// Factory function to create enhanced service
export const createEnhancedOplabService = (
  config: EnhancedOplabConfig
): EnhancedOplabService => {
  return new EnhancedOplabService(config);
};

// Default enhanced service instance
export const getEnhancedOplabService = (): EnhancedOplabService => {
  const accessToken =
    process.env.OPLAB_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_OPLAB_ACCESS_TOKEN;
  const baseUrl =
    process.env.OPLAB_BASE_URL || process.env.NEXT_PUBLIC_OPLAB_BASE_URL;

  if (!accessToken) {
    throw new Error('OpLab access token is not configured');
  }

  return createEnhancedOplabService({
    accessToken,
    baseUrl,
    retryAttempts: 3,
    retryDelay: 1000,
    cacheEnabled: true,
    cacheTTL: 60000,
    enableLogging: true,
  });
};
