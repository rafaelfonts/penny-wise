// ==========================================
// MARKET PAGE - UI Components Demonstration
// ==========================================

'use client'

import { useState } from 'react'
import { QuoteCard, AnalysisCard, WatchlistDashboard, PriceChart } from '@/components/market'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, BarChart3, Eye, Zap } from 'lucide-react'
import { StockQuote, IntradayData } from '@/lib/types/market'

export default function MarketPage() {
  const [selectedDemo, setSelectedDemo] = useState<'quote' | 'analysis' | 'watchlist' | 'chart'>('quote')

  // Mock data for demonstrations
  const mockQuote: StockQuote = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 150.25,
    change: 2.15,
    changePercent: 1.45,
    volume: 45234567,
    marketCap: 2400000000000,
    high: 151.00,
    low: 147.80,
    open: 148.10,
    previousClose: 148.10,
    timestamp: new Date().toISOString(),
    source: 'alpha_vantage'
  }

  const mockIntradayData: IntradayData[] = [{
    symbol: 'AAPL',
    interval: '5min',
    data: Array.from({ length: 78 }, (_, i) => {
      const basePrice = 150
      const variation = Math.sin(i * 0.1) * 2 + Math.random() * 1
      const timestamp = new Date(Date.now() - (78 - i) * 5 * 60 * 1000).toISOString()
      return {
        timestamp,
        open: basePrice + variation - 0.5,
        high: basePrice + variation + 0.5,
        low: basePrice + variation - 1,
        close: basePrice + variation,
        volume: Math.floor(500000 + Math.random() * 1000000)
      }
    }),
    lastRefreshed: new Date().toISOString(),
    source: 'alpha_vantage'
  }]



  const demos = [
    {
      id: 'quote' as const,
      title: 'Quote Card',
      description: 'Componente de cotação em tempo real',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'analysis' as const,
      title: 'Analysis Card',
      description: 'Interface de análise visual',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'watchlist' as const,
      title: 'Watchlist Dashboard',
      description: 'Dashboard de watchlist completo',
      icon: <Eye className="w-5 h-5" />
    },
    {
      id: 'chart' as const,
      title: 'Price Chart',
      description: 'Gráficos de preços integrados',
      icon: <Zap className="w-5 h-5" />
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Market UI Components</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Demonstração dos componentes visuais para análise de mercado implementados na Priority 3 do Day 4
        </p>
      </div>

      {/* Demo Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione um Componente para Demonstrar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demos.map(demo => (
              <Button
                key={demo.id}
                variant={selectedDemo === demo.id ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col gap-2"
                onClick={() => setSelectedDemo(demo.id)}
              >
                {demo.icon}
                <div className="text-center">
                  <div className="font-semibold">{demo.title}</div>
                  <div className="text-xs text-muted-foreground">{demo.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Content */}
      <div className="space-y-6">
        {selectedDemo === 'quote' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Quote Card - Componente de Cotação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Variante Compacta</h3>
                <QuoteCard
                  symbol="AAPL"
                  quote={mockQuote}
                  variant="compact"
                  onRefresh={async () => console.log('Refresh clicked')}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Variante Padrão</h3>
                <QuoteCard
                  symbol="AAPL"
                  quote={mockQuote}
                  variant="default"
                  onRefresh={async () => console.log('Refresh clicked')}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Variante Detalhada</h3>
                <QuoteCard
                  symbol="AAPL"
                  quote={mockQuote}
                  variant="detailed"
                  onRefresh={async () => console.log('Refresh clicked')}
                />
              </div>
            </div>
          </div>
        )}

        {selectedDemo === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analysis Card - Interface de Análise</h2>
            <div className="max-w-md mx-auto">
              <AnalysisCard
                symbol="AAPL"
                quote={mockQuote}
                overview={{
                  symbol: 'AAPL',
                  name: 'Apple Inc.',
                  description: 'Technology company',
                  sector: 'Technology',
                  industry: 'Consumer Electronics',
                  marketCapitalization: 2400000000000,
                  peRatio: 28.5,
                  pegRatio: 1.2,
                  bookValue: 4.2,
                  dividendPerShare: 0.92,
                  dividendYield: 0.005,
                  eps: 6.05,
                  revenuePerShareTTM: 24.3,
                  profitMargin: 0.25,
                  operatingMarginTTM: 0.30,
                  returnOnAssetsTTM: 0.20,
                  returnOnEquityTTM: 0.15,
                  revenueTTM: 394000000000,
                  grossProfitTTM: 170000000000,
                  dilutedEPSTTM: 6.05,
                  quarterlyEarningsGrowthYOY: 0.08,
                  quarterlyRevenueGrowthYOY: 0.05,
                  analystTargetPrice: 165,
                  trailingPE: 28.5,
                  forwardPE: 26.2,
                  priceToSalesRatioTTM: 6.1,
                  priceToBookRatio: 35.8,
                  evToRevenue: 6.2,
                  evToEbitda: 18.5,
                  beta: 1.2,
                  week52High: 182.94,
                  week52Low: 124.17,
                  day50MovingAverage: 148.2,
                  day200MovingAverage: 155.8,
                  sharesOutstanding: 16000000000,
                  sharesFloat: 15900000000,
                  sharesShort: 100000000,
                  sharesShortPriorMonth: 105000000,
                  shortRatio: 1.2,
                  shortPercentOutstanding: 0.006,
                  shortPercentFloat: 0.006,
                  percentInsiders: 0.07,
                  percentInstitutions: 0.60,
                  forwardAnnualDividendRate: 0.96,
                  forwardAnnualDividendYield: 0.006,
                  payoutRatio: 0.16,
                  dividendDate: '2023-11-16',
                  exDividendDate: '2023-11-10',
                  lastSplitFactor: '4:1',
                  lastSplitDate: '2020-08-31',
                  source: 'alpha_vantage'
                }}
                technicals={{
                  rsi: {
                    symbol: 'AAPL',
                    indicator: 'RSI',
                    data: [{ date: '2024-01-15', value: 65.2 }],
                    parameters: { period: 14 },
                    source: 'alpha_vantage'
                  },
                  macd: {
                    symbol: 'AAPL',
                    indicator: 'MACD',
                    data: [{ date: '2024-01-15', value: 0.0045 }],
                    parameters: { fast: 12, slow: 26, signal: 9 },
                    source: 'alpha_vantage'
                  }
                }}
                onViewDetails={() => console.log('View details clicked')}
              />
            </div>
          </div>
        )}

        {selectedDemo === 'watchlist' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Watchlist Dashboard - Dashboard de Mercado</h2>
            <WatchlistDashboard
              onAnalyzeSymbol={(symbol) => console.log('Analyze:', symbol)}
            />
          </div>
        )}

        {selectedDemo === 'chart' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Price Chart - Gráficos de Preços</h2>
            <div className="max-w-4xl mx-auto">
              <PriceChart
                symbol="AAPL"
                data={mockIntradayData}
                period="1D"
                onPeriodChange={(period) => console.log('Period changed:', period)}
                onFullscreen={() => console.log('Fullscreen clicked')}
                height={400}
              />
            </div>
          </div>
        )}
      </div>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Implementação - Day 4 Priority 3</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">✅ Componentes Implementados</h4>
              <ul className="space-y-1 text-sm">
                <li>• QuoteCard - Cotação em tempo real (3 variantes)</li>
                <li>• AnalysisCard - Interface de análise visual</li>
                <li>• WatchlistDashboard - Dashboard completo</li>
                <li>• PriceChart - Gráficos SVG responsivos</li>
                <li>• Components UI base (Badge, Progress)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600">🔧 Funcionalidades</h4>
              <ul className="space-y-1 text-sm">
                <li>• Estados de loading e erro</li>
                <li>• Múltiplas variantes de visualização</li>
                <li>• Integração com market data APIs</li>
                <li>• Responsividade completa</li>
                <li>• Análise técnica automatizada</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 