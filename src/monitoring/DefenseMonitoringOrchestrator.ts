/**
 * Defense Monitoring Orchestrator
 * Coordinates all monitoring systems with unified alerting and response
 * Provides single point of control for defense-grade monitoring
 */

import { DefenseGradeMonitor, PerformanceReport } from './advanced/DefenseGradeMonitor';
import { DefenseRollbackSystem, RollbackResult } from '../rollback/systems/DefenseRollbackSystem';
import { DefenseSecurityMonitor, SecurityDashboard } from '../security/monitoring/DefenseSecurityMonitor';
import { ComplianceDriftDetector, ComplianceDriftReport } from '../compliance/monitoring/ComplianceDriftDetector';

export interface UnifiedMonitoringStatus {
  timestamp: number;
  overall: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
    score: number;
    lastUpdate: number;
  };
  performance: {
    overhead: number;
    target: number;
    status: 'OK' | 'WARNING' | 'CRITICAL';
    trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  };
  security: {
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    incidentCount: number;
    complianceScore: number;
    lastThreat: number;
  };
  compliance: {
    overallScore: number;
    driftCount: number;
    criticalViolations: number;
    lastViolation: number;
  };
  rollback: {
    ready: boolean;
    lastSnapshot: number;
    estimatedTime: number;
    historyCount: number;
  };
  alerts: {
    active: number;
    critical: number;
    suppressedUntil: number;
  };
}

export interface MonitoringConfiguration {
  performanceThresholds: {
    overheadWarning: number;
    overheadCritical: number;
    responseTimeMax: number;
    memoryMax: number;
  };
  securityThresholds: {
    threatEscalation: number;
    incidentEscalation: number;
    complianceMin: number;
  };
  complianceThresholds: {
    driftWarning: number;
    driftCritical: number;
    violationMax: number;
  };
  rollbackTriggers: {
    performanceOverhead: number;
    securityThreatLevel: string;
    complianceDrift: number;
    manualTrigger: boolean;
  };
  alertingConfig: {
    suppressDuplicates: boolean;
    escalationDelay: number;
    maxAlertsPerHour: number;
  };
}

export interface DefenseAlert {
  id: string;
  timestamp: number;
  source: 'PERFORMANCE' | 'SECURITY' | 'COMPLIANCE' | 'SYSTEM';
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'EMERGENCY';
  title: string;
  description: string;
  details: any;
  actions: AlertAction[];
  escalated: boolean;
  acknowledged: boolean;
  suppressUntil?: number;
  rollbackTriggered?: boolean;
}

export interface AlertAction {
  type: 'INVESTIGATE' | 'REMEDIATE' | 'ROLLBACK' | 'ESCALATE' | 'SUPPRESS';
  description: string;
  automated: boolean;
  executed: boolean;
  result?: any;
}

export class DefenseMonitoringOrchestrator {
  private performanceMonitor: DefenseGradeMonitor;
  private rollbackSystem: DefenseRollbackSystem;
  private securityMonitor: DefenseSecurityMonitor;
  private complianceDetector: ComplianceDriftDetector;

  private configuration: MonitoringConfiguration;
  private activeAlerts: Map<string, DefenseAlert> = new Map();
  private monitoringActive: boolean = false;
  private lastStatus: UnifiedMonitoringStatus | null = null;

  private unifiedLogger: UnifiedAuditLogger;
  private dashboardUpdater: DashboardUpdater;
  private escalationManager: EscalationManager;

  constructor(config?: Partial<MonitoringConfiguration>) {
    this.configuration = this.mergeConfiguration(config);

    // Initialize monitoring components
    this.performanceMonitor = new DefenseGradeMonitor();
    this.rollbackSystem = new DefenseRollbackSystem();
    this.securityMonitor = new DefenseSecurityMonitor();
    this.complianceDetector = new ComplianceDriftDetector(this.rollbackSystem);

    // Initialize support systems
    this.unifiedLogger = new UnifiedAuditLogger();
    this.dashboardUpdater = new DashboardUpdater();
    this.escalationManager = new EscalationManager();
  }

  public async startDefenseMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.log('[DefenseOrchestrator] Monitoring already active');
      return;
    }

    console.log('[DefenseOrchestrator] Starting unified defense monitoring');
    this.monitoringActive = true;

    try {
      // Start all monitoring systems
      await Promise.all([
        this.performanceMonitor.startMonitoring(),
        this.rollbackSystem.startRollbackSystem(),
        this.securityMonitor.startSecurityMonitoring(),
        this.complianceDetector.startDriftDetection()
      ]);

      // Start orchestration loops
      await Promise.all([
        this.startUnifiedStatusMonitoring(),
        this.startAlertCorrelation(),
        this.startAutomaticResponse(),
        this.startDashboardUpdates(),
        this.startHealthChecks()
      ]);

      console.log('[DefenseOrchestrator] Defense monitoring fully operational');

    } catch (error) {
      console.error('[DefenseOrchestrator] Failed to start monitoring:', error);
      this.monitoringActive = false;
      throw error;
    }
  }

  public async stopDefenseMonitoring(): Promise<void> {
    console.log('[DefenseOrchestrator] Stopping defense monitoring');
    this.monitoringActive = false;

    // Stop all monitoring systems
    await Promise.all([
      this.performanceMonitor.stopMonitoring(),
      this.rollbackSystem.stopRollbackSystem(),
      this.securityMonitor.stopSecurityMonitoring(),
      this.complianceDetector.stopDriftDetection()
    ]);

    await this.unifiedLogger.finalizeSession();
    console.log('[DefenseOrchestrator] Defense monitoring stopped');
  }

  private async startUnifiedStatusMonitoring(): Promise<void> {
    while (this.monitoringActive) {
      try {
        const status = await this.generateUnifiedStatus();

        // Update last status
        this.lastStatus = status;

        // Check for critical conditions
        if (status.overall.status === 'CRITICAL' || status.overall.status === 'EMERGENCY') {
          await this.handleCriticalStatus(status);
        }

        // Log status for audit
        await this.unifiedLogger.logSystemStatus(status);

        // Update dashboard
        await this.dashboardUpdater.updateStatus(status);

      } catch (error) {
        console.error('[DefenseOrchestrator] Status monitoring error:', error);
        await this.unifiedLogger.logError('STATUS_MONITORING', error);
      }

      await this.sleep(5000); // Status update every 5 seconds
    }
  }

  private async generateUnifiedStatus(): Promise<UnifiedMonitoringStatus> {
    // Collect status from all monitoring systems
    const [performanceReport, securityDashboard, complianceReport, rollbackValidation] = await Promise.all([
      this.performanceMonitor.getPerformanceReport(),
      this.securityMonitor.getSecurityDashboardData(),
      this.complianceDetector.getDriftReport(),
      this.rollbackSystem.validateSystem()
    ]);

    // Calculate overall status
    const overallScore = this.calculateOverallScore(
      performanceReport,
      securityDashboard,
      complianceReport
    );

    const overallStatus = this.determineOverallStatus(overallScore, {
      performance: performanceReport,
      security: securityDashboard,
      compliance: complianceReport
    });

    return {
      timestamp: Date.now(),
      overall: {
        status: overallStatus,
        score: overallScore,
        lastUpdate: Date.now()
      },
      performance: {
        overhead: performanceReport.currentOverhead,
        target: performanceReport.targetOverhead,
        status: performanceReport.complianceWithTarget ? 'OK' : 'WARNING',
        trend: performanceReport.predictions.trendDirection
      },
      security: {
        threatLevel: securityDashboard.metrics.threatLevel,
        incidentCount: securityDashboard.activeIncidents.length,
        complianceScore: securityDashboard.metrics.complianceScore,
        lastThreat: securityDashboard.recentThreats[0]?.timestamp || 0
      },
      compliance: {
        overallScore: complianceReport.activeDrifts.reduce((sum, drift) => sum + drift.currentScore, 0) / complianceReport.activeDrifts.length || 0.95,
        driftCount: complianceReport.totalDrifts,
        criticalViolations: complianceReport.criticalDrifts,
        lastViolation: complianceReport.activeDrifts[0]?.timestamp || 0
      },
      rollback: {
        ready: rollbackValidation.rollbackCapability,
        lastSnapshot: rollbackValidation.lastSnapshot,
        estimatedTime: rollbackValidation.estimatedRollbackTime,
        historyCount: rollbackValidation.snapshotCount
      },
      alerts: {
        active: this.activeAlerts.size,
        critical: Array.from(this.activeAlerts.values()).filter(alert => alert.level === 'CRITICAL' || alert.level === 'EMERGENCY').length,
        suppressedUntil: Math.max(...Array.from(this.activeAlerts.values()).map(alert => alert.suppressUntil || 0))
      }
    };
  }

  private async startAlertCorrelation(): Promise<void> {
    while (this.monitoringActive) {
      try {
        // Correlate alerts from different monitoring systems
        await this.correlatePerformanceAlerts();
        await this.correlateSecurityAlerts();
        await this.correlateComplianceAlerts();

        // Process correlated alerts
        await this.processCorrelatedAlerts();

      } catch (error) {
        console.error('[DefenseOrchestrator] Alert correlation error:', error);
        await this.unifiedLogger.logError('ALERT_CORRELATION', error);
      }

      await this.sleep(3000); // Alert correlation every 3 seconds
    }
  }

  private async startAutomaticResponse(): Promise<void> {
    while (this.monitoringActive) {
      try {
        const criticalAlerts = Array.from(this.activeAlerts.values())
          .filter(alert => alert.level === 'CRITICAL' || alert.level === 'EMERGENCY')
          .filter(alert => !alert.acknowledged);

        for (const alert of criticalAlerts) {
          await this.executeAutomaticResponse(alert);
        }

        // Check for rollback triggers
        await this.checkRollbackTriggers();

      } catch (error) {
        console.error('[DefenseOrchestrator] Automatic response error:', error);
        await this.unifiedLogger.logError('AUTOMATIC_RESPONSE', error);
      }

      await this.sleep(2000); // Response check every 2 seconds
    }
  }

  private async executeAutomaticResponse(alert: DefenseAlert): Promise<void> {
    console.log(`[DefenseOrchestrator] Executing automatic response for alert: ${alert.id}`);

    for (const action of alert.actions.filter(a => a.automated && !a.executed)) {
      try {
        const result = await this.executeAlertAction(action, alert);
        action.executed = true;
        action.result = result;

        if (action.type === 'ROLLBACK') {
          alert.rollbackTriggered = true;
        }

        await this.unifiedLogger.logAutomaticResponse(alert.id, action, result);

      } catch (error) {
        console.error(`[DefenseOrchestrator] Failed to execute action ${action.type}:`, error);
        await this.unifiedLogger.logResponseError(alert.id, action, error);
      }
    }
  }

  private async checkRollbackTriggers(): Promise<void> {
    if (!this.lastStatus) return;

    const triggers = this.configuration.rollbackTriggers;
    let rollbackTriggered = false;
    let rollbackReason = '';

    // Performance trigger
    if (this.lastStatus.performance.overhead > triggers.performanceOverhead) {
      rollbackTriggered = true;
      rollbackReason = `Performance overhead ${this.lastStatus.performance.overhead}% exceeds ${triggers.performanceOverhead}%`;
    }

    // Security trigger
    if (this.lastStatus.security.threatLevel === triggers.securityThreatLevel) {
      rollbackTriggered = true;
      rollbackReason = `Security threat level: ${this.lastStatus.security.threatLevel}`;
    }

    // Compliance trigger
    if (this.lastStatus.compliance.criticalViolations > 0) {
      rollbackTriggered = true;
      rollbackReason = `Critical compliance violations: ${this.lastStatus.compliance.criticalViolations}`;
    }

    if (rollbackTriggered) {
      await this.triggerEmergencyRollback(rollbackReason);
    }
  }

  private async triggerEmergencyRollback(reason: string): Promise<void> {
    try {
      console.log(`[DefenseOrchestrator] EMERGENCY ROLLBACK TRIGGERED: ${reason}`);

      const rollbackResult = await this.rollbackSystem.executeRollback(
        (await this.rollbackSystem.getSnapshotHistory())[0]?.id || 'latest',
        `EMERGENCY: ${reason}`
      );

      // Create emergency alert
      const emergencyAlert: DefenseAlert = {
        id: `emergency_${Date.now()}`,
        timestamp: Date.now(),
        source: 'SYSTEM',
        level: 'EMERGENCY',
        title: 'Emergency Rollback Executed',
        description: reason,
        details: rollbackResult,
        actions: [],
        escalated: true,
        acknowledged: false,
        rollbackTriggered: true
      };

      this.activeAlerts.set(emergencyAlert.id, emergencyAlert);
      await this.escalationManager.escalateEmergency(emergencyAlert);
      await this.unifiedLogger.logEmergencyRollback(emergencyAlert);

    } catch (error) {
      console.error('[DefenseOrchestrator] Emergency rollback failed:', error);
      await this.unifiedLogger.logError('EMERGENCY_ROLLBACK', error);
    }
  }

  public async getDefenseStatus(): Promise<UnifiedMonitoringStatus> {
    if (this.lastStatus) {
      return this.lastStatus;
    }
    return await this.generateUnifiedStatus();
  }

  public async acknowledgeAlert(alertId: string, operator: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    await this.unifiedLogger.logAlertAcknowledged(alertId, operator);
    return true;
  }

  public async suppressAlert(alertId: string, duration: number, operator: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.suppressUntil = Date.now() + duration;
    await this.unifiedLogger.logAlertSuppressed(alertId, duration, operator);
    return true;
  }

  public getActiveAlerts(): DefenseAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.suppressUntil || alert.suppressUntil < Date.now())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Helper methods
  private mergeConfiguration(config?: Partial<MonitoringConfiguration>): MonitoringConfiguration {
    const defaultConfig: MonitoringConfiguration = {
      performanceThresholds: {
        overheadWarning: 0.8,
        overheadCritical: 1.2,
        responseTimeMax: 1000,
        memoryMax: 512
      },
      securityThresholds: {
        threatEscalation: 5,
        incidentEscalation: 3,
        complianceMin: 0.9
      },
      complianceThresholds: {
        driftWarning: 0.05,
        driftCritical: 0.1,
        violationMax: 5
      },
      rollbackTriggers: {
        performanceOverhead: 1.5,
        securityThreatLevel: 'CRITICAL',
        complianceDrift: 0.15,
        manualTrigger: true
      },
      alertingConfig: {
        suppressDuplicates: true,
        escalationDelay: 300000, // 5 minutes
        maxAlertsPerHour: 50
      }
    };

    return { ...defaultConfig, ...config };
  }

  private calculateOverallScore(
    performance: PerformanceReport,
    security: SecurityDashboard,
    compliance: ComplianceDriftReport
  ): number {
    // Weight: 40% performance, 35% security, 25% compliance
    const perfScore = performance.complianceWithTarget ? 100 : Math.max(0, 100 - (performance.currentOverhead * 50));
    const secScore = security.metrics.overallScore;
    const compScore = (compliance.totalDrifts === 0 ? 100 : Math.max(0, 100 - (compliance.criticalDrifts * 20)));

    return Math.round((perfScore * 0.4) + (secScore * 0.35) + (compScore * 0.25));
  }

  private determineOverallStatus(score: number, data: any): 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EMERGENCY' {
    if (score >= 90) return 'HEALTHY';
    if (score >= 75) return 'WARNING';
    if (score >= 60) return 'CRITICAL';
    return 'EMERGENCY';
  }

  private async handleCriticalStatus(status: UnifiedMonitoringStatus): Promise<void> {
    console.log(`[DefenseOrchestrator] CRITICAL STATUS DETECTED: ${status.overall.status}`);

    const criticalAlert: DefenseAlert = {
      id: `critical_${Date.now()}`,
      timestamp: Date.now(),
      source: 'SYSTEM',
      level: 'CRITICAL',
      title: 'Critical System Status',
      description: `Overall system status: ${status.overall.status} (Score: ${status.overall.score})`,
      details: status,
      actions: [
        {
          type: 'INVESTIGATE',
          description: 'Investigate system status degradation',
          automated: false,
          executed: false
        },
        {
          type: 'ESCALATE',
          description: 'Escalate to operations team',
          automated: true,
          executed: false
        }
      ],
      escalated: false,
      acknowledged: false
    };

    this.activeAlerts.set(criticalAlert.id, criticalAlert);
    await this.escalationManager.escalateCritical(criticalAlert);
  }

  // Mock implementations for supporting methods
  private async correlatePerformanceAlerts(): Promise<void> {
    // Implementation would correlate performance alerts
  }

  private async correlateSecurityAlerts(): Promise<void> {
    // Implementation would correlate security alerts
  }

  private async correlateComplianceAlerts(): Promise<void> {
    // Implementation would correlate compliance alerts
  }

  private async processCorrelatedAlerts(): Promise<void> {
    // Implementation would process correlated alerts
  }

  private async executeAlertAction(action: AlertAction, alert: DefenseAlert): Promise<any> {
    console.log(`[DefenseOrchestrator] Executing action: ${action.type}`);
    return { success: true };
  }

  private async startDashboardUpdates(): Promise<void> {
    while (this.monitoringActive) {
      try {
        if (this.lastStatus) {
          await this.dashboardUpdater.updateDashboard(this.lastStatus, this.getActiveAlerts());
        }
      } catch (error) {
        console.error('[DefenseOrchestrator] Dashboard update error:', error);
      }

      await this.sleep(10000); // Dashboard update every 10 seconds
    }
  }

  private async startHealthChecks(): Promise<void> {
    while (this.monitoringActive) {
      try {
        const healthStatus = await this.performSystemHealthCheck();
        if (!healthStatus.healthy) {
          await this.handleUnhealthySystem(healthStatus);
        }
      } catch (error) {
        console.error('[DefenseOrchestrator] Health check error:', error);
      }

      await this.sleep(30000); // Health check every 30 seconds
    }
  }

  private async performSystemHealthCheck(): Promise<any> {
    return { healthy: true, issues: [] };
  }

  private async handleUnhealthySystem(healthStatus: any): Promise<void> {
    console.log('[DefenseOrchestrator] Unhealthy system detected:', healthStatus);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Supporting classes
class UnifiedAuditLogger {
  async logSystemStatus(status: UnifiedMonitoringStatus): Promise<void> {
    // Implementation would log system status
  }

  async logError(component: string, error: any): Promise<void> {
    // Implementation would log errors
  }

  async logAutomaticResponse(alertId: string, action: AlertAction, result: any): Promise<void> {
    // Implementation would log automatic responses
  }

  async logResponseError(alertId: string, action: AlertAction, error: any): Promise<void> {
    // Implementation would log response errors
  }

  async logEmergencyRollback(alert: DefenseAlert): Promise<void> {
    // Implementation would log emergency rollbacks
  }

  async logAlertAcknowledged(alertId: string, operator: string): Promise<void> {
    // Implementation would log alert acknowledgments
  }

  async logAlertSuppressed(alertId: string, duration: number, operator: string): Promise<void> {
    // Implementation would log alert suppressions
  }

  async finalizeSession(): Promise<void> {
    // Implementation would finalize logging session
  }
}

class DashboardUpdater {
  async updateStatus(status: UnifiedMonitoringStatus): Promise<void> {
    // Implementation would update monitoring dashboard
  }

  async updateDashboard(status: UnifiedMonitoringStatus, alerts: DefenseAlert[]): Promise<void> {
    // Implementation would update full dashboard
  }
}

class EscalationManager {
  async escalateCritical(alert: DefenseAlert): Promise<void> {
    console.log(`[ESCALATION] Critical alert: ${alert.id}`);
  }

  async escalateEmergency(alert: DefenseAlert): Promise<void> {
    console.log(`[ESCALATION] Emergency alert: ${alert.id}`);
  }
}