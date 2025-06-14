// ==========================================
// NOTIFICATIONS SERVICE - Day 5 Notification Management (Temporary Implementation)
// ==========================================

import type {
  Notification,
  CreateNotification,
  NotificationsResponse,
  NotificationPreferences,
  UpdateNotificationPreferences,
  PushNotificationPayload,
  NotificationStats,
  NotificationType,
  NotificationPriority,
} from '@/lib/types/alerts';

export class NotificationService {
  // ==========================================
  // MOCK DATA FOR DEMONSTRATION
  // ==========================================

  private mockNotifications: Notification[] = [
    {
      id: '1',
      user_id: 'demo-user',
      title: 'Alert Triggered',
      message: 'AAPL price $148.50 is above target $145.00',
      type: 'alert',
      priority: 'high',
      read: false,
      data: {
        alert_id: '1',
        symbol: 'AAPL',
        current_price: 148.5,
        target_price: 145.0,
      },
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'demo-user',
      title: 'Market Update',
      message: 'NASDAQ is up 2.5% today',
      type: 'market',
      priority: 'medium',
      read: true,
      data: {
        index: 'NASDAQ',
        change_percent: 2.5,
      },
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: '3',
      user_id: 'demo-user',
      title: 'System Update',
      message: 'New features available in the dashboard',
      type: 'system',
      priority: 'low',
      read: false,
      data: {},
      created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
  ];

  private mockPreferences: NotificationPreferences = {
    id: '1',
    user_id: 'demo-user',
    push_enabled: true,
    email_enabled: true,
    alert_notifications: true,
    market_notifications: true,
    news_notifications: false,
    system_notifications: true,
    timezone: 'UTC',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async createNotification(
    notification: CreateNotification
  ): Promise<Notification> {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: 'demo-user',
      ...notification,
      priority: notification.priority || 'medium',
      read: false,
      data: notification.data || {},
      created_at: new Date().toISOString(),
    };

    this.mockNotifications.unshift(newNotification); // Add to beginning

    // Send push notification if enabled
    await this.sendPushNotificationIfEnabled(newNotification);

    return newNotification;
  }

  async getUserNotifications(): Promise<NotificationsResponse> {
    const notifications = this.mockNotifications;
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;

    return {
      notifications,
      total,
      unread,
    };
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    return this.mockNotifications.find(n => n.id === id) || null;
  }

  async markAsRead(id: string): Promise<Notification> {
    const notificationIndex = this.mockNotifications.findIndex(
      n => n.id === id
    );
    if (notificationIndex === -1) throw new Error('Notification not found');

    this.mockNotifications[notificationIndex].read = true;
    return this.mockNotifications[notificationIndex];
  }

  async markAllAsRead(): Promise<number> {
    let count = 0;
    for (const notification of this.mockNotifications) {
      if (!notification.read) {
        notification.read = true;
        count++;
      }
    }
    return count;
  }

  async deleteNotification(id: string): Promise<void> {
    const notificationIndex = this.mockNotifications.findIndex(
      n => n.id === id
    );
    if (notificationIndex === -1) throw new Error('Notification not found');

    this.mockNotifications.splice(notificationIndex, 1);
  }

  async clearAllNotifications(): Promise<number> {
    const count = this.mockNotifications.length;
    this.mockNotifications.length = 0; // Clear array
    return count;
  }

  // ==========================================
  // NOTIFICATION PREFERENCES
  // ==========================================

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return this.mockPreferences;
  }

  async updateNotificationPreferences(
    updates: UpdateNotificationPreferences
  ): Promise<NotificationPreferences> {
    Object.assign(this.mockPreferences, updates, {
      updated_at: new Date().toISOString(),
    });
    return this.mockPreferences;
  }

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================

  async initializePushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return false;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async sendPushNotification(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    // Check if user has push notifications enabled
    const preferences = await this.getNotificationPreferences();
    if (!preferences?.push_enabled) return;

    // Use browser's Notification API for demo
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge,
        data: payload.data,
        tag: `notification-${Date.now()}`,
      });
    }

    console.log(`📨 Push notification sent to ${userId}:`, payload.title);
  }

  private async sendPushNotificationIfEnabled(
    notification: Notification
  ): Promise<void> {
    const preferences = await this.getNotificationPreferences();

    if (!preferences?.push_enabled) return;

    // Check notification type preferences
    const shouldSend = this.shouldSendNotification(
      notification.type,
      preferences
    );
    if (!shouldSend) return;

    // Check quiet hours
    if (this.isInQuietHours(preferences)) return;

    // Send push notification
    await this.sendPushNotification(notification.user_id, {
      title: notification.title,
      body: notification.message,
      data: notification.data ?? undefined,
    });
  }

  private shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'alert':
        return preferences.alert_notifications ?? true;
      case 'market':
        return preferences.market_notifications ?? true;
      case 'news':
        return preferences.news_notifications ?? true;
      case 'system':
        return preferences.system_notifications ?? true;
      default:
        return true;
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.quiet_hours_start
      .split(':')
      .map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end
      .split(':')
      .map(Number);

    const quietStart = startHour * 60 + startMin;
    const quietEnd = endHour * 60 + endMin;

    if (quietStart <= quietEnd) {
      return currentTime >= quietStart && currentTime <= quietEnd;
    } else {
      // Crosses midnight
      return currentTime >= quietStart || currentTime <= quietEnd;
    }
  }

  // ==========================================
  // STATISTICS & ANALYTICS
  // ==========================================

  async getNotificationStats(): Promise<NotificationStats> {
    const notifications = this.mockNotifications;
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;

    // Group by type
    const by_type = notifications.reduce(
      (acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by priority
    const by_priority = notifications.reduce(
      (acc, notification) => {
        const priority = notification.priority ?? 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      unread,
      by_type: by_type as Record<NotificationType, number>,
      by_priority: by_priority as Record<NotificationPriority, number>,
    };
  }

  // ==========================================
  // CLEANUP & MAINTENANCE
  // ==========================================

  async cleanupExpiredNotifications(): Promise<number> {
    // Mock cleanup - remove notifications older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const initialLength = this.mockNotifications.length;

    this.mockNotifications.filter(
      n => n.created_at && new Date(n.created_at) > thirtyDaysAgo
    );

    return initialLength - this.mockNotifications.length;
  }

  // ==========================================
  // DEMO METHODS
  // ==========================================

  async createDemoNotification(
    type: NotificationType = 'system'
  ): Promise<Notification> {
    const demoNotifications = {
      alert: {
        title: 'Price Alert Triggered',
        message: 'TSLA reached your target price of $250.00',
        data: { symbol: 'TSLA', price: 250.0 },
      },
      market: {
        title: 'Market Update',
        message: 'S&P 500 is up 1.8% today',
        data: { index: 'S&P 500', change: 1.8 },
      },
      news: {
        title: 'Breaking News',
        message: 'Apple announces new product launch',
        data: { company: 'Apple', category: 'product' },
      },
      system: {
        title: 'System Notification',
        message: 'Your portfolio analysis is ready',
        data: { action: 'portfolio_analysis' },
      },
      portfolio: {
        title: 'Portfolio Update',
        message: 'Your portfolio gained 2.3% today',
        data: { change_percent: 2.3 },
      },
    };

    const demo = demoNotifications[type];
    return this.createNotification({
      title: demo.title,
      message: demo.message,
      type,
      priority: type === 'alert' ? 'high' : 'medium',
      data: demo.data,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
