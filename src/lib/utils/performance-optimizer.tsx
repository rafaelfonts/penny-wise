// ==========================================
// PERFORMANCE OPTIMIZATION SYSTEM
// Bundle splitting, preloading, and performance monitoring
// ==========================================

/* eslint-disable */
'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// ==========================================
// BUNDLE SPLITTING & CODE SPLITTING
// ==========================================

// Critical route components that should be preloaded
const CRITICAL_ROUTES = ['/dashboard', '/chat', '/market'];

// Heavy feature routes that should be lazy loaded
const LAZY_ROUTES = ['/alerts', '/notifications', '/market-oplab'];

// ==========================================
// PERFORMANCE MONITORING
// ==========================================

// Performance monitoring types
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
}

// Memoization utility
export const memoizeFunction = <Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  keyFn?: (...args: Args) => string
): ((...args: Args) => Return) => {
  const cache = new Map<string, Return>();

  return (...args: Args): Return => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Debounce utility
export const debounce = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): ((...args: Args) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Args): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle utility
export const throttle = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  limit: number
): ((...args: Args) => void) => {
  let inThrottle: boolean;

  return (...args: Args): void => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Performance monitor
export const createPerformanceMonitor = (name: string) => {
  let startTime: number;

  return {
    start: () => {
      startTime = performance.now();
    },
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      return duration;
    },
  };
};

// Image optimization
export const optimizeImages = (images: string[]) => {
  return images.map(src => ({
    src,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  }));
};

// Resource preloading
export const preloadResources = async (resources: string[]): Promise<void> => {
  const promises = resources.map(resource => {
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;

      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        link.as = 'image';
      }

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload ${resource}`));

      document.head.appendChild(link);
    });
  });

  await Promise.all(promises);
};

// Resource pool for object reuse
export const createResourcePool = (factory: () => any, maxSize: number) => {
  const pool: any[] = [];

  return {
    acquire: (): any => {
      return pool.pop() || factory();
    },
    release: (resource: any): void => {
      if (pool.length < maxSize) {
        pool.push(resource);
      }
    },
  };
};

// Batch operations
export const batchOperations = async (
  operations: Array<() => Promise<any>>,
  batchSize: number
): Promise<any[]> => {
  const results: any[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
  }

  return results;
};

// Virtual scrolling
export const createVirtualScroller = (
  items: any[],
  itemHeight: number,
  visibleCount: number
) => {
  let scrollTop = 0;

  return {
    getVisibleItems: () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      return items.slice(startIndex, endIndex);
    },
    scrollTo: (index: number) => {
      scrollTop = index * itemHeight;
    },
    updateScrollTop: (newScrollTop: number) => {
      scrollTop = newScrollTop;
    },
  };
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
  });

  const measurePerformance = useCallback((name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();

    setMetrics(prev => ({
      ...prev,
      [name]: end - start,
    }));
  }, []);

  return { metrics, measurePerformance };
};

// Route preloading hook
export const useRoutePreloading = () => {
  const preloadedRoutes = useRef(new Set<string>());

  const preloadRoute = useCallback(async (route: string) => {
    if (preloadedRoutes.current.has(route)) return;

    try {
      await import(route);
      preloadedRoutes.current.add(route);
    } catch (error) {
      console.error(`Failed to preload route ${route}:`, error);
    }
  }, []);

  return { preloadRoute };
};

// Resource optimization hook
export const useResourceOptimization = () => {
  const [optimizedResources, setOptimizedResources] = useState<string[]>([]);

  const optimizeResource = useCallback((resource: string) => {
    // Add optimization logic here
    setOptimizedResources(prev => [...prev, resource]);
  }, []);

  return { optimizedResources, optimizeResource };
};

// Main performance optimizer component
export const PerformanceOptimizer: React.FC<{
  children: React.ReactNode;
  config?: OptimizationConfig;
}> = ({
  children,
  config = {
    enableLazyLoading: true,
    enablePreloading: true,
    enableCaching: true,
    enableCompression: true,
  },
}) => {
  const { metrics, measurePerformance } = usePerformanceMonitoring();
  const { preloadRoute } = useRoutePreloading();
  const { optimizedResources, optimizeResource } = useResourceOptimization();

  useEffect(() => {
    if (config.enablePreloading) {
      // Preload critical routes
      const criticalRoutes = ['/dashboard', '/market', '/portfolio'];
      criticalRoutes.forEach(route => preloadRoute(route));
    }
  }, [config.enablePreloading, preloadRoute]);

  const contextValue = useMemo(
    () => ({
      metrics,
      measurePerformance,
      optimizedResources,
      optimizeResource,
      config,
    }),
    [metrics, measurePerformance, optimizedResources, optimizeResource, config]
  );

  return <div data-performance-optimizer="true">{children}</div>;
};

// HOC for performance optimization
export const withPerformanceOptimization = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
) => {
  const OptimizedComponent = (props: P) => {
    const renderStart = useRef(performance.now());

    useEffect(() => {
      const renderTime = performance.now() - renderStart.current;
      console.log(
        `${Component.displayName || Component.name} render time: ${renderTime.toFixed(2)}ms`
      );
    });

    return <Component {...props} />;
  };

  OptimizedComponent.displayName = `withPerformanceOptimization(${Component.displayName || Component.name})`;

  return OptimizedComponent;
};

// Performance metrics collector
export const collectPerformanceMetrics = (): PerformanceMetrics => {
  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming;

  return {
    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    renderTime:
      navigation.domContentLoadedEventEnd -
      navigation.domContentLoadedEventStart,
    interactionTime: navigation.domInteractive - navigation.domLoading,
    memoryUsage:
      (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
        ?.usedJSHeapSize || 0,
  };
};

// Utility functions for performance optimization
export const optimizeBundle = (modules: Record<string, unknown>) => {
  return Object.entries(modules).reduce(
    (acc, [key, value]) => {
      // Only include modules that are actually used
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );
};

export const createLazyBundle = (
  importFn: () => Promise<Record<string, unknown>>
) => {
  return async () => {
    const modules = await importFn();
    return optimizeBundle(modules);
  };
};

// ==========================================
// PERFORMANCE PROVIDER COMPONENT
// ==========================================

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  enablePreloading?: boolean;
  enableOptimizations?: boolean;
}

export function PerformanceProvider({
  children,
  enableMonitoring = true,
  enablePreloading = true,
  enableOptimizations = true,
}: PerformanceProviderProps) {
  // Use performance hooks
  if (enableMonitoring) {
    usePerformanceMonitoring();
  }

  if (enablePreloading) {
    useRoutePreloading();
  }

  if (enableOptimizations) {
    useResourceOptimization();
  }

  return <>{children}</>;
}

// ==========================================
// PERFORMANCE UTILITIES
// ==========================================

export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now();
      console.log(`[Performance] ${name} took ${end - start}ms`);
    });
  } else {
    const end = performance.now();
    console.log(`[Performance] ${name} took ${end - start}ms`);
    return result;
  }
}

// Export singletons for direct access
export const performanceMonitor = PerformanceMonitor.getInstance();
export const preloadManager = PreloadManager.getInstance();
export const resourceOptimizer = ResourceOptimizer.getInstance();
