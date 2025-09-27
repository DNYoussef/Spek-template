/**
 * ResearchPrincessAPI - Enterprise-grade REST API for Research Princess
 * Provides comprehensive research endpoints including:
 * - Complex research query processing
 * - Real-time trend analysis
 * - Knowledge graph operations
 * - Competitive intelligence
 * - Research synthesis and recommendations
 * - Performance monitoring and analytics
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, query, param, validationResult } from 'express-validator';

// Import Research Princess components
import { KnowledgeGraphEngine, createKnowledgeGraphEngine, defaultKnowledgeGraphConfig } from '../../princesses/research/KnowledgeGraphEngine';
import { ResearchQueryProcessor } from '../../princesses/research/ResearchQueryProcessor';
import { DataSourceManager, createDataSourceManager } from '../../princesses/research/DataSourceConnectors';
import { PatternRecognitionEngine, createPatternRecognitionEngine } from '../../princesses/research/PatternRecognition';
import { SemanticAnalyzer, createSemanticAnalyzer } from '../../princesses/research/SemanticAnalyzer';
import { ResearchDataPipeline, createResearchDataPipeline } from '../../princesses/research/ResearchDataPipeline';
import { TechnologyTrendAnalyzer, CompetitiveIntelligenceAnalyzer, createTechnologyTrendAnalyzer, createCompetitiveIntelligenceAnalyzer } from '../../princesses/research/AdvancedResearchCapabilities';

// API interfaces
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    requestId: string;
    processingTime: number;
    version: string;
  };
}

export interface ResearchQueryRequest {
  query: string;
  options?: {
    maxResults?: number;
    sources?: string[];
    includePatterns?: boolean;
    includeSemantic?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  context?: {
    userId?: string;
    sessionId?: string;
    domain?: string;
  };
}

export interface TrendAnalysisRequest {
  topics: string[];
  timeRange?: {
    start: string; // ISO date string
    end: string;   // ISO date string
  };
  options?: {
    includeCompetitive?: boolean;
    includePredictions?: boolean;
    depth?: 'basic' | 'detailed' | 'comprehensive';
  };
}

export interface KnowledgeGraphRequest {
  operation: 'search' | 'traverse' | 'add_node' | 'add_edge' | 'update' | 'delete';
  data?: any;
  parameters?: {
    query?: string;
    startNode?: string;
    maxDepth?: number;
    filters?: Record<string, any>;
  };
}

export interface SynthesisRequest {
  sources: Array<{
    id: string;
    content: string;
    type: 'academic' | 'industry' | 'news' | 'technical';
    metadata?: any;
  }>;
  topic: string;
  options?: {
    includeRecommendations?: boolean;
    citationFormat?: 'apa' | 'ieee' | 'chicago' | 'harvard';
    maxLength?: number;
  };
}

/**
 * Research Princess API Configuration
 */
export interface ResearchAPIConfig {
  port: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  security: {
    enableHelmet: boolean;
    requireAuth: boolean;
    apiKeys?: string[];
  };
  performance: {
    requestTimeout: number;
    maxPayloadSize: string;
    enableCompression: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

/**
 * Middleware for request validation and error handling
 */
class APIMiddleware {
  public static validateRequest(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: APIResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors.array()
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || 'unknown',
          processingTime: 0,
          version: '1.0.0'
        }
      };
      res.status(400).json(response);
      return;
    }
    next();
  }

  public static authenticate(apiKeys: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const apiKey = req.headers['x-api-key'] as string;

      if (!apiKey || !apiKeys.includes(apiKey)) {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing API key'
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string || 'unknown',
            processingTime: 0,
            version: '1.0.0'
          }
        };
        res.status(401).json(response);
        return;
      }
      next();
    };
  }

  public static errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('API Error:', err);

    const response: APIResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        processingTime: 0,
        version: '1.0.0'
      }
    };

    res.status(500).json(response);
  }

  public static notFound(req: Request, res: Response): void {
    const response: APIResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found`
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        processingTime: 0,
        version: '1.0.0'
      }
    };

    res.status(404).json(response);
  }
}

/**
 * Main Research Princess API Class
 */
export class ResearchPrincessAPI {
  private app: express.Application;
  private config: ResearchAPIConfig;

  // Research Princess components
  private knowledgeGraph: KnowledgeGraphEngine;
  private queryProcessor: ResearchQueryProcessor;
  private dataSourceManager: DataSourceManager;
  private patternEngine: PatternRecognitionEngine;
  private semanticAnalyzer: SemanticAnalyzer;
  private dataPipeline: ResearchDataPipeline;
  private trendAnalyzer: TechnologyTrendAnalyzer;
  private competitiveAnalyzer: CompetitiveIntelligenceAnalyzer;

  // Performance tracking
  private requestCount: number = 0;
  private startTime: Date = new Date();

  constructor(config?: Partial<ResearchAPIConfig>) {
    this.config = {
      port: 3001,
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      },
      security: {
        enableHelmet: true,
        requireAuth: false,
        apiKeys: []
      },
      performance: {
        requestTimeout: 30000, // 30 seconds
        maxPayloadSize: '10mb',
        enableCompression: true
      },
      monitoring: {
        enableMetrics: true,
        enableLogging: true,
        logLevel: 'info'
      },
      ...config
    };

    this.app = express();
    this.initializeComponents();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private async initializeComponents(): Promise<void> {
    // Initialize knowledge graph
    this.knowledgeGraph = createKnowledgeGraphEngine(defaultKnowledgeGraphConfig);
    await this.knowledgeGraph.initialize();

    // Initialize other components
    this.queryProcessor = new ResearchQueryProcessor(this.knowledgeGraph);
    this.dataSourceManager = createDataSourceManager();
    this.patternEngine = createPatternRecognitionEngine();
    this.semanticAnalyzer = createSemanticAnalyzer();

    // Initialize data pipeline
    this.dataPipeline = createResearchDataPipeline(
      this.knowledgeGraph,
      this.queryProcessor,
      this.dataSourceManager,
      this.patternEngine,
      this.semanticAnalyzer
    );

    // Initialize advanced capabilities
    this.trendAnalyzer = createTechnologyTrendAnalyzer(this.knowledgeGraph);
    this.competitiveAnalyzer = createCompetitiveIntelligenceAnalyzer(this.knowledgeGraph);

    // Start pipeline
    this.dataPipeline.start();
  }

  private setupMiddleware(): void {
    // Security
    if (this.config.security.enableHelmet) {
      this.app.use(helmet());
    }

    // CORS
    this.app.use(cors(this.config.cors));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.maxRequests,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      }
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: this.config.performance.maxPayloadSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.performance.maxPayloadSize }));

    // Request ID and timing
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      (req as any).startTime = Date.now();
      this.requestCount++;
      next();
    });

    // Authentication
    if (this.config.security.requireAuth && this.config.security.apiKeys) {
      this.app.use('/api/', APIMiddleware.authenticate(this.config.security.apiKeys));
    }
  }

  private setupRoutes(): void {
    const router = express.Router();

    // Health check endpoint
    router.get('/health', this.handleHealthCheck.bind(this));

    // Metrics endpoint
    router.get('/metrics', this.handleMetrics.bind(this));

    // Research query endpoints
    router.post('/research/query',
      [
        body('query').isString().isLength({ min: 1, max: 1000 }),
        body('options.maxResults').optional().isInt({ min: 1, max: 100 }),
        body('options.sources').optional().isArray(),
        body('options.priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
      ],
      APIMiddleware.validateRequest,
      this.handleResearchQuery.bind(this)
    );

    router.get('/research/query/:jobId/status',
      [param('jobId').isString()],
      APIMiddleware.validateRequest,
      this.handleQueryStatus.bind(this)
    );

    // Trend analysis endpoints
    router.post('/research/trends',
      [
        body('topics').isArray().isLength({ min: 1, max: 10 }),
        body('topics.*').isString().isLength({ min: 1, max: 100 }),
        body('timeRange.start').optional().isISO8601(),
        body('timeRange.end').optional().isISO8601()
      ],
      APIMiddleware.validateRequest,
      this.handleTrendAnalysis.bind(this)
    );

    // Knowledge graph endpoints
    router.post('/knowledge-graph',
      [body('operation').isIn(['search', 'traverse', 'add_node', 'add_edge', 'update', 'delete'])],
      APIMiddleware.validateRequest,
      this.handleKnowledgeGraph.bind(this)
    );

    router.get('/knowledge-graph/statistics',
      this.handleKnowledgeGraphStats.bind(this)
    );

    // Competitive intelligence endpoints
    router.post('/research/competitive',
      [body('domain').isString().isLength({ min: 1, max: 100 })],
      APIMiddleware.validateRequest,
      this.handleCompetitiveAnalysis.bind(this)
    );

    // Research synthesis endpoints
    router.post('/research/synthesis',
      [
        body('sources').isArray().isLength({ min: 1, max: 50 }),
        body('topic').isString().isLength({ min: 1, max: 200 })
      ],
      APIMiddleware.validateRequest,
      this.handleResearchSynthesis.bind(this)
    );

    // Pattern analysis endpoints
    router.post('/research/patterns',
      [body('documents').isArray().isLength({ min: 1, max: 100 })],
      APIMiddleware.validateRequest,
      this.handlePatternAnalysis.bind(this)
    );

    // Recommendations endpoint
    router.get('/research/recommendations/:nodeId',
      [param('nodeId').isString()],
      APIMiddleware.validateRequest,
      this.handleRecommendations.bind(this)
    );

    this.app.use('/api/v1', router);
  }

  private setupErrorHandling(): void {
    this.app.use(APIMiddleware.notFound);
    this.app.use(APIMiddleware.errorHandler);
  }

  // Route handlers
  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Check component health
      const knowledgeGraphHealth = await this.checkKnowledgeGraphHealth();
      const dataSourceHealth = await this.checkDataSourceHealth();
      const pipelineHealth = this.checkPipelineHealth();

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        components: {
          knowledgeGraph: knowledgeGraphHealth,
          dataSources: dataSourceHealth,
          pipeline: pipelineHealth
        },
        version: '1.0.0'
      };

      const response: APIResponse = {
        success: true,
        data: health,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      const response: APIResponse = {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          details: error.message
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(503).json(response);
    }
  }

  private async handleMetrics(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    const metrics = {
      requests: {
        total: this.requestCount,
        rate: this.requestCount / ((Date.now() - this.startTime.getTime()) / 1000 / 60) // per minute
      },
      pipeline: this.dataPipeline.getStatistics(),
      uptime: Date.now() - this.startTime.getTime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    const response: APIResponse = {
      success: true,
      data: metrics,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
        processingTime: Date.now() - startTime,
        version: '1.0.0'
      }
    };

    res.json(response);
  }

  private async handleResearchQuery(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestData = req.body as ResearchQueryRequest;

    try {
      const jobId = await this.dataPipeline.submitQuery(
        requestData.query,
        requestData.options?.priority || 'medium',
        {
          userId: requestData.context?.userId,
          sessionId: requestData.context?.sessionId,
          domain: requestData.context?.domain,
          options: requestData.options
        }
      );

      const response: APIResponse = {
        success: true,
        data: {
          jobId,
          status: 'submitted',
          estimatedTime: '30-60 seconds',
          statusUrl: `/api/v1/research/query/${jobId}/status`
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(202).json(response);
    } catch (error) {
      throw new Error(`Research query failed: ${error.message}`);
    }
  }

  private async handleQueryStatus(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const { jobId } = req.params;

    try {
      const jobStatus = this.dataPipeline.getJobStatus(jobId);

      if (!jobStatus) {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Job ${jobId} not found`
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
            processingTime: Date.now() - startTime,
            version: '1.0.0'
          }
        };

        res.status(404).json(response);
        return;
      }

      const response: APIResponse = {
        success: true,
        data: {
          jobId,
          status: jobStatus.status,
          progress: jobStatus.progress,
          createdAt: jobStatus.createdAt,
          startedAt: jobStatus.startedAt,
          completedAt: jobStatus.completedAt,
          error: jobStatus.error
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  private async handleTrendAnalysis(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestData = req.body as TrendAnalysisRequest;

    try {
      const timeRange = requestData.timeRange ? {
        start: new Date(requestData.timeRange.start),
        end: new Date(requestData.timeRange.end)
      } : {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        end: new Date()
      };

      const trends = await this.trendAnalyzer.analyzeTrends(requestData.topics, timeRange);

      let competitiveAnalysis;
      if (requestData.options?.includeCompetitive && requestData.topics.length > 0) {
        competitiveAnalysis = await this.competitiveAnalyzer.analyzeCompetitiveLandscape(requestData.topics[0]);
      }

      const response: APIResponse = {
        success: true,
        data: {
          trends,
          competitive: competitiveAnalysis,
          analysis: {
            totalTrends: trends.length,
            emergingTrends: trends.filter(t => t.trajectory === 'emerging').length,
            decliningTrends: trends.filter(t => t.trajectory === 'declining').length,
            averageConfidence: trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      throw new Error(`Trend analysis failed: ${error.message}`);
    }
  }

  private async handleKnowledgeGraph(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestData = req.body as KnowledgeGraphRequest;

    try {
      let result;

      switch (requestData.operation) {
        case 'search':
          result = await this.knowledgeGraph.semanticSearch(
            requestData.parameters?.query || '',
            requestData.parameters?.filters?.limit || 10
          );
          break;

        case 'traverse':
          result = await this.knowledgeGraph.traverse(
            requestData.parameters?.startNode || '',
            {
              query: requestData.parameters?.query || '',
              maxDepth: requestData.parameters?.maxDepth || 2,
              filters: requestData.parameters?.filters || {}
            }
          );
          break;

        case 'add_node':
          result = await this.knowledgeGraph.addNode(requestData.data);
          break;

        case 'add_edge':
          result = await this.knowledgeGraph.addEdge(requestData.data);
          break;

        default:
          throw new Error(`Unsupported operation: ${requestData.operation}`);
      }

      const response: APIResponse = {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      throw new Error(`Knowledge graph operation failed: ${error.message}`);
    }
  }

  private async handleKnowledgeGraphStats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const stats = await this.knowledgeGraph.getStatistics();

      const response: APIResponse = {
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      throw new Error(`Statistics retrieval failed: ${error.message}`);
    }
  }

  private async handleCompetitiveAnalysis(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const { domain } = req.body;

    try {
      const analysis = await this.competitiveAnalyzer.analyzeCompetitiveLandscape(domain);

      const response: APIResponse = {
        success: true,
        data: analysis,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      throw new Error(`Competitive analysis failed: ${error.message}`);
    }
  }

  private async handleResearchSynthesis(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestData = req.body as SynthesisRequest;

    try {
      // Convert sources to DataSourceResult format
      const documents = requestData.sources.map(source => ({
        id: source.id,
        title: `${source.type} source`,
        content: source.content,
        url: '',
        source: source.type,
        metadata: source.metadata || {},
        timestamp: new Date(),
        confidence: 0.8
      }));

      // Perform semantic analysis
      const semanticResults = await Promise.all(
        documents.slice(0, 10).map(doc => this.semanticAnalyzer.analyze(doc.content))
      );

      // Generate synthesis
      const synthesis = this.generateSynthesis(documents, semanticResults, requestData.topic);

      const response: APIResponse = {
        success: true,
        data: synthesis,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      throw new Error(`Research synthesis failed: ${error.message}`);
    }
  }

  private async handlePatternAnalysis(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const { documents } = req.body;

    try {
      const patterns = await this.patternEngine.analyzePatterns(documents);
      const insights = this.patternEngine.getPatternInsights(patterns);

      const response: APIResponse = {
        success: true,
        data: {
          patterns,
          insights
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }

  private async handleRecommendations(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const { nodeId } = req.params;
    const { maxRecommendations = 5 } = req.query;

    try {
      const recommendations = await this.knowledgeGraph.getRecommendations(
        nodeId,
        parseInt(maxRecommendations as string)
      );

      const response: APIResponse = {
        success: true,
        data: {
          nodeId,
          recommendations,
          count: recommendations.length
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.json(response);
    } catch (error) {
      throw new Error(`Recommendation generation failed: ${error.message}`);
    }
  }

  // Helper methods
  private async checkKnowledgeGraphHealth(): Promise<{ status: string; details?: any }> {
    try {
      await this.knowledgeGraph.getStatistics();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', details: error.message };
    }
  }

  private async checkDataSourceHealth(): Promise<{ status: string; details?: any }> {
    try {
      const healthStatus = await this.dataSourceManager.healthCheckAll();
      const allHealthy = Array.from(healthStatus.values()).every(status => status);
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        details: Object.fromEntries(healthStatus)
      };
    } catch (error) {
      return { status: 'unhealthy', details: error.message };
    }
  }

  private checkPipelineHealth(): { status: string; details?: any } {
    try {
      const stats = this.dataPipeline.getStatistics();
      return {
        status: 'healthy',
        details: {
          queueSize: stats.queue.pending,
          runningJobs: stats.queue.running,
          completedJobs: stats.queue.completed,
          failedJobs: stats.queue.failed
        }
      };
    } catch (error) {
      return { status: 'unhealthy', details: error.message };
    }
  }

  private generateSynthesis(documents: any[], semanticResults: any[], topic: string): any {
    // Simple synthesis generation - in practice, this would be more sophisticated
    const keyEntities = semanticResults
      .flatMap(sr => sr.entities)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    const synthesis = {
      id: `synthesis_${Date.now()}`,
      topic,
      summary: `Research synthesis on ${topic} based on ${documents.length} sources`,
      keyFindings: [
        `${keyEntities.length} key entities identified`,
        `${documents.length} sources analyzed`,
        `Average confidence: ${(semanticResults.reduce((sum, sr) => sum + sr.metadata.confidence, 0) / semanticResults.length * 100).toFixed(1)}%`
      ],
      entities: keyEntities.slice(0, 5),
      sources: documents.map(doc => ({
        id: doc.id,
        type: doc.source,
        title: doc.title,
        contribution: 1 / documents.length
      })),
      confidence: semanticResults.reduce((sum, sr) => sum + sr.metadata.confidence, 0) / semanticResults.length,
      generatedAt: new Date().toISOString()
    };

    return synthesis;
  }

  /**
   * Start the API server
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      const server = this.app.listen(this.config.port, () => {
        console.log(`Research Princess API started on port ${this.config.port}`);
        console.log(`Health check: http://localhost:${this.config.port}/api/v1/health`);
        console.log(`API documentation: http://localhost:${this.config.port}/api/v1/docs`);
        resolve();
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        this.dataPipeline.stop();
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
    });
  }
}

// Factory function
export function createResearchPrincessAPI(config?: Partial<ResearchAPIConfig>): ResearchPrincessAPI {
  return new ResearchPrincessAPI(config);
}

// Default configuration
export const defaultAPIConfig: ResearchAPIConfig = {
  port: parseInt(process.env.RESEARCH_API_PORT || '3001'),
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  },
  security: {
    enableHelmet: true,
    requireAuth: process.env.REQUIRE_AUTH === 'true',
    apiKeys: process.env.API_KEYS?.split(',') || []
  },
  performance: {
    requestTimeout: 30000,
    maxPayloadSize: '10mb',
    enableCompression: true
  },
  monitoring: {
    enableMetrics: true,
    enableLogging: true,
    logLevel: 'info'
  }
};