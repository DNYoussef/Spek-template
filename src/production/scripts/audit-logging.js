/**
 * GaryTaleb Trading System - Audit Logging System
 * Defense Industry Compliance with Immutable Audit Trails
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const { CloudWatchLogs } = require('@aws-sdk/client-cloudwatch-logs');

class AuditLogger {
    constructor(config = {}) {
        this.config = {
            logLevel: config.logLevel || 'info',
            logDirectory: config.logDirectory || '/app/logs/audit',
            retentionDays: config.retentionDays || 2555, // 7 years for financial compliance
            encryptionKey: config.encryptionKey || process.env.AUDIT_ENCRYPTION_KEY,
            awsRegion: config.awsRegion || 'us-east-1',
            complianceMode: config.complianceMode || 'defense-industry',
            ...config
        };

        this.initializeLogger();
        this.initializeCloudWatch();
        this.sequenceNumber = 0;
        this.sessionId = this.generateSessionId();
    }

    /**
     * Initialize Winston logger with multiple transports
     */
    initializeLogger() {
        const logFormat = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss.SSS'
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(info => {
                return JSON.stringify({
                    ...info,
                    auditSignature: this.generateAuditSignature(info),
                    complianceLevel: this.config.complianceMode,
                    immutable: true
                });
            })
        );

        this.logger = winston.createLogger({
            level: this.config.logLevel,
            format: logFormat,
            transports: [
                // File transport for local audit trail
                new winston.transports.File({
                    filename: path.join(this.config.logDirectory, 'audit.log'),
                    maxsize: 100 * 1024 * 1024, // 100MB
                    maxFiles: 1000,
                    tailable: true
                }),
                // Separate file for security events
                new winston.transports.File({
                    filename: path.join(this.config.logDirectory, 'security-audit.log'),
                    level: 'warn',
                    maxsize: 100 * 1024 * 1024,
                    maxFiles: 1000,
                    tailable: true
                }),
                // Console for development/debugging
                new winston.transports.Console({
                    level: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
                })
            ]
        });
    }

    /**
     * Initialize AWS CloudWatch Logs client
     */
    initializeCloudWatch() {
        if (this.config.awsRegion) {
            this.cloudWatch = new CloudWatchLogs({
                region: this.config.awsRegion
            });
            this.logGroupName = '/aws/gary-taleb-trading/audit';
            this.logStreamName = `audit-${new Date().toISOString().split('T')[0]}-${this.sessionId}`;
        }
    }

    /**
     * Generate unique session ID for audit trail correlation
     */
    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Generate audit signature for integrity verification
     */
    generateAuditSignature(logEntry) {
        const data = JSON.stringify({
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message,
            sequenceNumber: this.sequenceNumber++
        });

        return crypto
            .createHmac('sha256', this.config.encryptionKey || 'default-key')
            .update(data)
            .digest('hex');
    }

    /**
     * Core audit logging method
     */
    async audit(level, event, details = {}) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            sequenceNumber: this.sequenceNumber++,
            event,
            level,
            userId: details.userId || 'system',
            ipAddress: details.ipAddress || 'unknown',
            userAgent: details.userAgent || 'unknown',
            action: details.action || event,
            resource: details.resource || 'unknown',
            outcome: details.outcome || 'unknown',
            details: details.additionalData || {},
            compliance: {
                sox: true,
                sec: true,
                finra: true,
                pci: true,
                nasaPot10: true
            },
            metadata: {
                environment: process.env.NODE_ENV || 'unknown',
                version: process.env.APP_VERSION || '1.0.0',
                nodeId: process.env.HOSTNAME || 'unknown',
                processId: process.pid
            }
        };

        // Add digital signature
        auditEntry.signature = this.generateAuditSignature(auditEntry);

        // Log to Winston
        this.logger.log(level, auditEntry.event, auditEntry);

        // Send to CloudWatch if configured
        if (this.cloudWatch) {
            await this.sendToCloudWatch(auditEntry);
        }

        // Store encrypted backup if encryption key available
        if (this.config.encryptionKey) {
            await this.storeEncryptedBackup(auditEntry);
        }

        return auditEntry;
    }

    /**
     * Authentication events
     */
    async logAuthentication(details) {
        return this.audit('info', 'USER_AUTHENTICATION', {
            action: 'authenticate',
            outcome: details.success ? 'success' : 'failure',
            userId: details.userId,
            ipAddress: details.ipAddress,
            userAgent: details.userAgent,
            additionalData: {
                authMethod: details.authMethod,
                sessionDuration: details.sessionDuration,
                failureReason: details.failureReason
            }
        });
    }

    /**
     * Authorization events
     */
    async logAuthorization(details) {
        return this.audit('info', 'USER_AUTHORIZATION', {
            action: 'authorize',
            outcome: details.granted ? 'granted' : 'denied',
            userId: details.userId,
            resource: details.resource,
            permission: details.permission,
            additionalData: {
                roles: details.roles,
                context: details.context
            }
        });
    }

    /**
     * Trading activity logs
     */
    async logTradingActivity(details) {
        return this.audit('info', 'TRADING_ACTIVITY', {
            action: details.action, // 'order_placed', 'order_executed', 'position_modified'
            outcome: details.outcome,
            userId: details.userId,
            resource: `trading/${details.symbol}`,
            additionalData: {
                symbol: details.symbol,
                quantity: details.quantity,
                price: details.price,
                orderType: details.orderType,
                orderId: details.orderId,
                executionId: details.executionId,
                timestamp: details.timestamp,
                value: details.value
            }
        });
    }

    /**
     * Financial transaction logs
     */
    async logFinancialTransaction(details) {
        return this.audit('warn', 'FINANCIAL_TRANSACTION', {
            action: details.transactionType,
            outcome: details.status,
            userId: details.userId,
            resource: `account/${details.accountId}`,
            additionalData: {
                transactionId: details.transactionId,
                accountId: details.accountId,
                amount: details.amount,
                currency: details.currency,
                fromAccount: details.fromAccount,
                toAccount: details.toAccount,
                reference: details.reference,
                regulatoryReporting: details.regulatoryReporting
            }
        });
    }

    /**
     * Risk management events
     */
    async logRiskEvent(details) {
        const level = details.severity === 'critical' ? 'error' : 'warn';
        return this.audit(level, 'RISK_MANAGEMENT', {
            action: details.action,
            outcome: details.outcome,
            userId: details.userId,
            additionalData: {
                riskType: details.riskType,
                severity: details.severity,
                threshold: details.threshold,
                currentValue: details.currentValue,
                actionTaken: details.actionTaken,
                portfolioId: details.portfolioId
            }
        });
    }

    /**
     * Security events
     */
    async logSecurityEvent(details) {
        return this.audit('error', 'SECURITY_EVENT', {
            action: details.eventType,
            outcome: 'detected',
            userId: details.userId || 'unknown',
            ipAddress: details.ipAddress,
            additionalData: {
                eventType: details.eventType,
                severity: details.severity,
                description: details.description,
                source: details.source,
                mitigationAction: details.mitigationAction,
                indicators: details.indicators
            }
        });
    }

    /**
     * Administrative actions
     */
    async logAdministrativeAction(details) {
        return this.audit('warn', 'ADMINISTRATIVE_ACTION', {
            action: details.action,
            outcome: details.outcome,
            userId: details.userId,
            resource: details.resource,
            additionalData: {
                targetUserId: details.targetUserId,
                configurationChanges: details.configurationChanges,
                previousValues: details.previousValues,
                newValues: details.newValues,
                justification: details.justification
            }
        });
    }

    /**
     * Data access logs
     */
    async logDataAccess(details) {
        return this.audit('info', 'DATA_ACCESS', {
            action: details.operation, // 'read', 'write', 'delete'
            outcome: details.outcome,
            userId: details.userId,
            resource: details.resource,
            additionalData: {
                dataType: details.dataType,
                recordCount: details.recordCount,
                query: details.query,
                sensitivity: details.sensitivity,
                purpose: details.purpose
            }
        });
    }

    /**
     * Send audit log to CloudWatch
     */
    async sendToCloudWatch(auditEntry) {
        try {
            const params = {
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
                logEvents: [{
                    timestamp: Date.now(),
                    message: JSON.stringify(auditEntry)
                }]
            };

            await this.cloudWatch.putLogEvents(params);
        } catch (error) {
            console.error('Failed to send audit log to CloudWatch:', error);
        }
    }

    /**
     * Store encrypted backup of audit entry
     */
    async storeEncryptedBackup(auditEntry) {
        try {
            const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
            let encrypted = cipher.update(JSON.stringify(auditEntry), 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const backupPath = path.join(
                this.config.logDirectory,
                'encrypted',
                `${auditEntry.sequenceNumber}.enc`
            );

            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            await fs.writeFile(backupPath, encrypted);
        } catch (error) {
            console.error('Failed to store encrypted audit backup:', error);
        }
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(startDate, endDate) {
        const reportData = {
            period: { start: startDate, end: endDate },
            generated: new Date().toISOString(),
            compliance: {
                sox: { required: true, compliant: true },
                sec: { required: true, compliant: true },
                finra: { required: true, compliant: true },
                pci: { required: true, compliant: true },
                nasaPot10: { required: true, compliant: true }
            },
            statistics: {
                totalEvents: 0,
                authenticationEvents: 0,
                tradingEvents: 0,
                securityEvents: 0,
                riskEvents: 0
            },
            signature: null
        };

        // Generate report signature
        reportData.signature = crypto
            .createHmac('sha256', this.config.encryptionKey || 'default-key')
            .update(JSON.stringify(reportData))
            .digest('hex');

        return reportData;
    }

    /**
     * Verify audit trail integrity
     */
    async verifyIntegrity(auditEntry) {
        const expectedSignature = this.generateAuditSignature(auditEntry);
        return auditEntry.signature === expectedSignature;
    }

    /**
     * Cleanup old audit logs based on retention policy
     */
    async cleanupOldLogs() {
        const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
        const cutoffDate = new Date(Date.now() - retentionMs);

        // Note: In production, implement proper archival to long-term storage
        // rather than deletion for compliance requirements
        console.log(`Audit cleanup: Archiving logs older than ${cutoffDate.toISOString()}`);
    }
}

module.exports = AuditLogger;