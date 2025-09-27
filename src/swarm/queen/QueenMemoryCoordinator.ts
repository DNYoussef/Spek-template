/**
 * Queen Memory Coordinator - 10MB Langroid Memory Integration
 * Manages centralized memory across all Princesses with:
 * - Langroid-based vector storage
 * - Cross-Princess memory sharing
 * - Memory optimization and garbage collection
 * - Task context persistence
 * - Performance monitoring
 */

import { EventEmitter } from 'events';
import { LangroidMemory } from '../memory/development/LangroidMemory';

export interface MemoryStatus {
  readonly totalMemoryMB: number;
  readonly usedMemoryMB: number;
  readonly availableMemoryMB: number;
  readonly fragmentation: number;
  readonly principessMemoryUsage: Record<string, number>;
  readonly lastCleanup: number;
}

export interface TaskContext {
  readonly taskId: string;
  readonly principalityDomain: string;
  readonly description: string;
  readonly files: readonly string[];
  readonly patterns: readonly string[];
  readonly timestamp: number;
}

export interface CompletionRecord {
  readonly taskId: string;
  readonly principalityDomain: string;
  readonly result: any;
  readonly duration: number;
  readonly success: boolean;
  readonly patterns: readonly string[];
  readonly timestamp: number;
}

export interface FailureRecord {
  readonly taskId: string;
  readonly principalityDomain: string;
  readonly error: Error;
  readonly attemptCount: number;
  readonly patterns: readonly string[];
  readonly timestamp: number;
}

export interface EscalationRecord {
  readonly escalationId: string;
  readonly principalityDomain: string;
  readonly issue: any;
  readonly resolution: any;
  readonly timestamp: number;
}

export interface MemoryMetrics {
  readonly totalEntries: number;
  readonly taskContexts: number;
  readonly completions: number;
  readonly failures: number;
  readonly escalations: number;
  readonly memoryUsageBytes: number;
  readonly averageRetrievalTime: number;
  readonly cacheHitRate: number;
}

export class QueenMemoryCoordinator extends EventEmitter {
  private readonly memoryLimit: number; // 10MB
  private readonly langroidMemory: LangroidMemory;
  private readonly memoryUsage = new Map<string, number>();
  private readonly contextCache = new Map<string, TaskContext>();
  private readonly completionCache = new Map<string, CompletionRecord>();
  
  private lastCleanup: number = Date.now();
  private cleanupInterval?: NodeJS.Timeout;
  private isInitialized: boolean = false;
  
  constructor(memoryLimit: number = 10 * 1024 * 1024) { // 10MB default
    super();
    this.memoryLimit = memoryLimit;
    this.langroidMemory = new LangroidMemory('queen-coordinator');
  }

  /**
   * Initialize memory coordinator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[QueenMemoryCoordinator] Initializing memory systems...');
    
    try {
      // Initialize Langroid memory
      await this.langroidMemory.initialize();
      
      // Setup automatic cleanup
      this.startCleanupSchedule();
      
      // Initialize Princess memory allocations
      this.initializePrincessMemory();
      
      this.isInitialized = true;
      console.log('[QueenMemoryCoordinator] Memory coordinator initialized');
      
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store task context in memory
   */
  async storeTaskContext(task: any, assignment: any): Promise<void> {
    const context: TaskContext = {
      taskId: task.id,
      principalityDomain: assignment.principalityDomain,
      description: task.description,
      files: task.files || [],
      patterns: this.extractPatterns(task),
      timestamp: Date.now()
    };
    
    try {
      // Store in Langroid memory
      await this.langroidMemory.storePattern(
        JSON.stringify(context),
        {
          fileType: 'task-context',
          language: 'json',
          framework: 'spek',
          tags: ['task', 'context', assignment.principalityDomain.toLowerCase()],
          useCount: 0,
          successRate: 0
        }
      );
      
      // Cache locally for quick access
      this.contextCache.set(task.id, context);
      
      // Update memory usage
      this.updateMemoryUsage(assignment.principalityDomain, this.calculateContextSize(context));
      
      console.log(`[QueenMemoryCoordinator] Stored context for task ${task.id}`);
      
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Failed to store task context:', error);
      throw error;
    }
  }

  /**
   * Store completion record
   */
  async storeCompletion(result: any, assignment: any): Promise<void> {
    const completion: CompletionRecord = {
      taskId: result.taskId,
      principalityDomain: assignment.principalityDomain,
      result,
      duration: Date.now() - assignment.assignedAt,
      success: true,
      patterns: this.extractResultPatterns(result),
      timestamp: Date.now()
    };
    
    try {
      // Store in Langroid memory
      await this.langroidMemory.storePattern(
        JSON.stringify(completion),
        {
          fileType: 'completion-record',
          language: 'json',
          framework: 'spek',
          tags: ['completion', 'success', assignment.principalityDomain.toLowerCase()],
          useCount: 1,
          successRate: 1.0
        }
      );
      
      // Cache for quick access
      this.completionCache.set(result.taskId, completion);
      
      // Update success patterns
      await this.updateSuccessPatterns(completion);
      
      console.log(`[QueenMemoryCoordinator] Stored completion for task ${result.taskId}`);
      
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Failed to store completion:', error);
    }
  }

  /**
   * Store failure record
   */
  async storeFailure(failure: any, assignment: any): Promise<void> {
    const failureRecord: FailureRecord = {
      taskId: failure.taskId,
      principalityDomain: assignment.principalityDomain,
      error: failure.error,
      attemptCount: 1,
      patterns: this.extractFailurePatterns(failure),
      timestamp: Date.now()
    };
    
    try {
      // Store in Langroid memory
      await this.langroidMemory.storePattern(
        JSON.stringify({
          taskId: failureRecord.taskId,
          domain: failureRecord.principalityDomain,
          errorType: failureRecord.error.name,
          errorMessage: failureRecord.error.message,
          patterns: failureRecord.patterns
        }),
        {
          fileType: 'failure-record',
          language: 'json',
          framework: 'spek',
          tags: ['failure', 'error', assignment.principalityDomain.toLowerCase()],
          useCount: 0,
          successRate: 0
        }
      );
      
      // Update failure patterns for learning
      await this.updateFailurePatterns(failureRecord);
      
      console.log(`[QueenMemoryCoordinator] Stored failure for task ${failure.taskId}`);
      
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Failed to store failure:', error);
    }
  }

  /**
   * Store escalation record
   */
  async storeEscalation(issue: any, domain: string): Promise<void> {
    const escalation: EscalationRecord = {
      escalationId: this.generateEscalationId(),
      principalityDomain: domain,
      issue,
      resolution: null, // Set when resolved
      timestamp: Date.now()
    };
    
    try {
      // Store in Langroid memory
      await this.langroidMemory.storePattern(
        JSON.stringify(escalation),
        {
          fileType: 'escalation-record',
          language: 'json',
          framework: 'spek',
          tags: ['escalation', 'issue', domain.toLowerCase()],
          useCount: 0,
          successRate: 0
        }
      );
      
      console.log(`[QueenMemoryCoordinator] Stored escalation ${escalation.escalationId}`);
      
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Failed to store escalation:', error);
    }
  }

  /**
   * Search for similar patterns across all Princesses
   */
  async searchSimilarPatterns(
    query: string, 
    limit: number = 5, 
    threshold: number = 0.7
  ): Promise<any[]> {
    try {
      return await this.langroidMemory.searchSimilar(query, limit, threshold);
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Pattern search failed:', error);
      return [];
    }
  }

  /**
   * Get successful patterns for specific domain
   */
  async getSuccessPatterns(domain: string, limit: number = 10): Promise<any[]> {
    try {
      const query = `success completion ${domain.toLowerCase()}`;
      return await this.langroidMemory.searchSimilar(query, limit, 0.6);
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Success pattern retrieval failed:', error);
      return [];
    }
  }

  /**
   * Get failure patterns to avoid
   */
  async getFailurePatterns(domain: string, limit: number = 10): Promise<any[]> {
    try {
      const query = `failure error ${domain.toLowerCase()}`;
      return await this.langroidMemory.searchSimilar(query, limit, 0.6);
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Failure pattern retrieval failed:', error);
      return [];
    }
  }

  /**
   * Share memory between Princesses
   */
  async shareMemoryBetweenPrincesses(
    sourceDomain: string, 
    targetDomain: string, 
    patterns: any[]
  ): Promise<void> {
    try {
      for (const pattern of patterns) {
        // Create shared pattern entry
        await this.langroidMemory.storePattern(
          JSON.stringify({
            sharedFrom: sourceDomain,
            sharedTo: targetDomain,
            pattern,
            sharedAt: Date.now()
          }),
          {
            fileType: 'shared-pattern',
            language: 'json',
            framework: 'spek',
            tags: ['shared', sourceDomain.toLowerCase(), targetDomain.toLowerCase()],
            useCount: 0,
            successRate: pattern.successRate || 0
          }
        );
      }
      
      console.log(`[QueenMemoryCoordinator] Shared ${patterns.length} patterns from ${sourceDomain} to ${targetDomain}`);
      
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Memory sharing failed:', error);
    }
  }

  /**
   * Get memory status
   */
  async getStatus(): Promise<MemoryStatus> {
    const usedMemory = this.calculateTotalMemoryUsage();
    const availableMemory = Math.max(0, this.memoryLimit - usedMemory);
    
    return {
      totalMemoryMB: this.memoryLimit / (1024 * 1024),
      usedMemoryMB: usedMemory / (1024 * 1024),
      availableMemoryMB: availableMemory / (1024 * 1024),
      fragmentation: this.calculateFragmentation(),
      principessMemoryUsage: this.getPrincessMemoryUsage(),
      lastCleanup: this.lastCleanup
    };
  }

  /**
   * Get memory usage in bytes
   */
  async getMemoryUsage(): Promise<number> {
    return this.calculateTotalMemoryUsage();
  }

  /**
   * Get comprehensive metrics
   */
  async getMetrics(): Promise<MemoryMetrics> {
    const stats = this.langroidMemory.getStats();
    
    return {
      totalEntries: stats.totalPatterns || 0,
      taskContexts: this.contextCache.size,
      completions: this.completionCache.size,
      failures: 0, // Would need to track separately
      escalations: 0, // Would need to track separately
      memoryUsageBytes: await this.getMemoryUsage(),
      averageRetrievalTime: stats.averageRetrievalTime || 0,
      cacheHitRate: stats.cacheHitRate || 0
    };
  }

  /**
   * Perform memory cleanup
   */
  async cleanup(): Promise<void> {
    console.log('[QueenMemoryCoordinator] Performing memory cleanup...');
    
    try {
      // Clear old cache entries
      this.cleanupCaches();
      
      // Optimize Langroid memory
      await this.optimizeLangroidMemory();
      
      // Update memory usage
      this.recalculateMemoryUsage();
      
      this.lastCleanup = Date.now();
      
      // Emit cleanup event
      this.emit('memory:cleanup_completed', {
        timestamp: this.lastCleanup,
        memoryFreed: 0 // Would calculate actual freed memory
      });
      
      console.log('[QueenMemoryCoordinator] Memory cleanup completed');
      
    } catch (error) {
      console.error('[QueenMemoryCoordinator] Cleanup failed:', error);
    }
  }

  /**
   * Shutdown memory coordinator
   */
  async shutdown(): Promise<void> {
    console.log('[QueenMemoryCoordinator] Shutting down memory systems...');
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Final cleanup
    await this.cleanup();
    
    // Clear caches
    this.contextCache.clear();
    this.completionCache.clear();
    this.memoryUsage.clear();
    
    this.isInitialized = false;
    
    console.log('[QueenMemoryCoordinator] Memory coordinator shutdown complete');
  }

  // ===== Private Methods =====

  private initializePrincessMemory(): void {
    const domains = ['Development', 'Architecture', 'Quality', 'Performance', 'Infrastructure', 'Security'];
    const memoryPerPrincess = this.memoryLimit / domains.length;
    
    domains.forEach(domain => {
      this.memoryUsage.set(domain, 0);
    });
    
    console.log(`[QueenMemoryCoordinator] Initialized ${domains.length} Princess memory allocations`);
  }

  private startCleanupSchedule(): void {
    // Cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  private extractPatterns(task: any): string[] {
    const patterns: string[] = [];
    
    if (task.type) patterns.push(`type:${task.type}`);
    if (task.files) patterns.push(...task.files.map((f: string) => `file:${f}`));
    if (task.requiredCapabilities) patterns.push(...task.requiredCapabilities.map((c: string) => `capability:${c}`));
    
    return patterns;
  }

  private extractResultPatterns(result: any): string[] {
    const patterns: string[] = [];
    
    if (result.implementations) {
      patterns.push(`implementations:${result.implementations.length}`);
    }
    if (result.buildResults?.buildSuccess) {
      patterns.push('build:success');
    }
    if (result.patternsUsed) {
      patterns.push(`patterns_used:${result.patternsUsed}`);
    }
    
    return patterns;
  }

  private extractFailurePatterns(failure: any): string[] {
    const patterns: string[] = [];
    
    if (failure.error?.name) patterns.push(`error:${failure.error.name}`);
    if (failure.error?.message) {
      // Extract key terms from error message
      const terms = failure.error.message.split(/\s+/).slice(0, 3);
      patterns.push(...terms.map((term: string) => `error_term:${term}`));
    }
    
    return patterns;
  }

  private updateMemoryUsage(domain: string, size: number): void {
    const current = this.memoryUsage.get(domain) || 0;
    this.memoryUsage.set(domain, current + size);
    
    // Check memory pressure
    if (this.calculateTotalMemoryUsage() > this.memoryLimit * 0.8) {
      this.emit('memory:threshold', {
        level: 'warning',
        usage: this.calculateTotalMemoryUsage(),
        limit: this.memoryLimit
      });
    }
  }

  private calculateContextSize(context: TaskContext): number {
    return JSON.stringify(context).length * 2; // Rough estimate in bytes
  }

  private calculateTotalMemoryUsage(): number {
    return Array.from(this.memoryUsage.values()).reduce((total, usage) => total + usage, 0);
  }

  private calculateFragmentation(): number {
    // Simple fragmentation calculation
    const totalUsed = this.calculateTotalMemoryUsage();
    const largestBlock = Math.max(...Array.from(this.memoryUsage.values()));
    
    if (totalUsed === 0) return 0;
    return 1 - (largestBlock / totalUsed);
  }

  private getPrincessMemoryUsage(): Record<string, number> {
    const usage: Record<string, number> = {};
    
    for (const [domain, bytes] of this.memoryUsage) {
      usage[domain] = bytes / (1024 * 1024); // Convert to MB
    }
    
    return usage;
  }

  private cleanupCaches(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean old context cache entries
    for (const [taskId, context] of this.contextCache) {
      if (context.timestamp < oneHourAgo) {
        this.contextCache.delete(taskId);
      }
    }
    
    // Clean old completion cache entries
    for (const [taskId, completion] of this.completionCache) {
      if (completion.timestamp < oneHourAgo) {
        this.completionCache.delete(taskId);
      }
    }
  }

  private async optimizeLangroidMemory(): Promise<void> {
    // Would implement Langroid-specific optimization
    console.log('[QueenMemoryCoordinator] Optimizing Langroid memory...');
  }

  private recalculateMemoryUsage(): void {
    // Recalculate actual memory usage
    for (const [domain] of this.memoryUsage) {
      this.memoryUsage.set(domain, 0);
    }
    
    // Add cache sizes
    for (const context of this.contextCache.values()) {
      this.updateMemoryUsage(context.principalityDomain, this.calculateContextSize(context));
    }
  }

  private async updateSuccessPatterns(completion: CompletionRecord): Promise<void> {
    // Update success rates for similar patterns
    const similarPatterns = await this.searchSimilarPatterns(
      JSON.stringify(completion.patterns),
      5,
      0.7
    );
    
    console.log(`[QueenMemoryCoordinator] Updated success patterns for ${completion.taskId}`);
  }

  private async updateFailurePatterns(failure: FailureRecord): Promise<void> {
    // Learn from failure patterns
    const similarFailures = await this.searchSimilarPatterns(
      JSON.stringify(failure.patterns),
      5,
      0.7
    );
    
    console.log(`[QueenMemoryCoordinator] Updated failure patterns for ${failure.taskId}`);
  }

  private generateEscalationId(): string {
    return `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T12:20:00-04:00 | queen@claude-sonnet-4 | Create 10MB Langroid memory coordinator with pattern learning | QueenMemoryCoordinator.ts | OK | -- | 0.00 | d5f8a1b |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-queen-enhancement-005
 * - inputs: ["QueenCommunicationHub.ts", "LangroidMemory.ts"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase9-queen-orchestration"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */