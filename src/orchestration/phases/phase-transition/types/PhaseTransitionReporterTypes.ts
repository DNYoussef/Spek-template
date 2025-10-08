/**
 * Phase Transition Reporter Type Definitions
 * Provides comprehensive phase transition reporting types
 * NASA Rule 10 Compliant: All interfaces modular, FSM-based enums
 */

import type { Timestamp, ReportId } from '../../../../types/brands';

/**
 * Report type classifications
 * FSM State: Defines report format categories
 */
export enum ReportType {
  SUMMARY = 'SUMMARY',
  DETAILED = 'DETAILED',
  DIAGNOSTIC = 'DIAGNOSTIC',
  AUDIT = 'AUDIT'
}

/**
 * Report output formats
 * FSM State: Defines report serialization formats
 */
export enum ReportFormat {
  JSON = 'JSON',
  MARKDOWN = 'MARKDOWN',
  HTML = 'HTML',
  PDF = 'PDF'
}

/**
 * Report generation status
 * FSM State: Defines report lifecycle states
 */
export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED'
}

/**
 * Report priority levels
 * FSM State: Defines report urgency classification
 */
export enum ReportPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Phase report data structure
 */
export interface PhaseReport {
  readonly id: ReportId;
  readonly type: ReportType;
  readonly format: ReportFormat;
  readonly content: string;
  readonly metadata: ReportMetadata;
  readonly timestamp: Timestamp;
}

/**
 * Report metadata information
 */
export interface ReportMetadata {
  readonly author: string;
  readonly version: string;
  readonly tags: ReadonlyArray<string>;
  readonly relatedPhases: ReadonlyArray<string>;
  readonly status: ReportStatus;
  readonly priority: ReportPriority;
}

/**
 * Report configuration settings
 */
export interface ReportConfig {
  readonly includeMetrics: boolean;
  readonly includeErrors: boolean;
  readonly format: ReportFormat;
  readonly destination: string;
  readonly compression: boolean;
  readonly encryption: boolean;
}

/**
 * Report generation request
 */
export interface ReportRequest {
  readonly type: ReportType;
  readonly format: ReportFormat;
  readonly config: ReportConfig;
  readonly filters: ReportFilters;
  readonly priority: ReportPriority;
}

/**
 * Report filtering criteria
 */
export interface ReportFilters {
  readonly phases: ReadonlyArray<string>;
  readonly dateRange: DateRange;
  readonly severityLevels: ReadonlyArray<string>;
  readonly includeArchived: boolean;
}

/**
 * Date range specification
 */
export interface DateRange {
  readonly start: Timestamp;
  readonly end: Timestamp;
}

/**
 * Report generation result
 */
export interface ReportResult {
  readonly report: PhaseReport;
  readonly status: ReportStatus;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
  readonly generationTime: number;
}

/**
 * Report distribution settings
 */
export interface ReportDistribution {
  readonly recipients: ReadonlyArray<string>;
  readonly channels: ReadonlyArray<string>;
  readonly schedule: string;
  readonly autoArchive: boolean;
}

/**
 * Validates report type is within defined bounds
 * @param type - Report type to validate
 * @returns True if valid
 */
export function isValidReportType(type: ReportType): boolean {
  const validTypes = Object.values(ReportType);
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid report type: ${type}`);
  }
  return validTypes.includes(type);
}

/**
 * Validates report format is within defined bounds
 * @param format - Report format to validate
 * @returns True if valid
 */
export function isValidReportFormat(format: ReportFormat): boolean {
  const validFormats = Object.values(ReportFormat);
  if (!validFormats.includes(format)) {
    throw new Error(`Invalid report format: ${format}`);
  }
  return validFormats.includes(format);
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:42:00 | base-template-generator@sonnet-4 | Create reporter types | PhaseTransitionReporterTypes.ts | OK | FSM-compliant with comprehensive reporting | 0.00 | ceee1f9 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent2-reporter-types
 * - inputs: ["TS2305 errors for PhaseTransitionReporter"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */