/**
 * Compliance Audit Logger - NASA Rule 10 Compliant
 * Logs compliance audit events with <=60 line functions
 * Modularized from main ComplianceDriftDetector
 */

import {
  ComplianceBaseline,
  DriftAlert,
  ComplianceDrift,
  RollbackSnapshot,
  ComplianceStandard
} from '../../types/domains/compliance-types';

import {
  ComplianceRuleId,
  Timestamp
} from '../../types/base/primitives';

export class ComplianceAuditLogger {
  private sessionId: string;
  private logEntries: AuditLogEntry[] = [];

  constructor() {
    this.sessionId = `audit_${Date.now()}`;
  }

  // NASA Rule 10: <=60 lines
  public async logBaselineEstablished(baseline: ComplianceBaseline): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'BASELINE_ESTABLISHED',
      component: 'ComplianceDriftDetector',
      description: `Baseline established for ${baseline.standard}`,
      details: {
        standard: baseline.standard,
        score: baseline.overallScore,
        ruleCount: baseline.ruleScores.size,
        validUntil: baseline.validUntil
      },
      severity: 'INFO'
    };

    this.recordEntry(entry);
    console.log(`[AUDIT] Baseline established: ${baseline.standard} - ${baseline.overallScore}`);
  }

  // NASA Rule 10: <=60 lines
  public async logDriftAlert(alert: DriftAlert): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'DRIFT_ALERT_CREATED',
      component: 'AlertManager',
      description: `Drift alert created for ${alert.drift.standard}`,
      details: {
        alertId: alert.id,
        alertLevel: alert.alertLevel,
        driftPercentage: alert.drift.driftPercentage,
        severity: alert.drift.severity,
        escalationRequired: alert.escalationRequired
      },
      severity: this.mapAlertLevelToSeverity(alert.alertLevel)
    };

    this.recordEntry(entry);
    console.log(`[AUDIT] Drift alert created: ${alert.id} - ${alert.alertLevel}`);
  }

  // NASA Rule 10: <=60 lines
  public async logAutomaticRollback(drift: ComplianceDrift): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'AUTOMATIC_ROLLBACK',
      component: 'RollbackManager',
      description: `Automatic rollback triggered for ${drift.standard}`,
      details: {
        driftId: drift.id,
        standard: drift.standard,
        driftPercentage: drift.driftPercentage,
        severity: drift.severity,
        timeToViolation: drift.timeToViolation
      },
      severity: 'CRITICAL'
    };

    this.recordEntry(entry);
    console.log(`[AUDIT] Automatic rollback triggered: ${drift.standard} - ${drift.driftPercentage}`);
  }

  // NASA Rule 10: <=60 lines
  public async logBaselineRefreshed(baseline: ComplianceBaseline): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'BASELINE_REFRESHED',
      component: 'BaselineManager',
      description: `Baseline refreshed for ${baseline.standard}`,
      details: {
        standard: baseline.standard,
        newScore: baseline.overallScore,
        timestamp: baseline.timestamp,
        validUntil: baseline.validUntil
      },
      severity: 'INFO'
    };

    this.recordEntry(entry);
    console.log(`[AUDIT] Baseline refreshed: ${baseline.standard} - ${baseline.overallScore}`);
  }

  // NASA Rule 10: <=60 lines
  public async logAutomaticFix(ruleId: ComplianceRuleId, action: string): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'AUTOMATIC_FIX_APPLIED',
      component: 'ComplianceDriftDetector',
      description: `Automatic fix applied for rule ${ruleId}`,
      details: {
        ruleId: ruleId.toString(),
        action,
        automated: true
      },
      severity: 'INFO'
    };

    this.recordEntry(entry);
    console.log(`[AUDIT] Automatic fix applied: ${ruleId} - ${action}`);
  }

  // NASA Rule 10: <=60 lines
  public async logFixError(ruleId: ComplianceRuleId, action: string, error: unknown): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'FIX_ERROR',
      component: 'ComplianceDriftDetector',
      description: `Fix error for rule ${ruleId}`,
      details: {
        ruleId: ruleId.toString(),
        action,
        error: String(error),
        automated: true
      },
      severity: 'ERROR'
    };

    this.recordEntry(entry);
    console.log(`[AUDIT] Fix error: ${ruleId} - ${action} - ${error}`);
  }

  // NASA Rule 10: <=60 lines
  public async logError(component: string, context: string, error: unknown): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'SYSTEM_ERROR',
      component,
      description: `System error in ${component}`,
      details: {
        context,
        error: String(error),
        stackTrace: error instanceof Error ? error.stack : undefined
      },
      severity: 'ERROR'
    };

    this.recordEntry(entry);
    console.log(`[AUDIT] Error: ${component} - ${context} - ${error}`);
  }

  // NASA Rule 10: <=60 lines
  public async logAlertSent(alert: DriftAlert): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'ALERT_SENT',
      component: 'AlertManager',
      description: `Alert sent: ${alert.id}`,
      details: {
        alertId: alert.id,
        alertLevel: alert.alertLevel,
        recipientCount: alert.recipients.length,
        channels: alert.recipients.map(r => r.type)
      },
      severity: 'INFO'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logAlertError(alertId: string, recipient: string, error: unknown): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'ALERT_ERROR',
      component: 'AlertManager',
      description: `Failed to send alert ${alertId}`,
      details: {
        alertId,
        recipient,
        error: String(error)
      },
      severity: 'ERROR'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logAlertEscalated(alert: DriftAlert): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'ALERT_ESCALATED',
      component: 'AlertManager',
      description: `Alert escalated: ${alert.id}`,
      details: {
        alertId: alert.id,
        alertLevel: alert.alertLevel,
        escalationLevel: 2
      },
      severity: 'WARNING'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logAlertAcknowledged(alert: DriftAlert, acknowledgedBy: string): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'ALERT_ACKNOWLEDGED',
      component: 'AlertManager',
      description: `Alert acknowledged: ${alert.id}`,
      details: {
        alertId: alert.id,
        acknowledgedBy,
        acknowledgedAt: Date.now()
      },
      severity: 'INFO'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logAlertSuppression(standard: string, suppressUntil: Timestamp): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'ALERT_SUPPRESSION',
      component: 'AlertManager',
      description: `Alerts suppressed for ${standard}`,
      details: {
        standard,
        suppressUntil,
        duration: suppressUntil - Date.now()
      },
      severity: 'WARNING'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logRollbackError(driftId: string, error: unknown): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'ROLLBACK_ERROR',
      component: 'RollbackManager',
      description: `Rollback failed for drift ${driftId}`,
      details: {
        driftId,
        error: String(error)
      },
      severity: 'CRITICAL'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logRollbackRecommendation(drift: ComplianceDrift): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'ROLLBACK_RECOMMENDED',
      component: 'RollbackManager',
      description: `Rollback recommended for ${drift.standard}`,
      details: {
        driftId: drift.id,
        standard: drift.standard,
        driftPercentage: drift.driftPercentage,
        severity: drift.severity
      },
      severity: 'WARNING'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logSnapshotCreated(snapshot: RollbackSnapshot): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'SNAPSHOT_CREATED',
      component: 'RollbackManager',
      description: `Snapshot created: ${snapshot.id}`,
      details: {
        snapshotId: snapshot.id,
        description: snapshot.description,
        size: snapshot.size,
        checksum: snapshot.checksum
      },
      severity: 'INFO'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logSnapshotError(description: string, error: unknown): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'SNAPSHOT_ERROR',
      component: 'RollbackManager',
      description: `Snapshot creation failed: ${description}`,
      details: {
        description,
        error: String(error)
      },
      severity: 'ERROR'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async logBaselineSessionEnd(standard: ComplianceStandard, baseline: ComplianceBaseline): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'BASELINE_SESSION_END',
      component: 'BaselineManager',
      description: `Baseline session ended for ${standard}`,
      details: {
        standard,
        baselineId: baseline.id,
        finalScore: baseline.overallScore
      },
      severity: 'INFO'
    };

    this.recordEntry(entry);
  }

  // NASA Rule 10: <=60 lines
  public async finalizeSession(): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: Date.now() as Timestamp,
      sessionId: this.sessionId,
      eventType: 'SESSION_FINALIZED',
      component: 'ComplianceAuditLogger',
      description: `Audit session finalized`,
      details: {
        sessionId: this.sessionId,
        entryCount: this.logEntries.length,
        duration: Date.now() - parseInt(this.sessionId.split('_')[1])
      },
      severity: 'INFO'
    };

    this.recordEntry(entry);
    console.log(`[AUDIT] Session finalized: ${this.logEntries.length} entries`);
  }

  // Helper methods - NASA Rule 10: <=60 lines each

  private recordEntry(entry: AuditLogEntry): void {
    this.logEntries.push(entry);

    // Keep only last 1000 entries to prevent memory issues
    if (this.logEntries.length > 1000) {
      this.logEntries.splice(0, this.logEntries.length - 1000);
    }
  }

  private mapAlertLevelToSeverity(alertLevel: string): AuditSeverity {
    const mapping: Record<string, AuditSeverity> = {
      'INFO': 'INFO',
      'WARNING': 'WARNING',
      'ERROR': 'ERROR',
      'CRITICAL': 'CRITICAL'
    };
    return mapping[alertLevel] || 'INFO';
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getLogEntries(): AuditLogEntry[] {
    return [...this.logEntries];
  }

  public clearLogs(): void {
    this.logEntries = [];
  }
}

// Supporting types for audit logging
interface AuditLogEntry {
  timestamp: Timestamp;
  sessionId: string;
  eventType: AuditEventType;
  component: string;
  description: string;
  details: Record<string, unknown>;
  severity: AuditSeverity;
}

type AuditEventType =
  | 'BASELINE_ESTABLISHED'
  | 'BASELINE_REFRESHED'
  | 'BASELINE_SESSION_END'
  | 'DRIFT_ALERT_CREATED'
  | 'ALERT_SENT'
  | 'ALERT_ERROR'
  | 'ALERT_ESCALATED'
  | 'ALERT_ACKNOWLEDGED'
  | 'ALERT_SUPPRESSION'
  | 'AUTOMATIC_ROLLBACK'
  | 'ROLLBACK_ERROR'
  | 'ROLLBACK_RECOMMENDED'
  | 'SNAPSHOT_CREATED'
  | 'SNAPSHOT_ERROR'
  | 'AUTOMATIC_FIX_APPLIED'
  | 'FIX_ERROR'
  | 'SYSTEM_ERROR'
  | 'SESSION_FINALIZED';

type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-020-fsm-refactor
// inputs: ["ComplianceDriftDetector-typed.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-nasa-rule-10"}
// === END FOOTER ===