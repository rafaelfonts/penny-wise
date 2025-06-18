import { describe, test, expect } from '@jest/globals';

describe('Financial Calculations Tests', () => {
  describe('Percentage Calculations', () => {
    test('should calculate percentage change correctly', () => {
      const calculatePercentageChange = (oldValue: number, newValue: number): number => {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
      };

      expect(calculatePercentageChange(100, 110)).toBeCloseTo(10, 2);
      expect(calculatePercentageChange(100, 90)).toBeCloseTo(-10, 2);
      expect(calculatePercentageChange(50, 75)).toBeCloseTo(50, 2);
      expect(calculatePercentageChange(200, 150)).toBeCloseTo(-25, 2);
      expect(calculatePercentageChange(0, 100)).toBe(0); // Edge case
    });

    test('should calculate compound annual growth rate (CAGR)', () => {
      const calculateCAGR = (beginningValue: number, endingValue: number, years: number): number => {
        if (beginningValue <= 0 || endingValue <= 0 || years <= 0) return 0;
        return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
      };

      expect(calculateCAGR(1000, 1500, 3)).toBeCloseTo(14.47, 2);
      expect(calculateCAGR(10000, 15000, 5)).toBeCloseTo(8.45, 2);
      expect(calculateCAGR(5000, 4000, 2)).toBeCloseTo(-11.80, 2);
    });

    test('should calculate return on investment (ROI)', () => {
      const calculateROI = (gain: number, cost: number): number => {
        if (cost === 0) return 0;
        return (gain / cost) * 100;
      };

      expect(calculateROI(500, 1000)).toBeCloseTo(50, 2);
      expect(calculateROI(-200, 1000)).toBeCloseTo(-20, 2);
      expect(calculateROI(1000, 2000)).toBeCloseTo(50, 2);
    });
  });

  describe('Moving Averages', () => {
    test('should calculate simple moving average (SMA)', () => {
      const calculateSMA = (values: number[], period: number): number[] => {
        if (values.length < period) return [];
        
        const smaValues: number[] = [];
        for (let i = period - 1; i < values.length; i++) {
          const sum = values.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
          smaValues.push(sum / period);
        }
        return smaValues;
      };

      const prices = [10, 12, 13, 15, 16, 14, 13, 15, 17, 18];
      const sma5 = calculateSMA(prices, 5);
      
      expect(sma5).toHaveLength(6);
      expect(sma5[0]).toBeCloseTo(13.2, 1); // (10+12+13+15+16)/5
      expect(sma5[sma5.length - 1]).toBeCloseTo(15.4, 1); // Last 5 values average
    });

    test('should calculate exponential moving average (EMA)', () => {
      const calculateEMA = (values: number[], period: number): number[] => {
        if (values.length < period) return [];
        
        const multiplier = 2 / (period + 1);
        const emaValues: number[] = [];
        
        // First EMA is SMA
        const firstSMA = values.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
        emaValues.push(firstSMA);
        
        // Calculate subsequent EMAs
        for (let i = period; i < values.length; i++) {
          const ema = (values[i] * multiplier) + (emaValues[emaValues.length - 1] * (1 - multiplier));
          emaValues.push(ema);
        }
        
        return emaValues;
      };

      const prices = [22, 24, 23, 25, 27, 26, 28, 30, 29, 31];
      const ema5 = calculateEMA(prices, 5);
      
      expect(ema5).toHaveLength(6);
      expect(ema5[0]).toBeCloseTo(24.2, 1); // First value is SMA
      expect(ema5[ema5.length - 1]).toBeGreaterThan(ema5[0]); // Should trend upward
    });
  });

  describe('Volatility Calculations', () => {
    test('should calculate standard deviation', () => {
      const calculateStandardDeviation = (values: number[]): number => {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
      };

      const returns = [0.05, -0.02, 0.03, 0.01, -0.01, 0.04, -0.03, 0.02];
      const stdDev = calculateStandardDeviation(returns);
      
      expect(stdDev).toBeGreaterThan(0);
      expect(stdDev).toBeCloseTo(0.0275, 3);
    });

    test('should calculate annualized volatility', () => {
      const calculateAnnualizedVolatility = (dailyReturns: number[]): number => {
        if (dailyReturns.length === 0) return 0;
        
        const mean = dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dailyReturns.length - 1);
        const dailyVolatility = Math.sqrt(variance);
        
        // Annualize assuming 252 trading days
        return dailyVolatility * Math.sqrt(252) * 100;
      };

      const dailyReturns = Array.from({ length: 30 }, () => (Math.random() - 0.5) * 0.04);
      const annualizedVol = calculateAnnualizedVolatility(dailyReturns);
      
      expect(annualizedVol).toBeGreaterThan(0);
      expect(annualizedVol).toBeLessThan(100); // Reasonable range
    });
  });

  describe('Risk Metrics', () => {
    test('should calculate Sharpe ratio', () => {
      const calculateSharpeRatio = (returns: number[], riskFreeRate: number): number => {
        if (returns.length === 0) return 0;
        
        const meanReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
        const variance = returns.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / (returns.length - 1);
        const standardDeviation = Math.sqrt(variance);
        
        if (standardDeviation === 0) return 0;
        return (meanReturn - riskFreeRate) / standardDeviation;
      };

      const returns = [0.08, 0.12, 0.05, 0.15, 0.10, 0.07, 0.13, 0.09];
      const riskFreeRate = 0.03;
      const sharpeRatio = calculateSharpeRatio(returns, riskFreeRate);
      
      expect(sharpeRatio).toBeGreaterThan(0);
      expect(sharpeRatio).toBeCloseTo(2.24, 1);
    });

    test('should calculate maximum drawdown', () => {
      const calculateMaxDrawdown = (values: number[]): number => {
        if (values.length === 0) return 0;
        
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

      const portfolioValues = [100000, 105000, 102000, 108000, 95000, 98000, 110000, 107000];
      const maxDrawdown = calculateMaxDrawdown(portfolioValues);
      
      expect(maxDrawdown).toBeGreaterThan(0);
      expect(maxDrawdown).toBeCloseTo(0.1204, 4); // (108000 - 95000) / 108000
    });

    test('should calculate Value at Risk (VaR)', () => {
      const calculateVaR = (returns: number[], confidenceLevel: number): number => {
        if (returns.length === 0) return 0;
        
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
        return Math.abs(sortedReturns[index] || 0);
      };

      const returns = [-0.05, -0.02, 0.01, 0.03, -0.01, 0.02, -0.03, 0.04, -0.01, 0.02];
      const var95 = calculateVaR(returns, 0.95);
      const var99 = calculateVaR(returns, 0.99);
      
      expect(var95).toBeGreaterThan(0);
      expect(var99).toBeGreaterThanOrEqual(var95);
    });
  });

  describe('Technical Indicators', () => {
    test('should calculate Relative Strength Index (RSI)', () => {
      const calculateRSI = (prices: number[], period: number = 14): number[] => {
        if (prices.length < period + 1) return [];
        
        const rsiValues: number[] = [];
        
        for (let i = period; i < prices.length; i++) {
          const priceChanges = [];
          for (let j = i - period + 1; j <= i; j++) {
            priceChanges.push(prices[j] - prices[j - 1]);
          }
          
          const gains = priceChanges.filter(change => change > 0);
          const losses = priceChanges.filter(change => change < 0).map(loss => Math.abs(loss));
          
          const avgGain = gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) / period : 0;
          const avgLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / period : 0;
          
          if (avgLoss === 0) {
            rsiValues.push(100);
          } else {
            const rs = avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            rsiValues.push(rsi);
          }
        }
        
        return rsiValues;
      };

      const prices = [44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 47.37, 47.20, 46.57, 46.03, 46.83, 47.69, 46.49, 46.26];
      const rsi = calculateRSI(prices, 14);
      
      expect(rsi).toHaveLength(1);
      expect(rsi[0]).toBeGreaterThan(0);
      expect(rsi[0]).toBeLessThan(100);
    });

    test('should calculate Bollinger Bands', () => {
      const calculateBollingerBands = (prices: number[], period: number = 20, multiplier: number = 2) => {
        if (prices.length < period) return [];
        
        const bands = [];
        
        for (let i = period - 1; i < prices.length; i++) {
          const slice = prices.slice(i - period + 1, i + 1);
          const sma = slice.reduce((sum, price) => sum + price, 0) / period;
          
          const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
          const stdDev = Math.sqrt(variance);
          
          bands.push({
            upper: sma + (multiplier * stdDev),
            middle: sma,
            lower: sma - (multiplier * stdDev),
          });
        }
        
        return bands;
      };

      const prices = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i * 0.3) * 5 + Math.random() * 2);
      const bands = calculateBollingerBands(prices, 20, 2);
      
      expect(bands).toHaveLength(6);
      bands.forEach(band => {
        expect(band.upper).toBeGreaterThan(band.middle);
        expect(band.middle).toBeGreaterThan(band.lower);
      });
    });
  });

  describe('Portfolio Calculations', () => {
    test('should calculate portfolio weights', () => {
      const calculatePortfolioWeights = (positions: Array<{ value: number }>) => {
        const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
        if (totalValue === 0) return positions.map(() => ({ weight: 0 }));
        
        return positions.map(pos => ({
          weight: pos.value / totalValue,
          percentage: (pos.value / totalValue) * 100,
        }));
      };

      const positions = [
        { value: 10000 },
        { value: 15000 },
        { value: 25000 },
      ];

      const weights = calculatePortfolioWeights(positions);
      
      expect(weights).toHaveLength(3);
      expect(weights[0].weight).toBeCloseTo(0.2, 2);
      expect(weights[1].weight).toBeCloseTo(0.3, 2);
      expect(weights[2].weight).toBeCloseTo(0.5, 2);
      
      const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    test('should calculate portfolio beta', () => {
      const calculatePortfolioBeta = (
        portfolioReturns: number[],
        marketReturns: number[]
      ): number => {
        if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) {
          return 0;
        }
        
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

      const portfolioReturns = [0.02, -0.01, 0.03, 0.01, -0.02];
      const marketReturns = [0.015, -0.005, 0.025, 0.008, -0.015];
      
      const beta = calculatePortfolioBeta(portfolioReturns, marketReturns);
      
      expect(typeof beta).toBe('number');
      expect(isFinite(beta)).toBe(true);
    });

    test('should calculate correlation coefficient', () => {
      const calculateCorrelation = (x: number[], y: number[]): number => {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = y.reduce((sum, val) => sum + val, 0) / n;
        
        let numerator = 0;
        let sumXSquared = 0;
        let sumYSquared = 0;
        
        for (let i = 0; i < n; i++) {
          const xDiff = x[i] - meanX;
          const yDiff = y[i] - meanY;
          numerator += xDiff * yDiff;
          sumXSquared += xDiff * xDiff;
          sumYSquared += yDiff * yDiff;
        }
        
        const denominator = Math.sqrt(sumXSquared * sumYSquared);
        return denominator === 0 ? 0 : numerator / denominator;
      };

      const stock1Returns = [0.05, -0.02, 0.03, 0.01, -0.01];
      const stock2Returns = [0.04, -0.01, 0.02, 0.02, -0.02];
      
      const correlation = calculateCorrelation(stock1Returns, stock2Returns);
      
      expect(correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation).toBeLessThanOrEqual(1);
    });
  });

  describe('Currency and Formatting', () => {
    test('should format currency values', () => {
      const formatCurrency = (value: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(value);
      };

      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(-500.25)).toBe('-$500.25');
    });

    test('should format percentage values', () => {
      const formatPercentage = (value: number, decimals: number = 2): string => {
        return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
      };

      expect(formatPercentage(5.67)).toBe('+5.67%');
      expect(formatPercentage(-3.45)).toBe('-3.45%');
      expect(formatPercentage(0)).toBe('0.00%');
    });

    test('should format large numbers with suffixes', () => {
      const formatLargeNumber = (value: number): string => {
        if (Math.abs(value) >= 1e12) {
          return `${(value / 1e12).toFixed(2)}T`;
        } else if (Math.abs(value) >= 1e9) {
          return `${(value / 1e9).toFixed(2)}B`;
        } else if (Math.abs(value) >= 1e6) {
          return `${(value / 1e6).toFixed(2)}M`;
        } else if (Math.abs(value) >= 1e3) {
          return `${(value / 1e3).toFixed(2)}K`;
        }
        return value.toString();
      };

      expect(formatLargeNumber(1500000000000)).toBe('1.50T');
      expect(formatLargeNumber(2500000000)).toBe('2.50B');
      expect(formatLargeNumber(1500000)).toBe('1.50M');
      expect(formatLargeNumber(2500)).toBe('2.50K');
      expect(formatLargeNumber(500)).toBe('500');
    });
  });

  describe('Date and Time Utilities', () => {
    test('should check if market is open', () => {
      const isMarketOpen = (date: Date = new Date()): boolean => {
        const day = date.getDay();
        const hour = date.getHours();
        
        // Weekend check
        if (day === 0 || day === 6) return false;
        
        // Market hours: 9:30 AM to 4:00 PM EST (simplified)
        return hour >= 9 && hour < 16;
      };

      const mondayMorning = new Date('2024-01-15T10:00:00'); // Monday 10 AM
      const saturdayAfternoon = new Date('2024-01-13T14:00:00'); // Saturday 2 PM
      const mondayEvening = new Date('2024-01-15T18:00:00'); // Monday 6 PM
      
      expect(isMarketOpen(mondayMorning)).toBe(true);
      expect(isMarketOpen(saturdayAfternoon)).toBe(false);
      expect(isMarketOpen(mondayEvening)).toBe(false);
    });

    test('should calculate business days between dates', () => {
      const getBusinessDaysBetween = (startDate: Date, endDate: Date): number => {
        let count = 0;
        const current = new Date(startDate);
        
        while (current <= endDate) {
          const day = current.getDay();
          if (day !== 0 && day !== 6) { // Not weekend
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
        
        return count;
      };

      const start = new Date('2024-01-15'); // Monday
      const end = new Date('2024-01-19'); // Friday
      
      expect(getBusinessDaysBetween(start, end)).toBe(5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty arrays gracefully', () => {
      const calculateSMA = (values: number[], period: number): number[] => {
        if (values.length < period) return [];
        return [values.slice(-period).reduce((sum, val) => sum + val, 0) / period];
      };

      expect(calculateSMA([], 5)).toEqual([]);
      expect(calculateSMA([1, 2], 5)).toEqual([]);
    });

    test('should handle division by zero', () => {
      const calculateRatio = (numerator: number, denominator: number): number => {
        return denominator === 0 ? 0 : numerator / denominator;
      };

      expect(calculateRatio(10, 0)).toBe(0);
      expect(calculateRatio(10, 2)).toBe(5);
    });

    test('should handle invalid inputs', () => {
      const calculatePercentage = (value: number, total: number): number => {
        if (!isFinite(value) || !isFinite(total) || total === 0) return 0;
        return (value / total) * 100;
      };

      expect(calculatePercentage(NaN, 100)).toBe(0);
      expect(calculatePercentage(50, Infinity)).toBe(0);
      expect(calculatePercentage(50, 0)).toBe(0);
      expect(calculatePercentage(25, 100)).toBe(25);
    });
  });
});
