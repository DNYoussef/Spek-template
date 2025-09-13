/**
 * Real-Time Compliance Monitoring System
 * Implements real-time compliance monitoring with automated remediation workflows
 *
 * Task: EC-006 - Real-time compliance monitoring with automated remediation workflows
 */

import { EventEmitter } from 'events';
import { ComplianceFramework } from '../types';

interface MonitoringConfig {
  enabled: boolean;
  alertThresholds: {
    critical: number;
    high: number;
    medium: number;
  };
  performanceBudget: number;
  pollingInterval: number;
  dashboards: boolean;
  alerting: boolean;
  automatedRemediation: boolean;
}

interface MonitoringMetric {
  id: string;
  name: string;
  description: string;
  type: MetricType;
  source: string;
  value: number;
  threshold: number;
  status: MetricStatus;
  timestamp: Date;
  trend: TrendDirection;
  metadata: Record<string, any>;
}

interface ComplianceDrift {
  id: string;
  framework: string;
  control: string;
  previousScore: number;
  currentScore: number;
  drift: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  evidence: string[];
  rootCause: string;
  automatedRemediation: boolean;
}

interface ControlFailure {
  id: string;
  framework: string;
  control: string;
  failureType: FailureType;
  impact: ImpactLevel;
  detectedAt: Date;
  lastWorking: Date;
  failureCount: number;
  evidence: FailureEvidence[];
  relatedControls: string[];
  automatedResponse: boolean;
}

interface ElevatedRisk {
  id: string;
  risk: string;
  level: RiskLevel;
  affectedFrameworks: string[];
  relatedControls: string[];
  likelihood: number;
  impact: number;
  riskScore: number;
  detectedAt: Date;
  factors: RiskFactor[];
  mitigationOptions: string[];
}

interface AlertConfiguration {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  channels: NotificationChannel[];
  suppressionRules: SuppressionRule[];
  escalationRules: EscalationRule[];
  automatedActions: AutomatedAction[];
}

interface DashboardConfig {
  id: string;
  name: string;
  layout: DashboardLayout;
  widgets: Widget[];
  refreshInterval: number;
  accessControl: AccessControlRule[];
  exportOptions: ExportOption[];
}

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  configuration: Record<string, any>;
  position: { x: number; y: number; width: number; height: number };
  refreshInterval: number;
}

type MetricType = 'compliance_score' | 'control_effectiveness' | 'risk_exposure' | 'audit_findings' | 'remediation_rate' | 'performance_metric';
type MetricStatus = 'normal' | 'warning' | 'critical' | 'unknown';
type TrendDirection = 'increasing' | 'stable' | 'decreasing' | 'volatile';
type FailureType = 'configuration_drift' | 'policy_violation' | 'access_breach' | 'validation_failure' | 'system_error';
type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
type NotificationChannel = 'email' | 'slack' | 'teams' | 'webhook' | 'sms';
type WidgetType = 'chart' | 'gauge' | 'table' | 'heatmap' | 'timeline' | 'metric';
type DashboardLayout = 'grid' | 'flex' | 'custom';

interface RiskFactor {
  factor: string;
  contribution: number;
  evidence: string;
  mitigatable: boolean;
}

interface FailureEvidence {
  type: string;
  description: string;
  timestamp: Date;
  severity: string;
  source: string;
}

interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  value: number;
  duration: number; // seconds
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

interface SuppressionRule {
  condition: string;
  duration: number;
  reason: string;
}

interface EscalationRule {
  delay: number;
  target: string;
  action: string;
}

interface AutomatedAction {
  trigger: string;
  action: string;
  parameters: Record<string, any>;
  maxExecutions: number;
}

interface AccessControlRule {
  principal: string;
  permissions: string[];
  conditions: string[];
}

interface ExportOption {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule: string;
  recipients: string[];
}

export class RealTimeMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metrics: Map<string, MonitoringMetric> = new Map();
  private alerts: Map<string, AlertConfiguration> = new Map();
  private dashboards: Map<string, DashboardConfig> = new Map();
  private performanceTracker: PerformanceTracker;
  private alertManager: AlertManager;
  private dashboardEngine: DashboardEngine;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.performanceTracker = new PerformanceTracker(config.performanceBudget);
    this.alertManager = new AlertManager();
    this.dashboardEngine = new DashboardEngine();
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    this.setupDefaultMetrics();
    this.setupDefaultAlerts();
    this.setupDefaultDashboards();
    this.emit('monitoring_initialized', { timestamp: new Date() });
  }

  /**
   * Start real-time monitoring
   */
  async start(params: {
    frameworks: ComplianceFramework[];
    alerting: boolean;
    dashboards: boolean;
    metrics: string[];
  }): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      this.emit('monitoring_starting', { timestamp: new Date(), frameworks: params.frameworks });

      // Initialize framework-specific monitoring
      for (const framework of params.frameworks) {
        await this.initializeFrameworkMonitoring(framework);
      }

      // Start metric collection
      this.startMetricCollection(params.metrics);

      // Start alerting if enabled
      if (params.alerting) {
        await this.alertManager.start();
      }

      // Start dashboard engine if enabled
      if (params.dashboards) {
        await this.dashboardEngine.start();
      }

      // Start main monitoring loop
      this.monitoringInterval = setInterval(async () => {
        await this.performMonitoringCycle();
      }, this.config.pollingInterval || 30000); // Default 30 seconds

      this.isRunning = true;

      this.emit('monitoring_started', {
        timestamp: new Date(),
        frameworks: params.frameworks.length,
        metrics: params.metrics.length,
        alerting: params.alerting,
        dashboards: params.dashboards
      });

    } catch (error) {
      this.emit('monitoring_start_failed', { error: error.message });
      throw new Error(`Failed to start monitoring: ${error.message}`);
    }
  }

  /**
   * Perform monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    const cycleStart = performance.now();

    try {
      // Collect current metrics
      await this.collectMetrics();

      // Analyze for compliance drift
      await this.analyzeComplianceDrift();

      // Check for control failures
      await this.checkControlFailures();

      // Assess risk elevation
      await this.assessRiskElevation();

      // Update dashboards
      if (this.config.dashboards) {
        await this.dashboardEngine.updateDashboards(this.metrics);
      }

      // Track performance
      const cycleEnd = performance.now();
      const cycleDuration = cycleEnd - cycleStart;
      await this.performanceTracker.recordCycle(cycleDuration);

      this.emit('monitoring_cycle_completed', {
        duration: cycleDuration,
        metricsCollected: this.metrics.size,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('monitoring_cycle_failed', { error: error.message });
    }
  }

  /**
   * Initialize framework-specific monitoring
   */
  private async initializeFrameworkMonitoring(framework: ComplianceFramework): Promise<void> {
    const frameworkMetrics = this.getFrameworkMetrics(framework);

    for (const metricConfig of frameworkMetrics) {
      const metric: MonitoringMetric = {
        id: `${framework}-${metricConfig.name}`,
        name: metricConfig.name,
        description: metricConfig.description,
        type: metricConfig.type,
        source: framework,
        value: 0,
        threshold: metricConfig.threshold,
        status: 'unknown',
        timestamp: new Date(),
        trend: 'stable',
        metadata: metricConfig.metadata || {}
      };

      this.metrics.set(metric.id, metric);
    }

    this.emit('framework_monitoring_initialized', { framework, metrics: frameworkMetrics.length });
  }

  /**
   * Get framework-specific metrics configuration
   */
  private getFrameworkMetrics(framework: ComplianceFramework): any[] {
    const baseMetrics = [
      {
        name: 'compliance_score',
        description: 'Overall compliance score',
        type: 'compliance_score',
        threshold: 90,
        metadata: { unit: 'percentage', critical: true }
      },
      {
        name: 'control_effectiveness',
        description: 'Average control effectiveness',
        type: 'control_effectiveness',
        threshold: 85,
        metadata: { unit: 'percentage', aggregation: 'average' }
      },
      {
        name: 'risk_exposure',
        description: 'Current risk exposure level',
        type: 'risk_exposure',
        threshold: 30,
        metadata: { unit: 'score', direction: 'lower_better' }
      },
      {
        name: 'audit_findings',
        description: 'Number of open audit findings',
        type: 'audit_findings',
        threshold: 5,
        metadata: { unit: 'count', direction: 'lower_better' }
      }
    ];

    // Add framework-specific metrics
    switch (framework) {
      case 'soc2':
        baseMetrics.push({
          name: 'trust_services_compliance',
          description: 'Trust Services Criteria compliance',
          type: 'compliance_score',
          threshold: 95,
          metadata: { unit: 'percentage', criteria: ['security', 'availability', 'integrity', 'confidentiality', 'privacy'] }
        });
        break;

      case 'iso27001':
        baseMetrics.push({
          name: 'annex_a_compliance',
          description: 'Annex A controls compliance',
          type: 'compliance_score',
          threshold: 90,
          metadata: { unit: 'percentage', domains: ['organizational', 'people', 'physical', 'technological'] }
        });
        break;

      case 'nist-ssdf':
        baseMetrics.push({
          name: 'practice_maturity',
          description: 'SSDF practice maturity level',
          type: 'compliance_score',
          threshold: 3,
          metadata: { unit: 'tier', max_tier: 4, functions: ['prepare', 'protect', 'produce', 'respond'] }
        });
        break;
    }

    return baseMetrics;
  }

  /**
   * Setup default alert configurations
   */
  private setupDefaultAlerts(): void {
    const defaultAlerts: AlertConfiguration[] = [
      {
        id: 'compliance-score-critical',
        name: 'Critical Compliance Score Drop',
        condition: {
          metric: 'compliance_score',
          operator: 'lt',
          value: this.config.alertThresholds.critical,
          duration: 60,
          aggregation: 'avg'
        },
        severity: 'critical',
        channels: ['email', 'slack'],
        suppressionRules: [{ condition: 'maintenance_window', duration: 3600, reason: 'Scheduled maintenance' }],
        escalationRules: [{ delay: 300, target: 'manager', action: 'notify' }],
        automatedActions: [{ trigger: 'immediate', action: 'initiate_remediation', parameters: {}, maxExecutions: 1 }]
      },
      {
        id: 'control-failure-alert',
        name: 'Control Failure Detection',
        condition: {
          metric: 'control_effectiveness',
          operator: 'lt',
          value: 50,
          duration: 120,
          aggregation: 'min'
        },
        severity: 'error',
        channels: ['email', 'teams'],
        suppressionRules: [],
        escalationRules: [{ delay: 600, target: 'security_team', action: 'escalate' }],
        automatedActions: [{ trigger: 'condition_met', action: 'collect_evidence', parameters: {}, maxExecutions: 3 }]
      },
      {
        id: 'risk-elevation-warning',
        name: 'Elevated Risk Detection',
        condition: {
          metric: 'risk_exposure',
          operator: 'gt',
          value: this.config.alertThresholds.high,
          duration: 180,
          aggregation: 'max'
        },
        severity: 'warning',
        channels: ['slack'],
        suppressionRules: [],
        escalationRules: [],
        automatedActions: [{ trigger: 'daily_summary', action: 'generate_report', parameters: {}, maxExecutions: 1 }]
      }
    ];

    defaultAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });

    this.emit('alerts_configured', { count: defaultAlerts.length });
  }

  /**
   * Setup default dashboard configurations
   */
  private setupDefaultDashboards(): void {
    const complianceOverviewDashboard: DashboardConfig = {
      id: 'compliance-overview',
      name: 'Compliance Overview',
      layout: 'grid',
      refreshInterval: 30000,
      accessControl: [{ principal: 'compliance_team', permissions: ['read', 'export'], conditions: [] }],
      exportOptions: [{ format: 'pdf', schedule: 'daily', recipients: ['compliance@company.com'] }],
      widgets: [
        {
          id: 'overall-compliance-score',
          type: 'gauge',
          title: 'Overall Compliance Score',
          dataSource: 'compliance_score',
          configuration: { min: 0, max: 100, thresholds: [70, 85, 95] },
          position: { x: 0, y: 0, width: 2, height: 2 },
          refreshInterval: 60000
        },
        {
          id: 'framework-scores-chart',
          type: 'chart',
          title: 'Framework Compliance Scores',
          dataSource: 'framework_scores',
          configuration: { type: 'bar', orientation: 'horizontal' },
          position: { x: 2, y: 0, width: 4, height: 2 },
          refreshInterval: 60000
        },
        {
          id: 'risk-heatmap',
          type: 'heatmap',
          title: 'Risk Exposure by Framework',
          dataSource: 'risk_exposure',
          configuration: { colorScheme: 'risk', aggregation: 'framework' },
          position: { x: 0, y: 2, width: 3, height: 2 },
          refreshInterval: 120000
        },
        {
          id: 'findings-timeline',
          type: 'timeline',
          title: 'Audit Findings Timeline',
          dataSource: 'audit_findings',
          configuration: { timeRange: '7d', groupBy: 'severity' },
          position: { x: 3, y: 2, width: 3, height: 2 },
          refreshInterval: 300000
        }
      ]
    };

    const realTimeMonitoringDashboard: DashboardConfig = {
      id: 'real-time-monitoring',
      name: 'Real-Time Monitoring',
      layout: 'grid',
      refreshInterval: 5000,
      accessControl: [{ principal: 'security_team', permissions: ['read'], conditions: [] }],
      exportOptions: [],
      widgets: [
        {
          id: 'live-metrics',
          type: 'table',
          title: 'Live Compliance Metrics',
          dataSource: 'live_metrics',
          configuration: { sortBy: 'timestamp', order: 'desc', pageSize: 50 },
          position: { x: 0, y: 0, width: 6, height: 3 },
          refreshInterval: 5000
        },
        {
          id: 'alert-status',
          type: 'metric',
          title: 'Active Alerts',
          dataSource: 'active_alerts',
          configuration: { showTrend: true, trendPeriod: '1h' },
          position: { x: 0, y: 3, width: 2, height: 1 },
          refreshInterval: 10000
        },
        {
          id: 'remediation-status',
          type: 'metric',
          title: 'Auto-Remediation Rate',
          dataSource: 'remediation_rate',
          configuration: { format: 'percentage', showTarget: true, target: 90 },
          position: { x: 2, y: 3, width: 2, height: 1 },
          refreshInterval: 30000
        }
      ]
    };

    this.dashboards.set(complianceOverviewDashboard.id, complianceOverviewDashboard);
    this.dashboards.set(realTimeMonitoringDashboard.id, realTimeMonitoringDashboard);

    this.emit('dashboards_configured', { count: 2 });
  }

  /**
   * Setup default metrics
   */
  private setupDefaultMetrics(): void {
    // Implementation would initialize metric definitions and collection strategies
    this.emit('metrics_configured', { timestamp: new Date() });
  }

  /**
   * Start metric collection
   */
  private startMetricCollection(metricNames: string[]): void {
    // Implementation would start collecting specified metrics
    this.emit('metric_collection_started', { metrics: metricNames });
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<void> {
    const collectionStart = performance.now();

    try {
      for (const [metricId, metric] of this.metrics.entries()) {
        const newValue = await this.collectMetricValue(metric);
        const trend = this.calculateTrend(metric, newValue);
        const status = this.determineMetricStatus(newValue, metric.threshold, metric.type);

        // Update metric
        const updatedMetric: MonitoringMetric = {
          ...metric,
          value: newValue,
          status,
          trend,
          timestamp: new Date()
        };

        this.metrics.set(metricId, updatedMetric);

        // Check alert conditions
        await this.checkAlertConditions(updatedMetric);
      }

      const collectionEnd = performance.now();
      const collectionDuration = collectionEnd - collectionStart;

      this.emit('metrics_collected', {
        count: this.metrics.size,
        duration: collectionDuration,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('metric_collection_failed', { error: error.message });
    }
  }

  /**
   * Collect individual metric value
   */
  private async collectMetricValue(metric: MonitoringMetric): Promise<number> {
    // Mock metric collection - in production would integrate with actual systems
    const mockValues: Record<string, () => number> = {
      compliance_score: () => 85 + Math.random() * 10,
      control_effectiveness: () => 80 + Math.random() * 15,
      risk_exposure: () => 20 + Math.random() * 20,
      audit_findings: () => Math.floor(Math.random() * 10),
      trust_services_compliance: () => 90 + Math.random() * 8,
      annex_a_compliance: () => 85 + Math.random() * 12,
      practice_maturity: () => 2 + Math.random() * 1.5
    };

    const generator = mockValues[metric.type];
    return generator ? generator() : metric.value;
  }

  /**
   * Calculate metric trend
   */
  private calculateTrend(metric: MonitoringMetric, newValue: number): TrendDirection {
    const threshold = 0.05; // 5% change threshold
    const change = (newValue - metric.value) / Math.max(metric.value, 1);

    if (Math.abs(change) < threshold) return 'stable';
    if (change > threshold * 3) return 'volatile';
    if (change > threshold) return 'increasing';
    return 'decreasing';
  }

  /**
   * Determine metric status based on thresholds
   */
  private determineMetricStatus(value: number, threshold: number, type: MetricType): MetricStatus {
    const isLowerBetter = ['risk_exposure', 'audit_findings'].includes(type);

    if (isLowerBetter) {
      if (value > threshold * 1.5) return 'critical';
      if (value > threshold) return 'warning';
    } else {
      if (value < threshold * 0.7) return 'critical';
      if (value < threshold * 0.85) return 'warning';
    }

    return 'normal';
  }

  /**
   * Check alert conditions
   */
  private async checkAlertConditions(metric: MonitoringMetric): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (alert.condition.metric === metric.type) {
        const conditionMet = this.evaluateAlertCondition(metric, alert.condition);

        if (conditionMet) {
          await this.triggerAlert(alert, metric);
        }
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(metric: MonitoringMetric, condition: AlertCondition): boolean {
    const { operator, value } = condition;

    switch (operator) {
      case 'gt': return metric.value > value;
      case 'gte': return metric.value >= value;
      case 'lt': return metric.value < value;
      case 'lte': return metric.value <= value;
      case 'eq': return metric.value === value;
      case 'ne': return metric.value !== value;
      default: return false;
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(alert: AlertConfiguration, metric: MonitoringMetric): Promise<void> {
    await this.alertManager.sendAlert({
      alert,
      metric,
      timestamp: new Date()
    });

    // Execute automated actions
    for (const action of alert.automatedActions) {
      await this.executeAutomatedAction(action, metric);
    }

    this.emit('alert_triggered', {
      alertId: alert.id,
      severity: alert.severity,
      metric: metric.name,
      value: metric.value,
      timestamp: new Date()
    });
  }

  /**
   * Execute automated action
   */
  private async executeAutomatedAction(action: AutomatedAction, metric: MonitoringMetric): Promise<void> {
    try {
      switch (action.action) {
        case 'initiate_remediation':
          this.emit('remediation_triggered', { metric: metric.name, timestamp: new Date() });
          break;
        case 'collect_evidence':
          this.emit('evidence_collection_triggered', { metric: metric.name, timestamp: new Date() });
          break;
        case 'generate_report':
          this.emit('report_generation_triggered', { metric: metric.name, timestamp: new Date() });
          break;
        default:
          console.warn(`Unknown automated action: ${action.action}`);
      }
    } catch (error) {
      this.emit('automated_action_failed', { action: action.action, error: error.message });
    }
  }

  /**
   * Analyze compliance drift
   */
  private async analyzeComplianceDrift(): Promise<void> {
    const complianceMetrics = Array.from(this.metrics.values())
      .filter(m => m.type === 'compliance_score' || m.type === 'control_effectiveness');

    for (const metric of complianceMetrics) {
      if (metric.trend === 'decreasing' && metric.status !== 'normal') {
        const drift: ComplianceDrift = {
          id: `drift-${metric.id}-${Date.now()}`,
          framework: metric.source,
          control: metric.name,
          previousScore: metric.value + (metric.value * 0.1), // Mock previous value
          currentScore: metric.value,
          drift: -10, // Mock drift calculation
          severity: this.mapStatusToSeverity(metric.status),
          detectedAt: new Date(),
          evidence: [`Metric ${metric.name} decreased to ${metric.value}`],
          rootCause: 'Performance degradation detected',
          automatedRemediation: this.config.automatedRemediation
        };

        this.emit('compliance:drift', drift);
      }
    }
  }

  /**
   * Check for control failures
   */
  private async checkControlFailures(): Promise<void> {
    const controlMetrics = Array.from(this.metrics.values())
      .filter(m => m.status === 'critical');

    for (const metric of controlMetrics) {
      const failure: ControlFailure = {
        id: `failure-${metric.id}-${Date.now()}`,
        framework: metric.source,
        control: metric.name,
        failureType: 'validation_failure',
        impact: this.mapStatusToImpact(metric.status),
        detectedAt: new Date(),
        lastWorking: new Date(Date.now() - 3600000), // Mock last working time
        failureCount: 1,
        evidence: [{
          type: 'metric_threshold_breach',
          description: `${metric.name} value ${metric.value} below threshold ${metric.threshold}`,
          timestamp: new Date(),
          severity: 'critical',
          source: 'real_time_monitor'
        }],
        relatedControls: [],
        automatedResponse: this.config.automatedRemediation
      };

      this.emit('control:failure', failure);
    }
  }

  /**
   * Assess risk elevation
   */
  private async assessRiskElevation(): Promise<void> {
    const riskMetrics = Array.from(this.metrics.values())
      .filter(m => m.type === 'risk_exposure');

    for (const metric of riskMetrics) {
      if (metric.status === 'critical' || metric.status === 'warning') {
        const elevatedRisk: ElevatedRisk = {
          id: `risk-${metric.id}-${Date.now()}`,
          risk: `Elevated ${metric.name}`,
          level: this.mapStatusToRiskLevel(metric.status),
          affectedFrameworks: [metric.source],
          relatedControls: [],
          likelihood: 0.7,
          impact: 0.8,
          riskScore: metric.value,
          detectedAt: new Date(),
          factors: [{
            factor: 'Metric threshold exceeded',
            contribution: 0.8,
            evidence: `${metric.name} = ${metric.value}`,
            mitigatable: true
          }],
          mitigationOptions: ['Implement additional controls', 'Increase monitoring frequency', 'Manual intervention']
        };

        this.emit('risk:elevated', elevatedRisk);
      }
    }
  }

  /**
   * Helper methods for status mapping
   */
  private mapStatusToSeverity(status: MetricStatus): 'low' | 'medium' | 'high' | 'critical' {
    const mapping = { normal: 'low', warning: 'medium', critical: 'critical', unknown: 'low' };
    return mapping[status] as 'low' | 'medium' | 'high' | 'critical';
  }

  private mapStatusToImpact(status: MetricStatus): ImpactLevel {
    const mapping = { normal: 'low', warning: 'medium', critical: 'critical', unknown: 'low' };
    return mapping[status] as ImpactLevel;
  }

  private mapStatusToRiskLevel(status: MetricStatus): RiskLevel {
    const mapping = { normal: 'low', warning: 'medium', critical: 'critical', unknown: 'low' };
    return mapping[status] as RiskLevel;
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Stop monitoring interval
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      // Stop alert manager
      await this.alertManager.stop();

      // Stop dashboard engine
      await this.dashboardEngine.stop();

      this.isRunning = false;

      this.emit('monitoring_stopped', { timestamp: new Date() });

    } catch (error) {
      this.emit('monitoring_stop_failed', { error: error.message });
      throw new Error(`Failed to stop monitoring: ${error.message}`);
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): MonitoringMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get dashboard configuration
   */
  getDashboard(dashboardId: string): DashboardConfig | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get all dashboards
   */
  getAllDashboards(): DashboardConfig[] {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    return this.performanceTracker.getMetrics();
  }
}

/**
 * Performance Tracker for monitoring overhead
 */
class PerformanceTracker {
  private performanceBudget: number;
  private cycleTimes: number[] = [];
  private maxCycles: number = 100;

  constructor(budget: number) {
    this.performanceBudget = budget;
  }

  async recordCycle(duration: number): Promise<void> {
    this.cycleTimes.push(duration);

    // Keep only recent cycles
    if (this.cycleTimes.length > this.maxCycles) {
      this.cycleTimes.shift();
    }

    // Check performance budget
    const avgDuration = this.cycleTimes.reduce((sum, time) => sum + time, 0) / this.cycleTimes.length;
    const budgetPercentage = (avgDuration / 1000) / 100; // Convert to percentage

    if (budgetPercentage > this.performanceBudget) {
      // Emit performance budget exceeded warning
    }
  }

  getMetrics(): any {
    const avgDuration = this.cycleTimes.length > 0
      ? this.cycleTimes.reduce((sum, time) => sum + time, 0) / this.cycleTimes.length
      : 0;

    return {
      averageCycleDuration: avgDuration,
      budgetUtilization: ((avgDuration / 1000) / 100) / this.performanceBudget,
      cycleCount: this.cycleTimes.length
    };
  }
}

/**
 * Alert Manager for notification handling
 */
class AlertManager {
  private isRunning: boolean = false;

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  async sendAlert(params: { alert: AlertConfiguration; metric: MonitoringMetric; timestamp: Date }): Promise<void> {
    // Implementation would send alerts through configured channels
    console.log(`Alert: ${params.alert.name} - ${params.metric.name} = ${params.metric.value}`);
  }
}

/**
 * Dashboard Engine for real-time dashboards
 */
class DashboardEngine {
  private isRunning: boolean = false;

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  async updateDashboards(metrics: Map<string, MonitoringMetric>): Promise<void> {
    // Implementation would update dashboard data
  }
}

export default RealTimeMonitor;