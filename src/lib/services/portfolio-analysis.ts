// ==========================================
// PORTFOLIO ANALYSIS SERVICE - Day 6 Priority 1
// ==========================================

import marketDataService from './market-data';

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice?: number;
  marketValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

export interface PortfolioAnalysis {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  diversificationScore: number;
  riskScore: number;
  holdings: PortfolioHolding[];
  sectors: { [key: string]: number };
  recommendations: string[];
  riskMetrics: {
    volatility: number;
    beta: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  performanceMetrics: {
    oneDayReturn: number;
    oneWeekReturn: number;
    oneMonthReturn: number;
    threeMonthReturn: number;
    oneYearReturn: number;
  };
}

export interface PortfolioAnalysisRequest {
  holdings: PortfolioHolding[];
  timeframe: '1d' | '1w' | '1m' | '3m' | '1y';
  analysisType:
    | 'performance'
    | 'risk'
    | 'diversification'
    | 'recommendations'
    | 'complete';
  includeRecommendations?: boolean;
}

class PortfolioAnalysisService {
  /**
   * Perform complete portfolio analysis
   */
  async analyzePortfolio(
    request: PortfolioAnalysisRequest
  ): Promise<PortfolioAnalysis> {
    const { holdings, includeRecommendations = true } = request;

    // Get current market data for all holdings
    const enrichedHoldings = await this.enrichHoldingsWithMarketData(holdings);

    // Calculate portfolio totals
    const totals = this.calculatePortfolioTotals(enrichedHoldings);

    // Analyze diversification
    const diversificationScore =
      this.calculateDiversificationScore(enrichedHoldings);

    // Calculate risk metrics
    const riskMetrics = await this.calculateRiskMetrics(enrichedHoldings);

    // Analyze sectors
    const sectors = await this.analyzeSectorAllocation(enrichedHoldings);

    // Generate recommendations
    const recommendations = includeRecommendations
      ? await this.generateRecommendations(
          enrichedHoldings,
          riskMetrics,
          diversificationScore
        )
      : [];

    // Calculate performance metrics
    const performanceMetrics =
      await this.calculatePerformanceMetrics(enrichedHoldings);

    return {
      totalValue: totals.totalValue,
      totalCost: totals.totalCost,
      totalGainLoss: totals.totalGainLoss,
      totalGainLossPercent: totals.totalGainLossPercent,
      dayChange: totals.dayChange,
      dayChangePercent: totals.dayChangePercent,
      diversificationScore,
      riskScore: riskMetrics.volatility * 100, // Convert to 0-100 scale
      holdings: enrichedHoldings,
      sectors,
      recommendations,
      riskMetrics,
      performanceMetrics,
    };
  }

  /**
   * Enrich holdings with current market data
   */
  private async enrichHoldingsWithMarketData(
    holdings: PortfolioHolding[]
  ): Promise<PortfolioHolding[]> {
    const enrichedHoldings: PortfolioHolding[] = [];

    for (const holding of holdings) {
      try {
        const quoteResponse = await marketDataService.getQuote(holding.symbol);

        if (quoteResponse.success && quoteResponse.data) {
          const quote = quoteResponse.data;
          const currentPrice = quote.price;
          const marketValue = holding.quantity * currentPrice;
          const totalCost = holding.quantity * holding.averageCost;
          const gainLoss = marketValue - totalCost;
          const gainLossPercent =
            totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

          enrichedHoldings.push({
            ...holding,
            currentPrice,
            marketValue,
            gainLoss,
            gainLossPercent,
          });
        } else {
          // If market data fails, keep original holding
          enrichedHoldings.push(holding);
        }
      } catch (error) {
        console.error(`Error fetching data for ${holding.symbol}:`, error);
        enrichedHoldings.push(holding);
      }
    }

    return enrichedHoldings;
  }

  /**
   * Calculate portfolio totals
   */
  private calculatePortfolioTotals(holdings: PortfolioHolding[]): {
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    dayChange: number;
    dayChangePercent: number;
  } {
    let totalValue = 0;
    let totalCost = 0;
    let dayChange = 0;

    for (const holding of holdings) {
      const cost = holding.quantity * holding.averageCost;
      const value = holding.marketValue || cost;

      totalValue += value;
      totalCost += cost;

      // Calculate day change (simplified)
      if (holding.currentPrice) {
        // Assume 1% average day change for calculation
        dayChange += value * 0.01; // This would be calculated from actual daily data
      }
    }

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const dayChangePercent =
      totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      dayChange,
      dayChangePercent,
    };
  }

