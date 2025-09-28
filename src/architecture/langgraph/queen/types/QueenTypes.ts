/**
 * Queen Types - Type definitions for Queen Orchestrator
 * Consolidated type definitions for the Queen hierarchy system
 */

export interface QueenConfiguration {
  maxConcurrentWorkflows: number;
  principalDomains: string[];
  decisionMakingStrategy: 'consensus' | 'hierarchical' | 'autonomous' | 'hybrid';
  resourceAllocationPolicy: 'balanced' | 'priority_based' | 'performance_based' | 'adaptive';
  escalationThresholds: {
    errorRate: number;
    executionTime: number;
    resourceUtilization: number;
    failureCount: number;
  };
  learningEnabled: boolean;
  autonomyLevel: number; // 0-1, where 1 is fully autonomous
}

export interface StrategicObjective {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  domains: string[];
  requirements: ObjectiveRequirement[];
  constraints: ObjectiveConstraint[];
  successCriteria: SuccessCriteria[];
  estimatedDuration: number;
  deadline?: Date;
  dependencies: string[];
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'suspended';
  metadata: {
    created: Date;
    createdBy: string;
    lastModified: Date;
    businessValue: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface ObjectiveRequirement {
  type: 'functional' | 'performance' | 'security' | 'compliance' | 'resource';
  description: string;
  criteria: any;
  mandatory: boolean;
}

export interface ObjectiveConstraint {
  type: 'time' | 'resource' | 'dependency' | 'security' | 'compliance';
  description: string;
  value: any;
  flexible: boolean;
}

export interface SuccessCriteria {
  metric: string;
  target: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  weight: number; // 0-1
}

export interface ResourceAllocation {
  princessId: string;
  allocatedCapacity: number; // 0-1
  currentUtilization: number; // 0-1
  capabilities: string[];
  performance: {
    throughput: number;
    latency: number;
    errorRate: number;
    availability: number;
  };
  constraints: {
    maxConcurrentTasks: number;
    preferredWorkload: string[];
    blacklistedWorkload: string[];
  };
}

export interface ExecutionPlan {
  id: string;
  objectiveId: string;
  name: string;
  phases: ExecutionPhase[];
  resourceAllocation: ResourceAllocation[];
  contingencyPlans: ContingencyPlan[];
  riskAssessment: RiskAssessment;
  timeline: {
    start: Date;
    end: Date;
    milestones: Milestone[];
  };
  dependencies: string[];
  approvalRequired: boolean;
  estimatedCost: number;
}

export interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  workflows: string[];
  dependencies: string[];
  parallelizable: boolean;
  criticalPath: boolean;
  estimatedDuration: number;
  resourceRequirements: ResourceRequirement[];
}

export interface ResourceRequirement {
  type: 'princess' | 'computational' | 'data' | 'external';
  specification: any;
  quantity: number;
  duration: number;
  priority: 'required' | 'preferred' | 'optional';
}

export interface ContingencyPlan {
  id: string;
  trigger: {
    condition: string;
    threshold: any;
  };
  actions: ContingencyAction[];
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContingencyAction {
  type: 'retry' | 'fallback' | 'escalate' | 'abort' | 'reallocate';
  parameters: any;
  priority: number;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
  mitigationStrategies: MitigationStrategy[];
}

export interface Risk {
  id: string;
  description: string;
  category: 'technical' | 'operational' | 'strategic' | 'external';
  probability: number; // 0-1
  impact: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MitigationStrategy {
  riskId: string;
  strategy: string;
  actions: string[];
  cost: number;
  effectiveness: number; // 0-1
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  date: Date;
  dependencies: string[];
  successCriteria: SuccessCriteria[];
  status: 'pending' | 'completed' | 'missed' | 'at_risk';
}

export interface DecisionContext {
  objectiveId: string;
  situation: string;
  options: DecisionOption[];
  constraints: any[];
  timeConstraint: number;
  requiredConfidence: number;
  stakeholders: string[];
}

export interface DecisionOption {
  id: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  cost: number;
  risk: number; // 0-1
  expectedOutcome: any;
  confidence: number; // 0-1
}

export interface DecisionResult {
  selectedOption: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
  reviewRequired: boolean;
  implementationPlan: string[];
}

export interface QueenMetrics {
  activeObjectives: number;
  completedObjectives: number;
  successRate: number;
  averageExecutionTime: number;
  resourceUtilization: Record<string, number>;
  decisionAccuracy: number;
  learningProgress: number;
  autonomyLevel: number;
  systemHealth: {
    overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    components: Record<string, string>;
  };
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:33:45-04:00 | CODEX AGENT 024@Claude Sonnet | Created QueenTypes.ts with consolidated type definitions | QueenTypes.ts | OK | Type definitions for Queen system | 0.00 | g3h8i9j |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-024-queen-types
- inputs: ["QueenOrchestrator.ts refactoring requirements"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->