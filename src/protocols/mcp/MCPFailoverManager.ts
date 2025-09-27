/**
 * MCP Failover Manager - Real implementation for handling server failures and automatic recovery
 * Provides actual failover logic, backup server management, and recovery strategies
 */

import { EventEmitter } from 'events';
import { MCPServerRegistry, MCPServerInfo } from './MCPServerRegistry';
import { MCPLoadBalancer } from './MCPLoadBalancer';
import { MCPProtocolAdapter } from './MCPProtocolAdapter';

export interface FailoverConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  recoveryTimeout: number;
  prioritizeBackupServers: boolean;
  automaticRecovery: boolean;
}

export interface FailoverEvent {
  type: 'server-failed' | 'failover-initiated' | 'failover-completed' | 'recovery-started' | 'recovery-completed';
  timestamp: number;
  serverId: string;
  backupServerId?: string;
  reason: string;
  duration?: number;
}

export interface BackupServerConfig {
  serverId: string;
  priority: number;
  capabilities: string[];
  isActive: boolean;
  lastUsed: number;
}

export interface FailoverResult {
  success: boolean;
  originalServerId: string;
  backupServerId?: string;
  attempts: number;
  duration: number;
  reason: string;
}

/**
 * Real MCP Failover Manager implementation
 * Handles automatic failover and recovery for MCP servers
 */
export class MCPFailoverManager extends EventEmitter {
  private backupServers = new Map<string, BackupServerConfig>();
  private failedServers = new Set<string>();
  private activeFailovers = new Map<string, NodeJS.Timeout>();
  private recoveryTimers = new Map<string, NodeJS.Timeout>();
  private failoverHistory: FailoverEvent[] = [];
  private isActive = false;

  constructor(
    private registry: MCPServerRegistry,
    private loadBalancer: MCPLoadBalancer,
    private config: FailoverConfig
  ) {
    super();
    this.initializeFailoverManager();
  }

  /**
   * Initialize the failover manager
   */
  private initializeFailoverManager(): void {
    this.isActive = true;
    
    // Listen to server status changes
    this.registry.on('server-status-changed', ({ server, previousStatus }) => {
      this.handleServerStatusChange(server, previousStatus);
    });
    
    // Listen to load balancer failures
    this.loadBalancer.on('server-failure', ({ serverId, error }) => {
      this.handleServerFailure(serverId, error);
    });
    
    // Listen to server unregistration
    this.registry.on('server-unregistered', (server: MCPServerInfo) => {
      this.removeBackupServer(server.id);
      this.failedServers.delete(server.id);
    });
    
    console.log('[MCPFailoverManager] Failover manager initialized');
    this.emit('failover-manager-initialized');
  }

  /**
   * Register a backup server for failover
   */
  public registerBackupServer(serverId: string, priority: number, capabilities: string[]): boolean {
    const server = this.registry.getServer(serverId);
    if (!server) {
      console.error(`[MCPFailoverManager] Server ${serverId} not found in registry`);
      return false;
    }

    const backupConfig: BackupServerConfig = {
      serverId,
      priority,
      capabilities,
      isActive: true,
      lastUsed: 0
    };
    
    this.backupServers.set(serverId, backupConfig);
    
    console.log(`[MCPFailoverManager] Registered backup server: ${serverId} (priority: ${priority})`);
    this.emit('backup-server-registered', backupConfig);
    
    return true;
  }

  /**
   * Remove a backup server
   */
  public removeBackupServer(serverId: string): boolean {
    const removed = this.backupServers.delete(serverId);
    if (removed) {
      console.log(`[MCPFailoverManager] Removed backup server: ${serverId}`);
      this.emit('backup-server-removed', { serverId });
    }
    return removed;
  }

  /**
   * Handle server status changes
   */
  private handleServerStatusChange(server: MCPServerInfo, previousStatus: string): void {
    if (server.status === 'offline' && previousStatus === 'online') {
      this.handleServerFailure(server.id, new Error('Server went offline'));
    } else if (server.status === 'online' && this.failedServers.has(server.id)) {
      this.handleServerRecovery(server.id);
    }
  }

  /**
   * Handle server failure and initiate failover
   */
  private async handleServerFailure(serverId: string, error: Error): Promise<void> {
    if (this.failedServers.has(serverId)) {
      return; // Already handling this server's failure
    }
    
    this.failedServers.add(serverId);
    
    const failoverEvent: FailoverEvent = {
      type: 'server-failed',
      timestamp: Date.now(),
      serverId,
      reason: error.message
    };
    
    this.recordFailoverEvent(failoverEvent);
    
    console.log(`[MCPFailoverManager] Server ${serverId} failed: ${error.message}`);
    this.emit('server-failed', { serverId, error });
    
    // Initiate failover
    await this.initiateFailover(serverId, error);
  }

  /**
   * Initiate failover to backup servers
   */
  private async initiateFailover(failedServerId: string, error: Error): Promise<FailoverResult> {
    const startTime = Date.now();
    
    const failoverEvent: FailoverEvent = {
      type: 'failover-initiated',
      timestamp: startTime,
      serverId: failedServerId,
      reason: `Initiating failover due to: ${error.message}`
    };
    
    this.recordFailoverEvent(failoverEvent);
    
    console.log(`[MCPFailoverManager] Initiating failover for server ${failedServerId}`);
    this.emit('failover-initiated', { serverId: failedServerId });
    
    // Get the failed server's capabilities
    const failedServer = this.registry.getServer(failedServerId);
    const requiredCapabilities = failedServer?.capabilities || [];
    
    // Find suitable backup servers
    const backupCandidates = this.findBackupServers(requiredCapabilities);
    
    let attempts = 0;
    let backupServerId: string | undefined;
    
    for (const backup of backupCandidates) {
      if (attempts >= this.config.maxRetries) {
        break;
      }
      
      attempts++;
      
      try {
        const isHealthy = await this.testBackupServer(backup.serverId);
        if (isHealthy) {
          backupServerId = backup.serverId;
          backup.lastUsed = Date.now();
          this.backupServers.set(backup.serverId, backup);
          break;
        }
      } catch (testError) {
        console.error(`[MCPFailoverManager] Backup server ${backup.serverId} test failed:`, testError);
        // Continue to next backup
      }
      
      // Wait before next attempt
      if (attempts < this.config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
    
    const duration = Date.now() - startTime;
    const success = backupServerId !== undefined;
    
    const result: FailoverResult = {
      success,
      originalServerId: failedServerId,
      backupServerId,
      attempts,
      duration,
      reason: success ? 'Failover completed successfully' : 'No suitable backup server found'
    };
    
    const completedEvent: FailoverEvent = {
      type: 'failover-completed',
      timestamp: Date.now(),
      serverId: failedServerId,
      backupServerId,
      reason: result.reason,
      duration
    };
    
    this.recordFailoverEvent(completedEvent);
    
    if (success) {
      console.log(`[MCPFailoverManager] Failover completed: ${failedServerId} -> ${backupServerId}`);
      this.emit('failover-completed', result);
      
      // Schedule recovery check if automatic recovery is enabled
      if (this.config.automaticRecovery) {
        this.scheduleRecoveryCheck(failedServerId);
      }
    } else {
      console.error(`[MCPFailoverManager] Failover failed for server ${failedServerId}`);
      this.emit('failover-failed', result);
    }
    
    return result;
  }

  /**
   * Find suitable backup servers for the required capabilities
   */
  private findBackupServers(requiredCapabilities: string[]): BackupServerConfig[] {
    const candidates = Array.from(this.backupServers.values())
      .filter(backup => {
        // Check if backup server is active and not failed
        if (!backup.isActive || this.failedServers.has(backup.serverId)) {
          return false;
        }
        
        // Check if backup server has required capabilities
        return requiredCapabilities.every(cap => backup.capabilities.includes(cap));
      })
      .sort((a, b) => {
        // Sort by priority (higher priority first), then by last used (least recently used first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.lastUsed - b.lastUsed;
      });
    
    return candidates;
  }

  /**
   * Test if a backup server is healthy and ready
   */
  private async testBackupServer(serverId: string): Promise<boolean> {
    try {
      const server = this.registry.getServer(serverId);
      if (!server || server.status !== 'online') {
        return false;
      }
      
      const adapter = this.registry.getAdapter(serverId);
      if (!adapter) {
        return false;
      }
      
      const status = adapter.getStatus();
      return status.isConnected && status.mcpConnected && status.a2aConnected;
    } catch (error) {
      console.error(`[MCPFailoverManager] Error testing backup server ${serverId}:`, error);
      return false;
    }
  }

  /**
   * Schedule recovery check for a failed server
   */
  private scheduleRecoveryCheck(serverId: string): void {
    // Clear existing recovery timer if any
    const existingTimer = this.recoveryTimers.get(serverId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(async () => {
      await this.attemptServerRecovery(serverId);
    }, this.config.recoveryTimeout);
    
    this.recoveryTimers.set(serverId, timer);
  }

  /**
   * Attempt to recover a failed server
   */
  private async attemptServerRecovery(serverId: string): Promise<boolean> {
    if (!this.failedServers.has(serverId)) {
      return true; // Already recovered
    }
    
    const recoveryEvent: FailoverEvent = {
      type: 'recovery-started',
      timestamp: Date.now(),
      serverId,
      reason: 'Attempting automatic recovery'
    };
    
    this.recordFailoverEvent(recoveryEvent);
    
    console.log(`[MCPFailoverManager] Attempting recovery for server ${serverId}`);
    this.emit('recovery-started', { serverId });
    
    try {
      const isHealthy = await this.testBackupServer(serverId);
      if (isHealthy) {
        this.handleServerRecovery(serverId);
        return true;
      } else {
        // Schedule another recovery attempt
        this.scheduleRecoveryCheck(serverId);
        return false;
      }
    } catch (error) {
      console.error(`[MCPFailoverManager] Recovery attempt failed for server ${serverId}:`, error);
      this.scheduleRecoveryCheck(serverId);
      return false;
    }
  }

  /**
   * Handle server recovery
   */
  private handleServerRecovery(serverId: string): void {
    if (!this.failedServers.has(serverId)) {
      return; // Not in failed state
    }
    
    this.failedServers.delete(serverId);
    
    // Clear recovery timer
    const timer = this.recoveryTimers.get(serverId);
    if (timer) {
      clearTimeout(timer);
      this.recoveryTimers.delete(serverId);
    }
    
    const recoveryEvent: FailoverEvent = {
      type: 'recovery-completed',
      timestamp: Date.now(),
      serverId,
      reason: 'Server successfully recovered'
    };
    
    this.recordFailoverEvent(recoveryEvent);
    
    console.log(`[MCPFailoverManager] Server ${serverId} recovered successfully`);
    this.emit('recovery-completed', { serverId });
  }

  /**
   * Record a failover event in history
   */
  private recordFailoverEvent(event: FailoverEvent): void {
    this.failoverHistory.push(event);
    
    // Keep only last 1000 events
    if (this.failoverHistory.length > 1000) {
      this.failoverHistory = this.failoverHistory.slice(-1000);
    }
    
    this.emit('failover-event', event);
  }

  /**
   * Get failover statistics
   */
  public getStatistics(): {
    totalBackupServers: number;
    activeBackupServers: number;
    failedServers: number;
    totalFailoverEvents: number;
    recentFailovers: number;
    averageRecoveryTime: number;
  } {
    const now = Date.now();
    const recentThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    const recentEvents = this.failoverHistory.filter(event => 
      now - event.timestamp < recentThreshold
    );
    
    const recoveryEvents = this.failoverHistory.filter(event => 
      event.type === 'recovery-completed' && event.duration
    );
    
    const averageRecoveryTime = recoveryEvents.length > 0
      ? recoveryEvents.reduce((sum, event) => sum + (event.duration || 0), 0) / recoveryEvents.length
      : 0;
    
    return {
      totalBackupServers: this.backupServers.size,
      activeBackupServers: Array.from(this.backupServers.values()).filter(b => b.isActive).length,
      failedServers: this.failedServers.size,
      totalFailoverEvents: this.failoverHistory.length,
      recentFailovers: recentEvents.length,
      averageRecoveryTime
    };
  }

  /**
   * Get backup servers configuration
   */
  public getBackupServers(): BackupServerConfig[] {
    return Array.from(this.backupServers.values());
  }

  /**
   * Get failover history
   */
  public getFailoverHistory(limit = 100): FailoverEvent[] {
    return this.failoverHistory.slice(-limit);
  }

  /**
   * Get current failed servers
   */
  public getFailedServers(): string[] {
    return Array.from(this.failedServers);
  }

  /**
   * Get failover server (legacy method)
   */
  public getFailoverServer(serverId: string): string | null {
    const backupCandidates = this.findBackupServers([]);
    return backupCandidates.length > 0 ? backupCandidates[0].serverId : null;
  }

  /**
   * Get failover manager metrics (legacy method)
   */
  public getMetrics(): any {
    return this.getStatistics();
  }

  /**
   * Manually trigger failover for a server
   */
  public async manualFailover(serverId: string, reason = 'Manual failover triggered'): Promise<FailoverResult> {
    const error = new Error(reason);
    return await this.initiateFailover(serverId, error);
  }

  /**
   * Manually trigger recovery for a server
   */
  public async manualRecovery(serverId: string): Promise<boolean> {
    return await this.attemptServerRecovery(serverId);
  }

  /**
   * Update backup server priority
   */
  public updateBackupPriority(serverId: string, priority: number): boolean {
    const backup = this.backupServers.get(serverId);
    if (backup) {
      backup.priority = priority;
      this.backupServers.set(serverId, backup);
      this.emit('backup-priority-updated', { serverId, priority });
      return true;
    }
    return false;
  }

  /**
   * Shutdown the failover manager
   */
  public shutdown(): void {
    this.isActive = false;
    
    // Clear all timers
    for (const timer of Array.from(this.activeFailovers.values())) {
      clearTimeout(timer);
    }
    this.activeFailovers.clear();
    
    for (const timer of Array.from(this.recoveryTimers.values())) {
      clearTimeout(timer);
    }
    this.recoveryTimers.clear();
    
    this.backupServers.clear();
    this.failedServers.clear();
    this.failoverHistory = [];
    
    console.log('[MCPFailoverManager] Failover manager shutdown complete');
    this.emit('failover-manager-shutdown');
  }
}

/* <!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-01-27T14:55:35-05:00 | protocol-dev@claude-3-5-sonnet-20241022 | Created real MCP Failover Manager | MCPFailoverManager.ts | OK | Real failover and recovery system | 0.00 | d1e7c3f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: a2a-protocol-mcp-failover-creation
- inputs: ["Failover management requirements"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"protocol-dev-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE --> */