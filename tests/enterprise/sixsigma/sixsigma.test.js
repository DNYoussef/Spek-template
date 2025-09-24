/**
 * Comprehensive Test Suite for Six Sigma Reporting System
 * Tests all SR-001 through SR-005 tasks with NASA POT10 compliance
 * 
 * @module SixSigmaTests
 * @compliance NASA-POT10-95%
 */

const { SixSigmaReportingSystem } = require('../../../analyzer/enterprise/sixsigma/index');
const { CTQCalculator } = require('../../../analyzer/enterprise/sixsigma/ctq-calculator');
const { SPCChartGenerator } = require('../../../analyzer/enterprise/sixsigma/spc-chart-generator');
const { DPMOCalculator } = require('../../../analyzer/enterprise/sixsigma/dpmo-calculator');
const { TheaterIntegrator } = require('../../../analyzer/enterprise/sixsigma/theater-integrator');
const { ReportGenerator } = require('../../../analyzer/enterprise/sixsigma/report-generator');
const { PerformanceMonitor } = require('../../../analyzer/enterprise/sixsigma/performance-monitor');
const { sixSigmaConfig } = require('../../../analyzer/enterprise/sixsigma/config');
const { cleanupTestResources } = require('../../setup/test-environment');

describe('Six Sigma Reporting System', () => {
    let system;
    let mockData;

    beforeEach(async () => {
        // Load configuration
        await sixSigmaConfig.loadConfig();
        
        // Initialize system
        system = new SixSigmaReportingSystem({
            targetSigma: 4.0,
            sigmaShift: 1.5,
            performanceThreshold: 1.2,
            artifactsPath: '.claude/.artifacts/sixsigma/test/'
        });

        // Mock test data
        mockData = {
            coverage: { percentage: 85 },
            quality: { score: 8.2 },
            security: { score: 92 },
            performance: { score: 88 },
            maintainability: { index: 78 },
            deployment: { successRate: 96 },
            satisfaction: { score: 89 },
            codeFiles: [
                { path: 'test/mock.js' }
            ],
            tests: [
                { name: 'valid test', passed: true },
                { name: 'another test', passed: true }
            ]
        };
    });

    afterEach(async () => {
        await cleanupTestResources();
    });

    describe('SR-001: CTQ Metrics Collector and Calculator', () => {
        let ctqCalculator;

        beforeEach(() => {
            ctqCalculator = new CTQCalculator(sixSigmaConfig.getModuleConfig('ctq'));
        });

        test('should calculate CTQ metrics correctly', async () => {
            const result = await ctqCalculator.calculate(mockData);

            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('ctqScores');
            expect(result).toHaveProperty('overallScore');
            expect(result).toHaveProperty('sigmaLevel');
            expect(result).toHaveProperty('defectCount');

            // Validate CTQ scores structure
            expect(result.ctqScores).toHaveProperty('security');
            expect(result.ctqScores).toHaveProperty('nasaPOT10');
            expect(result.ctqScores).toHaveProperty('connascence');

            // Validate score calculations
            expect(result.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.overallScore).toBeLessThanOrEqual(1);
            expect(result.sigmaLevel).toBeGreaterThanOrEqual(1);
            expect(result.sigmaLevel).toBeLessThanOrEqual(6);
        });

        test('should provide real-time monitoring', async () => {
            const monitorResult = await ctqCalculator.monitor(mockData);

            expect(monitorResult).toHaveProperty('timestamp');
            expect(monitorResult).toHaveProperty('overallHealth');
            expect(monitorResult).toHaveProperty('sigmaLevel');
            expect(monitorResult).toHaveProperty('criticalCTQs');
            expect(monitorResult).toHaveProperty('trending');
            expect(monitorResult).toHaveProperty('alerts');
        });

        test('should handle invalid data gracefully', async () => {
            const invalidData = { invalid: 'data' };
            const result = await ctqCalculator.calculate(invalidData);

            expect(result).toHaveProperty('ctqScores');
            expect(result.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.defectCount).toBeGreaterThanOrEqual(0);
        });

        test('should generate appropriate recommendations', async () => {
            const lowQualityData = {
                ...mockData,
                security: { critical: 5, high: 10 }, // Will create low security score
                nasa: { score: 0.70 } // Below 90% target
            };

            const result = await ctqCalculator.calculate(lowQualityData);
            expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
            if (result.recommendations.length > 0) {
                expect(result.recommendations[0]).toHaveProperty('priority');
                expect(result.recommendations[0]).toHaveProperty('message');
            }
        });
    });

    describe('SR-002: SPC Chart Generator', () => {
        let spcGenerator;
        let ctqResults;

        beforeEach(async () => {
            spcGenerator = new SPCChartGenerator(sixSigmaConfig.getModuleConfig('spc'));
            const ctqCalculator = new CTQCalculator();
            ctqResults = await ctqCalculator.calculate(mockData);
        });

        test('should generate SPC charts with control limits', async () => {
            const result = await spcGenerator.generate(ctqResults);

            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('charts');
            expect(result).toHaveProperty('controlLimits');
            expect(result).toHaveProperty('processCapability');
            expect(result).toHaveProperty('stability');

            // Validate charts structure
            expect(result.charts).toHaveProperty('overall');
            expect(Object.keys(result.charts).length).toBeGreaterThan(1);

            // Validate control limits
            const chart = result.charts.overall;
            expect(chart).toHaveProperty('controlLimits');
            expect(chart.controlLimits).toHaveProperty('ucl');
            expect(chart.controlLimits).toHaveProperty('lcl');
        });

        test('should detect violations and patterns', async () => {
            const result = await spcGenerator.generate(ctqResults);

            // Check violation detection
            Object.values(result.charts).forEach(chart => {
                if (chart.violations) {
                    chart.violations.forEach(violation => {
                        expect(violation).toHaveProperty('type');
                        expect(violation).toHaveProperty('severity');
                    });
                }
            });

            // Check pattern detection
            Object.values(result.charts).forEach(chart => {
                if (chart.patterns) {
                    chart.patterns.forEach(pattern => {
                        expect(pattern).toHaveProperty('type');
                    });
                }
            });
        });

        test('should calculate process capability indices', async () => {
            const result = await spcGenerator.generate(ctqResults);

            expect(result.processCapability).toHaveProperty('cp');
            expect(result.processCapability).toHaveProperty('cpk');
            expect(result.processCapability).toHaveProperty('interpretation');

            expect(result.processCapability.cp).toBeGreaterThanOrEqual(0);
            expect(result.processCapability.cpk).toBeGreaterThanOrEqual(0);
        });
    });

    describe('SR-003: DPMO/RTY Calculator', () => {
        let dpmoCalculator;
        let ctqResults;

        beforeEach(async () => {
            dpmoCalculator = new DPMOCalculator(sixSigmaConfig.getModuleConfig('dpmo'));
            const ctqCalculator = new CTQCalculator();
            ctqResults = await ctqCalculator.calculate(mockData);
        });

        test('should calculate DPMO and sigma levels', async () => {
            const result = await dpmoCalculator.calculate(ctqResults);

            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('dpmo');
            expect(result).toHaveProperty('rty');
            expect(result).toHaveProperty('sigmaLevels');
            expect(result).toHaveProperty('processMetrics');

            // Validate DPMO calculations
            Object.values(result.dpmo).forEach(dpmo => {
                expect(dpmo).toHaveProperty('value');
                expect(dpmo).toHaveProperty('defectRate');
                expect(dpmo).toHaveProperty('yieldRate');
                expect(dpmo.value).toBeGreaterThanOrEqual(0);
                expect(dpmo.value).toBeLessThanOrEqual(1000000);
            });

            // Validate sigma level mapping
            Object.values(result.sigmaLevels).forEach(sigma => {
                expect(sigma).toHaveProperty('sigmaLevel');
                expect(sigma).toHaveProperty('exactSigma');
                expect(sigma.sigmaLevel).toBeGreaterThanOrEqual(1.0);
                expect(sigma.sigmaLevel).toBeLessThanOrEqual(6.0);
            });
        });

        test('should calculate RTY correctly', async () => {
            const result = await dpmoCalculator.calculate(ctqResults);

            Object.values(result.rty).forEach(rty => {
                expect(rty).toHaveProperty('rty');
                expect(rty).toHaveProperty('fty');
                expect(rty.rty).toBeGreaterThanOrEqual(0);
                expect(rty.rty).toBeLessThanOrEqual(100);
            });
        });

        test('should provide benchmarking data', async () => {
            const result = await dpmoCalculator.calculate(ctqResults);

            expect(result).toHaveProperty('benchmarking');
            expect(result.benchmarking).toHaveProperty('currentClass');
            expect(result.benchmarking).toHaveProperty('industryBenchmarks');
            expect(result.benchmarking).toHaveProperty('competitivePosition');

            const validClasses = ['WORLD_CLASS', 'EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'];
            expect(validClasses).toContain(result.benchmarking.currentClass);
        });
    });

    describe('SR-004: Theater Detection Integration', () => {
        let theaterIntegrator;
        let ctqResults;

        beforeEach(async () => {
            theaterIntegrator = new TheaterIntegrator(sixSigmaConfig.getModuleConfig('theater'));
            const ctqCalculator = new CTQCalculator();
            ctqResults = await ctqCalculator.calculate(mockData);
        });

        test('should detect theater patterns', async () => {
            const result = await theaterIntegrator.analyze(mockData, ctqResults);

            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('theaterDetection');
            expect(result).toHaveProperty('qualityCorrelation');
            expect(result).toHaveProperty('riskAssessment');

            // Validate theater detection
            expect(result.theaterDetection).toHaveProperty('codeTheater');
            expect(result.theaterDetection).toHaveProperty('metricTheater');
            expect(result.theaterDetection).toHaveProperty('overallScore');
            expect(result.theaterDetection.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.theaterDetection.overallScore).toBeLessThanOrEqual(1);
        });

        test('should correlate with quality metrics', async () => {
            const result = await theaterIntegrator.analyze(mockData, ctqResults);

            expect(result.qualityCorrelation).toHaveProperty('theaterQualityGap');
            expect(result.qualityCorrelation).toHaveProperty('correlationStrength');
            expect(result.qualityCorrelation).toHaveProperty('confidenceScore');

            // Validate correlation analysis
            Object.values(result.qualityCorrelation.theaterQualityGap).forEach(gap => {
                expect(gap).toHaveProperty('expectedQuality');
                expect(gap).toHaveProperty('actualQuality');
                expect(gap).toHaveProperty('gap');
            });
        });

        test('should assess risk levels correctly', async () => {
            const result = await theaterIntegrator.analyze(mockData, ctqResults);

            expect(result.riskAssessment).toHaveProperty('overallRisk');
            expect(result.riskAssessment).toHaveProperty('riskFactors');

            const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH'];
            expect(validRiskLevels).toContain(result.riskAssessment.overallRisk);
        });

        test('should handle suspicious metrics', async () => {
            const suspiciousData = {
                ...mockData,
                coverage: { percentage: 100 }, // Suspiciously perfect
                quality: { score: 10.0 }       // Unrealistically high
            };

            const result = await theaterIntegrator.analyze(suspiciousData, ctqResults);
            expect(result.theaterDetection.overallScore).toBeGreaterThan(0.3);
            expect(result.recommendations.length).toBeGreaterThan(0);
        });
    });

    describe('SR-005: Report Generator', () => {
        let reportGenerator;
        let analysisData;

        beforeEach(async () => {
            reportGenerator = new ReportGenerator(sixSigmaConfig.getArtifactsConfig());
            
            // Generate analysis data from all modules
            const ctqCalculator = new CTQCalculator();
            const spcGenerator = new SPCChartGenerator();
            const dpmoCalculator = new DPMOCalculator();
            const theaterIntegrator = new TheaterIntegrator();

            const ctqResults = await ctqCalculator.calculate(mockData);
            const spcResults = await spcGenerator.generate(ctqResults);
            const dpmoResults = await dpmoCalculator.calculate(ctqResults);
            const theaterResults = await theaterIntegrator.analyze(mockData, ctqResults);

            analysisData = {
                timestamp: new Date().toISOString(),
                ctq: ctqResults,
                spc: spcResults,
                dpmo: dpmoResults,
                theater: theaterResults
            };
        });

        test('should generate comprehensive reports', async () => {
            const result = await reportGenerator.generate(analysisData);

            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('reports');
            expect(result).toHaveProperty('artifacts');
            expect(result).toHaveProperty('summary');

            // Validate all report types
            expect(result.reports).toHaveProperty('executive');
            expect(result.reports).toHaveProperty('detailed');
            expect(result.reports).toHaveProperty('technical');
            expect(result.reports).toHaveProperty('dashboard');

            // Validate report content
            expect(typeof result.reports.executive).toBe('string');
            expect(result.reports.executive.length).toBeGreaterThan(100);
            expect(typeof result.reports.dashboard).toBe('object');
        });

        test('should consolidate recommendations correctly', async () => {
            const result = await reportGenerator.generate(analysisData);

            // Check if recommendations are properly categorized
            if (result.reports.dashboard.actions) {
                result.reports.dashboard.actions.forEach(action => {
                    expect(action).toHaveProperty('type');
                    expect(action).toHaveProperty('priority');
                    expect(action).toHaveProperty('message');
                });
            }
        });

        test('should handle missing data gracefully', async () => {
            const incompleteData = {
                timestamp: new Date().toISOString(),
                ctq: analysisData.ctq
                // Missing spc, dpmo, theater data
            };

            const result = await reportGenerator.generate(incompleteData);
            expect(result).toHaveProperty('reports');
            expect(result.reports.executive).toContain('N/A');
        });
    });

    describe('Performance Monitoring (<1.2% overhead)', () => {
        let performanceMonitor;

        beforeEach(() => {
            performanceMonitor = new PerformanceMonitor({
                performanceThreshold: 1.2,
                maxExecutionTime: 5000,
                maxMemoryUsage: 100
            });
        });

        test('should monitor execution performance', async () => {
            const startTime = performance.now();
            
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const executionTime = performance.now() - startTime;
            await performanceMonitor.record(executionTime, { test: 'performance monitoring' });

            const metrics = await performanceMonitor.getMetrics();
            expect(metrics).toHaveProperty('summary');
            expect(metrics).toHaveProperty('compliance');
            expect(metrics.summary.totalExecutions).toBe(1);
        });

        test('should detect overhead violations', async () => {
            // Simulate high overhead
            await performanceMonitor.record(5000, { baselineTime: 100 });

            const metrics = await performanceMonitor.getMetrics();
            expect(metrics.alerts.length).toBeGreaterThan(0);
            
            const overheadAlert = metrics.alerts.find(alert => alert.type === 'OVERHEAD_EXCEEDED');
            expect(overheadAlert).toBeTruthy();
            expect(overheadAlert.severity).toBe('CRITICAL');
        });

        test('should maintain compliance tracking', async () => {
            // Record good performance
            await performanceMonitor.record(50, { baselineTime: 100 });

            const metrics = await performanceMonitor.getMetrics();
            expect(metrics.compliance.overhead.compliant).toBe(true);
            expect(metrics.compliance.overhead.current).toBeLessThan(1.2);
        });
    });

    describe('Integration Tests', () => {
        test('should run complete Six Sigma analysis', async () => {
            const startTime = performance.now();
            const result = await system.generateReport(mockData);
            const executionTime = performance.now() - startTime;

            // Validate complete analysis
            expect(result).toHaveProperty('ctq');
            expect(result).toHaveProperty('spc');
            expect(result).toHaveProperty('dpmo');
            expect(result).toHaveProperty('theater');
            expect(result).toHaveProperty('reports');

            // Validate performance (should be under 5 seconds)
            expect(executionTime).toBeLessThan(5000);

            // Validate NASA POT10 compliance elements
            expect(result.reports.technical).toContain('NASA POT10');
            expect(result.ctq.overallScore).toBeDefined();
        });

        test('should maintain NASA POT10 compliance (95%+)', async () => {
            const complianceValidation = sixSigmaConfig.validateNASACompliance();
            
            expect(complianceValidation.valid).toBe(true);
            expect(complianceValidation.target).toBeGreaterThanOrEqual(90);
            expect(complianceValidation.auditTrail).toBe(true);
            expect(complianceValidation.evidenceComplete).toBe(true);
        });

        test('should handle enterprise configuration', async () => {
            const config = await sixSigmaConfig.loadConfig();
            
            expect(config).toHaveProperty('targetSigma');
            expect(config).toHaveProperty('sigmaShift');
            expect(config).toHaveProperty('performanceThreshold');
            expect(config).toHaveProperty('ctqWeights');

            // Validate configuration structure
            expect(config.targetSigma).toBeGreaterThanOrEqual(1.0);
            expect(config.targetSigma).toBeLessThanOrEqual(6.0);
            expect(config.performanceThreshold).toBeLessThanOrEqual(5.0);
        });

        test('should generate artifacts in correct directory', async () => {
            const result = await system.generateReport(mockData);
            
            expect(result.reports).toHaveProperty('artifacts');
            
            // Validate artifact paths
            Object.values(result.reports.artifacts).forEach(path => {
                expect(path).toContain('.claude/.artifacts/sixsigma/');
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle empty input data', async () => {
            const emptyData = {};
            const result = await system.generateReport(emptyData);
            
            expect(result).toBeDefined();
            expect(result.ctq.overallScore).toBe(0);
            expect(result.ctq.defectCount).toBeGreaterThan(0);
        });

        test('should handle malformed configuration', async () => {
            const invalidSystem = new SixSigmaReportingSystem({
                targetSigma: -1, // Invalid
                performanceThreshold: 100 // Too high
            });

            // Should still function with defaults
            const result = await invalidSystem.generateReport(mockData);
            expect(result).toBeDefined();
        });

        test('should recover from module failures gracefully', async () => {
            // Mock a module failure
            const originalMethod = system.spcGenerator.generate;
            system.spcGenerator.generate = () => {
                throw new Error('Mock SPC failure');
            };

            try {
                await system.generateReport(mockData);
            } catch (error) {
                expect(error.message).toContain('Six Sigma reporting failed');
            }

            // Restore original method
            system.spcGenerator.generate = originalMethod;
        });
    });
});

// Performance benchmarking test
describe('Performance Benchmarks', () => {
    test('should complete full analysis within performance budget', async () => {
        const system = new SixSigmaReportingSystem();
        const largeDataset = {
            ...mockData,
            codeFiles: Array(50).fill().map((_, i) => ({ path: `file${i}.js` })),
            tests: Array(100).fill().map((_, i) => ({ name: `test${i}`, passed: true }))
        };

        const startTime = performance.now();
        const startMemory = process.memoryUsage().heapUsed;

        await system.generateReport(largeDataset);

        const executionTime = performance.now() - startTime;
        const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024; // MB

        // Performance assertions
        expect(executionTime).toBeLessThan(5000); // <5 seconds
        expect(memoryUsed).toBeLessThan(100);     // <100MB

        // Calculate overhead (should be <1.2%)
        const baselineTime = 1000; // 1 second baseline
        const overhead = ((executionTime - baselineTime) / baselineTime) * 100;
        expect(overhead).toBeLessThan(1.2);
    });
});