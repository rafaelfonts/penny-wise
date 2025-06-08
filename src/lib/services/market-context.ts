// ==========================================
// MARKET CONTEXT SERVICE - Day 6 Enhancement
// ==========================================

import marketDataService from './market-data';
import { StockQuote } from '@/lib/types/market';

export interface MarketContext {
  symbols: string[];
  prices: Record<string, number>;
  changes: Record<string, number>;
  changePercents: Record<string, number>;
  volume: Record<string, number>;
  lastUpdated: string;
  source: string;
}

export interface DetectedSymbol {
  symbol: string;
  context: string; // The surrounding text context
  confidence: number; // 0-1 confidence score
}

class MarketContextService {
  // Common Brazilian stock symbols and patterns
  private readonly BRAZILIAN_SYMBOLS = [
    'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'MGLU3', 'WEGE3', 'RENT3',
    'LREN3', 'SUZB3', 'JBSS3', 'HAPV3', 'RRRP3', 'GGBR4', 'CCRO3', 'CSAN3',
    'CSNA3', 'CYRE3', 'ELET3', 'ELET6', 'EMBR3', 'EGIE3', 'FLRY3', 'GGPS3',
    'GOAU4', 'GOLL4', 'HYPE3', 'KLBN11', 'KROT3', 'LWSA3', 'MRFG3', 'NTCO3',
    'PCAR3', 'PDGR3', 'POMO4', 'QUAL3', 'RADL3', 'RAIL3', 'SBSP3', 'SMTO3',
    'TIMS3', 'TOTS3', 'UGPA3', 'USIM5', 'VBBR3', 'VIVT3', 'YDUQ3'
  ];

  // US stock symbols patterns
  private readonly US_SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA',
    'BRKB', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'BAC', 'DIS', 'ADBE',
    'CRM', 'NFLX', 'KO', 'PEP', 'TMO', 'ABT', 'COST', 'AVGO', 'ACN', 'NKE',
    'WMT', 'MRK', 'LLY', 'DHR', 'VZ', 'ORCL', 'CVX', 'AMD', 'INTC', 'CSCO'
  ];

  // Regex patterns for symbol detection
  private readonly SYMBOL_PATTERNS = [
    // Brazilian stocks (4 chars + number)
    /\b([A-Z]{4}[0-9]{1,2})\b/g,
    // US stocks (2-5 chars)
    /\b([A-Z]{2,5})\b/g,
    // Dollar prefixed ($AAPL)
    /\$([A-Z]{2,5})\b/g,
    // Ticker: prefix
    /ticker:\s*([A-Z]{2,6}[0-9]*)/gi,
    // Stock command pattern
    /\/analyze\s+([A-Z]{2,6}[0-9]*)/gi,
    // Portuguese stock references
    /ação\s+([A-Z]{2,6}[0-9]*)/gi,
    /papel\s+([A-Z]{2,6}[0-9]*)/gi
  ];

  /**
   * Detect stock symbols in a text message
   */
  public detectSymbols(text: string): DetectedSymbol[] {
    const detected: Map<string, DetectedSymbol> = new Map();

    // Apply each pattern
    this.SYMBOL_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const symbol = match[1].toUpperCase();
                 const confidence = this.calculateConfidence(symbol, text);
        
        if (confidence > 0.3) { // Minimum confidence threshold
          const existing = detected.get(symbol);
          if (!existing || confidence > existing.confidence) {
            detected.set(symbol, {
              symbol,
              context: this.extractContext(text, match.index, symbol.length),
              confidence
            });
          }
        }
      }
    });

    return Array.from(detected.values()).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score for a detected symbol
   */
     private calculateConfidence(symbol: string, text: string): number {
    let confidence = 0.1; // Base confidence

    // Higher confidence for known symbols
    if (this.BRAZILIAN_SYMBOLS.includes(symbol)) {
      confidence += 0.6;
    } else if (this.US_SYMBOLS.includes(symbol)) {
      confidence += 0.5;
    }

    // Context-based confidence boosts
    const lowerText = text.toLowerCase();
    const contextWords = [
      'ação', 'papel', 'stock', 'ticker', 'cotação', 'preço', 'price',
      'comprar', 'vender', 'buy', 'sell', 'análise', 'analysis',
      'empresa', 'company', 'mercado', 'market', 'bolsa', 'exchange'
    ];

    contextWords.forEach(word => {
      if (lowerText.includes(word)) {
        confidence += 0.1;
      }
    });

    // Penalize very common English words
    const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'BUT'];
    if (commonWords.includes(symbol)) {
      confidence -= 0.4;
    }

    // Boost for proper formatting contexts
    if (text.includes(`$${symbol}`) || text.includes(`ticker: ${symbol}`)) {
      confidence += 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract surrounding context for a detected symbol
   */
  private extractContext(text: string, index: number, symbolLength: number): string {
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + symbolLength + 20);
    return text.substring(start, end).trim();
  }

  /**
   * Fetch market data for detected symbols
   */
  public async getMarketContext(symbols: string[]): Promise<MarketContext> {
    if (symbols.length === 0) {
      return {
        symbols: [],
        prices: {},
        changes: {},
        changePercents: {},
        volume: {},
        lastUpdated: new Date().toISOString(),
        source: 'none'
      };
    }

    try {
      // Fetch quotes for all symbols
      const response = await marketDataService.getMultipleQuotes(symbols);
      
      const context: MarketContext = {
        symbols: [],
        prices: {},
        changes: {},
        changePercents: {},
        volume: {},
        lastUpdated: new Date().toISOString(),
        source: response.source || 'unknown'
      };

      if (response.success && response.data) {
        response.data.forEach((quote: StockQuote) => {
          context.symbols.push(quote.symbol);
          context.prices[quote.symbol] = quote.price;
          context.changes[quote.symbol] = quote.change;
          context.changePercents[quote.symbol] = quote.changePercent;
          context.volume[quote.symbol] = quote.volume || 0;
        });
      }

      return context;
    } catch (error) {
      console.error('Error fetching market context:', error);
      return {
        symbols,
        prices: {},
        changes: {},
        changePercents: {},
        volume: {},
        lastUpdated: new Date().toISOString(),
        source: 'error'
      };
    }
  }

  /**
   * Process a chat message and return enhanced context
   */
  public async processMessage(message: string): Promise<{
    detectedSymbols: DetectedSymbol[];
    marketContext: MarketContext;
  }> {
    const detectedSymbols = this.detectSymbols(message);
    const symbols = detectedSymbols
      .filter(d => d.confidence > 0.5) // Only high-confidence symbols
      .map(d => d.symbol);

    const marketContext = await this.getMarketContext(symbols);

    return {
      detectedSymbols,
      marketContext
    };
  }

  /**
   * Format market context for AI prompt enhancement
   */
  public formatContextForPrompt(context: MarketContext): string {
    if (context.symbols.length === 0) {
      return '';
    }

    const marketInfo = context.symbols.map(symbol => {
      const price = context.prices[symbol];
      const change = context.changes[symbol];
      const changePercent = context.changePercents[symbol];
      
      if (!price) return null;

      const direction = change >= 0 ? '📈' : '📉';
      const changeText = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
      const percentText = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;

      return `${symbol}: $${price.toFixed(2)} ${direction} ${changeText} (${percentText})`;
    }).filter(Boolean);

    if (marketInfo.length === 0) return '';

    return `\n\n🏦 DADOS DE MERCADO ATUAIS:\n${marketInfo.join('\n')}\nÚltima atualização: ${new Date(context.lastUpdated).toLocaleTimeString('pt-BR')}`;
  }

  /**
   * Validate if a symbol is likely to be a real stock ticker
   */
  public validateSymbol(symbol: string): boolean {
    // Check if it's in our known symbols lists
    if (this.BRAZILIAN_SYMBOLS.includes(symbol) || this.US_SYMBOLS.includes(symbol)) {
      return true;
    }

    // Basic pattern validation
    const brazilianPattern = /^[A-Z]{4}[0-9]{1,2}$/;
    const usPattern = /^[A-Z]{2,5}$/;

    return brazilianPattern.test(symbol) || usPattern.test(symbol);
  }

  /**
   * Get suggestions for partial symbol matches
   */
  public getSymbolSuggestions(partial: string, limit: number = 5): string[] {
    const upperPartial = partial.toUpperCase();
    const suggestions: string[] = [];

    // Search Brazilian symbols first
    this.BRAZILIAN_SYMBOLS.forEach(symbol => {
      if (symbol.startsWith(upperPartial) && suggestions.length < limit) {
        suggestions.push(symbol);
      }
    });

    // Then search US symbols
    if (suggestions.length < limit) {
      this.US_SYMBOLS.forEach(symbol => {
        if (symbol.startsWith(upperPartial) && suggestions.length < limit) {
          suggestions.push(symbol);
        }
      });
    }

    return suggestions;
  }
}

// Export singleton instance
const marketContextService = new MarketContextService();
export default marketContextService; 