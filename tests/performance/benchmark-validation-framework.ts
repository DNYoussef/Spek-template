/**
 * Benchmark Validation Framework
 *
 * Comprehensive validation system for benchmark results with statistical analysis,
 * anomaly detection, data integrity checks, and performance trend validation.
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkResult, BenchmarkConfig } from '../../src/performance/types';

export interface ValidationRule {
  name: string;
  description: string;
  category: 'data_integrity' | 'statistical' | 'performance' | 'consistency' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  validate: (result: BenchmarkResult, context: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  historicalResults: BenchmarkResult[];
  benchmarkConfig: BenchmarkConfig;
  environmentInfo: any;
  baseline?: BenchmarkResult;
  thresholds: ValidationThresholds;
}

export interface ValidationThresholds {
  maxErrorRate: number;
  minSuccessRate: number;
  maxLatencyP99: number;
  maxMemoryUsage: number;
  maxCpuUsage: number;
  maxRegressionPercent: number;
  minThroughput: number;
  maxVarianceCoefficient: number;
}

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  message: string;
  details?: any;
  suggestions?: string[];
}

export interface ValidationReport {
  overall: {
    passed: boolean;
    score: number;
    totalRules: number;
    passedRules: number;
    failedRules: number;
    criticalFailures: number;
  };
  ruleResults: Map<string, ValidationResult>;
  anomalies: AnomalyDetection[];
  trends: TrendAnalysis;
  recommendations: string[];
  timestamp: number;
}

export interface AnomalyDetection {
  type: 'outlier' | 'drift' | 'spike' | 'drop' | 'pattern_break';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  description: string;
  value: number;
  expectedRange: [number, number];
  confidence: number;
}

export interface TrendAnalysis {
  direction: 'improving' | 'degrading' | 'stable' | 'volatile';
  confidence: number;
  changePercent: number;
  timeframe: string;
  predictions: {
    shortTerm: number;
    longTerm: number;
  };
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  coefficientOfVariation: number;
  confidenceInterval: [number, number];
  outliers: number[];
}

export class BenchmarkValidationFramework extends EventEmitter {
  private validationRules: ValidationRule[] = [];
  private historicalData: Map<string, BenchmarkResult[]> = new Map();
  private thresholds: ValidationThresholds;

  constructor(thresholds: ValidationThresholds) {
    super();
    this.thresholds = thresholds;
    this.initializeDefaultRules();
  }

  public async validateBenchmarkResult(
    result: BenchmarkResult,
    context: ValidationContext
  ): Promise<ValidationReport> {
    this.emit('validation-start', {
      testName: result.testName,
      timestamp: result.timestamp
    });

    const ruleResults = new Map<string, ValidationResult>();
    let totalScore = 0;
    let passedRules = 0;
    let criticalFailures = 0;

    // Run all validation rules
    for (const rule of this.validationRules) {
      try {
        const validationResult = rule.validate(result, context);
        ruleResults.set(rule.name, validationResult);

        if (validationResult.passed) {
          passedRules++;
        } else if (rule.severity === 'critical') {
          criticalFailures++;
        }

        totalScore += validationResult.score;

        this.emit('rule-validated', {
          rule: rule.name,
          passed: validationResult.passed,
          score: validationResult.score,
          severity: rule.severity
        });

      } catch (error) {
        const errorResult: ValidationResult = {
          passed: false,
          score: 0,
          message: `Validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestions: ['Check validation rule implementation']
        };

        ruleResults.set(rule.name, errorResult);

        this.emit('rule-error', {
          rule: rule.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Detect anomalies
    const anomalies = await this.detectAnomalies(result, context);

    // Analyze trends
    const trends = await this.analyzeTrends(result, context);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      result,
      ruleResults,
      anomalies,
      trends
    );

    const averageScore = totalScore / this.validationRules.length;
    const overallPassed = criticalFailures === 0 && averageScore >= 70;

    const report: ValidationReport = {
      overall: {
        passed: overallPassed,
        score: averageScore,
        totalRules: this.validationRules.length,
        passedRules,
        failedRules: this.validationRules.length - passedRules,
        criticalFailures
      },
      ruleResults,
      anomalies,
      trends,
      recommendations,
      timestamp: Date.now()
    };

    this.emit('validation-complete', {
      testName: result.testName,
      passed: overallPassed,
      score: averageScore,
      anomalies: anomalies.length,
      recommendations: recommendations.length
    });

    return report;
  }

  private initializeDefaultRules(): void {
    // Data Integrity Rules
    this.addRule({
      name: 'result_completeness',
      description: 'Verify all required result fields are present',
      category: 'data_integrity',
      severity: 'critical',
      validate: (result, context) => this.validateResultCompleteness(result)
    });

    this.addRule({
      name: 'numeric_validity',
      description: 'Verify numeric values are valid (not NaN, Infinity)',
      category: 'data_integrity',
      severity: 'high',
      validate: (result, context) => this.validateNumericValues(result)
    });

    this.addRule({
      name: 'timestamp_validity',
      description: 'Verify timestamps are reasonable and consistent',
      category: 'data_integrity',
      severity: 'medium',
      validate: (result, context) => this.validateTimestamps(result)
    });

    // Statistical Rules
    this.addRule({
      name: 'error_rate_threshold',
      description: 'Check if error rate is within acceptable limits',
      category: 'statistical',
      severity: 'high',
      validate: (result, context) => this.validateErrorRate(result, context.thresholds)
    });

    this.addRule({
      name: 'performance_variance',
      description: 'Check if performance variance is acceptable',
      category: 'statistical',
      severity: 'medium',
      validate: (result, context) => this.validatePerformanceVariance(result, context)
    });

    this.addRule({
      name: 'statistical_significance',
      description: 'Verify results have statistical significance',
      category: 'statistical',
      severity: 'medium',
      validate: (result, context) => this.validateStatisticalSignificance(result)
    });

    // Performance Rules
    this.addRule({
      name: 'latency_threshold',
      description: 'Check if latency is within acceptable limits',
      category: 'performance',
      severity: 'high',
      validate: (result, context) => this.validateLatencyThreshold(result, context.thresholds)
    });

    this.addRule({
      name: 'throughput_threshold',
      description: 'Check if throughput meets minimum requirements',
      category: 'performance',
      severity: 'high',
      validate: (result, context) => this.validateThroughputThreshold(result, context.thresholds)
    });

    this.addRule({
      name: 'resource_usage',
      description: 'Verify resource usage is within acceptable limits',
      category: 'performance',
      severity: 'medium',
      validate: (result, context) => this.validateResourceUsage(result, context.thresholds)
    });

    // Consistency Rules
    this.addRule({
      name: 'baseline_consistency',
      description: 'Check consistency with baseline results',
      category: 'consistency',
      severity: 'medium',
      validate: (result, context) => this.validateBaselineConsistency(result, context)
    });

    this.addRule({
      name: 'regression_detection',
      description: 'Detect performance regressions',
      category: 'consistency',
      severity: 'high',
      validate: (result, context) => this.validateRegression(result, context)
    });

    // Trend Rules
    this.addRule({
      name: 'trend_stability',
      description: 'Check if performance trends are stable',
      category: 'trend',
      severity: 'low',
      validate: (result, context) => this.validateTrendStability(result, context)
    });
  }

  private validateResultCompleteness(result: BenchmarkResult): ValidationResult {
    const requiredFields = ['testName', 'timestamp', 'duration', 'iterations', 'metrics', 'passed'];
    const missingFields = requiredFields.filter(field => !(field in result));

    if (missingFields.length === 0) {
      return {
        passed: true,
        score: 100,
        message: 'All required fields are present'
      };
    }

    return {
      passed: false,
      score: Math.max(0, 100 - (missingFields.length * 20)),
      message: `Missing required fields: ${missingFields.join(', ')}`,
      suggestions: ['Ensure benchmark implementation provides all required result fields']
    };
  }

  private validateNumericValues(result: BenchmarkResult): ValidationResult {
    const numericFields = [result.duration, result.iterations];
    const invalidValues: string[] = [];

    // Check metrics object
    if (result.metrics) {
      Object.entries(result.metrics).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === 'number' && (isNaN(subValue) || !isFinite(subValue))) {
              invalidValues.push(`${key}.${subKey}`);
            }
          });
        }
      });
    }

    numericFields.forEach((value, index) => {
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
        invalidValues.push(['duration', 'iterations'][index]);
      }
    });

    if (invalidValues.length === 0) {
      return {
        passed: true,
        score: 100,
        message: 'All numeric values are valid'
      };
    }

    return {
      passed: false,
      score: Math.max(0, 100 - (invalidValues.length * 15)),
      message: `Invalid numeric values found: ${invalidValues.join(', ')}`,
      suggestions: [
        'Check for division by zero or other mathematical errors',
        'Ensure proper error handling in metric calculations'
      ]
    };
  }

  private validateTimestamps(result: BenchmarkResult): ValidationResult {
    const now = Date.now();
    const timestamp = result.timestamp;

    // Check if timestamp is reasonable (within last 24 hours and not in future)
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const futureLimit = now + (60 * 60 * 1000); // 1 hour in future allowed for clock skew

    if (timestamp < dayAgo) {
      return {
        passed: false,
        score: 30,
        message: 'Timestamp is too old (more than 24 hours ago)',
        suggestions: ['Check system clock synchronization']
      };
    }

    if (timestamp > futureLimit) {
      return {
        passed: false,
        score: 20,
        message: 'Timestamp is in the future',
        suggestions: ['Check system clock synchronization']
      };
    }

    return {
      passed: true,
      score: 100,
      message: 'Timestamp is valid and reasonable'
    };
  }

  private validateErrorRate(result: BenchmarkResult, thresholds: ValidationThresholds): ValidationResult {
    const errorRate = result.metrics?.errorRate?.value || 0;

    if (errorRate <= thresholds.maxErrorRate) {
      return {
        passed: true,
        score: 100 - (errorRate / thresholds.maxErrorRate) * 20, // Penalize higher error rates
        message: `Error rate ${errorRate.toFixed(2)}% is within acceptable limits`
      };
    }

    const severity = errorRate > thresholds.maxErrorRate * 2 ? 'critical' : 'high';
    return {
      passed: false,
      score: Math.max(0, 100 - (errorRate / thresholds.maxErrorRate) * 50),
      message: `Error rate ${errorRate.toFixed(2)}% exceeds threshold of ${thresholds.maxErrorRate}%`,
      suggestions: [
        'Investigate root cause of errors',
        'Check system stability and resource availability',
        'Review test configuration for potential issues'
      ]
    };
  }

  private validatePerformanceVariance(result: BenchmarkResult, context: ValidationContext): ValidationResult {
    if (!context.historicalResults || context.historicalResults.length < 3) {
      return {
        passed: true,
        score: 80,
        message: 'Insufficient historical data for variance analysis',
        suggestions: ['Collect more benchmark runs for better variance analysis']
      };
    }

    // Calculate coefficient of variation for key metrics
    const latencies = context.historicalResults
      .concat([result])
      .map(r => r.metrics?.latency?.avg || 0)
      .filter(l => l > 0);

    if (latencies.length < 3) {
      return {
        passed: true,
        score: 70,
        message: 'Insufficient latency data for variance analysis'
      };
    }

    const stats = this.calculateStatistics(latencies);
    const coefficientOfVariation = stats.coefficientOfVariation;

    if (coefficientOfVariation <= context.thresholds.maxVarianceCoefficient) {
      return {
        passed: true,
        score: 100 - (coefficientOfVariation / context.thresholds.maxVarianceCoefficient) * 20,
        message: `Performance variance ${(coefficientOfVariation * 100).toFixed(2)}% is acceptable`
      };
    }

    return {
      passed: false,
      score: Math.max(20, 100 - (coefficientOfVariation / context.thresholds.maxVarianceCoefficient) * 80),
      message: `High performance variance detected: ${(coefficientOfVariation * 100).toFixed(2)}%`,
      suggestions: [
        'Check for system load variations during testing',
        'Ensure consistent test environment',
        'Consider longer warm-up periods'
      ]
    };
  }

  private validateStatisticalSignificance(result: BenchmarkResult): ValidationResult {
    const iterations = result.iterations;

    // Basic statistical significance check
    const minIterations = 30; // Rule of thumb for central limit theorem
    const recommendedIterations = 100;

    if (iterations >= recommendedIterations) {
      return {
        passed: true,
        score: 100,
        message: `${iterations} iterations provide strong statistical significance`
      };
    }

    if (iterations >= minIterations) {
      return {
        passed: true,
        score: 70 + ((iterations - minIterations) / (recommendedIterations - minIterations)) * 30,
        message: `${iterations} iterations provide basic statistical significance`
      };
    }

    return {
      passed: false,
      score: Math.max(20, (iterations / minIterations) * 60),
      message: `${iterations} iterations may not provide statistical significance`,
      suggestions: [
        `Increase iterations to at least ${minIterations} for basic significance`,
        `Use ${recommendedIterations}+ iterations for stronger confidence`
      ]
    };
  }

  private validateLatencyThreshold(result: BenchmarkResult, thresholds: ValidationThresholds): ValidationResult {
    const p99Latency = result.metrics?.latency?.p99 || 0;

    if (p99Latency <= thresholds.maxLatencyP99) {
      return {
        passed: true,
        score: 100 - (p99Latency / thresholds.maxLatencyP99) * 30,
        message: `P99 latency ${p99Latency.toFixed(2)}ms is within acceptable limits`
      };
    }

    return {
      passed: false,
      score: Math.max(0, 100 - (p99Latency / thresholds.maxLatencyP99) * 100),
      message: `P99 latency ${p99Latency.toFixed(2)}ms exceeds threshold of ${thresholds.maxLatencyP99}ms`,
      suggestions: [
        'Profile application for performance bottlenecks',
        'Check resource constraints (CPU, memory, I/O)',
        'Optimize critical code paths'
      ]
    };
  }

  private validateThroughputThreshold(result: BenchmarkResult, thresholds: ValidationThresholds): ValidationResult {
    const throughput = result.metrics?.throughput?.value || 0;

    if (throughput >= thresholds.minThroughput) {
      return {
        passed: true,
        score: Math.min(100, 70 + (throughput / thresholds.minThroughput) * 30),
        message: `Throughput ${throughput.toFixed(2)} meets minimum requirements`
      };
    }

    return {
      passed: false,
      score: Math.max(0, (throughput / thresholds.minThroughput) * 60),
      message: `Throughput ${throughput.toFixed(2)} below minimum threshold of ${thresholds.minThroughput}`,
      suggestions: [
        'Optimize algorithm efficiency',
        'Check for resource bottlenecks',
        'Consider parallel processing improvements'
      ]
    };
  }

  private validateResourceUsage(result: BenchmarkResult, thresholds: ValidationThresholds): ValidationResult {
    const issues: string[] = [];
    let score = 100;

    // Check memory usage (if available in details)
    if (result.details?.avgMemoryUsed) {
      const memoryMB = result.details.avgMemoryUsed / (1024 * 1024);
      if (memoryMB > thresholds.maxMemoryUsage) {
        issues.push(`High memory usage: ${memoryMB.toFixed(1)}MB`);
        score -= 30;
      }
    }

    // Check CPU usage (if available in details)
    if (result.details?.avgCpuUsage) {
      if (result.details.avgCpuUsage > thresholds.maxCpuUsage) {
        issues.push(`High CPU usage: ${result.details.avgCpuUsage.toFixed(1)}%`);
        score -= 25;
      }
    }

    if (issues.length === 0) {
      return {
        passed: true,
        score: Math.max(score, 80),
        message: 'Resource usage is within acceptable limits'
      };
    }

    return {
      passed: score >= 60,
      score: Math.max(score, 20),
      message: `Resource usage concerns: ${issues.join(', ')}`,
      suggestions: [
        'Monitor system resources during tests',
        'Optimize memory allocation patterns',
        'Consider test isolation improvements'
      ]
    };
  }

  private validateBaselineConsistency(result: BenchmarkResult, context: ValidationContext): ValidationResult {
    if (!context.baseline) {
      return {
        passed: true,
        score: 70,
        message: 'No baseline available for comparison',
        suggestions: ['Establish baseline for future comparisons']
      };
    }

    const currentLatency = result.metrics?.latency?.avg || 0;
    const baselineLatency = context.baseline.metrics?.latency?.avg || 0;

    if (baselineLatency === 0) {
      return {
        passed: true,
        score: 60,
        message: 'Invalid baseline data for comparison'
      };
    }

    const deviation = Math.abs(currentLatency - baselineLatency) / baselineLatency;
    const deviationPercent = deviation * 100;

    if (deviationPercent <= 10) {
      return {
        passed: true,
        score: 100 - deviationPercent,
        message: `Performance consistent with baseline (${deviationPercent.toFixed(1)}% deviation)`
      };
    }

    if (deviationPercent <= 25) {
      return {
        passed: true,
        score: 75 - (deviationPercent - 10),
        message: `Moderate deviation from baseline (${deviationPercent.toFixed(1)}%)`
      };
    }

    return {
      passed: false,
      score: Math.max(20, 50 - deviationPercent),
      message: `Significant deviation from baseline (${deviationPercent.toFixed(1)}%)`,
      suggestions: [
        'Investigate environmental changes',
        'Check for code changes affecting performance',
        'Consider updating baseline if change is intentional'
      ]
    };
  }

  private validateRegression(result: BenchmarkResult, context: ValidationContext): ValidationResult {
    if (!context.historicalResults || context.historicalResults.length < 2) {
      return {
        passed: true,
        score: 70,
        message: 'Insufficient data for regression analysis'
      };
    }

    const recentResults = context.historicalResults.slice(-5); // Last 5 results
    const avgLatencies = recentResults.map(r => r.metrics?.latency?.avg || 0);
    const currentLatency = result.metrics?.latency?.avg || 0;

    const recentAvg = avgLatencies.reduce((sum, l) => sum + l, 0) / avgLatencies.length;

    if (recentAvg === 0) {
      return {
        passed: true,
        score: 60,
        message: 'Cannot analyze regression due to invalid historical data'
      };
    }

    const regressionPercent = ((currentLatency - recentAvg) / recentAvg) * 100;

    if (regressionPercent <= context.thresholds.maxRegressionPercent) {
      return {
        passed: true,
        score: 100 - Math.max(0, regressionPercent * 2),
        message: regressionPercent < 0
          ? `Performance improved by ${Math.abs(regressionPercent).toFixed(1)}%`
          : `No significant regression detected (${regressionPercent.toFixed(1)}%)`
      };
    }

    return {
      passed: false,
      score: Math.max(0, 100 - (regressionPercent / context.thresholds.maxRegressionPercent) * 100),
      message: `Performance regression detected: ${regressionPercent.toFixed(1)}% slower`,
      suggestions: [
        'Review recent code changes for performance impact',
        'Profile application to identify bottlenecks',
        'Consider reverting recent changes if regression is unacceptable'
      ]
    };
  }

  private validateTrendStability(result: BenchmarkResult, context: ValidationContext): ValidationResult {
    if (!context.historicalResults || context.historicalResults.length < 5) {
      return {
        passed: true,
        score: 70,
        message: 'Insufficient data for trend analysis'
      };
    }

    const latencies = context.historicalResults
      .concat([result])
      .map(r => r.metrics?.latency?.avg || 0)
      .filter(l => l > 0);

    if (latencies.length < 5) {
      return {
        passed: true,
        score: 60,
        message: 'Insufficient valid latency data for trend analysis'
      };
    }

    // Calculate trend using simple linear regression
    const n = latencies.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xMean = (n - 1) / 2;
    const yMean = latencies.reduce((sum, l) => sum + l, 0) / n;

    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (latencies[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0);

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const trendPercent = (slope / yMean) * 100;

    const stability = Math.abs(trendPercent);

    if (stability <= 2) {
      return {
        passed: true,
        score: 100,
        message: `Performance trend is stable (${trendPercent.toFixed(2)}% trend)`
      };
    }

    if (stability <= 5) {
      return {
        passed: true,
        score: 80 - (stability - 2) * 5,
        message: `Moderate trend detected (${trendPercent.toFixed(2)}% ${trendPercent > 0 ? 'degradation' : 'improvement'})`
      };
    }

    return {
      passed: false,
      score: Math.max(30, 70 - stability * 5),
      message: `Unstable performance trend (${trendPercent.toFixed(2)}% ${trendPercent > 0 ? 'degradation' : 'improvement'})`,
      suggestions: [
        'Monitor performance trends over time',
        'Investigate causes of performance instability',
        'Consider implementing performance monitoring alerts'
      ]
    };
  }

  private async detectAnomalies(result: BenchmarkResult, context: ValidationContext): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    if (!context.historicalResults || context.historicalResults.length < 5) {
      return anomalies;
    }

    // Detect latency anomalies
    const latencies = context.historicalResults.map(r => r.metrics?.latency?.avg || 0).filter(l => l > 0);
    const currentLatency = result.metrics?.latency?.avg || 0;

    if (latencies.length >= 5 && currentLatency > 0) {
      const stats = this.calculateStatistics(latencies);
      const zScore = Math.abs((currentLatency - stats.mean) / stats.standardDeviation);

      if (zScore > 3) {
        anomalies.push({
          type: 'outlier',
          severity: 'high',
          metric: 'latency',
          description: `Latency is ${zScore.toFixed(1)} standard deviations from mean`,
          value: currentLatency,
          expectedRange: [stats.mean - 2 * stats.standardDeviation, stats.mean + 2 * stats.standardDeviation],
          confidence: Math.min(0.99, zScore / 5)
        });
      } else if (zScore > 2) {
        anomalies.push({
          type: 'outlier',
          severity: 'medium',
          metric: 'latency',
          description: `Latency shows unusual deviation from typical range`,
          value: currentLatency,
          expectedRange: [stats.mean - stats.standardDeviation, stats.mean + stats.standardDeviation],
          confidence: Math.min(0.95, zScore / 3)
        });
      }
    }

    // Detect throughput anomalies
    const throughputs = context.historicalResults
      .map(r => r.metrics?.throughput?.value || 0)
      .filter(t => t > 0);
    const currentThroughput = result.metrics?.throughput?.value || 0;

    if (throughputs.length >= 5 && currentThroughput > 0) {
      const stats = this.calculateStatistics(throughputs);
      const zScore = Math.abs((currentThroughput - stats.mean) / stats.standardDeviation);

      if (zScore > 2.5) {
        const severity = zScore > 3 ? 'high' : 'medium';
        anomalies.push({
          type: currentThroughput < stats.mean ? 'drop' : 'spike',
          severity,
          metric: 'throughput',
          description: `Throughput shows ${currentThroughput < stats.mean ? 'significant drop' : 'unusual spike'}`,
          value: currentThroughput,
          expectedRange: [stats.mean - 2 * stats.standardDeviation, stats.mean + 2 * stats.standardDeviation],
          confidence: Math.min(0.95, zScore / 4)
        });
      }
    }

    return anomalies;
  }

  private async analyzeTrends(result: BenchmarkResult, context: ValidationContext): Promise<TrendAnalysis> {
    if (!context.historicalResults || context.historicalResults.length < 3) {
      return {
        direction: 'stable',
        confidence: 0.1,
        changePercent: 0,
        timeframe: 'insufficient-data',
        predictions: { shortTerm: 0, longTerm: 0 }
      };
    }

    const recentResults = context.historicalResults.concat([result]);
    const latencies = recentResults.map(r => r.metrics?.latency?.avg || 0).filter(l => l > 0);

    if (latencies.length < 3) {
      return {
        direction: 'stable',
        confidence: 0.2,
        changePercent: 0,
        timeframe: 'invalid-data',
        predictions: { shortTerm: 0, longTerm: 0 }
      };
    }

    // Calculate trend using linear regression
    const n = latencies.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xMean = (n - 1) / 2;
    const yMean = latencies.reduce((sum, l) => sum + l, 0) / n;

    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (latencies[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0);

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const changePercent = (slope / yMean) * 100;

    // Calculate R-squared for confidence
    const yPredicted = xValues.map(x => yMean + slope * (x - xMean));
    const ssRes = latencies.reduce((sum, y, i) => sum + (y - yPredicted[i]) ** 2, 0);
    const ssTot = latencies.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    let direction: TrendAnalysis['direction'];
    if (Math.abs(changePercent) < 1) {
      direction = 'stable';
    } else if (changePercent > 0) {
      direction = 'degrading';
    } else {
      direction = 'improving';
    }

    // Check for volatility
    const volatility = this.calculateStatistics(latencies).coefficientOfVariation;
    if (volatility > 0.3) {
      direction = 'volatile';
    }

    // Predictions (simple extrapolation)
    const shortTermPrediction = yMean + slope * n;
    const longTermPrediction = yMean + slope * (n + 5);

    return {
      direction,
      confidence: Math.max(0.1, Math.min(0.9, rSquared)),
      changePercent: Math.abs(changePercent),
      timeframe: `${n} measurements`,
      predictions: {
        shortTerm: Math.max(0, shortTermPrediction),
        longTerm: Math.max(0, longTermPrediction)
      }
    };
  }

  private async generateRecommendations(
    result: BenchmarkResult,
    ruleResults: Map<string, ValidationResult>,
    anomalies: AnomalyDetection[],
    trends: TrendAnalysis
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze failed rules
    const failedRules = Array.from(ruleResults.entries()).filter(([_, result]) => !result.passed);
    const criticalFailures = failedRules.filter(([name, _]) => {
      const rule = this.validationRules.find(r => r.name === name);
      return rule?.severity === 'critical';
    });

    if (criticalFailures.length > 0) {
      recommendations.push('Address critical validation failures immediately');
    }

    // Analyze anomalies
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high' || a.severity === 'critical');
    if (highSeverityAnomalies.length > 0) {
      recommendations.push('Investigate detected performance anomalies');
    }

    // Analyze trends
    if (trends.direction === 'degrading' && trends.confidence > 0.6) {
      recommendations.push('Performance degradation trend detected - monitor closely');
    }

    if (trends.direction === 'volatile') {
      recommendations.push('Performance is volatile - improve test environment stability');
    }

    // Add specific recommendations based on rule failures
    for (const [_, ruleResult] of failedRules) {
      if (ruleResult.suggestions) {
        recommendations.push(...ruleResult.suggestions.slice(0, 1)); // Add first suggestion
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Performance validation passed - continue monitoring');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private calculateStatistics(values: number[]): StatisticalSummary {
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    const sortedValues = [...values].sort((a, b) => a - b);
    const median = n % 2 === 0
      ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
      : sortedValues[Math.floor(n / 2)];

    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
    const standardDeviation = Math.sqrt(variance);

    const skewness = values.reduce((sum, v) => sum + ((v - mean) / standardDeviation) ** 3, 0) / n;
    const kurtosis = values.reduce((sum, v) => sum + ((v - mean) / standardDeviation) ** 4, 0) / n - 3;

    const coefficientOfVariation = mean === 0 ? 0 : standardDeviation / mean;

    // 95% confidence interval
    const marginOfError = 1.96 * (standardDeviation / Math.sqrt(n));
    const confidenceInterval: [number, number] = [mean - marginOfError, mean + marginOfError];

    // Outliers (values beyond 2 standard deviations)
    const outliers = values.filter(v => Math.abs(v - mean) > 2 * standardDeviation);

    return {
      mean,
      median,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      coefficientOfVariation,
      confidenceInterval,
      outliers
    };
  }

  public addRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  public removeRule(name: string): boolean {
    const index = this.validationRules.findIndex(rule => rule.name === name);
    if (index !== -1) {
      this.validationRules.splice(index, 1);
      return true;
    }
    return false;
  }

  public getRules(): ValidationRule[] {
    return [...this.validationRules];
  }

  public addHistoricalData(testName: string, results: BenchmarkResult[]): void {
    this.historicalData.set(testName, results);
  }

  public getHistoricalData(testName: string): BenchmarkResult[] {
    return this.historicalData.get(testName) || [];
  }

  public async exportValidationReport(report: ValidationReport, filepath: string): Promise<void> {
    const reportData = {
      ...report,
      ruleResults: Object.fromEntries(report.ruleResults)
    };

    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
  }
}

// Default validation thresholds
export const defaultValidationThresholds: ValidationThresholds = {
  maxErrorRate: 5.0, // 5%
  minSuccessRate: 95.0, // 95%
  maxLatencyP99: 1000, // 1 second
  maxMemoryUsage: 1024, // 1GB
  maxCpuUsage: 80, // 80%
  maxRegressionPercent: 15, // 15%
  minThroughput: 100, // operations/second
  maxVarianceCoefficient: 0.3 // 30%
};

// Factory function for creating validation framework
export function createValidationFramework(
  thresholds: Partial<ValidationThresholds> = {}
): BenchmarkValidationFramework {
  const finalThresholds = { ...defaultValidationThresholds, ...thresholds };
  return new BenchmarkValidationFramework(finalThresholds);
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T08:10:45-04:00 | claude@sonnet-4 | Created comprehensive benchmark validation framework with statistical analysis, anomaly detection, data integrity checks, performance trend validation, and automated rule-based validation system | benchmark-validation-framework.ts | OK | -- | 0.00 | 5c2d8f1 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: validation-framework-creation-001
- inputs: ["Validation framework requirements", "Statistical analysis patterns", "Quality assurance standards"]
- tools_used: ["Write", "statistical analysis", "anomaly detection", "validation rules"]
- versions: {"model":"claude-sonnet-4","prompt":"validation-framework-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->