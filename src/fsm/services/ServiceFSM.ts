/**
 * ServiceFSM
 * Unified service finite state machine
 */

import { ServiceState, ServiceEvent, ServiceContext, ServiceRequest } from './ServiceFSMTypes';
import { ServiceTransitionHub } from './ServiceTransitionHub';
import { ServiceRouter } from './ServiceRouter';
import { ResponseBuilder } from './ResponseBuilder';
import { ServiceCache } from './ServiceCache';

export class ServiceFSM {
  private state: ServiceState;
  private context: ServiceContext;
  private transitionHub: ServiceTransitionHub;
  private router: ServiceRouter;
  private responseBuilder: ResponseBuilder;
  private cache: ServiceCache;

  constructor() {
    this.state = ServiceState.IDLE;
    this.transitionHub = ServiceTransitionHub.getInstance();
    this.router = new ServiceRouter();
    this.responseBuilder = new ResponseBuilder();
    this.cache = new ServiceCache();
    this.context = this.createEmptyContext();
  }

  /**
   * Initialize service request (NASA Rule 10: ≤60 lines)
   */
  async handleRequest(request: ServiceRequest): Promise<any> {
    this.context = {
      request,
      cache: new Map(),
      metadata: {}
    };

    try {
      // Check cache first
      const cacheKey = this.cache.generateKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Process through FSM states
      await this.processRequest();

      return this.context.response;
    } catch (error) {
      await this.handleError(error as Error);
      return this.context.response;
    }
  }

  /**
   * Process request through FSM states
   */
  private async processRequest(): Promise<void> {
    // IDLE → PROCESSING
    this.transition(ServiceEvent.REQUEST_RECEIVED);

    // Start processing
    this.context.processing = {
      startTime: Date.now(),
      stage: 'routing',
      progress: 0
    };

    this.transition(ServiceEvent.PROCESSING_STARTED);

    // Route and handle request
    const handler = this.router.route(this.context.request);
    if (!handler) {
      throw new Error(`No handler found for request type: ${this.context.request.type}`);
    }

    this.context.processing.stage = 'executing';
    this.context.processing.progress = 50;

    const result = await handler.process(this.context);

    this.transition(ServiceEvent.PROCESSING_COMPLETE);

    // Build response
    this.context.response = this.responseBuilder.buildFromContext(this.context, result);
    this.transition(ServiceEvent.RESPONSE_READY);

    // Cache result
    const cacheKey = this.cache.generateKey(this.context.request);
    this.cache.set(cacheKey, this.context.response);
    this.transition(ServiceEvent.CACHE_UPDATED);

    // Complete
    this.transition(ServiceEvent.OPERATION_COMPLETE);
  }

  /**
   * Handle FSM state transition
   */
  private transition(event: ServiceEvent): void {
    const nextState = this.transitionHub.transition(this.state, event, this.context);
    this.state = nextState;
  }

  /**
   * Handle processing errors
   */
  private async handleError(error: Error): Promise<void> {
    this.transition(ServiceEvent.ERROR_OCCURRED);
    this.context.response = this.responseBuilder.buildError(
      this.context.request.id,
      error.message
    );
  }

  /**
   * Reset FSM to idle state
   */
  reset(): void {
    this.state = ServiceState.IDLE;
    this.context = this.createEmptyContext();
    this.transition(ServiceEvent.RESET);
  }

  /**
   * Create empty context
   */
  private createEmptyContext(): ServiceContext {
    return {
      request: {
        id: '',
        type: '',
        payload: null,
        timestamp: 0
      },
      cache: new Map(),
      metadata: {}
    };
  }

  /**
   * Get current FSM state
   */
  getState(): ServiceState {
    return this.state;
  }

  /**
   * Get service router for handler registration
   */
  getRouter(): ServiceRouter {
    return this.router;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:49:15-04:00 | AGENT104@sonnet-4 | Create unified ServiceFSM | ServiceFSM.ts | OK | IDLE→PROCESSING→RESPONDING→CACHING→COMPLETE flow | 0.00 | d1a6f8c |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-service-fsm
- inputs: ["ServiceFSMTypes.ts", "ServiceTransitionHub.ts", "ServiceRouter.ts", "ResponseBuilder.ts", "ServiceCache.ts"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->