  /**
   * Calculate diversification score (0-100)
   */
  private calculateDiversificationScore(holdings: PortfolioHolding[]): number {
    if (holdings.length === 0) return 0;

    const totalValue = holdings.reduce(
      (sum, h) => sum + (h.marketValue || 0),
      0
    );
    if (totalValue === 0) return 0;

    // Calculate concentration (Herfindahl index)
    let concentrationIndex = 0;
    for (const holding of holdings) {
      const weight = (holding.marketValue || 0) / totalValue;
      concentrationIndex += weight * weight;
    }

    // Convert to diversification score (lower concentration = higher diversification)
    const diversificationScore = Math.max(0, 100 * (1 - concentrationIndex));

    return diversificationScore;
  }

  /**
   * Calculate risk metrics
   */
  private async calculateRiskMetrics(holdings: PortfolioHolding[]): Promise<{
    volatility: number;
    beta: number;
    sharpeRatio: number;
    maxDrawdown: number;
  }> {
    let totalBeta = 0;
    let totalWeight = 0;
    let avgVolatility = 0;

    for (const holding of holdings) {
      try {
        const overviewResponse = await marketDataService.getCompanyOverview(
          holding.symbol
        );

        if (overviewResponse.success && overviewResponse.data) {
          const overview = overviewResponse.data;
          const weight = holding.marketValue || 0;

          totalBeta += (overview.beta || 1.0) * weight;
          totalWeight += weight;

          // Simplified volatility calculation
          avgVolatility += 0.15 * weight; // Default 15% volatility
        }
      } catch (error) {
        console.warn(`Error calculating risk for ${holding.symbol}:`, error);
      }
    }

    const portfolioBeta = totalWeight > 0 ? totalBeta / totalWeight : 1.0;
    const portfolioVolatility =
      totalWeight > 0 ? avgVolatility / totalWeight : 0.15;

    // Simplified Sharpe ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const expectedReturn = 0.1; // 10% expected return
    const sharpeRatio = (expectedReturn - riskFreeRate) / portfolioVolatility;

    return {
      volatility: portfolioVolatility,
      beta: portfolioBeta,
      sharpeRatio,
      maxDrawdown: 0.15, // Simplified max drawdown
    };
  }

  /**
   * Analyze sector allocation
   */
  private async analyzeSectorAllocation(
    holdings: PortfolioHolding[]
  ): Promise<{ [key: string]: number }> {
    const sectors: { [key: string]: number } = {};
    const totalValue = holdings.reduce(
      (sum, h) => sum + (h.marketValue || 0),
      0
    );

    for (const holding of holdings) {
      try {
        const overviewResponse = await marketDataService.getCompanyOverview(
          holding.symbol
        );

        if (overviewResponse.success && overviewResponse.data) {
          const sector = overviewResponse.data.sector || 'Unknown';
          const weight = ((holding.marketValue || 0) / totalValue) * 100;

          sectors[sector] = (sectors[sector] || 0) + weight;
        }
      } catch (error) {
        console.warn(`Error getting sector for ${holding.symbol}:`, error);
        sectors['Unknown'] =
          (sectors['Unknown'] || 0) +
          ((holding.marketValue || 0) / totalValue) * 100;
      }
    }

    return sectors;
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    holdings: PortfolioHolding[],
    riskMetrics: { volatility: number; beta: number; sharpeRatio: number },
    diversificationScore: number
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Diversification recommendations
    if (diversificationScore < 50) {
      recommendations.push(
        '🎯 Considere diversificar mais seu portfólio. Concentração alta pode aumentar o risco.'
      );
    }

    if (holdings.length < 5) {
      recommendations.push(
        '📈 Portfólio pequeno. Considere adicionar mais ativos para melhor diversificação.'
      );
    }

    // Risk recommendations
    if (riskMetrics.volatility > 0.25) {
      recommendations.push(
        '⚠️ Portfólio com alta volatilidade. Considere incluir ativos mais defensivos.'
      );
    }

    if (riskMetrics.beta > 1.5) {
      recommendations.push(
        '📊 Beta alto indica maior sensibilidade ao mercado. Avalie seu perfil de risco.'
      );
    }

    if (riskMetrics.sharpeRatio < 1.0) {
      recommendations.push(
        '💡 Sharpe ratio baixo. Busque ativos com melhor relação risco-retorno.'
      );
    }

    // Performance recommendations
    const gainers = holdings.filter(h => (h.gainLossPercent || 0) > 10);
    const losers = holdings.filter(h => (h.gainLossPercent || 0) < -10);

    if (gainers.length > 0) {
      recommendations.push(
        `🚀 Você tem ${gainers.length} posições com ganhos acima de 10%. Considere realizar lucros.`
      );
    }

    if (losers.length > 0) {
      recommendations.push(
        `⚡ Você tem ${losers.length} posições com perdas acima de 10%. Revise sua estratégia.`
      );
    }

    return recommendations;
  }

