/**
 * Integration API Specification
 * RESTful, WebSocket, and GraphQL endpoints for linter integration system
 * MESH NODE AGENT: Integration Specialist for Linter Integration Architecture Swarm
 */

import { EventEmitter } from 'events';
import { createServer, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { performance } from 'perf_hooks';
import { createHash, randomBytes } from 'crypto';

// Import types from integration system
import { 
  RealTimeLinterIngestionEngine, 
  StreamingResult, 
  LinterResult, 
  Violation 
} from './real-time-ingestion-engine';
import { 
  ToolManagementSystem, 
  ToolStatus, 
  ToolExecutionResult 
} from './tool-management-system';
import { 
  ResultCorrelationFramework, 
  CorrelationAnalysisResult, 
  ViolationCluster 
} from './result-correlation-framework';

// API Request/Response types
interface ApiRequest {
  id: string;
  method: string;
  path: string;
  query: Record<string, string>;
  body?: any;
  headers: Record<string, string>;
  timestamp: number;
  authentication?: AuthenticationContext;
}

interface ApiResponse {
  id: string;
  status: number;
  data?: any;
  error?: string;
  metadata: {
    executionTime: number;
    timestamp: number;
    rateLimit: RateLimitInfo;
    version: string;
  };
}

interface AuthenticationContext {
  apiKey: string;
  userId?: string;
  permissions: string[];
  rateLimit: number;
  quotaUsed: number;
  expiresAt: number;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  windowStart: number;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error' | 'ping' | 'pong';
  channel?: string;
  data?: any;
  timestamp: number;
  id: string;
}

interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

interface GraphQLResponse {
  data?: any;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
  }>;
  extensions?: Record<string, any>;
}

// Endpoint configurations
interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authentication: 'required' | 'optional' | 'none';
  rateLimit: number; // requests per minute
  timeout: number;
  documentation: string;
  examples: any[];
}

/**
 * Integration API Server
 * Comprehensive API server supporting REST, WebSocket, and GraphQL
 */
export class IntegrationApiServer extends EventEmitter {
  private readonly httpServer: Server;
  private readonly wsServer: WebSocketServer;
  private readonly apiKeys: Map<string, AuthenticationContext> = new Map();
  private readonly rateLimits: Map<string, RateLimitInfo> = new Map();
  private readonly activeConnections: Map<string, WebSocket> = new Map();
  private readonly subscriptions: Map<string, Set<string>> = new Map(); // channel -> connection IDs
  
  private readonly endpoints: Map<string, EndpointConfig> = new Map();
  private readonly middleware: Array<(req: ApiRequest, res: ApiResponse) => Promise<boolean>> = [];
  
  private isRunning: boolean = false;
  private readonly port: number;
  private readonly version: string = '1.0.0';
  
  constructor(
    private readonly ingestionEngine: RealTimeLinterIngestionEngine,
    private readonly toolManager: ToolManagementSystem,
    private readonly correlationFramework: ResultCorrelationFramework,
    port: number = 3000
  ) {
    super();
    this.port = port;
    this.httpServer = createServer();
    this.wsServer = new WebSocketServer({ server: this.httpServer });
    
    this.initializeEndpoints();
    this.setupHttpHandlers();
    this.setupWebSocketHandlers();
    this.setupAuthentication();
    this.setupRateLimiting();
  }

  /**
   * Initialize all API endpoints
   */
  private initializeEndpoints(): void {
    const endpoints: Array<[string, EndpointConfig]> = [
      // Health and Status Endpoints
      ['/health', {
        path: '/health',
        method: 'GET',
        authentication: 'none',
        rateLimit: 60,
        timeout: 5000,
        documentation: 'Check API health status',
        examples: [{ response: { status: 'healthy', timestamp: Date.now() } }]
      }],
      
      ['/status', {
        path: '/status',
        method: 'GET',
        authentication: 'required',
        rateLimit: 30,
        timeout: 10000,
        documentation: 'Get comprehensive system status',
        examples: []
      }],
      
      // Linter Execution Endpoints
      ['/api/v1/lint/execute', {
        path: '/api/v1/lint/execute',
        method: 'POST',
        authentication: 'required',
        rateLimit: 10,
        timeout: 300000, // 5 minutes for linting
        documentation: 'Execute linting on specified files',
        examples: [{
          request: { filePaths: ['src/file.ts'], tools: ['eslint', 'tsc'] },
          response: { correlationId: 'abc123', status: 'started' }
        }]
      }],
      
      ['/api/v1/lint/results/{correlationId}', {
        path: '/api/v1/lint/results/{correlationId}',
        method: 'GET',
        authentication: 'required',
        rateLimit: 30,
        timeout: 30000,
        documentation: 'Get linting results by correlation ID',
        examples: []
      }],
      
      // Tool Management Endpoints
      ['/api/v1/tools', {
        path: '/api/v1/tools',
        method: 'GET',
        authentication: 'required',
        rateLimit: 60,
        timeout: 10000,
        documentation: 'List all registered linter tools',
        examples: []
      }],
      
      ['/api/v1/tools/{toolId}/status', {
        path: '/api/v1/tools/{toolId}/status',
        method: 'GET',
        authentication: 'required',
        rateLimit: 60,
        timeout: 10000,
        documentation: 'Get status of specific tool',
        examples: []
      }],
      
      ['/api/v1/tools/{toolId}/execute', {
        path: '/api/v1/tools/{toolId}/execute',
        method: 'POST',
        authentication: 'required',
        rateLimit: 15,
        timeout: 300000,
        documentation: 'Execute specific tool',
        examples: []
      }],
      
      // Correlation Analysis Endpoints
      ['/api/v1/correlations/analyze', {
        path: '/api/v1/correlations/analyze',
        method: 'POST',
        authentication: 'required',
        rateLimit: 5,
        timeout: 120000,
        documentation: 'Perform correlation analysis on results',
        examples: []
      }],
      
      ['/api/v1/correlations/clusters', {
        path: '/api/v1/correlations/clusters',
        method: 'GET',
        authentication: 'required',
        rateLimit: 30,
        timeout: 30000,
        documentation: 'Get violation clusters',
        examples: []
      }],
      
      // Metrics and Monitoring Endpoints
      ['/api/v1/metrics/tools', {
        path: '/api/v1/metrics/tools',
        method: 'GET',
        authentication: 'required',
        rateLimit: 30,
        timeout: 15000,
        documentation: 'Get tool performance metrics',
        examples: []
      }],
      
      ['/api/v1/metrics/correlations', {
        path: '/api/v1/metrics/correlations',
        method: 'GET',
        authentication: 'required',
        rateLimit: 30,
        timeout: 15000,
        documentation: 'Get correlation metrics',
        examples: []
      }],
      
      // Configuration Endpoints
      ['/api/v1/config/tools/{toolId}', {
        path: '/api/v1/config/tools/{toolId}',
        method: 'PUT',
        authentication: 'required',
        rateLimit: 10,
        timeout: 30000,
        documentation: 'Update tool configuration',
        examples: []
      }],
      
      // GraphQL Endpoint
      ['/graphql', {
        path: '/graphql',
        method: 'POST',
        authentication: 'required',
        rateLimit: 20,
        timeout: 60000,
        documentation: 'GraphQL endpoint for complex queries',
        examples: []
      }]
    ];
    
    endpoints.forEach(([path, config]) => {
      this.endpoints.set(path, config);
    });
  }

  /**
   * Setup HTTP request handlers
   */
  private setupHttpHandlers(): void {
    this.httpServer.on('request', async (req, res) => {
      const startTime = performance.now();
      const requestId = this.generateRequestId();
      
      try {
        // Parse request
        const apiRequest = await this.parseHttpRequest(req, requestId);
        
        // Apply middleware
        const middlewareResult = await this.applyMiddleware(apiRequest);
        if (!middlewareResult.allowed) {
          this.sendHttpResponse(res, {
            id: requestId,
            status: middlewareResult.status || 403,
            error: middlewareResult.message || 'Access denied',
            metadata: this.createResponseMetadata(startTime, apiRequest)
          });
          return;
        }
        
        // Route request
        const response = await this.routeRequest(apiRequest);
        response.metadata = this.createResponseMetadata(startTime, apiRequest);
        
        this.sendHttpResponse(res, response);
        
        // Log request
        this.emit('api_request', {
          request: apiRequest,
          response,
          duration: performance.now() - startTime
        });
        
      } catch (error) {
        const errorResponse: ApiResponse = {
          id: requestId,
          status: 500,
          error: error.message,
          metadata: this.createResponseMetadata(startTime)
        };
        
        this.sendHttpResponse(res, errorResponse);
        this.emit('api_error', { requestId, error: error.message });
      }
    });
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    this.wsServer.on('connection', (ws, req) => {
      const connectionId = this.generateConnectionId();
      this.activeConnections.set(connectionId, ws);
      
      ws.on('message', async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleWebSocketMessage(connectionId, message);
        } catch (error) {
          this.sendWebSocketError(ws, 'Invalid message format', error.message);
        }
      });
      
      ws.on('close', () => {
        this.cleanupConnection(connectionId);
      });
      
      ws.on('error', (error) => {
        this.emit('websocket_error', { connectionId, error: error.message });
        this.cleanupConnection(connectionId);
      });
      
      // Send welcome message
      this.sendWebSocketMessage(ws, {
        type: 'data',
        data: { 
          message: 'Connected to Linter Integration API',
          connectionId,
          version: this.version 
        },
        timestamp: Date.now(),
        id: this.generateMessageId()
      });
    });
  }

  /**
   * Setup authentication system
   */
  private setupAuthentication(): void {
    // Default API key for development
    this.apiKeys.set('dev-key-12345', {
      apiKey: 'dev-key-12345',
      userId: 'developer',
      permissions: ['read', 'write', 'admin'],
      rateLimit: 100,
      quotaUsed: 0,
      expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
    });
  }

  /**
   * Setup rate limiting
   */
  private setupRateLimiting(): void {
    // Clean up rate limit data every minute
    setInterval(() => {
      const now = Date.now();
      const oneMinute = 60 * 1000;
      
      for (const [key, limit] of this.rateLimits.entries()) {
        if (now - limit.windowStart > oneMinute) {
          this.rateLimits.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Route HTTP requests to appropriate handlers
   */
  private async routeRequest(request: ApiRequest): Promise<ApiResponse> {
    const { path, method } = request;
    
    // Health endpoint
    if (path === '/health' && method === 'GET') {
      return this.handleHealthCheck(request);
    }
    
    // Status endpoint
    if (path === '/status' && method === 'GET') {
      return this.handleStatusCheck(request);
    }
    
    // Lint execution
    if (path === '/api/v1/lint/execute' && method === 'POST') {
      return this.handleLintExecution(request);
    }
    
    // Lint results
    if (path.startsWith('/api/v1/lint/results/') && method === 'GET') {
      const correlationId = path.split('/').pop()!;
      return this.handleLintResults(request, correlationId);
    }
    
    // Tool management
    if (path === '/api/v1/tools' && method === 'GET') {
      return this.handleToolsList(request);
    }
    
    if (path.startsWith('/api/v1/tools/') && path.endsWith('/status') && method === 'GET') {
      const toolId = path.split('/')[4];
      return this.handleToolStatus(request, toolId);
    }
    
    if (path.startsWith('/api/v1/tools/') && path.endsWith('/execute') && method === 'POST') {
      const toolId = path.split('/')[4];
      return this.handleToolExecution(request, toolId);
    }
    
    // Correlation analysis
    if (path === '/api/v1/correlations/analyze' && method === 'POST') {
      return this.handleCorrelationAnalysis(request);
    }
    
    if (path === '/api/v1/correlations/clusters' && method === 'GET') {
      return this.handleClustersList(request);
    }
    
    // Metrics
    if (path === '/api/v1/metrics/tools' && method === 'GET') {
      return this.handleToolMetrics(request);
    }
    
    if (path === '/api/v1/metrics/correlations' && method === 'GET') {
      return this.handleCorrelationMetrics(request);
    }
    
    // GraphQL
    if (path === '/graphql' && method === 'POST') {
      return this.handleGraphQL(request);
    }
    
    // Not found
    return {
      id: request.id,
      status: 404,
      error: 'Endpoint not found',
      metadata: this.createResponseMetadata(performance.now())
    };
  }

  /**
   * Handle individual endpoint requests
   */
  private async handleHealthCheck(request: ApiRequest): Promise<ApiResponse> {
    return {
      id: request.id,
      status: 200,
      data: {
        status: 'healthy',
        timestamp: Date.now(),
        version: this.version,
        uptime: process.uptime(),
        services: {
          ingestionEngine: 'healthy',
          toolManager: 'healthy',
          correlationFramework: 'healthy'
        }
      },
      metadata: this.createResponseMetadata(performance.now())
    };
  }

  private async handleStatusCheck(request: ApiRequest): Promise<ApiResponse> {
    try {
      const toolStatus = this.toolManager.getAllToolStatus();
      const connectionCount = this.activeConnections.size;
      
      return {
        id: request.id,
        status: 200,
        data: {
          tools: toolStatus,
          activeConnections: connectionCount,
          subscriptions: Object.fromEntries(this.subscriptions),
          performance: {
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
          }
        },
        metadata: this.createResponseMetadata(performance.now())
      };
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        error: error.message,
        metadata: this.createResponseMetadata(performance.now())
      };
    }
  }

  private async handleLintExecution(request: ApiRequest): Promise<ApiResponse> {
    try {
      const { filePaths, tools, options } = request.body;
      
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return {
          id: request.id,
          status: 400,
          error: 'filePaths is required and must be a non-empty array',
          metadata: this.createResponseMetadata(performance.now())
        };
      }
      
      // Start execution (non-blocking)
      const executionPromise = this.ingestionEngine.executeRealtimeLinting(filePaths, {
        ...options,
        allowConcurrent: true
      });
      
      // Generate correlation ID for tracking
      const correlationId = this.generateCorrelationId();
      
      // Handle execution in background
      executionPromise
        .then(result => {
          this.broadcastToChannel('lint-results', {
            type: 'execution-complete',
            correlationId,
            result
          });
        })
        .catch(error => {
          this.broadcastToChannel('lint-results', {
            type: 'execution-error',
            correlationId,
            error: error.message
          });
        });
      
      return {
        id: request.id,
        status: 202, // Accepted
        data: {
          correlationId,
          status: 'started',
          filePaths,
          tools: tools || 'all',
          estimatedDuration: filePaths.length * 5000 // rough estimate
        },
        metadata: this.createResponseMetadata(performance.now())
      };
      
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        error: error.message,
        metadata: this.createResponseMetadata(performance.now())
      };
    }
  }

  private async handleLintResults(request: ApiRequest, correlationId: string): Promise<ApiResponse> {
    // This would retrieve stored results by correlation ID
    // For now, return a placeholder
    return {
      id: request.id,
      status: 200,
      data: {
        correlationId,
        status: 'completed',
        results: [],
        message: 'Results retrieval not yet implemented - use WebSocket for real-time results'
      },
      metadata: this.createResponseMetadata(performance.now())
    };
  }

  private async handleToolsList(request: ApiRequest): Promise<ApiResponse> {
    try {
      const status = this.toolManager.getAllToolStatus();
      
      return {
        id: request.id,
        status: 200,
        data: {
          tools: Object.keys(status),
          detailed: status
        },
        metadata: this.createResponseMetadata(performance.now())
      };
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        error: error.message,
        metadata: this.createResponseMetadata(performance.now())
      };
    }
  }

  private async handleToolStatus(request: ApiRequest, toolId: string): Promise<ApiResponse> {
    try {
      const status = this.toolManager.getToolStatus(toolId);
      
      return {
        id: request.id,
        status: 200,
        data: status,
        metadata: this.createResponseMetadata(performance.now())
      };
    } catch (error) {
      return {
        id: request.id,
        status: 404,
        error: error.message,
        metadata: this.createResponseMetadata(performance.now())
      };
    }
  }

  private async handleToolExecution(request: ApiRequest, toolId: string): Promise<ApiResponse> {
    try {
      const { filePaths, options } = request.body;
      
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return {
          id: request.id,
          status: 400,
          error: 'filePaths is required and must be a non-empty array',
          metadata: this.createResponseMetadata(performance.now())
        };
      }
      
      const result = await this.toolManager.executeTool(toolId, filePaths, options);
      
      return {
        id: request.id,
        status: 200,
        data: result,
        metadata: this.createResponseMetadata(performance.now())
      };
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        error: error.message,
        metadata: this.createResponseMetadata(performance.now())
      };
    }
  }

  private async handleCorrelationAnalysis(request: ApiRequest): Promise<ApiResponse> {
    try {
      const { results } = request.body;
      
      if (!Array.isArray(results)) {
        return {
          id: request.id,
          status: 400,
          error: 'results is required and must be an array',
          metadata: this.createResponseMetadata(performance.now())
        };
      }
      
      const analysis = await this.correlationFramework.correlateResults(results);
      
      return {
        id: request.id,
        status: 200,
        data: analysis,
        metadata: this.createResponseMetadata(performance.now())
      };
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        error: error.message,
        metadata: this.createResponseMetadata(performance.now())
      };
    }
  }

  private async handleClustersList(request: ApiRequest): Promise<ApiResponse> {
    // This would retrieve stored clusters
    // For now, return a placeholder
    return {
      id: request.id,
      status: 200,
      data: {
        clusters: [],
        message: 'Cluster retrieval not yet implemented'
      },
      metadata: this.createResponseMetadata(performance.now())
    };
  }

  private async handleToolMetrics(request: ApiRequest): Promise<ApiResponse> {
    try {
      const status = this.toolManager.getAllToolStatus();
      const metrics = Object.fromEntries(
        Object.entries(status).map(([toolId, toolStatus]) => [
          toolId,
          toolStatus.metrics
        ])
      );
      
      return {
        id: request.id,
        status: 200,
        data: metrics,
        metadata: this.createResponseMetadata(performance.now())
      };
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        error: error.message,
        metadata: this.createResponseMetadata(performance.now())
      };
    }
  }

  private async handleCorrelationMetrics(request: ApiRequest): Promise<ApiResponse> {
    // This would retrieve correlation metrics
    // For now, return a placeholder
    return {
      id: request.id,
      status: 200,
      data: {
        totalCorrelations: 0,
        averageConfidence: 0,
        message: 'Correlation metrics retrieval not yet implemented'
      },
      metadata: this.createResponseMetadata(performance.now())
    };
  }

  private async handleGraphQL(request: ApiRequest): Promise<ApiResponse> {
    try {
      const query: GraphQLQuery = request.body;
      
      if (!query.query) {
        return {
          id: request.id,
          status: 400,
          error: 'GraphQL query is required',
          metadata: this.createResponseMetadata(performance.now())
        };
      }
      
      const result = await this.executeGraphQLQuery(query);
      
      return {
        id: request.id,
        status: 200,
        data: result,
        metadata: this.createResponseMetadata(performance.now())
      };
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        error: error.message,
        metadata: this.createResponseMetadata(performance.now())
      };
    }
  }

  /**
   * Handle WebSocket messages
   */
  private async handleWebSocketMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
    const ws = this.activeConnections.get(connectionId);
    if (!ws) return;
    
    switch (message.type) {
      case 'subscribe':
        if (message.channel) {
          this.subscribeToChannel(connectionId, message.channel);
          this.sendWebSocketMessage(ws, {
            type: 'data',
            data: { subscribed: message.channel },
            timestamp: Date.now(),
            id: this.generateMessageId()
          });
        }
        break;
        
      case 'unsubscribe':
        if (message.channel) {
          this.unsubscribeFromChannel(connectionId, message.channel);
          this.sendWebSocketMessage(ws, {
            type: 'data',
            data: { unsubscribed: message.channel },
            timestamp: Date.now(),
            id: this.generateMessageId()
          });
        }
        break;
        
      case 'ping':
        this.sendWebSocketMessage(ws, {
          type: 'pong',
          timestamp: Date.now(),
          id: this.generateMessageId()
        });
        break;
        
      default:
        this.sendWebSocketError(ws, 'Unknown message type', `Type '${message.type}' not supported`);
    }
  }

  /**
   * Execute GraphQL query (simplified implementation)
   */
  private async executeGraphQLQuery(query: GraphQLQuery): Promise<GraphQLResponse> {
    // This is a simplified GraphQL implementation
    // In production, you would use a proper GraphQL library
    
    if (query.query.includes('tools')) {
      const tools = this.toolManager.getAllToolStatus();
      return {
        data: {
          tools: Object.entries(tools).map(([id, status]) => ({
            id,
            name: status.tool.name,
            isHealthy: status.health.isHealthy,
            executionCount: status.metrics.totalExecutions
          }))
        }
      };
    }
    
    if (query.query.includes('correlations')) {
      return {
        data: {
          correlations: {
            total: 0,
            recent: []
          }
        }
      };
    }
    
    return {
      errors: [{
        message: 'Query not supported in simplified GraphQL implementation'
      }]
    };
  }

  /**
   * Start the API server
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }
    
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.port, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          this.isRunning = true;
          this.emit('server_started', { port: this.port });
          console.log(`Integration API Server running on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  /**
   * Stop the API server
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    return new Promise((resolve) => {
      // Close all WebSocket connections
      this.activeConnections.forEach(ws => ws.close());
      this.activeConnections.clear();
      
      // Close HTTP server
      this.httpServer.close(() => {
        this.isRunning = false;
        this.emit('server_stopped');
        resolve();
      });
    });
  }

  // Helper methods
  private async parseHttpRequest(req: any, requestId: string): Promise<ApiRequest> {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const query = Object.fromEntries(url.searchParams.entries());
    
    let body: any;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      body = await this.parseRequestBody(req);
    }
    
    return {
      id: requestId,
      method: req.method,
      path: url.pathname,
      query,
      body,
      headers: req.headers,
      timestamp: Date.now()
    };
  }

  private async parseRequestBody(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(new Error('Invalid JSON in request body'));
        }
      });
      req.on('error', reject);
    });
  }

  private async applyMiddleware(request: ApiRequest): Promise<{ allowed: boolean; status?: number; message?: string }> {
    // Authentication check
    const endpoint = this.endpoints.get(request.path);
    if (endpoint?.authentication === 'required') {
      const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');
      if (!apiKey || !this.apiKeys.has(apiKey)) {
        return { allowed: false, status: 401, message: 'Invalid or missing API key' };
      }
      
      request.authentication = this.apiKeys.get(apiKey);
    }
    
    // Rate limiting
    if (request.authentication) {
      const rateLimitResult = this.checkRateLimit(request.authentication.apiKey, endpoint?.rateLimit || 60);
      if (!rateLimitResult.allowed) {
        return { allowed: false, status: 429, message: 'Rate limit exceeded' };
      }
    }
    
    return { allowed: true };
  }

  private checkRateLimit(apiKey: string, limit: number): { allowed: boolean; info: RateLimitInfo } {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // Start of current minute
    const key = `${apiKey}_${windowStart}`;
    
    let rateLimitInfo = this.rateLimits.get(key);
    if (!rateLimitInfo) {
      rateLimitInfo = {
        limit,
        remaining: limit - 1,
        resetTime: windowStart + 60000,
        windowStart
      };
    } else {
      rateLimitInfo.remaining = Math.max(0, rateLimitInfo.remaining - 1);
    }
    
    this.rateLimits.set(key, rateLimitInfo);
    
    return {
      allowed: rateLimitInfo.remaining >= 0,
      info: rateLimitInfo
    };
  }

  private sendHttpResponse(res: any, response: ApiResponse): void {
    res.writeHead(response.status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
    });
    res.end(JSON.stringify(response, null, 2));
  }

  private sendWebSocketMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendWebSocketError(ws: WebSocket, error: string, details?: string): void {
    this.sendWebSocketMessage(ws, {
      type: 'error',
      data: { error, details },
      timestamp: Date.now(),
      id: this.generateMessageId()
    });
  }

  private subscribeToChannel(connectionId: string, channel: string): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(connectionId);
  }

  private unsubscribeFromChannel(connectionId: string, channel: string): void {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  private broadcastToChannel(channel: string, data: any): void {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      const message: WebSocketMessage = {
        type: 'data',
        channel,
        data,
        timestamp: Date.now(),
        id: this.generateMessageId()
      };
      
      subscribers.forEach(connectionId => {
        const ws = this.activeConnections.get(connectionId);
        if (ws) {
          this.sendWebSocketMessage(ws, message);
        }
      });
    }
  }

  private cleanupConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId);
    
    // Remove from all subscriptions
    this.subscriptions.forEach((subscribers, channel) => {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    });
  }

  private createResponseMetadata(startTime: number, request?: ApiRequest): any {
    const metadata: any = {
      executionTime: performance.now() - startTime,
      timestamp: Date.now(),
      version: this.version
    };
    
    if (request?.authentication) {
      const rateLimitKey = `${request.authentication.apiKey}_${Math.floor(Date.now() / 60000) * 60000}`;
      const rateLimitInfo = this.rateLimits.get(rateLimitKey);
      if (rateLimitInfo) {
        metadata.rateLimit = rateLimitInfo;
      }
    }
    
    return metadata;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }
}

export {
  IntegrationApiServer,
  ApiRequest,
  ApiResponse,
  WebSocketMessage,
  GraphQLQuery,
  GraphQLResponse,
  EndpointConfig,
  AuthenticationContext,
  RateLimitInfo
};
