import { EventEmitter } from 'events';

export interface MigrationMetrics {
  migrationId: string;
  phase: string;
  startTime: Date;
  currentTime: Date;
  elapsedMs: number;
  estimatedRemainingMs: number;
  progressPercentage: number;
  throughputPerSecond: number;
  errorCount: number;
  warningCount: number;
  successCount: number;
  activeConnections: number;
  memoryUsageMB: number;
  cpuUsagePercentage: number;
  networkLatencyMs: number;
  systemLoad: number;
  healthScore: number;
  customMetrics: Record<string, number>;
}

export interface MigrationHealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  lastCheck: Date;
  responseTimeMs: number;
  errorRate: number;
  details: Record<string, any>;
  dependencies: string[];
}

export interface MonitoringThresholds {
  errorRateThreshold: number;
  latencyThresholdMs: number;
  memoryThresholdMB: number;
  cpuThresholdPercentage: number;
  healthScoreThreshold: number;
  throughputThresholdPerSecond: number;
}

export interface MonitoringConfiguration {
  metricsCollectionIntervalMs: number;
  healthCheckIntervalMs: number;
  alertingEnabled: boolean;
  retentionPeriodHours: number;
  aggregationWindowMs: number;
  enableRealTimeMetrics: boolean;
  enablePredictiveAnalysis: boolean;
  thresholds: MonitoringThresholds;
  customCollectors: string[];
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface AggregatedMetrics {
  metric: string;
  timeWindow: string;
  average: number;
  minimum: number;
  maximum: number;
  percentile50: number;
  percentile95: number;
  percentile99: number;
  standardDeviation: number;
  dataPoints: TimeSeriesDataPoint[];
}

export abstract class MetricsCollector {
  abstract collectMetrics(migrationId: string): Promise<Partial<MigrationMetrics>>;
  abstract getCollectorName(): string;
  abstract isEnabled(): boolean;
}

export class SystemMetricsCollector extends MetricsCollector {
  async collectMetrics(migrationId: string): Promise<Partial<MigrationMetrics>> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      cpuUsagePercentage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000 * 100),
      systemLoad: require('os').loadavg()[0]
    };
  }

  getCollectorName(): string {
    return 'SystemMetricsCollector';
  }

  isEnabled(): boolean {
    return true;
  }
}

export class NetworkMetricsCollector extends MetricsCollector {
  private latencyHistory: number[] = [];

  async collectMetrics(migrationId: string): Promise<Partial<MigrationMetrics>> {
    const startTime = Date.now();

    try {
      await this.pingHealthEndpoint();
      const latency = Date.now() - startTime;
      this.latencyHistory.push(latency);

      if (this.latencyHistory.length > 100) {
        this.latencyHistory.shift();
      }

      return {
        networkLatencyMs: latency,
        customMetrics: {
          averageLatencyMs: this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length,
          latencyVariance: this.calculateVariance(this.latencyHistory)
        }
      };
    } catch (error) {
      return {
        networkLatencyMs: -1,
        customMetrics: {
          networkError: 1
        }
      };
    }
  }

  private async pingHealthEndpoint(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  getCollectorName(): string {
    return 'NetworkMetricsCollector';
  }

  isEnabled(): boolean {
    return true;
  }
}

export class MigrationProgressCollector extends MetricsCollector {
  private migrationStates = new Map<string, any>();

  async collectMetrics(migrationId: string): Promise<Partial<MigrationMetrics>> {
    const state = this.migrationStates.get(migrationId);
    if (!state) {
      return {};
    }

    const elapsedMs = Date.now() - state.startTime;
    const progressPercentage = this.calculateProgress(state);
    const estimatedRemainingMs = this.estimateRemainingTime(progressPercentage, elapsedMs);
    const throughputPerSecond = this.calculateThroughput(state);

    return {
      elapsedMs,
      progressPercentage,
      estimatedRemainingMs,
      throughputPerSecond,
      errorCount: state.errorCount || 0,
      warningCount: state.warningCount || 0,
      successCount: state.successCount || 0
    };
  }

  updateMigrationState(migrationId: string, stateUpdate: any): void {
    const currentState = this.migrationStates.get(migrationId) || {};
    this.migrationStates.set(migrationId, { ...currentState, ...stateUpdate });
  }

  private calculateProgress(state: any): number {
    if (!state.totalSteps) return 0;
    return Math.min(100, (state.completedSteps / state.totalSteps) * 100);
  }

  private estimateRemainingTime(progressPercentage: number, elapsedMs: number): number {
    if (progressPercentage <= 0) return -1;
    const totalEstimatedMs = (elapsedMs / progressPercentage) * 100;
    return Math.max(0, totalEstimatedMs - elapsedMs);
  }

  private calculateThroughput(state: any): number {
    const elapsedSeconds = (Date.now() - state.startTime) / 1000;
    if (elapsedSeconds <= 0) return 0;
    return (state.completedSteps || 0) / elapsedSeconds;
  }

  getCollectorName(): string {
    return 'MigrationProgressCollector';
  }

  isEnabled(): boolean {
    return true;
  }
}

export class MigrationMonitor extends EventEmitter {
  private collectors: Map<string, MetricsCollector> = new Map();
  private metricsHistory: Map<string, MigrationMetrics[]> = new Map();
  private healthChecks: Map<string, MigrationHealthCheck[]> = new Map();
  private aggregatedMetrics: Map<string, AggregatedMetrics[]> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timer> = new Map();
  private configuration: MonitoringConfiguration;

  constructor(configuration: MonitoringConfiguration) {
    super();
    this.configuration = configuration;
    this.initializeDefaultCollectors();
  }

  private initializeDefaultCollectors(): void {
    this.registerCollector(new SystemMetricsCollector());
    this.registerCollector(new NetworkMetricsCollector());
    this.registerCollector(new MigrationProgressCollector());
  }

  registerCollector(collector: MetricsCollector): void {
    this.collectors.set(collector.getCollectorName(), collector);
  }

  startMonitoring(migrationId: string): void {
    if (this.monitoringIntervals.has(migrationId)) {
      throw new Error(`Monitoring already started for migration ${migrationId}`);
    }

    const metricsInterval = setInterval(async () => {
      await this.collectAndStoreMetrics(migrationId);
    }, this.configuration.metricsCollectionIntervalMs);

    const healthInterval = setInterval(async () => {
      await this.performHealthChecks(migrationId);
    }, this.configuration.healthCheckIntervalMs);

    this.monitoringIntervals.set(migrationId, metricsInterval);
    this.monitoringIntervals.set(`${migrationId}_health`, healthInterval);

    this.emit('monitoringStarted', { migrationId });
  }

  stopMonitoring(migrationId: string): void {
    const metricsInterval = this.monitoringIntervals.get(migrationId);
    const healthInterval = this.monitoringIntervals.get(`${migrationId}_health`);

    if (metricsInterval) {
      clearInterval(metricsInterval);
      this.monitoringIntervals.delete(migrationId);
    }

    if (healthInterval) {
      clearInterval(healthInterval);
      this.monitoringIntervals.delete(`${migrationId}_health`);
    }

    this.emit('monitoringStopped', { migrationId });
  }

  private async collectAndStoreMetrics(migrationId: string): Promise<void> {
    try {
      const baseMetrics: MigrationMetrics = {
        migrationId,
        phase: 'unknown',
        startTime: new Date(),
        currentTime: new Date(),
        elapsedMs: 0,
        estimatedRemainingMs: -1,
        progressPercentage: 0,
        throughputPerSecond: 0,
        errorCount: 0,
        warningCount: 0,
        successCount: 0,
        activeConnections: 0,
        memoryUsageMB: 0,
        cpuUsagePercentage: 0,
        networkLatencyMs: 0,
        systemLoad: 0,
        healthScore: 100,
        customMetrics: {}
      };

      for (const [name, collector] of this.collectors) {
        if (collector.isEnabled()) {
          try {
            const collectedMetrics = await collector.collectMetrics(migrationId);
            Object.assign(baseMetrics, collectedMetrics);
          } catch (error) {
            this.emit('collectorError', { collectorName: name, error, migrationId });
          }
        }
      }

      baseMetrics.healthScore = this.calculateHealthScore(baseMetrics);
      this.storeMetrics(migrationId, baseMetrics);

      if (this.configuration.enableRealTimeMetrics) {
        this.emit('metricsCollected', { migrationId, metrics: baseMetrics });
      }

      await this.checkThresholds(migrationId, baseMetrics);

      if (this.configuration.enablePredictiveAnalysis) {
        await this.performPredictiveAnalysis(migrationId, baseMetrics);
      }

    } catch (error) {
      this.emit('metricsCollectionError', { migrationId, error });
    }
  }

  private calculateHealthScore(metrics: MigrationMetrics): number {
    let score = 100;
    const thresholds = this.configuration.thresholds;

    if (metrics.errorCount > 0) {
      score -= metrics.errorCount * 5;
    }

    if (metrics.cpuUsagePercentage > thresholds.cpuThresholdPercentage) {
      score -= (metrics.cpuUsagePercentage - thresholds.cpuThresholdPercentage) * 2;
    }

    if (metrics.memoryUsageMB > thresholds.memoryThresholdMB) {
      score -= (metrics.memoryUsageMB - thresholds.memoryThresholdMB) / 100;
    }

    if (metrics.networkLatencyMs > thresholds.latencyThresholdMs) {
      score -= (metrics.networkLatencyMs - thresholds.latencyThresholdMs) / 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private storeMetrics(migrationId: string, metrics: MigrationMetrics): void {
    if (!this.metricsHistory.has(migrationId)) {
      this.metricsHistory.set(migrationId, []);
    }

    const history = this.metricsHistory.get(migrationId)!;
    history.push(metrics);

    const retentionTimestamp = new Date(Date.now() - this.configuration.retentionPeriodHours * 60 * 60 * 1000);
    const filteredHistory = history.filter(m => m.currentTime >= retentionTimestamp);
    this.metricsHistory.set(migrationId, filteredHistory);
  }

  private async performHealthChecks(migrationId: string): Promise<void> {
    const healthChecks: MigrationHealthCheck[] = [];
    const components = ['database', 'messageQueue', 'externalServices', 'loadBalancer'];

    for (const component of components) {
      const healthCheck = await this.performComponentHealthCheck(component, migrationId);
      healthChecks.push(healthCheck);
    }

    if (!this.healthChecks.has(migrationId)) {
      this.healthChecks.set(migrationId, []);
    }

    this.healthChecks.get(migrationId)!.push(...healthChecks);
    this.emit('healthChecksCompleted', { migrationId, healthChecks });
  }

  private async performComponentHealthCheck(component: string, migrationId: string): Promise<MigrationHealthCheck> {
    const startTime = Date.now();

    try {
      await this.simulateHealthCheck(component);

      return {
        component,
        status: 'healthy',
        lastCheck: new Date(),
        responseTimeMs: Date.now() - startTime,
        errorRate: 0,
        details: {
          version: '1.0.0',
          uptime: '99.9%'
        },
        dependencies: []
      };
    } catch (error) {
      return {
        component,
        status: 'critical',
        lastCheck: new Date(),
        responseTimeMs: Date.now() - startTime,
        errorRate: 1,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        dependencies: []
      };
    }
  }

  private async simulateHealthCheck(component: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    if (Math.random() < 0.05) {
      throw new Error(`${component} health check failed`);
    }
  }

  private async checkThresholds(migrationId: string, metrics: MigrationMetrics): Promise<void> {
    const thresholds = this.configuration.thresholds;
    const violations: string[] = [];

    if (metrics.errorCount > 0) {
      violations.push(`Error count exceeded: ${metrics.errorCount}`);
    }

    if (metrics.cpuUsagePercentage > thresholds.cpuThresholdPercentage) {
      violations.push(`CPU usage exceeded: ${metrics.cpuUsagePercentage}%`);
    }

    if (metrics.memoryUsageMB > thresholds.memoryThresholdMB) {
      violations.push(`Memory usage exceeded: ${metrics.memoryUsageMB}MB`);
    }

    if (metrics.networkLatencyMs > thresholds.latencyThresholdMs) {
      violations.push(`Network latency exceeded: ${metrics.networkLatencyMs}ms`);
    }

    if (metrics.healthScore < thresholds.healthScoreThreshold) {
      violations.push(`Health score below threshold: ${metrics.healthScore}`);
    }

    if (violations.length > 0 && this.configuration.alertingEnabled) {
      this.emit('thresholdViolation', {
        migrationId,
        violations,
        metrics,
        severity: this.calculateViolationSeverity(violations)
      });
    }
  }

  private calculateViolationSeverity(violations: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.some(v => v.includes('Error count') || v.includes('Health score'))) {
      return 'critical';
    }
    if (violations.length >= 3) {
      return 'high';
    }
    if (violations.length >= 2) {
      return 'medium';
    }
    return 'low';
  }

  private async performPredictiveAnalysis(migrationId: string, currentMetrics: MigrationMetrics): Promise<void> {
    const history = this.metricsHistory.get(migrationId) || [];
    if (history.length < 10) {
      return;
    }

    const predictions = this.generatePredictions(history, currentMetrics);
    this.emit('predictiveAnalysis', { migrationId, predictions, currentMetrics });
  }

  private generatePredictions(history: MigrationMetrics[], current: MigrationMetrics): any {
    const recentHistory = history.slice(-20);

    const memoryTrend = this.calculateTrend(recentHistory.map(m => m.memoryUsageMB));
    const cpuTrend = this.calculateTrend(recentHistory.map(m => m.cpuUsagePercentage));
    const errorTrend = this.calculateTrend(recentHistory.map(m => m.errorCount));

    return {
      memoryUsagePrediction: current.memoryUsageMB + (memoryTrend * 5),
      cpuUsagePrediction: current.cpuUsagePercentage + (cpuTrend * 5),
      errorCountPrediction: Math.max(0, current.errorCount + (errorTrend * 5)),
      estimatedCompletionTime: this.estimateCompletionTime(recentHistory),
      riskLevel: this.calculateRiskLevel(memoryTrend, cpuTrend, errorTrend)
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private estimateCompletionTime(history: MigrationMetrics[]): Date | null {
    if (history.length === 0) return null;

    const progressValues = history.map(m => m.progressPercentage);
    const timeValues = history.map(m => m.elapsedMs);

    if (progressValues.length < 2) return null;

    const progressTrend = this.calculateTrend(progressValues);
    if (progressTrend <= 0) return null;

    const currentProgress = progressValues[progressValues.length - 1];
    const remainingProgress = 100 - currentProgress;
    const estimatedTimeMs = remainingProgress / progressTrend;

    return new Date(Date.now() + estimatedTimeMs);
  }

  private calculateRiskLevel(memoryTrend: number, cpuTrend: number, errorTrend: number): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = Math.abs(memoryTrend) + Math.abs(cpuTrend) + Math.abs(errorTrend) * 10;

    if (riskScore > 50 || errorTrend > 0.5) return 'critical';
    if (riskScore > 20) return 'high';
    if (riskScore > 10) return 'medium';
    return 'low';
  }

  getLatestMetrics(migrationId: string): MigrationMetrics | null {
    const history = this.metricsHistory.get(migrationId);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  getMetricsHistory(migrationId: string, fromTime?: Date, toTime?: Date): MigrationMetrics[] {
    const history = this.metricsHistory.get(migrationId) || [];

    if (!fromTime && !toTime) {
      return history;
    }

    return history.filter(metrics => {
      const timestamp = metrics.currentTime;
      if (fromTime && timestamp < fromTime) return false;
      if (toTime && timestamp > toTime) return false;
      return true;
    });
  }

  getAggregatedMetrics(migrationId: string, metric: string, windowMs: number): AggregatedMetrics | null {
    const history = this.getMetricsHistory(migrationId);
    if (history.length === 0) return null;

    const windowStart = new Date(Date.now() - windowMs);
    const windowData = history.filter(m => m.currentTime >= windowStart);

    if (windowData.length === 0) return null;

    const values = windowData.map(m => (m as any)[metric]).filter(v => typeof v === 'number');
    if (values.length === 0) return null;

    values.sort((a, b) => a - b);

    return {
      metric,
      timeWindow: `${windowMs}ms`,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      minimum: values[0],
      maximum: values[values.length - 1],
      percentile50: values[Math.floor(values.length * 0.5)],
      percentile95: values[Math.floor(values.length * 0.95)],
      percentile99: values[Math.floor(values.length * 0.99)],
      standardDeviation: this.calculateStandardDeviation(values),
      dataPoints: windowData.map(m => ({
        timestamp: m.currentTime,
        value: (m as any)[metric],
        metadata: { migrationId: m.migrationId, phase: m.phase }
      }))
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  getHealthStatus(migrationId: string): MigrationHealthCheck[] {
    return this.healthChecks.get(migrationId) || [];
  }

  isMonitoring(migrationId: string): boolean {
    return this.monitoringIntervals.has(migrationId);
  }

  getMonitoringConfiguration(): MonitoringConfiguration {
    return { ...this.configuration };
  }

  updateConfiguration(updates: Partial<MonitoringConfiguration>): void {
    this.configuration = { ...this.configuration, ...updates };
    this.emit('configurationUpdated', this.configuration);
  }

  cleanup(): void {
    for (const [migrationId] of this.monitoringIntervals) {
      this.stopMonitoring(migrationId);
    }

    this.metricsHistory.clear();
    this.healthChecks.clear();
    this.aggregatedMetrics.clear();
    this.removeAllListeners();
  }
}