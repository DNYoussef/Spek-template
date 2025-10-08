/**
 * Types and Enums for Distributed Memory Sync FSM
 * NASA Rule 10 Compliant: Clear type definitions, no complex logic
 */

import { SyncNode, SyncMessage, SyncConflict, SyncConfig, SyncMetrics } from '../DistributedMemorySync';
import { LangroidMemoryManager, MemoryEntry } from '../../langroid/LangroidMemoryManager';

export enum SyncState {
  INIT = 'INIT',
  CONNECTING = 'CONNECTING', 
  SYNCING = 'SYNCING',
  RESOLVING_CONFLICTS = 'RESOLVING_CONFLICTS',
  BROADCASTING = 'BROADCASTING',
  ERROR_RECOVERY = 'ERROR_RECOVERY',
  SYNCHRONIZED = 'SYNCHRONIZED'
}

export enum SyncEvent {
  START = 'START',
  NODES_DISCOVERED = 'NODES_DISCOVERED',
  SYNC_REQUESTED = 'SYNC_REQUESTED',
  CONFLICTS_DETECTED = 'CONFLICTS_DETECTED',
  CONFLICTS_RESOLVED = 'CONFLICTS_RESOLVED',
  BROADCAST_COMPLETE = 'BROADCAST_COMPLETE',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  SYNC_COMPLETE = 'SYNC_COMPLETE',
  RESET = 'RESET'
}

export interface SyncContext {
  memoryManager: LangroidMemoryManager;
  config: SyncConfig;
  nodes: Map<string, SyncNode>;
  pendingSyncs: Map<string, SyncMessage>;
  conflicts: Map<string, SyncConflict>;
  metrics: SyncMetrics;
  vectorClock: Map<string, number>;
  messageQueue: SyncMessage[];
  error?: Error;
  lastSyncTime?: number;
}

export interface SyncTransition {
  fromState: SyncState;
  event: SyncEvent;
  toState: SyncState;
  guard?: (context: SyncContext, data?: any) => Promise<boolean>;
  action?: (context: SyncContext, data?: any) => Promise<void>;
}

export interface StateHandler {
  enter?(context: SyncContext, data?: any): Promise<void>;
  update?(context: SyncContext, data?: any): Promise<void>;
  exit?(context: SyncContext): Promise<void>;
  checkInvariants?(context: SyncContext): boolean;
}

export interface SyncOperation {
  id: string;
  type: 'heartbeat' | 'sync' | 'resolve' | 'broadcast';
  nodeId: string;
  startTime: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retryCount: number;
}

export interface ConflictResolutionResult {
  resolved: boolean;
  entry?: MemoryEntry;
  strategy: string;
  reason?: string;
}

export interface BroadcastResult {
  success: boolean;
  nodeResults: Map<string, boolean>;
  failedNodes: string[];
  totalTime: number;
}

export interface SyncResult {
  success: boolean;
  entriesSynced: number;
  conflictsResolved: number;
  nodesParticipated: number;
  duration: number;
  errors: Error[];
}