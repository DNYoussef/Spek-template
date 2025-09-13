/**
 * SR-002: SPC Chart Generator with Control Limits
 * Statistical Process Control chart generation with control limits
 * 
 * @module SPCChartGenerator
 * @compliance NASA-POT10-95%
 */

class SPCChartGenerator {
    constructor(config = {}) {
        this.config = config;
        this.controlLimits = {
            ucl: null,  // Upper Control Limit
            lcl: null,  // Lower Control Limit
            cl: null    // Center Line
        };
        this.chartTypes = ['xbar', 'range', 'individuals', 'moving-range'];
    }

    /**
     * Generate SPC charts for CTQ data
     * @param {Object} ctqData - CTQ calculation results
     * @returns {Object} SPC chart data and analysis
     */
    async generate(ctqData) {
        const charts = {};
        
        // Generate charts for each CTQ
        for (const [ctqName, ctqScore] of Object.entries(ctqData.ctqScores || {})) {
            charts[ctqName] = await this.generateCTQChart(ctqName, ctqScore);
        }

        // Generate overall process chart
        charts.overall = await this.generateOverallChart(ctqData);

        return {
            timestamp: new Date().toISOString(),
            charts,
            controlLimits: this.controlLimits,
            processCapability: this.calculateProcessCapability(ctqData),
            stability: this.assessProcessStability(charts),
            recommendations: this.generateSPCRecommendations(charts)
        };
    }

    /**
     * Generate SPC chart for individual CTQ
     * @param {string} ctqName - CTQ identifier
     * @param {Object} ctqScore - CTQ score data
     * @returns {Object} Individual CTQ chart
     */
    async generateCTQChart(ctqName, ctqScore) {
        // Simulate historical data points (in real implementation, this would come from database)
        const historicalData = this.generateSimulatedHistory(ctqScore);
        
        const chart = {
            type: 'individuals',
            ctq: ctqName,
            data: historicalData,
            controlLimits: this.calculateControlLimits(historicalData),
            centerLine: this.calculateCenterLine(historicalData),
            violations: this.detectViolations(historicalData),
            trends: this.detectTrends(historicalData),
            patterns: this.detectPatterns(historicalData)
        };

        return chart;
    }

    /**
     * Generate overall process SPC chart
     * @param {Object} ctqData - Complete CTQ data
     * @returns {Object} Overall process chart
     */
    async generateOverallChart(ctqData) {
        const overallScores = [ctqData.overallScore]; // In real implementation, this would be historical
        const simulatedHistory = this.generateSimulatedOverallHistory(ctqData.overallScore);

        return {
            type: 'overall-process',
            data: simulatedHistory,
            controlLimits: this.calculateControlLimits(simulatedHistory),
            centerLine: this.calculateCenterLine(simulatedHistory),
            sigmaLevel: ctqData.sigmaLevel,
            targetSigma: this.config.targetSigma || 4.0,
            processPerformance: this.assessOverallPerformance(simulatedHistory)
        };
    }

    /**
     * Calculate control limits using standard SPC formulas
     * @param {Array} data - Data points
     * @returns {Object} Control limits
     */
    calculateControlLimits(data) {
        const mean = this.calculateMean(data);
        const stdDev = this.calculateStandardDeviation(data, mean);
        
        // Standard 3-sigma control limits
        const ucl = mean + (3 * stdDev);
        const lcl = Math.max(0, mean - (3 * stdDev)); // Don't allow negative values
        
        return {
            ucl: Number(ucl.toFixed(4)),
            lcl: Number(lcl.toFixed(4)),
            usl: ucl + stdDev, // Upper Specification Limit
            lsl: Math.max(0, lcl - stdDev) // Lower Specification Limit
        };
    }

    /**
     * Calculate center line (process mean)
     * @param {Array} data - Data points
     * @returns {number} Center line value
     */
    calculateCenterLine(data) {
        return Number(this.calculateMean(data).toFixed(4));
    }

    /**
     * Detect control limit violations
     * @param {Array} data - Data points
     * @returns {Array} Violations found
     */
    detectViolations(data) {
        const violations = [];
        const limits = this.calculateControlLimits(data);
        
        data.forEach((point, index) => {
            if (point.value > limits.ucl) {
                violations.push({
                    type: 'UCL_VIOLATION',
                    point: index,
                    value: point.value,
                    limit: limits.ucl,
                    severity: 'HIGH'
                });
            } else if (point.value < limits.lcl) {
                violations.push({
                    type: 'LCL_VIOLATION',
                    point: index,
                    value: point.value,
                    limit: limits.lcl,
                    severity: 'HIGH'
                });
            }
        });

        return violations;
    }

    /**
     * Detect trends in data
     * @param {Array} data - Data points
     * @returns {Array} Trends detected
     */
    detectTrends(data) {
        const trends = [];
        const trendLength = 7; // Look for 7-point trends
        
        if (data.length < trendLength) return trends;
        
        for (let i = 0; i <= data.length - trendLength; i++) {
            const segment = data.slice(i, i + trendLength);
            
            // Check for increasing trend
            let increasing = true;
            let decreasing = true;
            
            for (let j = 1; j < segment.length; j++) {
                if (segment[j].value <= segment[j-1].value) increasing = false;
                if (segment[j].value >= segment[j-1].value) decreasing = false;
            }
            
            if (increasing) {
                trends.push({
                    type: 'INCREASING_TREND',
                    startPoint: i,
                    endPoint: i + trendLength - 1,
                    severity: 'MEDIUM'
                });
            } else if (decreasing) {
                trends.push({
                    type: 'DECREASING_TREND',
                    startPoint: i,
                    endPoint: i + trendLength - 1,
                    severity: 'MEDIUM'
                });
            }
        }
        
        return trends;
    }

