/**
 * PENNY WISE - NOTIFICATIONS SERVICE TESTS
 * Testing notification creation, management and delivery
 */

import { jest } from '@jest/globals';

describe('Notifications Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Notification Creation', () => {
    test('should create notification with required fields', () => {
      interface Notification {
        id: string;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
        priority: 'low' | 'medium' | 'high' | 'critical';
        userId: string;
        createdAt: string;
        read: boolean;
      }

      const createNotification = (data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification => {
        return {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          read: false,
          ...data
        };
      };

      const notificationData = {
        title: 'Price Alert',
        message: 'PETR4 reached your target price of R$ 35.00',
        type: 'info' as const,
        priority: 'high' as const,
        userId: 'user_123'
      };

      const notification = createNotification(notificationData);

      expect(notification.id).toMatch(/^notif_\d+_[a-z0-9]{9}$/);
      expect(notification.title).toBe('Price Alert');
      expect(notification.message).toBe('PETR4 reached your target price of R$ 35.00');
      expect(notification.type).toBe('info');
      expect(notification.priority).toBe('high');
      expect(notification.userId).toBe('user_123');
      expect(notification.read).toBe(false);
      expect(new Date(notification.createdAt)).toBeInstanceOf(Date);
    });

    test('should validate notification data', () => {
      const validateNotification = (data: Record<string, unknown>): string[] => {
        const errors: string[] = [];

        if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
          errors.push('Title is required and must be a non-empty string');
        }

        if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
          errors.push('Message is required and must be a non-empty string');
        }

        if (!data.type || !['info', 'warning', 'error', 'success'].includes(data.type as string)) {
          errors.push('Type must be one of: info, warning, error, success');
        }

        if (!data.priority || !['low', 'medium', 'high', 'critical'].includes(data.priority as string)) {
          errors.push('Priority must be one of: low, medium, high, critical');
        }

        if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
          errors.push('UserId is required and must be a non-empty string');
        }

        return errors;
      };

      const validData = {
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        priority: 'medium',
        userId: 'user_123'
      };

      const invalidData = {
        title: '',
        message: null,
        type: 'invalid',
        priority: 'invalid',
        userId: ''
      };

      expect(validateNotification(validData)).toHaveLength(0);
      expect(validateNotification(invalidData)).toHaveLength(5);
    });
  });

  describe('Notification Management', () => {
    test('should manage notification queue', () => {
      interface Notification {
        id: string;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
        priority: 'low' | 'medium' | 'high' | 'critical';
        userId: string;
        createdAt: string;
        read: boolean;
      }

      class NotificationQueue {
        private notifications: Notification[] = [];

        add(notification: Notification): void {
          this.notifications.push(notification);
          this.sortByPriority();
        }

        getByUserId(userId: string): Notification[] {
          return this.notifications.filter(n => n.userId === userId);
        }

        markAsRead(id: string): boolean {
          const notification = this.notifications.find(n => n.id === id);
          if (notification) {
            notification.read = true;
            return true;
          }
          return false;
        }

        remove(id: string): boolean {
          const index = this.notifications.findIndex(n => n.id === id);
          if (index !== -1) {
            this.notifications.splice(index, 1);
            return true;
          }
          return false;
        }

        getUnreadCount(userId: string): number {
          return this.notifications.filter(n => n.userId === userId && !n.read).length;
        }

        private sortByPriority(): void {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          this.notifications.sort((a, b) => 
            priorityOrder[b.priority] - priorityOrder[a.priority]
          );
        }

        size(): number {
          return this.notifications.length;
        }

        clear(): void {
          this.notifications = [];
        }
      }

      const queue = new NotificationQueue();
      
      const notification1: Notification = {
        id: 'notif_1',
        title: 'Low Priority',
        message: 'Test message',
        type: 'info',
        priority: 'low',
        userId: 'user_123',
        createdAt: new Date().toISOString(),
        read: false
      };

      const notification2: Notification = {
        id: 'notif_2',
        title: 'Critical Alert',
        message: 'Critical message',
        type: 'error',
        priority: 'critical',
        userId: 'user_123',
        createdAt: new Date().toISOString(),
        read: false
      };

      queue.add(notification1);
      queue.add(notification2);

      expect(queue.size()).toBe(2);
      expect(queue.getUnreadCount('user_123')).toBe(2);

      // Critical should be first after sorting
      const userNotifications = queue.getByUserId('user_123');
      expect(userNotifications[0].priority).toBe('critical');
      expect(userNotifications[1].priority).toBe('low');

      // Mark as read
      expect(queue.markAsRead('notif_1')).toBe(true);
      expect(queue.getUnreadCount('user_123')).toBe(1);

      // Remove notification
      expect(queue.remove('notif_2')).toBe(true);
      expect(queue.size()).toBe(1);

      queue.clear();
      expect(queue.size()).toBe(0);
    });

    test('should filter notifications by criteria', () => {
      interface Notification {
        id: string;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
        priority: 'low' | 'medium' | 'high' | 'critical';
        userId: string;
        createdAt: string;
        read: boolean;
      }

      const notifications: Notification[] = [
        {
          id: 'notif_1',
          title: 'Price Alert',
          message: 'PETR4 price changed',
          type: 'info',
          priority: 'medium',
          userId: 'user_123',
          createdAt: '2024-01-15T10:00:00Z',
          read: false
        },
        {
          id: 'notif_2',
          title: 'System Error',
          message: 'API connection failed',
          type: 'error',
          priority: 'high',
          userId: 'user_123',
          createdAt: '2024-01-15T11:00:00Z',
          read: true
        },
        {
          id: 'notif_3',
          title: 'Market Update',
          message: 'Market closed',
          type: 'info',
          priority: 'low',
          userId: 'user_456',
          createdAt: '2024-01-15T18:00:00Z',
          read: false
        }
      ];

      const filterNotifications = (
        notifications: Notification[],
        criteria: {
          userId?: string;
          type?: string;
          priority?: string;
          read?: boolean;
          dateFrom?: string;
          dateTo?: string;
        }
      ): Notification[] => {
        return notifications.filter(notification => {
          if (criteria.userId && notification.userId !== criteria.userId) return false;
          if (criteria.type && notification.type !== criteria.type) return false;
          if (criteria.priority && notification.priority !== criteria.priority) return false;
          if (criteria.read !== undefined && notification.read !== criteria.read) return false;
          
          if (criteria.dateFrom) {
            const notifDate = new Date(notification.createdAt);
            const fromDate = new Date(criteria.dateFrom);
            if (notifDate < fromDate) return false;
          }
          
          if (criteria.dateTo) {
            const notifDate = new Date(notification.createdAt);
            const toDate = new Date(criteria.dateTo);
            if (notifDate > toDate) return false;
          }
          
          return true;
        });
      };

      // Filter by user
      const user123Notifications = filterNotifications(notifications, { userId: 'user_123' });
      expect(user123Notifications).toHaveLength(2);

      // Filter by type
      const errorNotifications = filterNotifications(notifications, { type: 'error' });
      expect(errorNotifications).toHaveLength(1);
      expect(errorNotifications[0].title).toBe('System Error');

      // Filter by read status
      const unreadNotifications = filterNotifications(notifications, { read: false });
      expect(unreadNotifications).toHaveLength(2);

      // Filter by date range
      const morningNotifications = filterNotifications(notifications, {
        dateFrom: '2024-01-15T09:00:00Z',
        dateTo: '2024-01-15T12:00:00Z'
      });
      expect(morningNotifications).toHaveLength(2);

      // Combined filters
      const user123UnreadInfo = filterNotifications(notifications, {
        userId: 'user_123',
        type: 'info',
        read: false
      });
      expect(user123UnreadInfo).toHaveLength(1);
      expect(user123UnreadInfo[0].title).toBe('Price Alert');
    });
  });

  describe('Notification Delivery', () => {
    test('should handle delivery channels', () => {
      interface DeliveryChannel {
        name: string;
        enabled: boolean;
        config: Record<string, unknown>;
      }

      interface NotificationDelivery {
        notificationId: string;
        channel: string;
        status: 'pending' | 'sent' | 'failed' | 'delivered';
        attempts: number;
        lastAttempt?: string;
        error?: string;
      }

      class NotificationDeliveryService {
        private channels: Map<string, DeliveryChannel> = new Map();
        private deliveries: NotificationDelivery[] = [];

        addChannel(channel: DeliveryChannel): void {
          this.channels.set(channel.name, channel);
        }

        async sendNotification(notificationId: string, channelName: string): Promise<boolean> {
          const channel = this.channels.get(channelName);
          if (!channel || !channel.enabled) {
            this.recordDelivery(notificationId, channelName, 'failed', 'Channel not available');
            return false;
          }

          const delivery = this.getOrCreateDelivery(notificationId, channelName);
          delivery.attempts++;
          delivery.lastAttempt = new Date().toISOString();
          delivery.status = 'pending';

          try {
            // Simulate delivery based on channel
            const success = await this.simulateDelivery(channelName);
            
            if (success) {
              delivery.status = 'sent';
              return true;
            } else {
              delivery.status = 'failed';
              delivery.error = 'Delivery failed';
              return false;
            }
          } catch (error) {
            delivery.status = 'failed';
            delivery.error = error instanceof Error ? error.message : 'Unknown error';
            return false;
          }
        }

        private async simulateDelivery(channelName: string): Promise<boolean> {
          // Simulate different success rates for different channels
          const successRates: Record<string, number> = {
            'email': 0.95,
            'push': 0.85,
            'sms': 0.90,
            'webhook': 0.80
          };

          const rate = successRates[channelName] || 0.5;
          return Math.random() < rate;
        }

        private getOrCreateDelivery(notificationId: string, channel: string): NotificationDelivery {
          let delivery = this.deliveries.find(d => 
            d.notificationId === notificationId && d.channel === channel
          );

          if (!delivery) {
            delivery = {
              notificationId,
              channel,
              status: 'pending',
              attempts: 0
            };
            this.deliveries.push(delivery);
          }

          return delivery;
        }

        private recordDelivery(
          notificationId: string, 
          channel: string, 
          status: NotificationDelivery['status'], 
          error?: string
        ): void {
          const delivery = this.getOrCreateDelivery(notificationId, channel);
          delivery.status = status;
          delivery.attempts++;
          delivery.lastAttempt = new Date().toISOString();
          if (error) delivery.error = error;
        }

        getDeliveryStatus(notificationId: string): NotificationDelivery[] {
          return this.deliveries.filter(d => d.notificationId === notificationId);
        }

        getChannels(): DeliveryChannel[] {
          return Array.from(this.channels.values());
        }
      }

      const deliveryService = new NotificationDeliveryService();

      // Add channels
      deliveryService.addChannel({
        name: 'email',
        enabled: true,
        config: { smtp: 'smtp.example.com' }
      });

      deliveryService.addChannel({
        name: 'push',
        enabled: true,
        config: { apiKey: 'push-api-key' }
      });

      deliveryService.addChannel({
        name: 'disabled',
        enabled: false,
        config: {}
      });

      expect(deliveryService.getChannels()).toHaveLength(3);

      // Test delivery to enabled channel
      const emailResult = deliveryService.sendNotification('notif_1', 'email');
      expect(emailResult).resolves.toBeDefined();

      // Test delivery to disabled channel
      const disabledResult = deliveryService.sendNotification('notif_1', 'disabled');
      expect(disabledResult).resolves.toBe(false);

      // Test delivery to non-existent channel
      const nonExistentResult = deliveryService.sendNotification('notif_1', 'nonexistent');
      expect(nonExistentResult).resolves.toBe(false);
    });

    test('should implement retry logic', async () => {
      interface RetryConfig {
        maxAttempts: number;
        backoffMs: number;
        backoffMultiplier: number;
      }

      class RetryableDelivery {
        private config: RetryConfig;

        constructor(config: RetryConfig) {
          this.config = config;
        }

        async deliverWithRetry(
          deliveryFn: () => Promise<boolean>,
          onAttempt?: (attempt: number) => void
        ): Promise<{ success: boolean; attempts: number; error?: string }> {
          let attempts = 0;
          let lastError: string | undefined;

          for (let i = 0; i < this.config.maxAttempts; i++) {
            attempts++;
            
            if (onAttempt) onAttempt(attempts);

            try {
              const success = await deliveryFn();
              if (success) {
                return { success: true, attempts };
              }
              lastError = `Attempt ${attempts} failed`;
            } catch (error) {
              lastError = error instanceof Error ? error.message : 'Unknown error';
            }

            // Wait before retry (except for last attempt)
            if (i < this.config.maxAttempts - 1) {
              const delay = this.config.backoffMs * Math.pow(this.config.backoffMultiplier, i);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          return { success: false, attempts, error: lastError };
        }
      }

      const retryDelivery = new RetryableDelivery({
        maxAttempts: 3,
        backoffMs: 100,
        backoffMultiplier: 2
      });

      // Test successful delivery on second attempt
      let callCount = 0;
      const mockDelivery = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount >= 2);
      });

      const result = await retryDelivery.deliverWithRetry(mockDelivery);
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(mockDelivery).toHaveBeenCalledTimes(2);

      // Test all attempts fail
      const failingDelivery = jest.fn().mockResolvedValue(false);
      const failResult = await retryDelivery.deliverWithRetry(failingDelivery);
      
      expect(failResult.success).toBe(false);
      expect(failResult.attempts).toBe(3);
      expect(failResult.error).toBeDefined();
    });
  });

  describe('Notification Templates', () => {
    test('should render notification templates', () => {
      interface NotificationTemplate {
        id: string;
        name: string;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
        variables: string[];
      }

      class NotificationTemplateEngine {
        private templates: Map<string, NotificationTemplate> = new Map();

        addTemplate(template: NotificationTemplate): void {
          this.templates.set(template.id, template);
        }

        render(templateId: string, variables: Record<string, string>): { title: string; message: string } | null {
          const template = this.templates.get(templateId);
          if (!template) return null;

          let title = template.title;
          let message = template.message;

          // Replace variables in title and message
          for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            title = title.replace(new RegExp(placeholder, 'g'), value);
            message = message.replace(new RegExp(placeholder, 'g'), value);
          }

          return { title, message };
        }

        getTemplate(id: string): NotificationTemplate | undefined {
          return this.templates.get(id);
        }

        listTemplates(): NotificationTemplate[] {
          return Array.from(this.templates.values());
        }
      }

      const templateEngine = new NotificationTemplateEngine();

      const priceAlertTemplate: NotificationTemplate = {
        id: 'price_alert',
        name: 'Price Alert',
        title: 'Price Alert: {{symbol}}',
        message: '{{symbol}} has reached {{price}}. Your target was {{target}}.',
        type: 'info',
        variables: ['symbol', 'price', 'target']
      };

      templateEngine.addTemplate(priceAlertTemplate);

      const rendered = templateEngine.render('price_alert', {
        symbol: 'PETR4',
        price: 'R$ 35.00',
        target: 'R$ 35.00'
      });

      expect(rendered).not.toBeNull();
      expect(rendered!.title).toBe('Price Alert: PETR4');
      expect(rendered!.message).toBe('PETR4 has reached R$ 35.00. Your target was R$ 35.00.');

      // Test non-existent template
      const nonExistent = templateEngine.render('non_existent', {});
      expect(nonExistent).toBeNull();

      // Test template listing
      expect(templateEngine.listTemplates()).toHaveLength(1);
      expect(templateEngine.getTemplate('price_alert')).toEqual(priceAlertTemplate);
    });
  });
}); 