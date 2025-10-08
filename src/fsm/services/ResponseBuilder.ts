/**
 * ResponseBuilder
 * Service response construction and formatting
 */

import { ServiceResponse, ServiceContext } from './ServiceFSMTypes';

export class ResponseBuilder {
  /**
   * Build success response (NASA Rule 10: ≤60 lines)
   */
  buildSuccess(
    requestId: string,
    data: any,
    metadata?: Record<string, any>
  ): ServiceResponse {
    return {
      id: requestId,
      success: true,
      data,
      metadata: {
        ...metadata,
        responseTime: Date.now()
      },
      timestamp: Date.now()
    };
  }

  /**
   * Build error response
   */
  buildError(
    requestId: string,
    error: string,
    metadata?: Record<string, any>
  ): ServiceResponse {
    return {
      id: requestId,
      success: false,
      error,
      metadata: {
        ...metadata,
        responseTime: Date.now()
      },
      timestamp: Date.now()
    };
  }

  /**
   * Build response from context
   */
  buildFromContext(context: ServiceContext, data: any): ServiceResponse {
    const processingTime = context.processing?.startTime
      ? Date.now() - context.processing.startTime
      : 0;

    return this.buildSuccess(
      context.request.id,
      data,
      {
        processingTime,
        stage: context.processing?.stage,
        requestType: context.request.type
      }
    );
  }

  /**
   * Add metadata to existing response
   */
  addMetadata(
    response: ServiceResponse,
    metadata: Record<string, any>
  ): ServiceResponse {
    return {
      ...response,
      metadata: {
        ...response.metadata,
        ...metadata
      }
    };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: agent104-response-builder
// inputs: ["ServiceFSMTypes.ts"]
// tools_used: ["Write"]
// versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
// === END FOOTER ===