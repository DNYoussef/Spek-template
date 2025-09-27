import { EventEmitter } from 'events';
import { PatternEngine } from '../patterns/PatternEngine';
import { TemplateGenerator } from '../patterns/TemplateGenerator';
import { DocumentationStore } from '../patterns/DocumentationStore';
import { APIEndpoint, InfrastructureComponent, DeploymentConfig } from '../types/InfrastructureTypes';
import { DocumentationPattern } from '../types/PatternTypes';
import { OpenAPISpec } from '../types/OpenAPITypes';

/**
 * Infrastructure Princess API documentation management.
 * Handles documentation for deployment, monitoring, and infrastructure APIs.
 */
export class InfrastructureDocumentationManager extends EventEmitter {
  private patternEngine: PatternEngine;
  private templateGenerator: TemplateGenerator;
  private documentationStore: DocumentationStore;
  private infrastructureEndpoints: Map<string, APIEndpoint>;
  private deploymentConfigs: Map<string, DeploymentConfig>;
  private componentDocs: Map<string, DocumentationPattern>;

  constructor(
    patternEngine: PatternEngine,
    templateGenerator: TemplateGenerator,
    documentationStore: DocumentationStore
  ) {
    super();
    this.patternEngine = patternEngine;
    this.templateGenerator = templateGenerator;
    this.documentationStore = documentationStore;
    this.infrastructureEndpoints = new Map();
    this.deploymentConfigs = new Map();
    this.componentDocs = new Map();
  }

  /**
   * Generate comprehensive API documentation for Infrastructure Princess
   */
  async generateAPIDocumentation(endpoints: APIEndpoint[]): Promise<OpenAPISpec> {
    const startTime = Date.now();
    
    try {
      // Categorize endpoints by domain
      const categorizedEndpoints = this.categorizeInfrastructureEndpoints(endpoints);
      
      // Generate OpenAPI specification
      const openApiSpec: OpenAPISpec = {
        openapi: '3.1.0',
        info: {
          title: 'Infrastructure Princess API',
          version: '1.0.0',
          description: 'Comprehensive API for infrastructure management, deployment orchestration, and system monitoring',
          contact: {
            name: 'Infrastructure Team',
            email: 'infrastructure@example.com'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: 'https://api.infrastructure.example.com/v1',
            description: 'Production Infrastructure API'
          },
          {
            url: 'https://staging-api.infrastructure.example.com/v1',
            description: 'Staging Infrastructure API'
          }
        ],
        paths: {},
        components: {
          schemas: this.generateInfrastructureSchemas(),
          responses: this.generateCommonResponses(),
          parameters: this.generateCommonParameters(),
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key'
            },
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        tags: [
          {
            name: 'Deployment',
            description: 'Deployment orchestration and management'
          },
          {
            name: 'Monitoring',
            description: 'System monitoring and health checks'
          },
          {
            name: 'Configuration',
            description: 'Infrastructure configuration management'
          },
          {
            name: 'Scaling',
            description: 'Auto-scaling and resource management'
          },
          {
            name: 'Security',
            description: 'Security and compliance management'
          }
        ]
      };
      
      // Generate paths for each endpoint category
      for (const [category, categoryEndpoints] of categorizedEndpoints) {
        for (const endpoint of categoryEndpoints) {
          const pathSpec = await this.generateInfrastructurePathSpec(endpoint);
          
          if (!openApiSpec.paths[endpoint.path]) {
            openApiSpec.paths[endpoint.path] = {};
          }
          
          openApiSpec.paths[endpoint.path][endpoint.method.toLowerCase()] = pathSpec;
        }
      }
      
      // Store the generated documentation
      await this.storeAPIDocumentation(openApiSpec);
      
      const generationTime = Date.now() - startTime;
      this.emit('apiDocumentationGenerated', {
        endpointCount: endpoints.length,
        categories: Array.from(categorizedEndpoints.keys()),
        generationTime
      });
      
      return openApiSpec;
      
    } catch (error) {
      this.emit('error', { operation: 'generateAPIDocumentation', error });
      throw error;
    }
  }

  /**
   * Generate deployment documentation
   */
  async generateDeploymentDocumentation(deploymentConfig: DeploymentConfig): Promise<DocumentationPattern> {
    const template = `
# Deployment Configuration: ${deploymentConfig.name}

## Overview
${deploymentConfig.description || 'Infrastructure deployment configuration'}

## Environment: ${deploymentConfig.environment}

## Infrastructure Components
${this.generateComponentsList(deploymentConfig.components)}

## Deployment Strategy
- **Type**: ${deploymentConfig.strategy.type}
- **Rollback**: ${deploymentConfig.strategy.rollbackEnabled ? 'Enabled' : 'Disabled'}
- **Health Checks**: ${deploymentConfig.strategy.healthChecks ? 'Enabled' : 'Disabled'}

## Resource Requirements
\`\`\`yaml
resources:
${this.formatResourceRequirements(deploymentConfig.resources)}
\`\`\`

## Environment Variables
\`\`\`yaml
env:
${this.formatEnvironmentVariables(deploymentConfig.environmentVariables)}
\`\`\`

## Monitoring Configuration
\`\`\`yaml
monitoring:
${this.formatMonitoringConfig(deploymentConfig.monitoring)}
\`\`\`

## Security Configuration
\`\`\`yaml
security:
${this.formatSecurityConfig(deploymentConfig.security)}
\`\`\`

## Deployment Commands

### Deploy
\`\`\`bash
# Deploy to ${deploymentConfig.environment}
kubectl apply -f ${deploymentConfig.name}-deployment.yaml
kubectl apply -f ${deploymentConfig.name}-service.yaml
\`\`\`

### Rollback
\`\`\`bash
# Rollback deployment
kubectl rollout undo deployment/${deploymentConfig.name}
\`\`\`

### Status Check
\`\`\`bash
# Check deployment status
kubectl rollout status deployment/${deploymentConfig.name}
kubectl get pods -l app=${deploymentConfig.name}
\`\`\`

## Troubleshooting

### Common Issues
1. **Pod not starting**: Check resource limits and node capacity
2. **Service unavailable**: Verify service configuration and endpoints
3. **Configuration errors**: Validate environment variables and secrets

### Debug Commands
\`\`\`bash
# View pod logs
kubectl logs -l app=${deploymentConfig.name}

# Describe deployment
kubectl describe deployment ${deploymentConfig.name}

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
\`\`\`
`;

    const pattern: DocumentationPattern = {
      id: `deployment:${deploymentConfig.name}`,
      type: 'deployment',
      content: template,
      metadata: {
        deploymentName: deploymentConfig.name,
        environment: deploymentConfig.environment,
        generatedAt: new Date(),
        components: deploymentConfig.components.map(c => c.name)
      }
    };

    await this.documentationStore.storePattern(pattern);
    this.emit('deploymentDocumentationGenerated', { deploymentConfig, pattern });
    
    return pattern;
  }

  /**
   * Generate monitoring documentation
   */
  async generateMonitoringDocumentation(components: InfrastructureComponent[]): Promise<DocumentationPattern> {
    const template = `
# Infrastructure Monitoring

## Overview
Comprehensive monitoring setup for infrastructure components and services.

## Monitored Components
${components.map(c => `
### ${c.name}
- **Type**: ${c.type}
- **Status**: ${c.status}
- **Health Check**: ${c.healthCheck?.endpoint || 'Not configured'}
- **Metrics**: ${c.metrics?.join(', ') || 'None'}
`).join('')}

## Key Metrics

### System Metrics
- **CPU Usage**: Target < 80%
- **Memory Usage**: Target < 85%
- **Disk Usage**: Target < 90%
- **Network I/O**: Monitor for anomalies

### Application Metrics
- **Response Time**: Target < 200ms (p95)
- **Error Rate**: Target < 1%
- **Throughput**: Requests per second
- **Availability**: Target > 99.9%

### Infrastructure Metrics
- **Pod Ready Status**: All pods should be ready
- **Node Health**: All nodes should be healthy
- **Service Discovery**: Services should be discoverable
- **Load Balancer**: Traffic distribution

## Alerts Configuration

### Critical Alerts
\`\`\`yaml
alerts:
  - name: high-cpu-usage
    condition: cpu_usage > 90%
    duration: 5m
    severity: critical
    
  - name: high-memory-usage
    condition: memory_usage > 95%
    duration: 5m
    severity: critical
    
  - name: service-down
    condition: up == 0
    duration: 1m
    severity: critical
\`\`\`

### Warning Alerts
\`\`\`yaml
alerts:
  - name: elevated-error-rate
    condition: error_rate > 5%
    duration: 10m
    severity: warning
    
  - name: slow-response-time
    condition: response_time_p95 > 500ms
    duration: 15m
    severity: warning
\`\`\`

## Dashboards

### Infrastructure Overview
- System resource utilization
- Service health status
- Network traffic patterns
- Error rate trends

### Application Performance
- Request latency distribution
- Error rate by service
- Throughput metrics
- User experience metrics

### Operational Metrics
- Deployment frequency
- Lead time for changes
- Mean time to recovery
- Change failure rate

## Monitoring Tools

### Prometheus
\`\`\`yaml
prometheus:
  scrape_configs:
    - job_name: 'infrastructure'
      static_configs:
        - targets: ['localhost:9090']
\`\`\`

### Grafana
\`\`\`yaml
grafana:
  datasources:
    - name: Prometheus
      type: prometheus
      url: http://prometheus:9090
\`\`\`

### AlertManager
\`\`\`yaml
alertmanager:
  route:
    group_by: ['alertname']
    group_wait: 10s
    group_interval: 10s
    repeat_interval: 1h
    receiver: 'web.hook'
\`\`\`
`;

    const pattern: DocumentationPattern = {
      id: 'infrastructure:monitoring',
      type: 'monitoring',
      content: template,
      metadata: {
        componentCount: components.length,
        generatedAt: new Date(),
        components: components.map(c => c.name)
      }
    };

    await this.documentationStore.storePattern(pattern);
    this.emit('monitoringDocumentationGenerated', { components, pattern });
    
    return pattern;
  }

  /**
   * Update documentation patterns based on infrastructure changes
   */
  async updatePatterns(changes: any[]): Promise<DocumentationPattern[]> {
    const updatedPatterns: DocumentationPattern[] = [];
    
    for (const change of changes) {
      const patterns = await this.findRelatedPatterns(change);
      
      for (const pattern of patterns) {
        const updatedPattern = await this.updatePatternForChange(pattern, change);
        if (updatedPattern) {
          updatedPatterns.push(updatedPattern);
        }
      }
    }
    
    this.emit('patternsUpdated', { changeCount: changes.length, updatedPatterns });
    return updatedPatterns;
  }

  /**
   * Generate infrastructure component documentation
   */
  async generateComponentDocumentation(component: InfrastructureComponent): Promise<DocumentationPattern> {
    const template = `
# Infrastructure Component: ${component.name}

## Overview
${component.description || 'Infrastructure component documentation'}

## Component Details
- **Type**: ${component.type}
- **Status**: ${component.status}
- **Version**: ${component.version || 'Not specified'}
- **Environment**: ${component.environment || 'Not specified'}

## Configuration
\`\`\`yaml
${this.formatComponentConfig(component.config)}
\`\`\`

## Dependencies
${component.dependencies?.map(dep => `- ${dep}`).join('\n') || 'No dependencies'}

## Health Check
${component.healthCheck ? `
- **Endpoint**: ${component.healthCheck.endpoint}
- **Interval**: ${component.healthCheck.interval}s
- **Timeout**: ${component.healthCheck.timeout}s
- **Retries**: ${component.healthCheck.retries}
` : 'No health check configured'}

## Metrics
${component.metrics?.map(metric => `- ${metric}`).join('\n') || 'No metrics configured'}

## Scaling Configuration
${component.scaling ? `
- **Min Replicas**: ${component.scaling.minReplicas}
- **Max Replicas**: ${component.scaling.maxReplicas}
- **Target CPU**: ${component.scaling.targetCPU}%
- **Target Memory**: ${component.scaling.targetMemory}%
` : 'Scaling not configured'}

## Resource Limits
\`\`\`yaml
resources:
  requests:
    cpu: ${component.resources?.requests?.cpu || 'Not specified'}
    memory: ${component.resources?.requests?.memory || 'Not specified'}
  limits:
    cpu: ${component.resources?.limits?.cpu || 'Not specified'}
    memory: ${component.resources?.limits?.memory || 'Not specified'}
\`\`\`

## Troubleshooting

### Common Issues
${component.troubleshooting?.commonIssues?.map(issue => `
#### ${issue.title}
**Problem**: ${issue.description}
**Solution**: ${issue.solution}
`).join('') || 'No common issues documented'}

### Debug Commands
\`\`\`bash
${component.troubleshooting?.debugCommands?.join('\n') || '# No debug commands documented'}
\`\`\`
`;

    const pattern: DocumentationPattern = {
      id: `component:${component.name}`,
      type: 'component',
      content: template,
      metadata: {
        componentName: component.name,
        componentType: component.type,
        environment: component.environment,
        generatedAt: new Date()
      }
    };

    await this.documentationStore.storePattern(pattern);
    this.componentDocs.set(component.name, pattern);
    this.emit('componentDocumentationGenerated', { component, pattern });
    
    return pattern;
  }

  private categorizeInfrastructureEndpoints(endpoints: APIEndpoint[]): Map<string, APIEndpoint[]> {
    const categories = new Map<string, APIEndpoint[]>();
    
    for (const endpoint of endpoints) {
      const category = this.determineEndpointCategory(endpoint);
      
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      
      categories.get(category)!.push(endpoint);
    }
    
    return categories;
  }

  private determineEndpointCategory(endpoint: APIEndpoint): string {
    const path = endpoint.path.toLowerCase();
    
    if (path.includes('/deploy')) return 'deployment';
    if (path.includes('/monitor') || path.includes('/health')) return 'monitoring';
    if (path.includes('/config')) return 'configuration';
    if (path.includes('/scale')) return 'scaling';
    if (path.includes('/security') || path.includes('/auth')) return 'security';
    
    return 'general';
  }

  private async generateInfrastructurePathSpec(endpoint: APIEndpoint): Promise<any> {
    const pathSpec = {
      summary: endpoint.summary || `${endpoint.method.toUpperCase()} ${endpoint.path}`,
      description: endpoint.description || 'Infrastructure API endpoint',
      tags: endpoint.tags || [this.determineEndpointCategory(endpoint)],
      operationId: endpoint.operationId || this.generateOperationId(endpoint),
      security: endpoint.security || [{ BearerAuth: [] }],
      parameters: endpoint.parameters?.map(param => ({
        name: param.name,
        in: param.in || 'query',
        required: param.required || false,
        schema: {
          type: param.type || 'string'
        },
        description: param.description
      })) || [],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: endpoint.responses?.['200']?.schema || {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object' }
                }
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      }
    };

    // Add request body for POST/PUT/PATCH methods
    if (['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())) {
      pathSpec.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: endpoint.requestBody?.schema || {
              type: 'object'
            }
          }
        }
      };
    }

    return pathSpec;
  }

  private generateInfrastructureSchemas(): any {
    return {
      DeploymentConfig: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          environment: { type: 'string' },
          strategy: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['rolling', 'blue-green', 'canary'] },
              rollbackEnabled: { type: 'boolean' },
              healthChecks: { type: 'boolean' }
            }
          },
          resources: {
            type: 'object',
            properties: {
              cpu: { type: 'string' },
              memory: { type: 'string' },
              storage: { type: 'string' }
            }
          }
        }
      },
      InfrastructureComponent: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string', enum: ['healthy', 'warning', 'critical', 'unknown'] },
          version: { type: 'string' },
          healthCheck: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              interval: { type: 'integer' },
              timeout: { type: 'integer' }
            }
          }
        }
      },
      MonitoringMetrics: {
        type: 'object',
        properties: {
          cpu: { type: 'number' },
          memory: { type: 'number' },
          disk: { type: 'number' },
          network: { type: 'number' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'integer' }
        }
      }
    };
  }

  private generateCommonResponses(): any {
    return {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    };
  }

  private generateCommonParameters(): any {
    return {
      EnvironmentParam: {
        name: 'environment',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          enum: ['development', 'staging', 'production']
        },
        description: 'Target environment'
      },
      ComponentNameParam: {
        name: 'componentName',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'Name of the infrastructure component'
      }
    };
  }

  private generateOperationId(endpoint: APIEndpoint): string {
    const method = endpoint.method.toLowerCase();
    const pathParts = endpoint.path.split('/').filter(Boolean);
    const operation = pathParts.join('_').replace(/[{}]/g, '');
    return `${method}_${operation}`;
  }

  private generateComponentsList(components: InfrastructureComponent[]): string {
    return components.map(c => `
### ${c.name}
- **Type**: ${c.type}
- **Status**: ${c.status}
- **Version**: ${c.version || 'Not specified'}`).join('');
  }

  private formatResourceRequirements(resources: any): string {
    if (!resources) return '  # No resource requirements specified';
    
    return Object.entries(resources)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n');
  }

  private formatEnvironmentVariables(envVars: any): string {
    if (!envVars) return '  # No environment variables specified';
    
    return Object.entries(envVars)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n');
  }

  private formatMonitoringConfig(monitoring: any): string {
    if (!monitoring) return '  # No monitoring configuration specified';
    
    return Object.entries(monitoring)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n');
  }

  private formatSecurityConfig(security: any): string {
    if (!security) return '  # No security configuration specified';
    
    return Object.entries(security)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n');
  }

  private formatComponentConfig(config: any): string {
    if (!config) return '# No configuration specified';
    
    return Object.entries(config)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  private async storeAPIDocumentation(openApiSpec: OpenAPISpec): Promise<void> {
    const pattern: DocumentationPattern = {
      id: 'infrastructure:api:openapi',
      type: 'api',
      content: JSON.stringify(openApiSpec, null, 2),
      metadata: {
        format: 'openapi',
        version: '3.1.0',
        generatedAt: new Date(),
        endpointCount: Object.keys(openApiSpec.paths).length
      }
    };
    
    await this.documentationStore.storePattern(pattern);
  }

  private async findRelatedPatterns(change: any): Promise<DocumentationPattern[]> {
    // Find patterns that might be affected by the change
    const searchTerms = [change.component, change.environment, change.type].filter(Boolean);
    const patterns: DocumentationPattern[] = [];
    
    for (const term of searchTerms) {
      const found = await this.documentationStore.searchPatterns(term);
      patterns.push(...found);
    }
    
    return patterns;
  }

  private async updatePatternForChange(pattern: DocumentationPattern, change: any): Promise<DocumentationPattern | null> {
    // Update pattern based on the type of change
    // This would contain logic to modify the pattern content based on the change
    return pattern;
  }
}

export default InfrastructureDocumentationManager;