/**
 * WorkflowOrchestrator - Dynamic Workflow Creation and Execution
 * Orchestrates complex workflows with conditional branching, parallel execution,
 * and adaptive behavior based on Princess state machine coordination.
 */

import { EventEmitter } from 'events';
import LangGraphEngine from '../LangGraphEngine';
import { WorkflowDefinition, WorkflowExecution, ExecutionContext } from '../types/workflow.types';
import PrincessStateMachine from '../state-machines/PrincessStateMachine';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'infrastructure' | 'research' | 'development' | 'security' | 'deployment' | 'composite';
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  variables: WorkflowVariable[];
  metadata: {
    version: string;
    author: string;
    complexity: 'simple' | 'medium' | 'complex';
    estimatedDuration: number;
  };
}

export interface WorkflowState {
  id: string;
  name: string;
  type: 'princess' | 'parallel' | 'conditional' | 'wait' | 'merge' | 'split';
  configuration: {
    princess?: string;
    tasks?: WorkflowTask[];
    condition?: string;
    branches?: WorkflowBranch[];
    timeout?: number;
    retryPolicy?: RetryPolicy;
  };
  position?: { x: number; y: number };
}

export interface WorkflowTransition {
  id: string;
  from: string;
  to: string;
  condition?: string;
  weight: number;
  metadata: {
    description: string;
    probability?: number;
  };
}

export interface WorkflowTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  dependencies: string[];
}

export interface WorkflowBranch {
  id: string;
  condition: string;
  states: string[];
  mergePoint?: string;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  required: boolean;
  validation?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
}

export interface WorkflowMetrics {
  workflowId: string;
  executionMetrics: {
    totalDuration: number;
    stateExecutionTimes: Record<string, number>;
    transitionTimes: Record<string, number>;
    retryCount: number;
    errorCount: number;
  };
  princessMetrics: Record<string, {
    tasksExecuted: number;
    averageExecutionTime: number;
    errorRate: number;
    utilization: number;
  }>;
  resourceMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    networkUsage: number;
  };
}

export interface OptimizationSuggestion {
  type: 'parallelization' | 'caching' | 'reordering' | 'resource_allocation';
  target: string;
  description: string;
  expectedImprovement: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

export class WorkflowOrchestrator extends EventEmitter {
  private engine: LangGraphEngine;
  private templates: Map<string, WorkflowTemplate>;
  private runningWorkflows: Map<string, WorkflowExecution>;
  private workflowMetrics: Map<string, WorkflowMetrics>;
  private optimizationEngine: WorkflowOptimizer;

  constructor(engine: LangGraphEngine) {
    super();
    this.engine = engine;
    this.templates = new Map();
    this.runningWorkflows = new Map();
    this.workflowMetrics = new Map();
    this.optimizationEngine = new WorkflowOptimizer();

    this.initializeStandardTemplates();
    this.setupEventHandlers();
  }

  /**
   * Create a workflow from a template
   */
  async createWorkflowFromTemplate(
    templateId: string,
    variables: Record<string, any> = {},
    context: ExecutionContext = {}
  ): Promise<WorkflowDefinition> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`);
    }

    // Validate variables
    const validation = this.validateTemplateVariables(template, variables);
    if (!validation.isValid) {
      throw new Error(`Variable validation failed: ${validation.errors.join(', ')}`);
    }

    // Substitute variables in template
    const workflowDefinition = this.substituteVariables(template, variables);

    // Add execution context
    workflowDefinition.context = { ...context, templateId, variables };

    return workflowDefinition;
  }

  /**
   * Create a dynamic workflow from natural language description
   */
  async createWorkflowFromDescription(
    description: string,
    context: ExecutionContext = {}
  ): Promise<WorkflowDefinition> {
    // Parse natural language description
    const parsedRequirements = await this.parseWorkflowDescription(description);

    // Generate workflow structure
    const workflowStructure = await this.generateWorkflowStructure(parsedRequirements);

    // Optimize workflow
    const optimizedWorkflow = await this.optimizeWorkflow(workflowStructure);

    // Add execution context
    optimizedWorkflow.context = { ...context, description, requirements: parsedRequirements };

    return optimizedWorkflow;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowDefinition: WorkflowDefinition,
    context: ExecutionContext = {}
  ): Promise<string> {
    // Validate workflow definition
    const validation = await this.validateWorkflowDefinition(workflowDefinition);
    if (!validation.isValid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
    }

    // Create execution context with metrics tracking
    const executionContext = {
      ...context,
      workflowId: `workflow_${Date.now()}`,
      startTime: new Date(),
      metricsEnabled: true
    };

    // Initialize metrics
    this.initializeWorkflowMetrics(executionContext.workflowId, workflowDefinition);

    // Execute workflow using the engine
    const workflowId = await this.engine.executeWorkflow(workflowDefinition, executionContext);

    // Track execution
    this.runningWorkflows.set(workflowId, {
      id: workflowId,
      definition: workflowDefinition,
      context: executionContext,
      status: 'running',
      currentState: workflowDefinition.initialState,
      startTime: new Date(),
      stateHistory: []
    });

    this.emit('workflowStarted', workflowId, workflowDefinition);
    return workflowId;
  }

  /**
   * Create a composite workflow from multiple Princess domains
   */
  async createCompositeWorkflow(
    domains: string[],
    coordination: 'sequential' | 'parallel' | 'conditional',
    context: ExecutionContext = {}
  ): Promise<WorkflowDefinition> {
    const workflowStates: WorkflowState[] = [];
    const workflowTransitions: WorkflowTransition[] = [];

    switch (coordination) {
      case 'sequential':
        workflowStates.push(...this.createSequentialStates(domains));
        workflowTransitions.push(...this.createSequentialTransitions(domains));
        break;

      case 'parallel':
        workflowStates.push(...this.createParallelStates(domains));
        workflowTransitions.push(...this.createParallelTransitions(domains));
        break;

      case 'conditional':
        workflowStates.push(...this.createConditionalStates(domains));
        workflowTransitions.push(...this.createConditionalTransitions(domains));
        break;
    }

    return {
      id: `composite_${Date.now()}`,
      name: `Composite Workflow - ${coordination}`,
      description: `Composite workflow coordinating ${domains.join(', ')} domains`,
      states: workflowStates,
      transitions: workflowTransitions,
      initialState: workflowStates[0].id,
      finalStates: [workflowStates[workflowStates.length - 1].id],
      variables: [],
      context
    };
  }

  /**
   * Get workflow execution status
   */
  getWorkflowStatus(workflowId: string): WorkflowExecution | null {
    return this.runningWorkflows.get(workflowId) || null;
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(workflowId: string): WorkflowMetrics | null {
    return this.workflowMetrics.get(workflowId) || null;
  }

  /**
   * Get optimization suggestions for a workflow
   */
  async getOptimizationSuggestions(workflowId: string): Promise<OptimizationSuggestion[]> {
    const metrics = this.workflowMetrics.get(workflowId);
    if (!metrics) {
      throw new Error(`No metrics found for workflow: ${workflowId}`);
    }

    return this.optimizationEngine.analyzeWorkflow(metrics);
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    await this.engine.cancelWorkflow(workflowId);
    this.runningWorkflows.delete(workflowId);
    this.emit('workflowCancelled', workflowId);
  }

  /**
   * List available workflow templates
   */
  getAvailableTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Register a custom workflow template
   */
  registerTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
    this.emit('templateRegistered', template.id);
  }

  /**
   * Private methods
   */
  private initializeStandardTemplates(): void {
    const templates: WorkflowTemplate[] = [
      this.createInfrastructureDeploymentTemplate(),
      this.createResearchAnalysisTemplate(),
      this.createSecurityAuditTemplate(),
      this.createDevelopmentPipelineTemplate(),
      this.createEmergencyResponseTemplate()
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private createInfrastructureDeploymentTemplate(): WorkflowTemplate {
    return {
      id: 'infrastructure-deployment',
      name: 'Infrastructure Deployment',
      description: 'Complete infrastructure deployment workflow',
      category: 'infrastructure',
      states: [
        {
          id: 'provision',
          name: 'Provision Resources',
          type: 'princess',
          configuration: {
            princess: 'infrastructure',
            tasks: [{
              id: 'provision-task',
              type: 'provision',
              priority: 'high',
              payload: { resourceType: '${resourceType}', region: '${region}' },
              dependencies: []
            }]
          }
        },
        {
          id: 'security-scan',
          name: 'Security Scan',
          type: 'princess',
          configuration: {
            princess: 'security',
            tasks: [{
              id: 'scan-task',
              type: 'scan',
              priority: 'high',
              payload: { target: 'provisioned-resources' },
              dependencies: ['provision-task']
            }]
          }
        },
        {
          id: 'deploy',
          name: 'Deploy Application',
          type: 'princess',
          configuration: {
            princess: 'deployment',
            tasks: [{
              id: 'deploy-task',
              type: 'deploy',
              priority: 'high',
              payload: { environment: '${environment}' },
              dependencies: ['scan-task']
            }]
          }
        }
      ],
      transitions: [
        {
          id: 'provision-to-security',
          from: 'provision',
          to: 'security-scan',
          weight: 1,
          metadata: { description: 'Move to security scan after provisioning' }
        },
        {
          id: 'security-to-deploy',
          from: 'security-scan',
          to: 'deploy',
          condition: 'context.securityPassed === true',
          weight: 1,
          metadata: { description: 'Deploy if security scan passes' }
        }
      ],
      variables: [
        { name: 'resourceType', type: 'string', required: true },
        { name: 'region', type: 'string', required: true },
        { name: 'environment', type: 'string', required: true }
      ],
      metadata: {
        version: '1.0.0',
        author: 'WorkflowOrchestrator',
        complexity: 'medium',
        estimatedDuration: 900000 // 15 minutes
      }
    };
  }

  private createResearchAnalysisTemplate(): WorkflowTemplate {
    return {
      id: 'research-analysis',
      name: 'Research Analysis Pipeline',
      description: 'Complete research analysis workflow from search to publication',
      category: 'research',
      states: [
        {
          id: 'search',
          name: 'Conduct Research',
          type: 'princess',
          configuration: {
            princess: 'research',
            tasks: [{
              id: 'search-task',
              type: 'search',
              priority: 'medium',
              payload: { query: '${query}', domain: '${domain}' },
              dependencies: []
            }]
          }
        },
        {
          id: 'analyze',
          name: 'Analyze Content',
          type: 'princess',
          configuration: {
            princess: 'research',
            tasks: [{
              id: 'analyze-task',
              type: 'analyze',
              priority: 'medium',
              payload: { analysisType: '${analysisType}' },
              dependencies: ['search-task']
            }]
          }
        },
        {
          id: 'synthesize',
          name: 'Synthesize Findings',
          type: 'princess',
          configuration: {
            princess: 'research',
            tasks: [{
              id: 'synthesize-task',
              type: 'synthesize',
              priority: 'medium',
              payload: { synthesisScope: '${scope}' },
              dependencies: ['analyze-task']
            }]
          }
        }
      ],
      transitions: [
        {
          id: 'search-to-analyze',
          from: 'search',
          to: 'analyze',
          weight: 1,
          metadata: { description: 'Analyze search results' }
        },
        {
          id: 'analyze-to-synthesize',
          from: 'analyze',
          to: 'synthesize',
          weight: 1,
          metadata: { description: 'Synthesize analysis results' }
        }
      ],
      variables: [
        { name: 'query', type: 'string', required: true },
        { name: 'domain', type: 'string', required: false },
        { name: 'analysisType', type: 'string', defaultValue: 'mixed' },
        { name: 'scope', type: 'string', defaultValue: 'comprehensive' }
      ],
      metadata: {
        version: '1.0.0',
        author: 'WorkflowOrchestrator',
        complexity: 'medium',
        estimatedDuration: 1200000 // 20 minutes
      }
    };
  }

  private createSecurityAuditTemplate(): WorkflowTemplate {
    return {
      id: 'security-audit',
      name: 'Security Audit Workflow',
      description: 'Comprehensive security audit and remediation workflow',
      category: 'security',
      states: [
        {
          id: 'scan',
          name: 'Security Scan',
          type: 'princess',
          configuration: {
            princess: 'security',
            tasks: [{
              id: 'scan-task',
              type: 'scan',
              priority: 'critical',
              payload: { target: '${target}', depth: '${depth}' },
              dependencies: []
            }]
          }
        },
        {
          id: 'assess',
          name: 'Risk Assessment',
          type: 'princess',
          configuration: {
            princess: 'security',
            tasks: [{
              id: 'assess-task',
              type: 'assess',
              priority: 'high',
              payload: { criteria: '${criteria}' },
              dependencies: ['scan-task']
            }]
          }
        },
        {
          id: 'remediate',
          name: 'Remediate Issues',
          type: 'conditional',
          configuration: {
            condition: 'context.riskLevel > ${threshold}',
            branches: [{
              id: 'high-risk',
              condition: 'context.riskLevel >= 8',
              states: ['immediate-remediation']
            }, {
              id: 'medium-risk',
              condition: 'context.riskLevel >= 5',
              states: ['scheduled-remediation']
            }]
          }
        }
      ],
      transitions: [
        {
          id: 'scan-to-assess',
          from: 'scan',
          to: 'assess',
          weight: 1,
          metadata: { description: 'Assess scan results' }
        },
        {
          id: 'assess-to-remediate',
          from: 'assess',
          to: 'remediate',
          weight: 1,
          metadata: { description: 'Remediate based on assessment' }
        }
      ],
      variables: [
        { name: 'target', type: 'string', required: true },
        { name: 'depth', type: 'string', defaultValue: 'full' },
        { name: 'criteria', type: 'string', defaultValue: 'OWASP' },
        { name: 'threshold', type: 'number', defaultValue: 5 }
      ],
      metadata: {
        version: '1.0.0',
        author: 'WorkflowOrchestrator',
        complexity: 'complex',
        estimatedDuration: 1800000 // 30 minutes
      }
    };
  }

  private createDevelopmentPipelineTemplate(): WorkflowTemplate {
    return {
      id: 'development-pipeline',
      name: 'Development Pipeline',
      description: 'Complete development pipeline from code to deployment',
      category: 'development',
      states: [
        {
          id: 'build',
          name: 'Build Application',
          type: 'princess',
          configuration: {
            princess: 'development',
            tasks: [{
              id: 'build-task',
              type: 'build',
              priority: 'high',
              payload: { source: '${source}', target: '${target}' },
              dependencies: []
            }]
          }
        },
        {
          id: 'test',
          name: 'Run Tests',
          type: 'parallel',
          configuration: {
            tasks: [
              {
                id: 'unit-tests',
                type: 'test',
                priority: 'high',
                payload: { type: 'unit' },
                dependencies: ['build-task']
              },
              {
                id: 'integration-tests',
                type: 'test',
                priority: 'high',
                payload: { type: 'integration' },
                dependencies: ['build-task']
              }
            ]
          }
        },
        {
          id: 'deploy',
          name: 'Deploy Application',
          type: 'princess',
          configuration: {
            princess: 'deployment',
            tasks: [{
              id: 'deploy-task',
              type: 'deploy',
              priority: 'high',
              payload: { environment: '${environment}' },
              dependencies: ['unit-tests', 'integration-tests']
            }]
          }
        }
      ],
      transitions: [
        {
          id: 'build-to-test',
          from: 'build',
          to: 'test',
          weight: 1,
          metadata: { description: 'Run tests after build' }
        },
        {
          id: 'test-to-deploy',
          from: 'test',
          to: 'deploy',
          condition: 'context.testsPass === true',
          weight: 1,
          metadata: { description: 'Deploy if tests pass' }
        }
      ],
      variables: [
        { name: 'source', type: 'string', required: true },
        { name: 'target', type: 'string', required: true },
        { name: 'environment', type: 'string', required: true }
      ],
      metadata: {
        version: '1.0.0',
        author: 'WorkflowOrchestrator',
        complexity: 'medium',
        estimatedDuration: 600000 // 10 minutes
      }
    };
  }

  private createEmergencyResponseTemplate(): WorkflowTemplate {
    return {
      id: 'emergency-response',
      name: 'Emergency Response',
      description: 'Emergency response workflow for critical incidents',
      category: 'composite',
      states: [
        {
          id: 'assess',
          name: 'Assess Situation',
          type: 'parallel',
          configuration: {
            tasks: [
              {
                id: 'security-assess',
                type: 'assess',
                priority: 'critical',
                payload: { type: 'security' },
                dependencies: []
              },
              {
                id: 'infrastructure-assess',
                type: 'assess',
                priority: 'critical',
                payload: { type: 'infrastructure' },
                dependencies: []
              }
            ]
          }
        },
        {
          id: 'respond',
          name: 'Execute Response',
          type: 'conditional',
          configuration: {
            condition: 'context.severity',
            branches: [
              {
                id: 'critical-response',
                condition: 'context.severity === \"critical\"',
                states: ['immediate-mitigation', 'emergency-communication']
              },
              {
                id: 'high-response',
                condition: 'context.severity === \"high\"',
                states: ['standard-mitigation', 'stakeholder-notification']
              }
            ]
          }
        }
      ],
      transitions: [
        {
          id: 'assess-to-respond',
          from: 'assess',
          to: 'respond',
          weight: 1,
          metadata: { description: 'Execute response based on assessment' }
        }
      ],
      variables: [
        { name: 'incident_id', type: 'string', required: true },
        { name: 'severity', type: 'string', required: true }
      ],
      metadata: {
        version: '1.0.0',
        author: 'WorkflowOrchestrator',
        complexity: 'complex',
        estimatedDuration: 1200000 // 20 minutes
      }
    };
  }

  private validateTemplateVariables(
    template: WorkflowTemplate,
    variables: Record<string, any>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const variable of template.variables) {
      const value = variables[variable.name];

      // Check required variables
      if (variable.required && (value === undefined || value === null)) {
        errors.push(`Required variable missing: ${variable.name}`);
        continue;
      }

      // Check type validation
      if (value !== undefined && value !== null) {
        const expectedType = variable.type;
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        if (expectedType !== actualType) {
          errors.push(`Variable ${variable.name} expected ${expectedType}, got ${actualType}`);
        }

        // Custom validation
        if (variable.validation) {
          try {
            const isValid = new Function('value', `return ${variable.validation}`)(value);
            if (!isValid) {
              errors.push(`Variable ${variable.name} failed validation: ${variable.validation}`);
            }
          } catch (error) {
            errors.push(`Variable ${variable.name} validation error: ${error.message}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private substituteVariables(
    template: WorkflowTemplate,
    variables: Record<string, any>
  ): WorkflowDefinition {
    // Deep clone template
    const workflowDefinition = JSON.parse(JSON.stringify(template));

    // Add default values for missing variables
    const allVariables = { ...variables };
    template.variables.forEach(variable => {
      if (!(variable.name in allVariables) && variable.defaultValue !== undefined) {
        allVariables[variable.name] = variable.defaultValue;
      }
    });

    // Substitute variables in the workflow definition
    const jsonString = JSON.stringify(workflowDefinition);
    const substituted = jsonString.replace(/\\$\\{([^}]+)\\}/g, (match, variableName) => {
      return allVariables[variableName] !== undefined
        ? JSON.stringify(allVariables[variableName]).slice(1, -1) // Remove quotes
        : match;
    });

    return JSON.parse(substituted);
  }

  private async parseWorkflowDescription(description: string): Promise<any> {
    // Simplified natural language parsing
    // In production, would use proper NLP libraries
    const requirements = {
      domains: [],
      actions: [],
      conditions: [],
      priorities: [],
      timeframes: []
    };

    // Extract domains
    const domainKeywords = {
      infrastructure: ['infrastructure', 'provision', 'deploy', 'server', 'cloud'],
      research: ['research', 'analyze', 'study', 'investigate', 'search'],
      security: ['security', 'scan', 'audit', 'vulnerability', 'threat'],
      development: ['develop', 'build', 'code', 'test', 'compile'],
      deployment: ['deploy', 'release', 'publish', 'launch']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => description.toLowerCase().includes(keyword))) {
        requirements.domains.push(domain);
      }
    }

    // Extract actions
    const actionKeywords = ['create', 'update', 'delete', 'monitor', 'backup', 'optimize'];
    requirements.actions = actionKeywords.filter(action =>
      description.toLowerCase().includes(action)
    );

    // Extract priorities
    if (description.toLowerCase().includes('urgent') || description.toLowerCase().includes('critical')) {
      requirements.priorities.push('critical');
    } else if (description.toLowerCase().includes('important') || description.toLowerCase().includes('high')) {
      requirements.priorities.push('high');
    } else {
      requirements.priorities.push('medium');
    }

    return requirements;
  }

  private async generateWorkflowStructure(requirements: any): Promise<WorkflowDefinition> {
    const states: WorkflowState[] = [];
    const transitions: WorkflowTransition[] = [];

    // Generate states based on domains and actions
    let stateId = 1;
    requirements.domains.forEach((domain, index) => {
      const state: WorkflowState = {
        id: `state_${stateId++}`,
        name: `${domain} Task`,
        type: 'princess',
        configuration: {
          princess: domain,
          tasks: requirements.actions.map(action => ({
            id: `${domain}_${action}_task`,
            type: action,
            priority: requirements.priorities[0] || 'medium',
            payload: {},
            dependencies: index > 0 ? [`state_${stateId - 2}`] : []
          }))
        }
      };
      states.push(state);

      // Create transition to next state
      if (index < requirements.domains.length - 1) {
        transitions.push({
          id: `transition_${index}`,
          from: `state_${stateId - 1}`,
          to: `state_${stateId}`,
          weight: 1,
          metadata: {
            description: `Transition from ${domain} to next domain`
          }
        });
      }
    });

    return {
      id: `dynamic_${Date.now()}`,
      name: 'Dynamic Workflow',
      description: 'Dynamically generated workflow',
      states,
      transitions,
      initialState: states[0]?.id || 'start',
      finalStates: [states[states.length - 1]?.id || 'end'],
      variables: [],
      context: {}
    };
  }

  private async optimizeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    // Identify optimization opportunities
    const optimizations = await this.optimizationEngine.analyzeWorkflowStructure(workflow);

    // Apply optimizations
    let optimizedWorkflow = { ...workflow };

    for (const optimization of optimizations) {
      switch (optimization.type) {
        case 'parallelization':
          optimizedWorkflow = this.applyParallelizationOptimization(optimizedWorkflow, optimization);
          break;
        case 'reordering':
          optimizedWorkflow = this.applyReorderingOptimization(optimizedWorkflow, optimization);
          break;
        case 'caching':
          optimizedWorkflow = this.applyCachingOptimization(optimizedWorkflow, optimization);
          break;
      }
    }

    return optimizedWorkflow;
  }

  private async validateWorkflowDefinition(
    workflow: WorkflowDefinition
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!workflow.id) errors.push('Workflow ID is required');
    if (!workflow.name) errors.push('Workflow name is required');
    if (!workflow.states || workflow.states.length === 0) {
      errors.push('Workflow must have at least one state');
    }
    if (!workflow.initialState) errors.push('Initial state is required');

    // Validate state references
    const stateIds = new Set(workflow.states.map(s => s.id));
    if (!stateIds.has(workflow.initialState)) {
      errors.push(`Initial state '${workflow.initialState}' not found`);
    }

    workflow.finalStates?.forEach(finalState => {
      if (!stateIds.has(finalState)) {
        errors.push(`Final state '${finalState}' not found`);
      }
    });

    // Validate transitions
    workflow.transitions?.forEach(transition => {
      if (!stateIds.has(transition.from)) {
        errors.push(`Transition from state '${transition.from}' not found`);
      }
      if (!stateIds.has(transition.to)) {
        errors.push(`Transition to state '${transition.to}' not found`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private initializeWorkflowMetrics(workflowId: string, workflow: WorkflowDefinition): void {
    this.workflowMetrics.set(workflowId, {
      workflowId,
      executionMetrics: {
        totalDuration: 0,
        stateExecutionTimes: {},
        transitionTimes: {},
        retryCount: 0,
        errorCount: 0
      },
      princessMetrics: {},
      resourceMetrics: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkUsage: 0
      }
    });
  }

  private createSequentialStates(domains: string[]): WorkflowState[] {
    return domains.map((domain, index) => ({
      id: `${domain}_state`,
      name: `${domain} Processing`,
      type: 'princess' as const,
      configuration: {
        princess: domain,
        tasks: [{
          id: `${domain}_task`,
          type: 'process',
          priority: 'medium' as const,
          payload: {},
          dependencies: index > 0 ? [`${domains[index - 1]}_task`] : []
        }]
      }
    }));
  }

  private createSequentialTransitions(domains: string[]): WorkflowTransition[] {
    const transitions: WorkflowTransition[] = [];

    for (let i = 0; i < domains.length - 1; i++) {
      transitions.push({
        id: `${domains[i]}_to_${domains[i + 1]}`,
        from: `${domains[i]}_state`,
        to: `${domains[i + 1]}_state`,
        weight: 1,
        metadata: {
          description: `Sequential transition from ${domains[i]} to ${domains[i + 1]}`
        }
      });
    }

    return transitions;
  }

  private createParallelStates(domains: string[]): WorkflowState[] {
    const states: WorkflowState[] = [];

    // Start state
    states.push({
      id: 'start',
      name: 'Start Parallel Execution',
      type: 'split',
      configuration: {}
    });

    // Parallel states for each domain
    domains.forEach(domain => {
      states.push({
        id: `${domain}_state`,
        name: `${domain} Processing`,
        type: 'princess',
        configuration: {
          princess: domain,
          tasks: [{
            id: `${domain}_task`,
            type: 'process',
            priority: 'medium',
            payload: {},
            dependencies: []
          }]
        }
      });
    });

    // Merge state
    states.push({
      id: 'merge',
      name: 'Merge Results',
      type: 'merge',
      configuration: {}
    });

    return states;
  }

  private createParallelTransitions(domains: string[]): WorkflowTransition[] {
    const transitions: WorkflowTransition[] = [];

    // Start to all parallel states
    domains.forEach(domain => {
      transitions.push({
        id: `start_to_${domain}`,
        from: 'start',
        to: `${domain}_state`,
        weight: 1,
        metadata: {
          description: `Start ${domain} processing`
        }
      });
    });

    // All parallel states to merge
    domains.forEach(domain => {
      transitions.push({
        id: `${domain}_to_merge`,
        from: `${domain}_state`,
        to: 'merge',
        weight: 1,
        metadata: {
          description: `${domain} processing complete`
        }
      });
    });

    return transitions;
  }

  private createConditionalStates(domains: string[]): WorkflowState[] {
    const states: WorkflowState[] = [];

    // Decision state
    states.push({
      id: 'decision',
      name: 'Route Decision',
      type: 'conditional',
      configuration: {
        condition: 'context.routingDecision',
        branches: domains.map(domain => ({
          id: domain,
          condition: `context.routingDecision === '${domain}'`,
          states: [`${domain}_state`]
        }))
      }
    });

    // States for each domain
    domains.forEach(domain => {
      states.push({
        id: `${domain}_state`,
        name: `${domain} Processing`,
        type: 'princess',
        configuration: {
          princess: domain,
          tasks: [{
            id: `${domain}_task`,
            type: 'process',
            priority: 'medium',
            payload: {},
            dependencies: []
          }]
        }
      });
    });

    return states;
  }

  private createConditionalTransitions(domains: string[]): WorkflowTransition[] {
    const transitions: WorkflowTransition[] = [];

    domains.forEach(domain => {
      transitions.push({
        id: `decision_to_${domain}`,
        from: 'decision',
        to: `${domain}_state`,
        condition: `context.routingDecision === '${domain}'`,
        weight: 1,
        metadata: {
          description: `Route to ${domain} based on decision`
        }
      });
    });

    return transitions;
  }

  private applyParallelizationOptimization(
    workflow: WorkflowDefinition,
    optimization: OptimizationSuggestion
  ): WorkflowDefinition {
    // Implementation would modify workflow to execute independent states in parallel
    return workflow;
  }

  private applyReorderingOptimization(
    workflow: WorkflowDefinition,
    optimization: OptimizationSuggestion
  ): WorkflowDefinition {
    // Implementation would reorder states for optimal execution
    return workflow;
  }

  private applyCachingOptimization(
    workflow: WorkflowDefinition,
    optimization: OptimizationSuggestion
  ): WorkflowDefinition {
    // Implementation would add caching directives to states
    return workflow;
  }

  private setupEventHandlers(): void {
    this.engine.on('workflowCompleted', (workflowId) => {
      this.handleWorkflowCompleted(workflowId);
    });

    this.engine.on('workflowFailed', (workflowId, error) => {
      this.handleWorkflowFailed(workflowId, error);
    });

    this.engine.on('stateChanged', (workflowId, oldState, newState) => {
      this.updateWorkflowMetrics(workflowId, 'stateChange', { oldState, newState });
    });
  }

  private handleWorkflowCompleted(workflowId: string): void {
    const execution = this.runningWorkflows.get(workflowId);
    if (execution) {
      execution.status = 'completed';
      execution.endTime = new Date();
      this.runningWorkflows.delete(workflowId);
    }

    this.emit('workflowCompleted', workflowId);
  }

  private handleWorkflowFailed(workflowId: string, error: Error): void {
    const execution = this.runningWorkflows.get(workflowId);
    if (execution) {
      execution.status = 'failed';
      execution.error = error;
      execution.endTime = new Date();
      this.runningWorkflows.delete(workflowId);
    }

    this.emit('workflowFailed', workflowId, error);
  }

  private updateWorkflowMetrics(workflowId: string, event: string, data: any): void {
    const metrics = this.workflowMetrics.get(workflowId);
    if (metrics) {
      // Update metrics based on event type
      switch (event) {
        case 'stateChange':
          metrics.executionMetrics.stateExecutionTimes[data.oldState] =
            (metrics.executionMetrics.stateExecutionTimes[data.oldState] || 0) + 1;
          break;
        // Add more event types as needed
      }
    }
  }
}

/***
* * WorkflowOptimizer - Analyzes workflows for optimization opportunities
* */
class WorkflowOptimizer {
  async analyzeWorkflow(metrics: WorkflowMetrics): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze for parallelization opportunities
    const parallelizationSuggestions = this.analyzeParallelization(metrics);
    suggestions.push(...parallelizationSuggestions);

    // Analyze for caching opportunities
    const cachingSuggestions = this.analyzeCaching(metrics);
    suggestions.push(...cachingSuggestions);

    // Analyze for reordering opportunities
    const reorderingSuggestions = this.analyzeReordering(metrics);
    suggestions.push(...reorderingSuggestions);

    return suggestions;
  }

  async analyzeWorkflowStructure(workflow: WorkflowDefinition): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Static analysis of workflow structure
    const independentStates = this.findIndependentStates(workflow);
    if (independentStates.length > 1) {
      suggestions.push({
        type: 'parallelization',
        target: independentStates.join(', '),
        description: `States ${independentStates.join(', ')} can be executed in parallel`,
        expectedImprovement: 0.3,
        implementationComplexity: 'medium'
      });
    }

    return suggestions;
  }

  private analyzeParallelization(metrics: WorkflowMetrics): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Look for sequential states that could be parallelized
    const sequentialStates = Object.keys(metrics.executionMetrics.stateExecutionTimes);
    if (sequentialStates.length > 2) {
      suggestions.push({
        type: 'parallelization',
        target: 'workflow-structure',
        description: 'Multiple states can potentially be executed in parallel',
        expectedImprovement: 0.4,
        implementationComplexity: 'medium'
      });
    }

    return suggestions;
  }

  private analyzeCaching(metrics: WorkflowMetrics): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Look for repeated operations that could benefit from caching
    const executionCounts = Object.values(metrics.executionMetrics.stateExecutionTimes);
    const maxExecutions = Math.max(...executionCounts);

    if (maxExecutions > 3) {
      suggestions.push({
        type: 'caching',
        target: 'frequently-executed-states',
        description: 'Frequently executed states can benefit from result caching',
        expectedImprovement: 0.2,
        implementationComplexity: 'low'
      });
    }

    return suggestions;
  }

  private analyzeReordering(metrics: WorkflowMetrics): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Look for states that could be reordered for better performance
    const transitionTimes = metrics.executionMetrics.transitionTimes;
    const slowTransitions = Object.entries(transitionTimes)
      .filter(([_, time]) => time > 1000) // > 1 second
      .map(([transition, _]) => transition);

    if (slowTransitions.length > 0) {
      suggestions.push({
        type: 'reordering',
        target: slowTransitions.join(', '),
        description: 'Slow transitions can be optimized by reordering states',
        expectedImprovement: 0.15,
        implementationComplexity: 'high'
      });
    }

    return suggestions;
  }

  private findIndependentStates(workflow: WorkflowDefinition): string[] {
    const dependencies = new Map<string, Set<string>>();

    // Build dependency graph
    workflow.states.forEach(state => {
      dependencies.set(state.id, new Set());
      if (state.configuration.tasks) {
        state.configuration.tasks.forEach(task => {
          task.dependencies.forEach(dep => {
            dependencies.get(state.id)?.add(dep);
          });
        });
      }
    });

    // Find states with no dependencies
    return Array.from(dependencies.entries())
      .filter(([_, deps]) => deps.size === 0)
      .map(([stateId, _]) => stateId);
  }
}

export default WorkflowOrchestrator;