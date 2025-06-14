import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import marketDataService from '@/lib/services/market-data';
import type {
  Alert,
  CreateAlert,
  UpdateAlert,
  AlertType,
  ConditionType,
} from '@/lib/types/alerts';

export interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  createAlert: (alert: CreateAlert) => Promise<Alert | null>;
  updateAlert: (id: string, updates: UpdateAlert) => Promise<Alert | null>;
  deleteAlert: (id: string) => Promise<boolean>;
  toggleAlert: (id: string) => Promise<boolean>;
  refreshAlerts: () => Promise<void>;
  getActiveAlerts: () => Alert[];
  getTriggeredAlerts: () => Alert[];
  checkAlerts: (symbol?: string) => Promise<void>;
}

export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch alerts from database
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('User not authenticated');
        return;
      }

      const { data, error: dbError } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (dbError) {
        setError(dbError.message);
        return;
      }

      // Transform database data to match our interface
      const transformedData: Alert[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id || '',
        symbol: item.symbol,
        alert_type: item.alert_type as AlertType,
        condition_type: item.condition_type as ConditionType,
        target_value: Number(item.target_value || 0),
        current_value: Number(item.target_value || 0), // Will be updated by price checks
        is_active: item.is_active || false,
        triggered_at: item.triggered_at || undefined,
        trigger_count: 0, // Not in user_alerts table
        cooldown_minutes: 5, // Default value
        last_triggered: item.triggered_at || undefined,
        metadata:
          typeof item.metadata === 'object' && item.metadata !== null
            ? (item.metadata as Record<string, string | number | boolean>)
            : {},
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      }));

      setAlerts(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Create new alert
  const createAlert = useCallback(
    async (config: CreateAlert): Promise<Alert | null> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError('User not authenticated');
          return null;
        }

        // Get current quote to validate symbol
        const quoteResponse = await marketDataService.getQuote(config.symbol);
        if (!quoteResponse.success || !quoteResponse.data) {
          setError('Symbol not found or invalid');
          return null;
        }

        const { data, error: insertError } = await supabase
          .from('user_alerts')
          .insert({
            user_id: session.user.id,
            symbol: config.symbol,
            alert_type: config.alert_type,
            condition_type: config.condition_type,
            target_value: config.target_value,
            is_active: true,
            metadata: config.metadata || {},
          })
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          return null;
        }

        // Update local state
        const newAlert: Alert = {
          id: data.id,
          user_id: data.user_id || '',
          symbol: data.symbol,
          alert_type: data.alert_type as AlertType,
          condition_type: data.condition_type as ConditionType,
          target_value: Number(data.target_value || 0),
          current_value: 0,
          is_active: data.is_active || false,
          triggered_at: data.triggered_at || undefined,
          trigger_count: 0,
          cooldown_minutes: 5,
          last_triggered: data.triggered_at || undefined,
          metadata:
            typeof data.metadata === 'object' && data.metadata !== null
              ? (data.metadata as Record<string, string | number | boolean>)
              : {},
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };

        setAlerts(prev => [newAlert, ...prev]);
        return newAlert;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create alert');
        return null;
      }
    },
    [supabase]
  );

  // Update alert
  const updateAlert = useCallback(
    async (id: string, updates: UpdateAlert): Promise<Alert | null> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return null;

        const { data, error: updateError } = await supabase
          .from('user_alerts')
          .update({
            target_value: updates.target_value,
            is_active: updates.is_active,
            metadata: updates.metadata,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', session.user.id)
          .select()
          .single();

        if (updateError) {
          setError(updateError.message);
          return null;
        }

        // Update local state
        const updatedAlert: Alert = {
          id: data.id,
          user_id: data.user_id || '',
          symbol: data.symbol,
          alert_type: data.alert_type as AlertType,
          condition_type: data.condition_type as ConditionType,
          target_value: Number(data.target_value || 0),
          current_value: 0,
          is_active: data.is_active || false,
          triggered_at: data.triggered_at || undefined,
          trigger_count: 0,
          cooldown_minutes: 5,
          last_triggered: data.triggered_at || undefined,
          metadata:
            typeof data.metadata === 'object' && data.metadata !== null
              ? (data.metadata as Record<string, string | number | boolean>)
              : {},
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };

        setAlerts(prev =>
          prev.map(alert => (alert.id === id ? updatedAlert : alert))
        );

        return updatedAlert;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update alert');
        return null;
      }
    },
    [supabase]
  );

  // Delete alert
  const deleteAlert = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return false;

        const { error: deleteError } = await supabase
          .from('user_alerts')
          .delete()
          .eq('id', id)
          .eq('user_id', session.user.id);

        if (deleteError) {
          setError(deleteError.message);
          return false;
        }

        setAlerts(prev => prev.filter(alert => alert.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete alert');
        return false;
      }
    },
    [supabase]
  );

  // Toggle alert active status
  const toggleAlert = useCallback(
    async (id: string): Promise<boolean> => {
      const alert = alerts.find(a => a.id === id);
      if (!alert) return false;

      const result = await updateAlert(id, { is_active: !alert.is_active });
      return result !== null;
    },
    [alerts, updateAlert]
  );

  // Refresh alerts
  const refreshAlerts = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  // Get active alerts
  const getActiveAlerts = useCallback(() => {
    return alerts.filter(alert => alert.is_active && !alert.triggered_at);
  }, [alerts]);

  // Get triggered alerts
  const getTriggeredAlerts = useCallback(() => {
    return alerts.filter(
      alert => alert.triggered_at !== null && alert.triggered_at !== undefined
    );
  }, [alerts]);

  // Check alerts against current market data
  const checkAlerts = useCallback(
    async (symbol?: string) => {
      try {
        const activeAlerts = getActiveAlerts();
        const alertsToCheck = symbol
          ? activeAlerts.filter(alert => alert.symbol === symbol)
          : activeAlerts;

        if (alertsToCheck.length === 0) return;

        // Group alerts by symbol to minimize API calls
        const symbolGroups = alertsToCheck.reduce(
          (groups, alert) => {
            if (!groups[alert.symbol]) {
              groups[alert.symbol] = [];
            }
            groups[alert.symbol].push(alert);
            return groups;
          },
          {} as Record<string, Alert[]>
        );

        // Check each symbol
        for (const [checkSymbol, symbolAlerts] of Object.entries(
          symbolGroups
        )) {
          try {
            const quoteResponse = await marketDataService.getQuote(checkSymbol);
            if (!quoteResponse.success || !quoteResponse.data) continue;

            const quote = quoteResponse.data;

            // Check each alert for this symbol
            for (const alert of symbolAlerts) {
              const currentValue =
                alert.alert_type === 'price'
                  ? quote.price
                  : alert.alert_type === 'volume'
                    ? quote.volume
                    : quote.change;

              // Check if alert should trigger
              let shouldTrigger = false;
              switch (alert.condition_type) {
                case 'above':
                  shouldTrigger = currentValue > alert.target_value;
                  break;
                case 'below':
                  shouldTrigger = currentValue < alert.target_value;
                  break;
                case 'cross_above':
                  shouldTrigger =
                    (alert.current_value || 0) <= alert.target_value &&
                    currentValue > alert.target_value;
                  break;
                case 'cross_below':
                  shouldTrigger =
                    (alert.current_value || 0) >= alert.target_value &&
                    currentValue < alert.target_value;
                  break;
                case 'change_percent':
                  const changePercent = Math.abs(quote.changePercent);
                  shouldTrigger = changePercent >= alert.target_value;
                  break;
              }

              if (shouldTrigger) {
                // Trigger the alert by updating it
                await supabase
                  .from('user_alerts')
                  .update({
                    triggered_at: new Date().toISOString(),
                    is_active: false, // Deactivate after triggering
                  })
                  .eq('id', alert.id);

                // Update local state
                setAlerts(prev =>
                  prev.map(a =>
                    a.id === alert.id
                      ? {
                          ...a,
                          triggered_at: new Date().toISOString(),
                          is_active: false,
                        }
                      : a
                  )
                );
              } else {
                // Update current value in local state only (user_alerts doesn't have current_value column)
                setAlerts(prev =>
                  prev.map(a =>
                    a.id === alert.id
                      ? { ...a, current_value: currentValue }
                      : a
                  )
                );
              }
            }
          } catch (err) {
            console.error(`Error checking alerts for ${checkSymbol}:`, err);
          }
        }
      } catch (err) {
        console.error('Error checking alerts:', err);
      }
    },
    [getActiveAlerts, supabase]
  );

  // Load alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-check alerts every 2 minutes
  useEffect(() => {
    if (alerts.length === 0) return;

    const interval = setInterval(
      () => {
        checkAlerts();
      },
      2 * 60 * 1000
    ); // 2 minutes

    return () => clearInterval(interval);
  }, [alerts.length, checkAlerts]);

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    refreshAlerts,
    getActiveAlerts,
    getTriggeredAlerts,
    checkAlerts,
  };
}
