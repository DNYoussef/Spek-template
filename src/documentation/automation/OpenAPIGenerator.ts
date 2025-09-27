import { EventEmitter } from 'events';
import { CodeAnalyzer } from '../analysis/CodeAnalyzer';
import { APIEndpoint, OpenAPISpec, OpenAPIPath, OpenAPISchema } from '../types/OpenAPITypes';
import { DocumentationStore } from '../patterns/DocumentationStore';
import { DocumentationPattern } from '../types/PatternTypes';

/**
 * Automatic OpenAPI 3.1 specification generation from code analysis.
 * Creates comprehensive API documentation with schemas, examples, and validation.
 */
export class OpenAPIGenerator extends EventEmitter {
  private codeAnalyzer: CodeAnalyzer;
  private documentationStore: DocumentationStore;
  private generatedSpecs: Map<string, OpenAPISpec>;
  private schemaCache: Map<string, OpenAPISchema>;
  private generationMetrics: {
    totalSpecs: number;
    totalEndpoints: number;
    averageGenerationTime: number;
    lastGenerationTime: Date | null;
  };

  constructor(documentationStore: DocumentationStore) {
    super();
    this.codeAnalyzer = new CodeAnalyzer();
    this.documentationStore = documentationStore;
    this.generatedSpecs = new Map();
    this.schemaCache = new Map();
    this.generationMetrics = {
      totalSpecs: 0,
      totalEndpoints: 0,
      averageGenerationTime: 0,
      lastGenerationTime: null
    };
  }

  /**
   * Generate comprehensive OpenAPI specification from API endpoints
   */
  async generateOpenAPISpec(
    serviceName: string,
    version: string,
    endpoints: APIEndpoint[],
    options: {
      includeExamples?: boolean;
      validateSchemas?: boolean;
      generateTests?: boolean;
      includeDeprecated?: boolean;
    } = {}
  ): Promise<OpenAPISpec> {
    const startTime = Date.now();
    
    try {
      // Create base OpenAPI specification
      const spec: OpenAPISpec = {
        openapi: '3.1.0',
        info: {
          title: `${serviceName} API`,
          version: version,
          description: `Comprehensive API documentation for ${serviceName}`,
          termsOfService: 'https://example.com/terms',
          contact: {
            name: 'API Support',
            url: 'https://example.com/support',
            email: 'api-support@example.com'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: await this.generateServers(serviceName),
        paths: {},
        components: {
          schemas: {},
          responses: this.generateCommonResponses(),
          parameters: this.generateCommonParameters(),
          examples: {},
          requestBodies: {},
          headers: {},
          securitySchemes: this.generateSecuritySchemes(),
          links: {},
          callbacks: {}
        },
        security: this.generateGlobalSecurity(),
        tags: this.generateTags(endpoints),
        externalDocs: {
          description: `${serviceName} Documentation`,
          url: `https://docs.example.com/${serviceName.toLowerCase()}`
        }
      };

      // Process endpoints and generate paths
      const processedEndpoints = await this.processEndpoints(endpoints, options);
      
      for (const endpoint of processedEndpoints) {
        const pathSpec = await this.generatePathSpecification(endpoint, options);
        
        if (!spec.paths[endpoint.path]) {
          spec.paths[endpoint.path] = {};
        }
        
        spec.paths[endpoint.path][endpoint.method.toLowerCase()] = pathSpec;
      }

      // Generate schemas from endpoint data
      const schemas = await this.extractAndGenerateSchemas(processedEndpoints);
      spec.components.schemas = { ...spec.components.schemas, ...schemas };

      // Generate examples if requested
      if (options.includeExamples) {
        spec.components.examples = await this.generateExamples(processedEndpoints);
      }

      // Validate schemas if requested
      if (options.validateSchemas) {
        await this.validateSchemas(spec);
      }

      // Store the generated specification
      await this.storeOpenAPISpec(serviceName, spec);
      
      // Update metrics
      const generationTime = Date.now() - startTime;
      this.updateGenerationMetrics(endpoints.length, generationTime);
      
      this.generatedSpecs.set(serviceName, spec);
      this.emit('specGenerated', {
        serviceName,
        endpointCount: endpoints.length,
        generationTime,
        specSize: JSON.stringify(spec).length
      });
      
      return spec;
      
    } catch (error) {
      this.emit('error', { operation: 'generateOpenAPISpec', serviceName, error });
      throw error;
    }
  }

  /**
   * Generate OpenAPI specification from code files
   */
  async generateFromCode(
    serviceName: string,
    version: string,
    filePaths: string[],
    options: any = {}
  ): Promise<OpenAPISpec> {
    const endpoints: APIEndpoint[] = [];
    
    for (const filePath of filePaths) {
      try {
        const fileContent = await this.readFile(filePath);
        const analysis = await this.codeAnalyzer.analyzeCode(fileContent, filePath);
        
        if (analysis.apiEndpoints) {
          endpoints.push(...analysis.apiEndpoints);
        }
      } catch (error) {
        this.emit('warning', { operation: 'analyzeFile', filePath, error });
      }
    }
    
    return await this.generateOpenAPISpec(serviceName, version, endpoints, options);
  }

  /**
   * Generate Swagger UI compatible specification
   */
  async generateSwaggerUISpec(serviceName: string): Promise<any> {
    const spec = this.generatedSpecs.get(serviceName);
    if (!spec) {
      throw new Error(`No specification found for service: ${serviceName}`);
    }
    
    // Convert to Swagger UI compatible format
    const swaggerSpec = {
      ...spec,
      // Add Swagger UI specific extensions
      'x-tagGroups': this.generateTagGroups(spec.tags || []),
      'x-logo': {
        url: `https://docs.example.com/${serviceName.toLowerCase()}/logo.png`,
        altText: `${serviceName} API Logo`
      }
    };
    
    this.emit('swaggerSpecGenerated', { serviceName, swaggerSpec });
    return swaggerSpec;
  }

  /**
   * Generate Postman collection from OpenAPI spec
   */
  async generatePostmanCollection(serviceName: string): Promise<any> {
    const spec = this.generatedSpecs.get(serviceName);
    if (!spec) {
      throw new Error(`No specification found for service: ${serviceName}`);
    }
    
    const collection = {
      info: {
        name: `${spec.info.title} Collection`,
        description: spec.info.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [] as any[],
      auth: this.generatePostmanAuth(spec.security || []),
      variable: this.generatePostmanVariables(spec.servers || [])
    };
    
    // Convert paths to Postman requests
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation === 'object' && operation !== null) {
          const request = this.generatePostmanRequest(path, method, operation, spec);
          collection.item.push(request);
        }
      }
    }
    
    this.emit('postmanCollectionGenerated', { serviceName, collection });
    return collection;
  }

