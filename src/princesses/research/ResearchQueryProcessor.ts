/**
 * ResearchQueryProcessor - Advanced query parsing and optimization
 * Processes natural language research queries and converts them into structured
 * operations for the knowledge graph and data sources.
 */

import { KnowledgeGraphEngine, GraphQuery, KnowledgeNode } from './KnowledgeGraphEngine';

// Query processing interfaces
export interface ResearchQuery {
  id: string;
  rawQuery: string;
  intent: QueryIntent;
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  filters: QueryFilter[];
  scope: QueryScope;
  priority: QueryPriority;
  metadata: {
    timestamp: Date;
    userId?: string;
    sessionId?: string;
  };
}

export interface QueryIntent {
  primary: 'search' | 'analyze' | 'synthesize' | 'recommend' | 'trend' | 'compare';
  secondary?: string[];
  confidence: number;
  reasoning: string;
}

export interface ExtractedEntity {
  text: string;
  type: 'technology' | 'company' | 'person' | 'concept' | 'method' | 'framework' | 'standard';
  confidence: number;
  aliases: string[];
  context: string;
}

export interface ExtractedRelationship {
  source: string;
  target: string;
  type: 'implements' | 'uses' | 'replaces' | 'influences' | 'competes' | 'collaborates';
  confidence: number;
}

export interface QueryFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: any;
  weight: number;
}

export interface QueryScope {
  domains: string[];
  timeRange?: {
    start?: Date;
    end?: Date;
  };
  sources: string[];
  depth: number;
  maxResults: number;
}

export type QueryPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProcessedQuery {
  originalQuery: ResearchQuery;
  graphQueries: GraphQuery[];
  searchQueries: {
    web: WebSearchQuery[];
    github: GitHubSearchQuery[];
    academic: AcademicSearchQuery[];
  };
  executionPlan: QueryExecutionStep[];
  estimatedTime: number;
  estimatedCost: number;
}

export interface WebSearchQuery {
  query: string;
  domain?: string;
  dateRange?: string;
  language?: string;
  maxResults: number;
}

export interface GitHubSearchQuery {
  query: string;
  type: 'repositories' | 'code' | 'issues' | 'commits';
  language?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  maxResults: number;
}

export interface AcademicSearchQuery {
  query: string;
  source: 'pubmed' | 'arxiv' | 'scholar' | 'ieee' | 'acm';
  fields?: string[];
  yearRange?: [number, number];
  maxResults: number;
}

export interface QueryExecutionStep {
  id: string;
  type: 'graph_traversal' | 'web_search' | 'github_search' | 'academic_search' | 'synthesis';
  description: string;
  dependencies: string[];
  estimatedTime: number;
  priority: number;
}

/**
 * Natural Language Processing utilities for query understanding
 */
class NLPProcessor {
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private entityPatterns: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Intent recognition patterns
    this.intentPatterns.set('search', [
      /\b(find|search|look\s+for|discover|locate)\b/i,
      /\b(what\s+is|tell\s+me\s+about|information\s+about)\b/i
    ]);

    this.intentPatterns.set('analyze', [
      /\b(analyze|analysis|examine|study|investigate)\b/i,
      /\b(how\s+does|why\s+does|performance|comparison)\b/i
    ]);

    this.intentPatterns.set('synthesize', [
      /\b(synthesize|combine|merge|integrate|consolidate)\b/i,
      /\b(relationship|connection|pattern|trend)\b/i
    ]);

    this.intentPatterns.set('recommend', [
      /\b(recommend|suggest|propose|advise)\b/i,
      /\b(best\s+practice|alternative|option|choice)\b/i
    ]);

    this.intentPatterns.set('trend', [
      /\b(trend|trending|popular|emerging|latest)\b/i,
      /\b(future|prediction|forecast|evolution)\b/i
    ]);

    this.intentPatterns.set('compare', [
      /\b(compare|comparison|vs|versus|difference)\b/i,
      /\b(better|worse|advantages|disadvantages)\b/i
    ]);

    // Entity recognition patterns
    this.entityPatterns.set('technology', [
      /\b(react|angular|vue|node\.?js|python|javascript|typescript|java|golang|rust|kubernetes|docker)\b/i,
      /\b(framework|library|platform|database|api|microservice)\b/i
    ]);

    this.entityPatterns.set('company', [
      /\b(google|microsoft|amazon|apple|meta|netflix|uber|airbnb|stripe)\b/i,
      /\b(inc\.|corp\.|ltd\.|llc)\b/i
    ]);

    this.entityPatterns.set('concept', [
      /\b(machine\s+learning|artificial\s+intelligence|blockchain|cloud\s+computing|devops|agile)\b/i,
      /\b(scalability|performance|security|reliability|maintainability)\b/i
    ]);
  }

  public extractIntent(query: string): QueryIntent {
    const scores = new Map<string, number>();

    for (const [intent, patterns] of this.intentPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          score += 1;
        }
      }
      if (score > 0) {
        scores.set(intent, score);
      }
    }

    // Get primary intent with highest score
    const sortedIntents = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    const primary = sortedIntents.length > 0 ? sortedIntents[0][0] as QueryIntent['primary'] : 'search';
    const confidence = sortedIntents.length > 0 ? Math.min(sortedIntents[0][1] / 3, 1) : 0.3;

    return {
      primary,
      secondary: sortedIntents.slice(1, 3).map(([intent]) => intent),
      confidence,
      reasoning: `Detected intent based on keywords: ${sortedIntents.map(([intent, score]) => `${intent}(${score})`).join(', ')}`
    };
  }

  public extractEntities(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    for (const [type, patterns] of this.entityPatterns) {
      for (const pattern of patterns) {
        const matches = query.match(pattern);
        if (matches) {
          for (const match of matches) {
            entities.push({
              text: match,
              type: type as ExtractedEntity['type'],
              confidence: 0.8,
              aliases: [],
              context: this.extractContext(query, match)
            });
          }
        }
      }
    }

    return this.deduplicateEntities(entities);
  }

  private extractContext(query: string, entity: string): string {
    const index = query.toLowerCase().indexOf(entity.toLowerCase());
    const start = Math.max(0, index - 20);
    const end = Math.min(query.length, index + entity.length + 20);
    return query.substring(start, end).trim();
  }

  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.type}:${entity.text.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

/**
 * Query optimization engine
 */
class QueryOptimizer {
  public optimizeExecutionPlan(steps: QueryExecutionStep[]): QueryExecutionStep[] {
    // Sort by priority and dependencies
    const sortedSteps = this.topologicalSort(steps);

    // Parallel execution grouping
    return this.groupParallelSteps(sortedSteps);
  }

  private topologicalSort(steps: QueryExecutionStep[]): QueryExecutionStep[] {
    const sorted: QueryExecutionStep[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (step: QueryExecutionStep) => {
      if (temp.has(step.id)) {
        throw new Error('Circular dependency detected in query execution plan');
      }
      if (visited.has(step.id)) {
        return;
      }

      temp.add(step.id);

      // Visit dependencies first
      for (const depId of step.dependencies) {
        const depStep = steps.find(s => s.id === depId);
        if (depStep) {
          visit(depStep);
        }
      }

      temp.delete(step.id);
      visited.add(step.id);
      sorted.push(step);
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        visit(step);
      }
    }

    return sorted;
  }

  private groupParallelSteps(steps: QueryExecutionStep[]): QueryExecutionStep[] {
    // Group steps that can be executed in parallel
    // For now, return as-is but mark parallel opportunities
    return steps.map((step, index) => ({
      ...step,
      priority: this.calculatePriority(step, steps, index)
    }));
  }

  private calculatePriority(step: QueryExecutionStep, allSteps: QueryExecutionStep[], index: number): number {
    // Higher priority for steps with no dependencies
    if (step.dependencies.length === 0) {
      return 10;
    }

    // Medium priority for graph operations
    if (step.type === 'graph_traversal') {
      return 8;
    }

    // Lower priority for synthesis steps
    if (step.type === 'synthesis') {
      return 5;
    }

    return step.priority;
  }
}

/**
 * Main Research Query Processor
 */
export class ResearchQueryProcessor {
  private nlpProcessor: NLPProcessor;
  private optimizer: QueryOptimizer;
  private knowledgeGraph: KnowledgeGraphEngine;

  constructor(knowledgeGraph: KnowledgeGraphEngine) {
    this.nlpProcessor = new NLPProcessor();
    this.optimizer = new QueryOptimizer();
    this.knowledgeGraph = knowledgeGraph;
  }

  /**
   * Process a natural language research query
   */
  public async processQuery(rawQuery: string, metadata: Partial<ResearchQuery['metadata']> = {}): Promise<ProcessedQuery> {
    const queryId = this.generateQueryId();

    // Parse natural language
    const intent = this.nlpProcessor.extractIntent(rawQuery);
    const entities = this.nlpProcessor.extractEntities(rawQuery);
    const relationships = this.extractRelationships(rawQuery, entities);
    const filters = this.extractFilters(rawQuery);
    const scope = this.determineScope(rawQuery, intent, entities);

    // Create research query object
    const researchQuery: ResearchQuery = {
      id: queryId,
      rawQuery,
      intent,
      entities,
      relationships,
      filters,
      scope,
      priority: this.determinePriority(rawQuery),
      metadata: {
        timestamp: new Date(),
        ...metadata
      }
    };

    // Generate execution plan
    const executionSteps = this.generateExecutionSteps(researchQuery);
    const optimizedSteps = this.optimizer.optimizeExecutionPlan(executionSteps);

    // Create specific queries for each data source
    const graphQueries = this.generateGraphQueries(researchQuery);
    const searchQueries = this.generateSearchQueries(researchQuery);

    return {
      originalQuery: researchQuery,
      graphQueries,
      searchQueries,
      executionPlan: optimizedSteps,
      estimatedTime: this.estimateExecutionTime(optimizedSteps),
      estimatedCost: this.estimateExecutionCost(optimizedSteps)
    };
  }

  /**
   * Extract relationships from query and entities
   */
  private extractRelationships(query: string, entities: ExtractedEntity[]): ExtractedRelationship[] {
    const relationships: ExtractedRelationship[] = [];

    // Simple relationship extraction based on proximity and keywords
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const source = entities[i];
        const target = entities[j];

        // Check for relationship keywords between entities
        const sourceIndex = query.indexOf(source.text);
        const targetIndex = query.indexOf(target.text);
        const start = Math.min(sourceIndex, targetIndex);
        const end = Math.max(sourceIndex + source.text.length, targetIndex + target.text.length);
        const between = query.substring(start, end);

        const relationType = this.detectRelationshipType(between);
        if (relationType) {
          relationships.push({
            source: source.text,
            target: target.text,
            type: relationType,
            confidence: 0.7
          });
        }
      }
    }

    return relationships;
  }

  private detectRelationshipType(text: string): ExtractedRelationship['type'] | null {
    if (/\b(implement|implementation|built\s+with)\b/i.test(text)) return 'implements';
    if (/\b(use|using|utilize|leverage)\b/i.test(text)) return 'uses';
    if (/\b(replace|replaces|alternative|instead)\b/i.test(text)) return 'replaces';
    if (/\b(influence|affect|impact)\b/i.test(text)) return 'influences';
    if (/\b(compete|vs|versus|against)\b/i.test(text)) return 'competes';
    if (/\b(collaborate|partner|integrate)\b/i.test(text)) return 'collaborates';
    return null;
  }

  /**
   * Extract filters from query
   */
  private extractFilters(query: string): QueryFilter[] {
    const filters: QueryFilter[] = [];

    // Date filters
    const dateMatch = query.match(/\b(after|since|before|from)\s+(\d{4})\b/i);
    if (dateMatch) {
      const operator = dateMatch[1].toLowerCase() === 'after' || dateMatch[1].toLowerCase() === 'since' ? 'greater' : 'less';
      filters.push({
        field: 'metadata.timestamp',
        operator,
        value: new Date(`${dateMatch[2]}-01-01`),
        weight: 1.0
      });
    }

    // Language filters
    const languageMatch = query.match(/\b(in\s+)?(javascript|typescript|python|java|golang|rust|c\+\+|c#)\b/i);
    if (languageMatch) {
      filters.push({
        field: 'properties.language',
        operator: 'equals',
        value: languageMatch[2].toLowerCase(),
        weight: 0.8
      });
    }

    return filters;
  }

  /**
   * Determine query scope
   */
  private determineScope(query: string, intent: QueryIntent, entities: ExtractedEntity[]): QueryScope {
    // Determine domains based on entities
    const domains = Array.from(new Set(entities.map(e => e.type)));

    // Determine depth based on intent
    const depth = intent.primary === 'synthesize' ? 3 : intent.primary === 'analyze' ? 2 : 1;

    // Determine max results based on query complexity
    const maxResults = entities.length > 5 ? 100 : entities.length > 2 ? 50 : 20;

    return {
      domains,
      sources: ['web', 'github', 'academic', 'internal'],
      depth,
      maxResults
    };
  }

  /**
   * Determine query priority
   */
  private determinePriority(query: string): QueryPriority {
    if (/\b(urgent|immediately|asap|critical)\b/i.test(query)) return 'urgent';
    if (/\b(important|priority|needed\s+soon)\b/i.test(query)) return 'high';
    if (/\b(when\s+possible|eventually|sometime)\b/i.test(query)) return 'low';
    return 'medium';
  }

  /**
   * Generate execution steps
   */
  private generateExecutionSteps(query: ResearchQuery): QueryExecutionStep[] {
    const steps: QueryExecutionStep[] = [];

    // Step 1: Knowledge graph traversal (if entities exist)
    if (query.entities.length > 0) {
      steps.push({
        id: 'graph_traversal_1',
        type: 'graph_traversal',
        description: 'Traverse knowledge graph for related entities',
        dependencies: [],
        estimatedTime: 2000,
        priority: 10
      });
    }

    // Step 2: Web search
    steps.push({
      id: 'web_search_1',
      type: 'web_search',
      description: 'Search web for relevant information',
      dependencies: [],
      estimatedTime: 5000,
      priority: 8
    });

    // Step 3: GitHub search (if technology-related)
    if (query.entities.some(e => e.type === 'technology')) {
      steps.push({
        id: 'github_search_1',
        type: 'github_search',
        description: 'Search GitHub for code and repositories',
        dependencies: [],
        estimatedTime: 3000,
        priority: 7
      });
    }

    // Step 4: Academic search (if research-oriented)
    if (query.intent.primary === 'analyze' || query.intent.primary === 'synthesize') {
      steps.push({
        id: 'academic_search_1',
        type: 'academic_search',
        description: 'Search academic databases',
        dependencies: [],
        estimatedTime: 4000,
        priority: 6
      });
    }

    // Step 5: Synthesis
    if (steps.length > 1) {
      steps.push({
        id: 'synthesis_1',
        type: 'synthesis',
        description: 'Synthesize results from all sources',
        dependencies: steps.map(s => s.id),
        estimatedTime: 3000,
        priority: 5
      });
    }

    return steps;
  }

  /**
   * Generate graph queries
   */
  private generateGraphQueries(query: ResearchQuery): GraphQuery[] {
    const queries: GraphQuery[] = [];

    for (const entity of query.entities) {
      queries.push({
        query: entity.text,
        maxDepth: query.scope.depth,
        direction: 'any',
        filters: {
          type: entity.type
        }
      });
    }

    return queries;
  }

  /**
   * Generate search queries for different sources
   */
  private generateSearchQueries(query: ResearchQuery): ProcessedQuery['searchQueries'] {
    const webQueries: WebSearchQuery[] = [];
    const githubQueries: GitHubSearchQuery[] = [];
    const academicQueries: AcademicSearchQuery[] = [];

    // Web search queries
    webQueries.push({
      query: query.rawQuery,
      maxResults: Math.min(query.scope.maxResults, 20)
    });

    // Entity-specific web searches
    for (const entity of query.entities.slice(0, 3)) {
      webQueries.push({
        query: `${entity.text} ${query.intent.primary}`,
        maxResults: 10
      });
    }

    // GitHub queries (for technology entities)
    const techEntities = query.entities.filter(e => e.type === 'technology');
    for (const entity of techEntities.slice(0, 3)) {
      githubQueries.push({
        query: entity.text,
        type: 'repositories',
        sort: 'stars',
        order: 'desc',
        maxResults: 10
      });
    }

    // Academic queries (for research intents)
    if (['analyze', 'synthesize'].includes(query.intent.primary)) {
      academicQueries.push({
        query: query.rawQuery.replace(/[^\w\s]/g, ''),
        source: 'scholar',
        maxResults: 15
      });
    }

    return {
      web: webQueries,
      github: githubQueries,
      academic: academicQueries
    };
  }

  /**
   * Estimate execution time
   */
  private estimateExecutionTime(steps: QueryExecutionStep[]): number {
    // Find critical path
    return steps.reduce((total, step) => total + step.estimatedTime, 0);
  }

  /**
   * Estimate execution cost
   */
  private estimateExecutionCost(steps: QueryExecutionStep[]): number {
    const costPerStep = {
      graph_traversal: 0.01,
      web_search: 0.05,
      github_search: 0.02,
      academic_search: 0.10,
      synthesis: 0.15
    };

    return steps.reduce((total, step) => {
      return total + (costPerStep[step.type] || 0.01);
    }, 0);
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `rq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}