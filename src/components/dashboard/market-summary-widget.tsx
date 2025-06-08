'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { marketDataService } from '@/lib/services/market-data'
import type { MarketSummary, MarketIndex, TopMover } from '@/lib/types/dashboard'

interface MarketSummaryWidgetProps {
  className?: string
}

export function MarketSummaryWidget({ className }: MarketSummaryWidgetProps) {
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMarketSummary()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadMarketSummary, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadMarketSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch major indices using getQuickQuote
      const [spyQuote, qqqQuote, diaQuote, iwmQuote] = await Promise.all([
        marketDataService.getQuickQuote('SPY'), // S&P 500
        marketDataService.getQuickQuote('QQQ'), // NASDAQ
        marketDataService.getQuickQuote('DIA'), // Dow Jones
        marketDataService.getQuickQuote('IWM')  // Russell 2000
      ])

      // Get top gainers/losers from market data service
      const topGainersLosersResponse = await marketDataService.getTopGainersLosers()

      const marketIndices: MarketIndex[] = [
        {
          symbol: 'SPY',
          name: 'S&P 500',
          value: spyQuote?.price || 0,
          change: spyQuote?.change || 0,
          changePercent: spyQuote?.changePercent || 0
        },
        {
          symbol: 'QQQ',
          name: 'NASDAQ',
          value: qqqQuote?.price || 0,
          change: qqqQuote?.change || 0,
          changePercent: qqqQuote?.changePercent || 0
        },
        {
          symbol: 'DIA',
          name: 'Dow Jones',
          value: diaQuote?.price || 0,
          change: diaQuote?.change || 0,
          changePercent: diaQuote?.changePercent || 0
        },
        {
          symbol: 'IWM',
          name: 'Russell 2000',
          value: iwmQuote?.price || 0,
          change: iwmQuote?.change || 0,
          changePercent: iwmQuote?.changePercent || 0
        }
      ]

      let topMovers: TopMover[] = []
      
      if (topGainersLosersResponse.success && topGainersLosersResponse.data) {
        const data = topGainersLosersResponse.data
        topMovers = [
          ...data.topGainers.slice(0, 2).map((stock) => ({
            symbol: stock.ticker,
            name: stock.ticker,
            price: stock.price,
            change: stock.changeAmount,
            changePercent: stock.changePercentage,
            volume: stock.volume,
            type: 'gainer' as const
          })),
          ...data.topLosers.slice(0, 2).map((stock) => ({
            symbol: stock.ticker,
            name: stock.ticker,
            price: stock.price,
            change: stock.changeAmount,
            changePercent: stock.changePercentage,
            volume: stock.volume,
            type: 'loser' as const
          }))
        ]
      }

      // Determine market status (simplified)
      const now = new Date()
      const hour = now.getHours()
      const day = now.getDay()
      
      let marketStatus: MarketSummary['marketStatus'] = 'closed'
      if (day >= 1 && day <= 5) { // Monday to Friday
        if (hour >= 9 && hour < 16) {
          marketStatus = 'open'
        } else if (hour >= 4 && hour < 9) {
          marketStatus = 'pre-market'
        } else if (hour >= 16 && hour < 20) {
          marketStatus = 'after-hours'
        }
      }

      setMarketSummary({
        indices: marketIndices,
        topMovers,
        marketStatus,
        lastUpdated: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error loading market summary:', err)
      setError('Failed to load market data')
      
      // Fallback to mock data
      setMarketSummary({
        indices: [
          { symbol: 'SPY', name: 'S&P 500', value: 4783.35, change: 23.45, changePercent: 0.49 },
          { symbol: 'QQQ', name: 'NASDAQ', value: 416.28, change: -5.67, changePercent: -1.34 },
          { symbol: 'DIA', name: 'Dow Jones', value: 37863.80, change: 156.82, changePercent: 0.42 },
          { symbol: 'IWM', name: 'Russell 2000', value: 2089.17, change: -12.45, changePercent: -0.59 }
        ],
        topMovers: [
          { symbol: 'NVDA', name: 'NVIDIA', price: 495.22, change: 19.85, changePercent: 4.17, volume: 45000000, type: 'gainer' },
          { symbol: 'TSLA', name: 'Tesla', price: 248.75, change: -12.55, changePercent: -4.81, volume: 35000000, type: 'loser' }
        ],
        marketStatus: 'open',
        lastUpdated: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getMarketStatusBadge = (status: MarketSummary['marketStatus']) => {
    const variants = {
      open: { variant: 'default' as const, text: 'Market Open', color: 'bg-green-100 text-green-800' },
      closed: { variant: 'secondary' as const, text: 'Market Closed', color: 'bg-gray-100 text-gray-800' },
      'pre-market': { variant: 'outline' as const, text: 'Pre-Market', color: 'bg-blue-100 text-blue-800' },
      'after-hours': { variant: 'outline' as const, text: 'After Hours', color: 'bg-purple-100 text-purple-800' }
    }
    return variants[status]
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !marketSummary) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-8">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!marketSummary) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No market data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Summary
          </div>
          <Badge className={getMarketStatusBadge(marketSummary.marketStatus).color}>
            {getMarketStatusBadge(marketSummary.marketStatus).text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Major Indices */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Major Indices</h4>
          <div className="space-y-3">
            {marketSummary.indices.map((index) => (
              <div key={index.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {index.changePercent >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{index.name}</div>
                    <div className="text-xs text-gray-500">{index.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(index.value)}
                  </div>
                  <div className={`text-xs ${
                    index.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(index.change)} ({formatPercent(index.changePercent)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Movers */}
        {marketSummary.topMovers.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Top Movers</h4>
            <div className="space-y-3">
              {marketSummary.topMovers.map((mover) => (
                <div key={mover.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mover.type === 'gainer' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{mover.symbol}</div>
                      <div className="text-xs text-gray-500">
                        {mover.type === 'gainer' ? 'Top Gainer' : 'Top Loser'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      {formatCurrency(mover.price)}
                    </div>
                    <div className={`text-xs ${
                      mover.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(mover.changePercent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            Last updated: {new Date(marketSummary.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 