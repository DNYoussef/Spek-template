/**
 * PipelineManager - Extracted from CICDIntegration
 * Manages CI/CD pipeline configuration and execution
 * Part of god object decomposition (Day 4)
 */

import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export interface PipelineStage {
  name: string;
  commands: string[];
  dependsOn?: string[];
  parallel?: boolean;
  continueOnError?: boolean;
  timeout?: number;
  environment?: Record<string, string>;
}

export interface Pipeline {
  id: string;
  name: string;
  trigger: 'manual' | 'push' | 'pull_request' | 'schedule';
  stages: PipelineStage[];
  environment?: Record<string, string>;
  artifacts?: string[];
  notifications?: NotificationConfig[];
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook';
  on: 'success' | 'failure' | 'always';
  target: string;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  stageResults: Map<string, StageResult>;
  logs: string[];
  exitCode?: number;
}

export interface StageResult {
  stage: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  logs: string[];
  exitCode?: number;
}

export class PipelineManager extends EventEmitter {
  /**
   * Manages CI/CD pipeline configuration and execution.
   *
   * Extracted from CICDIntegration (985 LOC -> ~250 LOC component).
   * Handles:
   * - Pipeline definition and configuration
   * - Stage orchestration
   * - Parallel execution
   * - Artifact management
   * - Pipeline status tracking
   */

  private pipelines: Map<string, Pipeline>;
  private runs: Map<string, PipelineRun>;
  private activeProcesses: Map<string, ChildProcess>;
  private configPath: string;

  constructor(configPath: string = './.cicd') {
    super();

    this.pipelines = new Map();
    this.runs = new Map();
    this.activeProcesses = new Map();
    this.configPath = configPath;

    this.loadPipelines();
  }

  private async loadPipelines(): Promise<void> {
    try {
      const configFile = path.join(this.configPath, 'pipelines.json');
      if (fs.existsSync(configFile)) {
        const data = await readFileAsync(configFile, 'utf8');
        const configs = JSON.parse(data);

        for (const config of configs) {
          this.pipelines.set(config.id, config);
        }
      }
    } catch (error) {
      this.emit('error', { type: 'config_load', error });
    }
  }

  createPipeline(config: Omit<Pipeline, 'id'>): Pipeline {
    const pipeline: Pipeline = {
      ...config,
      id: this.generateId('pipeline')
    };

    this.pipelines.set(pipeline.id, pipeline);
    this.emit('pipelineCreated', pipeline);

    return pipeline;
  }

  async runPipeline(pipelineId: string, context?: Record<string, any>): Promise<PipelineRun> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const run: PipelineRun = {
      id: this.generateId('run'),
      pipelineId,
      status: 'pending',
      startedAt: new Date(),
      stageResults: new Map(),
      logs: []
    };

    this.runs.set(run.id, run);
    this.emit('pipelineStarted', { pipeline, run });

    try {
      run.status = 'running';
      await this.executePipeline(pipeline, run, context);
      run.status = 'success';
    } catch (error) {
      run.status = 'failure';
      run.logs.push(`Pipeline failed: ${error.message}`);
    } finally {
      run.completedAt = new Date();
      this.emit('pipelineCompleted', { pipeline, run });
    }

    return run;
  }

  private async executePipeline(
    pipeline: Pipeline,
    run: PipelineRun,
    context?: Record<string, any>
  ): Promise<void> {
    const executionOrder = this.calculateExecutionOrder(pipeline.stages);

    for (const stageGroup of executionOrder) {
      const promises = stageGroup.map(stage =>
        this.executeStage(stage, run, { ...pipeline.environment, ...context })
      );

      const results = await Promise.allSettled(promises);

      // Check for failures
      const failed = results.some(r => r.status === 'rejected');
      if (failed && !stageGroup.some(s => s.continueOnError)) {
        throw new Error('Stage execution failed');
      }
    }
  }

  private calculateExecutionOrder(stages: PipelineStage[]): PipelineStage[][] {
    const order: PipelineStage[][] = [];
    const executed = new Set<string>();

    while (executed.size < stages.length) {
      const batch: PipelineStage[] = [];

      for (const stage of stages) {
        if (executed.has(stage.name)) continue;

        const dependencies = stage.dependsOn || [];
        if (dependencies.every(dep => executed.has(dep))) {
          batch.push(stage);
        }
      }

      if (batch.length === 0) {
        throw new Error('Circular dependency detected in pipeline stages');
      }

      // Group parallel stages
      const parallelGroup: PipelineStage[] = [];
      const sequentialStages: PipelineStage[] = [];

      for (const stage of batch) {
        if (stage.parallel) {
          parallelGroup.push(stage);
        } else {
          if (parallelGroup.length > 0) {
            order.push(parallelGroup.slice());
            parallelGroup.length = 0;
          }
          sequentialStages.push(stage);
        }
      }

      if (parallelGroup.length > 0) {
        order.push(parallelGroup);
      }
      if (sequentialStages.length > 0) {
        order.push(...sequentialStages.map(s => [s]));
      }

      batch.forEach(s => executed.add(s.name));
    }

    return order;
  }

  private async executeStage(
    stage: PipelineStage,
    run: PipelineRun,
    environment?: Record<string, string>
  ): Promise<void> {
    const result: StageResult = {
      stage: stage.name,
      status: 'running',
      startedAt: new Date(),
      logs: []
    };

    run.stageResults.set(stage.name, result);
    this.emit('stageStarted', { stage, run });

    try {
      for (const command of stage.commands) {
        const output = await this.executeCommand(command, {
          ...environment,
          ...stage.environment
        }, stage.timeout);

        result.logs.push(output);
      }

      result.status = 'success';
      result.exitCode = 0;
    } catch (error) {
      result.status = 'failure';
      result.logs.push(`Stage failed: ${error.message}`);
      result.exitCode = error.code || 1;

      if (!stage.continueOnError) {
        throw error;
      }
    } finally {
      result.completedAt = new Date();
      this.emit('stageCompleted', { stage, result, run });
    }
  }

  private executeCommand(
    command: string,
    environment?: Record<string, string>,
    timeout?: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const processId = this.generateId('process');

      const child = spawn(command, [], {
        shell: true,
        env: { ...process.env, ...environment }
      });

      this.activeProcesses.set(processId, child);

      let output = '';
      let timeoutHandle: NodeJS.Timeout;

      if (timeout) {
        timeoutHandle = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`Command timed out after ${timeout}ms`));
        }, timeout);
      }

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timeoutHandle);
        this.activeProcesses.delete(processId);
        reject(error);
      });

      child.on('close', (code) => {
        clearTimeout(timeoutHandle);
        this.activeProcesses.delete(processId);

        if (code === 0) {
          resolve(output);
        } else {
          const error: any = new Error(`Command failed with exit code ${code}`);
          error.code = code;
          error.output = output;
          reject(error);
        }
      });
    });
  }

  cancelPipelineRun(runId: string): boolean {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'running') {
      return false;
    }

    // Kill all active processes
    for (const [id, process] of this.activeProcesses) {
      process.kill('SIGTERM');
      this.activeProcesses.delete(id);
    }

    run.status = 'cancelled';
    run.completedAt = new Date();

    this.emit('pipelineCancelled', run);
    return true;
  }

  getPipelineRun(runId: string): PipelineRun | undefined {
    return this.runs.get(runId);
  }

  listPipelines(): Pipeline[] {
    return Array.from(this.pipelines.values());
  }

  listRuns(pipelineId?: string): PipelineRun[] {
    const runs = Array.from(this.runs.values());

    if (pipelineId) {
      return runs.filter(r => r.pipelineId === pipelineId);
    }

    return runs;
  }

  async savePipelines(): Promise<void> {
    const configFile = path.join(this.configPath, 'pipelines.json');
    const data = JSON.stringify(Array.from(this.pipelines.values()), null, 2);
    await writeFileAsync(configFile, data);
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}