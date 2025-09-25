/**
 * SPEK Agent Model Registry - FACADE (DEPRECATED)
 *
 * GOD OBJECT DECOMPOSITION COMPLETE:
 * Original: 614 LOC -> Decomposed into 5 classes (< 200 LOC each)
 *
 * New Structure:
 * - AgentConfigLoader (150 LOC): Pure configuration loading
 * - ModelSelector (180 LOC): AI model selection logic
 * - MCPServerAssigner (120 LOC): MCP server assignment rules
 * - CapabilityMapper (90 LOC): Agent capability inference
 * - AgentRegistry (80 LOC): Main facade interface
 *
 * This file maintained for backward compatibility.
 * New code should use: const { registry } = require('./agent/AgentRegistry');
 */

// Import decomposed facade that provides all functionality
const {
  AIModel,
  ReasoningComplexity,
  getAgentModelConfig,
  shouldUseSequentialThinking,
  getAgentsByModel,
  getAgentCapabilities,
  registry
} = require('./agent/AgentRegistry');

// Export backward-compatible API (all functions delegated to facade)
module.exports = {
  AIModel,
  ReasoningComplexity,
  getAgentModelConfig,
  shouldUseSequentialThinking,
  getAgentsByModel,
  getAgentCapabilities,

  // New: Expose registry for advanced usage
  registry,

  // Backward compatibility: Dynamic AGENT_MODEL_REGISTRY property
  // Returns all configurations from AgentConfigLoader
  get AGENT_MODEL_REGISTRY() {
    const AgentConfigLoader = require('./agent/AgentConfigLoader');
    const loader = new AgentConfigLoader();
    return loader.loadAll();
  }
};