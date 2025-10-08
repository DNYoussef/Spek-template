/**
 * Config Types Index
 * Centralized export for all configuration types
 * Provides both modular and backward compatible access
 */

// Module exports for organized access
export * from './modules/analysis/AnalysisTypes';
export * from './modules/timeline/TimelineTypes';

// Namespaced exports
export * as Analysis from './modules/analysis/AnalysisTypes';
export * as Timeline from './modules/timeline/TimelineTypes';

// Common type utilities
export type ConfigurationLevel = 'basic' | 'standard' | 'advanced' | 'enterprise';
export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'requires_review';
export type ConfigurationScope = 'global' | 'project' | 'phase' | 'component';

// Type guards
export const isValidConfigurationLevel = (level: string): level is ConfigurationLevel => {
  return ['basic', 'standard', 'advanced', 'enterprise'].includes(level);
};

export const isValidValidationStatus = (status: string): status is ValidationStatus => {
  return ['pending', 'valid', 'invalid', 'requires_review'].includes(status);
};

// Generic configuration interface
export interface BaseConfiguration<T = any> {
  id: string;
  name: string;
  version: string;
  scope: ConfigurationScope;
  level: ConfigurationLevel;
  created: Date;
  updated: Date;
  author: string;
  description?: string;
  metadata?: T;
}

// Configuration management types
export interface ConfigurationTemplate<T = any> extends BaseConfiguration<T> {
  template_type: string;
  variables: ConfigurationVariable[];
  defaults: Record<string, any>;
  validation_rules: ValidationRule[];
}

export interface ConfigurationVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default_value?: any;
  description?: string;
  constraints?: VariableConstraint[];
}

export interface VariableConstraint {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value: any;
  message: string;
}

export interface ValidationRule {
  rule_id: string;
  expression: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Configuration inheritance and composition
export interface ConfigurationHierarchy {
  parent?: string;
  children: string[];
  inheritance_rules: InheritanceRule[];
  override_policies: OverridePolicy[];
}

export interface InheritanceRule {
  property_path: string;
  inheritance_type: 'override' | 'merge' | 'append' | 'inherit_only';
  conditions?: string[];
}

export interface OverridePolicy {
  level: ConfigurationScope;
  allowed_overrides: string[];
  restricted_overrides: string[];
  approval_required: boolean;
}