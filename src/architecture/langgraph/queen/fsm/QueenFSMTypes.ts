/**
 * Queen FSM Types - Centralized State Management for Queen Hierarchy
 * Implements FSM-First development with explicit state transitions
 * NASA Rule 10 compliant with fixed state bounds
 */

// Queen State Machine States
export enum QueenState {
  INITIALIZING = 'INITIALIZING',
  COMMANDING = 'COMMANDING',
  DELEGATING = 'DELEGATING',
  MONITORING = 'MONITORING',
  DECIDING = 'DECIDING',
  ESCALATING = 'ESCALATING',
  ERROR_RECOVERY = 'ERROR_RECOVERY',
  SHUTDOWN = 'SHUTDOWN'
}

// Queen State Machine Events
export enum QueenEvent {
  INITIALIZE = 'INITIALIZE',
  COMMAND_RECEIVED = 'COMMAND_RECEIVED',
  DELEGATE_TASK = 'DELEGATE_TASK',
  MONITOR_STATUS = 'MONITOR_STATUS',
  MAKE_DECISION = 'MAKE_DECISION',
  ESCALATE_ISSUE = 'ESCALATE_ISSUE',
  RECOVER_ERROR = 'RECOVER_ERROR',
  SHUTDOWN_INITIATED = 'SHUTDOWN_INITIATED',
  TRANSITION_COMPLETE = 'TRANSITION_COMPLETE'
}

// Queen Command Types
export enum QueenCommandType {
  TASK_ASSIGNMENT = 'TASK_ASSIGNMENT',
  RESOURCE_ALLOCATION = 'RESOURCE_ALLOCATION',
  PRIORITY_UPDATE = 'PRIORITY_UPDATE',
  PRINCESS_DIRECTIVE = 'PRINCESS_DIRECTIVE',
  EMERGENCY_RESPONSE = 'EMERGENCY_RESPONSE',
  STATUS_REQUEST = 'STATUS_REQUEST'
}

// Princess Domain Types
export enum PrincessDomain {
  DEVELOPMENT = 'Development',
  ARCHITECTURE = 'Architecture',
  QUALITY = 'Quality',
  PERFORMANCE = 'Performance',
  INFRASTRUCTURE = 'Infrastructure',
  SECURITY = 'Security'
}

// Decision Context Interface
export interface QueenDecisionContext {
  readonly decisionId: string;
  readonly type: QueenCommandType;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly requiresEscalation: boolean;
  readonly affectedDomains: readonly PrincessDomain[];
  readonly timeConstraint?: number;
  readonly data: Record<string, unknown>;
}

// Command Interface
export interface QueenCommand {
  readonly commandId: string;
  readonly type: QueenCommandType;
  readonly sourceId: string;
  readonly targetDomain?: PrincessDomain;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
  readonly priority: number;
}

// Princess Status Interface
export interface PrincessStatus {
  readonly domain: PrincessDomain;
  readonly state: string;
  readonly health: 'healthy' | 'degraded' | 'critical';
  readonly activeTasks: number;
  readonly load: number;
  readonly lastResponse: number;
}

// Queen Metrics Interface
export interface QueenMetrics {
  readonly commandsProcessed: number;
  readonly tasksAssigned: number;
  readonly decisionsExecuted: number;
  readonly escalationsHandled: number;
  readonly averageResponseTime: number;
  readonly successRate: number;
  readonly princessStatuses: Record<PrincessDomain, PrincessStatus>;
}

// Transition Result Interface
export interface TransitionResult {
  readonly success: boolean;
  readonly previousState: QueenState;
  readonly newState: QueenState;
  readonly event: QueenEvent;
  readonly timestamp: number;
  readonly error?: Error;
}

// FSM Configuration
export interface QueenFSMConfig {
  readonly maxConcurrentCommands: number;
  readonly commandTimeout: number;
  readonly decisionTimeout: number;
  readonly escalationThreshold: number;
  readonly monitoringInterval: number;
}

// State Guards Interface
export interface StateGuard {
  readonly name: string;
  readonly condition: (context: any) => boolean;
  readonly errorMessage: string;
}

// NASA Rule 10 Compliance Constants
export const NASA_QUEEN_LIMITS = {
  MAX_PRINCESS_COUNT: 6,
  MAX_CONCURRENT_COMMANDS: 20,
  MAX_DECISION_OPTIONS: 5,
  MAX_ESCALATION_RETRIES: 3,
  MAX_MONITORING_CYCLES: 100,
  COMMAND_TIMEOUT_MS: 30000,
  DECISION_TIMEOUT_MS: 15000
} as const;

export default {
  QueenState,
  QueenEvent,
  QueenCommandType,
  PrincessDomain,
  NASA_QUEEN_LIMITS
};

/*
 * AGENT FOOTER: QueenFSMTypes v1.0.0
 * Status: OK | NASA Rule 10 Compliant | FSM-First architecture foundation
 * Created: 2025-09-28T16:10:15-04:00 | Agent: claude-sonnet-4
 */