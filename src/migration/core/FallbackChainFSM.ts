/**
 * Fallback Chain Manager State Machine - FSM Controller
 * NASA Rule 10 compliant with fallback protocol lifecycle management
 */

import { EventEmitter } from 'events';
import { FallbackStates, FallbackEvents, FallbackContext } from '~types/FallbackChainTypes';
// TODO(Phase 4): Implement state handler - import { AnalyzingStateHandler } from './states/AnalyzingStateHandler';
// TODO(Phase 4): Implement state handler - import { ActivatingStateHandler } from './states/ActivatingStateHandler';
// TODO(Phase 4): Implement state handler - import { ActiveStateHandler } from './states/ActiveStateHandler';
// TODO(Phase 4): Implement state handler - import { FailingOverStateHandler } from './states/FailingOverStateHandler';
// TODO(Phase 4): Implement state handler - import { RecoveringStateHandler } from './states/RecoveringStateHandler';
// TODO(Phase 4): Implement FSM core - import { FallbackErrorHandler } from './core/FallbackErrorHandler';
// TODO(Phase 4): Implement FSM core - import { FallbackTransitionGuard } from './core/FallbackTransitionGuard';

export class FallbackChainFSM extends EventEmitter {
  private currentState: FallbackStates = FallbackStates.IDLE;
  private context: FallbackContext;
  private stateHandlers: Map<FallbackStates, any> = new Map();
  private errorHandler: FallbackErrorHandler;
  private transitionGuard: FallbackTransitionGuard;

  constructor() {
    super();

    this.context = {
      fallbackChains: new Map(),
      activeProtocols: new Map(),
      activationHistory: [],
      healthMonitor: null,
      chainBuilder: null,
      protocolFactory: null,
      activationValidator: null,
      currentChain: null,
      currentProtocol: null,
      lastActivationResult: null
    };

    this.initializeStateHandlers();
    this.errorHandler = new FallbackErrorHandler();
    this.transitionGuard = new FallbackTransitionGuard();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeStateHandlers(): void {
    // Assertion 1: State handlers map exists
    if (!(this.stateHandlers instanceof Map)) {
      throw new Error('State handlers map must be initialized');
    }

    this.stateHandlers.set(FallbackStates.IDLE, null);
    this.stateHandlers.set(FallbackStates.ANALYZING, new AnalyzingStateHandler());
    this.stateHandlers.set(FallbackStates.ACTIVATING, new ActivatingStateHandler());
    this.stateHandlers.set(FallbackStates.ACTIVE, new ActiveStateHandler());
    this.stateHandlers.set(FallbackStates.FAILING_OVER, new FailingOverStateHandler());
    this.stateHandlers.set(FallbackStates.RECOVERING, new RecoveringStateHandler());
    this.stateHandlers.set(FallbackStates.ERROR, this.errorHandler);

    // Assertion 2: All required states have handlers or null (idle states)
    const requiredStates = Object.values(FallbackStates);
    for (const state of requiredStates) {
      if (!this.stateHandlers.has(state)) {
        throw new Error(`Missing state handler for ${state}`);
      }
    }
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async transition(event: FallbackEvents, data?: any): Promise<boolean> {
    // Assertion 1: Valid event provided
    if (!event || typeof event !== 'string') {
      throw new Error('Invalid event provided for transition');
    }

    const targetState = this.getTargetState(this.currentState, event);

    if (!targetState) {
      this.emit('transition:invalid', { from: this.currentState, event });
      return false;
    }

    // Assertion 2: Transition guard allows transition
    if (!this.transitionGuard.canTransition(this.currentState, targetState, this.context)) {
      this.emit('transition:blocked', { from: this.currentState, to: targetState, event });
      return false;
    }

    try {
      // Exit current state
      await this.exitState(this.currentState);

      // Transition
      const previousState = this.currentState;
      this.currentState = targetState;

      // Enter new state
      await this.enterState(targetState, data);

      this.emit('transition:completed', { from: previousState, to: targetState, event });
      return true;

    } catch (error) {
      await this.handleTransitionError(error, event, data);
      return false;
    }
  }

  /**
   * Get target state for event (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private getTargetState(currentState: FallbackStates, event: FallbackEvents): FallbackStates | null {
    // Assertion 1: Valid current state
    if (!currentState || typeof currentState !== 'string') {
      throw new Error('Invalid current state provided');
    }

    const transitions: Record<FallbackStates, Partial<Record<FallbackEvents, FallbackStates>>> = {
      [FallbackStates.IDLE]: {
        [FallbackEvents.ANALYZE_REQUEST]: FallbackStates.ANALYZING,
        [FallbackEvents.ACTIVATION_NEEDED]: FallbackStates.ACTIVATING
      },
      [FallbackStates.ANALYZING]: {
        [FallbackEvents.ANALYSIS_COMPLETE]: FallbackStates.IDLE,
        [FallbackEvents.ACTIVATION_NEEDED]: FallbackStates.ACTIVATING,
        [FallbackEvents.ERROR]: FallbackStates.ERROR
      },
      [FallbackStates.ACTIVATING]: {
        [FallbackEvents.ACTIVATION_COMPLETE]: FallbackStates.ACTIVE,
        [FallbackEvents.ACTIVATION_FAILED]: FallbackStates.ERROR,
        [FallbackEvents.ERROR]: FallbackStates.ERROR
      },
      [FallbackStates.ACTIVE]: {
        [FallbackEvents.PROTOCOL_FAILED]: FallbackStates.FAILING_OVER,
        [FallbackEvents.DEACTIVATION_REQUESTED]: FallbackStates.IDLE,
        [FallbackEvents.ERROR]: FallbackStates.ERROR
      },
      [FallbackStates.FAILING_OVER]: {
        [FallbackEvents.FAILOVER_COMPLETE]: FallbackStates.ACTIVE,
        [FallbackEvents.RECOVERY_NEEDED]: FallbackStates.RECOVERING,
        [FallbackEvents.ERROR]: FallbackStates.ERROR
      },
      [FallbackStates.RECOVERING]: {
        [FallbackEvents.RECOVERY_COMPLETE]: FallbackStates.IDLE,
        [FallbackEvents.ERROR]: FallbackStates.ERROR
      },
      [FallbackStates.ERROR]: {
        [FallbackEvents.RESET]: FallbackStates.IDLE,
        [FallbackEvents.RETRY]: FallbackStates.ANALYZING
      }
    };

    // Assertion 2: Transitions exist for current state
    const stateTransitions = transitions[currentState];
    if (!stateTransitions) {
      return null;
    }

    return stateTransitions[event] || null;
  }

  /**
   * Public API methods
   */
  async buildFallbackChain(sourceVersion: string, targetVersion: string, migrationStrategy: any): Promise<any[]> {
    const success = await this.transition(FallbackEvents.ANALYZE_REQUEST, {
      sourceVersion, targetVersion, migrationStrategy
    });
    return this.context.currentChain ? this.context.currentChain.protocols : [];
  }

  async registerFallbackProtocol(protocol: any): Promise<void> {
    // Store protocol in context
    this.context.activeProtocols.set(protocol.id, protocol);
    this.emit('protocolRegistered', protocol);
  }

  async activateProtocol(protocolId: string, reason: string, context: any = {}): Promise<any> {
    const success = await this.transition(FallbackEvents.ACTIVATION_NEEDED, {
      protocolId, reason, context
    });
    return this.context.lastActivationResult;
  }

  async deactivateProtocol(protocolId: string, reason: string = 'Manual deactivation'): Promise<void> {
    await this.transition(FallbackEvents.DEACTIVATION_REQUESTED, { protocolId, reason });
  }

  async checkChainHealth(chainId: string): Promise<any> {
    const chain = this.context.fallbackChains.get(chainId);
    if (!chain) {
      throw new Error(`Fallback chain not found: ${chainId}`);
    }

    if (this.context.healthMonitor) {
      return await this.context.healthMonitor.checkChainHealth(chain);
    }

    return { status: 'unknown', message: 'Health monitor not initialized' };
  }

  async testFallbackChain(chainId: string, options: any = {}): Promise<any> {
    const chain = this.context.fallbackChains.get(chainId);
    if (!chain) {
      throw new Error(`Fallback chain not found: ${chainId}`);
    }

    if (this.context.healthMonitor) {
      return await this.context.healthMonitor.testChain(chain, options);
    }

    return { success: false, message: 'Health monitor not initialized' };
  }

  getActivationHistory(limit: number = 100, filters: any = {}): any[] {
    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    let filtered = [...this.context.activationHistory];

    // Apply filters
    if (filters.protocolId) {
      filtered = filtered.filter((a: any) => a.protocolId === filters.protocolId);
    }
    if (filters.chainId) {
      filtered = filtered.filter((a: any) => a.chainId === filters.chainId);
    }

    return filtered
      .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, safeLimit);
  }

  startMonitoring(): void {
    if (this.context.healthMonitor) {
      this.context.healthMonitor.startMonitoring();
    }
  }

  stopMonitoring(): void {
    if (this.context.healthMonitor) {
      this.context.healthMonitor.stopMonitoring();
    }
  }

  getCurrentState(): FallbackStates {
    return this.currentState;
  }

  getContext(): FallbackContext {
    return { ...this.context };
  }

  // State management helpers
  private async exitState(state: FallbackStates): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: FallbackStates, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: FallbackEvents, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = FallbackStates.ERROR;
    await this.enterState(FallbackStates.ERROR, { error, event, data });
  }
}