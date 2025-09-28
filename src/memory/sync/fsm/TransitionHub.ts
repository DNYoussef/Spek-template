/**
 * Centralized Transition Hub for Distributed Memory Sync FSM
 * NASA Rule 10 Compliant: ≤60 lines per function, clear control flow
 */

import { SyncState, SyncEvent, SyncTransition, SyncContext } from './SyncTypes';

export class TransitionHub {
  private transitions = new Map<string, SyncTransition>();

  constructor() {
    this.initializeTransitions();
  }

  getTransition(fromState: SyncState, event: SyncEvent): SyncTransition | null {
    const key = this.getTransitionKey(fromState, event);
    return this.transitions.get(key) || null;
  }

  private getTransitionKey(fromState: SyncState, event: SyncEvent): string {
    return `${fromState}->${event}`;
  }

  private addTransition(transition: SyncTransition): void {
    const key = this.getTransitionKey(transition.fromState, transition.event);
    this.transitions.set(key, transition);
  }

  private initializeTransitions(): void {
    // INIT state transitions
    this.addTransition({
      fromState: SyncState.INIT,
      event: SyncEvent.START,
      toState: SyncState.CONNECTING
    });

    // CONNECTING state transitions
    this.addTransition({
      fromState: SyncState.CONNECTING,
      event: SyncEvent.NODES_DISCOVERED,
      toState: SyncState.SYNCING,
      guard: this.hasOnlineNodes
    });

    this.addTransition({
      fromState: SyncState.CONNECTING,
      event: SyncEvent.ERROR_OCCURRED,
      toState: SyncState.ERROR_RECOVERY
    });

    // SYNCING state transitions
    this.addTransition({
      fromState: SyncState.SYNCING,
      event: SyncEvent.CONFLICTS_DETECTED,
      toState: SyncState.RESOLVING_CONFLICTS
    });

    this.addTransition({
      fromState: SyncState.SYNCING,
      event: SyncEvent.SYNC_COMPLETE,
      toState: SyncState.BROADCASTING
    });

    this.addTransition({
      fromState: SyncState.SYNCING,
      event: SyncEvent.ERROR_OCCURRED,
      toState: SyncState.ERROR_RECOVERY
    });

    // RESOLVING_CONFLICTS state transitions
    this.addTransition({
      fromState: SyncState.RESOLVING_CONFLICTS,
      event: SyncEvent.CONFLICTS_RESOLVED,
      toState: SyncState.BROADCASTING
    });

    this.addTransition({
      fromState: SyncState.RESOLVING_CONFLICTS,
      event: SyncEvent.ERROR_OCCURRED,
      toState: SyncState.ERROR_RECOVERY
    });

    // BROADCASTING state transitions
    this.addTransition({
      fromState: SyncState.BROADCASTING,
      event: SyncEvent.BROADCAST_COMPLETE,
      toState: SyncState.SYNCHRONIZED
    });

    this.addTransition({
      fromState: SyncState.BROADCASTING,
      event: SyncEvent.ERROR_OCCURRED,
      toState: SyncState.ERROR_RECOVERY
    });

    // ERROR_RECOVERY state transitions
    this.addTransition({
      fromState: SyncState.ERROR_RECOVERY,
      event: SyncEvent.RECOVERY_COMPLETE,
      toState: SyncState.CONNECTING
    });

    // SYNCHRONIZED state transitions
    this.addTransition({
      fromState: SyncState.SYNCHRONIZED,
      event: SyncEvent.SYNC_REQUESTED,
      toState: SyncState.SYNCING
    });

    // Global reset transition
    for (const state of Object.values(SyncState)) {
      this.addTransition({
        fromState: state,
        event: SyncEvent.RESET,
        toState: SyncState.INIT
      });
    }
  }

  private async hasOnlineNodes(context: SyncContext): Promise<boolean> {
    const onlineCount = Array.from(context.nodes.values())
      .filter(node => node.status === 'online').length;
    return onlineCount > 0;
  }

  getAllTransitions(): SyncTransition[] {
    return Array.from(this.transitions.values());
  }
}

export default TransitionHub;