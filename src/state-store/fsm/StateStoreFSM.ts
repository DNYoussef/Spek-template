/**
 * State Store Finite State Machine
 * NASA Rule 10 Compliant: ≤60 lines per function
 */

import { EventEmitter } from 'events';
import { StateStoreState, StateStoreEvent, StateStoreContext } from '../types/StateStoreTypes';

export class StateStoreFSM extends EventEmitter {
  private currentState: StateStoreState = StateStoreState.INITIALIZING;
  private context: StateStoreContext;

  constructor(context: StateStoreContext) {
    super();
    console.assert(context != null, 'State store context required');
    this.context = context;
  }

  getCurrentState(): StateStoreState {
    return this.currentState;
  }

  getContext(): StateStoreContext {
    return { ...this.context };
  }

  async transition(event: StateStoreEvent, payload?: any): Promise<boolean> {
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
      this.currentState = StateStoreState.ERROR;
      this.context.error = error as Error;
      this.emit('error', { error, from: prevState, event });
      return false;
    }
  }

  private getNextState(current: StateStoreState, event: StateStoreEvent): StateStoreState | null {
    console.assert(current != null && event != null, 'State and event required');

    // State transition matrix - NASA Rule 10 compliant
    const transitions: Record<StateStoreState, Partial<Record<StateStoreEvent, StateStoreState>>> = {
      [StateStoreState.INITIALIZING]: {
        [StateStoreEvent.START]: StateStoreState.TRANSACTING
      },
      [StateStoreState.TRANSACTING]: {
        [StateStoreEvent.BEGIN_TRANSACTION]: StateStoreState.TRANSACTING,
        [StateStoreEvent.COMMIT_TRANSACTION]: StateStoreState.PERSISTING,
        [StateStoreEvent.ROLLBACK_TRANSACTION]: StateStoreState.TRANSACTING,
        [StateStoreEvent.BACKUP_REQUESTED]: StateStoreState.BACKING_UP,
        [StateStoreEvent.RECOVERY_REQUESTED]: StateStoreState.RECOVERING
      },
      [StateStoreState.PERSISTING]: {
        [StateStoreEvent.PERSIST_STATE]: StateStoreState.TRANSACTING
      },
      [StateStoreState.BACKING_UP]: {
        [StateStoreEvent.BACKUP_REQUESTED]: StateStoreState.TRANSACTING
      },
      [StateStoreState.RECOVERING]: {
        [StateStoreEvent.RECOVERY_REQUESTED]: StateStoreState.TRANSACTING
      },
      [StateStoreState.ERROR]: {
        [StateStoreEvent.RESET]: StateStoreState.INITIALIZING
      }
    };

    return transitions[current]?.[event] || null;
  }

  private async executeTransition(
    from: StateStoreState,
    to: StateStoreState,
    event: StateStoreEvent,
    payload?: any
  ): Promise<void> {
    console.assert(from != null && to != null && event != null, 'Transition parameters required');

    // Update context based on transition
    switch (event) {
      case StateStoreEvent.BEGIN_TRANSACTION:
        this.context.currentTransaction = payload?.transaction;
        break;
      case StateStoreEvent.COMMIT_TRANSACTION:
      case StateStoreEvent.ROLLBACK_TRANSACTION:
        this.context.currentTransaction = undefined;
        break;
      case StateStoreEvent.BACKUP_REQUESTED:
        this.context.lastBackup = new Date();
        break;
    }

    // Execute state-specific logic (delegated to handlers)
    this.emit('execute_transition', { from, to, event, payload, context: this.context });
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0 | 2025-09-28T19:15:45-04:00 | mega-agent-103@claude-sonnet-4 | State store FSM with state transitions | StateStoreFSM.ts | OK | Clean FSM implementation ≤60 lines per function | 0.00 | k1l2m3n |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: memory-terminator-010
- inputs: ["StateStoreState", "StateStoreEvent"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->