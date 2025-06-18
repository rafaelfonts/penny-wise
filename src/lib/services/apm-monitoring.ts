/**
 * APM (Application Performance Monitoring) System
 * Sistema completo de monitoramento de performance e saúde da aplicação
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorMetric {
  error: Error;
  context: Record<string, any>;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stack?: string;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: number;
  details?: Record<string, any>;
}

interface Alert {
  id: string;
  type: 'performance' | 'error' | 'health';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata?: Record<string, any>;
}

class APMMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Alert[] = [];
  private isEnabled: boolean = true;
  private alertWebhookUrl?: string;

  // Thresholds for alerting
  private thresholds = {
    responseTime: 2000, // 2 seconds
    errorRate: 0.05, // 5%
    memoryUsage: 0.85, // 85%
    cpuUsage: 0.80 // 80%
  };

  constructor(options?: {
    enabled?: boolean;
    alertWebhookUrl?: string;
    thresholds?: typeof this.thresholds;
  }) {
    if (options?.enabled !== undefined) {
      this.isEnabled = options.enabled;
    }
    
    if (options?.alertWebhookUrl) {
      this.alertWebhookUrl = options.alertWebhookUrl;
    }
    
    if (options?.thresholds) {
      this.thresholds = { ...this.thresholds, ...options.thresholds };
    }

    // Initialize performance observer
    this.initializePerformanceObserver();
    
    // Start health checks
    this.startHealthChecks();
    
    // Clean up old data every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);

    // Check for performance alerts
    this.checkPerformanceThresholds(metric);
  }

  /**
   * Record an error
   */
  recordError(error: Error, context: Record<string, any> = {}, severity: ErrorMetric['severity'] = 'medium'): void {
    if (!this.isEnabled) return;

    const errorMetric: ErrorMetric = {
      error,
      context,
      timestamp: Date.now(),
      severity,
      stack: error.stack
    };

    this.errors.push(errorMetric);

    // Create alert for critical errors
    if (severity === 'critical') {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        message: `Critical error: ${error.message}`,
        metadata: { context, stack: error.stack }
      });
    }
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, tags);
      this.recordMetric(`${name}_success`, 1, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, tags);
      this.recordMetric(`${name}_error`, 1, tags);
      this.recordError(error as Error, { functionName: name }, 'high');
      throw error;
    }
  }

  /**
   * Record API call metrics
   */
  recordApiCall(endpoint: string, method: string, statusCode: number, duration: number): void {
    const tags = { endpoint, method, status: statusCode.toString() };
    
    this.recordMetric('api_call_duration', duration, tags);
    this.recordMetric('api_call_count', 1, tags);
    
    if (statusCode >= 400) {
      this.recordMetric('api_call_error', 1, tags);
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(query: string, duration: number, success: boolean): void {
    const tags = { 
      query_type: this.getQueryType(query),
      success: success.toString()
    };
    
    this.recordMetric('db_query_duration', duration, tags);
    this.recordMetric('db_query_count', 1, tags);
    
    if (!success) {
      this.recordMetric('db_query_error', 1, tags);
    }
  }

  /**
   * Get current system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheck[];
    alerts: Alert[];
    metrics: {
      responseTime: number;
      errorRate: number;
      throughput: number;
    };
  } {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    const recentErrors = this.getRecentErrors(5 * 60 * 1000);
    
    const responseTime = this.calculateAverageResponseTime(recentMetrics);
    const errorRate = this.calculateErrorRate(recentMetrics, recentErrors);
    const throughput = this.calculateThroughput(recentMetrics);
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Determine overall status
    const unhealthyServices = Array.from(this.healthChecks.values())
      .filter(check => check.status === 'unhealthy');
    const degradedServices = Array.from(this.healthChecks.values())
      .filter(check => check.status === 'degraded');
    
    if (unhealthyServices.length > 0 || errorRate > this.thresholds.errorRate) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0 || responseTime > this.thresholds.responseTime) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      services: Array.from(this.healthChecks.values()),
      alerts: this.alerts.filter(alert => !alert.resolved),
      metrics: {
        responseTime,
        errorRate,
        throughput
      }
    };
  }

  /**
   * Get performance dashboard data
   */
  getDashboardData() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    return {
      timestamp: now,
      metrics: {
        responseTime: this.getMetricHistory('api_call_duration', oneHour),
        errorRate: this.calculateErrorRateHistory(oneHour),
        throughput: this.getMetricHistory('api_call_count', oneHour),
        memoryUsage: this.getMetricHistory('memory_usage', oneHour),
        cpuUsage: this.getMetricHistory('cpu_usage', oneHour)
      },
      topErrors: this.getTopErrors(24 * 60 * 60 * 1000), // Last 24 hours
      slowestEndpoints: this.getSlowestEndpoints(oneHour),
      healthChecks: Array.from(this.healthChecks.values()),
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
  }

  /**
   * Initialize performance observer for web vitals
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
          this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
        }
        
        if (entry.entryType === 'paint') {
          this.recordMetric(entry.name.replace('-', '_'), entry.startTime);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'paint'] });
      
      // Web Vitals
      if ('web-vitals' in window) {
        // These would come from web-vitals library if installed
        this.recordWebVitals();
      }
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    const checkInterval = 30 * 1000; // 30 seconds
    
    setInterval(async () => {
      await this.performHealthChecks();
    }, checkInterval);

    // Initial health check
    setTimeout(() => this.performHealthChecks(), 1000);
  }

  /**
   * Perform health checks on critical services
   */
  private async performHealthChecks(): Promise<void> {
    const services = [
      { name: 'database', url: '/api/health/database' },
      { name: 'redis', url: '/api/health/redis' },
      { name: 'external_apis', url: '/api/health/external' }
    ];

    for (const service of services) {
      try {
        const startTime = performance.now();
        const response = await fetch(service.url, { 
          method: 'GET',
          timeout: 10000 // 10 second timeout
        });
        const duration = performance.now() - startTime;

        const healthCheck: HealthCheck = {
          service: service.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: duration,
          timestamp: Date.now(),
          details: response.ok ? undefined : { 
            status: response.status, 
            statusText: response.statusText 
          }
        };

        this.healthChecks.set(service.name, healthCheck);

        // Create alert if service becomes unhealthy
        if (!response.ok) {
          this.createAlert({
            type: 'health',
            severity: 'critical',
            message: `Service ${service.name} is unhealthy`,
            metadata: { responseTime: duration, status: response.status }
          });
        }

      } catch (error) {
        const healthCheck: HealthCheck = {
          service: service.name,
          status: 'unhealthy',
          responseTime: -1,
          timestamp: Date.now(),
          details: { error: (error as Error).message }
        };

        this.healthChecks.set(service.name, healthCheck);

        this.createAlert({
          type: 'health',
          severity: 'critical',
          message: `Service ${service.name} is down`,
          metadata: { error: (error as Error).message }
        });
      }
    }
  }

  /**
   * Create and send alert
   */
  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Send webhook notification
    this.sendAlertWebhook(alert);
  }

  /**
   * Send alert to webhook
   */
  private async sendAlertWebhook(alert: Alert): Promise<void> {
    if (!this.alertWebhookUrl) return;

    try {
      await fetch(this.alertWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
          alert,
          timestamp: new Date(alert.timestamp).toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send alert webhook:', error);
    }
  }

  /**
   * Helper methods for calculations
   */
  private getRecentMetrics(timeWindow: number): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  private getRecentErrors(timeWindow: number): ErrorMetric[] {
    const cutoff = Date.now() - timeWindow;
    return this.errors.filter(error => error.timestamp > cutoff);
  }

  private calculateAverageResponseTime(metrics: PerformanceMetric[]): number {
    const apiDurations = metrics.filter(m => m.name === 'api_call_duration');
    if (apiDurations.length === 0) return 0;
    
    const sum = apiDurations.reduce((acc, m) => acc + m.value, 0);
    return sum / apiDurations.length;
  }

  private calculateErrorRate(metrics: PerformanceMetric[], errors: ErrorMetric[]): number {
    const totalRequests = metrics.filter(m => m.name === 'api_call_count').length;
    if (totalRequests === 0) return 0;
    
    return errors.length / totalRequests;
  }

  private calculateThroughput(metrics: PerformanceMetric[]): number {
    const requests = metrics.filter(m => m.name === 'api_call_count');
    return requests.length / 60; // requests per minute
  }

  private calculateErrorRateHistory(timeWindow: number): Array<{ timestamp: number; value: number }> {
    const cutoff = Date.now() - timeWindow;
    const interval = timeWindow / 20; // 20 data points
    const history: Array<{ timestamp: number; value: number }> = [];

    for (let i = 0; i < 20; i++) {
      const start = cutoff + (i * interval);
      const end = start + interval;
      
      const periodMetrics = this.metrics.filter(m => 
        m.timestamp >= start && m.timestamp < end && m.name === 'api_call_count'
      );
      const periodErrors = this.errors.filter(e => 
        e.timestamp >= start && e.timestamp < end
      );
      
      const errorRate = periodMetrics.length > 0 ? periodErrors.length / periodMetrics.length : 0;
      
      history.push({
        timestamp: end,
        value: errorRate
      });
    }

    return history;
  }

  private getMetricHistory(metricName: string, timeWindow: number): Array<{ timestamp: number; value: number }> {
    const cutoff = Date.now() - timeWindow;
    const relevantMetrics = this.metrics.filter(m => 
      m.name === metricName && m.timestamp > cutoff
    ).sort((a, b) => a.timestamp - b.timestamp);

    // Group by time intervals
    const interval = timeWindow / 20;
    const history: Array<{ timestamp: number; value: number }> = [];

    for (let i = 0; i < 20; i++) {
      const start = cutoff + (i * interval);
      const end = start + interval;
      
      const periodMetrics = relevantMetrics.filter(m => 
        m.timestamp >= start && m.timestamp < end
      );
      
      const avgValue = periodMetrics.length > 0 
        ? periodMetrics.reduce((sum, m) => sum + m.value, 0) / periodMetrics.length
        : 0;
      
      history.push({
        timestamp: end,
        value: avgValue
      });
    }

    return history;
  }

  private getTopErrors(timeWindow: number): Array<{ error: string; count: number; lastSeen: number }> {
    const cutoff = Date.now() - timeWindow;
    const recentErrors = this.errors.filter(e => e.timestamp > cutoff);
    
    const errorCounts = new Map<string, { count: number; lastSeen: number }>();
    
    recentErrors.forEach(error => {
      const key = error.error.message;
      const existing = errorCounts.get(key);
      
      if (existing) {
        existing.count++;
        existing.lastSeen = Math.max(existing.lastSeen, error.timestamp);
      } else {
        errorCounts.set(key, { count: 1, lastSeen: error.timestamp });
      }
    });
    
    return Array.from(errorCounts.entries())
      .map(([error, data]) => ({ error, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getSlowestEndpoints(timeWindow: number): Array<{ endpoint: string; avgDuration: number; count: number }> {
    const cutoff = Date.now() - timeWindow;
    const apiCalls = this.metrics.filter(m => 
      m.name === 'api_call_duration' && 
      m.timestamp > cutoff &&
      m.tags?.endpoint
    );
    
    const endpointStats = new Map<string, { totalDuration: number; count: number }>();
    
    apiCalls.forEach(metric => {
      const endpoint = metric.tags!.endpoint;
      const existing = endpointStats.get(endpoint);
      
      if (existing) {
        existing.totalDuration += metric.value;
        existing.count++;
      } else {
        endpointStats.set(endpoint, { totalDuration: metric.value, count: 1 });
      }
    });
    
    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);
  }

  private getQueryType(query: string): string {
    const upperQuery = query.trim().toUpperCase();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }

  private recordWebVitals(): void {
    // This would integrate with web-vitals library
    // For now, we'll simulate some basic vitals
    if (typeof window !== 'undefined') {
      // Simulate CLS, FID, LCP measurements
      setTimeout(() => {
        this.recordMetric('cumulative_layout_shift', Math.random() * 0.25);
        this.recordMetric('first_input_delay', Math.random() * 100);
        this.recordMetric('largest_contentful_paint', 1000 + Math.random() * 2000);
      }, 2000);
    }
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    // Check for performance threshold violations
    if (metric.name === 'api_call_duration' && metric.value > this.thresholds.responseTime) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        message: `Slow API response: ${metric.value.toFixed(2)}ms on ${metric.tags?.endpoint || 'unknown endpoint'}`,
        metadata: { metric }
      });
    }
  }

  private cleanup(): void {
    const oneHour = 60 * 60 * 1000;
    const cutoff = Date.now() - oneHour;
    
    // Keep only last hour of metrics
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.errors = this.errors.filter(e => e.timestamp > cutoff);
    
    // Keep alerts for 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp > oneDayAgo);
  }
}

// Global instance
export const apmMonitoring = new APMMonitoringService({
  enabled: process.env.NODE_ENV === 'production',
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
  thresholds: {
    responseTime: Number(process.env.APM_RESPONSE_TIME_THRESHOLD) || 2000,
    errorRate: Number(process.env.APM_ERROR_RATE_THRESHOLD) || 0.05,
    memoryUsage: Number(process.env.APM_MEMORY_THRESHOLD) || 0.85,
    cpuUsage: Number(process.env.APM_CPU_THRESHOLD) || 0.80
  }
});

export { APMMonitoringService };
export type { PerformanceMetric, ErrorMetric, HealthCheck, Alert }; 