// ==========================================
// SIMPLE MARKET SERVICE - Para comandos básicos sem auth
// ==========================================

export interface SimpleQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
  source: string;
}

export interface SimpleAnalysis {
  symbol: string;
  quote: SimpleQuote;
  analysis: {
    trend: 'ALTA' | 'BAIXA' | 'LATERAL';
    recommendation: 'COMPRA' | 'VENDA' | 'NEUTRO';
    summary: string;
    technicalIndicators: {
      rsi: string;
      support: number;
      resistance: number;
    };
  };
}

class SimpleMarketService {
  async getQuote(symbol: string): Promise<SimpleQuote | null> {
    try {
      const isServer = typeof window === 'undefined';
      const baseUrl = isServer
        ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        : '';

      const response = await fetch(
        `${baseUrl}/api/market/simple-quote?symbol=${symbol}`
      );

      if (!response.ok) {
        console.error('Failed to fetch quote:', response.status);
        return null;
      }

      const data = await response.json();

      if (!data.success) {
        console.error('Quote API returned error:', data.error);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  async analyzeSymbol(symbol: string): Promise<SimpleAnalysis | null> {
    try {
      const quote = await this.getQuote(symbol);

      if (!quote) {
        return null;
      }

      // Análise técnica básica
      const changePercent = parseFloat(quote.changePercent.replace('%', ''));

      let trend: 'ALTA' | 'BAIXA' | 'LATERAL' = 'LATERAL';
      let recommendation: 'COMPRA' | 'VENDA' | 'NEUTRO' = 'NEUTRO';

      if (changePercent > 2) {
        trend = 'ALTA';
        recommendation = 'COMPRA';
      } else if (changePercent < -2) {
        trend = 'BAIXA';
        recommendation = 'VENDA';
      }

      // RSI simulado (baseado na variação do dia)
      let rsiLevel = 'NEUTRO';
      if (changePercent > 5) rsiLevel = 'SOBRECOMPRADO';
      else if (changePercent < -5) rsiLevel = 'SOBREVENDIDO';

      // Suporte e resistência baseados em high/low
      const support = quote.low * 0.98; // 2% abaixo da mínima
      const resistance = quote.high * 1.02; // 2% acima da máxima

      const analysis: SimpleAnalysis = {
        symbol: quote.symbol,
        quote,
        analysis: {
          trend,
          recommendation,
          summary: this.generateSummary(quote, trend, recommendation),
          technicalIndicators: {
            rsi: rsiLevel,
            support: Math.round(support * 100) / 100,
            resistance: Math.round(resistance * 100) / 100,
          },
        },
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing symbol:', error);
      return null;
    }
  }

  private generateSummary(
    quote: SimpleQuote,
    trend: string,
    recommendation: string
  ): string {
    const changePercent = parseFloat(quote.changePercent.replace('%', ''));
    const priceFormatted = quote.price.toFixed(2);
    const changeFormatted = quote.change.toFixed(2);

    let emoji = '📊';
    if (changePercent > 0) emoji = '📈';
    else if (changePercent < 0) emoji = '📉';

    return `${emoji} **${quote.symbol}** está cotado a **R$ ${priceFormatted}** (${quote.changePercent}).

**Análise Técnica:**
• **Tendência:** ${trend}
• **Recomendação:** ${recommendation}
• **Variação:** ${quote.change >= 0 ? '+' : ''}R$ ${changeFormatted}
• **Volume:** ${quote.volume.toLocaleString('pt-BR')}
• **Máxima:** R$ ${quote.high.toFixed(2)}
• **Mínima:** R$ ${quote.low.toFixed(2)}

*Fonte: ${quote.source === 'alpha_vantage' ? 'Alpha Vantage' : quote.source === 'yahoo_finance' ? 'Yahoo Finance' : 'Dados simulados'}*`;
  }

  // Detectar comandos de análise
  isAnalyzeCommand(message: string): boolean {
    return (
      message.startsWith('/analyze') ||
      message.includes('analise') ||
      message.includes('análise')
    );
  }

  // Extrair símbolo do comando
  extractSymbol(message: string): string | null {
    // Extrair símbolo de comandos como "/analyze PETR4" ou "analise VALE3"
    const match = message.match(/(?:\/analyze|analise|análise)\s+([A-Z0-9]+)/i);
    return match ? match[1].toUpperCase() : null;
  }

  // Processar comando de análise
  async processAnalyzeCommand(message: string): Promise<string> {
    const symbol = this.extractSymbol(message);

    if (!symbol) {
      return '❌ **Erro**: Símbolo não encontrado. Use `/analyze SÍMBOLO` (ex: `/analyze PETR4`)';
    }

    try {
      const analysis = await this.analyzeSymbol(symbol);

      if (!analysis) {
        return `❌ **Erro**: Não foi possível obter dados para **${symbol}**. Verifique se o símbolo está correto.`;
      }

      return analysis.analysis.summary;
    } catch (error) {
      console.error('Error processing analyze command:', error);
      return `❌ **Erro**: Falha ao analisar **${symbol}**. Tente novamente em alguns instantes.`;
    }
  }
}

export const simpleMarketService = new SimpleMarketService();
export default simpleMarketService;
