// ==========================================
// OPTIMIZED MARKET DATA SERVICE - Penny Wise
// ==========================================

import {
  StockQuote,
  IntradayData,
  DailyData,
  CompanyOverview,
  NewsItem,
  TopGainersLosers,
  TechnicalIndicator,
  MarketStatus,
  SearchResult,
  ApiResponse,
} from '@/lib/types/market';

import { StandardApiResponse } from '@/lib/types/api-response';
import {
  cacheService,
  generateCacheKey,
  withCache,
} from '@/lib/utils/cache-service';

import alphaVantageService from './alpha-vantage';
import yahooFinanceService from './yahoo-finance';

// Utility function to convert ApiResponse to StandardApiResponse
function adaptApiResponse<T>(
  apiResponse: ApiResponse<T>
): StandardApiResponse<T | null> {
  return {
    success: apiResponse.success,
    data: apiResponse.data,
    error: apiResponse.error || undefined,
    timestamp: apiResponse.timestamp,
    source: apiResponse.source,
    cached: apiResponse.cached,
  };
}

// Custom cache wrapper that handles the ApiResponse conversion
async function withApiCache<T>(
  key: string,
  fetcher: () => Promise<ApiResponse<T>>,
  ttl?: number
): Promise<ApiResponse<T>> {
  const standardFetcher = async (): Promise<StandardApiResponse<T | null>> => {
    const result = await fetcher();
    return adaptApiResponse(result);
  };

  const standardResult = await withCache(key, standardFetcher, ttl);

  // Convert back to ApiResponse with proper source type
  return {
    success: standardResult.success,
    data: standardResult.data || null,
    error: standardResult.error || null,
    timestamp: standardResult.timestamp,
    source:
      (standardResult.source as 'alpha_vantage' | 'yahoo_finance' | 'oplab') ||
      'alpha_vantage',
    cached: standardResult.cached || false,
  };
}

type DataSource = 'alpha_vantage' | 'yahoo_finance';

interface OptimizedMarketDataConfig {
  source: DataSource;
  fallback?: DataSource;
  cacheEnabled: boolean;
  cacheDuration: number;
  batchSize: number;
  batchDelay: number;
}

class OptimizedMarketDataService {
  private config: OptimizedMarketDataConfig;
  private primarySource: DataSource;
  private fallbackSource: DataSource;

  constructor() {
    this.config = {
      source: 'alpha_vantage',
      fallback: 'yahoo_finance',
      cacheEnabled: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      batchSize: 10,
      batchDelay: 100,
    };

    this.primarySource = this.config.source;
    this.fallbackSource = this.config.fallback!;
  }

  private async executeWithFallback<T>(
    primaryCall: () => Promise<ApiResponse<T>>,
    fallbackCall?: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      const primaryResult = await primaryCall();

      if (primaryResult.success && primaryResult.data) {
        return {
          ...primaryResult,
          source: this.primarySource,
        };
      }

      if (fallbackCall) {
        console.warn(
          `Primary source (${this.primarySource}) failed, trying fallback (${this.fallbackSource})`
        );
        const fallbackResult = await fallbackCall();

        if (fallbackResult.success && fallbackResult.data) {
          return {
            ...fallbackResult,
            source: this.fallbackSource,
          };
        }
      }

      return primaryResult;
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        source: this.primarySource,
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  // ==========================================
  // OPTIMIZED CORE METHODS
  // ==========================================

  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    const cacheKey = generateCacheKey.quote(symbol);

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () =>
          this.executeWithFallback(
            () => alphaVantageService.getQuote(symbol),
            () => yahooFinanceService.getQuoteWithFallback(symbol)
          ),
        this.config.cacheDuration
      );
    }

    return this.executeWithFallback(
      () => alphaVantageService.getQuote(symbol),
      () => yahooFinanceService.getQuoteWithFallback(symbol)
    );
  }

  async getMultipleQuotes(
    symbols: string[]
  ): Promise<ApiResponse<StockQuote[]>> {
    try {
      if (this.config.cacheEnabled) {
        const cacheKeys = symbols.map(symbol => generateCacheKey.quote(symbol));

        const result = await cacheService.batchGet(
          cacheKeys,
          async missingKeys => {
            const missingSymbols = missingKeys.map(key =>
              key.replace('quote:', '')
            );
            return this.fetchQuotesBatch(missingSymbols);
          },
          this.config.cacheDuration
        );

        const quotes = Object.values(result).filter(Boolean) as StockQuote[];

        return {
          success: quotes.length > 0,
          data: quotes,
          error: quotes.length === 0 ? 'No quotes found' : null,
          timestamp: new Date().toISOString(),
          source: this.primarySource,
          cached: true,
        };
      }

      // Non-cached batch processing
      const batchResult = await this.fetchQuotesBatch(symbols);
      const quotes = Object.values(batchResult).filter(Boolean) as StockQuote[];

      return {
        success: quotes.length > 0,
        data: quotes,
        error: quotes.length === 0 ? 'No quotes found' : null,
        timestamp: new Date().toISOString(),
        source: this.primarySource,
        cached: false,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : 'Batch operation failed',
        success: false,
        source: this.primarySource,
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  private async fetchQuotesBatch(
    symbols: string[]
  ): Promise<Record<string, StockQuote>> {
    const batches = this.createBatches(symbols, this.config.batchSize);
    const results: Record<string, StockQuote> = {};

    for (const batch of batches) {
      const batchPromises = batch.map(symbol =>
        this.getQuoteWithoutCache(symbol)
      );
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (
          result.status === 'fulfilled' &&
          result.value.success &&
          result.value.data
        ) {
          const symbol = batch[index];
          results[generateCacheKey.quote(symbol)] = result.value.data;
        }
      });

      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(this.config.batchDelay);
      }
    }

    return results;
  }

  private async getQuoteWithoutCache(
    symbol: string
  ): Promise<ApiResponse<StockQuote>> {
    return this.executeWithFallback(
      () => alphaVantageService.getQuote(symbol),
      () => yahooFinanceService.getQuoteWithFallback(symbol)
    );
  }

  async getIntradayData(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
  ): Promise<ApiResponse<IntradayData>> {
    const cacheKey = `intraday:${symbol}:${interval}`;

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () =>
          this.executeWithFallback(
            () => alphaVantageService.getIntradayData(symbol, interval),
            () => {
              const yahooInterval = interval.replace('min', 'm') as
                | '1m'
                | '5m'
                | '15m'
                | '30m'
                | '60m';
              return yahooFinanceService.getIntradayData(symbol, yahooInterval);
            }
          ),
        this.config.cacheDuration
      );
    }

    return this.executeWithFallback(
      () => alphaVantageService.getIntradayData(symbol, interval),
      () => {
        const yahooInterval = interval.replace('min', 'm') as
          | '1m'
          | '5m'
          | '15m'
          | '30m'
          | '60m';
        return yahooFinanceService.getIntradayData(symbol, yahooInterval);
      }
    );
  }

  async getDailyData(symbol: string): Promise<ApiResponse<DailyData>> {
    const cacheKey = `daily:${symbol}`;

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () =>
          this.executeWithFallback(
            () => alphaVantageService.getDailyData(symbol),
            () => yahooFinanceService.getDailyData(symbol)
          ),
        this.config.cacheDuration * 2 // Longer cache for daily data
      );
    }

    return this.executeWithFallback(
      () => alphaVantageService.getDailyData(symbol),
      () => yahooFinanceService.getDailyData(symbol)
    );
  }

  async getCompanyOverview(
    symbol: string
  ): Promise<ApiResponse<CompanyOverview>> {
    const cacheKey = `overview:${symbol}`;

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () => alphaVantageService.getCompanyOverview(symbol),
        this.config.cacheDuration * 4 // Much longer cache for company data
      );
    }

    return alphaVantageService.getCompanyOverview(symbol);
  }

  async getNewsAndSentiment(
    tickers?: string[],
    topics?: string[],
    limit: number = 50
  ): Promise<ApiResponse<NewsItem[]>> {
    const cacheKey = `news:${(tickers || []).join(',')}:${(topics || []).join(',')}:${limit}`;

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () => alphaVantageService.getNewsAndSentiment(tickers, topics, limit),
        this.config.cacheDuration / 2 // Shorter cache for news
      );
    }

    return alphaVantageService.getNewsAndSentiment(tickers, topics, limit);
  }

  async getTopGainersLosers(): Promise<ApiResponse<TopGainersLosers>> {
    const cacheKey = 'top-gainers-losers';

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () => alphaVantageService.getTopGainersLosers(),
        this.config.cacheDuration / 2
      );
    }

    return alphaVantageService.getTopGainersLosers();
  }

  async getMarketStatus(): Promise<ApiResponse<MarketStatus>> {
    const cacheKey = 'market-status';

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () => alphaVantageService.getMarketStatus(),
        60000 // 1 minute cache for market status
      );
    }

    return alphaVantageService.getMarketStatus();
  }

  async searchSymbol(keywords: string): Promise<ApiResponse<SearchResult[]>> {
    const cacheKey = `search:${keywords.toLowerCase()}`;

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () => alphaVantageService.searchSymbol(keywords),
        this.config.cacheDuration * 2 // Longer cache for search results
      );
    }

    return alphaVantageService.searchSymbol(keywords);
  }

  async getTechnicalIndicator(
    symbol: string,
    indicator: 'RSI' | 'MACD',
    interval: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<ApiResponse<TechnicalIndicator>> {
    const cacheKey = `technical:${symbol}:${indicator}:${interval}`;

    if (this.config.cacheEnabled) {
      return withApiCache(
        cacheKey,
        () => {
          if (indicator === 'RSI') {
            return alphaVantageService.getRSI(symbol, interval);
          } else {
            return alphaVantageService.getMACD(symbol, interval);
          }
        },
        this.config.cacheDuration
      );
    }

    if (indicator === 'RSI') {
      return alphaVantageService.getRSI(symbol, interval);
    } else {
      return alphaVantageService.getMACD(symbol, interval);
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      const cacheKey = `validation:${symbol}`;

      if (this.config.cacheEnabled && cacheService.has(cacheKey)) {
        const cached = await cacheService.get<boolean>(cacheKey);
        return cached || false;
      }

      const alphaResult = await alphaVantageService.searchSymbol(symbol);
      if (
        alphaResult.success &&
        alphaResult.data &&
        alphaResult.data.length > 0
      ) {
        if (this.config.cacheEnabled) {
          cacheService.set(cacheKey, true, this.config.cacheDuration * 2);
        }
        return true;
      }

      const yahooResult = await yahooFinanceService.validateSymbol(symbol);
      if (this.config.cacheEnabled) {
        cacheService.set(cacheKey, yahooResult, this.config.cacheDuration * 2);
      }
      return yahooResult;
    } catch {
      return false;
    }
  }

  async getQuickQuote(symbol: string): Promise<{
    price: number;
    change: number;
    changePercent: number;
    source: string;
  } | null> {
    try {
      const result = await this.getQuote(symbol);

      if (result.success && result.data) {
        return {
          price: result.data.price,
          change: result.data.change,
          changePercent: result.data.changePercent,
          source: result.source || 'unknown',
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  // ==========================================
  // CONFIGURATION & MANAGEMENT
  // ==========================================

  setPrimarySource(source: DataSource): void {
    this.primarySource = source;
    this.config.source = source;
  }

  getCurrentConfig(): OptimizedMarketDataConfig {
    return { ...this.config };
  }

  async healthCheck(): Promise<{
    alphaVantage: boolean;
    yahooFinance: boolean;
    primarySource: string;
    fallbackSource: string;
    cacheStats: object | null;
  }> {
    const [alphaHealth, yahooHealth] = await Promise.allSettled([
      alphaVantageService.getQuote('AAPL'),
      yahooFinanceService.getQuoteWithFallback('AAPL'),
    ]);

    return {
      alphaVantage:
        alphaHealth.status === 'fulfilled' && alphaHealth.value.success,
      yahooFinance:
        yahooHealth.status === 'fulfilled' && yahooHealth.value.success,
      primarySource: this.primarySource,
      fallbackSource: this.fallbackSource,
      cacheStats: this.config.cacheEnabled ? cacheService.getStats() : null,
    };
  }

  // ==========================================
  // ANALYSIS FUNCTIONS
  // ==========================================

  async analyzeSymbol(symbol: string): Promise<
    ApiResponse<{
      quote: StockQuote | null;
      overview: CompanyOverview | null;
      news: NewsItem[] | null;
      technicals: {
        rsi: TechnicalIndicator | null;
        macd: TechnicalIndicator | null;
      };
    }>
  > {
    const [quoteResult, overviewResult, newsResult, rsiResult, macdResult] =
      await Promise.allSettled([
        this.getQuote(symbol),
        this.getCompanyOverview(symbol),
        this.getNewsAndSentiment([symbol], undefined, 10),
        this.getTechnicalIndicator(symbol, 'RSI'),
        this.getTechnicalIndicator(symbol, 'MACD'),
      ]);

    const analysis = {
      quote:
        quoteResult.status === 'fulfilled' && quoteResult.value.success
          ? quoteResult.value.data
          : null,
      overview:
        overviewResult.status === 'fulfilled' && overviewResult.value.success
          ? overviewResult.value.data
          : null,
      news:
        newsResult.status === 'fulfilled' && newsResult.value.success
          ? newsResult.value.data
          : null,
      technicals: {
        rsi:
          rsiResult.status === 'fulfilled' && rsiResult.value.success
            ? rsiResult.value.data
            : null,
        macd:
          macdResult.status === 'fulfilled' && macdResult.value.success
            ? macdResult.value.data
            : null,
      },
    };

    return {
      success: true,
      data: analysis,
      error: null,
      timestamp: new Date().toISOString(),
      source: this.primarySource,
      cached: false,
    };
  }

  async compareSymbols(symbols: string[]): Promise<
    ApiResponse<{
      quotes: StockQuote[];
      marketData: TopGainersLosers | null;
    }>
  > {
    const [quotesResult, marketDataResult] = await Promise.allSettled([
      this.getMultipleQuotes(symbols),
      this.getTopGainersLosers(),
    ]);

    const comparison = {
      quotes:
        quotesResult.status === 'fulfilled' && quotesResult.value.success
          ? quotesResult.value.data || []
          : [],
      marketData:
        marketDataResult.status === 'fulfilled' &&
        marketDataResult.value.success
          ? marketDataResult.value.data
          : null,
    };

    return {
      success: true,
      data: comparison,
      error: null,
      timestamp: new Date().toISOString(),
      source: this.primarySource,
      cached: false,
    };
  }

  // ==========================================
  // PRIVATE UTILITIES
  // ==========================================

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  clearCache(): void {
    if (this.config.cacheEnabled) {
      cacheService.clear();
    }
  }

  getCacheStats(): object | null {
    return this.config.cacheEnabled ? cacheService.getStats() : null;
  }

  toggleCache(enabled: boolean): void {
    this.config.cacheEnabled = enabled;
  }
}

// Singleton instance
const optimizedMarketDataService = new OptimizedMarketDataService();
export default optimizedMarketDataService;

// Export types for compatibility
export type { DataSource, OptimizedMarketDataConfig };
