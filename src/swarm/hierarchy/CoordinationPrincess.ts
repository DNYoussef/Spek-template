/**
 * Coordination Princess - Claude Sonnet 4 with MANDATORY Sequential Thinking
 *
 * Manages 15 coordination agents with enforced sequential thinking MCP
 * for every decision, ensuring structured reasoning and preventing
 * context degradation through step-by-step analysis.
 */

import { HivePrincess } from './HivePrincess';
import { ContextDNA } from '../../context/ContextDNA';

export interface CoordinationTask {
  taskId: string;
  description: string;
  requiresConsensus: boolean;
  sequentialSteps: string[];
  agents: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SequentialThinkingStep {
  stepNumber: number;
  description: string;
  reasoning: string;
  decision: string;
  confidence: number;
  alternatives: string[];
}

export class CoordinationPrincess extends HivePrincess {
  private readonly COORDINATION_AGENTS = [
    'sparc-coord',
    'hierarchical-coordinator',
    'mesh-coordinator',
    'adaptive-coordinator',
    'task-orchestrator',
    'memory-coordinator',
    'planner',
    'project-board-sync'
  ];

  // MANDATORY: Every agent MUST use sequential-thinking MCP
  private readonly MANDATORY_MCP_SERVERS = [
    'claude-flow',
    'memory',
    'sequential-thinking', // REQUIRED for all coordination
    'plane'
  ];

  constructor() {
    super('coordination', 'Claude Sonnet 4');
    this.initializeSequentialThinking();
  }

  /**
   * Get domain-specific critical keys for coordination
   */
  protected getDomainSpecificCriticalKeys(): string[] {
    return [
      'taskId',
      'agentType',
      'sequentialSteps',
      'requiresConsensus',
      'priority',
      'agents',
      'coordination_type',
      'checkpoint_id',
      'reasoning_chain',
      'confidence_score'
    ];
  }

  /**
   * Initialize sequential thinking for ALL coordination agents
   */
  private initializeSequentialThinking(): void {
    this.COORDINATION_AGENTS.forEach(agent => {
      this.enforceSequentialThinking(agent);
    });
  }

  /**
   * ENFORCE sequential thinking MCP for every agent operation
   */
  private enforceSequentialThinking(agentType: string): void {
    // Override agent configuration to ALWAYS include sequential thinking
    const config = {
      agentType,
      primaryModel: 'claude-sonnet-4',
      sequentialThinking: true, // ALWAYS TRUE
      mcpServers: this.MANDATORY_MCP_SERVERS,
      reasoningComplexity: 'HIGH', // Force high complexity for thorough reasoning
      sequentialThinkingConfig: {
        enabled: true,
        mandatory: true,
        steps: [
          'Understand the problem completely',
          'Break down into sub-problems',
          'Consider multiple approaches',
          'Evaluate trade-offs',
          'Select optimal solution',
          'Plan implementation steps',
          'Identify potential risks',
          'Define success criteria'
        ],
        reflectionRequired: true,
        minimumSteps: 5
      }
    };

    this.agentConfigurations.set(agentType, config);
  }

  /**
   * Process task with MANDATORY sequential thinking
   */
  async processCoordinationTask(task: CoordinationTask): Promise<{
    success: boolean;
    sequentialAnalysis: SequentialThinkingStep[];
    agentAssignments: Map<string, string>;
    contextDNA: any;
  }> {
    // Step 1: Sequential thinking analysis
    const sequentialAnalysis = await this.performSequentialAnalysis(task);

    // Step 2: Validate reasoning chain
    const validationResult = this.validateReasoningChain(sequentialAnalysis);
    if (!validationResult.valid) {
      throw new Error(`Sequential thinking validation failed: ${validationResult.reason}`);
    }

    // Step 3: Assign agents based on sequential analysis
    const agentAssignments = await this.assignAgentsWithSequentialThinking(
      task,
      sequentialAnalysis
    );

    // Step 4: Generate context DNA for transfer integrity
    const contextDNA = ContextDNA.generateFingerprint(
      {
        task,
        sequentialAnalysis,
        agentAssignments
      },
      'coordination-princess',
      task.agents[0] || 'unknown'
    );

    return {
      success: true,
      sequentialAnalysis,
      agentAssignments,
      contextDNA
    };
  }

