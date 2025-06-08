// ==========================================
// OPLAB API SERVICE - Penny Wise
// ==========================================

export interface OplabResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface StockQuote {
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
  pe?: number;
  eps?: number;
  dividend?: number;
  lastUpdate: string;
  timestamp: string;
  source: string;
}

export interface IntradayDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IntradayData {
  symbol: string;
  interval: '1min' | '5min' | '15min' | '30min' | '60min';
  data: IntradayDataPoint[];
  lastRefreshed: string;
  source: string;
}

export interface DailyDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
}

export interface DailyData {
  symbol: string;
  data: DailyDataPoint[];
  lastRefreshed: string;
  source: string;
}

export interface OptionsChain {
  symbol: string;
  expiration: string;
  calls: Array<{
    strike: number;
    symbol: string;
    bid: number;
    ask: number;
    last: number;
    volume: number;
    openInterest: number;
    impliedVolatility: number;
  }>;
  puts: Array<{
    strike: number;
    symbol: string;
    bid: number;
    ask: number;
    last: number;
    volume: number;
    openInterest: number;
    impliedVolatility: number;
  }>;
}

export interface OptionQuote {
  symbol: string;
  underlyingSymbol: string;
  type: 'CALL' | 'PUT';
  strike: number;
  expiration: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface MarketStatus {
  market: 'B3';
  status: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS';
  localTime: string;
  nextOpen?: string;
  nextClose?: string;
  timezone: string;
}

export interface TopStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

// Brazilian stock symbols with realistic data
const BRAZILIAN_STOCKS = {
  'PETR4': { name: 'Petróleo Brasileiro S.A. - Petrobras', sector: 'Energy', basePrice: 38.45 },
  'VALE3': { name: 'Vale S.A.', sector: 'Mining', basePrice: 61.23 },
  'ITUB4': { name: 'Itaú Unibanco Holding S.A.', sector: 'Banking', basePrice: 34.78 },
  'BBDC4': { name: 'Banco Bradesco S.A.', sector: 'Banking', basePrice: 15.67 },
  'ABEV3': { name: 'Ambev S.A.', sector: 'Beverages', basePrice: 17.89 },
  'B3SA3': { name: 'B3 S.A. - Brasil, Bolsa, Balcão', sector: 'Financial', basePrice: 16.45 },
  'RENT3': { name: 'Localiza Rent a Car S.A.', sector: 'Services', basePrice: 48.23 },
  'WEGE3': { name: 'WEG S.A.', sector: 'Industrial', basePrice: 42.56 },
  'MGLU3': { name: 'Magazine Luiza S.A.', sector: 'Retail', basePrice: 6.78 },
  'LREN3': { name: 'Lojas Renner S.A.', sector: 'Retail', basePrice: 25.34 }
};

export class OplabService {
  private static instance: OplabService;
  
  public static getInstance(): OplabService {
    if (!OplabService.instance) {
      OplabService.instance = new OplabService();
    }
    return OplabService.instance;
  }

  private constructor() {}

