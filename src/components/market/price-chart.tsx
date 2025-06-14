// ==========================================
// PRICE CHART COMPONENT - Simple Price Chart Display
// ==========================================

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IntradayData } from '@/lib/types/market';

interface PriceChartProps {
  symbol: string;
  data: IntradayData[];
  period?: '1D' | '5D' | '1M' | '3M' | '1Y';
  onPeriodChange?: (period: string) => void;
  onFullscreen?: () => void;
  height?: number;
  showControls?: boolean;
}

export function PriceChart({
  symbol,
  data,
  period = '1D',
  onPeriodChange,
  onFullscreen,
  height = 300,
  showControls = true,
}: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // IntradayData contains an array, so we need to extract the actual data points
    const allDataPoints = data.flatMap(item =>
      item.data.map(point => ({
        timestamp: point.timestamp,
        close: point.close,
        volume: point.volume,
        open: point.open,
        high: point.high,
        low: point.low,
      }))
    );

    const sortedData = allDataPoints.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (sortedData.length === 0) return null;

    const prices = sortedData.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) return null;

    const chartWidth = 100;
    const chartHeight = 100;
    const padding = 5;

    const points = sortedData.map((item, index) => {
      const x =
        padding +
        (index / (sortedData.length - 1)) * (chartWidth - 2 * padding);
      const y =
        padding +
        ((maxPrice - item.close) / priceRange) * (chartHeight - 2 * padding);
      return {
        x,
        y,
        price: item.close,
        timestamp: item.timestamp,
        volume: item.volume,
      };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    // Calculate trend
    const firstPrice = sortedData[0]?.close || 0;
    const lastPrice = sortedData[sortedData.length - 1]?.close || 0;
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    return {
      points,
      pathData,
      minPrice,
      maxPrice,
      priceRange,
      firstPrice,
      lastPrice,
      change,
      changePercent,
      viewBox: `0 0 ${chartWidth} ${chartHeight}`,
      totalDataPoints: sortedData.length,
    };
  }, [data]);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!chartData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gráfico de {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center rounded border-2 border-dashed border-gray-200 bg-gray-50"
            style={{ height: `${height}px` }}
          >
            <div className="text-muted-foreground text-center">
              <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>Dados do gráfico não disponíveis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = chartData.change >= 0;
  const lineColor = isPositive ? '#10b981' : '#ef4444';
  const fillColor = isPositive
    ? 'rgba(16, 185, 129, 0.1)'
    : 'rgba(239, 68, 68, 0.1)';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <div>
              <span>Gráfico de {symbol}</span>
              <div className="text-muted-foreground text-sm font-normal">
                {period} • {data.length} pontos
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-semibold">
                {formatPrice(chartData.lastPrice)}
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? '+' : ''}
                {chartData.change.toFixed(2)} (
                {chartData.changePercent.toFixed(2)}%)
              </div>
            </div>

            {onFullscreen && (
              <Button variant="outline" size="sm" onClick={onFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Period Controls */}
        {showControls && onPeriodChange && (
          <div className="flex gap-1 rounded bg-gray-100 p-1">
            {['1D', '5D', '1M', '3M', '1Y'].map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPeriodChange(p)}
                className="flex-1"
              >
                {p}
              </Button>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="relative">
          <svg
            width="100%"
            height={height}
            viewBox={chartData.viewBox}
            className="rounded border bg-white"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Area under curve */}
            <path
              d={`${chartData.pathData} L ${chartData.points[chartData.points.length - 1]?.x} 100 L ${chartData.points[0]?.x} 100 Z`}
              fill={fillColor}
            />

            {/* Price line */}
            <path
              d={chartData.pathData}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {chartData.points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill={lineColor}
                className="cursor-pointer opacity-0 transition-opacity hover:opacity-100"
              >
                <title>
                  {formatTime(point.timestamp)}: {formatPrice(point.price)}
                </title>
              </circle>
            ))}
          </svg>

          {/* Price labels */}
          <div className="text-muted-foreground absolute top-2 left-2 text-xs">
            {formatPrice(chartData.maxPrice)}
          </div>
          <div className="text-muted-foreground absolute bottom-2 left-2 text-xs">
            {formatPrice(chartData.minPrice)}
          </div>

          {/* Time labels */}
          <div className="text-muted-foreground absolute bottom-2 left-4 text-xs">
            {formatTime(chartData.points[0]?.timestamp || '')}
          </div>
          <div className="text-muted-foreground absolute right-4 bottom-2 text-xs">
            {formatTime(
              chartData.points[chartData.points.length - 1]?.timestamp || ''
            )}
          </div>
        </div>

        {/* Chart Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Abertura</div>
            <div className="font-medium">
              {formatPrice(chartData.firstPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Máxima</div>
            <div className="font-medium text-green-600">
              {formatPrice(chartData.maxPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Mínima</div>
            <div className="font-medium text-red-600">
              {formatPrice(chartData.minPrice)}
            </div>
          </div>
        </div>

        {/* Volume Info */}
        {chartData && chartData.totalDataPoints > 0 && (
          <div className="text-muted-foreground text-center text-xs">
            Volume médio:{' '}
            {(
              chartData.points.reduce((sum, p) => sum + p.volume, 0) /
              chartData.points.length
            ).toLocaleString()}{' '}
            ações
          </div>
        )}
      </CardContent>
    </Card>
  );
}
