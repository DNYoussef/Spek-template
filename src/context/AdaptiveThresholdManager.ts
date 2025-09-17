/**
 * Adaptive Threshold Manager - Dynamic Performance Thresholds
 * Phase 3: Self-adjusting thresholds based on system performance and patterns
 */

interface ThresholdMetric {
  name: string;
  value: number;
  baseline: number;
  min: number;
  max: number;
  sensitivity: number;
  timestamp: number;
}

interface ThresholdRule {
  condition: string;
  operator: 'gt' | 'lt' | 'eq' | 'between';
  value: number | [number, number];
  action: 'increase' | 'decrease' | 'reset' | 'alert';
  magnitude: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface AdaptationHistory {
  timestamp: number;
  threshold: string;
  oldValue: number;
  newValue: number;
  reason: string;
  confidence: number;
}

interface SystemCondition {
  load: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  degradationRate: number;
}

export class AdaptiveThresholdManager {
  private thresholds: Map<string, ThresholdMetric> = new Map();
  private rules: Map<string, ThresholdRule[]> = new Map();
  private history: AdaptationHistory[] = [];
  private conditions: SystemCondition[] = [];
  private readonly maxHistory = 1000;
  private readonly maxConditions = 100;
  private readonly learningRate = 0.1;
  private readonly confidenceThreshold = 0.7;

  constructor() {
    this.initializeDefaultThresholds();
    this.initializeAdaptationRules();
  }

