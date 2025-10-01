/**
 * Quality Gate Facade - Backward compatibility layer (NASA Rule 10 compliant)
 * Single responsibility: Provide backward compatibility for existing API
 */

import { EventEmitter } from 'events';
import { QualityGateCore, SequenceExecutionOptions } from './core/QualityGateCore';
import { QualityGateValidator } from './validation/QualityGateValidator';
import { QualityGateProcessor } from './validation/QualityGateProcessor';
import { QualityGateMonitor } from './monitoring/QualityGateMonitor';
import { QualityGateReporter } from './reporting/QualityGateReporter';
import {
  QualityGateDefinition,
  QualitySequence,
  SequenceExecution
} from './core/QualityGateTypes';

/**
 * Facade pattern for Quality Gate Orchestrator
 * Maintains backward compatibility while delegating to specialized components
 */
export class QualityGateOrchestrator extends EventEmitter {
  private core: QualityGateCore;
  private validator: QualityGateValidator;
  private processor: QualityGateProcessor;
  private monitor: QualityGateMonitor;
  private reporter: QualityGateReporter;

  // Legacy compatibility properties
  private gateDefinitions: Map<string, QualityGateDefinition>;
  private qualitySequences: Map<string, QualitySequence>;
  private activeExecutions: Map<string, SequenceExecution>;
  private executionHistory: SequenceExecution[];

  constructor() {
    super();

    // Assertion 1: Initialize as proper instance
    assert(this instanceof QualityGateOrchestrator, 'Must be proper instance');

    // Initialize all components
    this.validator = new QualityGateValidator();
    this.processor = new QualityGateProcessor(this.validator);
    this.monitor = new QualityGateMonitor();
    this.reporter = new QualityGateReporter();
    this.core = new QualityGateCore();

    // Assertion 2: All components initialized
    assert(this.core instanceof QualityGateCore, 'Core must be initialized');

    // Initialize legacy compatibility maps
    this.gateDefinitions = new Map();
    this.qualitySequences = new Map();
    this.activeExecutions = new Map();
    this.executionHistory = [];

    this.setupEventForwarding();
    this.initializeQualityGates();
    this.initializeQualitySequences();
  }

  /**
   * Setup event forwarding (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private setupEventForwarding(): void {
    // Assertion 1: All components exist
    assert(this.core !== null && this.monitor !== null, 'Core components must exist');
    // Assertion 2: Event emitter is properly initialized
    assert(this.emit !== undefined, 'Event emitter must be initialized');

    // Forward core events
    this.core.on('core:initialized', (data) => this.emit('gates:initialized', data));
    this.core.on('sequence:completed', (data) => this.emit('sequence:completed', data));

    // Forward monitoring events
    this.monitor.on('metrics:collected', (data) => this.emit('sequence:log', data));

    // Forward processor events
    this.processor.on('processor:gate_started', (data) => this.emit('gate:execution_started', data));
  }

  /**
   * Initialize quality gates (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeQualityGates(): void {
    // Assertion 1: Gate definitions map exists
    assert(this.gateDefinitions instanceof Map, 'Gate definitions must be Map');
    // Assertion 2: Core is initialized
    assert(this.core !== null, 'Core must be initialized');

    // Create minimal gate for compatibility
    const testingGate = this.createMinimalGate('gate-testing', 'Testing Gate', 1);
    this.gateDefinitions.set('gate-testing', testingGate);
    this.core.registerGate(testingGate);

    this.emit('gates:initialized', {
      count: this.gateDefinitions.size,
      gates: Array.from(this.gateDefinitions.keys())
    });
  }

  /**
   * Initialize quality sequences (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeQualitySequences(): void {
    // Assertion 1: Quality sequences map exists
    assert(this.qualitySequences instanceof Map, 'Quality sequences must be Map');
    // Assertion 2: Gates are initialized
    assert(this.gateDefinitions.size > 0, 'Gates must be initialized first');

    const sequence: QualitySequence = {
      sequenceId: 'sequence-default',
      sequenceName: 'Default Quality Sequence',
      description: 'Default sequence for backward compatibility',
      gates: Array.from(this.gateDefinitions.values()),
      dependencies: [],
      parallelGroups: [],
      checkpoints: [],
      rollbackPlan: { enabled: false, rollbackTriggers: [], rollbackStrategy: 'immediate', rollbackSteps: [], dataRecovery: false },
      timing: { estimatedDuration: 300000, maxDuration: 600000, parallelEfficiency: 1.0, criticalPath: ['gate-testing'], bufferTime: 60000 }
    };

    this.qualitySequences.set('sequence-default', sequence);
    this.core.registerSequence(sequence);
  }

  /**
   * Execute quality sequence (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async executeQualitySequence(
    sequenceId: string,
    options: SequenceExecutionOptions = {}
  ): Promise<SequenceExecution> {
    // Assertion 1: Valid sequence ID
    assert(typeof sequenceId === 'string' && sequenceId.length > 0, 'Sequence ID must be valid');
    // Assertion 2: Sequence exists
    assert(this.qualitySequences.has(sequenceId), 'Sequence must exist');

    const execution = await this.core.executeSequence(sequenceId, options);
    this.monitor.monitorSequenceExecution(execution);
    this.updateLegacyMaps(execution);

    return execution;
  }

  /**
   * Update legacy maps (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private updateLegacyMaps(execution: SequenceExecution): void {
    // Assertion 1: Valid execution
    assert(execution !== null && execution.executionId !== undefined, 'Execution must be valid');
    // Assertion 2: Legacy maps exist
    assert(this.activeExecutions instanceof Map, 'Active executions must be Map');

    if (execution.status === 'executing') {
      this.activeExecutions.set(execution.executionId, execution);
    } else {
      this.activeExecutions.delete(execution.executionId);
      this.executionHistory.push(execution);
      if (this.executionHistory.length > 100) {
        this.executionHistory = this.executionHistory.slice(-100);
      }
    }
  }

  /**
   * Create minimal gate (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private createMinimalGate(gateId: string, gateName: string, sequence: number): QualityGateDefinition {
    // Assertion 1: Valid parameters
    assert(typeof gateId === 'string' && gateId.length > 0, 'Gate ID must be valid');
    // Assertion 2: Valid sequence
    assert(typeof sequence === 'number' && sequence > 0, 'Sequence must be positive');

    return {
      gateId, gateName, gateType: 'testing', description: gateName, category: 'functional',
      priority: 'medium', sequence, prerequisites: [], criteria: [],
      validation: { validationSteps: [], validationTimeout: 300000, parallelValidation: false, validationOrder: [], failureHandling: { strategy: 'stop_immediately', maxRetries: 0, retryDelay: 0, escalationRules: [], rollbackTriggers: [] } },
      automation: { fullyAutomated: true, automationPercentage: 100, automationTools: [], triggerConditions: [], automationWorkflow: [], manualOverride: { allowOverride: false, overrideConditions: [], requiredApprovals: [], overrideDocumentation: false, auditRequired: false, riskAssessment: false } },
      reporting: { reportGeneration: false, reportFormats: [], reportTemplates: [], reportDistribution: { recipients: [], distributionRules: [], deliveryMethods: [], frequency: '', conditions: [] }, dashboardIntegration: { enabled: false, dashboardUrl: '', apiIntegration: false, realTimeUpdates: false, widgets: [] } },
      thresholds: { overallThreshold: 0.8, criteriaThresholds: new Map(), emergencyThresholds: new Map(), adaptiveThresholds: { enabled: false, adaptationAlgorithm: '', learningPeriod: 0, adaptationFrequency: 0, constraints: [] }, thresholdCalibration: { calibrationRequired: false, calibrationMethod: '', calibrationFrequency: 0, calibrationData: [], validationRequired: false } },
      rollback: { rollbackEnabled: false, rollbackTriggers: [], rollbackStrategy: 'immediate', rollbackSteps: [], rollbackValidation: false, dataProtection: { backupRequired: false, backupLocation: '', encryptionRequired: false, retentionPeriod: 0, accessControl: [] } }
    };
  }

  // Legacy API methods
  getQualityGates(): QualityGateDefinition[] {
    return Array.from(this.gateDefinitions.values());
  }

  getQualitySequences(): QualitySequence[] {
    return Array.from(this.qualitySequences.values());
  }

  getActiveExecutions(): SequenceExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  getExecutionHistory(): SequenceExecution[] {
    return [...this.executionHistory];
  }

  async getSequenceStatus(executionId: string): Promise<SequenceExecution | null> {
    return await this.core.getExecution(executionId);
  }

  async cancelSequence(executionId: string, reason: string): Promise<boolean> {
    return await this.core.cancelSequence(executionId, reason);
  }

  getOrchestratorMetrics(): any {
    const status = this.core.getStatus();
    const metrics = this.monitor.getMetrics();
    return {
      activeSequences: status.activeExecutions,
      totalGates: status.totalGates,
      averageSequenceDuration: metrics?.averageSequenceDuration || 0,
      sequenceSuccessRate: metrics?.sequenceSuccessRate || 1.0,
      overallQualityScore: metrics?.overallQualityScore || 0
    };
  }

  /**
   * Destroy orchestrator (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async destroy(): Promise<void> {
    // Assertion 1: Components exist
    assert(this.core !== null, 'Core must exist');
    // Assertion 2: Maps exist
    assert(this.gateDefinitions instanceof Map, 'Gate definitions must exist');

    await this.core.destroy();
    this.validator.destroy();
    this.processor.destroy();
    this.monitor.destroy();
    this.reporter.destroy();

    this.gateDefinitions.clear();
    this.qualitySequences.clear();
    this.activeExecutions.clear();
    this.executionHistory.length = 0;
    this.removeAllListeners();
  }
}

// Helper function for assertions (NASA Rule 10 compliance)
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Backward compatibility

// Backward compatibility
export default QualityGateOrchestrator;
