// ==========================================
// ANALYSIS CARD COMPONENT - Visual Analysis Display
// ==========================================

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  XCircle,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StockQuote,
  CompanyOverview,
  TechnicalIndicator,
} from '@/lib/types/market';

interface AnalysisCardProps {
  symbol: string;
  quote?: StockQuote | null;
  overview?: CompanyOverview | null;
  technicals?: {
    rsi: TechnicalIndicator | null;
    macd: TechnicalIndicator | null;
  };
  isLoading?: boolean;
  onViewDetails?: (symbol: string) => void;
}

interface AnalysisSignal {
  type: 'buy' | 'sell' | 'hold';
  strength: number; // 0-100
  reason: string;
}

export function AnalysisCard({
  symbol,
  quote,
  overview,
  technicals,
  isLoading = false,
  onViewDetails,
}: AnalysisCardProps) {
  const generateAnalysisSignal = (): AnalysisSignal => {
    if (!quote) {
      return { type: 'hold', strength: 50, reason: 'Dados insuficientes' };
    }

    let buyScore = 0;
    let sellScore = 0;
    const reasons = [];

    // Price momentum analysis
    if (quote.changePercent > 2) {
      buyScore += 20;
      reasons.push('Momentum positivo forte');
    } else if (quote.changePercent < -2) {
      sellScore += 20;
      reasons.push('Momentum negativo forte');
    }

    // RSI analysis
    if (technicals?.rsi && technicals.rsi.data.length > 0) {
      const rsiValue = technicals.rsi.data[0].value;
      if (rsiValue < 30) {
        buyScore += 25;
        reasons.push('RSI em sobrevenda');
      } else if (rsiValue > 70) {
        sellScore += 25;
        reasons.push('RSI em sobrecompra');
      }
    }

    // Volume analysis
    if (quote.volume > 1000000) {
      // Simplified volume check without averageVolume
      buyScore += 15;
      reasons.push('Volume significativo');
    }

    // Fundamental analysis
    if (overview) {
      if (overview.peRatio && overview.peRatio < 15) {
        buyScore += 10;
        reasons.push('P/L atrativo');
      } else if (overview.peRatio && overview.peRatio > 30) {
        sellScore += 10;
        reasons.push('P/L elevado');
      }

      if (overview.returnOnEquityTTM && overview.returnOnEquityTTM > 0.15) {
        buyScore += 10;
        reasons.push('ROE sólido');
      }
    }

    const netScore = buyScore - sellScore;
    if (netScore > 30) {
      return {
        type: 'buy',
        strength: Math.min(80 + netScore - 30, 100),
        reason: reasons.join(', '),
      };
    } else if (netScore < -30) {
      return {
        type: 'sell',
        strength: Math.min(80 + Math.abs(netScore) - 30, 100),
        reason: reasons.join(', '),
      };
    } else {
      return {
        type: 'hold',
        strength: 50 + Math.abs(netScore),
        reason: reasons.join(', ') || 'Sinais mistos',
      };
    }
  };

  const getSignalIcon = (type: AnalysisSignal['type']) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4" />;
      case 'hold':
        return <Minus className="h-4 w-4" />;
    }
  };

  const getSignalColor = (type: AnalysisSignal['type']) => {
    switch (type) {
      case 'buy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'sell':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'hold':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getRiskLevel = () => {
    if (!quote)
      return { level: 'medium', text: 'Médio', color: 'bg-yellow-500' };

    const volatility = Math.abs(quote.changePercent);
    if (volatility > 5)
      return { level: 'high', text: 'Alto', color: 'bg-red-500' };
    if (volatility < 2)
      return { level: 'low', text: 'Baixo', color: 'bg-green-500' };
    return { level: 'medium', text: 'Médio', color: 'bg-yellow-500' };
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise de {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 animate-pulse rounded bg-gray-200" />
          <div className="h-16 animate-pulse rounded bg-gray-200" />
          <div className="h-12 animate-pulse rounded bg-gray-200" />
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise de {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center justify-center py-8">
            <XCircle className="mr-2 h-8 w-8" />
            Dados não disponíveis para análise
          </div>
        </CardContent>
      </Card>
    );
  }

  const signal = generateAnalysisSignal();
  const risk = getRiskLevel();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise de {symbol}
          </div>
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(symbol)}
            >
              <Eye className="mr-1 h-4 w-4" />
              Detalhes
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trading Signal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Sinal de Trading</h4>
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1',
                getSignalColor(signal.type)
              )}
            >
              {getSignalIcon(signal.type)}
              {signal.type.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Força do Sinal</span>
              <span className="font-medium">{signal.strength}%</span>
            </div>
            <Progress
              value={signal.strength}
              className={cn(
                'h-2',
                signal.type === 'buy' && 'bg-green-100',
                signal.type === 'sell' && 'bg-red-100',
                signal.type === 'hold' && 'bg-yellow-100'
              )}
            />
          </div>

          <p className="text-muted-foreground text-sm">{signal.reason}</p>
        </div>

        {/* Risk Assessment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Avaliação de Risco</h4>
            <div className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full', risk.color)} />
              <span className="text-sm font-medium">{risk.text}</span>
            </div>
          </div>

          <div className="text-muted-foreground text-sm">
            Volatilidade: {Math.abs(quote.changePercent).toFixed(2)}%
            {quote.changePercent > 5 && ' - Alta volatilidade detectada'}
            {quote.changePercent < -5 && ' - Queda significativa'}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Preço Atual</div>
            <div className="font-semibold">${quote.price.toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Variação</div>
            <div
              className={cn(
                'font-semibold',
                quote.change >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {quote.change >= 0 ? '+' : ''}
              {quote.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Technical Indicators */}
        {technicals && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Indicadores Técnicos</h4>
            <div className="space-y-2">
              {technicals.rsi && technicals.rsi.data.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span>RSI (14):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {technicals.rsi.data[0].value.toFixed(1)}
                    </span>
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        technicals.rsi.data[0].value > 70
                          ? 'bg-red-500'
                          : technicals.rsi.data[0].value < 30
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                      )}
                    />
                  </div>
                </div>
              )}

              {technicals.macd && technicals.macd.data.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span>MACD:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {technicals.macd.data[0].value.toFixed(4)}
                    </span>
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        technicals.macd.data[0].value > 0
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fundamental Data */}
        {overview && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Dados Fundamentais</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {overview.peRatio && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/L:</span>
                  <span className="font-medium">
                    {overview.peRatio.toFixed(1)}
                  </span>
                </div>
              )}
              {overview.returnOnEquityTTM && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROE:</span>
                  <span className="font-medium">
                    {(overview.returnOnEquityTTM * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {overview.dividendYield && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dividend:</span>
                  <span className="font-medium">
                    {(overview.dividendYield * 100).toFixed(2)}%
                  </span>
                </div>
              )}
              {quote.marketCap && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap:</span>
                  <span className="font-medium">
                    ${(quote.marketCap / 1e9).toFixed(1)}B
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="text-muted-foreground border-t pt-2 text-xs">
          Análise atualizada em{' '}
          {new Date(quote.timestamp).toLocaleString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
}
