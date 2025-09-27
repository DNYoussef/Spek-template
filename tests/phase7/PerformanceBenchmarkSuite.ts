/**
 * Performance Benchmarking Suite for Phase 7 Princess Systems
 * Comprehensive performance validation including:
 * - MemoryPerformanceBenchmark: 10MB memory system performance testing
 * - APIPerformanceBenchmark: All Princess API performance validation
 * - StateTransitionBenchmark: LangGraph state transition performance
 * - ConcurrencyBenchmark: Multi-Princess concurrent operation testing
 * - LoadTestingFramework: Realistic load testing scenarios
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/testing-library/jest-dom';
import { InfrastructurePrincess } from '../../src/swarm/hierarchy/domains/InfrastructurePrincess';
import { ResearchPrincess } from '../../src/swarm/hierarchy/domains/ResearchPrincess';
import { QualityPrincess } from '../../src/swarm/hierarchy/domains/QualityPrincess';
import { DocumentationPrincess } from '../../src/swarm/hierarchy/domains/DocumentationPrincess';
import { MemoryCoordinator } from '../../src/swarm/memory/MemoryCoordinator';
import { LangGraphStateManager } from '../../src/swarm/state/LangGraphStateManager';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';

interface PerformanceBenchmarkMetrics {
  memoryAllocationSpeed: number;
  memoryThroughput: number;
  apiResponseTime: number;
  apiThroughput: number;
  stateTransitionLatency: number;
  concurrencyPerformance: number;
  loadTestScore: number;
  overallPerformanceScore: number;
}

interface BenchmarkResult {
  testName: string;
  metric: string;
  value: number;
  unit: string;
  threshold: number;
  passed: boolean;
  percentile95?: number;
  percentile99?: number;
}

export class PerformanceBenchmarkSuite {
  private infrastructurePrincess: InfrastructurePrincess;
  private researchPrincess: ResearchPrincess;
  private qualityPrincess: QualityPrincess;
  private documentationPrincess: DocumentationPrincess;
  private memoryCoordinator: MemoryCoordinator;
  private stateManager: LangGraphStateManager;
  private performanceMonitor: PerformanceMonitor;
  private benchmarkMetrics: PerformanceBenchmarkMetrics;
  private benchmarkResults: BenchmarkResult[] = [];

  constructor() {
    this.infrastructurePrincess = new InfrastructurePrincess();
    this.researchPrincess = new ResearchPrincess();
    this.qualityPrincess = new QualityPrincess();
    this.documentationPrincess = new DocumentationPrincess();
    this.memoryCoordinator = new MemoryCoordinator();
    this.stateManager = new LangGraphStateManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.benchmarkMetrics = {
      memoryAllocationSpeed: 0,
      memoryThroughput: 0,
      apiResponseTime: 0,
      apiThroughput: 0,
      stateTransitionLatency: 0,
      concurrencyPerformance: 0,
      loadTestScore: 0,
      overallPerformanceScore: 0
    };
  }

  /**
   * Run comprehensive performance benchmark suite
   */
  async runComprehensiveBenchmarks(): Promise<{
    passed: boolean;
    score: number;
    metrics: PerformanceBenchmarkMetrics;
    details: any;
  }> {
    console.log('[Performance Benchmark] Starting comprehensive performance benchmarks...');

    try {
      // 1. Memory Performance Benchmarks
      const memoryResults = await this.runMemoryPerformanceBenchmarks();

      // 2. API Performance Benchmarks
      const apiResults = await this.runAPIPerformanceBenchmarks();

      // 3. State Transition Benchmarks
      const stateResults = await this.runStateTransitionBenchmarks();

      // 4. Concurrency Benchmarks
      const concurrencyResults = await this.runConcurrencyBenchmarks();

      // 5. Load Testing Benchmarks
      const loadTestResults = await this.runLoadTestingBenchmarks();

      // 6. System Resource Benchmarks
      const resourceResults = await this.runSystemResourceBenchmarks();

      // 7. End-to-End Performance Benchmarks
      const e2eResults = await this.runEndToEndPerformanceBenchmarks();

      // Calculate overall performance score
      const overallScore = this.calculateOverallPerformanceScore([
        memoryResults,
        apiResults,
        stateResults,
        concurrencyResults,
        loadTestResults,
        resourceResults,
        e2eResults
      ]);

      this.benchmarkMetrics.overallPerformanceScore = overallScore;

      return {
        passed: overallScore >= 90, // 90% threshold for performance benchmarks
        score: overallScore,
        metrics: this.benchmarkMetrics,
        details: {
          memoryPerformance: memoryResults,
          apiPerformance: apiResults,
          stateTransitions: stateResults,
          concurrency: concurrencyResults,
          loadTesting: loadTestResults,
          systemResources: resourceResults,
          endToEndPerformance: e2eResults,
          benchmarkResults: this.benchmarkResults
        }
      };
    } catch (error) {
      console.error('[Performance Benchmark] Benchmarking failed:', error);
      return {
        passed: false,
        score: 0,
        metrics: this.benchmarkMetrics,
        details: { error: error.message }
      };
    }
  }

  /**
   * Memory Performance Benchmarks
   */
  private async runMemoryPerformanceBenchmarks(): Promise<any> {
    console.log('[Performance Benchmark] Running Memory Performance Benchmarks...');

    const benchmarks = [
      {
        name: 'Memory Allocation Speed',
        test: async () => {
          const allocationSizes = [1024, 4096, 16384, 65536, 262144]; // 1KB to 256KB
          const allocationsPerSize = 1000;
          const results = [];

          for (const size of allocationSizes) {
            const startTime = performance.now();

            for (let i = 0; i < allocationsPerSize; i++) {
              await this.memoryCoordinator.allocate(size);
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const allocationsPerSecond = (allocationsPerSize / totalTime) * 1000;

            results.push({
              size,
              allocationsPerSecond,
              avgAllocationTime: totalTime / allocationsPerSize
            });

            this.addBenchmarkResult('Memory Allocation Speed', `${size}B allocations/sec`, allocationsPerSecond, 'ops/sec', 10000);
          }

          const avgAllocationSpeed = results.reduce((sum, r) => sum + r.allocationsPerSecond, 0) / results.length;
          this.benchmarkMetrics.memoryAllocationSpeed = avgAllocationSpeed;

          expect(avgAllocationSpeed).toBeGreaterThan(50000); // >50K allocations/sec

          return { success: true, results, avgAllocationSpeed };
        }
      },
      {
        name: 'Memory Throughput',
        test: async () => {
          const testDuration = 10000; // 10 seconds
          const blockSize = 4096; // 4KB blocks
          let bytesAllocated = 0;
          let allocationsCount = 0;

          const startTime = Date.now();
          while (Date.now() - startTime < testDuration) {
            await this.memoryCoordinator.allocate(blockSize);
            bytesAllocated += blockSize;
            allocationsCount++;
          }

          const actualDuration = Date.now() - startTime;
          const throughputMBps = (bytesAllocated / (1024 * 1024)) / (actualDuration / 1000);

          this.benchmarkMetrics.memoryThroughput = throughputMBps;
          this.addBenchmarkResult('Memory Throughput', 'MB/sec', throughputMBps, 'MB/sec', 100);

          expect(throughputMBps).toBeGreaterThan(500); // >500 MB/sec

          return { success: true, throughputMBps, allocationsCount };
        }
      },
      {
        name: 'Memory Fragmentation Performance',
        test: async () => {
          const fragmentationTest = async () => {
            const blocks = [];

            // Create fragmentation pattern
            for (let i = 0; i < 1000; i++) {
              const size = Math.random() * 8192 + 1024; // Random sizes 1-9KB
              const block = await this.memoryCoordinator.allocate(size);
              blocks.push(block);

              // Randomly deallocate some blocks
              if (i % 5 === 0 && blocks.length > 10) {
                const randomIndex = Math.floor(Math.random() * blocks.length);
                await this.memoryCoordinator.deallocate(blocks[randomIndex]);
                blocks.splice(randomIndex, 1);
              }
            }

            return blocks.length;
          };

          const startTime = performance.now();
          const allocatedBlocks = await fragmentationTest();
          const endTime = performance.now();

          const fragmentationPerformance = (allocatedBlocks / (endTime - startTime)) * 1000;

          this.addBenchmarkResult('Fragmentation Performance', 'allocations/sec under fragmentation', fragmentationPerformance, 'ops/sec', 5000);

          expect(fragmentationPerformance).toBeGreaterThan(10000); // >10K ops/sec under fragmentation

          return { success: true, fragmentationPerformance, allocatedBlocks };
        }
      },
      {
        name: 'Memory Pool Efficiency',
        test: async () => {
          const poolSize = 10 * 1024 * 1024; // 10MB
          const testAllocations = 10000;
          const avgBlockSize = 1024; // 1KB average

          const startTime = performance.now();

          // Fill and empty pool multiple times
          for (let cycle = 0; cycle < 5; cycle++) {
            const blocks = [];

            // Allocate until near capacity
            while (blocks.length < testAllocations / 5) {
              const block = await this.memoryCoordinator.allocate(avgBlockSize);
              blocks.push(block);
            }

            // Deallocate all
            for (const block of blocks) {
              await this.memoryCoordinator.deallocate(block);
            }
          }

          const endTime = performance.now();
          const efficiency = (testAllocations / (endTime - startTime)) * 1000;

          this.addBenchmarkResult('Pool Efficiency', 'pool cycles/sec', efficiency, 'cycles/sec', 1000);

          expect(efficiency).toBeGreaterThan(2000); // >2K cycles/sec

          return { success: true, efficiency };
        }
      }
    ];

    const results = await this.runBenchmarkSuite('Memory Performance', benchmarks);
    return results;
  }

  /**
   * API Performance Benchmarks
   */
  private async runAPIPerformanceBenchmarks(): Promise<any> {
    console.log('[Performance Benchmark] Running API Performance Benchmarks...');

    const benchmarks = [
      {
        name: 'Princess API Response Time',
        test: async () => {
          const princesses = [
            { name: 'Infrastructure', instance: this.infrastructurePrincess },
            { name: 'Research', instance: this.researchPrincess },
            { name: 'Quality', instance: this.qualityPrincess },
            { name: 'Documentation', instance: this.documentationPrincess }
          ];

          const responseTimeResults = [];

          for (const princess of princesses) {
            const responseTimes = [];

            for (let i = 0; i < 100; i++) {
              const startTime = performance.now();

              await princess.instance.executeTask({
                id: `api-benchmark-${i}`,
                type: 'benchmark',
                complexity: 'low'
              });

              const endTime = performance.now();
              responseTimes.push(endTime - startTime);
            }

            const avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
            const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

            responseTimeResults.push({
              princess: princess.name,
              avgResponseTime,
              p95ResponseTime
            });

            this.addBenchmarkResult(`${princess.name} API Response Time`, 'ms average', avgResponseTime, 'ms', 100);
            this.addBenchmarkResult(`${princess.name} API Response Time P95`, 'ms p95', p95ResponseTime, 'ms', 200);

            expect(avgResponseTime).toBeLessThan(200); // <200ms average
            expect(p95ResponseTime).toBeLessThan(500); // <500ms p95
          }

          const overallAvgResponseTime = responseTimeResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / responseTimeResults.length;
          this.benchmarkMetrics.apiResponseTime = overallAvgResponseTime;

          return { success: true, responseTimeResults, overallAvgResponseTime };
        }
      },
      {
        name: 'API Throughput',
        test: async () => {
          const testDuration = 30000; // 30 seconds
          const princesses = [this.infrastructurePrincess, this.researchPrincess, this.qualityPrincess, this.documentationPrincess];

          const throughputResults = [];

          for (const princess of princesses) {
            let requestCount = 0;
            const startTime = Date.now();

            while (Date.now() - startTime < testDuration) {
              await princess.executeTask({
                id: `throughput-test-${requestCount}`,
                type: 'benchmark',
                complexity: 'minimal'
              });
              requestCount++;
            }

            const actualDuration = Date.now() - startTime;
            const throughput = (requestCount / actualDuration) * 1000; // requests per second

            throughputResults.push({
              princess: princess.constructor.name,
              throughput,
              requestCount
            });

            this.addBenchmarkResult(`${princess.constructor.name} Throughput`, 'requests/sec', throughput, 'req/sec', 10);

            expect(throughput).toBeGreaterThan(5); // >5 requests/sec
          }

          const avgThroughput = throughputResults.reduce((sum, r) => sum + r.throughput, 0) / throughputResults.length;
          this.benchmarkMetrics.apiThroughput = avgThroughput;

          return { success: true, throughputResults, avgThroughput };
        }
      },
      {
        name: 'Concurrent API Performance',
        test: async () => {
          const concurrencyLevels = [10, 25, 50, 100];
          const concurrentResults = [];

          for (const concurrency of concurrencyLevels) {
            const promises = [];
            const startTime = performance.now();

            for (let i = 0; i < concurrency; i++) {
              const princess = [this.infrastructurePrincess, this.researchPrincess, this.qualityPrincess, this.documentationPrincess][i % 4];
              promises.push(princess.executeTask({
                id: `concurrent-${i}`,
                type: 'benchmark',
                complexity: 'medium'
              }));
            }

            const results = await Promise.all(promises);
            const endTime = performance.now();

            const totalTime = endTime - startTime;
            const avgResponseTime = totalTime / concurrency;
            const throughput = (concurrency / totalTime) * 1000;

            concurrentResults.push({
              concurrency,
              avgResponseTime,
              throughput,
              successRate: (results.filter(r => r.result).length / concurrency) * 100
            });

            this.addBenchmarkResult(`Concurrent API (${concurrency})`, 'avg response ms', avgResponseTime, 'ms', 1000);

            expect(avgResponseTime).toBeLessThan(2000); // <2s average under concurrency
          }

          return { success: true, concurrentResults };
        }
      }
    ];

    const results = await this.runBenchmarkSuite('API Performance', benchmarks);
    return results;
  }

  /**
   * State Transition Benchmarks
   */
  private async runStateTransitionBenchmarks(): Promise<any> {
    console.log('[Performance Benchmark] Running State Transition Benchmarks...');

    const benchmarks = [
      {
        name: 'State Transition Latency',
        test: async () => {
          const stateMachine = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');
          const transitionCount = 10000;
          const latencies = [];

          for (let i = 0; i < transitionCount; i++) {
            const startTime = performance.now();
            await stateMachine.transition('start_task');
            await stateMachine.transition('requirements_analyzed');
            await stateMachine.reset();
            const endTime = performance.now();

            latencies.push(endTime - startTime);
          }

          const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
          const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
          const p99Latency = latencies[Math.floor(latencies.length * 0.99)];

          this.benchmarkMetrics.stateTransitionLatency = avgLatency;
          this.addBenchmarkResult('State Transition Latency', 'ms average', avgLatency, 'ms', 5, p95Latency, p99Latency);

          expect(avgLatency).toBeLessThan(10); // <10ms average
          expect(p95Latency).toBeLessThan(25); // <25ms p95

          return { success: true, avgLatency, p95Latency, p99Latency, transitionCount };
        }
      },
      {
        name: 'State Machine Throughput',
        test: async () => {
          const duration = 10000; // 10 seconds
          const stateMachine = await this.stateManager.createPrincessStateMachine('ResearchPrincess');
          let transitionCount = 0;

          const startTime = Date.now();
          while (Date.now() - startTime < duration) {
            await stateMachine.transition('start_task');
            await stateMachine.transition('gathering_sources');
            await stateMachine.reset();
            transitionCount += 2; // Count both transitions
          }

          const actualDuration = Date.now() - startTime;
          const throughput = (transitionCount / actualDuration) * 1000;

          this.addBenchmarkResult('State Machine Throughput', 'transitions/sec', throughput, 'trans/sec', 1000);

          expect(throughput).toBeGreaterThan(2000); // >2K transitions/sec

          return { success: true, throughput, transitionCount };
        }
      },
      {
        name: 'Multi-State Machine Performance',
        test: async () => {
          const stateMachineCount = 100;
          const stateMachines = [];

          // Create multiple state machines
          const creationStartTime = performance.now();
          for (let i = 0; i < stateMachineCount; i++) {
            const sm = await this.stateManager.createPrincessStateMachine(`TestPrincess${i}`);
            stateMachines.push(sm);
          }
          const creationTime = performance.now() - creationStartTime;

          // Test concurrent transitions
          const transitionStartTime = performance.now();
          const promises = stateMachines.map(async (sm, index) => {
            for (let i = 0; i < 10; i++) {
              await sm.transition('start_task');
              await sm.reset();
            }
          });

          await Promise.all(promises);
          const transitionTime = performance.now() - transitionStartTime;

          const creationRate = (stateMachineCount / creationTime) * 1000;
          const transitionRate = ((stateMachineCount * 10) / transitionTime) * 1000;

          this.addBenchmarkResult('State Machine Creation Rate', 'state machines/sec', creationRate, 'sm/sec', 100);
          this.addBenchmarkResult('Multi-SM Transition Rate', 'transitions/sec', transitionRate, 'trans/sec', 500);

          expect(creationRate).toBeGreaterThan(200); // >200 state machines/sec
          expect(transitionRate).toBeGreaterThan(1000); // >1K transitions/sec

          return { success: true, creationRate, transitionRate, stateMachineCount };
        }
      }
    ];

    const results = await this.runBenchmarkSuite('State Transition Performance', benchmarks);
    return results;
  }

  /**
   * Concurrency Benchmarks
   */
  private async runConcurrencyBenchmarks(): Promise<any> {
    console.log('[Performance Benchmark] Running Concurrency Benchmarks...');

    const benchmarks = [
      {
        name: 'Multi-Princess Concurrent Operations',
        test: async () => {
          const concurrencyLevels = [10, 25, 50, 100, 200];
          const concurrencyResults = [];

          for (const level of concurrencyLevels) {
            const startTime = performance.now();
            const promises = [];

            for (let i = 0; i < level; i++) {
              const princess = [
                this.infrastructurePrincess,
                this.researchPrincess,
                this.qualityPrincess,
                this.documentationPrincess
              ][i % 4];

              promises.push(princess.executeTask({
                id: `concurrency-${level}-${i}`,
                type: 'benchmark',
                workload: 'standard'
              }));
            }

            const results = await Promise.all(promises);
            const endTime = performance.now();

            const duration = endTime - startTime;
            const throughput = (level / duration) * 1000;
            const successRate = (results.filter(r => r.result).length / level) * 100;

            concurrencyResults.push({
              level,
              duration,
              throughput,
              successRate
            });

            this.addBenchmarkResult(`Concurrency Level ${level}`, 'operations/sec', throughput, 'ops/sec', 10);

            expect(successRate).toBeGreaterThan(95); // >95% success rate
            expect(throughput).toBeGreaterThan(5); // >5 ops/sec minimum
          }

          const avgConcurrencyPerformance = concurrencyResults.reduce((sum, r) => sum + r.throughput, 0) / concurrencyResults.length;
          this.benchmarkMetrics.concurrencyPerformance = avgConcurrencyPerformance;

          return { success: true, concurrencyResults, avgConcurrencyPerformance };
        }
      },
      {
        name: 'Memory Coordinator Concurrent Access',
        test: async () => {
          const concurrentAccessors = 50;
          const accessesPerAccessor = 100;

          const startTime = performance.now();
          const promises = [];

          for (let i = 0; i < concurrentAccessors; i++) {
            promises.push(this.runConcurrentMemoryOperations(accessesPerAccessor, i));
          }

          const results = await Promise.all(promises);
          const endTime = performance.now();

          const totalOperations = concurrentAccessors * accessesPerAccessor;
          const duration = endTime - startTime;
          const throughput = (totalOperations / duration) * 1000;

          const successfulOperations = results.reduce((sum, r) => sum + r.successfulOperations, 0);
          const successRate = (successfulOperations / totalOperations) * 100;

          this.addBenchmarkResult('Concurrent Memory Access', 'operations/sec', throughput, 'ops/sec', 5000);

          expect(successRate).toBeGreaterThan(98); // >98% success rate
          expect(throughput).toBeGreaterThan(10000); // >10K ops/sec

          return { success: true, throughput, successRate, totalOperations };
        }
      }
    ];

    const results = await this.runBenchmarkSuite('Concurrency Performance', benchmarks);
    return results;
  }

  /**
   * Load Testing Benchmarks
   */
  private async runLoadTestingBenchmarks(): Promise<any> {
    console.log('[Performance Benchmark] Running Load Testing Benchmarks...');

    const benchmarks = [
      {
        name: 'Sustained Load Performance',
        test: async () => {
          const loadDuration = 60000; // 60 seconds
          const targetTPS = 20; // 20 transactions per second
          const intervalMs = 1000 / targetTPS;

          let totalTransactions = 0;
          let successfulTransactions = 0;
          const responseTimes = [];

          const startTime = Date.now();

          while (Date.now() - startTime < loadDuration) {
            const transactionStart = performance.now();

            try {
              const princess = [
                this.infrastructurePrincess,
                this.researchPrincess,
                this.qualityPrincess,
                this.documentationPrincess
              ][totalTransactions % 4];

              await princess.executeTask({
                id: `load-test-${totalTransactions}`,
                type: 'load_test',
                complexity: 'medium'
              });

              successfulTransactions++;
              const responseTime = performance.now() - transactionStart;
              responseTimes.push(responseTime);
            } catch (error) {
              console.warn(`Transaction ${totalTransactions} failed:`, error.message);
            }

            totalTransactions++;

            // Wait for next interval
            await new Promise(resolve => setTimeout(resolve, intervalMs));
          }

          const actualDuration = Date.now() - startTime;
          const actualTPS = (totalTransactions / actualDuration) * 1000;
          const successRate = (successfulTransactions / totalTransactions) * 100;
          const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;

          this.benchmarkMetrics.loadTestScore = successRate;
          this.addBenchmarkResult('Sustained Load TPS', 'transactions/sec', actualTPS, 'tps', 15);
          this.addBenchmarkResult('Sustained Load Success Rate', 'percentage', successRate, '%', 95);

          expect(successRate).toBeGreaterThan(95); // >95% success rate
          expect(avgResponseTime).toBeLessThan(1000); // <1s average response time

          return { success: true, actualTPS, successRate, avgResponseTime, totalTransactions };
        }
      },
      {
        name: 'Spike Load Handling',
        test: async () => {
          // Normal load: 10 TPS for 10 seconds
          // Spike load: 100 TPS for 10 seconds
          // Recovery: 10 TPS for 10 seconds

          const phases = [
            { name: 'normal', tps: 10, duration: 10000 },
            { name: 'spike', tps: 100, duration: 10000 },
            { name: 'recovery', tps: 10, duration: 10000 }
          ];

          const phaseResults = [];

          for (const phase of phases) {
            const phaseStart = Date.now();
            const intervalMs = 1000 / phase.tps;
            let phaseTransactions = 0;
            let phaseSuccessful = 0;

            while (Date.now() - phaseStart < phase.duration) {
              try {
                const princess = [
                  this.infrastructurePrincess,
                  this.researchPrincess,
                  this.qualityPrincess,
                  this.documentationPrincess
                ][phaseTransactions % 4];

                await princess.executeTask({
                  id: `spike-test-${phase.name}-${phaseTransactions}`,
                  type: 'spike_test',
                  phase: phase.name
                });

                phaseSuccessful++;
              } catch (error) {
                // Expected during spike phase
              }

              phaseTransactions++;
              await new Promise(resolve => setTimeout(resolve, intervalMs));
            }

            const phaseSuccessRate = (phaseSuccessful / phaseTransactions) * 100;
            phaseResults.push({
              phase: phase.name,
              transactions: phaseTransactions,
              successRate: phaseSuccessRate
            });

            this.addBenchmarkResult(`Spike Test ${phase.name}`, 'success rate %', phaseSuccessRate, '%', phase.name === 'spike' ? 80 : 95);

            // Different expectations for different phases
            if (phase.name === 'spike') {
              expect(phaseSuccessRate).toBeGreaterThan(70); // >70% during spike (degraded but functioning)
            } else {
              expect(phaseSuccessRate).toBeGreaterThan(95); // >95% during normal phases
            }
          }

          return { success: true, phaseResults };
        }
      }
    ];

    const results = await this.runBenchmarkSuite('Load Testing', benchmarks);
    return results;
  }

  /**
   * System Resource Benchmarks
   */
  private async runSystemResourceBenchmarks(): Promise<any> {
    console.log('[Performance Benchmark] Running System Resource Benchmarks...');

    const benchmarks = [
      {
        name: 'CPU Utilization Under Load',
        test: async () => {
          const initialCPU = process.cpuUsage();

          // CPU-intensive workload
          const cpuIntensiveTasks = [];
          for (let i = 0; i < 20; i++) {
            cpuIntensiveTasks.push(this.infrastructurePrincess.executeTask({
              id: `cpu-intensive-${i}`,
              type: 'cpu_intensive',
              complexity: 'high'
            }));
          }

          await Promise.all(cpuIntensiveTasks);

          const finalCPU = process.cpuUsage(initialCPU);
          const cpuTimeSeconds = (finalCPU.user + finalCPU.system) / 1000000;

          this.addBenchmarkResult('CPU Utilization', 'seconds', cpuTimeSeconds, 's', 30);

          expect(cpuTimeSeconds).toBeLessThan(60); // <60s CPU time for 20 tasks

          return { success: true, cpuTimeSeconds };
        }
      },
      {
        name: 'Memory Usage Efficiency',
        test: async () => {
          const initialMemory = process.memoryUsage();

          // Memory-intensive operations
          const memoryTasks = [];
          for (let i = 0; i < 100; i++) {
            memoryTasks.push(this.memoryCoordinator.allocate(1024 * 1024)); // 1MB each
          }

          await Promise.all(memoryTasks);

          const peakMemory = process.memoryUsage();
          const memoryIncrease = peakMemory.heapUsed - initialMemory.heapUsed;

          // Cleanup
          for (const block of memoryTasks) {
            await this.memoryCoordinator.deallocate(await block);
          }

          // Force garbage collection if available
          if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const finalMemory = process.memoryUsage();
          const memoryRetained = finalMemory.heapUsed - initialMemory.heapUsed;

          const cleanupEfficiency = ((memoryIncrease - memoryRetained) / memoryIncrease) * 100;

          this.addBenchmarkResult('Memory Cleanup Efficiency', 'percentage', cleanupEfficiency, '%', 90);

          expect(cleanupEfficiency).toBeGreaterThan(85); // >85% cleanup efficiency

          return { success: true, memoryIncrease, cleanupEfficiency };
        }
      }
    ];

    const results = await this.runBenchmarkSuite('System Resources', benchmarks);
    return results;
  }

  /**
   * End-to-End Performance Benchmarks
   */
  private async runEndToEndPerformanceBenchmarks(): Promise<any> {
    console.log('[Performance Benchmark] Running End-to-End Performance Benchmarks...');

    const benchmarks = [
      {
        name: 'Complete Workflow Performance',
        test: async () => {
          const workflowTasks = [
            { princess: 'Research', task: { type: 'analyze_requirements', complexity: 'high' } },
            { princess: 'Infrastructure', task: { type: 'design_architecture', complexity: 'high' } },
            { princess: 'Quality', task: { type: 'create_test_plan', complexity: 'medium' } },
            { princess: 'Documentation', task: { type: 'generate_specs', complexity: 'medium' } }
          ];

          const startTime = performance.now();

          // Execute workflow sequentially (realistic dependency scenario)
          for (const workflowTask of workflowTasks) {
            const princess = this.getPrincessByName(workflowTask.princess);
            await princess.executeTask({
              id: `workflow-${workflowTask.princess}`,
              ...workflowTask.task
            });
          }

          const endTime = performance.now();
          const workflowDuration = endTime - startTime;

          this.addBenchmarkResult('E2E Workflow Duration', 'ms', workflowDuration, 'ms', 10000);

          expect(workflowDuration).toBeLessThan(15000); // <15s for complete workflow

          return { success: true, workflowDuration, tasksCompleted: workflowTasks.length };
        }
      }
    ];

    const results = await this.runBenchmarkSuite('End-to-End Performance', benchmarks);
    return results;
  }

  /**
   * Helper Methods
   */
  private async runConcurrentMemoryOperations(operationCount: number, accessorId: number): Promise<any> {
    let successfulOperations = 0;

    for (let i = 0; i < operationCount; i++) {
      try {
        const block = await this.memoryCoordinator.allocate(1024);
        await this.memoryCoordinator.deallocate(block);
        successfulOperations++;
      } catch (error) {
        // Operation failed
      }
    }

    return { successfulOperations, accessorId };
  }

  private getPrincessByName(name: string): any {
    switch (name) {
      case 'Infrastructure': return this.infrastructurePrincess;
      case 'Research': return this.researchPrincess;
      case 'Quality': return this.qualityPrincess;
      case 'Documentation': return this.documentationPrincess;
      default: throw new Error(`Unknown princess: ${name}`);
    }
  }

  private addBenchmarkResult(testName: string, metric: string, value: number, unit: string, threshold: number, percentile95?: number, percentile99?: number): void {
    const result: BenchmarkResult = {
      testName,
      metric,
      value,
      unit,
      threshold,
      passed: value >= threshold || (metric.includes('ms') || metric.includes('time') ? value <= threshold : true),
      percentile95,
      percentile99
    };

    this.benchmarkResults.push(result);
  }

  /**
   * Run a benchmark suite and collect results
   */
  private async runBenchmarkSuite(suiteName: string, benchmarks: any[]): Promise<any> {
    const results = {
      suiteName,
      passed: 0,
      failed: 0,
      total: benchmarks.length,
      details: []
    };

    for (const benchmark of benchmarks) {
      try {
        console.log(`  Running: ${benchmark.name}`);
        const result = await benchmark.test();
        results.passed++;
        results.details.push({
          name: benchmark.name,
          status: 'passed',
          result
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          name: benchmark.name,
          status: 'failed',
          error: error.message
        });
        console.error(`  Failed: ${benchmark.name} - ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformanceScore(benchmarkSuites: any[]): number {
    let totalBenchmarks = 0;
    let passedBenchmarks = 0;

    for (const suite of benchmarkSuites) {
      totalBenchmarks += suite.total;
      passedBenchmarks += suite.passed;
    }

    return (passedBenchmarks / totalBenchmarks) * 100;
  }
}

// Export for use in test runner
export default PerformanceBenchmarkSuite;

// Jest test suite
describe('Performance Benchmark Suite', () => {
  let benchmarkSuite: PerformanceBenchmarkSuite;

  beforeAll(async () => {
    benchmarkSuite = new PerformanceBenchmarkSuite();
  });

  test('Comprehensive Performance Benchmarks', async () => {
    const result = await benchmarkSuite.runComprehensiveBenchmarks();

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.metrics.memoryAllocationSpeed).toBeGreaterThan(50000);
    expect(result.metrics.apiResponseTime).toBeLessThan(200);
  }, 600000); // 10 minute timeout for comprehensive benchmarks
});