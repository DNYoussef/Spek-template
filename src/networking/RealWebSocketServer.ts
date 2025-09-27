/**
 * Real WebSocket Server Implementation
 * Replaces fake WebSocket with actual ws library implementation
 */

import * as WebSocket from 'ws';
import { LoggerFactory } from '../utils/Logger';
import { IdGenerator } from '../utils/IdGenerator';

export interface WebSocketMessage {
  readonly id: string;
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
}

export interface ConnectedClient {
  readonly id: string;
  readonly socket: WebSocket;
  readonly connectedAt: number;
  readonly lastActivity: number;
  readonly metadata: Record<string, unknown>;
}

export class RealWebSocketServer {
  private readonly logger = LoggerFactory.getLogger('RealWebSocketServer');
  private server?: WebSocket.Server;
  private clients = new Map<string, ConnectedClient>();
  private messageQueue = new Map<string, WebSocketMessage[]>();
  private isRunning = false;

  constructor(private readonly port: number = 8081) {}

  /**
   * Start the real WebSocket server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('WebSocket server already running', { port: this.port });
      return;
    }

    try {
      this.server = new WebSocket.Server({
        port: this.port,
        verifyClient: (info) => this.verifyClient(info)
      });

      this.setupServerHandlers();
      this.startHeartbeat();

      this.isRunning = true;
      this.logger.info('Real WebSocket server started', { port: this.port });

    } catch (error) {
      this.logger.error('Failed to start WebSocket server', { port: this.port }, error as Error);
      throw error;
    }
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    // Close all client connections
    for (const [clientId, client] of this.clients) {
      try {
        client.socket.close();
        this.logger.debug('Closed client connection', { clientId });
      } catch (error) {
        this.logger.error('Error closing client connection', { clientId }, error as Error);
      }
    }

    // Close server
    this.server.close();
    this.clients.clear();
    this.messageQueue.clear();
    this.isRunning = false;

    this.logger.info('WebSocket server stopped', { port: this.port });
  }

  /**
   * Send message to specific client
   */
  async sendMessage(clientId: string, message: Omit<WebSocketMessage, 'id' | 'timestamp'>): Promise<boolean> {
    const client = this.clients.get(clientId);
    if (!client) {
      this.logger.warn('Client not found for message', { clientId });
      this.queueMessage(clientId, message);
      return false;
    }

    if (client.socket.readyState !== WebSocket.OPEN) {
      this.logger.warn('Client socket not open', { clientId, state: client.socket.readyState });
      this.queueMessage(clientId, message);
      return false;
    }

    const fullMessage: WebSocketMessage = {
      id: IdGenerator.generateMessageId(),
      timestamp: Date.now(),
      ...message
    };

    try {
      const serialized = JSON.stringify(fullMessage);
      client.socket.send(serialized);

      this.updateClientActivity(clientId);
      this.logger.debug('Message sent to client', { clientId, messageType: message.type });

      return true;
    } catch (error) {
      this.logger.error('Failed to send message', { clientId, messageType: message.type }, error as Error);
      this.queueMessage(clientId, message);
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  async broadcastMessage(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    const promises = Array.from(this.clients.keys()).map(async (clientId) => {
      const success = await this.sendMessage(clientId, message);
      results[clientId] = success;
      return success;
    });

    await Promise.all(promises);

    this.logger.info('Broadcast completed', {
      messageType: message.type,
      clientCount: this.clients.size,
      successCount: Object.values(results).filter(Boolean).length
    });

    return results;
  }

  /**
   * Get server status
   */
  getStatus(): any {
    return {
      running: this.isRunning,
      port: this.port,
      clientCount: this.clients.size,
      queuedMessages: this.getTotalQueuedMessages(),
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity,
        uptime: Date.now() - client.connectedAt
      }))
    };
  }

  /**
   * Get connected client IDs
   */
  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  // ===== Private Methods =====

  private setupServerHandlers(): void {
    if (!this.server) return;

    this.server.on('connection', (socket, request) => {
      const clientId = this.generateClientId(request);
      this.registerClient(clientId, socket, request);
    });

    this.server.on('error', (error) => {
      this.logger.error('WebSocket server error', {}, error);
    });

    this.server.on('close', () => {
      this.logger.info('WebSocket server closed');
    });
  }

  private registerClient(clientId: string, socket: WebSocket, request: any): void {
    const client: ConnectedClient = {
      id: clientId,
      socket,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      metadata: {
        userAgent: request.headers['user-agent'],
        origin: request.headers.origin,
        ip: request.socket.remoteAddress
      }
    };

    this.clients.set(clientId, client);
    this.setupClientHandlers(clientId, socket);
    this.processQueuedMessages(clientId);

    this.logger.info('Client connected', {
      clientId,
      clientCount: this.clients.size,
      metadata: client.metadata
    });
  }

  private setupClientHandlers(clientId: string, socket: WebSocket): void {
    socket.on('message', (data) => {
      this.handleClientMessage(clientId, data);
    });

    socket.on('close', (code, reason) => {
      this.handleClientDisconnection(clientId, code, reason);
    });

    socket.on('error', (error) => {
      this.logger.error('Client socket error', { clientId }, error);
    });

    socket.on('pong', () => {
      this.updateClientActivity(clientId);
    });
  }

  private handleClientMessage(clientId: string, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;

      this.updateClientActivity(clientId);
      this.logger.debug('Message received from client', {
        clientId,
        messageType: message.type
      });

      // Emit message event for handling by application
      this.emit('message', { clientId, message });

    } catch (error) {
      this.logger.error('Invalid message from client', { clientId }, error as Error);
    }
  }

  private handleClientDisconnection(clientId: string, code: number, reason: Buffer): void {
    this.clients.delete(clientId);

    this.logger.info('Client disconnected', {
      clientId,
      code,
      reason: reason.toString(),
      clientCount: this.clients.size
    });
  }

  private verifyClient(info: any): boolean {
    // Basic client verification - can be enhanced
    const origin = info.origin;
    const userAgent = info.req.headers['user-agent'];

    // Allow all connections for now
    // In production, implement proper verification logic
    return true;
  }

  private generateClientId(request: any): string {
    return IdGenerator.generateConnectionId();
  }

  private queueMessage(clientId: string, message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
    const queue = this.messageQueue.get(clientId) || [];

    const fullMessage: WebSocketMessage = {
      id: IdGenerator.generateMessageId(),
      timestamp: Date.now(),
      ...message
    };

    queue.push(fullMessage);
    this.messageQueue.set(clientId, queue);

    this.logger.debug('Message queued for client', { clientId, messageType: message.type });
  }

  private async processQueuedMessages(clientId: string): Promise<void> {
    const queue = this.messageQueue.get(clientId);
    if (!queue || queue.length === 0) return;

    this.logger.debug('Processing queued messages', { clientId, queueLength: queue.length });

    const processed: number[] = [];

    for (let i = 0; i < queue.length; i++) {
      const message = queue[i];

      try {
        const success = await this.sendMessage(clientId, {
          type: message.type,
          payload: message.payload
        });

        if (success) {
          processed.push(i);
        }
      } catch (error) {
        this.logger.error('Failed to send queued message', { clientId }, error as Error);
      }
    }

    // Remove processed messages
    if (processed.length > 0) {
      const newQueue = queue.filter((_, index) => !processed.includes(index));
      this.messageQueue.set(clientId, newQueue);
    }
  }

  private updateClientActivity(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      (client as any).lastActivity = Date.now();
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.sendHeartbeats();
    }, 30000); // 30 second heartbeat
  }

  private sendHeartbeats(): void {
    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.ping();
        } catch (error) {
          this.logger.error('Heartbeat failed', { clientId }, error as Error);
        }
      }
    }
  }

  private getTotalQueuedMessages(): number {
    return Array.from(this.messageQueue.values())
      .reduce((total, queue) => total + queue.length, 0);
  }

  // Event emitter functionality
  private eventHandlers = new Map<string, Function[]>();

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        this.logger.error('Event handler error', { event }, error as Error);
      }
    });
  }

  on(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    const filtered = handlers.filter(h => h !== handler);
    this.eventHandlers.set(event, filtered);
  }
}