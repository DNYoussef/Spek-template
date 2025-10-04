/**
 * Configuration Types for Config Management System
 * Foundation types for configuration loading, merging, validation
 */

import { ConfigPath, ConfigValue, EnvironmentName } from './base/primitives';
import { ValidationResult } from './base/shared';

// Configuration source types
export interface ConfigSource {
  readonly name: string;
  readonly priority: number;
  readonly path: ConfigPath;
  readonly type?: 'file' | 'env' | 'remote' | 'database';
  readonly required?: boolean;
  readonly encoding?: string;
  load(): Promise<Record<string, unknown>>;
}

export interface ConfigData {
  readonly [key: string]: ConfigValue;
}

// Merge strategies
export interface MergeStrategy {
  readonly type: 'deep' | 'shallow' | 'replace' | 'array_concat' | 'custom';
  readonly resolver?: (base: any, override: any, key: string) => any;
}

export interface MergeOptions {
  readonly strategy: MergeStrategy;
  readonly preserveNull: boolean;
  readonly arrayMerge?: 'replace' | 'concat' | 'merge';
}

// Configuration validation
export interface ConfigValidationRule {
  readonly path: ConfigPath;
  readonly required: boolean;
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  readonly message?: string;
  readonly condition?: any;
  readonly validator?: (value: unknown) => ValidationResult;
}

export interface ConfigSchema {
  readonly version: string;
  readonly rules: readonly ConfigValidationRule[];
}

// Configuration watcher
export interface ConfigChangeEvent {
  readonly path: ConfigPath;
  readonly oldValue: ConfigValue;
  readonly newValue: ConfigValue;
  readonly timestamp: number;
}

export interface ConfigWatcherOptions {
  readonly debounceMs: number;
  readonly recursive?: boolean;
  readonly filters?: string[];
  readonly ignorePattern?: RegExp;
}

// Environment-specific configuration
export interface EnvironmentConfig {
  readonly environment: EnvironmentName;
  readonly config: ConfigData;
  readonly overrides: ConfigData;
}

// FSM state management for configuration
export enum ConfigState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  VALIDATING = 'VALIDATING',
  MERGING = 'MERGING',
  READY = 'READY',
  ERROR = 'ERROR',
  WATCHING = 'WATCHING'
}

export enum ConfigEvent {
  LOAD = 'LOAD',
  LOAD_REQUESTED = 'LOAD_REQUESTED',
  LOAD_COMPLETED = 'LOAD_COMPLETED',
  LOAD_FAILED = 'LOAD_FAILED',
  VALIDATE = 'VALIDATE',
  VALIDATE_REQUESTED = 'VALIDATE_REQUESTED',
  VALIDATE_COMPLETED = 'VALIDATE_COMPLETED',
  VALIDATE_FAILED = 'VALIDATE_FAILED',
  MERGE = 'MERGE',
  CHANGE_DETECTED = 'CHANGE_DETECTED',
  RELOAD_REQUESTED = 'RELOAD_REQUESTED',
  WATCH = 'WATCH',
  WATCH_STARTED = 'WATCH_STARTED',
  WATCH_STOPPED = 'WATCH_STOPPED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

export interface ConfigContext {
  readonly configPath?: ConfigPath;
  readonly environment?: EnvironmentName;
  readonly sources?: readonly ConfigSource[];
  readonly mergedConfig?: ConfigData;
  readonly validationErrors?: readonly string[];
  readonly lastLoadTime?: number;
  readonly watcherActive?: boolean;
  readonly errors?: readonly string[];
  readonly currentState?: ConfigState;
  readonly rawConfigs?: readonly ConfigData[];
  readonly config?: ConfigData;
}

export interface StateTransition {
  readonly from: ConfigState;
  readonly fromState?: ConfigState;
  readonly to: ConfigState;
  readonly toState?: ConfigState;
  readonly event: ConfigEvent;
  readonly guard?: TransitionGuard;
  readonly handler?: (context: ConfigContext) => Promise<boolean>;
}

export type TransitionGuard = (context: ConfigContext) => boolean;

// Re-export types that may be used as aliases
export type ValidationRule = ConfigValidationRule;
export type WatchConfig = ConfigWatcherOptions;

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T16:45:00-04:00 | coder@sonnet-4.5 | Create ConfigTypes to resolve ~types/ConfigTypes imports | ConfigTypes.ts | OK | Phase 1 critical blocker fixes - Week 2 | 0.00 | f8a4d2e |
 * | 1.1.0   | 2025-10-04T00:00:00-04:00 | coder@sonnet-4.5 | Add FSM types: ConfigState, ConfigEvent, ConfigContext, StateTransition, TransitionGuard | ConfigTypes.ts | OK | Type Consolidation Phase 2 - TS2305 fixes | 0.00 | b3c9f1a |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: type-consolidation-phase2-config-fsm
 * - inputs: ["primitives.ts", "ConfigTypes.ts"]
 * - tools_used: ["Read", "Edit"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"type-consolidation-ts2305"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
