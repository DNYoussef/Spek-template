/**
 * Performance Regression Test Suite
 * Theater Detection Correction: Implements continuous performance monitoring
 * with 0.1% measurement precision to prevent future discrepancies
 *
 * @fileoverview Comprehensive test suite to detect performance regressions
 * @author Claude Code - Theater Detection Remediation
 * @version 1.0.0 - Corrected Performance Monitoring
 */

const { performance, PerformanceObserver } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class PerformanceRegressionSuite {
    constructor(options = {}) {
        this.options = {
            sampleSize: options.sampleSize || 5,
            precisionTarget: options.precisionTarget || 0.1, // 0.1% target
            maxAcceptableRegression: options.maxAcceptableRegression || 2.0, // 2% max
            baselineFile: options.baselineFile || path.join(__dirname, '../../../.performance-baselines.json'),
            alertThreshold: options.alertThreshold || 0.5, // Alert at 0.5% degradation
            ...options
        };

        this.baselines = this.loadBaselines();
        this.measurements = [];
        this.alertHistory = [];
    }

    /**
     * Load performance baselines from file
     */
    loadBaselines() {
        try {
            if (fs.existsSync(this.options.baselineFile)) {
                const data = fs.readFileSync(this.options.baselineFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Could not load performance baselines:', error.message);
        }
        return {};
    }

    /**
     * Save performance baselines to file
     */
    saveBaselines() {
        try {
            const dir = path.dirname(this.options.baselineFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.options.baselineFile, JSON.stringify(this.baselines, null, 2));
        } catch (error) {
            console.error('Could not save performance baselines:', error.message);
        }
    }

    /**
     * Measure performance of a function with statistical accuracy
     * @param {string} testName - Name of the test
     * @param {Function} testFunction - Function to measure
     * @param {Object} options - Measurement options
     */
    async measureFunction(testName, testFunction, options = {}) {
        const measurements = [];
        const startTime = Date.now();
        const startCPU = process.cpuUsage();
        const startMemory = process.memoryUsage();

        console.log(`\n[SCIENCE] Measuring performance: ${testName}`);

        // Run test function multiple times for statistical accuracy
        for (let i = 0; i < this.options.sampleSize; i++) {
            const iterStart = performance.now();

            try {
                await testFunction();
            } catch (error) {
                console.error(`Error in test iteration ${i + 1}:`, error.message);
                continue;
            }

            const iterEnd = performance.now();
            const duration = iterEnd - iterStart;
            measurements.push(duration);
        }

        const endTime = Date.now();
        const endCPU = process.cpuUsage(startCPU);
        const endMemory = process.memoryUsage();

        if (measurements.length === 0) {
            throw new Error(`No valid measurements for ${testName}`);
        }

        // Statistical analysis
        const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const variance = measurements.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / measurements.length;
        const stdDev = Math.sqrt(variance);
        const precision = (stdDev / avgTime) * 100;

        const result = {
            testName,
            timestamp: new Date().toISOString(),
            measurements: {
                samples: measurements,
                avgTime,
                stdDev,
                precision,
                min: Math.min(...measurements),
                max: Math.max(...measurements)
            },
            resources: {
                totalTime: endTime - startTime,
                cpuTime: {
                    user: endCPU.user / 1000, // Convert to milliseconds
                    system: endCPU.system / 1000
                },
                memoryDelta: {
                    heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
                    external: (endMemory.external - startMemory.external) / 1024 / 1024
                }
            },
            metadata: options
        };

        // Validate measurement precision
        if (precision <= this.options.precisionTarget) {
            console.log(`[OK] Measurement precision: ${precision.toFixed(3)}% (target: ${this.options.precisionTarget}%)`);
        } else {
            console.warn(`[WARN]  Measurement precision: ${precision.toFixed(3)}% (exceeds ${this.options.precisionTarget}% target)`);
        }

        // Regression analysis
        const regressionResult = this.analyzeRegression(testName, result);
        result.regression = regressionResult;

        // Store measurement
        this.measurements.push(result);

        return result;
    }

    /**
     * Analyze performance regression against baseline
     */
    analyzeRegression(testName, currentMeasurement) {
        const baseline = this.baselines[testName];

        if (!baseline) {
            console.log(` Establishing baseline for ${testName}`);
            this.baselines[testName] = {
                avgTime: currentMeasurement.measurements.avgTime,
                stdDev: currentMeasurement.measurements.stdDev,
                precision: currentMeasurement.measurements.precision,
                timestamp: currentMeasurement.timestamp,
                samples: currentMeasurement.measurements.samples.length
            };
            this.saveBaselines();

            return {
                status: 'baseline_established',
                regression: 0,
                alert: false
            };
        }

        // Calculate regression percentage
        const regression = ((currentMeasurement.measurements.avgTime - baseline.avgTime) / baseline.avgTime) * 100;

        const result = {
            status: 'analyzed',
            baselineTime: baseline.avgTime,
            currentTime: currentMeasurement.measurements.avgTime,
            regression: regression,
            alert: false,
            regressionStatus: 'acceptable'
        };

        // Determine regression status
        if (Math.abs(regression) <= this.options.alertThreshold) {
            result.regressionStatus = 'acceptable';
            console.log(`[OK] Performance: ${regression >= 0 ? '+' : ''}${regression.toFixed(2)}% vs baseline (within ${this.options.alertThreshold}%)`);
        } else if (Math.abs(regression) <= this.options.maxAcceptableRegression) {
            result.regressionStatus = 'warning';
            result.alert = true;
            console.warn(`[WARN]  Performance warning: ${regression >= 0 ? '+' : ''}${regression.toFixed(2)}% vs baseline`);
            this.raiseAlert(testName, regression, 'warning');
        } else {
            result.regressionStatus = 'critical';
            result.alert = true;
            console.error(`[FAIL] Performance regression: ${regression >= 0 ? '+' : ''}${regression.toFixed(2)}% vs baseline (exceeds ${this.options.maxAcceptableRegression}%)`);
            this.raiseAlert(testName, regression, 'critical');
        }

        return result;
    }

    /**
     * Raise performance alert
     */
    raiseAlert(testName, regression, severity) {
        const alert = {
            timestamp: new Date().toISOString(),
            testName,
            regression,
            severity,
            message: `Performance ${severity}: ${testName} shows ${regression >= 0 ? '+' : ''}${regression.toFixed(2)}% change vs baseline`
        };

        this.alertHistory.push(alert);

        // Write alert to file for CI/CD integration
        const alertFile = path.join(path.dirname(this.options.baselineFile), '.performance-alerts.json');
        try {
            let alerts = [];
            if (fs.existsSync(alertFile)) {
                alerts = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
            }
            alerts.push(alert);

            // Keep only last 100 alerts
            if (alerts.length > 100) {
                alerts = alerts.slice(-100);
            }

            fs.writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
        } catch (error) {
            console.error('Could not write performance alert:', error.message);
        }
    }

    /**
     * Update baseline if performance consistently improves
     */
    updateBaselineIfImproved(testName, measurements) {
        if (measurements.length < 10) return; // Need sufficient samples

        const recent = measurements.slice(-10);
        const avgImprovement = recent.reduce((sum, m) => {
            if (m.regression && m.regression.regression < 0) {
                return sum + Math.abs(m.regression.regression);
            }
            return sum;
        }, 0) / recent.length;

        // Update baseline if consistent improvement > 5%
        if (avgImprovement > 5.0) {
            const latest = measurements[measurements.length - 1];
            this.baselines[testName] = {
                avgTime: latest.measurements.avgTime,
                stdDev: latest.measurements.stdDev,
                precision: latest.measurements.precision,
                timestamp: latest.timestamp,
                samples: latest.measurements.samples.length,
                updated: 'improved_baseline'
            };
            this.saveBaselines();
            console.log(`[TREND] Updated baseline for ${testName} due to consistent improvement`);
        }
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                testsRun: this.measurements.length,
                alertsRaised: this.alertHistory.length,
                avgPrecision: this.measurements.reduce((sum, m) => sum + m.measurements.precision, 0) / Math.max(this.measurements.length, 1),
                precisionTarget: this.options.precisionTarget,
                precisionAchieved: this.measurements.every(m => m.measurements.precision <= this.options.precisionTarget)
            },
            measurements: this.measurements,
            alerts: this.alertHistory,
            baselines: this.baselines
        };

        // Save detailed report
        const reportFile = path.join(path.dirname(this.options.baselineFile), '.performance-report.json');
        try {
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        } catch (error) {
            console.error('Could not save performance report:', error.message);
        }

        console.log('\n[CHART] Performance Regression Report');
        console.log('================================');
        console.log(`Tests run: ${report.summary.testsRun}`);
        console.log(`Alerts raised: ${report.summary.alertsRaised}`);
        console.log(`Average precision: ${report.summary.avgPrecision.toFixed(3)}%`);
        console.log(`Precision target achieved: ${report.summary.precisionAchieved ? '[OK]' : '[FAIL]'}`);

        if (this.alertHistory.length > 0) {
            console.log('\n[ALERT] Recent Alerts:');
            this.alertHistory.slice(-5).forEach(alert => {
                const icon = alert.severity === 'critical' ? '[FAIL]' : '[WARN]';
                console.log(`${icon} ${alert.testName}: ${alert.regression >= 0 ? '+' : ''}${alert.regression.toFixed(2)}%`);
            });
        }

        return report;
    }
}

