/**
 * Risk Assessment Types Index
 * Centralized export for all risk assessment types
 * Maintains backward compatibility while enabling modular access
 */

// Core Types
export * from './core/BaseRiskTypes';

// API Types
export * from './api/RequestResponseTypes';

// Domain Types
export * from './domain/MigrationTypes';
export * from './domain/SystemTypes';
export * from './domain/ComplianceTypes';
export * from './domain/RiskDomainTypes';

// Namespaced exports for organized access
export * as Core from './core/BaseRiskTypes';
export * as API from './api/RequestResponseTypes';
export * as Migration from './domain/MigrationTypes';
export * as System from './domain/SystemTypes';
export * as Compliance from './domain/ComplianceTypes';
export * as RiskDomain from './domain/RiskDomainTypes';

// Type utilities and helpers
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AssessmentStatus = 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'approved';
export type MitigationType = 'avoid' | 'mitigate' | 'transfer' | 'accept';
export type SystemEnvironment = 'development' | 'staging' | 'production' | 'disaster_recovery';

// Common type guards
export const isValidRiskLevel = (level: string): level is RiskLevel => {
  return ['low', 'medium', 'high', 'critical'].includes(level);
};

export const isValidAssessmentStatus = (status: string): status is AssessmentStatus => {
  return ['draft', 'in_progress', 'completed', 'reviewed', 'approved'].includes(status);
};

export const isValidMitigationType = (type: string): type is MitigationType => {
  return ['avoid', 'mitigate', 'transfer', 'accept'].includes(type);
};

// Type composition helpers
export type RiskWithMitigation<T extends Core.BaseRisk = Core.BaseRisk> = T & {
  mitigation?: RiskDomain.MitigationStrategy;
};

export type AssessmentWithQuality<T extends Core.BaseAssessment = Core.BaseAssessment> = T & {
  quality: Core.AssessmentQuality;
};

// Generic interfaces for extensibility
export interface TypedRisk<TMetadata = any> extends Core.BaseRisk {
  metadata?: TMetadata;
}

export interface TypedAssessment<TContext = any> extends Core.BaseAssessment {
  context?: TContext;
}