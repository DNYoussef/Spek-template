/**
 * Semantic Drift Detector - Advanced Context Drift Analysis
 * Phase 3: Real-time semantic drift detection with adaptive thresholds
 */

import * as crypto from 'crypto';
try {
  var { TfIdf } = require('natural');
} catch (error) {
  console.warn('Natural library not available, using mock implementation');
  var TfIdf = class {
    documents: any[] = [];
    addDocument(text: string) { this.documents.push(text); }
    listTerms(index: number) { return []; }
  };
}

interface DriftPattern {
  id: string;
  type: 'gradual' | 'sudden' | 'oscillating' | 'converging' | 'diverging';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timeframe: number;
  description: string;
  recommendations: string[];
}

interface ContextSnapshot {
  timestamp: number;
  semanticVector: number[];
  complexity: number;
  entropy: number;
  domainDistribution: Record<string, number>;
  size: number;
  fingerprint: string;
}

interface DriftMetrics {
  velocity: number;        // Rate of change
  acceleration: number;    // Change in rate of change
  direction: number[];     // Vector of drift direction
  magnitude: number;       // Overall drift distance
  coherence: number;       // Internal consistency
  predictability: number;  // Pattern predictability
}

interface AdaptiveThreshold {
  metric: string;
  baseline: number;
  current: number;
  adaptation: number;
  confidence: number;
  lastUpdate: number;
}

export class SemanticDriftDetector {
  private snapshots: ContextSnapshot[] = [];
  private tfidf: TfIdf;
  private adaptiveThresholds: Map<string, AdaptiveThreshold>;
  private driftPatterns: DriftPattern[] = [];
  private readonly maxSnapshots = 100;
  private readonly analysisWindow = 10;
  private readonly updateInterval = 5000; // 5 seconds

  constructor() {
    this.tfidf = new TfIdf();
    this.adaptiveThresholds = new Map();
    this.initializeThresholds();
  }

  /**
   * Initialize adaptive thresholds
   */
  private initializeThresholds(): void {
    const defaultThresholds = [
      { metric: 'velocity', baseline: 0.1, confidence: 0.5 },
      { metric: 'acceleration', baseline: 0.05, confidence: 0.5 },
      { metric: 'magnitude', baseline: 0.3, confidence: 0.5 },
      { metric: 'coherence', baseline: 0.7, confidence: 0.8 },
      { metric: 'predictability', baseline: 0.6, confidence: 0.6 }
    ];

    for (const threshold of defaultThresholds) {
      this.adaptiveThresholds.set(threshold.metric, {
        metric: threshold.metric,
        baseline: threshold.baseline,
        current: threshold.baseline,
        adaptation: 0,
        confidence: threshold.confidence,
        lastUpdate: Date.now()
      });
    }
  }

  /**
   * Capture context snapshot for drift analysis
   */
  async captureSnapshot(context: any, domain: string): Promise<ContextSnapshot> {
    // Input validation
    if (!domain || typeof domain !== 'string') {
      throw new Error('Invalid domain: must be non-empty string');
    }

    try {
      const semanticVector = await this.generateSemanticVector(context);
      const complexity = this.calculateComplexity(context);
      const entropy = this.calculateEntropy(context);
      const size = this.calculateSize(context);
      const fingerprint = this.generateFingerprint(context);

    const snapshot: ContextSnapshot = {
      timestamp: Date.now(),
      semanticVector,
      complexity,
      entropy,
      domainDistribution: { [domain]: 1 },
      size,
      fingerprint
    };

      this.snapshots.push(snapshot);

      // Maintain sliding window
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots.shift();
      }

      return snapshot;
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
      throw new Error(`Snapshot capture failed: ${error.message}`);
    }
  }

  /**
   * Calculate size with error handling
   */
  private calculateSize(context: any): number {
    try {
      return Buffer.byteLength(JSON.stringify(context), 'utf8');
    } catch (error) {
      console.warn('Failed to calculate size:', error);
      return typeof context === 'string' ? Buffer.byteLength(context, 'utf8') : 1024;
    }
  }

  /**
   * Generate semantic vector for context with error handling
   */
  private async generateSemanticVector(context: any): Promise<number[]> {
    try {
      const text = typeof context === 'string' ? context : JSON.stringify(context);

      if (!text || text.length === 0) {
        return new Array(50).fill(0);
      }

      // Add to TF-IDF corpus
      this.tfidf.addDocument(text);

      // Generate vector with top 50 terms
      const vector: number[] = new Array(50).fill(0);
      const docIndex = this.tfidf.documents.length - 1;

      try {
        const terms = this.tfidf.listTerms(docIndex);
        if (terms && Array.isArray(terms)) {
          terms.slice(0, 50).forEach((term, index) => {
            if (term && typeof term.tfidf === 'number' && !isNaN(term.tfidf)) {
              vector[index] = term.tfidf;
            }
          });
        }
      } catch (tfidfError) {
        console.warn('TF-IDF failed, using hash vector');
        return this.generateHashVector(text);
      }

      return this.normalizeVector(vector);
    } catch (error) {
      console.error('Semantic vector generation failed:', error);
      return new Array(50).fill(0);
    }
  }

  /**
   * Calculate context complexity
   */
  private calculateComplexity(context: any): number {
    if (typeof context === 'string') {
      const words = context.match(/\b\w+\b/g) || [];
      const uniqueWords = new Set(words);
      return uniqueWords.size / Math.max(words.length, 1);
    }

    if (typeof context === 'object' && context !== null) {
      const depth = this.getObjectDepth(context);
      const breadth = Object.keys(context).length;
      return Math.min(1, (depth * Math.log(breadth + 1)) / 20);
    }

    return 0.1;
  }

  /**
   * Calculate information entropy
   */
  private calculateEntropy(context: any): number {
    const text = typeof context === 'string' ? context : JSON.stringify(context);
    const charFreq = new Map<string, number>();

    for (const char of text) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }

    let entropy = 0;
    const textLength = text.length;

    for (const freq of charFreq.values()) {
      const probability = freq / textLength;
      entropy -= probability * Math.log2(probability);
    }

    return Math.min(1, entropy / 8);
  }

  /**
   * Generate context fingerprint
   */
  private generateFingerprint(context: any): string {
    const content = JSON.stringify(context);
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Detect semantic drift patterns
   */
  async detectDrift(): Promise<{
    metrics: DriftMetrics;
    patterns: DriftPattern[];
    recommendations: string[];
  }> {
    if (this.snapshots.length < this.analysisWindow) {
      return {
        metrics: this.getZeroMetrics(),
        patterns: [],
        recommendations: ['Insufficient data for drift analysis']
      };
    }

    const metrics = await this.calculateDriftMetrics();
    const patterns = await this.identifyDriftPatterns(metrics);
    const recommendations = this.generateRecommendations(metrics, patterns);

    // Update adaptive thresholds
    await this.updateAdaptiveThresholds(metrics);

    return { metrics, patterns, recommendations };
  }

  /**
   * Calculate comprehensive drift metrics
   */
  private async calculateDriftMetrics(): Promise<DriftMetrics> {
    const recentSnapshots = this.snapshots.slice(-this.analysisWindow);

    // Calculate velocity (rate of change)
    const velocity = this.calculateVelocity(recentSnapshots);

    // Calculate acceleration (change in velocity)
    const acceleration = this.calculateAcceleration(recentSnapshots);

    // Calculate drift direction
    const direction = this.calculateDriftDirection(recentSnapshots);

    // Calculate magnitude (overall distance from start)
    const magnitude = this.calculateMagnitude(recentSnapshots);

    // Calculate coherence (internal consistency)
    const coherence = this.calculateCoherence(recentSnapshots);

    // Calculate predictability (pattern regularity)
    const predictability = this.calculatePredictability(recentSnapshots);

    return {
      velocity,
      acceleration,
      direction,
      magnitude,
      coherence,
      predictability
    };
  }

  /**
   * Calculate velocity of semantic change
   */
  private calculateVelocity(snapshots: ContextSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    let totalVelocity = 0;
    let validComparisons = 0;

    for (let i = 1; i < snapshots.length; i++) {
      const timeDelta = snapshots[i].timestamp - snapshots[i-1].timestamp;
      if (timeDelta > 0) {
        const semanticDistance = this.calculateSemanticDistance(
          snapshots[i-1].semanticVector,
          snapshots[i].semanticVector
        );
        totalVelocity += semanticDistance / (timeDelta / 1000); // per second
        validComparisons++;
      }
    }

    return validComparisons > 0 ? totalVelocity / validComparisons : 0;
  }

  /**
   * Calculate acceleration of semantic change
   */
  private calculateAcceleration(snapshots: ContextSnapshot[]): number {
    if (snapshots.length < 3) return 0;

    const velocities: number[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const timeDelta = snapshots[i].timestamp - snapshots[i-1].timestamp;
      if (timeDelta > 0) {
        const semanticDistance = this.calculateSemanticDistance(
          snapshots[i-1].semanticVector,
          snapshots[i].semanticVector
        );
        velocities.push(semanticDistance / (timeDelta / 1000));
      }
    }

    if (velocities.length < 2) return 0;

    let totalAcceleration = 0;
    for (let i = 1; i < velocities.length; i++) {
      totalAcceleration += Math.abs(velocities[i] - velocities[i-1]);
    }

    return totalAcceleration / (velocities.length - 1);
  }

  /**
   * Calculate drift direction vector
   */
  private calculateDriftDirection(snapshots: ContextSnapshot[]): number[] {
    if (snapshots.length < 2) return [];

    const first = snapshots[0].semanticVector;
    const last = snapshots[snapshots.length - 1].semanticVector;

    const direction = first.map((val, i) => last[i] - val);
    return this.normalizeVector(direction);
  }

  /**
   * Calculate drift magnitude
   */
  private calculateMagnitude(snapshots: ContextSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    const first = snapshots[0].semanticVector;
    const last = snapshots[snapshots.length - 1].semanticVector;

    return this.calculateSemanticDistance(first, last);
  }

  /**
   * Calculate semantic coherence
   */
  private calculateCoherence(snapshots: ContextSnapshot[]): number {
    if (snapshots.length < 2) return 1;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < snapshots.length; i++) {
      for (let j = i + 1; j < snapshots.length; j++) {
        const similarity = this.calculateCosineSimilarity(
          snapshots[i].semanticVector,
          snapshots[j].semanticVector
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Calculate predictability score
   */
  private calculatePredictability(snapshots: ContextSnapshot[]): number {
    if (snapshots.length < 3) return 0;

    // Calculate variance in velocity changes
    const velocities: number[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const timeDelta = snapshots[i].timestamp - snapshots[i-1].timestamp;
      if (timeDelta > 0) {
        const distance = this.calculateSemanticDistance(
          snapshots[i-1].semanticVector,
          snapshots[i].semanticVector
        );
        velocities.push(distance / (timeDelta / 1000));
      }
    }

    if (velocities.length < 2) return 0;

    const mean = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;

    // Lower variance = higher predictability
    return Math.max(0, 1 - variance);
  }

  /**
   * Identify drift patterns
   */
  private async identifyDriftPatterns(metrics: DriftMetrics): Promise<DriftPattern[]> {
    const patterns: DriftPattern[] = [];

    // Pattern 1: Gradual drift
    if (metrics.velocity > 0.1 && metrics.acceleration < 0.05) {
      patterns.push({
        id: `gradual_${Date.now()}`,
        type: 'gradual',
        severity: metrics.velocity > 0.3 ? 'high' : 'medium',
        confidence: metrics.predictability,
        timeframe: this.estimateTimeframe(metrics.velocity),
        description: 'Steady, predictable semantic drift detected',
        recommendations: [
          'Monitor context coherence',
          'Consider periodic synchronization',
          'Review domain boundaries'
        ]
      });
    }

    // Pattern 2: Sudden drift
    if (metrics.acceleration > 0.1) {
      patterns.push({
        id: `sudden_${Date.now()}`,
        type: 'sudden',
        severity: metrics.acceleration > 0.2 ? 'critical' : 'high',
        confidence: 1 - metrics.predictability,
        timeframe: 1000, // Immediate
        description: 'Rapid semantic change detected',
        recommendations: [
          'IMMEDIATE: Review recent context changes',
          'Check for corrupted inputs',
          'Initiate emergency synchronization'
        ]
      });
    }

    // Pattern 3: Oscillating drift
    if (this.detectOscillation(metrics)) {
      patterns.push({
        id: `oscillating_${Date.now()}`,
        type: 'oscillating',
        severity: 'medium',
        confidence: 0.7,
        timeframe: this.estimateOscillationPeriod(),
        description: 'Oscillating semantic patterns detected',
        recommendations: [
          'Stabilize input sources',
          'Review feedback loops',
          'Implement dampening mechanisms'
        ]
      });
    }

    // Pattern 4: Convergence
    if (metrics.velocity < 0.05 && metrics.coherence > 0.8) {
      patterns.push({
        id: `converging_${Date.now()}`,
        type: 'converging',
        severity: 'low',
        confidence: metrics.coherence,
        timeframe: 60000, // 1 minute
        description: 'Contexts converging to stable state',
        recommendations: [
          'Maintain current configuration',
          'Monitor for over-convergence',
          'Preserve diversity if needed'
        ]
      });
    }

    // Pattern 5: Divergence
    if (metrics.coherence < 0.5 && metrics.magnitude > 0.5) {
      patterns.push({
        id: `diverging_${Date.now()}`,
        type: 'diverging',
        severity: 'high',
        confidence: 1 - metrics.coherence,
        timeframe: this.estimateTimeframe(metrics.velocity),
        description: 'Dangerous context divergence detected',
        recommendations: [
          'URGENT: Strengthen context links',
          'Increase synchronization frequency',
          'Review domain isolation policies'
        ]
      });
    }

    return patterns;
  }

  /**
   * Generate hash-based vector as fallback
   */
  private generateHashVector(text: string): number[] {
    const vector = new Array(50).fill(0);
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;

      const index = Math.abs(hash) % 50;
      vector[index] = (vector[index] + 1) / text.length;
    }

    return this.normalizeVector(vector);
  }

  /**
   * Detect oscillation in drift metrics with error handling
   */
  private detectOscillation(metrics: DriftMetrics): boolean {
    try {
      if (this.snapshots.length < 6) return false;

      const recentSnapshots = this.snapshots.slice(-6);
      const recentVelocities: number[] = [];

      for (let i = 1; i < recentSnapshots.length; i++) {
        const timeDelta = recentSnapshots[i].timestamp - recentSnapshots[i-1].timestamp;
        if (timeDelta > 0) {
          const distance = this.calculateSemanticDistance(
            recentSnapshots[i-1].semanticVector,
            recentSnapshots[i].semanticVector
          );
          recentVelocities.push(distance / (timeDelta / 1000));
        } else {
          recentVelocities.push(0);
        }
      }

      if (recentVelocities.length < 3) return false;

      // Check for alternating increases/decreases
      let alternations = 0;
      for (let i = 2; i < recentVelocities.length; i++) {
        const trend1 = recentVelocities[i-1] - recentVelocities[i-2];
        const trend2 = recentVelocities[i] - recentVelocities[i-1];

        if ((trend1 > 0 && trend2 < 0) || (trend1 < 0 && trend2 > 0)) {
          alternations++;
        }
      }

      return alternations >= 2;
    } catch (error) {
      console.error('Oscillation detection failed:', error);
      return false;
    }
  }

  /**
   * Estimate oscillation period
   */
  private estimateOscillationPeriod(): number {
    // Simplified estimation - would use more sophisticated frequency analysis
    const timespan = this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp;
    return timespan / 3; // Estimate 1/3 of observation window
  }

  /**
   * Estimate timeframe for trend continuation
   */
  private estimateTimeframe(velocity: number): number {
    if (velocity === 0) return Infinity;

    // Estimate time to reach critical threshold (e.g., 0.8 magnitude)
    const criticalThreshold = 0.8;
    return (criticalThreshold / velocity) * 1000; // Convert to milliseconds
  }

  /**
   * Generate recommendations based on metrics and patterns
   */
  private generateRecommendations(metrics: DriftMetrics, patterns: DriftPattern[]): string[] {
    const recommendations = new Set<string>();

    // Add pattern-specific recommendations
    patterns.forEach(pattern => {
      pattern.recommendations.forEach(rec => recommendations.add(rec));
    });

    // Add metric-based recommendations
    if (metrics.velocity > this.getThreshold('velocity').current) {
      recommendations.add('Increase context synchronization frequency');
    }

    if (metrics.coherence < this.getThreshold('coherence').current) {
      recommendations.add('Strengthen inter-context relationships');
    }

    if (metrics.predictability < this.getThreshold('predictability').current) {
      recommendations.add('Investigate irregular context changes');
    }

    return Array.from(recommendations);
  }

  /**
   * Update adaptive thresholds based on observed metrics
   */
  private async updateAdaptiveThresholds(metrics: DriftMetrics): Promise<void> {
    const metricValues = {
      velocity: metrics.velocity,
      acceleration: metrics.acceleration,
      magnitude: metrics.magnitude,
      coherence: metrics.coherence,
      predictability: metrics.predictability
    };

    for (const [metricName, value] of Object.entries(metricValues)) {
      const threshold = this.adaptiveThresholds.get(metricName);
      if (!threshold) continue;

      // Simple adaptive adjustment - move threshold toward observed values
      const adaptationRate = 0.1;
      const newCurrent = threshold.current + (value - threshold.current) * adaptationRate;

      threshold.current = newCurrent;
      threshold.adaptation = Math.abs(newCurrent - threshold.baseline);
      threshold.lastUpdate = Date.now();

      // Increase confidence as we gather more data
      threshold.confidence = Math.min(0.95, threshold.confidence + 0.01);

      this.adaptiveThresholds.set(metricName, threshold);
    }
  }

  /**
   * Get adaptive threshold for metric
   */
  getThreshold(metric: string): AdaptiveThreshold {
    return this.adaptiveThresholds.get(metric) || {
      metric,
      baseline: 0.5,
      current: 0.5,
      adaptation: 0,
      confidence: 0.5,
      lastUpdate: Date.now()
    };
  }

  /**
   * Utility functions
   */
  private getZeroMetrics(): DriftMetrics {
    return {
      velocity: 0,
      acceleration: 0,
      direction: [],
      magnitude: 0,
      coherence: 1,
      predictability: 1
    };
  }

  private calculateSemanticDistance(vec1: number[], vec2: number[]): number {
    return 1 - this.calculateCosineSimilarity(vec1, vec2);
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) {
      return 0;
    }

    const minLength = Math.min(vec1.length, vec2.length);
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < minLength; i++) {
      const val1 = isNaN(vec1[i]) ? 0 : vec1[i];
      const val2 = isNaN(vec2[i]) ? 0 : vec2[i];

      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0 || isNaN(magnitude1) || isNaN(magnitude2)) {
      return 0;
    }

    const similarity = dotProduct / (magnitude1 * magnitude2);
    return isNaN(similarity) ? 0 : Math.max(0, Math.min(1, similarity));
  }

  private normalizeVector(vector: number[]): number[] {
    if (!vector || vector.length === 0) {
      return [];
    }

    let magnitude = 0;
    for (const val of vector) {
      if (!isNaN(val) && isFinite(val)) {
        magnitude += val * val;
      }
    }

    magnitude = Math.sqrt(magnitude);

    if (magnitude === 0 || !isFinite(magnitude)) {
      return vector.map(() => 0);
    }

    return vector.map(val => {
      const normalized = isNaN(val) ? 0 : val / magnitude;
      return isFinite(normalized) ? normalized : 0;
    });
  }

  private getObjectDepth(obj: any, currentDepth = 0): number {
    if (currentDepth > 10 || typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    return Math.max(currentDepth, ...Object.values(obj).map(v =>
      this.getObjectDepth(v, currentDepth + 1)
    ));
  }

  /**
   * Get comprehensive status
   */
  getStatus(): any {
    return {
      snapshots: this.snapshots.length,
      maxSnapshots: this.maxSnapshots,
      analysisWindow: this.analysisWindow,
      thresholds: Object.fromEntries(this.adaptiveThresholds),
      recentPatterns: this.driftPatterns.slice(-5),
      lastAnalysis: this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1].timestamp : null
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.snapshots = [];
    this.driftPatterns = [];
    this.tfidf = new TfIdf();
    this.initializeThresholds();
  }
}