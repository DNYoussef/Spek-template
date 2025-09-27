import { EventEmitter } from 'events';
import { LangroidMemoryBackend, MemoryStats } from './LangroidMemoryBackend';

/**
 * Memory Metrics for Langroid Memory Backend
 * Comprehensive performance monitoring and analytics for memory operations
 * with real-time metrics, alerting, and historical data tracking.
 */
export interface MetricsConfig {
  enabled: boolean;
  interval?: number;
  historySize?: number;
  alertThresholds?: AlertThresholds;
  exportEnabled?: boolean;
  exportInterval?: number;
}

export interface AlertThresholds {
  memoryUsagePercent: number;
  hitRatePercent: number;
  evictionRatePerMinute: number;
  averageResponseTimeMs: number;
  errorRatePercent: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  memoryStats: MemoryStats;
  operationCounts: OperationCounts;
  responseTimes: ResponseTimes;
  errorRates: ErrorRates;
  throughput: ThroughputMetrics;
}

export interface OperationCounts {
  stores: number;
  retrieves: number;
  queries: number;
  removes: number;
  evictions: number;
  expirations: number;
}

export interface ResponseTimes {
  store: TimeMetrics;
  retrieve: TimeMetrics;
  query: TimeMetrics;
  remove: TimeMetrics;
}

export interface TimeMetrics {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface ErrorRates {
  storeErrors: number;
  retrieveErrors: number;
  queryErrors: number;
  removeErrors: number;
  totalErrors: number;
  errorRate: number;
}

export interface ThroughputMetrics {
  operationsPerSecond: number;
  bytesPerSecond: number;
  queriesPerSecond: number;
  cacheHitRate: number;
}

export interface Alert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

export class MemoryMetrics extends EventEmitter {
  private static readonly DEFAULT_INTERVAL = 10 * 1000; // 10 seconds
  private static readonly DEFAULT_HISTORY_SIZE = 1000;
  private static readonly DEFAULT_EXPORT_INTERVAL = 60 * 1000; // 1 minute

  private static readonly DEFAULT_THRESHOLDS: AlertThresholds = {
    memoryUsagePercent: 85,
    hitRatePercent: 70,
    evictionRatePerMinute: 100,
    averageResponseTimeMs: 100,
    errorRatePercent: 5
  };

  private config: Required<MetricsConfig>;
  private memoryBackend: LangroidMemoryBackend;

  private metricsHistory: PerformanceMetrics[] = [];
  private currentMetrics: PerformanceMetrics;
  private operationTimings: Map<string, number[]> = new Map();
  private operationCounts: OperationCounts;
  private errorCounts: ErrorRates;

  private metricsTimer?: NodeJS.Timeout;
  private exportTimer?: NodeJS.Timeout;

  private lastMetricsTime: number = 0;
  private alerts: Alert[] = [];

  constructor(
    memoryBackend: LangroidMemoryBackend,
    config?: Partial<MetricsConfig>
  ) {
    super();

    this.memoryBackend = memoryBackend;

    this.config = {
      enabled: config?.enabled ?? true,
      interval: config?.interval ?? MemoryMetrics.DEFAULT_INTERVAL,
      historySize: config?.historySize ?? MemoryMetrics.DEFAULT_HISTORY_SIZE,
      alertThresholds: config?.alertThresholds ?? MemoryMetrics.DEFAULT_THRESHOLDS,
      exportEnabled: config?.exportEnabled ?? false,
      exportInterval: config?.exportInterval ?? MemoryMetrics.DEFAULT_EXPORT_INTERVAL
    };

    this.initializeMetrics();
    this.setupEventListeners();

    if (this.config.enabled) {
      this.startMetricsCollection();
    }
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get metrics history
   */
  public getMetricsHistory(count?: number): PerformanceMetrics[] {
    const history = [...this.metricsHistory];
    return count ? history.slice(-count) : history;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    return this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);
  }

  /**
   * Get aggregated metrics over time period
   */
  public getAggregatedMetrics(periodMs: number): PerformanceMetrics | null {
    const now = Date.now();
    const cutoffTime = now - periodMs;

    const relevantMetrics = this.metricsHistory.filter(
      m => m.timestamp > cutoffTime
    );

    if (relevantMetrics.length === 0) return null;

    return this.aggregateMetrics(relevantMetrics);
  }

