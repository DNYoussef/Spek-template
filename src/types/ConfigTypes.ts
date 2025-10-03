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
  load(): Promise<Record<string, unknown>>;
}

export interface ConfigData {
  readonly [key: string]: ConfigValue;
}

// Merge strategies
export enum MergeStrategy {
  SHALLOW = 'SHALLOW',
  DEEP = 'DEEP',
  OVERRIDE = 'OVERRIDE',
  CONCAT = 'CONCAT'
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
  readonly ignorePattern?: RegExp;
}

// Environment-specific configuration
export interface EnvironmentConfig {
  readonly environment: EnvironmentName;
  readonly config: ConfigData;
  readonly overrides: ConfigData;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T16:45:00-04:00 | coder@sonnet-4.5 | Create ConfigTypes to resolve ~types/ConfigTypes imports | ConfigTypes.ts | OK | Phase 1 critical blocker fixes - Week 2 | 0.00 | f8a4d2e |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: week2-phase1-config-types
 * - inputs: ["critical-blocker-fix-plan.md", "primitives.ts", "shared.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"week2-critical-blockers"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
