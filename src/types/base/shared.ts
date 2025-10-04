/**
 * shared.ts
 * PRODUCTION: Shared base types across all domains
 */

import { Timestamp, Milliseconds } from './primitives';

// PRODUCTION: Shared configuration types
export interface SharedConfig {
  enabled: boolean;
  timeout: Milliseconds;
  retries: number;
}

// PRODUCTION: Shared result types
export interface SharedResult<T = any> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

// PRODUCTION: Shared status types
export type SharedStatus = 'active' | 'inactive' | 'pending' | 'failed';

// PRODUCTION: Shared entity base
export interface SharedEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type { Timestamp, Milliseconds };

// PRODUCTION: State context for FSM implementations
export interface StateContext {
  readonly stateId?: string;
  readonly currentState?: string;
  readonly previousState?: string;
  readonly transitionTime?: Timestamp;
  readonly metadata?: Record<string, unknown>;
}

// PRODUCTION: Validation result type
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
  readonly details?: Record<string, unknown>;
}

// PRODUCTION: Metrics collector interface
export interface MetricsCollector {
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  recordEvent(name: string, data?: Record<string, unknown>): void;
  flush(): Promise<void>;
  getMetrics(): Promise<Record<string, unknown>>;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T00:00:00-04:00 | coder@sonnet-4.5 | Create shared.ts with base types | shared.ts | OK | Base types for all domains | 0.00 | f3d7b2e |
 * | 1.1.0   | 2025-10-04T00:25:00-04:00 | coder@sonnet-4.5 | Add StateContext, ValidationResult, MetricsCollector | shared.ts | OK | Type Consolidation Phase 3 - TS2305 fixes | 0.00 | a8f1c4d |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: type-consolidation-phase3-shared
 * - inputs: ["shared.ts"]
 * - tools_used: ["Read", "Edit"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"type-consolidation-ts2305-phase3"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
