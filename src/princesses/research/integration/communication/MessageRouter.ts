/**
 * Message Router Types
 * Princess-Queen message routing and protocol types
 * NASA Rule 10 Compliant - Extracted from PrincessQueenIntegration.ts
 */

export interface ResearchResult {
  orderId: string;
  status: 'completed' | 'partial' | 'failed';
  findings: ResearchFinding[];
  metadata: ResultMetadata;
  qualityScore: number;
  confidence: number;
  recommendations?: string[];
  followUpQuestions?: string[];
}

export interface ResearchFinding {
  id: string;
  title: string;
  summary: string;
  source: ResearchSource;
  relevance: number;
  reliability: number;
  timestamp: Date;
  data: any;
  tags: string[];
}

export interface ResearchSource {
  type: 'academic' | 'industry' | 'news' | 'government' | 'internal' | 'expert';
  name: string;
  url?: string;
  credibility: number;
  lastUpdated: Date;
  accessLevel: 'public' | 'restricted' | 'confidential';
}

export interface ResultMetadata {
  processingTime: number;
  resourcesUsed: ResourceUsage;
  methodsApplied: string[];
  limitationsEncountered: string[];
  dataQuality: DataQualityAssessment;
}

export interface ResourceUsage {
  cpuTime: number;
  memoryPeak: number;
  storageUsed: number;
  apiCallsMade: number;
  externalDataSources: number;
  processingSteps: number;
}

export interface DataQualityAssessment {
  completeness: number;
  accuracy: number;
  timeliness: number;
  relevance: number;
  consistency: number;
  overallScore: number;
}

// Cross-Princess knowledge sharing
export interface KnowledgePacket {
  id: string;
  sourceID: string;
  targetDomains: string[];
  type: 'insight' | 'pattern' | 'data' | 'method' | 'lesson_learned';
  content: KnowledgeContent;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  expiryDate?: Date;
}

export interface KnowledgeContent {
  title: string;
  description: string;
  data: any;
  applicability: string[];
  confidence: number;
  sourceQuality: number;
  usageGuidelines: string[];
}

// Emergency escalation
export interface EscalationRequest {
  id: string;
  level: 'technical' | 'resource' | 'quality' | 'deadline' | 'ethical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: EscalationContext;
  suggestedActions: string[];
  requiredResponse: 'guidance' | 'resources' | 'intervention' | 'delegation';
  deadline: Date;
}

export interface EscalationContext {
  orderId: string;
  currentPhase: string;
  blockingIssues: string[];
  resourceConstraints: string[];
  impactAssessment: ImpactAssessment;
}

export interface ImpactAssessment {
  delayRisk: 'none' | 'minor' | 'moderate' | 'significant' | 'severe';
  qualityRisk: 'none' | 'minor' | 'moderate' | 'significant' | 'severe';
  cascadeRisk: 'none' | 'minor' | 'moderate' | 'significant' | 'severe';
  mitigationOptions: string[];
}