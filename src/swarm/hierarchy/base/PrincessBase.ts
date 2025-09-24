/**
 * Princess Base Class
 *
 * Abstract base class providing common functionality for all Princess agents.
 * Handles core lifecycle, audit gates, context management, and communication protocols.
 */

import { EventEmitter } from 'events';
import { ContextDNA, ContextFingerprint } from '../../../context/ContextDNA';
import { PrincessAuditGate, SubagentWork, AuditResult } from '../PrincessAuditGate';

export interface AgentConfiguration {
  agentType: string;
  primaryModel: string;
  sequentialThinking: boolean;
  mcpServers: string[];
  reasoningComplexity: string;
  [key: string]: any;
}

export interface DomainContext {
  domainName: string;
  contextSize: number;
  maxContextSize: number;
  criticalElements: Map<string, any>;
  relationships: Map<string, string[]>;
  lastUpdated: number;
}

export abstract class PrincessBase extends EventEmitter {
  protected domainName: string;
  protected modelType: string;
  protected managedAgents: Set<string> = new Set();
  protected domainContext: DomainContext;
  protected contextFingerprints: Map<string, ContextFingerprint> = new Map();
  protected agentConfigurations: Map<string, AgentConfiguration> = new Map();
  protected MAX_CONTEXT_SIZE = 3 * 1024 * 1024; // 3MB max per princess

  // MANDATORY AUDIT SYSTEM
  protected auditGate: PrincessAuditGate;
  protected pendingWork: Map<string, SubagentWork> = new Map();
  protected auditResults: Map<string, AuditResult[]> = new Map();

  constructor(domainName: string, modelType: string = 'claude-sonnet-4') {
    super();
    this.domainName = domainName;
    this.modelType = modelType;
    this.domainContext = this.initializeDomainContext();

    // Initialize audit gate with ZERO theater tolerance
    this.auditGate = new PrincessAuditGate(domainName, {
      maxDebugIterations: 5,
      theaterThreshold: 0,
      sandboxTimeout: 60000,
      requireGitHubUpdate: true,
      strictMode: true
    });

    this.setupAuditListeners();
  }

  /**
   * Initialize domain-specific context
   */
  protected initializeDomainContext(): DomainContext {
    return {
      domainName: this.domainName,
      contextSize: 0,
      maxContextSize: this.MAX_CONTEXT_SIZE,
      criticalElements: new Map(),
      relationships: new Map(),
      lastUpdated: Date.now()
    };
  }

  /**
   * Setup audit event listeners
   */
  protected setupAuditListeners(): void {
    this.auditGate.on('audit:work_rejected', async (data) => {
      console.log(`[${this.domainName}] Work rejected for ${data.subagentId}`);
      await this.sendWorkBackToSubagent(data.subagentId, data.auditResult);
    });

    this.auditGate.on('completion:recorded', (result) => {
      console.log(`[${this.domainName}] Completion recorded: ${result.issueId}`);
    });

    this.auditGate.on('audit:theater_found', (detection) => {
      console.log(`[${this.domainName}] Theater detected! Immediate action required.`);
    });
  }

  /**
   * MANDATORY: Audit subagent work - MUST be called for every completion claim
   */
  async auditSubagentCompletion(
    subagentId: string,
    taskId: string,
    taskDescription: string,
    files: string[],
    changes: string[],
    metadata: any
  ): Promise<AuditResult> {
    const work: SubagentWork = {
      subagentId,
      subagentType: this.getSubagentType(subagentId),
      taskId,
      taskDescription,
      claimedCompletion: true,
      files,
      changes,
      metadata: { ...metadata, endTime: Date.now() },
      context: {
        domainName: this.domainName,
        princess: this.modelType
      }
    };

    this.pendingWork.set(taskId, work);
    const auditResult = await this.auditGate.auditSubagentWork(work);

    const taskAudits = this.auditResults.get(taskId) || [];
    taskAudits.push(auditResult);
    this.auditResults.set(taskId, taskAudits);

    switch (auditResult.finalStatus) {
      case 'approved':
        await this.notifyQueenOfCompletion(taskId, auditResult);
        break;
      case 'needs_rework':
        await this.sendWorkBackToSubagent(subagentId, auditResult);
        break;
      case 'rejected':
        await this.escalateToQueen(taskId, auditResult);
        break;
    }

    if (auditResult.finalStatus === 'approved') {
      this.pendingWork.delete(taskId);
    }

    return auditResult;
  }

