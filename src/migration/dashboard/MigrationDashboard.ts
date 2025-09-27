import { EventEmitter } from 'events';
import { MigrationMonitor, MigrationMetrics, MigrationHealthCheck, AggregatedMetrics } from '../monitoring/MigrationMonitor';
import { AlertManager, Alert, AlertStatistics } from '../alerting/AlertManager';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  configuration: Record<string, any>;
  refreshIntervalMs: number;
  enabled: boolean;
  permissions: string[];
}

export type WidgetType =
  | 'metrics_chart'
  | 'health_status'
  | 'alert_summary'
  | 'migration_progress'
  | 'system_overview'
  | 'throughput_gauge'
  | 'error_rate_chart'
  | 'latency_histogram'
  | 'resource_utilization'
  | 'custom_metric'
  | 'log_viewer'
  | 'escalation_matrix';

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  defaultLayout: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  tags: string[];
}

export interface DashboardData {
  timestamp: Date;
  migrationId: string;
  metrics: MigrationMetrics;
  healthChecks: MigrationHealthCheck[];
  alerts: Alert[];
  aggregatedMetrics: Record<string, AggregatedMetrics>;
  customData: Record<string, any>;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'area' | 'pie' | 'gauge' | 'heatmap';
  xAxis: string;
  yAxis: string[];
  timeRange: string;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  refreshRate: number;
  colorScheme: string;
  showLegend: boolean;
  showTooltips: boolean;
}

export interface FilterCriteria {
  migrationIds?: string[];
  timeRange?: { start: Date; end: Date };
  severity?: string[];
  alertTypes?: string[];
  healthStatus?: string[];
  tags?: string[];
}

export interface DashboardConfiguration {
  title: string;
  description: string;
  autoRefresh: boolean;
  refreshIntervalMs: number;
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  enableNotifications: boolean;
  enableExport: boolean;
  maxDataPoints: number;
  retentionDays: number;
}

export class WidgetRenderer {
  renderMetricsChart(widget: DashboardWidget, data: DashboardData): any {
    const config = widget.configuration as ChartConfiguration;
    const chartData = this.extractChartData(data, config);

    return {
      type: config.type,
      data: {
        labels: chartData.map(point => point.timestamp.toISOString()),
        datasets: config.yAxis.map(metric => ({
          label: metric,
          data: chartData.map(point => point.value),
          borderColor: this.getColorForMetric(metric),
          backgroundColor: this.getBackgroundColorForMetric(metric),
          fill: config.type === 'area'
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: config.showLegend },
          tooltip: { enabled: config.showTooltips }
        },
        scales: {
          x: { display: true, title: { display: true, text: config.xAxis } },
          y: { display: true, title: { display: true, text: config.yAxis.join(', ') } }
        }
      }
    };
  }

  renderHealthStatus(widget: DashboardWidget, data: DashboardData): any {
    const healthChecks = data.healthChecks;
    const overallStatus = this.calculateOverallHealth(healthChecks);

    return {
      overallStatus,
      components: healthChecks.map(check => ({
        name: check.component,
        status: check.status,
        responseTime: check.responseTimeMs,
        errorRate: check.errorRate,
        lastCheck: check.lastCheck,
        statusColor: this.getStatusColor(check.status)
      })),
      summary: {
        healthy: healthChecks.filter(c => c.status === 'healthy').length,
        degraded: healthChecks.filter(c => c.status === 'degraded').length,
        critical: healthChecks.filter(c => c.status === 'critical').length,
        unknown: healthChecks.filter(c => c.status === 'unknown').length
      }
    };
  }

  renderAlertSummary(widget: DashboardWidget, data: DashboardData): any {
    const alerts = data.alerts;
    const activeAlerts = alerts.filter(a => a.status === 'active');

    return {
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
      recentAlerts: alerts.slice(-10).map(alert => ({
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        timestamp: alert.timestamp,
        status: alert.status
      })),
      severityDistribution: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
        info: alerts.filter(a => a.severity === 'info').length
      }
    };
  }

  renderMigrationProgress(widget: DashboardWidget, data: DashboardData): any {
    const metrics = data.metrics;

    return {
      migrationId: metrics.migrationId,
      currentPhase: metrics.phase,
      progressPercentage: metrics.progressPercentage,
      elapsedTime: this.formatDuration(metrics.elapsedMs),
      estimatedRemaining: metrics.estimatedRemainingMs > 0
        ? this.formatDuration(metrics.estimatedRemainingMs)
        : 'Unknown',
      throughput: `${metrics.throughputPerSecond.toFixed(2)}/sec`,
      healthScore: metrics.healthScore,
      status: this.getProgressStatus(metrics),
      timeline: this.generateTimeline(metrics)
    };
  }

