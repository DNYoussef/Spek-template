/**
 * Semantic Drift Detector Types - Core type definitions for FSM architecture
 */

export enum DriftStates {
  IDLE = 'idle',
  CAPTURING = 'capturing',
  ANALYZING = 'analyzing',
  ADAPTING = 'adapting',
  REPORTING = 'reporting',
  ERROR = 'error'
}

export enum DriftEvents {
  CAPTURE_SNAPSHOT = 'capture_snapshot',
  SNAPSHOT_CAPTURED = 'snapshot_captured',
  ANALYZE_DRIFT = 'analyze_drift',
  ANALYSIS_COMPLETE = 'analysis_complete',
  ADAPTATION_TRIGGERED = 'adaptation_triggered',
  ADAPTATION_COMPLETE = 'adaptation_complete',
  REPORT_DRIFT = 'report_drift',
  REPORT_GENERATED = 'report_generated',
  ERROR = 'error',
  RESET = 'reset',
  RETRY = 'retry'
}

export interface DriftPattern {
  id: string;
  type: 'gradual' | 'sudden' | 'oscillating' | 'converging' | 'diverging';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timeframe: number;
  description: string;
  recommendations: string[];
}

export interface ContextSnapshot {
  timestamp: number;
  semanticVector: number[];
  complexity: number;
  entropy: number;
  domainDistribution: Record<string, number>;
  size: number;
  fingerprint: string;
}

export interface DriftMetrics {
  velocity: number;
  acceleration: number;
  direction: number[];
  magnitude: number;
  coherence: number;
  predictability: number;
}

export interface AdaptiveThreshold {
  metric: string;
  baseline: number;
  current: number;
  adaptation: number;
  confidence: number;
  lastUpdate: number;
}

export interface DriftContext {
  snapshots: ContextSnapshot[];
  tfidf: any;
  adaptiveThresholds: Map<string, AdaptiveThreshold>;
  driftPatterns: DriftPattern[];
  maxSnapshots: number;
  analysisWindow: number;
  updateInterval: number;
  currentSnapshot: ContextSnapshot | null;
  lastAnalysisResult: any;
  lastError?: Error;
}