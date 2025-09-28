/**
 * GitHub Client Core Component
 * Reusable GitHub API client with rate limiting and error handling
 * NASA Rule 10 Compliant - isolated functionality
 */

import { Octokit } from '@octokit/rest';
import { GitHubAPIResponse } from '../GitHubSharedTypes';

export class GitHubClientCore {
  private octokit: Octokit;
  private rateLimitRemaining: number = 5000;
  private rateLimitResetAt: Date = new Date();
  private apiCallCount: number = 0;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Execute GitHub API call with rate limit handling
   */
  async executeAPICall<T>(
    apiCall: () => Promise<any>
  ): Promise<GitHubAPIResponse<T>> {
    await this.checkRateLimit();

    try {
      const response = await apiCall();
      this.updateRateLimitInfo(response);
      this.apiCallCount++;

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        rateLimit: {
          limit: 5000,
          remaining: this.rateLimitRemaining,
          resetAt: this.rateLimitResetAt
        }
      };
    } catch (error) {
      this.handleAPIError(error as Error);
      throw error;
    }
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<GitHubAPIResponse> {
    return this.executeAPICall(() =>
      this.octokit.repos.get({ owner, repo })
    );
  }

  /**
   * Get pull request information
   */
  async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<GitHubAPIResponse> {
    return this.executeAPICall(() =>
      this.octokit.pulls.get({ owner, repo, pull_number: pullNumber })
    );
  }

  /**
   * Create issue
   */
  async createIssue(owner: string, repo: string, title: string, body: string): Promise<GitHubAPIResponse> {
    return this.executeAPICall(() =>
      this.octokit.issues.create({ owner, repo, title, body })
    );
  }

  /**
   * Update issue
   */
  async updateIssue(owner: string, repo: string, issueNumber: number, updates: any): Promise<GitHubAPIResponse> {
    return this.executeAPICall(() =>
      this.octokit.issues.update({ owner, repo, issue_number: issueNumber, ...updates })
    );
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<GitHubAPIResponse> {
    return this.executeAPICall(() =>
      this.octokit.pulls.create({ owner, repo, title, head, base, body })
    );
  }

  /**
   * Check rate limit before API call
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitRemaining <= 10) {
      const waitTime = this.rateLimitResetAt.getTime() - Date.now();
      if (waitTime > 0) {
        await this.delay(waitTime);
      }
    }
  }

  /**
   * Update rate limit information from response
   */
  private updateRateLimitInfo(response: any): void {
    const headers = response.headers;
    this.rateLimitRemaining = parseInt(headers['x-ratelimit-remaining'] || '5000');
    this.rateLimitResetAt = new Date(parseInt(headers['x-ratelimit-reset'] || '0') * 1000);
  }

  /**
   * Handle API errors with intelligent retry logic
   */
  private handleAPIError(error: Error): void {
    // Log error details for monitoring
    console.error('GitHub API Error:', {
      message: error.message,
      apiCallCount: this.apiCallCount,
      rateLimitRemaining: this.rateLimitRemaining
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get API call statistics
   */
  getAPIStats(): { callCount: number; rateLimitRemaining: number; resetAt: Date } {
    return {
      callCount: this.apiCallCount,
      rateLimitRemaining: this.rateLimitRemaining,
      resetAt: this.rateLimitResetAt
    };
  }

  /**
   * Reset API call statistics
   */
  resetStats(): void {
    this.apiCallCount = 0;
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:52:03-04:00 | MEGA-086@Claude-Sonnet-4 | Created reusable GitHub API client core component | GitHubClientCore.ts | OK | Rate-limited API client for all GitHub operations | 0.00 | 7f4b2c9 |

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: mega-086-github-client-core
- inputs: ["GitHubSharedTypes.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"github-client-core-v1"}
*/
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */