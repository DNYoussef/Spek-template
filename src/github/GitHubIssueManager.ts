/**
 * GitHub Issue Manager
 * Automated issue management, labeling, and project integration
 */

import { GitHubAPIClient } from './GitHubAPIClient';
import {
  GitHubIssue,
  GitHubLabel,
  GitHubMilestone,
  GitHubIssueComment
} from '../types/github-types';

export class GitHubIssueManager {
  private apiClient: GitHubAPIClient;
  private labelCache = new Map<string, GitHubLabel[]>();
  private automationRules = new Map<string, any>();

  constructor(apiClient: GitHubAPIClient) {
    this.apiClient = apiClient;
    this.setupDefaultAutomationRules();
  }

  /**
   * Get repository issues
   */
  async getIssues(owner: string, repo: string, options: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    assignee?: string;
    creator?: string;
    mentioned?: string;
    milestone?: string | number;
    since?: Date;
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubIssue[]> {
    const params: any = { owner, repo };

    if (options.state) params.state = options.state;
    if (options.labels?.length) params.labels = options.labels.join(',');
    if (options.assignee) params.assignee = options.assignee;
    if (options.creator) params.creator = options.creator;
    if (options.mentioned) params.mentioned = options.mentioned;
    if (options.milestone) params.milestone = options.milestone;
    if (options.since) params.since = options.since.toISOString();
    if (options.sort) params.sort = options.sort;
    if (options.direction) params.direction = options.direction;
    if (options.per_page) params.per_page = options.per_page;
    if (options.page) params.page = options.page;

    const response = await this.apiClient.rest.issues.listForRepo(params);
    return response.data.filter((issue: any) => !issue.pull_request);
  }

  /**
   * Get single issue
   */
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const response = await this.apiClient.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
    return response.data;
  }

  /**
   * Create new issue
   */
  async createIssue(owner: string, repo: string, options: {
    title: string;
    body?: string;
    assignees?: string[];
    milestone?: number;
    labels?: string[];
  }): Promise<GitHubIssue> {
    const response = await this.apiClient.rest.issues.create({
      owner,
      repo,
      ...options
    });

    const issue = response.data;

    // Apply automation rules
    await this.applyAutomationRules(owner, repo, issue);

    return issue;
  }

