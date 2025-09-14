/**
 * Performance Alert Monitor
 * Continuous performance monitoring with trend analysis and alert thresholds
 * Theater Detection Correction: Implements real-time performance monitoring
 * to prevent future discrepancies between claimed and actual performance
 *
 * @fileoverview Real-time performance monitoring and alerting system
 * @author Claude Code - Theater Detection Remediation
 * @version 1.0.0 - Enhanced Monitoring
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class PerformanceAlertMonitor extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            monitoringInterval: options.monitoringInterval || 30000, // 30 seconds
            trendWindow: options.trendWindow || 20, // Last 20 measurements
            alertThresholds: {
                performance: options.performanceThreshold || 0.5, // 0.5% degradation
                precision: options.precisionThreshold || 0.15, // 0.15% max
                critical: options.criticalThreshold || 2.0, // 2.0% critical
                ...options.alertThresholds
            },
            dataDirectory: options.dataDirectory || path.join(__dirname, '../tests/performance'),
            alertWebhook: options.alertWebhook || null,
            enableTrendAnalysis: options.enableTrendAnalysis !== false,
            autoBaslineUpdate: options.autoBaslineUpdate !== false,
            ...options
        };

        this.isMonitoring = false;
        this.monitoringTimer = null;
        this.performanceHistory = [];
        this.alertHistory = [];
        this.trendAnalysis = {
            slope: 0,
            correlation: 0,
            prediction: null
        };

        // Load historical data
        this.loadHistoricalData();

        // Set up alert handlers
        this.setupAlertHandlers();
    }

    /**
     * Load historical performance data
     */
    loadHistoricalData() {
        const historyFile = path.join(this.options.dataDirectory, '.performance-history.json');
        const alertFile = path.join(this.options.dataDirectory, '.performance-alerts.json');

        try {
            if (fs.existsSync(historyFile)) {
                this.performanceHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
                console.log(`[CHART] Loaded ${this.performanceHistory.length} historical performance measurements`);
            }

            if (fs.existsSync(alertFile)) {
                this.alertHistory = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
                console.log(`[ALERT] Loaded ${this.alertHistory.length} historical alerts`);
            }
        } catch (error) {
            console.warn('Could not load historical data:', error.message);
        }
    }

    /**
     * Save performance data
     */
    savePerformanceData() {
        const historyFile = path.join(this.options.dataDirectory, '.performance-history.json');
        const alertFile = path.join(this.options.dataDirectory, '.performance-alerts.json');

        try {
            // Ensure directory exists
            if (!fs.existsSync(this.options.dataDirectory)) {
                fs.mkdirSync(this.options.dataDirectory, { recursive: true });
            }

            // Keep only recent history (last 500 measurements)
            const recentHistory = this.performanceHistory.slice(-500);
            fs.writeFileSync(historyFile, JSON.stringify(recentHistory, null, 2));

            // Keep only recent alerts (last 100 alerts)
            const recentAlerts = this.alertHistory.slice(-100);
            fs.writeFileSync(alertFile, JSON.stringify(recentAlerts, null, 2));

        } catch (error) {
            console.error('Could not save performance data:', error.message);
        }
    }

    /**
     * Set up alert event handlers
     */
    setupAlertHandlers() {
        this.on('performance_degradation', (alert) => {
            console.warn(`[WARN]  Performance Degradation: ${alert.metric} degraded by ${alert.change.toFixed(2)}%`);
            this.sendAlert(alert);
        });

        this.on('precision_exceeded', (alert) => {
            console.warn(`[WARN]  Measurement Precision Exceeded: ${alert.metric} precision ${alert.precision.toFixed(3)}%`);
            this.sendAlert(alert);
        });

        this.on('critical_regression', (alert) => {
            console.error(`[FAIL] Critical Performance Regression: ${alert.metric} degraded by ${alert.change.toFixed(2)}%`);
            this.sendAlert(alert);
        });

        this.on('trend_detected', (alert) => {
            console.log(`[TREND] Performance Trend Detected: ${alert.trend} trend in ${alert.metric}`);
            this.sendAlert(alert);
        });

        this.on('baseline_updated', (alert) => {
            console.log(`[CHART] Baseline Updated: ${alert.metric} baseline updated due to ${alert.reason}`);
        });
    }

    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.warn('Performance monitoring is already running');
            return;
        }

        this.isMonitoring = true;
        console.log(`[SEARCH] Starting performance monitoring (interval: ${this.options.monitoringInterval}ms)`);

        this.monitoringTimer = setInterval(() => {
            this.collectPerformanceMetrics();
        }, this.options.monitoringInterval);

        // Also collect initial metrics
        this.collectPerformanceMetrics();
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;

        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }

        console.log('  Performance monitoring stopped');
        this.savePerformanceData();
    }

    /**
     * Collect current performance metrics
     */
    async collectPerformanceMetrics() {
        const timestamp = new Date().toISOString();
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        // Check for performance measurement files
        const measurementFiles = [
            path.join(this.options.dataDirectory, '.performance-report.json'),
            path.join(this.options.dataDirectory, 'regression/.performance-baselines.json')
        ];

        let latestMeasurement = null;

        for (const file of measurementFiles) {
            try {
                if (fs.existsSync(file)) {
                    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                    if (data.measurements && data.measurements.length > 0) {
                        latestMeasurement = data.measurements[data.measurements.length - 1];
                        break;
                    }
                }
            } catch (error) {
                // Continue to next file
            }
        }

        const currentMetrics = {
            timestamp,
            system: {
                memory: {
                    heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
                    heapTotal: memUsage.heapTotal / 1024 / 1024,
                    external: memUsage.external / 1024 / 1024
                },
                cpu: {
                    user: cpuUsage.user / 1000, // ms
                    system: cpuUsage.system / 1000
                }
            },
            performance: latestMeasurement ? {
                avgTime: latestMeasurement.measurements?.avgTime || 0,
                precision: latestMeasurement.measurements?.precision || 100,
                regression: latestMeasurement.regression?.regression || 0
            } : null
        };

        this.performanceHistory.push(currentMetrics);

        // Analyze current metrics
        await this.analyzePerformanceMetrics(currentMetrics);
    }

    /**
     * Analyze performance metrics for alerts and trends
     */
    async analyzePerformanceMetrics(currentMetrics) {
        if (!currentMetrics.performance) {
            return; // No performance data to analyze
        }

        const { precision, regression } = currentMetrics.performance;

        // Check precision threshold
        if (precision > this.options.alertThresholds.precision) {
            const alert = {
                type: 'precision_exceeded',
                timestamp: currentMetrics.timestamp,
                metric: 'measurement_precision',
                precision,
                threshold: this.options.alertThresholds.precision,
                severity: 'warning'
            };
            this.alertHistory.push(alert);
            this.emit('precision_exceeded', alert);
        }

        // Check performance regression
        if (Math.abs(regression) > this.options.alertThresholds.performance) {
            const severity = Math.abs(regression) > this.options.alertThresholds.critical ? 'critical' : 'warning';
            const alert = {
                type: 'performance_regression',
                timestamp: currentMetrics.timestamp,
                metric: 'execution_time',
                change: regression,
                threshold: this.options.alertThresholds.performance,
                severity
            };
            this.alertHistory.push(alert);

            if (severity === 'critical') {
                this.emit('critical_regression', alert);
            } else {
                this.emit('performance_degradation', alert);
            }
        }

        // Trend analysis
        if (this.options.enableTrendAnalysis && this.performanceHistory.length >= this.options.trendWindow) {
            await this.analyzeTrends();
        }

        // Auto-save data periodically
        if (this.performanceHistory.length % 10 === 0) {
            this.savePerformanceData();
        }
    }

    /**
     * Analyze performance trends
     */
    async analyzeTrends() {
        const recentData = this.performanceHistory.slice(-this.options.trendWindow)
            .filter(m => m.performance && m.performance.avgTime > 0)
            .map((m, i) => ({
                x: i,
                y: m.performance.avgTime,
                timestamp: m.timestamp
            }));

        if (recentData.length < 5) {
            return; // Not enough data for trend analysis
        }

        // Calculate linear regression
        const n = recentData.length;
        const sumX = recentData.reduce((sum, point) => sum + point.x, 0);
        const sumY = recentData.reduce((sum, point) => sum + point.y, 0);
        const sumXY = recentData.reduce((sum, point) => sum + (point.x * point.y), 0);
        const sumXX = recentData.reduce((sum, point) => sum + (point.x * point.x), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate correlation coefficient
        const meanX = sumX / n;
        const meanY = sumY / n;
        const numerator = recentData.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
        const denomX = Math.sqrt(recentData.reduce((sum, point) => sum + Math.pow(point.x - meanX, 2), 0));
        const denomY = Math.sqrt(recentData.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0));
        const correlation = denomX * denomY !== 0 ? numerator / (denomX * denomY) : 0;

        // Update trend analysis
        this.trendAnalysis = {
            slope,
            intercept,
            correlation,
            prediction: slope * n + intercept,
            dataPoints: recentData.length
        };

        // Detect significant trends
        const trendStrength = Math.abs(correlation);
        const trendDirection = slope > 0 ? 'increasing' : 'decreasing';

        if (trendStrength > 0.7 && Math.abs(slope) > 0.1) {
            const alert = {
                type: 'trend_detected',
                timestamp: new Date().toISOString(),
                metric: 'execution_time',
                trend: trendDirection,
                strength: trendStrength,
                slope,
                correlation,
                severity: trendStrength > 0.9 ? 'warning' : 'info'
            };
            this.alertHistory.push(alert);
            this.emit('trend_detected', alert);
        }
    }

    /**
     * Send alert via configured channels
     */
    async sendAlert(alert) {
        // Console logging (always enabled)
        const severityIcon = {
            info: '[BULB]',
            warning: '[WARN]',
            critical: '[FAIL]'
        };

        console.log(`${severityIcon[alert.severity]} [${alert.severity.toUpperCase()}] ${alert.type}: ${JSON.stringify(alert, null, 2)}`);

        // Webhook notification
        if (this.options.alertWebhook) {
            try {
                const payload = {
                    alert_type: alert.type,
                    severity: alert.severity,
                    timestamp: alert.timestamp,
                    details: alert
                };

                // In a real implementation, you would send HTTP request
                console.log(` Would send webhook to: ${this.options.alertWebhook}`);
                console.log(`[DOCUMENT] Payload: ${JSON.stringify(payload, null, 2)}`);

            } catch (error) {
                console.error('Failed to send webhook alert:', error.message);
            }
        }
    }

    /**
     * Get current monitoring status
     */
    getStatus() {
        const recentAlerts = this.alertHistory.slice(-10);
        const recentPerformance = this.performanceHistory.slice(-5);

        return {
            monitoring: {
                isActive: this.isMonitoring,
                interval: this.options.monitoringInterval,
                uptime: this.isMonitoring ? Date.now() - (this.performanceHistory[0]?.timestamp ? new Date(this.performanceHistory[0].timestamp).getTime() : Date.now()) : 0
            },
            data: {
                totalMeasurements: this.performanceHistory.length,
                totalAlerts: this.alertHistory.length,
                recentAlerts: recentAlerts.length
            },
            performance: {
                current: recentPerformance[recentPerformance.length - 1]?.performance || null,
                trend: this.trendAnalysis
            },
            alerts: {
                recent: recentAlerts,
                thresholds: this.options.alertThresholds
            }
        };
    }

    /**
     * Generate monitoring report
     */
    generateMonitoringReport() {
        const status = this.getStatus();
        const now = new Date().toISOString();

        const report = {
            timestamp: now,
            monitoring_period: {
                start: this.performanceHistory[0]?.timestamp || now,
                end: now,
                total_measurements: this.performanceHistory.length
            },
            alert_summary: {
                total: this.alertHistory.length,
                by_severity: this.alertHistory.reduce((acc, alert) => {
                    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                    return acc;
                }, {}),
                by_type: this.alertHistory.reduce((acc, alert) => {
                    acc[alert.type] = (acc[alert.type] || 0) + 1;
                    return acc;
                }, {})
            },
            performance_summary: {
                trend_analysis: this.trendAnalysis,
                recent_precision: this.performanceHistory.slice(-10)
                    .filter(m => m.performance?.precision)
                    .map(m => m.performance.precision),
                precision_target_met: this.performanceHistory.slice(-10)
                    .filter(m => m.performance?.precision)
                    .every(m => m.performance.precision <= this.options.alertThresholds.precision)
            },
            configuration: this.options
        };

        // Save report
        const reportFile = path.join(this.options.dataDirectory, '.monitoring-report.json');
        try {
            if (!fs.existsSync(this.options.dataDirectory)) {
                fs.mkdirSync(this.options.dataDirectory, { recursive: true });
            }
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            console.log(`[CHART] Monitoring report saved: ${reportFile}`);
        } catch (error) {
            console.error('Could not save monitoring report:', error.message);
        }

        return report;
    }
}

