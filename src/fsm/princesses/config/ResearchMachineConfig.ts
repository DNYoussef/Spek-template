/**
 * ResearchMachineConfig - State Machine Configuration for Research Princess
 * NASA Rule 10 Compliant - All functions ≤60 lines
 * Provides XState machine configuration for research workflows
 */

import {
  ResearchState,
  ResearchEvent,
  PrincessState,
  PrincessEvent
} from '../../types/FSMTypes';

export class ResearchMachineConfig {
  private fsm: any;

  constructor(fsm: any) {
    this.fsm = fsm;
  }

  /**
   * Create complete machine configuration
   * NASA Rule 10: ≤60 lines
   */
  createMachineConfig(): any {
    return {
      id: 'researchPrincessFSM',
      initial: ResearchState.REQUIREMENT_ANALYSIS,
      context: this.fsm.context,
      states: this.createStates(),
      ...this.createBehaviors()
    };
  }

  /**
   * Create state definitions
   * NASA Rule 10: ≤60 lines
   */
  private createStates(): any {
    return {
      [ResearchState.REQUIREMENT_ANALYSIS]: this.createRequirementAnalysisState(),
      [ResearchState.SOURCE_IDENTIFICATION]: this.createSourceIdentificationState(),
      [ResearchState.DATA_COLLECTION]: this.createDataCollectionState(),
      [ResearchState.ANALYSIS]: this.createAnalysisState(),
      [ResearchState.SYNTHESIS]: this.createSynthesisState(),
      [ResearchState.VALIDATION]: this.createValidationState(),
      [ResearchState.RECOMMENDATION_GENERATION]: this.createRecommendationState(),
      [ResearchState.REPORT_CREATION]: this.createReportState(),
      [PrincessState.COMPLETE]: this.createCompleteState(),
      [PrincessState.FAILED]: this.createFailedState()
    };
  }

  /**
   * Create requirement analysis state
   * NASA Rule 10: ≤60 lines
   */
  private createRequirementAnalysisState(): any {
    return {
      entry: 'logEntry',
      on: {
        [ResearchEvent.REQUIREMENTS_DEFINED]: {
          target: ResearchState.SOURCE_IDENTIFICATION,
          guard: 'requirementsAnalyzed',
          actions: 'recordRequirements'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'analyzeRequirements',
        onDone: {
          target: ResearchState.SOURCE_IDENTIFICATION,
          actions: 'handleRequirementsComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleRequirementsError'
        }
      }
    };
  }

  /**
   * Create source identification state
   * NASA Rule 10: ≤60 lines
   */
  private createSourceIdentificationState(): any {
    return {
      entry: 'logEntry',
      on: {
        [ResearchEvent.SOURCES_IDENTIFIED]: {
          target: ResearchState.DATA_COLLECTION,
          guard: 'sourcesValidated',
          actions: 'recordSources'
        },
        [ResearchEvent.INSUFFICIENT_SOURCES]: {
          target: ResearchState.REQUIREMENT_ANALYSIS,
          actions: 'handleInsufficientSources'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'identifySources',
        onDone: {
          target: ResearchState.DATA_COLLECTION,
          actions: 'handleSourcesComplete'
        },
        onError: {
          target: ResearchState.REQUIREMENT_ANALYSIS,
          actions: 'handleSourcesError'
        }
      }
    };
  }

  /**
   * Create data collection state
   * NASA Rule 10: ≤60 lines
   */
  private createDataCollectionState(): any {
    return {
      entry: 'logEntry',
      on: {
        [ResearchEvent.DATA_COLLECTED]: {
          target: ResearchState.ANALYSIS,
          guard: 'dataCollectionComplete',
          actions: 'recordDataCollection'
        },
        [ResearchEvent.DATA_INSUFFICIENT]: {
          target: ResearchState.SOURCE_IDENTIFICATION,
          actions: 'handleInsufficientData'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'collectData',
        onDone: {
          target: ResearchState.ANALYSIS,
          actions: 'handleDataCollectionComplete'
        },
        onError: {
          target: ResearchState.SOURCE_IDENTIFICATION,
          actions: 'handleDataCollectionError'
        }
      }
    };
  }

  /**
   * Create analysis state
   * NASA Rule 10: ≤60 lines
   */
  private createAnalysisState(): any {
    return {
      entry: 'logEntry',
      on: {
        [ResearchEvent.ANALYSIS_COMPLETE]: {
          target: ResearchState.SYNTHESIS,
          guard: 'analysisComplete',
          actions: 'recordAnalysis'
        },
        [ResearchEvent.ANALYSIS_INSUFFICIENT]: {
          target: ResearchState.DATA_COLLECTION,
          actions: 'handleInsufficientAnalysis'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'performAnalysis',
        onDone: {
          target: ResearchState.SYNTHESIS,
          actions: 'handleAnalysisComplete'
        },
        onError: {
          target: ResearchState.DATA_COLLECTION,
          actions: 'handleAnalysisError'
        }
      }
    };
  }

  /**
   * Create synthesis state
   * NASA Rule 10: ≤60 lines
   */
  private createSynthesisState(): any {
    return {
      entry: 'logEntry',
      on: {
        [ResearchEvent.SYNTHESIS_COMPLETE]: {
          target: ResearchState.VALIDATION,
          guard: 'synthesisComplete',
          actions: 'recordSynthesis'
        },
        [ResearchEvent.SYNTHESIS_INCOMPLETE]: {
          target: ResearchState.ANALYSIS,
          actions: 'handleIncompleteSynthesis'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'synthesizeFindings',
        onDone: {
          target: ResearchState.VALIDATION,
          actions: 'handleSynthesisComplete'
        },
        onError: {
          target: ResearchState.ANALYSIS,
          actions: 'handleSynthesisError'
        }
      }
    };
  }

  /**
   * Create validation state
   * NASA Rule 10: ≤60 lines
   */
  private createValidationState(): any {
    return {
      entry: 'logEntry',
      on: {
        [ResearchEvent.VALIDATION_PASSED]: {
          target: ResearchState.RECOMMENDATION_GENERATION,
          guard: 'validationPassed',
          actions: 'recordValidation'
        },
        [ResearchEvent.VALIDATION_FAILED]: {
          target: ResearchState.ANALYSIS,
          actions: 'handleValidationFailure'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'validateFindings',
        onDone: {
          target: ResearchState.RECOMMENDATION_GENERATION,
          actions: 'handleValidationComplete'
        },
        onError: {
          target: ResearchState.ANALYSIS,
          actions: 'handleValidationError'
        }
      }
    };
  }

  /**
   * Create recommendation generation state
   * NASA Rule 10: ≤60 lines
   */
  private createRecommendationState(): any {
    return {
      entry: 'logEntry',
      on: {
        [ResearchEvent.RECOMMENDATIONS_GENERATED]: {
          target: ResearchState.REPORT_CREATION,
          actions: 'recordRecommendations'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'generateRecommendations',
        onDone: {
          target: ResearchState.REPORT_CREATION,
          actions: 'handleRecommendationsComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleRecommendationsError'
        }
      }
    };
  }

  /**
   * Create report creation state
   * NASA Rule 10: ≤60 lines
   */
  private createReportState(): any {
    return {
      entry: 'logEntry',
      on: {
        [ResearchEvent.REPORT_FINALIZED]: {
          target: PrincessState.COMPLETE,
          actions: 'recordReportCreation'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'createReport',
        onDone: {
          target: PrincessState.COMPLETE,
          actions: 'handleReportComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleReportError'
        }
      }
    };
  }

  /**
   * Create complete state
   * NASA Rule 10: ≤60 lines
   */
  private createCompleteState(): any {
    return {
      entry: 'logCompletion',
      type: 'final'
    };
  }

  /**
   * Create failed state
   * NASA Rule 10: ≤60 lines
   */
  private createFailedState(): any {
    return {
      entry: 'logFailure',
      on: {
        [PrincessEvent.ROLLBACK]: {
          target: ResearchState.REQUIREMENT_ANALYSIS,
          actions: 'handleRollback'
        }
      }
    };
  }

  /**
   * Create behaviors (actions, guards, services)
   * NASA Rule 10: ≤60 lines
   */
  private createBehaviors(): any {
    return {
      actions: this.createActions(),
      guards: this.createGuards(),
      services: this.createServices()
    };
  }

  /**
   * Create action handlers
   * NASA Rule 10: ≤60 lines
   */
  private createActions(): any {
    return {
      logEntry: (context: any, event: any) => {
        this.fsm.log(`Entering state: ${context.currentState}`);
      },
      logCompletion: (context: any, event: any) => {
        this.fsm.log('Research workflow completed successfully');
      },
      logFailure: (context: any, event: any) => {
        this.fsm.logError('Research workflow failed', context.data.error);
      },
      recordRequirements: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, ResearchState.SOURCE_IDENTIFICATION, event.type);
      },
      recordSources: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, ResearchState.DATA_COLLECTION, event.type);
      },
      recordDataCollection: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, ResearchState.ANALYSIS, event.type);
      },
      recordAnalysis: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, ResearchState.SYNTHESIS, event.type);
      },
      recordSynthesis: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, ResearchState.VALIDATION, event.type);
      },
      recordValidation: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, ResearchState.RECOMMENDATION_GENERATION, event.type);
      },
      recordRecommendations: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, ResearchState.REPORT_CREATION, event.type);
      },
      recordReportCreation: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, PrincessState.COMPLETE, event.type);
      },
      recordFailure: (context: any, event: any) => {
        this.fsm.recordTransition(context.currentState, PrincessState.FAILED, event.type);
      }
    };
  }

  /**
   * Create guard conditions
   * NASA Rule 10: ≤60 lines
   */
  private createGuards(): any {
    return {
      requirementsAnalyzed: (context: any) => {
        return context.requirements?.analyzed === true;
      },
      sourcesValidated: (context: any) => {
        return context.sources?.validated === true;
      },
      dataCollectionComplete: (context: any) => {
        return context.data.dataCollection?.complete === true;
      },
      analysisComplete: (context: any) => {
        return context.analysis?.completed === true;
      },
      synthesisComplete: (context: any) => {
        return context.findings?.confidence >= 85;
      },
      validationPassed: (context: any) => {
        return context.validation?.conclusionsSupported === true;
      }
    };
  }

  /**
   * Create service implementations
   * NASA Rule 10: ≤60 lines
   */
  private createServices(): any {
    return {
      analyzeRequirements: async (context: any) => {
        return this.fsm.performRequirementAnalysis(context);
      },
      identifySources: async (context: any) => {
        return this.fsm.performSourceIdentification(context);
      },
      collectData: async (context: any) => {
        return this.fsm.performDataCollection(context);
      },
      performAnalysis: async (context: any) => {
        return this.fsm.performDataAnalysis(context);
      },
      synthesizeFindings: async (context: any) => {
        return this.fsm.performSynthesis(context);
      },
      validateFindings: async (context: any) => {
        return this.fsm.performValidation(context);
      },
      generateRecommendations: async (context: any) => {
        return this.fsm.performRecommendationGeneration(context);
      },
      createReport: async (context: any) => {
        return this.fsm.performReportCreation(context);
      }
    };
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:42:13-04:00 | codex-agent@claude-sonnet-4 | Created ResearchMachineConfig for state machine separation | src/fsm/princesses/config/ResearchMachineConfig.ts | OK | NASA Rule 10 compliant state machine config | 0.00 | a7b4c92 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-agent-023-research-fsm-refactor
- inputs: ["src/fsm/princesses/ResearchPrincessFSM.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"codex-agent-023-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->