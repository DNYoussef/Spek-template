/**
 * MegaDecompositionTypes - Shared types for mega file decomposition
 *
 * Provides common type definitions for all mega god object decompositions.
 * Enforces consistency across all decomposed components.
 *
 * @version 1.0.0
 * @nasa_compliant true
 */

// NASA Rule 10: Fixed bounds constants
export const MAX_COMPONENT_DEPENDENCIES = 20;
export const MAX_METHOD_PARAMETERS = 8;
export const MAX_VALIDATION_RULES = 15;

export interface ComponentConfig {
  id: string;
  name: string;
  enabled: boolean;
  maxMemoryMB: number;
  timeoutMs: number;
  dependencies: string[];
  metadata: Record<string, unknown>;
}

export interface ProcessInput {
  id: string;
  type: string;
  data: unknown;
  options: ProcessOptions;
  context: ProcessContext;
}

export interface ProcessOptions {
  validateInput: boolean;
  enableLogging: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface ProcessContext {
  requestId: string;
  userId?: string;
  timestamp: Date;
  traceId: string;
  metadata: Record<string, unknown>;
}

export interface ProcessResult {
  success: boolean;
  data?: unknown;
  error?: ProcessError;
  metrics: ProcessMetrics;
  warnings: string[];
}

export interface ProcessError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ProcessMetrics {
  durationMs: number;
  memoryUsedMB: number;
  operationsCount: number;
  validationTime: number;
}

export interface ValidationData {
  input: unknown;
  rules: ValidationRule[];
  context: ValidationContext;
}

export interface ValidationRule {
  name: string;
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface ValidationContext {
  strict: boolean;
  stopOnFirst: boolean;
  customValidators: Map<string, (value: unknown) => boolean>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value?: unknown;
}

export interface DecompositionMetrics {
  originalLineCount: number;
  decomposedLineCount: number;
  reductionPercentage: number;
  componentCount: number;
  complexityReduction: number;
  nasaComplianceScore: number;
}

export interface ComponentHealth {
  componentId: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastCheck: Date;
  issues: HealthIssue[];
  metrics: ComponentMetrics;
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  timestamp: Date;
}

export interface ComponentMetrics {
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface NASAComplianceReport {
  componentId: string;
  compliant: boolean;
  score: number;
  violations: NASAViolation[];
  timestamp: Date;
}

export interface NASAViolation {
  rule: string;
  severity: 'minor' | 'major' | 'critical';
  location: string;
  description: string;
  recommendation: string;
}

// Type guards for runtime validation
export function isComponentConfig(obj: unknown): obj is ComponentConfig {
  return typeof obj === 'object' && obj !== null &&
    'id' in obj && 'name' in obj && 'enabled' in obj;
}

export function isProcessInput(obj: unknown): obj is ProcessInput {
  return typeof obj === 'object' && obj !== null &&
    'id' in obj && 'type' in obj && 'data' in obj;
}

export function isValidationResult(obj: unknown): obj is ValidationResult {
  return typeof obj === 'object' && obj !== null &&
    'valid' in obj && 'errors' in obj;
}