/**
 * ReadinessStateMachine.ts - Core FSM for deployment readiness validation
 * 
 * Implements the state machine logic for deployment readiness validation,
 * following NASA Rule 10 compliance with bounded functions and clear transitions.
 */

import { EventEmitter } from 'events';
import {
  ReadinessState,
  ReadinessEvent,
  ReadinessContext,
  StateTransition,
  ValidationOptions,
  ReadinessValidation,
  ReadinessValidationError
} from '../types/ReadinessTypes';
import { TransitionHub } from './TransitionHub';
import { StateRegistry } from './StateRegistry';

/**
 * Main state machine for deployment readiness validation
 * Orchestrates the complete validation workflow through well-defined states
 */
export class ReadinessStateMachine extends EventEmitter {
  private currentState: ReadinessState = ReadinessState.IDLE;
  private context: ReadinessContext;
  private transitionHub: TransitionHub;
  private stateRegistry: StateRegistry;
  private startTime: number = 0;

  constructor(projectRoot: string) {
    super();
    
    // Initialize context with defaults
    this.context = this.createInitialContext(projectRoot);
    
    // Set up FSM components
    this.transitionHub = new TransitionHub();
    this.stateRegistry = new StateRegistry();
    
    this.setupTransitions();
    this.setupEventHandlers();
  }

  /**
   * Start deployment readiness validation
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async startValidation(
    validationId: string,
    options: ValidationOptions = {}
  ): Promise<ReadinessValidation> {
    // Assertions for NASA compliance
    console.assert(validationId && validationId.length > 0, 'ValidationId must be provided');
    console.assert(this.currentState === ReadinessState.IDLE, 'State machine must be idle to start');
    
    this.startTime = Date.now();
    this.context.validationId = validationId;
    this.context.options = options;
    this.context.validation = this.createValidationStructure(validationId, options);
    
    this.emit('validationStarted', { validationId, options });
    
    try {
      await this.transitionTo(ReadinessState.INITIALIZING, ReadinessEvent.START_VALIDATION);
      
      // Run the complete validation workflow
      while (this.currentState !== ReadinessState.COMPLETED && 
             this.currentState !== ReadinessState.ERROR) {
        await this.processCurrentState();
      }
      
      if (this.currentState === ReadinessState.ERROR) {
        throw this.context.error || new ReadinessValidationError('Validation failed');
      }
      
      this.emit('validationCompleted', { 
        validationId, 
        validation: this.context.validation,
        duration: Date.now() - this.startTime 
      });
      
      return this.context.validation;
      
    } catch (error) {
      this.emit('validationFailed', { validationId, error: error.message });
      throw error;
    } finally {
      this.reset();
    }
  }

  /**
   * Get current state for monitoring
   * NASA Rule 10: Simple getter with assertion
   */
  getCurrentState(): ReadinessState {
    console.assert(this.currentState !== undefined, 'Current state must be defined');
    return this.currentState;
  }

  /**
   * Get current validation context
   * NASA Rule 10: Simple getter with assertion
   */
  getContext(): ReadinessContext {
    console.assert(this.context !== undefined, 'Context must be defined');
    return { ...this.context }; // Return copy for immutability
  }

  /**
   * Force abort validation
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async abortValidation(reason: string): Promise<void> {
    console.assert(reason && reason.length > 0, 'Abort reason must be provided');
    console.assert(this.currentState !== ReadinessState.IDLE, 'Cannot abort idle state machine');
    
    this.context.error = new ReadinessValidationError(`Validation aborted: ${reason}`);
    await this.transitionTo(ReadinessState.ERROR, ReadinessEvent.ABORT_VALIDATION);
    
    this.emit('validationAborted', { 
      validationId: this.context.validationId, 
      reason,
      state: this.currentState 
    });
  }

  /**
   * Reset state machine to idle state
   * NASA Rule 10: Simple reset with assertion
   */
  private reset(): void {
    console.assert(this.currentState === ReadinessState.COMPLETED || 
                   this.currentState === ReadinessState.ERROR, 
                   'Can only reset from terminal states');
    
    this.currentState = ReadinessState.IDLE;
    this.context = this.createInitialContext(this.context.projectRoot);
    this.startTime = 0;
  }

  /**
   * Create initial context structure
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private createInitialContext(projectRoot: string): ReadinessContext {
    console.assert(projectRoot && projectRoot.length > 0, 'Project root must be provided');
    console.assert(typeof projectRoot === 'string', 'Project root must be string');
    
    return {
      validationId: '',
      validation: {} as ReadinessValidation,
      options: {},
      projectRoot,
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Create validation structure
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private createValidationStructure(
    validationId: string, 
    options: ValidationOptions
  ): ReadinessValidation {
    console.assert(validationId && validationId.length > 0, 'ValidationId required');
    console.assert(options !== undefined, 'Options must be defined');
    
    const targetScore = options.environmentTarget === 'production' ? 80 : 70;
    
    return {
      validationId,
      timestamp: Date.now(),
      overallReadiness: false,
      readinessScore: 0,
      targetScore,
      categories: [],
      blockers: [],
      warnings: [],
      recommendations: [],
      signoffs: [],
      deploymentApproval: {
        approved: false,
        approvalLevel: 'rejected',
        conditions: [],
        validUntil: 0,
        approvedBy: [],
        rejectedBy: [],
        notes: ''
      }
    };
  }

  /**
   * Setup state transitions in transition hub
   * NASA Rule 10: Configuration setup with assertions
   */
  private setupTransitions(): void {
    console.assert(this.transitionHub !== undefined, 'TransitionHub must be initialized');
    
    // Define all valid state transitions
    const transitions: StateTransition[] = [
      { from: ReadinessState.IDLE, to: ReadinessState.INITIALIZING, event: ReadinessEvent.START_VALIDATION },
      { from: ReadinessState.INITIALIZING, to: ReadinessState.VALIDATING_CODE_QUALITY, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.VALIDATING_CODE_QUALITY, to: ReadinessState.VALIDATING_TESTING, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.VALIDATING_TESTING, to: ReadinessState.VALIDATING_SECURITY, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.VALIDATING_SECURITY, to: ReadinessState.VALIDATING_PERFORMANCE, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.VALIDATING_PERFORMANCE, to: ReadinessState.VALIDATING_INFRASTRUCTURE, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.VALIDATING_INFRASTRUCTURE, to: ReadinessState.VALIDATING_DOCUMENTATION, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.VALIDATING_DOCUMENTATION, to: ReadinessState.VALIDATING_OPERATIONAL, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.VALIDATING_OPERATIONAL, to: ReadinessState.VALIDATING_BUSINESS, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.VALIDATING_BUSINESS, to: ReadinessState.CALCULATING_READINESS, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.CALCULATING_READINESS, to: ReadinessState.PROCESSING_SIGNOFFS, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.PROCESSING_SIGNOFFS, to: ReadinessState.MAKING_DECISION, event: ReadinessEvent.PROCEED_NEXT },
      { from: ReadinessState.MAKING_DECISION, to: ReadinessState.COMPLETED, event: ReadinessEvent.VALIDATION_COMPLETE }
    ];
    
    // Add error transitions from any state
    Object.values(ReadinessState).forEach(state => {
      if (state !== ReadinessState.ERROR) {
        transitions.push({
          from: state as ReadinessState,
          to: ReadinessState.ERROR,
          event: ReadinessEvent.VALIDATION_FAILED
        });
      }
    });
    
    this.transitionHub.registerTransitions(transitions);
  }

  /**
   * Setup event handlers for state machine
   * NASA Rule 10: Event setup with assertion
   */
  private setupEventHandlers(): void {
    console.assert(this.transitionHub !== undefined, 'TransitionHub must be initialized');
    
    this.on('stateChanged', (data) => {
      console.log(`ReadinessStateMachine: ${data.from} -> ${data.to} (${data.event})`);
    });
    
    this.on('error', (error) => {
      console.error('ReadinessStateMachine error:', error);
      this.context.error = error;
    });
  }

  /**
   * Transition to new state with event
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async transitionTo(newState: ReadinessState, event: ReadinessEvent): Promise<void> {
    console.assert(newState !== undefined, 'New state must be defined');
    console.assert(event !== undefined, 'Event must be defined');
    
    const transition = this.transitionHub.findTransition(this.currentState, event);
    if (!transition || transition.to !== newState) {
      throw new ReadinessValidationError(
        `Invalid transition: ${this.currentState} -> ${newState} via ${event}`
      );
    }
    
    // Execute transition guard if present
    if (transition.guard && !transition.guard(this.context)) {
      throw new ReadinessValidationError(
        `Transition guard failed: ${this.currentState} -> ${newState}`
      );
    }
    
    const previousState = this.currentState;
    
    // Exit current state
    const currentHandler = this.stateRegistry.getHandler(this.currentState);
    if (currentHandler) {
      this.context = await currentHandler.exit(this.context);
    }
    
    // Update state
    this.currentState = newState;
    
    // Enter new state
    const newHandler = this.stateRegistry.getHandler(newState);
    if (newHandler) {
      this.context = await newHandler.enter(this.context);
    }
    
    // Execute transition action if present
    if (transition.action) {
      this.context = await transition.action(this.context);
    }
    
    this.emit('stateChanged', { from: previousState, to: newState, event });
  }

  /**
   * Process current state until transition event occurs
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async processCurrentState(): Promise<void> {
    console.assert(this.currentState !== undefined, 'Current state must be defined');
    console.assert(this.currentState !== ReadinessState.IDLE, 'Cannot process idle state');
    
    const handler = this.stateRegistry.getHandler(this.currentState);
    if (!handler) {
      throw new ReadinessValidationError(`No handler for state: ${this.currentState}`);
    }
    
    // Check state invariants
    if (!handler.checkInvariants(this.context)) {
      throw new ReadinessValidationError(`State invariants failed: ${this.currentState}`);
    }
    
    // Determine next event based on current state
    let nextEvent: ReadinessEvent;
    
    switch (this.currentState) {
      case ReadinessState.INITIALIZING:
        nextEvent = ReadinessEvent.PROCEED_NEXT;
        break;
      case ReadinessState.VALIDATING_CODE_QUALITY:
      case ReadinessState.VALIDATING_TESTING:
      case ReadinessState.VALIDATING_SECURITY:
      case ReadinessState.VALIDATING_PERFORMANCE:
      case ReadinessState.VALIDATING_INFRASTRUCTURE:
      case ReadinessState.VALIDATING_DOCUMENTATION:
      case ReadinessState.VALIDATING_OPERATIONAL:
        nextEvent = ReadinessEvent.PROCEED_NEXT;
        break;
      case ReadinessState.VALIDATING_BUSINESS:
        nextEvent = this.shouldSkipBusinessValidation() ? ReadinessEvent.SKIP_CATEGORY : ReadinessEvent.PROCEED_NEXT;
        break;
      case ReadinessState.CALCULATING_READINESS:
      case ReadinessState.PROCESSING_SIGNOFFS:
        nextEvent = ReadinessEvent.PROCEED_NEXT;
        break;
      case ReadinessState.MAKING_DECISION:
        nextEvent = ReadinessEvent.VALIDATION_COMPLETE;
        break;
      default:
        throw new ReadinessValidationError(`Unhandled state in processing: ${this.currentState}`);
    }
    
    const nextState = this.transitionHub.findTransition(this.currentState, nextEvent)?.to;
    if (!nextState) {
      throw new ReadinessValidationError(`No valid transition from ${this.currentState} with ${nextEvent}`);
    }
    
    await this.transitionTo(nextState, nextEvent);
  }

  /**
   * Determine if business validation should be skipped
   * NASA Rule 10: Simple decision with assertion
   */
  private shouldSkipBusinessValidation(): boolean {
    console.assert(this.context.options !== undefined, 'Options must be defined');
    return this.context.options.environmentTarget !== 'production';
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: readiness-fsm-002
// inputs: ["DeploymentReadinessValidator.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-refactor-v2"}
// === END FOOTER ===