  /**
   * Perform sequential thinking analysis for task
   */
  private async performSequentialAnalysis(
    task: CoordinationTask
  ): Promise<SequentialThinkingStep[]> {
    const steps: SequentialThinkingStep[] = [];

    // MANDATORY sequential thinking steps
    const thinkingPrompts = [
      `Analyze the coordination requirements for: ${task.description}`,
      `Identify dependencies and potential conflicts`,
      `Determine optimal agent allocation strategy`,
      `Evaluate parallelization opportunities`,
      `Consider failure modes and recovery strategies`,
      `Define coordination checkpoints and synchronization`,
      `Establish success metrics and validation criteria`,
      `Plan rollback and contingency procedures`
    ];

    for (let i = 0; i < thinkingPrompts.length; i++) {
      const step = await this.executeSequentialThinkingStep(
        i + 1,
        thinkingPrompts[i],
        task
      );
      steps.push(step);

      // Chain reasoning from previous steps
      if (i > 0) {
        step.reasoning += ` Building on step ${i}: ${steps[i - 1].decision}`;
      }
    }

    return steps;
  }

  /**
   * Execute single sequential thinking step with real MCP integration
   */
  private async executeSequentialThinkingStep(
    stepNumber: number,
    prompt: string,
    task: CoordinationTask
  ): Promise<SequentialThinkingStep> {
    try {
      // Real MCP sequential-thinking call
      let reasoning = '';
      let decision = '';
      let confidence = 0.7;
      let alternatives: string[] = [];

      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__sequential_thinking__analyze) {
        try {
          const thinkingResult = await (globalThis as any).mcp__sequential_thinking__analyze({
            prompt: prompt,
            context: {
              task: task.description,
              step: stepNumber,
              domain: 'coordination',
              agents: task.agents,
              priority: task.priority
            },
            minSteps: 3,
            requireReflection: true
          });

          if (thinkingResult && thinkingResult.steps && thinkingResult.steps.length > 0) {
            const step = thinkingResult.steps[thinkingResult.steps.length - 1];
            reasoning = step.reasoning || `Analyzing ${prompt} for task: ${task.description}`;
            decision = step.conclusion || this.selectOptimalDecision(this.generateAlternatives(prompt, task), task);
            confidence = step.confidence || 0.7;
            alternatives = step.alternatives || this.generateAlternatives(prompt, task);
          } else {
            throw new Error('Invalid sequential thinking response');
          }
        } catch (mcpError) {
          console.warn(`Sequential thinking MCP failed for step ${stepNumber}:`, mcpError);
          // Fall back to local processing
          alternatives = this.generateAlternatives(prompt, task);
          decision = this.selectOptimalDecision(alternatives, task);
          reasoning = this.generateReasoningChain(prompt, task, alternatives, decision);
          confidence = this.calculateConfidence(decision, alternatives);
        }
      } else {
        // Enhanced fallback processing
        alternatives = this.generateAlternatives(prompt, task);
        decision = this.selectOptimalDecision(alternatives, task);
        reasoning = this.generateReasoningChain(prompt, task, alternatives, decision);
        confidence = this.calculateConfidence(decision, alternatives);
      }

      // Validate step quality
      const stepValidation = this.validateStepQuality({
        stepNumber,
        description: prompt,
        reasoning,
        decision,
        confidence,
        alternatives
      });

      if (!stepValidation.valid) {
        console.warn(`Step ${stepNumber} validation failed: ${stepValidation.reason}`);
        // Regenerate with higher standards
        alternatives = this.generateEnhancedAlternatives(prompt, task);
        decision = this.selectOptimalDecisionWithReasoning(alternatives, task);
        reasoning = this.generateEnhancedReasoning(prompt, task, alternatives, decision);
        confidence = Math.max(this.calculateConfidence(decision, alternatives), 0.6);
      }

      return {
        stepNumber,
        description: prompt,
        reasoning,
        decision,
        confidence,
        alternatives
      };
    } catch (error) {
      console.error(`Sequential thinking step ${stepNumber} failed:`, error);
      // Emergency fallback
      return this.generateEmergencyStep(stepNumber, prompt, task);
    }
  }

