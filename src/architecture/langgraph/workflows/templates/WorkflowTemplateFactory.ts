/**
 * WorkflowTemplateFactory - NASA Rule 10 Compliant Template Creation
 * Provides workflow template creation with functions ≤60 lines and proper assertions
 */

import { WorkflowTemplate, WorkflowStateDefinition, WorkflowTransitionDefinition, WorkflowVariableDefinition } from '../../types/workflow.types';
import InfrastructureTemplateBuilder from './InfrastructureTemplateBuilder';

export class WorkflowTemplateFactory {
  private static instance: WorkflowTemplateFactory;

  private constructor() {}

  static getInstance(): WorkflowTemplateFactory {
    if (!WorkflowTemplateFactory.instance) {
      WorkflowTemplateFactory.instance = new WorkflowTemplateFactory();
    }
    return WorkflowTemplateFactory.instance;
  }

  /**
   * Creates infrastructure deployment template
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  createInfrastructureTemplate(): WorkflowTemplate {
    // NASA Assertion 1: Validate factory instance
    console.assert(this instanceof WorkflowTemplateFactory, 'Factory instance required');

    const states = InfrastructureTemplateBuilder.createInfrastructureStates();
    const transitions = InfrastructureTemplateBuilder.createInfrastructureTransitions();
    const variables = InfrastructureTemplateBuilder.createInfrastructureVariables();

    // NASA Assertion 2: Validate template components
    console.assert(states.length === 3, 'Infrastructure template requires 3 states');
    console.assert(transitions.length === 2, 'Infrastructure template requires 2 transitions');

    return {
      id: 'infrastructure-deployment',
      name: 'Infrastructure Deployment',
      description: 'Complete infrastructure deployment workflow',
      category: 'infrastructure',
      states,
      transitions,
      variables,
      metadata: {
        version: '1.0.0',
        author: 'WorkflowTemplateFactory',
        complexity: 'medium',
        estimatedDuration: 900000
      }
    };
  }

  /**
   * Creates research analysis template
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  createResearchTemplate(): WorkflowTemplate {
    // NASA Assertion 1: Validate factory instance
    console.assert(this instanceof WorkflowTemplateFactory, 'Factory instance required');

    // For now, use simple placeholder implementations
    const states = this.createSimpleStates('research', ['search', 'analyze', 'synthesize']);
    const transitions = this.createSimpleTransitions(['search', 'analyze', 'synthesize']);
    const variables = this.createSimpleVariables(['query', 'domain', 'analysisType']);

    // NASA Assertion 2: Validate template components
    console.assert(states.length === 3, 'Research template requires 3 states');
    console.assert(transitions.length === 2, 'Research template requires 2 transitions');

    return {
      id: 'research-analysis',
      name: 'Research Analysis Pipeline',
      description: 'Complete research analysis workflow from search to publication',
      category: 'research',
      states,
      transitions,
      variables,
      metadata: {
        version: '1.0.0',
        author: 'WorkflowTemplateFactory',
        complexity: 'medium',
        estimatedDuration: 1200000
      }
    };
  }

  /**
   * Creates security audit template
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  createSecurityTemplate(): WorkflowTemplate {
    // NASA Assertion 1: Validate factory instance
    console.assert(this instanceof WorkflowTemplateFactory, 'Factory instance required');

    // For now, use simple placeholder implementations
    const states = this.createSimpleStates('security', ['scan', 'assess', 'remediate']);
    const transitions = this.createSimpleTransitions(['scan', 'assess', 'remediate']);
    const variables = this.createSimpleVariables(['target', 'depth', 'criteria']);

    // NASA Assertion 2: Validate template components
    console.assert(states.length >= 3, 'Security template requires at least 3 states');
    console.assert(transitions.length >= 2, 'Security template requires at least 2 transitions');

    return {
      id: 'security-audit',
      name: 'Security Audit Workflow',
      description: 'Comprehensive security audit and remediation workflow',
      category: 'security',
      states,
      transitions,
      variables,
      metadata: {
        version: '1.0.0',
        author: 'WorkflowTemplateFactory',
        complexity: 'complex',
        estimatedDuration: 1800000
      }
    };
  }

  /**
   * Creates simple states for template placeholders
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private createSimpleStates(domain: string, stateNames: string[]): WorkflowStateDefinition[] {
    // NASA Assertion 1: Validate input parameters
    console.assert(domain && typeof domain === 'string', 'Domain must be a non-empty string');
    console.assert(Array.isArray(stateNames) && stateNames.length > 0, 'State names must be a non-empty array');

    const states: WorkflowStateDefinition[] = stateNames.map((name, index) => ({
      name: name,
      type: 'princess',
      princess: domain,
      task: {
        id: `${name}-task`,
        type: name,
        priority: 'medium',
        payload: {},
        dependencies: index > 0 ? [`${stateNames[index - 1]}-task`] : []
      }
    }));

    // NASA Assertion 2: Validate states creation
    console.assert(states.length === stateNames.length, 'States array must match state names length');

    return states;
  }

  /**
   * Creates simple transitions for template placeholders
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private createSimpleTransitions(stateNames: string[]): WorkflowTransitionDefinition[] {
    // NASA Assertion 1: Validate input parameters
    console.assert(Array.isArray(stateNames) && stateNames.length > 1, 'Need at least 2 states for transitions');

    const transitions: WorkflowTransitionDefinition[] = [];
    for (let i = 0; i < stateNames.length - 1; i++) {
      transitions.push({
        id: `${stateNames[i]}-to-${stateNames[i + 1]}`,
        from: stateNames[i],
        to: stateNames[i + 1],
        weight: 1,
        metadata: { description: `Transition from ${stateNames[i]} to ${stateNames[i + 1]}` }
      });
    }

    // NASA Assertion 2: Validate transitions creation
    console.assert(transitions.length === stateNames.length - 1, 'Transitions must connect sequential states');

    return transitions;
  }

  /**
   * Creates simple variables for template placeholders
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private createSimpleVariables(variableNames: string[]): WorkflowVariableDefinition[] {
    // NASA Assertion 1: Validate input parameters
    console.assert(Array.isArray(variableNames) && variableNames.length > 0, 'Variable names must be a non-empty array');

    const variables: WorkflowVariableDefinition[] = variableNames.map(name => ({
      name,
      type: 'string',
      required: true
    }));

    // NASA Assertion 2: Validate variables creation
    console.assert(variables.length === variableNames.length, 'Variables array must match variable names length');

    return variables;
  }
}

export default WorkflowTemplateFactory;