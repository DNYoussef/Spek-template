/**
 * MECE (Mutually Exclusive, Collectively Exhaustive) Distributor
 * Ensures perfect task distribution without overlaps or gaps
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { Task } from '../types/task.types';
import { PrincessDomain } from '../hierarchy/types';

export interface MECEValidation {
  valid: boolean;
  coverage: number; // 0-100%
  overlaps: OverlapDetail[];
  gaps: GapDetail[];
  suggestions: string[];
}

export interface OverlapDetail {
  resource: string;
  tasks: string[];
  domains: PrincessDomain[];
  severity: 'low' | 'medium' | 'high';
}

export interface GapDetail {
  resource: string;
  expectedCoverage: string;
  actualCoverage: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DistributionMatrix {
  domains: Map<PrincessDomain, Set<string>>;
  resources: Map<string, PrincessDomain>;
  tasks: Map<string, Task>;
}

export interface MECEStrategy {
  allowRedundancy: boolean;
  enforceCompleteness: boolean;
  optimizeBalance: boolean;
  prioritizeDomainExpertise: boolean;
}

export class MECEDistributor extends EventEmitter {
  private logger: Logger;
  private distributionMatrix: DistributionMatrix;
  private strategy: MECEStrategy;
  private domainCapabilities: Map<PrincessDomain, Set<string>>;

  constructor() {
    super();
    this.logger = new Logger('MECEDistributor');

    this.strategy = {
      allowRedundancy: false,
      enforceCompleteness: true,
      optimizeBalance: true,
      prioritizeDomainExpertise: true
    };

    this.distributionMatrix = {
      domains: new Map(),
      resources: new Map(),
      tasks: new Map()
    };

    this.initializeDomainCapabilities();
  }

  /**
   * Initialize domain capabilities for intelligent distribution
   */
  private initializeDomainCapabilities(): void {
    this.domainCapabilities = new Map();

    // Development Princess capabilities
    this.domainCapabilities.set(PrincessDomain.DEVELOPMENT, new Set([
      'typescript', 'javascript', 'react', 'node',
      'api', 'backend', 'frontend', 'database'
    ]));

    // Quality Princess capabilities
    this.domainCapabilities.set(PrincessDomain.QUALITY, new Set([
      'test', 'spec', 'jest', 'mocha',
      'coverage', 'lint', 'quality', 'validation'
    ]));

    // Infrastructure Princess capabilities
    this.domainCapabilities.set(PrincessDomain.INFRASTRUCTURE, new Set([
      'config', 'docker', 'kubernetes', 'aws',
      'deployment', 'cicd', 'pipeline', 'terraform'
    ]));

    // Research Princess capabilities
    this.domainCapabilities.set(PrincessDomain.RESEARCH, new Set([
      'documentation', 'research', 'analysis', 'design',
      'architecture', 'planning', 'specification', 'readme'
    ]));

    // Deployment Princess capabilities
    this.domainCapabilities.set(PrincessDomain.DEPLOYMENT, new Set([
      'deploy', 'release', 'rollback', 'monitoring',
      'production', 'staging', 'environment', 'publish'
    ]));

    // Security Princess capabilities
    this.domainCapabilities.set(PrincessDomain.SECURITY, new Set([
      'security', 'auth', 'encryption', 'vulnerability',
      'audit', 'compliance', 'permission', 'token'
    ]));
  }

  /**
   * Distribute tasks across Princess domains using MECE principles
   */
  distributeTasks(tasks: Task[]): Map<PrincessDomain, Task[]> {
    // Reset distribution matrix
    this.resetDistributionMatrix();

    // Phase 1: Analyze all tasks and resources
    const allResources = this.extractAllResources(tasks);

    // Phase 2: Apply MECE distribution
    const distribution = new Map<PrincessDomain, Task[]>();
    Object.values(PrincessDomain).forEach(domain => {
      distribution.set(domain as PrincessDomain, []);
    });

    // Phase 3: Distribute tasks based on strategy
    for (const task of tasks) {
      const assignedDomain = this.assignTaskToDomain(task, allResources);
      const domainTasks = distribution.get(assignedDomain) || [];
      domainTasks.push(task);
      distribution.set(assignedDomain, domainTasks);

      // Update distribution matrix
      this.updateDistributionMatrix(task, assignedDomain);
    }

    // Phase 4: Validate MECE principles
    const validation = this.validateDistribution(distribution, allResources);

    if (!validation.valid) {
      this.logger.warn('MECE validation failed:', validation);

      // Apply corrections if possible
      if (this.strategy.enforceCompleteness) {
        this.applyMECECorrections(distribution, validation);
      }
    }

    // Phase 5: Optimize balance if needed
    if (this.strategy.optimizeBalance) {
      this.optimizeDistributionBalance(distribution);
    }

    this.emit('distribution-completed', {
      distribution,
      validation,
      matrix: this.distributionMatrix
    });

    return distribution;
  }

  /**
   * Extract all resources from tasks
   */
  private extractAllResources(tasks: Task[]): Set<string> {
    const resources = new Set<string>();

    tasks.forEach(task => {
      // Add files
      task.files?.forEach(file => resources.add(file));

      // Add dependencies
      task.dependencies?.forEach(dep => resources.add(`dep:${dep}`));

      // Add other resources
      if (task.resources) {
        Object.keys(task.resources).forEach(res => resources.add(`res:${res}`));
      }
    });

    return resources;
  }

  /**
   * Assign task to most appropriate domain
   */
  private assignTaskToDomain(task: Task, allResources: Set<string>): PrincessDomain {
    if (this.strategy.prioritizeDomainExpertise) {
      // Score each domain based on capability match
      const scores = new Map<PrincessDomain, number>();

      for (const [domain, capabilities] of this.domainCapabilities) {
        let score = 0;

        // Check task description
        if (task.description) {
          const description = task.description.toLowerCase();
          capabilities.forEach(cap => {
            if (description.includes(cap)) score += 10;
          });
        }

        // Check file extensions and names
        task.files?.forEach(file => {
          const fileLower = file.toLowerCase();
          capabilities.forEach(cap => {
            if (fileLower.includes(cap)) score += 5;
          });

          // Special scoring for file types
          if (domain === PrincessDomain.QUALITY &&
              (fileLower.includes('.test.') || fileLower.includes('.spec.'))) {
            score += 20;
          }
          if (domain === PrincessDomain.DEVELOPMENT &&
              (fileLower.endsWith('.ts') || fileLower.endsWith('.tsx'))) {
            score += 15;
          }
          if (domain === PrincessDomain.INFRASTRUCTURE &&
              (fileLower.includes('config') || fileLower.endsWith('.json'))) {
            score += 15;
          }
        });

        scores.set(domain, score);
      }

      // Find domain with highest score
      let maxScore = 0;
      let selectedDomain = task.domain; // Default to task's assigned domain

      scores.forEach((score, domain) => {
        if (score > maxScore) {
          maxScore = score;
          selectedDomain = domain;
        }
      });

      return selectedDomain;
    }

    return task.domain;
  }

  /**
   * Update distribution matrix with task assignment
   */
  private updateDistributionMatrix(task: Task, domain: PrincessDomain): void {
    // Update domain mapping
    if (!this.distributionMatrix.domains.has(domain)) {
      this.distributionMatrix.domains.set(domain, new Set());
    }
    this.distributionMatrix.domains.get(domain)!.add(task.id);

    // Update resource mapping
    task.files?.forEach(file => {
      if (this.distributionMatrix.resources.has(file)) {
        this.logger.warn(`Resource ${file} already assigned - potential overlap`);
      }
      this.distributionMatrix.resources.set(file, domain);
    });

    // Update task mapping
    this.distributionMatrix.tasks.set(task.id, task);
  }

  /**
   * Validate MECE principles in distribution
   */
  validateDistribution(
    distribution: Map<PrincessDomain, Task[]>,
    allResources: Set<string>
  ): MECEValidation {
    const overlaps: OverlapDetail[] = [];
    const gaps: GapDetail[] = [];
    const suggestions: string[] = [];

    // Check for overlaps (Mutually Exclusive)
    const resourceAssignments = new Map<string, PrincessDomain[]>();

    distribution.forEach((tasks, domain) => {
      tasks.forEach(task => {
        task.files?.forEach(file => {
          if (!resourceAssignments.has(file)) {
            resourceAssignments.set(file, []);
          }
          resourceAssignments.get(file)!.push(domain);
        });
      });
    });

    // Find overlapping resources
    resourceAssignments.forEach((domains, resource) => {
      if (domains.length > 1 && !this.strategy.allowRedundancy) {
        overlaps.push({
          resource,
          tasks: this.findTasksUsingResource(resource, distribution),
          domains: [...new Set(domains)],
          severity: domains.length > 2 ? 'high' : 'medium'
        });
        suggestions.push(`Resolve overlap for ${resource} assigned to ${domains.join(', ')}`);
      }
    });

    // Check for gaps (Collectively Exhaustive)
    const coveredResources = new Set(resourceAssignments.keys());
    const coverage = (coveredResources.size / allResources.size) * 100;

    allResources.forEach(resource => {
      if (!coveredResources.has(resource) && !resource.startsWith('dep:')) {
        gaps.push({
          resource,
          expectedCoverage: 'assigned',
          actualCoverage: 'unassigned',
          severity: 'medium'
        });
        suggestions.push(`Assign ${resource} to a Princess domain`);
      }
    });

    const valid = overlaps.length === 0 && gaps.length === 0;

    return {
      valid,
      coverage,
      overlaps,
      gaps,
      suggestions
    };
  }

  /**
   * Find tasks using a specific resource
   */
  private findTasksUsingResource(
    resource: string,
    distribution: Map<PrincessDomain, Task[]>
  ): string[] {
    const taskIds: string[] = [];

    distribution.forEach(tasks => {
      tasks.forEach(task => {
        if (task.files?.includes(resource)) {
          taskIds.push(task.id);
        }
      });
    });

    return taskIds;
  }

  /**
   * Apply corrections to achieve MECE compliance
   */
  private applyMECECorrections(
    distribution: Map<PrincessDomain, Task[]>,
    validation: MECEValidation
  ): void {
    // Handle overlaps
    validation.overlaps.forEach(overlap => {
      if (overlap.severity === 'high') {
        // Reassign to single domain based on expertise
        const primaryDomain = this.selectPrimaryDomain(overlap.resource, overlap.domains);

        // Remove from other domains
        overlap.domains.forEach(domain => {
          if (domain !== primaryDomain) {
            const tasks = distribution.get(domain) || [];
            const filteredTasks = tasks.filter(task =>
              !task.files?.includes(overlap.resource)
            );
            distribution.set(domain, filteredTasks);
          }
        });

        this.logger.info(`Resolved overlap: ${overlap.resource} assigned to ${primaryDomain}`);
      }
    });

    // Handle gaps
    validation.gaps.forEach(gap => {
      if (gap.severity === 'medium' || gap.severity === 'high') {
        // Create synthetic task for uncovered resource
        const domain = this.selectDomainForResource(gap.resource);
        const syntheticTask: Task = {
          id: `synthetic-${gap.resource}`,
          name: `Cover ${gap.resource}`,
          description: `Synthetic task to cover gap for ${gap.resource}`,
          domain,
          files: [gap.resource],
          priority: TaskPriority.LOW,
          status: TaskStatus.PENDING
        };

        const tasks = distribution.get(domain) || [];
        tasks.push(syntheticTask);
        distribution.set(domain, tasks);

        this.logger.info(`Created synthetic task for gap: ${gap.resource}`);
      }
    });
  }

  /**
   * Select primary domain for overlapping resource
   */
  private selectPrimaryDomain(
    resource: string,
    domains: PrincessDomain[]
  ): PrincessDomain {
    // Prioritize based on resource type
    const resourceLower = resource.toLowerCase();

    if (resourceLower.includes('.test.') || resourceLower.includes('.spec.')) {
      return PrincessDomain.QUALITY;
    }
    if (resourceLower.includes('config') || resourceLower.endsWith('.json')) {
      return PrincessDomain.INFRASTRUCTURE;
    }
    if (resourceLower.includes('.md') || resourceLower.includes('readme')) {
      return PrincessDomain.RESEARCH;
    }

    return domains[0]; // Default to first domain
  }

  /**
   * Select domain for uncovered resource
   */
  private selectDomainForResource(resource: string): PrincessDomain {
    const resourceLower = resource.toLowerCase();

    // Use capability matching
    let bestDomain = PrincessDomain.DEVELOPMENT;
    let bestScore = 0;

    this.domainCapabilities.forEach((capabilities, domain) => {
      let score = 0;
      capabilities.forEach(cap => {
        if (resourceLower.includes(cap)) score += 1;
      });

      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    });

    return bestDomain;
  }

  /**
   * Optimize distribution balance across domains
   */
  private optimizeDistributionBalance(
    distribution: Map<PrincessDomain, Task[]>
  ): void {
    const domainLoads = new Map<PrincessDomain, number>();

    // Calculate current loads
    distribution.forEach((tasks, domain) => {
      let load = 0;
      tasks.forEach(task => {
        load += task.estimatedLOC || 100; // Default 100 LOC if not specified
        load += (task.files?.length || 0) * 50; // 50 units per file
      });
      domainLoads.set(domain, load);
    });

    // Find average load
    const totalLoad = Array.from(domainLoads.values()).reduce((a, b) => a + b, 0);
    const avgLoad = totalLoad / domainLoads.size;

    // Log imbalances
    domainLoads.forEach((load, domain) => {
      const imbalance = ((load - avgLoad) / avgLoad) * 100;
      if (Math.abs(imbalance) > 30) {
        this.logger.warn(
          `Domain ${domain} has ${imbalance > 0 ? 'excessive' : 'insufficient'} load: ${imbalance.toFixed(1)}%`
        );
      }
    });

    // Note: Actual rebalancing would move tasks between domains
    // but this could violate MECE principles, so we just report
    this.emit('balance-analysis', { domainLoads, avgLoad });
  }

  /**
   * Reset distribution matrix
   */
  private resetDistributionMatrix(): void {
    this.distributionMatrix = {
      domains: new Map(),
      resources: new Map(),
      tasks: new Map()
    };

    Object.values(PrincessDomain).forEach(domain => {
      this.distributionMatrix.domains.set(domain as PrincessDomain, new Set());
    });
  }

  /**
   * Configure MECE strategy
   */
  configureStrategy(strategy: Partial<MECEStrategy>): void {
    this.strategy = {
      ...this.strategy,
      ...strategy
    };

    this.logger.info('MECE strategy updated:', this.strategy);
  }

  /**
   * Get current distribution matrix
   */
  getDistributionMatrix(): DistributionMatrix {
    return this.distributionMatrix;
  }

  /**
   * Get distribution statistics
   */
  getDistributionStats(): any {
    const stats: any = {
      totalTasks: this.distributionMatrix.tasks.size,
      totalResources: this.distributionMatrix.resources.size,
      domainDistribution: {}
    };

    this.distributionMatrix.domains.forEach((taskIds, domain) => {
      stats.domainDistribution[domain] = {
        taskCount: taskIds.size,
        resourceCount: Array.from(this.distributionMatrix.resources.entries())
          .filter(([_, d]) => d === domain).length
      };
    });

    return stats;
  }
}

// Re-export missing types
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export default MECEDistributor;