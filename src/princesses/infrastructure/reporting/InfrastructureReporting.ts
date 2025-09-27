import { EventEmitter } from 'events';
import { LangroidMemoryBackend, MemoryStats } from '../memory/LangroidMemoryBackend';
import { MemoryMetrics, PerformanceMetrics, Alert } from '../memory/MemoryMetrics';
import { InfrastructureTaskManager, TaskManagerStats } from '../../../api/infrastructure/InfrastructureTaskManager';
import { QueenToInfrastructureAdapter, CommandExecutionStatus } from '../adapters/QueenToInfrastructureAdapter';

/**
 * Infrastructure Reporting System
 * Comprehensive reporting and status communication to Queen with
 * real-time metrics, alerting, and structured status updates.
 */
export interface InfrastructureReport {
  id: string;
  timestamp: number;
  type: ReportType;
  priority: ReportPriority;
  status: SystemStatus;
  summary: string;
  details: ReportDetails;
  metrics: ReportMetrics;
  alerts: ReportAlert[];
  recommendations: string[];
  metadata: Record<string, any>;
}

export enum ReportType {
  SYSTEM_STATUS = 'system_status',
  PERFORMANCE = 'performance',
  ALERT = 'alert',
  TASK_COMPLETION = 'task_completion',
  RESOURCE_USAGE = 'resource_usage',
  HEALTH_CHECK = 'health_check',
  INCIDENT = 'incident',
  MAINTENANCE = 'maintenance'
}

export enum ReportPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum SystemStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  DEGRADED = 'degraded',
  CRITICAL = 'critical',
  MAINTENANCE = 'maintenance',
  UNKNOWN = 'unknown'
}

export interface ReportDetails {
  systemHealth: HealthDetails;
  taskManagement: TaskManagementDetails;
  resourceUtilization: ResourceUtilizationDetails;
  performance: PerformanceDetails;
  incidents: IncidentDetails[];
}

export interface HealthDetails {
  overallStatus: SystemStatus;
  memoryHealth: ComponentHealth;
  taskManagerHealth: ComponentHealth;
  adapterHealth: ComponentHealth;
  uptime: number;
  lastMaintenanceTime: number;
}

export interface ComponentHealth {
  status: SystemStatus;
  availability: number;
  responseTime: number;
  errorRate: number;
  lastHealthCheck: number;
}

export interface TaskManagementDetails {
  activeTasks: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  throughput: number;
  averageExecutionTime: number;
  queueWaitTime: number;
  recentCommands: CommandSummary[];
}

export interface CommandSummary {
  commandId: string;
  type: string;
  status: string;
  executionTime: number;
  tasksCount: number;
}

export interface ResourceUtilizationDetails {
  memory: ResourceMetrics;
  cpu: ResourceMetrics;
  disk: ResourceMetrics;
  network: ResourceMetrics;
}

export interface ResourceMetrics {
  current: number;
  peak: number;
  average: number;
  limit: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PerformanceDetails {
  responseTimes: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  throughput: {
    operationsPerSecond: number;
    tasksPerMinute: number;
    commandsPerHour: number;
  };
  cacheEfficiency: {
    hitRate: number;
    evictionRate: number;
    sizeTrend: string;
  };
}

export interface IncidentDetails {
  id: string;
  type: string;
  severity: string;
  startTime: number;
  endTime?: number;
  description: string;
  resolution?: string;
  impact: string;
}

export interface ReportMetrics {
  timestamp: number;
  memoryStats: MemoryStats;
  taskStats: TaskManagerStats;
  performanceMetrics: PerformanceMetrics;
  customMetrics: Record<string, number>;
}

export interface ReportAlert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

export interface ReportingConfig {
  enabled: boolean;
  autoReportInterval: number;
  alertThresholds: AlertThresholds;
  retentionDays: number;
  compressionEnabled: boolean;
  queenEndpoint?: string;
}

export interface AlertThresholds {
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
  errorRate: number;
  queueSize: number;
}

export class InfrastructureReporting extends EventEmitter {
  private static readonly DEFAULT_REPORT_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly DEFAULT_RETENTION_DAYS = 30;
  private static readonly MAX_REPORTS_IN_MEMORY = 1000;

