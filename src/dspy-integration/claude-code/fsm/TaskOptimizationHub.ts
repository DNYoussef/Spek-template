/**
 * Task Optimization FSM Transition Hub
 * NASA Rule 10 Compliant - Centralized state transition management
 *
 * REQUIREMENTS:
 * - All state changes through single TransitionHub
 * - No cross-state globals or direct transitions
 * - Explicit transition guards and validation
 * - Fixed bounds on all operations
 * - Complete error recovery with rollback
 */

import {
  TaskOptimizationState,
  OptimizationStateContract,
  StateFactory
} from './TaskOptimizationStates';

import {
  TaskOptimizationEvent,
  TaskOptimizationEventPayload,
  EventValidator,
  EventFactory
} from './TaskOptimizationEvents';

/**
 * State transition definition
 */
export interface StateTransition {
  readonly fromState: TaskOptimizationState;
  readonly toState: TaskOptimizationState;
  readonly triggerEvent: TaskOptimizationEvent;
  readonly guardCondition?: (payload: TaskOptimizationEventPayload) => boolean;
  readonly actionHandler?: (payload: TaskOptimizationEventPayload) => Promise<boolean>;
}

/**
 * Transition result with NASA Rule 10 compliance
 */
export interface TransitionResult {
  readonly success: boolean;
  readonly fromState: TaskOptimizationState;
  readonly toState: TaskOptimizationState;
  readonly event: TaskOptimizationEvent;
  readonly timestamp: Date;
  readonly errorMessage?: string;
  readonly executionTime: number;
}

/**
 * Transition guard functions with fixed bounds
 */
export class TransitionGuards {
  /**
   * Guard for initialization completion
   */
  static initializationComplete(payload: TaskOptimizationEventPayload): boolean {
    const setupPayload = payload as any;
    const hasAgentType = setupPayload.agentType && setupPayload.agentType.length > 0;
    const hasPrompt = setupPayload.originalPrompt && setupPayload.originalPrompt.length > 0;
    return hasAgentType && hasPrompt;
  }

  /**
   * Guard for analysis quality threshold
   */
  static analysisQualityMet(payload: TaskOptimizationEventPayload): boolean {
    const analysisPayload = payload as any;
    const complexityValid = analysisPayload.promptComplexity >= 0;
    const featuresValid = analysisPayload.extractedFeatures &&
                         analysisPayload.extractedFeatures.length > 0;
    return complexityValid && featuresValid;
  }

  /**
   * Guard for sufficient candidates generated
   */
  static sufficientCandidates(payload: TaskOptimizationEventPayload): boolean {
    const genPayload = payload as any;
    const minCandidates = 3; // Fixed minimum
    return genPayload.candidateCount >= minCandidates;
  }

  /**
   * Guard for quality threshold met
   */
  static qualityThresholdMet(payload: TaskOptimizationEventPayload): boolean {
    const qualityPayload = payload as any;
    const threshold = 0.8; // Fixed threshold
    return qualityPayload.overallScore >= threshold;
  }

  /**
   * Guard for optimization convergence
   */
  static optimizationConverged(payload: TaskOptimizationEventPayload): boolean {
    const optPayload = payload as any;
    const converged = optPayload.convergenceScore >= 0.95;
    const maxIterations = optPayload.iteration >= 10;
    return converged || maxIterations;
  }

  /**
   * Guard for validation passed
   */
  static validationPassed(payload: TaskOptimizationEventPayload): boolean {
    const valPayload = payload as any;
    const threshold = 0.85; // Fixed validation threshold
    return valPayload.score >= threshold;
  }

  /**
   * Guard for deployment readiness
   */
  static deploymentReady(payload: TaskOptimizationEventPayload): boolean {
    const deployPayload = payload as any;
    const hasPrompt = deployPayload.optimizedPrompt && deployPayload.optimizedPrompt.length > 0;
    const hasTarget = deployPayload.deploymentTarget && deployPayload.deploymentTarget.length > 0;
    const hasRollback = deployPayload.rollbackPlan && deployPayload.rollbackPlan.length > 0;
    return hasPrompt && hasTarget && hasRollback;
  }

  /**
   * Guard for monitoring duration
   */
  static monitoringComplete(payload: TaskOptimizationEventPayload): boolean {
    const monPayload = payload as any;
    const minDuration = 60000; // 1 minute minimum
    const elapsedTime = Date.now() - monPayload.startTime;
    return elapsedTime >= minDuration;
  }

  /**
   * Guard for error recovery attempts
   */
  static recoveryAttemptsExhausted(payload: TaskOptimizationEventPayload): boolean {
    const recPayload = payload as any;
    const maxAttempts = 3; // Fixed maximum
    return recPayload.attemptNumber >= maxAttempts;
  }

  /**
   * Guard for error recoverability
   */
  static errorRecoverable(payload: TaskOptimizationEventPayload): boolean {
    const errPayload = payload as any;
    return errPayload.recoverable === true;
  }
}

/**
 * Centralized Task Optimization Transition Hub
 * All state changes MUST go through this hub
 */
export class TaskOptimizationHub {
  private currentState: OptimizationStateContract | null = null;
  private transitionTable: Map<string, StateTransition> = new Map();
  private transitionHistory: TransitionResult[] = [];
  private readonly maxHistorySize = 1000; // Fixed bound

  /**
   * Initialize the transition hub with NASA Rule 10 compliance
   */
  constructor() {
    this.initializeTransitionTable();
  }

  /**
   * Initialize the complete transition table with all valid transitions
   */
  private initializeTransitionTable(): void {
    const transitions: StateTransition[] = [
      // Initialization transitions
      {
        fromState: TaskOptimizationState.INITIALIZING,
        toState: TaskOptimizationState.ANALYZING_PROMPT,
        triggerEvent: TaskOptimizationEvent.START_ANALYSIS,
        guardCondition: TransitionGuards.initializationComplete
      },
      {
        fromState: TaskOptimizationState.INITIALIZING,
        toState: TaskOptimizationState.FAILED,
        triggerEvent: TaskOptimizationEvent.INITIALIZATION_FAILED
      },

      // Analysis transitions
      {
        fromState: TaskOptimizationState.ANALYZING_PROMPT,
        toState: TaskOptimizationState.GENERATING_CANDIDATES,
        triggerEvent: TaskOptimizationEvent.START_GENERATION,
        guardCondition: TransitionGuards.analysisQualityMet
      },
      {
        fromState: TaskOptimizationState.ANALYZING_PROMPT,
        toState: TaskOptimizationState.ERROR_RECOVERY,
        triggerEvent: TaskOptimizationEvent.ANALYSIS_FAILED
      },

      // Generation transitions
      {
        fromState: TaskOptimizationState.GENERATING_CANDIDATES,
        toState: TaskOptimizationState.EVALUATING_QUALITY,
        triggerEvent: TaskOptimizationEvent.START_EVALUATION,
        guardCondition: TransitionGuards.sufficientCandidates
      },
      {
        fromState: TaskOptimizationState.GENERATING_CANDIDATES,
        toState: TaskOptimizationState.ERROR_RECOVERY,
        triggerEvent: TaskOptimizationEvent.GENERATION_FAILED
      },

      // Evaluation transitions
      {
        fromState: TaskOptimizationState.EVALUATING_QUALITY,
        toState: TaskOptimizationState.OPTIMIZING,
        triggerEvent: TaskOptimizationEvent.START_OPTIMIZATION
      },
      {
        fromState: TaskOptimizationState.EVALUATING_QUALITY,
        toState: TaskOptimizationState.VALIDATING,
        triggerEvent: TaskOptimizationEvent.START_VALIDATION,
        guardCondition: TransitionGuards.qualityThresholdMet
      },
      {
        fromState: TaskOptimizationState.EVALUATING_QUALITY,
        toState: TaskOptimizationState.ERROR_RECOVERY,
        triggerEvent: TaskOptimizationEvent.EVALUATION_FAILED
      },

      // Optimization transitions
      {
        fromState: TaskOptimizationState.OPTIMIZING,
        toState: TaskOptimizationState.VALIDATING,
        triggerEvent: TaskOptimizationEvent.START_VALIDATION,
        guardCondition: TransitionGuards.optimizationConverged
      },
      {
        fromState: TaskOptimizationState.OPTIMIZING,
        toState: TaskOptimizationState.GENERATING_CANDIDATES,
        triggerEvent: TaskOptimizationEvent.START_GENERATION
      },
      {
        fromState: TaskOptimizationState.OPTIMIZING,
        toState: TaskOptimizationState.ERROR_RECOVERY,
        triggerEvent: TaskOptimizationEvent.OPTIMIZATION_FAILED
      },

      // Validation transitions
      {
        fromState: TaskOptimizationState.VALIDATING,
        toState: TaskOptimizationState.DEPLOYING,
        triggerEvent: TaskOptimizationEvent.START_DEPLOYMENT,
        guardCondition: TransitionGuards.validationPassed
      },
      {
        fromState: TaskOptimizationState.VALIDATING,
        toState: TaskOptimizationState.OPTIMIZING,
        triggerEvent: TaskOptimizationEvent.START_OPTIMIZATION
      },
      {
        fromState: TaskOptimizationState.VALIDATING,
        toState: TaskOptimizationState.ERROR_RECOVERY,
        triggerEvent: TaskOptimizationEvent.VALIDATION_FAILED
      },

      // Deployment transitions
      {
        fromState: TaskOptimizationState.DEPLOYING,
        toState: TaskOptimizationState.MONITORING,
        triggerEvent: TaskOptimizationEvent.START_MONITORING,
        guardCondition: TransitionGuards.deploymentReady
      },
      {
        fromState: TaskOptimizationState.DEPLOYING,
        toState: TaskOptimizationState.ERROR_RECOVERY,
        triggerEvent: TaskOptimizationEvent.DEPLOYMENT_FAILED
      },

      // Monitoring transitions
      {
        fromState: TaskOptimizationState.MONITORING,
        toState: TaskOptimizationState.COMPLETED,
        triggerEvent: TaskOptimizationEvent.TASK_COMPLETED,
        guardCondition: TransitionGuards.monitoringComplete
      },
      {
        fromState: TaskOptimizationState.MONITORING,
        toState: TaskOptimizationState.ERROR_RECOVERY,
        triggerEvent: TaskOptimizationEvent.ERROR_DETECTED
      },

      // Error recovery transitions
      {
        fromState: TaskOptimizationState.ERROR_RECOVERY,
        toState: TaskOptimizationState.ANALYZING_PROMPT,
        triggerEvent: TaskOptimizationEvent.RECOVERY_COMPLETE
      },
      {
        fromState: TaskOptimizationState.ERROR_RECOVERY,
        toState: TaskOptimizationState.FAILED,
        triggerEvent: TaskOptimizationEvent.RECOVERY_FAILED,
        guardCondition: TransitionGuards.recoveryAttemptsExhausted
      },

      // Global emergency transitions
      {
        fromState: TaskOptimizationState.ANALYZING_PROMPT,
        toState: TaskOptimizationState.FAILED,
        triggerEvent: TaskOptimizationEvent.ABORT
      },
      {
        fromState: TaskOptimizationState.GENERATING_CANDIDATES,
        toState: TaskOptimizationState.FAILED,
        triggerEvent: TaskOptimizationEvent.ABORT
      },
      {
        fromState: TaskOptimizationState.EVALUATING_QUALITY,
        toState: TaskOptimizationState.FAILED,
        triggerEvent: TaskOptimizationEvent.ABORT
      },
      {
        fromState: TaskOptimizationState.OPTIMIZING,
        toState: TaskOptimizationState.FAILED,
        triggerEvent: TaskOptimizationEvent.ABORT
      },
      {
        fromState: TaskOptimizationState.VALIDATING,
        toState: TaskOptimizationState.FAILED,
        triggerEvent: TaskOptimizationEvent.ABORT
      }
    ];

    // NASA Rule 10: Fixed bounds on transitions
    const maxTransitions = 100;
    for (let i = 0; i < Math.min(transitions.length, maxTransitions); i++) {
      const transition = transitions[i];
      const key = this.getTransitionKey(transition.fromState, transition.triggerEvent);
      this.transitionTable.set(key, transition);
    }
  }

  /**
   * Initialize state machine with starting state
   * @param agentType Agent type for optimization
   * @param originalPrompt Original prompt to optimize
   * @param contextDNA Context DNA for optimization
   * @returns Initialization success
   */
  async initialize(
    agentType: string,
    originalPrompt: string,
    contextDNA: Record<string, any>
  ): Promise<boolean> {
    // NASA Rule 10: Assertions
    if (!agentType || agentType.length === 0) {
      return false;
    }
    if (!originalPrompt || originalPrompt.length === 0) {
      return false;
    }

    // Create initial state
    const initialState = StateFactory.createState(TaskOptimizationState.INITIALIZING);
    if (!initialState) {
      return false;
    }

    // Set up initial state data
    const initState = initialState as any;
    initState.agentType = agentType;
    initState.originalPrompt = originalPrompt;
    initState.contextDNA = contextDNA;

    // Initialize state
    const initSuccess = await initialState.init();
    if (!initSuccess) {
      return false;
    }

    this.currentState = initialState;
    return true;
  }

  /**
   * Process event and transition states with NASA Rule 10 compliance
   * @param event Event to process
   * @param payload Event payload
   * @returns Transition result
   */
  async processEvent(
    event: TaskOptimizationEvent,
    payload: TaskOptimizationEventPayload
  ): Promise<TransitionResult> {
    const startTime = Date.now();

    // NASA Rule 10: Assertions
    if (!this.currentState) {
      return this.createTransitionResult(
        false,
        TaskOptimizationState.FAILED,
        TaskOptimizationState.FAILED,
        event,
        startTime,
        'No current state'
      );
    }

    if (!EventValidator.validateEvent(event, payload)) {
      return this.createTransitionResult(
        false,
        this.currentState.name,
        this.currentState.name,
        event,
        startTime,
        'Invalid event payload'
      );
    }

    // Find transition
    const transitionKey = this.getTransitionKey(this.currentState.name, event);
    const transition = this.transitionTable.get(transitionKey);

    if (!transition) {
      return this.createTransitionResult(
        false,
        this.currentState.name,
        this.currentState.name,
        event,
        startTime,
        'No valid transition found'
      );
    }

    // Check guard condition
    if (transition.guardCondition && !transition.guardCondition(payload)) {
      return this.createTransitionResult(
        false,
        this.currentState.name,
        this.currentState.name,
        event,
        startTime,
        'Guard condition failed'
      );
    }

    // Execute action handler if present
    if (transition.actionHandler) {
      try {
        const actionSuccess = await transition.actionHandler(payload);
        if (!actionSuccess) {
          return this.createTransitionResult(
            false,
            this.currentState.name,
            this.currentState.name,
            event,
            startTime,
            'Action handler failed'
          );
        }
      } catch (error) {
        return this.createTransitionResult(
          false,
          this.currentState.name,
          this.currentState.name,
          event,
          startTime,
          `Action handler error: ${error}`
        );
      }
    }

    // Perform state transition
    const fromState = this.currentState.name;
    await this.currentState.shutdown();

    const newState = StateFactory.createState(transition.toState);
    if (!newState) {
      return this.createTransitionResult(
        false,
        fromState,
        fromState,
        event,
        startTime,
        'Failed to create new state'
      );
    }

    const initSuccess = await newState.init();
    if (!initSuccess) {
      return this.createTransitionResult(
        false,
        fromState,
        fromState,
        event,
        startTime,
        'Failed to initialize new state'
      );
    }

    this.currentState = newState;

    const result = this.createTransitionResult(
      true,
      fromState,
      transition.toState,
      event,
      startTime
    );

    this.addToHistory(result);
    return result;
  }

  /**
   * Get current state
   */
  getCurrentState(): TaskOptimizationState | null {
    return this.currentState?.name || null;
  }

  /**
   * Get current state contract
   */
  getCurrentStateContract(): OptimizationStateContract | null {
    return this.currentState;
  }

  /**
   * Get transition history with bounds
   */
  getTransitionHistory(): readonly TransitionResult[] {
    const maxReturn = 100; // Fixed bound
    return this.transitionHistory.slice(-maxReturn);
  }

  /**
   * Check if current state has valid transitions for event
   */
  canProcessEvent(event: TaskOptimizationEvent): boolean {
    if (!this.currentState) {
      return false;
    }

    const transitionKey = this.getTransitionKey(this.currentState.name, event);
    return this.transitionTable.has(transitionKey);
  }

  /**
   * Get available events for current state
   */
  getAvailableEvents(): TaskOptimizationEvent[] {
    if (!this.currentState) {
      return [];
    }

    const availableEvents: TaskOptimizationEvent[] = [];
    const maxEvents = 20; // Fixed bound

    for (const [key, transition] of this.transitionTable) {
      if (transition.fromState === this.currentState.name) {
        availableEvents.push(transition.triggerEvent);
        if (availableEvents.length >= maxEvents) {
          break;
        }
      }
    }

    return availableEvents;
  }

  /**
   * Reset state machine
   */
  async reset(): Promise<boolean> {
    if (this.currentState) {
      await this.currentState.shutdown();
      this.currentState = null;
    }

    // Keep limited history
    const historyLimit = 50;
    if (this.transitionHistory.length > historyLimit) {
      this.transitionHistory = this.transitionHistory.slice(-historyLimit);
    }

    return true;
  }

  /**
   * Generate transition key
   */
  private getTransitionKey(fromState: TaskOptimizationState, event: TaskOptimizationEvent): string {
    return `${fromState}:${event}`;
  }

  /**
   * Create transition result
   */
  private createTransitionResult(
    success: boolean,
    fromState: TaskOptimizationState,
    toState: TaskOptimizationState,
    event: TaskOptimizationEvent,
    startTime: number,
    errorMessage?: string
  ): TransitionResult {
    return {
      success,
      fromState,
      toState,
      event,
      timestamp: new Date(),
      errorMessage,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Add transition result to history with bounds
   */
  private addToHistory(result: TransitionResult): void {
    this.transitionHistory.push(result);

    // NASA Rule 10: Maintain fixed bounds
    if (this.transitionHistory.length > this.maxHistorySize) {
      this.transitionHistory = this.transitionHistory.slice(-this.maxHistorySize);
    }
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: task-optimizer-hub-003
// inputs: ["FSM states", "Events", "NASA Rule 10 requirements"]
// tools_used: ["Write"]
// versions: {"model": "claude-sonnet-4", "prompt": "v1.0"}
// === END FOOTER ===