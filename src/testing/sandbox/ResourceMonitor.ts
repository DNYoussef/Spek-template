/**
 * ResourceMonitor - Extracted from SandboxTestingFramework
 * Monitors and tracks resource usage in sandbox environments
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import { performance } from 'perf_hooks';

export interface ResourceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network?: {
    bytesReceived: number;
    bytesSent: number;
  };
}

export interface ResourceAlert {
  type: 'cpu' | 'memory' | 'disk';
  severity: 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

export interface ResourceThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
}

export class ResourceMonitor extends EventEmitter {
  /**
   * Monitors and tracks resource usage.
   *
   * Extracted from SandboxTestingFramework (1,213 LOC -> ~200 LOC component).
   * Handles:
   * - Resource usage tracking
   * - Threshold monitoring
   * - Alert generation
   * - Historical metrics
   * - Performance profiling
   */

  private monitoringInterval: NodeJS.Timer | null = null;
  private metricsHistory: ResourceMetrics[] = [];
  private alerts: ResourceAlert[] = [];
  private thresholds: ResourceThresholds;
  private maxHistorySize: number = 1000;
  private intervalMs: number = 1000;
  private isMonitoring: boolean = false;
  private baselineMetrics: ResourceMetrics | null = null;

  constructor(thresholds?: Partial<ResourceThresholds>) {
    super();

    this.thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 85, critical: 95 },
      ...thresholds
    };
  }

  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) {
      return;
    }

    this.intervalMs = intervalMs;
    this.isMonitoring = true;

    // Capture baseline metrics
    this.baselineMetrics = this.captureMetrics();

    this.monitoringInterval = setInterval(() => {
      const metrics = this.captureMetrics();
      this.processMetrics(metrics);
    }, this.intervalMs);

    this.emit('monitoringStarted', { intervalMs });
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    this.emit('monitoringStopped', {
      totalMetrics: this.metricsHistory.length,
      totalAlerts: this.alerts.length
    });
  }

  private captureMetrics(): ResourceMetrics {
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;
    const memPercentage = (memUsed / memTotal) * 100;

    const cpuCores = os.cpus();
    const loadAvg = os.loadavg();

    // Calculate CPU usage
    const cpuUsage = this.calculateCpuUsage(cpuCores);

    // Get heap memory info
    const heapStats = process.memoryUsage();

    const metrics: ResourceMetrics = {
      timestamp: Date.now(),
      cpu: {
        usage: cpuUsage,
        cores: cpuCores.length,
        loadAverage: loadAvg
      },
      memory: {
        total: memTotal,
        used: memUsed,
        free: memFree,
        percentage: memPercentage,
        heapUsed: heapStats.heapUsed,
        heapTotal: heapStats.heapTotal
      },
      disk: {
        // Simplified disk metrics - would need platform-specific implementation
        total: 100 * 1024 * 1024 * 1024, // 100GB placeholder
        used: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
        free: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
        percentage: 50
      }
    };

    return metrics;
  }

  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times) as Array<keyof os.CpuTimes>) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  private processMetrics(metrics: ResourceMetrics): void {
    // Store metrics
    this.metricsHistory.push(metrics);

    // Trim history if needed
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }

    // Check thresholds
    this.checkThresholds(metrics);

    // Emit metrics event
    this.emit('metrics', metrics);
  }

  private checkThresholds(metrics: ResourceMetrics): void {
    // Check CPU threshold
    if (metrics.cpu.usage >= this.thresholds.cpu.critical) {
      this.createAlert('cpu', 'critical', metrics.cpu.usage, this.thresholds.cpu.critical);
    } else if (metrics.cpu.usage >= this.thresholds.cpu.warning) {
      this.createAlert('cpu', 'warning', metrics.cpu.usage, this.thresholds.cpu.warning);
    }

    // Check memory threshold
    if (metrics.memory.percentage >= this.thresholds.memory.critical) {
      this.createAlert('memory', 'critical', metrics.memory.percentage, this.thresholds.memory.critical);
    } else if (metrics.memory.percentage >= this.thresholds.memory.warning) {
      this.createAlert('memory', 'warning', metrics.memory.percentage, this.thresholds.memory.warning);
    }

    // Check disk threshold
    if (metrics.disk.percentage >= this.thresholds.disk.critical) {
      this.createAlert('disk', 'critical', metrics.disk.percentage, this.thresholds.disk.critical);
    } else if (metrics.disk.percentage >= this.thresholds.disk.warning) {
      this.createAlert('disk', 'warning', metrics.disk.percentage, this.thresholds.disk.warning);
    }
  }

  private createAlert(
    type: ResourceAlert['type'],
    severity: ResourceAlert['severity'],
    value: number,
    threshold: number
  ): void {
    const alert: ResourceAlert = {
      type,
      severity,
      value,
      threshold,
      timestamp: Date.now(),
      message: `${type.toUpperCase()} usage (${value.toFixed(1)}%) exceeded ${severity} threshold (${threshold}%)`
    };

    this.alerts.push(alert);
    this.emit('alert', alert);
  }

  getLatestMetrics(): ResourceMetrics | undefined {
    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  getMetricsHistory(limit?: number): ResourceMetrics[] {
    if (limit) {
      return this.metricsHistory.slice(-limit);
    }
    return [...this.metricsHistory];
  }

  getAlerts(since?: number): ResourceAlert[] {
    if (since) {
      return this.alerts.filter(a => a.timestamp >= since);
    }
    return [...this.alerts];
  }

  clearHistory(): void {
    this.metricsHistory = [];
    this.alerts = [];
  }

  async profileOperation<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; profile: any }> {
    const startMetrics = this.captureMetrics();
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const endMetrics = this.captureMetrics();

      const profile = {
        name,
        duration: endTime - startTime,
        cpuDelta: endMetrics.cpu.usage - startMetrics.cpu.usage,
        memoryDelta: endMetrics.memory.used - startMetrics.memory.used,
        heapDelta: endMetrics.memory.heapUsed - startMetrics.memory.heapUsed
      };

      this.emit('profileCompleted', profile);
      return { result, profile };
    } catch (error) {
      const endTime = performance.now();
      this.emit('profileFailed', { name, duration: endTime - startTime, error });
      throw error;
    }
  }

  getResourceSummary(): any {
    const latest = this.getLatestMetrics();
    const history = this.getMetricsHistory(60); // Last 60 samples

    if (!latest || history.length === 0) {
      return null;
    }

    // Calculate averages
    const avgCpu = history.reduce((sum, m) => sum + m.cpu.usage, 0) / history.length;
    const avgMem = history.reduce((sum, m) => sum + m.memory.percentage, 0) / history.length;
    const maxCpu = Math.max(...history.map(m => m.cpu.usage));
    const maxMem = Math.max(...history.map(m => m.memory.percentage));

    return {
      current: {
        cpu: latest.cpu.usage,
        memory: latest.memory.percentage,
        disk: latest.disk.percentage
      },
      average: {
        cpu: avgCpu,
        memory: avgMem
      },
      peak: {
        cpu: maxCpu,
        memory: maxMem
      },
      alerts: {
        total: this.alerts.length,
        warning: this.alerts.filter(a => a.severity === 'warning').length,
        critical: this.alerts.filter(a => a.severity === 'critical').length
      },
      monitoring: this.isMonitoring,
      historySize: this.metricsHistory.length
    };
  }

  setThresholds(thresholds: Partial<ResourceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.emit('thresholdsUpdated', this.thresholds);
  }
}