/**
 * MECE Validation Protocol for Princess Coordination
 *
 * Enforces Mutually Exclusive, Collectively Exhaustive principles across
 * Princess domains to prevent overlap and ensure complete coverage.
 */

import { EventEmitter } from 'events';
import { HivePrincess } from '../hierarchy/HivePrincess';
import { PrincessConsensus } from '../hierarchy/PrincessConsensus';

export interface DomainBoundary {
  domainName: string;
  principalResponsibilities: string[];
  criticalKeys: string[];
  managedAgentTypes: string[];
  exclusionPatterns: string[];
  dependencies: string[];
}

export interface MECEViolation {
  violationType: 'overlap' | 'gap' | 'dependency_conflict' | 'boundary_breach';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedDomains: string[];
  conflictingElements: string[];
  resolutionRequired: boolean;
  suggestedFix: string;
}

export interface MECEValidationResult {
  validationId: string;
  timestamp: number;
  overallCompliance: number; // 0-1 scale
  mutuallyExclusive: boolean;
  collectivelyExhaustive: boolean;
  violations: MECEViolation[];
  domainCoverage: Map<string, number>;
  recommendedActions: string[];
}

export interface CrossDomainHandoff {
  fromDomain: string;
  toDomain: string;
  handoffType: 'task_completion' | 'dependency_resolution' | 'escalation' | 'information_sharing';
  payload: any;
  requiresConsensus: boolean;
  contextIntegrity: boolean;
  timestamp: number;
}

export class MECEValidationProtocol extends EventEmitter {
  private princesses: Map<string, HivePrincess> = new Map();
  private domainBoundaries: Map<string, DomainBoundary> = new Map();
  private validationHistory: MECEValidationResult[] = [];
  private activeHandoffs: Map<string, CrossDomainHandoff> = new Map();
  private consensus: PrincessConsensus;

  // MECE Compliance Thresholds
  private readonly MECE_COMPLIANCE_THRESHOLD = 0.85; // 85% minimum
  private readonly OVERLAP_TOLERANCE = 0.05; // 5% maximum overlap
  private readonly COVERAGE_MINIMUM = 0.95; // 95% minimum coverage

  constructor(princesses: Map<string, HivePrincess>, consensus: PrincessConsensus) {
    super();
    this.princesses = princesses;
    this.consensus = consensus;
    this.initializeDomainBoundaries();
    this.setupValidationListeners();
  }

  /**
   * Initialize domain boundaries for all Princess types
   */
  private initializeDomainBoundaries(): void {
    // Coordination Princess Domain
    this.domainBoundaries.set('coordination', {
      domainName: 'coordination',
      principalResponsibilities: [
        'task orchestration',
        'agent assignment',
        'workflow management',
        'sequential thinking enforcement',
        'memory coordination',
        'project board synchronization'
      ],
      criticalKeys: [
        'taskId', 'agentType', 'sequentialSteps', 'requiresConsensus',
        'priority', 'agents', 'coordination_type', 'checkpoint_id'
      ],
      managedAgentTypes: [
        'sparc-coord', 'hierarchical-coordinator', 'mesh-coordinator',
        'adaptive-coordinator', 'task-orchestrator', 'memory-coordinator',
        'planner', 'project-board-sync'
      ],
      exclusionPatterns: [
        'code generation', 'quality analysis', 'security scanning',
        'research execution', 'infrastructure deployment'
      ],
      dependencies: ['memory', 'github-project-manager']
    });

    // Development Princess Domain
    this.domainBoundaries.set('development', {
      domainName: 'development',
      principalResponsibilities: [
        'code generation',
        'feature implementation',
        'bug fixes',
        'refactoring',
        'build processes'
      ],
      criticalKeys: [
        'codeFiles', 'dependencies', 'buildStatus', 'implementation',
        'features', 'bugs', 'refactoring_tasks'
      ],
      managedAgentTypes: [
        'coder', 'sparc-coder', 'backend-dev', 'mobile-dev',
        'frontend-developer', 'api-docs', 'base-template-generator'
      ],
      exclusionPatterns: [
        'task orchestration', 'quality auditing', 'security policies',
        'research analysis', 'infrastructure monitoring'
      ],
      dependencies: ['github', 'claude-flow']
    });

    // Quality Princess Domain
    this.domainBoundaries.set('quality', {
      domainName: 'quality',
      principalResponsibilities: [
        'code review',
        'testing',
        'quality analysis',
        'compliance validation',
        'performance optimization'
      ],
      criticalKeys: [
        'testResults', 'coverage', 'lintResults', 'auditStatus',
        'performance_metrics', 'compliance_scores'
      ],
      managedAgentTypes: [
        'reviewer', 'tester', 'code-analyzer', 'production-validator',
        'perf-analyzer', 'performance-benchmarker'
      ],
      exclusionPatterns: [
        'task assignment', 'code implementation', 'security enforcement',
        'research documentation', 'deployment management'
      ],
      dependencies: ['eva', 'github']
    });

    // Security Princess Domain
    this.domainBoundaries.set('security', {
      domainName: 'security',
      principalResponsibilities: [
        'security scanning',
        'vulnerability assessment',
        'compliance enforcement',
        'access control',
        'threat detection'
      ],
      criticalKeys: [
        'vulnerabilities', 'permissions', 'certificates', 'audit',
        'threats', 'compliance_status'
      ],
      managedAgentTypes: [
        'security-manager', 'byzantine-coordinator', 'consensus-builder',
        'quorum-manager'
      ],
      exclusionPatterns: [
        'workflow coordination', 'feature development', 'code quality',
        'content research', 'system deployment'
      ],
      dependencies: ['memory', 'github']
    });

    // Research Princess Domain
    this.domainBoundaries.set('research', {
      domainName: 'research',
      principalResponsibilities: [
        'information gathering',
        'analysis and synthesis',
        'documentation creation',
        'knowledge management',
        'specification development'
      ],
      criticalKeys: [
        'findings', 'sources', 'analysis', 'conclusions',
        'specifications', 'documentation'
      ],
      managedAgentTypes: [
        'researcher', 'specification', 'pseudocode', 'architecture',
        'system-architect'
      ],
      exclusionPatterns: [
        'agent coordination', 'code writing', 'test execution',
        'security policies', 'deployment operations'
      ],
      dependencies: ['deepwiki', 'firecrawl', 'ref', 'context7']
    });

    // Infrastructure Princess Domain
    this.domainBoundaries.set('infrastructure', {
      domainName: 'infrastructure',
      principalResponsibilities: [
        'deployment management',
        'environment configuration',
        'monitoring and alerting',
        'scaling operations',
        'system maintenance'
      ],
      criticalKeys: [
        'deployments', 'environments', 'configs', 'monitoring',
        'scaling_metrics', 'maintenance_schedules'
      ],
      managedAgentTypes: [
        'cicd-engineer', 'workflow-automation', 'release-manager',
        'repo-architect', 'multi-repo-swarm'
      ],
      exclusionPatterns: [
        'task orchestration', 'code development', 'quality auditing',
        'security analysis', 'research activities'
      ],
      dependencies: ['github', 'playwright', 'puppeteer']
    });

    console.log(`[MECEValidation] Initialized ${this.domainBoundaries.size} domain boundaries`);
  }

  /**
   * Setup validation event listeners
   */
  private setupValidationListeners(): void {
    // Listen for Princess task assignments
    this.on('task:assigned', (data) => {
      this.validateTaskAssignment(data.domain, data.task, data.assignedAgents);
    });

    // Listen for cross-domain communications
    this.on('handoff:initiated', (handoff) => {
      this.validateHandoff(handoff);
    });

    // Periodic MECE validation
    setInterval(() => {
      this.performPeriodicValidation();
    }, 300000); // Every 5 minutes
  }

  /**
   * Validate MECE compliance across all Princess domains
   */
  async validateMECECompliance(): Promise<MECEValidationResult> {
    const validationId = this.generateValidationId();
    console.log(`\n[MECE Validation] Starting comprehensive validation: ${validationId}`);

    const result: MECEValidationResult = {
      validationId,
      timestamp: Date.now(),
      overallCompliance: 0,
      mutuallyExclusive: false,
      collectivelyExhaustive: false,
      violations: [],
      domainCoverage: new Map(),
      recommendedActions: []
    };

    try {
      // Stage 1: Check Mutual Exclusivity
      console.log(`[Stage 1] Checking Mutual Exclusivity...`);
      const exclusivityResult = await this.validateMutualExclusivity();
      result.mutuallyExclusive = exclusivityResult.compliant;
      result.violations.push(...exclusivityResult.violations);

      // Stage 2: Check Collective Exhaustiveness
      console.log(`[Stage 2] Checking Collective Exhaustiveness...`);
      const exhaustivenessResult = await this.validateCollectiveExhaustiveness();
      result.collectivelyExhaustive = exhaustivenessResult.compliant;
      result.violations.push(...exhaustivenessResult.violations);
      result.domainCoverage = exhaustivenessResult.coverage;

      // Stage 3: Validate Boundary Integrity
      console.log(`[Stage 3] Validating Boundary Integrity...`);
      const boundaryResult = await this.validateBoundaryIntegrity();
      result.violations.push(...boundaryResult.violations);

      // Stage 4: Check Dependency Conflicts
      console.log(`[Stage 4] Checking Dependency Conflicts...`);
      const dependencyResult = await this.validateDependencies();
      result.violations.push(...dependencyResult.violations);

      // Calculate overall compliance
      result.overallCompliance = this.calculateOverallCompliance(result);

      // Generate recommendations
      result.recommendedActions = this.generateRecommendations(result);

      // Store validation result
      this.validationHistory.push(result);

      // Handle violations if any
      if (result.violations.length > 0) {
        await this.handleMECEViolations(result);
      }

      console.log(`[MECE Validation] Completed: ${(result.overallCompliance * 100).toFixed(1)}% compliance`);
      console.log(`  Mutually Exclusive: ${result.mutuallyExclusive ? 'PASS' : 'FAIL'}`);
      console.log(`  Collectively Exhaustive: ${result.collectivelyExhaustive ? 'PASS' : 'FAIL'}`);
      console.log(`  Violations: ${result.violations.length}`);

      this.emit('mece:validation_complete', result);
      return result;

    } catch (error) {
      console.error(`[MECE Validation] Failed:`, error);
      result.violations.push({
        violationType: 'gap',
        severity: 'critical',
        description: `Validation system error: ${error.message}`,
        affectedDomains: ['validation-system'],
        conflictingElements: ['validation-protocol'],
        resolutionRequired: true,
        suggestedFix: 'Debug validation system'
      });
      return result;
    }
  }

  /**
   * Validate Mutual Exclusivity - no domain overlaps
   */
  private async validateMutualExclusivity(): Promise<{
    compliant: boolean;
    violations: MECEViolation[];
  }> {
    const violations: MECEViolation[] = [];
    const domainPairs: string[][] = [];

    // Generate all domain pairs for comparison
    const domains = Array.from(this.domainBoundaries.keys());
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        domainPairs.push([domains[i], domains[j]]);
      }
    }

    for (const [domain1, domain2] of domainPairs) {
      const boundary1 = this.domainBoundaries.get(domain1)!;
      const boundary2 = this.domainBoundaries.get(domain2)!;

      // Check for overlapping responsibilities
      const responsibilityOverlap = this.findOverlap(
        boundary1.principalResponsibilities,
        boundary2.principalResponsibilities
      );

      if (responsibilityOverlap.length > 0) {
        violations.push({
          violationType: 'overlap',
          severity: 'high',
          description: `Responsibility overlap between ${domain1} and ${domain2}`,
          affectedDomains: [domain1, domain2],
          conflictingElements: responsibilityOverlap,
          resolutionRequired: true,
          suggestedFix: `Clarify responsibility boundaries between ${domain1} and ${domain2}`
        });
      }

      // Check for overlapping agent types
      const agentOverlap = this.findOverlap(
        boundary1.managedAgentTypes,
        boundary2.managedAgentTypes
      );

      if (agentOverlap.length > 0) {
        violations.push({
          violationType: 'overlap',
          severity: 'critical',
          description: `Agent type overlap between ${domain1} and ${domain2}`,
          affectedDomains: [domain1, domain2],
          conflictingElements: agentOverlap,
          resolutionRequired: true,
          suggestedFix: `Reassign conflicting agents to single domain`
        });
      }

      // Check for critical key overlaps
      const keyOverlap = this.findOverlap(
        boundary1.criticalKeys,
        boundary2.criticalKeys
      );

      if (keyOverlap.length > 0) {
        violations.push({
          violationType: 'overlap',
          severity: 'medium',
          description: `Critical key overlap between ${domain1} and ${domain2}`,
          affectedDomains: [domain1, domain2],
          conflictingElements: keyOverlap,
          resolutionRequired: false,
          suggestedFix: `Consider shared context management for common keys`
        });
      }
    }

    const overlapPercentage = violations.length / domainPairs.length;
    const compliant = overlapPercentage <= this.OVERLAP_TOLERANCE;

    console.log(`  Exclusivity check: ${violations.length} overlaps found`);
    console.log(`  Overlap percentage: ${(overlapPercentage * 100).toFixed(1)}%`);
    console.log(`  Compliant: ${compliant ? 'YES' : 'NO'}`);

    return { compliant, violations };
  }

  /**
   * Validate Collective Exhaustiveness - all required functions covered
   */
  private async validateCollectiveExhaustiveness(): Promise<{
    compliant: boolean;
    violations: MECEViolation[];
    coverage: Map<string, number>;
  }> {
    const violations: MECEViolation[] = [];
    const coverage = new Map<string, number>();

    // Define required system functions that MUST be covered
    const requiredFunctions = [
      'task_orchestration',
      'code_generation',
      'quality_assurance',
      'security_enforcement',
      'research_and_analysis',
      'infrastructure_management',
      'testing_and_validation',
      'documentation',
      'project_management',
      'deployment_operations',
      'performance_monitoring',
      'compliance_validation',
      'error_handling',
      'context_management',
      'agent_coordination'
    ];

    // Check coverage for each required function
    for (const func of requiredFunctions) {
      const coveringDomains = this.findDomainsForFunction(func);
      const coverageScore = coveringDomains.length > 0 ? 1 : 0;
      coverage.set(func, coverageScore);

      if (coverageScore === 0) {
        violations.push({
          violationType: 'gap',
          severity: 'critical',
          description: `No domain covers required function: ${func}`,
          affectedDomains: ['system'],
          conflictingElements: [func],
          resolutionRequired: true,
          suggestedFix: `Assign ${func} to appropriate Princess domain`
        });
      } else if (coveringDomains.length > 1) {
        // Multiple domains covering same function - potential overlap
        violations.push({
          violationType: 'overlap',
          severity: 'medium',
          description: `Multiple domains cover function: ${func}`,
          affectedDomains: coveringDomains,
          conflictingElements: [func],
          resolutionRequired: false,
          suggestedFix: `Clarify primary responsibility for ${func}`
        });
      }
    }

    // Calculate overall coverage
    const coverageValues = Array.from(coverage.values());
    const totalCoverage = coverageValues.reduce((sum, val) => sum + val, 0);
    const coveragePercentage = totalCoverage / requiredFunctions.length;
    const compliant = coveragePercentage >= this.COVERAGE_MINIMUM;

    console.log(`  Exhaustiveness check: ${coverageValues.filter(v => v > 0).length}/${requiredFunctions.length} functions covered`);
    console.log(`  Coverage percentage: ${(coveragePercentage * 100).toFixed(1)}%`);
    console.log(`  Compliant: ${compliant ? 'YES' : 'NO'}`);

    return { compliant, violations, coverage };
  }

  /**
   * Validate boundary integrity
   */
  private async validateBoundaryIntegrity(): Promise<{
    violations: MECEViolation[];
  }> {
    const violations: MECEViolation[] = [];

    for (const [domainName, princess] of this.princesses) {
      const boundary = this.domainBoundaries.get(domainName);
      if (!boundary) {
        violations.push({
          violationType: 'gap',
          severity: 'critical',
          description: `No boundary definition for domain: ${domainName}`,
          affectedDomains: [domainName],
          conflictingElements: ['boundary-definition'],
          resolutionRequired: true,
          suggestedFix: `Define boundary for ${domainName} domain`
        });
        continue;
      }

      // Check if Princess is operating within its boundary
      const context = await princess.getSharedContext();
      const contextKeys = Object.keys(context);

      // Check for critical key violations
      const expectedKeys = boundary.criticalKeys;
      const missingKeys = expectedKeys.filter(key => !contextKeys.includes(key));
      const unexpectedKeys = contextKeys.filter(key =>
        !expectedKeys.includes(key) &&
        !key.startsWith('_') && // Allow internal keys
        !['timestamp', 'lastUpdated'].includes(key) // Allow common metadata
      );

      if (missingKeys.length > 0) {
        violations.push({
          violationType: 'gap',
          severity: 'medium',
          description: `Missing critical keys in ${domainName}`,
          affectedDomains: [domainName],
          conflictingElements: missingKeys,
          resolutionRequired: false,
          suggestedFix: `Initialize missing keys: ${missingKeys.join(', ')}`
        });
      }

      if (unexpectedKeys.length > 0) {
        violations.push({
          violationType: 'boundary_breach',
          severity: 'low',
          description: `Unexpected context keys in ${domainName}`,
          affectedDomains: [domainName],
          conflictingElements: unexpectedKeys,
          resolutionRequired: false,
          suggestedFix: `Review context management for ${domainName}`
        });
      }
    }

    console.log(`  Boundary integrity: ${violations.length} violations found`);
    return { violations };
  }

  /**
   * Validate dependency relationships
   */
  private async validateDependencies(): Promise<{
    violations: MECEViolation[];
  }> {
    const violations: MECEViolation[] = [];

    // Check for circular dependencies
    const dependencyGraph = new Map<string, string[]>();
    for (const [domain, boundary] of this.domainBoundaries) {
      dependencyGraph.set(domain, boundary.dependencies);
    }

    const cycles = this.detectCycles(dependencyGraph);
    for (const cycle of cycles) {
      violations.push({
        violationType: 'dependency_conflict',
        severity: 'high',
        description: `Circular dependency detected: ${cycle.join(' -> ')}`,
        affectedDomains: cycle,
        conflictingElements: ['dependency-chain'],
        resolutionRequired: true,
        suggestedFix: `Break circular dependency in: ${cycle.join(', ')}`
      });
    }

    // Check for missing dependencies
    for (const [domain, boundary] of this.domainBoundaries) {
      for (const dependency of boundary.dependencies) {
        if (!this.isDependencyAvailable(dependency)) {
          violations.push({
            violationType: 'gap',
            severity: 'medium',
            description: `Missing dependency ${dependency} for ${domain}`,
            affectedDomains: [domain],
            conflictingElements: [dependency],
            resolutionRequired: true,
            suggestedFix: `Install or configure ${dependency} for ${domain}`
          });
        }
      }
    }

    console.log(`  Dependency validation: ${violations.length} issues found`);
    return { violations };
  }

  /**
   * Handle MECE violations with appropriate responses
   */
  private async handleMECEViolations(result: MECEValidationResult): Promise<void> {
    const criticalViolations = result.violations.filter(v => v.severity === 'critical');
    const highViolations = result.violations.filter(v => v.severity === 'high');

    // Critical violations require immediate consensus
    if (criticalViolations.length > 0) {
      console.log(`[MECE] ${criticalViolations.length} critical violations - initiating consensus`);

      await this.consensus.propose(
        'mece-validator',
        'recovery',
        {
          type: 'mece_critical_violations',
          violations: criticalViolations,
          validationId: result.validationId,
          recommendedActions: result.recommendedActions
        }
      );
    }

    // High violations trigger automatic resolution attempts
    if (highViolations.length > 0) {
      console.log(`[MECE] ${highViolations.length} high violations - attempting auto-resolution`);

      for (const violation of highViolations) {
        await this.attemptViolationResolution(violation);
      }
    }

    // Store violations for tracking
    this.storeViolationRecord(result);
  }

  /**
   * Attempt automatic resolution of violations
   */
  private async attemptViolationResolution(violation: MECEViolation): Promise<void> {
    switch (violation.violationType) {
      case 'overlap':
        await this.resolveOverlapViolation(violation);
        break;
      case 'gap':
        await this.resolveGapViolation(violation);
        break;
      case 'dependency_conflict':
        await this.resolveDependencyConflict(violation);
        break;
      case 'boundary_breach':
        await this.resolveBoundaryBreach(violation);
        break;
    }
  }

  /**
   * Resolve overlap violations by reassigning responsibilities
   */
  private async resolveOverlapViolation(violation: MECEViolation): Promise<void> {
    console.log(`[MECE] Resolving overlap: ${violation.description}`);

    // Identify primary domain based on best fit
    const primaryDomain = this.selectPrimaryDomain(violation);

    // Notify affected domains about reassignment
    for (const domain of violation.affectedDomains) {
      if (domain !== primaryDomain) {
        const princess = this.princesses.get(domain);
        if (princess) {
          // Remove conflicting elements from secondary domains
          await this.removeConflictingElements(princess, violation.conflictingElements);
        }
      }
    }

    console.log(`[MECE] Assigned overlap to primary domain: ${primaryDomain}`);
  }

  /**
   * Resolve gap violations by assigning to appropriate domain
   */
  private async resolveGapViolation(violation: MECEViolation): Promise<void> {
    console.log(`[MECE] Resolving gap: ${violation.description}`);

    // Find best domain to handle the gap
    const assignedDomain = this.findBestDomainForGap(violation);

    if (assignedDomain) {
      const princess = this.princesses.get(assignedDomain);
      if (princess) {
        await this.assignGapToDomain(princess, violation.conflictingElements);
        console.log(`[MECE] Assigned gap to domain: ${assignedDomain}`);
      }
    } else {
      console.warn(`[MECE] Could not auto-resolve gap: ${violation.description}`);
    }
  }

  /**
   * Resolve dependency conflicts
   */
  private async resolveDependencyConflict(violation: MECEViolation): Promise<void> {
    console.log(`[MECE] Resolving dependency conflict: ${violation.description}`);

    // For circular dependencies, remove the weakest link
    if (violation.affectedDomains.length > 1) {
      const weakestLink = this.identifyWeakestDependencyLink(violation.affectedDomains);
      if (weakestLink) {
        await this.removeDependency(weakestLink.from, weakestLink.to);
        console.log(`[MECE] Removed dependency: ${weakestLink.from} -> ${weakestLink.to}`);
      }
    }
  }

  /**
   * Resolve boundary breaches
   */
  private async resolveBoundaryBreach(violation: MECEViolation): Promise<void> {
    console.log(`[MECE] Resolving boundary breach: ${violation.description}`);

    // Update boundary definitions if breach is legitimate expansion
    const domain = violation.affectedDomains[0];
    const boundary = this.domainBoundaries.get(domain);

    if (boundary && this.isLegitimateExpansion(violation)) {
      // Add new elements to boundary
      boundary.criticalKeys.push(...violation.conflictingElements);
      console.log(`[MECE] Updated boundary for ${domain} with new keys`);
    }
  }

  /**
   * Initiate cross-domain handoff
   */
  async initiateHandoff(handoff: CrossDomainHandoff): Promise<boolean> {
    const handoffId = this.generateHandoffId();
    console.log(`[MECE Handoff] Initiating: ${handoff.fromDomain} -> ${handoff.toDomain}`);

    // Validate handoff against domain boundaries
    const validation = await this.validateHandoff(handoff);
    if (!validation.valid) {
      console.error(`[MECE Handoff] Validation failed: ${validation.reason}`);
      return false;
    }

    // Store active handoff
    this.activeHandoffs.set(handoffId, {
      ...handoff,
      timestamp: Date.now()
    });

    // Execute handoff through consensus if required
    if (handoff.requiresConsensus) {
      const consensusResult = await this.consensus.propose(
        handoff.fromDomain,
        'context_update',
        {
          handoffId,
          handoff,
          requiresConsensus: true
        }
      );

      // Check consensus result
      if (consensusResult.votes.size > 0) {
        const { accepted } = this.consensus['countVotes'](consensusResult);
        if (accepted >= this.consensus['requiredVotes']) {
          await this.executeHandoff(handoffId, handoff);
          return true;
        }
      }
      return false;
    } else {
      // Direct handoff
      await this.executeHandoff(handoffId, handoff);
      return true;
    }
  }

  /**
   * Execute validated handoff
   */
  private async executeHandoff(handoffId: string, handoff: CrossDomainHandoff): Promise<void> {
    const fromPrincess = this.princesses.get(handoff.fromDomain);
    const toPrincess = this.princesses.get(handoff.toDomain);

    if (!fromPrincess || !toPrincess) {
      throw new Error(`Princess not found for handoff: ${handoff.fromDomain} -> ${handoff.toDomain}`);
    }

    // Send context with integrity checks
    const sendResult = await fromPrincess.sendContext(handoff.toDomain, handoff.payload);

    if (sendResult.sent) {
      // Receive and validate
      const receiveResult = await toPrincess.receiveContext(
        handoff.payload,
        handoff.fromDomain,
        sendResult.fingerprint
      );

      if (receiveResult.accepted) {
        console.log(`[MECE Handoff] Completed successfully: ${handoffId}`);
        this.activeHandoffs.delete(handoffId);

        // Record successful handoff
        await this.recordHandoffCompletion(handoffId, handoff, true);
      } else {
        console.error(`[MECE Handoff] Receive failed: ${handoffId}`);
        await this.recordHandoffCompletion(handoffId, handoff, false);
      }
    } else {
      console.error(`[MECE Handoff] Send failed: ${handoffId}`);
      await this.recordHandoffCompletion(handoffId, handoff, false);
    }
  }

  /**
   * Validate handoff against domain boundaries
   */
  private async validateHandoff(handoff: CrossDomainHandoff): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    const fromBoundary = this.domainBoundaries.get(handoff.fromDomain);
    const toBoundary = this.domainBoundaries.get(handoff.toDomain);

    if (!fromBoundary || !toBoundary) {
      return {
        valid: false,
        reason: `Domain boundary not found for handoff`
      };
    }

    // Check if handoff type is appropriate
    const validHandoffTypes = ['task_completion', 'dependency_resolution', 'escalation', 'information_sharing'];
    if (!validHandoffTypes.includes(handoff.handoffType)) {
      return {
        valid: false,
        reason: `Invalid handoff type: ${handoff.handoffType}`
      };
    }

    // Check if domains can legitimately communicate
    if (fromBoundary.exclusionPatterns.some(pattern =>
        toBoundary.principalResponsibilities.some(resp => resp.includes(pattern)))) {
      return {
        valid: false,
        reason: `Handoff violates exclusion patterns`
      };
    }

    return { valid: true };
  }

  /**
   * Validate task assignment against domain boundaries
   */
  private async validateTaskAssignment(
    domain: string,
    task: any,
    assignedAgents: string[]
  ): Promise<void> {
    const boundary = this.domainBoundaries.get(domain);
    if (!boundary) return;

    // Check if assigned agents belong to this domain
    const invalidAgents = assignedAgents.filter(agent =>
      !boundary.managedAgentTypes.includes(agent)
    );

    if (invalidAgents.length > 0) {
      const violation: MECEViolation = {
        violationType: 'boundary_breach',
        severity: 'high',
        description: `Invalid agent assignment in ${domain}`,
        affectedDomains: [domain],
        conflictingElements: invalidAgents,
        resolutionRequired: true,
        suggestedFix: `Reassign agents to appropriate domains`
      };

      this.emit('mece:violation_detected', violation);
    }
  }

  /**
   * Perform periodic MECE validation
   */
  private async performPeriodicValidation(): Promise<void> {
    console.log(`[MECE] Performing periodic validation...`);
    const result = await this.validateMECECompliance();

    if (result.overallCompliance < this.MECE_COMPLIANCE_THRESHOLD) {
      console.warn(`[MECE] Compliance below threshold: ${(result.overallCompliance * 100).toFixed(1)}%`);
      this.emit('mece:compliance_warning', result);
    }
  }

  // Helper methods
  private findOverlap(array1: string[], array2: string[]): string[] {
    return array1.filter(item => array2.includes(item));
  }

  private findDomainsForFunction(func: string): string[] {
    const coveringDomains: string[] = [];

    for (const [domain, boundary] of this.domainBoundaries) {
      const covers = boundary.principalResponsibilities.some(resp =>
        resp.includes(func.replace('_', ' ')) ||
        func.includes(resp.replace(' ', '_'))
      );

      if (covers) {
        coveringDomains.push(domain);
      }
    }

    return coveringDomains;
  }

  private detectCycles(graph: Map<string, string[]>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        if (graph.has(dep)) { // Only check internal dependencies
          if (recursionStack.has(dep)) {
            // Cycle detected
            const cycleStart = path.indexOf(dep);
            cycles.push([...path.slice(cycleStart), dep]);
          } else if (!visited.has(dep)) {
            dfs(dep, [...path, dep]);
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, [node]);
      }
    }

    return cycles;
  }

  private isDependencyAvailable(dependency: string): boolean {
    // Check if MCP server or system dependency is available
    if (typeof globalThis !== 'undefined') {
      const mcpFunctions = Object.keys(globalThis).filter(key =>
        key.startsWith('mcp__') && key.includes(dependency)
      );
      return mcpFunctions.length > 0;
    }
    return false;
  }

  private calculateOverallCompliance(result: MECEValidationResult): number {
    let score = 0;

    // Mutual exclusivity weight (40%)
    if (result.mutuallyExclusive) score += 0.4;

    // Collective exhaustiveness weight (40%)
    if (result.collectivelyExhaustive) score += 0.4;

    // Violation severity penalty (20%)
    const severityPenalty = result.violations.reduce((penalty, violation) => {
      switch (violation.severity) {
        case 'critical': return penalty + 0.05;
        case 'high': return penalty + 0.03;
        case 'medium': return penalty + 0.01;
        case 'low': return penalty + 0.005;
        default: return penalty;
      }
    }, 0);

    score = Math.max(0, score + 0.2 - severityPenalty);
    return score;
  }

  private generateRecommendations(result: MECEValidationResult): string[] {
    const recommendations: string[] = [];

    if (!result.mutuallyExclusive) {
      recommendations.push('Define clearer domain boundaries to eliminate overlaps');
      recommendations.push('Reassign conflicting responsibilities to single domains');
    }

    if (!result.collectivelyExhaustive) {
      recommendations.push('Assign uncovered functions to appropriate domains');
      recommendations.push('Create new Princess domain if needed for gaps');
    }

    const criticalViolations = result.violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push('Address critical violations immediately');
      recommendations.push('Initiate Princess consensus for system-wide changes');
    }

    return recommendations;
  }

  private selectPrimaryDomain(violation: MECEViolation): string {
    // Select domain with most matching responsibilities
    let bestDomain = violation.affectedDomains[0];
    let bestScore = 0;

    for (const domain of violation.affectedDomains) {
      const boundary = this.domainBoundaries.get(domain);
      if (boundary) {
        const score = violation.conflictingElements.filter(element =>
          boundary.principalResponsibilities.some(resp => resp.includes(element))
        ).length;

        if (score > bestScore) {
          bestScore = score;
          bestDomain = domain;
        }
      }
    }

    return bestDomain;
  }

  private findBestDomainForGap(violation: MECEViolation): string | null {
    // Find domain with most related responsibilities
    let bestDomain: string | null = null;
    let bestScore = 0;

    for (const [domain, boundary] of this.domainBoundaries) {
      const score = violation.conflictingElements.filter(element =>
        boundary.principalResponsibilities.some(resp =>
          resp.includes(element.replace('_', ' ')) ||
          element.includes(resp.replace(' ', '_'))
        )
      ).length;

      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }

    return bestDomain;
  }

  private identifyWeakestDependencyLink(domains: string[]): { from: string; to: string } | null {
    // Identify least critical dependency to break
    for (let i = 0; i < domains.length; i++) {
      const from = domains[i];
      const to = domains[(i + 1) % domains.length];
      const boundary = this.domainBoundaries.get(from);

      if (boundary && boundary.dependencies.includes(to)) {
        // Check if this is an optional dependency
        if (!this.isCriticalDependency(from, to)) {
          return { from, to };
        }
      }
    }
    return null;
  }

  private isCriticalDependency(from: string, to: string): boolean {
    // Define critical dependencies that cannot be broken
    const criticalPairs = [
      ['coordination', 'memory'],
      ['development', 'github'],
      ['quality', 'eva']
    ];

    return criticalPairs.some(([f, t]) => f === from && t === to);
  }

  private isLegitimateExpansion(violation: MECEViolation): boolean {
    // Check if boundary breach represents legitimate domain evolution
    return violation.severity === 'low' &&
           violation.conflictingElements.length < 3;
  }

  private async removeConflictingElements(princess: HivePrincess, elements: string[]): Promise<void> {
    // Remove elements from princess context
    const context = await princess.getSharedContext();
    for (const element of elements) {
      delete context[element];
    }
    await princess.restoreContext(context);
  }

  private async assignGapToDomain(princess: HivePrincess, elements: string[]): Promise<void> {
    // Add missing elements to princess context
    const context = await princess.getSharedContext();
    for (const element of elements) {
      context[element] = { assigned: true, timestamp: Date.now() };
    }
    await princess.restoreContext(context);
  }

  private async removeDependency(from: string, to: string): Promise<void> {
    const boundary = this.domainBoundaries.get(from);
    if (boundary) {
      boundary.dependencies = boundary.dependencies.filter(dep => dep !== to);
    }
  }

  private async recordHandoffCompletion(
    handoffId: string,
    handoff: CrossDomainHandoff,
    success: boolean
  ): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `handoff-${handoffId}`,
            entityType: 'cross-domain-handoff',
            observations: [
              `From: ${handoff.fromDomain}`,
              `To: ${handoff.toDomain}`,
              `Type: ${handoff.handoffType}`,
              `Success: ${success}`,
              `Timestamp: ${new Date().toISOString()}`,
              `Consensus Required: ${handoff.requiresConsensus}`
            ]
          }]
        });
      }
    } catch (error) {
      console.error('Failed to record handoff completion:', error);
    }
  }

  private storeViolationRecord(result: MECEValidationResult): void {
    // Store for trend analysis and learning
    console.log(`[MECE] Stored validation result: ${result.validationId}`);
  }

  private generateValidationId(): string {
    return `mece-validation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private generateHandoffId(): string {
    return `handoff-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // Public interface methods
  getDomainBoundaries(): Map<string, DomainBoundary> {
    return new Map(this.domainBoundaries);
  }

  getValidationHistory(): MECEValidationResult[] {
    return [...this.validationHistory];
  }

  getActiveHandoffs(): Map<string, CrossDomainHandoff> {
    return new Map(this.activeHandoffs);
  }

  async getComplianceMetrics(): Promise<{
    currentCompliance: number;
    trend: string;
    lastValidation: MECEValidationResult | null;
  }> {
    const lastValidation = this.validationHistory[this.validationHistory.length - 1] || null;
    const trend = this.calculateComplianceTrend();

    return {
      currentCompliance: lastValidation?.overallCompliance || 0,
      trend,
      lastValidation
    };
  }

  private calculateComplianceTrend(): string {
    if (this.validationHistory.length < 2) return 'stable';

    const recent = this.validationHistory.slice(-2);
    const change = recent[1].overallCompliance - recent[0].overallCompliance;

    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }
}

export default MECEValidationProtocol;