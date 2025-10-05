import { ValidationResult } from '../../../../../types/validation-types';

/**
 * Reporting Types
 *
 * Type definitions for the FSM-based reporting system.
 * All interfaces follow strict typing patterns for FSM state management.
 *
 * @version 1.0.0
 * @author RiskAssessment FSM Refactor Agent
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ReporterConfig {
  defaultReportFrequency: string;
  maxIndicatorsPerDashboard: number;
  maxReportsToGenerate: number;
  alertSeverityLevels: string[];
  dashboardRefreshRate: string;
  enableRealTimeMonitoring: boolean;
  maxObjectives: number;
  maxAlerts: number;
  maxDashboards: number;
  maxReviews: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  frequency: string;
  audience: string[];
  format: 'pdf' | 'html' | 'json' | 'csv';
}

export interface ReportSection {
  title: string;
  contentType: 'narrative' | 'metrics' | 'charts' | 'tables';
  dataSource: string;
  required: boolean;
  order: number;
}

export interface DashboardLayout {
  id: string;
  name: string;
  components: any[];
  audience: string[];
  refreshRate: string;
}

// ============================================================================
// COMPONENT GENERATION TYPES
// ============================================================================

export interface ObjectiveGenerationRequest {
  assessmentId: string;
  systemContext: any;
  riskProfile: any;
  maxObjectives: number;
}

export interface ObjectiveGenerationResult {
  objectives: any[];
  metadata: {
    coreObjectivesCount: number;
    systemSpecificCount: number;
    complianceSpecificCount: number;
    generationTime: number;
  };
}

export interface IndicatorGenerationRequest {
  risks: any[];
  maxIndicators: number;
  focusOnHighPriority: boolean;
}

export interface IndicatorGenerationResult {
  indicators: any[];
  metadata: {
    highPriorityCount: number;
    systemIndicatorCount: number;
    generationTime: number;
  };
}

export interface DashboardGenerationRequest {
  result: any;
  indicators: any[];
  maxDashboards: number;
  includeCompliance: boolean;
}

export interface DashboardGenerationResult {
  dashboards: any[];
  metadata: {
    executiveDashboards: number;
    operationalDashboards: number;
    complianceDashboards: number;
    totalComponents: number;
    generationTime: number;
  };
}

export interface ReportGenerationRequest {
  request: any;
  result: any;
  maxReports: number;
  includeCompliance: boolean;
}

export interface ReportGenerationResult {
  reports: any[];
  metadata: {
    executiveReports: number;
    detailedReports: number;
    complianceReports: number;
    incidentReports: number;
    generationTime: number;
  };
}

export interface AlertGenerationRequest {
  risks: any[];
  maxAlerts: number;
  severityLevels: string[];
}

export interface AlertGenerationResult {
  alerts: any[];
  metadata: {
    criticalAlerts: number;
    systemAlerts: number;
    totalTriggers: number;
    generationTime: number;
  };
}

export interface ReviewGenerationRequest {
  stakeholders: any[];
  maxReviews: number;
}

export interface ReviewGenerationResult {
  reviews: any[];
  metadata: {
    executiveReviews: number;
    operationalReviews: number;
    totalParticipants: number;
    generationTime: number;
  };
}

// ============================================================================
// FRAMEWORK ASSEMBLY TYPES
// ============================================================================

export interface FrameworkAssemblyRequest {
  objectives: any[];
  indicators: any[];
  dashboards: any[];
  reports: any[];
  alerts: any[];
  reviews: any[];
  config: ReporterConfig;
}

export interface FrameworkAssemblyResult {
  framework: any; // MonitoringFramework
  validationResults: {
    objectivesValid: boolean;
    indicatorsValid: boolean;
    dashboardsValid: boolean;
    reportsValid: boolean;
    alertsValid: boolean;
    reviewsValid: boolean;
    frameworkComplete: boolean;
  };
  metadata: {
    totalComponents: number;
    assemblyTime: number;
    qualityScore: number;
  };
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationRequest {
  framework: any;
  config: ReporterConfig;
  originalRequest: any;
}


export interface ComponentValidationResult {
  isValid: boolean;
  count: number;
  maxAllowed: number;
  errors: string[];
  warnings: string[];
  qualityMetrics: Record<string, number>;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export interface ReportingError {
  code: string;
  message: string;
  state: string;
  component?: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
}

export interface ErrorRecoveryStrategy {
  errorCode: string;
  strategy: 'retry' | 'skip' | 'fallback' | 'abort';
  maxRetries?: number;
  fallbackAction?: string;
  escalation?: string[];
}

// ============================================================================
// PERFORMANCE TRACKING TYPES
// ============================================================================

export interface PerformanceMetrics {
  totalGenerationTime: number;
  componentTimes: Record<string, number>;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  throughput: {
    componentsPerSecond: number;
    objectivesPerSecond: number;
    indicatorsPerSecond: number;
  };
}

export interface QualityMetrics {
  completeness: number;
  consistency: number;
  coverage: number;
  accuracy: number;
  reliability: number;
  overallScore: number;
}

// ============================================================================
// FACTORY TYPES
// ============================================================================

export interface ComponentFactory<TRequest, TResult> {
  generate(request: TRequest): Promise<TResult>;
  validate(result: TResult): boolean;
  getMetrics(): PerformanceMetrics;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_REPORTER_CONFIG: ReporterConfig = {
  defaultReportFrequency: 'weekly',
  maxIndicatorsPerDashboard: 20,
  maxReportsToGenerate: 10,
  alertSeverityLevels: ['info', 'warning', 'error', 'critical'],
  dashboardRefreshRate: '5min',
  enableRealTimeMonitoring: true,
  maxObjectives: 8,
  maxAlerts: 15,
  maxDashboards: 5,
  maxReviews: 6
};

export const NASA_RULE_10_BOUNDS = {
  MAX_FUNCTION_LINES: 60,
  MAX_OBJECTIVES: 8,
  MAX_INDICATORS: 25,
  MAX_DASHBOARDS: 5,
  MAX_REPORTS: 8,
  MAX_ALERTS: 15,
  MAX_REVIEWS: 6,
  MAX_LOOP_ITERATIONS: 50,
  MAX_ARRAY_SIZE: 100
} as const;