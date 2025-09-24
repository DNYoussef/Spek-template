/**
 * Cost Optimization Configuration for SPEK Platform
 * Based on September 2025 pricing and model availability
 */

const ModelCosts = {
  // OpenAI Models (per 1M tokens)
  'gpt-5': { input: 1.25, output: 10.00, name: 'GPT-5' },
  'gpt-5-mini': { input: 0.25, output: 2.00, name: 'GPT-5 Mini' },
  'gpt-5-nano': { input: 0.05, output: 0.40, name: 'GPT-5 Nano' },
  'o3': { input: 2.00, output: 8.00, name: 'O3' },
  'o3-mini': { input: 0.50, output: 2.00, name: 'O3 Mini' },

  // Claude Models (per 1M tokens)
  'claude-opus-4.1': { input: 15.00, output: 75.00, name: 'Claude Opus 4.1' },
  'claude-sonnet-4': { input: 3.00, output: 15.00, name: 'Claude Sonnet 4' },
  'claude-haiku-3.5': { input: 0.25, output: 1.25, name: 'Claude Haiku 3.5' },

  // Gemini Models (per 1M tokens)
  'gemini-2.5-pro': { input: 2.50, output: 10.00, name: 'Gemini 2.5 Pro' },
  'gemini-2.5-flash': { input: 1.25, output: 5.00, name: 'Gemini 2.5 Flash' },
  'gemini-2.0-flash': { input: 0.30, output: 1.20, name: 'Gemini 2.0 Flash' }
};

const TaskComplexity = {
  SIMPLE: 'simple',      // Routine tasks, basic operations
  MEDIUM: 'medium',      // Standard development tasks
  COMPLEX: 'complex',    // Complex reasoning, large context
  CRITICAL: 'critical'   // Quality gates, security analysis
};

/**
 * Cost optimization strategy based on task complexity
 */
const CostOptimizationStrategy = {
  [TaskComplexity.SIMPLE]: {
    primary: 'gpt-5-nano',        // $0.05/1M - Ultra efficient
    fallback: 'gemini-2.0-flash', // $0.30/1M - Cost effective
    maxTokens: 10000,
    rationale: 'Minimal cost for routine tasks'
  },

  [TaskComplexity.MEDIUM]: {
    primary: 'gpt-5-mini',         // $0.25/1M - Balanced
    fallback: 'gemini-2.5-flash',  // $1.25/1M - Good alternative
    maxTokens: 50000,
    rationale: 'Balanced cost-performance for standard tasks'
  },

  [TaskComplexity.COMPLEX]: {
    primary: 'gpt-5',              // $1.25/1M - Full capability
    fallback: 'gemini-2.5-pro',    // $2.50/1M - Large context
    maxTokens: 200000,
    rationale: 'Full capability for complex tasks'
  },

  [TaskComplexity.CRITICAL]: {
    primary: 'claude-opus-4.1',    // $15/1M - Superior quality
    fallback: 'o3',                // $2/1M - Advanced reasoning
    maxTokens: 100000,
    rationale: 'Maximum quality for critical analysis'
  }
};

/**
 * Agent-specific cost optimization overrides
 */
const AgentCostOverrides = {
  // Ultra-low cost agents
  'issue-tracker': 'gpt-5-nano',
  'pr-manager': 'gpt-5-nano',
  'planner': 'gemini-2.0-flash',

  // Balanced cost agents
  'coder': 'gpt-5-mini',
  'backend-dev': 'gpt-5-mini',
  'frontend-developer': 'gpt-5', // Needs full capability for browser automation

  // Premium quality agents
  'reviewer': 'claude-opus-4.1',
  'security-manager': 'claude-opus-4.1',
  'production-validator': 'claude-opus-4.1',

  // Reasoning specialists
  'sparc-coord': 'o3-mini',
  'task-orchestrator': 'o3-mini'
};

/**
 * Calculate estimated cost for a task
 */
function calculateEstimatedCost(model, inputTokens, outputTokens) {
  const modelCost = ModelCosts[model];
  if (!modelCost) {
    console.warn(`Unknown model: ${model}`);
    return null;
  }

  const inputCost = (inputTokens / 1000000) * modelCost.input;
  const outputCost = (outputTokens / 1000000) * modelCost.output;

  return {
    model: modelCost.name,
    inputCost: inputCost.toFixed(4),
    outputCost: outputCost.toFixed(4),
    totalCost: (inputCost + outputCost).toFixed(4),
    savings: calculateSavings(model, inputTokens, outputTokens)
  };
}

/**
 * Calculate potential savings with optimizations
 */
function calculateSavings(model, inputTokens, outputTokens) {
  const savings = {
    promptCaching: 0,
    batchAPI: 0,
    total: 0
  };

  // 75% discount on repeated context (prompt caching)
  if (inputTokens > 50000) {
    const cachedTokens = inputTokens * 0.7; // Assume 70% can be cached
    const modelCost = ModelCosts[model];
    savings.promptCaching = (cachedTokens / 1000000) * modelCost.input * 0.75;
  }

  // 50% discount via Batch API (for non-real-time tasks)
  const totalCost = calculateEstimatedCost(model, inputTokens, outputTokens).totalCost;
  savings.batchAPI = parseFloat(totalCost) * 0.5;

  savings.total = (savings.promptCaching + savings.batchAPI).toFixed(4);

  return savings;
}

/**
 * Select optimal model based on task requirements
 */
function selectOptimalModel(taskComplexity, agentType, contextSize) {
  // Check for agent-specific overrides
  if (AgentCostOverrides[agentType]) {
    return AgentCostOverrides[agentType];
  }

  // Get strategy based on complexity
  const strategy = CostOptimizationStrategy[taskComplexity];

  // Adjust for context size requirements
  if (contextSize > 500000) {
    // Need large context model
    return 'gemini-2.5-pro'; // 1M token context
  }

  return strategy.primary;
}

/**
 * Get cost optimization recommendations
 */
function getOptimizationRecommendations(currentUsage) {
  const recommendations = [];

  // Analyze current usage patterns
  if (currentUsage.gpt5Usage > 100000) {
    recommendations.push({
      action: 'Migrate simple tasks to GPT-5 Nano',
      potentialSavings: `$${((currentUsage.gpt5Usage * 0.3 / 1000000) * (1.25 - 0.05)).toFixed(2)}`,
      implementation: 'Update agent-model-registry.js for low-complexity agents'
    });
  }

  if (!currentUsage.promptCachingEnabled) {
    recommendations.push({
      action: 'Enable prompt caching',
      potentialSavings: '75% on repeated contexts',
      implementation: 'Configure caching in API calls'
    });
  }

  if (!currentUsage.batchAPIUsage) {
    recommendations.push({
      action: 'Use Batch API for non-real-time tasks',
      potentialSavings: '50% on applicable workloads',
      implementation: 'Queue non-urgent tasks for batch processing'
    });
  }

  if (currentUsage.claudeOpusUsage > 50000) {
    recommendations.push({
      action: 'Reserve Claude Opus for critical quality gates only',
      potentialSavings: `$${((currentUsage.claudeOpusUsage * 0.5 / 1000000) * 15).toFixed(2)}`,
      implementation: 'Use O3 for reasoning, GPT-5 for general analysis'
    });
  }

  return recommendations;
}

module.exports = {
  ModelCosts,
  TaskComplexity,
  CostOptimizationStrategy,
  AgentCostOverrides,
  calculateEstimatedCost,
  calculateSavings,
  selectOptimalModel,
  getOptimizationRecommendations
};