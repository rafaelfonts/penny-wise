// ==========================================
// ALPHA VANTAGE API SERVICE - Penny Wise
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
  MarketDataConfig,
} from '@/lib/types/market';

class AlphaVantageService {
  private baseUrl: string;
  private apiKey: string;
  private config: MarketDataConfig;

  constructor() {
    // Não precisamos mais da baseUrl e apiKey já que usamos rota proxy
    this.baseUrl = '';
    this.apiKey = '';
    this.config = {
      source: 'alpha_vantage',
      fallback: 'yahoo_finance',
      cacheEnabled: true,
      cacheDuration: 5, // 5 minutos para dados em tempo real
      retryAttempts: 3,
      retryDelay: 1000,
    };
  }

  private async makeRequest<T>(
    func: string,
    additionalParams: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const params = new URLSearchParams({
      function: func,
      ...additionalParams,
    });

    // Use nossa rota API proxy ao invés de fazer requisição direta
    // Check if we're on the server side or client side
    const isServer = typeof window === 'undefined';
    let url: string;

    if (isServer) {
      // On server side, use the full URL
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      url = `${baseUrl}/api/market/alpha-vantage?${params.toString()}`;
    } else {
      // On client side, use relative URL
      url = `/api/market/alpha-vantage?${params.toString()}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: {
          revalidate: this.config.cacheEnabled
            ? this.config.cacheDuration * 60
            : 0,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Alpha Vantage API error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(
          result.error || 'No data returned from Alpha Vantage API'
        );
      }

      return {
        data: result.data as T,
        error: null,
        success: true,
        source: 'alpha_vantage',
        timestamp: result.timestamp,
        cached: this.config.cacheEnabled,
      };
    } catch (error) {
      console.error('Alpha Vantage API Error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  // ==========================================
  // CORE STOCK DATA
  // ==========================================

  async getQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    const response = await this.makeRequest<Record<string, unknown>>(
      'GLOBAL_QUOTE',
      { symbol }
    );

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch quote data',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const quoteData = response.data['Global Quote'] as Record<string, string>;

      const quote: StockQuote = {
        symbol: quoteData['01. symbol'],
        name: symbol, // Alpha Vantage não retorna nome completo no quote
        price: parseFloat(quoteData['05. price']),
        change: parseFloat(quoteData['09. change']),
        changePercent: parseFloat(
          quoteData['10. change percent'].replace('%', '')
        ),
        volume: parseInt(quoteData['06. volume']),
        high: parseFloat(quoteData['03. high']),
        low: parseFloat(quoteData['04. low']),
        open: parseFloat(quoteData['02. open']),
        previousClose: parseFloat(quoteData['08. previous close']),
        timestamp: quoteData['07. latest trading day'],
        source: 'alpha_vantage',
      };

      return {
        ...response,
        data: quote,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing quote data: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  async getIntradayData(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min',
    outputsize: 'compact' | 'full' = 'compact'
  ): Promise<ApiResponse<IntradayData>> {
    const response = await this.makeRequest<Record<string, unknown>>(
      'TIME_SERIES_INTRADAY',
      {
        symbol,
        interval,
        outputsize,
      }
    );

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch intraday data',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const metadata = response.data['Meta Data'] as Record<string, string>;
      const timeSeries = response.data[`Time Series (${interval})`] as Record<
        string,
        Record<string, string>
      >;

      const data: IntradayData = {
        symbol: metadata['2. Symbol'],
        interval,
        data: Object.entries(timeSeries).map(([timestamp, values]) => ({
          timestamp,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        })),
        lastRefreshed: metadata['3. Last Refreshed'],
        source: 'alpha_vantage',
      };

      return {
        ...response,
        data,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing intraday data: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  async getDailyData(
    symbol: string,
    adjusted: boolean = true,
    outputsize: 'compact' | 'full' = 'compact'
  ): Promise<ApiResponse<DailyData>> {
    const func = adjusted ? 'TIME_SERIES_DAILY_ADJUSTED' : 'TIME_SERIES_DAILY';
    const response = await this.makeRequest<Record<string, unknown>>(func, {
      symbol,
      outputsize,
    });

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch daily data',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const metadata = response.data['Meta Data'] as Record<string, string>;
      const timeSeries = response.data['Time Series (Daily)'] as Record<
        string,
        Record<string, string>
      >;

      const data: DailyData = {
        symbol: metadata['2. Symbol'],
        data: Object.entries(timeSeries).map(([date, values]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          adjustedClose: adjusted
            ? parseFloat(values['5. adjusted close'])
            : parseFloat(values['4. close']),
          volume: parseInt(values[adjusted ? '6. volume' : '5. volume']),
        })),
        lastRefreshed: metadata['3. Last Refreshed'],
        source: 'alpha_vantage',
      };

      return {
        ...response,
        data,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing daily data: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  // ==========================================
  // COMPANY OVERVIEW
  // ==========================================

  async getCompanyOverview(
    symbol: string
  ): Promise<ApiResponse<CompanyOverview>> {
    const response = await this.makeRequest<Record<string, string>>(
      'OVERVIEW',
      { symbol }
    );

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch company overview',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const data = response.data;

      const overview: CompanyOverview = {
        symbol: data.Symbol,
        name: data.Name,
        description: data.Description,
        sector: data.Sector,
        industry: data.Industry,
        marketCapitalization: parseFloat(data.MarketCapitalization) || 0,
        peRatio: parseFloat(data.PERatio) || 0,
        pegRatio: parseFloat(data.PEGRatio) || 0,
        bookValue: parseFloat(data.BookValue) || 0,
        dividendPerShare: parseFloat(data.DividendPerShare) || 0,
        dividendYield: parseFloat(data.DividendYield) || 0,
        eps: parseFloat(data.EPS) || 0,
        revenuePerShareTTM: parseFloat(data.RevenuePerShareTTM) || 0,
        profitMargin: parseFloat(data.ProfitMargin) || 0,
        operatingMarginTTM: parseFloat(data.OperatingMarginTTM) || 0,
        returnOnAssetsTTM: parseFloat(data.ReturnOnAssetsTTM) || 0,
        returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM) || 0,
        revenueTTM: parseFloat(data.RevenueTTM) || 0,
        grossProfitTTM: parseFloat(data.GrossProfitTTM) || 0,
        dilutedEPSTTM: parseFloat(data.DilutedEPSTTM) || 0,
        quarterlyEarningsGrowthYOY:
          parseFloat(data.QuarterlyEarningsGrowthYOY) || 0,
        quarterlyRevenueGrowthYOY:
          parseFloat(data.QuarterlyRevenueGrowthYOY) || 0,
        analystTargetPrice: parseFloat(data.AnalystTargetPrice) || 0,
        trailingPE: parseFloat(data.TrailingPE) || 0,
        forwardPE: parseFloat(data.ForwardPE) || 0,
        priceToSalesRatioTTM: parseFloat(data.PriceToSalesRatioTTM) || 0,
        priceToBookRatio: parseFloat(data.PriceToBookRatio) || 0,
        evToRevenue: parseFloat(data.EVToRevenue) || 0,
        evToEbitda: parseFloat(data.EVToEBITDA) || 0,
        beta: parseFloat(data.Beta) || 0,
        week52High: parseFloat(data['52WeekHigh']) || 0,
        week52Low: parseFloat(data['52WeekLow']) || 0,
        day50MovingAverage: parseFloat(data['50DayMovingAverage']) || 0,
        day200MovingAverage: parseFloat(data['200DayMovingAverage']) || 0,
        sharesOutstanding: parseFloat(data.SharesOutstanding) || 0,
        sharesFloat: parseFloat(data.SharesFloat) || 0,
        sharesShort: parseFloat(data.SharesShort) || 0,
        sharesShortPriorMonth: parseFloat(data.SharesShortPriorMonth) || 0,
        shortRatio: parseFloat(data.ShortRatio) || 0,
        shortPercentOutstanding: parseFloat(data.ShortPercentOutstanding) || 0,
        shortPercentFloat: parseFloat(data.ShortPercentFloat) || 0,
        percentInsiders: parseFloat(data.PercentInsiders) || 0,
        percentInstitutions: parseFloat(data.PercentInstitutions) || 0,
        forwardAnnualDividendRate:
          parseFloat(data.ForwardAnnualDividendRate) || 0,
        forwardAnnualDividendYield:
          parseFloat(data.ForwardAnnualDividendYield) || 0,
        payoutRatio: parseFloat(data.PayoutRatio) || 0,
        dividendDate: data.DividendDate || '',
        exDividendDate: data.ExDividendDate || '',
        lastSplitFactor: data.LastSplitFactor || '',
        lastSplitDate: data.LastSplitDate || '',
        source: 'alpha_vantage',
      };

      return {
        ...response,
        data: overview,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing company overview: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  // ==========================================
  // ALPHA INTELLIGENCE™
  // ==========================================

  async getNewsAndSentiment(
    tickers?: string[],
    topics?: string[],
    limit: number = 50,
    sort: 'LATEST' | 'EARLIEST' | 'RELEVANCE' = 'LATEST'
  ): Promise<ApiResponse<NewsItem[]>> {
    const params: Record<string, string> = {
      limit: limit.toString(),
      sort,
    };

    if (tickers && tickers.length > 0) {
      params.tickers = tickers.join(',');
    }

    if (topics && topics.length > 0) {
      params.topics = topics.join(',');
    }

    const response = await this.makeRequest<Record<string, unknown>>(
      'NEWS_SENTIMENT',
      params
    );

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch news data',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const feed = response.data.feed as Record<string, unknown>[];

      const newsItems: NewsItem[] = feed.map((item): NewsItem => {
        const newsItem = item as Record<string, unknown>;
        return {
          title: newsItem.title as string,
          url: newsItem.url as string,
          timePublished: newsItem.time_published as string,
          authors: newsItem.authors as string[],
          summary: newsItem.summary as string,
          bannerImage: newsItem.banner_image as string,
          source: newsItem.source as string,
          categoryWithinSource: newsItem.category_within_source as string,
          sourceDomain: newsItem.source_domain as string,
          topics: newsItem.topics as {
            topic: string;
            relevanceScore: number;
          }[],
          overallSentimentScore: parseFloat(
            newsItem.overall_sentiment_score as string
          ),
          overallSentimentLabel: newsItem.overall_sentiment_label as
            | 'Bearish'
            | 'Somewhat-Bearish'
            | 'Neutral'
            | 'Somewhat-Bullish'
            | 'Bullish',
          tickerSentiment: newsItem.ticker_sentiment as {
            ticker: string;
            relevanceScore: number;
            tickerSentimentScore: number;
            tickerSentimentLabel:
              | 'Bearish'
              | 'Somewhat-Bearish'
              | 'Neutral'
              | 'Somewhat-Bullish'
              | 'Bullish';
          }[],
        };
      });

      return {
        ...response,
        data: newsItems,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing news data: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  async getTopGainersLosers(): Promise<ApiResponse<TopGainersLosers>> {
    const response =
      await this.makeRequest<Record<string, unknown>>('TOP_GAINERS_LOSERS');

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch top gainers/losers',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const data = response.data;

      const result: TopGainersLosers = {
        mostActivelyTraded: (
          data.most_actively_traded as Record<string, string>[]
        ).map(item => ({
          ticker: item.ticker,
          price: parseFloat(item.price),
          changeAmount: parseFloat(item.change_amount),
          changePercentage: parseFloat(item.change_percentage.replace('%', '')),
          volume: parseInt(item.volume),
        })),
        topGainers: (data.top_gainers as Record<string, string>[]).map(
          item => ({
            ticker: item.ticker,
            price: parseFloat(item.price),
            changeAmount: parseFloat(item.change_amount),
            changePercentage: parseFloat(
              item.change_percentage.replace('%', '')
            ),
            volume: parseInt(item.volume),
          })
        ),
        topLosers: (data.top_losers as Record<string, string>[]).map(item => ({
          ticker: item.ticker,
          price: parseFloat(item.price),
          changeAmount: parseFloat(item.change_amount),
          changePercentage: parseFloat(item.change_percentage.replace('%', '')),
          volume: parseInt(item.volume),
        })),
        lastUpdated: data.last_updated as string,
        source: 'alpha_vantage',
      };

      return {
        ...response,
        data: result,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing gainers/losers data: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  async searchSymbol(keywords: string): Promise<ApiResponse<SearchResult[]>> {
    const response = await this.makeRequest<Record<string, unknown>>(
      'SYMBOL_SEARCH',
      {
        keywords,
      }
    );

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to search symbols',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const bestMatches = response.data.bestMatches as Record<string, string>[];

      const results: SearchResult[] = bestMatches.map(match => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        marketOpen: match['5. marketOpen'],
        marketClose: match['6. marketClose'],
        timezone: match['7. timezone'],
        currency: match['8. currency'],
        matchScore: parseFloat(match['9. matchScore']),
        source: 'alpha_vantage',
      }));

      return {
        ...response,
        data: results,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing search results: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  async getMarketStatus(): Promise<ApiResponse<MarketStatus>> {
    const response =
      await this.makeRequest<Record<string, unknown>>('MARKET_STATUS');

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch market status',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const data = response.data;

      const status: MarketStatus = {
        primaryExchanges: (data.markets as Record<string, string>[]).map(
          market => ({
            market_type: market.market_type,
            region: market.region,
            primary_exchanges: market.primary_exchanges,
            local_open: market.local_open,
            local_close: market.local_close,
            current_status: market.current_status as 'open' | 'closed',
            notes: market.notes,
          })
        ),
        lastUpdated: new Date().toISOString(),
        source: 'alpha_vantage',
      };

      return {
        ...response,
        data: status,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing market status: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  // ==========================================
  // TECHNICAL INDICATORS
  // ==========================================

  async getRSI(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    timePeriod: number = 14,
    seriesType: 'close' | 'open' | 'high' | 'low' = 'close'
  ): Promise<ApiResponse<TechnicalIndicator>> {
    const response = await this.makeRequest<Record<string, unknown>>('RSI', {
      symbol,
      interval,
      time_period: timePeriod.toString(),
      series_type: seriesType,
    });

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch RSI data',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const metadata = response.data['Meta Data'] as Record<string, string>;
      const technicalAnalysis = response.data[
        'Technical Analysis: RSI'
      ] as Record<string, Record<string, string>>;

      const indicator: TechnicalIndicator = {
        symbol: metadata['1: Symbol'],
        indicator: 'RSI',
        data: Object.entries(technicalAnalysis).map(([date, values]) => ({
          date,
          value: parseFloat(values.RSI),
        })),
        parameters: {
          interval,
          timePeriod,
          seriesType,
        },
        source: 'alpha_vantage',
      };

      return {
        ...response,
        data: indicator,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing RSI data: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }

  async getMACD(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    seriesType: 'close' | 'open' | 'high' | 'low' = 'close',
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): Promise<ApiResponse<TechnicalIndicator>> {
    const response = await this.makeRequest<Record<string, unknown>>('MACD', {
      symbol,
      interval,
      series_type: seriesType,
      fastperiod: fastPeriod.toString(),
      slowperiod: slowPeriod.toString(),
      signalperiod: signalPeriod.toString(),
    });

    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Failed to fetch MACD data',
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      const metadata = response.data['Meta Data'] as Record<string, string>;
      const technicalAnalysis = response.data[
        'Technical Analysis: MACD'
      ] as Record<string, Record<string, string>>;

      const indicator: TechnicalIndicator = {
        symbol: metadata['1: Symbol'],
        indicator: 'MACD',
        data: Object.entries(technicalAnalysis).map(([date, values]) => ({
          date,
          value: parseFloat(values.MACD),
        })),
        parameters: {
          interval,
          seriesType,
          fastPeriod,
          slowPeriod,
          signalPeriod,
        },
        source: 'alpha_vantage',
      };

      return {
        ...response,
        data: indicator,
      };
    } catch (error) {
      return {
        data: null,
        error: `Error parsing MACD data: ${error}`,
        success: false,
        source: 'alpha_vantage',
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  }
}

// Singleton instance
export const alphaVantageService = new AlphaVantageService();
export default alphaVantageService;
