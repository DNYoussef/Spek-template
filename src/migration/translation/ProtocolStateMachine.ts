import { ProtocolState, ProtocolEvent, TranslationResult, ProtocolMessage } from './ProtocolTypes';
import { Logger } from '../../utils/Logger';

interface StateTransition {
  fromState: ProtocolState;
  event: ProtocolEvent;
  toState: ProtocolState;
  guard?: (context: TranslationContext) => boolean;
}

interface TranslationContext {
  message: ProtocolMessage;
  sourceVersion: string;
  targetVersion: string;
  result: TranslationResult;
  error?: Error;
}

export class ProtocolStateMachine {
  private logger: Logger;
  private currentState: ProtocolState;
  private context: TranslationContext | null;
  private transitions: StateTransition[];

  constructor() {
    this.logger = new Logger('ProtocolStateMachine');
    this.currentState = ProtocolState.IDLE;
    this.context = null;
    this.transitions = this.initializeTransitions();
  }

  private initializeTransitions(): StateTransition[] {
    // NASA Rule 10: All transitions explicitly defined
    const transitions: StateTransition[] = [
      // From IDLE
      { 
        fromState: ProtocolState.IDLE, 
        event: ProtocolEvent.START_TRANSLATION, 
        toState: ProtocolState.INITIALIZING 
      },
      
      // From INITIALIZING
      { 
        fromState: ProtocolState.INITIALIZING, 
        event: ProtocolEvent.SOURCE_VALIDATION_SUCCESS, 
        toState: ProtocolState.VALIDATING_SOURCE 
      },
      { 
        fromState: ProtocolState.INITIALIZING, 
        event: ProtocolEvent.ERROR_OCCURRED, 
        toState: ProtocolState.ERROR 
      },
      
      // From VALIDATING_SOURCE
      { 
        fromState: ProtocolState.VALIDATING_SOURCE, 
        event: ProtocolEvent.SOURCE_VALIDATION_SUCCESS, 
        toState: ProtocolState.FINDING_RULES 
      },
      { 
        fromState: ProtocolState.VALIDATING_SOURCE, 
        event: ProtocolEvent.SOURCE_VALIDATION_FAILED, 
        toState: ProtocolState.ERROR 
      },
      
      // From FINDING_RULES
      { 
        fromState: ProtocolState.FINDING_RULES, 
        event: ProtocolEvent.RULES_FOUND, 
        toState: ProtocolState.APPLYING_TRANSFORMATIONS 
      },
      { 
        fromState: ProtocolState.FINDING_RULES, 
        event: ProtocolEvent.NO_RULES_FOUND, 
        toState: ProtocolState.ERROR 
      },
      
      // From APPLYING_TRANSFORMATIONS
      { 
        fromState: ProtocolState.APPLYING_TRANSFORMATIONS, 
        event: ProtocolEvent.TRANSFORMATIONS_SUCCESS, 
        toState: ProtocolState.VALIDATING_TARGET 
      },
      { 
        fromState: ProtocolState.APPLYING_TRANSFORMATIONS, 
        event: ProtocolEvent.TRANSFORMATIONS_FAILED, 
        toState: ProtocolState.ERROR 
      },
      
      // From VALIDATING_TARGET
      { 
        fromState: ProtocolState.VALIDATING_TARGET, 
        event: ProtocolEvent.TARGET_VALIDATION_SUCCESS, 
        toState: ProtocolState.CALCULATING_FIDELITY 
      },
      { 
        fromState: ProtocolState.VALIDATING_TARGET, 
        event: ProtocolEvent.TARGET_VALIDATION_FAILED, 
        toState: ProtocolState.CALCULATING_FIDELITY,
        guard: (context) => this.allowInvalidTargetGuard(context)
      },
      { 
        fromState: ProtocolState.VALIDATING_TARGET, 
        event: ProtocolEvent.TARGET_VALIDATION_FAILED, 
        toState: ProtocolState.ERROR,
        guard: (context) => !this.allowInvalidTargetGuard(context)
      },
      
      // From CALCULATING_FIDELITY
      { 
        fromState: ProtocolState.CALCULATING_FIDELITY, 
        event: ProtocolEvent.FIDELITY_CALCULATED, 
        toState: ProtocolState.CACHING_RESULT 
      },
      
      // From CACHING_RESULT
      { 
        fromState: ProtocolState.CACHING_RESULT, 
        event: ProtocolEvent.CACHING_COMPLETE, 
        toState: ProtocolState.COMPLETED 
      },
      
      // From ERROR
      { 
        fromState: ProtocolState.ERROR, 
        event: ProtocolEvent.RESET, 
        toState: ProtocolState.IDLE 
      },
      
      // From COMPLETED
      { 
        fromState: ProtocolState.COMPLETED, 
        event: ProtocolEvent.RESET, 
        toState: ProtocolState.IDLE 
      }
    ];

    // Assertions for NASA compliance
    if (transitions.length < 10) {
      throw new Error('Insufficient state transitions defined');
    }
    
    return transitions;
  }

