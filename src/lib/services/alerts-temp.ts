// ==========================================
// ALERTS SERVICE - Day 5 Alert Management (Temporary Implementation)
// ==========================================

import { createClient } from '@/lib/supabase/client';
import type {
  Alert,
  CreateAlert,
  UpdateAlert,
  AlertCheck,
  AlertTrigger,
  AlertStats,
  AlertsResponse,
} from '@/lib/types/alerts';

export class AlertService {
  private supabase = createClient();

  // ==========================================
  // MOCK DATA FOR DEMONSTRATION
  // ==========================================

  private mockAlerts: Alert[] = [
    {
      id: '1',
      user_id: 'demo-user',
      symbol: 'AAPL',
      alert_type: 'price',
      condition_type: 'above',
      target_value: 150,
      current_value: 148.5,
      is_active: true,
      trigger_count: 0,
      cooldown_minutes: 60,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'demo-user',
      symbol: 'GOOGL',
      alert_type: 'price',
      condition_type: 'below',
      target_value: 2800,
      current_value: 2850,
      is_active: true,
      trigger_count: 2,
      cooldown_minutes: 30,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async createAlert(alert: CreateAlert): Promise<Alert> {
    // In real implementation, this would use database
    const newAlert: Alert = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: 'demo-user',
      ...alert,
      current_value: undefined,
      is_active: true,
      trigger_count: 0,
      cooldown_minutes: alert.cooldown_minutes || 60,
      metadata: alert.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.mockAlerts.push(newAlert);
    return newAlert;
  }

  async getUserAlerts(): Promise<AlertsResponse> {
    // Mock implementation
    const alerts = this.mockAlerts;
    const total = alerts.length;
    const active = alerts.filter(a => a.is_active).length;

    // Count triggered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const triggered_today = alerts.filter(
      a => a.triggered_at && new Date(a.triggered_at) >= today
    ).length;

    return {
      alerts,
      total,
      active,
      triggered_today,
    };
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.mockAlerts.find(a => a.id === id) || null;
  }

  async updateAlert(id: string, updates: UpdateAlert): Promise<Alert> {
    const alertIndex = this.mockAlerts.findIndex(a => a.id === id);
    if (alertIndex === -1) throw new Error('Alert not found');

    this.mockAlerts[alertIndex] = {
      ...this.mockAlerts[alertIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return this.mockAlerts[alertIndex];
  }

  async deleteAlert(id: string): Promise<void> {
    const alertIndex = this.mockAlerts.findIndex(a => a.id === id);
    if (alertIndex === -1) throw new Error('Alert not found');

    this.mockAlerts.splice(alertIndex, 1);
  }

  async toggleAlert(id: string): Promise<Alert> {
    const alert = await this.getAlertById(id);
    if (!alert) throw new Error('Alert not found');

    return this.updateAlert(id, { is_active: !alert.is_active });
  }

  // ==========================================
  // ALERT CHECKING & TRIGGERING
  // ==========================================

  async checkAlerts(alertCheck: AlertCheck): Promise<AlertTrigger[]> {
    const { symbol, current_price, volume, technicals } = alertCheck;

    const triggeredAlerts: AlertTrigger[] = [];
    const userAlerts = this.mockAlerts.filter(
      a => a.symbol === symbol && a.is_active
    );

    for (const alert of userAlerts) {
      // Check if condition is met based on alert type
      const isTriggered = this.evaluateAlertCondition(alert, {
        current_price,
        volume,
        technicals,
      });

      if (isTriggered) {
        const trigger: AlertTrigger = {
          alert,
          current_value: current_price,
          triggered_at: new Date().toISOString(),
          symbol_data: {
            price: current_price,
            volume: volume || 0,
            change: 0, // Would need historical data
            change_percent: 0, // Would need historical data
          },
        };

        triggeredAlerts.push(trigger);
      }
    }

    return triggeredAlerts;
  }

  async triggerAlert(alertId: string, currentValue: number): Promise<void> {
    await this.updateAlert(alertId, {
      target_value: currentValue,
    });

    // Create notification for the triggered alert
    const alert = await this.getAlertById(alertId);
    if (alert) {
      await this.createAlertNotification(alert, currentValue);
    }
  }

  private evaluateAlertCondition(
    alert: Alert,
    data: {
      current_price: number;
      volume?: number;
      technicals?: Record<string, number>;
    }
  ): boolean {
    const { alert_type, condition_type, target_value } = alert;
    const { current_price, volume, technicals } = data;

    switch (alert_type) {
      case 'price':
        switch (condition_type) {
          case 'above':
            return current_price >= target_value;
          case 'below':
            return current_price <= target_value;
          case 'cross_above':
            // Would need previous price to implement crossing
            return current_price >= target_value;
          case 'cross_below':
            // Would need previous price to implement crossing
            return current_price <= target_value;
          default:
            return false;
        }

      case 'volume':
        if (!volume) return false;
        switch (condition_type) {
          case 'above':
            return volume >= target_value;
          case 'below':
            return volume <= target_value;
          default:
            return false;
        }

      case 'technical':
        if (!technicals || !alert.metadata) return false;
        // Would need to specify which technical indicator in metadata
        const indicator = alert.metadata.indicator as string;
        const value = technicals[indicator];
        if (typeof value !== 'number') return false;

        switch (condition_type) {
          case 'above':
            return value >= target_value;
          case 'below':
            return value <= target_value;
          default:
            return false;
        }

      default:
        return false;
    }
  }

  // ==========================================
  // STATISTICS & ANALYTICS
  // ==========================================

  async getAlertStats(): Promise<AlertStats> {
    const alerts = this.mockAlerts;
    const total = alerts.length;
    const active = alerts.filter(a => a.is_active).length;

    // Count triggered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const triggered_today = alerts.filter(
      a => a.triggered_at && new Date(a.triggered_at) >= today
    ).length;

    // Count triggered this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const triggered_this_week = alerts.filter(
      a => a.triggered_at && new Date(a.triggered_at) >= weekAgo
    ).length;

    // Group by type
    const by_type = alerts.reduce(
      (acc, alert) => {
        acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by symbol
    const by_symbol = alerts.reduce(
      (acc, alert) => {
        acc[alert.symbol] = (acc[alert.symbol] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      active,
      triggered_today,
      triggered_this_week,
      by_type: by_type as Record<
        import('@/lib/types/alerts').AlertType,
        number
      >,
      by_symbol,
    };
  }

  // ==========================================
  // NOTIFICATION INTEGRATION
  // ==========================================

  private async createAlertNotification(
    alert: Alert,
    currentValue: number
  ): Promise<void> {
    const conditionText = this.getConditionText(alert, currentValue);

    // For demo purposes, just log the notification
    console.log(`🔔 Alert Triggered: ${alert.symbol} ${conditionText}`);

    // In real implementation, this would create a notification in the database
    // and potentially send push notifications
  }

  private getConditionText(alert: Alert, currentValue: number): string {
    const { condition_type, target_value, alert_type } = alert;

    switch (alert_type) {
      case 'price':
        switch (condition_type) {
          case 'above':
            return `price $${currentValue.toFixed(2)} is above target $${target_value.toFixed(2)}`;
          case 'below':
            return `price $${currentValue.toFixed(2)} is below target $${target_value.toFixed(2)}`;
          case 'cross_above':
            return `price $${currentValue.toFixed(2)} crossed above $${target_value.toFixed(2)}`;
          case 'cross_below':
            return `price $${currentValue.toFixed(2)} crossed below $${target_value.toFixed(2)}`;
          default:
            return `met condition at $${currentValue.toFixed(2)}`;
        }

      case 'volume':
        switch (condition_type) {
          case 'above':
            return `volume ${currentValue.toLocaleString()} is above ${target_value.toLocaleString()}`;
          case 'below':
            return `volume ${currentValue.toLocaleString()} is below ${target_value.toLocaleString()}`;
          default:
            return `volume condition met at ${currentValue.toLocaleString()}`;
        }

      default:
        return `${alert_type} condition met`;
    }
  }

  // ==========================================
  // BATCH OPERATIONS
  // ==========================================

  async checkMultipleSymbols(
    symbols: string[]
  ): Promise<Record<string, AlertTrigger[]>> {
    const results: Record<string, AlertTrigger[]> = {};

    // Mock implementation with random prices
    for (const symbol of symbols) {
      try {
        // Mock price - replace with actual market data call
        const mockPrice = 100 + Math.random() * 50;

        const triggers = await this.checkAlerts({
          symbol,
          current_price: mockPrice,
        });

        results[symbol] = triggers;
      } catch (error) {
        console.error(`Failed to check alerts for ${symbol}:`, error);
        results[symbol] = [];
      }
    }

    return results;
  }

  async deactivateAllAlerts(): Promise<number> {
    let count = 0;
    for (const alert of this.mockAlerts) {
      if (alert.is_active) {
        await this.updateAlert(alert.id, { is_active: false });
        count++;
      }
    }
    return count;
  }

  async deleteTriggeredAlerts(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const toDelete = this.mockAlerts.filter(
      a => a.triggered_at && new Date(a.triggered_at) < cutoffDate
    );

    for (const alert of toDelete) {
      await this.deleteAlert(alert.id);
    }

    return toDelete.length;
  }
}

// Export singleton instance
export const alertService = new AlertService();
