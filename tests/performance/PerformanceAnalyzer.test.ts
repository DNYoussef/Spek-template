import { PerformanceAnalyzer } from '../../src/performance/analysis/PerformanceAnalyzer';
import { BenchmarkResult } from '../../src/performance/benchmarking/PerformanceBenchmarker';
import { LoadTestResult } from '../../src/performance/load/LoadTester';
import { SystemMetrics } from '../../src/performance/monitoring/RealTimeMonitor';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  // Helper function to create mock benchmark results
  const createMockBenchmarkResult = (
    name: string,
    opsPerSec: number,
    avgTime: number,
    memoryUsed: number = 50 * 1024 * 1024
  ): BenchmarkResult => ({
    name,
    duration: 1000,
    memoryUsage: {
      rss: memoryUsed + 10 * 1024 * 1024,
      heapTotal: memoryUsed + 5 * 1024 * 1024,
      heapUsed: memoryUsed,
      external: 1024 * 1024,
      arrayBuffers: 512 * 1024
    },
    cpuUsage: {
      user: 100000,
      system: 50000
    },
    platform: 'test',
    timestamp: Date.now(),
    iterations: 1000,
    operationsPerSecond: opsPerSec,
    minTime: avgTime * 0.8,
    maxTime: avgTime * 1.5,
    avgTime,
    standardDeviation: avgTime * 0.1,
    percentiles: {
      p50: avgTime,
      p90: avgTime * 1.2,
      p95: avgTime * 1.3,
      p99: avgTime * 1.4
    }
  });

  // Helper function to create mock load test results
  const createMockLoadTestResult = (
    testName: string,
    rps: number,
    avgResponseTime: number,
    errorRate: number = 0
  ): LoadTestResult => ({
    testName,
    startTime: Date.now() - 60000,
    endTime: Date.now(),
    duration: 60000,
    totalRequests: rps * 60,
    successfulRequests: Math.floor(rps * 60 * (1 - errorRate / 100)),
    failedRequests: Math.floor(rps * 60 * (errorRate / 100)),
    timeoutRequests: 0,
    requestsPerSecond: rps,
    averageResponseTime: avgResponseTime,
    medianResponseTime: avgResponseTime * 0.9,
    minResponseTime: avgResponseTime * 0.5,
    maxResponseTime: avgResponseTime * 2,
    p95ResponseTime: avgResponseTime * 1.5,
    p99ResponseTime: avgResponseTime * 1.8,
    standardDeviation: avgResponseTime * 0.2,
    throughputStats: {
      minThroughput: rps * 0.8,
      maxThroughput: rps * 1.2,
      avgThroughput: rps
    },
    errorRate,
    concurrencyAchieved: 10,
    memoryUsage: {
      start: { rss: 50 * 1024 * 1024, heapTotal: 40 * 1024 * 1024, heapUsed: 30 * 1024 * 1024, external: 1024 * 1024, arrayBuffers: 512 * 1024 },
      peak: { rss: 60 * 1024 * 1024, heapTotal: 50 * 1024 * 1024, heapUsed: 40 * 1024 * 1024, external: 1024 * 1024, arrayBuffers: 512 * 1024 },
      end: { rss: 55 * 1024 * 1024, heapTotal: 45 * 1024 * 1024, heapUsed: 35 * 1024 * 1024, external: 1024 * 1024, arrayBuffers: 512 * 1024 }
    },
    errors: []
  });

  // Helper function to create mock system metrics
  const createMockSystemMetrics = (
    cpuUsage: number,
    memoryUsagePercent: number
  ): SystemMetrics => ({
    timestamp: Date.now(),
    cpu: {
      usage: cpuUsage,
      loadAverage: [1.0, 1.1, 1.2],
      processes: 100
    },
    memory: {
      total: 8 * 1024 * 1024 * 1024, // 8GB
      used: (8 * 1024 * 1024 * 1024 * memoryUsagePercent) / 100,
      free: (8 * 1024 * 1024 * 1024 * (100 - memoryUsagePercent)) / 100,
      cached: 1024 * 1024 * 1024, // 1GB
      available: (8 * 1024 * 1024 * 1024 * (100 - memoryUsagePercent)) / 100,
      usagePercent: memoryUsagePercent
    },
    disk: {
      reads: 1000,
      writes: 500,
      readBytes: 1024 * 1024,
      writeBytes: 512 * 1024
    },
    network: {
      bytesReceived: 1024 * 1024,
      bytesSent: 512 * 1024,
      packetsReceived: 1000,
      packetsSent: 500
    },
    process: {
      pid: process.pid,
      memory: { rss: 50 * 1024 * 1024, heapTotal: 40 * 1024 * 1024, heapUsed: 30 * 1024 * 1024, external: 1024 * 1024, arrayBuffers: 512 * 1024 },
      cpu: { user: 100000, system: 50000 },
      uptime: 3600,
      handles: 10
    }
  });

  describe('Baseline Management', () => {
    test('should create and store baseline', async () => {
      const benchmarks = [
        createMockBenchmarkResult('Test 1', 1000, 1.0),
        createMockBenchmarkResult('Test 2', 2000, 0.5)
      ];
      const loadTests = [
        createMockLoadTestResult('Load Test 1', 100, 10)
      ];
      const systemMetrics = [
        createMockSystemMetrics(50, 60)
      ];

      const baseline = await analyzer.createBaseline(
        'test-baseline',
        '1.0.0',
        benchmarks,
        loadTests,
        systemMetrics
      );

      expect(baseline.name).toBe('test-baseline');
      expect(baseline.version).toBe('1.0.0');
      expect(baseline.benchmarks).toHaveLength(2);
      expect(baseline.loadTests).toHaveLength(1);
      expect(baseline.systemMetrics).toHaveLength(1);

      const baselines = analyzer.getBaselines();
      expect(baselines).toHaveLength(1);
      expect(baselines[0].name).toBe('test-baseline');
    });
  });

  describe('Performance Analysis', () => {
    beforeEach(async () => {
      // Create a baseline for testing
      const baselineBenchmarks = [
        createMockBenchmarkResult('CPU Test', 1000, 1.0, 50 * 1024 * 1024),
        createMockBenchmarkResult('Memory Test', 500, 2.0, 100 * 1024 * 1024)
      ];
      const baselineLoadTests = [
        createMockLoadTestResult('API Test', 100, 50, 1),
        createMockLoadTestResult('DB Test', 200, 25, 0.5)
      ];
      const baselineSystemMetrics = [
        createMockSystemMetrics(40, 50)
      ];

      await analyzer.createBaseline(
        'test-baseline',
        '1.0.0',
        baselineBenchmarks,
        baselineLoadTests,
        baselineSystemMetrics
      );
    });

    test('should detect performance regressions', async () => {
      // Create current results with regressions
      const currentBenchmarks = [
        createMockBenchmarkResult('CPU Test', 800, 1.3, 60 * 1024 * 1024), // Ops decreased, time increased, memory increased
        createMockBenchmarkResult('Memory Test', 300, 3.0, 150 * 1024 * 1024) // Significant regression
      ];
      const currentLoadTests = [
        createMockLoadTestResult('API Test', 80, 70, 5), // RPS decreased, response time increased, error rate increased
        createMockLoadTestResult('DB Test', 150, 35, 2) // Some regression
      ];
      const currentSystemMetrics = [
        createMockSystemMetrics(45, 55)
      ];

      const analysis = await analyzer.analyzePerformance(
        'test-baseline',
        currentBenchmarks,
        currentLoadTests,
        currentSystemMetrics
      );

      expect(analysis.regressions.length).toBeGreaterThan(0);

      // Check for specific regressions
      const cpuOpsRegression = analysis.regressions.find(
        r => r.testName === 'CPU Test' && r.metric === 'operationsPerSecond'
      );
      expect(cpuOpsRegression).toBeDefined();
      expect(cpuOpsRegression!.degradationPercent).toBeCloseTo(20, 1); // 20% decrease

      const memoryTimeRegression = analysis.regressions.find(
        r => r.testName === 'Memory Test' && r.metric === 'averageTime'
      );
      expect(memoryTimeRegression).toBeDefined();
      expect(memoryTimeRegression!.severity).toBe('high'); // Should be high severity

      expect(analysis.summary.regressions).toBe(analysis.regressions.length);
      expect(analysis.summary.overallScore).toBeLessThan(100);
    });

    test('should detect performance improvements', async () => {
      // Create current results with improvements
      const currentBenchmarks = [
        createMockBenchmarkResult('CPU Test', 1200, 0.8, 45 * 1024 * 1024), // Improved
        createMockBenchmarkResult('Memory Test', 600, 1.5, 90 * 1024 * 1024) // Improved
      ];
      const currentLoadTests = [
        createMockLoadTestResult('API Test', 120, 40, 0.5), // Improved
        createMockLoadTestResult('DB Test', 250, 20, 0.2) // Significantly improved
      ];
      const currentSystemMetrics = [
        createMockSystemMetrics(35, 45)
      ];

      const analysis = await analyzer.analyzePerformance(
        'test-baseline',
        currentBenchmarks,
        currentLoadTests,
        currentSystemMetrics
      );

      expect(analysis.improvements.length).toBeGreaterThan(0);

      // Check for specific improvements
      const cpuOpsImprovement = analysis.improvements.find(
        i => i.testName === 'CPU Test' && i.metric === 'operationsPerSecond'
      );
      expect(cpuOpsImprovement).toBeDefined();
      expect(cpuOpsImprovement!.improvementPercent).toBeCloseTo(20, 1); // 20% increase

      const dbResponseImprovement = analysis.improvements.find(
        i => i.testName === 'DB Test' && i.metric === 'averageResponseTime'
      );
      expect(dbResponseImprovement).toBeDefined();
      expect(dbResponseImprovement!.significance).toBe('moderate'); // Should be moderate improvement

      expect(analysis.summary.improvements).toBe(analysis.improvements.length);
      expect(analysis.summary.overallScore).toBeGreaterThan(100);
    });

    test('should identify bottlenecks', async () => {
      // Create current results with bottlenecks
      const currentBenchmarks = [
        createMockBenchmarkResult('Memory Hog', 100, 5.0, 200 * 1024 * 1024) // High memory usage
      ];
      const currentLoadTests = [
        createMockLoadTestResult('Slow API', 50, 2000, 10), // Slow and high error rate
        createMockLoadTestResult('Error Prone', 100, 100, 15) // High error rate
      ];
      const currentSystemMetrics = [
        createMockSystemMetrics(85, 90) // High CPU and memory
      ];

      const analysis = await analyzer.analyzePerformance(
        'test-baseline',
        currentBenchmarks,
        currentLoadTests,
        currentSystemMetrics
      );

      expect(analysis.bottlenecks.length).toBeGreaterThan(0);

      // Should detect memory bottleneck
      const memoryBottleneck = analysis.bottlenecks.find(b => b.component === 'Memory');
      expect(memoryBottleneck).toBeDefined();
      expect(memoryBottleneck!.impact).toBe('high');

      // Should detect CPU bottleneck
      const cpuBottleneck = analysis.bottlenecks.find(b => b.component === 'CPU');
      expect(cpuBottleneck).toBeDefined();
      expect(cpuBottleneck!.impact).toBe('critical');

      // Should detect response time bottleneck
      const responseTimeBottleneck = analysis.bottlenecks.find(b => b.component === 'Response Time');
      expect(responseTimeBottleneck).toBeDefined();

      // Should detect error handling bottleneck
      const errorBottleneck = analysis.bottlenecks.find(b => b.component === 'Error Handling');
      expect(errorBottleneck).toBeDefined();
      expect(errorBottleneck!.impact).toBe('critical');
    });

    test('should calculate statistics', async () => {
      const currentBenchmarks = [
        createMockBenchmarkResult('Test 1', 1000, 1.0),
        createMockBenchmarkResult('Test 2', 2000, 0.5),
        createMockBenchmarkResult('Test 3', 1500, 0.7)
      ];
      const currentLoadTests = [
        createMockLoadTestResult('Load 1', 100, 50),
        createMockLoadTestResult('Load 2', 150, 30)
      ];
      const currentSystemMetrics = [
        createMockSystemMetrics(50, 60)
      ];

      const analysis = await analyzer.analyzePerformance(
        'test-baseline',
        currentBenchmarks,
        currentLoadTests,
        currentSystemMetrics
      );

      expect(analysis.statistics).toBeDefined();
      expect(analysis.statistics.averagePerformance).toBeGreaterThan(0);
      expect(analysis.statistics.performanceVariability).toBeGreaterThan(0);
      expect(Array.isArray(analysis.statistics.outliers)).toBe(true);
      expect(Array.isArray(analysis.statistics.correlations)).toBe(true);
    });

    test('should generate recommendations', async () => {
      // Test with regressions
      const currentBenchmarks = [
        createMockBenchmarkResult('CPU Test', 500, 2.5) // Significant regression
      ];
      const currentLoadTests = [
        createMockLoadTestResult('API Test', 50, 100, 15) // High error rate
      ];
      const currentSystemMetrics = [
        createMockSystemMetrics(90, 95) // High resource usage
      ];

      const analysis = await analyzer.analyzePerformance(
        'test-baseline',
        currentBenchmarks,
        currentLoadTests,
        currentSystemMetrics
      );

      expect(analysis.summary.recommendation).toBeDefined();
      expect(analysis.summary.recommendation.length).toBeGreaterThan(0);

      // Should mention critical issues
      if (analysis.regressions.some(r => r.severity === 'critical')) {
        expect(analysis.summary.recommendation).toContain('Critical');
      }
    });
  });

  describe('Trend Analysis', () => {
    test('should analyze trends from history', async () => {
      // Create baseline
      await analyzer.createBaseline(
        'trend-baseline',
        '1.0.0',
        [createMockBenchmarkResult('Test', 1000, 1.0)],
        [],
        []
      );

      // Create multiple analyses to build history
      for (let i = 0; i < 12; i++) {
        const score = 80 + i * 2; // Improving trend
        const benchmarks = [createMockBenchmarkResult('Test', 1000 + i * 50, 1.0 - i * 0.05)];

        await analyzer.analyzePerformance('trend-baseline', benchmarks, [], []);
      }

      // Get the latest analysis with trends
      const analysis = await analyzer.analyzePerformance(
        'trend-baseline',
        [createMockBenchmarkResult('Test', 1500, 0.5)],
        [],
        []
      );

      expect(analysis.trends.length).toBeGreaterThan(0);

      const overallTrend = analysis.trends.find(t => t.metric === 'overallScore');
      if (overallTrend) {
        expect(overallTrend.direction).toBe('improving');
        expect(overallTrend.confidence).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = {
        regressionThresholds: {
          benchmark: {
            operationsPerSecond: 15,
            averageTime: 20,
            memoryUsage: 25
          }
        }
      };

      analyzer.updateConfig(newConfig);
      const config = analyzer.getConfig();

      expect(config.regressionThresholds.benchmark.operationsPerSecond).toBe(15);
      expect(config.regressionThresholds.benchmark.averageTime).toBe(20);
      expect(config.regressionThresholds.benchmark.memoryUsage).toBe(25);
    });

    test('should use custom thresholds in analysis', async () => {
      // Update thresholds to be more sensitive
      analyzer.updateConfig({
        regressionThresholds: {
          benchmark: {
            operationsPerSecond: 5, // More sensitive
            averageTime: 5,
            memoryUsage: 5
          }
        }
      });

      await analyzer.createBaseline(
        'sensitive-baseline',
        '1.0.0',
        [createMockBenchmarkResult('Test', 1000, 1.0)],
        [],
        []
      );

      // Small regression that would normally not trigger
      const analysis = await analyzer.analyzePerformance(
        'sensitive-baseline',
        [createMockBenchmarkResult('Test', 940, 1.07)], // 6% ops decrease, 7% time increase
        [],
        []
      );

      expect(analysis.regressions.length).toBeGreaterThan(0);
    });
  });

  describe('Analysis History', () => {
    test('should maintain analysis history', async () => {
      await analyzer.createBaseline(
        'history-baseline',
        '1.0.0',
        [createMockBenchmarkResult('Test', 1000, 1.0)],
        [],
        []
      );

      expect(analyzer.getAnalysisHistory()).toHaveLength(0);

      // Run multiple analyses
      await analyzer.analyzePerformance('history-baseline', [createMockBenchmarkResult('Test', 1100, 0.9)], [], []);
      await analyzer.analyzePerformance('history-baseline', [createMockBenchmarkResult('Test', 1200, 0.8)], [], []);

      const history = analyzer.getAnalysisHistory();
      expect(history).toHaveLength(2);
      expect(history[0].timestamp).toBeLessThan(history[1].timestamp);
    });

    test('should clear analysis history', async () => {
      await analyzer.createBaseline('clear-baseline', '1.0.0', [createMockBenchmarkResult('Test', 1000, 1.0)], [], []);
      await analyzer.analyzePerformance('clear-baseline', [createMockBenchmarkResult('Test', 1100, 0.9)], [], []);

      expect(analyzer.getAnalysisHistory()).toHaveLength(1);

      analyzer.clearAnalysisHistory();
      expect(analyzer.getAnalysisHistory()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for non-existent baseline', async () => {
      await expect(
        analyzer.analyzePerformance('non-existent', [], [], [])
      ).rejects.toThrow("Baseline 'non-existent' not found");
    });

    test('should handle empty results gracefully', async () => {
      await analyzer.createBaseline('empty-baseline', '1.0.0', [], [], []);

      const analysis = await analyzer.analyzePerformance('empty-baseline', [], [], []);

      expect(analysis.summary.totalTests).toBe(0);
      expect(analysis.regressions).toHaveLength(0);
      expect(analysis.improvements).toHaveLength(0);
      expect(analysis.summary.overallScore).toBe(100); // No changes = perfect score
    });
  });

  describe('Severity and Significance Calculation', () => {
    test('should calculate correct severity levels', async () => {
      await analyzer.createBaseline(
        'severity-baseline',
        '1.0.0',
        [createMockBenchmarkResult('Test', 1000, 1.0)],
        [],
        []
      );

      // Test different levels of regression
      const severeRegression = createMockBenchmarkResult('Test', 400, 2.5); // 60% ops decrease, 150% time increase
      const analysis = await analyzer.analyzePerformance('severity-baseline', [severeRegression], [], []);

      const opsRegression = analysis.regressions.find(r => r.metric === 'operationsPerSecond');
      expect(opsRegression!.severity).toBe('critical'); // Should be critical for 60% decrease
    });

    test('should calculate correct improvement significance', async () => {
      await analyzer.createBaseline(
        'improvement-baseline',
        '1.0.0',
        [createMockBenchmarkResult('Test', 1000, 1.0)],
        [],
        []
      );

      // Test major improvement
      const majorImprovement = createMockBenchmarkResult('Test', 1600, 0.4); // 60% ops increase, 60% time decrease
      const analysis = await analyzer.analyzePerformance('improvement-baseline', [majorImprovement], [], []);

      const opsImprovement = analysis.improvements.find(i => i.metric === 'operationsPerSecond');
      expect(opsImprovement!.significance).toBe('exceptional'); // Should be exceptional for 60% improvement
    });
  });

  describe('Correlation Analysis', () => {
    test('should detect correlations between metrics', async () => {
      await analyzer.createBaseline(
        'correlation-baseline',
        '1.0.0',
        [],
        [],
        []
      );

      // Create benchmarks with strong negative correlation between ops and memory
      const correlatedBenchmarks = [
        createMockBenchmarkResult('Test1', 1000, 1.0, 30 * 1024 * 1024),
        createMockBenchmarkResult('Test2', 800, 1.2, 50 * 1024 * 1024),
        createMockBenchmarkResult('Test3', 600, 1.5, 70 * 1024 * 1024),
        createMockBenchmarkResult('Test4', 400, 2.0, 90 * 1024 * 1024),
        createMockBenchmarkResult('Test5', 200, 3.0, 110 * 1024 * 1024)
      ];

      const analysis = await analyzer.analyzePerformance('correlation-baseline', correlatedBenchmarks, [], []);

      const correlation = analysis.statistics.correlations.find(
        c => c.metric1 === 'operationsPerSecond' && c.metric2 === 'memoryUsage'
      );

      if (correlation) {
        expect(Math.abs(correlation.correlation)).toBeGreaterThan(0.6);
        expect(correlation.significance).toBeGreaterThan(0.6);
      }
    });
  });
});