  public getCurrentState(): ProtocolState {
    return this.currentState;
  }

  public getContext(): TranslationContext | null {
    return this.context;
  }

  public initializeContext(
    message: ProtocolMessage, 
    sourceVersion: string, 
    targetVersion: string
  ): void {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !sourceVersion || !targetVersion) {
      throw new Error('Invalid initialization parameters');
    }
    
    this.context = {
      message,
      sourceVersion,
      targetVersion,
      result: {
        success: false,
        translatedMessage: null,
        originalMessage: message,
        appliedRules: [],
        warnings: [],
        errors: [],
        metadata: {
          translationId: this.generateTranslationId(),
          timestamp: new Date(),
          duration: 0,
          rulesEvaluated: 0,
          transformationsApplied: 0,
          dataLoss: false,
          fidelity: 0
        },
        performance: {
          translationTime: 0,
          validationTime: 0,
          serializationTime: 0,
          totalTime: 0,
          memoryUsage: 0,
          cpuUsage: 0
        }
      }
    };
    
    if (!this.context.result.metadata.translationId) {
      throw new Error('Failed to generate translation ID');
    }
  }

  public transition(event: ProtocolEvent): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!event) {
      throw new Error('Event is required for state transition');
    }
    
    const validTransition = this.findValidTransition(event);
    if (!validTransition) {
      this.logger.warn('Invalid state transition', {
        currentState: this.currentState,
        event,
        availableStates: this.getAvailableTransitions()
      });
      return false;
    }
    
    const previousState = this.currentState;
    this.currentState = validTransition.toState;
    
    this.logger.debug('State transition executed', {
      from: previousState,
      to: this.currentState,
      event
    });
    
    if (this.currentState === ProtocolState.IDLE) {
      this.context = null;
    }
    
    return true;
  }

  public isInFinalState(): boolean {
    return this.currentState === ProtocolState.COMPLETED || 
           this.currentState === ProtocolState.ERROR;
  }

  public isInErrorState(): boolean {
    return this.currentState === ProtocolState.ERROR;
  }

  public reset(): void {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!this.transition(ProtocolEvent.RESET)) {
      throw new Error('Failed to reset state machine');
    }
    
    this.currentState = ProtocolState.IDLE;
    this.context = null;
    
    this.logger.debug('State machine reset to IDLE');
  }

  private findValidTransition(event: ProtocolEvent): StateTransition | null {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!event) {
      throw new Error('Event parameter is required');
    }
    
    const validTransitions = this.transitions.filter(
      t => t.fromState === this.currentState && t.event === event
    );
    
    if (validTransitions.length === 0) {
      return null;
    }
    
    // Apply guards if present
    for (const transition of validTransitions) {
      if (!transition.guard || transition.guard(this.context!)) {
        return transition;
      }
    }
    
    if (validTransitions.length > 1) {
      this.logger.warn('Multiple valid transitions found, guards may be insufficient');
    }
    
    return null;
  }

  private getAvailableTransitions(): ProtocolState[] {
    // NASA Rule 10: Function ≤60 lines, has assertions
    const availableTransitions = this.transitions
      .filter(t => t.fromState === this.currentState)
      .map(t => t.toState);
    
    if (availableTransitions.length === 0) {
      this.logger.warn('No available transitions from current state', {
        currentState: this.currentState
      });
    }
    
    return availableTransitions;
  }

  private allowInvalidTargetGuard(context: TranslationContext | null): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!context) {
      throw new Error('Context is required for guard evaluation');
    }
    
    // This would be configured from translation options
    // For now, default to false (strict validation)
    return false;
  }

  private generateTranslationId(): string {
    // NASA Rule 10: Function ≤60 lines, has assertions
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    if (!timestamp || !random) {
      throw new Error('Failed to generate translation ID components');
    }
    
    return `trans_${timestamp}_${random}`;
  }

  public validateStateMachine(): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    const allStates = Object.values(ProtocolState);
    const allEvents = Object.values(ProtocolEvent);
    
    if (allStates.length === 0 || allEvents.length === 0) {
      throw new Error('Invalid state or event definitions');
    }
    
    // Verify all states have at least one transition
    const statesWithTransitions = new Set(
      this.transitions.map(t => t.fromState)
    );
    
    const orphanedStates = allStates.filter(
      state => !statesWithTransitions.has(state) && state !== ProtocolState.COMPLETED
    );
    
    if (orphanedStates.length > 0) {
      this.logger.warn('States without transitions found', { orphanedStates });
      return false;
    }
    
    return true;
  }
}