// ==========================================
// LAZY MARKET COMPONENTS
// Lazy-loaded versions of heavy market components for better performance
// ==========================================

import {
  LazyMarketComponent,
  LazyChartComponent,
} from '@/lib/utils/lazy-loader';

// Lazy load the heavy market components
export const LazyQuoteCard = LazyMarketComponent(
  () => import('./quote-card').then(m => ({ default: m.QuoteCard })),
  'QuoteCard'
);

export const LazyAnalysisCard = LazyMarketComponent(
  () => import('./analysis-card').then(m => ({ default: m.AnalysisCard })),
  'AnalysisCard'
);

export const LazyWatchlistDashboard = LazyMarketComponent(
  () =>
    import('./watchlist-dashboard').then(m => ({
      default: m.WatchlistDashboard,
    })),
  'WatchlistDashboard'
);

export const LazyPriceChart = LazyChartComponent(
  () => import('./price-chart').then(m => ({ default: m.PriceChart })),
  'PriceChart'
);

// Export both lazy and regular versions for flexibility
export {
  QuoteCard,
  AnalysisCard,
  WatchlistDashboard,
  PriceChart,
} from './index';
