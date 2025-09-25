/**
 * Model Selector
 * Business logic for selecting optimal AI model based on agent capabilities and context
 */

const { AIModel, ReasoningComplexity } = require('../constants/AIModelDefinitions');

class ModelSelector {
  /**
   * Select optimal model for an agent based on configuration and context
   * @param {object} config - Agent configuration
   * @param {object} context - Task context (optional)
   * @returns {object} Selected model information
   */
  select(config, context = {}) {
    // If config already has model selection, use it
    if (config.primaryModel && config.fallbackModel) {
      return {
        primaryModel: config.primaryModel,
        fallbackModel: config.fallbackModel,
        sequentialThinking: config.sequentialThinking || false,
        rationale: config.rationale || 'Pre-configured model selection'
      };
    }

    // Infer model based on capabilities
    const capabilities = config.capabilities || [];
    const complexity = config.reasoningComplexity || context.complexity || ReasoningComplexity.MEDIUM;
    const contextSize = context.contextSize || config.contextThreshold || 50000;

    return this.inferModelFromCapabilities(capabilities, complexity, contextSize);
  }

  /**
   * Infer best model from agent capabilities
   * @param {string[]} capabilities - Agent capabilities
   * @param {string} complexity - Reasoning complexity
   * @param {number} contextSize - Expected context size
   * @returns {object} Model selection
   */
  inferModelFromCapabilities(capabilities, complexity, contextSize) {
    // Browser automation & visual capabilities -> GPT-5
    if (this.hasBrowserCapabilities(capabilities)) {
      return {
        primaryModel: AIModel.GPT5,
        fallbackModel: AIModel.CLAUDE_SONNET,
        sequentialThinking: false,
        rationale: 'Browser automation requires GPT-5 with Codex CLI'
      };
    }

    // Quality assurance & analysis -> Claude Opus (check BEFORE research)
    if (this.hasQualityCapabilities(capabilities)) {
      return {
        primaryModel: AIModel.CLAUDE_OPUS,
        fallbackModel: AIModel.GPT5,
        sequentialThinking: false,
        rationale: 'Quality analysis requires Claude Opus 4.1 (72.7% SWE-bench)'
      };
    }

    // Large context research -> Gemini Pro
    if (contextSize > 200000 || this.hasResearchCapabilities(capabilities)) {
      return {
        primaryModel: AIModel.GEMINI_PRO,
        fallbackModel: AIModel.CLAUDE_OPUS,
        sequentialThinking: false,
        rationale: 'Large context analysis requires Gemini 2.5 Pro'
      };
    }

    // Coordination & orchestration -> Claude Sonnet with sequential thinking
    if (this.hasCoordinationCapabilities(capabilities)) {
      return {
        primaryModel: AIModel.CLAUDE_SONNET,
        fallbackModel: AIModel.GEMINI_PRO,
        sequentialThinking: true,
        rationale: 'Coordination requires Claude Sonnet 4 with sequential thinking'
      };
    }

    // Autonomous coding -> GPT-5
    if (this.hasCodingCapabilities(capabilities)) {
      return {
        primaryModel: AIModel.GPT5,
        fallbackModel: AIModel.CLAUDE_OPUS,
        sequentialThinking: false,
        rationale: 'Autonomous coding requires GPT-5 with long session support'
      };
    }

    // Fast/routine operations -> Gemini Flash
    if (complexity === ReasoningComplexity.LOW || this.hasRoutineCapabilities(capabilities)) {
      return {
        primaryModel: AIModel.GEMINI_FLASH,
        fallbackModel: AIModel.CLAUDE_SONNET,
        sequentialThinking: true,
        rationale: 'Routine operations use cost-effective Gemini Flash with sequential thinking'
      };
    }

    // Default: GPT-5 for general purpose
    return {
      primaryModel: AIModel.GPT5,
      fallbackModel: AIModel.CLAUDE_SONNET,
      sequentialThinking: false,
      rationale: 'General purpose agent uses GPT-5'
    };
  }

  /**
   * Check if agent has browser automation capabilities
   */
  hasBrowserCapabilities(capabilities) {
    const browserKeywords = [
      'browser_automation', 'screenshot_capture', 'ui_testing',
      'visual_validation', 'playwright', 'puppeteer', 'selenium'
    ];
    return capabilities.some(cap =>
      browserKeywords.some(keyword => cap.toLowerCase().includes(keyword))
    );
  }

  /**
   * Check if agent has research capabilities
   */
  hasResearchCapabilities(capabilities) {
    const researchKeywords = [
      'research', 'analysis', 'large_context', 'documentation',
      'pattern_recognition', 'web_search', 'comprehensive'
    ];
    return capabilities.some(cap =>
      researchKeywords.some(keyword => cap.toLowerCase().includes(keyword))
    );
  }

  /**
   * Check if agent has quality assurance capabilities
   */
  hasQualityCapabilities(capabilities) {
    const qualityKeywords = [
      'quality', 'review', 'testing', 'validation', 'security',
      'audit', 'compliance', 'static_analysis', 'vulnerability'
    ];
    return capabilities.some(cap =>
      qualityKeywords.some(keyword => cap.toLowerCase().includes(keyword))
    );
  }

  /**
   * Check if agent has coordination capabilities
   */
  hasCoordinationCapabilities(capabilities) {
    const coordKeywords = [
      'coordination', 'orchestration', 'management', 'delegation',
      'consensus', 'distributed', 'hierarchical', 'mesh'
    ];
    return capabilities.some(cap =>
      coordKeywords.some(keyword => cap.toLowerCase().includes(keyword))
    );
  }

  /**
   * Check if agent has coding capabilities
   */
  hasCodingCapabilities(capabilities) {
    const codingKeywords = [
      'coding', 'implementation', 'development', 'autonomous',
      'programming', 'tdd', 'backend', 'frontend', 'fullstack'
    ];
    return capabilities.some(cap =>
      codingKeywords.some(keyword => cap.toLowerCase().includes(keyword))
    );
  }

  /**
   * Check if agent has routine/simple capabilities
   */
  hasRoutineCapabilities(capabilities) {
    const routineKeywords = [
      'routine', 'simple', 'pr_management', 'issue_tracking',
      'documentation', 'formatting', 'organization'
    ];
    return capabilities.some(cap =>
      routineKeywords.some(keyword => cap.toLowerCase().includes(keyword))
    );
  }

  /**
   * Get all agents using a specific model
   * @param {string} model - AI model name
   * @param {object} allConfigs - All agent configurations
   * @returns {string[]} List of agent types using this model
   */
  getAgentsByModel(model, allConfigs) {
    return Object.entries(allConfigs)
      .filter(([_, config]) => config.primaryModel === model)
      .map(([agentType, _]) => agentType);
  }

  /**
   * Should use sequential thinking for this agent?
   * @param {object} config - Agent configuration
   * @returns {boolean} True if sequential thinking should be enabled
   */
  shouldUseSequentialThinking(config) {
    return config.sequentialThinking || false;
  }
}

module.exports = ModelSelector;