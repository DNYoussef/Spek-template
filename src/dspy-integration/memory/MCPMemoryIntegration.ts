/**
 * MCP Memory Integration for A2A Communication System
 * Connects DSPy-optimized communication to MCP knowledge graph
 * NASA Rule 10 Compliant with accurate MCP tool integration
 */

import { EventEmitter } from 'events';
import {
  AgentMessage,
  OptimizedCommunication,
  AgentIdentity
} from '../a2a-context-dna/interfaces/types';

export enum MemoryOperationType {
  STORE_COMMUNICATION = 'STORE_COMMUNICATION',
  RETRIEVE_SIMILAR = 'RETRIEVE_SIMILAR',
  UPDATE_RELATION = 'UPDATE_RELATION',
  RECOGNIZE_PATTERN = 'RECOGNIZE_PATTERN',
  CLEANUP = 'CLEANUP'
}

export interface MCPEntity {
  name: string;
  entityType: string;
  observations: string[];
}

export interface MCPRelation {
  from: string;
  to: string;
  relationType: string;
}

export interface PatternRecognition {
  patternId: string;
  patternType: 'QUEEN_DIRECTIVE' | 'TASK_DELEGATION' | 'STATUS_REPORT' | 'EXECUTIVE_SUMMARY';
  frequency: number;
  qualityImprovement: number;
  lastSeen: Date;
}

export class MCPMemoryIntegration extends EventEmitter {
  private localPatterns: Map<string, PatternRecognition> = new Map();
  private readonly maxPatterns = 100;
  private readonly patternThreshold = 0.75;
  private readonly mcpAvailable: boolean;

  constructor() {
    super();
    this.mcpAvailable = typeof global !== 'undefined' &&
                       typeof (global as any).mcpMemoryTools !== 'undefined';

    if (!this.mcpAvailable) {
      console.warn('MCP memory tools not available, using local patterns only');
    }

    assert(this.localPatterns instanceof Map, 'Local patterns map must be initialized');
  }

