/**
 * GitHub Project Types - Core type definitions for FSM architecture
 */

export enum GitHubProjectStates {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  VALIDATING = 'validating',
  SYNCING = 'syncing',
  ERROR = 'error'
}

export enum GitHubProjectEvents {
  CONNECT = 'connect',
  CONNECTION_SUCCESS = 'connection_success',
  CONNECTION_FAILED = 'connection_failed',
  VALIDATE_TRUTH = 'validate_truth',
  VALIDATION_COMPLETE = 'validation_complete',
  SYNC_DATA = 'sync_data',
  SYNC_COMPLETE = 'sync_complete',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  RESET = 'reset',
  RETRY = 'retry'
}

export interface GitHubTask {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled';
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  labels: string[];
  created_at: string;
  updated_at: string;
  due_date?: string;
  estimate?: number;
  parent_id?: string;
  project_id: string;
  milestone_id?: string;
}

export interface GitHubProject {
  id: string;
  name: string;
  description: string;
  repository: string;
  created_at: string;
  updated_at: string;
}

export interface TruthValidation {
  valid: boolean;
  source: 'github' | 'fallback' | 'cached';
  timestamp: Date;
  confidence: number;
  issues: string[];
}

export interface ConnectionHealth {
  connected: boolean;
  lastSuccessfulCall: Date;
  failureCount: number;
  averageLatency: number;
}

export interface DegradationAnalysis {
  contextSize: number;
  expectedTasks: number;
  actualTasks: number;
  missingTasks: string[];
  outdatedTasks: string[];
  inconsistencies: Array<{
    type: 'status' | 'priority' | 'assignee' | 'content';
    task: string;
    expected: any;
    actual: any;
  }>;
  degradationScore: number;
  trends: Array<{
    timestamp: Date;
    score: number;
  }>;
}

export interface ContextTransferRecord {
  transferId: string;
  sourceAgent: string;
  targetAgent: string;
  contextChecksum: string;
  semanticVector: number[];
  timestamp: number;
  validationScore: number;
  githubIssueId: string;
}

export interface GitHubProjectContext {
  repository: string;
  githubToken?: string;
  connectionHealth: ConnectionHealth;
  cache: Map<string, { data: any; timestamp: Date; ttl: number }>;
  degradationHistory: DegradationAnalysis[];
  transferRecords: Map<string, ContextTransferRecord>;
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  cacheTTL: number;
  currentProjects?: GitHubProject[];
  currentTasks?: GitHubTask[];
  lastValidationResult?: TruthValidation;
  lastError?: Error;
}