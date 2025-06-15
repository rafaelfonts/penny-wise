import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  RecentAlertsWidget,
  WatchlistWidget,
  QuickStatsWidget,
} from '@/components/dashboard';
import { MarketSummaryOplabWidget } from '@/components/dashboard/market-summary-widget-oplab';
import { PortfolioOplabWidget } from '@/components/dashboard/portfolio-oplab-widget';
import { NotificationDropdown } from '@/components/notifications';
import Link from 'next/link';

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationDropdown />

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user.email}
                </span>
                <form action={signOut}>
                  <Button variant="outline" size="sm" type="submit">
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back,{' '}
            {user.user_metadata?.full_name || user.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s what&apos;s happening with your investments today.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column - Main Widgets */}
          <div className="space-y-6 lg:col-span-8">
            {/* Portfolio Overview - OpLab Integration */}
            <PortfolioOplabWidget />

            {/* Market Summary - OpLab Integration */}
            <MarketSummaryOplabWidget />

            {/* Watchlist - Full Width */}
            <WatchlistWidget />
          </div>

          {/* Right Column - Side Widgets */}
          <div className="space-y-6 lg:col-span-4">
            {/* Quick Stats */}
            <QuickStatsWidget />

            {/* Recent Alerts */}
            <RecentAlertsWidget maxItems={6} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link href="/market">
              <Button variant="outline" className="w-full">
                Market Analysis
              </Button>
            </Link>
            <Link href="/alerts">
              <Button variant="outline" className="w-full">
                Manage Alerts
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" className="w-full">
                AI Assistant
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="outline" className="w-full">
                Notifications
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Last updated: {new Date().toLocaleString()} • Market data provided
            by Alpha Vantage & Yahoo Finance
          </p>
        </div>
      </div>
    </div>
  );
}