  /**
   * Simulates a stock quote with realistic Brazilian market data
   */
  async getQuote(symbol: string): Promise<OplabResponse<StockQuote>> {
    try {
      // Wait to simulate API call
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      const stockInfo = BRAZILIAN_STOCKS[symbol as keyof typeof BRAZILIAN_STOCKS];
      
      if (!stockInfo) {
        return {
          success: false,
          error: `Symbol ${symbol} not found`,
          timestamp: new Date().toISOString()
        };
      }

      // Generate realistic market data
      const basePrice = stockInfo.basePrice;
      const volatility = 0.02 + Math.random() * 0.03; // 2-5% volatility
      const direction = Math.random() > 0.5 ? 1 : -1;
      const changePercent = direction * Math.random() * volatility * 100;
      const change = basePrice * (changePercent / 100);
      const currentPrice = basePrice + change;

      const quote: StockQuote = {
        symbol,
        name: stockInfo.name,
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: Math.floor(1000000 + Math.random() * 50000000),
        high: Number((currentPrice * (1 + Math.random() * 0.02)).toFixed(2)),
        low: Number((currentPrice * (1 - Math.random() * 0.02)).toFixed(2)),
        open: Number((basePrice * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)),
        previousClose: basePrice,
        marketCap: Math.floor(50000000000 + Math.random() * 200000000000),
        pe: Number((10 + Math.random() * 20).toFixed(2)),
        eps: Number((Math.random() * 5).toFixed(2)),
        dividend: Number((Math.random() * 2).toFixed(2)),
        lastUpdate: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        source: 'oplab-mock'
      };

      return {
        success: true,
        data: quote,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simulates intraday data
   */
  async getIntradayData(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'): Promise<OplabResponse<IntradayData>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

      const stockInfo = BRAZILIAN_STOCKS[symbol as keyof typeof BRAZILIAN_STOCKS];
      
      if (!stockInfo) {
        return {
          success: false,
          error: `Symbol ${symbol} not found`,
          timestamp: new Date().toISOString()
        };
      }

      // Generate 20 data points for intraday
      const data: IntradayDataPoint[] = [];
      let currentPrice = stockInfo.basePrice;
      const now = new Date();

      for (let i = 19; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 minutes intervals
        const volatility = 0.005; // Lower volatility for intraday
        const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
        
        const open = currentPrice;
        const close = currentPrice + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.002);
        const low = Math.min(open, close) * (1 - Math.random() * 0.002);

        data.push({
          timestamp: time.toISOString(),
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: Math.floor(10000 + Math.random() * 100000)
        });

        currentPrice = close;
      }

      return {
        success: true,
        data: {
          symbol,
          interval,
          data,
          lastRefreshed: new Date().toISOString(),
          source: 'oplab-mock'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simulates daily historical data
   */
  async getDailyData(symbol: string, days: number = 30): Promise<OplabResponse<DailyData>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 500));

      const stockInfo = BRAZILIAN_STOCKS[symbol as keyof typeof BRAZILIAN_STOCKS];
      
      if (!stockInfo) {
        return {
          success: false,
          error: `Symbol ${symbol} not found`,
          timestamp: new Date().toISOString()
        };
      }

      const data: DailyDataPoint[] = [];
      let currentPrice = stockInfo.basePrice * 0.95; // Start slightly lower
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const volatility = 0.02; // Daily volatility
        const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
        
        const open = currentPrice;
        const close = currentPrice + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);

        data.push({
          date: date.toISOString().split('T')[0],
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: Math.floor(500000 + Math.random() * 5000000),
          adjustedClose: Number(close.toFixed(2))
        });

        currentPrice = close;
      }

      return {
        success: true,
        data: {
          symbol,
          data,
          lastRefreshed: new Date().toISOString(),
          source: 'oplab-mock'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simulates options chain data
   */
  async getOptionsChain(symbol: string): Promise<OplabResponse<OptionsChain>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 600));

      const stockInfo = BRAZILIAN_STOCKS[symbol as keyof typeof BRAZILIAN_STOCKS];
      
      if (!stockInfo) {
        return {
          success: false,
          error: `Symbol ${symbol} not found`,
          timestamp: new Date().toISOString()
        };
      }

      const currentPrice = stockInfo.basePrice;
      const expiration = new Date();
      expiration.setMonth(expiration.getMonth() + 1);
      
      const calls = [];
      const puts = [];

      // Generate options around current price
      for (let i = -3; i <= 3; i++) {
        const strike = Math.round((currentPrice + i * 2) * 100) / 100;
        const moneyness = strike / currentPrice;
        
        // Call option
        const callPrice = Math.max(0, currentPrice - strike);
        const callIV = 0.20 + Math.abs(moneyness - 1) * 0.1 + Math.random() * 0.05;
        
        calls.push({
          strike,
          symbol: `${symbol}${String.fromCharCode(65 + i + 3)}${Math.round(strike * 100)}`,
          bid: Number((callPrice * 0.95).toFixed(2)),
          ask: Number((callPrice * 1.05).toFixed(2)),
          last: Number(callPrice.toFixed(2)),
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: Number(callIV.toFixed(4))
        });

        // Put option
        const putPrice = Math.max(0, strike - currentPrice);
        const putIV = 0.20 + Math.abs(moneyness - 1) * 0.1 + Math.random() * 0.05;
        
        puts.push({
          strike,
          symbol: `${symbol}${String.fromCharCode(78 + i + 3)}${Math.round(strike * 100)}`,
          bid: Number((putPrice * 0.95).toFixed(2)),
          ask: Number((putPrice * 1.05).toFixed(2)),
          last: Number(putPrice.toFixed(2)),
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: Number(putIV.toFixed(4))
        });
      }

      return {
        success: true,
        data: {
          symbol,
          expiration: expiration.toISOString().split('T')[0],
          calls,
          puts
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simulates option quote data
   */
  async getOptionQuote(optionSymbol: string): Promise<OplabResponse<OptionQuote>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 350));

      // Parse option symbol (simplified)
      const underlyingMatch = optionSymbol.match(/^([A-Z]+\d)/);
      if (!underlyingMatch) {
        return {
          success: false,
          error: `Invalid option symbol format: ${optionSymbol}`,
          timestamp: new Date().toISOString()
        };
      }

      const underlyingSymbol = underlyingMatch[1];
      const stockInfo = BRAZILIAN_STOCKS[underlyingSymbol as keyof typeof BRAZILIAN_STOCKS];
      
      if (!stockInfo) {
        return {
          success: false,
          error: `Underlying symbol ${underlyingSymbol} not found`,
          timestamp: new Date().toISOString()
        };
      }

      const strike = 35 + Math.random() * 10; // Random strike around current price
      const type = Math.random() > 0.5 ? 'CALL' : 'PUT';
      const currentPrice = stockInfo.basePrice;
      
      let intrinsicValue = 0;
      if (type === 'CALL') {
        intrinsicValue = Math.max(0, currentPrice - strike);
      } else {
        intrinsicValue = Math.max(0, strike - currentPrice);
      }

      const timeValue = Math.random() * 2; // Random time value
      const optionPrice = intrinsicValue + timeValue;

      const option: OptionQuote = {
        symbol: optionSymbol,
        underlyingSymbol,
        type,
        strike: Number(strike.toFixed(2)),
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bid: Number((optionPrice * 0.95).toFixed(2)),
        ask: Number((optionPrice * 1.05).toFixed(2)),
        last: Number(optionPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 500),
        openInterest: Math.floor(Math.random() * 2000),
        impliedVolatility: Number((0.15 + Math.random() * 0.15).toFixed(4)),
        delta: Number((Math.random() * 0.8).toFixed(4)),
        gamma: Number((Math.random() * 0.1).toFixed(4)),
        theta: Number((-Math.random() * 0.05).toFixed(4)),
        vega: Number((Math.random() * 0.2).toFixed(4))
      };

      return {
        success: true,
        data: option,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simulates market status
   */
  async getMarketStatus(): Promise<OplabResponse<MarketStatus>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

      const now = new Date();
      const hour = now.getHours();
      
      let status: MarketStatus['status'] = 'CLOSED';
      if (hour >= 9 && hour < 18) {
        status = 'OPEN';
      } else if (hour >= 8 && hour < 9) {
        status = 'PRE_MARKET';
      } else if (hour >= 18 && hour < 20) {
        status = 'AFTER_HOURS';
      }

      const marketStatus: MarketStatus = {
        market: 'B3',
        status,
        localTime: now.toISOString(),
        timezone: 'America/Sao_Paulo'
      };

      if (status === 'CLOSED') {
        const nextOpen = new Date(now);
        nextOpen.setHours(9, 0, 0, 0);
        if (nextOpen <= now) {
          nextOpen.setDate(nextOpen.getDate() + 1);
        }
        marketStatus.nextOpen = nextOpen.toISOString();
      }

      if (status === 'OPEN') {
        const nextClose = new Date(now);
        nextClose.setHours(18, 0, 0, 0);
        marketStatus.nextClose = nextClose.toISOString();
      }

      return {
        success: true,
        data: marketStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validates if a symbol exists
   */
  async validateSymbol(symbol: string): Promise<OplabResponse<{ valid: boolean; symbol: string }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));

      const valid = symbol in BRAZILIAN_STOCKS;
      
      return {
        success: true,
        data: {
          valid,
          symbol
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Gets top performing stocks
   */
  async getTopStocks(limit: number = 10): Promise<OplabResponse<TopStock[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

      const stocks = Object.entries(BRAZILIAN_STOCKS).map(([symbol, info]) => {
        const basePrice = info.basePrice;
        const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
        const change = basePrice * (changePercent / 100);
        const currentPrice = basePrice + change;

        return {
          symbol,
          name: info.name,
          price: Number(currentPrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          volume: Math.floor(1000000 + Math.random() * 50000000),
          marketCap: Math.floor(50000000000 + Math.random() * 200000000000)
        };
      });

      // Sort by change percentage (descending) and take top N
      stocks.sort((a, b) => b.changePercent - a.changePercent);
      const topStocks = stocks.slice(0, Math.min(limit, stocks.length));

      return {
        success: true,
        data: topStocks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<OplabResponse<{ status: string; message: string; version: string }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

      return {
        success: true,
        data: {
          status: 'healthy',
          message: 'Oplab Mock Service is running correctly',
          version: '1.0.0'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
} 