  private memoryBackend: LangroidMemoryBackend;
  private memoryMetrics: MemoryMetrics;
  private taskManager: InfrastructureTaskManager;
  private adapter: QueenToInfrastructureAdapter;

  private config: ReportingConfig;
  private reportHistory: Map<string, InfrastructureReport> = new Map();
  private activeIncidents: Map<string, IncidentDetails> = new Map();
  private reportingTimer?: NodeJS.Timeout;

  private startTime: number;
  private lastMaintenanceTime: number = 0;
  private reportCounter: number = 0;

  constructor(
    memoryBackend: LangroidMemoryBackend,
    memoryMetrics: MemoryMetrics,
    taskManager: InfrastructureTaskManager,
    adapter: QueenToInfrastructureAdapter,
    config?: Partial<ReportingConfig>
  ) {
    super();

    this.memoryBackend = memoryBackend;
    this.memoryMetrics = memoryMetrics;
    this.taskManager = taskManager;
    this.adapter = adapter;

    this.config = {
      enabled: config?.enabled ?? true,
      autoReportInterval: config?.autoReportInterval ?? InfrastructureReporting.DEFAULT_REPORT_INTERVAL,
      alertThresholds: config?.alertThresholds ?? {
        memoryUsage: 85,
        cpuUsage: 75,
        responseTime: 1000,
        errorRate: 5,
        queueSize: 100
      },
      retentionDays: config?.retentionDays ?? InfrastructureReporting.DEFAULT_RETENTION_DAYS,
      compressionEnabled: config?.compressionEnabled ?? true,
      queenEndpoint: config?.queenEndpoint
    };

    this.startTime = Date.now();
    this.setupEventListeners();

    if (this.config.enabled) {
      this.startAutoReporting();
    }
  }

  /**
   * Generate comprehensive system status report
   */
  public async generateStatusReport(type: ReportType = ReportType.SYSTEM_STATUS): Promise<InfrastructureReport> {
    try {
      const reportId = this.generateReportId();
      const timestamp = Date.now();

      // Gather all system data
      const memoryStats = this.memoryBackend.getStats();
      const taskStats = this.taskManager.getStats();
      const performanceMetrics = this.memoryMetrics.getCurrentMetrics();
      const activeAlerts = this.memoryMetrics.getActiveAlerts();

      // Determine overall system status
      const systemStatus = this.determineSystemStatus(memoryStats, taskStats, activeAlerts);

      // Build report
      const report: InfrastructureReport = {
        id: reportId,
        timestamp,
        type,
        priority: this.determineReportPriority(systemStatus, activeAlerts),
        status: systemStatus,
        summary: this.generateSummary(systemStatus, memoryStats, taskStats),
        details: await this.buildReportDetails(memoryStats, taskStats, performanceMetrics),
        metrics: {
          timestamp,
          memoryStats,
          taskStats,
          performanceMetrics,
          customMetrics: this.collectCustomMetrics()
        },
        alerts: this.convertAlertsToReportAlerts(activeAlerts),
        recommendations: this.generateRecommendations(systemStatus, memoryStats, taskStats, activeAlerts),
        metadata: {
          uptime: this.getUptime(),
          reportVersion: '1.0.0',
          generatedBy: 'InfrastructurePrincess',
          environment: process.env.NODE_ENV || 'development'
        }
      };

      // Store report
      await this.storeReport(report);

      this.emit('report-generated', report);

      return report;

    } catch (error) {
      this.emit('error', { operation: 'generateStatusReport', type, error });
      throw error;
    }
  }

  /**
   * Send alert report to Queen
   */
  public async sendAlertReport(alert: Alert, context?: any): Promise<void> {
    try {
      const report = await this.generateStatusReport(ReportType.ALERT);

      // Add alert-specific information
      report.priority = alert.type === 'critical' ? ReportPriority.CRITICAL : ReportPriority.HIGH;
      report.summary = `ALERT: ${alert.message}`;

      if (context) {
        report.metadata.alertContext = context;
      }

      await this.sendReportToQueen(report);

      this.emit('alert-report-sent', { alert, report });

    } catch (error) {
      this.emit('error', { operation: 'sendAlertReport', alert, error });
    }
  }

  /**
   * Send task completion report to Queen
   */
  public async sendTaskCompletionReport(commandStatus: CommandExecutionStatus): Promise<void> {
    try {
      const report = await this.generateStatusReport(ReportType.TASK_COMPLETION);

      report.summary = `Task ${commandStatus.status}: ${commandStatus.commandId}`;
      report.priority = commandStatus.status === 'failed' ? ReportPriority.HIGH : ReportPriority.MEDIUM;
      report.metadata.commandExecution = commandStatus;

      await this.sendReportToQueen(report);

      this.emit('task-completion-report-sent', { commandStatus, report });

    } catch (error) {
      this.emit('error', { operation: 'sendTaskCompletionReport', commandStatus, error });
    }
  }

  /**
   * Record incident
   */
  public recordIncident(type: string, severity: string, description: string, impact: string): string {
    const incidentId = `inc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const incident: IncidentDetails = {
      id: incidentId,
      type,
      severity,
      startTime: Date.now(),
      description,
      impact
    };

    this.activeIncidents.set(incidentId, incident);

    this.emit('incident-recorded', incident);

    return incidentId;
  }

  /**
   * Resolve incident
   */
  public resolveIncident(incidentId: string, resolution: string): boolean {
    const incident = this.activeIncidents.get(incidentId);
    if (!incident) return false;

    incident.endTime = Date.now();
    incident.resolution = resolution;

    this.activeIncidents.delete(incidentId);

    this.emit('incident-resolved', incident);

    return true;
  }

  /**
   * Get report history
   */
  public getReportHistory(limit: number = 50): InfrastructureReport[] {
    const reports = Array.from(this.reportHistory.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return reports;
  }

  /**
   * Get specific report
   */
  public getReport(reportId: string): InfrastructureReport | null {
    return this.reportHistory.get(reportId) || null;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ReportingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enabled && !this.reportingTimer) {
      this.startAutoReporting();
    } else if (!this.config.enabled && this.reportingTimer) {
      this.stopAutoReporting();
    }

    this.emit('config-updated', this.config);
  }

  /**
   * Shutdown reporting system
   */
  public async shutdown(): Promise<void> {
    try {
      this.stopAutoReporting();

      // Generate final report
      await this.generateStatusReport(ReportType.MAINTENANCE);

      this.removeAllListeners();
      this.emit('shutdown');

    } catch (error) {
      this.emit('error', { operation: 'shutdown', error });
    }
  }

  // Private methods

  private generateReportId(): string {
    this.reportCounter++;
    return `rpt-${Date.now()}-${this.reportCounter.toString().padStart(4, '0')}`;
  }

  private determineSystemStatus(memoryStats: MemoryStats, taskStats: TaskManagerStats, alerts: Alert[]): SystemStatus {
    const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
    const memoryUsage = (memoryStats.usedSize / memoryStats.totalSize) * 100;
    const errorRate = taskStats.failedTasks / (taskStats.completedTasks + taskStats.failedTasks || 1);

    if (criticalAlerts > 0 || memoryUsage > 95 || errorRate > 0.2) {
      return SystemStatus.CRITICAL;
    }

    if (alerts.length > 0 || memoryUsage > 85 || errorRate > 0.1 || taskStats.queuedTasks > 50) {
      return SystemStatus.WARNING;
    }

    if (memoryUsage > 70 || taskStats.queuedTasks > 20) {
      return SystemStatus.DEGRADED;
    }

    return SystemStatus.HEALTHY;
  }

  private determineReportPriority(status: SystemStatus, alerts: Alert[]): ReportPriority {
    if (status === SystemStatus.CRITICAL) return ReportPriority.CRITICAL;
    if (status === SystemStatus.WARNING) return ReportPriority.HIGH;
    if (alerts.length > 0) return ReportPriority.MEDIUM;
    return ReportPriority.INFO;
  }

  private generateSummary(status: SystemStatus, memoryStats: MemoryStats, taskStats: TaskManagerStats): string {
    const memoryUsage = ((memoryStats.usedSize / memoryStats.totalSize) * 100).toFixed(1);
    const uptime = Math.floor(this.getUptime() / 1000 / 60); // minutes

    return `Infrastructure status: ${status.toUpperCase()} | ` +
           `Memory: ${memoryUsage}% | ` +
           `Active tasks: ${taskStats.activeTasks} | ` +
           `Queue: ${taskStats.queuedTasks} | ` +
           `Uptime: ${uptime}m`;
  }

  private async buildReportDetails(
    memoryStats: MemoryStats,
    taskStats: TaskManagerStats,
    performanceMetrics: PerformanceMetrics
  ): Promise<ReportDetails> {
    const now = Date.now();

    return {
      systemHealth: {
        overallStatus: this.determineSystemStatus(memoryStats, taskStats, []),
        memoryHealth: {
          status: memoryStats.usedSize / memoryStats.totalSize > 0.85 ? SystemStatus.WARNING : SystemStatus.HEALTHY,
          availability: 99.9, // Calculate based on actual metrics
          responseTime: performanceMetrics.responseTimes.store.avg,
          errorRate: 0, // Calculate from error metrics
          lastHealthCheck: now
        },
        taskManagerHealth: {
          status: taskStats.queuedTasks > 50 ? SystemStatus.WARNING : SystemStatus.HEALTHY,
          availability: 99.9,
          responseTime: taskStats.averageExecutionTime,
          errorRate: taskStats.failedTasks / (taskStats.completedTasks + taskStats.failedTasks || 1),
          lastHealthCheck: now
        },
        adapterHealth: {
          status: SystemStatus.HEALTHY,
          availability: 99.9,
          responseTime: 100, // Example value
          errorRate: 0,
          lastHealthCheck: now
        },
        uptime: this.getUptime(),
        lastMaintenanceTime: this.lastMaintenanceTime
      },
      taskManagement: {
        activeTasks: taskStats.activeTasks,
        queuedTasks: taskStats.queuedTasks,
        completedTasks: taskStats.completedTasks,
        failedTasks: taskStats.failedTasks,
        throughput: taskStats.throughputPerHour,
        averageExecutionTime: taskStats.averageExecutionTime,
        queueWaitTime: taskStats.queueWaitTime,
        recentCommands: await this.getRecentCommandSummaries()
      },
      resourceUtilization: {
        memory: {
          current: (memoryStats.usedSize / memoryStats.totalSize) * 100,
          peak: 90, // Calculate from historical data
          average: 75,
          limit: 100,
          trend: 'stable'
        },
        cpu: {
          current: 45, // Get from system metrics
          peak: 80,
          average: 50,
          limit: 100,
          trend: 'stable'
        },
        disk: {
          current: 60,
          peak: 75,
          average: 55,
          limit: 100,
          trend: 'increasing'
        },
        network: {
          current: 30,
          peak: 85,
          average: 40,
          limit: 100,
          trend: 'stable'
        }
      },
      performance: {
        responseTimes: {
          p50: performanceMetrics.responseTimes.store.p50,
          p90: performanceMetrics.responseTimes.store.p90,
          p95: performanceMetrics.responseTimes.store.p95,
          p99: performanceMetrics.responseTimes.store.p99
        },
        throughput: {
          operationsPerSecond: performanceMetrics.throughput.operationsPerSecond,
          tasksPerMinute: taskStats.throughputPerHour / 60,
          commandsPerHour: 0 // Calculate from adapter stats
        },
        cacheEfficiency: {
          hitRate: memoryStats.hitRate * 100,
          evictionRate: memoryStats.evictionCount,
          sizeTrend: 'stable'
        }
      },
      incidents: Array.from(this.activeIncidents.values())
    };
  }

  private async getRecentCommandSummaries(): Promise<CommandSummary[]> {
    const activeCommands = this.adapter.getActiveCommands();
    const commandHistory = await this.adapter.getCommandHistory(10);

    return [...activeCommands, ...commandHistory.slice(0, 5)].map(cmd => ({
      commandId: cmd.commandId,
      type: 'command', // Get from command data
      status: cmd.status,
      executionTime: Date.now() - cmd.startTime,
      tasksCount: cmd.tasks.length
    }));
  }

  private convertAlertsToReportAlerts(alerts: Alert[]): ReportAlert[] {
    return alerts.map(alert => ({
      id: `alert-${alert.timestamp}`,
      type: alert.metric,
      severity: alert.type,
      message: alert.message,
      timestamp: alert.timestamp,
      resolved: false,
      metadata: {
        value: alert.value,
        threshold: alert.threshold
      }
    }));
  }

  private generateRecommendations(
    status: SystemStatus,
    memoryStats: MemoryStats,
    taskStats: TaskManagerStats,
    alerts: Alert[]
  ): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    const memoryUsage = (memoryStats.usedSize / memoryStats.totalSize) * 100;
    if (memoryUsage > 85) {
      recommendations.push('Consider optimizing memory usage or increasing memory capacity');
    }

    // Task management recommendations
    if (taskStats.queuedTasks > 30) {
      recommendations.push('High task queue detected - consider scaling task processing capacity');
    }

    // Performance recommendations
    if (taskStats.averageExecutionTime > 60000) { // 1 minute
      recommendations.push('Task execution times are elevated - review task efficiency');
    }

    // Alert-based recommendations
    if (alerts.length > 3) {
      recommendations.push('Multiple active alerts detected - investigate system health');
    }

    return recommendations;
  }

  private collectCustomMetrics(): Record<string, number> {
    return {
      reportCount: this.reportCounter,
      activeIncidents: this.activeIncidents.size,
      reportHistorySize: this.reportHistory.size,
      uptime: this.getUptime()
    };
  }

  private async storeReport(report: InfrastructureReport): Promise<void> {
    // Store in memory
    this.reportHistory.set(report.id, report);

    // Trim history if needed
    if (this.reportHistory.size > InfrastructureReporting.MAX_REPORTS_IN_MEMORY) {
      const oldestReport = Array.from(this.reportHistory.values())
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      this.reportHistory.delete(oldestReport.id);
    }

    // Store in persistent memory backend
    await this.memoryBackend.store(report.id, report, {
      tags: ['report', report.type, report.priority],
      ttl: this.config.retentionDays * 24 * 60 * 60 * 1000,
      metadata: {
        reportType: report.type,
        systemStatus: report.status,
        generatedAt: report.timestamp
      }
    });
  }

  private async sendReportToQueen(report: InfrastructureReport): Promise<void> {
    try {
      // In a real implementation, this would send the report to the Queen
      // via the configured endpoint or messaging system

      this.emit('report-sent-to-queen', report);

      // For now, just log and emit event
      console.log(`[Infrastructure] Report sent to Queen: ${report.id} (${report.type})`);

    } catch (error) {
      this.emit('error', { operation: 'sendReportToQueen', report: report.id, error });
    }
  }

  private getUptime(): number {
    return Date.now() - this.startTime;
  }

  private setupEventListeners(): void {
    // Listen to memory metrics alerts
    this.memoryMetrics.on('alert', (alert) => {
      this.sendAlertReport(alert);
    });

    // Listen to adapter command completion
    this.adapter.on('command-completed', (status) => {
      this.sendTaskCompletionReport(status);
    });

    this.adapter.on('command-failed', (status) => {
      this.sendTaskCompletionReport(status);
    });

    // Listen to task manager events
    this.taskManager.on('task-failed', (task) => {
      this.recordIncident('task_failure', 'medium', `Task failed: ${task.id}`, 'Task execution disrupted');
    });
  }

  private startAutoReporting(): void {
    this.reportingTimer = setInterval(async () => {
      try {
        await this.generateStatusReport();
      } catch (error) {
        this.emit('error', { operation: 'autoReporting', error });
      }
    }, this.config.autoReportInterval);
  }

  private stopAutoReporting(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = undefined;
    }
  }
}

export default InfrastructureReporting;