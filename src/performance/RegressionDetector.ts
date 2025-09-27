import * as fs from 'fs';
import { BenchmarkResult } from './PerformanceBenchmarker';
import { BaselineComparator, ComparisonResult } from './BaselineComparator';
import { EventEmitter } from 'events';

export interface RegressionDetectionResult {
  timestamp: number;
  totalTests: number;
  regressionsDetected: number;
  criticalRegressions: RegressionAlert[];
  majorRegressions: RegressionAlert[];
  minorRegressions: RegressionAlert[];
  falsePositives: FalsePositiveAnalysis[];
  trendAnalysis: RegressionTrend[];
  summary: RegressionSummary;
  recommendations: RegressionRecommendation[];
}

export interface RegressionAlert {
  testKey: string;
  suite: string;
  test: string;
  metric: string;
  severity: 'critical' | 'major' | 'minor';
  currentValue: number;
  baselineValue: number;
  percentageChange: number;
  absoluteChange: number;
  confidence: number; // 0-1
  impact: RegressionImpact;
  rootCause: RootCauseAnalysis;
  actionRequired: string;
  timeToFix: 'immediate' | 'urgent' | 'scheduled';
}

export interface RegressionImpact {
  userFacing: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number; // estimated percentage
  businessImpact: string;
  technicalDebt: number; // 0-1 score
}

export interface RootCauseAnalysis {
  likelyCauses: string[];
  confidence: number;
  investigationSteps: string[];
  relatedChanges: ChangeAnalysis[];
  environmentalFactors: string[];
}

export interface ChangeAnalysis {
  type: 'code' | 'dependency' | 'infrastructure' | 'configuration';
  description: string;
  timestamp: number;
  likelihood: number; // 0-1
  impact: number; // 0-1
}

export interface FalsePositiveAnalysis {
  testKey: string;
  reason: 'measurement-noise' | 'environmental-variance' | 'baseline-outlier' | 'insufficient-data';
  confidence: number;
  evidence: string[];
  recommendation: string;
}

export interface RegressionTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading' | 'volatile';
  rate: number; // change per time unit
  acceleration: number; // rate of change of rate
  projectedImpact: ProjectedImpact;
  stabilityForecast: StabilityForecast;
}

export interface ProjectedImpact {
  timeToSeverity: { [severity: string]: number }; // days to reach severity level
  expectedUserImpact: string;
  businessRisk: 'low' | 'medium' | 'high' | 'critical';
  technicalRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface StabilityForecast {
  likelihood: number; // 0-1 probability of continued degradation
  timeframe: number; // days until stability restored
  interventionRequired: boolean;
  confidence: number;
}

export interface RegressionSummary {
  overallHealthScore: number; // 0-100
  regressionRate: number; // percentage of tests with regressions
  criticalIssues: number;
  averageRegressionMagnitude: number;
  stabilityTrend: 'improving' | 'stable' | 'degrading';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  actionUrgency: 'none' | 'monitor' | 'investigate' | 'immediate';
}

export interface RegressionRecommendation {
  type: 'immediate-action' | 'investigation' | 'monitoring' | 'process-improvement';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedTests: string[];
  actionItems: ActionItem[];
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'hours' | 'days' | 'weeks';
  successCriteria: string[];
}

export interface ActionItem {
  description: string;
  owner: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours: number;
  dependencies: string[];
  deliverable: string;
}

export interface RegressionThresholds {
  critical: {
    percentageChange: number;
    absoluteChange?: number;
    userImpactThreshold: number;
  };
  major: {
    percentageChange: number;
    absoluteChange?: number;
    userImpactThreshold: number;
  };
  minor: {
    percentageChange: number;
    absoluteChange?: number;
    userImpactThreshold: number;
  };
}

export interface DetectionConfig {
  thresholds: { [metric: string]: RegressionThresholds };
  statistical: {
    confidenceLevel: number;
    minSampleSize: number;
    outlierDetection: boolean;
    trendAnalysisWindow: number; // number of historical runs to analyze
  };
  filtering: {
    excludeFlaky: boolean;
    minStability: number; // coefficient of variation threshold
    excludeFailedTests: boolean;
  };
  alerting: {
    enableImmediateAlerts: boolean;
    aggregationWindow: number; // minutes
    escalationRules: EscalationRule[];
  };
}

export interface EscalationRule {
  condition: string;
  severity: 'critical' | 'major' | 'minor';
  action: 'email' | 'slack' | 'pager' | 'ticket';
  recipients: string[];
  delay: number; // minutes
}

export class RegressionDetector extends EventEmitter {
  private comparator: BaselineComparator;
  private config: DetectionConfig;
  private historicalData: Map<string, BenchmarkResult[]> = new Map();

  constructor(config?: Partial<DetectionConfig>) {
    super();
    this.comparator = new BaselineComparator();
    this.config = this.mergeWithDefaults(config);
  }

  private mergeWithDefaults(config?: Partial<DetectionConfig>): DetectionConfig {
    return {
      thresholds: {
        duration: {
          critical: { percentageChange: 50, userImpactThreshold: 0.8 },
          major: { percentageChange: 25, userImpactThreshold: 0.5 },
          minor: { percentageChange: 10, userImpactThreshold: 0.2 }
        },
        memory: {
          critical: { percentageChange: 100, userImpactThreshold: 0.7 },
          major: { percentageChange: 50, userImpactThreshold: 0.4 },
          minor: { percentageChange: 20, userImpactThreshold: 0.1 }
        },
        cpu: {
          critical: { percentageChange: 75, userImpactThreshold: 0.6 },
          major: { percentageChange: 40, userImpactThreshold: 0.3 },
          minor: { percentageChange: 15, userImpactThreshold: 0.1 }
        },
        ...config?.thresholds
      },
      statistical: {
        confidenceLevel: 0.95,
        minSampleSize: 5,
        outlierDetection: true,
        trendAnalysisWindow: 10,
        ...config?.statistical
      },
      filtering: {
        excludeFlaky: true,
        minStability: 0.5, // CV < 50%
        excludeFailedTests: true,
        ...config?.filtering
      },
      alerting: {
        enableImmediateAlerts: true,
        aggregationWindow: 5,
        escalationRules: [],
        ...config?.alerting
      }
    };
  }

  async detectRegressions(
    current: BenchmarkResult[],
    baselineFile: string,
    threshold: number = 0.1
  ): Promise<RegressionDetectionResult> {
    console.log(`Detecting regressions in ${current.length} benchmark results`);
    this.emit('detection-start', { currentCount: current.length, baselineFile });

    try {
      // Store historical data
      this.updateHistoricalData(current);

      // Perform baseline comparison
      const comparison = await this.comparator.compare(current, baselineFile, threshold);

      // Classify regressions by severity
      const { critical, major, minor } = this.classifyRegressions(comparison);

      // Analyze false positives
      const falsePositives = this.analyzeFalsePositives(comparison, current);

      // Perform trend analysis
      const trendAnalysis = this.analyzeTrends(current);

      // Generate summary
      const summary = this.generateSummary(critical, major, minor, current.length);

      // Generate recommendations
      const recommendations = this.generateRecommendations(critical, major, minor, trendAnalysis);

      const result: RegressionDetectionResult = {
        timestamp: Date.now(),
        totalTests: current.length,
        regressionsDetected: critical.length + major.length + minor.length,
        criticalRegressions: critical,
        majorRegressions: major,
        minorRegressions: minor,
        falsePositives,
        trendAnalysis,
        summary,
        recommendations
      };

      this.emit('detection-complete', result);

      // Trigger alerts if enabled
      if (this.config.alerting.enableImmediateAlerts) {
        await this.triggerAlerts(result);
      }

      return result;

    } catch (error) {
      this.emit('detection-error', error);
      throw error;
    }
  }

