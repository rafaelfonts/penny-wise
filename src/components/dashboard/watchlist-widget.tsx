'use client';

import {
  Star,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '@/hooks/use-watchlist';

interface WatchlistWidgetProps {
  className?: string;
  maxItems?: number;
}

export function WatchlistWidget({
  className,
  maxItems = 8,
}: WatchlistWidgetProps) {
  const { watchlist, loading, error, refreshAll } = useWatchlist();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  // Get limited watchlist items with quotes
  const displayItems = watchlist
    .filter(item => item.quote) // Only show items with loaded quotes
    .slice(0, maxItems);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 rounded bg-gray-200"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (displayItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No symbols in watchlist
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Add stocks to your watchlist to track their performance
            </p>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Symbol
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Watchlist
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAll}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          {displayItems.map(item => {
            const quote = item.quote!;
            const isPositive = quote.change >= 0;
            const Icon = isPositive ? TrendingUp : TrendingDown;
            const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

            return (
              <div
                key={item.symbol}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                    <span className="text-xs font-bold text-blue-600">
                      {item.symbol[0]}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.symbol}
                    </div>
                    <div className="text-xs text-gray-500">
                      Vol: {formatVolume(quote.volume)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(quote.price)}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs ${colorClass}`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{formatCurrency(Math.abs(quote.change))}</span>
                    <span>({formatPercent(quote.changePercent)})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {displayItems.length} of {watchlist.length} symbols
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Eye className="mr-1 h-3 w-3" />
                View All
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
