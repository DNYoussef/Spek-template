/**
 * Distribution Engine Types
 * Task analysis and decomposition engine types
 * NASA Rule 10 Compliant - Extracted from TaskDistributor.ts
 */

// MECE Analysis Types
export interface MECEValidationResult {
  isValid: boolean;
  overlaps: SemanticOverlap[];
  gaps: CoverageGap[];
  score: number;
  recommendations: string[];
}

export interface SemanticOverlap {
  task1Id: string;
  task2Id: string;
  similarity: number;
  conflictArea: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CoverageGap {
  domain: string;
  requiredCapability: string;
  severity: 'low' | 'medium' | 'high';
  suggestedTasks: string[];
}

// Domain coverage requirements
export interface DomainRequirements {
  [domain: string]: string[];
}

// Agent capability matching
export interface AgentCapability {
  agentId: string;
  domain: string;
  capabilities: string[];
  currentLoad: number;
  maxLoad: number;
  efficiency: number;
  availability: boolean;
}

export interface CapabilityMatcher {
  match(requirements: string[], agents: AgentCapability[]): MatchResult[];
  scoreMatch(requirements: string[], capabilities: string[]): number;
}

export interface MatchResult {
  agentId: string;
  score: number;
  matchedCapabilities: string[];
  missingCapabilities: string[];
  loadAfterAssignment: number;
}

// Load balancing
export interface LoadBalancer {
  balance(assignments: TaskAssignment[], agents: AgentCapability[]): RebalanceRecommendation[];
  calculateLoad(agentId: string, assignments: TaskAssignment[]): number;
  findOptimalAssignment(task: SubTask, agents: AgentCapability[]): string;
}

export interface RebalanceRecommendation {
  type: 'reassign' | 'redistribute' | 'scale_up' | 'scale_down';
  taskId: string;
  fromAgent: string;
  toAgent: string;
  reason: string;
  expectedImprovement: number;
}