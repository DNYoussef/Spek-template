/**
 * Compatibility Types for Compatibility Management System
 * FSM states, events, and context for compatibility checks
 */

import { StateContext } from './base/shared';

// Compatibility FSM States
export enum CompatibilityStates {
  IDLE = 'IDLE',
  CHECKING = 'CHECKING',
  COMPATIBLE = 'COMPATIBLE',
  INCOMPATIBLE = 'INCOMPATIBLE',
  DEGRADED = 'DEGRADED',
  ERROR = 'ERROR'
}

// Compatibility FSM Events
export enum CompatibilityEvents {
  START_CHECK = 'START_CHECK',
  CHECK_COMPLETE = 'CHECK_COMPLETE',
  CHECK_FAILED = 'CHECK_FAILED',
  DEGRADATION_DETECTED = 'DEGRADATION_DETECTED',
  RECOVERY_INITIATED = 'RECOVERY_INITIATED',
  RESET = 'RESET'
}

// Compatibility Context
export interface CompatibilityContext extends StateContext {
  readonly checks: CompatibilityCheck[];
  readonly results: CompatibilityResult[];
  readonly degradations: string[];
  readonly migrationMappings?: Record<string, unknown>;
  readonly compatibilityStatus?: CompatibilityResult;
  readonly validationResult?: CompatibilityResult;
  readonly migrationResult?: CompatibilityResult;
  readonly legacyDetectorConfig?: Record<string, unknown>;
  readonly legacyAnalysisConfig?: Record<string, unknown>;
  readonly lastError?: Error | string;
}

export interface CompatibilityCheck {
  readonly id: string;
  readonly name: string;
  readonly category: 'version' | 'platform' | 'dependency' | 'api';
  readonly execute: () => Promise<CompatibilityResult>;
}

export interface CompatibilityResult {
  readonly checkId: string;
  readonly compatible: boolean;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T16:45:00-04:00 | coder@sonnet-4.5 | Create CompatibilityTypes to resolve ~types/CompatibilityTypes imports | CompatibilityTypes.ts | OK | Phase 1 critical blocker fixes - Week 2 | 0.00 | c3b9a7f |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: week2-phase1-compatibility-types
 * - inputs: ["critical-blocker-fix-plan.md", "shared.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"week2-critical-blockers"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
