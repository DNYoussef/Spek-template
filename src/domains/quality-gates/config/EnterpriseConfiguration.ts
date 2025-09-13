/**
 * Enterprise Configuration & CTQ Specifications Support
 * 
 * Provides enterprise-grade configuration management with CTQ (Critical-to-Quality)
 * specifications and comprehensive quality gate configuration support.
 */

import { EventEmitter } from 'events';

export interface EnterpriseQualityConfig {
  organization: OrganizationConfig;
  qualityStandards: QualityStandardsConfig;
  ctqSpecifications: CTQSpecification[];
  gateConfigurations: QualityGateConfig[];
  thresholds: EnterpriseThresholds;
  integrations: IntegrationConfig;
  governance: GovernanceConfig;
}

export interface OrganizationConfig {
  name: string;
  industry: 'defense' | 'healthcare' | 'financial' | 'aerospace' | 'automotive' | 'general';
  complianceFrameworks: string[];
  qualityMaturityLevel: 1 | 2 | 3 | 4 | 5; // CMMI levels
  riskTolerance: 'low' | 'medium' | 'high';
  geographicalRegions: string[];
}

export interface QualityStandardsConfig {
  primaryStandard: 'ISO-9001' | 'AS9100' | 'ISO-13485' | 'ISO-26262' | 'DO-178C';
  secondaryStandards: string[];
  customStandards: CustomStandard[];
  certificationRequirements: CertificationRequirement[];
}

export interface CustomStandard {
  name: string;
  description: string;
  version: string;
  requirements: StandardRequirement[];
  applicability: string[];
}

export interface StandardRequirement {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  verificationMethod: 'inspection' | 'test' | 'analysis' | 'demonstration';
  acceptanceCriteria: string[];
}

export interface CertificationRequirement {
  framework: string;
  level: string;
  validityPeriod: number; // months
  auditFrequency: number; // months
  requiredDocumentation: string[];
}

export interface CTQSpecification {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'reliability' | 'security' | 'usability' | 'maintainability';
  importance: 'critical' | 'high' | 'medium' | 'low';
  target: CTQTarget;
  limits: CTQLimits;
  measurementMethod: MeasurementMethod;
  validationCriteria: ValidationCriteria;
  stakeholders: string[];
  reviewFrequency: number; // days
}

export interface CTQTarget {
  value: number;
  unit: string;
  direction: 'minimize' | 'maximize' | 'target';
  baseline: number;
  stretchGoal: number;
}

export interface CTQLimits {
  upperSpecLimit: number;
  lowerSpecLimit: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  actionLimits: {
    warning: number;
    critical: number;
  };
}

export interface MeasurementMethod {
  type: 'automated' | 'manual' | 'hybrid';
  frequency: 'continuous' | 'periodic' | 'on-demand';
  tools: string[];
  dataSource: string;
  calculationFormula: string;
}

export interface ValidationCriteria {
  statistical: {
    sampleSize: number;
    confidenceLevel: number;
    significanceLevel: number;
  };
  acceptance: {
    minimumCapability: number;
    maximumDefectRate: number;
    requiredYield: number;
  };
}

export interface QualityGateConfig {
  id: string;
  name: string;
  description: string;
  stage: 'development' | 'testing' | 'staging' | 'production';
  mandatory: boolean;
  enabledValidators: ValidatorConfiguration[];
  dependencies: string[];
  executionConditions: ExecutionCondition[];
  escalationPolicies: EscalationPolicy[];
}

export interface ValidatorConfiguration {
  type: 'six-sigma' | 'nasa' | 'performance' | 'security' | 'compliance';
  enabled: boolean;
  weight: number;
  config: Record<string, any>;
  thresholds: Record<string, any>;
  ctqMappings: string[]; // CTQ IDs this validator addresses
}

export interface ExecutionCondition {
  type: 'artifact-type' | 'code-change' | 'schedule' | 'trigger-event';
  condition: string;
  parameters: Record<string, any>;
}

export interface EscalationPolicy {
  level: 'team' | 'lead' | 'management' | 'executive';
  trigger: 'failure' | 'warning' | 'timeout' | 'manual';
  recipients: string[];
  notificationMethod: 'email' | 'slack' | 'teams' | 'webhook';
  template: string;
}

export interface EnterpriseThresholds {
  global: GlobalThresholds;
  contextual: ContextualThresholds[];
  adaptive: AdaptiveThresholds;
}

export interface GlobalThresholds {
  minimumQualityScore: number;
  maximumDefectRate: number; // PPM
  minimumProcessCapability: number;
  maximumRegressionTolerance: number; // %
  securityBaseline: number;
  complianceMinimum: number;
}

export interface ContextualThresholds {
  context: 'development' | 'testing' | 'staging' | 'production';
  environment: string;
  thresholds: Record<string, number>;
  overrides: ThresholdOverride[];
}

export interface ThresholdOverride {
  condition: string;
  metric: string;
  value: number;
  justification: string;
  approver: string;
  expiryDate: Date;
}

export interface AdaptiveThresholds {
  enabled: boolean;
  learningPeriod: number; // days
  adjustmentFactor: number;
  minimumDataPoints: number;
  maxAdjustmentPercentage: number;
}

export interface IntegrationConfig {
  cicd: CICDIntegration;
  monitoring: MonitoringIntegration;
  ticketing: TicketingIntegration;
  communication: CommunicationIntegration;
}

export interface CICDIntegration {
  platform: 'github' | 'gitlab' | 'azure-devops' | 'jenkins';
  webhookUrl: string;
  authentication: {
    type: 'token' | 'oauth' | 'certificate';
    credentials: Record<string, string>;
  };
  qualityGateIntegration: boolean;
  blockDeploymentOnFailure: boolean;
}

export interface MonitoringIntegration {
  platform: 'datadog' | 'newrelic' | 'prometheus' | 'splunk';
  endpoint: string;
  authentication: Record<string, string>;
  metricPrefix: string;
  dashboardTemplate: string;
}

export interface TicketingIntegration {
  platform: 'jira' | 'servicenow' | 'azure-boards';
  endpoint: string;
  authentication: Record<string, string>;
  autoCreateTickets: boolean;
  ticketTemplate: string;
}

export interface CommunicationIntegration {
  platform: 'slack' | 'teams' | 'email';
  webhookUrl: string;
  channels: {
    alerts: string;
    reports: string;
    notifications: string;
  };
  messageTemplates: Record<string, string>;
}

export interface GovernanceConfig {
  approvalWorkflows: ApprovalWorkflow[];
  auditSettings: AuditSettings;
  reportingSettings: ReportingSettings;
  dataRetention: DataRetentionSettings;
}

export interface ApprovalWorkflow {
  trigger: 'threshold-change' | 'gate-bypass' | 'exception-request';
  approvers: ApproverLevel[];
  timeout: number; // hours
  autoApprovalConditions: string[];
}

export interface ApproverLevel {
  level: number;
  roles: string[];
  requireAll: boolean;
  delegationAllowed: boolean;
}

export interface AuditSettings {
  enabled: boolean;
  retentionPeriod: number; // months
  auditEvents: string[];
  encryptionRequired: boolean;
  externalAuditorAccess: boolean;
}

export interface ReportingSettings {
  enabledReports: ReportConfiguration[];
  distributionLists: DistributionList[];
  scheduledReports: ScheduledReport[];
}

export interface ReportConfiguration {
  type: 'quality-dashboard' | 'compliance-summary' | 'trend-analysis' | 'exception-report';
  format: 'pdf' | 'html' | 'json' | 'csv';
  template: string;
  dataScope: string[];
}

export interface DistributionList {
  name: string;
  recipients: string[];
  reportTypes: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface ScheduledReport {
  id: string;
  reportType: string;
  schedule: string; // cron expression
  distributionList: string;
  parameters: Record<string, any>;
}

export interface DataRetentionSettings {
  qualityMetrics: number; // months
  auditLogs: number; // months
  reports: number; // months
  violations: number; // months
  archiveLocation: string;
  encryptionRequired: boolean;
}

export class EnterpriseConfiguration extends EventEmitter {
  private config: EnterpriseQualityConfig;
  private configHistory: Map<string, EnterpriseQualityConfig> = new Map();
  private validators: Map<string, Function> = new Map();

  constructor(initialConfig?: Partial<EnterpriseQualityConfig>) {
    super();
    this.config = this.initializeDefaultConfig(initialConfig);
    this.initializeValidators();
    this.validateConfiguration();
  }

  /**
   * Initialize default enterprise configuration
   */
  private initializeDefaultConfig(partial?: Partial<EnterpriseQualityConfig>): EnterpriseQualityConfig {
    const defaultConfig: EnterpriseQualityConfig = {
      organization: {
        name: 'Default Organization',
        industry: 'general',
        complianceFrameworks: ['ISO-9001'],
        qualityMaturityLevel: 3,
        riskTolerance: 'medium',
        geographicalRegions: ['US']
      },
      qualityStandards: {
        primaryStandard: 'ISO-9001',
        secondaryStandards: [],
        customStandards: [],
        certificationRequirements: []
      },
      ctqSpecifications: this.getDefaultCTQSpecifications(),
      gateConfigurations: this.getDefaultGateConfigurations(),
      thresholds: this.getDefaultThresholds(),
      integrations: this.getDefaultIntegrations(),
      governance: this.getDefaultGovernance()
    };

    return { ...defaultConfig, ...partial };
  }

  /**
   * Get default CTQ specifications
   */
  private getDefaultCTQSpecifications(): CTQSpecification[] {
    return [
      {
        id: 'ctq-response-time',
        name: 'System Response Time',
        description: 'Maximum acceptable response time for user requests',
        category: 'performance',
        importance: 'critical',
        target: {
          value: 200,
          unit: 'milliseconds',
          direction: 'minimize',
          baseline: 500,
          stretchGoal: 100
        },
        limits: {
          upperSpecLimit: 500,
          lowerSpecLimit: 0,
          upperControlLimit: 400,
          lowerControlLimit: 50,
          actionLimits: {
            warning: 300,
            critical: 450
          }
        },
        measurementMethod: {
          type: 'automated',
          frequency: 'continuous',
          tools: ['APM', 'Load Testing'],
          dataSource: 'application-metrics',
          calculationFormula: 'p95(response_time)'
        },
        validationCriteria: {
          statistical: {
            sampleSize: 1000,
            confidenceLevel: 95,
            significanceLevel: 0.05
          },
          acceptance: {
            minimumCapability: 1.33,
            maximumDefectRate: 3400,
            requiredYield: 99.66
          }
        },
        stakeholders: ['Product Team', 'Engineering', 'QA'],
        reviewFrequency: 30
      },
      {
        id: 'ctq-security-score',
        name: 'Security Compliance Score',
        description: 'Overall security posture and compliance score',
        category: 'security',
        importance: 'critical',
        target: {
          value: 95,
          unit: 'percentage',
          direction: 'maximize',
          baseline: 80,
          stretchGoal: 98
        },
        limits: {
          upperSpecLimit: 100,
          lowerSpecLimit: 90,
          upperControlLimit: 98,
          lowerControlLimit: 92,
          actionLimits: {
            warning: 90,
            critical: 85
          }
        },
        measurementMethod: {
          type: 'automated',
          frequency: 'periodic',
          tools: ['SAST', 'DAST', 'SCA'],
          dataSource: 'security-scans',
          calculationFormula: 'weighted_average(owasp_score, nist_score, custom_score)'
        },
        validationCriteria: {
          statistical: {
            sampleSize: 100,
            confidenceLevel: 99,
            significanceLevel: 0.01
          },
          acceptance: {
            minimumCapability: 1.67,
            maximumDefectRate: 233,
            requiredYield: 99.977
          }
        },
        stakeholders: ['Security Team', 'Compliance', 'Engineering'],
        reviewFrequency: 7
      },
      {
        id: 'ctq-defect-rate',
        name: 'Defect Rate',
        description: 'Production defect rate per million opportunities',
        category: 'reliability',
        importance: 'critical',
        target: {
          value: 3400,
          unit: 'PPM',
          direction: 'minimize',
          baseline: 10000,
          stretchGoal: 233
        },
        limits: {
          upperSpecLimit: 6000,
          lowerSpecLimit: 0,
          upperControlLimit: 5000,
          lowerControlLimit: 100,
          actionLimits: {
            warning: 4000,
            critical: 5500
          }
        },
        measurementMethod: {
          type: 'automated',
          frequency: 'continuous',
          tools: ['Bug Tracking', 'Monitoring'],
          dataSource: 'defect-tracking',
          calculationFormula: '(defects / opportunities) * 1000000'
        },
        validationCriteria: {
          statistical: {
            sampleSize: 500,
            confidenceLevel: 95,
            significanceLevel: 0.05
          },
          acceptance: {
            minimumCapability: 1.33,
            maximumDefectRate: 3400,
            requiredYield: 99.66
          }
        },
        stakeholders: ['QA Team', 'Engineering', 'Product'],
        reviewFrequency: 14
      }
    ];
  }

  /**
   * Get default gate configurations
   */
  private getDefaultGateConfigurations(): QualityGateConfig[] {
    return [
      {
        id: 'gate-development',
        name: 'Development Quality Gate',
        description: 'Quality gate for development phase',
        stage: 'development',
        mandatory: true,
        enabledValidators: [
          {
            type: 'six-sigma',
            enabled: true,
            weight: 0.3,
            config: { enableCTQValidation: true },
            thresholds: { defectRate: 10000, qualityScore: 70 },
            ctqMappings: ['ctq-defect-rate']
          },
          {
            type: 'security',
            enabled: true,
            weight: 0.4,
            config: { enableOWASPValidation: true },
            thresholds: { criticalVulnerabilities: 0, minimumSecurityScore: 80 },
            ctqMappings: ['ctq-security-score']
          }
        ],
        dependencies: [],
        executionConditions: [
          {
            type: 'code-change',
            condition: 'pull-request',
            parameters: { minChanges: 1 }
          }
        ],
        escalationPolicies: [
          {
            level: 'team',
            trigger: 'failure',
            recipients: ['dev-team@company.com'],
            notificationMethod: 'email',
            template: 'dev-gate-failure'
          }
        ]
      },
      {
        id: 'gate-production',
        name: 'Production Readiness Gate',
        description: 'Comprehensive quality gate for production deployment',
        stage: 'production',
        mandatory: true,
        enabledValidators: [
          {
            type: 'six-sigma',
            enabled: true,
            weight: 0.25,
            config: { enableCTQValidation: true, requireFullCompliance: true },
            thresholds: { defectRate: 3400, qualityScore: 85 },
            ctqMappings: ['ctq-defect-rate']
          },
          {
            type: 'nasa',
            enabled: true,
            weight: 0.25,
            config: { enablePOT10Rules: true },
            thresholds: { complianceScore: 95, criticalViolations: 0 },
            ctqMappings: []
          },
          {
            type: 'performance',
            enabled: true,
            weight: 0.2,
            config: { enableRegressionDetection: true },
            thresholds: { regressionThreshold: 5, responseTimeLimit: 200 },
            ctqMappings: ['ctq-response-time']
          },
          {
            type: 'security',
            enabled: true,
            weight: 0.3,
            config: { enableOWASPValidation: true, vulnerabilityScanning: true },
            thresholds: { criticalVulnerabilities: 0, minimumSecurityScore: 95 },
            ctqMappings: ['ctq-security-score']
          }
        ],
        dependencies: ['gate-development'],
        executionConditions: [
          {
            type: 'trigger-event',
            condition: 'deployment-request',
            parameters: { environment: 'production' }
          }
        ],
        escalationPolicies: [
          {
            level: 'management',
            trigger: 'failure',
            recipients: ['engineering-leads@company.com'],
            notificationMethod: 'slack',
            template: 'prod-gate-failure'
          }
        ]
      }
    ];
  }

  /**
   * Get default thresholds
   */
  private getDefaultThresholds(): EnterpriseThresholds {
    return {
      global: {
        minimumQualityScore: 80,
        maximumDefectRate: 3400,
        minimumProcessCapability: 1.33,
        maximumRegressionTolerance: 5,
        securityBaseline: 90,
        complianceMinimum: 95
      },
      contextual: [
        {
          context: 'development',
          environment: 'dev',
          thresholds: {
            minimumQualityScore: 70,
            maximumDefectRate: 10000,
            minimumSecurityScore: 80
          },
          overrides: []
        },
        {
          context: 'production',
          environment: 'prod',
          thresholds: {
            minimumQualityScore: 95,
            maximumDefectRate: 233,
            minimumSecurityScore: 95
          },
          overrides: []
        }
      ],
      adaptive: {
        enabled: false,
        learningPeriod: 30,
        adjustmentFactor: 0.1,
        minimumDataPoints: 100,
        maxAdjustmentPercentage: 10
      }
    };
  }

  /**
   * Get default integrations
   */
  private getDefaultIntegrations(): IntegrationConfig {
    return {
      cicd: {
        platform: 'github',
        webhookUrl: '',
        authentication: {
          type: 'token',
          credentials: {}
        },
        qualityGateIntegration: true,
        blockDeploymentOnFailure: true
      },
      monitoring: {
        platform: 'prometheus',
        endpoint: '',
        authentication: {},
        metricPrefix: 'quality_gates',
        dashboardTemplate: 'default'
      },
      ticketing: {
        platform: 'jira',
        endpoint: '',
        authentication: {},
        autoCreateTickets: false,
        ticketTemplate: 'quality-gate-failure'
      },
      communication: {
        platform: 'slack',
        webhookUrl: '',
        channels: {
          alerts: '#quality-alerts',
          reports: '#quality-reports',
          notifications: '#quality-notifications'
        },
        messageTemplates: {}
      }
    };
  }

  /**
   * Get default governance settings
   */
  private getDefaultGovernance(): GovernanceConfig {
    return {
      approvalWorkflows: [
        {
          trigger: 'threshold-change',
          approvers: [
            {
              level: 1,
              roles: ['Quality Manager'],
              requireAll: true,
              delegationAllowed: false
            }
          ],
          timeout: 24,
          autoApprovalConditions: []
        }
      ],
      auditSettings: {
        enabled: true,
        retentionPeriod: 24,
        auditEvents: ['config-change', 'threshold-change', 'gate-bypass'],
        encryptionRequired: true,
        externalAuditorAccess: false
      },
      reportingSettings: {
        enabledReports: [
          {
            type: 'quality-dashboard',
            format: 'html',
            template: 'standard',
            dataScope: ['overall', 'gates', 'trends']
          }
        ],
        distributionLists: [
          {
            name: 'Quality Team',
            recipients: ['quality@company.com'],
            reportTypes: ['quality-dashboard'],
            frequency: 'weekly'
          }
        ],
        scheduledReports: []
      },
      dataRetention: {
        qualityMetrics: 12,
        auditLogs: 84,
        reports: 24,
        violations: 36,
        archiveLocation: 's3://quality-archives',
        encryptionRequired: true
      }
    };
  }

  /**
   * Initialize configuration validators
   */
  private initializeValidators(): void {
    this.validators.set('ctq-specification', this.validateCTQSpecification.bind(this));
    this.validators.set('gate-configuration', this.validateGateConfiguration.bind(this));
    this.validators.set('thresholds', this.validateThresholds.bind(this));
    this.validators.set('integrations', this.validateIntegrations.bind(this));
  }

  /**
   * Validate CTQ specification
   */
  private validateCTQSpecification(ctq: CTQSpecification): string[] {
    const errors: string[] = [];

    if (!ctq.id || !ctq.name) {
      errors.push('CTQ must have valid ID and name');
    }

    if (ctq.target.value <= 0) {
      errors.push('CTQ target value must be positive');
    }

    if (ctq.limits.upperSpecLimit <= ctq.limits.lowerSpecLimit) {
      errors.push('Upper spec limit must be greater than lower spec limit');
    }

    if (ctq.validationCriteria.statistical.confidenceLevel <= 0 || 
        ctq.validationCriteria.statistical.confidenceLevel >= 100) {
      errors.push('Confidence level must be between 0 and 100');
    }

    return errors;
  }

  /**
   * Validate gate configuration
   */
  private validateGateConfiguration(gate: QualityGateConfig): string[] {
    const errors: string[] = [];

    if (!gate.id || !gate.name) {
      errors.push('Gate must have valid ID and name');
    }

    const totalWeight = gate.enabledValidators.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push('Validator weights must sum to 1.0');
    }

    if (gate.enabledValidators.length === 0) {
      errors.push('Gate must have at least one enabled validator');
    }

    return errors;
  }

  /**
   * Validate thresholds
   */
  private validateThresholds(thresholds: EnterpriseThresholds): string[] {
    const errors: string[] = [];

    if (thresholds.global.minimumQualityScore < 0 || thresholds.global.minimumQualityScore > 100) {
      errors.push('Quality score must be between 0 and 100');
    }

    if (thresholds.global.maximumDefectRate < 0) {
      errors.push('Defect rate must be non-negative');
    }

    if (thresholds.global.minimumProcessCapability < 0) {
      errors.push('Process capability must be non-negative');
    }

    return errors;
  }

  /**
   * Validate integrations
   */
  private validateIntegrations(integrations: IntegrationConfig): string[] {
    const errors: string[] = [];

    if (integrations.cicd.webhookUrl && !this.isValidUrl(integrations.cicd.webhookUrl)) {
      errors.push('CI/CD webhook URL must be valid');
    }

    if (integrations.monitoring.endpoint && !this.isValidUrl(integrations.monitoring.endpoint)) {
      errors.push('Monitoring endpoint must be valid URL');
    }

    return errors;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate entire configuration
   */
  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate CTQ specifications
    this.config.ctqSpecifications.forEach(ctq => {
      const ctqErrors = this.validators.get('ctq-specification')!(ctq);
      errors.push(...ctqErrors);
    });

    // Validate gate configurations
    this.config.gateConfigurations.forEach(gate => {
      const gateErrors = this.validators.get('gate-configuration')!(gate);
      errors.push(...gateErrors);
    });

    // Validate thresholds
    const thresholdErrors = this.validators.get('thresholds')!(this.config.thresholds);
    errors.push(...thresholdErrors);

    // Validate integrations
    const integrationErrors = this.validators.get('integrations')!(this.config.integrations);
    errors.push(...integrationErrors);

    if (errors.length > 0) {
      this.emit('validation-errors', errors);
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    this.emit('configuration-validated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): EnterpriseQualityConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Update configuration
   */
  updateConfiguration(updates: Partial<EnterpriseQualityConfig>): void {
    // Store current config in history
    const timestamp = new Date().toISOString();
    this.configHistory.set(timestamp, JSON.parse(JSON.stringify(this.config)));

    // Apply updates
    this.config = { ...this.config, ...updates };

    // Validate updated configuration
    this.validateConfiguration();

    this.emit('configuration-updated', {
      timestamp,
      changes: updates,
      config: this.config
    });
  }

  /**
   * Get CTQ specification by ID
   */
  getCTQSpecification(id: string): CTQSpecification | undefined {
    return this.config.ctqSpecifications.find(ctq => ctq.id === id);
  }

  /**
   * Add or update CTQ specification
   */
  updateCTQSpecification(ctq: CTQSpecification): void {
    const errors = this.validators.get('ctq-specification')!(ctq);
    if (errors.length > 0) {
      throw new Error(`CTQ validation failed: ${errors.join(', ')}`);
    }

    const index = this.config.ctqSpecifications.findIndex(c => c.id === ctq.id);
    if (index >= 0) {
      this.config.ctqSpecifications[index] = ctq;
    } else {
      this.config.ctqSpecifications.push(ctq);
    }

    this.emit('ctq-updated', ctq);
  }

  /**
   * Get gate configuration by ID
   */
  getGateConfiguration(id: string): QualityGateConfig | undefined {
    return this.config.gateConfigurations.find(gate => gate.id === id);
  }

  /**
   * Add or update gate configuration
   */
  updateGateConfiguration(gate: QualityGateConfig): void {
    const errors = this.validators.get('gate-configuration')!(gate);
    if (errors.length > 0) {
      throw new Error(`Gate validation failed: ${errors.join(', ')}`);
    }

    const index = this.config.gateConfigurations.findIndex(g => g.id === gate.id);
    if (index >= 0) {
      this.config.gateConfigurations[index] = gate;
    } else {
      this.config.gateConfigurations.push(gate);
    }

    this.emit('gate-updated', gate);
  }

  /**
   * Get thresholds for context
   */
  getThresholdsForContext(context: string, environment: string): Record<string, number> {
    const contextualThreshold = this.config.thresholds.contextual.find(
      ct => ct.context === context && ct.environment === environment
    );

    if (contextualThreshold) {
      return { ...this.config.thresholds.global, ...contextualThreshold.thresholds };
    }

    return this.config.thresholds.global;
  }

  /**
   * Export configuration
   */
  exportConfiguration(format: 'json' | 'yaml' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.config, null, 2);
    } else {
      // YAML export would be implemented here
      return 'YAML export not implemented';
    }
  }

  /**
   * Import configuration
   */
  importConfiguration(configData: string, format: 'json' | 'yaml' = 'json'): void {
    let importedConfig: EnterpriseQualityConfig;

    try {
      if (format === 'json') {
        importedConfig = JSON.parse(configData);
      } else {
        throw new Error('YAML import not implemented');
      }

      // Store current config in history
      const timestamp = new Date().toISOString();
      this.configHistory.set(timestamp, JSON.parse(JSON.stringify(this.config)));

      // Apply imported configuration
      this.config = importedConfig;

      // Validate imported configuration
      this.validateConfiguration();

      this.emit('configuration-imported', {
        timestamp,
        source: 'import',
        config: this.config
      });

    } catch (error) {
      this.emit('import-error', error);
      throw new Error(`Configuration import failed: ${error.message}`);
    }
  }

  /**
   * Get configuration history
   */
  getConfigurationHistory(): Array<{ timestamp: string; config: EnterpriseQualityConfig }> {
    return Array.from(this.configHistory.entries()).map(([timestamp, config]) => ({
      timestamp,
      config
    }));
  }

  /**
   * Rollback to previous configuration
   */
  rollbackConfiguration(timestamp: string): void {
    const historicalConfig = this.configHistory.get(timestamp);
    if (!historicalConfig) {
      throw new Error(`Configuration not found for timestamp: ${timestamp}`);
    }

    // Store current config before rollback
    const currentTimestamp = new Date().toISOString();
    this.configHistory.set(currentTimestamp, JSON.parse(JSON.stringify(this.config)));

    // Apply historical configuration
    this.config = JSON.parse(JSON.stringify(historicalConfig));

    // Validate rolled back configuration
    this.validateConfiguration();

    this.emit('configuration-rollback', {
      timestamp: currentTimestamp,
      rolledBackTo: timestamp,
      config: this.config
    });
  }
}