// ==========================================
// ALERTS SERVICE - Day 5 Alert Management
// ==========================================

import { createClient } from '@/lib/supabase/client'
import type { 
  Alert, 
  CreateAlert, 
  UpdateAlert, 
  AlertCheck, 
  AlertTrigger,
  AlertStats,
  AlertsResponse 
} from '@/lib/types/alerts'

export class AlertService {
  private supabase = createClient()

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async createAlert(alert: CreateAlert): Promise<Alert> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        ...alert,
        cooldown_minutes: alert.cooldown_minutes || 60,
        metadata: alert.metadata || {}
      })
      .select('*')
      .single()

    if (error) throw new Error(`Failed to create alert: ${error.message}`)
    return data as Alert
  }

  async getUserAlerts(userId?: string): Promise<AlertsResponse> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('alerts')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch alerts: ${error.message}`)

    const alerts = data as Alert[]
    const total = alerts.length
    const active = alerts.filter(a => a.is_active).length
    
    // Count triggered today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const triggered_today = alerts.filter(a => 
      a.triggered_at && new Date(a.triggered_at) >= today
    ).length

    return {
      alerts,
      total,
      active,
      triggered_today
    }
  }

  async getAlertById(id: string): Promise<Alert | null> {
    const { data, error } = await this.supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch alert: ${error.message}`)
    }

    return data as Alert
  }

  async updateAlert(id: string, updates: UpdateAlert): Promise<Alert> {
    const { data, error } = await this.supabase
      .from('alerts')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(`Failed to update alert: ${error.message}`)
    return data as Alert
  }

  async deleteAlert(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('alerts')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete alert: ${error.message}`)
  }

  async toggleAlert(id: string): Promise<Alert> {
    const alert = await this.getAlertById(id)
    if (!alert) throw new Error('Alert not found')

    return this.updateAlert(id, { is_active: !alert.is_active })
  }

  // ==========================================
  // ALERT CHECKING & TRIGGERING
  // ==========================================

  async checkAlerts(alertCheck: AlertCheck): Promise<AlertTrigger[]> {
    const { symbol, current_price, volume, technicals } = alertCheck
    
    // Use the database function to find triggered alerts
    const { data, error } = await this.supabase
      .rpc('check_price_alerts', {
        symbol_param: symbol,
        current_price: current_price
      })

    if (error) throw new Error(`Failed to check alerts: ${error.message}`)

    const triggeredAlerts: AlertTrigger[] = []

    for (const alertData of data) {
      const alert = await this.getAlertById(alertData.alert_id)
      if (!alert) continue

      // Check if condition is met based on alert type
      const isTriggered = this.evaluateAlertCondition(alert, {
        current_price,
        volume,
        technicals
      })

      if (isTriggered) {
        const trigger: AlertTrigger = {
          alert,
          current_value: current_price,
          triggered_at: new Date().toISOString(),
          symbol_data: {
            price: current_price,
            volume: volume || 0,
            change: 0, // Would need historical data
            change_percent: 0 // Would need historical data
          }
        }

        triggeredAlerts.push(trigger)
      }
    }

    return triggeredAlerts
  }

  async triggerAlert(alertId: string, currentValue: number): Promise<void> {
    // Use the database function to update the alert
    const { error } = await this.supabase
      .rpc('trigger_alert', {
        alert_id_param: alertId,
        current_price: currentValue
      })

    if (error) throw new Error(`Failed to trigger alert: ${error.message}`)

    // Create notification for the triggered alert
    const alert = await this.getAlertById(alertId)
    if (alert) {
      await this.createAlertNotification(alert, currentValue)
    }
  }

  private evaluateAlertCondition(
    alert: Alert, 
    data: { current_price: number; volume?: number; technicals?: Record<string, number> }
  ): boolean {
    const { alert_type, condition_type, target_value } = alert
    const { current_price, volume, technicals } = data

    switch (alert_type) {
      case 'price':
        switch (condition_type) {
          case 'above':
            return current_price >= target_value
          case 'below':
            return current_price <= target_value
          case 'cross_above':
            // Would need previous price to implement crossing
            return current_price >= target_value
          case 'cross_below':
            // Would need previous price to implement crossing
            return current_price <= target_value
          default:
            return false
        }

      case 'volume':
        if (!volume) return false
        switch (condition_type) {
          case 'above':
            return volume >= target_value
          case 'below':
            return volume <= target_value
          default:
            return false
        }

      case 'technical':
        if (!technicals || !alert.metadata) return false
        // Would need to specify which technical indicator in metadata
        const indicator = alert.metadata.indicator as string
        const value = technicals[indicator]
        if (typeof value !== 'number') return false

        switch (condition_type) {
          case 'above':
            return value >= target_value
          case 'below':
            return value <= target_value
          default:
            return false
        }

      default:
        return false
    }
  }

  // ==========================================
  // STATISTICS & ANALYTICS
  // ==========================================

  async getAlertStats(userId?: string): Promise<AlertStats> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('alerts')
      .select('*')
      .eq('user_id', targetUserId)

    if (error) throw new Error(`Failed to fetch alert stats: ${error.message}`)

    const alerts = data as Alert[]
    const total = alerts.length
    const active = alerts.filter(a => a.is_active).length

    // Count triggered today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const triggered_today = alerts.filter(a => 
      a.triggered_at && new Date(a.triggered_at) >= today
    ).length

    // Count triggered this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const triggered_this_week = alerts.filter(a => 
      a.triggered_at && new Date(a.triggered_at) >= weekAgo
    ).length

    // Group by type
    const by_type = alerts.reduce((acc, alert) => {
      acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by symbol
    const by_symbol = alerts.reduce((acc, alert) => {
      acc[alert.symbol] = (acc[alert.symbol] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      active,
      triggered_today,
      triggered_this_week,
      by_type: by_type as Record<import('@/lib/types/alerts').AlertType, number>,
      by_symbol
    }
  }

  // ==========================================
  // BATCH OPERATIONS
  // ==========================================

  async checkMultipleSymbols(symbols: string[]): Promise<Record<string, AlertTrigger[]>> {
    const results: Record<string, AlertTrigger[]> = {}

    // In a real implementation, you'd get current prices from your market data service
    // For now, we'll simulate this
    for (const symbol of symbols) {
      try {
        // Mock price - replace with actual market data call
        const mockPrice = 100 + Math.random() * 50
        
        const triggers = await this.checkAlerts({
          symbol,
          current_price: mockPrice
        })

        results[symbol] = triggers
      } catch (error) {
        console.error(`Failed to check alerts for ${symbol}:`, error)
        results[symbol] = []
      }
    }

    return results
  }

  async deactivateAllAlerts(userId?: string): Promise<number> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('alerts')
      .update({ is_active: false })
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .select('id')

    if (error) throw new Error(`Failed to deactivate alerts: ${error.message}`)
    return data.length
  }

  async deleteTriggeredAlerts(olderThanDays: number = 30): Promise<number> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { data, error } = await this.supabase
      .from('alerts')
      .delete()
      .eq('user_id', user.id)
      .not('triggered_at', 'is', null)
      .lt('triggered_at', cutoffDate.toISOString())
      .select('id')

    if (error) throw new Error(`Failed to delete old alerts: ${error.message}`)
    return data.length
  }

  // ==========================================
  // NOTIFICATION INTEGRATION
  // ==========================================

  private async createAlertNotification(alert: Alert, currentValue: number): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    const conditionText = this.getConditionText(alert, currentValue)
    
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: `Alert Triggered: ${alert.symbol}`,
        message: `${alert.symbol} ${conditionText}`,
        type: 'alert',
        priority: 'high',
        data: {
          alert_id: alert.id,
          symbol: alert.symbol,
          alert_type: alert.alert_type,
          condition_type: alert.condition_type,
          target_value: alert.target_value,
          current_value: currentValue
        }
      })

    if (error) {
      console.error('Failed to create alert notification:', error)
    }
  }

  private getConditionText(alert: Alert, currentValue: number): string {
    const { condition_type, target_value, alert_type } = alert
    
    switch (alert_type) {
      case 'price':
        switch (condition_type) {
          case 'above':
            return `price $${currentValue.toFixed(2)} is above target $${target_value.toFixed(2)}`
          case 'below':
            return `price $${currentValue.toFixed(2)} is below target $${target_value.toFixed(2)}`
          case 'cross_above':
            return `price $${currentValue.toFixed(2)} crossed above $${target_value.toFixed(2)}`
          case 'cross_below':
            return `price $${currentValue.toFixed(2)} crossed below $${target_value.toFixed(2)}`
          default:
            return `met condition at $${currentValue.toFixed(2)}`
        }
      
      case 'volume':
        switch (condition_type) {
          case 'above':
            return `volume ${currentValue.toLocaleString()} is above ${target_value.toLocaleString()}`
          case 'below':
            return `volume ${currentValue.toLocaleString()} is below ${target_value.toLocaleString()}`
          default:
            return `volume condition met at ${currentValue.toLocaleString()}`
        }
      
      default:
        return `${alert_type} condition met`
    }
  }

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  subscribeToUserAlerts(userId: string, callback: (payload: Alert) => void) {
    // Note: Real-time subscriptions would be implemented here in production
    // For now, return a mock subscription to avoid TypeScript errors
    console.warn('Real-time alerts subscription not implemented yet', { userId, callback })
    return null
  }

  unsubscribeFromAlerts(subscription: ReturnType<typeof this.subscribeToUserAlerts>) {
    // Mock implementation for now
    console.log('Unsubscribed from alerts', { subscription })
  }
}

// Export singleton instance
export const alertService = new AlertService() 