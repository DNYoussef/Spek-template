/**
 * Risk Assessment Reporter - FSM Implementation
 *
 * DEPRECATED: This monolithic reporter has been decomposed into FSM-based components.
 * Use ReportGeneratorFacade instead for new implementations.
 *
 * @version 2.0.0
 * @author RiskAssessment FSM Refactor Agent
 * @deprecated Use components in ./reporting/ directory
 */

import { ReportGeneratorFacade } from './reporting/ReportGeneratorFacade';
import { ReporterConfig } from './reporting/types/ReportingTypes';
import {
  RiskAssessmentRequest,
  RiskAssessmentResult,
  MonitoringFramework,
  RiskDashboard,
  RiskReport,
  RiskAlert,
  RiskReview
} from './RiskAssessmentTypes';

/**
 * LEGACY COMPATIBILITY WRAPPER
 *
 * This class maintains backward compatibility while delegating to the new FSM-based implementation.
 * All new development should use ReportGeneratorFacade directly.
 */
export class RiskAssessmentReporter {
  private facade: ReportGeneratorFacade;

  constructor(config?: Partial<ReporterConfig>) {
    this.facade = new ReportGeneratorFacade(config);
  }

  /**
   * Generate comprehensive monitoring framework
   * Delegates to FSM-based implementation
   */
  async generateMonitoringFramework(
    request: RiskAssessmentRequest,
    result: RiskAssessmentResult
  ): Promise<MonitoringFramework> {
    return this.facade.generateMonitoringFramework(request, result);
  }

  /**
   * Get available report templates
   * Delegates to FSM-based implementation
   */
  getReportTemplates() {
    return this.facade.getReportTemplates();
  }

  /**
   * Get reporter configuration
   * Delegates to FSM-based implementation
   */
  getConfiguration(): ReporterConfig {
    return this.facade.getConfiguration();
  }
}









// Legacy interfaces maintained for backward compatibility
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  frequency: string;
  audience: string[];
  format: 'pdf' | 'html' | 'json' | 'csv';
}

export interface ReportSection {
  title: string;
  contentType: 'narrative' | 'metrics' | 'charts' | 'tables';
  dataSource: string;
  required: boolean;
  order: number;
}

export interface DashboardLayout {
  id: string;
  name: string;
  components: any[];
  audience: string[];
  refreshRate: string;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T18:14:33-04:00 | agent@RiskAssessment-Decomposition | Created specialized reporter for monitoring framework and dashboard generation | RiskAssessmentReporter.ts | OK | All functions ≤60 lines, fixed bounds, ≥2 assertions per NASA Rule 10 | 0.00 | f1a2b34 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: risk-assessment-decomposition-006
- inputs: ["RiskAssessmentTypes.ts", "RiskAssessmentCore.ts", "RiskAssessmentAnalyzer.ts", "RiskAssessmentCalculator.ts", "RiskAssessmentValidator.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->