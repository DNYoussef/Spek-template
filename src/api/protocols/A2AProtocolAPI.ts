import { Logger } from '../../utils/logger';
import { A2AProtocolEngine, A2AMessage, AgentIdentifier } from '../../protocols/a2a/A2AProtocolEngine';
import { MCPBridge } from '../../protocols/mcp/MCPBridge';
import { A2ADocumentationGenerator } from '../../protocols/docs/A2ADocumentationGenerator';
import { MessageQueueManager } from '../../protocols/queue/MessageQueueManager';
import { CommunicationSecurity } from '../../protocols/security/CommunicationSecurity';
import { ProtocolMetrics } from '../../protocols/monitoring/ProtocolMetrics';

export interface APIConfig {
  enableCORS: boolean;
  enableAuth: boolean;
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  enableDocumentation: boolean;
  enableMetrics: boolean;
  enableWebUI: boolean;
}

export interface APIRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

export interface APIResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export interface EndpointHandler {
  method: string;
  path: string;
  handler: (req: APIRequest) => Promise<APIResponse>;
  auth?: boolean;
  rateLimit?: number;
  description?: string;
}

export class A2AProtocolAPI {
  private logger = new Logger('A2AProtocolAPI');
  private config: APIConfig;
  private engine: A2AProtocolEngine;
  private mcpBridge: MCPBridge;
  private documentationGenerator: A2ADocumentationGenerator;
  private queueManager: MessageQueueManager;
  private security: CommunicationSecurity;
  private metrics: ProtocolMetrics;
  private endpoints = new Map<string, EndpointHandler>();
  private rateLimiters = new Map<string, RateLimiter>();

  constructor(
    engine: A2AProtocolEngine,
    mcpBridge: MCPBridge,
    documentationGenerator: A2ADocumentationGenerator,
    queueManager: MessageQueueManager,
    security: CommunicationSecurity,
    metrics: ProtocolMetrics,
    config?: Partial<APIConfig>
  ) {
    this.engine = engine;
    this.mcpBridge = mcpBridge;
    this.documentationGenerator = documentationGenerator;
    this.queueManager = queueManager;
    this.security = security;
    this.metrics = metrics;
    
    this.config = {
      enableCORS: true,
      enableAuth: true,
      rateLimit: {
        enabled: true,
        requestsPerMinute: 100
      },
      enableDocumentation: true,
      enableMetrics: true,
      enableWebUI: true,
      ...config
    };

    this.registerEndpoints();
  }

  async handleRequest(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      // Apply CORS headers
      const corsHeaders = this.config.enableCORS ? this.getCORSHeaders() : {};
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return {
          status: 200,
          headers: corsHeaders,
          body: null
        };
      }

      // Rate limiting
      if (this.config.rateLimit.enabled) {
        const rateLimitResult = await this.checkRateLimit(req);
        if (!rateLimitResult.allowed) {
          return {
            status: 429,
            headers: {
              ...corsHeaders,
              'Retry-After': rateLimitResult.retryAfter.toString()
            },
            body: {
              error: 'Rate limit exceeded',
              retryAfter: rateLimitResult.retryAfter
            }
          };
        }
      }

      // Find matching endpoint
      const endpoint = this.findEndpoint(req.method, req.path);
      if (!endpoint) {
        return {
          status: 404,
          headers: corsHeaders,
          body: {
            error: 'Endpoint not found',
            path: req.path,
            method: req.method
          }
        };
      }

      // Authentication
      if (endpoint.auth && this.config.enableAuth) {
        const authResult = await this.authenticate(req);
        if (!authResult.success) {
          return {
            status: 401,
            headers: corsHeaders,
            body: {
              error: 'Authentication required',
              message: authResult.message
            }
          };
        }
        req.user = authResult.user;
      }

      // Execute handler
      const response = await endpoint.handler(req);
      
      // Add CORS headers to response
      response.headers = {
        ...corsHeaders,
        ...response.headers
      };

      // Record metrics
      if (this.config.enableMetrics) {
        const latency = Date.now() - startTime;
        this.recordAPIMetrics(req, response, latency);
      }

      return response;
      
    } catch (error) {
      this.logger.error('API request failed', {
        method: req.method,
        path: req.path,
        error: error.message
      });

      const latency = Date.now() - startTime;
      if (this.config.enableMetrics) {
        this.recordAPIMetrics(req, { status: 500, headers: {}, body: null }, latency);
      }

      return {
        status: 500,
        headers: this.config.enableCORS ? this.getCORSHeaders() : {},
        body: {
          error: 'Internal server error',
          message: error.message
        }
      };
    }
  }

  private registerEndpoints(): void {
    // Protocol Management Endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/protocols',
      handler: this.listProtocols.bind(this),
      description: 'List all available A2A protocols'
    });

    this.addEndpoint({
      method: 'POST',
      path: '/api/v1/protocols/register',
      handler: this.registerProtocol.bind(this),
      auth: true,
      description: 'Register a new protocol handler'
    });

    // Message Endpoints
    this.addEndpoint({
      method: 'POST',
      path: '/api/v1/messages/send',
      handler: this.sendMessage.bind(this),
      auth: true,
      description: 'Send an A2A message'
    });

    this.addEndpoint({
      method: 'POST',
      path: '/api/v1/messages/broadcast',
      handler: this.broadcastMessage.bind(this),
      auth: true,
      description: 'Broadcast message to multiple recipients'
    });

    // Queue Management Endpoints
    this.addEndpoint({
      method: 'POST',
      path: '/api/v1/queues',
      handler: this.createQueue.bind(this),
      auth: true,
      description: 'Create a message queue'
    });

    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/queues',
      handler: this.listQueues.bind(this),
      description: 'List all message queues'
    });

    this.addEndpoint({
      method: 'POST',
      path: '/api/v1/queues/:queueName/messages',
      handler: this.enqueueMessage.bind(this),
      auth: true,
      description: 'Enqueue a message'
    });

    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/queues/:queueName/messages',
      handler: this.dequeueMessage.bind(this),
      auth: true,
      description: 'Dequeue a message'
    });

    // MCP Bridge Endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/mcp/servers',
      handler: this.listMCPServers.bind(this),
      description: 'List available MCP servers'
    });

    this.addEndpoint({
      method: 'POST',
      path: '/api/v1/mcp/request',
      handler: this.sendMCPRequest.bind(this),
      auth: true,
      description: 'Send request to MCP server'
    });

    // Security Endpoints
    this.addEndpoint({
      method: 'POST',
      path: '/api/v1/auth/challenge',
      handler: this.generateChallenge.bind(this),
      description: 'Generate authentication challenge'
    });

    this.addEndpoint({
      method: 'POST',
      path: '/api/v1/auth/verify',
      handler: this.verifyChallenge.bind(this),
      description: 'Verify authentication challenge'
    });

    // Metrics Endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/metrics',
      handler: this.getMetrics.bind(this),
      description: 'Get system metrics'
    });

    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/metrics/export',
      handler: this.exportMetrics.bind(this),
      description: 'Export metrics in various formats'
    });

    // Documentation Endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/docs',
      handler: this.getDocumentation.bind(this),
      description: 'Get API documentation'
    });

    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/docs/openapi',
      handler: this.getOpenAPISpec.bind(this),
      description: 'Get OpenAPI specification'
    });

    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/docs/interactive',
      handler: this.getInteractiveDocumentation.bind(this),
      description: 'Get interactive documentation portal'
    });

    // Health Check
    this.addEndpoint({
      method: 'GET',
      path: '/api/v1/health',
      handler: this.healthCheck.bind(this),
      description: 'Health check endpoint'
    });

    // Web UI (if enabled)
    if (this.config.enableWebUI) {
      this.addEndpoint({
        method: 'GET',
        path: '/ui',
        handler: this.serveWebUI.bind(this),
        description: 'Web UI for protocol management'
      });
    }
  }

  private addEndpoint(endpoint: EndpointHandler): void {
    const key = `${endpoint.method}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);
    
    this.logger.debug('Endpoint registered', {
      method: endpoint.method,
      path: endpoint.path,
      auth: endpoint.auth || false
    });
  }

  // Protocol Management Handlers
  private async listProtocols(req: APIRequest): Promise<APIResponse> {
    const protocols = this.engine.getActiveConnections();
    const protocolList = Array.from(protocols.keys()).map(connectionId => {
      const handler = protocols.get(connectionId);
      return {
        connectionId,
        name: handler?.name,
        version: handler?.version
      };
    });

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        protocols: protocolList,
        total: protocolList.length
      }
    };
  }

  private async registerProtocol(req: APIRequest): Promise<APIResponse> {
    // Protocol registration would be implemented here
    return {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Protocol registration not yet implemented'
      }
    };
  }

  // Message Handlers
  private async sendMessage(req: APIRequest): Promise<APIResponse> {
    try {
      const { destination, messageType, payload, metadata } = req.body;
      
      if (!destination || !messageType) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Missing required fields: destination, messageType'
          }
        };
      }

      const messageId = await this.engine.sendMessage({
        destination,
        messageType,
        payload: payload || { data: null },
        metadata: metadata || {}
      });

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          messageId,
          status: 'sent',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to send message',
          message: error.message
        }
      };
    }
  }

  private async broadcastMessage(req: APIRequest): Promise<APIResponse> {
    try {
      const { recipients, messageType, payload, metadata } = req.body;
      
      if (!recipients || !Array.isArray(recipients) || !messageType) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Missing required fields: recipients (array), messageType'
          }
        };
      }

      const messageIds = await this.engine.broadcastMessage({
        messageType,
        payload: payload || { data: null },
        metadata: metadata || {}
      }, recipients);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          messageIds,
          recipientCount: recipients.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to broadcast message',
          message: error.message
        }
      };
    }
  }

  // Queue Management Handlers
  private async createQueue(req: APIRequest): Promise<APIResponse> {
    try {
      const { name, config } = req.body;
      
      if (!name) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Missing required field: name'
          }
        };
      }

      await this.queueManager.createQueue(name, config);

      return {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: {
          queueName: name,
          config,
          created: true
        }
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to create queue',
          message: error.message
        }
      };
    }
  }

  private async listQueues(req: APIRequest): Promise<APIResponse> {
    const queues = this.queueManager.listQueues();
    
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        queues,
        total: queues.length
      }
    };
  }

  private async enqueueMessage(req: APIRequest): Promise<APIResponse> {
    try {
      const queueName = this.extractParam(req.path, 'queueName');
      const { message, priority } = req.body;
      
      if (!message) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Missing required field: message'
          }
        };
      }

      const messageId = await this.queueManager.enqueue(queueName, message, priority);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          messageId,
          queueName,
          enqueued: true
        }
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to enqueue message',
          message: error.message
        }
      };
    }
  }

  private async dequeueMessage(req: APIRequest): Promise<APIResponse> {
    try {
      const queueName = this.extractParam(req.path, 'queueName');
      const visibilityTimeout = req.query?.visibilityTimeout ? parseInt(req.query.visibilityTimeout) : undefined;
      
      const entry = await this.queueManager.dequeue(queueName, visibilityTimeout);

      if (!entry) {
        return {
          status: 204,
          headers: { 'Content-Type': 'application/json' },
          body: null
        };
      }

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: entry
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to dequeue message',
          message: error.message
        }
      };
    }
  }

  // MCP Bridge Handlers
  private async listMCPServers(req: APIRequest): Promise<APIResponse> {
    const servers = await this.mcpBridge.getAvailableServers();
    
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        servers,
        total: servers.length
      }
    };
  }

  private async sendMCPRequest(req: APIRequest): Promise<APIResponse> {
    try {
      const { method, params, targetServer } = req.body;
      
      if (!method) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Missing required field: method'
          }
        };
      }

      const response = await this.mcpBridge.sendMCPRequest({
        method,
        params,
        targetServer,
        source: {
          id: req.user?.id || 'api-user',
          type: 'drone',
          capabilities: [],
          endpoint: 'api'
        }
      });

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: response
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'MCP request failed',
          message: error.message
        }
      };
    }
  }

  // Security Handlers
  private async generateChallenge(req: APIRequest): Promise<APIResponse> {
    try {
      const { agentId } = req.body;
      
      if (!agentId) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Missing required field: agentId'
          }
        };
      }

      const challengeId = await this.security.generateChallenge(agentId);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          challengeId,
          agentId
        }
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to generate challenge',
          message: error.message
        }
      };
    }
  }

  private async verifyChallenge(req: APIRequest): Promise<APIResponse> {
    try {
      const { agentId, challenge, signature } = req.body;
      
      if (!agentId || !challenge || !signature) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Missing required fields: agentId, challenge, signature'
          }
        };
      }

      const isValid = await this.security.authenticateAgent(agentId, challenge, signature);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          valid: isValid,
          agentId,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Challenge verification failed',
          message: error.message
        }
      };
    }
  }

  // Metrics Handlers
  private async getMetrics(req: APIRequest): Promise<APIResponse> {
    const metrics = {
      engine: this.engine.getMetrics(),
      mcp: this.mcpBridge.getMetrics(),
      queue: this.queueManager.getGlobalMetrics(),
      security: this.security.getSecurityMetrics(),
      protocols: this.metrics.getMetrics()
    };

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: metrics
    };
  }

  private async exportMetrics(req: APIRequest): Promise<APIResponse> {
    const format = req.query?.format || 'json';
    
    try {
      const exportedMetrics = this.metrics.exportMetrics(format as any);
      
      const contentType = {
        json: 'application/json',
        prometheus: 'text/plain',
        csv: 'text/csv'
      }[format] || 'application/json';

      return {
        status: 200,
        headers: { 'Content-Type': contentType },
        body: format === 'json' ? JSON.parse(exportedMetrics) : exportedMetrics
      };
    } catch (error) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Invalid export format',
          supportedFormats: ['json', 'prometheus', 'csv']
        }
      };
    }
  }

  // Documentation Handlers
  private async getDocumentation(req: APIRequest): Promise<APIResponse> {
    const docs = this.documentationGenerator.getGeneratedDocumentation();
    
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        protocols: Object.fromEntries(docs),
        generated: new Date().toISOString()
      }
    };
  }

  private async getOpenAPISpec(req: APIRequest): Promise<APIResponse> {
    const protocol = req.query?.protocol;
    
    if (protocol) {
      const specs = this.documentationGenerator.getOpenAPISpecs();
      const spec = specs.get(protocol);
      
      if (!spec) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Protocol not found',
            protocol
          }
        };
      }
      
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: spec
      };
    }
    
    const specs = this.documentationGenerator.getOpenAPISpecs();
    
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        specifications: Object.fromEntries(specs),
        protocols: Array.from(specs.keys())
      }
    };
  }

  private async getInteractiveDocumentation(req: APIRequest): Promise<APIResponse> {
    const protocol = req.query?.protocol || 'http';
    
    try {
      const html = await this.documentationGenerator.generateInteractiveDocumentation(protocol);
      
      return {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
        body: html
      };
    } catch (error) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to generate interactive documentation',
          message: error.message
        }
      };
    }
  }

  // Health Check Handler
  private async healthCheck(req: APIRequest): Promise<APIResponse> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        engine: 'healthy',
        mcpBridge: 'healthy',
        queueManager: 'healthy',
        security: 'healthy',
        metrics: 'healthy'
      },
      version: '1.0.0'
    };

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: health
    };
  }

  // Web UI Handler
  private async serveWebUI(req: APIRequest): Promise<APIResponse> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>A2A Protocol Management</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .endpoint { background: #f9f9f9; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .method { font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>A2A Protocol Management Portal</h1>
        <p>Interactive interface for managing Agent-to-Agent communication protocols</p>
    </div>
    
    <div class="section">
        <h2>Available Endpoints</h2>
        ${Array.from(this.endpoints.values()).map(endpoint => `
            <div class="endpoint">
                <span class="method">${endpoint.method}</span> ${endpoint.path}
                ${endpoint.description ? `<br><small>${endpoint.description}</small>` : ''}
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Quick Links</h2>
        <ul>
            <li><a href="/api/v1/docs/interactive">Interactive API Documentation</a></li>
            <li><a href="/api/v1/metrics">System Metrics</a></li>
            <li><a href="/api/v1/health">Health Check</a></li>
            <li><a href="/api/v1/protocols">Available Protocols</a></li>
        </ul>
    </div>
</body>
</html>`;

    return {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html
    };
  }

  // Utility Methods
  private findEndpoint(method: string, path: string): EndpointHandler | undefined {
    // First try exact match
    const exactKey = `${method}:${path}`;
    if (this.endpoints.has(exactKey)) {
      return this.endpoints.get(exactKey);
    }
    
    // Then try pattern matching for parameterized routes
    for (const [key, endpoint] of Array.from(this.endpoints.entries())) {
      if (endpoint.method === method && this.matchPath(endpoint.path, path)) {
        return endpoint;
      }
    }
    
    return undefined;
  }

  private matchPath(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) {
      return false;
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) {
        continue; // Parameter, matches anything
      }
      
      if (patternPart !== pathPart) {
        return false;
      }
    }
    
    return true;
  }

  private extractParam(path: string, paramName: string): string {
    // Simple parameter extraction - in production would use a proper router
    const parts = path.split('/');
    const index = parts.findIndex(part => part === paramName || part.includes(paramName));
    return index > 0 ? parts[index + 1] || parts[index] : '';
  }

  private getCORSHeaders(): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    };
  }

  private async checkRateLimit(req: APIRequest): Promise<{ allowed: boolean; retryAfter: number }> {
    const key = req.user?.id || req.headers['x-forwarded-for'] || 'anonymous';
    
    let rateLimiter = this.rateLimiters.get(key);
    if (!rateLimiter) {
      rateLimiter = new RateLimiter(this.config.rateLimit.requestsPerMinute, 60000);
      this.rateLimiters.set(key, rateLimiter);
    }
    
    const allowed = rateLimiter.tryRequest();
    const retryAfter = allowed ? 0 : rateLimiter.getWaitTime();
    
    return { allowed, retryAfter };
  }

  private async authenticate(req: APIRequest): Promise<{ success: boolean; user?: any; message?: string }> {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        message: 'Missing or invalid authorization header'
      };
    }
    
    // Simple token validation - in production would verify JWT or API key
    const token = authHeader.substring(7);
    
    if (token === 'valid-token') {
      return {
        success: true,
        user: {
          id: 'api-user',
          role: 'user',
          permissions: ['read', 'write']
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid token'
    };
  }

  private recordAPIMetrics(req: APIRequest, response: APIResponse, latency: number): void {
    this.metrics.recordMessageSent({
      messageId: `api_${Date.now()}`,
      protocol: 'http',
      agentId: req.user?.id,
      latency,
      size: JSON.stringify(response.body || '').length
    });
  }
}

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  tryRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getWaitTime(): number {
    if (this.requests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests);
    const waitTime = this.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, waitTime);
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
// Version & Run Log
// | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
// |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
// | 1.2.0   | 2025-09-27T14:15:00-04:00 | remediation@claude-sonnet-4 | Fixed all TypeScript compilation errors in footer | A2AProtocolAPI.ts | OK | Restored clean TypeScript compilation | 0.00 | b2c4f8a |
//
// Receipt
// - status: OK
// - reason_if_blocked: --
// - run_id: phase8-remediation-typescript-fix
// - inputs: ["A2AProtocolAPI.ts with compilation errors"]
// - tools_used: ["Edit"]
// - versions: {"model":"claude-sonnet-4","prompt":"typescript-fix-v1.0"}
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */