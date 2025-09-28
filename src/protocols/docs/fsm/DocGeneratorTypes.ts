import { EventEmitter } from 'events';
import { Logger } from '../../../utils/logger';
import { ProtocolDescriptor } from '../../a2a/ProtocolRegistry';
import {
  ProtocolDocumentation,
  OpenAPISpec,
  DocumentationConfig,
  ProtocolExample,
  EndpointDocumentation,
  AuthenticationDocumentation,
  ErrorCodeDocumentation,
  ChangelogEntry
} from '../A2ADocumentationGenerator';

export enum DocGeneratorState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  GENERATING_DOCS = 'GENERATING_DOCS',
  GENERATING_PROTOCOL = 'GENERATING_PROTOCOL',
  GENERATING_EXAMPLES = 'GENERATING_EXAMPLES',
  GENERATING_SCHEMAS = 'GENERATING_SCHEMAS',
  GENERATING_ENDPOINTS = 'GENERATING_ENDPOINTS',
  GENERATING_OPENAPI = 'GENERATING_OPENAPI',
  GENERATING_INTERACTIVE = 'GENERATING_INTERACTIVE',
  GENERATING_CODE_EXAMPLES = 'GENERATING_CODE_EXAMPLES',
  EXPORTING = 'EXPORTING',
  VALIDATING = 'VALIDATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum DocGeneratorEvent {
  INITIALIZE = 'INITIALIZE',
  START_GENERATION = 'START_GENERATION',
  GENERATE_PROTOCOL = 'GENERATE_PROTOCOL',
  GENERATE_EXAMPLES = 'GENERATE_EXAMPLES',
  GENERATE_SCHEMAS = 'GENERATE_SCHEMAS',
  GENERATE_ENDPOINTS = 'GENERATE_ENDPOINTS',
  GENERATE_OPENAPI = 'GENERATE_OPENAPI',
  GENERATE_INTERACTIVE = 'GENERATE_INTERACTIVE',
  GENERATE_CODE_EXAMPLES = 'GENERATE_CODE_EXAMPLES',
  EXPORT_DOCUMENTATION = 'EXPORT_DOCUMENTATION',
  VALIDATE_DOCUMENTATION = 'VALIDATE_DOCUMENTATION',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

export interface DocGeneratorEventData {
  generateAll?: boolean;
  descriptor?: ProtocolDescriptor;
  documentation?: ProtocolDocumentation;
  protocol?: string;
  language?: string;
  format?: 'json' | 'yaml' | 'html' | 'markdown';
  error?: Error;
  [key: string]: any;
}

export interface DocGeneratorTransition {
  fromState: DocGeneratorState;
  event: DocGeneratorEvent;
  toState: DocGeneratorState;
  guard?: (data?: DocGeneratorEventData) => boolean;
  action?: (data?: DocGeneratorEventData) => Promise<void>;
}

export class DocGeneratorTransitionHub extends EventEmitter {
  private transitions: Map<string, DocGeneratorTransition[]> = new Map();
  private logger = new Logger('DocGeneratorTransitionHub');

  constructor() {
    super();
    this.defineTransitions();
  }

