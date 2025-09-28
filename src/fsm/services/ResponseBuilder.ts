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

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:47:55-04:00 | AGENT104@sonnet-4 | Create ResponseBuilder component | ResponseBuilder.ts | OK | Response construction utilities | 0.00 | a8f5c3d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-response-builder
- inputs: ["ServiceFSMTypes.ts"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->