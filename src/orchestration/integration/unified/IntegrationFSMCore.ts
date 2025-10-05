import { ValidationResult } from '../../../types/validation-types';

/**
 * MEGA SWARM AGENT 100: INTEGRATION SYSTEM KILLER
 * Unified Integration FSM Core - Eliminates All Integration God Objects
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loops
 * FSM-First Design: Centralized integration state management
 */

export enum IntegrationState {
  CONNECTING = 'CONNECTING',
  VALIDATING = 'VALIDATING',
  INTEGRATING = 'INTEGRATING',
  VERIFYING = 'VERIFYING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  ROLLBACK = 'ROLLBACK'
}

export enum IntegrationEvent {
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INTEGRATION_STARTED = 'INTEGRATION_STARTED',
  INTEGRATION_COMPLETED = 'INTEGRATION_COMPLETED',
  VERIFICATION_PASSED = 'VERIFICATION_PASSED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  ROLLBACK_INITIATED = 'ROLLBACK_INITIATED',
  ROLLBACK_COMPLETED = 'ROLLBACK_COMPLETED',
  RETRY_REQUESTED = 'RETRY_REQUESTED'
}

export interface IntegrationContract {
  id: string;
  type: 'CICD' | 'SIEM' | 'ARTIFACT' | 'GITHUB' | 'GENERIC';
  requirements: ContractRequirement[];
  validation: ValidationRule[];
  adapter: AdapterConfig;
  monitoring: MonitoringConfig;
}

export interface ContractRequirement {
  name: string;
  type: 'connection' | 'authentication' | 'permission' | 'schema' | 'version';
  value: any;
  mandatory: boolean;
  validation: (value: any) => boolean;
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'format' | 'range' | 'enum' | 'custom';
  validator: (data: any) => Promise<ValidationResult>;
  retryCount: number; // NASA Rule 10: Fixed retry bounds
}


export interface AdapterConfig {
  type: string;
  endpoint: string;
  authentication: AuthConfig;
  timeout: number;
  retryAttempts: number; // NASA Rule 10: Fixed bounds (max 3)
  batchSize: number;
}

export interface AuthConfig {
  type: 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2' | 'CERTIFICATE';
  credentials: Record<string, string>;
  refreshable: boolean;
}

export interface MonitoringConfig {
  healthCheck: boolean;
  metrics: MetricConfig[];
  alerts: AlertConfig[];
  heartbeatInterval: number;
}

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  threshold?: number;
  enabled: boolean;
}

export interface AlertConfig {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface IntegrationContext {
  contract: IntegrationContract;
  currentState: IntegrationState;
  data: Record<string, any>;
  errors: Error[];
  attempts: number;
  startTime: Date;
  metrics: Record<string, number>;
}

/**
 * Integration State Transition Rules (NASA Rule 10 Compliant)
 * All transitions are deterministic with fixed bounds
 */
export const INTEGRATION_TRANSITIONS: Record<IntegrationState, Record<IntegrationEvent, IntegrationState | null>> = {
  [IntegrationState.CONNECTING]: {
    [IntegrationEvent.CONNECTION_ESTABLISHED]: IntegrationState.VALIDATING,
    [IntegrationEvent.ERROR_OCCURRED]: IntegrationState.ERROR,
    [IntegrationEvent.VALIDATION_PASSED]: null,
    [IntegrationEvent.VALIDATION_FAILED]: null,
    [IntegrationEvent.INTEGRATION_STARTED]: null,
    [IntegrationEvent.INTEGRATION_COMPLETED]: null,
    [IntegrationEvent.VERIFICATION_PASSED]: null,
    [IntegrationEvent.VERIFICATION_FAILED]: null,
    [IntegrationEvent.ROLLBACK_INITIATED]: null,
    [IntegrationEvent.ROLLBACK_COMPLETED]: null,
    [IntegrationEvent.RETRY_REQUESTED]: IntegrationState.CONNECTING
  },
  [IntegrationState.VALIDATING]: {
    [IntegrationEvent.VALIDATION_PASSED]: IntegrationState.INTEGRATING,
    [IntegrationEvent.VALIDATION_FAILED]: IntegrationState.ERROR,
    [IntegrationEvent.ERROR_OCCURRED]: IntegrationState.ERROR,
    [IntegrationEvent.CONNECTION_ESTABLISHED]: null,
    [IntegrationEvent.INTEGRATION_STARTED]: null,
    [IntegrationEvent.INTEGRATION_COMPLETED]: null,
    [IntegrationEvent.VERIFICATION_PASSED]: null,
    [IntegrationEvent.VERIFICATION_FAILED]: null,
    [IntegrationEvent.ROLLBACK_INITIATED]: null,
    [IntegrationEvent.ROLLBACK_COMPLETED]: null,
    [IntegrationEvent.RETRY_REQUESTED]: IntegrationState.VALIDATING
  },
  [IntegrationState.INTEGRATING]: {
    [IntegrationEvent.INTEGRATION_COMPLETED]: IntegrationState.VERIFYING,
    [IntegrationEvent.ERROR_OCCURRED]: IntegrationState.ERROR,
    [IntegrationEvent.CONNECTION_ESTABLISHED]: null,
    [IntegrationEvent.VALIDATION_PASSED]: null,
    [IntegrationEvent.VALIDATION_FAILED]: null,
    [IntegrationEvent.INTEGRATION_STARTED]: null,
    [IntegrationEvent.VERIFICATION_PASSED]: null,
    [IntegrationEvent.VERIFICATION_FAILED]: null,
    [IntegrationEvent.ROLLBACK_INITIATED]: null,
    [IntegrationEvent.ROLLBACK_COMPLETED]: null,
    [IntegrationEvent.RETRY_REQUESTED]: IntegrationState.INTEGRATING
  },
  [IntegrationState.VERIFYING]: {
    [IntegrationEvent.VERIFICATION_PASSED]: IntegrationState.COMPLETE,
    [IntegrationEvent.VERIFICATION_FAILED]: IntegrationState.ERROR,
    [IntegrationEvent.ERROR_OCCURRED]: IntegrationState.ERROR,
    [IntegrationEvent.CONNECTION_ESTABLISHED]: null,
    [IntegrationEvent.VALIDATION_PASSED]: null,
    [IntegrationEvent.VALIDATION_FAILED]: null,
    [IntegrationEvent.INTEGRATION_STARTED]: null,
    [IntegrationEvent.INTEGRATION_COMPLETED]: null,
    [IntegrationEvent.ROLLBACK_INITIATED]: null,
    [IntegrationEvent.ROLLBACK_COMPLETED]: null,
    [IntegrationEvent.RETRY_REQUESTED]: IntegrationState.VERIFYING
  },
  [IntegrationState.COMPLETE]: {
    [IntegrationEvent.ERROR_OCCURRED]: IntegrationState.ERROR,
    [IntegrationEvent.CONNECTION_ESTABLISHED]: null,
    [IntegrationEvent.VALIDATION_PASSED]: null,
    [IntegrationEvent.VALIDATION_FAILED]: null,
    [IntegrationEvent.INTEGRATION_STARTED]: null,
    [IntegrationEvent.INTEGRATION_COMPLETED]: null,
    [IntegrationEvent.VERIFICATION_PASSED]: null,
    [IntegrationEvent.VERIFICATION_FAILED]: null,
    [IntegrationEvent.ROLLBACK_INITIATED]: null,
    [IntegrationEvent.ROLLBACK_COMPLETED]: null,
    [IntegrationEvent.RETRY_REQUESTED]: null
  },
  [IntegrationState.ERROR]: {
    [IntegrationEvent.ROLLBACK_INITIATED]: IntegrationState.ROLLBACK,
    [IntegrationEvent.RETRY_REQUESTED]: IntegrationState.CONNECTING,
    [IntegrationEvent.CONNECTION_ESTABLISHED]: null,
    [IntegrationEvent.VALIDATION_PASSED]: null,
    [IntegrationEvent.VALIDATION_FAILED]: null,
    [IntegrationEvent.INTEGRATION_STARTED]: null,
    [IntegrationEvent.INTEGRATION_COMPLETED]: null,
    [IntegrationEvent.VERIFICATION_PASSED]: null,
    [IntegrationEvent.VERIFICATION_FAILED]: null,
    [IntegrationEvent.ERROR_OCCURRED]: null,
    [IntegrationEvent.ROLLBACK_COMPLETED]: null
  },
  [IntegrationState.ROLLBACK]: {
    [IntegrationEvent.ROLLBACK_COMPLETED]: IntegrationState.CONNECTING,
    [IntegrationEvent.ERROR_OCCURRED]: IntegrationState.ERROR,
    [IntegrationEvent.CONNECTION_ESTABLISHED]: null,
    [IntegrationEvent.VALIDATION_PASSED]: null,
    [IntegrationEvent.VALIDATION_FAILED]: null,
    [IntegrationEvent.INTEGRATION_STARTED]: null,
    [IntegrationEvent.INTEGRATION_COMPLETED]: null,
    [IntegrationEvent.VERIFICATION_PASSED]: null,
    [IntegrationEvent.VERIFICATION_FAILED]: null,
    [IntegrationEvent.ROLLBACK_INITIATED]: null,
    [IntegrationEvent.RETRY_REQUESTED]: null
  }
};

/**
 * Maximum retry attempts (NASA Rule 10: Fixed bounds)
 */
export const MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_BATCH_SIZE = 100;
export const HEARTBEAT_INTERVAL = 60000; // 1 minute

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: integration-killer-001
// inputs: ["integration analysis"]
// tools_used: ["Write"]
// versions: {"model":"mega-swarm-100","prompt":"integration-elimination-v1"}
// === END FOOTER ===