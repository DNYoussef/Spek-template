/**
 * SystemStateMachine - Master FSM Controller
 * Central state machine that orchestrates the entire Queen-Princess-Drone hierarchy
 * Uses XState for real state machine implementation with enum-based states
 */

import { createMachine, interpret, Actor, ActorRefFrom } from 'xstate';
import { SystemState, SystemEvent, FSMContext, FSMConfiguration, TransitionRecord } from '../types/FSMTypes';
import { StateTransitionEngine } from './StateTransitionEngine';
import { StateGuardValidator } from './StateGuardValidator';
import { StateEventDispatcher } from './StateEventDispatcher';
import { StateHistoryManager } from './StateHistoryManager';

export interface SystemStateMachineConfig {
  maxTransitionTime: number;
  enableLogging: boolean;
  persistState: boolean;
  validationLevel: 'strict' | 'normal' | 'relaxed';
}

export class SystemStateMachine {
  private machine: any;
  private actor: Actor<any> | null = null;
  private transitionEngine: StateTransitionEngine;
  private guardValidator: StateGuardValidator;
  private eventDispatcher: StateEventDispatcher;
  private historyManager: StateHistoryManager;
  private config: SystemStateMachineConfig;
  private context: FSMContext;
  private initialized = false;

  constructor(config: Partial<SystemStateMachineConfig> = {}) {
    this.config = {
      maxTransitionTime: 10000, // 10 seconds
      enableLogging: true,
      persistState: true,
      validationLevel: 'strict',
      ...config
    };

    this.transitionEngine = new StateTransitionEngine();
    this.guardValidator = new StateGuardValidator();
    this.eventDispatcher = new StateEventDispatcher();
    this.historyManager = new StateHistoryManager();

    this.context = {
      currentState: SystemState.IDLE,
      data: {},
      timestamp: Date.now(),
      transitionHistory: [],
      metadata: {
        machineId: `system-fsm-${Date.now()}`,
        version: '1.0.0'
      }
    };

    this.initializeMachine();
  }

