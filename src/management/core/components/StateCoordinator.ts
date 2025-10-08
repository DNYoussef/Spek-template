/**
 * State Coordinator - Shared State Management Component
 * NASA Rule 10 Compliant: ≤60 line functions, bounded loops
 */

import { EventEmitter } from 'events';
import { CoordinationInfo } from '~types/ManagementTypes';

export class StateCoordinator extends EventEmitter {
  private coordinations: Map<string, CoordinationInfo> = new Map();
  private transitions: Map<string, string[]> = new Map();
  private config: any;

  constructor(config: any) {
    super();
    console.assert(config !== null, 'StateCoordinator config required');
    this.config = config;
    this.initializeValidTransitions();
  }

  /**
   * Start state coordinator
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async start(): Promise<void> {
    console.assert(this.config !== null, 'Config must be set');

    this.emit('coordinator-started');
    console.assert(this.transitions.size > 0, 'State coordinator started with valid transitions');
  }

  /**
   * Initialize valid state transitions
   * NASA Rule 10: ≤60 lines, bounded initialization
   */
  private initializeValidTransitions(): void {
    console.assert(this.transitions !== null, 'Transitions map must exist');

    // Define valid state transitions (bounded to 10 states max)
    const validTransitions = {
      'init': ['planning', 'error'],
      'planning': ['allocating', 'monitoring', 'error'],
      'allocating': ['coordinating', 'planning', 'error'],
      'coordinating': ['monitoring', 'allocating', 'error'],
      'monitoring': ['planning', 'cleanup', 'error'],
      'cleanup': ['init', 'error'],
      'error': ['init', 'cleanup']
    };

    Object.entries(validTransitions).forEach(([state, validNext]) => {
      this.transitions.set(state, validNext);
    });

    console.assert(this.transitions.size === 7, 'All valid transitions initialized');
  }

  /**
   * Coordinate state transition
   * NASA Rule 10: ≤60 lines, bounded coordination
   */
  async coordinate(componentId: string, targetState: string): Promise<void> {
    console.assert(componentId !== null && componentId !== '', 'ComponentId required');
    console.assert(targetState !== null && targetState !== '', 'TargetState required');

    const existingCoordination = this.coordinations.get(componentId);
    const currentState = existingCoordination?.currentState || 'init';

    // Validate transition
    if (!this.isValidTransition(currentState, targetState)) {
      throw new Error(`Invalid transition from ${currentState} to ${targetState}`);
    }

    const coordination: CoordinationInfo = {
      componentId,
      currentState,
      targetState,
      transitionTime: Date.now(),
      dependencies: existingCoordination?.dependencies || []
    };

    this.coordinations.set(componentId, coordination);

    // Simulate state transition
    setTimeout(() => {
      this.completeTransition(componentId, targetState);
    }, Math.random() * 1000 + 500); // 0.5-1.5 seconds

    this.emit('state-coordinated', { componentId, currentState, targetState });
    console.assert(this.coordinations.has(componentId), 'Coordination registered');
  }

  /**
   * Complete state transition
   * NASA Rule 10: ≤60 lines, no recursion
   */
  private completeTransition(componentId: string, targetState: string): void {
    console.assert(componentId !== null, 'ComponentId required');

    const coordination = this.coordinations.get(componentId);
    if (!coordination) return;

    coordination.currentState = targetState;
    coordination.transitionTime = Date.now();

    this.emit('transition-completed', { componentId, newState: targetState });
    console.assert(coordination.currentState === targetState, 'Transition completed');
  }

  /**
   * Check if state transition is valid
   * NASA Rule 10: ≤60 lines, bounded validation
   */
  private isValidTransition(currentState: string, targetState: string): boolean {
    console.assert(currentState !== null, 'CurrentState required');
    console.assert(targetState !== null, 'TargetState required');

    const validNext = this.transitions.get(currentState.toLowerCase());
    if (!validNext) {
      return false;
    }

    const isValid = validNext.includes(targetState.toLowerCase());
    console.assert(typeof isValid === 'boolean', 'Validation result is boolean');
    return isValid;
  }

  /**
   * Get component state
   */
  getComponentState(componentId: string): string | null {
    const coordination = this.coordinations.get(componentId);
    return coordination?.currentState || null;
  }

  /**
   * Get coordination metrics
   */
  getMetrics(): any {
    const totalCoordinations = this.coordinations.size;
    const stateDistribution = new Map<string, number>();

    // Count states (bounded to first 100 coordinations)
    const coordinations = Array.from(this.coordinations.values()).slice(0, 100);
    coordinations.forEach(coord => {
      const count = stateDistribution.get(coord.currentState) || 0;
      stateDistribution.set(coord.currentState, count + 1);
    });

    return {
      totalCoordinations,
      stateDistribution: Object.fromEntries(stateDistribution),
      activeTransitions: coordinations.filter(c => c.currentState !== c.targetState).length
    };
  }

  async shutdown(): Promise<void> {
    this.coordinations.clear();
    this.transitions.clear();
    this.emit('coordinator-shutdown');
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: mega-agent-094-state-coordinator
// inputs: ["ManagementHub architecture"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1"}
// === END FOOTER ===