module.exports = { PerformanceRegressionSuite };

// Example usage and CI/CD integration tests
if (require.main === module) {
    async function runRegressionTests() {
        const suite = new PerformanceRegressionSuite({
            sampleSize: 5,
            precisionTarget: 0.1, // 0.1% precision target
            maxAcceptableRegression: 2.0,
            alertThreshold: 0.5
        });

        // Test 1: Six Sigma CI/CD Pipeline Performance
        await suite.measureFunction('six_sigma_cicd_pipeline', async () => {
            // Simulate CI/CD operations
            const data = Array(1000).fill().map((_, i) => ({
                id: i,
                value: Math.random(),
                timestamp: Date.now() + i
            }));

            // Sorting operation (common in analysis)
            data.sort((a, b) => a.value - b.value);

            // Filtering operation (quality gates)
            const filtered = data.filter(item => item.value > 0.5);

            // Analysis operation (metrics calculation)
            const metrics = filtered.reduce((acc, item) => {
                acc.sum += item.value;
                acc.count++;
                return acc;
            }, { sum: 0, count: 0 });

            // Validation (final check)
            const average = metrics.count > 0 ? metrics.sum / metrics.count : 0;
            if (average < 0.5) {
                throw new Error('Validation failed');
            }
        });

        // Test 2: DPMO Calculation Performance
        await suite.measureFunction('dpmo_calculation', async () => {
            const defects = Math.floor(Math.random() * 10);
            const opportunities = 1000;
            const units = 100;

            const dpmo = (defects / (opportunities * units)) * 1000000;
            const sigmaLevel = dpmo < 233 ? 6.0 : dpmo < 1350 ? 5.0 : 4.0;

            // Simulate additional calculations
            for (let i = 0; i < 100; i++) {
                const variance = Math.random() * 0.1;
                const adjusted = dpmo * (1 + variance);
            }
        });

        // Test 3: SPC Chart Generation Performance
        await suite.measureFunction('spc_chart_generation', async () => {
            const dataPoints = Array(50).fill().map(() => Math.random() * 100 + 50);
            const mean = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;
            const variance = dataPoints.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / dataPoints.length;
            const stdDev = Math.sqrt(variance);

            // Control limits calculation
            const ucl = mean + (3 * stdDev);
            const lcl = mean - (3 * stdDev);

            // Violation detection
            const violations = dataPoints.filter(point => point > ucl || point < lcl);
        });

        // Generate final report
        const report = suite.generateReport();

        // Exit with appropriate code for CI/CD
        const hasAlerts = report.alerts.some(alert => alert.severity === 'critical');
        const precisionAchieved = report.summary.precisionAchieved;

        if (hasAlerts) {
            console.error('\n[FAIL] Critical performance regressions detected');
            process.exit(1);
        } else if (!precisionAchieved) {
            console.warn('\n[WARN]  Measurement precision target not achieved');
            process.exit(1);
        } else {
            console.log('\n[OK] All performance regression tests passed');
            process.exit(0);
        }
    }

    runRegressionTests().catch(error => {
        console.error('Performance regression test failed:', error);
        process.exit(1);
    });
}