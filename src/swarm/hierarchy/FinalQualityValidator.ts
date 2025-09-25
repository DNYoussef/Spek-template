/**
 * FinalQualityValidator.ts
 * Stage 8: Ultimate validation ensuring 100% complete, 100% working, 100% highest quality
 * The final gatekeeper before Queen notification - ZERO COMPROMISE
 */

import { CodexSandboxValidator, SandboxTestResult } from './CodexSandboxValidator';
import { DebugCycleController, DebugResult } from './DebugCycleController';
import { EnterpriseQualityAnalyzer, QualityAnalysisReport } from './EnterpriseQualityAnalyzer';
import { CodexQualityEnhancer, QualityEnhancementResult } from './CodexQualityEnhancer';

interface FinalValidationConfig {
    maxIterations: number;
    qualityThreshold: number; // Must be 100
    completenessThreshold: number; // Must be 100
    functionalityThreshold: number; // Must be 100
    performanceBaseline: {
        maxLatency: number; // milliseconds
        minThroughput: number; // ops/sec
        maxMemory: number; // MB
        maxCPU: number; // percentage
    };
    nasaComplianceRequired: boolean;
    defenseStandardsRequired: boolean;
}

interface ValidationMetrics {
    completeness: number;
    functionality: number;
    quality: number;
    performance: {
        latency: number;
        throughput: number;
        memory: number;
        cpu: number;
    };
    nasaCompliance: number;
    defenseCompliance: number;
    enterpriseCompliance: number;
}

interface FinalValidationResult {
    passed: boolean;
    metrics: ValidationMetrics;
    iterations: number;
    enhancedFiles: string[];
    evidenceChain: {
        sandboxTests: SandboxTestResult[];
        qualityReports: QualityAnalysisReport[];
        enhancementResults: QualityEnhancementResult[];
        debugResults: DebugResult[];
    };
    certification: {
        isComplete: boolean;
        isWorking: boolean;
        isHighestQuality: boolean;
        nasaCertified: boolean;
        defenseCertified: boolean;
        readyForQueen: boolean;
    };
}

export class FinalQualityValidator {
    private sandboxValidator: CodexSandboxValidator;
    private debugController: DebugCycleController;
    private qualityAnalyzer: EnterpriseQualityAnalyzer;
    private qualityEnhancer: CodexQualityEnhancer;
    private config: FinalValidationConfig;

    constructor() {
        this.sandboxValidator = new CodexSandboxValidator();
        this.debugController = new DebugCycleController();
        this.qualityAnalyzer = new EnterpriseQualityAnalyzer();
        this.qualityEnhancer = new CodexQualityEnhancer();

        // UNCOMPROMISING configuration - 100% or nothing
        this.config = {
            maxIterations: 10, // Will iterate until perfect
            qualityThreshold: 100,
            completenessThreshold: 100,
            functionalityThreshold: 100,
            performanceBaseline: {
                maxLatency: 100, // 100ms max
                minThroughput: 1000, // 1000 ops/sec min
                maxMemory: 512, // 512MB max
                maxCPU: 50 // 50% CPU max
            },
            nasaComplianceRequired: true,
            defenseStandardsRequired: true
        };
    }

