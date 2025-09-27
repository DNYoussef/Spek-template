/**
 * ProductionReadinessScorer - Advanced Production Readiness Assessment
 *
 * Comprehensive scoring system that evaluates system readiness across multiple dimensions
 * to achieve the target production readiness score of 80+ from current baseline of 24.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface ReadinessMetric {
  metricId: string;
  name: string;
  description: string;
  category: ReadinessCategory;
  weight: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  measurement: MetricMeasurement;
  thresholds: ScoreThreshold[];
  dependencies: string[];
}

export interface ReadinessCategory {
  categoryId: string;
  name: string;
  description: string;
  weight: number;
  criticalityLevel: 'critical' | 'important' | 'beneficial';
  minimumScore: number;
}

export interface MetricMeasurement {
  type: 'percentage' | 'count' | 'duration' | 'ratio' | 'boolean' | 'score';
  source: 'automated' | 'manual' | 'derived' | 'external';
  command?: string;
  parser?: string;
  aggregation?: 'sum' | 'average' | 'max' | 'min' | 'latest';
  frequency: 'realtime' | 'periodic' | 'on-demand';
}

export interface ScoreThreshold {
  threshold: number;
  score: number;
  level: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  message: string;
}

export interface ReadinessAssessment {
  assessmentId: string;
  timestamp: number;
  overallScore: number;
  targetScore: number;
  improvement: number;
  readinessLevel: 'production-ready' | 'near-ready' | 'needs-improvement' | 'not-ready';
  categoryScores: CategoryScore[];
  metricResults: MetricResult[];
  criticalIssues: ReadinessIssue[];
  recommendations: ReadinessRecommendation[];
  actionPlan: ActionItem[];
  trend: ScoreTrend;
}

export interface CategoryScore {
  categoryId: string;
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  metricCount: number;
  criticalIssues: number;
  improvement: number;
}

export interface MetricResult {
  metricId: string;
  name: string;
  category: string;
  currentValue: number;
  targetValue: number;
  score: number;
  status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  gap: number;
  trend: 'improving' | 'stable' | 'degrading' | 'unknown';
  lastMeasured: number;
  evidence: string[];
}

export interface ReadinessIssue {
  issueId: string;
  category: string;
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  impact: string;
  currentState: string;
  requiredState: string;
  effort: 'low' | 'medium' | 'high';
  timeline: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  blocksDeployment: boolean;
}

export interface ReadinessRecommendation {
  recommendationId: string;
  priority: number;
  category: string;
  title: string;
  description: string;
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  dependencies: string[];
  resources: string[];
}

export interface ActionItem {
  actionId: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignee?: string;
  estimatedEffort: number;
  deadline?: number;
  dependencies: string[];
  expectedImpact: number;
}

export interface ScoreTrend {
  direction: 'improving' | 'stable' | 'declining';
  velocity: number;
  projectedScore: number;
  projectedTimeline: number;
  confidence: number;
  historicalData: ScoreDataPoint[];
}

export interface ScoreDataPoint {
  timestamp: number;
  score: number;
  categories: Record<string, number>;
  notes?: string;
}

export interface ScoringOptions {
  includeManualMetrics?: boolean;
  useCache?: boolean;
  generateTrend?: boolean;
  detailedAnalysis?: boolean;
  compareBaseline?: boolean;
  projectFuture?: boolean;
}

export class ProductionReadinessScorer extends EventEmitter {
  private metrics: Map<string, ReadinessMetric> = new Map();
  private categories: Map<string, ReadinessCategory> = new Map();
  private assessments: Map<string, ReadinessAssessment> = new Map();
  private baseline: ReadinessAssessment | null = null;
  private projectRoot: string;
  private cacheDir: string;

  constructor(projectRoot: string) {
    super();
    this.projectRoot = projectRoot;
    this.cacheDir = path.join(projectRoot, '.claude', '.artifacts', 'readiness');
    this.initializeCategories();
    this.initializeMetrics();
    this.ensureCacheDirectory();
  }

  /**
   * Perform comprehensive production readiness assessment
   */
  async assessReadiness(
    assessmentId: string,
    options: ScoringOptions = {}
  ): Promise<ReadinessAssessment> {
    const assessment: ReadinessAssessment = {
      assessmentId,
      timestamp: Date.now(),
      overallScore: 0,
      targetScore: 80,
      improvement: 0,
      readinessLevel: 'not-ready',
      categoryScores: [],
      metricResults: [],
      criticalIssues: [],
      recommendations: [],
      actionPlan: [],
      trend: {
        direction: 'unknown',
        velocity: 0,
        projectedScore: 0,
        projectedTimeline: 0,
        confidence: 0,
        historicalData: []
      }
    };

    this.emit('assessmentStarted', { assessmentId, options });

    try {
      // Phase 1: Measure all metrics
      await this.measureMetrics(assessment, options);

      // Phase 2: Calculate category scores
      this.calculateCategoryScores(assessment);

      // Phase 3: Calculate overall score
      this.calculateOverallScore(assessment);

      // Phase 4: Identify critical issues
      await this.identifyCriticalIssues(assessment);

      // Phase 5: Generate recommendations
      await this.generateRecommendations(assessment);

      // Phase 6: Create action plan
      await this.createActionPlan(assessment);

      // Phase 7: Calculate trends and projections
      if (options.generateTrend !== false) {
        await this.calculateTrends(assessment, options);
      }

      // Phase 8: Determine readiness level
      this.determineReadinessLevel(assessment);

      // Phase 9: Calculate improvement from baseline
      if (options.compareBaseline !== false) {
        this.calculateImprovement(assessment);
      }

      // Phase 10: Cache results
      if (options.useCache !== false) {
        await this.cacheAssessment(assessment);
      }

      this.assessments.set(assessmentId, assessment);

      this.emit('assessmentCompleted', { assessmentId, assessment });
      return assessment;

    } catch (error) {
      this.emit('assessmentFailed', { assessmentId, error: error.message });
      throw error;
    }
  }

  /**
   * Set baseline assessment for improvement calculations
   */
  setBaseline(assessment: ReadinessAssessment): void {
    this.baseline = assessment;
    this.emit('baselineSet', { assessmentId: assessment.assessmentId, score: assessment.overallScore });
  }

  /**
   * Get readiness improvement plan to reach target score
   */
  async getImprovementPlan(
    currentAssessment: ReadinessAssessment,
    targetScore: number = 80
  ): Promise<{
    currentScore: number;
    targetScore: number;
    gap: number;
    prioritizedActions: ActionItem[];
    estimatedTimeline: number;
    quickWins: ActionItem[];
    criticalPath: ActionItem[];
  }> {
    const gap = targetScore - currentAssessment.overallScore;

    // Prioritize actions by impact/effort ratio
    const prioritizedActions = currentAssessment.actionPlan
      .sort((a, b) => (b.expectedImpact / b.estimatedEffort) - (a.expectedImpact / a.estimatedEffort));

    // Identify quick wins (high impact, low effort)
    const quickWins = prioritizedActions.filter(
      action => action.expectedImpact >= 5 && action.estimatedEffort <= 2
    );

    // Identify critical path (dependencies and blockers)
    const criticalPath = this.calculateCriticalPath(prioritizedActions);

    // Estimate timeline
    const estimatedTimeline = this.estimateImprovementTimeline(prioritizedActions, gap);

    return {
      currentScore: currentAssessment.overallScore,
      targetScore,
      gap,
      prioritizedActions,
      estimatedTimeline,
      quickWins,
      criticalPath
    };
  }

  /**
   * Initialize readiness categories
   */
  private initializeCategories(): void {
    this.categories.set('code-quality', {
      categoryId: 'code-quality',
      name: 'Code Quality & Standards',
      description: 'Code compilation, linting, formatting, and quality metrics',
      weight: 25,
      criticalityLevel: 'critical',
      minimumScore: 90
    });

    this.categories.set('testing', {
      categoryId: 'testing',
      name: 'Testing & Quality Assurance',
      description: 'Test coverage, test quality, and QA processes',
      weight: 20,
      criticalityLevel: 'critical',
      minimumScore: 95
    });

    this.categories.set('security', {
      categoryId: 'security',
      name: 'Security & Compliance',
      description: 'Security vulnerabilities, compliance, and audit requirements',
      weight: 20,
      criticalityLevel: 'critical',
      minimumScore: 100
    });

    this.categories.set('performance', {
      categoryId: 'performance',
      name: 'Performance & Reliability',
      description: 'System performance, scalability, and reliability metrics',
      weight: 15,
      criticalityLevel: 'important',
      minimumScore: 80
    });

    this.categories.set('documentation', {
      categoryId: 'documentation',
      name: 'Documentation & Knowledge',
      description: 'Documentation completeness, accuracy, and maintainability',
      weight: 10,
      criticalityLevel: 'important',
      minimumScore: 85
    });

    this.categories.set('deployment', {
      categoryId: 'deployment',
      name: 'Deployment & Operations',
      description: 'Deployment automation, monitoring, and operational readiness',
      weight: 10,
      criticalityLevel: 'beneficial',
      minimumScore: 75
    });
  }

  /**
   * Initialize readiness metrics
   */
  private initializeMetrics(): void {
    // Code Quality Metrics
    this.metrics.set('typescript-compilation', {
      metricId: 'typescript-compilation',
      name: 'TypeScript Compilation Success',
      description: 'Percentage of files that compile without errors',
      category: this.categories.get('code-quality')!,
      weight: 30,
      currentValue: 0,
      targetValue: 100,
      unit: '%',
      measurement: {
        type: 'percentage',
        source: 'automated',
        command: 'npx tsc --noEmit 2>&1 | grep -c "error" || echo "0"',
        parser: 'error-count-to-percentage',
        frequency: 'on-demand'
      },
      thresholds: [
        { threshold: 100, score: 100, level: 'excellent', message: 'All files compile successfully' },
        { threshold: 95, score: 90, level: 'good', message: 'Minor compilation issues' },
        { threshold: 90, score: 70, level: 'acceptable', message: 'Some compilation errors' },
        { threshold: 80, score: 40, level: 'poor', message: 'Many compilation errors' },
        { threshold: 0, score: 0, level: 'critical', message: 'Significant compilation failures' }
      ],
      dependencies: []
    });

    this.metrics.set('linting-compliance', {
      metricId: 'linting-compliance',
      name: 'ESLint Compliance',
      description: 'Percentage of files passing linting rules',
      category: this.categories.get('code-quality')!,
      weight: 20,
      currentValue: 0,
      targetValue: 100,
      unit: '%',
      measurement: {
        type: 'percentage',
        source: 'automated',
        command: 'npx eslint src/ --format json',
        parser: 'eslint-json-to-percentage',
        frequency: 'on-demand'
      },
      thresholds: [
        { threshold: 100, score: 100, level: 'excellent', message: 'All files pass linting' },
        { threshold: 95, score: 90, level: 'good', message: 'Minor linting issues' },
        { threshold: 90, score: 70, level: 'acceptable', message: 'Some linting violations' },
        { threshold: 80, score: 40, level: 'poor', message: 'Many linting violations' },
        { threshold: 0, score: 0, level: 'critical', message: 'Significant linting failures' }
      ],
      dependencies: ['typescript-compilation']
    });

    // Testing Metrics
    this.metrics.set('test-coverage', {
      metricId: 'test-coverage',
      name: 'Test Coverage',
      description: 'Percentage of code covered by tests',
      category: this.categories.get('testing')!,
      weight: 40,
      currentValue: 0,
      targetValue: 95,
      unit: '%',
      measurement: {
        type: 'percentage',
        source: 'automated',
        command: 'npm run test:coverage -- --reporter=json',
        parser: 'coverage-json-parser',
        frequency: 'on-demand'
      },
      thresholds: [
        { threshold: 95, score: 100, level: 'excellent', message: 'Excellent test coverage' },
        { threshold: 85, score: 85, level: 'good', message: 'Good test coverage' },
        { threshold: 75, score: 65, level: 'acceptable', message: 'Acceptable test coverage' },
        { threshold: 60, score: 40, level: 'poor', message: 'Poor test coverage' },
        { threshold: 0, score: 0, level: 'critical', message: 'Inadequate test coverage' }
      ],
      dependencies: ['typescript-compilation']
    });

    this.metrics.set('test-success-rate', {
      metricId: 'test-success-rate',
      name: 'Test Success Rate',
      description: 'Percentage of tests passing',
      category: this.categories.get('testing')!,
      weight: 35,
      currentValue: 0,
      targetValue: 100,
      unit: '%',
      measurement: {
        type: 'percentage',
        source: 'automated',
        command: 'npm test -- --reporter=json',
        parser: 'test-results-parser',
        frequency: 'on-demand'
      },
      thresholds: [
        { threshold: 100, score: 100, level: 'excellent', message: 'All tests passing' },
        { threshold: 95, score: 80, level: 'good', message: 'Most tests passing' },
        { threshold: 90, score: 60, level: 'acceptable', message: 'Some failing tests' },
        { threshold: 80, score: 30, level: 'poor', message: 'Many failing tests' },
        { threshold: 0, score: 0, level: 'critical', message: 'Significant test failures' }
      ],
      dependencies: ['typescript-compilation']
    });

    // Security Metrics
    this.metrics.set('vulnerability-count', {
      metricId: 'vulnerability-count',
      name: 'Security Vulnerabilities',
      description: 'Number of high/critical security vulnerabilities',
      category: this.categories.get('security')!,
      weight: 50,
      currentValue: 0,
      targetValue: 0,
      unit: 'count',
      measurement: {
        type: 'count',
        source: 'automated',
        command: 'npm audit --audit-level=high --json',
        parser: 'npm-audit-parser',
        frequency: 'on-demand'
      },
      thresholds: [
        { threshold: 0, score: 100, level: 'excellent', message: 'No security vulnerabilities' },
        { threshold: 1, score: 70, level: 'acceptable', message: 'Low security risk' },
        { threshold: 3, score: 40, level: 'poor', message: 'Moderate security risk' },
        { threshold: 5, score: 20, level: 'poor', message: 'High security risk' },
        { threshold: 10, score: 0, level: 'critical', message: 'Critical security risk' }
      ],
      dependencies: []
    });

    this.metrics.set('nasa-compliance', {
      metricId: 'nasa-compliance',
      name: 'NASA POT10 Compliance',
      description: 'NASA POT10 compliance percentage',
      category: this.categories.get('security')!,
      weight: 50,
      currentValue: 0,
      targetValue: 100,
      unit: '%',
      measurement: {
        type: 'percentage',
        source: 'automated',
        command: 'node scripts/nasa-compliance-check.js',
        parser: 'nasa-compliance-parser',
        frequency: 'on-demand'
      },
      thresholds: [
        { threshold: 100, score: 100, level: 'excellent', message: 'Full NASA POT10 compliance' },
        { threshold: 95, score: 85, level: 'good', message: 'High NASA compliance' },
        { threshold: 90, score: 70, level: 'acceptable', message: 'Acceptable NASA compliance' },
        { threshold: 80, score: 40, level: 'poor', message: 'Poor NASA compliance' },
        { threshold: 0, score: 0, level: 'critical', message: 'Non-compliant with NASA standards' }
      ],
      dependencies: []
    });

    // Performance Metrics
    this.metrics.set('build-time', {
      metricId: 'build-time',
      name: 'Build Performance',
      description: 'Time to complete full build',
      category: this.categories.get('performance')!,
      weight: 60,
      currentValue: 0,
      targetValue: 120,
      unit: 'seconds',
      measurement: {
        type: 'duration',
        source: 'automated',
        command: 'time npm run build',
        parser: 'time-parser',
        frequency: 'on-demand'
      },
      thresholds: [
        { threshold: 60, score: 100, level: 'excellent', message: 'Very fast build' },
        { threshold: 120, score: 85, level: 'good', message: 'Fast build' },
        { threshold: 300, score: 70, level: 'acceptable', message: 'Acceptable build time' },
        { threshold: 600, score: 40, level: 'poor', message: 'Slow build' },
        { threshold: 1800, score: 0, level: 'critical', message: 'Very slow build' }
      ],
      dependencies: ['typescript-compilation']
    });

    // Documentation Metrics
    this.metrics.set('documentation-coverage', {
      metricId: 'documentation-coverage',
      name: 'Documentation Coverage',
      description: 'Percentage of code documented',
      category: this.categories.get('documentation')!,
      weight: 70,
      currentValue: 0,
      targetValue: 85,
      unit: '%',
      measurement: {
        type: 'percentage',
        source: 'automated',
        command: 'node scripts/doc-coverage-check.js',
        parser: 'doc-coverage-parser',
        frequency: 'on-demand'
      },
      thresholds: [
        { threshold: 90, score: 100, level: 'excellent', message: 'Excellent documentation' },
        { threshold: 80, score: 85, level: 'good', message: 'Good documentation' },
        { threshold: 70, score: 70, level: 'acceptable', message: 'Acceptable documentation' },
        { threshold: 50, score: 40, level: 'poor', message: 'Poor documentation' },
        { threshold: 0, score: 0, level: 'critical', message: 'Inadequate documentation' }
      ],
      dependencies: []
    });
  }

  /**
   * Measure all metrics for assessment
   */
  private async measureMetrics(
    assessment: ReadinessAssessment,
    options: ScoringOptions
  ): Promise<void> {
    const metricPromises: Promise<void>[] = [];

    for (const metric of this.metrics.values()) {
      if (!options.includeManualMetrics && metric.measurement.source === 'manual') {
        continue;
      }

      metricPromises.push(this.measureMetric(assessment, metric, options));
    }

    await Promise.all(metricPromises);
  }

  /**
   * Measure individual metric
   */
  private async measureMetric(
    assessment: ReadinessAssessment,
    metric: ReadinessMetric,
    options: ScoringOptions
  ): Promise<void> {
    try {
      const currentValue = await this.executeMeasurement(metric.measurement);
      const score = this.calculateMetricScore(metric, currentValue);
      const status = this.getScoreStatus(metric, score);

      const result: MetricResult = {
        metricId: metric.metricId,
        name: metric.name,
        category: metric.category.categoryId,
        currentValue,
        targetValue: metric.targetValue,
        score,
        status,
        gap: metric.targetValue - currentValue,
        trend: 'unknown',
        lastMeasured: Date.now(),
        evidence: []
      };

      assessment.metricResults.push(result);

      this.emit('metricMeasured', {
        assessmentId: assessment.assessmentId,
        metricId: metric.metricId,
        result
      });

    } catch (error) {
      this.emit('metricMeasurementFailed', {
        assessmentId: assessment.assessmentId,
        metricId: metric.metricId,
        error: error.message
      });

      // Add failed metric with zero score
      assessment.metricResults.push({
        metricId: metric.metricId,
        name: metric.name,
        category: metric.category.categoryId,
        currentValue: 0,
        targetValue: metric.targetValue,
        score: 0,
        status: 'critical',
        gap: metric.targetValue,
        trend: 'unknown',
        lastMeasured: Date.now(),
        evidence: [`Error: ${error.message}`]
      });
    }
  }

  /**
   * Execute measurement based on type
   */
  private async executeMeasurement(measurement: MetricMeasurement): Promise<number> {
    if (measurement.source === 'manual') {
      throw new Error('Manual measurements not supported in automated assessment');
    }

    if (measurement.command) {
      const { execSync } = require('child_process');
      const result = execSync(measurement.command, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 30000
      });

      return this.parseCommandResult(result, measurement.parser || 'default');
    }

    return 0;
  }

  /**
   * Parse command execution results
   */
  private parseCommandResult(result: string, parser: string): number {
    switch (parser) {
      case 'error-count-to-percentage':
        const errorCount = parseInt(result.trim()) || 0;
        return Math.max(0, 100 - errorCount);

      case 'coverage-json-parser':
        try {
          const coverage = JSON.parse(result);
          return coverage.total?.statements?.pct || 0;
        } catch {
          return 0;
        }

      case 'test-results-parser':
        try {
          const results = JSON.parse(result);
          const total = results.numTotalTests || 0;
          const passed = results.numPassedTests || 0;
          return total > 0 ? (passed / total) * 100 : 0;
        } catch {
          return 0;
        }

      case 'npm-audit-parser':
        try {
          const audit = JSON.parse(result);
          return Object.keys(audit.vulnerabilities || {}).length;
        } catch {
          return 0;
        }

      case 'time-parser':
        const timeMatch = result.match(/(\d+)m(\d+)\.(\d+)s/);
        if (timeMatch) {
          return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
        }
        return 0;

      default:
        return parseFloat(result.trim()) || 0;
    }
  }

  /**
   * Calculate score for a metric based on thresholds
   */
  private calculateMetricScore(metric: ReadinessMetric, currentValue: number): number {
    // Sort thresholds in descending order for most metrics
    const sortedThresholds = [...metric.thresholds].sort((a, b) => {
      if (metric.measurement.type === 'count' && metric.targetValue === 0) {
        // For metrics where lower is better (like vulnerability count)
        return a.threshold - b.threshold;
      }
      return b.threshold - a.threshold;
    });

    for (const threshold of sortedThresholds) {
      if (metric.measurement.type === 'count' && metric.targetValue === 0) {
        if (currentValue <= threshold.threshold) {
          return threshold.score;
        }
      } else {
        if (currentValue >= threshold.threshold) {
          return threshold.score;
        }
      }
    }

    return 0;
  }

  /**
   * Get status level based on score
   */
  private getScoreStatus(metric: ReadinessMetric, score: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'acceptable';
    if (score >= 30) return 'poor';
    return 'critical';
  }

  /**
   * Calculate category scores
   */
  private calculateCategoryScores(assessment: ReadinessAssessment): void {
    for (const category of this.categories.values()) {
      const categoryMetrics = assessment.metricResults.filter(m => m.category === category.categoryId);

      if (categoryMetrics.length === 0) continue;

      const totalWeight = categoryMetrics.reduce((sum, m) => {
        const metric = this.metrics.get(m.metricId);
        return sum + (metric?.weight || 1);
      }, 0);

      const weightedScore = categoryMetrics.reduce((sum, m) => {
        const metric = this.metrics.get(m.metricId);
        return sum + (m.score * (metric?.weight || 1));
      }, 0);

      const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const weightedCategoryScore = score * (category.weight / 100);

      assessment.categoryScores.push({
        categoryId: category.categoryId,
        name: category.name,
        score,
        weight: category.weight,
        weightedScore: weightedCategoryScore,
        status: this.getCategoryStatus(score, category.minimumScore),
        metricCount: categoryMetrics.length,
        criticalIssues: categoryMetrics.filter(m => m.status === 'critical').length,
        improvement: 0 // Will be calculated when comparing to baseline
      });
    }
  }

  private getCategoryStatus(score: number, minimumScore: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' {
    if (score >= minimumScore && score >= 90) return 'excellent';
    if (score >= minimumScore && score >= 80) return 'good';
    if (score >= minimumScore) return 'acceptable';
    if (score >= (minimumScore * 0.8)) return 'poor';
    return 'critical';
  }

  /**
   * Calculate overall readiness score
   */
  private calculateOverallScore(assessment: ReadinessAssessment): void {
    const totalWeight = Array.from(this.categories.values())
      .reduce((sum, cat) => sum + cat.weight, 0);

    const weightedScore = assessment.categoryScores
      .reduce((sum, cat) => sum + cat.weightedScore, 0);

    assessment.overallScore = Math.round(weightedScore);
  }

  /**
   * Identify critical issues blocking production readiness
   */
  private async identifyCriticalIssues(assessment: ReadinessAssessment): Promise<void> {
    const issues: ReadinessIssue[] = [];

    // Check for critical metrics
    for (const result of assessment.metricResults) {
      if (result.status === 'critical') {
        const metric = this.metrics.get(result.metricId);
        if (metric) {
          issues.push({
            issueId: `critical-${result.metricId}`,
            category: result.category,
            severity: 'critical',
            title: `Critical Issue: ${result.name}`,
            description: `${result.name} is below acceptable thresholds`,
            impact: 'Blocks production deployment',
            currentState: `${result.currentValue} ${metric.unit}`,
            requiredState: `${result.targetValue} ${metric.unit}`,
            effort: this.estimateFixEffort(result),
            timeline: this.estimateFixTimeline(result),
            blocksDeployment: true
          });
        }
      }
    }

    // Check for category minimums
    for (const categoryScore of assessment.categoryScores) {
      const category = this.categories.get(categoryScore.categoryId);
      if (category && categoryScore.score < category.minimumScore) {
        issues.push({
          issueId: `category-${categoryScore.categoryId}`,
          category: categoryScore.categoryId,
          severity: category.criticalityLevel === 'critical' ? 'critical' : 'major',
          title: `${categoryScore.name} Below Minimum`,
          description: `Category score ${categoryScore.score} below minimum ${category.minimumScore}`,
          impact: category.criticalityLevel === 'critical' ? 'Blocks deployment' : 'Reduces reliability',
          currentState: `${categoryScore.score}%`,
          requiredState: `${category.minimumScore}%`,
          effort: 'medium',
          timeline: 'short-term',
          blocksDeployment: category.criticalityLevel === 'critical'
        });
      }
    }

    assessment.criticalIssues = issues;
  }

  private estimateFixEffort(result: MetricResult): 'low' | 'medium' | 'high' {
    const gapPercentage = Math.abs(result.gap) / result.targetValue;
    if (gapPercentage < 0.1) return 'low';
    if (gapPercentage < 0.3) return 'medium';
    return 'high';
  }

  private estimateFixTimeline(result: MetricResult): 'immediate' | 'short-term' | 'medium-term' | 'long-term' {
    if (result.status === 'critical') return 'immediate';
    if (result.status === 'poor') return 'short-term';
    if (result.status === 'acceptable') return 'medium-term';
    return 'long-term';
  }

  /**
   * Generate improvement recommendations
   */
  private async generateRecommendations(assessment: ReadinessAssessment): Promise<void> {
    const recommendations: ReadinessRecommendation[] = [];
    let recommendationId = 1;

    // Recommendations for critical issues
    for (const issue of assessment.criticalIssues) {
      recommendations.push({
        recommendationId: `rec-${recommendationId++}`,
        priority: issue.severity === 'critical' ? 1 : 2,
        category: issue.category,
        title: `Fix ${issue.title}`,
        description: `Address critical issue: ${issue.description}`,
        expectedImpact: this.estimateRecommendationImpact(issue),
        effort: issue.effort,
        timeline: issue.timeline,
        dependencies: [],
        resources: ['development-team']
      });
    }

    // Recommendations for low-performing categories
    for (const categoryScore of assessment.categoryScores) {
      if (categoryScore.status === 'poor' || categoryScore.status === 'critical') {
        recommendations.push({
          recommendationId: `rec-${recommendationId++}`,
          priority: categoryScore.status === 'critical' ? 1 : 3,
          category: categoryScore.categoryId,
          title: `Improve ${categoryScore.name}`,
          description: `Enhance ${categoryScore.name} to meet production standards`,
          expectedImpact: this.estimateCategoryImpact(categoryScore),
          effort: 'medium',
          timeline: 'short-term',
          dependencies: [],
          resources: ['development-team', 'qa-team']
        });
      }
    }

    assessment.recommendations = recommendations.sort((a, b) => a.priority - b.priority);
  }

  private estimateRecommendationImpact(issue: ReadinessIssue): number {
    switch (issue.severity) {
      case 'critical': return 15;
      case 'major': return 8;
      case 'minor': return 3;
      default: return 1;
    }
  }

  private estimateCategoryImpact(categoryScore: CategoryScore): number {
    const category = this.categories.get(categoryScore.categoryId);
    if (!category) return 1;

    const gap = category.minimumScore - categoryScore.score;
    return Math.max(1, Math.round(gap * (category.weight / 100) * 0.5));
  }

  /**
   * Create actionable improvement plan
   */
  private async createActionPlan(assessment: ReadinessAssessment): Promise<void> {
    const actions: ActionItem[] = [];
    let actionId = 1;

    // Actions from recommendations
    for (const recommendation of assessment.recommendations) {
      actions.push({
        actionId: `action-${actionId++}`,
        title: recommendation.title,
        description: recommendation.description,
        category: recommendation.category,
        priority: recommendation.priority,
        status: 'pending',
        estimatedEffort: this.convertEffortToHours(recommendation.effort),
        dependencies: recommendation.dependencies,
        expectedImpact: recommendation.expectedImpact
      });
    }

    // Specific actions for critical metrics
    for (const result of assessment.metricResults) {
      if (result.status === 'critical' || result.status === 'poor') {
        const specificActions = this.generateMetricSpecificActions(result, actionId);
        actions.push(...specificActions);
        actionId += specificActions.length;
      }
    }

    assessment.actionPlan = actions.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return (b.expectedImpact / b.estimatedEffort) - (a.expectedImpact / a.estimatedEffort);
    });
  }

  private convertEffortToHours(effort: 'low' | 'medium' | 'high'): number {
    switch (effort) {
      case 'low': return 4;
      case 'medium': return 16;
      case 'high': return 40;
      default: return 8;
    }
  }

  private generateMetricSpecificActions(result: MetricResult, startId: number): ActionItem[] {
    const actions: ActionItem[] = [];

    switch (result.metricId) {
      case 'typescript-compilation':
        actions.push({
          actionId: `action-${startId}`,
          title: 'Fix TypeScript Compilation Errors',
          description: 'Resolve all TypeScript compilation errors',
          category: 'code-quality',
          priority: 1,
          status: 'pending',
          estimatedEffort: 8,
          dependencies: [],
          expectedImpact: 10
        });
        break;

      case 'test-coverage':
        actions.push({
          actionId: `action-${startId}`,
          title: 'Increase Test Coverage',
          description: `Add tests to reach ${result.targetValue}% coverage`,
          category: 'testing',
          priority: 2,
          status: 'pending',
          estimatedEffort: 16,
          dependencies: ['action-typescript-compilation'],
          expectedImpact: 8
        });
        break;

      case 'vulnerability-count':
        actions.push({
          actionId: `action-${startId}`,
          title: 'Fix Security Vulnerabilities',
          description: 'Address all high and critical security vulnerabilities',
          category: 'security',
          priority: 1,
          status: 'pending',
          estimatedEffort: 12,
          dependencies: [],
          expectedImpact: 12
        });
        break;
    }

    return actions;
  }

  /**
   * Calculate trends and projections
   */
  private async calculateTrends(
    assessment: ReadinessAssessment,
    options: ScoringOptions
  ): Promise<void> {
    // Load historical data
    const historicalData = await this.loadHistoricalData();

    if (historicalData.length < 2) {
      assessment.trend = {
        direction: 'unknown',
        velocity: 0,
        projectedScore: assessment.overallScore,
        projectedTimeline: 0,
        confidence: 0,
        historicalData: []
      };
      return;
    }

    // Calculate trend direction and velocity
    const recentScores = historicalData.slice(-5).map(d => d.score);
    const oldestScore = recentScores[0];
    const newestScore = recentScores[recentScores.length - 1];

    const direction = newestScore > oldestScore ? 'improving' :
                     newestScore < oldestScore ? 'declining' : 'stable';

    const velocity = (newestScore - oldestScore) / recentScores.length;

    // Project future score
    const projectedScore = Math.min(100, Math.max(0, assessment.overallScore + (velocity * 10)));

    // Estimate timeline to reach target
    const targetScore = assessment.targetScore;
    const scoreGap = targetScore - assessment.overallScore;
    const projectedTimeline = velocity > 0 ? Math.ceil(scoreGap / velocity) : 0;

    assessment.trend = {
      direction,
      velocity,
      projectedScore,
      projectedTimeline,
      confidence: this.calculateTrendConfidence(historicalData),
      historicalData
    };
  }

  private async loadHistoricalData(): Promise<ScoreDataPoint[]> {
    try {
      const historyFile = path.join(this.cacheDir, 'score-history.json');
      if (fs.existsSync(historyFile)) {
        const data = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        return data.dataPoints || [];
      }
    } catch (error) {
      // Ignore errors loading historical data
    }
    return [];
  }

  private calculateTrendConfidence(data: ScoreDataPoint[]): number {
    if (data.length < 3) return 0.3;
    if (data.length < 5) return 0.6;
    return 0.8;
  }

  /**
   * Determine overall readiness level
   */
  private determineReadinessLevel(assessment: ReadinessAssessment): void {
    const score = assessment.overallScore;
    const criticalBlocking = assessment.criticalIssues.filter(i => i.blocksDeployment).length;

    if (score >= 80 && criticalBlocking === 0) {
      assessment.readinessLevel = 'production-ready';
    } else if (score >= 70 && criticalBlocking <= 1) {
      assessment.readinessLevel = 'near-ready';
    } else if (score >= 50) {
      assessment.readinessLevel = 'needs-improvement';
    } else {
      assessment.readinessLevel = 'not-ready';
    }
  }

  /**
   * Calculate improvement from baseline
   */
  private calculateImprovement(assessment: ReadinessAssessment): void {
    if (this.baseline) {
      assessment.improvement = assessment.overallScore - this.baseline.overallScore;

      // Calculate category improvements
      for (const categoryScore of assessment.categoryScores) {
        const baselineCategory = this.baseline.categoryScores.find(
          c => c.categoryId === categoryScore.categoryId
        );
        if (baselineCategory) {
          categoryScore.improvement = categoryScore.score - baselineCategory.score;
        }
      }
    }
  }

  /**
   * Cache assessment results
   */
  private async cacheAssessment(assessment: ReadinessAssessment): Promise<void> {
    try {
      // Save full assessment
      const assessmentFile = path.join(this.cacheDir, `assessment-${assessment.assessmentId}.json`);
      fs.writeFileSync(assessmentFile, JSON.stringify(assessment, null, 2));

      // Update score history
      const historyFile = path.join(this.cacheDir, 'score-history.json');
      let history = { dataPoints: [] };

      if (fs.existsSync(historyFile)) {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      }

      const categoryScores: Record<string, number> = {};
      for (const cat of assessment.categoryScores) {
        categoryScores[cat.categoryId] = cat.score;
      }

      history.dataPoints.push({
        timestamp: assessment.timestamp,
        score: assessment.overallScore,
        categories: categoryScores
      });

      // Keep only last 50 data points
      if (history.dataPoints.length > 50) {
        history.dataPoints = history.dataPoints.slice(-50);
      }

      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

    } catch (error) {
      this.emit('cacheError', { assessmentId: assessment.assessmentId, error: error.message });
    }
  }

  private calculateCriticalPath(actions: ActionItem[]): ActionItem[] {
    // Simple critical path calculation based on dependencies
    const dependencyMap = new Map<string, ActionItem[]>();

    for (const action of actions) {
      for (const dep of action.dependencies) {
        if (!dependencyMap.has(dep)) {
          dependencyMap.set(dep, []);
        }
        dependencyMap.get(dep)!.push(action);
      }
    }

    // Find actions with most dependencies (simplified critical path)
    return actions
      .filter(action => action.dependencies.length > 0)
      .sort((a, b) => b.dependencies.length - a.dependencies.length)
      .slice(0, 5);
  }

  private estimateImprovementTimeline(actions: ActionItem[], gap: number): number {
    const totalImpact = actions.reduce((sum, action) => sum + action.expectedImpact, 0);
    const avgEffort = actions.reduce((sum, action) => sum + action.estimatedEffort, 0) / actions.length;

    // Estimate weeks based on effort and impact
    return Math.ceil((gap / totalImpact) * avgEffort / 40); // 40 hours per week
  }

  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
}

export default ProductionReadinessScorer;