  /**
   * Record operation timing
   */
  public recordOperationTime(operation: string, durationMs: number): void {
    if (!this.config.enabled) return;

    if (!this.operationTimings.has(operation)) {
      this.operationTimings.set(operation, []);
    }

    const timings = this.operationTimings.get(operation)!;
    timings.push(durationMs);

    // Keep only recent timings (last 1000)
    if (timings.length > 1000) {
      timings.splice(0, timings.length - 1000);
    }
  }

  /**
   * Record operation count
   */
  public recordOperation(operation: keyof OperationCounts): void {
    if (!this.config.enabled) return;

    this.operationCounts[operation]++;
  }

  /**
   * Record error
   */
  public recordError(operation: string): void {
    if (!this.config.enabled) return;

    switch (operation) {
      case 'store':
        this.errorCounts.storeErrors++;
        break;
      case 'retrieve':
        this.errorCounts.retrieveErrors++;
        break;
      case 'query':
        this.errorCounts.queryErrors++;
        break;
      case 'remove':
        this.errorCounts.removeErrors++;
        break;
    }

    this.errorCounts.totalErrors++;
  }

  /**
   * Generate performance report
   */
  public generateReport(periodMs: number = 60 * 60 * 1000): string {
    const aggregated = this.getAggregatedMetrics(periodMs);
    if (!aggregated) return 'No metrics available for the specified period.';

    const report = [
      '=== Memory Performance Report ===',
      `Period: ${periodMs / 1000} seconds`,
      `Generated: ${new Date().toISOString()}`,
      '',
      '--- Memory Usage ---',
      `Used: ${(aggregated.memoryStats.usedSize / 1024 / 1024).toFixed(2)} MB`,
      `Available: ${(aggregated.memoryStats.availableSize / 1024 / 1024).toFixed(2)} MB`,
      `Usage: ${((aggregated.memoryStats.usedSize / aggregated.memoryStats.totalSize) * 100).toFixed(1)}%`,
      `Entries: ${aggregated.memoryStats.entryCount}`,
      '',
      '--- Performance ---',
      `Hit Rate: ${(aggregated.memoryStats.hitRate * 100).toFixed(1)}%`,
      `Throughput: ${aggregated.throughput.operationsPerSecond.toFixed(1)} ops/sec`,
      `Query Rate: ${aggregated.throughput.queriesPerSecond.toFixed(1)} queries/sec`,
      `Data Rate: ${(aggregated.throughput.bytesPerSecond / 1024).toFixed(1)} KB/sec`,
      '',
      '--- Response Times ---',
      `Store: ${aggregated.responseTimes.store.avg.toFixed(2)}ms avg, ${aggregated.responseTimes.store.p95.toFixed(2)}ms p95`,
      `Retrieve: ${aggregated.responseTimes.retrieve.avg.toFixed(2)}ms avg, ${aggregated.responseTimes.retrieve.p95.toFixed(2)}ms p95`,
      `Query: ${aggregated.responseTimes.query.avg.toFixed(2)}ms avg, ${aggregated.responseTimes.query.p95.toFixed(2)}ms p95`,
      '',
      '--- Error Rates ---',
      `Error Rate: ${(aggregated.errorRates.errorRate * 100).toFixed(2)}%`,
      `Total Errors: ${aggregated.errorRates.totalErrors}`,
      '',
      '--- Operations ---',
      `Stores: ${aggregated.operationCounts.stores}`,
      `Retrieves: ${aggregated.operationCounts.retrieves}`,
      `Queries: ${aggregated.operationCounts.queries}`,
      `Evictions: ${aggregated.operationCounts.evictions}`,
      ''
    ];

    const activeAlerts = this.getActiveAlerts();
    if (activeAlerts.length > 0) {
      report.push('--- Active Alerts ---');
      for (const alert of activeAlerts) {
        report.push(`${alert.type.toUpperCase()}: ${alert.message}`);
      }
    }

    return report.join('\n');
  }

  /**
   * Reset metrics
   */
  public reset(): void {
    this.initializeMetrics();
    this.metricsHistory = [];
    this.operationTimings.clear();
    this.alerts = [];

    this.emit('metrics-reset');
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enabled && !this.metricsTimer) {
      this.startMetricsCollection();
    } else if (!this.config.enabled && this.metricsTimer) {
      this.stopMetricsCollection();
    }

