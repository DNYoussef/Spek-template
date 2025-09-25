/**
 * Princess Audit Gate System
 *
 * Mandatory audit framework that ALL subagent work must pass through.
 * Enforces theater detection, sandbox validation, and iterative debugging
 * until code is 100% functional with zero fakery.
 */

import { EventEmitter } from 'events';
import { CodexTheaterAuditor, TheaterDetection } from './CodexTheaterAuditor';
import { CodexSandboxValidator, SandboxTestResult } from './CodexSandboxValidator';
import { DebugCycleController, DebugIteration } from './DebugCycleController';
import { GitHubCompletionRecorder } from './GitHubCompletionRecorder';
import { ContextDNA, ContextFingerprint } from '../../context/ContextDNA';
import { EnterpriseQualityAnalyzer, QualityAnalysisReport } from './EnterpriseQualityAnalyzer';
import { CodexQualityEnhancer, QualityEnhancementResult } from './CodexQualityEnhancer';
import { FinalQualityValidator, FinalValidationResult } from './FinalQualityValidator';

export interface SubagentWork {
  subagentId: string;
  subagentType: string;
  taskId: string;
  taskDescription: string;
  claimedCompletion: boolean;
  files: string[];
  changes: string[];
  metadata: {
    startTime: number;
    endTime: number;
    model: string;
    platform: string;
  };
  context: any;
}

export interface AuditResult {
  auditId: string;
  subagentId: string;
  taskId: string;
  timestamp: number;

  // Theater Detection Results
  theaterDetected: boolean;
  theaterDetails?: TheaterDetection[];
  theaterScore: number; // 0-100, 0 = no theater

  // Sandbox Validation Results
  sandboxValidation: SandboxTestResult;
  sandboxPassed: boolean;

  // Debug Cycle Results
  debugIterations: DebugIteration[];
  debugCycleCount: number;
  finalDebugStatus: 'resolved' | 'unresolved' | 'escalated';

  // Final Decision
  finalStatus: 'approved' | 'rejected' | 'needs_rework';
  rejectionReasons?: string[];
  reworkInstructions?: string[];

  // GitHub Integration
  githubIssueId?: string;
  githubProjectUpdate?: boolean;

  // Evidence & Trail
  auditEvidence: {
    screenshots?: string[];
    logs?: string[];
    metrics?: any;
    contextDNA?: ContextFingerprint;
  };
}

export interface AuditConfiguration {
  maxDebugIterations: number;
  theaterThreshold: number; // Max acceptable theater percentage
  sandboxTimeout: number; // Milliseconds
  requireGitHubUpdate: boolean;
  strictMode: boolean; // If true, ANY theater = rejection
}

export class PrincessAuditGate extends EventEmitter {
  private theaterAuditor: CodexTheaterAuditor;
  private sandboxValidator: CodexSandboxValidator;
  private debugController: DebugCycleController;
  private githubRecorder: GitHubCompletionRecorder;
  private qualityAnalyzer: EnterpriseQualityAnalyzer;
  private qualityEnhancer: CodexQualityEnhancer;
  private finalValidator: FinalQualityValidator;
  private auditHistory: Map<string, AuditResult[]> = new Map();
  private config: AuditConfiguration;
  private contextDNA: ContextDNA;

  constructor(
    private readonly princessDomain: string,
    config?: Partial<AuditConfiguration>
  ) {
    super();

    // Initialize configuration with defaults
    this.config = {
      maxDebugIterations: 5,
      theaterThreshold: 0, // ZERO tolerance for theater
      sandboxTimeout: 60000, // 1 minute default
      requireGitHubUpdate: true,
      strictMode: true, // Always strict by default
      ...config
    };

    // Initialize audit components
    this.theaterAuditor = new CodexTheaterAuditor();
    this.sandboxValidator = new CodexSandboxValidator();
    this.debugController = new DebugCycleController(this.config.maxDebugIterations);
    this.githubRecorder = new GitHubCompletionRecorder();
    this.qualityAnalyzer = new EnterpriseQualityAnalyzer();
    this.qualityEnhancer = new CodexQualityEnhancer();
    this.finalValidator = new FinalQualityValidator();
    this.contextDNA = new ContextDNA();

    this.initializeAuditSystem();
  }

