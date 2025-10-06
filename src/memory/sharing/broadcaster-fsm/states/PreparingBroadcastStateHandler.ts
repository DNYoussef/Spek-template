import { BroadcasterState, BroadcasterEvent, StateContext, StateHandler } from '~types/BroadcasterTypes';

export class PreparingBroadcastStateHandler implements StateHandler {
  async enter(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<void> {
    console.assert(context !== null, 'Context required');
    console.assert(payload !== null, 'Broadcast payload required');
  }

  async exit(context: StateContext, event: BroadcasterEvent): Promise<void> {
    console.assert(context !== null, 'Context required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');
  }

  async handle(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<BroadcasterState | null> {
    console.assert(context !== null, 'Context required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');

    switch (event) {
      case BroadcasterEvent.MESSAGE_READY:
        return BroadcasterState.BROADCASTING;
      case BroadcasterEvent.ERROR_OCCURRED:
        return BroadcasterState.ERROR;
      default:
        return null;
    }
  }
}
