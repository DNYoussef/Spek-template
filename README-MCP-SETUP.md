# SPEK MCP Auto-Initialization Setup

## Overview

The SPEK template now automatically initializes your core MCP servers every time you start a new development session. This ensures that all agents have access to persistent memory, structured reasoning, and project management integration from the very first command.

## Quick Start

### Windows Users
```bash
npm run setup:win
```

### Linux/Mac Users  
```bash
npm run setup
```

## What Gets Auto-Initialized

### Tier 1: Always Enabled (Core Infrastructure)
[OK] **memory** - Universal learning & persistence across all agents
[OK] **sequential-thinking** - Structured reasoning for every agent decision  
[OK] **claude-flow** - Core swarm coordination (2.8-4.4x speed improvement)
[OK] **github** - Universal Git/GitHub workflows
[OK] **context7** - Large-context analysis for complex decisions

### Tier 2: Conditionally Enabled
[CYCLE] **plane** - Project management sync (only if `PLANE_API_TOKEN` is configured)

## Available Commands

### Setup & Initialization
```bash
# Initial setup (auto-detects platform)
npm run setup      # Linux/Mac
npm run setup:win   # Windows

# Manual initialization
npm run mcp:init     # Linux/Mac  
npm run mcp:init:win # Windows

# Force re-initialization
npm run mcp:force    # Linux/Mac
```

### Verification & Status
```bash
# Check MCP server status
npm run mcp:verify     # Linux/Mac
npm run mcp:verify:win # Windows

# Validate environment configuration
bash scripts/validate-mcp-environment.sh --validate

# Show MCP recommendations based on your setup
bash scripts/validate-mcp-environment.sh --recommendations
```

### Environment Management
```bash
# Generate .env template
bash scripts/validate-mcp-environment.sh --template

# Full environment validation
bash scripts/validate-mcp-environment.sh
```

## Environment Configuration

### Required for Full Functionality
Create a `.env` file with these variables for enhanced functionality:

```bash
# Core AI Services
CLAUDE_API_KEY=your_claude_api_key_here
GEMINI_API_KEY=your_gemini_key_here

# GitHub Integration (enhanced functionality)
GITHUB_TOKEN=ghp_your_github_token

# Project Management (enables Plane MCP)
PLANE_API_TOKEN=your_plane_token
PLANE_API_URL=https://your-plane-instance.com
PLANE_PROJECT_ID=your_project_id
PLANE_WORKSPACE_SLUG=your_workspace
```

### Generate Template
```bash
bash scripts/validate-mcp-environment.sh --template
cp .env.template .env
# Edit .env with your actual values
```

## Integration Benefits

With auto-initialization, every agent gets:

- **Persistent Context** (Memory MCP) - No more starting from scratch each session
- **Structured Reasoning** (Sequential Thinking MCP) - Higher quality decisions and analysis
- **Parallel Coordination** (Claude-Flow MCP) - 2.8-4.4x speed improvement through concurrent operations
- **GitHub Integration** (GitHub MCP) - Seamless PR creation, issue tracking, workflow automation
- **Complex Analysis** (Context7 MCP) - Large-context architectural decisions and impact analysis
- **PM Sync** (Plane MCP, if configured) - Automatic project management updates and stakeholder visibility

## Troubleshooting

### MCP Server Connection Issues
```bash
# Check current MCP status
claude mcp list

# Verify environment
npm run mcp:verify:win

# Force re-initialization
npm run mcp:force
```

### Environment Issues
```bash
# Validate configuration
bash scripts/validate-mcp-environment.sh --validate

# Generate fresh template
bash scripts/validate-mcp-environment.sh --template
```

### Common Issues

**"Claude Code CLI not found"**
- Install Claude Code from https://claude.ai/code
- Ensure `claude` command is in your PATH

**"PLANE_API_TOKEN not configured"**  
- This is normal if you're not using Plane project management
- Plane MCP will be automatically skipped

**"Failed to add MCP server"**
- Check your internet connection
- Verify Claude Code is properly authenticated
- Try force re-initialization: `npm run mcp:force`

## Session Workflow

### Recommended Startup Flow
```bash
# 1. Auto-initialize MCP servers (one-time per session)
npm run setup:win

# 2. Validate environment (optional)
bash scripts/validate-mcp-environment.sh

# 3. Start development with full SPEK functionality
# All agents now have memory, structured reasoning, and coordination!
```

### Development Commands
```bash
# Research with full MCP integration
/research:web 'your feature here'

# Planning with Memory MCP context
/spec:plan

# Implementation with swarm coordination  
/codex:micro 'implement feature'

# Quality validation with structured reasoning
/qa:run
```

## Advanced Configuration

### Custom MCP Server Priority
Edit `scripts/mcp-auto-init.sh` to modify initialization order or add custom servers.

### Conditional Logic
The system automatically detects your environment configuration and enables appropriate MCP servers:
- **Always**: memory, sequential-thinking, claude-flow, github, context7
- **If PLANE_API_TOKEN set**: plane
- **On-demand**: deepwiki, firecrawl, playwright, eva (loaded by specific commands)

### Performance Optimization
- MCP servers are initialized in parallel where possible
- Failed initializations don't block other servers
- Retry logic handles temporary network issues

---

**Result**: Every SPEK session now starts with full AI agent coordination, persistent memory, and structured reasoning - delivering the promised 30-60% development speed improvement from the very first command! [ROCKET]