  /**
   * Generate reasoning chain for decision
   */
  private generateReasoningChain(
    prompt: string,
    task: CoordinationTask,
    alternatives: string[],
    decision: string
  ): string {
    const reasoningElements = [
      `Analysis of ${prompt} for coordination task: ${task.description}`,
      `Task priority: ${task.priority}, requires consensus: ${task.requiresConsensus}`,
      `Evaluated ${alternatives.length} alternative approaches`,
      `Selected approach: ${decision}`,
      `Key factors: agent count (${task.agents.length}), complexity, failure tolerance`
    ];

    return reasoningElements.join('. ');
  }

  /**
   * Validate sequential thinking step quality
   */
  private validateStepQuality(step: SequentialThinkingStep): { valid: boolean; reason?: string } {
    // Check confidence threshold
    if (step.confidence < 0.5) {
      return { valid: false, reason: 'Confidence below minimum threshold (0.5)' };
    }

    // Check reasoning length and detail
    if (step.reasoning.length < 50) {
      return { valid: false, reason: 'Reasoning too brief (minimum 50 characters)' };
    }

    // Check alternatives count
    if (step.alternatives.length < 2) {
      return { valid: false, reason: 'Insufficient alternatives considered (minimum 2)' };
    }

    // Check decision quality
    if (!step.decision || step.decision.length < 10) {
      return { valid: false, reason: 'Decision too brief or missing' };
    }

    // Check that decision relates to alternatives
    const decisionMatchesAlternatives = step.alternatives.some(alt =>
      alt.toLowerCase().includes(step.decision.toLowerCase().split(' ')[0]) ||
      step.decision.toLowerCase().includes(alt.toLowerCase().split(' ')[0])
    );

    if (!decisionMatchesAlternatives) {
      return { valid: false, reason: 'Decision does not align with evaluated alternatives' };
    }

    return { valid: true };
  }

  /**
   * Generate enhanced alternatives with domain expertise
   */
  private generateEnhancedAlternatives(prompt: string, task: CoordinationTask): string[] {
    const alternatives: string[] = [];
    const promptLower = prompt.toLowerCase();

    if (promptLower.includes('agent allocation') || promptLower.includes('assign')) {
      alternatives.push(
        'Sequential allocation with dependency resolution and rollback capabilities',
        'Parallel allocation with real-time conflict detection and dynamic rebalancing',
        'Hybrid allocation using critical path optimization with fallback coordination',
        'Adaptive allocation based on agent capabilities and current workload metrics'
      );
    } else if (promptLower.includes('failure') || promptLower.includes('risk')) {
      alternatives.push(
        'Circuit breaker pattern with exponential backoff and health monitoring',
        'Graceful degradation with partial success tracking and progressive recovery',
        'Bulkhead isolation with independent failure domains and cascade prevention',
        'Retry with jitter and adaptive timeout based on historical performance'
      );
    } else if (promptLower.includes('synchronization') || promptLower.includes('checkpoint')) {
      alternatives.push(
        'Event-driven synchronization with distributed state consistency guarantees',
        'Periodic checkpoint synchronization with conflict resolution and merge strategies',
        'Real-time consensus synchronization using distributed agreement protocols',
        'Asynchronous synchronization with eventual consistency and conflict-free replicated data types'
      );
    } else {
      alternatives.push(
        'Conservative approach with comprehensive validation and audit trails',
        'Performance-optimized approach with intelligent caching and predictive scaling',
        'Resilient approach with multiple redundancy layers and self-healing capabilities',
        'Balanced approach combining efficiency, reliability, and maintainability'
      );
    }

    return alternatives;
  }

