'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketContext {
  symbols: string[];
  prices: Record<string, number>;
  changes: Record<string, number>;
  changePercents: Record<string, number>;
  volume: Record<string, number>;
  lastUpdated: string;
  source: string;
}

interface MarketContextCardProps {
  marketContext: MarketContext;
  className?: string;
}

export function MarketContextCard({ marketContext, className }: MarketContextCardProps) {
  if (!marketContext.symbols || marketContext.symbols.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={cn('border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
          📊 Dados de Mercado
          <Badge variant="outline" className="text-xs">
            {marketContext.source}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {marketContext.symbols.map((symbol) => {
          const price = marketContext.prices[symbol];
          const change = marketContext.changes[symbol];
          const changePercent = marketContext.changePercents[symbol];
          const volume = marketContext.volume[symbol];

          if (!price) return null;

          const isPositive = change >= 0;
          const isNeutral = change === 0;

          return (
            <div
              key={symbol}
              className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {symbol}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(price)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Change indicator */}
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                  isPositive && !isNeutral
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : isNeutral
                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                )}>
                  {isNeutral ? (
                    <Minus className="h-3 w-3" />
                  ) : isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {isPositive && !isNeutral ? '+' : ''}{change.toFixed(2)}
                  </span>
                  <span className="text-xs">
                    ({isPositive && !isNeutral ? '+' : ''}{changePercent.toFixed(2)}%)
                  </span>
                </div>

                {/* Volume indicator (if available) */}
                {volume > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Vol: {volume.toLocaleString('pt-BR', { notation: 'compact' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer with timestamp */}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Clock className="h-3 w-3" />
          <span>Última atualização: {formatTime(marketContext.lastUpdated)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for inline display
export function InlineMarketContext({ marketContext }: MarketContextCardProps) {
  if (!marketContext.symbols || marketContext.symbols.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  return (
    <div className="inline-flex flex-wrap gap-2 my-2">
      {marketContext.symbols.map((symbol) => {
        const price = marketContext.prices[symbol];
        const change = marketContext.changes[symbol];
        const changePercent = marketContext.changePercents[symbol];

        if (!price) return null;

        const isPositive = change >= 0;
        const isNeutral = change === 0;

        return (
          <Badge
            key={symbol}
            variant="outline"
            className={cn(
              'text-xs font-medium',
              isPositive && !isNeutral
                ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400'
                : isNeutral
                ? 'border-gray-300 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400'
                : 'border-red-300 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400'
            )}
          >
            <span className="font-semibold">{symbol}</span>
            <span className="mx-1">•</span>
            <span>{formatPrice(price)}</span>
            <span className="ml-1">
              {isPositive && !isNeutral ? '↗' : isNeutral ? '→' : '↘'}
              {changePercent.toFixed(1)}%
            </span>
          </Badge>
        );
      })}
    </div>
  );
} 