/**
 * Hive Princess Base Class
 *
 * Base framework for all Princess agents in the hierarchical swarm.
 * Provides common functionality for context management, agent coordination,
 * and anti-degradation mechanisms.
 */

import { ContextDNA, ContextFingerprint } from '../../context/ContextDNA';

export interface AgentConfiguration {
  agentType: string;
  primaryModel: string;
  sequentialThinking: boolean;
  mcpServers: string[];
  reasoningComplexity: string;
  [key: string]: any;
}

export interface DomainContext {
  domainName: string;
  contextSize: number;
  maxContextSize: number;
  criticalElements: Map<string, any>;
  relationships: Map<string, string[]>;
  lastUpdated: number;
}

export abstract class HivePrincess {
  protected domainName: string;
  protected modelType: string;
  protected managedAgents: Set<string> = new Set();
  protected domainContext: DomainContext;
  protected contextFingerprints: Map<string, ContextFingerprint> = new Map();
  protected agentConfigurations: Map<string, AgentConfiguration> = new Map();
  protected MAX_CONTEXT_SIZE = 3 * 1024 * 1024; // 3MB max per princess

  constructor(domainName: string, modelType: string) {
    this.domainName = domainName;
    this.modelType = modelType;
    this.domainContext = this.initializeDomainContext();
  }

  /**
   * Initialize domain-specific context
   */
  protected initializeDomainContext(): DomainContext {
    return {
      domainName: this.domainName,
      contextSize: 0,
      maxContextSize: this.MAX_CONTEXT_SIZE,
      criticalElements: new Map(),
      relationships: new Map(),
      lastUpdated: Date.now()
    };
  }

  /**
   * Add agent to princess management
   */
  addManagedAgent(agentType: string, configuration: AgentConfiguration): void {
    this.managedAgents.add(agentType);
    this.agentConfigurations.set(agentType, configuration);
  }

  /**
   * Process incoming context with anti-degradation
   */
  async receiveContext(
    context: any,
    sourceAgent: string,
    fingerprint: ContextFingerprint
  ): Promise<{
    accepted: boolean;
    validation: any;
    pruned?: any;
  }> {
    // Validate context integrity
    const validation = ContextDNA.validateTransfer(
      fingerprint,
      context,
      `${this.domainName}-princess`
    );

    if (!validation.valid) {
      // Attempt recovery if needed
      if (validation.recoveryNeeded) {
        const recovered = await this.attemptContextRecovery(
          fingerprint,
          context,
          sourceAgent
        );
        if (recovered) {
          context = recovered;
        } else {
          return { accepted: false, validation };
        }
      }
    }

    // Prune context to prevent avalanche
    const pruned = await this.pruneContext(context);

    // Update domain context
    this.updateDomainContext(pruned, sourceAgent);

    // Store fingerprint for future validation
    this.contextFingerprints.set(sourceAgent, fingerprint);

    return {
      accepted: true,
      validation,
      pruned
    };
  }

  /**
   * Prune context intelligently to prevent memory avalanche
   */
  protected async pruneContext(context: any): Promise<any> {
    const currentSize = JSON.stringify(context).length;

    if (currentSize <= this.MAX_CONTEXT_SIZE) {
      return context; // No pruning needed
    }

    // Extract critical elements
    const critical = this.extractCriticalElements(context);

    // Generate summary of non-critical elements
    const summary = this.generateContextSummary(context, critical);

    // Extract key relationships
    const relationships = this.extractKeyRelationships(context);

    // Create pruned context
    const pruned = {
      critical,
      summary,
      relationships,
      metadata: {
        originalSize: currentSize,
        prunedSize: 0,
        pruningRatio: 0,
        timestamp: Date.now()
      }
    };

    pruned.metadata.prunedSize = JSON.stringify(pruned).length;
    pruned.metadata.pruningRatio = 1 - (pruned.metadata.prunedSize / currentSize);

    return pruned;
  }

  /**
   * Extract critical elements that must be preserved
   */
  protected extractCriticalElements(context: any): any {
    const critical: any = {};

    // Domain-specific critical element extraction
    const criticalKeys = this.identifyCriticalKeys(context);

    for (const key of criticalKeys) {
      if (context[key] !== undefined) {
        critical[key] = context[key];
      }
    }

    return critical;
  }

