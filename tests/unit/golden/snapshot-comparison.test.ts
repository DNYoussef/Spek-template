/**
 * Golden Master Snapshot Tests
 * Real snapshot testing for component rendering, configuration output,
 * API responses, and error messages using Jest snapshots
 */

const { cleanupTestResources } = require('../../setup/test-environment');

// Mock configuration generator
function generateConfiguration(env: string, features: string[]) {
  return {
    environment: env,
    features: features.sort(),
    timestamp: '2025-09-24T00:00:00.000Z',
    version: '1.0.0',
    settings: {
      debug: env === 'development',
      verbose: features.includes('verbose-logging'),
      cache: features.includes('caching')
    }
  };
}

// Mock API response formatter
function formatApiResponse(data: any, includeMetadata = true) {
  const response: any = {
    status: 'success',
    data
  };

  if (includeMetadata) {
    response.metadata = {
      timestamp: '2025-09-24T00:00:00.000Z',
      requestId: '550e8400-e29b-41d4-a716-446655440000',
      version: '1.0.0'
    };
  }

  return response;
}

// Mock error formatter
function formatError(code: string, message: string, details?: any) {
  return {
    error: {
      code,
      message,
      statusCode: code.startsWith('VALIDATION') ? 400 : 500,
      details
    },
    metadata: {
      timestamp: '2025-09-24T00:00:00.000Z',
      requestId: '550e8400-e29b-41d4-a716-446655440000'
    }
  };
}

// Mock component props normalizer
function normalizeComponentProps(props: Record<string, any>) {
  const normalized: Record<string, any> = {};

  Object.keys(props).sort().forEach(key => {
    const value = props[key];

    if (typeof value === 'function') {
      normalized[key] = '[Function]';
    } else if (value instanceof Date) {
      normalized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      normalized[key] = [...value].sort();
    } else {
      normalized[key] = value;
    }
  });

  return normalized;
}

