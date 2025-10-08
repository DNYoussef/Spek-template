/**
 * Cache FSM Types and Enums - No String Literals for States/Events
 * TypeScript enums for all cache FSM states and events
 */

// Cache FSM States
export enum CacheState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  CACHING = 'CACHING',
  RETRIEVING = 'RETRIEVING',
  INVALIDATING = 'INVALIDATING',
  OPTIMIZING = 'OPTIMIZING',
  EVICTING = 'EVICTING',
  COMPACTING = 'COMPACTING',
  ERROR_HANDLING = 'ERROR_HANDLING',
  WARMING_UP = 'WARMING_UP',
  PRELOADING = 'PRELOADING',
  ANALYZING = 'ANALYZING'
}

// Cache FSM Events
export enum CacheEvent {
  INITIALIZE = 'INITIALIZE',
  STORE_REQUEST = 'STORE_REQUEST',
  RETRIEVE_REQUEST = 'RETRIEVE_REQUEST',
  REMOVE_REQUEST = 'REMOVE_REQUEST',
  CLEAR_REQUEST = 'CLEAR_REQUEST',
  OPTIMIZE_REQUEST = 'OPTIMIZE_REQUEST',
  EVICT_REQUEST = 'EVICT_REQUEST',
  COMPACT_REQUEST = 'COMPACT_REQUEST',
  WARMUP_REQUEST = 'WARMUP_REQUEST',
  PRELOAD_REQUEST = 'PRELOAD_REQUEST',
  ANALYZE_REQUEST = 'ANALYZE_REQUEST',
  OPERATION_SUCCESS = 'OPERATION_SUCCESS',
  OPERATION_FAILED = 'OPERATION_FAILED',
  SPACE_SHORTAGE = 'SPACE_SHORTAGE',
  TTL_EXPIRED = 'TTL_EXPIRED',
  STRATEGY_CHANGE = 'STRATEGY_CHANGE',
  PERFORMANCE_DEGRADED = 'PERFORMANCE_DEGRADED',
  RESET = 'RESET',
  SHUTDOWN = 'SHUTDOWN'
}

// Strategy Types
export enum CacheStrategyType {
  LRU = 'LRU',
  LFU = 'LFU',
  ADAPTIVE_LRU = 'ADAPTIVE_LRU',
  TTL = 'TTL',
  LARGEST_FIRST = 'LARGEST_FIRST'
}

// Operation Types
export enum CacheOperation {
  STORE = 'STORE',
  RETRIEVE = 'RETRIEVE',
  REMOVE = 'REMOVE',
  EVICT = 'EVICT',
  CLEAR = 'CLEAR',
  COMPACT = 'COMPACT',
  OPTIMIZE = 'OPTIMIZE',
  WARMUP = 'WARMUP',
  PRELOAD = 'PRELOAD',
  ANALYZE = 'ANALYZE'
}

// Cache FSM Context
export interface CacheFSMContext {
  currentState: CacheState;
  previousState?: CacheState;
  operation?: CacheOperation;
  strategyType: CacheStrategyType;
  cache: Map<string, any>;
  config: any;
  metrics: any;
  currentSize: number;
  maxSize: number;
  lastError?: Error;
  transitionHistory: any[];
  metadata: Record<string, any>;
  timestamp: number;
}

// Operation Result
export interface CacheOperationResult {
  success: boolean;
  data?: any;
  error?: Error;
  metadata?: Record<string, any>;
  nextState?: CacheState;
  nextEvent?: CacheEvent;
}

// Strategy Definition
export interface CacheStrategyDefinition {
  type: CacheStrategyType;
  name: string;
  description: string;
  evictEntries: (entries: any[], requiredSpace: number) => any[];
  updateOnAccess: (entry: any) => void;
  updateOnStore: (entry: any) => void;
  calculatePriority: (entry: any) => number;
}