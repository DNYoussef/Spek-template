/**
 * Adaptive Threshold Types - Core type definitions for FSM architecture
 */

export enum ThresholdStates {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  MONITORING = 'monitoring',
  ADAPTING = 'adapting',
  ERROR = 'error'
}

export enum ThresholdEvents {
  INITIALIZE = 'initialize',
  INITIALIZATION_COMPLETE = 'initialization_complete',
  CONDITIONS_UPDATED = 'conditions_updated',
  ADAPTATION_TRIGGERED = 'adaptation_triggered',
  ADAPTATION_COMPLETE = 'adaptation_complete',
  ERROR = 'error',
  RESET = 'reset'
}

export interface ThresholdMetric {
  name: string;
  value: number;
  baseline: number;
  min: number;
  max: number;
  sensitivity: number;
  timestamp: number;
}

export interface ThresholdRule {
  condition: string;
  operator: 'gt' | 'lt' | 'eq' | 'between';
  value: number | [number, number];
  action: 'increase' | 'decrease' | 'reset' | 'alert';
  magnitude: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AdaptationHistory {
  timestamp: number;
  threshold: string;
  oldValue: number;
  newValue: number;
  reason: string;
  confidence: number;
}

export interface SystemCondition {
  load: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  degradationRate: number;
  timestamp?: number;
}

export interface ThresholdContext {
  thresholds: Map<string, ThresholdMetric>;
  rules: Map<string, ThresholdRule[]>;
  history: AdaptationHistory[];
  conditions: SystemCondition[];
  maxHistory: number;
  maxConditions: number;
  learningRate: number;
  confidenceThreshold: number;
  isAdaptationActive: boolean;
  currentCondition?: SystemCondition;
  lastAdaptation?: AdaptationHistory;
  lastError?: Error;
}