  /**
   * Initialize the audit system and verify all components
   */
  private initializeAuditSystem(): void {
    console.log(`[PrincessAuditGate] Initializing for ${this.princessDomain} domain`);
    console.log(`[PrincessAuditGate] Configuration:`, this.config);

    // Set up event listeners
    this.theaterAuditor.on('theater:detected', (detection) => {
      this.emit('audit:theater_found', detection);
    });

    this.sandboxValidator.on('validation:failed', (failure) => {
      this.emit('audit:sandbox_failure', failure);
    });

    this.debugController.on('debug:iteration', (iteration) => {
      this.emit('audit:debug_iteration', iteration);
    });
  }

  /**
   * MAIN AUDIT METHOD - All subagent work MUST pass through this
   */
  async auditSubagentWork(work: SubagentWork): Promise<AuditResult> {
    const auditId = this.generateAuditId();

    console.log(`\n========================================`);
    console.log(`PRINCESS AUDIT GATE - ${this.princessDomain.toUpperCase()}`);
    console.log(`========================================`);
    console.log(`Audit ID: ${auditId}`);
    console.log(`Subagent: ${work.subagentType} (${work.subagentId})`);
    console.log(`Task: ${work.taskId}`);
    console.log(`Files to audit: ${work.files.length}`);
    console.log(`Claimed completion: ${work.claimedCompletion}`);
    console.log(`========================================\n`);

    const auditResult: AuditResult = {
      auditId,
      subagentId: work.subagentId,
      taskId: work.taskId,
      timestamp: Date.now(),
      theaterDetected: false,
      theaterScore: 0,
      sandboxValidation: null!,
      sandboxPassed: false,
      debugIterations: [],
      debugCycleCount: 0,
      finalDebugStatus: 'unresolved',
      finalStatus: 'rejected', // Default to rejected until proven worthy
      auditEvidence: {}
    };

    try {
      // STAGE 1: Theater Detection
      console.log(`[STAGE 1] THEATER DETECTION`);
      const theaterResult = await this.performTheaterDetection(work, auditResult);

      if (theaterResult.theaterDetected && this.config.strictMode) {
        return this.rejectWithTheater(work, auditResult);
      }

      // STAGE 2: Sandbox Validation
      console.log(`\n[STAGE 2] SANDBOX VALIDATION`);
      const sandboxResult = await this.performSandboxValidation(work, auditResult);

      if (!sandboxResult.allTestsPassed) {
        // Enter debug cycle
        console.log(`\n[STAGE 3] DEBUG CYCLE - Tests failed, entering iterative debug`);
        const debugResult = await this.performDebugCycle(work, auditResult, sandboxResult);

        if (debugResult.status !== 'resolved') {
          return this.rejectWithDebugFailure(work, auditResult);
        }
      }

      // STAGE 4: Final Validation
      console.log(`\n[STAGE 4] FINAL VALIDATION`);
      const finalValidation = await this.performFinalValidation(work, auditResult);

      if (!finalValidation.passed) {
        return this.rejectWithValidationFailure(work, auditResult, finalValidation);
      }

      // STAGE 6: Enterprise Quality Analysis
      console.log(`\n[STAGE 6] ENTERPRISE QUALITY ANALYSIS`);
      console.log(`  Analyzing for connascence, god objects, safety, Lean Six Sigma, defense standards...`);
      const qualityReport = await this.qualityAnalyzer.analyzeCode(work.files);

      console.log(`  Analysis complete:`);
      console.log(`    - Connascence violations: ${qualityReport.connascence?.totalViolations || 0}`);
      console.log(`    - God objects found: ${qualityReport.godObjects?.length || 0}`);
      console.log(`    - NASA compliance: ${qualityReport.nasaCompliance?.overallCompliance || 0}%`);
      console.log(`    - Defense standards: ${qualityReport.defenseStandards?.overallScore || 0}%`);
      console.log(`    - Lean Six Sigma: ${qualityReport.leanSixSigma?.sigmaLevel || 0}`);

      // STAGE 7: NASA-Compliant Quality Enhancement
      console.log(`\n[STAGE 7] NASA-COMPLIANT QUALITY ENHANCEMENT`);
      console.log(`  Feeding analysis reports to Codex with NASA 10 rules...`);
      const enhancementResult = await this.qualityEnhancer.enhanceCodeQuality(
        work.files,
        qualityReport,
        work.context
      );

      console.log(`  Enhancement complete:`);
      console.log(`    - Files enhanced: ${enhancementResult.enhancedFiles.length}`);
      console.log(`    - Fixes applied: ${enhancementResult.fixesApplied}`);
      console.log(`    - NASA rules applied: ${enhancementResult.nasaRulesApplied}`);

      // Update work files with enhanced versions
      work.files = enhancementResult.enhancedFiles;

      // STAGE 8: Ultimate Validation Loop
      console.log(`\n[STAGE 8] ULTIMATE VALIDATION - 100% COMPLETE, 100% WORKING, 100% HIGHEST QUALITY`);
      const ultimateValidation = await this.finalValidator.validateUltimate(
        work.files,
        work.context,
        enhancementResult
      );

      if (!ultimateValidation.passed) {
        console.log(`\n[FAILURE] Code did not reach 100% perfection after ${ultimateValidation.iterations} iterations`);
        return this.rejectWithQualityFailure(work, auditResult, ultimateValidation);
      }

      // Update work files with final validated versions
      work.files = ultimateValidation.enhancedFiles;

      // SUCCESS - Record completion
      console.log(`\n[STAGE 9] RECORDING COMPLETION - CODE IS PERFECT!`);
      await this.recordSuccessfulCompletion(work, auditResult);

      auditResult.finalStatus = 'approved';
      this.storeAuditResult(auditResult);

      console.log(`\n========================================`);
      console.log(`AUDIT RESULT: APPROVED - 100% PERFECT CODE`);
      console.log(`  Completeness: ${ultimateValidation.metrics.completeness}%`);
      console.log(`  Functionality: ${ultimateValidation.metrics.functionality}%`);
      console.log(`  Quality: ${ultimateValidation.metrics.quality}%`);
      console.log(`  NASA Compliance: ${ultimateValidation.metrics.nasaCompliance}%`);
      console.log(`  Defense Compliance: ${ultimateValidation.metrics.defenseCompliance}%`);
      console.log(`========================================\n`);

      return auditResult;

    } catch (error) {
      console.error(`Audit failed with error:`, error);
      auditResult.finalStatus = 'rejected';
      auditResult.rejectionReasons = [`Audit system error: ${error.message}`];
      this.storeAuditResult(auditResult);
      return auditResult;
    }
  }

  /**
   * Stage 1: Comprehensive Theater Detection
   */
  private async performTheaterDetection(
    work: SubagentWork,
    auditResult: AuditResult
  ): Promise<{ theaterDetected: boolean; theaterScore: number }> {
    const detections: TheaterDetection[] = [];
    let totalTheaterScore = 0;
    let fileCount = 0;

    for (const file of work.files) {
      console.log(`  Checking ${file} for theater...`);

      // Use CodexTheaterAuditor for deep inspection
      const detection = await this.theaterAuditor.auditFile(file, work.context);
      detections.push(detection);

      if (detection.theaterFound) {
        console.log(`    THEATER DETECTED: ${detection.theaterPercentage.toFixed(1)}%`);
        console.log(`    Type: ${detection.theaterType}`);
        console.log(`    Issues: ${detection.issues.length}`);

        for (const issue of detection.issues) {
          console.log(`      - Line ${issue.line}: ${issue.description}`);
        }
      } else {
        console.log(`    Clean - Real functionality: ${detection.realFunctionality.toFixed(1)}%`);
      }

      totalTheaterScore += detection.theaterPercentage;
      fileCount++;
    }

    const averageTheaterScore = fileCount > 0 ? totalTheaterScore / fileCount : 0;
    const theaterDetected = averageTheaterScore > this.config.theaterThreshold;

    auditResult.theaterDetected = theaterDetected;
    auditResult.theaterDetails = detections;
    auditResult.theaterScore = averageTheaterScore;

    console.log(`\n  Overall Theater Score: ${averageTheaterScore.toFixed(1)}%`);
    console.log(`  Threshold: ${this.config.theaterThreshold}%`);
    console.log(`  Result: ${theaterDetected ? 'FAILED - Theater detected' : 'PASSED - No theater'}`);

    return { theaterDetected, theaterScore: averageTheaterScore };
  }

