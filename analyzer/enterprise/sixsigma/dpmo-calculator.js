/**
 * SR-003: DPMO/RTY Calculator with Sigma Level Mapping
 * Defects Per Million Opportunities and Rolled Throughput Yield calculator
 * 
 * @module DPMOCalculator
 * @compliance NASA-POT10-95%
 */

class DPMOCalculator {
    constructor(config = {}) {
        this.config = config;
        this.sigmaShift = config.sigmaShift || 1.5; // Industry standard 1.5 sigma shift
        
        // Industry standard DPMO to Sigma level mapping
        this.sigmaLevels = [
            { sigma: 6.0, dpmo: 3.4, yield: 99.99966 },
            { sigma: 5.5, dpmo: 32, yield: 99.9968 },
            { sigma: 5.0, dpmo: 233, yield: 99.9767 },
            { sigma: 4.5, dpmo: 1350, yield: 99.865 },
            { sigma: 4.0, dpmo: 6210, yield: 99.379 },
            { sigma: 3.5, dpmo: 22750, yield: 97.725 },
            { sigma: 3.0, dpmo: 66807, yield: 93.32 },
            { sigma: 2.5, dpmo: 158655, yield: 84.13 },
            { sigma: 2.0, dpmo: 308538, yield: 69.15 },
            { sigma: 1.5, dpmo: 500000, yield: 50.0 },
            { sigma: 1.0, dpmo: 691462, yield: 30.85 }
        ];
    }

    /**
     * Calculate DPMO and related metrics
     * @param {Object} ctqData - CTQ calculation results
     * @returns {Object} DPMO calculation results
     */
    async calculate(ctqData) {
        const results = {
            timestamp: new Date().toISOString(),
            dpmo: {},
            rty: {},
            sigmaLevels: {},
            processMetrics: {},
            benchmarking: {},
            recommendations: []
        };

        // Calculate DPMO for each CTQ
        for (const [ctqName, ctqScore] of Object.entries(ctqData.ctqScores || {})) {
            results.dpmo[ctqName] = this.calculateCTQDPMO(ctqScore);
            results.rty[ctqName] = this.calculateRTY(ctqScore);
            results.sigmaLevels[ctqName] = this.mapDPMOToSigma(results.dpmo[ctqName].value);
        }

        // Calculate overall process metrics
        results.processMetrics = this.calculateOverallMetrics(ctqData, results);
        
        // Generate benchmarking data
        results.benchmarking = this.generateBenchmarking(results.processMetrics);
        
        // Generate recommendations
        results.recommendations = this.generateDPMORecommendations(results);

        return results;
    }

    /**
     * Calculate DPMO for individual CTQ
     * @param {Object} ctqScore - CTQ score data
     * @returns {Object} DPMO calculation result
     */
    calculateCTQDPMO(ctqScore) {
        // Calculate defect rate (1 - normalized score)
        const defectRate = 1 - (ctqScore.score || 0);
        
        // DPMO = (Defects / (Units * Opportunities)) * 1,000,000
        // For CTQ scoring, we assume 1 unit with 1 opportunity per measurement
        const dpmo = defectRate * 1000000;
        
        return {
            value: Math.round(dpmo),
            defectRate: Number((defectRate * 100).toFixed(2)), // As percentage
            yieldRate: Number(((1 - defectRate) * 100).toFixed(2)), // As percentage
            opportunities: 1,
            unitsProduced: 1,
            defectsFound: defectRate
        };
    }

    /**
     * Calculate Rolled Throughput Yield (RTY)
     * @param {Object} ctqScore - CTQ score data
     * @returns {Object} RTY calculation result
     */
    calculateRTY(ctqScore) {
        const yieldRate = ctqScore.score || 0;
        
        // RTY for single process step
        const rty = yieldRate;
        
        // First Time Yield (FTY)
        const fty = yieldRate;
        
        return {
            rty: Number((rty * 100).toFixed(2)),
            fty: Number((fty * 100).toFixed(2)),
            processSteps: 1,
            overallYield: Number((rty * 100).toFixed(2))
        };
    }

    /**
     * Map DPMO value to Sigma level
     * @param {number} dpmo - DPMO value
     * @returns {Object} Sigma level mapping
     */
    mapDPMOToSigma(dpmo) {
        // Find closest sigma level
        let closestLevel = this.sigmaLevels[this.sigmaLevels.length - 1];
        
        for (const level of this.sigmaLevels) {
            if (dpmo <= level.dpmo) {
                closestLevel = level;
                break;
            }
        }

        // Calculate exact sigma level using interpolation
        const exactSigma = this.calculateExactSigma(dpmo);

        return {
            sigmaLevel: closestLevel.sigma,
            exactSigma: Number(exactSigma.toFixed(2)),
            dpmoThreshold: closestLevel.dpmo,
            yieldThreshold: closestLevel.yield,
            classification: this.classifySigmaLevel(closestLevel.sigma),
            improvement: this.calculateImprovementPotential(closestLevel.sigma)
        };
    }

    /**
     * Calculate exact sigma level using inverse normal distribution
     * @param {number} dpmo - DPMO value
     * @returns {number} Exact sigma level
     */
    calculateExactSigma(dpmo) {
        if (dpmo <= 0) return 6.0;
        if (dpmo >= 1000000) return 0.0;

        // Convert DPMO to defect rate
        const defectRate = dpmo / 1000000;
        
        // Convert to yield
        const yield_ = 1 - defectRate;
        
        // Approximate inverse normal calculation for sigma level
        // This is a simplified approximation - in production, use a proper statistical library
        const z = this.approximateInverseNormal(yield_);
        
        // Apply 1.5 sigma shift
        return Math.max(0, z + this.sigmaShift);
    }

    /**
     * Approximate inverse normal distribution
     * @param {number} p - Probability (yield rate)
     * @returns {number} Z-score approximation
     */
    approximateInverseNormal(p) {
        if (p <= 0) return -6;
        if (p >= 1) return 6;
        
        // Beasley-Springer-Moro approximation
        const a0 = 2.515517;
        const a1 = 0.802853;
        const a2 = 0.010328;
        const b1 = 1.432788;
        const b2 = 0.189269;
        const b3 = 0.001308;
        
        let t, z;
        
        if (p > 0.5) {
            t = Math.sqrt(-2 * Math.log(1 - p));
            z = t - (a0 + a1 * t + a2 * t * t) / (1 + b1 * t + b2 * t * t + b3 * t * t * t);
        } else {
            t = Math.sqrt(-2 * Math.log(p));
            z = -(t - (a0 + a1 * t + a2 * t * t) / (1 + b1 * t + b2 * t * t + b3 * t * t * t));
        }
        
        return z;
    }

    /**
     * Calculate overall process metrics
     * @param {Object} ctqData - CTQ data
     * @param {Object} results - Current results
     * @returns {Object} Overall process metrics
     */
    calculateOverallMetrics(ctqData, results) {
        const ctqCount = Object.keys(results.dpmo).length;
        
        // Calculate weighted average DPMO
        let totalWeightedDPMO = 0;
        let totalWeight = 0;
        
        for (const [ctqName, dpmoData] of Object.entries(results.dpmo)) {
            const weight = ctqData.ctqScores[ctqName]?.weight || 1;
            totalWeightedDPMO += dpmoData.value * weight;
            totalWeight += weight;
        }
        
        const overallDPMO = totalWeightedDPMO / totalWeight;
        const overallSigma = this.mapDPMOToSigma(overallDPMO);
        
        // Calculate process RTY (multiplicative for multiple CTQs)
        let processRTY = 1;
        for (const rtyData of Object.values(results.rty)) {
            processRTY *= (rtyData.rty / 100);
        }
        
        return {
            overallDPMO: Math.round(overallDPMO),
            overallSigma: overallSigma.exactSigma,
            targetSigma: this.config.targetSigma || 4.0,
            processRTY: Number((processRTY * 100).toFixed(2)),
            processYield: Number(((1 - overallDPMO / 1000000) * 100).toFixed(2)),
            ctqCount: ctqCount,
            performanceGap: Number(((this.config.targetSigma || 4.0) - overallSigma.exactSigma).toFixed(2)),
            costOfPoorQuality: this.estimateCOPQ(overallDPMO)
        };
    }

    /**
     * Generate benchmarking data
     * @param {Object} processMetrics - Process metrics
     * @returns {Object} Benchmarking information
     */
    generateBenchmarking(processMetrics) {
        const industryBenchmarks = {
            worldClass: { sigma: 6.0, dpmo: 3.4 },
            excellent: { sigma: 5.0, dpmo: 233 },
            good: { sigma: 4.0, dpmo: 6210 },
            average: { sigma: 3.0, dpmo: 66807 },
            poor: { sigma: 2.0, dpmo: 308538 }
        };

        let currentClass = 'poor';
        for (const [className, benchmark] of Object.entries(industryBenchmarks)) {
            if (processMetrics.overallSigma >= benchmark.sigma) {
                currentClass = className;
                break;
            }
        }

        return {
            currentClass: currentClass.toUpperCase(),
            industryBenchmarks,
            competitivePosition: this.assessCompetitivePosition(processMetrics.overallSigma),
            improvementOpportunity: this.calculateImprovementOpportunity(processMetrics)
        };
    }

