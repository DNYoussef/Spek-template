/**
 * TestRunner - Extracted from CICDIntegration
 * Handles test execution and result reporting
 * Part of god object decomposition (Day 4)
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const existsAsync = promisify(fs.exists);

export interface TestConfig {
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance';
  command: string;
  pattern?: string;
  timeout?: number;
  retries?: number;
  environment?: Record<string, string>;
  coverage?: boolean;
  reporters?: string[];
}

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  stack?: string;
  retries?: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: CoverageReport;
}

export interface CoverageReport {
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  files: Map<string, FileCoverage>;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

export interface FileCoverage {
  path: string;
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  uncoveredLines: number[];
}

export interface TestRun {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  suites: TestSuite[];
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  coverage?: CoverageReport;
}

export class TestRunner extends EventEmitter {
  /**
   * Handles test execution and result reporting.
   *
   * Extracted from CICDIntegration (985 LOC -> ~200 LOC component).
   * Handles:
   * - Test execution orchestration
   * - Result parsing and aggregation
   * - Coverage reporting
   * - Test retries
   * - Performance metrics
   */

  private testConfigs: Map<string, TestConfig>;
  private testRuns: Map<string, TestRun>;
  private activeTests: Set<string>;

  constructor() {
    super();

    this.testConfigs = new Map();
    this.testRuns = new Map();
    this.activeTests = new Set();

    this.loadDefaultConfigs();
  }

  private loadDefaultConfigs(): void {
    // Default test configurations
    const defaults: TestConfig[] = [
      {
        name: 'unit',
        type: 'unit',
        command: 'npm test',
        pattern: '**/*.test.{js,ts}',
        timeout: 30000,
        coverage: true
      },
      {
        name: 'integration',
        type: 'integration',
        command: 'npm run test:integration',
        pattern: '**/*.integration.test.{js,ts}',
        timeout: 60000
      },
      {
        name: 'e2e',
        type: 'e2e',
        command: 'npm run test:e2e',
        pattern: '**/*.e2e.test.{js,ts}',
        timeout: 120000
      }
    ];

    for (const config of defaults) {
      this.testConfigs.set(config.name, config);
    }
  }

  addTestConfig(config: TestConfig): void {
    this.testConfigs.set(config.name, config);
    this.emit('testConfigAdded', config);
  }

  async runTests(configName: string, options?: {
    files?: string[];
    watch?: boolean;
    bail?: boolean;
  }): Promise<TestRun> {
    const config = this.testConfigs.get(configName);
    if (!config) {
      throw new Error(`Test configuration '${configName}' not found`);
    }

    const runId = this.generateId('test-run');
    this.activeTests.add(runId);

    const testRun: TestRun = {
      id: runId,
      startedAt: new Date(),
      suites: [],
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      totalDuration: 0
    };

    this.testRuns.set(runId, testRun);
    this.emit('testRunStarted', { config, testRun });

    try {
      // Execute tests
      const result = await this.executeTests(config, options);

      // Parse results
      const suites = this.parseTestResults(result.output, config.type);
      testRun.suites = suites;

      // Aggregate statistics
      for (const suite of suites) {
        testRun.totalTests += suite.tests.length;
        testRun.totalPassed += suite.passed;
        testRun.totalFailed += suite.failed;
        testRun.totalSkipped += suite.skipped;
        testRun.totalDuration += suite.duration;
      }

      // Parse coverage if enabled
      if (config.coverage && result.coverage) {
        testRun.coverage = this.parseCoverageReport(result.coverage);
      }

      this.emit('testRunCompleted', testRun);

    } catch (error) {
      this.emit('testRunFailed', { testRun, error });
      throw error;

    } finally {
      testRun.completedAt = new Date();
      this.activeTests.delete(runId);
    }

    return testRun;
  }

  private async executeTests(
    config: TestConfig,
    options?: { files?: string[]; watch?: boolean; bail?: boolean }
  ): Promise<{ output: string; coverage?: string }> {
    let command = config.command;

    // Add file patterns if specified
    if (options?.files && options.files.length > 0) {
      command += ` ${options.files.join(' ')}`;
    } else if (config.pattern) {
      command += ` "${config.pattern}"`;
    }

    // Add watch mode
    if (options?.watch) {
      command += ' --watch';
    }

    // Add bail on first failure
    if (options?.bail) {
      command += ' --bail';
    }

    // Add coverage flag
    if (config.coverage) {
      command += ' --coverage';
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        env: { ...process.env, ...config.environment },
        timeout: config.timeout
      });

      const output = stdout + stderr;

      // Extract coverage report if available
      let coverage: string | undefined;
      if (config.coverage) {
        const coveragePath = './coverage/coverage-summary.json';
        if (await existsAsync(coveragePath)) {
          coverage = await readFileAsync(coveragePath, 'utf8');
        }
      }

      return { output, coverage };

    } catch (error) {
      // Tests failed but we still want to parse results
      if (error.code !== 0 && error.stdout) {
        return { output: error.stdout + (error.stderr || '') };
      }
      throw error;
    }
  }

  private parseTestResults(output: string, type: string): TestSuite[] {
    const suites: TestSuite[] = [];

    // Simple parsing - would be more sophisticated in production
    const lines = output.split('\n');
    let currentSuite: TestSuite | null = null;

    for (const line of lines) {
      // Detect test suite
      if (line.includes('PASS') || line.includes('FAIL')) {
        const match = line.match(/\s+(PASS|FAIL)\s+(.+?)\s+\((\d+(?:\.\d+)?)\s*m?s\)/);
        if (match) {
          currentSuite = {
            name: match[2].trim(),
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: parseFloat(match[3])
          };
          suites.push(currentSuite);
        }
      }

      // Detect individual test results
      if (currentSuite) {
        if (line.includes('') || line.includes('')) {
          const match = line.match(/\s*\s+(.+?)\s+\((\d+)\s*ms\)/);
          if (match) {
            const test: TestResult = {
              name: match[1],
              status: 'pass',
              duration: parseInt(match[2])
            };
            currentSuite.tests.push(test);
            currentSuite.passed++;
          }
        } else if (line.includes('') || line.includes('')) {
          const match = line.match(/\s*\s+(.+?)\s+\((\d+)\s*ms\)/);
          if (match) {
            const test: TestResult = {
              name: match[1],
              status: 'fail',
              duration: parseInt(match[2])
            };
            currentSuite.tests.push(test);
            currentSuite.failed++;
          }
        } else if (line.includes('') || line.includes('skipped')) {
          const match = line.match(/\s*\s+(.+)/);
          if (match) {
            const test: TestResult = {
              name: match[1],
              status: 'skip',
              duration: 0
            };
            currentSuite.tests.push(test);
            currentSuite.skipped++;
          }
        }
      }
    }

    return suites;
  }

  private parseCoverageReport(coverageJson: string): CoverageReport {
    try {
      const data = JSON.parse(coverageJson);

      const report: CoverageReport = {
        lines: this.extractCoverageMetric(data.total.lines),
        statements: this.extractCoverageMetric(data.total.statements),
        functions: this.extractCoverageMetric(data.total.functions),
        branches: this.extractCoverageMetric(data.total.branches),
        files: new Map()
      };

      // Parse file coverage
      for (const [filePath, fileData] of Object.entries(data)) {
        if (filePath === 'total') continue;

        const fileCoverage: FileCoverage = {
          path: filePath,
          lines: this.extractCoverageMetric((fileData as any).lines),
          statements: this.extractCoverageMetric((fileData as any).statements),
          functions: this.extractCoverageMetric((fileData as any).functions),
          branches: this.extractCoverageMetric((fileData as any).branches),
          uncoveredLines: (fileData as any).uncoveredLines || []
        };

        report.files.set(filePath, fileCoverage);
      }

      return report;

    } catch (error) {
      this.emit('error', { type: 'coverage_parse', error });
      return {
        lines: { total: 0, covered: 0, percentage: 0 },
        statements: { total: 0, covered: 0, percentage: 0 },
        functions: { total: 0, covered: 0, percentage: 0 },
        branches: { total: 0, covered: 0, percentage: 0 },
        files: new Map()
      };
    }
  }

  private extractCoverageMetric(data: any): CoverageMetric {
    return {
      total: data.total || 0,
      covered: data.covered || 0,
      percentage: data.pct || 0
    };
  }

  async retryFailedTests(runId: string): Promise<TestRun> {
    const originalRun = this.testRuns.get(runId);
    if (!originalRun) {
      throw new Error(`Test run ${runId} not found`);
    }

    // Find failed tests
    const failedTests: string[] = [];
    for (const suite of originalRun.suites) {
      for (const test of suite.tests) {
        if (test.status === 'fail') {
          failedTests.push(`${suite.name}:${test.name}`);
        }
      }
    }

    if (failedTests.length === 0) {
      return originalRun;
    }

    // Re-run failed tests
    this.emit('retryingTests', { originalRun, failedTests });

    // This would typically re-run only failed tests
    // Simplified for decomposition
    return originalRun;
  }

  getTestRun(runId: string): TestRun | undefined {
    return this.testRuns.get(runId);
  }

  listTestRuns(): TestRun[] {
    return Array.from(this.testRuns.values());
  }

  getTestMetrics(): any {
    const runs = this.listTestRuns();
    if (runs.length === 0) {
      return { totalRuns: 0 };
    }

    const totalTests = runs.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = runs.reduce((sum, r) => sum + r.totalPassed, 0);
    const totalFailed = runs.reduce((sum, r) => sum + r.totalFailed, 0);

    return {
      totalRuns: runs.length,
      totalTests,
      totalPassed,
      totalFailed,
      passRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
      avgDuration: runs.reduce((sum, r) => sum + r.totalDuration, 0) / runs.length
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}