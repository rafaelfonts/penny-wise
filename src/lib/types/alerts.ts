// ==========================================
// ALERTS SYSTEM TYPES - Day 5 TypeScript Definitions
// ==========================================

// Alert Types
export type AlertType = 'price' | 'volume' | 'technical' | 'news'
export type ConditionType = 'above' | 'below' | 'cross_above' | 'cross_below' | 'change_percent'

export interface Alert {
  id: string
  user_id: string
  symbol: string
  alert_type: AlertType
  condition_type: ConditionType
  target_value: number
  current_value?: number
  is_active: boolean
  triggered_at?: string
  trigger_count: number
  cooldown_minutes: number
  last_triggered?: string
  metadata: Record<string, string | number | boolean>
  created_at: string
  updated_at: string
}

export interface CreateAlert {
  symbol: string
  alert_type: AlertType
  condition_type: ConditionType
  target_value: number
  cooldown_minutes?: number
  metadata?: Record<string, string | number | boolean>
}

export interface UpdateAlert {
  target_value?: number
  is_active?: boolean
  cooldown_minutes?: number
  metadata?: Record<string, string | number | boolean>
}

// Notification Types
export type NotificationType = 'alert' | 'news' | 'system' | 'market' | 'portfolio'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  read: boolean
  data: Record<string, string | number | boolean>
  expires_at?: string
  created_at: string
}

export interface CreateNotification {
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  data?: Record<string, string | number | boolean>
  expires_at?: string
}

// Dashboard Types
export interface Widget {
  id: string
  type: WidgetType
  x: number
  y: number
  w: number
  h: number
  config?: WidgetConfig
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export type WidgetType = 
  | 'portfolio'
  | 'market'
  | 'watchlist'
  | 'alerts'
  | 'news'
  | 'chart'
  | 'performance'
  | 'positions'

export interface WidgetConfig {
  title?: string
  symbol?: string
  timeframe?: string
  showHeader?: boolean
  refreshInterval?: number
  customSettings?: Record<string, string | number | boolean>
}

export interface DashboardLayout {
  id: string
  user_id: string
  layout_name: string
  widgets: Widget[]
  grid_config: GridConfig
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GridConfig {
  cols: number
  rowHeight: number
  margin: [number, number]
  breakpoints: Record<string, number>
  responsive?: boolean
}

export interface CreateDashboardLayout {
  layout_name: string
  widgets: Widget[]
  grid_config?: Partial<GridConfig>
  is_default?: boolean
}

// Export Types
export type FileType = 'png' | 'svg' | 'csv' | 'json' | 'pdf'

export interface ExportedFile {
  id: string
  user_id: string
  file_name: string
  file_type: FileType
  file_path: string
  file_size: number
  content_type: string
  expires_at: string
  download_count: number
  metadata: Record<string, string | number | boolean>
  created_at: string
}

export interface CreateExportedFile {
  file_name: string
  file_type: FileType
  file_path: string
  file_size: number
  content_type: string
  expires_at?: string
  metadata?: Record<string, string | number | boolean>
}

export interface ExportOptions {
  format: FileType
  quality?: number
  width?: number
  height?: number
  background?: string
  filename?: string
  compression?: boolean
}

// Notification Preferences Types
export interface NotificationPreferences {
  id: string
  user_id: string
  push_enabled: boolean
  email_enabled: boolean
  alert_notifications: boolean
  market_notifications: boolean
  news_notifications: boolean
  system_notifications: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface UpdateNotificationPreferences {
  push_enabled?: boolean
  email_enabled?: boolean
  alert_notifications?: boolean
  market_notifications?: boolean
  news_notifications?: boolean
  system_notifications?: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  timezone?: string
}

// Alert Service Types
export interface AlertTrigger {
  alert: Alert
  current_value: number
  triggered_at: string
  symbol_data?: {
    price: number
    volume: number
    change: number
    change_percent: number
  }
}

export interface AlertCheck {
  symbol: string
  current_price: number
  volume?: number
  technicals?: Record<string, number>
}

export interface AlertHistory {
  alert_id: string
  symbol: string
  trigger_time: string
  trigger_value: number
  condition_met: string
}

// Notification Service Types
export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, string | number | boolean>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface EmailNotificationTemplate {
  template_id: string
  subject: string
  variables: Record<string, string | number | boolean>
}

// API Response Types
export interface AlertsResponse {
  alerts: Alert[]
  total: number
  active: number
  triggered_today: number
}

export interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unread: number
}

export interface DashboardResponse {
  layout: DashboardLayout
  widgets_data: Record<string, WidgetData>
  last_updated: string
}

export interface ExportResponse {
  file: ExportedFile
  download_url: string
  expires_at: string
}

// Error Types
export interface AlertError {
  code: string
  message: string
  field?: string
  details?: Record<string, string | number | boolean>
}

// Utility Types
export interface AlertCondition {
  type: ConditionType
  value: number
  current?: number
  met: boolean
  percentage_diff?: number
}

export interface AlertStats {
  total: number
  active: number
  triggered_today: number
  triggered_this_week: number
  by_type: Record<AlertType, number>
  by_symbol: Record<string, number>
}

export interface NotificationStats {
  total: number
  unread: number
  by_type: Record<NotificationType, number>
  by_priority: Record<NotificationPriority, number>
}

// Widget Data Types
export interface WidgetData {
  type: WidgetType
  data: PortfolioWidgetData | MarketWidgetData | AlertsWidgetData | ChartWidgetData
  loading: boolean
  error?: string
  last_updated: string
}

export interface PortfolioWidgetData {
  total_value: number
  day_change: number
  day_change_percent: number
  positions: Array<{
    symbol: string
    quantity: number
    current_price: number
    market_value: number
    day_change: number
  }>
}

export interface MarketWidgetData {
  indices: Array<{
    symbol: string
    name: string
    value: number
    change: number
    change_percent: number
  }>
  top_gainers: Array<{
    symbol: string
    price: number
    change_percent: number
  }>
  top_losers: Array<{
    symbol: string
    price: number
    change_percent: number
  }>
}

export interface AlertsWidgetData {
  active_alerts: number
  triggered_today: number
  recent_triggers: Array<{
    symbol: string
    type: AlertType
    triggered_at: string
    condition_met: string
  }>
}

export interface ChartWidgetData {
  symbol: string
  timeframe: string
  data: Array<{
    timestamp: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
}

// Chart Export Types
export interface ChartExportConfig {
  element: HTMLElement | string
  format: 'png' | 'svg' | 'pdf'
  filename: string
  width?: number
  height?: number
  scale?: number
  quality?: number
  background?: string
}

export interface DataExportConfig {
  data: Record<string, string | number | boolean>[]
  format: 'csv' | 'json'
  filename: string
  columns?: string[]
  headers?: Record<string, string>
}

// Real-time Types
export interface AlertWebSocketMessage {
  type: 'alert_triggered' | 'alert_created' | 'alert_updated' | 'alert_deleted'
  data: Alert | AlertTrigger
  timestamp: string
}

export interface NotificationWebSocketMessage {
  type: 'notification_received' | 'notification_read' | 'notification_deleted'
  data: Notification
  timestamp: string
}

// Hook Types for React components
export interface UseAlertsReturn {
  alerts: Alert[]
  loading: boolean
  error: string | null
  createAlert: (alert: CreateAlert) => Promise<Alert>
  updateAlert: (id: string, updates: UpdateAlert) => Promise<Alert>
  deleteAlert: (id: string) => Promise<void>
  triggerAlert: (id: string, currentValue: number) => Promise<void>
  refresh: () => Promise<void>
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  refresh: () => Promise<void>
} 