  private updateHistoricalData(results: BenchmarkResult[]): void {
    results.forEach(result => {
      const testKey = `${result.suite}.${result.test}`;
      const history = this.historicalData.get(testKey) || [];

      history.push(result);

      // Keep only recent history (configurable window)
      const maxHistory = this.config.statistical.trendAnalysisWindow;
      if (history.length > maxHistory) {
        history.splice(0, history.length - maxHistory);
      }

      this.historicalData.set(testKey, history);
    });
  }

  private classifyRegressions(comparison: ComparisonResult): {
    critical: RegressionAlert[];
    major: RegressionAlert[];
    minor: RegressionAlert[];
  } {
    const critical: RegressionAlert[] = [];
    const major: RegressionAlert[] = [];
    const minor: RegressionAlert[] = [];

    comparison.regressions.forEach(regression => {
      const alert = this.createRegressionAlert(regression, comparison);

      switch (alert.severity) {
        case 'critical':
          critical.push(alert);
          break;
        case 'major':
          major.push(alert);
          break;
        case 'minor':
          minor.push(alert);
          break;
      }
    });

    return { critical, major, minor };
  }

  private createRegressionAlert(regression: any, comparison: ComparisonResult): RegressionAlert {
    const severity = this.determineSeverity(regression);
    const impact = this.assessImpact(regression, severity);
    const rootCause = this.analyzeRootCause(regression, comparison);

    return {
      testKey: regression.testKey,
      suite: regression.suite,
      test: regression.test,
      metric: regression.metric,
      severity,
      currentValue: regression.currentValue,
      baselineValue: regression.baselineValue,
      percentageChange: regression.percentageChange,
      absoluteChange: regression.absoluteChange,
      confidence: regression.confidenceLevel,
      impact,
      rootCause,
      actionRequired: this.determineActionRequired(severity, impact),
      timeToFix: this.determineTimeToFix(severity, impact)
    };
  }

  private determineSeverity(regression: any): 'critical' | 'major' | 'minor' {
    const thresholds = this.config.thresholds[regression.metric];
    if (!thresholds) return 'minor';

    const change = Math.abs(regression.percentageChange);

    if (change >= thresholds.critical.percentageChange) return 'critical';
    if (change >= thresholds.major.percentageChange) return 'major';
    if (change >= thresholds.minor.percentageChange) return 'minor';

    return 'minor';
  }

  private assessImpact(regression: any, severity: 'critical' | 'major' | 'minor'): RegressionImpact {
    const thresholds = this.config.thresholds[regression.metric];
    const userFacing = this.isUserFacingMetric(regression.metric);

    let affectedUsers = 0;
    let technicalDebt = 0;
    let businessImpact = '';

    switch (severity) {
      case 'critical':
        affectedUsers = userFacing ? 80 : 20;
        technicalDebt = 0.8;
        businessImpact = 'High risk of customer churn and revenue impact';
        break;
      case 'major':
        affectedUsers = userFacing ? 50 : 10;
        technicalDebt = 0.6;
        businessImpact = 'Moderate user experience degradation';
        break;
      case 'minor':
        affectedUsers = userFacing ? 20 : 5;
        technicalDebt = 0.3;
        businessImpact = 'Minor impact on user satisfaction';
        break;
    }

    return {
      userFacing,
      severity,
      affectedUsers,
      businessImpact,
      technicalDebt
    };
  }

  private isUserFacingMetric(metric: string): boolean {
    const userFacingMetrics = ['duration', 'p95Duration', 'p99Duration'];
    return userFacingMetrics.includes(metric);
  }

  private analyzeRootCause(regression: any, comparison: ComparisonResult): RootCauseAnalysis {
    const likelyCauses: string[] = [];
    let confidence = 0.5;

    // Analyze pattern across tests
    const similarRegressions = comparison.regressions.filter(r =>
      r.metric === regression.metric &&
      Math.abs(r.percentageChange - regression.percentageChange) < 10
    );

    if (similarRegressions.length > 1) {
      likelyCauses.push('Systematic change affecting multiple tests');
      confidence += 0.2;
    }

    // Check if memory and duration regressed together
    const memoryRegression = comparison.regressions.find(r =>
      r.testKey === regression.testKey && r.metric === 'memory'
    );

    if (regression.metric === 'duration' && memoryRegression) {
      likelyCauses.push('Memory allocation issue causing performance degradation');
      confidence += 0.3;
    }

    // Analyze magnitude
    if (Math.abs(regression.percentageChange) > 50) {
      likelyCauses.push('Algorithmic change or new inefficient code path');
      confidence += 0.2;
    }

    const investigationSteps = this.generateInvestigationSteps(regression, likelyCauses);
    const environmentalFactors = this.identifyEnvironmentalFactors();

    return {
      likelyCauses: likelyCauses.length > 0 ? likelyCauses : ['Unknown - requires investigation'],
      confidence: Math.min(1, confidence),
      investigationSteps,
      relatedChanges: [], // Would need integration with version control
      environmentalFactors
    };
  }

  private generateInvestigationSteps(regression: any, causes: string[]): string[] {
    const steps: string[] = [
      'Review recent code changes affecting the test',
      'Check for dependency updates or configuration changes',
      'Profile the test to identify performance bottlenecks'
    ];

    if (regression.metric === 'memory') {
      steps.push('Analyze memory allocation patterns and check for leaks');
    }

    if (regression.metric === 'duration') {
      steps.push('Identify CPU-intensive operations and algorithm changes');
    }

    if (causes.some(c => c.includes('systematic'))) {
      steps.push('Investigate infrastructure or environment changes');
    }

    return steps;
  }

  private identifyEnvironmentalFactors(): string[] {
    // This would typically integrate with monitoring systems
    return [
      'System load variations',
      'Network latency changes',
      'Background process interference',
      'Hardware thermal throttling'
    ];
  }

  private determineActionRequired(severity: 'critical' | 'major' | 'minor', impact: RegressionImpact): string {
    switch (severity) {
      case 'critical':
        return 'IMMEDIATE: Investigate and fix within 2 hours or consider rollback';
      case 'major':
        return 'URGENT: Investigate within 4 hours and plan fix within 24 hours';
      case 'minor':
        return 'SCHEDULED: Investigate within 2 days and fix in next sprint';
      default:
        return 'Monitor and investigate if pattern continues';
    }
  }

  private determineTimeToFix(severity: 'critical' | 'major' | 'minor', impact: RegressionImpact): 'immediate' | 'urgent' | 'scheduled' {
    if (severity === 'critical' || impact.affectedUsers > 70) return 'immediate';
    if (severity === 'major' || impact.affectedUsers > 30) return 'urgent';
    return 'scheduled';
  }

  private analyzeFalsePositives(comparison: ComparisonResult, current: BenchmarkResult[]): FalsePositiveAnalysis[] {
    const falsePositives: FalsePositiveAnalysis[] = [];

    comparison.regressions.forEach(regression => {
      const testKey = regression.testKey;
      const currentResult = current.find(r => `${r.suite}.${r.test}` === testKey);

      if (!currentResult) return;

      // Check for high variability
      const cv = currentResult.duration.stddev / currentResult.duration.mean;
      if (cv > 0.5) {
        falsePositives.push({
          testKey,
          reason: 'measurement-noise',
          confidence: 0.8,
          evidence: [`High coefficient of variation: ${(cv * 100).toFixed(1)}%`],
          recommendation: 'Increase sample size or improve test stability'
        });
      }

      // Check for insufficient data
      if (currentResult.iterations < this.config.statistical.minSampleSize) {
        falsePositives.push({
          testKey,
          reason: 'insufficient-data',
          confidence: 0.9,
          evidence: [`Only ${currentResult.iterations} iterations, minimum ${this.config.statistical.minSampleSize} required`],
          recommendation: 'Increase number of benchmark iterations'
        });
      }

      // Check for environmental variance
      const warnings = currentResult.warnings || [];
      const hasEnvironmentalWarnings = warnings.some(w =>
        w.includes('CPU') || w.includes('memory') || w.includes('system')
      );

      if (hasEnvironmentalWarnings) {
        falsePositives.push({
          testKey,
          reason: 'environmental-variance',
          confidence: 0.7,
          evidence: warnings,
          recommendation: 'Stabilize test environment and re-run benchmark'
        });
      }
    });

    return falsePositives;
  }

