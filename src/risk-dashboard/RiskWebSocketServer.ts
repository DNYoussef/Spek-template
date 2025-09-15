/**
 * Risk WebSocket Server
 * Provides real-time risk data streaming for the dashboard
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { RiskMetrics, ProbabilityOfRuin } from './RiskMonitoringDashboard';

interface ClientConnection {
  id: string;
  ws: WebSocket;
  lastPing: number;
  subscriptions: Set<string>;
}

interface RiskDataSource {
  portfolioValue: number;
  returns: number[];
  equity: number[];
  marketReturns?: number[];
  drawdownThreshold: number;
  timeHorizon: number;
  timestamp: number;
}

/**
 * WebSocket server for real-time risk data streaming
 */
export class RiskWebSocketServer extends EventEmitter {
  private server: WebSocket.Server;
  private clients: Map<string, ClientConnection> = new Map();
  private dataGeneratorInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  // Simulated risk data state
  private riskDataState: RiskDataSource = {
    portfolioValue: 1000000,
    returns: [],
    equity: [],
    marketReturns: [],
    drawdownThreshold: 0.20,
    timeHorizon: 252,
    timestamp: Date.now()
  };
  
  constructor(private port: number = 8080) {
    super();
    
    // Create WebSocket server
    this.server = new WebSocket.Server({ 
      port: this.port,
      verifyClient: (info) => {
        // Add authentication/authorization logic here if needed
        return true;
      }
    });
    
    this.setupServerHandlers();
    console.log(` Risk WebSocket Server initialized on port ${this.port}`);
  }
  
  /**
   * Start the WebSocket server and data generation
   */
  start(): void {
    if (this.isRunning) {
      console.log(' Risk WebSocket Server is already running');
      return;
    }
    
    this.isRunning = true;
    
    // Start data generation
    this.startDataGeneration();
    
    // Start health checks
    this.startHealthChecks();
    
    console.log(' Risk WebSocket Server started successfully');
    this.emit('started');
  }
  
  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Stop intervals
    if (this.dataGeneratorInterval) {
      clearInterval(this.dataGeneratorInterval);
      this.dataGeneratorInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Close all client connections
    this.clients.forEach(client => {
      client.ws.close(1000, 'Server shutting down');
    });
    this.clients.clear();
    
    // Close server
    this.server.close(() => {
      console.log(' Risk WebSocket Server stopped');
      this.emit('stopped');
    });
  }
  
  /**
   * Setup WebSocket server event handlers
   */
  private setupServerHandlers(): void {
    this.server.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      const clientIp = request.socket.remoteAddress;
      
      console.log(` New client connected: ${clientId} from ${clientIp}`);
      
      // Create client connection
      const client: ClientConnection = {
        id: clientId,
        ws,
        lastPing: Date.now(),
        subscriptions: new Set(['risk_updates']) // Default subscription
      };
      
      this.clients.set(clientId, client);
      
      // Setup client event handlers
      this.setupClientHandlers(client);
      
      // Send welcome message with current state
      this.sendToClient(client, {
        type: 'connected',
        clientId,
        timestamp: Date.now(),
        subscriptions: Array.from(client.subscriptions)
      });
      
      // Send initial risk data
      this.sendRiskUpdate(client);
      
      this.emit('clientConnected', { clientId, clientIp });
    });
    
    this.server.on('error', (error) => {
      console.error(' WebSocket Server error:', error);
      this.emit('error', error);
    });
    
    this.server.on('listening', () => {
      console.log(` Risk WebSocket Server listening on port ${this.port}`);
      this.emit('listening');
    });
  }
  
  /**
   * Setup individual client event handlers
   */
  private setupClientHandlers(client: ClientConnection): void {
    const { ws, id } = client;
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(client, message);
      } catch (error) {
        console.error(` Error parsing message from client ${id}:`, error);
        this.sendError(client, 'Invalid message format');
      }
    });
    
    ws.on('pong', () => {
      client.lastPing = Date.now();
    });
    
    ws.on('close', (code: number, reason: string) => {
      console.log(` Client ${id} disconnected: ${code} - ${reason}`);
      this.clients.delete(id);
      this.emit('clientDisconnected', { clientId: id, code, reason });
    });
    
    ws.on('error', (error) => {
      console.error(` Client ${id} error:`, error);
      this.clients.delete(id);
      this.emit('clientError', { clientId: id, error });
    });
  }
  
  /**
   * Handle messages from clients
   */
  private handleClientMessage(client: ClientConnection, message: any): void {
    const { type } = message;
    
    switch (type) {
      case 'risk_request':
        this.sendRiskUpdate(client);
        break;
        
      case 'subscribe':
        const { topics } = message;
        if (Array.isArray(topics)) {
          topics.forEach(topic => client.subscriptions.add(topic));
          this.sendToClient(client, {
            type: 'subscription_updated',
            subscriptions: Array.from(client.subscriptions),
            timestamp: Date.now()
          });
        }
        break;
        
      case 'unsubscribe':
        const { unsubscribeTopics } = message;
        if (Array.isArray(unsubscribeTopics)) {
          unsubscribeTopics.forEach(topic => client.subscriptions.delete(topic));
          this.sendToClient(client, {
            type: 'subscription_updated',
            subscriptions: Array.from(client.subscriptions),
            timestamp: Date.now()
          });
        }
        break;
        
      case 'ping':
        this.sendToClient(client, {
          type: 'pong',
          timestamp: Date.now()
        });
        break;
        
      case 'config_update':
        this.handleConfigUpdate(client, message);
        break;
        
      default:
        console.warn(`Unknown message type from client ${client.id}:`, type);
        this.sendError(client, `Unknown message type: ${type}`);
    }
  }
  
  /**
   * Handle configuration updates from clients
   */
  private handleConfigUpdate(client: ClientConnection, message: any): void {
    const { config } = message;
    
    if (config) {
      // Update risk data parameters based on client configuration
      if (config.portfolioValue) {
        this.riskDataState.portfolioValue = config.portfolioValue;
      }
      
      if (config.drawdownThreshold) {
        this.riskDataState.drawdownThreshold = config.drawdownThreshold;
      }
      
      if (config.timeHorizon) {
        this.riskDataState.timeHorizon = config.timeHorizon;
      }
      
      console.log(` Configuration updated by client ${client.id}`);
      
      this.sendToClient(client, {
        type: 'config_updated',
        config: {
          portfolioValue: this.riskDataState.portfolioValue,
          drawdownThreshold: this.riskDataState.drawdownThreshold,
          timeHorizon: this.riskDataState.timeHorizon
        },
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Start generating and broadcasting risk data
   */
  private startDataGeneration(): void {
    // Generate initial data
    this.generateRiskData();
    
    // Set up interval for continuous data generation
    this.dataGeneratorInterval = setInterval(() => {
      this.generateRiskData();
      this.broadcastRiskUpdate();
    }, 1000); // 1 second interval
    
    console.log(' Risk data generation started (1s interval)');
  }
  
  /**
   * Generate simulated risk data
   */
  private generateRiskData(): void {
    const now = Date.now();
    
    // Generate new return (simulated market data)
    const volatility = 0.02 + (Math.random() * 0.03); // 2-5% daily volatility
    const drift = 0.0001; // Small positive drift
    const newReturn = drift + (this.generateNormalRandom() * volatility);
    
    // Generate market return (for beta calculation)
    const marketVolatility = 0.015;
    const marketDrift = 0.0002;
    const marketReturn = marketDrift + (this.generateNormalRandom() * marketVolatility);
    
    // Update returns arrays (keep last 1000 points)
    this.riskDataState.returns.push(newReturn);
    this.riskDataState.marketReturns!.push(marketReturn);
    
    if (this.riskDataState.returns.length > 1000) {
      this.riskDataState.returns.shift();
      this.riskDataState.marketReturns!.shift();
    }
    
    // Update equity curve
    const lastEquity = this.riskDataState.equity.length > 0 
      ? this.riskDataState.equity[this.riskDataState.equity.length - 1]
      : this.riskDataState.portfolioValue;
    
    const newEquity = lastEquity * (1 + newReturn);
    this.riskDataState.equity.push(newEquity);
    
    if (this.riskDataState.equity.length > 1000) {
      this.riskDataState.equity.shift();
    }
    
    // Update current portfolio value
    this.riskDataState.portfolioValue = newEquity;
    this.riskDataState.timestamp = now;
    
    // Add some random volatility spikes occasionally
    if (Math.random() < 0.01) { // 1% chance
      const spikeSize = 0.05 + (Math.random() * 0.10); // 5-15% spike
      const spikeDirection = Math.random() < 0.3 ? -1 : 1; // 30% chance of negative spike
      const spike = spikeDirection * spikeSize;
      
      this.riskDataState.returns[this.riskDataState.returns.length - 1] = spike;
      this.riskDataState.equity[this.riskDataState.equity.length - 1] = lastEquity * (1 + spike);
      this.riskDataState.portfolioValue = this.riskDataState.equity[this.riskDataState.equity.length - 1];
      
      console.log(` Volatility spike generated: ${(spike * 100).toFixed(2)}%`);
    }
  }
  
  /**
   * Broadcast risk update to all connected clients
   */
  private broadcastRiskUpdate(): void {
    this.clients.forEach(client => {
      if (client.subscriptions.has('risk_updates')) {
        this.sendRiskUpdate(client);
      }
    });
  }
  
  /**
   * Send risk update to specific client
   */
  private sendRiskUpdate(client: ClientConnection): void {
    const riskData = {
      type: 'risk_update',
      data: {
        ...this.riskDataState,
        timestamp: Date.now()
      },
      clientId: client.id
    };
    
    this.sendToClient(client, riskData);
  }
  
  /**
   * Send message to specific client
   */
  private sendToClient(client: ClientConnection, message: any): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(` Error sending message to client ${client.id}:`, error);
        this.clients.delete(client.id);
      }
    }
  }
  
  /**
   * Send error message to client
   */
  private sendError(client: ClientConnection, message: string): void {
    this.sendToClient(client, {
      type: 'error',
      message,
      timestamp: Date.now()
    });
  }
  
  /**
   * Start health checks for connected clients
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeoutThreshold = 30000; // 30 seconds
      
      this.clients.forEach((client, clientId) => {
        // Check if client is still responsive
        if (now - client.lastPing > timeoutThreshold) {
          console.log(` Client ${clientId} timed out, removing connection`);
          client.ws.close(1001, 'Timeout');
          this.clients.delete(clientId);
          return;
        }
        
        // Send ping to check connectivity
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
      
      // Emit health status
      this.emit('healthCheck', {
        connectedClients: this.clients.size,
        timestamp: now
      });
      
    }, 10000); // Check every 10 seconds
    
    console.log(' Health checks started (10s interval)');
  }
  
  /**
   * Generate client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate normal random number (Box-Muller transformation)
   */
  private generateNormalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  
  /**
   * Get server statistics
   */
  getServerStats() {
    return {
      isRunning: this.isRunning,
      connectedClients: this.clients.size,
      port: this.port,
      uptime: this.isRunning ? Date.now() - this.riskDataState.timestamp : 0,
      dataPoints: {
        returns: this.riskDataState.returns.length,
        equity: this.riskDataState.equity.length
      },
      currentPortfolioValue: this.riskDataState.portfolioValue
    };
  }
  
  /**
   * Get connected clients info
   */
  getConnectedClients() {
    return Array.from(this.clients.entries()).map(([id, client]) => ({
      id,
      subscriptions: Array.from(client.subscriptions),
      lastPing: client.lastPing,
      connected: client.ws.readyState === WebSocket.OPEN
    }));
  }
}

/**
 * Factory function to create and start risk WebSocket server
 */
export const createRiskWebSocketServer = (port: number = 8080): RiskWebSocketServer => {
  const server = new RiskWebSocketServer(port);
  
  // Auto-start the server
  server.start();
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n Shutting down Risk WebSocket Server...');
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n Shutting down Risk WebSocket Server...');
    server.stop();
    process.exit(0);
  });
  
  return server;
};

export default RiskWebSocketServer;