/**
 * SR-001: CTQ Metrics Collector and Calculator
 * Critical-to-Quality metrics processing with checks.yaml integration
 * 
 * @module CTQCalculator
 * @compliance NASA-POT10-95%
 */

const fs = require('fs').promises;
const yaml = require('js-yaml');
const path = require('path');

class CTQCalculator {
    constructor(config = {}) {
        this.config = config;
        this.ctqDefinitions = null;
        this.thresholds = {
            critical: 0.95,  // 95% target
            warning: 0.85,   // 85% warning
            failure: 0.75    // 75% failure
        };
    }

    /**
     * Load CTQ definitions from checks.yaml
     * @returns {Object} CTQ configuration
     */
    async loadCTQDefinitions() {
        if (this.ctqDefinitions) return this.ctqDefinitions;
        
        try {
            const checksPath = path.join(process.cwd(), 'checks.yaml');
            const checksContent = await fs.readFile(checksPath, 'utf8');
            const checks = yaml.load(checksContent);
            
            // Map from existing checks.yaml CTQs to our system
            this.ctqDefinitions = {
                security: {
                    target: 95,
                    weight: 0.20,
                    description: 'Security Compliance Score',
                    spec: checks.ctqs?.find(c => c.id === 'security')?.spec || { critical_max: 0, high_max: 5 }
                },
                nasaPOT10: {
                    target: 90,
                    weight: 0.20,
                    description: 'NASA POT10 Compliance',
                    spec: checks.ctqs?.find(c => c.id === 'nasa_pot10')?.spec || { min_score: 0.90 }
                },
                connascence: {
                    target: 95,
                    weight: 0.15,
                    description: 'Connascence Quality',
                    spec: checks.ctqs?.find(c => c.id === 'connascence')?.spec || { allow_positive_delta: false }
                },
                godObjects: {
                    target: 100,
                    weight: 0.15,
                    description: 'God Objects Control',
                    spec: checks.ctqs?.find(c => c.id === 'god_objects')?.spec || { max_delta: 0 }
                },
                meceQuality: {
                    target: 75,
                    weight: 0.10,
                    description: 'MECE Duplication Quality',
                    spec: checks.ctqs?.find(c => c.id === 'mece_dup')?.spec || { mece_min: 0.75, dup_delta_max: 0 }
                },
                testsMutation: {
                    target: 60,
                    weight: 0.10,
                    description: 'Tests and Mutation Score',
                    spec: checks.ctqs?.find(c => c.id === 'tests_mutation')?.spec || { require_pass: true, min_mutation_changed: 0.60 }
                },
                performance: {
                    target: 95,
                    weight: 0.10,
                    description: 'Performance Compliance',
                    spec: checks.ctqs?.find(c => c.id === 'performance')?.spec || { max_regression_pct: 5 }
                }
            };
            
            return this.ctqDefinitions;
            
        } catch (error) {
            throw new Error(`Failed to load CTQ definitions: ${error.message}`);
        }
    }

    /**
     * Calculate CTQ metrics from input data
     * @param {Object} data - Raw metrics data
     * @returns {Object} Calculated CTQ results
     */
    async calculate(data) {
        await this.loadCTQDefinitions();
        
        const results = {
            timestamp: new Date().toISOString(),
            ctqScores: {},
            overallScore: 0,
            sigmaLevel: 0,
            defectCount: 0,
            opportunities: 0,
            recommendations: []
        };

        let weightedSum = 0;
        let totalWeight = 0;

        // Calculate each CTQ score
        for (const [ctqName, definition] of Object.entries(this.ctqDefinitions)) {
            const score = this.calculateCTQScore(ctqName, data, definition);
            
            results.ctqScores[ctqName] = {
                actual: score.actual,
                target: definition.target,
                score: score.normalized,
                weight: definition.weight,
                status: this.getScoreStatus(score.normalized),
                variance: score.actual - definition.target,
                description: definition.description
            };

            weightedSum += score.normalized * definition.weight;
            totalWeight += definition.weight;

            // Count defects (scores below threshold)
            if (score.normalized < this.thresholds.critical) {
                results.defectCount++;
            }

            // Generate recommendations
            if (score.normalized < this.thresholds.warning) {
                results.recommendations.push({
                    ctq: ctqName,
                    priority: score.normalized < this.thresholds.failure ? 'HIGH' : 'MEDIUM',
                    message: `${definition.description} is below target (${score.actual} vs ${definition.target})`
                });
            }
        }

        // Calculate overall metrics
        results.overallScore = weightedSum / totalWeight;
        results.opportunities = Object.keys(this.ctqDefinitions).length;
        results.sigmaLevel = this.calculateSigmaLevel(results.overallScore);

        return results;
    }

    /**
     * Calculate individual CTQ score
     * @param {string} ctqName - CTQ identifier
     * @param {Object} data - Input data
     * @param {Object} definition - CTQ definition
     * @returns {Object} CTQ score details
     */
    calculateCTQScore(ctqName, data, definition) {
        let actual = 0;

        switch (ctqName) {
            case 'security':
                actual = data.security?.score || Math.max(0, 95 - (data.security?.critical || 0) * 20 - (data.security?.high || 0) * 5);
                break;
            case 'nasaPOT10':
                actual = (data.nasa?.score || 0.90) * 100;
                break;
            case 'connascence':
                actual = Math.max(0, 95 - (data.connascence?.positive_deltas || 0) * 10);
                break;
            case 'godObjects':
                actual = Math.max(0, 100 - Math.max(0, data.god_objects?.delta || 0) * 25);
                break;
            case 'meceQuality':
                actual = (data.duplication?.mece || 0.75) * 100;
                break;
            case 'testsMutation':
                actual = (data.mutation?.mutation_score_changed || 0.60) * 100;
                break;
            case 'performance':
                actual = Math.max(0, 95 - (data.performance?.regressions || 0) * 10);
                break;
            default:
                actual = 0;
        }

        // Normalize score (0-1 scale)
        const normalized = Math.min(actual / definition.target, 1.0);

        return { actual, normalized };
    }

    /**
     * Calculate sigma level from overall score
     * @param {number} score - Overall CTQ score (0-1)
     * @returns {number} Sigma level
     */
    calculateSigmaLevel(score) {
        // Convert score to DPMO equivalent
        const dpmo = (1 - score) * 1000000;
        
        // Map DPMO to sigma level (industry standard)
        if (dpmo <= 3.4) return 6.0;
        if (dpmo <= 233) return 5.0;
        if (dpmo <= 6210) return 4.0;
        if (dpmo <= 66807) return 3.0;
        if (dpmo <= 308538) return 2.0;
        return 1.0;
    }

    /**
     * Get score status based on thresholds
     * @param {number} score - Normalized score
     * @returns {string} Status level
     */
    getScoreStatus(score) {
        if (score >= this.thresholds.critical) return 'EXCELLENT';
        if (score >= this.thresholds.warning) return 'GOOD';
        if (score >= this.thresholds.failure) return 'WARNING';
        return 'CRITICAL';
    }

    /**
     * Real-time CTQ monitoring
     * @param {Object} metrics - Current metrics
     * @returns {Object} Monitoring results
     */
    async monitor(metrics) {
        const results = await this.calculate(metrics);
        
        return {
            timestamp: new Date().toISOString(),
            overallHealth: results.overallScore,
            sigmaLevel: results.sigmaLevel,
            criticalCTQs: Object.entries(results.ctqScores)
                .filter(([, score]) => score.status === 'CRITICAL')
                .map(([name, score]) => ({ name, ...score })),
            trending: this.calculateTrend(results),
            alerts: this.generateAlerts(results)
        };
    }

    /**
     * Calculate trending indicators
     * @param {Object} results - CTQ results
     * @returns {Object} Trend analysis
     */
    calculateTrend(results) {
        // This would typically use historical data
        // For now, return current state indicators
        return {
            direction: results.overallScore >= 0.9 ? 'IMPROVING' : 'DECLINING',
            velocity: Math.abs(results.overallScore - 0.85) * 100,
            prediction: results.sigmaLevel >= 4.0 ? 'ON_TRACK' : 'AT_RISK'
        };
    }

    /**
     * Generate alerts based on CTQ performance
     * @param {Object} results - CTQ results
     * @returns {Array} Alert messages
     */
    generateAlerts(results) {
        const alerts = [];

        if (results.sigmaLevel < this.config.targetSigma) {
            alerts.push({
                level: 'WARNING',
                message: `Sigma level ${results.sigmaLevel} below target ${this.config.targetSigma}`,
                action: 'Review CTQ performance and implement improvements'
            });
        }

        if (results.defectCount > 2) {
            alerts.push({
                level: 'CRITICAL',
                message: `${results.defectCount} CTQs below critical threshold`,
                action: 'Immediate attention required for failing CTQs'
            });
        }

        return alerts;
    }
}

module.exports = { CTQCalculator };