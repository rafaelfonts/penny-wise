// ==========================================
// INTELLIGENT MARKET SERVICE - Roteamento Inteligente de APIs
// ==========================================

import { classifySymbol, type MarketClassification } from './market-classifier';
import { getOplabService, createOplabService } from './oplab';
import type { SimpleQuote } from './simple-market';

export interface IntelligentQuote extends SimpleQuote {
  classification: MarketClassification;
  exchange: string;
  localCurrency: string;
}

export interface IntelligentAnalysis {
  symbol: string;
  quote: IntelligentQuote;
  analysis: {
    trend: 'ALTA' | 'BAIXA' | 'LATERAL' | 'INDEFINIDO';
    recommendation: 'COMPRA' | 'VENDA' | 'NEUTRO' | 'AGUARDAR';
    summary: string;
    confidence: number;
    technicalIndicators: {
      rsi?: string;
      support?: number;
      resistance?: number;
      volume?: string;
      volatility?: string;
    };
    fundamentals?: {
      pe?: number;
      dividend?: number;
      marketCap?: string;
    };
  };
  suggestions: string[];
  coverage: string;
}

class IntelligentMarketService {
  private oplabInitialized = false;

  /**
   * Inicializa o serviço OpLab se necessário
   */
  private async ensureOplabInitialized(): Promise<void> {
    if (this.oplabInitialized) return;

    try {
      // Tenta usar o serviço existente
      getOplabService();
      this.oplabInitialized = true;
    } catch {
      // Se não existe, cria um novo
      const accessToken = process.env.OPLAB_ACCESS_TOKEN;
      if (accessToken) {
        createOplabService({ accessToken });
        this.oplabInitialized = true;
      }
    }
  }

