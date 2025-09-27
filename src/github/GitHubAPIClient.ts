/**
 * GitHub API Client
 * Wrapper for REST and GraphQL APIs with rate limiting and authentication
 */

import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import { GitHubAuthentication } from './GitHubAuthentication';
import {
  GitHubAPIConfig,
  GitHubRateLimit,
  GitHubAPIResponse
} from '../types/github-types';

export class GitHubAPIClient {
  private octokit: Octokit;
  private graphqlClient: typeof graphql;
  private auth: GitHubAuthentication;
  private config: GitHubAPIConfig;
  private rateLimitInfo: GitHubRateLimit | null = null;

  constructor(auth: GitHubAuthentication, config: GitHubAPIConfig = {}) {
    this.auth = auth;
    this.config = {
      baseUrl: 'https://api.github.com',
      timeout: 30000,
      retries: 3,
      ...config
    };

    this.initializeClients();
  }

  /**
   * Initialize Octokit and GraphQL clients
   */
  private initializeClients(): void {
    const authToken = this.auth.getToken();

    this.octokit = new Octokit({
      auth: authToken,
      baseUrl: this.config.baseUrl,
      request: {
        timeout: this.config.timeout
      },
      retry: {
        doNotRetry: ['429'], // We handle rate limiting ourselves
      },
      throttle: {
        onRateLimit: this.handleRateLimit.bind(this),
        onAbuseLimit: this.handleAbuseLimit.bind(this)
      }
    });

    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${authToken}`,
      },
      baseUrl: this.config.baseUrl
    });
  }

  /**
   * Get REST API client
   */
  get rest(): Octokit['rest'] {
    return this.octokit.rest;
  }

  /**
   * Execute GraphQL query
   */
  async graphql<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      await this.checkRateLimit();
      const result = await this.graphqlClient<T>(query, variables);
      await this.updateRateLimit();
      return result;
    } catch (error) {
      if (this.isRateLimitError(error)) {
        await this.handleRateLimitError(error);
        return this.graphql<T>(query, variables); // Retry
      }
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.rest.users.getAuthenticated();
      console.log(`Connected to GitHub as: ${response.data.login}`);
      return true;
    } catch (error) {
      console.error('GitHub API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimit(): Promise<GitHubRateLimit> {
    try {
      const response = await this.rest.rateLimit.get();
      this.rateLimitInfo = {
        limit: response.data.rate.limit,
        remaining: response.data.rate.remaining,
        reset: new Date(response.data.rate.reset * 1000),
        used: response.data.rate.used
      };
      return this.rateLimitInfo;
    } catch (error) {
      console.error('Failed to get rate limit:', error);
      throw error;
    }
  }

  /**
   * Check if we're approaching rate limits
   */
  private async checkRateLimit(): Promise<void> {
    if (!this.rateLimitInfo) {
      await this.getRateLimit();
    }

    if (this.rateLimitInfo && this.rateLimitInfo.remaining < 100) {
      const resetTime = this.rateLimitInfo.reset.getTime();
      const now = Date.now();
      const waitTime = Math.max(0, resetTime - now);

      if (waitTime > 0) {
        console.warn(`Rate limit low (${this.rateLimitInfo.remaining} remaining). Waiting ${waitTime}ms until reset.`);
        await this.sleep(waitTime);
        await this.getRateLimit(); // Refresh after waiting
      }
    }
  }

  /**
   * Update rate limit info after API call
   */
  private async updateRateLimit(): Promise<void> {
    // Rate limit info is typically returned in response headers
    // For GraphQL, we need to fetch it separately
    if (Math.random() < 0.1) { // Check 10% of the time to avoid too many calls
      await this.getRateLimit();
    }
  }

  /**
   * Handle rate limit callback from Octokit
   */
  private handleRateLimit(retryAfter: number, options: any): boolean {
    console.warn(`Rate limit hit. Retrying after ${retryAfter} seconds.`);
    return true; // Allow retry
  }

  /**
   * Handle abuse limit callback from Octokit
   */
  private handleAbuseLimit(retryAfter: number, options: any): boolean {
    console.warn(`Abuse limit hit. Retrying after ${retryAfter} seconds.`);
    return true; // Allow retry
  }

  /**
   * Check if error is rate limit related
   */
  private isRateLimitError(error: any): boolean {
    return error.status === 403 && error.message?.includes('rate limit');
  }

  /**
   * Handle rate limit error
   */
  private async handleRateLimitError(error: any): Promise<void> {
    const resetTime = error.response?.headers?.['x-ratelimit-reset'];
    if (resetTime) {
      const waitTime = (parseInt(resetTime) * 1000) - Date.now();
      if (waitTime > 0) {
        console.warn(`Rate limit exceeded. Waiting ${waitTime}ms until reset.`);
        await this.sleep(waitTime);
      }
    } else {
      // Default wait time if reset time not available
      await this.sleep(60000); // Wait 1 minute
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute REST API call with error handling
   */
  async restCall<T = any>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<GitHubAPIResponse<T>> {
    try {
      await this.checkRateLimit();

      const response = await this.octokit.request(`${method} ${endpoint}`, data);

      await this.updateRateLimit();

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        url: response.url
      };
    } catch (error) {
      if (this.isRateLimitError(error)) {
        await this.handleRateLimitError(error);
        return this.restCall<T>(method, endpoint, data); // Retry
      }
      throw error;
    }
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<any> {
    return await this.rest.repos.get({ owner, repo });
  }

  /**
   * List repository issues
   */
  async listIssues(owner: string, repo: string, options: {
    state?: 'open' | 'closed' | 'all';
    labels?: string;
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    since?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<any> {
    return await this.rest.issues.listForRepo({
      owner,
      repo,
      ...options
    });
  }

  /**
   * List repository pull requests
   */
  async listPullRequests(owner: string, repo: string, options: {
    state?: 'open' | 'closed' | 'all';
    head?: string;
    base?: string;
    sort?: 'created' | 'updated' | 'popularity';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<any> {
    return await this.rest.pulls.list({
      owner,
      repo,
      ...options
    });
  }

  /**
   * Create issue
   */
  async createIssue(owner: string, repo: string, options: {
    title: string;
    body?: string;
    assignees?: string[];
    milestone?: number;
    labels?: string[];
  }): Promise<any> {
    return await this.rest.issues.create({
      owner,
      repo,
      ...options
    });
  }

  /**
   * Create pull request
   */
  async createPullRequest(owner: string, repo: string, options: {
    title: string;
    head: string;
    base: string;
    body?: string;
    maintainer_can_modify?: boolean;
    draft?: boolean;
  }): Promise<any> {
    return await this.rest.pulls.create({
      owner,
      repo,
      ...options
    });
  }

  /**
   * Get workflow runs
   */
  async getWorkflowRuns(owner: string, repo: string, options: {
    workflow_id?: string | number;
    actor?: string;
    branch?: string;
    event?: string;
    status?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<any> {
    return await this.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      ...options
    });
  }

  /**
   * Trigger workflow dispatch
   */
  async triggerWorkflow(owner: string, repo: string, workflowId: string, ref: string, inputs?: Record<string, any>): Promise<any> {
    return await this.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs
    });
  }

  /**
   * Get authenticated user
   */
  async getAuthenticatedUser(): Promise<any> {
    return await this.rest.users.getAuthenticated();
  }

  /**
   * Search repositories
   */
  async searchRepositories(query: string, options: {
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
    order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<any> {
    return await this.rest.search.repos({
      q: query,
      ...options
    });
  }

  /**
   * Refresh authentication
   */
  async refreshAuth(): Promise<void> {
    await this.auth.refreshToken();
    this.initializeClients();
  }
}

export default GitHubAPIClient;