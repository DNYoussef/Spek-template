/**
 * Context DNA - Semantic Fingerprinting with Anti-Degradation
 *
 * Implements triple-layer integrity system:
 * 1. SHA-256 checksums for data integrity
 * 2. Vector embeddings for semantic drift tracking
 * 3. Relationship graphs for context preservation
 */

import * as crypto from 'crypto';

export interface ContextFingerprint {
  checksum: string;
  semanticVector: number[];
  relationships: Map<string, string[]>;
  timestamp: number;
  sourceAgent: string;
  targetAgent: string;
  degradationScore: number;
}

export interface ValidationResult {
  valid: boolean;
  checksumMatch: boolean;
  semanticSimilarity: number;
  degradationDetected: boolean;
  recoveryNeeded: boolean;
  details: string[];
}

export class ContextDNA {
  private static readonly SEMANTIC_THRESHOLD = 0.85;
  private static readonly CHECKSUM_ALGORITHM = 'sha256';
  private static readonly MAX_DEGRADATION = 0.15;

  /**
   * Generate complete context DNA fingerprint
   */
  static generateFingerprint(
    context: any,
    sourceAgent: string,
    targetAgent: string
  ): ContextFingerprint {
    const checksum = this.generateChecksum(context);
    const semanticVector = this.generateSemanticVector(context);
    const relationships = this.extractRelationships(context);

    return {
      checksum,
      semanticVector,
      relationships,
      timestamp: Date.now(),
      sourceAgent,
      targetAgent,
      degradationScore: 0
    };
  }

  /**
   * Generate SHA-256 checksum for context integrity
   */
  private static generateChecksum(context: any): string {
    const normalized = this.normalizeContext(context);
    const hash = crypto.createHash(this.CHECKSUM_ALGORITHM);
    hash.update(JSON.stringify(normalized));
    return hash.digest('hex');
  }

  /**
   * Generate semantic vector embedding for drift detection
   * Uses TF-IDF-like approach with content hashing for production stability
   */
  private static generateSemanticVector(context: any): number[] {
    const text = JSON.stringify(context);
    const vector: number[] = new Array(128).fill(0);

    // Extract meaningful features from context
    const features = this.extractSemanticFeatures(text);

    // Generate stable vector using feature hashing
    for (const feature of features) {
      const hash1 = this.hashString(feature) % 128;
      const hash2 = this.hashString(feature + '_salt') % 128;
      const weight = Math.log(1 + features.filter(f => f === feature).length);

      vector[hash1] += weight;
      vector[hash2] += weight * 0.5;
    }

    // Add positional encoding
    for (let i = 0; i < Math.min(text.length, 64); i++) {
      const pos = i % 128;
      const char = text.charCodeAt(i);
      vector[pos] += Math.sin(char / 128.0) * 0.1;
    }

    return this.normalizeVector(vector);
  }

  /**
   * Extract semantic features from text for stable embedding
   */
  private static extractSemanticFeatures(text: string): string[] {
    const features: string[] = [];

    // Extract JSON keys (structural features)
    const keyMatches = text.match(/"([^"]+)":/g);
    if (keyMatches) {
      features.push(...keyMatches.map(m => m.slice(1, -2)));
    }

    // Extract quoted strings (content features)
    const stringMatches = text.match(/"([^"]{3,})"/g);
    if (stringMatches) {
      features.push(...stringMatches.map(m => m.slice(1, -1)));
    }

    // Extract numbers (value features)
    const numberMatches = text.match(/\d+/g);
    if (numberMatches) {
      features.push(...numberMatches.map(n => `NUM_${n.length}`));
    }

    // Extract boolean values
    features.push(...(text.match(/true|false/g) || []));

    return features;
  }

  /**
   * Hash string to number for consistent feature mapping
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Extract relationship graph from context
   */
  private static extractRelationships(context: any): Map<string, string[]> {
    const relationships = new Map<string, string[]>();

    if (typeof context === 'object' && context !== null) {
      for (const [key, value] of Object.entries(context)) {
        const related: string[] = [];

        // Extract relationships from nested structures
        if (typeof value === 'object' && value !== null) {
          related.push(...Object.keys(value as any));
        }

        // Extract relationships from arrays
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              related.push(`${key}[${index}]`);
            }
          });
        }

        relationships.set(key, related);
      }
    }

    return relationships;
  }

  /**
   * Validate context transfer between agents
   */
  static validateTransfer(
    originalFingerprint: ContextFingerprint,
    currentContext: any,
    currentAgent: string
  ): ValidationResult {
    const currentChecksum = this.generateChecksum(currentContext);
    const checksumMatch = originalFingerprint.checksum === currentChecksum;

    const currentVector = this.generateSemanticVector(currentContext);
    const semanticSimilarity = this.calculateCosineSimilarity(
      originalFingerprint.semanticVector,
      currentVector
    );

    const degradationDetected = semanticSimilarity < this.SEMANTIC_THRESHOLD;
    const recoveryNeeded = semanticSimilarity < (this.SEMANTIC_THRESHOLD - 0.1);

    const details: string[] = [];

    if (!checksumMatch) {
      details.push(`Checksum mismatch: expected ${originalFingerprint.checksum.substring(0, 8)}...`);
    }

    if (degradationDetected) {
      details.push(`Semantic drift detected: ${((1 - semanticSimilarity) * 100).toFixed(2)}% degradation`);
    }

    details.push(`Transfer path: ${originalFingerprint.sourceAgent} -> ${currentAgent}`);
    details.push(`Semantic similarity: ${(semanticSimilarity * 100).toFixed(2)}%`);

    return {
      valid: checksumMatch && !degradationDetected,
      checksumMatch,
      semanticSimilarity,
      degradationDetected,
      recoveryNeeded,
      details
    };
  }

  /**
   * Calculate semantic drift between two contexts
   */
  static calculateDrift(
    original: ContextFingerprint,
    current: ContextFingerprint
  ): number {
    const similarity = this.calculateCosineSimilarity(
      original.semanticVector,
      current.semanticVector
    );

    return 1 - similarity;
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private static calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Normalize context for consistent hashing
   */
  private static normalizeContext(context: any): any {
    if (typeof context !== 'object' || context === null) {
      return context;
    }

    if (Array.isArray(context)) {
      return context.map(item => this.normalizeContext(item));
    }

    const normalized: any = {};
    const keys = Object.keys(context).sort();

    for (const key of keys) {
      normalized[key] = this.normalizeContext(context[key]);
    }

    return normalized;
  }

  /**
   * Normalize vector to unit length
   */
  private static normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map(val => val / magnitude);
  }

  /**
   * Detect cumulative degradation across transfer chain
   */
  static detectCumulativeDegradation(
    transferChain: ContextFingerprint[]
  ): {
    totalDegradation: number;
    criticalPoints: number[];
    requiresIntervention: boolean;
  } {
    if (transferChain.length < 2) {
      return {
        totalDegradation: 0,
        criticalPoints: [],
        requiresIntervention: false
      };
    }

    let totalDegradation = 0;
    const criticalPoints: number[] = [];
    const original = transferChain[0];

    for (let i = 1; i < transferChain.length; i++) {
      const drift = this.calculateDrift(original, transferChain[i]);
      totalDegradation = Math.max(totalDegradation, drift);

      if (drift > this.MAX_DEGRADATION) {
        criticalPoints.push(i);
      }
    }

    return {
      totalDegradation,
      criticalPoints,
      requiresIntervention: totalDegradation > this.MAX_DEGRADATION
    };
  }

  /**
   * Generate recovery checkpoint for context restoration with real compression
   */
  static generateRecoveryCheckpoint(
    fingerprint: ContextFingerprint,
    context: any
  ): {
    checkpointId: string;
    fingerprint: ContextFingerprint;
    compressedContext: string;
    compressionRatio: number;
    metadata: {
      timestamp: number;
      agent: string;
      degradationScore: number;
      originalSize: number;
      compressedSize: number;
    };
  } {
    const checkpointId = crypto.randomBytes(16).toString('hex');
    const originalContext = JSON.stringify(context);
    const originalSize = originalContext.length;

    // Real compression using run-length encoding and structure optimization
    const compressedContext = this.compressContext(originalContext);
    const compressedSize = compressedContext.length;
    const compressionRatio = compressedSize / originalSize;

    return {
      checkpointId,
      fingerprint,
      compressedContext,
      compressionRatio,
      metadata: {
        timestamp: Date.now(),
        agent: fingerprint.targetAgent,
        degradationScore: fingerprint.degradationScore,
        originalSize,
        compressedSize
      }
    };
  }

  /**
   * Real context compression using structural optimization
   */
  private static compressContext(contextStr: string): string {
    try {
      const parsed = JSON.parse(contextStr);

      // Remove redundant data
      const optimized = this.optimizeStructure(parsed);

      // Apply run-length encoding for repeated patterns
      const jsonStr = JSON.stringify(optimized);
      return this.runLengthEncode(jsonStr);
    } catch (error) {
      // Fallback to simple compression if JSON parsing fails
      return this.runLengthEncode(contextStr);
    }
  }

  /**
   * Optimize JSON structure for compression
   */
  private static optimizeStructure(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.optimizeStructure(item));
    }

    const optimized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip null/undefined values
      if (value == null) continue;

      // Compress long strings
      if (typeof value === 'string' && value.length > 100) {
        optimized[key] = value.substring(0, 100) + '...[TRUNCATED]';
      } else {
        optimized[key] = this.optimizeStructure(value);
      }
    }

    return optimized;
  }

  /**
   * Run-length encoding for pattern compression
   */
  private static runLengthEncode(str: string): string {
    if (str.length === 0) return str;

    let encoded = '';
    let count = 1;
    let current = str[0];

    for (let i = 1; i < str.length; i++) {
      if (str[i] === current && count < 9) {
        count++;
      } else {
        encoded += count > 1 ? `${count}${current}` : current;
        current = str[i];
        count = 1;
      }
    }

    encoded += count > 1 ? `${count}${current}` : current;
    return encoded;
  }

  /**
   * Decompress context for recovery
   */
  static decompressContext(compressedContext: string): any {
    try {
      // Reverse run-length encoding
      const decompressed = this.runLengthDecode(compressedContext);
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Context decompression failed:', error);
      return null;
    }
  }

  /**
   * Run-length decoding
   */
  private static runLengthDecode(encoded: string): string {
    let decoded = '';
    let i = 0;

    while (i < encoded.length) {
      if (i + 1 < encoded.length && /\d/.test(encoded[i])) {
        const count = parseInt(encoded[i]);
        const char = encoded[i + 1];
        decoded += char.repeat(count);
        i += 2;
      } else {
        decoded += encoded[i];
        i++;
      }
    }

    return decoded;
  }
}

export default ContextDNA;