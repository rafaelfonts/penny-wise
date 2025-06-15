'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  Wallet,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getEnhancedOplabService } from '@/lib/services/oplab-enhanced';
import type { Portfolio, Stock } from '@/lib/services/oplab';

interface PortfolioOplabWidgetProps {
  className?: string;
}

interface EnhancedPortfolio extends Omit<Portfolio, 'positions'> {
  totalValue?: number;
  totalChange?: number;
  totalChangePercent?: number;
  positions?: Array<{
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    totalValue: number;
    change: number;
    changePercent: number;
    allocation: number;
  }>;
}

export function PortfolioOplabWidget({ className }: PortfolioOplabWidgetProps) {
  const [portfolios, setPortfolios] = useState<EnhancedPortfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] =
    useState<EnhancedPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPortfolioData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const oplabService = getEnhancedOplabService();

        // Fetch portfolios
        const portfoliosResult = await oplabService.getPortfoliosEnhanced();

        if (!portfoliosResult.success) {
          throw new Error(
            portfoliosResult.error || 'Failed to fetch portfolios'
          );
        }

        const portfolioData = portfoliosResult.data as Portfolio[];

        // For demonstration, we'll create mock positions for the first portfolio
        // In a real implementation, you'd fetch actual portfolio positions
        const enhancedPortfolios: EnhancedPortfolio[] = await Promise.all(
          portfolioData.map(async portfolio => {
            // Mock positions for demonstration
            const mockPositions = [
              { symbol: 'PETR4', quantity: 100 },
              { symbol: 'VALE3', quantity: 200 },
              { symbol: 'ITUB4', quantity: 300 },
              { symbol: 'ABEV3', quantity: 150 },
            ];

            try {
              // Fetch current prices for positions
              const stockPromises = mockPositions.map(pos =>
                oplabService.getStockEnhanced(pos.symbol)
              );
              const stockResults = await Promise.all(stockPromises);

              const positions = mockPositions.map((pos, index) => {
                const stockResult = stockResults[index];
                const stock = stockResult.success
                  ? (stockResult.data as Stock)
                  : null;

                const currentPrice = stock?.market?.close || 0;
                const change = stock?.market?.variation || 0;
                const totalValue = pos.quantity * currentPrice;

                return {
                  symbol: pos.symbol,
                  name: stock?.name || pos.symbol,
                  quantity: pos.quantity,
                  currentPrice,
                  totalValue,
                  change: totalValue * (change / 100),
                  changePercent: change,
                  allocation: 0, // Will be calculated below
                };
              });

              // Calculate total value and allocations
              const totalValue = positions.reduce(
                (sum, pos) => sum + pos.totalValue,
                0
              );
              const totalChange = positions.reduce(
                (sum, pos) => sum + pos.change,
                0
              );
              const totalChangePercent =
                totalValue > 0
                  ? (totalChange / (totalValue - totalChange)) * 100
                  : 0;

              // Update allocations
              positions.forEach(pos => {
                pos.allocation =
                  totalValue > 0 ? (pos.totalValue / totalValue) * 100 : 0;
              });

              return {
                ...portfolio,
                totalValue,
                totalChange,
                totalChangePercent,
                positions,
              };
            } catch (error) {
              console.error(`Error loading portfolio ${portfolio.id}:`, error);
              return {
                ...portfolio,
                totalValue: 0,
                totalChange: 0,
                totalChangePercent: 0,
                positions: [],
              };
            }
          })
        );

        setPortfolios(enhancedPortfolios);

        // Select default portfolio if none selected
        if (!selectedPortfolio && enhancedPortfolios.length > 0) {
          const defaultPortfolio =
            enhancedPortfolios.find(p => p.is_default) || enhancedPortfolios[0];
          setSelectedPortfolio(defaultPortfolio);
        } else if (selectedPortfolio) {
          // Update selected portfolio with fresh data
          const updatedSelected = enhancedPortfolios.find(
            p => p.id === selectedPortfolio.id
          );
          if (updatedSelected) {
            setSelectedPortfolio(updatedSelected);
          }
        }
      } catch (err) {
        console.error('Error loading portfolio data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load portfolio data'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedPortfolio]
  );

  useEffect(() => {
    loadPortfolioData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(
      () => {
        if (!refreshing) {
          loadPortfolioData(true);
        }
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [loadPortfolioData, refreshing]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && portfolios.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfólio (OpLab)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="text-muted-foreground h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2">
              Carregando portfólio...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && portfolios.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfólio (OpLab)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => loadPortfolioData()} variant="outline">
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
            <Wallet className="h-5 w-5" />
            Portfólio (OpLab)
          </div>
          <div className="flex items-center gap-2">
            {portfolios.length > 1 && (
              <select
                value={selectedPortfolio?.id || ''}
                onChange={e => {
                  const portfolio = portfolios.find(
                    p => p.id === parseInt(e.target.value)
                  );
                  setSelectedPortfolio(portfolio || null);
                }}
                className="rounded border px-2 py-1 text-sm"
              >
                {portfolios.map(portfolio => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name || `Portfólio ${portfolio.id}`}
                  </option>
                ))}
              </select>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadPortfolioData(true)}
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
        {selectedPortfolio ? (
          <>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">
                  Valor Total
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedPortfolio.totalValue || 0)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">
                  Variação Hoje
                </p>
                <div className="flex items-center gap-2">
                  {(selectedPortfolio.totalChangePercent || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <div
                    className={`text-right ${
                      (selectedPortfolio.totalChangePercent || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    <p className="font-bold">
                      {formatCurrency(selectedPortfolio.totalChange || 0)}
                    </p>
                    <p className="text-sm">
                      {formatPercent(selectedPortfolio.totalChangePercent || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Status */}
            <div className="flex items-center gap-4">
              <Badge
                variant={selectedPortfolio.active ? 'default' : 'secondary'}
              >
                {selectedPortfolio.active ? 'Ativo' : 'Inativo'}
              </Badge>
              {selectedPortfolio.is_default && (
                <Badge variant="outline">Padrão</Badge>
              )}
              <span className="text-muted-foreground text-sm">
                {selectedPortfolio.positions?.length || 0} posições
              </span>
            </div>

            {/* Positions */}
            {selectedPortfolio.positions &&
            selectedPortfolio.positions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <PieChart className="h-4 w-4" />
                  Posições
                </h4>
                <div className="space-y-3">
                  {selectedPortfolio.positions.map(position => (
                    <div key={position.symbol} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {position.symbol}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {position.quantity} ações
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatCurrency(position.totalValue)}
                          </p>
                          <div className="flex items-center gap-1">
                            {position.changePercent >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={`text-xs ${
                                position.changePercent >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {formatPercent(position.changePercent)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground flex justify-between text-xs">
                          <span>Alocação</span>
                          <span>{position.allocation.toFixed(1)}%</span>
                        </div>
                        <Progress value={position.allocation} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-8 text-center">
                <div className="text-muted-foreground">
                  <PieChart className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Nenhuma posição encontrada</p>
                  <p className="text-sm">Este portfólio está vazio</p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Posição
                </Button>
              </div>
            )}

            {/* Portfolio Info */}
            <div className="space-y-1 border-t pt-4">
              <p className="text-muted-foreground text-xs">
                Criado em:{' '}
                {new Date(selectedPortfolio.created_at).toLocaleDateString(
                  'pt-BR'
                )}
              </p>
              <p className="text-muted-foreground text-xs">
                Última atualização:{' '}
                {new Date(selectedPortfolio.updated_at).toLocaleDateString(
                  'pt-BR'
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4 p-8 text-center">
            <div className="text-muted-foreground">
              <Wallet className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Nenhum portfólio encontrado</p>
              <p className="text-sm">
                Crie seu primeiro portfólio para começar
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Criar Portfólio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
