/**
 * PENNY WISE - USE-ALERTS HOOK TESTS
 * Testing custom hook for alerts management
 */

import { jest } from '@jest/globals';

describe('useAlerts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alert State Management', () => {
    test('should manage alerts state', () => {
      interface Alert {
        id: string;
        userId: string;
        symbol: string;
        condition: 'above' | 'below' | 'equals';
        targetPrice: number;
        isActive: boolean;
        createdAt: string;
      }

      interface AlertsState {
        alerts: Alert[];
        loading: boolean;
        error: string | null;
      }

      class AlertsManager {
        private state: AlertsState = {
          alerts: [],
          loading: false,
          error: null
        };

        private listeners: Array<(state: AlertsState) => void> = [];

        getState(): AlertsState {
          return { ...this.state };
        }

        subscribe(listener: (state: AlertsState) => void): () => void {
          this.listeners.push(listener);
          return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
              this.listeners.splice(index, 1);
            }
          };
        }

        private setState(newState: Partial<AlertsState>): void {
          this.state = { ...this.state, ...newState };
          this.listeners.forEach(listener => listener(this.state));
        }

        async createAlert(alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
          this.setState({ loading: true, error: null });

          try {
            const alert: Alert = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              ...alertData
            };

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 100));

            this.setState({
              alerts: [...this.state.alerts, alert],
              loading: false
            });

            return alert;
          } catch (error) {
            this.setState({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to create alert'
            });
            throw error;
          }
        }

        async deleteAlert(alertId: string): Promise<void> {
          this.setState({ loading: true, error: null });

          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 100));

            this.setState({
              alerts: this.state.alerts.filter(alert => alert.id !== alertId),
              loading: false
            });
          } catch (error) {
            this.setState({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to delete alert'
            });
            throw error;
          }
        }

        async toggleAlert(alertId: string): Promise<void> {
          this.setState({ loading: true, error: null });

          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 100));

            this.setState({
              alerts: this.state.alerts.map(alert =>
                alert.id === alertId
                  ? { ...alert, isActive: !alert.isActive }
                  : alert
              ),
              loading: false
            });
          } catch (error) {
            this.setState({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to toggle alert'
            });
            throw error;
          }
        }

        getAlertsBySymbol(symbol: string): Alert[] {
          return this.state.alerts.filter(alert => alert.symbol === symbol);
        }

        getActiveAlerts(): Alert[] {
          return this.state.alerts.filter(alert => alert.isActive);
        }

        clearError(): void {
          this.setState({ error: null });
        }
      }

      const manager = new AlertsManager();
      const states: AlertsState[] = [];

      const unsubscribe = manager.subscribe(state => {
        states.push(state);
      });

      // Initial state
      expect(manager.getState().alerts).toHaveLength(0);
      expect(manager.getState().loading).toBe(false);
      expect(manager.getState().error).toBeNull();

      // Test alert creation
      const alertData = {
        userId: 'user_123',
        symbol: 'PETR4',
        condition: 'above' as const,
        targetPrice: 35.00,
        isActive: true
      };

      const createPromise = manager.createAlert(alertData);

      // Should be loading
      expect(manager.getState().loading).toBe(true);

      return createPromise.then(alert => {
        expect(alert.id).toMatch(/^alert_\d+_[a-z0-9]{9}$/);
        expect(alert.symbol).toBe('PETR4');
        expect(manager.getState().alerts).toHaveLength(1);
        expect(manager.getState().loading).toBe(false);

        // Test filtering
        expect(manager.getAlertsBySymbol('PETR4')).toHaveLength(1);
        expect(manager.getActiveAlerts()).toHaveLength(1);

        unsubscribe();
      });
    });

    test('should handle alert validation', () => {
      const validateAlertData = (data: Record<string, unknown>): string[] => {
        const errors: string[] = [];

        if (!data.symbol || typeof data.symbol !== 'string' || data.symbol.trim().length === 0) {
          errors.push('Symbol is required');
        }

        if (!data.condition || !['above', 'below', 'equals'].includes(data.condition as string)) {
          errors.push('Valid condition is required');
        }

        if (!data.targetPrice || typeof data.targetPrice !== 'number' || data.targetPrice <= 0) {
          errors.push('Target price must be a positive number');
        }

        if (data.symbol && typeof data.symbol === 'string') {
          const symbol = data.symbol.toUpperCase();
          const brazilianPattern = /^[A-Z]{4}\d{1,2}$/;
          const usPattern = /^[A-Z]{1,5}$/;
          
          if (!brazilianPattern.test(symbol) && !usPattern.test(symbol)) {
            errors.push('Invalid symbol format');
          }
        }

        return errors;
      };

      const validData = {
        symbol: 'PETR4',
        condition: 'above',
        targetPrice: 35.00
      };

      const invalidData = {
        symbol: '',
        condition: 'invalid',
        targetPrice: -10
      };

      expect(validateAlertData(validData)).toHaveLength(0);
      expect(validateAlertData(invalidData)).toHaveLength(3);
    });
  });

  describe('Alert Filtering and Sorting', () => {
    test('should filter and sort alerts', () => {
      interface Alert {
        id: string;
        symbol: string;
        condition: 'above' | 'below' | 'equals';
        targetPrice: number;
        isActive: boolean;
        createdAt: string;
        priority: 'low' | 'medium' | 'high';
      }

      const alerts: Alert[] = [
        {
          id: 'alert_1',
          symbol: 'PETR4',
          condition: 'above',
          targetPrice: 35.00,
          isActive: true,
          createdAt: '2024-01-15T10:00:00Z',
          priority: 'high'
        },
        {
          id: 'alert_2',
          symbol: 'VALE3',
          condition: 'below',
          targetPrice: 80.00,
          isActive: false,
          createdAt: '2024-01-15T11:00:00Z',
          priority: 'medium'
        },
        {
          id: 'alert_3',
          symbol: 'PETR4',
          condition: 'below',
          targetPrice: 30.00,
          isActive: true,
          createdAt: '2024-01-15T12:00:00Z',
          priority: 'low'
        }
      ];

      const filterAlerts = (
        alerts: Alert[],
        filters: {
          symbol?: string;
          isActive?: boolean;
          condition?: string;
          priority?: string;
        }
      ): Alert[] => {
        return alerts.filter(alert => {
          if (filters.symbol && alert.symbol !== filters.symbol) return false;
          if (filters.isActive !== undefined && alert.isActive !== filters.isActive) return false;
          if (filters.condition && alert.condition !== filters.condition) return false;
          if (filters.priority && alert.priority !== filters.priority) return false;
          return true;
        });
      };

      const sortAlerts = (
        alerts: Alert[],
        sortBy: 'createdAt' | 'targetPrice' | 'priority',
        order: 'asc' | 'desc' = 'desc'
      ): Alert[] => {
        return [...alerts].sort((a, b) => {
          let comparison = 0;

          switch (sortBy) {
            case 'createdAt':
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
            case 'targetPrice':
              comparison = a.targetPrice - b.targetPrice;
              break;
            case 'priority':
              const priorityOrder = { low: 1, medium: 2, high: 3 };
              comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
              break;
          }

          return order === 'asc' ? comparison : -comparison;
        });
      };

      // Test filtering
      const petr4Alerts = filterAlerts(alerts, { symbol: 'PETR4' });
      expect(petr4Alerts).toHaveLength(2);

      const activeAlerts = filterAlerts(alerts, { isActive: true });
      expect(activeAlerts).toHaveLength(2);

      const highPriorityAlerts = filterAlerts(alerts, { priority: 'high' });
      expect(highPriorityAlerts).toHaveLength(1);

      // Test sorting
      const sortedByDate = sortAlerts(alerts, 'createdAt', 'asc');
      expect(sortedByDate[0].id).toBe('alert_1');
      expect(sortedByDate[2].id).toBe('alert_3');

      const sortedByPrice = sortAlerts(alerts, 'targetPrice', 'desc');
      expect(sortedByPrice[0].targetPrice).toBe(80.00);
      expect(sortedByPrice[2].targetPrice).toBe(30.00);

      const sortedByPriority = sortAlerts(alerts, 'priority', 'desc');
      expect(sortedByPriority[0].priority).toBe('high');
      expect(sortedByPriority[2].priority).toBe('low');
    });
  });

  describe('Alert Statistics', () => {
    test('should calculate alert statistics', () => {
      interface Alert {
        id: string;
        symbol: string;
        condition: 'above' | 'below' | 'equals';
        targetPrice: number;
        isActive: boolean;
        createdAt: string;
        triggeredAt?: string;
      }

      interface AlertStats {
        total: number;
        active: number;
        triggered: number;
        bySymbol: Record<string, number>;
        byCondition: Record<string, number>;
        successRate: number;
        averageTimeToTrigger: number; // in hours
      }

      const calculateAlertStats = (alerts: Alert[]): AlertStats => {
        const total = alerts.length;
        const active = alerts.filter(alert => alert.isActive).length;
        const triggered = alerts.filter(alert => alert.triggeredAt).length;

        const bySymbol: Record<string, number> = {};
        const byCondition: Record<string, number> = {};

        alerts.forEach(alert => {
          bySymbol[alert.symbol] = (bySymbol[alert.symbol] || 0) + 1;
          byCondition[alert.condition] = (byCondition[alert.condition] || 0) + 1;
        });

        const successRate = total > 0 ? (triggered / total) * 100 : 0;

        const triggeredAlerts = alerts.filter(alert => alert.triggeredAt);
        const averageTimeToTrigger = triggeredAlerts.length > 0
          ? triggeredAlerts.reduce((sum, alert) => {
              const created = new Date(alert.createdAt).getTime();
              const triggered = new Date(alert.triggeredAt!).getTime();
              return sum + (triggered - created);
            }, 0) / triggeredAlerts.length / (1000 * 60 * 60) // Convert to hours
          : 0;

        return {
          total,
          active,
          triggered,
          bySymbol,
          byCondition,
          successRate: Number(successRate.toFixed(2)),
          averageTimeToTrigger: Number(averageTimeToTrigger.toFixed(2))
        };
      };

      const alerts: Alert[] = [
        {
          id: 'alert_1',
          symbol: 'PETR4',
          condition: 'above',
          targetPrice: 35.00,
          isActive: false,
          createdAt: '2024-01-15T10:00:00Z',
          triggeredAt: '2024-01-15T14:00:00Z'
        },
        {
          id: 'alert_2',
          symbol: 'VALE3',
          condition: 'below',
          targetPrice: 80.00,
          isActive: true,
          createdAt: '2024-01-15T11:00:00Z'
        },
        {
          id: 'alert_3',
          symbol: 'PETR4',
          condition: 'above',
          targetPrice: 40.00,
          isActive: false,
          createdAt: '2024-01-15T12:00:00Z',
          triggeredAt: '2024-01-15T18:00:00Z'
        }
      ];

      const stats = calculateAlertStats(alerts);

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(1);
      expect(stats.triggered).toBe(2);
      expect(stats.bySymbol['PETR4']).toBe(2);
      expect(stats.bySymbol['VALE3']).toBe(1);
      expect(stats.byCondition['above']).toBe(2);
      expect(stats.byCondition['below']).toBe(1);
      expect(stats.successRate).toBe(66.67);
      expect(stats.averageTimeToTrigger).toBe(5); // Average of 4 and 6 hours
    });
  });

  describe('Alert Persistence', () => {
    test('should handle local storage persistence', () => {
      interface Alert {
        id: string;
        symbol: string;
        targetPrice: number;
        isActive: boolean;
      }

      class AlertStorage {
        private storageKey = 'penny-wise-alerts';

        save(alerts: Alert[]): void {
          try {
            const data = JSON.stringify(alerts);
            localStorage.setItem(this.storageKey, data);
          } catch (error) {
            console.error('Failed to save alerts to localStorage:', error);
          }
        }

        load(): Alert[] {
          try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
          } catch (error) {
            console.error('Failed to load alerts from localStorage:', error);
            return [];
          }
        }

        clear(): void {
          localStorage.removeItem(this.storageKey);
        }

        backup(): string {
          const alerts = this.load();
          return JSON.stringify({
            version: '1.0',
            timestamp: new Date().toISOString(),
            alerts
          });
        }

        restore(backupData: string): boolean {
          try {
            const backup = JSON.parse(backupData);
            if (backup.version && backup.alerts && Array.isArray(backup.alerts)) {
              this.save(backup.alerts);
              return true;
            }
            return false;
          } catch (error) {
            console.error('Failed to restore alerts from backup:', error);
            return false;
          }
        }
      }

      // Mock localStorage
      const localStorageMock = {
        store: new Map<string, string>(),
        getItem: jest.fn((key: string) => localStorageMock.store.get(key) || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock.store.set(key, value);
        }),
        removeItem: jest.fn((key: string) => {
          localStorageMock.store.delete(key);
        })
      };

      Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true
      });

      const storage = new AlertStorage();
      const alerts: Alert[] = [
        {
          id: 'alert_1',
          symbol: 'PETR4',
          targetPrice: 35.00,
          isActive: true
        },
        {
          id: 'alert_2',
          symbol: 'VALE3',
          targetPrice: 80.00,
          isActive: false
        }
      ];

      // Test save and load
      storage.save(alerts);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'penny-wise-alerts',
        JSON.stringify(alerts)
      );

      const loadedAlerts = storage.load();
      expect(loadedAlerts).toEqual(alerts);

      // Test backup and restore
      const backupData = storage.backup();
      expect(backupData).toContain('"version":"1.0"');
      expect(backupData).toContain('"alerts"');

      storage.clear();
      expect(storage.load()).toEqual([]);

      const restored = storage.restore(backupData);
      expect(restored).toBe(true);
      expect(storage.load()).toEqual(alerts);

      // Test invalid backup
      const invalidRestore = storage.restore('invalid json');
      expect(invalidRestore).toBe(false);
    });
  });
}); 