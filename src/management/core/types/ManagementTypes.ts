/**
 * Management Types - FSM State Machine Types for Unified Management
 * NASA Rule 10 Compliant: Bounded enums, no recursion
 */

export enum ManagementState {
  INIT = 'INIT',
  PLANNING = 'PLANNING',
  ALLOCATING = 'ALLOCATING',
  COORDINATING = 'COORDINATING',
  MONITORING = 'MONITORING',
  CLEANUP = 'CLEANUP'
}

export enum ManagementEvent {
  START = 'START',
  ALLOCATE = 'ALLOCATE',
  COORDINATE = 'COORDINATE',
  MONITOR = 'MONITOR',
  CLEANUP = 'CLEANUP',
  ERROR = 'ERROR'
}

export interface ManagementContext {
  managerId: string;
  activeTasks: Map<string, any>;
  resourcePool: Map<string, any>;
  coordinationState: Map<string, any>;
  dependencies: Map<string, any>;
  lifecycle: Map<string, any>;
}

export interface TaskInfo {
  id: string;
  type: string;
  priority: number;
  dependencies: string[];
  resources: string[];
  state: string;
  timestamp: number;
}

export interface ResourceInfo {
  id: string;
  type: string;
  capacity: number;
  allocated: number;
  available: number;
  state: string;
}

export interface CoordinationInfo {
  componentId: string;
  currentState: string;
  targetState: string;
  transitionTime: number;
  dependencies: string[];
}

export interface DependencyInfo {
  id: string;
  dependsOn: string[];
  requiredBy: string[];
  resolved: boolean;
  resolution: any;
}

export interface LifecycleInfo {
  componentId: string;
  phase: 'init' | 'start' | 'run' | 'stop' | 'cleanup';
  startTime: number;
  endTime?: number;
  status: 'pending' | 'active' | 'complete' | 'error';
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: mega-agent-094-management-types
// inputs: ["ManagementHub architecture"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1"}
// === END FOOTER ===