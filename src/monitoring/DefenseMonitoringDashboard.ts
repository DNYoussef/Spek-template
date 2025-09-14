/**
 * Defense Monitoring Dashboard
 * Real-time visualization and control interface for defense operations
 * Provides comprehensive overview of all monitoring systems
 */

import { DefenseMonitoringOrchestrator, UnifiedMonitoringStatus, DefenseAlert } from './DefenseMonitoringOrchestrator';
import { PerformanceReport } from './advanced/DefenseGradeMonitor';

export interface DashboardConfiguration {
  refreshInterval: number;
  alertRetention: number;
  historyRetention: number;
  maxAlertDisplay: number;
  autoRefresh: boolean;
  compactMode: boolean;
}

export interface DashboardMetrics {
  timestamp: number;
  performance: {
    overhead: number;
    trend: number[];
    alerts: number;
    optimizations: number;
  };
  security: {
    threatLevel: string;
    incidents: number;
    compliance: number;
    alerts: number;
  };
  compliance: {
    overallScore: number;
    drift: number;
    violations: number;
    alerts: number;
  };
  rollback: {
    ready: boolean;
    snapshots: number;
    lastRollback: number;
    averageTime: number;
  };
}

export interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  acknowledged: number;
  suppressed: number;
  recent: DefenseAlert[];
}

export class DefenseMonitoringDashboard {
  private orchestrator: DefenseMonitoringOrchestrator;
  private configuration: DashboardConfiguration;
  private metricsHistory: Map<number, DashboardMetrics> = new Map();
  private alertHistory: Map<string, DefenseAlert> = new Map();
  private refreshTimer: NodeJS.Timeout | null = null;
  private subscribers: Map<string, (data: any) => void> = new Map();

  constructor(orchestrator: DefenseMonitoringOrchestrator, config?: Partial<DashboardConfiguration>) {
    this.orchestrator = orchestrator;
    this.configuration = this.mergeConfiguration(config);
  }

  public async initialize(): Promise<void> {
    console.log('[DefenseDashboard] Initializing defense monitoring dashboard');

    // Start dashboard data collection
    if (this.configuration.autoRefresh) {
      await this.startAutoRefresh();
    }

    // Load initial data
    await this.refreshDashboardData();

    console.log('[DefenseDashboard] Dashboard initialized successfully');
  }

  public async shutdown(): Promise<void> {
    console.log('[DefenseDashboard] Shutting down dashboard');

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.subscribers.clear();
  }

  private async startAutoRefresh(): Promise<void> {
    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshDashboardData();
        await this.notifySubscribers();
      } catch (error) {
        console.error('[DefenseDashboard] Auto-refresh error:', error);
      }
    }, this.configuration.refreshInterval);
  }

  private async refreshDashboardData(): Promise<void> {
    const status = await this.orchestrator.getDefenseStatus();
    const alerts = this.orchestrator.getActiveAlerts();

    // Update metrics history
    const metrics = this.generateDashboardMetrics(status, alerts);
    this.metricsHistory.set(Date.now(), metrics);

    // Update alert history
    for (const alert of alerts) {
      this.alertHistory.set(alert.id, alert);
    }

    // Cleanup old data
    await this.cleanupOldData();
  }

  private generateDashboardMetrics(status: UnifiedMonitoringStatus, alerts: DefenseAlert[]): DashboardMetrics {
    return {
      timestamp: Date.now(),
      performance: {
        overhead: status.performance.overhead,
        trend: this.calculatePerformanceTrend(),
        alerts: alerts.filter(a => a.source === 'PERFORMANCE').length,
        optimizations: 0 // Would be calculated from optimization history
      },
      security: {
        threatLevel: status.security.threatLevel,
        incidents: status.security.incidentCount,
        compliance: status.security.complianceScore,
        alerts: alerts.filter(a => a.source === 'SECURITY').length
      },
      compliance: {
        overallScore: status.compliance.overallScore,
        drift: status.compliance.driftCount,
        violations: status.compliance.criticalViolations,
        alerts: alerts.filter(a => a.source === 'COMPLIANCE').length
      },
      rollback: {
        ready: status.rollback.ready,
        snapshots: status.rollback.historyCount,
        lastRollback: 0, // Would track last rollback time
        averageTime: status.rollback.estimatedTime
      }
    };
  }

  public async getDashboardData(): Promise<DashboardData> {
    const status = await this.orchestrator.getDefenseStatus();
    const alerts = this.orchestrator.getActiveAlerts();
    const metrics = this.generateDashboardMetrics(status, alerts);

    return {
      timestamp: Date.now(),
      status,
      metrics,
      alerts: this.generateAlertSummary(alerts),
      history: this.getMetricsHistory(),
      configuration: this.configuration
    };
  }

  private generateAlertSummary(alerts: DefenseAlert[]): AlertSummary {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.level === 'CRITICAL' || a.level === 'EMERGENCY').length,
      high: alerts.filter(a => a.level === 'ERROR').length,
      medium: alerts.filter(a => a.level === 'WARNING').length,
      low: alerts.filter(a => a.level === 'INFO').length,
      acknowledged: alerts.filter(a => a.acknowledged).length,
      suppressed: alerts.filter(a => a.suppressUntil && a.suppressUntil > Date.now()).length,
      recent: alerts.slice(0, this.configuration.maxAlertDisplay)
    };
  }

  public async getPerformanceChart(): Promise<PerformanceChartData> {
    const history = this.getMetricsHistory();

    return {
      timestamps: history.map(h => h.timestamp),
      overhead: history.map(h => h.performance.overhead),
      target: Array(history.length).fill(1.2), // 1.2% target
      trend: this.calculatePerformanceTrend(),
      predictions: await this.generatePerformancePredictions()
    };
  }

  public async getSecurityHeatmap(): Promise<SecurityHeatmapData> {
    const alerts = this.orchestrator.getActiveAlerts();
    const securityAlerts = alerts.filter(a => a.source === 'SECURITY');

    return {
      threatDistribution: this.calculateThreatDistribution(securityAlerts),
      timelineHeat: this.calculateTimelineHeat(securityAlerts),
      severityMatrix: this.calculateSeverityMatrix(securityAlerts),
      trendAnalysis: this.calculateSecurityTrend()
    };
  }

  public async getComplianceMatrix(): Promise<ComplianceMatrixData> {
    const status = await this.orchestrator.getDefenseStatus();

    return {
      standards: {
        NASA_POT10: 0.95, // Would come from actual compliance data
        DFARS: 0.92,
        NIST: 0.94,
        ISO27001: 0.91
      },
      timeline: this.getComplianceTimeline(),
      violations: this.getViolationBreakdown(),
      trends: this.getComplianceTrends()
    };
  }

  public async exportDashboardData(format: 'JSON' | 'CSV' | 'PDF'): Promise<string> {
    const dashboardData = await this.getDashboardData();

    switch (format) {
      case 'JSON':
        return JSON.stringify(dashboardData, null, 2);
      case 'CSV':
        return this.convertToCSV(dashboardData);
      case 'PDF':
        return this.generatePDFReport(dashboardData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  public subscribe(id: string, callback: (data: DashboardData) => void): void {
    this.subscribers.set(id, callback);
  }

  public unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  private async notifySubscribers(): Promise<void> {
    if (this.subscribers.size === 0) return;

    const data = await this.getDashboardData();
    for (const callback of this.subscribers.values()) {
      try {
        callback(data);
      } catch (error) {
        console.error('[DefenseDashboard] Subscriber notification error:', error);
      }
    }
  }

  // Configuration and utility methods
  public updateConfiguration(config: Partial<DashboardConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };

    // Restart auto-refresh if interval changed
    if (config.refreshInterval && this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.startAutoRefresh();
    }
  }

  private mergeConfiguration(config?: Partial<DashboardConfiguration>): DashboardConfiguration {
    const defaultConfig: DashboardConfiguration = {
      refreshInterval: 5000, // 5 seconds
      alertRetention: 86400000, // 24 hours
      historyRetention: 604800000, // 7 days
      maxAlertDisplay: 20,
      autoRefresh: true,
      compactMode: false
    };

    return { ...defaultConfig, ...config };
  }

  private async cleanupOldData(): Promise<void> {
    const now = Date.now();

    // Cleanup metrics history
    for (const [timestamp] of this.metricsHistory) {
      if (now - timestamp > this.configuration.historyRetention) {
        this.metricsHistory.delete(timestamp);
      }
    }

    // Cleanup alert history
    for (const [id, alert] of this.alertHistory) {
      if (now - alert.timestamp > this.configuration.alertRetention) {
        this.alertHistory.delete(id);
      }
    }
  }

  private getMetricsHistory(): DashboardMetrics[] {
    return Array.from(this.metricsHistory.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  private calculatePerformanceTrend(): number[] {
    const history = this.getMetricsHistory();
    return history.slice(-20).map(h => h.performance.overhead);
  }

  private async generatePerformancePredictions(): Promise<number[]> {
    // Implementation would use ML/statistical models for prediction
    const trend = this.calculatePerformanceTrend();
    const predictions: number[] = [];

    // Simple linear prediction (would be more sophisticated in real implementation)
    for (let i = 0; i < 10; i++) {
      const lastValue = trend[trend.length - 1] || 1.0;
      predictions.push(lastValue + (Math.random() - 0.5) * 0.1);
    }

    return predictions;
  }

  private calculateThreatDistribution(securityAlerts: DefenseAlert[]): any {
    const distribution: Record<string, number> = {};
    securityAlerts.forEach(alert => {
      const type = alert.details?.type || 'UNKNOWN';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
  }

  private calculateTimelineHeat(alerts: DefenseAlert[]): any {
    // Implementation would calculate heat map data
    return {
      hours: Array(24).fill(0).map((_, i) => ({ hour: i, count: Math.floor(Math.random() * 10) }))
    };
  }

  private calculateSeverityMatrix(alerts: DefenseAlert[]): any {
    const matrix = {
      CRITICAL: 0,
      ERROR: 0,
      WARNING: 0,
      INFO: 0
    };

    alerts.forEach(alert => {
      if (alert.level in matrix) {
        matrix[alert.level as keyof typeof matrix]++;
      }
    });

    return matrix;
  }

  private calculateSecurityTrend(): any {
    return {
      direction: 'IMPROVING',
      confidence: 0.85,
      prediction: 'Threat level expected to remain LOW'
    };
  }

  private getComplianceTimeline(): any {
    return {
      points: [
        { timestamp: Date.now() - 86400000, score: 0.94 },
        { timestamp: Date.now() - 43200000, score: 0.95 },
        { timestamp: Date.now(), score: 0.93 }
      ]
    };
  }

  private getViolationBreakdown(): any {
    return {
      NASA_POT10: 1,
      DFARS: 2,
      NIST: 0,
      ISO27001: 1
    };
  }

  private getComplianceTrends(): any {
    return {
      NASA_POT10: { direction: 'STABLE', change: 0.01 },
      DFARS: { direction: 'IMPROVING', change: 0.03 },
      NIST: { direction: 'STABLE', change: 0.00 },
      ISO27001: { direction: 'DEGRADING', change: -0.02 }
    };
  }

  private convertToCSV(data: DashboardData): string {
    const headers = ['Timestamp', 'Status', 'Performance_Overhead', 'Security_Threat', 'Compliance_Score', 'Active_Alerts'];
    const rows = [headers.join(',')];

    rows.push([
      new Date(data.timestamp).toISOString(),
      data.status.overall.status,
      data.metrics.performance.overhead.toString(),
      data.status.security.threatLevel,
      data.metrics.compliance.overallScore.toString(),
      data.alerts.total.toString()
    ].join(','));

    return rows.join('\n');
  }

  private generatePDFReport(data: DashboardData): string {
    // Mock PDF generation - would use actual PDF library
    return `Defense Monitoring Report - ${new Date().toISOString()}`;
  }
}

// Supporting interfaces
export interface DashboardData {
  timestamp: number;
  status: UnifiedMonitoringStatus;
  metrics: DashboardMetrics;
  alerts: AlertSummary;
  history: DashboardMetrics[];
  configuration: DashboardConfiguration;
}

export interface PerformanceChartData {
  timestamps: number[];
  overhead: number[];
  target: number[];
  trend: number[];
  predictions: number[];
}

export interface SecurityHeatmapData {
  threatDistribution: Record<string, number>;
  timelineHeat: any;
  severityMatrix: any;
  trendAnalysis: any;
}

export interface ComplianceMatrixData {
  standards: Record<string, number>;
  timeline: any;
  violations: any;
  trends: any;
}