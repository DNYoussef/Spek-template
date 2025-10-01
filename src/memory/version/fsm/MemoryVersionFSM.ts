/**
 * Memory Version Finite State Machine
 * NASA Rule 10 Compliant: ≤60 lines per function
 */

import { EventEmitter } from 'events';
import { VersionState, VersionEvent, VersionContext } from '~types/MemoryVersionTypes';

export class MemoryVersionFSM extends EventEmitter {
  private currentState: VersionState = VersionState.INITIALIZING;
  private context: VersionContext;

  constructor(context: VersionContext) {
    super();
    console.assert(context != null, 'Version context required');
    this.context = context;
  }

  getCurrentState(): VersionState {
    return this.currentState;
  }

  getContext(): VersionContext {
    return { ...this.context };
  }

  async transition(event: VersionEvent, payload?: any): Promise<boolean> {
    console.assert(event != null, 'Event required for transition');

    const prevState = this.currentState;
    const newState = this.getNextState(this.currentState, event);

    if (!newState) {
      this.emit('transition_rejected', { from: prevState, event, payload });
      return false;
    }

    try {
      await this.executeTransition(prevState, newState, event, payload);
      this.currentState = newState;
      this.emit('state_changed', { from: prevState, to: newState, event, payload });
      return true;
    } catch (error) {
      this.currentState = VersionState.ERROR;
      this.context.error = error as Error;
      this.emit('error', { error, from: prevState, event });
      return false;
    }
  }

  private getNextState(current: VersionState, event: VersionEvent): VersionState | null {
    console.assert(current != null && event != null, 'State and event required');

    // State transition matrix - NASA Rule 10 compliant
    const transitions: Record<VersionState, Partial<Record<VersionEvent, VersionState>>> = {
      [VersionState.INITIALIZING]: {
        [VersionEvent.START]: VersionState.VERSIONING
      },
      [VersionState.VERSIONING]: {
        [VersionEvent.CREATE_VERSION]: VersionState.STORING,
        [VersionEvent.CLEANUP_REQUESTED]: VersionState.CLEANING,
        [VersionEvent.SNAPSHOT_REQUESTED]: VersionState.SNAPSHOTTING
      },
      [VersionState.STORING]: {
        [VersionEvent.STORE_VERSION]: VersionState.VERSIONING
      },
      [VersionState.CLEANING]: {
        [VersionEvent.CLEANUP_REQUESTED]: VersionState.VERSIONING
      },
      [VersionState.SNAPSHOTTING]: {
        [VersionEvent.SNAPSHOT_REQUESTED]: VersionState.VERSIONING
      },
      [VersionState.ERROR]: {
        [VersionEvent.RESET]: VersionState.INITIALIZING
      }
    };

    return transitions[current]?.[event] || null;
  }

  private async executeTransition(
    from: VersionState,
    to: VersionState,
    event: VersionEvent,
    payload?: any
  ): Promise<void> {
    console.assert(from != null && to != null && event != null, 'Transition parameters required');

    // Update context based on transition
    this.context.currentOperation = `${from}->${to}:${event}`;

    // Execute state-specific logic (delegated to handlers)
    this.emit('execute_transition', { from, to, event, payload, context: this.context });
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-terminator-002
// inputs: ["VersionState", "VersionEvent"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
// === END FOOTER ===