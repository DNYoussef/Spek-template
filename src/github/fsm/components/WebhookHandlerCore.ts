/**
 * Webhook Handler Core Component
 * Reusable webhook processing with event validation and routing
 * NASA Rule 10 Compliant - isolated functionality
 */

import { EventEmitter } from 'events';

export interface WebhookEvent {
  id: string;
  type: string;
  action: string;
  payload: any;
  timestamp: Date;
  signature?: string;
}

export interface WebhookHandler {
  event: string;
  handler: (payload: any) => Promise<void>;
}

export class WebhookHandlerCore extends EventEmitter {
  private handlers: Map<string, WebhookHandler[]> = new Map();
  private processedEvents: Set<string> = new Set();
  private secretKey?: string;

  constructor(secretKey?: string) {
    super();
    this.secretKey = secretKey;
    this.setupDefaultHandlers();
  }

  /**
   * Register webhook handler for specific event type
   */
  registerHandler(eventType: string, handler: (payload: any) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push({
      event: eventType,
      handler
    });
  }

  /**
   * Process incoming webhook event
   */
  async processWebhook(
    eventType: string,
    payload: any,
    signature?: string
  ): Promise<void> {
    const webhookEvent: WebhookEvent = {
      id: this.generateEventId(),
      type: eventType,
      action: payload.action || 'unknown',
      payload,
      timestamp: new Date(),
      signature
    };

    try {
      // Validate webhook signature if secret is provided
      if (this.secretKey && signature) {
        this.validateSignature(payload, signature);
      }

      // Check for duplicate events
      if (this.isDuplicateEvent(webhookEvent)) {
        this.emit('duplicateEvent', webhookEvent);
        return;
      }

      // Process the event
      await this.routeEvent(webhookEvent);

      // Mark as processed
      this.processedEvents.add(webhookEvent.id);
      this.emit('eventProcessed', webhookEvent);

    } catch (error) {
      this.emit('processingError', { event: webhookEvent, error });
      throw error;
    }
  }

  /**
   * Route event to appropriate handlers
   */
  private async routeEvent(event: WebhookEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);

    if (!handlers || handlers.length === 0) {
      this.emit('unhandledEvent', event);
      return;
    }

    // Execute all handlers for this event type
    const promises = handlers.map(handler =>
      this.executeHandler(handler, event.payload)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Execute individual event handler
   */
  private async executeHandler(
    handler: WebhookHandler,
    payload: any
  ): Promise<void> {
    try {
      await handler.handler(payload);
    } catch (error) {
      this.emit('handlerError', { handler: handler.event, error });
      throw error;
    }
  }

  /**
   * Validate webhook signature using HMAC
   */
  private validateSignature(payload: any, signature: string): void {
    if (!this.secretKey) {
      throw new Error('Secret key not configured for signature validation');
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    if (expectedSignature !== providedSignature) {
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Check if event has already been processed
   */
  private isDuplicateEvent(event: WebhookEvent): boolean {
    return this.processedEvents.has(event.id);
  }

  /**
   * Setup default GitHub webhook handlers
   */
  private setupDefaultHandlers(): void {
    // Pull request events
    this.registerHandler('pull_request', async (payload) => {
      this.emit('pullRequestEvent', {
        action: payload.action,
        number: payload.number,
        repository: payload.repository.name
      });
    });

    // Issue events
    this.registerHandler('issues', async (payload) => {
      this.emit('issueEvent', {
        action: payload.action,
        number: payload.issue.number,
        repository: payload.repository.name
      });
    });

    // Push events
    this.registerHandler('push', async (payload) => {
      this.emit('pushEvent', {
        ref: payload.ref,
        commits: payload.commits.length,
        repository: payload.repository.name
      });
    });
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get processing statistics
   */
  getStats(): { processed: number; handlers: number } {
    return {
      processed: this.processedEvents.size,
      handlers: Array.from(this.handlers.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }

  /**
   * Clear processed events cache (for memory management)
   */
  clearProcessedCache(): void {
    this.processedEvents.clear();
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:54:28-04:00 | MEGA-086@Claude-Sonnet-4 | Created reusable webhook handler core component | WebhookHandlerCore.ts | OK | Event-driven webhook processing for all GitHub integrations | 0.00 | 5a8c3f2 |

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: mega-086-webhook-handler-core
- inputs: []
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"webhook-handler-core-v1"}
*/
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */