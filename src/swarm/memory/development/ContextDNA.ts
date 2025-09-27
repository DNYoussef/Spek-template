/**
 * Context DNA System
 * Captures and analyzes agent context patterns for enhanced decision making
 * and cross-agent synchronization in the swarm hierarchy.
 */

import { EventEmitter } from 'events';
import { Logger } from '../../../utils/logger';

export interface ContextSnapshot {
  id: string;
  timestamp: Date;
  sessionId: string;
  agentId: string;
  contextData: {
    codeContext: string;
    currentFiles: string[];
    recentActions: string[];
    decisionHistory: Decision[];
    learnings: Learning[];
  };
  embedding: Float32Array;
}

export interface Decision {
  id: string;
  timestamp: Date;
  decision: string;
  reasoning: string;
  outcome: 'pending' | 'success' | 'failure';
  confidence: number;
}

export interface Learning {
  id: string;
  timestamp: Date;
  pattern: string;
  solution: string;
  effectiveness: number;
  context: string[];
}

export interface ContextSync {
  sourceAgent: string;
  targetAgent: string;
  sharedContext: string[];
  syncStrength: number;
}

export class ContextDNA extends EventEmitter {
  private logger: Logger;
  private snapshots: Map<string, ContextSnapshot>;
  private agentContexts: Map<string, ContextSnapshot[]>;
  private sessionMemory: Map<string, Set<string>>;
  private maxSnapshotsPerAgent: number = 50;

  constructor() {
    super();
    this.logger = new Logger('ContextDNA');
    this.snapshots = new Map();
    this.agentContexts = new Map();
    this.sessionMemory = new Map();
  }

  /**
   * Create context snapshot for agent
   */
  async createSnapshot(
    sessionId: string,
    agentId: string,
    contextData: ContextSnapshot['contextData']
  ): Promise<string> {
    const id = `ctx-${Date.now()}-${agentId}`;
    const embedding = await this.generateContextEmbedding(contextData);

    const snapshot: ContextSnapshot = {
      id,
      timestamp: new Date(),
      sessionId,
      agentId,
      contextData: {
        ...contextData,
        decisionHistory: [...contextData.decisionHistory],
        learnings: [...contextData.learnings]
      },
      embedding
    };

    this.snapshots.set(id, snapshot);

    // Update agent context history
    if (!this.agentContexts.has(agentId)) {
      this.agentContexts.set(agentId, []);
    }

    const agentSnapshots = this.agentContexts.get(agentId)!;
    agentSnapshots.push(snapshot);

    // Limit snapshots per agent
    if (agentSnapshots.length > this.maxSnapshotsPerAgent) {
      const removed = agentSnapshots.shift()!;
      this.snapshots.delete(removed.id);
    }

    // Update session memory
    if (!this.sessionMemory.has(sessionId)) {
      this.sessionMemory.set(sessionId, new Set());
    }
    this.sessionMemory.get(sessionId)!.add(id);

    this.emit('snapshot-created', { id, agentId, sessionId });
    this.logger.debug(`Created context snapshot ${id} for agent ${agentId}`);

    return id;
  }

  /**
   * Generate context embedding from data
   */
  private async generateContextEmbedding(
    contextData: ContextSnapshot['contextData']
  ): Promise<Float32Array> {
    // Combine all context into single string
    const contextText = [
      contextData.codeContext,
      contextData.currentFiles.join(' '),
      contextData.recentActions.join(' '),
      contextData.decisionHistory.map(d => `${d.decision} ${d.reasoning}`).join(' '),
      contextData.learnings.map(l => `${l.pattern} ${l.solution}`).join(' ')
    ].join(' ');

    // Generate embedding (simplified for demo)
    const dimension = 384;
    const embedding = new Float32Array(dimension);

    const hash = this.hashString(contextText);
    for (let i = 0; i < dimension; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * Math.cos(hash / (i + 1));
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }

    return embedding;
  }

  /**
   * Find similar contexts across agents
   */
  async findSimilarContexts(
    snapshotId: string,
    threshold: number = 0.7,
    maxResults: number = 5
  ): Promise<ContextSnapshot[]> {
    const targetSnapshot = this.snapshots.get(snapshotId);
    if (!targetSnapshot) {
      return [];
    }

    const similarities: { snapshot: ContextSnapshot; similarity: number }[] = [];

    for (const snapshot of this.snapshots.values()) {
      if (snapshot.id === snapshotId) continue;

      const similarity = this.cosineSimilarity(
        targetSnapshot.embedding,
        snapshot.embedding
      );

      if (similarity >= threshold) {
        similarities.push({ snapshot, similarity });
      }
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, maxResults).map(s => s.snapshot);
  }

  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    return dotProduct; // Embeddings are normalized
  }

  /**
   * Hash string for embedding generation
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Get context DNA statistics
   */
  getStats(): any {
    const agentCounts: Record<string, number> = {};
    this.agentContexts.forEach((snapshots, agentId) => {
      agentCounts[agentId] = snapshots.length;
    });

    return {
      totalSnapshots: this.snapshots.size,
      activeAgents: this.agentContexts.size,
      activeSessions: this.sessionMemory.size,
      agentCounts,
      maxSnapshotsPerAgent: this.maxSnapshotsPerAgent
    };
  }
}

export default ContextDNA;