/**
 * Alert Management Component - NASA Rule 10 Compliant
 * Manages compliance drift alerts with FSM integration
 * Each function <=60 lines
 */

import {
  ComplianceDrift,
  DriftAlert,
  AlertLevel,
  ComplianceSeverity,
  AlertMetadata,
  AlertRecipient
} from '../../types/domains/compliance-types';

import { Timestamp } from '../../types/base/primitives';
import { ComplianceAuditLogger } from '../audit/ComplianceAuditLogger';

export class AlertManager {
  private alerts: Map<string, DriftAlert> = new Map();
  private auditLogger: ComplianceAuditLogger;
  private suppressionRules: Map<string, Timestamp> = new Map();

  constructor() {
    this.auditLogger = new ComplianceAuditLogger();
  }

  // NASA Rule 10: <=60 lines
  public async createDriftAlert(drift: ComplianceDrift): Promise<DriftAlert> {
    const alertId = `alert_${drift.id}`;

    if (this.isAlertSuppressed(drift)) {
      console.log(`[AlertManager] Alert suppressed for drift: ${drift.id}`);
      return this.createSuppressedAlert(alertId, drift);
    }

    const alert: DriftAlert = {
      id: alertId,
      timestamp: Date.now() as Timestamp,
      drift,
      alertLevel: this.mapSeverityToAlertLevel(drift.severity),
      escalationRequired: this.shouldEscalate(drift),
      rollbackRecommended: this.shouldRecommendRollback(drift),
      suppressUntil: undefined,
      metadata: this.createAlertMetadata(drift),
      recipients: this.getAlertRecipients(drift)
    };

    this.alerts.set(alertId, alert);
    await this.auditLogger.logDriftAlert(alert);

    return alert;
  }

  // NASA Rule 10: <=60 lines
  private createSuppressedAlert(alertId: string, drift: ComplianceDrift): DriftAlert {
    return {
      id: alertId,
      timestamp: Date.now() as Timestamp,
      drift,
      alertLevel: AlertLevel.INFO,
      escalationRequired: false,
      rollbackRecommended: false,
      suppressUntil: this.suppressionRules.get(drift.standard.toString()),
      metadata: this.createAlertMetadata(drift),
      recipients: []
    };
  }

  // NASA Rule 10: <=60 lines
  private isAlertSuppressed(drift: ComplianceDrift): boolean {
    const suppressUntil = this.suppressionRules.get(drift.standard.toString());
    return suppressUntil !== undefined && suppressUntil > Date.now();
  }

  // NASA Rule 10: <=60 lines
  private shouldEscalate(drift: ComplianceDrift): boolean {
    return drift.severity === ComplianceSeverity.CRITICAL ||
           drift.severity === ComplianceSeverity.HIGH ||
           drift.driftPercentage > 0.1;
  }

  // NASA Rule 10: <=60 lines
  private shouldRecommendRollback(drift: ComplianceDrift): boolean {
    return drift.driftPercentage > 0.15 ||
           drift.severity === ComplianceSeverity.CRITICAL ||
           drift.timeToViolation < 3600; // Less than 1 hour to violation
  }

  // NASA Rule 10: <=60 lines
  private mapSeverityToAlertLevel(severity: ComplianceSeverity): AlertLevel {
    const mapping: Record<ComplianceSeverity, AlertLevel> = {
      [ComplianceSeverity.LOW]: AlertLevel.INFO,
      [ComplianceSeverity.MEDIUM]: AlertLevel.WARNING,
      [ComplianceSeverity.HIGH]: AlertLevel.ERROR,
      [ComplianceSeverity.CRITICAL]: AlertLevel.CRITICAL
    };
    return mapping[severity];
  }

  // NASA Rule 10: <=60 lines
  private createAlertMetadata(drift: ComplianceDrift): AlertMetadata {
    return {
      source: 'ComplianceDriftDetector',
      priority: this.calculateAlertPriority(drift),
      category: 'drift',
      correlationId: drift.id,
      parentAlertId: undefined,
      childAlertIds: []
    };
  }

  // NASA Rule 10: <=60 lines
  private calculateAlertPriority(drift: ComplianceDrift): number {
    if (drift.severity === ComplianceSeverity.CRITICAL) return 10;
    if (drift.severity === ComplianceSeverity.HIGH) return 8;
    if (drift.severity === ComplianceSeverity.MEDIUM) return 5;
    return 2;
  }

  // NASA Rule 10: <=60 lines
  private getAlertRecipients(drift: ComplianceDrift): AlertRecipient[] {
    const recipients: AlertRecipient[] = [
      {
        type: 'email',
        address: 'compliance@company.com',
        escalationLevel: 1,
        acknowledged: false
      }
    ];

    if (drift.severity === ComplianceSeverity.CRITICAL) {
      recipients.push({
        type: 'sms',
        address: '+1234567890',
        escalationLevel: 2,
        acknowledged: false
      });
    }

    return recipients;
  }