  renderSystemOverview(widget: DashboardWidget, data: DashboardData): any {
    const metrics = data.metrics;

    return {
      systemHealth: {
        cpu: {
          usage: metrics.cpuUsagePercentage,
          status: this.getCpuStatus(metrics.cpuUsagePercentage)
        },
        memory: {
          usage: metrics.memoryUsageMB,
          status: this.getMemoryStatus(metrics.memoryUsageMB)
        },
        network: {
          latency: metrics.networkLatencyMs,
          status: this.getNetworkStatus(metrics.networkLatencyMs)
        },
        system: {
          load: metrics.systemLoad,
          status: this.getSystemLoadStatus(metrics.systemLoad)
        }
      },
      performance: {
        throughput: metrics.throughputPerSecond,
        errors: metrics.errorCount,
        warnings: metrics.warningCount,
        successes: metrics.successCount
      },
      connections: {
        active: metrics.activeConnections,
        status: this.getConnectionStatus(metrics.activeConnections)
      }
    };
  }

  renderThroughputGauge(widget: DashboardWidget, data: DashboardData): any {
    const currentThroughput = data.metrics.throughputPerSecond;
    const maxThroughput = widget.configuration.maxThroughput || 1000;

    return {
      value: currentThroughput,
      max: maxThroughput,
      percentage: (currentThroughput / maxThroughput) * 100,
      status: this.getThroughputStatus(currentThroughput, maxThroughput),
      color: this.getThroughputColor(currentThroughput, maxThroughput),
      label: `${currentThroughput.toFixed(2)} ops/sec`
    };
  }

  private extractChartData(data: DashboardData, config: ChartConfiguration): ChartDataPoint[] {
    const metric = config.yAxis[0];
    const value = (data.metrics as any)[metric] || 0;

    return [{
      timestamp: data.timestamp,
      value,
      metadata: { migrationId: data.migrationId }
    }];
  }

  private getColorForMetric(metric: string): string {
    const colors: Record<string, string> = {
      cpuUsagePercentage: '#FF6384',
      memoryUsageMB: '#36A2EB',
      networkLatencyMs: '#FFCE56',
      throughputPerSecond: '#4BC0C0',
      errorCount: '#FF9F40',
      healthScore: '#9966FF'
    };
    return colors[metric] || '#999999';
  }

  private getBackgroundColorForMetric(metric: string): string {
    const color = this.getColorForMetric(metric);
    return color + '20';
  }

  private calculateOverallHealth(healthChecks: MigrationHealthCheck[]): string {
    if (healthChecks.some(c => c.status === 'critical')) return 'critical';
    if (healthChecks.some(c => c.status === 'degraded')) return 'degraded';
    if (healthChecks.every(c => c.status === 'healthy')) return 'healthy';
    return 'unknown';
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      healthy: '#28a745',
      degraded: '#ffc107',
      critical: '#dc3545',
      unknown: '#6c757d'
    };
    return colors[status] || '#6c757d';
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private getProgressStatus(metrics: MigrationMetrics): string {
    if (metrics.errorCount > 0) return 'error';
    if (metrics.progressPercentage >= 100) return 'completed';
    if (metrics.progressPercentage > 0) return 'in_progress';
    return 'pending';
  }

  private generateTimeline(metrics: MigrationMetrics): any[] {
    return [
      {
        phase: 'Planning',
        status: 'completed',
        timestamp: new Date(metrics.startTime.getTime() - 60000)
      },
      {
        phase: 'Preparation',
        status: 'completed',
        timestamp: metrics.startTime
      },
      {
        phase: metrics.phase,
        status: 'in_progress',
        timestamp: new Date()
      }
    ];
  }

  private getCpuStatus(usage: number): string {
    if (usage > 90) return 'critical';
    if (usage > 70) return 'warning';
    return 'normal';
  }

  private getMemoryStatus(usage: number): string {
    if (usage > 2048) return 'critical';
    if (usage > 1024) return 'warning';
    return 'normal';
  }

  private getNetworkStatus(latency: number): string {
    if (latency > 1000) return 'critical';
    if (latency > 500) return 'warning';
    return 'normal';
  }

