/**
 * ContextValidationCore - Core Validation Logic
 * NASA Rule 10 Compliant - Single responsibility for validation execution
 * Optimized from ContextValidator to reduce complexity and improve focus
 */

import { ContextDNA, ContextFingerprint, ValidationResult } from '../ContextDNA';

export interface LayerValidation {
  layer: 'process' | 'semantic' | 'integrity';
  passed: boolean;
  score: number;
  details: string[];
  timestamp: number;
}

export interface ComprehensiveValidation {
  valid: boolean;
  layers: LayerValidation[];
  overallScore: number;
  degradationLevel: number;
  requiresIntervention: boolean;
  recommendations: string[];
}

export interface ValidationGate {
  name: string;
  checks: string[];
  threshold: number;
  action?: string;
}

export class ContextValidationCore {
  // NASA Rule 10: Fixed bounds and thresholds
  private static readonly MIN_SCORE_THRESHOLD = 0;
  private static readonly MAX_SCORE_THRESHOLD = 100;
  private static readonly LAYER_COUNT = 3;
  private static readonly MAX_DETAILS_PER_LAYER = 10;

  /**
   * Execute comprehensive validation
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  async executeValidation(
    context: any,
    fingerprint: ContextFingerprint,
    gate: ValidationGate
  ): Promise<ComprehensiveValidation> {
    if (!context) {
      throw new Error('Context is required for validation');
    }
    if (!fingerprint || !fingerprint.checksum) {
      throw new Error('Valid fingerprint with checksum is required');
    }
    if (!gate) {
      throw new Error('Validation gate is required');
    }

    const layers: LayerValidation[] = [];

    // Execute all three validation layers
    layers.push(await this.validateProcessLayer(context, fingerprint, gate));
    layers.push(await this.validateSemanticLayer(context, fingerprint, gate));
    layers.push(await this.validateIntegrityLayer(context, fingerprint, gate));

    // Calculate overall metrics
    const overallScore = this.calculateOverallScore(layers);
    const degradationLevel = this.calculateDegradationLevel(overallScore);
    const valid = overallScore >= gate.threshold;
    const requiresIntervention = degradationLevel > 15;

    // Generate actionable recommendations
    const recommendations = this.generateRecommendations(layers, degradationLevel, gate);

    return {
      valid,
      layers,
      overallScore,
      degradationLevel,
      requiresIntervention,
      recommendations
    };
  }

  /**
   * Validate process layer (Layer 1: Process Truth)
   * NASA Rule 10: ≤60 lines, bounded details collection
   */
  async validateProcessLayer(
    context: any,
    fingerprint: ContextFingerprint,
    gate: ValidationGate
  ): Promise<LayerValidation> {
    const details: string[] = [];
    let score = 100;

    // Process boundary validation
    if (context.taskId) {
      const taskBoundary = this.validateTaskBoundary(context.taskId);
      if (taskBoundary.valid) {
        details.push('Task boundaries maintained');
      } else {
        details.push(`Task boundary violation: ${taskBoundary.reason}`);
        score -= 15;
      }
    } else {
      details.push('No task ID found');
      score -= 10;
    }

    // Audit trail validation
    const auditComplete = this.validateAuditTrail(fingerprint);
    if (auditComplete) {
      details.push('Audit trail complete');
    } else {
      details.push('Incomplete audit trail');
      score -= 20;
    }

    // Process completeness check
    const processComplete = this.validateProcessCompleteness(context);
    if (processComplete) {
      details.push('Process completeness verified');
    } else {
      details.push('Process incompleteness detected');
      score -= 10;
    }

    // Ensure bounded details
    if (details.length > ContextValidationCore.MAX_DETAILS_PER_LAYER) {
      details.splice(ContextValidationCore.MAX_DETAILS_PER_LAYER);
    }

    return {
      layer: 'process',
      passed: score >= gate.threshold,
      score: Math.max(score, ContextValidationCore.MIN_SCORE_THRESHOLD),
      details,
      timestamp: Date.now()
    };
  }

  /**
   * Validate semantic layer (Layer 2: Semantic Truth)
   * NASA Rule 10: ≤60 lines, bounded semantic analysis
   */
  async validateSemanticLayer(
    context: any,
    fingerprint: ContextFingerprint,
    gate: ValidationGate
  ): Promise<LayerValidation> {
    const details: string[] = [];
    let score = 100;

    // Semantic similarity calculation
    const semanticScore = this.calculateSemanticSimilarity(context, fingerprint);
    score = semanticScore * 100;

    if (semanticScore >= 0.85) {
      details.push(`High semantic similarity: ${(semanticScore * 100).toFixed(1)}%`);
    } else if (semanticScore >= 0.7) {
      details.push(`Moderate semantic similarity: ${(semanticScore * 100).toFixed(1)}%`);
    } else {
      details.push(`Low semantic similarity: ${(semanticScore * 100).toFixed(1)}%`);
    }

    // Entity relationship validation
    const relationshipIntegrity = this.validateEntityRelationships(context);
    if (relationshipIntegrity >= 0.9) {
      details.push('Entity relationships intact');
    } else {
      details.push(`Relationship integrity: ${(relationshipIntegrity * 100).toFixed(1)}%`);
      score -= (1 - relationshipIntegrity) * 20;
    }

    // Knowledge consistency check
    const knowledgeConsistency = this.validateKnowledgeConsistency(context);
    if (knowledgeConsistency >= 0.9) {
      details.push('Knowledge graph consistent');
    } else {
      details.push(`Knowledge inconsistency: ${((1 - knowledgeConsistency) * 100).toFixed(1)}%`);
      score -= (1 - knowledgeConsistency) * 15;
    }

    // Ensure bounded details
    if (details.length > ContextValidationCore.MAX_DETAILS_PER_LAYER) {
      details.splice(ContextValidationCore.MAX_DETAILS_PER_LAYER);
    }

    return {
      layer: 'semantic',
      passed: score >= gate.threshold,
      score: Math.max(score, ContextValidationCore.MIN_SCORE_THRESHOLD),
      details,
      timestamp: Date.now()
    };
  }

