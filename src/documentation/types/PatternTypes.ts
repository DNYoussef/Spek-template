/**
 * Core type definitions for documentation patterns and management.
 * Provides comprehensive type safety for the documentation system.
 */

export enum PatternType {
  API_ENDPOINT = 'api_endpoint',
  CLASS_DOCUMENTATION = 'class_documentation',
  FUNCTION_DOCUMENTATION = 'function_documentation',
  CONFIGURATION = 'configuration',
  ERROR_HANDLING = 'error_handling',
  DEPLOYMENT = 'deployment',
  MONITORING = 'monitoring',
  RESEARCH_TASK = 'research_task',
  RESEARCH_FINDINGS = 'research_findings',
  KNOWLEDGE_SYNTHESIS = 'knowledge_synthesis',
  RESEARCH_METHODOLOGY = 'research_methodology',
  OPENAPI = 'openapi',
  API_TESTING = 'api_testing',
  INTERACTIVE = 'interactive'
}

export interface DocumentationPattern {
  id: string;
  type: string;
  content: string;
  metadata?: PatternMetadata;
}

export interface PatternMetadata {
  createdAt?: Date;
  lastModified?: Date;
  lastAccessed?: Date;
  lastUsed?: Date;
  usageCount?: number;
  accessCount?: number;
  effectiveness?: number;
  features?: any;
  similarPatterns?: string[];
  version?: number;
  tags?: string[];
  title?: string;
  author?: string;
  filePath?: string;
  sourceFile?: string;
  className?: string;
  functionName?: string;
  endpointCount?: number;
  componentName?: string;
  componentType?: string;
  environment?: string;
  deploymentName?: string;
  taskId?: string;
  researchArea?: string;
  priority?: string;
  estimatedDuration?: string;
  resultId?: string;
  researchers?: string[];
  findingsCount?: number;
  recommendationsCount?: number;
  synthesisTitle?: string;
  sourceCount?: number;
  researchAreas?: string[];
  totalFindings?: number;
  qualityScore?: number;
  methodologyName?: string;
  category?: string;
  complexity?: string;
  applicability?: string[];
  serviceName?: string;
  hasAuthentication?: boolean;
  hasExamples?: boolean;
  format?: string;
  generatedAt?: Date;
  storageSize?: number;
  elementName?: string;
}

export interface StorageResult {
  success: boolean;
  patternId?: string;
  processingTime: number;
  error?: string;
  patternsCreated?: number;
  patternsUpdated?: number;
  patternsDeleted?: number;
  importedCount?: number;
}

export interface PatternAnalytics {
  totalPatterns: number;
  patternsByType: Map<string, number>;
  averageEffectiveness: number;
  mostUsedPatterns: Array<{ id: string; usageCount: number }>;
  recentlyCreated: DocumentationPattern[];
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface PatternSearchOptions {
  type?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minEffectiveness?: number;
  author?: string;
  limit?: number;
  offset?: number;
}

export interface PatternGenerationOptions {
  includeExamples?: boolean;
  includeMetadata?: boolean;
  templateStyle?: 'minimal' | 'standard' | 'comprehensive';
  targetAudience?: 'developer' | 'enduser' | 'technical_writer';
  outputFormat?: 'markdown' | 'html' | 'json' | 'openapi';
}

export interface PatternUpdateRequest {
  patternId: string;
  updates: Partial<DocumentationPattern>;
  reason?: string;
  updatedBy?: string;
}

export interface PatternValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number; // 0-100
}

export interface PatternTemplate {
  id: string;
  name: string;
  description: string;
  patternType: PatternType;
  template: string;
  variables: TemplateVariable[];
  examples: TemplateExample[];
  metadata: {
    version: string;
    author: string;
    category: string;
    complexity: 'simple' | 'moderate' | 'complex';
    tags: string[];
  };
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    enum?: any[];
  };
}

export interface TemplateExample {
  name: string;
  description: string;
  variables: Record<string, any>;
  expectedOutput: string;
}

