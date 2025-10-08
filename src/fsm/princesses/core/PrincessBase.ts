/**
 * PrincessBase - Shared Foundation for All Princess FSMs
 * NASA Rule 10 Compliant: Base class with common patterns
 * Eliminates duplicate code across 5 Princess FSM implementations
 */

import { Actor, createMachine, interpret } from 'xstate';
import { FSMContext, PrincessEvent, PrincessState, TransitionRecord } from '../../types/FSMTypes';
import { PrincessTransitionHub } from './PrincessTransitionHub';
import { PrincessStateValidator } from './PrincessStateValidator';
import { PrincessLogger } from './PrincessLogger';

export interface PrincessConfig {
  principessType: string;
  initialState: any;
  states: any;
  actions?: any;
  guards?: any;
  services?: any;
}

export abstract class PrincessBase<TContext extends FSMContext, TState, TEvent> {
  protected machine: any;
  protected actor: Actor<any> | null = null;
  protected context: TContext;
  protected initialized = false;
  protected transitionHistory: TransitionRecord[] = [];

  // Shared Princess components
  protected transitionHub: PrincessTransitionHub;
  protected stateValidator: PrincessStateValidator;
  protected logger: PrincessLogger;

  constructor(principessType: string, initialState: TState, initialContext: Partial<TContext> = {}) {
    this.context = this.createInitialContext(principessType, initialState, initialContext);
    this.initializeSharedComponents(principessType);
    this.initializeMachine();
  }

  /**
   * Create initial context with shared Princess patterns
   */
  private createInitialContext(
    principessType: string,
    initialState: TState,
    initialContext: Partial<TContext>
  ): TContext {
    return {
      currentState: initialState,
      data: {},
      timestamp: Date.now(),
      transitionHistory: [],
      metadata: {
        principessType,
        workflowId: `${principessType}-fsm-${Date.now()}`
      },
      ...initialContext
    } as TContext;
  }

  /**
   * Initialize shared Princess components
   */
  private initializeSharedComponents(principessType: string): void {
    this.logger = new PrincessLogger(principessType);
    this.transitionHub = new PrincessTransitionHub(this.logger);
    this.stateValidator = new PrincessStateValidator(this.logger);
  }

  /**
   * Initialize XState machine with Princess config
   */
  private initializeMachine(): void {
    const config = this.getPrincessConfig();
    this.machine = createMachine({
      id: `${config.principessType}PrincessFSM`,
      initial: config.initialState,
      context: this.context,
      states: config.states,
      actions: this.createSharedActions(config.actions),
      guards: this.createSharedGuards(config.guards),
      services: config.services || {}
    });
  }

  /**
   * Create shared actions with common Princess patterns
   */
  private createSharedActions(customActions: any = {}): any {
    return {
      logEntry: (context: any, event: any) => {
        this.logger.log(`Entering state: ${context.currentState}`);
      },
      logCompletion: (context: any, event: any) => {
        this.logger.log('Princess workflow completed successfully');
      },
      logFailure: (context: any, event: any) => {
        this.logger.error('Princess workflow failed', context.data.error);
      },
      recordTransition: (context: any, event: any) => {
        this.transitionHub.recordTransition(
          context.currentState,
          event.targetState || PrincessState.COMPLETE,
          event.type,
          context
        );
      },
      ...customActions
    };
  }

  /**
   * Create shared guards with common Princess patterns
   */
  private createSharedGuards(customGuards: any = {}): any {
    return {
      isHealthy: (context: any) => this.stateValidator.isHealthy(context),
      canTransition: (context: any, event: any) =>
        this.stateValidator.canTransition(context, event),
      ...customGuards
    };
  }

  /**
   * Initialize and start the FSM
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.log('Initializing Princess FSM');
    this.setupActor();
    this.startActor();
    this.logger.log('Princess FSM initialized and started');
  }

  /**
   * Setup actor with state subscription
   */
  private setupActor(): void {
    this.actor = interpret(this.machine);
    this.actor.subscribe((state) => {
      this.handleStateChange(state);
    });
  }

  /**
   * Start actor and mark as initialized
   */
  private startActor(): void {
    if (this.actor) {
      this.actor.start();
      this.initialized = true;
    }
  }

  /**
   * Send event to the FSM
   */
  async sendEvent(event: TEvent | PrincessEvent, data?: any): Promise<void> {
    if (!this.actor) {
      throw new Error('FSM not initialized');
    }

    try {
      this.actor.send({ type: event, data });
      this.logger.log(`Event sent: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to send event: ${event}`, error);
      throw error;
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): TState | PrincessState {
    if (!this.actor) {
      return this.context.currentState;
    }
    return this.actor.getSnapshot().value;
  }

  /**
   * Check if FSM is healthy
   */
  isHealthy(): boolean {
    return this.initialized &&
           this.actor !== null &&
           this.getCurrentState() !== PrincessState.FAILED;
  }

  /**
   * Get transition history
   */
  getTransitionHistory(): TransitionRecord[] {
    return this.transitionHub.getHistory();
  }

  /**
   * Handle state changes
   */
  private handleStateChange(state: any): void {
    const newState = state.value;
    const previousState = this.context.currentState;

    this.context.currentState = newState;
    this.context.previousState = previousState;
    this.context.timestamp = Date.now();

    this.logger.log(`State changed: ${previousState} -> ${newState}`);
  }

  /**
   * Shutdown the FSM
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.logger.log('Shutting down Princess FSM');

    if (this.actor) {
      this.actor.stop();
      this.actor = null;
    }

    this.initialized = false;
    this.logger.log('Princess FSM shutdown complete');
  }

  /**
   * Abstract method for Princess-specific configuration
   */
  protected abstract getPrincessConfig(): PrincessConfig;
}