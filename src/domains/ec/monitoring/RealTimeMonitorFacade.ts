/**
 * RealTimeMonitorFacade.ts
 * Simplified facade for real-time-monitor.ts god object
 * Delegates to specialized FSM components using RepositoryBaseFSM
 */

import { EventEmitter } from 'events';
import { RepositoryBaseFSM, RepositoryConfig } from '../../../repository/RepositoryBaseFSM';

export interface MonitoringRule {
  id: string;
  name: string;
  type: 'threshold' | 'anomaly' | 'pattern' | 'trend';
  metric: string;
  condition: string;
  threshold?: number;
  enabled: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface Alert {
  id: string;
  ruleId: string;
  metric: string;
  value: number;
  threshold?: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  resolvedAt?: number;
}

export interface MetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  labels: Record<string, string>;
}

export interface MonitoringStats {
  totalRules: number;
  activeRules: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  metricsProcessed: number;
  processingRate: number;
}

/**
 * Simplified Real-Time Monitor Facade
 * Delegates monitoring operations to FSM-based repository
 */
export class RealTimeMonitorFacade extends EventEmitter {
  private repository: RepositoryBaseFSM;
  private rules: Map<string, MonitoringRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private metrics: MetricData[] = [];
  private stats: MonitoringStats = {
    totalRules: 0,
    activeRules: 0,
    totalAlerts: 0,
    unacknowledgedAlerts: 0,
    metricsProcessed: 0,
    processingRate: 0
  };
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();

    const repositoryConfig: RepositoryConfig = {
      dataSource: {
        type: 'memory',
        options: {
          persistent: true,
          maxSize: 100000
        }
      },
      cache: {
        maxSize: 50000,
        maxAge: 300000, // 5 minutes
        evictionPolicy: 'LRU'
      },
      transaction: {
        isolationLevel: 'READ_COMMITTED' as any,
        timeout: 30000
      },
      enableMetrics: true
    };

