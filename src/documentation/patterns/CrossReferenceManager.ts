import { EventEmitter } from 'events';
import { DocumentationPattern } from '../types/PatternTypes';
import { CrossReference, ReferenceType, LinkValidationResult } from '../types/CrossReferenceTypes';
import { DocumentationStore } from './DocumentationStore';

/**
 * Intelligent cross-reference management system.
 * Maintains and validates links between documentation sections and patterns.
 */
export class CrossReferenceManager extends EventEmitter {
  private documentationStore: DocumentationStore;
  private crossReferences: Map<string, CrossReference[]>;
  private referenceIndex: Map<string, Set<string>>; // source -> targets
  private backReferenceIndex: Map<string, Set<string>>; // target -> sources
  private linkValidationCache: Map<string, LinkValidationResult>;
  private validationMetrics: {
    totalReferences: number;
    validReferences: number;
    brokenReferences: number;
    lastValidationTime: Date | null;
  };

  constructor(documentationStore: DocumentationStore) {
    super();
    this.documentationStore = documentationStore;
    this.crossReferences = new Map();
    this.referenceIndex = new Map();
    this.backReferenceIndex = new Map();
    this.linkValidationCache = new Map();
    this.validationMetrics = {
      totalReferences: 0,
      validReferences: 0,
      brokenReferences: 0,
      lastValidationTime: null
    };
  }

  /**
   * Initialize cross-reference system
   */
  async initialize(): Promise<void> {
    await this.buildReferenceIndex();
    await this.validateAllReferences();
    this.emit('initialized');
  }

  /**
   * Add cross-reference between documentation elements
   */
  async addCrossReference(
    sourceId: string,
    targetId: string,
    referenceType: ReferenceType,
    context?: any
  ): Promise<void> {
    const reference: CrossReference = {
      id: this.generateReferenceId(sourceId, targetId),
      sourceId,
      targetId,
      type: referenceType,
      context,
      createdAt: new Date(),
      isValid: true
    };

    // Store reference
    if (!this.crossReferences.has(sourceId)) {
      this.crossReferences.set(sourceId, []);
    }
    this.crossReferences.get(sourceId)!.push(reference);

    // Update indices
    this.updateReferenceIndices(sourceId, targetId);

    // Validate the new reference
    const validation = await this.validateReference(reference);
    reference.isValid = validation.isValid;

    this.emit('referenceAdded', { reference, validation });
  }

  /**
   * Remove cross-reference
   */
  async removeCrossReference(sourceId: string, targetId: string): Promise<void> {
    const references = this.crossReferences.get(sourceId);
    if (!references) return;

    const index = references.findIndex(ref => ref.targetId === targetId);
    if (index !== -1) {
      const removed = references.splice(index, 1)[0];
      this.removeFromIndices(sourceId, targetId);
      this.emit('referenceRemoved', { reference: removed });
    }
  }

  /**
   * Get all references for a documentation element
   */
  getReferencesFor(elementId: string): CrossReference[] {
    return this.crossReferences.get(elementId) || [];
  }

  /**
   * Get all back-references (what points to this element)
   */
  getBackReferencesFor(elementId: string): CrossReference[] {
    const backReferences: CrossReference[] = [];
    const sources = this.backReferenceIndex.get(elementId);
    
    if (sources) {
      for (const sourceId of sources) {
        const references = this.crossReferences.get(sourceId) || [];
        backReferences.push(...references.filter(ref => ref.targetId === elementId));
      }
    }
    
    return backReferences;
  }

  /**
   * Find related documentation patterns
   */
  async findRelatedPatterns(
    patternId: string,
    maxDepth: number = 2
  ): Promise<DocumentationPattern[]> {
    const visited = new Set<string>();
    const related = new Set<string>();
    
    await this.traverseReferences(patternId, maxDepth, 0, visited, related);
    
    // Retrieve actual patterns
    const patterns: DocumentationPattern[] = [];
    for (const id of related) {
      if (id !== patternId) {
        const pattern = await this.documentationStore.getPattern(id);
        if (pattern) {
          patterns.push(pattern);
        }
      }
    }
    
    return patterns;
  }

