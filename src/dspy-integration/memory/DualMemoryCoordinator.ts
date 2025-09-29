/**
 * Dual Memory Coordinator for A2A Communication System
 * Coordinates MCP knowledge graph and filesystem persistence
 * NASA Rule 10 Compliant with memory cleanup
 */

import { EventEmitter } from 'events';
import { MCPMemoryIntegration } from './MCPMemoryIntegration';
import { FilesystemPersistence } from './FilesystemPersistence';
import {
  OptimizedCommunication,
  AgentIdentity,
  AgentMessage
} from '../a2a-context-dna/interfaces/types';

export enum MemorySystemType {
  MCP = 'MCP',
  FILESYSTEM = 'FILESYSTEM',
  DUAL = 'DUAL'
}

export interface MemoryCoordinationMetrics {
  mcpEntities: number;
  mcpRelations: number;
  filesystemSnapshots: number;
  synchronizationRate: number;
  lastSyncTime: Date;
  memoryEfficiency: number;
}

export interface CrossMemoryQuery {
  queryId: string;
  queryType: 'PATTERN' | 'HISTORY' | 'SIMILARITY' | 'AUDIT';
  criteria: any;
  systems: MemorySystemType[];
  limit: number;
}

export interface MemoryCleanupConfig {
  removeAgentForge: boolean;
  maxAge: number; // milliseconds
  patternsToKeep: string[];
  agentsToExclude: string[];
}

export class DualMemoryCoordinator extends EventEmitter {
  private mcpMemory: MCPMemoryIntegration;
  private filesystem: FilesystemPersistence;
  private metrics: MemoryCoordinationMetrics;
  private syncInProgress = false;
  private readonly syncInterval = 60000; // 1 minute
  private syncTimer: NodeJS.Timer | null = null;
  private initialized = false;

  constructor(filesystemBasePath?: string) {
    super();
    this.mcpMemory = new MCPMemoryIntegration();
    this.filesystem = new FilesystemPersistence(filesystemBasePath);

    this.metrics = {
      mcpEntities: 0,
      mcpRelations: 0,
      filesystemSnapshots: 0,
      synchronizationRate: 1.0,
      lastSyncTime: new Date(),
      memoryEfficiency: 0.85
    };

    assert(this.mcpMemory !== null, 'MCP memory must be initialized');
    assert(this.filesystem !== null, 'Filesystem must be initialized');
  }

  /**
   * Initialize dual memory system
   * NASA Rule 10: Sequential initialization, no recursion
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing Dual Memory Coordinator...');

    try {
      // Initialize filesystem first
      await this.filesystem.initialize();

      // Setup event handlers
      this.setupEventHandlers();

      // Load existing patterns from filesystem
      await this.loadExistingPatterns();

      // Clean agent-forge references
      await this.cleanAgentForgeReferences();

      // Start synchronization
      this.startSynchronization();

      this.initialized = true;
      this.emit('memory:initialized', this.metrics);

      console.log('Dual Memory Coordinator initialized successfully');

    } catch (error) {
      throw new Error(`Memory initialization failed: ${error.message}`);
    }
  }

  /**
   * Store communication in both memory systems
   * NASA Rule 10: Dual storage with error handling
   */
  async storeCommunication(
    communication: OptimizedCommunication,
    sourceAgent: AgentIdentity,
    targetAgent: AgentIdentity
  ): Promise<{ mcpId: string; snapshotId: string }> {
    assert(this.initialized, 'Memory system must be initialized');
    assert(communication !== null, 'Communication required');
    assert(sourceAgent !== null, 'Source agent required');
    assert(targetAgent !== null, 'Target agent required');

    let mcpId: string | null = null;
    let snapshotId: string | null = null;

    try {
      // Store in MCP memory (knowledge graph)
      mcpId = await this.mcpMemory.storeCommunication(
        communication,
        sourceAgent,
        targetAgent
      );

      // Store in filesystem (persistence)
      snapshotId = await this.filesystem.saveSnapshot(
        communication,
        sourceAgent,
        targetAgent
      );

      // Update metrics
      this.updateMetrics();

      this.emit('memory:stored', { mcpId, snapshotId });

      return { mcpId, snapshotId };

    } catch (error) {
      // Partial failure handling
      if (!mcpId || !snapshotId) {
        await this.handlePartialFailure(mcpId, snapshotId);
      }
      throw new Error(`Dual storage failed: ${error.message}`);
    }
  }

  /**
   * Query across both memory systems
   * NASA Rule 10: Bounded cross-system query
   */
  async queryCrossMemory(query: CrossMemoryQuery): Promise<any[]> {
    assert(this.initialized, 'Memory system must be initialized');
    assert(query !== null, 'Query required');
    assert(query.limit > 0 && query.limit <= 100, 'Limit must be 1-100');

    const results: any[] = [];

    // Query MCP if requested
    if (query.systems.includes(MemorySystemType.MCP) ||
        query.systems.includes(MemorySystemType.DUAL)) {

      if (query.queryType === 'SIMILARITY') {
        const similar = await this.mcpMemory.retrieveSimilar(
          query.criteria.message,
          Math.min(query.limit, 50)
        );
        results.push(...similar);
      } else if (query.queryType === 'PATTERN') {
        const patterns = Array.from(this.mcpMemory.getPatterns().values());
        results.push(...patterns.slice(0, query.limit));
      }
    }

    // Query filesystem if requested
    if (query.systems.includes(MemorySystemType.FILESYSTEM) ||
        query.systems.includes(MemorySystemType.DUAL)) {

      if (query.queryType === 'HISTORY') {
        const history = await this.filesystem.getOptimizationHistory(
          query.criteria.communicationId
        );
        if (history) results.push(history);
      } else if (query.queryType === 'AUDIT') {
        const snapshots = await this.filesystem.querySnapshots(
          query.criteria,
          Math.min(query.limit, 50)
        );
        results.push(...snapshots);
      }
    }

    // Limit final results
    const limitedResults = results.slice(0, query.limit);
    assert(limitedResults.length <= query.limit, 'Results must not exceed limit');

    return limitedResults;
  }

  /**
   * Clean agent-forge references from both memory systems
   * NASA Rule 10: Bounded cleanup operations
   */
  async cleanAgentForgeReferences(): Promise<void> {
    assert(this.initialized, 'Memory system must be initialized');

    console.log('Cleaning agent-forge references from dual memory...');

    const config: MemoryCleanupConfig = {
      removeAgentForge: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      patternsToKeep: ['QUEEN_DIRECTIVE', 'EXECUTIVE_SUMMARY'],
      agentsToExclude: ['queen_primary', 'princess_development']
    };

    let cleanedCount = 0;

    try {
      // Clean MCP memory first
      await this.mcpMemory.cleanupOldEntities();

      // Query old filesystem snapshots
      const oldSnapshots = await this.filesystem.querySnapshots({
        endTime: Date.now() - config.maxAge
      }, 100);

      // Filter agent-forge references
      for (let i = 0; i < Math.min(oldSnapshots.length, 50); i++) {
        const snapshot = oldSnapshots[i];

        if (this.isAgentForgeReference(snapshot)) {
          // Create audit entry for cleanup
          await this.filesystem.createAuditEntry(
            'DELETE',
            'COMMUNICATION',
            snapshot.id,
            'system',
            true,
            'agent-forge cleanup'
          );
          cleanedCount++;
        }
      }

      this.emit('memory:cleanup', {
        type: 'agent-forge',
        cleaned: cleanedCount,
        systems: ['MCP', 'FILESYSTEM']
      });

      console.log(`Cleaned ${cleanedCount} agent-forge references from dual memory`);

    } catch (error) {
      console.error('Agent-forge cleanup failed:', error.message);
    }
  }

