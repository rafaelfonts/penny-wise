// ==========================================
// CHAT MARKET INTEGRATION SERVICE - Penny Wise
// ==========================================

import marketDataService from './market-data';
import {
  StockQuote,
  CompanyOverview,
  NewsItem,
  TechnicalIndicator,
  SearchResult
} from '@/lib/types/market';

interface ChatCommand {
  command: 'analyze' | 'compare' | 'portfolio' | 'alert' | 'search' | 'news' | 'help';
  symbols?: string[];
  parameters?: Record<string, string | number>;
}

interface ChatMarketResponse {
  response: string;
  data?: {
    quote?: StockQuote | null;
    overview?: CompanyOverview | null;
    news?: NewsItem[] | null;
    technicals?: {
      rsi: TechnicalIndicator | null;
      macd: TechnicalIndicator | null;
    };
    quotes?: StockQuote[];
    results?: SearchResult[];
  };
  charts?: Record<string, unknown>[];
  followUp?: string[];
  metadata: {
    command?: string;
    symbols?: string[];
    parameters?: Record<string, string | number>;
    model: string;
    tokens: number;
    processing_time: number;
  };
}

class ChatMarketIntegrationService {
  
  // ==========================================
  // COMMAND PARSING
  // ==========================================

  parseCommand(message: string): ChatCommand | null {
    const text = message.trim().toLowerCase();

    // Comando /analyze [SYMBOL]
    if (text.startsWith('/analyze') || text.includes('analise') || text.includes('análise')) {
      const symbols = this.extractSymbols(message);
      return {
        command: 'analyze',
        symbols: symbols.length > 0 ? symbols : undefined
      };
    }

    // Comando /compare [SYMBOL1] [SYMBOL2]
    if (text.startsWith('/compare') || text.includes('compar') || text.includes('versus') || text.includes('vs')) {
      const symbols = this.extractSymbols(message);
      return {
        command: 'compare',
        symbols: symbols.length >= 2 ? symbols.slice(0, 2) : symbols
      };
    }

    // Comando /portfolio
    if (text.startsWith('/portfolio') || text.includes('carteira') || text.includes('portfólio')) {
      return {
        command: 'portfolio'
      };
    }

    // Comando /alert [SYMBOL] [PRICE]
    if (text.startsWith('/alert') || text.includes('alerta') || text.includes('avisar')) {
      const symbols = this.extractSymbols(message);
      const prices = this.extractNumbers(message);
      return {
        command: 'alert',
        symbols: symbols.length > 0 ? symbols : undefined,
        parameters: prices.length > 0 ? { price: prices[0] } : undefined
      };
    }

    // Comando /search [TERM]
    if (text.startsWith('/search') || text.includes('buscar') || text.includes('procurar')) {
      const searchTerm = message.replace(/\/(search|buscar|procurar)/i, '').trim();
      return {
        command: 'search',
        parameters: { term: searchTerm }
      };
    }

    // Comando /news [SYMBOL]
    if (text.startsWith('/news') || text.includes('notícias') || text.includes('noticias')) {
      const symbols = this.extractSymbols(message);
      return {
        command: 'news',
        symbols: symbols.length > 0 ? symbols : undefined
      };
    }

    // Comando /help
    if (text.startsWith('/help') || text.includes('ajuda') || text.includes('comandos')) {
      return {
        command: 'help'
      };
    }

    // Se contém símbolos de ações, assumir análise
    const symbols = this.extractSymbols(message);
    if (symbols.length > 0) {
      if (symbols.length >= 2 && (text.includes('compar') || text.includes('versus'))) {
        return {
          command: 'compare',
          symbols: symbols.slice(0, 2)
        };
      }
      return {
        command: 'analyze',
        symbols: symbols.slice(0, 1)
      };
    }

    return null;
  }

  private extractSymbols(text: string): string[] {
    // Regex para capturar símbolos de ações (ex: PETR4, VALE3, AAPL, GOOGL)
    const symbolRegex = /\b([A-Z]{3,5}\d{0,2}\.?[A-Z]{0,2})\b/g;
    const matches = text.match(symbolRegex) || [];
    return matches.map(symbol => symbol.toUpperCase());
  }

  private extractNumbers(text: string): number[] {
    const numberRegex = /\b(\d+\.?\d*)\b/g;
    const matches = text.match(numberRegex) || [];
    return matches.map(num => parseFloat(num));
  }

  // ==========================================
  // COMMAND HANDLERS
  // ==========================================

  async handleAnalyzeCommand(symbols: string[]): Promise<ChatMarketResponse> {
    if (!symbols || symbols.length === 0) {
      return {
        response: `❌ **Símbolo não especificado**

Por favor, forneça um símbolo para análise. Exemplos:
- \`/analyze PETR4\`
- \`/analyze AAPL\`
- Analise a VALE3\``,
        metadata: {
          command: 'analyze',
          model: 'chat-market-integration',
          tokens: 45,
          processing_time: 100
        }
      };
    }

    const symbol = symbols[0];
    const startTime = Date.now();

    try {
      const analysis = await marketDataService.analyzeSymbol(symbol);
      
      if (!analysis.quote) {
        return {
          response: `❌ **Símbolo não encontrado: ${symbol}**

Verifique se o símbolo está correto ou tente:
- \`/search ${symbol}\` para buscar símbolos similares`,
          metadata: {
            command: 'analyze',
            symbols: [symbol],
            model: 'chat-market-integration',
            tokens: 30,
            processing_time: Date.now() - startTime
          }
        };
      }

      return this.formatAnalysisResponse(analysis, symbol, startTime);

    } catch (error) {
      return {
        response: `❌ **Erro na análise de ${symbol}**

${error instanceof Error ? error.message : 'Erro desconhecido'}

Tente novamente em alguns momentos.`,
        metadata: {
          command: 'analyze',
          symbols: [symbol],
          model: 'chat-market-integration',
          tokens: 25,
          processing_time: Date.now() - startTime
        }
      };
    }
  }

  async handleCompareCommand(symbols: string[]): Promise<ChatMarketResponse> {
    if (!symbols || symbols.length < 2) {
      return {
        response: `❌ **Símbolos insuficientes para comparação**

Forneça dois símbolos para comparar. Exemplos:
- \`/compare PETR4 VALE3\`
- \`/compare AAPL GOOGL\`
- \`Compare ITUB4 com BBDC4\``,
        metadata: {
          command: 'compare',
          model: 'chat-market-integration',
          tokens: 45,
          processing_time: 100
        }
      };
    }

    const [symbol1, symbol2] = symbols;
    const startTime = Date.now();

    try {
      const comparison = await marketDataService.compareSymbols([symbol1, symbol2]);
      
      if (comparison.quotes.length < 2) {
        return {
          response: `❌ **Não foi possível obter dados para comparação**

Símbolos verificados: ${symbol1}, ${symbol2}
- Verifique se os símbolos estão corretos
- Tente usar \`/search\` para encontrar símbolos válidos`,
          metadata: {
            command: 'compare',
            symbols: [symbol1, symbol2],
            model: 'chat-market-integration',
            tokens: 35,
            processing_time: Date.now() - startTime
          }
        };
      }

      return this.formatComparisonResponse(comparison.quotes, startTime);

    } catch (error) {
      return {
        response: `❌ **Erro na comparação**

${error instanceof Error ? error.message : 'Erro desconhecido'}

Tente novamente em alguns momentos.`,
        metadata: {
          command: 'compare',
          symbols: [symbol1, symbol2],
          model: 'chat-market-integration',
          tokens: 25,
          processing_time: Date.now() - startTime
        }
      };
    }
  }

  async handleNewsCommand(symbols?: string[]): Promise<ChatMarketResponse> {
    const startTime = Date.now();

    try {
      const newsResponse = await marketDataService.getNewsAndSentiment(symbols, undefined, 10);
      
      if (!newsResponse.success || !newsResponse.data || newsResponse.data.length === 0) {
        return {
          response: `❌ **Nenhuma notícia encontrada**

${symbols ? `Para os símbolos: ${symbols.join(', ')}` : 'Para as notícias gerais do mercado'}

Tente novamente mais tarde.`,
          metadata: {
            command: 'news',
            symbols,
            model: 'chat-market-integration',
            tokens: 30,
            processing_time: Date.now() - startTime
          }
        };
      }

      return this.formatNewsResponse(newsResponse.data, symbols, startTime);

    } catch (error) {
      return {
        response: `❌ **Erro ao buscar notícias**

${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        metadata: {
          command: 'news',
          symbols,
          model: 'chat-market-integration',
          tokens: 20,
          processing_time: Date.now() - startTime
        }
      };
    }
  }

  async handleSearchCommand(term: string): Promise<ChatMarketResponse> {
    if (!term || term.length < 2) {
      return {
        response: `❌ **Termo de busca muito curto**

Exemplo: \`/search petrobras\``,
        metadata: {
          command: 'search',
          model: 'chat-market-integration',
          tokens: 15,
          processing_time: 100
        }
      };
    }

    const startTime = Date.now();

    try {
      const searchResponse = await marketDataService.searchSymbol(term);
      
      if (!searchResponse.success || !searchResponse.data || searchResponse.data.length === 0) {
        return {
          response: `❌ **Nenhum resultado encontrado para "${term}"**

Tente termos mais específicos ou símbolos conhecidos.`,
          metadata: {
            command: 'search',
            parameters: { term },
            model: 'chat-market-integration',
            tokens: 25,
            processing_time: Date.now() - startTime
          }
        };
      }

      return this.formatSearchResponse(searchResponse.data, term, startTime);

    } catch (error) {
      return {
        response: `❌ **Erro na busca por "${term}"**

${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        metadata: {
          command: 'search',
          parameters: { term },
          model: 'chat-market-integration',
          tokens: 20,
          processing_time: Date.now() - startTime
        }
      };
    }
  }

  handleHelpCommand(): ChatMarketResponse {
    return {
      response: `## 🤖 **Comandos Disponíveis - Penny Wise**

### **📊 Análise de Mercado:**
- \`/analyze [TICKER]\` - Análise completa de um ativo
- \`/compare [TICKER1] [TICKER2]\` - Comparar dois ativos
- \`/news [TICKER]\` - Notícias e sentimento

### **🔍 Busca e Descoberta:**
- \`/search [TERMO]\` - Buscar símbolos de ações
- \`/portfolio\` - Visualizar sua carteira

### **🚨 Alertas:**
- \`/alert [TICKER] [PREÇO]\` - Criar alerta de preço

### **💡 Exemplos Práticos:**
\`\`\`
/analyze PETR4
/compare VALE3 ITUB4
/news AAPL
/search petrobras
/alert PETR4 25.50
\`\`\`

### **🗣️ Linguagem Natural:**
Você também pode fazer perguntas diretas:
- "Como está a Petrobras hoje?"
- "Compare VALE3 com CSNA3"
- "Notícias sobre tecnologia"

**Dica**: Digite qualquer símbolo de ação que eu analiso automaticamente!`,
      followUp: [
        'Analisar um ativo específico',
        'Comparar duas ações',
        'Ver notícias do mercado',
        'Buscar símbolo'
      ],
      metadata: {
        command: 'help',
        model: 'chat-market-integration',
        tokens: 280,
        processing_time: 150
      }
    };
  }

  // ==========================================
  // RESPONSE FORMATTERS
  // ==========================================

  private formatAnalysisResponse(
    analysis: { quote: StockQuote | null; overview: CompanyOverview | null; news: NewsItem[] | null; technicals: { rsi: TechnicalIndicator | null; macd: TechnicalIndicator | null } },
    symbol: string,
    startTime: number
  ): ChatMarketResponse {
    const { quote, overview, news, technicals } = analysis;
    
    if (!quote) {
      return {
        response: `❌ Não foi possível obter dados para ${symbol}`,
        metadata: {
          command: 'analyze',
          symbols: [symbol],
          model: 'chat-market-integration',
          tokens: 15,
          processing_time: Date.now() - startTime
        }
      };
    }

    const changeDirection = quote.change >= 0 ? '📈' : '📉';
    const changeColor = quote.change >= 0 ? '+' : '';
    
    let response = `## ${changeDirection} **${quote.symbol} - ${quote.name}**

### 💰 **Cotação Atual:**
- **Preço**: $${quote.price.toFixed(2)}
- **Variação**: ${changeColor}${quote.change.toFixed(2)} (${changeColor}${quote.changePercent.toFixed(2)}%)
- **Volume**: ${quote.volume.toLocaleString()}
- **Abertura**: $${quote.open.toFixed(2)}
- **Máxima**: $${quote.high.toFixed(2)}
- **Mínima**: $${quote.low.toFixed(2)}

`;

    // Informações fundamentais
    if (overview) {
      response += `### 🏢 **Informações Fundamentais:**
- **Setor**: ${overview.sector}
- **P/L**: ${overview.peRatio?.toFixed(2) || 'N/A'}
- **ROE**: ${overview.returnOnEquityTTM ? (overview.returnOnEquityTTM * 100).toFixed(2) + '%' : 'N/A'}
- **Dividend Yield**: ${overview.dividendYield ? (overview.dividendYield * 100).toFixed(2) + '%' : 'N/A'}

`;
    }

    // Indicadores técnicos
    if (technicals.rsi || technicals.macd) {
      response += `### 📊 **Indicadores Técnicos:**
`;
      
      if (technicals.rsi && technicals.rsi.data.length > 0) {
        const rsiValue = technicals.rsi.data[0].value;
        const rsiSignal = rsiValue > 70 ? 'Sobrecompra 🔴' : rsiValue < 30 ? 'Sobrevenda 🟢' : 'Neutro 🟡';
        response += `- **RSI**: ${rsiValue.toFixed(1)} (${rsiSignal})
`;
      }
      
      if (technicals.macd && technicals.macd.data.length > 0) {
        const macdValue = technicals.macd.data[0].value;
        const macdSignal = macdValue > 0 ? 'Bullish 🟢' : 'Bearish 🔴';
        response += `- **MACD**: ${macdValue.toFixed(4)} (${macdSignal})
`;
      }
      response += '\n';
    }

    // Sentimento das notícias
    if (news && news.length > 0) {
      const sentimentCounts = news.reduce((acc, item) => {
        acc[item.overallSentimentLabel] = (acc[item.overallSentimentLabel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      response += `### 📰 **Sentimento das Notícias (${news.length} artigos):**
`;
      
      Object.entries(sentimentCounts).forEach(([sentiment, count]) => {
        const emoji = sentiment.includes('Bullish') ? '🟢' : sentiment.includes('Bearish') ? '🔴' : '🟡';
        response += `- ${emoji} **${sentiment}**: ${count} artigos
`;
      });
      response += '\n';
    }

    response += `### 🎯 **Próximos Passos:**
- Use \`/news ${symbol}\` para ver notícias detalhadas
- Use \`/compare ${symbol} [OUTRO]\` para comparações
- Configure alertas com \`/alert ${symbol} [PREÇO]\`

*Fonte: ${quote.source} • Atualizado em ${new Date(quote.timestamp).toLocaleString('pt-BR')}*`;

    return {
      response,
      data: analysis,
      followUp: [
        `Ver notícias sobre ${symbol}`,
        `Comparar ${symbol} com outro ativo`,
        `Criar alerta para ${symbol}`
      ],
      metadata: {
        command: 'analyze',
        symbols: [symbol],
        model: 'chat-market-integration',
        tokens: response.length / 4, // Estimativa
        processing_time: Date.now() - startTime
      }
    };
  }

  private formatComparisonResponse(quotes: StockQuote[], startTime: number): ChatMarketResponse {
    if (quotes.length < 2) {
      return {
        response: '❌ Dados insuficientes para comparação',
        metadata: {
          command: 'compare',
          model: 'chat-market-integration',
          tokens: 10,
          processing_time: Date.now() - startTime
        }
      };
    }

    const [quote1, quote2] = quotes;
    
    const response = `## ⚖️ **Comparação: ${quote1.symbol} vs ${quote2.symbol}**

| **Métrica** | **${quote1.symbol}** | **${quote2.symbol}** | **Vencedor** |
|-------------|---------------------|---------------------|--------------|
| **Preço** | $${quote1.price.toFixed(2)} | $${quote2.price.toFixed(2)} | ${quote1.price > quote2.price ? quote1.symbol : quote2.symbol} |
| **Variação %** | ${quote1.changePercent.toFixed(2)}% | ${quote2.changePercent.toFixed(2)}% | ${quote1.changePercent > quote2.changePercent ? quote1.symbol : quote2.symbol} |
| **Volume** | ${quote1.volume.toLocaleString()} | ${quote2.volume.toLocaleString()} | ${quote1.volume > quote2.volume ? quote1.symbol : quote2.symbol} |
| **Market Cap** | ${quote1.marketCap ? '$' + (quote1.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'} | ${quote2.marketCap ? '$' + (quote2.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'} | ${(quote1.marketCap || 0) > (quote2.marketCap || 0) ? quote1.symbol : quote2.symbol} |

### 📊 **Análise Comparativa:**

**${quote1.symbol}:**
${quote1.changePercent >= 0 ? '📈' : '📉'} ${quote1.changePercent >= 0 ? 'Em alta' : 'Em baixa'} de ${Math.abs(quote1.changePercent).toFixed(2)}%

**${quote2.symbol}:**
${quote2.changePercent >= 0 ? '📈' : '📉'} ${quote2.changePercent >= 0 ? 'Em alta' : 'Em baixa'} de ${Math.abs(quote2.changePercent).toFixed(2)}%

### 🎯 **Conclusão:**
${quote1.changePercent > quote2.changePercent 
  ? `**${quote1.symbol}** está performando melhor hoje`
  : `**${quote2.symbol}** está performando melhor hoje`
}

*Para análise mais detalhada, use:*
- \`/analyze ${quote1.symbol}\`
- \`/analyze ${quote2.symbol}\``;

    return {
      response,
      data: { quotes },
      followUp: [
        `Analisar ${quote1.symbol} detalhadamente`,
        `Analisar ${quote2.symbol} detalhadamente`,
        'Comparar com outros ativos'
      ],
      metadata: {
        command: 'compare',
        symbols: [quote1.symbol, quote2.symbol],
        model: 'chat-market-integration',
        tokens: response.length / 4,
        processing_time: Date.now() - startTime
      }
    };
  }

  private formatNewsResponse(news: NewsItem[], symbols: string[] | undefined, startTime: number): ChatMarketResponse {
    let response = `## 📰 **Notícias do Mercado${symbols ? ` - ${symbols.join(', ')}` : ''}**

`;

    news.slice(0, 5).forEach((item, index) => {
      const sentimentEmoji = item.overallSentimentLabel.includes('Bullish') ? '🟢' : 
                            item.overallSentimentLabel.includes('Bearish') ? '🔴' : '🟡';
      
      response += `### ${index + 1}. ${sentimentEmoji} ${item.title}

**Fonte:** ${item.source} • **Sentimento:** ${item.overallSentimentLabel}
**Resumo:** ${item.summary.substring(0, 200)}...

---

`;
    });

    response += `*Mostrando ${Math.min(5, news.length)} de ${news.length} notícias disponíveis*`;

    return {
      response,
      data: { news },
      followUp: [
        'Ver mais notícias',
        'Analisar sentimento detalhado',
        'Buscar notícias específicas'
      ],
      metadata: {
        command: 'news',
        symbols,
        model: 'chat-market-integration',
        tokens: response.length / 4,
        processing_time: Date.now() - startTime
      }
    };
  }

  private formatSearchResponse(results: SearchResult[], term: string, startTime: number): ChatMarketResponse {
    let response = `## 🔍 **Resultados da Busca: "${term}"**

`;

    results.slice(0, 10).forEach((result, index) => {
      response += `### ${index + 1}. **${result.symbol}** - ${result.name}
- **Tipo:** ${result.type}
- **Região:** ${result.region}
- **Moeda:** ${result.currency}
- **Match:** ${(result.matchScore * 100).toFixed(1)}%

`;
    });

    response += `*Para analisar um destes ativos, use:* \`/analyze [SÍMBOLO]\``;

    return {
      response,
      data: { results },
      followUp: results.slice(0, 3).map(r => `Analisar ${r.symbol}`),
      metadata: {
        command: 'search',
        parameters: { term },
        model: 'chat-market-integration',
        tokens: response.length / 4,
        processing_time: Date.now() - startTime
      }
    };
  }

  // ==========================================
  // MAIN PROCESSING METHOD
  // ==========================================

  async processMessage(message: string): Promise<ChatMarketResponse> {
    const command = this.parseCommand(message);

    if (!command) {
      // Resposta genérica para mensagens não relacionadas ao mercado
      return {
        response: `Como assistente especializado em análise financeira, posso ajudar com:

🔍 **Análise de Ativos** - Digite um símbolo como PETR4, VALE3, AAPL
📊 **Comparações** - "Compare ITUB4 com BBDC4"
📰 **Notícias** - "Notícias sobre AAPL"
🔍 **Busca** - "Buscar Petrobras"

Digite \`/help\` para ver todos os comandos disponíveis.

**Sua pergunta:** "${message}"
*Posso reformular isso em termos de análise de mercado?*`,
        followUp: [
          'Ver comandos disponíveis (/help)',
          'Analisar um ativo específico',
          'Buscar símbolos'
        ],
        metadata: {
          model: 'chat-market-integration',
          tokens: 75,
          processing_time: 100
        }
      };
    }

    switch (command.command) {
      case 'analyze':
        return await this.handleAnalyzeCommand(command.symbols || []);
        
      case 'compare':
        return await this.handleCompareCommand(command.symbols || []);
        
      case 'news':
        return await this.handleNewsCommand(command.symbols);
        
      case 'search':
        return await this.handleSearchCommand(command.parameters?.term as string || '');
        
      case 'help':
        return this.handleHelpCommand();
        
      case 'portfolio':
        return {
          response: `## 📈 **Portfolio**

Esta funcionalidade será implementada em breve!

Por enquanto você pode:
- Analisar ativos individuais com \`/analyze [TICKER]\`
- Comparar investimentos com \`/compare [TICKER1] [TICKER2]\`
- Ver notícias do mercado com \`/news\``,
          metadata: {
            command: 'portfolio',
            model: 'chat-market-integration',
            tokens: 45,
            processing_time: 100
          }
        };
        
      case 'alert':
        return {
          response: `## 🚨 **Alertas de Preço**

Esta funcionalidade será implementada em breve!

${command.symbols && command.parameters?.price 
  ? `Você quer criar um alerta para **${command.symbols[0]}** ao atingir **$${command.parameters.price}**.`
  : 'Formato: `/alert TICKER PREÇO`'
}

Por enquanto, monitore manualmente com \`/analyze [TICKER]\``,
          metadata: {
            command: 'alert',
            symbols: command.symbols,
            parameters: command.parameters,
            model: 'chat-market-integration',
            tokens: 40,
            processing_time: 100
          }
        };
        
      default:
        return this.handleHelpCommand();
    }
  }
}

// Singleton instance
export const chatMarketIntegrationService = new ChatMarketIntegrationService();
export default chatMarketIntegrationService; 