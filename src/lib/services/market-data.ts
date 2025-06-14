// ==========================================
// UNIFIED MARKET DATA SERVICE - Penny Wise
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
} from '@/lib/types/market';

import { StandardApiResponse, BatchResponse } from '@/lib/types/api-response';
import { ErrorHandler } from '@/lib/utils/error-handler';
import {
  cacheService,
  generateCacheKey,
  withCache,
} from '@/lib/utils/cache-service';

import alphaVantageService from './alpha-vantage';
import yahooFinanceService from './yahoo-finance';

type DataSource = 'alpha_vantage' | 'yahoo_finance';

interface UnifiedMarketDataConfig {
  source: DataSource;
  fallback?: DataSource;
  cacheEnabled: boolean;
  cacheDuration: number;
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  batchDelay: number;
}

class MarketDataService {
  private config: UnifiedMarketDataConfig;
  private primarySource: DataSource;
  private fallbackSource: DataSource;

  constructor() {
    this.config = {
      source: 'alpha_vantage',
      fallback: 'yahoo_finance',
      cacheEnabled: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 1000,
      batchSize: 10,
      batchDelay: 100,
    };

    this.primarySource = this.config.source;
    this.fallbackSource = this.config.fallback!;
  }

  private async executeWithFallback<T>(
    primaryCall: () => Promise<StandardApiResponse<T>>,
    fallbackCall?: () => Promise<StandardApiResponse<T>>,
    cacheKey?: string
  ): Promise<StandardApiResponse<T>> {
    // Check cache first if enabled
    if (this.config.cacheEnabled && cacheKey) {
      const cached = cacheService.get(
        cacheKey,
        async () => {
          return this.executeWithoutCache(primaryCall, fallbackCall);
        },
        this.config.cacheDuration
      );

      return cached;
    }

    return this.executeWithoutCache(primaryCall, fallbackCall);
  }