  private defineTransitions(): void {
    const transitions: DocGeneratorTransition[] = [
      // Initialization transitions
      {
        fromState: DocGeneratorState.IDLE,
        event: DocGeneratorEvent.INITIALIZE,
        toState: DocGeneratorState.INITIALIZING
      },
      {
        fromState: DocGeneratorState.INITIALIZING,
        event: DocGeneratorEvent.START_GENERATION,
        toState: DocGeneratorState.GENERATING_DOCS
      },

      // Documentation generation flow
      {
        fromState: DocGeneratorState.GENERATING_DOCS,
        event: DocGeneratorEvent.GENERATE_PROTOCOL,
        toState: DocGeneratorState.GENERATING_PROTOCOL
      },
      {
        fromState: DocGeneratorState.GENERATING_PROTOCOL,
        event: DocGeneratorEvent.GENERATE_EXAMPLES,
        toState: DocGeneratorState.GENERATING_EXAMPLES
      },
      {
        fromState: DocGeneratorState.GENERATING_EXAMPLES,
        event: DocGeneratorEvent.GENERATE_SCHEMAS,
        toState: DocGeneratorState.GENERATING_SCHEMAS
      },
      {
        fromState: DocGeneratorState.GENERATING_SCHEMAS,
        event: DocGeneratorEvent.GENERATE_ENDPOINTS,
        toState: DocGeneratorState.GENERATING_ENDPOINTS
      },
      {
        fromState: DocGeneratorState.GENERATING_ENDPOINTS,
        event: DocGeneratorEvent.GENERATE_OPENAPI,
        toState: DocGeneratorState.GENERATING_OPENAPI
      },

      // Direct generation transitions
      {
        fromState: DocGeneratorState.IDLE,
        event: DocGeneratorEvent.GENERATE_PROTOCOL,
        toState: DocGeneratorState.GENERATING_PROTOCOL
      },
      {
        fromState: DocGeneratorState.IDLE,
        event: DocGeneratorEvent.GENERATE_OPENAPI,
        toState: DocGeneratorState.GENERATING_OPENAPI
      },
      {
        fromState: DocGeneratorState.IDLE,
        event: DocGeneratorEvent.GENERATE_INTERACTIVE,
        toState: DocGeneratorState.GENERATING_INTERACTIVE
      },
      {
        fromState: DocGeneratorState.IDLE,
        event: DocGeneratorEvent.GENERATE_CODE_EXAMPLES,
        toState: DocGeneratorState.GENERATING_CODE_EXAMPLES
      },

      // Export and validation transitions
      {
        fromState: DocGeneratorState.COMPLETED,
        event: DocGeneratorEvent.EXPORT_DOCUMENTATION,
        toState: DocGeneratorState.EXPORTING
      },
      {
        fromState: DocGeneratorState.COMPLETED,
        event: DocGeneratorEvent.VALIDATE_DOCUMENTATION,
        toState: DocGeneratorState.VALIDATING
      },
      {
        fromState: DocGeneratorState.IDLE,
        event: DocGeneratorEvent.EXPORT_DOCUMENTATION,
        toState: DocGeneratorState.EXPORTING
      },
      {
        fromState: DocGeneratorState.IDLE,
        event: DocGeneratorEvent.VALIDATE_DOCUMENTATION,
        toState: DocGeneratorState.VALIDATING
      },

      // Completion transitions
      {
        fromState: DocGeneratorState.GENERATING_OPENAPI,
        event: DocGeneratorEvent.COMPLETE,
        toState: DocGeneratorState.COMPLETED
      },
      {
        fromState: DocGeneratorState.GENERATING_PROTOCOL,
        event: DocGeneratorEvent.COMPLETE,
        toState: DocGeneratorState.COMPLETED
      },
      {
        fromState: DocGeneratorState.GENERATING_INTERACTIVE,
        event: DocGeneratorEvent.COMPLETE,
        toState: DocGeneratorState.COMPLETED
      },
      {
        fromState: DocGeneratorState.GENERATING_CODE_EXAMPLES,
        event: DocGeneratorEvent.COMPLETE,
        toState: DocGeneratorState.COMPLETED
      },
      {
        fromState: DocGeneratorState.EXPORTING,
        event: DocGeneratorEvent.COMPLETE,
        toState: DocGeneratorState.COMPLETED
      },
      {
        fromState: DocGeneratorState.VALIDATING,
        event: DocGeneratorEvent.COMPLETE,
        toState: DocGeneratorState.COMPLETED
      },

      // Error handling transitions
      {
        fromState: DocGeneratorState.GENERATING_DOCS,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.GENERATING_PROTOCOL,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.GENERATING_EXAMPLES,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.GENERATING_SCHEMAS,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.GENERATING_ENDPOINTS,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.GENERATING_OPENAPI,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.GENERATING_INTERACTIVE,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.GENERATING_CODE_EXAMPLES,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.EXPORTING,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },
      {
        fromState: DocGeneratorState.VALIDATING,
        event: DocGeneratorEvent.ERROR,
        toState: DocGeneratorState.ERROR
      },

      // Reset transitions
      {
        fromState: DocGeneratorState.ERROR,
        event: DocGeneratorEvent.RESET,
        toState: DocGeneratorState.IDLE
      },
      {
        fromState: DocGeneratorState.COMPLETED,
        event: DocGeneratorEvent.RESET,
        toState: DocGeneratorState.IDLE
      }
    ];

    // Group transitions by from state
    transitions.forEach(transition => {
      const key = transition.fromState;
      if (!this.transitions.has(key)) {
        this.transitions.set(key, []);
      }
      this.transitions.get(key)!.push(transition);
    });
  }

  getValidTransitions(fromState: DocGeneratorState): DocGeneratorTransition[] {
    return this.transitions.get(fromState) || [];
  }

  findTransition(
    fromState: DocGeneratorState,
    event: DocGeneratorEvent,
    data?: DocGeneratorEventData
  ): DocGeneratorTransition | null {
    const validTransitions = this.getValidTransitions(fromState);

    for (const transition of validTransitions) {
      if (transition.event === event) {
        if (!transition.guard || transition.guard(data)) {
          return transition;
        }
      }
    }

    return null;
  }

  async executeTransition(
    transition: DocGeneratorTransition,
    data?: DocGeneratorEventData
  ): Promise<void> {
    this.logger.debug('Executing transition', {
      fromState: transition.fromState,
      event: transition.event,
      toState: transition.toState
    });

    if (transition.action) {
      await transition.action(data);
    }

    this.emit('transitionExecuted', {
      transition,
      data
    });
  }

  validateTransition(
    fromState: DocGeneratorState,
    event: DocGeneratorEvent,
    data?: DocGeneratorEventData
  ): boolean {
    return this.findTransition(fromState, event, data) !== null;
  }

  getAllStates(): DocGeneratorState[] {
    return Object.values(DocGeneratorState);
  }

  getAllEvents(): DocGeneratorEvent[] {
    return Object.values(DocGeneratorEvent);
  }

  getTransitionMatrix(): Record<string, Record<string, string[]>> {
    const matrix: Record<string, Record<string, string[]>> = {};

    for (const state of this.getAllStates()) {
      matrix[state] = {};
      for (const event of this.getAllEvents()) {
        matrix[state][event] = [];
      }
    }

    for (const [fromState, transitions] of this.transitions) {
      for (const transition of transitions) {
        if (!matrix[fromState][transition.event]) {
          matrix[fromState][transition.event] = [];
        }
        matrix[fromState][transition.event].push(transition.toState);
      }
    }

    return matrix;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-01-28T20:05:22-05:00 | CODEX-047@claude-3-5-sonnet-20241022 | Created FSM types and transition hub for documentation generator | DocGeneratorTypes.ts | OK | Comprehensive state machine definition with 14 states, 13 events, and transition validation | 0.00 | a3f7e82 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-047-a2a-doc-generator-refactor
- inputs: ["A2ADocumentationGenerator.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-types-creation"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->