  private getSystemLoadStatus(load: number): string {
    if (load > 8) return 'critical';
    if (load > 4) return 'warning';
    return 'normal';
  }

  private getConnectionStatus(connections: number): string {
    if (connections > 1000) return 'high';
    if (connections > 100) return 'medium';
    return 'low';
  }

  private getThroughputStatus(current: number, max: number): string {
    const percentage = (current / max) * 100;
    if (percentage > 90) return 'excellent';
    if (percentage > 70) return 'good';
    if (percentage > 50) return 'fair';
    return 'poor';
  }

  private getThroughputColor(current: number, max: number): string {
    const percentage = (current / max) * 100;
    if (percentage > 90) return '#28a745';
    if (percentage > 70) return '#ffc107';
    if (percentage > 50) return '#fd7e14';
    return '#dc3545';
  }
}

export class DashboardDataAggregator {
  aggregateMetricsByTime(metrics: MigrationMetrics[], timeWindowMs: number): Record<string, AggregatedMetrics> {
    const aggregated: Record<string, AggregatedMetrics> = {};
    const metricNames = ['cpuUsagePercentage', 'memoryUsageMB', 'networkLatencyMs', 'throughputPerSecond'];

    for (const metricName of metricNames) {
      const values = metrics.map(m => (m as any)[metricName]).filter(v => typeof v === 'number');
      if (values.length === 0) continue;

      values.sort((a, b) => a - b);

      aggregated[metricName] = {
        metric: metricName,
        timeWindow: `${timeWindowMs}ms`,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        minimum: values[0],
        maximum: values[values.length - 1],
        percentile50: values[Math.floor(values.length * 0.5)],
        percentile95: values[Math.floor(values.length * 0.95)],
        percentile99: values[Math.floor(values.length * 0.99)],
        standardDeviation: this.calculateStandardDeviation(values),
        dataPoints: metrics.map(m => ({
          timestamp: m.currentTime,
          value: (m as any)[metricName],
          metadata: { migrationId: m.migrationId }
        }))
      };
    }

    return aggregated;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  filterDataByMigration(data: DashboardData[], migrationIds: string[]): DashboardData[] {
    return data.filter(d => migrationIds.includes(d.migrationId));
  }

  filterDataByTimeRange(data: DashboardData[], start: Date, end: Date): DashboardData[] {
    return data.filter(d => d.timestamp >= start && d.timestamp <= end);
  }

  groupDataByMigration(data: DashboardData[]): Record<string, DashboardData[]> {
    const grouped: Record<string, DashboardData[]> = {};

    for (const item of data) {
      if (!grouped[item.migrationId]) {
        grouped[item.migrationId] = [];
      }
      grouped[item.migrationId].push(item);
    }

    return grouped;
  }
}

export class DashboardExporter {
  exportToCsv(data: DashboardData[]): string {
    if (data.length === 0) return '';

    const headers = [
      'timestamp',
      'migrationId',
      'phase',
      'progressPercentage',
      'cpuUsagePercentage',
      'memoryUsageMB',
      'networkLatencyMs',
      'throughputPerSecond',
      'errorCount',
      'healthScore'
    ];

    const rows = data.map(d => [
      d.timestamp.toISOString(),
      d.migrationId,
      d.metrics.phase,
      d.metrics.progressPercentage,
      d.metrics.cpuUsagePercentage,
      d.metrics.memoryUsageMB,
      d.metrics.networkLatencyMs,
      d.metrics.throughputPerSecond,
      d.metrics.errorCount,
      d.metrics.healthScore
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  exportToJson(data: DashboardData[]): string {
    return JSON.stringify(data, null, 2);
  }

  exportToReport(data: DashboardData[], alerts: Alert[]): string {
    const summary = this.generateSummary(data, alerts);
    const sections = [
      this.generateExecutiveSummary(summary),
      this.generateMetricsSummary(data),
      this.generateAlertsSummary(alerts),
      this.generateRecommendations(summary)
    ];

    return sections.join('\n\n');
  }

  private generateSummary(data: DashboardData[], alerts: Alert[]): any {
    const migrations = [...new Set(data.map(d => d.migrationId))];
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');

    return {
      totalMigrations: migrations.length,
      totalDataPoints: data.length,
      totalAlerts: alerts.length,
      criticalAlerts: criticalAlerts.length,
      timeRange: {
        start: data.length > 0 ? data[0].timestamp : null,
        end: data.length > 0 ? data[data.length - 1].timestamp : null
      }
    };
  }

  private generateExecutiveSummary(summary: any): string {
    return `# Migration Dashboard Report

## Executive Summary

- **Total Migrations**: ${summary.totalMigrations}
- **Data Points Collected**: ${summary.totalDataPoints}
- **Total Alerts**: ${summary.totalAlerts}
- **Critical Alerts**: ${summary.criticalAlerts}
- **Report Period**: ${summary.timeRange.start} to ${summary.timeRange.end}`;
  }

  private generateMetricsSummary(data: DashboardData[]): string {
    if (data.length === 0) return '## Metrics Summary\n\nNo data available.';

    const avgCpu = data.reduce((sum, d) => sum + d.metrics.cpuUsagePercentage, 0) / data.length;
    const avgMemory = data.reduce((sum, d) => sum + d.metrics.memoryUsageMB, 0) / data.length;
    const avgThroughput = data.reduce((sum, d) => sum + d.metrics.throughputPerSecond, 0) / data.length;

    return `## Metrics Summary

- **Average CPU Usage**: ${avgCpu.toFixed(2)}%
- **Average Memory Usage**: ${avgMemory.toFixed(2)}MB
- **Average Throughput**: ${avgThroughput.toFixed(2)} ops/sec`;
  }

  private generateAlertsSummary(alerts: Alert[]): string {
    const bySeverity = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    };

    return `## Alerts Summary

- **Critical**: ${bySeverity.critical}
- **High**: ${bySeverity.high}
- **Medium**: ${bySeverity.medium}
- **Low**: ${bySeverity.low}`;
  }

  private generateRecommendations(summary: any): string {
    const recommendations = [];

    if (summary.criticalAlerts > 0) {
      recommendations.push('- Address critical alerts immediately');
    }

    if (summary.totalAlerts > summary.totalMigrations * 5) {
      recommendations.push('- Review alert thresholds to reduce noise');
    }

    recommendations.push('- Monitor trends for proactive intervention');

    return `## Recommendations\n\n${recommendations.join('\n')}`;
  }
}

export class MigrationDashboard extends EventEmitter {
  private monitor: MigrationMonitor;
  private alertManager: AlertManager;
  private renderer: WidgetRenderer;
  private aggregator: DashboardDataAggregator;
  private exporter: DashboardExporter;
  private layouts: Map<string, DashboardLayout> = new Map();
  private activeLayout: DashboardLayout | null = null;
  private dashboardData: Map<string, DashboardData[]> = new Map();
  private configuration: DashboardConfiguration;
  private refreshTimers: Map<string, NodeJS.Timer> = new Map();

  constructor(
    monitor: MigrationMonitor,
    alertManager: AlertManager,
    configuration: DashboardConfiguration
  ) {
    super();
    this.monitor = monitor;
    this.alertManager = alertManager;
    this.configuration = configuration;
    this.renderer = new WidgetRenderer();
    this.aggregator = new DashboardDataAggregator();
    this.exporter = new DashboardExporter();

    this.setupEventListeners();
    this.createDefaultLayouts();
  }

  private setupEventListeners(): void {
    this.monitor.on('metricsCollected', (event) => {
      this.onMetricsCollected(event.migrationId, event.metrics);
    });

    this.monitor.on('healthChecksCompleted', (event) => {
      this.onHealthChecksCompleted(event.migrationId, event.healthChecks);
    });

    this.alertManager.on('alertCreated', (alert) => {
      this.onAlertCreated(alert);
    });

    this.alertManager.on('alertResolved', (event) => {
      this.onAlertResolved(event.alert);
    });
  }

  private createDefaultLayouts(): void {
    const defaultLayout: DashboardLayout = {
      id: 'default',
      name: 'Default Layout',
      description: 'Standard migration monitoring layout',
      widgets: [
        {
          id: 'migration_progress',
          type: 'migration_progress',
          title: 'Migration Progress',
          position: { x: 0, y: 0, width: 6, height: 4 },
          configuration: {},
          refreshIntervalMs: 5000,
          enabled: true,
          permissions: ['read']
        },
        {
          id: 'system_overview',
          type: 'system_overview',
          title: 'System Overview',
          position: { x: 6, y: 0, width: 6, height: 4 },
          configuration: {},
          refreshIntervalMs: 10000,
          enabled: true,
          permissions: ['read']
        },
        {
          id: 'alert_summary',
          type: 'alert_summary',
          title: 'Alert Summary',
          position: { x: 0, y: 4, width: 4, height: 4 },
          configuration: {},
          refreshIntervalMs: 15000,
          enabled: true,
          permissions: ['read']
        },
        {
          id: 'health_status',
          type: 'health_status',
          title: 'Health Status',
          position: { x: 4, y: 4, width: 4, height: 4 },
          configuration: {},
          refreshIntervalMs: 10000,
          enabled: true,
          permissions: ['read']
        },
        {
          id: 'throughput_gauge',
          type: 'throughput_gauge',
          title: 'Throughput',
          position: { x: 8, y: 4, width: 4, height: 4 },
          configuration: { maxThroughput: 1000 },
          refreshIntervalMs: 5000,
          enabled: true,
          permissions: ['read']
        }
      ],
      defaultLayout: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      tags: ['default', 'monitoring']
    };

    this.layouts.set(defaultLayout.id, defaultLayout);
    this.activeLayout = defaultLayout;
  }

  private onMetricsCollected(migrationId: string, metrics: MigrationMetrics): void {
    const healthChecks = this.monitor.getHealthStatus(migrationId);
    const alerts = this.alertManager.getAlertsByMigration(migrationId);

    const dashboardData: DashboardData = {
      timestamp: new Date(),
      migrationId,
      metrics,
      healthChecks,
      alerts,
      aggregatedMetrics: {},
      customData: {}
    };

    this.storeDashboardData(migrationId, dashboardData);
    this.emit('dashboardDataUpdated', { migrationId, data: dashboardData });
  }

  private onHealthChecksCompleted(migrationId: string, healthChecks: MigrationHealthCheck[]): void {
    this.emit('healthStatusUpdated', { migrationId, healthChecks });
  }

  private onAlertCreated(alert: Alert): void {
    this.emit('alertCreated', alert);
  }

  private onAlertResolved(alert: Alert): void {
    this.emit('alertResolved', alert);
  }

  private storeDashboardData(migrationId: string, data: DashboardData): void {
    if (!this.dashboardData.has(migrationId)) {
      this.dashboardData.set(migrationId, []);
    }

    const dataArray = this.dashboardData.get(migrationId)!;
    dataArray.push(data);

    const retentionTimestamp = new Date(Date.now() - this.configuration.retentionDays * 24 * 60 * 60 * 1000);
    const filteredData = dataArray.filter(d => d.timestamp >= retentionTimestamp);

    if (filteredData.length > this.configuration.maxDataPoints) {
      filteredData.splice(0, filteredData.length - this.configuration.maxDataPoints);
    }

    this.dashboardData.set(migrationId, filteredData);
  }

  createLayout(layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'lastModified'>): string {
    const id = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newLayout: DashboardLayout = {
      ...layout,
      id,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.layouts.set(id, newLayout);
    this.emit('layoutCreated', newLayout);
    return id;
  }

  updateLayout(layoutId: string, updates: Partial<DashboardLayout>): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const updatedLayout = {
      ...layout,
      ...updates,
      lastModified: new Date()
    };

    this.layouts.set(layoutId, updatedLayout);

    if (this.activeLayout?.id === layoutId) {
      this.activeLayout = updatedLayout;
    }

    this.emit('layoutUpdated', updatedLayout);
    return true;
  }

  deleteLayout(layoutId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout || layout.defaultLayout) return false;

    this.layouts.delete(layoutId);

    if (this.activeLayout?.id === layoutId) {
      this.activeLayout = this.layouts.get('default') || null;
    }

    this.emit('layoutDeleted', { layoutId });
    return true;
  }

  setActiveLayout(layoutId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    this.activeLayout = layout;
    this.emit('activeLayoutChanged', layout);
    return true;
  }

  addWidget(layoutId: string, widget: DashboardWidget): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    layout.widgets.push(widget);
    layout.lastModified = new Date();

    this.layouts.set(layoutId, layout);
    this.emit('widgetAdded', { layoutId, widget });
    return true;
  }

