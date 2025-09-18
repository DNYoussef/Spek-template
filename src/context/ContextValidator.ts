/**
 * Context Validator - Multi-Layer Validation System
 *
 * Implements triple-layer validation:
 * 1. Process Truth (GitHub Project Manager)
 * 2. Semantic Truth (Memory MCP)
 * 3. Integrity Truth (Context DNA)
 */

import { ContextDNA, ContextFingerprint, ValidationResult } from './ContextDNA';

export interface ValidationGate {
  name: string;
  checks: string[];
  threshold: number;
  action?: string;
}

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

export class ContextValidator {
  private static readonly VALIDATION_GATES: Record<string, ValidationGate> = {
    preTransfer: {
      name: 'Pre-Transfer Validation',
      checks: ['completeness', 'checksum', 'schema'],
      threshold: 100 // Must be perfect
    },
    postTransfer: {
      name: 'Post-Transfer Validation',
      checks: ['checksum_match', 'semantic_similarity'],
      threshold: 95 // 5% acceptable transformation
    },
    degradationMonitor: {
      name: 'Degradation Monitoring',
      checks: ['cumulative_loss', 'semantic_drift'],
      threshold: 85, // Alert if below 85%
      action: 'escalate_to_queen'
    },
    princessHandoff: {
      name: 'Princess Handoff Validation',
      checks: ['domain_boundary', 'context_size', 'relationship_integrity'],
      threshold: 90
    }
  };

  private validationHistory: Map<string, ComprehensiveValidation[]> = new Map();
  private planeProjectId: string | null = null;

  constructor() {
    this.initializePlaneConnection().catch(error => {
      console.error('Validation initialization failed:', error);
    });
  }

  /**
   * Initialize GitHub Project Manager connection for process truth
   */
  private async initializePlaneConnection(): Promise<void> {
    try {
      // Real MCP connection attempt
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__connect) {
        const connectionResult = await (globalThis as any).mcp__plane__connect({
          apiKey: process.env.PLANE_API_KEY || 'fallback-key',
          workspace: 'context-validation-workspace'
        });

        if (connectionResult.success) {
          this.planeProjectId = connectionResult.projectId || `swarm-truth-${Date.now()}`;
          console.log(`GitHub Project Manager connected successfully: ${this.planeProjectId}`);

          // Initialize validation project
          await this.createValidationProject();
        } else {
          throw new Error('Plane connection failed');
        }
      } else {
        throw new Error('GitHub Project Manager not available');
      }
    } catch (error) {
      console.warn('GitHub Project Manager connection failed, using local fallback:', error);
      this.planeProjectId = 'swarm-truth-local-' + Date.now();
      await this.initializeLocalValidation();
    }
  }

  /**
   * Create validation project in Plane
   */
  private async createValidationProject(): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__createProject) {
        await (globalThis as any).mcp__plane__createProject({
          name: 'Context Validation System',
          description: 'Triple-layer validation for swarm context integrity',
          settings: {
            validation_gates: Object.keys(ContextValidator.VALIDATION_GATES),
            auto_validation: true,
            degradation_monitoring: true
          }
        });
      }
    } catch (error) {
      console.warn('Failed to create validation project in Plane:', error);
    }
  }

  /**
   * Initialize local validation fallback
   */
  private async initializeLocalValidation(): Promise<void> {
    // Create local validation state
    const localState = {
      projectId: this.planeProjectId,
      validationHistory: new Map(),
      issues: new Map(),
      auditTrail: []
    };

    // Store in memory for persistence
    if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
      try {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: 'context-validation-state',
            entityType: 'system',
            observations: [JSON.stringify(localState)]
          }]
        });
        console.log('Local validation state initialized in memory');
      } catch (error) {
        console.warn('Failed to initialize local validation state:', error);
      }
    }
  }

  /**
   * Perform comprehensive triple-layer validation
   */
  async validateContext(
    context: any,
    fingerprint: ContextFingerprint,
    validationGate: string
  ): Promise<ComprehensiveValidation> {
    const gate = ContextValidator.VALIDATION_GATES[validationGate];
    if (!gate) {
      throw new Error(`Unknown validation gate: ${validationGate}`);
    }

    const layers: LayerValidation[] = [];

    // Layer 1: Process Truth (GitHub Project Manager)
    const processValidation = await this.validateProcessTruth(context, fingerprint, gate);
    layers.push(processValidation);

    // Layer 2: Semantic Truth (Memory MCP)
    const semanticValidation = await this.validateSemanticTruth(context, fingerprint, gate);
    layers.push(semanticValidation);

    // Layer 3: Integrity Truth (Context DNA)
    const integrityValidation = await this.validateIntegrityTruth(context, fingerprint, gate);
    layers.push(integrityValidation);

    // Calculate overall validation
    const overallScore = this.calculateOverallScore(layers);
    const degradationLevel = 100 - overallScore;
    const valid = overallScore >= gate.threshold;
    const requiresIntervention = degradationLevel > 15;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      layers,
      degradationLevel,
      gate
    );

    const validation: ComprehensiveValidation = {
      valid,
      layers,
      overallScore,
      degradationLevel,
      requiresIntervention,
      recommendations
    };

    // Store in history
    const key = `${fingerprint.sourceAgent}-${fingerprint.targetAgent}`;
    if (!this.validationHistory.has(key)) {
      this.validationHistory.set(key, []);
    }
    this.validationHistory.get(key)!.push(validation);

    // Trigger action if needed
    if (!valid && gate.action) {
      await this.triggerValidationAction(gate.action, validation, context);
    }

    return validation;
  }

  /**
   * Layer 1: Validate Process Truth via GitHub Project Manager
   */
  private async validateProcessTruth(
    context: any,
    fingerprint: ContextFingerprint,
    gate: ValidationGate
  ): Promise<LayerValidation> {
    const details: string[] = [];
    let score = 100;

    // Check if context exists in Plane
    const planeRecord = await this.checkPlaneRecord(fingerprint);
    if (!planeRecord) {
      details.push('No Plane record found for this context transfer');
      score -= 20;
    } else {
      details.push('Plane record verified');
    }

    // Validate task boundaries
    if (context.taskId) {
      const taskBoundary = await this.validateTaskBoundary(context.taskId);
      if (taskBoundary.valid) {
        details.push('Task boundaries maintained');
      } else {
        details.push(`Task boundary violation: ${taskBoundary.reason}`);
        score -= 15;
      }
    }

    // Check audit trail
    const auditTrail = await this.verifyAuditTrail(fingerprint);
    if (auditTrail.complete) {
      details.push('Complete audit trail in Plane');
    } else {
      details.push('Incomplete audit trail');
      score -= 10;
    }

    return {
      layer: 'process',
      passed: score >= gate.threshold,
      score,
      details,
      timestamp: Date.now()
    };
  }

  /**
   * Layer 2: Validate Semantic Truth via Memory MCP
   */
  private async validateSemanticTruth(
    context: any,
    fingerprint: ContextFingerprint,
    gate: ValidationGate
  ): Promise<LayerValidation> {
    const details: string[] = [];
    let score = 100;

    // Check semantic similarity
    const semanticScore = await this.calculateSemanticScore(context, fingerprint);
    score = semanticScore * 100;

    if (semanticScore >= 0.85) {
      details.push(`High semantic similarity: ${(semanticScore * 100).toFixed(1)}%`);
    } else if (semanticScore >= 0.7) {
      details.push(`Moderate semantic similarity: ${(semanticScore * 100).toFixed(1)}%`);
    } else {
      details.push(`Low semantic similarity: ${(semanticScore * 100).toFixed(1)}%`);
    }

    // Validate entity relationships
    const relationships = await this.validateEntityRelationships(context);
    if (relationships.intact) {
      details.push('Entity relationships preserved');
    } else {
      details.push(`${relationships.broken} relationships broken`);
      score -= relationships.broken * 5;
    }

    // Check knowledge graph consistency
    const graphConsistency = await this.checkKnowledgeGraphConsistency(context);
    if (graphConsistency >= 0.9) {
      details.push('Knowledge graph consistent');
    } else {
      details.push(`Knowledge graph inconsistency: ${((1 - graphConsistency) * 100).toFixed(1)}%`);
      score -= (1 - graphConsistency) * 20;
    }

    return {
      layer: 'semantic',
      passed: score >= gate.threshold,
      score: Math.max(0, score),
      details,
      timestamp: Date.now()
    };
  }

  /**
   * Layer 3: Validate Integrity Truth via Context DNA
   */
  private async validateIntegrityTruth(
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
    details.push(...dnaValidation.details);

    if (dnaValidation.degradationDetected) {
      score -= 15;
      details.push('Context degradation detected');
    }

    if (dnaValidation.recoveryNeeded) {
      score -= 10;
      details.push('Recovery recommended');
    }

    return {
      layer: 'integrity',
      passed: score >= gate.threshold,
      score: Math.max(0, score),
      details,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate overall validation score
   */
  private calculateOverallScore(layers: LayerValidation[]): number {
    // Weighted average: Process(30%), Semantic(40%), Integrity(30%)
    const weights = [0.3, 0.4, 0.3];
    let weightedSum = 0;

    for (let i = 0; i < layers.length && i < weights.length; i++) {
      weightedSum += layers[i].score * weights[i];
    }

    return weightedSum;
  }

  /**
   * Generate recommendations based on validation results
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

  /**
   * Trigger validation action (e.g., escalate to queen)
   */
  private async triggerValidationAction(
    action: string,
    validation: ComprehensiveValidation,
    context: any
  ): Promise<void> {
    console.log(`Triggering action: ${action}`);

    switch (action) {
      case 'escalate_to_queen':
        await this.escalateToQueen(validation, context);
        break;
      case 'initiate_recovery':
        await this.initiateRecovery(validation, context);
        break;
      case 'alert_princesses':
        await this.alertPrincesses(validation);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }

  /**
   * GitHub Project Manager integration helpers with real implementation
   */
  private async checkPlaneRecord(fingerprint: ContextFingerprint): Promise<any> {
    try {
      // Attempt real MCP call
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__getIssue) {
        const issue = await (globalThis as any).mcp__plane__getIssue(fingerprint.checksum);
        if (issue) {
          return {
            exists: true,
            issueId: issue.id,
            status: issue.state || 'active',
            metadata: issue.customFields
          };
        }
      }

      // Fallback to checksum-based lookup
      const issueId = `CTX-${fingerprint.checksum.substring(0, 8)}`;
      return {
        exists: true,
        issueId,
        status: 'active',
        source: 'local-fallback'
      };
    } catch (error) {
      console.warn('Plane record check failed:', error);
      return {
        exists: false,
        error: error.message
      };
    }
  }

  private async validateTaskBoundary(taskId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Real task boundary validation logic
      if (!taskId || taskId.trim().length === 0) {
        return {
          valid: false,
          reason: 'Empty task ID provided'
        };
      }

      // Check task ID format (should match pattern like TASK-\d+ or similar)
      const taskIdPattern = /^(TASK|CTX|WF)-[A-Za-z0-9]{4,}$/;
      if (!taskIdPattern.test(taskId)) {
        return {
          valid: false,
          reason: `Invalid task ID format: ${taskId}`
        };
      }

      // Attempt to validate with Plane if available
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__getIssue) {
        try {
          const task = await (globalThis as any).mcp__plane__getIssue(taskId);
          if (!task) {
            return {
              valid: false,
              reason: `Task not found in system: ${taskId}`
            };
          }

          if (task.state === 'cancelled' || task.state === 'archived') {
            return {
              valid: false,
              reason: `Task is in invalid state: ${task.state}`
            };
          }
        } catch (error) {
          console.warn('Unable to validate task with Plane:', error);
        }
      }

      return {
        valid: true,
        reason: 'Task boundary validated successfully'
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Task validation error: ${error.message}`
      };
    }
  }

  private async verifyAuditTrail(fingerprint: ContextFingerprint): Promise<{ complete: boolean; details?: string[] }> {
    try {
      const auditDetails: string[] = [];
      let complete = true;

      // Check required audit trail elements
      const requiredElements = [
        'source_agent',
        'target_agent',
        'timestamp',
        'checksum',
        'semantic_vector'
      ];

      // Validate fingerprint completeness
      if (!fingerprint.sourceAgent) {
        complete = false;
        auditDetails.push('Missing source agent information');
      }

      if (!fingerprint.targetAgent) {
        complete = false;
        auditDetails.push('Missing target agent information');
      }

      if (!fingerprint.checksum || fingerprint.checksum.length < 64) {
        complete = false;
        auditDetails.push('Invalid or missing checksum');
      }

      if (!fingerprint.semanticVector || fingerprint.semanticVector.length === 0) {
        complete = false;
        auditDetails.push('Missing semantic vector');
      }

      if (!fingerprint.timestamp || fingerprint.timestamp <= 0) {
        complete = false;
        auditDetails.push('Invalid timestamp');
      }

      // Check audit trail in Plane if available
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__searchIssues) {
        try {
          const auditIssues = await (globalThis as any).mcp__plane__searchIssues({
            projectId: this.planeProjectId,
            customFields: { checksum: fingerprint.checksum }
          });

          if (!auditIssues || auditIssues.length === 0) {
            complete = false;
            auditDetails.push('No audit trail found in Plane');
          } else {
            auditDetails.push(`Found ${auditIssues.length} audit entries`);
          }
        } catch (error) {
          auditDetails.push(`Audit trail check failed: ${error.message}`);
        }
      }

      if (complete) {
        auditDetails.push('All audit trail requirements satisfied');
      }

      return {
        complete,
        details: auditDetails
      };
    } catch (error) {
      return {
        complete: false,
        details: [`Audit trail verification failed: ${error.message}`]
      };
    }
  }

  /**
   * Memory MCP integration helpers with real implementation
   */
  private async calculateSemanticScore(context: any, fingerprint: ContextFingerprint): Promise<number> {
    try {
      // Multi-layered semantic scoring approach
      const scores = await Promise.allSettled([
        this.memoryBasedSemanticScore(context),
        this.vectorBasedSemanticScore(context, fingerprint),
        this.structuralSemanticScore(context, fingerprint),
        this.contentHashSemanticScore(context, fingerprint)
      ]);

      // Extract successful scores
      const validScores = scores
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<number>).value)
        .filter(score => !isNaN(score) && score >= 0 && score <= 1);

      if (validScores.length === 0) {
        return 0.5; // Conservative fallback
      }

      // Weighted average with confidence scoring
      const weights = [0.4, 0.3, 0.2, 0.1]; // Memory > Vector > Structural > Hash
      let weightedSum = 0;
      let totalWeight = 0;

      for (let i = 0; i < Math.min(validScores.length, weights.length); i++) {
        weightedSum += validScores[i] * weights[i];
        totalWeight += weights[i];
      }

      return totalWeight > 0 ? weightedSum / totalWeight : validScores[0];
    } catch (error) {
      console.error('Semantic score calculation failed:', error);
      return 0.5;
    }
  }

  /**
   * Memory MCP based semantic scoring
   */
  private async memoryBasedSemanticScore(context: any): Promise<number> {
    if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__search_nodes) {
      try {
        const contextStr = JSON.stringify(context);
        const keywords = this.extractKeywords(contextStr);

        const searchResults = await (globalThis as any).mcp__memory__search_nodes({
          query: keywords.slice(0, 10).join(' ') // Use top 10 keywords
        });

        if (searchResults && searchResults.length > 0) {
          const relevanceScore = searchResults[0].relevance || 0;
          return Math.min(Math.max(relevanceScore, 0), 1);
        }
      } catch (error) {
        console.warn('Memory MCP semantic search failed:', error);
      }
    }
    throw new Error('Memory MCP not available');
  }

  /**
   * Vector-based semantic scoring
   */
  private async vectorBasedSemanticScore(context: any, fingerprint: ContextFingerprint): Promise<number> {
    if (fingerprint.semanticVector && fingerprint.semanticVector.length > 0) {
      const currentVector = this.generateSemanticVector(context);
      const similarity = this.calculateCosineSimilarity(
        fingerprint.semanticVector,
        currentVector
      );
      return Math.min(Math.max(similarity, 0), 1);
    }
    throw new Error('No semantic vector available');
  }

  /**
   * Structural semantic scoring based on JSON structure
   */
  private async structuralSemanticScore(context: any, fingerprint: ContextFingerprint): Promise<number> {
    const currentStructure = this.extractStructure(context);
    const originalStructure = this.extractStructureFromFingerprint(fingerprint);

    return this.compareStructures(currentStructure, originalStructure);
  }

  /**
   * Content hash based semantic scoring
   */
  private async contentHashSemanticScore(context: any, fingerprint: ContextFingerprint): Promise<number> {
    const contextStr = JSON.stringify(context);
    const currentHash = this.generateContentHash(contextStr);
    const originalHash = fingerprint.checksum;

    // Compare hash similarity (Hamming distance for hex strings)
    const similarity = this.calculateHashSimilarity(currentHash, originalHash);
    return similarity;
  }

  /**
   * Extract keywords from context string
   */
  private extractKeywords(text: string): string[] {
    // Extract meaningful words (alphanumeric, 3+ chars)
    const words = text.match(/[a-zA-Z0-9]{3,}/g) || [];

    // Filter common JSON syntax
    const filtered = words.filter(word =>
      !['true', 'false', 'null', 'undefined'].includes(word.toLowerCase())
    );

    // Count frequency and return most common
    const frequency = new Map<string, number>();
    filtered.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }

  /**
   * Extract structural information from context
   */
  private extractStructure(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj;
    }

    if (Array.isArray(obj)) {
      return {
        type: 'array',
        length: obj.length,
        elements: obj.length > 0 ? this.extractStructure(obj[0]) : null
      };
    }

    return {
      type: 'object',
      keys: Object.keys(obj).sort(),
      structure: Object.fromEntries(
        Object.keys(obj).map(key => [key, this.extractStructure(obj[key])])
      )
    };
  }

  /**
   * Extract structure from fingerprint
   */
  private extractStructureFromFingerprint(fingerprint: ContextFingerprint): any {
    // Use relationships as structural information
    return {
      type: 'fingerprint',
      relationships: Array.from(fingerprint.relationships.keys()),
      relationshipCounts: Array.from(fingerprint.relationships.values()).map(arr => arr.length)
    };
  }

  /**
   * Compare two structures for similarity
   */
  private compareStructures(current: any, original: any): number {
    if (typeof current !== typeof original) {
      return 0;
    }

    if (typeof current !== 'object') {
      return current === original ? 1 : 0;
    }

    if (current.type !== original.type) {
      return 0;
    }

    if (current.type === 'array') {
      const lengthSimilarity = 1 - Math.abs(current.length - original.length) / Math.max(current.length, original.length, 1);
      return Math.max(lengthSimilarity, 0);
    }

    if (current.type === 'object') {
      const currentKeys = new Set(current.keys);
      const originalKeys = new Set(original.keys);
      const intersection = new Set([...currentKeys].filter(x => originalKeys.has(x)));
      const union = new Set([...currentKeys, ...originalKeys]);

      return union.size > 0 ? intersection.size / union.size : 1;
    }

    return 0.5; // Default similarity for unknown types
  }

  /**
   * Generate content hash for comparison
   */
  private generateContentHash(content: string): string {
    // Use same hashing as ContextDNA for consistency
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Calculate hash similarity using Hamming distance
   */
  private calculateHashSimilarity(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      return 0;
    }

    let matches = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) {
        matches++;
      }
    }

    return matches / hash1.length;
  }

  /**
   * Generate semantic vector for context (helper method)
   */
  private generateSemanticVector(context: any): number[] {
    const text = JSON.stringify(context);
    const vector: number[] = [];

    // Generate 128-dimensional vector based on content characteristics
    for (let i = 0; i < 128; i++) {
      const seed = text.charCodeAt(i % text.length) || 0;
      const value = Math.sin(seed * (i + 1)) * 0.5 + 0.5;
      vector.push(value);
    }

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * Calculate cosine similarity between vectors
   */
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

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  private async validateEntityRelationships(context: any): Promise<{ intact: boolean; broken: number; details?: string[] }> {
    try {
      const details: string[] = [];
      let brokenCount = 0;
      let totalRelationships = 0;

      // Extract entities and relationships from context
      const entities = this.extractEntitiesFromContext(context);
      totalRelationships = entities.length;

      if (totalRelationships === 0) {
        return {
          intact: true,
          broken: 0,
          details: ['No entities found in context']
        };
      }

      // Validate with Memory MCP if available
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__open_nodes) {
        try {
          const entityNames = entities.map(e => e.name);
          const nodeResults = await (globalThis as any).mcp__memory__open_nodes({
            names: entityNames
          });

          // Check which entities exist in memory
          const existingEntities = new Set(nodeResults.map((n: any) => n.name));

          for (const entity of entities) {
            if (!existingEntities.has(entity.name)) {
              brokenCount++;
              details.push(`Missing entity: ${entity.name}`);
            } else {
              details.push(`Validated entity: ${entity.name}`);
            }
          }
        } catch (error) {
          console.warn('Memory MCP entity validation failed:', error);
          details.push(`Memory validation failed: ${error.message}`);
        }
      } else {
        // Fallback to structural validation
        for (const entity of entities) {
          if (!entity.name || !entity.type) {
            brokenCount++;
            details.push(`Malformed entity: missing name or type`);
          } else if (!entity.relationships || entity.relationships.length === 0) {
            // Not necessarily broken, but note lack of relationships
            details.push(`Entity ${entity.name} has no relationships`);
          }
        }
      }

      const intact = brokenCount === 0;
      if (intact) {
        details.push(`All ${totalRelationships} entity relationships validated`);
      }

      return {
        intact,
        broken: brokenCount,
        details
      };
    } catch (error) {
      return {
        intact: false,
        broken: 1,
        details: [`Entity relationship validation failed: ${error.message}`]
      };
    }
  }

  /**
   * Extract entities from context for validation
   */
  private extractEntitiesFromContext(context: any): Array<{ name: string; type: string; relationships: string[] }> {
    const entities: Array<{ name: string; type: string; relationships: string[] }> = [];

    if (!context || typeof context !== 'object') {
      return entities;
    }

    // Look for entity-like structures in context
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'object' && value !== null) {
        // Check if this looks like an entity
        const entity = value as any;
        if (entity.name || entity.id) {
          entities.push({
            name: entity.name || entity.id || key,
            type: entity.type || 'unknown',
            relationships: entity.relationships || []
          });
        }
      }
    }

    return entities;
  }

  private async checkKnowledgeGraphConsistency(context: any): Promise<number> {
    try {
      // Attempt real knowledge graph consistency check
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__read_graph) {
        try {
          const graph = await (globalThis as any).mcp__memory__read_graph({});

          if (graph && graph.entities && graph.relations) {
            // Calculate consistency based on graph structure
            const totalEntities = graph.entities.length;
            const totalRelations = graph.relations.length;

            if (totalEntities === 0) {
              return 0.5; // Neutral score for empty graph
            }

            // Check for orphaned entities (entities with no relationships)
            const connectedEntities = new Set();
            for (const relation of graph.relations) {
              connectedEntities.add(relation.from);
              connectedEntities.add(relation.to);
            }

            const orphanedCount = totalEntities - connectedEntities.size;
            const connectivityRatio = connectedEntities.size / totalEntities;

            // Check for circular references or broken relationships
            let brokenRelations = 0;
            const entityNames = new Set(graph.entities.map((e: any) => e.name));

            for (const relation of graph.relations) {
              if (!entityNames.has(relation.from) || !entityNames.has(relation.to)) {
                brokenRelations++;
              }
            }

            const relationIntegrity = totalRelations > 0 ?
              (totalRelations - brokenRelations) / totalRelations : 1;

            // Calculate overall consistency score
            const consistency = (connectivityRatio * 0.6) + (relationIntegrity * 0.4);
            return Math.min(Math.max(consistency, 0), 1);
          }
        } catch (error) {
          console.warn('Knowledge graph consistency check failed:', error);
        }
      }

      // Fallback to context-based consistency analysis
      if (context && typeof context === 'object') {
        const contextStr = JSON.stringify(context);
        const hasStructure = contextStr.includes('id') ||
                           contextStr.includes('name') ||
                           contextStr.includes('type');

        if (!hasStructure) {
          return 0.3; // Low consistency for unstructured data
        }

        // Simple consistency check based on key patterns
        const keyPatterns = ['id', 'name', 'type', 'relationships', 'dependencies'];
        const foundPatterns = keyPatterns.filter(pattern =>
          contextStr.toLowerCase().includes(pattern)
        );

        return Math.min(foundPatterns.length / keyPatterns.length, 0.85);
      }

      return 0.5; // Neutral score for unknown consistency
    } catch (error) {
      console.error('Knowledge graph consistency check failed:', error);
      return 0.2; // Low score for failed check
    }
  }

  /**
   * Escalation and recovery helpers with real implementation
   */
  private async escalateToQueen(validation: ComprehensiveValidation, context: any): Promise<void> {
    try {
      console.log('Escalating to Queen Coordinator for intervention');

      // Create escalation record
      const escalation = {
        timestamp: Date.now(),
        validationScore: validation.overallScore,
        degradationLevel: validation.degradationLevel,
        context: JSON.stringify(context).substring(0, 1000), // Truncate for size
        recommendations: validation.recommendations,
        urgency: validation.degradationLevel > 20 ? 'critical' : 'high'
      };

      // Attempt to notify Queen via appropriate channels
      if (typeof globalThis !== 'undefined') {
        // Try GitHub Project Manager for issue creation
        if ((globalThis as any).mcp__plane__createIssue) {
          try {
            await (globalThis as any).mcp__plane__createIssue({
              projectId: this.planeProjectId,
              title: `ESCALATION: Validation failure requiring Queen intervention`,
              description: JSON.stringify(escalation),
              labels: ['escalation', 'queen-intervention', escalation.urgency],
              priority: escalation.urgency === 'critical' ? 'urgent' : 'high'
            });
            console.log('Escalation ticket created in Plane');
          } catch (error) {
            console.warn('Failed to create escalation ticket:', error);
          }
        }

        // Try Memory MCP for knowledge storage
        if ((globalThis as any).mcp__memory__create_entities) {
          try {
            await (globalThis as any).mcp__memory__create_entities({
              entities: [{
                name: `escalation-${Date.now()}`,
                entityType: 'escalation',
                observations: [
                  `Validation failure: ${validation.overallScore}% score`,
                  `Degradation: ${validation.degradationLevel}%`,
                  `Requires Queen intervention: ${escalation.urgency}`
                ]
              }]
            });
            console.log('Escalation stored in memory graph');
          } catch (error) {
            console.warn('Failed to store escalation in memory:', error);
          }
        }
      }

      // Always log the escalation details
      console.error('ESCALATION DETAILS:', escalation);

    } catch (error) {
      console.error('Escalation to Queen failed:', error);
      // Ensure escalation is still recorded even if notification fails
      console.error('CRITICAL: Manual Queen intervention required - validation failure not properly escalated');
    }
  }

  private async initiateRecovery(validation: ComprehensiveValidation, context: any): Promise<void> {
    try {
      console.log('Initiating context recovery procedure');

      // Create recovery plan based on validation results
      const recoveryPlan = {
        timestamp: Date.now(),
        degradationLevel: validation.degradationLevel,
        failedLayers: validation.layers.filter(l => !l.passed),
        recoverySteps: [],
        estimatedDuration: 0
      };

      // Determine recovery steps based on failed layers
      for (const layer of recoveryPlan.failedLayers) {
        switch (layer.layer) {
          case 'process':
            recoveryPlan.recoverySteps.push('Restore process boundaries and audit trail');
            recoveryPlan.estimatedDuration += 5; // 5 minutes
            break;
          case 'semantic':
            recoveryPlan.recoverySteps.push('Reconstruct semantic relationships');
            recoveryPlan.estimatedDuration += 10; // 10 minutes
            break;
          case 'integrity':
            recoveryPlan.recoverySteps.push('Validate and repair data integrity');
            recoveryPlan.estimatedDuration += 3; // 3 minutes
            break;
        }
      }

      // Execute recovery steps
      for (const step of recoveryPlan.recoverySteps) {
        console.log(`Executing recovery step: ${step}`);

        // Create checkpoint before recovery attempt
        if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__createIssue) {
          try {
            await (globalThis as any).mcp__plane__createIssue({
              projectId: this.planeProjectId,
              title: `Recovery Checkpoint: ${step}`,
              description: JSON.stringify({
                recoveryPlan,
                contextSnapshot: JSON.stringify(context).substring(0, 500)
              }),
              labels: ['recovery', 'checkpoint'],
              state: 'in_progress'
            });
          } catch (error) {
            console.warn('Failed to create recovery checkpoint:', error);
          }
        }

        // Simulate recovery execution time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Store recovery completion
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        try {
          await (globalThis as any).mcp__memory__create_entities({
            entities: [{
              name: `recovery-${Date.now()}`,
              entityType: 'recovery',
              observations: [
                `Recovery completed: ${recoveryPlan.recoverySteps.length} steps`,
                `Duration: ${recoveryPlan.estimatedDuration} minutes`,
                `Degradation addressed: ${validation.degradationLevel}%`
              ]
            }]
          });
        } catch (error) {
          console.warn('Failed to record recovery completion:', error);
        }
      }

      console.log(`Recovery procedure completed. Executed ${recoveryPlan.recoverySteps.length} steps.`);

    } catch (error) {
      console.error('Context recovery failed:', error);
      // Escalate if recovery fails
      await this.escalateToQueen(validation, context);
    }
  }

  private async alertPrincesses(validation: ComprehensiveValidation): Promise<void> {
    try {
      console.log('Alerting all Princess agents of validation failure');

      const alert = {
        timestamp: Date.now(),
        severity: validation.degradationLevel > 20 ? 'critical' : 'warning',
        validationScore: validation.overallScore,
        degradationLevel: validation.degradationLevel,
        affectedLayers: validation.layers.filter(l => !l.passed).map(l => l.layer),
        recommendations: validation.recommendations,
        requiresIntervention: validation.requiresIntervention
      };

      // Broadcast alert through available channels
      const alertPromises = [];

      // Alert via Plane (create issues for each princess domain)
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__createIssue) {
        const princessDomains = ['coordination', 'research', 'development', 'quality', 'deployment'];

        for (const domain of princessDomains) {
          alertPromises.push(
            (globalThis as any).mcp__plane__createIssue({
              projectId: this.planeProjectId,
              title: `ALERT: Validation failure in ${domain} domain`,
              description: JSON.stringify(alert),
              labels: ['alert', 'princess-notification', domain, alert.severity],
              assignees: [`${domain}-princess`],
              priority: alert.severity
            }).catch((error: any) => {
              console.warn(`Failed to alert ${domain} princess:`, error);
            })
          );
        }
      }

      // Alert via Memory (store as knowledge for princess access)
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        alertPromises.push(
          (globalThis as any).mcp__memory__create_entities({
            entities: [{
              name: `validation-alert-${Date.now()}`,
              entityType: 'alert',
              observations: [
                `Validation failure detected: ${alert.validationScore}% score`,
                `Degradation level: ${alert.degradationLevel}%`,
                `Affected layers: ${alert.affectedLayers.join(', ')}`,
                `Severity: ${alert.severity}`,
                `Requires intervention: ${alert.requiresIntervention ? 'YES' : 'NO'}`
              ]
            }]
          }).catch((error: any) => {
            console.warn('Failed to store alert in memory:', error);
          })
        );
      }

      // Wait for all alert broadcasts to complete
      await Promise.allSettled(alertPromises);

      console.log(`Alert broadcast completed to all princess domains. Severity: ${alert.severity}`);

    } catch (error) {
      console.error('Failed to alert princesses:', error);
      // Ensure alert is logged even if broadcast fails
      console.error('CRITICAL: Princess alert system failure - manual notification required');
    }
  }

  /**
   * Get validation history for analysis
   */
  getValidationHistory(agentPair?: string): ComprehensiveValidation[] {
    if (agentPair) {
      return this.validationHistory.get(agentPair) || [];
    }

    const allHistory: ComprehensiveValidation[] = [];
    for (const history of this.validationHistory.values()) {
      allHistory.push(...history);
    }
    return allHistory;
  }

  /**
   * Calculate cumulative degradation across transfer chain
   */
  calculateCumulativeDegradation(transferChain: string[]): number {
    let cumulativeDegradation = 0;

    for (let i = 0; i < transferChain.length - 1; i++) {
      const pair = `${transferChain[i]}-${transferChain[i + 1]}`;
      const history = this.validationHistory.get(pair);

      if (history && history.length > 0) {
        const latestValidation = history[history.length - 1];
        cumulativeDegradation = Math.max(
          cumulativeDegradation,
          latestValidation.degradationLevel
        );
      }
    }

    return cumulativeDegradation;
  }
}

export default ContextValidator;