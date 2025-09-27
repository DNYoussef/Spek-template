/**
 * MCP Protocol Adapter - Real implementation for bridging A2A and MCP protocols
 * Provides actual protocol translation and message routing
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { A2AMessage, AgentIdentifier, SecurityHeaders, RoutingInformation, MessagePayload, MessageMetadata } from '../a2a/A2AProtocolEngine';

export interface MCPMessage {
  id: string;
  method: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// A2AMessage interface imported from A2AProtocolEngine

export interface ProtocolAdapterConfig {
  mcpEndpoint: string;
  a2aEndpoint: string;
  timeout: number;
  retryAttempts: number;
  bufferSize: number;
}

/**
 * Real MCP Protocol Adapter implementation
 * Translates between A2A and MCP message formats
 */
export class MCPProtocolAdapter extends EventEmitter {
  private mcpConnection: WebSocket | null = null;
  private a2aConnection: WebSocket | null = null;
  private messageBuffer = new Map<string, any>();
  private pendingRequests = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private config: ProtocolAdapterConfig) {
    super();
    this.setupConnections();
  }

  /**
   * Setup real WebSocket connections to MCP and A2A endpoints
   */
  private async setupConnections(): Promise<void> {
    try {
      // Connect to MCP server
      this.mcpConnection = new WebSocket(this.config.mcpEndpoint);
      this.mcpConnection.on('open', () => {
        console.log('[MCPAdapter] Connected to MCP server');
        this.emit('mcp-connected');
      });
      
      this.mcpConnection.on('message', (data) => {
        this.handleMCPMessage(JSON.parse(data.toString()));
      });
      
      this.mcpConnection.on('error', (error) => {
        console.error('[MCPAdapter] MCP connection error:', error);
        this.emit('mcp-error', error);
      });

      // Connect to A2A protocol endpoint
      this.a2aConnection = new WebSocket(this.config.a2aEndpoint);
      this.a2aConnection.on('open', () => {
        console.log('[MCPAdapter] Connected to A2A protocol');
        this.isConnected = true;
        this.emit('a2a-connected');
      });
      
      this.a2aConnection.on('message', (data) => {
        this.handleA2AMessage(JSON.parse(data.toString()));
      });
      
      this.a2aConnection.on('error', (error) => {
        console.error('[MCPAdapter] A2A connection error:', error);
        this.emit('a2a-error', error);
      });

    } catch (error) {
      console.error('[MCPAdapter] Failed to setup connections:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming MCP messages and translate to A2A format
   */
  private handleMCPMessage(message: MCPMessage): void {
    try {
      const a2aMessage: A2AMessage = {
        id: message.id,
        timestamp: new Date(),
        source: {
          id: 'mcp-server',
          type: 'drone',
          capabilities: ['mcp'],
          endpoint: 'mcp://server'
        },
        destination: {
          id: 'a2a-protocol',
          type: 'drone',
          capabilities: ['a2a'],
          endpoint: 'a2a://protocol'
        },
        messageType: 'mcp-message',
        payload: {
          data: {
            method: message.method,
            params: message.params,
            result: message.result,
            error: message.error
          },
          encoding: 'json'
        },
        metadata: {
          priority: 'normal',
          correlationId: message.id
        },
        security: {
          signature: '',
          keyId: 'mcp-server-key',
          timestamp: Date.now(),
          nonce: Math.random().toString(36)
        },
        routing: {
          path: [
            {
              id: 'mcp-server',
              type: 'drone',
              capabilities: ['mcp'],
              endpoint: 'mcp://server'
            }
          ],
          protocol: 'direct',
          flags: ['trusted']
        }
      };

      this.forwardToA2A(a2aMessage);
      this.emit('message-translated', { from: 'mcp', to: 'a2a', message: a2aMessage });
    } catch (error) {
      console.error('[MCPAdapter] Error handling MCP message:', error);
      this.emit('translation-error', { type: 'mcp-to-a2a', error });
    }
  }

  /**
   * Handle incoming A2A messages and translate to MCP format
   */
  private handleA2AMessage(message: A2AMessage): void {
    try {
      const data = message.payload.data || {};
      const mcpMessage: MCPMessage = {
        id: message.id,
        method: data.method || 'unknown',
        params: data.params
      };

      if (data.result) {
        mcpMessage.result = data.result;
      }

      if (data.error) {
        mcpMessage.error = data.error;
      }

      this.forwardToMCP(mcpMessage);
      this.emit('message-translated', { from: 'a2a', to: 'mcp', message: mcpMessage });
    } catch (error) {
      console.error('[MCPAdapter] Error handling A2A message:', error);
      this.emit('translation-error', { type: 'a2a-to-mcp', error });
    }
  }

  /**
   * Forward message to A2A protocol endpoint
   */
  private forwardToA2A(message: A2AMessage): void {
    if (this.a2aConnection && this.a2aConnection.readyState === WebSocket.OPEN) {
      this.a2aConnection.send(JSON.stringify(message));
    } else {
      this.bufferMessage('a2a', message);
      console.warn('[MCPAdapter] A2A connection not ready, message buffered');
    }
  }

  /**
   * Forward message to MCP server
   */
  private forwardToMCP(message: MCPMessage): void {
    if (this.mcpConnection && this.mcpConnection.readyState === WebSocket.OPEN) {
      this.mcpConnection.send(JSON.stringify(message));
    } else {
      this.bufferMessage('mcp', message);
      console.warn('[MCPAdapter] MCP connection not ready, message buffered');
    }
  }

  /**
   * Buffer messages when connections are not ready
   */
  private bufferMessage(type: 'mcp' | 'a2a', message: any): void {
    const key = `${type}-${Date.now()}-${Math.random()}`;
    this.messageBuffer.set(key, { type, message, timestamp: Date.now() });
    
    // Clean old buffered messages
    this.cleanupBuffer();
  }

  /**
   * Clean up old buffered messages
   */
  private cleanupBuffer(): void {
    const now = Date.now();
    const maxAge = 30000; // 30 seconds
    
    for (const [key, entry] of Array.from(this.messageBuffer.entries())) {
      if (now - entry.timestamp > maxAge) {
        this.messageBuffer.delete(key);
      }
    }
  }

  /**
   * Process buffered messages when connections are restored
   */
  private processBufferedMessages(): void {
    for (const [key, entry] of Array.from(this.messageBuffer.entries())) {
      if (entry.type === 'mcp') {
        this.forwardToMCP(entry.message);
      } else {
        this.forwardToA2A(entry.message);
      }
      this.messageBuffer.delete(key);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`[MCPAdapter] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.setupConnections();
      }, delay);
    } else {
      console.error('[MCPAdapter] Max reconnection attempts reached');
      this.emit('connection-failed');
    }
  }

  /**
   * Send request and wait for response
   */
  public async sendRequest(message: MCPMessage | A2AMessage, timeout = this.config.timeout): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error('Request timeout'));
      }, timeout);

      this.pendingRequests.set(message.id, { resolve, reject, timeout: timeoutHandle });

      // Determine message type and forward accordingly
      if ('method' in message) {
        this.forwardToMCP(message as MCPMessage);
      } else {
        this.forwardToA2A(message as A2AMessage);
      }
    });
  }

  /**
   * Get adapter status
   */
  public getStatus(): {
    isConnected: boolean;
    mcpConnected: boolean;
    a2aConnected: boolean;
    bufferedMessages: number;
    pendingRequests: number;
  } {
    return {
      isConnected: this.isConnected,
      mcpConnected: this.mcpConnection?.readyState === WebSocket.OPEN,
      a2aConnected: this.a2aConnection?.readyState === WebSocket.OPEN,
      bufferedMessages: this.messageBuffer.size,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * Convert A2A request to MCP format
   */
  public convertA2AToMCPRequest(a2aRequest: any): MCPMessage {
    return {
      id: a2aRequest.id || `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      method: a2aRequest.method || 'unknown',
      params: a2aRequest.params || a2aRequest.payload
    };
  }

  /**
   * Convert MCP response to A2A format
   */
  public convertMCPResponseToA2A(mcpResponse: MCPMessage): A2AMessage {
    return {
      id: mcpResponse.id,
      timestamp: new Date(),
      source: {
        id: 'mcp-adapter',
        type: 'drone',
        capabilities: ['mcp-bridge'],
        endpoint: 'mcp://adapter'
      },
      destination: {
        id: 'a2a-client',
        type: 'drone',
        capabilities: ['a2a-protocol'],
        endpoint: 'a2a://client'
      },
      messageType: 'mcp-response',
      payload: {
        data: {
          result: mcpResponse.result,
          error: mcpResponse.error
        },
        encoding: 'json'
      },
      metadata: {
        priority: 'normal',
        correlationId: mcpResponse.id
      },
      security: {
        signature: '',
        keyId: 'mcp-adapter-key',
        timestamp: Date.now(),
        nonce: Math.random().toString(36)
      },
      routing: {
        path: [
          {
            id: 'mcp-adapter',
            type: 'drone',
            capabilities: ['mcp-bridge'],
            endpoint: 'mcp://adapter'
          }
        ],
        protocol: 'direct',
        flags: ['trusted']
      }
    };
  }

  /**
   * Adapt A2A message to MCP format (legacy alias)
   */
  public async adaptA2AToMCP(a2aRequest: any): Promise<MCPMessage> {
    return this.convertA2AToMCPRequest(a2aRequest);
  }

  /**
   * Gracefully disconnect all connections
   */
  public async disconnect(): Promise<void> {
    this.isConnected = false;

    if (this.mcpConnection) {
      this.mcpConnection.close();
    }

    if (this.a2aConnection) {
      this.a2aConnection.close();
    }

    // Clear pending requests
    for (const [id, request] of Array.from(this.pendingRequests.entries())) {
      clearTimeout(request.timeout);
      request.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();

    this.emit('disconnected');
  }
}

/* <!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-01-27T14:55:03-05:00 | protocol-dev@claude-3-5-sonnet-20241022 | Created real MCP Protocol Adapter | MCPProtocolAdapter.ts | OK | Real WebSocket-based protocol bridge | 0.00 | a7c4f9e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: a2a-protocol-mcp-adapter-creation
- inputs: ["A2A Protocol system requirements"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"protocol-dev-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE --> */