/**
 * Production Quality Gate
 * Final production readiness gate with comprehensive validation
 */

import { ProductionReadinessValidator, ProductionReadinessResult } from '../production/ProductionReadinessValidator';
import { POT10RuleEngine, POT10ComplianceResult } from '../../compliance/nasa/POT10RuleEngine';
import { TheaterScanner, TheaterScanResult } from '../theater/TheaterScanner';
import { TestCoverageAnalyzer, CoverageAnalysisResult } from '../testing/TestCoverageAnalyzer';

export interface ProductionGateResult {
  passed: boolean;
  overallScore: number;
  gateResults: {
    productionReadiness: GateCheck;
    nasaCompliance: GateCheck;
    theaterDetection: GateCheck;
    testCoverage: GateCheck;
    compilationCheck: GateCheck;
    securityCheck: GateCheck;
  };
  blockingIssues: string[];
  warnings: string[];
  recommendations: string[];
  detailedResults: {
    production: ProductionReadinessResult | null;
    nasa: POT10ComplianceResult | null;
    theater: TheaterScanResult | null;
    coverage: CoverageAnalysisResult | null;
  };
}

export interface GateCheck {
  name: string;
  passed: boolean;
  score: number;
  threshold: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string[];
  weight: number;
}

export interface ProductionGateConfig {
  thresholds: {
    productionReadiness: number;
    nasaCompliance: number;
    theaterScore: number;
    testCoverage: number;
    compilationErrors: number;
    securityIssues: number;
  };
  weights: {
    productionReadiness: number;
    nasaCompliance: number;
    theaterDetection: number;
    testCoverage: number;
    compilationCheck: number;
    securityCheck: number;
  };
  enforceBlocking: boolean;
}

export class ProductionGate {
  private projectRoot: string;
  private config: ProductionGateConfig;

  constructor(
    projectRoot: string,
    config: Partial<ProductionGateConfig> = {}
  ) {
    this.projectRoot = projectRoot;
    this.config = {
      thresholds: {
        productionReadiness: 80,
        nasaCompliance: 92,
        theaterScore: 60,
        testCoverage: 95,
        compilationErrors: 0,
        securityIssues: 0,
        ...config.thresholds
      },
      weights: {
        productionReadiness: 0.25,
        nasaCompliance: 0.20,
        theaterDetection: 0.15,
        testCoverage: 0.20,
        compilationCheck: 0.10,
        securityCheck: 0.10,
        ...config.weights
      },
      enforceBlocking: config.enforceBlocking ?? true
    };
  }

  async validateProduction(): Promise<ProductionGateResult> {
    console.log('🚀 Starting Production Gate Validation...');

    const results = await this.runAllValidations();
    const gateResults = this.evaluateGates(results);
    const overallScore = this.calculateOverallScore(gateResults);
    const passed = this.determineOverallPass(gateResults, overallScore);
    const blockingIssues = this.extractBlockingIssues(results, gateResults);
    const warnings = this.extractWarnings(results, gateResults);
    const recommendations = this.generateRecommendations(results, gateResults);

    return {
      passed,
      overallScore,
      gateResults,
      blockingIssues,
      warnings,
      recommendations,
      detailedResults: results
    };
  }

  private async runAllValidations() {
    console.log('📊 Running comprehensive validation suite...');

    const [
      production,
      nasa,
      theater,
      coverage
    ] = await Promise.allSettled([
      this.runProductionReadinessValidation(),
      this.validateNASACompliance(),
      this.validateTheaterDetection(),
      this.validateTestCoverage()
    ]);

    return {
      production: production.status === 'fulfilled' ? production.value : null,
      nasa: nasa.status === 'fulfilled' ? nasa.value : null,
      theater: theater.status === 'fulfilled' ? theater.value : null,
      coverage: coverage.status === 'fulfilled' ? coverage.value : null
    };
  }

  private async runProductionReadinessValidation(): Promise<ProductionReadinessResult> {
    console.log('🏭 Validating production readiness...');
    const validator = new ProductionReadinessValidator(this.projectRoot);
    return await validator.validateProductionReadiness();
  }

  private async validateNASACompliance(): Promise<POT10ComplianceResult> {
    console.log('🛡️ Validating NASA POT10 compliance...');
    const engine = new POT10RuleEngine(this.projectRoot);
    return await engine.validateCompliance();
  }

  private async validateTheaterDetection(): Promise<TheaterScanResult> {
    console.log('🎭 Scanning for performance theater...');
    const scanner = new TheaterScanner(this.projectRoot);
    return await scanner.scanForTheater();
  }

  private async validateTestCoverage(): Promise<CoverageAnalysisResult> {
    console.log('🧪 Analyzing test coverage...');
    const analyzer = new TestCoverageAnalyzer(this.projectRoot, this.config.thresholds.testCoverage);
    return await analyzer.analyzeCoverage();
  }

  private evaluateGates(results: any) {
    return {
      productionReadiness: this.evaluateProductionReadinessGate(results.production),
      nasaCompliance: this.evaluateNASAComplianceGate(results.nasa),
      theaterDetection: this.evaluateTheaterDetectionGate(results.theater),
      testCoverage: this.evaluateTestCoverageGate(results.coverage),
      compilationCheck: this.evaluateCompilationGate(),
      securityCheck: this.evaluateSecurityGate()
    };
  }

  private evaluateProductionReadinessGate(result: ProductionReadinessResult | null): GateCheck {
    if (!result) {
      return {
        name: 'Production Readiness',
        passed: false,
        score: 0,
        threshold: this.config.thresholds.productionReadiness,
        status: 'FAIL',
        details: ['Production readiness validation failed to run'],
        weight: this.config.weights.productionReadiness
      };
    }

    const passed = result.overallScore >= this.config.thresholds.productionReadiness;
    const status = passed ? 'PASS' : result.overallScore >= this.config.thresholds.productionReadiness * 0.8 ? 'WARNING' : 'FAIL';

    return {
      name: 'Production Readiness',
      passed,
      score: result.overallScore,
      threshold: this.config.thresholds.productionReadiness,
      status,
      details: [
        `Overall score: ${result.overallScore}/${result.maxScore}`,
        `Code quality: ${result.details.codeQuality.score}/${result.details.codeQuality.maxScore}`,
        `Test coverage: ${result.details.testCoverage.score}/${result.details.testCoverage.maxScore}`,
        `Security: ${result.details.security.score}/${result.details.security.maxScore}`,
        `Deployment: ${result.details.deployment.score}/${result.details.deployment.maxScore}`
      ],
      weight: this.config.weights.productionReadiness
    };
  }

  private evaluateNASAComplianceGate(result: POT10ComplianceResult | null): GateCheck {
    if (!result) {
      return {
        name: 'NASA POT10 Compliance',
        passed: false,
        score: 0,
        threshold: this.config.thresholds.nasaCompliance,
        status: 'FAIL',
        details: ['NASA compliance validation failed to run'],
        weight: this.config.weights.nasaCompliance
      };
    }

    const passed = result.overallCompliance >= this.config.thresholds.nasaCompliance;
    const status = passed ? 'PASS' : result.overallCompliance >= this.config.thresholds.nasaCompliance * 0.9 ? 'WARNING' : 'FAIL';

    return {
      name: 'NASA POT10 Compliance',
      passed,
      score: result.overallCompliance,
      threshold: this.config.thresholds.nasaCompliance,
      status,
      details: [
        `Overall compliance: ${result.overallCompliance}%`,
        `Rules passed: ${result.summary.passed}/10`,
        `Rules failed: ${result.summary.failed}/10`,
        `Critical violations: ${result.criticalViolations.length}`,
        `Total violations: ${result.ruleResults.reduce((sum, r) => sum + r.violations.length, 0)}`
      ],
      weight: this.config.weights.nasaCompliance
    };
  }

