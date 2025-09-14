/**
 * Enterprise Audit Logger for Feature Flags
 * Comprehensive audit logging with compliance features
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class FeatureFlagAuditLogger extends EventEmitter {
    constructor(options = {}) {
        super();

        this.config = {
            logDirectory: options.logDirectory || path.join(process.cwd(), 'logs', 'feature-flags'),
            maxLogFileSize: options.maxLogFileSize || 50 * 1024 * 1024, // 50MB
            maxLogFiles: options.maxLogFiles || 10,
            compressionEnabled: options.compressionEnabled !== false,
            encryptionEnabled: options.encryptionEnabled || false,
            encryptionKey: options.encryptionKey || null,
            retentionDays: options.retentionDays || 365, // 1 year
            complianceMode: options.complianceMode || 'standard', // 'standard', 'strict', 'defense'
            batchSize: options.batchSize || 100,
            flushInterval: options.flushInterval || 5000, // 5 seconds
            ...options
        };

        this.logBuffer = [];
        this.currentLogFile = null;
        this.currentLogSize = 0;
        this.logSequence = 0;
        this.flushTimer = null;

        this.initializeLogging();
        this.startPeriodicFlush();
    }

    /**
     * Initialize logging system
     */
    async initializeLogging() {
        try {
            // Ensure log directory exists
            if (!fs.existsSync(this.config.logDirectory)) {
                fs.mkdirSync(this.config.logDirectory, { recursive: true });
            }

            // Initialize current log file
            await this.rotateLogFileIfNeeded();

            // Setup retention cleanup
            this.setupRetentionCleanup();

            console.log(`Feature Flag Audit Logger initialized: ${this.config.logDirectory}`);

        } catch (error) {
            console.error('Failed to initialize audit logging:', error);
            throw error;
        }
    }

    /**
     * Log audit event
     */
    async logEvent(category, action, data, context = {}) {
        const event = this.createAuditEvent(category, action, data, context);

        // Add to buffer
        this.logBuffer.push(event);

        // Immediate flush for critical events
        if (this.isCriticalEvent(category, action)) {
            await this.flush();
        }

        // Batch flush when buffer is full
        if (this.logBuffer.length >= this.config.batchSize) {
            await this.flush();
        }

        this.emit('eventLogged', event);
        return event;
    }

    /**
     * Create structured audit event
     */
    createAuditEvent(category, action, data, context) {
        const timestamp = new Date().toISOString();
        const eventId = crypto.randomUUID();

        const event = {
            id: eventId,
            sequence: ++this.logSequence,
            timestamp,
            category,
            action,
            data: this.sanitizeData(data),
            context: this.sanitizeContext(context),

            // Compliance metadata
            compliance: {
                version: '1.0',
                standard: this.config.complianceMode,
                retentionRequired: this.calculateRetentionRequired(category, action),
                classificationLevel: this.classifyEvent(category, action),
                integrityHash: null // Will be calculated later
            },

            // System metadata
            system: {
                hostname: require('os').hostname(),
                platform: process.platform,
                nodeVersion: process.version,
                pid: process.pid,
                environment: process.env.NODE_ENV || 'development'
            },

            // User tracking (if available)
            user: {
                id: context.userId || context.user?.id || 'system',
                ip: context.ip || context.remoteAddress,
                userAgent: context.userAgent,
                sessionId: context.sessionId
            },

            // Request tracking (if applicable)
            request: {
                id: context.requestId,
                method: context.method,
                path: context.path,
                correlationId: context.correlationId
            }
        };

        // Calculate integrity hash
        event.compliance.integrityHash = this.calculateIntegrityHash(event);

        return event;
    }

    /**
     * Flush buffered events to disk
     */
    async flush() {
        if (this.logBuffer.length === 0) {
            return;
        }

        const eventsToFlush = [...this.logBuffer];
        this.logBuffer = [];

        try {
            await this.writeEventsToFile(eventsToFlush);
            this.emit('eventsFlushed', { count: eventsToFlush.length });

        } catch (error) {
            console.error('Failed to flush audit events:', error);
            // Put events back in buffer for retry
            this.logBuffer.unshift(...eventsToFlush);
            this.emit('flushError', error);
            throw error;
        }
    }

    /**
     * Write events to log file
     */
    async writeEventsToFile(events) {
        await this.rotateLogFileIfNeeded();

        const logEntries = events.map(event => JSON.stringify(event) + '\n');
        const logData = logEntries.join('');

        // Encrypt if encryption is enabled
        const finalData = this.config.encryptionEnabled ?
            this.encryptLogData(logData) : logData;

        // Write to file
        fs.appendFileSync(this.currentLogFile, finalData);
        this.currentLogSize += Buffer.byteLength(finalData);

        // Update audit trail
        this.updateAuditTrail(events.length, this.currentLogFile);
    }

    /**
     * Rotate log file if needed
     */
    async rotateLogFileIfNeeded() {
        const shouldRotate = !this.currentLogFile ||
            this.currentLogSize >= this.config.maxLogFileSize;

        if (shouldRotate) {
            await this.rotateLogFile();
        }
    }

    /**
     * Rotate log file
     */
    async rotateLogFile() {
        // Close current file and compress if needed
        if (this.currentLogFile && this.config.compressionEnabled) {
            await this.compressLogFile(this.currentLogFile);
        }

        // Create new log file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `feature-flags-audit-${timestamp}.log`;
        this.currentLogFile = path.join(this.config.logDirectory, filename);
        this.currentLogSize = 0;

        // Write log file header
        const header = {
            logFileVersion: '1.0',
            createdAt: new Date().toISOString(),
            complianceMode: this.config.complianceMode,
            encryptionEnabled: this.config.encryptionEnabled,
            system: {
                hostname: require('os').hostname(),
                platform: process.platform,
                nodeVersion: process.version
            }
        };

        const headerData = '# Feature Flag Audit Log\n' +
            `# ${JSON.stringify(header)}\n\n`;

        fs.writeFileSync(this.currentLogFile, headerData);
        this.currentLogSize = Buffer.byteLength(headerData);

        console.log(`Rotated to new audit log file: ${this.currentLogFile}`);
        this.emit('logRotated', this.currentLogFile);
    }

    /**
     * Compress log file
     */
    async compressLogFile(filePath) {
        try {
            const zlib = require('zlib');
            const compressedPath = `${filePath}.gz`;

            const readStream = fs.createReadStream(filePath);
            const writeStream = fs.createWriteStream(compressedPath);
            const gzip = zlib.createGzip();

            await new Promise((resolve, reject) => {
                readStream.pipe(gzip).pipe(writeStream);
                writeStream.on('close', resolve);
                writeStream.on('error', reject);
            });

            // Remove original file after compression
            fs.unlinkSync(filePath);
            console.log(`Compressed log file: ${compressedPath}`);

        } catch (error) {
            console.error('Failed to compress log file:', error);
        }
    }

    /**
     * Encrypt log data
     */
    encryptLogData(data) {
        if (!this.config.encryptionKey) {
            throw new Error('Encryption key required for encrypted logging');
        }

        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipher(algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return JSON.stringify({
            encrypted: true,
            algorithm,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            data: encrypted
        }) + '\n';
    }

    /**
     * Calculate integrity hash for event
     */
    calculateIntegrityHash(event) {
        // Create a copy without the hash field
        const eventForHashing = { ...event };
        delete eventForHashing.compliance.integrityHash;

        const eventString = JSON.stringify(eventForHashing, Object.keys(eventForHashing).sort());
        return crypto.createHash('sha256').update(eventString).digest('hex');
    }

    /**
     * Determine if event is critical and requires immediate flush
     */
    isCriticalEvent(category, action) {
        const criticalEvents = [
            'SECURITY_VIOLATION',
            'EMERGENCY_SHUTDOWN',
            'COMPLIANCE_FAILURE',
            'SYSTEM_COMPROMISE',
            'DATA_BREACH'
        ];

        return criticalEvents.includes(category) ||
            criticalEvents.includes(action) ||
            category === 'ERROR' && action.includes('CRITICAL');
    }

    /**
     * Classify event for compliance purposes
     */
    classifyEvent(category, action) {
        if (this.config.complianceMode === 'defense') {
            const highSecurityEvents = ['SECURITY', 'COMPLIANCE', 'AUDIT'];
            if (highSecurityEvents.some(prefix => category.startsWith(prefix))) {
                return 'CONTROLLED_UNCLASSIFIED';
            }
        }

        if (category === 'ERROR' || action.includes('FAIL')) {
            return 'HIGH';
        }

        if (category === 'UPDATE' || category === 'CHANGE') {
            return 'MEDIUM';
        }

        return 'STANDARD';
    }

    /**
     * Calculate retention requirement
     */
    calculateRetentionRequired(category, action) {
        if (this.config.complianceMode === 'defense') {
            // Defense industry requirements
            return this.config.retentionDays * 2; // Extended retention
        }

        if (category === 'SECURITY' || category === 'COMPLIANCE') {
            return this.config.retentionDays;
        }

        // Standard retention for operational events
        return Math.min(this.config.retentionDays, 90);
    }

    /**
     * Sanitize data for logging
     */
    sanitizeData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sanitized = JSON.parse(JSON.stringify(data));

        // Remove sensitive fields
        const sensitiveFields = [
            'password', 'secret', 'token', 'key', 'credential',
            'ssn', 'social_security', 'credit_card', 'cc_number'
        ];

        this.recursivelyRemoveFields(sanitized, sensitiveFields);
        return sanitized;
    }

    /**
     * Sanitize context for logging
     */
    sanitizeContext(context) {
        const sanitized = { ...context };

        // Remove sensitive context
        delete sanitized.password;
        delete sanitized.authorization;
        delete sanitized.cookie;

        return sanitized;
    }

    /**
     * Recursively remove sensitive fields
     */
    recursivelyRemoveFields(obj, fieldsToRemove) {
        if (!obj || typeof obj !== 'object') {
            return;
        }

        Object.keys(obj).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (fieldsToRemove.some(field => lowerKey.includes(field))) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                this.recursivelyRemoveFields(obj[key], fieldsToRemove);
            }
        });
    }

    /**
     * Update audit trail metadata
     */
    updateAuditTrail(eventCount, logFile) {
        const trailFile = path.join(this.config.logDirectory, 'audit-trail.json');
        let trail = [];

        if (fs.existsSync(trailFile)) {
            try {
                trail = JSON.parse(fs.readFileSync(trailFile, 'utf8'));
            } catch (error) {
                console.warn('Could not read audit trail file:', error);
            }
        }

        trail.push({
            timestamp: new Date().toISOString(),
            logFile,
            eventCount,
            sequence: this.logSequence
        });

        // Keep only recent entries
        if (trail.length > 1000) {
            trail = trail.slice(-1000);
        }

        fs.writeFileSync(trailFile, JSON.stringify(trail, null, 2));
    }

    /**
     * Start periodic flush timer
     */
    startPeriodicFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(async () => {
            try {
                await this.flush();
            } catch (error) {
                console.error('Periodic flush failed:', error);
            }
        }, this.config.flushInterval);
    }

    /**
     * Setup retention cleanup
     */
    setupRetentionCleanup() {
        // Run cleanup daily
        const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours

        setInterval(async () => {
            try {
                await this.cleanupOldLogs();
            } catch (error) {
                console.error('Log cleanup failed:', error);
            }
        }, cleanupInterval);

        // Initial cleanup
        setTimeout(() => {
            this.cleanupOldLogs().catch(error => {
                console.error('Initial log cleanup failed:', error);
            });
        }, 60000); // After 1 minute
    }

    /**
     * Cleanup old log files based on retention policy
     */
    async cleanupOldLogs() {
        try {
            const files = fs.readdirSync(this.config.logDirectory);
            const logFiles = files.filter(file =>
                file.startsWith('feature-flags-audit-') &&
                (file.endsWith('.log') || file.endsWith('.log.gz'))
            );

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

            let deletedCount = 0;

            for (const file of logFiles) {
                const filePath = path.join(this.config.logDirectory, file);
                const stats = fs.statSync(filePath);

                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`Deleted expired audit log: ${file}`);
                }
            }

            if (deletedCount > 0) {
                this.emit('logsCleanedUp', { deletedCount });
            }

        } catch (error) {
            console.error('Error during log cleanup:', error);
        }
    }

    /**
     * Get audit statistics
     */
    getAuditStatistics() {
        return {
            currentLogFile: this.currentLogFile,
            currentLogSize: this.currentLogSize,
            logSequence: this.logSequence,
            bufferedEvents: this.logBuffer.length,
            config: {
                retentionDays: this.config.retentionDays,
                complianceMode: this.config.complianceMode,
                encryptionEnabled: this.config.encryptionEnabled
            }
        };
    }

    /**
     * Search audit logs
     */
    async searchLogs(criteria) {
        const results = [];
        const files = fs.readdirSync(this.config.logDirectory);
        const logFiles = files.filter(file =>
            file.startsWith('feature-flags-audit-') && file.endsWith('.log')
        );

        for (const file of logFiles) {
            const filePath = path.join(this.config.logDirectory, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());

            for (const line of lines) {
                if (line.startsWith('#')) continue; // Skip headers

                try {
                    const event = JSON.parse(line);
                    if (this.matchesCriteria(event, criteria)) {
                        results.push(event);
                    }
                } catch (error) {
                    // Skip malformed lines
                }
            }
        }

        return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Check if event matches search criteria
     */
    matchesCriteria(event, criteria) {
        if (criteria.category && event.category !== criteria.category) {
            return false;
        }

        if (criteria.action && event.action !== criteria.action) {
            return false;
        }

        if (criteria.userId && event.user.id !== criteria.userId) {
            return false;
        }

        if (criteria.since && new Date(event.timestamp) < new Date(criteria.since)) {
            return false;
        }

        if (criteria.until && new Date(event.timestamp) > new Date(criteria.until)) {
            return false;
        }

        return true;
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(startDate, endDate) {
        const events = await this.searchLogs({
            since: startDate,
            until: endDate
        });

        const report = {
            reportId: crypto.randomUUID(),
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            complianceMode: this.config.complianceMode,

            summary: {
                totalEvents: events.length,
                criticalEvents: events.filter(e => e.compliance.classificationLevel === 'HIGH').length,
                securityEvents: events.filter(e => e.category === 'SECURITY').length,
                errorEvents: events.filter(e => e.category === 'ERROR').length
            },

            categorySummary: this.summarizeByCategory(events),
            integrityCheck: this.performIntegrityCheck(events),
            recommendations: this.generateRecommendations(events)
        };

        return report;
    }

    /**
     * Summarize events by category
     */
    summarizeByCategory(events) {
        const summary = {};

        events.forEach(event => {
            const category = event.category;
            if (!summary[category]) {
                summary[category] = {
                    count: 0,
                    actions: {},
                    classificationLevels: {}
                };
            }

            summary[category].count++;
            summary[category].actions[event.action] = (summary[category].actions[event.action] || 0) + 1;

            const level = event.compliance.classificationLevel;
            summary[category].classificationLevels[level] = (summary[category].classificationLevels[level] || 0) + 1;
        });

        return summary;
    }

    /**
     * Perform integrity check on events
     */
    performIntegrityCheck(events) {
        let validEvents = 0;
        let invalidEvents = 0;

        events.forEach(event => {
            const currentHash = event.compliance.integrityHash;
            const calculatedHash = this.calculateIntegrityHash(event);

            if (currentHash === calculatedHash) {
                validEvents++;
            } else {
                invalidEvents++;
            }
        });

        return {
            totalEvents: events.length,
            validEvents,
            invalidEvents,
            integrityScore: events.length > 0 ? (validEvents / events.length) * 100 : 100
        };
    }

    /**
     * Generate compliance recommendations
     */
    generateRecommendations(events) {
        const recommendations = [];

        // Check for high error rates
        const errorRate = (events.filter(e => e.category === 'ERROR').length / events.length) * 100;
        if (errorRate > 5) {
            recommendations.push({
                type: 'RELIABILITY',
                priority: 'HIGH',
                message: `Error rate is ${errorRate.toFixed(1)}%, consider investigating system stability`
            });
        }

        // Check for security events
        const securityEvents = events.filter(e => e.category === 'SECURITY').length;
        if (securityEvents > 0) {
            recommendations.push({
                type: 'SECURITY',
                priority: 'HIGH',
                message: `${securityEvents} security events detected, review security posture`
            });
        }

        return recommendations;
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('Shutting down audit logger...');

        // Stop periodic flush
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        // Final flush
        await this.flush();

        console.log('Audit logger shutdown complete');
    }
}

module.exports = FeatureFlagAuditLogger;