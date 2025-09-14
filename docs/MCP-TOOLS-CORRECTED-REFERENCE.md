# MCP Tools Corrected Reference Guide

## CRITICAL CORRECTIONS TO MCP TOOL DOCUMENTATION

This document provides accurate descriptions of MCP tool capabilities, correcting widespread misunderstandings and mislabelings in the existing documentation.

## Executive Summary of Corrections

### Major Mislabelings Identified:
1. **MCP Filesystem**: Incorrectly labeled as programming tool - Actually secure file management
2. **MCP Memory**: Incorrectly described as general memory - Actually knowledge graph operations
3. **MCP IDE**: Not mentioned in most docs - Actually VS Code diagnostics and Jupyter execution
4. **Missing MCPs**: figma, puppeteer, ref-tools, everything not properly documented

## Accurate MCP Tool Capabilities

### 1. MCP Filesystem Tools (`mcp__filesystem__*`)

**INCORRECT DOCUMENTATION CLAIMS:**
- "For code generation and programming"
- "Primary tool for developers"
- "Handles all file operations"

**ACTUAL CAPABILITIES:**
- Secure file operations within allowed directories only
- Cannot access arbitrary system files
- Best for data persistence, report storage, asset management
- NOT a replacement for Claude Code's Read/Write/Edit tools

**Proper Agent Assignments:**
- Analytics reporters (storing reports)
- Content managers (asset organization)
- Data persistence agents
- NOT general coding agents (they should use Claude Code tools)

### 2. MCP Memory Tools (`mcp__memory__*`)

**INCORRECT DOCUMENTATION CLAIMS:**
- "General memory management"
- "Variable storage"
- "Session state management"

**ACTUAL CAPABILITIES:**
- Knowledge graph operations (entities, relations, observations)
- Cross-session persistence via graph structure
- Query-based node search
- NOT for temporary variables or general state

**Proper Agent Assignments:**
- Coordination agents (maintaining agent relationships)
- Learning systems (pattern storage)
- Audit trail agents (compliance tracking)
- NOT for temporary task state (use TodoWrite or variables)

### 3. MCP IDE Tools (`mcp__ide__*`)

**OFTEN MISSING FROM DOCUMENTATION**

**ACTUAL CAPABILITIES:**
- `getDiagnostics`: Retrieve VS Code language server diagnostics
- `executeCode`: Execute code in Jupyter notebook kernels
- Integration with VS Code's language features
- NOT for general code execution (use Bash tool)

**Proper Agent Assignments:**
- Testing agents (retrieving test failures)
- Validation agents (checking code quality)
- Notebook specialists (data science workflows)
- NOT general development agents

### 4. MCP GitHub Tools

**COMMON CONFUSION:**
- Often conflated with git CLI commands

**ACTUAL CAPABILITIES:**
- GitHub API operations beyond git CLI
- Issue and PR management via API
- Workflow triggering and automation
- Repository insights and analytics
- NOT a replacement for git commands (use Bash tool)

**Proper Usage:**
- PR management agents
- Issue tracking agents
- Release coordination agents
- For git operations, use Bash tool with git commands

### 5. Design & Visual MCPs

**OFTEN UNDOCUMENTED:**

#### Figma MCP
- Design system integration
- Mockup and prototype access
- Visual asset management
- Brand consistency checking

**Should be assigned to:**
- UI/UX designers
- Visual storytellers
- Brand guardians
- Frontend developers (design-to-code)

#### Puppeteer MCP
- Advanced browser automation
- Device simulation
- Performance monitoring
- Screenshot generation

**Should be assigned to:**
- Testing agents
- Performance analyzers
- UI validation agents

### 6. Research & Documentation MCPs

#### Deepwiki
- GitHub repository documentation extraction
- AI-powered codebase understanding
- NOT general web search

#### Firecrawl
- Web scraping with JavaScript rendering
- Batch content extraction
- NOT for simple web fetching (use WebFetch)

#### Ref/Ref-tools
- Technical documentation access
- API specification lookup
- Compliance documentation
- NOT for general research

#### Context7
- Live, up-to-date documentation
- Version-specific examples
- Direct prompt injection
- NOT for static docs

### 7. Specialized MCPs

#### Eva
- Performance benchmarking
- Quality metrics calculation
- Systematic evaluation
- NOT general testing

#### Plane
- Project management integration
- Sprint planning
- Issue lifecycle management
- NOT a task list (use TodoWrite)

#### Everything
- MCP protocol demonstration
- Full feature testing
- Development and debugging
- NOT for production use

## Correct Tool Selection Guide

### For File Operations:
- **General coding**: Use Claude Code's Read/Write/Edit/MultiEdit
- **Secure data storage**: Use mcp__filesystem tools
- **Code search**: Use Grep/Glob
- **Batch file ops**: Consider mcp__filesystem__read_multiple_files

### For Memory/State:
- **Task tracking**: Use TodoWrite
- **Temporary state**: Use variables
- **Cross-session knowledge**: Use mcp__memory (knowledge graph)
- **Audit trails**: Use mcp__memory with observations

### For Testing:
- **Unit tests**: Use Bash with test commands
- **Browser testing**: Use playwright/puppeteer MCP
- **VS Code diagnostics**: Use mcp__ide__getDiagnostics
- **Performance**: Use eva MCP

### For Development:
- **Code writing**: Use Claude Code tools exclusively
- **Git operations**: Use Bash with git commands
- **GitHub API**: Use github MCP
- **Design integration**: Use figma MCP

### For Research:
- **Web search**: Use WebSearch tool
- **GitHub repos**: Use deepwiki MCP
- **Web scraping**: Use firecrawl MCP
- **Technical docs**: Use ref/ref-tools MCP

## Agent Assignment Corrections Needed

### Agents Currently Misassigned:

1. **Coder agents with filesystem MCP**: Should use Claude Code tools
2. **General agents with memory MCP**: Should only be coordination agents
3. **Development agents missing IDE tools**: Testing agents need these
4. **Visual agents missing figma**: Critical gap for design work
5. **Testing agents missing puppeteer**: Need advanced automation

### Recommended Reassignments:

#### Remove filesystem MCP from:
- coder, coder-codex, backend-dev, frontend-developer
- These should use Claude Code's Read/Write/Edit

#### Add mcp__ide tools to:
- tester, api-tester, production-validator
- test-results-analyzer, workflow-optimizer

#### Add figma MCP to:
- ui-designer, visual-storyteller, whimsy-injector
- brand-guardian, frontend-developer

#### Add puppeteer MCP to:
- production-validator, api-tester
- workflow-optimizer, performance-benchmarker

## Implementation Priority

### High Priority (Immediate):
1. Correct CLAUDE.md documentation
2. Update agent YAML files with correct MCP assignments
3. Remove filesystem MCP from coding agents
4. Add IDE tools to testing agents

### Medium Priority (This Week):
1. Add figma to visual agents
2. Add puppeteer to advanced testing agents
3. Update memory MCP usage to knowledge graph only
4. Document proper tool boundaries

### Low Priority (Future):
1. Optimize MCP server connections
2. Add new specialized MCPs as needed
3. Create MCP usage analytics
4. Build MCP recommendation engine

## Validation Checklist

For each agent, verify:
- [ ] No filesystem MCP for general coding tasks
- [ ] Memory MCP only for knowledge graph needs
- [ ] IDE tools present for testing/validation agents
- [ ] Visual agents have figma access
- [ ] Testing agents have appropriate automation tools
- [ ] Research agents have correct research MCPs
- [ ] Maximum 4 specialized MCPs per agent
- [ ] Universal MCPs (claude-flow, memory, sequential-thinking) present

## Conclusion

The MCP tool ecosystem has been widely misunderstood due to incorrect documentation. This reference provides the accurate capabilities and proper usage patterns. Following these corrections will significantly improve agent effectiveness and reduce confusion about tool boundaries.

**Remember:** Claude Code handles execution, MCP provides specialized integrations.