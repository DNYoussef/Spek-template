import { BroadcasterState, BroadcasterEvent, StateContext, StateHandler } from '~types/BroadcasterTypes';

export class ErrorStateHandler implements StateHandler {
  async enter(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<void> {
    console.assert(context !== null, 'Context required');
    console.assert(payload !== undefined, 'Error payload required');
    
    context.errorInfo = payload;
    console.error('Broadcaster entered ERROR state:', payload);
  }

  async exit(context: StateContext, event: BroadcasterEvent): Promise<void> {
    console.assert(context !== null, 'Context required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');
    
    context.errorInfo = undefined;
  }

  async handle(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<BroadcasterState | null> {
    console.assert(context !== null, 'Context required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');

    switch (event) {
      case BroadcasterEvent.RECOVERY_COMPLETE:
        return BroadcasterState.IDLE;
      case BroadcasterEvent.SHUTDOWN_REQUEST:
        return BroadcasterState.SHUTTING_DOWN;
      default:
        return null;
    }
  }
}
