import { Logger } from '../../../utils/Logger';
import { DeploymentResult } from '../DeploymentPrincess';
import { EventEmitter } from 'events';

export interface MetricPoint {
  timestamp: Date;
  value: number;
  labels: Record<string, string>;
}

export interface DeploymentMetricsSnapshot {
  deploymentId: string;
  environment: string;
  timestamp: Date;
  metrics: {
    // Performance metrics
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
      average: number;
    };
    throughput: {
      requestsPerSecond: number;
      requestsPerMinute: number;
      totalRequests: number;
    };
    errorRate: {
      rate: number;
      count: number;
      errors4xx: number;
      errors5xx: number;
    };
    // Resource metrics
    cpu: {
      usage: number;
      limit: number;
      requests: number;
    };
    memory: {
      usage: number;
      limit: number;
      requests: number;
    };
    network: {
      inBytes: number;
      outBytes: number;
      connections: number;
    };
    // Business metrics
    activeUsers: number;
    transactions: number;
    revenue: number;
    // Health metrics
    healthScore: number;
    availability: number;
    uptime: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldown: number; // seconds
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'webhook' | 'email' | 'slack' | 'rollback' | 'scale';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  deploymentId: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  value: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface CanaryMetrics {
  deploymentId: string;
  canaryPercentage: number;
  metrics: {
    canary: DeploymentMetricsSnapshot['metrics'];
    stable: DeploymentMetricsSnapshot['metrics'];
    comparison: {
      errorRateDelta: number;
      responseTimeDelta: number;
      throughputDelta: number;
      successRate: number;
    };
  };
  verdict: 'continue' | 'rollback' | 'hold';
  confidence: number;
}

export class DeploymentMetrics extends EventEmitter {
  private readonly logger: Logger;
  private readonly metricsStorage: Map<string, DeploymentMetricsSnapshot[]>;
  private readonly alertRules: Map<string, AlertRule>;
  private readonly activeAlerts: Map<string, Alert>;
  private readonly lastAlertTime: Map<string, Date>;
  private readonly monitoringIntervals: Map<string, NodeJS.Timeout>;

  constructor() {
    super();
    this.logger = new Logger('DeploymentMetrics');
    this.metricsStorage = new Map();
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.lastAlertTime = new Map();
    this.monitoringIntervals = new Map();

    this.setupDefaultAlertRules();
  }

  async recordDeploymentStart(deployment: DeploymentResult): Promise<void> {
    try {
      this.logger.info(`Starting metrics collection for deployment ${deployment.deploymentId}`);

      // Initialize metrics storage
      this.metricsStorage.set(deployment.deploymentId, []);

      // Start monitoring
      await this.startMonitoring(deployment);

      this.emit('metricsCollectionStarted', deployment);

    } catch (error) {
      this.logger.error(`Failed to start metrics collection`, { error, deploymentId: deployment.deploymentId });
      throw error;
    }
  }

  async recordDeploymentSuccess(deployment: DeploymentResult): Promise<void> {
    try {
      this.logger.info(`Recording deployment success metrics`, { deploymentId: deployment.deploymentId });

      const snapshot = await this.captureMetricsSnapshot(deployment);
      this.storeMetricsSnapshot(deployment.deploymentId, snapshot);

      // Calculate deployment success metrics
      const successMetrics = {
        deploymentDuration: deployment.metrics.deploymentTime,
        healthCheckDuration: deployment.metrics.healthCheckTime,
        finalHealthScore: snapshot.metrics.healthScore,
        finalAvailability: snapshot.metrics.availability,
      };

      this.emit('deploymentSuccess', { deployment, metrics: successMetrics });

    } catch (error) {
      this.logger.error(`Failed to record deployment success metrics`, { error });
    }
  }

  async recordDeploymentFailure(deployment: DeploymentResult): Promise<void> {
    try {
      this.logger.info(`Recording deployment failure metrics`, { deploymentId: deployment.deploymentId });

      const snapshot = await this.captureMetricsSnapshot(deployment);
      this.storeMetricsSnapshot(deployment.deploymentId, snapshot);

      // Calculate failure metrics
      const failureMetrics = {
        failureTime: Date.now() - deployment.timestamp.getTime(),
        lastHealthScore: snapshot.metrics.healthScore,
        errorRate: snapshot.metrics.errorRate.rate,
        lastAvailability: snapshot.metrics.availability,
      };

      this.emit('deploymentFailure', { deployment, metrics: failureMetrics });

      // Stop monitoring for failed deployments
      this.stopMonitoring(deployment.deploymentId);

    } catch (error) {
      this.logger.error(`Failed to record deployment failure metrics`, { error });
    }
  }

  async recordRollback(deployment: DeploymentResult): Promise<void> {
    try {
      this.logger.info(`Recording rollback metrics`, { deploymentId: deployment.deploymentId });

      const rollbackMetrics = {
        rollbackDuration: deployment.metrics.rollbackTime || 0,
        rollbackTrigger: 'automatic', // This would come from rollback context
        preRollbackHealth: await this.getLatestHealthScore(deployment.deploymentId),
      };

      this.emit('rollbackExecuted', { deployment, metrics: rollbackMetrics });

    } catch (error) {
      this.logger.error(`Failed to record rollback metrics`, { error });
    }
  }

  async getCanaryMetrics(applicationName: string, percentage: number): Promise<CanaryMetrics> {
    try {
      this.logger.info(`Getting canary metrics for ${applicationName} at ${percentage}%`);

      // Get metrics for both canary and stable versions
      const canaryMetrics = await this.getApplicationMetrics(`${applicationName}-canary`);
      const stableMetrics = await this.getApplicationMetrics(`${applicationName}-stable`);

      const comparison = this.compareMetrics(canaryMetrics, stableMetrics);
      const verdict = this.determineCanaryVerdict(comparison, percentage);

      const canaryMetricsResult: CanaryMetrics = {
        deploymentId: `${applicationName}-canary`,
        canaryPercentage: percentage,
        metrics: {
          canary: canaryMetrics,
          stable: stableMetrics,
          comparison,
        },
        verdict,
        confidence: this.calculateConfidence(comparison),
      };

      this.logger.info(`Canary metrics analysis completed`, {
        applicationName,
        verdict,
        confidence: canaryMetricsResult.confidence,
      });

      return canaryMetricsResult;

    } catch (error) {
      this.logger.error(`Failed to get canary metrics`, { error, applicationName });
      throw error;
    }
  }

  async createAlertRule(rule: AlertRule): Promise<void> {
    try {
      this.alertRules.set(rule.id, rule);
      this.logger.info(`Created alert rule: ${rule.name}`, { ruleId: rule.id });

    } catch (error) {
      this.logger.error(`Failed to create alert rule`, { error, rule });
      throw error;
    }
  }

  async getMetricsHistory(
    deploymentId: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<DeploymentMetricsSnapshot[]> {
    const allMetrics = this.metricsStorage.get(deploymentId) || [];

    if (!startTime && !endTime) {
      return allMetrics;
    }

    return allMetrics.filter(snapshot => {
      const timestamp = snapshot.timestamp;
      const afterStart = !startTime || timestamp >= startTime;
      const beforeEnd = !endTime || timestamp <= endTime;
      return afterStart && beforeEnd;
    });
  }

  async getActiveAlerts(deploymentId?: string): Promise<Alert[]> {
    const alerts = Array.from(this.activeAlerts.values());

    if (deploymentId) {
      return alerts.filter(alert => alert.deploymentId === deploymentId);
    }

    return alerts.filter(alert => !alert.resolved);
  }

  async generateMetricsReport(deploymentId: string): Promise<string> {
    try {
      const metrics = await this.getMetricsHistory(deploymentId);
      const alerts = await this.getActiveAlerts(deploymentId);

      if (metrics.length === 0) {
        return JSON.stringify({ error: 'No metrics found for deployment' }, null, 2);
      }

      const latestMetrics = metrics[metrics.length - 1];
      const firstMetrics = metrics[0];

      const report = {
        deploymentId,
        reportTime: new Date(),
        duration: latestMetrics.timestamp.getTime() - firstMetrics.timestamp.getTime(),
        summary: {
          averageResponseTime: this.calculateAverage(metrics, m => m.metrics.responseTime.average),
          averageErrorRate: this.calculateAverage(metrics, m => m.metrics.errorRate.rate),
          averageThroughput: this.calculateAverage(metrics, m => m.metrics.throughput.requestsPerSecond),
          averageHealthScore: this.calculateAverage(metrics, m => m.metrics.healthScore),
          peakCpuUsage: Math.max(...metrics.map(m => m.metrics.cpu.usage)),
          peakMemoryUsage: Math.max(...metrics.map(m => m.metrics.memory.usage)),
        },
        trends: {
          responseTime: this.calculateTrend(metrics, m => m.metrics.responseTime.average),
          errorRate: this.calculateTrend(metrics, m => m.metrics.errorRate.rate),
          throughput: this.calculateTrend(metrics, m => m.metrics.throughput.requestsPerSecond),
        },
        alerts: {
          total: alerts.length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          errors: alerts.filter(a => a.severity === 'error').length,
          warnings: alerts.filter(a => a.severity === 'warning').length,
        },
        sla: {
          availability: this.calculateAvailability(metrics),
          p99ResponseTime: this.calculatePercentile(metrics, m => m.metrics.responseTime.p99, 99),
          errorRate: this.calculateAverage(metrics, m => m.metrics.errorRate.rate),
        },
      };

      return JSON.stringify(report, null, 2);

    } catch (error) {
      this.logger.error(`Failed to generate metrics report`, { error, deploymentId });
      throw error;
    }
  }

  stopMonitoring(deploymentId: string): void {
    const interval = this.monitoringIntervals.get(deploymentId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(deploymentId);
      this.logger.info(`Stopped monitoring for deployment ${deploymentId}`);
    }
  }

  private async startMonitoring(deployment: DeploymentResult): Promise<void> {
    const interval = setInterval(async () => {
      try {
        const snapshot = await this.captureMetricsSnapshot(deployment);
        this.storeMetricsSnapshot(deployment.deploymentId, snapshot);
        await this.evaluateAlertRules(deployment.deploymentId, snapshot);

      } catch (error) {
        this.logger.error(`Error in metrics monitoring`, { error, deploymentId: deployment.deploymentId });
      }
    }, 30000); // Collect metrics every 30 seconds

    this.monitoringIntervals.set(deployment.deploymentId, interval);
  }

  private async captureMetricsSnapshot(deployment: DeploymentResult): Promise<DeploymentMetricsSnapshot> {
    // In a real implementation, this would collect metrics from Prometheus, CloudWatch, etc.
    // For now, we'll generate realistic simulated metrics

    const baseErrorRate = deployment.environment === 'production' ? 0.01 : 0.02;
    const baseResponseTime = deployment.environment === 'production' ? 150 : 200;

    return {
      deploymentId: deployment.deploymentId,
      environment: deployment.environment,
      timestamp: new Date(),
      metrics: {
        responseTime: {
          p50: baseResponseTime,
          p95: baseResponseTime * 2,
          p99: baseResponseTime * 3,
          average: baseResponseTime * 1.2,
        },
        throughput: {
          requestsPerSecond: 100 + Math.random() * 50,
          requestsPerMinute: 6000 + Math.random() * 3000,
          totalRequests: Math.floor(Math.random() * 10000),
        },
        errorRate: {
          rate: baseErrorRate + Math.random() * 0.01,
          count: Math.floor(Math.random() * 10),
          errors4xx: Math.floor(Math.random() * 5),
          errors5xx: Math.floor(Math.random() * 3),
        },
        cpu: {
          usage: 0.3 + Math.random() * 0.4,
          limit: 1.0,
          requests: 0.5,
        },
        memory: {
          usage: 0.4 + Math.random() * 0.3,
          limit: 1.0,
          requests: 0.6,
        },
        network: {
          inBytes: Math.floor(Math.random() * 1000000),
          outBytes: Math.floor(Math.random() * 1000000),
          connections: Math.floor(Math.random() * 100),
        },
        activeUsers: Math.floor(Math.random() * 1000),
        transactions: Math.floor(Math.random() * 500),
        revenue: Math.random() * 10000,
        healthScore: 85 + Math.random() * 15,
        availability: 99.5 + Math.random() * 0.5,
        uptime: Math.random() * 100,
      },
    };
  }

  private storeMetricsSnapshot(deploymentId: string, snapshot: DeploymentMetricsSnapshot): void {
    const existing = this.metricsStorage.get(deploymentId) || [];
    existing.push(snapshot);

    // Keep only last 1000 snapshots to prevent memory issues
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000);
    }

    this.metricsStorage.set(deploymentId, existing);
  }

  private async evaluateAlertRules(deploymentId: string, snapshot: DeploymentMetricsSnapshot): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = this.evaluateAlertCondition(rule, snapshot);

        if (shouldAlert) {
          await this.triggerAlert(rule, deploymentId, snapshot);
        }

      } catch (error) {
        this.logger.error(`Error evaluating alert rule`, { error, ruleId: rule.id });
      }
    }
  }

  private evaluateAlertCondition(rule: AlertRule, snapshot: DeploymentMetricsSnapshot): boolean {
    // Simple condition evaluation - in production, this would be more sophisticated
    switch (rule.condition) {
      case 'error_rate':
        return snapshot.metrics.errorRate.rate > rule.threshold;
      case 'response_time_p95':
        return snapshot.metrics.responseTime.p95 > rule.threshold;
      case 'cpu_usage':
        return snapshot.metrics.cpu.usage > rule.threshold;
      case 'memory_usage':
        return snapshot.metrics.memory.usage > rule.threshold;
      case 'health_score':
        return snapshot.metrics.healthScore < rule.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(
    rule: AlertRule,
    deploymentId: string,
    snapshot: DeploymentMetricsSnapshot
  ): Promise<void> {
    const lastAlert = this.lastAlertTime.get(rule.id);
    const now = new Date();

    // Check cooldown period
    if (lastAlert && (now.getTime() - lastAlert.getTime()) < rule.cooldown * 1000) {
      return;
    }

    const alertId = `${rule.id}-${deploymentId}-${now.getTime()}`;
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      deploymentId,
      timestamp: now,
      severity: rule.severity,
      message: `Alert: ${rule.name} - ${rule.condition} exceeded threshold`,
      value: this.getMetricValue(rule.condition, snapshot),
      threshold: rule.threshold,
      resolved: false,
    };

    this.activeAlerts.set(alertId, alert);
    this.lastAlertTime.set(rule.id, now);

    // Execute alert actions
    for (const action of rule.actions) {
      await this.executeAlertAction(action, alert, deploymentId);
    }

    this.emit('alertTriggered', alert);
    this.logger.warn(`Alert triggered: ${rule.name}`, { alert });
  }

  private async executeAlertAction(
    action: AlertAction,
    alert: Alert,
    deploymentId: string
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'webhook':
          await this.sendWebhook(action.config.url, alert);
          break;
        case 'email':
          await this.sendEmail(action.config.recipients, alert);
          break;
        case 'slack':
          await this.sendSlackMessage(action.config.channel, alert);
          break;
        case 'rollback':
          this.emit('rollbackRequested', { deploymentId, alert });
          break;
        case 'scale':
          this.emit('scaleRequested', { deploymentId, alert, replicas: action.config.replicas });
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to execute alert action`, { error, action, alert });
    }
  }

  private getMetricValue(condition: string, snapshot: DeploymentMetricsSnapshot): number {
    switch (condition) {
      case 'error_rate':
        return snapshot.metrics.errorRate.rate;
      case 'response_time_p95':
        return snapshot.metrics.responseTime.p95;
      case 'cpu_usage':
        return snapshot.metrics.cpu.usage;
      case 'memory_usage':
        return snapshot.metrics.memory.usage;
      case 'health_score':
        return snapshot.metrics.healthScore;
      default:
        return 0;
    }
  }

  private async getApplicationMetrics(applicationName: string): Promise<DeploymentMetricsSnapshot['metrics']> {
    // Simulate getting metrics for a specific application
    return {
      responseTime: { p50: 150, p95: 300, p99: 450, average: 180 },
      throughput: { requestsPerSecond: 120, requestsPerMinute: 7200, totalRequests: 50000 },
      errorRate: { rate: 0.02, count: 5, errors4xx: 3, errors5xx: 2 },
      cpu: { usage: 0.5, limit: 1.0, requests: 0.5 },
      memory: { usage: 0.6, limit: 1.0, requests: 0.6 },
      network: { inBytes: 500000, outBytes: 750000, connections: 50 },
      activeUsers: 500,
      transactions: 250,
      revenue: 5000,
      healthScore: 90,
      availability: 99.8,
      uptime: 99.9,
    };
  }

  private compareMetrics(
    canaryMetrics: DeploymentMetricsSnapshot['metrics'],
    stableMetrics: DeploymentMetricsSnapshot['metrics']
  ): CanaryMetrics['metrics']['comparison'] {
    return {
      errorRateDelta: canaryMetrics.errorRate.rate - stableMetrics.errorRate.rate,
      responseTimeDelta: canaryMetrics.responseTime.average - stableMetrics.responseTime.average,
      throughputDelta: canaryMetrics.throughput.requestsPerSecond - stableMetrics.throughput.requestsPerSecond,
      successRate: 1 - canaryMetrics.errorRate.rate,
    };
  }

  private determineCanaryVerdict(
    comparison: CanaryMetrics['metrics']['comparison'],
    percentage: number
  ): CanaryMetrics['verdict'] {
    // Decision logic for canary deployments
    if (comparison.errorRateDelta > 0.02) return 'rollback'; // Error rate increased by more than 2%
    if (comparison.responseTimeDelta > 100) return 'rollback'; // Response time increased by more than 100ms
    if (comparison.successRate < 0.95) return 'rollback'; // Success rate below 95%

    // If we're at 100% and everything looks good, continue
    if (percentage >= 100) return 'continue';

    // For lower percentages, continue if metrics are stable
    if (Math.abs(comparison.errorRateDelta) < 0.01 && Math.abs(comparison.responseTimeDelta) < 50) {
      return 'continue';
    }

    return 'hold'; // Default to holding for more data
  }

  private calculateConfidence(comparison: CanaryMetrics['metrics']['comparison']): number {
    let confidence = 100;

    // Reduce confidence based on metric deltas
    confidence -= Math.abs(comparison.errorRateDelta) * 1000; // Each 0.1% error rate change reduces confidence by 10
    confidence -= Math.abs(comparison.responseTimeDelta) / 10; // Each 10ms change reduces confidence by 1
    confidence -= Math.abs(comparison.throughputDelta) / 10; // Each 10 RPS change reduces confidence by 1

    return Math.max(0, Math.min(100, confidence));
  }

  private async getLatestHealthScore(deploymentId: string): Promise<number> {
    const metrics = this.metricsStorage.get(deploymentId);
    if (!metrics || metrics.length === 0) return 0;

    return metrics[metrics.length - 1].metrics.healthScore;
  }

  private calculateAverage(
    metrics: DeploymentMetricsSnapshot[],
    extractor: (m: DeploymentMetricsSnapshot) => number
  ): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + extractor(m), 0);
    return sum / metrics.length;
  }

  private calculateTrend(
    metrics: DeploymentMetricsSnapshot[],
    extractor: (m: DeploymentMetricsSnapshot) => number
  ): 'improving' | 'degrading' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-5); // Last 5 measurements
    const earlier = metrics.slice(-10, -5); // 5 measurements before that

    if (recent.length === 0 || earlier.length === 0) return 'stable';

    const recentAvg = this.calculateAverage(recent, extractor);
    const earlierAvg = this.calculateAverage(earlier, extractor);

    const change = (recentAvg - earlierAvg) / earlierAvg;

    if (Math.abs(change) < 0.05) return 'stable'; // Less than 5% change
    return change < 0 ? 'improving' : 'degrading';
  }

  private calculateAvailability(metrics: DeploymentMetricsSnapshot[]): number {
    if (metrics.length === 0) return 0;
    return this.calculateAverage(metrics, m => m.metrics.availability);
  }

  private calculatePercentile(
    metrics: DeploymentMetricsSnapshot[],
    extractor: (m: DeploymentMetricsSnapshot) => number,
    percentile: number
  ): number {
    if (metrics.length === 0) return 0;

    const values = metrics.map(extractor).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private setupDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'error_rate',
        threshold: 0.05, // 5%
        severity: 'error',
        enabled: true,
        cooldown: 300, // 5 minutes
        actions: [
          { type: 'webhook', config: { url: 'https://alerts.example.com/webhook' } },
          { type: 'slack', config: { channel: '#alerts' } },
        ],
      },
      {
        id: 'high-response-time',
        name: 'High Response Time',
        condition: 'response_time_p95',
        threshold: 1000, // 1 second
        severity: 'warning',
        enabled: true,
        cooldown: 180, // 3 minutes
        actions: [
          { type: 'slack', config: { channel: '#performance' } },
        ],
      },
      {
        id: 'low-health-score',
        name: 'Low Health Score',
        condition: 'health_score',
        threshold: 70,
        severity: 'critical',
        enabled: true,
        cooldown: 120, // 2 minutes
        actions: [
          { type: 'webhook', config: { url: 'https://alerts.example.com/critical' } },
          { type: 'rollback', config: {} },
        ],
      },
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  private async sendWebhook(url: string, alert: Alert): Promise<void> {
    // Implement webhook sending
    this.logger.info(`Sending webhook alert`, { url, alertId: alert.id });
  }

  private async sendEmail(recipients: string[], alert: Alert): Promise<void> {
    // Implement email sending
    this.logger.info(`Sending email alert`, { recipients, alertId: alert.id });
  }

  private async sendSlackMessage(channel: string, alert: Alert): Promise<void> {
    // Implement Slack message sending
    this.logger.info(`Sending Slack alert`, { channel, alertId: alert.id });
  }
}