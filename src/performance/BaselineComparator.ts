import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkResult } from './PerformanceBenchmarker';
import { EventEmitter } from 'events';

export interface ComparisonResult {
  current: BenchmarkResult[];
  baseline: BenchmarkResult[];
  comparisons: TestComparison[];
  summary: ComparisonSummary;
  regressions: RegressionResult[];
  improvements: ImprovementResult[];
  analysis: ComparisonAnalysis;
  recommendations: ComparisonRecommendation[];
}

export interface TestComparison {
  testKey: string;
  suite: string;
  test: string;
  current: BenchmarkResult;
  baseline: BenchmarkResult;
  metrics: MetricComparison[];
  overall: OverallComparison;
  significance: SignificanceTest;
}

export interface MetricComparison {
  metric: string;
  currentValue: number;
  baselineValue: number;
  absoluteChange: number;
  percentageChange: number;
  isRegression: boolean;
  isImprovement: boolean;
  significance: 'low' | 'medium' | 'high' | 'critical';
  confidenceLevel: number;
}

export interface OverallComparison {
  status: 'regression' | 'improvement' | 'neutral' | 'mixed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  primaryConcern: string;
  impactScore: number; // 0-1
}

export interface SignificanceTest {
  test: 'welch-t-test' | 'mann-whitney' | 'bootstrap';
  statistic: number;
  pValue: number;
  isSignificant: boolean;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
}

export interface ComparisonSummary {
  totalTests: number;
  regressions: number;
  improvements: number;
  neutral: number;
  mixed: number;
  overallStatus: 'regression' | 'improvement' | 'neutral' | 'mixed';
  avgPerformanceChange: number;
  avgMemoryChange: number;
  avgCPUChange: number;
  significantChanges: number;
  criticalIssues: number;
}

export interface RegressionResult {
  testKey: string;
  suite: string;
  test: string;
  metric: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  percentageChange: number;
  absoluteChange: number;
  currentValue: number;
  baselineValue: number;
  impact: string;
  recommendation: string;
  confidenceLevel: number;
}

export interface ImprovementResult {
  testKey: string;
  suite: string;
  test: string;
  metric: string;
  percentageChange: number;
  absoluteChange: number;
  currentValue: number;
  baselineValue: number;
  benefit: string;
  sustainabilityRisk: 'low' | 'medium' | 'high';
}

export interface ComparisonAnalysis {
  performanceTrends: PerformanceTrend[];
  resourceUsageTrends: ResourceUsageTrend[];
  stabilityChanges: StabilityChange[];
  distributionShifts: DistributionShift[];
  correlationChanges: CorrelationChange[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  magnitude: number;
  consistency: number; // 0-1, how consistent the trend is across tests
  affectedTests: string[];
  projectedImpact: string;
}

export interface ResourceUsageTrend {
  resource: 'memory' | 'cpu' | 'network';
  trend: 'increasing' | 'decreasing' | 'stable';
  averageChange: number;
  peakChange: number;
  efficiency: 'improved' | 'degraded' | 'stable';
  concerns: string[];
}

export interface StabilityChange {
  metric: string;
  variabilityChange: number;
  outlierRateChange: number;
  consistencyChange: number;
  stabilityImpact: 'positive' | 'negative' | 'neutral';
}

export interface DistributionShift {
  metric: string;
  shiftType: 'mean-shift' | 'variance-change' | 'shape-change' | 'outlier-increase';
  magnitude: number;
  significance: number;
  interpretation: string;
}

export interface CorrelationChange {
  metric1: string;
  metric2: string;
  baselineCorrelation: number;
  currentCorrelation: number;
  correlationChange: number;
  significance: number;
  interpretation: string;
}

export interface ComparisonRecommendation {
  type: 'regression-fix' | 'improvement-maintain' | 'stability-improve' | 'methodology-adjust';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedTests: string[];
  evidence: string[];
  actionItems: string[];
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
}

export interface BaselineConfig {
  thresholds: ComparisonThresholds;
  methods: ComparisonMethods;
  filters: ComparisonFilters;
}

export interface ComparisonThresholds {
  regressionThreshold: number; // Percentage change to consider regression
  improvementThreshold: number; // Percentage change to consider improvement
  significanceLevel: number; // Statistical significance level
  minSampleSize: number; // Minimum iterations for comparison
  outlierThreshold: number; // Z-score threshold for outlier detection
}

export interface ComparisonMethods {
  statisticalTest: 'welch-t-test' | 'mann-whitney' | 'bootstrap' | 'auto';
  multipleTestingCorrection: 'bonferroni' | 'benjamini-hochberg' | 'none';
  effectSizeCalculation: 'cohen-d' | 'glass-delta' | 'hedges-g';
  confidenceLevel: number;
}

export interface ComparisonFilters {
  excludeFailedTests: boolean;
  minIterations: number;
  maxVariability: number; // Maximum coefficient of variation
  onlySignificantChanges: boolean;
}

export class BaselineComparator extends EventEmitter {
  private config: BaselineConfig;

  constructor(config?: Partial<BaselineConfig>) {
    super();
    this.config = this.mergeWithDefaults(config);
  }

  private mergeWithDefaults(config?: Partial<BaselineConfig>): BaselineConfig {
    return {
      thresholds: {
        regressionThreshold: 10, // 10% regression threshold
        improvementThreshold: -10, // 10% improvement threshold
        significanceLevel: 0.05,
        minSampleSize: 5,
        outlierThreshold: 3.0,
        ...config?.thresholds
      },
      methods: {
        statisticalTest: 'auto',
        multipleTestingCorrection: 'benjamini-hochberg',
        effectSizeCalculation: 'cohen-d',
        confidenceLevel: 0.95,
        ...config?.methods
      },
      filters: {
        excludeFailedTests: true,
        minIterations: 3,
        maxVariability: 1.0, // 100% coefficient of variation
        onlySignificantChanges: false,
        ...config?.filters
      }
    };
  }

  async compare(
    current: BenchmarkResult[],
    baselineFile: string,
    threshold: number = 0.1
  ): Promise<ComparisonResult> {
    console.log(`Comparing ${current.length} current results with baseline from ${baselineFile}`);
    this.emit('comparison-start', { currentCount: current.length, baselineFile });

    try {
      // Load baseline data
      const baseline = await this.loadBaseline(baselineFile);

      // Filter and match tests
      const { matchedCurrent, matchedBaseline } = this.matchTests(current, baseline);

      console.log(`Matched ${matchedCurrent.length} tests for comparison`);

      // Perform comparisons
      const comparisons = await this.performComparisons(matchedCurrent, matchedBaseline);

      // Generate summary
      const summary = this.generateSummary(comparisons);

      // Identify regressions and improvements
      const regressions = this.identifyRegressions(comparisons);
      const improvements = this.identifyImprovements(comparisons);

      // Perform detailed analysis
      const analysis = this.performAnalysis(comparisons, matchedCurrent, matchedBaseline);

      // Generate recommendations
      const recommendations = this.generateRecommendations(comparisons, regressions, improvements);

      const result: ComparisonResult = {
        current: matchedCurrent,
        baseline: matchedBaseline,
        comparisons,
        summary,
        regressions,
        improvements,
        analysis,
        recommendations
      };

      this.emit('comparison-complete', result);
      return result;

    } catch (error) {
      this.emit('comparison-error', error);
      throw error;
    }
  }

  private async loadBaseline(baselineFile: string): Promise<BenchmarkResult[]> {
    if (!fs.existsSync(baselineFile)) {
      throw new Error(`Baseline file not found: ${baselineFile}`);
    }

    try {
      const fileContent = fs.readFileSync(baselineFile, 'utf8');
      const data = JSON.parse(fileContent);

      // Handle different baseline file formats
      if (Array.isArray(data)) {
        return data as BenchmarkResult[];
      } else if (data.results && Array.isArray(data.results)) {
        return data.results as BenchmarkResult[];
      } else if (data.baseline && Array.isArray(data.baseline)) {
        return data.baseline as BenchmarkResult[];
      } else {
        throw new Error('Invalid baseline file format');
      }
    } catch (error) {
      throw new Error(`Failed to load baseline file: ${error.message}`);
    }
  }

  private matchTests(
    current: BenchmarkResult[],
    baseline: BenchmarkResult[]
  ): { matchedCurrent: BenchmarkResult[]; matchedBaseline: BenchmarkResult[] } {
    const matchedCurrent: BenchmarkResult[] = [];
    const matchedBaseline: BenchmarkResult[] = [];

    current.forEach(currentResult => {
      if (this.config.filters.excludeFailedTests && !currentResult.success) {
        return;
      }

      if (currentResult.iterations < this.config.filters.minIterations) {
        return;
      }

      const testKey = `${currentResult.suite}.${currentResult.test}`;
      const baselineResult = baseline.find(
        b => `${b.suite}.${b.test}` === testKey
      );

      if (baselineResult) {
        if (this.config.filters.excludeFailedTests && !baselineResult.success) {
          return;
        }

        if (baselineResult.iterations < this.config.filters.minIterations) {
          return;
        }

        // Check variability
        const currentCV = currentResult.duration.stddev / currentResult.duration.mean;
        const baselineCV = baselineResult.duration.stddev / baselineResult.duration.mean;

        if (currentCV > this.config.filters.maxVariability || baselineCV > this.config.filters.maxVariability) {
          return;
        }

        matchedCurrent.push(currentResult);
        matchedBaseline.push(baselineResult);
      }
    });

    return { matchedCurrent, matchedBaseline };
  }

  private async performComparisons(
    current: BenchmarkResult[],
    baseline: BenchmarkResult[]
  ): Promise<TestComparison[]> {
    const comparisons: TestComparison[] = [];

    for (let i = 0; i < current.length; i++) {
      const currentResult = current[i];
      const baselineResult = baseline[i];
      const testKey = `${currentResult.suite}.${currentResult.test}`;

      this.emit('comparison-progress', {
        testKey,
        progress: (i + 1) / current.length
      });

      const comparison = await this.compareTests(currentResult, baselineResult, testKey);
      comparisons.push(comparison);
    }

    return comparisons;
  }

  private async compareTests(
    current: BenchmarkResult,
    baseline: BenchmarkResult,
    testKey: string
  ): Promise<TestComparison> {
    // Compare individual metrics
    const metrics = await this.compareMetrics(current, baseline);

    // Perform significance test
    const significance = this.performSignificanceTest(current, baseline);

    // Determine overall comparison result
    const overall = this.determineOverallComparison(metrics, significance);

    return {
      testKey,
      suite: current.suite,
      test: current.test,
      current,
      baseline,
      metrics,
      overall,
      significance
    };
  }

  private async compareMetrics(
    current: BenchmarkResult,
    baseline: BenchmarkResult
  ): Promise<MetricComparison[]> {
    const comparisons: MetricComparison[] = [];

    // Duration comparison
    comparisons.push(this.compareMetric(
      'duration',
      current.duration.mean,
      baseline.duration.mean
    ));

    // Memory comparison
    comparisons.push(this.compareMetric(
      'memory',
      current.memory.heapUsed,
      baseline.memory.heapUsed
    ));

    // CPU comparison
    comparisons.push(this.compareMetric(
      'cpu',
      current.cpu.percentage,
      baseline.cpu.percentage
    ));

    // P95 duration comparison
    comparisons.push(this.compareMetric(
      'p95Duration',
      current.duration.p95,
      baseline.duration.p95
    ));

    // P99 duration comparison
    comparisons.push(this.compareMetric(
      'p99Duration',
      current.duration.p99,
      baseline.duration.p99
    ));

    return comparisons;
  }

  private compareMetric(
    metric: string,
    currentValue: number,
    baselineValue: number
  ): MetricComparison {
    const absoluteChange = currentValue - baselineValue;
    const percentageChange = baselineValue !== 0 ? (absoluteChange / baselineValue) * 100 : 0;

    const isRegression = this.isRegression(metric, percentageChange);
    const isImprovement = this.isImprovement(metric, percentageChange);

    let significance: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (Math.abs(percentageChange) > 50) significance = 'critical';
    else if (Math.abs(percentageChange) > 25) significance = 'high';
    else if (Math.abs(percentageChange) > 10) significance = 'medium';

    return {
      metric,
      currentValue,
      baselineValue,
      absoluteChange,
      percentageChange,
      isRegression,
      isImprovement,
      significance,
      confidenceLevel: 0.95 // Would be calculated from statistical test
    };
  }

  private isRegression(metric: string, percentageChange: number): boolean {
    // For duration and resource metrics, positive change is regression
    if (['duration', 'memory', 'cpu', 'p95Duration', 'p99Duration'].includes(metric)) {
      return percentageChange > this.config.thresholds.regressionThreshold;
    }
    return false;
  }

  private isImprovement(metric: string, percentageChange: number): boolean {
    // For duration and resource metrics, negative change is improvement
    if (['duration', 'memory', 'cpu', 'p95Duration', 'p99Duration'].includes(metric)) {
      return percentageChange < this.config.thresholds.improvementThreshold;
    }
    return false;
  }

  private performSignificanceTest(
    current: BenchmarkResult,
    baseline: BenchmarkResult
  ): SignificanceTest {
    // Simplified significance test - in reality would use proper statistical methods
    const currentMean = current.duration.mean;
    const baselineMean = baseline.duration.mean;
    const currentStd = current.duration.stddev;
    const baselineStd = baseline.duration.stddev;

    // Simplified t-test approximation
    const pooledStd = Math.sqrt(
      ((current.iterations - 1) * currentStd * currentStd +
       (baseline.iterations - 1) * baselineStd * baselineStd) /
      (current.iterations + baseline.iterations - 2)
    );

    const standardError = pooledStd * Math.sqrt(
      1 / current.iterations + 1 / baseline.iterations
    );

    const tStatistic = (currentMean - baselineMean) / standardError;
    const pValue = this.calculatePValue(tStatistic, current.iterations + baseline.iterations - 2);

    const isSignificant = pValue < this.config.methods.confidenceLevel;

    return {
      test: 'welch-t-test',
      statistic: tStatistic,
      pValue,
      isSignificant,
      confidenceInterval: {
        lower: (currentMean - baselineMean) - 1.96 * standardError,
        upper: (currentMean - baselineMean) + 1.96 * standardError,
        confidence: this.config.methods.confidenceLevel
      }
    };
  }

  private calculatePValue(tStatistic: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation
    // In a real implementation, this would use proper statistical functions
    const absT = Math.abs(tStatistic);

    if (absT > 3) return 0.001;
    if (absT > 2.5) return 0.01;
    if (absT > 2) return 0.05;
    if (absT > 1.5) return 0.1;
    return 0.2;
  }

  private determineOverallComparison(
    metrics: MetricComparison[],
    significance: SignificanceTest
  ): OverallComparison {
    const regressions = metrics.filter(m => m.isRegression);
    const improvements = metrics.filter(m => m.isImprovement);
    const criticalIssues = metrics.filter(m => m.significance === 'critical');

    let status: 'regression' | 'improvement' | 'neutral' | 'mixed' = 'neutral';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (criticalIssues.length > 0) {
      severity = 'critical';
      status = criticalIssues.some(m => m.isRegression) ? 'regression' : 'improvement';
    } else if (regressions.length > 0 && improvements.length > 0) {
      status = 'mixed';
      severity = Math.max(...regressions.map(r => this.severityToNumber(r.significance))) > 2 ? 'high' : 'medium';
    } else if (regressions.length > 0) {
      status = 'regression';
      severity = this.numberToSeverity(Math.max(...regressions.map(r => this.severityToNumber(r.significance))));
    } else if (improvements.length > 0) {
      status = 'improvement';
      severity = 'low';
    }

    const primaryConcern = this.identifyPrimaryConcern(metrics);
    const impactScore = this.calculateImpactScore(metrics);

    return {
      status,
      severity,
      confidence: significance.isSignificant ? 0.95 : 0.5,
      primaryConcern,
      impactScore
    };
  }

  private severityToNumber(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 1;
    }
  }

  private numberToSeverity(num: number): 'low' | 'medium' | 'high' | 'critical' {
    if (num >= 4) return 'critical';
    if (num >= 3) return 'high';
    if (num >= 2) return 'medium';
    return 'low';
  }