  /**
   * Stage 2: Sandbox Validation with Codex
   */
  private async performSandboxValidation(
    work: SubagentWork,
    auditResult: AuditResult
  ): Promise<SandboxTestResult> {
    console.log(`  Creating sandbox environment...`);

    const sandboxConfig = {
      timeout: this.config.sandboxTimeout,
      model: 'gpt-5-codex',
      autoFix: false, // Don't auto-fix yet, just validate
      strictMode: this.config.strictMode
    };

    const sandboxResult = await this.sandboxValidator.validateInSandbox(
      work.files,
      work.context,
      sandboxConfig
    );

    auditResult.sandboxValidation = sandboxResult;
    auditResult.sandboxPassed = sandboxResult.allTestsPassed;

    console.log(`  Compilation: ${sandboxResult.compiled ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Tests Run: ${sandboxResult.testsRun}`);
    console.log(`  Tests Passed: ${sandboxResult.testsPassed}`);
    console.log(`  Tests Failed: ${sandboxResult.testsFailed}`);

    if (sandboxResult.runtimeErrors.length > 0) {
      console.log(`  Runtime Errors:`);
      for (const error of sandboxResult.runtimeErrors) {
        console.log(`    - ${error}`);
      }
    }

    console.log(`  Result: ${sandboxResult.allTestsPassed ? 'PASSED' : 'FAILED'}`);

    return sandboxResult;
  }

  /**
   * Stage 3: Iterative Debug Cycle with Codex
   */
  private async performDebugCycle(
    work: SubagentWork,
    auditResult: AuditResult,
    sandboxResult: SandboxTestResult
  ): Promise<{ status: 'resolved' | 'unresolved' | 'escalated' }> {
    console.log(`  Starting debug cycle (max ${this.config.maxDebugIterations} iterations)`);

    const debugResult = await this.debugController.runDebugCycle(
      work.files,
      sandboxResult,
      work.context,
      {
        subagentId: work.subagentId,
        taskId: work.taskId,
        model: 'gpt-5-codex'
      }
    );

    auditResult.debugIterations = debugResult.iterations;
    auditResult.debugCycleCount = debugResult.iterations.length;
    auditResult.finalDebugStatus = debugResult.finalStatus;

    console.log(`  Debug iterations: ${debugResult.iterations.length}`);
    console.log(`  Final status: ${debugResult.finalStatus}`);

    if (debugResult.finalStatus === 'resolved') {
      console.log(`  All issues resolved successfully!`);
    } else if (debugResult.finalStatus === 'escalated') {
      console.log(`  Escalating to Queen - too many iterations`);
    } else {
      console.log(`  Failed to resolve all issues`);
    }

    return { status: debugResult.finalStatus };
  }

  /**
   * Stage 4: Final Validation
   */
  private async performFinalValidation(
    work: SubagentWork,
    auditResult: AuditResult
  ): Promise<{ passed: boolean; issues?: string[] }> {
    const issues: string[] = [];

    console.log(`  Running final validation checks...`);

    // Re-run theater detection after any fixes
    const finalTheaterCheck = await this.performTheaterDetection(work, auditResult);
    if (finalTheaterCheck.theaterDetected) {
      issues.push(`Theater still present after debug: ${finalTheaterCheck.theaterScore.toFixed(1)}%`);
    }

    // Re-run sandbox validation
    const finalSandboxCheck = await this.performSandboxValidation(work, auditResult);
    if (!finalSandboxCheck.allTestsPassed) {
      issues.push(`Sandbox tests still failing: ${finalSandboxCheck.testsFailed} failures`);
    }

    // Check performance metrics
    if (finalSandboxCheck.performanceMetrics) {
      const perf = finalSandboxCheck.performanceMetrics;
      if (perf.executionTime > 5000) {
        issues.push(`Performance issue: execution time ${perf.executionTime}ms > 5000ms`);
      }
      if (perf.memoryUsage > 100) {
        issues.push(`Memory issue: ${perf.memoryUsage}MB > 100MB`);
      }
    }

    // Generate context DNA for integrity
    const contextFingerprint = ContextDNA.generateFingerprint(
      work.context,
      work.subagentId,
      this.princessDomain
    );
    auditResult.auditEvidence.contextDNA = contextFingerprint;

    // Check for degradation
    if (contextFingerprint.degradationScore > 0.15) {
      issues.push(`Context degradation detected: ${(contextFingerprint.degradationScore * 100).toFixed(1)}%`);
    }

    const passed = issues.length === 0;

    console.log(`  Final validation: ${passed ? 'PASSED' : 'FAILED'}`);
    if (!passed) {
      console.log(`  Issues found:`);
      for (const issue of issues) {
        console.log(`    - ${issue}`);
      }
    }

    return { passed, issues };
  }

  /**
   * Reject work due to theater detection
   */
  private async rejectWithTheater(
    work: SubagentWork,
    auditResult: AuditResult
  ): Promise<AuditResult> {
    console.log(`\n[REJECTION] THEATER DETECTED - SENDING BACK TO SUBAGENT`);

    auditResult.finalStatus = 'needs_rework';
    auditResult.rejectionReasons = [
      `Theater detection failed: ${auditResult.theaterScore.toFixed(1)}% theater found`,
      `Threshold: ${this.config.theaterThreshold}% (strict mode: ${this.config.strictMode})`
    ];

    // Generate detailed rework instructions
    auditResult.reworkInstructions = [];

    if (auditResult.theaterDetails) {
      for (const detection of auditResult.theaterDetails) {
        if (detection.theaterFound) {
          auditResult.reworkInstructions.push(
            `File: ${detection.fileAudited}`,
            `  Theater Type: ${detection.theaterType}`,
            `  Issues to fix:`
          );

          for (const issue of detection.issues) {
            auditResult.reworkInstructions.push(
              `    Line ${issue.line}: ${issue.description}`,
              `      Fix: ${issue.suggestedFix}`
            );
          }
        }
      }
    }

    // Send back to subagent
    await this.sendBackToSubagent(work, auditResult);

    this.storeAuditResult(auditResult);
    return auditResult;
  }

  /**
   * Reject work due to debug failure
   */
  private async rejectWithDebugFailure(
    work: SubagentWork,
    auditResult: AuditResult
  ): Promise<AuditResult> {
    console.log(`\n[REJECTION] DEBUG CYCLE FAILED - SENDING BACK TO SUBAGENT`);

    auditResult.finalStatus = 'needs_rework';
    auditResult.rejectionReasons = [
      `Debug cycle failed after ${auditResult.debugCycleCount} iterations`,
      `Final status: ${auditResult.finalDebugStatus}`
    ];

    // Compile debug history into rework instructions
    auditResult.reworkInstructions = [
      'The following issues could not be automatically resolved:'
    ];

    const lastIteration = auditResult.debugIterations[auditResult.debugIterations.length - 1];
    if (lastIteration && lastIteration.remainingErrors) {
      for (const error of lastIteration.remainingErrors) {
        auditResult.reworkInstructions.push(`- ${error}`);
      }
    }

    // Send back to subagent
    await this.sendBackToSubagent(work, auditResult);

    this.storeAuditResult(auditResult);
    return auditResult;
  }

  /**
   * Reject work due to final validation failure
   */
  private async rejectWithValidationFailure(
    work: SubagentWork,
    auditResult: AuditResult,
    validation: { passed: boolean; issues?: string[] }
  ): Promise<AuditResult> {
    console.log(`\n[REJECTION] FINAL VALIDATION FAILED - SENDING BACK TO SUBAGENT`);

    auditResult.finalStatus = 'needs_rework';
    auditResult.rejectionReasons = [
      'Final validation failed',
      ...(validation.issues || [])
    ];

    auditResult.reworkInstructions = [
      'Fix the following validation issues:',
      ...(validation.issues || [])
    ];

    // Send back to subagent
    await this.sendBackToSubagent(work, auditResult);

    this.storeAuditResult(auditResult);
    return auditResult;
  }

