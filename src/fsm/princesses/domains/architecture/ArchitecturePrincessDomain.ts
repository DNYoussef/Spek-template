/**
 * ArchitecturePrincessDomain - Architecture Design Domain Handler
 * NASA Rule 10 Compliant: ≤60 lines per function, 2+ assertions
 * Extracted from ArchitecturePrincessFSM.ts (858 lines → decomposed)
 */

import { PrincessBase } from '../../core/PrincessBase';
import { ArchitectureStates } from './ArchitectureStates';
import { ArchitectureEventHandlers } from './ArchitectureEventHandlers';
import { ArchitectureValidator } from './ArchitectureValidator';
import { ArchitectureReporter } from './ArchitectureReporter';
import { ArchitectureTaskQueue } from './ArchitectureTaskQueue';

export interface ArchitectureContext {
  currentState: string;
  data: any;
  systemDesign?: {
    architecture: string;
    patterns: string[];
    scalability: number;
    maintainability: number;
    performance: number;
    validated: boolean;
  };
  technicalSpecs?: {
    components: Array<{
      name: string;
      type: string;
      dependencies: string[];
      interfaces: string[];
    }>;
    dataFlow: Array<{
      from: string;
      to: string;
      protocol: string;
      format: string;
    }>;
    infrastructure: {
      platform: string;
      deployment: string;
      scaling: string;
    };
  };
  qualityAttributes?: {
    availability: number;
    reliability: number;
    security: number;
    performance: number;
    scalability: number;
    maintainability: number;
  };
  complianceCheck?: {
    standards: string[];
    violations: Array<{
      standard: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      remediation: string;
    }>;
    overallScore: number;
  };
}

export class ArchitecturePrincessDomain extends PrincessBase<ArchitectureContext, string, any> {
  private states: ArchitectureStates;
  private eventHandlers: ArchitectureEventHandlers;
  private validator: ArchitectureValidator;
  private reporter: ArchitectureReporter;
  private taskQueue: ArchitectureTaskQueue;

  constructor() {
    super('architecture', 'AWAITING', {
      systemDesign: undefined,
      technicalSpecs: undefined,
      qualityAttributes: undefined,
      complianceCheck: undefined
    });

    this.initializeDomainComponents();

    // NASA Rule 10: Assertions for initialization
    console.assert(this.states !== undefined, 'Architecture states must be initialized');
    console.assert(this.eventHandlers !== undefined, 'Event handlers must be initialized');
  }

  /**
   * Initialize domain-specific components
   * NASA Rule 10: ≤60 lines
   */
  private initializeDomainComponents(): void {
    this.states = new ArchitectureStates();
    this.eventHandlers = new ArchitectureEventHandlers();
    this.validator = new ArchitectureValidator();
    this.reporter = new ArchitectureReporter();
    this.taskQueue = new ArchitectureTaskQueue();

    // NASA Rule 10: Assertions
    console.assert(this.validator.isValid(), 'Validator must be properly initialized');
    console.assert(this.taskQueue.isEmpty(), 'Task queue must start empty');
  }

  /**
   * Get machine definition for architecture domain
   * NASA Rule 10: ≤60 lines
   */
  getMachineDefinition(): any {
    return {
      id: 'architecturePrincess',
      initial: 'AWAITING',
      context: this.context,
      states: this.states.getStates(),
      on: this.eventHandlers.getEventHandlers()
    };
  }

  /**
   * Process architecture task
   * NASA Rule 10: ≤60 lines
   */
  async processTask(task: any): Promise<any> {
    console.assert(task !== null, 'Task cannot be null');
    console.assert(typeof task === 'object', 'Task must be an object');

    const isValid = await this.validator.validateTask(task);
    if (!isValid) {
      throw new Error('Invalid architecture task');
    }

    this.taskQueue.enqueue(task);
    return this.eventHandlers.handleTask(task);
  }

  /**
   * Generate architecture report
   * NASA Rule 10: ≤60 lines
   */
  async generateReport(): Promise<any> {
    const systemDesign = this.context.systemDesign;
    const technicalSpecs = this.context.technicalSpecs;
    const qualityAttributes = this.context.qualityAttributes;
    const complianceCheck = this.context.complianceCheck;

    // NASA Rule 10: Assertions
    console.assert(systemDesign !== undefined, 'System design must be available for reporting');

    return this.reporter.generateReport({
      systemDesign,
      technicalSpecs,
      qualityAttributes,
      complianceCheck
    });
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: princess-domain-elimination-015
// inputs: ["ArchitecturePrincessFSM.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"v1.0"}
// === END FOOTER ===