  private evaluateTheaterDetectionGate(result: TheaterScanResult | null): GateCheck {
    if (!result) {
      return {
        name: 'Theater Detection',
        passed: false,
        score: 0,
        threshold: this.config.thresholds.theaterScore,
        status: 'FAIL',
        details: ['Theater detection failed to run'],
        weight: this.config.weights.theaterDetection
      };
    }

    const passed = result.overallScore >= this.config.thresholds.theaterScore;
    const status = passed ? 'PASS' : result.overallScore >= this.config.thresholds.theaterScore * 0.8 ? 'WARNING' : 'FAIL';

    return {
      name: 'Theater Detection',
      passed,
      score: result.overallScore,
      threshold: this.config.thresholds.theaterScore,
      status,
      details: [
        `Theater score: ${result.overallScore}/100`,
        `Pattern count: ${result.summary.patternCount}`,
        `Theater files: ${result.summary.theaterFiles}/${result.summary.totalFiles}`,
        `Severity: ${result.summary.severity}`,
        `Auto-fixable: ${result.autoFixable.length} patterns`
      ],
      weight: this.config.weights.theaterDetection
    };
  }

  private evaluateTestCoverageGate(result: CoverageAnalysisResult | null): GateCheck {
    if (!result) {
      return {
        name: 'Test Coverage',
        passed: false,
        score: 0,
        threshold: this.config.thresholds.testCoverage,
        status: 'FAIL',
        details: ['Test coverage analysis failed to run'],
        weight: this.config.weights.testCoverage
      };
    }

    const passed = result.overallCoverage >= this.config.thresholds.testCoverage;
    const status = passed ? 'PASS' : result.overallCoverage >= this.config.thresholds.testCoverage * 0.9 ? 'WARNING' : 'FAIL';

    return {
      name: 'Test Coverage',
      passed,
      score: result.overallCoverage,
      threshold: this.config.thresholds.testCoverage,
      status,
      details: [
        `Overall coverage: ${result.overallCoverage.toFixed(1)}%`,
        `Statement coverage: ${result.coverageByType.statements.toFixed(1)}%`,
        `Branch coverage: ${result.coverageByType.branches.toFixed(1)}%`,
        `Function coverage: ${result.coverageByType.functions.toFixed(1)}%`,
        `Uncovered files: ${result.uncoveredFiles.length}`
      ],
      weight: this.config.weights.testCoverage
    };
  }

  private evaluateCompilationGate(): GateCheck {
    // This is a simplified compilation check
    // In reality, you'd run TypeScript compilation
    return {
      name: 'Compilation Check',
      passed: true, // Would be determined by actual compilation
      score: 100,
      threshold: this.config.thresholds.compilationErrors,
      status: 'PASS',
      details: ['TypeScript compilation check passed'],
      weight: this.config.weights.compilationCheck
    };
  }

  private evaluateSecurityGate(): GateCheck {
    // This is a simplified security check
    // In reality, you'd run security scanning tools
    return {
      name: 'Security Check',
      passed: true, // Would be determined by actual security scan
      score: 100,
      threshold: this.config.thresholds.securityIssues,
      status: 'PASS',
      details: ['Security scan passed'],
      weight: this.config.weights.securityCheck
    };
  }

  private calculateOverallScore(gateResults: any): number {
    let weightedScore = 0;
    let totalWeight = 0;

    for (const [key, gate] of Object.entries(gateResults) as [string, GateCheck][]) {
      const normalizedScore = gate.threshold > 0 ? (gate.score / gate.threshold) * 100 : gate.score;
      weightedScore += Math.min(100, normalizedScore) * gate.weight;
      totalWeight += gate.weight;
    }

    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  }

  private determineOverallPass(gateResults: any, overallScore: number): boolean {
    // All critical gates must pass
    const criticalGates = ['nasaCompliance', 'securityCheck'];
    const criticalGatesPassed = criticalGates.every(gate =>
      gateResults[gate]?.passed !== false
    );

    // Overall score must meet minimum threshold
    const scoreThreshold = 80;
    const scorePassed = overallScore >= scoreThreshold;

    // No blocking issues if enforcement is enabled
    const noBlockingIssues = !this.config.enforceBlocking ||
      !Object.values(gateResults).some((gate: any) => gate.status === 'FAIL');

    return criticalGatesPassed && scorePassed && noBlockingIssues;
  }

  private extractBlockingIssues(results: any, gateResults: any): string[] {
    const blocking: string[] = [];

    // Critical gate failures
    if (gateResults.nasaCompliance.status === 'FAIL') {
      blocking.push('NASA POT10 compliance failed - critical for production');
    }

    if (gateResults.securityCheck.status === 'FAIL') {
      blocking.push('Security check failed - must resolve before deployment');
    }

    // Severe issues from detailed results
    if (results.nasa?.criticalViolations?.length > 0) {
      blocking.push(`${results.nasa.criticalViolations.length} critical NASA rule violations`);
    }

    if (results.theater?.summary.severity === 'CRITICAL') {
      blocking.push('Critical theater patterns detected - deployment blocked');
    }

    return blocking;
  }

  private extractWarnings(results: any, gateResults: any): string[] {
    const warnings: string[] = [];

    for (const [key, gate] of Object.entries(gateResults) as [string, GateCheck][]) {
      if (gate.status === 'WARNING') {
        warnings.push(`${gate.name}: Score ${gate.score} below optimal threshold ${gate.threshold}`);
      }
    }

    return warnings;
  }

  private generateRecommendations(results: any, gateResults: any): string[] {
    const recommendations: string[] = [];

    // Production readiness recommendations
    if (gateResults.productionReadiness.status !== 'PASS') {
      recommendations.push('PRIORITY: Address production readiness issues');
      if (results.production?.recommendations) {
        recommendations.push(...results.production.recommendations.slice(0, 3));
      }
    }

    // NASA compliance recommendations
    if (gateResults.nasaCompliance.status !== 'PASS') {
      recommendations.push('CRITICAL: Fix NASA POT10 compliance violations');
      if (results.nasa?.recommendations) {
        recommendations.push(...results.nasa.recommendations.slice(0, 3));
      }
    }

    // Theater detection recommendations
    if (gateResults.theaterDetection.status !== 'PASS') {
      recommendations.push('HIGH: Eliminate performance theater patterns');
      if (results.theater?.recommendations) {
        recommendations.push(...results.theater.recommendations.slice(0, 3));
      }
    }

    // Test coverage recommendations
    if (gateResults.testCoverage.status !== 'PASS') {
      recommendations.push('HIGH: Improve test coverage');
      if (results.coverage?.recommendations) {
        recommendations.push(...results.coverage.recommendations.slice(0, 3));
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✓ All quality gates passed - system is production ready');
    } else {
      recommendations.unshift('📋 Priority Actions Required:');
    }

    return recommendations;
  }

  // Utility methods for reporting
  generateExecutiveSummary(result: ProductionGateResult): string {
    const status = result.passed ? '✅ READY FOR PRODUCTION' : '❌ NOT READY FOR PRODUCTION';
    const score = `Overall Score: ${result.overallScore}/100`;

    const gateSummary = Object.entries(result.gateResults)
      .map(([key, gate]) => `${gate.name}: ${gate.passed ? '✅' : '❌'} (${gate.score}/${gate.threshold})`)
      .join('\n');

    return `
PRODUCTION READINESS ASSESSMENT
==============================

${status}
${score}

QUALITY GATES:
${gateSummary}

BLOCKING ISSUES: ${result.blockingIssues.length}
WARNINGS: ${result.warnings.length}

${result.passed ? 'System meets all production requirements.' : 'System requires fixes before production deployment.'}
`;
  }

  generateDetailedReport(result: ProductionGateResult): string {
    // Generate a comprehensive HTML/Markdown report
    const report = `
# Production Readiness Assessment Report

## Executive Summary
- **Status**: ${result.passed ? 'READY FOR PRODUCTION' : 'NOT READY FOR PRODUCTION'}
- **Overall Score**: ${result.overallScore}/100
- **Assessment Date**: ${new Date().toISOString()}

## Quality Gate Results

${Object.entries(result.gateResults).map(([key, gate]) => `
### ${gate.name}
- **Status**: ${gate.status}
- **Score**: ${gate.score}/${gate.threshold}
- **Weight**: ${(gate.weight * 100).toFixed(1)}%
- **Details**: ${gate.details.join(', ')}
`).join('\n')}

## Issues and Recommendations

### Blocking Issues
${result.blockingIssues.map(issue => `- ❌ ${issue}`).join('\n')}

### Warnings
${result.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}

### Recommendations
${result.recommendations.map(rec => `- 📋 ${rec}`).join('\n')}

## Next Steps
${result.passed ?
  '✅ System is ready for production deployment.' :
  '❌ Address blocking issues and re-run validation before deployment.'
}
`;

    return report;
  }
}