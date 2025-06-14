'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationItem } from './notification-item';
import { NotificationSettings } from './notification-settings';
import { notificationService } from '@/lib/services/notifications';
import type {
  Notification,
  NotificationsResponse,
  NotificationStats,
  NotificationType,
} from '@/lib/types/alerts';

interface NotificationCenterProps {
  variant?: 'dropdown' | 'page';
  maxHeight?: string;
}

export function NotificationCenter({
  variant = 'dropdown',
  maxHeight = '400px',
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response: NotificationsResponse =
        await notificationService.getUserNotifications();
      setNotifications(response.notifications);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load notifications'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const notificationStats =
        await notificationService.getNotificationStats();
      setStats(notificationStats);
    } catch (err) {
      console.error('Failed to load notification stats:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark all as read'
      );
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete notification'
      );
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to clear notifications'
      );
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType =
      filterType === 'all' || notification.type === filterType;
    return matchesType;
  });

  const unreadNotifications = filteredNotifications.filter(n => !n.read);

  const NotificationHeader = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <div>
          <h3 className="font-semibold">Notifications</h3>
          {stats && (
            <p className="text-sm text-gray-500">
              {stats.unread} unread of {stats.total} total
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={!stats?.unread}
          title="Mark all as read"
        >
          <Check className="h-4 w-4" />
        </Button>

        {/* Filter Controls */}
        <div className="flex gap-1">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'alert' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('alert')}
          >
            Alerts
          </Button>
          <Button
            variant={filterType === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('system')}
          >
            System
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          title="Notification settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        {variant === 'dropdown' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            title="Clear all"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const NotificationList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-4 text-center text-red-600">
          <p>{error}</p>
        </div>
      );
    }

    if (filteredNotifications.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500">
          <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>No notifications</p>
          <p className="text-sm">You&apos;re all caught up!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Unread Section */}
        {unreadNotifications.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-sm font-medium">Unread</h4>
              <Badge variant="secondary" className="text-xs">
                {unreadNotifications.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {unreadNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Notifications */}
        {unreadNotifications.length === 0 && (
          <div className="py-6 text-center text-gray-500">
            <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm">All caught up!</p>
          </div>
        )}

        {/* Read notifications (collapsed) */}
        {filteredNotifications.length > unreadNotifications.length && (
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium text-gray-500">Earlier</h4>
            <div className="space-y-2">
              {filteredNotifications
                .filter(n => n.read)
                .slice(0, 5)
                .map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDeleteNotification}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (variant === 'page') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <NotificationHeader />
          </CardHeader>
          <CardContent>
            <NotificationList />
          </CardContent>
        </Card>

        <NotificationSettings
          open={showSettings}
          onOpenChange={setShowSettings}
        />
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className="w-96">
      <div className="border-b p-4">
        <NotificationHeader />
      </div>

      <div style={{ maxHeight }} className="overflow-y-auto">
        <div className="p-4">
          <NotificationList />
        </div>
      </div>

      <NotificationSettings
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
