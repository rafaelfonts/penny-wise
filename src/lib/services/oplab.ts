// ==========================================
// OPLAB API SERVICE - Penny Wise
// ==========================================

const OPLAB_BASE_URL = 'https://api.oplab.com.br/v3';

export interface OplabConfig {
  accessToken: string;
  baseUrl?: string;
}

export interface OplabResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

// Domain Types - User Management
export interface UserAuth {
  email: string;
  password: string;
}

export interface UserInfo {
  name: string;
  id: number;
  preferences: Record<string, unknown>;
  email: string;
  'last-login': string;
  category: string;
  permissions: string;
  acl: string;
  'access-token': string;
  'data-access': 'REAL_TIME' | 'DELAYED' | 'EOD';
  'display-name': string;
  avatar: string;
  versions: Record<string, string>;
  'days-to-expiration': number | null;
  'default-portfólio': number;
  'minimum-version': number;
  'phone-number': string;
  'document-number': string;
  'datafeed-access-token'?: string;
  endpoints?: string[];
  servers?: Array<{ url: string; level: number }>;
  'system-config': Record<string, unknown>;
}

// Market Types
export interface Stock {
  symbol: string;
  name: string;
  market: {
    open: number;
    high: number;
    low: number;
    close: number;
    vol: number;
    fin_volume: number;
    trades: number;
    bid: number;
    ask: number;
    variation: number;
    previous_close: number;
  };
  info: {
    category: string;
    contract_size: number;
    has_options: boolean;
  };
  quant?: Record<string, unknown>;
  staged: boolean;
}

export interface Option {
  symbol: string;
  name: string;
  market: {
    open: number;
    high: number;
    low: number;
    close: number;
    vol: number;
    fin_volume: number;
    trades: number;
    bid: number;
    ask: number;
    variation: number;
    previous_close: number;
  };
  info: {
    maturity_type: 'AMERICAN' | 'EUROPEAN';
    days_to_maturity: number;
    due_date: string;
    strike: number;
    category: 'CALL' | 'PUT';
    contract_size: number;
    spot_price: number;
  };
  underlying_asset: Stock;
}

export interface Portfolio {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  active: boolean;
  name: string | null;
  is_default: boolean;
  positions: unknown[];
  balancings: string[];
  is_shared: boolean;
}

export interface MarketStatus {
  open: boolean;
  session: string;
  next_session: string;
  time: string;
}

export class OplabService {
  private config: OplabConfig;

