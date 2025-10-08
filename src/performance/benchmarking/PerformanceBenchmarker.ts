import { performance } from 'perf_hooks';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface BenchmarkResult {
  name: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  platform: string;
  timestamp: number;
  iterations: number;
  operationsPerSecond: number;
  minTime: number;
  maxTime: number;
  avgTime: number;
  standardDeviation: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface BenchmarkConfig {
  name: string;
  iterations: number;
  warmupIterations: number;
  timeout: number;
  measureMemory: boolean;
  measureCpu: boolean;
  collectGCStats: boolean;
}

export class PerformanceBenchmarker extends EventEmitter {
  private results: BenchmarkResult[] = [];
  private isRunning = false;
  private platformInfo: any;

  constructor() {
    super();
    this.platformInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      nodeVersion: process.version,
      v8Version: process.versions.v8
    };
  }

  async benchmark(
    name: string,
    testFunction: () => Promise<any> | any,
    config: Partial<BenchmarkConfig> = {}
  ): Promise<BenchmarkResult> {
    const fullConfig: BenchmarkConfig = {
      name,
      iterations: 1000,
      warmupIterations: 100,
      timeout: 30000,
      measureMemory: true,
      measureCpu: true,
      collectGCStats: true,
      ...config
    };

    this.emit('benchmarkStart', { name, config: fullConfig });

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Warmup phase
    this.emit('warmupStart', { iterations: fullConfig.warmupIterations });
    for (let i = 0; i < fullConfig.warmupIterations; i++) {
      await this.executeFunction(testFunction);
    }
    this.emit('warmupEnd');

    // Measurement phase
    const times: number[] = [];
    const startCpuUsage = fullConfig.measureCpu ? process.cpuUsage() : null;
    const startMemory = fullConfig.measureMemory ? process.memoryUsage() : null;

    this.emit('measurementStart', { iterations: fullConfig.iterations });

    for (let i = 0; i < fullConfig.iterations; i++) {
      const startTime = performance.now();
      await this.executeFunction(testFunction);
      const endTime = performance.now();
      times.push(endTime - startTime);

      // Emit progress every 10% of iterations
      if (i % Math.floor(fullConfig.iterations / 10) === 0) {
        this.emit('progress', {
          completed: i,
          total: fullConfig.iterations,
          percentage: (i / fullConfig.iterations) * 100
        });
      }
    }

    const endCpuUsage = fullConfig.measureCpu ? process.cpuUsage(startCpuUsage!) : null;
    const endMemory = fullConfig.measureMemory ? process.memoryUsage() : null;

    // Calculate statistics
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / times.length;
    const sortedTimes = times.sort((a, b) => a - b);

    const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    const result: BenchmarkResult = {
      name: fullConfig.name,
      duration: totalTime,
      memoryUsage: endMemory || process.memoryUsage(),
      cpuUsage: endCpuUsage || { user: 0, system: 0 },
      platform: this.platformInfo.platform,
      timestamp: Date.now(),
      iterations: fullConfig.iterations,
      operationsPerSecond: (fullConfig.iterations / totalTime) * 1000,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      avgTime,
      standardDeviation,
      percentiles: {
        p50: this.calculatePercentile(sortedTimes, 50),
        p90: this.calculatePercentile(sortedTimes, 90),
        p95: this.calculatePercentile(sortedTimes, 95),
        p99: this.calculatePercentile(sortedTimes, 99)
      }
    };

    this.results.push(result);
    this.emit('benchmarkEnd', result);

    return result;
  }

  private async executeFunction(fn: () => Promise<any> | any): Promise<any> {
    try {
      const result = fn();
      if (result && typeof result.then === 'function') {
        return await result;
      }
      return result;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  async runBenchmarkSuite(
    suite: { [key: string]: () => Promise<any> | any },
    config: Partial<BenchmarkConfig> = {}
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const suiteNames = Object.keys(suite);

    this.emit('suiteStart', { tests: suiteNames.length });

    for (const name of suiteNames) {
      const result = await this.benchmark(name, suite[name], config);
      results.push(result);
    }

    this.emit('suiteEnd', { results });
    return results;
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
    this.emit('resultsCleared');
  }

  async saveResults(filePath: string): Promise<void> {
    const data = {
      platformInfo: this.platformInfo,
      timestamp: Date.now(),
      results: this.results
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    this.emit('resultsSaved', { filePath, count: this.results.length });
  }

  async loadResults(filePath: string): Promise<void> {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    this.results = data.results || [];
    this.emit('resultsLoaded', { filePath, count: this.results.length });
  }

  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    let report = `Performance Benchmark Report\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Platform: ${this.platformInfo.platform} ${this.platformInfo.arch}\n`;
    report += `Node.js: ${this.platformInfo.nodeVersion}\n`;
    report += `CPUs: ${this.platformInfo.cpus}\n`;
    report += `Total Memory: ${(this.platformInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB\n\n`;

    for (const result of this.results) {
      report += `Test: ${result.name}\n`;
      report += `  Iterations: ${result.iterations}\n`;
      report += `  Total Duration: ${result.duration.toFixed(2)} ms\n`;
      report += `  Operations/sec: ${result.operationsPerSecond.toFixed(2)}\n`;
      report += `  Average Time: ${result.avgTime.toFixed(4)} ms\n`;
      report += `  Min Time: ${result.minTime.toFixed(4)} ms\n`;
      report += `  Max Time: ${result.maxTime.toFixed(4)} ms\n`;
      report += `  Std Dev: ${result.standardDeviation.toFixed(4)} ms\n`;
      report += `  Percentiles:\n`;
      report += `    50th: ${result.percentiles.p50.toFixed(4)} ms\n`;
      report += `    90th: ${result.percentiles.p90.toFixed(4)} ms\n`;
      report += `    95th: ${result.percentiles.p95.toFixed(4)} ms\n`;
      report += `    99th: ${result.percentiles.p99.toFixed(4)} ms\n`;
      report += `  Memory Usage:\n`;
      report += `    RSS: ${(result.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB\n`;
      report += `    Heap Used: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
      report += `    Heap Total: ${(result.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB\n`;
      report += `  CPU Usage:\n`;
      report += `    User: ${(result.cpuUsage.user / 1000).toFixed(2)} ms\n`;
      report += `    System: ${(result.cpuUsage.system / 1000).toFixed(2)} ms\n\n`;
    }

    return report;
  }

  async compareWithBaseline(baselineFile: string): Promise<any> {
    const baseline = JSON.parse(await fs.readFile(baselineFile, 'utf-8'));
    const comparison: any = {
      timestamp: Date.now(),
      comparisons: []
    };

    for (const current of this.results) {
      const baselineResult = baseline.results.find((r: any) => r.name === current.name);
      if (baselineResult) {
        const improvement = {
          name: current.name,
          operationsPerSecond: {
            current: current.operationsPerSecond,
            baseline: baselineResult.operationsPerSecond,
            change: ((current.operationsPerSecond - baselineResult.operationsPerSecond) / baselineResult.operationsPerSecond) * 100
          },
          avgTime: {
            current: current.avgTime,
            baseline: baselineResult.avgTime,
            change: ((current.avgTime - baselineResult.avgTime) / baselineResult.avgTime) * 100
          },
          memoryUsage: {
            current: current.memoryUsage.heapUsed,
            baseline: baselineResult.memoryUsage.heapUsed,
            change: ((current.memoryUsage.heapUsed - baselineResult.memoryUsage.heapUsed) / baselineResult.memoryUsage.heapUsed) * 100
          }
        };
        comparison.comparisons.push(improvement);
      }
    }

    return comparison;
  }

  getPlatformInfo(): any {
    return { ...this.platformInfo };
  }
}

// Default benchmarker instance
export const defaultBenchmarker = new PerformanceBenchmarker();

// Convenience function for quick benchmarks
export async function quickBenchmark(
  name: string,
  fn: () => Promise<any> | any,
  iterations = 1000
): Promise<BenchmarkResult> {
  return defaultBenchmarker.benchmark(name, fn, { iterations });
}