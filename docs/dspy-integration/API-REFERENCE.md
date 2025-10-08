# DSPy Integration API Reference

Comprehensive API documentation for DSPy integration components with NASA Rule 10 compliance.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Type Definitions](#type-definitions)
- [Usage Examples](#usage-examples)
- [Performance Guidelines](#performance-guidelines)
- [Error Handling](#error-handling)
- [Integration Patterns](#integration-patterns)

## Overview

The DSPy Integration system provides communication optimization and A/B testing capabilities for the SPEK platform. All components follow NASA Rule 10 guidelines with fixed bounds, comprehensive assertions, and error recovery.

### Key Features

- **FSM-based State Management**: Centralized state transitions with validation
- **NASA Rule 10 Compliance**: Fixed bounds, assertions, and error handling
- **A/B Testing Framework**: Statistical validation of optimizations
- **Theater Detection Integration**: Enhanced detection with existing SPEK system
- **Performance Monitoring**: Real-time metrics collection and analysis

## Core Components

### DSPyEngine

Main execution engine with FSM state management.

```typescript
import { DSPyEngine, EngineConfiguration } from './src/dspy-integration/core/DSPyEngine';

const config: EngineConfiguration = {
  maxConcurrentOptimizations: 5,
  defaultTimeout: 10000,
  qualityThreshold: 0.8,
  maxRetries: 3,
  enableTheaterDetection: true,
  theaterThreshold: 60
};

const engine = new DSPyEngine(config);
await engine.initialize();
```

#### Methods

##### `initialize(): Promise<void>`
Initializes the engine and all components.
- **Throws**: Error if initialization fails or times out
- **Compliance**: 5 second timeout bound, state validation

##### `registerSignature(signature: DSPySignature): Promise<void>`
Registers a communication signature for optimization.
- **Parameters**: `signature` - DSPy signature with input/output schemas
- **Throws**: Error if signature validation fails
- **Compliance**: Schema validation with bounds checking

##### `processSignature(signatureId: string, input: unknown): Promise<OptimizedResult>`
Processes signature optimization with A/B testing.
- **Parameters**: 
  - `signatureId` - Registered signature identifier
  - `input` - Input data matching signature schema
- **Returns**: Optimization result with metrics
- **Compliance**: Fixed timeout bounds, fallback on errors

##### `getCurrentState(): DSPyEngineState`
Returns current FSM state.
- **Returns**: Current engine state enum
- **Compliance**: State validation assertion

##### `getMetrics(limit?: number): PerformanceMetrics[]`
Returns performance metrics history.
- **Parameters**: `limit` - Maximum metrics to return (1-1000)
- **Returns**: Array of performance metrics
- **Compliance**: Fixed bound validation

##### `shutdown(): Promise<void>`
Cleanly shuts down engine and releases resources.
- **Compliance**: Resource cleanup with bounds

### SignatureValidator

Schema validation and type safety engine.

```typescript
import { SignatureValidator } from './src/dspy-integration/core/SignatureValidator';

const validator = new SignatureValidator();
await validator.initialize();

const result = await validator.validateSignature(signature);
if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}
```

#### Methods

##### `validateSignature(signature: DSPySignature): Promise<ValidationResult>`
Validates signature structure and schema.
- **Parameters**: `signature` - DSPy signature to validate
- **Returns**: Validation result with errors and quality score
- **Compliance**: 5ms execution bound, fixed error limits

##### `validateInput(signature: DSPySignature, input: unknown): Promise<ValidationResult>`
Validates input against signature schema.
- **Parameters**: 
  - `signature` - Target signature
  - `input` - Input data to validate
- **Returns**: Validation result
- **Compliance**: Type checking with bounds

##### `validateOutput(signature: DSPySignature, output: unknown): Promise<ValidationResult>`
Validates output against signature schema.
- **Parameters**: 
  - `signature` - Target signature
  - `output` - Output data to validate
- **Returns**: Validation result
- **Compliance**: Schema matching with bounds

### OptimizationPipeline

Communication optimization with A/B testing.

```typescript
import { OptimizationPipeline } from './src/dspy-integration/core/OptimizationPipeline';

const pipeline = new OptimizationPipeline(config);
await pipeline.initialize();

const result = await pipeline.optimize(request, input);
console.log('Improvement factor:', result.improvementFactor);
```

#### Methods

##### `optimize(request: OptimizationRequest, input: unknown): Promise<OptimizedResult>`
Executes optimization with A/B testing validation.
- **Parameters**: 
  - `request` - Optimization configuration
  - `input` - Test input data
- **Returns**: Optimization result with validation
- **Compliance**: 30s timeout bound, 20 iteration limit

##### `runABTest(baseline: DSPySignature, optimized: DSPySignature, testInput: unknown): Promise<ABTestResult>`
Executes A/B test comparison.
- **Parameters**: 
  - `baseline` - Original signature
  - `optimized` - Optimized signature
  - `testInput` - Test data
- **Returns**: A/B test results with statistical significance
- **Compliance**: Fixed sample bounds, timeout limits

### PerformanceCollector

Metrics collection and analysis.

```typescript
import { PerformanceCollector } from './src/dspy-integration/core/PerformanceCollector';

const collector = new PerformanceCollector();
await collector.initialize();

collector.recordMetrics(metrics, 'signature_001');
const aggregation = collector.getAggregatedMetrics();
```

#### Methods

##### `recordMetrics(metrics: PerformanceMetrics, signatureId?: string): void`
Records performance metrics.
- **Parameters**: 
  - `metrics` - Performance metrics to record
  - `signatureId` - Optional signature identifier
- **Compliance**: Bounds validation, alert checking

##### `getAggregatedMetrics(filter?: MetricsFilter): MetricsAggregation`
Returns aggregated metrics with statistical analysis.
- **Parameters**: `filter` - Optional filtering criteria
- **Returns**: Comprehensive metrics aggregation
- **Compliance**: Caching with size bounds

##### `analyzeTrends(metric: keyof PerformanceMetrics, windowSize?: number): TrendAnalysis`
Analyzes metric trends over time.
- **Parameters**: 
  - `metric` - Metric to analyze
  - `windowSize` - Analysis window (1-1000)
- **Returns**: Trend analysis with confidence
- **Compliance**: Fixed window bounds

##### `calculateQualityGateMetrics(filter?: MetricsFilter): QualityGateMetrics`
Calculates quality gate metrics for integration.
- **Parameters**: `filter` - Optional filtering criteria
- **Returns**: Quality gate metrics
- **Compliance**: Fallback on calculation errors

### QualityGateIntegrator

Integration with existing SPEK theater detection.

```typescript
import { QualityGateIntegrator } from './src/dspy-integration/core/QualityGateIntegrator';

const integrator = new QualityGateIntegrator({
  enableDSPyEnhancement: true,
  theaterThreshold: 60,
  qualityThreshold: 0.8,
  confidenceThreshold: 0.7,
  maxAnalysisTime: 5000
});

const enhanced = await integrator.enhanceQualityGate(
  originalResult,
  dspyMetrics,
  performanceHistory
);
```

#### Methods

##### `enhanceQualityGate(originalResult: any, dspyMetrics: QualityGateMetrics, performanceMetrics: PerformanceMetrics[]): Promise<IntegrationResult>`
Enhances existing quality gate with DSPy metrics.
- **Parameters**: 
  - `originalResult` - Original SPEK gate result
  - `dspyMetrics` - DSPy quality metrics
  - `performanceMetrics` - Performance history
- **Returns**: Enhanced integration result
- **Compliance**: Timeout bounds, pattern analysis limits

##### `performEnhancedTheaterDetection(originalResult: any, dspyMetrics: QualityGateMetrics, performanceMetrics: PerformanceMetrics[]): Promise<TheaterDetectionResult>`
Executes enhanced theater detection.
- **Parameters**: Same as enhanceQualityGate
- **Returns**: Theater detection result with patterns
- **Compliance**: Pattern detection bounds

## Type Definitions

### Core Types

```typescript
// Engine states
enum DSPyEngineState {
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  LEARNING = 'LEARNING',
  OPTIMIZING = 'OPTIMIZING',
  VALIDATING = 'VALIDATING',
  DEPLOYING = 'DEPLOYING',
  MONITORING = 'MONITORING',
  ERROR_RECOVERY = 'ERROR_RECOVERY'
}

// Performance metrics
interface PerformanceMetrics {
  readonly accuracy: number; // 0-1
  readonly latency: number; // milliseconds
  readonly tokenCount: number;
  readonly cost: number; // USD
  readonly qualityScore: number; // 0-1
  readonly timestamp: Date;
}

// Signature definition
interface DSPySignature {
  readonly id: string;
  readonly name: string;
  readonly inputSchema: Record<string, unknown>;
  readonly outputSchema: Record<string, unknown>;
  readonly examples: SignatureExample[];
  readonly version: number;
  readonly createdAt: Date;
  readonly lastModified: Date;
}
```

### Validation Types

```typescript
interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly qualityScore: number;
  readonly metrics: ValidationMetrics;
}

interface ValidationMetrics {
  readonly schemaCompliance: number;
  readonly exampleQuality: number;
  readonly typeConsistency: number;
  readonly completeness: number;
  readonly executionTime: number;
}
```

### Quality Gate Types

```typescript
interface QualityGateMetrics {
  readonly communicationQuality: number;
  readonly optimizationEffectiveness: number;
  readonly theaterDetectionScore: number; // 0-100, lower is better
  readonly contextRelevance: number;
  readonly performanceImprovement: number;
}

interface TheaterDetectionResult {
  readonly score: number; // 0-100, lower is better
  readonly patterns: TheaterPattern[];
  readonly confidence: number;
  readonly recommendation: string;
}
```

## Usage Examples

### Basic Optimization Workflow

```typescript
import { 
  DSPyEngine, 
  EngineConfiguration, 
  DSPySignature 
} from './src/dspy-integration';

// 1. Configure engine
const config: EngineConfiguration = {
  maxConcurrentOptimizations: 3,
  defaultTimeout: 15000,
  qualityThreshold: 0.85,
  maxRetries: 2,
  enableTheaterDetection: true,
  theaterThreshold: 50
};

// 2. Initialize engine
const engine = new DSPyEngine(config);
await engine.initialize();

// 3. Define signature
const signature: DSPySignature = {
  id: 'customer_support_v1',
  name: 'Customer Support Response',
  inputSchema: {
    customerQuery: 'string',
    context: 'string',
    priority: 'number'
  },
  outputSchema: {
    response: 'string',
    confidence: 'number',
    escalationNeeded: 'boolean'
  },
  examples: [
    {
      input: {
        customerQuery: 'My order is delayed',
        context: 'Standard shipping selected',
        priority: 2
      },
      output: {
        response: 'I understand your concern about the delayed order...',
        confidence: 0.9,
        escalationNeeded: false
      },
      quality: 0.85,
      source: 'training_data'
    }
  ],
  version: 1,
  createdAt: new Date(),
  lastModified: new Date()
};

// 4. Register signature
await engine.registerSignature(signature);

// 5. Process optimization
const input = {
  customerQuery: 'I need help with my account',
  context: 'Premium customer',
  priority: 1
};

const result = await engine.processSignature(signature.id, input);

console.log('Optimization Results:');
console.log('- Improvement Factor:', result.improvementFactor);
console.log('- Confidence:', result.confidence);
console.log('- Quality Score:', result.metrics.qualityScore);

// 6. Clean shutdown
await engine.shutdown();
```

### Advanced Integration with SPEK

```typescript
import {
  DSPyEngine,
  PerformanceCollector,
  QualityGateIntegrator,
  SPEKTheaterIntegration
} from './src/dspy-integration';

// Initialize components
const engine = new DSPyEngine(config);
const collector = new PerformanceCollector();
const integrator = new QualityGateIntegrator({
  enableDSPyEnhancement: true,
  theaterThreshold: 60,
  qualityThreshold: 0.8,
  confidenceThreshold: 0.7,
  maxAnalysisTime: 5000
});

const spekIntegration = new SPEKTheaterIntegration(
  {
    enableDSPyEnhancement: true,
    qualityGateMapping: {
      'communication-quality': 'dspy_comm_quality',
      'optimization-effectiveness': 'dspy_opt_effectiveness',
      'theater-detection': 'dspy_theater_score',
      'context-relevance': 'dspy_context_relevance',
      'performance-improvement': 'dspy_perf_improvement'
    },
    performanceThresholds: {
      minAccuracy: 0.8,
      maxLatency: 200,
      minQualityScore: 0.75,
      maxCost: 0.05,
      maxTokenCount: 1000
    },
    maxIntegrationTime: 10000
  },
  integrator,
  collector
);

// Initialize all components
await Promise.all([
  engine.initialize(),
  collector.initialize(),
  integrator.initialize(),
  spekIntegration.initialize()
]);

// Register and optimize signatures
await engine.registerSignature(signature);
const optimizationResult = await engine.processSignature(signature.id, input);

// Record performance metrics
collector.recordMetrics(optimizationResult.metrics, signature.id);

// Get quality gate metrics
const qualityMetrics = collector.calculateQualityGateMetrics();

// Execute enhanced quality gate processing
const projectOptions = {
  project: { name: 'Customer Support Optimization' },
  domain: 'customer_service',
  codebase: { files: [] }
};

const enhancedResult = await spekIntegration.processEnhancedQualityGate(
  projectOptions,
  qualityMetrics,
  [optimizationResult.metrics]
);

console.log('Enhanced Quality Gate Results:');
console.log('- Combined Score:', enhancedResult.combinedScore);
console.log('- Recommendation:', enhancedResult.recommendation);
console.log('- Theater Score:', enhancedResult.theaterAnalysis.score);
console.log('- Integration Time:', enhancedResult.integrationMetrics.totalIntegrationTime, 'ms');

// Get integration statistics
const stats = spekIntegration.getIntegrationStatistics();
console.log('Integration Statistics:', stats);
```

### Performance Monitoring

```typescript
import { PerformanceCollector } from './src/dspy-integration';

const collector = new PerformanceCollector();
await collector.initialize();

// Record metrics from multiple signatures
for (const signature of signatures) {
  const result = await engine.processSignature(signature.id, testInput);
  collector.recordMetrics(result.metrics, signature.id);
}

// Analyze trends
const accuracyTrend = collector.analyzeTrends('accuracy', 50);
const latencyTrend = collector.analyzeTrends('latency', 50);

console.log('Trends Analysis:');
console.log('- Accuracy Trend:', accuracyTrend.trend, 'Change Rate:', accuracyTrend.changeRate);
console.log('- Latency Trend:', latencyTrend.trend, 'Change Rate:', latencyTrend.changeRate);

// Get aggregated metrics with filtering
const recentMetrics = collector.getAggregatedMetrics({
  startTime: new Date(Date.now() - 3600000), // Last hour
  minQualityScore: 0.7
});

console.log('Recent Performance:');
console.log('- Average Quality:', recentMetrics.average.qualityScore);
console.log('- P95 Latency:', recentMetrics.percentile95.latency, 'ms');
console.log('- Total Samples:', recentMetrics.total);

// Check for alerts
const criticalAlerts = collector.getActiveAlerts('CRITICAL');
if (criticalAlerts.length > 0) {
  console.warn('Critical Performance Alerts:');
  criticalAlerts.forEach(alert => {
    console.warn(`- ${alert.metric}: ${alert.actualValue} (threshold: ${alert.threshold})`);
  });
}

// Clean up old data
const removed = collector.clearOldData(24 * 60 * 60 * 1000); // 24 hours
console.log('Removed', removed, 'old metric entries');
```

## Performance Guidelines

### Bounds and Limits

All components enforce NASA Rule 10 compliance with fixed bounds:

- **Function Length**: Maximum 60 lines per function
- **Loop Bounds**: All loops have fixed maximum iterations
- **Timeout Limits**: All async operations have timeout bounds
- **Memory Bounds**: Fixed limits on cache sizes and history retention
- **Assertion Requirements**: Minimum 2 assertions per function

### Recommended Thresholds

```typescript
// Engine Configuration
const productionConfig: EngineConfiguration = {
  maxConcurrentOptimizations: 5,    // Balance throughput vs resources
  defaultTimeout: 10000,            // 10 second timeout
  qualityThreshold: 0.8,            // 80% quality minimum
  maxRetries: 3,                    // Reasonable retry limit
  enableTheaterDetection: true,     // Always enable in production
  theaterThreshold: 60              // Moderate theater sensitivity
};

// Performance Thresholds
const performanceThresholds = {
  minAccuracy: 0.85,               // 85% accuracy minimum
  maxLatency: 200,                 // 200ms latency maximum
  minQualityScore: 0.8,            // 80% quality minimum
  maxCost: 0.02,                   // 2 cents per operation
  maxTokenCount: 1500              // Token efficiency limit
};
```

### Optimization Best Practices

1. **Signature Design**:
   - Keep input/output schemas under 50 fields
   - Provide 5-10 high-quality examples
   - Use descriptive field names and types

2. **Performance Monitoring**:
   - Record metrics for all optimizations
   - Monitor trends over time
   - Set up alerts for performance degradation

3. **A/B Testing**:
   - Use minimum 100 samples for statistical significance
   - Set confidence threshold to 95%
   - Monitor for regression during rollout

4. **Theater Detection**:
   - Enable enhanced detection in production
   - Review patterns regularly
   - Investigate high theater scores

## Error Handling

### Error Categories

1. **Validation Errors**: Schema mismatches, invalid inputs
2. **Timeout Errors**: Operations exceeding bounds
3. **Performance Errors**: Metrics below thresholds
4. **Integration Errors**: SPEK system failures
5. **System Errors**: Resource exhaustion, network failures

### Error Recovery Patterns

```typescript
// Graceful degradation example
try {
  const result = await engine.processSignature(signatureId, input);
  return result;
} catch (error) {
  if (error.message.includes('timeout')) {
    // Return cached result or fallback
    return await getFallbackResult(signatureId, input);
  } else if (error.message.includes('validation')) {
    // Fix input and retry
    const fixedInput = await fixInputValidation(input, signature);
    return await engine.processSignature(signatureId, fixedInput);
  } else {
    // Log error and return safe default
    console.error('Optimization failed:', error);
    return createSafeDefaultResult(signatureId);
  }
}
```

### Monitoring and Alerts

```typescript
// Set up performance monitoring
const collector = new PerformanceCollector();

// Check alerts periodically
setInterval(() => {
  const criticalAlerts = collector.getActiveAlerts('CRITICAL');
  if (criticalAlerts.length > 0) {
    notifyOperationsTeam(criticalAlerts);
  }
  
  const summary = collector.getPerformanceSummary();
  if (summary.healthStatus === 'CRITICAL') {
    triggerEmergencyProtocol(summary);
  }
}, 60000); // Check every minute
```

## Integration Patterns

### Gradual Rollout

```typescript
// Implement gradual rollout of optimizations
class GradualRolloutManager {
  private rolloutPercentage = 0;
  
  async processWithRollout(signature: string, input: any): Promise<any> {
    const useOptimized = Math.random() < (this.rolloutPercentage / 100);
    
    if (useOptimized) {
      return await engine.processSignature(signature, input);
    } else {
      return await processWithBaseline(signature, input);
    }
  }
  
  increaseRollout(percentage: number): void {
    this.rolloutPercentage = Math.min(100, this.rolloutPercentage + percentage);
  }
}
```

### Circuit Breaker

```typescript
// Implement circuit breaker for reliability
class OptimizationCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > 60000) { // 1 minute
        this.state = 'HALF_OPEN';
      } else {
        return await fallback();
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return await fallback();
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= 5) {
      this.state = 'OPEN';
    }
  }
}
```

---

*Generated with DSPy Integration System v1.0.0*
*NASA Rule 10 Compliant | Production Ready | SPEK Enhanced*

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T20:36:52-04:00 | backend-dev@claude-sonnet-4 | Created comprehensive API reference documentation | API-REFERENCE.md | OK | Complete documentation with examples, best practices, NASA compliance guidelines | 0.11 | m8n7p5q |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: dspy-docs-api-001
- inputs: ["All DSPy integration components", "API interfaces"]
- tools_used: ["filesystem", "multiedit"]
- versions: {"model":"claude-sonnet-4","prompt":"dspy-implementation-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->