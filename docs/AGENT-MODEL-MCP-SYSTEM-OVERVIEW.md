# Agent Model & MCP Server System Overview

## System Architecture

The SPEK platform now features a comprehensive AI model optimization system that automatically assigns the optimal AI model and MCP servers to each of the 85+ agents based on their capability requirements.

## Key Components & Locations

### Core System Files
- **Agent Model Registry**: `src/flow/config/agent-model-registry.js`
  - Central configuration mapping all agents to AI models
  - Defines MCP server assignments for each agent
  - Includes fallback models and sequential thinking configuration

- **Model Selector**: `src/flow/core/model-selector.js`
  - Dynamic model selection based on task context
  - Platform availability checking
  - MCP server assignment logic
  - Initialization command generation

- **Agent Spawner**: `src/flow/core/agent-spawner.js`
  - Automatic model assignment during spawning
  - Enhanced prompt generation with MCP instructions
  - Task context analysis

- **MCP Configuration**: `src/flow/config/mcp-multi-platform.json`
  - Platform-specific configurations
  - MCP server definitions
  - Test configurations

## AI Platform Distribution

### GPT-5 Codex (25 agents)
**Primary Use**: Browser automation, GitHub integration, autonomous coding
- **Key Capability**: 7+ hour sessions, browser automation, screenshot capture
- **Common MCP Servers**: playwright, puppeteer, figma, github
- **Example Agents**: frontend-developer, ui-designer, mobile-dev, coder

### Gemini 2.5 Pro (18 agents)
**Primary Use**: Large context research, architecture analysis
- **Key Capability**: 1M token context window, web search
- **Common MCP Servers**: deepwiki, firecrawl, ref, context7, markitdown
- **Example Agents**: researcher, specification, architecture, system-architect

### Claude Opus 4.1 (12 agents)
**Primary Use**: Quality assurance, code review, security
- **Key Capability**: 72.7% SWE-bench performance
- **Common MCP Servers**: eva, github
- **Example Agents**: reviewer, code-analyzer, security-manager, tester

### Claude Sonnet 4 (15 agents)
**Primary Use**: Coordination and orchestration
- **Key Capability**: Sequential thinking for enhanced reasoning
- **Common MCP Servers**: sequential-thinking, plane
- **Example Agents**: sparc-coord, hierarchical-coordinator, task-orchestrator

### Gemini Flash (10 agents)
**Primary Use**: Cost-effective operations
- **Key Capability**: Free tier with sequential thinking
- **Common MCP Servers**: sequential-thinking, github, plane
- **Example Agents**: planner, refinement, pr-manager, issue-tracker

## MCP Server Integration (15 Total)

### Universal Servers (All Agents)
- **claude-flow**: Swarm coordination and orchestration
- **memory**: Knowledge graph and cross-session persistence
- **sequential-thinking**: Enhanced reasoning chains

### Specialized Server Categories
- **Research**: deepwiki, firecrawl, ref, context7, markitdown
- **Visual/Browser**: playwright, puppeteer, figma
- **Quality/Testing**: eva, github
- **Project Management**: plane
- **File Operations**: filesystem

## Usage Examples

### Automatic Model Selection
```javascript
const { modelSelector } = require('./src/flow/core/model-selector');

// Frontend task automatically gets Codex + browser MCP servers
const result = modelSelector.selectModel('frontend-developer', {
  description: 'Create responsive UI with screenshots'
});
// Returns: {
//   model: 'gpt-5-codex',
//   platform: 'openai',
//   mcpServers: ['claude-flow', 'memory', 'github', 'playwright', 'figma'],
//   initialization: 'codex /model gpt-5-codex --mcp-server playwright ...'
// }
```

### Agent Spawning with Auto-Assignment
```javascript
const { agentSpawner } = require('./src/flow/core/agent-spawner');

// Spawn agent with automatic model and MCP assignment
const agent = await agentSpawner.spawnAgent(
  'researcher',
  'Analyze large codebase architecture patterns'
);
// Automatically assigns:
// - Gemini 2.5 Pro (1M context)
// - MCP Servers: deepwiki, firecrawl, ref, context7
// - Sequential thinking if needed
```

## Quick Selection Guide

| Task Type | Optimal Model | Key MCP Servers |
|-----------|--------------|-----------------|
| Browser automation | GPT-5 Codex | playwright, puppeteer, figma |
| Large context analysis | Gemini 2.5 Pro | deepwiki, firecrawl, ref |
| Quality analysis | Claude Opus 4.1 | eva, github |
| Coordination | Claude Sonnet 4 | sequential-thinking, plane |
| Cost-effective ops | Gemini Flash | sequential-thinking, github |

## Testing & Validation

- **Test Suite**: `src/flow/tests/agent-model-assignment-test.js`
- **Test Coverage**: 41 tests, 100% pass rate
- **Validation Areas**: Model selection, MCP assignment, platform fallbacks

## Memory System Integration

The dual memory system has been updated with:
- Agent Model Registry configuration tracking
- Platform capability mappings
- Agent category relationships
- MCP server usage patterns

All configurations are persisted in the knowledge graph for cross-session continuity.

## Benefits

1. **Automatic Optimization**: Agents automatically receive optimal models and tools
2. **No Manual Configuration**: Zero-config model selection based on task
3. **Intelligent Fallbacks**: Automatic platform switching on unavailability
4. **Cost Optimization**: Free tier usage where appropriate
5. **Enhanced Capabilities**: MCP servers provide specialized tools per domain
6. **100% Test Coverage**: Comprehensive validation of all assignments

## Maintenance

To add or modify agent assignments:
1. Update `src/flow/config/agent-model-registry.js`
2. Run tests: `node src/flow/tests/agent-model-assignment-test.js`
3. Update documentation if needed

The system is designed to be self-documenting through the registry configuration.