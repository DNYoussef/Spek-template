/**
 * Phase 4 Week 10: Comprehensive Type Safety Test Suite
 * Master test orchestrator for validating 'any' type elimination
 * and ensuring enterprise-grade type safety compliance.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';

// Import test modules
import { TypeGuardTestSuite } from './guards/TypeGuardTestSuite';
import { CompilationTestSuite } from './compilation/CompilationTestSuite';
import { Phase3IntegrationTestSuite } from './integration/Phase3IntegrationTestSuite';
import { RuntimeValidationTestSuite } from './runtime/RuntimeValidationTestSuite';
import { PerformanceImpactTestSuite } from './performance/PerformanceImpactTestSuite';
import { ComplianceValidationTestSuite } from './compliance/ComplianceValidationTestSuite';

export interface TypeSafetyTestResult {
  testCategory: string;
  passed: boolean;
  score: number;
  details: TypeSafetyTestDetails;
  metrics: TypeSafetyMetrics;
}

export interface TypeSafetyTestDetails {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface TypeSafetyMetrics {
  typeCoverage: number;
  anyTypeCount: number;
  anyTypeReduction: number;
  compilationTime: number;
  performanceImpact: number;
  complianceScore: number;
}

export interface TypeSafetyTestConfig {
  strictMode: boolean;
  targetCoverage: number;
  maxAnyTypes: number;
  performanceThreshold: number;
  complianceThreshold: number;
  phase3Validation: boolean;
}

export class TypeSafetyTestSuite {
  private config: TypeSafetyTestConfig;
  private results: TypeSafetyTestResult[] = [];
  private startTime: number = 0;
  private baselineMetrics?: TypeSafetyMetrics;

  constructor(config: Partial<TypeSafetyTestConfig> = {}) {
    this.config = {
      strictMode: true,
      targetCoverage: 85,
      maxAnyTypes: 0,
      performanceThreshold: 5.0, // 5% max performance impact
      complianceThreshold: 92.0, // NASA POT10 compliance
      phase3Validation: true,
      ...config
    };
  }

  /**
   * Execute comprehensive type safety validation
   */
  async runComprehensiveValidation(): Promise<TypeSafetyTestResult[]> {
    console.log('🚀 Starting Phase 4 Week 10 Type Safety Validation');
    console.log(`📊 Configuration: ${JSON.stringify(this.config, null, 2)}`);

    this.startTime = performance.now();

    try {
      // Establish baseline metrics
      await this.establishBaseline();

      // Run all test suites in sequence for stability
      await this.runTypeGuardTests();
      await this.runCompilationTests();
      await this.runPhase3IntegrationTests();
      await this.runRuntimeValidationTests();
      await this.runPerformanceImpactTests();
      await this.runComplianceValidationTests();

      // Generate comprehensive report
      const report = this.generateComprehensiveReport();
      console.log('✅ Type Safety Validation Complete');

      return this.results;
    } catch (error) {
      console.error('❌ Type Safety Validation Failed:', error);
      throw error;
    }
  }

  /**
   * Establish baseline metrics for comparison
   */
  private async establishBaseline(): Promise<void> {
    console.log('📏 Establishing baseline metrics...');

    const anyTypeCount = await this.countAnyTypes();
    const compilationTime = await this.measureCompilationTime();
    const typeCoverage = await this.measureTypeCoverage();

    this.baselineMetrics = {
      typeCoverage,
      anyTypeCount,
      anyTypeReduction: 0,
      compilationTime,
      performanceImpact: 0,
      complianceScore: 0
    };

    console.log(`📊 Baseline established: ${anyTypeCount} 'any' types, ${typeCoverage}% coverage`);
  }

  /**
   * Run type guard validation tests
   */
  private async runTypeGuardTests(): Promise<void> {
    console.log('🛡️ Running Type Guard Tests...');

    const testSuite = new TypeGuardTestSuite();
    const result = await testSuite.runAllTests();

    this.results.push({
      testCategory: 'Type Guards',
      passed: result.passed,
      score: result.score,
      details: result.details,
      metrics: result.metrics
    });
  }

  /**
   * Run compilation validation tests
   */
  private async runCompilationTests(): Promise<void> {
    console.log('⚙️ Running Compilation Tests...');

    const testSuite = new CompilationTestSuite();
    const result = await testSuite.runAllTests();

    this.results.push({
      testCategory: 'Compilation',
      passed: result.passed,
      score: result.score,
      details: result.details,
      metrics: result.metrics
    });
  }

  /**
   * Run Phase 3 component integration tests
   */
  private async runPhase3IntegrationTests(): Promise<void> {
    if (!this.config.phase3Validation) {
      console.log('⏭️ Skipping Phase 3 Integration Tests...');
      return;
    }

    console.log('🔗 Running Phase 3 Integration Tests...');

    const testSuite = new Phase3IntegrationTestSuite();
    const result = await testSuite.runAllTests();

    this.results.push({
      testCategory: 'Phase 3 Integration',
      passed: result.passed,
      score: result.score,
      details: result.details,
      metrics: result.metrics
    });
  }

  /**
   * Run runtime type validation tests
   */
  private async runRuntimeValidationTests(): Promise<void> {
    console.log('🔄 Running Runtime Validation Tests...');

    const testSuite = new RuntimeValidationTestSuite();
    const result = await testSuite.runAllTests();

    this.results.push({
      testCategory: 'Runtime Validation',
      passed: result.passed,
      score: result.score,
      details: result.details,
      metrics: result.metrics
    });
  }

  /**
   * Run performance impact assessment tests
   */
  private async runPerformanceImpactTests(): Promise<void> {
    console.log('📈 Running Performance Impact Tests...');

    const testSuite = new PerformanceImpactTestSuite(this.baselineMetrics!);
    const result = await testSuite.runAllTests();

    this.results.push({
      testCategory: 'Performance Impact',
      passed: result.passed,
      score: result.score,
      details: result.details,
      metrics: result.metrics
    });
  }

  /**
   * Run enterprise compliance validation tests
   */
  private async runComplianceValidationTests(): Promise<void> {
    console.log('🏛️ Running Compliance Validation Tests...');

    const testSuite = new ComplianceValidationTestSuite();
    const result = await testSuite.runAllTests();

    this.results.push({
      testCategory: 'Enterprise Compliance',
      passed: result.passed,
      score: result.score,
      details: result.details,
      metrics: result.metrics
    });
  }

  /**
   * Count 'any' types in codebase
   */
  private async countAnyTypes(): Promise<number> {
    try {
      const result = execSync(
        'grep -r "\\bany\\b" src/ --include="*.ts" --include="*.tsx" | wc -l',
        { encoding: 'utf8', cwd: process.cwd() }
      );
      return parseInt(result.trim()) || 0;
    } catch (error) {
      console.warn('Warning: Could not count any types:', error);
      return 0;
    }
  }

  /**
   * Measure TypeScript compilation time
   */
  private async measureCompilationTime(): Promise<number> {
    const start = performance.now();

    try {
      execSync('npx tsc --noEmit --project tsconfig.strict.json', {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 30000
      });

      const end = performance.now();
      return end - start;
    } catch (error) {
      console.warn('Warning: Compilation failed during timing:', error);
      return 0;
    }
  }

  /**
   * Measure type coverage
   */
  private async measureTypeCoverage(): Promise<number> {
    try {
      // Use typescript-coverage-report if available
      const result = execSync(
        'npx typescript-coverage-report --threshold 0',
        { encoding: 'utf8', cwd: process.cwd() }
      );

      const match = result.match(/(\d+\.?\d*)%/);
      return match ? parseFloat(match[1]) : 0;
    } catch (error) {
      console.warn('Warning: Could not measure type coverage:', error);
      return 0;
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateComprehensiveReport(): string {
    const duration = performance.now() - this.startTime;
    const overallPassed = this.results.every(r => r.passed);
    const averageScore = this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length;

    const report = `
# Phase 4 Week 10: Type Safety Validation Report

## Executive Summary
- **Overall Status**: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}
- **Average Score**: ${averageScore.toFixed(2)}%
- **Duration**: ${(duration / 1000).toFixed(2)}s
- **Test Categories**: ${this.results.length}

## Test Results Summary
${this.results.map(result => `
### ${result.testCategory}
- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}
- **Score**: ${result.score.toFixed(2)}%
- **Tests**: ${result.details.passedTests}/${result.details.totalTests} passed
- **Critical Issues**: ${result.details.criticalIssues.length}
`).join('')}

## Metrics Summary
${this.results.map(result => `
### ${result.testCategory} Metrics
- **Type Coverage**: ${result.metrics.typeCoverage.toFixed(2)}%
- **Any Types**: ${result.metrics.anyTypeCount}
- **Compilation Time**: ${result.metrics.compilationTime.toFixed(2)}ms
- **Performance Impact**: ${result.metrics.performanceImpact.toFixed(2)}%
- **Compliance Score**: ${result.metrics.complianceScore.toFixed(2)}%
`).join('')}

## Recommendations
${this.results.flatMap(r => r.details.recommendations).map(rec => `- ${rec}`).join('\n')}

---
Generated: ${new Date().toISOString()}
Phase: 4 Week 10
Agent: tester
`;

    console.log(report);
    return report;
  }

  /**
   * Get validation summary for external reporting
   */
  getValidationSummary(): {
    passed: boolean;
    score: number;
    criticalIssues: number;
    anyTypesEliminated: number;
    complianceScore: number;
  } {
    const overallPassed = this.results.every(r => r.passed);
    const averageScore = this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length;
    const criticalIssues = this.results.reduce((sum, r) => sum + r.details.criticalIssues.length, 0);
    const finalAnyTypes = this.results[0]?.metrics.anyTypeCount || 0;
    const anyTypesEliminated = (this.baselineMetrics?.anyTypeCount || 0) - finalAnyTypes;
    const complianceScore = this.results.find(r => r.testCategory === 'Enterprise Compliance')?.metrics.complianceScore || 0;

    return {
      passed: overallPassed,
      score: averageScore,
      criticalIssues,
      anyTypesEliminated,
      complianceScore
    };
  }
}

// Export for use in other test files
export default TypeSafetyTestSuite;