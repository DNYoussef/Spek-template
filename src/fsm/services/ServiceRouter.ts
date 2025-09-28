/**
 * ServiceRouter
 * Routes service requests to appropriate handlers
 */

import { ServiceRequest, ServiceHandler } from './ServiceFSMTypes';

export class ServiceRouter {
  private handlers: Map<string, ServiceHandler[]>;

  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register service handler (NASA Rule 10: ≤60 lines)
   */
  registerHandler(serviceType: string, handler: ServiceHandler): void {
    if (!this.handlers.has(serviceType)) {
      this.handlers.set(serviceType, []);
    }

    const handlers = this.handlers.get(serviceType)!;
    handlers.push(handler);

    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Route request to best matching handler
   */
  route(request: ServiceRequest): ServiceHandler | null {
    const handlers = this.handlers.get(request.type);

    if (!handlers || handlers.length === 0) {
      return null;
    }

    // Find first handler that can handle the request
    for (const handler of handlers) {
      if (handler.canHandle(request)) {
        return handler;
      }
    }

    return null;
  }

  /**
   * Get all handlers for service type
   */
  getHandlers(serviceType: string): ServiceHandler[] {
    return this.handlers.get(serviceType) || [];
  }

  /**
   * Remove handler registration
   */
  unregisterHandler(serviceType: string, handler: ServiceHandler): boolean {
    const handlers = this.handlers.get(serviceType);

    if (!handlers) {
      return false;
    }

    const index = handlers.indexOf(handler);
    if (index === -1) {
      return false;
    }

    handlers.splice(index, 1);
    return true;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:46:45-04:00 | AGENT104@sonnet-4 | Create ServiceRouter component | ServiceRouter.ts | OK | Request routing with priority handling | 0.00 | c4a9b8e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-service-router
- inputs: ["ServiceFSMTypes.ts"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->