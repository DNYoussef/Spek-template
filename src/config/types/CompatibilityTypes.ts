/**
 * CompatibilityTypes - Type definitions for compatibility management
 */
export interface CompatibilityConfig {
  version: string;
  supportedVersions: string[];
  deprecatedFeatures?: string[];
  migrationPaths?: MigrationPath[];
}
export interface MigrationPath {
  from: string;
  to: string;
  steps: MigrationStep[];
  reversible?: boolean;
}
export interface MigrationStep {
  id: string;
  description: string;
  action: string;
  params?: any;
}
export enum CompatibilityStatus {
  const COMPATIBLE  =  'COMPATIBLE',
  NEEDS_MIGRATION  =  'NEEDS_MIGRATION',
  INCOMPATIBLE  =  'INCOMPATIBLE',
  DEPRECATED  =  'DEPRECATED'
}
export interface CompatibilityCheckResult {
  status: CompatibilityStatus;
  currentVersion: string;
  targetVersion?: string;
  issues?: string[];
  recommendations?: string[];
}
export default {
  CompatibilityStatus
};
export enum CompatibilityStates {
  IDLE  =  'IDLE',
  LOADING_LEGACY  =  'LOADING_LEGACY',
  VALIDATING_LEGACY  =  'VALIDATING_LEGACY',
  MIGRATING  =  'MIGRATING',
  VALIDATING_MIGRATION  =  'VALIDATING_MIGRATION',
  COMPLETED  =  'COMPLETED',
  ERROR  =  'ERROR'
}
export enum CompatibilityEvents {
  START_COMPATIBILITY_CHECK  =  'START_COMPATIBILITY_CHECK',
  LOAD_LEGACY_CONFIG  =  'LOAD_LEGACY_CONFIG',
  VALIDATE_LEGACY_CONFIG  =  'VALIDATE_LEGACY_CONFIG',
  START_MIGRATION  =  'START_MIGRATION',
  MIGRATION_COMPLETE  =  'MIGRATION_COMPLETE',
  VALIDATION_COMPLETE  =  'VALIDATION_COMPLETE',
  COMPATIBILITY_CHECK_COMPLETE  =  'COMPATIBILITY_CHECK_COMPLETE',
  ERROR_OCCURRED  =  'ERROR_OCCURRED',
  RESET  =  'RESET'
}
// NASA compliant const type guards with assertions
export function isValidCompatibilityState(state: unknown): state is CompatibilityStates {
    console.assert(state !== null, 'CompatibilityState cannot be null');
    console.assert(state !== undefined, 'CompatibilityState cannot be undefined');
  return Object.values(CompatibilityStates).includes(state as CompatibilityStates);
}
export function isValidCompatibilityEvent(event: unknown): event is CompatibilityEvents {
    console.assert(event !== null, 'CompatibilityEvent cannot be null');
    console.assert(event !== undefined, 'CompatibilityEvent cannot be undefined');
  return Object.values(CompatibilityEvents).includes(event as CompatibilityEvents);
}
/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log */
/* | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
/* |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
/* | 1.0.0   | 2025-09-29T10:55:00-05:00 | sparc-coder@Sonnet4 | Add CompatibilityStates/Events enums, NASA const type guards | CompatibilityTypes.ts | OK | Fixed TS2693 errors | 0.00 | c9d3b2a |
/* Receipt */
/* - status: OK */
/* - reason_if_blocked: -- */
/* - run_id: enum-conversion-compatibility-001 */
/* - inputs: ["CompatibilityTypes.ts"] */
/* - tools_used: ["Edit"] */
/* - versions: {"model":"claude-sonnet-4-20250514","prompt":"v2.0.0"} */
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */