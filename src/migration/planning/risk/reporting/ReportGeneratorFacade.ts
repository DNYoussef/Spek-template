/**
 * Report Generator Facade
 *
 * Main interface for the FSM-based reporting system.
 * Provides simple API while delegating to specialized components.
 * NASA Rule 10 compliant: ≤60 lines per function, fixed bounds, ≥2 assertions.
 *
 * @version 1.0.0
 * @author RiskAssessment FSM Refactor Agent
 */

import { Logger } from './utils/Logger';
// TODO(Phase 4): Implement core module - import { ReportGeneratorCore } from './core/ReportGeneratorCore';
import {
  ReporterConfig,
  DEFAULT_REPORTER_CONFIG,
  ReportTemplate,
  PerformanceMetrics
} from '~types/ReportingTypes';
import {
  RiskAssessmentRequest,
  RiskAssessmentResult,
  MonitoringFramework
} from '../RiskAssessmentTypes';

// ============================================================================
// REPORT GENERATOR FACADE CLASS
// ============================================================================

export class ReportGeneratorFacade {
  private logger: Logger;
  private config: ReporterConfig;
  private core: ReportGeneratorCore;
  private reportTemplates: Map<string, ReportTemplate>;

  constructor(config?: Partial<ReporterConfig>) {
    this.logger = new Logger('ReportGeneratorFacade');
    this.config = { ...DEFAULT_REPORTER_CONFIG, ...config };
    this.core = new ReportGeneratorCore(this.config);
    this.reportTemplates = new Map();
    this.initializeTemplates();
  }

  /**
   * Generate comprehensive monitoring framework
   * Main entry point that delegates to FSM-based core
   * ≤60 lines, fixed bounds, ≥2 assertions
   */
  async generateMonitoringFramework(
    request: RiskAssessmentRequest,
    result: RiskAssessmentResult
  ): Promise<MonitoringFramework> {
    console.assert(request !== null, 'Request cannot be null');
    console.assert(result.risk_register.risks.length > 0, 'Must have risks to monitor');

    this.logger.info('Starting monitoring framework generation via facade', {
      assessmentId: request.assessmentId,
      riskCount: result.risk_register.risks.length
    });

    try {
      const framework = await this.core.generateMonitoringFramework(request, result);

      this.logger.info('Monitoring framework generated successfully', {
        assessmentId: request.assessmentId,
        componentsCount: {
          objectives: framework.objectives.length,
          indicators: framework.indicators.length,
          dashboards: framework.dashboards.length,
          reports: framework.reports.length,
          alerts: framework.alerts.length,
          reviews: framework.reviews.length
        }
      });

      return framework;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Framework generation failed in facade', {
        assessmentId: request.assessmentId,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Get available report templates
   * ≤60 lines, fixed bounds (max 10 templates), ≥2 assertions
   */
  getReportTemplates(): ReportTemplate[] {
    console.assert(this.reportTemplates.size > 0, 'Report templates must be available');

    const templates = Array.from(this.reportTemplates.values());
    const MAX_TEMPLATES = 10; // Fixed bound

    console.assert(templates.length <= MAX_TEMPLATES, 'Templates must be within bounds');

    this.logger.info('Report templates retrieved', {
      templateCount: templates.length
    });

    return templates;
  }

  /**
   * Get reporter configuration
   * ≤60 lines, fixed bounds, ≥2 assertions
   */
  getConfiguration(): ReporterConfig {
    console.assert(this.config !== undefined, 'Configuration must be defined');
    console.assert(this.config.maxIndicatorsPerDashboard > 0, 'Max indicators must be positive');

    return { ...this.config };
  }

  /**
   * Get performance metrics from core
   * ≤60 lines, fixed bounds, ≥2 assertions
   */
  getPerformanceMetrics(): PerformanceMetrics {
    console.assert(this.core !== undefined, 'Core must be initialized');

    const metrics = this.core.getPerformanceMetrics();

    console.assert(metrics !== undefined, 'Metrics must be available');

    return metrics;
  }

  /**
   * Get current generation state
   * ≤60 lines, fixed bounds, ≥2 assertions
   */
  getCurrentState(): string {
    console.assert(this.core !== undefined, 'Core must be initialized');

    const state = this.core.getCurrentState();

    console.assert(state !== undefined, 'State must be defined');

    return state;
  }

  /**
   * Initialize default report templates
   * ≤60 lines, fixed bounds (5 templates), ≥2 assertions
   */
  private initializeTemplates(): void {
    console.assert(this.reportTemplates !== undefined, 'Report templates map must be initialized');

    // Executive Report Template
    this.reportTemplates.set('executive', {
      id: 'executive',
      name: 'Executive Risk Report',
      description: 'High-level risk summary for executives',
      sections: [
        {
          title: 'Executive Summary',
          contentType: 'narrative',
          dataSource: 'risk_profile',
          required: true,
          order: 1
        },
        {
          title: 'Key Metrics',
          contentType: 'metrics',
          dataSource: 'risk_metrics',
          required: true,
          order: 2
        },
        {
          title: 'Risk Heat Map',
          contentType: 'charts',
          dataSource: 'risk_matrix',
          required: true,
          order: 3
        }
      ],
      frequency: 'monthly',
      audience: ['CEO', 'CRO', 'Board'],
      format: 'pdf'
    });

    // Operational Report Template
    this.reportTemplates.set('operational', {
      id: 'operational',
      name: 'Operational Risk Report',
      description: 'Detailed risk analysis for operations',
      sections: [
        {
          title: 'Risk Register',
          contentType: 'tables',
          dataSource: 'risk_register',
          required: true,
          order: 1
        },
        {
          title: 'Control Effectiveness',
          contentType: 'metrics',
          dataSource: 'control_metrics',
          required: true,
          order: 2
        }
      ],
      frequency: 'weekly',
      audience: ['Risk Manager', 'Operations'],
      format: 'html'
    });

    // Compliance Report Template
    this.reportTemplates.set('compliance', {
      id: 'compliance',
      name: 'Compliance Status Report',
      description: 'Regulatory compliance monitoring',
      sections: [
        {
          title: 'Compliance Overview',
          contentType: 'metrics',
          dataSource: 'compliance_metrics',
          required: true,
          order: 1
        },
        {
          title: 'Framework Analysis',
          contentType: 'tables',
          dataSource: 'framework_status',
          required: true,
          order: 2
        }
      ],
      frequency: 'monthly',
      audience: ['Compliance Officer', 'Legal Team'],
      format: 'pdf'
    });

    // Technical Report Template
    this.reportTemplates.set('technical', {
      id: 'technical',
      name: 'Technical Risk Assessment',
      description: 'Technical risk analysis for IT teams',
      sections: [
        {
          title: 'Technical Risks',
          contentType: 'tables',
          dataSource: 'technical_risks',
          required: true,
          order: 1
        },
        {
          title: 'Security Analysis',
          contentType: 'narrative',
          dataSource: 'security_analysis',
          required: true,
          order: 2
        }
      ],
      frequency: 'bi-weekly',
      audience: ['CISO', 'IT Manager', 'Security Team'],
      format: 'html'
    });

    // Summary Report Template
    this.reportTemplates.set('summary', {
      id: 'summary',
      name: 'Risk Summary Dashboard',
      description: 'Quick overview for all stakeholders',
      sections: [
        {
          title: 'Key Indicators',
          contentType: 'metrics',
          dataSource: 'key_indicators',
          required: true,
          order: 1
        }
      ],
      frequency: 'daily',
      audience: ['All Stakeholders'],
      format: 'json'
    });

    console.assert(this.reportTemplates.size === 5, 'Must have exactly 5 default templates');

    this.logger.info('Report templates initialized', {
      templateCount: this.reportTemplates.size,
      templateIds: Array.from(this.reportTemplates.keys())
    });
  }

  /**
   * Add custom report template
   * ≤60 lines, fixed bounds, ≥2 assertions
   */
  addReportTemplate(template: ReportTemplate): boolean {
    console.assert(template !== null, 'Template cannot be null');
    console.assert(template.id !== undefined && template.id.length > 0, 'Template must have valid ID');

    const MAX_TEMPLATES = 20; // Fixed bound

    if (this.reportTemplates.size >= MAX_TEMPLATES) {
      this.logger.warn('Cannot add template, maximum limit reached', {
        currentCount: this.reportTemplates.size,
        maxTemplates: MAX_TEMPLATES
      });
      return false;
    }

    this.reportTemplates.set(template.id, template);

    this.logger.info('Custom report template added', {
      templateId: template.id,
      templateName: template.name,
      totalTemplates: this.reportTemplates.size
    });

    return true;
  }

  /**
   * Remove report template
   * ≤60 lines, fixed bounds, ≥2 assertions
   */
  removeReportTemplate(templateId: string): boolean {
    console.assert(templateId !== undefined && templateId.length > 0, 'Template ID must be valid');
    console.assert(this.reportTemplates.size > 0, 'Must have templates to remove');

    const existed = this.reportTemplates.has(templateId);
    this.reportTemplates.delete(templateId);

    this.logger.info('Report template removal attempted', {
      templateId,
      existed,
      remainingTemplates: this.reportTemplates.size
    });

    return existed;
  }

  /**
   * Get specific report template
   * ≤60 lines, fixed bounds, ≥2 assertions
   */
  getReportTemplate(templateId: string): ReportTemplate | null {
    console.assert(templateId !== undefined && templateId.length > 0, 'Template ID must be valid');

    const template = this.reportTemplates.get(templateId);

    console.assert(template === undefined || template.id === templateId, 'Template ID must match if found');

    this.logger.info('Report template requested', {
      templateId,
      found: template !== undefined
    });

    return template || null;
  }
}