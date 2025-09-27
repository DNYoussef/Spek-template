import { EventEmitter } from 'events';
import * as fs from 'fs/promises';

export interface LoadTestConfig {
  name: string;
  targetFunction: () => Promise<any> | any;
  concurrency: number;
  duration: number; // milliseconds
  rampUpTime: number; // milliseconds
  rampDownTime: number; // milliseconds
  requestRate?: number; // requests per second (optional, conflicts with concurrency)
  timeout: number; // per-request timeout
  warmupRequests?: number;
  cooldownRequests?: number;
}

export interface LoadTestResult {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeoutRequests: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  medianResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  standardDeviation: number;
  throughputStats: {
    minThroughput: number;
    maxThroughput: number;
    avgThroughput: number;
  };
  errorRate: number;
  concurrencyAchieved: number;
  memoryUsage: {
    start: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    end: NodeJS.MemoryUsage;
  };
  errors: Array<{
    timestamp: number;
    error: string;
    type: 'timeout' | 'exception' | 'unknown';
  }>;
}

export interface RequestResult {
  requestId: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: any;
  timedOut: boolean;
}

export class LoadTester extends EventEmitter {
  private activeTests = new Map<string, any>();
  private testResults: LoadTestResult[] = [];

  constructor() {
    super();
  }

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    if (this.activeTests.has(config.name)) {
      throw new Error(`Load test '${config.name}' is already running`);
    }

    this.emit('loadTestStart', config);

    const testController = {
      shouldStop: false,
      activeRequests: new Set<string>(),
      results: [] as RequestResult[]
    };

    this.activeTests.set(config.name, testController);

    try {
      const result = await this.executeLoadTest(config, testController);
      this.testResults.push(result);
      this.emit('loadTestEnd', result);
      return result;
    } finally {
      this.activeTests.delete(config.name);
    }
  }

  private async executeLoadTest(config: LoadTestConfig, controller: any): Promise<LoadTestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    let peakMemory = { ...startMemory };

    // Warmup phase
    if (config.warmupRequests && config.warmupRequests > 0) {
      this.emit('warmupStart', { requests: config.warmupRequests });
      await this.runWarmup(config, config.warmupRequests);
      this.emit('warmupEnd');
    }

    // Main load test execution
    this.emit('loadTestExecution', { config });

    const executionPromise = config.requestRate
      ? this.runRateBasedTest(config, controller)
      : this.runConcurrencyBasedTest(config, controller);

    // Memory monitoring
    const memoryMonitor = setInterval(() => {
      const currentMemory = process.memoryUsage();
      if (currentMemory.heapUsed > peakMemory.heapUsed) {
        peakMemory = { ...currentMemory };
      }
    }, 100);

    try {
      await executionPromise;
    } finally {
      clearInterval(memoryMonitor);
    }

    // Cooldown phase
    if (config.cooldownRequests && config.cooldownRequests > 0) {
      this.emit('cooldownStart', { requests: config.cooldownRequests });
      await this.runCooldown(config, config.cooldownRequests);
      this.emit('cooldownEnd');
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    return this.calculateResults(config, controller.results, {
      startTime,
      endTime,
      startMemory,
      peakMemory,
      endMemory
    });
  }

  private async runWarmup(config: LoadTestConfig, requests: number): Promise<void> {
    const warmupPromises: Promise<void>[] = [];

    for (let i = 0; i < requests; i++) {
      warmupPromises.push(this.executeRequest(config.targetFunction, config.timeout, `warmup-${i}`));

      // Small delay between warmup requests
      if (i < requests - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    await Promise.allSettled(warmupPromises);
  }

  private async runCooldown(config: LoadTestConfig, requests: number): Promise<void> {
    const cooldownPromises: Promise<void>[] = [];

    for (let i = 0; i < requests; i++) {
      cooldownPromises.push(this.executeRequest(config.targetFunction, config.timeout, `cooldown-${i}`));

      // Small delay between cooldown requests
      if (i < requests - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    await Promise.allSettled(cooldownPromises);
  }

  private async runConcurrencyBasedTest(config: LoadTestConfig, controller: any): Promise<void> {
    const endTime = Date.now() + config.duration;
    let requestCounter = 0;

    // Ramp up phase
    await this.rampUp(config, controller, () => Date.now() < endTime);

    // Sustained load phase
    const sustainedLoadPromises: Promise<void>[] = [];

    while (Date.now() < endTime && !controller.shouldStop) {
      // Maintain target concurrency
      while (controller.activeRequests.size < config.concurrency && Date.now() < endTime) {
        const requestId = `req-${requestCounter++}`;
        const requestPromise = this.executeRequestWithTracking(
          config.targetFunction,
          config.timeout,
          requestId,
          controller
        );
        sustainedLoadPromises.push(requestPromise);
      }

      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    }

    // Wait for all active requests to complete
    await Promise.allSettled(sustainedLoadPromises);

    // Ramp down phase
    await this.rampDown(config, controller);
  }

  private async runRateBasedTest(config: LoadTestConfig, controller: any): Promise<void> {
    if (!config.requestRate) {
      throw new Error('Request rate not specified for rate-based test');
    }

    const endTime = Date.now() + config.duration;
    const requestInterval = 1000 / config.requestRate; // milliseconds between requests
    let requestCounter = 0;
    let lastRequestTime = Date.now();

    const requestPromises: Promise<void>[] = [];

    while (Date.now() < endTime && !controller.shouldStop) {
      const now = Date.now();
      if (now - lastRequestTime >= requestInterval) {
        const requestId = `rate-req-${requestCounter++}`;
        const requestPromise = this.executeRequestWithTracking(
          config.targetFunction,
          config.timeout,
          requestId,
          controller
        );
        requestPromises.push(requestPromise);
        lastRequestTime = now;
      } else {
        // Wait for the next request time
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    // Wait for all requests to complete
    await Promise.allSettled(requestPromises);
  }

  private async rampUp(config: LoadTestConfig, controller: any, shouldContinue: () => boolean): Promise<void> {
    this.emit('rampUpStart', { duration: config.rampUpTime });

    const rampUpSteps = Math.min(config.concurrency, 10); // Max 10 steps
    const stepSize = Math.ceil(config.concurrency / rampUpSteps);
    const stepDuration = config.rampUpTime / rampUpSteps;

    let currentConcurrency = 0;
    let requestCounter = 0;

    for (let step = 0; step < rampUpSteps && shouldContinue(); step++) {
      currentConcurrency = Math.min(currentConcurrency + stepSize, config.concurrency);

      // Add requests up to current concurrency level
      while (controller.activeRequests.size < currentConcurrency && shouldContinue()) {
        const requestId = `rampup-${requestCounter++}`;
        this.executeRequestWithTracking(
          config.targetFunction,
          config.timeout,
          requestId,
          controller
        );
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }

    this.emit('rampUpEnd', { finalConcurrency: currentConcurrency });
  }

  private async rampDown(config: LoadTestConfig, controller: any): Promise<void> {
    this.emit('rampDownStart', { duration: config.rampDownTime });

    // Gradually stop starting new requests
    controller.shouldStop = true;

    // Wait for active requests to complete with timeout
    const rampDownEnd = Date.now() + config.rampDownTime;

    while (controller.activeRequests.size > 0 && Date.now() < rampDownEnd) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.emit('rampDownEnd', { remainingRequests: controller.activeRequests.size });
  }

  private async executeRequestWithTracking(
    targetFunction: () => Promise<any> | any,
    timeout: number,
    requestId: string,
    controller: any
  ): Promise<void> {
    controller.activeRequests.add(requestId);

    try {
      const result = await this.executeRequest(targetFunction, timeout, requestId);
      controller.results.push(result);
    } finally {
      controller.activeRequests.delete(requestId);
    }
  }

  private async executeRequest(
    targetFunction: () => Promise<any> | any,
    timeout: number,
    requestId: string
  ): Promise<RequestResult> {
    const startTime = Date.now();
    let timedOut = false;
    let success = false;
    let error: any = undefined;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          timedOut = true;
          reject(new Error('Request timeout'));
        }, timeout);
      });

      const requestPromise = Promise.resolve(targetFunction());
      await Promise.race([requestPromise, timeoutPromise]);
      success = true;
    } catch (err) {
      error = err;
      success = false;
    }

    const endTime = Date.now();

    return {
      requestId,
      startTime,
      endTime,
      duration: endTime - startTime,
      success,
      error,
      timedOut
    };
  }

  private calculateResults(
    config: LoadTestConfig,
    results: RequestResult[],
    timing: any
  ): LoadTestResult {
    const durations = results.map(r => r.duration);
    const sortedDurations = durations.sort((a, b) => a - b);

    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success && !r.timedOut).length;
    const timeoutRequests = results.filter(r => r.timedOut).length;
    const totalDuration = timing.endTime - timing.startTime;

    // Calculate throughput over time windows
    const windowSize = 1000; // 1 second windows
    const windows = Math.ceil(totalDuration / windowSize);
    const throughputWindows: number[] = [];

    for (let i = 0; i < windows; i++) {
      const windowStart = timing.startTime + (i * windowSize);
      const windowEnd = windowStart + windowSize;
      const windowRequests = results.filter(r =>
        r.startTime >= windowStart && r.startTime < windowEnd
      ).length;
      throughputWindows.push(windowRequests);
    }

    const avgDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
    const variance = durations.length > 0 ?
      durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length : 0;

    const errors = results
      .filter(r => !r.success)
      .map(r => ({
        timestamp: r.startTime,
        error: r.error?.message || 'Unknown error',
        type: r.timedOut ? 'timeout' as const : 'exception' as const
      }));

    return {
      testName: config.name,
      startTime: timing.startTime,
      endTime: timing.endTime,
      duration: totalDuration,
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      timeoutRequests,
      requestsPerSecond: (results.length / totalDuration) * 1000,
      averageResponseTime: avgDuration,
      medianResponseTime: sortedDurations.length > 0 ? this.calculatePercentile(sortedDurations, 50) : 0,
      minResponseTime: sortedDurations.length > 0 ? Math.min(...durations) : 0,
      maxResponseTime: sortedDurations.length > 0 ? Math.max(...durations) : 0,
      p95ResponseTime: sortedDurations.length > 0 ? this.calculatePercentile(sortedDurations, 95) : 0,
      p99ResponseTime: sortedDurations.length > 0 ? this.calculatePercentile(sortedDurations, 99) : 0,
      standardDeviation: Math.sqrt(variance),
      throughputStats: {
        minThroughput: throughputWindows.length > 0 ? Math.min(...throughputWindows) : 0,
        maxThroughput: throughputWindows.length > 0 ? Math.max(...throughputWindows) : 0,
        avgThroughput: throughputWindows.length > 0 ?
          throughputWindows.reduce((sum, t) => sum + t, 0) / throughputWindows.length : 0
      },
      errorRate: results.length > 0 ? ((failedRequests + timeoutRequests) / results.length) * 100 : 0,
      concurrencyAchieved: Math.min(config.concurrency, results.length),
      memoryUsage: {
        start: timing.startMemory,
        peak: timing.peakMemory,
        end: timing.endMemory
      },
      errors
    };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  async runMultipleLoadTests(configs: LoadTestConfig[]): Promise<LoadTestResult[]> {
    this.emit('multipleTestsStart', { count: configs.length });

    const results: LoadTestResult[] = [];

    for (const config of configs) {
      const result = await this.runLoadTest(config);
      results.push(result);

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.emit('multipleTestsEnd', { results });
    return results;
  }

  stopLoadTest(testName: string): boolean {
    const controller = this.activeTests.get(testName);
    if (controller) {
      controller.shouldStop = true;
      this.emit('loadTestStopped', { testName });
      return true;
    }
    return false;
  }

  stopAllLoadTests(): void {
    for (const [testName, controller] of this.activeTests) {
      controller.shouldStop = true;
    }
    this.emit('allLoadTestsStopped');
  }

  getActiveTests(): string[] {
    return Array.from(this.activeTests.keys());
  }

  getTestResults(): LoadTestResult[] {
    return [...this.testResults];
  }

  getTestResult(testName: string): LoadTestResult | undefined {
    return this.testResults.find(result => result.testName === testName);
  }

  clearResults(): void {
    this.testResults = [];
    this.emit('resultsCleared');
  }

  async saveResults(filePath: string): Promise<void> {
    const data = {
      timestamp: Date.now(),
      results: this.testResults
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    this.emit('resultsSaved', { filePath, count: this.testResults.length });
  }

  async loadResults(filePath: string): Promise<void> {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    this.testResults = data.results || [];
    this.emit('resultsLoaded', { filePath, count: this.testResults.length });
  }

  generateLoadTestReport(result: LoadTestResult): string {
    let report = `Load Test Report: ${result.testName}\n`;
    report += `=`.repeat(50) + `\n\n`;

    report += `Test Duration: ${(result.duration / 1000).toFixed(2)} seconds\n`;
    report += `Start Time: ${new Date(result.startTime).toISOString()}\n`;
    report += `End Time: ${new Date(result.endTime).toISOString()}\n\n`;

    report += `Request Statistics:\n`;
    report += `  Total Requests: ${result.totalRequests}\n`;
    report += `  Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)\n`;
    report += `  Failed: ${result.failedRequests}\n`;
    report += `  Timed Out: ${result.timeoutRequests}\n`;
    report += `  Error Rate: ${result.errorRate.toFixed(2)}%\n\n`;

    report += `Performance Metrics:\n`;
    report += `  Requests/Second: ${result.requestsPerSecond.toFixed(2)}\n`;
    report += `  Average Response Time: ${result.averageResponseTime.toFixed(2)} ms\n`;
    report += `  Median Response Time: ${result.medianResponseTime.toFixed(2)} ms\n`;
    report += `  95th Percentile: ${result.p95ResponseTime.toFixed(2)} ms\n`;
    report += `  99th Percentile: ${result.p99ResponseTime.toFixed(2)} ms\n`;
    report += `  Min Response Time: ${result.minResponseTime.toFixed(2)} ms\n`;
    report += `  Max Response Time: ${result.maxResponseTime.toFixed(2)} ms\n`;
    report += `  Standard Deviation: ${result.standardDeviation.toFixed(2)} ms\n\n`;

    report += `Throughput Statistics:\n`;
    report += `  Min Throughput: ${result.throughputStats.minThroughput} req/sec\n`;
    report += `  Max Throughput: ${result.throughputStats.maxThroughput} req/sec\n`;
    report += `  Avg Throughput: ${result.throughputStats.avgThroughput.toFixed(2)} req/sec\n\n`;

    report += `Memory Usage:\n`;
    report += `  Start Heap: ${(result.memoryUsage.start.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    report += `  Peak Heap: ${(result.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    report += `  End Heap: ${(result.memoryUsage.end.heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`;

    if (result.errors.length > 0) {
      report += `Errors (showing first 10):\n`;
      const errorSample = result.errors.slice(0, 10);
      for (const error of errorSample) {
        report += `  [${new Date(error.timestamp).toISOString()}] ${error.type}: ${error.error}\n`;
      }
      if (result.errors.length > 10) {
        report += `  ... and ${result.errors.length - 10} more errors\n`;
      }
    }

    return report;
  }

  compareLoadTestResults(baseline: LoadTestResult, current: LoadTestResult): any {
    return {
      testName: current.testName,
      timestamp: Date.now(),
      comparison: {
        requestsPerSecond: {
          baseline: baseline.requestsPerSecond,
          current: current.requestsPerSecond,
          change: ((current.requestsPerSecond - baseline.requestsPerSecond) / baseline.requestsPerSecond) * 100
        },
        averageResponseTime: {
          baseline: baseline.averageResponseTime,
          current: current.averageResponseTime,
          change: ((current.averageResponseTime - baseline.averageResponseTime) / baseline.averageResponseTime) * 100
        },
        errorRate: {
          baseline: baseline.errorRate,
          current: current.errorRate,
          change: current.errorRate - baseline.errorRate
        },
        p95ResponseTime: {
          baseline: baseline.p95ResponseTime,
          current: current.p95ResponseTime,
          change: ((current.p95ResponseTime - baseline.p95ResponseTime) / baseline.p95ResponseTime) * 100
        }
      }
    };
  }
}