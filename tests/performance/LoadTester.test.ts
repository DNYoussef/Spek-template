import { LoadTester } from '../../src/performance/load/LoadTester';

describe('LoadTester', () => {
  let loadTester: LoadTester;

  beforeEach(() => {
    loadTester = new LoadTester();
  });

  afterEach(() => {
    loadTester.stopAllLoadTests();
    loadTester.clearResults();
  });

  describe('Basic Load Testing', () => {
    test('should run a simple load test', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return Math.random();
      };

      const config = {
        name: 'Simple Load Test',
        targetFunction: testFunction,
        concurrency: 5,
        duration: 2000, // 2 seconds
        rampUpTime: 500,
        rampDownTime: 500,
        timeout: 1000
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.testName).toBe('Simple Load Test');
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(2000);
      expect(result.requestsPerSecond).toBeGreaterThan(0);
      expect(result.averageResponseTime).toBeGreaterThan(0);
      expect(result.successfulRequests).toBeGreaterThan(0);
      expect(result.errorRate).toBeGreaterThanOrEqual(0);
    });

    test('should run rate-based load test', async () => {
      const testFunction = () => Math.random();

      const config = {
        name: 'Rate-Based Test',
        targetFunction: testFunction,
        concurrency: 10,
        duration: 1000,
        rampUpTime: 100,
        rampDownTime: 100,
        requestRate: 10, // 10 requests per second
        timeout: 500
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.testName).toBe('Rate-Based Test');
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.requestsPerSecond).toBeCloseTo(10, 1); // Should be around 10 RPS
    });

    test('should handle functions with errors', async () => {
      const errorFunction = async () => {
        if (Math.random() < 0.2) { // 20% error rate
          throw new Error('Test error');
        }
        await new Promise(resolve => setTimeout(resolve, 1));
        return 'success';
      };

      const config = {
        name: 'Error Test',
        targetFunction: errorFunction,
        concurrency: 3,
        duration: 1000,
        rampUpTime: 100,
        rampDownTime: 100,
        timeout: 500
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.failedRequests).toBeGreaterThan(0);
      expect(result.errorRate).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle timeouts', async () => {
      const timeoutFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Always timeout
        return 'success';
      };

      const config = {
        name: 'Timeout Test',
        targetFunction: timeoutFunction,
        concurrency: 2,
        duration: 500,
        rampUpTime: 50,
        rampDownTime: 50,
        timeout: 50 // Very short timeout
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.timeoutRequests).toBeGreaterThan(0);
      expect(result.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Warmup and Cooldown', () => {
    test('should run warmup and cooldown phases', async () => {
      const testFunction = () => Math.random();

      const config = {
        name: 'Warmup Cooldown Test',
        targetFunction: testFunction,
        concurrency: 2,
        duration: 500,
        rampUpTime: 100,
        rampDownTime: 100,
        timeout: 1000,
        warmupRequests: 5,
        cooldownRequests: 3
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.totalRequests).toBeGreaterThan(5); // Should have main requests + warmup doesn't count
      expect(result.duration).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Performance Metrics', () => {
    test('should calculate correct performance metrics', async () => {
      const testFunction = async () => {
        const delay = Math.random() * 10; // Variable delay
        await new Promise(resolve => setTimeout(resolve, delay));
        return delay;
      };

      const config = {
        name: 'Metrics Test',
        targetFunction: testFunction,
        concurrency: 3,
        duration: 1000,
        rampUpTime: 100,
        rampDownTime: 100,
        timeout: 500
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.minResponseTime).toBeGreaterThanOrEqual(0);
      expect(result.maxResponseTime).toBeGreaterThanOrEqual(result.minResponseTime);
      expect(result.averageResponseTime).toBeGreaterThanOrEqual(result.minResponseTime);
      expect(result.averageResponseTime).toBeLessThanOrEqual(result.maxResponseTime);
      expect(result.medianResponseTime).toBeGreaterThanOrEqual(result.minResponseTime);
      expect(result.p95ResponseTime).toBeGreaterThanOrEqual(result.medianResponseTime);
      expect(result.p99ResponseTime).toBeGreaterThanOrEqual(result.p95ResponseTime);
      expect(result.standardDeviation).toBeGreaterThanOrEqual(0);
    });

    test('should track throughput statistics', async () => {
      const testFunction = () => Math.random();

      const config = {
        name: 'Throughput Test',
        targetFunction: testFunction,
        concurrency: 5,
        duration: 2000,
        rampUpTime: 200,
        rampDownTime: 200,
        timeout: 1000
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.throughputStats).toBeDefined();
      expect(result.throughputStats.minThroughput).toBeGreaterThanOrEqual(0);
      expect(result.throughputStats.maxThroughput).toBeGreaterThanOrEqual(result.throughputStats.minThroughput);
      expect(result.throughputStats.avgThroughput).toBeGreaterThanOrEqual(0);
    });

    test('should track memory usage', async () => {
      const testFunction = () => {
        // Create some memory allocation
        const array = new Array(1000).fill(Math.random());
        return array.length;
      };

      const config = {
        name: 'Memory Test',
        targetFunction: testFunction,
        concurrency: 3,
        duration: 1000,
        rampUpTime: 100,
        rampDownTime: 100,
        timeout: 1000
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage.start).toBeDefined();
      expect(result.memoryUsage.peak).toBeDefined();
      expect(result.memoryUsage.end).toBeDefined();
      expect(result.memoryUsage.peak.heapUsed).toBeGreaterThanOrEqual(result.memoryUsage.start.heapUsed);
    });
  });

  describe('Multiple Load Tests', () => {
    test('should run multiple load tests sequentially', async () => {
      const testFunction1 = () => Math.random();
      const testFunction2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return Math.random();
      };

      const configs = [
        {
          name: 'Test 1',
          targetFunction: testFunction1,
          concurrency: 2,
          duration: 500,
          rampUpTime: 50,
          rampDownTime: 50,
          timeout: 1000
        },
        {
          name: 'Test 2',
          targetFunction: testFunction2,
          concurrency: 3,
          duration: 500,
          rampUpTime: 50,
          rampDownTime: 50,
          timeout: 1000
        }
      ];

      const results = await loadTester.runMultipleLoadTests(configs);

      expect(results).toHaveLength(2);
      expect(results[0].testName).toBe('Test 1');
      expect(results[1].testName).toBe('Test 2');
      results.forEach(result => {
        expect(result.totalRequests).toBeGreaterThan(0);
      });
    });
  });

  describe('Test Management', () => {
    test('should track active tests', async () => {
      const longRunningFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return Math.random();
      };

      const config = {
        name: 'Long Test',
        targetFunction: longRunningFunction,
        concurrency: 2,
        duration: 2000,
        rampUpTime: 100,
        rampDownTime: 100,
        timeout: 1000
      };

      // Start test but don't wait for completion
      const testPromise = loadTester.runLoadTest(config);

      // Check if test is active
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait a bit for test to start
      const activeTests = loadTester.getActiveTests();
      expect(activeTests).toContain('Long Test');

      // Wait for completion
      await testPromise;

      // Check if test is no longer active
      const activeTestsAfter = loadTester.getActiveTests();
      expect(activeTestsAfter).not.toContain('Long Test');
    });

    test('should stop active tests', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return Math.random();
      };

      const config = {
        name: 'Stoppable Test',
        targetFunction: testFunction,
        concurrency: 2,
        duration: 5000, // Long duration
        rampUpTime: 100,
        rampDownTime: 100,
        timeout: 1000
      };

      // Start test
      const testPromise = loadTester.runLoadTest(config);

      // Wait a bit then stop
      await new Promise(resolve => setTimeout(resolve, 500));
      const stopped = loadTester.stopLoadTest('Stoppable Test');
      expect(stopped).toBe(true);

      // Wait for test to complete
      const result = await testPromise;
      expect(result.duration).toBeLessThan(5000); // Should be stopped early
    });
  });

  describe('Results Management', () => {
    test('should store and retrieve results', async () => {
      const testFunction = () => Math.random();

      const config1 = {
        name: 'Result Test 1',
        targetFunction: testFunction,
        concurrency: 2,
        duration: 500,
        rampUpTime: 50,
        rampDownTime: 50,
        timeout: 1000
      };

      const config2 = {
        name: 'Result Test 2',
        targetFunction: testFunction,
        concurrency: 3,
        duration: 500,
        rampUpTime: 50,
        rampDownTime: 50,
        timeout: 1000
      };

      await loadTester.runLoadTest(config1);
      await loadTester.runLoadTest(config2);

      const results = loadTester.getTestResults();
      expect(results).toHaveLength(2);
      expect(results[0].testName).toBe('Result Test 1');
      expect(results[1].testName).toBe('Result Test 2');

      const specificResult = loadTester.getTestResult('Result Test 1');
      expect(specificResult).toBeDefined();
      expect(specificResult!.testName).toBe('Result Test 1');
    });

    test('should clear results', async () => {
      const testFunction = () => Math.random();

      const config = {
        name: 'Clear Test',
        targetFunction: testFunction,
        concurrency: 1,
        duration: 200,
        rampUpTime: 50,
        rampDownTime: 50,
        timeout: 1000
      };

      await loadTester.runLoadTest(config);
      expect(loadTester.getTestResults()).toHaveLength(1);

      loadTester.clearResults();
      expect(loadTester.getTestResults()).toHaveLength(0);
    });
  });

  describe('Report Generation', () => {
    test('should generate load test report', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return Math.random();
      };

      const config = {
        name: 'Report Test',
        targetFunction: testFunction,
        concurrency: 3,
        duration: 1000,
        rampUpTime: 100,
        rampDownTime: 100,
        timeout: 1000
      };

      const result = await loadTester.runLoadTest(config);
      const report = loadTester.generateLoadTestReport(result);

      expect(report).toContain('Load Test Report: Report Test');
      expect(report).toContain('Total Requests:');
      expect(report).toContain('Requests/Second:');
      expect(report).toContain('Average Response Time:');
      expect(report).toContain('Performance Metrics:');
      expect(report).toContain('Memory Usage:');
    });

    test('should compare load test results', async () => {
      const testFunction = () => Math.random();

      const config = {
        name: 'Compare Test',
        targetFunction: testFunction,
        concurrency: 2,
        duration: 500,
        rampUpTime: 50,
        rampDownTime: 50,
        timeout: 1000
      };

      const baseline = await loadTester.runLoadTest(config);
      const current = await loadTester.runLoadTest(config);

      const comparison = loadTester.compareLoadTestResults(baseline, current);

      expect(comparison.testName).toBe('Compare Test');
      expect(comparison.comparison).toBeDefined();
      expect(comparison.comparison.requestsPerSecond).toBeDefined();
      expect(comparison.comparison.averageResponseTime).toBeDefined();
      expect(comparison.comparison.errorRate).toBeDefined();
      expect(comparison.comparison.p95ResponseTime).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    test('should emit events during load testing', async () => {
      const events: string[] = [];

      loadTester.on('loadTestStart', () => events.push('start'));
      loadTester.on('loadTestEnd', () => events.push('end'));
      loadTester.on('rampUpStart', () => events.push('rampUpStart'));
      loadTester.on('rampDownStart', () => events.push('rampDownStart'));

      const testFunction = () => Math.random();

      const config = {
        name: 'Event Test',
        targetFunction: testFunction,
        concurrency: 2,
        duration: 500,
        rampUpTime: 100,
        rampDownTime: 100,
        timeout: 1000
      };

      await loadTester.runLoadTest(config);

      expect(events).toContain('start');
      expect(events).toContain('end');
      expect(events).toContain('rampUpStart');
      expect(events).toContain('rampDownStart');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero concurrency gracefully', async () => {
      const testFunction = () => Math.random();

      const config = {
        name: 'Zero Concurrency',
        targetFunction: testFunction,
        concurrency: 0,
        duration: 500,
        rampUpTime: 50,
        rampDownTime: 50,
        timeout: 1000
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.totalRequests).toBe(0);
      expect(result.concurrencyAchieved).toBe(0);
    });

    test('should handle very short duration', async () => {
      const testFunction = () => Math.random();

      const config = {
        name: 'Short Duration',
        targetFunction: testFunction,
        concurrency: 2,
        duration: 10, // Very short
        rampUpTime: 5,
        rampDownTime: 5,
        timeout: 1000
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.duration).toBeGreaterThanOrEqual(10);
      expect(result.totalRequests).toBeGreaterThanOrEqual(0);
    });

    test('should handle synchronous functions', async () => {
      const syncFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const config = {
        name: 'Sync Function',
        targetFunction: syncFunction,
        concurrency: 3,
        duration: 500,
        rampUpTime: 50,
        rampDownTime: 50,
        timeout: 1000
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.successfulRequests).toBe(result.totalRequests);
      expect(result.errorRate).toBe(0);
    });
  });
});