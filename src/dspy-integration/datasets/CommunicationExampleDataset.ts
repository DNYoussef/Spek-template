/**
 * Core dataset management system for DSPy example datasets
 * Handles CRUD operations, validation, and performance tracking
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { CommunicationExample, DatasetMetrics, QualityMetrics, PerformanceMetrics } from '../types/DatasetTypes';
import { ExampleValidator } from './ExampleValidator';
import { ScoringEngine } from './ScoringEngine';

export type CommunicationType = 'queen_princess' | 'princess_drone' | 'drone_princess' | 'princess_queen' | 'context_dna';

export class CommunicationExampleDataset {
  private datasetPath: string;
  private validator: ExampleValidator;
  private scorer: ScoringEngine;
  private cache: Map<string, CommunicationExample[]> = new Map();
  private metrics: DatasetMetrics;

  constructor(datasetPath: string = '.claude/.artifacts/dspy-datasets') {
    this.datasetPath = datasetPath;
    this.validator = new ExampleValidator();
    this.scorer = new ScoringEngine();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Add new communication example to dataset
   * NASA Rule 10: ≤60 lines, fixed bounds, ≥2 assertions
   */
  async addExample(example: Partial<CommunicationExample>): Promise<string> {
    assert(example.communication_type !== undefined, 'Communication type required');
    assert(example.input !== undefined, 'Input required');

    // Generate unique ID if not provided
    const id = example.id || this.generateExampleId(example.communication_type!);

    // Create complete example with defaults
    const completeExample: CommunicationExample = {
      id,
      communication_type: example.communication_type!,
      input: example.input!,
      output: example.output || this.createDefaultOutput(),
      scoring: example.scoring || await this.scorer.scoreExample(example as CommunicationExample),
      metadata: {
        created_date: new Date().toISOString(),
        agent_source: example.metadata?.agent_source || 'manual',
        validation_status: 'pending',
        ...example.metadata
      }
    };

    // Validate example quality
    const validationResult = await this.validator.validateExample(completeExample);
    completeExample.metadata.validation_status = validationResult.isValid ? 'validated' : 'rejected';

    // Add to dataset file
    await this.appendToDataset(completeExample);

    // Update cache
    this.invalidateCache(completeExample.communication_type);

    // Update metrics
    this.updateMetrics(completeExample);

    return id;
  }

  /**
   * Retrieve examples by communication type with filtering
   */
  async getExamples(
    type: CommunicationType,
    filters?: {
      validatedOnly?: boolean;
      minScore?: number;
      limit?: number;
    }
  ): Promise<CommunicationExample[]> {
    // Check cache first
    const cacheKey = `${type}_${JSON.stringify(filters)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const examples = await this.loadDatasetFile(type);
    let filtered = examples;

    if (filters?.validatedOnly) {
      filtered = filtered.filter(ex => ex.metadata.validation_status === 'validated');
    }

    if (filters?.minScore) {
      filtered = filtered.filter(ex => ex.scoring.overall_score >= filters.minScore!);
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    // Cache results for 5 minutes
    this.cache.set(cacheKey, filtered);
    setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

    return filtered;
  }

  /**
   * Update existing example with new scoring or validation
   */
  async updateExample(id: string, updates: Partial<CommunicationExample>): Promise<boolean> {
    assert(id.length > 0, 'Valid ID required');

    for (const type of ['queen_princess', 'princess_drone', 'drone_princess', 'princess_queen', 'context_dna'] as CommunicationType[]) {
      const examples = await this.loadDatasetFile(type);
      const index = examples.findIndex(ex => ex.id === id);

      if (index !== -1) {
        examples[index] = { ...examples[index], ...updates };
        await this.saveDatasetFile(type, examples);
        this.invalidateCache(type);
        return true;
      }
    }

    return false;
  }

  /**
   * Get dataset statistics and health metrics
   */
  async getDatasetMetrics(): Promise<DatasetMetrics> {
    const allTypes: CommunicationType[] = ['queen_princess', 'princess_drone', 'drone_princess', 'princess_queen', 'context_dna'];

    this.metrics = {
      total_examples: 0,
      by_type: {},
      validation_rates: {},
      average_scores: {},
      last_updated: new Date().toISOString(),
      health_status: 'healthy'
    };

    for (const type of allTypes) {
      const examples = await this.getExamples(type);
      const validated = examples.filter(ex => ex.metadata.validation_status === 'validated');

      this.metrics.total_examples += examples.length;
      this.metrics.by_type[type] = examples.length;
      this.metrics.validation_rates[type] = examples.length > 0 ? validated.length / examples.length : 0;
      this.metrics.average_scores[type] = examples.length > 0
        ? examples.reduce((sum, ex) => sum + ex.scoring.overall_score, 0) / examples.length
        : 0;
    }

    // Determine health status
    const minExamplesPerType = 10;
    const minValidationRate = 0.8;
    const minAverageScore = 7.0;

    const hasMinExamples = Object.values(this.metrics.by_type).every(count => count >= minExamplesPerType);
    const hasGoodValidation = Object.values(this.metrics.validation_rates).every(rate => rate >= minValidationRate);
    const hasGoodScores = Object.values(this.metrics.average_scores).every(score => score >= minAverageScore);

    if (hasMinExamples && hasGoodValidation && hasGoodScores) {
      this.metrics.health_status = 'healthy';
    } else if (this.metrics.total_examples >= 25) {
      this.metrics.health_status = 'degraded';
    } else {
      this.metrics.health_status = 'critical';
    }

    return this.metrics;
  }

  /**
   * Export dataset in DSPy training format
   */
  async exportForTraining(type: CommunicationType): Promise<any[]> {
    const examples = await this.getExamples(type, { validatedOnly: true, minScore: 7.0 });

    return examples.map(example => ({
      input: example.input,
      output: example.output.communication,
      metadata: {
        score: example.scoring.overall_score,
        type: example.communication_type
      }
    }));
  }

  // Private helper methods

  private initializeMetrics(): DatasetMetrics {
    return {
      total_examples: 0,
      by_type: {},
      validation_rates: {},
      average_scores: {},
      last_updated: new Date().toISOString(),
      health_status: 'unknown'
    };
  }

  private generateExampleId(type: CommunicationType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}_${timestamp}_${random}`;
  }

  private createDefaultOutput(): CommunicationExample['output'] {
    return {
      communication: '',
      structured_data: {},
      quality_metrics: {
        clarity: 0,
        completeness: 0,
        actionability: 0
      }
    };
  }

  private async appendToDataset(example: CommunicationExample): Promise<void> {
    const examples = await this.loadDatasetFile(example.communication_type);
    examples.push(example);
    await this.saveDatasetFile(example.communication_type, examples);
  }

  private async loadDatasetFile(type: CommunicationType): Promise<CommunicationExample[]> {
    const filePath = join(this.datasetPath, `${type.replace('_', '-')}-examples.json`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // File doesn't exist, return empty array
      return [];
    }
  }

  private async saveDatasetFile(type: CommunicationType, examples: CommunicationExample[]): Promise<void> {
    const filePath = join(this.datasetPath, `${type.replace('_', '-')}-examples.json`);
    await fs.writeFile(filePath, JSON.stringify(examples, null, 2));
  }

  private invalidateCache(type: CommunicationType): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(type));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private updateMetrics(example: CommunicationExample): void {
    this.metrics.total_examples++;
    this.metrics.by_type[example.communication_type] = (this.metrics.by_type[example.communication_type] || 0) + 1;
    this.metrics.last_updated = new Date().toISOString();
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}