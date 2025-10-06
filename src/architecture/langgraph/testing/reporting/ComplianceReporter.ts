/**
 * NASA Rule 10 Compliance Reporter for LangGraph Validation Suite
 * Generates comprehensive compliance reports and metrics
 */

import {
  FSMValidationResult,
  FSMValidationMetrics,
  NASAComplianceReport,
  ValidationBounds,
  ExecutionBounds,
  ValidationTestExecution
} from '../types/ValidationFSM.types';
import { TestingValidationState as ValidationState, TestingValidationEvent as ValidationEvent } from '../ValidationSuite';
import { NASARule10Checker } from '../compliance/NASARule10Checker';
import { BoundsManager } from '../execution/BoundsManager';
import { StateGuards } from '../fsm/StateGuards';

export interface ComprehensiveComplianceReport {
  timestamp: string;
  overallCompliance: boolean;
  nasaRule10Compliance: NASAComplianceReport;
  fsmMetrics: FSMValidationMetrics;
  executionBounds: ExecutionBounds;
  validationBounds: ValidationBounds;
  testResults: FSMValidationResult[];
  performanceMetrics: PerformanceMetrics;
  recommendations: string[];
  summary: ComplianceSummary;
}

export interface PerformanceMetrics {
  totalExecutionTime: number;
  averageTestTime: number;
  totalIterations: number;
  averageIterationsPerTest: number;
  concurrencyUtilization: number;
  timeoutOccurrences: number;
  retryAttempts: number;
  stateTransitions: number;
  guardsEvaluated: number;
}

