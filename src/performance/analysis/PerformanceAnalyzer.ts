import { BenchmarkResult } from '../benchmarking/PerformanceBenchmarker';
import { LoadTestResult } from '../load/LoadTester';
import { SystemMetrics } from '../monitoring/RealTimeMonitor';
import * as fs from 'fs/promises';

export interface PerformanceBaseline {
  name: string;
  version: string;
  timestamp: number;
  benchmarks: BenchmarkResult[];
  loadTests: LoadTestResult[];
  systemMetrics: SystemMetrics[];
  platform: string;
  nodeVersion: string;
}

export interface PerformanceRegression {
  type: 'benchmark' | 'loadtest' | 'system';
  testName: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  degradationPercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
}

export interface PerformanceImprovement {
  type: 'benchmark' | 'loadtest' | 'system';
  testName: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  improvementPercent: number;
  significance: 'minor' | 'moderate' | 'major' | 'exceptional';
}

export interface PerformanceAnalysis {
  timestamp: number;
  summary: {
    totalTests: number;
    regressions: number;
    improvements: number;
    stable: number;
    overallScore: number;
    recommendation: string;
  };
  regressions: PerformanceRegression[];
  improvements: PerformanceImprovement[];
  trends: {
    metric: string;
    direction: 'improving' | 'degrading' | 'stable';
    changeRate: number;
    confidence: number;
  }[];
  bottlenecks: {
    component: string;
    issue: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }[];
  statistics: {
    averagePerformance: number;
    performanceVariability: number;
    outliers: string[];
    correlations: Array<{
      metric1: string;
      metric2: string;
      correlation: number;
      significance: number;
    }>;
  };
}

export interface AnalysisConfig {
  regressionThresholds: {
    benchmark: {
      operationsPerSecond: number;
      averageTime: number;
      memoryUsage: number;
    };
    loadTest: {
      requestsPerSecond: number;
      responseTime: number;
      errorRate: number;
    };
    system: {
      cpuUsage: number;
      memoryUsage: number;
      diskIO: number;
    };
  };
  trendAnalysisWindow: number; // Number of data points to consider
  outlierDetectionSensitivity: number; // Z-score threshold
  correlationMinSignificance: number;
}

export class PerformanceAnalyzer {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private analysisHistory: PerformanceAnalysis[] = [];
  private config: AnalysisConfig;

  constructor(config?: Partial<AnalysisConfig>) {
    this.config = {
      regressionThresholds: {
        benchmark: {
          operationsPerSecond: 10, // 10% degradation
          averageTime: 15, // 15% increase
          memoryUsage: 20 // 20% increase
        },
        loadTest: {
          requestsPerSecond: 10, // 10% degradation
          responseTime: 20, // 20% increase
          errorRate: 5 // 5% increase
        },
        system: {
          cpuUsage: 15, // 15% increase
          memoryUsage: 25, // 25% increase
          diskIO: 30 // 30% increase
        }
      },
      trendAnalysisWindow: 10,
      outlierDetectionSensitivity: 2.5,
      correlationMinSignificance: 0.6,
      ...config
    };
  }

  async createBaseline(
    name: string,
    version: string,
    benchmarks: BenchmarkResult[],
    loadTests: LoadTestResult[],
    systemMetrics: SystemMetrics[]
  ): Promise<PerformanceBaseline> {
    const baseline: PerformanceBaseline = {
      name,
      version,
      timestamp: Date.now(),
      benchmarks: [...benchmarks],
      loadTests: [...loadTests],
      systemMetrics: [...systemMetrics],
      platform: process.platform,
      nodeVersion: process.version
    };

    this.baselines.set(name, baseline);
    return baseline;
  }

  async analyzePerformance(
    baselineName: string,
    currentBenchmarks: BenchmarkResult[],
    currentLoadTests: LoadTestResult[],
    currentSystemMetrics: SystemMetrics[]
  ): Promise<PerformanceAnalysis> {
    const baseline = this.baselines.get(baselineName);
    if (!baseline) {
      throw new Error(`Baseline '${baselineName}' not found`);
    }

    const regressions = await this.detectRegressions(
      baseline,
      currentBenchmarks,
      currentLoadTests,
      currentSystemMetrics
    );

    const improvements = await this.detectImprovements(
      baseline,
      currentBenchmarks,
      currentLoadTests,
      currentSystemMetrics
    );

    const trends = await this.analyzeTrends(currentBenchmarks, currentLoadTests, currentSystemMetrics);
    const bottlenecks = await this.identifyBottlenecks(currentBenchmarks, currentLoadTests, currentSystemMetrics);
    const statistics = await this.calculateStatistics(currentBenchmarks, currentLoadTests, currentSystemMetrics);

    const totalTests = currentBenchmarks.length + currentLoadTests.length;
    const stableTests = totalTests - regressions.length - improvements.length;
    const overallScore = this.calculateOverallScore(regressions, improvements, totalTests);

    const analysis: PerformanceAnalysis = {
      timestamp: Date.now(),
      summary: {
        totalTests,
        regressions: regressions.length,
        improvements: improvements.length,
        stable: stableTests,
        overallScore,
        recommendation: this.generateRecommendation(regressions, improvements, bottlenecks)
      },
      regressions,
      improvements,
      trends,
      bottlenecks,
      statistics
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  private async detectRegressions(
    baseline: PerformanceBaseline,
    benchmarks: BenchmarkResult[],
    loadTests: LoadTestResult[],
    systemMetrics: SystemMetrics[]
  ): Promise<PerformanceRegression[]> {
    const regressions: PerformanceRegression[] = [];

    // Benchmark regressions
    for (const currentBench of benchmarks) {
      const baselineBench = baseline.benchmarks.find(b => b.name === currentBench.name);
      if (baselineBench) {
        // Operations per second regression
        const opsChange = ((baselineBench.operationsPerSecond - currentBench.operationsPerSecond) / baselineBench.operationsPerSecond) * 100;
        if (opsChange > this.config.regressionThresholds.benchmark.operationsPerSecond) {
          regressions.push({
            type: 'benchmark',
            testName: currentBench.name,
            metric: 'operationsPerSecond',
            baselineValue: baselineBench.operationsPerSecond,
            currentValue: currentBench.operationsPerSecond,
            degradationPercent: opsChange,
            severity: this.calculateSeverity(opsChange, this.config.regressionThresholds.benchmark.operationsPerSecond),
            threshold: this.config.regressionThresholds.benchmark.operationsPerSecond
          });
        }

        // Average time regression
        const timeChange = ((currentBench.avgTime - baselineBench.avgTime) / baselineBench.avgTime) * 100;
        if (timeChange > this.config.regressionThresholds.benchmark.averageTime) {
          regressions.push({
            type: 'benchmark',
            testName: currentBench.name,
            metric: 'averageTime',
            baselineValue: baselineBench.avgTime,
            currentValue: currentBench.avgTime,
            degradationPercent: timeChange,
            severity: this.calculateSeverity(timeChange, this.config.regressionThresholds.benchmark.averageTime),
            threshold: this.config.regressionThresholds.benchmark.averageTime
          });
        }

        // Memory usage regression
        const memoryChange = ((currentBench.memoryUsage.heapUsed - baselineBench.memoryUsage.heapUsed) / baselineBench.memoryUsage.heapUsed) * 100;
        if (memoryChange > this.config.regressionThresholds.benchmark.memoryUsage) {
          regressions.push({
            type: 'benchmark',
            testName: currentBench.name,
            metric: 'memoryUsage',
            baselineValue: baselineBench.memoryUsage.heapUsed,
            currentValue: currentBench.memoryUsage.heapUsed,
            degradationPercent: memoryChange,
            severity: this.calculateSeverity(memoryChange, this.config.regressionThresholds.benchmark.memoryUsage),
            threshold: this.config.regressionThresholds.benchmark.memoryUsage
          });
        }
      }
    }

    // Load test regressions
    for (const currentTest of loadTests) {
      const baselineTest = baseline.loadTests.find(t => t.testName === currentTest.testName);
      if (baselineTest) {
        // Requests per second regression
        const rpsChange = ((baselineTest.requestsPerSecond - currentTest.requestsPerSecond) / baselineTest.requestsPerSecond) * 100;
        if (rpsChange > this.config.regressionThresholds.loadTest.requestsPerSecond) {
          regressions.push({
            type: 'loadtest',
            testName: currentTest.testName,
            metric: 'requestsPerSecond',
            baselineValue: baselineTest.requestsPerSecond,
            currentValue: currentTest.requestsPerSecond,
            degradationPercent: rpsChange,
            severity: this.calculateSeverity(rpsChange, this.config.regressionThresholds.loadTest.requestsPerSecond),
            threshold: this.config.regressionThresholds.loadTest.requestsPerSecond
          });
        }

        // Response time regression
        const responseTimeChange = ((currentTest.averageResponseTime - baselineTest.averageResponseTime) / baselineTest.averageResponseTime) * 100;
        if (responseTimeChange > this.config.regressionThresholds.loadTest.responseTime) {
          regressions.push({
            type: 'loadtest',
            testName: currentTest.testName,
            metric: 'averageResponseTime',
            baselineValue: baselineTest.averageResponseTime,
            currentValue: currentTest.averageResponseTime,
            degradationPercent: responseTimeChange,
            severity: this.calculateSeverity(responseTimeChange, this.config.regressionThresholds.loadTest.responseTime),
            threshold: this.config.regressionThresholds.loadTest.responseTime
          });
        }

        // Error rate regression
        const errorRateChange = currentTest.errorRate - baselineTest.errorRate;
        if (errorRateChange > this.config.regressionThresholds.loadTest.errorRate) {
          regressions.push({
            type: 'loadtest',
            testName: currentTest.testName,
            metric: 'errorRate',
            baselineValue: baselineTest.errorRate,
            currentValue: currentTest.errorRate,
            degradationPercent: errorRateChange,
            severity: this.calculateSeverity(errorRateChange, this.config.regressionThresholds.loadTest.errorRate),
            threshold: this.config.regressionThresholds.loadTest.errorRate
          });
        }
      }
    }

    return regressions;
  }

  private async detectImprovements(
    baseline: PerformanceBaseline,
    benchmarks: BenchmarkResult[],
    loadTests: LoadTestResult[],
    systemMetrics: SystemMetrics[]
  ): Promise<PerformanceImprovement[]> {
    const improvements: PerformanceImprovement[] = [];

    // Benchmark improvements
    for (const currentBench of benchmarks) {
      const baselineBench = baseline.benchmarks.find(b => b.name === currentBench.name);
      if (baselineBench) {
        // Operations per second improvement
        const opsChange = ((currentBench.operationsPerSecond - baselineBench.operationsPerSecond) / baselineBench.operationsPerSecond) * 100;
        if (opsChange > 5) { // 5% improvement threshold
          improvements.push({
            type: 'benchmark',
            testName: currentBench.name,
            metric: 'operationsPerSecond',
            baselineValue: baselineBench.operationsPerSecond,
            currentValue: currentBench.operationsPerSecond,
            improvementPercent: opsChange,
            significance: this.calculateImprovementSignificance(opsChange)
          });
        }

        // Average time improvement
        const timeChange = ((baselineBench.avgTime - currentBench.avgTime) / baselineBench.avgTime) * 100;
        if (timeChange > 5) { // 5% improvement threshold
          improvements.push({
            type: 'benchmark',
            testName: currentBench.name,
            metric: 'averageTime',
            baselineValue: baselineBench.avgTime,
            currentValue: currentBench.avgTime,
            improvementPercent: timeChange,
            significance: this.calculateImprovementSignificance(timeChange)
          });
        }
      }
    }

    // Load test improvements
    for (const currentTest of loadTests) {
      const baselineTest = baseline.loadTests.find(t => t.testName === currentTest.testName);
      if (baselineTest) {
        // Requests per second improvement
        const rpsChange = ((currentTest.requestsPerSecond - baselineTest.requestsPerSecond) / baselineTest.requestsPerSecond) * 100;
        if (rpsChange > 5) { // 5% improvement threshold
          improvements.push({
            type: 'loadtest',
            testName: currentTest.testName,
            metric: 'requestsPerSecond',
            baselineValue: baselineTest.requestsPerSecond,
            currentValue: currentTest.requestsPerSecond,
            improvementPercent: rpsChange,
            significance: this.calculateImprovementSignificance(rpsChange)
          });
        }

        // Response time improvement
        const responseTimeChange = ((baselineTest.averageResponseTime - currentTest.averageResponseTime) / baselineTest.averageResponseTime) * 100;
        if (responseTimeChange > 5) { // 5% improvement threshold
          improvements.push({
            type: 'loadtest',
            testName: currentTest.testName,
            metric: 'averageResponseTime',
            baselineValue: baselineTest.averageResponseTime,
            currentValue: currentTest.averageResponseTime,
            improvementPercent: responseTimeChange,
            significance: this.calculateImprovementSignificance(responseTimeChange)
          });
        }
      }
    }

    return improvements;
  }

  private async analyzeTrends(
    benchmarks: BenchmarkResult[],
    loadTests: LoadTestResult[],
    systemMetrics: SystemMetrics[]
  ): Promise<PerformanceAnalysis['trends']> {
    const trends: PerformanceAnalysis['trends'] = [];

    // Analyze trends from history
    if (this.analysisHistory.length >= this.config.trendAnalysisWindow) {
      const recentAnalyses = this.analysisHistory.slice(-this.config.trendAnalysisWindow);

      // Trend analysis for overall score
      const scores = recentAnalyses.map(a => a.summary.overallScore);
      const scoreTrend = this.calculateTrendDirection(scores);
      trends.push({
        metric: 'overallScore',
        direction: scoreTrend.direction,
        changeRate: scoreTrend.rate,
        confidence: scoreTrend.confidence
      });

      // Trend analysis for regression count
      const regressionCounts = recentAnalyses.map(a => a.summary.regressions);
      const regressionTrend = this.calculateTrendDirection(regressionCounts);
      trends.push({
        metric: 'regressionCount',
        direction: regressionTrend.direction,
        changeRate: regressionTrend.rate,
        confidence: regressionTrend.confidence
      });
    }

    return trends;
  }

  private calculateTrendDirection(values: number[]): { direction: 'improving' | 'degrading' | 'stable'; rate: number; confidence: number } {
    if (values.length < 3) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumXX = values.reduce((sum, _, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const rSquared = this.calculateRSquared(values, slope);

    return {
      direction: slope > 0.1 ? 'improving' : slope < -0.1 ? 'degrading' : 'stable',
      rate: Math.abs(slope),
      confidence: rSquared
    };
  }

  private calculateRSquared(values: number[], slope: number): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const totalVariance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const residualVariance = values.reduce((sum, val, index) => {
      const predicted = slope * index + (mean - slope * (values.length - 1) / 2);
      return sum + Math.pow(val - predicted, 2);
    }, 0);

    return 1 - (residualVariance / totalVariance);
  }

  private async identifyBottlenecks(
    benchmarks: BenchmarkResult[],
    loadTests: LoadTestResult[],
    systemMetrics: SystemMetrics[]
  ): Promise<PerformanceAnalysis['bottlenecks']> {
    const bottlenecks: PerformanceAnalysis['bottlenecks'] = [];

    // Memory bottlenecks
    const highMemoryBenchmarks = benchmarks.filter(b => b.memoryUsage.heapUsed > 100 * 1024 * 1024); // > 100MB
    if (highMemoryBenchmarks.length > 0) {
      bottlenecks.push({
        component: 'Memory',
        issue: `High memory usage detected in ${highMemoryBenchmarks.length} benchmark(s)`,
        impact: 'high',
        recommendation: 'Optimize memory allocation and implement garbage collection strategies'
      });
    }

    // CPU bottlenecks from system metrics
    if (systemMetrics.length > 0) {
      const avgCpuUsage = systemMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / systemMetrics.length;
      if (avgCpuUsage > 80) {
        bottlenecks.push({
          component: 'CPU',
          issue: `High CPU usage detected (${avgCpuUsage.toFixed(1)}% average)`,
          impact: 'critical',
          recommendation: 'Optimize CPU-intensive operations and consider load balancing'
        });
      }
    }

    // Response time bottlenecks
    const slowLoadTests = loadTests.filter(lt => lt.averageResponseTime > 1000); // > 1 second
    if (slowLoadTests.length > 0) {
      bottlenecks.push({
        component: 'Response Time',
        issue: `Slow response times detected in ${slowLoadTests.length} load test(s)`,
        impact: 'medium',
        recommendation: 'Optimize request processing and consider caching strategies'
      });
    }

    // Error rate bottlenecks
    const highErrorTests = loadTests.filter(lt => lt.errorRate > 5); // > 5% error rate
    if (highErrorTests.length > 0) {
      bottlenecks.push({
        component: 'Error Handling',
        issue: `High error rates detected in ${highErrorTests.length} load test(s)`,
        impact: 'critical',
        recommendation: 'Investigate and fix error sources, implement better error handling'
      });
    }

    return bottlenecks;
  }

  private async calculateStatistics(
    benchmarks: BenchmarkResult[],
    loadTests: LoadTestResult[],
    systemMetrics: SystemMetrics[]
  ): Promise<PerformanceAnalysis['statistics']> {
    // Calculate average performance
    const benchmarkOps = benchmarks.map(b => b.operationsPerSecond);
    const loadTestRps = loadTests.map(lt => lt.requestsPerSecond);
    const allPerformanceValues = [...benchmarkOps, ...loadTestRps];
    const averagePerformance = allPerformanceValues.length > 0 ?
      allPerformanceValues.reduce((sum, val) => sum + val, 0) / allPerformanceValues.length : 0;

    // Calculate variability
    const variance = allPerformanceValues.length > 0 ?
      allPerformanceValues.reduce((sum, val) => sum + Math.pow(val - averagePerformance, 2), 0) / allPerformanceValues.length : 0;
    const performanceVariability = Math.sqrt(variance);

    // Detect outliers
    const outliers: string[] = [];
    const zScoreThreshold = this.config.outlierDetectionSensitivity;

    for (const benchmark of benchmarks) {
      const zScore = Math.abs((benchmark.operationsPerSecond - averagePerformance) / performanceVariability);
      if (zScore > zScoreThreshold) {
        outliers.push(`Benchmark: ${benchmark.name} (${benchmark.operationsPerSecond.toFixed(2)} ops/sec)`);
      }
    }

    for (const loadTest of loadTests) {
      const zScore = Math.abs((loadTest.requestsPerSecond - averagePerformance) / performanceVariability);
      if (zScore > zScoreThreshold) {
        outliers.push(`Load Test: ${loadTest.testName} (${loadTest.requestsPerSecond.toFixed(2)} req/sec)`);
      }
    }

    // Calculate correlations
    const correlations: Array<{
      metric1: string;
      metric2: string;
      correlation: number;
      significance: number;
    }> = [];

    // Example: Correlation between operations per second and memory usage
    if (benchmarks.length > 3) {
      const opsValues = benchmarks.map(b => b.operationsPerSecond);
      const memoryValues = benchmarks.map(b => b.memoryUsage.heapUsed);
      const correlation = this.calculateCorrelation(opsValues, memoryValues);

      if (Math.abs(correlation) >= this.config.correlationMinSignificance) {
        correlations.push({
          metric1: 'operationsPerSecond',
          metric2: 'memoryUsage',
          correlation,
          significance: Math.abs(correlation)
        });
      }
    }

    return {
      averagePerformance,
      performanceVariability,
      outliers,
      correlations
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;

    const numerator = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
    const denominatorX = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0));
    const denominatorY = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0));

    if (denominatorX === 0 || denominatorY === 0) return 0;

    return numerator / (denominatorX * denominatorY);
  }

  private calculateSeverity(degradationPercent: number, threshold: number): PerformanceRegression['severity'] {
    const ratio = degradationPercent / threshold;
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  private calculateImprovementSignificance(improvementPercent: number): PerformanceImprovement['significance'] {
    if (improvementPercent >= 50) return 'exceptional';
    if (improvementPercent >= 25) return 'major';
    if (improvementPercent >= 10) return 'moderate';
    return 'minor';
  }

  private calculateOverallScore(
    regressions: PerformanceRegression[],
    improvements: PerformanceImprovement[],
    totalTests: number
  ): number {
    if (totalTests === 0) return 100;

    let score = 100;

    // Subtract points for regressions
    for (const regression of regressions) {
      switch (regression.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }

    // Add points for improvements
    for (const improvement of improvements) {
      switch (improvement.significance) {
        case 'exceptional': score += 10; break;
        case 'major': score += 7; break;
        case 'moderate': score += 5; break;
        case 'minor': score += 2; break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendation(
    regressions: PerformanceRegression[],
    improvements: PerformanceImprovement[],
    bottlenecks: PerformanceAnalysis['bottlenecks']
  ): string {
    if (regressions.length === 0 && improvements.length > 0) {
      return 'Excellent performance improvements detected. Continue current optimization efforts.';
    }

    if (regressions.length > 0) {
      const criticalRegressions = regressions.filter(r => r.severity === 'critical');
      if (criticalRegressions.length > 0) {
        return 'Critical performance regressions detected. Immediate investigation required.';
      }

      const highRegressions = regressions.filter(r => r.severity === 'high');
      if (highRegressions.length > 0) {
        return 'High impact performance regressions detected. Prioritize fixes for affected components.';
      }

      return 'Performance regressions detected. Review and optimize affected areas.';
    }

    if (bottlenecks.length > 0) {
      const criticalBottlenecks = bottlenecks.filter(b => b.impact === 'critical');
      if (criticalBottlenecks.length > 0) {
        return 'Critical performance bottlenecks identified. Focus on CPU and error handling optimizations.';
      }

      return 'Performance bottlenecks identified. Implement recommended optimizations.';
    }

    return 'Performance is stable. Continue monitoring and maintain current standards.';
  }

  async saveBaseline(baseline: PerformanceBaseline, filePath: string): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(baseline, null, 2));
  }

  async loadBaseline(filePath: string): Promise<PerformanceBaseline> {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    this.baselines.set(data.name, data);
    return data;
  }

  async saveAnalysis(analysis: PerformanceAnalysis, filePath: string): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
  }

  getBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  getAnalysisHistory(): PerformanceAnalysis[] {
    return [...this.analysisHistory];
  }

  clearAnalysisHistory(): void {
    this.analysisHistory = [];
  }

  updateConfig(config: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AnalysisConfig {
    return { ...this.config };
  }
}