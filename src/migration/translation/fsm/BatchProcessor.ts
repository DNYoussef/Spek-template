/**
 * Batch Processor - FSM component for batch conversion operations
 * NASA Rule 10 Compliant: Fixed bounds and non-recursive operations
 */

import {
  BatchConversionRequest,
  BatchConversionResult,
  ConversionResult,
  BatchConversionSummary,
  MAX_BATCH_SIZE,
  MAX_PARALLEL_CHUNKS
} from './MessageFormatTypes';
import { ConversionEngine } from './ConversionEngine';
import { Logger } from '../../../utils/Logger';

export class BatchProcessor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('BatchProcessor');
  }

  /**
   * Process batch conversion - NASA Rule 10: ≤60 lines
   */
  async processBatch(
    request: BatchConversionRequest,
    conversionEngine: ConversionEngine
  ): Promise<BatchConversionResult> {
    // Assertion 1: Valid request
    console.assert(request !== null && Array.isArray(request.messages), 'Valid batch request required');
    // Assertion 2: Valid conversion engine
    console.assert(conversionEngine !== null, 'Conversion engine required');

    const startTime = Date.now();
    const results: ConversionResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    this.logger.info('Starting batch conversion', {
      messageCount: request.messages.length,
      parallelism: request.options.parallelism
    });

    try {
      // NASA Rule 10: Enforce batch size limits
      const batchSize = Math.min(request.messages.length, MAX_BATCH_SIZE);
      const messagesToProcess = request.messages.slice(0, batchSize);

      if (request.options.parallelism > 1) {
        await this.processParallel(messagesToProcess, request.options, conversionEngine, results);
      } else {
        await this.processSequential(messagesToProcess, request.options, conversionEngine, results);
      }

      // Sort results to preserve order if requested
      if (request.options.preserveOrder && results.length <= MAX_BATCH_SIZE) {
        this.sortResultsByOrder(results, messagesToProcess);
      }

      successCount = results.filter(r => r.success).length;
      failureCount = results.filter(r => !r.success).length;

      const summary = await this.generateBatchSummary(results, Date.now() - startTime);

      return {
        success: failureCount === 0 || !request.options.stopOnError,
        totalMessages: messagesToProcess.length,
        successfulConversions: successCount,
        failedConversions: failureCount,
        results,
        summary
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Batch conversion failed', { error: errorMessage });

      const summary = await this.generateBatchSummary(results, Date.now() - startTime);

      return {
        success: false,
        totalMessages: request.messages.length,
        successfulConversions: successCount,
        failedConversions: failureCount,
        results,
        summary
      };
    }
  }

  /**
   * Process messages in parallel - NASA Rule 10: ≤60 lines
   */
  private async processParallel(
    messages: any[],
    options: any,
    conversionEngine: ConversionEngine,
    results: ConversionResult[]
  ): Promise<void> {
    // Assertion 1: Valid parameters
    console.assert(Array.isArray(messages) && conversionEngine, 'Valid messages and engine required');
    // Assertion 2: Parallelism bounds
    const parallelism = Math.min(options.parallelism, MAX_PARALLEL_CHUNKS);
    console.assert(parallelism > 0, 'Parallelism must be positive');

    const chunks = this.chunkArray(messages, parallelism);

    // NASA Rule 10: Fixed loop bounds
    for (let chunkIndex = 0; chunkIndex < Math.min(chunks.length, MAX_PARALLEL_CHUNKS); chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const chunkPromises = chunk.map(conversionRequest =>
        conversionEngine.convertMessage(conversionRequest)
          .catch(error => this.createFailedResult(conversionRequest, error))
      );

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      if (options.stopOnError && chunkResults.some(r => !r.success)) {
        break;
      }
    }
  }

  /**
   * Process messages sequentially - NASA Rule 10: ≤60 lines
   */
  private async processSequential(
    messages: any[],
    options: any,
    conversionEngine: ConversionEngine,
    results: ConversionResult[]
  ): Promise<void> {
    // Assertion 1: Valid parameters
    console.assert(Array.isArray(messages) && conversionEngine, 'Valid messages and engine required');
    // Assertion 2: Sequential processing bounds
    const maxProcessCount = Math.min(messages.length, MAX_BATCH_SIZE);
    console.assert(maxProcessCount >= 0, 'Process count must be non-negative');

    // NASA Rule 10: Fixed sequential processing loop
    for (let messageIndex = 0; messageIndex < maxProcessCount; messageIndex++) {
      const conversionRequest = messages[messageIndex];
      try {
        const result = await conversionEngine.convertMessage(conversionRequest);
        results.push(result);

        if (!result.success && options.stopOnError) {
          break;
        }
      } catch (error) {
        const failedResult = this.createFailedResult(conversionRequest, error);
        results.push(failedResult);

        if (options.stopOnError) {
          break;
        }
      }
    }
  }

  /**
   * Create failed result for error cases - NASA Rule 10: Single responsibility
   */
  private createFailedResult(conversionRequest: any, error: Error): ConversionResult {
    // Assertion 1: Valid parameters
    console.assert(conversionRequest && error, 'Conversion request and error required');

    return {
      success: false,
      convertedMessage: null,
      originalMessage: conversionRequest.message,
      sourceFormat: conversionRequest.sourceFormat,
      targetFormat: conversionRequest.targetFormat,
      appliedRules: [],
      metadata: {
        conversionId: '',
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
      errors: [{
        code: 'BATCH_ITEM_FAILED',
        message: error.message,
        recoverable: false,
        suggestions: []
      }]
    };
  }

  /**
   * Chunk array into smaller arrays - NASA Rule 10: ≤60 lines
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    // Assertion 1: Valid array
    console.assert(Array.isArray(array), 'Array required for chunking');
    // Assertion 2: Valid chunk size
    console.assert(chunkSize > 0, 'Chunk size must be positive');

    const chunks: T[][] = [];
    const safeChunkSize = Math.max(1, Math.min(chunkSize, MAX_PARALLEL_CHUNKS));
    const maxItems = Math.min(array.length, MAX_BATCH_SIZE);

    // NASA Rule 10: Fixed bounds for chunking
    for (let i = 0; i < maxItems; i += safeChunkSize) {
      const endIndex = Math.min(i + safeChunkSize, maxItems);
      chunks.push(array.slice(i, endIndex));

      // NASA Rule 10: Limit number of chunks
      if (chunks.length >= MAX_PARALLEL_CHUNKS) {
        break;
      }
    }
    return chunks;
  }

  /**
   * Sort results by original order - NASA Rule 10: Single responsibility
   */
  private sortResultsByOrder(results: ConversionResult[], originalMessages: any[]): void {
    // Assertion 1: Valid arrays
    console.assert(Array.isArray(results) && Array.isArray(originalMessages), 'Valid arrays required');
    // Assertion 2: Reasonable size for sorting
    console.assert(results.length <= MAX_BATCH_SIZE, 'Results size within limits');

    results.sort((a, b) => {
      const aIndex = originalMessages.findIndex(m => m.message === a.originalMessage);
      const bIndex = originalMessages.findIndex(m => m.message === b.originalMessage);
      return aIndex - bIndex;
    });
  }

  /**
   * Generate batch summary - NASA Rule 10: Single responsibility
   */
  private async generateBatchSummary(
    results: ConversionResult[],
    totalTime: number
  ): Promise<BatchConversionSummary> {
    // Assertion 1: Valid results array
    console.assert(Array.isArray(results), 'Results array required');
    // Assertion 2: Valid time
    console.assert(totalTime >= 0, 'Total time must be non-negative');

    const successfulResults = results.filter(r => r.success);
    const averageConversionTime = successfulResults.length > 0 ?
      successfulResults.reduce((sum, r) => sum + r.performance.totalTime, 0) / successfulResults.length : 0;

    const averageFidelity = successfulResults.length > 0 ?
      successfulResults.reduce((sum, r) => sum + r.metadata.fidelity, 0) / successfulResults.length : 0;

    return {
      totalTime,
      averageConversionTime,
      throughput: results.length > 0 ? (results.length / totalTime) * 1000 : 0,
      totalDataLoss: results.some(r => r.metadata.dataLoss),
      averageFidelity,
      formatDistribution: [],
      commonErrors: [],
      performance: {
        totalCpuTime: results.reduce((sum, r) => sum + r.performance.cpuUsage, 0),
        peakMemoryUsage: Math.max(...results.map(r => r.performance.memoryUsage), 0),
        averageMemoryUsage: results.length > 0 ?
          results.reduce((sum, r) => sum + r.performance.memoryUsage, 0) / results.length : 0,
        diskIoOperations: 0,
        networkOperations: 0
      }
    };
  }
}