  /**
   * Validate OpenAPI specification against schema
   */
  async validateSpecification(spec: OpenAPISpec): Promise<{
    isValid: boolean;
    errors: any[];
    warnings: any[];
  }> {
    const errors: any[] = [];
    const warnings: any[] = [];
    
    try {
      // Validate basic structure
      if (!spec.openapi || !spec.info || !spec.paths) {
        errors.push('Missing required OpenAPI fields');
      }
      
      // Validate OpenAPI version
      if (!spec.openapi.startsWith('3.')) {
        errors.push(`Unsupported OpenAPI version: ${spec.openapi}`);
      }
      
      // Validate paths
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (!path.startsWith('/')) {
          errors.push(`Invalid path format: ${path}`);
        }
        
        for (const [method, operation] of Object.entries(pathItem)) {
          if (typeof operation === 'object' && operation !== null) {
            // Validate operation
            if (!operation.responses) {
              errors.push(`Missing responses for ${method.toUpperCase()} ${path}`);
            }
          }
        }
      }
      
      // Validate schemas
      if (spec.components?.schemas) {
        for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
          const schemaValidation = this.validateSchema(schema);
          if (!schemaValidation.isValid) {
            errors.push(`Invalid schema '${schemaName}': ${schemaValidation.error}`);
          }
        }
      }
      
