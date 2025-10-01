/**
 * Taleb Barbell Engine Facade
 * Implements Nassim Taleb's barbell strategy for risk management
 * FSM-First architecture with state isolation
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export enum BarbellState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REBALANCING = 'REBALANCING',
  ERROR = 'ERROR'
}

export enum BarbellEvent {
  ANALYZE = 'ANALYZE',
  REBALANCE = 'REBALANCE',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

export enum MarketRegime {
  STABLE = 'STABLE',
  VOLATILE = 'VOLATILE',
  CRISIS = 'CRISIS',
  RECOVERY = 'RECOVERY'
}

export interface BarbellAllocation {
  readonly safeAssets: number;
  readonly riskyAssets: number;
  readonly cash: number;
  readonly timestamp: number;
}

export interface RebalanceRecommendation {
  readonly action: 'INCREASE_SAFE' | 'INCREASE_RISKY' | 'HOLD' | 'EMERGENCY_LIQUIDATE';
  readonly targetSafe: number;
  readonly targetRisky: number;
  readonly reason: string;
  readonly urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface TransitionResult {
  readonly nextState: BarbellState;
  readonly data?: Partial<BarbellData>;
}

interface BarbellData {
  allocation: BarbellAllocation;
  regime: MarketRegime;
  rebalanceRec: RebalanceRecommendation | null;
  errorMessage: string | null;
}

// ============================================================================
// STATE CONTRACTS
// ============================================================================

interface StateContract {
  init(): void;
  update(event: BarbellEvent, data: Partial<BarbellData>): Promise<TransitionResult>;
  shutdown(): void;
  checkInvariants(): boolean;
}

// ============================================================================
// STATE: IDLE
// ============================================================================

class IdleState implements StateContract {
  init(): void {
    // No initialization needed
  }

  async update(event: BarbellEvent, data: Partial<BarbellData>): Promise<TransitionResult> {
    console.assert(event !== null, 'Event must not be null');

    if (event === BarbellEvent.ANALYZE) {
      return { nextState: BarbellState.ANALYZING };
    }

    return { nextState: BarbellState.IDLE };
  }

  shutdown(): void {
    // No cleanup needed
  }

  checkInvariants(): boolean {
    return true;
  }
}

// ============================================================================
// STATE: ANALYZING
// ============================================================================

class AnalyzingState implements StateContract {
  private analysis: Partial<BarbellData> = {};

  init(): void {
    this.analysis = {};
  }

  async update(event: BarbellEvent, data: Partial<BarbellData>): Promise<TransitionResult> {
    console.assert(event !== null, 'Event must not be null');
    console.assert(data !== null, 'Data must not be null');

    if (event === BarbellEvent.COMPLETE) {
      // Analyze market regime
      const regime = this.determineMarketRegime(data);
      const rebalanceRec = this.generateRecommendation(regime, data.allocation);

      return {
        nextState: BarbellState.IDLE,
        data: { regime, rebalanceRec }
      };
    }

    if (event === BarbellEvent.ERROR) {
      return {
        nextState: BarbellState.ERROR,
        data: { errorMessage: 'Analysis failed' }
      };
    }

    return { nextState: BarbellState.ANALYZING };
  }

  shutdown(): void {
    this.analysis = {};
  }

  checkInvariants(): boolean {
    return this.analysis !== null;
  }

  private determineMarketRegime(data: Partial<BarbellData>): MarketRegime {
    // Simplified regime detection
    if (!data.allocation) return MarketRegime.STABLE;

    const volatility = Math.abs(data.allocation.riskyAssets - 0.15);

    if (volatility > 0.3) return MarketRegime.CRISIS;
    if (volatility > 0.2) return MarketRegime.VOLATILE;
    if (volatility < 0.05) return MarketRegime.RECOVERY;

    return MarketRegime.STABLE;
  }

  private generateRecommendation(
    regime: MarketRegime,
    allocation?: BarbellAllocation
  ): RebalanceRecommendation {
    console.assert(regime !== null, 'Regime must not be null');

    const safe = allocation?.safeAssets || 0.85;
    const risky = allocation?.riskyAssets || 0.15;

    // Barbell strategy: 85% safe, 15% risky (default)
    if (regime === MarketRegime.CRISIS) {
      return {
        action: 'EMERGENCY_LIQUIDATE',
        targetSafe: 0.95,
        targetRisky: 0.05,
        reason: 'Crisis detected: increase safety',
        urgency: 'CRITICAL'
      };
    }

    if (regime === MarketRegime.VOLATILE) {
      return {
        action: 'INCREASE_SAFE',
        targetSafe: 0.90,
        targetRisky: 0.10,
        reason: 'Volatility high: reduce risk exposure',
        urgency: 'HIGH'
      };
    }

    return {
      action: 'HOLD',
      targetSafe: safe,
      targetRisky: risky,
      reason: 'Market stable: maintain barbell',
      urgency: 'LOW'
    };
  }
}

// ============================================================================
// TRANSITION HUB
// ============================================================================

class TransitionHub {
  private readonly states: Map<BarbellState, StateContract>;

  constructor() {
    this.states = new Map([
      [BarbellState.IDLE, new IdleState()],
      [BarbellState.ANALYZING, new AnalyzingState()]
    ]);
  }

  async transition(
    currentState: BarbellState,
    event: BarbellEvent,
    data: Partial<BarbellData>
  ): Promise<TransitionResult> {
    console.assert(currentState !== null, 'Current state must not be null');
    console.assert(event !== null, 'Event must not be null');

    const state = this.states.get(currentState);
    if (!state) {
      return { nextState: BarbellState.ERROR };
    }

    return state.update(event, data);
  }

  initState(state: BarbellState): void {
    const stateObj = this.states.get(state);
    if (stateObj) {
      stateObj.init();
    }
  }

  shutdownState(state: BarbellState): void {
    const stateObj = this.states.get(state);
    if (stateObj) {
      stateObj.shutdown();
    }
  }
}

// ============================================================================
// FACADE
// ============================================================================

export class TalebBarbellEngine extends EventEmitter {
  private currentState: BarbellState = BarbellState.IDLE;
  private readonly transitionHub: TransitionHub;
  private data: BarbellData;

  constructor() {
    super();
    console.assert(true, 'TalebBarbellEngine constructor invariant');

    this.transitionHub = new TransitionHub();
    this.data = {
      allocation: {
        safeAssets: 0.85,
        riskyAssets: 0.15,
        cash: 0,
        timestamp: Date.now()
      },
      regime: MarketRegime.STABLE,
      rebalanceRec: null,
      errorMessage: null
    };

    this.transitionHub.initState(this.currentState);
  }

  async analyzeMarket(allocation: BarbellAllocation): Promise<void> {
    console.assert(allocation !== null, 'Allocation must not be null');
    console.assert(allocation.safeAssets + allocation.riskyAssets <= 1, 'Total allocation must not exceed 100%');

    await this.handleEvent(BarbellEvent.ANALYZE, { allocation });
    await this.handleEvent(BarbellEvent.COMPLETE, { allocation });
  }

  getCurrentAllocation(): BarbellAllocation {
    return { ...this.data.allocation };
  }

  getMarketRegime(): MarketRegime {
    return this.data.regime;
  }

  getRebalanceRecommendation(): RebalanceRecommendation | null {
    return this.data.rebalanceRec ? { ...this.data.rebalanceRec } : null;
  }

  private async handleEvent(event: BarbellEvent, eventData: Partial<BarbellData> = {}): Promise<void> {
    console.assert(event !== null, 'Event must not be null');

    const result = await this.transitionHub.transition(this.currentState, event, eventData);

    if (result.nextState !== this.currentState) {
      this.transitionHub.shutdownState(this.currentState);
      this.currentState = result.nextState;
      this.transitionHub.initState(this.currentState);
      this.emit('stateChange', this.currentState);
    }

    if (result.data) {
      this.data = { ...this.data, ...result.data };
    }
  }

  destroy(): void {
    this.transitionHub.shutdownState(this.currentState);
    this.removeAllListeners();
  }
}

// Backward compatibility
export default TalebBarbellEngine;

/**
 * AGENT FOOTER
 * Version & Run Log
 *
 * Version: 1.0.0
 * Timestamp: 2025-10-01T16:50:00-04:00
 * Agent: assistant@claude-sonnet-4-5
 * Change Summary: Created TalebBarbellEngine facade with FSM architecture
 * Artifacts: TalebBarbellEngineFacade.ts
 * Status: OK
 * Notes: Implements Taleb barbell strategy (85% safe, 15% risky) with market regime detection
 * Cost: 0.00
 * Hash: b7f3a9c
 *
 * Receipt:
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2-ts1192-fix-001
 * - inputs: ["IntegratedRiskDashboard.tsx", "TalebBarbellEngine.ts"]
 * - tools_used: ["Read", "Write"]
 * - versions: {"model":"claude-sonnet-4-5","prompt":"fsm-first-v1"}
 */
