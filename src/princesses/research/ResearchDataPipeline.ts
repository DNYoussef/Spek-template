/**
 * ResearchDataPipeline - Comprehensive research data processing pipeline
 * Orchestrates the flow of data through the research system:
 * - Multi-source data ingestion with quality validation
 * - Real-time processing with event-driven architecture
 * - Data transformation and normalization
 * - Quality assessment and confidence scoring
 * - Knowledge graph integration and updates
 */

import { EventEmitter } from 'events';
import { KnowledgeGraphEngine, KnowledgeNode, KnowledgeEdge } from './KnowledgeGraphEngine';
import { ResearchQueryProcessor, ProcessedQuery } from './ResearchQueryProcessor';
import { DataSourceManager, DataSourceResult } from './DataSourceConnectors';
import { PatternRecognitionEngine, Pattern } from './PatternRecognition';
import { SemanticAnalyzer, SemanticAnalysisResult } from './SemanticAnalyzer';

// Pipeline interfaces
export interface PipelineJob {
  id: string;
  type: PipelineJobType;
  priority: JobPriority;
  input: PipelineInput;
  status: JobStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, any>;
}

export type PipelineJobType =
  | 'research_query'
  | 'data_ingestion'
  | 'pattern_analysis'
  | 'semantic_analysis'
  | 'knowledge_update'
  | 'quality_assessment'
  | 'synthesis';

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface PipelineInput {
  query?: string;
  documents?: DataSourceResult[];
  patterns?: Pattern[];
  semanticResults?: SemanticAnalysisResult[];
  knowledgeUpdates?: Array<{
    type: 'node' | 'edge';
    data: KnowledgeNode | KnowledgeEdge;
  }>;
}

export interface PipelineResult {
  jobId: string;
  type: PipelineJobType;
  output: PipelineOutput;
  quality: QualityMetrics;
  performance: PerformanceMetrics;
  timestamp: Date;
}

export interface PipelineOutput {
  synthesizedContent?: string;
  extractedEntities?: any[];
  discoveredPatterns?: Pattern[];
  knowledgeUpdates?: Array<{
    type: 'created' | 'updated' | 'linked';
    id: string;
    confidence: number;
  }>;
  recommendations?: string[];
  sourceAttribution?: Array<{
    source: string;
    contribution: number;
    reliability: number;
  }>;
}

export interface QualityMetrics {
  overall: number;
  accuracy: number;
  completeness: number;
  consistency: number;
  relevance: number;
  freshness: number;
  sourceCredibility: number;
}

export interface PerformanceMetrics {
  processingTime: number;
  dataVolume: number;
  memoryUsage: number;
  apiCalls: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface PipelineConfig {
  processing: {
    maxConcurrentJobs: number;
    jobTimeout: number;
    retryAttempts: number;
    batchSize: number;
  };
  quality: {
    minAccuracy: number;
    minCompleteness: number;
    minRelevance: number;
    sourceWeights: Record<string, number>;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  monitoring: {
    metricsEnabled: boolean;
    alertThresholds: {
      errorRate: number;
      processingTime: number;
      queueSize: number;
    };
  };
}

/**
 * Pipeline Job Queue Manager
 */
class JobQueue {
  private jobs: Map<string, PipelineJob> = new Map();
  private priorityQueues: Map<JobPriority, PipelineJob[]> = new Map();
  private runningJobs: Set<string> = new Set();
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
    this.initializePriorityQueues();
  }

  private initializePriorityQueues(): void {
    this.priorityQueues.set('urgent', []);
    this.priorityQueues.set('high', []);
    this.priorityQueues.set('medium', []);
    this.priorityQueues.set('low', []);
  }

  public addJob(job: PipelineJob): void {
    this.jobs.set(job.id, job);
    this.priorityQueues.get(job.priority)!.push(job);
  }

  public getNextJob(): PipelineJob | null {
    if (this.runningJobs.size >= this.maxConcurrent) {
      return null;
    }

    // Check priority queues in order
    const priorities: JobPriority[] = ['urgent', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      const queue = this.priorityQueues.get(priority)!;
      const job = queue.find(j => j.status === 'pending');

      if (job) {
        // Remove from queue and mark as running
        const index = queue.indexOf(job);
        queue.splice(index, 1);

        job.status = 'running';
        job.startedAt = new Date();
        this.runningJobs.add(job.id);

        return job;
      }
    }

    return null;
  }

  public completeJob(jobId: string, status: JobStatus, error?: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.completedAt = new Date();
      job.progress = status === 'completed' ? 100 : job.progress;
      if (error) job.error = error;

      this.runningJobs.delete(jobId);
    }
  }

  public getJob(jobId: string): PipelineJob | undefined {
    return this.jobs.get(jobId);
  }

  public getQueueStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    const allJobs = Array.from(this.jobs.values());

    return {
      total: allJobs.length,
      pending: allJobs.filter(j => j.status === 'pending').length,
      running: allJobs.filter(j => j.status === 'running').length,
      completed: allJobs.filter(j => j.status === 'completed').length,
      failed: allJobs.filter(j => j.status === 'failed').length
    };
  }

  public updateProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = Math.min(Math.max(progress, 0), 100);
    }
  }
}

/**
 * Data Quality Assessor
 */
class QualityAssessor {
  private sourceCredibility: Map<string, number> = new Map();

  constructor() {
    this.initializeSourceCredibility();
  }

  private initializeSourceCredibility(): void {
    // Initialize credibility scores for known sources
    this.sourceCredibility.set('GitHub', 0.85);
    this.sourceCredibility.set('PubMed', 0.95);
    this.sourceCredibility.set('arXiv', 0.80);
    this.sourceCredibility.set('Web', 0.60);
    this.sourceCredibility.set('DuckDuckGo', 0.70);
    this.sourceCredibility.set('Google Scholar', 0.90);
  }

  public assessQuality(
    results: DataSourceResult[],
    patterns: Pattern[],
    semanticAnalysis: SemanticAnalysisResult[]
  ): QualityMetrics {
    const accuracy = this.calculateAccuracy(results, semanticAnalysis);
    const completeness = this.calculateCompleteness(results);
    const consistency = this.calculateConsistency(results, patterns);
    const relevance = this.calculateRelevance(results, semanticAnalysis);
    const freshness = this.calculateFreshness(results);
    const sourceCredibility = this.calculateSourceCredibility(results);

    const overall = (accuracy + completeness + consistency + relevance + freshness + sourceCredibility) / 6;

    return {
      overall,
      accuracy,
      completeness,
      consistency,
      relevance,
      freshness,
      sourceCredibility
    };
  }

  private calculateAccuracy(
    results: DataSourceResult[],
    semanticAnalysis: SemanticAnalysisResult[]
  ): number {
    if (results.length === 0) return 0;

    // Use semantic analysis confidence as accuracy indicator
    const avgSemanticConfidence = semanticAnalysis.length > 0
      ? semanticAnalysis.reduce((sum, sa) => sum + sa.metadata.confidence, 0) / semanticAnalysis.length
      : 0.5;

    // Use result confidence scores
    const avgResultConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return (avgSemanticConfidence + avgResultConfidence) / 2;
  }

  private calculateCompleteness(results: DataSourceResult[]): number {
    // Assess completeness based on result diversity and content depth
    const sources = new Set(results.map(r => r.source));
    const sourcesDiversity = Math.min(sources.size / 5, 1); // Up to 5 different sources

    const avgContentLength = results.reduce((sum, r) => sum + r.content.length, 0) / results.length;
    const contentDepth = Math.min(avgContentLength / 500, 1); // Normalize to 500 chars

    return (sourcesDiversity + contentDepth) / 2;
  }

  private calculateConsistency(results: DataSourceResult[], patterns: Pattern[]): number {
    if (results.length < 2) return 1;

    // Check for consistent information across sources
    const entityMentions = new Map<string, number>();

    results.forEach(result => {
      // Simple entity extraction for consistency check
      const words = result.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4) {
          entityMentions.set(word, (entityMentions.get(word) || 0) + 1);
        }
      });
    });

    // Calculate consistency based on entity overlap
    const commonEntities = Array.from(entityMentions.entries())
      .filter(([entity, count]) => count > 1)
      .length;

    const totalUniqueEntities = entityMentions.size;

    return totalUniqueEntities > 0 ? commonEntities / totalUniqueEntities : 0.5;
  }

  private calculateRelevance(
    results: DataSourceResult[],
    semanticAnalysis: SemanticAnalysisResult[]
  ): number {
    if (results.length === 0) return 0;

    // Use metadata confidence as relevance indicator
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Check for relevant entities in semantic analysis
    const entityRelevance = semanticAnalysis.length > 0
      ? semanticAnalysis.reduce((sum, sa) => {
          const relevantEntities = sa.entities.filter(e => e.confidence > 0.7).length;
          return sum + (relevantEntities / Math.max(sa.entities.length, 1));
        }, 0) / semanticAnalysis.length
      : 0.5;

    return (avgConfidence + entityRelevance) / 2;
  }

  private calculateFreshness(results: DataSourceResult[]): number {
    if (results.length === 0) return 0;

    const now = new Date();
    const avgAge = results.reduce((sum, r) => {
      const age = now.getTime() - r.timestamp.getTime();
      return sum + age;
    }, 0) / results.length;

    // Convert to days and calculate freshness score
    const ageInDays = avgAge / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (ageInDays / 365)); // Fresher = higher score
  }

  private calculateSourceCredibility(results: DataSourceResult[]): number {
    if (results.length === 0) return 0;

    return results.reduce((sum, r) => {
      const credibility = this.sourceCredibility.get(r.source) || 0.5;
      return sum + credibility;
    }, 0) / results.length;
  }
}

/**
 * Pipeline Performance Monitor
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private startTimes: Map<string, number> = new Map();

  public startJob(jobId: string): void {
    this.startTimes.set(jobId, Date.now());
  }

  public endJob(
    jobId: string,
    dataVolume: number,
    memoryUsage: number,
    apiCalls: number,
    cacheHits: number,
    totalCacheRequests: number,
    errors: number,
    totalOperations: number
  ): PerformanceMetrics {
    const startTime = this.startTimes.get(jobId) || Date.now();
    const processingTime = Date.now() - startTime;
    const cacheHitRate = totalCacheRequests > 0 ? cacheHits / totalCacheRequests : 0;
    const errorRate = totalOperations > 0 ? errors / totalOperations : 0;

    const metrics: PerformanceMetrics = {
      processingTime,
      dataVolume,
      memoryUsage,
      apiCalls,
      cacheHitRate,
      errorRate
    };

    this.metrics.set(jobId, metrics);
    this.startTimes.delete(jobId);

    return metrics;
  }

  public getAverageMetrics(): PerformanceMetrics {
    const allMetrics = Array.from(this.metrics.values());
    if (allMetrics.length === 0) {
      return {
        processingTime: 0,
        dataVolume: 0,
        memoryUsage: 0,
        apiCalls: 0,
        cacheHitRate: 0,
        errorRate: 0
      };
    }

    return {
      processingTime: allMetrics.reduce((sum, m) => sum + m.processingTime, 0) / allMetrics.length,
      dataVolume: allMetrics.reduce((sum, m) => sum + m.dataVolume, 0) / allMetrics.length,
      memoryUsage: allMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / allMetrics.length,
      apiCalls: allMetrics.reduce((sum, m) => sum + m.apiCalls, 0) / allMetrics.length,
      cacheHitRate: allMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / allMetrics.length,
      errorRate: allMetrics.reduce((sum, m) => sum + m.errorRate, 0) / allMetrics.length
    };
  }
}

/**
 * Main Research Data Pipeline
 */
export class ResearchDataPipeline extends EventEmitter {
  private jobQueue: JobQueue;
  private qualityAssessor: QualityAssessor;
  private performanceMonitor: PerformanceMonitor;
  private config: PipelineConfig;

  // Component engines
  private knowledgeGraph: KnowledgeGraphEngine;
  private queryProcessor: ResearchQueryProcessor;
  private dataSourceManager: DataSourceManager;
  private patternEngine: PatternRecognitionEngine;
  private semanticAnalyzer: SemanticAnalyzer;