  private analyzeTrends(current: BenchmarkResult[]): RegressionTrend[] {
    const trends: RegressionTrend[] = [];

    // Analyze trends for each metric
    const metrics = ['duration', 'memory', 'cpu'];

    metrics.forEach(metric => {
      const trend = this.analyzeTrendForMetric(metric, current);
      if (trend) trends.push(trend);
    });

    return trends;
  }

  private analyzeTrendForMetric(metric: string, current: BenchmarkResult[]): RegressionTrend | null {
    // Get historical data for trend analysis
    const allValues: number[] = [];
    const timePoints: number[] = [];

    current.forEach(result => {
      const testKey = `${result.suite}.${result.test}`;
      const history = this.historicalData.get(testKey) || [];

      history.forEach(historical => {
        let value = 0;
        switch (metric) {
          case 'duration':
            value = historical.duration.mean;
            break;
          case 'memory':
            value = historical.memory.heapUsed;
            break;
          case 'cpu':
            value = historical.cpu.percentage;
            break;
        }

        allValues.push(value);
        timePoints.push(historical.timestamp);
      });
    });

    if (allValues.length < 3) return null;

    // Calculate trend
    const trend = this.calculateLinearTrend(allValues, timePoints);
    const direction = this.determineTrendDirection(trend.slope, metric);
    const projectedImpact = this.projectTrendImpact(trend, metric);
    const stabilityForecast = this.forecastStability(trend, allValues);

    return {
      metric,
      direction,
      rate: trend.slope,
      acceleration: trend.acceleration || 0,
      projectedImpact,
      stabilityForecast
    };
  }

  private calculateLinearTrend(values: number[], timePoints: number[]): {
    slope: number;
    intercept: number;
    correlation: number;
    acceleration?: number;
  } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: 0, correlation: 0 };

    // Normalize time points to hours since start
    const startTime = Math.min(...timePoints);
    const x = timePoints.map(t => (t - startTime) / (1000 * 60 * 60)); // hours
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

  private determineTrendDirection(slope: number, metric: string): 'improving' | 'stable' | 'degrading' | 'volatile' {
    const threshold = this.getTrendThreshold(metric);

    if (Math.abs(slope) < threshold) return 'stable';

    // For performance metrics, positive slope is degrading
    if (['duration', 'memory', 'cpu'].includes(metric)) {
      return slope > 0 ? 'degrading' : 'improving';
    }

    return slope > 0 ? 'improving' : 'degrading';
  }

  private getTrendThreshold(metric: string): number {
    const thresholds = {
      duration: 1, // 1ms per hour
      memory: 1024 * 1024, // 1MB per hour
      cpu: 0.1 // 0.1% per hour
    };

    return thresholds[metric as keyof typeof thresholds] || 0.1;
  }

  private projectTrendImpact(trend: any, metric: string): ProjectedImpact {
    const timeToSeverity: { [severity: string]: number } = {};

    // Project when current trend will reach severity thresholds
    const thresholds = this.config.thresholds[metric];
    if (thresholds && trend.slope > 0) {
      const currentValue = trend.intercept;

      // Time to reach minor threshold (in days)
      const timeToMinor = (currentValue * (thresholds.minor.percentageChange / 100)) / (trend.slope * 24);
      const timeToMajor = (currentValue * (thresholds.major.percentageChange / 100)) / (trend.slope * 24);
      const timeToCritical = (currentValue * (thresholds.critical.percentageChange / 100)) / (trend.slope * 24);

      timeToSeverity.minor = Math.max(0, timeToMinor);
      timeToSeverity.major = Math.max(0, timeToMajor);
      timeToSeverity.critical = Math.max(0, timeToCritical);
    }

    const businessRisk = this.assessBusinessRisk(trend, metric);
    const technicalRisk = this.assessTechnicalRisk(trend, metric);

    return {
      timeToSeverity,
      expectedUserImpact: this.describeUserImpact(trend, metric),
      businessRisk,
      technicalRisk
    };
  }

  private assessBusinessRisk(trend: any, metric: string): 'low' | 'medium' | 'high' | 'critical' {
    if (trend.direction === 'improving') return 'low';
    if (trend.direction === 'stable') return 'low';

    const slopeThreshold = this.getTrendThreshold(metric) * 10; // 10x threshold for high risk

    if (Math.abs(trend.slope) > slopeThreshold) return 'critical';
    if (Math.abs(trend.slope) > slopeThreshold / 2) return 'high';
    if (Math.abs(trend.slope) > slopeThreshold / 5) return 'medium';
    return 'low';
  }

  private assessTechnicalRisk(trend: any, metric: string): 'low' | 'medium' | 'high' | 'critical' {
    // Technical risk based on maintenance burden and system stability
    const correlationRisk = Math.abs(trend.correlation) > 0.8 ? 'high' : 'medium';
    const magnitudeRisk = Math.abs(trend.slope) > this.getTrendThreshold(metric) * 5 ? 'high' : 'medium';

    if (correlationRisk === 'high' && magnitudeRisk === 'high') return 'critical';
    if (correlationRisk === 'high' || magnitudeRisk === 'high') return 'high';
    return 'medium';
  }

  private describeUserImpact(trend: any, metric: string): string {
    if (trend.direction === 'improving') {
      return `Improving ${metric} trend - positive user experience impact`;
    }

    const magnitude = Math.abs(trend.slope);
    const threshold = this.getTrendThreshold(metric);

    if (magnitude > threshold * 10) {
      return `Rapid ${metric} degradation - severe user experience impact expected`;
    } else if (magnitude > threshold * 3) {
      return `Moderate ${metric} degradation - noticeable user experience impact`;
    } else {
      return `Gradual ${metric} degradation - minor user experience impact`;
    }
  }

  private forecastStability(trend: any, values: number[]): StabilityForecast {
    const volatility = this.calculateVolatility(values);
    const trendStrength = Math.abs(trend.correlation);

    // Likelihood of continued degradation
    let likelihood = 0.5;
    if (trend.direction === 'degrading' && trendStrength > 0.7) {
      likelihood = 0.8;
    } else if (trend.direction === 'improving') {
      likelihood = 0.2;
    }

    // Time to stability (simplified estimation)
    const timeframe = volatility > 0.3 ? 14 : 7; // days

    const interventionRequired = trend.direction === 'degrading' && trendStrength > 0.6;

    return {
      likelihood,
      timeframe,
      interventionRequired,
      confidence: trendStrength
    };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? stdDev / mean : 0;
  }

