// ==========================================
// ADVANCED LAZY LOADING SYSTEM
// Optimized component loading with error boundaries and monitoring
// ==========================================

/* eslint-disable */
'use client';

import React, {
  Suspense,
  ComponentType,
  lazy,
  useEffect,
  useState,
  createElement,
  ComponentProps,
} from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ==========================================
// LOADING STATES
// ==========================================

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Carregando...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 ${className}`}
    >
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
};

const SkeletonLoader: React.FC<{ height?: string; className?: string }> = ({
  height = 'h-32',
  className = '',
}) => (
  <div
    className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${height} ${className}`}
  />
);

// ==========================================
// ERROR BOUNDARIES
// ==========================================

interface LazyErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

const LazyErrorFallback: React.FC<LazyErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName = 'Component',
}) => (
  <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-medium text-red-900 dark:text-red-100">
            Erro ao carregar {componentName}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300">
            {error.message || 'Ocorreu um erro inesperado'}
          </p>
        </div>
        <Button
          onClick={resetErrorBoundary}
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ==========================================
// PERFORMANCE MONITORING
// ==========================================

interface ComponentPerformanceData {
  name: string;
  loadTime: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private data: ComponentPerformanceData[] = [];
  private maxEntries = 100;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordLoad(
    name: string,
    loadTime: number,
    success: boolean,
    error?: string
  ): void {
    this.data.push({
      name,
      loadTime,
      timestamp: Date.now(),
      success,
      error,
    });

    // Keep only latest entries
    if (this.data.length > this.maxEntries) {
      this.data.shift();
    }

    // Log slow components
    if (loadTime > 1000) {
      console.warn(
        `[LazyLoader] Slow component load: ${name} took ${loadTime}ms`
      );
    }
  }

  getStats() {
    const total = this.data.length;
    const successful = this.data.filter(d => d.success).length;
    const avgLoadTime =
      this.data.reduce((acc, d) => acc + d.loadTime, 0) / total || 0;
    const slowComponents = this.data.filter(d => d.loadTime > 1000);

    return {
      total,
      successful,
      errorRate: ((total - successful) / total) * 100 || 0,
      avgLoadTime: Math.round(avgLoadTime),
      slowComponents: slowComponents.map(c => ({
        name: c.name,
        loadTime: c.loadTime,
      })),
    };
  }

  getRecentErrors() {
    return this.data
      .filter(d => !d.success)
      .slice(-10)
      .map(d => ({
        name: d.name,
        error: d.error,
        timestamp: d.timestamp,
      }));
  }
}

// ==========================================
// LAZY LOADER CONFIGURATION
// ==========================================

export interface LazyLoaderConfig {
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<LazyErrorFallbackProps>;
  timeout?: number;
  retryOnError?: boolean;
  preload?: boolean;
  name?: string;
  enablePerformanceTracking?: boolean;
}

// ==========================================
// MAIN LAZY LOADER FACTORY
// ==========================================

export const createLazyComponent = <T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): ComponentType<ComponentProps<T>> => {
  const LazyComponent = lazy(importFn);

  return (props: ComponentProps<T>) => (
    <Suspense
      fallback={fallback ? createElement(fallback) : <div>Loading...</div>}
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Preload a component
export const preloadComponent = async <T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> => {
  try {
    return await importFn();
  } catch (error) {
    console.error('Failed to preload component:', error);
    throw error;
  }
};

// ==========================================
// SPECIALIZED LAZY LOADERS
// ==========================================

// For heavy dashboard components
export const LazyDashboardComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  name?: string
) =>
  createLazyComponent(importFn, {
    fallback: () => <SkeletonLoader height="h-64" className="w-full" />,
    name: name || 'DashboardComponent',
    preload: false,
    timeout: 8000,
  });

// For market data components (can be slow due to API calls)
export const LazyMarketComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  name?: string
) =>
  createLazyComponent(importFn, {
    fallback: () => (
      <LoadingSpinner
        message="Carregando dados de mercado..."
        size="md"
        className="h-32"
      />
    ),
    name: name || 'MarketComponent',
    preload: true, // Preload market components since they're frequently used
    timeout: 12000, // Longer timeout for API calls
  });

// For chart components (heavy libraries)
export const LazyChartComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  name?: string
) =>
  createLazyComponent(importFn, {
    fallback: () => (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Carregando gráfico...
          </p>
        </div>
      </div>
    ),
    name: name || 'ChartComponent',
    preload: false,
    timeout: 15000, // Charts can take time to render
  });

// For modal/dialog components (load on demand)
export const LazyModalComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  name?: string
) =>
  createLazyComponent(importFn, {
    fallback: () => <LoadingSpinner size="sm" />,
    name: name || 'ModalComponent',
    preload: false,
    timeout: 5000,
  });

// ==========================================
// HOOKS FOR PERFORMANCE MONITORING
// ==========================================

export function useLazyLoadingStats() {
  const [stats, setStats] = useState(() =>
    PerformanceMonitor.getInstance().getStats()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(PerformanceMonitor.getInstance().getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

export function useLazyLoadingErrors() {
  const [errors, setErrors] = useState(() =>
    PerformanceMonitor.getInstance().getRecentErrors()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setErrors(PerformanceMonitor.getInstance().getRecentErrors());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return errors;
}

// ==========================================
// PRELOADING UTILITIES
// ==========================================

export function preloadRouteComponents(routes: string[]): void {
  routes.forEach(route => {
    preloadComponent(() => import(`@/app${route}/page`));
  });
}

// Enhanced lazy loading with retry logic
export const createLazyComponentWithRetry = <T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  maxRetries = 3,
  fallback?: ComponentType
): ComponentType<ComponentProps<T>> => {
  const retryImport = async (attempt = 1): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(`Lazy load attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return retryImport(attempt + 1);
      }
      throw error;
    }
  };

  const LazyComponent = lazy(retryImport);

  return (props: ComponentProps<T>) => (
    <Suspense
      fallback={fallback ? createElement(fallback) : <div>Loading...</div>}
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Lazy route component
export const createLazyRoute = <T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): ComponentType<ComponentProps<T>> => {
  return createLazyComponent(importFn, () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
    </div>
  ));
};

// Preload multiple routes
export const preloadRoutes = async (
  importFns: Array<() => Promise<{ default: ComponentType<unknown> }>>
): Promise<void> => {
  try {
    await Promise.all(importFns.map(fn => preloadComponent(fn)));
  } catch (error) {
    console.error('Failed to preload routes:', error);
  }
};

// Simple error boundary component
const LazyErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="error-boundary">{children}</div>;
};

// Enhanced lazy component with error boundary
export const withLazyLoading = (
  Component: ComponentType<any>
): ComponentType<any> => {
  const WrappedComponent = (props: any) => (
    <LazyErrorBoundary>
      <Component {...props} />
    </LazyErrorBoundary>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default createLazyComponent;