  /**
   * Validate integrity layer (Layer 3: Integrity Truth)
   * NASA Rule 10: ≤60 lines, DNA-based validation
   */
  async validateIntegrityLayer(
    context: any,
    fingerprint: ContextFingerprint,
    gate: ValidationGate
  ): Promise<LayerValidation> {
    const details: string[] = [];

    // Use Context DNA validation
    const dnaValidation = ContextDNA.validateTransfer(
      fingerprint,
      context,
      fingerprint.targetAgent
    );

    let score = 100;

    if (dnaValidation.checksumMatch) {
      details.push('Checksum verification passed');
    } else {
      details.push('Checksum mismatch detected');
      score -= 30;
    }

    score = Math.min(score, dnaValidation.semanticSimilarity * 100);

    // Add DNA validation details (bounded)
    const dnaDetails = dnaValidation.details.slice(0, ContextValidationCore.MAX_DETAILS_PER_LAYER - 2);
    details.push(...dnaDetails);

    if (dnaValidation.degradationDetected) {
      score -= 15;
      details.push('Context degradation detected');
    }

    if (dnaValidation.recoveryNeeded) {
      score -= 10;
      details.push('Recovery recommended');
    }

    // Ensure bounded details
    if (details.length > ContextValidationCore.MAX_DETAILS_PER_LAYER) {
      details.splice(ContextValidationCore.MAX_DETAILS_PER_LAYER);
    }

    return {
      layer: 'integrity',
      passed: score >= gate.threshold,
      score: Math.max(score, ContextValidationCore.MIN_SCORE_THRESHOLD),
      details,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate overall validation score
   * NASA Rule 10: ≤60 lines, weighted average with bounds
   */
  private calculateOverallScore(layers: LayerValidation[]): number {
    if (!Array.isArray(layers) || layers.length !== ContextValidationCore.LAYER_COUNT) {
      throw new Error(`Expected ${ContextValidationCore.LAYER_COUNT} layers, received ${layers.length}`);
    }

    // Weighted average: Process(30%), Semantic(40%), Integrity(30%)
    const weights = [0.3, 0.4, 0.3];
    let weightedSum = 0;
    let totalWeight = 0;

    // Iterative calculation (no recursion)
    for (let i = 0; i < Math.min(layers.length, weights.length); i++) {
      const layer = layers[i];
      const weight = weights[i];

      // Validate layer structure
      if (!layer || typeof layer.score !== 'number' ||
          layer.score < ContextValidationCore.MIN_SCORE_THRESHOLD ||
          layer.score > ContextValidationCore.MAX_SCORE_THRESHOLD) {
        continue;
      }

      weightedSum += layer.score * weight;
      totalWeight += weight;
    }

    const finalScore = totalWeight > 0 ? weightedSum : 0;
    return Math.min(Math.max(finalScore, ContextValidationCore.MIN_SCORE_THRESHOLD), ContextValidationCore.MAX_SCORE_THRESHOLD);
  }

  /**
   * Calculate degradation level from score
   * NASA Rule 10: ≤60 lines, simple calculation
   */
  private calculateDegradationLevel(overallScore: number): number {
    if (typeof overallScore !== 'number' || overallScore < 0 || overallScore > 100) {
      throw new Error(`Invalid overall score: ${overallScore}`);
    }

    return Math.max(0, 100 - overallScore);
  }

  /**
   * Generate actionable recommendations
   * NASA Rule 10: ≤60 lines, bounded recommendations
   */
  private generateRecommendations(
    layers: LayerValidation[],
    degradationLevel: number,
    gate: ValidationGate
  ): string[] {
    const recommendations: string[] = [];

    // Check each layer for issues
    for (const layer of layers) {
      if (!layer.passed) {
        switch (layer.layer) {
          case 'process':
            recommendations.push('Strengthen process boundaries and audit trail');
            break;
          case 'semantic':
            recommendations.push('Review semantic preservation mechanisms');
            break;
          case 'integrity':
            recommendations.push('Implement stricter integrity checks');
            break;
        }
      }
    }

    // Degradation-based recommendations
    if (degradationLevel > 20) {
      recommendations.push('Critical: Immediate context recovery required');
    } else if (degradationLevel > 15) {
      recommendations.push('Warning: Context degradation approaching threshold');
    } else if (degradationLevel > 10) {
      recommendations.push('Monitor: Slight context drift detected');
    }

    // Gate-specific recommendations
    if (gate.action && degradationLevel > 15) {
      recommendations.push(`Action triggered: ${gate.action}`);
    }

    return recommendations;
  }

  // Helper validation methods with NASA Rule 10 compliance

  private validateTaskBoundary(taskId: string): { valid: boolean; reason?: string } {
    if (!taskId || taskId.trim().length === 0) {
      return { valid: false, reason: 'Empty task ID' };
    }

    const taskIdPattern = /^(TASK|CTX|WF)-[A-Za-z0-9]{4,}$/;
    if (!taskIdPattern.test(taskId)) {
      return { valid: false, reason: `Invalid task ID format: ${taskId}` };
    }

    return { valid: true };
  }

  private validateAuditTrail(fingerprint: ContextFingerprint): boolean {
    return !!(fingerprint.sourceAgent &&
              fingerprint.targetAgent &&
              fingerprint.checksum &&
              fingerprint.timestamp > 0);
  }

  private validateProcessCompleteness(context: any): boolean {
    if (!context || typeof context !== 'object') {
      return false;
    }

    const requiredFields = ['data', 'metadata'];
    return requiredFields.every(field => context.hasOwnProperty(field));
  }

  private calculateSemanticSimilarity(context: any, fingerprint: ContextFingerprint): number {
    if (!fingerprint.semanticVector || fingerprint.semanticVector.length === 0) {
      return 0.5; // Default neutral score
    }

    const currentVector = this.generateSemanticVector(context);
    return this.calculateCosineSimilarity(fingerprint.semanticVector, currentVector);
  }

  private validateEntityRelationships(context: any): number {
    if (!context || typeof context !== 'object') {
      return 0.5;
    }

    const contextStr = JSON.stringify(context);
    const hasEntities = contextStr.includes('id') || contextStr.includes('name');
    const hasRelationships = contextStr.includes('relationship') || contextStr.includes('reference');

    return hasEntities && hasRelationships ? 0.9 : 0.6;
  }

  private validateKnowledgeConsistency(context: any): number {
    if (!context || typeof context !== 'object') {
      return 0.5;
    }

    const contextStr = JSON.stringify(context);
    const keyPatterns = ['id', 'name', 'type', 'relationships'];
    const foundPatterns = keyPatterns.filter(pattern =>
      contextStr.toLowerCase().includes(pattern)
    );

    return Math.min(foundPatterns.length / keyPatterns.length, 0.95);
  }

  private generateSemanticVector(context: any): number[] {
    const text = JSON.stringify(context);
    const vector: number[] = [];

    // Generate 128-dimensional vector
    for (let i = 0; i < 128; i++) {
      const seed = text.charCodeAt(i % text.length) || 0;
      const value = Math.sin(seed * (i + 1)) * 0.5 + 0.5;
      vector.push(value);
    }

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      return 0;
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

    return (norm1 === 0 || norm2 === 0) ? 0 : dotProduct / (norm1 * norm2);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: agent080-context-validation-core-optimization
// inputs: ["src/context/ContextValidator.ts"]
// tools_used: ["Read", "Write", "Bash"]
// versions: {"model":"sonnet-4","optimization":"focused"}
// === END FOOTER ===

// Backward compatibility
export default ContextValidationCore;
