/**
 * deployment-types.ts - Deployment Configuration Type Definitions
 * @stub true
 * @architecture Deployment and infrastructure type system
 */

// Deployment environment
export type DeploymentEnvironment = 'development' | 'staging' | 'production' | 'test';

// Deployment strategy
export type DeploymentStrategy = 'blue-green' | 'canary' | 'rolling' | 'recreate';

// Deployment configuration
export interface DeploymentConfig {
  readonly environment: DeploymentEnvironment;
  readonly strategy: DeploymentStrategy;
  readonly version: string;
  readonly replicas?: number;
  readonly resources?: DeploymentResources;
  readonly healthCheck?: HealthCheckConfig;
}

// Deployment resources
export interface DeploymentResources {
  readonly cpu: string; // e.g., "1000m" for 1 CPU
  readonly memory: string; // e.g., "512Mi"
  readonly storage?: string;
}

// Health check configuration
export interface HealthCheckConfig {
  readonly enabled: boolean;
  readonly path: string;
  readonly interval: number; // milliseconds
  readonly timeout: number;
  readonly healthyThreshold: number;
  readonly unhealthyThreshold: number;
}

// Deployment status
export interface DeploymentStatus {
  readonly id: string;
  readonly environment: DeploymentEnvironment;
  readonly version: string;
  readonly status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rolled-back';
  readonly startTime: number;
  readonly endTime?: number;
  readonly message?: string;
  readonly phase?: string;
}

// Additional exports for deployment management
export interface DeploymentExecution {
  readonly id: string;
  readonly config: DeploymentConfig;
  readonly status: DeploymentStatus;
  readonly startTime: number;
  readonly endTime?: number;
  readonly artifacts: readonly DeploymentArtifact[];
  readonly logs: readonly string[];
  strategy?: DeploymentStrategy;
  environment?: DeploymentEnvironment;
}

export interface DeploymentArtifact {
  readonly id: string;
  readonly name: string;
  readonly type: 'binary' | 'config' | 'script' | 'manifest';
  readonly url: string;
  readonly checksum: string;
  readonly size: number;
}

export interface DeploymentResult {
  readonly success: boolean;
  readonly deploymentId: string;
  readonly environment: DeploymentEnvironment;
  readonly version: string;
  readonly duration: number;
  readonly error?: DeploymentError;
}

export interface DeploymentError {
  readonly code: string;
  readonly message: string;
  readonly stack?: string;
  readonly timestamp: number;
  readonly recoverable: boolean;
}

export interface Environment {
  readonly name: DeploymentEnvironment;
  readonly url: string;
  readonly active: boolean;
  readonly config: PlatformConfig;
  readonly lastDeployed?: number;
  readonly type?: string;
}

export interface PlatformConfig {
  readonly provider: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'docker';
  readonly region: string;
  readonly clusterName?: string;
  readonly namespace?: string;
  readonly settings: Record<string, unknown>;
}

export interface ComplianceCheck {
  readonly id: string;
  readonly type: string;
  readonly required: boolean;
  readonly status: ComplianceStatus;
  readonly message: string;
  readonly timestamp: number;
  readonly name?: string;
  readonly severity?: 'low' | 'medium' | 'high' | 'critical';
  readonly description?: string;
  readonly details?: Record<string, unknown>;
}

export enum ComplianceStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
  SKIPPED = 'SKIPPED'
}

export interface AuditEvent {
  readonly id: string;
  readonly type: 'deployment' | 'rollback' | 'scale' | 'config-change';
  readonly environment: DeploymentEnvironment;
  readonly user: string;
  readonly timestamp: number;
  readonly details: Record<string, unknown>;
  readonly compliance: readonly ComplianceCheck[];
  readonly outcome?: 'success' | 'failure' | 'partial';
  readonly actor?: string;
  readonly resource?: string;
  readonly action?: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
