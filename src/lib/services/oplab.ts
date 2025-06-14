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

// New interfaces for Charts/Market Data
export interface MarketDataInfo {
  supported_resolutions: string[];
  supports_group_request: boolean;
  supports_marks: boolean;
  supports_search: boolean;
  supports_timescale_marks: boolean;
  exchanges: Array<{ value: string; name: string; desc: string }>;
  symbols_types: Array<{ name: string; value: string }>;
}

export interface ChartData {
  s: string; // status
  t: number[]; // time
  o: number[]; // open
  h: number[]; // high  
  l: number[]; // low
  c: number[]; // close
  v: number[]; // volume
}

export interface InstrumentSearchResult {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  type: string;
  ticker?: string;
}

export interface BlackScholesData {
  theoretical_price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  implied_volatility: number;
}

export interface CompanyInfo {
  cnpj: string;
  name: string;
  fantasy_name: string;
  main_activity: string;
  secondary_activity?: string;
  situation: string;
  sector: string;
  subsector: string;
  segment: string;
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

  // ==========================================
  // CHARTS & MARKET DATA ENDPOINTS
  // ==========================================

  // GET /v2/charts/data/info
  async getMarketDataInfo(): Promise<OplabResponse<MarketDataInfo>> {
    return this.makeRequest<MarketDataInfo>('/v2/charts/data/info');
  }

  // GET /v2/charts/data/time
  async getServerTime(): Promise<OplabResponse<number>> {
    return this.makeRequest<number>('/v2/charts/data/time');
  }

  // GET /v2/charts/data/:symbol/:resolution
  async getChartData(
    symbol: string, 
    resolution: string, 
    from?: number, 
    to?: number
  ): Promise<OplabResponse<ChartData>> {
    let endpoint = `/v2/charts/data/${symbol}/${resolution}`;
    const params = new URLSearchParams();
    if (from) params.append('from', from.toString());
    if (to) params.append('to', to.toString());
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.makeRequest<ChartData>(endpoint);
  }

  // GET /v2/charts/instruments/search/:expr
  async searchInstruments(expr: string): Promise<OplabResponse<InstrumentSearchResult[]>> {
    return this.makeRequest<InstrumentSearchResult[]>(`/v2/charts/instruments/search/${encodeURIComponent(expr)}`);
  }

  // Cotação atual de instrumentos
  async getCurrentQuotes(symbols: string[]): Promise<OplabResponse<Record<string, unknown>>> {
    const symbolsParam = symbols.join(',');
    return this.makeRequest<Record<string, unknown>>(`/market/quotes?symbols=${symbolsParam}`);
  }

  // ==========================================
  // INSTRUMENTOS & SÉRIES
  // ==========================================

  // Listar instrumentos
  async getInstruments(): Promise<OplabResponse<unknown[]>> {
    return this.makeRequest<unknown[]>('/market/instruments');
  }

  // Consultar um instrumento
  async getInstrument(symbol: string): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(`/market/instruments/${symbol}`);
  }

  // Listar séries de opções de um instrumento
  async getInstrumentOptionSeries(symbol: string): Promise<OplabResponse<unknown[]>> {
    return this.makeRequest<unknown[]>(`/market/instruments/${symbol}/option-series`);
  }

  // Consultar detalhes de uma lista de instrumentos
  async getInstrumentDetails(symbols: string[]): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/instruments/details', {
      method: 'POST',
      body: JSON.stringify({ symbols })
    });
  }

  // ==========================================
  // AÇÕES E DERIVATIVOS (OPÇÕES)
  // ==========================================

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
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deletePortfolio(portfolioId: number): Promise<OplabResponse<void>> {
    return this.makeRequest<void>(`/domain/portfolios/${portfolioId}`, {
      method: 'DELETE'
    });
  }

  // Listar todas as ações
  async getStocks(): Promise<OplabResponse<Stock[]>> {
    return this.makeRequest<Stock[]>('/market/stocks');
  }

  // Consultar uma ação
  async getStock(symbol: string): Promise<OplabResponse<Stock>> {
    return this.makeRequest<Stock>(`/market/stocks/${symbol}`);
  }

  // Listar ações que possuem opções
  async getStocksWithOptions(): Promise<OplabResponse<Stock[]>> {
    return this.makeRequest<Stock[]>('/market/stocks?has_options=true');
  }

  // Listar opções de um ativo
  async getOptions(underlyingSymbol: string): Promise<OplabResponse<Option[]>> {
    return this.makeRequest<Option[]>(`/market/options?underlying=${underlyingSymbol}`);
  }

  // Consultar uma opção
  async getOption(optionSymbol: string): Promise<OplabResponse<Option>> {
    return this.makeRequest<Option>(`/market/options/${optionSymbol}`);
  }

  // Listar opções para estratégias cobertas
  async getCoveredOptions(underlyingSymbol: string, strategy?: string): Promise<OplabResponse<Option[]>> {
    const params = strategy ? `?strategy=${strategy}` : '';
    return this.makeRequest<Option[]>(`/market/options/${underlyingSymbol}/covered${params}`);
  }

  // Consultar Black-Scholes de uma opção
  async getOptionBlackScholes(optionSymbol: string): Promise<OplabResponse<BlackScholesData>> {
    return this.makeRequest<BlackScholesData>(`/market/options/${optionSymbol}/black-scholes`);
  }

  // Listar principais "pozinhos"
  async getTopOptions(): Promise<OplabResponse<Option[]>> {
    return this.makeRequest<Option[]>('/market/options/top');
  }

  // ==========================================
  // RANKINGS
  // ==========================================

  // Maiores volumes em opções
  async getTopVolumeOptions(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/options/volume');
  }

  // Opções com maiores taxas de lucro
  async getHighestProfitOptions(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/options/profit');
  }

  // Opções com maiores variações
  async getBiggestVariationOptions(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/options/variation');
  }

  // Opções com maiores tendências de alta/baixa
  async getTrendingOptions(direction?: 'up' | 'down'): Promise<OplabResponse<Record<string, unknown>>> {
    const params = direction ? `?direction=${direction}` : '';
    return this.makeRequest<Record<string, unknown>>(`/market/rankings/options/trends${params}`);
  }

  // Opções ordenadas pela correlação com IBOV
  async getIbovCorrelationOptions(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/options/ibov-correlation');
  }

  // Companhias ordenadas por atributo fundamentalista
  async getFundamentalistCompanies(attribute: string): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(`/market/rankings/companies/fundamentals?attribute=${attribute}`);
  }

  // Ações ordenadas pelo OpLab Score
  async getOplabScoreStocks(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/rankings/stocks/oplab-score');
  }

  // ==========================================
  // STATUS DE MERCADO E COMPANHIAS
  // ==========================================

  // Consultar status do mercado
  async getMarketStatus(): Promise<OplabResponse<MarketStatus>> {
    return this.makeRequest<MarketStatus>('/market/status');
  }

  // Consultar lista de companhias
  async getCompanies(): Promise<OplabResponse<CompanyInfo[]>> {
    return this.makeRequest<CompanyInfo[]>('/market/companies');
  }

  // Consultar uma companhia específica
  async getCompany(symbol: string): Promise<OplabResponse<CompanyInfo>> {
    return this.makeRequest<CompanyInfo>(`/market/companies/${symbol}`);
  }

  // ==========================================
  // ENDPOINTS EXISTENTES (mantidos)
  // ==========================================

  async getInstrumentQuotes(instruments: string[]): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/quotes', {
      method: 'POST',
      body: JSON.stringify({ instruments })
    });
  }

  async getInterestRates(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/interest-rates');
  }

  async getInterestRate(rateId: string): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(`/market/interest-rates/${rateId}`);
  }

  async getExchanges(): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>('/market/exchanges');
  }

  async getExchange(exchangeId: string): Promise<OplabResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(`/market/exchanges/${exchangeId}`);
  }

  async getHistoricalData(symbol: string, from?: string, to?: string): Promise<OplabResponse<Record<string, unknown>>> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const queryString = params.toString();
    
    return this.makeRequest<Record<string, unknown>>(`/market/historical/${symbol}${queryString ? `?${queryString}` : ''}`);
  }

  async getOptionsHistory(underlyingSymbol: string, date?: string): Promise<OplabResponse<Record<string, unknown>>> {
    const params = date ? `?date=${date}` : '';
    return this.makeRequest<Record<string, unknown>>(`/market/options/${underlyingSymbol}/history${params}`);
  }

  async healthCheck(): Promise<OplabResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }

  isConfigured(): boolean {
    return !!this.config.accessToken;
  }

  getConfig(): Omit<OplabConfig, 'accessToken'> {
    return {
      baseUrl: this.config.baseUrl
    };
  }
}

// Global service instance
let instance: OplabService | null = null;

export const createOplabService = (config: OplabConfig): OplabService => {
  instance = new OplabService(config);
  return instance;
};

export const getOplabService = (): OplabService => {
  if (!instance) {
    throw new Error('Oplab service not initialized. Call createOplabService first.');
  }
  return instance;
};

export default OplabService; 