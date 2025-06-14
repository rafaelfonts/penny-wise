// ==========================================
// OPLAB CHAT INTEGRATION SERVICE
// ==========================================

export interface OplabChatContext {
  marketStatus?: {
    open: boolean;
    session: string;
    next_session: string;
    time: string;
  };
  instruments?: unknown[];
  options?: unknown[];
  rankings?: {
    topOptions?: unknown[];
    fundamentals?: unknown[];
    oplabScore?: unknown[];
    trending?: unknown[];
  };
  companies?: unknown[];
  chartData?: unknown;
  blackScholes?: Record<string, unknown>;
}

export interface ChatAnalysisRequest {
  message: string;
  detectedSymbols: string[];
  requiresOptions: boolean;
  requiresFundamentals: boolean;
  requiresRankings: boolean;
  requiresSearch: boolean;
}

class OplabChatIntegrationService {
  // Keywords that suggest different types of analysis
  private readonly OPTIONS_KEYWORDS = [
    'opção',
    'opções',
    'call',
    'put',
    'strike',
    'vencimento',
    'exercício',
    'black-scholes',
    'volatilidade',
    'delta',
    'gamma',
    'theta',
    'vega',
    'estratégia',
    'covered call',
    'protective put',
    'straddle',
    'strangle',
  ];

  private readonly FUNDAMENTALS_KEYWORDS = [
    'fundamentalista',
    'p/l',
    'roe',
    'roce',
    'dividend yield',
    'endividamento',
    'liquidez',
    'ebitda',
    'lucro',
    'receita',
    'margem',
    'patrimônio',
    'balanço',
    'demonstrativo',
    'indicador',
    'fundamentals',
  ];

  private readonly RANKING_KEYWORDS = [
    'ranking',
    'top',
    'melhor',
    'maior',
    'menor',
    'líder',
    'destaque',
    'mais negociado',
    'volume',
    'variação',
    'performance',
    'score',
  ];

  private readonly CHART_KEYWORDS = [
    'gráfico',
    'chart',
    'histórico',
    'preço',
    'cotação',
    'série temporal',
    'candlestick',
    'ohlc',
    'volume',
  ];

  private readonly SEARCH_KEYWORDS = [
    'buscar',
    'procurar',
    'encontrar',
    'search',
    'empresa',
    'companhia',
  ];

  /**
   * Analyze chat message to determine required OpLab data
   */
  public analyzeMessage(
    message: string,
    detectedSymbols: string[]
  ): ChatAnalysisRequest {
    const lowerMessage = message.toLowerCase();

    return {
      message,
      detectedSymbols,
      requiresOptions: this.OPTIONS_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword)
      ),
      requiresFundamentals: this.FUNDAMENTALS_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword)
      ),
      requiresRankings: this.RANKING_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword)
      ),
      requiresSearch:
        this.SEARCH_KEYWORDS.some(keyword => lowerMessage.includes(keyword)) ||
        detectedSymbols.length === 0,
    };
  }

  /**
   * Get comprehensive OpLab context for chat
   */
  public async getComprehensiveContext(
    request: ChatAnalysisRequest
  ): Promise<OplabChatContext> {
    const context: OplabChatContext = {};
    const promises: Promise<void>[] = [];

    // Always get market status
    promises.push(this.getMarketStatus(context));

    // Get specific data based on analysis
    if (request.requiresOptions && request.detectedSymbols.length > 0) {
      promises.push(this.getOptionsData(context, request.detectedSymbols));
    }

    if (request.requiresFundamentals) {
      promises.push(this.getFundamentalsData(context));
    }

    if (request.requiresRankings) {
      promises.push(this.getRankingsData(context));
    }

    if (request.requiresSearch) {
      promises.push(this.getSearchData(context, request.message));
    }

    // Get companies data if specific symbols are mentioned
    if (request.detectedSymbols.length > 0) {
      promises.push(this.getCompaniesData(context, request.detectedSymbols));
    }

    // Execute all requests in parallel
    await Promise.allSettled(promises);

    return context;
  }

  /**
   * Get market status
   */
  private async getMarketStatus(context: OplabChatContext): Promise<void> {
    try {
      const response = await fetch('/api/market/oplab?action=market-status');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          context.marketStatus = result.data;
        }
      }
    } catch (error) {
      console.error('Error getting market status:', error);
    }
  }

  /**
   * Get options data for symbols
   */
  private async getOptionsData(
    context: OplabChatContext,
    symbols: string[]
  ): Promise<void> {
    try {
      const optionsPromises = symbols.slice(0, 3).map(async symbol => {
        try {
          const response = await fetch(
            `/api/market/oplab?action=options&symbol=${symbol}`
          );
          if (response.ok) {
            const result = await response.json();
            return result.success ? result.data : null;
          }
        } catch {
          return null;
        }
        return null;
      });

      const optionsResults = await Promise.all(optionsPromises);
      context.options = optionsResults.filter(result => result !== null).flat();
    } catch (error) {
      console.error('Error getting options data:', error);
    }
  }

  /**
   * Get fundamentalist data
   */
  private async getFundamentalsData(context: OplabChatContext): Promise<void> {
    try {
      const promises = [
        fetch('/api/market/oplab?action=fundamentalist-companies&attribute=pl'),
        fetch(
          '/api/market/oplab?action=fundamentalist-companies&attribute=roe'
        ),
        fetch(
          '/api/market/oplab?action=fundamentalist-companies&attribute=dividend_yield'
        ),
      ];

      const responses = await Promise.allSettled(promises);
      const results = await Promise.allSettled(
        responses.map(async response => {
          if (response.status === 'fulfilled' && response.value.ok) {
            return response.value.json();
          }
          return null;
        })
      );

      if (!context.rankings) context.rankings = {};

      // Combine fundamentalist data from different attributes
      const fundamentalsData: unknown[] = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value?.success) {
          fundamentalsData.push(...(result.value.data || []));
        }
      });

      if (fundamentalsData.length > 0) {
        context.rankings.fundamentals = fundamentalsData;
      }
    } catch (error) {
      console.error('Error getting fundamentals data:', error);
    }
  }

  /**
   * Get rankings data
   */
  private async getRankingsData(context: OplabChatContext): Promise<void> {
    try {
      const promises = [
        fetch('/api/market/oplab?action=top-volume-options'),
        fetch('/api/market/oplab?action=highest-profit-options'),
        fetch('/api/market/oplab?action=trending-options'),
        fetch('/api/market/oplab?action=oplab-score-stocks'),
      ];

      const responses = await Promise.allSettled(promises);
      const results = await Promise.allSettled(
        responses.map(async response => {
          if (response.status === 'fulfilled' && response.value.ok) {
            return response.value.json();
          }
          return null;
        })
      );

      if (!context.rankings) context.rankings = {};

      // Map results to ranking categories
      const [topVolume, , trending, oplabScore] = results;

      if (topVolume.status === 'fulfilled' && topVolume.value?.success) {
        context.rankings.topOptions = topVolume.value.data;
      }

      if (trending.status === 'fulfilled' && trending.value?.success) {
        context.rankings.trending = trending.value.data;
      }

      if (oplabScore.status === 'fulfilled' && oplabScore.value?.success) {
        context.rankings.oplabScore = oplabScore.value.data;
      }
    } catch (error) {
      console.error('Error getting rankings data:', error);
    }
  }

  /**
   * Get search data
   */
  private async getSearchData(
    context: OplabChatContext,
    message: string
  ): Promise<void> {
    try {
      const searchTerms = this.extractSearchTerms(message);
      if (searchTerms.length === 0) return;

      const searchPromises = searchTerms.slice(0, 2).map(async term => {
        try {
          const response = await fetch(
            `/api/market/oplab?action=search-instruments&expr=${encodeURIComponent(term)}`
          );
          if (response.ok) {
            const result = await response.json();
            return result.success ? result.data : null;
          }
        } catch {
          return null;
        }
        return null;
      });

      const searchResults = await Promise.all(searchPromises);
      const allInstruments = searchResults
        .filter(result => result !== null)
        .flat();

      if (allInstruments.length > 0) {
        context.instruments = allInstruments;
      }
    } catch (error) {
      console.error('Error getting search data:', error);
    }
  }

  /**
   * Get companies data
   */
  private async getCompaniesData(
    context: OplabChatContext,
    symbols: string[]
  ): Promise<void> {
    try {
      const companiesPromises = symbols.slice(0, 3).map(async symbol => {
        try {
          const response = await fetch(
            `/api/market/oplab?action=company&symbol=${symbol}`
          );
          if (response.ok) {
            const result = await response.json();
            return result.success ? result.data : null;
          }
        } catch {
          return null;
        }
        return null;
      });

      const companiesResults = await Promise.all(companiesPromises);
      const companies = companiesResults.filter(result => result !== null);

      if (companies.length > 0) {
        context.companies = companies;
      }
    } catch (error) {
      console.error('Error getting companies data:', error);
    }
  }

  /**
   * Extract search terms from message
   */
  private extractSearchTerms(message: string): string[] {
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Look for company names or terms that might be tickers
    const potentialTerms = words.filter(word => {
      return (
        /^[a-z]{3,}$/i.test(word) &&
        ![
          'com',
          'para',
          'que',
          'uma',
          'dos',
          'das',
          'the',
          'and',
          'for',
          'com',
          'www',
        ].includes(word)
      );
    });

    return potentialTerms.slice(0, 3);
  }

  /**
   * Get Black-Scholes data for options
   */
  public async getBlackScholesData(
    optionSymbol: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(
        `/api/market/oplab?action=option-black-scholes&symbol=${optionSymbol}`
      );
      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : null;
      }
    } catch (error) {
      console.error('Error getting Black-Scholes data:', error);
    }
    return null;
  }

  /**
   * Get chart data for symbol
   */
  public async getChartData(
    symbol: string,
    resolution: string = '1D',
    from?: number,
    to?: number
  ): Promise<unknown | null> {
    try {
      let endpoint = `/api/market/oplab?action=chart-data&symbol=${symbol}&resolution=${resolution}`;
      if (from) endpoint += `&from=${from}`;
      if (to) endpoint += `&to=${to}`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : null;
      }
    } catch (error) {
      console.error('Error getting chart data:', error);
    }
    return null;
  }

  /**
   * Format OpLab context for AI prompt
   */
  public formatContextForPrompt(context: OplabChatContext): string {
    let prompt = '';

    // Market Status
    if (context.marketStatus) {
      prompt += '\n=== STATUS DO MERCADO BRASILEIRO ===\n';
      prompt += `Status: ${context.marketStatus.open ? 'ABERTO' : 'FECHADO'}\n`;
      prompt += `Sessão: ${context.marketStatus.session}\n`;
      prompt += `Próxima Sessão: ${context.marketStatus.next_session}\n`;
      prompt += `Horário: ${context.marketStatus.time}\n`;
    }

    // Options Data
    if (
      context.options &&
      Array.isArray(context.options) &&
      context.options.length > 0
    ) {
      prompt += '\n=== OPÇÕES DISPONÍVEIS ===\n';
      context.options.slice(0, 8).forEach((option: unknown) => {
        const optionData = option as Record<string, unknown>;
        const info = optionData.info as Record<string, unknown>;
        const market = optionData.market as Record<string, unknown>;
        if (info && market) {
          const type = info.category === 'CALL' ? 'CALL' : 'PUT';
          const strike = info.strike as number;
          const price = market.close as number;
          const volume = market.vol as number;

          prompt += `${optionData.symbol}: ${type} Strike R$${strike?.toFixed(2)} `;
          prompt += `Preço R$${price?.toFixed(2)} `;
          prompt += `Volume ${volume?.toLocaleString()} `;
          prompt += `Venc: ${info.due_date}\n`;
        }
      });
    }

    // Rankings
    if (context.rankings) {
      if (
        context.rankings.topOptions &&
        Array.isArray(context.rankings.topOptions) &&
        context.rankings.topOptions.length > 0
      ) {
        prompt += '\n=== TOP OPÇÕES POR VOLUME ===\n';
        context.rankings.topOptions
          .slice(0, 5)
          .forEach((option: unknown, index: number) => {
            const optionData = option as Record<string, unknown>;
            prompt += `${index + 1}. ${optionData.symbol}: Volume ${(optionData.volume as number)?.toLocaleString()}\n`;
          });
      }

      if (
        context.rankings.oplabScore &&
        Array.isArray(context.rankings.oplabScore) &&
        context.rankings.oplabScore.length > 0
      ) {
        prompt += '\n=== RANKING OPLAB SCORE ===\n';
        context.rankings.oplabScore
          .slice(0, 5)
          .forEach((stock: unknown, index: number) => {
            const stockData = stock as Record<string, unknown>;
            prompt += `${index + 1}. ${stockData.symbol}: Score ${stockData.score} Preço R$${(stockData.price as number)?.toFixed(2)}\n`;
          });
      }

      if (
        context.rankings.fundamentals &&
        Array.isArray(context.rankings.fundamentals) &&
        context.rankings.fundamentals.length > 0
      ) {
        prompt += '\n=== RANKING FUNDAMENTALISTA ===\n';
        context.rankings.fundamentals
          .slice(0, 5)
          .forEach((company: unknown, index: number) => {
            const companyData = company as Record<string, unknown>;
            prompt += `${index + 1}. ${companyData.symbol}: ${companyData.name}\n`;
          });
      }
    }

    // Companies
    if (
      context.companies &&
      Array.isArray(context.companies) &&
      context.companies.length > 0
    ) {
      prompt += '\n=== INFORMAÇÕES DAS EMPRESAS ===\n';
      context.companies.forEach((company: unknown) => {
        const companyData = company as Record<string, unknown>;
        prompt += `${companyData.symbol}: ${companyData.name}\n`;
        prompt += `Setor: ${companyData.sector} | Segmento: ${companyData.segment}\n`;
      });
    }

    // Search Results
    if (
      context.instruments &&
      Array.isArray(context.instruments) &&
      context.instruments.length > 0
    ) {
      prompt += '\n=== INSTRUMENTOS ENCONTRADOS ===\n';
      context.instruments.slice(0, 5).forEach((instrument: unknown) => {
        const instrumentData = instrument as Record<string, unknown>;
        prompt += `${instrumentData.symbol}: ${instrumentData.description} (${instrumentData.type}) - ${instrumentData.exchange}\n`;
      });
    }

    // Black-Scholes Data
    if (context.blackScholes) {
      prompt += '\n=== DADOS BLACK-SCHOLES ===\n';
      prompt += `Preço Teórico: R$${(context.blackScholes.theoretical_price as number)?.toFixed(2)}\n`;
      prompt += `Delta: ${(context.blackScholes.delta as number)?.toFixed(4)}\n`;
      prompt += `Gamma: ${(context.blackScholes.gamma as number)?.toFixed(4)}\n`;
      prompt += `Theta: ${(context.blackScholes.theta as number)?.toFixed(4)}\n`;
      prompt += `Vega: ${(context.blackScholes.vega as number)?.toFixed(4)}\n`;
      prompt += `Volatilidade Implícita: ${((context.blackScholes.implied_volatility as number) * 100)?.toFixed(2)}%\n`;
    }

    return prompt;
  }

  /**
   * Get all available OpLab endpoints for reference
   */
  public getAvailableEndpoints(): Record<string, string> {
    return {
      // Market Data & Charts
      'market-data-info': 'Informações sobre dados de mercado disponíveis',
      'server-time': 'Horário atual do servidor',
      'chart-data': 'Dados históricos de cotações (OHLCV)',
      'search-instruments': 'Busca de instrumentos por nome/ticker',
      'current-quotes': 'Cotações atuais de instrumentos',

      // Instruments & Series
      instruments: 'Lista todos os instrumentos',
      instrument: 'Detalhes de um instrumento específico',
      'instrument-option-series': 'Séries de opções de um instrumento',

      // Stocks & Options
      'market-status': 'Status do mercado (aberto/fechado)',
      stocks: 'Lista todas as ações',
      stock: 'Detalhes de uma ação específica',
      'stocks-with-options': 'Ações que possuem opções',
      options: 'Opções de um ativo subjacente',
      option: 'Detalhes de uma opção específica',
      'covered-options': 'Opções para estratégias cobertas',
      'option-black-scholes': 'Cálculos Black-Scholes para opção',
      'top-options': 'Principais "pozinhos"',

      // Rankings
      'top-volume-options': 'Opções com maiores volumes',
      'highest-profit-options': 'Opções com maiores taxas de lucro',
      'biggest-variation-options': 'Opções com maiores variações',
      'trending-options': 'Opções com tendências de alta/baixa',
      'ibov-correlation-options': 'Opções ordenadas por correlação com IBOV',
      'fundamentalist-companies':
        'Empresas ordenadas por indicador fundamentalista',
      'oplab-score-stocks': 'Ações ordenadas pelo OpLab Score',

      // Companies & Status
      companies: 'Lista de companhias',
      company: 'Informações de uma companhia específica',

      // Additional Endpoints
      portfolios: 'Portfólios do usuário',
      portfolio: 'Detalhes de um portfólio',
      'interest-rates': 'Taxas de juros',
      exchanges: 'Bolsas de valores',
      historical: 'Dados históricos',
      'options-history': 'Histórico de opções',
    };
  }
}

const oplabChatIntegrationService = new OplabChatIntegrationService();
export default oplabChatIntegrationService;