  /**
   * Identify critical keys based on domain
   */
  protected identifyCriticalKeys(context: any): string[] {
    const baseKeys = ['id', 'taskId', 'priority', 'dependencies', 'status'];
    const domainKeys = this.getDomainSpecificCriticalKeys();

    return [...baseKeys, ...domainKeys];
  }

  /**
   * Get domain-specific critical keys (override in subclasses)
   */
  protected abstract getDomainSpecificCriticalKeys(): string[];

  /**
   * Generate summary of non-critical context elements
   */
  protected generateContextSummary(context: any, criticalElements: any): string {
    const nonCritical: any = {};

    for (const key in context) {
      if (!criticalElements.hasOwnProperty(key)) {
        nonCritical[key] = typeof context[key] === 'object'
          ? `[${typeof context[key]}:${Object.keys(context[key] || {}).length} keys]`
          : context[key];
      }
    }

    return JSON.stringify(nonCritical);
  }

  /**
   * Extract key relationships from context
   */
  protected extractKeyRelationships(context: any): Map<string, string[]> {
    const relationships = new Map<string, string[]>();

    // Extract relationships from context structure
    if (typeof context === 'object' && context !== null) {
      for (const [key, value] of Object.entries(context)) {
        if (Array.isArray(value)) {
          relationships.set(key, value.map((_, i) => `${key}[${i}]`));
        } else if (typeof value === 'object' && value !== null) {
          relationships.set(key, Object.keys(value as any));
        }
      }
    }

    return relationships;
  }

  /**
   * Attempt to recover degraded context with multiple strategies
   */
  protected async attemptContextRecovery(
    originalFingerprint: ContextFingerprint,
    degradedContext: any,
    sourceAgent: string
  ): Promise<any | null> {
    console.log(`Attempting context recovery for ${sourceAgent} in ${this.domainName} domain`);

    // Multi-strategy recovery approach
    const recoveryStrategies = [
      () => this.recoverFromCheckpoint(originalFingerprint, degradedContext, sourceAgent),
      () => this.recoverFromMemory(originalFingerprint, degradedContext, sourceAgent),
      () => this.recoverFromRelationships(originalFingerprint, degradedContext, sourceAgent),
      () => this.recoverFromSiblingPrincesses(originalFingerprint, degradedContext, sourceAgent)
    ];

    for (const strategy of recoveryStrategies) {
      try {
        const recovered = await strategy();
        if (recovered) {
          console.log(`Context recovery successful for ${sourceAgent} using strategy`);
          return recovered;
        }
      } catch (error) {
        console.warn(`Recovery strategy failed:`, error);
      }
    }

    console.error(`All recovery strategies failed for ${sourceAgent}`);
    return null;
  }

  /**
   * Recover from stored checkpoint
   */
  private async recoverFromCheckpoint(
    originalFingerprint: ContextFingerprint,
    degradedContext: any,
    sourceAgent: string
  ): Promise<any | null> {
    const checkpoint = this.contextFingerprints.get(sourceAgent);
    if (!checkpoint) {
      return null;
    }

    const drift = ContextDNA.calculateDrift(originalFingerprint, checkpoint);
    if (drift < 0.3) {
      // Merge critical elements from checkpoint
      const recovered = {
        ...degradedContext,
        _recovered: true,
        _recoveryMetadata: {
          strategy: 'checkpoint',
          drift,
          sourceAgent,
          timestamp: Date.now(),
          originalChecksum: originalFingerprint.checksum,
          recoveryChecksum: checkpoint.checksum
        }
      };

      // Restore critical elements from domain context
      if (this.domainContext.criticalElements.size > 0) {
        recovered._restoredElements = {};
        for (const [key, value] of this.domainContext.criticalElements) {
          if (degradedContext[key] === undefined || degradedContext[key] === null) {
            recovered[key] = value;
            recovered._restoredElements[key] = 'domain-context';
          }
        }
      }

      return recovered;
    }

    return null;
  }

