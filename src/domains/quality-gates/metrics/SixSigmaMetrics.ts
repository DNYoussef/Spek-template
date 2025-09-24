/**
 * Six Sigma Metrics Integration (QG-001)
 * 
 * Implements comprehensive Six Sigma metrics with CTQ validation
 * and automated quality scoring for quality gate decisions.
 */

import { EventEmitter } from 'events';

export interface SixSigmaThresholds {
  defectRate: number; // PPM (Parts Per Million)
  processCapability: number; // Cp/Cpk minimum
  yieldThreshold: number; // Minimum yield percentage
}

export interface CTQSpecification {
  name: string;
  target: number;
  upperLimit: number;
  lowerLimit: number;
  weight: number; // Importance weight (0-1)
  category: 'performance' | 'quality' | 'security' | 'compliance';
}

export interface SixSigmaMetricsResult {
  metrics: SixSigmaMetricsData;
  violations: any[];
  recommendations: string[];
  ctqValidation: CTQValidationResult;
}

export interface SixSigmaMetricsData {
  defectRate: number; // PPM
  processCapability: {
    cp: number; // Process Capability
    cpk: number; // Process Capability Index
    pp: number; // Process Performance
    ppk: number; // Process Performance Index
  };
  yield: {
    firstTimeYield: number;
    rolledThroughputYield: number;
    normalizedYield: number;
  };
  sigma: {
    level: number; // Current sigma level (1-6)
    score: number; // Overall sigma score
  };
  dpmo: number; // Defects Per Million Opportunities
  qualityScore: number; // Overall quality score (0-100)
}

export interface CTQValidationResult {
  overallScore: number;
  ctqResults: CTQResult[];
  criticalToQuality: boolean;
  weightedScore: number;
}

export interface CTQResult {
  name: string;
  target: number;
  actual: number;
  deviation: number;
  withinLimits: boolean;
  capabilityIndex: number;
  score: number;
}

export class SixSigmaMetrics extends EventEmitter {
  private thresholds: SixSigmaThresholds;
  private ctqSpecs: CTQSpecification[] = [];
  private historicalData: Map<string, any[]> = new Map();

  constructor(thresholds: SixSigmaThresholds) {
    super();
    this.thresholds = thresholds;
    this.initializeCTQSpecs();
  }

  /**
   * Initialize Critical-to-Quality specifications
   */
  private initializeCTQSpecs(): void {
    this.ctqSpecs = [
      {
        name: 'Code Coverage',
        target: 90,
        upperLimit: 100,
        lowerLimit: 80,
        weight: 0.2,
        category: 'quality'
      },
      {
        name: 'Response Time',
        target: 200,
        upperLimit: 500,
        lowerLimit: 0,
        weight: 0.25,
        category: 'performance'
      },
      {
        name: 'Security Score',
        target: 95,
        upperLimit: 100,
        lowerLimit: 90,
        weight: 0.2,
        category: 'security'
      },
      {
        name: 'Compliance Score',
        target: 95,
        upperLimit: 100,
        lowerLimit: 90,
        weight: 0.2,
        category: 'compliance'
      },
      {
        name: 'Defect Density',
        target: 0.1,
        upperLimit: 0.5,
        lowerLimit: 0,
        weight: 0.15,
        category: 'quality'
      }
    ];
  }

  /**
   * Validate Six Sigma metrics for quality gate
   */
  async validateMetrics(
    artifacts: any[],
    context: Record<string, any>
  ): Promise<SixSigmaMetricsResult> {
    const violations: any[] = [];
    const recommendations: string[] = [];

    try {
      // Extract metrics from artifacts and context
      const metricsData = await this.extractMetricsData(artifacts, context);
      
      // Calculate Six Sigma metrics
      const sixSigmaMetrics = await this.calculateSixSigmaMetrics(metricsData);
      
      // Validate CTQ specifications
      const ctqValidation = await this.validateCTQSpecifications(metricsData);
      
      // Check violations against thresholds
      const thresholdViolations = this.checkThresholdViolations(sixSigmaMetrics);
      violations.push(...thresholdViolations);
      
      // Generate recommendations
      const metricRecommendations = this.generateRecommendations(sixSigmaMetrics, ctqValidation);
      recommendations.push(...metricRecommendations);
      
      // Store historical data
      this.storeHistoricalData(sixSigmaMetrics, ctqValidation);
      
      return {
        metrics: sixSigmaMetrics,
        violations,
        recommendations,
        ctqValidation
      };

    } catch (error) {
      violations.push({
        severity: 'high',
        category: 'six-sigma',
        description: `Six Sigma metrics calculation failed: ${error.message}`,
        impact: 'Unable to validate quality metrics',
        remediation: 'Review metrics data sources and calculation logic',
        autoRemediable: false
      });

      return {
        metrics: this.getDefaultMetrics(),
        violations,
        recommendations: ['Fix metrics calculation issues'],
        ctqValidation: this.getDefaultCTQValidation()
      };
    }
  }

  /**
   * Extract metrics data from artifacts and context
   */
  private async extractMetricsData(
    artifacts: any[],
    context: Record<string, any>
  ): Promise<Record<string, any>> {
    const metricsData: Record<string, any> = {};

    // Extract from test results
    const testResults = artifacts.filter(a => a.type === 'test-results');
    if (testResults.length > 0) {
      metricsData.tests = this.extractTestMetrics(testResults);
    }

    // Extract from performance data
    const performanceData = artifacts.filter(a => a.type === 'performance');
    if (performanceData.length > 0) {
      metricsData.performance = this.extractPerformanceMetrics(performanceData);
    }

    // Extract from security scans
    const securityData = artifacts.filter(a => a.type === 'security');
    if (securityData.length > 0) {
      metricsData.security = this.extractSecurityMetrics(securityData);
    }

    // Extract from compliance reports
    const complianceData = artifacts.filter(a => a.type === 'compliance');
    if (complianceData.length > 0) {
      metricsData.compliance = this.extractComplianceMetrics(complianceData);
    }

    // Extract from code quality data
    const qualityData = artifacts.filter(a => a.type === 'code-quality');
    if (qualityData.length > 0) {
      metricsData.quality = this.extractQualityMetrics(qualityData);
    }

    return metricsData;
  }

  /**
   * Calculate comprehensive Six Sigma metrics
   */
  private async calculateSixSigmaMetrics(
    metricsData: Record<string, any>
  ): Promise<SixSigmaMetricsData> {
    // Calculate defect rate (PPM)
    const defectRate = this.calculateDefectRate(metricsData);
    
    // Calculate process capability indices
    const processCapability = this.calculateProcessCapability(metricsData);
    
    // Calculate yield metrics
    const yieldMetrics = this.calculateYieldMetrics(metricsData);

    // Calculate sigma level
    const sigma = this.calculateSigmaLevel(defectRate, yieldMetrics);
    
    // Calculate DPMO (Defects Per Million Opportunities)
    const dpmo = this.calculateDPMO(metricsData);
    
    // Calculate overall quality score
    const qualityScore = this.calculateQualityScore(defectRate, processCapability, yieldMetrics, sigma);

    return {
      defectRate,
      processCapability,
      yield: yieldMetrics,
      sigma,
      dpmo,
      qualityScore
    };
  }

  /**
   * Calculate defect rate in PPM (Parts Per Million)
   */
  private calculateDefectRate(metricsData: Record<string, any>): number {
    const totalDefects = (metricsData.tests?.failed || 0) + 
                        (metricsData.security?.vulnerabilities || 0) + 
                        (metricsData.quality?.violations || 0);
    
    const totalOpportunities = (metricsData.tests?.total || 1) + 
                              (metricsData.security?.checks || 1) + 
                              (metricsData.quality?.checks || 1);
    
    return (totalDefects / totalOpportunities) * 1000000;
  }

  /**
   * Calculate process capability indices (Cp, Cpk, Pp, Ppk)
   */
  private calculateProcessCapability(metricsData: Record<string, any>): {
    cp: number;
    cpk: number;
    pp: number;
    ppk: number;
  } {
    // Simplified calculation - in practice would use statistical process control
    const performanceVariation = metricsData.performance?.standardDeviation || 1;
    const performanceTarget = metricsData.performance?.target || 100;
    const performanceMean = metricsData.performance?.mean || performanceTarget;
    
    const tolerance = performanceTarget * 0.1; // 10% tolerance
    
    const cp = tolerance / (6 * performanceVariation);
    const cpk = Math.min(
      (performanceTarget + tolerance - performanceMean) / (3 * performanceVariation),
      (performanceMean - (performanceTarget - tolerance)) / (3 * performanceVariation)
    );
    
    // Pp and Ppk would use long-term variation data
    const pp = cp * 0.9; // Simplified
    const ppk = cpk * 0.9; // Simplified
    
    return { cp, cpk, pp, ppk };
  }

  /**
   * Calculate yield metrics
   */
  private calculateYieldMetrics(metricsData: Record<string, any>): {
    firstTimeYield: number;
    rolledThroughputYield: number;
    normalizedYield: number;
  } {
    const testsPassed = metricsData.tests?.passed || 0;
    const testsTotal = metricsData.tests?.total || 1;
    const firstTimeYield = (testsPassed / testsTotal) * 100;
    
    // Simplified RTY calculation
    const rolledThroughputYield = firstTimeYield * 0.95; // Account for integration issues
    
    // Normalized yield accounting for complexity
    const complexity = metricsData.quality?.complexity || 1;
    const normalizedYield = firstTimeYield / Math.log(complexity + 1);
    
    return {
      firstTimeYield,
      rolledThroughputYield,
      normalizedYield
    };
  }

  /**
   * Calculate sigma level and score
   */
  private calculateSigmaLevel(defectRate: number, yieldMetrics: any): {
    level: number;
    score: number;
  } {
    // Convert defect rate to sigma level
    let level: number;
    if (defectRate <= 3.4) level = 6;
    else if (defectRate <= 233) level = 5;
    else if (defectRate <= 6210) level = 4;
    else if (defectRate <= 66807) level = 3;
    else if (defectRate <= 308538) level = 2;
    else level = 1;
    
    // Calculate overall sigma score
    const yieldFactor = yieldMetrics.firstTimeYield / 100;
    const score = level * yieldFactor * 100;
    
    return { level, score };
  }

  /**
   * Calculate DPMO (Defects Per Million Opportunities)
   */
  private calculateDPMO(metricsData: Record<string, any>): number {
    const defects = (metricsData.tests?.failed || 0) + 
                   (metricsData.security?.vulnerabilities || 0);
    const units = metricsData.tests?.total || 1;
    const opportunities = 10; // Average opportunities per unit
    
    return (defects / (units * opportunities)) * 1000000;
  }

  /**
   * Calculate overall quality score (0-100)
   */
  private calculateQualityScore(
    defectRate: number,
    processCapability: any,
    yieldMetrics: any,
    sigma: any
  ): number {
    const defectScore = Math.max(0, 100 - (defectRate / 1000));
    const capabilityScore = Math.min(100, processCapability.cpk * 50);
    const yieldScore = yieldMetrics.firstTimeYield;
    const sigmaScore = sigma.score;
    
    return (defectScore * 0.3 + capabilityScore * 0.2 + yieldScore * 0.3 + sigmaScore * 0.2);
  }

  /**
   * Validate CTQ (Critical-to-Quality) specifications
   */
  private async validateCTQSpecifications(
    metricsData: Record<string, any>
  ): Promise<CTQValidationResult> {
    const ctqResults: CTQResult[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const ctqSpec of this.ctqSpecs) {
      const actual = this.getActualValueForCTQ(ctqSpec, metricsData);
      const deviation = Math.abs(actual - ctqSpec.target);
      const withinLimits = actual >= ctqSpec.lowerLimit && actual <= ctqSpec.upperLimit;
      
      // Calculate capability index for this CTQ
      const range = ctqSpec.upperLimit - ctqSpec.lowerLimit;
      const capabilityIndex = range > 0 ? (range - 2 * deviation) / range : 0;
      
      // Calculate CTQ score (0-100)
      const score = withinLimits ? 
        Math.max(0, 100 - (deviation / ctqSpec.target) * 100) : 
        Math.max(0, 50 - (deviation / ctqSpec.target) * 100);

      ctqResults.push({
        name: ctqSpec.name,
        target: ctqSpec.target,
        actual,
        deviation,
        withinLimits,
        capabilityIndex,
        score
      });

      // Calculate weighted score
      totalWeightedScore += score * ctqSpec.weight;
      totalWeight += ctqSpec.weight;
    }

    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const weightedScore = totalWeightedScore;
    const criticalToQuality = ctqResults.every(r => r.withinLimits);

    return {
      overallScore,
      ctqResults,
      criticalToQuality,
      weightedScore
    };
  }

  /**
   * Get actual value for CTQ specification from metrics data
   */
  private getActualValueForCTQ(
    ctqSpec: CTQSpecification,
    metricsData: Record<string, any>
  ): number {
    switch (ctqSpec.name) {
      case 'Code Coverage':
        return metricsData.tests?.coverage || 0;
      case 'Response Time':
        return metricsData.performance?.averageResponseTime || 1000;
      case 'Security Score':
        return metricsData.security?.score || 0;
      case 'Compliance Score':
        return metricsData.compliance?.score || 0;
      case 'Defect Density':
        return metricsData.quality?.defectDensity || 1;
      default:
        return 0;
    }
  }

  /**
   * Check threshold violations
   */
  private checkThresholdViolations(metrics: SixSigmaMetricsData): any[] {
    const violations: any[] = [];

    if (metrics.defectRate > this.thresholds.defectRate) {
      violations.push({
        severity: 'high',
        category: 'six-sigma',
        description: `Defect rate ${metrics.defectRate} PPM exceeds threshold ${this.thresholds.defectRate} PPM`,
        impact: 'Quality gate failure due to high defect rate',
        remediation: 'Investigate and fix defects to reduce defect rate',
        autoRemediable: false
      });
    }

    if (metrics.processCapability.cpk < this.thresholds.processCapability) {
      violations.push({
        severity: 'medium',
        category: 'six-sigma',
        description: `Process capability Cpk ${metrics.processCapability.cpk} below threshold ${this.thresholds.processCapability}`,
        impact: 'Process not capable of meeting specifications consistently',
        remediation: 'Improve process control and reduce variation',
        autoRemediable: false
      });
    }

    if (metrics.yield.firstTimeYield < this.thresholds.yieldThreshold) {
      violations.push({
        severity: 'medium',
        category: 'six-sigma',
        description: `First-time yield ${metrics.yield.firstTimeYield}% below threshold ${this.thresholds.yieldThreshold}%`,
        impact: 'Low yield indicates quality issues',
        remediation: 'Improve first-time yield through better quality controls',
        autoRemediable: false
      });
    }

    return violations;
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    metrics: SixSigmaMetricsData,
    ctqValidation: CTQValidationResult
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.sigma.level < 4) {
      recommendations.push('Consider implementing DMAIC methodology to improve sigma level');
    }

    if (metrics.defectRate > 1000) {
      recommendations.push('Focus on defect prevention and root cause analysis');
    }

    if (metrics.processCapability.cpk < 1.33) {
      recommendations.push('Implement statistical process control to improve capability');
    }

    if (!ctqValidation.criticalToQuality) {
      const failedCTQs = ctqValidation.ctqResults.filter(r => !r.withinLimits);
      recommendations.push(`Address CTQ failures: ${failedCTQs.map(r => r.name).join(', ')}`);
    }

    if (metrics.qualityScore < 80) {
      recommendations.push('Implement comprehensive quality improvement program');
    }

    return recommendations;
  }

  /**
   * Store historical data for trending analysis
   */
  private storeHistoricalData(
    metrics: SixSigmaMetricsData,
    ctqValidation: CTQValidationResult
  ): void {
    const timestamp = new Date().toISOString();
    const dataPoint = {
      timestamp,
      metrics,
      ctqValidation
    };

    const key = 'six-sigma-metrics';
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, []);
    }

    const history = this.historicalData.get(key)!;
    history.push(dataPoint);

    // Keep only last 100 data points
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Extract test metrics from artifacts
   */
  private extractTestMetrics(testResults: any[]): any {
    const aggregated = testResults.reduce((acc, result) => ({
      total: acc.total + (result.total || 0),
      passed: acc.passed + (result.passed || 0),
      failed: acc.failed + (result.failed || 0),
      coverage: Math.max(acc.coverage, result.coverage || 0)
    }), { total: 0, passed: 0, failed: 0, coverage: 0 });

    return aggregated;
  }

  /**
   * Extract performance metrics from artifacts
   */
  private extractPerformanceMetrics(performanceData: any[]): any {
    const latest = performanceData[performanceData.length - 1];
    return {
      averageResponseTime: latest?.averageResponseTime || 1000,
      standardDeviation: latest?.standardDeviation || 100,
      mean: latest?.mean || 500,
      target: latest?.target || 200
    };
  }

  /**
   * Extract security metrics from artifacts
   */
  private extractSecurityMetrics(securityData: any[]): any {
    const aggregated = securityData.reduce((acc, data) => ({
      vulnerabilities: acc.vulnerabilities + (data.vulnerabilities || 0),
      checks: acc.checks + (data.checks || 0),
      score: Math.min(acc.score, data.score || 100)
    }), { vulnerabilities: 0, checks: 0, score: 100 });

    return aggregated;
  }

  /**
   * Extract compliance metrics from artifacts
   */
  private extractComplianceMetrics(complianceData: any[]): any {
    const latest = complianceData[complianceData.length - 1];
    return {
      score: latest?.score || 0
    };
  }

  /**
   * Extract code quality metrics from artifacts
   */
  private extractQualityMetrics(qualityData: any[]): any {
    const aggregated = qualityData.reduce((acc, data) => ({
      violations: acc.violations + (data.violations || 0),
      checks: acc.checks + (data.checks || 0),
      complexity: Math.max(acc.complexity, data.complexity || 1),
      defectDensity: Math.max(acc.defectDensity, data.defectDensity || 0)
    }), { violations: 0, checks: 0, complexity: 1, defectDensity: 0 });

    return aggregated;
  }

  /**
   * Get default metrics for error cases
   */
  private getDefaultMetrics(): SixSigmaMetricsData {
    return {
      defectRate: 999999,
      processCapability: { cp: 0, cpk: 0, pp: 0, ppk: 0 },
      yield: { firstTimeYield: 0, rolledThroughputYield: 0, normalizedYield: 0 },
      sigma: { level: 1, score: 0 },
      dpmo: 999999,
      qualityScore: 0
    };
  }

  /**
   * Get default CTQ validation for error cases
   */
  private getDefaultCTQValidation(): CTQValidationResult {
    return {
      overallScore: 0,
      ctqResults: [],
      criticalToQuality: false,
      weightedScore: 0
    };
  }

  /**
   * Get current metrics for dashboard
   */
  async getCurrentMetrics(): Promise<SixSigmaMetricsData> {
    const history = this.historicalData.get('six-sigma-metrics');
    if (history && history.length > 0) {
      return history[history.length - 1].metrics;
    }
    return this.getDefaultMetrics();
  }

  /**
   * Get trend analysis
   */
  getTrendAnalysis(): any {
    const history = this.historicalData.get('six-sigma-metrics') || [];
    if (history.length < 2) {
      return { trend: 'insufficient-data' };
    }

    const recent = history.slice(-10);
    const defectRateTrend = this.calculateTrend(recent.map(h => h.metrics.defectRate));
    const qualityScoreTrend = this.calculateTrend(recent.map(h => h.metrics.qualityScore));
    const sigmaLevelTrend = this.calculateTrend(recent.map(h => h.metrics.sigma.level));

    return {
      defectRate: defectRateTrend,
      qualityScore: qualityScoreTrend,
      sigmaLevel: sigmaLevelTrend,
      overallTrend: (defectRateTrend < 0 && qualityScoreTrend > 0 && sigmaLevelTrend > 0) ? 'improving' : 'declining'
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
}