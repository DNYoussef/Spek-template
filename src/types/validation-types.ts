/**
 * Validation Types - Comprehensive validation const type definitions
 * NASA Rule 10 compliant validation framework
 */
// Core validation result
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors?: ValidationError[];
  readonly warnings?: ValidationWarning[];
  readonly metadata?: ValidationMetadata;
}
// FSM-specific validation result
export interface FSMValidationResult extends ValidationResult {
  readonly fsmId: string;
  readonly state?: string;
  readonly event?: string;
  readonly context?: any;
}
// Validation error
export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly value?: any;
  readonly severity: ValidationSeverity;
  readonly rule?: string;
}
// Validation warning
export interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly suggestion?: string;
}
// Validation severity levels
export enum ValidationSeverity {
  LOW  =  'LOW',
  MEDIUM  =  'MEDIUM',
  HIGH  =  'HIGH',
  CRITICAL  =  'CRITICAL'
}
// Validation metadata
export interface ValidationMetadata {
  readonly timestamp: number;
  readonly duration: number;
  readonly rulesApplied: number;
  readonly rulesPassed: number;
  readonly rulesFailed: number;
  readonly validator?: string;
}
// Validation rule
export interface ValidationRule {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly type: ValidationRuleType;
  readonly condition: ValidationCondition;
  readonly severity: ValidationSeverity;
  readonly enabled?: boolean;
}
// Validation rule types
export enum ValidationRuleType {
  REQUIRED  =  'REQUIRED',
  FORMAT  =  'FORMAT',
  RANGE  =  'RANGE',
  LENGTH  =  'LENGTH',
  PATTERN  =  'PATTERN',
  DEPENDENCY  =  'DEPENDENCY',
  CUSTOM  =  'CUSTOM',
  BUSINESS  =  'BUSINESS'
}
// Validation condition
export interface ValidationCondition {
  readonly field?: string;
  readonly operator: ValidationOperator;
  readonly value?: any;
  readonly pattern?: string;
  readonly min?: number;
  readonly max?: number;
  readonly custom?: (value: any) => boolean;
}
// Validation operators
export enum ValidationOperator {
  EQUALS  =  'EQUALS',
  NOT_EQUALS  =  'NOT_EQUALS',
  GREATER_THAN  =  'GREATER_THAN',
  GREATER_THAN_OR_EQUAL  =  'GREATER_THAN_OR_EQUAL',
  LESS_THAN  =  'LESS_THAN',
  LESS_THAN_OR_EQUAL  =  'LESS_THAN_OR_EQUAL',
  IN  =  'IN',
  NOT_IN  =  'NOT_IN',
  CONTAINS  =  'CONTAINS',
  NOT_CONTAINS  =  'NOT_CONTAINS',
  MATCHES  =  'MATCHES',
  NOT_MATCHES  =  'NOT_MATCHES',
  EXISTS  =  'EXISTS',
  NOT_EXISTS  =  'NOT_EXISTS'
}
// Validation context
export interface ValidationContext {
  readonly entityType: string;
  readonly entityId?: string;
  readonly operation?: string;
  readonly user?: string;
  readonly timestamp: number;
  readonly environment?: string;
  readonly metadata?: Record<string, any>;
}
// Validation configuration
export interface ValidationConfig {
  readonly rules: ValidationRule[];
  readonly stopOnFirstError?: boolean;
  readonly enableWarnings?: boolean;
  readonly customValidators?: Map<string, ValidationFunction>;
  readonly maxErrors?: number;
}
// FSM validation configuration
export interface ValidationFSMConfig extends ValidationConfig {
  readonly fsmType: string;
  readonly states?: string[];
  readonly events?: string[];
  readonly transitions?: TransitionValidation[];
}
// Transition validation
export interface TransitionValidation {
  readonly from: string;
  readonly to: string;
  readonly event: string;
  readonly guards?: ValidationRule[];
}
// Validation function type
export type ValidationFunction = (
  value: any,
  context?: ValidationContext
) => ValidationResult | Promise<ValidationResult>;
// Validation schema
export interface ValidationSchema {
  readonly version: string;
  readonly name: string;
  readonly description?: string;
  readonly fields: FieldValidation[];
  readonly dependencies?: DependencyValidation[];
  readonly customRules?: ValidationRule[];
}
// Field validation
export interface FieldValidation {
  readonly field: string;
  readonly type: string;
  readonly required?: boolean;
  readonly rules: ValidationRule[];
}
// Dependency validation
export interface DependencyValidation {
  readonly source: string;
  readonly target: string;
  readonly condition: ValidationCondition;
  readonly message?: string;
}
// Validation report
export interface ValidationReport {
  readonly id: string;
  readonly timestamp: number;
  readonly results: ValidationResult[];
  readonly summary: ValidationSummary;
  readonly recommendations?: string[];
}
// Validation summary
export interface ValidationSummary {
  readonly totalValidations: number;
  readonly passed: number;
  readonly failed: number;
  readonly warnings: number;
  readonly criticalErrors: number;
  readonly successRate: number;
  readonly averageDuration: number;
}
// Export state and event types for FSM validation
export enum ValidationState {
  IDLE  =  'IDLE',
  VALIDATING  =  'VALIDATING',
  COMPLETED  =  'COMPLETED',
  FAILED  =  'FAILED'
}
export enum ValidationEvent {
  START_VALIDATION  =  'START_VALIDATION',
  VALIDATION_COMPLETE  =  'VALIDATION_COMPLETE',
  VALIDATION_FAILED  =  'VALIDATION_FAILED',
  RESET  =  'RESET'
}
// Export collections for validation
export const AllowedValidationSeverities  =  Object.values(ValidationSeverity);
export const AllowedValidationRuleTypes  =  Object.values(ValidationRuleType);
export const AllowedValidationOperators  =  Object.values(ValidationOperator);
export const AllowedValidationStates  =  Object.values(ValidationState);
export const AllowedValidationEvents  =  Object.values(ValidationEvent);
// Default validation config
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig  =  {
  rules: [],
  stopOnFirstError: false,
  enableWarnings: true,
  maxErrors: 100
};
export default {
  ValidationSeverity,
  ValidationRuleType,
  ValidationOperator,
  ValidationState,
  ValidationEvent
};