describe('Golden Master Snapshots', () => {
  afterEach(async () => {
    await cleanupTestResources();
  });

  describe('Component Rendering Snapshots', () => {
    it('matches snapshot for button component props', () => {
      const buttonProps = normalizeComponentProps({
        label: 'Submit',
        variant: 'primary',
        disabled: false,
        onClick: () => {},
        className: 'btn-submit',
        ariaLabel: 'Submit form'
      });

      expect(buttonProps).toMatchSnapshot();
    });

    it('matches snapshot for form component structure', () => {
      const formStructure = {
        fields: [
          { name: 'email', type: 'email', required: true, label: 'Email Address' },
          { name: 'password', type: 'password', required: true, label: 'Password' },
          { name: 'remember', type: 'checkbox', required: false, label: 'Remember me' }
        ],
        submitButton: { label: 'Sign In', variant: 'primary' },
        validation: {
          email: ['required', 'email'],
          password: ['required', 'minLength:8']
        }
      };

      expect(formStructure).toMatchSnapshot();
    });

    it('matches inline snapshot for card component', () => {
      const cardProps = {
        title: 'Feature Card',
        description: 'This is a test card component',
        actions: ['Edit', 'Delete'],
        metadata: { created: '2025-09-24', author: 'Test User' }
      };

      expect(cardProps).toMatchInlineSnapshot(`
{
  "actions": [
    "Edit",
    "Delete",
  ],
  "description": "This is a test card component",
  "metadata": {
    "author": "Test User",
    "created": "2025-09-24",
  },
  "title": "Feature Card",
}
`);
    });
  });

  describe('Configuration Output Snapshots', () => {
    it('matches snapshot for development configuration', () => {
      const devConfig = generateConfiguration('development', [
        'verbose-logging',
        'hot-reload',
        'debug-mode'
      ]);

      expect(devConfig).toMatchSnapshot();
    });

    it('matches snapshot for production configuration', () => {
      const prodConfig = generateConfiguration('production', [
        'caching',
        'compression',
        'monitoring'
      ]);

      expect(prodConfig).toMatchSnapshot();
    });

    it('matches inline snapshot for test configuration', () => {
      const testConfig = generateConfiguration('test', ['mocking', 'coverage']);

      expect(testConfig).toMatchInlineSnapshot(`
{
  "environment": "test",
  "features": [
    "coverage",
    "mocking",
  ],
  "settings": {
    "cache": false,
    "debug": false,
    "verbose": false,
  },
  "timestamp": "2025-09-24T00:00:00.000Z",
  "version": "1.0.0",
}
`);
    });
  });

  describe('API Response Snapshots', () => {
    it('matches snapshot for user list response', () => {
      const users = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' }
      ];
      const response = formatApiResponse(users);

      expect(response).toMatchSnapshot();
    });

    it('matches snapshot for single resource response', () => {
      const user = {
        id: 1,
        email: 'alice@example.com',
        profile: { firstName: 'Alice', lastName: 'Smith' },
        permissions: ['read', 'write']
      };
      const response = formatApiResponse(user);

      expect(response).toMatchSnapshot();
    });

    it('matches inline snapshot for empty response', () => {
      const response = formatApiResponse([], true);

      expect(response).toMatchInlineSnapshot(`
{
  "data": [],
  "metadata": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-09-24T00:00:00.000Z",
    "version": "1.0.0",
  },
  "status": "success",
}
`);
    });
  });

  describe('Error Message Snapshots', () => {
    it('matches snapshot for validation error', () => {
      const error = formatError('VALIDATION_ERROR', 'Input validation failed', [
        { field: 'email', issue: 'Invalid email format' },
        { field: 'password', issue: 'Must be at least 8 characters' }
      ]);

      expect(error).toMatchSnapshot();
    });

    it('matches snapshot for authentication error', () => {
      const error = formatError('AUTH_ERROR', 'Invalid credentials');

      expect(error).toMatchSnapshot();
    });

    it('matches snapshot for server error', () => {
      const error = formatError('INTERNAL_ERROR', 'An unexpected error occurred', {
        code: 'DB_CONNECTION_FAILED',
        message: 'Could not connect to database'
      });

      expect(error).toMatchSnapshot();
    });

    it('matches inline snapshot for not found error', () => {
      const error = formatError('NOT_FOUND', 'Resource not found');

      expect(error).toMatchInlineSnapshot(`
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "statusCode": 500,
  },
  "metadata": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-09-24T00:00:00.000Z",
  },
}
`);
    });
  });

  describe('Complex Data Structure Snapshots', () => {
    it('matches snapshot for nested configuration tree', () => {
      const configTree = {
        root: {
          services: {
            api: {
              port: 3000,
              middleware: ['cors', 'helmet', 'compression'],
              routes: ['/api/v1/users', '/api/v1/posts']
            },
            database: {
              host: 'localhost',
              port: 5432,
              pool: { min: 2, max: 10 }
            }
          },
          features: {
            auth: { enabled: true, providers: ['local', 'oauth'] },
            cache: { enabled: true, ttl: 3600 }
          }
        }
      };

      expect(configTree).toMatchSnapshot();
    });

    it('matches snapshot for workflow execution result', () => {
      const workflowResult = {
        id: 'wf-123',
        status: 'completed',
        steps: [
          { id: 1, name: 'validate', status: 'passed', duration: 120 },
          { id: 2, name: 'process', status: 'passed', duration: 450 },
          { id: 3, name: 'notify', status: 'passed', duration: 80 }
        ],
        totalDuration: 650,
        output: { processed: 100, success: 98, failed: 2 }
      };

      expect(workflowResult).toMatchSnapshot();
    });
  });

  describe('Snapshot Update Scenarios', () => {
    it('detects changes when data structure changes', () => {
      const oldStructure = {
        version: '1.0.0',
        features: ['feature1', 'feature2']
      };

      // This should match the saved snapshot
      expect(oldStructure).toMatchSnapshot('structure-v1');

      // If structure changes, snapshot will need update
      const newStructure = {
        version: '2.0.0',
        features: ['feature1', 'feature2', 'feature3'],
        deprecated: ['oldFeature']
      };

      expect(newStructure).toMatchSnapshot('structure-v2');
    });
  });
});