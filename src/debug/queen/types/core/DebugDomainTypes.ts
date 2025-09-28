/**
 * Debug Domain Types - Princess domains and drone worker interfaces
 * Extracted from QueenDebugTypes.ts for NASA Rule 10 compliance
 * Focus: Princess domains, drone capabilities, debug specializations
 */

import { DebugSessionId, Timestamp, Duration, createTimestamp } from '../../base/primitives';
import { DebugCapability, DebugContext, DebugEvidence, DebugStrategy } from '../../types/domains/debug-types';

// FSM State Enums - NO STRING EVENTS
export enum DebugOrchestratorState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  ASSIGNING_PRINCESS = 'ASSIGNING_PRINCESS',
  DEPLOYING_DRONES = 'DEPLOYING_DRONES',
  EXECUTING_DEBUG = 'EXECUTING_DEBUG',
  RUNNING_AUDIT = 'RUNNING_AUDIT',
  VALIDATING_QUALITY = 'VALIDATING_QUALITY',
  COLLECTING_EVIDENCE = 'COLLECTING_EVIDENCE',
  INTEGRATING_GITHUB = 'INTEGRATING_GITHUB',
  COMPLETING = 'COMPLETING',
  FAILED = 'FAILED'
}

export enum DebugOrchestratorEvent {
  START_DEBUG = 'START_DEBUG',
  PRINCESS_ASSIGNED = 'PRINCESS_ASSIGNED',
  DRONES_DEPLOYED = 'DRONES_DEPLOYED',
  DEBUG_EXECUTED = 'DEBUG_EXECUTED',
  AUDIT_COMPLETED = 'AUDIT_COMPLETED',
  QUALITY_VALIDATED = 'QUALITY_VALIDATED',
  EVIDENCE_COLLECTED = 'EVIDENCE_COLLECTED',
  GITHUB_INTEGRATED = 'GITHUB_INTEGRATED',
  PROCESS_COMPLETED = 'PROCESS_COMPLETED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  TIMEOUT_REACHED = 'TIMEOUT_REACHED'
}

// Princess Domain Types
export type PrincessDomainName = 'SyntaxPrincess' | 'TypePrincess' | 'RuntimePrincess' | 'IntegrationPrincess' | 'SecurityPrincess' | 'PerformancePrincess';
export type PrincessType = 'syntax' | 'type' | 'runtime' | 'integration' | 'security' | 'performance';

export interface PrincessDomain {
  name: PrincessDomainName;
  type: PrincessType;
  capabilities: DebugCapability[];
  droneCount: number;
  successRate: number;
  specializations: DomainSpecialization[];
  metrics: DomainMetrics;
}

export interface DomainSpecialization {
  name: string;
  expertiseLevel: number;
  toolset: string[];
  supportedLanguages: string[];
}

export interface DomainMetrics {
  totalDebugs: number;
  successfulDebugs: number;
  averageDuration: Duration;
  complexityHandled: number;
  costEfficiency: number;
}

// Drone Worker Types
export type DroneId = string & { readonly __brand: 'DroneId' };
export type DroneStatus = 'idle' | 'working' | 'debugging' | 'validating' | 'maintenance' | 'upgrading';

export interface DroneWorker {
  id: DroneId;
  domain: PrincessDomainName;
  specialization: DebugCapability;
  status: DroneStatus;
  currentTask?: DebugTarget;
  capabilities: DroneCapability[];
  performance: DronePerformance;
  training: DroneTraining;
}

export interface DroneCapability {
  name: string;
  proficiency: number;
  lastUsed: Timestamp;
  successRate: number;
}

export interface DronePerformance {
  tasksCompleted: number;
  averageTime: Duration;
  successRate: number;
  qualityScore: number;
  errorRate: number;
}

export interface DroneTraining {
  lastTrained: Timestamp;
  skillLevel: number;
  certifications: string[];
  weaknesses: string[];
  strengthening: boolean;
}

// Core Debug Target Interface
export interface DebugTarget {
  id: DebugSessionId;
  type: 'import_error' | 'type_error' | 'runtime_error' | 'test_failure' | 'integration_failure' | 'security_issue';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  description: string;
  stackTrace?: string;
  context: DebugContext;
}

export interface DebugResolution {
  targetId: DebugSessionId;
  status: 'fixed' | 'partial' | 'failed' | 'needs_rework';
  changes: DebugChange[];
  evidence: DebugEvidence;
  auditResults: AuditResult[];
  princessDomain: PrincessDomainName;
  droneIds: DroneId[];
  duration: Duration;
  metadata: ResolutionMetadata;
}

export interface DebugChange {
  type: 'import_addition' | 'type_annotation' | 'runtime_fix' | 'security_patch' | 'performance_optimization';
  description: string;
  file: string;
  line?: number;
  before?: string;
  after?: string;
  confidence: number;
  automated: boolean;
}

export interface ResolutionMetadata {
  timestamp: Timestamp;
  strategy: DebugStrategy;
  totalDroneTime: Duration;
  qualityScore: number;
  theaterDetected: boolean;
  gitHubIntegrated: boolean;
}

