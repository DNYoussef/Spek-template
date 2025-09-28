/**
 * MessageRouter Types and State Definitions
 * FSM-based message routing with explicit states and transitions
 */

export enum MessageRouterState {
  IDLE = 'idle',
  EVALUATING = 'evaluating',
  ROUTING = 'routing',
  QUEUING = 'queuing',
  PROCESSING = 'processing',
  WAITING_ACK = 'waiting_ack',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export enum MessageRouterEvent {
  MESSAGE_RECEIVED = 'message_received',
  EVALUATION_COMPLETE = 'evaluation_complete',
  ROUTING_COMPLETE = 'routing_complete',
  QUEUING_COMPLETE = 'queuing_complete',
  PROCESSING_COMPLETE = 'processing_complete',
  ACK_RECEIVED = 'ack_received',
  ERROR_OCCURRED = 'error_occurred',
  RETRY_REQUESTED = 'retry_requested',
  RESET_REQUESTED = 'reset_requested',
  MAINTENANCE_REQUESTED = 'maintenance_requested'
}

export interface Message {
  id: string;
  from: string;
  to: string;
  type: 'command' | 'query' | 'response' | 'notification' | 'broadcast';
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  metadata: MessageMetadata;
  routing: RoutingConfig;
}

export interface MessageMetadata {
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  correlationId?: string;
  parentMessageId?: string;
  requiresAck: boolean;
  stateSnapshot?: string;
}

export interface RoutingConfig {
  strategy: 'direct' | 'broadcast' | 'conditional' | 'round_robin' | 'load_balanced';
  conditions?: RouteCondition[];
  fallbackTargets?: string[];
  maxHops: number;
  currentHop: number;
  path: string[];
}

export interface RouteCondition {
  type: 'state_equals' | 'state_not_equals' | 'state_in' | 'capability_available' | 'load_below' | 'custom';
  target: string;
  value: any;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface MessageResponse {
  messageId: string;
  status: 'delivered' | 'failed' | 'timeout' | 'rejected' | 'queued';
  response?: any;
  error?: string;
  deliveryTime: number;
  processingTime?: number;
}

export interface RoutingDecision {
  allowed: boolean;
  targetPrincess: string;
  reason?: string;
  fallbackTargets?: string[];
}

export interface StateCompatibility {
  compatible: boolean;
  reason?: string;
}

export interface MessageRouterContext {
  message: Message;
  startTime: number;
  routingDecision?: RoutingDecision;
  stateCompatibility?: StateCompatibility;
  response?: MessageResponse;
  error?: Error;
}

export interface RouteEntry {
  target: string;
  conditions: RouteCondition[];
  priority: number;
  enabled: boolean;
  metrics: RouteMetrics;
}

export interface RouteMetrics {
  messagesRouted: number;
  averageLatency: number;
  errorRate: number;
  lastUsed: Date;
}

export interface CommunicationMetrics {
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesByPriority: Record<string, number>;
  averageLatency: number;
  errorRate: number;
  throughput: number;
  queueUtilization: Record<string, number>;
  networkTopology: NetworkTopology;
}

export interface NetworkTopology {
  nodes: string[];
  connections: Array<{ from: string; to: string; weight: number }>;
}

export interface RoutingTable {
  routes: Map<string, RouteEntry>;
  defaultRoute?: RouteEntry;
  lastUpdated: Date;
}

export interface QueueStatus {
  queueSize: number;
  maxSize: number;
  utilization: number;
  processedCount: number;
  droppedCount: number;
  lastProcessed: Date;
}

