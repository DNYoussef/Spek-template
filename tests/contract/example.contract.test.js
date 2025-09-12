const { z } = require('zod');

// Contract tests using Zod schemas for validation
// These test API contracts, data structures, and external integrations

// Define schemas for testing
const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  isActive: z.boolean(),
  metadata: z.object({
    lastLogin: z.string().datetime().optional(),
    preferences: z.record(z.any()).optional()
  }).optional()
});

const ConfigSchema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number().int().positive(),
    name: z.string(),
    ssl: z.boolean().default(false)
  }),
  api: z.object({
    baseUrl: z.string().url(),
    timeout: z.number().positive().default(5000),
    retries: z.number().int().min(0).default(3)
  }),
  features: z.record(z.boolean()).default({})
});

const ApiResponseSchema = z.object({
  success: z.boolean(),
  status: z.number().int().min(100).max(599),
  data: z.any(),
  timestamp: z.string().datetime(),
  metadata: z.object({
    version: z.string(),
    requestId: z.string()
  })
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  status: z.number().int().min(400),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }),
  timestamp: z.string().datetime()
});

describe('User API Contract Tests', () => {
  // Mock user API function
  async function getUserById(id) {
    // Simulated API response
    return {
      id: String(id),
      email: 'user@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isActive: true,
      metadata: {
        lastLogin: new Date().toISOString(),
        preferences: { theme: 'dark', notifications: true }
      }
    };
  }

  test('getUserById returns valid user schema', async () => {
    const user = await getUserById('123');
    expect(() => UserSchema.parse(user)).not.toThrow();
    
    // Additional schema validation
    const validated = UserSchema.parse(user);
    expect(validated.id).toBe('123');
    expect(validated.email).toContain('@');
  });

  test('user schema rejects invalid data', () => {
    const invalidUsers = [
      { id: '', email: 'invalid', name: 'Test' }, // Empty ID, invalid email
      { id: '123', email: 'test@test.com' }, // Missing name
      { id: '123', email: 'test@test.com', name: '', createdAt: 'invalid-date' }, // Empty name, invalid date
      null,
      undefined,
      'not-an-object'
    ];

    invalidUsers.forEach((invalidUser, index) => {
      expect(() => UserSchema.parse(invalidUser))
        .toThrow(); // Just check that it throws, don't check specific message format
    });
  });

  test('user schema allows optional fields to be undefined', () => {
    const minimalUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isActive: true
      // metadata is optional and omitted
    };

    expect(() => UserSchema.parse(minimalUser)).not.toThrow();
  });
});

describe('Configuration Contract Tests', () => {
  // Mock config loader
  function loadConfig(configData) {
    return {
      database: {
        host: 'localhost',
        port: 5432,
        name: 'testdb',
        ssl: false,
        ...configData?.database
      },
      api: {
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        retries: 3,
        ...configData?.api
      },
      features: configData?.features || {}
    };
  }

  test('loadConfig returns valid configuration schema', () => {
    const config = loadConfig({
      database: { host: 'prod-db.com', ssl: true },
      api: { timeout: 10000 },
      features: { darkMode: true, notifications: false }
    });

    expect(() => ConfigSchema.parse(config)).not.toThrow();
    
    const validated = ConfigSchema.parse(config);
    expect(validated.database.ssl).toBe(true);
    expect(validated.api.timeout).toBe(10000);
  });

  test('configuration schema applies defaults', () => {
    const config = loadConfig({
      database: { host: 'test-db', port: 3306, name: 'app' },
      api: { baseUrl: 'https://test-api.com' }
    });

    const validated = ConfigSchema.parse(config);
    expect(validated.database.ssl).toBe(false); // Default value
    expect(validated.api.timeout).toBe(5000); // Default value
    expect(validated.api.retries).toBe(3); // Default value
    expect(validated.features).toEqual({}); // Default value
  });

  test('configuration schema rejects invalid values', () => {
    const invalidConfigs = [
      {
        database: { host: '', port: -1, name: 'test' }, // Empty host, negative port
        api: { baseUrl: 'invalid-url' } // Invalid URL
      },
      {
        database: { host: 'test', port: 'not-a-number', name: 'test' }, // Port not number
        api: { baseUrl: 'https://api.com', timeout: -1 } // Negative timeout
      }
    ];

    invalidConfigs.forEach((invalidConfig, index) => {
      const config = loadConfig(invalidConfig);
      expect(() => ConfigSchema.parse(config))
        .toThrow(); // Just check that it throws, don't check specific message format
    });
  });
});

describe('API Response Contract Tests', () => {
  // Mock API response formatter
  function formatResponse(data, status = 200, success = null) {
    return {
      success: success !== null ? success : (status >= 200 && status < 300),
      status,
      data,
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0.0',
        requestId: `req-${Date.now()}`
      }
    };
  }

  test('successful API response matches schema', () => {
    const response = formatResponse({ message: 'Success' }, 200);
    expect(() => ApiResponseSchema.parse(response)).not.toThrow();
    
    const validated = ApiResponseSchema.parse(response);
    expect(validated.success).toBe(true);
    expect(validated.status).toBe(200);
  });

  test('error API response structure', () => {
    const errorResponse = {
      success: false,
      status: 404,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: { resource: 'user', id: '123' }
      },
      timestamp: new Date().toISOString()
    };

    expect(() => ErrorResponseSchema.parse(errorResponse)).not.toThrow();
  });

  test('API response schema validates status codes', () => {
    const validStatuses = [200, 201, 400, 404, 500];
    const invalidStatuses = [99, 600, -1, 'not-a-number'];

    validStatuses.forEach(status => {
      const response = formatResponse({}, status);
      expect(() => ApiResponseSchema.parse(response)).not.toThrow();
    });

    invalidStatuses.forEach(status => {
      const response = formatResponse({}, status);
      expect(() => ApiResponseSchema.parse(response)).toThrow();
    });
  });
});

describe('SPEK-AUGMENT Integration Contract Tests', () => {
  // Schema for SPEK-AUGMENT gate results
  const GateResultSchema = z.object({
    ok: z.boolean(),
    gates: z.record(z.object({
      passed: z.boolean(),
      message: z.string(),
      details: z.any().optional()
    })),
    summary: z.object({
      total: z.number().int().min(0),
      passed: z.number().int().min(0),
      failed: z.number().int().min(0)
    }),
    timestamp: z.string().datetime()
  });

  // Schema for triage results
  const TriageResultSchema = z.object({
    size: z.enum(['small', 'multi', 'big']),
    root_causes: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    recommendations: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional()
  });

  test('gate results match expected schema', () => {
    const gateResult = {
      ok: false,
      gates: {
        tests: { passed: true, message: 'All tests passed' },
        lint: { passed: false, message: '3 linting errors found', details: ['unused-var', 'no-console'] },
        security: { passed: true, message: 'No security issues' }
      },
      summary: {
        total: 3,
        passed: 2,
        failed: 1
      },
      timestamp: new Date().toISOString()
    };

    expect(() => GateResultSchema.parse(gateResult)).not.toThrow();
  });

  test('triage results match expected schema', () => {
    const triageResult = {
      size: 'small',
      root_causes: ['linting-errors', 'unused-imports'],
      confidence: 0.85,
      recommendations: [
        'Run linter with auto-fix',
        'Remove unused imports'
      ],
      metadata: {
        analyzer: 'claude-triage-v1',
        processing_time_ms: 150
      }
    };

    expect(() => TriageResultSchema.parse(triageResult)).not.toThrow();
  });

  test('schemas reject invalid SPEK data', () => {
    const invalidGateResult = {
      ok: 'not-a-boolean',
      gates: 'not-an-object',
      summary: { total: -1 } // Negative count
    };

    const invalidTriageResult = {
      size: 'invalid-size',
      root_causes: 'not-an-array',
      confidence: 1.5 // > 1.0
    };

    expect(() => GateResultSchema.parse(invalidGateResult)).toThrow();
    expect(() => TriageResultSchema.parse(invalidTriageResult)).toThrow();
  });
});

describe('CF v2 Alpha Integration Contract Tests', () => {
  // Schema for CF neural prediction results
  const NeuralPredictionSchema = z.object({
    model: z.string(),
    prediction: z.record(z.number()),
    confidence: z.number().min(0).max(1),
    metadata: z.object({
      version: z.string(),
      timestamp: z.string().datetime(),
      input_hash: z.string().optional()
    })
  });

  // Schema for CF hive session data
  const HiveSessionSchema = z.object({
    sessionId: z.string(),
    namespace: z.string(),
    topology: z.enum(['mesh', 'hierarchical', 'adaptive']),
    agents: z.array(z.object({
      id: z.string(),
      type: z.string(),
      status: z.enum(['active', 'idle', 'failed']),
      metrics: z.record(z.number()).optional()
    })),
    startTime: z.string().datetime(),
    lastActivity: z.string().datetime()
  });

  test('neural prediction results match schema', () => {
    const prediction = {
      model: 'failure_classifier',
      prediction: {
        'small_fix': 0.75,
        'multi_fix': 0.20,
        'big_context': 0.05
      },
      confidence: 0.89,
      metadata: {
        version: '2.0.0-alpha',
        timestamp: new Date().toISOString(),
        input_hash: 'abc123def456'
      }
    };

    expect(() => NeuralPredictionSchema.parse(prediction)).not.toThrow();
  });

  test('hive session data matches schema', () => {
    const session = {
      sessionId: 'swarm-self-correct-1234567890',
      namespace: 'spek/self-correct/20240101',
      topology: 'hierarchical',
      agents: [
        {
          id: 'agent-1',
          type: 'analyzer',
          status: 'active',
          metrics: { tasks_completed: 5, avg_response_time: 250 }
        },
        {
          id: 'agent-2', 
          type: 'fixer',
          status: 'idle'
        }
      ],
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    expect(() => HiveSessionSchema.parse(session)).not.toThrow();
  });

  test('CF schemas enforce required fields', () => {
    const incompletePrediction = {
      model: 'test_model',
      // Missing prediction, confidence, metadata
    };

    const incompleteSession = {
      sessionId: 'test-session',
      // Missing namespace, topology, agents, timestamps
    };

    expect(() => NeuralPredictionSchema.parse(incompletePrediction)).toThrow();
    expect(() => HiveSessionSchema.parse(incompleteSession)).toThrow();
  });
});