  private identifyPrimaryConcern(metrics: MetricComparison[]): string {
    const criticalMetrics = metrics.filter(m => m.significance === 'critical');
    if (criticalMetrics.length > 0) {
      const worstMetric = criticalMetrics.reduce((worst, current) =>
        Math.abs(current.percentageChange) > Math.abs(worst.percentageChange) ? current : worst
      );
      return `${worstMetric.metric}: ${worstMetric.percentageChange.toFixed(1)}% change`;
    }

    const regressions = metrics.filter(m => m.isRegression);
    if (regressions.length > 0) {
      const worstRegression = regressions.reduce((worst, current) =>
        current.percentageChange > worst.percentageChange ? current : worst
      );
      return `${worstRegression.metric}: ${worstRegression.percentageChange.toFixed(1)}% regression`;
    }

    return 'No significant concerns';
  }

  private calculateImpactScore(metrics: MetricComparison[]): number {
    // Calculate weighted impact score based on metric importance and change magnitude
    const weights = {
      duration: 0.4,
      p95Duration: 0.3,
      p99Duration: 0.2,
      memory: 0.1,
      cpu: 0.1
    };

    let totalImpact = 0;
    let totalWeight = 0;

    metrics.forEach(metric => {
      const weight = weights[metric.metric as keyof typeof weights] || 0.05;
      const impact = Math.abs(metric.percentageChange) / 100; // Normalize to 0-1
      totalImpact += weight * impact;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.min(1, totalImpact / totalWeight) : 0;
  }

  private generateSummary(comparisons: TestComparison[]): ComparisonSummary {
    const totalTests = comparisons.length;
    const regressions = comparisons.filter(c => c.overall.status === 'regression').length;
    const improvements = comparisons.filter(c => c.overall.status === 'improvement').length;
    const neutral = comparisons.filter(c => c.overall.status === 'neutral').length;
    const mixed = comparisons.filter(c => c.overall.status === 'mixed').length;

    // Calculate average changes
    const durationChanges = comparisons.map(c =>
      c.metrics.find(m => m.metric === 'duration')?.percentageChange || 0
    );
    const memoryChanges = comparisons.map(c =>
      c.metrics.find(m => m.metric === 'memory')?.percentageChange || 0
    );
    const cpuChanges = comparisons.map(c =>
      c.metrics.find(m => m.metric === 'cpu')?.percentageChange || 0
    );

    const avgPerformanceChange = this.calculateMean(durationChanges);
    const avgMemoryChange = this.calculateMean(memoryChanges);
    const avgCPUChange = this.calculateMean(cpuChanges);

    const significantChanges = comparisons.filter(c => c.significance.isSignificant).length;
    const criticalIssues = comparisons.filter(c => c.overall.severity === 'critical').length;

    // Determine overall status
    let overallStatus: 'regression' | 'improvement' | 'neutral' | 'mixed' = 'neutral';
    if (criticalIssues > 0 || regressions > improvements) {
      overallStatus = 'regression';
    } else if (improvements > regressions && improvements > neutral) {
      overallStatus = 'improvement';
    } else if (mixed > 0 || (regressions > 0 && improvements > 0)) {
      overallStatus = 'mixed';
    }

    return {
      totalTests,
      regressions,
      improvements,
      neutral,
      mixed,
      overallStatus,
      avgPerformanceChange,
      avgMemoryChange,
      avgCPUChange,
      significantChanges,
      criticalIssues
    };
  }

  private identifyRegressions(comparisons: TestComparison[]): RegressionResult[] {
    const regressions: RegressionResult[] = [];

    comparisons.forEach(comparison => {
      comparison.metrics.forEach(metric => {
        if (metric.isRegression) {
          regressions.push({
            testKey: comparison.testKey,
            suite: comparison.suite,
            test: comparison.test,
            metric: metric.metric,
            severity: metric.significance,
            percentageChange: metric.percentageChange,
            absoluteChange: metric.absoluteChange,
            currentValue: metric.currentValue,
            baselineValue: metric.baselineValue,
            impact: this.describeRegressionImpact(metric),
            recommendation: this.generateRegressionRecommendation(metric),
            confidenceLevel: metric.confidenceLevel
          });
        }
      });
    });

    return regressions.sort((a, b) => b.percentageChange - a.percentageChange);
  }

  private identifyImprovements(comparisons: TestComparison[]): ImprovementResult[] {
    const improvements: ImprovementResult[] = [];

    comparisons.forEach(comparison => {
      comparison.metrics.forEach(metric => {
        if (metric.isImprovement) {
          improvements.push({
            testKey: comparison.testKey,
            suite: comparison.suite,
            test: comparison.test,
            metric: metric.metric,
            percentageChange: metric.percentageChange,
            absoluteChange: metric.absoluteChange,
            currentValue: metric.currentValue,
            baselineValue: metric.baselineValue,
            benefit: this.describeImprovementBenefit(metric),
            sustainabilityRisk: this.assessSustainabilityRisk(metric)
          });
        }
      });
    });

    return improvements.sort((a, b) => a.percentageChange - b.percentageChange);
  }

  private describeRegressionImpact(metric: MetricComparison): string {
    const change = Math.abs(metric.percentageChange);

    if (metric.metric === 'duration') {
      if (change > 50) return 'Severe performance degradation - users will notice significant slowdown';
      if (change > 25) return 'Moderate performance degradation - noticeable impact on user experience';
      if (change > 10) return 'Minor performance degradation - may affect some user workflows';
      return 'Small performance regression - minimal user impact';
    }

    if (metric.metric === 'memory') {
      if (change > 50) return 'High memory usage increase - potential stability issues';
      if (change > 25) return 'Moderate memory usage increase - monitor for scaling issues';
      if (change > 10) return 'Minor memory usage increase - review for optimization opportunities';
      return 'Small memory usage increase - continue monitoring';
    }

    return `${metric.metric} increased by ${change.toFixed(1)}%`;
  }

  private generateRegressionRecommendation(metric: MetricComparison): string {
    const change = Math.abs(metric.percentageChange);

    if (metric.metric === 'duration') {
      if (change > 50) return 'URGENT: Profile and optimize immediately - consider reverting changes';
      if (change > 25) return 'HIGH PRIORITY: Investigate and optimize performance hotspots';
      if (change > 10) return 'MEDIUM PRIORITY: Review recent changes and identify optimization opportunities';
      return 'LOW PRIORITY: Monitor trend and investigate if pattern continues';
    }

    if (metric.metric === 'memory') {
      if (change > 50) return 'URGENT: Check for memory leaks and optimize allocation patterns';
      if (change > 25) return 'HIGH PRIORITY: Review memory usage patterns and optimize where possible';
      if (change > 10) return 'MEDIUM PRIORITY: Monitor memory trends and investigate gradual increases';
      return 'LOW PRIORITY: Continue monitoring memory usage patterns';
    }

    return `Monitor ${metric.metric} and investigate if trend continues`;
  }

  private describeImprovementBenefit(metric: MetricComparison): string {
    const change = Math.abs(metric.percentageChange);

    if (metric.metric === 'duration') {
      if (change > 50) return 'Significant performance improvement - users will notice faster response times';
      if (change > 25) return 'Notable performance improvement - enhanced user experience';
      if (change > 10) return 'Moderate performance improvement - better overall responsiveness';
      return 'Minor performance improvement - incremental user benefit';
    }

    if (metric.metric === 'memory') {
      if (change > 50) return 'Major memory optimization - improved system stability and scalability';
      if (change > 25) return 'Significant memory reduction - better resource utilization';
      if (change > 10) return 'Moderate memory optimization - improved efficiency';
      return 'Minor memory optimization - marginal efficiency gain';
    }

    return `${metric.metric} improved by ${change.toFixed(1)}%`;
  }

  private assessSustainabilityRisk(metric: MetricComparison): 'low' | 'medium' | 'high' {
    const change = Math.abs(metric.percentageChange);

    // Large improvements might indicate measurement issues or temporary conditions
    if (change > 75) return 'high';
    if (change > 50) return 'medium';
    return 'low';
  }

  private performAnalysis(
    comparisons: TestComparison[],
    current: BenchmarkResult[],
    baseline: BenchmarkResult[]
  ): ComparisonAnalysis {
    const performanceTrends = this.analyzePerformanceTrends(comparisons);
    const resourceUsageTrends = this.analyzeResourceUsageTrends(comparisons);
    const stabilityChanges = this.analyzeStabilityChanges(current, baseline);
    const distributionShifts = this.analyzeDistributionShifts(current, baseline);
    const correlationChanges = this.analyzeCorrelationChanges(current, baseline);

    return {
      performanceTrends,
      resourceUsageTrends,
      stabilityChanges,
      distributionShifts,
      correlationChanges
    };
  }

  private analyzePerformanceTrends(comparisons: TestComparison[]): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];

    const durationChanges = comparisons.map(c =>
      c.metrics.find(m => m.metric === 'duration')?.percentageChange || 0
    );

    const avgChange = this.calculateMean(durationChanges);
    const consistency = this.calculateConsistency(durationChanges);

    if (Math.abs(avgChange) > 5) {
      trends.push({
        metric: 'duration',
        direction: avgChange > 0 ? 'degrading' : 'improving',
        magnitude: Math.abs(avgChange),
        consistency,
        affectedTests: comparisons
          .filter(c => {
            const metric = c.metrics.find(m => m.metric === 'duration');
            return metric && Math.abs(metric.percentageChange) > 5;
          })
          .map(c => c.testKey),
        projectedImpact: this.projectPerformanceImpact(avgChange)
      });
    }

    return trends;
  }

  private analyzeResourceUsageTrends(comparisons: TestComparison[]): ResourceUsageTrend[] {
    const trends: ResourceUsageTrend[] = [];

    const memoryChanges = comparisons.map(c =>
      c.metrics.find(m => m.metric === 'memory')?.percentageChange || 0
    );

    const avgMemoryChange = this.calculateMean(memoryChanges);
    const peakMemoryChange = Math.max(...memoryChanges.map(Math.abs));

    if (Math.abs(avgMemoryChange) > 10) {
      trends.push({
        resource: 'memory',
        trend: avgMemoryChange > 0 ? 'increasing' : 'decreasing',
        averageChange: avgMemoryChange,
        peakChange: peakMemoryChange,
        efficiency: avgMemoryChange < 0 ? 'improved' : 'degraded',
        concerns: avgMemoryChange > 20 ? ['High memory usage increase', 'Potential scalability impact'] : []
      });
    }

    return trends;
  }

  private analyzeStabilityChanges(current: BenchmarkResult[], baseline: BenchmarkResult[]): StabilityChange[] {
    const changes: StabilityChange[] = [];

    const currentVariability = this.calculateMean(current.map(r => r.duration.stddev / r.duration.mean));
    const baselineVariability = this.calculateMean(baseline.map(r => r.duration.stddev / r.duration.mean));
    const variabilityChange = ((currentVariability - baselineVariability) / baselineVariability) * 100;

    if (Math.abs(variabilityChange) > 10) {
      changes.push({
        metric: 'duration',
        variabilityChange,
        outlierRateChange: 0, // Would need outlier analysis
        consistencyChange: -variabilityChange, // Inverse relationship
        stabilityImpact: variabilityChange > 0 ? 'negative' : 'positive'
      });
    }

    return changes;
  }

