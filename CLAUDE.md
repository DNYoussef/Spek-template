# Claude Code Configuration - SPEK Enhanced Development Platform

# RULES FOR CODING
1. NO UNICODE OR EMOKI'S


## [TARGET] Project Overview

**SPEK Enhanced Development Platform** is a comprehensive AI-driven development environment that extends GitHub's Spec Kit with Research Intelligence, Theater Detection, and Reality Validation. The platform integrates 54+ AI agents, 29 specialized slash commands, and comprehensive quality gates to deliver **30-60% faster development** with **zero-defect production delivery**.

### Core Pipeline: S-R-P-E-K Methodology
```
Specification -> Research -> Planning -> Execution -> Knowledge
     v             v          v           v          v
  Define       Discover   Generate    Implement   Validate
Requirements  Solutions   Strategy     Features    Quality
```

**Key Differentiators:**
- **Research-First Approach**: Discover existing solutions before building from scratch
- **Theater Detection**: Eliminate fake work and validate genuine quality improvements  
- **Defense Industry Ready**: 95% NASA POT10 compliance with comprehensive quality gates
- **Parallel Execution**: 2.8-4.4x speed improvement through concurrent operations
- **Reality Validation**: Evidence-based verification preventing completion theater
- **AI Governance**: Full model attribution and audit trails via transcript mode and enhanced hooks

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

## [TARGET] Essential Agent Coordination

### **Specialized Agent Categories (54 Total)**
- **Core Development**: `coder`, `reviewer`, `tester`, `planner`, `researcher`
- **SPEK Methodology**: `sparc-coord`, `specification`, `architecture`, `refinement`
- **Quality Assurance**: `code-analyzer`, `security-manager`, `performance-benchmarker`
- **GitHub Integration**: `pr-manager`, `github-modes`, `workflow-automation`
- **Swarm Coordination**: `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

### **Agent Deployment Pattern**
```bash
# CORRECT: Single message with all agents
Task("agent1: specific instructions")
Task("agent2: specific instructions")  
Task("agent3: specific instructions")

# WRONG: Multiple messages
Message 1: Task("agent1")
Message 2: Task("agent2")
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

## [ROCKET] MCP Server Integration

**By Development Phase:**
- **PLAN**: Sequential Thinking, Memory, Context7
- **DISCOVER**: Ref, DeepWiki, Firecrawl, MarkItDown  
- **IMPLEMENT**: GitHub, Codex sandboxing
- **VERIFY**: Playwright, eva, Theater detection
- **DELIVER**: GitHub, Evidence packaging

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
| `/pm:sync` | Bidirectional sync with Plane MCP | `.claude/commands/pm-sync.md` |
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

**Key Principle**: Claude Flow coordinates, Claude Code executes! [ROCKET]

*This streamlined configuration maximizes context window efficiency while maintaining full system functionality through comprehensive documentation references.*