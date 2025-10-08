/**
 * Unified Response Builder
 * Reusable response building component for all controllers
 */

import {
  ControllerResponse,
  ControllerError,
  ResponseBuilder
} from '../core/ControllerFSMTypes';

export class UnifiedResponseBuilder implements ResponseBuilder {
  private responseMetadata: Record<string, any> = {};

  /**
   * Set metadata that will be included in all responses
   */
  setMetadata(key: string, value: any): void {
    this.responseMetadata[key] = value;
  }

  /**
   * Build a success response
   */
  buildSuccess(data: any, requestId: string): ControllerResponse {
    return {
      id: this.generateResponseId(),
      requestId,
      status: 'success',
      data,
      timestamp: new Date(),
      metadata: {
        ...this.responseMetadata,
        responseType: 'success'
      }
    };
  }

  /**
   * Build an error response
   */
  buildError(error: ControllerError, requestId: string): ControllerResponse {
    return {
      id: this.generateResponseId(),
      requestId,
      status: 'error',
      error,
      timestamp: new Date(),
      metadata: {
        ...this.responseMetadata,
        responseType: 'error',
        errorCode: error.code
      }
    };
  }

  /**
   * Build a partial response (some success, some errors)
   */
  buildPartial(data: any, error: ControllerError, requestId: string): ControllerResponse {
    return {
      id: this.generateResponseId(),
      requestId,
      status: 'partial',
      data,
      error,
      timestamp: new Date(),
      metadata: {
        ...this.responseMetadata,
        responseType: 'partial',
        errorCode: error.code
      }
    };
  }

  /**
   * Build paginated response
   */
  buildPaginated(
    data: any[],
    requestId: string,
    page: number,
    limit: number,
    total: number
  ): ControllerResponse {
    return {
      id: this.generateResponseId(),
      requestId,
      status: 'success',
      data: {
        items: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      },
      timestamp: new Date(),
      metadata: {
        ...this.responseMetadata,
        responseType: 'paginated'
      }
    };
  }

  /**
   * Build async operation response
   */
  buildAsyncResponse(operationId: string, requestId: string): ControllerResponse {
    return {
      id: this.generateResponseId(),
      requestId,
      status: 'success',
      data: {
        operationId,
        status: 'accepted',
        message: 'Operation accepted and will be processed asynchronously'
      },
      timestamp: new Date(),
      metadata: {
        ...this.responseMetadata,
        responseType: 'async',
        operationId
      }
    };
  }

  /**
   * Build validation error response
   */
  buildValidationError(validationErrors: ControllerError[], requestId: string): ControllerResponse {
    const error: ControllerError = {
      code: 'VALIDATION_FAILED',
      message: 'Request validation failed',
      details: {
        validationErrors,
        errorCount: validationErrors.length
      }
    };

    return this.buildError(error, requestId);
  }

  /**
   * Build rate limit response
   */
  buildRateLimitError(requestId: string, retryAfter?: number): ControllerResponse {
    const error: ControllerError = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      details: retryAfter ? { retryAfter } : undefined
    };

    return {
      id: this.generateResponseId(),
      requestId,
      status: 'error',
      error,
      timestamp: new Date(),
      metadata: {
        ...this.responseMetadata,
        responseType: 'rateLimitError',
        retryAfter
      }
    };
  }

  /**
   * Generate unique response ID
   */
  private generateResponseId(): string {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}