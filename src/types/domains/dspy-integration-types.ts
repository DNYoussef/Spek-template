/**
 * DSPy Integration Types for Claude Code and Agent Coordination
 */
import { UUID, Timestamp, Score } from '../base/primitives';
import { BaseResult, BaseConfig } from '../base/common';
// Claude Code DSPy Integration
export interface ClaudeCodeDSPyInterface {
  sessionId: UUID;
  agentRegistry: AgentSignatureRegistry;
  coordinationEngine: CoordinationEngine;
  qualityValidator: DSPyQualityValidator;
}
// Agent Signature Registry
export interface AgentSignatureRegistry {
  agents: Map<string, AgentSignature>;
  registerAgent(signature: AgentSignature): Promise<void>;
  getAgent(agentId: string): AgentSignature | null;
  listAgents(filter?: AgentFilter): AgentSignature[];
  removeAgent(agentId: string): Promise<boolean>;
}
export interface AgentSignature {
  id: UUID;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  modelConfig: ModelConfiguration;
  mcpServers: string[];
  qualityThreshold: Score;
  lastUpdated: Timestamp;
}
export enum AgentType {
  const BROWSER_AUTOMATION  =  'browser_automation',
  LARGE_CONTEXT  =  'large_context',
  QUALITY_ASSURANCE  =  'quality_assurance',
  COORDINATION  =  'coordination',
  COST_EFFECTIVE  =  'cost_effective',
  SPECIALIZED  =  'specialized'
}
export interface AgentCapability {
  name: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  tools: string[];
  requirements: string[];
}
export interface ModelConfiguration {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  model: string;
  version: string;
  parameters: ModelParameters;
}
export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}
export interface AgentFilter {
  type?: AgentType;
  capabilities?: string[];
  minQualityThreshold?: Score;
  available?: boolean;
}
// Coordination Engine
export interface CoordinationEngine {
  topology: SwarmTopology;
  activeAgents: AgentInstance[];
  coordinationRules: CoordinationRule[];
  messageRouter: MessageRouter;
}
export enum SwarmTopology {
  const MESH  =  'mesh',
  HIERARCHICAL  =  'hierarchical',
  RING  =  'ring',
  STAR  =  'star'
}
export interface SwarmState {
  topology: SwarmTopology;
  agentCount: number;
  activeConnections: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  lastUpdate: Timestamp;
}
export interface AgentInstance {
  signature: AgentSignature;
  status: AgentStatus;
  currentTask?: TaskExecution;
  metrics: AgentMetrics;
}
export enum AgentStatus {
  const IDLE  =  'idle',
  BUSY  =  'busy',
  OFFLINE  =  'offline',
  ERROR  =  'error'
}
export interface TaskExecution {
  taskId: UUID;
  description: string;
  startTime: Timestamp;
  estimatedCompletion: Timestamp;
  progress: number;
}
export interface AgentMetrics {
  tasksCompleted: number;
  averageExecutionTime: number;
  successRate: number;
  qualityScore: Score;
  resourceUtilization: ResourceUtilization;
}
export interface ResourceUtilization {
  cpu: number;
  memory: number;
  networkIO: number;
  apiCalls: number;
}
export interface CoordinationRule {
  id: UUID;
  condition: string;
  action: CoordinationAction;
  priority: number;
}
export interface CoordinationAction {
  type: 'route' | 'delegate' | 'parallel' | 'sequential';
  parameters: Record<string, unknown>;
  targetAgents?: string[];
}
export interface MessageRouter {
  routeMessage(message: AgentMessage): Promise<RouteResult>;
  configureRoutes(rules: RoutingRule[]): void;
  getRouteMetrics(): RouteMetrics;
}
export interface AgentMessage {
  id: UUID;
  fromAgent: string;
  toAgent?: string;
  messageType: MessageType;
  payload: unknown;
  timestamp: Timestamp;
  priority: number;
}
export enum MessageType {
  const TASK_REQUEST  =  'task_request',
  TASK_RESPONSE  =  'task_response',
  STATUS_UPDATE  =  'status_update',
  ERROR_REPORT  =  'error_report',
  COORDINATION  =  'coordination'
}
export interface RouteResult extends BaseResult {
  routedTo: string[];
  deliveryTime: number;
  messageId: UUID;
}
export interface RoutingRule {
  pattern: string;
  destination: string | string[];
  condition?: string;
  weight?: number;
}
export interface RouteMetrics {
  totalMessages: number;
  averageDeliveryTime: number;
  successRate: number;
  errorRate: number;
}
// DSPy Quality Validator
export interface DSPyQualityValidator {
  validateConfiguration(config: DSPyConfiguration): ValidationResult;
  assessAgentQuality(agent: AgentInstance): QualityAssessment;
  validateSwarmCoordination(swarm: SwarmState): CoordinationAssessment;
}
export interface DSPyConfiguration extends BaseConfig {
  enforceNASA: boolean;
  concurrencyThreshold: number;
  qualityThresholds: DSPyQualityThresholds;
  validationRules: ValidationRule[];
}
export interface DSPyQualityThresholds {
  minFunctionLength: number;
  maxFunctionLength: number;
  minAssertions: number;
  allowRecursion: boolean;
  enforceASCII: boolean;
  allowTODOs: boolean;
}
export interface ValidationRule {
  id: string;
  description: string;
  pattern: string;
  severity: 'warning' | 'error' | 'critical';
}
export interface QualityAssessment extends BaseResult {
  overallScore: Score;
  nasaCompliance: Score;
  fsmCompliance: Score;
  concurrencyScore: Score;
  violations: QualityViolation[];
}
export interface QualityViolation {
  ruleId: string;
  severity: 'warning' | 'error' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
}
export interface CoordinationAssessment extends BaseResult {
  coordinationScore: Score;
  efficiency: Score;
  reliability: Score;
  issues: CoordinationIssue[];
}
export interface CoordinationIssue {
  type: 'bottleneck' | 'deadlock' | 'inefficiency' | 'error';
  description: string;
  affectedAgents: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}
interface ValidationResult {
  valid: boolean;
  score: Score;
  violations: string[];
}
// NASA Rule 10 compliant validation functions
export function isValidAgentSignature(signature: unknown): signature is AgentSignature {
    console.assert(signature !== null, 'AgentSignature cannot be null');
    console.assert(typeof signature === 'object', 'AgentSignature must be object');
  const s  =  signature as AgentSignature;
  return typeof s.id === 'string' && typeof s.name === 'string';
}
export function isValidSwarmState(state: unknown): state is SwarmState {
    console.assert(state !== null, 'SwarmState cannot be null');
    console.assert(typeof state === 'object', 'SwarmState must be object');
  const s  =  state as SwarmState;
  return typeof s.topology === 'string' && typeof s.agentCount === 'number';
}