  updateWidget(layoutId: string, widgetId: string, updates: Partial<DashboardWidget>): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const widgetIndex = layout.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return false;

    layout.widgets[widgetIndex] = { ...layout.widgets[widgetIndex], ...updates };
    layout.lastModified = new Date();

    this.layouts.set(layoutId, layout);
    this.emit('widgetUpdated', { layoutId, widgetId, widget: layout.widgets[widgetIndex] });
    return true;
  }

  removeWidget(layoutId: string, widgetId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const initialLength = layout.widgets.length;
    layout.widgets = layout.widgets.filter(w => w.id !== widgetId);

    if (layout.widgets.length === initialLength) return false;

    layout.lastModified = new Date();
    this.layouts.set(layoutId, layout);
    this.emit('widgetRemoved', { layoutId, widgetId });
    return true;
  }

  renderWidget(widgetId: string, migrationId?: string): any {
    if (!this.activeLayout) return null;

    const widget = this.activeLayout.widgets.find(w => w.id === widgetId);
    if (!widget || !widget.enabled) return null;

    const data = migrationId ? this.getDashboardData(migrationId) : this.getAllDashboardData();
    if (!data || (Array.isArray(data) && data.length === 0)) return null;

    const latestData = Array.isArray(data) ? data[data.length - 1] : data;

    switch (widget.type) {
      case 'metrics_chart':
        return this.renderer.renderMetricsChart(widget, latestData);
      case 'health_status':
        return this.renderer.renderHealthStatus(widget, latestData);
      case 'alert_summary':
        return this.renderer.renderAlertSummary(widget, latestData);
      case 'migration_progress':
        return this.renderer.renderMigrationProgress(widget, latestData);
      case 'system_overview':
        return this.renderer.renderSystemOverview(widget, latestData);
      case 'throughput_gauge':
        return this.renderer.renderThroughputGauge(widget, latestData);
      default:
        return { error: `Unknown widget type: ${widget.type}` };
    }
  }

  getDashboardData(migrationId: string, filter?: FilterCriteria): DashboardData[] {
    let data = this.dashboardData.get(migrationId) || [];

    if (filter) {
      data = this.applyFilter(data, filter);
    }

    return data;
  }

  getAllDashboardData(filter?: FilterCriteria): DashboardData[] {
    let allData: DashboardData[] = [];

    for (const [, data] of this.dashboardData) {
      allData.push(...data);
    }

    allData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (filter) {
      allData = this.applyFilter(allData, filter);
    }

    return allData;
  }

  private applyFilter(data: DashboardData[], filter: FilterCriteria): DashboardData[] {
    let filtered = data;

    if (filter.migrationIds) {
      filtered = this.aggregator.filterDataByMigration(filtered, filter.migrationIds);
    }

    if (filter.timeRange) {
      filtered = this.aggregator.filterDataByTimeRange(filtered, filter.timeRange.start, filter.timeRange.end);
    }

    if (filter.severity) {
      filtered = filtered.filter(d =>
        d.alerts.some(a => filter.severity!.includes(a.severity))
      );
    }

    if (filter.alertTypes) {
      filtered = filtered.filter(d =>
        d.alerts.some(a => filter.alertTypes!.includes(a.type))
      );
    }

    if (filter.healthStatus) {
      filtered = filtered.filter(d =>
        d.healthChecks.some(h => filter.healthStatus!.includes(h.status))
      );
    }

    return filtered;
  }

