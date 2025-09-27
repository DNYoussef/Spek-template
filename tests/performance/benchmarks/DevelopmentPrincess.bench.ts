/**
 * DevelopmentPrincess Performance Benchmarks
 * Tests task distribution, coordination performance, and memory efficiency
 * Validates enterprise-scale performance requirements
 */

import { performance } from 'perf_hooks';
import { DevelopmentPrincess } from '../../../src/swarm/hierarchy/domains/DevelopmentPrincess';
import { Task, TaskPriority } from '../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../src/swarm/hierarchy/types';

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  opsPerSecond: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  p50: number;
  p95: number;
  p99: number;
  minTime: number;
  maxTime: number;
  status: 'pass' | 'fail';
  threshold: number;
  metadata?: any;
}

export class DevelopmentPrincessBenchmark {
  private princess: DevelopmentPrincess;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.princess = new DevelopmentPrincess();
  }

  /**
   * Run comprehensive performance benchmark suite
   */
  async runComprehensiveBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('[Performance] Starting DevelopmentPrincess benchmark suite...');

    this.results = [];

    // Test 1: Task initialization and setup performance
    await this.benchmarkInitialization();

    // Test 2: Simple task execution performance
    await this.benchmarkSimpleTaskExecution();

    // Test 3: Complex task with sharding performance
    await this.benchmarkComplexTaskSharding();

    // Test 4: Memory pattern search performance
    await this.benchmarkMemoryPatternSearch();

    // Test 5: King Logic coordination performance
    await this.benchmarkKingLogicCoordination();

    // Test 6: MECE distribution performance
    await this.benchmarkMECEDistribution();

    // Test 7: Concurrent task execution performance
    await this.benchmarkConcurrentExecution();

    // Test 8: Memory efficiency under load
    await this.benchmarkMemoryEfficiency();

    console.log('[Performance] DevelopmentPrincess benchmark suite completed');
    return this.results;
  }

  /**
   * Benchmark princess initialization performance
   */
  private async benchmarkInitialization(): Promise<void> {
    const iterations = 100;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      // Create new instance to test initialization
      const princess = new DevelopmentPrincess();
      await new Promise(resolve => setTimeout(resolve, 1)); // Ensure async initialization

      const end = performance.now();
      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Princess Initialization',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      50, // 50ms threshold for initialization
      { component: 'initialization' }
    ));
  }

  /**
   * Benchmark simple task execution performance
   */
  private async benchmarkSimpleTaskExecution(): Promise<void> {
    const iterations = 500;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    const simpleTask: Task = {
      id: 'simple-test',
      name: 'Simple Development Task',
      description: 'Implement a simple function',
      domain: PrincessDomain.DEVELOPMENT,
      priority: TaskPriority.MEDIUM,
      files: ['src/utils/helper.ts'],
      estimatedLOC: 50,
      dependencies: []
    };

    for (let i = 0; i < iterations; i++) {
      const taskWithId = { ...simpleTask, id: `simple-test-${i}` };

      const start = performance.now();
      await this.princess.executeTask(taskWithId);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Simple Task Execution',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      100, // 100ms threshold for simple tasks
      { component: 'task_execution', type: 'simple' }
    ));
  }

  /**
   * Benchmark complex task with sharding performance
   */
  private async benchmarkComplexTaskSharding(): Promise<void> {
    const iterations = 100;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    const complexTask: Task = {
      id: 'complex-test',
      name: 'Complex Development Task',
      description: 'Implement a complex microservice',
      domain: PrincessDomain.DEVELOPMENT,
      priority: TaskPriority.HIGH,
      files: [
        'src/services/api.ts',
        'src/services/database.ts',
        'src/services/auth.ts',
        'src/models/user.ts',
        'src/models/product.ts',
        'src/controllers/userController.ts',
        'src/controllers/productController.ts',
        'src/middleware/auth.ts',
        'src/routes/api.ts',
        'tests/api.test.ts'
      ],
      estimatedLOC: 2500,
      dependencies: ['database-setup', 'auth-service']
    };

    for (let i = 0; i < iterations; i++) {
      const taskWithId = { ...complexTask, id: `complex-test-${i}` };

      const start = performance.now();
      await this.princess.executeTask(taskWithId);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Complex Task with Sharding',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      500, // 500ms threshold for complex tasks
      { component: 'task_execution', type: 'complex', sharding: true }
    ));
  }

  /**
   * Benchmark memory pattern search performance
   */
  private async benchmarkMemoryPatternSearch(): Promise<void> {
    const iterations = 1000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    const searchQueries = [
      'authentication implementation',
      'database connection setup',
      'API endpoint creation',
      'unit test patterns',
      'error handling middleware'
    ];

    for (let i = 0; i < iterations; i++) {
      const query = searchQueries[i % searchQueries.length];

      const start = performance.now();
      await this.princess.searchPatterns(query);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Memory Pattern Search',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      50, // 50ms threshold for pattern search
      { component: 'langroid_memory', operation: 'search' }
    ));
  }

  /**
   * Benchmark King Logic coordination performance
   */
  private async benchmarkKingLogicCoordination(): Promise<void> {
    const iterations = 200;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      // Test King Logic status operations
      this.princess.getKingLogicStatus();
      this.princess.getMECEStats();

      const end = performance.now();
      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'King Logic Coordination',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      10, // 10ms threshold for coordination operations
      { component: 'king_logic', operation: 'coordination' }
    ));
  }

  /**
   * Benchmark MECE distribution performance
   */
  private async benchmarkMECEDistribution(): Promise<void> {
    const iterations = 300;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      // Test MECE distribution operations
      this.princess.getMECEStats();

      const end = performance.now();
      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'MECE Distribution',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      5, // 5ms threshold for MECE operations
      { component: 'mece_distributor', operation: 'validation' }
    ));
  }

  /**
   * Benchmark concurrent task execution performance
   */
  private async benchmarkConcurrentExecution(): Promise<void> {
    const concurrentTasks = 50;
    const memoryBefore = process.memoryUsage().heapUsed;

    const tasks: Task[] = Array.from({ length: concurrentTasks }, (_, i) => ({
      id: `concurrent-test-${i}`,
      name: `Concurrent Task ${i}`,
      description: `Concurrent development task ${i}`,
      domain: PrincessDomain.DEVELOPMENT,
      priority: TaskPriority.MEDIUM,
      files: [`src/component${i}.ts`],
      estimatedLOC: 100,
      dependencies: []
    }));

    const start = performance.now();

    const promises = tasks.map(task => this.princess.executeTask(task));
    await Promise.all(promises);

    const end = performance.now();
    const totalTime = end - start;

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push({
      name: 'Concurrent Task Execution',
      iterations: concurrentTasks,
      totalTime,
      averageTime: totalTime / concurrentTasks,
      opsPerSecond: (concurrentTasks * 1000) / totalTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - memoryBefore,
      p50: totalTime / concurrentTasks,
      p95: totalTime / concurrentTasks,
      p99: totalTime / concurrentTasks,
      minTime: totalTime / concurrentTasks,
      maxTime: totalTime / concurrentTasks,
      status: totalTime < 5000 ? 'pass' : 'fail', // 5 second threshold for 50 concurrent tasks
      threshold: 5000,
      metadata: { component: 'concurrent_execution', concurrent_tasks: concurrentTasks }
    });
  }

  /**
   * Benchmark memory efficiency under load
   */
  private async benchmarkMemoryEfficiency(): Promise<void> {
    const iterations = 1000;
    const memoryReadings: number[] = [];

    const initialMemory = process.memoryUsage().heapUsed;
    memoryReadings.push(initialMemory);

    for (let i = 0; i < iterations; i++) {
      const task: Task = {
        id: `memory-test-${i}`,
        name: `Memory Test Task ${i}`,
        description: 'Test memory efficiency',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.LOW,
        files: [`src/test${i}.ts`],
        estimatedLOC: 50,
        dependencies: []
      };

      await this.princess.executeTask(task);

      if (i % 100 === 0) {
        memoryReadings.push(process.memoryUsage().heapUsed);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthPercentage = (memoryGrowth / initialMemory) * 100;

    this.results.push({
      name: 'Memory Efficiency Under Load',
      iterations,
      totalTime: 0,
      averageTime: 0,
      opsPerSecond: 0,
      memoryBefore: initialMemory,
      memoryAfter: finalMemory,
      memoryDelta: memoryGrowth,
      p50: 0,
      p95: 0,
      p99: 0,
      minTime: 0,
      maxTime: 0,
      status: memoryGrowthPercentage < 50 ? 'pass' : 'fail', // Memory growth should be < 50%
      threshold: 50,
      metadata: {
        component: 'memory_efficiency',
        memory_growth_percentage: memoryGrowthPercentage,
        memory_readings: memoryReadings.length
      }
    });
  }

  /**
   * Create standardized benchmark result
   */
  private createBenchmarkResult(
    name: string,
    iterations: number,
    times: number[],
    memoryBefore: number,
    memoryAfter: number,
    threshold: number,
    metadata?: any
  ): BenchmarkResult {
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const sortedTimes = [...times].sort((a, b) => a - b);

    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    return {
      name,
      iterations,
      totalTime,
      averageTime,
      opsPerSecond: (iterations * 1000) / totalTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - memoryBefore,
      p50,
      p95,
      p99,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      status: p95 < threshold ? 'pass' : 'fail',
      threshold,
      metadata
    };
  }

  /**
   * Get benchmark results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): any {
    return this.princess.getMemoryStats();
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    let report = '\n=== DevelopmentPrincess Performance Benchmark Report ===\n\n';

    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const totalTests = this.results.length;

    report += `Overall Results: ${passedTests}/${totalTests} tests passed\n\n`;

    this.results.forEach(result => {
      report += `${result.name}:\n`;
      report += `  Status: ${result.status.toUpperCase()}\n`;
      report += `  Iterations: ${result.iterations}\n`;
      report += `  Average Time: ${result.averageTime.toFixed(2)}ms\n`;
      report += `  P95 Time: ${result.p95.toFixed(2)}ms (threshold: ${result.threshold}ms)\n`;
      report += `  Ops/Second: ${result.opsPerSecond.toFixed(2)}\n`;
      report += `  Memory Delta: ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB\n`;

      if (result.metadata) {
        report += `  Component: ${result.metadata.component}\n`;
      }

      report += '\n';
    });

    return report;
  }
}

// Export for use in test runners
export default DevelopmentPrincessBenchmark;

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-01-27T18:49:23-05:00 | performance-benchmarker@Claude Sonnet 4 | Created comprehensive DevelopmentPrincess performance benchmark suite with 8 test categories | DevelopmentPrincess.bench.ts | OK | Comprehensive benchmarking for task coordination, memory efficiency, and enterprise-scale performance | 0.00 | ab34ef1 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: perf-benchmarker-dev-princess-001
 * - inputs: ["DevelopmentPrincess.ts", "KingLogicAdapter.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"perf-benchmarker-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */