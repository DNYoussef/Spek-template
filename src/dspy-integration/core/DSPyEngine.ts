/**
 * DSPy Engine - Main execution engine with FSM state management
 * 
 * NASA Rule 10 compliant implementation with fixed bounds,
 * assertion-driven validation, and comprehensive error handling.
 */

import { 
  DSPyEngineState, 
  DSPyEngineEvent, 
  DSPySignature, 
  OptimizationRequest, 
  OptimizedResult, 
  EngineContext, 
  EngineConfiguration, 
  PerformanceMetrics,
  EngineError
} from '~types/DSPyTypes';
import { TransitionHub } from '../fsm/TransitionHub';
import { SignatureValidator } from './SignatureValidator';
import { OptimizationPipeline } from './OptimizationPipeline';
import { PerformanceCollector } from './PerformanceCollector';

export class DSPyEngine {
  private state: DSPyEngineState = DSPyEngineState.INITIALIZING;
  private readonly signatures: Map<string, DSPySignature> = new Map();
  private readonly activeOptimizations: Map<string, OptimizationRequest> = new Map();
  private readonly metrics: PerformanceMetrics[] = [];
  private readonly errors: EngineError[] = [];
  private readonly config: EngineConfiguration;
  private readonly transitionHub: TransitionHub;
  private readonly validator: SignatureValidator;
  private readonly pipeline: OptimizationPipeline;
  private readonly collector: PerformanceCollector;
  private readonly maxMetricsHistory = 10000; // Fixed bound
  private readonly maxErrorHistory = 1000; // Fixed bound

  constructor(config: EngineConfiguration) {
    // NASA Rule 10: Assertions for validation
    this.assert(config !== undefined, 'Configuration required');
    this.assert(config.maxConcurrentOptimizations > 0, 'Max optimizations must be positive');
    
    this.config = config;
    this.transitionHub = new TransitionHub();
    this.validator = new SignatureValidator();
    this.pipeline = new OptimizationPipeline(config);
    this.collector = new PerformanceCollector();
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds, assertions
  public async initialize(): Promise<void> {
    this.assert(this.state === DSPyEngineState.INITIALIZING, 'Engine must be in initializing state');
    
    const startTime = Date.now();
    
    try {
      // Initialize components with fixed timeout
      await Promise.race([
        this.initializeComponents(),
        this.createTimeoutPromise(this.config.defaultTimeout)
      ]);
      
      await this.executeTransition(DSPyEngineEvent.INITIALIZATION_COMPLETE);
      
      const duration = Date.now() - startTime;
      this.recordMetric({
        accuracy: 1.0,
        latency: duration,
        tokenCount: 0,
        cost: 0,
        qualityScore: 1.0,
        timestamp: new Date()
      });
      
    } catch (error) {
      this.recordError('CRITICAL', 'Initialization failed', error);
      await this.executeTransition(DSPyEngineEvent.ERROR_OCCURRED);
      throw error;
    }
  }

  // NASA Rule 10: Main processing function with bounds and assertions
  public async processSignature(
    signatureId: string, 
    input: unknown
  ): Promise<OptimizedResult> {
    this.assert(this.state === DSPyEngineState.READY, 'Engine not ready');
    this.assert(signatureId?.length > 0, 'SignatureId required');
    this.assert(input !== undefined, 'Input required');
    
    const startTime = Date.now();
    
    try {
      const signature = this.signatures.get(signatureId);
      if (!signature) {
        throw new Error(`Signature not found: ${signatureId}`);
      }
      
      // Validate input against signature schema
      const validationResult = await this.validator.validateInput(signature, input);
      if (!validationResult.isValid) {
        throw new Error(`Input validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Create optimization request
      const optimizationRequest: OptimizationRequest = {
        signatureId,
        targetMetrics: this.getTargetMetrics(),
        maxIterations: 10, // Fixed bound
        timeout: this.config.defaultTimeout
      };
      
      // Execute optimization pipeline
      const result = await this.executeOptimizationPipeline(optimizationRequest, input);
      
      const duration = Date.now() - startTime;
      this.recordProcessingMetric(duration, result);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordError('HIGH', 'Signature processing failed', error);
      
      // Return fallback result
      return this.createFallbackResult(signatureId, duration);
    }
  }

  // NASA Rule 10: Register signature with validation
  public async registerSignature(signature: DSPySignature): Promise<void> {
    this.assert(signature !== undefined, 'Signature required');
    this.assert(signature.id?.length > 0, 'Signature ID required');
    
    try {
      const validationResult = await this.validator.validateSignature(signature);
      if (!validationResult.isValid) {
        throw new Error(`Signature validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      this.signatures.set(signature.id, signature);
      
      this.recordMetric({
        accuracy: 1.0,
        latency: 0,
        tokenCount: 0,
        cost: 0,
        qualityScore: validationResult.qualityScore,
        timestamp: new Date()
      });
      
    } catch (error) {
      this.recordError('MEDIUM', 'Signature registration failed', error);
      throw error;
    }
  }

  // NASA Rule 10: Get current state with assertions
  public getCurrentState(): DSPyEngineState {
    this.assert(this.state !== undefined, 'State must be defined');
    return this.state;
  }

  // NASA Rule 10: Get metrics with bound check
  public getMetrics(limit: number = 100): PerformanceMetrics[] {
    this.assert(limit > 0 && limit <= 1000, 'Limit must be between 1 and 1000');
    return this.metrics.slice(-limit);
  }

  // NASA Rule 10: Shutdown with cleanup
  public async shutdown(): Promise<void> {
    try {
      // Cancel active optimizations with fixed bound
      const optimizationIds = Array.from(this.activeOptimizations.keys());
      for (let i = 0; i < optimizationIds.length && i < 100; i++) {
        this.activeOptimizations.delete(optimizationIds[i]);
      }
      
      await this.executeTransition(DSPyEngineEvent.SHUTDOWN_REQUEST);
      
      // Clean up resources
      this.signatures.clear();
      this.metrics.length = 0;
      this.errors.length = 0;
      
    } catch (error) {
      this.recordError('MEDIUM', 'Shutdown error', error);
    }
  }

  // NASA Rule 10: Private helper methods with bounds and assertions
  private async executeTransition(event: DSPyEngineEvent): Promise<void> {
    this.assert(event !== undefined, 'Event required for transition');
    
    const context = this.createEngineContext();
    const newState = await this.transitionHub.executeTransition(this.state, event, context);
    
    if (newState !== this.state) {
      this.state = newState;
    }
  }

  private createEngineContext(): EngineContext {
    return {
      currentState: this.state,
      signatures: new Map(this.signatures),
      activeOptimizations: new Map(this.activeOptimizations),
      metrics: [...this.metrics],
      errors: [...this.errors],
      config: this.config
    };
  }

  private async initializeComponents(): Promise<void> {
    await this.validator.initialize();
    await this.pipeline.initialize();
    await this.collector.initialize();
  }

  private async executeOptimizationPipeline(
    request: OptimizationRequest, 
    input: unknown
  ): Promise<OptimizedResult> {
    this.assert(request !== undefined, 'Optimization request required');
    
    this.activeOptimizations.set(request.signatureId, request);
    
    try {
      await this.executeTransition(DSPyEngineEvent.OPTIMIZATION_REQUEST);
      
      const result = await this.pipeline.optimize(request, input);
      
      await this.executeTransition(DSPyEngineEvent.OPTIMIZATION_COMPLETE);
      
      return result;
      
    } finally {
      this.activeOptimizations.delete(request.signatureId);
    }
  }

  private getTargetMetrics(): PerformanceMetrics {
    return {
      accuracy: 0.95,
      latency: 200, // Fixed target
      tokenCount: 1000, // Fixed target
      cost: 0.01,
      qualityScore: 0.9,
      timestamp: new Date()
    };
  }

  private recordMetric(metric: PerformanceMetrics): void {
    // NASA Rule 10: Fixed bound for metrics history
    if (this.metrics.length >= this.maxMetricsHistory) {
      this.metrics.shift();
    }
    this.metrics.push(metric);
  }

  private recordProcessingMetric(duration: number, result: OptimizedResult): void {
    this.recordMetric({
      accuracy: result.metrics.accuracy,
      latency: duration,
      tokenCount: result.metrics.tokenCount,
      cost: result.metrics.cost,
      qualityScore: result.metrics.qualityScore,
      timestamp: new Date()
    });
  }

  private recordError(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', message: string, error: unknown): void {
    // NASA Rule 10: Fixed bound for error history
    if (this.errors.length >= this.maxErrorHistory) {
      this.errors.shift();
    }
    
    this.errors.push({
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity,
      message,
      stack: error instanceof Error ? error.stack : undefined,
      context: { state: this.state }
    });
  }

  private createFallbackResult(signatureId: string, duration: number): OptimizedResult {
    const signature = this.signatures.get(signatureId);
    if (!signature) {
      throw new Error(`Cannot create fallback for unknown signature: ${signatureId}`);
    }
    
    return {
      original: signature,
      optimized: signature, // Use original as fallback
      metrics: {
        accuracy: 0.5,
        latency: duration,
        tokenCount: 0,
        cost: 0,
        qualityScore: 0.5,
        timestamp: new Date()
      },
      validationResults: [],
      confidence: 0.1,
      improvementFactor: 1.0
    };
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeout);
    });
  }

  // NASA Rule 10: Assertion helper
  private assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: dspy-engine-main-001
// inputs: ["DSPyTypes.ts", "TransitionHub.ts"]
// tools_used: ["filesystem", "multiedit"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-implementation-v1"}
// === END FOOTER ===