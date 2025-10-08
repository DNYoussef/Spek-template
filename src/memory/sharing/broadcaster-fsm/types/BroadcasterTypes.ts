import { EventEmitter } from 'events';
import { MemoryEvent } from '../SharedMemoryBus';

// Re-export original interfaces for compatibility
export interface BroadcastChannel {
  id: string;
  name: string;
  partitionIds: string[];
  priority: number;
  rateLimit?: number;
  queueSize?: number;
  enabled: boolean;
}

export interface BroadcastMessage {
  id: string;
  channelId: string;
  type: 'memory_update' | 'memory_sync' | 'memory_cleanup' | 'system_event';
  payload: any;
  priority: number;
  timestamp: number;
  expiresAt?: number;
  retryCount?: number;
  sourceNode: string;
}

export interface BroadcasterConfig {
  maxChannels: number;
  defaultQueueSize: number;
  defaultRateLimit: number;
  retryAttempts: number;
  retryDelay: number;
  enablePersistence: boolean;
  compressionEnabled: boolean;
}

export interface BroadcasterMetrics {
  totalChannels: number;
  activeChannels: number;
  totalMessages: number;
  messagesPerSecond: number;
  queuedMessages: number;
  failedDeliveries: number;
  averageLatency: number;
}

// FSM-specific types
export enum BroadcasterState {
  INITIALIZING = 'INITIALIZING',
  IDLE = 'IDLE',
  PREPARING_BROADCAST = 'PREPARING_BROADCAST',
  BROADCASTING = 'BROADCASTING',
  CONFIRMING_DELIVERY = 'CONFIRMING_DELIVERY',
  HANDLING_FAILURES = 'HANDLING_FAILURES',
  SHUTTING_DOWN = 'SHUTTING_DOWN',
  ERROR = 'ERROR'
}

export enum BroadcasterEvent {
  INITIALIZE = 'INITIALIZE',
  CREATE_CHANNEL = 'CREATE_CHANNEL',
  REMOVE_CHANNEL = 'REMOVE_CHANNEL',
  BROADCAST_REQUEST = 'BROADCAST_REQUEST',
  MESSAGE_READY = 'MESSAGE_READY',
  DELIVERY_SUCCESS = 'DELIVERY_SUCCESS',
  DELIVERY_FAILURE = 'DELIVERY_FAILURE',
  RETRY_REQUIRED = 'RETRY_REQUIRED',
  SHUTDOWN_REQUEST = 'SHUTDOWN_REQUEST',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE'
}

export interface StateContext {
  channels: Map<string, BroadcastChannel>;
  messageQueues: Map<string, BroadcastMessage[]>;
  processingTimers: Map<string, NodeJS.Timeout>;
  metrics: BroadcasterMetrics;
  config: BroadcasterConfig;
  nodeId: string;
  messageCounter: number;
  currentMessage?: BroadcastMessage;
  errorInfo?: any;
}

export interface BroadcasterStateMachine {
  currentState: BroadcasterState;
  context: StateContext;
  transition(event: BroadcasterEvent, payload?: any): Promise<void>;
  getState(): BroadcasterState;
  getContext(): StateContext;
}

export interface StateHandler {
  enter(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<void>;
  exit(context: StateContext, event: BroadcasterEvent): Promise<void>;
  handle(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<BroadcasterState | null>;
}

// Component interfaces
export interface ChannelManager {
  createChannel(context: StateContext, config: Omit<BroadcastChannel, 'id'>): string;
  removeChannel(context: StateContext, channelId: string): boolean;
  getChannel(context: StateContext, channelId: string): BroadcastChannel | null;
  listChannels(context: StateContext): BroadcastChannel[];
  setChannelEnabled(context: StateContext, channelId: string, enabled: boolean): boolean;
  updateChannel(context: StateContext, channelId: string, updates: Partial<BroadcastChannel>): boolean;
}

export interface MessageProcessor {
  queueMessage(context: StateContext, message: BroadcastMessage): void;
  processMessage(context: StateContext, message: BroadcastMessage): Promise<void>;
  retryMessage(context: StateContext, message: BroadcastMessage): void;
  deliverMessage(context: StateContext, message: BroadcastMessage): Promise<void>;
}

export interface MetricsCollector {
  updateChannelMetrics(context: StateContext): void;
  updateQueuedMessagesCount(context: StateContext): void;
  updateLatencyMetrics(context: StateContext, latency: number): void;
  getMetrics(context: StateContext): BroadcasterMetrics;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: broadcaster-fsm-decomp-001
// inputs: ["MemoryBroadcaster.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"v1"}
// === END FOOTER ===