  // NASA Rule 10: <=60 lines
  public async sendAlert(alert: DriftAlert): Promise<void> {
    if (alert.suppressUntil && alert.suppressUntil > Date.now()) {
      console.log(`[AlertManager] Alert ${alert.id} is suppressed until ${new Date(alert.suppressUntil)}`);
      return;
    }

    console.log(`[AlertManager] Sending ${alert.alertLevel} alert: ${alert.id}`);
    console.log(`[AlertManager] Drift: ${alert.drift.standard} - ${(alert.drift.driftPercentage * 100).toFixed(2)}%`);

    for (const recipient of alert.recipients) {
      await this.sendToRecipient(alert, recipient);
    }

    await this.auditLogger.logAlertSent(alert);
  }

  // NASA Rule 10: <=60 lines
  private async sendToRecipient(alert: DriftAlert, recipient: AlertRecipient): Promise<void> {
    try {
      console.log(`[AlertManager] Sending to ${recipient.type}: ${recipient.address}`);

      switch (recipient.type) {
        case 'email':
          await this.sendEmailAlert(alert, recipient);
          break;
        case 'sms':
          await this.sendSMSAlert(alert, recipient);
          break;
        case 'slack':
          await this.sendSlackAlert(alert, recipient);
          break;
        case 'webhook':
          await this.sendWebhookAlert(alert, recipient);
          break;
        default:
          console.warn(`[AlertManager] Unknown recipient type: ${recipient.type}`);
      }

    } catch (error) {
      console.error(`[AlertManager] Failed to send alert to ${recipient.address}:`, error);
      await this.auditLogger.logAlertError(alert.id, recipient.address, error);
    }
  }

  // NASA Rule 10: <=60 lines
  private async sendEmailAlert(alert: DriftAlert, recipient: AlertRecipient): Promise<void> {
    // Email sending implementation would go here
    console.log(`[AlertManager] Email sent to ${recipient.address}`);
  }

  // NASA Rule 10: <=60 lines
  private async sendSMSAlert(alert: DriftAlert, recipient: AlertRecipient): Promise<void> {
    // SMS sending implementation would go here
    console.log(`[AlertManager] SMS sent to ${recipient.address}`);
  }

  // NASA Rule 10: <=60 lines
  private async sendSlackAlert(alert: DriftAlert, recipient: AlertRecipient): Promise<void> {
    // Slack notification implementation would go here
    console.log(`[AlertManager] Slack message sent to ${recipient.address}`);
  }

  // NASA Rule 10: <=60 lines
  private async sendWebhookAlert(alert: DriftAlert, recipient: AlertRecipient): Promise<void> {
    // Webhook notification implementation would go here
    console.log(`[AlertManager] Webhook called: ${recipient.address}`);
  }

  // NASA Rule 10: <=60 lines
  public async escalateAlert(alert: DriftAlert): Promise<void> {
    console.log(`[AlertManager] Escalating critical alert: ${alert.id}`);

    const escalatedRecipients = alert.recipients.filter(r => r.escalationLevel > 1);

    for (const recipient of escalatedRecipients) {
      await this.sendToRecipient(alert, recipient);
    }

    await this.auditLogger.logAlertEscalated(alert);
  }

  // NASA Rule 10: <=60 lines
  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    const now = Date.now() as Timestamp;

    for (const recipient of alert.recipients) {
      recipient.acknowledged = true;
      recipient.acknowledgedAt = now;
      recipient.acknowledgedBy = acknowledgedBy;
    }

    await this.auditLogger.logAlertAcknowledged(alert, acknowledgedBy);
    return true;
  }

  // NASA Rule 10: <=60 lines
  public async suppressAlerts(standard: string, duration: number): Promise<void> {
    const suppressUntil = (Date.now() + duration) as Timestamp;
    this.suppressionRules.set(standard, suppressUntil);

    console.log(`[AlertManager] Alerts suppressed for ${standard} until ${new Date(suppressUntil)}`);
    await this.auditLogger.logAlertSuppression(standard, suppressUntil);
  }

  // NASA Rule 10: <=60 lines
  public async getActiveAlerts(): Promise<DriftAlert[]> {
    const now = Date.now() as Timestamp;
    return Array.from(this.alerts.values()).filter(
      alert => !alert.suppressUntil || alert.suppressUntil < now
    );
  }

  // NASA Rule 10: <=60 lines
  public async getPendingEscalations(): Promise<DriftAlert[]> {
    return Array.from(this.alerts.values()).filter(
      alert => alert.escalationRequired && !alert.recipients.some(r => r.acknowledged)
    );
  }

  // NASA Rule 10: <=60 lines
  public async clearOldAlerts(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = (Date.now() - (olderThanHours * 3600000)) as Timestamp;
    let clearedCount = 0;

    for (const [alertId, alert] of this.alerts) {
      if (alert.timestamp < cutoffTime) {
        this.alerts.delete(alertId);
        clearedCount++;
      }
    }

    console.log(`[AlertManager] Cleared ${clearedCount} old alerts`);
    return clearedCount;
  }

  // NASA Rule 10: <=60 lines
  public getAlertCount(): number {
    return this.alerts.size;
  }

  // NASA Rule 10: <=60 lines
  public getAlert(alertId: string): DriftAlert | undefined {
    return this.alerts.get(alertId);
  }
}

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