  /**
   * Get quote usando fallback inteligente
   */
  async getQuote(symbol: string): Promise<IntelligentQuote | null> {
    await this.ensureOplabInitialized();

    const classification = classifySymbol(symbol);

    try {
      // Tentar OpLab para símbolos brasileiros primeiro
      if (classification.region === 'BR') {
        try {
          return await this.getOplabQuote(symbol, classification);
        } catch (oplabError) {
          console.warn(
            `OpLab failed for ${symbol}, trying Alpha Vantage:`,
            oplabError
          );
          // Fallback para Alpha Vantage com símbolo .SA
          return await this.getAlphaVantageQuote(
            symbol + '.SA',
            classification
          );
        }
      }

      // Para símbolos americanos, usar Alpha Vantage
      return await this.getAlphaVantageQuote(symbol, classification);
    } catch (error) {
      console.error(`Error getting quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Busca cotação via OpLab (empresas brasileiras)
   */
  private async getOplabQuote(
    symbol: string,
    classification: MarketClassification
  ): Promise<IntelligentQuote | null> {
    await this.ensureOplabInitialized();

    if (!this.oplabInitialized) {
      throw new Error('OpLab not configured - missing OPLAB_ACCESS_TOKEN');
    }

    const oplab = getOplabService();
    const result = await oplab.getStock(symbol);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'OpLab API error');
    }

    const stock = result.data;

    // Converter dados OpLab para formato padrão
    const price = stock.market?.close || 0;
    const previousClose = stock.market?.previous_close || price;
    const change = price - previousClose;
    const changePercent =
      previousClose > 0 ? ((change / previousClose) * 100).toFixed(2) : '0';

    return {
      symbol: symbol.toUpperCase(),
      price,
      change,
      changePercent: `${changePercent}%`,
      volume: stock.market?.vol || 0,
      high: stock.market?.high || price,
      low: stock.market?.low || price,
      open: stock.market?.open || price,
      previousClose,
      timestamp: new Date().toISOString(),
      source: 'OpLab',
      classification,
      exchange: 'B3 - Bolsa do Brasil',
      localCurrency: 'BRL',
    };
  }

  /**
   * Busca cotação via Alpha Vantage (empresas americanas)
   */
  private async getAlphaVantageQuote(
    symbol: string,
    classification: MarketClassification
  ): Promise<IntelligentQuote | null> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Alpha Vantage not configured - missing ALPHA_VANTAGE_API_KEY'
      );
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PennyWise/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note']);
    }

    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      throw new Error('No data returned from Alpha Vantage');
    }

    const price = parseFloat(quote['05. price']) || 0;
    const change = parseFloat(quote['09. change']) || 0;
    const changePercent = quote['10. change percent'] || '0%';

    return {
      symbol: symbol.toUpperCase(),
      price,
      change,
      changePercent: changePercent.replace('%', '') + '%',
      volume: parseInt(quote['06. volume']) || 0,
      high: parseFloat(quote['03. high']) || price,
      low: parseFloat(quote['04. low']) || price,
      open: parseFloat(quote['02. open']) || price,
      previousClose: parseFloat(quote['08. previous close']) || price,
      timestamp: quote['07. latest trading day'] || new Date().toISOString(),
      source: 'Alpha Vantage',
      classification,
      exchange: classification.exchange,
      localCurrency: 'USD',
    };
  }

  /**
   * Análise completa com IA
   */
  async analyzeSymbol(symbol: string): Promise<string> {
    const classification = classifySymbol(symbol);
    const quote = await this.getQuote(symbol);

    if (!quote) {
      return this.buildErrorAnalysis(symbol, classification);
    }

    return this.buildIntelligentAnalysis(quote, classification);
  }

  /**
   * Constrói análise quando há erro
   */
  private buildErrorAnalysis(
    symbol: string,
    classification: MarketClassification
  ): string {
    const suggestions = [];

    if (classification.region === 'BR') {
      suggestions.push(
        '💡 Verifique se o símbolo está correto (ex: PETR4, VALE3)'
      );
      suggestions.push(
        '💡 Empresas brasileiras terminam com dígito (3=ON, 4=PN, 11=Units)'
      );
      suggestions.push('📱 Recomendo verificar em: B3.com.br ou TradingView');
      suggestions.push('⚠️  APIs de mercado temporariamente indisponíveis');
    } else if (classification.region === 'US') {
      suggestions.push(
        '💡 Verifique se o símbolo está correto (ex: AAPL, MSFT)'
      );
      suggestions.push('💡 Empresas americanas são 1-5 letras sem números');
      suggestions.push(
        '📱 Recomendo verificar em: Yahoo Finance ou Google Finance'
      );
    }

    return `❌ **${symbol.toUpperCase()}** - Dados temporariamente indisponíveis

**Detalhes:**
• **Mercado:** ${classification.region === 'BR' ? '🇧🇷 Brasil (B3)' : classification.region === 'US' ? '🇺🇸 Estados Unidos' : '🌍 Desconhecido'}
• **Status:** APIs de cotação temporariamente indisponíveis
• **Confiança:** ${Math.round(classification.confidence * 100)}%

**Alternativas recomendadas:**
${suggestions.map(s => s).join('\n')}

**💡 Comandos disponíveis:**
• Use \`/search ${symbol}\` para buscar símbolos similares
• Use \`/help\` para ver todos os comandos disponíveis

*Os dados de mercado serão restaurados em breve. Obrigado pela compreensão!*`;
  }

  /**
   * Constrói análise inteligente
   */
  private buildIntelligentAnalysis(
    quote: IntelligentQuote,
    classification: MarketClassification
  ): string {
    const isPositive = quote.change >= 0;
    const trend = this.determineTrend(quote);
    const recommendation = this.getRecommendation(quote);

    // Formatação monetária baseada na moeda
    const formatCurrency = (value: number) => {
      if (classification.region === 'BR') {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
      } else {
        return `$${value.toFixed(2)}`;
      }
    };

    const flag =
      classification.region === 'BR'
        ? '🇧🇷'
        : classification.region === 'US'
          ? '🇺🇸'
          : '🌍';

    return `${flag} **${quote.symbol}** está cotado a **${formatCurrency(quote.price)}** (${quote.changePercent}).

**📊 Análise Técnica:**
• **Tendência:** ${trend}
• **Recomendação:** ${recommendation}
• **Variação:** ${isPositive ? '+' : ''}${formatCurrency(quote.change)} (${quote.changePercent})
• **Volume:** ${quote.volume.toLocaleString()}
• **Máxima:** ${formatCurrency(quote.high)}
• **Mínima:** ${formatCurrency(quote.low)}
• **Abertura:** ${formatCurrency(quote.open)}

**📈 Indicadores:**
• **Volatilidade:** ${this.calculateVolatility(quote)}
• **Range do Dia:** ${formatCurrency(quote.low)} - ${formatCurrency(quote.high)}
• **Suporte/Resistência:** ${formatCurrency(quote.low)} / ${formatCurrency(quote.high)}

**🎯 Insights:**
${this.generateInsights(quote, classification)}

*Fonte: ${quote.source} | ${classification.exchange} | Confiança: ${Math.round(classification.confidence * 100)}%*`;
  }

  /**
   * Determina tendência baseada nos dados
   */
  private determineTrend(quote: IntelligentQuote): string {
    const changePercent = parseFloat(quote.changePercent.replace('%', ''));

    if (changePercent > 2) return '📈 ALTA FORTE';
    if (changePercent > 0.5) return '↗️ ALTA';
    if (changePercent > -0.5) return '➡️ LATERAL';
    if (changePercent > -2) return '↘️ BAIXA';
    return '📉 BAIXA FORTE';
  }

  /**
   * Gera recomendação baseada na análise
   */
  private getRecommendation(quote: IntelligentQuote): string {
    const changePercent = parseFloat(quote.changePercent.replace('%', ''));

    if (changePercent > 3) return '🔥 OPORTUNIDADE';
    if (changePercent > 1) return '✅ COMPRA';
    if (changePercent > -1) return '⚖️ NEUTRO';
    if (changePercent > -3) return '⚠️ CUIDADO';
    return '🛑 EVITAR';
  }

  /**
   * Calcula volatilidade simples
   */
  private calculateVolatility(quote: IntelligentQuote): string {
    const range = ((quote.high - quote.low) / quote.price) * 100;

    if (range > 5) return 'ALTA 🔴';
    if (range > 2) return 'MÉDIA 🟡';
    return 'BAIXA 🟢';
  }

  /**
   * Gera insights personalizados
   */
  private generateInsights(
    quote: IntelligentQuote,
    classification: MarketClassification
  ): string {
    const insights = [];
    const changePercent = parseFloat(quote.changePercent.replace('%', ''));

    if (classification.region === 'BR') {
      if (changePercent > 5) {
        insights.push(
          '🚀 Movimento forte para ação brasileira - acompanhe notícias setoriais'
        );
      }
      insights.push(
        '📰 Considere impacto do cenário político e econômico brasileiro'
      );
      if (quote.volume > 1000000) {
        insights.push(
          '📊 Volume elevado - interesse institucional significativo'
        );
      }
    } else if (classification.region === 'US') {
      if (changePercent > 3) {
        insights.push(
          '🇺🇸 Performance forte no mercado americano - verifique earnings'
        );
      }
      insights.push(
        '💰 Considere variação cambial USD/BRL para investidores brasileiros'
      );
      if (quote.volume > 10000000) {
        insights.push(
          '🔥 Volume muito alto - possível catalisador ou notícia relevante'
        );
      }
    }

    // Insights técnicos gerais
    const pricePosition = (quote.price - quote.low) / (quote.high - quote.low);
    if (pricePosition > 0.8) {
      insights.push('📈 Preço próximo da máxima do dia - possível resistência');
    } else if (pricePosition < 0.2) {
      insights.push('📉 Preço próximo da mínima do dia - possível suporte');
    }

    return insights.length > 0
      ? insights.map(i => `• ${i}`).join('\n')
      : '• Movimento dentro da normalidade para o ativo';
  }
}

// Singleton
export const intelligentMarket = new IntelligentMarketService();

// Helper functions
export const getIntelligentQuote = (symbol: string) =>
  intelligentMarket.getQuote(symbol);
export const analyzeIntelligentSymbol = (symbol: string) =>
  intelligentMarket.analyzeSymbol(symbol);