  /**
   * Validate all cross-references
   */
  async validateAllReferences(): Promise<LinkValidationResult[]> {
    const startTime = Date.now();
    const results: LinkValidationResult[] = [];
    
    let totalCount = 0;
    let validCount = 0;
    
    for (const [sourceId, references] of this.crossReferences) {
      for (const reference of references) {
        const validation = await this.validateReference(reference);
        results.push(validation);
        
        totalCount++;
        if (validation.isValid) validCount++;
        
        // Update reference validity
        reference.isValid = validation.isValid;
        
        // Cache validation result
        this.linkValidationCache.set(reference.id, validation);
      }
    }
    
    // Update metrics
    this.validationMetrics = {
      totalReferences: totalCount,
      validReferences: validCount,
      brokenReferences: totalCount - validCount,
      lastValidationTime: new Date()
    };
    
    const validationTime = Date.now() - startTime;
    this.emit('validationCompleted', { 
      results, 
      metrics: this.validationMetrics, 
      validationTime 
    });
    
    return results;
  }

  /**
   * Validate a single cross-reference
   */
  async validateReference(reference: CrossReference): Promise<LinkValidationResult> {
    const startTime = Date.now();
    
    try {
      // Check if target exists
      const targetPattern = await this.documentationStore.getPattern(reference.targetId);
      if (!targetPattern) {
        return {
          referenceId: reference.id,
          isValid: false,
          error: 'Target pattern not found',
          validatedAt: new Date(),
          validationTime: Date.now() - startTime
        };
      }
      
      // Check if source exists
      const sourcePattern = await this.documentationStore.getPattern(reference.sourceId);
      if (!sourcePattern) {
        return {
          referenceId: reference.id,
          isValid: false,
          error: 'Source pattern not found',
          validatedAt: new Date(),
          validationTime: Date.now() - startTime
        };
      }
      
      // Validate reference type compatibility
      const typeValidation = this.validateReferenceType(
        reference.type,
        sourcePattern.type,
        targetPattern.type
      );
      
      if (!typeValidation.isValid) {
        return {
          referenceId: reference.id,
          isValid: false,
          error: typeValidation.error,
          validatedAt: new Date(),
          validationTime: Date.now() - startTime
        };
      }
      
      // Additional context-specific validation
      const contextValidation = await this.validateReferenceContext(
        reference,
        sourcePattern,
        targetPattern
      );
      
      return {
        referenceId: reference.id,
        isValid: contextValidation.isValid,
        error: contextValidation.error,
        validatedAt: new Date(),
        validationTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        referenceId: reference.id,
        isValid: false,
        error: `Validation error: ${error.message}`,
        validatedAt: new Date(),
        validationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Auto-discover and create cross-references
   */
  async autoDiscoverReferences(patternId: string): Promise<CrossReference[]> {
    const pattern = await this.documentationStore.getPattern(patternId);
    if (!pattern) {
      throw new Error(`Pattern ${patternId} not found`);
    }
    
    const discoveredReferences: CrossReference[] = [];
    
    // Find patterns with similar content
    const similarPatterns = await this.documentationStore.searchSimilarPatterns(
      pattern.content,
      0.7,
      10
    );
    
    for (const similarPattern of similarPatterns) {
      if (similarPattern.id !== patternId) {
        // Determine appropriate reference type
        const referenceType = this.determineReferenceType(
          pattern,
          similarPattern
        );
        
        await this.addCrossReference(
          patternId,
          similarPattern.id,
          referenceType,
          { auto: true, similarity: 0.7 }
        );
        
        const reference = this.getReferencesFor(patternId)
          .find(ref => ref.targetId === similarPattern.id);
        
        if (reference) {
          discoveredReferences.push(reference);
        }
      }
    }
    
    // Find explicit references in content
    const explicitReferences = this.extractExplicitReferences(pattern.content);
    for (const ref of explicitReferences) {
      const targetPattern = await this.documentationStore.getPattern(ref.targetId);
      if (targetPattern) {
        await this.addCrossReference(
          patternId,
          ref.targetId,
          ref.type,
          { auto: true, explicit: true }
        );
        
        const reference = this.getReferencesFor(patternId)
          .find(r => r.targetId === ref.targetId);
        
        if (reference) {
          discoveredReferences.push(reference);
        }
      }
    }
    
    this.emit('referencesDiscovered', { patternId, discoveredReferences });
    return discoveredReferences;
  }

  /**
   * Update references when pattern content changes
   */
  async updateReferencesForPattern(patternId: string): Promise<void> {
    // Remove auto-discovered references
    const existingReferences = this.getReferencesFor(patternId);
    for (const ref of existingReferences) {
      if (ref.context?.auto) {
        await this.removeCrossReference(ref.sourceId, ref.targetId);
      }
    }
    
    // Re-discover references
    await this.autoDiscoverReferences(patternId);
    
    // Validate all references for this pattern
    const references = this.getReferencesFor(patternId);
    for (const ref of references) {
      const validation = await this.validateReference(ref);
      ref.isValid = validation.isValid;
    }
    
    this.emit('referencesUpdated', { patternId });
  }

  /**
   * Get reference analytics
   */
  getReferenceAnalytics(): {
    totalReferences: number;
    validReferences: number;
    brokenReferences: number;
    referencesByType: Map<ReferenceType, number>;
    mostReferencedPatterns: Array<{ patternId: string; referenceCount: number }>;
    validationMetrics: typeof this.validationMetrics;
  } {
    const referencesByType = new Map<ReferenceType, number>();
    const referenceCounts = new Map<string, number>();
    
    for (const references of this.crossReferences.values()) {
      for (const ref of references) {
        // Count by type
        const count = referencesByType.get(ref.type) || 0;
        referencesByType.set(ref.type, count + 1);
        
        // Count references to each pattern
        const targetCount = referenceCounts.get(ref.targetId) || 0;
        referenceCounts.set(ref.targetId, targetCount + 1);
      }
    }
    
    // Sort patterns by reference count
    const mostReferencedPatterns = Array.from(referenceCounts.entries())
      .map(([patternId, referenceCount]) => ({ patternId, referenceCount }))
      .sort((a, b) => b.referenceCount - a.referenceCount)
      .slice(0, 10);
    
    return {
      totalReferences: this.validationMetrics.totalReferences,
      validReferences: this.validationMetrics.validReferences,
      brokenReferences: this.validationMetrics.brokenReferences,
      referencesByType,
      mostReferencedPatterns,
      validationMetrics: this.validationMetrics
    };
  }

  /**
   * Fix broken references automatically
   */
  async fixBrokenReferences(): Promise<{
    fixed: number;
    removed: number;
    stillBroken: number;
  }> {
    let fixedCount = 0;
    let removedCount = 0;
    let stillBrokenCount = 0;
    
    for (const [sourceId, references] of this.crossReferences) {
      const brokenReferences = references.filter(ref => !ref.isValid);
      
      for (const brokenRef of brokenReferences) {
        // Try to find similar pattern
        const sourcePattern = await this.documentationStore.getPattern(sourceId);
        if (sourcePattern) {
          const similarPatterns = await this.documentationStore.searchSimilarPatterns(
            brokenRef.targetId,
            0.8,
            1
          );
          
          if (similarPatterns.length > 0) {
            // Update reference to point to similar pattern
            brokenRef.targetId = similarPatterns[0].id;
            brokenRef.isValid = true;
            brokenRef.context = {
              ...brokenRef.context,
              autoFixed: true,
              originalTarget: brokenRef.targetId
            };
            fixedCount++;
          } else {
            // Remove broken reference
            await this.removeCrossReference(sourceId, brokenRef.targetId);
            removedCount++;
          }
        } else {
          stillBrokenCount++;
        }
      }
    }
    
    this.emit('brokenReferencesFixed', { fixedCount, removedCount, stillBrokenCount });
    
    return { fixed: fixedCount, removed: removedCount, stillBroken: stillBrokenCount };
  }

  private async buildReferenceIndex(): Promise<void> {
    // Build indices from existing cross-references
    for (const [sourceId, references] of this.crossReferences) {
      for (const ref of references) {
        this.updateReferenceIndices(sourceId, ref.targetId);
      }
    }
  }

  private updateReferenceIndices(sourceId: string, targetId: string): void {
    // Update forward index
    if (!this.referenceIndex.has(sourceId)) {
      this.referenceIndex.set(sourceId, new Set());
    }
    this.referenceIndex.get(sourceId)!.add(targetId);
    
    // Update back-reference index
    if (!this.backReferenceIndex.has(targetId)) {
      this.backReferenceIndex.set(targetId, new Set());
    }
    this.backReferenceIndex.get(targetId)!.add(sourceId);
  }

  private removeFromIndices(sourceId: string, targetId: string): void {
    // Remove from forward index
    const forwardRefs = this.referenceIndex.get(sourceId);
    if (forwardRefs) {
      forwardRefs.delete(targetId);
      if (forwardRefs.size === 0) {
        this.referenceIndex.delete(sourceId);
      }
    }
    
    // Remove from back-reference index
    const backRefs = this.backReferenceIndex.get(targetId);
    if (backRefs) {
      backRefs.delete(sourceId);
      if (backRefs.size === 0) {
        this.backReferenceIndex.delete(targetId);
      }
    }
  }

  private async traverseReferences(
    currentId: string,
    maxDepth: number,
    currentDepth: number,
    visited: Set<string>,
    related: Set<string>
  ): Promise<void> {
    if (currentDepth >= maxDepth || visited.has(currentId)) {
      return;
    }
    
    visited.add(currentId);
    related.add(currentId);
    
    // Traverse forward references
    const forwardRefs = this.referenceIndex.get(currentId);
    if (forwardRefs) {
      for (const targetId of forwardRefs) {
        await this.traverseReferences(targetId, maxDepth, currentDepth + 1, visited, related);
      }
    }
    
    // Traverse back references
    const backRefs = this.backReferenceIndex.get(currentId);
    if (backRefs) {
      for (const sourceId of backRefs) {
        await this.traverseReferences(sourceId, maxDepth, currentDepth + 1, visited, related);
      }
    }
  }

  private validateReferenceType(
    referenceType: ReferenceType,
    sourceType: string,
    targetType: string
  ): { isValid: boolean; error?: string } {
    // Define valid reference type combinations
    const validCombinations = {
      [ReferenceType.RELATED]: ['*'], // Any type can reference any type as related
      [ReferenceType.DEPENDENCY]: ['api', 'class', 'function'],
      [ReferenceType.EXAMPLE]: ['function', 'class', 'api'],
      [ReferenceType.SEE_ALSO]: ['*'],
      [ReferenceType.EXTENDS]: ['class'],
      [ReferenceType.IMPLEMENTS]: ['class'],
      [ReferenceType.OVERRIDES]: ['function']
    };
    
    const validTargets = validCombinations[referenceType] || [];
    
    if (validTargets.includes('*') || validTargets.includes(targetType)) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      error: `Reference type ${referenceType} not valid from ${sourceType} to ${targetType}`
    };
  }

  private async validateReferenceContext(
    reference: CrossReference,
    sourcePattern: DocumentationPattern,
    targetPattern: DocumentationPattern
  ): Promise<{ isValid: boolean; error?: string }> {
    // Additional context-specific validation logic
    return { isValid: true };
  }

  private determineReferenceType(
    sourcePattern: DocumentationPattern,
    targetPattern: DocumentationPattern
  ): ReferenceType {
    // Logic to determine appropriate reference type based on pattern analysis
    if (sourcePattern.type === targetPattern.type) {
      return ReferenceType.RELATED;
    }
    
    if (sourcePattern.type === 'api' && targetPattern.type === 'function') {
      return ReferenceType.DEPENDENCY;
    }
    
    return ReferenceType.SEE_ALSO;
  }

  private extractExplicitReferences(content: string): Array<{
    targetId: string;
    type: ReferenceType;
  }> {
    const references: Array<{ targetId: string; type: ReferenceType }> = [];
    
    // Extract markdown-style references [text](pattern:id)
    const markdownRefs = content.match(/\[([^\]]+)\]\(pattern:([^\)]+)\)/g);
    if (markdownRefs) {
      for (const ref of markdownRefs) {
        const match = ref.match(/\[([^\]]+)\]\(pattern:([^\)]+)\)/);
        if (match) {
          references.push({
            targetId: match[2],
            type: ReferenceType.RELATED
          });
        }
      }
    }
    
    // Extract @see references
    const seeRefs = content.match(/@see\s+([\w\-]+)/g);
    if (seeRefs) {
      for (const ref of seeRefs) {
        const match = ref.match(/@see\s+([\w\-]+)/);
        if (match) {
          references.push({
            targetId: match[1],
            type: ReferenceType.SEE_ALSO
          });
        }
      }
    }
    
    return references;
  }

  private generateReferenceId(sourceId: string, targetId: string): string {
    return `${sourceId}->${targetId}`;
  }
}

export default CrossReferenceManager;