      this.emit('specValidated', {
        isValid: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length
      });
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Generate API documentation with testing examples
   */
  async generateTestingDocumentation(serviceName: string): Promise<DocumentationPattern> {
    const spec = this.generatedSpecs.get(serviceName);
    if (!spec) {
      throw new Error(`No specification found for service: ${serviceName}`);
    }
    
    const template = `
# ${spec.info.title} - API Testing Guide

## Overview
${spec.info.description}

**Base URL**: ${spec.servers?.[0]?.url || 'https://api.example.com'}
**Version**: ${spec.info.version}

## Authentication
${this.generateAuthenticationDocs(spec.components?.securitySchemes || {})}

## API Endpoints

${Object.entries(spec.paths).map(([path, pathItem]) => 
  Object.entries(pathItem).map(([method, operation]) => {
    if (typeof operation === 'object' && operation !== null) {
      return this.generateEndpointTestingDoc(path, method, operation);
    }
    return '';
  }).join('')
).join('')}

## Error Handling

### Common Error Responses
${this.generateErrorResponseDocs(spec.components?.responses || {})}

### Error Codes
- **400**: Bad Request - Invalid request format or parameters
- **401**: Unauthorized - Authentication required or invalid
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **422**: Unprocessable Entity - Validation errors
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server error

## Rate Limiting
- Requests per minute: 1000
- Burst limit: 100
- Headers:
  - \`X-RateLimit-Limit\`: Request limit per window
  - \`X-RateLimit-Remaining\`: Requests remaining in current window
  - \`X-RateLimit-Reset\`: Time when the rate limit window resets

## Testing Tools

### cURL Examples
${this.generateCurlExamples(spec)}

### Postman Collection
Download the Postman collection: [${serviceName}-collection.json](./postman/${serviceName}-collection.json)

### Automated Testing
\`\`\`javascript
// Jest test example
const request = require('supertest');
const app = require('../app');

describe('${spec.info.title} API', () => {
  test('should return API health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'healthy');
  });
});
\`\`\`

## SDK Usage

### JavaScript/Node.js
\`\`\`javascript
const { ${serviceName}Client } = require('${serviceName.toLowerCase()}-sdk');

const client = new ${serviceName}Client({
  baseURL: '${spec.servers?.[0]?.url || 'https://api.example.com'}',
  apiKey: 'your-api-key'
});

// Example API call
try {
  const result = await client.getData();
  console.log(result);
} catch (error) {
  console.error('API Error:', error);
}
\`\`\`

### Python
\`\`\`python
from ${serviceName.toLowerCase()}_sdk import ${serviceName}Client

client = ${serviceName}Client(
    base_url='${spec.servers?.[0]?.url || 'https://api.example.com'}',
    api_key='your-api-key'
)

# Example API call
try:
    result = client.get_data()
    print(result)
except Exception as error:
    print(f'API Error: {error}')
\`\`\`

## Performance Testing

### Load Testing with Artillery
\`\`\`yaml
config:
  target: '${spec.servers?.[0]?.url || 'https://api.example.com'}'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 300
      arrivalRate: 50
      name: 'Load test'

scenarios:
  - name: 'API Health Check'
    flow:
      - get:
          url: '/health'
          expect:
            - statusCode: 200
\`\`\`

## Monitoring and Observability

### Health Checks
- **Health Endpoint**: \`GET /health\`
- **Metrics Endpoint**: \`GET /metrics\`
- **Ready Endpoint**: \`GET /ready\`

### Logging
All API requests are logged with the following structure:
\`\`\`json
{
  "timestamp": "2023-10-01T12:00:00Z",
  "method": "GET",
  "path": "/api/v1/users",
  "status": 200,
  "duration": 45,
  "user_id": "user123",
  "request_id": "req-uuid"
}
\`\`\`
`;

    const pattern: DocumentationPattern = {
      id: `api:testing:${serviceName}`,
      type: 'api_testing',
      content: template,
      metadata: {
        serviceName,
        endpointCount: Object.keys(spec.paths).length,
        version: spec.info.version,
        generatedAt: new Date(),
        hasAuthentication: !!(spec.components?.securitySchemes),
        hasExamples: !!(spec.components?.examples)
      }
    };

    await this.documentationStore.storePattern(pattern);
    this.emit('testingDocumentationGenerated', { serviceName, pattern });
    
    return pattern;
  }

  /**
   * Get generation analytics
   */
  getGenerationAnalytics(): {
    totalSpecs: number;
    totalEndpoints: number;
    averageGenerationTime: number;
    specsByService: Map<string, OpenAPISpec>;
    lastGenerationTime: Date | null;
  } {
    return {
      ...this.generationMetrics,
      specsByService: new Map(this.generatedSpecs)
    };
  }

