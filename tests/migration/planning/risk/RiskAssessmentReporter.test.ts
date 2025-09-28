/**
 * Risk Assessment Reporter Tests
 *
 * Comprehensive test suite for FSM-based reporting system.
 * Tests state transitions, component generation, and NASA Rule 10 compliance.
 *
 * @version 1.0.0
 * @author RiskAssessment FSM Refactor Agent
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ReportGenerationStateMachine, ReportGenerationState, ReportGenerationEvent } from '../../../../src/migration/planning/risk/reporting/fsm/ReportGenerationStateMachine';
import { ReportGeneratorCore } from '../../../../src/migration/planning/risk/reporting/core/ReportGeneratorCore';
import { ReportGeneratorFacade } from '../../../../src/migration/planning/risk/reporting/ReportGeneratorFacade';
import { NASA_RULE_10_BOUNDS } from '../../../../src/migration/planning/risk/reporting/types/ReportingTypes';

// ============================================================================
// TEST DATA SETUP
// ============================================================================

const createMockRequest = () => ({
  assessmentId: 'TEST-001',
  systemContext: {
    businessCriticality: 'mission_critical',
    complianceRequirements: [
      { framework: 'SOX', level: 'high' },
      { framework: 'GDPR', level: 'medium' }
    ]
  },
  stakeholders: [
    { role: 'Risk Manager', name: 'John Doe' },
    { role: 'CISO', name: 'Jane Smith' }
  ]
});

const createMockResult = () => ({
  risk_register: {
    risks: [
      {
        id: 'RISK-001',
        title: 'Data Breach Risk',
        risk_level: 'very_high',
        category: 'security',
        risk_owner: 'security_team@company.com'
      },
      {
        id: 'RISK-002',
        title: 'Compliance Violation',
        risk_level: 'high',
        category: 'compliance',
        risk_owner: 'compliance_team@company.com'
      },
      {
        id: 'RISK-003',
        title: 'System Downtime',
        risk_level: 'medium',
        category: 'operational',
        risk_owner: 'ops_team@company.com'
      }
    ]
  },
  overall_risk_profile: {
    level: 'high',
    score: 75,
    trend: 'increasing'
  }
});

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe('ReportGenerationStateMachine', () => {
  let stateMachine: ReportGenerationStateMachine;

  beforeEach(() => {
    stateMachine = new ReportGenerationStateMachine();
  });

  describe('Initial State', () => {
    it('should start in IDLE state', () => {
      expect(stateMachine.getCurrentState()).toBe(ReportGenerationState.IDLE);
    });

    it('should have empty context initially', () => {
      const context = stateMachine.getContext();
      expect(context.assessmentId).toBe('');
      expect(context.errors).toEqual([]);
    });
  });

  describe('State Transitions', () => {
    it('should transition from IDLE to INITIALIZING on START_GENERATION', () => {
      // Setup context first
      stateMachine.updateContext({
        request: createMockRequest(),
        result: createMockResult()
      });

      const success = stateMachine.processEvent(ReportGenerationEvent.START_GENERATION);
      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(ReportGenerationState.INITIALIZING);
    });

    it('should fail transition without required context', () => {
      const success = stateMachine.processEvent(ReportGenerationEvent.START_GENERATION);
      expect(success).toBe(false);
      expect(stateMachine.getCurrentState()).toBe(ReportGenerationState.IDLE);
    });

    it('should complete full workflow sequence', () => {
      // Setup
      stateMachine.updateContext({
        request: createMockRequest(),
        result: createMockResult()
      });

      // Execute workflow
      const transitions = [
        { event: ReportGenerationEvent.START_GENERATION, expectedState: ReportGenerationState.INITIALIZING },
        { event: ReportGenerationEvent.INITIALIZATION_COMPLETE, expectedState: ReportGenerationState.GENERATING_OBJECTIVES },
        { event: ReportGenerationEvent.OBJECTIVES_READY, expectedState: ReportGenerationState.GENERATING_INDICATORS },
        { event: ReportGenerationEvent.INDICATORS_READY, expectedState: ReportGenerationState.GENERATING_DASHBOARDS },
        { event: ReportGenerationEvent.DASHBOARDS_READY, expectedState: ReportGenerationState.GENERATING_REPORTS },
        { event: ReportGenerationEvent.REPORTS_READY, expectedState: ReportGenerationState.GENERATING_ALERTS },
        { event: ReportGenerationEvent.ALERTS_READY, expectedState: ReportGenerationState.GENERATING_REVIEWS },
        { event: ReportGenerationEvent.REVIEWS_READY, expectedState: ReportGenerationState.ASSEMBLING_FRAMEWORK },
        { event: ReportGenerationEvent.ASSEMBLY_COMPLETE, expectedState: ReportGenerationState.VALIDATION },
        { event: ReportGenerationEvent.VALIDATION_PASSED, expectedState: ReportGenerationState.COMPLETED }
      ];

      for (const transition of transitions) {
        const success = stateMachine.processEvent(transition.event);
        expect(success).toBe(true);
        expect(stateMachine.getCurrentState()).toBe(transition.expectedState);
      }
    });

    it('should handle error transitions from any active state', () => {
      // Setup and start
      stateMachine.updateContext({
        request: createMockRequest(),
        result: createMockResult()
      });
      stateMachine.processEvent(ReportGenerationEvent.START_GENERATION);

      // Trigger error from INITIALIZING state
      const success = stateMachine.processEvent(ReportGenerationEvent.ERROR_OCCURRED);
      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(ReportGenerationState.ERROR);
    });

    it('should reset from error state', () => {
      // Get to error state
      stateMachine.updateContext({
        request: createMockRequest(),
        result: createMockResult()
      });
      stateMachine.processEvent(ReportGenerationEvent.START_GENERATION);
      stateMachine.processEvent(ReportGenerationEvent.ERROR_OCCURRED);

      // Reset
      const success = stateMachine.processEvent(ReportGenerationEvent.RESET);
      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(ReportGenerationState.IDLE);
    });
  });

  describe('Context Management', () => {
    it('should update context correctly', () => {
      const testRequest = createMockRequest();
      stateMachine.updateContext({ assessmentId: 'TEST-123', request: testRequest });

      const context = stateMachine.getContext();
      expect(context.assessmentId).toBe('TEST-123');
      expect(context.request).toEqual(testRequest);
    });

    it('should track generation steps in metadata', () => {
      stateMachine.updateContext({
        request: createMockRequest(),
        result: createMockResult()
      });

      stateMachine.processEvent(ReportGenerationEvent.START_GENERATION);
      stateMachine.processEvent(ReportGenerationEvent.INITIALIZATION_COMPLETE);

      const context = stateMachine.getContext();
      expect(context.metadata.generationSteps.length).toBeGreaterThan(0);
      expect(context.metadata.generationSteps[0]).toContain('START_GENERATION');
    });
  });

  describe('State Helpers', () => {
    it('should correctly identify completion state', () => {
      expect(stateMachine.isComplete()).toBe(false);

      // Complete workflow
      stateMachine.updateContext({
        request: createMockRequest(),
        result: createMockResult()
      });

      const events = [
        ReportGenerationEvent.START_GENERATION,
        ReportGenerationEvent.INITIALIZATION_COMPLETE,
        ReportGenerationEvent.OBJECTIVES_READY,
        ReportGenerationEvent.INDICATORS_READY,
        ReportGenerationEvent.DASHBOARDS_READY,
        ReportGenerationEvent.REPORTS_READY,
        ReportGenerationEvent.ALERTS_READY,
        ReportGenerationEvent.REVIEWS_READY,
        ReportGenerationEvent.ASSEMBLY_COMPLETE,
        ReportGenerationEvent.VALIDATION_PASSED
      ];

      for (const event of events) {
        stateMachine.processEvent(event);
      }

      expect(stateMachine.isComplete()).toBe(true);
    });

    it('should correctly identify error state', () => {
      expect(stateMachine.hasError()).toBe(false);

      stateMachine.updateContext({
        request: createMockRequest(),
        result: createMockResult()
      });
      stateMachine.processEvent(ReportGenerationEvent.START_GENERATION);
      stateMachine.processEvent(ReportGenerationEvent.ERROR_OCCURRED);

      expect(stateMachine.hasError()).toBe(true);
    });
  });
});

// ============================================================================
// CORE GENERATOR TESTS
// ============================================================================

describe('ReportGeneratorCore', () => {
  let core: ReportGeneratorCore;

  beforeEach(() => {
    core = new ReportGeneratorCore();
  });

  describe('Framework Generation', () => {
    it('should generate complete monitoring framework', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      const framework = await core.generateMonitoringFramework(request, result);

      expect(framework).toBeDefined();
      expect(framework.objectives).toBeDefined();
      expect(framework.indicators).toBeDefined();
      expect(framework.dashboards).toBeDefined();
      expect(framework.reports).toBeDefined();
      expect(framework.alerts).toBeDefined();
      expect(framework.reviews).toBeDefined();
    });

    it('should respect NASA Rule 10 bounds', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      const framework = await core.generateMonitoringFramework(request, result);

      expect(framework.objectives.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_OBJECTIVES);
      expect(framework.indicators.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_INDICATORS);
      expect(framework.dashboards.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_DASHBOARDS);
      expect(framework.reports.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_REPORTS);
      expect(framework.alerts.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_ALERTS);
      expect(framework.reviews.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_REVIEWS);
    });

    it('should generate objectives based on system context', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      const framework = await core.generateMonitoringFramework(request, result);

      expect(framework.objectives.length).toBeGreaterThan(0);
      expect(framework.objectives.length).toBeLessThanOrEqual(8);

      // Should include core objectives
      const objectiveTitles = framework.objectives.map((obj: any) => obj.objective);
      expect(objectiveTitles.some((title: string) => title.includes('overall risk level'))).toBe(true);
      expect(objectiveTitles.some((title: string) => title.includes('mitigation effectiveness'))).toBe(true);
    });

    it('should generate indicators for high-priority risks', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      const framework = await core.generateMonitoringFramework(request, result);

      expect(framework.indicators.length).toBeGreaterThan(0);

      // Should have indicators for very_high and high risks
      const indicatorNames = framework.indicators.map((ind: any) => ind.name);
      expect(indicatorNames.some((name: string) => name.includes('Data Breach Risk'))).toBe(true);
      expect(indicatorNames.some((name: string) => name.includes('Compliance Violation'))).toBe(true);
    });

    it('should include compliance dashboards when compliance risks exist', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      const framework = await core.generateMonitoringFramework(request, result);

      const dashboardNames = framework.dashboards.map((dash: any) => dash.name);
      expect(dashboardNames.some((name: string) => name.includes('Executive'))).toBe(true);
      expect(dashboardNames.some((name: string) => name.includes('Operational'))).toBe(true);
      expect(dashboardNames.some((name: string) => name.includes('Compliance'))).toBe(true);
    });

    it('should generate alerts for critical risks', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      const framework = await core.generateMonitoringFramework(request, result);

      expect(framework.alerts.length).toBeGreaterThan(0);

      const criticalAlerts = framework.alerts.filter((alert: any) => alert.severity === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      await core.generateMonitoringFramework(request, result);

      const metrics = core.getPerformanceMetrics();
      expect(metrics.totalGenerationTime).toBeGreaterThan(0);
      expect(metrics.componentTimes).toBeDefined();
      expect(metrics.componentTimes.objectives).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should transition to completed state after successful generation', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      await core.generateMonitoringFramework(request, result);

      expect(core.getCurrentState()).toBe(ReportGenerationState.COMPLETED);
    });
  });
});

// ============================================================================
// FACADE TESTS
// ============================================================================

describe('ReportGeneratorFacade', () => {
  let facade: ReportGeneratorFacade;

  beforeEach(() => {
    facade = new ReportGeneratorFacade();
  });

  describe('Framework Generation', () => {
    it('should generate framework through facade', async () => {
      const request = createMockRequest();
      const result = createMockResult();

      const framework = await facade.generateMonitoringFramework(request, result);

      expect(framework).toBeDefined();
      expect(framework.objectives.length).toBeGreaterThan(0);
      expect(framework.indicators.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const invalidRequest = null as any;
      const result = createMockResult();

      await expect(facade.generateMonitoringFramework(invalidRequest, result))
        .rejects.toThrow();
    });
  });

  describe('Template Management', () => {
    it('should return default templates', () => {
      const templates = facade.getReportTemplates();

      expect(templates.length).toBe(5);
      expect(templates.some(t => t.id === 'executive')).toBe(true);
      expect(templates.some(t => t.id === 'operational')).toBe(true);
      expect(templates.some(t => t.id === 'compliance')).toBe(true);
    });

    it('should add custom templates', () => {
      const customTemplate = {
        id: 'custom',
        name: 'Custom Report',
        description: 'Test template',
        sections: [],
        frequency: 'weekly',
        audience: ['Test'],
        format: 'json' as const
      };

      const success = facade.addReportTemplate(customTemplate);
      expect(success).toBe(true);

      const templates = facade.getReportTemplates();
      expect(templates.length).toBe(6);
      expect(templates.some(t => t.id === 'custom')).toBe(true);
    });

    it('should get specific template', () => {
      const template = facade.getReportTemplate('executive');

      expect(template).toBeDefined();
      expect(template?.id).toBe('executive');
      expect(template?.name).toBe('Executive Risk Report');
    });

    it('should return null for non-existent template', () => {
      const template = facade.getReportTemplate('non-existent');
      expect(template).toBeNull();
    });

    it('should remove templates', () => {
      const success = facade.removeReportTemplate('summary');
      expect(success).toBe(true);

      const templates = facade.getReportTemplates();
      expect(templates.length).toBe(4);
      expect(templates.some(t => t.id === 'summary')).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should return configuration', () => {
      const config = facade.getConfiguration();

      expect(config).toBeDefined();
      expect(config.maxIndicatorsPerDashboard).toBe(20);
      expect(config.maxReportsToGenerate).toBe(10);
    });

    it('should use custom configuration', () => {
      const customConfig = { maxIndicatorsPerDashboard: 30 };
      const customFacade = new ReportGeneratorFacade(customConfig);

      const config = customFacade.getConfiguration();
      expect(config.maxIndicatorsPerDashboard).toBe(30);
    });
  });

  describe('Performance and State', () => {
    it('should return performance metrics', () => {
      const metrics = facade.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalGenerationTime).toBeDefined();
      expect(metrics.componentTimes).toBeDefined();
    });

    it('should return current state', () => {
      const state = facade.getCurrentState();

      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  describe('End-to-End Workflow', () => {
    it('should complete full workflow from facade to core', async () => {
      const facade = new ReportGeneratorFacade();
      const request = createMockRequest();
      const result = createMockResult();

      // Generate framework
      const framework = await facade.generateMonitoringFramework(request, result);

      // Verify all components
      expect(framework.objectives.length).toBeGreaterThan(0);
      expect(framework.indicators.length).toBeGreaterThan(0);
      expect(framework.dashboards.length).toBeGreaterThan(0);
      expect(framework.reports.length).toBeGreaterThan(0);
      expect(framework.alerts.length).toBeGreaterThan(0);
      expect(framework.reviews.length).toBeGreaterThan(0);

      // Verify state completion
      expect(facade.getCurrentState()).toBe(ReportGenerationState.COMPLETED);

      // Verify performance tracking
      const metrics = facade.getPerformanceMetrics();
      expect(metrics.totalGenerationTime).toBeGreaterThan(0);
    });
  });

  describe('NASA Rule 10 Compliance', () => {
    it('should enforce all bounds across components', async () => {
      const facade = new ReportGeneratorFacade();
      const request = createMockRequest();
      const result = createMockResult();

      const framework = await facade.generateMonitoringFramework(request, result);

      // Verify all NASA Rule 10 bounds
      expect(framework.objectives.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_OBJECTIVES);
      expect(framework.indicators.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_INDICATORS);
      expect(framework.dashboards.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_DASHBOARDS);
      expect(framework.reports.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_REPORTS);
      expect(framework.alerts.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_ALERTS);
      expect(framework.reviews.length).toBeLessThanOrEqual(NASA_RULE_10_BOUNDS.MAX_REVIEWS);
    });
  });
});