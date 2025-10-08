/**
 * GitHub Client Core
 * NASA Rule 10 compliant: Functions <=60 lines, explicit assertions
 * Core GitHub API operations for FSM components
 */

import { Octokit } from '@octokit/rest';
import { Logger } from '../../../utils/Logger';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export interface PullRequestData {
  number: number;
  title: string;
  state: string;
  body: string;
  user: { login: string };
  created_at: string;
  updated_at: string;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
}

export interface IssueData {
  number: number;
  title: string;
  state: string;
  body: string;
  user: { login: string };
  created_at: string;
  updated_at: string;
  labels: Array<{ name: string }>;
}

export interface ProjectData {
  id: number;
  name: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
}

/**
 * Core GitHub client for FSM components
 * Provides authenticated API access with proper error handling
 */
export class GitHubClientCore {
  private octokit: Octokit;
  private logger: Logger;

  constructor(token: string) {
    assert(token && token.length > 0, 'GitHub token required');

    this.octokit = new Octokit({ auth: token });
    this.logger = new Logger('GitHubClientCore');
  }

  /**
   * Get pull request data
   * NASA Rule 10: <=60 lines, 2+ assertions
   */
  async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<PullRequestData> {
    assert(owner && owner.length > 0, 'Owner required');
    assert(repo && repo.length > 0, 'Repository required');
    assert(pullNumber > 0, 'Valid pull request number required');

    try {
      this.logger.debug('Fetching pull request', { owner, repo, pullNumber });

      const { data } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber
      });

      this.logger.info('Pull request fetched', {
        owner,
        repo,
        pullNumber,
        state: data.state
      });

      return {
        number: data.number,
        title: data.title,
        state: data.state,
        body: data.body || '',
        user: { login: data.user?.login || 'unknown' },
        created_at: data.created_at,
        updated_at: data.updated_at,
        head: { ref: data.head.ref, sha: data.head.sha },
        base: { ref: data.base.ref, sha: data.base.sha }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to fetch pull request', {
        owner,
        repo,
        pullNumber,
        error: errorMessage
      });
      throw new Error(`Failed to fetch PR ${pullNumber}: ${errorMessage}`);
    }
  }

  /**
   * Get issue data
   * NASA Rule 10: <=60 lines, 2+ assertions
   */
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<IssueData> {
    assert(owner && owner.length > 0, 'Owner required');
    assert(repo && repo.length > 0, 'Repository required');
    assert(issueNumber > 0, 'Valid issue number required');

    try {
      this.logger.debug('Fetching issue', { owner, repo, issueNumber });

      const { data } = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });

      this.logger.info('Issue fetched', {
        owner,
        repo,
        issueNumber,
        state: data.state
      });

      return {
        number: data.number,
        title: data.title,
        state: data.state,
        body: data.body || '',
        user: { login: data.user?.login || 'unknown' },
        created_at: data.created_at,
        updated_at: data.updated_at,
        labels: data.labels.map(label => ({
          name: typeof label === 'string' ? label : label.name || ''
        }))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to fetch issue', {
        owner,
        repo,
        issueNumber,
        error: errorMessage
      });
      throw new Error(`Failed to fetch issue ${issueNumber}: ${errorMessage}`);
    }
  }

  /**
   * Get project data
   * NASA Rule 10: <=60 lines, 2+ assertions
   */
  async getProject(owner: string, projectNumber: number): Promise<ProjectData> {
    assert(owner && owner.length > 0, 'Owner required');
    assert(projectNumber > 0, 'Valid project number required');

    try {
      this.logger.debug('Fetching project', { owner, projectNumber });

      const { data } = await this.octokit.rest.projects.get({
        project_id: projectNumber
      });

      this.logger.info('Project fetched', {
        owner,
        projectNumber,
        name: data.name
      });

      return {
        id: data.id,
        name: data.name,
        body: data.body || '',
        state: data.state,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to fetch project', {
        owner,
        projectNumber,
        error: errorMessage
      });
      throw new Error(`Failed to fetch project ${projectNumber}: ${errorMessage}`);
    }
  }

  /**
   * Create pull request comment
   * NASA Rule 10: <=60 lines, 2+ assertions
   */
  async createPRComment(
    owner: string,
    repo: string,
    pullNumber: number,
    body: string
  ): Promise<void> {
    assert(owner && owner.length > 0, 'Owner required');
    assert(repo && repo.length > 0, 'Repository required');
    assert(pullNumber > 0, 'Valid pull request number required');
    assert(body && body.length > 0, 'Comment body required');

    try {
      this.logger.debug('Creating PR comment', { owner, repo, pullNumber });

      await this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pullNumber,
        body
      });

      this.logger.info('PR comment created', { owner, repo, pullNumber });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to create PR comment', {
        owner,
        repo,
        pullNumber,
        error: errorMessage
      });
      throw new Error(`Failed to create comment on PR ${pullNumber}: ${errorMessage}`);
    }
  }

  /**
   * Get authenticated user
   * NASA Rule 10: <=60 lines, 1+ assertion
   */
  async getAuthenticatedUser(): Promise<{ login: string; id: number }> {
    try {
      this.logger.debug('Fetching authenticated user');

      const { data } = await this.octokit.rest.users.getAuthenticated();

      this.logger.info('Authenticated user fetched', { login: data.login });

      return {
        login: data.login,
        id: data.id
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to fetch authenticated user', { error: errorMessage });
      throw new Error(`Failed to fetch authenticated user: ${errorMessage}`);
    }
  }
}
