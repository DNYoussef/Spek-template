/**
 * Performance Regression Detection & Monitoring (QG-004)
 * 
 * Implements performance regression detection with automated rollback triggers
 * and continuous performance monitoring for quality gate decisions.
 */

import { EventEmitter } from 'events';

export interface PerformanceThresholds {
  regressionThreshold: number; // Maximum degradation % (default: 5%)
  responseTimeLimit: number; // Maximum response time ms (default: 500ms)
  throughputMinimum: number; // Minimum throughput (requests/sec)
  memoryThreshold: number; // Maximum memory usage MB
  cpuThreshold: number; // Maximum CPU usage %
  errorRateThreshold: number; // Maximum error rate %
}

export interface PerformanceMetrics {
  responseTime: {
    mean: number;
    median: number;
    p95: number;
    p99: number;
    max: number;
  };
  throughput: {
    requestsPerSecond: number;
    transactionsPerSecond: number;
    operationsPerSecond: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  errors: {
    errorRate: number;
    timeoutRate: number;
    failureRate: number;
  };
  availability: {
    uptime: number;
    mtbf: number; // Mean Time Between Failures
    mttr: number; // Mean Time To Recovery
  };
}

export interface PerformanceBaseline {
  timestamp: Date;
  version: string;
  metrics: PerformanceMetrics;
  environment: string;
  testConfiguration: any;
}

export interface RegressionAnalysis {
  detected: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  regressionPercentage: number;
  affectedMetrics: string[];
  impactAssessment: string;
  rootCause: string[];
  recommendations: string[];
  rollbackRecommended: boolean;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  threshold: number;
  actual: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  duration: number; // How long the issue has persisted (minutes)
}

export interface PerformanceResult {
  metrics: PerformanceMetrics;
  violations: any[];
  recommendations: string[];
  regression: RegressionAnalysis;
  alerts: PerformanceAlert[];
}

export class PerformanceMonitor extends EventEmitter {
  private thresholds: PerformanceThresholds;
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private historicalData: Map<string, PerformanceMetrics[]> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(thresholds: PerformanceThresholds) {
    super();
    this.thresholds = thresholds;
    this.initializeDefaultBaselines();
    this.startContinuousMonitoring();
  }

  /**
   * Initialize default performance baselines
   */
  private initializeDefaultBaselines(): void {
    const defaultBaseline: PerformanceBaseline = {
      timestamp: new Date(),
      version: '1.0.0',
      environment: 'baseline',
      testConfiguration: {},
      metrics: {
        responseTime: { mean: 200, median: 180, p95: 400, p99: 800, max: 1000 },
        throughput: { requestsPerSecond: 100, transactionsPerSecond: 80, operationsPerSecond: 120 },
        resources: { cpuUsage: 30, memoryUsage: 256, diskUsage: 10, networkLatency: 50 },
        errors: { errorRate: 0.1, timeoutRate: 0.05, failureRate: 0.02 },
        availability: { uptime: 99.9, mtbf: 720, mttr: 5 }
      }
    };

    this.baselines.set('default', defaultBaseline);
  }

