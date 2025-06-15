// ==========================================
// SYSTEM HEALTH MONITOR
// Comprehensive system health tracking and monitoring
// ==========================================

import { ErrorHandler } from './error-handler';
import { unifiedCacheService } from '../services/unified-cache';

// ==========================================
// HEALTH STATUS TYPES
// ==========================================

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical',
}

export enum ComponentType {
  DATABASE = 'database',
  CACHE = 'cache',
  API = 'api',
  CHAT = 'chat',
  MARKET = 'market',
  AUTH = 'auth',
  PERFORMANCE = 'performance',
}

export interface HealthCheck {
  component: ComponentType;
  status: HealthStatus;
  message: string;
  timestamp: Date;
  responseTime?: number;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: HealthStatus;
  timestamp: Date;
  checks: HealthCheck[];
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    critical: number;
  };
  uptime: number;
  version: string;
}

// ==========================================
// HEALTH MONITOR CLASS
// ==========================================

export class SystemHealthMonitor {
  private static instance: SystemHealthMonitor;
  private errorHandler: ErrorHandler;
  private checks: Map<ComponentType, HealthCheck> = new Map();
  private startTime: Date = new Date();
  private readonly version = '2.0.0';
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.errorHandler = new ErrorHandler();
    this.initializeHealthChecks();
  }

  static getInstance(): SystemHealthMonitor {
    if (!SystemHealthMonitor.instance) {
      SystemHealthMonitor.instance = new SystemHealthMonitor();
    }
    return SystemHealthMonitor.instance;
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  private initializeHealthChecks(): void {
    // Initialize all components as unknown
    Object.values(ComponentType).forEach(component => {
      this.checks.set(component, {
        component,
        status: HealthStatus.HEALTHY,
        message: 'Inicializando...',
        timestamp: new Date(),
      });
    });

    // Start periodic health checks
    this.startPeriodicChecks();
  }

  private startPeriodicChecks(): void {
    // Run health checks every 30 seconds
    this.checkInterval = setInterval(() => {
      this.runAllHealthChecks();
    }, 30000);

    // Run initial health check
    this.runAllHealthChecks();
  }

  // ==========================================
  // HEALTH CHECKS
  // ==========================================

  public async runAllHealthChecks(): Promise<SystemHealth> {
    const startTime = Date.now();

    try {
      await Promise.allSettled([
        this.checkDatabase(),
        this.checkCache(),
        this.checkAPIs(),
        this.checkChat(),
        this.checkMarket(),
        this.checkAuth(),
        this.checkPerformance(),
      ]);

      const totalTime = Date.now() - startTime;
      console.log(`[HealthMonitor] Health checks completed in ${totalTime}ms`);

      return this.getSystemHealth();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to run health checks:', errorMessage);

      return this.getSystemHealth();
    }
  }

  private async checkDatabase(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check Supabase connection
      if (typeof window !== 'undefined') {
        // Client-side check
        const response = await fetch('/api/health/database', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          this.updateComponentHealth(ComponentType.DATABASE, {
            status: HealthStatus.HEALTHY,
            message: 'Database connection stable',
            responseTime,
            details: { provider: 'Supabase' },
          });
        } else {
          throw new Error(`Database check failed: ${response.status}`);
        }
      } else {
        // Server-side check would go here
        this.updateComponentHealth(ComponentType.DATABASE, {
          status: HealthStatus.HEALTHY,
          message: 'Database check skipped (server-side)',
          responseTime: Date.now() - startTime,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.updateComponentHealth(ComponentType.DATABASE, {
        status: HealthStatus.UNHEALTHY,
        message: `Database error: ${errorMessage}`,
        responseTime: Date.now() - startTime,
        details: { error: errorMessage },
      });
    }
  }

  private async checkCache(): Promise<void> {
    const startTime = Date.now();

    try {
      // Test cache operations
      const testKey = 'health-check-' + Date.now();
      const testValue = { test: true, timestamp: new Date() };

      await unifiedCacheService.set(testKey, testValue, 5000);
      const retrieved = await unifiedCacheService.get(testKey);
      await unifiedCacheService.delete(testKey);

      const responseTime = Date.now() - startTime;

      if (
        retrieved &&
        JSON.stringify(retrieved) === JSON.stringify(testValue)
      ) {
        const stats = unifiedCacheService.getStats();

        this.updateComponentHealth(ComponentType.CACHE, {
          status:
            stats.combined.overallHitRate > 70
              ? HealthStatus.HEALTHY
              : HealthStatus.DEGRADED,
          message: `Cache operational (Hit rate: ${stats.combined.overallHitRate.toFixed(1)}%)`,
          responseTime,
          details: {
            hitRate: stats.combined.overallHitRate,
            totalHits: stats.combined.totalHits,
            totalMisses: stats.combined.totalMisses,
            memorySize: stats.memory.size,
          },
        });
      } else {
        throw new Error('Cache set/get test failed');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.updateComponentHealth(ComponentType.CACHE, {
        status: HealthStatus.UNHEALTHY,
        message: `Cache error: ${errorMessage}`,
        responseTime: Date.now() - startTime,
        details: { error: errorMessage },
      });
    }
  }

  private async checkAPIs(): Promise<void> {
    const startTime = Date.now();

    try {
      if (typeof window !== 'undefined') {
        // Test API endpoints
        const testResponse = await fetch('/api/health/apis', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const responseTime = Date.now() - startTime;

        if (testResponse.ok) {
          const data = await testResponse.json();

          this.updateComponentHealth(ComponentType.API, {
            status: HealthStatus.HEALTHY,
            message: 'API endpoints responding',
            responseTime,
            details: data,
          });
        } else {
          throw new Error(`API health check failed: ${testResponse.status}`);
        }
      } else {
        this.updateComponentHealth(ComponentType.API, {
          status: HealthStatus.HEALTHY,
          message: 'API check skipped (server-side)',
          responseTime: Date.now() - startTime,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.updateComponentHealth(ComponentType.API, {
        status: HealthStatus.DEGRADED,
        message: `API check error: ${errorMessage}`,
        responseTime: Date.now() - startTime,
        details: { error: errorMessage },
      });
    }
  }

  private async checkChat(): Promise<void> {
    const startTime = Date.now();

    try {
      if (typeof window !== 'undefined') {
        // Test chat API
        const response = await fetch('/api/health/chat', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          this.updateComponentHealth(ComponentType.CHAT, {
            status: HealthStatus.HEALTHY,
            message: 'Chat system operational',
            responseTime,
            details: { unified_api: true },
          });
        } else {
          throw new Error(`Chat health check failed: ${response.status}`);
        }
      } else {
        this.updateComponentHealth(ComponentType.CHAT, {
          status: HealthStatus.HEALTHY,
          message: 'Chat check skipped (server-side)',
          responseTime: Date.now() - startTime,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.updateComponentHealth(ComponentType.CHAT, {
        status: HealthStatus.DEGRADED,
        message: `Chat system error: ${errorMessage}`,
        responseTime: Date.now() - startTime,
        details: { error: errorMessage },
      });
    }
  }

  private async checkMarket(): Promise<void> {
    const startTime = Date.now();

    try {
      if (typeof window !== 'undefined') {
        // Test market data APIs
        const response = await fetch('/api/health/market', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();

          this.updateComponentHealth(ComponentType.MARKET, {
            status: HealthStatus.HEALTHY,
            message: 'Market data services online',
            responseTime,
            details: data,
          });
        } else {
          throw new Error(`Market health check failed: ${response.status}`);
        }
      } else {
        this.updateComponentHealth(ComponentType.MARKET, {
          status: HealthStatus.HEALTHY,
          message: 'Market check skipped (server-side)',
          responseTime: Date.now() - startTime,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.updateComponentHealth(ComponentType.MARKET, {
        status: HealthStatus.DEGRADED,
        message: `Market data error: ${errorMessage}`,
        responseTime: Date.now() - startTime,
        details: { error: errorMessage },
      });
    }
  }

  private async checkAuth(): Promise<void> {
    const startTime = Date.now();

    try {
      if (typeof window !== 'undefined') {
        // Test auth system
        const response = await fetch('/api/health/auth', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          this.updateComponentHealth(ComponentType.AUTH, {
            status: HealthStatus.HEALTHY,
            message: 'Authentication system operational',
            responseTime,
            details: { provider: 'Supabase' },
          });
        } else {
          throw new Error(`Auth health check failed: ${response.status}`);
        }
      } else {
        this.updateComponentHealth(ComponentType.AUTH, {
          status: HealthStatus.HEALTHY,
          message: 'Auth check skipped (server-side)',
          responseTime: Date.now() - startTime,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.updateComponentHealth(ComponentType.AUTH, {
        status: HealthStatus.DEGRADED,
        message: `Auth system error: ${errorMessage}`,
        responseTime: Date.now() - startTime,
        details: { error: errorMessage },
      });
    }
  }

  private async checkPerformance(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check performance metrics
      const performanceData = {
        memoryUsage:
          typeof window !== 'undefined'
            ? (
                window.performance as {
                  memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
                }
              ).memory
            : null,
        timing:
          typeof window !== 'undefined' ? window.performance.timing : null,
        uptime: this.getUptime(),
      };

      const responseTime = Date.now() - startTime;

      let status = HealthStatus.HEALTHY;
      let message = 'Performance metrics normal';

      // Check memory usage
      if (
        performanceData.memoryUsage &&
        performanceData.memoryUsage.usedJSHeapSize &&
        performanceData.memoryUsage.totalJSHeapSize
      ) {
        const memoryUsagePercent =
          (performanceData.memoryUsage.usedJSHeapSize /
            performanceData.memoryUsage.totalJSHeapSize) *
          100;

        if (memoryUsagePercent > 90) {
          status = HealthStatus.CRITICAL;
          message = `High memory usage: ${memoryUsagePercent.toFixed(1)}%`;
        } else if (memoryUsagePercent > 70) {
          status = HealthStatus.DEGRADED;
          message = `Elevated memory usage: ${memoryUsagePercent.toFixed(1)}%`;
        }
      }

      this.updateComponentHealth(ComponentType.PERFORMANCE, {
        status,
        message,
        responseTime,
        details: {
          ...performanceData,
          memoryUsagePercent:
            performanceData.memoryUsage &&
            performanceData.memoryUsage.usedJSHeapSize &&
            performanceData.memoryUsage.totalJSHeapSize
              ? (performanceData.memoryUsage.usedJSHeapSize /
                  performanceData.memoryUsage.totalJSHeapSize) *
                100
              : null,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.updateComponentHealth(ComponentType.PERFORMANCE, {
        status: HealthStatus.DEGRADED,
        message: `Performance check error: ${errorMessage}`,
        responseTime: Date.now() - startTime,
        details: { error: errorMessage },
      });
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  private updateComponentHealth(
    component: ComponentType,
    update: Partial<HealthCheck>
  ): void {
    const existing = this.checks.get(component);

    this.checks.set(component, {
      component,
      timestamp: new Date(),
      ...existing,
      ...update,
    } as HealthCheck);
  }

  private getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  private calculateOverallStatus(): HealthStatus {
    const statuses = Array.from(this.checks.values()).map(
      check => check.status
    );

    if (statuses.includes(HealthStatus.CRITICAL)) {
      return HealthStatus.CRITICAL;
    }

    if (statuses.includes(HealthStatus.UNHEALTHY)) {
      return HealthStatus.UNHEALTHY;
    }

    if (statuses.includes(HealthStatus.DEGRADED)) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  public getSystemHealth(): SystemHealth {
    const checks = Array.from(this.checks.values());

    const summary = {
      healthy: checks.filter(c => c.status === HealthStatus.HEALTHY).length,
      degraded: checks.filter(c => c.status === HealthStatus.DEGRADED).length,
      unhealthy: checks.filter(c => c.status === HealthStatus.UNHEALTHY).length,
      critical: checks.filter(c => c.status === HealthStatus.CRITICAL).length,
    };

    return {
      status: this.calculateOverallStatus(),
      timestamp: new Date(),
      checks,
      summary,
      uptime: this.getUptime(),
      version: this.version,
    };
  }

  public getComponentHealth(component: ComponentType): HealthCheck | null {
    return this.checks.get(component) || null;
  }

  public async refreshComponent(
    component: ComponentType
  ): Promise<HealthCheck> {
    switch (component) {
      case ComponentType.DATABASE:
        await this.checkDatabase();
        break;
      case ComponentType.CACHE:
        await this.checkCache();
        break;
      case ComponentType.API:
        await this.checkAPIs();
        break;
      case ComponentType.CHAT:
        await this.checkChat();
        break;
      case ComponentType.MARKET:
        await this.checkMarket();
        break;
      case ComponentType.AUTH:
        await this.checkAuth();
        break;
      case ComponentType.PERFORMANCE:
        await this.checkPerformance();
        break;
    }

    return this.checks.get(component)!;
  }

  public getHealthSummary(): string {
    const health = this.getSystemHealth();
    const { summary } = health;

    const total =
      summary.healthy + summary.degraded + summary.unhealthy + summary.critical;

    return `System Health: ${health.status.toUpperCase()} (${summary.healthy}/${total} healthy)`;
  }

  public isHealthy(): boolean {
    return this.calculateOverallStatus() === HealthStatus.HEALTHY;
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const systemHealthMonitor = SystemHealthMonitor.getInstance();