// Session Management Types
export interface DebugSession {
  id: DebugSessionId;
  target: DebugTarget;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  assignedPrincess: PrincessDomainName;
  deployedDrones: DroneId[];
  progress: DebugProgress;
  events: DebugEvent[];
}

export interface DebugProgress {
  currentStage: number;
  totalStages: number;
  percentage: number;
  estimatedCompletion: Timestamp;
  bottlenecks: string[];
}

export interface DebugEvent {
  timestamp: Timestamp;
  type: 'stage_start' | 'stage_complete' | 'error' | 'warning' | 'milestone';
  stage?: AuditStageName;
  message: string;
  data: Record<string, any>;
}

// Audit Types
export type AuditStageName =
  | 'Theater Detection'
  | 'Sandbox Validation'
  | 'Debug Cycle'
  | 'Final Validation'
  | 'GitHub Recording'
  | 'Enterprise Analysis'
  | 'NASA Enhancement'
  | 'Ultimate Validation'
  | 'Production Approval';

export interface AuditResult {
  stage: number;
  stageName: AuditStageName;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  findings: AuditFinding[];
  evidence: AuditEvidence;
  duration: Duration;
  score: number;
}

export interface AuditFinding {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  location?: string;
  line?: number;
  severity: number;
  actionable: boolean;
  recommendation?: string;
}

export interface AuditEvidence {
  artifacts: EvidenceArtifact[];
  metrics: AuditMetrics;
  logs: LogEntry[];
  screenshots?: string[];
}

export interface EvidenceArtifact {
  type: string;
  path: string;
  size: number;
  checksum: string;
  metadata: Record<string, any>;
}

export interface AuditMetrics {
  startTime: Timestamp;
  endTime: Timestamp;
  duration: Duration;
  resourceUsage: ResourceUsage;
  qualityScore: number;
}

export interface LogEntry {
  timestamp: Timestamp;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, any>;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

// Factory Functions - NASA Rule 10 Compliant (≤60 lines each)
export function createDebugTarget(
  type: DebugTarget['type'],
  file: string,
  description: string,
  severity: DebugTarget['severity'] = 'medium',
  line?: number,
  stackTrace?: string
): DebugTarget {
  // Assert valid inputs
  if (!type || !file || !description) {
    throw new Error('Debug target requires type, file, and description');
  }
  if (description.length < 10) {
    throw new Error('Description must be at least 10 characters');
  }

  return {
    id: `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as DebugSessionId,
    type,
    severity,
    file,
    line,
    description,
    stackTrace,
    context: {} as DebugContext
  };
}

export function createPrincessDomain(
  name: PrincessDomainName,
  type: PrincessType,
  capabilities: DebugCapability[],
  droneCount: number = 5
): PrincessDomain {
  // Assert valid inputs
  if (!name || !type || !capabilities.length) {
    throw new Error('Princess domain requires name, type, and capabilities');
  }
  if (droneCount < 1 || droneCount > 10) {
    throw new Error('Drone count must be between 1 and 10');
  }

  return {
    name,
    type,
    capabilities,
    droneCount,
    successRate: 0.9,
    specializations: [],
    metrics: {
      totalDebugs: 0,
      successfulDebugs: 0,
      averageDuration: 0 as Duration,
      complexityHandled: 0,
      costEfficiency: 0
    }
  };
}

export function createDroneWorker(
  domain: PrincessDomainName,
  specialization: DebugCapability,
  id?: string
): DroneWorker {
  // Assert valid inputs
  if (!domain || !specialization) {
    throw new Error('Drone worker requires domain and specialization');
  }

  const droneId = id || `drone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: droneId as DroneId,
    domain,
    specialization,
    status: 'idle',
    capabilities: [{
      name: specialization,
      proficiency: 0.8 + Math.random() * 0.2,
      lastUsed: Date.now() as Timestamp,
      successRate: 0.85 + Math.random() * 0.15
    }],
    performance: {
      tasksCompleted: 0,
      averageTime: 0 as Duration,
      successRate: 0.9,
      qualityScore: 0.85,
      errorRate: 0.05
    },
    training: {
      lastTrained: Date.now() as Timestamp,
      skillLevel: 0.8,
      certifications: [],
      weaknesses: [],
      strengthening: false
    }
  };
}

export function createDebugSession(target: DebugTarget): DebugSession {
  // Assert valid target
  if (!target || !target.id) {
    throw new Error('Debug session requires valid target with ID');
  }

  return {
    id: target.id,
    target,
    startTime: Date.now() as Timestamp,
    status: 'active',
    assignedPrincess: 'RuntimePrincess', // Default assignment
    deployedDrones: [],
    progress: {
      currentStage: 0,
      totalStages: 9,
      percentage: 0,
      estimatedCompletion: (Date.now() + 300000) as Timestamp, // 5 minutes
      bottlenecks: []
    },
    events: []
  };
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:29:18-04:00 | decomposer@claude-sonnet-4 | Created DebugDomainTypes.ts - debug domain interfaces | DebugDomainTypes.ts | OK | Extracted debug domain types, <500 lines | 0.00 | i5e0b1f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: debug-decomposition-001
- inputs: ["QueenDebugTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->