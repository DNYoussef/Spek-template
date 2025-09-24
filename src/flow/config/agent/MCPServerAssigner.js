/**
 * MCP Server Assigner
 * Rules engine for assigning MCP servers to agents based on capabilities
 */

class MCPServerAssigner {
  constructor() {
    // Base MCP servers applied to ALL agents
    this.baseMCPServers = ['claude-flow', 'memory'];

    // Capability to MCP server mapping
    this.capabilityMCPMap = {
      // Browser & Visual
      'browser_automation': ['playwright', 'puppeteer'],
      'screenshot_capture': ['playwright', 'puppeteer'],
      'ui_testing': ['playwright', 'puppeteer'],
      'visual_validation': ['playwright', 'figma'],
      'visual_design': ['figma', 'playwright'],
      'mobile_testing': ['playwright', 'puppeteer'],

      // Research & Documentation
      'research': ['deepwiki', 'firecrawl', 'ref', 'context7'],
      'large_context_analysis': ['deepwiki', 'context7'],
      'web_search': ['firecrawl', 'deepwiki'],
      'documentation': ['ref', 'markitdown', 'context7'],
      'technical_writing': ['markitdown', 'ref'],

      // Development
      'coding': ['github', 'filesystem'],
      'autonomous_coding': ['github', 'filesystem'],
      'implementation': ['github', 'filesystem'],
      'github_integration': ['github'],
      'file_operations': ['filesystem'],

      // Quality & Testing
      'quality_analysis': ['eva', 'github'],
      'testing': ['eva', 'playwright', 'github'],
      'performance_testing': ['eva'],
      'security_analysis': ['eva'],
      'validation': ['eva'],

      // Coordination
      'orchestration': ['sequential-thinking', 'plane'],
      'coordination': ['sequential-thinking', 'plane'],
      'project_management': ['plane', 'github'],
      'task_management': ['sequential-thinking', 'plane'],

      // Desktop Automation
      'desktop_automation': ['desktop-automation', 'eva'],
      'desktop_testing': ['desktop-automation', 'playwright', 'eva']
    };
  }

  /**
   * Assign MCP servers to an agent based on capabilities
   * @param {object} config - Agent configuration with capabilities
   * @returns {string[]} Array of MCP server names
   */
  assign(config) {
    // If config already has MCP servers, use them
    if (config.mcpServers && config.mcpServers.length > 0) {
      return config.mcpServers;
    }

    // Start with base servers
    const servers = new Set(this.baseMCPServers);

    // Add servers based on capabilities
    const capabilities = config.capabilities || [];
    for (const capability of capabilities) {
      const mcpServers = this.getMCPServersForCapability(capability);
      mcpServers.forEach(server => servers.add(server));
    }

    // Add sequential thinking if enabled
    if (config.sequentialThinking) {
      servers.add('sequential-thinking');
    }

    return Array.from(servers);
  }

  /**
   * Get MCP servers for a specific capability
   * @param {string} capability - Agent capability
   * @returns {string[]} Array of MCP servers for this capability
   */
  getMCPServersForCapability(capability) {
    const normalized = capability.toLowerCase().replace(/_/g, '_');

    // Direct match
    if (this.capabilityMCPMap[normalized]) {
      return this.capabilityMCPMap[normalized];
    }

    // Partial match
    for (const [key, servers] of Object.entries(this.capabilityMCPMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return servers;
      }
    }

    return [];
  }

  /**
   * Get all agents that use a specific MCP server
   * @param {string} mcpServer - MCP server name
   * @param {object} allConfigs - All agent configurations
   * @returns {string[]} Array of agent types using this MCP server
   */
  getAgentsByMCPServer(mcpServer, allConfigs) {
    const agents = [];

    for (const [agentType, config] of Object.entries(allConfigs)) {
      const servers = this.assign(config);
      if (servers.includes(mcpServer)) {
        agents.push(agentType);
      }
    }

    return agents;
  }

  /**
   * Validate MCP server assignments
   * @param {string[]} mcpServers - Assigned MCP servers
   * @returns {object} Validation result
   */
  validate(mcpServers) {
    const requiredServers = this.baseMCPServers;
    const missing = requiredServers.filter(server => !mcpServers.includes(server));

    return {
      valid: missing.length === 0,
      missing,
      total: mcpServers.length,
      hasBase: missing.length === 0
    };
  }

  /**
   * Add custom MCP server mapping
   * @param {string} capability - Capability keyword
   * @param {string[]} mcpServers - MCP servers to assign
   */
  addMapping(capability, mcpServers) {
    this.capabilityMCPMap[capability.toLowerCase()] = mcpServers;
  }

  /**
   * Get recommended MCP servers for a task description
   * @param {string} taskDescription - Task description text
   * @returns {string[]} Recommended MCP servers
   */
  recommendForTask(taskDescription) {
    const lower = taskDescription.toLowerCase();
    const servers = new Set(this.baseMCPServers);

    // Analyze task description for keywords
    if (lower.includes('browser') || lower.includes('screenshot') || lower.includes('ui')) {
      ['playwright', 'puppeteer'].forEach(s => servers.add(s));
    }

    if (lower.includes('research') || lower.includes('documentation') || lower.includes('analyze')) {
      ['deepwiki', 'firecrawl', 'ref', 'context7'].forEach(s => servers.add(s));
    }

    if (lower.includes('code') || lower.includes('implement') || lower.includes('github')) {
      ['github', 'filesystem'].forEach(s => servers.add(s));
    }

    if (lower.includes('test') || lower.includes('quality') || lower.includes('performance')) {
      ['eva', 'playwright'].forEach(s => servers.add(s));
    }

    if (lower.includes('coordinate') || lower.includes('orchestrate') || lower.includes('manage')) {
      ['sequential-thinking', 'plane'].forEach(s => servers.add(s));
    }

    if (lower.includes('desktop') || lower.includes('automation')) {
      ['desktop-automation', 'eva'].forEach(s => servers.add(s));
    }

    return Array.from(servers);
  }
}

module.exports = MCPServerAssigner;