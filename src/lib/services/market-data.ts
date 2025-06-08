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
  ApiResponse
} from '@/lib/types/market';

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
      cacheDuration: 5,
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    this.primarySource = this.config.source;
    this.fallbackSource = this.config.fallback!;
  }

  private async executeWithFallback<T>(
    primaryCall: () => Promise<ApiResponse<T>>,
    fallbackCall?: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      // Tentar fonte primária
      const primaryResult = await primaryCall();
      
      if (primaryResult.success && primaryResult.data) {
        return primaryResult;
      }

      // Se fonte primária falhou e há fallback disponível
      if (fallbackCall) {
        console.warn(`Primary source (${this.primarySource}) failed, trying fallback (${this.fallbackSource})`);
        const fallbackResult = await fallbackCall();
        
        if (fallbackResult.success && fallbackResult.data) {
          return fallbackResult;
        }
      }

      // Se ambas falharam, retornar o erro da primária
      return primaryResult;

    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        source: this.primarySource,
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  // ==========================================
  // CORE STOCK DATA
  // ==========================================

  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    return this.executeWithFallback(
      () => alphaVantageService.getQuote(symbol),
      () => yahooFinanceService.getQuoteWithFallback(symbol)
    );
  }

  async getMultipleQuotes(symbols: string[]): Promise<ApiResponse<StockQuote[]>> {
    try {
      const promises = symbols.map(symbol => this.getQuote(symbol));
      const results = await Promise.allSettled(promises);

      const quotes: StockQuote[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          quotes.push(result.value.data);
        } else {
          const symbol = symbols[index];
          const error = result.status === 'rejected' 
            ? result.reason 
            : result.value.error || 'Unknown error';
          errors.push(`${symbol}: ${error}`);
        }
      });

      return {
        data: quotes,
        error: errors.length > 0 ? errors.join('; ') : null,
        success: quotes.length > 0,
        source: this.primarySource,
        timestamp: new Date().toISOString(),
        cached: false
      };

    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        source: this.primarySource,
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  async getIntradayData(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
  ): Promise<ApiResponse<IntradayData>> {
    return this.executeWithFallback(
      () => alphaVantageService.getIntradayData(symbol, interval),
      () => {
        // Mapear intervalo para formato Yahoo
        const yahooInterval = interval.replace('min', 'm') as '1m' | '5m' | '15m' | '30m' | '60m';
        return yahooFinanceService.getIntradayData(symbol, yahooInterval);
      }
    );
  }

  async getDailyData(symbol: string): Promise<ApiResponse<DailyData>> {
    return this.executeWithFallback(
      () => alphaVantageService.getDailyData(symbol),
      () => yahooFinanceService.getDailyData(symbol)
    );
  }

  // ==========================================
  // ALPHA VANTAGE EXCLUSIVE FEATURES
  // ==========================================

  async getCompanyOverview(symbol: string): Promise<ApiResponse<CompanyOverview>> {
    // Apenas Alpha Vantage tem essa funcionalidade
    return alphaVantageService.getCompanyOverview(symbol);
  }

  async getNewsAndSentiment(
    tickers?: string[],
    topics?: string[],
    limit: number = 50
  ): Promise<ApiResponse<NewsItem[]>> {
    // Apenas Alpha Vantage tem essa funcionalidade
    return alphaVantageService.getNewsAndSentiment(tickers, topics, limit);
  }

  async getTopGainersLosers(): Promise<ApiResponse<TopGainersLosers>> {
    // Apenas Alpha Vantage tem essa funcionalidade
    return alphaVantageService.getTopGainersLosers();
  }

  async getMarketStatus(): Promise<ApiResponse<MarketStatus>> {
    // Apenas Alpha Vantage tem essa funcionalidade
    return alphaVantageService.getMarketStatus();
  }

  async searchSymbol(keywords: string): Promise<ApiResponse<SearchResult[]>> {
    // Apenas Alpha Vantage tem essa funcionalidade
    return alphaVantageService.searchSymbol(keywords);
  }

  async getTechnicalIndicator(
    symbol: string,
    indicator: 'RSI' | 'MACD',
    interval: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<ApiResponse<TechnicalIndicator>> {
    if (indicator === 'RSI') {
      return alphaVantageService.getRSI(symbol, interval);
    } else if (indicator === 'MACD') {
      return alphaVantageService.getMACD(symbol, interval);
    }

    return {
      data: null,
      error: `Unsupported technical indicator: ${indicator}`,
      success: false,
      source: 'alpha_vantage',
      timestamp: new Date().toISOString(),
      cached: false
    };
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      // Tentar Alpha Vantage primeiro
      const alphaResult = await alphaVantageService.searchSymbol(symbol);
      if (alphaResult.success && alphaResult.data && alphaResult.data.length > 0) {
        return true;
      }

      // Fallback para Yahoo Finance
      return await yahooFinanceService.validateSymbol(symbol);
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
      const response = await this.getQuote(symbol);
      
      if (response.success && response.data) {
        return {
          price: response.data.price,
          change: response.data.change,
          changePercent: response.data.changePercent,
          source: response.source
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  // ==========================================
  // CONFIGURATION
  // ==========================================

  setPrimarySource(source: DataSource): void {
    this.primarySource = source;
    this.fallbackSource = source === 'alpha_vantage' ? 'yahoo_finance' : 'alpha_vantage';
  }

  getCurrentConfig(): UnifiedMarketDataConfig {
    return {
      ...this.config,
      source: this.primarySource,
      fallback: this.fallbackSource
    };
  }

  async healthCheck(): Promise<{
    alphaVantage: boolean;
    yahooFinance: boolean;
    primarySource: string;
    fallbackSource: string;
  }> {
    const testSymbol = 'AAPL'; // Símbolo que deveria existir em ambas as APIs

    const [alphaTest, yahooTest] = await Promise.allSettled([
      alphaVantageService.getQuote(testSymbol),
      yahooFinanceService.getQuote(testSymbol)
    ]);

    return {
      alphaVantage: alphaTest.status === 'fulfilled' && alphaTest.value.success,
      yahooFinance: yahooTest.status === 'fulfilled' && yahooTest.value.success,
      primarySource: this.primarySource,
      fallbackSource: this.fallbackSource
    };
  }

  // ==========================================
  // CHAT INTEGRATION HELPERS
  // ==========================================

  async analyzeSymbol(symbol: string): Promise<{
    quote: StockQuote | null;
    overview: CompanyOverview | null;
    news: NewsItem[] | null;
    technicals: {
      rsi: TechnicalIndicator | null;
      macd: TechnicalIndicator | null;
    };
  }> {
    const [quoteRes, overviewRes, newsRes, rsiRes, macdRes] = await Promise.allSettled([
      this.getQuote(symbol),
      this.getCompanyOverview(symbol),
      this.getNewsAndSentiment([symbol], undefined, 10),
      this.getTechnicalIndicator(symbol, 'RSI'),
      this.getTechnicalIndicator(symbol, 'MACD')
    ]);

    return {
      quote: quoteRes.status === 'fulfilled' && quoteRes.value.success ? quoteRes.value.data : null,
      overview: overviewRes.status === 'fulfilled' && overviewRes.value.success ? overviewRes.value.data : null,
      news: newsRes.status === 'fulfilled' && newsRes.value.success ? newsRes.value.data : null,
      technicals: {
        rsi: rsiRes.status === 'fulfilled' && rsiRes.value.success ? rsiRes.value.data : null,
        macd: macdRes.status === 'fulfilled' && macdRes.value.success ? macdRes.value.data : null
      }
    };
  }

  async compareSymbols(symbols: string[]): Promise<{
    quotes: StockQuote[];
    marketData: TopGainersLosers | null;
  }> {
    const [quotesRes, marketRes] = await Promise.allSettled([
      this.getMultipleQuotes(symbols),
      this.getTopGainersLosers()
    ]);

    return {
      quotes: quotesRes.status === 'fulfilled' && quotesRes.value.success ? quotesRes.value.data || [] : [],
      marketData: marketRes.status === 'fulfilled' && marketRes.value.success ? marketRes.value.data : null
    };
  }
}

// Singleton instance
export const marketDataService = new MarketDataService();
export default marketDataService; 