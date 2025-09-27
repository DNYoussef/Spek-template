import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { ProtocolHandler, A2AMessage, AgentIdentifier } from '../a2a/A2AProtocolEngine';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

export interface WebSocketProtocolConfig {
  pingInterval: number;
  pongTimeout: number;
  maxMessageSize: number;
  compression: boolean;
  perMessageDeflate: boolean;
  heartbeatInterval: number;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  enableBinaryMessages: boolean;
}

export interface WebSocketConnection {
  id: string;
  socket: WebSocket;
  agent: AgentIdentifier;
  lastPing: number;
  lastPong: number;
  isAlive: boolean;
  metadata: Record<string, any>;
}

export interface WebSocketMessage {
  type: 'message' | 'ping' | 'pong' | 'heartbeat' | 'ack';
  id: string;
  timestamp: number;
  data?: any;
}

export class WebSocketProtocolHandler extends EventEmitter implements ProtocolHandler {
  public readonly name = 'websocket';
  public readonly version = '1.0';
  
  private logger = new Logger('WebSocketProtocolHandler');
  private config: WebSocketProtocolConfig;
  private server?: WebSocket.Server;
  private clients = new Map<string, WebSocketConnection>();
  private outboundConnections = new Map<string, WebSocket>();
  private messageQueue = new Map<string, A2AMessage[]>();
  private pendingAcks = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();
  private heartbeatTimer?: NodeJS.Timeout;
  private isListening = false;
  private port?: number;

  constructor(config?: Partial<WebSocketProtocolConfig>) {
    super();
    
    this.config = {
      pingInterval: 30000,
      pongTimeout: 5000,
      maxMessageSize: 1024 * 1024, // 1MB
      compression: true,
      perMessageDeflate: true,
      heartbeatInterval: 30000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      enableBinaryMessages: false,
      ...config
    };

    this.setupHeartbeat();
  }

  canHandle(message: A2AMessage): boolean {
    return message.routing.protocol === 'websocket' || 
           message.routing.protocol === 'ws' ||
           message.routing.protocol === 'wss' ||
           message.destination.endpoint.startsWith('ws');
  }

