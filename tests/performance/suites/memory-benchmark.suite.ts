/**
 * Memory Allocation Benchmark Suite
 *
 * Comprehensive memory performance testing including:
 * - Memory allocation patterns and speeds
 * - Garbage collection impact analysis
 * - Memory leak detection
 * - Buffer operations performance
 * - Heap fragmentation analysis
 * - Memory pressure testing
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as v8 from 'v8';
import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkSuite, BenchmarkTest, BenchmarkConfig, BenchmarkResult } from '../../../src/performance/types';

export interface MemoryAllocationPattern {
  name: string;
  description: string;
  allocationType: 'buffer' | 'array' | 'object' | 'string' | 'mixed';
  size: number;
  iterations: number;
  retainMemory: boolean;
}

export interface MemoryBenchmarkConfig extends BenchmarkConfig {
  allocationPatterns: MemoryAllocationPattern[];
  gcTestSizes: number[];
  heapSnapshotInterval: number;
  memoryPressureLevels: number[];
  maxMemoryUsage: number;
  leakDetectionThreshold: number;
}

export interface MemoryMetrics {
  operation: string;
  allocationType: string;
  size: number;
  duration: number;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  heapSnapshot?: any;
  gcTriggered: boolean;
  gcDuration: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface HeapAnalysis {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  fragmentationLevel: number;
  objectCount: number;
  gcImpact: {
    frequency: number;
    totalTime: number;
    averageTime: number;
  };
}

export class MemoryBenchmarkSuite extends EventEmitter implements BenchmarkSuite {
  public readonly name = 'Memory Allocation Benchmark';
  public readonly description = 'Comprehensive memory performance testing';
  public readonly version = '1.0.0';

  private config: MemoryBenchmarkConfig;
  private metrics: MemoryMetrics[] = [];
  private heapSnapshots: any[] = [];
  private allocatedMemory: Map<string, any> = new Map();
  private gcObserver: any;
  private gcEvents: any[] = [];

  constructor(config: MemoryBenchmarkConfig) {
    super();
    this.config = config;
    this.setupGCObserver();
  }

  public getTests(): BenchmarkTest[] {
    return [
      {
        name: 'Memory Allocation Patterns',
        description: 'Test different memory allocation patterns and speeds',
        category: 'allocation',
        setup: () => this.setupAllocationTest(),
        execute: () => this.executeAllocationTest(),
        teardown: () => this.teardownTest(),
        timeout: 180000
      },
      {
        name: 'Garbage Collection Impact',
        description: 'Analyze GC performance under different memory loads',
        category: 'gc',
        setup: () => this.setupGCTest(),
        execute: () => this.executeGCTest(),
        teardown: () => this.teardownTest(),
        timeout: 240000
      },
      {
        name: 'Memory Leak Detection',
        description: 'Test memory leak detection and growth patterns',
        category: 'leaks',
        setup: () => this.setupLeakTest(),
        execute: () => this.executeLeakTest(),
        teardown: () => this.teardownTest(),
        timeout: 300000
      },
      {
        name: 'Buffer Operations Performance',
        description: 'Test Buffer allocation, copy, and manipulation performance',
        category: 'buffers',
        setup: () => this.setupBufferTest(),
        execute: () => this.executeBufferTest(),
        teardown: () => this.teardownTest(),
        timeout: 120000
      },
      {
        name: 'Heap Fragmentation Analysis',
        description: 'Analyze heap fragmentation under various allocation patterns',
        category: 'fragmentation',
        setup: () => this.setupFragmentationTest(),
        execute: () => this.executeFragmentationTest(),
        teardown: () => this.teardownTest(),
        timeout: 240000
      },
      {
        name: 'Memory Pressure Testing',
        description: 'Test system behavior under extreme memory pressure',
        category: 'pressure',
        setup: () => this.setupPressureTest(),
        execute: () => this.executePressureTest(),
        teardown: () => this.teardownTest(),
        timeout: 300000
      }
    ];
  }

  private setupGCObserver(): void {
    try {
      this.gcObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'gc') {
            this.gcEvents.push({
              kind: entry.detail?.kind || 'unknown',
              duration: entry.duration,
              timestamp: entry.startTime
            });
          }
        }
      });

      this.gcObserver.observe({ entryTypes: ['gc'] });
    } catch (error) {
      // GC observer not available, continue without it
    }
  }

  private async setupAllocationTest(): Promise<void> {
    this.metrics = [];
    this.allocatedMemory.clear();
    this.gcEvents = [];
    await this.forceGC();
    this.emit('setup', { test: 'Memory Allocation Patterns' });
  }

  private async executeAllocationTest(): Promise<BenchmarkResult> {
    const results: MemoryMetrics[] = [];

    for (const pattern of this.config.allocationPatterns) {
      this.emit('progress', {
        test: 'Memory Allocation Patterns',
        message: `Testing ${pattern.name} allocation pattern`
      });

      const patternResults = await this.testAllocationPattern(pattern);
      results.push(...patternResults);

      // Clean up between patterns
      if (!pattern.retainMemory) {
        await this.cleanupAllocatedMemory();
      }

      await this.sleep(1000);
    }

    return this.analyzeResults(results, 'Memory Allocation Patterns');
  }

  private async testAllocationPattern(pattern: MemoryAllocationPattern): Promise<MemoryMetrics[]> {
    const results: MemoryMetrics[] = [];

    for (let i = 0; i < pattern.iterations; i++) {
      const metric = await this.performSingleAllocation(pattern, i);
      results.push(metric);

      // Store memory reference if pattern requires retention
      if (pattern.retainMemory) {
        this.allocatedMemory.set(`${pattern.name}_${i}`, metric);
      }

      // Progress reporting
      if (i % 100 === 0) {
        this.emit('progress', {
          test: 'Memory Allocation Patterns',
          pattern: pattern.name,
          completed: i,
          total: pattern.iterations
        });
      }
    }

    return results;
  }

  private async performSingleAllocation(pattern: MemoryAllocationPattern, iteration: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents.length;
    const startTime = performance.now();

    let allocated: any;
    let success = true;
    let error: string | undefined;

    try {
      switch (pattern.allocationType) {
        case 'buffer':
          allocated = await this.allocateBuffer(pattern.size);
          break;
        case 'array':
          allocated = await this.allocateArray(pattern.size);
          break;
        case 'object':
          allocated = await this.allocateObject(pattern.size);
          break;
        case 'string':
          allocated = await this.allocateString(pattern.size);
          break;
        case 'mixed':
          allocated = await this.allocateMixed(pattern.size);
          break;
        default:
          throw new Error(`Unknown allocation type: ${pattern.allocationType}`);
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const gcEventsAfter = this.gcEvents.length;

    const gcTriggered = gcEventsAfter > gcEventsBefore;
    const gcDuration = gcTriggered ?
      this.gcEvents.slice(gcEventsBefore).reduce((sum, event) => sum + event.duration, 0) : 0;

    return {
      operation: 'allocate',
      allocationType: pattern.allocationType,
      size: pattern.size,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered,
      gcDuration,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private async allocateBuffer(size: number): Promise<Buffer> {
    // Test different buffer allocation methods
    const method = Math.floor(Math.random() * 3);

    switch (method) {
      case 0:
        return Buffer.alloc(size);
      case 1:
        return Buffer.allocUnsafe(size);
      case 2:
        return Buffer.from('x'.repeat(size));
      default:
        return Buffer.alloc(size);
    }
  }

  private async allocateArray(size: number): Promise<any[]> {
    const array = new Array(size);

    // Fill with different types of data
    for (let i = 0; i < size; i++) {
      switch (i % 4) {
        case 0:
          array[i] = i;
          break;
        case 1:
          array[i] = `item_${i}`;
          break;
        case 2:
          array[i] = { id: i, value: Math.random() };
          break;
        case 3:
          array[i] = new Date();
          break;
      }
    }

    return array;
  }

  private async allocateObject(size: number): Promise<object> {
    const obj: any = {};

    for (let i = 0; i < size; i++) {
      obj[`key_${i}`] = {
        id: i,
        data: 'x'.repeat(Math.floor(Math.random() * 100) + 50),
        timestamp: Date.now(),
        nested: {
          value: Math.random(),
          flag: i % 2 === 0
        }
      };
    }

    return obj;
  }

  private async allocateString(size: number): Promise<string> {
    // Create large strings using different methods
    const method = Math.floor(Math.random() * 3);

    switch (method) {
      case 0:
        return 'x'.repeat(size);
      case 1:
        return Array(size).fill('y').join('');
      case 2:
        let result = '';
        for (let i = 0; i < size; i++) {
          result += String.fromCharCode(65 + (i % 26));
        }
        return result;
      default:
        return 'x'.repeat(size);
    }
  }

  private async allocateMixed(size: number): Promise<any> {
    const mixed = {
      buffer: Buffer.alloc(Math.floor(size * 0.3)),
      array: new Array(Math.floor(size * 0.2)),
      string: 'x'.repeat(Math.floor(size * 0.2)),
      objects: []
    };

    // Fill array with mixed data
    for (let i = 0; i < mixed.array.length; i++) {
      mixed.array[i] = Math.random();
    }

    // Create nested objects
    const objectCount = Math.floor(size * 0.3);
    for (let i = 0; i < objectCount; i++) {
      (mixed.objects as any[]).push({
        id: i,
        data: Buffer.alloc(100),
        text: `object_${i}`
      });
    }

    return mixed;
  }

  private async setupGCTest(): Promise<void> {
    this.metrics = [];
    this.gcEvents = [];
    await this.forceGC();
    this.emit('setup', { test: 'Garbage Collection Impact' });
  }

  private async executeGCTest(): Promise<BenchmarkResult> {
    const results: MemoryMetrics[] = [];

    for (const testSize of this.config.gcTestSizes) {
      this.emit('progress', {
        test: 'Garbage Collection Impact',
        message: `Testing GC with ${testSize} MB allocation`
      });

      const gcResults = await this.testGCImpact(testSize);
      results.push(...gcResults);

      // Force cleanup between tests
      await this.forceGC();
      await this.sleep(1000);
    }

    return this.analyzeResults(results, 'Garbage Collection Impact');
  }

  private async testGCImpact(sizeMB: number): Promise<MemoryMetrics[]> {
    const results: MemoryMetrics[] = [];
    const sizeBytes = sizeMB * 1024 * 1024;

    // Allocate memory to trigger GC
    const allocations: any[] = [];
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = Math.floor(sizeBytes / chunkSize);

    for (let i = 0; i < chunks; i++) {
      const metric = await this.allocateChunkAndMeasure(chunkSize, i);
      results.push(metric);

      if (metric.success) {
        allocations.push(Buffer.alloc(chunkSize));
      }

      // Check for GC events
      if (metric.gcTriggered) {
        this.emit('progress', {
          test: 'Garbage Collection Impact',
          message: `GC triggered after ${i + 1} chunks (${metric.gcDuration.toFixed(2)}ms)`
        });
      }
    }

    // Force GC and measure
    const gcMetric = await this.measureForcedGC();
    results.push(gcMetric);

    return results;
  }

  private async allocateChunkAndMeasure(chunkSize: number, chunkIndex: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents.length;
    const startTime = performance.now();

    let success = true;
    let error: string | undefined;

    try {
      // Allocate chunk
      const chunk = Buffer.alloc(chunkSize);
      chunk.fill(chunkIndex % 256);
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const gcEventsAfter = this.gcEvents.length;

    const gcTriggered = gcEventsAfter > gcEventsBefore;
    const gcDuration = gcTriggered ?
      this.gcEvents.slice(gcEventsBefore).reduce((sum, event) => sum + event.duration, 0) : 0;

    return {
      operation: 'gc_chunk_allocation',
      allocationType: 'buffer',
      size: chunkSize,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered,
      gcDuration,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private async measureForcedGC(): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents.length;
    const startTime = performance.now();

    await this.forceGC();

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const gcEventsAfter = this.gcEvents.length;

    const gcTriggered = gcEventsAfter > gcEventsBefore;
    const gcDuration = gcTriggered ?
      this.gcEvents.slice(gcEventsBefore).reduce((sum, event) => sum + event.duration, 0) : 0;

    return {
      operation: 'forced_gc',
      allocationType: 'gc',
      size: 0,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered,
      gcDuration,
      success: true,
      timestamp: Date.now()
    };
  }

  private async setupLeakTest(): Promise<void> {
    this.metrics = [];
    this.allocatedMemory.clear();
    await this.forceGC();
    this.emit('setup', { test: 'Memory Leak Detection' });
  }

  private async executeLeakTest(): Promise<BenchmarkResult> {
    const results: MemoryMetrics[] = [];

    // Test different leak scenarios
    const leakScenarios = [
      'closure_leaks',
      'event_listener_leaks',
      'circular_references',
      'detached_dom_nodes',
      'large_object_retention'
    ];

    for (const scenario of leakScenarios) {
      this.emit('progress', {
        test: 'Memory Leak Detection',
        message: `Testing ${scenario} scenario`
      });

      const scenarioResults = await this.testLeakScenario(scenario);
      results.push(...scenarioResults);

      await this.sleep(1000);
    }

    return this.analyzeResults(results, 'Memory Leak Detection');
  }

  private async testLeakScenario(scenario: string): Promise<MemoryMetrics[]> {
    const results: MemoryMetrics[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      let metric: MemoryMetrics;

      switch (scenario) {
        case 'closure_leaks':
          metric = await this.simulateClosureLeak(i);
          break;
        case 'event_listener_leaks':
          metric = await this.simulateEventListenerLeak(i);
          break;
        case 'circular_references':
          metric = await this.simulateCircularReference(i);
          break;
        case 'detached_dom_nodes':
          metric = await this.simulateDetachedNodes(i);
          break;
        case 'large_object_retention':
          metric = await this.simulateLargeObjectRetention(i);
          break;
        default:
          continue;
      }

      results.push(metric);

      // Check for memory growth
      if (i > 0 && i % 20 === 0) {
        const memoryGrowth = this.calculateMemoryGrowth(results.slice(-20));
        if (memoryGrowth > this.config.leakDetectionThreshold) {
          this.emit('progress', {
            test: 'Memory Leak Detection',
            scenario,
            message: `Potential leak detected: ${memoryGrowth.toFixed(2)} MB growth`
          });
        }
      }
    }

    return results;
  }

  private async simulateClosureLeak(iteration: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    // Create closure that retains large data
    const createLeakyFunction = () => {
      const largeData = Buffer.alloc(1024 * 1024); // 1MB
      largeData.fill(iteration % 256);

      return () => {
        // Function that keeps reference to largeData
        return largeData.length;
      };
    };

    // Store reference to prevent GC
    this.allocatedMemory.set(`closure_${iteration}`, createLeakyFunction());

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'closure_leak',
      allocationType: 'closure',
      size: 1024 * 1024,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success: true,
      timestamp: Date.now()
    };
  }

  private async simulateEventListenerLeak(iteration: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    // Create event emitter with leaky listeners
    const emitter = new EventEmitter();
    const largeData = Buffer.alloc(512 * 1024); // 512KB

    const leakyListener = () => {
      // Reference to large data in closure
      return largeData.length;
    };

    emitter.on('test', leakyListener);
    emitter.on('data', leakyListener);
    emitter.on('error', leakyListener);

    // Store reference without removing listeners
    this.allocatedMemory.set(`emitter_${iteration}`, emitter);

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'event_listener_leak',
      allocationType: 'event_emitter',
      size: 512 * 1024,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success: true,
      timestamp: Date.now()
    };
  }

  private async simulateCircularReference(iteration: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    // Create circular reference
    const obj1: any = {
      id: iteration,
      data: Buffer.alloc(256 * 1024) // 256KB
    };

    const obj2: any = {
      id: iteration + 1000,
      data: Buffer.alloc(256 * 1024) // 256KB
    };

    // Create circular references
    obj1.ref = obj2;
    obj2.ref = obj1;
    obj1.self = obj1;
    obj2.self = obj2;

    // Store reference
    this.allocatedMemory.set(`circular_${iteration}`, obj1);

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'circular_reference',
      allocationType: 'object',
      size: 512 * 1024,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success: true,
      timestamp: Date.now()
    };
  }

  private async simulateDetachedNodes(iteration: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    // Simulate detached DOM-like nodes
    const createNode = (id: string) => ({
      id,
      type: 'div',
      children: [],
      parent: null,
      data: Buffer.alloc(128 * 1024), // 128KB per node
      listeners: new Map()
    });

    const parent = createNode(`parent_${iteration}`);

    // Create child nodes
    for (let i = 0; i < 10; i++) {
      const child = createNode(`child_${iteration}_${i}`);
      child.parent = parent;
      parent.children.push(child);
    }

    // Detach parent but keep reference
    parent.parent = null;
    this.allocatedMemory.set(`detached_${iteration}`, parent);

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'detached_nodes',
      allocationType: 'dom_like',
      size: 11 * 128 * 1024, // Parent + 10 children
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success: true,
      timestamp: Date.now()
    };
  }

  private async simulateLargeObjectRetention(iteration: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    // Create large object that should be GC'd but is retained
    const largeObject = {
      id: iteration,
      metadata: {
        created: Date.now(),
        type: 'large_retention_test'
      },
      payload: {
        data: Buffer.alloc(2 * 1024 * 1024), // 2MB
        strings: Array(1000).fill(0).map((_, i) => `large_string_${iteration}_${i}`),
        numbers: new Float64Array(100000) // ~800KB
      }
    };

    // Fill the arrays with data
    largeObject.payload.data.fill(iteration % 256);
    largeObject.payload.numbers.fill(Math.random());

    // Retain reference
    this.allocatedMemory.set(`large_object_${iteration}`, largeObject);

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'large_object_retention',
      allocationType: 'large_object',
      size: 2 * 1024 * 1024 + 800 * 1024, // Approximate total size
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success: true,
      timestamp: Date.now()
    };
  }

  private calculateMemoryGrowth(recentMetrics: MemoryMetrics[]): number {
    if (recentMetrics.length < 2) return 0;

    const firstMetric = recentMetrics[0];
    const lastMetric = recentMetrics[recentMetrics.length - 1];

    const growthBytes = lastMetric.memoryAfter.heapUsed - firstMetric.memoryBefore.heapUsed;
    return growthBytes / (1024 * 1024); // Convert to MB
  }

  private async setupBufferTest(): Promise<void> {
    this.metrics = [];
    await this.forceGC();
    this.emit('setup', { test: 'Buffer Operations Performance' });
  }

  private async executeBufferTest(): Promise<BenchmarkResult> {
    const results: MemoryMetrics[] = [];
    const bufferSizes = [1024, 64 * 1024, 1024 * 1024, 16 * 1024 * 1024]; // 1KB to 16MB

    for (const size of bufferSizes) {
      this.emit('progress', {
        test: 'Buffer Operations Performance',
        message: `Testing buffer operations with ${this.formatBytes(size)}`
      });

      // Test different buffer operations
      const allocationResult = await this.testBufferAllocation(size);
      results.push(allocationResult);

      const copyResult = await this.testBufferCopy(size);
      results.push(copyResult);

      const fillResult = await this.testBufferFill(size);
      results.push(fillResult);

      const sliceResult = await this.testBufferSlice(size);
      results.push(sliceResult);

      await this.sleep(100);
    }

    return this.analyzeResults(results, 'Buffer Operations Performance');
  }

  private async testBufferAllocation(size: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents.length;
    const startTime = performance.now();

    let success = true;
    let error: string | undefined;

    try {
      // Test allocation speed
      const buffer = Buffer.allocUnsafe(size);

      // Touch the memory to ensure allocation
      buffer[0] = 1;
      buffer[size - 1] = 1;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const gcEventsAfter = this.gcEvents.length;

    const gcTriggered = gcEventsAfter > gcEventsBefore;
    const gcDuration = gcTriggered ?
      this.gcEvents.slice(gcEventsBefore).reduce((sum, event) => sum + event.duration, 0) : 0;

    return {
      operation: 'buffer_allocation',
      allocationType: 'buffer',
      size,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered,
      gcDuration,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private async testBufferCopy(size: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    let success = true;
    let error: string | undefined;

    try {
      const source = Buffer.alloc(size);
      source.fill(0xFF);

      const destination = Buffer.alloc(size);

      // Test copy performance
      source.copy(destination);
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'buffer_copy',
      allocationType: 'buffer',
      size,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private async testBufferFill(size: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    let success = true;
    let error: string | undefined;

    try {
      const buffer = Buffer.alloc(size);

      // Test fill performance
      buffer.fill(0xAA);
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'buffer_fill',
      allocationType: 'buffer',
      size,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private async testBufferSlice(size: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    let success = true;
    let error: string | undefined;

    try {
      const buffer = Buffer.alloc(size);
      buffer.fill(0x55);

      // Test slice performance (multiple slices)
      const slices = [];
      const sliceSize = Math.max(1024, Math.floor(size / 10));

      for (let i = 0; i < size; i += sliceSize) {
        const end = Math.min(i + sliceSize, size);
        slices.push(buffer.slice(i, end));
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'buffer_slice',
      allocationType: 'buffer',
      size,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private async setupFragmentationTest(): Promise<void> {
    this.metrics = [];
    await this.forceGC();
    this.emit('setup', { test: 'Heap Fragmentation Analysis' });
  }

  private async executeFragmentationTest(): Promise<BenchmarkResult> {
    const results: MemoryMetrics[] = [];

    // Test fragmentation with different allocation patterns
    const fragmentationPatterns = [
      'alternating_sizes',
      'increasing_sizes',
      'random_sizes',
      'power_of_two_sizes'
    ];

    for (const pattern of fragmentationPatterns) {
      this.emit('progress', {
        test: 'Heap Fragmentation Analysis',
        message: `Testing ${pattern} fragmentation pattern`
      });

      const patternResults = await this.testFragmentationPattern(pattern);
      results.push(...patternResults);

      // Take heap snapshot for analysis
      await this.takeHeapSnapshot(pattern);

      // Clean up between patterns
      await this.cleanupAllocatedMemory();
      await this.forceGC();
      await this.sleep(1000);
    }

    return this.analyzeResults(results, 'Heap Fragmentation Analysis');
  }

  private async testFragmentationPattern(pattern: string): Promise<MemoryMetrics[]> {
    const results: MemoryMetrics[] = [];
    const iterations = 200;

    for (let i = 0; i < iterations; i++) {
      let size: number;

      switch (pattern) {
        case 'alternating_sizes':
          size = i % 2 === 0 ? 1024 : 64 * 1024; // 1KB or 64KB
          break;
        case 'increasing_sizes':
          size = 1024 * (i + 1); // 1KB, 2KB, 3KB, ...
          break;
        case 'random_sizes':
          size = Math.floor(Math.random() * 1024 * 1024) + 1024; // 1KB to 1MB
          break;
        case 'power_of_two_sizes':
          const power = (i % 10) + 10; // 2^10 to 2^19 (1KB to 512KB)
          size = Math.pow(2, power);
          break;
        default:
          size = 1024;
      }

      const metric = await this.allocateForFragmentation(size, pattern, i);
      results.push(metric);

      // Randomly deallocate some allocations to create fragmentation
      if (i > 10 && Math.random() < 0.3) {
        this.deallocateRandom();
      }
    }

    return results;
  }

  private async allocateForFragmentation(size: number, pattern: string, iteration: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents.length;
    const startTime = performance.now();

    let success = true;
    let error: string | undefined;

    try {
      const allocation = {
        buffer: Buffer.alloc(size),
        metadata: {
          pattern,
          iteration,
          allocated: Date.now()
        }
      };

      // Fill with pattern data
      allocation.buffer.fill(iteration % 256);

      // Store for potential deallocation
      this.allocatedMemory.set(`${pattern}_${iteration}`, allocation);
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const gcEventsAfter = this.gcEvents.length;

    const gcTriggered = gcEventsAfter > gcEventsBefore;
    const gcDuration = gcTriggered ?
      this.gcEvents.slice(gcEventsBefore).reduce((sum, event) => sum + event.duration, 0) : 0;

    return {
      operation: 'fragmentation_allocation',
      allocationType: pattern,
      size,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered,
      gcDuration,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private deallocateRandom(): void {
    const keys = Array.from(this.allocatedMemory.keys());
    if (keys.length > 0) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      this.allocatedMemory.delete(randomKey);
    }
  }

  private async takeHeapSnapshot(identifier: string): Promise<void> {
    try {
      const snapshot = v8.writeHeapSnapshot();
      this.heapSnapshots.push({
        identifier,
        filename: snapshot,
        timestamp: Date.now(),
        memoryUsage: process.memoryUsage()
      });
    } catch (error) {
      // Heap snapshot not available
    }
  }

  private async setupPressureTest(): Promise<void> {
    this.metrics = [];
    this.allocatedMemory.clear();
    await this.forceGC();
    this.emit('setup', { test: 'Memory Pressure Testing' });
  }

  private async executePressureTest(): Promise<BenchmarkResult> {
    const results: MemoryMetrics[] = [];

    for (const pressureLevel of this.config.memoryPressureLevels) {
      this.emit('progress', {
        test: 'Memory Pressure Testing',
        message: `Testing at ${pressureLevel}% memory pressure`
      });

      const pressureResults = await this.testMemoryPressure(pressureLevel);
      results.push(...pressureResults);

      // Recovery between pressure levels
      await this.cleanupAllocatedMemory();
      await this.forceGC();
      await this.sleep(2000);
    }

    return this.analyzeResults(results, 'Memory Pressure Testing');
  }

  private async testMemoryPressure(pressureLevel: number): Promise<MemoryMetrics[]> {
    const results: MemoryMetrics[] = [];
    const targetMemory = (this.config.maxMemoryUsage * pressureLevel) / 100;
    const currentMemory = process.memoryUsage().heapUsed;
    const memoryToAllocate = Math.max(0, targetMemory - currentMemory);

    this.emit('progress', {
      test: 'Memory Pressure Testing',
      message: `Allocating ${this.formatBytes(memoryToAllocate)} to reach ${pressureLevel}% pressure`
    });

    // Allocate memory gradually to reach target pressure
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = Math.floor(memoryToAllocate / chunkSize);

    for (let i = 0; i < chunks; i++) {
      const metric = await this.allocatePressureChunk(chunkSize, i, pressureLevel);
      results.push(metric);

      // Monitor system behavior under pressure
      if (i % 10 === 0) {
        const systemMetric = await this.measureSystemUnderPressure(pressureLevel);
        results.push(systemMetric);
      }
    }

    // Test operations under pressure
    const operationsUnderPressure = await this.testOperationsUnderPressure(pressureLevel);
    results.push(...operationsUnderPressure);

    return results;
  }

  private async allocatePressureChunk(chunkSize: number, chunkIndex: number, pressureLevel: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents.length;
    const startTime = performance.now();

    let success = true;
    let error: string | undefined;

    try {
      const chunk = Buffer.alloc(chunkSize);
      chunk.fill(chunkIndex % 256);

      // Store reference to maintain pressure
      this.allocatedMemory.set(`pressure_${pressureLevel}_${chunkIndex}`, chunk);
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const gcEventsAfter = this.gcEvents.length;

    const gcTriggered = gcEventsAfter > gcEventsBefore;
    const gcDuration = gcTriggered ?
      this.gcEvents.slice(gcEventsBefore).reduce((sum, event) => sum + event.duration, 0) : 0;

    return {
      operation: 'pressure_allocation',
      allocationType: 'pressure_chunk',
      size: chunkSize,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered,
      gcDuration,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private async measureSystemUnderPressure(pressureLevel: number): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    // Perform system measurement operations
    const measurements = {
      heapStats: v8.getHeapStatistics(),
      heapSpaceStats: v8.getHeapSpaceStatistics(),
      cpuUsage: process.cpuUsage()
    };

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      operation: 'system_measurement',
      allocationType: 'measurement',
      size: 0,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered: false,
      gcDuration: 0,
      success: true,
      timestamp: Date.now()
    };
  }

  private async testOperationsUnderPressure(pressureLevel: number): Promise<MemoryMetrics[]> {
    const results: MemoryMetrics[] = [];

    // Test basic operations under memory pressure
    const operations = [
      { name: 'array_creation', operation: () => new Array(1000).fill(Math.random()) },
      { name: 'object_creation', operation: () => ({ data: 'x'.repeat(1000), timestamp: Date.now() }) },
      { name: 'string_concatenation', operation: () => 'test'.repeat(1000) },
      { name: 'buffer_allocation', operation: () => Buffer.alloc(10240) }
    ];

    for (const op of operations) {
      const metric = await this.executeOperationUnderPressure(op.name, op.operation, pressureLevel);
      results.push(metric);
    }

    return results;
  }

  private async executeOperationUnderPressure(
    operationName: string,
    operation: () => any,
    pressureLevel: number
  ): Promise<MemoryMetrics> {
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents.length;
    const startTime = performance.now();

    let success = true;
    let error: string | undefined;

    try {
      operation();
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const gcEventsAfter = this.gcEvents.length;

    const gcTriggered = gcEventsAfter > gcEventsBefore;
    const gcDuration = gcTriggered ?
      this.gcEvents.slice(gcEventsBefore).reduce((sum, event) => sum + event.duration, 0) : 0;

    return {
      operation: `pressure_operation_${operationName}`,
      allocationType: 'operation_under_pressure',
      size: 0,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      gcTriggered,
      gcDuration,
      success,
      error,
      timestamp: Date.now()
    };
  }

  private async forceGC(): Promise<void> {
    if (global.gc) {
      global.gc();
      await this.sleep(100); // Allow GC to complete
    }
  }

  private async cleanupAllocatedMemory(): Promise<void> {
    this.allocatedMemory.clear();
    await this.forceGC();
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  private analyzeResults(metrics: MemoryMetrics[], testName: string): BenchmarkResult {
    const successfulOperations = metrics.filter(m => m.success);
    const failedOperations = metrics.filter(m => !m.success);

    const durations = successfulOperations.map(m => m.duration);
    const memoryDeltas = successfulOperations.map(m =>
      m.memoryAfter.heapUsed - m.memoryBefore.heapUsed
    );

    const gcEvents = successfulOperations.filter(m => m.gcTriggered);
    const gcDurations = gcEvents.map(m => m.gcDuration);

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length || 0;
    const avgMemoryDelta = memoryDeltas.reduce((sum, d) => sum + d, 0) / memoryDeltas.length || 0;
    const avgGCDuration = gcDurations.reduce((sum, d) => sum + d, 0) / gcDurations.length || 0;

    const sortedDurations = durations.sort((a, b) => a - b);
    const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)] || 0;
    const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0;
    const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 0;

    // Memory allocation rate
    const totalMemoryAllocated = successfulOperations.reduce((sum, m) => sum + m.size, 0);
    const totalTime = successfulOperations.reduce((sum, m) => sum + m.duration, 0);
    const allocationRate = totalTime > 0 ? (totalMemoryAllocated / 1024 / 1024) / (totalTime / 1000) : 0; // MB/s

    return {
      testName,
      timestamp: Date.now(),
      duration: totalTime,
      iterations: metrics.length,
      metrics: {
        allocationRate: {
          value: allocationRate,
          unit: 'MB/second'
        },
        allocationTime: {
          avg: avgDuration,
          min: Math.min(...durations) || 0,
          max: Math.max(...durations) || 0,
          p50,
          p95,
          p99,
          unit: 'milliseconds'
        },
        memoryDelta: {
          avg: avgMemoryDelta / 1024 / 1024, // Convert to MB
          unit: 'MB'
        },
        gcImpact: {
          frequency: (gcEvents.length / successfulOperations.length) * 100,
          avgDuration: avgGCDuration,
          totalTime: gcDurations.reduce((sum, d) => sum + d, 0),
          unit: 'milliseconds'
        },
        errorRate: {
          value: (failedOperations.length / metrics.length) * 100,
          unit: 'percentage'
        }
      },
      details: {
        totalOperations: metrics.length,
        successfulOperations: successfulOperations.length,
        failedOperations: failedOperations.length,
        totalMemoryAllocated: this.formatBytes(totalMemoryAllocated),
        gcEvents: gcEvents.length,
        heapSnapshots: this.heapSnapshots.length,
        memoryLeakIndicators: this.detectMemoryLeaks(metrics),
        fragmentationAnalysis: this.analyzeFragmentation(metrics)
      },
      passed: failedOperations.length === 0 && avgDuration < 1000 && allocationRate > 1
    };
  }

  private detectMemoryLeaks(metrics: MemoryMetrics[]): any {
    const memoryGrowthSamples = [];
    const sampleSize = 20;

    for (let i = sampleSize; i < metrics.length; i += sampleSize) {
      const recentMetrics = metrics.slice(i - sampleSize, i);
      const growth = this.calculateMemoryGrowth(recentMetrics);
      memoryGrowthSamples.push(growth);
    }

    const avgGrowth = memoryGrowthSamples.reduce((sum, g) => sum + g, 0) / memoryGrowthSamples.length || 0;
    const leakSuspected = avgGrowth > this.config.leakDetectionThreshold;

    return {
      averageGrowthMB: avgGrowth,
      leakSuspected,
      threshold: this.config.leakDetectionThreshold,
      samples: memoryGrowthSamples.length
    };
  }

  private analyzeFragmentation(metrics: MemoryMetrics[]): any {
    const fragmentationMetrics = metrics.filter(m => m.operation === 'fragmentation_allocation');

    if (fragmentationMetrics.length === 0) {
      return { analyzed: false };
    }

    const allocationSizes = fragmentationMetrics.map(m => m.size);
    const uniqueSizes = [...new Set(allocationSizes)];
    const sizeVariability = uniqueSizes.length / allocationSizes.length;

    return {
      analyzed: true,
      allocations: fragmentationMetrics.length,
      uniqueSizes: uniqueSizes.length,
      sizeVariability,
      estimatedFragmentation: sizeVariability > 0.5 ? 'high' : sizeVariability > 0.2 ? 'medium' : 'low'
    };
  }

  private async teardownTest(): Promise<void> {
    await this.cleanupAllocatedMemory();
    this.heapSnapshots = [];
    this.gcEvents = [];

    // Disconnect GC observer
    if (this.gcObserver) {
      this.gcObserver.disconnect();
    }

    this.emit('teardown');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example usage and configuration
export const defaultMemoryBenchmarkConfig: MemoryBenchmarkConfig = {
  allocationPatterns: [
    {
      name: 'small_buffers',
      description: 'Small buffer allocations (1KB)',
      allocationType: 'buffer',
      size: 1024,
      iterations: 1000,
      retainMemory: false
    },
    {
      name: 'large_buffers',
      description: 'Large buffer allocations (1MB)',
      allocationType: 'buffer',
      size: 1024 * 1024,
      iterations: 100,
      retainMemory: false
    },
    {
      name: 'object_arrays',
      description: 'Object array allocations',
      allocationType: 'array',
      size: 1000,
      iterations: 500,
      retainMemory: false
    },
    {
      name: 'retained_objects',
      description: 'Retained object allocations',
      allocationType: 'object',
      size: 100,
      iterations: 200,
      retainMemory: true
    }
  ],
  gcTestSizes: [10, 50, 100, 200], // MB
  heapSnapshotInterval: 60000, // 1 minute
  memoryPressureLevels: [50, 70, 85, 95], // Percentage
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
  leakDetectionThreshold: 5, // 5MB growth threshold
  iterations: 100
};

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T08:04:45-04:00 | claude@sonnet-4 | Created comprehensive memory allocation benchmark suite with allocation pattern testing, garbage collection impact analysis, memory leak detection, buffer operations performance, heap fragmentation analysis, and memory pressure testing | memory-benchmark.suite.ts | OK | -- | 0.00 | 4b9c8e7 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: memory-benchmark-creation-001
- inputs: ["Memory benchmark requirements", "Node.js memory APIs", "GC monitoring patterns"]
- tools_used: ["Write", "performance", "v8", "memory management", "GC observation"]
- versions: {"model":"claude-sonnet-4","prompt":"memory-benchmark-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->