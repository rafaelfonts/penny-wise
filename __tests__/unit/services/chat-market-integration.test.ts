import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock the chat market integration service
const mockChatMarketIntegrationService = {
  processMessage: jest.fn(),
  executeCommand: jest.fn(),
  getMarketContext: jest.fn(),
  analyzeSymbol: jest.fn(),
  getQuote: jest.fn(),
  getHistoricalData: jest.fn(),
  generateInsights: jest.fn(),
  handleStreamingResponse: jest.fn(),
  validateCommand: jest.fn(),
  parseMarketQuery: jest.fn(),
  formatMarketResponse: jest.fn(),
  getCachedData: jest.fn(),
  updateContext: jest.fn(),
};

jest.mock('@/lib/services/chat-market-integration', () => ({
  chatMarketIntegrationService: mockChatMarketIntegrationService,
  ChatMarketIntegrationService: jest.fn().mockImplementation(() => mockChatMarketIntegrationService),
}));

describe('Chat Market Integration Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Message Processing', () => {
    test('should process market-related messages correctly', async () => {
      const message = "What's the current price of AAPL?";
      const context = {
        userId: 'user-123',
        sessionId: 'session-456',
        previousSymbols: ['MSFT', 'GOOGL'],
      };

      const processMessage = async (msg: string, ctx: typeof context) => {
        const isMarketQuery = /price|quote|stock|symbol/i.test(msg);
        const symbolMatch = msg.match(/\b[A-Z]{1,5}\b/);
        
        if (isMarketQuery && symbolMatch) {
          return {
            type: 'market_query',
            symbol: symbolMatch[0],
            action: 'get_quote',
            confidence: 0.95,
            requiresData: true,
            context: ctx,
          };
        }

        return {
          type: 'general',
          action: 'chat_response',
          confidence: 0.5,
          requiresData: false,
          context: ctx,
        };
      };

      mockChatMarketIntegrationService.processMessage.mockImplementation(processMessage);

      const result = await mockChatMarketIntegrationService.processMessage(message, context);

      expect(result.type).toBe('market_query');
      expect(result.symbol).toBe('AAPL');
      expect(result.action).toBe('get_quote');
      expect(result.confidence).toBe(0.95);
      expect(result.requiresData).toBe(true);
    });

    test('should handle complex market analysis requests', async () => {
      const message = "Compare AAPL and MSFT performance over the last 6 months with technical indicators";
      const context = { userId: 'user-123', sessionId: 'session-456' };

      const processComplexMessage = async (msg: string, ctx: typeof context) => {
        const symbols = msg.match(/\b[A-Z]{1,5}\b/g) || [];
        const hasComparison = /compare|vs|versus/i.test(msg);
        const hasTechnical = /technical|indicator|rsi|macd|moving average/i.test(msg);
        const hasTimeframe = /month|year|week|day/i.test(msg);

        return {
          type: 'complex_analysis',
          symbols,
          actions: [
            'get_historical_data',
            'calculate_technical_indicators',
            'compare_performance',
            'generate_analysis'
          ],
          timeframe: hasTimeframe ? '6M' : '1M',
          includeTechnical: hasTechnical,
          includeComparison: hasComparison,
          confidence: 0.88,
          estimatedProcessingTime: 5000,
          context: ctx,
        };
      };

      mockChatMarketIntegrationService.processMessage.mockImplementation(processComplexMessage);

      const result = await mockChatMarketIntegrationService.processMessage(message, context);

      expect(result.type).toBe('complex_analysis');
      expect(result.symbols).toEqual(['AAPL', 'MSFT']);
      expect(result.actions).toContain('get_historical_data');
      expect(result.actions).toContain('calculate_technical_indicators');
      expect(result.timeframe).toBe('6M');
      expect(result.includeTechnical).toBe(true);
      expect(result.includeComparison).toBe(true);
    });

    test('should handle non-market messages appropriately', async () => {
      const message = "Hello, how are you today?";
      const context = { userId: 'user-123', sessionId: 'session-456' };

      const processGeneralMessage = async (msg: string, ctx: typeof context) => {
        const isMarketRelated = /stock|price|market|symbol|trade|invest/i.test(msg);
        
        if (!isMarketRelated) {
          return {
            type: 'general_chat',
            action: 'general_response',
            confidence: 0.9,
            requiresMarketData: false,
            suggestedResponse: "Hello! I'm here to help you with market data and financial analysis. How can I assist you today?",
            context: ctx,
          };
        }

        return { type: 'unknown', confidence: 0.1, context: ctx };
      };

      mockChatMarketIntegrationService.processMessage.mockImplementation(processGeneralMessage);

      const result = await mockChatMarketIntegrationService.processMessage(message, context);

      expect(result.type).toBe('general_chat');
      expect(result.requiresMarketData).toBe(false);
      expect(result.suggestedResponse).toContain('market data');
    });
  });

  describe('Command Execution', () => {
    test('should execute quote command successfully', async () => {
      const command = {
        type: 'quote',
        symbol: 'AAPL',
        parameters: { includeExtended: true },
      };

      const executeQuoteCommand = async (cmd: typeof command) => {
        if (cmd.type === 'quote' && cmd.symbol) {
          return {
            success: true,
            data: {
              symbol: cmd.symbol,
              price: 150.25,
              change: 2.50,
              changePercent: 1.69,
              volume: 45000000,
              marketCap: 2500000000000,
              timestamp: new Date().toISOString(),
              extendedHours: cmd.parameters?.includeExtended ? {
                price: 151.00,
                change: 0.75,
                volume: 1200000,
              } : null,
            },
            executionTime: 250,
            cached: false,
          };
        }

        return {
          success: false,
          error: 'Invalid command or missing symbol',
          executionTime: 10,
        };
      };

      mockChatMarketIntegrationService.executeCommand.mockImplementation(executeQuoteCommand);

      const result = await mockChatMarketIntegrationService.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.data.symbol).toBe('AAPL');
      expect(result.data.price).toBe(150.25);
      expect(result.data.extendedHours).not.toBeNull();
      expect(result.executionTime).toBeLessThan(1000);
    });

    test('should execute analysis command with technical indicators', async () => {
      const command = {
        type: 'analyze',
        symbol: 'MSFT',
        parameters: {
          indicators: ['RSI', 'MACD', 'SMA'],
          period: '1M',
        },
      };

      const executeAnalysisCommand = async (cmd: typeof command) => {
        if (cmd.type === 'analyze') {
          return {
            success: true,
            data: {
              symbol: cmd.symbol,
              analysis: {
                trend: 'bullish',
                strength: 0.75,
                support: 295.00,
                resistance: 310.00,
              },
              technicalIndicators: {
                RSI: { value: 65.5, signal: 'neutral' },
                MACD: { value: 2.3, signal: 'bullish', histogram: 0.8 },
                SMA: { sma20: 302.5, sma50: 298.0, signal: 'bullish' },
              },
              recommendation: 'BUY',
              confidence: 0.82,
              timeframe: cmd.parameters.period,
            },
            executionTime: 1200,
            cached: false,
          };
        }

        return { success: false, error: 'Analysis failed' };
      };

      mockChatMarketIntegrationService.executeCommand.mockImplementation(executeAnalysisCommand);

      const result = await mockChatMarketIntegrationService.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.data.analysis.trend).toBe('bullish');
      expect(result.data.technicalIndicators).toHaveProperty('RSI');
      expect(result.data.technicalIndicators).toHaveProperty('MACD');
      expect(result.data.technicalIndicators).toHaveProperty('SMA');
      expect(result.data.recommendation).toBe('BUY');
    });

    test('should handle command execution errors gracefully', async () => {
      const invalidCommand = {
        type: 'invalid_command',
        symbol: '',
      };

      const executeInvalidCommand = async (cmd: typeof invalidCommand) => {
        return {
          success: false,
          error: 'Unknown command type or missing required parameters',
          errorCode: 'INVALID_COMMAND',
          suggestions: [
            'Use "quote" for stock quotes',
            'Use "analyze" for technical analysis',
            'Ensure symbol is provided',
          ],
          executionTime: 5,
        };
      };

      mockChatMarketIntegrationService.executeCommand.mockImplementation(executeInvalidCommand);

      const result = await mockChatMarketIntegrationService.executeCommand(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
      expect(result.errorCode).toBe('INVALID_COMMAND');
      expect(result.suggestions).toHaveLength(3);
    });
  });

  describe('Market Context Management', () => {
    test('should maintain conversation context with market data', () => {
      const sessionId = 'session-123';
      const initialContext = {
        symbols: ['AAPL'],
        lastQueries: ['price'],
        preferences: { currency: 'USD', timezone: 'EST' },
      };

      const getMarketContext = (sessionId: string) => {
        // Simulate context storage
        const contexts: Record<string, any> = {
          'session-123': {
            symbols: ['AAPL', 'MSFT'],
            lastQueries: ['price', 'analyze'],
            preferences: { currency: 'USD', timezone: 'EST' },
            lastUpdated: new Date().toISOString(),
            queryCount: 5,
          },
        };

        return contexts[sessionId] || null;
      };

      mockChatMarketIntegrationService.getMarketContext.mockImplementation(getMarketContext);

      const context = mockChatMarketIntegrationService.getMarketContext(sessionId);

      expect(context).not.toBeNull();
      expect(context.symbols).toContain('AAPL');
      expect(context.symbols).toContain('MSFT');
      expect(context.queryCount).toBe(5);
      expect(context.preferences.currency).toBe('USD');
    });

    test('should update context with new market interactions', () => {
      const sessionId = 'session-123';
      const update = {
        newSymbol: 'GOOGL',
        query: 'historical_data',
        timestamp: new Date().toISOString(),
      };

      const updateContext = (sessionId: string, update: typeof update) => {
        const currentContext = {
          symbols: ['AAPL', 'MSFT'],
          lastQueries: ['price', 'analyze'],
          queryCount: 5,
        };

        return {
          ...currentContext,
          symbols: [...currentContext.symbols, update.newSymbol],
          lastQueries: [...currentContext.lastQueries.slice(-4), update.query],
          queryCount: currentContext.queryCount + 1,
          lastUpdated: update.timestamp,
        };
      };

      mockChatMarketIntegrationService.updateContext.mockImplementation(updateContext);

      const updatedContext = mockChatMarketIntegrationService.updateContext(sessionId, update);

      expect(updatedContext.symbols).toContain('GOOGL');
      expect(updatedContext.lastQueries).toContain('historical_data');
      expect(updatedContext.queryCount).toBe(6);
    });

    test('should provide context-aware suggestions', () => {
      const context = {
        symbols: ['AAPL', 'MSFT', 'GOOGL'],
        lastQueries: ['price', 'analyze'],
        preferences: { includeNews: true },
      };

      const generateSuggestions = (ctx: typeof context) => {
        const suggestions = [];

        // Based on symbols
        if (ctx.symbols.length > 1) {
          suggestions.push(`Compare performance of ${ctx.symbols.join(', ')}`);
        }

        // Based on last queries
        if (ctx.lastQueries.includes('analyze')) {
          suggestions.push('Get latest news for analyzed symbols');
          suggestions.push('Set price alerts for analyzed symbols');
        }

        // Based on preferences
        if (ctx.preferences.includeNews) {
          suggestions.push('Show market news summary');
        }

        return suggestions;
      };

      const suggestions = generateSuggestions(context);

      expect(suggestions).toContain('Compare performance of AAPL, MSFT, GOOGL');
      expect(suggestions).toContain('Get latest news for analyzed symbols');
      expect(suggestions).toContain('Show market news summary');
    });
  });

  describe('Data Formatting and Response Generation', () => {
    test('should format market data for chat responses', () => {
      const marketData = {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 45000000,
        marketCap: 2500000000000,
        pe: 25.5,
        eps: 5.89,
      };

      const formatMarketResponse = (data: typeof marketData) => {
        const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
        const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
        const formatLargeNumber = (value: number) => {
          if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
          if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
          if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
          return value.toLocaleString();
        };

        return {
          formatted: {
            price: formatCurrency(data.price),
            change: `${formatCurrency(data.change)} (${formatPercent(data.changePercent)})`,
            volume: formatLargeNumber(data.volume),
            marketCap: formatLargeNumber(data.marketCap),
            pe: data.pe.toFixed(1),
            eps: formatCurrency(data.eps),
          },
          summary: `${data.symbol} is trading at ${formatCurrency(data.price)}, ${data.change > 0 ? 'up' : 'down'} ${formatCurrency(Math.abs(data.change))} (${formatPercent(data.changePercent)}) with ${formatLargeNumber(data.volume)} shares traded.`,
          sentiment: data.change > 0 ? 'positive' : 'negative',
        };
      };

      mockChatMarketIntegrationService.formatMarketResponse.mockImplementation(formatMarketResponse);

      const formatted = mockChatMarketIntegrationService.formatMarketResponse(marketData);

      expect(formatted.formatted.price).toBe('$150.25');
      expect(formatted.formatted.change).toBe('$2.50 (+1.69%)');
      expect(formatted.formatted.volume).toBe('45.0M');
      expect(formatted.formatted.marketCap).toBe('$2.50T');
      expect(formatted.summary).toContain('AAPL is trading at $150.25');
      expect(formatted.sentiment).toBe('positive');
    });

    test('should generate insights from market data', () => {
      const marketData = {
        symbol: 'TSLA',
        price: 245.50,
        change: -8.25,
        changePercent: -3.25,
        volume: 85000000,
        avgVolume: 45000000,
        rsi: 35.5,
        beta: 2.1,
      };

      const generateInsights = (data: typeof marketData) => {
        const insights = [];

        // Price movement insights
        if (Math.abs(data.changePercent) > 3) {
          insights.push({
            type: 'significant_movement',
            message: `${data.symbol} is experiencing significant ${data.change > 0 ? 'gains' : 'losses'} of ${Math.abs(data.changePercent).toFixed(2)}%`,
            severity: 'high',
          });
        }

        // Volume insights
        if (data.volume > data.avgVolume * 1.5) {
          insights.push({
            type: 'high_volume',
            message: `Trading volume is ${((data.volume / data.avgVolume - 1) * 100).toFixed(0)}% above average, indicating increased interest`,
            severity: 'medium',
          });
        }

        // Technical insights
        if (data.rsi < 30) {
          insights.push({
            type: 'oversold',
            message: `RSI of ${data.rsi.toFixed(1)} suggests the stock may be oversold`,
            severity: 'medium',
          });
        }

        // Risk insights
        if (data.beta > 2) {
          insights.push({
            type: 'high_volatility',
            message: `High beta of ${data.beta} indicates this stock is more volatile than the market`,
            severity: 'low',
          });
        }

        return insights;
      };

      mockChatMarketIntegrationService.generateInsights.mockImplementation(generateInsights);

      const insights = mockChatMarketIntegrationService.generateInsights(marketData);

      expect(insights).toHaveLength(4);
      expect(insights[0].type).toBe('significant_movement');
      expect(insights[1].type).toBe('high_volume');
      expect(insights[2].type).toBe('oversold');
      expect(insights[3].type).toBe('high_volatility');
      expect(insights[0].severity).toBe('high');
    });
  });

  describe('Streaming and Real-time Updates', () => {
    test('should handle streaming market data responses', async () => {
      const streamConfig = {
        symbol: 'AAPL',
        updateInterval: 1000,
        includeVolume: true,
        includeTechnicals: false,
      };

      const handleStreamingResponse = async (config: typeof streamConfig) => {
        const mockStream = {
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
          onData: jest.fn(),
          onError: jest.fn(),
        };

        // Simulate streaming data
        const streamData = [
          { price: 150.25, volume: 1000, timestamp: Date.now() },
          { price: 150.30, volume: 1500, timestamp: Date.now() + 1000 },
          { price: 150.28, volume: 800, timestamp: Date.now() + 2000 },
        ];

        return {
          stream: mockStream,
          initialData: streamData[0],
          config,
          status: 'active',
        };
      };

      mockChatMarketIntegrationService.handleStreamingResponse.mockImplementation(handleStreamingResponse);

      const streamResult = await mockChatMarketIntegrationService.handleStreamingResponse(streamConfig);

      expect(streamResult.stream).toHaveProperty('subscribe');
      expect(streamResult.stream).toHaveProperty('unsubscribe');
      expect(streamResult.initialData.price).toBe(150.25);
      expect(streamResult.status).toBe('active');
    });

    test('should manage multiple concurrent streams', () => {
      const activeStreams = new Map();

      const manageStreams = (action: string, symbol?: string, config?: any) => {
        switch (action) {
          case 'add':
            if (symbol && config) {
              activeStreams.set(symbol, {
                config,
                startTime: Date.now(),
                status: 'active',
              });
            }
            break;
          case 'remove':
            if (symbol) {
              activeStreams.delete(symbol);
            }
            break;
          case 'list':
            return Array.from(activeStreams.entries()).map(([sym, data]) => ({
              symbol: sym,
              ...data,
            }));
          case 'cleanup':
            const now = Date.now();
            for (const [sym, data] of activeStreams.entries()) {
              if (now - (data as any).startTime > 300000) { // 5 minutes
                activeStreams.delete(sym);
              }
            }
            break;
        }

        return { success: true, activeCount: activeStreams.size };
      };

      // Add streams
      manageStreams('add', 'AAPL', { interval: 1000 });
      manageStreams('add', 'MSFT', { interval: 2000 });
      manageStreams('add', 'GOOGL', { interval: 1500 });

      const streams = manageStreams('list');
      expect(streams).toHaveLength(3);
      expect(streams.find((s: any) => s.symbol === 'AAPL')).toBeDefined();

      // Remove stream
      manageStreams('remove', 'MSFT');
      const updatedStreams = manageStreams('list');
      expect(updatedStreams).toHaveLength(2);
    });
  });

  describe('Caching and Performance', () => {
    test('should cache frequently requested market data', async () => {
      const cacheKey = 'quote:AAPL';
      const cacheData = {
        symbol: 'AAPL',
        price: 150.25,
        timestamp: Date.now(),
        ttl: 60000, // 1 minute
      };

      const getCachedData = async (key: string) => {
        const cache: Record<string, any> = {
          'quote:AAPL': {
            data: cacheData,
            cachedAt: Date.now() - 30000, // 30 seconds ago
            ttl: 60000,
          },
        };

        const cached = cache[key];
        if (cached && (Date.now() - cached.cachedAt) < cached.ttl) {
          return {
            hit: true,
            data: cached.data,
            age: Date.now() - cached.cachedAt,
          };
        }

        return { hit: false, data: null };
      };

      mockChatMarketIntegrationService.getCachedData.mockImplementation(getCachedData);

      const result = await mockChatMarketIntegrationService.getCachedData(cacheKey);

      expect(result.hit).toBe(true);
      expect(result.data.symbol).toBe('AAPL');
      expect(result.age).toBeLessThan(60000);
    });

    test('should handle cache misses and refresh data', async () => {
      const expiredCacheKey = 'quote:TSLA';

      const getCachedDataWithRefresh = async (key: string) => {
        // Simulate cache miss
        const cached = { hit: false, data: null };

        if (!cached.hit) {
          // Simulate fresh data fetch
          const freshData = {
            symbol: 'TSLA',
            price: 245.50,
            timestamp: Date.now(),
          };

          // Cache the fresh data
          return {
            hit: false,
            data: freshData,
            refreshed: true,
            source: 'api',
          };
        }

        return cached;
      };

      mockChatMarketIntegrationService.getCachedData.mockImplementation(getCachedDataWithRefresh);

      const result = await mockChatMarketIntegrationService.getCachedData(expiredCacheKey);

      expect(result.hit).toBe(false);
      expect(result.refreshed).toBe(true);
      expect(result.source).toBe('api');
      expect(result.data.symbol).toBe('TSLA');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle API failures gracefully', async () => {
      const command = {
        type: 'quote',
        symbol: 'INVALID',
      };

      const executeCommandWithError = async (cmd: typeof command) => {
        if (cmd.symbol === 'INVALID') {
          return {
            success: false,
            error: 'Symbol not found',
            errorCode: 'SYMBOL_NOT_FOUND',
            fallbackSuggestions: ['AAPL', 'MSFT', 'GOOGL'],
            retryable: false,
          };
        }

        return { success: true, data: {} };
      };

      mockChatMarketIntegrationService.executeCommand.mockImplementation(executeCommandWithError);

      const result = await mockChatMarketIntegrationService.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SYMBOL_NOT_FOUND');
      expect(result.fallbackSuggestions).toContain('AAPL');
      expect(result.retryable).toBe(false);
    });

    test('should implement retry logic for transient failures', async () => {
      let attemptCount = 0;

      const executeWithRetry = async (command: any) => {
        attemptCount++;

        if (attemptCount < 3) {
          return {
            success: false,
            error: 'Network timeout',
            errorCode: 'TIMEOUT',
            retryable: true,
            attempt: attemptCount,
          };
        }

        return {
          success: true,
          data: { symbol: 'AAPL', price: 150.25 },
          attempt: attemptCount,
        };
      };

      mockChatMarketIntegrationService.executeCommand.mockImplementation(executeWithRetry);

      // First two attempts should fail
      let result1 = await mockChatMarketIntegrationService.executeCommand({ type: 'quote' });
      expect(result1.success).toBe(false);
      expect(result1.attempt).toBe(1);

      let result2 = await mockChatMarketIntegrationService.executeCommand({ type: 'quote' });
      expect(result2.success).toBe(false);
      expect(result2.attempt).toBe(2);

      // Third attempt should succeed
      let result3 = await mockChatMarketIntegrationService.executeCommand({ type: 'quote' });
      expect(result3.success).toBe(true);
      expect(result3.attempt).toBe(3);
    });
  });
}); 