  private async executeWithoutCache<T>(
    primaryCall: () => Promise<StandardApiResponse<T>>,
    fallbackCall?: () => Promise<StandardApiResponse<T>>
  ): Promise<StandardApiResponse<T>> {
    try {
      // Try primary source
      const primaryResult = await primaryCall();

      if (primaryResult.success && primaryResult.data) {
        return {
          ...primaryResult,
          source: this.primarySource,
        };
      }

      // If primary failed and fallback is available
      if (fallbackCall) {
        const fallbackResult = await fallbackCall();

        if (fallbackResult.success && fallbackResult.data) {
          return {
            ...fallbackResult,
            source: this.fallbackSource,
            metadata: {
              ...fallbackResult.metadata,
              fallback: true,
              primaryError: primaryResult.error,
            },
          };
        }
      }

      // Both failed, return primary error
      return primaryResult;
    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'market-data',
        this.primarySource
      );
    }
  }

  // ==========================================
  // CORE STOCK DATA WITH OPTIMIZATIONS
  // ==========================================

  async getQuote(symbol: string): Promise<StandardApiResponse<StockQuote>> {
    const cacheKey = generateCacheKey.quote(symbol);

    if (this.config.cacheEnabled) {
      return withCache(
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
  ): Promise<BatchResponse<StockQuote>> {
    try {
      // Use batch processing with cache
      const cacheKeys = symbols.map(symbol => generateCacheKey.quote(symbol));

      const result = await cacheService.batchGet(
        cacheKeys,
        async missingKeys => {
          const missingSymbols = missingKeys.map(key =>
            key.replace('quote:', '')
          );

          // Process in batches to avoid rate limits
          const batches = this.createBatches(
            missingSymbols,
            this.config.batchSize
          );
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

            // Add delay between batches
            if (batches.indexOf(batch) < batches.length - 1) {
              await this.delay(this.config.batchDelay);
            }
          }

          return results;
        },
        this.config.cacheDuration
      );

      const quotes = Object.values(result).filter(Boolean) as StockQuote[];
      const successCount = quotes.length;
      const errorCount = symbols.length - successCount;

      return {
        success: successCount > 0,
        data: quotes,
        timestamp: new Date().toISOString(),
        source: this.primarySource,
        batchSize: symbols.length,
        successCount,
        errorCount,
        errors:
          errorCount > 0
            ? [
                {
                  type: 'unknown',
                  message: `Failed to fetch ${errorCount} quotes`,
                  retryable: true,
                  timestamp: new Date().toISOString(),
                  service: 'market-data-batch',
                },
              ]
            : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Batch operation failed',
        timestamp: new Date().toISOString(),
        source: this.primarySource,
        batchSize: symbols.length,
        successCount: 0,
        errorCount: symbols.length,
        data: [],
      };
    }
  }

  private async getQuoteWithoutCache(
    symbol: string
  ): Promise<StandardApiResponse<StockQuote>> {
    return this.executeWithoutCache(
      () =>
        withErrorHandling(
          alphaVantageService.getQuote(symbol),
          'alpha-vantage-quote',
          'alpha_vantage'
        ),
      () =>
        withErrorHandling(
          yahooFinanceService.getQuoteWithFallback(symbol),
          'yahoo-finance-quote',
          'yahoo_finance'
        )
    );
  }

  async getIntradayData(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
  ): Promise<StandardApiResponse<IntradayData>> {
    const cacheKey = `intraday:${symbol}:${interval}`;

    return this.executeWithFallback(
      () =>
        withErrorHandling(
          alphaVantageService.getIntradayData(symbol, interval),
          'alpha-vantage-intraday',
          'alpha_vantage'
        ),
      () => {
        const yahooInterval = interval.replace('min', 'm') as
          | '1m'
          | '5m'
          | '15m'
          | '30m'
          | '60m';
        return withErrorHandling(
          yahooFinanceService.getIntradayData(symbol, yahooInterval),
          'yahoo-finance-intraday',
          'yahoo_finance'
        );
      },
      cacheKey
    );
  }

  async getDailyData(symbol: string): Promise<StandardApiResponse<DailyData>> {
    const cacheKey = `daily:${symbol}`;

    return this.executeWithFallback(
      () =>
        withErrorHandling(
          alphaVantageService.getDailyData(symbol),
          'alpha-vantage-daily',
          'alpha_vantage'
        ),
      () =>
        withErrorHandling(
          yahooFinanceService.getDailyData(symbol),
          'yahoo-finance-daily',
          'yahoo_finance'
        ),
      cacheKey
    );
  }

  // ==========================================
  // ALPHA VANTAGE EXCLUSIVE FEATURES
  // ==========================================

  async getCompanyOverview(
    symbol: string
  ): Promise<StandardApiResponse<CompanyOverview>> {
    const cacheKey = `overview:${symbol}`;

    if (this.config.cacheEnabled) {
      return withCache(
        cacheKey,
        () =>
          withErrorHandling(
            alphaVantageService.getCompanyOverview(symbol),
            'alpha-vantage-overview',
            'alpha_vantage'
          ),
        this.config.cacheDuration * 4 // Longer cache for company data
      );
    }

    return withErrorHandling(
      alphaVantageService.getCompanyOverview(symbol),
      'alpha-vantage-overview',
      'alpha_vantage'
    );
  }

  async getNewsAndSentiment(
    tickers?: string[],
    topics?: string[],
    limit: number = 50
  ): Promise<StandardApiResponse<NewsItem[]>> {
    const cacheKey = `news:${(tickers || []).join(',')}:${(topics || []).join(',')}:${limit}`;

    if (this.config.cacheEnabled) {
      return withCache(
        cacheKey,
        () =>
          withErrorHandling(
            alphaVantageService.getNewsAndSentiment(tickers, topics, limit),
            'alpha-vantage-news',
            'alpha_vantage'
          ),
        this.config.cacheDuration / 2 // Shorter cache for news
      );
    }

    return withErrorHandling(
      alphaVantageService.getNewsAndSentiment(tickers, topics, limit),
      'alpha-vantage-news',
      'alpha_vantage'
    );
  }

  async getTopGainersLosers(): Promise<StandardApiResponse<TopGainersLosers>> {
    const cacheKey = 'top-gainers-losers';

    if (this.config.cacheEnabled) {
      return withCache(
        cacheKey,
        () =>
          withErrorHandling(
            alphaVantageService.getTopGainersLosers(),
            'alpha-vantage-gainers-losers',
            'alpha_vantage'
          ),
        this.config.cacheDuration / 2
      );
    }

    return withErrorHandling(
      alphaVantageService.getTopGainersLosers(),
      'alpha-vantage-gainers-losers',
      'alpha_vantage'
    );
  }

  async getMarketStatus(): Promise<StandardApiResponse<MarketStatus>> {
    const cacheKey = 'market-status';

    if (this.config.cacheEnabled) {
      return withCache(
        cacheKey,
        () =>
          withErrorHandling(
            alphaVantageService.getMarketStatus(),
            'alpha-vantage-market-status',
            'alpha_vantage'
          ),
        60000 // 1 minute cache for market status
      );
    }

    return withErrorHandling(
      alphaVantageService.getMarketStatus(),
      'alpha-vantage-market-status',
      'alpha_vantage'
    );
  }

  async searchSymbol(
    keywords: string
  ): Promise<StandardApiResponse<SearchResult[]>> {
    const cacheKey = `search:${keywords.toLowerCase()}`;

    if (this.config.cacheEnabled) {
      return withCache(
        cacheKey,
        () =>
          withErrorHandling(
            alphaVantageService.searchSymbol(keywords),
            'alpha-vantage-search',
            'alpha_vantage'
          ),
        this.config.cacheDuration * 2 // Longer cache for search results
      );
    }

    return withErrorHandling(
      alphaVantageService.searchSymbol(keywords),
      'alpha-vantage-search',
      'alpha_vantage'
    );
  }

  async getTechnicalIndicator(
    symbol: string,
    indicator: 'RSI' | 'MACD',
    interval: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<StandardApiResponse<TechnicalIndicator>> {
    const cacheKey = `technical:${symbol}:${indicator}:${interval}`;

    if (this.config.cacheEnabled) {
      return withCache(
        cacheKey,
        () => {
          if (indicator === 'RSI') {
            return withErrorHandling(
              alphaVantageService.getRSI(symbol, interval),
              'alpha-vantage-rsi',
              'alpha_vantage'
            );
          } else {
            return withErrorHandling(
              alphaVantageService.getMACD(symbol, interval),
              'alpha-vantage-macd',
              'alpha_vantage'
            );
          }
        },
        this.config.cacheDuration
      );
    }

    if (indicator === 'RSI') {
      return withErrorHandling(
        alphaVantageService.getRSI(symbol, interval),
        'alpha-vantage-rsi',
        'alpha_vantage'
      );
    } else {
      return withErrorHandling(
        alphaVantageService.getMACD(symbol, interval),
        'alpha-vantage-macd',
        'alpha_vantage'
      );
    }
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      const cacheKey = `validation:${symbol}`;

      if (this.config.cacheEnabled && cacheService.has(cacheKey)) {
        const cached = await cacheService.get(cacheKey, async () => false);
        return cached as boolean;
      }

      // Try Alpha Vantage first
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

      // Fallback to Yahoo Finance
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

  getCurrentConfig(): UnifiedMarketDataConfig {
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
    StandardApiResponse<{
      quote: StockQuote | null;
      overview: CompanyOverview | null;
      news: NewsItem[] | null;
      technicals: {
        rsi: TechnicalIndicator | null;
        macd: TechnicalIndicator | null;
      };
    }>
  > {
    try {
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
        timestamp: new Date().toISOString(),
        source: this.primarySource,
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'market-analysis',
        this.primarySource
      );
    }
  }

  async compareSymbols(symbols: string[]): Promise<
    StandardApiResponse<{
      quotes: StockQuote[];
      marketData: TopGainersLosers | null;
    }>
  > {
    try {
      const [quotesResult, marketDataResult] = await Promise.allSettled([
        this.getMultipleQuotes(symbols),
        this.getTopGainersLosers(),
      ]);

      return {
        success: true,
        data: {
          quotes:
            quotesResult.status === 'fulfilled' && quotesResult.value.success
              ? quotesResult.value.data
              : [],
          marketData:
            marketDataResult.status === 'fulfilled' &&
            marketDataResult.value.success
              ? marketDataResult.value.data
              : null,
        },
        timestamp: new Date().toISOString(),
        source: this.primarySource,
      };
    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'market-comparison',
        this.primarySource
      );
    }
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
const marketDataService = new MarketDataService();
export default marketDataService;

// Legacy exports for backward compatibility
export type { DataSource };
