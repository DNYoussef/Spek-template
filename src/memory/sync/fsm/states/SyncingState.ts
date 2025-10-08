/**
 * SYNCING State Handler for Distributed Memory Sync
 * NASA Rule 10 Compliant: ≤60 lines per function, 2+ assertions
 */

import { StateHandler, SyncContext, SyncOperation } from '../SyncTypes';
import { MemoryEntry } from '../../../langroid/LangroidMemoryManager';
import { SyncMessage } from '../../DistributedMemorySync';

export class SyncingState implements StateHandler {
  private activeSyncs = new Map<string, SyncOperation>();

  async enter(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    console.assert(context.memoryManager != null, 'Memory manager required');
    
    const syncId = this.generateSyncId();
    context.lastSyncTime = Date.now();
    await this.initiateSyncWithAllNodes(context, syncId);
  }

  async update(context: SyncContext, data?: any): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    
    if (data?.syncRequest) {
      await this.processSyncRequest(context, data.syncRequest);
    }
    
    if (data?.syncResponse) {
      await this.processSyncResponse(context, data.syncResponse);
    }
    
    await this.checkSyncProgress(context);
  }

  async exit(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    console.assert(this.checkInvariants(context), 'Invariants must hold');
    
    await this.completePendingSyncs(context);
    this.activeSyncs.clear();
  }

  checkInvariants(context: SyncContext): boolean {
    console.assert(context != null, 'Context must not be null');
    
    const hasValidLastSyncTime = context.lastSyncTime != null && context.lastSyncTime > 0;
    const activeSyncsValid = this.activeSyncs.size >= 0;
    const pendingSyncsValid = context.pendingSyncs.size >= 0;
    
    return hasValidLastSyncTime && activeSyncsValid && pendingSyncsValid;
  }

  private async initiateSyncWithAllNodes(context: SyncContext, syncId: string): Promise<void> {
    console.assert(context.config?.nodeId != null, 'Node ID required');
    console.assert(syncId != null, 'Sync ID required');
    
    const onlineNodes = Array.from(context.nodes.values())
      .filter(node => node.status === 'online');
    
    if (onlineNodes.length === 0) {
      return;
    }
    
    const localData = await this.collectLocalData(context);
    
    for (const node of onlineNodes) {
      await this.syncWithNode(context, node.id, localData, syncId);
    }
    
    context.metrics.totalSyncOperations++;
  }

  private async collectLocalData(context: SyncContext): Promise<Map<string, MemoryEntry>> {
    console.assert(context.memoryManager != null, 'Memory manager required');
    
    const localKeys = context.memoryManager.listKeys();
    const syncData = new Map<string, MemoryEntry>();
    
    for (const key of localKeys) {
      const data = await context.memoryManager.retrieve(key);
      if (data !== null) {
        syncData.set(key, {
          id: key,
          data,
          timestamp: Date.now(),
          accessCount: 0,
          lastAccessed: Date.now(),
          size: JSON.stringify(data).length,
          partitionId: 'default',
          version: context.vectorClock.get(context.config.nodeId) || 0
        });
      }
    }
    
    return syncData;
  }

  private async syncWithNode(
    context: SyncContext, 
    nodeId: string, 
    localData: Map<string, MemoryEntry>,
    syncId: string
  ): Promise<void> {
    console.assert(nodeId != null, 'Node ID required');
    console.assert(localData != null, 'Local data required');
    
    const node = context.nodes.get(nodeId);
    if (!node || node.status !== 'online') {
      return;
    }
    
    const syncMessage: SyncMessage = {
      id: this.generateMessageId(),
      type: 'sync_request',
      sourceNodeId: context.config.nodeId,
      targetNodeId: nodeId,
      payload: {
        syncId,
        keys: Array.from(localData.keys()),
        vectorClock: Object.fromEntries(context.vectorClock),
        partialData: this.selectPartialData(localData, nodeId, context)
      },
      timestamp: Date.now(),
      version: this.incrementVectorClock(context, context.config.nodeId)
    };
    
    context.pendingSyncs.set(syncMessage.id, syncMessage);
    node.status = 'syncing';
    
    const operation: SyncOperation = {
      id: syncMessage.id,
      type: 'sync',
      nodeId,
      startTime: Date.now(),
      status: 'running',
      retryCount: 0
    };
    
    this.activeSyncs.set(syncMessage.id, operation);
  }

  private async processSyncRequest(context: SyncContext, message: SyncMessage): Promise<void> {
    console.assert(message != null, 'Sync message required');
    console.assert(message.payload != null, 'Message payload required');
    
    const remoteData = new Map(Object.entries(message.payload.partialData || {}));
    const localData = await this.collectLocalData(context);
    const mergedData = new Map<string, MemoryEntry>();
    const conflicts: string[] = [];
    
    // Compare and merge data
    for (const [key, remoteEntry] of remoteData.entries()) {
      const localEntry = localData.get(key);
      
      if (!localEntry) {
        mergedData.set(key, remoteEntry as MemoryEntry);
      } else {
        const hasConflict = await this.detectConflict(localEntry, remoteEntry as MemoryEntry);
        if (hasConflict) {
          conflicts.push(key);
        } else {
          const newerEntry = this.selectNewerEntry(localEntry, remoteEntry as MemoryEntry);
          mergedData.set(key, newerEntry);
        }
      }
    }
    
    // Store conflicts for resolution
    if (conflicts.length > 0) {
      await this.storeConflicts(context, conflicts, localData, remoteData);
    }
    
    // Apply merged data
    await this.applyMergedData(context, mergedData);
  }

  private async processSyncResponse(context: SyncContext, message: SyncMessage): Promise<void> {
    console.assert(message != null, 'Sync response required');
    console.assert(message.sourceNodeId != null, 'Source node ID required');
    
    const pendingSync = context.pendingSyncs.get(message.payload.originalMessageId);
    if (!pendingSync) {
      return;
    }
    
    context.pendingSyncs.delete(message.payload.originalMessageId);
    const operation = this.activeSyncs.get(message.payload.originalMessageId);
    
    if (operation) {
      operation.status = message.payload.success ? 'completed' : 'failed';
    }
    
    const node = context.nodes.get(message.sourceNodeId);
    if (node) {
      node.status = 'online';
      node.syncVersion = message.version;
    }
    
    if (message.payload.vectorClock) {
      await this.mergeVectorClock(context, message.payload.vectorClock);
    }
    
    context.metrics.conflictsResolved += message.payload.conflictsResolved || 0;
  }

  private async checkSyncProgress(context: SyncContext): Promise<boolean> {
    console.assert(context != null, 'Context required');
    
    const activeOperations = Array.from(this.activeSyncs.values())
      .filter(op => op.status === 'running');
    
    return activeOperations.length === 0;
  }

  private async detectConflict(local: MemoryEntry, remote: MemoryEntry): Promise<boolean> {
    console.assert(local != null, 'Local entry required');
    console.assert(remote != null, 'Remote entry required');
    
    const hasVersionConflict = local.version !== remote.version;
    const hasDataConflict = JSON.stringify(local.data) !== JSON.stringify(remote.data);
    const hasTimestampConflict = Math.abs(local.timestamp - remote.timestamp) > 5000;
    
    return hasVersionConflict || hasDataConflict || hasTimestampConflict;
  }

  private selectNewerEntry(local: MemoryEntry, remote: MemoryEntry): MemoryEntry {
    console.assert(local != null, 'Local entry required');
    console.assert(remote != null, 'Remote entry required');
    
    return local.timestamp > remote.timestamp ? local : remote;
  }

  private selectPartialData(
    data: Map<string, MemoryEntry>, 
    nodeId: string, 
    context: SyncContext
  ): Record<string, MemoryEntry> {
    console.assert(data != null, 'Data required');
    console.assert(nodeId != null, 'Node ID required');
    
    if (!context.config.enablePartitioning) {
      return Object.fromEntries(data);
    }
    
    const result: Record<string, MemoryEntry> = {};
    for (const [key, entry] of data.entries()) {
      const hash = this.hashKey(key);
      const targetNode = Array.from(context.nodes.keys())[hash % context.nodes.size];
      if (targetNode === nodeId) {
        result[key] = entry;
      }
    }
    
    return result;
  }

  private hashKey(key: string): number {
    console.assert(key != null, 'Key required');
    
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private incrementVectorClock(context: SyncContext, nodeId: string): number {
    console.assert(nodeId != null, 'Node ID required');
    
    const current = context.vectorClock.get(nodeId) || 0;
    const incremented = current + 1;
    context.vectorClock.set(nodeId, incremented);
    return incremented;
  }

  private async mergeVectorClock(
    context: SyncContext, 
    remoteClock: Record<string, number>
  ): Promise<void> {
    console.assert(context.vectorClock != null, 'Vector clock required');
    
    for (const [nodeId, version] of Object.entries(remoteClock)) {
      const localVersion = context.vectorClock.get(nodeId) || 0;
      context.vectorClock.set(nodeId, Math.max(localVersion, version));
    }
  }

  private async storeConflicts(
    context: SyncContext,
    conflicts: string[],
    localData: Map<string, MemoryEntry>,
    remoteData: Map<string, MemoryEntry>
  ): Promise<void> {
    console.assert(conflicts.length > 0, 'Conflicts must exist');
    
    for (const key of conflicts) {
      const localEntry = localData.get(key);
      const remoteEntry = remoteData.get(key);
      
      if (localEntry && remoteEntry) {
        context.conflicts.set(key, {
          key,
          nodeVersions: new Map([
            [context.config.nodeId, localEntry],
            ['remote', remoteEntry as MemoryEntry]
          ]),
          conflictType: 'data',
          severity: 'high',
          resolutionStrategy: 'last-write-wins'
        });
      }
    }
  }

  private async applyMergedData(
    context: SyncContext, 
    mergedData: Map<string, MemoryEntry>
  ): Promise<void> {
    console.assert(context.memoryManager != null, 'Memory manager required');
    
    for (const [key, entry] of mergedData.entries()) {
      await context.memoryManager.store(key, entry.data, entry.partitionId);
    }
  }

  private async completePendingSyncs(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context required');
    
    const pendingOps = Array.from(this.activeSyncs.values())
      .filter(op => op.status === 'running');
    
    for (const op of pendingOps) {
      op.status = 'completed';
    }
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Backward compatibility
export default SyncingState;