  /**
   * Initialize default system thresholds
   */
  private initializeDefaultThresholds(): void {
    const defaults = [
      // Context Management Thresholds
      { name: 'context_degradation', value: 0.15, baseline: 0.15, min: 0.05, max: 0.50, sensitivity: 0.8 },
      { name: 'semantic_drift', value: 0.30, baseline: 0.30, min: 0.10, max: 0.70, sensitivity: 0.7 },
      { name: 'context_coherence', value: 0.85, baseline: 0.85, min: 0.60, max: 0.95, sensitivity: 0.6 },
      { name: 'pruning_efficiency', value: 0.80, baseline: 0.80, min: 0.50, max: 0.95, sensitivity: 0.5 },

      // Performance Thresholds
      { name: 'response_time', value: 2000, baseline: 2000, min: 500, max: 10000, sensitivity: 0.9 },
      { name: 'throughput', value: 100, baseline: 100, min: 10, max: 1000, sensitivity: 0.8 },
      { name: 'error_rate', value: 0.05, baseline: 0.05, min: 0.01, max: 0.20, sensitivity: 0.9 },
      { name: 'memory_utilization', value: 0.80, baseline: 0.80, min: 0.50, max: 0.95, sensitivity: 0.7 },

      // Consensus Thresholds
      { name: 'consensus_timeout', value: 30000, baseline: 30000, min: 5000, max: 120000, sensitivity: 0.6 },
      { name: 'byzantine_tolerance', value: 0.33, baseline: 0.33, min: 0.20, max: 0.45, sensitivity: 0.8 },
      { name: 'quorum_size', value: 4, baseline: 4, min: 3, max: 10, sensitivity: 0.5 },

      // Health Monitoring Thresholds
      { name: 'health_check_interval', value: 30000, baseline: 30000, min: 5000, max: 300000, sensitivity: 0.4 },
      { name: 'recovery_timeout', value: 60000, baseline: 60000, min: 10000, max: 600000, sensitivity: 0.6 },
      { name: 'circuit_breaker_threshold', value: 5, baseline: 5, min: 2, max: 20, sensitivity: 0.7 }
    ];

    for (const threshold of defaults) {
      this.thresholds.set(threshold.name, {
        ...threshold,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Initialize adaptation rules for automatic threshold adjustment
   */
  private initializeAdaptationRules(): void {
    const rules = [
      // Context degradation rules
      {
        threshold: 'context_degradation',
        rules: [
          {
            condition: 'error_rate > 0.10',
            operator: 'gt' as const,
            value: 0.10,
            action: 'decrease' as const,
            magnitude: 0.02,
            priority: 'high' as const
          },
          {
            condition: 'response_time > 5000',
            operator: 'gt' as const,
            value: 5000,
            action: 'increase' as const,
            magnitude: 0.01,
            priority: 'medium' as const
          }
        ]
      },

      // Semantic drift rules
      {
        threshold: 'semantic_drift',
        rules: [
          {
            condition: 'context_coherence < 0.70',
            operator: 'lt' as const,
            value: 0.70,
            action: 'decrease' as const,
            magnitude: 0.05,
            priority: 'high' as const
          },
          {
            condition: 'throughput < 50',
            operator: 'lt' as const,
            value: 50,
            action: 'increase' as const,
            magnitude: 0.03,
            priority: 'medium' as const
          }
        ]
      },

      // Response time rules
      {
        threshold: 'response_time',
        rules: [
          {
            condition: 'error_rate < 0.02',
            operator: 'lt' as const,
            value: 0.02,
            action: 'decrease' as const,
            magnitude: 200,
            priority: 'low' as const
          },
          {
            condition: 'memory_utilization > 0.90',
            operator: 'gt' as const,
            value: 0.90,
            action: 'increase' as const,
            magnitude: 500,
            priority: 'high' as const
          }
        ]
      },

      // Memory utilization rules
      {
        threshold: 'memory_utilization',
        rules: [
          {
            condition: 'degradation_rate > 0.20',
            operator: 'gt' as const,
            value: 0.20,
            action: 'decrease' as const,
            magnitude: 0.05,
            priority: 'critical' as const
          },
          {
            condition: 'throughput > 200',
            operator: 'gt' as const,
            value: 200,
            action: 'increase' as const,
            magnitude: 0.02,
            priority: 'low' as const
          }
        ]
      }
    ];

    for (const ruleSet of rules) {
      this.rules.set(ruleSet.threshold, ruleSet.rules);
    }
  }

  /**
   * Update system conditions for threshold adaptation
   */
  updateSystemConditions(condition: SystemCondition): void {
    // Input validation
    if (!condition || typeof condition !== 'object') {
      console.warn('Invalid system condition provided');
      return;
    }

    // Validate condition properties
    const requiredProps = ['load', 'errorRate', 'responseTime', 'throughput', 'memoryUsage', 'degradationRate'];
    for (const prop of requiredProps) {
      if (typeof condition[prop as keyof SystemCondition] !== 'number' || isNaN(condition[prop as keyof SystemCondition])) {
        console.warn(`Invalid ${prop} in system condition`);
        return;
      }
    }

    try {
      this.conditions.push({
        ...condition,
        timestamp: Date.now()
      } as any);

      // Maintain sliding window
      if (this.conditions.length > this.maxConditions) {
        this.conditions.shift();
      }

      // Trigger adaptation analysis
      this.analyzeAndAdapt();
    } catch (error) {
      console.error('Failed to update system conditions:', error);
    }
  }

  /**
   * Analyze conditions and adapt thresholds
   */
  private analyzeAndAdapt(): void {
    if (this.conditions.length < 10) return; // Need enough data

    const recentConditions = this.conditions.slice(-10);
    const averageCondition = this.calculateAverageCondition(recentConditions);

    // Apply adaptation rules
    for (const [thresholdName, rules] of this.rules) {
      for (const rule of rules) {
        if (this.evaluateRule(rule, averageCondition)) {
          this.adaptThreshold(thresholdName, rule, averageCondition);
        }
      }
    }

    // Machine learning-based adaptation
    this.performMLAdaptation(averageCondition);
  }

  /**
   * Calculate average system condition
   */
  private calculateAverageCondition(conditions: SystemCondition[]): SystemCondition {
    const sum = conditions.reduce((acc, condition) => ({
      load: acc.load + condition.load,
      errorRate: acc.errorRate + condition.errorRate,
      responseTime: acc.responseTime + condition.responseTime,
      throughput: acc.throughput + condition.throughput,
      memoryUsage: acc.memoryUsage + condition.memoryUsage,
      degradationRate: acc.degradationRate + condition.degradationRate
    }), {
      load: 0,
      errorRate: 0,
      responseTime: 0,
      throughput: 0,
      memoryUsage: 0,
      degradationRate: 0
    });

    const count = conditions.length;
    return {
      load: sum.load / count,
      errorRate: sum.errorRate / count,
      responseTime: sum.responseTime / count,
      throughput: sum.throughput / count,
      memoryUsage: sum.memoryUsage / count,
      degradationRate: sum.degradationRate / count
    };
  }

  /**
   * Evaluate if a rule condition is met
   */
  private evaluateRule(rule: ThresholdRule, condition: SystemCondition): boolean {
    const conditionValue = this.extractConditionValue(rule.condition, condition);

    switch (rule.operator) {
      case 'gt':
        return conditionValue > (rule.value as number);
      case 'lt':
        return conditionValue < (rule.value as number);
      case 'eq':
        return Math.abs(conditionValue - (rule.value as number)) < 0.01;
      case 'between':
        const [min, max] = rule.value as [number, number];
        return conditionValue >= min && conditionValue <= max;
      default:
        return false;
    }
  }

  /**
   * Extract condition value from rule string with error handling
   */
  private extractConditionValue(condition: string, systemCondition: SystemCondition): number {
    if (!condition || typeof condition !== 'string') {
      console.warn('Invalid condition string');
      return 0;
    }

    if (!systemCondition || typeof systemCondition !== 'object') {
      console.warn('Invalid system condition object');
      return 0;
    }

    try {
      // Extract metric name and get corresponding value
      if (condition.includes('error_rate')) {
        return isNaN(systemCondition.errorRate) ? 0 : systemCondition.errorRate;
      }
      if (condition.includes('response_time')) {
        return isNaN(systemCondition.responseTime) ? 0 : systemCondition.responseTime;
      }
      if (condition.includes('throughput')) {
        return isNaN(systemCondition.throughput) ? 0 : systemCondition.throughput;
      }
      if (condition.includes('memory_utilization')) {
        return isNaN(systemCondition.memoryUsage) ? 0 : systemCondition.memoryUsage;
      }
      if (condition.includes('degradation_rate')) {
        return isNaN(systemCondition.degradationRate) ? 0 : systemCondition.degradationRate;
      }
      if (condition.includes('load')) {
        return isNaN(systemCondition.load) ? 0 : systemCondition.load;
      }

      // Extract numerical value from condition string as fallback
      const match = condition.match(/[\d.]+/);
      const value = match ? parseFloat(match[0]) : 0;
      return isNaN(value) ? 0 : value;
    } catch (error) {
      console.error('Failed to extract condition value:', error);
      return 0;
    }
  }

  /**
   * Adapt threshold based on rule
   */
  private adaptThreshold(
    thresholdName: string,
    rule: ThresholdRule,
    condition: SystemCondition
  ): void {
    const threshold = this.thresholds.get(thresholdName);
    if (!threshold) return;

    let newValue = threshold.value;
    const adaptation = rule.magnitude * threshold.sensitivity;

    switch (rule.action) {
      case 'increase':
        newValue = Math.min(threshold.max, threshold.value + adaptation);
        break;
      case 'decrease':
        newValue = Math.max(threshold.min, threshold.value - adaptation);
        break;
      case 'reset':
        newValue = threshold.baseline;
        break;
      case 'alert':
        this.triggerAlert(thresholdName, rule, condition);
        return;
    }

    // Apply change if significant enough
    const changeRatio = Math.abs(newValue - threshold.value) / threshold.value;
    if (changeRatio > 0.01) { // At least 1% change
      this.recordAdaptation(thresholdName, threshold.value, newValue, rule.condition);

      threshold.value = newValue;
      threshold.timestamp = Date.now();

      this.thresholds.set(thresholdName, threshold);
    }
  }

  /**
   * Machine learning-based threshold adaptation
   */
  private performMLAdaptation(condition: SystemCondition): void {
    // Simple gradient descent-like adaptation
    const performanceScore = this.calculatePerformanceScore(condition);
    const targetScore = 0.85; // Target performance

    for (const [name, threshold] of this.thresholds) {
      const impact = this.calculateThresholdImpact(name, performanceScore);

      if (Math.abs(impact) > 0.01) { // Significant impact
        const adjustment = (targetScore - performanceScore) * impact * this.learningRate;
        const newValue = this.clampValue(
          threshold.value + adjustment,
          threshold.min,
          threshold.max
        );

        if (Math.abs(newValue - threshold.value) / threshold.value > 0.02) {
          this.recordAdaptation(
            name,
            threshold.value,
            newValue,
            `ML adaptation: performance=${performanceScore.toFixed(3)}`
          );

          threshold.value = newValue;
          threshold.timestamp = Date.now();
          this.thresholds.set(name, threshold);
        }
      }
    }
  }

  /**
   * Calculate overall system performance score
   */
  private calculatePerformanceScore(condition: SystemCondition): number {
    // Weighted combination of performance metrics
    const weights = {
      errorRate: -0.3,      // Lower is better
      responseTime: -0.2,   // Lower is better
      throughput: 0.2,      // Higher is better
      memoryUsage: -0.15,   // Lower is better
      degradationRate: -0.15 // Lower is better
    };

    // Normalize metrics to 0-1 scale
    const normalized = {
      errorRate: Math.min(1, condition.errorRate / 0.1),
      responseTime: Math.min(1, condition.responseTime / 5000),
      throughput: Math.min(1, condition.throughput / 200),
      memoryUsage: condition.memoryUsage,
      degradationRate: Math.min(1, condition.degradationRate / 0.3)
    };

    let score = 0.5; // Baseline
    for (const [metric, weight] of Object.entries(weights)) {
      score += weight * normalized[metric as keyof typeof normalized];
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate threshold impact on performance with error handling
   */
  private calculateThresholdImpact(thresholdName: string, currentScore: number): number {
    try {
      if (!thresholdName || typeof thresholdName !== 'string') {
        return 0;
      }

      // Historical analysis of threshold changes and performance impacts
      const recentAdaptations = this.history
        .filter(h => h && h.threshold === thresholdName &&
                typeof h.newValue === 'number' &&
                typeof h.confidence === 'number')
        .slice(-10);

      if (recentAdaptations.length < 3) return 0;

      // Simple correlation analysis with bounds checking
      let correlationSum = 0;
      let validComparisons = 0;

      for (let i = 1; i < recentAdaptations.length; i++) {
        const prev = recentAdaptations[i-1];
        const curr = recentAdaptations[i];

        if (prev && curr &&
            typeof prev.newValue === 'number' && typeof curr.newValue === 'number' &&
            typeof prev.confidence === 'number' && typeof curr.confidence === 'number') {

          const change = curr.newValue - prev.newValue;
          const performanceChange = curr.confidence - prev.confidence;

          if (isFinite(change) && isFinite(performanceChange)) {
            correlationSum += change * performanceChange;
            validComparisons++;
          }
        }
      }

      return validComparisons > 0 ? correlationSum / validComparisons : 0;
    } catch (error) {
      console.error('Failed to calculate threshold impact:', error);
      return 0;
    }
  }

  /**
   * Clamp value within bounds
   */
  private clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Record threshold adaptation
   */
  private recordAdaptation(
    threshold: string,
    oldValue: number,
    newValue: number,
    reason: string
  ): void {
    const adaptation: AdaptationHistory = {
      timestamp: Date.now(),
      threshold,
      oldValue,
      newValue,
      reason,
      confidence: this.calculateAdaptationConfidenceLegacy(threshold, oldValue, newValue)
    };

    this.history.push(adaptation);

    // Maintain history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Calculate adaptation confidence with volatility and trend analysis
   */
  private calculateAdaptationConfidence(
    thresholdName: string,
    volatility: number,
    trendAnalysis: { isStable: boolean; isBeneficial: boolean; stabilityFactor: number }
  ): number {
    const recentAdaptations = this.history
      .filter(h => h.threshold === thresholdName)
      .slice(-5);

    // Base confidence from historical success
    const historicalConfidence = recentAdaptations.length > 0 ?
      recentAdaptations.reduce((sum, a) => sum + a.confidence, 0) / recentAdaptations.length :
      0.5;

    // Volatility penalty
    const volatilityFactor = Math.max(0.2, 1 - volatility * 0.8);

    // Trend stability bonus
    const trendFactor = trendAnalysis.isStable ? 1.2 : 0.8;

    // Frequency penalty (too many recent changes)
    const frequencyPenalty = Math.max(0.3, 1 - (recentAdaptations.length / 8));

    if (volatility > 0.9) {
      throw new Error(`System volatility too high for safe adaptation: ${volatility}`);
    }

    // Beneficial trend bonus
    const beneficialBonus = trendAnalysis.isBeneficial ? 1.1 : 0.9;

    const confidence = historicalConfidence * volatilityFactor * trendFactor * frequencyPenalty * beneficialBonus;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Legacy method for backward compatibility
   */
  private calculateAdaptationConfidenceLegacy(
    threshold: string,
    oldValue: number,
    newValue: number
  ): number {
    const changeRatio = Math.abs(newValue - oldValue) / Math.max(oldValue, 1e-10);
    const recentAdaptations = this.history
      .filter(h => h.threshold === threshold)
      .slice(-5);

    const stabilityFactor = Math.max(0.3, 1 - (recentAdaptations.length / 10));
    const magnitudeFactor = Math.max(0.5, 1 - changeRatio);

    return stabilityFactor * magnitudeFactor;
  }

  /**
   * Trigger alert for threshold condition
   */
  private triggerAlert(
    thresholdName: string,
    rule: ThresholdRule,
    condition: SystemCondition
  ): void {
    console.warn(` Threshold Alert: ${thresholdName}`);
    console.warn(`Rule: ${rule.condition}`);
    console.warn(`Priority: ${rule.priority}`);
    console.warn(`Current condition:`, condition);
  }

  /**
   * Get threshold value with validation
   */
  getThreshold(name: string): number | null {
    if (!name || typeof name !== 'string') {
      console.warn('Invalid threshold name provided');
      return null;
    }

    try {
      const threshold = this.thresholds.get(name);
      return threshold ? threshold.value : null;
    } catch (error) {
      console.error(`Failed to get threshold ${name}:`, error);
      return null;
    }
  }

  /**
   * Set threshold value manually with validation
   */
  setThreshold(name: string, value: number, reason: string = 'Manual override'): boolean {
    // Input validation
    if (!name || typeof name !== 'string') {
      console.warn('Invalid threshold name provided');
      return false;
    }

    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      console.warn('Invalid threshold value provided');
      return false;
    }

    try {
      const threshold = this.thresholds.get(name);
      if (!threshold) {
        console.warn(`Threshold ${name} not found`);
        return false;
      }

      const clampedValue = this.clampValue(value, threshold.min, threshold.max);

      this.recordAdaptation(name, threshold.value, clampedValue, reason);

      threshold.value = clampedValue;
      threshold.timestamp = Date.now();
      this.thresholds.set(name, threshold);

      return true;
    } catch (error) {
      console.error(`Failed to set threshold ${name}:`, error);
      return false;
    }
  }

  /**
   * Get all thresholds
   */
  getAllThresholds(): Record<string, ThresholdMetric> {
    return Object.fromEntries(this.thresholds);
  }

  /**
   * Get adaptation history
   */
  getAdaptationHistory(threshold?: string, limit: number = 50): AdaptationHistory[] {
    let filtered = this.history;

    if (threshold) {
      filtered = filtered.filter(h => h.threshold === threshold);
    }

    return filtered.slice(-limit);
  }

  /**
   * Get threshold statistics
   */
  getThresholdStatistics(): any {
    const stats: any = {};

    for (const [name, threshold] of this.thresholds) {
      const adaptations = this.getAdaptationHistory(name);

      stats[name] = {
        current: threshold.value,
        baseline: threshold.baseline,
        min: threshold.min,
        max: threshold.max,
        adaptations: adaptations.length,
        lastChanged: threshold.timestamp,
        averageConfidence: adaptations.length > 0 ?
          adaptations.reduce((sum, a) => sum + a.confidence, 0) / adaptations.length : 0,
        stability: this.calculateStability(adaptations)
      };
    }

    return stats;
  }

  /**
   * Calculate threshold stability score
   */
  private calculateStability(adaptations: AdaptationHistory[]): number {
    if (adaptations.length < 2) return 1;

    const changes = adaptations
      .slice(1)
      .map((adaptation, i) => Math.abs(
        adaptation.newValue - adaptations[i].newValue
      ));

    const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const maxChange = Math.max(...changes);

    return maxChange > 0 ? 1 - (averageChange / maxChange) : 1;
  }

  /**
   * Reset threshold to baseline
   */
  resetThreshold(name: string): boolean {
    const threshold = this.thresholds.get(name);
    if (!threshold) return false;

    this.recordAdaptation(name, threshold.value, threshold.baseline, 'Reset to baseline');

    threshold.value = threshold.baseline;
    threshold.timestamp = Date.now();
    this.thresholds.set(name, threshold);

    return true;
  }

  /**
   * Reset all thresholds to baseline
   */
  resetAllThresholds(): void {
    for (const name of this.thresholds.keys()) {
      this.resetThreshold(name);
    }
  }

  /**
   * Export configuration
   */
  exportConfiguration(): any {
    return {
      thresholds: Object.fromEntries(this.thresholds),
      rules: Object.fromEntries(this.rules),
      history: this.history.slice(-100), // Last 100 adaptations
      metadata: {
        exported: Date.now(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Import configuration
   */
  importConfiguration(config: any): boolean {
    try {
      if (config.thresholds) {
        for (const [name, threshold] of Object.entries(config.thresholds)) {
          this.thresholds.set(name, threshold as ThresholdMetric);
        }
      }

      if (config.rules) {
        for (const [name, rules] of Object.entries(config.rules)) {
          this.rules.set(name, rules as ThresholdRule[]);
        }
      }

      if (config.history) {
        this.history = [...this.history, ...config.history].slice(-this.maxHistory);
      }

      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}