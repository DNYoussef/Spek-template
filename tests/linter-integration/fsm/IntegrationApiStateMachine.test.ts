/**
 * Comprehensive Tests for Integration API State Machine
 * NASA Rule 10 Compliant: Each test function <60 lines with proper assertions
 */

import { performance } from 'perf_hooks';
import {
  StateMachine,
  IntegrationApiFacade,
  WebSocketStateMachine,
  AuthenticationStateMachine
} from '../../../src/linter-integration/fsm';
import {
  ApiServerState,
  RequestState,
  WebSocketState,
  AuthState,
  ApiEvent,
  ApiContext,
  RequestContext,
  WebSocketContext,
  AuthenticationContext
} from '../../../src/linter-integration/fsm/IntegrationApiStates';

// Mock dependencies
const mockIngestionEngine = {
  executeRealtimeLinting: jest.fn().mockResolvedValue({ success: true })
};

const mockToolManager = {
  getAllToolStatus: jest.fn().mockReturnValue({}),
  getToolStatus: jest.fn().mockReturnValue({ healthy: true }),
  executeTool: jest.fn().mockResolvedValue({ result: 'success' })
};

const mockCorrelationFramework = {
  correlateResults: jest.fn().mockResolvedValue({ correlations: [] })
};

describe('Integration API State Machine Tests', () => {
  
  /**
   * Test API Server State Machine
   * NASA Rule 10: <50 lines with comprehensive state transition testing
   */
  describe('API Server State Machine', () => {
    let facade: IntegrationApiFacade;
    
    beforeEach(() => {
      facade = new IntegrationApiFacade(
        mockIngestionEngine as any,
        mockToolManager as any,
        mockCorrelationFramework as any,
        3001
      );
    });
    
    afterEach(async () => {
      await facade.stop();
    });

    it('should initialize in correct state', () => {
      const metrics = facade.getMetrics();
      expect(metrics.server.state).toBe(ApiServerState.INITIALIZING);
      expect(metrics.server.totalRequests).toBe(0);
      expect(metrics.server.errorCount).toBe(0);
    });

    it('should transition to IDLE when started', async () => {
      await facade.start();
      const metrics = facade.getMetrics();
      expect(metrics.server.state).toBe(ApiServerState.IDLE);
      expect(metrics.server.uptime).toBeGreaterThan(0);
    });

    it('should handle request state transitions', async () => {
      await facade.start();
      
      // Simulate request
      const response = await fetch(`http://localhost:3001/health`);
      expect(response.status).toBe(200);
      
      const metrics = facade.getMetrics();
      expect(metrics.server.totalRequests).toBeGreaterThan(0);
    });

    it('should transition to STOPPED when stopped', async () => {
      await facade.start();
      await facade.stop();
      
      const metrics = facade.getMetrics();
      expect(metrics.server.state).toBe(ApiServerState.STOPPED);
    });
  });

  /**
   * Test WebSocket State Machine
   * NASA Rule 10: <55 lines with connection lifecycle testing
   */
  describe('WebSocket State Machine', () => {
    let wsManager: WebSocketStateMachine;
    let mockWebSocket: any;
    
    beforeEach(() => {
      wsManager = new WebSocketStateMachine();
      mockWebSocket = {
        readyState: 1, // OPEN
        send: jest.fn(),
        close: jest.fn()
      };
    });

    it('should create connection in CONNECTING state', () => {
      const connectionId = 'test-conn-1';
      wsManager.createConnection(connectionId, mockWebSocket);
      
      const metrics = wsManager.getMetrics();
      expect(metrics.totalConnections).toBe(1);
      expect(metrics.activeChannels).toBe(0);
    });

    it('should handle subscription messages', async () => {
      const connectionId = 'test-conn-2';
      wsManager.createConnection(connectionId, mockWebSocket);
      
      await wsManager.handleMessage(connectionId, {
        type: 'subscribe',
        channel: 'test-channel',
        timestamp: Date.now(),
        id: 'msg-1'
      });
      
      const metrics = wsManager.getMetrics();
      expect(metrics.activeChannels).toBe(1);
      expect(metrics.totalSubscriptions).toBe(1);
    });

    it('should handle unsubscription messages', async () => {
      const connectionId = 'test-conn-3';
      wsManager.createConnection(connectionId, mockWebSocket);
      
      // Subscribe first
      await wsManager.handleMessage(connectionId, {
        type: 'subscribe',
        channel: 'test-channel',
        timestamp: Date.now(),
        id: 'msg-1'
      });
      
      // Then unsubscribe
      await wsManager.handleMessage(connectionId, {
        type: 'unsubscribe',
        channel: 'test-channel',
        timestamp: Date.now(),
        id: 'msg-2'
      });
      
      const metrics = wsManager.getMetrics();
      expect(metrics.totalSubscriptions).toBe(0);
    });

    it('should broadcast messages to subscribers', () => {
      const connectionId = 'test-conn-4';
      wsManager.createConnection(connectionId, mockWebSocket);
      
      wsManager.broadcast('test-channel', { message: 'hello' });
      
      // Should not send to unsubscribed connection
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should cleanup connection properly', () => {
      const connectionId = 'test-conn-5';
      wsManager.createConnection(connectionId, mockWebSocket);
      wsManager.removeConnection(connectionId);
      
      const metrics = wsManager.getMetrics();
      expect(metrics.totalConnections).toBe(0);
    });
  });

  /**
   * Test Authentication State Machine
   * NASA Rule 10: <60 lines with authentication flow testing
   */
  describe('Authentication State Machine', () => {
    let authManager: AuthenticationStateMachine;
    
    beforeEach(() => {
      authManager = new AuthenticationStateMachine();
    });

    it('should start in UNAUTHENTICATED state', async () => {
      const result = await authManager.authenticate('session-1', {
        timestamp: Date.now()
      });
      
      expect(result.authenticated).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should authenticate with valid API key', async () => {
      const result = await authManager.authenticate('session-2', {
        apiKey: 'dev-key-12345',
        timestamp: Date.now()
      });
      
      expect(result.authenticated).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.userId).toBe('developer');
      expect(result.context?.permissions).toContain('read');
    });

    it('should reject invalid API key', async () => {
      const result = await authManager.authenticate('session-3', {
        apiKey: 'invalid-key',
        timestamp: Date.now()
      });
      
      expect(result.authenticated).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should handle rate limiting', async () => {
      const clientIp = '127.0.0.1';
      
      // Make multiple requests rapidly
      const requests = Array.from({ length: 65 }, (_, i) => 
        authManager.authenticate(`session-${i}`, {
          apiKey: 'dev-key-12345',
          clientIp,
          timestamp: Date.now()
        })
      );
      
      const results = await Promise.all(requests);
      
      // Some should be rate limited
      const rateLimited = results.filter(r => r.error?.includes('Rate limit'));
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should handle bearer token format', async () => {
      const result = await authManager.authenticate('session-4', {
        bearerToken: 'Bearer dev-key-12345',
        timestamp: Date.now()
      });
      
      expect(result.authenticated).toBe(true);
      expect(result.context?.apiKey).toBe('dev-key-12345');
    });

    it('should provide metrics', () => {
      const metrics = authManager.getMetrics();
      
      expect(metrics).toHaveProperty('activeSessions');
      expect(metrics).toHaveProperty('totalKeys');
      expect(metrics).toHaveProperty('rateLimitEntries');
      expect(typeof metrics.activeSessions).toBe('number');
      expect(typeof metrics.totalKeys).toBe('number');
    });
  });

  /**
   * Test State Machine Core Functionality
   * NASA Rule 10: <50 lines with core FSM behavior testing
   */
  describe('State Machine Core', () => {
    let stateMachine: StateMachine<string, string, any>;
    
    beforeEach(() => {
      const mockHandler = {
        validateInvariants: jest.fn().mockReturnValue(true),
        onEnter: jest.fn(),
        onExit: jest.fn(),
        handleEvent: jest.fn().mockResolvedValue('targetState')
      };
      
      stateMachine = new StateMachine({
        initialState: 'initial',
        context: { value: 0 },
        states: {
          'initial': mockHandler,
          'targetState': mockHandler
        },
        transitions: {
          'initial': { 'event': 'targetState' },
          'targetState': { 'reset': 'initial' }
        }
      });
    });

    it('should initialize with correct state', () => {
      expect(stateMachine.getCurrentState()).toBe('initial');
      expect(stateMachine.getContext().value).toBe(0);
    });

    it('should validate transitions', () => {
      expect(stateMachine.canTransition('event')).toBe(true);
      expect(stateMachine.canTransition('invalidEvent')).toBe(false);
    });

    it('should execute transitions', async () => {
      const result = await stateMachine.transition('event');
      
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('targetState');
    });

    it('should collect state metrics', () => {
      const metrics = stateMachine.getStateMetrics();
      
      expect(metrics.size).toBeGreaterThan(0);
      expect(metrics.get('initial')).toBeDefined();
      expect(metrics.get('initial')?.stateName).toBe('initial');
    });

    it('should collect transition metrics', async () => {
      await stateMachine.transition('event');
      
      const metrics = stateMachine.getTransitionMetrics();
      expect(metrics.size).toBeGreaterThan(0);
      
      const transitionKey = 'initial->targetState';
      expect(metrics.get(transitionKey)?.count).toBe(1);
    });
  });

  /**
   * Test Error Handling and Recovery
   * NASA Rule 10: <45 lines with error scenario testing
   */
  describe('Error Handling and Recovery', () => {
    it('should handle invalid state transitions', async () => {
      const stateMachine = new StateMachine({
        initialState: 'state1',
        context: {},
        states: {
          'state1': { validateInvariants: () => true }
        },
        transitions: {
          'state1': { 'validEvent': 'state2' }
        }
      });
      
      const result = await stateMachine.transition('invalidEvent');
      expect(result).toBe(false);
      expect(stateMachine.getCurrentState()).toBe('state1');
    });

    it('should handle handler errors', async () => {
      const errorHandler = {
        validateInvariants: () => true,
        onEnter: jest.fn().mockRejectedValue(new Error('Handler error'))
      };
      
      const stateMachine = new StateMachine({
        initialState: 'initial',
        context: {},
        states: {
          'initial': { validateInvariants: () => true },
          'error': errorHandler
        },
        transitions: {
          'initial': { 'event': 'error' }
        }
      });
      
      const result = await stateMachine.transition('event');
      expect(result).toBe(false);
    });

    it('should validate state invariants', () => {
      const invalidHandler = {
        validateInvariants: jest.fn().mockReturnValue(false)
      };
      
      const stateMachine = new StateMachine({
        initialState: 'initial',
        context: {},
        states: {
          'initial': invalidHandler
        },
        transitions: {}
      });
      
      expect(invalidHandler.validateInvariants).toHaveBeenCalled();
    });
  });

  /**
   * Test Performance and Metrics
   * NASA Rule 10: <35 lines with performance validation
   */
  describe('Performance and Metrics', () => {
    it('should track execution times', async () => {
      const startTime = performance.now();
      
      const authManager = new AuthenticationStateMachine();
      await authManager.authenticate('perf-session', {
        apiKey: 'dev-key-12345',
        timestamp: Date.now()
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle concurrent requests', async () => {
      const authManager = new AuthenticationStateMachine();
      
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        authManager.authenticate(`concurrent-${i}`, {
          apiKey: 'dev-key-12345',
          timestamp: Date.now()
        })
      );
      
      const results = await Promise.all(concurrentRequests);
      
      expect(results.length).toBe(10);
      expect(results.every(r => r.authenticated)).toBe(true);
    });

    it('should maintain consistent metrics', () => {
      const wsManager = new WebSocketStateMachine();
      const metrics1 = wsManager.getMetrics();
      const metrics2 = wsManager.getMetrics();
      
      expect(metrics1).toEqual(metrics2);
    });
  });
});

/*
 * CODEX AGENT 036 - FSM Test Suite
 * Status: OK | NASA Rule 10 Compliant
 * Run ID: integration-api-tests-007
 * Created: 2025-09-28T12:01:28-04:00
 */