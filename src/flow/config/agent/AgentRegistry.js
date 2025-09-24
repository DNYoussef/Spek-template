/**
 * Agent Registry - Facade Pattern
 * Simple interface that delegates to specialized components
 * Maintains backward compatibility with original agent-model-registry.js
 */

const AgentConfigLoader = require('./AgentConfigLoader');
const ModelSelector = require('./ModelSelector');
const MCPServerAssigner = require('./MCPServerAssigner');
const CapabilityMapper = require('./CapabilityMapper');
const { AIModel, ReasoningComplexity } = require('../constants/AIModelDefinitions');

class AgentRegistry {
  constructor() {
    this.loader = new AgentConfigLoader();
    this.modelSelector = new ModelSelector();
    this.mcpAssigner = new MCPServerAssigner();
    this.capabilityMapper = new CapabilityMapper();
  }

  /**
   * Get complete model configuration for an agent (backward compatible)
   * @param {string} agentType - The type of agent
   * @returns {object} Complete model configuration
   */
  getAgentModelConfig(agentType) {
    // Load base configuration
    let config = this.loader.load(agentType);

    // If not found, use default
    if (!config) {
      config = this.loader.getDefaultConfig();
      config.agentType = agentType;
      config.capabilities = this.capabilityMapper.getCapabilities(agentType);
      config.reasoningComplexity = this.capabilityMapper.getReasoningComplexity(agentType);
      config.contextThreshold = this.capabilityMapper.getContextThreshold(agentType);
      config.sequentialThinking = this.capabilityMapper.shouldUseSequentialThinking(agentType);
    }

    // Ensure model selection
    const modelInfo = this.modelSelector.select(config);
    config.primaryModel = modelInfo.primaryModel;
    config.fallbackModel = modelInfo.fallbackModel;
    config.sequentialThinking = modelInfo.sequentialThinking;

    // Ensure MCP server assignment
    config.mcpServers = this.mcpAssigner.assign(config);

    return config;
  }

  /**
   * Check if agent should use sequential thinking (backward compatible)
   * @param {string} agentType - The type of agent
   * @returns {boolean} Whether to enable sequential thinking
   */
  shouldUseSequentialThinking(agentType) {
    const config = this.getAgentModelConfig(agentType);
    return config.sequentialThinking;
  }

  /**
   * Get all agents that use a specific model (backward compatible)
   * @param {string} model - The AI model
   * @returns {array} List of agent types using this model
   */
  getAgentsByModel(model) {
    const allConfigs = this.loader.loadAll();
    return this.modelSelector.getAgentsByModel(model, allConfigs);
  }

  /**
   * Get performance capabilities for an agent (backward compatible)
   * @param {string} agentType - The type of agent
   * @returns {array} List of capabilities
   */
  getAgentCapabilities(agentType) {
    const config = this.getAgentModelConfig(agentType);
    return config.capabilities || [];
  }

  /**
   * List all registered agent types
   * @returns {string[]} Array of agent type names
   */
  listAgentTypes() {
    return this.loader.listAgentTypes();
  }

  /**
   * Check if agent type exists
   * @param {string} agentType - The type of agent
   * @returns {boolean} True if agent type is registered
   */
  exists(agentType) {
    return this.loader.exists(agentType);
  }

  /**
   * Get recommended MCP servers for a task
   * @param {string} taskDescription - Task description
   * @returns {string[]} Recommended MCP servers
   */
  recommendMCPServersForTask(taskDescription) {
    return this.mcpAssigner.recommendForTask(taskDescription);
  }

  /**
   * Get all agents with a specific capability
   * @param {string} capability - Capability to search for
   * @returns {string[]} Agent types with this capability
   */
  getAgentsByCapability(capability) {
    const allConfigs = this.loader.loadAll();
    return this.capabilityMapper.findAgentsWithCapability(capability, allConfigs);
  }

  /**
   * Get all agents using a specific MCP server
   * @param {string} mcpServer - MCP server name
   * @returns {string[]} Agent types using this MCP server
   */
  getAgentsByMCPServer(mcpServer) {
    const allConfigs = this.loader.loadAll();
    return this.mcpAssigner.getAgentsByMCPServer(mcpServer, allConfigs);
  }

  /**
   * Get capability categories with descriptions
   * @returns {object} Capability categories
   */
  getCapabilityCategories() {
    return this.capabilityMapper.getCapabilityCategories();
  }

  /**
   * Get statistics about agent registry
   * @returns {object} Registry statistics
   */
  getStatistics() {
    const allTypes = this.listAgentTypes();
    const allConfigs = this.loader.loadAll();

    // Model distribution
    const modelDistribution = {};
    for (const type of allTypes) {
      const config = this.getAgentModelConfig(type);
      const model = config.primaryModel;
      modelDistribution[model] = (modelDistribution[model] || 0) + 1;
    }

    // Capability distribution
    const capabilityCount = {};
    for (const type of allTypes) {
      const capabilities = this.getAgentCapabilities(type);
      for (const cap of capabilities) {
        capabilityCount[cap] = (capabilityCount[cap] || 0) + 1;
      }
    }

    // MCP server usage
    const mcpServerUsage = {};
    for (const type of allTypes) {
      const config = this.getAgentModelConfig(type);
      for (const server of config.mcpServers) {
        mcpServerUsage[server] = (mcpServerUsage[server] || 0) + 1;
      }
    }

    return {
      totalAgents: allTypes.length,
      modelDistribution,
      topCapabilities: Object.entries(capabilityCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      mcpServerUsage,
      sequentialThinkingAgents: allTypes.filter(t => this.shouldUseSequentialThinking(t)).length
    };
  }
}

// Export singleton instance (backward compatible)
const registry = new AgentRegistry();

module.exports = {
  AIModel,
  ReasoningComplexity,
  getAgentModelConfig: (agentType) => registry.getAgentModelConfig(agentType),
  shouldUseSequentialThinking: (agentType) => registry.shouldUseSequentialThinking(agentType),
  getAgentsByModel: (model) => registry.getAgentsByModel(model),
  getAgentCapabilities: (agentType) => registry.getAgentCapabilities(agentType),
  AgentRegistry,
  registry
};