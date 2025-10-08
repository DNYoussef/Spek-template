/**
 * Dashboard Exporter - Data export functionality
 * NASA Rule 10 Compliant: Focused export logic
 */

import { DashboardTypes } from '~types/DashboardTypes';

export class DashboardExporter {

  exportToCsv(data: DashboardTypes.DashboardData[]): string {
    if (data.length === 0) return '';

    const headers = this.getCsvHeaders();
    const rows = this.buildCsvRows(data);

    return this.formatCsvOutput(headers, rows);
  }

  private getCsvHeaders(): string[] {
    return [
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
  }

  private buildCsvRows(data: DashboardTypes.DashboardData[]): string[][] {
    return data.map(d => [
      d.timestamp.toISOString(),
      d.migrationId,
      d.metrics.phase,
      d.metrics.progressPercentage.toString(),
      d.metrics.cpuUsagePercentage.toString(),
      d.metrics.memoryUsageMB.toString(),
      d.metrics.networkLatencyMs.toString(),
      d.metrics.throughputPerSecond.toString(),
      d.metrics.errorCount.toString(),
      d.metrics.healthScore.toString()
    ]);
  }

  private formatCsvOutput(headers: string[], rows: string[][]): string {
    const allRows = [headers, ...rows];
    return allRows.map(row => row.join(',')).join('\n');
  }

  exportToJson(data: DashboardTypes.DashboardData[]): string {
    return JSON.stringify(data, null, 2);
  }

  exportToReport(data: DashboardTypes.DashboardData[], alerts: any[]): string {
    const summary = this.generateSummary(data, alerts);
    const sections = this.buildReportSections(summary, data, alerts);

    return sections.join('\n\n');
  }

  private generateSummary(data: DashboardTypes.DashboardData[], alerts: any[]): any {
    const migrations = this.getUniqueMigrations(data);
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');

    return {
      totalMigrations: migrations.length,
      totalDataPoints: data.length,
      totalAlerts: alerts.length,
      criticalAlerts: criticalAlerts.length,
      timeRange: this.calculateTimeRange(data)
    };
  }

  private getUniqueMigrations(data: DashboardTypes.DashboardData[]): string[] {
    return [...new Set(data.map(d => d.migrationId))];
  }

  private calculateTimeRange(data: DashboardTypes.DashboardData[]): any {
    return {
      start: data.length > 0 ? data[0].timestamp : null,
      end: data.length > 0 ? data[data.length - 1].timestamp : null
    };
  }

  private buildReportSections(summary: any, data: DashboardTypes.DashboardData[], alerts: any[]): string[] {
    return [
      this.generateExecutiveSummary(summary),
      this.generateMetricsSummary(data),
      this.generateAlertsSummary(alerts),
      this.generateHealthSummary(data),
      this.generatePerformanceSummary(data),
      this.generateRecommendations(summary, data, alerts)
    ];
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

  private generateMetricsSummary(data: DashboardTypes.DashboardData[]): string {
    if (data.length === 0) return '## Metrics Summary\n\nNo data available.';

    const metrics = this.calculateMetricAverages(data);

    return `## Metrics Summary

- **Average CPU Usage**: ${metrics.avgCpu.toFixed(2)}%
- **Average Memory Usage**: ${metrics.avgMemory.toFixed(2)}MB
- **Average Throughput**: ${metrics.avgThroughput.toFixed(2)} ops/sec
- **Average Network Latency**: ${metrics.avgLatency.toFixed(2)}ms
- **Average Health Score**: ${metrics.avgHealth.toFixed(2)}`;
  }

  private calculateMetricAverages(data: DashboardTypes.DashboardData[]): any {
    const count = data.length;

    return {
      avgCpu: data.reduce((sum, d) => sum + d.metrics.cpuUsagePercentage, 0) / count,
      avgMemory: data.reduce((sum, d) => sum + d.metrics.memoryUsageMB, 0) / count,
      avgThroughput: data.reduce((sum, d) => sum + d.metrics.throughputPerSecond, 0) / count,
      avgLatency: data.reduce((sum, d) => sum + d.metrics.networkLatencyMs, 0) / count,
      avgHealth: data.reduce((sum, d) => sum + d.metrics.healthScore, 0) / count
    };
  }

  private generateAlertsSummary(alerts: any[]): string {
    const bySeverity = this.groupAlertsBySeverity(alerts);

    return `## Alerts Summary

- **Critical**: ${bySeverity.critical}
- **High**: ${bySeverity.high}
- **Medium**: ${bySeverity.medium}
- **Low**: ${bySeverity.low}
- **Info**: ${bySeverity.info}

### Recent Critical Alerts
${this.formatRecentCriticalAlerts(alerts)}`;
  }

  private groupAlertsBySeverity(alerts: any[]): Record<string, number> {
    return {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      info: alerts.filter(a => a.severity === 'info').length
    };
  }

  private formatRecentCriticalAlerts(alerts: any[]): string {
    const criticalAlerts = alerts
      .filter(a => a.severity === 'critical')
      .slice(-5)
      .map(a => `- ${a.title} (${a.timestamp.toISOString()})`)
      .join('\n');

    return criticalAlerts || 'No critical alerts in this period.';
  }

  private generateHealthSummary(data: DashboardTypes.DashboardData[]): string {
    if (data.length === 0) return '## Health Summary\n\nNo health data available.';

    const healthStats = this.calculateHealthStatistics(data);

    return `## Health Summary

- **Overall Health Distribution**:
  - Healthy: ${healthStats.healthy}%
  - Degraded: ${healthStats.degraded}%
  - Critical: ${healthStats.critical}%
  - Unknown: ${healthStats.unknown}%

- **Component Health Trends**:
${this.formatComponentHealthTrends(data)}`;
  }

  private calculateHealthStatistics(data: DashboardTypes.DashboardData[]): any {
    const allHealthChecks = data.flatMap(d => d.healthChecks);
    const total = allHealthChecks.length;

    if (total === 0) return { healthy: 0, degraded: 0, critical: 0, unknown: 0 };

    return {
      healthy: Math.round((allHealthChecks.filter(h => h.status === 'healthy').length / total) * 100),
      degraded: Math.round((allHealthChecks.filter(h => h.status === 'degraded').length / total) * 100),
      critical: Math.round((allHealthChecks.filter(h => h.status === 'critical').length / total) * 100),
      unknown: Math.round((allHealthChecks.filter(h => h.status === 'unknown').length / total) * 100)
    };
  }

  private formatComponentHealthTrends(data: DashboardTypes.DashboardData[]): string {
    const componentStats = this.analyzeComponentHealth(data);
    return Object.entries(componentStats)
      .map(([component, stats]: [string, any]) =>
        `  - ${component}: ${stats.status} (Avg Response: ${stats.avgResponse}ms)`
      )
      .join('\n');
  }

  private analyzeComponentHealth(data: DashboardTypes.DashboardData[]): Record<string, any> {
    const componentData: Record<string, any[]> = {};

    for (const item of data) {
      for (const check of item.healthChecks) {
        if (!componentData[check.component]) {
          componentData[check.component] = [];
        }
        componentData[check.component].push(check);
      }
    }

    const componentStats: Record<string, any> = {};
    for (const [component, checks] of Object.entries(componentData)) {
      const latestCheck = checks[checks.length - 1];
      const avgResponse = checks.reduce((sum, c) => sum + c.responseTimeMs, 0) / checks.length;

      componentStats[component] = {
        status: latestCheck.status,
        avgResponse: Math.round(avgResponse)
      };
    }

    return componentStats;
  }

  private generatePerformanceSummary(data: DashboardTypes.DashboardData[]): string {
    if (data.length === 0) return '## Performance Summary\n\nNo performance data available.';

    const perfStats = this.calculatePerformanceStatistics(data);

    return `## Performance Summary

- **Throughput Performance**:
  - Current: ${perfStats.throughput.current.toFixed(2)} ops/sec
  - Average: ${perfStats.throughput.average.toFixed(2)} ops/sec
  - Peak: ${perfStats.throughput.peak.toFixed(2)} ops/sec

- **Resource Utilization**:
  - CPU Peak: ${perfStats.cpu.peak.toFixed(1)}%
  - Memory Peak: ${perfStats.memory.peak.toFixed(0)}MB
  - Network Latency Avg: ${perfStats.network.average.toFixed(1)}ms

- **Error Statistics**:
  - Total Errors: ${perfStats.errors.total}
  - Error Rate: ${perfStats.errors.rate.toFixed(2)}%`;
  }

  private calculatePerformanceStatistics(data: DashboardTypes.DashboardData[]): any {
    const metrics = data.map(d => d.metrics);

    const throughputs = metrics.map(m => m.throughputPerSecond);
    const cpuUsages = metrics.map(m => m.cpuUsagePercentage);
    const memoryUsages = metrics.map(m => m.memoryUsageMB);
    const latencies = metrics.map(m => m.networkLatencyMs);
    const errors = metrics.map(m => m.errorCount);

    const totalOperations = metrics.reduce((sum, m) => sum + (m.successCount || 0) + m.errorCount, 0);
    const totalErrors = errors.reduce((sum, e) => sum + e, 0);

    return {
      throughput: {
        current: throughputs[throughputs.length - 1] || 0,
        average: throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length,
        peak: Math.max(...throughputs)
      },
      cpu: {
        peak: Math.max(...cpuUsages)
      },
      memory: {
        peak: Math.max(...memoryUsages)
      },
      network: {
        average: latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      },
      errors: {
        total: totalErrors,
        rate: totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0
      }
    };
  }

  private generateRecommendations(summary: any, data: DashboardTypes.DashboardData[], alerts: any[]): string {
    const recommendations = this.analyzeAndGenerateRecommendations(summary, data, alerts);

    return `## Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

- Monitor trends for proactive intervention
- Review alert thresholds if noise is high
- Consider scaling resources if performance degrades
- Implement automated remediation for common issues`;
  }

  private analyzeAndGenerateRecommendations(summary: any, data: DashboardTypes.DashboardData[], alerts: any[]): string[] {
    const recommendations: string[] = [];

    if (summary.criticalAlerts > 0) {
      recommendations.push('Address critical alerts immediately - system stability at risk');
    }

    if (summary.totalAlerts > summary.totalMigrations * 5) {
      recommendations.push('Review alert thresholds to reduce noise and improve signal quality');
    }

    if (data.length > 0) {
      const recentMetrics = data[data.length - 1].metrics;

      if (recentMetrics.cpuUsagePercentage > 85) {
        recommendations.push('CPU usage is high - consider scaling compute resources');
      }

      if (recentMetrics.memoryUsageMB > 1500) {
        recommendations.push('Memory usage is elevated - monitor for potential leaks');
      }

      if (recentMetrics.networkLatencyMs > 800) {
        recommendations.push('Network latency is high - investigate network bottlenecks');
      }

      if (recentMetrics.errorCount > 0) {
        recommendations.push('Errors detected - review logs and implement error handling improvements');
      }

      if (recentMetrics.healthScore < 0.8) {
        recommendations.push('System health score is low - conduct comprehensive health check');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('System operating within normal parameters - continue monitoring');
    }

    return recommendations;
  }

  exportToXml(data: DashboardTypes.DashboardData[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const rootOpen = '<dashboard-export>';
    const rootClose = '</dashboard-export>';

    const xmlData = data.map(item => this.formatDataItemAsXml(item)).join('\n');

    return `${xmlHeader}\n${rootOpen}\n${xmlData}\n${rootClose}`;
  }

  private formatDataItemAsXml(item: DashboardTypes.DashboardData): string {
    return `  <data-point>
    <timestamp>${item.timestamp.toISOString()}</timestamp>
    <migration-id>${item.migrationId}</migration-id>
    <metrics>
      <phase>${item.metrics.phase}</phase>
      <progress>${item.metrics.progressPercentage}</progress>
      <cpu-usage>${item.metrics.cpuUsagePercentage}</cpu-usage>
      <memory-usage>${item.metrics.memoryUsageMB}</memory-usage>
      <network-latency>${item.metrics.networkLatencyMs}</network-latency>
      <throughput>${item.metrics.throughputPerSecond}</throughput>
      <error-count>${item.metrics.errorCount}</error-count>
      <health-score>${item.metrics.healthScore}</health-score>
    </metrics>
  </data-point>`;
  }
}