/**
 * GitHub Workflow Manager
 * Manages GitHub Actions workflows, runs, and CI/CD automation
 */

import { GitHubAPIClient } from './GitHubAPIClient';
import {
  GitHubWorkflow,
  GitHubWorkflowRun,
  GitHubWorkflowJob,
  GitHubArtifact
} from '../types/github-types';

export class GitHubWorkflowManager {
  private apiClient: GitHubAPIClient;
  private workflowCache = new Map<string, GitHubWorkflow[]>();

  constructor(apiClient: GitHubAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get workflows for repository
   */
  async getWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    const cacheKey = `${owner}/${repo}`;
    if (this.workflowCache.has(cacheKey)) {
      return this.workflowCache.get(cacheKey)!;
    }

    const response = await this.apiClient.rest.actions.listRepoWorkflows({
      owner,
      repo
    });

    const workflows = response.data.workflows;
    this.workflowCache.set(cacheKey, workflows);
    return workflows;
  }

  /**
   * Get single workflow
   */
  async getWorkflow(owner: string, repo: string, workflowId: string | number): Promise<GitHubWorkflow> {
    const response = await this.apiClient.rest.actions.getWorkflow({
      owner,
      repo,
      workflow_id: workflowId
    });
    return response.data;
  }

  /**
   * Get workflow runs
   */
  async getWorkflowRuns(owner: string, repo: string, options: {
    workflow_id?: string | number;
    actor?: string;
    branch?: string;
    event?: string;
    status?: 'completed' | 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'skipped' | 'stale' | 'success' | 'timed_out' | 'in_progress' | 'queued' | 'requested' | 'waiting';
    created?: string;
    exclude_pull_requests?: boolean;
    check_suite_id?: number;
    head_sha?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubWorkflowRun[]> {
    const params: any = { owner, repo };
    Object.assign(params, options);

    const response = await this.apiClient.rest.actions.listWorkflowRunsForRepo(params);
    return response.data.workflow_runs;
  }

  /**
   * Get single workflow run
   */
  async getWorkflowRun(owner: string, repo: string, runId: number): Promise<GitHubWorkflowRun> {
    const response = await this.apiClient.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: runId
    });
    return response.data;
  }

  /**
   * Trigger workflow dispatch
   */
  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: string | number,
    ref: string,
    inputs?: Record<string, any>
  ): Promise<void> {
    await this.apiClient.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs
    });

    console.log(`Triggered workflow ${workflowId} on ${ref}`);
  }

  /**
   * Cancel workflow run
   */
  async cancelWorkflowRun(owner: string, repo: string, runId: number): Promise<void> {
    await this.apiClient.rest.actions.cancelWorkflowRun({
      owner,
      repo,
      run_id: runId
    });

    console.log(`Cancelled workflow run ${runId}`);
  }

  /**
   * Re-run workflow
   */
  async rerunWorkflow(owner: string, repo: string, runId: number, options: {
    enable_debug_logging?: boolean;
  } = {}): Promise<void> {
    await this.apiClient.rest.actions.reRunWorkflow({
      owner,
      repo,
      run_id: runId,
      ...options
    });

    console.log(`Re-running workflow run ${runId}`);
  }

  /**
   * Re-run failed jobs
   */
  async rerunFailedJobs(owner: string, repo: string, runId: number, options: {
    enable_debug_logging?: boolean;
  } = {}): Promise<void> {
    await this.apiClient.rest.actions.reRunWorkflowFailedJobs({
      owner,
      repo,
      run_id: runId,
      ...options
    });

    console.log(`Re-running failed jobs for workflow run ${runId}`);
  }

  /**
   * Get workflow run jobs
   */
  async getWorkflowRunJobs(owner: string, repo: string, runId: number, options: {
    filter?: 'latest' | 'all';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubWorkflowJob[]> {
    const response = await this.apiClient.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: runId,
      ...options
    });
    return response.data.jobs;
  }

  /**
   * Get job
   */
  async getJob(owner: string, repo: string, jobId: number): Promise<GitHubWorkflowJob> {
    const response = await this.apiClient.rest.actions.getJobForWorkflowRun({
      owner,
      repo,
      job_id: jobId
    });
    return response.data;
  }

  /**
   * Download job logs
   */
  async downloadJobLogs(owner: string, repo: string, jobId: number): Promise<string> {
    const response = await this.apiClient.rest.actions.downloadJobLogsForWorkflowRun({
      owner,
      repo,
      job_id: jobId
    });
    return response.data as string;
  }

  /**
   * Download workflow run logs
   */
  async downloadWorkflowRunLogs(owner: string, repo: string, runId: number): Promise<ArrayBuffer> {
    const response = await this.apiClient.rest.actions.downloadWorkflowRunLogs({
      owner,
      repo,
      run_id: runId
    });
    return response.data as ArrayBuffer;
  }

  /**
   * Delete workflow run logs
   */
  async deleteWorkflowRunLogs(owner: string, repo: string, runId: number): Promise<void> {
    await this.apiClient.rest.actions.deleteWorkflowRunLogs({
      owner,
      repo,
      run_id: runId
    });

    console.log(`Deleted logs for workflow run ${runId}`);
  }

  /**
   * Get workflow run artifacts
   */
  async getWorkflowRunArtifacts(owner: string, repo: string, runId: number): Promise<GitHubArtifact[]> {
    const response = await this.apiClient.rest.actions.listWorkflowRunArtifacts({
      owner,
      repo,
      run_id: runId
    });
    return response.data.artifacts;
  }

  /**
   * Get repository artifacts
   */
  async getRepositoryArtifacts(owner: string, repo: string, options: {
    per_page?: number;
    page?: number;
    name?: string;
  } = {}): Promise<GitHubArtifact[]> {
    const response = await this.apiClient.rest.actions.listArtifactsForRepo({
      owner,
      repo,
      ...options
    });
    return response.data.artifacts;
  }

  /**
   * Download artifact
   */
  async downloadArtifact(owner: string, repo: string, artifactId: number): Promise<ArrayBuffer> {
    const response = await this.apiClient.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: artifactId,
      archive_format: 'zip'
    });
    return response.data as ArrayBuffer;
  }

  /**
   * Delete artifact
   */
  async deleteArtifact(owner: string, repo: string, artifactId: number): Promise<void> {
    await this.apiClient.rest.actions.deleteArtifact({
      owner,
      repo,
      artifact_id: artifactId
    });

    console.log(`Deleted artifact ${artifactId}`);
  }

  /**
   * Get repository secrets
   */
  async getSecrets(owner: string, repo: string): Promise<any[]> {
    const response = await this.apiClient.rest.actions.listRepoSecrets({
      owner,
      repo
    });
    return response.data.secrets;
  }

  /**
   * Create or update repository secret
   */
  async createOrUpdateSecret(
    owner: string,
    repo: string,
    secretName: string,
    secretValue: string
  ): Promise<void> {
    // First get the repository public key for encryption
    const keyResponse = await this.apiClient.rest.actions.getRepoPublicKey({
      owner,
      repo
    });

    // Encrypt the secret value (would use sodium library in real implementation)
    const encryptedValue = this.encryptSecret(secretValue, keyResponse.data.key);

    await this.apiClient.rest.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: secretName,
      encrypted_value: encryptedValue,
      key_id: keyResponse.data.key_id
    });

    console.log(`Created/updated secret: ${secretName}`);
  }

  /**
   * Delete repository secret
   */
  async deleteSecret(owner: string, repo: string, secretName: string): Promise<void> {
    await this.apiClient.rest.actions.deleteRepoSecret({
      owner,
      repo,
      secret_name: secretName
    });

    console.log(`Deleted secret: ${secretName}`);
  }

  /**
   * Get repository variables
   */
  async getVariables(owner: string, repo: string): Promise<any[]> {
    const response = await this.apiClient.rest.actions.listRepoVariables({
      owner,
      repo
    });
    return response.data.variables;
  }

  /**
   * Create repository variable
   */
  async createVariable(
    owner: string,
    repo: string,
    name: string,
    value: string
  ): Promise<void> {
    await this.apiClient.rest.actions.createRepoVariable({
      owner,
      repo,
      name,
      value
    });

    console.log(`Created variable: ${name}`);
  }

  /**
   * Update repository variable
   */
  async updateVariable(
    owner: string,
    repo: string,
    name: string,
    value: string
  ): Promise<void> {
    await this.apiClient.rest.actions.updateRepoVariable({
      owner,
      repo,
      name,
      value
    });

    console.log(`Updated variable: ${name}`);
  }

  /**
   * Delete repository variable
   */
  async deleteVariable(owner: string, repo: string, name: string): Promise<void> {
    await this.apiClient.rest.actions.deleteRepoVariable({
      owner,
      repo,
      name
    });

    console.log(`Deleted variable: ${name}`);
  }

  /**
   * Get workflow run timing
   */
  async getWorkflowRunTiming(owner: string, repo: string, runId: number): Promise<{
    queuedAt: Date;
    startedAt: Date;
    completedAt: Date | null;
    duration: number;
    jobs: Array<{
      name: string;
      startedAt: Date;
      completedAt: Date | null;
      duration: number;
    }>;
  }> {
    const [run, jobs] = await Promise.all([
      this.getWorkflowRun(owner, repo, runId),
      this.getWorkflowRunJobs(owner, repo, runId)
    ]);

    const queuedAt = new Date(run.created_at);
    const startedAt = new Date(run.run_started_at!);
    const completedAt = run.updated_at ? new Date(run.updated_at) : null;
    const duration = completedAt ? completedAt.getTime() - startedAt.getTime() : 0;

    const jobTimings = jobs.map(job => ({
      name: job.name,
      startedAt: new Date(job.started_at),
      completedAt: job.completed_at ? new Date(job.completed_at) : null,
      duration: job.completed_at
        ? new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
        : 0
    }));

    return {
      queuedAt,
      startedAt,
      completedAt,
      duration,
      jobs: jobTimings
    };
  }

  /**
   * Monitor workflow run
   */
  async monitorWorkflowRun(
    owner: string,
    repo: string,
    runId: number,
    onUpdate?: (run: GitHubWorkflowRun) => void,
    pollInterval: number = 30000
  ): Promise<GitHubWorkflowRun> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const run = await this.getWorkflowRun(owner, repo, runId);

          if (onUpdate) {
            onUpdate(run);
          }

          if (run.status === 'completed') {
            resolve(run);
          } else {
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(owner: string, repo: string, days: number = 30): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    cancelledRuns: number;
    avgDuration: number;
    runsByWorkflow: Record<string, number>;
    runsByBranch: Record<string, number>;
    failureRate: number;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const runs = await this.getWorkflowRuns(owner, repo, {
      created: `>=${since.toISOString()}`
    });

    const totalRuns = runs.length;
    const successfulRuns = runs.filter(run => run.conclusion === 'success').length;
    const failedRuns = runs.filter(run => run.conclusion === 'failure').length;
    const cancelledRuns = runs.filter(run => run.conclusion === 'cancelled').length;

    // Calculate average duration
    const completedRuns = runs.filter(run => run.status === 'completed' && run.run_started_at && run.updated_at);
    const durations = completedRuns.map(run =>
      new Date(run.updated_at!).getTime() - new Date(run.run_started_at!).getTime()
    );
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;

    // Runs by workflow
    const runsByWorkflow: Record<string, number> = {};
    runs.forEach(run => {
      const workflowName = run.name || 'Unknown';
      runsByWorkflow[workflowName] = (runsByWorkflow[workflowName] || 0) + 1;
    });

    // Runs by branch
    const runsByBranch: Record<string, number> = {};
    runs.forEach(run => {
      const branch = run.head_branch || 'Unknown';
      runsByBranch[branch] = (runsByBranch[branch] || 0) + 1;
    });

    const failureRate = totalRuns > 0 ? failedRuns / totalRuns : 0;

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      cancelledRuns,
      avgDuration: avgDuration / (1000 * 60), // Convert to minutes
      runsByWorkflow,
      runsByBranch,
      failureRate
    };
  }

  /**
   * Sync workflows
   */
  async syncWorkflows(owner: string, repo: string): Promise<number> {
    const workflows = await this.getWorkflows(owner, repo);
    console.log(`Synced ${workflows.length} workflows for ${owner}/${repo}`);
    return workflows.length;
  }

  /**
   * Encrypt secret (placeholder - would use actual encryption)
   */
  private encryptSecret(secret: string, publicKey: string): string {
    // This is a placeholder - real implementation would use libsodium
    // to encrypt the secret with the repository's public key
    return Buffer.from(secret).toString('base64');
  }

  /**
   * Clear workflow cache
   */
  clearCache(): void {
    this.workflowCache.clear();
  }
}

export default GitHubWorkflowManager;