  /**
   * Store communication in MCP knowledge graph
   * NASA Rule 10: Bounded storage with MCP integration
   */
  async storeCommunication(
    communication: OptimizedCommunication,
    sourceAgent: AgentIdentity,
    targetAgent: AgentIdentity
  ): Promise<string> {
    assert(communication !== null, 'Communication required');
    assert(sourceAgent !== null, 'Source agent required');
    assert(targetAgent !== null, 'Target agent required');

    const communicationId = `comm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      if (this.mcpAvailable) {
        // Create entities in MCP knowledge graph
        const entities: MCPEntity[] = [
          {
            name: `agent_${sourceAgent.id}`,
            entityType: 'AGENT',
            observations: [
              `Role: ${sourceAgent.role}`,
              `Type: ${sourceAgent.type}`,
              `Active communication participant`
            ]
          },
          {
            name: `agent_${targetAgent.id}`,
            entityType: 'AGENT',
            observations: [
              `Role: ${targetAgent.role}`,
              `Type: ${targetAgent.type}`,
              `Message recipient`
            ]
          },
          {
            name: communicationId,
            entityType: 'COMMUNICATION',
            observations: [
              `Content: ${communication.optimizedMessage.content.slice(0, 200)}`,
              `Quality Score: ${communication.qualityScore}`,
              `Context DNA: ${JSON.stringify(communication.contextDNA).slice(0, 100)}`,
              `Timestamp: ${communication.optimizedMessage.timestamp}`,
              `Priority: ${communication.optimizedMessage.priority}`,
              `Optimization Applied: DSPy A2A Engine`
            ]
          }
        ];

        // Store entities in MCP
        await this.createMCPEntities(entities);

        // Create relations
        const relations: MCPRelation[] = [
          {
            from: `agent_${sourceAgent.id}`,
            to: communicationId,
            relationType: 'SENT'
          },
          {
            from: communicationId,
            to: `agent_${targetAgent.id}`,
            relationType: 'RECEIVED'
          }
        ];

        await this.createMCPRelations(relations);
      }

      // Recognize and store patterns locally
      const pattern = await this.recognizePattern(communication);
      if (pattern) {
        this.storePatternLocally(pattern);
      }

      this.emit('memory:stored', communicationId);
      return communicationId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('MCP storage failed:', errorMessage);

      // Fallback to local pattern storage only
      const pattern = await this.recognizePattern(communication);
      if (pattern) {
        this.storePatternLocally(pattern);
      }

      this.emit('memory:stored', communicationId);
      return communicationId;
    }
  }

  /**
   * Retrieve similar communications using MCP search
   * NASA Rule 10: Bounded retrieval with MCP integration
   */
  async retrieveSimilar(
    message: AgentMessage,
    limit: number = 10
  ): Promise<OptimizedCommunication[]> {
    assert(message !== null, 'Message required for retrieval');
    assert(limit > 0 && limit <= 100, 'Limit must be 1-100');

    const similar: OptimizedCommunication[] = [];

    try {
      if (this.mcpAvailable) {
        // Search MCP knowledge graph for similar communications
        const searchResults = await this.searchMCPNodes(message.content, Math.min(limit, 50));

        // Convert MCP results to OptimizedCommunication format
        for (let i = 0; i < Math.min(searchResults.length, limit); i++) {
          const result = searchResults[i];
          if (result.entityType === 'COMMUNICATION') {
            const reconstructed = this.reconstructFromMCP(result);
            if (reconstructed) {
              similar.push(reconstructed);
            }
          }
        }
      }

      // Supplement with local patterns if needed
      if (similar.length < limit) {
        const localSimilar = this.findSimilarPatterns(message.content, limit - similar.length);
        similar.push(...localSimilar);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('MCP retrieval failed:', errorMessage);

      // Fallback to local pattern matching
      const localSimilar = this.findSimilarPatterns(message.content, limit);
      similar.push(...localSimilar);
    }

    assert(similar.length <= limit, 'Retrieved items must not exceed limit');
    return similar.slice(0, limit);
  }

  /**
   * Create entities in MCP knowledge graph
   * NASA Rule 10: Bounded MCP operations
   */
  private async createMCPEntities(entities: MCPEntity[]): Promise<void> {
    assert(entities.length > 0, 'Entities required for MCP creation');
    assert(entities.length <= 10, 'Too many entities for single operation');

    if (!this.mcpAvailable) {
      throw new Error('MCP memory tools not available');
    }

    // Use actual MCP memory create_entities function
    const formattedEntities = entities.map(entity => ({
      name: entity.name,
      entityType: entity.entityType,
      observations: entity.observations
    }));

    await (global as any).mcpMemoryTools.create_entities({ entities: formattedEntities });
  }

  /**
   * Create relations in MCP knowledge graph
   * NASA Rule 10: Bounded relation creation
   */
  private async createMCPRelations(relations: MCPRelation[]): Promise<void> {
    assert(relations.length > 0, 'Relations required for MCP creation');
    assert(relations.length <= 20, 'Too many relations for single operation');

    if (!this.mcpAvailable) {
      throw new Error('MCP memory tools not available');
    }

    // Use actual MCP memory create_relations function
    await (global as any).mcpMemoryTools.create_relations({ relations });
  }

  /**
   * Search MCP knowledge graph nodes
   * NASA Rule 10: Bounded search operations
   */
  private async searchMCPNodes(query: string, limit: number): Promise<any[]> {
    assert(query.length > 0, 'Search query required');
    assert(limit > 0 && limit <= 100, 'Limit must be 1-100');

    if (!this.mcpAvailable) {
      return [];
    }

    try {
      // Use actual MCP memory search_nodes function
      const results = await (global as any).mcpMemoryTools.search_nodes({
        query: query.slice(0, 200) // Bound query length
      });

      return Array.isArray(results) ? results.slice(0, limit) : [];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('MCP search failed:', errorMessage);
      return [];
    }
  }

  /**
   * Recognize communication pattern
   * NASA Rule 10: Pattern matching with fixed bounds
   */
  private async recognizePattern(
    communication: OptimizedCommunication
  ): Promise<PatternRecognition | null> {
    assert(communication !== null, 'Communication required for pattern recognition');

    const content = communication.optimizedMessage.content;
    let patternType: PatternRecognition['patternType'];

    // Determine pattern type
    if (content.includes('directive') || content.includes('strategic')) {
      patternType = 'QUEEN_DIRECTIVE';
    } else if (content.includes('task') || content.includes('delegate')) {
      patternType = 'TASK_DELEGATION';
    } else if (content.includes('status') || content.includes('progress')) {
      patternType = 'STATUS_REPORT';
    } else {
      patternType = 'EXECUTIVE_SUMMARY';
    }

    // Check existing patterns
    const patternId = `pattern_${patternType}_${this.generateHash(content).slice(0, 8)}`;
    const existing = this.localPatterns.get(patternId);

    if (existing) {
      // Update existing pattern
      existing.frequency++;
      existing.lastSeen = new Date();
      existing.qualityImprovement =
        (existing.qualityImprovement + communication.qualityScore) / 2;
      return existing;
    }

    // Create new pattern
    const newPattern: PatternRecognition = {
      patternId,
      patternType,
      frequency: 1,
      qualityImprovement: communication.qualityScore,
      lastSeen: new Date()
    };

    return newPattern;
  }

  /**
   * Store pattern locally with cleanup
   * NASA Rule 10: Bounded pattern storage
   */
  private storePatternLocally(pattern: PatternRecognition): void {
    assert(pattern !== null, 'Pattern required for storage');

    if (this.localPatterns.size >= this.maxPatterns) {
      // Remove oldest pattern
      const oldest = this.findOldestPattern();
      if (oldest) {
        this.localPatterns.delete(oldest);
      }
    }

    this.localPatterns.set(pattern.patternId, pattern);
    assert(this.localPatterns.size <= this.maxPatterns, 'Patterns must not exceed limit');
  }

  /**
   * Find similar patterns locally
   * NASA Rule 10: Bounded local search
   */
  private findSimilarPatterns(content: string, limit: number): OptimizedCommunication[] {
    assert(content.length > 0, 'Content required for pattern search');
    assert(limit > 0 && limit <= 50, 'Limit must be 1-50');

    const similar: OptimizedCommunication[] = [];
    const contentHash = this.generateHash(content);

    const patterns = Array.from(this.localPatterns.values());
    const maxCheck = Math.min(patterns.length, 50);

    for (let i = 0; i < maxCheck && similar.length < limit; i++) {
      const pattern = patterns[i];
      const patternHash = this.generateHash(pattern.patternId);
      const similarity = this.calculateSimilarity(contentHash, patternHash);

      if (similarity > this.patternThreshold) {
        // Reconstruct a mock communication from pattern
        const reconstructed = this.reconstructFromPattern(pattern);
        if (reconstructed) {
          similar.push(reconstructed);
        }
      }
    }

    return similar;
  }

  /**
   * Reconstruct communication from MCP result
   * NASA Rule 10: Simple reconstruction
   */
  private reconstructFromMCP(mcpResult: any): OptimizedCommunication | null {
    assert(mcpResult !== null, 'MCP result required for reconstruction');

    try {
      // Extract observations for reconstruction
      const observations = mcpResult.observations || [];
      let content = '';
      let qualityScore = 0.5;
      let contextDNA = {};

      for (let i = 0; i < Math.min(observations.length, 10); i++) {
        const obs = observations[i];
        if (obs.startsWith('Content: ')) {
          content = obs.substring(9);
        } else if (obs.startsWith('Quality Score: ')) {
          qualityScore = parseFloat(obs.substring(15)) || 0.5;
        } else if (obs.startsWith('Context DNA: ')) {
          try {
            contextDNA = JSON.parse(obs.substring(13));
          } catch {
            contextDNA = {};
          }
        }
      }

      return {
        optimizedMessage: {
          id: mcpResult.name || 'reconstructed',
          content: content || 'Reconstructed from MCP',
          sourceAgent: null as any,
          targetAgent: null as any,
          timestamp: Date.now(),
          priority: 'medium',
          agentContext: {}
        },
        qualityScore,
        contextDNA,
        performanceMetrics: null as any,
        optimizationTrace: []
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('MCP reconstruction failed:', errorMessage);
      return null;
    }
  }

  /**
   * Reconstruct communication from local pattern
   * NASA Rule 10: Simple pattern reconstruction
   */
  private reconstructFromPattern(pattern: PatternRecognition): OptimizedCommunication | null {
    assert(pattern !== null, 'Pattern required for reconstruction');

    return {
      optimizedMessage: {
        id: pattern.patternId,
        content: `Pattern-based: ${pattern.patternType} (freq: ${pattern.frequency})`,
        sourceAgent: null as any,
        targetAgent: null as any,
        timestamp: pattern.lastSeen.getTime(),
        priority: 'medium',
        agentContext: {}
      },
      qualityScore: pattern.qualityImprovement,
      contextDNA: { patternType: pattern.patternType },
      performanceMetrics: null as any,
      optimizationTrace: []
    };
  }

  /**
   * Calculate similarity between hashes
   * NASA Rule 10: Simple similarity calculation
   */
  private calculateSimilarity(hash1: string, hash2: string): number {
    assert(hash1.length > 0, 'Hash1 required');
    assert(hash2.length > 0, 'Hash2 required');

    let matches = 0;
    const minLength = Math.min(hash1.length, hash2.length);

    // Compare characters (bounded to 16)
    for (let i = 0; i < Math.min(minLength, 16); i++) {
      if (hash1[i] === hash2[i]) {
        matches++;
      }
    }

    const similarity = matches / Math.min(minLength, 16);
    assert(similarity >= 0 && similarity <= 1, 'Similarity must be 0-1');
    return similarity;
  }

  /**
   * Generate hash for content
   * NASA Rule 10: Bounded hash generation
   */
  private generateHash(content: string): string {
    assert(content.length >= 0, 'Content required for hash');

    const bounded = content.slice(0, 100);
    let hash = 0;

    for (let i = 0; i < bounded.length; i++) {
      const char = bounded.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit
    }

    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Find oldest pattern for removal
   * NASA Rule 10: Bounded search
   */
  private findOldestPattern(): string | null {
    let oldest: PatternRecognition | null = null;
    let oldestId: string | null = null;

    const patterns = Array.from(this.localPatterns.entries());
    const maxCheck = Math.min(patterns.length, 100);

    for (let i = 0; i < maxCheck; i++) {
      const [id, pattern] = patterns[i];
      if (!oldest || pattern.lastSeen < oldest.lastSeen) {
        oldest = pattern;
        oldestId = id;
      }
    }

    return oldestId;
  }

  /**
   * Clean up MCP entities by age
   * NASA Rule 10: Bounded cleanup operations
   */
  async cleanupOldEntities(): Promise<void> {
    if (!this.mcpAvailable) {
      console.log('MCP cleanup skipped - tools not available');
      return;
    }

    try {
      // Read current graph to identify old entities
      const graph = await (global as any).mcpMemoryTools.read_graph();

      if (!graph || !graph.entities) {
        return;
      }

      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const entitiesToDelete: string[] = [];

      // Find old communication entities
      for (let i = 0; i < Math.min(graph.entities.length, 100); i++) {
        const entity = graph.entities[i];
        if (entity.entityType === 'COMMUNICATION') {
          // Check timestamp in observations
          const timestampObs = entity.observations.find((obs: string) =>
            obs.startsWith('Timestamp: ')
          );

          if (timestampObs) {
            const timestamp = parseInt(timestampObs.substring(11));
            if (now - timestamp > maxAge) {
              entitiesToDelete.push(entity.name);
            }
          }
        }
      }

      // Delete old entities in batches
      if (entitiesToDelete.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < entitiesToDelete.length; i += batchSize) {
          const batch = entitiesToDelete.slice(i, i + batchSize);
          await (global as any).mcpMemoryTools.delete_entities({
            entityNames: batch
          });
        }

        this.emit('memory:cleanup', entitiesToDelete.length);
        console.log(`Cleaned up ${entitiesToDelete.length} old MCP entities`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('MCP cleanup failed:', errorMessage);
    }
  }

  /**
   * Get patterns for optimization (local only)
   */
  getPatterns(): Map<string, PatternRecognition> {
    return new Map(this.localPatterns);
  }

  /**
   * Get entity count from MCP or local
   */
  getEntityCount(): number {
    // This would need to query MCP, for now return local pattern count
    return this.localPatterns.size;
  }

  /**
   * Get relation count placeholder
   */
  getRelationCount(): number {
    // Would need MCP graph query for accurate count
    return this.localPatterns.size * 2; // Rough estimate
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
// run_id: mcp-memory-update-002
// inputs: ["MCP memory tool capabilities", "actual tool functions"]
// tools_used: ["Edit"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-integration-v2.0"}
*/