/**
 * Princess-Queen Integration State Machine
 * FSM-based hierarchy communication architecture
 * NASA Rule 10 Compliant - Extracted from PrincessQueenIntegration.ts
 */

// FSM State and Event Enums
export enum PrincessQueenState {
  IDLE = 'IDLE',
  RECEIVING_ORDER = 'RECEIVING_ORDER',
  PROCESSING_ORDER = 'PROCESSING_ORDER',
  EXECUTING_RESEARCH = 'EXECUTING_RESEARCH',
  SYNTHESIZING_RESULTS = 'SYNTHESIZING_RESULTS',
  REPORTING_BACK = 'REPORTING_BACK',
  SHARING_KNOWLEDGE = 'SHARING_KNOWLEDGE',
  ESCALATING = 'ESCALATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum PrincessQueenEvent {
  ORDER_RECEIVED = 'ORDER_RECEIVED',
  ORDER_VALIDATED = 'ORDER_VALIDATED',
  RESEARCH_STARTED = 'RESEARCH_STARTED',
  RESEARCH_COMPLETED = 'RESEARCH_COMPLETED',
  SYNTHESIS_COMPLETE = 'SYNTHESIS_COMPLETE',
  REPORT_SENT = 'REPORT_SENT',
  KNOWLEDGE_SHARED = 'KNOWLEDGE_SHARED',
  ESCALATION_NEEDED = 'ESCALATION_NEEDED',
  ORDER_ERROR = 'ORDER_ERROR',
  RESET = 'RESET'
}

// Princess-Queen communication interfaces
export interface QueenOrder {
  id: string;
  type: ResearchOrderType;
  priority: OrderPriority;
  payload: ResearchOrderPayload;
  requester: {
    type: 'queen' | 'princess' | 'external';
    id: string;
    domain?: string;
  };
  deadline?: Date;
  resources?: ResourceRequirement[];
  context?: OrderContext;
  createdAt: Date;
}

export type ResearchOrderType =
  | 'research_query'
  | 'trend_analysis'
  | 'competitive_intelligence'
  | 'knowledge_synthesis'
  | 'expert_identification'
  | 'market_analysis'
  | 'technology_assessment'
  | 'collaboration_opportunities'
  | 'risk_assessment'
  | 'strategic_recommendations';

export type OrderPriority = 'routine' | 'normal' | 'high' | 'urgent' | 'emergency';

export interface ResearchOrderPayload {
  query?: string;
  topics?: string[];
  domain?: string;
  timeframe?: {
    start: Date;
    end: Date;
  };
  scope?: {
    depth: 'basic' | 'detailed' | 'comprehensive';
    sources: string[];
    includeCompetitive: boolean;
    includeTrends: boolean;
  };
  constraints?: {
    maxResults: number;
    maxTime: number;
    maxCost: number;
    qualityThreshold: number;
  };
  additionalParameters?: Record<string, any>;
}

export interface ResourceRequirement {
  type: 'cpu' | 'memory' | 'storage' | 'api_calls' | 'external_data' | 'processing_time';
  amount: number;
  unit: string;
  critical: boolean;
}

export interface OrderContext {
  projectId?: string;
  clientId?: string;
  sessionId?: string;
  relatedOrders?: string[];
  dependencies?: string[];
  parentOrder?: string;
  businessContext?: string;
  stakeholders?: string[];
}

export interface ResearchResult {
  orderId: string;
  status: 'completed' | 'partial' | 'failed';
  data: {
    findings: string[];
    sources: string[];
    confidence: number;
    metadata: Record<string, unknown>;
  };
  metrics: {
    duration: number;
    resourcesUsed: number;
    qualityScore: number;
  };
  recommendations?: string[];
  nextSteps?: string[];
}