/**
 * Branded Primitive Types for Phase 4 Type Safety
 * Foundation types for eliminating 'any' usage across the codebase
 */

// Base branded type utility
type Brand<T, U> = T & { readonly __brand: U };

// Configuration types
export type ConfigPath = Brand<string, 'ConfigPath'>;
export type ConfigValue = Brand<unknown, 'ConfigValue'>;
export type EnvironmentName = Brand<string, 'EnvironmentName'>;
export type ConfigChecksum = Brand<string, 'ConfigChecksum'>;

// Validation types
export type ValidationError = Brand<string, 'ValidationError'>;
export type ValidationPath = Brand<string, 'ValidationPath'>;
export type SchemaVersion = Brand<string, 'SchemaVersion'>;

// Debug types
export type DebugSessionId = Brand<string, 'DebugSessionId'>;
export type StackTrace = Brand<string, 'StackTrace'>;
export type ErrorCode = Brand<string, 'ErrorCode'>;

// Compliance types
export type ComplianceRuleId = Brand<string, 'ComplianceRuleId'>;
export type ComplianceScore = Brand<number, 'ComplianceScore'>;
export type DriftThreshold = Brand<number, 'DriftThreshold'>;

// File system types
export type FilePath = Brand<string, 'FilePath'>;
export type FileContent = Brand<string, 'FileContent'>;
export type FileHash = Brand<string, 'FileHash'>;

// Temporal types
export type Timestamp = Brand<number, 'Timestamp'>;
export type Duration = Brand<number, 'Duration'>;
export type Timeout = Brand<number, 'Timeout'>;

// Utility functions for creating branded types
export const createConfigPath = (path: string): ConfigPath => path as ConfigPath;
export const createValidationPath = (path: string): ValidationPath => path as ValidationPath;
export const createDebugSessionId = (id: string): DebugSessionId => id as DebugSessionId;
export const createComplianceRuleId = (id: string): ComplianceRuleId => id as ComplianceRuleId;
export const createFilePath = (path: string): FilePath => path as FilePath;
export const createTimestamp = (time: number): Timestamp => time as Timestamp;
export const createFileHash = (hash: string): FileHash => hash as FileHash;

// Type guards
export const isConfigPath = (value: unknown): value is ConfigPath =>
  typeof value === 'string' && value.length > 0;

export const isValidationPath = (value: unknown): value is ValidationPath =>
  typeof value === 'string' && value.includes('.');

export const isComplianceScore = (value: unknown): value is ComplianceScore =>
  typeof value === 'number' && value >= 0 && value <= 100;

export const isTimestamp = (value: unknown): value is Timestamp =>
  typeof value === 'number' && value > 0;

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-26T23:09:15-04:00 | coder@claude-sonnet-4 | Create base primitives with branded types for Phase 4 type safety | primitives.ts | OK | -- | 0.00 | a7f3b2c |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase4-week10-type-elimination-001
 * - inputs: ["phase4-implementation-blueprint", "swarm-types.ts", "tsconfig.strict.json"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase4-week10-implementation"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */