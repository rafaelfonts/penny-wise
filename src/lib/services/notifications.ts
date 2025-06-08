// ==========================================
// NOTIFICATIONS SERVICE - Day 5 Notification Management
// ==========================================

import { createClient } from '@/lib/supabase/client'
import type { 
  Notification, 
  CreateNotification, 
  NotificationsResponse,
  NotificationPreferences,
  UpdateNotificationPreferences,
  PushNotificationPayload,
  NotificationStats,
  NotificationType,
  NotificationPriority
} from '@/lib/types/alerts'

export class NotificationService {
  private supabase = createClient()
  private swRegistration: ServiceWorkerRegistration | null = null

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async createNotification(notification: CreateNotification): Promise<Notification> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        ...notification,
        priority: notification.priority || 'medium',
        data: notification.data || {}
      })
      .select('*')
      .single()

    if (error) throw new Error(`Failed to create notification: ${error.message}`)

    const newNotification = data as Notification

    // Send push notification if enabled
    await this.sendPushNotificationIfEnabled(newNotification)

    return newNotification
  }

  async getUserNotifications(userId?: string): Promise<NotificationsResponse> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(`Failed to fetch notifications: ${error.message}`)

    const notifications = data as Notification[]
    const total = notifications.length
    const unread = notifications.filter(n => !n.read).length

    return {
      notifications,
      total,
      unread
    }
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch notification: ${error.message}`)
    }

    return data as Notification
  }

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(`Failed to mark notification as read: ${error.message}`)
    return data as Notification
  }

  async markAllAsRead(userId?: string): Promise<number> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', targetUserId)
      .eq('read', false)
      .select('id')

    if (error) throw new Error(`Failed to mark notifications as read: ${error.message}`)
    return data.length
  }

  async deleteNotification(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete notification: ${error.message}`)
  }

  async clearAllNotifications(userId?: string): Promise<number> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('user_id', targetUserId)
      .select('id')

    if (error) throw new Error(`Failed to clear notifications: ${error.message}`)
    return data.length
  }

  // ==========================================
  // NOTIFICATION PREFERENCES
  // ==========================================

  async getNotificationPreferences(userId?: string): Promise<NotificationPreferences | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Create default preferences if they don't exist
        return this.createDefaultPreferences(targetUserId)
      }
      throw new Error(`Failed to fetch notification preferences: ${error.message}`)
    }

    return data as NotificationPreferences
  }

  async updateNotificationPreferences(
    updates: UpdateNotificationPreferences,
    userId?: string
  ): Promise<NotificationPreferences> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('notification_preferences')
      .upsert({
        user_id: targetUserId,
        ...updates
      })
      .select('*')
      .single()

    if (error) throw new Error(`Failed to update notification preferences: ${error.message}`)
    return data as NotificationPreferences
  }

  private async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        push_enabled: true,
        email_enabled: true,
        alert_notifications: true,
        market_notifications: true,
        news_notifications: false,
        system_notifications: true,
        timezone: 'UTC'
      })
      .select('*')
      .single()

    if (error) throw new Error(`Failed to create default preferences: ${error.message}`)
    return data as NotificationPreferences
  }

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================

  async initializePushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported')
      return false
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js')
      
      // Check if already subscribed
      const existingSubscription = await this.swRegistration.pushManager.getSubscription()
      
      if (!existingSubscription) {
        await this.subscribeToPushNotifications()
      }

      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      throw new Error('Service worker not registered')
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      })

      // Save subscription to database
      await this.saveSubscription(subscription)

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async sendPushNotification(
    userId: string, 
    payload: PushNotificationPayload
  ): Promise<void> {
    // Check if user has push notifications enabled
    const preferences = await this.getNotificationPreferences(userId)
    if (!preferences?.push_enabled) return

    // In a real implementation, this would call your push notification server
    // For now, we'll use the browser's Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        data: payload.data,
        actions: payload.actions,
        tag: `notification-${Date.now()}`
      })
    }
  }

  private async sendPushNotificationIfEnabled(notification: Notification): Promise<void> {
    const preferences = await this.getNotificationPreferences(notification.user_id)
    
    if (!preferences?.push_enabled) return

    // Check notification type preferences
    const shouldSend = this.shouldSendNotification(notification.type, preferences)
    if (!shouldSend) return

    // Check quiet hours
    if (this.isInQuietHours(preferences)) return

    // Send push notification
    await this.sendPushNotification(notification.user_id, {
      title: notification.title,
      body: notification.message,
      data: notification.data
    })
  }

  private shouldSendNotification(
    type: NotificationType, 
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'alert':
        return preferences.alert_notifications
      case 'market':
        return preferences.market_notifications
      case 'news':
        return preferences.news_notifications
      case 'system':
        return preferences.system_notifications
      default:
        return true
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false
    }

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number)
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number)
    
    const quietStart = startHour * 60 + startMin
    const quietEnd = endHour * 60 + endMin

    if (quietStart <= quietEnd) {
      return currentTime >= quietStart && currentTime <= quietEnd
    } else {
      // Crosses midnight
      return currentTime >= quietStart || currentTime <= quietEnd
    }
  }

  // ==========================================
  // STATISTICS & ANALYTICS
  // ==========================================

  async getNotificationStats(userId?: string): Promise<NotificationStats> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', targetUserId)

    if (error) throw new Error(`Failed to fetch notification stats: ${error.message}`)

    const notifications = data as Notification[]
    const total = notifications.length
    const unread = notifications.filter(n => !n.read).length

    // Group by type
    const by_type = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by priority
    const by_priority = notifications.reduce((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      unread,
      by_type: by_type as Record<NotificationType, number>,
      by_priority: by_priority as Record<NotificationPriority, number>
    }
  }

  // ==========================================
  // CLEANUP & MAINTENANCE
  // ==========================================

  async cleanupExpiredNotifications(): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('cleanup_expired_notifications')

    if (error) throw new Error(`Failed to cleanup notifications: ${error.message}`)
    return data || 0
  }

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  subscribeToUserNotifications(
    userId: string, 
    callback: (payload: Notification) => void
  ) {
    return this.supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: { new: Notification }) => {
          callback(payload.new)
        }
      )
      .subscribe()
  }

  unsubscribeFromNotifications(
    subscription: ReturnType<typeof this.subscribeToUserNotifications>
  ) {
    this.supabase.removeChannel(subscription)
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    // In a real implementation, you'd save the subscription to your database
    // and use it with your push notification server
    console.log('Push subscription saved:', subscription.endpoint)
  }
}

// Export singleton instance
export const notificationService = new NotificationService() 