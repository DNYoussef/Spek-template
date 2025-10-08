/**
 * Integration Test Runner
 *
 * Orchestrates comprehensive performance testing across all benchmark suites
 * with real system integration, automated reporting, and CI/CD pipeline support.
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PerformanceBenchmarker } from '../../src/performance/PerformanceBenchmarker';
import { BenchmarkReporter } from '../../src/performance/BenchmarkReporter';
import { PerformanceAnalyzer } from '../../src/performance/PerformanceAnalyzer';
import { BaselineComparator } from '../../src/performance/BaselineComparator';
import { RegressionDetector } from '../../src/performance/RegressionDetector';
import { APIBenchmarkSuite, defaultAPIBenchmarkConfig } from './suites/api-benchmark.suite';
import { DatabaseBenchmarkSuite, defaultDatabaseBenchmarkConfig } from './suites/database-benchmark.suite';
import { SwarmBenchmarkSuite, defaultSwarmBenchmarkConfig } from './suites/swarm-benchmark.suite';
import { MemoryBenchmarkSuite, defaultMemoryBenchmarkConfig } from './suites/memory-benchmark.suite';
import { CPUBenchmarkSuite, defaultCPUBenchmarkConfig } from './suites/cpu-benchmark.suite';
import { NetworkBenchmarkSuite, defaultNetworkBenchmarkConfig } from './suites/network-benchmark.suite';
import { BenchmarkResult, BenchmarkConfig } from '../../src/performance/types';

export interface IntegrationTestConfig {
  suites: string[];
  outputDirectory: string;
  baselineDirectory: string;
  reportFormats: string[];
  enableRegression: boolean;
  enableBaseline: boolean;
  enableProfiling: boolean;
  parallelExecution: boolean;
  maxConcurrentSuites: number;
  ciMode: boolean;
  failFast: boolean;
  timeout: number;
  retryCount: number;
  thresholds: {
    regression: number;
    performance: number;
    memory: number;
    cpu: number;
  };
}

export interface TestSuiteResult {
  suiteName: string;
  success: boolean;
  duration: number;
  results: BenchmarkResult[];
  errors: string[];
  warnings: string[];
  baseline?: any;
  regression?: any;
}

export interface IntegrationTestReport {
  summary: {
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    totalDuration: number;
    timestamp: number;
    environment: SystemEnvironment;
  };
  suiteResults: TestSuiteResult[];
  regressionAnalysis?: any;
  baselineComparison?: any;
  recommendations: string[];
  ciArtifacts: {
    exitCode: number;
    junitReport?: string;
    performanceReport?: string;
    regressionReport?: string;
  };
}

export interface SystemEnvironment {
  platform: string;
  arch: string;
  nodeVersion: string;
  cpuModel: string;
  cpuCores: number;
  totalMemory: number;
  freeMemory: number;
  hostname: string;
  timestamp: number;
}

export class IntegrationTestRunner extends EventEmitter {
  private config: IntegrationTestConfig;
  private benchmarker: PerformanceBenchmarker;
  private reporter: BenchmarkReporter;
  private analyzer: PerformanceAnalyzer;
  private baselineComparator: BaselineComparator;
  private regressionDetector: RegressionDetector;
  private activeSuites = new Map<string, any>();
  private results: TestSuiteResult[] = [];

  constructor(config: IntegrationTestConfig) {
    super();
    this.config = config;
    this.benchmarker = new PerformanceBenchmarker();
    this.reporter = new BenchmarkReporter();
    this.analyzer = new PerformanceAnalyzer();
    this.baselineComparator = new BaselineComparator();
    this.regressionDetector = new RegressionDetector();

    this.setupEventHandlers();
  }

  public async runAllSuites(): Promise<IntegrationTestReport> {
    const startTime = performance.now();

    this.emit('start', {
      message: 'Starting comprehensive performance benchmark suite',
      suites: this.config.suites,
      config: this.config
    });

    try {
      // Setup environment
      await this.setupTestEnvironment();

      // Load baselines if enabled
      let baselines: Map<string, any> = new Map();
      if (this.config.enableBaseline) {
        baselines = await this.loadBaselines();
      }

      // Run benchmark suites
      if (this.config.parallelExecution) {
        await this.runSuitesInParallel();
      } else {
        await this.runSuitesSequentially();
      }

      // Generate analysis
      const regressionAnalysis = this.config.enableRegression
        ? await this.generateRegressionAnalysis()
        : undefined;

      const baselineComparison = this.config.enableBaseline
        ? await this.generateBaselineComparison(baselines)
        : undefined;

      // Generate recommendations
      const recommendations = await this.generateRecommendations();

      // Create final report
      const report = await this.generateIntegrationReport(
        startTime,
        regressionAnalysis,
        baselineComparison,
        recommendations
      );

      // Save report and artifacts
      await this.saveReportAndArtifacts(report);

      this.emit('complete', {
        report,
        success: report.summary.failedSuites === 0,
        duration: report.summary.totalDuration
      });

      return report;

    } catch (error) {
      const errorReport = await this.generateErrorReport(error, startTime);
      this.emit('error', { error, report: errorReport });
      throw error;
    }
  }

  private async setupTestEnvironment(): Promise<void> {
    this.emit('setup', { message: 'Setting up test environment' });

    // Create output directories
    await this.ensureDirectoryExists(this.config.outputDirectory);
    await this.ensureDirectoryExists(this.config.baselineDirectory);

    // Verify system resources
    await this.verifySystemResources();

    // Setup monitoring
    if (this.config.enableProfiling) {
      await this.setupPerformanceProfiling();
    }

    this.emit('setup-complete', { message: 'Test environment ready' });
  }

  private async verifySystemResources(): Promise<void> {
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    if (memoryUsagePercent > 80) {
      const warning = `High memory usage detected: ${memoryUsagePercent.toFixed(1)}%`;
      this.emit('warning', { message: warning });
    }

    const loadAverage = os.loadavg()[0];
    const cpuCores = os.cpus().length;
    const loadPercent = (loadAverage / cpuCores) * 100;

    if (loadPercent > 70) {
      const warning = `High CPU load detected: ${loadPercent.toFixed(1)}%`;
      this.emit('warning', { message: warning });
    }
  }

  private async setupPerformanceProfiling(): Promise<void> {
    // Setup Node.js performance monitoring
    if (global.gc) {
      // GC monitoring is available
      this.emit('profiling', { message: 'GC monitoring enabled' });
    }

    // Setup performance mark tracking
    performance.mark('integration-test-start');
  }

  private async runSuitesSequentially(): Promise<void> {
    for (const suiteName of this.config.suites) {
      if (this.config.failFast && this.hasFailures()) {
        this.emit('skip', {
          suite: suiteName,
          reason: 'Fail-fast mode enabled and previous failures detected'
        });
        continue;
      }

      await this.runSingleSuite(suiteName);
    }
  }

  private async runSuitesInParallel(): Promise<void> {
    const chunks = this.chunkArray(this.config.suites, this.config.maxConcurrentSuites);

    for (const chunk of chunks) {
      const promises = chunk.map(suiteName => this.runSingleSuite(suiteName));
      await Promise.all(promises);

      if (this.config.failFast && this.hasFailures()) {
        this.emit('skip', {
          reason: 'Fail-fast mode enabled and failures detected in parallel batch'
        });
        break;
      }
    }
  }

  private async runSingleSuite(suiteName: string): Promise<TestSuiteResult> {
    const startTime = performance.now();

    this.emit('suite-start', {
      suite: suiteName,
      message: `Starting ${suiteName} benchmark suite`
    });

    try {
      const suite = await this.createSuiteInstance(suiteName);
      this.activeSuites.set(suiteName, suite);

      // Run the benchmark suite with retry logic
      let results: BenchmarkResult[] = [];
      let attempt = 0;
      let lastError: Error | undefined;

      while (attempt <= this.config.retryCount) {
        try {
          const suiteConfig = this.getSuiteConfig(suiteName);
          results = await this.benchmarker.runSuite(suite, suiteConfig);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          attempt++;

          if (attempt <= this.config.retryCount) {
            this.emit('retry', {
              suite: suiteName,
              attempt,
              error: lastError.message,
              message: `Retrying ${suiteName} (attempt ${attempt}/${this.config.retryCount})`
            });
            await this.sleep(1000 * attempt); // Exponential backoff
          }
        }
      }

      if (results.length === 0 && lastError) {
        throw lastError;
      }

      // Analyze results
      const analysis = await this.analyzer.analyzeResults(results);
      const warnings = this.detectWarnings(results, analysis);

      const endTime = performance.now();
      const duration = endTime - startTime;

      const suiteResult: TestSuiteResult = {
        suiteName,
        success: results.every(r => r.passed),
        duration,
        results,
        errors: [],
        warnings
      };

      this.results.push(suiteResult);

      this.emit('suite-complete', {
        suite: suiteName,
        success: suiteResult.success,
        duration,
        results: results.length,
        warnings: warnings.length
      });

      return suiteResult;

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const suiteResult: TestSuiteResult = {
        suiteName,
        success: false,
        duration,
        results: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };

      this.results.push(suiteResult);

      this.emit('suite-error', {
        suite: suiteName,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      return suiteResult;

    } finally {
      this.activeSuites.delete(suiteName);
    }
  }

  private async createSuiteInstance(suiteName: string): Promise<any> {
    switch (suiteName.toLowerCase()) {
      case 'api':
        return new APIBenchmarkSuite(defaultAPIBenchmarkConfig);
      case 'database':
        return new DatabaseBenchmarkSuite(defaultDatabaseBenchmarkConfig);
      case 'swarm':
        return new SwarmBenchmarkSuite(defaultSwarmBenchmarkConfig);
      case 'memory':
        return new MemoryBenchmarkSuite(defaultMemoryBenchmarkConfig);
      case 'cpu':
        return new CPUBenchmarkSuite(defaultCPUBenchmarkConfig);
      case 'network':
        return new NetworkBenchmarkSuite(defaultNetworkBenchmarkConfig);
      default:
        throw new Error(`Unknown benchmark suite: ${suiteName}`);
    }
  }

  private getSuiteConfig(suiteName: string): BenchmarkConfig {
    // Return appropriate config for each suite
    switch (suiteName.toLowerCase()) {
      case 'api':
        return defaultAPIBenchmarkConfig;
      case 'database':
        return defaultDatabaseBenchmarkConfig;
      case 'swarm':
        return defaultSwarmBenchmarkConfig;
      case 'memory':
        return defaultMemoryBenchmarkConfig;
      case 'cpu':
        return defaultCPUBenchmarkConfig;
      case 'network':
        return defaultNetworkBenchmarkConfig;
      default:
        return { iterations: 100 };
    }
  }

  private detectWarnings(results: BenchmarkResult[], analysis: any): string[] {
    const warnings: string[] = [];

    // Check for performance thresholds
    for (const result of results) {
      if (result.metrics.errorRate && result.metrics.errorRate.value > 5) {
        warnings.push(`High error rate detected in ${result.testName}: ${result.metrics.errorRate.value}%`);
      }

      if (result.metrics.latency && result.metrics.latency.p99 > this.config.thresholds.performance) {
        warnings.push(`High P99 latency detected in ${result.testName}: ${result.metrics.latency.p99}ms`);
      }
    }

    // Check for resource usage
    if (analysis.resourceUsage) {
      if (analysis.resourceUsage.avgMemory > this.config.thresholds.memory) {
        warnings.push(`High memory usage detected: ${analysis.resourceUsage.avgMemory} MB`);
      }

      if (analysis.resourceUsage.avgCPU > this.config.thresholds.cpu) {
        warnings.push(`High CPU usage detected: ${analysis.resourceUsage.avgCPU}%`);
      }
    }

    return warnings;
  }

  private async loadBaselines(): Promise<Map<string, any>> {
    const baselines = new Map<string, any>();

    for (const suiteName of this.config.suites) {
      try {
        const baselinePath = path.join(this.config.baselineDirectory, `${suiteName}-baseline.json`);
        if (fs.existsSync(baselinePath)) {
          const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
          baselines.set(suiteName, baselineData);
        }
      } catch (error) {
        this.emit('warning', {
          message: `Failed to load baseline for ${suiteName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return baselines;
  }

  private async generateRegressionAnalysis(): Promise<any> {
    const allResults = this.results.flatMap(suite => suite.results);

    if (allResults.length === 0) {
      return null;
    }

    try {
      return await this.regressionDetector.detectRegressions(allResults);
    } catch (error) {
      this.emit('warning', {
        message: `Regression analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return null;
    }
  }

  private async generateBaselineComparison(baselines: Map<string, any>): Promise<any> {
    const comparisons = new Map<string, any>();

    for (const suiteResult of this.results) {
      const baseline = baselines.get(suiteResult.suiteName);
      if (baseline && suiteResult.results.length > 0) {
        try {
          const comparison = await this.baselineComparator.compare(suiteResult.results, baseline);
          comparisons.set(suiteResult.suiteName, comparison);
        } catch (error) {
          this.emit('warning', {
            message: `Baseline comparison failed for ${suiteResult.suiteName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    }

    return Object.fromEntries(comparisons);
  }

  private async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze overall results
    const totalSuites = this.results.length;
    const failedSuites = this.results.filter(r => !r.success).length;
    const successRate = ((totalSuites - failedSuites) / totalSuites) * 100;

    if (successRate < 90) {
      recommendations.push(`Low success rate (${successRate.toFixed(1)}%) - investigate failed test suites`);
    }

    // Analyze performance patterns
    const allResults = this.results.flatMap(suite => suite.results);
    const highLatencyTests = allResults.filter(r =>
      r.metrics.latency && r.metrics.latency.p99 > this.config.thresholds.performance
    );

    if (highLatencyTests.length > 0) {
      recommendations.push(`${highLatencyTests.length} tests showing high latency - consider performance optimization`);
    }

    // Resource usage recommendations
    const totalWarnings = this.results.reduce((sum, suite) => sum + suite.warnings.length, 0);
    if (totalWarnings > 5) {
      recommendations.push(`Multiple performance warnings detected (${totalWarnings}) - review system resources`);
    }

    // Suite-specific recommendations
    for (const suite of this.results) {
      if (!suite.success) {
        recommendations.push(`${suite.suiteName} suite failed - check ${suite.errors.length} error(s)`);
      }
    }

    return recommendations;
  }

  private async generateIntegrationReport(
    startTime: number,
    regressionAnalysis?: any,
    baselineComparison?: any,
    recommendations: string[] = []
  ): Promise<IntegrationTestReport> {
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    const passedSuites = this.results.filter(r => r.success).length;
    const failedSuites = this.results.filter(r => !r.success).length;

    const environment = this.captureSystemEnvironment();

    // Generate CI artifacts
    const ciArtifacts = await this.generateCIArtifacts();

    return {
      summary: {
        totalSuites: this.results.length,
        passedSuites,
        failedSuites,
        totalDuration,
        timestamp: Date.now(),
        environment
      },
      suiteResults: this.results,
      regressionAnalysis,
      baselineComparison,
      recommendations,
      ciArtifacts
    };
  }

  private async generateErrorReport(error: any, startTime: number): Promise<IntegrationTestReport> {
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    return {
      summary: {
        totalSuites: this.config.suites.length,
        passedSuites: 0,
        failedSuites: this.config.suites.length,
        totalDuration,
        timestamp: Date.now(),
        environment: this.captureSystemEnvironment()
      },
      suiteResults: this.results,
      recommendations: [
        'Integration test runner encountered a fatal error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Check system resources and configuration'
      ],
      ciArtifacts: {
        exitCode: 1
      }
    };
  }

  private captureSystemEnvironment(): SystemEnvironment {
    const cpus = os.cpus();

    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpuModel: cpus[0]?.model || 'Unknown',
      cpuCores: cpus.length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      hostname: os.hostname(),
      timestamp: Date.now()
    };
  }

  private async generateCIArtifacts(): Promise<any> {
    const exitCode = this.results.some(r => !r.success) ? 1 : 0;
    const artifacts: any = { exitCode };

    // Generate JUnit XML report for CI systems
    if (this.config.reportFormats.includes('junit')) {
      try {
        const junitReport = await this.generateJUnitReport();
        artifacts.junitReport = junitReport;
      } catch (error) {
        this.emit('warning', {
          message: `Failed to generate JUnit report: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // Generate performance report
    if (this.config.reportFormats.includes('performance')) {
      try {
        const performanceReport = await this.generatePerformanceReport();
        artifacts.performanceReport = performanceReport;
      } catch (error) {
        this.emit('warning', {
          message: `Failed to generate performance report: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return artifacts;
  }

  private async generateJUnitReport(): Promise<string> {
    const testSuites = this.results.map(suite => {
      const testCases = suite.results.map(result => {
        const failure = !result.passed ? `<failure message="Test failed">${result.testName} did not meet performance criteria</failure>` : '';
        return `
          <testcase name="${result.testName}" classname="${suite.suiteName}" time="${(result.duration / 1000).toFixed(3)}">
            ${failure}
          </testcase>
        `;
      }).join('');

      return `
        <testsuite name="${suite.suiteName}" tests="${suite.results.length}" failures="${suite.results.filter(r => !r.passed).length}" time="${(suite.duration / 1000).toFixed(3)}">
          ${testCases}
        </testsuite>
      `;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
      <testsuites>
        ${testSuites}
      </testsuites>
    `;
  }

  private async generatePerformanceReport(): Promise<string> {
    const allResults = this.results.flatMap(suite => suite.results);

    return JSON.stringify({
      timestamp: Date.now(),
      environment: this.captureSystemEnvironment(),
      summary: {
        totalTests: allResults.length,
        passedTests: allResults.filter(r => r.passed).length,
        avgDuration: allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
      },
      suites: this.results.map(suite => ({
        name: suite.suiteName,
        success: suite.success,
        duration: suite.duration,
        testCount: suite.results.length,
        passRate: (suite.results.filter(r => r.passed).length / suite.results.length) * 100
      })),
      results: allResults
    }, null, 2);
  }

  private async saveReportAndArtifacts(report: IntegrationTestReport): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Save main report
    const reportPath = path.join(this.config.outputDirectory, `integration-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save individual suite reports
    for (const suite of this.results) {
      const suitePath = path.join(this.config.outputDirectory, `${suite.suiteName}-report-${timestamp}.json`);
      fs.writeFileSync(suitePath, JSON.stringify(suite, null, 2));
    }

    // Save CI artifacts
    if (report.ciArtifacts.junitReport) {
      const junitPath = path.join(this.config.outputDirectory, `junit-report-${timestamp}.xml`);
      fs.writeFileSync(junitPath, report.ciArtifacts.junitReport);
    }

    if (report.ciArtifacts.performanceReport) {
      const perfPath = path.join(this.config.outputDirectory, `performance-report-${timestamp}.json`);
      fs.writeFileSync(perfPath, report.ciArtifacts.performanceReport);
    }

    // Generate HTML reports if requested
    if (this.config.reportFormats.includes('html')) {
      await this.generateHTMLReport(report, timestamp);
    }

    this.emit('reports-saved', {
      reportPath,
      outputDirectory: this.config.outputDirectory,
      timestamp
    });
  }

  private async generateHTMLReport(report: IntegrationTestReport, timestamp: string): Promise<void> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Performance Benchmark Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .suite { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
          .success { background: #d4edda; border-color: #c3e6cb; }
          .failure { background: #f8d7da; border-color: #f5c6cb; }
          .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; }
          .metric { background: white; padding: 10px; border-radius: 3px; border: 1px solid #eee; }
          .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Performance Benchmark Report</h1>

        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Suites:</strong> ${report.summary.totalSuites}</p>
          <p><strong>Passed:</strong> ${report.summary.passedSuites}</p>
          <p><strong>Failed:</strong> ${report.summary.failedSuites}</p>
          <p><strong>Duration:</strong> ${(report.summary.totalDuration / 1000).toFixed(2)}s</p>
          <p><strong>Environment:</strong> ${report.summary.environment.platform} ${report.summary.environment.arch}</p>
        </div>

        ${report.suiteResults.map(suite => `
          <div class="suite ${suite.success ? 'success' : 'failure'}">
            <h3>${suite.suiteName} ${suite.success ? '✅' : '❌'}</h3>
            <p><strong>Duration:</strong> ${(suite.duration / 1000).toFixed(2)}s</p>
            <p><strong>Tests:</strong> ${suite.results.length}</p>
            ${suite.warnings.length > 0 ? `<p><strong>Warnings:</strong> ${suite.warnings.join(', ')}</p>` : ''}
            ${suite.errors.length > 0 ? `<p><strong>Errors:</strong> ${suite.errors.join(', ')}</p>` : ''}
          </div>
        `).join('')}

        ${report.recommendations.length > 0 ? `
          <div class="recommendations">
            <h2>Recommendations</h2>
            <ul>
              ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    const htmlPath = path.join(this.config.outputDirectory, `performance-report-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
  }

  private setupEventHandlers(): void {
    // Forward benchmarker events
    this.benchmarker.on('progress', (data) => this.emit('benchmark-progress', data));
    this.benchmarker.on('test-start', (data) => this.emit('test-start', data));
    this.benchmarker.on('test-complete', (data) => this.emit('test-complete', data));
  }

  private hasFailures(): boolean {
    return this.results.some(result => !result.success);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async ensureDirectoryExists(directory: string): Promise<void> {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API for external usage
  public async runSuite(suiteName: string): Promise<TestSuiteResult> {
    return await this.runSingleSuite(suiteName);
  }

  public getResults(): TestSuiteResult[] {
    return [...this.results];
  }

  public async saveBaseline(suiteName: string, results: BenchmarkResult[]): Promise<void> {
    const baselinePath = path.join(this.config.baselineDirectory, `${suiteName}-baseline.json`);
    const baseline = {
      timestamp: Date.now(),
      environment: this.captureSystemEnvironment(),
      results
    };
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
  }
}

// Example usage and default configuration
export const defaultIntegrationTestConfig: IntegrationTestConfig = {
  suites: ['api', 'database', 'swarm', 'memory', 'cpu', 'network'],
  outputDirectory: './test-results',
  baselineDirectory: './baselines',
  reportFormats: ['json', 'html', 'junit'],
  enableRegression: true,
  enableBaseline: true,
  enableProfiling: true,
  parallelExecution: false,
  maxConcurrentSuites: 2,
  ciMode: process.env.CI === 'true',
  failFast: false,
  timeout: 600000, // 10 minutes
  retryCount: 2,
  thresholds: {
    regression: 10, // 10% regression threshold
    performance: 1000, // 1 second latency threshold
    memory: 1024, // 1GB memory threshold
    cpu: 80 // 80% CPU threshold
  }
};

// CLI interface for running integration tests
export async function runIntegrationTests(config: Partial<IntegrationTestConfig> = {}): Promise<IntegrationTestReport> {
  const finalConfig = { ...defaultIntegrationTestConfig, ...config };
  const runner = new IntegrationTestRunner(finalConfig);

  // Setup event logging
  runner.on('start', (data) => console.log(`🚀 ${data.message}`));
  runner.on('suite-start', (data) => console.log(`📊 Starting ${data.suite} suite`));
  runner.on('suite-complete', (data) => {
    const status = data.success ? '✅' : '❌';
    console.log(`${status} ${data.suite} completed in ${(data.duration / 1000).toFixed(2)}s (${data.results} tests)`);
  });
  runner.on('suite-error', (data) => console.error(`❌ ${data.suite} failed: ${data.error}`));
  runner.on('warning', (data) => console.warn(`⚠️  ${data.message}`));
  runner.on('complete', (data) => {
    const status = data.success ? '✅' : '❌';
    console.log(`${status} Integration tests completed in ${(data.duration / 1000).toFixed(2)}s`);
  });

  return await runner.runAllSuites();
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T08:09:15-04:00 | claude@sonnet-4 | Created comprehensive integration test runner that orchestrates all benchmark suites with real system integration, automated reporting, CI/CD pipeline support, regression detection, baseline comparison, and multi-format report generation | integration-test-runner.ts | OK | -- | 0.00 | 7a6b9e4 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: integration-runner-creation-001
- inputs: ["Integration test requirements", "CI/CD patterns", "Reporting frameworks"]
- tools_used: ["Write", "performance", "filesystem", "reporting systems", "test orchestration"]
- versions: {"model":"claude-sonnet-4","prompt":"integration-runner-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->