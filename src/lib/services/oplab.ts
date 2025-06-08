// ==========================================
// OPLAB API SERVICE - Penny Wise
// ==========================================

import {
  StockQuote,
  IntradayData,
  DailyData,
  ApiResponse,
  MarketDataConfig
} from '@/lib/types/market';

interface OplabStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  timestamp: string;
}

interface OplabOptionsData {
  symbol: string;
  type: 'call' | 'put';
  strikePrice: number;
  expiryDate: string;
  premium: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  volume: number;
  openInterest: number;
  lastTradingDate: string;
}

interface OplabResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

class OplabService {
  private baseUrl: string;
  private apiKey: string;
  private config: MarketDataConfig;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_OPLAB_BASE_URL || 'https://api.oplab.com.br';
    this.apiKey = process.env.OPLAB_API_KEY || '';
    this.config = {
      source: 'oplab',
      fallback: 'alpha_vantage',
      cacheEnabled: true,
      cacheDuration: 5, // 5 minutos para dados em tempo real
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    if (!this.apiKey) {
      return {
        data: null,
        error: 'Oplab API key not configured',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    const url = new URL(endpoint, this.baseUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PennyWise/1.0.0'
        },
        next: { 
          revalidate: this.config.cacheEnabled ? this.config.cacheDuration * 60 : 0 
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Oplab API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json() as OplabResponse<T>;

      if (!result.success) {
        throw new Error(result.message || 'Oplab API returned error');
      }

      return {
        data: result.data,
        error: null,
        success: true,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: this.config.cacheEnabled
      };

    } catch (error) {
      console.error('Oplab API Error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  // ==========================================
  // STOCK QUOTES (AÇÕES B3)
  // ==========================================

  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    const response = await this.makeRequest<OplabStockData>(`/stocks/${symbol}/quote`);

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch stock quote',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    try {
      const data = response.data;
      
      const quote: StockQuote = {
        symbol: data.symbol,
        name: data.name,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        marketCap: data.marketCap,
        high: data.high,
        low: data.low,
        open: data.open,
        previousClose: data.previousClose,
        timestamp: data.timestamp,
        source: 'oplab'
      };

      return {
        ...response,
        data: quote
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing stock quote: ${error}`,
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  // ==========================================
  // INTRADAY DATA
  // ==========================================

  async getIntradayData(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
  ): Promise<ApiResponse<IntradayData>> {
    const response = await this.makeRequest<{
      symbol: string;
      interval: string;
      data: Array<{
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
      lastRefreshed: string;
    }>(`/stocks/${symbol}/intraday`, { interval });

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch intraday data',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    try {
      const data = response.data;
      
      const intradayData: IntradayData = {
        symbol: data.symbol,
        interval,
        data: data.data,
        lastRefreshed: data.lastRefreshed,
        source: 'oplab'
      };

      return {
        ...response,
        data: intradayData
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing intraday data: ${error}`,
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  // ==========================================
  // DAILY DATA
  // ==========================================

  async getDailyData(symbol: string, days: number = 100): Promise<ApiResponse<DailyData>> {
    const response = await this.makeRequest<{
      symbol: string;
      data: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        adjustedClose: number;
        volume: number;
      }>;
      lastRefreshed: string;
    }>(`/stocks/${symbol}/daily`, { days: days.toString() });

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch daily data',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    try {
      const data = response.data;
      
      const dailyData: DailyData = {
        symbol: data.symbol,
        data: data.data,
        lastRefreshed: data.lastRefreshed,
        source: 'oplab'
      };

      return {
        ...response,
        data: dailyData
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing daily data: ${error}`,
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  // ==========================================
  // OPTIONS DATA (ESPECÍFICO DA OPLAB)
  // ==========================================

  async getOptionsChain(symbol: string, expiryDate?: string): Promise<ApiResponse<OplabOptionsData[]>> {
    const params: Record<string, string> = {};
    if (expiryDate) {
      params.expiry = expiryDate;
    }

    const response = await this.makeRequest<OplabOptionsData[]>(`/options/${symbol}/chain`, params);

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch options chain',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    return response;
  }

  async getOptionQuote(optionSymbol: string): Promise<ApiResponse<OplabOptionsData>> {
    const response = await this.makeRequest<OplabOptionsData>(`/options/${optionSymbol}/quote`);

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch option quote',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    return response;
  }

  // ==========================================
  // MARKET STATUS
  // ==========================================

  async getMarketStatus(): Promise<ApiResponse<{ isOpen: boolean; nextOpen: string; nextClose: string }>> {
    const response = await this.makeRequest<{ isOpen: boolean; nextOpen: string; nextClose: string }>('/market/status');

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch market status',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    return response;
  }

  // ==========================================
  // VALIDATION AND UTILS
  // ==========================================

  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      const response = await this.getQuote(symbol);
      return response.success;
    } catch {
      return false;
    }
  }

  async getTopStocks(limit: number = 10): Promise<ApiResponse<StockQuote[]>> {
    const response = await this.makeRequest<OplabStockData[]>('/market/top-stocks', { 
      limit: limit.toString() 
    });

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch top stocks',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }

    try {
      const stocks: StockQuote[] = response.data.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: stock.volume,
        marketCap: stock.marketCap,
        high: stock.high,
        low: stock.low,
        open: stock.open,
        previousClose: stock.previousClose,
        timestamp: stock.timestamp,
        source: 'oplab'
      }));

      return {
        ...response,
        data: stocks
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing top stocks: ${error}`,
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      };
    }
  }

  // ==========================================
  // HEALTH CHECK
  // ==========================================

  async healthCheck(): Promise<ApiResponse<{ status: string; version: string; timestamp: string }>> {
    const response = await this.makeRequest<{ status: string; version: string; timestamp: string }>('/health');
    return response;
  }
}

// Export singleton instance
const oplabService = new OplabService();
export default oplabService; 