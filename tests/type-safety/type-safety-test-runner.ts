#!/usr/bin/env ts-node
/**
 * Phase 4 Week 10: Type Safety Test Runner
 * Comprehensive test execution script for validating Phase 4
 * type safety improvements and enterprise compliance.
 */

import { performance } from 'perf_hooks';
import { writeFileSync } from 'fs';
import { join } from 'path';

import TypeSafetyTestSuite from './TypeSafetyTestSuite';

// Interface for command line arguments
interface TestRunnerOptions {
  verbose: boolean;
  generateReport: boolean;
  outputPath: string;
  exitOnFailure: boolean;
  performance: boolean;
  compliance: boolean;
  suite?: string;
}

class TypeSafetyTestRunner {
  private options: TestRunnerOptions;
  private startTime: number = 0;

  constructor(options: Partial<TestRunnerOptions> = {}) {
    this.options = {
      verbose: false,
      generateReport: true,
      outputPath: '.claude/.artifacts',
      exitOnFailure: true,
      performance: true,
      compliance: true,
      ...options
    };
  }

  /**
   * Execute comprehensive type safety validation
   */
  async run(): Promise<void> {
    console.log('🚀 Phase 4 Week 10: Type Safety Test Execution');
    console.log('================================================');
    console.log('');

    this.startTime = performance.now();

    try {
      // Display configuration
      this.displayConfiguration();

      // Initialize test suite
      const testSuite = new TypeSafetyTestSuite({
        strictMode: true,
        targetCoverage: 85,
        maxAnyTypes: 0,
        performanceThreshold: 5.0,
        complianceThreshold: 92.0,
        phase3Validation: true
      });

      // Execute comprehensive validation
      console.log('📋 Executing Type Safety Validation...');
      const results = await testSuite.runComprehensiveValidation();

      // Display results
      this.displayResults(results);

      // Generate reports
      if (this.options.generateReport) {
        await this.generateReports(results);
      }

      // Exit handling
      const overallPassed = results.every(r => r.passed);
      if (!overallPassed && this.options.exitOnFailure) {
        console.error('❌ Type Safety Validation Failed');
        process.exit(1);
      } else if (overallPassed) {
        console.log('✅ Type Safety Validation Passed');
        process.exit(0);
      }

    } catch (error) {
      console.error('💥 Critical Error during validation:', error);

      if (this.options.exitOnFailure) {
        process.exit(1);
      }
    }
  }

  /**
   * Display test configuration
   */
  private displayConfiguration(): void {
    console.log('⚙️ Configuration:');
    console.log(`   • Verbose: ${this.options.verbose}`);
    console.log(`   • Generate Report: ${this.options.generateReport}`);
    console.log(`   • Output Path: ${this.options.outputPath}`);
    console.log(`   • Exit on Failure: ${this.options.exitOnFailure}`);
    console.log(`   • Performance Tests: ${this.options.performance}`);
    console.log(`   • Compliance Tests: ${this.options.compliance}`);
    if (this.options.suite) {
      console.log(`   • Test Suite: ${this.options.suite}`);
    }
    console.log('');
  }

  /**
   * Display test results summary
   */
  private displayResults(results: any[]): void {
    const totalDuration = performance.now() - this.startTime;

    console.log('');
    console.log('📊 Type Safety Validation Results');
    console.log('==================================');
    console.log('');

    // Overall summary
    const totalTests = results.reduce((sum, r) => sum + r.details.totalTests, 0);
    const passedTests = results.reduce((sum, r) => sum + r.details.passedTests, 0);
    const failedTests = results.reduce((sum, r) => sum + r.details.failedTests, 0);
    const overallPassed = results.every(r => r.passed);
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    console.log(`📈 Overall Status: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`📊 Average Score: ${averageScore.toFixed(2)}%`);
    console.log(`🧪 Total Tests: ${totalTests} (${passedTests} passed, ${failedTests} failed)`);
    console.log(`⏱️ Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('');

    // Results by category
    console.log('📋 Results by Test Category:');
    console.log('');

    for (const result of results) {
      const status = result.passed ? '✅' : '❌';
      const score = result.score.toFixed(2);

      console.log(`${status} ${result.testCategory}`);
      console.log(`   Score: ${score}%`);
      console.log(`   Tests: ${result.details.passedTests}/${result.details.totalTests} passed`);

      if (result.details.criticalIssues.length > 0) {
        console.log(`   🚨 Critical Issues: ${result.details.criticalIssues.length}`);
        if (this.options.verbose) {
          result.details.criticalIssues.forEach((issue: string) => {
            console.log(`      • ${issue}`);
          });
        }
      }

      if (result.details.warnings.length > 0) {
        console.log(`   ⚠️ Warnings: ${result.details.warnings.length}`);
        if (this.options.verbose) {
          result.details.warnings.forEach((warning: string) => {
            console.log(`      • ${warning}`);
          });
        }
      }

      console.log('');
    }

    // Critical issues summary
    const allCriticalIssues = results.flatMap(r => r.details.criticalIssues);
    if (allCriticalIssues.length > 0) {
      console.log('🚨 Critical Issues Summary:');
      console.log('');
      allCriticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      console.log('');
    }

    // Metrics summary
    console.log('📏 Key Metrics:');
    console.log('');

    const metricsTable = results.map(result => ({
      Category: result.testCategory,
      'Type Coverage': `${result.metrics.typeCoverage.toFixed(1)}%`,
      'Any Types': result.metrics.anyTypeCount,
      'Compilation Time': `${result.metrics.compilationTime.toFixed(0)}ms`,
      'Performance Impact': `${result.metrics.performanceImpact.toFixed(1)}%`,
      'Compliance Score': `${result.metrics.complianceScore.toFixed(1)}%`
    }));

    console.table(metricsTable);
    console.log('');

    // Recommendations
    const allRecommendations = results.flatMap(r => r.details.recommendations);
    if (allRecommendations.length > 0) {
      console.log('💡 Recommendations:');
      console.log('');
      const uniqueRecommendations = [...new Set(allRecommendations)];
      uniqueRecommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log('');
    }
  }

  /**
   * Generate comprehensive reports
   */
  private async generateReports(results: any[]): Promise<void> {
    console.log('📄 Generating Reports...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `type-safety-validation-${timestamp}`;

    // JSON Report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 4 Week 10',
      agent: 'tester',
      overall: {
        passed: results.every(r => r.passed),
        score: results.reduce((sum, r) => sum + r.score, 0) / results.length,
        duration: performance.now() - this.startTime,
        totalTests: results.reduce((sum, r) => sum + r.details.totalTests, 0),
        passedTests: results.reduce((sum, r) => sum + r.details.passedTests, 0),
        failedTests: results.reduce((sum, r) => sum + r.details.failedTests, 0)
      },
      results,
      summary: {
        criticalIssues: results.reduce((sum, r) => sum + r.details.criticalIssues.length, 0),
        warnings: results.reduce((sum, r) => sum + r.details.warnings.length, 0),
        anyTypesEliminated: results[0]?.metrics?.anyTypeReduction || 0,
        complianceScore: results.find(r => r.testCategory === 'Enterprise Compliance')?.metrics?.complianceScore || 0
      }
    };

    const jsonPath = join(this.options.outputPath, `${baseFilename}.json`);
    writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

    // Markdown Report
    const markdownReport = this.generateMarkdownReport(results, jsonReport);
    const mdPath = join(this.options.outputPath, `${baseFilename}.md`);
    writeFileSync(mdPath, markdownReport);

    // HTML Report (simplified)
    const htmlReport = this.generateHTMLReport(results, jsonReport);
    const htmlPath = join(this.options.outputPath, `${baseFilename}.html`);
    writeFileSync(htmlPath, htmlReport);

    console.log(`📄 Reports generated:`);
    console.log(`   • JSON: ${jsonPath}`);
    console.log(`   • Markdown: ${mdPath}`);
    console.log(`   • HTML: ${htmlPath}`);
    console.log('');
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(results: any[], jsonReport: any): string {
    return `# Phase 4 Week 10: Type Safety Validation Report

## Executive Summary

- **Overall Status**: ${jsonReport.overall.passed ? '✅ PASSED' : '❌ FAILED'}
- **Average Score**: ${jsonReport.overall.score.toFixed(2)}%
- **Duration**: ${(jsonReport.overall.duration / 1000).toFixed(2)}s
- **Total Tests**: ${jsonReport.overall.totalTests}
- **Tests Passed**: ${jsonReport.overall.passedTests}
- **Tests Failed**: ${jsonReport.overall.failedTests}

## Test Categories

${results.map(result => `
### ${result.testCategory}

- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}
- **Score**: ${result.score.toFixed(2)}%
- **Tests**: ${result.details.passedTests}/${result.details.totalTests}

#### Metrics
- Type Coverage: ${result.metrics.typeCoverage.toFixed(1)}%
- Any Types: ${result.metrics.anyTypeCount}
- Compilation Time: ${result.metrics.compilationTime.toFixed(0)}ms
- Performance Impact: ${result.metrics.performanceImpact.toFixed(1)}%
- Compliance Score: ${result.metrics.complianceScore.toFixed(1)}%

${result.details.criticalIssues.length > 0 ? `#### Critical Issues
${result.details.criticalIssues.map((issue: string) => `- ${issue}`).join('\n')}` : ''}

${result.details.warnings.length > 0 ? `#### Warnings
${result.details.warnings.map((warning: string) => `- ${warning}`).join('\n')}` : ''}

${result.details.recommendations.length > 0 ? `#### Recommendations
${result.details.recommendations.map((rec: string) => `- ${rec}`).join('\n')}` : ''}
`).join('')}

## Summary

### Key Achievements
- Any Types Eliminated: ${jsonReport.summary.anyTypesEliminated}%
- Enterprise Compliance: ${jsonReport.summary.complianceScore.toFixed(2)}%
- Critical Issues: ${jsonReport.summary.criticalIssues}
- Warnings: ${jsonReport.summary.warnings}

### Next Steps
${results.flatMap((r: any) => r.details.recommendations).slice(0, 5).map((rec: string) => `1. ${rec}`).join('\n')}

---
Generated: ${jsonReport.timestamp}
Phase: Phase 4 Week 10
Agent: tester
System: SPEK Enhanced Development Platform`;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(results: any[], jsonReport: any): string {
    const statusColor = jsonReport.overall.passed ? '#4CAF50' : '#F44336';
    const statusText = jsonReport.overall.passed ? 'PASSED' : 'FAILED';

    return `<!DOCTYPE html>
<html>
<head>
    <title>Phase 4 Week 10: Type Safety Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .status { color: ${statusColor}; font-weight: bold; }
        .metric { margin: 10px 0; }
        .test-category { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #F44336; }
        .critical { color: #F44336; }
        .warning { color: #FF9800; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Phase 4 Week 10: Type Safety Validation Report</h1>
        <div class="status">Overall Status: ${statusText}</div>
        <div class="metric">Average Score: ${jsonReport.overall.score.toFixed(2)}%</div>
        <div class="metric">Duration: ${(jsonReport.overall.duration / 1000).toFixed(2)}s</div>
        <div class="metric">Tests: ${jsonReport.overall.passedTests}/${jsonReport.overall.totalTests} passed</div>
    </div>

    <h2>Test Categories</h2>
    ${results.map(result => `
    <div class="test-category ${result.passed ? 'passed' : 'failed'}">
        <h3>${result.testCategory}</h3>
        <p><strong>Status:</strong> ${result.passed ? '✅ PASSED' : '❌ FAILED'}</p>
        <p><strong>Score:</strong> ${result.score.toFixed(2)}%</p>
        <p><strong>Tests:</strong> ${result.details.passedTests}/${result.details.totalTests}</p>

        <h4>Metrics</h4>
        <ul>
            <li>Type Coverage: ${result.metrics.typeCoverage.toFixed(1)}%</li>
            <li>Any Types: ${result.metrics.anyTypeCount}</li>
            <li>Compilation Time: ${result.metrics.compilationTime.toFixed(0)}ms</li>
            <li>Performance Impact: ${result.metrics.performanceImpact.toFixed(1)}%</li>
            <li>Compliance Score: ${result.metrics.complianceScore.toFixed(1)}%</li>
        </ul>

        ${result.details.criticalIssues.length > 0 ? `
        <h4 class="critical">Critical Issues</h4>
        <ul>
            ${result.details.criticalIssues.map((issue: string) => `<li>${issue}</li>`).join('')}
        </ul>` : ''}

        ${result.details.warnings.length > 0 ? `
        <h4 class="warning">Warnings</h4>
        <ul>
            ${result.details.warnings.map((warning: string) => `<li>${warning}</li>`).join('')}
        </ul>` : ''}
    </div>
    `).join('')}

    <h2>Summary</h2>
    <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Any Types Eliminated</td><td>${jsonReport.summary.anyTypesEliminated}%</td></tr>
        <tr><td>Enterprise Compliance</td><td>${jsonReport.summary.complianceScore.toFixed(2)}%</td></tr>
        <tr><td>Critical Issues</td><td>${jsonReport.summary.criticalIssues}</td></tr>
        <tr><td>Warnings</td><td>${jsonReport.summary.warnings}</td></tr>
    </table>

    <hr>
    <p><small>Generated: ${jsonReport.timestamp} | Phase: Phase 4 Week 10 | Agent: tester</small></p>
</body>
</html>`;
  }
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: Partial<TestRunnerOptions> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--no-report':
        options.generateReport = false;
        break;
      case '--no-exit':
        options.exitOnFailure = false;
        break;
      case '--output':
      case '-o':
        options.outputPath = args[++i];
        break;
      case '--suite':
      case '-s':
        options.suite = args[++i];
        break;
      case '--no-performance':
        options.performance = false;
        break;
      case '--no-compliance':
        options.compliance = false;
        break;
      case '--help':
      case '-h':
        console.log(`
Phase 4 Week 10: Type Safety Test Runner

Usage: ts-node type-safety-test-runner.ts [options]

Options:
  -v, --verbose          Enable verbose output
  --no-report           Skip report generation
  --no-exit             Don't exit on failure
  -o, --output <path>   Output directory for reports
  -s, --suite <name>    Run specific test suite
  --no-performance      Skip performance tests
  --no-compliance       Skip compliance tests
  -h, --help            Show this help message

Examples:
  ts-node type-safety-test-runner.ts --verbose
  ts-node type-safety-test-runner.ts --suite guards --no-report
  ts-node type-safety-test-runner.ts --output ./reports
        `);
        process.exit(0);
    }
  }

  // Execute test runner
  const runner = new TypeSafetyTestRunner(options);
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default TypeSafetyTestRunner;