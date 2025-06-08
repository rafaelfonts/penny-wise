'use client'

import { Bell, TrendingUp, BarChart3, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AlertStats } from '@/lib/types/alerts'

interface AlertStatsProps {
  stats: AlertStats
}

export function AlertStats({ stats }: AlertStatsProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price':
        return TrendingUp
      case 'volume':
        return BarChart3
      case 'technical':
        return Users
      default:
        return Bell
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'price':
        return 'text-blue-600 bg-blue-100'
      case 'volume':
        return 'text-green-600 bg-green-100'
      case 'technical':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const topSymbols = Object.entries(stats.by_symbol)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          <Bell className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-gray-500">
            {stats.active} active, {stats.total - stats.active} inactive
          </p>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <p className="text-xs text-gray-500">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Today's Triggers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Triggered Today</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.triggered_today}</div>
          <p className="text-xs text-gray-500">
            {stats.triggered_this_week} this week
          </p>
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.triggered_this_week}</div>
          <p className="text-xs text-gray-500">
            alerts triggered
          </p>
        </CardContent>
      </Card>

      {/* Alert Types Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Alert Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.by_type).map(([type, count]) => {
              const Icon = getTypeIcon(type)
              const colorClass = getTypeColor(type)
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-md ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{type}</p>
                      <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of alerts</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              )
            })}
            
            {Object.keys(stats.by_type).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No alerts created yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Symbols */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Most Watched Symbols</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topSymbols.map(([symbol, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              
              return (
                <div key={symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">{symbol[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{symbol}</p>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{count} alerts</Badge>
                </div>
              )
            })}
            
            {topSymbols.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No symbols tracked yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 