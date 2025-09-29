/**
 * Facade for FallbackChainManager with FSM-based implementation.
 * NASA Rule 10 compliant: functions ≤60 lines, delegates to focused components.
 *
 * This facade provides the public API while delegating to FSM components.
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';
import { FallbackStateMachine } from './states/FallbackStateMachine';
import { TransitionHub } from './core/TransitionHub';
import { ChainBuilder } from './builders/ChainBuilder';
import { HealthMonitor } from './monitoring/HealthMonitor';
import { ProtocolRegistry } from './ProtocolRegistry';
import { ActivationEngine } from './ActivationEngine';
import {
  FallbackProtocol,
  FallbackChain,
  FailoverResult,
  ActivationContext,
  ProtocolHealth,
  ChainHealthStatus,
  TestResult,
  TestOptions,
  FallbackActivation,
  ActivationHistoryFilters
} from './types/FallbackChainTypes';

/**
 * Main facade for fallback chain management.
 * Delegates all operations to focused FSM components.
 */
export class FallbackChainFacade extends EventEmitter {
  private readonly logger: Logger;
  private readonly stateMachine: FallbackStateMachine;
  private readonly transitionHub: TransitionHub;
  private readonly chainBuilder: ChainBuilder;
  private readonly healthMonitor: HealthMonitor;
  private readonly protocolRegistry: ProtocolRegistry;
  private readonly activationEngine: ActivationEngine;

  constructor() {
    super();
    this.logger = new Logger('FallbackChainFacade');

    // Initialize core components
    this.transitionHub = new TransitionHub();
    this.stateMachine = new FallbackStateMachine(this.transitionHub);
    this.chainBuilder = new ChainBuilder();
    this.healthMonitor = new HealthMonitor();
    this.protocolRegistry = new ProtocolRegistry();
    this.activationEngine = new ActivationEngine(this.stateMachine, this.transitionHub);

    this.initializeComponents();
  }

  /**
   * Build fallback chain for migration path.
   * NASA Rule 10 compliant: delegates to ChainBuilder.
   */
  async buildFallbackChain(
    sourceVersion: string,
    targetVersion: string,
    migrationStrategy: any
  ): Promise<FallbackProtocol[]> {
    this.logger.info('Building fallback chain', { sourceVersion, targetVersion });

    return this.chainBuilder.buildChain(
      sourceVersion,
      targetVersion,
      migrationStrategy
    );
  }

  /**
   * Register fallback protocol.
   * NASA Rule 10 compliant: delegates to ProtocolRegistry.
   */
  async registerFallbackProtocol(protocol: FallbackProtocol): Promise<void> {
    this.logger.info('Registering protocol', { protocolId: protocol.id });

    await this.protocolRegistry.registerProtocol(protocol);
    this.emit('protocolRegistered', protocol);
  }

  /**
   * Activate fallback protocol.
   * NASA Rule 10 compliant: delegates to ActivationEngine.
   */
  async activateProtocol(
    protocolId: string,
    reason: string,
    context: ActivationContext = {}
  ): Promise<FailoverResult> {
    this.logger.info('Activating protocol', { protocolId, reason });

    return this.activationEngine.activateProtocol(protocolId, reason, context);
  }

  /**
   * Deactivate fallback protocol.
   * NASA Rule 10 compliant: delegates to ActivationEngine.
   */
  async deactivateProtocol(protocolId: string, reason: string): Promise<void> {
    this.logger.info('Deactivating protocol', { protocolId, reason });

    await this.activationEngine.deactivateProtocol(protocolId, reason);
  }

  /**
   * Get protocol health status.
   * NASA Rule 10 compliant: delegates to HealthMonitor.
   */
  async getProtocolHealth(protocolId: string): Promise<ProtocolHealth> {
    return this.healthMonitor.getProtocolHealth(protocolId);
  }

  /**
   * Get chain health status.
   * NASA Rule 10 compliant: delegates to HealthMonitor.
   */
  async getChainHealth(chainId: string): Promise<ChainHealthStatus> {
    return this.healthMonitor.getChainHealth(chainId);
  }

  /**
   * Test fallback chain.
   * NASA Rule 10 compliant: delegates to HealthMonitor.
   */
  async testFallbackChain(
    chainId: string,
    options: TestOptions = {}
  ): Promise<TestResult> {
    this.logger.info('Testing fallback chain', { chainId, options });

    return this.healthMonitor.testChain(chainId, options);
  }

  /**
   * Get activation history.
   * NASA Rule 10 compliant: delegates to ActivationEngine.
   */
  getActivationHistory(filters: ActivationHistoryFilters = {}): FallbackActivation[] {
    return this.activationEngine.getActivationHistory(filters);
  }

  /**
   * Get available protocols.
   * NASA Rule 10 compliant: delegates to ProtocolRegistry.
   */
  getAvailableProtocols(): FallbackProtocol[] {
    return this.protocolRegistry.getAvailableProtocols();
  }

  /**
   * Get registered chains.
   * NASA Rule 10 compliant: delegates to ChainBuilder.
   */
  getRegisteredChains(): FallbackChain[] {
    return this.chainBuilder.getRegisteredChains();
  }

  /**
   * Get FSM current state.
   * NASA Rule 10 compliant: delegates to StateMachine.
   */
  getCurrentState(): string {
    return this.stateMachine.getCurrentState();
  }

  /**
   * Get system statistics.
   * NASA Rule 10 compliant: aggregates from components.
   */
  getSystemStats(): {
    currentState: string;
    protocolCount: number;
    chainCount: number;
    activeProtocols: number;
    transitionStats: any;
  } {
    return {
      currentState: this.stateMachine.getCurrentState(),
      protocolCount: this.protocolRegistry.getProtocolCount(),
      chainCount: this.chainBuilder.getChainCount(),
      activeProtocols: this.activationEngine.getActiveProtocolCount(),
      transitionStats: this.transitionHub.getTransitionStats()
    };
  }

  /**
   * Initialize all components.
   * NASA Rule 10 compliant: setup delegation.
   */
  private initializeComponents(): void {
    // Setup FSM
    this.stateMachine.initialize();

    // Setup event forwarding
    this.stateMachine.on('stateChanged', (event) => {
      this.emit('stateChanged', event);
    });

    this.healthMonitor.on('healthChanged', (event) => {
      this.emit('healthChanged', event);
    });

    this.activationEngine.on('protocolActivated', (event) => {
      this.emit('protocolActivated', event);
    });

    this.activationEngine.on('protocolDeactivated', (event) => {
      this.emit('protocolDeactivated', event);
    });

    this.logger.info('FallbackChainFacade initialized successfully');
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fallback-fsm-refactor-004
// inputs: ["FallbackChainManager.ts", "FallbackStateMachine.ts", "TransitionHub.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-facade-v1"}
// === END FOOTER ===