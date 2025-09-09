# Claude Code Configuration - SPEK Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code
- `.claude/.artifacts` - QA outputs and analysis results

## 📑 Complete Documentation Table of Contents

### **🔧 Core Commands & Quick Reference**
- **Slash Commands**: `docs/SPEK-METHODOLOGY.md` - 22+ specialized commands
- **Quality Gates**: `docs/QUALITY-GATES-REFERENCE.md` - CTQ thresholds & validation
- **Agent Commands**: 54+ specialized agents with swarm coordination
- **Build Commands**: `npm run build|test|lint|typecheck|coverage`

### **🏗️ Project Architecture & Analysis**
- **Project Structure**: `docs/PROJECT-STRUCTURE.md` - Complete 70-file system layout
- **Analyzer Capabilities**: `docs/ANALYZER-CAPABILITIES.md` - 25,640 LOC analysis engine
- **Consolidation Results**: `docs/MECE-CONSOLIDATION-PLAN.md` - Phase 1 achievements
- **CLI Integration**: `docs/CLI-INTEGRATION-GAPS.md` - Enhancement roadmap

### **🧠 Memory System & Intelligence**
- **Unified Memory Architecture**: `docs/UNIFIED-MEMORY-ARCHITECTURE.md` - Consolidated system
- **Cross-Agent Memory**: Memory MCP + Claude Flow integration
- **Session Management**: Persistent state & context restoration
- **Neural Training**: Pattern learning & optimization

### **📊 Quality & Compliance**
- **NASA POT10 Compliance**: `docs/NASA-POT10-COMPLIANCE-STRATEGIES.md` - Defense industry ready
- **Connascence Analysis**: `docs/CONNASCENCE-VIOLATION-PATTERNS-RESEARCH.md` - Pattern detection
- **God Object Decomposition**: `docs/GOD-OBJECT-DECOMPOSITION-RESEARCH.md` - Refactoring strategies
- **Theater Detection**: Reality validation & completion verification

### **⚙️ Methodology & Process**
- **SPEK Workflow**: Specification → Research → Planning → Execution → Knowledge
- **3 Interconnected Loops**: Spec-Plan-Research | Development-Quality | Theater-Reality
- **GitHub Integration**: Closed-loop quality system with MCP servers
- **Safety Mechanisms**: Bounded operations, rollback capabilities, evidence packaging

## 🎯 Essential Agent Coordination

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

## 📊 Quality Gate Essentials

### **Critical Gates (Must Pass)**
- **NASA Compliance**: ≥90% (currently 92% post-Phase 2)
- **God Objects**: ≤25 (achieved through Phase 1 consolidation)
- **MECE Score**: ≥0.75 (achieved >0.85 post-consolidation)
- **Security**: Zero critical/high findings

### **Current System Status**
- **Total Files**: 70 (reduced from 74, -5.4%)
- **LOC Eliminated**: 1,568 (Phase 1 consolidation)
- **God Objects**: 2 major eliminated (4 focused classes created)
- **Defense Industry**: ✅ READY (92% NASA compliance)

## 🔄 Loop System Integration

### **Loop 1**: Spec-Plan-Research-Premortem
Research → Planning → Risk mitigation → Foundation setting

### **Loop 2**: Development-Quality-GitHub Integration  
Implementation → Quality gates → Evidence packaging → PR creation

### **Loop 3**: Theater Detection-Reality Validation
Pattern detection → Evidence validation → Quality verification → Learning

## 🚀 MCP Server Integration

**By Development Phase:**
- **PLAN**: Sequential Thinking, Memory, Context7
- **DISCOVER**: Ref, DeepWiki, Firecrawl, MarkItDown  
- **IMPLEMENT**: GitHub, Codex sandboxing
- **VERIFY**: Playwright, eva, Theater detection
- **DELIVER**: GitHub, Evidence packaging

## 📚 Documentation Quick Links

| Category | Documentation File |
|----------|-------------------|
| **Project Overview** | `README.md`, `docs/PROJECT-STRUCTURE.md` |
| **Architecture** | `docs/ANALYZER-CAPABILITIES.md` |
| **Quality** | `docs/NASA-POT10-COMPLIANCE-STRATEGIES.md` |
| **Memory System** | `docs/UNIFIED-MEMORY-ARCHITECTURE.md` |
| **Methodology** | `docs/SPEK-METHODOLOGY.md` |
| **Examples** | `examples/` directory |

---

**Key Principle**: Claude Flow coordinates, Claude Code executes! 🚀

*This streamlined configuration maximizes context window efficiency while maintaining full system functionality through comprehensive documentation references.*