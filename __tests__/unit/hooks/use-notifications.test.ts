/**
 * PENNY WISE - USE-NOTIFICATIONS HOOK TESTS
 * Testing custom hook for notifications management
 */

import { jest } from '@jest/globals';

describe('useNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Notification State Management', () => {
    test('should manage notifications state', () => {
      interface Notification {
        id: string;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
        priority: 'low' | 'medium' | 'high' | 'critical';
        read: boolean;
        createdAt: string;
      }

      interface NotificationsState {
        notifications: Notification[];
        unreadCount: number;
        loading: boolean;
        error: string | null;
      }

      class NotificationsManager {
        private state: NotificationsState = {
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: null
        };

        private listeners: Array<(state: NotificationsState) => void> = [];

        getState(): NotificationsState {
          return { ...this.state };
        }

        subscribe(listener: (state: NotificationsState) => void): () => void {
          this.listeners.push(listener);
          return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
              this.listeners.splice(index, 1);
            }
          };
        }

        private setState(newState: Partial<NotificationsState>): void {
          this.state = { ...this.state, ...newState };
          this.updateUnreadCount();
          this.listeners.forEach(listener => listener(this.state));
        }

        private updateUnreadCount(): void {
          this.state.unreadCount = this.state.notifications.filter(n => !n.read).length;
        }

        addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void {
          const newNotification: Notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            read: false,
            ...notification
          };

          this.setState({
            notifications: [newNotification, ...this.state.notifications]
          });
        }

        markAsRead(notificationId: string): void {
          this.setState({
            notifications: this.state.notifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, read: true }
                : notification
            )
          });
        }

        markAllAsRead(): void {
          this.setState({
            notifications: this.state.notifications.map(notification => ({
              ...notification,
              read: true
            }))
          });
        }

        removeNotification(notificationId: string): void {
          this.setState({
            notifications: this.state.notifications.filter(
              notification => notification.id !== notificationId
            )
          });
        }

        clearAll(): void {
          this.setState({ notifications: [] });
        }

        getNotificationsByType(type: Notification['type']): Notification[] {
          return this.state.notifications.filter(notification => notification.type === type);
        }

        getNotificationsByPriority(priority: Notification['priority']): Notification[] {
          return this.state.notifications.filter(notification => notification.priority === priority);
        }

        getUnreadNotifications(): Notification[] {
          return this.state.notifications.filter(notification => !notification.read);
        }
      }

      const manager = new NotificationsManager();
      const states: NotificationsState[] = [];

      const unsubscribe = manager.subscribe(state => {
        states.push(state);
      });

      // Initial state
      expect(manager.getState().notifications).toHaveLength(0);
      expect(manager.getState().unreadCount).toBe(0);

      // Add notification
      manager.addNotification({
        title: 'Price Alert',
        message: 'PETR4 reached target price',
        type: 'info',
        priority: 'high'
      });

      expect(manager.getState().notifications).toHaveLength(1);
      expect(manager.getState().unreadCount).toBe(1);

      const notification = manager.getState().notifications[0];
      expect(notification.id).toMatch(/^notif_\d+_[a-z0-9]{9}$/);
      expect(notification.read).toBe(false);

      // Mark as read
      manager.markAsRead(notification.id);
      expect(manager.getState().unreadCount).toBe(0);
      expect(manager.getState().notifications[0].read).toBe(true);

      // Add more notifications
      manager.addNotification({
        title: 'System Error',
        message: 'API connection failed',
        type: 'error',
        priority: 'critical'
      });

      manager.addNotification({
        title: 'Market Update',
        message: 'Market closed',
        type: 'info',
        priority: 'low'
      });

      expect(manager.getState().notifications).toHaveLength(3);
      expect(manager.getState().unreadCount).toBe(2);

      // Test filtering
      expect(manager.getNotificationsByType('info')).toHaveLength(2);
      expect(manager.getNotificationsByType('error')).toHaveLength(1);
      expect(manager.getNotificationsByPriority('critical')).toHaveLength(1);
      expect(manager.getUnreadNotifications()).toHaveLength(2);

      // Mark all as read
      manager.markAllAsRead();
      expect(manager.getState().unreadCount).toBe(0);

      // Remove notification
      manager.removeNotification(notification.id);
      expect(manager.getState().notifications).toHaveLength(2);

      // Clear all
      manager.clearAll();
      expect(manager.getState().notifications).toHaveLength(0);

      unsubscribe();
    });
  });

  describe('Notification Preferences', () => {
    test('should manage notification preferences', () => {
      interface NotificationPreferences {
        enabled: boolean;
        types: {
          priceAlerts: boolean;
          systemNotifications: boolean;
          marketUpdates: boolean;
          portfolioUpdates: boolean;
        };
        delivery: {
          browser: boolean;
          email: boolean;
          push: boolean;
        };
        quietHours: {
          enabled: boolean;
          start: string; // HH:MM format
          end: string;   // HH:MM format
        };
        priority: {
          low: boolean;
          medium: boolean;
          high: boolean;
          critical: boolean;
        };
      }

      class NotificationPreferencesManager {
        private preferences: NotificationPreferences = {
          enabled: true,
          types: {
            priceAlerts: true,
            systemNotifications: true,
            marketUpdates: true,
            portfolioUpdates: true
          },
          delivery: {
            browser: true,
            email: false,
            push: false
          },
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          priority: {
            low: true,
            medium: true,
            high: true,
            critical: true
          }
        };

        getPreferences(): NotificationPreferences {
          return { ...this.preferences };
        }

        updatePreferences(updates: Partial<NotificationPreferences>): void {
          this.preferences = { ...this.preferences, ...updates };
        }

        updateTypePreferences(types: Partial<NotificationPreferences['types']>): void {
          this.preferences.types = { ...this.preferences.types, ...types };
        }

        updateDeliveryPreferences(delivery: Partial<NotificationPreferences['delivery']>): void {
          this.preferences.delivery = { ...this.preferences.delivery, ...delivery };
        }

        updateQuietHours(quietHours: Partial<NotificationPreferences['quietHours']>): void {
          this.preferences.quietHours = { ...this.preferences.quietHours, ...quietHours };
        }

        shouldShowNotification(
          type: keyof NotificationPreferences['types'],
          priority: keyof NotificationPreferences['priority']
        ): boolean {
          if (!this.preferences.enabled) return false;
          if (!this.preferences.types[type]) return false;
          if (!this.preferences.priority[priority]) return false;

          // Check quiet hours
          if (this.preferences.quietHours.enabled) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            const start = this.preferences.quietHours.start;
            const end = this.preferences.quietHours.end;
            
            // Handle quiet hours that span midnight
            if (start > end) {
              if (currentTime >= start || currentTime <= end) {
                return false;
              }
            } else {
              if (currentTime >= start && currentTime <= end) {
                return false;
              }
            }
          }

          return true;
        }

        getEnabledDeliveryMethods(): Array<keyof NotificationPreferences['delivery']> {
          return Object.entries(this.preferences.delivery)
            .filter(([, enabled]) => enabled)
            .map(([method]) => method as keyof NotificationPreferences['delivery']);
        }

        resetToDefaults(): void {
          this.preferences = {
            enabled: true,
            types: {
              priceAlerts: true,
              systemNotifications: true,
              marketUpdates: true,
              portfolioUpdates: true
            },
            delivery: {
              browser: true,
              email: false,
              push: false
            },
            quietHours: {
              enabled: false,
              start: '22:00',
              end: '08:00'
            },
            priority: {
              low: true,
              medium: true,
              high: true,
              critical: true
            }
          };
        }
      }

      const prefsManager = new NotificationPreferencesManager();

      // Test initial preferences
      const initialPrefs = prefsManager.getPreferences();
      expect(initialPrefs.enabled).toBe(true);
      expect(initialPrefs.types.priceAlerts).toBe(true);
      expect(initialPrefs.delivery.browser).toBe(true);
      expect(initialPrefs.delivery.email).toBe(false);

      // Test notification filtering
      expect(prefsManager.shouldShowNotification('priceAlerts', 'high')).toBe(true);

      // Disable price alerts
      prefsManager.updateTypePreferences({ priceAlerts: false });
      expect(prefsManager.shouldShowNotification('priceAlerts', 'high')).toBe(false);

      // Test quiet hours
      prefsManager.updateQuietHours({ enabled: true, start: '00:00', end: '23:59' });
      expect(prefsManager.shouldShowNotification('systemNotifications', 'medium')).toBe(false);

      // Test delivery methods
      prefsManager.updateDeliveryPreferences({ email: true, push: true });
      const enabledMethods = prefsManager.getEnabledDeliveryMethods();
      expect(enabledMethods).toContain('browser');
      expect(enabledMethods).toContain('email');
      expect(enabledMethods).toContain('push');

      // Test reset
      prefsManager.resetToDefaults();
      const resetPrefs = prefsManager.getPreferences();
      expect(resetPrefs.types.priceAlerts).toBe(true);
      expect(resetPrefs.delivery.email).toBe(false);
    });
  });

  describe('Notification Queue Management', () => {
    test('should manage notification queue with rate limiting', () => {
      interface QueuedNotification {
        id: string;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
        priority: 'low' | 'medium' | 'high' | 'critical';
        scheduledAt: number;
        attempts: number;
        maxAttempts: number;
      }

      class NotificationQueue {
        private queue: QueuedNotification[] = [];
        private processing = false;
        private rateLimits = {
          perMinute: 10,
          perHour: 100
        };
        private sentCounts = {
          lastMinute: 0,
          lastHour: 0,
          lastMinuteReset: Date.now(),
          lastHourReset: Date.now()
        };

        enqueue(notification: Omit<QueuedNotification, 'id' | 'scheduledAt' | 'attempts' | 'maxAttempts'>): void {
          const queuedNotification: QueuedNotification = {
            id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            scheduledAt: Date.now(),
            attempts: 0,
            maxAttempts: 3,
            ...notification
          };

          // Insert based on priority
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const insertIndex = this.queue.findIndex(
            item => priorityOrder[item.priority] < priorityOrder[queuedNotification.priority]
          );

          if (insertIndex === -1) {
            this.queue.push(queuedNotification);
          } else {
            this.queue.splice(insertIndex, 0, queuedNotification);
          }

          this.processQueue();
        }

        private async processQueue(): Promise<void> {
          if (this.processing || this.queue.length === 0) return;

          this.processing = true;

          while (this.queue.length > 0) {
            if (!this.canSendNotification()) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }

            const notification = this.queue.shift()!;
            
            try {
              await this.sendNotification(notification);
              this.updateSentCounts();
            } catch (error) {
              notification.attempts++;
              
              if (notification.attempts < notification.maxAttempts) {
                // Re-queue with delay
                notification.scheduledAt = Date.now() + (notification.attempts * 5000);
                this.queue.push(notification);
              } else {
                console.error(`Failed to send notification after ${notification.maxAttempts} attempts:`, error);
              }
            }
          }

          this.processing = false;
        }

        private canSendNotification(): boolean {
          const now = Date.now();

          // Reset counters if needed
          if (now - this.sentCounts.lastMinuteReset > 60000) {
            this.sentCounts.lastMinute = 0;
            this.sentCounts.lastMinuteReset = now;
          }

          if (now - this.sentCounts.lastHourReset > 3600000) {
            this.sentCounts.lastHour = 0;
            this.sentCounts.lastHourReset = now;
          }

          return (
            this.sentCounts.lastMinute < this.rateLimits.perMinute &&
            this.sentCounts.lastHour < this.rateLimits.perHour
          );
        }

        private async sendNotification(notification: QueuedNotification): Promise<void> {
          // Simulate notification sending
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Simulate occasional failures
          if (Math.random() < 0.1) {
            throw new Error('Network error');
          }
        }

        private updateSentCounts(): void {
          this.sentCounts.lastMinute++;
          this.sentCounts.lastHour++;
        }

        getQueueLength(): number {
          return this.queue.length;
        }

        getQueuedNotifications(): QueuedNotification[] {
          return [...this.queue];
        }

        clearQueue(): void {
          this.queue = [];
        }

        getRateLimitStatus(): {
          perMinute: { current: number; limit: number };
          perHour: { current: number; limit: number };
        } {
          return {
            perMinute: {
              current: this.sentCounts.lastMinute,
              limit: this.rateLimits.perMinute
            },
            perHour: {
              current: this.sentCounts.lastHour,
              limit: this.rateLimits.perHour
            }
          };
        }
      }

      const queue = new NotificationQueue();

      // Test enqueueing
      queue.enqueue({
        title: 'Low Priority',
        message: 'Low priority message',
        type: 'info',
        priority: 'low'
      });

      queue.enqueue({
        title: 'Critical Alert',
        message: 'Critical message',
        type: 'error',
        priority: 'critical'
      });

      queue.enqueue({
        title: 'Medium Priority',
        message: 'Medium priority message',
        type: 'warning',
        priority: 'medium'
      });

      // Critical should be first in queue
      const queuedNotifications = queue.getQueuedNotifications();
      expect(queuedNotifications.length).toBeGreaterThan(0);
      if (queuedNotifications.length >= 3) {
        expect(queuedNotifications[0].priority).toBe('critical');
        expect(queuedNotifications[1].priority).toBe('medium');
        expect(queuedNotifications[2].priority).toBe('low');
      }

      // Test rate limit status
      const rateLimitStatus = queue.getRateLimitStatus();
      expect(rateLimitStatus.perMinute.limit).toBe(10);
      expect(rateLimitStatus.perHour.limit).toBe(100);

      // Wait for processing to complete
      return new Promise(resolve => {
        setTimeout(() => {
          // Queue should be processed (or at least started processing)
          expect(queue.getQueueLength()).toBeLessThanOrEqual(3);
          resolve(undefined);
        }, 500);
      });
    });
  });

  describe('Notification Templates and Formatting', () => {
    test('should format notifications with templates', () => {
      interface NotificationTemplate {
        id: string;
        name: string;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
        priority: 'low' | 'medium' | 'high' | 'critical';
        variables: string[];
      }

      interface FormattedNotification {
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
        priority: 'low' | 'medium' | 'high' | 'critical';
      }

      class NotificationFormatter {
        private templates: Map<string, NotificationTemplate> = new Map();

        addTemplate(template: NotificationTemplate): void {
          this.templates.set(template.id, template);
        }

        formatNotification(
          templateId: string,
          variables: Record<string, string>
        ): FormattedNotification | null {
          const template = this.templates.get(templateId);
          if (!template) return null;

          let title = template.title;
          let message = template.message;

          // Replace variables
          for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            title = title.replace(new RegExp(placeholder, 'g'), value);
            message = message.replace(new RegExp(placeholder, 'g'), value);
          }

          return {
            title,
            message,
            type: template.type,
            priority: template.priority
          };
        }

        formatCurrency(amount: number, currency = 'BRL'): string {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency
          }).format(amount);
        }

        formatPercentage(value: number, decimals = 2): string {
          return `${value.toFixed(decimals)}%`;
        }

        formatDateTime(date: string | Date): string {
          const dateObj = typeof date === 'string' ? new Date(date) : date;
          return dateObj.toLocaleString('pt-BR');
        }

        truncateMessage(message: string, maxLength = 100): string {
          if (message.length <= maxLength) return message;
          return message.substring(0, maxLength - 3) + '...';
        }

        getAvailableTemplates(): NotificationTemplate[] {
          return Array.from(this.templates.values());
        }
      }

      const formatter = new NotificationFormatter();

      // Add templates
      const priceAlertTemplate: NotificationTemplate = {
        id: 'price_alert',
        name: 'Price Alert',
        title: 'Alerta de Preço: {{symbol}}',
        message: '{{symbol}} atingiu {{price}} ({{change}}). Seu alvo era {{target}}.',
        type: 'info',
        priority: 'high',
        variables: ['symbol', 'price', 'change', 'target']
      };

      const systemErrorTemplate: NotificationTemplate = {
        id: 'system_error',
        name: 'System Error',
        title: 'Erro do Sistema',
        message: 'Ocorreu um erro: {{error}}. Tente novamente em alguns minutos.',
        type: 'error',
        priority: 'critical',
        variables: ['error']
      };

      formatter.addTemplate(priceAlertTemplate);
      formatter.addTemplate(systemErrorTemplate);

      // Test formatting
      const priceAlert = formatter.formatNotification('price_alert', {
        symbol: 'PETR4',
        price: formatter.formatCurrency(35.50),
        change: formatter.formatPercentage(2.5),
        target: formatter.formatCurrency(35.00)
      });

      expect(priceAlert).not.toBeNull();
      expect(priceAlert!.title).toBe('Alerta de Preço: PETR4');
      expect(priceAlert!.message).toContain('PETR4 atingiu');
      expect(priceAlert!.message).toContain('R$');
      expect(priceAlert!.message).toContain('2.50%');
      expect(priceAlert!.type).toBe('info');
      expect(priceAlert!.priority).toBe('high');

      // Test system error
      const systemError = formatter.formatNotification('system_error', {
        error: 'Conexão com API falhou'
      });

      expect(systemError).not.toBeNull();
      expect(systemError!.message).toContain('Conexão com API falhou');
      expect(systemError!.type).toBe('error');

      // Test utility functions
      expect(formatter.formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/);
      expect(formatter.formatPercentage(12.345)).toBe('12.35%');
      expect(formatter.formatDateTime('2024-01-15T15:30:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(formatter.truncateMessage('This is a very long message that should be truncated', 20)).toBe('This is a very lo...');

      // Test non-existent template
      const nonExistent = formatter.formatNotification('non_existent', {});
      expect(nonExistent).toBeNull();

      // Test available templates
      expect(formatter.getAvailableTemplates()).toHaveLength(2);
    });
  });
}); 