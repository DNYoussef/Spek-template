/**
 * MessageRouter - State-Aware Message Routing Between Princesses
 * Provides intelligent message routing with state awareness, priority handling,
 * and automatic conflict resolution for inter-Princess communication.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import PrincessStateMachine from '../state-machines/PrincessStateMachine';
import { StateStore } from '../StateStore';

export interface Message {
  id: string;
  from: string;
  to: string;
  type: 'command' | 'query' | 'response' | 'notification' | 'broadcast';
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  metadata: {
    timestamp: Date;
    retryCount: number;
    maxRetries: number;
    timeout: number;
    correlationId?: string;
    parentMessageId?: string;
    requiresAck: boolean;
    stateSnapshot?: string;
  };
  routing: {
    strategy: 'direct' | 'broadcast' | 'conditional' | 'round_robin' | 'load_balanced';
    conditions?: RouteCondition[];
    fallbackTargets?: string[];
    maxHops: number;
    currentHop: number;
    path: string[];
  };
}

export interface RouteCondition {
  type: 'state_equals' | 'state_not_equals' | 'state_in' | 'capability_available' | 'load_below' | 'custom';
  target: string;
  value: any;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface MessageResponse {
  messageId: string;
  status: 'delivered' | 'failed' | 'timeout' | 'rejected' | 'queued';
  response?: any;
  error?: string;
  deliveryTime: number;
  processingTime?: number;
}

export interface RoutingTable {
  routes: Map<string, RouteEntry>;
  defaultRoute?: RouteEntry;
  lastUpdated: Date;
}

export interface RouteEntry {
  target: string;
  conditions: RouteCondition[];
  priority: number;
  enabled: boolean;
  metrics: {
    messagesRouted: number;
    averageLatency: number;
    errorRate: number;
    lastUsed: Date;
  };
}

export interface MessageQueue {
  messages: Message[];
  maxSize: number;
  processedCount: number;
  droppedCount: number;
  lastProcessed: Date;
}

export interface CommunicationMetrics {
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesByPriority: Record<string, number>;
  averageLatency: number;
  errorRate: number;
  throughput: number;
  queueUtilization: Record<string, number>;
  networkTopology: {
    nodes: string[];
    connections: Array<{ from: string; to: string; weight: number }>;
  };
}

export class MessageRouter extends EventEmitter {
  private princesses: Map<string, PrincessStateMachine>;
  private stateStore: StateStore;
  private routingTable: RoutingTable;
  private messageQueues: Map<string, MessageQueue>;
  private activeMessages: Map<string, Message>;
  private messageHistory: Map<string, Message[]>;
  private metrics: CommunicationMetrics;
  private messageCounter: number;

  constructor(stateStore: StateStore) {
    super();
    this.stateStore = stateStore;
    this.princesses = new Map();
    this.messageQueues = new Map();
    this.activeMessages = new Map();
    this.messageHistory = new Map();
    this.messageCounter = 0;

    this.routingTable = {
      routes: new Map(),
      lastUpdated: new Date()
    };

    this.metrics = {
      totalMessages: 0,
      messagesByType: {},
      messagesByPriority: {},
      averageLatency: 0,
      errorRate: 0,
      throughput: 0,
      queueUtilization: {},
      networkTopology: {
        nodes: [],
        connections: []
      }
    };

    this.initializeMessageProcessing();
  }

  /**
   * Register a Princess state machine for message routing
   */
  registerPrincess(princessId: string, stateMachine: PrincessStateMachine): void {
    this.princesses.set(princessId, stateMachine);

    // Create message queue for Princess
    this.messageQueues.set(princessId, {
      messages: [],
      maxSize: 1000,
      processedCount: 0,
      droppedCount: 0,
      lastProcessed: new Date()
    });

    // Initialize message history
    this.messageHistory.set(princessId, []);

    // Update network topology
    this.updateNetworkTopology();

    // Setup state change listeners
    stateMachine.on('stateChanged', (oldState, newState) => {
      this.handleStateChange(princessId, oldState, newState);
    });

    this.emit('princessRegistered', princessId);
  }

  /**
   * Send a message between Princesses
   */
  async sendMessage(
    from: string,
    to: string | string[],
    type: Message['type'],
    payload: any,
    options: Partial<Message['metadata']> = {}
  ): Promise<MessageResponse | MessageResponse[]> {
    const message: Message = {
      id: this.generateMessageId(),
      from,
      to: Array.isArray(to) ? to[0] : to, // Primary target
      type,
      priority: options.priority || 'medium',
      payload,
      metadata: {
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        timeout: options.timeout || 30000,
        correlationId: options.correlationId,
        parentMessageId: options.parentMessageId,
        requiresAck: options.requiresAck || false,
        stateSnapshot: await this.captureStateSnapshot(from)
      },
      routing: {
        strategy: Array.isArray(to) ? 'broadcast' : 'direct',
        maxHops: 5,
        currentHop: 0,
        path: [from],
        fallbackTargets: Array.isArray(to) ? to.slice(1) : []
      }
    };

    if (Array.isArray(to)) {
      // Broadcast message
      const responses: MessageResponse[] = [];
      for (const target of to) {
        const individualMessage = { ...message, to: target };
        const response = await this.routeMessage(individualMessage);
        responses.push(response);
      }
      return responses;
    } else {
      // Direct message
      return await this.routeMessage(message);
    }
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
    const correlationId = this.generateMessageId();

    const response = await this.sendMessage(from, to, 'command', {
      command,
      parameters
    }, {
      correlationId,
      timeout,
      requiresAck: true
    });

    if (Array.isArray(response)) {
      throw new Error('Command can only be sent to a single target');
    }

    if (response.status !== 'delivered') {
      throw new Error(`Command failed: ${response.error}`);
    }

    return response.response;
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
    const correlationId = this.generateMessageId();

    const response = await this.sendMessage(from, to, 'query', {
      query,
      parameters
    }, {
      correlationId,
      timeout,
      requiresAck: true
    });

    if (Array.isArray(response)) {
      throw new Error('Query can only be sent to a single target');
    }

    if (response.status !== 'delivered') {
      throw new Error(`Query failed: ${response.error}`);
    }

    return response.response;
  }

  /**
   * Broadcast a notification to multiple Princesses
   */
  async broadcastNotification(
    from: string,
    targets: string[],
    notification: string,
    data: any = {}
  ): Promise<MessageResponse[]> {
    const responses = await this.sendMessage(from, targets, 'notification', {
      notification,
      data
    });

    return Array.isArray(responses) ? responses : [responses];
  }

  /**
   * Add a routing rule
   */
  addRoute(
    pattern: string,
    target: string,
    conditions: RouteCondition[] = [],
    priority: number = 100
  ): void {
    const route: RouteEntry = {
      target,
      conditions,
      priority,
      enabled: true,
      metrics: {
        messagesRouted: 0,
        averageLatency: 0,
        errorRate: 0,
        lastUsed: new Date()
      }
    };

    this.routingTable.routes.set(pattern, route);
    this.routingTable.lastUpdated = new Date();

    this.emit('routeAdded', pattern, route);
  }

  /**
   * Remove a routing rule
   */
  removeRoute(pattern: string): void {
    this.routingTable.routes.delete(pattern);
    this.routingTable.lastUpdated = new Date();

    this.emit('routeRemoved', pattern);
  }

  /**
   * Get routing statistics
   */
  getRoutingMetrics(): CommunicationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get message history for a Princess
   */
  getMessageHistory(princessId: string, limit: number = 100): Message[] {
    const history = this.messageHistory.get(princessId) || [];
    return history.slice(-limit);
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): Record<string, any> {
    const status = {};

    for (const [princessId, queue] of this.messageQueues) {
      status[princessId] = {
        queueSize: queue.messages.length,
        maxSize: queue.maxSize,
        utilization: queue.messages.length / queue.maxSize,
        processedCount: queue.processedCount,
        droppedCount: queue.droppedCount,
        lastProcessed: queue.lastProcessed
      };
    }

    return status;
  }

  /**
   * Clear message history
   */
  clearHistory(princessId?: string): void {
    if (princessId) {
      this.messageHistory.set(princessId, []);
    } else {
      this.messageHistory.clear();
    }
  }

  /**
   * Private methods
   */
  private async routeMessage(message: Message): Promise<MessageResponse> {
    const startTime = Date.now();

    try {
      // Update metrics
      this.updateMessageMetrics(message);

      // Check if target Princess exists
      if (!this.princesses.has(message.to)) {
        return {
          messageId: message.id,
          status: 'failed',
          error: `Target Princess not found: ${message.to}`,
          deliveryTime: Date.now() - startTime
        };
      }

      // Check routing conditions
      const routingDecision = await this.evaluateRoutingConditions(message);
      if (!routingDecision.allowed) {
        return {
          messageId: message.id,
          status: 'rejected',
          error: routingDecision.reason,
          deliveryTime: Date.now() - startTime
        };
      }

      // Apply routing strategy
      const finalTarget = await this.applyRoutingStrategy(message);
      if (finalTarget !== message.to) {
        message.to = finalTarget;
        message.routing.path.push(finalTarget);
      }

      // Check target state compatibility
      const stateCompatible = await this.checkStateCompatibility(message);
      if (!stateCompatible.compatible) {
        if (message.routing.fallbackTargets && message.routing.fallbackTargets.length > 0) {
          // Try fallback targets
          return await this.tryFallbackTargets(message, startTime);
        } else {
          return {
            messageId: message.id,
            status: 'failed',
            error: stateCompatible.reason,
            deliveryTime: Date.now() - startTime
          };
        }
      }

      // Queue message for delivery
      await this.queueMessage(message);

      // Wait for processing if acknowledgment required
      if (message.metadata.requiresAck) {
        return await this.waitForProcessing(message, startTime);
      } else {
        return {
          messageId: message.id,
          status: 'queued',
          deliveryTime: Date.now() - startTime
        };
      }

    } catch (error) {
      return {
        messageId: message.id,
        status: 'failed',
        error: error.message,
        deliveryTime: Date.now() - startTime
      };
    }
  }

  private async evaluateRoutingConditions(message: Message): Promise<{ allowed: boolean; reason?: string }> {
    // Check if there are specific routing conditions
    if (!message.routing.conditions || message.routing.conditions.length === 0) {
      return { allowed: true };
    }

    for (const condition of message.routing.conditions) {
      const evaluation = await this.evaluateCondition(condition, message.to);
      if (!evaluation.satisfied) {
        return {
          allowed: false,
          reason: `Routing condition failed: ${condition.type} - ${evaluation.reason}`
        };
      }
    }

    return { allowed: true };
  }

  private async evaluateCondition(
    condition: RouteCondition,
    targetPrincess: string
  ): Promise<{ satisfied: boolean; reason?: string }> {
    const princess = this.princesses.get(targetPrincess);
    if (!princess) {
      return { satisfied: false, reason: 'Target Princess not found' };
    }

    const currentState = princess.getCurrentState();

    switch (condition.type) {
      case 'state_equals':
        return {
          satisfied: currentState.name === condition.value,
          reason: currentState.name !== condition.value ?
            `State '${currentState.name}' does not equal '${condition.value}'` : undefined
        };

      case 'state_not_equals':
        return {
          satisfied: currentState.name !== condition.value,
          reason: currentState.name === condition.value ?
            `State '${currentState.name}' equals '${condition.value}'` : undefined
        };

      case 'state_in':
        const allowedStates = Array.isArray(condition.value) ? condition.value : [condition.value];
        return {
          satisfied: allowedStates.includes(currentState.name),
          reason: !allowedStates.includes(currentState.name) ?
            `State '${currentState.name}' not in allowed states: ${allowedStates.join(', ')}` : undefined
        };

      case 'capability_available':
        const capabilities = princess.getCapabilities();
        const hasCapability = capabilities.some(cap => cap.id === condition.value && cap.enabled);
        return {
          satisfied: hasCapability,
          reason: !hasCapability ? `Capability '${condition.value}' not available` : undefined
        };

      case 'load_below':
        const metrics = princess.getPerformanceMetrics();
        return {
          satisfied: metrics.currentLoad < condition.value,
          reason: metrics.currentLoad >= condition.value ?
            `Load ${metrics.currentLoad} exceeds threshold ${condition.value}` : undefined
        };

      case 'custom':
        // Custom condition evaluation would be implemented here
        return { satisfied: true };

      default:
        return { satisfied: false, reason: `Unknown condition type: ${condition.type}` };
    }
  }

  private async applyRoutingStrategy(message: Message): Promise<string> {
    switch (message.routing.strategy) {
      case 'direct':
        return message.to;

      case 'load_balanced':
        return await this.selectLeastLoadedTarget([message.to]);

      case 'round_robin':
        return await this.selectRoundRobinTarget([message.to]);

      case 'conditional':
        return await this.selectConditionalTarget(message);

      default:
        return message.to;
    }
  }

  private async selectLeastLoadedTarget(candidates: string[]): Promise<string> {
    let selectedTarget = candidates[0];
    let lowestLoad = Infinity;

    for (const candidate of candidates) {
      const princess = this.princesses.get(candidate);
      if (princess) {
        const metrics = princess.getPerformanceMetrics();
        if (metrics.currentLoad < lowestLoad) {
          lowestLoad = metrics.currentLoad;
          selectedTarget = candidate;
        }
      }
    }

    return selectedTarget;
  }

  private async selectRoundRobinTarget(candidates: string[]): Promise<string> {
    // Simple round-robin implementation
    const index = this.messageCounter % candidates.length;
    return candidates[index];
  }

  private async selectConditionalTarget(message: Message): Promise<string> {
    // Apply conditional routing logic
    if (message.routing.conditions) {
      for (const condition of message.routing.conditions) {
        const evaluation = await this.evaluateCondition(condition, message.to);
        if (evaluation.satisfied) {
          return condition.target || message.to;
        }
      }
    }

    return message.to;
  }

  private async checkStateCompatibility(message: Message): Promise<{ compatible: boolean; reason?: string }> {
    const princess = this.princesses.get(message.to);
    if (!princess) {
      return { compatible: false, reason: 'Target Princess not found' };
    }

    const currentState = princess.getCurrentState();

    // Check if the current state can handle the message type
    switch (message.type) {
      case 'command':
        if (currentState.type === 'error' || currentState.type === 'maintenance') {
          return {
            compatible: false,
            reason: `Princess in ${currentState.type} state cannot process commands`
          };
        }
        break;

      case 'query':
        // Queries are generally allowed in most states
        break;

      case 'notification':
        // Notifications are always allowed
        break;

      case 'response':
        // Responses are always allowed
        break;
    }

    return { compatible: true };
  }

  private async tryFallbackTargets(message: Message, startTime: number): Promise<MessageResponse> {
    for (const fallbackTarget of message.routing.fallbackTargets || []) {
      const fallbackMessage = { ...message, to: fallbackTarget };
      const compatibility = await this.checkStateCompatibility(fallbackMessage);

      if (compatibility.compatible) {
        fallbackMessage.routing.path.push(fallbackTarget);
        await this.queueMessage(fallbackMessage);

        if (message.metadata.requiresAck) {
          return await this.waitForProcessing(fallbackMessage, startTime);
        } else {
          return {
            messageId: message.id,
            status: 'queued',
            deliveryTime: Date.now() - startTime
          };
        }
      }
    }

    return {
      messageId: message.id,
      status: 'failed',
      error: 'All targets (including fallbacks) are incompatible',
      deliveryTime: Date.now() - startTime
    };
  }

  private async queueMessage(message: Message): Promise<void> {
    const queue = this.messageQueues.get(message.to);
    if (!queue) {
      throw new Error(`No message queue for Princess: ${message.to}`);
    }

    // Check queue capacity
    if (queue.messages.length >= queue.maxSize) {
      // Drop oldest low-priority message if possible
      const droppedMessage = this.dropLowPriorityMessage(queue);
      if (!droppedMessage) {
        queue.droppedCount++;
        throw new Error(`Message queue full for Princess: ${message.to}`);
      }
    }

    // Insert message based on priority
    this.insertMessageByPriority(queue, message);

    // Store in active messages
    this.activeMessages.set(message.id, message);

    // Add to message history
    const history = this.messageHistory.get(message.to) || [];
    history.push(message);
    if (history.length > 1000) {
      history.shift(); // Keep only last 1000 messages
    }
    this.messageHistory.set(message.to, history);

    this.emit('messageQueued', message);
  }

  private dropLowPriorityMessage(queue: MessageQueue): boolean {
    // Find the oldest low-priority message
    for (let i = queue.messages.length - 1; i >= 0; i--) {
      if (queue.messages[i].priority === 'low') {
        queue.messages.splice(i, 1);
        return true;
      }
    }

    // If no low-priority messages, try medium priority
    for (let i = queue.messages.length - 1; i >= 0; i--) {
      if (queue.messages[i].priority === 'medium') {
        queue.messages.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  private insertMessageByPriority(queue: MessageQueue, message: Message): void {
    const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };
    const messagePriority = priorityValues[message.priority] || 1;

    // Find insertion point based on priority
    let insertIndex = 0;
    for (let i = 0; i < queue.messages.length; i++) {
      const queuedPriority = priorityValues[queue.messages[i].priority] || 1;
      if (messagePriority > queuedPriority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    queue.messages.splice(insertIndex, 0, message);
  }

  private async waitForProcessing(message: Message, startTime: number): Promise<MessageResponse> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          messageId: message.id,
          status: 'timeout',
          error: 'Message processing timeout',
          deliveryTime: Date.now() - startTime
        });
      }, message.metadata.timeout);

      const handleResponse = (response: any) => {
        clearTimeout(timeout);
        resolve({
          messageId: message.id,
          status: 'delivered',
          response,
          deliveryTime: Date.now() - startTime,
          processingTime: Date.now() - startTime
        });
      };

      const handleError = (error: Error) => {
        clearTimeout(timeout);
        resolve({
          messageId: message.id,
          status: 'failed',
          error: error.message,
          deliveryTime: Date.now() - startTime
        });
      };

      // Listen for message processing completion
      this.once(`messageProcessed:${message.id}`, handleResponse);
      this.once(`messageError:${message.id}`, handleError);
    });
  }

  private initializeMessageProcessing(): void {
    // Process message queues every 100ms
    setInterval(() => {
      this.processMessageQueues();
    }, 100);

    // Update metrics every 5 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 5000);

    // Clean up old messages every minute
    setInterval(() => {
      this.cleanupOldMessages();
    }, 60000);
  }

  private async processMessageQueues(): Promise<void> {
    for (const [princessId, queue] of this.messageQueues) {
      if (queue.messages.length > 0) {
        const message = queue.messages.shift()!;
        await this.processMessage(princessId, message);
        queue.processedCount++;
        queue.lastProcessed = new Date();
      }
    }
  }

  private async processMessage(princessId: string, message: Message): Promise<void> {
    const princess = this.princesses.get(princessId);
    if (!princess) {
      this.emit(`messageError:${message.id}`, new Error(`Princess not found: ${princessId}`));
      return;
    }

    try {
      let response: any;

      switch (message.type) {
        case 'command':
          response = await this.processCommand(princess, message);
          break;
        case 'query':
          response = await this.processQuery(princess, message);
          break;
        case 'notification':
          response = await this.processNotification(princess, message);
          break;
        case 'response':
          response = await this.processResponse(princess, message);
          break;
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }

      this.emit(`messageProcessed:${message.id}`, response);

    } catch (error) {
      this.emit(`messageError:${message.id}`, error);
    } finally {
      this.activeMessages.delete(message.id);
    }
  }

  private async processCommand(princess: PrincessStateMachine, message: Message): Promise<any> {
    const { command, parameters } = message.payload;

    // Convert command to task and execute
    const task = {
      id: `cmd_${message.id}`,
      type: command,
      priority: message.priority,
      payload: parameters,
      metadata: {
        createdAt: new Date(),
        dependencies: []
      }
    };

    return await princess.executeTask(task, { messageId: message.id });
  }

  private async processQuery(princess: PrincessStateMachine, message: Message): Promise<any> {
    const { query, parameters } = message.payload;

    switch (query) {
      case 'getState':
        return princess.getCurrentState();
      case 'getCapabilities':
        return princess.getCapabilities();
      case 'getPerformance':
        return princess.getPerformanceMetrics();
      case 'getHistory':
        return princess.getTaskHistory(parameters.limit || 10);
      default:
        throw new Error(`Unknown query: ${query}`);
    }
  }

  private async processNotification(princess: PrincessStateMachine, message: Message): Promise<any> {
    const { notification, data } = message.payload;

    // Notifications don't require a response, just emit the event
    princess.emit('notification', notification, data, message.from);

    return { acknowledged: true, timestamp: new Date() };
  }

  private async processResponse(princess: PrincessStateMachine, message: Message): Promise<any> {
    // Handle response messages (e.g., for correlating with previous requests)
    if (message.metadata.parentMessageId) {
      this.emit(`response:${message.metadata.parentMessageId}`, message.payload);
    }

    return { received: true, timestamp: new Date() };
  }

  private updateMessageMetrics(message: Message): void {
    this.metrics.totalMessages++;
    this.metrics.messagesByType[message.type] = (this.metrics.messagesByType[message.type] || 0) + 1;
    this.metrics.messagesByPriority[message.priority] = (this.metrics.messagesByPriority[message.priority] || 0) + 1;
  }

  private updateMetrics(): void {
    // Calculate throughput
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const recentMessages = Array.from(this.activeMessages.values())
      .filter(msg => now - msg.metadata.timestamp.getTime() < timeWindow);
    
    this.metrics.throughput = recentMessages.length;

    // Calculate queue utilization
    for (const [princessId, queue] of this.messageQueues) {
      this.metrics.queueUtilization[princessId] = queue.messages.length / queue.maxSize;
    }

    // Update network topology
    this.updateNetworkTopology();
  }

  private updateNetworkTopology(): void {
    this.metrics.networkTopology.nodes = Array.from(this.princesses.keys());
    
    // Calculate connection weights based on message frequency
    const connections = new Map<string, number>();
    
    for (const [princessId, history] of this.messageHistory) {
      for (const message of history.slice(-100)) { // Last 100 messages
        const connectionKey = `${message.from}->${message.to}`;
        connections.set(connectionKey, (connections.get(connectionKey) || 0) + 1);
      }
    }

    this.metrics.networkTopology.connections = Array.from(connections.entries())
      .map(([connection, weight]) => {
        const [from, to] = connection.split('->');
        return { from, to, weight };
      });
  }

  private cleanupOldMessages(): void {
    const maxAge = 3600000; // 1 hour
    const now = Date.now();

    // Clean up active messages
    for (const [messageId, message] of this.activeMessages) {
      if (now - message.metadata.timestamp.getTime() > maxAge) {
        this.activeMessages.delete(messageId);
      }
    }

    // Clean up message history
    for (const [princessId, history] of this.messageHistory) {
      const filteredHistory = history.filter(
        msg => now - msg.metadata.timestamp.getTime() < maxAge
      );
      this.messageHistory.set(princessId, filteredHistory);
    }
  }

  private async captureStateSnapshot(princessId: string): Promise<string> {
    const princess = this.princesses.get(princessId);
    if (!princess) {
      return 'unknown';
    }

    const state = princess.getCurrentState();
    return `${state.name}@${state.timestamp.toISOString()}`;
  }

  private generateMessageId(): string {
    return `msg_${++this.messageCounter}_${Date.now()}_${randomUUID()}`;
  }

  private handleStateChange(princessId: string, oldState: string, newState: string): void {
    // Emit state change event for interested parties
    this.emit('princessStateChanged', princessId, oldState, newState);

    // Check if any queued messages need to be re-evaluated
    const queue = this.messageQueues.get(princessId);
    if (queue) {
      // Re-sort queue based on new state compatibility
      this.reorderQueueByCompatibility(queue, princessId);
    }
  }

  private async reorderQueueByCompatibility(queue: MessageQueue, princessId: string): Promise<void> {
    const compatibleMessages: Message[] = [];
    const incompatibleMessages: Message[] = [];

    for (const message of queue.messages) {
      const compatibility = await this.checkStateCompatibility(message);
      if (compatibility.compatible) {
        compatibleMessages.push(message);
      } else {
        incompatibleMessages.push(message);
      }
    }

    // Reorder queue: compatible messages first, then incompatible
    queue.messages = [...compatibleMessages, ...incompatibleMessages];
  }
}

export default MessageRouter;