/**
 * DatasetTypes.ts - Dataset Management Type Definitions
 * @stub true
 * @architecture Data pipeline and dataset type system
 */

// Dataset configuration
export interface DatasetConfig {
  readonly id: string;
  readonly name: string;
  readonly type: 'training' | 'validation' | 'test' | 'production';
  readonly format: 'json' | 'csv' | 'parquet' | 'arrow';
  readonly schema?: DatasetSchema;
}

// Dataset schema
export interface DatasetSchema {
  readonly fields: readonly DatasetField[];
  readonly version: string;
}

// Dataset field
export interface DatasetField {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  readonly required: boolean;
  readonly nullable: boolean;
  readonly description?: string;
}

// Dataset metadata
export interface DatasetMetadata {
  readonly size: number; // number of records
  readonly sizeBytes: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly checksum: string;
  readonly tags?: readonly string[];
}

// Dataset split
export interface DatasetSplit {
  readonly train: number; // 0-1
  readonly validation: number;
  readonly test: number;
  readonly seed?: number;
}

// Additional exports for dataset management
export interface DatasetMetrics {
  readonly accuracy: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1Score: number;
  readonly samples: number;
  readonly response_time_p95?: number;
  readonly user_satisfaction_avg?: number;
  readonly quality_score_avg?: number;
  readonly token_efficiency_avg?: number;
}

export interface QualityMetrics {
  readonly completeness: number;
  readonly consistency: number;
  readonly validity: number;
  readonly accuracy: number;
  readonly timeliness: number;
}

export interface PerformanceMetrics {
  readonly throughput: number;
  readonly latency: number;
  readonly errorRate: number;
  readonly availability: number;
  readonly timestamp?: number;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly score: number;
}

export interface ScoringResult {
  readonly score: number;
  readonly breakdown: Record<string, number>;
  readonly confidence: number;
  readonly timestamp: number;
}

export interface OptimizationTarget {
  readonly metric: string;
  readonly target: number;
  readonly current: number;
  readonly improvement: number;
}

export interface BaselineSnapshot {
  readonly timestamp: number;
  readonly metrics: DatasetMetrics;
  readonly quality: QualityMetrics;
  readonly configuration: Record<string, unknown>;
}

export interface CommunicationExample {
  readonly input: Record<string, unknown>;
  readonly output: Record<string, unknown>;
  readonly metadata: Record<string, unknown>;
  readonly score: number;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
