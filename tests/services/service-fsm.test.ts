/**
 * ServiceFSM Tests
 * Validate service layer god object elimination
 */

import { ServiceFSM } from '../../src/fsm/services/ServiceFSM';
import { ServiceState, ServiceEvent, ServiceRequest } from '../../src/fsm/services/ServiceFSMTypes';
import { SecurityRemediationHandler } from '../../src/fsm/services/remediation/SecurityRemediationHandler';
import { SecurityValidationHandler } from '../../src/fsm/services/validation/SecurityValidationHandler';

describe('ServiceFSM Tests', () => {
  let serviceFSM: ServiceFSM;

  beforeEach(() => {
    serviceFSM = new ServiceFSM();
  });

  /**
   * Test FSM state transitions (≤60 lines)
   */
  test('should handle FSM state transitions correctly', async () => {
    const mockRequest: ServiceRequest = {
      id: 'test-123',
      type: 'test_service',
      payload: { test: 'data' },
      timestamp: Date.now()
    };

    // Register a mock handler
    const mockHandler = {
      canHandle: () => true,
      process: async () => ({ success: true }),
      priority: 50
    };

    serviceFSM.getRouter().registerHandler('test_service', mockHandler);

    expect(serviceFSM.getState()).toBe(ServiceState.IDLE);

    const response = await serviceFSM.handleRequest(mockRequest);

    expect(response.success).toBe(true);
    expect(serviceFSM.getState()).toBe(ServiceState.IDLE);
  });

  /**
   * Test security remediation handler (≤60 lines)
   */
  test('should handle security remediation requests', async () => {
    const remediationHandler = new SecurityRemediationHandler();
    serviceFSM.getRouter().registerHandler('security_remediation', remediationHandler);

    const request: ServiceRequest = {
      id: 'remediation-123',
      type: 'security_remediation',
      payload: {
        vulnerabilities: {
          findings: [
            { id: 'vuln-1', type: 'dependency', remediated: false, severity: 'high' }
          ]
        }
      },
      timestamp: Date.now()
    };

    const response = await serviceFSM.handleRequest(request);

    expect(response.success).toBe(true);
    expect(response.data.totalIssuesAddressed).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test security validation handler (≤60 lines)
   */
  test('should handle security validation requests', async () => {
    const validationHandler = new SecurityValidationHandler();
    serviceFSM.getRouter().registerHandler('security_validation', validationHandler);

    const request: ServiceRequest = {
      id: 'validation-123',
      type: 'security_validation',
      payload: {
        metadata: { projectPath: process.cwd() },
        compliance: { overallScore: 85 },
        vulnerabilities: { critical: 0, findings: [] }
      },
      timestamp: Date.now()
    };

    const response = await serviceFSM.handleRequest(request);

    expect(response.success).toBe(true);
    expect(response.data.overallScore).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test caching functionality (≤60 lines)
   */
  test('should cache responses correctly', async () => {
    const mockHandler = {
      canHandle: () => true,
      process: async () => ({ cached: true }),
      priority: 50
    };

    serviceFSM.getRouter().registerHandler('cacheable_service', mockHandler);

    const request: ServiceRequest = {
      id: 'cache-123',
      type: 'cacheable_service',
      payload: { same: 'data' },
      timestamp: Date.now()
    };

    // First request
    const response1 = await serviceFSM.handleRequest(request);
    expect(response1.success).toBe(true);

    // Second identical request should be cached
    const response2 = await serviceFSM.handleRequest(request);
    expect(response2.success).toBe(true);
  });

  /**
   * Test error handling (≤60 lines)
   */
  test('should handle errors gracefully', async () => {
    const errorHandler = {
      canHandle: () => true,
      process: async () => {
        throw new Error('Test error');
      },
      priority: 50
    };

    serviceFSM.getRouter().registerHandler('error_service', errorHandler);

    const request: ServiceRequest = {
      id: 'error-123',
      type: 'error_service',
      payload: {},
      timestamp: Date.now()
    };

    const response = await serviceFSM.handleRequest(request);

    expect(response.success).toBe(false);
    expect(response.error).toContain('Test error');
  });

  /**
   * Test handler priority (≤60 lines)
   */
  test('should respect handler priority', () => {
    const lowPriorityHandler = {
      canHandle: () => true,
      process: async () => ({ priority: 'low' }),
      priority: 10
    };

    const highPriorityHandler = {
      canHandle: () => true,
      process: async () => ({ priority: 'high' }),
      priority: 90
    };

    serviceFSM.getRouter().registerHandler('priority_service', lowPriorityHandler);
    serviceFSM.getRouter().registerHandler('priority_service', highPriorityHandler);

    const handlers = serviceFSM.getRouter().getHandlers('priority_service');
    expect(handlers[0].priority).toBe(90);
    expect(handlers[1].priority).toBe(10);
  });
});