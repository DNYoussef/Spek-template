/**
 * SPEK Sequential Thinking MCP Integration
 * Enhanced reasoning capabilities for "dumber" models
 */

const { shouldUseSequentialThinking } = require('../config/agent-model-registry');

/**
 * Sequential Thinking MCP Server Configuration
 */
const SequentialThinkingConfig = {
  name: 'sequential-thinking',
  command: 'npx',
  args: ['sequential-thinking-mcp-server'],
  env: {
    SEQUENTIAL_THINKING_MODE: 'enhanced',
    REASONING_DEPTH: 'deep',
    STEP_BY_STEP: 'true'
  }
};

/**
 * Reasoning modes for different complexity levels
 */
const ReasoningModes = {
  BASIC: {
    steps: 3,
    depth: 'shallow',
    mode: 'linear'
  },
  ENHANCED: {
    steps: 5,
    depth: 'medium',
    mode: 'structured'
  },
  DEEP: {
    steps: 8,
    depth: 'deep',
    mode: 'analytical'
  },
  COMPREHENSIVE: {
    steps: 12,
    depth: 'comprehensive',
    mode: 'multi_perspective'
  }
};

/**
 * Sequential Thinking Integration Manager
 */
class SequentialThinkingIntegrator {
  constructor() {
    this.activeConnections = new Map();
    this.reasoningPatterns = new Map();
    this.performanceMetrics = new Map();
  }

  /**
   * Initialize sequential thinking for an agent
   * @param {string} agentType - Type of agent
   * @param {object} taskContext - Task context for reasoning configuration
   * @returns {object} Integration configuration
   */
  initializeForAgent(agentType, taskContext = {}) {
    if (!shouldUseSequentialThinking(agentType)) {
      return { enabled: false, reason: 'Agent does not require sequential thinking' };
    }

    const reasoningMode = this.selectReasoningMode(agentType, taskContext);
    const mcpConfig = this.generateMCPConfiguration(agentType, reasoningMode);

    const integration = {
      enabled: true,
      agentType: agentType,
      reasoningMode: reasoningMode,
      mcpConfig: mcpConfig,
      prompts: this.generateReasoningPrompts(agentType, reasoningMode),
      initialization: this.generateInitializationScript(agentType, reasoningMode)
    };

    this.activeConnections.set(agentType, integration);
    return integration;
  }

  /**
   * Select appropriate reasoning mode based on agent and task
   */
  selectReasoningMode(agentType, taskContext) {
    // Coordination agents need deep reasoning
    const coordinationAgents = [
      'sparc-coord', 'hierarchical-coordinator', 'mesh-coordinator',
      'adaptive-coordinator', 'task-orchestrator', 'memory-coordinator'
    ];

    // Planning agents need structured reasoning
    const planningAgents = [
      'planner', 'refinement', 'pr-manager', 'issue-tracker'
    ];

    // Performance agents need analytical reasoning
    const performanceAgents = [
      'performance-benchmarker', 'perf-analyzer', 'benchmark-suite'
    ];

    if (coordinationAgents.includes(agentType)) {
      return taskContext.complexity === 'high' ?
        ReasoningModes.COMPREHENSIVE : ReasoningModes.DEEP;
    }

    if (planningAgents.includes(agentType)) {
      return taskContext.complexity === 'high' ?
        ReasoningModes.DEEP : ReasoningModes.ENHANCED;
    }

    if (performanceAgents.includes(agentType)) {
      return ReasoningModes.ENHANCED;
    }

    // Default reasoning mode
    return ReasoningModes.BASIC;
  }

  /**
   * Generate MCP configuration for sequential thinking
   */
  generateMCPConfiguration(agentType, reasoningMode) {
    return {
      mcpServers: {
        'sequential-thinking': {
          command: 'npx',
          args: ['sequential-thinking-mcp-server'],
          env: {
            AGENT_TYPE: agentType,
            REASONING_STEPS: reasoningMode.steps.toString(),
            REASONING_DEPTH: reasoningMode.depth,
            REASONING_MODE: reasoningMode.mode,
            ENABLE_MEMORY: 'true',
            ENABLE_REFLECTION: 'true'
          }
        }
      }
    };
  }

  /**
   * Generate reasoning prompts for enhanced thinking
   */
  generateReasoningPrompts(agentType, reasoningMode) {
    const basePrompt = this.getBaseReasoningPrompt(agentType);
    const modeSpecificPrompt = this.getModeSpecificPrompt(reasoningMode);

    return {
      systemPrompt: `${basePrompt}\n\n${modeSpecificPrompt}`,
      thinkingSteps: this.generateThinkingSteps(reasoningMode),
      reflectionPrompts: this.generateReflectionPrompts(agentType)
    };
  }

  /**
   * Get base reasoning prompt for agent type
   */
  getBaseReasoningPrompt(agentType) {
    const prompts = {
      'sparc-coord': `You are a SPARC methodology coordinator with enhanced sequential reasoning.
                     Break down complex coordination tasks into clear, logical steps.`,

      'hierarchical-coordinator': `You are a hierarchical coordination specialist with step-by-step reasoning.
                                  Analyze coordination problems systematically before taking action.`,

      'planner': `You are a strategic planner with structured thinking capabilities.
                 Approach planning tasks with clear, sequential analysis.`,

      'performance-benchmarker': `You are a performance analysis specialist with analytical reasoning.
                                 Systematically analyze performance data and draw logical conclusions.`
    };

    return prompts[agentType] || `You are an AI agent with enhanced sequential reasoning capabilities.
                                 Think through problems step-by-step before providing solutions.`;
  }

  /**
   * Get mode-specific reasoning prompts
   */
  getModeSpecificPrompt(reasoningMode) {
    switch (reasoningMode.mode) {
      case 'linear':
        return 'Think through this problem in a clear, linear sequence of steps.';

      case 'structured':
        return `Approach this systematically:
                1. Analyze the problem structure
                2. Identify key components
                3. Develop step-by-step solution
                4. Validate the approach
                5. Execute with monitoring`;

      case 'analytical':
        return `Use analytical reasoning:
                1. Problem decomposition
                2. Data analysis
                3. Pattern recognition
                4. Hypothesis formation
                5. Solution synthesis
                6. Validation and refinement
                7. Implementation planning
                8. Outcome prediction`;

      case 'multi_perspective':
        return `Apply comprehensive multi-perspective analysis:
                1. Problem framing from multiple angles
                2. Stakeholder perspective analysis
                3. Technical feasibility assessment
                4. Risk and opportunity evaluation
                5. Resource requirement analysis
                6. Timeline and dependency mapping
                7. Solution option generation
                8. Comparative analysis
                9. Recommendation synthesis
                10. Implementation roadmap
                11. Success criteria definition
                12. Monitoring and feedback loops`;

      default:
        return 'Think through this problem step by step.';
    }
  }

  /**
   * Generate thinking steps template
   */
  generateThinkingSteps(reasoningMode) {
    const steps = [];
    for (let i = 1; i <= reasoningMode.steps; i++) {
      steps.push({
        step: i,
        prompt: `Step ${i}: What should I consider at this stage?`,
        validation: `Is this step complete and accurate?`
      });
    }
    return steps;
  }

  /**
   * Generate reflection prompts for quality control
   */
  generateReflectionPrompts(agentType) {
    return [
      'Have I considered all relevant factors?',
      'Are there any gaps in my reasoning?',
      'What assumptions am I making?',
      'How can I validate this conclusion?',
      'What are the potential risks or unintended consequences?'
    ];
  }

  /**
   * Generate initialization script for agent with sequential thinking
   */
  generateInitializationScript(agentType, reasoningMode) {
    return {
      preInit: [
        '# Initialize Sequential Thinking MCP Server',
        `export AGENT_TYPE=${agentType}`,
        `export REASONING_MODE=${reasoningMode.mode}`,
        `export REASONING_STEPS=${reasoningMode.steps}`
      ],

      mcpSetup: [
        '# Setup MCP connection for sequential thinking',
        'claude mcp add sequential-thinking npx sequential-thinking-mcp-server'
      ],

      validation: [
        '# Validate sequential thinking integration',
        'claude mcp list | grep sequential-thinking',
        'echo "Sequential thinking enabled for ' + agentType + '"'
      ]
    };
  }

  /**
   * Monitor sequential thinking performance
   */
  monitorPerformance(agentType, taskResult) {
    if (!this.activeConnections.has(agentType)) {
      return;
    }

    const metrics = this.performanceMetrics.get(agentType) || {
      tasksCompleted: 0,
      averageSteps: 0,
      successRate: 0,
      reasoningQuality: 0
    };

    metrics.tasksCompleted++;

    if (taskResult.reasoningSteps) {
      metrics.averageSteps = (metrics.averageSteps + taskResult.reasoningSteps) / 2;
    }

    if (taskResult.success) {
      metrics.successRate = (metrics.successRate * (metrics.tasksCompleted - 1) + 1) / metrics.tasksCompleted;
    }

    if (taskResult.qualityScore) {
      metrics.reasoningQuality = (metrics.reasoningQuality + taskResult.qualityScore) / 2;
    }

    this.performanceMetrics.set(agentType, metrics);
  }

  /**
   * Get performance summary for all agents using sequential thinking
   */
  getPerformanceSummary() {
    const summary = {
      totalAgents: this.activeConnections.size,
      performance: {},
      recommendations: []
    };

    this.performanceMetrics.forEach((metrics, agentType) => {
      summary.performance[agentType] = metrics;

      // Generate recommendations based on performance
      if (metrics.successRate < 0.8) {
        summary.recommendations.push(`Consider deeper reasoning mode for ${agentType}`);
      }

      if (metrics.averageSteps > 10 && metrics.reasoningQuality < 0.7) {
        summary.recommendations.push(`Optimize reasoning efficiency for ${agentType}`);
      }
    });

    return summary;
  }

  /**
   * Update reasoning configuration for an agent
   */
  updateReasoningConfig(agentType, newReasoningMode) {
    if (!this.activeConnections.has(agentType)) {
      throw new Error(`Agent ${agentType} not initialized with sequential thinking`);
    }

    const integration = this.activeConnections.get(agentType);
    integration.reasoningMode = newReasoningMode;
    integration.prompts = this.generateReasoningPrompts(agentType, newReasoningMode);
    integration.mcpConfig = this.generateMCPConfiguration(agentType, newReasoningMode);

    this.activeConnections.set(agentType, integration);
    return integration;
  }

  /**
   * Disable sequential thinking for an agent
   */
  disableForAgent(agentType) {
    this.activeConnections.delete(agentType);
    this.performanceMetrics.delete(agentType);
  }

  /**
   * Get active sequential thinking configurations
   */
  getActiveConfigurations() {
    const configs = {};
    this.activeConnections.forEach((integration, agentType) => {
      configs[agentType] = {
        enabled: integration.enabled,
        reasoningMode: integration.reasoningMode.mode,
        steps: integration.reasoningMode.steps
      };
    });
    return configs;
  }
}

// Singleton instance
const sequentialThinkingIntegrator = new SequentialThinkingIntegrator();

module.exports = {
  SequentialThinkingIntegrator,
  sequentialThinkingIntegrator,
  ReasoningModes,
  SequentialThinkingConfig
};