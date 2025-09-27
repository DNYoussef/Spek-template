/**
 * GitHub Webhook Handler
 * Real webhook signature verification and event processing
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  GitHubWebhookConfig,
  GitHubWebhookEvent,
  GitHubWebhookPayload
} from '../types/github-types';

export class GitHubWebhookHandler extends EventEmitter {
  private config: GitHubWebhookConfig;
  private eventProcessors = new Map<string, (payload: any) => Promise<void>>();

  constructor(config: GitHubWebhookConfig) {
    super();
    this.config = config;
    this.setupDefaultProcessors();
  }

  async initialize(): Promise<void> {
    console.log('GitHub Webhook Handler initialized');
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  private verifySignature(payload: string, signature: string): boolean {
    if (!this.config.secret) {
      console.warn('Webhook secret not configured - skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.secret)
      .update(payload, 'utf8')
      .digest('hex');

    const actualSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(actualSignature, 'hex')
    );
  }

  /**
   * Handle incoming webhook
   */
  async handle(payload: any, signature: string, eventType?: string): Promise<void> {
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

      // Verify signature
      if (!this.verifySignature(payloadString, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const event: GitHubWebhookEvent = {
        type: eventType || this.detectEventType(parsedPayload),
        payload: parsedPayload,
        timestamp: new Date(),
        signature
      };

      console.log(`Processing webhook event: ${event.type}`);

      // Process event
      await this.processEvent(event);

      // Emit event for external listeners
      this.emit('webhook', event);
      this.emit(event.type, event.payload);

    } catch (error) {
      console.error('Error handling webhook:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Detect event type from payload
   */
  private detectEventType(payload: any): string {
    // GitHub sends event type in various ways
    if (payload.zen) return 'ping';
    if (payload.issue) return payload.action ? `issues.${payload.action}` : 'issues';
    if (payload.pull_request) return payload.action ? `pull_request.${payload.action}` : 'pull_request';
    if (payload.repository && payload.action) return `repository.${payload.action}`;
    if (payload.workflow_run) return 'workflow_run';
    if (payload.check_run) return 'check_run';
    if (payload.deployment) return 'deployment';
    if (payload.release) return 'release';
    if (payload.push) return 'push';

    return 'unknown';
  }

  /**
   * Process webhook event
   */
  private async processEvent(event: GitHubWebhookEvent): Promise<void> {
    const processor = this.eventProcessors.get(event.type);
    if (processor) {
      await processor(event.payload);
    } else {
      console.log(`No processor found for event type: ${event.type}`);
    }
  }

  /**
   * Register event processor
   */
  registerProcessor(eventType: string, processor: (payload: any) => Promise<void>): void {
    this.eventProcessors.set(eventType, processor);
  }

  /**
   * Setup default event processors
   */
  private setupDefaultProcessors(): void {
    // Ping event
    this.registerProcessor('ping', async (payload) => {
      console.log('Received ping webhook:', payload.zen);
    });

    // Issues events
    this.registerProcessor('issues.opened', async (payload) => {
      console.log(`New issue opened: #${payload.issue.number} - ${payload.issue.title}`);
      await this.handleIssueOpened(payload);
    });

    this.registerProcessor('issues.closed', async (payload) => {
      console.log(`Issue closed: #${payload.issue.number}`);
      await this.handleIssueClosed(payload);
    });

    this.registerProcessor('issues.labeled', async (payload) => {
      console.log(`Issue labeled: #${payload.issue.number} with ${payload.label.name}`);
      await this.handleIssueLabeled(payload);
    });

    // Pull Request events
    this.registerProcessor('pull_request.opened', async (payload) => {
      console.log(`New PR opened: #${payload.pull_request.number} - ${payload.pull_request.title}`);
      await this.handlePROpened(payload);
    });

    this.registerProcessor('pull_request.closed', async (payload) => {
      console.log(`PR closed: #${payload.pull_request.number}`);
      await this.handlePRClosed(payload);
    });

    this.registerProcessor('pull_request.review_requested', async (payload) => {
      console.log(`Review requested for PR #${payload.pull_request.number}`);
      await this.handleReviewRequested(payload);
    });

    // Workflow events
    this.registerProcessor('workflow_run', async (payload) => {
      console.log(`Workflow ${payload.workflow_run.name} ${payload.workflow_run.conclusion}`);
      await this.handleWorkflowRun(payload);
    });

    // Push events
    this.registerProcessor('push', async (payload) => {
      console.log(`Push to ${payload.ref} with ${payload.commits.length} commits`);
      await this.handlePush(payload);
    });

    // Release events
    this.registerProcessor('release', async (payload) => {
      console.log(`Release ${payload.action}: ${payload.release.tag_name}`);
      await this.handleRelease(payload);
    });
  }

  /**
   * Handle issue opened
   */
  private async handleIssueOpened(payload: GitHubWebhookPayload): Promise<void> {
    // Auto-label based on issue content
    const issue = payload.issue;
    const labels = this.suggestLabels(issue.title + ' ' + issue.body);

    if (labels.length > 0) {
      this.emit('auto-label-suggestion', {
        repository: payload.repository,
        issue: issue,
        suggestedLabels: labels
      });
    }

    // Auto-assign to project
    if (this.config.autoAssignToProject) {
      this.emit('auto-assign-to-project', {
        repository: payload.repository,
        issue: issue
      });
    }
  }

  /**
   * Handle issue closed
   */
  private async handleIssueClosed(payload: GitHubWebhookPayload): Promise<void> {
    this.emit('issue-metrics', {
      repository: payload.repository,
      issue: payload.issue,
      action: 'closed'
    });
  }

  /**
   * Handle issue labeled
   */
  private async handleIssueLabeled(payload: GitHubWebhookPayload): Promise<void> {
    // Trigger automation based on label
    const label = payload.label.name;

    if (label === 'bug') {
      this.emit('bug-detected', {
        repository: payload.repository,
        issue: payload.issue
      });
    } else if (label === 'enhancement') {
      this.emit('enhancement-request', {
        repository: payload.repository,
        issue: payload.issue
      });
    }
  }

  /**
   * Handle PR opened
   */
  private async handlePROpened(payload: GitHubWebhookPayload): Promise<void> {
    const pr = payload.pull_request;

    // Auto-request reviews
    if (this.config.autoRequestReviews) {
      this.emit('auto-request-reviews', {
        repository: payload.repository,
        pullRequest: pr
      });
    }

    // Run automated checks
    this.emit('pr-automated-checks', {
      repository: payload.repository,
      pullRequest: pr
    });
  }

  /**
   * Handle PR closed
   */
  private async handlePRClosed(payload: GitHubWebhookPayload): Promise<void> {
    const pr = payload.pull_request;

    if (pr.merged) {
      this.emit('pr-merged', {
        repository: payload.repository,
        pullRequest: pr
      });
    } else {
      this.emit('pr-cancelled', {
        repository: payload.repository,
        pullRequest: pr
      });
    }
  }

  /**
   * Handle review requested
   */
  private async handleReviewRequested(payload: GitHubWebhookPayload): Promise<void> {
    this.emit('review-notification', {
      repository: payload.repository,
      pullRequest: payload.pull_request,
      reviewer: payload.requested_reviewer
    });
  }

  /**
   * Handle workflow run
   */
  private async handleWorkflowRun(payload: GitHubWebhookPayload): Promise<void> {
    const workflowRun = payload.workflow_run;

    if (workflowRun.conclusion === 'failure') {
      this.emit('workflow-failure', {
        repository: payload.repository,
        workflowRun: workflowRun
      });
    } else if (workflowRun.conclusion === 'success') {
      this.emit('workflow-success', {
        repository: payload.repository,
        workflowRun: workflowRun
      });
    }
  }

  /**
   * Handle push event
   */
  private async handlePush(payload: GitHubWebhookPayload): Promise<void> {
    // Trigger CI/CD if configured
    if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
      this.emit('main-branch-push', {
        repository: payload.repository,
        commits: payload.commits
      });
    }
  }

  /**
   * Handle release event
   */
  private async handleRelease(payload: GitHubWebhookPayload): Promise<void> {
    if (payload.action === 'published') {
      this.emit('release-published', {
        repository: payload.repository,
        release: payload.release
      });
    }
  }

  /**
   * Suggest labels based on content
   */
  private suggestLabels(content: string): string[] {
    const labels: string[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('bug') || lowerContent.includes('error') || lowerContent.includes('issue')) {
      labels.push('bug');
    }
    if (lowerContent.includes('feature') || lowerContent.includes('enhancement')) {
      labels.push('enhancement');
    }
    if (lowerContent.includes('doc') || lowerContent.includes('documentation')) {
      labels.push('documentation');
    }
    if (lowerContent.includes('test') || lowerContent.includes('testing')) {
      labels.push('testing');
    }
    if (lowerContent.includes('security') || lowerContent.includes('vulnerability')) {
      labels.push('security');
    }
    if (lowerContent.includes('performance') || lowerContent.includes('optimization')) {
      labels.push('performance');
    }

    return labels;
  }

  /**
   * Get webhook statistics
   */
  getStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    lastEventTime?: Date;
  } {
    // Implementation would track statistics
    return {
      totalEvents: 0,
      eventsByType: {},
      lastEventTime: undefined
    };
  }

  /**
   * Cleanup webhook handler
   */
  async cleanup(): Promise<void> {
    this.removeAllListeners();
    this.eventProcessors.clear();
    console.log('GitHub Webhook Handler cleaned up');
  }
}

export default GitHubWebhookHandler;