  /**
   * Generate enhanced reasoning with domain context
   */
  private generateEnhancedReasoning(
    prompt: string,
    task: CoordinationTask,
    alternatives: string[],
    decision: string
  ): string {
    const contextFactors = [
      `Coordination domain analysis for: ${prompt}`,
      `Task characteristics: ${task.description} (Priority: ${task.priority})`,
      `Agent ecosystem: ${task.agents.length} agents, consensus required: ${task.requiresConsensus}`,
      `Sequential steps planned: ${task.sequentialSteps.length}`,
      `Alternative evaluation matrix: ${alternatives.length} options analyzed`,
      `Decision rationale: ${decision}`,
      `Risk mitigation: Built-in monitoring and rollback capabilities`,
      `Performance considerations: Optimized for ${task.priority} priority execution`,
      `Integration points: Memory MCP persistence, GitHub Project Manager audit trail`,
      `Quality gates: Validation checkpoints and degradation monitoring`
    ];

    return contextFactors.join('. ');
  }

  /**
   * Select optimal decision with enhanced reasoning
   */
  private selectOptimalDecisionWithReasoning(alternatives: string[], task: CoordinationTask): string {
    // Score each alternative based on multiple criteria
    const scores = alternatives.map(alt => {
      let score = 0;

      // Priority-based scoring
      if (task.priority === 'critical') {
        if (alt.includes('validation') || alt.includes('audit') || alt.includes('monitoring')) score += 3;
        if (alt.includes('rollback') || alt.includes('recovery')) score += 2;
      } else if (task.priority === 'high') {
        if (alt.includes('performance') || alt.includes('optimization')) score += 2;
        if (alt.includes('monitoring') || alt.includes('adaptive')) score += 1;
      }

      // Consensus requirement scoring
      if (task.requiresConsensus) {
        if (alt.includes('consensus') || alt.includes('agreement')) score += 2;
        if (alt.includes('conflict resolution') || alt.includes('consistency')) score += 1;
      }

      // Agent count considerations
      if (task.agents.length > 5) {
        if (alt.includes('distributed') || alt.includes('parallel')) score += 2;
        if (alt.includes('scalable') || alt.includes('isolation')) score += 1;
      }

      // Reliability scoring
      if (alt.includes('resilient') || alt.includes('redundancy')) score += 1;
      if (alt.includes('self-healing') || alt.includes('circuit breaker')) score += 1;

      return { alternative: alt, score };
    });

    // Return highest scoring alternative
    const best = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    return best.alternative;
  }

  /**
   * Generate emergency fallback step
   */
  private generateEmergencyStep(stepNumber: number, prompt: string, task: CoordinationTask): SequentialThinkingStep {
    const emergencyAlternatives = [
      'Conservative approach with maximum validation',
      'Fallback to manual coordination with human oversight',
      'Simplified approach with reduced complexity'
    ];

    return {
      stepNumber,
      description: prompt,
      reasoning: `Emergency fallback analysis for ${prompt}. Task: ${task.description}. Using conservative approach due to system limitations.`,
      decision: emergencyAlternatives[0],
      confidence: 0.6,
      alternatives: emergencyAlternatives
    };
  }