  /**
   * Reject work due to quality standards failure
   */
  private async rejectWithQualityFailure(
    work: SubagentWork,
    auditResult: AuditResult,
    validation: FinalValidationResult
  ): Promise<AuditResult> {
    console.log(`\n[REJECTION] QUALITY STANDARDS NOT MET - SENDING BACK TO SUBAGENT`);

    auditResult.finalStatus = 'needs_rework';
    auditResult.rejectionReasons = [
      `Quality standards not met after ${validation.iterations} enhancement iterations`,
      `Completeness: ${validation.metrics.completeness.toFixed(1)}% (REQUIRED: 100%)`,
      `Functionality: ${validation.metrics.functionality.toFixed(1)}% (REQUIRED: 100%)`,
      `Quality: ${validation.metrics.quality.toFixed(1)}% (REQUIRED: 100%)`,
      `NASA Compliance: ${validation.metrics.nasaCompliance.toFixed(1)}% (REQUIRED: 100%)`,
      `Defense Compliance: ${validation.metrics.defenseCompliance.toFixed(1)}% (REQUIRED: 100%)`
    ];

    // Generate specific rework instructions based on deficiencies
    auditResult.reworkInstructions = [
      'The following quality standards MUST be met:',
      '1. 100% Complete - No mocks, stubs, or TODOs',
      '2. 100% Working - All tests passing, no runtime errors',
      '3. 100% Highest Quality - Following all enterprise standards',
      '',
      'Specific deficiencies to address:'
    ];

    if (validation.metrics.completeness < 100) {
      auditResult.reworkInstructions.push(
        `- Completeness issues: Implement all missing functionality`,
        `  Current: ${validation.metrics.completeness.toFixed(1)}%`
      );
    }

    if (validation.metrics.functionality < 100) {
      auditResult.reworkInstructions.push(
        `- Functionality issues: Fix all test failures and runtime errors`,
        `  Current: ${validation.metrics.functionality.toFixed(1)}%`
      );
    }

    if (validation.metrics.quality < 100) {
      auditResult.reworkInstructions.push(
        `- Quality issues: Address all code quality violations`,
        `  Current: ${validation.metrics.quality.toFixed(1)}%`
      );
    }

    if (validation.metrics.nasaCompliance < 100) {
      auditResult.reworkInstructions.push(
        `- NASA compliance: Implement all Power of Ten rules`,
        `  Current: ${validation.metrics.nasaCompliance.toFixed(1)}%`
      );
    }

    if (validation.metrics.defenseCompliance < 100) {
      auditResult.reworkInstructions.push(
        `- Defense standards: Meet all DFARS/MIL-STD requirements`,
        `  Current: ${validation.metrics.defenseCompliance.toFixed(1)}%`
      );
    }

    // Send back to subagent
    await this.sendBackToSubagent(work, auditResult);

    this.storeAuditResult(auditResult);
    return auditResult;
  }

  /**
   * Send work back to subagent with failure notes
   */
  private async sendBackToSubagent(
    work: SubagentWork,
    auditResult: AuditResult
  ): Promise<void> {
    console.log(`  Sending work back to ${work.subagentType} (${work.subagentId})`);
    console.log(`  Failure reasons: ${auditResult.rejectionReasons?.length || 0}`);
    console.log(`  Rework instructions: ${auditResult.reworkInstructions?.length || 0} items`);

    // Emit event for subagent notification
    this.emit('audit:work_rejected', {
      subagentId: work.subagentId,
      taskId: work.taskId,
      auditResult
    });

    // In real implementation, send via MCP or messaging system
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__claude_flow__task_orchestrate) {
        await (globalThis as any).mcp__claude_flow__task_orchestrate({
          task: `Rework required for task ${work.taskId}`,
          target: work.subagentId,
          priority: 'high',
          context: {
            originalWork: work,
            auditResult,
            rejectionReasons: auditResult.rejectionReasons,
            reworkInstructions: auditResult.reworkInstructions
          }
        });
      }
    } catch (error) {
      console.error('Failed to send rework notification:', error);
    }
  }

  /**
   * Record successful completion in GitHub
   */
  private async recordSuccessfulCompletion(
    work: SubagentWork,
    auditResult: AuditResult
  ): Promise<void> {
    if (!this.config.requireGitHubUpdate) {
      console.log(`  GitHub update not required per configuration`);
      return;
    }

    console.log(`  Recording completion in GitHub Project Manager...`);

    const githubResult = await this.githubRecorder.recordCompletion({
      taskId: work.taskId,
      taskDescription: work.taskDescription,
      subagentId: work.subagentId,
      subagentType: work.subagentType,
      auditId: auditResult.auditId,
      auditEvidence: {
        theaterScore: auditResult.theaterScore,
        sandboxPassed: auditResult.sandboxPassed,
        debugIterations: auditResult.debugCycleCount,
        performanceMetrics: auditResult.sandboxValidation?.performanceMetrics
      },
      files: work.files,
      completionTime: Date.now()
    });

    auditResult.githubIssueId = githubResult.issueId;
    auditResult.githubProjectUpdate = githubResult.projectUpdated;

    console.log(`  GitHub Issue: ${githubResult.issueId}`);
    console.log(`  Project Board: ${githubResult.projectUpdated ? 'Updated' : 'Not updated'}`);
  }

  /**
   * Store audit result in history
   */
  private storeAuditResult(auditResult: AuditResult): void {
    const taskHistory = this.auditHistory.get(auditResult.taskId) || [];
    taskHistory.push(auditResult);
    this.auditHistory.set(auditResult.taskId, taskHistory);

    // Also store in memory MCP for persistence
    this.persistAuditToMemory(auditResult);
  }

  /**
   * Persist audit to memory MCP
   */
  private async persistAuditToMemory(auditResult: AuditResult): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `audit-${auditResult.auditId}`,
            entityType: 'princess-audit',
            observations: [
              `Domain: ${this.princessDomain}`,
              `Task: ${auditResult.taskId}`,
              `Subagent: ${auditResult.subagentId}`,
              `Status: ${auditResult.finalStatus}`,
              `Theater Score: ${auditResult.theaterScore}%`,
              `Sandbox: ${auditResult.sandboxPassed ? 'PASSED' : 'FAILED'}`,
              `Debug Iterations: ${auditResult.debugCycleCount}`,
              `Timestamp: ${new Date(auditResult.timestamp).toISOString()}`
            ]
          }]
        });
      }
    } catch (error) {
      console.error('Failed to persist audit to memory:', error);
    }
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `audit-${this.princessDomain}-${timestamp}-${random}`;
  }

  /**
   * Get audit history for a task
   */
  getAuditHistory(taskId: string): AuditResult[] {
    return this.auditHistory.get(taskId) || [];
  }

  /**
   * Get audit statistics
   */
  getAuditStatistics(): {
    totalAudits: number;
    approvedCount: number;
    rejectedCount: number;
    reworkCount: number;
    averageTheaterScore: number;
    averageDebugIterations: number;
    approvalRate: number;
  } {
    let totalAudits = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let reworkCount = 0;
    let totalTheaterScore = 0;
    let totalDebugIterations = 0;

    for (const taskHistory of this.auditHistory.values()) {
      for (const audit of taskHistory) {
        totalAudits++;
        totalTheaterScore += audit.theaterScore;
        totalDebugIterations += audit.debugCycleCount;

        switch (audit.finalStatus) {
          case 'approved':
            approvedCount++;
            break;
          case 'rejected':
            rejectedCount++;
            break;
          case 'needs_rework':
            reworkCount++;
            break;
        }
      }
    }

    return {
      totalAudits,
      approvedCount,
      rejectedCount,
      reworkCount,
      averageTheaterScore: totalAudits > 0 ? totalTheaterScore / totalAudits : 0,
      averageDebugIterations: totalAudits > 0 ? totalDebugIterations / totalAudits : 0,
      approvalRate: totalAudits > 0 ? (approvedCount / totalAudits) * 100 : 0
    };
  }
}

export default PrincessAuditGate;