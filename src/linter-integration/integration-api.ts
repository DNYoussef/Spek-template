/**
 * Integration API Specification - REFACTORED
 * NASA Rule 10 Compliant: Delegates to FSM-based implementation
 *
 * This file now serves as a compatibility facade for the original interface
 * while internally using the new FSM-based architecture for better maintainability.
 */

import { EventEmitter } from 'events';
import { createServer, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { performance } from 'perf_hooks';
import { createHash, randomBytes } from 'crypto';

// Import types from integration system (unchanged)
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

// Import new FSM-based implementation
import { IntegrationApiFacade, createIntegrationApi } from './fsm';

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
 * Integration API Server - REFACTORED
 * NASA Rule 10 Compliant: Facade pattern delegating to FSM implementation
 *
 * This maintains the original public interface while using the new
 * FSM-based architecture internally for better maintainability.
 */
export class IntegrationApiServer extends EventEmitter {
  private readonly fsmFacade: IntegrationApiFacade;
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

    // Delegate to FSM-based implementation
    this.fsmFacade = createIntegrationApi(
      ingestionEngine,
      toolManager,
      correlationFramework,
      port
    );

    // Forward events from FSM facade
    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding from FSM facade
   * NASA Rule 10: <20 lines, simple event delegation
   */
  private setupEventForwarding(): void {
    // Forward all events from FSM facade to maintain compatibility
    this.fsmFacade.on('server_started', (data: unknown) => this.emit('server_started', data));
    this.fsmFacade.on('server_stopped', () => this.emit('server_stopped'));
    this.fsmFacade.on('request_processed', (data: unknown) => this.emit('api_request', data));
    this.fsmFacade.on('request_error', (data: unknown) => this.emit('api_error', data));
  }

  // HTTP handlers are now managed by FSM facade - no implementation needed here

  // WebSocket handlers are now managed by FSM facade - no implementation needed here

  // Authentication is now managed by FSM facade - no implementation needed here

  // Rate limiting is now managed by FSM facade - no implementation needed here

  // All endpoint handlers are now implemented in the FSM facade

  /**
   * Start the API server
   * NASA Rule 10: <15 lines, delegates to FSM facade
   */
  public async start(): Promise<void> {
    return await this.fsmFacade.start();
  }

  /**
   * Stop the API server
   * NASA Rule 10: <15 lines, delegates to FSM facade
   */
  public async stop(): Promise<void> {
    return await this.fsmFacade.stop();
  }

  /**
   * Get server metrics
   * NASA Rule 10: <15 lines, delegates to FSM facade
   */
  public getMetrics() {
    return this.fsmFacade.getMetrics();
  }

  // All helper methods are now implemented in the FSM facade
}

/**
 * Legacy IntegrationApiServer Export
 * Maintains backward compatibility while using FSM architecture
 */

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