    this.emit('config-updated', this.config);
  }

  /**
   * Shutdown metrics collection
   */
  public shutdown(): void {
    this.stopMetricsCollection();
    this.removeAllListeners();

    this.emit('shutdown');
  }

  // Private methods

  private initializeMetrics(): void {
    this.operationCounts = {
      stores: 0,
      retrieves: 0,
      queries: 0,
      removes: 0,
      evictions: 0,
      expirations: 0
    };

    this.errorCounts = {
      storeErrors: 0,
      retrieveErrors: 0,
      queryErrors: 0,
      removeErrors: 0,
      totalErrors: 0,
      errorRate: 0
    };

    this.currentMetrics = this.createEmptyMetrics();
    this.lastMetricsTime = Date.now();
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      memoryStats: {
        totalSize: 0,
        usedSize: 0,
        availableSize: 0,
        entryCount: 0,
        hitRate: 0,
        evictionCount: 0
      },
      operationCounts: { ...this.operationCounts },
      responseTimes: {
        store: this.createEmptyTimeMetrics(),
        retrieve: this.createEmptyTimeMetrics(),
        query: this.createEmptyTimeMetrics(),
        remove: this.createEmptyTimeMetrics()
      },
      errorRates: { ...this.errorCounts },
      throughput: {
        operationsPerSecond: 0,
        bytesPerSecond: 0,
        queriesPerSecond: 0,
        cacheHitRate: 0
      }
    };
  }

  private createEmptyTimeMetrics(): TimeMetrics {
    return {
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0
    };
  }

  private setupEventListeners(): void {
    this.memoryBackend.on('stored', () => this.recordOperation('stores'));
    this.memoryBackend.on('retrieved', () => this.recordOperation('retrieves'));
    this.memoryBackend.on('removed', () => this.recordOperation('removes'));
    this.memoryBackend.on('expired', () => this.recordOperation('expirations'));

    this.memoryBackend.on('error', (data) => {
      if (data.operation) {
        this.recordError(data.operation);
      }
    });
  }

  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.interval);

    if (this.config.exportEnabled) {
      this.exportTimer = setInterval(() => {
        this.exportMetrics();
      }, this.config.exportInterval);
    }
  }

  private stopMetricsCollection(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = undefined;
    }
  }

  private collectMetrics(): void {
    try {
      const now = Date.now();
      const timeSinceLastCollection = now - this.lastMetricsTime;

      // Get memory stats
      const memoryStats = this.memoryBackend.getStats();

      // Calculate response times
      const responseTimes = this.calculateResponseTimes();

      // Calculate error rates
      this.calculateErrorRates();

      // Calculate throughput
      const throughput = this.calculateThroughput(timeSinceLastCollection);

      // Create metrics snapshot
      this.currentMetrics = {
        timestamp: now,
        memoryStats,
        operationCounts: { ...this.operationCounts },
        responseTimes,
        errorRates: { ...this.errorCounts },
        throughput
      };

      // Add to history
      this.metricsHistory.push({ ...this.currentMetrics });

      // Trim history
      if (this.metricsHistory.length > this.config.historySize) {
        this.metricsHistory.splice(0, this.metricsHistory.length - this.config.historySize);
      }

      // Check for alerts
      this.checkAlerts();

      // Reset counters for next period
      this.resetCounters();
      this.lastMetricsTime = now;

      this.emit('metrics-collected', this.currentMetrics);

    } catch (error) {
      this.emit('error', { operation: 'collectMetrics', error });
    }
  }

  private calculateResponseTimes(): ResponseTimes {
    return {
      store: this.calculateTimeMetrics('store'),
      retrieve: this.calculateTimeMetrics('retrieve'),
      query: this.calculateTimeMetrics('query'),
      remove: this.calculateTimeMetrics('remove')
    };
  }

  private calculateTimeMetrics(operation: string): TimeMetrics {
    const timings = this.operationTimings.get(operation) || [];

    if (timings.length === 0) {
      return this.createEmptyTimeMetrics();
    }

    const sorted = [...timings].sort((a, b) => a - b);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: timings.reduce((sum, t) => sum + t, 0) / timings.length,
      p50: this.getPercentile(sorted, 0.5),
      p90: this.getPercentile(sorted, 0.9),
      p95: this.getPercentile(sorted, 0.95),
      p99: this.getPercentile(sorted, 0.99)
    };
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private calculateErrorRates(): void {
    const totalOperations = Object.values(this.operationCounts)
      .reduce((sum, count) => sum + count, 0);

    this.errorCounts.errorRate = totalOperations > 0
      ? this.errorCounts.totalErrors / totalOperations
      : 0;
  }

  private calculateThroughput(timePeriodMs: number): ThroughputMetrics {
    const timePeriodSec = timePeriodMs / 1000;

    const totalOperations = Object.values(this.operationCounts)
      .reduce((sum, count) => sum + count, 0);

    const operationsPerSecond = timePeriodSec > 0 ? totalOperations / timePeriodSec : 0;
    const queriesPerSecond = timePeriodSec > 0 ? this.operationCounts.queries / timePeriodSec : 0;

    // Estimate bytes per second (simplified)
    const avgEntrySize = 1024; // Assume 1KB average entry size
    const bytesPerSecond = operationsPerSecond * avgEntrySize;

    return {
      operationsPerSecond,
      bytesPerSecond,
      queriesPerSecond,
      cacheHitRate: this.memoryBackend.getStats().hitRate
    };
  }

  private checkAlerts(): void {
    const now = Date.now();
    const thresholds = this.config.alertThresholds;

    // Memory usage alert
    const memoryUsagePercent = (this.currentMetrics.memoryStats.usedSize / this.currentMetrics.memoryStats.totalSize) * 100;
    if (memoryUsagePercent > thresholds.memoryUsagePercent) {
      this.createAlert('critical', 'memory_usage', memoryUsagePercent, thresholds.memoryUsagePercent,
        `Memory usage at ${memoryUsagePercent.toFixed(1)}% exceeds threshold`);
    }

    // Hit rate alert
    const hitRatePercent = this.currentMetrics.memoryStats.hitRate * 100;
    if (hitRatePercent < thresholds.hitRatePercent) {
      this.createAlert('warning', 'hit_rate', hitRatePercent, thresholds.hitRatePercent,
        `Hit rate at ${hitRatePercent.toFixed(1)}% below threshold`);
    }

    // Error rate alert
    const errorRatePercent = this.currentMetrics.errorRates.errorRate * 100;
    if (errorRatePercent > thresholds.errorRatePercent) {
      this.createAlert('critical', 'error_rate', errorRatePercent, thresholds.errorRatePercent,
        `Error rate at ${errorRatePercent.toFixed(2)}% exceeds threshold`);
    }

    // Response time alert
    const avgResponseTime = this.currentMetrics.responseTimes.store.avg;
    if (avgResponseTime > thresholds.averageResponseTimeMs) {
      this.createAlert('warning', 'response_time', avgResponseTime, thresholds.averageResponseTimeMs,
        `Average response time ${avgResponseTime.toFixed(2)}ms exceeds threshold`);
    }
  }

  private createAlert(type: 'warning' | 'critical', metric: string, value: number, threshold: number, message: string): void {
    const alert: Alert = {
      type,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      message
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp > oneHourAgo);

    this.emit('alert', alert);
  }

  private resetCounters(): void {
    // Reset operation counts
    Object.keys(this.operationCounts).forEach(key => {
      (this.operationCounts as any)[key] = 0;
    });

    // Reset error counts
    Object.keys(this.errorCounts).forEach(key => {
      (this.errorCounts as any)[key] = 0;
    });

    // Clear operation timings for current period
    this.operationTimings.clear();
  }

  private aggregateMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    // Simplified aggregation - in production, this would be more sophisticated
    const latest = metrics[metrics.length - 1];
    const aggregated = { ...latest };

    // Average certain metrics
    aggregated.memoryStats.hitRate = metrics.reduce((sum, m) => sum + m.memoryStats.hitRate, 0) / metrics.length;
    aggregated.throughput.operationsPerSecond = metrics.reduce((sum, m) => sum + m.throughput.operationsPerSecond, 0) / metrics.length;

    return aggregated;
  }

  private exportMetrics(): void {
    const exportData = {
      timestamp: Date.now(),
      current: this.currentMetrics,
      history: this.metricsHistory.slice(-100), // Last 100 entries
      alerts: this.getActiveAlerts()
    };

    this.emit('metrics-export', exportData);
  }
}

export default MemoryMetrics;