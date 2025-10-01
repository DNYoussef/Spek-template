/**
 * A2A DSPy Context DNA System - Core Type Definitions
 * NASA Rule 10 Compliant Implementation
 */

// Agent Identity and Context Types
export interface AgentIdentity {
  id: string;
  type: 'QUEEN' | 'PRINCESS' | 'DRONE';
  domain: string;
  capabilities: string[];
  memoryPointer: string;
  role?: string; // Agent role designation for communication routing
  metadata?: Record<string, any>; // Additional agent metadata for context
}

export interface AgentContext {
  previousMessages: AgentMessage[];
  memoryState: MemoryState;
  taskContext: TaskContext;
  performanceMetrics: PerformanceMetrics;
}

export interface AgentMessage {
  id: string;
  sourceAgent: AgentIdentity;
  targetAgent: AgentIdentity;
  content: string;
  agentContext: AgentContext;
  timestamp: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>; // Message metadata for routing and tracking
}

// Context DNA Enhancement Types
export interface ContextDNA {
  semanticHash: string;
  relevanceScore: number;
  compressionRatio: number;
  memoryPointers: MemoryPointer[];
  validationResults: ValidationResult[];
  enhancementMetadata: EnhancementMetadata;
}

export interface EnhancedMessage {
  originalMessage: AgentMessage;
  semanticHash: string;
  relevanceScore: number;
  enhancedContext: CompressedContext;
  memoryPointers: MemoryPointer[];
  qualityPrediction: number;
  metadata?: Record<string, any>; // Enhanced message metadata for optimization tracking
}

export interface CompressedContext {
  essentialElements: ContextElement[];
  compressedSize: number;
  originalSize: number;
  compressionRatio: number;
}

export interface ContextElement {
  type: 'TASK' | 'MEMORY' | 'PERFORMANCE' | 'RELATIONSHIP';
  content: string;
  relevanceScore: number;
  semanticFingerprint: string;
}

// Communication Quality Types
export interface QualityMetrics {
  semanticCoherence: number; // 0-1
  contextRelevance: number; // 0-1
  actionClarity: number; // 0-1
  completeness: number; // 0-1
  overallScore: number; // weighted average
}

export interface QualityValidation {
  isValid: boolean;
  score: QualityMetrics;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'SEMANTIC' | 'RELEVANCE' | 'CLARITY' | 'COMPLETENESS';
  description: string;
  suggestedFix: string;
}

// Memory Coordination Types
export interface MemoryPointer {
  id: string;
  agentId: string;
  memoryType: 'SHORT_TERM' | 'LONG_TERM' | 'SEMANTIC' | 'PROCEDURAL';
  relevanceScore: number;
  lastAccessed: number;
  content: string;
}

export interface MemoryState {
  shortTerm: MemoryPointer[];
  longTerm: MemoryPointer[];
  semantic: MemoryPointer[];
  procedural: MemoryPointer[];
  crossAgentLinks: CrossAgentLink[];
}

export interface CrossAgentLink {
  sourceAgent: string;
  targetAgent: string;
  linkType: 'DEPENDENCY' | 'COLLABORATION' | 'HIERARCHY' | 'INFORMATION';
  strength: number;
  lastUsed: number;
}

// Performance and Optimization Types
export interface PerformanceMetrics {
  communicationLatency: number;
  qualityScore: number;
  taskCompletionRate: number;
  memoryEfficiency: number;
  errorRate: number;
}

export interface OptimizationResult {
  improved: boolean;
  oldScore: number;
  newScore: number;
  optimizationActions: OptimizationAction[];
  nextOptimizationHint: string;
}

export interface OptimizationAction {
  type: 'COMPRESS_CONTEXT' | 'ENHANCE_SEMANTICS' | 'FILTER_NOISE' | 'BOOST_RELEVANCE';
  applied: boolean;
  impact: number;
  description: string;
}

// FSM State Machine Types
export enum A2ACommState {
  INITIALIZING = 'INITIALIZING',
  ANALYZING_CONTEXT = 'ANALYZING_CONTEXT',
  OPTIMIZING_MESSAGE = 'OPTIMIZING_MESSAGE',
  VALIDATING_QUALITY = 'VALIDATING_QUALITY',
  TRANSMITTING = 'TRANSMITTING',
  MONITORING_FEEDBACK = 'MONITORING_FEEDBACK',
  ERROR_RECOVERY = 'ERROR_RECOVERY'
}

export enum A2ACommEvent {
  INITIALIZE = 'INITIALIZE',
  CONTEXT_READY = 'CONTEXT_READY',
  MESSAGE_OPTIMIZED = 'MESSAGE_OPTIMIZED',
  QUALITY_VALIDATED = 'QUALITY_VALIDATED',
  TRANSMISSION_COMPLETE = 'TRANSMISSION_COMPLETE',
  FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED',
  ERROR_DETECTED = 'ERROR_DETECTED',
  RESET = 'RESET'
}

export interface StateTransition {
  from: A2ACommState;
  event: A2ACommEvent;
  to: A2ACommState;
  guard?: (context: any) => boolean;
  action?: (context: any) => void;
}

// Final Result Types
export interface OptimizedCommunication {
  optimizedMessage: EnhancedMessage;
  qualityScore: number;
  contextDNA: ContextDNA;
  performanceMetrics: PerformanceMetrics;
  optimizationTrace: OptimizationAction[];
}

export interface TaskContext {
  taskId: string;
  taskType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dependencies: string[];
  deadline?: number;
  resources: string[];
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  validationType: 'SEMANTIC' | 'STRUCTURAL' | 'LOGICAL' | 'PERFORMANCE';
  details: string;
}

export interface EnhancementMetadata {
  processingTime: number;
  algorithmVersion: string;
  confidenceLevel: number;
  qualityGain: number;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: a2a-dspy-001
// inputs: ["design-requirements"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===