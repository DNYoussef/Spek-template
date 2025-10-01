/**
 * Validate example quality and consistency for DSPy datasets
 * Ensures examples meet production standards and training requirements
 */

import { CommunicationExample, ValidationResult, QualityMetrics } from '~types/DatasetTypes';

export interface ValidationRule {
  name: string;
  description: string;
  validator: (example: CommunicationExample) => ValidationResult;
  weight: number; // 0-1, importance in overall validation
}

export class ExampleValidator {
  private rules: ValidationRule[];
  private validationHistory: Map<string, ValidationResult[]> = new Map();

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Validate single example against all rules
   * NASA Rule 10: ≤60 lines, fixed bounds, ≥2 assertions
   */
  async validateExample(example: CommunicationExample): Promise<ValidationResult> {
    assert(example.id !== undefined, 'Example ID required');
    assert(example.communication_type !== undefined, 'Communication type required');

    const results: ValidationResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        const result = rule.validator(example);
        results.push(result);

        if (!result.isValid) {
          errors.push(`${rule.name}: ${result.error || 'Validation failed'}`);
        }

        if (result.warnings) {
          warnings.push(...result.warnings.map(w => `${rule.name}: ${w}`));
        }
      } catch (error) {
        errors.push(`${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.push({
          isValid: false,
          score: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Calculate weighted overall score
    const totalWeight = this.rules.reduce((sum, rule) => sum + rule.weight, 0);
    const weightedScore = results.reduce((sum, result, index) => {
      return sum + (result.score * this.rules[index].weight);
    }, 0) / totalWeight;

    const overallResult: ValidationResult = {
      isValid: errors.length === 0 && weightedScore >= 0.8,
      score: weightedScore,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      details: {
        rule_results: results.map((result, index) => ({
          rule: this.rules[index].name,
          passed: result.isValid,
          score: result.score
        })),
        overall_score: weightedScore
      }
    };

    // Store validation history
    if (!this.validationHistory.has(example.id)) {
      this.validationHistory.set(example.id, []);
    }
    this.validationHistory.get(example.id)!.push(overallResult);

    return overallResult;
  }

  /**
   * Validate consistency across multiple examples
   */
  async validateDatasetConsistency(examples: CommunicationExample[]): Promise<ValidationResult> {
    assert(examples.length > 0, 'Examples required for consistency validation');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate IDs
    const ids = examples.map(ex => ex.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check communication type consistency
    const communicationTypes = [...new Set(examples.map(ex => ex.communication_type))];
    if (communicationTypes.length > 1) {
      warnings.push(`Multiple communication types in dataset: ${communicationTypes.join(', ')}`);
    }

    // Check scoring variance (should not be too uniform)
    const scores = examples.map(ex => ex.scoring.overall_score);
    const scoreVariance = this.calculateVariance(scores);
    if (scoreVariance < 0.5) {
      warnings.push('Low score variance - examples may be too similar');
    }

    // Check for minimum example count
    if (examples.length < 10) {
      errors.push(`Insufficient examples: ${examples.length} (minimum: 10)`);
    }

    return {
      isValid: errors.length === 0,
      score: errors.length === 0 ? 1.0 : 0.0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Get validation statistics for monitoring
   */
  getValidationStats(): {
    total_validations: number;
    pass_rate: number;
    common_failures: string[];
    average_score: number;
  } {
    const allResults = Array.from(this.validationHistory.values()).flat();

    if (allResults.length === 0) {
      return {
        total_validations: 0,
        pass_rate: 0,
        common_failures: [],
        average_score: 0
      };
    }

    const passCount = allResults.filter(r => r.isValid).length;
    const averageScore = allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length;

    // Collect common failures
    const failures = allResults
      .filter(r => r.errors)
      .flatMap(r => r.errors || []);
    const failureCounts = failures.reduce((counts, failure) => {
      counts[failure] = (counts[failure] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const commonFailures = Object.entries(failureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([failure]) => failure);

    return {
      total_validations: allResults.length,
      pass_rate: passCount / allResults.length,
      common_failures: commonFailures,
      average_score: averageScore
    };
  }

  // Private helper methods

  private initializeRules(): ValidationRule[] {
    return [
      {
        name: 'required_fields',
        description: 'Check all required fields are present',
        weight: 0.3,
        validator: this.validateRequiredFields.bind(this)
      },
      {
        name: 'input_quality',
        description: 'Validate input structure and content',
        weight: 0.2,
        validator: this.validateInputQuality.bind(this)
      },
      {
        name: 'output_quality',
        description: 'Validate output communication quality',
        weight: 0.3,
        validator: this.validateOutputQuality.bind(this)
      },
      {
        name: 'scoring_consistency',
        description: 'Check scoring values are reasonable',
        weight: 0.1,
        validator: this.validateScoringConsistency.bind(this)
      },
      {
        name: 'metadata_completeness',
        description: 'Validate metadata fields',
        weight: 0.1,
        validator: this.validateMetadataCompleteness.bind(this)
      }
    ];
  }

  private validateRequiredFields(example: CommunicationExample): ValidationResult {
    const requiredFields = ['id', 'communication_type', 'input', 'output', 'scoring', 'metadata'];
    const missingFields = requiredFields.filter(field => !example[field as keyof CommunicationExample]);

    if (missingFields.length > 0) {
      return {
        isValid: false,
        score: 0,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    return { isValid: true, score: 1.0 };
  }

  private validateInputQuality(example: CommunicationExample): ValidationResult {
    const warnings: string[] = [];
    let score = 1.0;

    if (!example.input.context || Object.keys(example.input.context).length === 0) {
      warnings.push('Empty or missing context');
      score -= 0.3;
    }

    if (!example.input.requirements || example.input.requirements.length === 0) {
      warnings.push('Missing requirements');
      score -= 0.3;
    }

    if (!example.input.constraints || Object.keys(example.input.constraints).length === 0) {
      warnings.push('Missing constraints');
      score -= 0.2;
    }

    return {
      isValid: score > 0.5,
      score: Math.max(0, score),
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private validateOutputQuality(example: CommunicationExample): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    if (!example.output.communication || example.output.communication.trim().length < 10) {
      errors.push('Communication text too short or missing');
      score = 0;
    }

    if (!example.output.structured_data || Object.keys(example.output.structured_data).length === 0) {
      warnings.push('Missing structured data');
      score -= 0.2;
    }

    // Check for basic quality indicators
    const communication = example.output.communication;
    if (communication && communication.length > 0) {
      // Check for actionable verbs
      const actionVerbs = ['create', 'implement', 'analyze', 'validate', 'execute', 'deploy'];
      const hasActionVerbs = actionVerbs.some(verb => communication.toLowerCase().includes(verb));
      if (!hasActionVerbs) {
        warnings.push('Communication lacks actionable verbs');
        score -= 0.1;
      }

      // Check for specific details
      if (communication.length < 50) {
        warnings.push('Communication may be too brief');
        score -= 0.1;
      }
    }

    return {
      isValid: errors.length === 0,
      score: Math.max(0, score),
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private validateScoringConsistency(example: CommunicationExample): ValidationResult {
    const scoring = example.scoring;
    const warnings: string[] = [];
    let score = 1.0;

    // Check score ranges
    const scoreFields = ['clarity', 'actionability', 'completeness', 'efficiency', 'overall_score'];
    for (const field of scoreFields) {
      const value = scoring[field as keyof typeof scoring];
      if (typeof value !== 'number' || value < 0 || value > 10) {
        warnings.push(`Invalid ${field} score: ${value}`);
        score -= 0.2;
      }
    }

    // Check overall score calculation consistency
    const calculatedOverall = (scoring.clarity + scoring.actionability + scoring.completeness + scoring.efficiency) / 4;
    const scoreDiff = Math.abs(calculatedOverall - scoring.overall_score);
    if (scoreDiff > 1.0) {
      warnings.push('Overall score inconsistent with component scores');
      score -= 0.3;
    }

    return {
      isValid: score > 0.7,
      score: Math.max(0, score),
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private validateMetadataCompleteness(example: CommunicationExample): ValidationResult {
    const metadata = example.metadata;
    const warnings: string[] = [];
    let score = 1.0;

    if (!metadata.created_date) {
      warnings.push('Missing created_date');
      score -= 0.3;
    }

    if (!metadata.agent_source) {
      warnings.push('Missing agent_source');
      score -= 0.2;
    }

    if (!metadata.validation_status || !['validated', 'pending', 'rejected'].includes(metadata.validation_status)) {
      warnings.push('Invalid validation_status');
      score -= 0.3;
    }

    return {
      isValid: score > 0.6,
      score: Math.max(0, score),
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}