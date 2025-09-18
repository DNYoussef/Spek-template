/**
 * SPEK Model Selector
 * Intelligent AI model selection and configuration system
 */

const {
  AIModel,
  ReasoningComplexity,
  getAgentModelConfig,
  shouldUseSequentialThinking
} = require('../config/agent-model-registry');

// Load MCP server configuration
const mcpConfig = require('../config/mcp-multi-platform.json');

/**
 * Model availability checker for different platforms
 */
const ModelAvailability = {
  // Gemini CLI models
  [AIModel.GEMINI_PRO]: { platform: 'gemini', available: true, free: true },
  [AIModel.GEMINI_FLASH]: { platform: 'gemini', available: true, free: true },

  // OpenAI Codex models
  [AIModel.GPT5]: { platform: 'openai', available: true, free: false },
  [AIModel.GPT5_CODEX]: { platform: 'openai', available: true, free: false },

  // Claude Code models
  [AIModel.CLAUDE_OPUS]: { platform: 'claude', available: true, free: false },
  [AIModel.CLAUDE_SONNET]: { platform: 'claude', available: true, free: false }
};

/**
 * Platform-specific model initialization
 */
const PlatformInitializers = {
  gemini: {
    command: 'gemini',
    modelFlag: '--model',
    sequentialThinkingFlag: '--reasoning-mode sequential'
  },
  openai: {
    command: 'codex',
    modelFlag: '/model',
    approvalMode: '--approval-mode auto'
  },
  claude: {
    command: 'claude',
    modelFlag: '--model',
    mcpServer: 'sequential-thinking'
  }
};

/**
 * Dynamic model selection based on task complexity and availability
 */
class ModelSelector {
  constructor() {
    this.modelCache = new Map();
    this.platformStatus = new Map();
    this.initializePlatformStatus();
  }

  /**
   * Initialize platform availability status
   */
  initializePlatformStatus() {
    Object.entries(ModelAvailability).forEach(([model, config]) => {
      this.platformStatus.set(config.platform, {
        available: config.available,
        lastCheck: Date.now(),
        models: this.getModelsByPlatform(config.platform)
      });
    });
  }

  /**
   * Get all models available on a specific platform
   */
  getModelsByPlatform(platform) {
    return Object.entries(ModelAvailability)
      .filter(([model, config]) => config.platform === platform)
      .map(([model, config]) => model);
  }

  /**
   * Select optimal model for agent with fallback logic
   * @param {string} agentType - The type of agent
   * @param {object} taskContext - Optional task context for dynamic selection
   * @returns {object} Model selection result
   */
  selectModel(agentType, taskContext = {}) {
    const config = getAgentModelConfig(agentType);
    const cacheKey = `${agentType}-${JSON.stringify(taskContext)}`;

    // Check cache first
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey);
    }

    let selectedModel = config.primaryModel;
    let platform = ModelAvailability[selectedModel]?.platform;
    let sequentialThinking = config.sequentialThinking;
    let mcpServers = config.mcpServers || ['claude-flow', 'memory'];

    // Dynamic model selection based on task context
    if (taskContext.complexity === 'high' && taskContext.contextSize > config.contextThreshold) {
      // Prefer large context models for complex tasks
      if (taskContext.contextSize > 500000) {
        selectedModel = AIModel.GEMINI_PRO;
        platform = 'gemini';
      }
    }

    // Browser automation override for frontend tasks
    if (this.requiresBrowserAutomation(agentType, taskContext)) {
      selectedModel = AIModel.GPT5_CODEX;
      platform = 'openai';
      sequentialThinking = false;
      // Ensure browser automation MCP servers are included
      if (!mcpServers.includes('playwright')) {
        mcpServers = [...mcpServers, 'playwright', 'puppeteer'];
      }
    }

    // Desktop automation override for desktop tasks
    if (this.requiresDesktopAutomation(agentType, taskContext)) {
      // Desktop QA agents use Claude Opus for superior analysis
      if (agentType === 'desktop-qa-specialist') {
        selectedModel = AIModel.CLAUDE_OPUS;
        platform = 'claude';
      } else {
        selectedModel = AIModel.GPT5_CODEX;
        platform = 'openai';
      }
      // Ensure desktop automation MCP server is included
      if (!mcpServers.includes('desktop-automation')) {
        mcpServers = [...mcpServers, 'desktop-automation'];
      }
    }

    // Add sequential thinking MCP server if needed
    if (sequentialThinking && !mcpServers.includes('sequential-thinking')) {
      mcpServers = [...mcpServers, 'sequential-thinking'];
    }

    // Check platform availability and fallback if needed
    if (!this.isPlatformAvailable(platform)) {
      const fallbackResult = this.selectFallbackModel(config);
      selectedModel = fallbackResult.model;
      platform = fallbackResult.platform;
      sequentialThinking = fallbackResult.sequentialThinking;
    }

    const result = {
      agent: agentType,
      model: selectedModel,
      platform: platform,
      sequentialThinking: sequentialThinking,
      mcpServers: mcpServers,
      config: config,
      initialization: this.generateInitializationCommand(selectedModel, platform, sequentialThinking, mcpServers),
      rationale: this.generateSelectionRationale(agentType, selectedModel, config, taskContext)
    };

    // Cache the result
    this.modelCache.set(cacheKey, result);

    return result;
  }

  /**
   * Check if agent requires browser automation capabilities
   */
  requiresBrowserAutomation(agentType, taskContext) {
    const browserAutomationAgents = [
      'frontend-developer',
      'ui-designer',
      'mobile-dev',
      'rapid-prototyper'
    ];

    const browserKeywords = [
      'browser', 'screenshot', 'ui', 'frontend', 'visual', 'interface',
      'responsive', 'mobile', 'device', 'viewport', 'styling'
    ];

    return browserAutomationAgents.includes(agentType) ||
           (taskContext.description && browserKeywords.some(keyword =>
             taskContext.description.toLowerCase().includes(keyword)));
  }

  /**
   * Check if agent requires desktop automation capabilities
   */
  requiresDesktopAutomation(agentType, taskContext) {
    const desktopAutomationAgents = [
      'desktop-automator',
      'ui-tester',
      'app-integration-tester',
      'desktop-qa-specialist',
      'desktop-workflow-automator'
    ];

    const desktopKeywords = [
      'desktop', 'application', 'window', 'native app', 'system',
      'automation', 'click', 'type', 'keyboard', 'mouse', 'gui'
    ];

    return desktopAutomationAgents.includes(agentType) ||
           (taskContext.description && desktopKeywords.some(keyword =>
             taskContext.description.toLowerCase().includes(keyword)));
  }

  /**
   * Select fallback model when primary platform is unavailable
   */
  selectFallbackModel(config) {
    const fallbackModel = config.fallbackModel || AIModel.GPT5;
    const fallbackPlatform = ModelAvailability[fallbackModel]?.platform || 'openai';

    // If fallback platform is also unavailable, try free options
    if (!this.isPlatformAvailable(fallbackPlatform)) {
      return {
        model: AIModel.GEMINI_FLASH,
        platform: 'gemini',
        sequentialThinking: true
      };
    }

    return {
      model: fallbackModel,
      platform: fallbackPlatform,
      sequentialThinking: config.sequentialThinking
    };
  }

  /**
   * Check if platform is currently available
   */
  isPlatformAvailable(platform) {
    const status = this.platformStatus.get(platform);
    return status && status.available;
  }

  /**
   * Generate platform-specific initialization command
   */
  generateInitializationCommand(model, platform, sequentialThinking, mcpServers = []) {
    const platformConfig = PlatformInitializers[platform];
    if (!platformConfig) {
      return null;
    }

    let command = platformConfig.command;

    // Add model specification
    if (platformConfig.modelFlag) {
      command += ` ${platformConfig.modelFlag} ${model}`;
    }

    // Add sequential thinking if enabled
    if (sequentialThinking) {
      if (platform === 'gemini' && platformConfig.sequentialThinkingFlag) {
        command += ` ${platformConfig.sequentialThinkingFlag}`;
      } else if (platform === 'claude' && platformConfig.mcpServer) {
        command += ` --mcp-server ${platformConfig.mcpServer}`;
      }
    }

    // Add MCP servers for enhanced capabilities
    if (mcpServers.length > 0) {
      const mcpFlags = mcpServers
        .filter(server => server !== 'sequential-thinking') // Already handled above
        .map(server => `--mcp-server ${server}`)
        .join(' ');
      if (mcpFlags) {
        command += ` ${mcpFlags}`;
      }
    }

    // Add platform-specific flags
    if (platform === 'openai' && platformConfig.approvalMode) {
      command += ` ${platformConfig.approvalMode}`;
    }

    return command;
  }

  /**
   * Generate human-readable rationale for model selection
   */
  generateSelectionRationale(agentType, selectedModel, config, taskContext) {
    let rationale = config.rationale || 'Optimal model for agent capabilities';

    // Add context-specific rationale
    if (taskContext.complexity === 'high') {
      rationale += ' | High complexity task requires advanced reasoning';
    }

    if (taskContext.contextSize > 100000) {
      rationale += ' | Large context size benefits from extended context models';
    }

    if (this.requiresBrowserAutomation(agentType, taskContext)) {
      rationale += ' | Browser automation capabilities required for visual validation';
    }

    if (this.requiresDesktopAutomation(agentType, taskContext)) {
      rationale += ' | Desktop automation capabilities required for native application interaction';
    }

    // Add MCP server capabilities info
    if (config.mcpServers && config.mcpServers.length > 0) {
      const serverCount = config.mcpServers.length;
      rationale += ` | Enhanced with ${serverCount} MCP server${serverCount > 1 ? 's' : ''} (${config.mcpServers.join(', ')})`;
    }

    return rationale;
  }

  /**
   * Get model configuration summary for debugging
   */
  getConfigurationSummary() {
    const summary = {
      platforms: {},
      modelCounts: {},
      sequentialThinkingAgents: [],
      mcpServerUsage: {},
      agentCapabilities: {}
    };

    const registry = require('../config/agent-model-registry').AGENT_MODEL_REGISTRY;

    // Count models by platform
    Object.entries(ModelAvailability).forEach(([model, config]) => {
      summary.platforms[config.platform] = summary.platforms[config.platform] || [];
      summary.platforms[config.platform].push(model);

      summary.modelCounts[model] = this.getAgentsByModel(model).length;
    });

    // Analyze agents and their configurations
    Object.entries(registry).forEach(([agentType, config]) => {
      // Track sequential thinking usage
      if (shouldUseSequentialThinking(agentType)) {
        summary.sequentialThinkingAgents.push(agentType);
      }

      // Track MCP server usage
      if (config.mcpServers) {
        config.mcpServers.forEach(server => {
          summary.mcpServerUsage[server] = summary.mcpServerUsage[server] || [];
          summary.mcpServerUsage[server].push(agentType);
        });
      }

      // Track capabilities
      if (config.capabilities) {
        config.capabilities.forEach(capability => {
          summary.agentCapabilities[capability] = summary.agentCapabilities[capability] || [];
          summary.agentCapabilities[capability].push(agentType);
        });
      }
    });

    return summary;
  }

  /**
   * Validate model selection for an agent
   */
  validateSelection(agentType, taskContext = {}) {
    const selection = this.selectModel(agentType, taskContext);
    const validation = {
      valid: true,
      warnings: [],
      errors: []
    };

    // Check platform availability
    if (!this.isPlatformAvailable(selection.platform)) {
      validation.warnings.push(`Platform ${selection.platform} may not be available`);
    }

    // Check context size limits
    if (taskContext.contextSize > 1000000 && selection.model !== AIModel.GEMINI_PRO) {
      validation.warnings.push('Large context size may benefit from Gemini Pro (1M tokens)');
    }

    // Check browser automation requirements
    if (this.requiresBrowserAutomation(agentType, taskContext) &&
        selection.model !== AIModel.GPT5_CODEX) {
      validation.errors.push('Browser automation requires GPT-5 Codex');
    }

    return validation;
  }

  /**
   * Clear model cache (useful for testing or config changes)
   */
  clearCache() {
    this.modelCache.clear();
  }

  /**
   * Get agents using a specific model
   */
  getAgentsByModel(model) {
    const registry = require('../config/agent-model-registry').AGENT_MODEL_REGISTRY;
    return Object.entries(registry)
      .filter(([agentType, config]) => config.primaryModel === model)
      .map(([agentType, config]) => agentType);
  }
}

// Singleton instance for global use
const modelSelector = new ModelSelector();

module.exports = {
  ModelSelector,
  modelSelector,
  ModelAvailability,
  PlatformInitializers
};