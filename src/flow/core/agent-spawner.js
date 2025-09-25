/**
 * SPEK Enhanced Agent Spawner
 * Automatic model assignment and multi-platform AI integration
 */

const { modelSelector } = require('./model-selector');
const { sequentialThinkingIntegrator } = require('./sequential-thinking-integration');
const { fsmEnhancer } = require('./fsm-agent-enhancer');

/**
 * Enhanced Agent Spawner with Multi-AI Platform Support
 */
class AgentSpawner {
  constructor() {
    this.activeAgents = new Map();
    this.spawnHistory = [];
    this.platformConnections = new Map();
    this.initializePlatforms();
  }

  /**
   * Initialize connections to all AI platforms
   */
  initializePlatforms() {
    this.platformConnections.set('gemini', {
      available: true,
      command: 'gemini',
      models: ['gemini-2.5-pro', 'gemini-2.5-flash']
    });

    this.platformConnections.set('openai', {
      available: true,
      command: 'codex',
      models: ['gpt-5', 'gpt-5-codex']
    });

    this.platformConnections.set('claude', {
      available: true,
      command: 'claude',
      models: ['claude-opus-4.1', 'claude-sonnet-4']
    });
  }

  /**
   * Spawn agent with automatic model selection and optimization
   * @param {string} agentType - Type of agent to spawn
   * @param {string} taskDescription - Description of the task
   * @param {object} options - Additional spawn options
   * @returns {object} Spawn result with agent configuration
   */
  async spawnAgent(agentType, taskDescription, options = {}) {
    const taskContext = this.analyzeTaskContext(taskDescription, options);
    const modelSelection = modelSelector.selectModel(agentType, taskContext);

    // Validate model selection
    const validation = modelSelector.validateSelection(agentType, taskContext);
    if (!validation.valid) {
      throw new Error(`Invalid model selection for ${agentType}: ${validation.errors.join(', ')}`);
    }

    // Initialize sequential thinking if required
    let sequentialThinking = null;
    if (modelSelection.sequentialThinking) {
      sequentialThinking = sequentialThinkingIntegrator.initializeForAgent(agentType, taskContext);
    }

    // Enhance configuration with FSM capabilities if applicable
    const baseConfig = modelSelection.config;
    const enhancedConfig = fsmEnhancer.enhanceAgent(baseConfig, agentType);

    // Generate enhanced agent prompt with model-specific optimizations
    const basePrompt = this.generateEnhancedPrompt(
      agentType,
      taskDescription,
      modelSelection,
      sequentialThinking
    );

    // Inject FSM prompt if configured
    const enhancedPrompt = fsmEnhancer.injectFSMPrompt(basePrompt, enhancedConfig);

    // Enhance task description with FSM requirements
    const enhancedTaskDescription = fsmEnhancer.enhanceTaskDescription(taskDescription, enhancedConfig);

    // Create agent configuration
    const agentConfig = {
      id: this.generateAgentId(agentType),
      type: agentType,
      model: modelSelection.model,
      platform: modelSelection.platform,
      taskDescription: enhancedTaskDescription,
      prompt: enhancedPrompt,
      sequentialThinking: sequentialThinking,
      mcpServers: enhancedConfig.mcpServers || modelSelection.mcpServers || [],
      capabilities: enhancedConfig.capabilities || modelSelection.config.capabilities,
      initialization: modelSelection.initialization,
      spawnTime: new Date().toISOString(),
      context: taskContext,
      fsmMetadata: enhancedConfig.fsmMetadata || null
    };

    // Execute platform-specific spawn
    const spawnResult = await this.executePlatformSpawn(agentConfig);

    // Track active agent
    this.activeAgents.set(agentConfig.id, agentConfig);
    this.spawnHistory.push({
      agentId: agentConfig.id,
      agentType: agentType,
      model: modelSelection.model,
      platform: modelSelection.platform,
      spawnTime: agentConfig.spawnTime,
      success: spawnResult.success
    });

    return {
      success: spawnResult.success,
      agentId: agentConfig.id,
      agentConfig: agentConfig,
      modelSelection: modelSelection,
      spawnResult: spawnResult,
      rationale: modelSelection.rationale
    };
  }

  /**
   * Analyze task context for optimal model selection
   */
  analyzeTaskContext(taskDescription, options) {
    const context = {
      description: taskDescription,
      complexity: options.complexity || this.assessComplexity(taskDescription),
      contextSize: options.contextSize || this.estimateContextSize(taskDescription),
      requiresBrowser: this.detectBrowserRequirement(taskDescription),
      requiresDesktop: this.detectDesktopRequirement(taskDescription),
      requiresLargeContext: this.detectLargeContextRequirement(taskDescription),
      deadline: options.deadline || null,
      priority: options.priority || 'medium'
    };

    return context;
  }

