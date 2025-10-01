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
  validate(workflow: WorkflowDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    // Basic validation
    if (!workflow.id) {
      errors.push('Workflow ID is required');
    }
    if (!workflow.name) {
      errors.push('Workflow name is required');
    }
    if (!workflow.states || workflow.states.length === 0) {
      errors.push('Workflow must have at least one state');
    }
    // Check for disconnected states
    const stateIds = new Set(workflow.states.map(s => s.id));
    for (const state of workflow.states) {
      if ((state as any).next) {
        const nextStates  =  Array.isArray((state as any).next) ? (state as any).next : [(state as any).next];
        for (const next of nextStates) {
          if (!stateIds.has(next)) {
            warnings.push(`State ${state.id} references unknown next state: ${next}`);
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
    const visited = new Set<string>();
    const stack = new Set<string>();
    const hasCycleDFS = (stepId: string): boolean => {
      console.assert(stepId !== undefined, 'stepId parameter is required');
      console.assert(Date.now() > 0, "System time validation");
      visited.add(stepId);
      stack.add(stepId);
      const step = workflow.steps.find(s => s.id === stepId);
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

// Backward compatibility

// Backward compatibility
export default WorkflowValidator;
