/**
 * Real Security Notification System
 * Replaces fake console.log with actual security alerts and notifications
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import { AuditEvent, ComplianceCheck } from '../types/deployment-types';

export interface SecurityNotificationConfig {
  emailNotifications: {
    enabled: boolean;
    smtpServer?: string;
    recipients: string[];
  };
  slackNotifications: {
    enabled: boolean;
    webhookUrl?: string;
    channel: string;
  };
  syslogNotifications: {
    enabled: boolean;
    server?: string;
    facility: string;
  };
  fileLogging: {
    enabled: boolean;
    logPath: string;
  };
}

export class SecurityNotificationSystem {
  private config: SecurityNotificationConfig;
  private execAsync = promisify(exec);

  constructor(config?: Partial<SecurityNotificationConfig>) {
    this.config = {
      emailNotifications: {
        enabled: process.env.SECURITY_EMAIL_ENABLED === 'true',
        smtpServer: process.env.SMTP_SERVER,
        recipients: process.env.SECURITY_EMAIL_RECIPIENTS?.split(',') || ['security-team@company.com']
      },
      slackNotifications: {
        enabled: process.env.SECURITY_SLACK_ENABLED === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SECURITY_SLACK_CHANNEL || '#security-alerts'
      },
      syslogNotifications: {
        enabled: true, // Always enable syslog for audit trail
        server: process.env.SYSLOG_SERVER || 'localhost',
        facility: 'LOG_SECURITY'
      },
      fileLogging: {
        enabled: true, // Always enable file logging
        logPath: process.env.SECURITY_LOG_PATH || '/var/log/security/deployment-compliance.log'
      },
      ...config
    };
  }

  /**
   * Send audit notification for compliance events
   */
  async sendAuditNotification(auditEvent: AuditEvent): Promise<void> {
    const message = this.formatAuditMessage(auditEvent);

    await Promise.all([
      this.sendToSyslog('INFO', message),
      this.writeToLogFile('AUDIT', message),
      auditEvent.outcome === 'failure' ? this.sendCriticalAlert(message) : Promise.resolve()
    ]);
  }

  /**
   * Send compliance report notification
   */
  async sendComplianceReport(deploymentId: string, auditEvent: AuditEvent): Promise<void> {
    const subject = `Compliance Audit Completed: ${deploymentId}`;
    const message = `
🔍 COMPLIANCE AUDIT REPORT

Deployment: ${deploymentId}
Status: ${auditEvent.outcome?.toUpperCase()}
Timestamp: ${auditEvent.timestamp.toISOString()}

Details:
- Total Checks: ${auditEvent.details?.totalChecks || 'unknown'}
- Failed Checks: ${auditEvent.details?.failedChecks || 'unknown'}
- Critical Failures: ${auditEvent.details?.criticalFailures || 'unknown'}

Resource: ${auditEvent.resource}
Actor: ${auditEvent.actor}
`;

    await Promise.all([
      this.sendToSyslog('INFO', message),
      this.writeToLogFile('COMPLIANCE', message),
      this.config.emailNotifications.enabled ? this.sendEmail(subject, message) : Promise.resolve(),
      this.config.slackNotifications.enabled ? this.sendSlackMessage(message) : Promise.resolve()
    ]);
  }

  /**
   * Send critical compliance alert
   */
  async sendCriticalComplianceAlert(deploymentId: string, criticalFailures: ComplianceCheck[]): Promise<void> {
    const subject = `🚨 CRITICAL COMPLIANCE FAILURE: ${deploymentId}`;
    const message = `
🚨 CRITICAL SECURITY ALERT 🚨

Deployment: ${deploymentId}
Critical Failures: ${criticalFailures.length}

Failed Checks:
${criticalFailures.map(check => `
- ${check.name} (${check.severity})
  ${check.description}
  Details: ${check.details}
`).join('')}

IMMEDIATE ACTION REQUIRED:
1. Stop deployment process
2. Investigate security failures
3. Remediate issues before proceeding
4. Re-run compliance validation

Timestamp: ${new Date().toISOString()}
`;

    await Promise.all([
      this.sendToSyslog('CRITICAL', message),
      this.writeToLogFile('CRITICAL', message),
      this.sendCriticalAlert(message)
    ]);
  }

  /**
   * Send system status notification
   */
  async sendSystemStatusNotification(auditEvent: AuditEvent): Promise<void> {
    const message = `System ${auditEvent.details?.system} initialized successfully at ${auditEvent.timestamp.toISOString()}`;

    await Promise.all([
      this.sendToSyslog('INFO', message),
      this.writeToLogFile('SYSTEM', message)
    ]);
  }

  /**
   * Send critical alert through all available channels
   */
  private async sendCriticalAlert(message: string): Promise<void> {
    await Promise.all([
      this.config.emailNotifications.enabled ? this.sendEmail('🚨 CRITICAL SECURITY ALERT', message) : Promise.resolve(),
      this.config.slackNotifications.enabled ? this.sendSlackMessage(`🚨 CRITICAL: ${message}`) : Promise.resolve(),
      this.sendDesktopNotification('Critical Security Alert', message.substring(0, 200))
    ]);
  }

  /**
   * Send email notification
   */
  private async sendEmail(subject: string, body: string): Promise<void> {
    if (!this.config.emailNotifications.enabled) return;

    try {
      // Using system mail command or external service
      const recipients = this.config.emailNotifications.recipients.join(',');
      const emailBody = `Subject: ${subject}\n\n${body}`;

      if (process.platform !== 'win32') {
        // Unix systems - use mail command
        await this.execAsync(`echo "${emailBody}" | mail -s "${subject}" ${recipients}`);
      } else {
        // Windows - log for external processing
        await this.writeToLogFile('EMAIL_QUEUE', `TO: ${recipients}\nSUBJECT: ${subject}\n\n${body}`);
      }
    } catch (error) {
      await this.writeToLogFile('ERROR', `Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackMessage(message: string): Promise<void> {
    if (!this.config.slackNotifications.enabled || !this.config.slackNotifications.webhookUrl) return;

    try {
      const payload = {
        channel: this.config.slackNotifications.channel,
        text: message,
        username: 'Security-Bot',
        icon_emoji: ':warning:'
      };

      if (process.platform !== 'win32') {
        await this.execAsync(`curl -X POST -H 'Content-type: application/json' --data '${JSON.stringify(payload)}' ${this.config.slackNotifications.webhookUrl}`);
      } else {
        // Windows - use PowerShell
        const powershellCmd = `Invoke-RestMethod -Uri "${this.config.slackNotifications.webhookUrl}" -Method Post -Body '${JSON.stringify(payload)}' -ContentType 'application/json'`;
        await this.execAsync(`powershell -Command "${powershellCmd}"`);
      }
    } catch (error) {
      await this.writeToLogFile('ERROR', `Failed to send Slack message: ${error.message}`);
    }
  }

  /**
   * Send system log notification
   */
  private async sendToSyslog(level: string, message: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp} [${level}] SECURITY: ${message}`;

      if (process.platform !== 'win32') {
        // Unix systems - use logger command
        await this.execAsync(`logger -p security.${level.toLowerCase()} "${message}"`);
      } else {
        // Windows - write to Windows Event Log
        const eventCmd = `eventcreate /T INFORMATION /ID 1001 /L SECURITY /SO "DeploymentCompliance" /D "${message}"`;
        await this.execAsync(eventCmd);
      }
    } catch (error) {
      // Fallback to file logging if syslog fails
      await this.writeToLogFile('SYSLOG_ERROR', `Syslog failed: ${error.message}. Original message: ${message}`);
    }
  }

  /**
   * Write to security log file
   */
  private async writeToLogFile(level: string, message: string): Promise<void> {
    if (!this.config.fileLogging.enabled) return;

    try {
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp} [${level}] ${message}\n`;

      const logPath = this.config.fileLogging.logPath;

      if (process.platform !== 'win32') {
        // Unix systems
        await this.execAsync(`echo "${logEntry}" >> "${logPath}"`);
      } else {
        // Windows
        await this.execAsync(`echo ${timestamp} [${level}] ${message} >> "${logPath}"`);
      }
    } catch (error) {
      // Last resort - write to stdout with clear security prefix
      console.error(`[SECURITY_LOG_FAILURE] ${new Date().toISOString()} [${level}] ${message}`);
    }
  }

  /**
   * Send desktop notification (for local development)
   */
  private async sendDesktopNotification(title: string, message: string): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        // macOS
        await this.execAsync(`osascript -e 'display notification "${message}" with title "${title}"'`);
      } else if (process.platform === 'linux') {
        // Linux
        await this.execAsync(`notify-send "${title}" "${message}"`);
      } else if (process.platform === 'win32') {
        // Windows
        const powershellCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${message}', '${title}')`;
        await this.execAsync(`powershell -Command "${powershellCmd}"`);
      }
    } catch (error) {
      // Desktop notifications are nice-to-have, don't fail on error
    }
  }

  /**
   * Format audit message for consistent logging
   */
  private formatAuditMessage(auditEvent: AuditEvent): string {
    return `[${auditEvent.action}] ${auditEvent.actor} performed ${auditEvent.action} on ${auditEvent.resource} with outcome ${auditEvent.outcome}`;
  }
}

export default SecurityNotificationSystem;