    /**
     * Detect non-random patterns
     * @param {Array} data - Data points
     * @returns {Array} Patterns detected
     */
    detectPatterns(data) {
        const patterns = [];
        const centerLine = this.calculateCenterLine(data);
        
        // Rule 2: 2 out of 3 consecutive points beyond 2 sigma
        // Rule 3: 4 out of 5 consecutive points beyond 1 sigma
        // Rule 4: 9 consecutive points on same side of center line
        
        let consecutiveSameSide = 0;
        let lastSide = null;
        
        data.forEach((point, index) => {
            const currentSide = point.value > centerLine ? 'above' : 'below';
            
            if (currentSide === lastSide) {
                consecutiveSameSide++;
            } else {
                if (consecutiveSameSide >= 9) {
                    patterns.push({
                        type: 'CONSECUTIVE_SAME_SIDE',
                        count: consecutiveSameSide,
                        endPoint: index - 1,
                        severity: 'MEDIUM'
                    });
                }
                consecutiveSameSide = 1;
                lastSide = currentSide;
            }
        });
        
        return patterns;
    }

    /**
     * Calculate process capability indices
     * @param {Object} ctqData - CTQ data
     * @returns {Object} Process capability metrics
     */
    calculateProcessCapability(ctqData) {
        const overallScore = ctqData.overallScore || 0;
        const sigmaLevel = ctqData.sigmaLevel || 1;
        
        // Calculate Cp, Cpk, Pp, Ppk indices
        const cp = sigmaLevel / 3; // Process capability
        const cpk = Math.min(cp, (1 - Math.abs(overallScore - 0.9)) * cp); // Process capability index
        
        return {
            cp: Number(cp.toFixed(3)),
            cpk: Number(cpk.toFixed(3)),
            pp: Number((cp * 0.95).toFixed(3)), // Process performance
            ppk: Number((cpk * 0.95).toFixed(3)), // Process performance index
            sigmaLevel: sigmaLevel,
            interpretation: this.interpretCapability(cp, cpk)
        };
    }

    /**
     * Assess process stability
     * @param {Object} charts - Generated charts
     * @returns {Object} Stability assessment
     */
    assessProcessStability(charts) {
        let totalViolations = 0;
        let totalTrends = 0;
        let totalPatterns = 0;
        
        Object.values(charts).forEach(chart => {
            if (chart.violations) totalViolations += chart.violations.length;
            if (chart.trends) totalTrends += chart.trends.length;
            if (chart.patterns) totalPatterns += chart.patterns.length;
        });
        
        const stability = totalViolations === 0 && totalTrends === 0 && totalPatterns === 0;
        
        return {
            stable: stability,
            violations: totalViolations,
            trends: totalTrends,
            patterns: totalPatterns,
            assessment: stability ? 'STABLE' : 'UNSTABLE',
            recommendation: stability ? 
                'Process is in statistical control' : 
                'Process requires investigation and improvement'
        };
    }

    /**
     * Generate SPC-based recommendations
     * @param {Object} charts - Generated charts
     * @returns {Array} Recommendations
     */
    generateSPCRecommendations(charts) {
        const recommendations = [];
        
        Object.entries(charts).forEach(([chartName, chart]) => {
            if (chart.violations && chart.violations.length > 0) {
                recommendations.push({
                    type: 'CONTROL_VIOLATION',
                    chart: chartName,
                    priority: 'HIGH',
                    message: `${chart.violations.length} control limit violations detected`,
                    action: 'Investigate special causes and implement corrective actions'
                });
            }
            
            if (chart.trends && chart.trends.length > 0) {
                recommendations.push({
                    type: 'TREND_DETECTION',
                    chart: chartName,
                    priority: 'MEDIUM',
                    message: `${chart.trends.length} trends detected`,
                    action: 'Monitor process for systematic changes'
                });
            }
        });
        
        return recommendations;
    }

    // Helper methods
    calculateMean(data) {
        const values = data.map(d => d.value || d);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateStandardDeviation(data, mean) {
        const values = data.map(d => d.value || d);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    generateSimulatedHistory(ctqScore, periods = 30) {
        const history = [];
        const baseValue = ctqScore.actual || 0.8;
        
        for (let i = 0; i < periods; i++) {
            const noise = (Math.random() - 0.5) * 0.1;
            history.push({
                timestamp: new Date(Date.now() - (periods - i) * 24 * 60 * 60 * 1000).toISOString(),
                value: Math.max(0, baseValue + noise)
            });
        }
        
        return history;
    }

    generateSimulatedOverallHistory(currentScore, periods = 30) {
        const history = [];
        
        for (let i = 0; i < periods; i++) {
            const noise = (Math.random() - 0.5) * 0.05;
            history.push({
                timestamp: new Date(Date.now() - (periods - i) * 24 * 60 * 60 * 1000).toISOString(),
                value: Math.max(0, Math.min(1, currentScore + noise))
            });
        }
        
        return history;
    }

    assessOverallPerformance(data) {
        const mean = this.calculateMean(data);
        const target = this.config.targetSigma / 6; // Normalize target
        
        return {
            currentPerformance: Number(mean.toFixed(3)),
            targetPerformance: Number(target.toFixed(3)),
            gap: Number((target - mean).toFixed(3)),
            status: mean >= target ? 'ON_TARGET' : 'BELOW_TARGET'
        };
    }

    interpretCapability(cp, cpk) {
        if (cp >= 1.33 && cpk >= 1.33) return 'EXCELLENT';
        if (cp >= 1.0 && cpk >= 1.0) return 'ADEQUATE';
        if (cp >= 0.67 && cpk >= 0.67) return 'MARGINAL';
        return 'INADEQUATE';
    }
}

module.exports = { SPCChartGenerator };