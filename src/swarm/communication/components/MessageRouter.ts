/**
 * Message Router Component
 * Handles message routing and delivery for Princess communication
 * NASA Rule 10 Compliant with bounded routing attempts
 */

import { EventEmitter } from 'events';
import { CommunicationProtocolFSM, CommunicationEvent } from '../fsm/CommunicationProtocolFSM';
import { PrincessMessage, MessageResponse, CommunicationChannel } from '../types/CommunicationTypes';

export class MessageRouter extends EventEmitter {
  private fsm: CommunicationProtocolFSM;
  private routingTable: Map<string, string[]> = new Map();
  private deliveryAttempts: Map<string, number> = new Map();

  private readonly MAX_ROUTING_ATTEMPTS = 3;
  private readonly MAX_ROUTING_HOPS = 5;

  constructor() {
    super();
    this.fsm = new CommunicationProtocolFSM();
  }

  public async routeMessage(message: PrincessMessage, channels: Map<string, CommunicationChannel>): Promise<boolean> {
    const routingKey = `${message.fromPrincess}->${message.toPrincess}`;
    const attempts = this.deliveryAttempts.get(routingKey) || 0;

    if (attempts >= this.MAX_ROUTING_ATTEMPTS) {
      this.emit('routing_failed', { message, reason: 'max_attempts_exceeded' });
      return false;
    }

    this.deliveryAttempts.set(routingKey, attempts + 1);

    try {
      this.fsm.transition(CommunicationEvent.SEND_MESSAGE, {
        messageId: message.messageId,
        fromPrincess: message.fromPrincess,
        toPrincess: message.toPrincess as string
      });

      const route = this.findRoute(message.fromPrincess, message.toPrincess as string, channels);

      if (!route || route.length > this.MAX_ROUTING_HOPS) {
        this.fsm.transition(CommunicationEvent.ERROR_OCCURRED);
        return false;
      }

      const success = await this.deliverMessage(message, route, channels);

      if (success) {
        this.fsm.transition(CommunicationEvent.MESSAGE_SENT);
        this.deliveryAttempts.delete(routingKey);
        return true;
      } else {
        this.fsm.transition(CommunicationEvent.ERROR_OCCURRED);
        return false;
      }
    } catch (error) {
      this.fsm.transition(CommunicationEvent.ERROR_OCCURRED);
      this.emit('routing_error', { message, error });
      return false;
    }
  }

  public async routeBroadcast(message: PrincessMessage, channels: Map<string, CommunicationChannel>): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const targets = Array.isArray(message.toPrincess) ? message.toPrincess : [message.toPrincess];

    this.fsm.transition(CommunicationEvent.BROADCAST_REQUESTED, {
      broadcastTargets: targets
    });

    // Bounded broadcast to prevent infinite loops
    const boundedTargets = targets.slice(0, 10); // NASA Rule 10: max 10 targets

    for (const target of boundedTargets) {
      const targetMessage = { ...message, toPrincess: target };
      const success = await this.routeMessage(targetMessage, channels);
      results.set(target, success);
    }

    this.fsm.transition(CommunicationEvent.BROADCAST_COMPLETE);
    return results;
  }

  private findRoute(from: string, to: string, channels: Map<string, CommunicationChannel>): string[] | null {
    const visited = new Set<string>();
    const queue: Array<{ node: string; path: string[] }> = [{ node: from, path: [from] }];

    // Bounded BFS with maximum hop limit
    let iterations = 0;
    const MAX_ITERATIONS = 100; // NASA Rule 10 compliance

    while (queue.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      const { node, path } = queue.shift()!;

      if (node === to) {
        return path;
      }

      if (visited.has(node) || path.length > this.MAX_ROUTING_HOPS) {
        continue;
      }

      visited.add(node);

      // Find connected channels
      for (const [channelId, channel] of channels) {
        if (channel.fromDomain === node && channel.active && !visited.has(channel.toDomain)) {
          queue.push({
            node: channel.toDomain,
            path: [...path, channel.toDomain]
          });
        }
      }
    }

    return null; // No route found
  }

  private async deliverMessage(message: PrincessMessage, route: string[], channels: Map<string, CommunicationChannel>): Promise<boolean> {
    try {
      // Find appropriate channel for first hop
      const firstHop = route[1]; // route[0] is the source
      if (!firstHop) return true; // Direct delivery (same node)

      const channel = this.findChannelBetween(route[0], firstHop, channels);
      if (!channel || !channel.active) {
        return false;
      }

      // Simulate message delivery
      await this.sendThroughChannel(message, channel);

      return true;
    } catch (error) {
      return false;
    }
  }

  private findChannelBetween(from: string, to: string, channels: Map<string, CommunicationChannel>): CommunicationChannel | null {
    for (const [channelId, channel] of channels) {
      if (channel.fromDomain === from && channel.toDomain === to && channel.active) {
        return channel;
      }
    }
    return null;
  }

  private async sendThroughChannel(message: PrincessMessage, channel: CommunicationChannel): Promise<void> {
    // Simulate network delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 10));

    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Channel delivery failed');
    }

    this.emit('message_delivered', { message, channel });
  }

  public updateRoutingTable(from: string, to: string, path: string[]): void {
    const key = `${from}->${to}`;
    this.routingTable.set(key, path);
  }

  public getRoutingMetrics(): any {
    return {
      totalRoutes: this.routingTable.size,
      activeAttempts: this.deliveryAttempts.size,
      fsmState: this.fsm.getCurrentState()
    };
  }

  public reset(): void {
    this.deliveryAttempts.clear();
    this.routingTable.clear();
    this.fsm = new CommunicationProtocolFSM();
  }
}