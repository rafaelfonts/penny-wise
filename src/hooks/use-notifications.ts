'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/lib/services/notifications-temp';
import type {
  Notification,
  NotificationsResponse,
  NotificationStats,
  CreateNotification,
  NotificationPreferences,
  UpdateNotificationPreferences,
  NotificationType,
} from '@/lib/types/alerts';

interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadNotifications: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  createNotification: (notification: CreateNotification) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updatePreferences: (updates: UpdateNotificationPreferences) => Promise<void>;
  filterNotifications: (
    type?: NotificationType | 'all',
    unreadOnly?: boolean
  ) => Notification[];

  // Utilities
  getUnreadCount: () => number;
  hasUnread: () => boolean;
  initializePushNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: NotificationsResponse =
        await notificationService.getUserNotifications();
      setNotifications(response.notifications);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load notifications'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const notificationStats =
        await notificationService.getNotificationStats();
      setStats(notificationStats);
    } catch (err) {
      console.error('Failed to load notification stats:', err);
    }
  }, []);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      const userPreferences =
        await notificationService.getNotificationPreferences();
      setPreferences(userPreferences);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  }, []);

  // Create notification
  const createNotification = useCallback(
    async (notification: CreateNotification) => {
      try {
        await notificationService.createNotification(notification);
        await loadNotifications();
        await loadStats();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create notification'
        );
      }
    },
    [loadNotifications, loadStats]
  );

  // Mark as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await notificationService.markAsRead(id);
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        await loadStats();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to mark as read');
      }
    },
    [loadStats]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark all as read'
      );
    }
  }, [loadStats]);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await notificationService.deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        await loadStats();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete notification'
        );
      }
    },
    [loadStats]
  );

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to clear notifications'
      );
    }
  }, [loadStats]);

  // Update preferences
  const updatePreferences = useCallback(
    async (updates: UpdateNotificationPreferences) => {
      try {
        await notificationService.updateNotificationPreferences(updates);
        await loadPreferences();

        // Initialize push notifications if enabled
        if (updates.push_enabled) {
          await notificationService.initializePushNotifications();
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update preferences'
        );
      }
    },
    [loadPreferences]
  );

  // Filter notifications
  const filterNotifications = useCallback(
    (type?: NotificationType | 'all', unreadOnly?: boolean): Notification[] => {
      let filtered = notifications;

      if (type && type !== 'all') {
        filtered = filtered.filter(n => n.type === type);
      }

      if (unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }

      return filtered;
    },
    [notifications]
  );

  // Get unread count
  const getUnreadCount = useCallback((): number => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Has unread
  const hasUnread = useCallback((): boolean => {
    return getUnreadCount() > 0;
  }, [getUnreadCount]);

  // Initialize push notifications
  const initializePushNotifications = useCallback(async () => {
    try {
      await notificationService.initializePushNotifications();
    } catch (err) {
      console.error('Failed to initialize push notifications:', err);
    }
  }, []);

  // Auto-load data on mount and set up refresh interval
  useEffect(() => {
    loadNotifications();
    loadStats();
    loadPreferences();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications, loadStats, loadPreferences]);

  return {
    // State
    notifications,
    stats,
    preferences,
    loading,
    error,

    // Actions
    loadNotifications,
    loadStats,
    loadPreferences,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    filterNotifications,

    // Utilities
    getUnreadCount,
    hasUnread,
    initializePushNotifications,
  };
}
