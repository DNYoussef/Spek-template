/**
 * Widget Renderer - Renders dashboard widgets
 * NASA Rule 10 Compliant: Focused rendering logic
 */

import { DashboardTypes } from '~types/DashboardTypes';
import { MigrationMetrics, MigrationHealthCheck } from '../../monitoring/MigrationMonitor';

export class WidgetRenderer {

  renderMetricsChart(widget: DashboardTypes.DashboardWidget, data: DashboardTypes.DashboardData): any {
    const config = widget.configuration as DashboardTypes.ChartConfiguration;
    const chartData = this.extractChartData(data, config);

    return this.buildChartOutput(config, chartData);
  }

  private extractChartData(data: DashboardTypes.DashboardData, config: DashboardTypes.ChartConfiguration): DashboardTypes.ChartDataPoint[] {
    const metric = config.yAxis[0];
    const value = (data.metrics as any)[metric] || 0;

    return [{
      timestamp: data.timestamp,
      value,
      metadata: { migrationId: data.migrationId }
    }];
  }

  private buildChartOutput(config: DashboardTypes.ChartConfiguration, chartData: DashboardTypes.ChartDataPoint[]): any {
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
      options: this.buildChartOptions(config)
    };
  }

  private buildChartOptions(config: DashboardTypes.ChartConfiguration): any {
    return {
      responsive: true,
      plugins: {
        legend: { display: config.showLegend },
        tooltip: { enabled: config.showTooltips }
      },
      scales: {
        x: { display: true, title: { display: true, text: config.xAxis } },
        y: { display: true, title: { display: true, text: config.yAxis.join(', ') } }
      }
    };
  }

  renderHealthStatus(widget: DashboardTypes.DashboardWidget, data: DashboardTypes.DashboardData): any {
    const healthChecks = data.healthChecks;
    const overallStatus = this.calculateOverallHealth(healthChecks);

    return {
      overallStatus,
      components: this.mapHealthComponents(healthChecks),
      summary: this.buildHealthSummary(healthChecks)
    };
  }

  private mapHealthComponents(healthChecks: MigrationHealthCheck[]): any[] {
    return healthChecks.map(check => ({
      name: check.component,
      status: check.status,
      responseTime: check.responseTimeMs,
      errorRate: check.errorRate,
      lastCheck: check.lastCheck,
      statusColor: this.getStatusColor(check.status)
    }));
  }

  private buildHealthSummary(healthChecks: MigrationHealthCheck[]): any {
    return {
      healthy: healthChecks.filter(c => c.status === 'healthy').length,
      degraded: healthChecks.filter(c => c.status === 'degraded').length,
      critical: healthChecks.filter(c => c.status === 'critical').length,
      unknown: healthChecks.filter(c => c.status === 'unknown').length
    };
  }

  renderAlertSummary(widget: DashboardTypes.DashboardWidget, data: DashboardTypes.DashboardData): any {
    const alerts = data.alerts;
    const activeAlerts = alerts.filter(a => a.status === 'active');

    return {
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
      recentAlerts: this.buildRecentAlerts(alerts),
      severityDistribution: this.buildSeverityDistribution(alerts)
    };
  }

  private buildRecentAlerts(alerts: any[]): any[] {
    return alerts.slice(-10).map(alert => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      timestamp: alert.timestamp,
      status: alert.status
    }));
  }

  private buildSeverityDistribution(alerts: any[]): any {
    return {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      info: alerts.filter(a => a.severity === 'info').length
    };
  }

  renderMigrationProgress(widget: DashboardTypes.DashboardWidget, data: DashboardTypes.DashboardData): any {
    const metrics = data.metrics;

    return {
      migrationId: metrics.migrationId,
      currentPhase: metrics.phase,
      progressPercentage: metrics.progressPercentage,
      elapsedTime: this.formatDuration(metrics.elapsedMs),
      estimatedRemaining: this.calculateEstimatedRemaining(metrics),
      throughput: `${metrics.throughputPerSecond.toFixed(2)}/sec`,
      healthScore: metrics.healthScore,
      status: this.getProgressStatus(metrics),
      timeline: this.generateTimeline(metrics)
    };
  }

  private calculateEstimatedRemaining(metrics: MigrationMetrics): string {
    return metrics.estimatedRemainingMs > 0
      ? this.formatDuration(metrics.estimatedRemainingMs)
      : 'Unknown';
  }

  renderSystemOverview(widget: DashboardTypes.DashboardWidget, data: DashboardTypes.DashboardData): any {
    const metrics = data.metrics;

    return {
      systemHealth: this.buildSystemHealth(metrics),
      performance: this.buildPerformanceMetrics(metrics),
      connections: this.buildConnectionInfo(metrics)
    };
  }

  private buildSystemHealth(metrics: MigrationMetrics): any {
    return {
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
    };
  }

  private buildPerformanceMetrics(metrics: MigrationMetrics): any {
    return {
      throughput: metrics.throughputPerSecond,
      errors: metrics.errorCount,
      warnings: metrics.warningCount,
      successes: metrics.successCount
    };
  }

  private buildConnectionInfo(metrics: MigrationMetrics): any {
    return {
      active: metrics.activeConnections,
      status: this.getConnectionStatus(metrics.activeConnections)
    };
  }

  renderThroughputGauge(widget: DashboardTypes.DashboardWidget, data: DashboardTypes.DashboardData): any {
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

  // Utility Methods
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
    return this.getColorForMetric(metric) + '20';
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