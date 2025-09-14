/**
 * Performance Monitor for Feature Flag System
 * Tracks and analyzes system performance with detailed metrics
 */

const EventEmitter = require('events');
const os = require('os');

class FeatureFlagPerformanceMonitor extends EventEmitter {
    constructor(options = {}) {
        super();

        this.config = {
            enableMetrics: options.enableMetrics !== false,
            enableAlerting: options.enableAlerting !== false,
            sampleInterval: options.sampleInterval || 1000, // 1 second
            metricsRetention: options.metricsRetention || 3600000, // 1 hour
            alertThresholds: {
                evaluationTime: options.evaluationTime || 100, // 100ms
                errorRate: options.errorRate || 0.05, // 5%
                memoryUsage: options.memoryUsage || 0.8, // 80%
                cpuUsage: options.cpuUsage || 0.8, // 80%
                ...options.alertThresholds
            },
            ...options
        };

        this.metrics = {
            evaluations: [],
            errors: [],
            system: [],
            alerts: []
        };

        this.alertState = {
            evaluationTime: false,
            errorRate: false,
            memoryUsage: false,
            cpuUsage: false
        };

        this.startTime = Date.now();
        this.lastSample = Date.now();

        this.initializeMonitoring();
    }

    /**
     * Initialize performance monitoring
     */
    initializeMonitoring() {
        if (this.config.enableMetrics) {
            this.startMetricsCollection();
        }

        this.setupCleanup();
        console.log('Feature Flag Performance Monitor initialized');
    }

    /**
     * Start collecting metrics
     */
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.sampleInterval);

        // Initial collection
        this.collectMetrics();
    }

    /**
     * Collect system and application metrics
     */
    async collectMetrics() {
        const timestamp = Date.now();

        // System metrics
        const systemMetrics = await this.collectSystemMetrics();
        this.metrics.system.push({
            timestamp,
            ...systemMetrics
        });

        // Application metrics
        const appMetrics = this.collectApplicationMetrics();
        this.recordMetric('application', {
            timestamp,
            ...appMetrics
        });

        // Performance analysis
        this.analyzePerformance(timestamp);

        // Emit metrics event
        this.emit('metricsCollected', {
            timestamp,
            system: systemMetrics,
            application: appMetrics
        });
    }

    /**
     * Collect system-level metrics
     */
    async collectSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return {
            memory: {
                used: memoryUsage.heapUsed,
                total: memoryUsage.heapTotal,
                external: memoryUsage.external,
                rss: memoryUsage.rss,
                usagePercentage: memoryUsage.heapUsed / memoryUsage.heapTotal
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
                usagePercentage: this.calculateCpuUsage(cpuUsage)
            },
            system: {
                loadAverage: os.loadavg(),
                uptime: os.uptime(),
                freeMemory: os.freemem(),
                totalMemory: os.totalmem(),
                memoryUsagePercentage: (os.totalmem() - os.freemem()) / os.totalmem()
            }
        };
    }

    /**
     * Calculate CPU usage percentage
     */
    calculateCpuUsage(cpuUsage) {
        if (!this.lastCpuUsage) {
            this.lastCpuUsage = cpuUsage;
            return 0;
        }

        const userDiff = cpuUsage.user - this.lastCpuUsage.user;
        const systemDiff = cpuUsage.system - this.lastCpuUsage.system;
        const timeDiff = Date.now() - this.lastSample;

        this.lastCpuUsage = cpuUsage;
        this.lastSample = Date.now();

        // Convert microseconds to milliseconds and calculate percentage
        const usage = ((userDiff + systemDiff) / 1000) / timeDiff;
        return Math.min(usage, 1.0); // Cap at 100%
    }

    /**
     * Collect application-specific metrics
     */
    collectApplicationMetrics() {
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window

        // Filter recent evaluations
        const recentEvaluations = this.metrics.evaluations.filter(e => e.timestamp > windowStart);
        const recentErrors = this.metrics.errors.filter(e => e.timestamp > windowStart);

        // Calculate metrics
        const evaluationCount = recentEvaluations.length;
        const errorCount = recentErrors.length;
        const errorRate = evaluationCount > 0 ? errorCount / evaluationCount : 0;

        const evaluationTimes = recentEvaluations.map(e => e.duration);
        const avgEvaluationTime = evaluationTimes.length > 0 ?
            evaluationTimes.reduce((a, b) => a + b, 0) / evaluationTimes.length : 0;

        const maxEvaluationTime = evaluationTimes.length > 0 ? Math.max(...evaluationTimes) : 0;

        const p95EvaluationTime = evaluationTimes.length > 0 ?
            this.calculatePercentile(evaluationTimes, 95) : 0;

        const p99EvaluationTime = evaluationTimes.length > 0 ?
            this.calculatePercentile(evaluationTimes, 99) : 0;

        return {
            evaluations: {
                count: evaluationCount,
                rate: evaluationCount / 60, // per second
                avgTime: avgEvaluationTime,
                maxTime: maxEvaluationTime,
                p95Time: p95EvaluationTime,
                p99Time: p99EvaluationTime
            },
            errors: {
                count: errorCount,
                rate: errorRate
            },
            throughput: {
                evaluationsPerSecond: evaluationCount / 60,
                errorsPerSecond: errorCount / 60
            }
        };
    }

    /**
     * Calculate percentile from array of values
     */
    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.floor((percentile / 100) * sorted.length);
        return sorted[index] || 0;
    }

    /**
     * Record evaluation metric
     */
    recordEvaluation(flagKey, duration, success, context = {}) {
        const metric = {
            timestamp: Date.now(),
            flagKey,
            duration,
            success,
            context: {
                environment: context.environment,
                userId: context.userId ? '[REDACTED]' : undefined
            }
        };

        this.metrics.evaluations.push(metric);

        if (!success) {
            this.recordError('EVALUATION_FAILED', { flagKey, duration });
        }

        this.emit('evaluationRecorded', metric);
    }

    /**
     * Record error metric
     */
    recordError(type, details = {}) {
        const error = {
            timestamp: Date.now(),
            type,
            details
        };

        this.metrics.errors.push(error);
        this.emit('errorRecorded', error);
    }

    /**
     * Record custom metric
     */
    recordMetric(category, data) {
        if (!this.metrics[category]) {
            this.metrics[category] = [];
        }

        this.metrics[category].push(data);
        this.emit('metricRecorded', { category, data });
    }

    /**
     * Analyze performance and trigger alerts
     */
    analyzePerformance(timestamp) {
        if (!this.config.enableAlerting) {
            return;
        }

        const recentMetrics = this.getRecentMetrics(timestamp - 300000); // 5 minutes

        // Check evaluation time threshold
        this.checkEvaluationTimeAlert(recentMetrics);

        // Check error rate threshold
        this.checkErrorRateAlert(recentMetrics);

        // Check system resource alerts
        this.checkSystemResourceAlerts();
    }

    /**
     * Check evaluation time alert threshold
     */
    checkEvaluationTimeAlert(recentMetrics) {
        const evaluations = recentMetrics.evaluations || [];
        if (evaluations.length === 0) return;

        const avgTime = evaluations.reduce((sum, e) => sum + e.duration, 0) / evaluations.length;
        const threshold = this.config.alertThresholds.evaluationTime;

        if (avgTime > threshold && !this.alertState.evaluationTime) {
            this.alertState.evaluationTime = true;
            this.triggerAlert('HIGH_EVALUATION_TIME', {
                averageTime: avgTime,
                threshold,
                samples: evaluations.length
            });
        } else if (avgTime <= threshold * 0.8 && this.alertState.evaluationTime) {
            this.alertState.evaluationTime = false;
            this.clearAlert('HIGH_EVALUATION_TIME');
        }
    }

    /**
     * Check error rate alert threshold
     */
    checkErrorRateAlert(recentMetrics) {
        const evaluations = recentMetrics.evaluations || [];
        const errors = recentMetrics.errors || [];

        if (evaluations.length === 0) return;

        const errorRate = errors.length / evaluations.length;
        const threshold = this.config.alertThresholds.errorRate;

        if (errorRate > threshold && !this.alertState.errorRate) {
            this.alertState.errorRate = true;
            this.triggerAlert('HIGH_ERROR_RATE', {
                errorRate,
                threshold,
                errorCount: errors.length,
                evaluationCount: evaluations.length
            });
        } else if (errorRate <= threshold * 0.8 && this.alertState.errorRate) {
            this.alertState.errorRate = false;
            this.clearAlert('HIGH_ERROR_RATE');
        }
    }

    /**
     * Check system resource alert thresholds
     */
    checkSystemResourceAlerts() {
        const latestSystem = this.metrics.system[this.metrics.system.length - 1];
        if (!latestSystem) return;

        // Memory usage alert
        const memoryUsage = latestSystem.memory.usagePercentage;
        const memoryThreshold = this.config.alertThresholds.memoryUsage;

        if (memoryUsage > memoryThreshold && !this.alertState.memoryUsage) {
            this.alertState.memoryUsage = true;
            this.triggerAlert('HIGH_MEMORY_USAGE', {
                memoryUsage,
                threshold: memoryThreshold,
                used: latestSystem.memory.used,
                total: latestSystem.memory.total
            });
        } else if (memoryUsage <= memoryThreshold * 0.9 && this.alertState.memoryUsage) {
            this.alertState.memoryUsage = false;
            this.clearAlert('HIGH_MEMORY_USAGE');
        }

        // CPU usage alert
        const cpuUsage = latestSystem.cpu.usagePercentage;
        const cpuThreshold = this.config.alertThresholds.cpuUsage;

        if (cpuUsage > cpuThreshold && !this.alertState.cpuUsage) {
            this.alertState.cpuUsage = true;
            this.triggerAlert('HIGH_CPU_USAGE', {
                cpuUsage,
                threshold: cpuThreshold,
                user: latestSystem.cpu.user,
                system: latestSystem.cpu.system
            });
        } else if (cpuUsage <= cpuThreshold * 0.9 && this.alertState.cpuUsage) {
            this.alertState.cpuUsage = false;
            this.clearAlert('HIGH_CPU_USAGE');
        }
    }

    /**
     * Trigger alert
     */
    triggerAlert(type, details) {
        const alert = {
            id: require('crypto').randomUUID(),
            type,
            severity: this.getAlertSeverity(type),
            timestamp: Date.now(),
            details,
            acknowledged: false
        };

        this.metrics.alerts.push(alert);
        console.warn(`[ALERT] ${type}: ${JSON.stringify(details)}`);
        this.emit('alertTriggered', alert);

        return alert;
    }

    /**
     * Clear alert
     */
    clearAlert(type) {
        const alert = {
            id: require('crypto').randomUUID(),
            type: `${type}_CLEARED`,
            severity: 'INFO',
            timestamp: Date.now(),
            acknowledged: true
        };

        this.metrics.alerts.push(alert);
        console.log(`[ALERT CLEARED] ${type}`);
        this.emit('alertCleared', alert);
    }

    /**
     * Get alert severity level
     */
    getAlertSeverity(type) {
        const severityMap = {
            HIGH_EVALUATION_TIME: 'WARNING',
            HIGH_ERROR_RATE: 'CRITICAL',
            HIGH_MEMORY_USAGE: 'WARNING',
            HIGH_CPU_USAGE: 'WARNING',
            SYSTEM_FAILURE: 'CRITICAL'
        };

        return severityMap[type] || 'INFO';
    }

    /**
     * Get recent metrics within time window
     */
    getRecentMetrics(since) {
        const result = {};

        Object.keys(this.metrics).forEach(category => {
            result[category] = this.metrics[category].filter(m => m.timestamp > since);
        });

        return result;
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(timeWindow = 3600000) { // 1 hour default
        const since = Date.now() - timeWindow;
        const recentMetrics = this.getRecentMetrics(since);

        const evaluations = recentMetrics.evaluations || [];
        const errors = recentMetrics.errors || [];
        const alerts = recentMetrics.alerts || [];

        const evaluationTimes = evaluations.map(e => e.duration);
        const errorRate = evaluations.length > 0 ? errors.length / evaluations.length : 0;

        return {
            timeWindow: {
                start: new Date(since).toISOString(),
                end: new Date().toISOString(),
                duration: timeWindow
            },
            evaluations: {
                total: evaluations.length,
                rate: evaluations.length / (timeWindow / 1000), // per second
                avgTime: evaluationTimes.length > 0 ?
                    evaluationTimes.reduce((a, b) => a + b, 0) / evaluationTimes.length : 0,
                minTime: evaluationTimes.length > 0 ? Math.min(...evaluationTimes) : 0,
                maxTime: evaluationTimes.length > 0 ? Math.max(...evaluationTimes) : 0,
                p50Time: this.calculatePercentile(evaluationTimes, 50),
                p95Time: this.calculatePercentile(evaluationTimes, 95),
                p99Time: this.calculatePercentile(evaluationTimes, 99)
            },
            errors: {
                total: errors.length,
                rate: errorRate,
                types: this.groupBy(errors, 'type')
            },
            alerts: {
                total: alerts.length,
                active: alerts.filter(a => !a.acknowledged).length,
                severities: this.groupBy(alerts, 'severity')
            },
            system: this.getSystemSummary(recentMetrics.system || [])
        };
    }

    /**
     * Get system resource summary
     */
    getSystemSummary(systemMetrics) {
        if (systemMetrics.length === 0) {
            return null;
        }

        const latest = systemMetrics[systemMetrics.length - 1];
        const memoryUsages = systemMetrics.map(m => m.memory.usagePercentage);
        const cpuUsages = systemMetrics.map(m => m.cpu.usagePercentage);

        return {
            current: {
                memory: latest.memory,
                cpu: latest.cpu,
                system: latest.system
            },
            averages: {
                memoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
                cpuUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length
            },
            peaks: {
                memoryUsage: Math.max(...memoryUsages),
                cpuUsage: Math.max(...cpuUsages)
            }
        };
    }

    /**
     * Group array items by property
     */
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            groups[key] = (groups[key] || 0) + 1;
            return groups;
        }, {});
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.metrics.alerts
            .filter(alert => !alert.acknowledged)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.metrics.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
            this.emit('alertAcknowledged', alert);
            return true;
        }
        return false;
    }

    /**
     * Setup periodic cleanup of old metrics
     */
    setupCleanup() {
        const cleanupInterval = 300000; // 5 minutes

        this.cleanupInterval = setInterval(() => {
            this.cleanupOldMetrics();
        }, cleanupInterval);
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    cleanupOldMetrics() {
        const cutoffTime = Date.now() - this.config.metricsRetention;

        Object.keys(this.metrics).forEach(category => {
            const originalLength = this.metrics[category].length;
            this.metrics[category] = this.metrics[category].filter(
                metric => metric.timestamp > cutoffTime
            );
            const removedCount = originalLength - this.metrics[category].length;

            if (removedCount > 0) {
                console.log(`Cleaned up ${removedCount} old ${category} metrics`);
            }
        });
    }

    /**
     * Export metrics for external analysis
     */
    exportMetrics(format = 'json') {
        const summary = this.getPerformanceSummary();

        switch (format) {
            case 'json':
                return JSON.stringify(summary, null, 2);

            case 'prometheus':
                return this.formatPrometheus(summary);

            case 'csv':
                return this.formatCSV(summary);

            default:
                return summary;
        }
    }

    /**
     * Format metrics for Prometheus
     */
    formatPrometheus(summary) {
        const lines = [
            '# HELP feature_flag_evaluations_total Total number of flag evaluations',
            '# TYPE feature_flag_evaluations_total counter',
            `feature_flag_evaluations_total ${summary.evaluations.total}`,
            '',
            '# HELP feature_flag_evaluation_duration_seconds Duration of flag evaluations',
            '# TYPE feature_flag_evaluation_duration_seconds histogram',
            `feature_flag_evaluation_duration_seconds_sum ${summary.evaluations.avgTime * summary.evaluations.total / 1000}`,
            `feature_flag_evaluation_duration_seconds_count ${summary.evaluations.total}`,
            '',
            '# HELP feature_flag_errors_total Total number of evaluation errors',
            '# TYPE feature_flag_errors_total counter',
            `feature_flag_errors_total ${summary.errors.total}`,
            '',
            '# HELP feature_flag_error_rate Error rate for flag evaluations',
            '# TYPE feature_flag_error_rate gauge',
            `feature_flag_error_rate ${summary.errors.rate}`
        ];

        return lines.join('\n');
    }

    /**
     * Format metrics as CSV
     */
    formatCSV(summary) {
        const headers = [
            'timestamp',
            'total_evaluations',
            'avg_evaluation_time',
            'p95_evaluation_time',
            'error_count',
            'error_rate',
            'active_alerts'
        ];

        const values = [
            new Date().toISOString(),
            summary.evaluations.total,
            summary.evaluations.avgTime,
            summary.evaluations.p95Time,
            summary.errors.total,
            summary.errors.rate,
            summary.alerts.active
        ];

        return headers.join(',') + '\n' + values.join(',');
    }

    /**
     * Graceful shutdown
     */
    shutdown() {
        console.log('Shutting down performance monitor...');

        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }

        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Final metrics collection
        this.collectMetrics();

        console.log('Performance monitor shutdown complete');
        this.emit('shutdown');
    }
}

module.exports = FeatureFlagPerformanceMonitor;