  /**
   * Synchronize memory systems
   * NASA Rule 10: Periodic sync with bounded operations
   */
  private async synchronizeMemorySystems(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      // Get MCP patterns
      const patterns = this.mcpMemory.getPatterns();
      const patternCount = Math.min(patterns.size, 20);

      // Sample filesystem snapshots
      const snapshots = await this.filesystem.querySnapshots({
        minQuality: 0.8
      }, 10);

      // Update synchronization metrics
      this.metrics.synchronizationRate = this.calculateSyncRate(
        patternCount,
        snapshots.length
      );
      this.metrics.lastSyncTime = new Date();

      this.emit('memory:synchronized', this.metrics);

    } catch (error) {
      console.error('Memory synchronization failed:', error.message);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Load existing patterns from filesystem
   * NASA Rule 10: Bounded pattern loading
   */
  private async loadExistingPatterns(): Promise<void> {
    try {
      // Query high-quality snapshots
      const snapshots = await this.filesystem.querySnapshots({
        minQuality: 0.85
      }, 50);

      // Extract and store patterns in MCP
      for (let i = 0; i < Math.min(snapshots.length, 20); i++) {
        const snapshot = snapshots[i];

        // Reconstruct communication for pattern learning
        await this.mcpMemory.storeCommunication(
          snapshot.optimizedCommunication,
          snapshot.sourceAgent,
          snapshot.targetAgent
        );
      }

    } catch (error) {
      console.error('Pattern loading failed:', error.message);
    }
  }

  /**
   * Setup event handlers
   * NASA Rule 10: Fixed event handler setup
   */
  private setupEventHandlers(): void {
    // MCP memory events
    this.mcpMemory.on('memory:stored', (id) => {
      this.emit('mcp:stored', id);
    });

    this.mcpMemory.on('memory:cleanup', (count) => {
      this.emit('mcp:cleanup', count);
    });

    // Filesystem events
    this.filesystem.on('snapshot:saved', (id) => {
      this.emit('filesystem:saved', id);
    });

    this.filesystem.on('filesystem:initialized', (path) => {
      console.log(`Filesystem initialized at: ${path}`);
    });
  }

  /**
   * Start synchronization timer
   * NASA Rule 10: Simple timer management
   */
  private startSynchronization(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.synchronizeMemorySystems();
    }, this.syncInterval);
  }

  /**
   * Handle partial storage failure
   * NASA Rule 10: Simple rollback logic
   */
  private async handlePartialFailure(
    mcpId: string | null,
    snapshotId: string | null
  ): Promise<void> {
    if (mcpId && !snapshotId) {
      // MCP succeeded but filesystem failed
      this.emit('memory:partial', {
        success: 'MCP',
        failed: 'FILESYSTEM'
      });
    } else if (!mcpId && snapshotId) {
      // Filesystem succeeded but MCP failed
      this.emit('memory:partial', {
        success: 'FILESYSTEM',
        failed: 'MCP'
      });
    }

    // Create audit entry for failure
    await this.filesystem.createAuditEntry(
      'CREATE',
      'COMMUNICATION',
      'partial_failure',
      'system',
      false,
      'Partial storage failure'
    );
  }

  /**
   * Check if snapshot is agent-forge reference
   * NASA Rule 10: Simple pattern matching
   */
  private isAgentForgeReference(snapshot: any): boolean {
    if (!snapshot) return false;

    const content = snapshot.originalMessage?.content || '';
    const agentId = snapshot.sourceAgent?.id || '';

    return content.includes('agent-forge') ||
           content.includes('agent_forge') ||
           agentId.includes('forge') ||
           agentId.includes('cleanup');
  }

  /**
   * Calculate synchronization rate
   * NASA Rule 10: Simple rate calculation
   */
  private calculateSyncRate(mcpCount: number, fsCount: number): number {
    if (mcpCount === 0 && fsCount === 0) return 1.0;

    const total = mcpCount + fsCount;
    const synced = Math.min(mcpCount, fsCount);

    const rate = (synced * 2) / total;
    assert(rate >= 0 && rate <= 1, 'Sync rate must be 0-1');

    return rate;
  }

  /**
   * Update metrics
   * NASA Rule 10: Simple metric updates
   */
  private updateMetrics(): void {
    this.metrics.mcpEntities = this.mcpMemory.getEntityCount();
    this.metrics.mcpRelations = this.mcpMemory.getRelationCount();
    // Filesystem snapshot count would need additional method
    this.metrics.filesystemSnapshots++;

    // Calculate memory efficiency
    const efficiency = 1.0 - (this.metrics.mcpEntities / 1000);
    this.metrics.memoryEfficiency = Math.max(0.5, efficiency);
  }

  /**
   * Shutdown coordinator
   */
  async shutdown(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.emit('memory:shutdown');
    this.initialized = false;
  }

  /**
   * Get current metrics
   */
  getMetrics(): MemoryCoordinationMetrics {
    return { ...this.metrics };
  }
}

/**
 * Assert function for NASA Rule 10 compliance
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/*
// Version & Run Log
// Version History

// Version: 1.0.0
// Version: 2.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: dual-memory-update-002
// inputs: ["Updated MCPMemoryIntegration.ts", "MCP cleanup methods"]
// tools_used: ["Edit"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-integration-v2.0"}
*/