/**
 * Type definitions for cross-reference management and link validation.
 * Supports intelligent linking between documentation elements.
 */

export enum ReferenceType {
  RELATED = 'related',
  DEPENDENCY = 'dependency',
  EXAMPLE = 'example',
  SEE_ALSO = 'see_also',
  EXTENDS = 'extends',
  IMPLEMENTS = 'implements',
  OVERRIDES = 'overrides',
  USES = 'uses',
  PROVIDES = 'provides',
  REFERENCES = 'references'
}

export interface CrossReference {
  id: string;
  sourceId: string;
  targetId: string;
  type: ReferenceType;
  context?: any;
  createdAt: Date;
  isValid: boolean;
  validatedAt?: Date;
  weight?: number; // 0-1, strength of the relationship
  bidirectional?: boolean;
  metadata?: {
    auto?: boolean;
    explicit?: boolean;
    similarity?: number;
    originalTarget?: string;
    autoFixed?: boolean;
    userCreated?: boolean;
    confidence?: number;
  };
}

export interface LinkValidationResult {
  referenceId: string;
  isValid: boolean;
  error?: string;
  validatedAt: Date;
  validationTime: number;
  suggestions?: string[];
  severity?: 'error' | 'warning' | 'info';
}

export interface ReferenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    avgConnectivity: number;
    stronglyConnectedComponents: number;
    centralityScores: Map<string, number>;
  };
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: {
    patternType: string;
    createdAt: Date;
    lastModified: Date;
    importance: number;
    centrality: number;
  };
  position?: {
    x: number;
    y: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: ReferenceType;
  weight: number;
  properties: {
    strength: number;
    confidence: number;
    createdAt: Date;
    validated: boolean;
  };
}

export interface ReferenceAnalytics {
  totalReferences: number;
  validReferences: number;
  brokenReferences: number;
  referencesByType: Map<ReferenceType, number>;
  mostReferencedPatterns: Array<{
    patternId: string;
    incomingReferences: number;
    outgoingReferences: number;
    centralityScore: number;
  }>;
  validationMetrics: {
    lastValidationTime: Date;
    validationFrequency: number;
    averageValidationTime: number;
    autoFixSuccessRate: number;
  };
}

export interface ReferenceSearchOptions {
  sourceId?: string;
  targetId?: string;
  type?: ReferenceType;
  isValid?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMetadata?: boolean;
  maxDepth?: number;
  orderBy?: 'createdAt' | 'weight' | 'type';
  limit?: number;
}

export interface ReferenceValidationOptions {
  checkExistence?: boolean;
  checkTypeCompatibility?: boolean;
  checkCircularReferences?: boolean;
  autoFix?: boolean;
  generateSuggestions?: boolean;
  validateMetadata?: boolean;
  batchSize?: number;
}

export interface ReferenceUpdateBatch {
  updates: Array<{
    referenceId: string;
    changes: Partial<CrossReference>;
    reason?: string;
  }>;
  metadata: {
    batchId: string;
    createdAt: Date;
    reason: string;
    updatedBy: string;
  };
}

export interface ReferenceTraversalOptions {
  direction: 'forward' | 'backward' | 'both';
  maxDepth: number;
  includeTypes?: ReferenceType[];
  excludeTypes?: ReferenceType[];
  visitOnce?: boolean;
  includeInvalid?: boolean;
  weightThreshold?: number;
}

export interface ReferencePath {
  source: string;
  target: string;
  path: Array<{
    nodeId: string;
    referenceId: string;
    type: ReferenceType;
    weight: number;
  }>;
  totalWeight: number;
  pathLength: number;
  isValid: boolean;
}

export interface ReferenceCluster {
  id: string;
  name: string;
  patternIds: string[];
  centerNode: string;
  cohesion: number; // 0-1
  avgDistance: number;
  size: number;
  type: 'dense' | 'sparse' | 'chain' | 'star';
}

export interface ReferenceDiscoveryResult {
  discoveredReferences: CrossReference[];
  confidence: number;
  method: 'content_similarity' | 'structural_analysis' | 'pattern_matching' | 'ml_prediction';
  metadata: {
    analysisTime: number;
    candidatesEvaluated: number;
    thresholdUsed: number;
    features?: string[];
  };
}

export interface ReferenceQualityMetrics {
  precision: number; // True positives / (True positives + False positives)
  recall: number; // True positives / (True positives + False negatives)
  f1Score: number;
  accuracy: number;
  coverage: number; // Percentage of patterns with at least one reference
  density: number; // Number of references / Number of possible references
  freshness: number; // Percentage of recently validated references
}

export interface ReferenceExportOptions {
  format: 'json' | 'csv' | 'graphml' | 'dot' | 'cytoscape';
  includeInvalid: boolean;
  includeMetadata: boolean;
  filterBy?: ReferenceSearchOptions;
  groupBy?: 'type' | 'source' | 'target' | 'validity';
  anonymize?: boolean;
}

export interface ReferenceImportOptions {
  format: 'json' | 'csv' | 'graphml';
  overwriteExisting: boolean;
  validateReferences: boolean;
  autoDiscoverMissing: boolean;
  batchSize: number;
  preserveIds: boolean;
}

export interface ReferenceConflict {
  conflictId: string;
  type: 'duplicate' | 'circular' | 'invalid_type' | 'missing_target' | 'missing_source';
  references: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolutionSuggestions: Array<{
    action: 'remove' | 'merge' | 'update' | 'ignore';
    description: string;
    confidence: number;
  }>;
  detectedAt: Date;
}

export interface ReferenceOptimizationResult {
  optimizationsApplied: Array<{
    type: 'remove_redundant' | 'merge_duplicate' | 'fix_broken' | 'strengthen_weak';
    count: number;
    description: string;
  }>;
  beforeMetrics: ReferenceQualityMetrics;
  afterMetrics: ReferenceQualityMetrics;
  improvementScore: number;
  processingTime: number;
}

export interface ReferenceVisualizationData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    size: number;
    color: string;
    position?: { x: number; y: number };
    metadata: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: ReferenceType;
    weight: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
    metadata: any;
  }>;
  layout: {
    algorithm: 'force' | 'hierarchical' | 'circular' | 'grid';
    options: any;
  };
}

export interface ReferenceChangeEvent {
  eventType: 'created' | 'updated' | 'deleted' | 'validated' | 'invalidated';
  referenceId: string;
  timestamp: Date;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  source: 'user' | 'system' | 'automation' | 'sync';
  metadata?: any;
}

export interface ReferenceSubscription {
  id: string;
  subscriberId: string;
  filters: {
    patternIds?: string[];
    referenceTypes?: ReferenceType[];
    eventTypes?: string[];
  };
  callback: (event: ReferenceChangeEvent) => void;
  isActive: boolean;
  createdAt: Date;
}

export interface ReferenceSyncConfiguration {
  enabled: boolean;
  interval: number; // milliseconds
  batchSize: number;
  retryAttempts: number;
  backoffMultiplier: number;
  validationOnSync: boolean;
  autoFixEnabled: boolean;
  conflictResolution: 'manual' | 'auto_latest' | 'auto_merge';
  notifications: {
    onConflict: boolean;
    onFailure: boolean;
    onSuccess: boolean;
  };
}