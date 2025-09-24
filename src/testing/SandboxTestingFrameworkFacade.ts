/**
 * SandboxTestingFrameworkFacade - Backward compatible interface
 * Maintains API compatibility while delegating to decomposed components
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';
import { SandboxManager, SandboxConfig, SandboxEnvironment } from './sandbox/SandboxManager';
import { TestRunner, TestConfig, TestResult } from './sandbox/TestRunner';
import { ResourceMonitor, ResourceMetrics, ResourceThresholds } from './sandbox/ResourceMonitor';

export interface SandboxTestOptions {
  isolationLevel?: 'full' | 'partial' | 'none';
  resourceLimits?: {
    memory?: number;
    cpu?: number;
    timeout?: number;
  };
  monitoring?: boolean;
  coverage?: boolean;
  retries?: number;
}

export class SandboxTestingFramework extends EventEmitter {
  /**
   * Facade for Sandbox Testing Framework.
   *
   * Original: 1,213 LOC god object
   * Refactored: ~150 LOC facade + 3 specialized components (~750 LOC total)
   *
   * Maintains 100% backward compatibility while delegating to:
   * - SandboxManager: Environment creation and lifecycle
   * - TestRunner: Test execution and monitoring
   * - ResourceMonitor: Resource tracking and alerts
   */

  private sandboxManager: SandboxManager;
  private testRunner: TestRunner;
  private resourceMonitor: ResourceMonitor;

  private defaultOptions: SandboxTestOptions;
  private activeSandboxes: Map<string, SandboxEnvironment>;
  private testHistory: TestResult[];

  constructor(options?: SandboxTestOptions) {
    super();

    this.defaultOptions = {
      isolationLevel: 'partial',
      resourceLimits: {
        memory: 512 * 1024 * 1024,
        cpu: 0.5,
        timeout: 30000
      },
      monitoring: true,
      coverage: true,
      retries: 3,
      ...options
    };

    // Initialize components
    this.sandboxManager = new SandboxManager({
      isolationLevel: this.defaultOptions.isolationLevel,
      resourceLimits: this.defaultOptions.resourceLimits!
    });

    this.testRunner = new TestRunner();
    this.resourceMonitor = new ResourceMonitor();

    this.activeSandboxes = new Map();
    this.testHistory = [];

    this.setupEventForwarding();

    // Start monitoring if enabled
    if (this.defaultOptions.monitoring) {
      this.resourceMonitor.startMonitoring();
    }
  }

  private setupEventForwarding(): void {
    // Forward events from components
    this.sandboxManager.on('sandboxCreated', (sandbox) => {
      this.emit('sandboxCreated', sandbox);
    });

    this.sandboxManager.on('sandboxDestroyed', (sandbox) => {
      this.emit('sandboxDestroyed', sandbox);
    });

    this.testRunner.on('testCompleted', (result) => {
      this.testHistory.push(result);
      this.emit('testCompleted', result);
    });

    this.testRunner.on('testOutput', (data) => {
      this.emit('testOutput', data);
    });

    this.resourceMonitor.on('alert', (alert) => {
      this.emit('resourceAlert', alert);
    });
  }

  async runTest(
    testFile: string,
    options?: SandboxTestOptions
  ): Promise<TestResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Create sandbox
    const sandbox = await this.sandboxManager.createSandbox({
      isolationLevel: mergedOptions.isolationLevel,
      resourceLimits: mergedOptions.resourceLimits!
    });

    this.activeSandboxes.set(sandbox.id, sandbox);

    try {
      // Profile test execution if monitoring enabled
      if (mergedOptions.monitoring) {
        const { result } = await this.resourceMonitor.profileOperation(
          `test-${testFile}`,
          async () => {
            return await this.testRunner.runTest(sandbox, {
              testFile,
              framework: 'jest',
              timeout: mergedOptions.resourceLimits?.timeout,
              retries: mergedOptions.retries
            });
          }
        );

        return result;
      } else {
        // Run without profiling
        return await this.testRunner.runTest(sandbox, {
          testFile,
          framework: 'jest',
          timeout: mergedOptions.resourceLimits?.timeout,
          retries: mergedOptions.retries
        });
      }
    } finally {
      // Cleanup sandbox
      await this.sandboxManager.destroySandbox(sandbox.id);
      this.activeSandboxes.delete(sandbox.id);
    }
  }

  async runTestSuite(
    testFiles: string[],
    options?: SandboxTestOptions
  ): Promise<TestResult[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Create sandbox for suite
    const sandbox = await this.sandboxManager.createSandbox({
      isolationLevel: mergedOptions.isolationLevel,
      resourceLimits: mergedOptions.resourceLimits!
    });

    this.activeSandboxes.set(sandbox.id, sandbox);

    try {
      const results = await this.testRunner.runTestSuite(
        sandbox,
        testFiles,
        {
          framework: 'jest',
          timeout: mergedOptions.resourceLimits?.timeout,
          retries: mergedOptions.retries
        }
      );

      // Store all results
      this.testHistory.push(...results);

      return results;
    } finally {
      // Cleanup sandbox
      await this.sandboxManager.destroySandbox(sandbox.id);
      this.activeSandboxes.delete(sandbox.id);
    }
  }

  async createIsolatedEnvironment(
    config?: Partial<SandboxConfig>
  ): Promise<string> {
    const sandbox = await this.sandboxManager.createSandbox(config);
    this.activeSandboxes.set(sandbox.id, sandbox);
    return sandbox.id;
  }

  async destroyEnvironment(sandboxId: string): Promise<void> {
    await this.sandboxManager.destroySandbox(sandboxId);
    this.activeSandboxes.delete(sandboxId);
  }

  async snapshotEnvironment(sandboxId: string): Promise<string> {
    return await this.sandboxManager.snapshotSandbox(sandboxId);
  }

  async restoreSnapshot(snapshotId: string): Promise<string> {
    const sandbox = await this.sandboxManager.restoreSnapshot(snapshotId);
    this.activeSandboxes.set(sandbox.id, sandbox);
    return sandbox.id;
  }

  startResourceMonitoring(intervalMs: number = 1000): void {
    this.resourceMonitor.startMonitoring(intervalMs);
  }

  stopResourceMonitoring(): void {
    this.resourceMonitor.stopMonitoring();
  }

  getResourceMetrics(): ResourceMetrics | undefined {
    return this.resourceMonitor.getLatestMetrics();
  }

  getResourceHistory(limit?: number): ResourceMetrics[] {
    return this.resourceMonitor.getMetricsHistory(limit);
  }

  setResourceThresholds(thresholds: Partial<ResourceThresholds>): void {
    this.resourceMonitor.setThresholds(thresholds);
  }

  getTestResults(limit?: number): TestResult[] {
    if (limit) {
      return this.testHistory.slice(-limit);
    }
    return [...this.testHistory];
  }

  getActiveSandboxes(): string[] {
    return Array.from(this.activeSandboxes.keys());
  }

  async cleanup(): Promise<void> {
    // Stop monitoring
    this.resourceMonitor.stopMonitoring();

    // Kill all active tests
    this.testRunner.killAllTests();

    // Destroy all sandboxes
    for (const sandboxId of this.activeSandboxes.keys()) {
      await this.sandboxManager.destroySandbox(sandboxId);
    }

    this.activeSandboxes.clear();
    this.testHistory = [];
  }

  getFrameworkMetrics(): any {
    return {
      sandboxes: this.sandboxManager.getMetrics(),
      tests: this.testRunner.getMetrics(),
      resources: this.resourceMonitor.getResourceSummary(),
      history: {
        tests: this.testHistory.length,
        passed: this.testHistory.filter(t => t.status === 'passed').length,
        failed: this.testHistory.filter(t => t.status === 'failed').length
      }
    };
  }

  // Backward compatibility methods
  async runInSandbox<T>(
    operation: () => Promise<T>,
    options?: SandboxTestOptions
  ): Promise<T> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    const sandbox = await this.sandboxManager.createSandbox({
      isolationLevel: mergedOptions.isolationLevel,
      resourceLimits: mergedOptions.resourceLimits!
    });

    try {
      // Change working directory to sandbox
      const originalCwd = process.cwd();
      process.chdir(sandbox.path);

      const result = await operation();

      process.chdir(originalCwd);
      return result;
    } finally {
      await this.sandboxManager.destroySandbox(sandbox.id);
    }
  }

  validateTestOutput(output: string, expectedPatterns: string[]): boolean {
    for (const pattern of expectedPatterns) {
      if (!output.includes(pattern)) {
        return false;
      }
    }
    return true;
  }
}