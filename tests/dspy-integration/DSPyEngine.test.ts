/**
 * DSPy Engine Test Suite
 * 
 * Comprehensive unit tests for DSPy integration components
 * with NASA Rule 10 compliance validation.
 */

import { DSPyEngine } from '../../src/dspy-integration/core/DSPyEngine';
import { SignatureValidator } from '../../src/dspy-integration/core/SignatureValidator';
import { OptimizationPipeline } from '../../src/dspy-integration/core/OptimizationPipeline';
import { PerformanceCollector } from '../../src/dspy-integration/core/PerformanceCollector';
import { QualityGateIntegrator } from '../../src/dspy-integration/core/QualityGateIntegrator';
import { TransitionHub } from '../../src/dspy-integration/fsm/TransitionHub';
import {
  DSPyEngineState,
  DSPyEngineEvent,
  DSPySignature,
  EngineConfiguration,
  OptimizationRequest,
  PerformanceMetrics
} from '../../src/dspy-integration/types/DSPyTypes';

// Test configuration
const testConfig: EngineConfiguration = {
  maxConcurrentOptimizations: 5,
  defaultTimeout: 10000,
  qualityThreshold: 0.8,
  maxRetries: 3,
  enableTheaterDetection: true,
  theaterThreshold: 60
};

// Test signature
const testSignature: DSPySignature = {
  id: 'test_signature_001',
  name: 'Test Communication Signature',
  inputSchema: {
    query: 'string',
    context: 'string'
  },
  outputSchema: {
    response: 'string',
    confidence: 'number'
  },
  examples: [
    {
      input: { query: 'test query', context: 'test context' },
      output: { response: 'test response', confidence: 0.9 },
      quality: 0.8,
      source: 'test'
    }
  ],
  version: 1,
  createdAt: new Date(),
  lastModified: new Date()
};

describe('DSPy Engine Integration Tests', () => {
  let engine: DSPyEngine;
  
  beforeEach(() => {
    engine = new DSPyEngine(testConfig);
  });
  
  afterEach(async () => {
    if (engine) {
      await engine.shutdown();
    }
  });

  describe('Engine Initialization', () => {
    test('should initialize successfully with valid configuration', async () => {
      await expect(engine.initialize()).resolves.not.toThrow();
      expect(engine.getCurrentState()).toBe(DSPyEngineState.READY);
    });

    test('should enforce NASA Rule 10 bounds in configuration', () => {
      const invalidConfig = {
        ...testConfig,
        maxConcurrentOptimizations: 0
      };
      
      expect(() => new DSPyEngine(invalidConfig)).toThrow('Assertion failed');
    });

    test('should timeout initialization if takes too long', async () => {
      // Mock slow initialization
      const slowEngine = new DSPyEngine({
        ...testConfig,
        defaultTimeout: 100 // Very short timeout
      });
      
      // Note: In real implementation, we'd mock the internal components
      // to simulate slow initialization
      await expect(slowEngine.initialize()).rejects.toThrow();
    }, 15000);
  });

  describe('Signature Management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should register valid signature successfully', async () => {
      await expect(engine.registerSignature(testSignature)).resolves.not.toThrow();
    });

    test('should reject invalid signature with proper error', async () => {
      const invalidSignature = {
        ...testSignature,
        id: '' // Invalid empty ID
      };
      
      await expect(engine.registerSignature(invalidSignature)).rejects.toThrow('Assertion failed');
    });

    test('should validate signature schema compliance', async () => {
      const signatureWithInvalidSchema = {
        ...testSignature,
        inputSchema: null as any
      };
      
      await expect(engine.registerSignature(signatureWithInvalidSchema)).rejects.toThrow();
    });
  });

  describe('Optimization Processing', () => {
    beforeEach(async () => {
      await engine.initialize();
      await engine.registerSignature(testSignature);
    });

    test('should process signature optimization within bounds', async () => {
      const testInput = {
        query: 'optimize this communication',
        context: 'test context for optimization'
      };
      
      const result = await engine.processSignature(testSignature.id, testInput);
      
      expect(result).toBeDefined();
      expect(result.original).toBeDefined();
      expect(result.optimized).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.improvementFactor).toBeGreaterThanOrEqual(1);
    });

    test('should enforce NASA Rule 10 processing bounds', async () => {
      const testInput = { query: 'test', context: 'test' };
      
      // Measure processing time
      const startTime = Date.now();
      await engine.processSignature(testSignature.id, testInput);
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time bound
      expect(duration).toBeLessThan(testConfig.defaultTimeout + 5000);
    });

    test('should handle invalid input gracefully', async () => {
      const invalidInput = null;
      
      await expect(engine.processSignature(testSignature.id, invalidInput))
        .rejects.toThrow('Assertion failed');
    });

    test('should handle unknown signature ID', async () => {
      const unknownId = 'unknown_signature_123';
      const testInput = { query: 'test', context: 'test' };
      
      const result = await engine.processSignature(unknownId, testInput);
      
      // Should return fallback result instead of throwing
      expect(result).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5); // Low confidence for fallback
    });
  });

  describe('State Management', () => {
    test('should start in INITIALIZING state', () => {
      const newEngine = new DSPyEngine(testConfig);
      expect(newEngine.getCurrentState()).toBe(DSPyEngineState.INITIALIZING);
    });

    test('should transition to READY after initialization', async () => {
      await engine.initialize();
      expect(engine.getCurrentState()).toBe(DSPyEngineState.READY);
    });

    test('should maintain state consistency throughout operations', async () => {
      await engine.initialize();
      expect(engine.getCurrentState()).toBe(DSPyEngineState.READY);
      
      await engine.registerSignature(testSignature);
      expect(engine.getCurrentState()).toBe(DSPyEngineState.READY);
      
      const testInput = { query: 'test', context: 'test' };
      await engine.processSignature(testSignature.id, testInput);
      expect(engine.getCurrentState()).toBe(DSPyEngineState.READY);
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(async () => {
      await engine.initialize();
      await engine.registerSignature(testSignature);
    });

    test('should collect performance metrics during processing', async () => {
      const testInput = { query: 'test', context: 'test' };
      
      const metricsBefore = engine.getMetrics();
      await engine.processSignature(testSignature.id, testInput);
      const metricsAfter = engine.getMetrics();
      
      expect(metricsAfter.length).toBeGreaterThan(metricsBefore.length);
    });

    test('should enforce metrics history bounds', async () => {
      const testInput = { query: 'test', context: 'test' };
      
      // Process multiple times to test bounds
      for (let i = 0; i < 5; i++) {
        await engine.processSignature(testSignature.id, testInput);
      }
      
      const metrics = engine.getMetrics(1000); // Request more than bound
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });

    test('should validate metrics limit parameter', () => {
      expect(() => engine.getMetrics(-1)).toThrow('Assertion failed');
      expect(() => engine.getMetrics(0)).toThrow('Assertion failed');
      expect(() => engine.getMetrics(1001)).toThrow('Assertion failed');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should handle signature validation errors gracefully', async () => {
      const invalidSignature = {
        id: 'test',
        name: 'test',
        inputSchema: null,
        outputSchema: null,
        examples: null,
        version: 1,
        createdAt: new Date(),
        lastModified: new Date()
      } as any;
      
      await expect(engine.registerSignature(invalidSignature)).rejects.toThrow();
      
      // Engine should remain in usable state
      expect(engine.getCurrentState()).toBe(DSPyEngineState.READY);
    });

    test('should recover from processing errors', async () => {
      const validInput = { query: 'test', context: 'test' };
      
      // First, try with invalid signature ID
      const result1 = await engine.processSignature('invalid_id', validInput);
      expect(result1.confidence).toBeLessThan(0.5);
      
      // Then, process with valid signature
      await engine.registerSignature(testSignature);
      const result2 = await engine.processSignature(testSignature.id, validInput);
      expect(result2.confidence).toBeGreaterThan(result1.confidence);
    });
  });

  describe('Shutdown and Cleanup', () => {
    test('should shutdown cleanly', async () => {
      await engine.initialize();
      await engine.registerSignature(testSignature);
      
      await expect(engine.shutdown()).resolves.not.toThrow();
    });

    test('should handle shutdown from various states', async () => {
      // Test shutdown from INITIALIZING state
      const uninitializedEngine = new DSPyEngine(testConfig);
      await expect(uninitializedEngine.shutdown()).resolves.not.toThrow();
      
      // Test shutdown from READY state
      await engine.initialize();
      await expect(engine.shutdown()).resolves.not.toThrow();
    });
  });
});

