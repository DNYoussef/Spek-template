/**
 * Dashboard Data Aggregator - Data processing and aggregation
 * NASA Rule 10 Compliant: Focused data aggregation logic
 */

import { DashboardTypes } from '~types/DashboardTypes';
import { MigrationMetrics, AggregatedMetrics } from '../../monitoring/MigrationMonitor';

export class DashboardDataAggregator {

  aggregateMetricsByTime(metrics: MigrationMetrics[], timeWindowMs: number): Record<string, AggregatedMetrics> {
    const aggregated: Record<string, AggregatedMetrics> = {};
    const metricNames = this.getMetricNames();

    for (const metricName of metricNames) {
      const values = this.extractMetricValues(metrics, metricName);
      if (values.length === 0) continue;

      aggregated[metricName] = this.buildAggregatedMetric(metricName, values, timeWindowMs, metrics);
    }

    return aggregated;
  }

  private getMetricNames(): string[] {
    return ['cpuUsagePercentage', 'memoryUsageMB', 'networkLatencyMs', 'throughputPerSecond'];
  }

  private extractMetricValues(metrics: MigrationMetrics[], metricName: string): number[] {
    return metrics
      .map(m => (m as any)[metricName])
      .filter(v => typeof v === 'number')
      .sort((a, b) => a - b);
  }

  private buildAggregatedMetric(
    metricName: string,
    values: number[],
    timeWindowMs: number,
    metrics: MigrationMetrics[]
  ): AggregatedMetrics {
    return {
      metric: metricName,
      timeWindow: `${timeWindowMs}ms`,
      average: this.calculateAverage(values),
      minimum: values[0],
      maximum: values[values.length - 1],
      percentile50: this.calculatePercentile(values, 0.5),
      percentile95: this.calculatePercentile(values, 0.95),
      percentile99: this.calculatePercentile(values, 0.99),
      standardDeviation: this.calculateStandardDeviation(values),
      dataPoints: this.buildDataPoints(metrics, metricName)
    };
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const index = Math.floor(values.length * percentile);
    return values[Math.min(index, values.length - 1)];
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = this.calculateAverage(squaredDiffs);
    return Math.sqrt(variance);
  }

  private buildDataPoints(metrics: MigrationMetrics[], metricName: string): DashboardTypes.ChartDataPoint[] {
    return metrics.map(m => ({
      timestamp: m.currentTime,
      value: (m as any)[metricName],
      metadata: { migrationId: m.migrationId }
    }));
  }

  filterDataByMigration(data: DashboardTypes.DashboardData[], migrationIds: string[]): DashboardTypes.DashboardData[] {
    return data.filter(d => migrationIds.includes(d.migrationId));
  }

  filterDataByTimeRange(
    data: DashboardTypes.DashboardData[],
    start: Date,
    end: Date
  ): DashboardTypes.DashboardData[] {
    return data.filter(d => d.timestamp >= start && d.timestamp <= end);
  }

  filterDataBySeverity(
    data: DashboardTypes.DashboardData[],
    severities: string[]
  ): DashboardTypes.DashboardData[] {
    return data.filter(d =>
      d.alerts.some(a => severities.includes(a.severity))
    );
  }

  filterDataByAlertTypes(
    data: DashboardTypes.DashboardData[],
    alertTypes: string[]
  ): DashboardTypes.DashboardData[] {
    return data.filter(d =>
      d.alerts.some(a => alertTypes.includes(a.type))
    );
  }

  filterDataByHealthStatus(
    data: DashboardTypes.DashboardData[],
    healthStatuses: string[]
  ): DashboardTypes.DashboardData[] {
    return data.filter(d =>
      d.healthChecks.some(h => healthStatuses.includes(h.status))
    );
  }

  filterDataByTags(
    data: DashboardTypes.DashboardData[],
    tags: string[]
  ): DashboardTypes.DashboardData[] {
    return data.filter(d =>
      d.customData.tags &&
      tags.some(tag => d.customData.tags.includes(tag))
    );
  }

  groupDataByMigration(data: DashboardTypes.DashboardData[]): Record<string, DashboardTypes.DashboardData[]> {
    const grouped: Record<string, DashboardTypes.DashboardData[]> = {};

    for (const item of data) {
      this.addToGroup(grouped, item.migrationId, item);
    }

    return grouped;
  }

  private addToGroup(
    grouped: Record<string, DashboardTypes.DashboardData[]>,
    key: string,
    item: DashboardTypes.DashboardData
  ): void {
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  }

  groupDataByTimeWindow(
    data: DashboardTypes.DashboardData[],
    windowMs: number
  ): Record<string, DashboardTypes.DashboardData[]> {
    const grouped: Record<string, DashboardTypes.DashboardData[]> = {};

    for (const item of data) {
      const windowKey = this.calculateTimeWindow(item.timestamp, windowMs);
      this.addToGroup(grouped, windowKey, item);
    }

    return grouped;
  }

  private calculateTimeWindow(timestamp: Date, windowMs: number): string {
    const windowStart = Math.floor(timestamp.getTime() / windowMs) * windowMs;
    return new Date(windowStart).toISOString();
  }

