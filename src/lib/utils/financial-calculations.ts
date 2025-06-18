// Financial Calculations Utilities for PennyWise
// Comprehensive financial analysis, risk metrics, and technical indicators

// ==========================================
// PERCENTAGE CALCULATIONS
// ==========================================

export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 */
export function calculateCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || years <= 0) return 0;
  
  const result = Math.pow(finalValue / initialValue, 1 / years) - 1;
  return Number((result * 100).toFixed(2));
}

export function calculateROI(initialInvestment: number, finalValue: number): number {
  if (initialInvestment === 0) return 0;
  return ((finalValue - initialInvestment) / initialInvestment) * 100;
}

// ==========================================
// MOVING AVERAGES
// ==========================================

export function calculateSimpleMovingAverage(prices: number[], period: number): number[] {
  if (prices.length === 0 || period <= 0) return [];
  if (prices.length < period) return [];
  
  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
    sma.push(sum / period);
  }
  return sma;
}

export function calculateExponentialMovingAverage(prices: number[], period: number): number[] {
  if (prices.length === 0 || period <= 0) return [];
  
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is the first price
  ema.push(prices[0]);
  
  for (let i = 1; i < prices.length; i++) {
    const currentEma = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    ema.push(currentEma);
  }
  
  return ema;
}

// ==========================================
// VOLATILITY CALCULATIONS
// ==========================================

export function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;
  if (returns.length === 1) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const squaredDifferences = returns.map(ret => Math.pow(ret - mean, 2));
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);
  
  return Math.sqrt(variance);
}

// ==========================================
// RISK METRICS
// ==========================================

/**
 * Calculate Sharpe Ratio
 */
export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const excessReturn = avgReturn - riskFreeRate;
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  return Number((excessReturn / stdDev).toFixed(2));
}

export function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    } else {
      const drawdown = (peak - prices[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown;
}

export function calculateVaR(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sortedReturns.length);
  
  return sortedReturns[index] || 0;
}

// ==========================================
// TECHNICAL INDICATORS
// ==========================================

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [];
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  if (gains.length < period) return [];
  
  // Calculate initial averages
  const avgGain = gains.slice(0, period).reduce((sum, g) => sum + g, 0) / period;
  const avgLoss = losses.slice(0, period).reduce((sum, l) => sum + l, 0) / period;
  
  const rsiValues: number[] = [];
  
  // Calculate RSI for the first period
  const rs = avgGain / (avgLoss || 1);
  const rsi = 100 - (100 / (1 + rs));
  rsiValues.push(rsi);
  
  return rsiValues;
}

export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const middle = calculateSimpleMovingAverage(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < middle.length; i++) {
    const startIndex = i;
    const endIndex = i + period;
    const subset = prices.slice(startIndex, endIndex);
    
    const mean = middle[i];
    const variance = subset.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    upper.push(mean + (stdDev * standardDeviation));
    lower.push(mean - (stdDev * standardDeviation));
  }
  
  return { upper, middle, lower };
}

// ==========================================
// PORTFOLIO CALCULATIONS
// ==========================================

export function calculatePortfolioWeights(values: number[]): number[] {
  if (values.length === 0) return [];
  
  const totalValue = values.reduce((sum, value) => sum + value, 0);
  if (totalValue === 0) return values.map(() => 0);
  
  return values.map(value => value / totalValue);
}

export function calculatePortfolioBeta(portfolioReturns: number[], marketReturns: number[]): number {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) {
    return 1; // Default beta
  }
  
  const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
  const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    const portfolioDiff = portfolioReturns[i] - portfolioMean;
    const marketDiff = marketReturns[i] - marketMean;
    
    covariance += portfolioDiff * marketDiff;
    marketVariance += marketDiff * marketDiff;
  }
  
  covariance /= portfolioReturns.length - 1;
  marketVariance /= marketReturns.length - 1;
  
  return marketVariance === 0 ? 1 : covariance / marketVariance;
}

export function calculateCorrelation(returns1: number[], returns2: number[]): number {
  if (returns1.length !== returns2.length || returns1.length === 0) {
    return 0;
  }
  
  const mean1 = returns1.reduce((sum, ret) => sum + ret, 0) / returns1.length;
  const mean2 = returns2.reduce((sum, ret) => sum + ret, 0) / returns2.length;
  
  let numerator = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;
  
  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    
    numerator += diff1 * diff2;
    sum1Sq += diff1 * diff1;
    sum2Sq += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  return denominator === 0 ? 0 : numerator / denominator;
}

// ==========================================
// FORMATTING FUNCTIONS
// ==========================================

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'BRL' ? 'BRL' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  if (currency === 'BRL') {
    return formatter.format(amount).replace('R$', 'R$').replace(',', 'TEMP').replace('.', ',').replace('TEMP', '.');
  }
  
  return formatter.format(amount);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals?: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(value);
}

// ==========================================
// DATE AND TIME UTILITIES
// ==========================================

export function isMarketOpen(date: Date = new Date()): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Weekend check
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:30 AM to 4:00 PM EST
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  
  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}

/**
 * Calculate business days between two dates
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) return 0;
  
  let businessDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays - 1; // Exclude the end date
}

export function getMarketHours(): {
  open: string;
  close: string;
  timezone: string;
} {
  return {
    open: '09:30',
    close: '16:00',
    timezone: 'America/New_York',
  };
} 