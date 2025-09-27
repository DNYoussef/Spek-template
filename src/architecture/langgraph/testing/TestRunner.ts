/**
 * Comprehensive Test Runner for LangGraph State Machine System
 * Orchestrates performance benchmarks and validation suites
 * Features:
 * - Automated test execution
 * - Report generation
 * - CI/CD integration
 * - Test scheduling
 * - Results aggregation
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import { join } from 'path';
import PerformanceBenchmarks, { BenchmarkResult, StressTestConfig } from './PerformanceBenchmarks';
import ValidationSuite, { ValidationResult, ValidationConfig } from './ValidationSuite';

export interface TestRunConfig {
  runBenchmarks: boolean;
  runValidation: boolean;
  outputDirectory: string;
  reportFormat: 'text' | 'json' | 'html' | 'all';
  includeDetailedResults: boolean;
  maxExecutionTime: number; // seconds
  enableContinuousMode: boolean;
  continuousInterval: number; // seconds
  ciMode: boolean;
  failFast: boolean;
  retryFailedTests: number;
}

export interface TestSuite {
  name: string;
  description: string;
  benchmarks?: PerformanceBenchmarks;
  validation?: ValidationSuite;
  config: TestRunConfig;
}

export interface TestRunSummary {
  startTime: Date;
  endTime: Date;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  benchmarkResults?: BenchmarkResult[];
  validationResults?: ValidationResult[];
  success: boolean;
  reports: {
    text?: string;
    json?: object;
    html?: string;
  };
}

export class TestRunner extends EventEmitter {
  private benchmarks?: PerformanceBenchmarks;
  private validation?: ValidationSuite;
  private config: TestRunConfig;
  private isRunning = false;
  private currentRun?: TestRunSummary;
  private continuousTimer?: NodeJS.Timeout;

  constructor(config: Partial<TestRunConfig> = {}) {
    super();

    this.config = {
      runBenchmarks: true,
      runValidation: true,
      outputDirectory: './test-results',
      reportFormat: 'all',
      includeDetailedResults: true,
      maxExecutionTime: 1800, // 30 minutes
      enableContinuousMode: false,
      continuousInterval: 3600, // 1 hour
      ciMode: false,
      failFast: false,
      retryFailedTests: 0,
      ...config
    };

    this.initializeTestSuites();
  }

  private initializeTestSuites(): void {
    if (this.config.runBenchmarks) {
      this.benchmarks = new PerformanceBenchmarks();
      this.benchmarks.on('benchmarkComplete', this.handleBenchmarkComplete.bind(this));
      this.benchmarks.on('benchmarkError', this.handleBenchmarkError.bind(this));
    }

    if (this.config.runValidation) {
      const validationConfig: ValidationConfig = {
        enableIntegrationTests: true,
        enableStressTests: !this.config.ciMode, // Skip stress tests in CI
        enableEdgeCaseTests: true,
        enableRecoveryTests: true,
        timeout: 30000,
        maxRetries: this.config.retryFailedTests
      };

      this.validation = new ValidationSuite(validationConfig);
      this.validation.on('validationComplete', this.handleValidationComplete.bind(this));
      this.validation.on('validationError', this.handleValidationError.bind(this));
    }
  }

  /**
   * Run complete test suite
   */
  async runTests(): Promise<TestRunSummary> {
    if (this.isRunning) {
      throw new Error('Test runner is already running');
    }

    this.isRunning = true;
    const startTime = new Date();

    console.log('=== Starting LangGraph Test Suite ===');
    console.log(`Start time: ${startTime.toISOString()}`);
    console.log(`Configuration: ${JSON.stringify(this.config, null, 2)}`);

    this.currentRun = {
      startTime,
      endTime: new Date(),
      duration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      success: false,
      reports: {}
    };

    try {
      // Setup output directory
      await this.ensureOutputDirectory();

      // Run with timeout
      const testPromise = this.executeTests();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Test execution exceeded maximum time limit of ${this.config.maxExecutionTime} seconds`));
        }, this.config.maxExecutionTime * 1000);
      });

      await Promise.race([testPromise, timeoutPromise]);

      this.currentRun.endTime = new Date();
      this.currentRun.duration = this.currentRun.endTime.getTime() - this.currentRun.startTime.getTime();

      // Calculate summary
      this.calculateTestSummary();

      // Generate reports
      await this.generateReports();

      // Determine overall success
      this.currentRun.success = this.currentRun.failedTests === 0;

      console.log(`=== Test Suite Completed ===`);
      console.log(`Duration: ${(this.currentRun.duration / 1000).toFixed(2)} seconds`);
      console.log(`Result: ${this.currentRun.success ? 'SUCCESS' : 'FAILURE'}`);
      console.log(`Tests: ${this.currentRun.passedTests}/${this.currentRun.totalTests} passed`);

      this.emit('testComplete', this.currentRun);

      if (this.config.ciMode && !this.currentRun.success) {
        process.exit(1);
      }

      return this.currentRun;

    } catch (error) {
      this.currentRun.endTime = new Date();
      this.currentRun.duration = this.currentRun.endTime.getTime() - this.currentRun.startTime.getTime();
      this.currentRun.success = false;

      console.error('Test suite failed:', error);
      this.emit('testError', error);

      if (this.config.ciMode) {
        process.exit(1);
      }

      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute the actual tests
   */
  private async executeTests(): Promise<void> {
    console.log('\n--- Executing Test Suites ---');

    if (this.config.runValidation && this.validation) {
      console.log('\nRunning Validation Suite...');
      try {
        this.currentRun!.validationResults = await this.validation.runValidationSuite();
        console.log('Validation suite completed successfully');
      } catch (error) {
        console.error('Validation suite failed:', error);
        if (this.config.failFast) {
          throw error;
        }
      }
    }

    if (this.config.runBenchmarks && this.benchmarks) {
      console.log('\nRunning Performance Benchmarks...');
      try {
        this.currentRun!.benchmarkResults = await this.benchmarks.runBenchmarkSuite();
        console.log('Performance benchmarks completed successfully');
      } catch (error) {
        console.error('Performance benchmarks failed:', error);
        if (this.config.failFast) {
          throw error;
        }
      }
    }
  }

  /**
   * Calculate test summary statistics
   */
  private calculateTestSummary(): void {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    if (this.currentRun?.validationResults) {
      totalTests += this.currentRun.validationResults.length;
      passedTests += this.currentRun.validationResults.filter(r => r.success).length;
      failedTests += this.currentRun.validationResults.filter(r => !r.success).length;
    }

    if (this.currentRun?.benchmarkResults) {
      totalTests += this.currentRun.benchmarkResults.length;
      passedTests += this.currentRun.benchmarkResults.filter(r => r.success).length;
      failedTests += this.currentRun.benchmarkResults.filter(r => !r.success).length;
    }

    this.currentRun!.totalTests = totalTests;
    this.currentRun!.passedTests = passedTests;
    this.currentRun!.failedTests = failedTests;
  }

  /**
   * Generate test reports in various formats
   */
  private async generateReports(): Promise<void> {
    console.log('\n--- Generating Reports ---');

    if (this.config.reportFormat === 'text' || this.config.reportFormat === 'all') {
      console.log('Generating text report...');
      this.currentRun!.reports.text = this.generateTextReport();
      await this.saveReport('report.txt', this.currentRun!.reports.text);
    }

    if (this.config.reportFormat === 'json' || this.config.reportFormat === 'all') {
      console.log('Generating JSON report...');
      this.currentRun!.reports.json = this.generateJsonReport();
      await this.saveReport('report.json', JSON.stringify(this.currentRun!.reports.json, null, 2));
    }

    if (this.config.reportFormat === 'html' || this.config.reportFormat === 'all') {
      console.log('Generating HTML report...');
      this.currentRun!.reports.html = this.generateHtmlReport();
      await this.saveReport('report.html', this.currentRun!.reports.html);
    }

    console.log(`Reports saved to: ${this.config.outputDirectory}`);
  }

  /**
   * Generate text report
   */
  private generateTextReport(): string {
    let report = '=== LangGraph Test Suite Report ===\n\n';

    // Summary
    report += `Execution Summary:\n`;
    report += `  Start Time: ${this.currentRun?.startTime.toISOString()}\n`;
    report += `  End Time: ${this.currentRun?.endTime.toISOString()}\n`;
    report += `  Duration: ${((this.currentRun?.duration || 0) / 1000).toFixed(2)} seconds\n`;
    report += `  Total Tests: ${this.currentRun?.totalTests}\n`;
    report += `  Passed: ${this.currentRun?.passedTests}\n`;
    report += `  Failed: ${this.currentRun?.failedTests}\n`;
    report += `  Success Rate: ${this.currentRun?.totalTests ? ((this.currentRun.passedTests / this.currentRun.totalTests) * 100).toFixed(1) : 0}%\n`;
    report += `  Overall Result: ${this.currentRun?.success ? 'SUCCESS' : 'FAILURE'}\n\n`;

    // Configuration
    report += `Configuration:\n`;
    report += `  Benchmarks: ${this.config.runBenchmarks ? 'Enabled' : 'Disabled'}\n`;
    report += `  Validation: ${this.config.runValidation ? 'Enabled' : 'Disabled'}\n`;
    report += `  CI Mode: ${this.config.ciMode ? 'Yes' : 'No'}\n`;
    report += `  Fail Fast: ${this.config.failFast ? 'Yes' : 'No'}\n`;
    report += `  Max Execution Time: ${this.config.maxExecutionTime} seconds\n\n`;

    // Validation results
    if (this.currentRun?.validationResults && this.validation) {
      report += this.validation.generateReport() + '\n';
    }

    // Benchmark results
    if (this.currentRun?.benchmarkResults && this.benchmarks) {
      report += this.benchmarks.generateReport() + '\n';
    }

    // System information
    report += `System Information:\n`;
    report += `  Node.js Version: ${process.version}\n`;
    report += `  Platform: ${process.platform}\n`;
    report += `  Architecture: ${process.arch}\n`;
    report += `  Memory Usage: ${JSON.stringify(process.memoryUsage(), null, 2)}\n`;

    return report;
  }

  /**
   * Generate JSON report
   */
  private generateJsonReport(): object {
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memoryUsage: process.memoryUsage()
    };

    return {
      timestamp: new Date().toISOString(),
      summary: {
        startTime: this.currentRun?.startTime,
        endTime: this.currentRun?.endTime,
        duration: this.currentRun?.duration,
        totalTests: this.currentRun?.totalTests,
        passedTests: this.currentRun?.passedTests,
        failedTests: this.currentRun?.failedTests,
        successRate: this.currentRun?.totalTests ? (this.currentRun.passedTests / this.currentRun.totalTests) * 100 : 0,
        success: this.currentRun?.success
      },
      configuration: this.config,
      validation: this.validation?.exportResults(),
      benchmarks: this.benchmarks?.exportResults(),
      systemInfo
    };
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(): string {
    const successRate = this.currentRun?.totalTests ? ((this.currentRun.passedTests / this.currentRun.totalTests) * 100).toFixed(1) : '0';
    const duration = ((this.currentRun?.duration || 0) / 1000).toFixed(2);

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LangGraph Test Suite Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: ${this.currentRun?.success ? '#4CAF50' : '#F44336'};
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 20px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .metric h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .metric .value {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .test-results {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .pass {
            color: #4CAF50;
            font-weight: bold;
        }
        .fail {
            color: #F44336;
            font-weight: bold;
        }
        .config {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LangGraph Test Suite Report</h1>
            <div class="subtitle">
                ${this.currentRun?.success ? 'All Tests Passed' : 'Some Tests Failed'} •
                Generated on ${new Date().toLocaleString()}
            </div>
        </div>

        <div class="content">
            <div class="summary">
                <div class="metric">
                    <h3>Total Tests</h3>
                    <div class="value">${this.currentRun?.totalTests || 0}</div>
                </div>
                <div class="metric">
                    <h3>Passed</h3>
                    <div class="value" style="color: #4CAF50">${this.currentRun?.passedTests || 0}</div>
                </div>
                <div class="metric">
                    <h3>Failed</h3>
                    <div class="value" style="color: #F44336">${this.currentRun?.failedTests || 0}</div>
                </div>
                <div class="metric">
                    <h3>Success Rate</h3>
                    <div class="value">${successRate}%</div>
                </div>
                <div class="metric">
                    <h3>Duration</h3>
                    <div class="value">${duration}s</div>
                </div>
            </div>

            <div class="section">
                <h2>Configuration</h2>
                <div class="config">
                    <strong>Benchmarks:</strong> ${this.config.runBenchmarks ? 'Enabled' : 'Disabled'}<br>
                    <strong>Validation:</strong> ${this.config.runValidation ? 'Enabled' : 'Disabled'}<br>
                    <strong>CI Mode:</strong> ${this.config.ciMode ? 'Yes' : 'No'}<br>
                    <strong>Fail Fast:</strong> ${this.config.failFast ? 'Yes' : 'No'}<br>
                    <strong>Max Execution Time:</strong> ${this.config.maxExecutionTime} seconds
                </div>
            </div>
`;

    // Validation results table
    if (this.currentRun?.validationResults) {
      html += `
            <div class="section">
                <h2>Validation Results</h2>
                <div class="test-results">
                    <table>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Status</th>
                                <th>Duration (ms)</th>
                                <th>Assertions</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
`;

      for (const result of this.currentRun.validationResults) {
        const status = result.success ? 'PASS' : 'FAIL';
        const statusClass = result.success ? 'pass' : 'fail';
        const assertions = `${result.assertions.passed}/${result.assertions.total}`;

        html += `
                            <tr>
                                <td>${result.testName}</td>
                                <td class="${statusClass}">${status}</td>
                                <td>${result.executionTime}</td>
                                <td>${assertions}</td>
                                <td>${result.message}</td>
                            </tr>
`;
      }

      html += `
                        </tbody>
                    </table>
                </div>
            </div>
`;
    }

    // Benchmark results table
    if (this.currentRun?.benchmarkResults) {
      html += `
            <div class="section">
                <h2>Benchmark Results</h2>
                <div class="test-results">
                    <table>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Status</th>
                                <th>Avg Time (ms)</th>
                                <th>P95 Time (ms)</th>
                                <th>Throughput</th>
                                <th>Memory Leak (MB)</th>
                            </tr>
                        </thead>
                        <tbody>
`;

      for (const result of this.currentRun.benchmarkResults) {
        const status = result.success ? 'PASS' : 'FAIL';
        const statusClass = result.success ? 'pass' : 'fail';
        const throughput = result.throughput > 0 ? `${result.throughput.toFixed(1)} op/s` : 'N/A';

        html += `
                            <tr>
                                <td>${result.testName}</td>
                                <td class="${statusClass}">${status}</td>
                                <td>${result.averageTime.toFixed(2)}</td>
                                <td>${result.p95Time.toFixed(2)}</td>
                                <td>${throughput}</td>
                                <td>${result.memoryUsage.leaked.toFixed(1)}</td>
                            </tr>
`;
      }

      html += `
                        </tbody>
                    </table>
                </div>
            </div>
`;
    }

    html += `
        </div>

        <div class="footer">
            <p>Generated by LangGraph Test Runner • ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Save report to file
   */
  private async saveReport(filename: string, content: string): Promise<void> {
    const filepath = join(this.config.outputDirectory, filename);
    await fs.writeFile(filepath, content, 'utf8');
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.access(this.config.outputDirectory);
    } catch (error) {
      await fs.mkdir(this.config.outputDirectory, { recursive: true });
    }
  }

  /**
   * Start continuous testing mode
   */
  startContinuousMode(): void {
    if (this.config.enableContinuousMode) {
      console.log(`Starting continuous testing mode (interval: ${this.config.continuousInterval}s)`);

      this.continuousTimer = setInterval(async () => {
        try {
          console.log('\n=== Continuous Test Run ===');
          await this.runTests();
        } catch (error) {
          console.error('Continuous test run failed:', error);
        }
      }, this.config.continuousInterval * 1000);

      this.emit('continuousModeStarted');
    }
  }

  /**
   * Stop continuous testing mode
   */
  stopContinuousMode(): void {
    if (this.continuousTimer) {
      clearInterval(this.continuousTimer);
      this.continuousTimer = undefined;
      console.log('Continuous testing mode stopped');
      this.emit('continuousModeStopped');
    }
  }

  /**
   * Event handlers
   */
  private handleBenchmarkComplete(results: BenchmarkResult[]): void {
    console.log(`Benchmarks completed: ${results.filter(r => r.success).length}/${results.length} passed`);
  }

  private handleBenchmarkError(error: Error): void {
    console.error('Benchmark error:', error.message);
  }

  private handleValidationComplete(results: ValidationResult[]): void {
    console.log(`Validation completed: ${results.filter(r => r.success).length}/${results.length} passed`);
  }

  private handleValidationError(error: Error): void {
    console.error('Validation error:', error.message);
  }

  /**
   * Get current test run status
   */
  getCurrentRunStatus(): TestRunSummary | null {
    return this.currentRun || null;
  }

  /**
   * Check if test runner is currently running
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.stopContinuousMode();

    if (this.benchmarks) {
      await this.benchmarks.cleanup();
    }

    if (this.validation) {
      await this.validation.cleanup();
    }

    this.removeAllListeners();
  }
}

export default TestRunner;