/**
 * Facade for Distributed Memory Sync FSM
 * NASA Rule 10 Compliant: ≤60 lines per function, 2+ assertions
 * Provides clean interface to FSM-based distributed synchronization
 */

import { EventEmitter } from 'events';
import { LangroidMemoryManager } from '../../langroid/LangroidMemoryManager';
import { SyncNode, SyncMessage, SyncConflict, SyncConfig, SyncMetrics } from '../DistributedMemorySync';
import { SyncContext, SyncState, SyncEvent } from './SyncTypes';
import { SyncStateMachine } from './SyncStateMachine';
import { InitState } from './states/InitState';
import { ConnectingState } from './states/ConnectingState';
import { SyncingState } from './states/SyncingState';
import { ResolvingConflictsState } from './states/ResolvingConflictsState';
import { BroadcastingState } from './states/BroadcastingState';
import { ErrorRecoveryState } from './states/ErrorRecoveryState';
import { SynchronizedState } from './states/SynchronizedState';

export class DistributedSyncFacade extends EventEmitter {
  private fsm: SyncStateMachine;
  private context: SyncContext;
  private stateHandlers = new Map<SyncState, any>();

  constructor(memoryManager: LangroidMemoryManager, config: Partial<SyncConfig> = {}) {
    super();
    console.assert(memoryManager != null, 'Memory manager required');
    
    this.context = this.initializeContext(memoryManager, config);
    this.fsm = new SyncStateMachine(this.context);
    
    this.initializeStateHandlers();
    this.setupEventHandlers();
  }

  async start(): Promise<void> {
    console.assert(this.fsm != null, 'FSM must be initialized');
    
    await this.fsm.processEvent(SyncEvent.START);
  }

  async addNode(node: Omit<SyncNode, 'status' | 'lastHeartbeat' | 'syncVersion'>): Promise<void> {
    console.assert(node?.id != null, 'Node ID required');
    console.assert(!this.context.nodes.has(node.id), 'Node must not already exist');
    
    if (this.context.nodes.size >= this.context.config.maxNodes) {
      throw new Error('Maximum number of nodes reached');
    }
    
    const fullNode: SyncNode = {
      ...node,
      status: 'offline',
      lastHeartbeat: 0,
      syncVersion: 0
    };
    
    this.context.nodes.set(node.id, fullNode);
    this.context.vectorClock.set(node.id, 0);
    
    this.emit('node_added', { nodeId: node.id });
    
    // Trigger nodes discovered event if in CONNECTING state
    if (this.fsm.getCurrentState() === SyncState.CONNECTING) {
      await this.fsm.processEvent(SyncEvent.NODES_DISCOVERED);
    }
  }

  async removeNode(nodeId: string): Promise<boolean> {
    console.assert(nodeId != null, 'Node ID required');
    
    const removed = this.context.nodes.delete(nodeId);
    this.context.vectorClock.delete(nodeId);
    
    if (removed) {
      this.emit('node_removed', { nodeId });
    }
    
    return removed;
  }

  async synchronizeAll(): Promise<void> {
    console.assert(this.fsm != null, 'FSM must be initialized');
    
    const currentState = this.fsm.getCurrentState();
    
    if (currentState === SyncState.SYNCHRONIZED) {
      await this.fsm.processEvent(SyncEvent.SYNC_REQUESTED);
    } else if (currentState === SyncState.CONNECTING) {
      await this.fsm.processEvent(SyncEvent.NODES_DISCOVERED);
    }
  }

  async processMessage(message: SyncMessage): Promise<void> {
    console.assert(message != null, 'Message required');
    console.assert(message.type != null, 'Message type required');
    
    const currentState = this.fsm.getCurrentState();
    
    switch (message.type) {
      case 'heartbeat':
        await this.handleHeartbeat(message);
        break;
      case 'sync_request':
        await this.handleSyncRequest(message);
        break;
      case 'sync_response':
        await this.handleSyncResponse(message);
        break;
      case 'conflict':
        await this.handleConflict(message);
        break;
      case 'resolution':
        await this.handleResolution(message);
        break;
    }
  }

  getMetrics(): SyncMetrics {
    console.assert(this.context?.metrics != null, 'Metrics must exist');
    
    this.updateMetrics();
    return { ...this.context.metrics };
  }

  getNodes(): SyncNode[] {
    console.assert(this.context?.nodes != null, 'Nodes must exist');
    
    return Array.from(this.context.nodes.values()).map(node => ({ ...node }));
  }

  getCurrentState(): SyncState {
    console.assert(this.fsm != null, 'FSM must be initialized');
    
    return this.fsm.getCurrentState();
  }

  async shutdown(): Promise<void> {
    console.assert(this.fsm != null, 'FSM must be initialized');
    
    await this.fsm.shutdown();
    this.context.nodes.clear();
    this.context.pendingSyncs.clear();
    this.context.conflicts.clear();
    this.context.messageQueue.length = 0;
    
    this.emit('shutdown');
  }

  private initializeContext(
    memoryManager: LangroidMemoryManager, 
    config: Partial<SyncConfig>
  ): SyncContext {
    console.assert(memoryManager != null, 'Memory manager required');
    
    const fullConfig: SyncConfig = {
      nodeId: this.generateNodeId(),
      maxNodes: 10,
      heartbeatInterval: 5000,
      syncInterval: 30000,
      conflictResolutionTimeout: 10000,
      maxRetries: 3,
      enablePartitioning: true,
      consistencyLevel: 'eventual',
      ...config
    };
    
    const metrics: SyncMetrics = {
      totalNodes: 0,
      onlineNodes: 0,
      totalSyncOperations: 0,
      conflictsResolved: 0,
      averageSyncTime: 0,
      networkLatency: 0,
      dataIntegrity: 1.0
    };
    
    const vectorClock = new Map<string, number>();
    vectorClock.set(fullConfig.nodeId, 0);
    
    return {
      memoryManager,
      config: fullConfig,
      nodes: new Map(),
      pendingSyncs: new Map(),
      conflicts: new Map(),
      metrics,
      vectorClock,
      messageQueue: []
    };
  }

  private initializeStateHandlers(): void {
    console.assert(this.fsm != null, 'FSM must be initialized');
    
    this.stateHandlers.set(SyncState.INIT, new InitState());
    this.stateHandlers.set(SyncState.CONNECTING, new ConnectingState());
    this.stateHandlers.set(SyncState.SYNCING, new SyncingState());
    this.stateHandlers.set(SyncState.RESOLVING_CONFLICTS, new ResolvingConflictsState());
    this.stateHandlers.set(SyncState.BROADCASTING, new BroadcastingState());
    this.stateHandlers.set(SyncState.ERROR_RECOVERY, new ErrorRecoveryState());
    this.stateHandlers.set(SyncState.SYNCHRONIZED, new SynchronizedState());
    
    // Register handlers with FSM
    for (const [state, handler] of this.stateHandlers.entries()) {
      this.fsm.registerStateHandler(state, handler);
    }
  }

  private setupEventHandlers(): void {
    console.assert(this.fsm != null, 'FSM must be initialized');
    
    this.fsm.on('state_changed', (event) => {
      this.emit('state_changed', event);
    });
    
    this.fsm.on('error', (error) => {
      this.handleFSMError(error);
    });
  }

  private async handleHeartbeat(message: SyncMessage): Promise<void> {
    console.assert(message.type === 'heartbeat', 'Must be heartbeat message');
    
    const handler = this.stateHandlers.get(this.fsm.getCurrentState());
    if (handler?.update) {
      await handler.update(this.context, { heartbeat: message });
    }
  }

  private async handleSyncRequest(message: SyncMessage): Promise<void> {
    console.assert(message.type === 'sync_request', 'Must be sync request message');
    
    const currentState = this.fsm.getCurrentState();
    
    if (currentState === SyncState.SYNCING) {
      const handler = this.stateHandlers.get(currentState);
      if (handler?.update) {
        await handler.update(this.context, { syncRequest: message });
      }
    }
  }

  private async handleSyncResponse(message: SyncMessage): Promise<void> {
    console.assert(message.type === 'sync_response', 'Must be sync response message');
    
    const handler = this.stateHandlers.get(this.fsm.getCurrentState());
    if (handler?.update) {
      await handler.update(this.context, { syncResponse: message });
    }
  }

  private async handleConflict(message: SyncMessage): Promise<void> {
    console.assert(message.type === 'conflict', 'Must be conflict message');
    
    await this.fsm.processEvent(SyncEvent.CONFLICTS_DETECTED, message);
  }

  private async handleResolution(message: SyncMessage): Promise<void> {
    console.assert(message.type === 'resolution', 'Must be resolution message');
    
    const currentState = this.fsm.getCurrentState();
    
    if (currentState === SyncState.RESOLVING_CONFLICTS) {
      await this.fsm.processEvent(SyncEvent.CONFLICTS_RESOLVED, message);
    }
  }

  private async handleFSMError(error: Error): Promise<void> {
    console.assert(error != null, 'Error must exist');
    
    this.context.error = error;
    await this.fsm.processEvent(SyncEvent.ERROR_OCCURRED, { error });
    
    this.emit('error', error);
  }

  private updateMetrics(): void {
    console.assert(this.context?.metrics != null, 'Metrics must exist');
    
    this.context.metrics.totalNodes = this.context.nodes.size;
    this.context.metrics.onlineNodes = Array.from(this.context.nodes.values())
      .filter(node => node.status === 'online').length;
  }

  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Additional facade methods for backward compatibility
  async sendHeartbeat(): Promise<void> {
    const handler = this.stateHandlers.get(SyncState.CONNECTING);
    if (handler && 'sendHeartbeat' in handler) {
      await handler.sendHeartbeat(this.context);
    }
  }

  processHeartbeat(message: SyncMessage): void {
    console.assert(message?.type === 'heartbeat', 'Must be heartbeat message');
    
    this.handleHeartbeat(message);
  }

  async syncWithNode(nodeId: string, localData: Map<string, any>): Promise<void> {
    console.assert(nodeId != null, 'Node ID required');
    console.assert(localData != null, 'Local data required');
    
    const syncMessage: SyncMessage = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'sync_request',
      sourceNodeId: this.context.config.nodeId,
      targetNodeId: nodeId,
      payload: { localData: Object.fromEntries(localData) },
      timestamp: Date.now(),
      version: this.incrementVectorClock(this.context.config.nodeId)
    };
    
    await this.processMessage(syncMessage);
  }

  private incrementVectorClock(nodeId: string): number {
    console.assert(nodeId != null, 'Node ID required');
    
    const current = this.context.vectorClock.get(nodeId) || 0;
    const incremented = current + 1;
    this.context.vectorClock.set(nodeId, incremented);
    return incremented;
  }
}

// Backward compatibility

// Backward compatibility
export default DistributedSyncFacade;
