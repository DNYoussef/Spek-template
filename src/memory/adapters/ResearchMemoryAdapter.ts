import { EventEmitter } from 'events';
import MemoryCoordinator, { MemoryAllocationRequest, MemoryPriority, PrincessDomain } from '../coordinator/MemoryCoordinator';
export interface ResearchContext {
  projectId: string;
  researchDomain: 'ai' | 'ml' | 'systems' | 'security' | 'performance' | 'architecture' | 'patterns';
  methodologyType: 'exploratory' | 'confirmatory' | 'experimental' | 'observational' | 'meta-analysis';
  confidenceLevel: number; // 0.0 to 1.0
  sourceType: 'academic' | 'industry' | 'documentation' | 'codebase' | 'experimental';
  timestamp: Date;
  tags: string[];
}
export interface KnowledgeGraphEntry {
  id: string;
  context: ResearchContext;
  concept: string;
  definition: string;
  relationships: Array<{
    type: 'depends_on' | 'related_to' | 'implements' | 'extends' | 'contradicts' | 'validates';
    targetId: string;
    confidence: number;
    evidence: string[];
  }>;
  evidence: Array<{
    type: 'source' | 'experiment' | 'observation' | 'citation';
    content: string;
    reliability: number;
    date: Date;
  }>;
  lastValidated: Date;
  accessCount: number;
  relevanceScore: number;
}
export interface ResearchQuery {
  concepts?: string[];
  domains?: string[];
  methodologies?: string[];
  confidenceThreshold?: number;
  sourceTypes?: string[];
  timeRange?: { start: Date; end: Date };
  tags?: string[];
  includeRelationships?: boolean;
  maxResults?: number;
  sortBy?: 'relevance' | 'confidence' | 'recency' | 'access_count';
}
export interface SemanticSearchOptions {
  query: string;
  similarityThreshold?: number;
  includeContext?: boolean;
  weightByConfidence?: boolean;
  maxResults?: number;
}
/**
 * Research Princess Memory Adapter
 * Specialized memory interface for Research Princess operations
 * including knowledge graphs, research data, and semantic relationships.
 */
export class ResearchMemoryAdapter extends EventEmitter {
  private memoryCoordinator: MemoryCoordinator;
  private knowledgeGraph: Map<string, string> = new Map(); // concept -> blockId
  private conceptIndex: Map<string, Set<string>> = new Map(); // domain -> conceptIds
  private relationshipIndex: Map<string, Set<string>> = new Map(); // conceptId -> relatedConceptIds
  private evidenceIndex: Map<string, string[]> = new Map(); // sourceType -> conceptIds
  private temporalIndex: Map<string, string[]> = new Map(); // dateKey -> conceptIds
  private readonly DOMAIN = PrincessDomain.RESEARCH;
  private readonly DEFAULT_TTL = 86400000; // 24 hours for research data
  private readonly SEMANTIC_CACHE_SIZE = 1000;
  private semanticCache: Map<string, { results: string[]; timestamp: Date }> = new Map();
  constructor() {
    super();
    this.memoryCoordinator = MemoryCoordinator.getInstance();
  }
  /**
   * Store research knowledge entry
   */
  public async storeKnowledge(
    context: ResearchContext,
    concept: string,
    definition: string,
    evidence: KnowledgeGraphEntry['evidence'],
    options: {
      relationships?: KnowledgeGraphEntry['relationships'];
      priority?: MemoryPriority;
      ttl?: number;
      relevanceScore?: number;
    } = {}
  ): Promise<string | null> {
    const entry: Omit<KnowledgeGraphEntry, 'id'> = {
      context,
      concept,
      definition,
      relationships: options.relationships || [],
      evidence,
      lastValidated: new Date(),
      accessCount: 0,
      relevanceScore: options.relevanceScore || this.calculateInitialRelevance(context, evidence)
    };
    const size = this.calculateSize(entry);
    const priority = options.priority || this.determinePriority(context, evidence);
    const ttl = options.ttl || this.calculateTTL(context, evidence);
    const request: MemoryAllocationRequest = {
      size,
      domain: this.DOMAIN,
      priority,
      ttl,
      allowCompression: true,
      metadata: {
        type: 'knowledge-graph-entry',
        context,
        concept,
        domain: context.researchDomain
      }
    };
    const blockId = await this.memoryCoordinator.allocateMemory(request);
    if (!blockId) {
      this.emit('knowledge-storage-failed', { concept, reason: 'allocation-failed' });
      return null;
    }
    const fullEntry: KnowledgeGraphEntry = {
      ...entry,
      id: blockId
    };
    const stored = await this.memoryCoordinator.storeData(blockId, fullEntry);
    if (!stored) {
      await this.memoryCoordinator.deallocateMemory(blockId);
      this.emit('knowledge-storage-failed', { concept, reason: 'data-storage-failed' });
      return null;
    }
    // Update indexes
    this.updateKnowledgeIndexes(blockId, fullEntry);
    this.emit('knowledge-stored', { blockId, concept, context });
    return blockId;
  }
  /**
   * Store research findings with validation
   */
  public async storeResearchFindings(
    context: ResearchContext,
    findings: {
      hypothesis: string;
      methodology: string;
      results: any;
      conclusions: string[];
      limitations: string[];
      futureWork: string[];
    },
    validation: {
      peerReviewed: boolean;
      reproducible: boolean;
      statisticalSignificance?: number;
    },
    options: {
      priority?: MemoryPriority;
      ttl?: number;
    } = {}
  ): Promise<string | null> {
    const researchData = {
      context,
      findings,
      validation,
      storedAt: new Date(),
      accessCount: 0
    };
    const size = this.calculateSize(researchData);
    const priority = options.priority || (validation.peerReviewed ? MemoryPriority.HIGH : MemoryPriority.MEDIUM);
    const ttl = options.ttl || (validation.reproducible ? this.DEFAULT_TTL * 7 : this.DEFAULT_TTL); // 7 days for reproducible research
    const request: MemoryAllocationRequest = {
      size,
      domain: this.DOMAIN,
      priority,
      ttl,
      requireEncryption: context.confidenceLevel > 0.8, // Encrypt high-confidence research
      allowCompression: true,
      metadata: {
        type: 'research-findings',
        context,
        hypothesis: findings.hypothesis,
        validated: validation.peerReviewed
      }
    };
    const blockId = await this.memoryCoordinator.allocateMemory(request);
    if (!blockId) {
      return null;
    }
    const stored = await this.memoryCoordinator.storeData(blockId, researchData);
    if (!stored) {
      await this.memoryCoordinator.deallocateMemory(blockId);
      return null;
    }
    // Update temporal index
    const dateKey = this.getDateKey(context.timestamp);
    const temporalEntries = this.temporalIndex.get(dateKey) || [];
    temporalEntries.push(blockId);
    this.temporalIndex.set(dateKey, temporalEntries);
    this.emit('research-findings-stored', { blockId, context, validation });
    return blockId;
  }
  /**
   * Store experimental data with metadata
   */
  public async storeExperimentalData(
    context: ResearchContext,
    experiment: {
      name: string;
      objective: string;
      parameters: Record<string, any>;
      results: any;
      metrics: Record<string, number>;
      environment: Record<string, any>;
    },
    options: {
      priority?: MemoryPriority;
      retentionTime?: number;
    } = {}
  ): Promise<string | null> {
    const experimentData = {
      context,
      experiment,
      storedAt: new Date(),
      accessCount: 0
    };
    const size = this.calculateSize(experimentData);
    const priority = options.priority || MemoryPriority.MEDIUM;
    const ttl = options.retentionTime || (this.DEFAULT_TTL * 3); // 3 days for experimental data
    const request: MemoryAllocationRequest = {
      size,
      domain: this.DOMAIN,
      priority,
      ttl,
      allowCompression: true,
      metadata: {
        type: 'experimental-data',
        context,
        experimentName: experiment.name,
        objective: experiment.objective
      }
    };
    const blockId = await this.memoryCoordinator.allocateMemory(request);
    if (!blockId) {
      return null;
    }
    const stored = await this.memoryCoordinator.storeData(blockId, experimentData);
    if (!stored) {
      await this.memoryCoordinator.deallocateMemory(blockId);
      return null;
    }
    this.emit('experimental-data-stored', { blockId, context, experimentName: experiment.name });
    return blockId;
  }
  /**
   * Query knowledge graph with advanced filters
   */
  public async queryKnowledge(query: ResearchQuery): Promise<KnowledgeGraphEntry[]> {
    let candidateIds: Set<string> = new Set();
    // Start with domain filtering if specified
    if (query.domains?.length) {
      for (const domain of query.domains) {
        const domainConcepts = this.conceptIndex.get(domain) || new Set();
        for (const conceptId of domainConcepts) {
          candidateIds.add(conceptId);
        }
      }
    } else {
      // Include all knowledge entries
      candidateIds = new Set(this.knowledgeGraph.values());
    }
    // Filter by concepts if specified
    if (query.concepts?.length) {
      const conceptIds = new Set<string>();
      for (const concept of query.concepts) {
        const blockId = this.knowledgeGraph.get(concept);
        if (blockId) {
          conceptIds.add(blockId);
        }
      }
      candidateIds = new Set([...candidateIds].filter(id => conceptIds.has(id)));
    }
    // Retrieve and filter entries
    const results: KnowledgeGraphEntry[] = [];
    for (const blockId of candidateIds) {
      const entry = await this.getKnowledgeEntry(blockId);
      if (!entry) continue;
      // Apply filters
      if (query.confidenceThreshold && entry.context.confidenceLevel < query.confidenceThreshold) continue;
      if (query.methodologies?.length && !query.methodologies.includes(entry.context.methodologyType)) continue;
      if (query.sourceTypes?.length && !query.sourceTypes.includes(entry.context.sourceType)) continue;
      if (query.timeRange) {
        const entryTime = entry.context.timestamp;
        if (entryTime < query.timeRange.start || entryTime > query.timeRange.end) continue;
      }
      if (query.tags?.length) {
        const hasRequiredTags = query.tags.some(tag => entry.context.tags.includes(tag));
        if (!hasRequiredTags) continue;
      }
      // Update access count
      entry.accessCount++;
      results.push(entry);
      // Include relationships if requested
      if (query.includeRelationships) {
        for (const rel of entry.relationships) {
          const relatedEntry = await this.getKnowledgeEntry(rel.targetId);
          if (relatedEntry && !results.some(r => r.id === relatedEntry.id)) {
            results.push(relatedEntry);
          }
        }
      }
    }
    // Sort results
    this.sortResults(results, query.sortBy || 'relevance');
    // Apply limit
    const finalResults = query.maxResults ? results.slice(0, query.maxResults) : results;
    this.emit('knowledge-query-executed', { query, resultCount: finalResults.length });
    return finalResults;
  }
  /**
   * Semantic search with natural language queries
   */
  public async semanticSearch(options: SemanticSearchOptions): Promise<KnowledgeGraphEntry[]> {
    const cacheKey = `${options.query}_${options.similarityThreshold || 0.7}_${options.maxResults || 10}`;
    // Check cache
    const cached = this.semanticCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < 300000) { // 5 minute cache
      const results = [];
      for (const blockId of cached.results) {
        const entry = await this.getKnowledgeEntry(blockId);
        if (entry) {
          results.push(entry);
        }
      }
      return results;
    }
    // Perform semantic search (simplified implementation)
    const queryTokens = this.tokenize(options.query.toLowerCase());
    const candidates: Array<{ entry: KnowledgeGraphEntry; score: number }> = [];
    for (const blockId of this.knowledgeGraph.values()) {
      const entry = await this.getKnowledgeEntry(blockId);
      if (!entry) continue;
      const score = this.calculateSemanticSimilarity(queryTokens, entry, options);
      if (score >= (options.similarityThreshold || 0.7)) {
        candidates.push({ entry, score });
      }
    }
    // Sort by score and confidence
    candidates.sort((a, b) => {
      if (options.weightByConfidence) {
        const scoreA = a.score * a.entry.context.confidenceLevel;
        const scoreB = b.score * b.entry.context.confidenceLevel;
        return scoreB - scoreA;
      }
      return b.score - a.score;
    });
    const results = candidates
      .slice(0, options.maxResults || 10)
      .map(c => c.entry);
    // Cache results
    if (this.semanticCache.size >= this.SEMANTIC_CACHE_SIZE) {
      const oldestKey = this.semanticCache.keys().next().value;
      this.semanticCache.delete(oldestKey);
    }
    this.semanticCache.set(cacheKey, {
      results: results.map(r => r.id),
      timestamp: new Date()
    });
    this.emit('semantic-search-executed', { query: options.query, resultCount: results.length });
    return results;
  }
  /**
   * Add relationship between knowledge entries
   */
  public async addRelationship(
    fromConceptId: string,
    toConceptId: string,
    relationshipType: KnowledgeGraphEntry['relationships'][0]['type'],
    confidence: number,
    evidence: string[]
  ): Promise<boolean> {
    const fromEntry = await this.getKnowledgeEntry(fromConceptId);
    if (!fromEntry) {
      return false;
    }
    const relationship = {
      type: relationshipType,
      targetId: toConceptId,
      confidence,
      evidence
    };
    fromEntry.relationships.push(relationship);
    fromEntry.lastValidated = new Date();
    const updated = await this.memoryCoordinator.storeData(fromConceptId, fromEntry);
    if (updated) {
      // Update relationship index
      const relatedConcepts = this.relationshipIndex.get(fromConceptId) || new Set();
      relatedConcepts.add(toConceptId);
      this.relationshipIndex.set(fromConceptId, relatedConcepts);
      this.emit('relationship-added', { fromConceptId, toConceptId, relationshipType });
    }
    return updated;
  }
  /**
   * Validate and update knowledge confidence
   */
  public async validateKnowledge(
    conceptId: string,
    validationEvidence: KnowledgeGraphEntry['evidence'][0],
    newConfidence?: number
  ): Promise<boolean> {
    const entry = await this.getKnowledgeEntry(conceptId);
    if (!entry) {
      return false;
    }
    entry.evidence.push(validationEvidence);
    entry.lastValidated = new Date();
    if (newConfidence !== undefined) {
      entry.context.confidenceLevel = Math.max(0, Math.min(1, newConfidence));
    }
    const updated = await this.memoryCoordinator.storeData(conceptId, entry);
    if (updated) {
      this.emit('knowledge-validated', { conceptId, newConfidence, evidenceType: validationEvidence.type });
    }
    return updated;
  }
  /**
   * Get research memory statistics
   */
  public getStatistics(): {
    totalKnowledgeEntries: number;
    domainDistribution: Record<string, number>;
    averageConfidence: number;
    relationshipCount: number;
    evidenceTypeDistribution: Record<string, number>;
    recentActivity: { date: string; count: number }[];
  } {
    const stats = {
      totalKnowledgeEntries: this.knowledgeGraph.size,
      domainDistribution: {} as Record<string, number>,
      averageConfidence: 0,
      relationshipCount: 0,
      evidenceTypeDistribution: {} as Record<string, number>,
      recentActivity: [] as { date: string; count: number }[]
    };
    // Domain distribution
    for (const [domain, concepts] of this.conceptIndex) {
      stats.domainDistribution[domain] = concepts.size;
    }
    // Relationship count
    for (const relatedConcepts of this.relationshipIndex.values()) {
      stats.relationshipCount += relatedConcepts.size;
    }
    // Recent activity from temporal index
    const sortedDates = Array.from(this.temporalIndex.keys()).sort().slice(-7); // Last 7 days
    for (const dateKey of sortedDates) {
      const entries = this.temporalIndex.get(dateKey) || [];
      stats.recentActivity.push({ date: dateKey, count: entries.length });
    }
    return stats;
  }
  private async getKnowledgeEntry(blockId: string): Promise<KnowledgeGraphEntry | null> {
    const data = await this.memoryCoordinator.retrieveData(blockId);
    return data as KnowledgeGraphEntry | null;
  }
  private updateKnowledgeIndexes(blockId: string, entry: KnowledgeGraphEntry): void {
    // Update knowledge graph index
    this.knowledgeGraph.set(entry.concept, blockId);
    // Update concept index by domain
    const domainConcepts = this.conceptIndex.get(entry.context.researchDomain) || new Set();
    domainConcepts.add(blockId);
    this.conceptIndex.set(entry.context.researchDomain, domainConcepts);
    // Update evidence index
    for (const evidence of entry.evidence) {
      const evidenceEntries = this.evidenceIndex.get(evidence.type) || [];
      evidenceEntries.push(blockId);
      this.evidenceIndex.set(evidence.type, evidenceEntries);
    }
    // Update temporal index
    const dateKey = this.getDateKey(entry.context.timestamp);
    const temporalEntries = this.temporalIndex.get(dateKey) || [];
    temporalEntries.push(blockId);
    this.temporalIndex.set(dateKey, temporalEntries);
  }
  private calculateInitialRelevance(context: ResearchContext, evidence: KnowledgeGraphEntry['evidence']): number {
    let score = context.confidenceLevel * 0.4; // Base confidence contributes 40%
    // Evidence quality contributes 30%
    const avgReliability = evidence.length > 0 ?
      evidence.reduce((sum, e) => sum + e.reliability, 0) / evidence.length : 0;
    score += avgReliability * 0.3;
    // Source type contributes 20%
    const sourceWeights = {
      'academic': 1.0,
      'industry': 0.8,
      'documentation': 0.6,
      'codebase': 0.7,
      'experimental': 0.9
    };
    score += (sourceWeights[context.sourceType] || 0.5) * 0.2;
    // Methodology contributes 10%
    const methodologyWeights = {
      'experimental': 1.0,
      'confirmatory': 0.9,
      'meta-analysis': 0.8,
      'observational': 0.7,
      'exploratory': 0.6
    };
    score += (methodologyWeights[context.methodologyType] || 0.5) * 0.1;
    return Math.max(0, Math.min(1, score));
  }
  private determinePriority(context: ResearchContext, evidence: KnowledgeGraphEntry['evidence']): MemoryPriority {
    if (context.confidenceLevel > 0.9 && context.sourceType === 'academic') {
      return MemoryPriority.CRITICAL;
    }
    if (context.confidenceLevel > 0.7) {
      return MemoryPriority.HIGH;
    }
    if (context.confidenceLevel > 0.5) {
      return MemoryPriority.MEDIUM;
    }
    return MemoryPriority.LOW;
  }
  private calculateTTL(context: ResearchContext, evidence: KnowledgeGraphEntry['evidence']): number {
    // High confidence, peer-reviewed research gets longer TTL
    if (context.confidenceLevel > 0.9 && context.sourceType === 'academic') {
      return this.DEFAULT_TTL * 30; // 30 days
    }
    if (context.confidenceLevel > 0.7) {
      return this.DEFAULT_TTL * 7; // 7 days
    }
    return this.DEFAULT_TTL; // 1 day
  }
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }
  private calculateSemanticSimilarity(
    queryTokens: string[],
    entry: KnowledgeGraphEntry,
    options: SemanticSearchOptions
  ): number {
    const entryText = `${entry.concept} ${entry.definition}`.toLowerCase();
    const entryTokens = this.tokenize(entryText);
    // Simple token overlap similarity
    const overlap = queryTokens.filter(token =>
      entryTokens.some(entryToken => entryToken.includes(token) || token.includes(entryToken))
    ).length;
    const similarity = overlap / Math.max(queryTokens.length, entryTokens.length);
    // Include context if requested
    if (options.includeContext) {
      const contextText = entry.context.tags.join(' ').toLowerCase();
      const contextTokens = this.tokenize(contextText);
      const contextOverlap = queryTokens.filter(token =>
        contextTokens.some(contextToken => contextToken.includes(token))
      ).length;
      return (similarity * 0.8) + ((contextOverlap / queryTokens.length) * 0.2);
    }
    return similarity;
  }
  private sortResults(results: KnowledgeGraphEntry[], sortBy: string): void {
    switch (sortBy) {
      case 'confidence':
        results.sort((a, b) => b.context.confidenceLevel - a.context.confidenceLevel);
        break;
      case 'recency':
        results.sort((a, b) => b.lastValidated.getTime() - a.lastValidated.getTime());
        break;
      case 'access_count':
        results.sort((a, b) => b.accessCount - a.accessCount);
        break;
      case 'relevance':
      default:
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
    }
  }
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // UTF-16 estimate
  }
}
export default ResearchMemoryAdapter;