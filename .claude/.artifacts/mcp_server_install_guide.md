# MCP Server Installation Guide

## Current Status
Based on validation testing, only 3 out of 16+ documented MCP servers are operational:

### ✅ OPERATIONAL (3/16)
1. **memory** - Knowledge graph operations (`mcp__memory__*`)
2. **filesystem** - Secure file operations (`mcp__filesystem__*`) 
3. **IDE integration** - VS Code diagnostics (`mcp__ide__*`)

### ❌ NOT CONFIGURED (13/16)
- claude-flow (partial - CLI only)
- sequential-thinking
- everything
- deepwiki
- firecrawl
- ref
- ref-tools
- context7
- markitdown
- github
- playwright
- puppeteer
- eva
- figma
- plane

## Installation Commands

### Universal Servers (High Priority)
```bash
# Sequential thinking for complex reasoning
npm install -g @modelcontextprotocol/server-sequential-thinking

# Everything for MCP protocol demonstration
npm install -g @modelcontextprotocol/server-everything
```

### Research & Documentation (Medium Priority)
```bash
# GitHub repository documentation
npm install -g deepwiki-mcp

# Web scraping and content extraction
npm install -g firecrawl-mcp

# Technical references and API docs
npm install -g ref-mcp
npm install -g ref-tools-mcp

# Live documentation with up-to-date examples
npm install -g context7-mcp

# Markdown conversion and processing
npm install -g markitdown-mcp
```

### Development & Testing (High Priority)
```bash
# Advanced GitHub repository management
npm install -g github-mcp

# Browser automation for testing
npm install -g playwright-mcp
npm install -g puppeteer-mcp-server

# Performance evaluation and benchmarking
npm install -g eva-mcp
```

### Design & Project Management (Low Priority)
```bash
# Design system integration
npm install -g figma-mcp

# Project management and issue tracking
npm install -g plane-mcp
```

## Configuration Updates

### Update .mcp.json
After installing servers, update the configuration with proper commands:

```json
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"]
    },
    "filesystem": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-filesystem", "."]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sequential-thinking"]
    },
    "everything": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-everything"]
    }
  }
}
```

## Validation Testing

After installation, test each server:

```bash
# Test server availability
claude mcp list

# Test specific functionality
claude mcp test <server-name>
```

## Agent Assignment Strategy

### Memory MCP → Coordination Agents
- hierarchical-coordinator
- mesh-coordinator
- swarm-memory-manager
- queen-coordinator

### Filesystem MCP → File Management Agents  
- file-manager-agent (if created)
- backup-agent (if created)
- asset-manager (if created)

### IDE MCP → Testing/Validation Agents
- tester
- code-analyzer
- performance-benchmarker
- production-validator

### Specialized MCPs → Domain Agents
- figma → ui-designer, visual-designer
- playwright/puppeteer → testing agents
- github → pr-manager, release-manager
- ref/ref-tools → api-docs, documentation agents

## Priority Installation Order

1. **CRITICAL**: sequential-thinking (needed for complex reasoning)
2. **HIGH**: github-mcp (repository operations)
3. **HIGH**: playwright-mcp (testing automation)
4. **MEDIUM**: ref/ref-tools (documentation)
5. **LOW**: figma, plane (specialized workflows)

## Notes
- All package names are estimated - verify actual npm package names
- Some servers may require API keys or additional configuration
- Test thoroughly after each installation
- Update agent documentation to reflect actual MCP availability