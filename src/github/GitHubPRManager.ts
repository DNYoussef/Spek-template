/**
 * GitHub Pull Request Manager
 * Automated PR management, reviews, and merge coordination
 */

import { GitHubAPIClient } from './GitHubAPIClient';
import {
  GitHubPullRequest,
  GitHubPRReview,
  GitHubPRComment,
  GitHubPRStatus,
  GitHubPRCheckRun
} from '../types/github-types';

export class GitHubPRManager {
  private apiClient: GitHubAPIClient;
  private reviewRules = new Map<string, any>();
  private mergeRules = new Map<string, any>();

  constructor(apiClient: GitHubAPIClient) {
    this.apiClient = apiClient;
    this.setupDefaultRules();
  }

  /**
   * Get pull requests for repository
   */
  async getPullRequests(owner: string, repo: string, options: {
    state?: 'open' | 'closed' | 'all';
    head?: string;
    base?: string;
    sort?: 'created' | 'updated' | 'popularity';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubPullRequest[]> {
    const response = await this.apiClient.rest.pulls.list({
      owner,
      repo,
      ...options
    });
    return response.data;
  }

  /**
   * Get single pull request
   */
  async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<GitHubPullRequest> {
    const response = await this.apiClient.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber
    });
    return response.data;
  }

  /**
   * Create new pull request
   */
  async createPullRequest(owner: string, repo: string, options: {
    title: string;
    head: string;
    base: string;
    body?: string;
    maintainer_can_modify?: boolean;
    draft?: boolean;
  }): Promise<GitHubPullRequest> {
    const response = await this.apiClient.rest.pulls.create({
      owner,
      repo,
      ...options
    });

    const pr = response.data;

    // Apply automation rules
    await this.applyAutomationRules(owner, repo, pr);

    return pr;
  }

  /**
   * Update pull request
   */
  async updatePullRequest(owner: string, repo: string, pullNumber: number, options: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    base?: string;
    maintainer_can_modify?: boolean;
  }): Promise<GitHubPullRequest> {
    const response = await this.apiClient.rest.pulls.update({
      owner,
      repo,
      pull_number: pullNumber,
      ...options
    });
    return response.data;
  }

  /**
   * Merge pull request
   */
  async mergePullRequest(owner: string, repo: string, pullNumber: number, options: {
    commit_title?: string;
    commit_message?: string;
    sha?: string;
    merge_method?: 'merge' | 'squash' | 'rebase';
  } = {}): Promise<{ sha: string; merged: boolean; message: string }> {
    // Check merge conditions first
    const canMerge = await this.checkMergeConditions(owner, repo, pullNumber);
    if (!canMerge.allowed) {
      throw new Error(`Cannot merge PR: ${canMerge.reasons.join(', ')}`);
    }

    const response = await this.apiClient.rest.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      ...options
    });

    return response.data;
  }

  /**
   * Check if PR can be merged
   */
  async checkMergeConditions(owner: string, repo: string, pullNumber: number): Promise<{
    allowed: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    try {
      const [pr, reviews, checks] = await Promise.all([
        this.getPullRequest(owner, repo, pullNumber),
        this.getReviews(owner, repo, pullNumber),
        this.getCheckRuns(owner, repo, pullNumber)
      ]);

      // Check if PR is draft
      if (pr.draft) {
        reasons.push('PR is in draft state');
      }

      // Check if PR is mergeable
      if (pr.mergeable === false) {
        reasons.push('PR has merge conflicts');
      }

      // Check required reviews
      const approvedReviews = reviews.filter(review => review.state === 'APPROVED');
      const requestedChanges = reviews.filter(review => review.state === 'CHANGES_REQUESTED');

      if (requestedChanges.length > 0) {
        reasons.push('PR has requested changes');
      }

      if (approvedReviews.length === 0) {
        reasons.push('PR lacks required approvals');
      }

      // Check status checks
      const failedChecks = checks.filter(check => check.conclusion === 'failure');
      if (failedChecks.length > 0) {
        reasons.push(`Failed checks: ${failedChecks.map(c => c.name).join(', ')}`);
      }

      const pendingChecks = checks.filter(check => check.status === 'in_progress' || check.status === 'queued');
      if (pendingChecks.length > 0) {
        reasons.push(`Pending checks: ${pendingChecks.map(c => c.name).join(', ')}`);
      }

      // Apply custom merge rules
      for (const [ruleName, rule] of this.mergeRules) {
        try {
          const ruleResult = await rule.check(pr, reviews, checks);
          if (!ruleResult.allowed) {
            reasons.push(`${ruleName}: ${ruleResult.reason}`);
          }
        } catch (error) {
          console.warn(`Error checking merge rule ${ruleName}:`, error);
        }
      }

    } catch (error) {
      reasons.push(`Error checking merge conditions: ${error}`);
    }

    return {
      allowed: reasons.length === 0,
      reasons
    };
  }

  /**
   * Request reviews
   */
  async requestReviews(owner: string, repo: string, pullNumber: number, options: {
    reviewers?: string[];
    team_reviewers?: string[];
  }): Promise<GitHubPullRequest> {
    const response = await this.apiClient.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number: pullNumber,
      ...options
    });
    return response.data;
  }

  /**
   * Remove review request
   */
  async removeReviewRequest(owner: string, repo: string, pullNumber: number, options: {
    reviewers?: string[];
    team_reviewers?: string[];
  }): Promise<GitHubPullRequest> {
    const response = await this.apiClient.rest.pulls.removeRequestedReviewers({
      owner,
      repo,
      pull_number: pullNumber,
      ...options
    });
    return response.data;
  }

  /**
   * Create review
   */
  async createReview(owner: string, repo: string, pullNumber: number, options: {
    commit_id?: string;
    body?: string;
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
    comments?: Array<{
      path: string;
      position?: number;
      body: string;
      line?: number;
      side?: 'LEFT' | 'RIGHT';
      start_line?: number;
      start_side?: 'LEFT' | 'RIGHT';
    }>;
  }): Promise<GitHubPRReview> {
    const response = await this.apiClient.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      ...options
    });
    return response.data;
  }

  /**
   * Get reviews for PR
   */
  async getReviews(owner: string, repo: string, pullNumber: number): Promise<GitHubPRReview[]> {
    const response = await this.apiClient.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: pullNumber
    });
    return response.data;
  }

  /**
   * Get PR comments
   */
  async getComments(owner: string, repo: string, pullNumber: number): Promise<GitHubPRComment[]> {
    const response = await this.apiClient.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber
    });
    return response.data;
  }

  /**
   * Add comment to PR
   */
  async addComment(owner: string, repo: string, pullNumber: number, body: string): Promise<any> {
    const response = await this.apiClient.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body
    });
    return response.data;
  }

  /**
   * Get check runs for PR
   */
  async getCheckRuns(owner: string, repo: string, pullNumber: number): Promise<GitHubPRCheckRun[]> {
    const pr = await this.getPullRequest(owner, repo, pullNumber);
    const response = await this.apiClient.rest.checks.listForRef({
      owner,
      repo,
      ref: pr.head.sha
    });
    return response.data.check_runs;
  }

  /**
   * Get PR status
   */
  async getPRStatus(owner: string, repo: string, pullNumber: number): Promise<GitHubPRStatus> {
    const [pr, reviews, checks] = await Promise.all([
      this.getPullRequest(owner, repo, pullNumber),
      this.getReviews(owner, repo, pullNumber),
      this.getCheckRuns(owner, repo, pullNumber)
    ]);

    const approvedReviews = reviews.filter(review => review.state === 'APPROVED');
    const requestedChanges = reviews.filter(review => review.state === 'CHANGES_REQUESTED');
    const failedChecks = checks.filter(check => check.conclusion === 'failure');
    const pendingChecks = checks.filter(check => check.status === 'in_progress' || check.status === 'queued');

    let status: GitHubPRStatus = 'pending';

    if (pr.merged) {
      status = 'merged';
    } else if (pr.state === 'closed') {
      status = 'closed';
    } else if (requestedChanges.length > 0 || failedChecks.length > 0) {
      status = 'changes_requested';
    } else if (pendingChecks.length > 0) {
      status = 'pending';
    } else if (approvedReviews.length > 0 && pr.mergeable) {
      status = 'ready_to_merge';
    } else {
      status = 'pending';
    }

    return status;
  }

  /**
   * Auto-assign reviewers based on rules
   */
  async autoAssignReviewers(owner: string, repo: string, pr: GitHubPullRequest): Promise<string[]> {
    const assignedReviewers: string[] = [];

    // Get changed files
    const files = await this.getChangedFiles(owner, repo, pr.number);

    // Apply reviewer assignment rules based on files changed
    const reviewerCandidates = new Set<string>();

    for (const file of files) {
      // Example rules - would be configurable
      if (file.filename.includes('src/api/')) {
        reviewerCandidates.add('backend-team');
      }
      if (file.filename.includes('src/components/')) {
        reviewerCandidates.add('frontend-team');
      }
      if (file.filename.includes('test/') || file.filename.includes('.test.')) {
        reviewerCandidates.add('qa-team');
      }
      if (file.filename.includes('docs/')) {
        reviewerCandidates.add('docs-team');
      }
    }

    // Convert team names to actual reviewers (would use team membership API)
    const reviewers = Array.from(reviewerCandidates).slice(0, 3); // Limit to 3 reviewers

    if (reviewers.length > 0) {
      try {
        await this.requestReviews(owner, repo, pr.number, {
          team_reviewers: reviewers
        });
        assignedReviewers.push(...reviewers);
      } catch (error) {
        console.warn('Failed to auto-assign reviewers:', error);
      }
    }

    return assignedReviewers;
  }

  /**
   * Get changed files in PR
   */
  async getChangedFiles(owner: string, repo: string, pullNumber: number): Promise<any[]> {
    const response = await this.apiClient.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    });
    return response.data;
  }

  /**
   * Setup default automation rules
   */
  private setupDefaultRules(): void {
    // Auto-review assignment rule
    this.reviewRules.set('auto-assign-by-files', {
      apply: async (owner: string, repo: string, pr: GitHubPullRequest) => {
        return await this.autoAssignReviewers(owner, repo, pr);
      }
    });

    // Size-based review requirements
    this.mergeRules.set('size-based-reviews', {
      check: async (pr: GitHubPullRequest, reviews: GitHubPRReview[]) => {
        const additions = pr.additions || 0;
        const deletions = pr.deletions || 0;
        const totalChanges = additions + deletions;

        const approvedReviews = reviews.filter(r => r.state === 'APPROVED').length;

        if (totalChanges > 500 && approvedReviews < 2) {
          return { allowed: false, reason: 'Large PRs require at least 2 approvals' };
        }

        if (totalChanges > 100 && approvedReviews < 1) {
          return { allowed: false, reason: 'PRs over 100 lines require at least 1 approval' };
        }

        return { allowed: true, reason: '' };
      }
    });

    // Branch protection rule
    this.mergeRules.set('branch-protection', {
      check: async (pr: GitHubPullRequest) => {
        if (pr.base.ref === 'main' || pr.base.ref === 'master') {
          // Additional checks for main branch
          return { allowed: true, reason: '' }; // Would implement actual protection checks
        }
        return { allowed: true, reason: '' };
      }
    });
  }

  /**
   * Apply automation rules
   */
  private async applyAutomationRules(owner: string, repo: string, pr: GitHubPullRequest): Promise<void> {
    for (const [ruleName, rule] of this.reviewRules) {
      try {
        await rule.apply(owner, repo, pr);
      } catch (error) {
        console.warn(`Failed to apply review rule ${ruleName}:`, error);
      }
    }
  }

  /**
   * Enable automatic reviews for repository
   */
  async enableAutomaticReviews(owner: string, repo: string): Promise<void> {
    console.log(`Enabling automatic reviews for ${owner}/${repo}`);
    // This would typically involve webhook setup
  }

  /**
   * Sync pull requests to project
   */
  async syncPullRequests(owner: string, repo: string, projectId: string): Promise<number> {
    let syncedCount = 0;
    let page = 1;
    const perPage = 100;

    while (true) {
      const prs = await this.getPullRequests(owner, repo, {
        state: 'open',
        per_page: perPage,
        page
      });

      if (prs.length === 0) break;

      for (const pr of prs) {
        try {
          // This would use the project manager to add PRs
          console.log(`Syncing PR #${pr.number} to project`);
          syncedCount++;
        } catch (error) {
          console.warn(`Failed to sync PR #${pr.number}:`, error);
        }
      }

      if (prs.length < perPage) break;
      page++;
    }

    return syncedCount;
  }

  /**
   * Get PR analytics
   */
  async getPRAnalytics(owner: string, repo: string, days: number = 30): Promise<{
    totalPRs: number;
    openPRs: number;
    mergedPRs: number;
    closedPRs: number;
    avgTimeToMerge: number;
    avgReviewTime: number;
    prsByAuthor: Record<string, number>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [openPRs, closedPRs] = await Promise.all([
      this.getPullRequests(owner, repo, { state: 'open' }),
      this.getPullRequests(owner, repo, { state: 'closed' })
    ]);

    const allPRs = [...openPRs, ...closedPRs].filter(pr =>
      new Date(pr.created_at) >= since
    );

    const mergedPRs = allPRs.filter(pr => pr.merged_at);

    // Calculate average time to merge
    const mergeTimes = mergedPRs
      .filter(pr => pr.merged_at && pr.created_at)
      .map(pr => new Date(pr.merged_at!).getTime() - new Date(pr.created_at).getTime());

    const avgTimeToMerge = mergeTimes.length > 0
      ? mergeTimes.reduce((sum, time) => sum + time, 0) / mergeTimes.length
      : 0;

    // PRs by author
    const prsByAuthor: Record<string, number> = {};
    allPRs.forEach(pr => {
      const author = pr.user?.login || 'unknown';
      prsByAuthor[author] = (prsByAuthor[author] || 0) + 1;
    });

    return {
      totalPRs: allPRs.length,
      openPRs: openPRs.length,
      mergedPRs: mergedPRs.length,
      closedPRs: closedPRs.filter(pr => !pr.merged_at).length,
      avgTimeToMerge: avgTimeToMerge / (1000 * 60 * 60 * 24), // Convert to days
      avgReviewTime: 0, // Would implement review time calculation
      prsByAuthor
    };
  }
}

export default GitHubPRManager;