  async send(message: A2AMessage): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Sending WebSocket message', {
        messageId: message.id,
        destination: message.destination.endpoint,
        messageType: message.messageType
      });

      const connection = await this.getOrCreateConnection(message.destination);
      
      if (connection.readyState !== WebSocket.OPEN) {
        throw new Error(`WebSocket connection not ready: ${connection.readyState}`);
      }

      const wsMessage: WebSocketMessage = {
        type: 'message',
        id: uuidv4(),
        timestamp: Date.now(),
        data: this.serializeMessage(message)
      };

      // Send message and wait for acknowledgment
      await this.sendWithAck(connection, wsMessage);

      const latency = Date.now() - startTime;
      
      this.logger.debug('WebSocket message sent successfully', {
        messageId: message.id,
        latency
      });

      this.emit('messageSent', {
        message,
        latency
      });

    } catch (error) {
      const latency = Date.now() - startTime;
      
      this.logger.error('WebSocket message send failed', {
        messageId: message.id,
        destination: message.destination.endpoint,
        error: error.message,
        latency
      });

      this.emit('sendError', {
        message,
        error,
        latency
      });

      throw error;
    }
  }

  async *receive(): AsyncGenerator<A2AMessage> {
    if (!this.isListening) {
      await this.startServer();
    }

    while (this.isListening) {
      // Check all client message queues
      for (const [clientId, messages] of this.messageQueue) {
        if (messages.length > 0) {
          const message = messages.shift()!;
          yield message;
        }
      }
      
      // Small delay to prevent busy waiting
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting WebSocket protocol handler');
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all client connections
    for (const [clientId, connection] of this.clients) {
      try {
        connection.socket.close(1000, 'Server shutdown');
      } catch (error) {
        this.logger.warn('Failed to close client connection', {
          clientId,
          error: error.message
        });
      }
    }
    
    // Close all outbound connections
    for (const [endpoint, socket] of this.outboundConnections) {
      try {
        socket.close(1000, 'Client shutdown');
      } catch (error) {
        this.logger.warn('Failed to close outbound connection', {
          endpoint,
          error: error.message
        });
      }
    }

    // Close server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => {
          this.logger.info('WebSocket server closed');
          resolve();
        });
      });
    }

    this.clients.clear();
    this.outboundConnections.clear();
    this.messageQueue.clear();
    this.pendingAcks.clear();
    this.isListening = false;
    
    this.emit('disconnected');
  }

  async startServer(port?: number): Promise<void> {
    if (this.isListening) {
      return;
    }

    this.port = port || this.findAvailablePort();
    
    const serverOptions: WebSocket.ServerOptions = {
      port: this.port,
      perMessageDeflate: this.config.perMessageDeflate,
      maxPayload: this.config.maxMessageSize,
      handleProtocols: (protocols, request) => {
        // Handle protocol negotiation
        return protocols.includes('a2a-v1') ? 'a2a-v1' : false;
      }
    };

    this.server = new WebSocket.Server(serverOptions);

    this.server.on('connection', (socket, request) => {
      this.handleNewConnection(socket, request);
    });

    this.server.on('error', (error) => {
      this.logger.error('WebSocket server error', { error: error.message });
      this.emit('serverError', error);
    });

    this.isListening = true;
    
    this.logger.info('WebSocket server started', {
      port: this.port,
      compression: this.config.compression,
      perMessageDeflate: this.config.perMessageDeflate
    });
    
    this.emit('serverStarted', { port: this.port });
  }

  getServerInfo() {
    return {
      port: this.port,
      isListening: this.isListening,
      connectedClients: this.clients.size,
      outboundConnections: this.outboundConnections.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      pendingAcks: this.pendingAcks.size
    };
  }

  getMetrics() {
    const clientMetrics = Array.from(this.clients.values()).map(conn => ({
      id: conn.id,
      agent: conn.agent.id,
      isAlive: conn.isAlive,
      lastPing: conn.lastPing,
      lastPong: conn.lastPong,
      readyState: conn.socket.readyState
    }));

    return {
      connectedClients: this.clients.size,
      outboundConnections: this.outboundConnections.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      pendingAcks: this.pendingAcks.size,
      isListening: this.isListening,
      clientMetrics,
      config: {
        pingInterval: this.config.pingInterval,
        maxMessageSize: this.config.maxMessageSize,
        compression: this.config.compression
      }
    };
  }

  async broadcastMessage(message: A2AMessage, excludeAgent?: string): Promise<void> {
    const wsMessage: WebSocketMessage = {
      type: 'message',
      id: uuidv4(),
      timestamp: Date.now(),
      data: this.serializeMessage(message)
    };

    const promises: Promise<void>[] = [];
    
    for (const [clientId, connection] of this.clients) {
      if (excludeAgent && connection.agent.id === excludeAgent) {
        continue;
      }
      
      if (connection.socket.readyState === WebSocket.OPEN) {
        promises.push(this.sendWithAck(connection.socket, wsMessage));
      }
    }

    await Promise.allSettled(promises);
    
    this.logger.info('Message broadcasted', {
      messageId: message.id,
      recipients: promises.length
    });
  }

  private async getOrCreateConnection(destination: AgentIdentifier): Promise<WebSocket> {
    const key = destination.endpoint;
    
    let connection = this.outboundConnections.get(key);
    
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      connection = await this.createOutboundConnection(destination);
      this.outboundConnections.set(key, connection);
    }
    
    return connection;
  }

  private async createOutboundConnection(destination: AgentIdentifier): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.buildWebSocketUrl(destination.endpoint);
      
      const socket = new WebSocket(wsUrl, ['a2a-v1'], {
        maxPayload: this.config.maxMessageSize,
        perMessageDeflate: this.config.perMessageDeflate
      });

      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error(`WebSocket connection timeout: ${wsUrl}`));
      }, 10000);

      socket.on('open', () => {
        clearTimeout(timeout);
        
        this.logger.info('Outbound WebSocket connection established', {
          destination: destination.id,
          endpoint: wsUrl
        });
        
        this.setupSocketHandlers(socket, destination);
        resolve(socket);
      });

      socket.on('error', (error) => {
        clearTimeout(timeout);
        this.logger.error('Outbound WebSocket connection failed', {
          destination: destination.id,
          endpoint: wsUrl,
          error: error.message
        });
        reject(error);
      });
    });
  }

  private handleNewConnection(socket: WebSocket, request: any): void {
    const connectionId = uuidv4();
    
    // Extract agent information from connection (would come from auth)
    const agent: AgentIdentifier = {
      id: `agent_${connectionId}`,
      type: 'drone', // Default, would be determined from auth
      capabilities: [],
      endpoint: `ws://unknown:${this.port}`
    };

    const connection: WebSocketConnection = {
      id: connectionId,
      socket,
      agent,
      lastPing: Date.now(),
      lastPong: Date.now(),
      isAlive: true,
      metadata: {
        connectedAt: new Date().toISOString(),
        remoteAddress: request.socket.remoteAddress
      }
    };

    this.clients.set(connectionId, connection);
    this.messageQueue.set(connectionId, []);
    
    this.logger.info('New WebSocket connection', {
      connectionId,
      agent: agent.id,
      remoteAddress: request.socket.remoteAddress
    });

    this.setupSocketHandlers(socket, agent, connection);
    
    this.emit('clientConnected', { connection, agent });
  }

  private setupSocketHandlers(socket: WebSocket, agent: AgentIdentifier, connection?: WebSocketConnection): void {
    socket.on('message', (data) => {
      try {
        const wsMessage = this.parseWebSocketMessage(data);
        this.handleWebSocketMessage(socket, wsMessage, agent, connection);
      } catch (error) {
        this.logger.error('Failed to handle WebSocket message', {
          agent: agent.id,
          error: error.message
        });
      }
    });

    socket.on('pong', () => {
      if (connection) {
        connection.lastPong = Date.now();
        connection.isAlive = true;
      }
    });

    socket.on('close', (code, reason) => {
      this.logger.info('WebSocket connection closed', {
        agent: agent.id,
        code,
        reason: reason.toString()
      });
      
      if (connection) {
        this.clients.delete(connection.id);
        this.messageQueue.delete(connection.id);
        this.emit('clientDisconnected', { connection, agent });
      }
    });

    socket.on('error', (error) => {
      this.logger.error('WebSocket connection error', {
        agent: agent.id,
        error: error.message
      });
      
      this.emit('connectionError', { agent, error });
    });
  }

  private handleWebSocketMessage(socket: WebSocket, wsMessage: WebSocketMessage, agent: AgentIdentifier, connection?: WebSocketConnection): void {
    switch (wsMessage.type) {
      case 'message':
        this.handleA2AMessage(wsMessage, agent, connection);
        this.sendAck(socket, wsMessage.id);
        break;
        
      case 'ping':
        this.sendPong(socket, wsMessage.id);
        break;
        
      case 'pong':
        // Handle pong response
        break;
        
      case 'heartbeat':
        this.handleHeartbeat(socket, wsMessage, connection);
        break;
        
      case 'ack':
        this.handleAck(wsMessage.id);
        break;
        
      default:
        this.logger.warn('Unknown WebSocket message type', {
          type: wsMessage.type,
          agent: agent.id
        });
    }
  }

  private handleA2AMessage(wsMessage: WebSocketMessage, agent: AgentIdentifier, connection?: WebSocketConnection): void {
    try {
      const a2aMessage = this.deserializeMessage(wsMessage.data);
      
      this.logger.debug('Received A2A message via WebSocket', {
        messageId: a2aMessage.id,
        source: a2aMessage.source.id,
        messageType: a2aMessage.messageType
      });

      if (connection) {
        const queue = this.messageQueue.get(connection.id) || [];
        queue.push(a2aMessage);
        this.messageQueue.set(connection.id, queue);
      }
      
      this.emit('messageReceived', a2aMessage);
    } catch (error) {
      this.logger.error('Failed to deserialize A2A message', {
        agent: agent.id,
        error: error.message
      });
    }
  }

  private async sendWithAck(socket: WebSocket, wsMessage: WebSocketMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(wsMessage.id);
        reject(new Error(`Message acknowledgment timeout: ${wsMessage.id}`));
      }, this.config.pongTimeout);

      this.pendingAcks.set(wsMessage.id, {
        resolve,
        reject,
        timeout
      });

      try {
        socket.send(JSON.stringify(wsMessage));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingAcks.delete(wsMessage.id);
        reject(error);
      }
    });
  }

  private sendAck(socket: WebSocket, messageId: string): void {
    const ackMessage: WebSocketMessage = {
      type: 'ack',
      id: messageId,
      timestamp: Date.now()
    };
    
    try {
      socket.send(JSON.stringify(ackMessage));
    } catch (error) {
      this.logger.error('Failed to send acknowledgment', {
        messageId,
        error: error.message
      });
    }
  }

  private sendPong(socket: WebSocket, pingId: string): void {
    const pongMessage: WebSocketMessage = {
      type: 'pong',
      id: pingId,
      timestamp: Date.now()
    };
    
    try {
      socket.send(JSON.stringify(pongMessage));
    } catch (error) {
      this.logger.error('Failed to send pong', {
        pingId,
        error: error.message
      });
    }
  }

  private handleHeartbeat(socket: WebSocket, wsMessage: WebSocketMessage, connection?: WebSocketConnection): void {
    if (connection) {
      connection.lastPing = Date.now();
      connection.isAlive = true;
    }
    
    // Send heartbeat response
    const heartbeatResponse: WebSocketMessage = {
      type: 'heartbeat',
      id: uuidv4(),
      timestamp: Date.now(),
      data: { response: true }
    };
    
    try {
      socket.send(JSON.stringify(heartbeatResponse));
    } catch (error) {
      this.logger.error('Failed to send heartbeat response', {
        error: error.message
      });
    }
  }

  private handleAck(messageId: string): void {
    const pending = this.pendingAcks.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingAcks.delete(messageId);
      pending.resolve();
    }
  }

  private setupHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private performHeartbeat(): void {
    const now = Date.now();
    
    for (const [connectionId, connection] of this.clients) {
      if (connection.socket.readyState === WebSocket.OPEN) {
        // Check if connection is alive
        if (now - connection.lastPong > this.config.pingInterval + this.config.pongTimeout) {
          this.logger.warn('Connection appears dead, terminating', {
            connectionId,
            agent: connection.agent.id
          });
          
          connection.socket.terminate();
          continue;
        }
        
        // Send ping
        connection.socket.ping();
        connection.lastPing = now;
        connection.isAlive = false;
      }
    }
  }

  private serializeMessage(message: A2AMessage): any {
    return {
      id: message.id,
      timestamp: message.timestamp.toISOString(),
      source: message.source,
      destination: message.destination,
      messageType: message.messageType,
      payload: message.payload,
      metadata: message.metadata,
      routing: message.routing,
      security: message.security
    };
  }

  private deserializeMessage(data: any): A2AMessage {
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    return data as A2AMessage;
  }

  private parseWebSocketMessage(data: WebSocket.Data): WebSocketMessage {
    try {
      const message = JSON.parse(data.toString());
      
      if (!message.type || !message.id || !message.timestamp) {
        throw new Error('Invalid WebSocket message format');
      }
      
      return message as WebSocketMessage;
    } catch (error) {
      throw new Error(`Failed to parse WebSocket message: ${error.message}`);
    }
  }

  private buildWebSocketUrl(endpoint: string): string {
    if (endpoint.startsWith('ws://') || endpoint.startsWith('wss://')) {
      return endpoint;
    }
    
    // Convert HTTP/HTTPS to WebSocket
    if (endpoint.startsWith('http://')) {
      return endpoint.replace('http://', 'ws://');
    }
    
    if (endpoint.startsWith('https://')) {
      return endpoint.replace('https://', 'wss://');
    }
    
    // Default to ws://
    return `ws://${endpoint}`;
  }

  private findAvailablePort(): number {
    return 3001 + Math.floor(Math.random() * 1000);
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-01-27T14:41:18-05:00 | agent@claude-3-5-sonnet-20241022 | Created WebSocket Protocol Handler with real-time messaging and heartbeat | WebSocketProtocolHandler.ts | OK | Full-duplex communication with acknowledgments, compression, and connection management | 0.00 | a3c8f2b |

 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: a2a-protocol-phase8-007
 * - inputs: ["WebSocket Protocol Handler requirements"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-3-5-sonnet-20241022","prompt":"phase8-websocket-handler"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */