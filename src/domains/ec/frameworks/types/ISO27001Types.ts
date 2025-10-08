/**
 * ISO27001 Control Mapper Types - Core type definitions for FSM architecture
 */

export enum ISO27001States {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  ASSESSING = 'assessing',
  VALIDATING = 'validating',
  REPORTING = 'reporting',
  ERROR = 'error'
}

export enum ISO27001Events {
  INITIALIZE_CONTROLS = 'initialize_controls',
  INITIALIZATION_COMPLETE = 'initialization_complete',
  START_ASSESSMENT = 'start_assessment',
  ASSESSMENT_COMPLETE = 'assessment_complete',
  START_VALIDATION = 'start_validation',
  VALIDATION_COMPLETE = 'validation_complete',
  GENERATE_REPORT = 'generate_report',
  REPORT_GENERATED = 'report_generated',
  ERROR = 'error',
  RESET = 'reset',
  RETRY = 'retry'
}

export interface ISO27001Config {
  version: string;
  annexAControls: boolean;
  automatedMapping: boolean;
  riskAssessment: boolean;
  managementSystem: boolean;
  continuousImprovement: boolean;
}

export interface ISO27001Control {
  id: string;
  domain: ISO27001Domain;
  title: string;
  objective: string;
  implementationGuidance: string[];
  assessmentCriteria: string[];
  evidenceRequirements: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mandatoryForCertification: boolean;
  relatedControls: string[];
}

export type ISO27001Domain =
  | 'organizational'
  | 'people'
  | 'physical'
  | 'technological';

export interface ISO27001Assessment {
  assessmentId: string;
  timestamp: Date;
  version: string;
  scope: string[];
  controls: any[];
  riskAssessment: RiskAssessmentResult;
  complianceScore: number;
  certificationType: 'self-assessment' | 'internal-audit' | 'external-audit';
  findings: ISO27001Finding[];
  recommendations: string[];
  evidencePackage: any[];
  status: 'completed' | 'in-progress' | 'failed';
}

export interface RiskAssessmentResult {
  risks: IdentifiedRisk[];
  riskRegister: string;
  treatmentPlans: TreatmentPlan[];
  residualRisk: 'low' | 'medium' | 'high' | 'critical';
  acceptableRisk: boolean;
}

export interface IdentifiedRisk {
  id: string;
  description: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  category: string;
  relatedControls: string[];
  treatmentRequired: boolean;
}

export interface TreatmentPlan {
  riskId: string;
  treatment: 'mitigate' | 'transfer' | 'avoid' | 'accept';
  controls: string[];
  timeline: string;
  responsible: string;
  status: 'planned' | 'in-progress' | 'completed';
}

export interface ISO27001Finding {
  id: string;
  control: string;
  severity: 'minor' | 'major' | 'critical';
  finding: string;
  evidence: string;
  recommendation: string;
  status: 'open' | 'closed' | 'in-progress';
  dueDate: Date;
}

export interface ISO27001Context {
  config: ISO27001Config;
  controls: Map<string, ISO27001Control>;
  assessmentHistory: ISO27001Assessment[];
  activeAssessment: ISO27001Assessment | null;
  currentDomain: ISO27001Domain | null;
  lastAssessmentResult: any;
  lastError?: Error;
}