  /**
   * Update issue
   */
  async updateIssue(owner: string, repo: string, issueNumber: number, options: {
    title?: string;
    body?: string;
    assignees?: string[];
    milestone?: number | null;
    labels?: string[];
    state?: 'open' | 'closed';
    state_reason?: 'completed' | 'not_planned' | 'reopened';
  }): Promise<GitHubIssue> {
    const response = await this.apiClient.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...options
    });
    return response.data;
  }

  /**
   * Add labels to issue
   */
  async addLabels(owner: string, repo: string, issueNumber: number, labels: string[]): Promise<GitHubLabel[]> {
    const response = await this.apiClient.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels
    });
    return response.data;
  }

  /**
   * Remove label from issue
   */
  async removeLabel(owner: string, repo: string, issueNumber: number, label: string): Promise<void> {
    await this.apiClient.rest.issues.removeLabel({
      owner,
      repo,
      issue_number: issueNumber,
      name: label
    });
  }

  /**
   * Assign users to issue
   */
  async assignUsers(owner: string, repo: string, issueNumber: number, assignees: string[]): Promise<GitHubIssue> {
    const response = await this.apiClient.rest.issues.addAssignees({
      owner,
      repo,
      issue_number: issueNumber,
      assignees
    });
    return response.data;
  }

  /**
   * Remove assignees from issue
   */
  async removeAssignees(owner: string, repo: string, issueNumber: number, assignees: string[]): Promise<GitHubIssue> {
    const response = await this.apiClient.rest.issues.removeAssignees({
      owner,
      repo,
      issue_number: issueNumber,
      assignees
    });
    return response.data;
  }

  /**
   * Add comment to issue
   */
  async addComment(owner: string, repo: string, issueNumber: number, body: string): Promise<GitHubIssueComment> {
    const response = await this.apiClient.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body
    });
    return response.data;
  }

  /**
   * Get issue comments
   */
  async getComments(owner: string, repo: string, issueNumber: number): Promise<GitHubIssueComment[]> {
    const response = await this.apiClient.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber
    });
    return response.data;
  }

  /**
   * Close issue
   */
  async closeIssue(owner: string, repo: string, issueNumber: number, reason?: 'completed' | 'not_planned'): Promise<GitHubIssue> {
    return await this.updateIssue(owner, repo, issueNumber, {
      state: 'closed',
      state_reason: reason
    });
  }

  /**
   * Reopen issue
   */
  async reopenIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    return await this.updateIssue(owner, repo, issueNumber, {
      state: 'open',
      state_reason: 'reopened'
    });
  }

  /**
   * Get repository labels
   */
  async getLabels(owner: string, repo: string): Promise<GitHubLabel[]> {
    const cacheKey = `${owner}/${repo}`;
    if (this.labelCache.has(cacheKey)) {
      return this.labelCache.get(cacheKey)!;
    }

    const response = await this.apiClient.rest.issues.listLabelsForRepo({
      owner,
      repo
    });

    const labels = response.data;
    this.labelCache.set(cacheKey, labels);
    return labels;
  }

  /**
   * Create label
   */
  async createLabel(owner: string, repo: string, options: {
    name: string;
    color: string;
    description?: string;
  }): Promise<GitHubLabel> {
    const response = await this.apiClient.rest.issues.createLabel({
      owner,
      repo,
      ...options
    });

    // Clear cache
    this.labelCache.delete(`${owner}/${repo}`);

    return response.data;
  }

  /**
   * Update label
   */
  async updateLabel(owner: string, repo: string, currentName: string, options: {
    new_name?: string;
    color?: string;
    description?: string;
  }): Promise<GitHubLabel> {
    const response = await this.apiClient.rest.issues.updateLabel({
      owner,
      repo,
      name: currentName,
      ...options
    });

    // Clear cache
    this.labelCache.delete(`${owner}/${repo}`);

    return response.data;
  }

  /**
   * Delete label
   */
  async deleteLabel(owner: string, repo: string, name: string): Promise<void> {
    await this.apiClient.rest.issues.deleteLabel({
      owner,
      repo,
      name
    });

    // Clear cache
    this.labelCache.delete(`${owner}/${repo}`);
  }

  /**
   * Setup default labels for repository
   */
  async setupDefaultLabels(owner: string, repo: string): Promise<void> {
    const defaultLabels = [
      { name: 'bug', color: 'd73a4a', description: 'Something isn\'t working' },
      { name: 'enhancement', color: 'a2eeef', description: 'New feature or request' },
      { name: 'documentation', color: '0075ca', description: 'Improvements or additions to documentation' },
      { name: 'good first issue', color: '7057ff', description: 'Good for newcomers' },
      { name: 'help wanted', color: '008672', description: 'Extra attention is needed' },
      { name: 'invalid', color: 'e4e669', description: 'This doesn\'t seem right' },
      { name: 'question', color: 'd876e3', description: 'Further information is requested' },
      { name: 'wontfix', color: 'ffffff', description: 'This will not be worked on' },
      { name: 'duplicate', color: 'cfd3d7', description: 'This issue or pull request already exists' },
      { name: 'priority:high', color: 'b60205', description: 'High priority issue' },
      { name: 'priority:medium', color: 'fbca04', description: 'Medium priority issue' },
      { name: 'priority:low', color: '0e8a16', description: 'Low priority issue' }
    ];

    const existingLabels = await this.getLabels(owner, repo);
    const existingLabelNames = new Set(existingLabels.map(label => label.name));

    for (const label of defaultLabels) {
      if (!existingLabelNames.has(label.name)) {
        try {
          await this.createLabel(owner, repo, label);
          console.log(`Created label: ${label.name}`);
        } catch (error) {
          console.warn(`Failed to create label ${label.name}:`, error);
        }
      }
    }
  }

  /**
   * Apply automatic labeling
   */
  async autoLabel(owner: string, repo: string, issue: GitHubIssue): Promise<string[]> {
    const suggestedLabels: string[] = [];
    const content = (issue.title + ' ' + (issue.body || '')).toLowerCase();

    // Bug detection
    if (content.includes('bug') || content.includes('error') || content.includes('broken') ||
        content.includes('issue') || content.includes('problem') || content.includes('fail')) {
      suggestedLabels.push('bug');
    }

    // Enhancement detection
    if (content.includes('feature') || content.includes('enhancement') || content.includes('improve') ||
        content.includes('add') || content.includes('new') || content.includes('request')) {
      suggestedLabels.push('enhancement');
    }

    // Documentation detection
    if (content.includes('doc') || content.includes('documentation') || content.includes('readme') ||
        content.includes('guide') || content.includes('tutorial')) {
      suggestedLabels.push('documentation');
    }

    // Question detection
    if (content.includes('how') || content.includes('why') || content.includes('?') ||
        content.includes('question') || content.includes('help')) {
      suggestedLabels.push('question');
    }

    // Priority detection
    if (content.includes('urgent') || content.includes('critical') || content.includes('blocker')) {
      suggestedLabels.push('priority:high');
    } else if (content.includes('important') || content.includes('asap')) {
      suggestedLabels.push('priority:medium');
    }

    // Apply labels if any were suggested
    if (suggestedLabels.length > 0) {
      await this.addLabels(owner, repo, issue.number, suggestedLabels);
    }

    return suggestedLabels;
  }

  /**
   * Setup automation rules
   */
  private setupDefaultAutomationRules(): void {
    // Auto-assign based on issue type
    this.automationRules.set('auto-assign-bug', {
      condition: (issue: GitHubIssue) => issue.labels?.some(label => label.name === 'bug'),
      action: async (owner: string, repo: string, issue: GitHubIssue) => {
        // Would assign to bug triage team
        console.log(`Auto-assigning bug issue #${issue.number}`);
      }
    });

    // Auto-milestone for high priority
    this.automationRules.set('auto-milestone-priority', {
      condition: (issue: GitHubIssue) => issue.labels?.some(label => label.name === 'priority:high'),
      action: async (owner: string, repo: string, issue: GitHubIssue) => {
        // Would assign to current milestone
        console.log(`Auto-milestoning high priority issue #${issue.number}`);
      }
    });
  }

  /**
   * Apply automation rules to issue
   */
  private async applyAutomationRules(owner: string, repo: string, issue: GitHubIssue): Promise<void> {
    for (const [ruleName, rule] of this.automationRules) {
      try {
        if (rule.condition(issue)) {
          await rule.action(owner, repo, issue);
        }
      } catch (error) {
        console.warn(`Failed to apply automation rule ${ruleName}:`, error);
      }
    }
  }

  /**
   * Enable automatic labeling for repository
   */
  async enableAutomaticLabeling(owner: string, repo: string): Promise<void> {
    console.log(`Enabling automatic labeling for ${owner}/${repo}`);
    // This would typically involve webhook setup
  }

  /**
   * Sync issues to project
   */
  async syncIssues(owner: string, repo: string, projectId: string): Promise<number> {
    let syncedCount = 0;
    let page = 1;
    const perPage = 100;

    while (true) {
      const issues = await this.getIssues(owner, repo, {
        state: 'open',
        per_page: perPage,
        page
      });

      if (issues.length === 0) break;

      for (const issue of issues) {
        try {
          // This would use the project manager to add issues
          console.log(`Syncing issue #${issue.number} to project`);
          syncedCount++;
        } catch (error) {
          console.warn(`Failed to sync issue #${issue.number}:`, error);
        }
      }

      if (issues.length < perPage) break;
      page++;
    }

    return syncedCount;
  }

  /**
   * Get issue analytics
   */
  async getIssueAnalytics(owner: string, repo: string, days: number = 30): Promise<{
    totalIssues: number;
    openIssues: number;
    closedIssues: number;
    avgTimeToClose: number;
    issuesByLabel: Record<string, number>;
    issuesByAssignee: Record<string, number>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [openIssues, closedIssues] = await Promise.all([
      this.getIssues(owner, repo, { state: 'open', since }),
      this.getIssues(owner, repo, { state: 'closed', since })
    ]);

    const totalIssues = openIssues.length + closedIssues.length;

    // Calculate average time to close
    const closeTimes = closedIssues
      .filter(issue => issue.closed_at && issue.created_at)
      .map(issue => new Date(issue.closed_at!).getTime() - new Date(issue.created_at).getTime());

    const avgTimeToClose = closeTimes.length > 0
      ? closeTimes.reduce((sum, time) => sum + time, 0) / closeTimes.length
      : 0;

    // Issues by label
    const issuesByLabel: Record<string, number> = {};
    [...openIssues, ...closedIssues].forEach(issue => {
      issue.labels?.forEach(label => {
        const labelName = typeof label === 'string' ? label : label.name;
        issuesByLabel[labelName] = (issuesByLabel[labelName] || 0) + 1;
      });
    });

    // Issues by assignee
    const issuesByAssignee: Record<string, number> = {};
    [...openIssues, ...closedIssues].forEach(issue => {
      issue.assignees?.forEach(assignee => {
        issuesByAssignee[assignee.login] = (issuesByAssignee[assignee.login] || 0) + 1;
      });
    });

    return {
      totalIssues,
      openIssues: openIssues.length,
      closedIssues: closedIssues.length,
      avgTimeToClose: avgTimeToClose / (1000 * 60 * 60 * 24), // Convert to days
      issuesByLabel,
      issuesByAssignee
    };
  }
}

export default GitHubIssueManager;