  /**
   * Initialize XState machine with enum-based states
   */
  private initializeMachine(): void {
    this.machine = createMachine({
      id: 'systemStateMachine',
      initial: SystemState.IDLE,
      context: this.context,
      states: {
        [SystemState.IDLE]: {
          entry: 'logStateEntry',
          on: {
            [SystemEvent.INITIALIZE]: {
              target: SystemState.INITIALIZING,
              guard: 'canInitialize',
              actions: 'handleInitialize'
            }
          }
        },
        [SystemState.INITIALIZING]: {
          entry: 'logStateEntry',
          invoke: {
            src: 'initializeSystem',
            onDone: {
              target: SystemState.ACTIVE,
              actions: 'handleInitializeComplete'
            },
            onError: {
              target: SystemState.ERROR,
              actions: 'handleInitializeError'
            }
          },
          after: {
            30000: { // 30 second timeout
              target: SystemState.ERROR,
              actions: 'handleTimeout'
            }
          }
        },
        [SystemState.ACTIVE]: {
          entry: 'logStateEntry',
          on: {
            [SystemEvent.PAUSE]: {
              target: SystemState.SUSPENDED,
              guard: 'canSuspend',
              actions: 'handlePause'
            },
            [SystemEvent.STOP]: {
              target: SystemState.SHUTDOWN,
              guard: 'canShutdown',
              actions: 'handleStop'
            },
            [SystemEvent.ERROR_OCCURRED]: {
              target: SystemState.ERROR,
              actions: 'handleError'
            },
            [SystemEvent.HEALTH_CHECK]: {
              actions: 'performHealthCheck'
            }
          }
        },
        [SystemState.SUSPENDED]: {
          entry: 'logStateEntry',
          on: {
            [SystemEvent.RESUME]: {
              target: SystemState.ACTIVE,
              guard: 'canResume',
              actions: 'handleResume'
            },
            [SystemEvent.STOP]: {
              target: SystemState.SHUTDOWN,
              actions: 'handleStop'
            }
          }
        },
        [SystemState.ERROR]: {
          entry: 'logStateEntry',
          on: {
            [SystemEvent.RECOVERY_COMPLETE]: {
              target: SystemState.ACTIVE,
              guard: 'canRecover',
              actions: 'handleRecovery'
            },
            [SystemEvent.FORCE_SHUTDOWN]: {
              target: SystemState.SHUTDOWN,
              actions: 'handleForceShutdown'
            }
          },
          invoke: {
            src: 'attemptRecovery',
            onDone: {
              target: SystemState.RECOVERING,
              actions: 'handleRecoveryStarted'
            }
          }
        },
        [SystemState.RECOVERING]: {
          entry: 'logStateEntry',
          invoke: {
            src: 'executeRecovery',
            onDone: {
              target: SystemState.ACTIVE,
              actions: 'handleRecoveryComplete'
            },
            onError: {
              target: SystemState.ERROR,
              actions: 'handleRecoveryFailed'
            }
          }
        },
        [SystemState.SHUTDOWN]: {
          entry: 'logStateEntry',
          type: 'final',
          invoke: {
            src: 'performShutdown'
          }
        }
      }
    }, {
      actions: {
        logStateEntry: (context, event) => {
          this.logTransition(context.currentState, event.type, true);
        },
        handleInitialize: (context, event) => {
          this.recordTransition(context.currentState, SystemState.INITIALIZING, event.type);
        },
        handleInitializeComplete: (context, event) => {
          this.recordTransition(context.currentState, SystemState.ACTIVE, SystemEvent.TRANSITION_COMPLETE);
        },
        handleInitializeError: (context, event) => {
          this.recordTransition(context.currentState, SystemState.ERROR, SystemEvent.ERROR_OCCURRED);
        },
        handleTimeout: (context, event) => {
          this.logError('State machine timeout occurred', context);
        },
        handlePause: (context, event) => {
          this.recordTransition(context.currentState, SystemState.SUSPENDED, event.type);
        },
        handleResume: (context, event) => {
          this.recordTransition(context.currentState, SystemState.ACTIVE, event.type);
        },
        handleStop: (context, event) => {
          this.recordTransition(context.currentState, SystemState.SHUTDOWN, event.type);
        },
        handleError: (context, event) => {
          this.recordTransition(context.currentState, SystemState.ERROR, event.type);
          this.logError('System error occurred', context);
        },
        handleRecovery: (context, event) => {
          this.recordTransition(context.currentState, SystemState.ACTIVE, event.type);
        },
        handleForceShutdown: (context, event) => {
          this.recordTransition(context.currentState, SystemState.SHUTDOWN, event.type);
        },
        performHealthCheck: (context, event) => {
          this.performSystemHealthCheck();
        }
      },
      guards: {
        canInitialize: (context) => {
          return this.guardValidator.validateTransition(
            context.currentState,
            SystemState.INITIALIZING,
            SystemEvent.INITIALIZE,
            context
          );
        },
        canSuspend: (context) => {
          return this.guardValidator.validateTransition(
            context.currentState,
            SystemState.SUSPENDED,
            SystemEvent.PAUSE,
            context
          );
        },
        canResume: (context) => {
          return this.guardValidator.validateTransition(
            context.currentState,
            SystemState.ACTIVE,
            SystemEvent.RESUME,
            context
          );
        },
        canShutdown: (context) => {
          return this.guardValidator.validateTransition(
            context.currentState,
            SystemState.SHUTDOWN,
            SystemEvent.STOP,
            context
          );
        },
        canRecover: (context) => {
          return this.guardValidator.validateTransition(
            context.currentState,
            SystemState.ACTIVE,
            SystemEvent.RECOVERY_COMPLETE,
            context
          );
        }
      },
      services: {
        initializeSystem: async (context) => {
          return this.transitionEngine.executeInitialization(context);
        },
        attemptRecovery: async (context) => {
          return this.transitionEngine.executeRecoveryAttempt(context);
        },
        executeRecovery: async (context) => {
          return this.transitionEngine.executeRecovery(context);
        },
        performShutdown: async (context) => {
          return this.transitionEngine.executeShutdown(context);
        }
      }
    });
  }

  /**
   * Initialize and start the state machine
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('SystemStateMachine already initialized');
    }

    try {
      // Start the XState actor
      this.actor = interpret(this.machine);
      
      // Subscribe to state changes
      this.actor.subscribe((state) => {
        this.handleStateChange(state);
      });

      this.actor.start();
      
      // Initialize sub-components
      await this.transitionEngine.initialize();
      await this.guardValidator.initialize();
      await this.eventDispatcher.initialize();
      await this.historyManager.initialize();

      this.initialized = true;
      this.log('SystemStateMachine initialized successfully');
      
      // Send initialize event to start the machine
      await this.sendEvent(SystemEvent.INITIALIZE);
      
    } catch (error) {
      this.logError('Failed to initialize SystemStateMachine', error);
      throw error;
    }
  }

  /**
   * Send event to state machine with validation
   */
  async sendEvent(event: SystemEvent, data?: any): Promise<void> {
    if (!this.actor) {
      throw new Error('State machine not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Validate event before sending
      const canTransition = this.guardValidator.validateEvent(
        this.getCurrentState(),
        event,
        this.context
      );

      if (!canTransition) {
        throw new Error(`Invalid event ${event} for current state ${this.getCurrentState()}`);
      }

      // Dispatch event through event dispatcher
      await this.eventDispatcher.dispatchEvent(event, data);
      
      // Send to XState machine
      this.actor.send({ type: event, data });
      
      // Record in history
      const duration = Date.now() - startTime;
      this.historyManager.recordEvent(event, this.getCurrentState(), duration, true);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.historyManager.recordEvent(event, this.getCurrentState(), duration, false, error.message);
      this.logError(`Failed to send event ${event}`, error);
      throw error;
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): SystemState {
    if (!this.actor) {
      return SystemState.IDLE;
    }
    return this.actor.getSnapshot().value as SystemState;
  }

  /**
   * Get current context
   */
  getContext(): FSMContext {
    if (!this.actor) {
      return this.context;
    }
    return this.actor.getSnapshot().context;
  }

  /**
   * Handle state changes
   */
  private handleStateChange(state: any): void {
    const newState = state.value as SystemState;
    const previousState = this.context.currentState;
    
    this.context.currentState = newState;
    this.context.previousState = previousState;
    this.context.timestamp = Date.now();
    
    // Notify event dispatcher
    this.eventDispatcher.notifyStateChange(previousState, newState);
    
    // Update history
    this.historyManager.recordStateChange(previousState, newState);
    
    this.log(`State changed: ${previousState} -> ${newState}`);
  }

  /**
   * Record transition in history
   */
  private recordTransition(from: SystemState, to: SystemState, event: SystemEvent): void {
    const record: TransitionRecord = {
      from,
      to,
      event,
      timestamp: Date.now(),
      duration: 0,
      success: true,
      context: { ...this.context }
    };
    
    this.context.transitionHistory.push(record);
    this.historyManager.recordTransition(record);
  }

  /**
   * Perform system health check
   */
  private performSystemHealthCheck(): void {
    const health = {
      currentState: this.getCurrentState(),
      uptime: Date.now() - this.context.timestamp,
      transitionCount: this.context.transitionHistory.length,
      lastTransition: this.context.transitionHistory[this.context.transitionHistory.length - 1],
      isHealthy: this.getCurrentState() !== SystemState.ERROR
    };
    
    this.log('Health check performed', health);
  }

  /**
   * Get transition history
   */
  getTransitionHistory(): TransitionRecord[] {
    return [...this.context.transitionHistory];
  }

  /**
   * Get performance metrics
   */
  getMetrics(): any {
    return this.historyManager.getMetrics();
  }

  /**
   * Shutdown state machine
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.sendEvent(SystemEvent.STOP);
      
      // Wait for shutdown to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (this.actor) {
        this.actor.stop();
        this.actor = null;
      }
      
      await this.transitionEngine.shutdown();
      await this.guardValidator.shutdown();
      await this.eventDispatcher.shutdown();
      await this.historyManager.shutdown();
      
      this.initialized = false;
      this.log('SystemStateMachine shutdown complete');
      
    } catch (error) {
      this.logError('Error during shutdown', error);
      throw error;
    }
  }

  /**
   * Force shutdown (emergency)
   */
  async forceShutdown(): Promise<void> {
    try {
      if (this.actor) {
        await this.sendEvent(SystemEvent.FORCE_SHUTDOWN);
      }
    } catch (error) {
      this.logError('Error during force shutdown', error);
    } finally {
      if (this.actor) {
        this.actor.stop();
        this.actor = null;
      }
      this.initialized = false;
    }
  }

  /**
   * Check if state machine is in a valid state
   */
  isHealthy(): boolean {
    const currentState = this.getCurrentState();
    return currentState !== SystemState.ERROR && currentState !== SystemState.SHUTDOWN;
  }

  /**
   * Log transition
   */
  private logTransition(state: SystemState, event: string, entry: boolean): void {
    if (this.config.enableLogging) {
      const action = entry ? 'Entering' : 'Exiting';
      this.log(`${action} state: ${state} (event: ${event})`);
    }
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[SystemStateMachine] ${message}`, data || '');
    }
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[SystemStateMachine] ERROR: ${message}`, error || '');
  }
}
