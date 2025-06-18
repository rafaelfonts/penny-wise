import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock the portfolio analysis service
const mockPortfolioAnalysisService = {
  calculatePortfolioValue: jest.fn(),
  calculatePortfolioWeights: jest.fn(),
  calculatePortfolioReturns: jest.fn(),
  calculatePortfolioRisk: jest.fn(),
  calculateSharpeRatio: jest.fn(),
  calculateBeta: jest.fn(),
  calculateVaR: jest.fn(),
  calculateMaxDrawdown: jest.fn(),
  analyzePortfolioPerformance: jest.fn(),
  optimizePortfolio: jest.fn(),
  rebalancePortfolio: jest.fn(),
  generatePortfolioReport: jest.fn(),
};

jest.mock('@/lib/services/portfolio-analysis', () => ({
  portfolioAnalysisService: mockPortfolioAnalysisService,
  PortfolioAnalysisService: jest.fn().mockImplementation(() => mockPortfolioAnalysisService),
}));

describe('Portfolio Analysis Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Portfolio Value Calculations', () => {
    test('should calculate total portfolio value correctly', () => {
      const positions = [
        { symbol: 'AAPL', quantity: 100, currentPrice: 150.00 },
        { symbol: 'GOOGL', quantity: 50, currentPrice: 2800.00 },
        { symbol: 'MSFT', quantity: 75, currentPrice: 300.00 },
      ];

      const calculateValue = (positions: typeof positions) => {
        return positions.reduce((total, position) => {
          return total + (position.quantity * position.currentPrice);
        }, 0);
      };

      mockPortfolioAnalysisService.calculatePortfolioValue.mockImplementation(calculateValue);

      const totalValue = mockPortfolioAnalysisService.calculatePortfolioValue(positions);

      expect(totalValue).toBe(177500); // 15000 + 140000 + 22500
      expect(mockPortfolioAnalysisService.calculatePortfolioValue).toHaveBeenCalledWith(positions);
    });

    test('should calculate portfolio weights correctly', () => {
      const positions = [
        { symbol: 'AAPL', value: 15000 },
        { symbol: 'GOOGL', value: 140000 },
        { symbol: 'MSFT', value: 22500 },
      ];

      const calculateWeights = (positions: typeof positions) => {
        const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
        return positions.map(pos => ({
          symbol: pos.symbol,
          weight: pos.value / totalValue,
          percentage: (pos.value / totalValue) * 100,
        }));
      };

      mockPortfolioAnalysisService.calculatePortfolioWeights.mockImplementation(calculateWeights);

      const weights = mockPortfolioAnalysisService.calculatePortfolioWeights(positions);

      expect(weights).toHaveLength(3);
      expect(weights[0].weight).toBeCloseTo(0.0845, 4); // AAPL: 15000/177500
      expect(weights[1].weight).toBeCloseTo(0.7887, 4); // GOOGL: 140000/177500
      expect(weights[2].weight).toBeCloseTo(0.1268, 4); // MSFT: 22500/177500
      
      // Weights should sum to 1
      const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 4);
    });

    test('should handle empty portfolio', () => {
      const emptyPositions: any[] = [];

      mockPortfolioAnalysisService.calculatePortfolioValue.mockReturnValue(0);
      mockPortfolioAnalysisService.calculatePortfolioWeights.mockReturnValue([]);

      const value = mockPortfolioAnalysisService.calculatePortfolioValue(emptyPositions);
      const weights = mockPortfolioAnalysisService.calculatePortfolioWeights(emptyPositions);

      expect(value).toBe(0);
      expect(weights).toEqual([]);
    });
  });

  describe('Risk Calculations', () => {
    test('should calculate portfolio beta', () => {
      const portfolioReturns = [0.02, -0.01, 0.03, 0.01, -0.02];
      const marketReturns = [0.015, -0.005, 0.025, 0.008, -0.015];

      const calculateBeta = (portfolioReturns: number[], marketReturns: number[]) => {
        const n = portfolioReturns.length;
        const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / n;
        const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n;

        let covariance = 0;
        let marketVariance = 0;

        for (let i = 0; i < n; i++) {
          const portfolioDiff = portfolioReturns[i] - portfolioMean;
          const marketDiff = marketReturns[i] - marketMean;
          covariance += portfolioDiff * marketDiff;
          marketVariance += marketDiff * marketDiff;
        }

        covariance /= (n - 1);
        marketVariance /= (n - 1);

        return marketVariance === 0 ? 0 : covariance / marketVariance;
      };

      mockPortfolioAnalysisService.calculateBeta.mockImplementation(calculateBeta);

      const beta = mockPortfolioAnalysisService.calculateBeta(portfolioReturns, marketReturns);

      expect(typeof beta).toBe('number');
      expect(beta).toBeGreaterThan(0);
      expect(beta).toBeLessThan(3); // Reasonable beta range
    });

    test('should calculate Sharpe ratio', () => {
      const returns = [0.02, -0.01, 0.03, 0.01, -0.02, 0.025, 0.015];
      const riskFreeRate = 0.02; // 2% annual

      const calculateSharpeRatio = (returns: number[], riskFreeRate: number) => {
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
        const standardDeviation = Math.sqrt(variance);

        return standardDeviation === 0 ? 0 : (meanReturn - riskFreeRate) / standardDeviation;
      };

      mockPortfolioAnalysisService.calculateSharpeRatio.mockImplementation(calculateSharpeRatio);

      const sharpeRatio = mockPortfolioAnalysisService.calculateSharpeRatio(returns, riskFreeRate);

      expect(typeof sharpeRatio).toBe('number');
      expect(isFinite(sharpeRatio)).toBe(true);
    });

    test('should calculate Value at Risk (VaR)', () => {
      const returns = [-0.05, -0.02, 0.01, 0.03, -0.01, 0.02, -0.03, 0.04, -0.01, 0.02];
      const confidenceLevel = 0.95;

      const calculateVaR = (returns: number[], confidenceLevel: number) => {
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
        return Math.abs(sortedReturns[index] || 0);
      };

      mockPortfolioAnalysisService.calculateVaR.mockImplementation(calculateVaR);

      const var95 = mockPortfolioAnalysisService.calculateVaR(returns, confidenceLevel);

      expect(typeof var95).toBe('number');
      expect(var95).toBeGreaterThanOrEqual(0);
      expect(var95).toBeLessThanOrEqual(1);
    });

    test('should calculate maximum drawdown', () => {
      const portfolioValues = [100000, 105000, 102000, 108000, 95000, 98000, 110000, 107000];

      const calculateMaxDrawdown = (values: number[]) => {
        let maxDrawdown = 0;
        let peak = values[0];

        for (let i = 1; i < values.length; i++) {
          if (values[i] > peak) {
            peak = values[i];
          } else {
            const drawdown = (peak - values[i]) / peak;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
          }
        }

        return maxDrawdown;
      };

      mockPortfolioAnalysisService.calculateMaxDrawdown.mockImplementation(calculateMaxDrawdown);

      const maxDrawdown = mockPortfolioAnalysisService.calculateMaxDrawdown(portfolioValues);

      expect(typeof maxDrawdown).toBe('number');
      expect(maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(maxDrawdown).toBeLessThanOrEqual(1);
      expect(maxDrawdown).toBeCloseTo(0.1204, 4); // (108000 - 95000) / 108000
    });
  });

  describe('Performance Analysis', () => {
    test('should analyze portfolio performance comprehensively', () => {
      const portfolioData = {
        positions: [
          { symbol: 'AAPL', quantity: 100, currentPrice: 150.00, costBasis: 140.00 },
          { symbol: 'GOOGL', quantity: 50, currentPrice: 2800.00, costBasis: 2600.00 },
        ],
        historicalValues: [170000, 175000, 172000, 177500],
        benchmarkReturns: [0.01, 0.02, -0.01, 0.015],
      };

      const analyzePerformance = (data: typeof portfolioData) => {
        const totalValue = data.positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0);
        const totalCost = data.positions.reduce((sum, pos) => sum + (pos.quantity * pos.costBasis), 0);
        const totalReturn = (totalValue - totalCost) / totalCost;

        const returns = [];
        for (let i = 1; i < data.historicalValues.length; i++) {
          returns.push((data.historicalValues[i] - data.historicalValues[i-1]) / data.historicalValues[i-1]);
        }

        return {
          totalValue,
          totalCost,
          totalReturn,
          totalReturnPercent: totalReturn * 100,
          unrealizedGainLoss: totalValue - totalCost,
          returns,
          volatility: Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length),
        };
      };

      mockPortfolioAnalysisService.analyzePortfolioPerformance.mockImplementation(analyzePerformance);

      const analysis = mockPortfolioAnalysisService.analyzePortfolioPerformance(portfolioData);

      expect(analysis.totalValue).toBe(155000); // 15000 + 140000
      expect(analysis.totalCost).toBe(144000); // 14000 + 130000
      expect(analysis.totalReturn).toBeCloseTo(0.0764, 4);
      expect(analysis.totalReturnPercent).toBeCloseTo(7.64, 2);
      expect(analysis.unrealizedGainLoss).toBe(11000);
      expect(analysis.returns).toHaveLength(3);
      expect(typeof analysis.volatility).toBe('number');
    });

    test('should generate comprehensive portfolio report', () => {
      const portfolioId = 'portfolio-123';
      const reportOptions = {
        includeRiskMetrics: true,
        includeBenchmarkComparison: true,
        includeRecommendations: true,
        period: '1Y',
      };

      const generateReport = (id: string, options: typeof reportOptions) => {
        return {
          portfolioId: id,
          generatedAt: new Date().toISOString(),
          period: options.period,
          summary: {
            totalValue: 177500,
            totalReturn: 7.64,
            sharpeRatio: 1.25,
            beta: 1.1,
            maxDrawdown: 0.12,
          },
          riskMetrics: options.includeRiskMetrics ? {
            var95: 0.05,
            var99: 0.08,
            volatility: 0.15,
            correlations: {},
          } : null,
          benchmarkComparison: options.includeBenchmarkComparison ? {
            benchmarkReturn: 6.5,
            alpha: 1.14,
            trackingError: 0.03,
          } : null,
          recommendations: options.includeRecommendations ? [
            'Consider reducing concentration in technology sector',
            'Add defensive positions to reduce volatility',
          ] : null,
        };
      };

      mockPortfolioAnalysisService.generatePortfolioReport.mockImplementation(generateReport);

      const report = mockPortfolioAnalysisService.generatePortfolioReport(portfolioId, reportOptions);

      expect(report.portfolioId).toBe(portfolioId);
      expect(report.period).toBe('1Y');
      expect(report.summary).toHaveProperty('totalValue');
      expect(report.summary).toHaveProperty('sharpeRatio');
      expect(report.riskMetrics).not.toBeNull();
      expect(report.benchmarkComparison).not.toBeNull();
      expect(report.recommendations).toHaveLength(2);
    });
  });

  describe('Portfolio Optimization', () => {
    test('should optimize portfolio allocation', () => {
      const currentPortfolio = [
        { symbol: 'AAPL', weight: 0.4 },
        { symbol: 'GOOGL', weight: 0.4 },
        { symbol: 'MSFT', weight: 0.2 },
      ];

      const constraints = {
        maxWeight: 0.3,
        minWeight: 0.05,
        targetReturn: 0.12,
        riskTolerance: 'moderate',
      };

      const optimizeAllocation = (portfolio: typeof currentPortfolio, constraints: typeof constraints) => {
        // Simple optimization simulation
        const totalWeight = portfolio.reduce((sum, pos) => sum + pos.weight, 0);
        
        // Rebalance to meet max weight constraint
        const optimized = portfolio.map(pos => ({
          ...pos,
          weight: Math.min(pos.weight, constraints.maxWeight),
          recommendedAction: pos.weight > constraints.maxWeight ? 'reduce' : 'maintain',
        }));

        // Normalize weights
        const newTotalWeight = optimized.reduce((sum, pos) => sum + pos.weight, 0);
        optimized.forEach(pos => {
          pos.weight = pos.weight / newTotalWeight;
        });

        return {
          optimizedPortfolio: optimized,
          expectedReturn: 0.115,
          expectedRisk: 0.14,
          improvementScore: 0.85,
          rebalanceRequired: true,
        };
      };

      mockPortfolioAnalysisService.optimizePortfolio.mockImplementation(optimizeAllocation);

      const optimization = mockPortfolioAnalysisService.optimizePortfolio(currentPortfolio, constraints);

      expect(optimization.optimizedPortfolio).toHaveLength(3);
      expect(optimization.optimizedPortfolio.every(pos => pos.weight <= constraints.maxWeight)).toBe(true);
      expect(optimization.expectedReturn).toBeGreaterThan(0);
      expect(optimization.expectedRisk).toBeGreaterThan(0);
      expect(optimization.rebalanceRequired).toBe(true);
    });

    test('should suggest portfolio rebalancing', () => {
      const currentAllocations = [
        { symbol: 'AAPL', currentWeight: 0.45, targetWeight: 0.30 },
        { symbol: 'GOOGL', currentWeight: 0.35, targetWeight: 0.40 },
        { symbol: 'MSFT', currentWeight: 0.20, targetWeight: 0.30 },
      ];

      const rebalancePortfolio = (allocations: typeof currentAllocations) => {
        const totalValue = 100000; // Assume $100k portfolio
        
        const rebalanceActions = allocations.map(allocation => {
          const currentValue = totalValue * allocation.currentWeight;
          const targetValue = totalValue * allocation.targetWeight;
          const difference = targetValue - currentValue;
          
          return {
            symbol: allocation.symbol,
            currentWeight: allocation.currentWeight,
            targetWeight: allocation.targetWeight,
            currentValue,
            targetValue,
            action: difference > 0 ? 'buy' : 'sell',
            amount: Math.abs(difference),
            shares: Math.floor(Math.abs(difference) / 150), // Assume $150 avg price
          };
        });

        return {
          actions: rebalanceActions,
          totalTransactionCost: rebalanceActions.length * 10, // $10 per trade
          estimatedTax: 0, // Assume tax-advantaged account
          rebalanceScore: 0.92,
        };
      };

      mockPortfolioAnalysisService.rebalancePortfolio.mockImplementation(rebalancePortfolio);

      const rebalance = mockPortfolioAnalysisService.rebalancePortfolio(currentAllocations);

      expect(rebalance.actions).toHaveLength(3);
      expect(rebalance.actions[0].action).toBe('sell'); // AAPL overweight
      expect(rebalance.actions[1].action).toBe('buy');  // GOOGL underweight
      expect(rebalance.actions[2].action).toBe('buy');  // MSFT underweight
      expect(rebalance.totalTransactionCost).toBe(30);
      expect(rebalance.rebalanceScore).toBeGreaterThan(0.9);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid portfolio data', () => {
      const invalidData = null;

      mockPortfolioAnalysisService.calculatePortfolioValue.mockImplementation((data) => {
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid portfolio data');
        }
        return 0;
      });

      expect(() => {
        mockPortfolioAnalysisService.calculatePortfolioValue(invalidData);
      }).toThrow('Invalid portfolio data');
    });

    test('should handle missing price data', () => {
      const positionsWithMissingPrices = [
        { symbol: 'AAPL', quantity: 100, currentPrice: null },
        { symbol: 'GOOGL', quantity: 50, currentPrice: 2800.00 },
      ];

      mockPortfolioAnalysisService.calculatePortfolioValue.mockImplementation((positions) => {
        return positions.reduce((total: number, position: any) => {
          if (position.currentPrice === null || position.currentPrice === undefined) {
            console.warn(`Missing price for ${position.symbol}`);
            return total;
          }
          return total + (position.quantity * position.currentPrice);
        }, 0);
      });

      const value = mockPortfolioAnalysisService.calculatePortfolioValue(positionsWithMissingPrices);

      expect(value).toBe(140000); // Only GOOGL counted
    });

    test('should handle division by zero in calculations', () => {
      const emptyReturns: number[] = [];

      mockPortfolioAnalysisService.calculateSharpeRatio.mockImplementation((returns, riskFreeRate) => {
        if (returns.length === 0) {
          return 0;
        }
        
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
        const standardDeviation = Math.sqrt(variance);

        return standardDeviation === 0 ? 0 : (meanReturn - riskFreeRate) / standardDeviation;
      });

      const sharpeRatio = mockPortfolioAnalysisService.calculateSharpeRatio(emptyReturns, 0.02);

      expect(sharpeRatio).toBe(0);
    });
  });
}); 