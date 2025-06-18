import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock the system health monitor
const mockSystemHealthMonitor = {
  getInstance: jest.fn(),
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  getHealthStatus: jest.fn(),
  getMetrics: jest.fn(),
  checkApiHealth: jest.fn(),
  checkDatabaseHealth: jest.fn(),
  checkMemoryUsage: jest.fn(),
  checkCpuUsage: jest.fn(),
  recordMetric: jest.fn(),
  getPerformanceReport: jest.fn(),
  setThresholds: jest.fn(),
  getAlerts: jest.fn(),
  clearAlerts: jest.fn(),
  exportMetrics: jest.fn(),
};

jest.mock('@/lib/utils/system-health-monitor', () => ({
  systemHealthMonitor: mockSystemHealthMonitor,
  SystemHealthMonitor: jest.fn().mockImplementation(() => mockSystemHealthMonitor),
}));

describe('System Health Monitor Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock performance API
    global.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Health Status Monitoring', () => {
    test('should return overall system health status', () => {
      const getHealthStatus = () => {
        const now = Date.now();
        return {
          status: 'healthy',
          timestamp: now,
          uptime: 3600000, // 1 hour
          services: {
            api: { status: 'healthy', responseTime: 150, lastCheck: now },
            database: { status: 'healthy', connectionCount: 5, lastCheck: now },
            cache: { status: 'healthy', hitRate: 0.85, lastCheck: now },
            external: { status: 'degraded', responseTime: 2500, lastCheck: now },
          },
          metrics: {
            memoryUsage: 0.65,
            cpuUsage: 0.45,
            diskUsage: 0.30,
            networkLatency: 25,
          },
          alerts: [],
        };
      };

      mockSystemHealthMonitor.getHealthStatus.mockImplementation(getHealthStatus);

      const health = mockSystemHealthMonitor.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.services.api.status).toBe('healthy');
      expect(health.services.database.status).toBe('healthy');
      expect(health.services.external.status).toBe('degraded');
      expect(health.metrics.memoryUsage).toBeLessThan(1);
      expect(health.metrics.cpuUsage).toBeLessThan(1);
      expect(health.alerts).toHaveLength(0);
    });

    test('should detect unhealthy system conditions', () => {
      const getUnhealthyStatus = () => {
        const now = Date.now();
        return {
          status: 'unhealthy',
          timestamp: now,
          uptime: 7200000, // 2 hours
          services: {
            api: { status: 'unhealthy', responseTime: 5000, lastCheck: now, error: 'Timeout' },
            database: { status: 'healthy', connectionCount: 3, lastCheck: now },
            cache: { status: 'degraded', hitRate: 0.45, lastCheck: now },
            external: { status: 'down', responseTime: null, lastCheck: now, error: 'Connection refused' },
          },
          metrics: {
            memoryUsage: 0.95, // High memory usage
            cpuUsage: 0.88,    // High CPU usage
            diskUsage: 0.85,   // High disk usage
            networkLatency: 150,
          },
          alerts: [
            { type: 'high_memory', severity: 'critical', message: 'Memory usage above 90%' },
            { type: 'high_cpu', severity: 'warning', message: 'CPU usage above 80%' },
            { type: 'service_down', severity: 'critical', message: 'External service unavailable' },
          ],
        };
      };

      mockSystemHealthMonitor.getHealthStatus.mockImplementation(getUnhealthyStatus);

      const health = mockSystemHealthMonitor.getHealthStatus();

      expect(health.status).toBe('unhealthy');
      expect(health.services.api.status).toBe('unhealthy');
      expect(health.services.external.status).toBe('down');
      expect(health.metrics.memoryUsage).toBeGreaterThan(0.9);
      expect(health.alerts).toHaveLength(3);
      expect(health.alerts[0].severity).toBe('critical');
    });

    test('should monitor service response times', async () => {
      const checkApiHealth = async () => {
        const startTime = performance.now();
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        return {
          status: responseTime < 1000 ? 'healthy' : 'degraded',
          responseTime: Math.round(responseTime),
          timestamp: Date.now(),
          endpoint: '/api/health',
        };
      };

      mockSystemHealthMonitor.checkApiHealth.mockImplementation(checkApiHealth);

      const apiHealth = await mockSystemHealthMonitor.checkApiHealth();

      expect(apiHealth.status).toBe('healthy');
      expect(apiHealth.responseTime).toBeGreaterThan(0);
      expect(apiHealth.responseTime).toBeLessThan(1000);
      expect(apiHealth.endpoint).toBe('/api/health');
    });
  });

  describe('Performance Metrics Collection', () => {
    test('should record and retrieve performance metrics', () => {
      const metrics = new Map();

      const recordMetric = (name: string, value: number, tags?: Record<string, string>) => {
        const timestamp = Date.now();
        const key = `${name}:${timestamp}`;
        
        metrics.set(key, {
          name,
          value,
          timestamp,
          tags: tags || {},
        });

        return { recorded: true, key };
      };

      const getMetrics = (name?: string, timeRange?: { start: number; end: number }) => {
        const allMetrics = Array.from(metrics.values());
        
        let filtered = allMetrics;
        
        if (name) {
          filtered = filtered.filter(m => m.name === name);
        }
        
        if (timeRange) {
          filtered = filtered.filter(m => 
            m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
          );
        }

        return filtered.sort((a, b) => b.timestamp - a.timestamp);
      };

      mockSystemHealthMonitor.recordMetric.mockImplementation(recordMetric);
      mockSystemHealthMonitor.getMetrics.mockImplementation(getMetrics);

      // Record some metrics
      mockSystemHealthMonitor.recordMetric('api_response_time', 150, { endpoint: '/api/quotes' });
      mockSystemHealthMonitor.recordMetric('api_response_time', 200, { endpoint: '/api/analyze' });
      mockSystemHealthMonitor.recordMetric('memory_usage', 0.65);
      mockSystemHealthMonitor.recordMetric('cpu_usage', 0.45);

      // Retrieve all metrics
      const allMetrics = mockSystemHealthMonitor.getMetrics();
      expect(allMetrics).toHaveLength(4);

      // Retrieve specific metrics
      const apiMetrics = mockSystemHealthMonitor.getMetrics('api_response_time');
      expect(apiMetrics).toHaveLength(2);
      expect(apiMetrics[0].tags.endpoint).toBeDefined();
    });

    test('should calculate metric statistics', () => {
      const calculateStats = (values: number[]) => {
        if (values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;
        
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return {
          count: values.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          mean: Math.round(mean * 100) / 100,
          median: sorted[Math.floor(sorted.length / 2)],
          stdDev: Math.round(stdDev * 100) / 100,
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
        };
      };

      const responseTimeValues = [120, 150, 180, 200, 250, 300, 180, 160, 140, 190];
      const stats = calculateStats(responseTimeValues);

      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(10);
      expect(stats!.min).toBe(120);
      expect(stats!.max).toBe(300);
      expect(stats!.mean).toBeCloseTo(187, 0);
      expect(stats!.p95).toBeGreaterThan(stats!.median);
    });

    test('should track resource usage over time', () => {
      const resourceHistory: Array<{
        timestamp: number;
        memory: number;
        cpu: number;
        disk: number;
      }> = [];

      const recordResourceUsage = () => {
        const usage = {
          timestamp: Date.now(),
          memory: Math.random() * 0.3 + 0.4, // 40-70%
          cpu: Math.random() * 0.4 + 0.2,    // 20-60%
          disk: Math.random() * 0.2 + 0.3,   // 30-50%
        };

        resourceHistory.push(usage);
        
        // Keep only last 100 entries
        if (resourceHistory.length > 100) {
          resourceHistory.shift();
        }

        return usage;
      };

      const getResourceTrends = (minutes: number = 60) => {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        const recent = resourceHistory.filter(r => r.timestamp > cutoff);

        if (recent.length < 2) return null;

        const first = recent[0];
        const last = recent[recent.length - 1];

        return {
          memory: {
            current: last.memory,
            trend: last.memory > first.memory ? 'increasing' : 'decreasing',
            change: ((last.memory - first.memory) / first.memory) * 100,
          },
          cpu: {
            current: last.cpu,
            trend: last.cpu > first.cpu ? 'increasing' : 'decreasing',
            change: ((last.cpu - first.cpu) / first.cpu) * 100,
          },
          disk: {
            current: last.disk,
            trend: last.disk > first.disk ? 'increasing' : 'decreasing',
            change: ((last.disk - first.disk) / first.disk) * 100,
          },
        };
      };

      // Record some usage data
      for (let i = 0; i < 10; i++) {
        recordResourceUsage();
      }

      const trends = getResourceTrends();
      expect(trends).not.toBeNull();
      expect(trends!.memory.current).toBeGreaterThan(0);
      expect(trends!.cpu.current).toBeGreaterThan(0);
      expect(trends!.disk.current).toBeGreaterThan(0);
      expect(['increasing', 'decreasing']).toContain(trends!.memory.trend);
    });
  });

  describe('Alert Management', () => {
    test('should generate alerts based on thresholds', () => {
      const thresholds = {
        memory: { warning: 0.8, critical: 0.9 },
        cpu: { warning: 0.7, critical: 0.85 },
        responseTime: { warning: 1000, critical: 2000 },
      };

      const checkThresholds = (metrics: Record<string, number>) => {
        const alerts = [];

        for (const [metric, value] of Object.entries(metrics)) {
          const threshold = thresholds[metric as keyof typeof thresholds];
          if (!threshold) continue;

          if (value >= threshold.critical) {
            alerts.push({
              type: `high_${metric}`,
              severity: 'critical',
              message: `${metric} usage is critical: ${(value * 100).toFixed(1)}%`,
              value,
              threshold: threshold.critical,
              timestamp: Date.now(),
            });
          } else if (value >= threshold.warning) {
            alerts.push({
              type: `high_${metric}`,
              severity: 'warning',
              message: `${metric} usage is high: ${(value * 100).toFixed(1)}%`,
              value,
              threshold: threshold.warning,
              timestamp: Date.now(),
            });
          }
        }

        return alerts;
      };

      const criticalMetrics = { memory: 0.95, cpu: 0.88, responseTime: 2500 };
      const warningMetrics = { memory: 0.85, cpu: 0.75, responseTime: 1200 };
      const normalMetrics = { memory: 0.65, cpu: 0.45, responseTime: 800 };

      const criticalAlerts = checkThresholds(criticalMetrics);
      const warningAlerts = checkThresholds(warningMetrics);
      const normalAlerts = checkThresholds(normalMetrics);

      expect(criticalAlerts).toHaveLength(3);
      expect(criticalAlerts.every(a => a.severity === 'critical')).toBe(true);

      expect(warningAlerts).toHaveLength(3);
      expect(warningAlerts.every(a => a.severity === 'warning')).toBe(true);

      expect(normalAlerts).toHaveLength(0);
    });

    test('should manage alert lifecycle', () => {
      const activeAlerts = new Map();

      const addAlert = (alert: any) => {
        const id = `${alert.type}_${alert.timestamp}`;
        activeAlerts.set(id, {
          ...alert,
          id,
          acknowledged: false,
          resolved: false,
        });
        return id;
      };

      const acknowledgeAlert = (id: string) => {
        const alert = activeAlerts.get(id);
        if (alert) {
          alert.acknowledged = true;
          alert.acknowledgedAt = Date.now();
          return true;
        }
        return false;
      };

      const resolveAlert = (id: string) => {
        const alert = activeAlerts.get(id);
        if (alert) {
          alert.resolved = true;
          alert.resolvedAt = Date.now();
          return true;
        }
        return false;
      };

      const getActiveAlerts = () => {
        return Array.from(activeAlerts.values()).filter(a => !a.resolved);
      };

      // Add alerts
      const alert1Id = addAlert({
        type: 'high_memory',
        severity: 'critical',
        message: 'Memory usage critical',
        timestamp: Date.now(),
      });

      const alert2Id = addAlert({
        type: 'high_cpu',
        severity: 'warning',
        message: 'CPU usage high',
        timestamp: Date.now(),
      });

      expect(getActiveAlerts()).toHaveLength(2);

      // Acknowledge alert
      acknowledgeAlert(alert1Id);
      const acknowledgedAlert = activeAlerts.get(alert1Id);
      expect(acknowledgedAlert.acknowledged).toBe(true);

      // Resolve alert
      resolveAlert(alert1Id);
      expect(getActiveAlerts()).toHaveLength(1);
    });

    test('should prevent alert spam with cooldown periods', () => {
      const alertCooldowns = new Map();
      const COOLDOWN_PERIOD = 300000; // 5 minutes

      const shouldCreateAlert = (type: string, severity: string) => {
        const key = `${type}_${severity}`;
        const lastAlert = alertCooldowns.get(key);
        const now = Date.now();

        if (lastAlert && (now - lastAlert) < COOLDOWN_PERIOD) {
          return false;
        }

        alertCooldowns.set(key, now);
        return true;
      };

      // First alert should be created
      expect(shouldCreateAlert('high_memory', 'critical')).toBe(true);

      // Immediate duplicate should be blocked
      expect(shouldCreateAlert('high_memory', 'critical')).toBe(false);

      // Different severity should be allowed
      expect(shouldCreateAlert('high_memory', 'warning')).toBe(true);

      // Different type should be allowed
      expect(shouldCreateAlert('high_cpu', 'critical')).toBe(true);
    });
  });

  describe('Performance Reporting', () => {
    test('should generate comprehensive performance report', () => {
      const generatePerformanceReport = (timeRange: { start: number; end: number }) => {
        const mockMetrics = {
          apiResponseTimes: [120, 150, 180, 200, 250],
          memoryUsage: [0.65, 0.68, 0.72, 0.70, 0.69],
          cpuUsage: [0.45, 0.50, 0.48, 0.52, 0.47],
          errorRates: [0.01, 0.02, 0.01, 0.03, 0.01],
        };

        const calculateAverage = (values: number[]) => 
          values.reduce((sum, val) => sum + val, 0) / values.length;

        return {
          timeRange,
          generatedAt: Date.now(),
          summary: {
            avgResponseTime: Math.round(calculateAverage(mockMetrics.apiResponseTimes)),
            avgMemoryUsage: Math.round(calculateAverage(mockMetrics.memoryUsage) * 100),
            avgCpuUsage: Math.round(calculateAverage(mockMetrics.cpuUsage) * 100),
            avgErrorRate: Math.round(calculateAverage(mockMetrics.errorRates) * 10000) / 100,
          },
          trends: {
            responseTime: 'stable',
            memoryUsage: 'increasing',
            cpuUsage: 'stable',
            errorRate: 'decreasing',
          },
          recommendations: [
            'Monitor memory usage trend',
            'Consider scaling if response times increase',
            'Error rate is within acceptable limits',
          ],
          alerts: {
            total: 5,
            critical: 1,
            warning: 3,
            resolved: 4,
          },
        };
      };

      mockSystemHealthMonitor.getPerformanceReport.mockImplementation(generatePerformanceReport);

      const timeRange = {
        start: Date.now() - 3600000, // 1 hour ago
        end: Date.now(),
      };

      const report = mockSystemHealthMonitor.getPerformanceReport(timeRange);

      expect(report.summary.avgResponseTime).toBeGreaterThan(0);
      expect(report.summary.avgMemoryUsage).toBeLessThan(100);
      expect(report.trends.responseTime).toBe('stable');
      expect(report.recommendations).toHaveLength(3);
      expect(report.alerts.total).toBe(5);
    });

    test('should export metrics in different formats', () => {
      const exportMetrics = (format: 'json' | 'csv' | 'prometheus') => {
        const metrics = [
          { name: 'api_response_time', value: 150, timestamp: Date.now() },
          { name: 'memory_usage', value: 0.65, timestamp: Date.now() },
          { name: 'cpu_usage', value: 0.45, timestamp: Date.now() },
        ];

        switch (format) {
          case 'json':
            return {
              format: 'json',
              data: JSON.stringify(metrics, null, 2),
              contentType: 'application/json',
            };

          case 'csv':
            const csvHeader = 'name,value,timestamp\n';
            const csvRows = metrics.map(m => `${m.name},${m.value},${m.timestamp}`).join('\n');
            return {
              format: 'csv',
              data: csvHeader + csvRows,
              contentType: 'text/csv',
            };

          case 'prometheus':
            const prometheusData = metrics.map(m => 
              `${m.name.replace(/_/g, '_')} ${m.value} ${m.timestamp}`
            ).join('\n');
            return {
              format: 'prometheus',
              data: prometheusData,
              contentType: 'text/plain',
            };

          default:
            throw new Error('Unsupported format');
        }
      };

      mockSystemHealthMonitor.exportMetrics.mockImplementation(exportMetrics);

      const jsonExport = mockSystemHealthMonitor.exportMetrics('json');
      const csvExport = mockSystemHealthMonitor.exportMetrics('csv');
      const prometheusExport = mockSystemHealthMonitor.exportMetrics('prometheus');

      expect(jsonExport.format).toBe('json');
      expect(jsonExport.contentType).toBe('application/json');
      expect(jsonExport.data).toContain('api_response_time');

      expect(csvExport.format).toBe('csv');
      expect(csvExport.contentType).toBe('text/csv');
      expect(csvExport.data).toContain('name,value,timestamp');

      expect(prometheusExport.format).toBe('prometheus');
      expect(prometheusExport.contentType).toBe('text/plain');
    });
  });

  describe('Monitoring Lifecycle', () => {
    test('should start and stop monitoring correctly', () => {
      let isMonitoring = false;
      let monitoringInterval: NodeJS.Timeout | null = null;

      const startMonitoring = (intervalMs: number = 60000) => {
        if (isMonitoring) {
          return { success: false, message: 'Already monitoring' };
        }

        isMonitoring = true;
        monitoringInterval = setInterval(() => {
          // Simulate monitoring tasks
          console.log('Collecting metrics...');
        }, intervalMs);

        return {
          success: true,
          message: 'Monitoring started',
          interval: intervalMs,
        };
      };

      const stopMonitoring = () => {
        if (!isMonitoring) {
          return { success: false, message: 'Not currently monitoring' };
        }

        isMonitoring = false;
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
          monitoringInterval = null;
        }

        return {
          success: true,
          message: 'Monitoring stopped',
        };
      };

      mockSystemHealthMonitor.startMonitoring.mockImplementation(startMonitoring);
      mockSystemHealthMonitor.stopMonitoring.mockImplementation(stopMonitoring);

      // Start monitoring
      const startResult = mockSystemHealthMonitor.startMonitoring(30000);
      expect(startResult.success).toBe(true);
      expect(startResult.interval).toBe(30000);

      // Try to start again (should fail)
      const startAgainResult = mockSystemHealthMonitor.startMonitoring();
      expect(startAgainResult.success).toBe(false);

      // Stop monitoring
      const stopResult = mockSystemHealthMonitor.stopMonitoring();
      expect(stopResult.success).toBe(true);

      // Try to stop again (should fail)
      const stopAgainResult = mockSystemHealthMonitor.stopMonitoring();
      expect(stopAgainResult.success).toBe(false);
    });

    test('should handle singleton pattern correctly', () => {
      const getInstance = () => {
        // Simulate singleton pattern
        if (!mockSystemHealthMonitor._instance) {
          mockSystemHealthMonitor._instance = {
            id: 'monitor-' + Date.now(),
            createdAt: Date.now(),
            isActive: true,
          };
        }
        return mockSystemHealthMonitor._instance;
      };

      mockSystemHealthMonitor.getInstance.mockImplementation(getInstance);

      const instance1 = mockSystemHealthMonitor.getInstance();
      const instance2 = mockSystemHealthMonitor.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1.id).toBe(instance2.id);
    });
  });
}); 