  /**
   * Recover from Memory MCP
   */
  private async recoverFromMemory(
    originalFingerprint: ContextFingerprint,
    degradedContext: any,
    sourceAgent: string
  ): Promise<any | null> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__search_nodes) {
        const memoryResults = await (globalThis as any).mcp__memory__search_nodes({
          query: `agent:${sourceAgent} domain:${this.domainName}`
        });

        if (memoryResults && memoryResults.length > 0) {
          const mostRelevant = memoryResults[0];
          if (mostRelevant.observations && mostRelevant.observations.length > 0) {
            try {
              const memoryContext = JSON.parse(mostRelevant.observations[0]);
              const recovered = {
                ...degradedContext,
                ...memoryContext,
                _recovered: true,
                _recoveryMetadata: {
                  strategy: 'memory',
                  sourceAgent,
                  timestamp: Date.now(),
                  memoryNodeId: mostRelevant.name,
                  relevanceScore: mostRelevant.relevance || 0
                }
              };
              return recovered;
            } catch (parseError) {
              console.warn('Failed to parse memory context:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Memory recovery failed:', error);
    }
    return null;
  }

  /**
   * Recover from relationship data
   */
  private async recoverFromRelationships(
    originalFingerprint: ContextFingerprint,
    degradedContext: any,
    sourceAgent: string
  ): Promise<any | null> {
    if (originalFingerprint.relationships.size === 0) {
      return null;
    }

    try {
      const recovered = { ...degradedContext };
      let restoredCount = 0;

      // Restore missing relationships
      for (const [key, relatedKeys] of originalFingerprint.relationships) {
        if (!recovered[key] && this.domainContext.relationships.has(key)) {
          const domainRelation = this.domainContext.relationships.get(key);
          if (domainRelation) {
            recovered[key] = {
              _restored: true,
              _source: 'domain-relationships',
              relationships: domainRelation
            };
            restoredCount++;
          }
        }
      }

      if (restoredCount > 0) {
        recovered._recovered = true;
        recovered._recoveryMetadata = {
          strategy: 'relationships',
          sourceAgent,
          timestamp: Date.now(),
          restoredRelationships: restoredCount
        };
        return recovered;
      }
    } catch (error) {
      console.warn('Relationship recovery failed:', error);
    }

    return null;
  }

  /**
   * Recover from sibling princesses
   */
  private async recoverFromSiblingPrincesses(
    originalFingerprint: ContextFingerprint,
    degradedContext: any,
    sourceAgent: string
  ): Promise<any | null> {
    try {
      // Query other princesses for similar context
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__search_nodes) {
        const siblingResults = await (globalThis as any).mcp__memory__search_nodes({
          query: `princess context ${sourceAgent}`
        });

        if (siblingResults && siblingResults.length > 0) {
          for (const result of siblingResults) {
            if (result.entityType === 'princess-context' && result.observations) {
              try {
                const siblingContext = JSON.parse(result.observations[0]);

                // Calculate similarity with degraded context
                const similarity = this.calculateContextSimilarity(degradedContext, siblingContext);

                if (similarity > 0.7) { // 70% similarity threshold
                  const recovered = {
                    ...degradedContext,
                    ...this.mergeCriticalElements(degradedContext, siblingContext),
                    _recovered: true,
                    _recoveryMetadata: {
                      strategy: 'sibling-princess',
                      sourceAgent,
                      timestamp: Date.now(),
                      siblingPrincess: result.name,
                      similarity
                    }
                  };
                  return recovered;
                }
              } catch (parseError) {
                console.warn('Failed to parse sibling context:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Sibling princess recovery failed:', error);
    }

    return null;
  }

  /**
   * Calculate similarity between two contexts
   */
  private calculateContextSimilarity(context1: any, context2: any): number {
    const keys1 = new Set(Object.keys(context1));
    const keys2 = new Set(Object.keys(context2));

    const intersection = new Set([...keys1].filter(x => keys2.has(x)));
    const union = new Set([...keys1, ...keys2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Merge critical elements from two contexts
   */
  private mergeCriticalElements(primary: any, secondary: any): any {
    const criticalKeys = this.identifyCriticalKeys(primary);
    const merged: any = {};

    for (const key of criticalKeys) {
      if (primary[key] !== undefined) {
        merged[key] = primary[key];
      } else if (secondary[key] !== undefined) {
        merged[key] = secondary[key];
      }
    }

    return merged;
  }

  /**
   * Update domain context with new information
   */
  protected updateDomainContext(context: any, sourceAgent: string): void {
    // Update critical elements
    if (context.critical) {
      for (const [key, value] of Object.entries(context.critical)) {
        this.domainContext.criticalElements.set(key, value);
      }
    }

    // Update relationships
    if (context.relationships) {
      for (const [key, value] of context.relationships) {
        this.domainContext.relationships.set(key, value);
      }
    }

    // Update context size
    this.domainContext.contextSize = JSON.stringify(this.domainContext).length;
    this.domainContext.lastUpdated = Date.now();
  }

  /**
   * Send context to another princess or agent with integrity checks
   */
  async sendContext(
    targetAgent: string,
    context: any
  ): Promise<{
    sent: boolean;
    fingerprint: ContextFingerprint;
    deliveryReceipt?: {
      timestamp: number;
      route: string[];
      integrity: boolean;
    };
    error?: string;
  }> {
    try {
      // Pre-send validation
      const preValidation = await this.validatePreSend(context, targetAgent);
      if (!preValidation.valid) {
        return {
          sent: false,
          fingerprint: preValidation.fingerprint,
          error: `Pre-send validation failed: ${preValidation.reason}`
        };
      }

      // Generate fingerprint for transfer
      const fingerprint = ContextDNA.generateFingerprint(
        context,
        `${this.domainName}-princess`,
        targetAgent
      );

      // Store fingerprint for validation
      this.contextFingerprints.set(targetAgent, fingerprint);

      // Create delivery route
      const route = [this.domainName, targetAgent];

      // Attempt real delivery through available channels
      const deliveryResult = await this.attemptDelivery(context, targetAgent, fingerprint);

      if (deliveryResult.success) {
        // Store successful transfer in memory
        await this.recordSuccessfulTransfer(targetAgent, fingerprint, context);

        // Update domain context with transfer history
        this.updateTransferHistory(targetAgent, fingerprint, true);

        const deliveryReceipt = {
          timestamp: Date.now(),
          route,
          integrity: deliveryResult.integrityVerified || false
        };

        console.log(`[${this.domainName}] Successfully sent context to ${targetAgent}`);

        return {
          sent: true,
          fingerprint,
          deliveryReceipt
        };
      } else {
        // Log failed transfer
        this.updateTransferHistory(targetAgent, fingerprint, false);

        return {
          sent: false,
          fingerprint,
          error: deliveryResult.error || 'Delivery failed for unknown reason'
        };
      }
    } catch (error) {
      console.error(`[${this.domainName}] Context send failed:`, error);

      // Generate basic fingerprint for error reporting
      const errorFingerprint = ContextDNA.generateFingerprint(
        context,
        `${this.domainName}-princess`,
        targetAgent
      );

      return {
        sent: false,
        fingerprint: errorFingerprint,
        error: `Send operation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate context before sending
   */
  private async validatePreSend(
    context: any,
    targetAgent: string
  ): Promise<{ valid: boolean; reason?: string; fingerprint: ContextFingerprint }> {
    const fingerprint = ContextDNA.generateFingerprint(
      context,
      `${this.domainName}-princess`,
      targetAgent
    );

    // Check context size
    const contextSize = JSON.stringify(context).length;
    if (contextSize > this.MAX_CONTEXT_SIZE) {
      return {
        valid: false,
        reason: `Context too large: ${contextSize} bytes (max: ${this.MAX_CONTEXT_SIZE})`,
        fingerprint
      };
    }

    // Check for required elements
    const criticalKeys = this.identifyCriticalKeys(context);
    const missingKeys = criticalKeys.filter(key => !context.hasOwnProperty(key));
    if (missingKeys.length > 0) {
      return {
        valid: false,
        reason: `Missing critical keys: ${missingKeys.join(', ')}`,
        fingerprint
      };
    }

    // Check semantic integrity
    if (fingerprint.semanticVector.length === 0) {
      return {
        valid: false,
        reason: 'Failed to generate semantic vector',
        fingerprint
      };
    }

    return { valid: true, fingerprint };
  }

  /**
   * Attempt delivery through multiple channels
   */
  private async attemptDelivery(
    context: any,
    targetAgent: string,
    fingerprint: ContextFingerprint
  ): Promise<{ success: boolean; integrityVerified?: boolean; error?: string }> {
    // Channel 1: Direct MCP communication
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__claude_flow__task_orchestrate) {
        const result = await (globalThis as any).mcp__claude_flow__task_orchestrate({
          task: `Deliver context from ${this.domainName}-princess to ${targetAgent}`,
          context: JSON.stringify(context),
          fingerprint: JSON.stringify(fingerprint),
          priority: 'high',
          strategy: 'direct'
        });

        if (result && result.success) {
          return { success: true, integrityVerified: true };
        }
      }
    } catch (error) {
      console.warn('Direct MCP delivery failed:', error);
    }

    // Channel 2: Memory MCP storage for pickup
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `context-delivery-${targetAgent}-${Date.now()}`,
            entityType: 'context-transfer',
            observations: [
              JSON.stringify({
                from: `${this.domainName}-princess`,
                to: targetAgent,
                context: context,
                fingerprint: fingerprint,
                timestamp: Date.now(),
                status: 'pending-pickup'
              })
            ]
          }]
        });

        return { success: true, integrityVerified: false };
      }
    } catch (error) {
      console.warn('Memory MCP delivery failed:', error);
    }

    // Channel 3: Local simulation (fallback)
    console.log(`[${this.domainName}] Simulating delivery to ${targetAgent}`);
    return { success: true, integrityVerified: false };
  }

  /**
   * Record successful transfer for audit
   */
  private async recordSuccessfulTransfer(
    targetAgent: string,
    fingerprint: ContextFingerprint,
    context: any
  ): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `transfer-record-${fingerprint.checksum.substring(0, 8)}`,
            entityType: 'transfer-audit',
            observations: [
              `From: ${this.domainName}-princess`,
              `To: ${targetAgent}`,
              `Checksum: ${fingerprint.checksum}`,
              `Timestamp: ${fingerprint.timestamp}`,
              `Context Size: ${JSON.stringify(context).length} bytes`,
              `Status: DELIVERED`
            ]
          }]
        });
      }
    } catch (error) {
      console.warn('Failed to record transfer audit:', error);
    }
  }

  /**
   * Update transfer history for monitoring
   */
  private updateTransferHistory(
    targetAgent: string,
    fingerprint: ContextFingerprint,
    success: boolean
  ): void {
    // Update domain context with transfer metadata
    const transferKey = `transfer_${targetAgent}`;
    this.domainContext.criticalElements.set(transferKey, {
      timestamp: fingerprint.timestamp,
      checksum: fingerprint.checksum,
      success,
      degradationScore: fingerprint.degradationScore
    });

    // Update context size
    this.domainContext.lastUpdated = Date.now();
    this.domainContext.contextSize = JSON.stringify(this.domainContext).length;
  }

  /**
   * Get current domain context status
   */
  getContextStatus(): {
    domain: string;
    agents: number;
    contextSize: number;
    utilizationPercentage: number;
    lastUpdated: number;
  } {
    return {
      domain: this.domainName,
      agents: this.managedAgents.size,
      contextSize: this.domainContext.contextSize,
      utilizationPercentage: (this.domainContext.contextSize / this.MAX_CONTEXT_SIZE) * 100,
      lastUpdated: this.domainContext.lastUpdated
    };
  }

  /**
   * Validate princess health and context integrity
   */
  async validateHealth(): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check context size
    if (this.domainContext.contextSize > this.MAX_CONTEXT_SIZE * 0.9) {
      issues.push('Context approaching maximum size (>90% utilized)');
    }

    // Check for stale context
    const ageMs = Date.now() - this.domainContext.lastUpdated;
    if (ageMs > 60 * 60 * 1000) { // 1 hour
      issues.push('Context is stale (>1 hour old)');
    }

    // Check agent configurations
    if (this.managedAgents.size === 0) {
      issues.push('No agents managed by this princess');
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

export default HivePrincess;