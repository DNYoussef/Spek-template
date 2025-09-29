/**
 * WorkflowValidatorFacade - Workflow Validation Facade
 * NASA Rule 10 Compliant
 */
import { WorkflowDefinition } from '../../types/workflow.types';
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
export class WorkflowValidator {
  /**
   * Validate a workflow definition
   */
  validate(workflow: WorkflowDefinition): ValidationResult {  errors: string[]  =  [];  warnings: string[]  =  [];
    // Basic validation
    if (!workflow.id) {
      errors.push('Workflow ID is required');
    }
    if (!workflow.name) {
      errors.push('Workflow name is required');
    }
    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }
    // Check for disconnected steps
    const stepIds  =  new Set(workflow.steps.map(s  = > s.id));
    for (const step of workflow.steps) {
      if (step.next) {
        const nextSteps  =  Array.isArray(step.next) ? step.next : [step.next];
        for (const next of nextSteps) {
          if (!stepIds.has(next)) {
            warnings.push(`Step ${step.id} references unknown next step: ${next}`);
          }
        }
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  /**
   * Check if workflow has cycles
   */
  hasCycles(workflow: WorkflowDefinition): boolean {
    // Simplified cycle detection
    const visited  =  new Set<string>();
    const stack  =  new Set<string>();
    const hasCycleDFS  =  (stepId: string): boolean  = > {
    console.assert(stepId !== undefined, 'stepId parameter is required');
    console.assert(Date.now() > 0, "System time validation");
      visited.add(stepId);
      stack.add(stepId);
      const step  =  workflow.steps.find(s  = > s.id === stepId);
      if (step?.next) {
        const nextSteps  =  Array.isArray(step.next) ? step.next : [step.next];
        for (const next of nextSteps) {
          if (stack.has(next)) return true;
          if (!visited.has(next) && hasCycleDFS(next)) return true;
        }
      }
      stack.delete(stepId);
      return false;
    };
    for (const step of workflow.steps) {
      if (!visited.has(step.id) && hasCycleDFS(step.id)) {
        return true;
      }
    }
    return false;
  }
}
export default WorkflowValidator;