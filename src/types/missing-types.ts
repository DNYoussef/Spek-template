/**
 * Missing Type Definitions for TS2304 Error Resolution
 * NASA Rule 10 compliant with proper validation
 */
import { UUID, Timestamp, Score, Percentage } from './base/primitives';
import { BaseResult, BaseConfig, BaseOrchestrator } from './base/common';
// Missing TaskPriority and ResearchQuery types
export enum TaskPriority {
  LOW  =  'low',
  MEDIUM  =  'medium',
  HIGH  =  'high',
  CRITICAL  =  'critical'
}
export interface TaskAssignment {
  id: UUID;
  priority: TaskPriority;
  assignedTo: string;
  description: string;
  deadline?: Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
}
export interface ResearchQuery {
  id: UUID;  query: string;
  scope: QueryScope;
  filters: QueryFilter[];
  executionSteps: QueryExecutionStep[];
  timestamp: Timestamp;
}
export enum QueryScope {
  LOCAL  =  'local',
  REPOSITORY  =  'repository',
  WEB  =  'web',
  DOCUMENTATION  =  'documentation'
}
export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith';
  value: string | number | boolean;
}
export interface QueryExecutionStep {
  id: UUID;
  stepType: 'search' | 'filter' | 'transform' | 'aggregate';
  description: string;  parameters: Record<string, unknown>;
  executionTime?: number;
}
export interface ExtractedRelationship {
  source: string;
  target: string;
  relationType: string;
  confidence: Score;
  metadata: Record<string, unknown>;
}
// NOTE: DebugState, DebugEvent are now in domains/debug-types.ts (removed duplicates)
// NOTE: QualityGate* types are now in domains/quality-gate-types.ts (removed duplicates)

// System Integration Types (unique to this file)
export interface SystemIntegrationOrchestrator extends BaseOrchestrator {
  integrationType: 'api' | 'database' | 'filesystem' | 'external';
  connectionConfig: Record<string, unknown>;
}
export interface OverheadReport {
  overheadPercentage: Percentage;
  bottlenecks: string[];
  optimizationSuggestions: string[];
}
// NOTE: EnterpriseConfiguration is in domains/quality-gate-types.ts
// Query Processing Types
export interface QueryOptimizer {
  optimize(query: string): Promise<string>;
  estimateComplexity(query: string): Score;
  suggestImprovements(query: string): string[];
}
// DSPy Integration Types
export interface ClaudeCodeDSPyInterface {
  sessionId: UUID;
  registry: AgentSignatureRegistry;
  coordinator: unknown;
}
export interface AgentSignatureRegistry {
  agents: Map<string, AgentSignature>;
  registerAgent(signature: AgentSignature): Promise<void>;
  getAgent(id: string): AgentSignature | null;
}
export interface AgentSignature {
  id: UUID;
  name: string;
  type: string;
  capabilities: string[];
  qualityThreshold: Score;
}
export interface SwarmState {
  topology: 'mesh' | 'hierarchical' | 'ring' | 'star';
  agentCount: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  lastUpdate: Timestamp;
}
// NASA Rule 10 compliant validation functions (kept - unique to this file)
export function isValidTaskPriority(value: unknown): value is TaskPriority {
    console.assert(value !== null, 'TaskPriority cannot be null');
    console.assert(typeof value === 'string', 'TaskPriority must be string');
  return Object.values(TaskPriority).includes(value as TaskPriority);
}
// NOTE: isValidDebugState, isValidQualityGateConfig, isValidQualityMetrics are in their respective domain files
/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-29T20:48:12-04:00 | backend-dev@claude-sonnet-4 | Create comprehensive missing types for TS2304 fixes | missing-types.ts | OK | Created all major missing types including TaskPriority, ResearchQuery, DebugState, QualityGate types | 0.00 | d8e9f3a |
| 1.0.1   | 2025-09-29T21:12:30-04:00 | coder@sonnet | Fix footer syntax for TS compliance | missing-types.ts | OK | Converted HTML footer const to TS comments | 0.00 | c5f2a7b |
Receipt
- status: OK
- reason_if_blocked: --
- run_id: footer-syntax-fix
- inputs: ["missing-types.ts"]
- tools_used: ["Edit"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */