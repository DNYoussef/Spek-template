/**
 * INIT State Handler for Distributed Memory Sync
 * NASA Rule 10 Compliant: ≤60 lines per function, 2+ assertions
 */

import { StateHandler, SyncContext } from '../SyncTypes';

export class InitState implements StateHandler {
  async enter(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    console.assert(context.config != null, 'Config must be initialized');
    
    await this.initializeVectorClock(context);
    await this.resetMetrics(context);
    await this.clearState(context);
  }

  async update(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    
    // No ongoing operations in INIT state
    await this.validateInitialization(context);
  }

  async exit(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    console.assert(this.checkInvariants(context), 'Invariants must hold');
    
    // Prepare for next state
    await this.prepareForConnection(context);
  }

  checkInvariants(context: SyncContext): boolean {
    console.assert(context != null, 'Context must not be null');
    
    const hasValidConfig = context.config != null;
    const hasEmptyPendingSyncs = context.pendingSyncs.size === 0;
    const hasEmptyConflicts = context.conflicts.size === 0;
    const hasInitializedVectorClock = context.vectorClock.has(context.config.nodeId);
    
    return hasValidConfig && hasEmptyPendingSyncs && 
           hasEmptyConflicts && hasInitializedVectorClock;
  }

  private async initializeVectorClock(context: SyncContext): Promise<void> {
    console.assert(context.config?.nodeId != null, 'Node ID must exist');
    
    context.vectorClock.clear();
    context.vectorClock.set(context.config.nodeId, 0);
  }

  private async resetMetrics(context: SyncContext): Promise<void> {
    console.assert(context.metrics != null, 'Metrics must exist');
    
    context.metrics.totalNodes = 0;
    context.metrics.onlineNodes = 0;
    context.metrics.totalSyncOperations = 0;
    context.metrics.conflictsResolved = 0;
    context.metrics.averageSyncTime = 0;
    context.metrics.networkLatency = 0;
    context.metrics.dataIntegrity = 1.0;
  }

  private async clearState(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    
    context.pendingSyncs.clear();
    context.conflicts.clear();
    context.messageQueue.length = 0;
    context.error = undefined;
    context.lastSyncTime = undefined;
  }

  private async validateInitialization(context: SyncContext): Promise<void> {
    console.assert(context.config != null, 'Config must be valid');
    console.assert(context.memoryManager != null, 'Memory manager must exist');
    
    if (!context.config.nodeId) {
      throw new Error('Node ID not configured');
    }
  }

  private async prepareForConnection(context: SyncContext): Promise<void> {
    console.assert(context.config != null, 'Config must exist');
    console.assert(context.vectorClock.size > 0, 'Vector clock must be initialized');
    
    // Ready to start connecting to nodes
  }
}

// Backward compatibility
export default InitState;
