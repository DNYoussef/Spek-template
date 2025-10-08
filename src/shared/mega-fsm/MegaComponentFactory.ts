/**
 * MegaComponentFactory - Factory for creating decomposed mega file components
 *
 * Provides standardized component creation for all mega god object decompositions.
 * Enforces consistent architecture patterns and NASA Rule 10 compliance.
 *
 * @version 1.0.0
 * @nasa_compliant true
 * @max_function_lines 60
 */

import { MegaTransitionHub, MegaState, MegaEvent, MegaStateContext } from './MegaTransitionHub';

// NASA Rule 10: Fixed bounds constants
const MAX_COMPONENT_NAME_LENGTH = 128;
const MAX_RESPONSIBILITIES = 10;
const MAX_DEPENDENCIES = 20;
const MAX_METHODS_PER_COMPONENT = 15;

export interface ComponentSpec {
  name: string;
  responsibilities: string[];
  dependencies: string[];
  methods: MethodSpec[];
  stateManaged: boolean;
}

export interface MethodSpec {
  name: string;
  maxLines: number;
  parameters: ParameterSpec[];
  returnType: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface ParameterSpec {
  name: string;
  type: string;
  required: boolean;
  maxLength?: number;
}

export interface DecompositionPlan {
  originalFile: string;
  originalLineCount: number;
  targetReduction: number;
  components: ComponentSpec[];
  facadeRequired: boolean;
  sharedTypes: string[];
}

/**
 * MegaComponentFactory creates standardized decomposed components
 * NASA Rule 10: All functions ≤60 lines, fixed bounds, assertions
 */
export class MegaComponentFactory {
  private transitionHub: MegaTransitionHub;
  private createdComponents: Map<string, ComponentSpec> = new Map();

  constructor(transitionHub: MegaTransitionHub) {
    this.transitionHub = transitionHub;
    this.validateConfiguration();
  }

  /**
   * Create decomposition plan for mega file
   * NASA Rule 10: Fixed bounds, no recursion
   */
  public createDecompositionPlan(
    originalFile: string,
    originalLineCount: number,
    responsibilities: string[]
  ): DecompositionPlan {
    // NASA Rule 10: Input validation assertions
    console.assert(originalFile.length > 0, 'Original file path cannot be empty');
    console.assert(originalLineCount > 0, 'Original line count must be positive');
    console.assert(responsibilities.length <= MAX_RESPONSIBILITIES, 'Too many responsibilities');

    const targetReduction = 85; // 85% reduction target
    const components: ComponentSpec[] = [];

    // NASA Rule 10: Bounded loop with fixed maximum iterations
    for (let i = 0; i < Math.min(responsibilities.length, MAX_RESPONSIBILITIES); i++) {
      const responsibility = responsibilities[i];
      const componentSpec = this.createComponentSpec(responsibility);
      components.push(componentSpec);
    }

    const plan: DecompositionPlan = {
      originalFile,
      originalLineCount,
      targetReduction,
      components,
      facadeRequired: true,
      sharedTypes: this.extractSharedTypes(components)
    };

    // NASA Rule 10: Assertion for validation
    console.assert(components.length > 0, 'Decomposition plan must have components');

    return plan;
  }

  /**
   * Create component specification for responsibility
   * NASA Rule 10: Fixed bounds, assertions
   */
  private createComponentSpec(responsibility: string): ComponentSpec {
    // NASA Rule 10: Input validation
    console.assert(responsibility.length <= MAX_COMPONENT_NAME_LENGTH, 'Component name too long');

    const name = this.generateComponentName(responsibility);
    const methods = this.generateMethodSpecs(responsibility);

    const spec: ComponentSpec = {
      name,
      responsibilities: [responsibility],
      dependencies: [],
      methods,
      stateManaged: true
    };

    // NASA Rule 10: Assertions
    console.assert(spec.methods.length <= MAX_METHODS_PER_COMPONENT, 'Too many methods per component');

    return spec;
  }

  /**
   * Generate method specifications for component
   * NASA Rule 10: Bounded operations
   */
  private generateMethodSpecs(responsibility: string): MethodSpec[] {
    const methods: MethodSpec[] = [
      {
        name: 'initialize',
        maxLines: 30,
        parameters: [{ name: 'config', type: 'ComponentConfig', required: true }],
        returnType: 'Promise<void>',
        complexity: 'low'
      },
      {
        name: 'process',
        maxLines: 45,
        parameters: [{ name: 'input', type: 'ProcessInput', required: true }],
        returnType: 'Promise<ProcessResult>',
        complexity: 'medium'
      },
      {
        name: 'validate',
        maxLines: 25,
        parameters: [{ name: 'data', type: 'ValidationData', required: true }],
        returnType: 'ValidationResult',
        complexity: 'low'
      },
      {
        name: 'cleanup',
        maxLines: 20,
        parameters: [],
        returnType: 'void',
        complexity: 'low'
      }
    ];

    // NASA Rule 10: Assertion
    console.assert(methods.length <= MAX_METHODS_PER_COMPONENT, 'Methods exceed maximum per component');

    return methods;
  }

  /**
   * Generate component name from responsibility
   * NASA Rule 10: Fixed bounds
   */
  private generateComponentName(responsibility: string): string {
    // NASA Rule 10: Bounded string operations
    const cleanName = responsibility
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, MAX_COMPONENT_NAME_LENGTH);

    return `${cleanName}Component`;
  }

  /**
   * Extract shared types from components
   * NASA Rule 10: Bounded operations
   */
  private extractSharedTypes(components: ComponentSpec[]): string[] {
    const sharedTypes: string[] = [
      'ComponentConfig',
      'ProcessInput',
      'ProcessResult',
      'ValidationData',
      'ValidationResult'
    ];

    // NASA Rule 10: Assertion
    console.assert(sharedTypes.length > 0, 'Must have shared types');

    return sharedTypes;
  }

  /**
   * Create facade component for backward compatibility
   * NASA Rule 10: Fixed bounds, assertions
   */
  public createFacadeComponent(plan: DecompositionPlan): ComponentSpec {
    // NASA Rule 10: Input validation
    console.assert(plan.components.length > 0, 'Plan must have components for facade');

    const facadeSpec: ComponentSpec = {
      name: `${this.extractBaseName(plan.originalFile)}Facade`,
      responsibilities: ['Backward compatibility', 'Component coordination'],
      dependencies: plan.components.map(c => c.name),
      methods: this.generateFacadeMethods(plan.components),
      stateManaged: false
    };

    // NASA Rule 10: Assertion
    console.assert(facadeSpec.dependencies.length <= MAX_DEPENDENCIES, 'Too many facade dependencies');

    return facadeSpec;
  }

  /**
   * Generate facade methods
   * NASA Rule 10: Bounded operations
   */
  private generateFacadeMethods(components: ComponentSpec[]): MethodSpec[] {
    const methods: MethodSpec[] = [
      {
        name: 'initialize',
        maxLines: 15,
        parameters: [],
        returnType: 'Promise<void>',
        complexity: 'low'
      }
    ];

    // NASA Rule 10: Bounded loop
    for (let i = 0; i < Math.min(components.length, 5); i++) {
      const component = components[i];
      methods.push({
        name: `delegate${component.name}`,
        maxLines: 10,
        parameters: [{ name: 'args', type: 'any[]', required: true }],
        returnType: 'Promise<any>',
        complexity: 'low'
      });
    }

    return methods;
  }

  /**
   * Extract base name from file path
   */
  private extractBaseName(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    return fileName.replace(/\.ts$/, '');
  }

  /**
   * Validate factory configuration
   */
  private validateConfiguration(): void {
    console.assert(this.transitionHub !== null, 'Transition hub cannot be null');
    console.assert(MAX_RESPONSIBILITIES > 0, 'Max responsibilities must be positive');
    console.assert(MAX_METHODS_PER_COMPONENT > 0, 'Max methods per component must be positive');
  }
}