    /**
     * Estimate Cost of Poor Quality (COPQ)
     * @param {number} dpmo - Overall DPMO
     * @returns {Object} COPQ estimation
     */
    estimateCOPQ(dpmo) {
        // Industry standard: COPQ typically 10-25% of revenue for poor quality processes
        const defectRate = dpmo / 1000000;
        const copqPercentage = Math.min(25, defectRate * 30); // Cap at 25%
        
        return {
            percentage: Number(copqPercentage.toFixed(2)),
            category: copqPercentage < 5 ? 'LOW' : copqPercentage < 15 ? 'MODERATE' : 'HIGH',
            potentialSavings: Number((copqPercentage * 0.7).toFixed(2)) // 70% of COPQ is typically recoverable
        };
    }

    /**
     * Generate DPMO-based recommendations
     * @param {Object} results - DPMO calculation results
     * @returns {Array} Recommendations
     */
    generateDPMORecommendations(results) {
        const recommendations = [];
        
        // Overall process recommendations
        if (results.processMetrics.overallSigma < 3.0) {
            recommendations.push({
                type: 'PROCESS_IMPROVEMENT',
                priority: 'CRITICAL',
                message: `Process sigma level ${results.processMetrics.overallSigma} requires immediate improvement`,
                action: 'Implement Six Sigma DMAIC methodology for process improvement',
                expectedImpact: 'Reduce DPMO by 50-80%'
            });
        }

        // CTQ-specific recommendations
        for (const [ctqName, dpmoData] of Object.entries(results.dpmo)) {
            if (dpmoData.value > 50000) {
                recommendations.push({
                    type: 'CTQ_IMPROVEMENT',
                    priority: 'HIGH',
                    ctq: ctqName,
                    message: `CTQ ${ctqName} has DPMO of ${dpmoData.value}`,
                    action: 'Focus improvement efforts on this critical CTQ',
                    expectedImpact: `Reduce overall process DPMO by ${Math.round(dpmoData.value * 0.1)}`
                });
            }
        }

        // RTY recommendations
        if (results.processMetrics.processRTY < 90) {
            recommendations.push({
                type: 'RTY_IMPROVEMENT',
                priority: 'MEDIUM',
                message: `Process RTY of ${results.processMetrics.processRTY}% is below target`,
                action: 'Implement error-proofing (poka-yoke) techniques',
                expectedImpact: 'Increase RTY by 10-20%'
            });
        }

        return recommendations;
    }

    // Helper methods
    classifySigmaLevel(sigma) {
        if (sigma >= 6.0) return 'WORLD_CLASS';
        if (sigma >= 5.0) return 'EXCELLENT';
        if (sigma >= 4.0) return 'GOOD';
        if (sigma >= 3.0) return 'AVERAGE';
        return 'POOR';
    }

    calculateImprovementPotential(sigma) {
        const targetSigma = this.config.targetSigma || 4.0;
        const gap = Math.max(0, targetSigma - sigma);
        
        return {
            sigmaGap: Number(gap.toFixed(2)),
            improvementNeeded: gap > 0,
            effort: gap < 0.5 ? 'LOW' : gap < 1.0 ? 'MEDIUM' : 'HIGH'
        };
    }

    assessCompetitivePosition(sigma) {
        if (sigma >= 5.5) return 'INDUSTRY_LEADER';
        if (sigma >= 4.5) return 'ABOVE_AVERAGE';
        if (sigma >= 3.5) return 'AVERAGE';
        if (sigma >= 2.5) return 'BELOW_AVERAGE';
        return 'POOR';
    }

    calculateImprovementOpportunity(processMetrics) {
        const currentDPMO = processMetrics.overallDPMO;
        const targetDPMO = 6210; // 4-sigma level
        
        if (currentDPMO <= targetDPMO) {
            return {
                status: 'ON_TARGET',
                opportunity: 0,
                focus: 'MAINTAIN_CURRENT_PERFORMANCE'
            };
        }

        const improvement = ((currentDPMO - targetDPMO) / currentDPMO) * 100;
        
        return {
            status: 'IMPROVEMENT_NEEDED',
            opportunity: Number(improvement.toFixed(1)),
            focus: improvement > 50 ? 'MAJOR_REDESIGN' : 'INCREMENTAL_IMPROVEMENT'
        };
    }
}

module.exports = { DPMOCalculator };