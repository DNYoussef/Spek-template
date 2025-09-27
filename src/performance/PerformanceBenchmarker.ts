import { performance, PerformanceObserver } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as os from 'os';
import * as process from 'process';
import { CrossPlatformRunner } from './CrossPlatformRunner';
import { MetricsCollector } from './MetricsCollector';
import { LoadGenerator } from './LoadGenerator';
import { StressTestRunner } from './StressTestRunner';
import { MemoryProfiler } from './MemoryProfiler';
import { CPUProfiler } from './CPUProfiler';
import { NetworkProfiler } from './NetworkProfiler';
import { BenchmarkReporter } from './BenchmarkReporter';
import { PerformanceAnalyzer } from './PerformanceAnalyzer';
import { BaselineComparator } from './BaselineComparator';
import { RegressionDetector } from './RegressionDetector';

export interface BenchmarkConfig {
  name: string;
  warmupRuns: number;
  benchmarkRuns: number;
  concurrency: number;
  timeout: number;
  collectMemory: boolean;
  collectCPU: boolean;
  collectNetwork: boolean;
  enableProfiling: boolean;
  outputFormat: 'json' | 'csv' | 'html' | 'all';
  baselineFile?: string;
  regressionThreshold: number;
}

export interface BenchmarkSuite {
  name: string;
  description: string;
  tests: BenchmarkTest[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface BenchmarkTest {
  name: string;
  description: string;
  fn: () => Promise<any> | any;
  iterations?: number;
  timeout?: number;
  expectedMetrics?: {
    maxMemoryMB?: number;
    maxCPUPercent?: number;
    maxDurationMs?: number;
  };
}

export interface BenchmarkResult {
  suite: string;
  test: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  timestamp: number;
  iterations: number;
  duration: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stddev: number;
    p95: number;
    p99: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
  };
  cpu: {
    user: number;
    system: number;
    percentage: number;
  };
  network?: {
    bytesRead: number;
    bytesWritten: number;
    connectionsActive: number;
  };
  system: {
    loadAverage: number[];
    freeMemory: number;
    totalMemory: number;
    uptime: number;
  };
  success: boolean;
  error?: string;
  warnings: string[];
}

export class PerformanceBenchmarker extends EventEmitter {
  private crossPlatformRunner: CrossPlatformRunner;
  private metricsCollector: MetricsCollector;
  private loadGenerator: LoadGenerator;
  private stressTestRunner: StressTestRunner;
  private memoryProfiler: MemoryProfiler;
  private cpuProfiler: CPUProfiler;
  private networkProfiler: NetworkProfiler;
  private reporter: BenchmarkReporter;
  private analyzer: PerformanceAnalyzer;
  private baselineComparator: BaselineComparator;
  private regressionDetector: RegressionDetector;
  private performanceObserver: PerformanceObserver;
  private results: BenchmarkResult[] = [];

  constructor() {
    super();
    this.initializeComponents();
    this.setupPerformanceObserver();
  }

  private initializeComponents(): void {
    this.crossPlatformRunner = new CrossPlatformRunner();
    this.metricsCollector = new MetricsCollector();
    this.loadGenerator = new LoadGenerator();
    this.stressTestRunner = new StressTestRunner();
    this.memoryProfiler = new MemoryProfiler();
    this.cpuProfiler = new CPUProfiler();
    this.networkProfiler = new NetworkProfiler();
    this.reporter = new BenchmarkReporter();
    this.analyzer = new PerformanceAnalyzer();
    this.baselineComparator = new BaselineComparator();
    this.regressionDetector = new RegressionDetector();
  }

  private setupPerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.emit('performance-entry', entry);
      });
    });

    this.performanceObserver.observe({
      entryTypes: ['measure', 'mark', 'function', 'navigation', 'resource']
    });
  }

  async runSuite(suite: BenchmarkSuite, config: BenchmarkConfig): Promise<BenchmarkResult[]> {
    console.log(`Starting benchmark suite: ${suite.name}`);
    this.emit('suite-start', { suite: suite.name, config });

    const suiteResults: BenchmarkResult[] = [];

    try {
      // Suite setup
      if (suite.setup) {
        console.log('Running suite setup...');
        await suite.setup();
      }

      // Start profiling if enabled
      if (config.enableProfiling) {
        await this.startProfiling(config);
      }

      // Run each test in the suite
      for (const test of suite.tests) {
        console.log(`Running test: ${test.name}`);
        this.emit('test-start', { suite: suite.name, test: test.name });

        try {
          const result = await this.runTest(suite, test, config);
          suiteResults.push(result);
          this.results.push(result);

          this.emit('test-complete', {
            suite: suite.name,
            test: test.name,
            result
          });

          // Validate against expected metrics
          if (test.expectedMetrics) {
            this.validateTestMetrics(result, test.expectedMetrics);
          }

        } catch (error) {
          console.error(`Test ${test.name} failed:`, error);
          const failedResult: BenchmarkResult = {
            suite: suite.name,
            test: test.name,
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            timestamp: Date.now(),
            iterations: 0,
            duration: { mean: 0, median: 0, min: 0, max: 0, stddev: 0, p95: 0, p99: 0 },
            memory: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0, arrayBuffers: 0 },
            cpu: { user: 0, system: 0, percentage: 0 },
            system: {
              loadAverage: os.loadavg(),
              freeMemory: os.freemem(),
              totalMemory: os.totalmem(),
              uptime: os.uptime()
            },
            success: false,
            error: error instanceof Error ? error.message : String(error),
            warnings: []
          };

          suiteResults.push(failedResult);
          this.results.push(failedResult);

          this.emit('test-error', {
            suite: suite.name,
            test: test.name,
            error
          });
        }
      }

      // Stop profiling
      if (config.enableProfiling) {
        await this.stopProfiling();
      }

      // Suite teardown
      if (suite.teardown) {
        console.log('Running suite teardown...');
        await suite.teardown();
      }

    } catch (error) {
      console.error(`Suite ${suite.name} failed:`, error);
      this.emit('suite-error', { suite: suite.name, error });
      throw error;
    }

    this.emit('suite-complete', {
      suite: suite.name,
      results: suiteResults
    });

    return suiteResults;
  }

  private async runTest(
    suite: BenchmarkSuite,
    test: BenchmarkTest,
    config: BenchmarkConfig
  ): Promise<BenchmarkResult> {
    const iterations = test.iterations || config.benchmarkRuns;
    const durations: number[] = [];
    const memorySnapshots: any[] = [];
    const cpuSnapshots: any[] = [];
    const warnings: string[] = [];

    // Warmup runs
    console.log(`Warmup: ${config.warmupRuns} runs`);
    for (let i = 0; i < config.warmupRuns; i++) {
      try {
        await this.executeTest(test);
      } catch (error) {
        warnings.push(`Warmup run ${i + 1} failed: ${error}`);
      }
    }

    // Force garbage collection before benchmark
    if (global.gc) {
      global.gc();
    }

    // Benchmark runs
    console.log(`Benchmark: ${iterations} runs`);
    for (let i = 0; i < iterations; i++) {
      const memoryBefore = process.memoryUsage();
      const cpuBefore = process.cpuUsage();

      performance.mark(`test-${test.name}-start-${i}`);

      const startTime = performance.now();

      try {
        await this.executeTest(test, test.timeout || config.timeout);

        const endTime = performance.now();
        const duration = endTime - startTime;
        durations.push(duration);

        performance.mark(`test-${test.name}-end-${i}`);
        performance.measure(
          `test-${test.name}-measure-${i}`,
          `test-${test.name}-start-${i}`,
          `test-${test.name}-end-${i}`
        );

      } catch (error) {
        warnings.push(`Benchmark run ${i + 1} failed: ${error}`);
        continue;
      }

      const memoryAfter = process.memoryUsage();
      const cpuAfter = process.cpuUsage(cpuBefore);

      memorySnapshots.push({
        before: memoryBefore,
        after: memoryAfter,
        delta: {
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
          external: memoryAfter.external - memoryBefore.external,
          rss: memoryAfter.rss - memoryBefore.rss,
          arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers
        }
      });

      cpuSnapshots.push(cpuAfter);
    }

    // Analyze results
    const stats = this.analyzer.calculateStatistics(durations);
    const memoryStats = this.analyzer.calculateMemoryStatistics(memorySnapshots);
    const cpuStats = this.analyzer.calculateCPUStatistics(cpuSnapshots);
    const systemMetrics = this.metricsCollector.collectSystemMetrics();

    const result: BenchmarkResult = {
      suite: suite.name,
      test: test.name,
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      timestamp: Date.now(),
      iterations: durations.length,
      duration: stats,
      memory: memoryStats,
      cpu: cpuStats,
      system: {
        loadAverage: systemMetrics.cpu.loadAvg,
        freeMemory: systemMetrics.memory.free,
        totalMemory: systemMetrics.memory.total,
        uptime: os.uptime()
      },
      success: durations.length > 0,
      warnings
    };

    // Add network metrics if profiling enabled
    if (config.collectNetwork) {
      result.network = await this.networkProfiler.getMetrics();
    }

    return result;
  }

  private async executeTest(test: BenchmarkTest, timeout?: number): Promise<any> {
    if (timeout) {
      return Promise.race([
        Promise.resolve(test.fn()),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
        )
      ]);
    }

    return Promise.resolve(test.fn());
  }

  private validateTestMetrics(result: BenchmarkResult, expected: any): void {
    const warnings: string[] = [];

    if (expected.maxMemoryMB && result.memory.heapUsed / 1024 / 1024 > expected.maxMemoryMB) {
      warnings.push(`Memory usage exceeded expected: ${result.memory.heapUsed / 1024 / 1024}MB > ${expected.maxMemoryMB}MB`);
    }

    if (expected.maxCPUPercent && result.cpu.percentage > expected.maxCPUPercent) {
      warnings.push(`CPU usage exceeded expected: ${result.cpu.percentage}% > ${expected.maxCPUPercent}%`);
    }

    if (expected.maxDurationMs && result.duration.mean > expected.maxDurationMs) {
      warnings.push(`Duration exceeded expected: ${result.duration.mean}ms > ${expected.maxDurationMs}ms`);
    }

    if (warnings.length > 0) {
      result.warnings.push(...warnings);
      this.emit('metrics-validation-warning', { test: result.test, warnings });
    }
  }

  private async startProfiling(config: BenchmarkConfig): Promise<void> {
    const promises: Promise<void>[] = [];

    if (config.collectMemory) {
      promises.push(this.memoryProfiler.startProfiling());
    }

    if (config.collectCPU) {
      promises.push(this.cpuProfiler.startProfiling());
    }

    if (config.collectNetwork) {
      promises.push(this.networkProfiler.startProfiling());
    }

    await Promise.all(promises);
  }

  private async stopProfiling(): Promise<void> {
    await Promise.all([
      this.memoryProfiler.stopProfiling(),
      this.cpuProfiler.stopProfiling(),
      this.networkProfiler.stopProfiling()
    ]);
  }

  async generateReport(config: BenchmarkConfig, outputPath?: string): Promise<string[]> {
    console.log('Generating performance report...');

    const analysis = this.analyzer.analyzeResults(this.results);
    const regressions = config.baselineFile ?
      await this.regressionDetector.detectRegressions(
        this.results,
        config.baselineFile,
        config.regressionThreshold
      ) : [];

    return this.reporter.generateReport({
      results: this.results,
      analysis,
      regressions,
      config,
      outputPath
    });
  }

  async runLoadTest(config: any): Promise<any> {
    return this.loadGenerator.generateLoad(config);
  }

  async runStressTest(config: any): Promise<any> {
    return this.stressTestRunner.runStressTest(config);
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
  }

  async compareWithBaseline(baselineFile: string, threshold: number = 0.1): Promise<any> {
    return this.baselineComparator.compare(this.results, baselineFile, threshold);
  }

  destroy(): void {
    this.performanceObserver.disconnect();
    this.removeAllListeners();
  }
}

export default PerformanceBenchmarker;