  getLayouts(): DashboardLayout[] {
    return Array.from(this.layouts.values());
  }

  getActiveLayout(): DashboardLayout | null {
    return this.activeLayout;
  }

  exportData(format: 'csv' | 'json' | 'report', migrationId?: string): string {
    const data = migrationId ? this.getDashboardData(migrationId) : this.getAllDashboardData();
    const alerts = migrationId
      ? this.alertManager.getAlertsByMigration(migrationId)
      : this.alertManager.getActiveAlerts();

    switch (format) {
      case 'csv':
        return this.exporter.exportToCsv(data);
      case 'json':
        return this.exporter.exportToJson(data);
      case 'report':
        return this.exporter.exportToReport(data, alerts);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  startAutoRefresh(): void {
    if (!this.configuration.autoRefresh) return;

    const refreshTimer = setInterval(() => {
      this.emit('autoRefresh');
    }, this.configuration.refreshIntervalMs);

    this.refreshTimers.set('global', refreshTimer);
  }

  stopAutoRefresh(): void {
    const timer = this.refreshTimers.get('global');
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete('global');
    }
  }

  updateConfiguration(updates: Partial<DashboardConfiguration>): void {
    this.configuration = { ...this.configuration, ...updates };
    this.emit('configurationUpdated', this.configuration);
  }

  getConfiguration(): DashboardConfiguration {
    return { ...this.configuration };
  }

  cleanup(): void {
    for (const [, timer] of this.refreshTimers) {
      clearInterval(timer);
    }

    this.refreshTimers.clear();
    this.dashboardData.clear();
    this.layouts.clear();
    this.activeLayout = null;
    this.removeAllListeners();
  }
}