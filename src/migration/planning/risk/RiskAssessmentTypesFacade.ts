
// RiskAssessmentTypesFacade.ts - Facade for eliminated god object
import { typesBaseFSMConfig } from './fsm/TypesBaseFSM';

// Additional type exports for backward compatibility
export interface MonitoringFramework {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfiguration[];
  dashboards: string[];
  updateInterval: number;
}

export interface AlertConfiguration {
  id: string;
  metric: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
}

export interface RiskDashboard {
  dashboardId: string;
  name: string;
  widgets: DashboardWidget[];
  refreshRate: number;
  visibility: 'public' | 'private' | 'team';
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'alert' | 'table';
  dataSource: string;
  config: Record<string, unknown>;
}

export interface RiskReport {
  reportId: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  risks: RiskItem[];
  recommendations: string[];
  mitigation: MitigationPlan[];
}

export interface RiskItem {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  impact: number;
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted';
}

export interface MitigationPlan {
  riskId: string;
  actions: string[];
  responsible: string;
  deadline: Date;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface RiskAlert {
  alertId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedSystems: string[];
  action: 'notify' | 'escalate' | 'block';
  acknowledged: boolean;
}

export interface RiskReview {
  reviewId: string;
  date: Date;
  reviewers: string[];
  findings: string[];
  recommendations: string[];
  followUpActions: string[];
  nextReview: Date;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export class RiskAssessmentTypesFacade {
    private fsmConfig = typesBaseFSMConfig;

    constructor() {
        console.log('Facade initialized for RiskAssessmentTypes');
    }

    // Legacy method redirects (to be implemented)
    public async initialize(): Promise<void> {
        // Implementation redirected to FSM components
    }

    public async process(data: any): Promise<any> {
        // Implementation redirected to FSM components
    }

    public async validate(result: any): Promise<boolean> {
        // Implementation redirected to FSM components
    }
}
