import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { WatchlistCard } from '@/components/dashboard/WatchlistCard';
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary';
import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { NewsWidget } from '@/components/dashboard/NewsWidget';

// Mock hooks and services
jest.mock('@/hooks/use-watchlist', () => ({
  useWatchlist: () => ({
    watchlist: [
      {
        id: '1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        position: 1,
      },
      {
        id: '2',
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 2800.50,
        change: -15.25,
        changePercent: -0.54,
        volume: 25000000,
        position: 2,
      },
    ],
    isLoading: false,
    error: null,
    addToWatchlist: jest.fn(),
    removeFromWatchlist: jest.fn(),
    updatePosition: jest.fn(),
    refreshQuotes: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-portfolio', () => ({
  usePortfolio: () => ({
    portfolio: {
      totalValue: 125000,
      totalGainLoss: 15000,
      totalGainLossPercent: 13.64,
      dayChange: 2500,
      dayChangePercent: 2.04,
      positions: [
        {
          symbol: 'AAPL',
          shares: 100,
          avgCost: 140.50,
          currentPrice: 150.25,
          value: 15025,
          gainLoss: 975,
          gainLossPercent: 6.94,
          weight: 12.02,
        },
        {
          symbol: 'GOOGL',
          shares: 25,
          avgCost: 2750.00,
          currentPrice: 2800.50,
          value: 70012.50,
          gainLoss: 1262.50,
          gainLossPercent: 1.84,
          weight: 56.01,
        },
      ],
      allocation: {
        sectors: { Technology: 85.5, Healthcare: 10.2, Finance: 4.3 },
        assets: { Stocks: 92.5, Cash: 7.5 },
      },
    },
    isLoading: false,
    error: null,
    addPosition: jest.fn(),
    updatePosition: jest.fn(),
    removePosition: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-alerts', () => ({
  useAlerts: () => ({
    alerts: [
      {
        id: '1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 155.00,
        currentPrice: 150.25,
        isActive: true,
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        symbol: 'GOOGL',
        condition: 'below',
        targetPrice: 2750.00,
        currentPrice: 2800.50,
        isActive: true,
        createdAt: '2024-01-15T09:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
    createAlert: jest.fn(),
    updateAlert: jest.fn(),
    deleteAlert: jest.fn(),
    toggleAlert: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-market-data', () => ({
  useMarketData: () => ({
    marketIndices: [
      { symbol: 'SPY', name: 'S&P 500', price: 4800.25, change: 25.50, changePercent: 0.53 },
      { symbol: 'QQQ', name: 'NASDAQ', price: 380.75, change: -2.25, changePercent: -0.59 },
      { symbol: 'IWM', name: 'Russell 2000', price: 195.80, change: 1.20, changePercent: 0.62 },
    ],
    marketNews: [
      {
        id: '1',
        title: 'Fed Holds Rates Steady',
        summary: 'Federal Reserve maintains current interest rates...',
        publishedAt: '2024-01-15T14:30:00Z',
        source: 'Reuters',
        sentiment: 'neutral',
      },
      {
        id: '2',
        title: 'Tech Stocks Rally',
        summary: 'Technology sector leads market gains...',
        publishedAt: '2024-01-15T13:15:00Z',
        source: 'CNBC',
        sentiment: 'positive',
      },
    ],
    isLoading: false,
    error: null,
    refreshData: jest.fn(),
  }),
}));

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Dashboard Components', () => {
  describe('Dashboard Main Component', () => {
    test('should render all dashboard sections', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByTestId('portfolio-summary')).toBeInTheDocument();
      expect(screen.getByTestId('watchlist-card')).toBeInTheDocument();
      expect(screen.getByTestId('market-overview')).toBeInTheDocument();
      expect(screen.getByTestId('alerts-panel')).toBeInTheDocument();
      expect(screen.getByTestId('news-widget')).toBeInTheDocument();
    });

    test('should handle responsive layout changes', () => {
      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Test mobile layout
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('.dashboard-mobile')).toBeInTheDocument();

      // Test desktop layout
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('.dashboard-desktop')).toBeInTheDocument();
    });

    test('should persist layout preferences', () => {
      const mockLocalStorage = {
        getItem: jest.fn(() => JSON.stringify({ layout: 'compact' })),
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('dashboard-layout');
    });
  });

  describe('WatchlistCard Component', () => {
    test('should display watchlist items with correct data', () => {
      render(
        <TestWrapper>
          <WatchlistCard />
        </TestWrapper>
      );

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('$150.25')).toBeInTheDocument();
      expect(screen.getByText('+$2.50 (1.69%)')).toBeInTheDocument();

      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('Alphabet Inc.')).toBeInTheDocument();
      expect(screen.getByText('$2,800.50')).toBeInTheDocument();
      expect(screen.getByText('-$15.25 (-0.54%)')).toBeInTheDocument();
    });

    test('should handle adding new symbols to watchlist', async () => {
      const user = userEvent.setup();
      const { useWatchlist } = require('@/hooks/use-watchlist');
      const mockAddToWatchlist = jest.fn();
      useWatchlist.mockReturnValue({
        ...useWatchlist(),
        addToWatchlist: mockAddToWatchlist,
      });

      render(
        <TestWrapper>
          <WatchlistCard />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add symbol/i });
      await user.click(addButton);

      const input = screen.getByPlaceholderText(/enter symbol/i);
      await user.type(input, 'MSFT');

      const confirmButton = screen.getByRole('button', { name: /add/i });
      await user.click(confirmButton);

      expect(mockAddToWatchlist).toHaveBeenCalledWith('MSFT');
    });

    test('should handle removing symbols from watchlist', async () => {
      const user = userEvent.setup();
      const { useWatchlist } = require('@/hooks/use-watchlist');
      const mockRemoveFromWatchlist = jest.fn();
      useWatchlist.mockReturnValue({
        ...useWatchlist(),
        removeFromWatchlist: mockRemoveFromWatchlist,
      });

      render(
        <TestWrapper>
          <WatchlistCard />
        </TestWrapper>
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(mockRemoveFromWatchlist).toHaveBeenCalledWith('1');
    });

    test('should support drag and drop reordering', async () => {
      const { useWatchlist } = require('@/hooks/use-watchlist');
      const mockUpdatePosition = jest.fn();
      useWatchlist.mockReturnValue({
        ...useWatchlist(),
        updatePosition: mockUpdatePosition,
      });

      render(
        <TestWrapper>
          <WatchlistCard />
        </TestWrapper>
      );

      const watchlistItems = screen.getAllByTestId(/watchlist-item/);
      const firstItem = watchlistItems[0];
      const secondItem = watchlistItems[1];

      // Simulate drag and drop
      fireEvent.dragStart(firstItem);
      fireEvent.dragOver(secondItem);
      fireEvent.drop(secondItem);

      expect(mockUpdatePosition).toHaveBeenCalled();
    });

    test('should refresh quotes on demand', async () => {
      const user = userEvent.setup();
      const { useWatchlist } = require('@/hooks/use-watchlist');
      const mockRefreshQuotes = jest.fn();
      useWatchlist.mockReturnValue({
        ...useWatchlist(),
        refreshQuotes: mockRefreshQuotes,
      });

      render(
        <TestWrapper>
          <WatchlistCard />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockRefreshQuotes).toHaveBeenCalled();
    });
  });

  describe('PortfolioSummary Component', () => {
    test('should display portfolio metrics correctly', () => {
      render(
        <TestWrapper>
          <PortfolioSummary />
        </TestWrapper>
      );

      expect(screen.getByText('$125,000')).toBeInTheDocument();
      expect(screen.getByText('+$15,000 (13.64%)')).toBeInTheDocument();
      expect(screen.getByText('+$2,500 (2.04%)')).toBeInTheDocument();
    });

    test('should display portfolio positions', () => {
      render(
        <TestWrapper>
          <PortfolioSummary />
        </TestWrapper>
      );

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('100 shares')).toBeInTheDocument();
      expect(screen.getByText('$15,025')).toBeInTheDocument();
      expect(screen.getByText('+$975 (6.94%)')).toBeInTheDocument();

      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('25 shares')).toBeInTheDocument();
      expect(screen.getByText('$70,012.50')).toBeInTheDocument();
      expect(screen.getByText('+$1,262.50 (1.84%)')).toBeInTheDocument();
    });

    test('should show allocation charts', () => {
      render(
        <TestWrapper>
          <PortfolioSummary />
        </TestWrapper>
      );

      expect(screen.getByTestId('sector-allocation-chart')).toBeInTheDocument();
      expect(screen.getByTestId('asset-allocation-chart')).toBeInTheDocument();
    });

    test('should handle portfolio actions', async () => {
      const user = userEvent.setup();
      const { usePortfolio } = require('@/hooks/use-portfolio');
      const mockAddPosition = jest.fn();
      usePortfolio.mockReturnValue({
        ...usePortfolio(),
        addPosition: mockAddPosition,
      });

      render(
        <TestWrapper>
          <PortfolioSummary />
        </TestWrapper>
      );

      const addPositionButton = screen.getByRole('button', { name: /add position/i });
      await user.click(addPositionButton);

      const symbolInput = screen.getByPlaceholderText(/symbol/i);
      const sharesInput = screen.getByPlaceholderText(/shares/i);
      const priceInput = screen.getByPlaceholderText(/average cost/i);

      await user.type(symbolInput, 'MSFT');
      await user.type(sharesInput, '50');
      await user.type(priceInput, '380.00');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockAddPosition).toHaveBeenCalledWith({
        symbol: 'MSFT',
        shares: 50,
        avgCost: 380.00,
      });
    });
  });

  describe('MarketOverview Component', () => {
    test('should display market indices', () => {
      render(
        <TestWrapper>
          <MarketOverview />
        </TestWrapper>
      );

      expect(screen.getByText('S&P 500')).toBeInTheDocument();
      expect(screen.getByText('4,800.25')).toBeInTheDocument();
      expect(screen.getByText('+25.50 (0.53%)')).toBeInTheDocument();

      expect(screen.getByText('NASDAQ')).toBeInTheDocument();
      expect(screen.getByText('380.75')).toBeInTheDocument();
      expect(screen.getByText('-2.25 (-0.59%)')).toBeInTheDocument();
    });

    test('should show market status indicator', () => {
      render(
        <TestWrapper>
          <MarketOverview />
        </TestWrapper>
      );

      const marketStatus = screen.getByTestId('market-status');
      expect(marketStatus).toBeInTheDocument();
      expect(marketStatus).toHaveTextContent(/market open|market closed/i);
    });

    test('should display market heat map', () => {
      render(
        <TestWrapper>
          <MarketOverview />
        </TestWrapper>
      );

      expect(screen.getByTestId('market-heatmap')).toBeInTheDocument();
    });

    test('should refresh market data', async () => {
      const user = userEvent.setup();
      const { useMarketData } = require('@/hooks/use-market-data');
      const mockRefreshData = jest.fn();
      useMarketData.mockReturnValue({
        ...useMarketData(),
        refreshData: mockRefreshData,
      });

      render(
        <TestWrapper>
          <MarketOverview />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh market data/i });
      await user.click(refreshButton);

      expect(mockRefreshData).toHaveBeenCalled();
    });
  });

  describe('AlertsPanel Component', () => {
    test('should display active alerts', () => {
      render(
        <TestWrapper>
          <AlertsPanel />
        </TestWrapper>
      );

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('above $155.00')).toBeInTheDocument();
      expect(screen.getByText('Current: $150.25')).toBeInTheDocument();

      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('below $2,750.00')).toBeInTheDocument();
      expect(screen.getByText('Current: $2,800.50')).toBeInTheDocument();
    });

    test('should create new alerts', async () => {
      const user = userEvent.setup();
      const { useAlerts } = require('@/hooks/use-alerts');
      const mockCreateAlert = jest.fn();
      useAlerts.mockReturnValue({
        ...useAlerts(),
        createAlert: mockCreateAlert,
      });

      render(
        <TestWrapper>
          <AlertsPanel />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: /create alert/i });
      await user.click(createButton);

      const symbolInput = screen.getByPlaceholderText(/symbol/i);
      const conditionSelect = screen.getByRole('combobox', { name: /condition/i });
      const priceInput = screen.getByPlaceholderText(/target price/i);

      await user.type(symbolInput, 'TSLA');
      await user.selectOptions(conditionSelect, 'above');
      await user.type(priceInput, '250.00');

      const saveButton = screen.getByRole('button', { name: /save alert/i });
      await user.click(saveButton);

      expect(mockCreateAlert).toHaveBeenCalledWith({
        symbol: 'TSLA',
        condition: 'above',
        targetPrice: 250.00,
      });
    });

    test('should toggle alert status', async () => {
      const user = userEvent.setup();
      const { useAlerts } = require('@/hooks/use-alerts');
      const mockToggleAlert = jest.fn();
      useAlerts.mockReturnValue({
        ...useAlerts(),
        toggleAlert: mockToggleAlert,
      });

      render(
        <TestWrapper>
          <AlertsPanel />
        </TestWrapper>
      );

      const toggleButtons = screen.getAllByRole('switch');
      await user.click(toggleButtons[0]);

      expect(mockToggleAlert).toHaveBeenCalledWith('1');
    });

    test('should delete alerts', async () => {
      const user = userEvent.setup();
      const { useAlerts } = require('@/hooks/use-alerts');
      const mockDeleteAlert = jest.fn();
      useAlerts.mockReturnValue({
        ...useAlerts(),
        deleteAlert: mockDeleteAlert,
      });

      render(
        <TestWrapper>
          <AlertsPanel />
        </TestWrapper>
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(mockDeleteAlert).toHaveBeenCalledWith('1');
    });
  });

  describe('NewsWidget Component', () => {
    test('should display market news', () => {
      render(
        <TestWrapper>
          <NewsWidget />
        </TestWrapper>
      );

      expect(screen.getByText('Fed Holds Rates Steady')).toBeInTheDocument();
      expect(screen.getByText('Federal Reserve maintains current interest rates...')).toBeInTheDocument();
      expect(screen.getByText('Reuters')).toBeInTheDocument();

      expect(screen.getByText('Tech Stocks Rally')).toBeInTheDocument();
      expect(screen.getByText('Technology sector leads market gains...')).toBeInTheDocument();
      expect(screen.getByText('CNBC')).toBeInTheDocument();
    });

    test('should show sentiment indicators', () => {
      render(
        <TestWrapper>
          <NewsWidget />
        </TestWrapper>
      );

      const sentimentIndicators = screen.getAllByTestId(/sentiment-/);
      expect(sentimentIndicators).toHaveLength(2);
      expect(sentimentIndicators[0]).toHaveClass('sentiment-neutral');
      expect(sentimentIndicators[1]).toHaveClass('sentiment-positive');
    });

    test('should filter news by category', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NewsWidget />
        </TestWrapper>
      );

      const categoryFilter = screen.getByRole('combobox', { name: /category/i });
      await user.selectOptions(categoryFilter, 'earnings');

      // Should filter news items
      await waitFor(() => {
        expect(screen.queryByText('Fed Holds Rates Steady')).not.toBeInTheDocument();
      });
    });

    test('should open news articles in new tab', async () => {
      const user = userEvent.setup();
      const mockOpen = jest.fn();
      window.open = mockOpen;

      render(
        <TestWrapper>
          <NewsWidget />
        </TestWrapper>
      );

      const newsLinks = screen.getAllByRole('link');
      await user.click(newsLinks[0]);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.any(String),
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Integration and Performance', () => {
    test('should handle real-time data updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Simulate real-time price update
      const { useWatchlist } = require('@/hooks/use-watchlist');
      useWatchlist.mockReturnValue({
        ...useWatchlist(),
        watchlist: [
          {
            id: '1',
            symbol: 'AAPL',
            price: 152.75, // Updated price
            change: 5.00,
            changePercent: 3.38,
          },
        ],
      });

      rerender(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('$152.75')).toBeInTheDocument();
        expect(screen.getByText('+$5.00 (3.38%)')).toBeInTheDocument();
      });
    });

    test('should handle loading states gracefully', () => {
      const { useWatchlist } = require('@/hooks/use-watchlist');
      useWatchlist.mockReturnValue({
        ...useWatchlist(),
        isLoading: true,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByTestId('watchlist-loading')).toBeInTheDocument();
    });

    test('should handle error states gracefully', () => {
      const { useWatchlist } = require('@/hooks/use-watchlist');
      useWatchlist.mockReturnValue({
        ...useWatchlist(),
        error: 'Failed to load watchlist data',
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText('Failed to load watchlist data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    test('should optimize re-renders with memoization', () => {
      const renderSpy = jest.fn();
      const MemoizedComponent = React.memo(() => {
        renderSpy();
        return <WatchlistCard />;
      });

      const { rerender } = render(
        <TestWrapper>
          <MemoizedComponent />
        </TestWrapper>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(
        <TestWrapper>
          <MemoizedComponent />
        </TestWrapper>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
    });
  });
}); 