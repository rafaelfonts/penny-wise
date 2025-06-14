// ==========================================
// MARKET DATA TYPES - Penny Wise
// ==========================================

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

export interface IntradayData {
  symbol: string;
  interval: '1min' | '5min' | '15min' | '30min' | '60min';
  data: {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  lastRefreshed: string;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

export interface DailyData {
  symbol: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    adjustedClose: number;
    volume: number;
  }[];
  lastRefreshed: string;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

export interface CompanyOverview {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCapitalization: number;
  peRatio: number;
  pegRatio: number;
  bookValue: number;
  dividendPerShare: number;
  dividendYield: number;
  eps: number;
  revenuePerShareTTM: number;
  profitMargin: number;
  operatingMarginTTM: number;
  returnOnAssetsTTM: number;
  returnOnEquityTTM: number;
  revenueTTM: number;
  grossProfitTTM: number;
  dilutedEPSTTM: number;
  quarterlyEarningsGrowthYOY: number;
  quarterlyRevenueGrowthYOY: number;
  analystTargetPrice: number;
  trailingPE: number;
  forwardPE: number;
  priceToSalesRatioTTM: number;
  priceToBookRatio: number;
  evToRevenue: number;
  evToEbitda: number;
  beta: number;
  week52High: number;
  week52Low: number;
  day50MovingAverage: number;
  day200MovingAverage: number;
  sharesOutstanding: number;
  sharesFloat: number;
  sharesShort: number;
  sharesShortPriorMonth: number;
  shortRatio: number;
  shortPercentOutstanding: number;
  shortPercentFloat: number;
  percentInsiders: number;
  percentInstitutions: number;
  forwardAnnualDividendRate: number;
  forwardAnnualDividendYield: number;
  payoutRatio: number;
  dividendDate: string;
  exDividendDate: string;
  lastSplitFactor: string;
  lastSplitDate: string;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

export interface NewsItem {
  title: string;
  url: string;
  timePublished: string;
  authors: string[];
  summary: string;
  bannerImage: string;
  source: string;
  categoryWithinSource: string;
  sourceDomain: string;
  topics: {
    topic: string;
    relevanceScore: number;
  }[];
  overallSentimentScore: number;
  overallSentimentLabel:
    | 'Bearish'
    | 'Somewhat-Bearish'
    | 'Neutral'
    | 'Somewhat-Bullish'
    | 'Bullish';
  tickerSentiment: {
    ticker: string;
    relevanceScore: number;
    tickerSentimentScore: number;
    tickerSentimentLabel:
      | 'Bearish'
      | 'Somewhat-Bearish'
      | 'Neutral'
      | 'Somewhat-Bullish'
      | 'Bullish';
  }[];
}

export interface TopGainersLosers {
  mostActivelyTraded: {
    ticker: string;
    price: number;
    changeAmount: number;
    changePercentage: number;
    volume: number;
  }[];
  topGainers: {
    ticker: string;
    price: number;
    changeAmount: number;
    changePercentage: number;
    volume: number;
  }[];
  topLosers: {
    ticker: string;
    price: number;
    changeAmount: number;
    changePercentage: number;
    volume: number;
  }[];
  lastUpdated: string;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

export interface TechnicalIndicator {
  symbol: string;
  indicator: string;
  data: {
    date: string;
    value: number;
  }[];
  parameters: Record<string, string | number | boolean>;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

export interface MarketStatus {
  primaryExchanges: {
    market_type: string;
    region: string;
    primary_exchanges: string;
    local_open: string;
    local_close: string;
    current_status: 'open' | 'closed';
    notes: string;
  }[];
  lastUpdated: string;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

export interface EarningsData {
  symbol: string;
  annualEarnings: {
    fiscalDateEnding: string;
    reportedEPS: number;
  }[];
  quarterlyEarnings: {
    fiscalDateEnding: string;
    reportedDate: string;
    reportedEPS: number;
    estimatedEPS: number;
    surprise: number;
    surprisePercentage: number;
  }[];
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: number;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
  timestamp: string;
  cached: boolean;
  cacheExpiry?: string;
}

export interface MarketDataConfig {
  source: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
  fallback?: 'alpha_vantage' | 'yahoo_finance' | 'oplab';
  cacheEnabled: boolean;
  cacheDuration: number; // em minutos
  retryAttempts: number;
  retryDelay: number; // em ms
}

// ==========================================
// CHAT INTEGRATION TYPES
// ==========================================

export interface MarketAnalysisRequest {
  command: '/analyze' | '/compare' | '/portfolio' | '/alert';
  symbols: string[];
  parameters?: Record<string, string | number | boolean>;
  userId: string;
  conversationId: string;
}

export interface MarketAnalysisResponse {
  analysis: string;
  data:
    | StockQuote[]
    | CompanyOverview[]
    | NewsItem[]
    | TechnicalIndicator[]
    | TopGainersLosers;
  charts?: {
    type: 'line' | 'candlestick' | 'bar';
    data: Record<string, string | number>[];
    config: Record<string, string | number | boolean>;
  }[];
  recommendations?: string[];
  risks?: string[];
  timestamp: string;
}