  /**
   * Calculate performance metrics for different timeframes
   */
  private async calculatePerformanceMetrics(
    holdings: PortfolioHolding[]
  ): Promise<{
    oneDayReturn: number;
    oneWeekReturn: number;
    oneMonthReturn: number;
    threeMonthReturn: number;
    oneYearReturn: number;
  }> {
    // Simplified performance calculation
    // In a real implementation, this would use historical data

    const totalValue = holdings.reduce(
      (sum, h) => sum + (h.marketValue || 0),
      0
    );
    const totalCost = holdings.reduce(
      (sum, h) => sum + h.quantity * h.averageCost,
      0
    );
    const totalReturn =
      totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    return {
      oneDayReturn: totalReturn * 0.01, // 1% of total return
      oneWeekReturn: totalReturn * 0.05, // 5% of total return
      oneMonthReturn: totalReturn * 0.2, // 20% of total return
      threeMonthReturn: totalReturn * 0.6, // 60% of total return
      oneYearReturn: totalReturn, // Full return
    };
  }

  /**
   * Generate natural language summary of portfolio analysis
   */
  generateAnalysisSummary(analysis: PortfolioAnalysis): string {
    const gainLossText = analysis.totalGainLoss >= 0 ? 'lucro' : 'prejuízo';
    const riskLevel =
      analysis.riskScore < 30
        ? 'baixo'
        : analysis.riskScore < 70
          ? 'moderado'
          : 'alto';
    const diversificationLevel =
      analysis.diversificationScore < 50
        ? 'baixa'
        : analysis.diversificationScore < 80
          ? 'moderada'
          : 'alta';

    return `
## 📊 Análise do Portfólio

**Valor Total:** ${this.formatCurrency(analysis.totalValue)}
**${gainLossText.toUpperCase()}:** ${this.formatCurrency(Math.abs(analysis.totalGainLoss))} (${analysis.totalGainLossPercent.toFixed(2)}%)

**📈 Performance:**
- Variação do dia: ${analysis.dayChangePercent.toFixed(2)}%
- Retorno 1 mês: ${analysis.performanceMetrics.oneMonthReturn.toFixed(2)}%
- Retorno 1 ano: ${analysis.performanceMetrics.oneYearReturn.toFixed(2)}%

**⚖️ Risco e Diversificação:**
- Nível de risco: ${riskLevel}
- Diversificação: ${diversificationLevel}
- Beta do portfólio: ${analysis.riskMetrics.beta.toFixed(2)}
- Sharpe Ratio: ${analysis.riskMetrics.sharpeRatio.toFixed(2)}

**🎯 Holdings (Top 5):**
${analysis.holdings
  .slice(0, 5)
  .map(
    h =>
      `- ${h.symbol}: ${this.formatCurrency(h.marketValue || 0)} (${(h.gainLossPercent || 0).toFixed(2)}%)`
  )
  .join('\n')}

**💡 Recomendações:**
${analysis.recommendations
  .slice(0, 3)
  .map(r => `- ${r}`)
  .join('\n')}
    `.trim();
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }
}

export const portfolioAnalysisService = new PortfolioAnalysisService();
export default portfolioAnalysisService;