  /**
   * Start continuous performance monitoring
   */
  private startContinuousMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performContinuousCheck();
      } catch (error) {
        this.emit('monitoring-error', error);
      }
    }, 30000);
  }

  /**
   * Detect performance regressions
   */
  async detectRegressions(
    artifacts: any[],
    context: Record<string, any>
  ): Promise<PerformanceResult> {
    const violations: any[] = [];
    const recommendations: string[] = [];

    try {
      // Extract performance data from artifacts
      const performanceData = await this.extractPerformanceData(artifacts, context);
      
      // Calculate current metrics
      const currentMetrics = await this.calculatePerformanceMetrics(performanceData);
      
      // Get baseline for comparison
      const baseline = this.getApplicableBaseline(context);
      
      // Perform regression analysis
      const regression = await this.analyzeRegression(currentMetrics, baseline);
      
      // Check for threshold violations
      const thresholdViolations = this.checkThresholdViolations(currentMetrics);
      violations.push(...thresholdViolations);
      
      // Generate performance alerts
      const alerts = await this.generatePerformanceAlerts(currentMetrics, regression);
      
      // Store historical data
      this.storeHistoricalData(currentMetrics, context);
      
      // Generate recommendations
      const performanceRecommendations = this.generatePerformanceRecommendations(
        currentMetrics,
        regression,
        alerts
      );
      recommendations.push(...performanceRecommendations);
      
      // Trigger automated actions if needed
      if (regression.rollbackRecommended) {
        this.emit('rollback-recommended', regression);
      }
      
      if (regression.severity === 'critical') {
        this.emit('critical-regression', regression);
      }

      return {
        metrics: currentMetrics,
        violations,
        recommendations,
        regression,
        alerts
      };

    } catch (error) {
      const errorResult: PerformanceResult = {
        metrics: this.getDefaultMetrics(),
        violations: [{
          severity: 'high',
          category: 'performance',
          description: `Performance monitoring failed: ${error.message}`,
          impact: 'Unable to detect performance regressions',
          remediation: 'Fix performance monitoring system',
          autoRemediable: false
        }],
        recommendations: ['Fix performance monitoring system'],
        regression: this.getDefaultRegression(),
        alerts: []
      };

      this.emit('performance-error', errorResult);
      return errorResult;
    }
  }

  /**
   * Extract performance data from artifacts
   */
  private async extractPerformanceData(
    artifacts: any[],
    context: Record<string, any>
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    // Extract from load test results
    const loadTests = artifacts.filter(a => a.type === 'load-test');
    if (loadTests.length > 0) {
      data.loadTest = this.extractLoadTestData(loadTests);
    }

    // Extract from application metrics
    const appMetrics = artifacts.filter(a => a.type === 'app-metrics');
    if (appMetrics.length > 0) {
      data.application = this.extractApplicationMetrics(appMetrics);
    }

    // Extract from infrastructure metrics
    const infraMetrics = artifacts.filter(a => a.type === 'infrastructure');
    if (infraMetrics.length > 0) {
      data.infrastructure = this.extractInfrastructureMetrics(infraMetrics);
    }

    // Extract from APM (Application Performance Monitoring) data
    const apmData = artifacts.filter(a => a.type === 'apm');
    if (apmData.length > 0) {
      data.apm = this.extractAPMData(apmData);
    }

    // Extract from synthetic monitoring
    const syntheticData = artifacts.filter(a => a.type === 'synthetic');
    if (syntheticData.length > 0) {
      data.synthetic = this.extractSyntheticData(syntheticData);
    }

    return data;
  }

  /**
   * Calculate comprehensive performance metrics
   */
  private async calculatePerformanceMetrics(
    data: Record<string, any>
  ): Promise<PerformanceMetrics> {
    // Calculate response time metrics
    const responseTime = this.calculateResponseTimeMetrics(data);
    
    // Calculate throughput metrics
    const throughput = this.calculateThroughputMetrics(data);
    
    // Calculate resource utilization metrics
    const resources = this.calculateResourceMetrics(data);
    
    // Calculate error metrics
    const errors = this.calculateErrorMetrics(data);
    
    // Calculate availability metrics
    const availability = this.calculateAvailabilityMetrics(data);

    return {
      responseTime,
      throughput,
      resources,
      errors,
      availability
    };
  }

  /**
   * Calculate response time metrics
   */
  private calculateResponseTimeMetrics(data: Record<string, any>): any {
    const responseTimes = this.extractResponseTimes(data);
    
    if (responseTimes.length === 0) {
      return { mean: 0, median: 0, p95: 0, p99: 0, max: 0 };
    }

    const sorted = responseTimes.sort((a, b) => a - b);
    const mean = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
    const median = this.calculatePercentile(sorted, 50);
    const p95 = this.calculatePercentile(sorted, 95);
    const p99 = this.calculatePercentile(sorted, 99);
    const max = Math.max(...responseTimes);

    return { mean, median, p95, p99, max };
  }

  /**
   * Calculate throughput metrics
   */
  private calculateThroughputMetrics(data: Record<string, any>): any {
    const loadTest = data.loadTest || {};
    const application = data.application || {};

    return {
      requestsPerSecond: loadTest.requestsPerSecond || application.requestsPerSecond || 0,
      transactionsPerSecond: loadTest.transactionsPerSecond || application.transactionsPerSecond || 0,
      operationsPerSecond: loadTest.operationsPerSecond || application.operationsPerSecond || 0
    };
  }

  /**
   * Calculate resource utilization metrics
   */
  private calculateResourceMetrics(data: Record<string, any>): any {
    const infrastructure = data.infrastructure || {};
    const application = data.application || {};

    return {
      cpuUsage: Math.max(infrastructure.cpuUsage || 0, application.cpuUsage || 0),
      memoryUsage: Math.max(infrastructure.memoryUsage || 0, application.memoryUsage || 0),
      diskUsage: infrastructure.diskUsage || 0,
      networkLatency: infrastructure.networkLatency || 0
    };
  }

  /**
   * Calculate error metrics
   */
  private calculateErrorMetrics(data: Record<string, any>): any {
    const application = data.application || {};
    const loadTest = data.loadTest || {};

    return {
      errorRate: Math.max(application.errorRate || 0, loadTest.errorRate || 0),
      timeoutRate: Math.max(application.timeoutRate || 0, loadTest.timeoutRate || 0),
      failureRate: Math.max(application.failureRate || 0, loadTest.failureRate || 0)
    };
  }

  /**
   * Calculate availability metrics
   */
  private calculateAvailabilityMetrics(data: Record<string, any>): any {
    const synthetic = data.synthetic || {};
    const infrastructure = data.infrastructure || {};

    return {
      uptime: Math.min(synthetic.uptime || 100, infrastructure.uptime || 100),
      mtbf: synthetic.mtbf || infrastructure.mtbf || 720,
      mttr: synthetic.mttr || infrastructure.mttr || 5
    };
  }

  /**
   * Extract response times from various data sources
   */
  private extractResponseTimes(data: Record<string, any>): number[] {
    const responseTimes: number[] = [];

    // From load test data
    if (data.loadTest?.responseTimes) {
      responseTimes.push(...data.loadTest.responseTimes);
    }

    // From APM data
    if (data.apm?.responseTimes) {
      responseTimes.push(...data.apm.responseTimes);
    }

    // From synthetic monitoring
    if (data.synthetic?.responseTimes) {
      responseTimes.push(...data.synthetic.responseTimes);
    }

    return responseTimes;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Analyze performance regression against baseline
   */
  private async analyzeRegression(
    currentMetrics: PerformanceMetrics,
    baseline: PerformanceBaseline
  ): Promise<RegressionAnalysis> {
    const baselineMetrics = baseline.metrics;
    const regressions: Array<{ metric: string; percentage: number; severity: string }> = [];

    // Check response time regression
    const responseTimeRegression = this.calculateRegressionPercentage(
      currentMetrics.responseTime.mean,
      baselineMetrics.responseTime.mean
    );
    
    if (responseTimeRegression > this.thresholds.regressionThreshold) {
      regressions.push({
        metric: 'response-time',
        percentage: responseTimeRegression,
        severity: this.categorizeRegressionSeverity(responseTimeRegression)
      });
    }

    // Check throughput regression
    const throughputRegression = this.calculateRegressionPercentage(
      baselineMetrics.throughput.requestsPerSecond,
      currentMetrics.throughput.requestsPerSecond
    );
    
    if (throughputRegression > this.thresholds.regressionThreshold) {
      regressions.push({
        metric: 'throughput',
        percentage: throughputRegression,
        severity: this.categorizeRegressionSeverity(throughputRegression)
      });
    }

    // Check error rate regression
    const errorRateRegression = this.calculateRegressionPercentage(
      currentMetrics.errors.errorRate,
      baselineMetrics.errors.errorRate
    );
    
    if (errorRateRegression > this.thresholds.regressionThreshold) {
      regressions.push({
        metric: 'error-rate',
        percentage: errorRateRegression,
        severity: this.categorizeRegressionSeverity(errorRateRegression)
      });
    }

    // Determine overall regression status
    const detected = regressions.length > 0;
    const maxRegression = Math.max(...regressions.map(r => r.percentage), 0);
    const severity = this.categorizeRegressionSeverity(maxRegression) as any;
    const affectedMetrics = regressions.map(r => r.metric);

    // Generate impact assessment and root causes
    const impactAssessment = this.generateImpactAssessment(regressions);
    const rootCause = this.identifyRootCauses(currentMetrics, baselineMetrics, regressions);
    const recommendations = this.generateRegressionRecommendations(regressions);
    
    // Determine if rollback is recommended
    const rollbackRecommended = severity === 'critical' || maxRegression > 20;

    return {
      detected,
      severity,
      regressionPercentage: maxRegression,
      affectedMetrics,
      impactAssessment,
      rootCause,
      recommendations,
      rollbackRecommended
    };
  }

  /**
   * Calculate regression percentage between current and baseline values
   */
  private calculateRegressionPercentage(current: number, baseline: number): number {
    if (baseline === 0) return 0;
    return Math.abs(((current - baseline) / baseline) * 100);
  }

  /**
   * Categorize regression severity based on percentage
   */
  private categorizeRegressionSeverity(percentage: number): string {
    if (percentage >= 20) return 'critical';
    if (percentage >= 10) return 'high';
    if (percentage >= 5) return 'medium';
    return 'low';
  }

  /**
   * Generate impact assessment for regressions
   */
  private generateImpactAssessment(regressions: any[]): string {
    if (regressions.length === 0) {
      return 'No performance impact detected';
    }

    const criticalCount = regressions.filter(r => r.severity === 'critical').length;
    const highCount = regressions.filter(r => r.severity === 'high').length;

    if (criticalCount > 0) {
      return `Critical performance degradation in ${criticalCount} metric(s). Immediate action required.`;
    } else if (highCount > 0) {
      return `High performance degradation in ${highCount} metric(s). Urgent attention needed.`;
    } else {
      return `Performance degradation detected in ${regressions.length} metric(s).`;
    }
  }

  /**
   * Identify potential root causes of regression
   */
  private identifyRootCauses(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics,
    regressions: any[]
  ): string[] {
    const rootCauses: string[] = [];

    // Check for resource constraints
    if (current.resources.cpuUsage > baseline.resources.cpuUsage * 1.5) {
      rootCauses.push('High CPU utilization indicating compute bottleneck');
    }

    if (current.resources.memoryUsage > baseline.resources.memoryUsage * 1.5) {
      rootCauses.push('High memory usage indicating memory leak or inefficient memory management');
    }

    // Check for error-related causes
    if (current.errors.errorRate > baseline.errors.errorRate * 2) {
      rootCauses.push('Increased error rate indicating application stability issues');
    }

    // Check for network-related causes
    if (current.resources.networkLatency > baseline.resources.networkLatency * 2) {
      rootCauses.push('High network latency indicating network or external service issues');
    }

    // Check for specific regression patterns
    if (regressions.some(r => r.metric === 'response-time' && r.percentage > 15)) {
      rootCauses.push('Response time regression may indicate inefficient algorithms or database queries');
    }

    if (regressions.some(r => r.metric === 'throughput' && r.percentage > 15)) {
      rootCauses.push('Throughput regression may indicate blocking operations or resource contention');
    }

    return rootCauses.length > 0 ? rootCauses : ['Performance regression detected - investigate recent changes'];
  }

  /**
   * Generate recommendations for addressing regressions
   */
  private generateRegressionRecommendations(regressions: any[]): string[] {
    const recommendations: string[] = [];

    if (regressions.some(r => r.metric === 'response-time')) {
      recommendations.push('Profile application to identify slow operations');
      recommendations.push('Optimize database queries and add appropriate indexes');
      recommendations.push('Review recent code changes for inefficient algorithms');
    }

    if (regressions.some(r => r.metric === 'throughput')) {
      recommendations.push('Analyze thread pools and connection pools for optimal sizing');
      recommendations.push('Review blocking operations and consider asynchronous alternatives');
      recommendations.push('Check for resource contention and optimize critical sections');
    }

    if (regressions.some(r => r.metric === 'error-rate')) {
      recommendations.push('Review application logs for error patterns');
      recommendations.push('Implement additional error handling and retry mechanisms');
      recommendations.push('Check external service dependencies for availability issues');
    }

    // Add general recommendations
    if (regressions.some(r => r.severity === 'critical')) {
      recommendations.push('Consider immediate rollback to previous stable version');
      recommendations.push('Implement canary deployment for safer releases');
    }

    return recommendations;
  }

  /**
   * Check for threshold violations
   */
  private checkThresholdViolations(metrics: PerformanceMetrics): any[] {
    const violations: any[] = [];

    // Response time violations
    if (metrics.responseTime.mean > this.thresholds.responseTimeLimit) {
      violations.push({
        severity: 'high',
        category: 'performance',
        description: `Mean response time ${metrics.responseTime.mean}ms exceeds limit ${this.thresholds.responseTimeLimit}ms`,
        impact: 'User experience degradation',
        remediation: 'Optimize application performance',
        autoRemediable: false
      });
    }

    // Throughput violations
    if (metrics.throughput.requestsPerSecond < this.thresholds.throughputMinimum) {
      violations.push({
        severity: 'medium',
        category: 'performance',
        description: `Throughput ${metrics.throughput.requestsPerSecond} RPS below minimum ${this.thresholds.throughputMinimum} RPS`,
        impact: 'Reduced system capacity',
        remediation: 'Scale infrastructure or optimize throughput',
        autoRemediable: true
      });
    }

    // Resource violations
    if (metrics.resources.memoryUsage > this.thresholds.memoryThreshold) {
      violations.push({
        severity: 'high',
        category: 'performance',
        description: `Memory usage ${metrics.resources.memoryUsage}MB exceeds threshold ${this.thresholds.memoryThreshold}MB`,
        impact: 'Risk of out-of-memory errors',
        remediation: 'Optimize memory usage or increase memory allocation',
        autoRemediable: false
      });
    }

    if (metrics.resources.cpuUsage > this.thresholds.cpuThreshold) {
      violations.push({
        severity: 'medium',
        category: 'performance',
        description: `CPU usage ${metrics.resources.cpuUsage}% exceeds threshold ${this.thresholds.cpuThreshold}%`,
        impact: 'System slowdown and reduced responsiveness',
        remediation: 'Optimize CPU-intensive operations or scale compute resources',
        autoRemediable: true
      });
    }

    // Error rate violations
    if (metrics.errors.errorRate > this.thresholds.errorRateThreshold) {
      violations.push({
        severity: 'high',
        category: 'performance',
        description: `Error rate ${metrics.errors.errorRate}% exceeds threshold ${this.thresholds.errorRateThreshold}%`,
        impact: 'Service reliability degradation',
        remediation: 'Investigate and fix application errors',
        autoRemediable: false
      });
    }

    return violations;
  }

  /**
   * Generate performance alerts
   */
  private async generatePerformanceAlerts(
    metrics: PerformanceMetrics,
    regression: RegressionAnalysis
  ): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    const timestamp = new Date();

    // Response time alert
    if (metrics.responseTime.mean > this.thresholds.responseTimeLimit) {
      alerts.push({
        id: `response-time-${timestamp.getTime()}`,
        timestamp,
        severity: 'high',
        metric: 'response-time',
        threshold: this.thresholds.responseTimeLimit,
        actual: metrics.responseTime.mean,
        trend: 'increasing',
        duration: 0 // Would be calculated based on historical data
      });
    }

    // Regression alert
    if (regression.detected && regression.severity === 'critical') {
      alerts.push({
        id: `regression-${timestamp.getTime()}`,
        timestamp,
        severity: 'critical',
        metric: 'performance-regression',
        threshold: this.thresholds.regressionThreshold,
        actual: regression.regressionPercentage,
        trend: 'increasing',
        duration: 0
      });
    }

    // Memory usage alert
    if (metrics.resources.memoryUsage > this.thresholds.memoryThreshold) {
      alerts.push({
        id: `memory-${timestamp.getTime()}`,
        timestamp,
        severity: 'high',
        metric: 'memory-usage',
        threshold: this.thresholds.memoryThreshold,
        actual: metrics.resources.memoryUsage,
        trend: 'increasing',
        duration: 0
      });
    }

    // Store alerts for tracking
    alerts.forEach(alert => {
      this.activeAlerts.set(alert.id, alert);
    });

    return alerts;
  }

  /**
   * Perform continuous performance check
   */
  private async performContinuousCheck(): Promise<void> {
    try {
      // This would integrate with real monitoring systems
      // For now, it's a placeholder for continuous monitoring logic
      this.emit('continuous-check-completed', {
        timestamp: new Date(),
        status: 'healthy'
      });
    } catch (error) {
      this.emit('continuous-check-failed', error);
    }
  }

  /**
   * Get applicable baseline for comparison
   */
  private getApplicableBaseline(context: Record<string, any>): PerformanceBaseline {
    // Logic to find the most appropriate baseline
    // Could be based on version, environment, test configuration, etc.
    const version = context.version || 'default';
    const environment = context.environment || 'default';
    
    // Try to find specific baseline
    const baselineKey = `${environment}-${version}`;
    if (this.baselines.has(baselineKey)) {
      return this.baselines.get(baselineKey)!;
    }

    // Fall back to default baseline
    return this.baselines.get('default')!;
  }

  /**
   * Store historical performance data
   */
  private storeHistoricalData(
    metrics: PerformanceMetrics,
    context: Record<string, any>
  ): void {
    const key = context.environment || 'default';
    
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, []);
    }

    const history = this.historicalData.get(key)!;
    history.push(metrics);

    // Keep only last 100 data points
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Generate performance recommendations
   */
  private generatePerformanceRecommendations(
    metrics: PerformanceMetrics,
    regression: RegressionAnalysis,
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    if (regression.detected) {
      recommendations.push(...regression.recommendations);
    }

    if (metrics.responseTime.p95 > this.thresholds.responseTimeLimit * 2) {
      recommendations.push('Implement response time monitoring and alerting');
      recommendations.push('Consider implementing caching strategy');
    }

    if (metrics.errors.errorRate > 1) {
      recommendations.push('Implement comprehensive error tracking and monitoring');
      recommendations.push('Add circuit breakers for external service calls');
    }

    if (alerts.length > 2) {
      recommendations.push('Review performance monitoring thresholds');
      recommendations.push('Implement automated performance remediation');
    }

    return recommendations;
  }

  /**
   * Extract data from various artifact types
   */
  private extractLoadTestData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractApplicationMetrics(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractInfrastructureMetrics(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractAPMData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractSyntheticData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  /**
   * Get default metrics for error cases
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      responseTime: { mean: 0, median: 0, p95: 0, p99: 0, max: 0 },
      throughput: { requestsPerSecond: 0, transactionsPerSecond: 0, operationsPerSecond: 0 },
      resources: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkLatency: 0 },
      errors: { errorRate: 0, timeoutRate: 0, failureRate: 0 },
      availability: { uptime: 0, mtbf: 0, mttr: 0 }
    };
  }

  /**
   * Get default regression analysis for error cases
   */
  private getDefaultRegression(): RegressionAnalysis {
    return {
      detected: false,
      severity: 'low',
      regressionPercentage: 0,
      affectedMetrics: [],
      impactAssessment: 'No regression detected',
      rootCause: [],
      recommendations: [],
      rollbackRecommended: false
    };
  }

  /**
   * Set performance baseline
   */
  setBaseline(
    version: string,
    environment: string,
    metrics: PerformanceMetrics,
    testConfiguration?: any
  ): void {
    const baseline: PerformanceBaseline = {
      timestamp: new Date(),
      version,
      environment,
      metrics,
      testConfiguration: testConfiguration || {}
    };

    const key = `${environment}-${version}`;
    this.baselines.set(key, baseline);
    
    this.emit('baseline-set', baseline);
  }

  /**
   * Get current performance metrics
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const history = this.historicalData.get('default');
    if (history && history.length > 0) {
      return history[history.length - 1];
    }
    return this.getDefaultMetrics();
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(environment: string = 'default'): any {
    const history = this.historicalData.get(environment) || [];
    if (history.length < 2) {
      return { trend: 'insufficient-data' };
    }

    const recent = history.slice(-10);
    const responseTimeTrend = this.calculateTrend(recent.map(h => h.responseTime.mean));
    const throughputTrend = this.calculateTrend(recent.map(h => h.throughput.requestsPerSecond));
    const errorRateTrend = this.calculateTrend(recent.map(h => h.errors.errorRate));

    return {
      responseTime: responseTimeTrend,
      throughput: throughputTrend,
      errorRate: errorRateTrend,
      overallTrend: (responseTimeTrend < 0 && throughputTrend > 0 && errorRateTrend < 0) ? 'improving' : 'degrading'
    };
  }

  /**
   * Calculate trend for a series of values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    
    return ((last - first) / first) * 100;
  }

  /**
   * Clear active alerts
   */
  clearAlert(alertId: string): void {
    this.activeAlerts.delete(alertId);
    this.emit('alert-cleared', alertId);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}