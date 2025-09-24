/**
 * API Contract Validation Tests
 * Real contract testing using Zod schemas for API contracts, configuration validation,
 * and inter-service communication contracts
 */

import { z } from 'zod';
const { cleanupTestResources } = require('../../setup/test-environment');

// Real API response schema
const ApiResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional(),
  metadata: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().uuid(),
    version: z.string()
  })
});

// Configuration contract schema
const ConfigurationSchema = z.object({
  budgets: z.object({
    max_loc: z.number().positive().max(10000),
    max_files: z.number().positive().max(1000)
  }),
  allowlist: z.array(z.string().regex(/^[a-zA-Z0-9_\-\/\*\.]+$/)),
  denylist: z.array(z.string().regex(/^[a-zA-Z0-9_\-\/\*\.]+$/)),
  verification: z.object({
    test_cmd: z.string().min(1),
    typecheck_cmd: z.string().min(1),
    lint_cmd: z.string().min(1),
    coverage_threshold: z.number().min(0).max(100).optional()
  })
});

// Inter-service message contract
const ServiceMessageSchema = z.object({
  type: z.enum(['request', 'response', 'event', 'error']),
  service: z.string(),
  operation: z.string(),
  payload: z.any(),
  correlationId: z.string().uuid(),
  timestamp: z.number().int().positive()
});

// Data model contract
const UserModelSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'guest']),
  permissions: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional()
});

// Error response contract
const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().regex(/^[A-Z_]+$/),
    message: z.string().min(1),
    statusCode: z.number().int().min(400).max(599),
    details: z.array(z.object({
      field: z.string(),
      issue: z.string()
    })).optional()
  }),
  metadata: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().uuid()
  })
});

describe('API Contract Validation', () => {
  afterEach(async () => {
    await cleanupTestResources();
  });

  describe('API Response Contract', () => {
    it('validates successful API response structure', () => {
      const validResponse = {
        status: 'success',
        data: { id: 1, name: 'Test' },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          version: '1.0.0'
        }
      };

      expect(() => ApiResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('validates error API response structure', () => {
      const errorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: '550e8400-e29b-41d4-a716-446655440001',
          version: '1.0.0'
        }
      };

      expect(() => ApiResponseSchema.parse(errorResponse)).not.toThrow();
    });

    it('rejects invalid status values', () => {
      const invalidResponse = {
        status: 'pending',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          version: '1.0.0'
        }
      };

      expect(() => ApiResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('requires valid UUID for requestId', () => {
      const invalidResponse = {
        status: 'success',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: 'not-a-uuid',
          version: '1.0.0'
        }
      };

      expect(() => ApiResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('Configuration Contract', () => {
    it('validates complete configuration structure', () => {
      const validConfig = {
        budgets: { max_loc: 25, max_files: 2 },
        allowlist: ['src/**', 'tests/**', 'lib/*.js'],
        denylist: ['.claude/**', 'node_modules/**', 'dist/*'],
        verification: {
          test_cmd: 'npm test',
          typecheck_cmd: 'npm run typecheck',
          lint_cmd: 'npm run lint',
          coverage_threshold: 80
        }
      };

      expect(() => ConfigurationSchema.parse(validConfig)).not.toThrow();
    });

    it('rejects negative budget values', () => {
      const invalidConfig = {
        budgets: { max_loc: -1, max_files: 2 },
        allowlist: ['src/**'],
        denylist: ['node_modules/**'],
        verification: {
          test_cmd: 'npm test',
          typecheck_cmd: 'tsc',
          lint_cmd: 'eslint .'
        }
      };

      expect(() => ConfigurationSchema.parse(invalidConfig)).toThrow();
    });

    it('rejects invalid glob patterns', () => {
      const invalidConfig = {
        budgets: { max_loc: 25, max_files: 2 },
        allowlist: ['src/**', '../../etc/passwd'], // Invalid path
        denylist: ['node_modules/**'],
        verification: {
          test_cmd: 'npm test',
          typecheck_cmd: 'tsc',
          lint_cmd: 'eslint .'
        }
      };

      expect(() => ConfigurationSchema.parse(invalidConfig)).toThrow();
    });

    it('validates coverage threshold range', () => {
      const invalidConfig = {
        budgets: { max_loc: 25, max_files: 2 },
        allowlist: ['src/**'],
        denylist: ['node_modules/**'],
        verification: {
          test_cmd: 'npm test',
          typecheck_cmd: 'tsc',
          lint_cmd: 'eslint .',
          coverage_threshold: 150 // Invalid: > 100
        }
      };

      expect(() => ConfigurationSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe('Inter-Service Communication Contract', () => {
    it('validates request message structure', () => {
      const requestMessage = {
        type: 'request',
        service: 'auth-service',
        operation: 'validateToken',
        payload: { token: 'abc123' },
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: Date.now()
      };

      expect(() => ServiceMessageSchema.parse(requestMessage)).not.toThrow();
    });

    it('validates event message structure', () => {
      const eventMessage = {
        type: 'event',
        service: 'notification-service',
        operation: 'userRegistered',
        payload: { userId: '123', email: 'user@example.com' },
        correlationId: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: Date.now()
      };

      expect(() => ServiceMessageSchema.parse(eventMessage)).not.toThrow();
    });

    it('requires valid message type', () => {
      const invalidMessage = {
        type: 'notification',
        service: 'auth-service',
        operation: 'login',
        payload: {},
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: Date.now()
      };

      expect(() => ServiceMessageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe('Data Model Contract', () => {
    it('validates complete user model', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { loginCount: 5, lastLogin: Date.now() }
      };

      expect(() => UserModelSchema.parse(validUser)).not.toThrow();
    });

    it('rejects invalid email format', () => {
      const invalidUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'not-an-email',
        role: 'user',
        permissions: ['read'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(() => UserModelSchema.parse(invalidUser)).toThrow();
    });

    it('rejects invalid role', () => {
      const invalidUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        role: 'superuser',
        permissions: ['read'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(() => UserModelSchema.parse(invalidUser)).toThrow();
    });
  });

  describe('Error Response Contract', () => {
    it('validates error response with details', () => {
      const validError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          statusCode: 400,
          details: [
            { field: 'email', issue: 'Invalid email format' },
            { field: 'age', issue: 'Must be at least 18' }
          ]
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: '550e8400-e29b-41d4-a716-446655440000'
        }
      };

      expect(() => ErrorResponseSchema.parse(validError)).not.toThrow();
    });

    it('validates error code format', () => {
      const invalidError = {
        error: {
          code: 'validation-error', // Invalid: should be UPPER_SNAKE_CASE
          message: 'Validation failed',
          statusCode: 400
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: '550e8400-e29b-41d4-a716-446655440000'
        }
      };

      expect(() => ErrorResponseSchema.parse(invalidError)).toThrow();
    });

    it('validates HTTP status code range', () => {
      const invalidError = {
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal error',
          statusCode: 600 // Invalid: > 599
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: '550e8400-e29b-41d4-a716-446655440000'
        }
      };

      expect(() => ErrorResponseSchema.parse(invalidError)).toThrow();
    });
  });
});