// ==========================================
// LAZY DASHBOARD COMPONENTS
// Lazy-loaded versions of heavy dashboard components
// ==========================================

import { LazyDashboardComponent } from '@/lib/utils/lazy-loader';

// Lazy load the heavy dashboard components
export const LazyQuickStatsWidget = LazyDashboardComponent(
  () =>
    import('./quick-stats-widget').then(m => ({ default: m.QuickStatsWidget })),
  'QuickStatsWidget'
);

export const LazyPortfolioOplabWidget = LazyDashboardComponent(
  () =>
    import('./portfolio-oplab-widget').then(m => ({
      default: m.PortfolioOplabWidget,
    })),
  'PortfolioOplabWidget'
);

export const LazyMarketSummaryWidget = LazyDashboardComponent(
  () =>
    import('./market-summary-widget-oplab').then(m => ({
      default: m.MarketSummaryOplabWidget,
    })),
  'MarketSummaryWidget'
);

// Export regular versions for compatibility
export { QuickStatsWidget } from './quick-stats-widget';
export { PortfolioOplabWidget } from './portfolio-oplab-widget';
export { MarketSummaryOplabWidget } from './market-summary-widget-oplab';
