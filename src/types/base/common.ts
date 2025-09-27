/**
 * Common Type Definitions for Configuration and Validation
 * Replaces 'any' types with specific interfaces across the system
 */

import { ConfigPath, ConfigValue, ValidationPath, ValidationError, Timestamp, FilePath, FileHash } from './primitives';

// Generic result types to replace 'any' returns
export interface Result<T = unknown, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
  metadata?: ResultMetadata;
}

export interface ResultMetadata {
  timestamp: Timestamp;
  operation: string;
  duration?: number;
  source?: string;
}

// Configuration object types
export interface ConfigurationObject {
  readonly [key: string]: ConfigValue | ConfigurationObject | ConfigurationArray;
}

export interface ConfigurationArray extends ReadonlyArray<ConfigValue | ConfigurationObject | ConfigurationArray> {}

export type ConfigurationValue = ConfigValue | ConfigurationObject | ConfigurationArray;

// Environment override types
export interface EnvironmentOverride {
  readonly path: ConfigPath;
  readonly value: ConfigurationValue;
  readonly condition?: OverrideCondition;
}

export interface OverrideCondition {
  readonly environment?: string[];
  readonly feature_flags?: string[];
  readonly version_range?: string;
}

// Validation result types
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly metadata: ValidationMetadata;
}

export interface ValidationWarning {
  readonly path: ValidationPath;
  readonly message: string;
  readonly severity: 'low' | 'medium' | 'high';
}

export interface ValidationMetadata {
  readonly timestamp: Timestamp;
  readonly schema_version: string;
  readonly validation_duration: number;
  readonly rules_applied: string[];
}

// Configuration change types
export interface ConfigChange {
  readonly path: ConfigPath;
  readonly operation: 'added' | 'modified' | 'removed';
  readonly oldValue?: ConfigurationValue;
  readonly newValue?: ConfigurationValue;
  readonly impact: ChangeImpact;
}

export interface ChangeImpact {
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly affected_components: string[];
  readonly requires_restart: boolean;
  readonly rollback_safe: boolean;
}

// File operation types
export interface FileOperation {
  readonly operation: 'read' | 'write' | 'delete' | 'move';
  readonly path: FilePath;
  readonly content?: string;
  readonly checksum?: FileHash;
  readonly timestamp: Timestamp;
}

// Generic loading result for replacing Promise<any>
export interface LoadResult<T = ConfigurationObject> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: LoadError;
  readonly source: FilePath;
  readonly timestamp: Timestamp;
}

export interface LoadError {
  readonly code: string;
  readonly message: string;
  readonly stack?: string;
  readonly cause?: Error;
}

// Nested property access types
export interface PropertyAccess {
  readonly target: ConfigurationObject;
  readonly path: ConfigPath;
  readonly value: ConfigurationValue;
}

// Deep merge operation types
export interface MergeOperation {
  readonly source: ConfigurationObject;
  readonly target: ConfigurationObject;
  readonly result: ConfigurationObject;
  readonly conflicts: MergeConflict[];
}

export interface MergeConflict {
  readonly path: ConfigPath;
  readonly source_value: ConfigurationValue;
  readonly target_value: ConfigurationValue;
  readonly resolution: 'source' | 'target' | 'merge' | 'error';
}

// Type guards for configuration values
export const isConfigurationObject = (value: unknown): value is ConfigurationObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isConfigurationArray = (value: unknown): value is ConfigurationArray =>
  Array.isArray(value);

export const isConfigurationValue = (value: unknown): value is ConfigurationValue =>
  value !== undefined && (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    isConfigurationObject(value) ||
    isConfigurationArray(value)
  );

// Utility functions
export const createValidationResult = (
  valid: boolean,
  errors: ValidationError[] = [],
  warnings: ValidationWarning[] = []
): ValidationResult => ({
  valid,
  errors,
  warnings,
  metadata: {
    timestamp: Date.now() as Timestamp,
    schema_version: '1.0.0',
    validation_duration: 0,
    rules_applied: []
  }
});

export const createLoadResult = <T>(
  success: boolean,
  data?: T,
  error?: LoadError,
  source: FilePath = '' as FilePath
): LoadResult<T> => ({
  success,
  data,
  error,
  source,
  timestamp: Date.now() as Timestamp
});

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-26T23:09:20-04:00 | coder@claude-sonnet-4 | Create common interfaces replacing 'any' types in config/validation | common.ts | OK | -- | 0.00 | 9d8e4f1 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase4-week10-type-elimination-002
 * - inputs: ["primitives.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase4-week10-implementation"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */