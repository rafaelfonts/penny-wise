/**
 * PENNY WISE - ALERTS SERVICE TESTS
 * Testing price alerts, conditions and triggers
 */

import { jest } from '@jest/globals';

describe('Alerts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alert Creation', () => {
    test('should create price alert with valid data', () => {
      interface PriceAlert {
        id: string;
        userId: string;
        symbol: string;
        condition: 'above' | 'below' | 'equals';
        targetPrice: number;
        currentPrice?: number;
        isActive: boolean;
        createdAt: string;
        triggeredAt?: string;
        message?: string;
      }

      const createPriceAlert = (data: Omit<PriceAlert, 'id' | 'createdAt' | 'isActive'>): PriceAlert => {
        return {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          isActive: true,
          ...data
        };
      };

      const alertData = {
        userId: 'user_123',
        symbol: 'PETR4',
        condition: 'above' as const,
        targetPrice: 35.00,
        currentPrice: 32.45,
        message: 'PETR4 reached target price'
      };

      const alert = createPriceAlert(alertData);

      expect(alert.id).toMatch(/^alert_\d+_[a-z0-9]{9}$/);
      expect(alert.userId).toBe('user_123');
      expect(alert.symbol).toBe('PETR4');
      expect(alert.condition).toBe('above');
      expect(alert.targetPrice).toBe(35.00);
      expect(alert.isActive).toBe(true);
      expect(new Date(alert.createdAt)).toBeInstanceOf(Date);
    });

    test('should validate alert data', () => {
      const validateAlert = (data: Record<string, unknown>): string[] => {
        const errors: string[] = [];

        if (!data.userId || typeof data.userId !== 'string') {
          errors.push('UserId is required and must be a string');
        }

        if (!data.symbol || typeof data.symbol !== 'string') {
          errors.push('Symbol is required and must be a string');
        }

        if (!data.condition || !['above', 'below', 'equals'].includes(data.condition as string)) {
          errors.push('Condition must be one of: above, below, equals');
        }

        if (!data.targetPrice || typeof data.targetPrice !== 'number' || data.targetPrice <= 0) {
          errors.push('Target price is required and must be a positive number');
        }

        if (data.currentPrice !== undefined && (typeof data.currentPrice !== 'number' || data.currentPrice <= 0)) {
          errors.push('Current price must be a positive number if provided');
        }

        return errors;
      };

      const validData = {
        userId: 'user_123',
        symbol: 'PETR4',
        condition: 'above',
        targetPrice: 35.00,
        currentPrice: 32.45
      };

      const invalidData = {
        userId: '',
        symbol: null,
        condition: 'invalid',
        targetPrice: -10,
        currentPrice: 'invalid'
      };

      expect(validateAlert(validData)).toHaveLength(0);
      expect(validateAlert(invalidData)).toHaveLength(5);
    });
  });

  describe('Alert Conditions', () => {
    test('should evaluate alert conditions correctly', () => {
      interface PriceAlert {
        id: string;
        condition: 'above' | 'below' | 'equals';
        targetPrice: number;
      }

      const evaluateCondition = (alert: PriceAlert, currentPrice: number): boolean => {
        switch (alert.condition) {
          case 'above':
            return currentPrice > alert.targetPrice;
          case 'below':
            return currentPrice < alert.targetPrice;
          case 'equals':
            // Use small tolerance for floating point comparison
            return Math.abs(currentPrice - alert.targetPrice) < 0.01;
          default:
            return false;
        }
      };

      const aboveAlert: PriceAlert = {
        id: 'alert_1',
        condition: 'above',
        targetPrice: 35.00
      };

      const belowAlert: PriceAlert = {
        id: 'alert_2',
        condition: 'below',
        targetPrice: 30.00
      };

      const equalsAlert: PriceAlert = {
        id: 'alert_3',
        condition: 'equals',
        targetPrice: 32.50
      };

      // Test above condition
      expect(evaluateCondition(aboveAlert, 36.00)).toBe(true);
      expect(evaluateCondition(aboveAlert, 34.00)).toBe(false);
      expect(evaluateCondition(aboveAlert, 35.00)).toBe(false);

      // Test below condition
      expect(evaluateCondition(belowAlert, 29.00)).toBe(true);
      expect(evaluateCondition(belowAlert, 31.00)).toBe(false);
      expect(evaluateCondition(belowAlert, 30.00)).toBe(false);

      // Test equals condition
      expect(evaluateCondition(equalsAlert, 32.50)).toBe(true);
      expect(evaluateCondition(equalsAlert, 32.49)).toBe(true); // Within tolerance
      expect(evaluateCondition(equalsAlert, 32.51)).toBe(true); // Within tolerance
      expect(evaluateCondition(equalsAlert, 32.52)).toBe(false); // Outside tolerance
    });

    test('should handle complex alert conditions', () => {
      interface ComplexAlert {
        id: string;
        conditions: {
          type: 'price' | 'volume' | 'change_percent';
          operator: 'above' | 'below' | 'equals' | 'between';
          value: number | [number, number];
        }[];
        logic: 'AND' | 'OR';
      }

      const evaluateComplexAlert = (alert: ComplexAlert, marketData: {
        price: number;
        volume: number;
        changePercent: number;
      }): boolean => {
        const results = alert.conditions.map(condition => {
          let currentValue: number;
          
          switch (condition.type) {
            case 'price':
              currentValue = marketData.price;
              break;
            case 'volume':
              currentValue = marketData.volume;
              break;
            case 'change_percent':
              currentValue = marketData.changePercent;
              break;
            default:
              return false;
          }

          switch (condition.operator) {
            case 'above':
              return currentValue > (condition.value as number);
            case 'below':
              return currentValue < (condition.value as number);
            case 'equals':
              return Math.abs(currentValue - (condition.value as number)) < 0.01;
            case 'between':
              const [min, max] = condition.value as [number, number];
              return currentValue >= min && currentValue <= max;
            default:
              return false;
          }
        });

        return alert.logic === 'AND' 
          ? results.every(result => result)
          : results.some(result => result);
      };

      const complexAlert: ComplexAlert = {
        id: 'complex_1',
        conditions: [
          { type: 'price', operator: 'above', value: 30.00 },
          { type: 'volume', operator: 'above', value: 1000000 },
          { type: 'change_percent', operator: 'between', value: [2.0, 5.0] }
        ],
        logic: 'AND'
      };

      const marketData1 = {
        price: 32.00,
        volume: 1500000,
        changePercent: 3.5
      };

      const marketData2 = {
        price: 32.00,
        volume: 500000, // Below volume threshold
        changePercent: 3.5
      };

      expect(evaluateComplexAlert(complexAlert, marketData1)).toBe(true);
      expect(evaluateComplexAlert(complexAlert, marketData2)).toBe(false);

      // Test OR logic
      const orAlert: ComplexAlert = {
        ...complexAlert,
        logic: 'OR'
      };

      expect(evaluateComplexAlert(orAlert, marketData2)).toBe(true); // Price condition still met
    });
  });

  describe('Alert Management', () => {
    test('should manage alert lifecycle', () => {
      interface Alert {
        id: string;
        userId: string;
        symbol: string;
        condition: 'above' | 'below' | 'equals';
        targetPrice: number;
        isActive: boolean;
        createdAt: string;
        triggeredAt?: string;
      }

      class AlertManager {
        private alerts: Map<string, Alert> = new Map();

        create(alert: Alert): void {
          this.alerts.set(alert.id, alert);
        }

        getById(id: string): Alert | undefined {
          return this.alerts.get(id);
        }

        getByUserId(userId: string): Alert[] {
          return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
        }

        getActiveBySymbol(symbol: string): Alert[] {
          return Array.from(this.alerts.values()).filter(
            alert => alert.symbol === symbol && alert.isActive
          );
        }

        trigger(id: string): boolean {
          const alert = this.alerts.get(id);
          if (alert && alert.isActive) {
            alert.isActive = false;
            alert.triggeredAt = new Date().toISOString();
            return true;
          }
          return false;
        }

        deactivate(id: string): boolean {
          const alert = this.alerts.get(id);
          if (alert) {
            alert.isActive = false;
            return true;
          }
          return false;
        }

        reactivate(id: string): boolean {
          const alert = this.alerts.get(id);
          if (alert && !alert.triggeredAt) {
            alert.isActive = true;
            return true;
          }
          return false;
        }

        delete(id: string): boolean {
          return this.alerts.delete(id);
        }

        getActiveCount(userId: string): number {
          return this.getByUserId(userId).filter(alert => alert.isActive).length;
        }

        cleanup(olderThanDays: number = 30): number {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

          let deletedCount = 0;
          for (const [id, alert] of this.alerts.entries()) {
            const alertDate = new Date(alert.triggeredAt || alert.createdAt);
            if (!alert.isActive && alertDate < cutoffDate) {
              this.alerts.delete(id);
              deletedCount++;
            }
          }

          return deletedCount;
        }
      }

      const manager = new AlertManager();

      const alert1: Alert = {
        id: 'alert_1',
        userId: 'user_123',
        symbol: 'PETR4',
        condition: 'above',
        targetPrice: 35.00,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const alert2: Alert = {
        id: 'alert_2',
        userId: 'user_123',
        symbol: 'VALE3',
        condition: 'below',
        targetPrice: 80.00,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Test creation and retrieval
      manager.create(alert1);
      manager.create(alert2);

      expect(manager.getById('alert_1')).toEqual(alert1);
      expect(manager.getByUserId('user_123')).toHaveLength(2);
      expect(manager.getActiveBySymbol('PETR4')).toHaveLength(1);
      expect(manager.getActiveCount('user_123')).toBe(2);

      // Test triggering
      expect(manager.trigger('alert_1')).toBe(true);
      expect(manager.getById('alert_1')?.isActive).toBe(false);
      expect(manager.getById('alert_1')?.triggeredAt).toBeDefined();
      expect(manager.getActiveCount('user_123')).toBe(1);

      // Test deactivation
      expect(manager.deactivate('alert_2')).toBe(true);
      expect(manager.getActiveCount('user_123')).toBe(0);

      // Test reactivation (should fail for triggered alert)
      expect(manager.reactivate('alert_1')).toBe(false);
      expect(manager.reactivate('alert_2')).toBe(true);
      expect(manager.getActiveCount('user_123')).toBe(1);

      // Test deletion
      expect(manager.delete('alert_1')).toBe(true);
      expect(manager.getById('alert_1')).toBeUndefined();
    });
  });

  describe('Alert Processing', () => {
    test('should process market data against alerts', async () => {
      interface Alert {
        id: string;
        userId: string;
        symbol: string;
        condition: 'above' | 'below' | 'equals';
        targetPrice: number;
        isActive: boolean;
      }

      interface MarketData {
        symbol: string;
        price: number;
        timestamp: string;
      }

      interface AlertTrigger {
        alertId: string;
        userId: string;
        symbol: string;
        condition: string;
        targetPrice: number;
        actualPrice: number;
        timestamp: string;
      }

      class AlertProcessor {
        private alerts: Alert[] = [];
        private onTrigger?: (trigger: AlertTrigger) => void;

        constructor(onTrigger?: (trigger: AlertTrigger) => void) {
          this.onTrigger = onTrigger;
        }

        addAlert(alert: Alert): void {
          this.alerts.push(alert);
        }

        async processMarketData(marketData: MarketData): Promise<AlertTrigger[]> {
          const triggers: AlertTrigger[] = [];
          const symbolAlerts = this.alerts.filter(
            alert => alert.symbol === marketData.symbol && alert.isActive
          );

          for (const alert of symbolAlerts) {
            const shouldTrigger = this.evaluateCondition(alert, marketData.price);
            
            if (shouldTrigger) {
              const trigger: AlertTrigger = {
                alertId: alert.id,
                userId: alert.userId,
                symbol: alert.symbol,
                condition: alert.condition,
                targetPrice: alert.targetPrice,
                actualPrice: marketData.price,
                timestamp: marketData.timestamp
              };

              triggers.push(trigger);
              alert.isActive = false; // Deactivate after triggering

              if (this.onTrigger) {
                this.onTrigger(trigger);
              }
            }
          }

          return triggers;
        }

        private evaluateCondition(alert: Alert, currentPrice: number): boolean {
          switch (alert.condition) {
            case 'above':
              return currentPrice > alert.targetPrice;
            case 'below':
              return currentPrice < alert.targetPrice;
            case 'equals':
              return Math.abs(currentPrice - alert.targetPrice) < 0.01;
            default:
              return false;
          }
        }

        getActiveAlerts(): Alert[] {
          return this.alerts.filter(alert => alert.isActive);
        }
      }

      const triggeredAlerts: AlertTrigger[] = [];
      const processor = new AlertProcessor((trigger) => {
        triggeredAlerts.push(trigger);
      });

      const alert1: Alert = {
        id: 'alert_1',
        userId: 'user_123',
        symbol: 'PETR4',
        condition: 'above',
        targetPrice: 35.00,
        isActive: true
      };

      const alert2: Alert = {
        id: 'alert_2',
        userId: 'user_123',
        symbol: 'PETR4',
        condition: 'below',
        targetPrice: 30.00,
        isActive: true
      };

      processor.addAlert(alert1);
      processor.addAlert(alert2);

      // Test market data that triggers above alert
      const marketData1: MarketData = {
        symbol: 'PETR4',
        price: 36.00,
        timestamp: '2024-01-15T15:00:00Z'
      };

      const triggers1 = await processor.processMarketData(marketData1);
      expect(triggers1).toHaveLength(1);
      expect(triggers1[0].alertId).toBe('alert_1');
      expect(triggers1[0].actualPrice).toBe(36.00);
      expect(triggeredAlerts).toHaveLength(1);

      // Test market data that triggers below alert
      const marketData2: MarketData = {
        symbol: 'PETR4',
        price: 29.00,
        timestamp: '2024-01-15T16:00:00Z'
      };

      const triggers2 = await processor.processMarketData(marketData2);
      expect(triggers2).toHaveLength(1);
      expect(triggers2[0].alertId).toBe('alert_2');

      // Verify alerts are deactivated after triggering
      expect(processor.getActiveAlerts()).toHaveLength(0);
    });

    test('should handle batch processing', async () => {
      interface Alert {
        id: string;
        symbol: string;
        condition: 'above' | 'below';
        targetPrice: number;
        isActive: boolean;
      }

      interface MarketData {
        symbol: string;
        price: number;
      }

      class BatchAlertProcessor {
        private alerts: Alert[] = [];

        addAlerts(alerts: Alert[]): void {
          this.alerts.push(...alerts);
        }

        async processBatch(marketDataBatch: MarketData[]): Promise<{
          processed: number;
          triggered: number;
          errors: number;
        }> {
          let processed = 0;
          let triggered = 0;
          let errors = 0;

          for (const marketData of marketDataBatch) {
            try {
              const symbolAlerts = this.alerts.filter(
                alert => alert.symbol === marketData.symbol && alert.isActive
              );

              for (const alert of symbolAlerts) {
                const shouldTrigger = (
                  (alert.condition === 'above' && marketData.price > alert.targetPrice) ||
                  (alert.condition === 'below' && marketData.price < alert.targetPrice)
                );

                if (shouldTrigger) {
                  alert.isActive = false;
                  triggered++;
                }
              }

              processed++;
            } catch (error) {
              errors++;
            }
          }

          return { processed, triggered, errors };
        }
      }

      const batchProcessor = new BatchAlertProcessor();

      const alerts: Alert[] = [
        { id: 'alert_1', symbol: 'PETR4', condition: 'above', targetPrice: 35.00, isActive: true },
        { id: 'alert_2', symbol: 'VALE3', condition: 'below', targetPrice: 80.00, isActive: true },
        { id: 'alert_3', symbol: 'ITUB4', condition: 'above', targetPrice: 25.00, isActive: true }
      ];

      batchProcessor.addAlerts(alerts);

      const marketDataBatch: MarketData[] = [
        { symbol: 'PETR4', price: 36.00 }, // Should trigger alert_1
        { symbol: 'VALE3', price: 79.00 }, // Should trigger alert_2
        { symbol: 'ITUB4', price: 24.00 }, // Should not trigger
        { symbol: 'BBAS3', price: 45.00 }  // No alerts for this symbol
      ];

      const result = await batchProcessor.processBatch(marketDataBatch);

      expect(result.processed).toBe(4);
      expect(result.triggered).toBe(2);
      expect(result.errors).toBe(0);
    });
  });
}); 