  groupDataByHealthStatus(data: DashboardTypes.DashboardData[]): Record<string, DashboardTypes.DashboardData[]> {
    const grouped: Record<string, DashboardTypes.DashboardData[]> = {};

    for (const item of data) {
      const status = this.determineOverallHealthStatus(item.healthChecks);
      this.addToGroup(grouped, status, item);
    }

    return grouped;
  }

  private determineOverallHealthStatus(healthChecks: any[]): string {
    if (healthChecks.some(c => c.status === 'critical')) return 'critical';
    if (healthChecks.some(c => c.status === 'degraded')) return 'degraded';
    if (healthChecks.every(c => c.status === 'healthy')) return 'healthy';
    return 'unknown';
  }

  calculateTrends(data: DashboardTypes.DashboardData[], metricName: string): any {
    if (data.length < 2) return null;

    const values = data.map(d => (d.metrics as any)[metricName]).filter(v => typeof v === 'number');
    if (values.length < 2) return null;

    return {
      current: values[values.length - 1],
      previous: values[values.length - 2],
      change: values[values.length - 1] - values[values.length - 2],
      changePercent: this.calculatePercentageChange(values[values.length - 2], values[values.length - 1]),
      trend: this.determineTrend(values),
      volatility: this.calculateVolatility(values)
    };
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private determineTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';

    const recent = values.slice(-3);
    const isIncreasing = recent[2] > recent[1] && recent[1] > recent[0];
    const isDecreasing = recent[2] < recent[1] && recent[1] < recent[0];

    if (isIncreasing) return 'increasing';
    if (isDecreasing) return 'decreasing';
    return 'stable';
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const changes = [];
    for (let i = 1; i < values.length; i++) {
      changes.push(Math.abs(values[i] - values[i - 1]));
    }

    return this.calculateAverage(changes);
  }

  aggregateAlertData(data: DashboardTypes.DashboardData[]): any {
    const allAlerts = data.flatMap(d => d.alerts);

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: allAlerts.filter(a => a.status === 'active').length,
      bySeverity: this.groupAlertsBySeverity(allAlerts),
      byType: this.groupAlertsByType(allAlerts),
      timeline: this.buildAlertTimeline(allAlerts),
      topMigrations: this.getTopMigrationsByAlerts(data)
    };
  }

  private groupAlertsBySeverity(alerts: any[]): Record<string, number> {
    const severities = ['critical', 'high', 'medium', 'low', 'info'];
    const grouped: Record<string, number> = {};

    for (const severity of severities) {
      grouped[severity] = alerts.filter(a => a.severity === severity).length;
    }

    return grouped;
  }

  private groupAlertsByType(alerts: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const alert of alerts) {
      grouped[alert.type] = (grouped[alert.type] || 0) + 1;
    }

    return grouped;
  }

  private buildAlertTimeline(alerts: any[]): any[] {
    const sortedAlerts = alerts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return sortedAlerts.slice(-20).map(alert => ({
      timestamp: alert.timestamp,
      severity: alert.severity,
      type: alert.type,
      title: alert.title
    }));
  }

  private getTopMigrationsByAlerts(data: DashboardTypes.DashboardData[]): any[] {
    const migrationAlertCounts: Record<string, number> = {};

    for (const item of data) {
      const alertCount = item.alerts.filter(a => a.status === 'active').length;
      migrationAlertCounts[item.migrationId] = (migrationAlertCounts[item.migrationId] || 0) + alertCount;
    }

    return Object.entries(migrationAlertCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([migrationId, alertCount]) => ({ migrationId, alertCount }));
  }

  aggregatePerformanceData(data: DashboardTypes.DashboardData[]): any {
    if (data.length === 0) return null;

    const metrics = data.map(d => d.metrics);

    return {
      throughput: this.aggregateMetricData(metrics, 'throughputPerSecond'),
      cpu: this.aggregateMetricData(metrics, 'cpuUsagePercentage'),
      memory: this.aggregateMetricData(metrics, 'memoryUsageMB'),
      network: this.aggregateMetricData(metrics, 'networkLatencyMs'),
      errors: this.aggregateCountData(metrics, 'errorCount'),
      health: this.aggregateMetricData(metrics, 'healthScore')
    };
  }

  private aggregateMetricData(metrics: any[], metricName: string): any {
    const values = metrics.map(m => m[metricName]).filter(v => typeof v === 'number');
    if (values.length === 0) return null;

    return {
      current: values[values.length - 1],
      average: this.calculateAverage(values),
      min: Math.min(...values),
      max: Math.max(...values),
      trend: this.determineTrend(values)
    };
  }

  private aggregateCountData(metrics: any[], countName: string): any {
    const values = metrics.map(m => m[countName]).filter(v => typeof v === 'number');
    if (values.length === 0) return null;

    return {
      total: values.reduce((a, b) => a + b, 0),
      average: this.calculateAverage(values),
      max: Math.max(...values),
      recent: values[values.length - 1]
    };
  }
}