  /**
   * Assess task complexity from description
   */
  assessComplexity(description) {
    const highComplexityKeywords = [
      'architecture', 'system design', 'integration', 'optimization',
      'complex', 'enterprise', 'scalable', 'distributed'
    ];

    const mediumComplexityKeywords = [
      'implement', 'create', 'build', 'develop', 'design'
    ];

    const lowComplexityKeywords = [
      'fix', 'update', 'modify', 'simple', 'quick'
    ];

    const desc = description.toLowerCase();

    if (highComplexityKeywords.some(keyword => desc.includes(keyword))) {
      return 'high';
    }

    if (mediumComplexityKeywords.some(keyword => desc.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Estimate context size requirement
   */
  estimateContextSize(description) {
    const largeContextKeywords = [
      'codebase', 'entire project', 'all files', 'comprehensive',
      'full system', 'complete analysis'
    ];

    const desc = description.toLowerCase();
    if (largeContextKeywords.some(keyword => desc.includes(keyword))) {
      return Math.floor(Math.random() * 500000) + 200000; // 200K-700K tokens
    }

    return Math.floor(Math.random() * 50000) + 10000; // 10K-60K tokens
  }

  /**
   * Detect if task requires browser automation
   */
  detectBrowserRequirement(description) {
    const browserKeywords = [
      'frontend', 'ui', 'interface', 'browser', 'screenshot',
      'visual', 'responsive', 'mobile', 'styling', 'css',
      'react', 'vue', 'angular', 'html'
    ];

    return browserKeywords.some(keyword =>
      description.toLowerCase().includes(keyword));
  }

  /**
   * Detect if task requires desktop automation
   */
  detectDesktopRequirement(description) {
    const desktopKeywords = [
      'desktop', 'application', 'native app', 'window', 'system',
      'automation', 'click', 'type', 'keyboard', 'mouse', 'gui',
      'file explorer', 'windows', 'macos', 'linux'
    ];

    return desktopKeywords.some(keyword =>
      description.toLowerCase().includes(keyword));
  }

  /**
   * Detect if task requires large context processing
   */
  detectLargeContextRequirement(description) {
    const largeContextKeywords = [
      'analyze entire', 'full codebase', 'comprehensive review',
      'complete documentation', 'all components', 'system-wide'
    ];

    return largeContextKeywords.some(keyword =>
      description.toLowerCase().includes(keyword));
  }

  /**
   * Generate enhanced prompt with model-specific optimizations
   */
  generateEnhancedPrompt(agentType, taskDescription, modelSelection, sequentialThinking) {
    const mcpServers = modelSelection.mcpServers || [];
    let prompt = `You are a ${agentType} agent specialized in ${modelSelection.config.capabilities.join(', ')}.

TASK: ${taskDescription}

MODEL CONFIGURATION:
- AI Model: ${modelSelection.model}
- Platform: ${modelSelection.platform}
- Sequential Thinking: ${sequentialThinking ? 'ENABLED' : 'DISABLED'}
- MCP Servers: ${mcpServers.join(', ')}

`;

    // Add model-specific optimizations
    if (modelSelection.model === 'gpt-5-codex') {
      prompt += this.getCodexOptimizations(agentType, taskDescription);
    } else if (modelSelection.model === 'gemini-2.5-pro') {
      prompt += this.getGeminiOptimizations(agentType, taskDescription);
    } else if (modelSelection.model.includes('claude')) {
      prompt += this.getClaudeOptimizations(agentType, taskDescription);
    }

    // Add sequential thinking prompts if enabled
    if (sequentialThinking && sequentialThinking.enabled) {
      prompt += `\n\nSEQUENTIAL THINKING MODE:
${sequentialThinking.prompts.systemPrompt}

THINKING STEPS:
${sequentialThinking.prompts.thinkingSteps.map((step, i) =>
  `${i + 1}. ${step.prompt}`).join('\n')}

REFLECTION:
${sequentialThinking.prompts.reflectionPrompts.join('\n')}
`;
    }

    // Add MCP server capabilities information
    prompt += this.getMcpServerInstructions(mcpServers);

    // Add agent-specific instructions
    prompt += this.getAgentSpecificInstructions(agentType);

    return prompt;
  }

  /**
   * Get GPT-5 Codex specific optimizations
   */
  getCodexOptimizations(agentType, taskDescription) {
    let optimizations = `\nCODEX CAPABILITIES:
- 7+ hour autonomous coding sessions
- Browser automation and screenshot capture
- GitHub native integration with @codex tagging
- Multimodal input (images, voice, gestures)
- Iterative testing and debugging

`;

    if (this.detectBrowserRequirement(taskDescription)) {
      optimizations += `BROWSER AUTOMATION INSTRUCTIONS:
- Use built-in browser automation to test UI changes
- Take screenshots to validate visual implementations
- Iterate based on visual feedback
- Test responsive design across viewports
- Validate user interactions and gestures

`;
    }

    return optimizations;
  }

  /**
   * Get Gemini specific optimizations
   */
  getGeminiOptimizations(agentType, taskDescription) {
    return `\nGEMINI CAPABILITIES:
- 1M token context window for large codebase analysis
- Real-time web search integration
- Advanced multimodal processing
- Free access with generous limits

LARGE CONTEXT INSTRUCTIONS:
- Leverage the full 1M token context for comprehensive analysis
- Process entire codebases and documentation sets
- Synthesize information across multiple files and systems
- Use web search for up-to-date information

`;
  }

  /**
   * Get Claude specific optimizations
   */
  getClaudeOptimizations(agentType, taskDescription) {
    return `\nCLAUDE CAPABILITIES:
- 72.7% SWE-bench performance (industry leading)
- Superior code review and quality analysis
- Advanced reasoning and pattern recognition
- Enterprise-grade security and compliance

QUALITY FOCUS INSTRUCTIONS:
- Apply rigorous code review standards
- Identify architectural patterns and anti-patterns
- Ensure security best practices compliance
- Validate against enterprise quality gates

`;
  }

  /**
   * Get MCP server capabilities instructions
   */
  getMcpServerInstructions(mcpServers) {
    if (!mcpServers || mcpServers.length === 0) {
      return '';
    }

    let instructions = '\nMCP SERVER CAPABILITIES:\n';

    mcpServers.forEach(server => {
      switch (server) {
        case 'claude-flow':
          instructions += '- Claude Flow: Swarm coordination, agent spawning, task orchestration\n';
          break;
        case 'memory':
          instructions += '- Memory: Knowledge graph operations, cross-session persistence\n';
          break;
        case 'sequential-thinking':
          instructions += '- Sequential Thinking: Enhanced reasoning with step-by-step analysis\n';
          break;
        case 'github':
          instructions += '- GitHub: Repository management, PR/issue tracking, workflow automation\n';
          break;
        case 'playwright':
          instructions += '- Playwright: Browser automation, cross-browser testing, screenshots\n';
          break;
        case 'puppeteer':
          instructions += '- Puppeteer: Advanced browser automation, device simulation, performance monitoring\n';
          break;
        case 'figma':
          instructions += '- Figma: Design system integration, mockups, visual assets, brand consistency\n';
          break;
        case 'eva':
          instructions += '- Eva: Performance evaluation, quality metrics, systematic benchmarking\n';
          break;
        case 'deepwiki':
          instructions += '- DeepWiki: GitHub repository documentation, AI-powered codebase context\n';
          break;
        case 'firecrawl':
          instructions += '- Firecrawl: Web scraping, JavaScript-rendered content, batch processing\n';
          break;
        case 'ref':
          instructions += '- Ref: Technical references, API specifications, compliance documentation\n';
          break;
        case 'context7':
          instructions += '- Context7: Live documentation, version-specific examples, up-to-date APIs\n';
          break;
        case 'markitdown':
          instructions += '- MarkItDown: Markdown conversion, document formatting, template processing\n';
          break;
        case 'plane':
          instructions += '- Plane: Issue tracking, sprint planning, team coordination, workload balancing\n';
          break;
        case 'filesystem':
          instructions += '- Filesystem: Secure file operations in allowed directories\n';
          break;
        case 'desktop-automation':
          instructions += '- Desktop Automation: Native application control, screenshot capture, UI interaction\n';
          break;
        default:
          instructions += `- ${server}: Specialized capabilities available\n`;
      }
    });

    return instructions + '\n';
  }

  /**
   * Get agent-specific instructions
   */
  getAgentSpecificInstructions(agentType) {
    const instructions = {
      'frontend-developer': `\nFRONTEND DEVELOPMENT FOCUS:
- Test UI changes in browser automatically (use Playwright/Puppeteer)
- Validate responsive design across devices
- Integrate with Figma for design system consistency
- Ensure accessibility compliance
- Optimize for performance and user experience`,

      'coder': `\nCODING EXCELLENCE:
- Follow TDD practices with comprehensive testing
- Use GitHub integration for repository management
- Write clean, maintainable, well-documented code
- Implement proper error handling and validation
- Ensure code quality and security standards`,

      'researcher': `\nRESEARCH METHODOLOGY:
- Use DeepWiki for GitHub repository analysis
- Leverage Firecrawl for comprehensive web research
- Access technical references through Ref tools
- Validate information across multiple sources
- Synthesize findings into actionable insights
- Document research methodology and sources`,

      'reviewer': `\nCODE REVIEW STANDARDS:
- Apply comprehensive quality analysis
- Use Eva for performance evaluation
- Check for security vulnerabilities
- Validate architectural compliance
- Ensure test coverage and documentation`,

      'desktop-automator': `\nDESKTOP AUTOMATION FOCUS:
- Use desktop-automation MCP for native application control
- Capture screenshots for evidence and validation
- Implement robust error handling for UI interactions
- Validate application state before and after operations
- Store evidence in .claude/.artifacts/desktop for quality gates`,

      'desktop-qa-specialist': `\nDESKTOP QUALITY ASSURANCE:
- Apply comprehensive quality analysis to desktop applications
- Use desktop-automation and eva MCPs for validation
- Collect evidence for compliance and audit requirements
- Validate application behavior against specifications
- Ensure security and accessibility standards compliance`
    };

    return instructions[agentType] || '\nApply best practices for your specialized domain.';
  }

  /**
   * Execute platform-specific agent spawn
   */
  async executePlatformSpawn(agentConfig) {
    try {
      const platform = this.platformConnections.get(agentConfig.platform);
      if (!platform || !platform.available) {
        throw new Error(`Platform ${agentConfig.platform} not available`);
      }

      // Generate spawn command
      const spawnCommand = this.generateSpawnCommand(agentConfig);

      // For now, simulate the spawn (in real implementation, this would execute the actual command)
      console.log(`Spawning ${agentConfig.type} agent with ${agentConfig.model}:`);
      console.log(`Command: ${spawnCommand}`);
      console.log(`Prompt: ${agentConfig.prompt.substring(0, 200)}...`);

      return {
        success: true,
        command: spawnCommand,
        agentId: agentConfig.id,
        message: `${agentConfig.type} agent spawned with ${agentConfig.model}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        agentId: agentConfig.id
      };
    }
  }

  /**
   * Generate platform-specific spawn command
   */
  generateSpawnCommand(agentConfig) {
    const platformConfig = this.platformConnections.get(agentConfig.platform);
    let command = platformConfig.command;

    // Add model selection
    if (agentConfig.platform === 'gemini') {
      command += ` --model ${agentConfig.model}`;
      if (agentConfig.sequentialThinking) {
        command += ' --reasoning-mode sequential';
      }
    } else if (agentConfig.platform === 'openai') {
      command += ` /model ${agentConfig.model} --approval-mode auto`;
    } else if (agentConfig.platform === 'claude') {
      command += ` --model ${agentConfig.model}`;
      if (agentConfig.sequentialThinking) {
        command += ' --mcp-server sequential-thinking';
      }
    }

    return command;
  }

  /**
   * Generate unique agent ID
   */
  generateAgentId(agentType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${agentType}-${timestamp}-${random}`;
  }

  /**
   * Get active agent information
   */
  getActiveAgents() {
    const agents = {};
    this.activeAgents.forEach((config, id) => {
      agents[id] = {
        id: config.id,
        type: config.type,
        model: config.model,
        platform: config.platform,
        mcpServers: config.mcpServers || [],
        spawnTime: config.spawnTime,
        capabilities: config.capabilities
      };
    });
    return agents;
  }

  /**
   * Get spawn statistics
   */
  getSpawnStatistics() {
    const stats = {
      totalSpawned: this.spawnHistory.length,
      activeAgents: this.activeAgents.size,
      successRate: 0,
      modelUsage: {},
      platformUsage: {}
    };

    // Calculate success rate
    const successfulSpawns = this.spawnHistory.filter(spawn => spawn.success).length;
    stats.successRate = this.spawnHistory.length > 0 ?
      (successfulSpawns / this.spawnHistory.length) * 100 : 0;

    // Count model and platform usage
    this.spawnHistory.forEach(spawn => {
      stats.modelUsage[spawn.model] = (stats.modelUsage[spawn.model] || 0) + 1;
      stats.platformUsage[spawn.platform] = (stats.platformUsage[spawn.platform] || 0) + 1;
    });

    return stats;
  }

  /**
   * Terminate an agent
   */
  terminateAgent(agentId) {
    if (this.activeAgents.has(agentId)) {
      this.activeAgents.delete(agentId);
      return { success: true, message: `Agent ${agentId} terminated` };
    }
    return { success: false, message: `Agent ${agentId} not found` };
  }

  /**
   * Clear all active agents
   */
  clearAllAgents() {
    const count = this.activeAgents.size;
    this.activeAgents.clear();
    return { success: true, message: `${count} agents terminated` };
  }
}

// Singleton instance
const agentSpawner = new AgentSpawner();

module.exports = {
  AgentSpawner,
  agentSpawner
};