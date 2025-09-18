/**
 * Princess Communication Protocol
 *
 * Manages secure, validated communication between Princess domains
 * with context integrity, handoff validation, and conflict resolution.
 */

import { EventEmitter } from 'events';
import { HivePrincess } from '../hierarchy/HivePrincess';
import { PrincessConsensus } from '../hierarchy/PrincessConsensus';
import { MECEValidationProtocol, CrossDomainHandoff } from '../validation/MECEValidationProtocol';
import { ContextDNA, ContextFingerprint } from '../../context/ContextDNA';

export interface CommunicationChannel {
  channelId: string;
  fromDomain: string;
  toDomain: string;
  channelType: 'direct' | 'consensus' | 'broadcast' | 'emergency';
  established: number;
  lastActivity: number;
  messageCount: number;
  integrityScore: number;
  active: boolean;
}

export interface PrincessMessage {
  messageId: string;
  fromPrincess: string;
  toPrincess: string | string[]; // Single or broadcast
  messageType: 'task_handoff' | 'status_update' | 'escalation' | 'resource_request' | 'coordination_sync';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  payload: any;
  contextFingerprint: ContextFingerprint;
  requiresAcknowledgment: boolean;
  requiresConsensus: boolean;
  timestamp: number;
  expiresAt?: number;
  retryCount: number;
}

export interface MessageResponse {
  responseId: string;
  originalMessageId: string;
  fromPrincess: string;
  status: 'acknowledged' | 'accepted' | 'rejected' | 'escalated';
  response?: any;
  reason?: string;
  timestamp: number;
}

export interface CommunicationMetrics {
  totalMessages: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  integrityViolations: number;
  consensusRequests: number;
  escalations: number;
}

export class PrincessCommunicationProtocol extends EventEmitter {
  private princesses: Map<string, HivePrincess>;
  private consensus: PrincessConsensus;
  private meceValidator: MECEValidationProtocol;
  private channels: Map<string, CommunicationChannel> = new Map();
  private messageQueue: Map<string, PrincessMessage> = new Map();
  private responseTracker: Map<string, MessageResponse> = new Map();
  private communicationHistory: PrincessMessage[] = [];
  private metrics: CommunicationMetrics;

  // Communication timeouts and limits
  private readonly MESSAGE_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRY_COUNT = 3;
  private readonly BROADCAST_DELAY = 1000; // 1 second between broadcasts
  private readonly INTEGRITY_THRESHOLD = 0.85; // 85% minimum integrity

  constructor(
    princesses: Map<string, HivePrincess>,
    consensus: PrincessConsensus,
    meceValidator: MECEValidationProtocol
  ) {
    super();
    this.princesses = princesses;
    this.consensus = consensus;
    this.meceValidator = meceValidator;
    this.metrics = this.initializeMetrics();

    this.initializeCommunicationChannels();
    this.setupMessageHandlers();
    this.startMaintenanceTasks();
  }

  /**
   * Initialize communication channels between all Princess pairs
   */
  private initializeCommunicationChannels(): void {
    const domains = Array.from(this.princesses.keys());

    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const domain1 = domains[i];
        const domain2 = domains[j];

        // Create bidirectional channels
        this.createChannel(domain1, domain2, 'direct');
        this.createChannel(domain2, domain1, 'direct');
      }

      // Create broadcast channel for each domain
      this.createChannel(domains[i], '*', 'broadcast');
    }

    console.log(`[Communication] Initialized ${this.channels.size} communication channels`);
  }

  /**
   * Create a communication channel
   */
  private createChannel(
    fromDomain: string,
    toDomain: string,
    channelType: CommunicationChannel['channelType']
  ): void {
    const channelId = `${fromDomain}->${toDomain}-${channelType}`;

    const channel: CommunicationChannel = {
      channelId,
      fromDomain,
      toDomain,
      channelType,
      established: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      integrityScore: 1.0,
      active: true
    };

    this.channels.set(channelId, channel);
  }

  /**
   * Setup message event handlers
   */
  private setupMessageHandlers(): void {
    // Listen for MECE handoff requests
    this.meceValidator.on('handoff:initiated', (handoff: CrossDomainHandoff) => {
      this.handleHandoffMessage(handoff);
    });

    // Listen for consensus events
    this.consensus.on('consensus:reached', (proposal) => {
      this.broadcastConsensusResult(proposal);
    });

    // Listen for Princess health events
    this.on('princess:health_change', (data) => {
      this.handleHealthChangeNotification(data);
    });
  }

  /**
   * Send message between princesses
   */
  async sendMessage(message: Omit<PrincessMessage, 'messageId' | 'timestamp' | 'retryCount'>): Promise<{
    success: boolean;
    messageId: string;
    deliveryStatus: 'sent' | 'queued' | 'failed';
    error?: string;
  }> {
    const messageId = this.generateMessageId();
    const timestamp = Date.now();

    const fullMessage: PrincessMessage = {
      ...message,
      messageId,
      timestamp,
      retryCount: 0
    };

    console.log(`[Communication] Sending message: ${message.fromPrincess} -> ${message.toPrincess}`);
    console.log(`  Type: ${message.messageType}, Priority: ${message.priority}`);

    try {
      // Validate message before sending
      const validation = await this.validateMessage(fullMessage);
      if (!validation.valid) {
        return {
          success: false,
          messageId,
          deliveryStatus: 'failed',
          error: validation.reason
        };
      }

      // Determine delivery method based on message characteristics
      if (Array.isArray(message.toPrincess)) {
        // Broadcast message
        return await this.broadcastMessage(fullMessage);
      } else if (message.requiresConsensus) {
        // Consensus-based delivery
        return await this.sendConsensusMessage(fullMessage);
      } else {
        // Direct delivery
        return await this.sendDirectMessage(fullMessage);
      }

    } catch (error) {
      console.error(`[Communication] Send failed:`, error);
      return {
        success: false,
        messageId,
        deliveryStatus: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Send direct message between two princesses
   */
  private async sendDirectMessage(message: PrincessMessage): Promise<{
    success: boolean;
    messageId: string;
    deliveryStatus: 'sent' | 'queued' | 'failed';
    error?: string;
  }> {
    const toPrincess = message.toPrincess as string;
    const channel = this.getChannel(message.fromPrincess, toPrincess, 'direct');

    if (!channel || !channel.active) {
      return {
        success: false,
        messageId: message.messageId,
        deliveryStatus: 'failed',
        error: `No active channel: ${message.fromPrincess} -> ${toPrincess}`
      };
    }

    // Add to message queue
    this.messageQueue.set(message.messageId, message);
    this.communicationHistory.push(message);

    try {
      // Deliver through available mechanisms
      const deliveryResult = await this.deliverMessage(message, channel);

      if (deliveryResult.success) {
        // Update channel metrics
        channel.messageCount++;
        channel.lastActivity = Date.now();
        this.metrics.totalMessages++;
        this.metrics.successfulDeliveries++;

        // Set up acknowledgment tracking if required
        if (message.requiresAcknowledgment) {
          this.setupAcknowledgmentTracking(message);
        }

        this.emit('message:sent', { message, channel });

        return {
          success: true,
          messageId: message.messageId,
          deliveryStatus: 'sent'
        };
      } else {
        this.metrics.failedDeliveries++;
        return {
          success: false,
          messageId: message.messageId,
          deliveryStatus: 'failed',
          error: deliveryResult.error
        };
      }

    } catch (error) {
      this.metrics.failedDeliveries++;
      return {
        success: false,
        messageId: message.messageId,
        deliveryStatus: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Send message through consensus protocol
   */
  private async sendConsensusMessage(message: PrincessMessage): Promise<{
    success: boolean;
    messageId: string;
    deliveryStatus: 'sent' | 'queued' | 'failed';
    error?: string;
  }> {
    console.log(`[Communication] Sending via consensus: ${message.messageId}`);

    try {
      const consensusProposal = await this.consensus.propose(
        message.fromPrincess,
        'context_update',
        {
          messageType: 'princess_communication',
          originalMessage: message,
          deliveryTarget: message.toPrincess,
          requiresValidation: true
        }
      );

      this.metrics.consensusRequests++;
      this.messageQueue.set(message.messageId, message);

      // Monitor consensus result
      this.monitorConsensusDelivery(message.messageId, consensusProposal.id);

      return {
        success: true,
        messageId: message.messageId,
        deliveryStatus: 'queued' // Will be updated when consensus completes
      };

    } catch (error) {
      this.metrics.failedDeliveries++;
      return {
        success: false,
        messageId: message.messageId,
        deliveryStatus: 'failed',
        error: `Consensus failed: ${error.message}`
      };
    }
  }

  /**
   * Broadcast message to multiple princesses
   */
  private async broadcastMessage(message: PrincessMessage): Promise<{
    success: boolean;
    messageId: string;
    deliveryStatus: 'sent' | 'queued' | 'failed';
    error?: string;
  }> {
    const targets = message.toPrincess as string[];
    console.log(`[Communication] Broadcasting to ${targets.length} princesses`);

    const deliveryResults: boolean[] = [];
    let delay = 0;

    for (const target of targets) {
      setTimeout(async () => {
        const targetMessage: PrincessMessage = {
          ...message,
          toPrincess: target,
          messageId: `${message.messageId}-${target}`
        };

        const result = await this.sendDirectMessage(targetMessage);
        deliveryResults.push(result.success);

        // Check if all deliveries completed
        if (deliveryResults.length === targets.length) {
          const successCount = deliveryResults.filter(Boolean).length;
          const broadcastSuccess = successCount > targets.length / 2; // Majority success

          this.emit('broadcast:completed', {
            messageId: message.messageId,
            totalTargets: targets.length,
            successfulDeliveries: successCount,
            success: broadcastSuccess
          });
        }
      }, delay);

      delay += this.BROADCAST_DELAY;
    }

    return {
      success: true,
      messageId: message.messageId,
      deliveryStatus: 'sent'
    };
  }

  /**
   * Deliver message through available mechanisms
   */
  private async deliverMessage(
    message: PrincessMessage,
    channel: CommunicationChannel
  ): Promise<{ success: boolean; error?: string }> {
    const targetPrincess = this.princesses.get(message.toPrincess as string);
    if (!targetPrincess) {
      return { success: false, error: `Target princess not found: ${message.toPrincess}` };
    }

    // Method 1: Direct princess context transfer
    try {
      const sendResult = await this.princesses.get(message.fromPrincess)?.sendContext(
        message.toPrincess as string,
        {
          messageType: message.messageType,
          payload: message.payload,
          priority: message.priority,
          messageId: message.messageId,
          contextFingerprint: message.contextFingerprint
        }
      );

      if (sendResult?.sent) {
        return { success: true };
      }
    } catch (error) {
      console.warn(`[Communication] Direct transfer failed:`, error);
    }

    // Method 2: MCP message orchestration
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__claude_flow__task_orchestrate) {
        await (globalThis as any).mcp__claude_flow__task_orchestrate({
          task: `Princess communication: ${message.messageType}`,
          target: message.toPrincess,
          priority: message.priority,
          context: {
            fromPrincess: message.fromPrincess,
            messageId: message.messageId,
            payload: message.payload,
            messageType: message.messageType
          }
        });

        return { success: true };
      }
    } catch (error) {
      console.warn(`[Communication] MCP delivery failed:`, error);
    }

    // Method 3: Memory MCP messaging
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `princess-message-${message.messageId}`,
            entityType: 'princess-communication',
            observations: [
              `From: ${message.fromPrincess}`,
              `To: ${message.toPrincess}`,
              `Type: ${message.messageType}`,
              `Priority: ${message.priority}`,
              `Message: ${JSON.stringify(message.payload)}`,
              `Timestamp: ${new Date(message.timestamp).toISOString()}`,
              `Status: pending-delivery`
            ]
          }]
        });

        // Trigger notification to target princess
        this.notifyPrincessOfMessage(message.toPrincess as string, message.messageId);
        return { success: true };
      }
    } catch (error) {
      console.warn(`[Communication] Memory messaging failed:`, error);
    }

    return { success: false, error: 'All delivery methods failed' };
  }

  /**
   * Handle incoming message response
   */
  async handleMessageResponse(response: Omit<MessageResponse, 'responseId' | 'timestamp'>): Promise<void> {
    const responseId = this.generateResponseId();
    const fullResponse: MessageResponse = {
      ...response,
      responseId,
      timestamp: Date.now()
    };

    console.log(`[Communication] Received response: ${response.status} for ${response.originalMessageId}`);

    // Store response
    this.responseTracker.set(response.originalMessageId, fullResponse);

    // Find original message
    const originalMessage = this.messageQueue.get(response.originalMessageId);
    if (!originalMessage) {
      console.warn(`[Communication] Original message not found: ${response.originalMessageId}`);
      return;
    }

    // Handle response based on status
    switch (response.status) {
      case 'acknowledged':
        this.handleAcknowledgment(originalMessage, fullResponse);
        break;

      case 'accepted':
        this.handleAcceptance(originalMessage, fullResponse);
        break;

      case 'rejected':
        this.handleRejection(originalMessage, fullResponse);
        break;

      case 'escalated':
        this.handleEscalation(originalMessage, fullResponse);
        break;
    }

    // Clean up completed message
    if (['acknowledged', 'accepted'].includes(response.status)) {
      this.messageQueue.delete(response.originalMessageId);
    }

    this.emit('response:received', { originalMessage, response: fullResponse });
  }

  /**
   * Handle MECE handoff message
   */
  private async handleHandoffMessage(handoff: CrossDomainHandoff): Promise<void> {
    const message: Omit<PrincessMessage, 'messageId' | 'timestamp' | 'retryCount'> = {
      fromPrincess: handoff.fromDomain,
      toPrincess: handoff.toDomain,
      messageType: 'task_handoff',
      priority: handoff.requiresConsensus ? 'high' : 'medium',
      payload: handoff.payload,
      contextFingerprint: ContextDNA.generateFingerprint(
        handoff.payload,
        handoff.fromDomain,
        handoff.toDomain
      ),
      requiresAcknowledgment: true,
      requiresConsensus: handoff.requiresConsensus
    };

    await this.sendMessage(message);
  }

  /**
   * Validate message before sending
   */
  private async validateMessage(message: PrincessMessage): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    // Check if target princess exists
    if (!Array.isArray(message.toPrincess)) {
      if (!this.princesses.has(message.toPrincess)) {
        return { valid: false, reason: `Target princess not found: ${message.toPrincess}` };
      }
    }

    // Check message size
    const messageSize = JSON.stringify(message).length;
    if (messageSize > 1024 * 1024) { // 1MB limit
      return { valid: false, reason: `Message too large: ${messageSize} bytes` };
    }

    // Validate context fingerprint integrity
    if (message.contextFingerprint.degradationScore > 0.2) {
      return { valid: false, reason: `Context degradation too high: ${message.contextFingerprint.degradationScore}` };
    }

    // Check for message flooding
    const recentMessages = this.communicationHistory.filter(m =>
      m.fromPrincess === message.fromPrincess &&
      Date.now() - m.timestamp < 60000 // Last minute
    );

    if (recentMessages.length > 10) {
      return { valid: false, reason: `Message rate limit exceeded for ${message.fromPrincess}` };
    }

    return { valid: true };
  }

  /**
   * Get communication channel
   */
  private getChannel(
    fromDomain: string,
    toDomain: string,
    channelType: CommunicationChannel['channelType']
  ): CommunicationChannel | undefined {
    const channelId = `${fromDomain}->${toDomain}-${channelType}`;
    return this.channels.get(channelId);
  }

  /**
   * Setup acknowledgment tracking
   */
  private setupAcknowledgmentTracking(message: PrincessMessage): void {
    const timeout = message.expiresAt || (Date.now() + this.MESSAGE_TIMEOUT);

    setTimeout(() => {
      const response = this.responseTracker.get(message.messageId);
      if (!response) {
        console.warn(`[Communication] Message timeout: ${message.messageId}`);
        this.handleMessageTimeout(message);
      }
    }, timeout - Date.now());
  }

  /**
   * Handle message timeout
   */
  private async handleMessageTimeout(message: PrincessMessage): Promise<void> {
    console.log(`[Communication] Message timed out: ${message.messageId}`);

    if (message.retryCount < this.MAX_RETRY_COUNT) {
      // Retry delivery
      const retryMessage = {
        ...message,
        retryCount: message.retryCount + 1,
        messageId: `${message.messageId}-retry-${message.retryCount + 1}`
      };

      console.log(`[Communication] Retrying message: ${retryMessage.messageId}`);
      await this.sendDirectMessage(retryMessage);
    } else {
      // Escalate after max retries
      console.error(`[Communication] Message failed after ${this.MAX_RETRY_COUNT} retries: ${message.messageId}`);
      this.escalateFailedMessage(message);
    }
  }

  /**
   * Escalate failed message
   */
  private async escalateFailedMessage(message: PrincessMessage): Promise<void> {
    this.metrics.escalations++;

    // Create escalation message to coordination princess
    const escalationMessage: Omit<PrincessMessage, 'messageId' | 'timestamp' | 'retryCount'> = {
      fromPrincess: 'communication-protocol',
      toPrincess: 'coordination',
      messageType: 'escalation',
      priority: 'critical',
      payload: {
        failedMessage: message,
        reason: 'delivery_failure',
        retryCount: message.retryCount,
        escalationType: 'communication_failure'
      },
      contextFingerprint: message.contextFingerprint,
      requiresAcknowledgment: true,
      requiresConsensus: true
    };

    await this.sendMessage(escalationMessage);
  }

  /**
   * Monitor consensus delivery
   */
  private monitorConsensusDelivery(messageId: string, proposalId: string): void {
    // Listen for consensus completion
    const consensusListener = (proposal: any) => {
      if (proposal.id === proposalId) {
        const message = this.messageQueue.get(messageId);
        if (message) {
          console.log(`[Communication] Consensus delivery completed: ${messageId}`);
          this.metrics.successfulDeliveries++;
          this.messageQueue.delete(messageId);
        }
        this.consensus.off('consensus:reached', consensusListener);
      }
    };

    this.consensus.on('consensus:reached', consensusListener);

    // Set timeout for consensus
    setTimeout(() => {
      const message = this.messageQueue.get(messageId);
      if (message) {
        console.warn(`[Communication] Consensus timeout: ${messageId}`);
        this.metrics.failedDeliveries++;
        this.escalateFailedMessage(message);
      }
      this.consensus.off('consensus:reached', consensusListener);
    }, this.MESSAGE_TIMEOUT * 2); // Double timeout for consensus
  }

  /**
   * Handle acknowledgment
   */
  private handleAcknowledgment(message: PrincessMessage, response: MessageResponse): void {
    console.log(`[Communication] Message acknowledged: ${message.messageId}`);
    // Update metrics and cleanup
    this.updateResponseMetrics(response);
  }

  /**
   * Handle acceptance
   */
  private handleAcceptance(message: PrincessMessage, response: MessageResponse): void {
    console.log(`[Communication] Message accepted: ${message.messageId}`);
    this.updateResponseMetrics(response);
    this.emit('message:accepted', { message, response });
  }

  /**
   * Handle rejection
   */
  private handleRejection(message: PrincessMessage, response: MessageResponse): void {
    console.log(`[Communication] Message rejected: ${message.messageId} - ${response.reason}`);
    this.updateResponseMetrics(response);
    this.emit('message:rejected', { message, response });

    // Consider retry or escalation based on rejection reason
    if (response.reason?.includes('temporary')) {
      // Retry for temporary failures
      setTimeout(() => {
        this.retryMessage(message);
      }, 5000);
    }
  }

  /**
   * Handle escalation
   */
  private handleEscalation(message: PrincessMessage, response: MessageResponse): void {
    console.log(`[Communication] Message escalated: ${message.messageId}`);
    this.metrics.escalations++;
    this.updateResponseMetrics(response);

    // Forward to coordination princess
    this.escalateToCoordination(message, response);
  }

  /**
   * Retry message delivery
   */
  private async retryMessage(message: PrincessMessage): Promise<void> {
    if (message.retryCount < this.MAX_RETRY_COUNT) {
      const retryMessage = {
        ...message,
        retryCount: message.retryCount + 1,
        messageId: `${message.messageId}-retry-${message.retryCount + 1}`
      };

      await this.sendDirectMessage(retryMessage);
    }
  }

  /**
   * Escalate to coordination princess
   */
  private async escalateToCoordination(
    originalMessage: PrincessMessage,
    response: MessageResponse
  ): Promise<void> {
    const escalationMessage: Omit<PrincessMessage, 'messageId' | 'timestamp' | 'retryCount'> = {
      fromPrincess: 'communication-protocol',
      toPrincess: 'coordination',
      messageType: 'escalation',
      priority: 'high',
      payload: {
        originalMessage,
        response,
        escalationType: 'princess_escalation'
      },
      contextFingerprint: originalMessage.contextFingerprint,
      requiresAcknowledgment: true,
      requiresConsensus: false
    };

    await this.sendMessage(escalationMessage);
  }

  /**
   * Broadcast consensus result
   */
  private async broadcastConsensusResult(proposal: any): Promise<void> {
    const broadcastMessage: Omit<PrincessMessage, 'messageId' | 'timestamp' | 'retryCount'> = {
      fromPrincess: 'consensus-system',
      toPrincess: Array.from(this.princesses.keys()),
      messageType: 'status_update',
      priority: 'medium',
      payload: {
        type: 'consensus_result',
        proposalId: proposal.id,
        result: proposal.phase,
        votes: proposal.votes.size
      },
      contextFingerprint: ContextDNA.generateFingerprint(
        proposal,
        'consensus-system',
        'all-princesses'
      ),
      requiresAcknowledgment: false,
      requiresConsensus: false
    };

    await this.broadcastMessage(broadcastMessage as PrincessMessage);
  }

  /**
   * Handle health change notification
   */
  private async handleHealthChangeNotification(data: {
    princess: string;
    status: string;
    details: any;
  }): Promise<void> {
    const healthMessage: Omit<PrincessMessage, 'messageId' | 'timestamp' | 'retryCount'> = {
      fromPrincess: data.princess,
      toPrincess: 'coordination',
      messageType: 'status_update',
      priority: data.status === 'critical' ? 'emergency' : 'high',
      payload: {
        type: 'health_change',
        princess: data.princess,
        status: data.status,
        details: data.details
      },
      contextFingerprint: ContextDNA.generateFingerprint(
        data,
        data.princess,
        'coordination'
      ),
      requiresAcknowledgment: true,
      requiresConsensus: data.status === 'critical'
    };

    await this.sendMessage(healthMessage);
  }

  /**
   * Notify princess of incoming message
   */
  private notifyPrincessOfMessage(princessId: string, messageId: string): void {
    // Implementation would notify princess through available channels
    console.log(`[Communication] Notifying ${princessId} of message: ${messageId}`);
  }

  /**
   * Update response metrics
   */
  private updateResponseMetrics(response: MessageResponse): void {
    const responseTime = response.timestamp - this.communicationHistory
      .find(m => m.messageId === response.originalMessageId)?.timestamp || 0;

    if (responseTime > 0) {
      // Update average response time
      const totalResponseTime = this.metrics.averageResponseTime * this.metrics.successfulDeliveries;
      this.metrics.averageResponseTime = (totalResponseTime + responseTime) / (this.metrics.successfulDeliveries + 1);
    }
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenanceTasks(): void {
    // Clean up old messages every hour
    setInterval(() => {
      this.cleanupOldMessages();
    }, 3600000);

    // Update channel health every 5 minutes
    setInterval(() => {
      this.updateChannelHealth();
    }, 300000);

    // Generate metrics report every 10 minutes
    setInterval(() => {
      this.generateMetricsReport();
    }, 600000);
  }

  /**
   * Clean up old messages
   */
  private cleanupOldMessages(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    // Clean message queue
    for (const [messageId, message] of this.messageQueue) {
      if (message.timestamp < cutoff) {
        this.messageQueue.delete(messageId);
      }
    }

    // Clean response tracker
    for (const [messageId, response] of this.responseTracker) {
      if (response.timestamp < cutoff) {
        this.responseTracker.delete(messageId);
      }
    }

    // Clean communication history (keep last 1000 messages)
    if (this.communicationHistory.length > 1000) {
      this.communicationHistory = this.communicationHistory.slice(-1000);
    }

    console.log(`[Communication] Cleanup completed - ${this.messageQueue.size} queued, ${this.responseTracker.size} responses tracked`);
  }

  /**
   * Update channel health
   */
  private updateChannelHealth(): void {
    for (const [channelId, channel] of this.channels) {
      const timeSinceActivity = Date.now() - channel.lastActivity;

      // Deactivate channels with no activity for over an hour
      if (timeSinceActivity > 3600000) {
        channel.active = false;
        channel.integrityScore = Math.max(0, channel.integrityScore - 0.1);
      } else {
        // Recover integrity for active channels
        channel.integrityScore = Math.min(1.0, channel.integrityScore + 0.05);
      }

      // Mark integrity violations
      if (channel.integrityScore < this.INTEGRITY_THRESHOLD) {
        this.metrics.integrityViolations++;
        this.emit('channel:integrity_violation', { channel });
      }
    }
  }

  /**
   * Generate metrics report
   */
  private generateMetricsReport(): void {
    const report = {
      ...this.metrics,
      activeChannels: Array.from(this.channels.values()).filter(c => c.active).length,
      queuedMessages: this.messageQueue.size,
      pendingResponses: this.responseTracker.size,
      timestamp: Date.now()
    };

    console.log(`[Communication] Metrics Report:`, report);
    this.emit('metrics:report', report);
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): CommunicationMetrics {
    return {
      totalMessages: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageResponseTime: 0,
      integrityViolations: 0,
      consensusRequests: 0,
      escalations: 0
    };
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate unique response ID
   */
  private generateResponseId(): string {
    return `resp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // Public interface methods
  getActiveChannels(): CommunicationChannel[] {
    return Array.from(this.channels.values()).filter(c => c.active);
  }

  getMessageQueue(): PrincessMessage[] {
    return Array.from(this.messageQueue.values());
  }

  getCommunicationMetrics(): CommunicationMetrics {
    return { ...this.metrics };
  }

  async getCommunicationHealth(): Promise<{
    overallHealth: number;
    activeChannels: number;
    integrityScore: number;
    queueSize: number;
  }> {
    const activeChannels = this.getActiveChannels();
    const avgIntegrity = activeChannels.length > 0
      ? activeChannels.reduce((sum, c) => sum + c.integrityScore, 0) / activeChannels.length
      : 0;

    const overallHealth = (
      (this.metrics.successfulDeliveries / Math.max(1, this.metrics.totalMessages)) * 0.4 +
      avgIntegrity * 0.3 +
      (activeChannels.length / this.channels.size) * 0.3
    );

    return {
      overallHealth,
      activeChannels: activeChannels.length,
      integrityScore: avgIntegrity,
      queueSize: this.messageQueue.size
    };
  }
}

export default PrincessCommunicationProtocol;