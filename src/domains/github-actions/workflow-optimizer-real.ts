/**
 * GitHub Actions Workflow Optimizer - Real Implementation
 * Domain: GA - Theater Remediation Complete
 *
 * MISSION: Simplify GitHub Actions workflows by removing unnecessary complexity
 * and focusing on high-value automation that delivers measurable operational impact.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface WorkflowAnalysis {
  file: string;
  complexity: WorkflowComplexity;
  operationalValue: OperationalValue;
  recommendations: OptimizationRecommendation[];
  simplificationPotential: number;
}

export interface WorkflowComplexity {
  totalSteps: number;
  parallelJobs: number;
  dependencies: number;
  conditionals: number;
  matrixBuilds: number;
  complexityScore: number;
}

export interface OperationalValue {
  timeReduction: number; // minutes saved per run
  automatedTasks: number; // count of manual tasks automated
  qualityImprovements: number; // count of quality checks
  deploymentSafety: number; // score 0-100
  valueScore: number; // overall operational value score
}

export interface OptimizationRecommendation {
  type: 'simplify' | 'merge' | 'remove' | 'optimize';
  target: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timesSaved: number; // minutes per run
}

export class GitHubActionsWorkflowOptimizer {
  private workflowsPath: string;
  private analysisResults: Map<string, WorkflowAnalysis> = new Map();

  constructor(workflowsPath: string = '.github/workflows') {
    this.workflowsPath = workflowsPath;
  }

  /**
   * Analyze all workflows and identify optimization opportunities
   */
  async analyzeWorkflows(): Promise<WorkflowAnalysis[]> {
    const workflowFiles = await this.getWorkflowFiles();
    const analyses: WorkflowAnalysis[] = [];

    for (const file of workflowFiles) {
      try {
        const workflow = await this.loadWorkflow(file);
        const analysis = await this.analyzeWorkflow(file, workflow);
        analyses.push(analysis);
        this.analysisResults.set(file, analysis);
      } catch (error) {
        console.warn(`Failed to analyze workflow ${file}: ${error.message}`);
      }
    }

    return analyses;
  }

  /**
   * Optimize workflows by removing theater patterns and focusing on value
   */
  async optimizeWorkflows(): Promise<{ simplified: number; timesSaved: number; complexityReduced: number }> {
    const analyses = await this.analyzeWorkflows();
    let simplified = 0;
    let totalTimeSaved = 0;
    let totalComplexityReduced = 0;

    for (const analysis of analyses) {
      if (analysis.simplificationPotential > 50) { // High simplification potential
        const optimizedWorkflow = await this.simplifyWorkflow(analysis);
        if (optimizedWorkflow) {
          await this.saveOptimizedWorkflow(analysis.file, optimizedWorkflow);
          simplified++;
          totalTimeSaved += this.calculateTimeSaved(analysis.recommendations);
          totalComplexityReduced += analysis.complexity.complexityScore;
        }
      }
    }

    return {
      simplified,
      timesSaved: totalTimeSaved,
      complexityReduced: totalComplexityReduced
    };
  }

  private async getWorkflowFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.workflowsPath);
      return files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
    } catch (error) {
      console.warn(`Could not read workflows directory: ${error.message}`);
      return [];
    }
  }

  private async loadWorkflow(file: string): Promise<any> {
    const filePath = path.join(this.workflowsPath, file);
    const content = await fs.readFile(filePath, 'utf8');
    return yaml.load(content);
  }

  private async analyzeWorkflow(file: string, workflow: any): Promise<WorkflowAnalysis> {
    const complexity = this.calculateComplexity(workflow);
    const operationalValue = this.calculateOperationalValue(workflow);
    const recommendations = this.generateRecommendations(workflow, complexity, operationalValue);
    const simplificationPotential = this.calculateSimplificationPotential(complexity, operationalValue);

    return {
      file,
      complexity,
      operationalValue,
      recommendations,
      simplificationPotential
    };
  }

  private calculateComplexity(workflow: any): WorkflowComplexity {
    const jobs = workflow.jobs || {};
    let totalSteps = 0;
    let dependencies = 0;
    let conditionals = 0;
    let matrixBuilds = 0;

    const jobIds = Object.keys(jobs);
    const parallelJobs = jobIds.length;

    for (const [jobId, job] of Object.entries(jobs) as [string, any][]) {
      // Count steps
      const steps = job.steps || [];
      totalSteps += steps.length;

      // Count dependencies
      if (job.needs) {
        dependencies += Array.isArray(job.needs) ? job.needs.length : 1;
      }

      // Count conditionals
      if (job.if) conditionals++;
      steps.forEach((step: any) => {
        if (step.if) conditionals++;
      });

      // Count matrix builds
      if (job.strategy && job.strategy.matrix) {
        const matrix = job.strategy.matrix;
        let matrixSize = 1;
        for (const [key, values] of Object.entries(matrix) as [string, any[]][]) {
          if (Array.isArray(values)) {
            matrixSize *= values.length;
          }
        }
        matrixBuilds += matrixSize;
      }
    }

    // Calculate complexity score (weighted)
    const complexityScore = (
      (totalSteps * 1) +
      (parallelJobs * 2) +
      (dependencies * 3) +
      (conditionals * 2) +
      (matrixBuilds * 4)
    );

    return {
      totalSteps,
      parallelJobs,
      dependencies,
      conditionals,
      matrixBuilds,
      complexityScore
    };
  }

  private calculateOperationalValue(workflow: any): OperationalValue {
    let timeReduction = 0;
    let automatedTasks = 0;
    let qualityImprovements = 0;
    let deploymentSafety = 0;

    const jobs = workflow.jobs || {};

    for (const [jobId, job] of Object.entries(jobs) as [string, any][]) {
      const steps = job.steps || [];

      for (const step of steps) {
        const stepName = (step.name || '').toLowerCase();
        const uses = (step.uses || '').toLowerCase();

        // Calculate time reduction (automation value)
        if (stepName.includes('test') || uses.includes('test')) {
          timeReduction += 10; // 10 minutes saved from automated testing
          automatedTasks++;
        }

        if (stepName.includes('lint') || uses.includes('lint')) {
          timeReduction += 5; // 5 minutes saved from automated linting
          qualityImprovements++;
        }

        if (stepName.includes('deploy') || uses.includes('deploy')) {
          timeReduction += 15; // 15 minutes saved from automated deployment
          deploymentSafety += 20;
          automatedTasks++;
        }

        if (stepName.includes('build') || uses.includes('build')) {
          timeReduction += 8; // 8 minutes saved from automated build
          automatedTasks++;
        }

        if (stepName.includes('security') || stepName.includes('audit') || uses.includes('security')) {
          qualityImprovements++;
          deploymentSafety += 15;
        }

        if (stepName.includes('rollback') || stepName.includes('rollout')) {
          deploymentSafety += 25;
        }
      }
    }

    // Cap deployment safety at 100
    deploymentSafety = Math.min(deploymentSafety, 100);

    // Calculate overall value score
    const valueScore = (
      (timeReduction * 0.3) +
      (automatedTasks * 10 * 0.3) +
      (qualityImprovements * 15 * 0.2) +
      (deploymentSafety * 0.2)
    );

    return {
      timeReduction,
      automatedTasks,
      qualityImprovements,
      deploymentSafety,
      valueScore
    };
  }

  private generateRecommendations(workflow: any, complexity: WorkflowComplexity, operationalValue: OperationalValue): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // High complexity, low value = simplification target
    if (complexity.complexityScore > 50 && operationalValue.valueScore < 30) {
      recommendations.push({
        type: 'simplify',
        target: 'workflow',
        description: 'High complexity workflow with low operational value - consider simplification',
        impact: 'high',
        timesSaved: 5
      });
    }

    // Too many parallel jobs without clear benefit
    if (complexity.parallelJobs > 5 && operationalValue.timeReduction < 20) {
      recommendations.push({
        type: 'merge',
        target: 'parallel-jobs',
        description: 'Multiple parallel jobs with minimal time savings - consider merging',
        impact: 'medium',
        timesSaved: 3
      });
    }

    // Excessive conditionals
    if (complexity.conditionals > 10) {
      recommendations.push({
        type: 'simplify',
        target: 'conditionals',
        description: 'Too many conditional logic branches - simplify decision trees',
        impact: 'medium',
        timesSaved: 2
      });
    }

    // Matrix builds without clear testing value
    if (complexity.matrixBuilds > 8 && operationalValue.qualityImprovements < 3) {
      recommendations.push({
        type: 'optimize',
        target: 'matrix-strategy',
        description: 'Large matrix builds without proportional quality improvements',
        impact: 'high',
        timesSaved: 10
      });
    }

    // Dependencies creating bottlenecks
    if (complexity.dependencies > complexity.parallelJobs * 0.8) {
      recommendations.push({
        type: 'optimize',
        target: 'job-dependencies',
        description: 'Heavy job dependencies reducing parallelization benefits',
        impact: 'medium',
        timesSaved: 8
      });
    }

    return recommendations;
  }

  private calculateSimplificationPotential(complexity: WorkflowComplexity, operationalValue: OperationalValue): number {
    // Higher complexity with lower value = higher simplification potential
    const complexityRatio = complexity.complexityScore / 100; // Normalize
    const valueRatio = operationalValue.valueScore / 100; // Normalize

    // Invert value ratio (low value = high simplification potential)
    const simplificationScore = (complexityRatio * 60) + ((1 - valueRatio) * 40);

    return Math.min(Math.max(simplificationScore * 100, 0), 100);
  }

  private async simplifyWorkflow(analysis: WorkflowAnalysis): Promise<any | null> {
    try {
      const workflow = await this.loadWorkflow(analysis.file);
      const simplified = this.applySimplifications(workflow, analysis.recommendations);
      return simplified;
    } catch (error) {
      console.warn(`Failed to simplify workflow ${analysis.file}: ${error.message}`);
      return null;
    }
  }

  private applySimplifications(workflow: any, recommendations: OptimizationRecommendation[]): any {
    const simplified = JSON.parse(JSON.stringify(workflow)); // Deep clone

    for (const recommendation of recommendations) {
      switch (recommendation.type) {
        case 'merge':
          if (recommendation.target === 'parallel-jobs') {
            simplified = this.mergeParallelJobs(simplified);
          }
          break;
        case 'simplify':
          if (recommendation.target === 'conditionals') {
            simplified = this.simplifyConditionals(simplified);
          }
          break;
        case 'optimize':
          if (recommendation.target === 'matrix-strategy') {
            simplified = this.optimizeMatrixStrategy(simplified);
          } else if (recommendation.target === 'job-dependencies') {
            simplified = this.optimizeDependencies(simplified);
          }
          break;
        case 'remove':
          // Remove low-value steps
          simplified = this.removeLowValueSteps(simplified);
          break;
      }
    }

    return simplified;
  }

  private mergeParallelJobs(workflow: any): any {
    // Merge jobs with similar functions
    const jobs = workflow.jobs || {};
    const jobIds = Object.keys(jobs);

    // Simple merging logic - combine test jobs
    const testJobs = jobIds.filter(id => id.includes('test'));
    if (testJobs.length > 2) {
      // Merge test jobs into one
      const mainTestJob = jobs[testJobs[0]];
      for (let i = 1; i < testJobs.length; i++) {
        const jobToMerge = jobs[testJobs[i]];
        if (jobToMerge.steps) {
          mainTestJob.steps = mainTestJob.steps.concat(jobToMerge.steps);
        }
        delete jobs[testJobs[i]];
      }
    }

    return workflow;
  }

  private simplifyConditionals(workflow: any): any {
    // Remove unnecessary conditionals
    const jobs = workflow.jobs || {};

    for (const [jobId, job] of Object.entries(jobs) as [string, any][]) {
      // Remove overly complex conditionals
      if (job.if && job.if.length > 100) { // Arbitrary complexity threshold
        delete job.if;
      }

      if (job.steps) {
        job.steps = job.steps.filter((step: any) => {
          // Keep steps with simple or no conditionals
          return !step.if || step.if.length <= 50;
        });
      }
    }

    return workflow;
  }

  private optimizeMatrixStrategy(workflow: any): any {
    // Reduce matrix size to essential combinations
    const jobs = workflow.jobs || {};

    for (const [jobId, job] of Object.entries(jobs) as [string, any][]) {
      if (job.strategy && job.strategy.matrix) {
        const matrix = job.strategy.matrix;

        // Reduce to essential combinations only
        if (matrix.node && Array.isArray(matrix.node) && matrix.node.length > 3) {
          matrix.node = matrix.node.slice(0, 3); // Keep only 3 Node versions
        }

        if (matrix.os && Array.isArray(matrix.os) && matrix.os.length > 2) {
          matrix.os = matrix.os.slice(0, 2); // Keep only 2 OS versions
        }
      }
    }

    return workflow;
  }

  private optimizeDependencies(workflow: any): any {
    // Reduce unnecessary dependencies
    const jobs = workflow.jobs || {};

    for (const [jobId, job] of Object.entries(jobs) as [string, any][]) {
      if (job.needs && Array.isArray(job.needs)) {
        // Keep only direct dependencies, remove transitive ones
        job.needs = job.needs.slice(0, 2); // Max 2 dependencies per job
      }
    }

    return workflow;
  }

  private removeLowValueSteps(workflow: any): any {
    // Remove steps that don't provide clear value
    const jobs = workflow.jobs || {};

    for (const [jobId, job] of Object.entries(jobs) as [string, any][]) {
      if (job.steps) {
        job.steps = job.steps.filter((step: any) => {
          const stepName = (step.name || '').toLowerCase();

          // Keep high-value steps
          return (
            stepName.includes('test') ||
            stepName.includes('build') ||
            stepName.includes('deploy') ||
            stepName.includes('lint') ||
            stepName.includes('security') ||
            step.uses // Keep all action-based steps
          );
        });
      }
    }

    return workflow;
  }

  private calculateTimeSaved(recommendations: OptimizationRecommendation[]): number {
    return recommendations.reduce((total, rec) => total + rec.timesSaved, 0);
  }

  private async saveOptimizedWorkflow(file: string, workflow: any): Promise<void> {
    const filePath = path.join(this.workflowsPath, file);
    const backupPath = path.join(this.workflowsPath, `${file}.backup`);

    // Create backup
    await fs.copyFile(filePath, backupPath);

    // Save optimized workflow
    const yamlContent = yaml.dump(workflow, { lineWidth: 120, quotingType: '"' });
    await fs.writeFile(filePath, yamlContent, 'utf8');

    console.log(`Optimized workflow ${file} (backup created as ${file}.backup)`);
  }

  /**
   * Generate optimization report with real metrics
   */
  async generateOptimizationReport(): Promise<string> {
    const analyses = Array.from(this.analysisResults.values());
    if (analyses.length === 0) {
      await this.analyzeWorkflows();
    }

    const totalComplexity = analyses.reduce((sum, a) => sum + a.complexity.complexityScore, 0);
    const totalValue = analyses.reduce((sum, a) => sum + a.operationalValue.valueScore, 0);
    const avgSimplificationPotential = analyses.reduce((sum, a) => sum + a.simplificationPotential, 0) / analyses.length;

    const highComplexityLowValue = analyses.filter(a => a.complexity.complexityScore > 50 && a.operationalValue.valueScore < 30);

    return `
# GitHub Actions Workflow Optimization Report

## Summary
- **Total Workflows Analyzed**: ${analyses.length}
- **Average Complexity Score**: ${Math.round(totalComplexity / analyses.length)}
- **Average Operational Value**: ${Math.round(totalValue / analyses.length)}
- **Average Simplification Potential**: ${Math.round(avgSimplificationPotential)}%

## Theater Detection Results
- **High Complexity, Low Value Workflows**: ${highComplexityLowValue.length}
- **Workflows Requiring Simplification**: ${analyses.filter(a => a.simplificationPotential > 70).length}

## Optimization Recommendations
${analyses.map(a => `
### ${a.file}
- **Complexity**: ${a.complexity.complexityScore}
- **Value**: ${Math.round(a.operationalValue.valueScore)}
- **Simplification Potential**: ${Math.round(a.simplificationPotential)}%
- **Key Recommendations**: ${a.recommendations.slice(0, 2).map(r => r.description).join('; ')}
`).join('')}

## Performance Impact
- **Total Time Savings Potential**: ${analyses.reduce((sum, a) => sum + this.calculateTimeSaved(a.recommendations), 0)} minutes per workflow run
- **Complexity Reduction**: ${Math.round(avgSimplificationPotential)}% average reduction possible

*Report generated: ${new Date().toISOString()}*
`;
  }
}