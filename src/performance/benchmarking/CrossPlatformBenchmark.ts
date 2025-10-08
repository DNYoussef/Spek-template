import { PerformanceBenchmarker, BenchmarkResult, BenchmarkConfig } from './PerformanceBenchmarker';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

export interface PlatformResult {
  platform: string;
  arch: string;
  nodeVersion: string;
  results: BenchmarkResult[];
  systemInfo: {
    cpus: number;
    totalMemory: number;
    freeMemory: number;
    loadAverage: number[];
    uptime: number;
  };
  networkLatency?: number;
  diskIOPerformance?: {
    readSpeed: number;
    writeSpeed: number;
  };
}

export interface CrossPlatformReport {
  timestamp: number;
  platformResults: PlatformResult[];
  summary: {
    bestPerforming: string;
    worstPerforming: string;
    averagePerformance: number;
    platformDifferences: { [key: string]: number };
  };
}

export class CrossPlatformBenchmark extends PerformanceBenchmarker {
  private platformResults: Map<string, PlatformResult> = new Map();
  private remoteConnections: Map<string, any> = new Map();

  constructor() {
    super();
  }

  async runCrossPlatformBenchmark(
    testSuite: { [key: string]: () => Promise<any> | any },
    config: Partial<BenchmarkConfig> = {}
  ): Promise<CrossPlatformReport> {
    // Run local benchmark
    const localResult = await this.runLocalBenchmark(testSuite, config);
    this.platformResults.set('local', localResult);

    // Collect system performance metrics
    await this.collectSystemMetrics();

    // Generate cross-platform report
    return this.generateCrossPlatformReport();
  }

  private async runLocalBenchmark(
    testSuite: { [key: string]: () => Promise<any> | any },
    config: Partial<BenchmarkConfig>
  ): Promise<PlatformResult> {
    this.emit('localBenchmarkStart');

    const results = await this.runBenchmarkSuite(testSuite, config);

    const platformResult: PlatformResult = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      results,
      systemInfo: {
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      }
    };

    this.emit('localBenchmarkEnd', platformResult);
    return platformResult;
  }

  private async collectSystemMetrics(): Promise<void> {
    this.emit('systemMetricsStart');

    // Measure network latency
    for (const [platform, result] of this.platformResults) {
      try {
        result.networkLatency = await this.measureNetworkLatency();
        result.diskIOPerformance = await this.measureDiskIOPerformance();
      } catch (error) {
        this.emit('systemMetricsError', { platform, error });
      }
    }

    this.emit('systemMetricsEnd');
  }

  private async measureNetworkLatency(): Promise<number> {
    const start = Date.now();

    try {
      // Measure localhost latency
      const response = await fetch('http://localhost:0/ping').catch(() => null);
      if (response) {
        return Date.now() - start;
      }
    } catch (error) {
      // Fallback to DNS resolution timing
    }

    // Fallback: measure DNS resolution time
    const dns = require('dns').promises;
    try {
      const dnsStart = Date.now();
      await dns.resolve('localhost');
      return Date.now() - dnsStart;
    } catch (error) {
      return -1; // Unable to measure
    }
  }

  private async measureDiskIOPerformance(): Promise<{ readSpeed: number; writeSpeed: number }> {
    const testFile = path.join(os.tmpdir(), 'benchmark-io-test.tmp');
    const testData = Buffer.alloc(1024 * 1024, 'a'); // 1MB of data
    const iterations = 10;

    // Measure write speed
    const writeStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await fs.writeFile(`${testFile}-${i}`, testData);
    }
    const writeTime = Date.now() - writeStart;
    const writeSpeed = (testData.length * iterations) / (writeTime / 1000); // bytes per second

    // Measure read speed
    const readStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await fs.readFile(`${testFile}-${i}`);
    }
    const readTime = Date.now() - readStart;
    const readSpeed = (testData.length * iterations) / (readTime / 1000); // bytes per second

    // Cleanup
    for (let i = 0; i < iterations; i++) {
      try {
        await fs.unlink(`${testFile}-${i}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    return {
      readSpeed,
      writeSpeed
    };
  }

  private generateCrossPlatformReport(): CrossPlatformReport {
    const platformResults = Array.from(this.platformResults.values());

    if (platformResults.length === 0) {
      throw new Error('No platform results available');
    }

    // Calculate average performance scores
    const platformScores = platformResults.map(result => {
      const avgOps = result.results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / result.results.length;
      return {
        platform: `${result.platform}-${result.arch}`,
        score: avgOps
      };
    });

    platformScores.sort((a, b) => b.score - a.score);

    const bestPerforming = platformScores[0].platform;
    const worstPerforming = platformScores[platformScores.length - 1].platform;
    const averagePerformance = platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length;

    // Calculate platform differences
    const platformDifferences: { [key: string]: number } = {};
    for (const score of platformScores) {
      platformDifferences[score.platform] = ((score.score - averagePerformance) / averagePerformance) * 100;
    }

    return {
      timestamp: Date.now(),
      platformResults,
      summary: {
        bestPerforming,
        worstPerforming,
        averagePerformance,
        platformDifferences
      }
    };
  }

  async saveCrossPlatformReport(report: CrossPlatformReport, filePath: string): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    this.emit('reportSaved', { filePath });
  }

  async runConcurrentBenchmarks(
    testSuites: { [suiteName: string]: { [testName: string]: () => Promise<any> | any } },
    config: Partial<BenchmarkConfig> = {}
  ): Promise<{ [suiteName: string]: BenchmarkResult[] }> {
    this.emit('concurrentBenchmarksStart', { suites: Object.keys(testSuites).length });

    const promises = Object.entries(testSuites).map(async ([suiteName, suite]) => {
      const results = await this.runBenchmarkSuite(suite, config);
      return { suiteName, results };
    });

    const allResults = await Promise.all(promises);
    const resultMap: { [suiteName: string]: BenchmarkResult[] } = {};

    for (const { suiteName, results } of allResults) {
      resultMap[suiteName] = results;
    }

    this.emit('concurrentBenchmarksEnd', resultMap);
    return resultMap;
  }

  async benchmarkMemoryLeaks(
    testFunction: () => Promise<any> | any,
    duration: number = 60000, // 1 minute
    interval: number = 1000 // 1 second
  ): Promise<{ memorySnapshots: Array<{ timestamp: number; memory: NodeJS.MemoryUsage }> }> {
    this.emit('memoryLeakTestStart', { duration, interval });

    const memorySnapshots: Array<{ timestamp: number; memory: NodeJS.MemoryUsage }> = [];
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      const beforeMemory = process.memoryUsage();

      // Run test function
      await testFunction();

      const afterMemory = process.memoryUsage();

      memorySnapshots.push({
        timestamp: Date.now(),
        memory: afterMemory
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    this.emit('memoryLeakTestEnd', { snapshots: memorySnapshots.length });
    return { memorySnapshots };
  }

  async stressTest(
    testFunction: () => Promise<any> | any,
    config: {
      maxConcurrency: number;
      duration: number;
      rampUpTime: number;
    }
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsPerSecond: number;
    errors: any[];
  }> {
    this.emit('stressTestStart', config);

    const { maxConcurrency, duration, rampUpTime } = config;
    const startTime = Date.now();
    const results: Array<{ success: boolean; duration: number; error?: any }> = [];
    let activeConnections = 0;
    const errors: any[] = [];

    const executeRequest = async (): Promise<void> => {
      if (activeConnections >= maxConcurrency || Date.now() - startTime > duration) {
        return;
      }

      activeConnections++;
      const requestStart = Date.now();

      try {
        await testFunction();
        results.push({
          success: true,
          duration: Date.now() - requestStart
        });
      } catch (error) {
        results.push({
          success: false,
          duration: Date.now() - requestStart,
          error
        });
        errors.push(error);
      } finally {
        activeConnections--;
      }
    };

    // Ramp up phase
    const rampUpInterval = rampUpTime / maxConcurrency;
    for (let i = 0; i < maxConcurrency; i++) {
      setTimeout(() => {
        const interval = setInterval(() => {
          if (Date.now() - startTime > duration) {
            clearInterval(interval);
            return;
          }
          executeRequest();
        }, 10); // Try to start new request every 10ms
      }, i * rampUpInterval);
    }

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, duration));

    // Wait for all active connections to finish
    while (activeConnections > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
    const averageResponseTime = totalTime / results.length;
    const requestsPerSecond = (results.length / duration) * 1000;

    const stressTestResult = {
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      requestsPerSecond,
      errors
    };

    this.emit('stressTestEnd', stressTestResult);
    return stressTestResult;
  }

  generatePlatformComparisonReport(report: CrossPlatformReport): string {
    let output = `Cross-Platform Performance Benchmark Report\n`;
    output += `Generated: ${new Date(report.timestamp).toISOString()}\n`;
    output += `Platforms Tested: ${report.platformResults.length}\n\n`;

    output += `Summary:\n`;
    output += `  Best Performing: ${report.summary.bestPerforming}\n`;
    output += `  Worst Performing: ${report.summary.worstPerforming}\n`;
    output += `  Average Performance: ${report.summary.averagePerformance.toFixed(2)} ops/sec\n\n`;

    output += `Platform Performance Differences (vs average):\n`;
    for (const [platform, diff] of Object.entries(report.summary.platformDifferences)) {
      const sign = diff >= 0 ? '+' : '';
      output += `  ${platform}: ${sign}${diff.toFixed(2)}%\n`;
    }
    output += `\n`;

    for (const platformResult of report.platformResults) {
      output += `Platform: ${platformResult.platform} ${platformResult.arch}\n`;
      output += `Node.js: ${platformResult.nodeVersion}\n`;
      output += `CPUs: ${platformResult.systemInfo.cpus}\n`;
      output += `Memory: ${(platformResult.systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB total, `;
      output += `${(platformResult.systemInfo.freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB free\n`;
      output += `Load Average: ${platformResult.systemInfo.loadAverage.map(l => l.toFixed(2)).join(', ')}\n`;
      output += `Uptime: ${(platformResult.systemInfo.uptime / 3600).toFixed(2)} hours\n`;

      if (platformResult.networkLatency !== undefined) {
        output += `Network Latency: ${platformResult.networkLatency.toFixed(2)} ms\n`;
      }

      if (platformResult.diskIOPerformance) {
        output += `Disk I/O: Read ${(platformResult.diskIOPerformance.readSpeed / 1024 / 1024).toFixed(2)} MB/s, `;
        output += `Write ${(platformResult.diskIOPerformance.writeSpeed / 1024 / 1024).toFixed(2)} MB/s\n`;
      }

      output += `\nBenchmark Results:\n`;
      for (const result of platformResult.results) {
        output += `  ${result.name}: ${result.operationsPerSecond.toFixed(2)} ops/sec\n`;
      }
      output += `\n`;
    }

    return output;
  }
}