/**
 * Drone System Types - FSM-Based Drone Components
 * NASA Rule 10 Compliant: Enum-based events, bounded loops, assertions
 */

export enum DroneState {
  IDLE = 'IDLE',
  ASSIGNED = 'ASSIGNED',
  EXECUTING = 'EXECUTING',
  REPORTING = 'REPORTING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export enum DroneEvent {
  ASSIGN_TASK = 'ASSIGN_TASK',
  START_EXECUTION = 'START_EXECUTION',
  COMPLETE_TASK = 'COMPLETE_TASK',
  GENERATE_REPORT = 'GENERATE_REPORT',
  FINISH = 'FINISH',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

export interface DroneTask {
  id: string;
  type: string;
  priority: 1 | 2 | 3 | 4 | 5;
  data: any;
  timeoutMs: number;
  maxRetries: number;
}

export interface DroneMetrics {
  tasksCompleted: number;
  averageExecutionTime: number;
  errorRate: number;
  lastActivityTime: Date;
}

export interface DroneCapability {
  name: string;
  type: 'security' | 'syntax' | 'runtime' | 'integration' | 'performance' | 'type';
  level: 1 | 2 | 3 | 4 | 5;
}

export interface DroneWorker {
  id: string;
  specialty: string;
  status: DroneState;
  capabilities: DroneCapability[];
  currentTask?: DroneTask;
  metrics: DroneMetrics;
  princess?: string;
}

export interface DroneTransition {
  from: DroneState;
  event: DroneEvent;
  to: DroneState;
  guard?: (context: any) => boolean;
  action?: (context: any) => Promise<void>;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T21:45:12-04:00 | agent@claude-sonnet-4 | Create shared drone FSM types | DroneTypes.ts | OK | NASA Rule 10 compliant drone type definitions | 0.00 | a1b2c3d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: mega-agent-096-drone-elimination
- inputs: ["Drone system requirements"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->