export interface PatternRelationship {
  sourcePatternId: string;
  targetPatternId: string;
  relationshipType: 'depends_on' | 'references' | 'extends' | 'implements' | 'related_to';
  strength: number; // 0-1
  context?: string;
  createdAt: Date;
}

export interface PatternUsageStatistics {
  patternId: string;
  totalViews: number;
  uniqueUsers: number;
  averageViewDuration: number;
  lastAccessed: Date;
  accessTrends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  userFeedback: {
    helpful: number;
    notHelpful: number;
    comments: Array<{
      comment: string;
      rating: number;
      timestamp: Date;
      userId?: string;
    }>;
  };
}

export interface PatternQualityMetrics {
  patternId: string;
  readabilityScore: number; // 0-100
  completenessScore: number; // 0-100
  accuracyScore: number; // 0-100
  consistencyScore: number; // 0-100
  usefulnessScore: number; // 0-100
  overallScore: number; // 0-100
  lastEvaluated: Date;
  evaluationMethod: 'automated' | 'manual' | 'hybrid';
  feedback: string[];
}

export interface PatternVersion {
  version: string;
  patternId: string;
  content: string;
  metadata: PatternMetadata;
  changes: string[];
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface PatternCollection {
  id: string;
  name: string;
  description: string;
  patterns: string[]; // Pattern IDs
  tags: string[];
  category: string;
  owner: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    patternCount: number;
    totalViews: number;
    averageRating: number;
    downloadCount: number;
  };
}

export interface PatternExportOptions {
  format: 'json' | 'yaml' | 'markdown' | 'html' | 'pdf';
  includeMetadata: boolean;
  includeStatistics: boolean;
  includeVersionHistory: boolean;
  filterBy?: PatternSearchOptions;
  groupBy?: 'type' | 'category' | 'author' | 'date';
}

export interface PatternImportOptions {
  format: 'json' | 'yaml' | 'markdown';
  overwriteExisting: boolean;
  validateBeforeImport: boolean;
  preserveIds: boolean;
  assignToCollection?: string;
  defaultMetadata?: Partial<PatternMetadata>;
}

export interface PatternBackup {
  timestamp: Date;
  version: string;
  patterns: DocumentationPattern[];
  metadata: PatternMetadata[];
  relationships: PatternRelationship[];
  collections: PatternCollection[];
  statistics: PatternUsageStatistics[];
  checksum: string;
}

export interface PatternSyncStatus {
  patternId: string;
  lastSynced: Date;
  syncStatus: 'synced' | 'pending' | 'failed' | 'conflict';
  sourceHash: string;
  targetHash: string;
  conflictDetails?: {
    field: string;
    sourceValue: any;
    targetValue: any;
  }[];
}

export interface PatternDependency {
  patternId: string;
  dependsOn: string[];
  dependedBy: string[];
  circularDependencies: string[][];
  depth: number;
  criticalPath: boolean;
}

export interface PatternGenerationContext {
  sourceType: 'code' | 'api' | 'manual' | 'template';
  sourceLocation: string;
  generationMethod: 'automated' | 'assisted' | 'manual';
  confidence: number; // 0-1
  modelVersion?: string;
  trainingData?: string[];
  customPrompts?: string[];
  userPreferences?: {
    verbosity: 'minimal' | 'standard' | 'detailed';
    includeExamples: boolean;
    codeStyle: string;
    documentationStyle: string;
  };
}

export interface PatternRecommendation {
  recommendedPatternId: string;
  reason: string;
  confidence: number; // 0-1
  context: 'similar_content' | 'same_type' | 'related_project' | 'user_history';
  metadata: {
    sourcePatternId?: string;
    similarity?: number;
    userRelevance?: number;
    projectRelevance?: number;
  };
}

export interface PatternPerformanceMetrics {
  searchLatency: {
    p50: number;
    p95: number;
    p99: number;
  };
  generationLatency: {
    p50: number;
    p95: number;
    p99: number;
  };
  storageMetrics: {
    totalSize: number;
    averagePatternSize: number;
    compressionRatio: number;
    cacheHitRate: number;
  };
  qualityMetrics: {
    averageQualityScore: number;
    patternAcceptanceRate: number;
    userSatisfactionScore: number;
  };
}