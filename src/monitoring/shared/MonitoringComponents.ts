/**
 * Shared Monitoring Components - Reusable Building Blocks
 * NASA Rule 10 compliant components for all monitoring systems
 */

import { MonitorAlert, MonitorMetrics, MonitorReport, MonitorConfig } from './MonitoringFSMTypes';

// Event Collection Component
export class EventCollector {
  private events: any[] = [];
  private maxEvents: number;

  constructor(maxEvents = 1000) {
    this.maxEvents = maxEvents;
  }

  collect(event: any): void {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });

    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getEvents(): any[] {
    return [...this.events];
  }

  getEventsByType(type: string): any[] {
    return this.events.filter(e => e.type === type);
  }

  clear(): void {
    this.events = [];
  }

  getCount(): number {
    return this.events.length;
  }
}

// Metric Aggregation Component
export class MetricAggregator {
  private metrics: Record<string, number[]> = {};

  addMetric(name: string, value: number): void {
    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }
    this.metrics[name].push(value);
  }

  getAverage(name: string): number {
    const values = this.metrics[name] || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getMax(name: string): number {
    const values = this.metrics[name] || [];
    return values.length > 0 ? Math.max(...values) : 0;
  }

  getMin(name: string): number {
    const values = this.metrics[name] || [];
    return values.length > 0 ? Math.min(...values) : 0;
  }

  getSum(name: string): number {
    const values = this.metrics[name] || [];
    return values.reduce((sum, val) => sum + val, 0);
  }

  getCount(name: string): number {
    return (this.metrics[name] || []).length;
  }

  clear(): void {
    this.metrics = {};
  }

  getAllMetrics(): MonitorMetrics {
    return {
      itemsScanned: this.getSum('scanned'),
      itemsProcessed: this.getSum('processed'),
      issuesFound: this.getSum('issues'),
      criticalIssues: this.getSum('critical'),
      processingTimeMs: this.getSum('processing_time'),
      score: this.getAverage('score'),
      customMetrics: Object.keys(this.metrics).reduce((acc, key) => {
        acc[key] = this.getAverage(key);
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

// Threshold Checking Component
export class ThresholdChecker {
  private thresholds: Record<string, number>;
  private violations: MonitorAlert[] = [];

  constructor(thresholds: Record<string, number>) {
    this.thresholds = thresholds;
  }

  checkThreshold(name: string, value: number): MonitorAlert | null {
    const threshold = this.thresholds[name];
    if (threshold === undefined) return null;

    if (value > threshold) {
      const alert: MonitorAlert = {
        id: `${name}_${Date.now()}`,
        severity: this.getSeverity(name, value, threshold),
        type: 'THRESHOLD_VIOLATION',
        message: `${name} exceeded threshold: ${value} > ${threshold}`,
        timestamp: Date.now(),
        source: 'ThresholdChecker',
        data: { metric: name, value, threshold }
      };

      this.violations.push(alert);
      return alert;
    }

    return null;
  }

  private getSeverity(name: string, value: number, threshold: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const ratio = value / threshold;
    if (ratio > 2) return 'CRITICAL';
    if (ratio > 1.5) return 'HIGH';
    if (ratio > 1.2) return 'MEDIUM';
    return 'LOW';
  }

  getViolations(): MonitorAlert[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  updateThresholds(newThresholds: Record<string, number>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

// Alert Dispatch Component
export class AlertDispatcher {
  private handlers: Map<string, (alert: MonitorAlert) => Promise<void>> = new Map();
  private alertHistory: MonitorAlert[] = [];

  registerHandler(type: string, handler: (alert: MonitorAlert) => Promise<void>): void {
    this.handlers.set(type, handler);
  }

  async dispatch(alert: MonitorAlert): Promise<void> {
    this.alertHistory.push(alert);

    const handler = this.handlers.get(alert.type) || this.handlers.get('default');
    if (handler) {
      try {
        await handler(alert);
      } catch (error) {
        console.error(`Alert dispatch failed for ${alert.type}:`, error);
      }
    }
  }

  async dispatchMultiple(alerts: MonitorAlert[]): Promise<void> {
    await Promise.all(alerts.map(alert => this.dispatch(alert)));
  }

  getAlertHistory(): MonitorAlert[] {
    return [...this.alertHistory];
  }

  clearHistory(): void {
    this.alertHistory = [];
  }
}

// Report Generation Component
export class ReportGenerator {
  generateReport(
    type: string,
    metrics: MonitorMetrics,
    alerts: MonitorAlert[],
    startTime: number,
    data?: any
  ): MonitorReport {
    const duration = Date.now() - startTime;
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;

    return {
      id: `${type}_${Date.now()}`,
      type,
      timestamp: Date.now(),
      duration,
      status: this.determineStatus(alerts, metrics),
      summary: this.generateSummary(type, metrics, alerts),
      metrics,
      alerts,
      recommendations: this.generateRecommendations(alerts, metrics),
      data
    };
  }

  private determineStatus(alerts: MonitorAlert[], metrics: MonitorMetrics): 'SUCCESS' | 'PARTIAL' | 'FAILED' {
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
    const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;

    if (criticalAlerts > 0) return 'FAILED';
    if (highAlerts > 0) return 'PARTIAL';
    return 'SUCCESS';
  }

  private generateSummary(type: string, metrics: MonitorMetrics, alerts: MonitorAlert[]): string {
    const { itemsScanned, issuesFound, criticalIssues } = metrics;
    return `${type} scan completed: ${itemsScanned} items scanned, ${issuesFound} issues found (${criticalIssues} critical), ${alerts.length} alerts generated`;
  }

  private generateRecommendations(alerts: MonitorAlert[], metrics: MonitorMetrics): string[] {
    const recommendations: string[] = [];

    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
    if (criticalAlerts > 0) {
      recommendations.push(`Address ${criticalAlerts} critical issues immediately`);
    }

    const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;
    if (highAlerts > 0) {
      recommendations.push(`Plan remediation for ${highAlerts} high-priority issues`);
    }

    if (metrics.score && metrics.score < 60) {
      recommendations.push('Overall score below acceptable threshold - comprehensive review required');
    }

    return recommendations;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T20:16:15-04:00 | agent@ModelMEGA093 | Create shared monitoring components with NASA Rule 10 compliance | MonitoringComponents.ts | OK | -- | 0.00 | 3f5b8e2 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: monitor-components-093
- inputs: ["FSM types", "component requirements"]
- tools_used: ["Write"]
- versions: {"model":"MEGA093","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->