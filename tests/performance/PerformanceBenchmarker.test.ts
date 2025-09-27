import { PerformanceBenchmarker, quickBenchmark } from '../../src/performance/benchmarking/PerformanceBenchmarker';
import { performance } from 'perf_hooks';

describe('PerformanceBenchmarker', () => {
  let benchmarker: PerformanceBenchmarker;

  beforeEach(() => {
    benchmarker = new PerformanceBenchmarker();
  });

  afterEach(() => {
    benchmarker.clearResults();
  });

  describe('Basic Benchmarking', () => {
    test('should benchmark a simple function', async () => {
      const testFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = await benchmarker.benchmark('Simple Loop', testFunction, {
        iterations: 100,
        warmupIterations: 10
      });

      expect(result.name).toBe('Simple Loop');
      expect(result.iterations).toBe(100);
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      expect(result.avgTime).toBeGreaterThan(0);
      expect(result.minTime).toBeGreaterThanOrEqual(0);
      expect(result.maxTime).toBeGreaterThanOrEqual(result.minTime);
      expect(result.percentiles.p50).toBeGreaterThan(0);
      expect(result.percentiles.p95).toBeGreaterThan(0);
      expect(result.percentiles.p99).toBeGreaterThan(0);
    });

    test('should benchmark an async function', async () => {
      const asyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return Math.random();
      };

      const result = await benchmarker.benchmark('Async Function', asyncFunction, {
        iterations: 50,
        warmupIterations: 5
      });

      expect(result.name).toBe('Async Function');
      expect(result.iterations).toBe(50);
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      expect(result.avgTime).toBeGreaterThan(1); // Should be at least 1ms due to setTimeout
    });

    test('should handle function that throws errors', async () => {
      const errorFunction = () => {
        if (Math.random() < 0.1) { // 10% chance of error
          throw new Error('Random error');
        }
        return 42;
      };

      // Should not throw, but may have some failures tracked
      await expect(benchmarker.benchmark('Error Function', errorFunction, {
        iterations: 100,
        warmupIterations: 5
      })).resolves.toBeDefined();
    });
  });

  describe('Benchmark Suite', () => {
    test('should run multiple benchmarks in a suite', async () => {
      const suite = {
        'CPU Test': () => {
          let result = 0;
          for (let i = 0; i < 10000; i++) {
            result += Math.sqrt(i);
          }
          return result;
        },
        'Memory Test': () => {
          const array = new Array(1000).fill(0);
          return array.map(x => Math.random());
        },
        'String Test': () => {
          let str = '';
          for (let i = 0; i < 100; i++) {
            str += `test${i}`;
          }
          return str.length;
        }
      };

      const results = await benchmarker.runBenchmarkSuite(suite, {
        iterations: 50,
        warmupIterations: 5
      });

      expect(results).toHaveLength(3);
      expect(results.map(r => r.name)).toEqual(['CPU Test', 'Memory Test', 'String Test']);

      results.forEach(result => {
        expect(result.operationsPerSecond).toBeGreaterThan(0);
        expect(result.iterations).toBe(50);
      });
    });
  });

  describe('Configuration Options', () => {
    test('should respect custom configuration', async () => {
      const testFunction = () => Math.random();

      const result = await benchmarker.benchmark('Custom Config', testFunction, {
        iterations: 200,
        warmupIterations: 20,
        timeout: 10000,
        measureMemory: true,
        measureCpu: true
      });

      expect(result.iterations).toBe(200);
      expect(result.memoryUsage).toBeDefined();
      expect(result.cpuUsage).toBeDefined();
    });

    test('should handle different iteration counts', async () => {
      const testFunction = () => Math.random();

      const smallResult = await benchmarker.benchmark('Small Test', testFunction, {
        iterations: 10
      });

      const largeResult = await benchmarker.benchmark('Large Test', testFunction, {
        iterations: 1000
      });

      expect(smallResult.iterations).toBe(10);
      expect(largeResult.iterations).toBe(1000);
      expect(largeResult.operationsPerSecond).toBeGreaterThan(smallResult.operationsPerSecond);
    });
  });

  describe('Results Management', () => {
    test('should store and retrieve results', async () => {
      const testFunction = () => Math.random();

      await benchmarker.benchmark('Test 1', testFunction, { iterations: 10 });
      await benchmarker.benchmark('Test 2', testFunction, { iterations: 20 });

      const results = benchmarker.getResults();
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Test 1');
      expect(results[1].name).toBe('Test 2');
    });

    test('should clear results', async () => {
      const testFunction = () => Math.random();

      await benchmarker.benchmark('Test', testFunction, { iterations: 10 });
      expect(benchmarker.getResults()).toHaveLength(1);

      benchmarker.clearResults();
      expect(benchmarker.getResults()).toHaveLength(0);
    });
  });

  describe('Report Generation', () => {
    test('should generate a report', async () => {
      const testFunction = () => Math.random();

      await benchmarker.benchmark('Report Test', testFunction, { iterations: 50 });

      const report = benchmarker.generateReport();
      expect(report).toContain('Performance Benchmark Report');
      expect(report).toContain('Report Test');
      expect(report).toContain('Operations/sec');
      expect(report).toContain('Average Time');
    });

    test('should handle empty results', () => {
      const report = benchmarker.generateReport();
      expect(report).toContain('No benchmark results available');
    });
  });

  describe('Platform Information', () => {
    test('should provide platform information', () => {
      const platformInfo = benchmarker.getPlatformInfo();

      expect(platformInfo).toHaveProperty('platform');
      expect(platformInfo).toHaveProperty('arch');
      expect(platformInfo).toHaveProperty('cpus');
      expect(platformInfo).toHaveProperty('totalMemory');
      expect(platformInfo).toHaveProperty('nodeVersion');
      expect(platformInfo).toHaveProperty('v8Version');
    });
  });

  describe('Event Handling', () => {
    test('should emit events during benchmarking', async () => {
      const events: string[] = [];

      benchmarker.on('benchmarkStart', () => events.push('start'));
      benchmarker.on('warmupStart', () => events.push('warmupStart'));
      benchmarker.on('warmupEnd', () => events.push('warmupEnd'));
      benchmarker.on('measurementStart', () => events.push('measurementStart'));
      benchmarker.on('benchmarkEnd', () => events.push('end'));

      const testFunction = () => Math.random();

      await benchmarker.benchmark('Event Test', testFunction, {
        iterations: 10,
        warmupIterations: 5
      });

      expect(events).toContain('start');
      expect(events).toContain('warmupStart');
      expect(events).toContain('warmupEnd');
      expect(events).toContain('measurementStart');
      expect(events).toContain('end');
    });

    test('should emit progress events', async () => {
      const progressEvents: any[] = [];

      benchmarker.on('progress', (data) => progressEvents.push(data));

      const testFunction = () => Math.random();

      await benchmarker.benchmark('Progress Test', testFunction, {
        iterations: 100,
        warmupIterations: 5
      });

      expect(progressEvents.length).toBeGreaterThan(0);
      progressEvents.forEach(event => {
        expect(event).toHaveProperty('completed');
        expect(event).toHaveProperty('total');
        expect(event).toHaveProperty('percentage');
      });
    });
  });

  describe('Statistical Analysis', () => {
    test('should calculate correct percentiles', async () => {
      // Use a function with predictable timing variance
      const testFunction = () => {
        const delay = Math.floor(Math.random() * 10); // 0-9ms variance
        const start = performance.now();
        while (performance.now() - start < delay) {
          // Busy wait
        }
        return delay;
      };

      const result = await benchmarker.benchmark('Percentile Test', testFunction, {
        iterations: 100,
        warmupIterations: 10
      });

      expect(result.percentiles.p50).toBeGreaterThan(0);
      expect(result.percentiles.p90).toBeGreaterThanOrEqual(result.percentiles.p50);
      expect(result.percentiles.p95).toBeGreaterThanOrEqual(result.percentiles.p90);
      expect(result.percentiles.p99).toBeGreaterThanOrEqual(result.percentiles.p95);
      expect(result.standardDeviation).toBeGreaterThan(0);
    });
  });

  describe('Memory and CPU Measurement', () => {
    test('should measure memory usage', async () => {
      const memoryIntensiveFunction = () => {
        const arrays = [];
        for (let i = 0; i < 1000; i++) {
          arrays.push(new Array(1000).fill(Math.random()));
        }
        return arrays.length;
      };

      const result = await benchmarker.benchmark('Memory Test', memoryIntensiveFunction, {
        iterations: 10,
        measureMemory: true
      });

      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(result.memoryUsage.heapTotal).toBeGreaterThan(0);
      expect(result.memoryUsage.rss).toBeGreaterThan(0);
    });

    test('should measure CPU usage', async () => {
      const cpuIntensiveFunction = () => {
        let result = 0;
        for (let i = 0; i < 100000; i++) {
          result += Math.sqrt(i);
        }
        return result;
      };

      const result = await benchmarker.benchmark('CPU Test', cpuIntensiveFunction, {
        iterations: 10,
        measureCpu: true
      });

      expect(result.cpuUsage).toBeDefined();
      expect(result.cpuUsage.user).toBeGreaterThanOrEqual(0);
      expect(result.cpuUsage.system).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Quick Benchmark Function', () => {
  test('should run a quick benchmark', async () => {
    const testFunction = () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    };

    const result = await quickBenchmark('Quick Test', testFunction, 100);

    expect(result.name).toBe('Quick Test');
    expect(result.iterations).toBe(100);
    expect(result.operationsPerSecond).toBeGreaterThan(0);
    expect(result.avgTime).toBeGreaterThan(0);
  });

  test('should use default iterations', async () => {
    const testFunction = () => Math.random();

    const result = await quickBenchmark('Default Iterations', testFunction);

    expect(result.iterations).toBe(1000); // Default value
  });
});

describe('Edge Cases', () => {
  test('should handle function that returns different types', async () => {
    const mixedReturnFunction = () => {
      const rand = Math.random();
      if (rand < 0.33) return 42;
      if (rand < 0.66) return 'string';
      return { obj: true };
    };

    const result = await benchmarker.benchmark('Mixed Return', mixedReturnFunction, {
      iterations: 50
    });

    expect(result.operationsPerSecond).toBeGreaterThan(0);
  });

  test('should handle very fast functions', async () => {
    const fastFunction = () => 1 + 1;

    const result = await benchmarker.benchmark('Fast Function', fastFunction, {
      iterations: 10000,
      warmupIterations: 1000
    });

    expect(result.operationsPerSecond).toBeGreaterThan(1000); // Should be very fast
    expect(result.avgTime).toBeLessThan(1); // Should be sub-millisecond
  });

  test('should handle slow functions', async () => {
    const slowFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'slow';
    };

    const result = await benchmarker.benchmark('Slow Function', slowFunction, {
      iterations: 5,
      warmupIterations: 1,
      timeout: 30000
    });

    expect(result.avgTime).toBeGreaterThan(10); // At least 10ms
    expect(result.operationsPerSecond).toBeLessThan(100); // Should be slow
  });
});