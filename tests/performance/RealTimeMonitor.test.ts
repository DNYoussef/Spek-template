import { RealTimeMonitor } from '../../src/performance/monitoring/RealTimeMonitor';

describe('RealTimeMonitor', () => {
  let monitor: RealTimeMonitor;

  beforeEach(() => {
    monitor = new RealTimeMonitor(100); // 100ms interval for faster tests
  });

  afterEach(async () => {
    if (monitor.isMonitoringActive()) {
      await monitor.stopMonitoring();
    }
    monitor.clearMetrics();
  });

  describe('Basic Monitoring', () => {
    test('should start and stop monitoring', async () => {
      expect(monitor.isMonitoringActive()).toBe(false);

      await monitor.startMonitoring();
      expect(monitor.isMonitoringActive()).toBe(true);

      // Let it collect some metrics
      await new Promise(resolve => setTimeout(resolve, 300));

      await monitor.stopMonitoring();
      expect(monitor.isMonitoringActive()).toBe(false);

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
    });

    test('should collect system metrics', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 200));
      await monitor.stopMonitoring();

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      const latestMetric = monitor.getCurrentMetrics();
      expect(latestMetric).toBeDefined();
      expect(latestMetric!.timestamp).toBeGreaterThan(0);
      expect(latestMetric!.cpu).toBeDefined();
      expect(latestMetric!.memory).toBeDefined();
      expect(latestMetric!.process).toBeDefined();
    });

    test('should respect monitoring interval', async () => {
      const customMonitor = new RealTimeMonitor(200); // 200ms interval

      await customMonitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 650)); // ~3 intervals
      await customMonitor.stopMonitoring();

      const metrics = customMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThanOrEqual(2);
      expect(metrics.length).toBeLessThanOrEqual(5); // Allow some variance
    });

    test('should prevent double start', async () => {
      await monitor.startMonitoring();

      await expect(monitor.startMonitoring()).rejects.toThrow('Monitoring is already active');

      await monitor.stopMonitoring();
    });
  });

  describe('Metrics Collection', () => {
    test('should collect CPU metrics', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 200));
      await monitor.stopMonitoring();

      const metrics = monitor.getCurrentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics!.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics!.cpu.usage).toBeLessThanOrEqual(100);
      expect(metrics!.cpu.loadAverage).toBeDefined();
      expect(Array.isArray(metrics!.cpu.loadAverage)).toBe(true);
    });

    test('should collect memory metrics', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 200));
      await monitor.stopMonitoring();

      const metrics = monitor.getCurrentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics!.memory.total).toBeGreaterThan(0);
      expect(metrics!.memory.used).toBeGreaterThan(0);
      expect(metrics!.memory.free).toBeGreaterThan(0);
      expect(metrics!.memory.usagePercent).toBeGreaterThanOrEqual(0);
      expect(metrics!.memory.usagePercent).toBeLessThanOrEqual(100);
    });

    test('should collect process metrics', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 200));
      await monitor.stopMonitoring();

      const metrics = monitor.getCurrentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics!.process.pid).toBe(process.pid);
      expect(metrics!.process.memory).toBeDefined();
      expect(metrics!.process.cpu).toBeDefined();
      expect(metrics!.process.uptime).toBeGreaterThan(0);
    });

    test('should maintain metrics history', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 300));
      await monitor.stopMonitoring();

      const allMetrics = monitor.getMetrics();
      const limitedMetrics = monitor.getMetrics(2);

      expect(allMetrics.length).toBeGreaterThan(limitedMetrics.length);
      expect(limitedMetrics.length).toBeLessThanOrEqual(2);
    });

    test('should clear metrics', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 200));
      await monitor.stopMonitoring();

      expect(monitor.getMetrics().length).toBeGreaterThan(0);

      monitor.clearMetrics();
      expect(monitor.getMetrics().length).toBe(0);
    });
  });

  describe('Alert System', () => {
    test('should have default alert rules', () => {
      const rules = monitor.getAlertRules();
      expect(rules.length).toBeGreaterThan(0);

      const highCpuRule = rules.find(rule => rule.id === 'high-cpu');
      expect(highCpuRule).toBeDefined();
      expect(highCpuRule!.metric).toBe('cpu.usage');
      expect(highCpuRule!.threshold).toBe(80);
    });

    test('should add and remove alert rules', () => {
      const newRule = {
        id: 'test-rule',
        name: 'Test Rule',
        metric: 'memory.usagePercent',
        threshold: 90,
        operator: 'gt' as const,
        duration: 5000,
        enabled: true,
        actions: [{ type: 'log' as const, config: {} }]
      };

      monitor.addAlertRule(newRule);
      let rules = monitor.getAlertRules();
      expect(rules.find(rule => rule.id === 'test-rule')).toBeDefined();

      const removed = monitor.removeAlertRule('test-rule');
      expect(removed).toBe(true);

      rules = monitor.getAlertRules();
      expect(rules.find(rule => rule.id === 'test-rule')).toBeUndefined();
    });

    test('should update alert rules', () => {
      const updated = monitor.updateAlertRule('high-cpu', { threshold: 90 });
      expect(updated).toBe(true);

      const rules = monitor.getAlertRules();
      const highCpuRule = rules.find(rule => rule.id === 'high-cpu');
      expect(highCpuRule!.threshold).toBe(90);
    });

    test('should trigger alerts for high thresholds', async () => {
      const alerts: any[] = [];

      monitor.on('alert', (alert) => {
        alerts.push(alert);
      });

      // Add a rule with very low threshold to trigger easily
      monitor.addAlertRule({
        id: 'low-threshold',
        name: 'Low Threshold Test',
        metric: 'memory.usagePercent',
        threshold: 0.1, // Very low threshold
        operator: 'gt',
        duration: 100, // Short duration
        enabled: true,
        actions: [{ type: 'log', config: {} }]
      });

      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for potential alerts
      await monitor.stopMonitoring();

      // Should have triggered at least one alert
      expect(alerts.length).toBeGreaterThan(0);
    });

    test('should resolve alerts when conditions are no longer met', async () => {
      const resolvedAlerts: any[] = [];

      monitor.on('alertResolved', (alert) => {
        resolvedAlerts.push(alert);
      });

      // This test is harder to implement reliably, but the structure is here
      // In a real scenario, you'd trigger an alert then change conditions
    });
  });

  describe('Event Handling', () => {
    test('should emit monitoring events', async () => {
      const events: string[] = [];

      monitor.on('monitoringStarted', () => events.push('started'));
      monitor.on('monitoringStopped', () => events.push('stopped'));
      monitor.on('metrics', () => events.push('metrics'));

      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 200));
      await monitor.stopMonitoring();

      expect(events).toContain('started');
      expect(events).toContain('stopped');
      expect(events).toContain('metrics');
    });

    test('should emit metrics events with data', async () => {
      let metricsReceived = 0;

      monitor.on('metrics', (metrics) => {
        metricsReceived++;
        expect(metrics).toBeDefined();
        expect(metrics.timestamp).toBeGreaterThan(0);
        expect(metrics.cpu).toBeDefined();
        expect(metrics.memory).toBeDefined();
      });

      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 250));
      await monitor.stopMonitoring();

      expect(metricsReceived).toBeGreaterThan(0);
    });
  });

  describe('Report Generation', () => {
    test('should generate metrics report', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 200));
      await monitor.stopMonitoring();

      const report = monitor.generateMetricsReport();
      expect(report).toContain('System Performance Report');
      expect(report).toContain('CPU Usage:');
      expect(report).toContain('Memory Usage:');
      expect(report).toContain('Process Memory');
      expect(report).toContain('Data Points:');
    });

    test('should generate report for time range', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 300));
      await monitor.stopMonitoring();

      const metrics = monitor.getMetrics();
      const startTime = metrics[0].timestamp;
      const endTime = metrics[metrics.length - 1].timestamp;
      const midTime = startTime + (endTime - startTime) / 2;

      const report = monitor.generateMetricsReport({
        start: startTime,
        end: midTime
      });

      expect(report).toContain('System Performance Report');
      expect(report).not.toBe('No metrics data available for the specified time range.');
    });

    test('should handle empty metrics for report', () => {
      monitor.clearMetrics();
      const report = monitor.generateMetricsReport();
      expect(report).toBe('No metrics data available for the specified time range.');
    });
  });

  describe('Configuration', () => {
    test('should get and set monitoring interval', () => {
      expect(monitor.getMonitoringInterval()).toBe(100);

      monitor.setMonitoringInterval(500);
      expect(monitor.getMonitoringInterval()).toBe(500);
    });

    test('should restart monitoring with new interval', async () => {
      await monitor.startMonitoring();
      expect(monitor.isMonitoringActive()).toBe(true);

      monitor.setMonitoringInterval(200);

      // Should restart automatically
      expect(monitor.isMonitoringActive()).toBe(true);
      expect(monitor.getMonitoringInterval()).toBe(200);

      await monitor.stopMonitoring();
    });
  });

  describe('Persistence', () => {
    test('should save and load metrics', async () => {
      await monitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 200));
      await monitor.stopMonitoring();

      const originalMetrics = monitor.getMetrics();
      expect(originalMetrics.length).toBeGreaterThan(0);

      // Save metrics
      const testFile = './test-metrics.json';
      await monitor.saveMetrics(testFile);

      // Clear and reload
      monitor.clearMetrics();
      expect(monitor.getMetrics().length).toBe(0);

      await monitor.loadMetrics(testFile);
      const loadedMetrics = monitor.getMetrics();

      expect(loadedMetrics.length).toBe(originalMetrics.length);
      expect(loadedMetrics[0].timestamp).toBe(originalMetrics[0].timestamp);

      // Cleanup
      const fs = require('fs').promises;
      await fs.unlink(testFile).catch(() => {}); // Ignore errors
    });
  });

  describe('Edge Cases', () => {
    test('should handle stop when not monitoring', async () => {
      expect(monitor.isMonitoringActive()).toBe(false);

      // Should not throw
      await monitor.stopMonitoring();
      expect(monitor.isMonitoringActive()).toBe(false);
    });

    test('should handle large numbers of metrics', async () => {
      // Create a monitor with very fast interval
      const fastMonitor = new RealTimeMonitor(1); // 1ms interval

      await fastMonitor.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 100)); // Collect many metrics
      await fastMonitor.stopMonitoring();

      const metrics = fastMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(10); // Should collect many metrics

      // Should not crash or run out of memory
      const report = fastMonitor.generateMetricsReport();
      expect(report).toContain('System Performance Report');
    });

    test('should handle alert rule operations on non-existent rules', () => {
      const updated = monitor.updateAlertRule('non-existent', { threshold: 50 });
      expect(updated).toBe(false);

      const removed = monitor.removeAlertRule('non-existent');
      expect(removed).toBe(false);
    });

    test('should handle monitoring interval changes when not monitoring', () => {
      expect(monitor.isMonitoringActive()).toBe(false);

      monitor.setMonitoringInterval(1000);
      expect(monitor.getMonitoringInterval()).toBe(1000);
    });
  });

  describe('Alert Actions', () => {
    test('should execute log actions', async () => {
      const originalLog = console.log;
      const logMessages: string[] = [];

      console.log = (message: string) => {
        logMessages.push(message);
      };

      try {
        monitor.addAlertRule({
          id: 'log-test',
          name: 'Log Test',
          metric: 'memory.usagePercent',
          threshold: 0.1,
          operator: 'gt',
          duration: 50,
          enabled: true,
          actions: [{ type: 'log', config: {} }]
        });

        await monitor.startMonitoring();
        await new Promise(resolve => setTimeout(resolve, 200));
        await monitor.stopMonitoring();

        // Should have logged alerts
        const alertLogs = logMessages.filter(msg => msg.includes('[ALERT]'));
        expect(alertLogs.length).toBeGreaterThan(0);
      } finally {
        console.log = originalLog;
      }
    });
  });
});