  private generateSummary(
    critical: RegressionAlert[],
    major: RegressionAlert[],
    minor: RegressionAlert[],
    totalTests: number
  ): RegressionSummary {
    const totalRegressions = critical.length + major.length + minor.length;
    const regressionRate = totalTests > 0 ? (totalRegressions / totalTests) * 100 : 0;

    const allRegressions = [...critical, ...major, ...minor];
    const averageRegressionMagnitude = allRegressions.length > 0
      ? allRegressions.reduce((sum, r) => sum + Math.abs(r.percentageChange), 0) / allRegressions.length
      : 0;

    // Health score calculation (0-100)
    let healthScore = 100;
    healthScore -= critical.length * 30; // Critical regressions heavily penalized
    healthScore -= major.length * 15;    // Major regressions moderately penalized
    healthScore -= minor.length * 5;     // Minor regressions lightly penalized
    healthScore = Math.max(0, healthScore);

    // Determine overall stability trend
    const stabilityTrend = this.determineStabilityTrend(critical, major, minor);

    // Risk level assessment
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (critical.length > 0) riskLevel = 'critical';
    else if (major.length > 2 || regressionRate > 20) riskLevel = 'high';
    else if (major.length > 0 || regressionRate > 10) riskLevel = 'medium';

    // Action urgency
    let actionUrgency: 'none' | 'monitor' | 'investigate' | 'immediate' = 'none';
    if (critical.length > 0) actionUrgency = 'immediate';
    else if (major.length > 0) actionUrgency = 'investigate';
    else if (minor.length > 0) actionUrgency = 'monitor';

    return {
      overallHealthScore: healthScore,
      regressionRate,
      criticalIssues: critical.length,
      averageRegressionMagnitude,
      stabilityTrend,
      riskLevel,
      actionUrgency
    };
  }

  private determineStabilityTrend(
    critical: RegressionAlert[],
    major: RegressionAlert[],
    minor: RegressionAlert[]
  ): 'improving' | 'stable' | 'degrading' {
    const totalRegressions = critical.length + major.length + minor.length;

    if (critical.length > 0 || totalRegressions > 5) return 'degrading';
    if (totalRegressions === 0) return 'stable';
    if (totalRegressions <= 2 && critical.length === 0) return 'stable';

    return 'degrading';
  }

