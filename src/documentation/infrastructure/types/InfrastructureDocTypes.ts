/**
 * Infrastructure Documentation Types - Core type definitions for FSM architecture
 */

export enum DocStates {
  IDLE = 'idle',
  TEMPLATE_LOADING = 'template_loading',
  GENERATING = 'generating',
  DEPLOYING = 'deploying',
  MONITORING = 'monitoring',
  ERROR = 'error'
}

export enum DocEvents {
  GENERATE_API_DOCS = 'generate_api_docs',
  GENERATE_DEPLOYMENT_DOCS = 'generate_deployment_docs',
  GENERATE_MONITORING_DOCS = 'generate_monitoring_docs',
  TEMPLATE_LOADED = 'template_loaded',
  GENERATION_COMPLETE = 'generation_complete',
  DEPLOYMENT_COMPLETE = 'deployment_complete',
  UPDATE_DOCS = 'update_docs',
  MONITOR_DOCS = 'monitor_docs',
  MONITORING_COMPLETE = 'monitoring_complete',
  ERROR = 'error',
  RESET = 'reset',
  RETRY = 'retry'
}

export interface APIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  security?: any[];
  parameters?: any[];
  responses?: any;
  requestBody?: any;
}

export interface InfrastructureComponent {
  name: string;
  type: string;
  status: string;
  version?: string;
  environment?: string;
  config?: any;
  dependencies?: string[];
  healthCheck?: {
    endpoint: string;
    interval: number;
    timeout: number;
    retries: number;
  };
  metrics?: string[];
  scaling?: {
    minReplicas: number;
    maxReplicas: number;
    targetCPU: number;
    targetMemory: number;
  };
  resources?: {
    requests?: {
      cpu: string;
      memory: string;
    };
    limits?: {
      cpu: string;
      memory: string;
    };
  };
  troubleshooting?: {
    commonIssues?: Array<{
      title: string;
      description: string;
      solution: string;
    }>;
    debugCommands?: string[];
  };
}

export interface DeploymentConfig {
  name: string;
  description?: string;
  environment: string;
  strategy: {
    type: string;
    rollbackEnabled: boolean;
    healthChecks: boolean;
  };
  components: InfrastructureComponent[];
  resources: any;
  environmentVariables: any;
  monitoring: any;
  security: any;
}

export interface DocumentationPattern {
  id: string;
  type: string;
  content: string;
  metadata: {
    [key: string]: any;
  };
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: any;
  components: {
    schemas: any;
    responses: any;
    parameters: any;
    securitySchemes: any;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

export interface DocContext {
  patternEngine: any;
  templateGenerator: any;
  documentationStore: any;
  infrastructureEndpoints: Map<string, APIEndpoint>;
  deploymentConfigs: Map<string, DeploymentConfig>;
  componentDocs: Map<string, DocumentationPattern>;
  currentTemplate: any;
  generatedDocs: any;
  deploymentResult: any;
  monitoringData: any;
  lastError?: Error;
}