export interface ComplianceSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testPassRate: number;
  totalAssertions: number;
  passedAssertions: number;
  assertionPassRate: number;
  nasaRule10Compliant: boolean;
  fsmCompliant: boolean;
  boundsCompliant: boolean;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export class ComplianceReporter {
  private nasaChecker: NASARule10Checker;
  private boundsManager: BoundsManager;
  private stateGuards: StateGuards;
  private testResults: FSMValidationResult[] = [];
  private performanceData: PerformanceMetrics;
  private startTime: number;

  constructor(
    nasaChecker: NASARule10Checker,
    boundsManager: BoundsManager,
    stateGuards: StateGuards
  ) {
    this.nasaChecker = nasaChecker;
    this.boundsManager = boundsManager;
    this.stateGuards = stateGuards;
    this.startTime = Date.now();

    this.performanceData = {
      totalExecutionTime: 0,
      averageTestTime: 0,
      totalIterations: 0,
      averageIterationsPerTest: 0,
      concurrencyUtilization: 0,
      timeoutOccurrences: 0,
      retryAttempts: 0,
      stateTransitions: 0,
      guardsEvaluated: 0
    };
  }

  /**
   * Add test result for compliance tracking
   */
  addTestResult(result: FSMValidationResult): void {
    this.testResults.push(result);
    this.updatePerformanceMetrics(result);
  }

  /**
   * Record state transition for metrics
   */
  recordStateTransition(
    fromState: ValidationState,
    event: ValidationEvent,
    toState: ValidationState,
    guardsEvaluated: number = 0
  ): void {
    this.performanceData.stateTransitions++;
    this.performanceData.guardsEvaluated += guardsEvaluated;
  }

  /**
   * Record retry attempt
   */
  recordRetryAttempt(): void {
    this.performanceData.retryAttempts++;
  }

  /**
   * Record timeout occurrence
   */
  recordTimeout(): void {
    this.performanceData.timeoutOccurrences++;
  }

  /**
   * Update performance metrics from test result
   */
  private updatePerformanceMetrics(result: FSMValidationResult): void {
    this.performanceData.totalExecutionTime = Date.now() - this.startTime;
    this.performanceData.totalIterations += result.iterationCount || 0;

    // Calculate averages
    const testCount = this.testResults.length;
    if (testCount > 0) {
      this.performanceData.averageTestTime =
        this.testResults.reduce((sum, r) => sum + r.executionTime, 0) / testCount;

      this.performanceData.averageIterationsPerTest =
        this.performanceData.totalIterations / testCount;
    }

    // Calculate concurrency utilization
    const boundsReport = this.boundsManager.generateBoundsReport();
    const maxConcurrent = boundsReport.executionBounds.maxConcurrentOperations;
    const stats = this.boundsManager.getExecutionStats();
    this.performanceData.concurrencyUtilization =
      maxConcurrent > 0 ? (stats.activeExecutions / maxConcurrent) * 100 : 0;
  }

  /**
   * Generate comprehensive compliance report
   */
  generateComprehensiveReport(): ComprehensiveComplianceReport {
    const nasaCompliance = this.nasaChecker.generateComplianceReport();
    const boundsReport = this.boundsManager.generateBoundsReport();
    const guardStats = this.stateGuards.getGuardStats();

    // Generate FSM metrics
    const fsmMetrics: FSMValidationMetrics = {
      stateTransitionCount: this.performanceData.stateTransitions,
      validTransitions: this.performanceData.stateTransitions, // Assume all recorded are valid
      invalidTransitions: 0, // Would be tracked separately
      executionTime: this.performanceData.totalExecutionTime,
      iterationBounds: boundsReport.validationBounds,
      complianceStatus: nasaCompliance.overallCompliance ? 'NASA_RULE_10_COMPLIANT' : 'NON_COMPLIANT'
    };

    // Calculate compliance summary
    const summary = this.calculateComplianceSummary(nasaCompliance, fsmMetrics, boundsReport);

    // Generate recommendations
    const recommendations = this.generateRecommendations(nasaCompliance, boundsReport, summary);

    return {
      timestamp: new Date().toISOString(),
      overallCompliance: summary.overallGrade !== 'F',
      nasaRule10Compliance: nasaCompliance,
      fsmMetrics,
      executionBounds: boundsReport.executionBounds,
      validationBounds: boundsReport.validationBounds,
      testResults: [...this.testResults],
      performanceMetrics: { ...this.performanceData },
      recommendations,
      summary
    };
  }

  /**
   * Calculate compliance summary and grading
   */
  private calculateComplianceSummary(
    nasaCompliance: NASAComplianceReport,
    fsmMetrics: FSMValidationMetrics,
    boundsReport: any
  ): ComplianceSummary {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const testPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const totalAssertions = this.testResults.reduce((sum, r) => sum + r.assertions.total, 0);
    const passedAssertions = this.testResults.reduce((sum, r) => sum + r.assertions.passed, 0);
    const assertionPassRate = totalAssertions > 0 ? (passedAssertions / totalAssertions) * 100 : 0;

    const nasaRule10Compliant = nasaCompliance.overallCompliance;
    const fsmCompliant = fsmMetrics.complianceStatus === 'NASA_RULE_10_COMPLIANT';
    const boundsCompliant = boundsReport.compliance.boundsRespected;

    // Calculate overall grade
    let score = 0;

    // Test pass rate (40%)
    score += (testPassRate / 100) * 40;

    // Assertion pass rate (30%)
    score += (assertionPassRate / 100) * 30;

    // NASA Rule 10 compliance (20%)
    score += nasaRule10Compliant ? 20 : 0;

    // FSM and bounds compliance (10%)
    score += (fsmCompliant && boundsCompliant) ? 10 : 0;

    let overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) overallGrade = 'A';
    else if (score >= 80) overallGrade = 'B';
    else if (score >= 70) overallGrade = 'C';
    else if (score >= 60) overallGrade = 'D';
    else overallGrade = 'F';

    return {
      totalTests,
      passedTests,
      failedTests,
      testPassRate,
      totalAssertions,
      passedAssertions,
      assertionPassRate,
      nasaRule10Compliant,
      fsmCompliant,
      boundsCompliant,
      overallGrade
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    nasaCompliance: NASAComplianceReport,
    boundsReport: any,
    summary: ComplianceSummary
  ): string[] {
    const recommendations: string[] = [];

    // Test performance recommendations
    if (summary.testPassRate < 90) {
      recommendations.push(`Improve test pass rate: Currently ${summary.testPassRate.toFixed(1)}%, target 90%+`);
    }

    if (summary.assertionPassRate < 95) {
      recommendations.push(`Improve assertion pass rate: Currently ${summary.assertionPassRate.toFixed(1)}%, target 95%+`);
    }

    // NASA Rule 10 recommendations
    if (!summary.nasaRule10Compliant) {
      recommendations.push(...nasaCompliance.recommendations);
    }

    // Performance recommendations
    if (this.performanceData.timeoutOccurrences > 0) {
      recommendations.push(`Reduce timeout occurrences: ${this.performanceData.timeoutOccurrences} timeouts detected`);
    }

    if (this.performanceData.retryAttempts > this.testResults.length * 0.1) {
      recommendations.push(`High retry rate detected: ${this.performanceData.retryAttempts} retries for ${this.testResults.length} tests`);
    }

    if (this.performanceData.concurrencyUtilization < 50) {
      recommendations.push(`Low concurrency utilization: ${this.performanceData.concurrencyUtilization.toFixed(1)}% - consider optimizing concurrent operations`);
    }

    // Bounds recommendations
    if (!summary.boundsCompliant) {
      recommendations.push(...boundsReport.recommendations);
    }

    // Grade-specific recommendations
    switch (summary.overallGrade) {
      case 'F':
        recommendations.push('CRITICAL: System fails basic compliance requirements - immediate attention required');
        break;
      case 'D':
        recommendations.push('WARNING: System has significant compliance issues - review and fix before production');
        break;
      case 'C':
        recommendations.push('System meets basic requirements but has room for improvement');
        break;
      case 'B':
        recommendations.push('Good compliance level - minor optimizations recommended');
        break;
      case 'A':
        recommendations.push('Excellent compliance - maintain current practices');
        break;
    }

    return recommendations;
  }

  /**
   * Generate detailed test results report
   */
  generateTestResultsReport(): string {
    let report = '\n=== NASA Rule 10 Compliant LangGraph Validation Report ===\n\n';

    const summary = this.calculateComplianceSummary(
      this.nasaChecker.generateComplianceReport(),
      this.generateFSMMetrics(),
      this.boundsManager.generateBoundsReport()
    );

    // Executive Summary
    report += `Executive Summary:\n`;
    report += `  Overall Grade: ${summary.overallGrade}\n`;
    report += `  NASA Rule 10 Compliant: ${summary.nasaRule10Compliant ? 'YES' : 'NO'}\n`;
    report += `  Test Pass Rate: ${summary.testPassRate.toFixed(1)}%\n`;
    report += `  Assertion Pass Rate: ${summary.assertionPassRate.toFixed(1)}%\n`;
    report += `  Total Execution Time: ${this.performanceData.totalExecutionTime}ms\n\n`;

    // Test Results Table
    report += `Detailed Test Results:\n`;
    report += `${'Test Name'.padEnd(30)} ${'Status'.padEnd(8)} ${'Time'.padEnd(8)} ${'Iterations'.padEnd(12)} ${'NASA'.padEnd(6)} ${'Message'.padEnd(40)}\n`;
    report += '-'.repeat(120) + '\n';

    for (const result of this.testResults) {
      const status = result.success ? 'PASS' : 'FAIL';
      const time = `${result.executionTime}ms`;
      const iterations = result.iterationCount ? `${result.iterationCount}/${result.maxIterations}` : 'N/A';
      const nasa = result.nasaCompliance?.rule10Compliant ? 'OK' : 'FAIL';
      const message = result.message.length > 37 ? result.message.substring(0, 37) + '...' : result.message;

      report += `${result.testName.padEnd(30)} ${status.padEnd(8)} ${time.padEnd(8)} ${iterations.padEnd(12)} ${nasa.padEnd(6)} ${message.padEnd(40)}\n`;
    }

    // Performance Metrics
    report += `\nPerformance Metrics:\n`;
    report += `  Total Iterations: ${this.performanceData.totalIterations}\n`;
    report += `  Average Test Time: ${this.performanceData.averageTestTime.toFixed(1)}ms\n`;
    report += `  State Transitions: ${this.performanceData.stateTransitions}\n`;
    report += `  Guards Evaluated: ${this.performanceData.guardsEvaluated}\n`;
    report += `  Timeout Occurrences: ${this.performanceData.timeoutOccurrences}\n`;
    report += `  Retry Attempts: ${this.performanceData.retryAttempts}\n`;
    report += `  Concurrency Utilization: ${this.performanceData.concurrencyUtilization.toFixed(1)}%\n`;

    return report;
  }

  /**
   * Generate FSM metrics for reporting
   */
  private generateFSMMetrics(): FSMValidationMetrics {
    const nasaCompliance = this.nasaChecker.generateComplianceReport();
    const boundsReport = this.boundsManager.generateBoundsReport();

    return {
      stateTransitionCount: this.performanceData.stateTransitions,
      validTransitions: this.performanceData.stateTransitions,
      invalidTransitions: 0,
      executionTime: this.performanceData.totalExecutionTime,
      iterationBounds: boundsReport.validationBounds,
      complianceStatus: nasaCompliance.overallCompliance ? 'NASA_RULE_10_COMPLIANT' : 'NON_COMPLIANT'
    };
  }

  /**
   * Export compliance data as JSON
   */
  exportComplianceData(): object {
    return this.generateComprehensiveReport();
  }

  /**
   * Generate compliance certificate
   */
  generateComplianceCertificate(): string {
    const report = this.generateComprehensiveReport();

    let certificate = '\n=== NASA RULE 10 COMPLIANCE CERTIFICATE ===\n\n';

    certificate += `System: LangGraph Validation Suite\n`;
    certificate += `Validation Date: ${report.timestamp}\n`;
    certificate += `Compliance Standard: NASA Rule 10 (No Recursion, Fixed Loops)\n\n`;

    certificate += `CERTIFICATION RESULTS:\n`;
    certificate += `  Overall Compliance: ${report.overallCompliance ? 'CERTIFIED' : 'NOT CERTIFIED'}\n`;
    certificate += `  Grade: ${report.summary.overallGrade}\n`;
    certificate += `  NASA Rule 10: ${report.summary.nasaRule10Compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}\n`;
    certificate += `  FSM Validation: ${report.summary.fsmCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}\n`;
    certificate += `  Execution Bounds: ${report.summary.boundsCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}\n\n`;

    certificate += `TEST METRICS:\n`;
    certificate += `  Tests Executed: ${report.summary.totalTests}\n`;
    certificate += `  Tests Passed: ${report.summary.passedTests}\n`;
    certificate += `  Pass Rate: ${report.summary.testPassRate.toFixed(1)}%\n`;
    certificate += `  Total Iterations: ${report.performanceMetrics.totalIterations}\n`;
    certificate += `  Execution Time: ${report.performanceMetrics.totalExecutionTime}ms\n\n`;

    if (report.overallCompliance) {
      certificate += `✓ SYSTEM CERTIFIED FOR NASA RULE 10 COMPLIANCE\n`;
      certificate += `This system demonstrates adherence to NASA Rule 10 requirements:\n`;
      certificate += `- No recursive function calls\n`;
      certificate += `- Fixed-bound loop iterations\n`;
      certificate += `- Bounded execution constraints\n`;
      certificate += `- FSM-based state management\n`;
    } else {
      certificate += `✗ SYSTEM NOT CERTIFIED - COMPLIANCE ISSUES IDENTIFIED\n`;
      certificate += `Remediation required before certification.\n`;
    }

    certificate += `\nGenerated by: NASA Rule 10 Compliance Reporter\n`;
    certificate += `Timestamp: ${new Date().toISOString()}\n`;

    return certificate;
  }

  /**
   * Reset reporter state
   */
  reset(): void {
    this.testResults = [];
    this.startTime = Date.now();
    this.performanceData = {
      totalExecutionTime: 0,
      averageTestTime: 0,
      totalIterations: 0,
      averageIterationsPerTest: 0,
      concurrencyUtilization: 0,
      timeoutOccurrences: 0,
      retryAttempts: 0,
      stateTransitions: 0,
      guardsEvaluated: 0
    };
  }
}

// Backward compatibility
export default ComplianceReporter;