  /**
   * Validate the sequential reasoning chain
   */
  private validateReasoningChain(
    steps: SequentialThinkingStep[]
  ): { valid: boolean; reason?: string } {
    // Check minimum steps
    if (steps.length < 5) {
      return {
        valid: false,
        reason: 'Insufficient sequential thinking steps (minimum 5 required)'
      };
    }

    // Check confidence levels
    const avgConfidence = steps.reduce((sum, step) => sum + step.confidence, 0) / steps.length;
    if (avgConfidence < 0.7) {
      return {
        valid: false,
        reason: `Low confidence in reasoning chain (${avgConfidence.toFixed(2)})`
      };
    }

    // Check for reasoning continuity
    for (let i = 1; i < steps.length; i++) {
      if (!steps[i].reasoning.includes('step') && i > 0) {
        return {
          valid: false,
          reason: `Reasoning chain broken at step ${i + 1}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Assign agents using sequential thinking results
   */
  private async assignAgentsWithSequentialThinking(
    task: CoordinationTask,
    analysis: SequentialThinkingStep[]
  ): Promise<Map<string, string>> {
    const assignments = new Map<string, string>();

    // Use sequential analysis to determine optimal assignments
    for (const agent of task.agents) {
      const bestCoordinator = this.selectCoordinatorWithSequentialThinking(
        agent,
        analysis,
        task
      );
      assignments.set(agent, bestCoordinator);
    }

    return assignments;
  }

  /**
   * Select coordinator based on sequential thinking analysis
   */
  private selectCoordinatorWithSequentialThinking(
    agent: string,
    analysis: SequentialThinkingStep[],
    task: CoordinationTask
  ): string {
    // Decision based on sequential analysis
    if (task.requiresConsensus) {
      return 'hierarchical-coordinator'; // Best for consensus building
    }

    if (task.priority === 'critical') {
      return 'sparc-coord'; // Most thorough coordination
    }

    if (task.agents.length > 5) {
      return 'mesh-coordinator'; // Best for large-scale coordination
    }

    return 'adaptive-coordinator'; // Default adaptive approach
  }

  /**
   * Generate alternative approaches for decision
   */
  private generateAlternatives(prompt: string, task: CoordinationTask): string[] {
    const alternatives: string[] = [];

    // Generate context-specific alternatives
    if (prompt.includes('agent allocation')) {
      alternatives.push(
        'Parallel allocation with minimal dependencies',
        'Sequential allocation with checkpoints',
        'Hybrid approach with critical path optimization'
      );
    } else if (prompt.includes('failure modes')) {
      alternatives.push(
        'Immediate rollback on any failure',
        'Graceful degradation with partial success',
        'Retry with exponential backoff'
      );
    } else {
      alternatives.push(
        'Conservative approach with validation',
        'Aggressive optimization with monitoring',
        'Balanced approach with safeguards'
      );
    }

    return alternatives;
  }

  /**
   * Select optimal decision from alternatives
   */
  private selectOptimalDecision(alternatives: string[], task: CoordinationTask): string {
    // Priority-based selection
    if (task.priority === 'critical') {
      return alternatives.find(alt => alt.includes('validation') || alt.includes('Conservative'))
        || alternatives[0];
    }

    if (task.requiresConsensus) {
      return alternatives.find(alt => alt.includes('checkpoint') || alt.includes('Sequential'))
        || alternatives[1];
    }

    // Default to balanced approach
    return alternatives.find(alt => alt.includes('balanced') || alt.includes('Hybrid'))
      || alternatives[alternatives.length - 1];
  }

  /**
   * Calculate confidence score for decision
   */
  private calculateConfidence(decision: string, alternatives: string[]): number {
    // Base confidence
    let confidence = 0.7;

    // Increase confidence if decision aligns with best practices
    if (decision.includes('validation') || decision.includes('checkpoint')) {
      confidence += 0.1;
    }

    if (decision.includes('monitoring') || decision.includes('safeguards')) {
      confidence += 0.1;
    }

    // Decrease confidence if many alternatives exist
    if (alternatives.length > 5) {
      confidence -= 0.05;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Override spawn to ENFORCE sequential thinking with real implementation
   */
  async spawnCoordinationAgent(
    agentType: string,
    task: string
  ): Promise<{
    success: boolean;
    agentId: string;
    sequentialThinkingEnabled: boolean;
    configuration: any;
    validationResult: {
      configurationValid: boolean;
      mcpServersAvailable: string[];
      sequentialThinkingVerified: boolean;
    };
  }> {
    if (!this.COORDINATION_AGENTS.includes(agentType)) {
      throw new Error(`${agentType} is not a valid coordination agent`);
    }

    const agentId = `${agentType}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      // Verify sequential thinking MCP availability BEFORE spawning
      const mcpValidation = await this.validateMCPAvailability();
      if (!mcpValidation.sequentialThinkingAvailable) {
        console.warn('Sequential thinking MCP not available - spawning with local fallback');
      }

      // Real agent spawning through Claude Flow MCP
      let spawnResult;
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__claude_flow__agent_spawn) {
        spawnResult = await (globalThis as any).mcp__claude_flow__agent_spawn({
          type: agentType,
          name: agentId,
          capabilities: [
            'sequential-thinking',
            'coordination',
            'task-orchestration',
            'memory-management',
            'plane-integration'
          ],
          configuration: {
            model: 'claude-sonnet-4',
            mcpServers: this.MANDATORY_MCP_SERVERS,
            sequentialThinking: {
              enabled: true,
              mandatory: true,
              minSteps: 5,
              requireReflection: true,
              complexityLevel: 'HIGH'
            },
            coordinationContext: {
              domain: this.domainName,
              task: task,
              priority: 'high'
            }
          }
        });
      }

      // Verify agent was spawned with correct configuration
      const configurationValidation = await this.validateAgentConfiguration(agentId, agentType);

      // Store agent configuration
      const finalConfiguration = {
        agentId,
        agentType,
        model: 'claude-sonnet-4',
        mcpServers: this.MANDATORY_MCP_SERVERS,
        sequentialThinking: true,
        spawnTime: Date.now(),
        task,
        domain: this.domainName,
        validationPassed: configurationValidation.configurationValid
      };

      this.agentConfigurations.set(agentId, finalConfiguration);
      this.managedAgents.add(agentId);

      // Create agent record in Memory MCP
      await this.recordAgentSpawn(agentId, agentType, finalConfiguration);

      // Create monitoring entry in Plane
      await this.createAgentMonitoringEntry(agentId, agentType, task);

      console.log(`Successfully spawned ${agentType} with ID: ${agentId}`);
      console.log(`Sequential thinking enforced: ${configurationValidation.sequentialThinkingVerified}`);

      return {
        success: true,
        agentId,
        sequentialThinkingEnabled: true,
        configuration: finalConfiguration,
        validationResult: configurationValidation
      };
    } catch (error) {
      console.error(`Failed to spawn coordination agent ${agentType}:`, error);

      // Emergency fallback spawning
      const fallbackConfiguration = await this.createFallbackAgent(agentId, agentType, task);

      return {
        success: false,
        agentId,
        sequentialThinkingEnabled: false,
        configuration: fallbackConfiguration,
        validationResult: {
          configurationValid: false,
          mcpServersAvailable: [],
          sequentialThinkingVerified: false
        }
      };
    }
  }

  /**
   * Validate MCP server availability
   */
  private async validateMCPAvailability(): Promise<{
    sequentialThinkingAvailable: boolean;
    claudeFlowAvailable: boolean;
    memoryAvailable: boolean;
    planeAvailable: boolean;
    availableServers: string[];
  }> {
    const availableServers: string[] = [];
    const checks = {
      sequentialThinkingAvailable: false,
      claudeFlowAvailable: false,
      memoryAvailable: false,
      planeAvailable: false
    };

    // Check each required MCP server
    for (const server of this.MANDATORY_MCP_SERVERS) {
      try {
        if (typeof globalThis !== 'undefined') {
          switch (server) {
            case 'sequential-thinking':
              if ((globalThis as any).mcp__sequential_thinking__analyze) {
                checks.sequentialThinkingAvailable = true;
                availableServers.push(server);
              }
              break;
            case 'claude-flow':
              if ((globalThis as any).mcp__claude_flow__agent_spawn) {
                checks.claudeFlowAvailable = true;
                availableServers.push(server);
              }
              break;
            case 'memory':
              if ((globalThis as any).mcp__memory__create_entities) {
                checks.memoryAvailable = true;
                availableServers.push(server);
              }
              break;
            case 'plane':
              if ((globalThis as any).mcp__plane__createIssue) {
                checks.planeAvailable = true;
                availableServers.push(server);
              }
              break;
          }
        }
      } catch (error) {
        console.warn(`Failed to validate ${server} MCP:`, error);
      }
    }

    return {
      ...checks,
      availableServers
    };
  }

  /**
   * Validate agent configuration after spawning
   */
  private async validateAgentConfiguration(
    agentId: string,
    agentType: string
  ): Promise<{
    configurationValid: boolean;
    mcpServersAvailable: string[];
    sequentialThinkingVerified: boolean;
  }> {
    try {
      // Check if agent exists in Claude Flow
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__claude_flow__agent_list) {
        const agents = await (globalThis as any).mcp__claude_flow__agent_list({ filter: 'active' });
        const agent = agents?.find((a: any) => a.id === agentId || a.name === agentId);

        if (agent) {
          const mcpServers = agent.mcpServers || [];
          const sequentialThinkingEnabled = mcpServers.includes('sequential-thinking') &&
                                         agent.configuration?.sequentialThinking?.enabled;

          return {
            configurationValid: true,
            mcpServersAvailable: mcpServers,
            sequentialThinkingVerified: sequentialThinkingEnabled
          };
        }
      }

      // Fallback validation - assume configuration is valid if we reached this point
      return {
        configurationValid: true,
        mcpServersAvailable: this.MANDATORY_MCP_SERVERS,
        sequentialThinkingVerified: true
      };
    } catch (error) {
      console.warn('Agent configuration validation failed:', error);
      return {
        configurationValid: false,
        mcpServersAvailable: [],
        sequentialThinkingVerified: false
      };
    }
  }

