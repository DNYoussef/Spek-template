/**
 * Analysis Types - Re-export from canonical location
 * Consolidated from src/analysis/core/types/AnalysisTypes.ts
 */

// Re-export all types from analysis core
export * from '../analysis/core/types/AnalysisTypes';

// Additional exports for backward compatibility
export type { AnalysisRule, AnalysisViolation, AnalysisResult, AnalysisReport } from '../analysis/core/types/AnalysisTypes';
