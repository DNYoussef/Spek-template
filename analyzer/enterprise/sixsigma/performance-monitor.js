/**
 * Performance Monitor for Six Sigma Reporting System
 * Ensures <1.2% performance overhead monitoring and compliance
 * 
 * @module PerformanceMonitor
 * @compliance NASA-POT10-95%
 */

class PerformanceMonitor {
    constructor(config = {}) {
        this.config = config;
        this.thresholds = {
            maxOverhead: config.performanceThreshold || 1.2, // 1.2% max overhead
            maxExecutionTime: config.maxExecutionTime || 5000, // 5 seconds max
            maxMemoryUsage: config.maxMemoryUsage || 100 // 100MB max
        };
        
        this.metrics = {
            executionTimes: [],
            memoryUsages: [],
            overheadPercentages: [],
            errorCounts: 0,
            totalExecutions: 0
        };
        
        this.alerts = [];
    }

    /**
     * Record execution performance
     * @param {number} executionTime - Execution time in milliseconds
     * @param {Object} context - Execution context
     */
    async record(executionTime, context = {}) {
        this.metrics.totalExecutions++;
        this.metrics.executionTimes.push({
            timestamp: new Date().toISOString(),
            duration: executionTime,
            context: context
        });

        // Record memory usage
        const memoryUsage = this.getCurrentMemoryUsage();
        this.metrics.memoryUsages.push({
            timestamp: new Date().toISOString(),
            usage: memoryUsage
        });

        // Calculate overhead percentage
        const baselineTime = context.baselineTime || 1000; // 1 second baseline
        const overheadPercentage = ((executionTime - baselineTime) / baselineTime) * 100;
        this.metrics.overheadPercentages.push({
            timestamp: new Date().toISOString(),
            percentage: overheadPercentage
        });

        // Check thresholds and generate alerts
        await this.checkThresholds(executionTime, memoryUsage, overheadPercentage);

        // Maintain sliding window (keep last 100 records)
        this.maintainSlidingWindow();
    }

    /**
     * Record error occurrence
     * @param {Error} error - Error that occurred
     * @param {Object} context - Error context
     */
    async recordError(error, context = {}) {
        this.metrics.errorCounts++;
        
        this.alerts.push({
            type: 'ERROR',
            severity: 'HIGH',
            timestamp: new Date().toISOString(),
            message: `Six Sigma analysis error: ${error.message}`,
            context: context,
            stack: error.stack
        });

        // Log error for debugging
        console.error('Six Sigma Performance Error:', {
            message: error.message,
            context: context,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics summary
     */
    async getMetrics() {
        const currentMetrics = {
            timestamp: new Date().toISOString(),
            summary: this.calculateSummaryMetrics(),
            thresholds: this.thresholds,
            compliance: this.checkCompliance(),
            alerts: this.getActiveAlerts(),
            trends: this.calculateTrends(),
            recommendations: this.generatePerformanceRecommendations()
        };

        return currentMetrics;
    }

    /**
     * Check performance thresholds
     * @param {number} executionTime - Current execution time
     * @param {number} memoryUsage - Current memory usage
     * @param {number} overheadPercentage - Current overhead percentage
     */
    async checkThresholds(executionTime, memoryUsage, overheadPercentage) {
        // Check execution time threshold
        if (executionTime > this.thresholds.maxExecutionTime) {
            this.alerts.push({
                type: 'EXECUTION_TIME',
                severity: 'MEDIUM',
                timestamp: new Date().toISOString(),
                message: `Execution time ${executionTime}ms exceeds threshold ${this.thresholds.maxExecutionTime}ms`,
                value: executionTime,
                threshold: this.thresholds.maxExecutionTime
            });
        }

        // Check memory usage threshold
        if (memoryUsage > this.thresholds.maxMemoryUsage) {
            this.alerts.push({
                type: 'MEMORY_USAGE',
                severity: 'MEDIUM',
                timestamp: new Date().toISOString(),
                message: `Memory usage ${memoryUsage}MB exceeds threshold ${this.thresholds.maxMemoryUsage}MB`,
                value: memoryUsage,
                threshold: this.thresholds.maxMemoryUsage
            });
        }

        // Check overhead percentage threshold (CRITICAL)
        if (overheadPercentage > this.thresholds.maxOverhead) {
            this.alerts.push({
                type: 'OVERHEAD_EXCEEDED',
                severity: 'CRITICAL',
                timestamp: new Date().toISOString(),
                message: `Performance overhead ${overheadPercentage.toFixed(2)}% exceeds critical threshold ${this.thresholds.maxOverhead}%`,
                value: overheadPercentage,
                threshold: this.thresholds.maxOverhead
            });
        }
    }

    /**
     * Calculate summary performance metrics
     * @returns {Object} Summary metrics
     */
    calculateSummaryMetrics() {
        const executionTimes = this.metrics.executionTimes.map(e => e.duration);
        const memoryUsages = this.metrics.memoryUsages.map(m => m.usage);
        const overheadPercentages = this.metrics.overheadPercentages.map(o => o.percentage);

        return {
            executionTime: {
                avg: this.calculateAverage(executionTimes),
                min: Math.min(...executionTimes),
                max: Math.max(...executionTimes),
                p95: this.calculatePercentile(executionTimes, 95),
                p99: this.calculatePercentile(executionTimes, 99)
            },
            memoryUsage: {
                avg: this.calculateAverage(memoryUsages),
                min: Math.min(...memoryUsages),
                max: Math.max(...memoryUsages),
                current: this.getCurrentMemoryUsage()
            },
            overheadPercentage: {
                avg: this.calculateAverage(overheadPercentages),
                min: Math.min(...overheadPercentages),
                max: Math.max(...overheadPercentages),
                current: overheadPercentages[overheadPercentages.length - 1] || 0
            },
            errorRate: (this.metrics.errorCounts / this.metrics.totalExecutions) * 100,
            totalExecutions: this.metrics.totalExecutions
        };
    }

    /**
     * Check compliance with performance requirements
     * @returns {Object} Compliance status
     */
    checkCompliance() {
        const summary = this.calculateSummaryMetrics();
        
        const overheadCompliant = summary.overheadPercentage.avg <= this.thresholds.maxOverhead;
        const executionCompliant = summary.executionTime.avg <= this.thresholds.maxExecutionTime;
        const memoryCompliant = summary.memoryUsage.avg <= this.thresholds.maxMemoryUsage;
        const errorRateCompliant = summary.errorRate < 5; // <5% error rate

        return {
            overall: overheadCompliant && executionCompliant && memoryCompliant && errorRateCompliant,
            overhead: {
                compliant: overheadCompliant,
                current: Number(summary.overheadPercentage.avg.toFixed(2)),
                target: this.thresholds.maxOverhead,
                status: overheadCompliant ? 'COMPLIANT' : 'NON_COMPLIANT'
            },
            execution: {
                compliant: executionCompliant,
                current: Math.round(summary.executionTime.avg),
                target: this.thresholds.maxExecutionTime,
                status: executionCompliant ? 'COMPLIANT' : 'NON_COMPLIANT'
            },
            memory: {
                compliant: memoryCompliant,
                current: Math.round(summary.memoryUsage.avg),
                target: this.thresholds.maxMemoryUsage,
                status: memoryCompliant ? 'COMPLIANT' : 'NON_COMPLIANT'
            },
            errorRate: {
                compliant: errorRateCompliant,
                current: Number(summary.errorRate.toFixed(2)),
                target: 5,
                status: errorRateCompliant ? 'COMPLIANT' : 'NON_COMPLIANT'
            }
        };
    }

    /**
     * Get active alerts (last 24 hours)
     * @returns {Array} Active alerts
     */
    getActiveAlerts() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        return this.alerts.filter(alert => {
            const alertTime = new Date(alert.timestamp);
            return alertTime > oneDayAgo;
        }).sort((a, b) => {
            const severityOrder = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
            return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        });
    }

    /**
     * Calculate performance trends
     * @returns {Object} Trend analysis
     */
    calculateTrends() {
        const recentExecutions = this.metrics.executionTimes.slice(-10);
        const recentOverheads = this.metrics.overheadPercentages.slice(-10);

        if (recentExecutions.length < 2 || recentOverheads.length < 2) {
            return { 
                execution: { trend: 0, direction: 'STABLE' },
                overhead: { trend: 0, direction: 'STABLE' },
                overall: { direction: 'STABLE', severity: 'LOW', recommendation: 'Insufficient data for trend analysis' }
            };
        }

        // Calculate trend direction
        const executionTrend = this.calculateTrendDirection(recentExecutions.map(e => e.duration));
        const overheadTrend = this.calculateTrendDirection(recentOverheads.map(o => o.percentage));

        return {
            execution: {
                trend: executionTrend,
                direction: executionTrend > 0 ? 'INCREASING' : executionTrend < 0 ? 'DECREASING' : 'STABLE'
            },
            overhead: {
                trend: overheadTrend,
                direction: overheadTrend > 0 ? 'INCREASING' : overheadTrend < 0 ? 'DECREASING' : 'STABLE'
            },
            overall: this.assessOverallTrend(executionTrend, overheadTrend)
        };
    }

    /**
     * Generate performance recommendations
     * @returns {Array} Performance recommendations
     */
    generatePerformanceRecommendations() {
        const recommendations = [];
        const compliance = this.checkCompliance();
        const trends = this.calculateTrends();

        // Overhead recommendations
        if (!compliance.overhead.compliant) {
            recommendations.push({
                type: 'OVERHEAD_OPTIMIZATION',
                priority: 'CRITICAL',
                message: `Performance overhead ${compliance.overhead.current}% exceeds ${compliance.overhead.target}%`,
                action: 'Optimize calculation algorithms and reduce processing complexity',
                expectedImpact: 'Reduce overhead by 30-50%'
            });
        }

        // Execution time recommendations
        if (!compliance.execution.compliant) {
            recommendations.push({
                type: 'EXECUTION_OPTIMIZATION',
                priority: 'HIGH',
                message: `Average execution time ${compliance.execution.current}ms exceeds ${compliance.execution.target}ms`,
                action: 'Implement caching and optimize data processing pipelines',
                expectedImpact: 'Reduce execution time by 20-40%'
            });
        }

        // Memory usage recommendations
        if (!compliance.memory.compliant) {
            recommendations.push({
                type: 'MEMORY_OPTIMIZATION',
                priority: 'MEDIUM',
                message: `Memory usage ${compliance.memory.current}MB exceeds ${compliance.memory.target}MB`,
                action: 'Implement memory pooling and optimize data structures',
                expectedImpact: 'Reduce memory footprint by 15-25%'
            });
        }

        // Trend-based recommendations
        if (trends && trends.overhead && trends.overhead.direction === 'INCREASING') {
            recommendations.push({
                type: 'TREND_MONITORING',
                priority: 'MEDIUM',
                message: 'Performance overhead is trending upward',
                action: 'Monitor system closely and prepare optimization strategies',
                expectedImpact: 'Prevent performance degradation'
            });
        }

        return recommendations;
    }

    /**
     * Get current memory usage in MB
     * @returns {number} Memory usage in MB
     */
    getCurrentMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            return Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100; // MB with 2 decimals
        }
        return 0; // Fallback for browser environments
    }

    /**
     * Maintain sliding window of metrics
     */
    maintainSlidingWindow() {
        const maxRecords = 100;
        
        if (this.metrics.executionTimes.length > maxRecords) {
            this.metrics.executionTimes = this.metrics.executionTimes.slice(-maxRecords);
        }
        
        if (this.metrics.memoryUsages.length > maxRecords) {
            this.metrics.memoryUsages = this.metrics.memoryUsages.slice(-maxRecords);
        }
        
        if (this.metrics.overheadPercentages.length > maxRecords) {
            this.metrics.overheadPercentages = this.metrics.overheadPercentages.slice(-maxRecords);
        }

        // Clean old alerts (keep last 1000)
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(-1000);
        }
    }

    // Helper methods
    calculateAverage(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;
        
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
        return sorted[Math.max(0, index)];
    }

    calculateTrendDirection(values) {
        if (values.length < 2) return 0;
        
        // Simple linear regression slope
        const n = values.length;
        const sumX = (n * (n + 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
        const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    assessOverallTrend(executionTrend, overheadTrend) {
        if (executionTrend > 0 || overheadTrend > 0) {
            return {
                direction: 'DEGRADING',
                severity: executionTrend > 0.1 || overheadTrend > 0.1 ? 'HIGH' : 'MEDIUM',
                recommendation: 'Performance optimization needed'
            };
        } else if (executionTrend < -0.05 && overheadTrend < -0.05) {
            return {
                direction: 'IMPROVING',
                severity: 'LOW',
                recommendation: 'Continue current optimization efforts'
            };
        } else {
            return {
                direction: 'STABLE',
                severity: 'LOW',
                recommendation: 'Maintain current performance levels'
            };
        }
    }

    /**
     * Reset metrics (for testing or maintenance)
     */
    resetMetrics() {
        this.metrics = {
            executionTimes: [],
            memoryUsages: [],
            overheadPercentages: [],
            errorCounts: 0,
            totalExecutions: 0
        };
        this.alerts = [];
    }

    /**
     * Export performance data for analysis
     * @returns {Object} Complete performance data
     */
    exportData() {
        return {
            timestamp: new Date().toISOString(),
            config: this.config,
            thresholds: this.thresholds,
            metrics: this.metrics,
            alerts: this.alerts,
            summary: this.calculateSummaryMetrics(),
            compliance: this.checkCompliance()
        };
    }
}

module.exports = { PerformanceMonitor };