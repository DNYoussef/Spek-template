/**
 * Pool State Machine States
 * NASA Rule 10 Compliant - Bounded state definitions
 */

export enum PoolState {
  EMPTY = 'EMPTY',
  INITIALIZING = 'INITIALIZING',
  AVAILABLE = 'AVAILABLE',
  ALLOCATING = 'ALLOCATING',
  BUSY = 'BUSY',
  DEALLOCATING = 'DEALLOCATING',
  DEGRADED = 'DEGRADED',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR'
}

export enum PoolEvent {
  INITIALIZE = 'INITIALIZE',
  ALLOCATION_REQUEST = 'ALLOCATION_REQUEST',
  ALLOCATION_COMPLETE = 'ALLOCATION_COMPLETE',
  DEALLOCATION_REQUEST = 'DEALLOCATION_REQUEST',
  DEALLOCATION_COMPLETE = 'DEALLOCATION_COMPLETE',
  CAPACITY_WARNING = 'CAPACITY_WARNING',
  CAPACITY_CRITICAL = 'CAPACITY_CRITICAL',
  CAPACITY_RESTORED = 'CAPACITY_RESTORED',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
  MAINTENANCE_COMPLETE = 'MAINTENANCE_COMPLETE',
  ERROR_DETECTED = 'ERROR_DETECTED',
  ERROR_RESOLVED = 'ERROR_RESOLVED',
  RESET = 'RESET'
}

export interface PoolContext {
  poolId: string;
  totalCapacity: number;
  availableCapacity: number;
  allocatedResources: Map<string, number>;
  pendingAllocations: Map<string, number>;
  errorCount: number;
  lastMaintenanceTime: number;
  healthScore: number;
}

export interface PoolTransition {
  fromState: PoolState;
  event: PoolEvent;
  toState: PoolState;
  guard?: (context: PoolContext) => boolean;
  action?: (context: PoolContext) => void;
}

/**
 * Pool State Contracts
 * Each state must implement these methods
 */
export interface IPoolStateHandler {
  enter(context: PoolContext): void;
  exit(context: PoolContext): void;
  checkInvariants(context: PoolContext): boolean;
  getValidEvents(): PoolEvent[];
}

// State invariant assertions
export const STATE_INVARIANTS = {
  [PoolState.EMPTY]: (ctx: PoolContext) => {
    console.assert(ctx.availableCapacity === ctx.totalCapacity, 'Empty pool must have all capacity available');
    console.assert(ctx.allocatedResources.size === 0, 'Empty pool cannot have allocations');
    return ctx.availableCapacity === ctx.totalCapacity && ctx.allocatedResources.size === 0;
  },

  [PoolState.AVAILABLE]: (ctx: PoolContext) => {
    console.assert(ctx.availableCapacity > 0, 'Available pool must have capacity');
    console.assert(ctx.availableCapacity <= ctx.totalCapacity, 'Available capacity cannot exceed total');
    return ctx.availableCapacity > 0 && ctx.availableCapacity <= ctx.totalCapacity;
  },

  [PoolState.BUSY]: (ctx: PoolContext) => {
    console.assert(ctx.allocatedResources.size > 0, 'Busy pool must have allocations');
    console.assert(ctx.availableCapacity >= 0, 'Available capacity cannot be negative');
    return ctx.allocatedResources.size > 0 && ctx.availableCapacity >= 0;
  }
};

