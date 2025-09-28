/**
 * RequestHandler
 * Base request processing component
 */

import { ServiceContext, ServiceRequest, ServiceResponse } from './ServiceFSMTypes';

export abstract class RequestHandler {
  /**
   * Check if handler can process request (NASA Rule 10: ≤60 lines)
   */
  abstract canHandle(request: ServiceRequest): boolean;

  /**
   * Process service request with context
   */
  abstract process(context: ServiceContext): Promise<any>;

  /**
   * Handler priority for routing
   */
  abstract readonly priority: number;

  /**
   * Validate request format
   */
  protected validateRequest(request: ServiceRequest): boolean {
    if (!request.id || !request.type || !request.timestamp) {
      return false;
    }

    if (request.timestamp > Date.now() + 5000) {
      return false; // Future timestamp
    }

    return true;
  }

  /**
   * Create standardized response
   */
  protected createResponse(
    requestId: string,
    success: boolean,
    data?: any,
    error?: string
  ): ServiceResponse {
    return {
      id: requestId,
      success,
      data,
      error,
      timestamp: Date.now()
    };
  }

  /**
   * Extract processing metadata
   */
  protected extractMetadata(context: ServiceContext): Record<string, any> {
    return {
      requestType: context.request.type,
      processingTime: context.processing?.startTime
        ? Date.now() - context.processing.startTime
        : 0,
      stage: context.processing?.stage || 'unknown'
    };
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:47:22-04:00 | AGENT104@sonnet-4 | Create RequestHandler base class | RequestHandler.ts | OK | Abstract base with validation utilities | 0.00 | b6d3e2f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-request-handler
- inputs: ["ServiceFSMTypes.ts"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->