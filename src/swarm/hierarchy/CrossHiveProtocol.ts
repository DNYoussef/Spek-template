/**
 * Cross-Hive Protocol - Inter-Princess Communication System
 * Enables secure, efficient communication between princess domains
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { ContextDNA } from '../../context/ContextDNA';
import { ContextValidator } from '../../context/ContextValidator';
import { HivePrincess } from './HivePrincess';
import { PrincessConsensus } from './PrincessConsensus';

interface Message {
  id: string;
  type: 'request' | 'response' | 'broadcast' | 'heartbeat' | 'sync';
  source: string;
  target: string | 'all';
  payload: any;
  timestamp: number;
  signature: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresAck: boolean;
  ttl: number;
  hops: string[];
}

interface Channel {
  id: string;
  name: string;
  participants: Set<string>;
  type: 'direct' | 'broadcast' | 'consensus';
  encrypted: boolean;
  reliability: 'best-effort' | 'at-least-once' | 'exactly-once';
  maxMessageSize: number;
  rateLimit: number;
}

interface ProtocolMetrics {
  messagesSent: number;
  messagesReceived: number;
  messagesDropped: number;
  averageLatency: number;
  channelUtilization: Map<string, number>;
  protocolVersion: string;
}

interface MessageQueue {
  princess: string;
  queue: Message[];
  processing: boolean;
  retryCount: Map<string, number>;
  lastContact: Date;
}

interface ProtocolState {
  synchronized: boolean;
  lastSyncTime: Date;
  versionVector: Map<string, number>;
  pendingAcks: Map<string, Message>;
}

export class CrossHiveProtocol extends EventEmitter {
  private readonly contextDNA: ContextDNA;
  private readonly validator: ContextValidator;
  private channels: Map<string, Channel> = new Map();
  private messageQueues: Map<string, MessageQueue> = new Map();
  private protocolState: ProtocolState;
  private messageHistory: Map<string, Message> = new Map();
  private readonly maxRetries = 3;
  private readonly messageTimeout = 5000;
  private readonly heartbeatInterval = 10000;
  private readonly maxMessageHistory = 1000;
  private heartbeatTimer?: NodeJS.Timeout;
  private readonly protocolVersion = '1.0.0';

  constructor(
    private readonly princesses: Map<string, HivePrincess>,
    private readonly consensus?: PrincessConsensus
  ) {
    super();
    this.contextDNA = new ContextDNA();
    this.validator = new ContextValidator();
    this.protocolState = {
      synchronized: false,
      lastSyncTime: new Date(),
      versionVector: new Map(),
      pendingAcks: new Map()
    };
    this.initializeProtocol();
  }

  /**
   * Initialize the cross-hive communication protocol
   */
  private async initializeProtocol(): Promise<void> {
    // Create default channels
    this.createDefaultChannels();
    
    // Initialize message queues for each princess
    this.initializeMessageQueues();
    
    // Start heartbeat mechanism
    this.startHeartbeat();
    
    // Initialize version vectors
    this.initializeVersionVectors();
    
    // Perform initial synchronization
    await this.synchronizeHives();
    
    this.emit('protocol:initialized');
  }

  /**
   * Send a message to a target princess or broadcast
   */
  async sendMessage(
    source: string,
    target: string | 'all',
    payload: any,
    options: {
      type?: Message['type'];
      priority?: Message['priority'];
      channel?: string;
      requiresAck?: boolean;
      ttl?: number;
    } = {}
  ): Promise<string> {
    const message: Message = {
      id: this.generateMessageId(),
      type: options.type || 'request',
      source,
      target,
      payload,
      timestamp: Date.now(),
      signature: await this.signMessage(source, payload),
      priority: options.priority || 'medium',
      requiresAck: options.requiresAck ?? true,
      ttl: options.ttl || 5,
      hops: [source]
    };

    // Validate message
    if (!await this.validateMessage(message)) {
      throw new Error('Message validation failed');
    }

    // Route message
    if (target === 'all') {
      await this.broadcastMessage(message, options.channel);
    } else {
      await this.routeMessage(message, options.channel);
    }

    // Store in history and persistence queue
    this.addToHistory(message);
    this.addToPersistenceQueue(message);
    
    // Handle acknowledgment if required
    if (message.requiresAck) {
      this.protocolState.pendingAcks.set(message.id, message);
      this.scheduleAckTimeout(message);
    }

    return message.id;
  }

  /**
   * Broadcast message to all princesses
   */
  private async broadcastMessage(
    message: Message,
    channelName?: string
  ): Promise<void> {
    const channel = channelName 
      ? this.channels.get(channelName)
      : this.channels.get('broadcast');

    if (!channel) {
      throw new Error(`Channel ${channelName} not found`);
    }

    // Send to all participants except source
    const targets = Array.from(channel.participants)
      .filter(p => p !== message.source);

    const broadcasts = targets.map(async target => {
      try {
        await this.deliverMessage(message, target);
      } catch (error) {
        console.error(`Broadcast to ${target} failed:`, error);
        this.handleDeliveryFailure(message, target);
      }
    });

    await Promise.allSettled(broadcasts);
    this.emit('message:broadcast', message);
  }

  /**
   * Route message to specific target
   */
  private async routeMessage(
    message: Message,
    channelName?: string
  ): Promise<void> {
    const channel = this.selectOptimizedChannel(message, channelName);
    
    if (!channel.participants.has(message.target as string)) {
      throw new Error(`Target ${message.target} not in channel ${channel.name}`);
    }

    try {
      await this.deliverMessage(message, message.target as string);
      this.emit('message:sent', message);
    } catch (error) {
      console.error(`Failed to route message to ${message.target}:`, error);
      this.handleDeliveryFailure(message, message.target as string);
    }
  }

  /**
   * Deliver message to target princess
   */
  private async deliverMessage(
    message: Message,
    target: string
  ): Promise<void> {
    const queue = this.messageQueues.get(target);
    if (!queue) {
      throw new Error(`No queue for princess ${target}`);
    }

    // Add to queue
    queue.queue.push(message);
    
    // Process queue if not already processing
    if (!queue.processing) {
      await this.processMessageQueue(target);
    }
  }

  /**
   * Process message queue for a princess
   */
  private async processMessageQueue(princessId: string): Promise<void> {
    const queue = this.messageQueues.get(princessId);
    if (!queue || queue.queue.length === 0) return;

    queue.processing = true;

    while (queue.queue.length > 0) {
      const message = queue.queue.shift()!;
      
      try {
        // Check TTL
        if (message.ttl <= 0) {
          console.warn(`Message ${message.id} expired (TTL=0)`);
          continue;
        }

        // Get princess instance
        const princess = this.princesses.get(princessId);
        if (!princess) {
          throw new Error(`Princess ${princessId} not found`);
        }

        // Deliver based on message type
        await this.handleMessageDelivery(message, princess);
        
        // Update metrics
        queue.lastContact = new Date();
        
        // Send acknowledgment if required
        if (message.requiresAck && message.source !== princessId) {
          await this.sendAcknowledgment(message);
        }

      } catch (error) {
        console.error(`Failed to process message for ${princessId}:`, error);
        await this.retryMessage(message, princessId);
      }
    }

    queue.processing = false;
  }

  /**
   * Handle message delivery based on type
   */
  private async handleMessageDelivery(
    message: Message,
    princess: HivePrincess
  ): Promise<void> {
    switch (message.type) {
      case 'request':
        const response = await princess.handleRequest(message.payload);
        if (response) {
          await this.sendMessage(
            princess.id,
            message.source,
            response,
            { type: 'response', requiresAck: false }
          );
        }
        break;

      case 'response':
        await princess.handleResponse(message.payload);
        break;

      case 'broadcast':
        await princess.handleBroadcast(message.payload);
        break;

      case 'sync':
        await this.handleSyncMessage(message, princess);
        break;

      case 'heartbeat':
        this.updateHeartbeat(message.source);
        break;
    }
  }

  /**
   * Send acknowledgment for received message
   */
  private async sendAcknowledgment(message: Message): Promise<void> {
    await this.sendMessage(
      message.target as string,
      message.source,
      { ack: message.id, timestamp: Date.now() },
      { type: 'response', requiresAck: false, priority: message.priority }
    );
  }

  /**
   * Handle synchronization message
   */
  private async handleSyncMessage(
    message: Message,
    princess: HivePrincess
  ): Promise<void> {
    const syncData = message.payload;
    
    // Update version vector
    if (syncData.versionVector) {
      this.mergeVersionVectors(syncData.versionVector);
    }

    // Sync context if provided
    if (syncData.context) {
      await princess.handleSync(syncData.context);
    }

    // Update protocol state
    this.protocolState.synchronized = true;
    this.protocolState.lastSyncTime = new Date();
  }

  /**
   * Retry failed message delivery
   */
  private async retryMessage(
    message: Message,
    target: string
  ): Promise<void> {
    const queue = this.messageQueues.get(target);
    if (!queue) return;

    const retryCount = queue.retryCount.get(message.id) || 0;
    
    if (retryCount < this.maxRetries) {
      queue.retryCount.set(message.id, retryCount + 1);
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(() => {
        message.ttl--; // Decrement TTL
        queue.queue.push(message);
        this.processMessageQueue(target);
      }, delay);
      
    } else {
      console.error(`Max retries exceeded for message ${message.id} to ${target}`);
      this.emit('message:failed', { message, target });
    }
  }

  /**
   * Handle delivery failure
   */
  private handleDeliveryFailure(
    message: Message,
    target: string
  ): void {
    // Remove from pending acks
    this.protocolState.pendingAcks.delete(message.id);
    
    // Emit failure event
    this.emit('delivery:failed', { message, target });
    
    // Attempt recovery through consensus if available
    if (this.consensus) {
      this.consensus.propose(
        message.source,
        'recovery',
        {
          failedMessage: message,
          target,
          reason: 'delivery_failure'
        }
      );
    }
  }

  /**
   * Create default communication channels
   */
  private createDefaultChannels(): void {
    // Broadcast channel for all princesses
    this.createChannel('broadcast', {
      type: 'broadcast',
      encrypted: false,
      reliability: 'best-effort',
      participants: Array.from(this.princesses.keys())
    });

    // Consensus channel for critical decisions
    this.createChannel('consensus', {
      type: 'consensus',
      encrypted: true,
      reliability: 'exactly-once',
      participants: Array.from(this.princesses.keys())
    });

    // Direct channels between princess pairs
    const princessIds = Array.from(this.princesses.keys());
    for (let i = 0; i < princessIds.length; i++) {
      for (let j = i + 1; j < princessIds.length; j++) {
        const channelName = `${princessIds[i]}-${princessIds[j]}`;
        this.createChannel(channelName, {
          type: 'direct',
          encrypted: true,
          reliability: 'at-least-once',
          participants: [princessIds[i], princessIds[j]]
        });
      }
    }
  }

  /**
   * Create a new communication channel
   */
  createChannel(
    name: string,
    options: {
      type: Channel['type'];
      encrypted: boolean;
      reliability: Channel['reliability'];
      participants: string[];
      maxMessageSize?: number;
      rateLimit?: number;
    }
  ): Channel {
    const channel: Channel = {
      id: crypto.randomBytes(16).toString('hex'),
      name,
      participants: new Set(options.participants),
      type: options.type,
      encrypted: options.encrypted,
      reliability: options.reliability,
      maxMessageSize: options.maxMessageSize || 1048576, // 1MB default
      rateLimit: options.rateLimit || 100 // 100 msg/s default
    };

    this.channels.set(name, channel);
    this.emit('channel:created', channel);
    
    return channel;
  }

  /**
   * Select appropriate channel for message
   */
  private selectChannel(
    message: Message,
    preferredChannel?: string
  ): Channel {
    if (preferredChannel && this.channels.has(preferredChannel)) {
      return this.channels.get(preferredChannel)!;
    }

    // Select based on message priority and type
    if (message.priority === 'critical' || message.type === 'sync') {
      return this.channels.get('consensus')!;
    }

    // Try direct channel
    const directChannel = `${message.source}-${message.target}`;
    const reverseChannel = `${message.target}-${message.source}`;
    
    if (this.channels.has(directChannel)) {
      return this.channels.get(directChannel)!;
    } else if (this.channels.has(reverseChannel)) {
      return this.channels.get(reverseChannel)!;
    }

    // Default to broadcast channel
    return this.channels.get('broadcast')!;
  }

  /**
   * Initialize message queues for princesses
   */
  private initializeMessageQueues(): void {
    for (const princessId of this.princesses.keys()) {
      this.messageQueues.set(princessId, {
        princess: princessId,
        queue: [],
        processing: false,
        retryCount: new Map(),
        lastContact: new Date()
      });
    }
  }

  /**
   * Initialize version vectors for consistency
   */
  private initializeVersionVectors(): void {
    for (const princessId of this.princesses.keys()) {
      this.protocolState.versionVector.set(princessId, 0);
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      for (const princessId of this.princesses.keys()) {
        await this.sendMessage(
          'protocol',
          princessId,
          { timestamp: Date.now(), version: this.protocolVersion },
          { type: 'heartbeat', requiresAck: false, priority: 'low' }
        );
      }
      
      // Check for dead princesses
      this.checkPrincessHealth();
    }, this.heartbeatInterval);
  }

  /**
   * Check princess health based on last contact
   */
  private checkPrincessHealth(): void {
    const deadlineMs = Date.now() - (this.heartbeatInterval * 3);
    
    for (const [princessId, queue] of this.messageQueues) {
      if (queue.lastContact.getTime() < deadlineMs) {
        console.warn(`Princess ${princessId} appears to be unresponsive`);
        this.emit('princess:unresponsive', { princess: princessId });
        
        // Attempt recovery
        this.attemptPrincessRecovery(princessId);
      }
    }
  }

  /**
   * Attempt to recover unresponsive princess
   */
  private async attemptPrincessRecovery(princessId: string): Promise<void> {
    // Send high-priority sync message
    try {
      await this.sendMessage(
        'protocol',
        princessId,
        { recovery: true, timestamp: Date.now() },
        { type: 'sync', priority: 'critical', requiresAck: true }
      );
    } catch (error) {
      console.error(`Failed to recover princess ${princessId}:`, error);
      
      // Notify consensus system if available
      if (this.consensus) {
        await this.consensus.propose(
          'protocol',
          'escalation',
          { unresponsivePrincess: princessId }
        );
      }
    }
  }

  /**
   * Synchronize state across all hives
   */
  async synchronizeHives(): Promise<void> {
    const syncData = {
      versionVector: Object.fromEntries(this.protocolState.versionVector),
      timestamp: Date.now(),
      protocol: this.protocolVersion
    };

    await this.sendMessage(
      'protocol',
      'all',
      syncData,
      { type: 'sync', priority: 'high' }
    );

    this.protocolState.synchronized = true;
    this.protocolState.lastSyncTime = new Date();
    this.emit('hives:synchronized');
  }

  /**
   * Merge version vectors for consistency
   */
  private mergeVersionVectors(incoming: Record<string, number>): void {
    for (const [princess, version] of Object.entries(incoming)) {
      const current = this.protocolState.versionVector.get(princess) || 0;
      this.protocolState.versionVector.set(princess, Math.max(current, version));
    }
  }

  /**
   * Update heartbeat timestamp
   */
  private updateHeartbeat(princessId: string): void {
    const queue = this.messageQueues.get(princessId);
    if (queue) {
      queue.lastContact = new Date();
    }
  }

  /**
   * Schedule timeout for acknowledgment
   */
  private scheduleAckTimeout(message: Message): void {
    setTimeout(() => {
      if (this.protocolState.pendingAcks.has(message.id)) {
        console.warn(`Acknowledgment timeout for message ${message.id}`);
        this.protocolState.pendingAcks.delete(message.id);
        this.emit('ack:timeout', message);
      }
    }, this.messageTimeout);
  }

  /**
   * Process received acknowledgment
   */
  processAcknowledgment(messageId: string): void {
    if (this.protocolState.pendingAcks.has(messageId)) {
      this.protocolState.pendingAcks.delete(messageId);
      this.emit('ack:received', messageId);
    }
  }

  /**
   * Helper functions
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private async signMessage(source: string, payload: any): Promise<string> {
    const data = JSON.stringify({ source, payload, timestamp: Date.now() });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async validateMessage(message: Message): Promise<boolean> {
    // Check message structure
    if (!message.id || !message.source || !message.target) {
      return false;
    }

    // Verify signature
    const expectedSig = await this.signMessage(message.source, message.payload);
    if (message.signature !== expectedSig) {
      console.warn(`Invalid signature for message ${message.id}`);
      return false;
    }

    // Check message size
    const size = JSON.stringify(message).length;
    const channel = this.selectOptimizedChannel(message);
    if (size > channel.maxMessageSize) {
      console.warn(`Message ${message.id} exceeds size limit`);
      return false;
    }

    return true;
  }

  private addToHistory(message: Message): void {
    this.messageHistory.set(message.id, message);
    
    // Prune old messages
    if (this.messageHistory.size > this.maxMessageHistory) {
      const oldestMessages = Array.from(this.messageHistory.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this.messageHistory.size - this.maxMessageHistory);
      
      for (const [id] of oldestMessages) {
        this.messageHistory.delete(id);
      }
    }
  }

  /**
   * Get protocol metrics
   */
  getMetrics(): ProtocolMetrics {
    let sent = 0;
    let received = 0;
    let dropped = 0;
    
    for (const message of this.messageHistory.values()) {
      if (message.source === 'protocol') sent++;
      else received++;
    }

    const channelUtilization = new Map<string, number>();
    for (const [name, channel] of this.channels) {
      // Calculate utilization based on queue sizes
      let utilization = 0;
      for (const participant of channel.participants) {
        const queue = this.messageQueues.get(participant);
        if (queue) {
          utilization += queue.queue.length;
        }
      }
      channelUtilization.set(name, utilization / channel.participants.size);
    }

    return {
      messagesSent: sent,
      messagesReceived: received,
      messagesDropped: dropped,
      averageLatency: this.calculateAverageLatency(),
      channelUtilization,
      protocolVersion: this.protocolVersion
    };
  }

  private calculateAverageLatency(): number {
    // This would track actual message round-trip times
    // Placeholder for now
    return 50;
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.emit('protocol:shutdown');
  }
}
