/**
 * Cross-Agent Memory Coordinator - Memory sharing and coordination system
 * NASA Rule 10 Compliant Implementation with bounded memory operations
 */

import {
  MemoryPointer,
  MemoryState,
  CrossAgentLink,
  AgentIdentity,
  AgentMessage,
  PerformanceMetrics
} from './interfaces/types';

interface MemoryCoordinationResult {
  success: boolean;
  memoryPointers: MemoryPointer[];
  crossAgentLinks: CrossAgentLink[];
  coordinationMetrics: MemoryCoordinationMetrics;
}

interface MemoryCoordinationMetrics {
  memoryEfficiency: number;
  linkStrength: number;
  accessLatency: number;
  coordinationScore: number;
}

interface MemorySearchResult {
  pointers: MemoryPointer[];
  relevanceScore: number;
  searchLatency: number;
}

export class CrossAgentMemoryCoordinator {
  private agentMemories: Map<string, MemoryState> = new Map();
  private crossAgentLinks: Map<string, CrossAgentLink[]> = new Map();
  private memoryAccessLog: Map<string, number> = new Map();
  private coordinationMetrics: MemoryCoordinationMetrics;

  constructor() {
    this.agentMemories = new Map();
    this.crossAgentLinks = new Map();
    this.memoryAccessLog = new Map();

    this.coordinationMetrics = {
      memoryEfficiency: 0.8,
      linkStrength: 0.7,
      accessLatency: 0,
      coordinationScore: 0.75
    };

    assert(this.agentMemories instanceof Map, 'Agent memories must be initialized');
    assert(this.crossAgentLinks instanceof Map, 'Cross-agent links must be initialized');
    assert(this.coordinationMetrics.memoryEfficiency >= 0, 'Memory efficiency must be non-negative');
  }

  /**
   * Coordinate memory sharing between agents
   * NASA Rule 10: Fixed bounds, explicit error handling, assertions
   */
  async coordinateMemorySharing(
    sourceAgent: AgentIdentity,
    targetAgent: AgentIdentity,
    message: AgentMessage
  ): Promise<MemoryCoordinationResult> {
    assert(sourceAgent.id.length > 0, 'Source agent ID required');
    assert(targetAgent.id.length > 0, 'Target agent ID required');
    assert(message.content.length > 0, 'Message content required');

    const startTime = Date.now();

    try {
      // Step 1: Retrieve source agent memory (bounded operation)
      const sourceMemory = await this.getAgentMemory(sourceAgent.id);
      assert(sourceMemory !== null, 'Source memory must be retrievable');

      // Step 2: Find relevant memories (bounded search)
      const relevantMemories = await this.findRelevantMemories(sourceAgent.id, message.content);
      assert(relevantMemories.pointers.length <= 20, 'Relevant memories must be bounded');

      // Step 3: Create cross-agent links (bounded linking)
      const newLinks = await this.createCrossAgentLinks(sourceAgent, targetAgent, relevantMemories.pointers);
      assert(newLinks.length <= 10, 'New links must be bounded');

      // Step 4: Update memory state (bounded updates)
      const updatedMemories = await this.updateMemoryState(sourceAgent.id, targetAgent.id, relevantMemories.pointers);
      assert(updatedMemories.length <= 20, 'Updated memories must be bounded');

      // Step 5: Calculate coordination metrics
      const metrics = this.calculateCoordinationMetrics(startTime, relevantMemories, newLinks);
      assert(metrics.coordinationScore >= 0 && metrics.coordinationScore <= 1, 'Coordination score must be valid');

      const result: MemoryCoordinationResult = {
        success: true,
        memoryPointers: updatedMemories,
        crossAgentLinks: newLinks,
        coordinationMetrics: metrics
      };

      // Update global coordination metrics
      this.updateGlobalCoordinationMetrics(metrics);

      return result;

    } catch (error) {
      return {
        success: false,
        memoryPointers: [],
        crossAgentLinks: [],
        coordinationMetrics: this.getFailureMetrics(startTime)
      };
    }
  }

  /**
   * Get agent memory with bounded retrieval
   * NASA Rule 10: Fixed bounds on memory retrieval
   */
  private async getAgentMemory(agentId: string): Promise<MemoryState> {
    assert(agentId.length > 0, 'Agent ID required for memory retrieval');

    let memory = this.agentMemories.get(agentId);
    if (!memory) {
      // Create default memory state for new agent
      memory = this.createDefaultMemoryState(agentId);
      this.agentMemories.set(agentId, memory);
    }

    // Update access log (bounded to 1000 entries)
    this.updateMemoryAccessLog(agentId);

    assert(memory.shortTerm !== undefined, 'Short-term memory must be initialized');
    assert(memory.longTerm !== undefined, 'Long-term memory must be initialized');

    return memory;
  }

  /**
   * Find relevant memories with bounded search
   * NASA Rule 10: Fixed search bounds, no recursion
   */
  private async findRelevantMemories(agentId: string, content: string): Promise<MemorySearchResult> {
    assert(agentId.length > 0, 'Agent ID required for memory search');
    assert(content.length > 0, 'Content required for memory search');

    const startTime = Date.now();
    const agentMemory = await this.getAgentMemory(agentId);
    const relevantPointers: MemoryPointer[] = [];

    // Extract search terms (bounded to 10 terms)
    const searchTerms = this.extractSearchTerms(content);
    const boundedTerms = searchTerms.slice(0, 10);

    // Search in each memory type with fixed bounds
    const memoryTypes = ['shortTerm', 'longTerm', 'semantic', 'procedural'];
    for (let typeIndex = 0; typeIndex < memoryTypes.length; typeIndex++) {
      const memoryType = memoryTypes[typeIndex];
      const memories = agentMemory[memoryType] || [];

      // Fixed bounds: check maximum 20 memories per type
      const memoriesToCheck = Math.min(memories.length, 20);
      for (let memIndex = 0; memIndex < memoriesToCheck; memIndex++) {
        const memory = memories[memIndex];
        const relevance = this.calculateMemoryRelevance(memory, boundedTerms);

        if (relevance > 0.3) { // Relevance threshold
          relevantPointers.push({
            ...memory,
            relevanceScore: relevance,
            lastAccessed: Date.now()
          });
        }
      }
    }

    // Sort by relevance and bound result (maximum 20 pointers)
    const sortedPointers = relevantPointers
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);

    const searchLatency = Date.now() - startTime;
    const avgRelevance = sortedPointers.length > 0
      ? sortedPointers.reduce((sum, p) => sum + p.relevanceScore, 0) / sortedPointers.length
      : 0;

    assert(sortedPointers.length <= 20, 'Search results must be bounded');
    assert(searchLatency >= 0, 'Search latency must be non-negative');

    return {
      pointers: sortedPointers,
      relevanceScore: avgRelevance,
      searchLatency: searchLatency
    };
  }

  /**
   * Create cross-agent links with bounded operations
   * NASA Rule 10: Fixed bounds on link creation
   */
  private async createCrossAgentLinks(
    sourceAgent: AgentIdentity,
    targetAgent: AgentIdentity,
    memoryPointers: MemoryPointer[]
  ): Promise<CrossAgentLink[]> {
    assert(sourceAgent.id.length > 0, 'Source agent ID required');
    assert(targetAgent.id.length > 0, 'Target agent ID required');
    assert(memoryPointers.length <= 20, 'Memory pointers must be bounded');

    const newLinks: CrossAgentLink[] = [];
    const existingLinks = this.crossAgentLinks.get(sourceAgent.id) || [];

    // Check if link already exists
    const existingLink = existingLinks.find(link =>
      link.sourceAgent === sourceAgent.id && link.targetAgent === targetAgent.id
    );

    if (existingLink) {
      // Update existing link strength
      existingLink.strength = Math.min(existingLink.strength + 0.1, 1.0);
      existingLink.lastUsed = Date.now();
      newLinks.push(existingLink);
    } else {
      // Create new link
      const linkStrength = this.calculateLinkStrength(sourceAgent, targetAgent, memoryPointers);
      const newLink: CrossAgentLink = {
        sourceAgent: sourceAgent.id,
        targetAgent: targetAgent.id,
        linkType: this.determineLinkType(sourceAgent, targetAgent),
        strength: linkStrength,
        lastUsed: Date.now()
      };

      newLinks.push(newLink);

      // Update cross-agent links map (bounded to 50 links per agent)
      const updatedLinks = [...existingLinks, newLink].slice(0, 50);
      this.crossAgentLinks.set(sourceAgent.id, updatedLinks);
    }

    assert(newLinks.length <= 10, 'New links must be bounded');
    return newLinks;
  }

  /**
   * Update memory state with bounded operations
   * NASA Rule 10: Fixed bounds on memory updates
   */
  private async updateMemoryState(
    sourceAgentId: string,
    targetAgentId: string,
    memoryPointers: MemoryPointer[]
  ): Promise<MemoryPointer[]> {
    assert(sourceAgentId.length > 0, 'Source agent ID required');
    assert(targetAgentId.length > 0, 'Target agent ID required');
    assert(memoryPointers.length <= 20, 'Memory pointers must be bounded');

    const updatedPointers: MemoryPointer[] = [];

    // Fixed bounds: process maximum 20 memory pointers
    const pointersToProcess = memoryPointers.slice(0, 20);

    for (let i = 0; i < pointersToProcess.length; i++) {
      const pointer = pointersToProcess[i];

      // Create updated pointer with cross-agent information
      const updatedPointer: MemoryPointer = {
        ...pointer,
        id: `cross_${sourceAgentId}_${targetAgentId}_${i}`,
        lastAccessed: Date.now(),
        relevanceScore: Math.min(pointer.relevanceScore + 0.05, 1.0) // Slight boost for coordination
      };

      updatedPointers.push(updatedPointer);

      // Update target agent memory if coordination beneficial
      if (pointer.relevanceScore > 0.7) {
        await this.addMemoryToAgent(targetAgentId, updatedPointer);
      }
    }

    assert(updatedPointers.length <= 20, 'Updated pointers must be bounded');
    return updatedPointers;
  }

  /**
   * Calculate memory relevance with bounded operations
   * NASA Rule 10: Fixed relevance calculation bounds
   */
  private calculateMemoryRelevance(memory: MemoryPointer, searchTerms: string[]): number {
    assert(memory.content.length >= 0, 'Memory content must be valid');
    assert(searchTerms.length <= 10, 'Search terms must be bounded');

    if (searchTerms.length === 0) {
      return 0.2; // Default low relevance
    }

    const memoryContent = memory.content.toLowerCase();
    let relevanceScore = 0;
    let matchCount = 0;

    // Fixed bounds: check maximum 10 search terms
    for (let i = 0; i < Math.min(searchTerms.length, 10); i++) {
      const term = searchTerms[i].toLowerCase();
      if (memoryContent.includes(term)) {
        matchCount++;
        relevanceScore += 0.2; // Each match adds 0.2
      }
    }

    // Adjust for memory type relevance
    const typeBonus = this.getMemoryTypeRelevanceBonus(memory.memoryType);
    relevanceScore += typeBonus;

    // Adjust for recency (newer memories get slight boost)
    const recencyBonus = this.calculateRecencyBonus(memory.lastAccessed);
    relevanceScore += recencyBonus;

    const finalRelevance = Math.min(relevanceScore, 1.0);
    assert(finalRelevance >= 0 && finalRelevance <= 1, 'Relevance score must be valid');

    return finalRelevance;
  }

  /**
   * Calculate link strength with bounded operations
   * NASA Rule 10: Fixed strength calculation
   */
  private calculateLinkStrength(
    sourceAgent: AgentIdentity,
    targetAgent: AgentIdentity,
    memoryPointers: MemoryPointer[]
  ): number {
    assert(sourceAgent.id.length > 0, 'Source agent must be valid');
    assert(targetAgent.id.length > 0, 'Target agent must be valid');
    assert(memoryPointers.length <= 20, 'Memory pointers must be bounded');

    let strength = 0.3; // Base strength

    // Agent type compatibility
    if (sourceAgent.type === targetAgent.type) {
      strength += 0.2;
    }

    // Domain compatibility
    if (sourceAgent.domain === targetAgent.domain) {
      strength += 0.2;
    }

    // Memory relevance contribution (bounded calculation)
    if (memoryPointers.length > 0) {
      const avgRelevance = memoryPointers
        .slice(0, 10) // Bounded to 10 pointers
        .reduce((sum, p) => sum + p.relevanceScore, 0) / Math.min(memoryPointers.length, 10);
      strength += avgRelevance * 0.3;
    }

    const finalStrength = Math.min(strength, 1.0);
    assert(finalStrength >= 0 && finalStrength <= 1, 'Link strength must be valid');

    return finalStrength;
  }

  /**
   * Helper methods with bounded operations
   */
  private createDefaultMemoryState(agentId: string): MemoryState {
    assert(agentId.length > 0, 'Agent ID required for default memory state');

    return {
      shortTerm: [],
      longTerm: [],
      semantic: [],
      procedural: [],
      crossAgentLinks: []
    };
  }

  private extractSearchTerms(content: string): string[] {
    assert(content.length > 0, 'Content required for term extraction');

    const boundedContent = content.slice(0, 500);
    const words = boundedContent.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length >= 3 && word.length <= 20)
      .slice(0, 20); // Bounded to 20 words

    return words;
  }

  private determineLinkType(sourceAgent: AgentIdentity, targetAgent: AgentIdentity): 'DEPENDENCY' | 'COLLABORATION' | 'HIERARCHY' | 'INFORMATION' {
    if (sourceAgent.type === 'QUEEN' || targetAgent.type === 'QUEEN') {
      return 'HIERARCHY';
    }
    if (sourceAgent.domain === targetAgent.domain) {
      return 'COLLABORATION';
    }
    return 'INFORMATION';
  }

  private getMemoryTypeRelevanceBonus(memoryType: 'SHORT_TERM' | 'LONG_TERM' | 'SEMANTIC' | 'PROCEDURAL'): number {
    const bonuses = {
      'SHORT_TERM': 0.1,
      'LONG_TERM': 0.05,
      'SEMANTIC': 0.15,
      'PROCEDURAL': 0.2
    };
    return bonuses[memoryType] || 0;
  }

  private calculateRecencyBonus(lastAccessed: number): number {
    const now = Date.now();
    const timeDiff = now - lastAccessed;
    const hoursSinceAccess = timeDiff / (1000 * 60 * 60);

    if (hoursSinceAccess < 1) return 0.1;
    if (hoursSinceAccess < 24) return 0.05;
    return 0;
  }

  private updateMemoryAccessLog(agentId: string): void {
    this.memoryAccessLog.set(agentId, Date.now());

    // Keep log bounded to 1000 entries
    if (this.memoryAccessLog.size > 1000) {
      const entries = Array.from(this.memoryAccessLog.entries());
      const sortedEntries = entries.sort((a, b) => b[1] - a[1]);
      const boundedEntries = sortedEntries.slice(0, 1000);
      this.memoryAccessLog = new Map(boundedEntries);
    }
  }

  private async addMemoryToAgent(agentId: string, memoryPointer: MemoryPointer): Promise<void> {
    const agentMemory = await this.getAgentMemory(agentId);
    const memoryType = memoryPointer.memoryType;

    // Add to appropriate memory type with bounds
    const targetArray = agentMemory[memoryType];
    targetArray.push(memoryPointer);

    // Keep memory bounded to 100 entries per type
    if (targetArray.length > 100) {
      agentMemory[memoryType] = targetArray.slice(-100);
    }
  }

  private calculateCoordinationMetrics(
    startTime: number,
    searchResult: MemorySearchResult,
    newLinks: CrossAgentLink[]
  ): MemoryCoordinationMetrics {
    const processingTime = Date.now() - startTime;
    const memoryEfficiency = searchResult.pointers.length > 0 ? searchResult.relevanceScore : 0.3;
    const linkStrength = newLinks.length > 0
      ? newLinks.reduce((sum, link) => sum + link.strength, 0) / newLinks.length
      : 0.5;

    const coordinationScore = (memoryEfficiency + linkStrength) / 2;

    return {
      memoryEfficiency: memoryEfficiency,
      linkStrength: linkStrength,
      accessLatency: processingTime,
      coordinationScore: coordinationScore
    };
  }

  private getFailureMetrics(startTime: number): MemoryCoordinationMetrics {
    return {
      memoryEfficiency: 0.1,
      linkStrength: 0.1,
      accessLatency: Date.now() - startTime,
      coordinationScore: 0.1
    };
  }

  private updateGlobalCoordinationMetrics(metrics: MemoryCoordinationMetrics): void {
    // Exponential moving average update
    const alpha = 0.1;
    this.coordinationMetrics.memoryEfficiency =
      (1 - alpha) * this.coordinationMetrics.memoryEfficiency + alpha * metrics.memoryEfficiency;
    this.coordinationMetrics.linkStrength =
      (1 - alpha) * this.coordinationMetrics.linkStrength + alpha * metrics.linkStrength;
    this.coordinationMetrics.accessLatency =
      (1 - alpha) * this.coordinationMetrics.accessLatency + alpha * metrics.accessLatency;
    this.coordinationMetrics.coordinationScore =
      (1 - alpha) * this.coordinationMetrics.coordinationScore + alpha * metrics.coordinationScore;
  }

  /**
   * Public interface methods
   */
  async shareMemoryBetweenAgents(
    sourceAgentId: string,
    targetAgentId: string,
    memoryPointers: MemoryPointer[]
  ): Promise<boolean> {
    assert(sourceAgentId.length > 0, 'Source agent ID required');
    assert(targetAgentId.length > 0, 'Target agent ID required');
    assert(memoryPointers.length <= 20, 'Memory pointers must be bounded');

    try {
      for (let i = 0; i < Math.min(memoryPointers.length, 10); i++) {
        await this.addMemoryToAgent(targetAgentId, memoryPointers[i]);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  getCoordinationMetrics(): MemoryCoordinationMetrics {
    return { ...this.coordinationMetrics };
  }

  getCrossAgentLinks(agentId: string): CrossAgentLink[] {
    assert(agentId.length > 0, 'Agent ID required');
    return this.crossAgentLinks.get(agentId) || [];
  }

  getMemoryStatistics(): {
    totalAgents: number;
    totalLinks: number;
    avgMemoryEfficiency: number;
    accessLogSize: number;
  } {
    const totalLinks = Array.from(this.crossAgentLinks.values())
      .reduce((sum, links) => sum + links.length, 0);

    return {
      totalAgents: this.agentMemories.size,
      totalLinks: totalLinks,
      avgMemoryEfficiency: this.coordinationMetrics.memoryEfficiency,
      accessLogSize: this.memoryAccessLog.size
    };
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

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: a2a-dspy-006
// inputs: ["types.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===