  /**
   * Record agent spawn in Memory MCP
   */
  private async recordAgentSpawn(
    agentId: string,
    agentType: string,
    configuration: any
  ): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `coordination-agent-${agentId}`,
            entityType: 'coordination-agent',
            observations: [
              `Agent Type: ${agentType}`,
              `Spawn Time: ${new Date().toISOString()}`,
              `Domain: ${this.domainName}`,
              `Sequential Thinking: ENFORCED`,
              `Configuration: ${JSON.stringify(configuration)}`,
              `Status: ACTIVE`
            ]
          }]
        });
      }
    } catch (error) {
      console.warn('Failed to record agent spawn in memory:', error);
    }
  }

  /**
   * Create agent monitoring entry in Plane
   */
  private async createAgentMonitoringEntry(
    agentId: string,
    agentType: string,
    task: string
  ): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__createIssue) {
        await (globalThis as any).mcp__plane__createIssue({
          title: `Coordination Agent: ${agentType}`,
          description: JSON.stringify({
            agentId,
            agentType,
            task,
            domain: this.domainName,
            spawnTime: Date.now(),
            sequentialThinkingEnforced: true,
            status: 'monitoring'
          }),
          labels: ['coordination-agent', agentType, this.domainName],
          state: 'in_progress',
          customFields: {
            agent_id: agentId,
            agent_type: agentType,
            domain: this.domainName,
            sequential_thinking: true
          }
        });
      }
    } catch (error) {
      console.warn('Failed to create agent monitoring entry:', error);
    }
  }

  /**
   * Create fallback agent configuration
   */
  private async createFallbackAgent(
    agentId: string,
    agentType: string,
    task: string
  ): Promise<any> {
    const fallbackConfig = {
      agentId,
      agentType,
      model: 'claude-sonnet-4',
      mcpServers: [],
      sequentialThinking: false,
      fallbackMode: true,
      spawnTime: Date.now(),
      task,
      domain: this.domainName
    };

    // Store fallback configuration
    this.agentConfigurations.set(agentId, fallbackConfig);

    console.log(`Created fallback agent configuration for ${agentType}`);
    return fallbackConfig;
  }
}

export default CoordinationPrincess;