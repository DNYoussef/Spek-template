/**
 * MessageRouter - FSM-based Message Routing Between Princesses (REFACTORED)
 * Now uses decomposed components with FSM state management.
 * This is the compatibility facade for the new architecture.
 */

import { StateStore } from '../StateStore';
import { PrincessStateMachineFacade } from '../state-machines/PrincessStateMachineFacade';
import { MessageRouterFacade } from './MessageRouterFacade';

// Re-export types for backward compatibility
export {
  Message,
  MessageResponse,
  RouteCondition,
  RoutingTable,
  RouteEntry,
  CommunicationMetrics
} from '~types/MessageRouterTypes';

/**
 * @deprecated Use MessageRouterFacade directly for new code.
 * This class provides backward compatibility only.
 */
export class MessageRouter {
  private facade: MessageRouterFacade;

  constructor(stateStore?: StateStore) {
    this.facade = new MessageRouterFacade();

    // Initialize method bindings after facade is created
    this.on = this.facade.on.bind(this.facade);
    this.emit = this.facade.emit.bind(this.facade);
    this.removeAllListeners = this.facade.removeAllListeners.bind(this.facade);
    this.once = this.facade.once.bind(this.facade);
  }

  /**
   * Register a Princess state machine for message routing
   */
  registerPrincess(princessId: string, stateMachine: PrincessStateMachineFacade | any): void {
    this.facade.registerPrincess(princessId, stateMachine);
  }

  /**
   * Send a message between Princesses
   */
  async sendMessage(
    from: string,
    to: string | string[],
    type: any,
    payload: any,
    options: any = {}
  ): Promise<any> {
    return this.facade.sendMessage(from, to, type, payload, options);
  }

  /**
   * Send a command to a Princess and wait for execution
   */
  async sendCommand(
    from: string,
    to: string,
    command: string,
    parameters: any = {},
    timeout: number = 60000
  ): Promise<any> {
    return this.facade.sendCommand(from, to, command, parameters, timeout);
  }

  /**
   * Query a Princess for information
   */
  async queryPrincess(
    from: string,
    to: string,
    query: string,
    parameters: any = {},
    timeout: number = 30000
  ): Promise<any> {
    return this.facade.queryPrincess(from, to, query, parameters, timeout);
  }

  /**
   * Broadcast a notification to multiple Princesses
   */
  async broadcastNotification(
    from: string,
    targets: string[],
    notification: string,
    data: any = {}
  ): Promise<any[]> {
    return this.facade.broadcastNotification(from, targets, notification, data);
  }

  /**
   * Add a routing rule
   */
  addRoute(
    pattern: string,
    target: string,
    conditions: any[] = [],
    priority: number = 100
  ): void {
    this.facade.addRoute(pattern, { target, conditions, priority });
  }

  /**
   * Remove a routing rule
   */
  removeRoute(pattern: string): void {
    this.facade.removeRoute(pattern);
  }

  /**
   * Get routing statistics
   */
  getRoutingMetrics(): any {
    return this.facade.getRoutingMetrics();
  }

  /**
   * Get message history for a Princess
   */
  getMessageHistory(princessId: string, limit: number = 100): any[] {
    return this.facade.getMessageHistory(princessId, limit);
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): Record<string, any> {
    return this.facade.getQueueStatus();
  }

  /**
   * Clear message history
   */
  clearHistory(princessId?: string): void {
    this.facade.clearHistory(princessId);
  }

  // Delegate methods to facade (declared as properties, initialized in constructor)
  public on: any;
  public emit: any;
  public removeAllListeners: any;
  public once: any;
}

// Backward compatibility
export default MessageRouter;
