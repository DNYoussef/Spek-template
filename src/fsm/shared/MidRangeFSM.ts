/**
 * MidRangeFSM - Shared FSM Infrastructure for God Object Elimination
 * Provides common state machine patterns for mid-range god objects (700-999 lines)
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

export enum ComponentState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  SHUTDOWN = 'SHUTDOWN'
}

export enum ComponentEvent {
  INITIALIZE = 'INITIALIZE',
  START_PROCESSING = 'START_PROCESSING',
  COMPLETE_PROCESSING = 'COMPLETE_PROCESSING',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  SHUTDOWN = 'SHUTDOWN',
  RESET = 'RESET'
}

export interface FSMConfig {
  componentId: string;
  initialState: ComponentState;
  enableLogging: boolean;
  enableMetrics: boolean;
}

export interface StateTransition {
  from: ComponentState;
  event: ComponentEvent;
  to: ComponentState;
  guard?: () => boolean;
  action?: () => Promise<void>;
}

export interface ComponentMetrics {
  stateTransitions: number;
  processingTime: number;
  errorCount: number;
  lastProcessedAt?: Date;
}

/**
 * Base FSM for mid-range components
 * NASA Rule 10: ≤60 lines per function
 */
export abstract class MidRangeFSM {
  protected currentState: ComponentState;
  protected config: FSMConfig;
  protected transitions: Map<string, StateTransition>;
  protected metrics: ComponentMetrics;
  protected stateHandlers: Map<ComponentState, () => Promise<void>>;

  constructor(config: FSMConfig) {
    this.config = config;
    this.currentState = config.initialState;
    this.transitions = new Map();
    this.metrics = {
      stateTransitions: 0,
      processingTime: 0,
      errorCount: 0
    };
    this.stateHandlers = new Map();
    this.initializeTransitions();
    this.initializeStateHandlers();
  }

  /**
   * Initialize state transitions
   * NASA Rule 10: ≤60 lines
   */
  private initializeTransitions(): void {
    const transitions: StateTransition[] = [
      { from: ComponentState.UNINITIALIZED, event: ComponentEvent.INITIALIZE, to: ComponentState.INITIALIZING },
      { from: ComponentState.INITIALIZING, event: ComponentEvent.START_PROCESSING, to: ComponentState.READY },
      { from: ComponentState.READY, event: ComponentEvent.START_PROCESSING, to: ComponentState.PROCESSING },
      { from: ComponentState.PROCESSING, event: ComponentEvent.COMPLETE_PROCESSING, to: ComponentState.READY },
      { from: ComponentState.PROCESSING, event: ComponentEvent.ERROR_OCCURRED, to: ComponentState.ERROR },
      { from: ComponentState.ERROR, event: ComponentEvent.RESET, to: ComponentState.READY },
      { from: ComponentState.READY, event: ComponentEvent.SHUTDOWN, to: ComponentState.SHUTDOWN },
      { from: ComponentState.ERROR, event: ComponentEvent.SHUTDOWN, to: ComponentState.SHUTDOWN }
    ];

    transitions.forEach(transition => {
      const key = `${transition.from}-${transition.event}`;
      this.transitions.set(key, transition);
    });

    this.log('Initialized state transitions');
  }

  /**
   * Process event and transition state
   * NASA Rule 10: ≤60 lines
   */
  async processEvent(event: ComponentEvent): Promise<boolean> {
    const key = `${this.currentState}-${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      this.log(`Invalid transition: ${this.currentState} -> ${event}`);
      return false;
    }

    // Check guard condition
    if (transition.guard && !transition.guard()) {
      this.log(`Guard failed for transition: ${key}`);
      return false;
    }

    const oldState = this.currentState;
    this.currentState = transition.to;
    this.metrics.stateTransitions++;

    this.log(`State transition: ${oldState} -> ${this.currentState}`);

    try {
      // Execute transition action
      if (transition.action) {
        await transition.action();
      }

      // Execute state handler
      const handler = this.stateHandlers.get(this.currentState);
      if (handler) {
        await handler();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.metrics.errorCount++;
      this.log(`Transition action failed: ${errorMessage}`);
      await this.processEvent(ComponentEvent.ERROR_OCCURRED);
      return false;
    }
  }

  /**
   * Initialize state handlers (abstract)
   */
  protected abstract initializeStateHandlers(): void;

  /**
   * Get current state
   */
  getCurrentState(): ComponentState {
    return this.currentState;
  }

  /**
   * Get component metrics
   */
  getMetrics(): ComponentMetrics {
    return { ...this.metrics };
  }

  /**
   * Log message if logging enabled
   * NASA Rule 10: ≤60 lines
   */
  protected log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[${this.config.componentId}] ${message}`);
    }
  }

  /**
   * Start processing workflow
   * NASA Rule 10: ≤60 lines
   */
  async start(): Promise<boolean> {
    if (this.currentState === ComponentState.UNINITIALIZED) {
      const initialized = await this.processEvent(ComponentEvent.INITIALIZE);
      if (!initialized) return false;
    }

    return await this.processEvent(ComponentEvent.START_PROCESSING);
  }

  /**
   * Stop processing workflow
   */
  async stop(): Promise<boolean> {
    return await this.processEvent(ComponentEvent.SHUTDOWN);
  }

  /**
   * Reset component to ready state
   */
  async reset(): Promise<boolean> {
    if (this.currentState === ComponentState.ERROR) {
      return await this.processEvent(ComponentEvent.RESET);
    }
    return true;
  }
}

/**
 * Component Core - Base functionality for decomposed components
 * NASA Rule 10: ≤60 lines per function
 */
export abstract class ComponentCore {
  protected initialized: boolean = false;
  protected config: any;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Initialize component
   */
  abstract async initialize(): Promise<void>;

  /**
   * Process data
   */
  abstract async process(data: any): Promise<any>;

  /**
   * Cleanup resources
   */
  abstract async cleanup(): Promise<void>;

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Component Facade - API preservation for god object elimination
 * NASA Rule 10: ≤60 lines per function
 */
export abstract class ComponentFacade {
  protected core: ComponentCore;
  protected fsm: MidRangeFSM;

  constructor(core: ComponentCore, fsm: MidRangeFSM) {
    this.core = core;
    this.fsm = fsm;
  }

  /**
   * Initialize facade and components
   */
  async initialize(): Promise<void> {
    if (!this.core.isInitialized()) {
      await this.core.initialize();
    }
    await this.fsm.start();
  }

  /**
   * Cleanup facade and components
   */
  async cleanup(): Promise<void> {
    await this.fsm.stop();
    await this.core.cleanup();
  }

  /**
   * Get component status
   */
  getStatus(): { state: ComponentState; metrics: ComponentMetrics } {
    return {
      state: this.fsm.getCurrentState(),
      metrics: this.fsm.getMetrics()
    };
  }
}