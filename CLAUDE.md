# Claude Code Configuration - SPEK Enhanced Development Platform

# RULES FOR CODING
1. NO UNICODE OR EMOKI'S


## [TARGET] Project Overview

**SPEK Enhanced Development Platform** is a complete multi-agent workflow orchestration system with Queen-Princess-Drone swarm hierarchy. The platform integrates 90+ specialized AI agents (including 5 desktop automation specialists via Bytebot), 163+ slash commands, 16+ MCP servers (including Bytebot desktop control), comprehensive theater detection, and the **3-Loop Development System** for both new projects and existing codebase remediation.

### Core Pipeline: S-R-P-E-K Methodology with 3-Loop System
```
Specification -> Research -> Planning -> Execution -> Knowledge
     v             v          v           v          v
  Define       Discover   Generate    Implement   Validate
Requirements  Solutions   Strategy     Features    Quality

3-LOOP SYSTEM:
Loop 1: Planning (spec->research->premortem->plan)
Loop 2: Development (swarm->MECE->deploy->theater)
Loop 3: Quality (analysis->root cause->fixes->validation)
```

**Key Components:**
- **Swarm Architecture**: Queen-Princess-Drone hierarchy with 6 domain princesses
- **AI Agent System**: 90+ specialized agents with automatic model optimization
- **Command Framework**: 163+ slash commands for complete workflow automation
- **MCP Integration**: 16+ servers including memory, GitHub, browser automation, desktop control
- **Theater Detection**: Zero-tolerance audit gates for fake work elimination
- **9-Step Dev Process**: Complete implementation workflow with reality validation
- **3-Loop System**: Forward flow for new projects, reverse flow for remediation
- **Real Implementations**: 37+ tool integrations with evidence-based validation

## [U+1F6A8] CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. NO UNICODE!!!

### [LIGHTNING] GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message

### [FOLDER] File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code
- `.claude/.artifacts` - QA outputs and analysis results

## [CYCLE] 3-Loop Development System

### Quick Start Commands

#### New Project Development (Forward Flow)
```bash
# Automatic forward flow: Loop 1 -> 2 -> 3
./scripts/3-loop-orchestrator.sh forward

# Manual execution by loop:
npx claude-flow sparc run spec "<requirements>"  # Loop 1: Planning
npx claude-flow sparc tdd "<feature>"           # Loop 2: Development
./scripts/simple_quality_loop.sh                 # Loop 3: Quality
```

#### Existing Codebase Remediation (Reverse Flow)
```bash
# Automatic reverse flow: Loop 3 -> 1 -> 2 -> 3
./scripts/3-loop-orchestrator.sh reverse

# Progressive remediation with convergence
./scripts/codebase-remediation.sh /path/to/project progressive 10
```

### Loop Architecture
- **Loop 1: Discovery & Planning**
  - Tools: /research:web, /research:github, /spec:plan, /pre-mortem-loop
  - Output: Risk-mitigated foundation with evidence-based planning
  - Quality Gates: Spec completeness >=90%, Risk mitigation >=80%

- **Loop 2: Development & Implementation**
  - Tools: /dev:swarm, 54 AI agents, MECE task division, parallel execution
  - Output: Theater-free, reality-validated implementation
  - Quality Gates: Test coverage >=80%, Theater score >=60/100

- **Loop 3: CI/CD Quality & Debugging**
  - Tools: /cicd-loop, failure patterns, comprehensive tests, auto-repair
  - Output: 100% test success with authentic quality improvements
  - Quality Gates: Zero critical issues, All tests passing

### Loop Configuration
Edit `.roo/loops/loop-config.json` for:
- Quality gate thresholds
- Convergence criteria (quality improvement, iterations)
- Tool integrations (npm, GitHub, analyzers)
- Transition rules between loops

### Real Implementation Features
- **37+ Tool Integrations**: Real npm, eslint, jest, GitHub CLI
- **Evidence-Based Validation**: All checks can actually fail
- **Session Management**: Unique IDs track progress
- **Automatic Convergence**: Stops when quality goals met
- **Zero Theater**: All implementations are genuine

See [docs/3-LOOP-SYSTEM.md](docs/3-LOOP-SYSTEM.md) for complete documentation.

## [U+1F4D1] Complete Documentation Table of Contents

### **[FOLDER] Core Project Documentation**
- **Main README**: `README.md` - Project overview and quick start
- **Project Structure**: `docs/PROJECT-STRUCTURE.md` - Complete 70-file system layout  
- **Getting Started**: `examples/getting-started.md` - Step-by-step tutorial
- **Quick Reference**: `docs/QUICK-REFERENCE.md` - Essential commands and patterns
- **Agent Management**: `AGENTS.md` - Codex proof rules & gates

### **[TOOL] Methodology & Commands**
- **SPEK Methodology**: `docs/S-R-P-E-K-METHODOLOGY.md` - Complete workflow guide
- **Commands Reference**: `docs/reference/COMMANDS.md` - All 29 slash commands
- **Quick Reference**: `docs/reference/QUICK-REFERENCE.md` - Essential commands and patterns

### **[BUILD] Architecture & Analysis**
- **Analyzer Capabilities**: `docs/ANALYZER-CAPABILITIES.md` - 25,640 LOC analysis engine
- **Architectural Analysis**: `docs/ARCHITECTURAL-ANALYSIS.md` - System design validation
- **Agent Wiring**: `docs/AGENT-WIRING-OPTIMIZATION.md` - Multi-agent coordination
- **CLI Integration**: `docs/CLI-INTEGRATION-GAPS.md` - Enhancement roadmap

### **[BRAIN] Memory & Intelligence Systems** 
- **Unified Memory**: `docs/UNIFIED-MEMORY-ARCHITECTURE.md` - Consolidated memory system

### **[CHART] Quality & Compliance**
- **NASA POT10 Compliance**: `docs/NASA-POT10-COMPLIANCE-STRATEGIES.md` - Defense industry ready
- **Code Review Checklist**: `docs/NASA-POT10-CODE-REVIEW-CHECKLIST.md` - Review standards
- **Guardrails**: `docs/process/GUARDRAILS.md` - Safety and validation mechanisms

### **[SCIENCE] Research & Pattern Analysis**
- **Connascence Patterns**: `docs/CONNASCENCE-VIOLATION-PATTERNS-RESEARCH.md` - Pattern detection
- **God Object Research**: `docs/GOD-OBJECT-DECOMPOSITION-RESEARCH.md` - Refactoring strategies
- **Analysis Format**: `docs/ANALYSIS-RESULT-FORMAT.md` - Result standardization
- **Implementation Specs**: `docs/IMPLEMENTATION-SPECIFICATIONS.md` - Technical specifications

### **[TREND] Consolidation & Migration**
- **MECE Consolidation**: `docs/MECE-CONSOLIDATION-PLAN.md` - Phase 1 achievements  
- **Analyzer Consolidation**: `docs/ANALYZER-CONSOLIDATION-PLAN.md` - System unification

### **[ROCKET] Implementation Status**
- **Production Validation**: `docs/PRODUCTION-VALIDATION-REPORT.md` - Deployment readiness
- **Final Assessment**: `docs/FINAL-PRODUCTION-ASSESSMENT.md` - Production status
- **Implementation History**: `docs/history/` - Phase summaries and historical records

### **[U+1F4D6] Examples & Workflows**
- **Examples Overview**: `examples/README.md` - Available examples
- **Sample Specifications**: `examples/sample-specs/auth-system.md` - Auth system spec
- **Troubleshooting**: `examples/troubleshooting.md` - Common issues and solutions
- **Spec-to-PR Workflow**: `examples/workflows/spec-to-pr.md` - Complete workflow example

### **[TOOL] Technical Documentation**
- **CLI README**: `interfaces/cli/README.md` - Command-line interface
- **Analyzer README**: `analyzer/optimization/README.md` - Analysis optimization
- **Constitution**: `memory/constitution.md` - System constitution and principles

## [TARGET] Essential Agent Coordination with AI Model Optimization

### **Agent Registry & Configuration**
- **Primary Registry**: `src/flow/config/agent-model-registry.js`
- **Model Selector**: `src/flow/core/model-selector.js`
- **Agent Spawner**: `src/flow/core/agent-spawner.js`
- **MCP Configuration**: `src/flow/config/mcp-multi-platform.json`

### **Specialized Agent Categories (85+ Total with Optimal AI Models)**

#### **Browser Automation & Visual (GPT-5 + Codex CLI)**
- `frontend-developer` → GPT-5 + [claude-flow, memory, github, playwright, figma]
- `ui-designer` → GPT-5 + [claude-flow, memory, playwright, figma, puppeteer]
- `mobile-dev` → GPT-5 + [claude-flow, memory, github, playwright, puppeteer]
- `rapid-prototyper` → GPT-5 + [claude-flow, memory, playwright, figma]

#### **Large Context & Research (Gemini 2.5 Pro - 1M tokens)**
- `researcher` → Gemini Pro + [claude-flow, memory, deepwiki, firecrawl, ref, context7]
- `specification` → Gemini Pro + [claude-flow, memory, deepwiki, ref, context7, markitdown]
- `architecture` → Gemini Pro + [claude-flow, memory, deepwiki, ref, context7]
- `system-architect` → Gemini Pro + [claude-flow, memory, deepwiki, ref, context7]

#### **Quality Assurance (Claude Opus 4.1 - 72.7% SWE-bench)**
- `reviewer` → Claude Opus + [claude-flow, memory, github, eva]
- `code-analyzer` → Claude Opus + [claude-flow, memory, eva]
- `security-manager` → Claude Opus + [claude-flow, memory, eva]
- `tester` → Claude Opus + [claude-flow, memory, github, playwright, eva]
- `production-validator` → Claude Opus + [claude-flow, memory, eva]

#### **Coordination & Orchestration (Claude Sonnet 4 + Sequential)**
- `sparc-coord` → Sonnet + Sequential + [claude-flow, memory, sequential-thinking, github-project-manager]
- `hierarchical-coordinator` → Sonnet + Sequential + [claude-flow, memory, sequential-thinking, github-project-manager]
- `mesh-coordinator` → Sonnet + Sequential + [claude-flow, memory, sequential-thinking, github-project-manager]
- `task-orchestrator` → Sonnet + Sequential + [claude-flow, memory, sequential-thinking, github-project-manager]

#### **Cost-Effective Operations (Gemini Flash + Sequential)**
- `planner` → Flash + Sequential + [claude-flow, memory, sequential-thinking, github-project-manager]
- `refinement` → Flash + Sequential + [claude-flow, memory, sequential-thinking]
- `pr-manager` → Flash + Sequential + [claude-flow, memory, github, sequential-thinking]
- `issue-tracker` → Flash + Sequential + [claude-flow, memory, github, sequential-thinking, github-project-manager]

### **Agent Deployment Pattern with Automatic Model Selection**
```javascript
// Automatic model and MCP assignment based on agent type
const { agentSpawner } = require('./src/flow/core/agent-spawner');

// Frontend agent → Gets Codex + browser automation MCP servers
await agentSpawner.spawnAgent(
  'frontend-developer',
  'Create responsive UI with screenshots'
);
// Auto-assigns: GPT-5 + [playwright, figma, ...] with Codex CLI tool

// Research agent → Gets Gemini Pro + research MCP servers
await agentSpawner.spawnAgent(
  'researcher',
  'Analyze large codebase patterns'
);
// Auto-assigns: Gemini 2.5 Pro + [deepwiki, firecrawl, ...]
```

## [CHART] Quality Gate Essentials

### **Critical Gates (Must Pass)**
- **NASA Compliance**: >=90% (currently 92% post-Phase 2)
- **God Objects**: <=25 (achieved through Phase 1 consolidation)
- **MECE Score**: >=0.75 (achieved >0.85 post-consolidation)
- **Security**: Zero critical/high findings

### **Current System Status**
- **Total Files**: 70 (reduced from 74, -5.4%) + Phase 3 monitoring infrastructure
- **LOC Eliminated**: 1,568 (Phase 1 consolidation)
- **God Objects**: 2 major eliminated (4 focused classes created)
- **Defense Industry**: [OK] PRODUCTION READY (95% NASA compliance)
- **CI/CD Success**: 85%+ target infrastructure with comprehensive monitoring

## [CYCLE] Loop System Integration

### **Loop 1**: Spec-Plan-Research-Premortem
Research -> Planning -> Risk mitigation -> Foundation setting

### **Loop 2**: Development-Quality-GitHub Integration  
Implementation -> Quality gates -> Evidence packaging -> PR creation

### **Loop 3**: Theater Detection-Reality Validation
Pattern detection -> Evidence validation -> Quality verification -> Learning

## [ROCKET] MCP Server Integration - CORRECTED CAPABILITIES

### Available MCP Servers (15+ Total)

#### Universal Servers (Applied to ALL 85 Agents)
- **claude-flow**: Swarm coordination, agent spawning, task orchestration
- **memory**: Knowledge graph operations (entities/relations), cross-session persistence
- **sequential-thinking**: Step-by-step reasoning chains, structured problem solving

#### Specialized MCP Servers by Actual Function

**File & Data Management:**
- **filesystem**: Secure file operations in allowed directories (NOT for code generation)
- **everything**: Full MCP protocol demonstration and testing capabilities

**Research & Documentation:**
- **deepwiki**: GitHub repository documentation, AI-powered codebase context
- **firecrawl**: Web scraping, JavaScript-rendered content, batch processing
- **ref**: Technical references, API specifications, compliance documentation
- **ref-tools**: Enhanced reference and documentation tools
- **context7**: Live documentation, version-specific examples, up-to-date APIs
- **markitdown**: Markdown conversion, document formatting, template processing

**Development & Testing:**
- **github**: Repository management, PR/issue tracking, workflow automation (beyond git CLI)
- **playwright**: Browser automation, cross-browser testing, accessibility checks
- **puppeteer**: Advanced browser automation, device simulation, performance monitoring
- **eva**: Performance evaluation, quality metrics, systematic benchmarking

**Design & Visual:**
- **figma**: Design system integration, mockups, visual assets, brand consistency

**Project Management:**
- **github-project-manager**: AI-powered GitHub project management, PRD generation, task traceability

### MCP IDE Integration Tools (VS Code)
- **mcp__ide__getDiagnostics**: Language diagnostics (errors/warnings) from VS Code
- **mcp__ide__executeCode**: Jupyter notebook kernel execution for data science

### MCP Filesystem Tools (Security-Controlled)
- **mcp__filesystem__read_file**: Read file contents (deprecated, use read_text_file)
- **mcp__filesystem__read_text_file**: Read text files with encoding handling
- **mcp__filesystem__read_media_file**: Read images/audio as base64
- **mcp__filesystem__read_multiple_files**: Batch file reading
- **mcp__filesystem__write_file**: Create/overwrite files with caution
- **mcp__filesystem__edit_file**: Line-based edits with git-style diff
- **mcp__filesystem__create_directory**: Create nested directories
- **mcp__filesystem__list_directory**: Directory listing with [FILE]/[DIR] prefixes
- **mcp__filesystem__directory_tree**: Recursive JSON tree structure
- **mcp__filesystem__move_file**: Move/rename files and directories
- **mcp__filesystem__search_files**: Recursive pattern search
- **mcp__filesystem__get_file_info**: Detailed file metadata
- **mcp__filesystem__list_allowed_directories**: View security boundaries

### MCP Memory Tools (Knowledge Graph)
- **mcp__memory__create_entities**: Create knowledge graph entities
- **mcp__memory__create_relations**: Define entity relationships
- **mcp__memory__add_observations**: Add observations to entities
- **mcp__memory__delete_entities**: Remove entities and relations
- **mcp__memory__delete_observations**: Remove specific observations
- **mcp__memory__delete_relations**: Remove relationships
- **mcp__memory__read_graph**: Read entire knowledge graph
- **mcp__memory__search_nodes**: Query-based node search
- **mcp__memory__open_nodes**: Retrieve specific entities

## [BRAIN] AI Model & MCP Server Intelligence System

### **Automatic Model Selection Logic**
```javascript
// Registry location: src/flow/config/agent-model-registry.js
const { modelSelector } = require('./src/flow/core/model-selector');

// Model selection based on agent type and task context
const result = modelSelector.selectModel('frontend-developer', {
  description: 'Create UI with visual validation',
  complexity: 'medium'
});
// Returns: {
//   model: 'gpt-5-codex',
//   platform: 'openai',
//   mcpServers: ['claude-flow', 'memory', 'github', 'playwright', 'figma'],
//   initialization: 'codex /model gpt-5-codex --mcp-server playwright ...'
// }
```

### **Model Distribution Across 85+ Agents**
- **GPT-5**: 25 agents (browser automation, GitHub, autonomous coding via Codex CLI)
- **Gemini 2.5 Pro**: 18 agents (large context research, architecture)
- **Claude Opus 4.1**: 12 agents (quality analysis, security, testing)
- **Claude Sonnet 4**: 15 agents (coordination with sequential thinking)
- **Gemini Flash**: 10 agents (cost-effective operations)
- **GPT-5 Standard**: 5 agents (general purpose)

### **Platform Capabilities**
- **Gemini CLI (Free)**: 1M context, web search, sequential thinking
- **OpenAI Codex ($)**: Browser automation, 7+ hour sessions, GitHub native
- **Claude Code ($)**: 72.7% SWE-bench, enterprise compliance, quality gates

## [TARGET] Claude Code vs MCP Tools - ACCURATE SEPARATION

### Claude Code Native Tools (Primary Execution):
**File & Code Operations:**
- **Read/Write/Edit/MultiEdit**: Direct code manipulation and file creation
- **Glob/Grep**: Fast pattern matching and search across codebase
- **NotebookEdit**: Jupyter notebook cell manipulation
- **All code generation**: Programming, implementation, refactoring

**System & Shell Operations:**
- **Bash**: All command-line operations (git, npm, python, etc.)
- **BashOutput/KillShell**: Background process management
- **WebSearch/WebFetch**: General web access and research

**Project Management:**
- **TodoWrite**: Task tracking and progress management
- **Task**: Agent spawning and coordination
- **ExitPlanMode**: Planning mode control

### MCP Tools (Specialized Integrations):
**When to Use MCP Instead of Claude Code:**

1. **MCP Filesystem** (`mcp__filesystem__*`):
   - Use for: Secure file ops in restricted directories, batch operations
   - NOT for: General programming (use Claude Code Read/Write/Edit)
   - Best for: Data persistence, report storage, asset management agents

2. **MCP IDE** (`mcp__ide__*`):
   - Use for: VS Code diagnostics, Jupyter kernel execution
   - NOT for: General coding (use Claude Code tools)
   - Best for: Testing agents, validation agents, notebook specialists

3. **MCP Memory** (`mcp__memory__*`):
   - Use for: Cross-session knowledge graphs, entity relationships
   - NOT for: Temporary state (use variables/TodoWrite)
   - Best for: Coordination agents, learning systems, audit trails

4. **External Platform MCPs**:
   - **github**: GitHub API operations beyond git CLI
   - **github-project-manager**: AI-powered project management with GitHub integration
   - **figma**: Design system access (visual agents)
   - **playwright/puppeteer**: Browser automation (testing agents)
   - **eva**: Performance benchmarking (QA agents)

5. **Research MCPs**:
   - **deepwiki**: GitHub repo documentation (research agents)
   - **firecrawl**: Web scraping (content agents)
   - **ref/ref-tools**: Technical documentation (compliance agents)
   - **context7**: Live docs (development agents)

**KEY PRINCIPLES:**
- Claude Code = Direct execution and manipulation
- MCP = Specialized integrations and external platforms
- Never use MCP filesystem for general coding tasks
- MCP IDE tools are for testing/validation, not development
- MCP memory is for persistent knowledge, not temporary state

## NEW: Claude Code Enhanced Capabilities

### Audit Trail & Governance Features
- **Transcript Mode (Ctrl+R)**: Model attribution for all AI outputs in quality gates
- **Enhanced SessionEnd Hooks**: Better cross-session memory and state management
- **Improved User Experience**: Configurable spinner tips (`spinnerTipsEnabled: false`)
- **Defense Industry Compliance**: Full audit trails for NASA POT10 requirements

### Integration with SPEK Workflow
- **Theater Detection Enhancement**: Use transcript data to validate model consistency
- **Reality Validation**: Track model performance across validation cycles
- **Agent Coordination**: SessionEnd hooks support 54+ agent workflows
- **Quality Gate Documentation**: Model attribution in `.claude/.artifacts/` for compliance

## [TOOL] Available Slash Commands (29 Total)

### **[SCIENCE] Research & Discovery Commands**
| Command | Description | Reference |
|---------|-------------|-----------|
| `/research:web` | Comprehensive web search for existing solutions | `.claude/commands/research-web.md` |
| `/research:github` | GitHub repository analysis for code quality | `.claude/commands/research-github.md` |
| `/research:models` | AI model research for specialized integration | `.claude/commands/research-models.md` |  
| `/research:deep` | Deep technical research for implementation guidance | `.claude/commands/research-deep.md` |
| `/research:analyze` | Large-context synthesis of research findings | `.claude/commands/research-analyze.md` |

### **[CLIPBOARD] Planning & Architecture Commands**
| Command | Description | Reference |
|---------|-------------|-----------|
| `/spec:plan` | Convert SPEC.md -> structured plan.json | `.claude/commands/spec-plan.md` |
| `/specify` | Define project requirements (Spec Kit native) | `.claude/commands/specify.md` |
| `/plan` | Specify technical implementation (Spec Kit native) | `.claude/commands/plan.md` |
| `/tasks` | Create actionable task list (Spec Kit native) | `.claude/commands/tasks.md` |
| `/gemini:impact` | Large-context change impact analysis | `.claude/commands/gemini-impact.md` |
| `/pre-mortem-loop` | Comprehensive risk analysis and mitigation | `.claude/commands/pre-mortem-loop.md` |

### **[LIGHTNING] Implementation Commands**
| Command | Description | Reference |
|---------|-------------|-----------|
| `/codex:micro` | Sandboxed micro-edits (<=25 LOC, <=2 files) | `.claude/commands/codex-micro.md` |
| `/codex:micro-fix` | Surgical fixes for test failures in sandbox | `.claude/commands/codex-micro-fix.md` |
| `/fix:planned` | Multi-file fixes with bounded checkpoints | `.claude/commands/fix-planned.md` |

### **[SHIELD] Quality Assurance Commands**
| Command | Description | Reference |
|---------|-------------|-----------|
| `/qa:run` | Comprehensive QA suite (tests/lint/types/coverage) | `.claude/commands/qa-run.md` |
| `/qa:analyze` | Analyze failures and route repair strategies | `.claude/commands/qa-analyze.md` |
| `/qa:gate` | Apply CTQ thresholds for gate decisions | `.claude/commands/qa-gate.md` |
| `/theater:scan` | Performance theater detection with quality correlation | `.claude/commands/theater-scan.md` |
| `/reality:check` | Reality validation for completion claims | `.claude/commands/reality-check.md` |

### **[SEARCH] Analysis & Architecture Commands**
| Command | Description | Reference |
|---------|-------------|-----------|
| `/conn:scan` | Advanced connascence analysis with 9 detector modules | `.claude/commands/conn-scan.md` |
| `/conn:arch` | Architectural analysis with detector pools & recommendations | `.claude/commands/conn-arch.md` |
| `/conn:monitor` | Real-time connascence monitoring and alerts | `.claude/commands/conn-monitor.md` |
| `/conn:cache` | Optimized connascence analysis with intelligent caching | `.claude/commands/conn-cache.md` |
| `/sec:scan` | Semgrep security scanning with OWASP rules | `.claude/commands/sec-scan.md` |
| `/audit:swarm` | Multi-agent quality audit with swarm coordination | `.claude/commands/audit-swarm.md` |

### **[CHART] Project Management Commands**
| Command | Description | Reference |
|---------|-------------|-----------|
| `/pm:sync` | Bidirectional sync with GitHub Project Manager | `.claude/commands/pm-sync.md` |
| `/pr:open` | Evidence-rich pull request creation | `.claude/commands/pr-open.md` |

### **[BRAIN] Memory & System Commands**
| Command | Description | Reference |
|---------|-------------|-----------|
| `/memory:unified` | Unified memory management across agents and sessions | `.claude/commands/memory-unified.md` |
| `/cleanup:post-completion` | Transform SPEK template to production-ready codebase | `.claude/commands/cleanup-post-completion.md` |
| **NEW:** `Ctrl+R` | **Transcript Mode**: View model attribution for all AI outputs | Built-in Claude Code feature |
| **NEW:** SessionEnd Hooks | **Enhanced Session Management**: Better memory persistence | Configure in Claude Code settings |

## [U+1F4DA] Quick Reference Links

---

**Key Principles**:
- **Claude Flow coordinates** → Swarm orchestration
- **Claude Code executes** → Direct implementation
- **AI Models optimize** → Task-specific performance
- **MCP Servers enhance** → Specialized capabilities

### **Quick Model Selection Guide**
- **Need browser automation?** → GPT-5 + Codex CLI + playwright/puppeteer
- **Need large context?** → Gemini 2.5 Pro + deepwiki/firecrawl
- **Need quality analysis?** → Claude Opus 4.1 + eva
- **Need coordination?** → Claude Sonnet 4 + sequential-thinking
- **Need cost efficiency?** → Gemini Flash + sequential-thinking

**Agent Registry**: `src/flow/config/agent-model-registry.js` [ROCKET]

*This streamlined configuration maximizes context window efficiency while maintaining full system functionality through comprehensive documentation references.*