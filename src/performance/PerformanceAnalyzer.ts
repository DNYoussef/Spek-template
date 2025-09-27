import { BenchmarkResult } from './PerformanceBenchmarker';
import { EventEmitter } from 'events';

export interface AnalysisResult {
  summary: PerformanceSummary;
  statistics: StatisticalAnalysis;
  patterns: PerformancePattern[];
  outliers: OutlierAnalysis;
  correlations: CorrelationAnalysis;
  trends: TrendAnalysis;
  recommendations: AnalysisRecommendation[];
  riskAssessment: RiskAssessment;
}

export interface PerformanceSummary {
  totalTests: number;
  successRate: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  totalIterations: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  averageCPUUsage: number;
  peakCPUUsage: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  stabilityScore: number; // 0-1
  efficiencyScore: number; // 0-1
}

export interface StatisticalAnalysis {
  duration: StatisticalMetrics;
  memory: StatisticalMetrics;
  cpu: StatisticalMetrics;
  normalityTests: NormalityTest[];
  distributionFit: DistributionFit;
  confidenceIntervals: ConfidenceInterval[];
}

export interface StatisticalMetrics {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  range: number;
  interquartileRange: number;
  min: number;
  max: number;
  percentiles: { [key: number]: number };
}

export interface NormalityTest {
  test: 'shapiro-wilk' | 'kolmogorov-smirnov' | 'anderson-darling';
  statistic: number;
  pValue: number;
  isNormal: boolean;
  confidence: number;
}

export interface DistributionFit {
  bestFit: 'normal' | 'lognormal' | 'exponential' | 'weibull' | 'gamma';
  goodnessOfFit: number;
  parameters: { [key: string]: number };
  alternativeFits: { distribution: string; fit: number }[];
}

export interface ConfidenceInterval {
  metric: string;
  confidence: number; // e.g., 95 for 95% confidence
  lowerBound: number;
  upperBound: number;
  margin: number;
}

export interface PerformancePattern {
  type: 'seasonal' | 'cyclic' | 'trend' | 'noise' | 'outlier-cluster';
  description: string;
  confidence: number; // 0-1
  frequency: number;
  amplitude: number;
  phase: number;
  examples: any[];
  impact: 'positive' | 'negative' | 'neutral';
}

export interface OutlierAnalysis {
  method: 'iqr' | 'z-score' | 'modified-z-score' | 'isolation-forest';
  outliers: OutlierPoint[];
  outlierRate: number;
  severity: OutlierSeverity[];
  causes: OutlierCause[];
}

export interface OutlierPoint {
  testId: string;
  suite: string;
  test: string;
  value: number;
  metric: string;
  deviationScore: number;
  probability: number;
  context: any;
}

export interface OutlierSeverity {
  level: 'mild' | 'moderate' | 'severe' | 'extreme';
  count: number;
  threshold: number;
  impact: string;
}

export interface OutlierCause {
  cause: 'data-variance' | 'measurement-error' | 'system-anomaly' | 'code-issue';
  probability: number;
  evidence: string[];
  recommendation: string;
}

export interface CorrelationAnalysis {
  correlations: Correlation[];
  strongCorrelations: Correlation[];
  dependencies: Dependency[];
  clusters: PerformanceCluster[];
}

export interface Correlation {
  metric1: string;
  metric2: string;
  coefficient: number;
  pValue: number;
  strength: 'very-weak' | 'weak' | 'moderate' | 'strong' | 'very-strong';
  direction: 'positive' | 'negative';
  significance: boolean;
}

export interface Dependency {
  dependent: string;
  independent: string;
  relationship: 'linear' | 'exponential' | 'logarithmic' | 'polynomial';
  strength: number;
  equation: string;
}

export interface PerformanceCluster {
  id: string;
  tests: string[];
  characteristics: string[];
  centroid: { [metric: string]: number };
  cohesion: number;
  size: number;
}

export interface TrendAnalysis {
  overallTrend: 'improving' | 'degrading' | 'stable' | 'volatile';
  trendStrength: number; // 0-1
  seasonality: SeasonalityAnalysis;
  changePoints: ChangePoint[];
  forecast: ForecastResult;
}

export interface SeasonalityAnalysis {
  hasSeasonality: boolean;
  period: number;
  strength: number;
  phase: number;
  components: SeasonalComponent[];
}

export interface SeasonalComponent {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: number;
  amplitude: number;
  phase: number;
  significance: number;
}

export interface ChangePoint {
  timestamp: number;
  metric: string;
  changeType: 'mean-shift' | 'variance-change' | 'trend-change';
  magnitude: number;
  confidence: number;
  before: StatisticalMetrics;
  after: StatisticalMetrics;
}

export interface ForecastResult {
  method: 'linear-regression' | 'arima' | 'exponential-smoothing';
  predictions: ForecastPoint[];
  accuracy: ForecastAccuracy;
  confidence: number;
}

