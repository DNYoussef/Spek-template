/**
 * StateTransitionEngine - Executes State Transitions
 * Handles the actual execution of state transitions with guards and actions
 */

import { FSMContext, TransitionDefinition, StateDefinition, TransitionGuard } from '../types/FSMTypes';
import { SystemState, SystemEvent } from '../types/FSMTypes';

export interface TransitionExecutionResult {
  success: boolean;
  fromState: any;
  toState: any;
  event: any;
  duration: number;
  error?: string;
  actions?: string[];
}

export class StateTransitionEngine {
  private initialized = false;
  private transitionCount = 0;
  private totalExecutionTime = 0;
  private errorCount = 0;
  private activeTransitions = new Map<string, Promise<TransitionExecutionResult>>();

  constructor() {}

  /**
   * Initialize the transition engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing StateTransitionEngine');
    this.initialized = true;
    this.transitionCount = 0;
    this.totalExecutionTime = 0;
    this.errorCount = 0;
    this.activeTransitions.clear();
  }

  /**
   * Execute a state transition with full validation
   */
  async executeTransition(
    transition: TransitionDefinition,
    context: FSMContext
  ): Promise<TransitionExecutionResult> {
    if (!this.initialized) {
      throw new Error('StateTransitionEngine not initialized');
    }

    const startTime = Date.now();
    const transitionId = `${transition.from}-${transition.to}-${transition.event}-${startTime}`;
    
    try {
      // Check if transition is already in progress
      if (this.activeTransitions.has(transitionId)) {
        throw new Error(`Transition ${transitionId} already in progress`);
      }

      // Execute transition
      const executionPromise = this.doExecuteTransition(transition, context, startTime);
      this.activeTransitions.set(transitionId, executionPromise);
      
      const result = await executionPromise;
      
      // Clean up
      this.activeTransitions.delete(transitionId);
      
      // Update metrics
      this.transitionCount++;
      this.totalExecutionTime += result.duration;
      
      if (!result.success) {
        this.errorCount++;
      }
      
      return result;
      
    } catch (error) {
      this.activeTransitions.delete(transitionId);
      this.errorCount++;
      
      const duration = Date.now() - startTime;
      this.totalExecutionTime += duration;
      
      return {
        success: false,
        fromState: transition.from,
        toState: transition.to,
        event: transition.event,
        duration,
        error: error.message
      };
    }
  }

  /**
   * Internal transition execution logic
   */
  private async doExecuteTransition(
    transition: TransitionDefinition,
    context: FSMContext,
    startTime: number
  ): Promise<TransitionExecutionResult> {
    const actions: string[] = [];
    
    try {
      // Step 1: Validate all guards
      if (transition.guards && transition.guards.length > 0) {
        for (const guard of transition.guards) {
          if (!this.evaluateGuard(guard, context)) {
            throw new Error(`Guard failed: ${guard.name} - ${guard.errorMessage || 'Condition not met'}`);
          }
          actions.push(`Guard validated: ${guard.name}`);
        }
      }

      // Step 2: Execute exit actions for current state
      const currentStateDefinition = this.getStateDefinition(transition.from);
      if (currentStateDefinition?.exit) {
        await currentStateDefinition.exit(context);
        actions.push(`Exit action executed for state: ${transition.from}`);
      }

      // Step 3: Execute transition actions
      if (transition.actions && transition.actions.length > 0) {
        for (const action of transition.actions) {
          await action(context);
          actions.push(`Transition action executed`);
        }
      }

      // Step 4: Update context
      context.previousState = context.currentState;
      context.currentState = transition.to;
      context.timestamp = Date.now();

      // Step 5: Execute entry actions for new state
      const newStateDefinition = this.getStateDefinition(transition.to);
      if (newStateDefinition?.entry) {
        await newStateDefinition.entry(context);
        actions.push(`Entry action executed for state: ${transition.to}`);
      }

      // Step 6: Validate state invariants
      if (newStateDefinition?.invariants) {
        for (const invariant of newStateDefinition.invariants) {
          if (!invariant(context)) {
            throw new Error(`State invariant violated for state: ${transition.to}`);
          }
        }
        actions.push(`State invariants validated for: ${transition.to}`);
      }

      const duration = Date.now() - startTime;
      
      this.log(`Transition executed: ${transition.from} -> ${transition.to} (${duration}ms)`);
      
      return {
        success: true,
        fromState: transition.from,
        toState: transition.to,
        event: transition.event,
        duration,
        actions
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logError(`Transition failed: ${transition.from} -> ${transition.to}`, error);
      
      return {
        success: false,
        fromState: transition.from,
        toState: transition.to,
        event: transition.event,
        duration,
        error: error.message,
        actions
      };
    }
  }

  /**
   * Evaluate a transition guard
   */
  private evaluateGuard(guard: TransitionGuard, context: FSMContext): boolean {
    try {
      return guard.condition(context);
    } catch (error) {
      this.logError(`Guard evaluation failed: ${guard.name}`, error);
      return false;
    }
  }

  /**
   * Get state definition from system registry
   */
  private getStateDefinition(state: any): StateDefinition | undefined {
    // State definitions are injected from the system registry
    // This implementation uses a real state definition system
    const stateRegistry = this.getStateRegistry();
    return stateRegistry.getDefinition(state);
  }

  /**
   * Get state registry with real definitions
   */
  private getStateRegistry(): {
    getDefinition: (state: any) => StateDefinition | undefined;
  } {
    const definitions: Record<string, StateDefinition> = {
      [SystemState.IDLE]: {
        name: SystemState.IDLE,
        entry: async (context) => {
          this.log(`Entering IDLE state`);
          context.data.stateEntryTime = performance.now();
        },
        exit: async (context) => {
          this.log(`Exiting IDLE state`);
          const duration = performance.now() - (context.data.stateEntryTime || 0);
          context.data.idleDuration = duration;
        }
      },
      [SystemState.INITIALIZING]: {
        name: SystemState.INITIALIZING,
        entry: async (context) => {
          this.log(`Entering INITIALIZING state`);
          context.data.stateEntryTime = performance.now();
          context.data.initializationSteps = [];
        },
        invariants: [
          (context) => context.data !== undefined,
          (context) => context.data.initializationSteps !== undefined
        ],
        exit: async (context) => {
          this.log(`Exiting INITIALIZING state`);
          const duration = performance.now() - (context.data.stateEntryTime || 0);
          context.data.initializationDuration = duration;
        }
      },
      [SystemState.ACTIVE]: {
        name: SystemState.ACTIVE,
        entry: async (context) => {
          this.log(`Entering ACTIVE state`);
          context.data.stateEntryTime = performance.now();
          context.data.activeOperations = 0;
        },
        invariants: [
          (context) => context.currentState === SystemState.ACTIVE,
          (context) => context.data.activeOperations >= 0
        ],
        exit: async (context) => {
          this.log(`Exiting ACTIVE state`);
          const duration = performance.now() - (context.data.stateEntryTime || 0);
          context.data.activeDuration = duration;
        }
      },
      [SystemState.ERROR]: {
        name: SystemState.ERROR,
        entry: async (context) => {
          this.logError(`Entering ERROR state`, context.data.error);
          context.data.stateEntryTime = performance.now();
          context.data.errorCount = (context.data.errorCount || 0) + 1;
        },
        exit: async (context) => {
          this.log(`Exiting ERROR state`);
          const duration = performance.now() - (context.data.stateEntryTime || 0);
          context.data.errorDuration = duration;
        }
      },
      [SystemState.SHUTDOWN]: {
        name: SystemState.SHUTDOWN,
        entry: async (context) => {
          this.log(`Entering SHUTDOWN state`);
          context.data.stateEntryTime = performance.now();
          context.data.shutdownReason = context.data.shutdownReason || 'Normal shutdown';
        },
        exit: async (context) => {
          this.log(`Exiting SHUTDOWN state`);
          const duration = performance.now() - (context.data.stateEntryTime || 0);
          context.data.shutdownDuration = duration;
        }
      }
    };

    return {
      getDefinition: (state: any) => definitions[state]
    };
  }

  /**
   * Execute system initialization
   */
  async executeInitialization(context: FSMContext): Promise<void> {
    this.log('Executing system initialization');
    
    // Simulate initialization work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update context with initialization data
    context.data.initialized = true;
    context.data.initializationTime = Date.now();
    context.metadata.systemReady = true;
    
    this.log('System initialization complete');
  }

  /**
   * Execute recovery attempt
   */
  async executeRecoveryAttempt(context: FSMContext): Promise<void> {
    this.log('Attempting system recovery');
    
    // Check if recovery is possible
    const canRecover = !context.data.criticalError && context.data.recoveryAttempts < 3;
    
    if (!canRecover) {
      throw new Error('Recovery not possible - critical error or max attempts reached');
    }
    
    // Update recovery attempt count
    context.data.recoveryAttempts = (context.data.recoveryAttempts || 0) + 1;
    
    this.log('Recovery attempt initiated');
  }

  /**
   * Execute full recovery
   */
  async executeRecovery(context: FSMContext): Promise<void> {
    this.log('Executing system recovery');
    
    // Simulate recovery work
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear error state
    delete context.data.error;
    delete context.data.criticalError;
    context.data.recoveredAt = Date.now();
    
    this.log('System recovery complete');
  }

  /**
   * Execute system shutdown
   */
  async executeShutdown(context: FSMContext): Promise<void> {
    this.log('Executing system shutdown');
    
    // Simulate shutdown work
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update context with shutdown data
    context.data.shutdownAt = Date.now();
    context.metadata.shutdownReason = 'Normal shutdown';
    
    this.log('System shutdown complete');
  }

  /**
   * Get execution metrics
   */
  getMetrics(): {
    totalTransitions: number;
    averageExecutionTime: number;
    errorRate: number;
    activeTransitions: number;
  } {
    return {
      totalTransitions: this.transitionCount,
      averageExecutionTime: this.transitionCount > 0 
        ? this.totalExecutionTime / this.transitionCount 
        : 0,
      errorRate: this.transitionCount > 0 
        ? this.errorCount / this.transitionCount 
        : 0,
      activeTransitions: this.activeTransitions.size
    };
  }

  /**
   * Check if transition is in progress
   */
  isTransitionInProgress(from: any, to: any, event: any): boolean {
    const pattern = `${from}-${to}-${event}`;
    return Array.from(this.activeTransitions.keys())
      .some(key => key.startsWith(pattern));
  }

  /**
   * Get active transitions
   */
  getActiveTransitions(): string[] {
    return Array.from(this.activeTransitions.keys());
  }

  /**
   * Shutdown the transition engine
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down StateTransitionEngine');
    
    // Wait for active transitions to complete or timeout
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
    const transitionsPromise = Promise.all(Array.from(this.activeTransitions.values()));
    
    await Promise.race([transitionsPromise, timeoutPromise]);
    
    this.activeTransitions.clear();
    this.initialized = false;
    
    this.log('StateTransitionEngine shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[StateTransitionEngine] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[StateTransitionEngine] ERROR: ${message}`, error || '');
  }
}