  private generateRecommendations(
    critical: RegressionAlert[],
    major: RegressionAlert[],
    minor: RegressionAlert[],
    trends: RegressionTrend[]
  ): RegressionRecommendation[] {
    const recommendations: RegressionRecommendation[] = [];

    // Critical regression recommendations
    if (critical.length > 0) {
      recommendations.push({
        type: 'immediate-action',
        priority: 'critical',
        title: 'Address Critical Performance Regressions',
        description: `${critical.length} critical performance regressions require immediate attention`,
        affectedTests: critical.map(c => c.testKey),
        actionItems: [
          {
            description: 'Investigate root cause of critical regressions',
            owner: 'Development Team Lead',
            priority: 'critical',
            estimatedHours: 4,
            dependencies: [],
            deliverable: 'Root cause analysis report'
          },
          {
            description: 'Implement fixes or rollback changes',
            owner: 'Senior Developer',
            priority: 'critical',
            estimatedHours: 8,
            dependencies: ['Root cause analysis'],
            deliverable: 'Performance fix implementation'
          }
        ],
        expectedOutcome: 'Performance restored to baseline levels within 24 hours',
        effort: 'high',
        timeframe: 'immediate',
        successCriteria: [
          'All critical regressions resolved',
          'Performance metrics return to baseline ±5%',
          'No new regressions introduced'
        ]
      });
    }

    // Major regression recommendations
    if (major.length > 0) {
      recommendations.push({
        type: 'investigation',
        priority: 'high',
        title: 'Investigate Major Performance Issues',
        description: `${major.length} major performance regressions need investigation and planning`,
        affectedTests: major.map(m => m.testKey),
        actionItems: [
          {
            description: 'Perform detailed performance analysis',
            owner: 'Performance Engineer',
            priority: 'high',
            estimatedHours: 6,
            dependencies: [],
            deliverable: 'Performance analysis report'
          },
          {
            description: 'Create optimization plan',
            owner: 'Technical Lead',
            priority: 'high',
            estimatedHours: 4,
            dependencies: ['Performance analysis'],
            deliverable: 'Optimization roadmap'
          }
        ],
        expectedOutcome: 'Clear plan for addressing major performance issues',
        effort: 'medium',
        timeframe: 'days',
        successCriteria: [
          'Root causes identified',
          'Optimization plan created',
          'Timeline for fixes established'
        ]
      });
    }

    // Trend-based recommendations
    const degradingTrends = trends.filter(t => t.direction === 'degrading');
    if (degradingTrends.length > 0) {
      recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        title: 'Monitor Performance Degradation Trends',
        description: `${degradingTrends.length} metrics show degrading trends that require monitoring`,
        affectedTests: [],
        actionItems: [
          {
            description: 'Set up automated performance monitoring',
            owner: 'DevOps Engineer',
            priority: 'medium',
            estimatedHours: 8,
            dependencies: [],
            deliverable: 'Monitoring dashboard and alerts'
          },
          {
            description: 'Establish performance budgets',
            owner: 'Product Manager',
            priority: 'medium',
            estimatedHours: 4,
            dependencies: [],
            deliverable: 'Performance budget document'
          }
        ],
        expectedOutcome: 'Proactive detection and prevention of performance issues',
        effort: 'medium',
        timeframe: 'weeks',
        successCriteria: [
          'Monitoring system deployed',
          'Performance budgets defined',
          'Alert thresholds configured'
        ]
      });
    }

    // Process improvement recommendations
    if (minor.length > 5) {
      recommendations.push({
        type: 'process-improvement',
        priority: 'low',
        title: 'Improve Performance Testing Process',
        description: 'High number of minor regressions suggests need for process improvements',
        affectedTests: minor.map(m => m.testKey),
        actionItems: [
          {
            description: 'Review and improve benchmark stability',
            owner: 'QA Engineer',
            priority: 'low',
            estimatedHours: 12,
            dependencies: [],
            deliverable: 'Improved benchmark suite'
          },
          {
            description: 'Implement performance gates in CI/CD',
            owner: 'DevOps Engineer',
            priority: 'medium',
            estimatedHours: 16,
            dependencies: [],
            deliverable: 'Automated performance gates'
          }
        ],
        expectedOutcome: 'Reduced number of performance regressions in future releases',
        effort: 'high',
        timeframe: 'weeks',
        successCriteria: [
          'Performance gates implemented',
          '50% reduction in minor regressions',
          'Improved benchmark repeatability'
        ]
      });
    }

    return recommendations;
  }

  private async triggerAlerts(result: RegressionDetectionResult): Promise<void> {
    // Immediate alerts for critical regressions
    if (result.criticalRegressions.length > 0) {
      this.emit('critical-alert', {
        severity: 'critical',
        message: `${result.criticalRegressions.length} critical performance regressions detected`,
        regressions: result.criticalRegressions,
        timestamp: Date.now()
      });
    }

    // Major regression alerts
    if (result.majorRegressions.length > 0) {
      this.emit('major-alert', {
        severity: 'major',
        message: `${result.majorRegressions.length} major performance regressions detected`,
        regressions: result.majorRegressions,
        timestamp: Date.now()
      });
    }

    // Health score alerts
    if (result.summary.overallHealthScore < 70) {
      this.emit('health-alert', {
        severity: 'warning',
        message: `Performance health score dropped to ${result.summary.overallHealthScore}`,
        score: result.summary.overallHealthScore,
        timestamp: Date.now()
      });
    }
  }

  async saveDetectionResult(result: RegressionDetectionResult, outputPath: string): Promise<void> {
    const report = {
      metadata: {
        timestamp: result.timestamp,
        totalTests: result.totalTests,
        regressionsDetected: result.regressionsDetected
      },
      summary: result.summary,
      regressions: {
        critical: result.criticalRegressions,
        major: result.majorRegressions,
        minor: result.minorRegressions
      },
      analysis: {
        falsePositives: result.falsePositives,
        trends: result.trendAnalysis
      },
      recommendations: result.recommendations,
      configuration: this.config
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`Regression detection report saved to: ${outputPath}`);
  }

  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = this.mergeWithDefaults(config);
  }

  clearHistoricalData(): void {
    this.historicalData.clear();
  }

  getHistoricalData(): Map<string, BenchmarkResult[]> {
    return new Map(this.historicalData);
  }

  destroy(): void {
    this.removeAllListeners();
    this.comparator.destroy();
  }
}

export default RegressionDetector;