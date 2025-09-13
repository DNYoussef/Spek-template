/**
 * Six Sigma Reporting System - Main Entry Point
 * Provides enterprise-grade statistical analysis capabilities
 * 
 * @module SixSigmaReporting
 * @version 1.0.0
 * @compliance NASA-POT10-95%
 */

const { CTQCalculator } = require('./ctq-calculator');
const { SPCChartGenerator } = require('./spc-chart-generator');
const { DPMOCalculator } = require('./dpmo-calculator');
const { TheaterIntegrator } = require('./theater-integrator');
const { ReportGenerator } = require('./report-generator');
const { PerformanceMonitor } = require('./performance-monitor');

class SixSigmaReportingSystem {
    constructor(config = {}) {
        this.config = {
            targetSigma: config.targetSigma || 4.0,
            sigmaShift: config.sigmaShift || 1.5,
            performanceThreshold: config.performanceThreshold || 1.2, // <1.2% overhead
            artifactsPath: config.artifactsPath || '.claude/.artifacts/sixsigma/',
            ...config
        };
        
        this.ctqCalculator = new CTQCalculator(this.config);
        this.spcGenerator = new SPCChartGenerator(this.config);
        this.dpmoCalculator = new DPMOCalculator(this.config);
        this.theaterIntegrator = new TheaterIntegrator(this.config);
        this.reportGenerator = new ReportGenerator(this.config);
        this.performanceMonitor = new PerformanceMonitor(this.config);
    }

    /**
     * Generate comprehensive Six Sigma report
     * @param {Object} data - Input data for analysis
     * @returns {Object} Complete Six Sigma analysis report
     */
    async generateReport(data) {
        const startTime = performance.now();
        
        try {
            // Step 1: Calculate CTQ metrics
            const ctqResults = await this.ctqCalculator.calculate(data);
            
            // Step 2: Generate SPC charts
            const spcCharts = await this.spcGenerator.generate(ctqResults);
            
            // Step 3: Calculate DPMO and sigma levels
            const dpmoResults = await this.dpmoCalculator.calculate(ctqResults);
            
            // Step 4: Integrate theater detection
            const theaterAnalysis = await this.theaterIntegrator.analyze(data, ctqResults);
            
            // Step 5: Generate final report
            const report = await this.reportGenerator.generate({
                ctq: ctqResults,
                spc: spcCharts,
                dpmo: dpmoResults,
                theater: theaterAnalysis,
                timestamp: new Date().toISOString()
            });
            
            // Monitor performance
            const executionTime = performance.now() - startTime;
            await this.performanceMonitor.record(executionTime);
            
            return report;
            
        } catch (error) {
            await this.performanceMonitor.recordError(error);
            throw new Error(`Six Sigma reporting failed: ${error.message}`);
        }
    }

    /**
     * Real-time CTQ monitoring
     * @param {Object} metrics - Current metrics data
     * @returns {Object} Real-time CTQ status
     */
    async monitorCTQ(metrics) {
        return await this.ctqCalculator.monitor(metrics);
    }

    /**
     * Generate SPC control charts only
     * @param {Array} data - Time series data
     * @returns {Object} SPC chart data
     */
    async generateSPCCharts(data) {
        return await this.spcGenerator.generate(data);
    }

    /**
     * Calculate DPMO for specific process
     * @param {Object} processData - Process performance data
     * @returns {Object} DPMO and sigma level results
     */
    async calculateDPMO(processData) {
        return await this.dpmoCalculator.calculate(processData);
    }

    /**
     * Theater detection analysis
     * @param {Object} qualityData - Quality metrics data
     * @returns {Object} Theater detection results
     */
    async detectTheater(qualityData) {
        return await this.theaterIntegrator.analyze(qualityData);
    }

    /**
     * Get system performance metrics
     * @returns {Object} Performance monitoring data
     */
    async getPerformanceMetrics() {
        return await this.performanceMonitor.getMetrics();
    }
}

module.exports = { SixSigmaReportingSystem };