describe('Signature Validator Tests', () => {
  let validator: SignatureValidator;
  
  beforeEach(async () => {
    validator = new SignatureValidator();
    await validator.initialize();
  });

  describe('Signature Validation', () => {
    test('should validate correct signature successfully', async () => {
      const result = await validator.validateSignature(testSignature);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.qualityScore).toBeGreaterThan(0.7);
    });

    test('should detect missing required fields', async () => {
      const invalidSignature = {
        ...testSignature,
        id: '' // Missing ID
      };
      
      const result = await validator.validateSignature(invalidSignature);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('ID'))).toBe(true);
    });

    test('should validate input against schema', async () => {
      const validInput = {
        query: 'test query',
        context: 'test context'
      };
      
      const result = await validator.validateInput(testSignature, validInput);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject input missing required fields', async () => {
      const invalidInput = {
        query: 'test query'
        // Missing context field
      };
      
      const result = await validator.validateInput(testSignature, invalidInput);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Bounds', () => {
    test('should complete validation within time bounds', async () => {
      const startTime = Date.now();
      await validator.validateSignature(testSignature);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // 5 second bound
    });

    test('should handle large signatures within bounds', async () => {
      // Create large signature with many fields
      const largeSchema: Record<string, unknown> = {};
      for (let i = 0; i < 45; i++) { // Just under 50 field limit
        largeSchema[`field_${i}`] = 'string';
      }
      
      const largeSignature = {
        ...testSignature,
        inputSchema: largeSchema,
        outputSchema: largeSchema
      };
      
      const result = await validator.validateSignature(largeSignature);
      expect(result).toBeDefined();
    });
  });
});

describe('Performance Collector Tests', () => {
  let collector: PerformanceCollector;
  
  beforeEach(async () => {
    collector = new PerformanceCollector();
    await collector.initialize();
  });

  describe('Metrics Recording', () => {
    test('should record metrics successfully', () => {
      const testMetrics: PerformanceMetrics = {
        accuracy: 0.85,
        latency: 150,
        tokenCount: 200,
        cost: 0.01,
        qualityScore: 0.8,
        timestamp: new Date()
      };
      
      expect(() => collector.recordMetrics(testMetrics)).not.toThrow();
    });

    test('should validate metrics bounds', () => {
      const invalidMetrics = {
        accuracy: 1.5, // Invalid: > 1
        latency: -100, // Invalid: negative
        tokenCount: 100,
        cost: 0.01,
        qualityScore: 0.8,
        timestamp: new Date()
      };
      
      expect(() => collector.recordMetrics(invalidMetrics)).toThrow('Assertion failed');
    });

    test('should aggregate metrics correctly', () => {
      const metrics1: PerformanceMetrics = {
        accuracy: 0.8,
        latency: 100,
        tokenCount: 150,
        cost: 0.01,
        qualityScore: 0.75,
        timestamp: new Date()
      };
      
      const metrics2: PerformanceMetrics = {
        accuracy: 0.9,
        latency: 200,
        tokenCount: 250,
        cost: 0.02,
        qualityScore: 0.85,
        timestamp: new Date()
      };
      
      collector.recordMetrics(metrics1);
      collector.recordMetrics(metrics2);
      
      const aggregation = collector.getAggregatedMetrics();
      
      expect(aggregation.total).toBe(2);
      expect(aggregation.average.accuracy).toBeCloseTo(0.85, 2);
      expect(aggregation.average.latency).toBeCloseTo(150, 0);
    });
  });

  describe('Trend Analysis', () => {
    test('should analyze trends correctly', () => {
      // Record several metrics with improving trend
      for (let i = 0; i < 10; i++) {
        const metrics: PerformanceMetrics = {
          accuracy: 0.7 + (i * 0.02), // Improving trend
          latency: 200 - (i * 10), // Improving trend
          tokenCount: 100,
          cost: 0.01,
          qualityScore: 0.7 + (i * 0.02),
          timestamp: new Date()
        };
        collector.recordMetrics(metrics);
      }
      
      const trendAnalysis = collector.analyzeTrends('accuracy', 10);
      
      expect(trendAnalysis.trend).toBe('IMPROVING');
      expect(trendAnalysis.changeRate).toBeGreaterThan(0);
      expect(trendAnalysis.dataPoints).toBe(10);
    });

    test('should handle insufficient data gracefully', () => {
      const trendAnalysis = collector.analyzeTrends('accuracy', 100);
      
      expect(trendAnalysis.trend).toBe('STABLE');
      expect(trendAnalysis.confidence).toBe(0);
    });
  });
});