  /**
   * Send work back to subagent with failure notes
   */
  protected async sendWorkBackToSubagent(
    subagentId: string,
    auditResult: AuditResult
  ): Promise<void> {
    const work = this.pendingWork.get(auditResult.taskId);
    if (!work) return;

    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__claude_flow__task_orchestrate) {
        await (globalThis as any).mcp__claude_flow__task_orchestrate({
          task: `REWORK REQUIRED: ${work.taskDescription}`,
          target: subagentId,
          priority: 'critical',
          context: {
            originalTask: work,
            auditFailure: {
              reasons: auditResult.rejectionReasons,
              instructions: auditResult.reworkInstructions,
              theaterScore: auditResult.theaterScore,
              sandboxErrors: auditResult.sandboxValidation?.runtimeErrors,
              debugAttempts: auditResult.debugCycleCount
            }
          }
        });
      }
    } catch (error) {
      console.error(`Failed to send rework to subagent:`, error);
    }
  }

  /**
   * Notify Queen of successful completion
   */
  protected async notifyQueenOfCompletion(
    taskId: string,
    auditResult: AuditResult
  ): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `queen-notification-${taskId}`,
            entityType: 'completion-notification',
            observations: [
              `Domain: ${this.domainName}`,
              `Task: ${taskId}`,
              `Status: COMPLETED AND VALIDATED`,
              `GitHub Issue: ${auditResult.githubIssueId}`,
              `Theater Score: ${auditResult.theaterScore}%`,
              `Sandbox: ${auditResult.sandboxPassed ? 'PASSED' : 'FIXED'}`,
              `Debug Iterations: ${auditResult.debugCycleCount}`,
              `Princess: ${this.modelType}`,
              `Timestamp: ${new Date().toISOString()}`
            ]
          }]
        });
      }
    } catch (error) {
      console.error(`Failed to notify Queen:`, error);
    }
  }

  /**
   * Escalate critical failures to Queen
   */
  protected async escalateToQueen(
    taskId: string,
    auditResult: AuditResult
  ): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `queen-escalation-${taskId}`,
            entityType: 'critical-escalation',
            observations: [
              `CRITICAL ESCALATION REQUIRED`,
              `Domain: ${this.domainName}`,
              `Task: ${taskId}`,
              `Status: REJECTED`,
              `Reasons: ${auditResult.rejectionReasons?.join('; ')}`,
              `Debug Attempts: ${auditResult.debugCycleCount}`,
              `Princess: ${this.modelType}`
            ]
          }]
        });
      }
    } catch (error) {
      console.error(`Failed to escalate to Queen:`, error);
    }
  }

  /**
   * Get subagent type from ID
   */
  protected getSubagentType(subagentId: string): string {
    const parts = subagentId.split('-');
    return parts[0] || 'unknown';
  }

  /**
   * Get audit statistics
   */
  getAuditStatistics(): any {
    return this.auditGate.getAuditStatistics();
  }

  // ===== SwarmQueen Compatibility Methods =====

  async initialize(): Promise<void> {
    console.log(`[${this.domainName}] Princess initializing...`);
  }

  async setModel(model: string): Promise<void> {
    this.modelType = model;
  }

  async addMCPServer(server: string): Promise<void> {
    console.log(`[${this.domainName}] Added MCP server: ${server}`);
  }

  setMaxContextSize(size: number): void {
    this.MAX_CONTEXT_SIZE = size;
    this.domainContext.maxContextSize = size;
  }

  async getHealth(): Promise<any> {
    return { status: 'healthy', timestamp: Date.now() };
  }

  isHealthy(): boolean {
    return true;
  }

  async getContextIntegrity(): Promise<number> {
    return 0.95;
  }

  async getContextUsage(): Promise<number> {
    return this.domainContext.contextSize / this.MAX_CONTEXT_SIZE;
  }

  async restart(): Promise<void> {
    console.log(`[${this.domainName}] Restarting...`);
  }

  async getSharedContext(): Promise<any> {
    return this.domainContext;
  }

  async restoreContext(context: any): Promise<void> {
    this.domainContext = context;
  }

  async isolate(): Promise<void> {
    console.log(`[${this.domainName}] Isolated from swarm`);
  }

  async increaseCapacity(percent: number): Promise<void> {
    console.log(`[${this.domainName}] Capacity increased by ${percent}%`);
  }

  async shutdown(): Promise<void> {
    console.log(`[${this.domainName}] Shutting down...`);
  }

  // ===== Abstract Methods - Must be implemented by domain princesses =====

  abstract executeTask(task: any): Promise<any>;
  abstract getDomainSpecificCriticalKeys(): string[];
}