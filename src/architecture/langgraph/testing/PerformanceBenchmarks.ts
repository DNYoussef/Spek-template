/**
 * Performance Benchmarks and Validation Suite
 * Comprehensive testing framework for LangGraph state machine performance
 * Requirements:
 * - Sub-100ms state transitions
 * - Complex workflow validation
 * - Stress testing capabilities
 * - Performance profiling
 * - Memory leak detection
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { LangGraphEngine } from '../LangGraphEngine';
import { StateStore } from '../StateStore';
import { WorkflowOrchestrator } from '../workflows/WorkflowOrchestrator';
import { MessageRouter } from '../communication/MessageRouter';
import { EventBus } from '../communication/EventBus';
import { QueenOrchestrator } from '../queen/QueenOrchestrator';
import { WorkflowDefinition, ExecutionContext } from '../types/workflow.types';

export interface BenchmarkResult {
  testName: string;
  duration: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  p99Time: number;
  throughput: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
    leaked: number;
  };
  success: boolean;
  errors: string[];
  metadata: Record<string, any>;
}

export interface StressTestConfig {
  concurrentUsers: number;
  testDuration: number; // seconds
  rampUpTime: number; // seconds
  workflowComplexity: 'simple' | 'medium' | 'complex';
  enableProfiling: boolean;
}

export interface PerformanceThresholds {
  stateTransition: number; // ms
  workflowExecution: number; // ms
  messageRouting: number; // ms
  memoryLeakThreshold: number; // MB
  throughputMin: number; // operations/second
}

export class PerformanceBenchmarks extends EventEmitter {
  private engine: LangGraphEngine;
  private stateStore: StateStore;
  private orchestrator: WorkflowOrchestrator;
  private messageRouter: MessageRouter;
  private eventBus: EventBus;
  private queenOrchestrator: QueenOrchestrator;
  private results: BenchmarkResult[] = [];
  private isRunning = false;

  private readonly thresholds: PerformanceThresholds = {
    stateTransition: 100, // Sub-100ms requirement
    workflowExecution: 5000, // 5 seconds max
    messageRouting: 50, // 50ms max
    memoryLeakThreshold: 100, // 100MB max leak
    throughputMin: 10 // 10 ops/sec minimum
  };

  constructor() {
    super();
    this.initializeComponents();
  }

  private async initializeComponents(): Promise<void> {
    this.engine = new LangGraphEngine();
    this.stateStore = new StateStore();
    this.orchestrator = new WorkflowOrchestrator();
    this.messageRouter = new MessageRouter();
    this.eventBus = new EventBus();
    this.queenOrchestrator = new QueenOrchestrator();

    await this.engine.initialize();
    await this.stateStore.initialize();
    await this.messageRouter.initialize();
    await this.eventBus.initialize();
    await this.queenOrchestrator.initialize();
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runBenchmarkSuite(): Promise<BenchmarkResult[]> {
    if (this.isRunning) {
      throw new Error('Benchmark suite is already running');
    }

    this.isRunning = true;
    this.results = [];

    try {
      console.log('Starting LangGraph Performance Benchmark Suite...');

      // Core performance tests
      await this.benchmarkStateTransitions();
      await this.benchmarkWorkflowExecution();
      await this.benchmarkMessageRouting();
      await this.benchmarkEventProcessing();
      await this.benchmarkStatePersistence();

      // Complex scenario tests
      await this.benchmarkComplexWorkflows();
      await this.benchmarkConcurrentOperations();
      await this.benchmarkMemoryUsage();

      // Stress tests
      await this.runStressTests();

      // Integration tests
      await this.benchmarkFullSystemIntegration();

      console.log('Benchmark suite completed successfully');
      this.emit('benchmarkComplete', this.results);

      return this.results;
    } catch (error) {
      console.error('Benchmark suite failed:', error);
      this.emit('benchmarkError', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Benchmark state transition performance
   */
  private async benchmarkStateTransitions(): Promise<void> {
    const testName = 'State Transitions';
    const iterations = 1000;
    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();

        // Simulate state transition
        await this.stateStore.setState('test-machine', 'active', {
          timestamp: Date.now(),
          iteration: i
        });

        const end = performance.now();
        times.push(end - start);

        if (i % 100 === 0) {
          console.log(`  Progress: ${i}/${iterations}`);
        }
      } catch (error) {
        errors.push(`Iteration ${i}: ${error.message}`);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    // Validate sub-100ms requirement
    result.success = result.p95Time <= this.thresholds.stateTransition;
    result.metadata = {
      threshold: this.thresholds.stateTransition,
      requirement: 'Sub-100ms state transitions',
      passed: result.success
    };

    this.results.push(result);
    console.log(`  ${testName}: Avg ${result.averageTime.toFixed(2)}ms, P95 ${result.p95Time.toFixed(2)}ms`);
  }

  /**
   * Benchmark workflow execution performance
   */
  private async benchmarkWorkflowExecution(): Promise<void> {
    const testName = 'Workflow Execution';
    const iterations = 100;
    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark...`);

    const workflow: WorkflowDefinition = {
      id: 'benchmark-workflow',
      name: 'Benchmark Test Workflow',
      description: 'Performance testing workflow',
      steps: [
        {
          id: 'step1',
          name: 'Initialize',
          type: 'action',
          action: 'initialize',
          inputs: {},
          outputs: ['result1']
        },
        {
          id: 'step2',
          name: 'Process',
          type: 'action',
          action: 'process',
          inputs: { data: '${result1}' },
          outputs: ['result2']
        },
        {
          id: 'step3',
          name: 'Finalize',
          type: 'action',
          action: 'finalize',
          inputs: { processed: '${result2}' },
          outputs: ['final']
        }
      ],
      transitions: [
        { from: 'step1', to: 'step2', condition: 'true' },
        { from: 'step2', to: 'step3', condition: 'true' }
      ],
      metadata: {
        timeout: 30000,
        retryPolicy: { maxRetries: 3, backoff: 'exponential' }
      }
    };

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();

        await this.engine.executeWorkflow(workflow, {
          executionId: `benchmark-${i}`,
          variables: { testData: `iteration-${i}` }
        });

        const end = performance.now();
        times.push(end - start);

        if (i % 10 === 0) {
          console.log(`  Progress: ${i}/${iterations}`);
        }
      } catch (error) {
        errors.push(`Iteration ${i}: ${error.message}`);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    result.success = result.p95Time <= this.thresholds.workflowExecution;
    result.metadata = {
      threshold: this.thresholds.workflowExecution,
      workflowSteps: workflow.steps.length,
      passed: result.success
    };

    this.results.push(result);
    console.log(`  ${testName}: Avg ${result.averageTime.toFixed(2)}ms, P95 ${result.p95Time.toFixed(2)}ms`);
  }

  /**
   * Benchmark message routing performance
   */
  private async benchmarkMessageRouting(): Promise<void> {
    const testName = 'Message Routing';
    const iterations = 500;
    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();

        await this.messageRouter.sendMessage(
          'benchmark-sender',
          'benchmark-receiver',
          'task_assignment',
          {
            taskId: `task-${i}`,
            data: `test-data-${i}`,
            timestamp: Date.now()
          }
        );

        const end = performance.now();
        times.push(end - start);

        if (i % 50 === 0) {
          console.log(`  Progress: ${i}/${iterations}`);
        }
      } catch (error) {
        errors.push(`Iteration ${i}: ${error.message}`);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    result.success = result.p95Time <= this.thresholds.messageRouting;
    result.metadata = {
      threshold: this.thresholds.messageRouting,
      messageType: 'task_assignment',
      passed: result.success
    };

    this.results.push(result);
    console.log(`  ${testName}: Avg ${result.averageTime.toFixed(2)}ms, P95 ${result.p95Time.toFixed(2)}ms`);
  }

  /**
   * Benchmark event processing performance
   */
  private async benchmarkEventProcessing(): Promise<void> {
    const testName = 'Event Processing';
    const iterations = 1000;
    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();

        await this.eventBus.emitEvent(
          'benchmark_event',
          'benchmark-source',
          {
            eventId: `event-${i}`,
            data: `test-data-${i}`,
            timestamp: Date.now()
          }
        );

        const end = performance.now();
        times.push(end - start);

        if (i % 100 === 0) {
          console.log(`  Progress: ${i}/${iterations}`);
        }
      } catch (error) {
        errors.push(`Iteration ${i}: ${error.message}`);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    result.success = result.averageTime <= 10; // 10ms threshold for events
    result.metadata = {
      threshold: 10,
      eventType: 'benchmark_event',
      passed: result.success
    };

    this.results.push(result);
    console.log(`  ${testName}: Avg ${result.averageTime.toFixed(2)}ms, P95 ${result.p95Time.toFixed(2)}ms`);
  }

  /**
   * Benchmark state persistence performance
   */
  private async benchmarkStatePersistence(): Promise<void> {
    const testName = 'State Persistence';
    const iterations = 200;
    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();

        // Create snapshot
        await this.stateStore.createSnapshot(`snapshot-${i}`);

        const end = performance.now();
        times.push(end - start);

        if (i % 20 === 0) {
          console.log(`  Progress: ${i}/${iterations}`);
        }
      } catch (error) {
        errors.push(`Iteration ${i}: ${error.message}`);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    result.success = result.p95Time <= 1000; // 1 second threshold
    result.metadata = {
      threshold: 1000,
      operation: 'createSnapshot',
      passed: result.success
    };

    this.results.push(result);
    console.log(`  ${testName}: Avg ${result.averageTime.toFixed(2)}ms, P95 ${result.p95Time.toFixed(2)}ms`);
  }

  /**
   * Benchmark complex workflow scenarios
   */
  private async benchmarkComplexWorkflows(): Promise<void> {
    const testName = 'Complex Workflows';
    const iterations = 50;
    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();

        // Create complex workflow from description
        const workflow = await this.orchestrator.createWorkflowFromDescription(
          `Complex benchmark workflow ${i} with conditional branching, parallel execution, and error handling`,
          {
            executionId: `complex-${i}`,
            variables: { complexity: 'high', iteration: i }
          }
        );

        await this.engine.executeWorkflow(workflow);

        const end = performance.now();
        times.push(end - start);

        if (i % 5 === 0) {
          console.log(`  Progress: ${i}/${iterations}`);
        }
      } catch (error) {
        errors.push(`Iteration ${i}: ${error.message}`);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    result.success = result.p95Time <= 10000; // 10 seconds threshold
    result.metadata = {
      threshold: 10000,
      workflowType: 'complex_generated',
      passed: result.success
    };

    this.results.push(result);
    console.log(`  ${testName}: Avg ${result.averageTime.toFixed(2)}ms, P95 ${result.p95Time.toFixed(2)}ms`);
  }

  /**
   * Benchmark concurrent operations
   */
  private async benchmarkConcurrentOperations(): Promise<void> {
    const testName = 'Concurrent Operations';
    const concurrentOps = 50;
    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark with ${concurrentOps} concurrent operations...`);

    const start = performance.now();

    const promises = Array.from({ length: concurrentOps }, async (_, i) => {
      try {
        const opStart = performance.now();

        // Concurrent state operations
        await Promise.all([
          this.stateStore.setState(`concurrent-${i}`, 'processing', { id: i }),
          this.messageRouter.sendMessage(`sender-${i}`, `receiver-${i}`, 'task_assignment', { id: i }),
          this.eventBus.emitEvent('concurrent_test', `source-${i}`, { id: i })
        ]);

        const opEnd = performance.now();
        times.push(opEnd - opStart);
      } catch (error) {
        errors.push(`Operation ${i}: ${error.message}`);
      }
    });

    await Promise.all(promises);
    const end = performance.now();

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    result.metadata.totalDuration = end - start;
    result.metadata.concurrentOperations = concurrentOps;
    result.success = result.p95Time <= 500; // 500ms threshold for concurrent ops
    result.metadata.passed = result.success;

    this.results.push(result);
    console.log(`  ${testName}: Total ${(end - start).toFixed(2)}ms, Concurrent Avg ${result.averageTime.toFixed(2)}ms`);
  }

  /**
   * Benchmark memory usage and detect leaks
   */
  private async benchmarkMemoryUsage(): Promise<void> {
    const testName = 'Memory Usage';
    const iterations = 100;
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark...`);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memorySnapshots: number[] = [];

    for (let i = 0; i < iterations; i++) {
      try {
        // Create and execute workflow
        const workflow = await this.orchestrator.createWorkflowFromDescription(
          `Memory test workflow ${i}`,
          { executionId: `memory-${i}` }
        );

        await this.engine.executeWorkflow(workflow);

        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          const currentMemory = process.memoryUsage().heapUsed;
          memorySnapshots.push(currentMemory);
          console.log(`  Iteration ${i}: Memory ${(currentMemory / 1024 / 1024).toFixed(2)}MB`);
        }
      } catch (error) {
        errors.push(`Iteration ${i}: ${error.message}`);
      }
    }

    // Force garbage collection again
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryLeak = (finalMemory - initialMemory) / 1024 / 1024; // MB

    const result: BenchmarkResult = {
      testName,
      duration: 0, // Not applicable for memory test
      iterations,
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
      p95Time: 0,
      p99Time: 0,
      throughput: 0,
      memoryUsage: {
        initial: initialMemory / 1024 / 1024,
        peak: Math.max(...memorySnapshots) / 1024 / 1024,
        final: finalMemory / 1024 / 1024,
        leaked: memoryLeak
      },
      success: memoryLeak <= this.thresholds.memoryLeakThreshold,
      errors,
      metadata: {
        threshold: this.thresholds.memoryLeakThreshold,
        leakDetected: memoryLeak > this.thresholds.memoryLeakThreshold,
        passed: memoryLeak <= this.thresholds.memoryLeakThreshold
      }
    };

    this.results.push(result);
    console.log(`  ${testName}: Leak ${memoryLeak.toFixed(2)}MB, Threshold ${this.thresholds.memoryLeakThreshold}MB`);
  }

  /**
   * Run stress tests with varying loads
   */
  private async runStressTests(): Promise<void> {
    const configs: StressTestConfig[] = [
      { concurrentUsers: 10, testDuration: 30, rampUpTime: 5, workflowComplexity: 'simple', enableProfiling: false },
      { concurrentUsers: 25, testDuration: 60, rampUpTime: 10, workflowComplexity: 'medium', enableProfiling: false },
      { concurrentUsers: 50, testDuration: 120, rampUpTime: 20, workflowComplexity: 'complex', enableProfiling: true }
    ];

    for (const config of configs) {
      await this.runStressTest(config);
    }
  }

  /**
   * Run individual stress test
   */
  private async runStressTest(config: StressTestConfig): Promise<void> {
    const testName = `Stress Test (${config.concurrentUsers} users, ${config.workflowComplexity})`;
    console.log(`Running ${testName}...`);

    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    const startTime = Date.now();
    const endTime = startTime + (config.testDuration * 1000);
    const rampUpEndTime = startTime + (config.rampUpTime * 1000);

    let activeUsers = 0;
    let completedOperations = 0;

    const userPromises: Promise<void>[] = [];

    // Simulate users with ramp-up
    for (let userId = 0; userId < config.concurrentUsers; userId++) {
      const userStartTime = startTime + (userId * (config.rampUpTime * 1000) / config.concurrentUsers);

      const userPromise = this.simulateUser(
        userId,
        userStartTime,
        endTime,
        config.workflowComplexity,
        times,
        errors
      );

      userPromises.push(userPromise);
    }

    // Wait for all users to complete
    await Promise.all(userPromises);

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    result.success = result.throughput >= this.thresholds.throughputMin && result.p95Time <= this.thresholds.workflowExecution;
    result.metadata = {
      config,
      throughputThreshold: this.thresholds.throughputMin,
      latencyThreshold: this.thresholds.workflowExecution,
      passed: result.success
    };

    this.results.push(result);
    console.log(`  ${testName}: Throughput ${result.throughput.toFixed(2)} ops/sec, P95 ${result.p95Time.toFixed(2)}ms`);
  }

  /**
   * Simulate individual user behavior
   */
  private async simulateUser(
    userId: number,
    startTime: number,
    endTime: number,
    complexity: 'simple' | 'medium' | 'complex',
    times: number[],
    errors: string[]
  ): Promise<void> {
    // Wait for user start time
    const currentTime = Date.now();
    if (currentTime < startTime) {
      await new Promise(resolve => setTimeout(resolve, startTime - currentTime));
    }

    let operationCount = 0;

    while (Date.now() < endTime) {
      try {
        const opStart = performance.now();

        // Create workflow based on complexity
        const description = this.generateWorkflowDescription(complexity, userId, operationCount);
        const workflow = await this.orchestrator.createWorkflowFromDescription(description, {
          executionId: `stress-user${userId}-op${operationCount}`,
          variables: { userId, operationCount, complexity }
        });

        await this.engine.executeWorkflow(workflow);

        const opEnd = performance.now();
        times.push(opEnd - opStart);
        operationCount++;

        // Brief pause between operations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

      } catch (error) {
        errors.push(`User ${userId}, Op ${operationCount}: ${error.message}`);
      }
    }
  }

  /**
   * Generate workflow description based on complexity
   */
  private generateWorkflowDescription(
    complexity: 'simple' | 'medium' | 'complex',
    userId: number,
    operationCount: number
  ): string {
    const descriptions = {
      simple: `Simple workflow for user ${userId} operation ${operationCount}`,
      medium: `Medium complexity workflow with conditional logic for user ${userId} operation ${operationCount}`,
      complex: `Complex workflow with parallel execution, error handling, and state management for user ${userId} operation ${operationCount}`
    };

    return descriptions[complexity];
  }

  /**
   * Benchmark full system integration
   */
  private async benchmarkFullSystemIntegration(): Promise<void> {
    const testName = 'Full System Integration';
    const iterations = 20;
    const times: number[] = [];
    const errors: string[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    console.log(`Running ${testName} benchmark...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();

        // Full system workflow involving all components
        const objectiveId = await this.queenOrchestrator.defineObjective({
          name: `Integration Test Objective ${i}`,
          description: 'Full system integration test',
          priority: 'high',
          targetDomains: ['infrastructure', 'research', 'development'],
          successCriteria: ['All components respond', 'No errors detected'],
          constraints: { budget: 1000, timeLimit: 300000 }
        });

        // Execute objective
        await this.queenOrchestrator.executeObjective(objectiveId);

        const end = performance.now();
        times.push(end - start);

        console.log(`  Integration test ${i + 1}/${iterations} completed`);

      } catch (error) {
        errors.push(`Integration ${i}: ${error.message}`);
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const result = this.calculateMetrics(testName, times, initialMemory, finalMemory, errors);

    result.success = result.p95Time <= 30000; // 30 seconds for full integration
    result.metadata = {
      threshold: 30000,
      componentsInvolved: ['Queen', 'StateStore', 'WorkflowOrchestrator', 'MessageRouter', 'EventBus'],
      passed: result.success
    };

    this.results.push(result);
    console.log(`  ${testName}: Avg ${result.averageTime.toFixed(2)}ms, P95 ${result.p95Time.toFixed(2)}ms`);
  }

  /**
   * Calculate performance metrics from timing data
   */
  private calculateMetrics(
    testName: string,
    times: number[],
    initialMemory: number,
    finalMemory: number,
    errors: string[]
  ): BenchmarkResult {
    if (times.length === 0) {
      return {
        testName,
        duration: 0,
        iterations: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        p95Time: 0,
        p99Time: 0,
        throughput: 0,
        memoryUsage: {
          initial: initialMemory / 1024 / 1024,
          peak: finalMemory / 1024 / 1024,
          final: finalMemory / 1024 / 1024,
          leaked: (finalMemory - initialMemory) / 1024 / 1024
        },
        success: false,
        errors,
        metadata: {}
      };
    }

    times.sort((a, b) => a - b);

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = times[0];
    const maxTime = times[times.length - 1];
    const p95Index = Math.floor(times.length * 0.95);
    const p99Index = Math.floor(times.length * 0.99);
    const p95Time = times[p95Index];
    const p99Time = times[p99Index];
    const throughput = (times.length / totalTime) * 1000; // operations per second

    return {
      testName,
      duration: totalTime,
      iterations: times.length,
      averageTime,
      minTime,
      maxTime,
      p95Time,
      p99Time,
      throughput,
      memoryUsage: {
        initial: initialMemory / 1024 / 1024,
        peak: Math.max(initialMemory, finalMemory) / 1024 / 1024,
        final: finalMemory / 1024 / 1024,
        leaked: (finalMemory - initialMemory) / 1024 / 1024
      },
      success: true,
      errors,
      metadata: {}
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available. Run benchmarks first.';
    }

    let report = '\n=== LangGraph Performance Benchmark Report ===\n\n';

    // Summary
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const passRate = (passedTests / totalTests) * 100;

    report += `Summary:\n`;
    report += `  Total Tests: ${totalTests}\n`;
    report += `  Passed: ${passedTests}\n`;
    report += `  Failed: ${totalTests - passedTests}\n`;
    report += `  Pass Rate: ${passRate.toFixed(1)}%\n\n`;

    // Critical thresholds validation
    report += `Critical Requirements:\n`;
    const stateTransitionTest = this.results.find(r => r.testName === 'State Transitions');
    if (stateTransitionTest) {
      report += `  State Transition (sub-100ms): ${stateTransitionTest.p95Time.toFixed(2)}ms - ${stateTransitionTest.success ? 'PASS' : 'FAIL'}\n`;
    }

    // Detailed results
    report += `\nDetailed Results:\n`;
    report += `${'Test Name'.padEnd(25)} ${'Avg (ms)'.padEnd(10)} ${'P95 (ms)'.padEnd(10)} ${'P99 (ms)'.padEnd(10)} ${'Throughput'.padEnd(12)} ${'Memory (MB)'.padEnd(12)} ${'Status'.padEnd(8)}\n`;
    report += '-'.repeat(100) + '\n';

    for (const result of this.results) {
      const status = result.success ? 'PASS' : 'FAIL';
      const memoryLeak = result.memoryUsage.leaked.toFixed(1);
      const throughputStr = result.throughput > 0 ? result.throughput.toFixed(1) + ' op/s' : 'N/A';

      report += `${result.testName.padEnd(25)} ${result.averageTime.toFixed(2).padEnd(10)} ${result.p95Time.toFixed(2).padEnd(10)} ${result.p99Time.toFixed(2).padEnd(10)} ${throughputStr.padEnd(12)} ${memoryLeak.padEnd(12)} ${status.padEnd(8)}\n`;
    }

    // Errors summary
    const failedTests = this.results.filter(r => !r.success || r.errors.length > 0);
    if (failedTests.length > 0) {
      report += `\nErrors and Failures:\n`;
      for (const test of failedTests) {
        if (!test.success) {
          report += `  ${test.testName}: Performance threshold exceeded\n`;
        }
        if (test.errors.length > 0) {
          report += `  ${test.testName}: ${test.errors.length} error(s)\n`;
          test.errors.slice(0, 3).forEach(error => {
            report += `    - ${error}\n`;
          });
          if (test.errors.length > 3) {
            report += `    ... and ${test.errors.length - 3} more\n`;
          }
        }
      }
    }

    // Recommendations
    report += `\nRecommendations:\n`;
    if (passRate < 100) {
      report += `  - Address failing tests to meet performance requirements\n`;
    }
    if (this.results.some(r => r.memoryUsage.leaked > this.thresholds.memoryLeakThreshold)) {
      report += `  - Investigate memory leaks in components\n`;
    }
    if (this.results.some(r => r.throughput < this.thresholds.throughputMin)) {
      report += `  - Optimize throughput for better scalability\n`;
    }

    report += `\nBenchmark completed at: ${new Date().toISOString()}\n`;

    return report;
  }

  /**
   * Export results as JSON
   */
  exportResults(): object {
    return {
      timestamp: new Date().toISOString(),
      thresholds: this.thresholds,
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter(r => r.success).length,
        passRate: (this.results.filter(r => r.success).length / this.results.length) * 100
      },
      results: this.results
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Cannot cleanup while benchmarks are running');
    }

    await this.stateStore.cleanup();
    await this.messageRouter.cleanup();
    await this.eventBus.cleanup();
    await this.queenOrchestrator.cleanup();

    this.results = [];
    this.removeAllListeners();
  }
}

export default PerformanceBenchmarks;