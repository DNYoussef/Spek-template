/**
 * Main GitHub Integration Class
 * Provides comprehensive GitHub API integration with real authentication and rate limiting
 */

import { GitHubAPIClient } from './GitHubAPIClient';
import { GitHubAuthentication } from './GitHubAuthentication';
import { GitHubProjectManager } from './GitHubProjectManager';
import { GitHubIssueManager } from './GitHubIssueManager';
import { GitHubPRManager } from './GitHubPRManager';
import { GitHubWorkflowManager } from './GitHubWorkflowManager';
import { GitHubWebhookHandler } from './GitHubWebhookHandler';
import { GitHubNotifications } from './GitHubNotifications';
import {
  GitHubConfig,
  GitHubRepository,
  GitHubIntegrationStatus,
  GitHubIntegrationOptions
} from '../types/github-types';

export class GitHubIntegration {
  private apiClient: GitHubAPIClient;
  private auth: GitHubAuthentication;
  private projectManager: GitHubProjectManager;
  private issueManager: GitHubIssueManager;
  private prManager: GitHubPRManager;
  private workflowManager: GitHubWorkflowManager;
  private webhookHandler: GitHubWebhookHandler;
  private notifications: GitHubNotifications;
  private config: GitHubConfig;
  private status: GitHubIntegrationStatus = 'disconnected';

  constructor(config: GitHubConfig, options: GitHubIntegrationOptions = {}) {
    this.config = config;
    this.auth = new GitHubAuthentication(config.auth);
    this.apiClient = new GitHubAPIClient(this.auth, config.apiConfig);

    // Initialize managers
    this.projectManager = new GitHubProjectManager(this.apiClient);
    this.issueManager = new GitHubIssueManager(this.apiClient);
    this.prManager = new GitHubPRManager(this.apiClient);
    this.workflowManager = new GitHubWorkflowManager(this.apiClient);
    this.webhookHandler = new GitHubWebhookHandler(config.webhook);
    this.notifications = new GitHubNotifications(this.apiClient, config.notifications);
  }

  /**
   * Initialize GitHub integration and verify connectivity
   */
  async initialize(): Promise<void> {
    try {
      this.status = 'connecting';

      // Verify authentication
      await this.auth.validateToken();

      // Test API connectivity
      await this.apiClient.testConnection();

      // Initialize webhook handler if configured
      if (this.config.webhook?.enabled) {
        await this.webhookHandler.initialize();
      }

      // Initialize project manager
      await this.projectManager.initialize();

      this.status = 'connected';
      console.log('GitHub integration initialized successfully');
    } catch (error) {
      this.status = 'error';
      console.error('Failed to initialize GitHub integration:', error);
      throw error;
    }
  }

  /**
   * Get current integration status
   */
  getStatus(): GitHubIntegrationStatus {
    return this.status;
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return await this.apiClient.rest.repos.get({
      owner,
      repo
    });
  }

  /**
   * Create a new repository
   */
  async createRepository(options: {
    name: string;
    description?: string;
    private?: boolean;
    template?: string;
    org?: string;
  }): Promise<GitHubRepository> {
    const createParams = {
      name: options.name,
      description: options.description,
      private: options.private ?? false,
      auto_init: true
    };

    if (options.org) {
      return await this.apiClient.rest.repos.createInOrg({
        org: options.org,
        ...createParams
      });
    } else {
      return await this.apiClient.rest.repos.createForAuthenticatedUser(createParams);
    }
  }

  /**
   * Sync project with GitHub
   */
  async syncProject(projectId: string, options: {
    owner: string;
    repo: string;
    syncIssues?: boolean;
    syncPRs?: boolean;
    syncWorkflows?: boolean;
  }): Promise<{
    issues: number;
    pullRequests: number;
    workflows: number;
  }> {
    const results = {
      issues: 0,
      pullRequests: 0,
      workflows: 0
    };

    if (options.syncIssues) {
      results.issues = await this.issueManager.syncIssues(
        options.owner,
        options.repo,
        projectId
      );
    }

    if (options.syncPRs) {
      results.pullRequests = await this.prManager.syncPullRequests(
        options.owner,
        options.repo,
        projectId
      );
    }

    if (options.syncWorkflows) {
      results.workflows = await this.workflowManager.syncWorkflows(
        options.owner,
        options.repo
      );
    }

    return results;
  }

  /**
   * Setup automation for repository
   */
  async setupAutomation(owner: string, repo: string, options: {
    enableIssueLabeling?: boolean;
    enablePRReviews?: boolean;
    enableProjectSync?: boolean;
    enableWorkflowNotifications?: boolean;
  }): Promise<void> {
    if (options.enableIssueLabeling) {
      await this.issueManager.enableAutomaticLabeling(owner, repo);
    }

    if (options.enablePRReviews) {
      await this.prManager.enableAutomaticReviews(owner, repo);
    }

    if (options.enableProjectSync) {
      await this.projectManager.enableAutomaticSync(owner, repo);
    }

    if (options.enableWorkflowNotifications) {
      await this.notifications.enableWorkflowNotifications(owner, repo);
    }
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    await this.webhookHandler.handle(payload, signature);
  }

  /**
   * Get API rate limit status
   */
  async getRateLimit(): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
    used: number;
  }> {
    const response = await this.apiClient.rest.rateLimit.get();
    return {
      limit: response.data.rate.limit,
      remaining: response.data.rate.remaining,
      reset: new Date(response.data.rate.reset * 1000),
      used: response.data.rate.used
    };
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    this.status = 'disconnecting';

    await this.webhookHandler.cleanup();
    await this.notifications.cleanup();

    this.status = 'disconnected';
    console.log('GitHub integration disconnected');
  }

  // Expose managers for direct access
  get projects() { return this.projectManager; }
  get issues() { return this.issueManager; }
  get pullRequests() { return this.prManager; }
  get workflows() { return this.workflowManager; }
  get webhooks() { return this.webhookHandler; }
}

export default GitHubIntegration;