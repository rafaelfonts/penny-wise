'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { alertService } from '@/lib/services/alerts-temp'
import type { Alert } from '@/lib/types/alerts'

interface RecentAlertsWidgetProps {
  className?: string
  maxItems?: number
}

export function RecentAlertsWidget({ className, maxItems = 5 }: RecentAlertsWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecentAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await alertService.getUserAlerts()
      
      // Filter and sort recent alerts (active alerts first, then by date)
      const recentAlerts = response.alerts
        .filter((alert: Alert) => alert.is_active)
        .sort((a: Alert, b: Alert) => {
          // Sort by triggered alerts first, then by date
          if (a.triggered_at && !b.triggered_at) return -1
          if (b.triggered_at && !a.triggered_at) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        .slice(0, maxItems)
      
      setAlerts(recentAlerts)
    } catch (err) {
      console.error('Error loading recent alerts:', err)
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [maxItems])

  useEffect(() => {
    loadRecentAlerts()
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      loadRecentAlerts()
    }, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadRecentAlerts])

  const getAlertIcon = (alert: Alert) => {
    if (alert.triggered_at) {
      return alert.alert_type === 'price' && alert.current_value && alert.target_value
        ? alert.current_value > alert.target_value 
          ? TrendingUp 
          : TrendingDown
        : AlertTriangle
    }
    return Bell
  }

  const getAlertColor = (alert: Alert) => {
    if (alert.triggered_at) {
      return 'text-red-600'
    }
    return alert.is_active ? 'text-blue-600' : 'text-gray-600'
  }

  const getStatusBadge = (alert: Alert) => {
    if (alert.triggered_at) {
      return { variant: 'destructive' as const, text: 'Triggered', color: 'bg-red-100 text-red-800' }
    }
    if (alert.is_active) {
      return { variant: 'default' as const, text: 'Active', color: 'bg-blue-100 text-blue-800' }
    }
    return { variant: 'secondary' as const, text: 'Paused', color: 'bg-gray-100 text-gray-800' }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getAlertTitle = (alert: Alert) => {
    const conditionText = alert.condition_type === 'above' ? 'above' : 
                         alert.condition_type === 'below' ? 'below' :
                         alert.condition_type
    return `${alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)} ${conditionText} ${formatCurrency(alert.target_value)}`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-8">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No recent alerts</p>
            <p className="text-sm">Your alerts will appear here when triggered</p>
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
            <Bell className="h-5 w-5" />
            Recent Alerts
          </div>
          <Badge variant="outline" className="text-xs">
            {alerts.filter(a => a.triggered_at).length} triggered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert)
            const statusBadge = getStatusBadge(alert)
            return (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className={`p-1.5 rounded-lg ${getAlertColor(alert)} bg-opacity-10`}>
                  <Icon className={`h-4 w-4 ${getAlertColor(alert)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {alert.symbol}
                    </span>
                    <Badge className={statusBadge.color}>
                      {statusBadge.text}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {getAlertTitle(alert)}
                  </p>
                  
                  {alert.triggered_at && alert.current_value && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Target: {formatCurrency(alert.target_value)}</span>
                      <span>Current: {formatCurrency(alert.current_value)}</span>
                      {alert.alert_type === 'price' && (
                        <span className={
                          alert.current_value > alert.target_value 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }>
                          {alert.current_value > alert.target_value ? '↗' : '↘'}
                          {formatPercent((alert.current_value - alert.target_value) / alert.target_value * 100)}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatTime(alert.triggered_at || alert.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Showing {alerts.length} recent alerts
            </span>
            <Button variant="link" size="sm" className="text-xs p-0 h-auto">
              View all alerts →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 