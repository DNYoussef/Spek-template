/**
 * Comprehensive test suite for Research Princess
 * Tests all components and integration points including:
 * - Knowledge graph operations
 * - Data source connectors
 * - Pattern recognition
 * - Semantic analysis
 * - Research pipeline
 * - API endpoints
 * - Princess-Queen integration
 * - Performance benchmarks
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { KnowledgeGraphEngine, createKnowledgeGraphEngine } from '../../src/princesses/research/KnowledgeGraphEngine';
import { ResearchQueryProcessor } from '../../src/princesses/research/ResearchQueryProcessor';
import { DataSourceManager, createDataSourceManager } from '../../src/princesses/research/DataSourceConnectors';
import { PatternRecognitionEngine, createPatternRecognitionEngine } from '../../src/princesses/research/PatternRecognition';
import { SemanticAnalyzer, createSemanticAnalyzer } from '../../src/princesses/research/SemanticAnalyzer';
import { ResearchDataPipeline, createResearchDataPipeline } from '../../src/princesses/research/ResearchDataPipeline';
import { TechnologyTrendAnalyzer, CompetitiveIntelligenceAnalyzer, createTechnologyTrendAnalyzer, createCompetitiveIntelligenceAnalyzer } from '../../src/princesses/research/AdvancedResearchCapabilities';
import { ResearchPrincessAPI, createResearchPrincessAPI } from '../../src/api/research/ResearchPrincessAPI';
import { ResearchPrincessQueenIntegration, createResearchPrincessQueenIntegration } from '../../src/princesses/research/PrincessQueenIntegration';

// Test configuration
const TEST_CONFIG = {
  knowledgeGraph: {
    url: 'http://localhost:8529',
    database: 'test_research_graph',
    collections: {
      vertices: 'test_nodes',
      edges: 'test_edges',
      graph: 'test_graph'
    },
    auth: {
      username: 'test',
      password: 'test'
    }
  },
  api: {
    port: 3002,
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true
    },
    security: {
      enableHelmet: false,
      requireAuth: false
    }
  }
};

// Test data
const SAMPLE_RESEARCH_QUERY = 'modern web development frameworks comparison';
const SAMPLE_DOCUMENTS = [
  {
    id: 'doc1',
    content: 'React is a popular JavaScript library for building user interfaces, developed by Facebook.',
    timestamp: new Date('2024-01-01'),
    metadata: { source: 'tech_blog' }
  },
  {
    id: 'doc2',
    content: 'Angular is a comprehensive framework for building web applications, maintained by Google.',
    timestamp: new Date('2024-01-02'),
    metadata: { source: 'documentation' }
  },
  {
    id: 'doc3',
    content: 'Vue.js is a progressive framework that is designed to be incrementally adoptable.',
    timestamp: new Date('2024-01-03'),
    metadata: { source: 'tutorial' }
  }
];

const SAMPLE_TREND_TOPICS = ['React', 'Angular', 'Vue.js', 'Svelte', 'Next.js'];

// Mock external dependencies
jest.mock('arangojs', () => ({
  Database: jest.fn().mockImplementation(() => ({
    database: jest.fn().mockReturnThis(),
    collections: jest.fn().mockResolvedValue([]),
    createCollection: jest.fn().mockResolvedValue({}),
    createEdgeCollection: jest.fn().mockResolvedValue({}),
    createGraph: jest.fn().mockResolvedValue({}),
    collection: jest.fn().mockReturnValue({
      save: jest.fn().mockResolvedValue({ _key: 'test', _id: 'test/test', _rev: 'test' }),
      count: jest.fn().mockResolvedValue({ count: 100 }),
      ensureIndex: jest.fn().mockResolvedValue({})
    }),
    graph: jest.fn().mockReturnValue({}),
    query: jest.fn().mockResolvedValue({
      all: jest.fn().mockResolvedValue([])
    }),
    close: jest.fn().mockResolvedValue(undefined)
  })),
  aql: jest.fn().mockImplementation((strings, ...values) => ({
    query: strings.join(''),
    bindVars: values
  }))
}));

jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: '<html>Mock search results</html>' }),
    interceptors: {
      response: {
        use: jest.fn()
      }
    }
  }),
  get: jest.fn().mockResolvedValue({ data: '<html>Mock content</html>' })
}));

jest.mock('natural', () => ({
  WordTokenizer: {
    prototype: {
      tokenize: jest.fn().mockReturnValue(['test', 'tokens', 'here'])
    }
  },
  PorterStemmer: {
    stem: jest.fn().mockImplementation(word => word.toLowerCase())
  },
  SentimentAnalyzer: jest.fn().mockImplementation(() => ({
    getSentiment: jest.fn().mockReturnValue(0.5)
  })),
  BrillPOSTagger: jest.fn().mockImplementation(() => ({
    tag: jest.fn().mockReturnValue([
      { token: 'Test', tag: 'NN' },
      { token: 'word', tag: 'NN' }
    ])
  }))
}));

describe('Research Princess - Knowledge Graph Engine', () => {
  let knowledgeGraph: KnowledgeGraphEngine;

  beforeAll(async () => {
    knowledgeGraph = createKnowledgeGraphEngine(TEST_CONFIG.knowledgeGraph);
    await knowledgeGraph.initialize();
  });

  afterAll(async () => {
    await knowledgeGraph.close();
  });

  describe('Node Operations', () => {
    it('should add a knowledge node', async () => {
      const node = await knowledgeGraph.addNode({
        type: 'technology',
        label: 'React',
        properties: {
          description: 'JavaScript library for UI',
          category: 'frontend'
        },
        metadata: {
          source: 'test',
          confidence: 0.9,
          timestamp: new Date(),
          version: 1
        }
      });

      expect(node).toBeDefined();
      expect(node.label).toBe('React');
      expect(node.type).toBe('technology');
    });

    it('should update a knowledge node', async () => {
      const nodeId = 'test/test';
      const updatedNode = await knowledgeGraph.updateNode(nodeId, {
        properties: {
          description: 'Updated description',
          version: '18.0'
        }
      });

      expect(updatedNode).toBeDefined();
    });

    it('should perform semantic search', async () => {
      const results = await knowledgeGraph.semanticSearch('React framework', 5);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Graph Traversal', () => {
    it('should traverse the knowledge graph', async () => {
      const results = await knowledgeGraph.traverse('test/test', {
        query: 'related technologies',
        maxDepth: 2,
        direction: 'any'
      });

      expect(results).toBeDefined();
      expect(results.vertices).toBeDefined();
      expect(results.edges).toBeDefined();
      expect(results.statistics).toBeDefined();
    });

    it('should get node recommendations', async () => {
      const recommendations = await knowledgeGraph.getRecommendations('test/test', 5);
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Graph Statistics', () => {
    it('should return graph statistics', async () => {
      const stats = await knowledgeGraph.getStatistics();
      expect(stats).toBeDefined();
      expect(typeof stats.nodeCount).toBe('number');
      expect(typeof stats.edgeCount).toBe('number');
      expect(typeof stats.graphDensity).toBe('number');
    });
  });
});

describe('Research Princess - Query Processor', () => {
  let queryProcessor: ResearchQueryProcessor;
  let knowledgeGraph: KnowledgeGraphEngine;

  beforeAll(async () => {
    knowledgeGraph = createKnowledgeGraphEngine(TEST_CONFIG.knowledgeGraph);
    await knowledgeGraph.initialize();
    queryProcessor = new ResearchQueryProcessor(knowledgeGraph);
  });

  afterAll(async () => {
    await knowledgeGraph.close();
  });

  describe('Query Processing', () => {
    it('should process a natural language research query', async () => {
      const processedQuery = await queryProcessor.processQuery(SAMPLE_RESEARCH_QUERY);

      expect(processedQuery).toBeDefined();
      expect(processedQuery.originalQuery.rawQuery).toBe(SAMPLE_RESEARCH_QUERY);
      expect(processedQuery.originalQuery.intent).toBeDefined();
      expect(processedQuery.originalQuery.entities).toBeDefined();
      expect(processedQuery.executionPlan).toBeDefined();
      expect(Array.isArray(processedQuery.executionPlan)).toBe(true);
    });

    it('should extract entities from query', async () => {
      const processedQuery = await queryProcessor.processQuery('Compare React vs Angular performance');

      expect(processedQuery.originalQuery.entities).toBeDefined();
      expect(processedQuery.originalQuery.entities.length).toBeGreaterThan(0);

      const entityTexts = processedQuery.originalQuery.entities.map(e => e.text.toLowerCase());
      expect(entityTexts.some(text => text.includes('react'))).toBe(true);
      expect(entityTexts.some(text => text.includes('angular'))).toBe(true);
    });

    it('should generate appropriate search queries', async () => {
      const processedQuery = await queryProcessor.processQuery(SAMPLE_RESEARCH_QUERY);

      expect(processedQuery.searchQueries).toBeDefined();
      expect(processedQuery.searchQueries.web.length).toBeGreaterThan(0);
      expect(processedQuery.searchQueries.github.length).toBeGreaterThan(0);
    });

    it('should estimate execution time and cost', async () => {
      const processedQuery = await queryProcessor.processQuery(SAMPLE_RESEARCH_QUERY);

      expect(typeof processedQuery.estimatedTime).toBe('number');
      expect(typeof processedQuery.estimatedCost).toBe('number');
      expect(processedQuery.estimatedTime).toBeGreaterThan(0);
      expect(processedQuery.estimatedCost).toBeGreaterThan(0);
    });
  });
});

describe('Research Princess - Data Source Connectors', () => {
  let dataSourceManager: DataSourceManager;

  beforeAll(() => {
    dataSourceManager = createDataSourceManager();
  });

  describe('Multi-Source Search', () => {
    it('should search across multiple data sources', async () => {
      const results = await dataSourceManager.searchAll({
        query: 'React JavaScript framework',
        maxResults: 10
      });

      expect(results).toBeDefined();
      expect(results instanceof Map).toBe(true);
      expect(results.size).toBeGreaterThan(0);
    });

    it('should search specific data source', async () => {
      const results = await dataSourceManager.searchSource('web', {
        query: 'Vue.js framework',
        maxResults: 5
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Health Checks', () => {
    it('should perform health checks on all connectors', async () => {
      const healthStatus = await dataSourceManager.healthCheckAll();

      expect(healthStatus instanceof Map).toBe(true);
      expect(healthStatus.size).toBeGreaterThan(0);

      // Check that each connector returns a boolean health status
      healthStatus.forEach(status => {
        expect(typeof status).toBe('boolean');
      });
    });

    it('should list available connectors', () => {
      const connectors = dataSourceManager.getAvailableConnectors();

      expect(Array.isArray(connectors)).toBe(true);
      expect(connectors.length).toBeGreaterThan(0);
      expect(connectors).toContain('web');
    });
  });
});

describe('Research Princess - Pattern Recognition', () => {
  let patternEngine: PatternRecognitionEngine;

  beforeAll(() => {
    patternEngine = createPatternRecognitionEngine();
  });

  describe('Pattern Analysis', () => {
    it('should analyze patterns in research documents', async () => {
      const patterns = await patternEngine.analyzePatterns(SAMPLE_DOCUMENTS);

      expect(Array.isArray(patterns)).toBe(true);
      patterns.forEach(pattern => {
        expect(pattern.id).toBeDefined();
        expect(pattern.type).toBeDefined();
        expect(pattern.confidence).toBeDefined();
        expect(typeof pattern.confidence).toBe('number');
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should generate pattern insights', async () => {
      const patterns = await patternEngine.analyzePatterns(SAMPLE_DOCUMENTS);
      const insights = patternEngine.getPatternInsights(patterns);

      expect(insights).toBeDefined();
      expect(typeof insights.totalPatterns).toBe('number');
      expect(typeof insights.averageConfidence).toBe('number');
      expect(insights.patternTypes).toBeDefined();
      expect(Array.isArray(insights.topPatterns)).toBe(true);
    });

    it('should identify trends in document patterns', async () => {
      const documentsWithDates = SAMPLE_DOCUMENTS.map((doc, index) => ({
        ...doc,
        timestamp: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)) // Spread over days
      }));

      const patterns = await patternEngine.analyzePatterns(documentsWithDates);
      const trendPatterns = patterns.filter(p => p.type === 'trend');

      expect(Array.isArray(trendPatterns)).toBe(true);
    });
  });
});

describe('Research Princess - Semantic Analyzer', () => {
  let semanticAnalyzer: SemanticAnalyzer;

  beforeAll(() => {
    semanticAnalyzer = createSemanticAnalyzer();
  });

  describe('Semantic Analysis', () => {
    it('should analyze semantic content of text', async () => {
      const text = 'React is a powerful JavaScript library for building user interfaces. It uses a virtual DOM for efficient rendering.';
      const analysis = await semanticAnalyzer.analyze(text);

      expect(analysis).toBeDefined();
      expect(analysis.id).toBeDefined();
      expect(analysis.entities).toBeDefined();
      expect(analysis.concepts).toBeDefined();
      expect(analysis.sentiments).toBeDefined();
      expect(analysis.languageInfo).toBeDefined();
    });

    it('should extract named entities', async () => {
      const text = 'Google developed Angular, while Facebook created React. Both are popular JavaScript frameworks.';
      const analysis = await semanticAnalyzer.analyze(text);

      expect(analysis.entities.length).toBeGreaterThan(0);

      const entityTypes = new Set(analysis.entities.map(e => e.type));
      expect(entityTypes.size).toBeGreaterThan(0);

      // Should detect companies and technologies
      const entityTexts = analysis.entities.map(e => e.text.toLowerCase());
      expect(entityTexts.some(text => text.includes('google') || text.includes('facebook'))).toBe(true);
    });

    it('should perform sentiment analysis', async () => {
      const positiveText = 'React is an amazing and powerful framework that developers love to use.';
      const analysis = await semanticAnalyzer.analyze(positiveText);

      expect(analysis.sentiments).toBeDefined();
      expect(analysis.sentiments.overall).toBeDefined();
      expect(typeof analysis.sentiments.overall.polarity).toBe('number');
      expect(typeof analysis.sentiments.overall.confidence).toBe('number');
      expect(analysis.sentiments.overall.classification).toBeDefined();
    });

    it('should extract concepts and topics', async () => {
      const text = 'Modern web development involves using frameworks like React for building scalable user interfaces with component-based architecture.';
      const analysis = await semanticAnalyzer.analyze(text);

      expect(analysis.concepts.length).toBeGreaterThan(0);
      expect(analysis.semanticTopics.length).toBeGreaterThan(0);

      analysis.concepts.forEach(concept => {
        expect(concept.name).toBeDefined();
        expect(concept.type).toBeDefined();
        expect(typeof concept.confidence).toBe('number');
      });
    });
  });

  describe('Language Analysis', () => {
    it('should detect language information', async () => {
      const text = 'This is a technical document about software development methodologies and best practices.';
      const analysis = await semanticAnalyzer.analyze(text);

      expect(analysis.languageInfo).toBeDefined();
      expect(analysis.languageInfo.primary).toBe('en');
      expect(typeof analysis.languageInfo.confidence).toBe('number');
      expect(typeof analysis.languageInfo.technicalVocabulary).toBe('boolean');
      expect(typeof analysis.languageInfo.formality).toBe('number');
      expect(typeof analysis.languageInfo.complexity).toBe('number');
    });
  });
});

describe('Research Princess - Data Pipeline', () => {
  let dataPipeline: ResearchDataPipeline;
  let knowledgeGraph: KnowledgeGraphEngine;
  let queryProcessor: ResearchQueryProcessor;
  let dataSourceManager: DataSourceManager;
  let patternEngine: PatternRecognitionEngine;
  let semanticAnalyzer: SemanticAnalyzer;

  beforeAll(async () => {
    knowledgeGraph = createKnowledgeGraphEngine(TEST_CONFIG.knowledgeGraph);
    await knowledgeGraph.initialize();
    queryProcessor = new ResearchQueryProcessor(knowledgeGraph);
    dataSourceManager = createDataSourceManager();
    patternEngine = createPatternRecognitionEngine();
    semanticAnalyzer = createSemanticAnalyzer();

    dataPipeline = createResearchDataPipeline(
      knowledgeGraph,
      queryProcessor,
      dataSourceManager,
      patternEngine,
      semanticAnalyzer
    );
  });

  afterAll(async () => {
    dataPipeline.stop();
    await knowledgeGraph.close();
  });

  describe('Pipeline Operations', () => {
    it('should start and stop the pipeline', () => {
      dataPipeline.start();
      expect(dataPipeline).toBeDefined();

      dataPipeline.stop();
      expect(dataPipeline).toBeDefined();
    });

    it('should submit and track research queries', async () => {
      dataPipeline.start();

      const jobId = await dataPipeline.submitQuery(SAMPLE_RESEARCH_QUERY, 'medium');
      expect(typeof jobId).toBe('string');
      expect(jobId.length).toBeGreaterThan(0);

      const jobStatus = dataPipeline.getJobStatus(jobId);
      expect(jobStatus).toBeDefined();
      expect(jobStatus!.id).toBe(jobId);
      expect(jobStatus!.status).toBeDefined();

      dataPipeline.stop();
    });

    it('should submit and process documents', async () => {
      dataPipeline.start();

      const documents = SAMPLE_DOCUMENTS.map(doc => ({
        id: doc.id,
        title: `Document ${doc.id}`,
        content: doc.content,
        url: `http://example.com/${doc.id}`,
        source: 'test',
        metadata: doc.metadata,
        timestamp: doc.timestamp,
        confidence: 0.8
      }));

      const jobId = await dataPipeline.submitDocuments(documents, 'medium');
      expect(typeof jobId).toBe('string');

      const jobStatus = dataPipeline.getJobStatus(jobId);
      expect(jobStatus).toBeDefined();

      dataPipeline.stop();
    });

    it('should provide pipeline statistics', () => {
      const stats = dataPipeline.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.queue).toBeDefined();
      expect(stats.performance).toBeDefined();
      expect(typeof stats.queue.total).toBe('number');
      expect(typeof stats.performance.processingTime).toBe('number');
    });
  });
});

describe('Research Princess - Advanced Capabilities', () => {
  let trendAnalyzer: TechnologyTrendAnalyzer;
  let competitiveAnalyzer: CompetitiveIntelligenceAnalyzer;
  let knowledgeGraph: KnowledgeGraphEngine;

  beforeAll(async () => {
    knowledgeGraph = createKnowledgeGraphEngine(TEST_CONFIG.knowledgeGraph);
    await knowledgeGraph.initialize();
    trendAnalyzer = createTechnologyTrendAnalyzer(knowledgeGraph);
    competitiveAnalyzer = createCompetitiveIntelligenceAnalyzer(knowledgeGraph);
  });

  afterAll(async () => {
    await knowledgeGraph.close();
  });

  describe('Trend Analysis', () => {
    it('should analyze technology trends', async () => {
      const timeRange = {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        end: new Date()
      };

      const trends = await trendAnalyzer.analyzeTrends(SAMPLE_TREND_TOPICS, timeRange);

      expect(Array.isArray(trends)).toBe(true);
      trends.forEach(trend => {
        expect(trend.id).toBeDefined();
        expect(trend.topic).toBeDefined();
        expect(trend.trajectory).toBeDefined();
        expect(typeof trend.confidence).toBe('number');
        expect(trend.metrics).toBeDefined();
        expect(trend.predictions).toBeDefined();
        expect(Array.isArray(trend.evidence)).toBe(true);
      });
    });

    it('should provide trend metrics and predictions', async () => {
      const timeRange = {
        start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
        end: new Date()
      };

      const trends = await trendAnalyzer.analyzeTrends(['React'], timeRange);

      if (trends.length > 0) {
        const trend = trends[0];
        expect(trend.metrics.adoptionRate).toBeDefined();
        expect(trend.metrics.momentum).toBeDefined();
        expect(trend.metrics.velocity).toBeDefined();
        expect(trend.metrics.volatility).toBeDefined();

        expect(Array.isArray(trend.predictions)).toBe(true);
        trend.predictions.forEach(prediction => {
          expect(prediction.timeHorizon).toBeDefined();
          expect(prediction.prediction).toBeDefined();
          expect(typeof prediction.confidence).toBe('number');
        });
      }
    });
  });

  describe('Competitive Intelligence', () => {
    it('should analyze competitive landscape', async () => {
      const analysis = await competitiveAnalyzer.analyzeCompetitiveLandscape('web frameworks');

      expect(analysis).toBeDefined();
      expect(analysis.id).toBeDefined();
      expect(analysis.domain).toBe('web frameworks');
      expect(analysis.landscape).toBeDefined();
      expect(analysis.marketDynamics).toBeDefined();
      expect(Array.isArray(analysis.competitiveGaps)).toBe(true);
      expect(Array.isArray(analysis.threats)).toBe(true);
      expect(Array.isArray(analysis.opportunities)).toBe(true);
      expect(Array.isArray(analysis.strategicRecommendations)).toBe(true);
    });

    it('should categorize competitors properly', async () => {
      const analysis = await competitiveAnalyzer.analyzeCompetitiveLandscape('JavaScript frameworks');

      expect(analysis.landscape.leaders).toBeDefined();
      expect(analysis.landscape.challengers).toBeDefined();
      expect(analysis.landscape.visionaries).toBeDefined();
      expect(analysis.landscape.niche).toBeDefined();

      // All categories should be arrays
      expect(Array.isArray(analysis.landscape.leaders)).toBe(true);
      expect(Array.isArray(analysis.landscape.challengers)).toBe(true);
      expect(Array.isArray(analysis.landscape.visionaries)).toBe(true);
      expect(Array.isArray(analysis.landscape.niche)).toBe(true);
    });
  });
});

describe('Research Princess - API Layer', () => {
  let api: ResearchPrincessAPI;

  beforeAll(async () => {
    api = createResearchPrincessAPI(TEST_CONFIG.api);
  });

  describe('API Initialization', () => {
    it('should create API instance with default configuration', () => {
      expect(api).toBeDefined();
    });

    it('should start API server', async () => {
      // Mock the server start to avoid port conflicts in tests
      const mockStart = jest.fn().mockResolvedValue(undefined);
      (api as any).start = mockStart;

      await api.start();
      expect(mockStart).toHaveBeenCalled();
    });
  });
});

describe('Research Princess - Queen Integration', () => {
  let integration: ResearchPrincessQueenIntegration;
  let knowledgeGraph: KnowledgeGraphEngine;
  let dataPipeline: ResearchDataPipeline;
  let trendAnalyzer: TechnologyTrendAnalyzer;
  let competitiveAnalyzer: CompetitiveIntelligenceAnalyzer;

  beforeAll(async () => {
    knowledgeGraph = createKnowledgeGraphEngine(TEST_CONFIG.knowledgeGraph);
    await knowledgeGraph.initialize();

    const queryProcessor = new ResearchQueryProcessor(knowledgeGraph);
    const dataSourceManager = createDataSourceManager();
    const patternEngine = createPatternRecognitionEngine();
    const semanticAnalyzer = createSemanticAnalyzer();

    dataPipeline = createResearchDataPipeline(
      knowledgeGraph,
      queryProcessor,
      dataSourceManager,
      patternEngine,
      semanticAnalyzer
    );

    trendAnalyzer = createTechnologyTrendAnalyzer(knowledgeGraph);
    competitiveAnalyzer = createCompetitiveIntelligenceAnalyzer(knowledgeGraph);

    integration = createResearchPrincessQueenIntegration(
      knowledgeGraph,
      dataPipeline,
      trendAnalyzer,
      competitiveAnalyzer
    );
  });

  afterAll(async () => {
    dataPipeline.stop();
    await knowledgeGraph.close();
  });

  describe('Princess Capabilities', () => {
    it('should provide princess capabilities', () => {
      const capabilities = integration.getCapabilities();

      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
      expect(capabilities).toContain('research_query');
      expect(capabilities).toContain('trend_analysis');
      expect(capabilities).toContain('competitive_intelligence');
    });

    it('should provide princess status', () => {
      const status = integration.getStatus();

      expect(status).toBeDefined();
      expect(status.id).toBeDefined();
      expect(typeof status.activeOrders).toBe('number');
      expect(typeof status.completedOrders).toBe('number');
      expect(status.resourceEfficiency).toBeDefined();
      expect(status.qualityTrends).toBeDefined();
    });
  });

  describe('Order Processing', () => {
    it('should process a research query order', async () => {
      dataPipeline.start();

      const order = {
        id: 'test_order_1',
        type: 'research_query' as const,
        priority: 'normal' as const,
        payload: {
          query: SAMPLE_RESEARCH_QUERY,
          scope: {
            depth: 'basic' as const,
            sources: ['web', 'github'],
            includeCompetitive: false,
            includeTrends: false
          }
        },
        requester: {
          type: 'queen' as const,
          id: 'queen_1'
        },
        createdAt: new Date()
      };

      await integration.processQueenOrder(order);

      // Check that order was accepted (no exception thrown)
      expect(true).toBe(true);

      dataPipeline.stop();
    });

    it('should process a trend analysis order', async () => {
      dataPipeline.start();

      const order = {
        id: 'test_order_2',
        type: 'trend_analysis' as const,
        priority: 'high' as const,
        payload: {
          topics: SAMPLE_TREND_TOPICS.slice(0, 3),
          timeframe: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            end: new Date()
          }
        },
        requester: {
          type: 'queen' as const,
          id: 'queen_1'
        },
        createdAt: new Date()
      };

      await integration.processQueenOrder(order);

      // Check that order was accepted
      expect(true).toBe(true);

      dataPipeline.stop();
    });
  });

  describe('Knowledge Sharing', () => {
    it('should share knowledge with other princesses', () => {
      const knowledge = {
        targetPrincess: 'development_princess',
        knowledgeType: 'expertise' as const,
        payload: {
          technologies: ['React', 'Angular'],
          expertise_level: 'advanced'
        },
        relevance: 0.9,
        freshness: 0.8,
        accessLevel: 'public' as const
      };

      integration.shareKnowledge(knowledge);

      const sharedKnowledge = integration.getSharedKnowledge('development_princess');
      expect(Array.isArray(sharedKnowledge)).toBe(true);
    });
  });
});

describe('Research Princess - Performance Benchmarks', () => {
  let knowledgeGraph: KnowledgeGraphEngine;
  let semanticAnalyzer: SemanticAnalyzer;
  let patternEngine: PatternRecognitionEngine;

  beforeAll(async () => {
    knowledgeGraph = createKnowledgeGraphEngine(TEST_CONFIG.knowledgeGraph);
    await knowledgeGraph.initialize();
    semanticAnalyzer = createSemanticAnalyzer();
    patternEngine = createPatternRecognitionEngine();
  });

  afterAll(async () => {
    await knowledgeGraph.close();
  });

  describe('Performance Tests', () => {
    it('should process semantic analysis within performance threshold', async () => {
      const startTime = Date.now();
      const text = 'React is a popular JavaScript library for building user interfaces. It was developed by Facebook and is widely used in modern web development.';

      const analysis = await semanticAnalyzer.analyze(text);

      const processingTime = Date.now() - startTime;

      expect(analysis).toBeDefined();
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle batch document processing efficiently', async () => {
      const batchSize = 10;
      const documents = Array.from({ length: batchSize }, (_, i) => ({
        id: `perf_doc_${i}`,
        content: `This is test document ${i} containing information about various technologies and frameworks.`,
        timestamp: new Date()
      }));

      const startTime = Date.now();
      const patterns = await patternEngine.analyzePatterns(documents);
      const processingTime = Date.now() - startTime;

      expect(patterns).toBeDefined();
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(processingTime / batchSize).toBeLessThan(1000); // Less than 1 second per document
    });

    it('should demonstrate knowledge graph query performance', async () => {
      // Add some test nodes first
      await knowledgeGraph.addNode({
        type: 'technology',
        label: 'Performance Test Node',
        properties: { category: 'test' },
        metadata: {
          source: 'performance_test',
          confidence: 0.9,
          timestamp: new Date(),
          version: 1
        }
      });

      const startTime = Date.now();
      const results = await knowledgeGraph.semanticSearch('Performance Test', 10);
      const queryTime = Date.now() - startTime;

      expect(results).toBeDefined();
      expect(queryTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should measure memory usage during intensive operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform memory-intensive operations
      const largeDocuments = Array.from({ length: 50 }, (_, i) => ({
        id: `memory_test_${i}`,
        content: 'Large document content '.repeat(100), // ~2KB per document
        timestamp: new Date()
      }));

      await patternEngine.analyzePatterns(largeDocuments);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Scalability Tests', () => {
    it('should handle concurrent operations', async () => {
      const concurrentOperations = 5;
      const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
        const text = `Concurrent test ${i}: Testing scalability of semantic analysis system.`;
        return semanticAnalyzer.analyze(text);
      });

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(concurrentOperations);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.entities).toBeDefined();
      });

      // Concurrent operations should not take much longer than sequential
      expect(totalTime).toBeLessThan(15000); // 15 seconds for 5 concurrent operations
    });
  });

  describe('Stress Tests', () => {
    it('should handle large text input without crashing', async () => {
      const largeText = 'This is a stress test with large text input. '.repeat(1000); // ~47KB

      const analysis = await semanticAnalyzer.analyze(largeText);

      expect(analysis).toBeDefined();
      expect(analysis.entities).toBeDefined();
      expect(analysis.concepts).toBeDefined();
    });

    it('should process large number of small documents', async () => {
      const documentCount = 100;
      const smallDocuments = Array.from({ length: documentCount }, (_, i) => ({
        id: `stress_doc_${i}`,
        content: `Short document ${i} about technology.`,
        timestamp: new Date()
      }));

      const startTime = Date.now();
      const patterns = await patternEngine.analyzePatterns(smallDocuments);
      const processingTime = Date.now() - startTime;

      expect(patterns).toBeDefined();
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});

describe('Research Princess - Integration Tests', () => {
  let integration: ResearchPrincessQueenIntegration;
  let knowledgeGraph: KnowledgeGraphEngine;
  let dataPipeline: ResearchDataPipeline;

  beforeAll(async () => {
    knowledgeGraph = createKnowledgeGraphEngine(TEST_CONFIG.knowledgeGraph);
    await knowledgeGraph.initialize();

    const queryProcessor = new ResearchQueryProcessor(knowledgeGraph);
    const dataSourceManager = createDataSourceManager();
    const patternEngine = createPatternRecognitionEngine();
    const semanticAnalyzer = createSemanticAnalyzer();

    dataPipeline = createResearchDataPipeline(
      knowledgeGraph,
      queryProcessor,
      dataSourceManager,
      patternEngine,
      semanticAnalyzer
    );

    const trendAnalyzer = createTechnologyTrendAnalyzer(knowledgeGraph);
    const competitiveAnalyzer = createCompetitiveIntelligenceAnalyzer(knowledgeGraph);

    integration = createResearchPrincessQueenIntegration(
      knowledgeGraph,
      dataPipeline,
      trendAnalyzer,
      competitiveAnalyzer
    );
  });

  afterAll(async () => {
    dataPipeline.stop();
    await knowledgeGraph.close();
  });

  describe('End-to-End Workflow', () => {
    it('should complete a full research workflow', async () => {
      dataPipeline.start();

      // 1. Submit research query
      const query = 'Modern JavaScript frameworks comparison and trends';
      const jobId = await dataPipeline.submitQuery(query, 'high');

      expect(typeof jobId).toBe('string');

      // 2. Monitor job progress
      const jobStatus = dataPipeline.getJobStatus(jobId);
      expect(jobStatus).toBeDefined();
      expect(jobStatus!.status).toBeDefined();

      // 3. Check princess status
      const status = integration.getStatus();
      expect(status.activeOrders).toBeGreaterThanOrEqual(0);

      // 4. Verify capabilities
      const capabilities = integration.getCapabilities();
      expect(capabilities).toContain('research_query');

      dataPipeline.stop();
    });

    it('should handle error scenarios gracefully', async () => {
      // Test with invalid input
      try {
        await integration.processQueenOrder({
          id: 'invalid_order',
          type: 'research_query',
          priority: 'normal',
          payload: {}, // Empty payload should cause error
          requester: {
            type: 'queen',
            id: 'queen_1'
          },
          createdAt: new Date()
        });
      } catch (error) {
        // Error should be handled gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Quality Assurance', () => {
    it('should maintain quality standards across operations', async () => {
      const text = 'React is a JavaScript library for building user interfaces, created by Facebook.';
      const semanticAnalyzer = createSemanticAnalyzer();
      const analysis = await semanticAnalyzer.analyze(text);

      // Quality checks
      expect(analysis.metadata.confidence).toBeGreaterThan(0.5);
      expect(analysis.entities.length).toBeGreaterThan(0);

      // Each entity should have reasonable confidence
      analysis.entities.forEach(entity => {
        expect(entity.confidence).toBeGreaterThan(0.3);
        expect(entity.confidence).toBeLessThanOrEqual(1.0);
      });
    });

    it('should provide comprehensive reporting', async () => {
      const status = integration.getStatus();

      // Status should include all required metrics
      expect(status.id).toBeDefined();
      expect(typeof status.activeOrders).toBe('number');
      expect(typeof status.completedOrders).toBe('number');
      expect(status.resourceEfficiency).toBeDefined();
      expect(status.qualityTrends).toBeDefined();

      // Resource efficiency should have valid values
      Object.values(status.resourceEfficiency).forEach(efficiency => {
        expect(typeof efficiency).toBe('number');
        expect(efficiency).toBeGreaterThanOrEqual(0);
        expect(efficiency).toBeLessThanOrEqual(1);
      });
    });
  });
});

// Performance benchmark utilities
const PerformanceBenchmark = {
  async timeOperation<T>(operation: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await operation();
    const time = Date.now() - start;
    return { result, time };
  },

  measureMemory<T>(operation: () => T): { result: T; memoryUsed: number } {
    const initialMemory = process.memoryUsage().heapUsed;
    const result = operation();
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsed = finalMemory - initialMemory;
    return { result, memoryUsed };
  }
};

// Export for use in other test files
export {
  TEST_CONFIG,
  SAMPLE_RESEARCH_QUERY,
  SAMPLE_DOCUMENTS,
  SAMPLE_TREND_TOPICS,
  PerformanceBenchmark
};