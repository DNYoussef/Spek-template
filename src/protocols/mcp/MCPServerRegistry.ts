/**
 * MCP Server Registry - Real implementation for managing MCP server connections
 * Provides actual server discovery, health monitoring, and capability tracking
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { MCPProtocolAdapter } from './MCPProtocolAdapter';

export interface MCPServerInfo {
  id: string;
  name: string;
  version: string;
  endpoint: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  lastSeen: number;
  responseTime: number;
  errorRate: number;
  metadata: Record<string, any>;
}

export interface ServerCapability {
  name: string;
  version: string;
  description: string;
  parameters: Record<string, any>;
  required: boolean;
}

export interface RegistryConfig {
  discoveryInterval: number;
  healthCheckInterval: number;
  maxRetries: number;
  timeout: number;
  autoDiscovery: boolean;
}

/**
 * Real MCP Server Registry implementation
 * Manages multiple MCP server connections and capabilities
 */
export class MCPServerRegistry extends EventEmitter {
  private servers = new Map<string, MCPServerInfo>();
  private adapters = new Map<string, MCPProtocolAdapter>();
  private healthChecks = new Map<string, NodeJS.Timeout>();
  private discoveryTimer: NodeJS.Timeout | null = null;
  private isActive = false;

  constructor(private config: RegistryConfig) {
    super();
    this.startRegistry();
  }

  /**
   * Start the registry and begin auto-discovery
   */
  private startRegistry(): void {
    this.isActive = true;
    
    if (this.config.autoDiscovery) {
      this.startAutoDiscovery();
    }
    
    console.log('[MCPRegistry] Registry started');
    this.emit('registry-started');
  }

  /**
   * Register a new MCP server
   */
  public async registerServer(serverInfo: Omit<MCPServerInfo, 'status' | 'lastSeen' | 'responseTime' | 'errorRate'>): Promise<boolean> {
    try {
      // Create adapter for the server
      const adapter = new MCPProtocolAdapter({
        mcpEndpoint: serverInfo.endpoint,
        a2aEndpoint: 'ws://localhost:3001/a2a', // Default A2A endpoint
        timeout: this.config.timeout,
        retryAttempts: this.config.maxRetries,
        bufferSize: 1000
      });

      // Test connection
      const isHealthy = await this.performHealthCheck(serverInfo.endpoint);
      
      const server: MCPServerInfo = {
        ...serverInfo,
        status: isHealthy ? 'online' : 'offline',
        lastSeen: Date.now(),
        responseTime: 0,
        errorRate: 0
      };

      this.servers.set(server.id, server);
      this.adapters.set(server.id, adapter);
      
      // Start health monitoring
      this.startHealthMonitoring(server.id);
      
      console.log(`[MCPRegistry] Registered server: ${server.name} (${server.id})`);
      this.emit('server-registered', server);
      
      return true;
    } catch (error) {
      console.error(`[MCPRegistry] Failed to register server ${serverInfo.name}:`, error);
      this.emit('registration-error', { server: serverInfo, error });
      return false;
    }
  }

  /**
   * Unregister a server
   */
  public async unregisterServer(serverId: string): Promise<boolean> {
    try {
      const server = this.servers.get(serverId);
      if (!server) {
        return false;
      }

      // Stop health monitoring
      const healthCheck = this.healthChecks.get(serverId);
      if (healthCheck) {
        clearInterval(healthCheck);
        this.healthChecks.delete(serverId);
      }

      // Disconnect adapter
      const adapter = this.adapters.get(serverId);
      if (adapter) {
        await adapter.disconnect();
        this.adapters.delete(serverId);
      }

      this.servers.delete(serverId);
      
      console.log(`[MCPRegistry] Unregistered server: ${server.name} (${serverId})`);
      this.emit('server-unregistered', server);
      
      return true;
    } catch (error) {
      console.error(`[MCPRegistry] Failed to unregister server ${serverId}:`, error);
      return false;
    }
  }

  /**
   * Get server by ID
   */
  public getServer(serverId: string): MCPServerInfo | undefined {
    return this.servers.get(serverId);
  }

