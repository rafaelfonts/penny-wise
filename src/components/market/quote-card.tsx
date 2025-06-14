// ==========================================
// QUOTE CARD COMPONENT - Real-time Stock Quote Display
// ==========================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Eye,
  EyeOff,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockQuote } from '@/lib/types/market';

interface QuoteCardProps {
  symbol: string;
  quote?: StockQuote | null;
  isLoading?: boolean;
  onRefresh?: (symbol: string) => void;
  onToggleWatchlist?: (symbol: string) => void;
  isInWatchlist?: boolean;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function QuoteCard({
  symbol,
  quote,
  isLoading = false,
  onRefresh,
  onToggleWatchlist,
  isInWatchlist = false,
  showActions = true,
  variant = 'default',
}: QuoteCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh(symbol);
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const getChangeIcon = () => {
    if (!quote) return null;
    if (quote.change > 0)
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (quote.change < 0)
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = () => {
    if (!quote) return 'text-gray-500';
    if (quote.change > 0) return 'text-green-500';
    if (quote.change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  if (isLoading || !quote) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">{symbol}</span>
            </div>
            {showActions && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                  />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="h-8 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {getChangeIcon()}
                <span className="text-sm font-semibold">{quote.symbol}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">${quote.price.toFixed(2)}</div>
                <div className={cn('text-xs', getChangeColor())}>
                  {quote.change >= 0 ? '+' : ''}
                  {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleWatchlist?.(symbol)}
              >
                {isInWatchlist ? (
                  <Eye className="h-4 w-4 text-blue-500" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getChangeIcon()}
              <div>
                <div className="font-semibold">{quote.symbol}</div>
                <div className="text-muted-foreground text-sm font-normal">
                  {quote.name}
                </div>
              </div>
            </div>
            {showActions && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleWatchlist?.(symbol)}
                >
                  {isInWatchlist ? (
                    <Eye className="h-4 w-4 text-blue-500" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                  />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Price */}
          <div className="space-y-1">
            <div className="text-3xl font-bold">${quote.price.toFixed(2)}</div>
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                getChangeColor()
              )}
            >
              {quote.change >= 0 ? '+' : ''}
              {quote.change.toFixed(2)}({quote.changePercent.toFixed(2)}%)
            </div>
          </div>

          {/* OHLV Data */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abertura:</span>
                <span className="font-medium">${quote.open.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Máxima:</span>
                <span className="font-medium text-green-600">
                  ${quote.high.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fechamento Ant.:</span>
                <span className="font-medium">
                  ${quote.previousClose.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mínima:</span>
                <span className="font-medium text-red-600">
                  ${quote.low.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-between border-t pt-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Volume:
            </div>
            <span className="text-sm font-medium">
              {quote.volume.toLocaleString()}
            </span>
          </div>

          {/* Timestamp */}
          <div className="text-muted-foreground text-xs">
            Atualizado: {new Date(quote.timestamp).toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getChangeIcon()}
            <div>
              <div className="font-semibold">{quote.symbol}</div>
              <div className="text-muted-foreground max-w-[200px] truncate text-sm font-normal">
                {quote.name}
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleWatchlist?.(symbol)}
              >
                {isInWatchlist ? (
                  <Eye className="h-4 w-4 text-blue-500" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Price and Change */}
        <div className="space-y-1">
          <div className="text-2xl font-bold">${quote.price.toFixed(2)}</div>
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              getChangeColor()
            )}
          >
            {quote.change >= 0 ? '+' : ''}
            {quote.change.toFixed(2)}({quote.changePercent.toFixed(2)}%)
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">H/L:</span>
            <span>
              ${quote.high.toFixed(2)} / ${quote.low.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vol:</span>
            <span>{(quote.volume / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