  private analyzeDistributionShifts(current: BenchmarkResult[], baseline: BenchmarkResult[]): DistributionShift[] {
    const shifts: DistributionShift[] = [];

    const currentMean = this.calculateMean(current.map(r => r.duration.mean));
    const baselineMean = this.calculateMean(baseline.map(r => r.duration.mean));
    const meanShift = ((currentMean - baselineMean) / baselineMean) * 100;

    if (Math.abs(meanShift) > 10) {
      shifts.push({
        metric: 'duration',
        shiftType: 'mean-shift',
        magnitude: Math.abs(meanShift),
        significance: 0.8, // Would be calculated properly
        interpretation: `Mean duration ${meanShift > 0 ? 'increased' : 'decreased'} by ${Math.abs(meanShift).toFixed(1)}%`
      });
    }

    return shifts;
  }

  private analyzeCorrelationChanges(current: BenchmarkResult[], baseline: BenchmarkResult[]): CorrelationChange[] {
    const changes: CorrelationChange[] = [];

    const currentDurations = current.map(r => r.duration.mean);
    const currentMemory = current.map(r => r.memory.heapUsed);
    const baselineDurations = baseline.map(r => r.duration.mean);
    const baselineMemory = baseline.map(r => r.memory.heapUsed);

    const currentCorrelation = this.calculateCorrelation(currentDurations, currentMemory);
    const baselineCorrelation = this.calculateCorrelation(baselineDurations, baselineMemory);
    const correlationChange = currentCorrelation - baselineCorrelation;

    if (Math.abs(correlationChange) > 0.2) {
      changes.push({
        metric1: 'duration',
        metric2: 'memory',
        baselineCorrelation,
        currentCorrelation,
        correlationChange,
        significance: 0.7,
        interpretation: `Correlation between duration and memory ${correlationChange > 0 ? 'strengthened' : 'weakened'}`
      });
    }

    return changes;
  }

  private generateRecommendations(
    comparisons: TestComparison[],
    regressions: RegressionResult[],
    improvements: ImprovementResult[]
  ): ComparisonRecommendation[] {
    const recommendations: ComparisonRecommendation[] = [];

    // Critical regression recommendations
    const criticalRegressions = regressions.filter(r => r.severity === 'critical');
    if (criticalRegressions.length > 0) {
      recommendations.push({
        type: 'regression-fix',
        priority: 'critical',
        title: 'Address Critical Performance Regressions',
        description: `${criticalRegressions.length} tests show critical performance regressions`,
        affectedTests: criticalRegressions.map(r => r.testKey),
        evidence: criticalRegressions.map(r => `${r.testKey}: ${r.percentageChange.toFixed(1)}% regression`),
        actionItems: [
          'Profile affected tests immediately',
          'Identify root cause of performance degradation',
          'Consider reverting recent changes if necessary',
          'Implement targeted optimizations'
        ],
        expectedOutcome: 'Restore performance to baseline levels',
        effort: 'high',
        timeframe: 'immediate'
      });
    }

    // Improvement sustainability recommendations
    const largeImprovements = improvements.filter(i => Math.abs(i.percentageChange) > 30);
    if (largeImprovements.length > 0) {
      recommendations.push({
        type: 'improvement-maintain',
        priority: 'medium',
        title: 'Validate and Maintain Performance Improvements',
        description: `${largeImprovements.length} tests show significant improvements that should be validated`,
        affectedTests: largeImprovements.map(i => i.testKey),
        evidence: largeImprovements.map(i => `${i.testKey}: ${Math.abs(i.percentageChange).toFixed(1)}% improvement`),
        actionItems: [
          'Verify improvements are due to actual optimizations',
          'Check for measurement accuracy',
          'Document optimization techniques',
          'Monitor sustainability over time'
        ],
        expectedOutcome: 'Confirmed and sustainable performance improvements',
        effort: 'low',
        timeframe: 'short-term'
      });
    }

    return recommendations;
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateConsistency(values: number[]): number {
    if (values.length <= 1) return 1;

    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Consistency as inverse of coefficient of variation
    return Math.max(0, 1 - (stdDev / Math.abs(mean)));
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

  private projectPerformanceImpact(changePercent: number): string {
    const absChange = Math.abs(changePercent);

    if (absChange > 50) {
      return changePercent > 0 ? 'Severe user experience degradation expected' : 'Significant user experience improvement expected';
    } else if (absChange > 25) {
      return changePercent > 0 ? 'Noticeable user experience impact' : 'Noticeable user experience improvement';
    } else if (absChange > 10) {
      return changePercent > 0 ? 'Minor user experience impact' : 'Minor user experience improvement';
    }

    return 'Minimal user-facing impact expected';
  }

  async saveComparison(result: ComparisonResult, outputPath: string): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: result.summary,
      comparisons: result.comparisons.map(c => ({
        testKey: c.testKey,
        suite: c.suite,
        test: c.test,
        overall: c.overall,
        metrics: c.metrics.map(m => ({
          metric: m.metric,
          percentageChange: m.percentageChange,
          significance: m.significance,
          isRegression: m.isRegression,
          isImprovement: m.isImprovement
        }))
      })),
      regressions: result.regressions,
      improvements: result.improvements,
      recommendations: result.recommendations,
      analysis: result.analysis
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`Comparison report saved to: ${outputPath}`);
  }

  getConfig(): BaselineConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<BaselineConfig>): void {
    this.config = this.mergeWithDefaults(config);
  }

  destroy(): void {
    this.removeAllListeners();
  }
}

export default BaselineComparator;