    this.repository = new RepositoryBaseFSM(repositoryConfig);
    this.setupEventHandlers();
    this.initializeDefaultRules();
  }

  private setupEventHandlers(): void {
    this.repository.on('error', (error) => {
      this.emit('monitoringError', { error, timestamp: Date.now() });
    });

    this.repository.on('queryExecuted', (event) => {
      this.emit('metricProcessed', { result: event.result, timestamp: Date.now() });
    });
  }

  private initializeDefaultRules(): void {
    const defaultRules: MonitoringRule[] = [
      {
        id: 'cpu_threshold',
        name: 'CPU Usage Threshold',
        type: 'threshold',
        metric: 'cpu_usage',
        condition: 'value > threshold',
        threshold: 80,
        enabled: true,
        severity: 'warning'
      },
      {
        id: 'memory_threshold',
        name: 'Memory Usage Threshold',
        type: 'threshold',
        metric: 'memory_usage',
        condition: 'value > threshold',
        threshold: 90,
        enabled: true,
        severity: 'error'
      },
      {
        id: 'error_rate_threshold',
        name: 'Error Rate Threshold',
        type: 'threshold',
        metric: 'error_rate',
        condition: 'value > threshold',
        threshold: 5,
        enabled: true,
        severity: 'critical'
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    this.updateStats();
  }

  async initialize(): Promise<void> {
    await this.initializeComponent();
  }

  async initializeComponent(): Promise<void> {
    await this.repository.initializeComponent();
    this.startMonitoring();
    this.emit('monitorInitialized');
  }

  async addRule(rule: MonitoringRule): Promise<void> {
    try {
      await this.repository.write(rule, { type: 'rule' });
      this.rules.set(rule.id, rule);
      this.updateStats();

      this.emit('ruleAdded', { ruleId: rule.id, rule });
    } catch (error) {
      this.emit('ruleAddFailed', { ruleId: rule.id, error });
      throw error;
    }
  }

  async updateRule(ruleId: string, updates: Partial<MonitoringRule>): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    try {
      const updatedRule = { ...rule, ...updates };
      await this.repository.update({ id: ruleId }, updatedRule);
      this.rules.set(ruleId, updatedRule);
      this.updateStats();

      this.emit('ruleUpdated', { ruleId, updates });
    } catch (error) {
      this.emit('ruleUpdateFailed', { ruleId, error });
      throw error;
    }
  }

  async deleteRule(ruleId: string): Promise<void> {
    try {
      await this.repository.delete({ id: ruleId });
      this.rules.delete(ruleId);
      this.updateStats();

      this.emit('ruleDeleted', { ruleId });
    } catch (error) {
      this.emit('ruleDeleteFailed', { ruleId, error });
      throw error;
    }
  }

  async ingestMetric(metric: MetricData): Promise<void> {
    try {
      // Store metric
      await this.repository.write(metric, { type: 'metric' });

      // Add to in-memory buffer
      this.metrics.push(metric);
      if (this.metrics.length > 10000) {
        this.metrics = this.metrics.slice(-10000); // Keep last 10k metrics
      }

      // Process against rules
      await this.processMetricAgainstRules(metric);

      this.stats.metricsProcessed++;
      this.emit('metricIngested', { metricId: metric.id, metric });
    } catch (error) {
      this.emit('metricIngestFailed', { metricId: metric.id, error });
      throw error;
    }
  }

  async ingestMetrics(metrics: MetricData[]): Promise<void> {
    try {
      await this.repository.withTransaction(async (txn) => {
        for (const metric of metrics) {
          await txn.write(metric, { type: 'metric' });
          await this.processMetricAgainstRules(metric);
        }
      });

      this.metrics.push(...metrics);
      if (this.metrics.length > 10000) {
        this.metrics = this.metrics.slice(-10000);
      }

      this.stats.metricsProcessed += metrics.length;
      this.emit('metricsIngested', { count: metrics.length });
    } catch (error) {
      this.emit('metricsIngestFailed', { count: metrics.length, error });
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    try {
      alert.acknowledged = true;
      await this.repository.update({ id: alertId }, { acknowledged: true });
      this.updateStats();

      this.emit('alertAcknowledged', { alertId });
    } catch (error) {
      this.emit('alertAcknowledgeFailed', { alertId, error });
      throw error;
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    try {
      alert.resolvedAt = Date.now();
      await this.repository.update({ id: alertId }, { resolvedAt: alert.resolvedAt });
      this.updateStats();

      this.emit('alertResolved', { alertId });
    } catch (error) {
      this.emit('alertResolveFailed', { alertId, error });
      throw error;
    }
  }

  async getAlerts(filters?: {
    severity?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
  }): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.severity) {
        alerts = alerts.filter(alert => alert.severity === filters.severity);
      }
      if (filters.acknowledged !== undefined) {
        alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
      }
      if (filters.resolved !== undefined) {
        const resolved = filters.resolved;
        alerts = alerts.filter(alert => resolved ? !!alert.resolvedAt : !alert.resolvedAt);
      }
      if (filters.limit) {
        alerts = alerts.slice(0, filters.limit);
      }
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getMetrics(filters?: {
    name?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<MetricData[]> {
    let metrics = [...this.metrics];

    if (filters) {
      if (filters.name) {
        metrics = metrics.filter(metric => metric.name === filters.name);
      }
      if (filters.startTime) {
        metrics = metrics.filter(metric => metric.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        metrics = metrics.filter(metric => metric.timestamp <= filters.endTime!);
      }
      if (filters.limit) {
        metrics = metrics.slice(-filters.limit);
      }
    }

    return metrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  getRules(): MonitoringRule[] {
    return Array.from(this.rules.values());
  }

  getStats(): MonitoringStats {
    return { ...this.stats };
  }

  private async processMetricAgainstRules(metric: MetricData): Promise<void> {
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && rule.metric === metric.name);

    for (const rule of applicableRules) {
      const violation = await this.evaluateRule(rule, metric);
      if (violation) {
        await this.createAlert(rule, metric, violation);
      }
    }
  }

  private async evaluateRule(rule: MonitoringRule, metric: MetricData): Promise<string | null> {
    switch (rule.type) {
      case 'threshold':
        if (rule.threshold && metric.value > rule.threshold) {
          return `Value ${metric.value} exceeds threshold ${rule.threshold}`;
        }
        break;

      case 'anomaly':
        // Simplified anomaly detection
        const recentMetrics = this.metrics
          .filter(m => m.name === metric.name && m.timestamp > Date.now() - 300000)
          .slice(-10);

        if (recentMetrics.length >= 5) {
          const avg = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
          const stdDev = Math.sqrt(
            recentMetrics.reduce((sum, m) => sum + Math.pow(m.value - avg, 2), 0) / recentMetrics.length
          );

          if (Math.abs(metric.value - avg) > 2 * stdDev) {
            return `Anomalous value ${metric.value} detected (avg: ${avg.toFixed(2)}, stddev: ${stdDev.toFixed(2)})`;
          }
        }
        break;

      case 'pattern':
        // Simplified pattern detection
        if (metric.name.includes('error') && metric.value > 0) {
          return `Error pattern detected: ${metric.value} errors`;
        }
        break;

      case 'trend':
        // Simplified trend detection
        const trendMetrics = this.metrics
          .filter(m => m.name === metric.name)
          .slice(-5);

        if (trendMetrics.length >= 3) {
          const isIncreasing = trendMetrics.every((m, i) =>
            i === 0 || m.value > trendMetrics[i - 1].value
          );

          if (isIncreasing && metric.value > trendMetrics[0].value * 1.5) {
            return `Increasing trend detected: ${metric.value} (started at ${trendMetrics[0].value})`;
          }
        }
        break;
    }

    return null;
  }

  private async createAlert(rule: MonitoringRule, metric: MetricData, violation: string): Promise<void> {
    const alertId = this.generateAlertId();
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      metric: metric.name,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      message: `${rule.name}: ${violation}`,
      timestamp: Date.now(),
      acknowledged: false
    };

    try {
      await this.repository.write(alert, { type: 'alert' });
      this.alerts.set(alertId, alert);
      this.updateStats();

      this.emit('alertCreated', { alertId, alert });
    } catch (error) {
      this.emit('alertCreateFailed', { ruleId: rule.id, error });
    }
  }

  private startMonitoring(): void {
    // Update processing rate every second
    this.monitoringInterval = setInterval(() => {
      this.updateProcessingRate();
    }, 1000);
  }

  private updateProcessingRate(): void {
    // Simple processing rate calculation
    this.stats.processingRate = this.stats.metricsProcessed / 60; // per minute
  }

  private updateStats(): void {
    this.stats.totalRules = this.rules.size;
    this.stats.activeRules = Array.from(this.rules.values()).filter(rule => rule.enabled).length;
    this.stats.totalAlerts = this.alerts.size;
    this.stats.unacknowledgedAlerts = Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged).length;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    const repoHealth = await this.repository.healthCheck();

    return {
      status: repoHealth.status,
      details: {
        repository: repoHealth.components,
        monitoring: {
          rulesActive: this.stats.activeRules,
          alertsPending: this.stats.unacknowledgedAlerts,
          processingRate: this.stats.processingRate
        },
        metrics: repoHealth.metrics
      }
    };
  }

  async destroy(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.rules.clear();
    this.alerts.clear();
    this.metrics = [];

    await this.repository.destroy();
    this.removeAllListeners();
  }
}