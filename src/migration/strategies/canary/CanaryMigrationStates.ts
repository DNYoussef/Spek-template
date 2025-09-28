/**
 * FSM States and Events for Canary Protocol Migration
 * Implements strict state machine patterns for migration management
 */

export enum CanaryMigrationStates {
  IDLE = 'idle',
  PREPARING = 'preparing',
  DEPLOYING_CANARY = 'deploying_canary',
  INITIALIZING_TRAFFIC = 'initializing_traffic',
  PROGRESSIVE_ROLLOUT = 'progressive_rollout',
  STAGE_MONITORING = 'stage_monitoring',
  STAGE_VALIDATION = 'stage_validation',
  FINAL_ROLLOUT = 'final_rollout',
  PROMOTION = 'promotion',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ROLLING_BACK = 'rolling_back',
  ROLLED_BACK = 'rolled_back',
  ROLLBACK_FAILED = 'rollback_failed',
  FAILED = 'failed',
  CLEANUP = 'cleanup'
}

export enum CanaryMigrationEvents {
  START_MIGRATION = 'start_migration',
  CANARY_DEPLOYED = 'canary_deployed',
  TRAFFIC_INITIALIZED = 'traffic_initialized',
  STAGE_STARTED = 'stage_started',
  STAGE_PASSED = 'stage_passed',
  STAGE_FAILED = 'stage_failed',
  VALIDATION_PASSED = 'validation_passed',
  VALIDATION_FAILED = 'validation_failed',
  FINAL_ROLLOUT_READY = 'final_rollout_ready',
  PROMOTION_COMPLETED = 'promotion_completed',
  MIGRATION_COMPLETED = 'migration_completed',
  PAUSE_REQUESTED = 'pause_requested',
  RESUME_REQUESTED = 'resume_requested',
  ROLLBACK_TRIGGERED = 'rollback_triggered',
  ROLLBACK_COMPLETED = 'rollback_completed',
  ROLLBACK_FAILED = 'rollback_failed',
  CLEANUP_COMPLETED = 'cleanup_completed',
  ERROR_OCCURRED = 'error_occurred'
}

export interface CanaryMigrationContext {
  deploymentId: string;
  sourceVersion: string;
  targetVersion: string;
  currentStage: number;
  totalStages: number;
  trafficPercentage: number;
  config: any;
  stageResults: any[];
  metrics: any;
  error?: Error;
  rollbackReason?: string;
}

export interface StateTransition {
  from: CanaryMigrationStates;
  event: CanaryMigrationEvents;
  to: CanaryMigrationStates;
  guard?: (context: CanaryMigrationContext) => boolean;
  action?: (context: CanaryMigrationContext) => Promise<void>;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:12:03-04:00 | agent048@claude-sonnet-4 | Created CanaryMigrationStates with FSM enums and interfaces | CanaryMigrationStates.ts | OK | FSM foundation for canary migration | 0.00 | a1b2c3d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-agent-048-fsm-states
- inputs: ["none"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"codex-048-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->