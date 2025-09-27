import { MemoryEntry } from '../langroid/LangroidMemoryManager';
export interface ConflictResolutionStrategy {
  name: string;
  description: string;
  resolve: (current: MemoryEntry, incoming: MemoryEntry, context?: ConflictContext) => Promise<MemoryEntry>;
}
export interface ConflictContext {
  key: string;
  partitionId: string;
  sourceNode?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
export interface VectorClock {
  nodeId: string;
  counter: number;
  timestamp: number;
}
export interface VersionVector {
  clocks: Map<string, VectorClock>;
  version: number;
}
export interface ConflictResolutionResult {
  resolved: MemoryEntry;
  strategy: string;
  reason: string;
  conflictSeverity: 'low' | 'medium' | 'high';
  requiresManualReview: boolean;
}
export class MemoryConflictResolver {
  private strategies: Map<string, ConflictResolutionStrategy> = new Map();
  private versionVectors: Map<string, VersionVector> = new Map();
  private nodeId: string;
  constructor(nodeId?: string) {
    this.nodeId = nodeId || this.generateNodeId();
    this.initializeStrategies();
  }
  /**
   * Resolve conflict between two memory entries
   */
  async resolveConflict(
    current: MemoryEntry,
    incoming: MemoryEntry,
    strategyName: string = 'auto',
    context?: ConflictContext
  ): Promise<ConflictResolutionResult> {
    const strategy = strategyName === 'auto' ?
      await this.selectBestStrategy(current, incoming, context) :
      this.getStrategy(strategyName);
    if (!strategy) {
      throw new Error(`Unknown conflict resolution strategy: ${strategyName}`);
    }
    const resolved = await strategy.resolve(current, incoming, context);
    const severity = this.assessConflictSeverity(current, incoming);
    return {
      resolved,
      strategy: strategy.name,
      reason: `Resolved using ${strategy.name}: ${strategy.description}`,
      conflictSeverity: severity,
      requiresManualReview: severity === 'high'
    };
  }
  /**
   * Register a custom conflict resolution strategy
   */
  registerStrategy(strategy: ConflictResolutionStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }
  /**
   * Get available strategies
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
  /**
   * Update version vector for a key
   */
  updateVersionVector(key: string, nodeId?: string): VersionVector {
    const node = nodeId || this.nodeId;
    let vector = this.versionVectors.get(key);
    if (!vector) {
      vector = {
        clocks: new Map(),
        version: 1
      };
    }
    const clock = vector.clocks.get(node) || { nodeId: node, counter: 0, timestamp: 0 };
    clock.counter++;
    clock.timestamp = Date.now();
    vector.clocks.set(node, clock);
    vector.version++;
    this.versionVectors.set(key, vector);
    return vector;
  }
  /**
   * Compare version vectors to determine precedence
   */
  compareVersionVectors(vector1: VersionVector, vector2: VersionVector): 'before' | 'after' | 'concurrent' {
    let vector1Newer = false;
    let vector2Newer = false;
    // Get all node IDs from both vectors
    const allNodes = new Set([
      ...vector1.clocks.keys(),
      ...vector2.clocks.keys()
    ]);
    for (const nodeId of allNodes) {
      const clock1 = vector1.clocks.get(nodeId);
      const clock2 = vector2.clocks.get(nodeId);
      const counter1 = clock1?.counter || 0;
      const counter2 = clock2?.counter || 0;
      if (counter1 > counter2) {
        vector1Newer = true;
      } else if (counter2 > counter1) {
        vector2Newer = true;
      }
    }
    if (vector1Newer && !vector2Newer) {
      return 'after';
    } else if (vector2Newer && !vector1Newer) {
      return 'before';
    } else {
      return 'concurrent';
    }
  }
  /**
   * Merge two entries with semantic conflict resolution
   */
  async semanticMerge(current: MemoryEntry, incoming: MemoryEntry): Promise<MemoryEntry> {
    // Attempt to merge data based on its structure
    const currentData = current.data;
    const incomingData = incoming.data;
    // If both are objects, attempt field-level merge
    if (this.isObject(currentData) && this.isObject(incomingData)) {
      const merged = this.mergeObjects(currentData, incomingData);
      return {
        ...incoming, // Use incoming as base
        data: merged,
        version: Math.max(current.version, incoming.version) + 1,
        accessCount: Math.max(current.accessCount, incoming.accessCount),
        timestamp: Math.max(current.timestamp, incoming.timestamp)
      };
    }
    // If both are arrays, attempt array merge
    if (Array.isArray(currentData) && Array.isArray(incomingData)) {
      const merged = this.mergeArrays(currentData, incomingData);
      return {
        ...incoming,
        data: merged,
        version: Math.max(current.version, incoming.version) + 1
      };
    }
    // If different types, prefer the newer one
    return incoming.timestamp > current.timestamp ? incoming : current;
  }
  /**
   * Detect and classify conflict types
   */
  classifyConflict(current: MemoryEntry, incoming: MemoryEntry): string[] {
    const conflicts: string[] = [];
    // Version conflict
    if (current.version !== incoming.version) {
      conflicts.push('version');
    }
    // Timestamp conflict
    if (Math.abs(current.timestamp - incoming.timestamp) > 1000) {
      conflicts.push('timestamp');
    }
    // Data conflict
    if (JSON.stringify(current.data) !== JSON.stringify(incoming.data)) {
      conflicts.push('data');
    }
    // Size conflict
    if (Math.abs(current.size - incoming.size) > current.size * 0.1) {
      conflicts.push('size');
    }
    // Partition conflict
    if (current.partitionId !== incoming.partitionId) {
      conflicts.push('partition');
    }
    return conflicts;
  }
  private initializeStrategies(): void {
    // Last Write Wins strategy
    this.strategies.set('last-write-wins', {
      name: 'last-write-wins',
      description: 'Use the entry with the latest timestamp',
      resolve: async (current, incoming) => {
        return incoming.timestamp > current.timestamp ? incoming : current;
      }
    });
    // Version Vector strategy
    this.strategies.set('version-vector', {
      name: 'version-vector',
      description: 'Use version vectors to determine causality',
      resolve: async (current, incoming, context) => {
        const currentVector = this.versionVectors.get(context?.key || '');
        const incomingVector = this.versionVectors.get(`${context?.key}_incoming` || '');
        if (!currentVector || !incomingVector) {
          // Fallback to timestamp comparison
          return incoming.timestamp > current.timestamp ? incoming : current;
        }
        const comparison = this.compareVersionVectors(currentVector, incomingVector);
        switch (comparison) {
          case 'after':
            return current;
          case 'before':
            return incoming;
          case 'concurrent':
            // Concurrent updates - attempt semantic merge
            return await this.semanticMerge(current, incoming);
        }
      }
    });
    // Semantic Merge strategy
    this.strategies.set('semantic-merge', {
      name: 'semantic-merge',
      description: 'Attempt to merge data semantically',
      resolve: async (current, incoming) => {
        return await this.semanticMerge(current, incoming);
      }
    });
    // Size-based strategy
    this.strategies.set('larger-wins', {
      name: 'larger-wins',
      description: 'Use the entry with more data',
      resolve: async (current, incoming) => {
        return incoming.size > current.size ? incoming : current;
      }
    });
    // Access-based strategy
    this.strategies.set('more-accessed-wins', {
      name: 'more-accessed-wins',
      description: 'Use the entry that has been accessed more frequently',
      resolve: async (current, incoming) => {
        return incoming.accessCount > current.accessCount ? incoming : current;
      }
    });
    // Higher version wins
    this.strategies.set('higher-version-wins', {
      name: 'higher-version-wins',
      description: 'Use the entry with higher version number',
      resolve: async (current, incoming) => {
        return incoming.version > current.version ? incoming : current;
      }
    });
    // Manual review strategy
    this.strategies.set('manual-review', {
      name: 'manual-review',
      description: 'Mark for manual review and use current entry temporarily',
      resolve: async (current, incoming) => {
        // Return current but mark for manual review
        return {
          ...current,
          data: {
            ...current.data,
            __conflict__: {
              current: current.data,
              incoming: incoming.data,
              requiresManualReview: true,
              timestamp: Date.now()
            }
          }
        };
      }
    });
  }
  private async selectBestStrategy(
    current: MemoryEntry,
    incoming: MemoryEntry,
    context?: ConflictContext
  ): Promise<ConflictResolutionStrategy> {
    const conflicts = this.classifyConflict(current, incoming);
    const severity = this.assessConflictSeverity(current, incoming);
    // High severity conflicts require manual review
    if (severity === 'high') {
      return this.getStrategy('manual-review')!;
    }
    // If only timestamp conflict, use last-write-wins
    if (conflicts.length === 1 && conflicts.includes('timestamp')) {
      return this.getStrategy('last-write-wins')!;
    }
    // If data can be merged semantically, try semantic merge
    if (conflicts.includes('data') && this.canMergeSemanticall(current.data, incoming.data)) {
      return this.getStrategy('semantic-merge')!;
    }
    // If version conflict exists, use version-based resolution
    if (conflicts.includes('version')) {
      return this.getStrategy('higher-version-wins')!;
    }
    // Default to last-write-wins
    return this.getStrategy('last-write-wins')!;
  }
  private assessConflictSeverity(current: MemoryEntry, incoming: MemoryEntry): 'low' | 'medium' | 'high' {
    const conflicts = this.classifyConflict(current, incoming);
    // High severity: Multiple conflicts or partition conflicts
    if (conflicts.length >= 3 || conflicts.includes('partition')) {
      return 'high';
    }
    // Medium severity: Data + version conflicts
    if (conflicts.includes('data') && conflicts.includes('version')) {
      return 'medium';
    }
    // Low severity: Single conflict
    return 'low';
  }
  private canMergeSemanticall(data1: any, data2: any): boolean {
    // Can merge if both are objects or both are arrays
    return (this.isObject(data1) && this.isObject(data2)) ||
           (Array.isArray(data1) && Array.isArray(data2));
  }
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  private mergeObjects(obj1: any, obj2: any): any {
    const result = { ...obj1 };
    for (const [key, value] of Object.entries(obj2)) {
      if (key in result) {
        // If both values are objects, merge recursively
        if (this.isObject(result[key]) && this.isObject(value)) {
          result[key] = this.mergeObjects(result[key], value);
        } else if (Array.isArray(result[key]) && Array.isArray(value)) {
          result[key] = this.mergeArrays(result[key], value);
        } else {
          // For primitive values, prefer the newer one (obj2)
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  private mergeArrays(arr1: any[], arr2: any[]): any[] {
    // Simple array merge - remove duplicates and combine
    const combined = [...arr1, ...arr2];
    return Array.from(new Set(combined.map(item => JSON.stringify(item))))
      .map(item => JSON.parse(item));
  }
  private getStrategy(name: string): ConflictResolutionStrategy | undefined {
    return this.strategies.get(name);
  }
  private generateNodeId(): string {
    return `resolver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
export default MemoryConflictResolver;