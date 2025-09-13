/**
 * Quality Gates Domain - Export Index
 * 
 * Comprehensive quality gates enforcement system with Six Sigma metrics,
 * automated decisions, NASA POT10 compliance, and enterprise integration.
 */

// Core Quality Gate Engine
export { QualityGateEngine } from './core/QualityGateEngine';
export type {
  QualityGateConfig,
  QualityThresholds,
  QualityGateResult,
  QualityViolation
} from './core/QualityGateEngine';

// Six Sigma Metrics Integration (QG-001)
export { SixSigmaMetrics } from './metrics/SixSigmaMetrics';
export type {
  SixSigmaThresholds,
  CTQSpecification,
  SixSigmaMetricsResult,
  SixSigmaMetricsData,
  CTQValidationResult
} from './metrics/SixSigmaMetrics';

// Automated Decision Engine (QG-002)
export { AutomatedDecisionEngine } from './decisions/AutomatedDecisionEngine';
export type {
  DecisionEngineConfig,
  DecisionResult,
  RemediationPlan,
  EscalationPlan,
  PassThresholds
} from './decisions/AutomatedDecisionEngine';

// NASA POT10 Compliance Gate (QG-003)
export { ComplianceGateManager } from './compliance/ComplianceGateManager';
export type {
  NASAThresholds,
  ComplianceMetrics,
  ComplianceResult,
  ComplianceViolation
} from './compliance/ComplianceGateManager';

// Performance Regression Detection (QG-004)
export { PerformanceMonitor } from './monitoring/PerformanceMonitor';
export type {
  PerformanceThresholds,
  PerformanceMetrics,
  RegressionAnalysis,
  PerformanceResult
} from './monitoring/PerformanceMonitor';

// Security Vulnerability Gate (QG-005)
export { SecurityGateValidator } from './compliance/SecurityGateValidator';
export type {
  SecurityThresholds,
  SecurityMetrics,
  SecurityViolation,
  SecurityResult
} from './compliance/SecurityGateValidator';

// Unified Quality Dashboard (QG-006)
export { QualityDashboard } from './dashboard/QualityDashboard';
export type {
  DashboardMetrics,
  QualityAlert,
  DashboardWidget,
  DashboardLayout
} from './dashboard/QualityDashboard';

// Phase 3 Artifact System Integration
export { ArtifactSystemIntegration } from './integrations/ArtifactSystemIntegration';
export type {
  ArtifactQualityMetrics,
  ValidationResult,
  ArtifactValidationPlan,
  QVDomainIntegration
} from './integrations/ArtifactSystemIntegration';

// Enterprise Configuration & CTQ Support
export { EnterpriseConfiguration } from './config/EnterpriseConfiguration';
export type {
  EnterpriseQualityConfig,
  CTQSpecification as EnterpriseCTQSpecification,
  QualityGateConfig as EnterpriseQualityGateConfig,
  EnterpriseThresholds
} from './config/EnterpriseConfiguration';

// CI/CD Pipeline Integration
export { CICDIntegration } from './integrations/CICDIntegration';
export type {
  CICDIntegrationConfig,
  CICDPipelineExecution,
  QualityGateIntegration,
  DeploymentConfig
} from './integrations/CICDIntegration';

// Performance Overhead Validation
export { PerformanceOverheadValidator } from './monitoring/PerformanceOverheadValidator';
export type {
  PerformanceOverheadConfig,
  OverheadMeasurement,
  OverheadReport,
  OverheadViolation
} from './monitoring/PerformanceOverheadValidator';

/**
 * Quality Gates Domain Factory
 * 
 * Creates a fully configured quality gates system with all components
 * integrated and configured according to enterprise requirements.
 */
export class QualityGatesDomain {
  private engine: QualityGateEngine;
  private dashboard: QualityDashboard;
  private artifactIntegration: ArtifactSystemIntegration;
  private cicdIntegration: CICDIntegration;
  private overheadValidator: PerformanceOverheadValidator;
  private enterpriseConfig: EnterpriseConfiguration;

  constructor(config?: Partial<QualityGateConfig>) {
    // Initialize enterprise configuration
    this.enterpriseConfig = new EnterpriseConfiguration();
    
    // Initialize overhead validator with 0.4% budget
    this.overheadValidator = new PerformanceOverheadValidator({
      maxOverheadPercentage: 0.4,
      measurementWindow: 60000,
      baselineCollectionPeriod: 300000,
      alertThreshold: 0.3,
      criticalThreshold: 0.5,
      enableContinuousMonitoring: true,
      enableDetailedProfiling: false
    });

    // Initialize core quality gate engine
    this.engine = new QualityGateEngine({
      enableSixSigma: true,
      automatedDecisions: true,
      nasaCompliance: true,
      performanceMonitoring: true,
      securityValidation: true,
      performanceBudget: 0.4, // 0.4% overhead budget
      thresholds: {
        sixSigma: {
          defectRate: 3400, // PPM
          processCapability: 1.33,
          yieldThreshold: 99.66
        },
        nasa: {
          complianceThreshold: 95,
          criticalFindings: 0,
          documentationCoverage: 90
        },
        performance: {
          regressionThreshold: 5,
          responseTimeLimit: 500,
          throughputMinimum: 100
        },
        security: {
          criticalVulnerabilities: 0,
          highVulnerabilities: 0,
          mediumVulnerabilities: 5
        }
      },
      ...config
    });

    // Initialize dashboard
    this.dashboard = new QualityDashboard();
    
    // Initialize artifact system integration
    this.artifactIntegration = new ArtifactSystemIntegration({
      qvDomainEndpoint: 'http://localhost:3001/qv',
      validationTimeout: 300000,
      maxConcurrentValidations: 5,
      retryAttempts: 3,
      cacheValidationResults: true,
      enableRealTimeValidation: true
    });

    // Initialize CI/CD integration
    this.cicdIntegration = new CICDIntegration({
      platform: 'github',
      authentication: {
        type: 'token',
        credentials: {},
        scopes: ['repo', 'workflow']
      },
      webhooks: {
        enabled: true,
        endpoint: '/webhooks/quality-gates',
        secret: 'quality-gates-webhook-secret',
        events: ['push', 'pull_request', 'workflow_run'],
        retryPolicy: {
          maxRetries: 3,
          backoffMs: 1000,
          timeoutMs: 30000
        }
      },
      workflows: {
        qualityGateWorkflow: 'quality-gates-validation',
        deploymentWorkflow: 'deployment-pipeline',
        rollbackWorkflow: 'automated-rollback',
        customWorkflows: {},
        parallelExecution: true,
        timeoutMinutes: 30
      },
      qualityGates: {
        enabledGates: ['development', 'staging', 'production'],
        blockingGates: ['production'],
        bypassConditions: [
          {
            condition: 'emergency',
            approvers: ['engineering-leads@company.com'],
            justificationRequired: true,
            timeLimit: 4,
            auditRequired: true
          }
        ],
        autoRemediation: true,
        escalationPolicies: []
      },
      deployment: {
        strategies: [
          {
            name: 'blue-green',
            environments: ['production'],
            configuration: {},
            qualityGates: ['production'],
            successCriteria: []
          }
        ],
        environments: [
          {
            name: 'production',
            type: 'production',
            qualityGates: ['production'],
            approvalRequired: true,
            approvers: ['engineering-leads@company.com'],
            deploymentWindow: [],
            healthChecks: []
          }
        ],
        approvalGates: [],
        rollbackTriggers: []
      },
      monitoring: {
        metricsCollection: true,
        logAggregation: true,
        alerting: {
          enabled: true,
          channels: ['#quality-gates'],
          rules: [],
          suppressionRules: []
        },
        dashboard: {
          enabled: true,
          template: 'quality-gates-cicd',
          metrics: ['success-rate', 'duration', 'quality-score'],
          refreshInterval: 30,
          publicAccess: false
        },
        reporting: {
          enabled: true,
          frequency: 'weekly',
          recipients: ['quality-team@company.com'],
          format: 'html',
          includeMetrics: ['all']
        }
      }
    });

    this.setupIntegrations();
  }

  /**
   * Setup integrations between components
   */
  private setupIntegrations(): void {
    // Engine -> Dashboard integration
    this.engine.on('gate-completed', async (result) => {
      await this.dashboard.updateGateResult(result);
    });

    // Engine -> Overhead Validator integration
    this.engine.on('gate-completed', async (result) => {
      if (result.executionTime) {
        await this.overheadValidator.measureQualityGateOverhead(
          'quality-gate',
          result.gateId,
          async () => result
        );
      }
    });

    // Artifact Integration -> Engine integration
    this.artifactIntegration.on('artifact-validated', async (metrics) => {
      // Convert artifact metrics to quality gate format and trigger validation
      const gateResult = await this.engine.executeQualityGate(
        `artifact-${metrics.artifactId}`,
        [{ type: 'artifact-metrics', data: metrics }],
        { artifactId: metrics.artifactId }
      );
    });

    // CI/CD Integration -> Engine integration
    this.cicdIntegration.on('quality-gate-validation-triggered', async (event) => {
      const gateResult = await this.engine.executeQualityGate(
        event.executionId,
        [], // Would populate with actual artifacts
        { 
          environment: event.environment,
          pipelineId: event.pipelineId
        }
      );

      await this.cicdIntegration.handleQualityGateCompletion(
        event.executionId,
        'comprehensive-gate',
        {
          gateId: 'comprehensive-gate',
          stage: 'validation',
          status: gateResult.passed ? 'passed' : 'failed',
          score: gateResult.metrics.overall?.score || 0,
          violations: gateResult.violations,
          executionTime: Date.now() - new Date(gateResult.timestamp).getTime(),
          bypassReason: undefined,
          approver: undefined
        }
      );
    });

    // Overhead Validator -> Dashboard integration
    this.overheadValidator.on('overhead-measured', (measurement) => {
      // Update dashboard with overhead metrics
      this.dashboard.emit('overhead-metrics-updated', measurement);
    });

    // Overhead Validator -> Engine integration (budget enforcement)
    this.overheadValidator.on('overhead-violation', (violation) => {
      if (violation.severity === 'critical') {
        // Temporarily disable non-essential quality gates to reduce overhead
        this.engine.emit('overhead-critical', violation);
      }
    });
  }

  /**
   * Execute comprehensive quality gate validation
   */
  async executeQualityGate(
    gateId: string,
    artifacts: any[],
    context: Record<string, any> = {}
  ): Promise<QualityGateResult> {
    return this.engine.executeQualityGate(gateId, artifacts, context);
  }

  /**
   * Get unified quality dashboard metrics
   */
  getDashboardMetrics(): DashboardMetrics {
    return this.dashboard.getCurrentMetrics();
  }

  /**
   * Get performance overhead status
   */
  getPerformanceOverheadStatus(): any {
    return this.overheadValidator.getCurrentOverheadMetrics();
  }

  /**
   * Get CI/CD pipeline metrics
   */
  getCICDMetrics(): any {
    return this.cicdIntegration.getPipelineMetrics();
  }

  /**
   * Validate artifact quality
   */
  async validateArtifact(artifactId: string, artifact: any): Promise<ArtifactQualityMetrics> {
    return this.artifactIntegration.validateArtifact(artifactId, artifact);
  }

  /**
   * Trigger CI/CD quality gate validation
   */
  async triggerCICDValidation(
    pipelineId: string,
    branch: string,
    commit: string,
    environment: string
  ): Promise<string> {
    return this.cicdIntegration.triggerQualityGateValidation(
      pipelineId,
      branch,
      commit,
      environment
    );
  }

  /**
   * Generate comprehensive quality report
   */
  generateQualityReport(): {
    overall: any;
    gates: any;
    overhead: OverheadReport;
    cicd: any;
    artifacts: any;
  } {
    return {
      overall: this.dashboard.getCurrentMetrics(),
      gates: this.engine.getGateHistory(),
      overhead: this.overheadValidator.generateOverheadReport(),
      cicd: this.cicdIntegration.getPipelineMetrics(),
      artifacts: this.artifactIntegration.getValidationStatistics()
    };
  }

  /**
   * Update enterprise configuration
   */
  updateConfiguration(config: Partial<EnterpriseQualityConfig>): void {
    this.enterpriseConfig.updateConfiguration(config);
  }

  /**
   * Get enterprise configuration
   */
  getConfiguration(): EnterpriseQualityConfig {
    return this.enterpriseConfig.getConfiguration();
  }

  /**
   * Establish performance baseline
   */
  async establishPerformanceBaseline(environment: string): Promise<void> {
    await this.overheadValidator.establishBaseline(environment);
  }

  /**
   * Get real-time quality metrics
   */
  async getRealTimeMetrics(): Promise<any> {
    const [gateMetrics, overheadMetrics, cicdMetrics] = await Promise.all([
      this.engine.getRealTimeMetrics(),
      this.overheadValidator.getCurrentOverheadMetrics(),
      this.cicdIntegration.getPipelineMetrics()
    ]);

    return {
      timestamp: new Date(),
      gates: gateMetrics,
      overhead: overheadMetrics,
      cicd: cicdMetrics,
      overall: this.dashboard.getCurrentMetrics().overall
    };
  }
}