// ==========================================
// DASHBOARD TYPES - Day 5 Dashboard Widgets
// ==========================================

export interface Widget {
  id: string
  type: WidgetType
  title: string
  position: WidgetPosition
  size: WidgetSize
  settings: WidgetSettings
  isVisible: boolean
  lastUpdated?: string
}

export type WidgetType = 
  | 'portfolio-overview'
  | 'market-summary'
  | 'recent-alerts'
  | 'price-chart'
  | 'news-feed'
  | 'watchlist'
  | 'quick-stats'

export interface WidgetPosition {
  x: number
  y: number
  row?: number
  col?: number
}

export interface WidgetSize {
  width: number
  height: number
  cols?: number
  rows?: number
}

export interface DashboardLayout {
  id: string
  user_id: string
  name: string
  widgets: Widget[]
  is_default: boolean
  created_at: string
  updated_at: string
}

// ==========================================
// PORTFOLIO WIDGET TYPES
// ==========================================

export interface PortfolioOverview {
  totalValue: number
  dailyChange: number
  dailyChangePercent: number
  assets: PortfolioAsset[]
  allocation: AssetAllocation[]
  performance: PerformanceData[]
}

export interface PortfolioAsset {
  symbol: string
  name: string
  quantity: number
  currentPrice: number
  totalValue: number
  dailyChange: number
  dailyChangePercent: number
  allocation: number
}

export interface AssetAllocation {
  category: string
  value: number
  percentage: number
  color: string
}

export interface PerformanceData {
  date: string
  value: number
  change: number
}

// ==========================================
// MARKET SUMMARY WIDGET TYPES
// ==========================================

export interface MarketSummary {
  indices: MarketIndex[]
  topMovers: TopMover[]
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours'
  lastUpdated: string
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

export interface TopMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  type: 'gainer' | 'loser' | 'active'
}

// ==========================================
// NEWS FEED WIDGET TYPES
// ==========================================

export interface NewsFeed {
  articles: NewsArticle[]
  categories: string[]
  lastUpdated: string
}

export interface NewsArticle {
  id: string
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  sentiment: 'positive' | 'negative' | 'neutral'
  relevantSymbols: string[]
  imageUrl?: string
}

// ==========================================
// WATCHLIST WIDGET TYPES
// ==========================================

export interface WatchlistWidget {
  symbols: WatchlistItem[]
  totalItems: number
  lastUpdated: string
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  alertCount?: number
  hasActiveAlert?: boolean
}

// ==========================================
// CHART WIDGET TYPES
// ==========================================

export interface ChartWidget {
  symbol: string
  timeframe: ChartTimeframe
  data: ChartDataPoint[]
  indicators: ChartIndicator[]
  lastUpdated: string
}

export type ChartTimeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y'

export interface ChartDataPoint {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ChartIndicator {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB'
  period: number
  values: number[]
}

// ==========================================
// QUICK STATS WIDGET TYPES
// ==========================================

export interface QuickStats {
  stats: StatItem[]
  lastUpdated: string
}

export interface StatItem {
  label: string
  value: string | number
  change?: number
  changePercent?: number
  trend: 'up' | 'down' | 'neutral'
  icon?: string
  color?: string
}

// ==========================================
// WIDGET SETTINGS TYPES
// ==========================================

export interface WidgetSettings {
  refreshInterval?: number
  autoRefresh?: boolean
  displayItems?: number
  showChart?: boolean
  chartType?: 'line' | 'candlestick' | 'bar'
  timeframe?: ChartTimeframe
  symbols?: string[]
  categories?: string[]
  theme?: 'light' | 'dark' | 'auto'
}

// ==========================================
// ALERT REFERENCE TYPE (from alerts.ts)
// ==========================================

export interface AlertReference {
  id: string
  title: string
  type: string
  status: string
  created_at: string
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface DashboardData {
  portfolio: PortfolioOverview
  market: MarketSummary
  news: NewsFeed
  watchlist: WatchlistWidget
  alerts: {
    recent: AlertReference[]
    active: number
    triggered: number
  }
  quickStats: QuickStats
}

export interface WidgetUpdateResponse {
  success: boolean
  widget?: Widget
  error?: string
}

export interface DashboardResponse {
  layout: DashboardLayout
  data: DashboardData
  lastUpdated: string
} 