  /**
   * Get all registered servers
   */
  public getAllServers(): MCPServerInfo[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get servers by capability
   */
  public getServersByCapability(capability: string): MCPServerInfo[] {
    return Array.from(this.servers.values())
      .filter(server => server.capabilities.includes(capability));
  }

  /**
   * Get online servers only
   */
  public getOnlineServers(): MCPServerInfo[] {
    return Array.from(this.servers.values())
      .filter(server => server.status === 'online');
  }

  /**
   * Get healthy servers (alias for getOnlineServers)
   */
  public getHealthyServers(): MCPServerInfo[] {
    return this.getOnlineServers();
  }

  /**
   * Get server count
   */
  public getServerCount(): number {
    return this.servers.size;
  }

  /**
   * Get healthy server count
   */
  public getHealthyServerCount(): number {
    return this.getOnlineServers().length;
  }

  /**
   * Perform health checks on all servers
   */
  public async performHealthChecks(): Promise<void> {
    const servers = Array.from(this.servers.values());
    await Promise.all(servers.map(async (server) => {
      const isHealthy = await this.performHealthCheck(server.endpoint);
      server.status = isHealthy ? 'online' : 'offline';
      this.servers.set(server.id, server);
    }));
  }

  /**
   * Get adapter for a server
   */
  public getAdapter(serverId: string): MCPProtocolAdapter | undefined {
    return this.adapters.get(serverId);
  }

  /**
   * Perform health check on a server
   */
  private async performHealthCheck(endpoint: string): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const ws = new WebSocket(endpoint);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, this.config.timeout);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  /**
   * Start health monitoring for a server
   */
  private startHealthMonitoring(serverId: string): void {
    const healthCheck = setInterval(async () => {
      const server = this.servers.get(serverId);
      if (!server) {
        return;
      }

      const startTime = Date.now();
      const isHealthy = await this.performHealthCheck(server.endpoint);
      const responseTime = Date.now() - startTime;

      // Update server status
      server.responseTime = responseTime;
      server.lastSeen = Date.now();
      
      const previousStatus = server.status;
      server.status = isHealthy ? 'online' : 'offline';
      
      if (previousStatus !== server.status) {
        console.log(`[MCPRegistry] Server ${server.name} status changed: ${previousStatus} -> ${server.status}`);
        this.emit('server-status-changed', { server, previousStatus });
      }

      this.servers.set(serverId, server);
    }, this.config.healthCheckInterval);

    this.healthChecks.set(serverId, healthCheck);
  }

  /**
   * Start auto-discovery of MCP servers
   */
  private startAutoDiscovery(): void {
    this.discoveryTimer = setInterval(() => {
      this.discoverServers();
    }, this.config.discoveryInterval);
  }

  /**
   * Discover MCP servers on the network
   */
  private async discoverServers(): Promise<void> {
    try {
      // Common MCP server ports and endpoints
      const discoveryEndpoints = [
        'ws://localhost:3000/mcp',
        'ws://localhost:3001/mcp',
        'ws://localhost:3002/mcp',
        'ws://localhost:8080/mcp',
        'ws://localhost:8081/mcp'
      ];

      for (const endpoint of discoveryEndpoints) {
        try {
          const isHealthy = await this.performHealthCheck(endpoint);
          if (isHealthy) {
            // Check if already registered
            const existingServer = Array.from(this.servers.values())
              .find(server => server.endpoint === endpoint);
            
            if (!existingServer) {
              // Auto-register discovered server
              await this.registerServer({
                id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: `Auto-discovered server`,
                version: '1.0.0',
                endpoint,
                capabilities: ['basic'],
                metadata: {
                  discovered: true,
                  discoveredAt: Date.now()
                }
              });
            }
          }
        } catch (error) {
          // Ignore individual discovery failures
        }
      }
    } catch (error) {
      console.error('[MCPRegistry] Auto-discovery error:', error);
    }
  }

  /**
   * Get registry statistics
   */
  public getStatistics(): {
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    averageResponseTime: number;
    totalCapabilities: number;
  } {
    const servers = Array.from(this.servers.values());
    const onlineServers = servers.filter(s => s.status === 'online');
    const offlineServers = servers.filter(s => s.status === 'offline');
    
    const avgResponseTime = onlineServers.length > 0 
      ? onlineServers.reduce((sum, s) => sum + s.responseTime, 0) / onlineServers.length
      : 0;

    const allCapabilities = new Set();
    servers.forEach(server => {
      server.capabilities.forEach(cap => allCapabilities.add(cap));
    });

    return {
      totalServers: servers.length,
      onlineServers: onlineServers.length,
      offlineServers: offlineServers.length,
      averageResponseTime: avgResponseTime,
      totalCapabilities: allCapabilities.size
    };
  }

  /**
   * Shutdown the registry
   */
  public async shutdown(): Promise<void> {
    this.isActive = false;
    
    // Stop auto-discovery
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
    }
    
    // Stop all health checks
    for (const healthCheck of Array.from(this.healthChecks.values())) {
      clearInterval(healthCheck);
    }
    this.healthChecks.clear();
    
    // Disconnect all adapters
    for (const adapter of Array.from(this.adapters.values())) {
      await adapter.disconnect();
    }
    this.adapters.clear();
    
    this.servers.clear();
    
    console.log('[MCPRegistry] Registry shutdown complete');
    this.emit('registry-shutdown');
  }
}

/* <!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-01-27T14:55:15-05:00 | protocol-dev@claude-3-5-sonnet-20241022 | Created real MCP Server Registry | MCPServerRegistry.ts | OK | Real server discovery and health monitoring | 0.00 | b8d5e1a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: a2a-protocol-mcp-registry-creation
- inputs: ["MCP server management requirements"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"protocol-dev-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE --> */