  private isRunning: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(
    knowledgeGraph: KnowledgeGraphEngine,
    queryProcessor: ResearchQueryProcessor,
    dataSourceManager: DataSourceManager,
    patternEngine: PatternRecognitionEngine,
    semanticAnalyzer: SemanticAnalyzer,
    config?: Partial<PipelineConfig>
  ) {
    super();

    this.knowledgeGraph = knowledgeGraph;
    this.queryProcessor = queryProcessor;
    this.dataSourceManager = dataSourceManager;
    this.patternEngine = patternEngine;
    this.semanticAnalyzer = semanticAnalyzer;

    this.config = {
      processing: {
        maxConcurrentJobs: 5,
        jobTimeout: 300000, // 5 minutes
        retryAttempts: 3,
        batchSize: 10,
        ...config?.processing
      },
      quality: {
        minAccuracy: 0.7,
        minCompleteness: 0.6,
        minRelevance: 0.7,
        sourceWeights: {
          'PubMed': 1.0,
          'GitHub': 0.8,
          'arXiv': 0.9,
          'Web': 0.5
        },
        ...config?.quality
      },
      caching: {
        enabled: true,
        ttl: 3600, // 1 hour
        maxSize: 1000,
        ...config?.caching
      },
      monitoring: {
        metricsEnabled: true,
        alertThresholds: {
          errorRate: 0.1,
          processingTime: 60000, // 1 minute
          queueSize: 50
        },
        ...config?.monitoring
      }
    };

    this.jobQueue = new JobQueue(this.config.processing.maxConcurrentJobs);
    this.qualityAssessor = new QualityAssessor();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Start the pipeline processing loop
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, 1000); // Check for jobs every second

    this.emit('pipeline:started');
  }

  /**
   * Stop the pipeline
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    this.emit('pipeline:stopped');
  }

  /**
   * Submit a research query for processing
   */
  public async submitQuery(
    query: string,
    priority: JobPriority = 'medium',
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job: PipelineJob = {
      id: jobId,
      type: 'research_query',
      priority,
      input: { query },
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      metadata
    };

    this.jobQueue.addJob(job);
    this.emit('job:submitted', job);

    return jobId;
  }

  /**
   * Submit documents for analysis
   */
  public async submitDocuments(
    documents: DataSourceResult[],
    priority: JobPriority = 'medium',
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job: PipelineJob = {
      id: jobId,
      type: 'data_ingestion',
      priority,
      input: { documents },
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      metadata
    };

    this.jobQueue.addJob(job);
    this.emit('job:submitted', job);

    return jobId;
  }

  /**
   * Get job status
   */
  public getJobStatus(jobId: string): PipelineJob | null {
    return this.jobQueue.getJob(jobId) || null;
  }

  /**
   * Get pipeline statistics
   */
  public getStatistics(): {
    queue: ReturnType<JobQueue['getQueueStats']>;
    performance: PerformanceMetrics;
  } {
    return {
      queue: this.jobQueue.getQueueStats(),
      performance: this.performanceMonitor.getAverageMetrics()
    };
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    const job = this.jobQueue.getNextJob();
    if (!job) return;

    this.performanceMonitor.startJob(job.id);
    this.emit('job:started', job);

    try {
      const result = await this.executeJob(job);
      this.jobQueue.completeJob(job.id, 'completed');
      this.emit('job:completed', { job, result });
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      this.jobQueue.completeJob(job.id, 'failed', error.message);
      this.emit('job:failed', { job, error });
    }
  }

  /**
   * Execute a specific job
   */
  private async executeJob(job: PipelineJob): Promise<PipelineResult> {
    let output: PipelineOutput = {};
    let dataVolume = 0;
    let apiCalls = 0;
    let errors = 0;

    switch (job.type) {
      case 'research_query':
        output = await this.processResearchQuery(job);
        break;

      case 'data_ingestion':
        output = await this.processDataIngestion(job);
        break;

      case 'pattern_analysis':
        output = await this.processPatternAnalysis(job);
        break;

      case 'semantic_analysis':
        output = await this.processSemanticAnalysis(job);
        break;

      case 'knowledge_update':
        output = await this.processKnowledgeUpdate(job);
        break;

      case 'synthesis':
        output = await this.processSynthesis(job);
        break;

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    // Calculate quality metrics
    const quality = this.qualityAssessor.assessQuality(
      job.input.documents || [],
      job.input.patterns || [],
      job.input.semanticResults || []
    );

    // Record performance metrics
    const performance = this.performanceMonitor.endJob(
      job.id,
      dataVolume,
      process.memoryUsage().heapUsed,
      apiCalls,
      0, // Cache hits (to be implemented)
      0, // Total cache requests (to be implemented)
      errors,
      1 // Total operations
    );

    return {
      jobId: job.id,
      type: job.type,
      output,
      quality,
      performance,
      timestamp: new Date()
    };
  }

  private async processResearchQuery(job: PipelineJob): Promise<PipelineOutput> {
    const { query } = job.input;
    if (!query) throw new Error('No query provided');

    // Process query
    const processedQuery = await this.queryProcessor.processQuery(query);
    job.progress = 20;

    // Execute searches
    const searchResults = await this.dataSourceManager.searchAll({
      query,
      maxResults: 50
    });
    job.progress = 50;

    // Combine results from all sources
    const allResults: DataSourceResult[] = [];
    searchResults.forEach(results => allResults.push(...results));

    // Semantic analysis
    const semanticResults = await Promise.all(
      allResults.slice(0, 10).map(result =>
        this.semanticAnalyzer.analyze(result.content)
      )
    );
    job.progress = 70;

    // Pattern recognition
    const patterns = await this.patternEngine.analyzePatterns(
      allResults.map(r => ({
        id: r.id,
        content: r.content,
        timestamp: r.timestamp
      }))
    );
    job.progress = 90;

    // Update knowledge graph
    const knowledgeUpdates = await this.updateKnowledgeGraph(semanticResults, patterns);
    job.progress = 100;

    return {
      synthesizedContent: this.synthesizeContent(allResults, semanticResults),
      extractedEntities: semanticResults.flatMap(sr => sr.entities),
      discoveredPatterns: patterns,
      knowledgeUpdates,
      recommendations: this.generateRecommendations(patterns, semanticResults),
      sourceAttribution: this.calculateSourceAttribution(allResults)
    };
  }

  private async processDataIngestion(job: PipelineJob): Promise<PipelineOutput> {
    const { documents } = job.input;
    if (!documents || documents.length === 0) {
      throw new Error('No documents provided for ingestion');
    }

    // Process documents in batches
    const batchSize = this.config.processing.batchSize;
    const results: any[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      // Semantic analysis for batch
      const batchSemanticResults = await Promise.all(
        batch.map(doc => this.semanticAnalyzer.analyze(doc.content))
      );

      results.push(...batchSemanticResults);
      job.progress = Math.floor(((i + batch.length) / documents.length) * 100);
    }

    return {
      extractedEntities: results.flatMap(r => r.entities),
      synthesizedContent: 'Data ingestion completed successfully'
    };
  }

  private async processPatternAnalysis(job: PipelineJob): Promise<PipelineOutput> {
    const { documents } = job.input;
    if (!documents || documents.length === 0) {
      throw new Error('No documents provided for pattern analysis');
    }

    const patterns = await this.patternEngine.analyzePatterns(
      documents.map(doc => ({
        id: doc.id,
        content: doc.content,
        timestamp: doc.timestamp
      }))
    );

    return {
      discoveredPatterns: patterns
    };
  }

  private async processSemanticAnalysis(job: PipelineJob): Promise<PipelineOutput> {
    const { documents } = job.input;
    if (!documents || documents.length === 0) {
      throw new Error('No documents provided for semantic analysis');
    }

    const semanticResults = await Promise.all(
      documents.map(doc => this.semanticAnalyzer.analyze(doc.content))
    );

    return {
      extractedEntities: semanticResults.flatMap(sr => sr.entities)
    };
  }

  private async processKnowledgeUpdate(job: PipelineJob): Promise<PipelineOutput> {
    const { knowledgeUpdates } = job.input;
    if (!knowledgeUpdates || knowledgeUpdates.length === 0) {
      throw new Error('No knowledge updates provided');
    }

    const updates: PipelineOutput['knowledgeUpdates'] = [];

    for (const update of knowledgeUpdates) {
      try {
        if (update.type === 'node') {
          const node = await this.knowledgeGraph.addNode(update.data as any);
          updates!.push({
            type: 'created',
            id: node._id!,
            confidence: 0.8
          });
        } else if (update.type === 'edge') {
          const edge = await this.knowledgeGraph.addEdge(update.data as any);
          updates!.push({
            type: 'created',
            id: edge._id!,
            confidence: 0.8
          });
        }
      } catch (error) {
        console.error('Knowledge update failed:', error);
      }
    }

    return { knowledgeUpdates: updates };
  }

  private async processSynthesis(job: PipelineJob): Promise<PipelineOutput> {
    const { documents, patterns, semanticResults } = job.input;

    const synthesizedContent = this.synthesizeContent(
      documents || [],
      semanticResults || []
    );

    const recommendations = this.generateRecommendations(
      patterns || [],
      semanticResults || []
    );

    return {
      synthesizedContent,
      recommendations
    };
  }

  private async updateKnowledgeGraph(
    semanticResults: SemanticAnalysisResult[],
    patterns: Pattern[]
  ): Promise<PipelineOutput['knowledgeUpdates']> {
    const updates: PipelineOutput['knowledgeUpdates'] = [];

    // Add entities as nodes
    for (const semantic of semanticResults) {
      for (const entity of semantic.entities) {
        try {
          const node = await this.knowledgeGraph.addNode({
            type: entity.type.toLowerCase(),
            label: entity.text,
            properties: {
              canonicalForm: entity.canonicalForm,
              aliases: entity.aliases,
              confidence: entity.confidence
            },
            metadata: {
              source: 'semantic_analysis',
              confidence: entity.confidence,
              timestamp: new Date(),
              version: 1
            }
          });

          updates.push({
            type: 'created',
            id: node._id!,
            confidence: entity.confidence
          });
        } catch (error) {
          // Node might already exist, which is okay
        }
      }
    }

    return updates;
  }

  private synthesizeContent(
    results: DataSourceResult[],
    semanticResults: SemanticAnalysisResult[]
  ): string {
    if (results.length === 0) return 'No content to synthesize';

    // Extract key themes
    const entityCounts = new Map<string, number>();
    semanticResults.forEach(sr => {
      sr.entities.forEach(entity => {
        entityCounts.set(entity.text, (entityCounts.get(entity.text) || 0) + 1);
      });
    });

    const topEntities = Array.from(entityCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([entity]) => entity);

    // Create synthesis
    let synthesis = `Research synthesis based on ${results.length} sources:\n\n`;

    if (topEntities.length > 0) {
      synthesis += `Key topics identified: ${topEntities.join(', ')}\n\n`;
    }

    // Add source-specific insights
    const sourceInsights = results.slice(0, 3).map(result =>
      `- ${result.source}: ${result.content.substring(0, 150)}...`
    ).join('\n');

    synthesis += `Key findings:\n${sourceInsights}`;

    return synthesis;
  }

  private generateRecommendations(
    patterns: Pattern[],
    semanticResults: SemanticAnalysisResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Pattern-based recommendations
    patterns.slice(0, 3).forEach(pattern => {
      recommendations.push(`Explore ${pattern.name} - confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
    });

    // Entity-based recommendations
    const topEntities = semanticResults
      .flatMap(sr => sr.entities)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    topEntities.forEach(entity => {
      recommendations.push(`Research more about ${entity.text} (${entity.type})`);
    });

    return recommendations;
  }

  private calculateSourceAttribution(results: DataSourceResult[]): PipelineOutput['sourceAttribution'] {
    const sourceContributions = new Map<string, { count: number; totalReliability: number }>();

    results.forEach(result => {
      const existing = sourceContributions.get(result.source) || { count: 0, totalReliability: 0 };
      existing.count += 1;
      existing.totalReliability += result.confidence;
      sourceContributions.set(result.source, existing);
    });

    return Array.from(sourceContributions.entries()).map(([source, stats]) => ({
      source,
      contribution: stats.count / results.length,
      reliability: stats.totalReliability / stats.count
    }));
  }

  private generateJobId(): string {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Factory function
export function createResearchDataPipeline(
  knowledgeGraph: KnowledgeGraphEngine,
  queryProcessor: ResearchQueryProcessor,
  dataSourceManager: DataSourceManager,
  patternEngine: PatternRecognitionEngine,
  semanticAnalyzer: SemanticAnalyzer,
  config?: Partial<PipelineConfig>
): ResearchDataPipeline {
  return new ResearchDataPipeline(
    knowledgeGraph,
    queryProcessor,
    dataSourceManager,
    patternEngine,
    semanticAnalyzer,
    config
  );
}