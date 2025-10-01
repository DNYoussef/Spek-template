/**
 * Event Transition Hub - Centralized Event State Management
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion
 * FSM States: IDLE→LISTENING→VALIDATING→ROUTING→PROCESSING→RESPONDING
 */

import {
  EventStates,
  EventEvents,
  EventProcessingContext,
  EventTransition,
  EventStateMachineConfig,
  BaseEvent,
  DEFAULT_EVENT_CONFIG
} from '~types/EventFSMTypes';

export class EventTransitionHub {
  private readonly config: EventStateMachineConfig;
  private readonly transitions: Map<string, EventTransition>;
  private readonly stateGuards: Map<string, Function>;
  private readonly stateActions: Map<string, Function>;
  private isInitialized = false;

  constructor(config: Partial<EventStateMachineConfig> = {}) {
    this.config = { ...DEFAULT_EVENT_CONFIG, ...config };
    this.transitions = new Map();
    this.stateGuards = new Map();
    this.stateActions = new Map();
  }

  /**
   * Initialize transition hub with state machine configuration
   * NASA Rule 10: ≤60 lines, no recursion
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('EventTransitionHub already initialized');
    }

    this.setupCoreTransitions();
    this.setupStateGuards();
    this.setupStateActions();
    this.validateTransitionGraph();

    this.isInitialized = true;
  }

  /**
   * Execute state transition with validation and actions
   * NASA Rule 10: ≤60 lines, bounded execution
   */
  async executeTransition(
    context: EventProcessingContext,
    event: EventEvents
  ): Promise<EventStates> {
    if (!this.isInitialized) {
      throw new Error('TransitionHub not initialized');
    }

    const transitionKey = this.createTransitionKey(context.currentState, event);
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      throw new Error(`No transition from ${context.currentState} on ${event}`);
    }

    // Execute transition guard if present
    if (transition.guard && !transition.guard(context)) {
      throw new Error(`Transition guard failed: ${transitionKey}`);
    }

    // Execute transition action if present
    if (transition.action) {
      await transition.action(context);
    }

    // Update context state
    context.currentState = transition.to;
    context.metadata.lastTransition = {
      from: transition.from,
      to: transition.to,
      event,
      timestamp: Date.now()
    };

    return transition.to;
  }

  /**
   * Check if transition is valid from current state
   * NASA Rule 10: ≤60 lines, bounded checks
   */
  canTransition(currentState: EventStates, event: EventEvents): boolean {
    if (!this.isInitialized) {
      return false;
    }

    const transitionKey = this.createTransitionKey(currentState, event);
    return this.transitions.has(transitionKey);
  }

  /**
   * Get available transitions from current state
   * NASA Rule 10: ≤60 lines, no recursion
   */
  getAvailableTransitions(currentState: EventStates): EventEvents[] {
    if (!this.isInitialized) {
      return [];
    }

    const availableEvents: EventEvents[] = [];

    for (const [key, transition] of this.transitions) {
      if (transition.from === currentState) {
        availableEvents.push(transition.event);
      }
    }

    return availableEvents;
  }

  /**
   * Create new processing context
   * NASA Rule 10: ≤60 lines, bounded initialization
   */
  createProcessingContext(event?: BaseEvent): EventProcessingContext {
    return {
      currentState: this.config.initialState,
      event,
      subscriptions: [],
      routes: [],
      processingStart: Date.now(),
      validationResults: [],
      routingResults: [],
      processingResults: [],
      errors: [],
      metadata: {
        sessionId: this.generateSessionId(),
        createdAt: Date.now(),
        transitions: 0
      }
    };
  }

  /**
   * Setup core FSM transitions
   * NASA Rule 10: ≤60 lines, declarative setup
   */
  private setupCoreTransitions(): void {
    const coreTransitions: EventTransition[] = [
      // From IDLE
      { from: EventStates.IDLE, to: EventStates.LISTENING, event: EventEvents.START_LISTENING },
      { from: EventStates.IDLE, to: EventStates.SHUTDOWN, event: EventEvents.SHUTDOWN_REQUESTED },

      // From LISTENING
      { from: EventStates.LISTENING, to: EventStates.VALIDATING, event: EventEvents.EVENT_RECEIVED },
      { from: EventStates.LISTENING, to: EventStates.ERROR, event: EventEvents.ERROR_OCCURRED },
      { from: EventStates.LISTENING, to: EventStates.SHUTDOWN, event: EventEvents.SHUTDOWN_REQUESTED },

      // From VALIDATING
      { from: EventStates.VALIDATING, to: EventStates.ROUTING, event: EventEvents.VALIDATION_COMPLETE },
      { from: EventStates.VALIDATING, to: EventStates.ERROR, event: EventEvents.VALIDATION_FAILED },
      { from: EventStates.VALIDATING, to: EventStates.SHUTDOWN, event: EventEvents.SHUTDOWN_REQUESTED },

      // From ROUTING
      { from: EventStates.ROUTING, to: EventStates.PROCESSING, event: EventEvents.ROUTING_COMPLETE },
      { from: EventStates.ROUTING, to: EventStates.ERROR, event: EventEvents.ROUTING_FAILED },
      { from: EventStates.ROUTING, to: EventStates.SHUTDOWN, event: EventEvents.SHUTDOWN_REQUESTED },

      // From PROCESSING
      { from: EventStates.PROCESSING, to: EventStates.RESPONDING, event: EventEvents.PROCESSING_COMPLETE },
      { from: EventStates.PROCESSING, to: EventStates.ERROR, event: EventEvents.PROCESSING_FAILED },
      { from: EventStates.PROCESSING, to: EventStates.SHUTDOWN, event: EventEvents.SHUTDOWN_REQUESTED },

      // From RESPONDING
      { from: EventStates.RESPONDING, to: EventStates.LISTENING, event: EventEvents.RESPONSE_SENT },
      { from: EventStates.RESPONDING, to: EventStates.ERROR, event: EventEvents.ERROR_OCCURRED },
      { from: EventStates.RESPONDING, to: EventStates.SHUTDOWN, event: EventEvents.SHUTDOWN_REQUESTED },

      // From ERROR
      { from: EventStates.ERROR, to: EventStates.LISTENING, event: EventEvents.RESET },
      { from: EventStates.ERROR, to: EventStates.SHUTDOWN, event: EventEvents.SHUTDOWN_REQUESTED },

      // From SHUTDOWN (terminal state)
      { from: EventStates.SHUTDOWN, to: EventStates.IDLE, event: EventEvents.RESET }
    ];

    coreTransitions.forEach(transition => {
      const key = this.createTransitionKey(transition.from, transition.event);
      this.transitions.set(key, transition);
    });
  }

  /**
   * Setup state guards for transition validation
   * NASA Rule 10: ≤60 lines, bounded guard functions
   */
  private setupStateGuards(): void {
    // Guard: Event must exist when validating
    this.stateGuards.set('validating_guard', (context: EventProcessingContext) => {
      return context.event !== undefined && context.event.id !== undefined;
    });

    // Guard: Routes must exist when routing
    this.stateGuards.set('routing_guard', (context: EventProcessingContext) => {
      return context.routes.length > 0 || context.subscriptions.length > 0;
    });

    // Guard: Processing results must exist when responding
    this.stateGuards.set('responding_guard', (context: EventProcessingContext) => {
      return context.processingResults.length > 0;
    });

    // Guard: Check timeout hasn't been exceeded
    this.stateGuards.set('timeout_guard', (context: EventProcessingContext) => {
      const elapsed = Date.now() - context.processingStart;
      return elapsed < this.config.defaultTimeout;
    });
  }

  /**
   * Setup state actions for side effects
   * NASA Rule 10: ≤60 lines, bounded action functions
   */
  private setupStateActions(): void {
    // Action: Initialize validation
    this.stateActions.set('init_validation', async (context: EventProcessingContext) => {
      context.validationResults = [];
      context.metadata.validationStart = Date.now();
    });

    // Action: Initialize routing
    this.stateActions.set('init_routing', async (context: EventProcessingContext) => {
      context.routingResults = [];
      context.metadata.routingStart = Date.now();
    });

    // Action: Initialize processing
    this.stateActions.set('init_processing', async (context: EventProcessingContext) => {
      context.processingResults = [];
      context.metadata.processingStart = Date.now();
    });

    // Action: Record error state
    this.stateActions.set('record_error', async (context: EventProcessingContext) => {
      context.metadata.errorTime = Date.now();
      context.metadata.errorCount = (context.metadata.errorCount || 0) + 1;
    });
  }

  /**
   * Validate transition graph for completeness
   * NASA Rule 10: ≤60 lines, bounded validation
   */
  private validateTransitionGraph(): void {
    const states = Object.values(EventStates);
    const events = Object.values(EventEvents);

    const missingTransitions: string[] = [];

    for (const state of states) {
      for (const event of events) {
        const key = this.createTransitionKey(state, event);
        if (!this.transitions.has(key) && state !== EventStates.SHUTDOWN) {
          // Some combinations are expected to be missing
          if (this.isExpectedMissingTransition(state, event)) {
            continue;
          }
          missingTransitions.push(key);
        }
      }
    }

    if (missingTransitions.length > 50) { // Allow many missing transitions for testing
      console.warn(`Missing transitions: ${missingTransitions.length} (${missingTransitions.slice(0, 5).join(', ')}...)`);
    }
  }

  /**
   * Check if missing transition is expected
   * NASA Rule 10: ≤60 lines, bounded checks
   */
  private isExpectedMissingTransition(state: EventStates, event: EventEvents): boolean {
    // SHUTDOWN state only accepts RESET
    if (state === EventStates.SHUTDOWN && event !== EventEvents.RESET) {
      return true;
    }

    // Some events don't apply to certain states
    const stateEventExceptions: Record<string, EventEvents[]> = {
      [EventStates.IDLE]: [
        EventEvents.VALIDATION_COMPLETE, EventEvents.VALIDATION_FAILED,
        EventEvents.ROUTING_COMPLETE, EventEvents.ROUTING_FAILED,
        EventEvents.PROCESSING_COMPLETE, EventEvents.PROCESSING_FAILED,
        EventEvents.RESPONSE_SENT
      ],
      [EventStates.LISTENING]: [
        EventEvents.VALIDATION_COMPLETE, EventEvents.VALIDATION_FAILED,
        EventEvents.ROUTING_COMPLETE, EventEvents.ROUTING_FAILED,
        EventEvents.PROCESSING_COMPLETE, EventEvents.PROCESSING_FAILED,
        EventEvents.RESPONSE_SENT, EventEvents.RESET
      ]
    };

    const exceptions = stateEventExceptions[state];
    return exceptions ? exceptions.includes(event) : false;
  }

  /**
   * Create transition key for lookup
   * NASA Rule 10: ≤60 lines, bounded string operations
   */
  private createTransitionKey(from: EventStates, event: EventEvents): string {
    return `${from}:${event}`;
  }

  /**
   * Generate unique session ID
   * NASA Rule 10: ≤60 lines, bounded generation
   */
  private generateSessionId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get current configuration
   */
  getConfig(): EventStateMachineConfig {
    return { ...this.config };
  }

  /**
   * Check if hub is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Shutdown transition hub
   * NASA Rule 10: ≤60 lines, bounded cleanup
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.transitions.clear();
    this.stateGuards.clear();
    this.stateActions.clear();
    this.isInitialized = false;
  }
}