    async validateUltimate(
        files: string[],
        context: any,
        previousEnhancement: QualityEnhancementResult
    ): Promise<FinalValidationResult> {
        console.log(`[FinalQualityValidator] Starting ULTIMATE validation for ${files.length} files`);
        console.log('[FinalQualityValidator] Target: 100% Complete, 100% Working, 100% Highest Quality');

        const evidenceChain = {
            sandboxTests: [],
            qualityReports: [],
            enhancementResults: [previousEnhancement],
            debugResults: []
        };

        let currentFiles = [...previousEnhancement.enhancedFiles];
        let iteration = 0;
        let fullyValidated = false;

        while (iteration < this.config.maxIterations && !fullyValidated) {
            iteration++;
            console.log(`[FinalQualityValidator] Iteration ${iteration}/${this.config.maxIterations}`);

            // Step 1: Run comprehensive sandbox tests
            const sandboxResult = await this.sandboxValidator.validateInSandbox(
                currentFiles,
                context,
                {
                    runtime: 'codex-production',
                    timeout: 120000, // 2 minutes for thorough testing
                    strictMode: true,
                    coverage: true,
                    performanceProfile: true
                }
            );
            evidenceChain.sandboxTests.push(sandboxResult);

            // Step 2: If not passing, debug until fixed
            if (!sandboxResult.success || sandboxResult.testsPassed < sandboxResult.testsTotal) {
                console.log(`[FinalQualityValidator] Tests failed. Entering debug cycle.`);
                const debugResult = await this.debugController.runDebugCycle(
                    currentFiles,
                    sandboxResult,
                    context,
                    {
                        maxIterations: 5,
                        autoFix: true,
                        strictMode: true
                    }
                );
                evidenceChain.debugResults.push(debugResult);
                currentFiles = debugResult.fixedFiles;
                continue; // Restart validation with fixed files
            }

            // Step 3: Re-analyze for quality issues
            const qualityReport = await this.qualityAnalyzer.analyzeCode(currentFiles);
            evidenceChain.qualityReports.push(qualityReport);

            // Step 4: Check if quality is PERFECT
            const metrics = this.calculateMetrics(sandboxResult, qualityReport);

            if (this.isPerfect(metrics)) {
                fullyValidated = true;
                console.log('[FinalQualityValidator] PERFECTION ACHIEVED!');
            } else {
                console.log('[FinalQualityValidator] Quality not perfect. Re-enhancing...');

                // Step 5: Re-enhance if not perfect
                const enhancementResult = await this.qualityEnhancer.enhanceCodeQuality(
                    currentFiles,
                    qualityReport,
                    context
                );
                evidenceChain.enhancementResults.push(enhancementResult);
                currentFiles = enhancementResult.enhancedFiles;
            }
        }

        // Final validation metrics
        const finalSandboxTest = evidenceChain.sandboxTests[evidenceChain.sandboxTests.length - 1];
        const finalQualityReport = evidenceChain.qualityReports[evidenceChain.qualityReports.length - 1];
        const finalMetrics = this.calculateMetrics(finalSandboxTest, finalQualityReport);

        const certification = {
            isComplete: finalMetrics.completeness === 100,
            isWorking: finalMetrics.functionality === 100,
            isHighestQuality: finalMetrics.quality === 100,
            nasaCertified: finalMetrics.nasaCompliance === 100,
            defenseCertified: finalMetrics.defenseCompliance === 100,
            readyForQueen: false
        };

        // Only ready for Queen if ALL criteria met
        certification.readyForQueen =
            certification.isComplete &&
            certification.isWorking &&
            certification.isHighestQuality &&
            certification.nasaCertified &&
            certification.defenseCertified;

        const result: FinalValidationResult = {
            passed: certification.readyForQueen,
            metrics: finalMetrics,
            iterations: iteration,
            enhancedFiles: currentFiles,
            evidenceChain,
            certification
        };

        if (certification.readyForQueen) {
            console.log('[FinalQualityValidator]  CODE IS READY FOR THE QUEEN!');
            console.log('[FinalQualityValidator] Certification Summary:');
            console.log(`  - 100% Complete: ${certification.isComplete}`);
            console.log(`  - 100% Working: ${certification.isWorking}`);
            console.log(`  - 100% Highest Quality: ${certification.isHighestQuality}`);
            console.log(`  - NASA Certified: ${certification.nasaCertified}`);
            console.log(`  - Defense Certified: ${certification.defenseCertified}`);
        } else {
            console.log('[FinalQualityValidator]  CODE NOT YET READY - MORE WORK NEEDED');
            this.logDeficiencies(finalMetrics, certification);
        }

        return result;
    }

    private calculateMetrics(
        sandboxResult: SandboxTestResult,
        qualityReport: QualityAnalysisReport
    ): ValidationMetrics {
        // Completeness: All code paths covered, all features implemented
        const completeness = this.calculateCompleteness(sandboxResult, qualityReport);

        // Functionality: All tests pass, no runtime errors
        const functionality = sandboxResult.success ?
            (sandboxResult.testsPassed / sandboxResult.testsTotal) * 100 : 0;

        // Quality: Composite of all quality metrics
        const quality = this.calculateQualityScore(qualityReport);

        // Performance metrics from sandbox
        const performance = {
            latency: sandboxResult.performance?.avgLatency || 0,
            throughput: sandboxResult.performance?.throughput || 0,
            memory: sandboxResult.performance?.memoryUsage || 0,
            cpu: sandboxResult.performance?.cpuUsage || 0
        };

        // Compliance scores
        const nasaCompliance = this.calculateNasaCompliance(qualityReport);
        const defenseCompliance = this.calculateDefenseCompliance(qualityReport);
        const enterpriseCompliance = this.calculateEnterpriseCompliance(qualityReport);

        return {
            completeness,
            functionality,
            quality,
            performance,
            nasaCompliance,
            defenseCompliance,
            enterpriseCompliance
        };
    }

    private calculateCompleteness(
        sandboxResult: SandboxTestResult,
        qualityReport: QualityAnalysisReport
    ): number {
        const factors = [];

        // Code coverage
        if (sandboxResult.coverage) {
            factors.push(sandboxResult.coverage.line);
            factors.push(sandboxResult.coverage.branch);
            factors.push(sandboxResult.coverage.function);
        }

        // Implementation completeness from quality report
        const noMocks = qualityReport.theaterDetection?.mockCount === 0 ? 100 : 0;
        const noTodos = qualityReport.theaterDetection?.todoCount === 0 ? 100 : 0;
        const noStubs = qualityReport.theaterDetection?.stubCount === 0 ? 100 : 0;

        factors.push(noMocks, noTodos, noStubs);

        return factors.length > 0 ?
            factors.reduce((a, b) => a + b, 0) / factors.length : 0;
    }

    private calculateQualityScore(report: QualityAnalysisReport): number {
        const scores = [];

        // Connascence score (lower is better, invert)
        if (report.connascence) {
            const connScore = Math.max(0, 100 - (report.connascence.totalViolations * 5));
            scores.push(connScore);
        }

        // God object score (none should exist)
        if (report.godObjects) {
            const godScore = report.godObjects.length === 0 ? 100 : 0;
            scores.push(godScore);
        }

        // Security score
        if (report.security) {
            const secScore = report.security.critical === 0 &&
                           report.security.high === 0 ? 100 : 0;
            scores.push(secScore);
        }

        // MECE score
        if (report.mece) {
            scores.push(report.mece.score * 100);
        }

        // Lean Six Sigma score
        if (report.leanSixSigma) {
            const sigmaLevel = report.leanSixSigma.sigmaLevel || 0;
            scores.push(Math.min(100, (sigmaLevel / 6) * 100));
        }

        return scores.length > 0 ?
            scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    }

    private calculateNasaCompliance(report: QualityAnalysisReport): number {
        if (!report.nasaCompliance) return 0;

        const totalRules = 10;
        const compliantRules = Object.values(report.nasaCompliance.rules)
            .filter(rule => rule.compliant).length;

        return (compliantRules / totalRules) * 100;
    }

    private calculateDefenseCompliance(report: QualityAnalysisReport): number {
        if (!report.defenseStandards) return 0;

        const factors = [
            report.defenseStandards.dfarsCompliant ? 100 : 0,
            report.defenseStandards.milstdCompliant ? 100 : 0,
            report.defenseStandards.cmmiLevel >= 3 ? 100 : 0,
            report.defenseStandards.do178cLevel === 'A' ? 100 : 0
        ];

        return factors.reduce((a, b) => a + b, 0) / factors.length;
    }

    private calculateEnterpriseCompliance(report: QualityAnalysisReport): number {
        if (!report.enterpriseStandards) return 0;

        const factors = [
            report.enterpriseStandards.codeSmells === 0 ? 100 : Math.max(0, 100 - report.enterpriseStandards.codeSmells * 10),
            report.enterpriseStandards.duplications === 0 ? 100 : Math.max(0, 100 - report.enterpriseStandards.duplications * 5),
            report.enterpriseStandards.complexity < 10 ? 100 : Math.max(0, 100 - (report.enterpriseStandards.complexity - 10) * 5),
            report.enterpriseStandards.maintainabilityIndex
        ];

        return factors.reduce((a, b) => a + b, 0) / factors.length;
    }

    private isPerfect(metrics: ValidationMetrics): boolean {
        // ALL metrics must be 100%
        const perfect =
            metrics.completeness === 100 &&
            metrics.functionality === 100 &&
            metrics.quality === 100 &&
            metrics.nasaCompliance === 100 &&
            metrics.defenseCompliance === 100 &&
            metrics.enterpriseCompliance === 100 &&
            metrics.performance.latency <= this.config.performanceBaseline.maxLatency &&
            metrics.performance.throughput >= this.config.performanceBaseline.minThroughput &&
            metrics.performance.memory <= this.config.performanceBaseline.maxMemory &&
            metrics.performance.cpu <= this.config.performanceBaseline.maxCPU;

        return perfect;
    }

    private logDeficiencies(metrics: ValidationMetrics, certification: any): void {
        console.log('[FinalQualityValidator] Deficiencies found:');

        if (metrics.completeness < 100) {
            console.log(`  - Completeness: ${metrics.completeness.toFixed(1)}% (MUST BE 100%)`);
        }
        if (metrics.functionality < 100) {
            console.log(`  - Functionality: ${metrics.functionality.toFixed(1)}% (MUST BE 100%)`);
        }
        if (metrics.quality < 100) {
            console.log(`  - Quality: ${metrics.quality.toFixed(1)}% (MUST BE 100%)`);
        }
        if (metrics.nasaCompliance < 100) {
            console.log(`  - NASA Compliance: ${metrics.nasaCompliance.toFixed(1)}% (MUST BE 100%)`);
        }
        if (metrics.defenseCompliance < 100) {
            console.log(`  - Defense Compliance: ${metrics.defenseCompliance.toFixed(1)}% (MUST BE 100%)`);
        }
        if (metrics.enterpriseCompliance < 100) {
            console.log(`  - Enterprise Compliance: ${metrics.enterpriseCompliance.toFixed(1)}% (MUST BE 100%)`);
        }

        // Performance deficiencies
        if (metrics.performance.latency > this.config.performanceBaseline.maxLatency) {
            console.log(`  - Latency: ${metrics.performance.latency}ms (MAX: ${this.config.performanceBaseline.maxLatency}ms)`);
        }
        if (metrics.performance.throughput < this.config.performanceBaseline.minThroughput) {
            console.log(`  - Throughput: ${metrics.performance.throughput} ops/sec (MIN: ${this.config.performanceBaseline.minThroughput})`);
        }
        if (metrics.performance.memory > this.config.performanceBaseline.maxMemory) {
            console.log(`  - Memory: ${metrics.performance.memory}MB (MAX: ${this.config.performanceBaseline.maxMemory}MB)`);
        }
        if (metrics.performance.cpu > this.config.performanceBaseline.maxCPU) {
            console.log(`  - CPU: ${metrics.performance.cpu}% (MAX: ${this.config.performanceBaseline.maxCPU}%)`);
        }
    }
}

export { FinalValidationResult, ValidationMetrics, FinalValidationConfig };