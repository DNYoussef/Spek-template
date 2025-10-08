/**
 * KingLogicAdapter Performance Benchmarks
 * Tests routing, sharding, and MECE distribution performance
 * Validates meta-logic coordination patterns at enterprise scale
 */

import { performance } from 'perf_hooks';
import { KingLogicAdapter, KingLogicStats } from '../../../src/swarm/queen/KingLogicAdapter';
import { Task, TaskPriority } from '../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../src/swarm/hierarchy/types';
import { BenchmarkResult } from './DevelopmentPrincess.bench';

export class KingLogicAdapterBenchmark {
  private kingLogic: KingLogicAdapter;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.kingLogic = new KingLogicAdapter();
  }

  /**
   * Run comprehensive KingLogicAdapter benchmark suite
   */
  async runComprehensiveBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('[Performance] Starting KingLogicAdapter benchmark suite...');

    this.results = [];

    // Test 1: Task complexity analysis performance
    await this.benchmarkComplexityAnalysis();

    // Test 2: Task sharding decision performance
    await this.benchmarkShardingDecision();

    // Test 3: Task sharding execution performance
    await this.benchmarkTaskSharding();

    // Test 4: Intelligent routing performance
    await this.benchmarkIntelligentRouting();

    // Test 5: MECE validation performance
    await this.benchmarkMECEValidation();

    // Test 6: Multi-agent coordination performance
    await this.benchmarkMultiAgentCoordination();

    // Test 7: Configuration operations performance
    await this.benchmarkConfigurationOps();

    // Test 8: Large-scale routing performance
    await this.benchmarkLargeScaleRouting();

    // Test 9: Memory efficiency under routing load
    await this.benchmarkRoutingMemoryEfficiency();

    console.log('[Performance] KingLogicAdapter benchmark suite completed');
    return this.results;
  }

  /**
   * Benchmark task complexity analysis performance
   */
  private async benchmarkComplexityAnalysis(): Promise<void> {
    const iterations = 10000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    const testTasks = this.generateTestTasks(100);

    for (let i = 0; i < iterations; i++) {
      const task = testTasks[i % testTasks.length];

      const start = performance.now();
      this.kingLogic.analyzeTaskComplexity(task);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Task Complexity Analysis',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      1, // 1ms threshold for complexity analysis
      { component: 'complexity_analysis', operation: 'analyze' }
    ));
  }

  /**
   * Benchmark sharding decision performance
   */
  private async benchmarkShardingDecision(): Promise<void> {
    const iterations = 5000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    const testTasks = this.generateTestTasks(100);

    for (let i = 0; i < iterations; i++) {
      const task = testTasks[i % testTasks.length];

      const start = performance.now();
      this.kingLogic.shouldShardTask(task);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Sharding Decision',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      2, // 2ms threshold for sharding decisions
      { component: 'sharding', operation: 'decision' }
    ));
  }

  /**
   * Benchmark task sharding execution performance
   */
  private async benchmarkTaskSharding(): Promise<void> {
    const iterations = 1000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    // Generate complex tasks that require sharding
    const complexTasks = this.generateComplexTasks(50);

    for (let i = 0; i < iterations; i++) {
      const task = complexTasks[i % complexTasks.length];

      const start = performance.now();
      if (this.kingLogic.shouldShardTask(task)) {
        this.kingLogic.shardTask(task);
      }
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Task Sharding Execution',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      10, // 10ms threshold for sharding execution
      { component: 'sharding', operation: 'execute' }
    ));
  }

  /**
   * Benchmark intelligent routing performance
   */
  private async benchmarkIntelligentRouting(): Promise<void> {
    const iterations = 5000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    const testTasks = this.generateDiverseRoutingTasks(200);

    for (let i = 0; i < iterations; i++) {
      const task = testTasks[i % testTasks.length];

      const start = performance.now();
      this.kingLogic.routeTaskToPrincess(task);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Intelligent Routing',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      1, // 1ms threshold for routing decisions
      { component: 'routing', operation: 'intelligent' }
    ));
  }

  /**
   * Benchmark MECE validation performance
   */
  private async benchmarkMECEValidation(): Promise<void> {
    const iterations = 2000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const taskCount = 5 + (i % 20); // 5-25 tasks per validation
      const tasks = this.generateTestTasks(taskCount);

      const start = performance.now();
      this.kingLogic.validateMECEDistribution(tasks);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'MECE Validation',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      5, // 5ms threshold for MECE validation
      { component: 'mece', operation: 'validate' }
    ));
  }

  /**
   * Benchmark multi-agent coordination performance
   */
  private async benchmarkMultiAgentCoordination(): Promise<void> {
    const iterations = 500;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const taskCount = 10 + (i % 40); // 10-50 tasks per coordination
      const maxConcurrent = 3 + (i % 5); // 3-8 concurrent agents
      const tasks = this.generateTestTasks(taskCount);

      const start = performance.now();
      await this.kingLogic.coordinateMultipleAgents(tasks, maxConcurrent);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Multi-Agent Coordination',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      50, // 50ms threshold for coordination
      { component: 'coordination', operation: 'multi_agent' }
    ));
  }

  /**
   * Benchmark configuration operations performance
   */
  private async benchmarkConfigurationOps(): Promise<void> {
    const iterations = 10000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    const configurations = [
      { taskSharding: true, meceDistribution: true },
      { intelligentRouting: false, adaptiveCoordination: true },
      { multiAgentOrchestration: true, taskSharding: false },
      { meceDistribution: false, intelligentRouting: true }
    ];

    for (let i = 0; i < iterations; i++) {
      const config = configurations[i % configurations.length];

      const start = performance.now();
      this.kingLogic.configureMetaLogic(config);
      this.kingLogic.getMetaLogicStatus();
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Configuration Operations',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      0.5, // 0.5ms threshold for config operations
      { component: 'configuration', operation: 'meta_logic' }
    ));
  }

  /**
   * Benchmark large-scale routing performance
   */
  private async benchmarkLargeScaleRouting(): Promise<void> {
    const iterations = 100;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      // Large batch of 1000 tasks
      const largeBatch = this.generateTestTasks(1000);

      const start = performance.now();

      // Route all tasks
      const routingResults = largeBatch.map(task =>
        this.kingLogic.routeTaskToPrincess(task)
      );

      const end = performance.now();
      times.push(end - start);

      // Validate we got results
      if (routingResults.length !== 1000) {
        throw new Error('Routing batch failed');
      }
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Large-Scale Routing (1000 tasks)',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      100, // 100ms threshold for 1000 task routing
      { component: 'routing', operation: 'large_scale', batch_size: 1000 }
    ));
  }

  /**
   * Benchmark memory efficiency under routing load
   */
  private async benchmarkRoutingMemoryEfficiency(): Promise<void> {
    const iterations = 5000;
    const memoryReadings: number[] = [];

    const initialMemory = process.memoryUsage().heapUsed;
    memoryReadings.push(initialMemory);

    const testTasks = this.generateDiverseRoutingTasks(500);

    for (let i = 0; i < iterations; i++) {
      const task = testTasks[i % testTasks.length];

      // Perform multiple operations to stress memory
      this.kingLogic.analyzeTaskComplexity(task);
      this.kingLogic.routeTaskToPrincess(task);

      if (this.kingLogic.shouldShardTask(task)) {
        this.kingLogic.shardTask(task);
      }

      if (i % 500 === 0) {
        memoryReadings.push(process.memoryUsage().heapUsed);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthPercentage = (memoryGrowth / initialMemory) * 100;

    this.results.push({
      name: 'Routing Memory Efficiency',
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
      status: memoryGrowthPercentage < 30 ? 'pass' : 'fail', // Memory growth should be < 30%
      threshold: 30,
      metadata: {
        component: 'memory_efficiency',
        operation: 'routing_load',
        memory_growth_percentage: memoryGrowthPercentage,
        memory_readings: memoryReadings.length
      }
    });
  }

  /**
   * Generate test tasks with varying complexity
   */
  private generateTestTasks(count: number): Task[] {
    const tasks: Task[] = [];
    const domains = Object.values(PrincessDomain);
    const priorities = Object.values(TaskPriority);

    for (let i = 0; i < count; i++) {
      const fileCount = 1 + (i % 10); // 1-10 files
      const locCount = 50 + (i % 1000); // 50-1050 LOC

      tasks.push({
        id: `test-task-${i}`,
        name: `Test Task ${i}`,
        description: `Test task with ${fileCount} files and ${locCount} LOC`,
        domain: domains[i % domains.length] as PrincessDomain,
        priority: priorities[i % priorities.length] as TaskPriority,
        files: Array.from({ length: fileCount }, (_, j) => `src/file${i}-${j}.ts`),
        estimatedLOC: locCount,
        dependencies: i % 3 === 0 ? [`dep-${i}`] : []
      });
    }

    return tasks;
  }

  /**
   * Generate complex tasks that require sharding
   */
  private generateComplexTasks(count: number): Task[] {
    const tasks: Task[] = [];

    for (let i = 0; i < count; i++) {
      const fileCount = 15 + (i % 20); // 15-35 files
      const locCount = 2000 + (i % 3000); // 2000-5000 LOC

      tasks.push({
        id: `complex-task-${i}`,
        name: `Complex Task ${i}`,
        description: `Complex task requiring sharding with ${fileCount} files`,
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        files: Array.from({ length: fileCount }, (_, j) => `src/complex/file${i}-${j}.ts`),
        estimatedLOC: locCount,
        dependencies: Array.from({ length: 2 + (i % 5) }, (_, j) => `complex-dep-${i}-${j}`)
      });
    }

    return tasks;
  }

  /**
   * Generate diverse tasks for routing tests
   */
  private generateDiverseRoutingTasks(count: number): Task[] {
    const tasks: Task[] = [];
    const routingTypes = [
      { domain: PrincessDomain.SECURITY, files: ['src/auth.ts', 'src/security.ts'], desc: 'security implementation' },
      { domain: PrincessDomain.QUALITY, files: ['src/test.spec.ts', 'src/quality.test.ts'], desc: 'test implementation' },
      { domain: PrincessDomain.INFRASTRUCTURE, files: ['config/app.json', 'config/env.ts'], desc: 'config setup' },
      { domain: PrincessDomain.RESEARCH, files: ['docs/README.md', 'docs/api.md'], desc: 'documentation' },
      { domain: PrincessDomain.DEPLOYMENT, files: ['deploy/prod.yml', 'deploy/staging.yml'], desc: 'deployment config' },
      { domain: PrincessDomain.DEVELOPMENT, files: ['src/api.ts', 'src/service.ts'], desc: 'general development' }
    ];

    for (let i = 0; i < count; i++) {
      const type = routingTypes[i % routingTypes.length];

      tasks.push({
        id: `routing-task-${i}`,
        name: `Routing Task ${i}`,
        description: type.desc,
        domain: type.domain,
        priority: TaskPriority.MEDIUM,
        files: type.files,
        estimatedLOC: 100 + (i % 500),
        dependencies: []
      });
    }

    return tasks;
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
   * Generate performance report
   */
  generateReport(): string {
    let report = '\n=== KingLogicAdapter Performance Benchmark Report ===\n\n';

    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const totalTests = this.results.length;

    report += `Overall Results: ${passedTests}/${totalTests} tests passed\n\n`;

    // Calculate key performance metrics
    const routingResult = this.results.find(r => r.name === 'Intelligent Routing');
    const shardingResult = this.results.find(r => r.name === 'Task Sharding Execution');
    const coordinationResult = this.results.find(r => r.name === 'Multi-Agent Coordination');

    if (routingResult) {
      report += `Key Metrics:\n`;
      report += `  Routing Performance: ${routingResult.opsPerSecond.toFixed(0)} ops/sec\n`;
    }
    if (shardingResult) {
      report += `  Sharding Performance: ${shardingResult.opsPerSecond.toFixed(0)} ops/sec\n`;
    }
    if (coordinationResult) {
      report += `  Coordination Performance: ${coordinationResult.opsPerSecond.toFixed(0)} ops/sec\n`;
    }
    report += '\n';

    this.results.forEach(result => {
      report += `${result.name}:\n`;
      report += `  Status: ${result.status.toUpperCase()}\n`;
      report += `  Iterations: ${result.iterations}\n`;
      report += `  Average Time: ${result.averageTime.toFixed(3)}ms\n`;
      report += `  P95 Time: ${result.p95.toFixed(3)}ms (threshold: ${result.threshold}ms)\n`;
      report += `  Ops/Second: ${result.opsPerSecond.toFixed(0)}\n`;
      report += `  Memory Delta: ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB\n`;

      if (result.metadata) {
        report += `  Component: ${result.metadata.component}\n`;
        if (result.metadata.operation) {
          report += `  Operation: ${result.metadata.operation}\n`;
        }
      }

      report += '\n';
    });

    return report;
  }
}

// Export for use in test runners
export default KingLogicAdapterBenchmark;

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-01-27T18:52:45-05:00 | performance-benchmarker@Claude Sonnet 4 | Created comprehensive KingLogicAdapter performance benchmark suite with 9 test categories | KingLogicAdapter.bench.ts | OK | Benchmarks routing, sharding, MECE validation, and coordination performance at enterprise scale | 0.00 | cd56ab2 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: perf-benchmarker-king-logic-001
 * - inputs: ["KingLogicAdapter.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"perf-benchmarker-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */