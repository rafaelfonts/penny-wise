// ==========================================
// WATCHLIST DASHBOARD COMPONENT - Market Watchlist Management
// ==========================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuoteCard } from './quote-card';
import { AnalysisCard } from './analysis-card';
import {
  Plus,
  Search,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Star,
  X,
} from 'lucide-react';
import { useWatchlist } from '@/hooks/use-watchlist';

interface WatchlistDashboardProps {
  onAnalyzeSymbol?: (symbol: string) => void;
}

export function WatchlistDashboard({
  onAnalyzeSymbol,
}: WatchlistDashboardProps) {
  const {
    watchlist,
    loading,
    error,
    addSymbol,
    removeSymbol,
    refreshQuote,
    refreshAll,
  } = useWatchlist();

  const [newSymbol, setNewSymbol] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Default popular symbols for demonstration
  const popularSymbols = [
    'AAPL',
    'GOOGL',
    'MSFT',
    'TSLA',
    'AMZN',
    'PETR4',
    'VALE3',
    'ITUB4',
    'BBDC4',
    'MGLU3',
  ];

  const handleAddSymbol = async () => {
    if (!newSymbol.trim()) return;

    setIsAdding(true);
    try {
      const success = await addSymbol(newSymbol.toUpperCase());
      if (success) {
        setNewSymbol('');
      }
    } catch (error) {
      console.error('Error adding symbol:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    try {
      await removeSymbol(symbol);
      if (selectedSymbol === symbol) {
        setSelectedSymbol(null);
      }
    } catch (error) {
      console.error('Error removing symbol:', error);
    }
  };

  const handleRefreshSymbol = async (symbol: string) => {
    try {
      await refreshQuote(symbol);
    } catch (error) {
      console.error('Error refreshing quote:', error);
    }
  };

  const handleRefreshAll = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshAll();
    } catch (error) {
      console.error('Error refreshing all quotes:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredWatchlist = watchlist.filter(
    item =>
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMarketSummary = () => {
    const validQuotes = watchlist
      .filter(item => item.quote)
      .map(item => item.quote!);
    if (validQuotes.length === 0) return null;

    const gainers = validQuotes.filter(q => q.change > 0).length;
    const losers = validQuotes.filter(q => q.change < 0).length;
    const totalValue = validQuotes.reduce((sum, q) => sum + q.price, 0);
    const avgChange =
      validQuotes.reduce((sum, q) => sum + q.changePercent, 0) /
      validQuotes.length;

    return {
      gainers,
      losers,
      totalValue,
      avgChange,
      total: validQuotes.length,
    };
  };

  const summary = getMarketSummary();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-64 rounded bg-gray-200"></div>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded bg-gray-200"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Summary */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-muted-foreground text-xs">
                Ativos acompanhados
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Em Alta</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {summary.gainers}
              </div>
              <div className="text-muted-foreground text-xs">
                Ativos valorizando
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Em Baixa</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {summary.losers}
              </div>
              <div className="text-muted-foreground text-xs">
                Ativos desvalorizando
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Variação Média</span>
              </div>
              <div
                className={`text-2xl font-bold ${summary.avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {summary.avgChange >= 0 ? '+' : ''}
                {summary.avgChange.toFixed(2)}%
              </div>
              <div className="text-muted-foreground text-xs">
                Variação do portfolio
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Symbol and Controls */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex max-w-md flex-1 gap-2">
          <Input
            placeholder="Adicionar símbolo (ex: AAPL, PETR4)"
            value={newSymbol}
            onChange={e => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleAddSymbol()}
            className="flex-1"
          />
          <Button
            onClick={handleAddSymbol}
            disabled={isAdding || !newSymbol.trim()}
            className="whitespace-nowrap"
          >
            {isAdding ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Atualizar Todos
          </Button>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-40 pl-9"
            />
          </div>

          <div className="flex rounded-md border">
            <Button
              variant={view === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('compact')}
              className="rounded-r-none"
            >
              Compacto
            </Button>
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="rounded-none border-x"
            >
              Grid
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="rounded-l-none"
            >
              Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-red-600">Erro: {error}</div>
          </CardContent>
        </Card>
      )}

      {/* Popular Symbols */}
      {watchlist.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Símbolos Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularSymbols.map(symbol => (
                <Button
                  key={symbol}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewSymbol(symbol);
                    handleAddSymbol();
                  }}
                  disabled={isAdding}
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Watchlist Content */}
      {filteredWatchlist.length === 0 && watchlist.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">
              Nenhum resultado encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os termos de busca
            </p>
          </CardContent>
        </Card>
      )}

      {filteredWatchlist.length > 0 && (
        <div className="flex gap-6">
          {/* Watchlist */}
          <div className="flex-1">
            {view === 'compact' && (
              <div className="space-y-2">
                {filteredWatchlist.map(item => (
                  <div key={item.symbol} className="flex items-center gap-2">
                    <div className="flex-1">
                      <QuoteCard
                        symbol={item.symbol}
                        quote={item.quote}
                        isLoading={item.isLoading}
                        variant="compact"
                        onRefresh={handleRefreshSymbol}
                        showActions={false}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSymbol(item.symbol)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSymbol(item.symbol)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {view === 'grid' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWatchlist.map(item => (
                  <div key={item.symbol} className="relative">
                    <QuoteCard
                      symbol={item.symbol}
                      quote={item.quote}
                      isLoading={item.isLoading}
                      variant="default"
                      onRefresh={handleRefreshSymbol}
                      onToggleWatchlist={() => handleRemoveSymbol(item.symbol)}
                      isInWatchlist={true}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSelectedSymbol(item.symbol)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {view === 'list' && (
              <div className="space-y-4">
                {filteredWatchlist.map(item => (
                  <QuoteCard
                    key={item.symbol}
                    symbol={item.symbol}
                    quote={item.quote}
                    isLoading={item.isLoading}
                    variant="detailed"
                    onRefresh={handleRefreshSymbol}
                    onToggleWatchlist={() => handleRemoveSymbol(item.symbol)}
                    isInWatchlist={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Analysis Panel */}
          {selectedSymbol && (
            <div className="w-80">
              <AnalysisCard
                symbol={selectedSymbol}
                quote={
                  watchlist.find(item => item.symbol === selectedSymbol)?.quote
                }
                onViewDetails={onAnalyzeSymbol}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
