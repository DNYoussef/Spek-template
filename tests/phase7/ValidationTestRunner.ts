/**
 * Phase 7 Validation Test Runner
 * Orchestrates all validation suites for comprehensive Phase 7 testing:
 * - Infrastructure Princess Validation
 * - Research Princess Validation
 * - Memory Coordinator Validation
 * - LangGraph Integration Validation
 * - Documentation System Validation
 * - End-to-End Integration Validation
 * - Performance Benchmark Suite
 * - Security Validation Suite
 * - Continuous Monitoring Framework
 */

import InfrastructurePrincessValidator from './InfrastructurePrincessValidator';
import ResearchPrincessValidator from './ResearchPrincessValidator';
import MemoryCoordinatorValidator from './MemoryCoordinatorValidator';
import LangGraphValidator from './LangGraphValidator';
import DocumentationValidator from './DocumentationValidator';
import IntegrationValidator from './IntegrationValidator';
import PerformanceBenchmarkSuite from './PerformanceBenchmarkSuite';
import SecurityValidator from './SecurityValidator';
import ContinuousMonitoringFramework from './ContinuousMonitoringFramework';

interface ValidationResult {
  suite: string;
  passed: boolean;
  score: number;
  duration: number;
  details: any;
  metrics?: any;
}

interface ValidationSummary {
  overallScore: number;
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  totalDuration: number;
  results: ValidationResult[];
  productionReady: boolean;
  recommendations: string[];
}

export class ValidationTestRunner {
  private results: ValidationResult[] = [];
  private startTime: number = 0;

  /**
   * Run all Phase 7 validation suites
   */
  async runAllValidations(): Promise<ValidationSummary> {
    console.log('🚀 Starting Phase 7 Comprehensive Validation Suite');
    console.log('================================================================');

    this.startTime = Date.now();
    this.results = [];

    // Run all validation suites
    await this.runInfrastructureValidation();
    await this.runResearchValidation();
    await this.runMemoryCoordinatorValidation();
    await this.runLangGraphValidation();
    await this.runDocumentationValidation();
    await this.runIntegrationValidation();
    await this.runPerformanceBenchmarks();
    await this.runSecurityValidation();
    await this.runMonitoringFrameworkValidation();

    // Generate final summary
    const summary = this.generateValidationSummary();
    this.logValidationSummary(summary);

    return summary;
  }

  /**
   * Run Infrastructure Princess Validation
   */
  private async runInfrastructureValidation(): Promise<void> {
    console.log('\n📊 Running Infrastructure Princess Validation...');
    const startTime = Date.now();

    try {
      const validator = new InfrastructurePrincessValidator();
      const result = await validator.runComprehensiveValidation();
      const duration = Date.now() - startTime;

      this.results.push({
        suite: 'Infrastructure Princess',
        passed: result.passed,
        score: result.score,
        duration,
        details: result.details,
        metrics: result.metrics
      });

      console.log(`✅ Infrastructure Princess: ${result.score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'Infrastructure Princess',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ Infrastructure Princess: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Run Research Princess Validation
   */
  private async runResearchValidation(): Promise<void> {
    console.log('\n🔬 Running Research Princess Validation...');
    const startTime = Date.now();

    try {
      const validator = new ResearchPrincessValidator();
      const result = await validator.runComprehensiveValidation();
      const duration = Date.now() - startTime;

      this.results.push({
        suite: 'Research Princess',
        passed: result.passed,
        score: result.score,
        duration,
        details: result.details,
        metrics: result.metrics
      });

      console.log(`✅ Research Princess: ${result.score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'Research Princess',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ Research Princess: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Run Memory Coordinator Validation
   */
  private async runMemoryCoordinatorValidation(): Promise<void> {
    console.log('\n💾 Running Memory Coordinator Validation...');
    const startTime = Date.now();

    try {
      const validator = new MemoryCoordinatorValidator();
      const result = await validator.runComprehensiveValidation();
      const duration = Date.now() - startTime;

      this.results.push({
        suite: 'Memory Coordinator',
        passed: result.passed,
        score: result.score,
        duration,
        details: result.details,
        metrics: result.metrics
      });

      console.log(`✅ Memory Coordinator: ${result.score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'Memory Coordinator',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ Memory Coordinator: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Run LangGraph Integration Validation
   */
  private async runLangGraphValidation(): Promise<void> {
    console.log('\n🔄 Running LangGraph Integration Validation...');
    const startTime = Date.now();

    try {
      const validator = new LangGraphValidator();
      const result = await validator.runComprehensiveValidation();
      const duration = Date.now() - startTime;

      this.results.push({
        suite: 'LangGraph Integration',
        passed: result.passed,
        score: result.score,
        duration,
        details: result.details,
        metrics: result.metrics
      });

      console.log(`✅ LangGraph Integration: ${result.score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'LangGraph Integration',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ LangGraph Integration: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Run Documentation System Validation
   */
  private async runDocumentationValidation(): Promise<void> {
    console.log('\n📖 Running Documentation System Validation...');
    const startTime = Date.now();

    try {
      const validator = new DocumentationValidator();
      const result = await validator.runComprehensiveValidation();
      const duration = Date.now() - startTime;

      this.results.push({
        suite: 'Documentation System',
        passed: result.passed,
        score: result.score,
        duration,
        details: result.details,
        metrics: result.metrics
      });

      console.log(`✅ Documentation System: ${result.score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'Documentation System',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ Documentation System: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Run End-to-End Integration Validation
   */
  private async runIntegrationValidation(): Promise<void> {
    console.log('\n🔗 Running End-to-End Integration Validation...');
    const startTime = Date.now();

    try {
      const validator = new IntegrationValidator();
      const result = await validator.runComprehensiveValidation();
      const duration = Date.now() - startTime;

      this.results.push({
        suite: 'End-to-End Integration',
        passed: result.passed,
        score: result.score,
        duration,
        details: result.details,
        metrics: result.metrics
      });

      console.log(`✅ End-to-End Integration: ${result.score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'End-to-End Integration',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ End-to-End Integration: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Run Performance Benchmark Suite
   */
  private async runPerformanceBenchmarks(): Promise<void> {
    console.log('\n⚡ Running Performance Benchmark Suite...');
    const startTime = Date.now();

    try {
      const benchmarkSuite = new PerformanceBenchmarkSuite();
      const result = await benchmarkSuite.runComprehensiveBenchmarks();
      const duration = Date.now() - startTime;

      this.results.push({
        suite: 'Performance Benchmarks',
        passed: result.passed,
        score: result.score,
        duration,
        details: result.details,
        metrics: result.metrics
      });

      console.log(`✅ Performance Benchmarks: ${result.score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'Performance Benchmarks',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ Performance Benchmarks: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Run Security Validation Suite
   */
  private async runSecurityValidation(): Promise<void> {
    console.log('\n🔒 Running Security Validation Suite...');
    const startTime = Date.now();

    try {
      const validator = new SecurityValidator();
      const result = await validator.runComprehensiveSecurityValidation();
      const duration = Date.now() - startTime;

      this.results.push({
        suite: 'Security Validation',
        passed: result.passed,
        score: result.score,
        duration,
        details: result.details,
        metrics: result.metrics
      });

      console.log(`✅ Security Validation: ${result.score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'Security Validation',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ Security Validation: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Run Continuous Monitoring Framework Validation
   */
  private async runMonitoringFrameworkValidation(): Promise<void> {
    console.log('\n📈 Running Continuous Monitoring Framework Validation...');
    const startTime = Date.now();

    try {
      const framework = new ContinuousMonitoringFramework();

      // Initialize and run monitoring for a short period
      const initResult = await framework.initializeMonitoring();
      if (!initResult.success) {
        throw new Error('Monitoring framework initialization failed');
      }

      await framework.startMonitoring();

      // Let monitoring run for 10 seconds to collect data
      await new Promise(resolve => setTimeout(resolve, 10000));

      const stopResult = await framework.stopMonitoring();
      const report = await framework.generateMonitoringReport();

      const duration = Date.now() - startTime;
      const score = stopResult.success && report.summary.status === 'Active' ? 95 : 0;

      this.results.push({
        suite: 'Monitoring Framework',
        passed: stopResult.success && report.summary.status === 'Active',
        score,
        duration,
        details: {
          initResult,
          stopResult,
          report
        }
      });

      console.log(`✅ Monitoring Framework: ${score.toFixed(1)}% (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: 'Monitoring Framework',
        passed: false,
        score: 0,
        duration,
        details: { error: error.message }
      });

      console.log(`❌ Monitoring Framework: FAILED (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(): ValidationSummary {
    const totalSuites = this.results.length;
    const passedSuites = this.results.filter(r => r.passed).length;
    const failedSuites = totalSuites - passedSuites;
    const totalDuration = Date.now() - this.startTime;

    // Calculate weighted overall score (some suites are more critical)
    const weights = {
      'Infrastructure Princess': 0.15,
      'Research Princess': 0.15,
      'Memory Coordinator': 0.12,
      'LangGraph Integration': 0.12,
      'Documentation System': 0.10,
      'End-to-End Integration': 0.20,
      'Performance Benchmarks': 0.08,
      'Security Validation': 0.06,
      'Monitoring Framework': 0.02
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const result of this.results) {
      const weight = weights[result.suite] || 0.1;
      weightedScore += result.score * weight;
      totalWeight += weight;
    }

    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // Determine production readiness
    const productionReady = overallScore >= 95 && passedSuites === totalSuites;

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      overallScore,
      totalSuites,
      passedSuites,
      failedSuites,
      totalDuration,
      results: this.results,
      productionReady,
      recommendations
    };
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for failed suites
    const failedSuites = this.results.filter(r => !r.passed);
    if (failedSuites.length > 0) {
      recommendations.push(`Address failures in: ${failedSuites.map(s => s.suite).join(', ')}`);
    }

    // Check for low scores
    const lowScoreSuites = this.results.filter(r => r.score < 90);
    if (lowScoreSuites.length > 0) {
      recommendations.push(`Improve performance for: ${lowScoreSuites.map(s => s.suite).join(', ')}`);
    }

    // Performance recommendations
    const performanceResult = this.results.find(r => r.suite === 'Performance Benchmarks');
    if (performanceResult && performanceResult.score < 95) {
      recommendations.push('Review performance benchmarks and optimize bottlenecks');
    }

    // Security recommendations
    const securityResult = this.results.find(r => r.suite === 'Security Validation');
    if (securityResult && securityResult.score < 98) {
      recommendations.push('Address security vulnerabilities before production deployment');
    }

    // Integration recommendations
    const integrationResult = this.results.find(r => r.suite === 'End-to-End Integration');
    if (integrationResult && integrationResult.score < 95) {
      recommendations.push('Improve Princess coordination and workflow reliability');
    }

    if (recommendations.length === 0) {
      recommendations.push('All validation suites passed - system is production ready');
    }

    return recommendations;
  }

  /**
   * Log validation summary
   */
  private logValidationSummary(summary: ValidationSummary): void {
    console.log('\n================================================================');
    console.log('🎯 PHASE 7 VALIDATION SUMMARY');
    console.log('================================================================');

    console.log(`\n📊 Overall Score: ${summary.overallScore.toFixed(1)}%`);
    console.log(`⏱️  Total Duration: ${(summary.totalDuration / 1000).toFixed(1)}s`);
    console.log(`✅ Passed Suites: ${summary.passedSuites}/${summary.totalSuites}`);

    if (summary.failedSuites > 0) {
      console.log(`❌ Failed Suites: ${summary.failedSuites}`);
    }

    console.log(`\n🚀 Production Ready: ${summary.productionReady ? 'YES' : 'NO'}`);

    console.log('\n📋 Suite Results:');
    for (const result of summary.results) {
      const status = result.passed ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(1);
      console.log(`   ${status} ${result.suite}: ${result.score.toFixed(1)}% (${duration}s)`);
    }

    if (summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const recommendation of summary.recommendations) {
        console.log(`   • ${recommendation}`);
      }
    }

    console.log('\n================================================================');

    if (summary.productionReady) {
      console.log('🎉 PHASE 7 VALIDATION: COMPLETE SUCCESS - PRODUCTION READY!');
    } else {
      console.log('⚠️  PHASE 7 VALIDATION: ISSUES DETECTED - REVIEW REQUIRED');
    }

    console.log('================================================================\n');
  }

  /**
   * Export results to JSON for CI/CD integration
   */
  async exportResults(filePath: string): Promise<void> {
    const summary = this.generateValidationSummary();

    try {
      const fs = require('fs').promises;
      await fs.writeFile(filePath, JSON.stringify(summary, null, 2));
      console.log(`📄 Validation results exported to: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to export results: ${error.message}`);
    }
  }
}

// Export for CLI usage
export default ValidationTestRunner;

// CLI execution support
if (require.main === module) {
  const runner = new ValidationTestRunner();

  runner.runAllValidations()
    .then(async (summary) => {
      // Export results for CI/CD
      await runner.exportResults('./phase7-validation-results.json');

      // Exit with appropriate code
      process.exit(summary.productionReady ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation runner failed:', error);
      process.exit(1);
    });
}