/**
 * Intelligent Context Pruner with Semantic Drift Detection
 * Phase 3: Distributed Context Architecture Enhancement
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

interface ContextEntry {
  id: string;
  content: any;
  timestamp: number;
  priority: number;
  semanticVector: number[];
  accessCount: number;
  lastAccessed: number;
  size: number;
  domain: string;
  importance: number;
}

interface PruningStrategy {
  name: string;
  weight: number;
  calculate: (entry: ContextEntry, context: PruningContext) => number;
}

interface PruningContext {
  currentTime: number;
  totalSize: number;
  maxSize: number;
  averageAccess: number;
  domainDistribution: Map<string, number>;
}

interface SemanticDriftMetrics {
  driftScore: number;
  semanticCohesion: number;
  informationDensity: number;
  temporalRelevance: number;
  domainCoverage: number;
}

export class IntelligentContextPruner {
  private tfidf: TfIdf;
  private contextEntries: Map<string, ContextEntry>;
  private pruningStrategies: PruningStrategy[];
  private semanticThreshold: number;
  private maxContextSize: number;
  private adaptiveThresholds: Map<string, number>;
  private driftHistory: SemanticDriftMetrics[];

  constructor(maxContextSize: number = 2 * 1024 * 1024) { // 2MB default
    this.tfidf = new TfIdf();
    this.contextEntries = new Map();
    this.semanticThreshold = 0.85;
    this.maxContextSize = maxContextSize;
    this.adaptiveThresholds = new Map();
    this.driftHistory = [];

    this.initializePruningStrategies();
  }

  /**
   * Initialize intelligent pruning strategies
   */
  private initializePruningStrategies(): void {
    this.pruningStrategies = [
      {
        name: 'temporal_relevance',
        weight: 0.25,
        calculate: (entry: ContextEntry, context: PruningContext) => {
          const age = context.currentTime - entry.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          return Math.max(0, 1 - (age / maxAge));
        }
      },
      {
        name: 'access_frequency',
        weight: 0.20,
        calculate: (entry: ContextEntry, context: PruningContext) => {
          return Math.min(1, entry.accessCount / context.averageAccess);
        }
      },
      {
        name: 'semantic_importance',
        weight: 0.30,
        calculate: (entry: ContextEntry) => {
          return entry.importance;
        }
      },
      {
        name: 'size_efficiency',
        weight: 0.15,
        calculate: (entry: ContextEntry) => {
          // Higher score for smaller, information-dense entries
          return Math.max(0, 1 - (entry.size / (1024 * 100))); // Penalize entries > 100KB
        }
      },
      {
        name: 'domain_balance',
        weight: 0.10,
        calculate: (entry: ContextEntry, context: PruningContext) => {
          const domainCount = context.domainDistribution.get(entry.domain) || 0;
          const totalEntries = Array.from(context.domainDistribution.values()).reduce((a, b) => a + b, 0);
          const idealRatio = 1 / context.domainDistribution.size;
          const actualRatio = domainCount / totalEntries;
          // Prefer entries from underrepresented domains
          return idealRatio / Math.max(actualRatio, 0.01);
        }
      }
    ];
  }

  /**
   * Add context entry with semantic analysis
   */
  async addContext(id: string, content: any, domain: string, priority: number = 0.5): Promise<void> {
    // Input validation
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid context ID: must be non-empty string');
    }
    if (!domain || typeof domain !== 'string') {
      throw new Error('Invalid domain: must be non-empty string');
    }
    if (priority < 0 || priority > 1) {
      throw new Error('Invalid priority: must be between 0 and 1');
    }

    try {
      const semanticVector = await this.generateSemanticVector(content);
      const size = this.calculateSize(content);

    const entry: ContextEntry = {
      id,
      content,
      timestamp: Date.now(),
      priority,
      semanticVector,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      domain,
      importance: await this.calculateImportance(content, semanticVector)
    };

      this.contextEntries.set(id, entry);
      await this.enforceMemoryLimits();
    } catch (error) {
      console.error(`Failed to add context ${id}:`, error);
      throw new Error(`Context addition failed: ${error.message}`);
    }
  }

  /**
   * Generate semantic vector using proper TF-IDF with NLP preprocessing
   */
  private async generateSemanticVector(content: any): Promise<number[]> {
    try {
      const text = typeof content === 'string' ? content : JSON.stringify(content);

      if (!text || text.length === 0) {
        return new Array(100).fill(0);
      }

      // Preprocess text: tokenize, clean, and normalize
      const processedText = this.preprocessText(text);
      if (processedText.length === 0) {
        return this.generateHashVector(text);
      }

      // Build vocabulary from all documents
      const vocabulary = this.buildVocabulary();
      if (vocabulary.size === 0) {
        // First document - add to corpus and use hash vector
        this.tfidf.addDocument(processedText);
        return this.generateHashVector(text);
      }

      // Add document to TF-IDF corpus
      this.tfidf.addDocument(processedText);
      const docIndex = this.tfidf.documents.length - 1;

      // Calculate TF-IDF vector with proper algorithm
      const vector = this.calculateTFIDFVector(processedText, docIndex, vocabulary);

      return this.normalizeVector(vector);
    } catch (error) {
      console.error('Semantic vector generation failed:', error);
      return this.generateHashVector(typeof content === 'string' ? content : JSON.stringify(content));
    }
  }

  /**
   * Preprocess text for better semantic analysis
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .split(' ')
      .filter(word => word.length > 2) // Remove short words
      .filter(word => !this.isStopWord(word)) // Remove stop words
      .join(' ');
  }

  /**
   * Basic stop word detection
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word);
  }

  /**
   * Build vocabulary from all documents in corpus
   */
  private buildVocabulary(): Set<string> {
    const vocabulary = new Set<string>();

    for (const doc of this.tfidf.documents) {
      if (typeof doc === 'string') {
        const words = doc.split(' ');
        words.forEach(word => {
          if (word.length > 0) {
            vocabulary.add(word);
          }
        });
      }
    }

    return vocabulary;
  }

  /**
   * Calculate proper TF-IDF vector
   */
  private calculateTFIDFVector(text: string, docIndex: number, vocabulary: Set<string>): number[] {
    const words = text.split(' ').filter(w => w.length > 0);
    const termFreq = new Map<string, number>();

    // Calculate term frequency for this document
    words.forEach(word => {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    });

    const totalTerms = words.length;
    const vector: number[] = [];
    const vocabularyArray = Array.from(vocabulary).slice(0, 100); // Limit to top 100 terms

    for (const term of vocabularyArray) {
      const tf = (termFreq.get(term) || 0) / totalTerms;
      const idf = this.calculateIDF(term);
      const tfidf = tf * idf;

      vector.push(isFinite(tfidf) ? tfidf : 0);
    }

    // Pad vector to ensure consistent length
    while (vector.length < 100) {
      vector.push(0);
    }

    return vector.slice(0, 100);
  }

  /**
   * Calculate Inverse Document Frequency
   */
  private calculateIDF(term: string): number {
    const totalDocs = this.tfidf.documents.length;
    if (totalDocs === 0) return 0;

    let docsWithTerm = 0;

    for (const doc of this.tfidf.documents) {
      if (typeof doc === 'string' && doc.includes(term)) {
        docsWithTerm++;
      }
    }

    if (docsWithTerm === 0) return 0;

    return Math.log(totalDocs / docsWithTerm);
  }

  /**
   * Calculate semantic importance using multiple factors
   */
  private async calculateImportance(content: any, semanticVector: number[]): Promise<number> {
    const text = typeof content === 'string' ? content : JSON.stringify(content);

    // Factor 1: Information density (entropy)
    const entropy = this.calculateEntropy(text);

    // Factor 2: Semantic uniqueness
    const uniqueness = await this.calculateSemanticUniqueness(semanticVector);

    // Factor 3: Structural complexity
    const complexity = this.calculateStructuralComplexity(content);

    // Weighted combination
    return (entropy * 0.4) + (uniqueness * 0.4) + (complexity * 0.2);
  }

  /**
   * Calculate information entropy
   */
  private calculateEntropy(text: string): number {
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

    return Math.min(1, entropy / 8); // Normalize to 0-1
  }

  /**
   * Calculate semantic uniqueness compared to existing entries
   */
  private async calculateSemanticUniqueness(vector: number[]): Promise<number> {
    if (this.contextEntries.size === 0) return 1.0;

    let maxSimilarity = 0;

    for (const entry of this.contextEntries.values()) {
      const similarity = this.calculateCosineSimilarity(vector, entry.semanticVector);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return 1 - maxSimilarity; // Higher uniqueness = lower similarity
  }

  /**
   * Generate hash-based vector as fallback
   */
  private generateHashVector(text: string): number[] {
    const vector = new Array(100).fill(0);
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer

      const index = Math.abs(hash) % 100;
      vector[index] = (vector[index] + 1) / text.length;
    }

    return this.normalizeVector(vector);
  }

  /**
   * Calculate cosine similarity with improved error handling and zero-division protection
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) {
      return 0;
    }

    const minLength = Math.min(vec1.length, vec2.length);
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    let validComponents = 0;

    for (let i = 0; i < minLength; i++) {
      const val1 = isNaN(vec1[i]) || !isFinite(vec1[i]) ? 0 : vec1[i];
      const val2 = isNaN(vec2[i]) || !isFinite(vec2[i]) ? 0 : vec2[i];

      if (val1 !== 0 || val2 !== 0) {
        validComponents++;
      }

      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    }

    // Handle edge cases
    if (validComponents === 0) {
      return 0; // Both vectors are effectively zero
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    // Zero division protection with epsilon
    const epsilon = 1e-10;
    if (magnitude1 < epsilon || magnitude2 < epsilon ||
        isNaN(magnitude1) || isNaN(magnitude2) ||
        !isFinite(magnitude1) || !isFinite(magnitude2)) {
      return 0;
    }

    const similarity = dotProduct / (magnitude1 * magnitude2);

    // Ensure result is valid and bounded
    if (isNaN(similarity) || !isFinite(similarity)) {
      return 0;
    }

    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Calculate structural complexity
   */
  private calculateStructuralComplexity(content: any): number {
    if (typeof content === 'string') {
      // Text complexity based on vocabulary diversity
      const words = content.toLowerCase().match(/\b\w+\b/g) || [];
      const uniqueWords = new Set(words);
      return Math.min(1, uniqueWords.size / Math.max(words.length, 1));
    }

    if (typeof content === 'object' && content !== null) {
      // Object complexity based on depth and breadth
      const depth = this.calculateObjectDepth(content);
      const breadth = Object.keys(content).length;
      return Math.min(1, (depth + Math.log(breadth + 1)) / 10);
    }

    return 0.1; // Low complexity for simple types
  }

  /**
   * Calculate object depth recursively
   */
  private calculateObjectDepth(obj: any, currentDepth: number = 0): number {
    if (currentDepth > 10 || typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    let maxDepth = currentDepth;

    for (const value of Object.values(obj)) {
      const depth = this.calculateObjectDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  /**
   * Normalize vector to unit length with error handling
   */
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

  /**
   * Calculate content size in bytes with error handling
   */
  private calculateSize(content: any): number {
    try {
      const jsonString = JSON.stringify(content);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch (error) {
      console.warn('Failed to calculate content size:', error);
      // Estimate size for non-serializable content
      if (typeof content === 'string') {
        return Buffer.byteLength(content, 'utf8');
      }
      return 1024; // Default 1KB estimate
    }
  }

  /**
   * Enforce memory limits through intelligent pruning
   */
  private async enforceMemoryLimits(): Promise<void> {
    const totalSize = Array.from(this.contextEntries.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (totalSize <= this.maxContextSize) return;

    const targetSize = this.maxContextSize * 0.8; // Leave 20% buffer
    const entriesToPrune = await this.selectEntriesForPruning(totalSize - targetSize);

    for (const entryId of entriesToPrune) {
      this.contextEntries.delete(entryId);
    }
  }

  /**
   * Select entries for pruning using intelligent multi-criteria optimization
   */
  private async selectEntriesForPruning(bytesToRemove: number): Promise<string[]> {
    const entries = Array.from(this.contextEntries.values());
    const context = this.buildPruningContext();

    if (entries.length === 0) {
      return [];
    }

    // Calculate semantic clusters to preserve diversity
    const clusters = this.identifySemanticClusters(entries);

    // Calculate pruning scores with cluster awareness
    const scoredEntries = entries.map(entry => {
      const baseScore = this.calculatePruningScore(entry, context);
      const clusterScore = this.calculateClusterImportance(entry, clusters);
      const diversityBonus = this.calculateDiversityBonus(entry, entries);

      return {
        id: entry.id,
        size: entry.size,
        score: baseScore * 0.6 + clusterScore * 0.3 + diversityBonus * 0.1,
        cluster: this.findEntryCluster(entry, clusters)
      };
    });

    // Sort by score (lower = more likely to prune)
    scoredEntries.sort((a, b) => a.score - b.score);

    // Intelligent selection preserving cluster diversity
    const toRemove: string[] = [];
    const clusterCounts = new Map<number, number>();
    let removedBytes = 0;

    for (const entry of scoredEntries) {
      if (removedBytes >= bytesToRemove) break;

      // Check cluster diversity constraint
      const clusterSize = clusters.get(entry.cluster)?.length || 1;
      const currentCount = clusterCounts.get(entry.cluster) || 0;

      // Don't remove more than 70% of any cluster
      if (currentCount / clusterSize < 0.7) {
        toRemove.push(entry.id);
        removedBytes += entry.size;
        clusterCounts.set(entry.cluster, currentCount + 1);
      }
    }

    return toRemove;
  }

  /**
   * Identify semantic clusters in entries
   */
  private identifySemanticClusters(entries: ContextEntry[]): Map<number, ContextEntry[]> {
    const clusters = new Map<number, ContextEntry[]>();
    const processed = new Set<string>();
    let clusterId = 0;

    for (const entry of entries) {
      if (processed.has(entry.id)) continue;

      const cluster: ContextEntry[] = [entry];
      processed.add(entry.id);

      // Find similar entries
      for (const other of entries) {
        if (processed.has(other.id)) continue;

        const similarity = this.calculateCosineSimilarity(
          entry.semanticVector,
          other.semanticVector
        );

        if (similarity > 0.7) { // High similarity threshold
          cluster.push(other);
          processed.add(other.id);
        }
      }

      clusters.set(clusterId++, cluster);
    }

    return clusters;
  }

  /**
   * Calculate cluster importance score
   */
  private calculateClusterImportance(entry: ContextEntry, clusters: Map<number, ContextEntry[]>): number {
    const cluster = this.findEntryCluster(entry, clusters);
    const clusterEntries = clusters.get(cluster) || [];

    if (clusterEntries.length === 0) return 0;

    // Larger clusters are more important
    const sizeScore = Math.min(1, clusterEntries.length / 10);

    // Average importance of cluster members
    const avgImportance = clusterEntries.reduce((sum, e) => sum + e.importance, 0) / clusterEntries.length;

    return sizeScore * 0.4 + avgImportance * 0.6;
  }

  /**
   * Find which cluster an entry belongs to
   */
  private findEntryCluster(entry: ContextEntry, clusters: Map<number, ContextEntry[]>): number {
    for (const [clusterId, clusterEntries] of clusters) {
      if (clusterEntries.some(e => e.id === entry.id)) {
        return clusterId;
      }
    }
    return 0; // Default cluster
  }

  /**
   * Calculate diversity bonus for unique entries
   */
  private calculateDiversityBonus(entry: ContextEntry, allEntries: ContextEntry[]): number {
    let uniquenessScore = 1;

    for (const other of allEntries) {
      if (other.id === entry.id) continue;

      const similarity = this.calculateCosineSimilarity(
        entry.semanticVector,
        other.semanticVector
      );

      // Reduce score for similar entries
      uniquenessScore *= (1 - similarity * 0.5);
    }

    return Math.max(0, uniquenessScore);
  }

  /**
   * Calculate pruning score using weighted strategies
   */
  private calculatePruningScore(entry: ContextEntry, context: PruningContext): number {
    return this.pruningStrategies.reduce((score, strategy) => {
      const strategyScore = strategy.calculate(entry, context);
      return score + (strategyScore * strategy.weight);
    }, 0);
  }

  /**
   * Build pruning context for decision making
   */
  private buildPruningContext(): PruningContext {
    const entries = Array.from(this.contextEntries.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const averageAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length;

    const domainDistribution = new Map<string, number>();
    entries.forEach(entry => {
      domainDistribution.set(entry.domain, (domainDistribution.get(entry.domain) || 0) + 1);
    });

    return {
      currentTime: Date.now(),
      totalSize,
      maxSize: this.maxContextSize,
      averageAccess,
      domainDistribution
    };
  }

  /**
   * Detect semantic drift in context
   */
  async detectSemanticDrift(): Promise<SemanticDriftMetrics> {
    const entries = Array.from(this.contextEntries.values());

    if (entries.length < 2) {
      return {
        driftScore: 0,
        semanticCohesion: 1,
        informationDensity: 1,
        temporalRelevance: 1,
        domainCoverage: 1
      };
    }

    const metrics = {
      driftScore: await this.calculateDriftScore(entries),
      semanticCohesion: this.calculateSemanticCohesion(entries),
      informationDensity: this.calculateInformationDensity(entries),
      temporalRelevance: this.calculateTemporalRelevance(entries),
      domainCoverage: this.calculateDomainCoverage(entries)
    };

    this.driftHistory.push(metrics);

    // Keep last 100 measurements
    if (this.driftHistory.length > 100) {
      this.driftHistory.shift();
    }

    return metrics;
  }

  /**
   * Calculate drift score based on semantic vector dispersion
   */
  private async calculateDriftScore(entries: ContextEntry[]): Promise<number> {
    if (entries.length < 2) return 0;

    // Calculate centroid of all semantic vectors
    const centroid = this.calculateCentroid(entries.map(e => e.semanticVector));

    // Calculate average distance from centroid
    const distances = entries.map(entry =>
      1 - this.calculateCosineSimilarity(entry.semanticVector, centroid)
    );

    const averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;

    return Math.min(1, averageDistance * 2); // Scale to 0-1
  }

  /**
   * Calculate centroid of semantic vectors
   */
  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];

    const dimensions = vectors[0].length;
    const centroid = new Array(dimensions).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += vector[i];
      }
    }

    return centroid.map(val => val / vectors.length);
  }

  /**
   * Calculate semantic cohesion
   */
  private calculateSemanticCohesion(entries: ContextEntry[]): number {
    if (entries.length < 2) return 1;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const similarity = this.calculateCosineSimilarity(
          entries[i].semanticVector,
          entries[j].semanticVector
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Calculate information density
   */
  private calculateInformationDensity(entries: ContextEntry[]): number {
    if (entries.length === 0) return 0;

    const totalImportance = entries.reduce((sum, entry) => sum + entry.importance, 0);
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

    return totalSize > 0 ? (totalImportance / entries.length) : 0;
  }

  /**
   * Calculate temporal relevance
   */
  private calculateTemporalRelevance(entries: ContextEntry[]): number {
    if (entries.length === 0) return 0;

    const currentTime = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    const relevanceScores = entries.map(entry => {
      const age = currentTime - entry.timestamp;
      return Math.max(0, 1 - (age / maxAge));
    });

    return relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length;
  }

  /**
   * Calculate domain coverage
   */
  private calculateDomainCoverage(entries: ContextEntry[]): number {
    const domains = new Set(entries.map(entry => entry.domain));
    const expectedDomains = 6; // Number of princess domains

    return Math.min(1, domains.size / expectedDomains);
  }

  /**
   * Get context entry and update access metrics
   */
  getContext(id: string): any | null {
    if (!id || typeof id !== 'string') {
      console.warn('Invalid context ID provided to getContext');
      return null;
    }

    try {
      const entry = this.contextEntries.get(id);

      if (entry) {
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        return entry.content;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get context ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all context entries for a domain
   */
  getContextByDomain(domain: string): Map<string, any> {
    const domainContext = new Map<string, any>();

    for (const [id, entry] of this.contextEntries) {
      if (entry.domain === domain) {
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        domainContext.set(id, entry.content);
      }
    }

    return domainContext;
  }

  /**
   * Get pruning metrics
   */
  getMetrics(): any {
    const entries = Array.from(this.contextEntries.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

    return {
      totalEntries: entries.length,
      totalSize,
      utilizationRatio: totalSize / this.maxContextSize,
      averageEntrySize: entries.length > 0 ? totalSize / entries.length : 0,
      domainDistribution: this.getDomainDistribution(),
      driftHistory: this.driftHistory.slice(-10) // Last 10 measurements
    };
  }

  /**
   * Get domain distribution
   */
  private getDomainDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const entry of this.contextEntries.values()) {
      distribution[entry.domain] = (distribution[entry.domain] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Optimize context based on usage patterns
   */
  async optimizeContext(): Promise<void> {
    const driftMetrics = await this.detectSemanticDrift();

    // Adaptive threshold adjustment
    if (driftMetrics.driftScore > 0.7) {
      this.semanticThreshold = Math.min(0.95, this.semanticThreshold + 0.05);
    } else if (driftMetrics.driftScore < 0.3) {
      this.semanticThreshold = Math.max(0.7, this.semanticThreshold - 0.02);
    }

    // Preemptive pruning if approaching limits
    const metrics = this.getMetrics();
    if (metrics.utilizationRatio > 0.9) {
      await this.enforceMemoryLimits();
    }
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.contextEntries.clear();
    this.driftHistory = [];
    this.tfidf = new TfIdf();
  }
}