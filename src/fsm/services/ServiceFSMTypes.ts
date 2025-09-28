/**
 * ServiceFSM Types
 * Unified service layer state machine types for all service operations
 */

export enum ServiceState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  RESPONDING = 'RESPONDING',
  CACHING = 'CACHING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export enum ServiceEvent {
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  PROCESSING_STARTED = 'PROCESSING_STARTED',
  PROCESSING_COMPLETE = 'PROCESSING_COMPLETE',
  RESPONSE_READY = 'RESPONSE_READY',
  CACHE_UPDATED = 'CACHE_UPDATED',
  OPERATION_COMPLETE = 'OPERATION_COMPLETE',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

export interface ServiceRequest {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ServiceResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface ServiceContext {
  request: ServiceRequest;
  response?: ServiceResponse;
  cache?: Map<string, any>;
  processing?: {
    startTime: number;
    stage: string;
    progress: number;
  };
  metadata: Record<string, any>;
}

export interface ServiceHandler {
  canHandle(request: ServiceRequest): boolean;
  process(context: ServiceContext): Promise<any>;
  priority: number;
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  metadata?: Record<string, any>;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:45:15-04:00 | AGENT104@sonnet-4 | Create unified ServiceFSM types | ServiceFSMTypes.ts | OK | FSM-first service layer foundation | 0.00 | a7c2f9d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-service-types
- inputs: ["service god object analysis"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->