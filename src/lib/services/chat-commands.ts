/**
 * Chat Commands Service
 * Handles special commands like /quote, /analyze, /portfolio, /oplab
 */

export interface CommandResult {
  type: 'success' | 'error' | 'info';
  content: string;
  data?: unknown;
  requiresFollowup?: boolean;
}

export interface ChatCommand {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: (args: string[], userId?: string) => Promise<CommandResult>;
}

// Command handlers
class CommandHandlers {
  // ==========================================
  // MARKET DATA & QUOTES
  // ==========================================

  // Get stock quote
  static async handleQuote(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content:
          'Uso: /quote SYMBOL1 [SYMBOL2 ...]\nExemplo: /quote AAPL MSFT GOOGL',
      };
    }

    try {
      const symbols = args.map(s => s.toUpperCase());
      const quotes: Record<string, unknown> = {};

      // Fetch quotes for all symbols
      for (const symbol of symbols) {
        const response = await fetch(`/api/market/quote?symbol=${symbol}`);
        if (response.ok) {
          const data = await response.json();
          quotes[symbol] = data;
        }
      }

      if (Object.keys(quotes).length === 0) {
        return {
          type: 'error',
          content:
            'Não foi possível obter cotações para os símbolos fornecidos.',
        };
      }

      // Format results
      let content = '📈 **Cotações Atuais**\n\n';
      for (const [symbol, data] of Object.entries(quotes)) {
        if (data && typeof data === 'object' && data !== null) {
          const quote = data as {
            price?: number;
            change?: number;
            changePercent?: number;
          };
          if (quote.price) {
            const change = quote.change || 0;
            const changePercent = quote.changePercent || 0;
            const emoji = change >= 0 ? '🟢' : '🔴';

            content += `${emoji} **${symbol}**: $${quote.price}\n`;
            content += `   Variação: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)\n\n`;
          }
        }
      }

      return {
        type: 'success',
        content,
        data: { quotes, symbols },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao obter cotações. Tente novamente.',
      };
    }
  }

  // Analyze stock or market
  static async handleAnalyze(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content: 'Uso: /analyze SYMBOL [period]\nExemplo: /analyze AAPL 1y',
      };
    }

    try {
      const symbol = args[0].toUpperCase();
      const period = args[1] || '6mo';

      const response = await fetch(
        `/api/market/analyze?symbol=${symbol}&period=${period}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content:
            'Análise não disponível no momento. Tente novamente mais tarde.',
        };
      }

      const data = await response.json();

      let content = `📊 **Análise Técnica: ${symbol}**\n\n`;

      if (data.summary) {
        content += `**Resumo**: ${data.summary}\n\n`;
      }

      if (data.indicators) {
        content += '**Indicadores Técnicos:**\n';
        Object.entries(data.indicators).forEach(([key, value]) => {
          content += `• ${key}: ${value}\n`;
        });
        content += '\n';
      }

      if (data.recommendation) {
        const emoji =
          data.recommendation === 'BUY'
            ? '🟢'
            : data.recommendation === 'SELL'
              ? '🔴'
              : '🟡';
        content += `${emoji} **Recomendação**: ${data.recommendation}\n\n`;
      }

      return {
        type: 'success',
        content,
        data: { analysis: data, symbol, period },
        requiresFollowup: true,
      };
    } catch {
      return {
        type: 'error',
        content:
          'Erro ao analisar o ativo. Verifique o símbolo e tente novamente.',
      };
    }
  }

  // ==========================================
  // OPLAB SPECIFIC COMMANDS
  // ==========================================

  // OpLab market status
  static async handleMarketStatus(): Promise<CommandResult> {
    try {
      const response = await fetch('/api/market/oplab?action=market-status');
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível verificar o status do mercado.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar status do mercado.',
        };
      }

      const status = result.data as {
        open: boolean;
        session: string;
        next_session: string;
        time: string;
      };
      const emoji = status.open ? '🟢' : '🔴';

      let content = `${emoji} **Status do Mercado**\n\n`;
      content += `• **Situação**: ${status.open ? 'Aberto' : 'Fechado'}\n`;
      content += `• **Sessão Atual**: ${status.session}\n`;
      content += `• **Próxima Sessão**: ${status.next_session}\n`;
      content += `• **Horário**: ${status.time}\n\n`;

      return {
        type: 'success',
        content,
        data: { status },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar status do mercado.',
      };
    }
  }

  // OpLab stocks list
  static async handleStocks(): Promise<CommandResult> {
    try {
      const response = await fetch('/api/market/oplab?action=stocks');
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter lista de ações.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar ações.',
        };
      }

      let content = `📈 **Lista de Ações Disponíveis**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 20)
          .forEach((stock: Record<string, unknown>, index: number) => {
            content += `${index + 1}. **${stock.symbol}** - ${stock.name || 'N/A'}\n`;
          });

        if (result.data.length > 20) {
          content += `\n... e mais ${result.data.length - 20} ações.\n`;
        }
      } else {
        content += 'Nenhuma ação encontrada.';
      }

      return {
        type: 'success',
        content,
        data: { stocks: result.data },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar lista de ações.',
      };
    }
  }

  // OpLab stocks with options
  static async handleStocksWithOptions(): Promise<CommandResult> {
    try {
      const response = await fetch(
        '/api/market/oplab?action=stocks-with-options'
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter ações com opções.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar ações com opções.',
        };
      }

      let content = `🎯 **Ações com Opções Disponíveis**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 15)
          .forEach((stock: Record<string, unknown>, index: number) => {
            content += `${index + 1}. **${stock.symbol}** - ${stock.name || 'N/A'}\n`;
          });

        if (result.data.length > 15) {
          content += `\n... e mais ${result.data.length - 15} ações.\n`;
        }
      } else {
        content += 'Nenhuma ação com opções encontrada.';
      }

      return {
        type: 'success',
        content,
        data: { stocksWithOptions: result.data },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar ações com opções.',
      };
    }
  }

  // OpLab companies list
  static async handleCompanies(): Promise<CommandResult> {
    try {
      const response = await fetch('/api/market/oplab?action=companies');
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter lista de empresas.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar empresas.',
        };
      }

      let content = `🏢 **Lista de Empresas**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 15)
          .forEach((company: Record<string, unknown>, index: number) => {
            content += `${index + 1}. **${company.symbol}** - ${company.name || 'N/A'}\n`;
            if (company.sector) {
              content += `   Setor: ${company.sector}\n`;
            }
          });

        if (result.data.length > 15) {
          content += `\n... e mais ${result.data.length - 15} empresas.\n`;
        }
      } else {
        content += 'Nenhuma empresa encontrada.';
      }

      return {
        type: 'success',
        content,
        data: { companies: result.data },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar lista de empresas.',
      };
    }
  }

  // OpLab company details
  static async handleCompany(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content: 'Uso: /company SYMBOL\nExemplo: /company PETR4',
      };
    }

    try {
      const symbol = args[0].toUpperCase();

      const response = await fetch(
        `/api/market/oplab?action=company&symbol=${symbol}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter informações da empresa.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar empresa.',
        };
      }

      const company = result.data as Record<string, unknown>;

      let content = `🏢 **Informações da Empresa: ${symbol}**\n\n`;
      content += `• **Nome**: ${company.name || 'N/A'}\n`;
      content += `• **Setor**: ${company.sector || 'N/A'}\n`;
      content += `• **Segmento**: ${company.segment || 'N/A'}\n`;

      if (company.description) {
        content += `• **Descrição**: ${company.description}\n`;
      }

      return {
        type: 'success',
        content,
        data: { company, symbol },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar informações da empresa.',
      };
    }
  }

  // OpLab covered options
  static async handleCoveredOptions(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content:
          'Uso: /covered-options SYMBOL\nExemplo: /covered-options PETR4',
      };
    }

    try {
      const symbol = args[0].toUpperCase();

      const response = await fetch(
        `/api/market/oplab?action=covered-options&symbol=${symbol}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter opções cobertas.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar opções cobertas.',
        };
      }

      let content = `🛡️ **Opções Cobertas para ${symbol}**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data.slice(0, 10).forEach((option: Record<string, unknown>) => {
          const optionInfo = option.info as Record<string, unknown>;
          const optionMarket = option.market as Record<string, unknown>;

          content += `• **${option.symbol}**\n`;
          content += `  Strike: R$ ${(optionInfo?.strike as number)?.toFixed(2) || 'N/A'}\n`;
          content += `  Preço: R$ ${(optionMarket?.close as number)?.toFixed(2) || 'N/A'}\n`;
          content += `  Vencimento: ${optionInfo?.due_date || 'N/A'}\n\n`;
        });

        if (result.data.length === 0) {
          content += 'Nenhuma opção coberta encontrada.';
        }
      } else {
        content += 'Nenhuma opção coberta encontrada.';
      }

      return {
        type: 'success',
        content,
        data: { coveredOptions: result.data, symbol },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar opções cobertas.',
      };
    }
  }

  // OpLab IBOV correlation options
  static async handleIbovCorrelation(): Promise<CommandResult> {
    try {
      const response = await fetch(
        '/api/market/oplab?action=ibov-correlation-options'
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter correlação com IBOV.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar correlação IBOV.',
        };
      }

      let content = `📊 **Opções por Correlação com IBOV**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 10)
          .forEach((option: Record<string, unknown>, index: number) => {
            content += `${index + 1}. **${option.symbol}**\n`;
            content += `   Correlação: ${option.correlation || 'N/A'}\n`;
            content += `   Volume: ${(option.volume as number)?.toLocaleString() || 'N/A'}\n\n`;
          });
      } else {
        content += 'Dados não disponíveis no momento.';
      }

      return {
        type: 'success',
        content,
        data: { ibovCorrelation: result.data },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar correlação IBOV.',
      };
    }
  }

  // OpLab instruments list
  static async handleInstruments(): Promise<CommandResult> {
    try {
      const response = await fetch('/api/market/oplab?action=instruments');
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter lista de instrumentos.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar instrumentos.',
        };
      }

      let content = `🔧 **Lista de Instrumentos**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 15)
          .forEach((instrument: Record<string, unknown>, index: number) => {
            content += `${index + 1}. **${instrument.symbol}** - ${instrument.description || 'N/A'}\n`;
            content += `   Tipo: ${instrument.type || 'N/A'} | Bolsa: ${instrument.exchange || 'N/A'}\n\n`;
          });

        if (result.data.length > 15) {
          content += `\n... e mais ${result.data.length - 15} instrumentos.\n`;
        }
      } else {
        content += 'Nenhum instrumento encontrado.';
      }

      return {
        type: 'success',
        content,
        data: { instruments: result.data },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar lista de instrumentos.',
      };
    }
  }

  // OpLab instrument details
  static async handleInstrument(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content: 'Uso: /instrument SYMBOL\nExemplo: /instrument PETR4',
      };
    }

    try {
      const symbol = args[0].toUpperCase();

      const response = await fetch(
        `/api/market/oplab?action=instrument&symbol=${symbol}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter informações do instrumento.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar instrumento.',
        };
      }

      const instrument = result.data as Record<string, unknown>;

      let content = `🔧 **Instrumento: ${symbol}**\n\n`;
      content += `• **Descrição**: ${instrument.description || 'N/A'}\n`;
      content += `• **Tipo**: ${instrument.type || 'N/A'}\n`;
      content += `• **Bolsa**: ${instrument.exchange || 'N/A'}\n`;

      if (instrument.lot_size) {
        content += `• **Lote**: ${instrument.lot_size}\n`;
      }

      if (instrument.currency) {
        content += `• **Moeda**: ${instrument.currency}\n`;
      }

      return {
        type: 'success',
        content,
        data: { instrument, symbol },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar informações do instrumento.',
      };
    }
  }

  // OpLab current quotes
  static async handleCurrentQuotes(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content:
          'Uso: /current-quotes SYMBOL1 [SYMBOL2 ...]\nExemplo: /current-quotes PETR4 VALE3',
      };
    }

    try {
      const symbols = args.map(s => s.toUpperCase()).join(',');

      const response = await fetch(
        `/api/market/oplab?action=current-quotes&symbols=${symbols}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter cotações atuais.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar cotações.',
        };
      }

      let content = `💰 **Cotações Atuais**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data.forEach((quote: Record<string, unknown>) => {
          const change = (quote.change as number) || 0;
          const emoji = change >= 0 ? '🟢' : '🔴';

          content += `${emoji} **${quote.symbol}**\n`;
          content += `   Preço: R$ ${(quote.price as number)?.toFixed(2) || 'N/A'}\n`;
          content += `   Variação: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${((quote.changePercent as number) || 0).toFixed(2)}%)\n`;
          content += `   Volume: ${(quote.volume as number)?.toLocaleString() || 'N/A'}\n\n`;
        });
      } else {
        content += 'Nenhuma cotação encontrada.';
      }

      return {
        type: 'success',
        content,
        data: { quotes: result.data, symbols: args },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar cotações atuais.',
      };
    }
  }

  // OpLab chart data
  static async handleChartData(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content: 'Uso: /chart SYMBOL [resolution]\nExemplo: /chart PETR4 1D',
      };
    }

    try {
      const symbol = args[0].toUpperCase();
      const resolution = args[1] || '1D';

      const response = await fetch(
        `/api/market/oplab?action=chart-data&symbol=${symbol}&resolution=${resolution}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter dados do gráfico.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar dados do gráfico.',
        };
      }

      let content = `📈 **Dados do Gráfico: ${symbol}**\n\n`;
      content += `• **Resolução**: ${resolution}\n`;

      if (result.data) {
        const data = result.data as Record<string, unknown>;
        if (data.c && Array.isArray(data.c)) {
          const prices = data.c as number[];
          const lastPrice = prices[prices.length - 1];
          const firstPrice = prices[0];
          const change = lastPrice - firstPrice;
          const changePercent = (change / firstPrice) * 100;

          content += `• **Último Preço**: R$ ${lastPrice.toFixed(2)}\n`;
          content += `• **Variação**: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)\n`;
          content += `• **Pontos de Dados**: ${prices.length}\n`;
        }
      }

      return {
        type: 'success',
        content,
        data: { chartData: result.data, symbol, resolution },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar dados do gráfico.',
      };
    }
  }

  // OpLab top options by volume
  static async handleTopOptions(args: string[]): Promise<CommandResult> {
    const rankingType = args[0] || 'volume';
    const validTypes = ['volume', 'profit', 'variation', 'trending'];

    if (!validTypes.includes(rankingType)) {
      return {
        type: 'error',
        content: `Uso: /top-options [${validTypes.join('|')}]\nExemplo: /top-options volume`,
      };
    }

    try {
      let endpoint = '';
      let title = '';

      switch (rankingType) {
        case 'volume':
          endpoint = 'top-volume-options';
          title = 'Maiores Volumes';
          break;
        case 'profit':
          endpoint = 'highest-profit-options';
          title = 'Maiores Lucros';
          break;
        case 'variation':
          endpoint = 'biggest-variation-options';
          title = 'Maiores Variações';
          break;
        case 'trending':
          endpoint = 'trending-options';
          title = 'Tendências';
          break;
      }

      const response = await fetch(`/api/market/oplab?action=${endpoint}`);
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter ranking de opções.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar ranking de opções.',
        };
      }

      let content = `🏆 **Ranking de Opções - ${title}**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 10)
          .forEach((option: Record<string, unknown>, index: number) => {
            content += `${index + 1}. **${option.symbol}**\n`;

            if (rankingType === 'volume') {
              content += `   Volume: ${(option.volume as number)?.toLocaleString() || 'N/A'}\n`;
            } else if (rankingType === 'profit') {
              content += `   Lucro: ${((option.profit as number) || 0).toFixed(2)}%\n`;
            } else if (rankingType === 'variation') {
              content += `   Variação: ${((option.variation as number) || 0).toFixed(2)}%\n`;
            }

            content += `   Preço: R$ ${(option.price as number)?.toFixed(2) || 'N/A'}\n\n`;
          });
      } else {
        content += 'Dados não disponíveis no momento.';
      }

      return {
        type: 'success',
        content,
        data: { ranking: result.data, type: rankingType },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar ranking de opções.',
      };
    }
  }

  // Black-Scholes calculation for options
  static async handleBlackScholes(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content:
          'Uso: /black-scholes OPTION_SYMBOL\nExemplo: /black-scholes PETR4C45',
      };
    }

    try {
      const optionSymbol = args[0].toUpperCase();

      const response = await fetch(
        `/api/market/oplab?action=option-black-scholes&symbol=${optionSymbol}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível calcular Black-Scholes.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao calcular Black-Scholes.',
        };
      }

      const bs = result.data as Record<string, unknown>;

      let content = `⚡ **Black-Scholes: ${optionSymbol}**\n\n`;
      content += `📊 **Parâmetros Calculados:**\n`;
      content += `• **Preço Teórico**: R$ ${bs.theoretical_price ? (bs.theoretical_price as number).toFixed(2) : 'N/A'}\n`;
      content += `• **Delta**: ${bs.delta ? (bs.delta as number).toFixed(4) : 'N/A'}\n`;
      content += `• **Gamma**: ${bs.gamma ? (bs.gamma as number).toFixed(4) : 'N/A'}\n`;
      content += `• **Theta**: ${bs.theta ? (bs.theta as number).toFixed(4) : 'N/A'}\n`;
      content += `• **Vega**: ${bs.vega ? (bs.vega as number).toFixed(4) : 'N/A'}\n`;
      content += `• **Rho**: ${bs.rho ? (bs.rho as number).toFixed(4) : 'N/A'}\n`;
      content += `• **Volatilidade Implícita**: ${bs.implied_volatility ? ((bs.implied_volatility as number) * 100).toFixed(2) + '%' : 'N/A'}\n\n`;

      return {
        type: 'success',
        content,
        data: { blackScholes: bs, symbol: optionSymbol },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao calcular Black-Scholes.',
      };
    }
  }

  // Options chain for underlying
  static async handleOptionsChain(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content: 'Uso: /options UNDERLYING_SYMBOL\nExemplo: /options PETR4',
      };
    }

    try {
      const underlyingSymbol = args[0].toUpperCase();

      const response = await fetch(
        `/api/market/oplab?action=options&symbol=${underlyingSymbol}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter cadeia de opções.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar opções.',
        };
      }

      let content = `🔗 **Cadeia de Opções: ${underlyingSymbol}**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        // Group by expiration date
        const optionsByExpiration: Record<string, Record<string, unknown>[]> =
          {};

        result.data.forEach((option: Record<string, unknown>) => {
          const optionInfo = option.info as Record<string, unknown>;
          const expiration =
            (optionInfo?.due_date as string) || 'Sem vencimento';
          if (!optionsByExpiration[expiration]) {
            optionsByExpiration[expiration] = [];
          }
          optionsByExpiration[expiration].push(option);
        });

        // Show first 2 expirations
        Object.entries(optionsByExpiration)
          .slice(0, 2)
          .forEach(([expiration, options]) => {
            content += `📅 **Vencimento: ${expiration}**\n\n`;

            // Show first 5 options
            options.slice(0, 5).forEach((option: Record<string, unknown>) => {
              const optionInfo = option.info as Record<string, unknown>;
              const optionMarket = option.market as Record<string, unknown>;
              const type =
                optionInfo?.category === 'CALL' ? '📈 CALL' : '📉 PUT';
              const strike = (optionInfo?.strike as number) || 0;
              const price = (optionMarket?.close as number) || 0;

              content += `${type} **${option.symbol}**\n`;
              content += `   Strike: R$ ${strike.toFixed(2)}\n`;
              content += `   Preço: R$ ${price.toFixed(2)}\n`;
              content += `   Volume: ${optionMarket?.vol || 0}\n\n`;
            });
          });
      } else {
        content += 'Nenhuma opção encontrada para este ativo.';
      }

      return {
        type: 'success',
        content,
        data: { options: result.data, underlying: underlyingSymbol },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar cadeia de opções.',
      };
    }
  }

  // Fundamentalist companies ranking
  static async handleFundamentals(args: string[]): Promise<CommandResult> {
    const attribute = args[0] || 'pl';
    const validAttributes = [
      'pl',
      'roe',
      'roce',
      'dividend_yield',
      'debt_ratio',
      'current_ratio',
    ];

    if (!validAttributes.includes(attribute.toLowerCase())) {
      return {
        type: 'error',
        content: `Uso: /fundamentals [${validAttributes.join('|')}]\nExemplo: /fundamentals pl`,
      };
    }

    try {
      const response = await fetch(
        `/api/market/oplab?action=fundamentalist-companies&attribute=${attribute}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter ranking fundamentalista.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar ranking fundamentalista.',
        };
      }

      let content = `💼 **Ranking Fundamentalista - ${attribute.toUpperCase()}**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 10)
          .forEach((company: Record<string, unknown>, index: number) => {
            content += `${index + 1}. **${company.symbol || company.ticker}**\n`;
            content += `   Empresa: ${company.name || 'N/A'}\n`;
            content += `   ${attribute.toUpperCase()}: ${company[attribute] || 'N/A'}\n\n`;
          });
      } else {
        content += 'Dados não disponíveis no momento.';
      }

      return {
        type: 'success',
        content,
        data: { ranking: result.data, attribute },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar ranking fundamentalista.',
      };
    }
  }

  // OpLab Score ranking
  static async handleOplabScore(): Promise<CommandResult> {
    try {
      const response = await fetch(
        '/api/market/oplab?action=oplab-score-stocks'
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível obter ranking OpLab Score.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro ao consultar OpLab Score.',
        };
      }

      let content = `⭐ **Ranking OpLab Score**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 10)
          .forEach((stock: Record<string, unknown>, index: number) => {
            content += `${index + 1}. **${stock.symbol || stock.ticker}**\n`;
            content += `   Score: ${stock.score || 'N/A'}\n`;
            content += `   Preço: R$ ${stock.price ? (stock.price as number).toFixed(2) : 'N/A'}\n\n`;
          });
      } else {
        content += 'Dados não disponíveis no momento.';
      }

      return {
        type: 'success',
        content,
        data: { ranking: result.data },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao consultar OpLab Score.',
      };
    }
  }

  // Search instruments
  static async handleSearch(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        type: 'error',
        content: 'Uso: /search TERMO\nExemplo: /search PETR',
      };
    }

    try {
      const searchTerm = args.join(' ');

      const response = await fetch(
        `/api/market/oplab?action=search-instruments&expr=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) {
        return {
          type: 'error',
          content: 'Não foi possível realizar a busca.',
        };
      }

      const result = await response.json();
      if (!result.success) {
        return {
          type: 'error',
          content: result.error || 'Erro na busca de instrumentos.',
        };
      }

      let content = `🔍 **Resultados para: "${searchTerm}"**\n\n`;

      if (result.data && Array.isArray(result.data)) {
        result.data
          .slice(0, 10)
          .forEach((instrument: Record<string, unknown>) => {
            content += `• **${instrument.symbol}** - ${instrument.description}\n`;
            content += `  Tipo: ${instrument.type} | Bolsa: ${instrument.exchange}\n\n`;
          });

        if (result.data.length === 0) {
          content += 'Nenhum instrumento encontrado.';
        }
      } else {
        content += 'Nenhum resultado encontrado.';
      }

      return {
        type: 'success',
        content,
        data: { results: result.data, searchTerm },
      };
    } catch {
      return {
        type: 'error',
        content: 'Erro ao buscar instrumentos.',
      };
    }
  }

  // ==========================================
  // UTILITY COMMANDS
  // ==========================================

  // Show help
  static async handleHelp(): Promise<CommandResult> {
    return {
      type: 'info',
      content: `🤖 **Comandos Disponíveis - OpLab & Penny Wise**

**📈 Cotações & Análise:**
• \`/quote SYMBOL\` - Obter cotação atual (Alpha Vantage)
• \`/analyze SYMBOL\` - Análise técnica detalhada
• \`/current-quotes SYMBOL1 [SYMBOL2]\` - Cotações OpLab em tempo real
• \`/search TERMO\` - Buscar instrumentos

**📊 Status do Mercado:**
• \`/market-status\` - Status do mercado brasileiro (B3)
• \`/chart SYMBOL [resolution]\` - Dados históricos do gráfico

**🏢 Ações & Empresas:**
• \`/stocks\` - Lista todas as ações disponíveis
• \`/stocks-with-options\` - Ações que possuem opções
• \`/companies\` - Lista de empresas
• \`/company SYMBOL\` - Informações detalhadas da empresa

**🎯 Opções (OpLab):**
• \`/options SYMBOL\` - Cadeia de opções do ativo
• \`/covered-options SYMBOL\` - Opções para estratégias cobertas
• \`/black-scholes OPTION\` - Cálculo Black-Scholes
• \`/top-options [volume|profit|variation|trending]\` - Rankings de opções
• \`/ibov-correlation\` - Opções por correlação com IBOV

**💼 Análise Fundamentalista:**
• \`/fundamentals [pl|roe|roce|dividend_yield]\` - Ranking fundamentalista
• \`/oplab-score\` - Ranking OpLab Score

**🔧 Instrumentos:**
• \`/instruments\` - Lista todos os instrumentos
• \`/instrument SYMBOL\` - Detalhes de um instrumento específico

**⚙️ Utilitários:**
• \`/help\` - Mostrar esta ajuda
• \`/clear\` - Limpar conversa

**💡 Exemplos Práticos:**
\`\`\`
/market-status
/current-quotes PETR4 VALE3
/options PETR4
/fundamentals pl
/top-options volume
/company PETR4
/black-scholes PETR4C45
\`\`\`

**🚀 Recursos Avançados:**
• Detecção automática de mercado (BR/US)
• Integração completa com OpLab API
• Análises fundamentalistas em tempo real
• Rankings dinâmicos de opções
• Cálculos Black-Scholes automáticos

Digite qualquer comando para ver mais detalhes de uso.`,
    };
  }

  // Clear conversation
  static async handleClear(): Promise<CommandResult> {
    return {
      type: 'info',
      content:
        '🗑️ Para limpar a conversa, use o botão "Nova Conversa" na sidebar.',
      data: { action: 'clear_conversation' },
    };
  }
}

// Available commands registry
export const chatCommands: Record<string, ChatCommand> = {
  quote: {
    name: 'quote',
    description: 'Obter cotações atuais de ações',
    usage: '/quote SYMBOL1 [SYMBOL2 ...]',
    examples: ['/quote AAPL', '/quote AAPL MSFT GOOGL'],
    handler: CommandHandlers.handleQuote,
  },

  analyze: {
    name: 'analyze',
    description: 'Análise técnica detalhada de um ativo',
    usage: '/analyze SYMBOL [period]',
    examples: ['/analyze AAPL', '/analyze MSFT 1y'],
    handler: CommandHandlers.handleAnalyze,
  },

  search: {
    name: 'search',
    description: 'Buscar instrumentos financeiros',
    usage: '/search TERMO',
    examples: ['/search PETR', '/search Petrobras'],
    handler: CommandHandlers.handleSearch,
  },

  'market-status': {
    name: 'market-status',
    description: 'Verificar status do mercado brasileiro',
    usage: '/market-status',
    examples: ['/market-status'],
    handler: CommandHandlers.handleMarketStatus,
  },

  stocks: {
    name: 'stocks',
    description: 'Lista todas as ações disponíveis',
    usage: '/stocks',
    examples: ['/stocks'],
    handler: CommandHandlers.handleStocks,
  },

  'stocks-with-options': {
    name: 'stocks-with-options',
    description: 'Ações que possuem opções',
    usage: '/stocks-with-options',
    examples: ['/stocks-with-options'],
    handler: CommandHandlers.handleStocksWithOptions,
  },

  companies: {
    name: 'companies',
    description: 'Lista de empresas do mercado brasileiro',
    usage: '/companies',
    examples: ['/companies'],
    handler: CommandHandlers.handleCompanies,
  },

  company: {
    name: 'company',
    description: 'Informações detalhadas de uma empresa',
    usage: '/company SYMBOL',
    examples: ['/company PETR4', '/company VALE3'],
    handler: CommandHandlers.handleCompany,
  },

  'current-quotes': {
    name: 'current-quotes',
    description: 'Cotações atuais em tempo real (OpLab)',
    usage: '/current-quotes SYMBOL1 [SYMBOL2 ...]',
    examples: ['/current-quotes PETR4', '/current-quotes PETR4 VALE3'],
    handler: CommandHandlers.handleCurrentQuotes,
  },

  chart: {
    name: 'chart',
    description: 'Dados históricos do gráfico',
    usage: '/chart SYMBOL [resolution]',
    examples: ['/chart PETR4', '/chart PETR4 1D'],
    handler: CommandHandlers.handleChartData,
  },

  instruments: {
    name: 'instruments',
    description: 'Lista todos os instrumentos financeiros',
    usage: '/instruments',
    examples: ['/instruments'],
    handler: CommandHandlers.handleInstruments,
  },

  instrument: {
    name: 'instrument',
    description: 'Detalhes de um instrumento específico',
    usage: '/instrument SYMBOL',
    examples: ['/instrument PETR4', '/instrument IBOV'],
    handler: CommandHandlers.handleInstrument,
  },

  'top-options': {
    name: 'top-options',
    description: 'Rankings de opções por volume, lucro ou variação',
    usage: '/top-options [volume|profit|variation|trending]',
    examples: ['/top-options volume', '/top-options profit'],
    handler: CommandHandlers.handleTopOptions,
  },

  options: {
    name: 'options',
    description: 'Cadeia de opções de um ativo',
    usage: '/options UNDERLYING_SYMBOL',
    examples: ['/options PETR4', '/options VALE3'],
    handler: CommandHandlers.handleOptionsChain,
  },

  'covered-options': {
    name: 'covered-options',
    description: 'Opções para estratégias cobertas',
    usage: '/covered-options SYMBOL',
    examples: ['/covered-options PETR4', '/covered-options VALE3'],
    handler: CommandHandlers.handleCoveredOptions,
  },

  'black-scholes': {
    name: 'black-scholes',
    description: 'Cálculo Black-Scholes para opções',
    usage: '/black-scholes OPTION_SYMBOL',
    examples: ['/black-scholes PETR4C45', '/black-scholes VALE3P30'],
    handler: CommandHandlers.handleBlackScholes,
  },

  'ibov-correlation': {
    name: 'ibov-correlation',
    description: 'Opções ordenadas por correlação com IBOV',
    usage: '/ibov-correlation',
    examples: ['/ibov-correlation'],
    handler: CommandHandlers.handleIbovCorrelation,
  },

  fundamentals: {
    name: 'fundamentals',
    description: 'Ranking fundamentalista de empresas',
    usage:
      '/fundamentals [pl|roe|roce|dividend_yield|debt_ratio|current_ratio]',
    examples: ['/fundamentals pl', '/fundamentals roe'],
    handler: CommandHandlers.handleFundamentals,
  },

  'oplab-score': {
    name: 'oplab-score',
    description: 'Ranking OpLab Score de ações',
    usage: '/oplab-score',
    examples: ['/oplab-score'],
    handler: CommandHandlers.handleOplabScore,
  },

  help: {
    name: 'help',
    description: 'Mostrar comandos disponíveis',
    usage: '/help',
    examples: ['/help'],
    handler: CommandHandlers.handleHelp,
  },

  clear: {
    name: 'clear',
    description: 'Limpar conversa atual',
    usage: '/clear',
    examples: ['/clear'],
    handler: CommandHandlers.handleClear,
  },
};

// Execute a command
export async function executeCommand(
  message: string,
  userId?: string
): Promise<CommandResult | null> {
  const trimmedMessage = message.trim();

  if (!isCommand(trimmedMessage)) {
    return null;
  }

  // Parse command and arguments
  const parts = trimmedMessage.slice(1).split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Find and execute command
  const command = chatCommands[commandName];
  if (!command) {
    return {
      type: 'error',
      content: `Comando desconhecido: /${commandName}\nDigite /help para ver comandos disponíveis.`,
    };
  }

  try {
    return await command.handler(args, userId);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    return {
      type: 'error',
      content: `Erro ao executar comando /${commandName}. Tente novamente.`,
    };
  }
}

// Check if message is a command
export function isCommand(message: string): boolean {
  return message.trim().startsWith('/');
}

// Get command suggestions for autocomplete
export function getCommandSuggestions(partial: string): ChatCommand[] {
  const searchTerm = partial.toLowerCase().replace('/', '');
  return Object.values(chatCommands).filter(
    cmd =>
      cmd.name.toLowerCase().includes(searchTerm) ||
      cmd.description.toLowerCase().includes(searchTerm)
  );
}
