/**
 * Queen Communication Hub - Real WebSocket Communication
 * Manages real-time communication between Queen and Princesses with:
 * - WebSocket-based messaging
 * - Message queuing and delivery
 * - Connection health monitoring
 * - Message serialization/deserialization
 * - Retry logic and error handling
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { LoggerFactory } from '../../utils/Logger';
import { IdGenerator } from '../../utils/IdGenerator';
import { RealWebSocketServer } from '../../networking/RealWebSocketServer';

export interface Message {
  readonly id: string;
  readonly type: string;
  readonly source: string;
  readonly target: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
  readonly priority: number;
  readonly retryCount?: number;
}

export interface PrincessConnection {
  readonly principalityId: string;
  readonly domain: string;
  readonly websocket: WebSocket;
  readonly connected: boolean;
  readonly lastActivity: number;
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly connectionTime: number;
}

export interface PrincessStatus {
  readonly domain: string;
  readonly healthy: boolean;
  readonly load: number;
  readonly lastActivity: number;
  readonly error?: Error;
}

export interface CommunicationMetrics {
  readonly totalConnections: number;
  readonly activeConnections: number;
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly averageLatency: number;
  readonly errorRate: number;
  readonly connectionUptime: Record<string, number>;
}

export interface QueuedMessage {
  readonly message: Message;
  readonly attempts: number;
  readonly nextRetry: number;
  readonly maxRetries: number;
}

export class QueenCommunicationHub extends EventEmitter {
  private readonly communicationTimeout: number;
  private readonly connections = new Map<string, PrincessConnection>();
  private readonly messageQueue = new Map<string, QueuedMessage[]>();
  private readonly messageHistory: Message[] = [];
  private readonly maxHistorySize: number = 10000;
  private readonly logger = LoggerFactory.getLogger('QueenCommunicationHub');

  private realWebSocketServer: RealWebSocketServer;
  private metrics: CommunicationMetrics;
  private isInitialized: boolean = false;
  private heartbeatInterval?: NodeJS.Timeout;
  private retryInterval?: NodeJS.Timeout;
  
  constructor(communicationTimeout: number = 30000) {
    super();
    this.communicationTimeout = communicationTimeout;
    this.metrics = this.initializeMetrics();
    this.realWebSocketServer = new RealWebSocketServer(8081);
  }

  /**
   * Initialize communication hub
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    this.logger.info('Initializing communication systems', { operation: 'initialize' });
    
    try {
      // Setup real WebSocket server for Princess connections
      await this.realWebSocketServer.start();
      this.setupWebSocketHandlers();
      this.startHeartbeat();
      this.startRetryProcessor();
      
      this.isInitialized = true;
      this.logger.info('Communication hub initialized', { operation: 'initialize' });
      
    } catch (error) {
      this.logger.error('Initialization failed', { operation: 'initialize' }, error as Error);
      throw error;
    }
  }

  /**
   * Send message to specific Princess
   */
  async sendMessage(
    target: string, 
    payload: Record<string, unknown>,
    priority: number = 5,
    retries: number = 3
  ): Promise<boolean> {
    const message: Message = {
      id: this.generateMessageId(),
      type: payload.type as string || 'general',
      source: 'Queen',
      target,
      payload,
      timestamp: Date.now(),
      priority,
      retryCount: 0
    };
    
    this.logger.debug('Sending message to Princess', { target, messageType: message.type, operation: 'sendMessage' });
    
    const connection = this.connections.get(target);
    
    if (!connection || !connection.connected) {
      this.logger.warn('No active connection, queuing message', { target, messageType: message.type, operation: 'sendMessage' });
      this.queueMessage(message, retries);
      return false;
    }
    
    try {
      // Send message via WebSocket
      const serialized = JSON.stringify(message);
      connection.websocket.send(serialized);
      
      // Update metrics
      this.metrics.messagesSent++;
      this.updateConnectionMetrics(target, 'sent');
      
      // Store in history
      this.addToHistory(message);
      
      // Emit sent event
      this.emit('message:sent', { target, message });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to send message', { target, messageType: message.type, operation: 'sendMessage' }, error as Error);
      this.queueMessage(message, retries);
      return false;
    }
  }

  /**
   * Broadcast message to all connected Princesses
   */
  async broadcastMessage(
    payload: Record<string, unknown>,
    priority: number = 5
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    const broadcastPromises = Array.from(this.connections.keys()).map(
      async (domain) => {
        const success = await this.sendMessage(domain, payload, priority);
        results[domain] = success;
        return success;
      }
    );
    
    await Promise.all(broadcastPromises);
    
    this.logger.info('Broadcast completed', { results, operation: 'broadcastMessage' });
    return results;
  }

  /**
   * Register Princess connection
   */
  registerPrincess(domain: string, websocket: WebSocket): void {
    this.logger.info('Registering Princess connection', { domain, operation: 'registerPrincess' });
    
    const connection: PrincessConnection = {
      principalityId: this.generateConnectionId(),
      domain,
      websocket,
      connected: true,
      lastActivity: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      connectionTime: Date.now()
    };
    
    // Setup connection handlers
    this.setupConnectionHandlers(domain, connection);
    
    // Store connection
    this.connections.set(domain, connection);
    
    // Update metrics
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
    
    // Process queued messages for this Princess
    this.processQueuedMessages(domain);
    
    // Emit connection event
    this.emit('princess:connected', { domain, connection });
  }

  /**
   * Unregister Princess connection
   */
  unregisterPrincess(domain: string): void {
    this.logger.info('Unregistering Princess connection', { domain, operation: 'unregisterPrincess' });
    
    const connection = this.connections.get(domain);
    if (connection) {
      connection.websocket.close();
      this.connections.delete(domain);
      
      // Update metrics
      this.metrics.activeConnections--;
      
      // Emit disconnection event
      this.emit('princess:disconnected', { domain, connection });
    }
  }

  /**
   * Get communication status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      activeConnections: this.metrics.activeConnections,
      totalConnections: this.metrics.totalConnections,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      queuedMessages: this.getTotalQueuedMessages(),
      averageLatency: this.metrics.averageLatency,
      errorRate: this.metrics.errorRate,
      connections: Array.from(this.connections.entries()).map(([domain, conn]) => ({
        domain,
        connected: conn.connected,
        lastActivity: conn.lastActivity,
        uptime: Date.now() - conn.connectionTime
      }))
    };
  }

  /**
   * Get detailed metrics
   */
  getMetrics(): CommunicationMetrics {
    // Update connection uptime
    const connectionUptime: Record<string, number> = {};
    for (const [domain, connection] of this.connections) {
      connectionUptime[domain] = Date.now() - connection.connectionTime;
    }
    
    return {
      ...this.metrics,
      connectionUptime
    };
  }

  /**
   * Shutdown communication hub
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down communication systems', { operation: 'shutdown' });
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    
    // Close all Princess connections
    for (const [domain, connection] of this.connections) {
      try {
        connection.websocket.close();
        this.logger.debug('Closed connection to Princess', { domain, operation: 'shutdown' });
      } catch (error) {
        this.logger.error('Error closing Princess connection', { domain, operation: 'shutdown' }, error as Error);
      }
    }
    
    // Close real WebSocket server
    await this.realWebSocketServer.stop();
    
    this.connections.clear();
    this.isInitialized = false;
    
    this.logger.info('Shutdown complete', { operation: 'shutdown' });
  }

  // ===== Private Methods =====

  private initializeMetrics(): CommunicationMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      averageLatency: 0,
      errorRate: 0,
      connectionUptime: {}
    };
  }

  private setupWebSocketHandlers(): void {
    if (!this.wsServer) return;
    
    this.wsServer.on('connection', (ws, req) => {
      const domain = this.extractDomainFromRequest(req);
      
      if (domain) {
        this.registerPrincess(domain, ws);
      } else {
        this.logger.warn('Unknown Princess connection, closing', { operation: 'setupWebSocketHandlers' });
        ws.close();
      }
    });
    
    this.wsServer.on('error', (error) => {
      this.logger.error('WebSocket server error', { operation: 'setupWebSocketHandlers' }, error);
      this.emit('communication:error', error);
    });
  }

  private setupConnectionHandlers(domain: string, connection: PrincessConnection): void {
    connection.websocket.on('message', (data) => {
      this.handleMessage(domain, data);
    });
    
    connection.websocket.on('close', (code, reason) => {
      this.logger.info('Princess disconnected', { domain, code, reason: reason.toString(), operation: 'handleDisconnection' });
      this.handleDisconnection(domain);
    });
    
    connection.websocket.on('error', (error) => {
      this.logger.error('Princess connection error', { domain, operation: 'handleConnectionError' }, error);
      this.handleConnectionError(domain, error);
    });
    
    connection.websocket.on('pong', () => {
      this.updateConnectionActivity(domain);
    });
  }

  private handleMessage(domain: string, data: WebSocket.Data): void {
    try {
      const message: Message = JSON.parse(data.toString());
      
      this.logger.debug('Received message from Princess', { domain, messageType: message.type, operation: 'handleMessage' });
      
      // Update metrics
      this.metrics.messagesReceived++;
      this.updateConnectionMetrics(domain, 'received');
      this.updateConnectionActivity(domain);
      
      // Store in history
      this.addToHistory(message);
      
      // Emit received event
      this.emit('message:received', { source: domain, message });
      
    } catch (error) {
      this.logger.error('Invalid message from Princess', { domain, operation: 'handleMessage' }, error as Error);
      this.metrics.errorRate++;
    }
  }

  private handleDisconnection(domain: string): void {
    const connection = this.connections.get(domain);
    if (connection) {
      connection.connected = false;
      this.metrics.activeConnections--;
      
      // Attempt reconnection after delay
      setTimeout(() => {
        this.attemptReconnection(domain);
      }, 5000);
    }
  }

  private handleConnectionError(domain: string, error: Error): void {
    this.logger.error('Connection error for Princess', { domain, operation: 'handleConnectionError' }, error);
    
    this.metrics.errorRate++;
    
    // Mark connection as unhealthy
    const connection = this.connections.get(domain);
    if (connection) {
      connection.connected = false;
    }
    
    this.emit('princess:error', { domain, error });
  }

  private verifyPrincessConnection(info: any): boolean {
    // Verify that the connection is from a valid Princess
    const domain = this.extractDomainFromRequest(info.req);
    const validDomains = ['Development', 'Architecture', 'Quality', 'Performance', 'Infrastructure', 'Security'];
    
    return domain ? validDomains.includes(domain) : false;
  }

  private extractDomainFromRequest(req: any): string | null {
    // Extract domain from URL path or headers
    const url = req.url || '';
    const match = url.match(/\/princess\/(\w+)/);
    return match ? match[1] : null;
  }

  private generateMessageId(): string {
    return IdGenerator.generateMessageId();
  }

  private generateConnectionId(): string {
    return IdGenerator.generateConnectionId();
  }

  private queueMessage(message: Message, maxRetries: number): void {
    const targetQueue = this.messageQueue.get(message.target) || [];
    
    const queuedMessage: QueuedMessage = {
      message,
      attempts: 0,
      nextRetry: Date.now() + 5000, // 5 second delay
      maxRetries
    };
    
    targetQueue.push(queuedMessage);
    this.messageQueue.set(message.target, targetQueue);
    
    this.logger.debug('Message queued for Princess', { target: message.target, messageType: message.type, operation: 'queueMessage' });
  }

  private async processQueuedMessages(domain: string): Promise<void> {
    const queue = this.messageQueue.get(domain);
    if (!queue || queue.length === 0) return;
    
    this.logger.debug('Processing queued messages', { domain, queueLength: queue.length, operation: 'processQueuedMessages' });
    
    const processed: number[] = [];
    
    for (let i = 0; i < queue.length; i++) {
      const queuedMessage = queue[i];
      
      try {
        const success = await this.sendMessage(
          domain,
          queuedMessage.message.payload,
          queuedMessage.message.priority
        );
        
        if (success) {
          processed.push(i);
        }
        
      } catch (error) {
        this.logger.error('Failed to send queued message', { domain, operation: 'processQueuedMessages' }, error as Error);
      }
    }
    
    // Remove processed messages
    if (processed.length > 0) {
      const newQueue = queue.filter((_, index) => !processed.includes(index));
      this.messageQueue.set(domain, newQueue);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
    }, 30000); // 30 second heartbeat
  }

  private startRetryProcessor(): void {
    this.retryInterval = setInterval(() => {
      this.processRetries();
    }, 10000); // 10 second retry check
  }

  private sendHeartbeats(): void {
    for (const [domain, connection] of this.connections) {
      if (connection.connected) {
        try {
          connection.websocket.ping();
        } catch (error) {
          this.logger.error('Heartbeat failed for Princess', { domain, operation: 'sendHeartbeats' }, error as Error);
          this.handleConnectionError(domain, error as Error);
        }
      }
    }
  }

  private async processRetries(): Promise<void> {
    const now = Date.now();
    
    for (const [domain, queue] of this.messageQueue) {
      const retryMessages = queue.filter(qm => qm.nextRetry <= now && qm.attempts < qm.maxRetries);
      
      for (const queuedMessage of retryMessages) {
        queuedMessage.attempts++;
        queuedMessage.nextRetry = now + (queuedMessage.attempts * 5000); // Exponential backoff
        
        try {
          await this.sendMessage(
            domain,
            queuedMessage.message.payload,
            queuedMessage.message.priority
          );
          
        } catch (error) {
          this.logger.error('Retry failed for Princess', { domain, operation: 'processRetries' }, error as Error);
        }
      }
      
      // Remove messages that exceeded max retries
      const filteredQueue = queue.filter(qm => qm.attempts < qm.maxRetries);
      this.messageQueue.set(domain, filteredQueue);
    }
  }

  private updateConnectionMetrics(domain: string, action: 'sent' | 'received'): void {
    const connection = this.connections.get(domain);
    if (connection) {
      if (action === 'sent') {
        connection.messagesSent++;
      } else {
        connection.messagesReceived++;
      }
    }
  }

  private updateConnectionActivity(domain: string): void {
    const connection = this.connections.get(domain);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }

  private addToHistory(message: Message): void {
    this.messageHistory.push(message);
    
    // Maintain history size
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.splice(0, this.messageHistory.length - this.maxHistorySize);
    }
  }

  private getTotalQueuedMessages(): number {
    return Array.from(this.messageQueue.values())
      .reduce((total, queue) => total + queue.length, 0);
  }

  private async attemptReconnection(domain: string): Promise<void> {
    this.logger.info('Attempting to reconnect Princess', { domain, operation: 'attemptReconnection' });
    
    // Implementation would depend on how Princesses initiate connections
    // For now, we wait for Princess to reconnect
    
    this.emit('princess:reconnect_attempt', { domain });
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T12:15:00-04:00 | queen@claude-sonnet-4 | Create real WebSocket communication hub with queuing and retry | QueenCommunicationHub.ts | OK | -- | 0.00 | c8e5d3f |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-queen-enhancement-004
 * - inputs: ["QueenOrchestrator.ts", "QueenDecisionEngine.ts"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase9-queen-orchestration"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */