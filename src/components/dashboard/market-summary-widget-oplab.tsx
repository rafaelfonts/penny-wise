'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getEnhancedOplabService } from '@/lib/services/oplab-enhanced';
import type { Stock, MarketStatus } from '@/lib/services/oplab';

interface MarketSummaryOplabWidgetProps {
  className?: string;
}

interface MarketData {
  marketStatus: MarketStatus;
  topStocks: Stock[];
  totalVolume: number;
  averageChange: number;
  lastUpdated: string;
}

export function MarketSummaryOplabWidget({
  className,
}: MarketSummaryOplabWidgetProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMarketData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(
      () => {
        if (!refreshing) {
          loadMarketData(true);
        }
      },
      2 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [refreshing]);

  const loadMarketData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const oplabService = getEnhancedOplabService();

      // Fetch market status and stocks in parallel
      const [marketStatusResult, stocksResult] = await Promise.all([
        oplabService.getMarketStatusEnhanced(),
        oplabService.getStocksEnhanced(),
      ]);

      if (!marketStatusResult.success) {
        throw new Error(
          marketStatusResult.error || 'Failed to fetch market status'
        );
      }

      if (!stocksResult.success) {
        throw new Error(stocksResult.error || 'Failed to fetch stocks');
      }

      const stocks = stocksResult.data as Stock[];

      // Calculate market metrics
      const totalVolume = stocks.reduce(
        (sum, stock) => sum + (stock.market?.vol || 0),
        0
      );
      const validChanges = stocks.filter(
        s => s.market?.variation !== undefined
      );
      const averageChange =
        validChanges.length > 0
          ? validChanges.reduce(
              (sum, stock) => sum + (stock.market?.variation || 0),
              0
            ) / validChanges.length
          : 0;

      // Sort by volume to get top stocks
      const topStocks = stocks
        .filter(stock => stock.market?.vol > 0)
        .sort((a, b) => (b.market?.vol || 0) - (a.market?.vol || 0))
        .slice(0, 5);

      setMarketData({
        marketStatus: marketStatusResult.data || {
          open: false,
          session: 'closed',
          next_session: '',
          time: '',
        },
        topStocks,
        totalVolume,
        averageChange,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error loading market data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load market data'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getMarketStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <Badge className="bg-green-500 text-white">Aberto</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fechado</Badge>;
      case 'pre-market':
        return <Badge className="bg-blue-500 text-white">Pré-abertura</Badge>;
      case 'after-hours':
        return (
          <Badge className="bg-orange-500 text-white">Pós-fechamento</Badge>
        );
      default:
        return <Badge variant="outline">Status Desconhecido</Badge>;
    }
  };

  if (loading && !marketData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resumo do Mercado (OpLab)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="text-muted-foreground h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2">
              Carregando dados do mercado...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !marketData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resumo do Mercado (OpLab)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => loadMarketData()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
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
            <Activity className="h-5 w-5" />
            Resumo do Mercado (OpLab)
          </div>
          <div className="flex items-center gap-2">
            {marketData?.marketStatus &&
              getMarketStatusBadge(marketData.marketStatus.session)}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMarketData(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">
              Volume Total
            </p>
            <p className="text-2xl font-bold">
              {marketData ? formatVolume(marketData.totalVolume) : '--'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">
              Variação Média
            </p>
            <p
              className={`text-2xl font-bold ${
                (marketData?.averageChange || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {marketData ? formatPercent(marketData.averageChange) : '--'}
            </p>
          </div>
        </div>

        {/* Top Stocks */}
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-sm font-medium">
            Ações com Maior Volume
          </h4>
          <div className="space-y-2">
            {marketData?.topStocks.map(stock => (
              <div
                key={stock.symbol}
                className="bg-muted/50 flex items-center justify-between rounded-lg p-2"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold">{stock.symbol}</p>
                    <p className="text-muted-foreground max-w-32 truncate text-xs">
                      {stock.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(stock.market?.close || 0)}
                  </p>
                  <div className="flex items-center gap-1">
                    {(stock.market?.variation || 0) >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={`text-xs ${
                        (stock.market?.variation || 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatPercent(stock.market?.variation || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Status Info */}
        {marketData?.marketStatus && (
          <div className="space-y-2 border-t pt-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                Sessão atual: {marketData.marketStatus.session}
                {marketData.marketStatus.next_session && (
                  <> • Próxima: {marketData.marketStatus.next_session}</>
                )}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Última atualização:{' '}
              {new Date(marketData.lastUpdated).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