  constructor(config: OplabConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || OPLAB_BASE_URL
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<OplabResponse<T>> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Access-Token': this.config.accessToken,
        ...options.headers as Record<string, string>
      });

      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? data.error || `HTTP ${response.status}` : undefined,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0
      };
    }
  }

  // Domain/User Management
  async authenticate(email: string, password: string): Promise<OplabResponse<UserInfo>> {
    return this.makeRequest<UserInfo>('/domain/users/authenticate', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async authorize(context: 'default' | 'chart' = 'default'): Promise<OplabResponse<UserInfo>> {
    return this.makeRequest<UserInfo>(`/domain/users/authorize?for=${context}`);
  }

  async getUserSettings(group?: string): Promise<OplabResponse<Record<string, unknown>>> {
    const params = group ? `?group=${group}` : '';
    return this.makeRequest<Record<string, unknown>>(`/domain/users/settings${params}`);
  }

  // Portfolio Management
  async getPortfolios(): Promise<OplabResponse<Portfolio[]>> {
    return this.makeRequest<Portfolio[]>('/domain/portfolios');
  }

  async getPortfolio(portfolioId: number): Promise<OplabResponse<Portfolio>> {
    return this.makeRequest<Portfolio>(`/domain/portfolios/${portfolioId}`);
  }

  async createPortfolio(name: string, active: boolean = true): Promise<OplabResponse<Portfolio>> {
    return this.makeRequest<Portfolio>('/domain/portfolios', {
      method: 'POST',
      body: JSON.stringify({ name, active })
    });
  }

  async updatePortfolio(portfolioId: number, data: { name?: string; active?: boolean }): Promise<OplabResponse<Portfolio>> {
    return this.makeRequest<Portfolio>(`/domain/portfolios/${portfolioId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deletePortfolio(portfolioId: number): Promise<OplabResponse<void>> {
    return this.makeRequest<void>(`/domain/portfolios/${portfolioId}`, {
      method: 'DELETE'
    });
  }

  // Market Data
  async getStocks(): Promise<OplabResponse<Stock[]>> {
    return this.makeRequest<Stock[]>('/market/stocks');
  }

  async getStock(symbol: string): Promise<OplabResponse<Stock>> {
    return this.makeRequest<Stock>(`/market/stocks/${symbol}`);
  }

  async getStocksWithOptions(): Promise<OplabResponse<Stock[]>> {
    return this.makeRequest<Stock[]>('/market/stocks/with-options');
  }

  async getOptions(underlyingSymbol: string): Promise<OplabResponse<Option[]>> {
    return this.makeRequest<Option[]>(`/market/options/${underlyingSymbol}`);
  }

  async getOption(optionSymbol: string): Promise<OplabResponse<Option>> {
    return this.makeRequest<Option>(`/market/options/detail/${optionSymbol}`);
  }

  async getInstrumentQuotes(instruments: string[]): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/instruments/quotes', {
      method: 'POST',
      body: JSON.stringify({ instruments })
    });
  }

  async getInstrument(symbol: string): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(`/market/instruments/${symbol}`);
  }

  async getMarketStatus(): Promise<OplabResponse<MarketStatus>> {
    return this.makeRequest<MarketStatus>('/market/status');
  }

  // Interest Rates
  async getInterestRates(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/interest-rates');
  }

  async getInterestRate(rateId: string): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(`/market/interest-rates/${rateId}`);
  }

  // Stock Exchanges
  async getExchanges(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/exchanges');
  }

  async getExchange(exchangeId: string): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(`/market/exchanges/${exchangeId}`);
  }

  // Rankings
  async getTopVolumeOptions(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/options/volume');
  }

  async getHighestProfitOptions(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/options/profit');
  }

  async getBiggestVariationOptions(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/options/variation');
  }

  async getIbovCorrelationOptions(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/options/ibov-correlation');
  }

  async getFundamentalistCompanies(attribute: string): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(`/market/rankings/companies/fundamentalist/${attribute}`);
  }

  async getOplabScoreStocks(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/stocks/oplab-score');
  }

  // Historical Data
  async getHistoricalData(symbol: string, from?: string, to?: string): Promise<OplabResponse<Record<string, unknown>>> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const queryString = params.toString();
    const endpoint = `/market/historical/${symbol}${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<Record<string, unknown>>(endpoint);
  }

  async getOptionsHistory(underlyingSymbol: string, date?: string): Promise<OplabResponse<Record<string, unknown>>> {
    const params = date ? `?date=${date}` : '';
    return this.makeRequest<Record<string, unknown>>(`/market/historical/options/${underlyingSymbol}${params}`);
  }

  // Health Check
  async healthCheck(): Promise<OplabResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }

  // Utility method to check if service is configured
  isConfigured(): boolean {
    return !!this.config.accessToken;
  }

  // Get current configuration (without sensitive data)
  getConfig(): Omit<OplabConfig, 'accessToken'> {
    return {
      baseUrl: this.config.baseUrl
    };
  }
}

// Singleton instance
let oplabInstance: OplabService | null = null;

export const createOplabService = (config: OplabConfig): OplabService => {
  oplabInstance = new OplabService(config);
  return oplabInstance;
};

export const getOplabService = (): OplabService => {
  if (!oplabInstance) {
    throw new Error('Oplab service not initialized. Call createOplabService first.');
  }
  return oplabInstance;
};

export default OplabService; 