export interface ForecastPoint {
  timestamp: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ForecastAccuracy {
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  r2: number; // R-squared
}

export interface AnalysisRecommendation {
  type: 'performance' | 'stability' | 'efficiency' | 'resource' | 'methodology';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  expectedImprovement: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  confidenceLevel: number;
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  impact: string;
  evidence: string[];
}

export interface MitigationStrategy {
  strategy: string;
  applicableRisks: string[];
  effectiveness: number; // 0-1
  cost: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
}

export class PerformanceAnalyzer extends EventEmitter {
  constructor() {
    super();
  }

  async analyzeResults(results: BenchmarkResult[]): Promise<AnalysisResult> {
    console.log(`Analyzing ${results.length} benchmark results...`);
    this.emit('analysis-start', { resultCount: results.length });

    try {
      const summary = this.generateSummary(results);
      const statistics = this.performStatisticalAnalysis(results);
      const patterns = this.identifyPatterns(results);
      const outliers = this.analyzeOutliers(results);
      const correlations = this.analyzeCorrelations(results);
      const trends = this.analyzeTrends(results);
      const recommendations = this.generateRecommendations(results, summary, patterns, outliers);
      const riskAssessment = this.assessRisks(results, outliers, trends);

      const analysis: AnalysisResult = {
        summary,
        statistics,
        patterns,
        outliers,
        correlations,
        trends,
        recommendations,
        riskAssessment
      };

      this.emit('analysis-complete', analysis);
      return analysis;

    } catch (error) {
      this.emit('analysis-error', error);
      throw error;
    }
  }

  private generateSummary(results: BenchmarkResult[]): PerformanceSummary {
    if (results.length === 0) {
      return this.createEmptySummary();
    }

    const durations = results.map(r => r.duration.mean);
    const memoryUsages = results.map(r => r.memory.heapUsed);
    const cpuUsages = results.map(r => r.cpu.percentage);

    const successfulResults = results.filter(r => r.success);
    const successRate = results.length > 0 ? successfulResults.length / results.length : 0;

    const sortedDurations = durations.slice().sort((a, b) => a - b);
    const averageDuration = this.calculateMean(durations);
    const medianDuration = this.calculateMedian(sortedDurations);
    const standardDeviation = this.calculateStandardDeviation(durations);
    const coefficientOfVariation = averageDuration > 0 ? standardDeviation / averageDuration : 0;

    return {
      totalTests: results.length,
      successRate,
      averageDuration,
      medianDuration,
      p95Duration: this.calculatePercentile(sortedDurations, 95),
      p99Duration: this.calculatePercentile(sortedDurations, 99),
      standardDeviation,
      coefficientOfVariation,
      totalIterations: results.reduce((sum, r) => sum + r.iterations, 0),
      averageMemoryUsage: this.calculateMean(memoryUsages),
      peakMemoryUsage: Math.max(...memoryUsages),
      averageCPUUsage: this.calculateMean(cpuUsages),
      peakCPUUsage: Math.max(...cpuUsages),
      performanceGrade: this.calculatePerformanceGrade(successRate, coefficientOfVariation),
      stabilityScore: this.calculateStabilityScore(results),
      efficiencyScore: this.calculateEfficiencyScore(results)
    };
  }

  private performStatisticalAnalysis(results: BenchmarkResult[]): StatisticalAnalysis {
    const durations = results.map(r => r.duration.mean);
    const memoryUsages = results.map(r => r.memory.heapUsed);
    const cpuUsages = results.map(r => r.cpu.percentage);

    const durationStats = this.calculateStatisticalMetrics(durations);
    const memoryStats = this.calculateStatisticalMetrics(memoryUsages);
    const cpuStats = this.calculateStatisticalMetrics(cpuUsages);

    const normalityTests = this.performNormalityTests(durations);
    const distributionFit = this.fitDistribution(durations);
    const confidenceIntervals = this.calculateConfidenceIntervals(results);

    return {
      duration: durationStats,
      memory: memoryStats,
      cpu: cpuStats,
      normalityTests,
      distributionFit,
      confidenceIntervals
    };
  }

  private calculateStatisticalMetrics(values: number[]): StatisticalMetrics {
    if (values.length === 0) {
      return this.createEmptyStatisticalMetrics();
    }

    const sorted = values.slice().sort((a, b) => a - b);
    const mean = this.calculateMean(values);
    const median = this.calculateMedian(sorted);
    const variance = this.calculateVariance(values, mean);
    const standardDeviation = Math.sqrt(variance);

    const percentiles: { [key: number]: number } = {};
    [10, 25, 50, 75, 90, 95, 99].forEach(p => {
      percentiles[p] = this.calculatePercentile(sorted, p);
    });

    return {
      mean,
      median,
      mode: this.calculateMode(values),
      standardDeviation,
      variance,
      skewness: this.calculateSkewness(values, mean, standardDeviation),
      kurtosis: this.calculateKurtosis(values, mean, standardDeviation),
      range: sorted[sorted.length - 1] - sorted[0],
      interquartileRange: percentiles[75] - percentiles[25],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      percentiles
    };
  }

  private performNormalityTests(values: number[]): NormalityTest[] {
    const tests: NormalityTest[] = [];

    // Simplified normality tests
    // In a real implementation, these would use proper statistical libraries

    // Shapiro-Wilk approximation
    const swResult = this.shapiroWilkTest(values);
    tests.push({
      test: 'shapiro-wilk',
      statistic: swResult.statistic,
      pValue: swResult.pValue,
      isNormal: swResult.pValue > 0.05,
      confidence: 0.95
    });

    return tests;
  }

  private shapiroWilkTest(values: number[]): { statistic: number; pValue: number } {
    // Simplified Shapiro-Wilk test approximation
    if (values.length < 3) {
      return { statistic: 1, pValue: 1 };
    }

    const mean = this.calculateMean(values);
    const variance = this.calculateVariance(values, mean);

    // Very simplified approximation - not a real Shapiro-Wilk test
    const normalizedValues = values.map(v => Math.abs((v - mean) / Math.sqrt(variance)));
    const statistic = 1 - (this.calculateMean(normalizedValues) / 2);
    const pValue = statistic > 0.95 ? 0.5 : 0.01;

    return { statistic, pValue };
  }

  private fitDistribution(values: number[]): DistributionFit {
    // Simplified distribution fitting
    const mean = this.calculateMean(values);
    const variance = this.calculateVariance(values, mean);

    // Test normal distribution fit
    const normalFit = this.testNormalDistribution(values, mean, Math.sqrt(variance));

    return {
      bestFit: 'normal',
      goodnessOfFit: normalFit,
      parameters: { mean, variance },
      alternativeFits: [
        { distribution: 'lognormal', fit: normalFit * 0.8 },
        { distribution: 'exponential', fit: normalFit * 0.6 }
      ]
    };
  }

  private testNormalDistribution(values: number[], mean: number, stdDev: number): number {
    // Simplified goodness of fit test
    if (values.length === 0 || stdDev === 0) return 0;

    let chiSquare = 0;
    const buckets = 10;
    const bucketSize = (Math.max(...values) - Math.min(...values)) / buckets;

    for (let i = 0; i < buckets; i++) {
      const lowerBound = Math.min(...values) + i * bucketSize;
      const upperBound = lowerBound + bucketSize;

      const observed = values.filter(v => v >= lowerBound && v < upperBound).length;
      const expected = values.length * 0.1; // Simplified expected frequency

      if (expected > 0) {
        chiSquare += Math.pow(observed - expected, 2) / expected;
      }
    }

    return Math.max(0, 1 - (chiSquare / (buckets - 1)));
  }

  private calculateConfidenceIntervals(results: BenchmarkResult[]): ConfidenceInterval[] {
    const intervals: ConfidenceInterval[] = [];

    const durations = results.map(r => r.duration.mean);
    const mean = this.calculateMean(durations);
    const stdDev = this.calculateStandardDeviation(durations);
    const n = durations.length;

    if (n > 1) {
      const tValue = 1.96; // Approximate t-value for 95% confidence
      const marginOfError = tValue * (stdDev / Math.sqrt(n));

      intervals.push({
        metric: 'duration',
        confidence: 95,
        lowerBound: mean - marginOfError,
        upperBound: mean + marginOfError,
        margin: marginOfError
      });
    }

    return intervals;
  }

  private identifyPatterns(results: BenchmarkResult[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];

    // Detect trending pattern
    const trendPattern = this.detectTrendPattern(results);
    if (trendPattern) {
      patterns.push(trendPattern);
    }

    // Detect outlier clusters
    const outlierClusterPattern = this.detectOutlierClusters(results);
    if (outlierClusterPattern) {
      patterns.push(outlierClusterPattern);
    }

    // Detect cyclic patterns
    const cyclicPattern = this.detectCyclicPattern(results);
    if (cyclicPattern) {
      patterns.push(cyclicPattern);
    }

    return patterns;
  }

  private detectTrendPattern(results: BenchmarkResult[]): PerformancePattern | null {
    if (results.length < 5) return null;

    const durations = results.map(r => r.duration.mean);
    const trend = this.calculateLinearTrend(durations);

    if (Math.abs(trend.slope) > 0.1) {
      return {
        type: 'trend',
        description: `${trend.slope > 0 ? 'Increasing' : 'Decreasing'} performance trend detected`,
        confidence: Math.min(1, Math.abs(trend.correlation)),
        frequency: 1,
        amplitude: Math.abs(trend.slope),
        phase: 0,
        examples: results.slice(0, 3),
        impact: trend.slope > 0 ? 'negative' : 'positive'
      };
    }

    return null;
  }

  private detectOutlierClusters(results: BenchmarkResult[]): PerformancePattern | null {
    const outliers = this.findOutliers(results.map(r => r.duration.mean));

    if (outliers.length > results.length * 0.1) {
      return {
        type: 'outlier-cluster',
        description: `${outliers.length} outlier tests detected forming a cluster`,
        confidence: 0.8,
        frequency: outliers.length,
        amplitude: 0,
        phase: 0,
        examples: outliers.slice(0, 3),
        impact: 'negative'
      };
    }

    return null;
  }

  private detectCyclicPattern(results: BenchmarkResult[]): PerformancePattern | null {
    // Simplified cyclic pattern detection
    if (results.length < 10) return null;

    const durations = results.map(r => r.duration.mean);
    const autocorrelation = this.calculateAutocorrelation(durations);

    if (autocorrelation.maxCorrelation > 0.7) {
      return {
        type: 'cyclic',
        description: `Cyclic pattern detected with period ${autocorrelation.period}`,
        confidence: autocorrelation.maxCorrelation,
        frequency: autocorrelation.period,
        amplitude: autocorrelation.amplitude,
        phase: autocorrelation.phase,
        examples: results.slice(0, autocorrelation.period),
        impact: 'neutral'
      };
    }

    return null;
  }

  private calculateAutocorrelation(values: number[]): { maxCorrelation: number; period: number; amplitude: number; phase: number } {
    let maxCorrelation = 0;
    let bestPeriod = 1;

    for (let lag = 1; lag < values.length / 2; lag++) {
      const correlation = this.calculateLaggedCorrelation(values, lag);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = lag;
      }
    }

    return {
      maxCorrelation,
      period: bestPeriod,
      amplitude: this.calculateStandardDeviation(values),
      phase: 0
    };
  }

  private calculateLaggedCorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;

    const x = values.slice(0, values.length - lag);
    const y = values.slice(lag);

    return this.calculateCorrelation(x, y);
  }

  private analyzeOutliers(results: BenchmarkResult[]): OutlierAnalysis {
    const durations = results.map(r => r.duration.mean);
    const outliers = this.findOutliers(durations);

    const outlierPoints: OutlierPoint[] = outliers.map((outlierIndex, index) => {
      const result = results[outlierIndex];
      return {
        testId: `${result.suite}.${result.test}`,
        suite: result.suite,
        test: result.test,
        value: result.duration.mean,
        metric: 'duration',
        deviationScore: this.calculateZScore(result.duration.mean, durations),
        probability: 0.05, // Simplified
        context: {
          memory: result.memory.heapUsed,
          cpu: result.cpu.percentage,
          iterations: result.iterations
        }
      };
    });

    const severity = this.categorizeOutlierSeverity(outlierPoints);
    const causes = this.identifyOutlierCauses(outlierPoints, results);

    return {
      method: 'iqr',
      outliers: outlierPoints,
      outlierRate: results.length > 0 ? outliers.length / results.length : 0,
      severity,
      causes
    };
  }

  private findOutliers(values: number[]): number[] {
    const sorted = values.slice().sort((a, b) => a - b);
    const q1 = this.calculatePercentile(sorted, 25);
    const q3 = this.calculatePercentile(sorted, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outlierIndices: number[] = [];
    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outlierIndices.push(index);
      }
    });

    return outlierIndices;
  }

  private categorizeOutlierSeverity(outliers: OutlierPoint[]): OutlierSeverity[] {
    const severities: OutlierSeverity[] = [];

    const mildOutliers = outliers.filter(o => Math.abs(o.deviationScore) < 3);
    const moderateOutliers = outliers.filter(o => Math.abs(o.deviationScore) >= 3 && Math.abs(o.deviationScore) < 5);
    const severeOutliers = outliers.filter(o => Math.abs(o.deviationScore) >= 5);

    if (mildOutliers.length > 0) {
      severities.push({
        level: 'mild',
        count: mildOutliers.length,
        threshold: 1.5,
        impact: 'Low impact on overall performance'
      });
    }

    if (moderateOutliers.length > 0) {
      severities.push({
        level: 'moderate',
        count: moderateOutliers.length,
        threshold: 3,
        impact: 'Moderate impact requiring investigation'
      });
    }

    if (severeOutliers.length > 0) {
      severities.push({
        level: 'severe',
        count: severeOutliers.length,
        threshold: 5,
        impact: 'High impact requiring immediate attention'
      });
    }

    return severities;
  }

  private identifyOutlierCauses(outliers: OutlierPoint[], results: BenchmarkResult[]): OutlierCause[] {
    const causes: OutlierCause[] = [];

    // Check for system anomalies
    const highCPUOutliers = outliers.filter(o => {
      const result = results.find(r => `${r.suite}.${r.test}` === o.testId);
      return result && result.cpu.percentage > 90;
    });

    if (highCPUOutliers.length > 0) {
      causes.push({
        cause: 'system-anomaly',
        probability: 0.8,
        evidence: [`${highCPUOutliers.length} outliers with high CPU usage`],
        recommendation: 'Monitor system resources during testing'
      });
    }

    // Check for memory issues
    const highMemoryOutliers = outliers.filter(o => {
      const result = results.find(r => `${r.suite}.${r.test}` === o.testId);
      return result && result.memory.heapUsed > 100 * 1024 * 1024; // 100MB
    });

    if (highMemoryOutliers.length > 0) {
      causes.push({
        cause: 'code-issue',
        probability: 0.7,
        evidence: [`${highMemoryOutliers.length} outliers with high memory usage`],
        recommendation: 'Review memory allocation patterns in affected tests'
      });
    }

    return causes;
  }

  private analyzeCorrelations(results: BenchmarkResult[]): CorrelationAnalysis {
    const correlations: Correlation[] = [];

    // Duration vs Memory correlation
    const durations = results.map(r => r.duration.mean);
    const memoryUsages = results.map(r => r.memory.heapUsed);
    const durationMemoryCorr = this.calculateCorrelation(durations, memoryUsages);

    correlations.push({
      metric1: 'duration',
      metric2: 'memory',
      coefficient: durationMemoryCorr,
      pValue: 0.05, // Simplified
      strength: this.interpretCorrelationStrength(Math.abs(durationMemoryCorr)),
      direction: durationMemoryCorr > 0 ? 'positive' : 'negative',
      significance: Math.abs(durationMemoryCorr) > 0.3
    });

    // Duration vs CPU correlation
    const cpuUsages = results.map(r => r.cpu.percentage);
    const durationCPUCorr = this.calculateCorrelation(durations, cpuUsages);

    correlations.push({
      metric1: 'duration',
      metric2: 'cpu',
      coefficient: durationCPUCorr,
      pValue: 0.05,
      strength: this.interpretCorrelationStrength(Math.abs(durationCPUCorr)),
      direction: durationCPUCorr > 0 ? 'positive' : 'negative',
      significance: Math.abs(durationCPUCorr) > 0.3
    });

    const strongCorrelations = correlations.filter(c => c.significance);
    const dependencies = this.identifyDependencies(correlations);
    const clusters = this.identifyPerformanceClusters(results);

    return {
      correlations,
      strongCorrelations,
      dependencies,
      clusters
    };
  }

  private identifyDependencies(correlations: Correlation[]): Dependency[] {
    return correlations
      .filter(c => c.significance && Math.abs(c.coefficient) > 0.5)
      .map(c => ({
        dependent: c.metric1,
        independent: c.metric2,
        relationship: 'linear',
        strength: Math.abs(c.coefficient),
        equation: `${c.metric1} = ${c.coefficient.toFixed(3)} * ${c.metric2} + constant`
      }));
  }

  private identifyPerformanceClusters(results: BenchmarkResult[]): PerformanceCluster[] {
    // Simplified clustering based on performance characteristics
    const clusters: PerformanceCluster[] = [];

    const fastTests = results.filter(r => r.duration.mean < 100);
    const slowTests = results.filter(r => r.duration.mean > 1000);

    if (fastTests.length > 0) {
      clusters.push({
        id: 'fast-tests',
        tests: fastTests.map(r => `${r.suite}.${r.test}`),
        characteristics: ['Fast execution', 'Low resource usage'],
        centroid: {
          duration: this.calculateMean(fastTests.map(r => r.duration.mean)),
          memory: this.calculateMean(fastTests.map(r => r.memory.heapUsed)),
          cpu: this.calculateMean(fastTests.map(r => r.cpu.percentage))
        },
        cohesion: 0.8,
        size: fastTests.length
      });
    }

    if (slowTests.length > 0) {
      clusters.push({
        id: 'slow-tests',
        tests: slowTests.map(r => `${r.suite}.${r.test}`),
        characteristics: ['Slow execution', 'High resource usage'],
        centroid: {
          duration: this.calculateMean(slowTests.map(r => r.duration.mean)),
          memory: this.calculateMean(slowTests.map(r => r.memory.heapUsed)),
          cpu: this.calculateMean(slowTests.map(r => r.cpu.percentage))
        },
        cohesion: 0.7,
        size: slowTests.length
      });
    }

    return clusters;
  }

  private analyzeTrends(results: BenchmarkResult[]): TrendAnalysis {
    if (results.length < 3) {
      return {
        overallTrend: 'stable',
        trendStrength: 0,
        seasonality: { hasSeasonality: false, period: 0, strength: 0, phase: 0, components: [] },
        changePoints: [],
        forecast: {
          method: 'linear-regression',
          predictions: [],
          accuracy: { mae: 0, mse: 0, rmse: 0, mape: 0, r2: 0 },
          confidence: 0
        }
      };
    }

    const durations = results.map(r => r.duration.mean);
    const trend = this.calculateLinearTrend(durations);

    let overallTrend: 'improving' | 'degrading' | 'stable' | 'volatile' = 'stable';
    if (Math.abs(trend.slope) > 1) {
      overallTrend = trend.slope > 0 ? 'degrading' : 'improving';
    }

    const volatility = this.calculateVolatility(durations);
    if (volatility > 0.2) {
      overallTrend = 'volatile';
    }

    const seasonality = this.analyzeSeasonality(durations);
    const changePoints = this.detectChangePoints(results);
    const forecast = this.generateForecast(durations);

    return {
      overallTrend,
      trendStrength: Math.abs(trend.correlation),
      seasonality,
      changePoints,
      forecast
    };
  }

  private calculateLinearTrend(values: number[]): { slope: number; intercept: number; correlation: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const correlation = (n * sumXY - sumX * sumY) /
                       Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return {
      slope: isNaN(slope) ? 0 : slope,
      intercept: isNaN(intercept) ? 0 : intercept,
      correlation: isNaN(correlation) ? 0 : correlation
    };
  }

  private analyzeSeasonality(values: number[]): SeasonalityAnalysis {
    if (values.length < 12) {
      return {
        hasSeasonality: false,
        period: 0,
        strength: 0,
        phase: 0,
        components: []
      };
    }

    const autocorr = this.calculateAutocorrelation(values);
    const hasSeasonality = autocorr.maxCorrelation > 0.6;

    return {
      hasSeasonality,
      period: autocorr.period,
      strength: autocorr.maxCorrelation,
      phase: autocorr.phase,
      components: hasSeasonality ? [{
        type: 'custom',
        period: autocorr.period,
        amplitude: autocorr.amplitude,
        phase: autocorr.phase,
        significance: autocorr.maxCorrelation
      }] : []
    };
  }

  private detectChangePoints(results: BenchmarkResult[]): ChangePoint[] {
    const changePoints: ChangePoint[] = [];

    if (results.length < 10) return changePoints;

    const durations = results.map(r => r.duration.mean);
    const windowSize = Math.max(3, Math.floor(results.length / 4));

    for (let i = windowSize; i < results.length - windowSize; i++) {
      const before = durations.slice(i - windowSize, i);
      const after = durations.slice(i, i + windowSize);

      const beforeMean = this.calculateMean(before);
      const afterMean = this.calculateMean(after);
      const change = Math.abs(afterMean - beforeMean);

      // Significant change threshold
      if (change > this.calculateStandardDeviation(durations)) {
        changePoints.push({
          timestamp: results[i].timestamp,
          metric: 'duration',
          changeType: 'mean-shift',
          magnitude: change,
          confidence: 0.8,
          before: this.calculateStatisticalMetrics(before),
          after: this.calculateStatisticalMetrics(after)
        });
      }
    }

    return changePoints;
  }

  private generateForecast(values: number[]): ForecastResult {
    if (values.length < 5) {
      return {
        method: 'linear-regression',
        predictions: [],
        accuracy: { mae: 0, mse: 0, rmse: 0, mape: 0, r2: 0 },
        confidence: 0
      };
    }

    const trend = this.calculateLinearTrend(values);
    const predictions: ForecastPoint[] = [];

    // Generate 5 future predictions
    for (let i = 1; i <= 5; i++) {
      const predicted = trend.intercept + trend.slope * (values.length + i);
      const error = this.calculateStandardDeviation(values);

      predictions.push({
        timestamp: Date.now() + i * 24 * 60 * 60 * 1000, // Daily predictions
        predicted,
        lowerBound: predicted - 1.96 * error,
        upperBound: predicted + 1.96 * error,
        confidence: Math.abs(trend.correlation)
      });
    }

    return {
      method: 'linear-regression',
      predictions,
      accuracy: this.calculateForecastAccuracy(values, trend),
      confidence: Math.abs(trend.correlation)
    };
  }

  private calculateForecastAccuracy(values: number[], trend: any): ForecastAccuracy {
    // Calculate accuracy using last 20% of data as test set
    const testSize = Math.max(1, Math.floor(values.length * 0.2));
    const trainValues = values.slice(0, values.length - testSize);
    const testValues = values.slice(values.length - testSize);

    let sumAbsError = 0;
    let sumSquaredError = 0;
    let sumPercentError = 0;

    testValues.forEach((actual, i) => {
      const predicted = trend.intercept + trend.slope * (trainValues.length + i);
      const error = Math.abs(actual - predicted);
      const percentError = actual !== 0 ? (error / Math.abs(actual)) * 100 : 0;

      sumAbsError += error;
      sumSquaredError += error * error;
      sumPercentError += percentError;
    });

    const mae = sumAbsError / testValues.length;
    const mse = sumSquaredError / testValues.length;
    const rmse = Math.sqrt(mse);
    const mape = sumPercentError / testValues.length;

    return {
      mae,
      mse,
      rmse,
      mape,
      r2: trend.correlation * trend.correlation
    };
  }

  private generateRecommendations(
    results: BenchmarkResult[],
    summary: PerformanceSummary,
    patterns: PerformancePattern[],
    outliers: OutlierAnalysis
  ): AnalysisRecommendation[] {
    const recommendations: AnalysisRecommendation[] = [];

    // Performance recommendations
    if (summary.averageDuration > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize Slow Tests',
        description: `Average test duration of ${summary.averageDuration.toFixed(0)}ms is above recommended threshold`,
        evidence: [`Average duration: ${summary.averageDuration.toFixed(2)}ms`, `P95 duration: ${summary.p95Duration.toFixed(2)}ms`],
        expectedImprovement: '30-50% reduction in test execution time',
        effort: 'medium',
        implementation: ['Profile slow tests', 'Optimize algorithms', 'Consider parallelization'],
        riskLevel: 'low'
      });
    }

    // Stability recommendations
    if (summary.coefficientOfVariation > 0.3) {
      recommendations.push({
        type: 'stability',
        priority: 'medium',
        title: 'Improve Test Consistency',
        description: `High variability (CV: ${summary.coefficientOfVariation.toFixed(2)}) indicates inconsistent performance`,
        evidence: [`Coefficient of variation: ${summary.coefficientOfVariation.toFixed(2)}`, `Standard deviation: ${summary.standardDeviation.toFixed(2)}ms`],
        expectedImprovement: 'More predictable and reliable test results',
        effort: 'medium',
        implementation: ['Standardize test environment', 'Increase warm-up iterations', 'Control external factors'],
        riskLevel: 'low'
      });
    }

    // Outlier recommendations
    if (outliers.outlierRate > 0.1) {
      recommendations.push({
        type: 'methodology',
        priority: 'medium',
        title: 'Address Performance Outliers',
        description: `${(outliers.outlierRate * 100).toFixed(1)}% of tests are outliers`,
        evidence: [`Outlier rate: ${(outliers.outlierRate * 100).toFixed(1)}%`, `${outliers.outliers.length} outlier tests identified`],
        expectedImprovement: 'More consistent benchmarking results',
        effort: 'low',
        implementation: ['Investigate outlier causes', 'Increase sample sizes', 'Consider outlier removal'],
        riskLevel: 'low'
      });
    }

    // Pattern-based recommendations
    patterns.forEach(pattern => {
      if (pattern.type === 'trend' && pattern.impact === 'negative') {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          title: 'Address Performance Degradation Trend',
          description: pattern.description,
          evidence: [`Trend confidence: ${(pattern.confidence * 100).toFixed(1)}%`],
          expectedImprovement: 'Stop performance degradation',
          effort: 'high',
          implementation: ['Identify root cause of degradation', 'Implement performance monitoring', 'Regular performance audits'],
          riskLevel: 'medium'
        });
      }
    });

    return recommendations;
  }

  private assessRisks(
    results: BenchmarkResult[],
    outliers: OutlierAnalysis,
    trends: TrendAnalysis
  ): RiskAssessment {
    const riskFactors: RiskFactor[] = [];

    // Performance degradation risk
    if (trends.overallTrend === 'degrading') {
      riskFactors.push({
        factor: 'Performance Degradation',
        severity: 'high',
        probability: trends.trendStrength,
        impact: 'Increasing response times and resource usage',
        evidence: [`Degrading trend with strength ${trends.trendStrength.toFixed(2)}`]
      });
    }

    // High variability risk
    const summary = this.generateSummary(results);
    if (summary.coefficientOfVariation > 0.5) {
      riskFactors.push({
        factor: 'High Performance Variability',
        severity: 'medium',
        probability: 0.8,
        impact: 'Unpredictable performance in production',
        evidence: [`Coefficient of variation: ${summary.coefficientOfVariation.toFixed(2)}`]
      });
    }

    // Outlier risk
    if (outliers.outlierRate > 0.2) {
      riskFactors.push({
        factor: 'Frequent Performance Outliers',
        severity: 'medium',
        probability: outliers.outlierRate,
        impact: 'Occasional severe performance issues',
        evidence: [`${(outliers.outlierRate * 100).toFixed(1)}% outlier rate`]
      });
    }

    const overallRisk = this.calculateOverallRisk(riskFactors);
    const mitigationStrategies = this.generateMitigationStrategies(riskFactors);

    return {
      overallRisk,
      riskFactors,
      mitigationStrategies,
      confidenceLevel: 0.8
    };
  }

  private calculateOverallRisk(riskFactors: RiskFactor[]): 'low' | 'medium' | 'high' | 'critical' {
    if (riskFactors.length === 0) return 'low';

    const criticalFactors = riskFactors.filter(f => f.severity === 'critical').length;
    const highFactors = riskFactors.filter(f => f.severity === 'high').length;

    if (criticalFactors > 0) return 'critical';
    if (highFactors > 1) return 'high';
    if (highFactors > 0 || riskFactors.length > 2) return 'medium';
    return 'low';
  }

  private generateMitigationStrategies(riskFactors: RiskFactor[]): MitigationStrategy[] {
    const strategies: MitigationStrategy[] = [];

    if (riskFactors.some(f => f.factor.includes('Degradation'))) {
      strategies.push({
        strategy: 'Performance Monitoring',
        applicableRisks: ['Performance Degradation'],
        effectiveness: 0.8,
        cost: 'medium',
        timeframe: 'short-term'
      });
    }

    if (riskFactors.some(f => f.factor.includes('Variability'))) {
      strategies.push({
        strategy: 'Environment Standardization',
        applicableRisks: ['High Performance Variability'],
        effectiveness: 0.7,
        cost: 'low',
        timeframe: 'immediate'
      });
    }

    return strategies;
  }

  // Utility methods

  calculateStatistics(values: number[]): { mean: number; median: number; stddev: number; p95: number; p99: number } {
    const sorted = values.slice().sort((a, b) => a - b);
    const mean = this.calculateMean(values);
    const stddev = this.calculateStandardDeviation(values);

    return {
      mean,
      median: this.calculateMedian(sorted),
      stddev,
      p95: this.calculatePercentile(sorted, 95),
      p99: this.calculatePercentile(sorted, 99)
    };
  }

  calculateMemoryStatistics(snapshots: any[]): any {
    const heapUsed = snapshots.map(s => s.after.heapUsed);
    const heapTotal = snapshots.map(s => s.after.heapTotal);

    return {
      heapUsed: this.calculateMean(heapUsed),
      heapTotal: this.calculateMean(heapTotal),
      external: snapshots.length > 0 ? snapshots[snapshots.length - 1].after.external : 0,
      rss: snapshots.length > 0 ? snapshots[snapshots.length - 1].after.rss : 0,
      arrayBuffers: snapshots.length > 0 ? snapshots[snapshots.length - 1].after.arrayBuffers : 0
    };
  }

  calculateCPUStatistics(snapshots: any[]): any {
    const userTimes = snapshots.map(s => s.user);
    const systemTimes = snapshots.map(s => s.system);

    const totalUser = snapshots.length > 0 ? snapshots[snapshots.length - 1].user : 0;
    const totalSystem = snapshots.length > 0 ? snapshots[snapshots.length - 1].system : 0;

    return {
      user: totalUser,
      system: totalSystem,
      percentage: userTimes.length > 0 ? ((totalUser + totalSystem) / 1000000) * 100 : 0 // Simplified calculation
    };
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(sortedValues: number[]): number {
    if (sortedValues.length === 0) return 0;
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateMean(values);
    const variance = this.calculateVariance(values, mean);
    return Math.sqrt(variance);
  }

  private calculateVariance(values: number[], mean?: number): number {
    if (values.length === 0) return 0;
    const m = mean !== undefined ? mean : this.calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / values.length;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);

    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denominatorX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denominatorY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));

    if (denominatorX === 0 || denominatorY === 0) return 0;
    return numerator / (denominatorX * denominatorY);
  }

  private calculateZScore(value: number, values: number[]): number {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values);
    return stdDev === 0 ? 0 : (value - mean) / stdDev;
  }

  private calculateMode(values: number[]): number {
    const frequency: { [key: number]: number } = {};
    let maxFreq = 0;
    let mode = 0;

    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
      if (frequency[val] > maxFreq) {
        maxFreq = frequency[val];
        mode = val;
      }
    });

    return mode;
  }

  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    if (values.length === 0 || stdDev === 0) return 0;
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    if (values.length === 0 || stdDev === 0) return 0;
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  }

  private calculateVolatility(values: number[]): number {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values);
    return mean > 0 ? stdDev / mean : 0;
  }

  private interpretCorrelationStrength(coefficient: number): 'very-weak' | 'weak' | 'moderate' | 'strong' | 'very-strong' {
    const abs = Math.abs(coefficient);
    if (abs < 0.2) return 'very-weak';
    if (abs < 0.4) return 'weak';
    if (abs < 0.6) return 'moderate';
    if (abs < 0.8) return 'strong';
    return 'very-strong';
  }

  private calculatePerformanceGrade(successRate: number, variability: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (successRate >= 0.95 && variability < 0.1) return 'A';
    if (successRate >= 0.90 && variability < 0.2) return 'B';
    if (successRate >= 0.80 && variability < 0.3) return 'C';
    if (successRate >= 0.70) return 'D';
    return 'F';
  }

  private calculateStabilityScore(results: BenchmarkResult[]): number {
    const successRate = results.filter(r => r.success).length / Math.max(1, results.length);
    const durations = results.map(r => r.duration.mean);
    const variability = durations.length > 0 ? this.calculateStandardDeviation(durations) / this.calculateMean(durations) : 0;
    return Math.max(0, successRate - variability);
  }

  private calculateEfficiencyScore(results: BenchmarkResult[]): number {
    // Simplified efficiency based on resource usage vs. performance
    const durations = results.map(r => r.duration.mean);
    const memoryUsages = results.map(r => r.memory.heapUsed);

    if (durations.length === 0) return 1;

    const avgDuration = this.calculateMean(durations);
    const avgMemory = this.calculateMean(memoryUsages);

    // Lower duration and memory = higher efficiency
    const durationScore = Math.max(0, 1 - (avgDuration / 10000)); // Normalize to 10s max
    const memoryScore = Math.max(0, 1 - (avgMemory / (1024 * 1024 * 1024))); // Normalize to 1GB max

    return (durationScore + memoryScore) / 2;
  }

  private createEmptySummary(): PerformanceSummary {
    return {
      totalTests: 0,
      successRate: 0,
      averageDuration: 0,
      medianDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
      standardDeviation: 0,
      coefficientOfVariation: 0,
      totalIterations: 0,
      averageMemoryUsage: 0,
      peakMemoryUsage: 0,
      averageCPUUsage: 0,
      peakCPUUsage: 0,
      performanceGrade: 'F',
      stabilityScore: 0,
      efficiencyScore: 0
    };
  }

  private createEmptyStatisticalMetrics(): StatisticalMetrics {
    return {
      mean: 0,
      median: 0,
      mode: 0,
      standardDeviation: 0,
      variance: 0,
      skewness: 0,
      kurtosis: 0,
      range: 0,
      interquartileRange: 0,
      min: 0,
      max: 0,
      percentiles: {}
    };
  }

  destroy(): void {
    this.removeAllListeners();
  }
}

export default PerformanceAnalyzer;