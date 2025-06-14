// ==========================================
// YAHOO FINANCE API SERVICE - Penny Wise
// ==========================================

import {
  StockQuote,
  IntradayData,
  DailyData,
  ApiResponse,
  MarketDataConfig
} from '@/lib/types/market';

class YahooFinanceService {
  private baseUrl: string;
  private config: MarketDataConfig;

  constructor() {
    // Não precisamos mais da baseUrl já que usamos rota proxy
    this.baseUrl = '';
    this.config = {
      source: 'yahoo_finance',
      fallback: 'alpha_vantage',
      cacheEnabled: true,
      cacheDuration: 5, // 5 minutos para dados em tempo real
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  private async makeRequest<T>(
    symbol: string,
    additionalParams: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const params = new URLSearchParams({
      symbol,
      interval: '1d',
      range: '1y',
      ...additionalParams
    });

    // Use nossa rota API proxy ao invés de fazer requisição direta
    // Check if we're on the server side or client side
    const isServer = typeof window === 'undefined';
    let url: string;
    
    if (isServer) {
      // On server side, use the full URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      url = `${baseUrl}/api/market/yahoo?${params.toString()}`;
    } else {
      // On client side, use relative URL
      url = `/api/market/yahoo?${params.toString()}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { 
          revalidate: this.config.cacheEnabled ? this.config.cacheDuration * 60 : 0 
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Yahoo Finance API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'No data returned from Yahoo Finance API');
      }

      return {
        data: result.data as T,
        error: null,
        success: true,
        source: 'yahoo_finance',
        timestamp: result.timestamp,
        cached: this.config.cacheEnabled
      };

    } catch (error) {
      console.error('Yahoo Finance API Error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  // ==========================================
  // CORE STOCK DATA
  // ==========================================

  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    const response = await this.makeRequest<{
      chart: {
        result: Array<{
          meta: {
            currency: string;
            symbol: string;
            regularMarketPrice: number;
            previousClose: number;
            regularMarketOpen: number;
            regularMarketDayHigh: number;
            regularMarketDayLow: number;
            regularMarketVolume: number;
            marketCap?: number;
            longName?: string;
          };
          timestamp: number[];
          indicators: {
            quote: Array<{
              open: number[];
              high: number[];
              low: number[];
              close: number[];
              volume: number[];
            }>;
          };
        }>;
      };
    }>(symbol);

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch quote data',
        success: false,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    try {
      const result = response.data.chart.result[0];
      const meta = result.meta;

      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      const quote: StockQuote = {
        symbol: meta.symbol,
        name: meta.longName || meta.symbol,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: meta.regularMarketVolume,
        marketCap: meta.marketCap,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        open: meta.regularMarketOpen,
        previousClose: previousClose,
        timestamp: new Date().toISOString(),
        source: 'yahoo_finance'
      };

      return {
        ...response,
        data: quote
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing quote data: ${error}`,
        success: false,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  async getIntradayData(
    symbol: string,
    interval: '1m' | '5m' | '15m' | '30m' | '60m' = '5m',
    range: '1d' | '5d' | '1mo' = '1d'
  ): Promise<ApiResponse<IntradayData>> {
    const response = await this.makeRequest<{
      chart: {
        result: Array<{
          meta: {
            symbol: string;
          };
          timestamp: number[];
          indicators: {
            quote: Array<{
              open: number[];
              high: number[];
              low: number[];
              close: number[];
              volume: number[];
            }>;
          };
        }>;
      };
    }>(symbol, { interval, range });

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch intraday data',
        success: false,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    try {
      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];

      // Mapear intervalo do Yahoo para formato Alpha Vantage
      const intervalMap: Record<string, '1min' | '5min' | '15min' | '30min' | '60min'> = {
        '1m': '1min',
        '5m': '5min',
        '15m': '15min',
        '30m': '30min',
        '60m': '60min'
      };

      const data: IntradayData = {
        symbol: result.meta.symbol,
        interval: intervalMap[interval],
        data: timestamps.map((timestamp, index) => ({
          timestamp: new Date(timestamp * 1000).toISOString(),
          open: quote.open[index] || 0,
          high: quote.high[index] || 0,
          low: quote.low[index] || 0,
          close: quote.close[index] || 0,
          volume: quote.volume[index] || 0
        })).filter(item => item.close > 0), // Filtrar dados inválidos
        lastRefreshed: new Date().toISOString(),
        source: 'yahoo_finance'
      };

      return {
        ...response,
        data
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing intraday data: ${error}`,
        success: false,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  async getDailyData(
    symbol: string,
    range: '1y' | '2y' | '5y' | '10y' | 'max' = '1y'
  ): Promise<ApiResponse<DailyData>> {
    const response = await this.makeRequest<{
      chart: {
        result: Array<{
          meta: {
            symbol: string;
          };
          timestamp: number[];
          indicators: {
            quote: Array<{
              open: number[];
              high: number[];
              low: number[];
              close: number[];
              volume: number[];
            }>;
            adjclose?: Array<{
              adjclose: number[];
            }>;
          };
        }>;
      };
    }>(symbol, { interval: '1d', range });

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch daily data',
        success: false,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    try {
      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      const adjClose = result.indicators.adjclose?.[0]?.adjclose;

      const data: DailyData = {
        symbol: result.meta.symbol,
        data: timestamps.map((timestamp, index) => ({
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          open: quote.open[index] || 0,
          high: quote.high[index] || 0,
          low: quote.low[index] || 0,
          close: quote.close[index] || 0,
          adjustedClose: adjClose?.[index] || quote.close[index] || 0,
          volume: quote.volume[index] || 0
        })).filter(item => item.close > 0), // Filtrar dados inválidos
        lastRefreshed: new Date().toISOString(),
        source: 'yahoo_finance'
      };

      return {
        ...response,
        data
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing daily data: ${error}`,
        success: false,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  // Yahoo Finance não tem endpoint de search público, mas podemos tentar fazer quote direto
  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      const response = await this.getQuote(symbol);
      return response.success && response.data !== null;
    } catch {
      return false;
    }
  }

  // Função para tentar múltiplos formatos de símbolo (útil para ações brasileiras)
  async getQuoteWithFallback(baseSymbol: string): Promise<ApiResponse<StockQuote>> {
    const symbolVariations = [
      baseSymbol,
      `${baseSymbol}.SA`, // Bovespa
      `${baseSymbol}.BO`, // BSE
      `${baseSymbol}.NS`, // NSE
      baseSymbol.replace('.SA', '').replace('.BO', '').replace('.NS', '') // Remove sufixos
    ];

    for (const symbol of symbolVariations) {
      const response = await this.getQuote(symbol);
      if (response.success && response.data) {
        return response;
      }
    }

    return {
      data: null,
      error: `Symbol not found: ${baseSymbol}`,
      success: false,
      source: 'yahoo_finance',
      timestamp: new Date().toISOString(),
      cached: false
    };
  }
}

// Singleton instance
export const yahooFinanceService = new YahooFinanceService();
export default yahooFinanceService; 