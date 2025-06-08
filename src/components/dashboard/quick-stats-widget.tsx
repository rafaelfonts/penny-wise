'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface QuickStat {
  id: string
  title: string
  value: string
  change: number
  changePercent: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface QuickStatsWidgetProps {
  className?: string
}

export function QuickStatsWidget({ className }: QuickStatsWidgetProps) {
  const [stats, setStats] = useState<QuickStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuickStats()
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      loadQuickStats()
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadQuickStats = async () => {
    try {
      setLoading(true)
      
      // Mock data - in real app this would come from various APIs
      const mockStats: QuickStat[] = [
        {
          id: 'sp500',
          title: 'S&P 500',
          value: '4,567.89',
          change: 23.45,
          changePercent: 0.52,
          icon: TrendingUp,
          color: 'text-blue-600'
        },
        {
          id: 'nasdaq',
          title: 'NASDAQ',
          value: '14,234.56',
          change: -45.67,
          changePercent: -0.32,
          icon: TrendingDown,
          color: 'text-purple-600'
        },
        {
          id: 'dow',
          title: 'Dow Jones',
          value: '34,567.12',
          change: 156.78,
          changePercent: 0.45,
          icon: BarChart3,
          color: 'text-green-600'
        },
        {
          id: 'vix',
          title: 'VIX',
          value: '18.45',
          change: -1.23,
          changePercent: -6.25,
          icon: Activity,
          color: 'text-orange-600'
        },
        {
          id: 'gold',
          title: 'Gold',
          value: '$1,987.45',
          change: 12.34,
          changePercent: 0.63,
          icon: DollarSign,
          color: 'text-yellow-600'
        },
        {
          id: 'oil',
          title: 'Crude Oil',
          value: '$78.92',
          change: -2.15,
          changePercent: -2.65,
          icon: BarChart3,
          color: 'text-gray-600'
        }
      ]
      
      setStats(mockStats)
    } catch (err) {
      console.error('Error loading quick stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0
    const sign = isPositive ? '+' : ''
    return {
      change: `${sign}${change.toFixed(2)}`,
      percent: `${sign}${changePercent.toFixed(2)}%`,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      bgColor: isPositive ? 'bg-green-50' : 'bg-red-50'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Overview
          </div>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            const changeFormat = formatChange(stat.change, stat.changePercent)
            
            return (
              <div key={stat.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-sm font-medium text-gray-700">{stat.title}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </div>
                  
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeFormat.color} ${changeFormat.bgColor}`}>
                    <span>{changeFormat.change}</span>
                    <span>({changeFormat.percent})</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Market Status */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Market Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-medium">Open</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 