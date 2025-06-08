'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PortfolioOverview } from '@/lib/types/dashboard'

interface PortfolioOverviewWidgetProps {
  className?: string
}

export function PortfolioOverviewWidget({ className }: PortfolioOverviewWidgetProps) {
  const [portfolio, setPortfolio] = useState<PortfolioOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulando dados do portfólio
    const mockPortfolio: PortfolioOverview = {
      totalValue: 125750.80,
      dailyChange: 2840.50,
      dailyChangePercent: 2.31,
      assets: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100,
          currentPrice: 189.50,
          totalValue: 18950.00,
          dailyChange: 380.00,
          dailyChangePercent: 2.05,
          allocation: 15.1
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          quantity: 75,
          currentPrice: 378.85,
          totalValue: 28413.75,
          dailyChange: 568.13,
          dailyChangePercent: 2.04,
          allocation: 22.6
        },
        {
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          quantity: 50,
          currentPrice: 248.75,
          totalValue: 12437.50,
          dailyChange: -125.50,
          dailyChangePercent: -1.00,
          allocation: 9.9
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          quantity: 85,
          currentPrice: 142.65,
          totalValue: 12125.25,
          dailyChange: 241.05,
          dailyChangePercent: 2.03,
          allocation: 9.6
        },
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          quantity: 40,
          currentPrice: 495.22,
          totalValue: 19808.80,
          dailyChange: 792.32,
          dailyChangePercent: 4.17,
          allocation: 15.7
        }
      ],
      allocation: [
        { category: 'Technology', value: 91735.30, percentage: 72.9, color: '#3b82f6' },
        { category: 'Healthcare', value: 15090.10, percentage: 12.0, color: '#10b981' },
        { category: 'Finance', value: 12563.25, percentage: 10.0, color: '#f59e0b' },
        { category: 'Consumer', value: 6362.15, percentage: 5.1, color: '#ef4444' }
      ],
      performance: []
    }

    setTimeout(() => {
      setPortfolio(mockPortfolio)
      setLoading(false)
    }, 1000)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!portfolio) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No portfolio data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Portfolio Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Value */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Total Value</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</div>
          <div className="flex items-center gap-2">
            {portfolio.dailyChangePercent >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              portfolio.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(portfolio.dailyChange)} ({formatPercent(portfolio.dailyChangePercent)})
            </span>
            <span className="text-xs text-gray-500">today</span>
          </div>
        </div>

        {/* Top Holdings */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Top Holdings</h4>
          <div className="space-y-3">
            {portfolio.assets.slice(0, 4).map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{asset.symbol}</span>
                    <span className="text-xs text-gray-500 truncate">{asset.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">
                      {asset.quantity} shares
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {asset.allocation}%
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(asset.totalValue)}
                  </div>
                  <div className={`text-xs ${
                    asset.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(asset.dailyChangePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Asset Allocation</h4>
          <div className="space-y-2">
            {portfolio.allocation.map((allocation) => (
              <div key={allocation.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: allocation.color }}
                  />
                  <span className="text-sm">{allocation.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{allocation.percentage}%</div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(allocation.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 