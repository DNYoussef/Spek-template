/**
 * Migration Error Types
 * Error handling and reporting types
 * NASA Rule 10 Compliant - Extracted from MigrationAnalysisTypes.ts
 */

export interface MigrationError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: ErrorContext;
}

export interface ErrorContext {
  migrationId?: string;
  phase?: string;
  component?: string;
  operation?: string;
}

export interface ErrorReport {
  errors: MigrationError[];
  warnings: MigrationWarning[];
  summary: ErrorSummary;
}

export interface MigrationWarning {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface ErrorSummary {
  total_errors: number;
  total_warnings: number;
  critical_errors: number;
  blocking_errors: number;
}