  private async processEndpoints(endpoints: APIEndpoint[], options: any): Promise<APIEndpoint[]> {
    return endpoints.filter(endpoint => {
      if (!options.includeDeprecated && endpoint.deprecated) {
        return false;
      }
      return true;
    });
  }

  private async generatePathSpecification(endpoint: APIEndpoint, options: any): Promise<OpenAPIPath> {
    const pathSpec: OpenAPIPath = {
      summary: endpoint.summary || `${endpoint.method.toUpperCase()} ${endpoint.path}`,
      description: endpoint.description || `${endpoint.method.toUpperCase()} operation for ${endpoint.path}`,
      operationId: endpoint.operationId || this.generateOperationId(endpoint),
      tags: endpoint.tags || ['default'],
      parameters: endpoint.parameters?.map(param => ({
        name: param.name,
        in: param.in || 'query',
        required: param.required || false,
        schema: {
          type: param.type || 'string',
          format: param.format,
          enum: param.enum,
          minimum: param.minimum,
          maximum: param.maximum
        },
        description: param.description,
        example: param.example
      })) || [],
      responses: {}
    };

    // Add request body for methods that support it
    if (['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())) {
      if (endpoint.requestBody) {
        pathSpec.requestBody = {
          required: endpoint.requestBody.required || false,
          content: {
            'application/json': {
              schema: endpoint.requestBody.schema || { type: 'object' },
              example: endpoint.requestBody.example
            }
          }
        };
      }
    }

    // Add responses
    if (endpoint.responses) {
      for (const [code, response] of Object.entries(endpoint.responses)) {
        pathSpec.responses[code] = {
          description: response.description || `Response ${code}`,
          content: response.schema ? {
            'application/json': {
              schema: response.schema,
              example: response.example
            }
          } : undefined
        };
      }
    } else {
      // Default responses
      pathSpec.responses['200'] = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      };
    }

    // Add security if specified
    if (endpoint.security) {
      pathSpec.security = endpoint.security;
    }

    // Add deprecation notice
    if (endpoint.deprecated) {
      pathSpec.deprecated = true;
    }

    return pathSpec;
  }

  private async extractAndGenerateSchemas(endpoints: APIEndpoint[]): Promise<Record<string, OpenAPISchema>> {
    const schemas: Record<string, OpenAPISchema> = {};
    
    for (const endpoint of endpoints) {
      // Extract schemas from request bodies
      if (endpoint.requestBody?.schema) {
        const schemaName = this.generateSchemaName(endpoint, 'Request');
        schemas[schemaName] = endpoint.requestBody.schema;
      }
      
      // Extract schemas from responses
      if (endpoint.responses) {
        for (const [code, response] of Object.entries(endpoint.responses)) {
          if (response.schema) {
            const schemaName = this.generateSchemaName(endpoint, `Response${code}`);
            schemas[schemaName] = response.schema;
          }
        }
      }
    }
    
    return schemas;
  }

  private async generateExamples(endpoints: APIEndpoint[]): Promise<Record<string, any>> {
    const examples: Record<string, any> = {};
    
    for (const endpoint of endpoints) {
      if (endpoint.requestBody?.example) {
        const exampleName = `${this.generateOperationId(endpoint)}_request`;
        examples[exampleName] = {
          summary: `Request example for ${endpoint.method.toUpperCase()} ${endpoint.path}`,
          value: endpoint.requestBody.example
        };
      }
      
      if (endpoint.responses) {
        for (const [code, response] of Object.entries(endpoint.responses)) {
          if (response.example) {
            const exampleName = `${this.generateOperationId(endpoint)}_response_${code}`;
            examples[exampleName] = {
              summary: `Response example for ${endpoint.method.toUpperCase()} ${endpoint.path} (${code})`,
              value: response.example
            };
          }
        }
      }
    }
    
    return examples;
  }