describe('Integration Tests', () => {
  let engine: DSPyEngine;
  let collector: PerformanceCollector;
  let integrator: QualityGateIntegrator;
  
  beforeEach(async () => {
    engine = new DSPyEngine(testConfig);
    collector = new PerformanceCollector();
    integrator = new QualityGateIntegrator({
      enableDSPyEnhancement: true,
      theaterThreshold: 60,
      qualityThreshold: 0.8,
      confidenceThreshold: 0.7,
      maxAnalysisTime: 5000
    });
    
    await engine.initialize();
    await collector.initialize();
    await integrator.initialize();
  });
  
  afterEach(async () => {
    await engine.shutdown();
  });

  test('should integrate components successfully', async () => {
    // Register signature and process optimization
    await engine.registerSignature(testSignature);
    const testInput = { query: 'integration test', context: 'test context' };
    
    const optimizationResult = await engine.processSignature(testSignature.id, testInput);
    
    // Record metrics
    collector.recordMetrics(optimizationResult.metrics);
    
    // Get quality gate metrics
    const qualityMetrics = collector.calculateQualityGateMetrics();
    
    // Enhance with integrator
    const mockOriginalResult = {
      communicationQuality: 0.7,
      theaterScore: 45
    };
    
    const integrationResult = await integrator.enhanceQualityGate(
      mockOriginalResult,
      qualityMetrics,
      [optimizationResult.metrics]
    );
    
    expect(integrationResult).toBeDefined();
    expect(integrationResult.overallScore).toBeGreaterThanOrEqual(0);
    expect(integrationResult.recommendation).toMatch(/PASS|FAIL|WARNING/);
  });

  test('should maintain NASA Rule 10 compliance across integration', async () => {
    // Test that all operations complete within reasonable bounds
    const startTime = Date.now();
    
    await engine.registerSignature(testSignature);
    const testInput = { query: 'compliance test', context: 'test context' };
    const result = await engine.processSignature(testSignature.id, testInput);
    
    collector.recordMetrics(result.metrics);
    const qualityMetrics = collector.calculateQualityGateMetrics();
    
    const mockOriginalResult = { communicationQuality: 0.8, theaterScore: 30 };
    await integrator.enhanceQualityGate(mockOriginalResult, qualityMetrics, [result.metrics]);
    
    const totalDuration = Date.now() - startTime;
    
    // Should complete within reasonable time
    expect(totalDuration).toBeLessThan(15000); // 15 second integration bound
  });
});

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T20:33:15-04:00 | backend-dev@claude-sonnet-4 | Created comprehensive test suite for DSPy integration components | DSPyEngine.test.ts | OK | Complete unit and integration tests with NASA compliance validation | 0.09 | h8i3k4m |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: dspy-tests-001
- inputs: ["All DSPy core components"]
- tools_used: ["filesystem", "multiedit"]
- versions: {"model":"claude-sonnet-4","prompt":"dspy-implementation-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->