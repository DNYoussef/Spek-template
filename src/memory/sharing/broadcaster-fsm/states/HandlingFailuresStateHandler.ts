import { BroadcasterState, BroadcasterEvent, StateContext, StateHandler } from '~types/BroadcasterTypes';

export class HandlingFailuresStateHandler implements StateHandler {
  async enter(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<void> {
    console.assert(context !== null, 'Context required');
    console.assert(context.metrics !== null, 'Metrics required');
    context.metrics.failedDeliveries++;
  }

  async exit(context: StateContext, event: BroadcasterEvent): Promise<void> {
    console.assert(context !== null, 'Context required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');
  }

  async handle(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<BroadcasterState | null> {
    console.assert(context !== null, 'Context required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');

    switch (event) {
      case BroadcasterEvent.RETRY_REQUIRED:
        return BroadcasterState.PREPARING_BROADCAST;
      default:
        return BroadcasterState.IDLE;
    }
  }
}