module.exports = { PerformanceAlertMonitor };

// CLI usage
if (require.main === module) {
    const monitor = new PerformanceAlertMonitor({
        monitoringInterval: 30000, // 30 seconds
        alertThresholds: {
            performance: 0.5, // Alert at 0.5% degradation
            precision: 0.1,   // Target 0.1% precision
            critical: 2.0     // Critical at 2% regression
        },
        enableTrendAnalysis: true,
        autoBaslineUpdate: true
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n Shutting down performance monitor...');
        monitor.stopMonitoring();
        const report = monitor.generateMonitoringReport();
        console.log('\n[CHART] Final Monitoring Summary:');
        console.log(`   Total measurements: ${report.monitoring_period.total_measurements}`);
        console.log(`   Total alerts: ${report.alert_summary.total}`);
        console.log(`   Precision target met: ${report.performance_summary.precision_target_met ? '[OK]' : '[FAIL]'}`);
        process.exit(0);
    });

    // Start monitoring
    monitor.startMonitoring();

    // Generate status report every 5 minutes
    setInterval(() => {
        const status = monitor.getStatus();
        console.log(`\n Status Update (${new Date().toLocaleTimeString()})`);
        console.log(`   Monitoring: ${status.monitoring.isActive ? '[OK]' : '[FAIL]'}`);
        console.log(`   Measurements: ${status.data.totalMeasurements}`);
        console.log(`   Recent alerts: ${status.data.recentAlerts}`);
        if (status.performance.current) {
            console.log(`   Current precision: ${status.performance.current.precision?.toFixed(3) || 'N/A'}%`);
            console.log(`   Current regression: ${status.performance.current.regression?.toFixed(2) || 'N/A'}%`);
        }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('[TARGET] Performance Alert Monitor started');
    console.log('   Press Ctrl+C to stop monitoring and generate final report');
}