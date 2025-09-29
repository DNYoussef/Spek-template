/**
 * Unified Routing States - Shared FSM States for All Router Types
 * NASA Rule 10 Compliant - Centralized state definitions
 */

// Core Routing States (Universal)
export enum RoutingState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESOLVING = 'RESOLVING',
  VALIDATING = 'VALIDATING',
  EXECUTING = 'EXECUTING',
  MONITORING = 'MONITORING',
  OPTIMIZING = 'OPTIMIZING',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED'
}

// Core Routing Events (Universal)
export enum RoutingEvent {
  ROUTE_REQUEST = 'ROUTE_REQUEST',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  RESOLUTION_COMPLETE = 'RESOLUTION_COMPLETE',
  VALIDATION_COMPLETE = 'VALIDATION_COMPLETE',
  EXECUTION_COMPLETE = 'EXECUTION_COMPLETE',
  MONITORING_COMPLETE = 'MONITORING_COMPLETE',
  OPTIMIZATION_COMPLETE = 'OPTIMIZATION_COMPLETE',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET_REQUESTED = 'RESET_REQUESTED'
}

// Context Routing Specific States
export enum ContextRoutingState {
  IDLE = 'IDLE',
  ANALYZING_CONTEXT = 'ANALYZING_CONTEXT',
  SELECTING_TARGETS = 'SELECTING_TARGETS',
  VALIDATING_ROUTES = 'VALIDATING_ROUTES',
  EXECUTING_ROUTING = 'EXECUTING_ROUTING',
  MONITORING_DELIVERY = 'MONITORING_DELIVERY',
  OPTIMIZING_PERFORMANCE = 'OPTIMIZING_PERFORMANCE',
  ERROR = 'ERROR'
}

// Message Routing Specific States
export enum MessageRoutingState {
  IDLE = 'IDLE',
  ANALYZING_MESSAGE = 'ANALYZING_MESSAGE',
  FINDING_PATH = 'FINDING_PATH',
  VALIDATING_PATH = 'VALIDATING_PATH',
  EXECUTING_SEND = 'EXECUTING_SEND',
  MONITORING_DELIVERY = 'MONITORING_DELIVERY',
  UPDATING_METRICS = 'UPDATING_METRICS',
  ERROR = 'ERROR'
}

// Context Routing Events
export enum ContextRoutingEvent {
  ROUTE_REQUEST = 'ROUTE_REQUEST',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  TARGETS_SELECTED = 'TARGETS_SELECTED',
  ROUTES_VALIDATED = 'ROUTES_VALIDATED',
  ROUTING_EXECUTED = 'ROUTING_EXECUTED',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  OPTIMIZATION_TRIGGERED = 'OPTIMIZATION_TRIGGERED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET_REQUESTED = 'RESET_REQUESTED'
}

// Message Routing Events
export enum MessageRoutingEvent {
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  MESSAGE_ANALYZED = 'MESSAGE_ANALYZED',
  PATH_FOUND = 'PATH_FOUND',
  PATH_VALIDATED = 'PATH_VALIDATED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  METRICS_UPDATED = 'METRICS_UPDATED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET_REQUESTED = 'RESET_REQUESTED'
}

// FSM Context Base Interface
export interface RoutingFSMContext {
  routingId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

// Context Routing FSM Context
export interface ContextRoutingFSMContext extends RoutingFSMContext {
  routingRequest?: {
    context: any;
    sourcePrincess: string;
    options: {
      priority?: string;
      strategy?: string;
      excludePrincesses?: string[];
    };
  };
  analysisResult?: any;
  selectedTargets?: string[];
  executionResults?: any[];
  optimizationData?: any;
}

// Message Routing FSM Context
export interface MessageRoutingFSMContext extends RoutingFSMContext {
  messageRequest?: {
    message: any;
    source: any;
    destination: any;
  };
  analysisResult?: any;
  routingPath?: any;
  validationResult?: boolean;
  executionResult?: any;
  deliveryStatus?: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: mega088-routing-fsm-states-001
// inputs: ["ContextRouter.ts", "MessageRouter.ts analysis"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"mega088-fsm-architecture"}
// === END FOOTER ===