  private async validateSchemas(spec: OpenAPISpec): Promise<void> {
    if (!spec.components?.schemas) return;
    
    for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
      const validation = this.validateSchema(schema);
      if (!validation.isValid) {
        this.emit('warning', {
          operation: 'validateSchema',
          schemaName,
          error: validation.error
        });
      }
    }
  }

  private validateSchema(schema: any): { isValid: boolean; error?: string } {
    try {
      // Basic schema validation
      if (!schema.type) {
        return { isValid: false, error: 'Schema missing type' };
      }
      
      if (schema.type === 'object' && !schema.properties && !schema.additionalProperties) {
        return { isValid: false, error: 'Object schema missing properties' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  private async generateServers(serviceName: string): Promise<any[]> {
    return [
      {
        url: `https://api.${serviceName.toLowerCase()}.com/v1`,
        description: 'Production server'
      },
      {
        url: `https://staging-api.${serviceName.toLowerCase()}.com/v1`,
        description: 'Staging server'
      },
      {
        url: `http://localhost:3000/v1`,
        description: 'Development server'
      }
    ];
  }

  private generateCommonResponses(): Record<string, any> {
    return {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Unauthorized' },
                message: { type: 'string', example: 'Authentication required' }
              }
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Not Found' },
                message: { type: 'string', example: 'The requested resource was not found' }
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Internal Server Error' },
                message: { type: 'string', example: 'An unexpected error occurred' },
                requestId: { type: 'string', example: 'req-123456' }
              }
            }
          }
        }
      }
    };
  }

  private generateCommonParameters(): Record<string, any> {
    return {
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Maximum number of items to return',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        }
      },
      OffsetParam: {
        name: 'offset',
        in: 'query',
        description: 'Number of items to skip',
        schema: {
          type: 'integer',
          minimum: 0,
          default: 0
        }
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        description: 'Sort field and direction',
        schema: {
          type: 'string',
          example: 'created_at:desc'
        }
      }
    };
  }

  private generateSecuritySchemes(): Record<string, any> {
    return {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key authentication'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication'
      },
      OAuth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://auth.example.com/oauth/authorize',
            tokenUrl: 'https://auth.example.com/oauth/token',
            scopes: {
              read: 'Read access',
              write: 'Write access',
              admin: 'Administrative access'
            }
          }
        }
      }
    };
  }

  private generateGlobalSecurity(): any[] {
    return [
      { BearerAuth: [] },
      { ApiKeyAuth: [] }
    ];
  }

  private generateTags(endpoints: APIEndpoint[]): any[] {
    const tagSet = new Set<string>();
    
    endpoints.forEach(endpoint => {
      if (endpoint.tags) {
        endpoint.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).map(tag => ({
      name: tag,
      description: `${tag} related operations`
    }));
  }

  private generateTagGroups(tags: any[]): any[] {
    return [
      {
        name: 'Core Operations',
        tags: tags.filter(tag => ['users', 'auth', 'core'].includes(tag.name)).map(tag => tag.name)
      },
      {
        name: 'Data Management',
        tags: tags.filter(tag => ['data', 'files', 'storage'].includes(tag.name)).map(tag => tag.name)
      },
      {
        name: 'Administration',
        tags: tags.filter(tag => ['admin', 'system', 'monitoring'].includes(tag.name)).map(tag => tag.name)
      }
    ];
  }

  private generatePostmanAuth(security: any[]): any {
    // Generate Postman authentication configuration
    return {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{authToken}}',
          type: 'string'
        }
      ]
    };
  }

  private generatePostmanVariables(servers: any[]): any[] {
    const variables = [
      {
        key: 'baseUrl',
        value: servers[0]?.url || 'https://api.example.com',
        type: 'string'
      },
      {
        key: 'authToken',
        value: 'your-auth-token',
        type: 'string'
      }
    ];
    
    return variables;
  }

  private generatePostmanRequest(path: string, method: string, operation: any, spec: OpenAPISpec): any {
    const request = {
      name: operation.summary || `${method.toUpperCase()} ${path}`,
      request: {
        method: method.toUpperCase(),
        header: [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ],
        url: {
          raw: `{{baseUrl}}${path}`,
          host: ['{{baseUrl}}'],
          path: path.split('/').filter(Boolean)
        }
      },
      response: []
    };
    
    // Add request body if applicable
    if (operation.requestBody) {
      request.request.body = {
        mode: 'raw',
        raw: JSON.stringify(operation.requestBody.content?.['application/json']?.example || {}, null, 2)
      };
    }
    
    return request;
  }

  private generateOperationId(endpoint: APIEndpoint): string {
    const method = endpoint.method.toLowerCase();
    const pathParts = endpoint.path.split('/').filter(Boolean).map(part => 
      part.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9]/g, '_')
    );
    
    return `${method}_${pathParts.join('_')}`;
  }

  private generateSchemaName(endpoint: APIEndpoint, suffix: string): string {
    const pathParts = endpoint.path.split('/').filter(Boolean);
    const baseName = pathParts[pathParts.length - 1] || 'Resource';
    return `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}${suffix}`;
  }

  private generateAuthenticationDocs(securitySchemes: Record<string, any>): string {
    let docs = '';
    
    for (const [name, scheme] of Object.entries(securitySchemes)) {
      docs += `
### ${name}
`;
      
      switch (scheme.type) {
        case 'apiKey':
          docs += `- **Type**: API Key\n- **Location**: ${scheme.in}\n- **Header**: ${scheme.name}\n`;
          break;
        case 'http':
          docs += `- **Type**: HTTP ${scheme.scheme}\n`;
          if (scheme.bearerFormat) {
            docs += `- **Format**: ${scheme.bearerFormat}\n`;
          }
          break;
        case 'oauth2':
          docs += `- **Type**: OAuth 2.0\n- **Flows**: ${Object.keys(scheme.flows).join(', ')}\n`;
          break;
      }
    }
    
    return docs;
  }

  private generateEndpointTestingDoc(path: string, method: string, operation: any): string {
    return `
### ${method.toUpperCase()} ${path}

${operation.description || 'No description available'}

**Operation ID**: \`${operation.operationId}\`

#### Example Request
\`\`\`http
${method.toUpperCase()} ${path} HTTP/1.1
Host: api.example.com
Authorization: Bearer your-token
Content-Type: application/json

${operation.requestBody ? JSON.stringify(operation.requestBody.content?.['application/json']?.example || {}, null, 2) : ''}
\`\`\`

#### Example Response
\`\`\`json
${JSON.stringify(operation.responses?.['200']?.content?.['application/json']?.example || { success: true }, null, 2)}
\`\`\`

---
`;
  }

  private generateErrorResponseDocs(responses: Record<string, any>): string {
    let docs = '';
    
    for (const [name, response] of Object.entries(responses)) {
      if (name.includes('Error') || name.includes('Bad') || name.includes('Unauthorized')) {
        docs += `
#### ${name}
${response.description}

\`\`\`json
${JSON.stringify(response.content?.['application/json']?.schema?.example || {}, null, 2)}
\`\`\`
`;
      }
    }
    
    return docs;
  }

  private generateCurlExamples(spec: OpenAPISpec): string {
    let examples = '';
    
    // Generate a few example cURL commands
    const samplePaths = Object.entries(spec.paths).slice(0, 3);
    
    for (const [path, pathItem] of samplePaths) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation === 'object' && operation !== null) {
          examples += `
#### ${method.toUpperCase()} ${path}
\`\`\`bash
curl -X ${method.toUpperCase()} \\
  '${spec.servers?.[0]?.url || 'https://api.example.com'}${path}' \\
  -H 'Authorization: Bearer your-token' \\
  -H 'Content-Type: application/json'`;
          
          if (operation.requestBody) {
            examples += ` \\
  -d '${JSON.stringify(operation.requestBody.content?.['application/json']?.example || {})}'`;
          }
          
          examples += '\n```\n';
          break; // Only show first method for each path
        }
      }
    }
    
    return examples;
  }

  private async storeOpenAPISpec(serviceName: string, spec: OpenAPISpec): Promise<void> {
    const pattern: DocumentationPattern = {
      id: `openapi:${serviceName}`,
      type: 'openapi',
      content: JSON.stringify(spec, null, 2),
      metadata: {
        serviceName,
        version: spec.info.version,
        endpointCount: Object.keys(spec.paths).length,
        generatedAt: new Date(),
        format: 'openapi-3.1.0'
      }
    };
    
    await this.documentationStore.storePattern(pattern);
  }

  private updateGenerationMetrics(endpointCount: number, generationTime: number): void {
    this.generationMetrics.totalSpecs++;
    this.generationMetrics.totalEndpoints += endpointCount;
    this.generationMetrics.averageGenerationTime = 
      (this.generationMetrics.averageGenerationTime + generationTime) / 2;
    this.generationMetrics.lastGenerationTime = new Date();
  }

  private async readFile(filePath: string): Promise<string> {
    const fs = require('fs').promises;
    return await fs.readFile(filePath, 'utf-8');
  }
}

export default OpenAPIGenerator;