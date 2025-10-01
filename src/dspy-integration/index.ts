/**
 * DSPy Integration System - Main Export Index
 * 
 * NASA Rule 10 compliant DSPy integration system for SPEK platform
 * with communication optimization, A/B testing, and theater detection.
 */

// Core Components
export { DSPyEngine } from './core/DSPyEngine';
export { SignatureValidator } from './core/SignatureValidator';
export { OptimizationPipeline } from './core/OptimizationPipeline';
export { PerformanceCollector } from './core/PerformanceCollector';
export { QualityGateIntegrator } from './core/QualityGateIntegrator';

// FSM Components
export { TransitionHub } from './fsm/TransitionHub';

// Integration Components
export { SPEKTheaterIntegration } from './integration/SPEKTheaterIntegration';

// Type Definitions
export {
  // Engine Types
  DSPyEngineState,
  DSPyEngineEvent,
  OptimizationStatus,
  ValidationOutcome,
  EngineConfiguration,
  EngineContext,
  EngineError,
  
  // Signature Types
  DSPySignature,
  SignatureExample,
  OptimizationRequest,
  OptimizedResult,
  
  // Performance Types
  PerformanceMetrics,
  ValidationResult,
  
  // FSM Types
  StateTransition,
  
  // Quality Gate Types
  QualityGateMetrics,
  TheaterDetectionResult,
  TheaterPattern,
  
  // A/B Testing Types
  ABTestConfiguration,
  ABTestResult,
  SuccessCriteria
} from '~types/DSPyTypes';

// Validation Types
export {
  ValidationResult as SignatureValidationResult,
  ValidationMetrics
} from './core/SignatureValidator';

// Optimization Types
export {
  OptimizationMetrics,
  OptimizationContext,
  IterationResult
} from './core/OptimizationPipeline';

// Performance Types
export {
  MetricsAggregation,
  TimeRange,
  MetricsFilter,
  TrendAnalysis,
  PerformanceAlert,
  PerformanceSummary
} from './core/PerformanceCollector';

// Integration Types (from types file, not implementation)
export type {
  IntegrationResult,
  QualityEnhancement,
  TheaterIntegrationConfig
} from '../integration/SPEKTheaterIntegration';

export {
  IntegrationConfiguration,
  QualityGateMapping,
  PerformanceThresholds,
  EnhancedGateResult,
  IntegrationMetrics,
  IntegrationStatistics
} from './integration/SPEKTheaterIntegration';

// Constants and Defaults
export const DEFAULT_ENGINE_CONFIG: EngineConfiguration = {
  maxConcurrentOptimizations: 5,
  defaultTimeout: 10000,
  qualityThreshold: 0.8,
  maxRetries: 3,
  enableTheaterDetection: true,
  theaterThreshold: 60
};

export const DEFAULT_THEATER_INTEGRATION_CONFIG: TheaterIntegrationConfig = {
  enableDSPyEnhancement: true,
  theaterThreshold: 60,
  qualityThreshold: 0.8,
  confidenceThreshold: 0.7,
  maxAnalysisTime: 5000
};

export const DEFAULT_INTEGRATION_CONFIG: IntegrationConfiguration = {
  enableDSPyEnhancement: true,
  qualityGateMapping: {
    'communication-quality': 'dspy_communication_quality',
    'optimization-effectiveness': 'dspy_optimization_effectiveness', 
    'theater-detection': 'dspy_theater_detection_score',
    'context-relevance': 'dspy_context_relevance',
    'performance-improvement': 'dspy_performance_improvement'
  },
  performanceThresholds: {
    minAccuracy: 0.8,
    maxLatency: 200,
    minQualityScore: 0.75,
    maxCost: 0.05,
    maxTokenCount: 1500
  },
  maxIntegrationTime: 10000
};

// Utility Functions
export const DSPyUtils = {
  /**
   * Create a basic DSPy signature template
   */
  createSignatureTemplate(id: string, name: string): Partial<DSPySignature> {
    return {
      id,
      name,
      inputSchema: {},
      outputSchema: {},
      examples: [],
      version: 1,
      createdAt: new Date(),
      lastModified: new Date()
    };
  },

  /**
   * Validate performance metrics bounds
   */
  validateMetricsBounds(metrics: PerformanceMetrics): boolean {
    return (
      metrics.accuracy >= 0 && metrics.accuracy <= 1 &&
      metrics.latency >= 0 &&
      metrics.tokenCount >= 0 &&
      metrics.cost >= 0 &&
      metrics.qualityScore >= 0 && metrics.qualityScore <= 1
    );
  },

  /**
   * Calculate improvement percentage
   */
  calculateImprovementPercentage(baseline: number, optimized: number): number {
    if (baseline === 0) return 0;
    return ((optimized - baseline) / baseline) * 100;
  },

  /**
   * Generate cache key for integration results
   */
  generateIntegrationCacheKey(projectName: string, domain: string, metricsHash: string): string {
    return `${projectName}_${domain}_${metricsHash}`;
  },

  /**
   * Check if theater score indicates acceptable quality
   */
  isTheaterScoreAcceptable(score: number, threshold: number = 60): boolean {
    return score < threshold;
  }
};

// Version Information
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();
export const NASA_COMPLIANCE = 'Rule 10 Compliant';
export const SPEK_COMPATIBLE = true;

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: dspy-index-export-001
// inputs: ["All DSPy components", "Type definitions", "Configuration defaults"]
// tools_used: ["filesystem", "multiedit"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-implementation-v1"}
// === END FOOTER ===