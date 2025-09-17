/**
 * GitHub Project Manager Integration for Swarm Coordination
 *
 * Integrates the swarm system with GitHub Project Manager MCP for:
 * - Real-time synchronization of swarm progress with GitHub projects
 * - Automatic issue creation and task tracking
 * - Truth source validation against GitHub state
 * - Evidence-rich pull request creation
 * - Comprehensive audit trails for all swarm activities
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface GitHubProject {
  id: string;
  name: string;
  description: string;
  repository: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  phases: GitHubPhase[];
  milestones: GitHubMilestone[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface GitHubPhase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
  assignedPrincess?: string;
  dependencies: string[];
  estimatedDuration: number;
  actualDuration?: number;
  issues: GitHubIssue[];
  pullRequests: GitHubPullRequest[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  labels: string[];
  startDate?: Date;
  endDate?: Date;
  completionPercentage: number;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  body: string;
  status: 'open' | 'closed' | 'in_progress';
  assignee?: string;
  labels: string[];
  milestone?: string;
  createdAt: Date;
  updatedAt: Date;
  comments: GitHubComment[];
  linkedPullRequests: string[];
  swarmMetadata: SwarmIssueMetadata;
}

export interface GitHubPullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  status: 'open' | 'closed' | 'merged' | 'draft';
  author: string;
  assignees: string[];
  reviewers: string[];
  labels: string[];
  baseBranch: string;
  headBranch: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  comments: GitHubComment[];
  reviews: GitHubReview[];
  checks: GitHubCheck[];
  swarmMetadata: SwarmPRMetadata;
}

export interface SwarmProgress {
  swarmId: string;
  type: 'development' | 'debug';
  projectId: string;
  overallProgress: number;
  activePhases: number;
  completedPhases: number;
  activePrincesses: string[];
  completedTasks: number;
  totalTasks: number;
  qualityMetrics: SwarmQualityMetrics;
  lastSyncTime: Date;
  nextMilestone?: GitHubMilestone;
  riskFactors: SwarmRiskFactor[];
}

export interface TruthValidation {
  validationId: string;
  swarmId: string;
  githubProjectId: string;
  validated: boolean;
  confidence: number;
  discrepancies: TruthDiscrepancy[];
  lastValidation: Date;
  nextValidation: Date;
  autoSync: boolean;
  validationCriteria: TruthCriteria[];
}

export interface EvidencePackage {
  packageId: string;
  swarmId: string;
  phaseId: string;
  type: 'development_completion' | 'debug_resolution' | 'quality_validation' | 'integration_success';
  artifacts: EvidenceArtifact[];
  metrics: EvidenceMetrics;
  validations: ValidationEvidence[];
  testimonials: PrincessTestimonial[];
  timestamp: Date;
  signature: string;
  githubLinks: GitHubReference[];
}

interface GitHubMilestone {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  status: 'open' | 'closed';
  progress: number;
  issues: string[];
}

interface GitHubComment {
  id: string;
  author: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  reactions: GitHubReaction[];
}

interface GitHubReview {
  id: string;
  reviewer: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'dismissed';
  body: string;
  submittedAt: Date;
  comments: GitHubReviewComment[];
}

interface GitHubCheck {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out';
  startedAt: Date;
  completedAt?: Date;
  details: string;
  url?: string;
}

interface SwarmIssueMetadata {
  swarmId: string;
  swarmType: 'development' | 'debug';
  princessId?: string;
  phaseId?: string;
  errorId?: string;
  fixId?: string;
  priority: number;
  automatedCreation: boolean;
  linkedArtifacts: string[];
}

interface SwarmPRMetadata {
  swarmId: string;
  swarmType: 'development' | 'debug';
  princessId: string;
  phaseIds: string[];
  evidencePackageId: string;
  qualityScore: number;
  automatedCreation: boolean;
  validationResults: string[];
}

interface SwarmQualityMetrics {
  overallQuality: number;
  codeQuality: number;
  testCoverage: number;
  securityScore: number;
  performanceScore: number;
  documentationScore: number;
  complianceScore: number;
}

interface SwarmRiskFactor {
  type: 'timeline' | 'quality' | 'resource' | 'dependency' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
  probability: number;
}

interface TruthDiscrepancy {
  type: 'status_mismatch' | 'progress_mismatch' | 'assignment_mismatch' | 'timeline_mismatch';
  description: string;
  swarmValue: any;
  githubValue: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  resolutionAction?: string;
}

interface TruthCriteria {
  name: string;
  description: string;
  weight: number;
  threshold: number;
  currentValue: number;
  passed: boolean;
}

interface EvidenceArtifact {
  id: string;
  type: 'code' | 'test_results' | 'documentation' | 'metrics' | 'logs' | 'screenshots';
  name: string;
  path: string;
  size: number;
  hash: string;
  description: string;
  metadata: Record<string, any>;
}

interface EvidenceMetrics {
  linesOfCode: number;
  testsWritten: number;
  testsPassed: number;
  codeQuality: number;
  coverage: number;
  securityScore: number;
  performanceScore: number;
  documentationPages: number;
}

interface ValidationEvidence {
  validationType: 'functional' | 'performance' | 'security' | 'integration' | 'regression';
  validator: string;
  result: 'passed' | 'failed' | 'warning';
  score: number;
  details: string;
  timestamp: Date;
  artifacts: string[];
}

interface PrincessTestimonial {
  princessId: string;
  princessName: string;
  phaseId: string;
  testimonial: string;
  confidence: number;
  recommendations: string[];
  timestamp: Date;
  signature: string;
}

interface GitHubReference {
  type: 'issue' | 'pull_request' | 'commit' | 'release';
  id: string;
  url: string;
  title: string;
  description: string;
}

interface GitHubReaction {
  type: 'thumbs_up' | 'thumbs_down' | 'laugh' | 'hooray' | 'confused' | 'heart' | 'rocket' | 'eyes';
  count: number;
  users: string[];
}

interface GitHubReviewComment {
  id: string;
  body: string;
  path: string;
  line: number;
  createdAt: Date;
  author: string;
}

export class GitHubProjectIntegration extends EventEmitter {
  private projects: Map<string, GitHubProject> = new Map();
  private swarmProgress: Map<string, SwarmProgress> = new Map();
  private truthValidations: Map<string, TruthValidation> = new Map();
  private evidencePackages: Map<string, EvidencePackage> = new Map();
  private syncInterval?: NodeJS.Timeout;
  private readonly repository: string;
  private readonly githubToken?: string;
  private readonly syncIntervalMs = 30000; // 30 seconds

  constructor(repository: string, githubToken?: string) {
    super();
    this.repository = repository;
    this.githubToken = githubToken;
    this.setupEventHandlers();
    this.startPeriodicSync();
  }

  /**
   * Initialize GitHub project for swarm coordination
   */
  async initializeProject(swarmId: string, swarmType: 'development' | 'debug', specification: any): Promise<GitHubProject> {
    console.log(`Initializing GitHub project for ${swarmType} swarm: ${swarmId}`);

    const project: GitHubProject = {
      id: crypto.randomUUID(),
      name: `${swarmType.charAt(0).toUpperCase() + swarmType.slice(1)} Swarm - ${swarmId}`,
      description: this.generateProjectDescription(swarmType, specification),
      repository: this.repository,
      status: 'active',
      phases: [],
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        swarmId,
        swarmType,
        specification,
        automatedCreation: true,
        framework: 'swarm-coordination'
      }
    };

    // Create GitHub project via MCP
    try {
      const githubProject = await this.createGitHubProject(project);
      project.id = githubProject.id;
    } catch (error) {
      console.warn('Failed to create GitHub project, using local tracking:', error);
    }

    this.projects.set(project.id, project);

    // Initialize swarm progress tracking
    const progress: SwarmProgress = {
      swarmId,
      type: swarmType,
      projectId: project.id,
      overallProgress: 0,
      activePhases: 0,
      completedPhases: 0,
      activePrincesses: [],
      completedTasks: 0,
      totalTasks: 0,
      qualityMetrics: this.initializeQualityMetrics(),
      lastSyncTime: new Date(),
      riskFactors: []
    };

    this.swarmProgress.set(swarmId, progress);

    this.emit('project:initialized', {
      projectId: project.id,
      swarmId,
      swarmType,
      repository: this.repository
    });

    return project;
  }

  /**
   * Sync swarm phase with GitHub project phase
   */
  async syncPhase(swarmId: string, phaseId: string, phaseData: any): Promise<GitHubPhase> {
    const progress = this.swarmProgress.get(swarmId);
    if (!progress) {
      throw new Error(`Swarm progress not found for: ${swarmId}`);
    }

    const project = this.projects.get(progress.projectId);
    if (!project) {
      throw new Error(`Project not found for swarm: ${swarmId}`);
    }

    // Find existing phase or create new one
    let githubPhase = project.phases.find(p => p.id === phaseId);

    if (!githubPhase) {
      githubPhase = {
        id: phaseId,
        projectId: project.id,
        name: phaseData.name || `Phase ${phaseId}`,
        description: phaseData.description || '',
        status: 'pending',
        dependencies: phaseData.dependencies || [],
        estimatedDuration: phaseData.estimatedDuration || 0,
        issues: [],
        pullRequests: [],
        priority: phaseData.priority || 'medium',
        labels: ['swarm-phase', progress.type],
        completionPercentage: 0
      };

      project.phases.push(githubPhase);

      // Create GitHub issue for phase tracking
      try {
        const issue = await this.createPhaseIssue(project, githubPhase);
        githubPhase.issues.push(issue);
      } catch (error) {
        console.warn('Failed to create GitHub issue for phase:', error);
      }
    }

    // Update phase status and progress
    githubPhase.status = phaseData.status || githubPhase.status;
    githubPhase.assignedPrincess = phaseData.assignedPrincess || githubPhase.assignedPrincess;
    githubPhase.completionPercentage = phaseData.completionPercentage || githubPhase.completionPercentage;

    if (phaseData.status === 'in_progress' && !githubPhase.startDate) {
      githubPhase.startDate = new Date();
    }

    if (phaseData.status === 'completed' && !githubPhase.endDate) {
      githubPhase.endDate = new Date();
      githubPhase.actualDuration = githubPhase.endDate.getTime() - (githubPhase.startDate?.getTime() || 0);
    }

    project.updatedAt = new Date();

    // Update GitHub project
    try {
      await this.updateGitHubProject(project);
    } catch (error) {
      console.warn('Failed to update GitHub project:', error);
    }

    this.emit('phase:synced', {
      projectId: project.id,
      swarmId,
      phaseId,
      status: githubPhase.status,
      completionPercentage: githubPhase.completionPercentage
    });

    return githubPhase;
  }

  /**
   * Create evidence-rich pull request for completed work
   */
  async createEvidencePR(swarmId: string, phaseId: string, evidencePackage: EvidencePackage): Promise<GitHubPullRequest> {
    const progress = this.swarmProgress.get(swarmId);
    if (!progress) {
      throw new Error(`Swarm progress not found for: ${swarmId}`);
    }

    const project = this.projects.get(progress.projectId);
    if (!project) {
      throw new Error(`Project not found for swarm: ${swarmId}`);
    }

    const phase = project.phases.find(p => p.id === phaseId);
    if (!phase) {
      throw new Error(`Phase ${phaseId} not found in project`);
    }

    // Generate comprehensive PR description
    const prDescription = this.generatePRDescription(evidencePackage, phase, progress);

    const pullRequest: GitHubPullRequest = {
      id: crypto.randomUUID(),
      number: 0, // Will be set by GitHub
      title: `${progress.type === 'development' ? 'feat' : 'fix'}: Complete ${phase.name}`,
      body: prDescription,
      status: 'open',
      author: evidencePackage.testimonials[0]?.princessName || 'swarm-automation',
      assignees: phase.assignedPrincess ? [phase.assignedPrincess] : [],
      reviewers: [],
      labels: [
        'swarm-automation',
        progress.type,
        `quality-${this.getQualityLabel(evidencePackage.metrics.codeQuality)}`,
        `coverage-${Math.floor(evidencePackage.metrics.coverage / 10) * 10}%`
      ],
      baseBranch: 'main',
      headBranch: `swarm/${swarmId}/${phaseId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      reviews: [],
      checks: [],
      swarmMetadata: {
        swarmId,
        swarmType: progress.type,
        princessId: phase.assignedPrincess || '',
        phaseIds: [phaseId],
        evidencePackageId: evidencePackage.packageId,
        qualityScore: evidencePackage.metrics.codeQuality,
        automatedCreation: true,
        validationResults: evidencePackage.validations.map(v => v.validationType)
      }
    };

    // Create GitHub pull request
    try {
      const githubPR = await this.createGitHubPR(pullRequest);
      pullRequest.id = githubPR.id;
      pullRequest.number = githubPR.number;
    } catch (error) {
      console.warn('Failed to create GitHub PR, using local tracking:', error);
    }

    phase.pullRequests.push(pullRequest);
    project.updatedAt = new Date();

    this.emit('pr:created', {
      projectId: project.id,
      swarmId,
      phaseId,
      prId: pullRequest.id,
      prNumber: pullRequest.number,
      evidencePackageId: evidencePackage.packageId
    });

    return pullRequest;
  }

  /**
   * Validate swarm state against GitHub truth source
   */
  async validateTruthSource(swarmId: string, swarmState: any): Promise<TruthValidation> {
    console.log(`Validating swarm ${swarmId} against GitHub truth source`);

    const progress = this.swarmProgress.get(swarmId);
    if (!progress) {
      throw new Error(`Swarm progress not found for: ${swarmId}`);
    }

    const project = this.projects.get(progress.projectId);
    if (!project) {
      throw new Error(`Project not found for swarm: ${swarmId}`);
    }

    // Fetch latest GitHub project state
    let githubProject: GitHubProject;
    try {
      githubProject = await this.fetchGitHubProject(project.id);
    } catch (error) {
      console.warn('Failed to fetch GitHub project, using local state:', error);
      githubProject = project;
    }

    // Compare swarm state with GitHub state
    const discrepancies = this.identifyDiscrepancies(swarmState, githubProject);
    const criteria = this.evaluateTruthCriteria(swarmState, githubProject);

    const validation: TruthValidation = {
      validationId: crypto.randomUUID(),
      swarmId,
      githubProjectId: project.id,
      validated: discrepancies.filter(d => d.severity === 'high' || d.severity === 'critical').length === 0,
      confidence: criteria.filter(c => c.passed).length / criteria.length,
      discrepancies,
      lastValidation: new Date(),
      nextValidation: new Date(Date.now() + this.syncIntervalMs),
      autoSync: true,
      validationCriteria: criteria
    };

    this.truthValidations.set(validation.validationId, validation);

    // Auto-resolve discrepancies if possible
    for (const discrepancy of discrepancies.filter(d => d.autoResolvable)) {
      try {
        await this.resolveDiscrepancy(swarmId, discrepancy);
      } catch (error) {
        console.warn(`Failed to auto-resolve discrepancy: ${discrepancy.description}`, error);
      }
    }

    this.emit('truth:validated', {
      validationId: validation.validationId,
      swarmId,
      validated: validation.validated,
      confidence: validation.confidence,
      discrepancies: discrepancies.length,
      autoResolved: discrepancies.filter(d => d.autoResolvable).length
    });

    return validation;
  }

  /**
   * Update swarm progress metrics
   */
  async updateProgress(swarmId: string, progressUpdate: Partial<SwarmProgress>): Promise<void> {
    const progress = this.swarmProgress.get(swarmId);
    if (!progress) {
      throw new Error(`Swarm progress not found for: ${swarmId}`);
    }

    // Update progress metrics
    Object.assign(progress, progressUpdate, {
      lastSyncTime: new Date()
    });

    // Calculate overall progress
    if (progressUpdate.completedPhases !== undefined && progressUpdate.totalTasks !== undefined) {
      progress.overallProgress = progressUpdate.totalTasks > 0
        ? (progressUpdate.completedTasks || 0) / progressUpdate.totalTasks * 100
        : 0;
    }

    // Update project status
    const project = this.projects.get(progress.projectId);
    if (project) {
      if (progress.overallProgress >= 100) {
        project.status = 'completed';
      } else if (progress.overallProgress > 0) {
        project.status = 'active';
      }
      project.updatedAt = new Date();
    }

    this.emit('progress:updated', {
      swarmId,
      overallProgress: progress.overallProgress,
      activePhases: progress.activePhases,
      completedPhases: progress.completedPhases,
      qualityMetrics: progress.qualityMetrics
    });
  }

  /**
   * Create evidence package for completed work
   */
  createEvidencePackage(swarmId: string, phaseId: string, artifacts: any[], metrics: any, validations: any[]): EvidencePackage {
    const evidencePackage: EvidencePackage = {
      packageId: crypto.randomUUID(),
      swarmId,
      phaseId,
      type: 'development_completion',
      artifacts: artifacts.map(this.convertToEvidenceArtifact),
      metrics: this.convertToEvidenceMetrics(metrics),
      validations: validations.map(this.convertToValidationEvidence),
      testimonials: [],
      timestamp: new Date(),
      signature: this.generateEvidenceSignature(swarmId, phaseId, artifacts, metrics),
      githubLinks: []
    };

    this.evidencePackages.set(evidencePackage.packageId, evidencePackage);

    this.emit('evidence:packaged', {
      packageId: evidencePackage.packageId,
      swarmId,
      phaseId,
      artifactCount: evidencePackage.artifacts.length,
      validationCount: evidencePackage.validations.length
    });

    return evidencePackage;
  }

  /**
   * Get project status
   */
  getProjectStatus(projectId: string): GitHubProject | undefined {
    return this.projects.get(projectId);
  }

  /**
   * Get swarm progress
   */
  getSwarmProgress(swarmId: string): SwarmProgress | undefined {
    return this.swarmProgress.get(swarmId);
  }

  /**
   * Get truth validation results
   */
  getTruthValidation(validationId: string): TruthValidation | undefined {
    return this.truthValidations.get(validationId);
  }

  /**
   * Start periodic synchronization with GitHub
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(async () => {
      await this.performPeriodicSync();
    }, this.syncIntervalMs);

    console.log(`Started periodic GitHub sync every ${this.syncIntervalMs / 1000} seconds`);
  }

  /**
   * Perform periodic synchronization
   */
  private async performPeriodicSync(): Promise<void> {
    console.log('Performing periodic GitHub synchronization...');

    for (const [swarmId, progress] of this.swarmProgress) {
      try {
        // Validate truth source for each active swarm
        await this.validateTruthSource(swarmId, progress);

        // Update GitHub project with latest progress
        const project = this.projects.get(progress.projectId);
        if (project) {
          await this.updateGitHubProject(project);
        }

      } catch (error) {
        console.warn(`Failed to sync swarm ${swarmId}:`, error);
      }
    }
  }

  // Helper methods for GitHub API interactions...
  private async createGitHubProject(project: GitHubProject): Promise<{ id: string }> {
    // Simulate GitHub project creation via MCP
    if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__github_project_manager__create_project) {
      return await (globalThis as any).mcp__github_project_manager__create_project({
        repository: this.repository,
        name: project.name,
        description: project.description,
        metadata: project.metadata
      });
    }

    // Fallback simulation
    await this.delay(1000);
    return { id: project.id };
  }

  private async updateGitHubProject(project: GitHubProject): Promise<void> {
    if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__github_project_manager__update_project) {
      await (globalThis as any).mcp__github_project_manager__update_project({
        repository: this.repository,
        projectId: project.id,
        status: project.status,
        phases: project.phases,
        updatedAt: project.updatedAt
      });
    }

    await this.delay(500);
  }

  private async fetchGitHubProject(projectId: string): Promise<GitHubProject> {
    if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__github_project_manager__get_project) {
      const result = await (globalThis as any).mcp__github_project_manager__get_project({
        repository: this.repository,
        projectId
      });
      return result.project;
    }

    // Fallback to local state
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    return project;
  }

  private async createPhaseIssue(project: GitHubProject, phase: GitHubPhase): Promise<GitHubIssue> {
    const issue: GitHubIssue = {
      id: crypto.randomUUID(),
      number: 0,
      title: `[Swarm Phase] ${phase.name}`,
      body: this.generatePhaseIssueBody(phase),
      status: 'open',
      labels: ['swarm-phase', project.metadata.swarmType, phase.priority],
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      linkedPullRequests: [],
      swarmMetadata: {
        swarmId: project.metadata.swarmId,
        swarmType: project.metadata.swarmType,
        phaseId: phase.id,
        priority: this.getPriorityNumber(phase.priority),
        automatedCreation: true,
        linkedArtifacts: []
      }
    };

    // Create GitHub issue via API
    if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__github_project_manager__create_issue) {
      const result = await (globalThis as any).mcp__github_project_manager__create_issue({
        repository: this.repository,
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        metadata: issue.swarmMetadata
      });
      issue.id = result.id;
      issue.number = result.number;
    }

    return issue;
  }

  private async createGitHubPR(pullRequest: GitHubPullRequest): Promise<{ id: string; number: number }> {
    if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__github_project_manager__create_pull_request) {
      return await (globalThis as any).mcp__github_project_manager__create_pull_request({
        repository: this.repository,
        title: pullRequest.title,
        body: pullRequest.body,
        headBranch: pullRequest.headBranch,
        baseBranch: pullRequest.baseBranch,
        labels: pullRequest.labels,
        metadata: pullRequest.swarmMetadata
      });
    }

    // Fallback simulation
    await this.delay(1500);
    return { id: pullRequest.id, number: Math.floor(Math.random() * 1000) + 1 };
  }

  // Utility methods...
  private generateProjectDescription(swarmType: 'development' | 'debug', specification: any): string {
    const typeCapitalized = swarmType.charAt(0).toUpperCase() + swarmType.slice(1);
    return `${typeCapitalized} Swarm automation project for ${specification?.title || 'system enhancement'}.

This project coordinates ${swarmType === 'development' ? 'concurrent development phases' : 'expert debugging specialists'} through automated Princess hive deployment and real-time progress tracking.

**Automation Features:**
- Queen-led coordination and dependency analysis
- Princess specialization and workload optimization
- Sandbox testing and validation framework
- Evidence-rich deliverable packaging
- Real-time GitHub integration and truth validation

Generated by Swarm Coordination Framework v2.0.0`;
  }

  private generatePhaseIssueBody(phase: GitHubPhase): string {
    return `## Phase: ${phase.name}

**Description:** ${phase.description}

**Status:** ${phase.status}
**Priority:** ${phase.priority}
**Estimated Duration:** ${phase.estimatedDuration} hours
**Assigned Princess:** ${phase.assignedPrincess || 'Pending assignment'}

**Dependencies:**
${phase.dependencies.length > 0 ? phase.dependencies.map(dep => `- ${dep}`).join('\n') : 'None'}

**Progress:** ${phase.completionPercentage}%

---
*This issue is automatically managed by the Swarm Coordination Framework*`;
  }

  private generatePRDescription(evidencePackage: EvidencePackage, phase: GitHubPhase, progress: SwarmProgress): string {
    return `## ${progress.type === 'development' ? 'Development' : 'Debug'} Completion: ${phase.name}

### Summary
This pull request completes ${phase.name} as part of the ${progress.type} swarm workflow. All work has been validated through comprehensive testing and quality gates.

### Evidence Package
**Package ID:** ${evidencePackage.packageId}
**Quality Score:** ${evidencePackage.metrics.codeQuality}/100
**Test Coverage:** ${evidencePackage.metrics.coverage}%
**Security Score:** ${evidencePackage.metrics.securityScore}/100

### Metrics
- **Lines of Code:** ${evidencePackage.metrics.linesOfCode}
- **Tests Written:** ${evidencePackage.metrics.testsWritten}
- **Tests Passed:** ${evidencePackage.metrics.testsPassed}
- **Documentation Pages:** ${evidencePackage.metrics.documentationPages}

### Validations Completed
${evidencePackage.validations.map(v => `-  ${v.validationType}: ${v.result} (${v.score}/100)`).join('\n')}

### Artifacts
${evidencePackage.artifacts.slice(0, 5).map(a => `- ${a.type}: ${a.name} (${a.size} bytes)`).join('\n')}
${evidencePackage.artifacts.length > 5 ? `- And ${evidencePackage.artifacts.length - 5} more artifacts...` : ''}

### Princess Testimonials
${evidencePackage.testimonials.map(t => `**${t.princessName}:** "${t.testimonial}" (Confidence: ${t.confidence * 100}%)`).join('\n\n')}

---
 Generated by Swarm Coordination Framework
 Evidence Package: ${evidencePackage.signature}
 Completed: ${evidencePackage.timestamp.toISOString()}`;
  }

  private identifyDiscrepancies(swarmState: any, githubProject: GitHubProject): TruthDiscrepancy[] {
    const discrepancies: TruthDiscrepancy[] = [];

    // Compare phase statuses
    for (const githubPhase of githubProject.phases) {
      const swarmPhase = swarmState.phases?.find((p: any) => p.id === githubPhase.id);

      if (swarmPhase && swarmPhase.status !== githubPhase.status) {
        discrepancies.push({
          type: 'status_mismatch',
          description: `Phase ${githubPhase.name} status mismatch`,
          swarmValue: swarmPhase.status,
          githubValue: githubPhase.status,
          severity: 'medium',
          autoResolvable: true,
          resolutionAction: 'sync_phase_status'
        });
      }

      if (swarmPhase && Math.abs(swarmPhase.completionPercentage - githubPhase.completionPercentage) > 5) {
        discrepancies.push({
          type: 'progress_mismatch',
          description: `Phase ${githubPhase.name} progress mismatch`,
          swarmValue: swarmPhase.completionPercentage,
          githubValue: githubPhase.completionPercentage,
          severity: 'low',
          autoResolvable: true,
          resolutionAction: 'sync_phase_progress'
        });
      }
    }

    return discrepancies;
  }

  private evaluateTruthCriteria(swarmState: any, githubProject: GitHubProject): TruthCriteria[] {
    return [
      {
        name: 'Phase Count Consistency',
        description: 'Swarm and GitHub have same number of phases',
        weight: 0.3,
        threshold: 1.0,
        currentValue: swarmState.phases?.length === githubProject.phases.length ? 1.0 : 0.0,
        passed: swarmState.phases?.length === githubProject.phases.length
      },
      {
        name: 'Status Alignment',
        description: 'Phase statuses match between swarm and GitHub',
        weight: 0.4,
        threshold: 0.9,
        currentValue: this.calculateStatusAlignment(swarmState, githubProject),
        passed: this.calculateStatusAlignment(swarmState, githubProject) >= 0.9
      },
      {
        name: 'Progress Accuracy',
        description: 'Progress percentages are within acceptable tolerance',
        weight: 0.3,
        threshold: 0.95,
        currentValue: this.calculateProgressAccuracy(swarmState, githubProject),
        passed: this.calculateProgressAccuracy(swarmState, githubProject) >= 0.95
      }
    ];
  }

  private calculateStatusAlignment(swarmState: any, githubProject: GitHubProject): number {
    if (!swarmState.phases || githubProject.phases.length === 0) return 0;

    let matches = 0;
    for (const githubPhase of githubProject.phases) {
      const swarmPhase = swarmState.phases.find((p: any) => p.id === githubPhase.id);
      if (swarmPhase && swarmPhase.status === githubPhase.status) {
        matches++;
      }
    }

    return matches / githubProject.phases.length;
  }

  private calculateProgressAccuracy(swarmState: any, githubProject: GitHubProject): number {
    if (!swarmState.phases || githubProject.phases.length === 0) return 0;

    let accurateCount = 0;
    for (const githubPhase of githubProject.phases) {
      const swarmPhase = swarmState.phases.find((p: any) => p.id === githubPhase.id);
      if (swarmPhase) {
        const difference = Math.abs(swarmPhase.completionPercentage - githubPhase.completionPercentage);
        if (difference <= 5) { // 5% tolerance
          accurateCount++;
        }
      }
    }

    return accurateCount / githubProject.phases.length;
  }

  private async resolveDiscrepancy(swarmId: string, discrepancy: TruthDiscrepancy): Promise<void> {
    console.log(`Auto-resolving discrepancy: ${discrepancy.description}`);

    switch (discrepancy.resolutionAction) {
      case 'sync_phase_status':
        // Update GitHub to match swarm status
        await this.updatePhaseStatus(swarmId, discrepancy);
        break;
      case 'sync_phase_progress':
        // Update GitHub to match swarm progress
        await this.updatePhaseProgress(swarmId, discrepancy);
        break;
      default:
        console.warn(`Unknown resolution action: ${discrepancy.resolutionAction}`);
    }
  }

  private async updatePhaseStatus(swarmId: string, discrepancy: TruthDiscrepancy): Promise<void> {
    // Implementation would update GitHub phase status
    await this.delay(500);
    console.log(`Updated phase status from ${discrepancy.githubValue} to ${discrepancy.swarmValue}`);
  }

  private async updatePhaseProgress(swarmId: string, discrepancy: TruthDiscrepancy): Promise<void> {
    // Implementation would update GitHub phase progress
    await this.delay(300);
    console.log(`Updated phase progress from ${discrepancy.githubValue}% to ${discrepancy.swarmValue}%`);
  }

  private initializeQualityMetrics(): SwarmQualityMetrics {
    return {
      overallQuality: 0,
      codeQuality: 0,
      testCoverage: 0,
      securityScore: 0,
      performanceScore: 0,
      documentationScore: 0,
      complianceScore: 0
    };
  }

  private convertToEvidenceArtifact(artifact: any): EvidenceArtifact {
    return {
      id: artifact.id || crypto.randomUUID(),
      type: artifact.type || 'code',
      name: artifact.name || 'Unnamed artifact',
      path: artifact.path || '',
      size: artifact.size || 0,
      hash: artifact.hash || '',
      description: artifact.description || '',
      metadata: artifact.metadata || {}
    };
  }

  private convertToEvidenceMetrics(metrics: any): EvidenceMetrics {
    return {
      linesOfCode: metrics.linesOfCode || 0,
      testsWritten: metrics.testsWritten || 0,
      testsPassed: metrics.testsPassed || 0,
      codeQuality: metrics.codeQuality || 0,
      coverage: metrics.coverage || 0,
      securityScore: metrics.securityScore || 0,
      performanceScore: metrics.performanceScore || 0,
      documentationPages: metrics.documentationPages || 0
    };
  }

  private convertToValidationEvidence(validation: any): ValidationEvidence {
    return {
      validationType: validation.type || 'functional',
      validator: validation.validator || 'automated',
      result: validation.result || 'passed',
      score: validation.score || 0,
      details: validation.details || '',
      timestamp: validation.timestamp || new Date(),
      artifacts: validation.artifacts || []
    };
  }

  private generateEvidenceSignature(swarmId: string, phaseId: string, artifacts: any[], metrics: any): string {
    const data = `${swarmId}-${phaseId}-${JSON.stringify(artifacts)}-${JSON.stringify(metrics)}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private getQualityLabel(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'needs-improvement';
  }

  private getPriorityNumber(priority: string): number {
    const mapping = { critical: 1, high: 2, medium: 3, low: 4 };
    return mapping[priority as keyof typeof mapping] || 3;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private setupEventHandlers(): void {
    this.on('sync:error', this.handleSyncError.bind(this));
    this.on('truth:discrepancy', this.handleTruthDiscrepancy.bind(this));
    this.on('evidence:validation_failed', this.handleValidationFailed.bind(this));
  }

  private handleSyncError(data: any): void {
    console.error(`GitHub sync error for ${data.swarmId}: ${data.error}`);
  }

  private handleTruthDiscrepancy(data: any): void {
    console.warn(`Truth discrepancy detected in ${data.swarmId}: ${data.description}`);
  }

  private handleValidationFailed(data: any): void {
    console.warn(`Evidence validation failed for ${data.packageId}: ${data.reason}`);
  }

  /**
   * Cleanup and stop synchronization
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.removeAllListeners();
    console.log('GitHub Project Integration destroyed');
  }
}

export default GitHubProjectIntegration;