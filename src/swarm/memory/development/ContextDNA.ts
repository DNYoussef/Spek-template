/**
 * Context DNA for Development Princess
 * Shared context embeddings across agents and sessions
 */

import { EventEmitter } from 'events';
import { Logger } from '../../../utils/logger';

export interface ContextSnapshot {
  id: string;
  timestamp: Date;
  sessionId: string;
  agentId: string;
  contextData: {
    currentFiles: string[];
    recentActions: string[];
    codeContext: string;
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
  outcome: 'success' | 'failure' | 'pending';
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
  private syncThreshold: number = 0.8;

  constructor() {
    super();
    this.logger = new Logger('DevelopmentContextDNA');
    this.snapshots = new Map();
    this.agentContexts = new Map();
    this.sessionMemory = new Map();
  }

  /**\n   * Create context snapshot for agent\n   */\n  async createSnapshot(\n    sessionId: string,\n    agentId: string,\n    contextData: ContextSnapshot['contextData']\n  ): Promise<string> {\n    const id = `ctx-${Date.now()}-${agentId}`;\n    const embedding = await this.generateContextEmbedding(contextData);\n\n    const snapshot: ContextSnapshot = {\n      id,\n      timestamp: new Date(),\n      sessionId,\n      agentId,\n      contextData: {\n        ...contextData,\n        decisionHistory: [...contextData.decisionHistory],\n        learnings: [...contextData.learnings]\n      },\n      embedding\n    };\n\n    this.snapshots.set(id, snapshot);\n\n    // Update agent context history\n    if (!this.agentContexts.has(agentId)) {\n      this.agentContexts.set(agentId, []);\n    }\n    \n    const agentSnapshots = this.agentContexts.get(agentId)!;\n    agentSnapshots.push(snapshot);\n\n    // Limit snapshots per agent\n    if (agentSnapshots.length > this.maxSnapshotsPerAgent) {\n      const removed = agentSnapshots.shift()!;\n      this.snapshots.delete(removed.id);\n    }\n\n    // Update session memory\n    if (!this.sessionMemory.has(sessionId)) {\n      this.sessionMemory.set(sessionId, new Set());\n    }\n    this.sessionMemory.get(sessionId)!.add(id);\n\n    this.emit('snapshot-created', { id, agentId, sessionId });\n    this.logger.debug(`Created context snapshot ${id} for agent ${agentId}`);\n\n    return id;\n  }\n\n  /**\n   * Generate context embedding from data\n   */\n  private async generateContextEmbedding(\n    contextData: ContextSnapshot['contextData']\n  ): Promise<Float32Array> {\n    // Combine all context into single string\n    const contextText = [\n      contextData.codeContext,\n      contextData.currentFiles.join(' '),\n      contextData.recentActions.join(' '),\n      contextData.decisionHistory.map(d => `${d.decision} ${d.reasoning}`).join(' '),\n      contextData.learnings.map(l => `${l.pattern} ${l.solution}`).join(' ')\n    ].join(' ');\n\n    // Generate embedding (simplified for demo)\n    const dimension = 384;\n    const embedding = new Float32Array(dimension);\n    \n    const hash = this.hashString(contextText);\n    for (let i = 0; i < dimension; i++) {\n      embedding[i] = Math.sin(hash * (i + 1)) * Math.cos(hash / (i + 1));\n    }\n\n    // Normalize\n    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));\n    for (let i = 0; i < embedding.length; i++) {\n      embedding[i] /= norm;\n    }\n\n    return embedding;\n  }\n\n  /**\n   * Find similar contexts across agents\n   */\n  async findSimilarContexts(\n    snapshotId: string,\n    threshold: number = 0.7,\n    maxResults: number = 5\n  ): Promise<ContextSnapshot[]> {\n    const targetSnapshot = this.snapshots.get(snapshotId);\n    if (!targetSnapshot) {\n      return [];\n    }\n\n    const similarities: { snapshot: ContextSnapshot; similarity: number }[] = [];\n\n    for (const snapshot of this.snapshots.values()) {\n      if (snapshot.id === snapshotId) continue;\n\n      const similarity = this.cosineSimilarity(\n        targetSnapshot.embedding,\n        snapshot.embedding\n      );\n\n      if (similarity >= threshold) {\n        similarities.push({ snapshot, similarity });\n      }\n    }\n\n    similarities.sort((a, b) => b.similarity - a.similarity);\n    return similarities.slice(0, maxResults).map(s => s.snapshot);\n  }\n\n  /**\n   * Sync context between agents\n   */\n  async syncAgentContexts(\n    sourceAgentId: string,\n    targetAgentId: string\n  ): Promise<ContextSync> {\n    const sourceSnapshots = this.agentContexts.get(sourceAgentId) || [];\n    const targetSnapshots = this.agentContexts.get(targetAgentId) || [];\n\n    if (sourceSnapshots.length === 0 || targetSnapshots.length === 0) {\n      return {\n        sourceAgent: sourceAgentId,\n        targetAgent: targetAgentId,\n        sharedContext: [],\n        syncStrength: 0\n      };\n    }\n\n    const latestSource = sourceSnapshots[sourceSnapshots.length - 1];\n    const latestTarget = targetSnapshots[targetSnapshots.length - 1];\n\n    const similarity = this.cosineSimilarity(\n      latestSource.embedding,\n      latestTarget.embedding\n    );\n\n    const sharedContext: string[] = [];\n    \n    // Find overlapping files\n    const sourceFiles = new Set(latestSource.contextData.currentFiles);\n    const targetFiles = new Set(latestTarget.contextData.currentFiles);\n    const commonFiles = Array.from(sourceFiles).filter(f => targetFiles.has(f));\n    sharedContext.push(...commonFiles);\n\n    // Find similar decisions\n    for (const sourceDecision of latestSource.contextData.decisionHistory) {\n      for (const targetDecision of latestTarget.contextData.decisionHistory) {\n        if (this.decisionSimilarity(sourceDecision, targetDecision) > 0.8) {\n          sharedContext.push(`decision:${sourceDecision.decision}`);\n        }\n      }\n    }\n\n    const sync: ContextSync = {\n      sourceAgent: sourceAgentId,\n      targetAgent: targetAgentId,\n      sharedContext,\n      syncStrength: similarity\n    };\n\n    this.emit('agents-synced', sync);\n    return sync;\n  }\n\n  /**\n   * Record decision in context\n   */\n  async recordDecision(\n    snapshotId: string,\n    decision: string,\n    reasoning: string,\n    confidence: number = 0.8\n  ): Promise<void> {\n    const snapshot = this.snapshots.get(snapshotId);\n    if (!snapshot) {\n      throw new Error(`Snapshot ${snapshotId} not found`);\n    }\n\n    const decisionRecord: Decision = {\n      id: `dec-${Date.now()}`,\n      timestamp: new Date(),\n      decision,\n      reasoning,\n      outcome: 'pending',\n      confidence\n    };\n\n    snapshot.contextData.decisionHistory.push(decisionRecord);\n    \n    // Regenerate embedding with new decision\n    snapshot.embedding = await this.generateContextEmbedding(snapshot.contextData);\n\n    this.emit('decision-recorded', { snapshotId, decision: decisionRecord });\n  }\n\n  /**\n   * Record learning in context\n   */\n  async recordLearning(\n    snapshotId: string,\n    pattern: string,\n    solution: string,\n    effectiveness: number,\n    context: string[]\n  ): Promise<void> {\n    const snapshot = this.snapshots.get(snapshotId);\n    if (!snapshot) {\n      throw new Error(`Snapshot ${snapshotId} not found`);\n    }\n\n    const learning: Learning = {\n      id: `learn-${Date.now()}`,\n      timestamp: new Date(),\n      pattern,\n      solution,\n      effectiveness,\n      context\n    };\n\n    snapshot.contextData.learnings.push(learning);\n    \n    // Regenerate embedding with new learning\n    snapshot.embedding = await this.generateContextEmbedding(snapshot.contextData);\n\n    this.emit('learning-recorded', { snapshotId, learning });\n  }\n\n  /**\n   * Get context for session\n   */\n  getSessionContext(sessionId: string): ContextSnapshot[] {\n    const snapshotIds = this.sessionMemory.get(sessionId) || new Set();\n    return Array.from(snapshotIds)\n      .map(id => this.snapshots.get(id)!)\n      .filter(Boolean)\n      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());\n  }\n\n  /**\n   * Get latest context for agent\n   */\n  getLatestAgentContext(agentId: string): ContextSnapshot | undefined {\n    const snapshots = this.agentContexts.get(agentId);\n    return snapshots?.[snapshots.length - 1];\n  }\n\n  /**\n   * Calculate decision similarity\n   */\n  private decisionSimilarity(d1: Decision, d2: Decision): number {\n    const text1 = `${d1.decision} ${d1.reasoning}`.toLowerCase();\n    const text2 = `${d2.decision} ${d2.reasoning}`.toLowerCase();\n    \n    // Simple word overlap similarity\n    const words1 = new Set(text1.split(' '));\n    const words2 = new Set(text2.split(' '));\n    \n    const intersection = new Set(\n      Array.from(words1).filter(word => words2.has(word))\n    );\n    \n    const union = new Set([...words1, ...words2]);\n    \n    return intersection.size / union.size;\n  }\n\n  /**\n   * Calculate cosine similarity\n   */\n  private cosineSimilarity(a: Float32Array, b: Float32Array): number {\n    let dotProduct = 0;\n    for (let i = 0; i < a.length; i++) {\n      dotProduct += a[i] * b[i];\n    }\n    return dotProduct; // Embeddings are normalized\n  }\n\n  /**\n   * Hash string for embedding generation\n   */\n  private hashString(str: string): number {\n    let hash = 0;\n    for (let i = 0; i < str.length; i++) {\n      const char = str.charCodeAt(i);\n      hash = ((hash << 5) - hash) + char;\n      hash = hash & hash;\n    }\n    return Math.abs(hash);\n  }\n\n  /**\n   * Get context DNA statistics\n   */\n  getStats(): any {\n    const agentCounts: Record<string, number> = {};\n    this.agentContexts.forEach((snapshots, agentId) => {\n      agentCounts[agentId] = snapshots.length;\n    });\n\n    return {\n      totalSnapshots: this.snapshots.size,\n      activeAgents: this.agentContexts.size,\n      activeSessions: this.sessionMemory.size,\n      agentCounts,\n      maxSnapshotsPerAgent: this.maxSnapshotsPerAgent\n    };\n  }\n\n  /**\n   * Clear old sessions\n   */\n  cleanupOldSessions(maxAgeHours: number = 24): void {\n    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);\n    const toRemove: string[] = [];\n\n    this.snapshots.forEach((snapshot, id) => {\n      if (snapshot.timestamp < cutoff) {\n        toRemove.push(id);\n      }\n    });\n\n    toRemove.forEach(id => {\n      const snapshot = this.snapshots.get(id);\n      if (snapshot) {\n        this.snapshots.delete(id);\n        \n        // Remove from agent contexts\n        const agentSnapshots = this.agentContexts.get(snapshot.agentId);\n        if (agentSnapshots) {\n          const index = agentSnapshots.findIndex(s => s.id === id);\n          if (index >= 0) {\n            agentSnapshots.splice(index, 1);\n          }\n        }\n        \n        // Remove from session memory\n        const sessionSnapshots = this.sessionMemory.get(snapshot.sessionId);\n        if (sessionSnapshots) {\n          sessionSnapshots.delete(id);\n        }\n      }\n    });\n\n    this.logger.info(`Cleaned up ${toRemove.length} old context snapshots`);\n  }\n}\n\nexport default ContextDNA;"