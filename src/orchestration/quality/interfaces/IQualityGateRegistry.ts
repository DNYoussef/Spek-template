/**
 * Quality Gate Registry Interface Contracts
 * Defines the contracts for gate registration, validation, and metadata management
 */

import { QualityGateDefinition } from '../../../quality/gates/types/QualityGateTypes';
import { ValidationResult } from '../../../types/validation-types';


export interface GateMetadata {
  gateId: string;
  complexity: number;
  estimatedDuration: number;
  dependencies: string[];
  tags: string[];
  lastUpdated: number;
  usage: GateUsageStats;
  performance: GatePerformanceStats;
}

export interface GateUsageStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecuted: number;
}

export interface GatePerformanceStats {
  averageScore: number;
  medianDuration: number;
  p95Duration: number;
  successRate: number;
  performanceTrend: 'improving' | 'stable' | 'degrading';
}

export interface GateSearchCriteria {
  gateType?: string;
  category?: string;
  priority?: string;
  tags?: string[];
  complexityRange?: [number, number];
  durationRange?: [number, number];
  lastUsedBefore?: number;
  lastUsedAfter?: number;
}

export interface GateRegistrationOptions {
  validateDefinition?: boolean;
  updateIfExists?: boolean;
  generateMetadata?: boolean;
  enableVersioning?: boolean;
}

export interface GateVersion {
  version: string;
  timestamp: number;
  changes: string[];
  author: string;
  deprecated?: boolean;
  migrationPath?: string;
}

/**
 * Primary interface for quality gate registry operations
 */
export interface IGateRegistry {
  // Core registration operations
  registerGate(
    gate: QualityGateDefinition,
    options?: GateRegistrationOptions
  ): Promise<void>;

  unregisterGate(gateId: string): Promise<boolean>;

  updateGate(
    gateId: string,
    updates: Partial<QualityGateDefinition>
  ): Promise<boolean>;

  // Retrieval operations
  getGate(gateId: string, version?: string): Promise<QualityGateDefinition | null>;

  getGatesByType(gateType: string): Promise<QualityGateDefinition[]>;

  getGatesByCategory(category: string): Promise<QualityGateDefinition[]>;

  searchGates(criteria: GateSearchCriteria): Promise<QualityGateDefinition[]>;

  getAllGates(): Promise<QualityGateDefinition[]>;

  // Validation operations
  validateGateDefinition(gate: QualityGateDefinition): Promise<ValidationResult>;

  validateGateCompatibility(
    gateId: string,
    targetVersion: string
  ): Promise<ValidationResult>;

  // Metadata operations
  getGateMetadata(gateId: string): Promise<GateMetadata | null>;

  updateGateMetadata(
    gateId: string,
    metadata: Partial<GateMetadata>
  ): Promise<boolean>;

  getGateStatistics(gateId: string): Promise<GateUsageStats>;

  // Dependency management
  getGateDependencies(gateId: string): Promise<string[]>;

  getDependentGates(gateId: string): Promise<string[]>;

  validateDependencyChain(gateId: string): Promise<ValidationResult>;

  // Versioning operations
  createGateVersion(
    gateId: string,
    version: string,
    changes: string[]
  ): Promise<boolean>;

  getGateVersions(gateId: string): Promise<GateVersion[]>;

  setGateVersion(gateId: string, version: string): Promise<boolean>;

  deprecateGateVersion(
    gateId: string,
    version: string,
    migrationPath?: string
  ): Promise<boolean>;

  // Lifecycle management
  archiveGate(gateId: string, reason: string): Promise<boolean>;

  restoreGate(gateId: string): Promise<boolean>;

  purgeGate(gateId: string): Promise<boolean>;

  // Health and diagnostics
  healthCheck(): Promise<{
    healthy: boolean;
    gateCount: number;
    lastUpdate: number;
    issues: string[];
  }>;

  exportGates(gateIds?: string[]): Promise<string>; // JSON format

  importGates(data: string, options?: {
    overwrite?: boolean;
    validateFirst?: boolean;
  }): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }>;
}

/**
 * Interface for gate definition validation
 */
export interface IGateValidator {
  validate(gate: QualityGateDefinition): Promise<ValidationResult>;

  validateCriteria(criteria: any[]): Promise<ValidationResult>;

  validateThresholds(thresholds: any): Promise<ValidationResult>;

  validateAutomation(automation: any): Promise<ValidationResult>;

  validateReporting(reporting: any): Promise<ValidationResult>;

  validateRollback(rollback: any): Promise<ValidationResult>;
}

/**
 * Interface for gate metadata management
 */
export interface IGateMetadataManager {
  generateMetadata(gate: QualityGateDefinition): Promise<GateMetadata>;

  updateUsageStats(
    gateId: string,
    execution: {
      success: boolean;
      duration: number;
      score: number;
    }
  ): Promise<void>;

  calculateComplexity(gate: QualityGateDefinition): number;

  estimateDuration(gate: QualityGateDefinition): number;

  extractTags(gate: QualityGateDefinition): string[];

  analyzePerformanceTrend(gateId: string): Promise<'improving' | 'stable' | 'degrading'>;
}

/**
 * Interface for gate storage backend
 */
export interface IGateStorage {
  store(gateId: string, gate: QualityGateDefinition): Promise<void>;

  retrieve(gateId: string, version?: string): Promise<QualityGateDefinition | null>;

  delete(gateId: string, version?: string): Promise<boolean>;

  exists(gateId: string, version?: string): Promise<boolean>;

  list(filter?: (gate: QualityGateDefinition) => boolean): Promise<QualityGateDefinition[]>;

  backup(): Promise<string>;

  restore(data: string): Promise<void>;

  getSize(): Promise<number>;

  optimize(): Promise<void>;
}

/**
 * Interface for gate caching
 */
export interface IGateCache {
  get(key: string): Promise<QualityGateDefinition | null>;

  set(key: string, gate: QualityGateDefinition, ttl?: number): Promise<void>;

  delete(key: string): Promise<boolean>;

  clear(): Promise<void>;

  keys(): Promise<string[]>;

  size(): Promise<number>;

  hit(key: string): Promise<void>; // Record cache hit

  miss(key: string): Promise<void>; // Record cache miss

  getStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  }>;
}

/**
 * Interface for gate events
 */
export interface IGateEventEmitter {
  onGateRegistered(callback: (gateId: string, gate: QualityGateDefinition) => void): void;

  onGateUpdated(callback: (gateId: string, changes: Partial<QualityGateDefinition>) => void): void;

  onGateDeleted(callback: (gateId: string) => void): void;

  onValidationFailed(callback: (gateId: string, errors: string[]) => void): void;

  onMetadataUpdated(callback: (gateId: string, metadata: GateMetadata) => void): void;

  emit(event: string, data: any): void;
}

/**
 * Main registry factory interface
 */
export interface IGateRegistryFactory {
  createRegistry(options?: {
    storage?: IGateStorage;
    cache?: IGateCache;
    validator?: IGateValidator;
    metadataManager?: IGateMetadataManager;
  }): IGateRegistry;

  createMemoryRegistry(): IGateRegistry;

  createPersistentRegistry(storagePath: string): IGateRegistry;

  createDistributedRegistry(nodes: string[]): IGateRegistry;
}

