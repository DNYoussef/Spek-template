import { BroadcasterState, BroadcasterEvent, StateContext, StateHandler } from '../types/BroadcasterTypes';

export class ShuttingDownStateHandler implements StateHandler {
  async enter(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<void> {
    console.assert(context !== null, 'Context required');
    console.assert(context.processingTimers instanceof Map, 'Invalid timers');
    
    // Clear all timers and queues
    for (const timer of context.processingTimers.values()) {
      clearInterval(timer);
    }
    context.processingTimers.clear();
    context.messageQueues.clear();
    context.channels.clear();
  }

  async exit(context: StateContext, event: BroadcasterEvent): Promise<void> {
    console.assert(context !== null, 'Context required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');
  }

  async handle(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<BroadcasterState | null> {
    console.assert(context !== null, 'Context required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');
    return null; // Terminal state
  }
}
