/**
 * GitHub Notifications Manager
 * Handles notification processing, filtering, and automation
 */

import { GitHubAPIClient } from './GitHubAPIClient';
import {
  GitHubNotification,
  GitHubNotificationConfig,
  GitHubNotificationSubject
} from '../types/github-types';

export class GitHubNotifications {
  private apiClient: GitHubAPIClient;
  private config: GitHubNotificationConfig;
  private notificationHandlers = new Map<string, (notification: GitHubNotification) => Promise<void>>();

  constructor(apiClient: GitHubAPIClient, config: GitHubNotificationConfig = {}) {
    this.apiClient = apiClient;
    this.config = {
      autoMarkAsRead: false,
      filterByReason: [],
      filterBySubjectType: [],
      ...config
    };
    this.setupDefaultHandlers();
  }

  /**
   * Get notifications for authenticated user
   */
  async getNotifications(options: {
    all?: boolean;
    participating?: boolean;
    since?: Date;
    before?: Date;
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubNotification[]> {
    const params: any = {};

    if (options.all !== undefined) params.all = options.all;
    if (options.participating !== undefined) params.participating = options.participating;
    if (options.since) params.since = options.since.toISOString();
    if (options.before) params.before = options.before.toISOString();
    if (options.per_page) params.per_page = options.per_page;
    if (options.page) params.page = options.page;

    const response = await this.apiClient.rest.activity.listNotificationsForAuthenticatedUser(params);
    return response.data;
  }

  /**
   * Get repository notifications
   */
  async getRepositoryNotifications(owner: string, repo: string, options: {
    all?: boolean;
    participating?: boolean;
    since?: Date;
    before?: Date;
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubNotification[]> {
    const params: any = { owner, repo };

    if (options.all !== undefined) params.all = options.all;
    if (options.participating !== undefined) params.participating = options.participating;
    if (options.since) params.since = options.since.toISOString();
    if (options.before) params.before = options.before.toISOString();
    if (options.per_page) params.per_page = options.per_page;
    if (options.page) params.page = options.page;

    const response = await this.apiClient.rest.activity.listRepoNotificationsForAuthenticatedUser(params);
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(threadId: number): Promise<void> {
    await this.apiClient.rest.activity.markThreadAsRead({
      thread_id: threadId
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(lastReadAt?: Date): Promise<void> {
    const params: any = {};
    if (lastReadAt) {
      params.last_read_at = lastReadAt.toISOString();
    }

    await this.apiClient.rest.activity.markNotificationsAsRead(params);
  }

  /**
   * Mark repository notifications as read
   */
  async markRepositoryNotificationsAsRead(owner: string, repo: string, lastReadAt?: Date): Promise<void> {
    const params: any = { owner, repo };
    if (lastReadAt) {
      params.last_read_at = lastReadAt.toISOString();
    }

    await this.apiClient.rest.activity.markRepoNotificationsAsRead(params);
  }

  /**
   * Get notification thread
   */
  async getNotificationThread(threadId: number): Promise<GitHubNotification> {
    const response = await this.apiClient.rest.activity.getThread({
      thread_id: threadId
    });
    return response.data;
  }

  /**
   * Get thread subscription
   */
  async getThreadSubscription(threadId: number): Promise<any> {
    const response = await this.apiClient.rest.activity.getThreadSubscriptionForAuthenticatedUser({
      thread_id: threadId
    });
    return response.data;
  }

  /**
   * Set thread subscription
   */
  async setThreadSubscription(threadId: number, subscribed: boolean, ignored?: boolean): Promise<any> {
    const response = await this.apiClient.rest.activity.setThreadSubscription({
      thread_id: threadId,
      subscribed,
      ignored
    });
    return response.data;
  }

  /**
   * Delete thread subscription
   */
  async deleteThreadSubscription(threadId: number): Promise<void> {
    await this.apiClient.rest.activity.deleteThreadSubscription({
      thread_id: threadId
    });
  }

  /**
   * Process notifications with filtering and automation
   */
  async processNotifications(): Promise<{
    processed: number;
    filtered: number;
    marked_read: number;
    errors: number;
  }> {
    const stats = {
      processed: 0,
      filtered: 0,
      marked_read: 0,
      errors: 0
    };

    try {
      const notifications = await this.getNotifications({ all: false });

      for (const notification of notifications) {
        try {
          stats.processed++;

          // Apply filters
          if (!this.shouldProcessNotification(notification)) {
            stats.filtered++;
            continue;
          }

          // Process notification
          await this.processNotification(notification);

          // Auto mark as read if configured
          if (this.config.autoMarkAsRead) {
            await this.markNotificationAsRead(notification.id);
            stats.marked_read++;
          }

        } catch (error) {
          console.error(`Error processing notification ${notification.id}:`, error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
      stats.errors++;
    }

    return stats;
  }

  /**
   * Check if notification should be processed based on filters
   */
  private shouldProcessNotification(notification: GitHubNotification): boolean {
    // Filter by reason
    if (this.config.filterByReason?.length &&
        !this.config.filterByReason.includes(notification.reason)) {
      return false;
    }

    // Filter by subject type
    if (this.config.filterBySubjectType?.length &&
        !this.config.filterBySubjectType.includes(notification.subject.type)) {
      return false;
    }

    return true;
  }

  /**
   * Process individual notification
   */
  private async processNotification(notification: GitHubNotification): Promise<void> {
    const handlerKey = `${notification.reason}:${notification.subject.type}`;
    const handler = this.notificationHandlers.get(handlerKey) ||
                   this.notificationHandlers.get(notification.reason) ||
                   this.notificationHandlers.get(notification.subject.type);

    if (handler) {
      await handler(notification);
    } else {
      console.log(`No handler for notification: ${notification.reason} - ${notification.subject.type}`);
    }
  }

  /**
   * Setup default notification handlers
   */
  private setupDefaultHandlers(): void {
    // Pull request review requested
    this.notificationHandlers.set('review_requested:PullRequest', async (notification) => {
      console.log(`Review requested for PR: ${notification.subject.title}`);
      // Could trigger automated review assignment or notifications
    });

    // Pull request merged
    this.notificationHandlers.set('subscribed:PullRequest', async (notification) => {
      if (notification.subject.title?.includes('[merged]')) {
        console.log(`PR merged: ${notification.subject.title}`);
        // Could trigger deployment or cleanup actions
      }
    });

    // Issue assigned
    this.notificationHandlers.set('assign:Issue', async (notification) => {
      console.log(`Issue assigned: ${notification.subject.title}`);
      // Could add to personal project board or set reminders
    });

    // Mention in comment
    this.notificationHandlers.set('mention', async (notification) => {
      console.log(`Mentioned in ${notification.subject.type}: ${notification.subject.title}`);
      // Could prioritize or flag for immediate attention
    });

    // Security advisory
    this.notificationHandlers.set('security_advisory', async (notification) => {
      console.log(`Security advisory: ${notification.subject.title}`);
      // Could trigger security review process
    });

    // Workflow run failure
    this.notificationHandlers.set('ci_activity', async (notification) => {
      if (notification.subject.title?.includes('failed')) {
        console.log(`CI failure: ${notification.subject.title}`);
        // Could trigger automated failure analysis
      }
    });
  }

  /**
   * Register custom notification handler
   */
  registerHandler(
    key: string,
    handler: (notification: GitHubNotification) => Promise<void>
  ): void {
    this.notificationHandlers.set(key, handler);
  }

  /**
   * Enable workflow notifications for repository
   */
  async enableWorkflowNotifications(owner: string, repo: string): Promise<void> {
    console.log(`Enabling workflow notifications for ${owner}/${repo}`);

    // This would typically involve:
    // 1. Setting up webhook subscriptions
    // 2. Configuring notification preferences
    // 3. Setting up automated handlers

    this.registerHandler('workflow_failure', async (notification) => {
      if (notification.repository.full_name === `${owner}/${repo}`) {
        console.log(`Workflow failed in ${owner}/${repo}: ${notification.subject.title}`);
        // Could trigger automated issue creation or team notifications
      }
    });
  }

  /**
   * Get notification summary
   */
  async getNotificationSummary(): Promise<{
    unread: number;
    participating: number;
    byReason: Record<string, number>;
    byRepository: Record<string, number>;
    bySubjectType: Record<string, number>;
  }> {
    const notifications = await this.getNotifications();

    const summary = {
      unread: notifications.filter(n => n.unread).length,
      participating: 0,
      byReason: {} as Record<string, number>,
      byRepository: {} as Record<string, number>,
      bySubjectType: {} as Record<string, number>
    };

    // Get participating notifications separately
    const participatingNotifications = await this.getNotifications({ participating: true });
    summary.participating = participatingNotifications.length;

    // Analyze notifications
    for (const notification of notifications) {
      // By reason
      summary.byReason[notification.reason] = (summary.byReason[notification.reason] || 0) + 1;

      // By repository
      const repoName = notification.repository.full_name;
      summary.byRepository[repoName] = (summary.byRepository[repoName] || 0) + 1;

      // By subject type
      summary.bySubjectType[notification.subject.type] = (summary.bySubjectType[notification.subject.type] || 0) + 1;
    }

    return summary;
  }

  /**
   * Setup automated notification rules
   */
  async setupAutomatedRules(rules: Array<{
    name: string;
    condition: (notification: GitHubNotification) => boolean;
    action: (notification: GitHubNotification) => Promise<void>;
  }>): Promise<void> {
    for (const rule of rules) {
      this.registerHandler(rule.name, async (notification) => {
        if (rule.condition(notification)) {
          await rule.action(notification);
        }
      });
    }

    console.log(`Setup ${rules.length} automated notification rules`);
  }

  /**
   * Batch mark notifications as read
   */
  async batchMarkAsRead(threadIds: number[]): Promise<{
    successful: number;
    failed: number;
  }> {
    const results = { successful: 0, failed: 0 };

    for (const threadId of threadIds) {
      try {
        await this.markNotificationAsRead(threadId);
        results.successful++;
      } catch (error) {
        console.error(`Failed to mark notification ${threadId} as read:`, error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Export notifications for analysis
   */
  async exportNotifications(days: number = 30): Promise<GitHubNotification[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await this.getNotifications({ all: true, since });
  }

  /**
   * Cleanup old processed notifications
   */
  async cleanup(): Promise<void> {
    // Mark old read notifications for cleanup
    const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    console.log('Cleaning up old notifications...');

    // In a real implementation, this might involve:
    // 1. Archiving old notifications
    // 2. Clearing local caches
    // 3. Updating notification preferences
  }
}

export default GitHubNotifications;