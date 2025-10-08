/**
 * Workflow Builder Types - Core type definitions for FSM architecture
 */

export enum WorkflowStates {
  IDLE = 'idle',
  TEMPLATE_LOADING = 'template_loading',
  BUILDING = 'building',
  DEPLOYING = 'deploying',
  MONITORING = 'monitoring',
  ERROR = 'error'
}

// Backward compatibility alias
export const WorkflowState = WorkflowStates;
export type WorkflowState = WorkflowStates;

export enum WorkflowEvents {
  CREATE_WORKFLOW = 'create_workflow',
  TEMPLATE_LOADED = 'template_loaded',
  BUILD_COMPLETE = 'build_complete',
  DEPLOYMENT_COMPLETE = 'deployment_complete',
  MONITOR_WORKFLOW = 'monitor_workflow',
  MONITORING_COMPLETE = 'monitoring_complete',
  TRIGGER_WORKFLOW = 'trigger_workflow',
  ERROR = 'error',
  RESET = 'reset',
  RETRY = 'retry'
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  jobs: WorkflowJob[];
  environment?: string;
  concurrency?: ConcurrencyConfig;
  permissions?: PermissionsConfig;
}

export interface WorkflowTrigger {
  type: 'push' | 'pull_request' | 'schedule' | 'workflow_dispatch' | 'repository_dispatch';
  config: {
    branches?: string[];
    paths?: string[];
    cron?: string;
    inputs?: Record<string, any>;
  };
}

export interface WorkflowJob {
  id: string;
  name: string;
  runsOn: string;
  needs?: string[];
  if?: string;
  strategy?: {
    matrix?: Record<string, any>;
    failFast?: boolean;
    maxParallel?: number;
  };
  steps: WorkflowStep[];
  environment?: string;
  timeout?: number;
}

export interface WorkflowStep {
  id?: string;
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, any>;
  env?: Record<string, any>;
  if?: string;
  continueOnError?: boolean;
  timeout?: number;
}

export interface ConcurrencyConfig {
  group: string;
  cancelInProgress: boolean;
}

export interface PermissionsConfig {
  contents?: 'read' | 'write';
  issues?: 'read' | 'write';
  pullRequests?: 'read' | 'write';
  actions?: 'read' | 'write';
  checks?: 'read' | 'write';
  deployments?: 'read' | 'write';
  packages?: 'read' | 'write';
  statuses?: 'read' | 'write';
}

export interface WorkflowRun {
  id: number;
  name: string;
  headBranch: string;
  headSha: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  workflowId: number;
  checkSuiteId: number;
  url: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  runStartedAt?: string;
  jobs?: WorkflowRunJob[];
}

export interface WorkflowRunJob {
  id: number;
  runId: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  startedAt?: string;
  completedAt?: string;
  url: string;
  htmlUrl: string;
  steps?: WorkflowRunStep[];
}

export interface WorkflowRunStep {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  number: number;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowContext {
  authManager: any;
  octokit: any;
  logger: any;
  currentTemplate: WorkflowTemplate | null;
  currentWorkflow: any;
  deploymentResult: any;
  monitoringData: any;
  workflowRuns: WorkflowRun[];
  lastError?: Error;
}