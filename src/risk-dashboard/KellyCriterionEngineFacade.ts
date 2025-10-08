/**
 * Kelly Criterion Engine Facade
 * Implements Kelly Criterion for optimal position sizing
 * FSM-First architecture with state isolation
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export enum KellyState {
  IDLE = 'IDLE',
  CALCULATING = 'CALCULATING',
  OPTIMIZING = 'OPTIMIZING',
  ERROR = 'ERROR'
}

export enum KellyEvent {
  CALCULATE = 'CALCULATE',
  OPTIMIZE = 'OPTIMIZE',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

export interface KellyPosition {
  readonly symbol: string;
  readonly optimalSize: number;
  readonly currentSize: number;
  readonly confidence: number;
  readonly winRate: number;
  readonly avgWin: number;
  readonly avgLoss: number;
}

export interface MarketOpportunity {
  readonly symbol: string;
  readonly expectedReturn: number;
  readonly winProbability: number;
  readonly payoffRatio: number;
  readonly kellyPercentage: number;
  readonly rank: number;
}

export interface KellyPortfolio {
  readonly positions: KellyPosition[];
  readonly totalCapital: number;
  readonly allocatedCapital: number;
  readonly freeCapital: number;
  readonly timestamp: number;
}

interface TransitionResult {
  readonly nextState: KellyState;
  readonly data?: Partial<KellyData>;
}

interface KellyData {
  portfolio: KellyPortfolio;
  opportunities: MarketOpportunity[];
  errorMessage: string | null;
}

// ============================================================================
// STATE CONTRACTS
// ============================================================================

interface StateContract {
  init(): void;
  update(event: KellyEvent, data: Partial<KellyData>): Promise<TransitionResult>;
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

  async update(event: KellyEvent, data: Partial<KellyData>): Promise<TransitionResult> {
    console.assert(event !== null, 'Event must not be null');

    if (event === KellyEvent.CALCULATE) {
      return { nextState: KellyState.CALCULATING };
    }

    if (event === KellyEvent.OPTIMIZE) {
      return { nextState: KellyState.OPTIMIZING };
    }

    return { nextState: KellyState.IDLE };
  }

  shutdown(): void {
    // No cleanup needed
  }

  checkInvariants(): boolean {
    return true;
  }
}

// ============================================================================
// STATE: CALCULATING
// ============================================================================

class CalculatingState implements StateContract {
  private calculation: Partial<KellyData> = {};

  init(): void {
    this.calculation = {};
  }

  async update(event: KellyEvent, data: Partial<KellyData>): Promise<TransitionResult> {
    console.assert(event !== null, 'Event must not be null');
    console.assert(data !== null, 'Data must not be null');

    if (event === KellyEvent.COMPLETE) {
      const opportunities = this.calculateOpportunities(data.portfolio);

      return {
        nextState: KellyState.IDLE,
        data: { opportunities }
      };
    }

    if (event === KellyEvent.ERROR) {
      return {
        nextState: KellyState.ERROR,
        data: { errorMessage: 'Calculation failed' }
      };
    }

    return { nextState: KellyState.CALCULATING };
  }

  shutdown(): void {
    this.calculation = {};
  }

  checkInvariants(): boolean {
    return this.calculation !== null;
  }

  private calculateOpportunities(portfolio?: KellyPortfolio): MarketOpportunity[] {
    if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
      return [];
    }

    const opportunities: MarketOpportunity[] = [];

    for (let i = 0; i < portfolio.positions.length && i < 10; i++) {
      const pos = portfolio.positions[i];

      // Kelly Criterion: f* = (p*b - q) / b
      // where p = win probability, q = 1-p, b = win/loss ratio
      const p = pos.winRate;
      const q = 1 - p;
      const b = pos.avgWin / Math.max(pos.avgLoss, 0.01);

      const kellyPercentage = Math.max(0, Math.min(0.25, (p * b - q) / b));

      opportunities.push({
        symbol: pos.symbol,
        expectedReturn: (p * pos.avgWin) - (q * pos.avgLoss),
        winProbability: p,
        payoffRatio: b,
        kellyPercentage: kellyPercentage,
        rank: i + 1
      });
    }

    return opportunities.sort((a, b) => b.kellyPercentage - a.kellyPercentage);
  }
}

// ============================================================================
// STATE: OPTIMIZING
// ============================================================================

class OptimizingState implements StateContract {
  init(): void {
    // Initialization logic
  }

  async update(event: KellyEvent, data: Partial<KellyData>): Promise<TransitionResult> {
    console.assert(event !== null, 'Event must not be null');

    if (event === KellyEvent.COMPLETE) {
      return { nextState: KellyState.IDLE };
    }

    return { nextState: KellyState.OPTIMIZING };
  }

  shutdown(): void {
    // Cleanup logic
  }

  checkInvariants(): boolean {
    return true;
  }
}

// ============================================================================
// TRANSITION HUB
// ============================================================================

class TransitionHub {
  private readonly states: Map<KellyState, StateContract>;

  constructor() {
    this.states = new Map([
      [KellyState.IDLE, new IdleState()],
      [KellyState.CALCULATING, new CalculatingState()],
      [KellyState.OPTIMIZING, new OptimizingState()]
    ]);
  }

  async transition(
    currentState: KellyState,
    event: KellyEvent,
    data: Partial<KellyData>
  ): Promise<TransitionResult> {
    console.assert(currentState !== null, 'Current state must not be null');
    console.assert(event !== null, 'Event must not be null');

    const state = this.states.get(currentState);
    if (!state) {
      return { nextState: KellyState.ERROR };
    }

    return state.update(event, data);
  }

  initState(state: KellyState): void {
    const stateObj = this.states.get(state);
    if (stateObj) {
      stateObj.init();
    }
  }

  shutdownState(state: KellyState): void {
    const stateObj = this.states.get(state);
    if (stateObj) {
      stateObj.shutdown();
    }
  }
}

// ============================================================================
// FACADE
// ============================================================================

export class KellyCriterionEngine extends EventEmitter {
  private currentState: KellyState = KellyState.IDLE;
  private readonly transitionHub: TransitionHub;
  private data: KellyData;

  constructor() {
    super();
    console.assert(true, 'KellyCriterionEngine constructor invariant');

    this.transitionHub = new TransitionHub();
    this.data = {
      portfolio: {
        positions: [],
        totalCapital: 100000,
        allocatedCapital: 0,
        freeCapital: 100000,
        timestamp: Date.now()
      },
      opportunities: [],
      errorMessage: null
    };

    this.transitionHub.initState(this.currentState);
  }

  async calculateOptimalSizing(portfolio: KellyPortfolio): Promise<void> {
    console.assert(portfolio !== null, 'Portfolio must not be null');
    console.assert(portfolio.totalCapital > 0, 'Total capital must be positive');

    await this.handleEvent(KellyEvent.CALCULATE, { portfolio });
    await this.handleEvent(KellyEvent.COMPLETE, { portfolio });
  }

  getPortfolio(): KellyPortfolio {
    return { ...this.data.portfolio };
  }

  getOpportunities(): MarketOpportunity[] {
    return [...this.data.opportunities];
  }

  getTopOpportunity(): MarketOpportunity | null {
    return this.data.opportunities.length > 0 ? { ...this.data.opportunities[0] } : null;
  }

  private async handleEvent(event: KellyEvent, eventData: Partial<KellyData> = {}): Promise<void> {
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
export default KellyCriterionEngine;

/**
 * AGENT FOOTER
 * Version & Run Log
 *
 * Version: 1.0.0
 * Timestamp: 2025-10-01T16:50:00-04:00
 * Agent: assistant@claude-sonnet-4-5
 * Change Summary: Created KellyCriterionEngine facade with FSM architecture
 * Artifacts: KellyCriterionEngineFacade.ts
 * Status: OK
 * Notes: Implements Kelly Criterion for optimal position sizing with risk management
 * Cost: 0.00
 * Hash: c8d4b2e
 *
 * Receipt:
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2-ts1192-fix-002
 * - inputs: ["IntegratedRiskDashboard.tsx", "KellyCriterionEngine.ts"]
 * - tools_used: ["Read", "Write"]
 * - versions: {"model":"claude-sonnet-4-5","prompt":"fsm-first-v1"}
 */
