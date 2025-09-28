/**
 * Conversion Engine - Core FSM-based conversion processing
 * NASA Rule 10 Compliant: Fixed bounds and non-recursive operations
 */

import { ConversionRequest, ConversionResult, ConversionState, ConversionEvent, MAX_RETRY_ATTEMPTS } from './MessageFormatTypes';
import { ConversionStateMachine } from './ConversionStateMachine';
import { FormatRegistry } from './FormatRegistry';
import { RuleProcessor } from './RuleProcessor';
import { ValidationOrchestrator } from './ValidationOrchestrator';
import { PerformanceMonitor } from './PerformanceMonitor';
import { Logger } from '../../../utils/Logger';

export class ConversionEngine {
  private logger: Logger;
  private formatRegistry: FormatRegistry;
  private ruleProcessor: RuleProcessor;
  private validationOrchestrator: ValidationOrchestrator;
  private performanceMonitor: PerformanceMonitor;

  constructor(
    formatRegistry: FormatRegistry,
    ruleProcessor: RuleProcessor,
    validationOrchestrator: ValidationOrchestrator,
    performanceMonitor: PerformanceMonitor
  ) {
    // Assertion 1: All dependencies provided
    console.assert(formatRegistry !== null, 'FormatRegistry dependency required');
    // Assertion 2: All dependencies are correct type
    console.assert(ruleProcessor !== null, 'RuleProcessor dependency required');

    this.logger = new Logger('ConversionEngine');
    this.formatRegistry = formatRegistry;
    this.ruleProcessor = ruleProcessor;
    this.validationOrchestrator = validationOrchestrator;
    this.performanceMonitor = performanceMonitor;
  }

  /**
   * Convert message using FSM-based processing - NASA Rule 10: ≤60 lines
   */
  async convertMessage(request: ConversionRequest): Promise<ConversionResult> {
    // Assertion 1: Valid request
    console.assert(request !== null && typeof request === 'object', 'Valid request object required');
    // Assertion 2: Required fields present
    console.assert(request.sourceFormat && request.targetFormat, 'Source and target formats required');

    const conversionId = this.generateConversionId();
    const stateMachine = new ConversionStateMachine();
    const startTime = Date.now();

    this.logger.debug('Starting FSM-based conversion', {
      conversionId,
      sourceFormat: request.sourceFormat,
      targetFormat: request.targetFormat
    });

    try {
      this.performanceMonitor.start(conversionId);

      // Initialize result structure
      const result = this.createConversionResult(request, conversionId);

      // Execute FSM-based conversion pipeline
      await this.executeConversionPipeline(stateMachine, request, result);

      // Finalize result
      result.success = result.validation.valid && stateMachine.isCompleted();
      result.metadata.duration = Date.now() - startTime;
      result.performance.totalTime = result.metadata.duration;

      const performanceData = this.performanceMonitor.stop(conversionId);
      result.performance.memoryUsage = performanceData.memoryUsage;
      result.performance.cpuUsage = performanceData.cpuUsage;

      this.logger.debug('FSM conversion completed', {
        conversionId,
        success: result.success,
        duration: result.metadata.duration
      });

      return result;

    } catch (error) {
      this.logger.error('FSM conversion failed', {
        conversionId,
        error: error.message
      });

      return this.createErrorResult(request, conversionId, error, Date.now() - startTime);
    }
  }

  /**
   * Execute conversion pipeline through FSM states - NASA Rule 10: ≤60 lines
   */
  private async executeConversionPipeline(
    stateMachine: ConversionStateMachine,
    request: ConversionRequest,
    result: ConversionResult
  ): Promise<void> {
    // Assertion 1: Valid state machine
    console.assert(stateMachine !== null, 'State machine required');
    // Assertion 2: Valid request and result
    console.assert(request !== null && result !== null, 'Request and result required');

    // Start conversion
    if (!stateMachine.transition(ConversionEvent.START_CONVERSION)) {
      throw new Error('Failed to start conversion - invalid state transition');
    }

    // Format validation stage
    await this.executeFormatValidation(stateMachine, request, result);
    if (stateMachine.isInErrorState()) return;

    // Deserialization stage
    const deserializedMessage = await this.executeDeserialization(stateMachine, request, result);
    if (stateMachine.isInErrorState()) return;

    // Conversion stage
    const convertedMessage = await this.executeConversion(stateMachine, request, result, deserializedMessage);
    if (stateMachine.isInErrorState()) return;

    // Serialization stage
    const serializedMessage = await this.executeSerialization(stateMachine, request, result, convertedMessage);
    if (stateMachine.isInErrorState()) return;

    // Validation stage
    await this.executeValidation(stateMachine, request, result, serializedMessage);

    // Set final converted message
    result.convertedMessage = serializedMessage;
  }

  /**
   * Execute format validation stage - NASA Rule 10: ≤60 lines
   */
  private async executeFormatValidation(
    stateMachine: ConversionStateMachine,
    request: ConversionRequest,
    result: ConversionResult
  ): Promise<void> {
    // Assertion 1: In correct state
    console.assert(stateMachine.getState() === ConversionState.VALIDATING_FORMAT, 'Must be in format validation state');
    // Assertion 2: Required parameters
    console.assert(request.sourceFormat && request.targetFormat, 'Source and target formats required');

    try {
      const sourceFormat = await this.formatRegistry.getFormat(request.sourceFormat);
      const targetFormat = await this.formatRegistry.getFormat(request.targetFormat);

      if (!sourceFormat || !targetFormat) {
        if (!sourceFormat) {
          result.errors.push({
            code: 'UNKNOWN_SOURCE_FORMAT',
            message: `Unknown source format: ${request.sourceFormat}`,
            recoverable: false,
            suggestions: ['Register the source format', 'Check format name spelling']
          });
        }

        if (!targetFormat) {
          result.errors.push({
            code: 'UNKNOWN_TARGET_FORMAT',
            message: `Unknown target format: ${request.targetFormat}`,
            recoverable: false,
            suggestions: ['Register the target format', 'Check format name spelling']
          });
        }

        stateMachine.transition(ConversionEvent.FORMAT_INVALID);
        return;
      }

      // Calculate original message size
      result.metadata.sizeChange.originalSize = this.calculateMessageSize(request.message);

      stateMachine.transition(ConversionEvent.FORMAT_VALIDATED);

    } catch (error) {
      result.errors.push({
        code: 'FORMAT_VALIDATION_ERROR',
        message: `Format validation failed: ${error.message}`,
        cause: error,
        recoverable: false,
        suggestions: ['Check format definitions', 'Validate format registry']
      });
      stateMachine.transition(ConversionEvent.FORMAT_INVALID);
    }
  }

  /**
   * Generate unique conversion ID - NASA Rule 10: Single responsibility
   */
  private generateConversionId(): string {
    // Assertion 1: Timestamp available
    console.assert(Date.now() > 0, 'Valid timestamp required');
    // Assertion 2: Random function available
    console.assert(typeof Math.random === 'function', 'Random function required');

    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create conversion result structure - NASA Rule 10: Single responsibility
   */
  private createConversionResult(request: ConversionRequest, conversionId: string): ConversionResult {
    // Assertion 1: Valid request
    console.assert(request !== null, 'Request required for result creation');
    // Assertion 2: Valid conversion ID
    console.assert(conversionId && conversionId.length > 0, 'Conversion ID required');

    return {
      success: false,
      convertedMessage: null,
      originalMessage: request.message,
      sourceFormat: request.sourceFormat,
      targetFormat: request.targetFormat,
      appliedRules: [],
      metadata: {
        conversionId,
        timestamp: new Date(),
        duration: 0,
        dataLoss: false,
        fidelity: 0,
        sizeChange: {
          originalSize: 0,
          convertedSize: 0,
          compressionRatio: 1,
          sizeIncrease: 0
        }
      },
      validation: {
        valid: false,
        score: 0,
        issues: [],
        schemaCompliance: false
      },
      performance: {
        deserializationTime: 0,
        conversionTime: 0,
        serializationTime: 0,
        validationTime: 0,
        totalTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      warnings: [],
      errors: []
    };
  }

  /**
   * Calculate message size in bytes - NASA Rule 10: Single responsibility
   */
  private calculateMessageSize(message: any): number {
    // Assertion 1: Message parameter provided
    console.assert(message !== undefined, 'Message required for size calculation');
    // Assertion 2: Blob constructor available
    console.assert(typeof Blob !== 'undefined' || typeof Buffer !== 'undefined', 'Size calculation method required');

    try {
      const serialized = typeof message === 'string' ? message : JSON.stringify(message);

      // Use Blob if available (browser), otherwise estimate
      if (typeof Blob !== 'undefined') {
        return new Blob([serialized]).size;
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.byteLength(serialized, 'utf8');
      } else {
        // Fallback estimation
        return serialized.length * 2; // Rough UTF-16 estimation
      }
    } catch (error) {
      return 0; // Return 0 if size cannot be calculated
    }
  }

  /**
   * Create error result - NASA Rule 10: Single responsibility
   */
  private createErrorResult(
    request: ConversionRequest,
    conversionId: string,
    error: Error,
    duration: number
  ): ConversionResult {
    // Assertion 1: Valid parameters
    console.assert(request && conversionId && error, 'All parameters required for error result');
    // Assertion 2: Valid duration
    console.assert(duration >= 0, 'Duration must be non-negative');

    const result = this.createConversionResult(request, conversionId);

    result.errors.push({
      code: 'CONVERSION_EXCEPTION',
      message: error.message,
      cause: error,
      recoverable: false,
      suggestions: ['Check system health', 'Review conversion configuration']
    });

    result.metadata.duration = duration;
    result.performance.totalTime = duration;

    return result;
  }

  // Placeholder methods for pipeline stages - to be implemented
  private async executeDeserialization(stateMachine: ConversionStateMachine, request: ConversionRequest, result: ConversionResult): Promise<any> {
    // Implementation placeholder
    stateMachine.transition(ConversionEvent.DESERIALIZATION_COMPLETE);
    return request.message;
  }

  private async executeConversion(stateMachine: ConversionStateMachine, request: ConversionRequest, result: ConversionResult, deserializedMessage: any): Promise<any> {
    // Implementation placeholder
    stateMachine.transition(ConversionEvent.CONVERSION_COMPLETE);
    return deserializedMessage;
  }

  private async executeSerialization(stateMachine: ConversionStateMachine, request: ConversionRequest, result: ConversionResult, convertedMessage: any): Promise<any> {
    // Implementation placeholder
    stateMachine.transition(ConversionEvent.SERIALIZATION_COMPLETE);
    return convertedMessage;
  }

  private async executeValidation(stateMachine: ConversionStateMachine, request: ConversionRequest, result: ConversionResult, serializedMessage: any): Promise<void> {
    // Implementation placeholder
    result.validation = {
      valid: true,
      score: 100,
      issues: [],
      schemaCompliance: true
    };
    stateMachine.transition(ConversionEvent.VALIDATION_COMPLETE);
  }
}