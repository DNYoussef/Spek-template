import { Logger } from '../../utils/logger';
import { EventEmitter } from 'events';
import { ProtocolRegistry, ProtocolDescriptor } from '../a2a/ProtocolRegistry';
import { A2AMessage, AgentIdentifier } from '../a2a/A2AProtocolEngine';
import { DocumentationGeneratorFSM } from './fsm/DocumentationGeneratorFSM';
import { DocGeneratorState, DocGeneratorEvent, DocGeneratorTransitionHub } from './fsm/DocGeneratorTypes';
import { DocGeneratorContext } from './fsm/DocGeneratorContext';
import { DocGeneratorMetrics } from './metrics/DocGeneratorMetrics';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
    variables?: Record<string, any>;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes?: Record<string, any>;
    parameters?: Record<string, any>;
    responses?: Record<string, any>;
    examples?: Record<string, any>;
  };
  security?: Array<Record<string, any>>;
  tags?: Array<{
    name: string;
    description: string;
    externalDocs?: {
      description: string;
      url: string;
    };
  }>;
}

export interface ProtocolDocumentation {
  protocol: string;
  version: string;
  title: string;
  description: string;
  examples: ProtocolExample[];
  schemas: Record<string, any>;
  endpoints: EndpointDocumentation[];
  authentication: AuthenticationDocumentation;
  errorCodes: ErrorCodeDocumentation[];
  changelog: ChangelogEntry[];
}

export interface ProtocolExample {
  name: string;
  description: string;
  request: any;
  response: any;
  code: Record<string, string>; // language -> code
}

export interface EndpointDocumentation {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: ParameterDocumentation[];
  requestBody?: RequestBodyDocumentation;
  responses: Record<string, ResponseDocumentation>;
  examples: ProtocolExample[];
  security: SecurityRequirement[];
}

export interface ParameterDocumentation {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description: string;
  required: boolean;
  schema: any;
  example?: any;
}

export interface RequestBodyDocumentation {
  description: string;
  required: boolean;
  content: Record<string, {
    schema: any;
    example?: any;
    examples?: Record<string, any>;
  }>;
}

export interface ResponseDocumentation {
  description: string;
  content?: Record<string, {
    schema: any;
    example?: any;
    examples?: Record<string, any>;
  }>;
  headers?: Record<string, {
    description: string;
    schema: any;
  }>;
}

export interface SecurityRequirement {
  type: string;
  scheme: string;
  description: string;
}

export interface AuthenticationDocumentation {
  schemes: SecurityScheme[];
  examples: AuthExample[];
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: any;
  openIdConnectUrl?: string;
  description: string;
}

export interface AuthExample {
  scheme: string;
  description: string;
  example: string;
}

export interface ErrorCodeDocumentation {
  code: number;
  name: string;
  description: string;
  example: any;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  breakingChanges: string[];
  deprecated: string[];
}

export interface DocumentationConfig {
  generateOpenAPI: boolean;
  generateMarkdown: boolean;
  generateHTML: boolean;
  includeExamples: boolean;
  includeSchemas: boolean;
  outputDirectory: string;
  baseUrl: string;
  contactInfo: {
    name: string;
    email: string;
    url: string;
  };
  license: {
    name: string;
    url: string;
  };
}

export class A2ADocumentationGenerator extends EventEmitter {
  private logger = new Logger('A2ADocumentationGenerator');
  private fsm: DocumentationGeneratorFSM;
  private context: DocGeneratorContext;
  private transitionHub: DocGeneratorTransitionHub;
  private metrics: DocGeneratorMetrics;

  constructor(protocolRegistry: ProtocolRegistry, config?: Partial<DocumentationConfig>) {
    super();

    const defaultConfig: DocumentationConfig = {
      generateOpenAPI: true,
      generateMarkdown: true,
      generateHTML: false,
      includeExamples: true,
      includeSchemas: true,
      outputDirectory: './docs/protocols',
      baseUrl: 'https://api.example.com',
      contactInfo: {
        name: 'A2A Protocol Team',
        email: 'protocols@example.com',
        url: 'https://docs.example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      ...config
    };

    this.context = new DocGeneratorContext(protocolRegistry, defaultConfig);
    this.transitionHub = new DocGeneratorTransitionHub();
    this.metrics = new DocGeneratorMetrics();
    this.fsm = new DocumentationGeneratorFSM(this.context, this.transitionHub, this.metrics, this.logger);

    this.setupFSMEventForwarding();
  }

  private setupFSMEventForwarding(): void {
    this.fsm.on('documentationGenerated', (data: unknown) => {
      this.emit('documentationGenerated', data);
    });

    this.fsm.on('validationComplete', (data: unknown) => {
      this.emit('validationComplete', data);
    });

    this.fsm.on('exportComplete', (data: unknown) => {
      this.emit('exportComplete', data);
    });
  }

  async generateDocumentation(): Promise<Map<string, ProtocolDocumentation>> {
    return this.fsm.processEvent(DocGeneratorEvent.START_GENERATION, {
      generateAll: true
    });
  }

  async generateProtocolDocumentation(descriptor: ProtocolDescriptor): Promise<ProtocolDocumentation> {
    return this.fsm.processEvent(DocGeneratorEvent.GENERATE_PROTOCOL, {
      descriptor
    });
  }

  async generateOpenAPISpec(documentation: ProtocolDocumentation): Promise<OpenAPISpec> {
    return this.fsm.processEvent(DocGeneratorEvent.GENERATE_OPENAPI, {
      documentation
    });
  }

  async generateInteractiveDocumentation(protocol: string): Promise<string> {
    return this.fsm.processEvent(DocGeneratorEvent.GENERATE_INTERACTIVE, {
      protocol
    });
  }

  async generateCodeExamples(protocol: string, language: string): Promise<string[]> {
    return this.fsm.processEvent(DocGeneratorEvent.GENERATE_CODE_EXAMPLES, {
      protocol,
      language
    });
  }

  async exportDocumentation(format: 'json' | 'yaml' | 'html' | 'markdown'): Promise<Map<string, string>> {
    return this.fsm.processEvent(DocGeneratorEvent.EXPORT_DOCUMENTATION, {
      format
    });
  }

  async validateDocumentation(protocol: string): Promise<ValidationResult> {
    return this.fsm.processEvent(DocGeneratorEvent.VALIDATE_DOCUMENTATION, {
      protocol
    });
  }

  getGeneratedDocumentation(): Map<string, ProtocolDocumentation> {
    return this.context.getGeneratedDocs();
  }

  getOpenAPISpecs(): Map<string, OpenAPISpec> {
    return this.context.getOpenAPISpecs();
  }

  getCurrentState(): DocGeneratorState {
    return this.fsm.getCurrentState();
  }

  getMetrics(): any {
    return this.metrics.getMetrics();
  }

  async shutdown(): Promise<void> {
    return this.fsm.shutdown();
  }

  // Legacy methods moved to FSM states - keeping for backward compatibility
  // All methods now delegate to FSM state handlers through context
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// Version: 2.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-047-a2a-doc-generator-refactor
// inputs: ["A2ADocumentationGenerator.ts god object"]
// tools_used: ["MultiEdit", "Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-god-object-elimination"}
// === END FOOTER ===