/**
 * Analysis Engine Types
 * Performance and data analysis types
 * NASA Rule 10 Compliant - Extracted from MigrationAnalysisTypes.ts
 */

export interface PerformanceProfile {
  throughput: ThroughputMetrics;
  latency: LatencyMetrics;
  availability: AvailabilityMetrics;
  scalability: ScalabilityMetrics;
  baseline: PerformanceBaseline;
}

export interface ThroughputMetrics {
  requestsPerSecond: number;
  transactionsPerSecond: number;
  dataTransferRate: number;
  peakMultiplier: number;
}

export interface LatencyMetrics {
  average: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface AvailabilityMetrics {
  uptime: number;
  mtbf: number;
  mttr: number;
  sla: number;
}

export interface ScalabilityMetrics {
  maxUsers: number;
  maxThroughput: number;
  scalingFactor: number;
  horizontalScaling: boolean;
  verticalScaling: boolean;
}

export interface PerformanceBaseline {
  collectionPeriod: string;
  averageMetrics: Record<string, number>;
  peakMetrics: Record<string, number>;
  trends: TrendAnalysis[];
}

export interface TrendAnalysis {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number;
  confidence: number;
}

export interface DataProfile {
  volume: DataVolumeMetrics;
  types: DataTypeInfo[];
  sensitivity: DataSensitivityInfo;
  backup: BackupInfo;
  retention: RetentionPolicy[];
}

export interface DataVolumeMetrics {
  totalSize: number;
  growthRate: number;
  recordCount: number;
  averageRecordSize: number;
}

export interface DataTypeInfo {
  type: string;
  percentage: number;
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  migrationComplexity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DataSensitivityInfo {
  classification: string;
  regulations: string[];
  encryptionRequired: boolean;
  anonymizationRequired: boolean;
  auditTrailRequired: boolean;
}

export interface BackupInfo {
  frequency: string;
  retention: string;
  restoreTime: number;
  testingFrequency: string;
  lastTest: Date;
}

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: string;
  archivePolicy: string;
  deletionPolicy: string;
}