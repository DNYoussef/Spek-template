/**
 * PatternRecognition - ML-based pattern detection in research data
 * Identifies trends, relationships, and patterns in research content using:
 * - TF-IDF and vector similarity analysis
 * - Clustering algorithms for topic detection
 * - Time-series analysis for trend identification
 * - Network analysis for relationship mapping
 */

import * as tf from '@tensorflow/tfjs-node';

// Pattern recognition interfaces
export interface Pattern {
  id: string;
  type: PatternType;
  name: string;
  description: string;
  confidence: number;
  frequency: number;
  entities: string[];
  relationships: PatternRelationship[];
  evidence: PatternEvidence[];
  metadata: {
    discoveredAt: Date;
    lastSeen: Date;
    sources: string[];
    algorithm: string;
  };
}

export type PatternType =
  | 'trend'
  | 'relationship'
  | 'cluster'
  | 'anomaly'
  | 'sequence'
  | 'correlation'
  | 'evolution'
  | 'emergence';

export interface PatternRelationship {
  source: string;
  target: string;
  type: 'causal' | 'correlational' | 'temporal' | 'hierarchical' | 'competitive';
  strength: number;
  direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
}

export interface PatternEvidence {
  source: string;
  content: string;
  weight: number;
  timestamp: Date;
  relevanceScore: number;
}

export interface TrendPattern extends Pattern {
  type: 'trend';
  trajectory: 'rising' | 'falling' | 'stable' | 'cyclical' | 'volatile';
  velocity: number; // rate of change
  acceleration: number; // change in velocity
  timeframe: {
    start: Date;
    end: Date;
    prediction?: Date;
  };
  dataPoints: Array<{
    timestamp: Date;
    value: number;
    confidence: number;
  }>;
}

export interface ClusterPattern extends Pattern {
  type: 'cluster';
  centroid: number[];
  radius: number;
  density: number;
  members: Array<{
    id: string;
    distance: number;
    contribution: number;
  }>;
  subClusters?: ClusterPattern[];
}

export interface AnomalyPattern extends Pattern {
  type: 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedValue: number;
  actualValue: number;
  deviation: number;
  context: string;
  possibleCauses: string[];
}

export interface PatternAnalysisConfig {
  algorithms: {
    clustering: 'kmeans' | 'dbscan' | 'hierarchical';
    similarity: 'cosine' | 'euclidean' | 'jaccard';
    trending: 'linear' | 'polynomial' | 'exponential';
  };
  thresholds: {
    minConfidence: number;
    minFrequency: number;
    maxPatterns: number;
    clusterMinSize: number;
  };
  features: {
    useSemanticEmbeddings: boolean;
    useTemporal: boolean;
    useNetwork: boolean;
    useStatistical: boolean;
  };
}

/**
 * Vector Space Model for text analysis
 */
class VectorSpaceModel {
  private vocabulary: Map<string, number> = new Map();
  private idfScores: Map<string, number> = new Map();
  private documentCount: number = 0;

  public buildVocabulary(documents: string[]): void {
    const termCounts = new Map<string, number>();
    this.documentCount = documents.length;

    // Build vocabulary and term frequencies
    documents.forEach(doc => {
      const terms = this.tokenize(doc);
      const uniqueTerms = new Set(terms);

      uniqueTerms.forEach(term => {
        termCounts.set(term, (termCounts.get(term) || 0) + 1);
      });
    });

    // Calculate IDF scores
    let vocabIndex = 0;
    termCounts.forEach((docFreq, term) => {
      this.vocabulary.set(term, vocabIndex++);
      this.idfScores.set(term, Math.log(this.documentCount / docFreq));
    });
  }

  public vectorize(document: string): number[] {
    const terms = this.tokenize(document);
    const termFreqs = new Map<string, number>();

    // Calculate term frequencies
    terms.forEach(term => {
      termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
    });

    // Create TF-IDF vector
    const vector = new Array(this.vocabulary.size).fill(0);
    termFreqs.forEach((tf, term) => {
      const vocabIndex = this.vocabulary.get(term);
      const idf = this.idfScores.get(term);

      if (vocabIndex !== undefined && idf !== undefined) {
        vector[vocabIndex] = tf * idf;
      }
    });

    return this.normalize(vector);
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 2)
      .filter(term => !this.isStopWord(term));
  }

  private isStopWord(term: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall'
    ]);
    return stopWords.has(term);
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  public cosineSimilarity(vector1: number[], vector2: number[]): number {
    const dotProduct = vector1.reduce((sum, val, idx) => sum + val * vector2[idx], 0);
    return dotProduct; // Vectors are already normalized
  }

  public getVocabularySize(): number {
    return this.vocabulary.size;
  }
}

/**
 * Clustering Algorithm Implementation
 */
class ClusteringEngine {
  public kMeans(vectors: number[][], k: number, maxIterations: number = 100): ClusterPattern[] {
    const centroids = this.initializeCentroids(vectors, k);
    const clusters: number[][] = Array(k).fill(null).map(() => []);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Clear clusters
      clusters.forEach(cluster => cluster.length = 0);

      // Assign points to clusters
      vectors.forEach((vector, index) => {
        const closestCentroid = this.findClosestCentroid(vector, centroids);
        clusters[closestCentroid].push(index);
      });

      // Update centroids
      const newCentroids = clusters.map((cluster, clusterIndex) => {
        if (cluster.length === 0) return centroids[clusterIndex];

        const dimensions = vectors[0].length;
        const newCentroid = new Array(dimensions).fill(0);

        cluster.forEach(pointIndex => {
          vectors[pointIndex].forEach((val, dim) => {
            newCentroid[dim] += val;
          });
        });

        return newCentroid.map(val => val / cluster.length);
      });

      // Check for convergence
      const converged = centroids.every((centroid, index) =>
        this.euclideanDistance(centroid, newCentroids[index]) < 0.001
      );

      centroids.splice(0, centroids.length, ...newCentroids);

      if (converged) break;
    }

    // Create cluster patterns
    return clusters.map((cluster, index) => ({
      id: `cluster_${index}`,
      type: 'cluster' as const,
      name: `Cluster ${index + 1}`,
      description: `K-means cluster with ${cluster.length} members`,
      confidence: this.calculateClusterConfidence(cluster, vectors, centroids[index]),
      frequency: cluster.length,
      entities: cluster.map(i => `doc_${i}`),
      relationships: [],
      evidence: [],
      centroid: centroids[index],
      radius: this.calculateClusterRadius(cluster, vectors, centroids[index]),
      density: this.calculateClusterDensity(cluster, vectors, centroids[index]),
      members: cluster.map(pointIndex => ({
        id: `doc_${pointIndex}`,
        distance: this.euclideanDistance(vectors[pointIndex], centroids[index]),
        contribution: 1.0 / cluster.length
      })),
      metadata: {
        discoveredAt: new Date(),
        lastSeen: new Date(),
        sources: ['clustering'],
        algorithm: 'k-means'
      }
    }));
  }

  private initializeCentroids(vectors: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    const dimensions = vectors[0].length;

    // Use k-means++ initialization
    centroids.push(vectors[Math.floor(Math.random() * vectors.length)]);

    for (let i = 1; i < k; i++) {
      const distances = vectors.map(vector => {
        const minDistance = Math.min(...centroids.map(centroid =>
          this.euclideanDistance(vector, centroid)
        ));
        return minDistance * minDistance;
      });

      const totalDistance = distances.reduce((sum, dist) => sum + dist, 0);
      const threshold = Math.random() * totalDistance;

      let cumulativeDistance = 0;
      for (let j = 0; j < vectors.length; j++) {
        cumulativeDistance += distances[j];
        if (cumulativeDistance >= threshold) {
          centroids.push(vectors[j]);
          break;
        }
      }
    }

    return centroids;
  }

  private findClosestCentroid(vector: number[], centroids: number[][]): number {
    let closestIndex = 0;
    let minDistance = this.euclideanDistance(vector, centroids[0]);

    for (let i = 1; i < centroids.length; i++) {
      const distance = this.euclideanDistance(vector, centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  private euclideanDistance(vector1: number[], vector2: number[]): number {
    return Math.sqrt(
      vector1.reduce((sum, val, idx) => sum + Math.pow(val - vector2[idx], 2), 0)
    );
  }

  private calculateClusterConfidence(cluster: number[], vectors: number[][], centroid: number[]): number {
    if (cluster.length === 0) return 0;

    const avgDistance = cluster.reduce((sum, pointIndex) =>
      sum + this.euclideanDistance(vectors[pointIndex], centroid), 0
    ) / cluster.length;

    // Convert distance to confidence (lower distance = higher confidence)
    return Math.max(0, 1 - avgDistance);
  }

  private calculateClusterRadius(cluster: number[], vectors: number[][], centroid: number[]): number {
    if (cluster.length === 0) return 0;

    return Math.max(...cluster.map(pointIndex =>
      this.euclideanDistance(vectors[pointIndex], centroid)
    ));
  }

  private calculateClusterDensity(cluster: number[], vectors: number[][], centroid: number[]): number {
    if (cluster.length === 0) return 0;

    const radius = this.calculateClusterRadius(cluster, vectors, centroid);
    const volume = Math.pow(radius, vectors[0].length); // Approximate n-dimensional volume
    return volume > 0 ? cluster.length / volume : 0;
  }
}

/**
 * Trend Analysis Engine
 */
class TrendAnalysisEngine {
  public detectTrends(
    data: Array<{ timestamp: Date; value: number; metadata?: any }>,
    windowSize: number = 7
  ): TrendPattern[] {
    if (data.length < windowSize) return [];

    const trends: TrendPattern[] = [];
    const sortedData = data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Sliding window trend detection
    for (let i = 0; i <= sortedData.length - windowSize; i++) {
      const window = sortedData.slice(i, i + windowSize);
      const trend = this.analyzeTrendWindow(window);

      if (trend && trend.confidence > 0.7) {
        trends.push(trend);
      }
    }

    return this.consolidateTrends(trends);
  }

  private analyzeTrendWindow(
    window: Array<{ timestamp: Date; value: number; metadata?: any }>
  ): TrendPattern | null {
    const n = window.length;
    const xValues = window.map((_, i) => i);
    const yValues = window.map(point => point.value);

    // Linear regression
    const { slope, intercept, r2 } = this.linearRegression(xValues, yValues);

    // Determine trajectory
    let trajectory: TrendPattern['trajectory'];
    if (Math.abs(slope) < 0.01) trajectory = 'stable';
    else if (slope > 0) trajectory = 'rising';
    else trajectory = 'falling';

    // Calculate velocity and acceleration
    const velocity = slope;
    const acceleration = this.calculateAcceleration(yValues);

    return {
      id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'trend',
      name: `${trajectory} trend`,
      description: `${trajectory} trend with ${velocity > 0 ? 'positive' : 'negative'} velocity`,
      confidence: Math.min(r2, 1.0),
      frequency: window.length,
      entities: window.map((_, i) => `datapoint_${i}`),
      relationships: [],
      evidence: window.map(point => ({
        source: 'trend_analysis',
        content: `Value: ${point.value} at ${point.timestamp.toISOString()}`,
        weight: 1.0,
        timestamp: point.timestamp,
        relevanceScore: 1.0
      })),
      trajectory,
      velocity,
      acceleration,
      timeframe: {
        start: window[0].timestamp,
        end: window[window.length - 1].timestamp
      },
      dataPoints: window.map(point => ({
        timestamp: point.timestamp,
        value: point.value,
        confidence: 0.9
      })),
      metadata: {
        discoveredAt: new Date(),
        lastSeen: new Date(),
        sources: ['trend_analysis'],
        algorithm: 'linear_regression'
      }
    };
  }

  private linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    return { slope, intercept, r2: Math.max(0, r2) };
  }

  private calculateAcceleration(values: number[]): number {
    if (values.length < 3) return 0;

    const velocities: number[] = [];
    for (let i = 1; i < values.length; i++) {
      velocities.push(values[i] - values[i - 1]);
    }

    // Average change in velocity
    let totalAcceleration = 0;
    for (let i = 1; i < velocities.length; i++) {
      totalAcceleration += velocities[i] - velocities[i - 1];
    }

    return velocities.length > 1 ? totalAcceleration / (velocities.length - 1) : 0;
  }

  private consolidateTrends(trends: TrendPattern[]): TrendPattern[] {
    // Group overlapping trends and merge similar ones
    const consolidated: TrendPattern[] = [];

    trends.forEach(trend => {
      const similar = consolidated.find(existing =>
        existing.trajectory === trend.trajectory &&
        Math.abs(existing.velocity - trend.velocity) < 0.1 &&
        this.timePeriodsOverlap(existing.timeframe, trend.timeframe)
      );

      if (similar) {
        // Merge trends
        similar.confidence = Math.max(similar.confidence, trend.confidence);
        similar.frequency += trend.frequency;
        similar.dataPoints.push(...trend.dataPoints);
        similar.evidence.push(...trend.evidence);
        similar.timeframe.start = new Date(Math.min(
          similar.timeframe.start.getTime(),
          trend.timeframe.start.getTime()
        ));
        similar.timeframe.end = new Date(Math.max(
          similar.timeframe.end.getTime(),
          trend.timeframe.end.getTime()
        ));
      } else {
        consolidated.push(trend);
      }
    });

    return consolidated;
  }

  private timePeriodsOverlap(
    period1: { start: Date; end: Date },
    period2: { start: Date; end: Date }
  ): boolean {
    return period1.start <= period2.end && period2.start <= period1.end;
  }
}

/**
 * Main Pattern Recognition Engine
 */
export class PatternRecognitionEngine {
  private vectorModel: VectorSpaceModel;
  private clusteringEngine: ClusteringEngine;
  private trendEngine: TrendAnalysisEngine;
  private config: PatternAnalysisConfig;

  constructor(config?: Partial<PatternAnalysisConfig>) {
    this.vectorModel = new VectorSpaceModel();
    this.clusteringEngine = new ClusteringEngine();
    this.trendEngine = new TrendAnalysisEngine();

    this.config = {
      algorithms: {
        clustering: 'kmeans',
        similarity: 'cosine',
        trending: 'linear',
        ...config?.algorithms
      },
      thresholds: {
        minConfidence: 0.7,
        minFrequency: 2,
        maxPatterns: 50,
        clusterMinSize: 3,
        ...config?.thresholds
      },
      features: {
        useSemanticEmbeddings: true,
        useTemporal: true,
        useNetwork: true,
        useStatistical: true,
        ...config?.features
      }
    };
  }

  /**
   * Analyze research content for patterns
   */
  public async analyzePatterns(
    documents: Array<{
      id: string;
      content: string;
      timestamp: Date;
      metadata?: any;
    }>
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    try {
      // Build vector space model
      const documentTexts = documents.map(doc => doc.content);
      this.vectorModel.buildVocabulary(documentTexts);

      // Vectorize documents
      const vectors = documentTexts.map(text => this.vectorModel.vectorize(text));

      // Cluster analysis
      if (this.config.features.useSemanticEmbeddings && vectors.length >= this.config.thresholds.clusterMinSize) {
        const clusterPatterns = await this.performClusterAnalysis(vectors, documents);
        patterns.push(...clusterPatterns);
      }

      // Trend analysis
      if (this.config.features.useTemporal && documents.length > 5) {
        const trendPatterns = await this.performTrendAnalysis(documents);
        patterns.push(...trendPatterns);
      }

      // Relationship analysis
      if (this.config.features.useNetwork) {
        const relationshipPatterns = await this.performRelationshipAnalysis(documents, vectors);
        patterns.push(...relationshipPatterns);
      }

      // Filter and rank patterns
      return this.filterAndRankPatterns(patterns);
    } catch (error) {
      console.error('Pattern analysis failed:', error);
      return [];
    }
  }

  private async performClusterAnalysis(
    vectors: number[][],
    documents: Array<{ id: string; content: string; timestamp: Date }>
  ): Promise<ClusterPattern[]> {
    const optimalK = Math.min(Math.floor(Math.sqrt(vectors.length / 2)), 10);
    return this.clusteringEngine.kMeans(vectors, optimalK);
  }

  private async performTrendAnalysis(
    documents: Array<{ id: string; content: string; timestamp: Date; metadata?: any }>
  ): Promise<TrendPattern[]> {
    // Create time series data based on document frequency
    const timeSeries = this.createTimeSeriesFromDocuments(documents);
    return this.trendEngine.detectTrends(timeSeries);
  }

  private createTimeSeriesFromDocuments(
    documents: Array<{ id: string; content: string; timestamp: Date }>
  ): Array<{ timestamp: Date; value: number }> {
    // Group documents by day and count frequency
    const dailyCounts = new Map<string, number>();

    documents.forEach(doc => {
      const dateKey = doc.timestamp.toISOString().split('T')[0];
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    });

    // Convert to time series
    return Array.from(dailyCounts.entries())
      .map(([dateStr, count]) => ({
        timestamp: new Date(dateStr),
        value: count
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private async performRelationshipAnalysis(
    documents: Array<{ id: string; content: string; timestamp: Date }>,
    vectors: number[][]
  ): Promise<Pattern[]> {
    const relationships: Pattern[] = [];

    // Find highly similar document pairs
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        const similarity = this.vectorModel.cosineSimilarity(vectors[i], vectors[j]);

        if (similarity > 0.8) {
          relationships.push({
            id: `relationship_${i}_${j}`,
            type: 'relationship',
            name: `High similarity: ${documents[i].id} ↔ ${documents[j].id}`,
            description: `Strong content similarity (${(similarity * 100).toFixed(1)}%)`,
            confidence: similarity,
            frequency: 1,
            entities: [documents[i].id, documents[j].id],
            relationships: [{
              source: documents[i].id,
              target: documents[j].id,
              type: 'correlational',
              strength: similarity,
              direction: 'bidirectional'
            }],
            evidence: [{
              source: 'similarity_analysis',
              content: `Cosine similarity: ${similarity.toFixed(3)}`,
              weight: 1.0,
              timestamp: new Date(),
              relevanceScore: similarity
            }],
            metadata: {
              discoveredAt: new Date(),
              lastSeen: new Date(),
              sources: ['relationship_analysis'],
              algorithm: 'cosine_similarity'
            }
          });
        }
      }
    }

    return relationships;
  }

  private filterAndRankPatterns(patterns: Pattern[]): Pattern[] {
    return patterns
      .filter(pattern =>
        pattern.confidence >= this.config.thresholds.minConfidence &&
        pattern.frequency >= this.config.thresholds.minFrequency
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.thresholds.maxPatterns);
  }

  /**
   * Get pattern insights summary
   */
  public getPatternInsights(patterns: Pattern[]): {
    totalPatterns: number;
    patternTypes: Record<PatternType, number>;
    topPatterns: Pattern[];
    averageConfidence: number;
  } {
    const patternTypes = patterns.reduce((acc, pattern) => {
      acc[pattern.type] = (acc[pattern.type] || 0) + 1;
      return acc;
    }, {} as Record<PatternType, number>);

    const averageConfidence = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0;

    return {
      totalPatterns: patterns.length,
      patternTypes,
      topPatterns: patterns.slice(0, 5),
      averageConfidence
    };
  }
}

// Factory function
export function createPatternRecognitionEngine(config?: Partial<PatternAnalysisConfig>): PatternRecognitionEngine {
  return new PatternRecognitionEngine(config);
}