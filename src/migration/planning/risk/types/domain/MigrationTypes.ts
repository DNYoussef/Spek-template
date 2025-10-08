/**
 * Migration Domain Types
 * Types specific to migration planning and execution
 */

import { TimeFrame } from '../core/BaseRiskTypes';

// Migration Plan Structure
export interface MigrationPlan {
  id: string;
  name: string;
  scope: MigrationScope;
  phases: MigrationPhase[];
  timeline: Timeline;
  resources: ResourcePlan;
  dependencies: Dependency[];
  assumptions: Assumption[];
}

export interface MigrationScope {
  components: string[];
  systems: string[];
  data: string[];
  users: string[];
}

export interface MigrationPhase {
  id: string;
  name: string;
  duration: number;
  prerequisites: string[];
  deliverables: string[];
  risks: string[];
}

export interface Timeline extends TimeFrame {
  phases: MigrationPhase[];
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  type: 'start' | 'checkpoint' | 'deliverable' | 'completion';
  criteria: string[];
  dependencies: string[];
}

// Resource Management
export interface ResourcePlan {
  human: HumanResource[];
  technical: TechnicalResource[];
  financial: FinancialResource;
}

export interface HumanResource {
  role: string;
  count: number;
  skills: string[];
  availability: number; // percentage
  cost_per_hour: number;
}

export interface TechnicalResource {
  type: string;
  specification: string;
  quantity: number;
  duration: string;
  cost: number;
}

export interface FinancialResource {
  budget: number;
  currency: string;
  breakdown: BudgetBreakdown;
  contingency: number;
}

export interface BudgetBreakdown {
  personnel: number;
  technology: number;
  training: number;
  external_services: number;
  infrastructure: number;
  contingency: number;
}

// Dependencies and Constraints
export interface Dependency {
  id: string;
  type: 'technical' | 'business' | 'external';
  description: string;
  dependency_on: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  estimated_resolution: Date;
}

export interface Assumption {
  id: string;
  description: string;
  confidence: number;
  impact_if_false: 'low' | 'medium' | 'high' | 'critical';
  validation_method: string;
  owner: string;
}

// Migration Strategies
export interface MigrationStrategy {
  type: 'big_bang' | 'phased' | 'parallel' | 'pilot';
  description: string;
  advantages: string[];
  disadvantages: string[];
  risk_profile: string;
  duration_estimate: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface MigrationApproach {
  strategy: MigrationStrategy;
  suitabilityScore?: number; // Strategy suitability score (0-100)
  rollback_plan: RollbackPlan;
  testing_approach: TestingApproach;
  communication_plan: CommunicationPlan;
}

export interface RollbackPlan {
  triggers: string[];
  steps: RollbackStep[];
  time_to_rollback: string;
  data_recovery: string;
}

export interface RollbackStep {
  order: number;
  description: string;
  estimated_time: string;
  responsible_party: string;
}

export interface TestingApproach {
  phases: TestingPhase[];
  environments: TestingEnvironment[];
  acceptance_criteria: AcceptanceCriteria[];
}

export interface TestingPhase {
  name: string;
  type: string;
  duration: string;
  entry_criteria: string[];
  exit_criteria: string[];
}

export interface TestingEnvironment {
  name: string;
  purpose: string;
  configuration: string;
  data_requirements: string[];
}

export interface AcceptanceCriteria {
  id: string;
  description: string;
  type: 'functional' | 'performance' | 'security' | 'usability';
  measurement: string;
  threshold: any;
}

export interface CommunicationPlan {
  stakeholder_groups: StakeholderGroup[];
  communication_channels: CommunicationChannel[];
  timeline: CommunicationTimeline[];
}

export interface StakeholderGroup {
  name: string;
  members: string[];
  interest_level: string;
  influence_level: string;
  communication_frequency: string;
}

export interface CommunicationChannel {
  type: string;
  audience: string[];
  frequency: string;
  content_type: string;
}

export interface CommunicationTimeline {
  milestone: string;
  communications: CommunicationEvent[];
}

export interface CommunicationEvent {
  type: string;
  audience: string;
  timing: string;
  content_summary: string;
}