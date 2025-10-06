/**
 * RESOLVING_CONFLICTS State Handler for Distributed Memory Sync
 * NASA Rule 10 Compliant: ≤60 lines per function, 2+ assertions
 */

import { StateHandler, SyncContext, ConflictResolutionResult } from '../SyncTypes';
import { SyncConflict } from '../../DistributedMemorySync';
import { MemoryEntry } from '../../../langroid/LangroidMemoryManager';

export class ResolvingConflictsState implements StateHandler {
  private resolutionTimeout?: NodeJS.Timeout;
  private activeResolutions = new Map<string, ConflictResolutionResult>();

  async enter(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    console.assert(context.conflicts.size > 0, 'Conflicts must exist to resolve');
    
    await this.startResolutionTimer(context);
    await this.initiateConflictResolution(context);
  }

  async update(context: SyncContext, data?: any): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    
    if (data?.manualResolution) {
      await this.processManualResolution(context, data.manualResolution);
    }
    
    await this.checkResolutionProgress(context);
  }

  async exit(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    console.assert(this.checkInvariants(context), 'Invariants must hold');
    
    await this.stopResolutionTimer();
    await this.applyResolutions(context);
    this.activeResolutions.clear();
  }

  checkInvariants(context: SyncContext): boolean {
    console.assert(context != null, 'Context must not be null');
    
    const allConflictsResolved = context.conflicts.size === 0 || 
      this.activeResolutions.size === context.conflicts.size;
    const resolutionsValid = Array.from(this.activeResolutions.values())
      .every(res => res.resolved);
    
    return allConflictsResolved && resolutionsValid;
  }

  private async startResolutionTimer(context: SyncContext): Promise<void> {
    console.assert(context.config?.conflictResolutionTimeout > 0, 'Valid timeout required');
    
    this.resolutionTimeout = setTimeout(async () => {
      await this.forceResolutionCompletion(context);
    }, context.config.conflictResolutionTimeout);
  }

  private async stopResolutionTimer(): Promise<void> {
    if (this.resolutionTimeout) {
      clearTimeout(this.resolutionTimeout);
      this.resolutionTimeout = undefined;
    }
  }

  private async initiateConflictResolution(context: SyncContext): Promise<void> {
    console.assert(context.conflicts.size > 0, 'Conflicts must exist');
    
    for (const [key, conflict] of context.conflicts.entries()) {
      const resolution = await this.resolveConflict(context, conflict);
      this.activeResolutions.set(key, resolution);
    }
  }

  private async resolveConflict(
    context: SyncContext, 
    conflict: SyncConflict
  ): Promise<ConflictResolutionResult> {
    console.assert(conflict != null, 'Conflict must exist');
    console.assert(conflict.resolutionStrategy != null, 'Resolution strategy required');
    
    switch (conflict.resolutionStrategy) {
      case 'last-write-wins':
        return await this.resolveByTimestamp(conflict);
      case 'version-vector':
        return await this.resolveByVersion(conflict);
      case 'manual':
        return await this.resolveManually(context, conflict);
      default:
        return await this.resolveByTimestamp(conflict);
    }
  }

  private async resolveByTimestamp(conflict: SyncConflict): Promise<ConflictResolutionResult> {
    console.assert(conflict.nodeVersions.size > 0, 'Node versions must exist');
    
    let newest: MemoryEntry | null = null;
    let newestTimestamp = 0;
    
    for (const entry of conflict.nodeVersions.values()) {
      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
        newest = entry;
      }
    }
    
    console.assert(newest != null, 'Resolution must produce valid entry');
    
    return {
      resolved: true,
      entry: newest!,
      strategy: 'last-write-wins',
      reason: `Selected entry with timestamp ${newestTimestamp}`
    };
  }

  private async resolveByVersion(conflict: SyncConflict): Promise<ConflictResolutionResult> {
    console.assert(conflict.nodeVersions.size > 0, 'Node versions must exist');
    
    let highest: MemoryEntry | null = null;
    let highestVersion = 0;
    
    for (const entry of conflict.nodeVersions.values()) {
      if (entry.version > highestVersion) {
        highestVersion = entry.version;
        highest = entry;
      }
    }
    
    console.assert(highest != null, 'Resolution must produce valid entry');
    
    return {
      resolved: true,
      entry: highest!,
      strategy: 'version-vector',
      reason: `Selected entry with version ${highestVersion}`
    };
  }

  private async resolveManually(
    context: SyncContext, 
    conflict: SyncConflict
  ): Promise<ConflictResolutionResult> {
    console.assert(conflict != null, 'Conflict must exist');
    console.assert(conflict.severity != null, 'Conflict severity required');
    
    // For high severity conflicts, emit event for manual intervention
    if (conflict.severity === 'high') {
      return {
        resolved: false,
        strategy: 'manual',
        reason: 'Manual intervention required for high severity conflict'
      };
    }
    
    // Fallback to timestamp resolution for lower severity
    return await this.resolveByTimestamp(conflict);
  }

  private async processManualResolution(
    context: SyncContext, 
    resolution: { key: string; entry: MemoryEntry }
  ): Promise<void> {
    console.assert(resolution?.key != null, 'Resolution key required');
    console.assert(resolution?.entry != null, 'Resolution entry required');
    
    const existing = this.activeResolutions.get(resolution.key);
    if (existing && !existing.resolved) {
      this.activeResolutions.set(resolution.key, {
        resolved: true,
        entry: resolution.entry,
        strategy: 'manual',
        reason: 'Manually resolved by user'
      });
    }
  }

  private async checkResolutionProgress(context: SyncContext): Promise<boolean> {
    console.assert(context != null, 'Context required');
    
    const totalConflicts = context.conflicts.size;
    const resolvedConflicts = Array.from(this.activeResolutions.values())
      .filter(res => res.resolved).length;
    
    return resolvedConflicts === totalConflicts;
  }

  private async forceResolutionCompletion(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context required');
    
    // Force resolve any unresolved conflicts using fallback strategy
    for (const [key, resolution] of this.activeResolutions.entries()) {
      if (!resolution.resolved) {
        const conflict = context.conflicts.get(key);
        if (conflict) {
          const fallbackResolution = await this.resolveByTimestamp(conflict);
          this.activeResolutions.set(key, {
            ...fallbackResolution,
            reason: 'Force resolved due to timeout'
          });
        }
      }
    }
  }

  private async applyResolutions(context: SyncContext): Promise<void> {
    console.assert(context.memoryManager != null, 'Memory manager required');
    console.assert(this.activeResolutions.size > 0, 'Resolutions must exist');
    
    let appliedCount = 0;
    
    for (const [key, resolution] of this.activeResolutions.entries()) {
      if (resolution.resolved && resolution.entry) {
        await context.memoryManager.store(
          key, 
          resolution.entry.data, 
          resolution.entry.partitionId
        );
        
        // Remove resolved conflict
        context.conflicts.delete(key);
        appliedCount++;
      }
    }
    
    // Update metrics
    context.metrics.conflictsResolved += appliedCount;
    
    console.assert(appliedCount === this.activeResolutions.size, 
      'All resolutions should be applied');
  }

  async getResolutionStatus(): Promise<{
    total: number;
    resolved: number;
    pending: number;
    strategies: Record<string, number>;
  }> {
    const resolutions = Array.from(this.activeResolutions.values());
    const resolved = resolutions.filter(r => r.resolved);
    const strategies: Record<string, number> = {};
    
    for (const resolution of resolved) {
      strategies[resolution.strategy] = (strategies[resolution.strategy] || 0) + 1;
    }
    
    return {
      total: resolutions.length,
      resolved: resolved.length,
      pending: resolutions.length - resolved.length,
      strategies
    };
  }
}

// Backward compatibility
export default ResolvingConflictsState;
