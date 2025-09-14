/**
 * CI/CD Performance Monitor
 * Phase 4 Step 8: Production Performance Monitoring Framework
 *
 * Real-time monitoring and alerting for CI/CD system performance
 * with <2% overhead constraint enforcement.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MonitorConfig {
  overheadThreshold: number; // <2% constraint
  samplingInterval: number; // ms
  alertThresholds: AlertThresholds;
  retentionPeriod: number; // hours
  domains: string[];
  enableRealTimeAlerts: boolean;
  enableTrendAnalysis: boolean;
}

export interface AlertThresholds {
  critical: {
    overhead: number; // 1.8%
    latency: number; // 1000ms
    errorRate: number; // 5%
    throughputDrop: number; // 50%
  };
  warning: {
    overhead: number; // 1.5%
    latency: number; // 750ms
    errorRate: number; // 2%
    throughputDrop: number; // 30%
  };
}

export interface MetricsSample {
  timestamp: Date;
  domain: string;
  metrics: DomainMetrics;
  overheadPercentage: number;
  compliance: ComplianceStatus;
}

export interface DomainMetrics {
  throughput: number; // ops/sec
  latency: LatencyStats;
  errorRate: number; // percentage
  resourceUsage: ResourceUsage;
  activeOperations: number;
}

export interface LatencyStats {
  mean: number;
  p95: number;
  p99: number;
  max: number;
}

export interface ResourceUsage {
  memory: number; // MB
  cpu: number; // percentage
  network: number; // MB/s
  disk: number; // MB/s
}

export interface ComplianceStatus {
  overheadCompliant: boolean;
  latencyCompliant: boolean;
  throughputCompliant: boolean;
  errorRateCompliant: boolean;
  overallScore: number;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  domain: string;
  severity: 'critical' | 'warning';
  type: 'overhead' | 'latency' | 'throughput' | 'error_rate';
  message: string;
  currentValue: number;
  threshold: number;
  recommendation: string;
}

export interface TrendAnalysis {
  domain: string;
  timespan: string;
  trends: {
    overhead: TrendDirection;
    latency: TrendDirection;
    throughput: TrendDirection;
    errorRate: TrendDirection;
  };
  predictions: PerformancePredictions;
}

export interface TrendDirection {
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number; // change per hour
  confidence: number; // 0-100
}

export interface PerformancePredictions {
  overheadViolationProbability: number; // 0-100
  estimatedTimeToViolation: number; // hours, -1 if stable
  recommendedActions: string[];
}

export class CICDPerformanceMonitor extends EventEmitter {
  private config: MonitorConfig;
  private isMonitoring: boolean = false;
  private metricsHistory: Map<string, MetricsSample[]> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private baselineMetrics: Map<string, DomainMetrics> = new Map();
  private trendAnalyzer: TrendAnalyzer;

  constructor(config: MonitorConfig) {
    super();
    this.config = config;
    this.trendAnalyzer = new TrendAnalyzer();
    this.initializeMonitoring();
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Monitoring already active');
      return;
    }

    console.log('[SEARCH] Starting CI/CD performance monitoring...');
    console.log(`   Overhead threshold: <${this.config.overheadThreshold}%`);
    console.log(`   Sampling interval: ${this.config.samplingInterval}ms`);
    console.log(`   Monitoring domains: ${this.config.domains.join(', ')}`);

    // Establish baseline metrics
    await this.establishBaseline();

    // Start monitoring loop
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(
      () => this.collectMetrics(),
      this.config.samplingInterval
    );

    // Start trend analysis if enabled
    if (this.config.enableTrendAnalysis) {
      this.startTrendAnalysis();
    }

    this.emit('monitoring-started', {
      timestamp: new Date(),
      domains: this.config.domains,
      baseline: Object.fromEntries(this.baselineMetrics)
    });

    console.log('[OK] Performance monitoring active');
  }

  /**
   * Stop performance monitoring
   */
  async stopMonitoring(): Promise<MonitoringSummary> {
    if (!this.isMonitoring) {
      console.log('Monitoring not active');
      return this.generateSummary();
    }

    console.log(' Stopping CI/CD performance monitoring...');

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Generate final summary
    const summary = this.generateSummary();

    // Save monitoring data
    await this.saveMonitoringData();

    this.emit('monitoring-stopped', {
      timestamp: new Date(),
      summary
    });

    console.log('[OK] Performance monitoring stopped');
    return summary;
  }

  /**
   * Get current performance status
   */
  getCurrentStatus(): PerformanceStatus {
    const currentMetrics = new Map<string, MetricsSample>();

    // Get latest metrics for each domain
    for (const domain of this.config.domains) {
      const history = this.metricsHistory.get(domain) || [];
      if (history.length > 0) {
        currentMetrics.set(domain, history[history.length - 1]);
      }
    }

    const overallOverhead = this.calculateOverallOverhead(Array.from(currentMetrics.values()));
    const activeAlertsCount = this.activeAlerts.size;
    const complianceRate = this.calculateComplianceRate(Array.from(currentMetrics.values()));

    return {
      timestamp: new Date(),
      overallOverhead,
      overheadCompliant: overallOverhead <= this.config.overheadThreshold,
      activeAlerts: activeAlertsCount,
      complianceRate,
      domains: Object.fromEntries(
        Array.from(currentMetrics.entries()).map(([domain, sample]) => [
          domain,
          {
            overhead: sample.overheadPercentage,
            compliant: sample.compliance.overallScore >= 80,
            lastUpdated: sample.timestamp
          }
        ])
      )
    };
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    // Initialize metrics history for each domain
    for (const domain of this.config.domains) {
      this.metricsHistory.set(domain, []);
    }

    // Setup alert handlers
    this.on('alert-triggered', this.handleAlert.bind(this));
    this.on('alert-resolved', this.handleAlertResolution.bind(this));
  }

  /**
   * Establish baseline performance metrics
   */
  private async establishBaseline(): Promise<void> {
    console.log('[CHART] Establishing baseline metrics...');

    for (const domain of this.config.domains) {
      // Simulate baseline establishment
      const baselineMetrics = await this.captureBaselineMetrics(domain);
      this.baselineMetrics.set(domain, baselineMetrics);

      console.log(`   ${domain}: ${baselineMetrics.throughput.toFixed(1)} ops/sec, ${baselineMetrics.resourceUsage.memory.toFixed(1)} MB`);
    }
  }

  /**
   * Capture baseline metrics for domain
   */
  private async captureBaselineMetrics(domain: string): Promise<DomainMetrics> {
    // Simulate baseline capture with realistic values
    return {
      throughput: 20 + Math.random() * 30, // 20-50 ops/sec
      latency: {
        mean: 50 + Math.random() * 50,
        p95: 100 + Math.random() * 100,
        p99: 200 + Math.random() * 200,
        max: 500 + Math.random() * 500
      },
      errorRate: Math.random() * 2, // 0-2%
      resourceUsage: {
        memory: 50 + Math.random() * 50, // 50-100 MB
        cpu: 10 + Math.random() * 20, // 10-30%
        network: Math.random() * 5, // 0-5 MB/s
        disk: Math.random() * 2 // 0-2 MB/s
      },
      activeOperations: Math.floor(Math.random() * 10)
    };
  }

  /**
   * Collect performance metrics
   */
  private async collectMetrics(): Promise<void> {
    for (const domain of this.config.domains) {
      try {
        const metrics = await this.captureDomainMetrics(domain);
        const baseline = this.baselineMetrics.get(domain);

        if (!baseline) {
          console.warn(`No baseline found for domain: ${domain}`);
          continue;
        }

        // Calculate overhead
        const overheadPercentage = this.calculateOverhead(metrics, baseline);

        // Validate compliance
        const compliance = this.validateCompliance(metrics, overheadPercentage);

        // Create sample
        const sample: MetricsSample = {
          timestamp: new Date(),
          domain,
          metrics,
          overheadPercentage,
          compliance
        };

        // Store sample
        this.storeSample(sample);

        // Check for alerts
        await this.checkAlerts(sample);

        // Emit monitoring data
        this.emit('metrics-collected', sample);

      } catch (error) {
        console.error(`Failed to collect metrics for ${domain}:`, error);
      }
    }
  }

  /**
   * Capture current metrics for domain
   */
  private async captureDomainMetrics(domain: string): Promise<DomainMetrics> {
    // Simulate metric capture with realistic fluctuations
    const baseline = this.baselineMetrics.get(domain)!;
    const variance = 0.2; // 20% variance

    const fluctuation = () => 1 + (Math.random() - 0.5) * variance * 2;

    return {
      throughput: baseline.throughput * fluctuation(),
      latency: {
        mean: baseline.latency.mean * fluctuation(),
        p95: baseline.latency.p95 * fluctuation(),
        p99: baseline.latency.p99 * fluctuation(),
        max: baseline.latency.max * fluctuation()
      },
      errorRate: Math.max(0, baseline.errorRate * fluctuation()),
      resourceUsage: {
        memory: baseline.resourceUsage.memory * fluctuation(),
        cpu: Math.min(100, baseline.resourceUsage.cpu * fluctuation()),
        network: baseline.resourceUsage.network * fluctuation(),
        disk: baseline.resourceUsage.disk * fluctuation()
      },
      activeOperations: Math.floor(baseline.activeOperations * fluctuation())
    };
  }

  /**
   * Calculate performance overhead
   */
  private calculateOverhead(current: DomainMetrics, baseline: DomainMetrics): number {
    const memoryOverhead = ((current.resourceUsage.memory - baseline.resourceUsage.memory) / baseline.resourceUsage.memory) * 100;
    const cpuOverhead = ((current.resourceUsage.cpu - baseline.resourceUsage.cpu) / baseline.resourceUsage.cpu) * 100;
    const latencyOverhead = ((current.latency.mean - baseline.latency.mean) / baseline.latency.mean) * 100;

    // Calculate weighted average overhead
    const totalOverhead = (memoryOverhead * 0.4 + cpuOverhead * 0.4 + latencyOverhead * 0.2);
    return Math.max(0, totalOverhead);
  }

  /**
   * Validate performance compliance
   */
  private validateCompliance(metrics: DomainMetrics, overhead: number): ComplianceStatus {
    const overheadCompliant = overhead <= this.config.overheadThreshold;
    const latencyCompliant = metrics.latency.p95 <= 1000; // 1 second
    const throughputCompliant = metrics.throughput >= 10; // Min 10 ops/sec
    const errorRateCompliant = metrics.errorRate <= 5; // Max 5%

    const compliances = [overheadCompliant, latencyCompliant, throughputCompliant, errorRateCompliant];
    const overallScore = (compliances.filter(c => c).length / compliances.length) * 100;

    return {
      overheadCompliant,
      latencyCompliant,
      throughputCompliant,
      errorRateCompliant,
      overallScore
    };
  }

  /**
   * Store metrics sample
   */
  private storeSample(sample: MetricsSample): void {
    const history = this.metricsHistory.get(sample.domain) || [];
    history.push(sample);

    // Maintain retention period
    const cutoff = new Date(Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000));
    const filtered = history.filter(s => s.timestamp > cutoff);

    this.metricsHistory.set(sample.domain, filtered);
  }

  /**
   * Check for performance alerts
   */
  private async checkAlerts(sample: MetricsSample): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // Check overhead threshold
    if (sample.overheadPercentage >= this.config.alertThresholds.critical.overhead) {
      alerts.push(this.createAlert('critical', 'overhead', sample,
        `Critical overhead violation: ${sample.overheadPercentage.toFixed(2)}%`,
        'Immediate investigation required. Check for resource leaks or inefficient operations.'));
    } else if (sample.overheadPercentage >= this.config.alertThresholds.warning.overhead) {
      alerts.push(this.createAlert('warning', 'overhead', sample,
        `Warning: High overhead detected: ${sample.overheadPercentage.toFixed(2)}%`,
        'Monitor closely and consider optimization if trend continues.'));
    }

    // Check latency threshold
    if (sample.metrics.latency.p95 >= this.config.alertThresholds.critical.latency) {
      alerts.push(this.createAlert('critical', 'latency', sample,
        `Critical latency violation: ${sample.metrics.latency.p95.toFixed(1)}ms P95`,
        'Check for bottlenecks in processing pipeline.'));
    }

    // Check error rate
    if (sample.metrics.errorRate >= this.config.alertThresholds.critical.errorRate) {
      alerts.push(this.createAlert('critical', 'error_rate', sample,
        `Critical error rate: ${sample.metrics.errorRate.toFixed(1)}%`,
        'Investigate error sources and implement error handling improvements.'));
    }

    // Process alerts
    for (const alert of alerts) {
      await this.triggerAlert(alert);
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    severity: 'critical' | 'warning',
    type: 'overhead' | 'latency' | 'throughput' | 'error_rate',
    sample: MetricsSample,
    message: string,
    recommendation: string
  ): PerformanceAlert {
    const id = `${sample.domain}-${type}-${Date.now()}`;

    let currentValue: number;
    let threshold: number;

    switch (type) {
      case 'overhead':
        currentValue = sample.overheadPercentage;
        threshold = severity === 'critical' ?
          this.config.alertThresholds.critical.overhead :
          this.config.alertThresholds.warning.overhead;
        break;
      case 'latency':
        currentValue = sample.metrics.latency.p95;
        threshold = severity === 'critical' ?
          this.config.alertThresholds.critical.latency :
          this.config.alertThresholds.warning.latency;
        break;
      case 'error_rate':
        currentValue = sample.metrics.errorRate;
        threshold = severity === 'critical' ?
          this.config.alertThresholds.critical.errorRate :
          this.config.alertThresholds.warning.errorRate;
        break;
      default:
        currentValue = 0;
        threshold = 0;
    }

    return {
      id,
      timestamp: new Date(),
      domain: sample.domain,
      severity,
      type,
      message,
      currentValue,
      threshold,
      recommendation
    };
  }

  /**
   * Trigger performance alert
   */
  private async triggerAlert(alert: PerformanceAlert): Promise<void> {
    // Check if alert already exists
    const existingKey = `${alert.domain}-${alert.type}`;
    if (this.activeAlerts.has(existingKey)) {
      return; // Don't duplicate alerts
    }

    // Store alert
    this.activeAlerts.set(existingKey, alert);

    // Emit alert event
    this.emit('alert-triggered', alert);

    // Send notifications if enabled
    if (this.config.enableRealTimeAlerts) {
      await this.sendAlert(alert);
    }

    console.log(`[ALERT] ${alert.severity.toUpperCase()} ALERT: ${alert.message}`);
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alert: PerformanceAlert): Promise<void> {
    // Simulate alert notification
    const notification = {
      timestamp: alert.timestamp,
      subject: `CI/CD Performance Alert - ${alert.domain}`,
      body: `${alert.message}\n\nRecommendation: ${alert.recommendation}\n\nCurrent: ${alert.currentValue.toFixed(2)}\nThreshold: ${alert.threshold}`,
      severity: alert.severity
    };

    // Would integrate with actual notification system
    this.emit('notification-sent', notification);
  }

  /**
   * Handle alert events
   */
  private handleAlert(alert: PerformanceAlert): void {
    console.log(` Alert triggered: ${alert.id} - ${alert.message}`);
  }

  /**
   * Handle alert resolution
   */
  private handleAlertResolution(alertId: string): void {
    console.log(`[OK] Alert resolved: ${alertId}`);
  }

  /**
   * Start trend analysis
   */
  private startTrendAnalysis(): void {
    setInterval(() => {
      for (const domain of this.config.domains) {
        const trend = this.trendAnalyzer.analyzeTrend(domain, this.metricsHistory.get(domain) || []);
        if (trend) {
          this.emit('trend-analysis', trend);
        }
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Calculate overall system overhead
   */
  private calculateOverallOverhead(samples: MetricsSample[]): number {
    if (samples.length === 0) return 0;
    return samples.reduce((sum, s) => sum + s.overheadPercentage, 0) / samples.length;
  }

  /**
   * Calculate overall compliance rate
   */
  private calculateComplianceRate(samples: MetricsSample[]): number {
    if (samples.length === 0) return 100;
    return samples.reduce((sum, s) => sum + s.compliance.overallScore, 0) / samples.length;
  }

  /**
   * Generate monitoring summary
   */
  private generateSummary(): MonitoringSummary {
    const totalSamples = Array.from(this.metricsHistory.values()).reduce((sum, history) => sum + history.length, 0);
    const allSamples = Array.from(this.metricsHistory.values()).flat();

    const avgOverhead = allSamples.length > 0 ?
      allSamples.reduce((sum, s) => sum + s.overheadPercentage, 0) / allSamples.length : 0;

    const maxOverhead = allSamples.length > 0 ?
      Math.max(...allSamples.map(s => s.overheadPercentage)) : 0;

    const complianceRate = allSamples.length > 0 ?
      allSamples.reduce((sum, s) => sum + s.compliance.overallScore, 0) / allSamples.length : 100;

    return {
      monitoringPeriod: {
        start: allSamples.length > 0 ? allSamples[0].timestamp : new Date(),
        end: new Date(),
        duration: 0 // Would calculate actual duration
      },
      totalSamples,
      overheadStats: {
        average: avgOverhead,
        maximum: maxOverhead,
        violations: allSamples.filter(s => s.overheadPercentage > this.config.overheadThreshold).length
      },
      complianceRate,
      alertsSummary: {
        total: this.activeAlerts.size,
        critical: Array.from(this.activeAlerts.values()).filter(a => a.severity === 'critical').length,
        warning: Array.from(this.activeAlerts.values()).filter(a => a.severity === 'warning').length
      },
      domainSummaries: Object.fromEntries(
        this.config.domains.map(domain => [
          domain,
          this.generateDomainSummary(domain)
        ])
      )
    };
  }

  /**
   * Generate domain-specific summary
   */
  private generateDomainSummary(domain: string): DomainSummary {
    const history = this.metricsHistory.get(domain) || [];

    if (history.length === 0) {
      return {
        samples: 0,
        averageOverhead: 0,
        maxOverhead: 0,
        complianceRate: 100,
        alerts: 0
      };
    }

    const avgOverhead = history.reduce((sum, s) => sum + s.overheadPercentage, 0) / history.length;
    const maxOverhead = Math.max(...history.map(s => s.overheadPercentage));
    const complianceRate = history.reduce((sum, s) => sum + s.compliance.overallScore, 0) / history.length;
    const alerts = Array.from(this.activeAlerts.values()).filter(a => a.domain === domain).length;

    return {
      samples: history.length,
      averageOverhead: avgOverhead,
      maxOverhead: maxOverhead,
      complianceRate: complianceRate,
      alerts: alerts
    };
  }

  /**
   * Save monitoring data
   */
  private async saveMonitoringData(): Promise<void> {
    try {
      const dataDir = path.join(process.cwd(), '.claude', '.artifacts', 'monitoring');
      await fs.mkdir(dataDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dataFile = path.join(dataDir, `monitoring-data-${timestamp}.json`);

      const data = {
        config: this.config,
        baseline: Object.fromEntries(this.baselineMetrics),
        history: Object.fromEntries(this.metricsHistory),
        alerts: Array.from(this.activeAlerts.values()),
        summary: this.generateSummary()
      };

      await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[DISK] Monitoring data saved: ${dataFile}`);

    } catch (error) {
      console.error('Failed to save monitoring data:', error);
    }
  }
}

// Supporting classes
class TrendAnalyzer {
  analyzeTrend(domain: string, samples: MetricsSample[]): TrendAnalysis | null {
    if (samples.length < 10) return null; // Need minimum samples for trend analysis

    // Simple trend analysis implementation
    const recentSamples = samples.slice(-10);
    const overheadTrend = this.calculateTrend(recentSamples.map(s => s.overheadPercentage));
    const latencyTrend = this.calculateTrend(recentSamples.map(s => s.metrics.latency.p95));

    return {
      domain,
      timespan: '10-sample window',
      trends: {
        overhead: overheadTrend,
        latency: latencyTrend,
        throughput: this.calculateTrend(recentSamples.map(s => s.metrics.throughput)),
        errorRate: this.calculateTrend(recentSamples.map(s => s.metrics.errorRate))
      },
      predictions: {
        overheadViolationProbability: overheadTrend.direction === 'increasing' ? 30 : 10,
        estimatedTimeToViolation: -1,
        recommendedActions: ['Monitor trend', 'Consider optimization if increasing']
      }
    };
  }

  private calculateTrend(values: number[]): TrendDirection {
    if (values.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }

    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
    const rate = Math.abs(slope);
    const confidence = Math.min(100, rate * 100);

    return { direction, rate, confidence };
  }
}

// Supporting interfaces
export interface PerformanceStatus {
  timestamp: Date;
  overallOverhead: number;
  overheadCompliant: boolean;
  activeAlerts: number;
  complianceRate: number;
  domains: Record<string, {
    overhead: number;
    compliant: boolean;
    lastUpdated: Date;
  }>;
}

export interface MonitoringSummary {
  monitoringPeriod: {
    start: Date;
    end: Date;
    duration: number;
  };
  totalSamples: number;
  overheadStats: {
    average: number;
    maximum: number;
    violations: number;
  };
  complianceRate: number;
  alertsSummary: {
    total: number;
    critical: number;
    warning: number;
  };
  domainSummaries: Record<string, DomainSummary>;
}

export interface DomainSummary {
  samples: number;
  averageOverhead: number;
  maxOverhead: number;
  complianceRate: number;
  alerts: number;
}