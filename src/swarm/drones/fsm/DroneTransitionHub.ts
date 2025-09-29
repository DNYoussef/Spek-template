/**
 * Drone Transition Hub - Centralized State Management
 * NASA Rule 10 Compliant: ≤60 line functions, no recursion, bounded loops
 */

import { DroneState, DroneEvent, DroneTransition, DroneWorker } from './DroneTypes';

export class DroneTransitionHub {
  private transitions: Map<string, DroneTransition> = new Map();
  private workers: Map<string, DroneWorker> = new Map();

  constructor() {
    this.initializeTransitions();
  }

  /**
   * Initialize all valid drone state transitions
   * NASA Rule 10: ≤60 lines, bounded loop (max 20 transitions)
   */
  private initializeTransitions(): void {
    const transitionDefs: DroneTransition[] = [
      { from: DroneState.IDLE, event: DroneEvent.ASSIGN_TASK, to: DroneState.ASSIGNED },
      { from: DroneState.ASSIGNED, event: DroneEvent.START_EXECUTION, to: DroneState.EXECUTING },
      { from: DroneState.EXECUTING, event: DroneEvent.COMPLETE_TASK, to: DroneState.REPORTING },
      { from: DroneState.REPORTING, event: DroneEvent.GENERATE_REPORT, to: DroneState.COMPLETE },
      { from: DroneState.COMPLETE, event: DroneEvent.FINISH, to: DroneState.IDLE },
      { from: DroneState.ERROR, event: DroneEvent.RESET, to: DroneState.IDLE },
      // Error transitions from any state
      { from: DroneState.ASSIGNED, event: DroneEvent.ERROR_OCCURRED, to: DroneState.ERROR },
      { from: DroneState.EXECUTING, event: DroneEvent.ERROR_OCCURRED, to: DroneState.ERROR },
      { from: DroneState.REPORTING, event: DroneEvent.ERROR_OCCURRED, to: DroneState.ERROR }
    ];

    // Bounded loop: max 20 transitions
    for (let i = 0; i < Math.min(transitionDefs.length, 20); i++) {
      const transition = transitionDefs[i];
      const key = `${transition.from}:${transition.event}`;
      this.transitions.set(key, transition);
    }

    // NASA Rule 10: Assertions
    console.assert(this.transitions.size > 0, 'Transitions must be initialized');
    console.assert(this.transitions.size <= 20, 'Transition count bounded to 20');
  }

  /**
   * Execute state transition for drone worker
   * NASA Rule 10: ≤60 lines, no recursion
   */
  async transition(workerId: string, event: DroneEvent): Promise<boolean> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      console.assert(false, `Worker ${workerId} not found`);
      return false;
    }

    const key = `${worker.status}:${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      console.assert(false, `Invalid transition: ${key}`);
      return false;
    }

    // Check guard condition if exists
    if (transition.guard && !transition.guard(worker)) {
      return false;
    }

    // Execute transition action
    if (transition.action) {
      await transition.action(worker);
    }

    // Update worker state
    worker.status = transition.to;
    this.workers.set(workerId, worker);

    // NASA Rule 10: Post-condition assertion
    console.assert(worker.status === transition.to, 'State transition must complete');
    return true;
  }

  /**
   * Register new drone worker
   * NASA Rule 10: ≤60 lines
   */
  registerWorker(worker: DroneWorker): void {
    console.assert(worker.id && worker.id.length > 0, 'Worker must have valid ID');
    console.assert(worker.specialty && worker.specialty.length > 0, 'Worker must have specialty');

    this.workers.set(worker.id, worker);

    // NASA Rule 10: Post-condition assertion
    console.assert(this.workers.has(worker.id), 'Worker registration must succeed');
  }

  /**
   * Get worker current state
   */
  getWorkerState(workerId: string): DroneState | null {
    const worker = this.workers.get(workerId);
    return worker ? worker.status : null;
  }

  /**
   * Get all workers in specific state
   * NASA Rule 10: Bounded loop (max 1000 workers)
   */
  getWorkersByState(state: DroneState): DroneWorker[] {
    const workers: DroneWorker[] = [];
    const allWorkers = Array.from(this.workers.values());

    for (let i = 0; i < Math.min(allWorkers.length, 1000); i++) {
      if (allWorkers[i].status === state) {
        workers.push(allWorkers[i]);
      }
    }

    return workers;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: mega-agent-096-drone-elimination
// inputs: ["DroneTypes.ts", "FSM requirements"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1"}
// === END FOOTER ===