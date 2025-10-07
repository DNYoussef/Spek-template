/**
 * Quality Gate Types
 * Type definitions for quality gate validation and enforcement
 * NASA Rule 10 Compliant
 */

export interface QualityGateDefinition {
  id: string;
  name: string;
  description?: string;
  threshold: number;
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
  metric: string;
  enabled: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'coverage' | 'complexity' | 'security' | 'performance' | 'quality';
}

export interface QualityGateResult {
  gateId: string;
  passed: boolean;
  actualValue: number;
  thresholdValue: number;
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface QualityGateEvaluation {
  timestamp: Date;
  gates: QualityGateResult[];
  overallPassed: boolean;
  failedGates: string[];
  warnings: string[];
  metrics: Record<string, number>;
}

export interface QualityGateConfig {
  gates: QualityGateDefinition[];
  strictMode: boolean;
  continueOnFailure: boolean;
  notifyOnFailure: boolean;
}

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 quality gate types)
// === END FOOTER ===
