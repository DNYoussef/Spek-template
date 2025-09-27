/**
 * MCP Load Balancer - Real implementation for distributing load across MCP servers
 * Provides actual load balancing algorithms and health-aware routing
 */

import { EventEmitter } from 'events';
import { MCPServerRegistry, MCPServerInfo } from './MCPServerRegistry';
import { MCPProtocolAdapter } from './MCPProtocolAdapter';

export type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted' | 'health-based' | 'response-time';

export interface LoadBalancerConfig {
  strategy: LoadBalancingStrategy;
  healthThreshold: number;
  maxResponseTime: number;
  retryAttempts: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface ServerLoad {
  serverId: string;
  activeConnections: number;
  queuedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  weight: number;
  isHealthy: boolean;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
}

export interface LoadBalancingResult {
  selectedServer: MCPServerInfo;
  adapter: MCPProtocolAdapter;
  reason: string;
  alternativeServers: MCPServerInfo[];
}

/**
 * Real MCP Load Balancer implementation
 * Distributes requests across available MCP servers using various strategies
 */
export class MCPLoadBalancer extends EventEmitter {
  private serverLoads = new Map<string, ServerLoad>();
  private roundRobinIndex = 0;
  private circuitBreakers = new Map<string, { failureCount: number; lastFailure: number; state: 'closed' | 'open' | 'half-open' }>();
  private isActive = false;

  constructor(
    private registry: MCPServerRegistry,
    private config: LoadBalancerConfig
  ) {
    super();
    this.initializeLoadBalancer();
  }

  /**
   * Initialize the load balancer
   */
  private initializeLoadBalancer(): void {
    this.isActive = true;
    
    // Listen to registry events
    this.registry.on('server-registered', (server: MCPServerInfo) => {
      this.initializeServerLoad(server);
    });
    
    this.registry.on('server-unregistered', (server: MCPServerInfo) => {
      this.serverLoads.delete(server.id);
      this.circuitBreakers.delete(server.id);
    });
    
    this.registry.on('server-status-changed', ({ server }: { server: MCPServerInfo }) => {
      this.updateServerHealth(server);
    });
    
    // Initialize existing servers
    const existingServers = this.registry.getAllServers();
    existingServers.forEach(server => this.initializeServerLoad(server));
    
    console.log('[MCPLoadBalancer] Load balancer initialized');
    this.emit('load-balancer-initialized');
  }

  /**
   * Initialize load tracking for a server
   */
  private initializeServerLoad(server: MCPServerInfo): void {
    const load: ServerLoad = {
      serverId: server.id,
      activeConnections: 0,
      queuedRequests: 0,
      averageResponseTime: server.responseTime || 0,
      errorRate: server.errorRate || 0,
      weight: 1.0,
      isHealthy: server.status === 'online',
      circuitBreakerState: 'closed'
    };
    
    this.serverLoads.set(server.id, load);
    this.circuitBreakers.set(server.id, {
      failureCount: 0,
      lastFailure: 0,
      state: 'closed'
    });
  }

  /**
   * Update server health status
   */
  private updateServerHealth(server: MCPServerInfo): void {
    const load = this.serverLoads.get(server.id);
    if (load) {
      load.isHealthy = server.status === 'online';
      load.averageResponseTime = server.responseTime;
      load.errorRate = server.errorRate;
      this.serverLoads.set(server.id, load);
    }
  }

  /**
   * Select the best server based on the configured strategy
   */
  public async selectServer(requestContext?: any): Promise<LoadBalancingResult | null> {
    const healthyServers = this.getHealthyServers();
    
    if (healthyServers.length === 0) {
      console.error('[MCPLoadBalancer] No healthy servers available');
      this.emit('no-servers-available');
      return null;
    }

    let selectedServer: MCPServerInfo;
    let reason: string;

    switch (this.config.strategy) {
      case 'round-robin':
        selectedServer = this.selectRoundRobin(healthyServers);
        reason = 'Round-robin selection';
        break;
        
      case 'least-connections':
        selectedServer = this.selectLeastConnections(healthyServers);
        reason = 'Least connections';
        break;
        
      case 'weighted':
        selectedServer = this.selectWeighted(healthyServers);
        reason = 'Weighted selection';
        break;
        
      case 'health-based':
        selectedServer = this.selectHealthBased(healthyServers);
        reason = 'Health-based selection';
        break;
        
      case 'response-time':
        selectedServer = this.selectByResponseTime(healthyServers);
        reason = 'Response time based';
        break;
        
      default:
        selectedServer = healthyServers[0];
        reason = 'Default selection';
    }

    const adapter = this.registry.getAdapter(selectedServer.id);
    if (!adapter) {
      console.error(`[MCPLoadBalancer] No adapter found for server ${selectedServer.id}`);
      return null;
    }

    // Update connection count
    this.incrementActiveConnections(selectedServer.id);
    
    const alternativeServers = healthyServers.filter(s => s.id !== selectedServer.id);
    
    this.emit('server-selected', { server: selectedServer, reason, requestContext });
    
    return {
      selectedServer,
      adapter,
      reason,
      alternativeServers
    };
  }

  /**
   * Get healthy servers that are available for load balancing
   */
  private getHealthyServers(): MCPServerInfo[] {
    return this.registry.getOnlineServers().filter(server => {
      const load = this.serverLoads.get(server.id);
      const circuitBreaker = this.circuitBreakers.get(server.id);
      
      return load?.isHealthy && 
             circuitBreaker?.state !== 'open' &&
             load.errorRate < this.config.healthThreshold &&
             load.averageResponseTime < this.config.maxResponseTime;
    });
  }

  /**
   * Round-robin server selection
   */
  private selectRoundRobin(servers: MCPServerInfo[]): MCPServerInfo {
    const server = servers[this.roundRobinIndex % servers.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % servers.length;
    return server;
  }

  /**
   * Least connections server selection
   */
  private selectLeastConnections(servers: MCPServerInfo[]): MCPServerInfo {
    return servers.reduce((best, current) => {
      const bestLoad = this.serverLoads.get(best.id);
      const currentLoad = this.serverLoads.get(current.id);
      
      if (!bestLoad || !currentLoad) return best;
      
      return currentLoad.activeConnections < bestLoad.activeConnections ? current : best;
    });
  }

  /**
   * Weighted server selection
   */
  private selectWeighted(servers: MCPServerInfo[]): MCPServerInfo {
    const totalWeight = servers.reduce((sum, server) => {
      const load = this.serverLoads.get(server.id);
      return sum + (load?.weight || 1);
    }, 0);
    
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    
    for (const server of servers) {
      const load = this.serverLoads.get(server.id);
      currentWeight += load?.weight || 1;
      if (random <= currentWeight) {
        return server;
      }
    }
    
    return servers[0]; // Fallback
  }

  /**
   * Health-based server selection
   */
  private selectHealthBased(servers: MCPServerInfo[]): MCPServerInfo {
    return servers.reduce((best, current) => {
      const bestLoad = this.serverLoads.get(best.id);
      const currentLoad = this.serverLoads.get(current.id);
      
      if (!bestLoad || !currentLoad) return best;
      
      // Calculate health score (lower is better)
      const bestScore = bestLoad.errorRate + (bestLoad.averageResponseTime / 1000);
      const currentScore = currentLoad.errorRate + (currentLoad.averageResponseTime / 1000);
      
      return currentScore < bestScore ? current : best;
    });
  }

  /**
   * Response time-based server selection
   */
  private selectByResponseTime(servers: MCPServerInfo[]): MCPServerInfo {
    return servers.reduce((best, current) => {
      const bestLoad = this.serverLoads.get(best.id);
      const currentLoad = this.serverLoads.get(current.id);
      
      if (!bestLoad || !currentLoad) return best;
      
      return currentLoad.averageResponseTime < bestLoad.averageResponseTime ? current : best;
    });
  }

  /**
   * Increment active connections for a server
   */
  private incrementActiveConnections(serverId: string): void {
    const load = this.serverLoads.get(serverId);
    if (load) {
      load.activeConnections++;
      this.serverLoads.set(serverId, load);
    }
  }

  /**
   * Decrement active connections for a server
   */
  public decrementActiveConnections(serverId: string): void {
    const load = this.serverLoads.get(serverId);
    if (load && load.activeConnections > 0) {
      load.activeConnections--;
      this.serverLoads.set(serverId, load);
    }
  }

  /**
   * Record request success for circuit breaker
   */
  public recordSuccess(serverId: string, responseTime: number): void {
    const circuitBreaker = this.circuitBreakers.get(serverId);
    const load = this.serverLoads.get(serverId);
    
    if (circuitBreaker) {
      circuitBreaker.failureCount = 0;
      if (circuitBreaker.state === 'half-open') {
        circuitBreaker.state = 'closed';
        console.log(`[MCPLoadBalancer] Circuit breaker closed for server ${serverId}`);
      }
      this.circuitBreakers.set(serverId, circuitBreaker);
    }
    
    if (load) {
      // Update average response time with exponential moving average
      load.averageResponseTime = (load.averageResponseTime * 0.8) + (responseTime * 0.2);
      this.serverLoads.set(serverId, load);
    }
  }

  /**
   * Record request failure for circuit breaker
   */
  public recordFailure(serverId: string, error: Error): void {
    const circuitBreaker = this.circuitBreakers.get(serverId);
    const load = this.serverLoads.get(serverId);
    
    if (circuitBreaker) {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailure = Date.now();
      
      if (circuitBreaker.failureCount >= this.config.circuitBreakerThreshold && 
          circuitBreaker.state === 'closed') {
        circuitBreaker.state = 'open';
        console.log(`[MCPLoadBalancer] Circuit breaker opened for server ${serverId}`);
        
        // Schedule half-open attempt
        setTimeout(() => {
          const currentBreaker = this.circuitBreakers.get(serverId);
          if (currentBreaker && currentBreaker.state === 'open') {
            currentBreaker.state = 'half-open';
            this.circuitBreakers.set(serverId, currentBreaker);
            console.log(`[MCPLoadBalancer] Circuit breaker half-open for server ${serverId}`);
          }
        }, this.config.circuitBreakerTimeout);
      }
      
      this.circuitBreakers.set(serverId, circuitBreaker);
    }
    
    if (load) {
      // Update error rate with exponential moving average
      load.errorRate = (load.errorRate * 0.9) + 0.1;
      this.serverLoads.set(serverId, load);
    }
    
    this.emit('server-failure', { serverId, error });
  }

  /**
   * Get load balancer statistics
   */
  public getStatistics(): {
    totalServers: number;
    healthyServers: number;
    totalConnections: number;
    averageResponseTime: number;
    totalErrorRate: number;
    circuitBreakersOpen: number;
  } {
    const loads = Array.from(this.serverLoads.values());
    const breakers = Array.from(this.circuitBreakers.values());
    
    return {
      totalServers: loads.length,
      healthyServers: loads.filter(l => l.isHealthy).length,
      totalConnections: loads.reduce((sum, l) => sum + l.activeConnections, 0),
      averageResponseTime: loads.length > 0 
        ? loads.reduce((sum, l) => sum + l.averageResponseTime, 0) / loads.length 
        : 0,
      totalErrorRate: loads.length > 0 
        ? loads.reduce((sum, l) => sum + l.errorRate, 0) / loads.length 
        : 0,
      circuitBreakersOpen: breakers.filter(b => b.state === 'open').length
    };
  }

  /**
   * Get current server loads
   */
  public getServerLoads(): Map<string, ServerLoad> {
    return new Map(this.serverLoads);
  }

  /**
   * Record latency for a server (legacy method)
   */
  public async recordLatency(serverId: string, latency: number): Promise<void> {
    this.recordSuccess(serverId, latency);
  }

  /**
   * Get load balancer metrics (legacy method)
   */
  public getMetrics(): any {
    return this.getStatistics();
  }

  /**
   * Update server weight for weighted load balancing
   */
  public updateServerWeight(serverId: string, weight: number): boolean {
    const load = this.serverLoads.get(serverId);
    if (load) {
      load.weight = Math.max(0.1, Math.min(10.0, weight)); // Clamp between 0.1 and 10.0
      this.serverLoads.set(serverId, load);
      this.emit('server-weight-updated', { serverId, weight: load.weight });
      return true;
    }
    return false;
  }

  /**
   * Shutdown the load balancer
   */
  public shutdown(): void {
    this.isActive = false;
    this.serverLoads.clear();
    this.circuitBreakers.clear();
    this.roundRobinIndex = 0;
    
    console.log('[MCPLoadBalancer] Load balancer shutdown complete');
    this.emit('load-balancer-shutdown');
  }
}

/* <!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-01-27T14:55:25-05:00 | protocol-dev@claude-3-5-sonnet-20241022 | Created real MCP Load Balancer | MCPLoadBalancer.ts | OK | Real load balancing with circuit breakers | 0.00 | c9f6b2d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: a2a-protocol-mcp-loadbalancer-creation
- inputs: ["Load balancing requirements"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"protocol-dev-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE --> */