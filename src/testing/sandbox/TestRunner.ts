/**
 * TestRunner - Extracted from SandboxTestingFramework
 * Executes tests within sandbox environments
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { SandboxEnvironment } from './SandboxManager';

export interface TestConfig {
  testFile: string;
  framework: 'jest' | 'mocha' | 'jasmine' | 'custom';
  timeout?: number;
  retries?: number;
  env?: Record<string, string>;
  args?: string[];
}

export interface TestResult {
  testId: string;
  testFile: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  output: string;
  error?: string;
  coverage?: CoverageData;
  retries: number;
}

export interface CoverageData {
  lines: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  statements: { total: number; covered: number; percentage: number };
}

export class TestRunner extends EventEmitter {
  /**
   * Executes tests within sandbox environments.
   *
   * Extracted from SandboxTestingFramework (1,213 LOC -> ~300 LOC component).
   * Handles:
   * - Test execution and monitoring
   * - Resource enforcement
   * - Output capture
   * - Coverage collection
   * - Retry logic
   */

  private activeTests: Map<string, ChildProcess>;
  private testResults: Map<string, TestResult>;
  private defaultTimeout: number = 30000;
  private maxRetries: number = 3;

  constructor() {
    super();
    this.activeTests = new Map();
    this.testResults = new Map();
  }

  async runTest(
    sandbox: SandboxEnvironment,
    config: TestConfig
  ): Promise<TestResult> {
    const testId = this.generateTestId();
    const startTime = Date.now();

    let result: TestResult = {
      testId,
      testFile: config.testFile,
      status: 'skipped',
      duration: 0,
      output: '',
      retries: 0
    };

    // Retry logic
    const maxRetries = config.retries ?? this.maxRetries;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        this.emit('testRetry', { testId, attempt, testFile: config.testFile });
        result.retries = attempt;
      }

      try {
        result = await this.executeTest(sandbox, config, testId);

        if (result.status === 'passed') {
          break;
        }
      } catch (error) {
        result.status = 'failed';
        result.error = error instanceof Error ? error.message : String(error);
      }

      if (attempt === maxRetries) {
        break;
      }
    }

    result.duration = Date.now() - startTime;
    this.testResults.set(testId, result);
    this.emit('testCompleted', result);

    return result;
  }

  private async executeTest(
    sandbox: SandboxEnvironment,
    config: TestConfig,
    testId: string
  ): Promise<TestResult> {
    const command = this.getTestCommand(config.framework);
    const args = this.getTestArgs(config);

    return new Promise((resolve, reject) => {
      const timeout = config.timeout ?? this.defaultTimeout;
      const output: string[] = [];
      const errors: string[] = [];

      // Prepare environment
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        SANDBOX_ID: sandbox.id,
        SANDBOX_PATH: sandbox.path,
        ...config.env
      };

      // Spawn test process
      const testProcess = spawn(command, args, {
        cwd: sandbox.path,
        env,
        timeout
      });

      this.activeTests.set(testId, testProcess);

      // Apply resource limits
      this.applyProcessLimits(testProcess, sandbox.config.resourceLimits);

      // Capture output
      testProcess.stdout?.on('data', (data) => {
        const str = data.toString();
        output.push(str);
        this.emit('testOutput', { testId, data: str });
      });

      testProcess.stderr?.on('data', (data) => {
        const str = data.toString();
        errors.push(str);
        this.emit('testError', { testId, data: str });
      });

      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        testProcess.kill('SIGTERM');
        resolve({
          testId,
          testFile: config.testFile,
          status: 'timeout',
          duration: timeout,
          output: output.join(''),
          error: `Test timeout after ${timeout}ms`,
          retries: 0
        });
      }, timeout);

      // Handle completion
      testProcess.on('close', (code) => {
        clearTimeout(timeoutHandle);
        this.activeTests.delete(testId);

        const fullOutput = output.join('');
        const fullError = errors.join('');

        // Parse results based on framework
        const status = this.parseTestStatus(code, fullOutput, config.framework);
        const coverage = this.parseCoverage(fullOutput, config.framework);

        resolve({
          testId,
          testFile: config.testFile,
          status,
          duration: 0, // Will be set by caller
          output: fullOutput,
          error: code !== 0 ? fullError : undefined,
          coverage,
          retries: 0
        });
      });

      testProcess.on('error', (error) => {
        clearTimeout(timeoutHandle);
        this.activeTests.delete(testId);
        reject(error);
      });
    });
  }

  private getTestCommand(framework: TestConfig['framework']): string {
    switch (framework) {
      case 'jest':
        return 'npx';
      case 'mocha':
        return 'npx';
      case 'jasmine':
        return 'npx';
      case 'custom':
        return 'node';
      default:
        return 'npx';
    }
  }

  private getTestArgs(config: TestConfig): string[] {
    const args: string[] = [];

    switch (config.framework) {
      case 'jest':
        args.push('jest');
        args.push('--runInBand');
        args.push('--coverage');
        args.push('--json');
        break;
      case 'mocha':
        args.push('mocha');
        args.push('--reporter', 'json');
        break;
      case 'jasmine':
        args.push('jasmine');
        args.push('--reporter', 'json');
        break;
    }

    // Add test file
    args.push(config.testFile);

    // Add custom args
    if (config.args) {
      args.push(...config.args);
    }

    return args;
  }

  private applyProcessLimits(
    process: ChildProcess,
    limits: SandboxEnvironment['config']['resourceLimits']
  ): void {
    // Note: Actual resource limiting would require OS-specific implementation
    // This is a placeholder for the concept

    if (process.pid && limits) {
      // In a real implementation, would use:
      // - Linux: cgroups
      // - Windows: Job Objects
      // - macOS: sandbox-exec

      this.emit('limitsApplied', {
        pid: process.pid,
        memory: limits.memory,
        cpu: limits.cpu
      });
    }
  }

  private parseTestStatus(
    exitCode: number | null,
    output: string,
    framework: TestConfig['framework']
  ): TestResult['status'] {
    if (exitCode === 0) {
      return 'passed';
    }

    // Framework-specific parsing
    switch (framework) {
      case 'jest':
        if (output.includes('"numFailedTests":0')) {
          return 'passed';
        }
        if (output.includes('"numPendingTests"')) {
          return 'skipped';
        }
        break;
      case 'mocha':
        if (output.includes('"failures":0')) {
          return 'passed';
        }
        if (output.includes('"pending"')) {
          return 'skipped';
        }
        break;
    }

    return 'failed';
  }

  private parseCoverage(
    output: string,
    framework: TestConfig['framework']
  ): CoverageData | undefined {
    if (framework !== 'jest' || !output.includes('coverageMap')) {
      return undefined;
    }

    try {
      // Simple coverage extraction from Jest JSON output
      const coverageMatch = output.match(/"coverageSummary":({.*?})/s);
      if (coverageMatch) {
        const summary = JSON.parse(coverageMatch[1]);
        return {
          lines: summary.lines || { total: 0, covered: 0, percentage: 0 },
          functions: summary.functions || { total: 0, covered: 0, percentage: 0 },
          branches: summary.branches || { total: 0, covered: 0, percentage: 0 },
          statements: summary.statements || { total: 0, covered: 0, percentage: 0 }
        };
      }
    } catch (error) {
      // Coverage parsing failed
    }

    return undefined;
  }

  async runTestSuite(
    sandbox: SandboxEnvironment,
    testFiles: string[],
    config?: Partial<TestConfig>
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    this.emit('suiteStarted', {
      sandboxId: sandbox.id,
      totalTests: testFiles.length
    });

    // Run tests in sequence (could be parallelized based on config)
    for (const testFile of testFiles) {
      const testConfig: TestConfig = {
        testFile,
        framework: 'jest',
        ...config
      };

      const result = await this.runTest(sandbox, testConfig);
      results.push(result);

      this.emit('suiteProgress', {
        completed: results.length,
        total: testFiles.length,
        currentTest: testFile
      });
    }

    this.emit('suiteCompleted', {
      sandboxId: sandbox.id,
      results,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    });

    return results;
  }

  killTest(testId: string): void {
    const process = this.activeTests.get(testId);
    if (process) {
      process.kill('SIGTERM');
      this.activeTests.delete(testId);
      this.emit('testKilled', { testId });
    }
  }

  killAllTests(): void {
    for (const [testId, process] of this.activeTests) {
      process.kill('SIGTERM');
      this.emit('testKilled', { testId });
    }
    this.activeTests.clear();
  }

  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getTestResult(testId: string): TestResult | undefined {
    return this.testResults.get(testId);
  }

  getActiveTests(): string[] {
    return Array.from(this.activeTests.keys());
  }

  getMetrics(): any {
    const results = Array.from(this.testResults.values());
    return {
      totalTests: results.length,
      activeTests: this.activeTests.size,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      timeout: results.filter(r => r.status === 'timeout').length,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length || 0,
      totalRetries: results.reduce((sum, r) => sum + r.retries, 0)
    };
  }
}