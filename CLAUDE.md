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
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code
- `.claude/.artifacts` - QA outputs and analysis results

## Project Overview

This project uses SPEK (Specification, Planning, Execution, Knowledge) methodology with Claude Flow orchestration, integrated with:
- **GitHub Spec Kit** - Official specification-driven development framework
- **Claude Flow** - Workflow orchestration and agent coordination
- **Gemini CLI** - Large-context analysis and impact mapping
- **Codex CLI** - Sandboxed micro-edits and automated QA
- **MCP Servers** - Multi-modal development tool integration

## 🎯 Complete Slash Commands Reference

> 📖 **Quick Reference**: See `docs/QUICK-REFERENCE.md` for command cheat sheet
> 🎓 **Tutorials**: See `examples/` directory for step-by-step guides

### Core SPEK Commands

#### `/spec:plan`
Convert SPEC.md to structured plan.json for workflow orchestration:
```json
{ 
  "goals": ["Primary objectives from SPEC"],
  "tasks": [{
    "id": "task-001",
    "title": "Descriptive task name",
    "type": "small|multi|big",
    "scope": "Detailed implementation scope", 
    "verify_cmds": ["npm test", "npm run typecheck"],
    "budget_loc": 25,
    "budget_files": 2,
    "acceptance": ["Measurable success criteria"]
  }],
  "risks": ["Technical and business risks"]
}
```

#### `/specify` (Spec Kit Native)
Define project requirements using GitHub's Spec Kit templates and semantics

#### `/plan` (Spec Kit Native) 
Specify technical implementation details with structured planning approach

#### `/tasks` (Spec Kit Native)
Create actionable task breakdown from specifications

### Analysis & Impact Commands

#### `/gemini:impact`
Leverage Gemini's large context window for comprehensive change-impact analysis with MCP integration:
- **Input**: Target change description + full codebase context
- **Analysis**: Hotspots, callers, dependencies, cross-cutting concerns
- **Sequential Thinking**: Structured impact analysis using Sequential Thinking MCP for systematic reasoning
- **Memory Integration**: Historical change impact patterns with Memory MCP learning
- **Enhanced Analysis**: Architecture-aware impact assessment with connascence correlation
- **Output**: JSON with risk assessment, implementation guidance, and memory updates
- **Use When**: Complex changes, architectural modifications, high-risk updates
- **Flags**: `--sequential-thinking`, `--memory-update`, `--architecture-context`, `--connascence-correlation`

#### `/qa:analyze`
Intelligent failure analysis that routes to appropriate fix strategy:
```json
{
  "classification": {"size": "small|multi|big", "confidence": 0.87},
  "root_causes": ["Specific failure analysis"],
  "fix_strategy": {
    "primary_approach": "codex:micro|fix:planned|gemini:impact",
    "estimated_time": "3-5 minutes",
    "success_rate": 0.85
  }
}
```

### Implementation Commands

#### `/codex:micro`
Sandboxed micro-edits with comprehensive testing (leverages Codex sandboxing):
- **Budget**: ≤25 LOC, ≤2 files, isolated changes
- **Safety**: Auto-branch creation, clean working tree verification
- **Verification**: Tests + TypeCheck + Lint + Coverage in sandbox
- **Output**: Structured JSON with changes, verification, and merge readiness

#### `/codex:micro-fix`
Surgical fixes for test failures detected in sandbox loops:
- **Purpose**: Codex performs precise diagnostic edits when tests fail
- **Constraints**: Same as `/codex:micro` - bounded and sandboxed
- **Integration**: Used automatically in edit-test-fix cycles
- **Output**: JSON with specific fixes applied and verification results

#### `/fix:planned`
Systematic multi-file fixes with bounded checkpoints:
- **Approach**: Break complex fixes into ≤25 LOC checkpoints
- **Safety**: Rollback points before each checkpoint
- **Verification**: Quality gates at each checkpoint
- **Output**: JSON summary with checkpoint results and rollback availability

### Quality Assurance Commands

#### `/qa:run`
Enhanced quality assurance suite with architectural intelligence and performance optimization:
- **Core QA Suite**: Tests, TypeCheck, Lint, Coverage, Security scanning
- **Advanced Connascence**: All 9 detector modules (CoM, CoP, CoA, CoT, CoV, CoE, CoI, CoN, CoC)
- **God Object Detection**: Context-aware analysis with configurable thresholds
- **MECE Analysis**: Duplication detection with consolidation recommendations
- **NEW: Architecture Integration**: Cross-component analysis, hotspot detection, coupling assessment
- **NEW: Performance Intelligence**: Resource monitoring, cache optimization, trend analysis
- **NEW: Smart Recommendations**: AI-powered architectural guidance and refactoring priorities
- **Sequential Thinking**: Structured QA reasoning using Sequential Thinking MCP
- **Memory Integration**: Quality pattern learning and historical context with Memory MCP
- **Enhanced Flags**: `--architecture`, `--performance-monitor`, `--sequential-thinking`, `--memory-update`
- **Output**: Architectural insights, performance metrics, smart recommendations to `.claude/.artifacts/`
- **Integration**: Enhanced failure routing with architectural context

#### `/qa:gate`
Apply SPEK-AUGMENT CTQ thresholds for deployment decisions:
- **Critical Gates**: Tests (100% pass), TypeCheck (0 errors), Security (0 high/critical)
- **Quality Gates**: Lint, Coverage, Connascence (warnings but allow)
- **Output**: Pass/fail decision with detailed reasoning and fix recommendations
- **Integration**: Used by PR workflows and deployment pipelines

### Architecture & Performance Commands

#### `/conn:arch`
Advanced architectural analysis leveraging the full analyzer engine with MCP integration:
- **Detector Pool**: Reusable detector instances for performance optimization (40-50% faster)
- **Enhanced Metrics**: Comprehensive quality scoring with 35+ NASA compliance files
- **Smart Recommendations**: AI-powered architectural guidance and refactoring priorities
- **Cross-Component Analysis**: Multi-file dependency analysis and coupling detection
- **Integration Points**: Architecture violation hotspot identification
- **Sequential Thinking**: Structured architectural reasoning using Sequential Thinking MCP
- **Memory Integration**: Persistent architectural patterns and learning with Memory MCP
- **Gemini Integration**: Large-context architectural analysis with systematic thinking
- **Flags**: `--hotspots`, `--detector-pool`, `--cross-component`, `--recommendations`, `--memory-update`, `--gemini-context`
- **Output**: Hotspot analysis, coupling metrics, smart recommendations, performance insights
- **Benefits**: Systematic architecture improvement with data-driven refactoring guidance

#### `/conn:cache`
Intelligent cache management for the IncrementalCache system with performance optimization:
- **Cache Inspection**: Detailed cache health and utilization metrics
- **Cache Optimization**: Automatic cache cleanup and optimization strategies (30-50% CI/CD improvement)
- **Performance Monitoring**: Real-time cache performance and hit rate tracking
- **Sequential Thinking**: Systematic cache analysis using Sequential Thinking MCP
- **Memory Integration**: Cache performance pattern learning with Memory MCP
- **Flags**: `--inspect`, `--cleanup`, `--optimize`, `--stats`, `--sequential-thinking`, `--memory-update`
- **Output**: Cache health metrics, optimization recommendations, performance benchmarks
- **Benefits**: Significantly faster CI/CD through intelligent cache management

#### `/conn:monitor`  
Comprehensive performance monitoring with resource tracking and trend analysis:
- **Memory Monitoring**: Real-time memory usage and optimization tracking
- **Resource Tracking**: CPU, memory, and I/O resource utilization
- **Performance Benchmarking**: Analysis performance metrics and optimization
- **Trend Analysis**: Long-term performance evolution and regression detection
- **Sequential Thinking**: Structured performance analysis using Sequential Thinking MCP
- **Memory Integration**: Performance baseline learning with Memory MCP
- **Flags**: `--memory`, `--resources`, `--benchmark`, `--trends`, `--sequential-thinking`, `--memory-update`
- **Output**: Performance metrics, bottleneck analysis, optimization recommendations
- **Benefits**: Proactive performance management with predictive optimization

### Security & Architecture Commands

#### `/sec:scan`
Comprehensive security scanning with Semgrep and OWASP rules:
- **Scope**: Changed files or full codebase analysis
- **Rules**: OWASP Top 10, CWE Top 25, secrets detection
- **Output**: Categorized findings with remediation guidance
- **Integration**: Blocks deployment on critical/high findings

#### `/conn:scan`
Enhanced connascence analysis with full analyzer integration and architectural intelligence:
- **Core Analysis**: 9 specialized detector modules (CoM, CoP, CoA, CoT, CoV, CoE, CoI, CoN, CoC)
- **God Object Detection**: Context-aware detection with domain-specific thresholds
- **MECE Duplication Analysis**: Mutually Exclusive, Collectively Exhaustive duplication detection
- **NASA POT10 Compliance**: Full Power of Ten rules with defense industry standards
- **NEW: Architecture Integration**: Cross-component analysis, hotspot detection, smart recommendations
- **NEW: Performance Optimization**: Detector pools for 30-50% speed improvement
- **NEW: Enhanced Metrics**: Comprehensive quality scoring with architectural context
- **Streaming Analysis**: Real-time incremental processing for CI/CD
- **Sequential Thinking Integration**: Structured analysis using Sequential Thinking MCP for systematic reasoning
- **Memory Integration**: Persistent learning with Memory MCP - updates relevant analysis patterns and insights
- **Enhanced Flags**: `--architecture`, `--detector-pools`, `--enhanced-metrics`, `--hotspots`, `--cache-stats`
- **Output**: SARIF integration, JSON reports, architectural insights, GitHub Security tab integration
- **Quality Gates**: NASA compliance ≥90%, duplication score ≥0.75, architectural health ≥0.75


### Project Management & Delivery Commands

#### `/pm:sync`
Bidirectional synchronization with Plane MCP project management:
- **Sync**: Development status ↔ Project management tracking
- **Features**: Task mapping, progress reporting, stakeholder notifications
- **Output**: Sync results, conflict resolution, project health metrics
- **Integration**: Automated progress reporting and stakeholder alignment

#### `/pr:open`
Evidence-rich pull request creation with comprehensive documentation:
- **Evidence**: QA results, impact analysis, security scan, architectural metrics
- **Content**: Professional PR body with checklists and deployment notes
- **Integration**: Automated reviewer assignment, label application, merge configuration
- **Output**: GitHub PR URL with complete evidence package

## 🛠️ Build Commands

```bash
npm run build        # Build project
npm run test         # Run tests  
npm run lint         # Linting
npm run typecheck    # Type checking
npm run coverage     # Coverage analysis
```

## 🎭 Agent Capabilities & Constraints

### Codex Agent (Sandboxing & Testing)
- **Primary Role**: Sandboxed micro-edits and surgical test fixes
- **Sandboxing**: Auto-branch creation, isolated execution, clean rollback
- **Testing Focus**: Immediate test execution and failure recovery in sandbox
- **Constraints**: ≤25 LOC, ≤2 files, comprehensive quality gates
- **Output**: JSON with changes, verification results, and merge readiness

### Gemini Agent (Large Context Window)
- **Primary Role**: Architectural analysis leveraging massive context window
- **Context Capability**: Full codebase analysis, cross-cutting impact assessment
- **Analysis Scope**: Change impact, dependency mapping, risk assessment
- **Output**: JSON with hotspots, architectural guidance, implementation sequence

### Claude Code Agent (Primary Implementation)
- **Primary Role**: Main development work, complex implementations, planning
- **Integration**: Coordinates with Codex for testing, Gemini for analysis
- **Scope**: Full-scale development, multi-file changes, architectural work
- **Workflow**: Handles primary implementation while Codex/Gemini provide specialized support

### QA Agent (Comprehensive Verification)
- **Scope**: Parallel execution of all quality gates
- **Gates**: Tests, TypeCheck, Lint, Coverage, Security, Connascence
- **Artifacts**: Structured results stored as JSON in `.claude/.artifacts/`
- **Integration**: Feeds analysis and routing for automated fixes

## 🔄 Claude Flow Integration

### Workflow Files
- `flow/workflows/after-edit.yaml` - Post-edit QA → triage → fix loop
- `flow/workflows/spec-to-pr.yaml` - Complete SPEC → PR execution

### Execution Commands
```bash
flow run flow/workflows/spec-to-pr.yaml    # Full specification to PR
flow run flow/workflows/after-edit.yaml    # Post-edit quality loop
```

## 🔗 MCP Server Integration

### By Development Phase:
- **PLAN**: Sequential Thinking, Memory, Context7
- **DISCOVER**: Ref, DeepWiki, Firecrawl, Huggingface, MarkItDown
- **IMPLEMENT**: GitHub, MarkItDown
- **VERIFY**: Playwright, eva
- **REVIEW/DELIVER**: GitHub, MarkItDown  
- **LEARN**: Memory, Ref

## 🚦 Quality Gates

### Critical Gates (Must Pass for Deployment):
1. **Tests**: 100% pass rate - no test failures allowed
2. **TypeScript**: Zero compilation errors - warnings allowed
3. **Security**: Zero critical/high findings - medium findings allowed with review
4. **NASA Compliance**: ≥90% POT10 compliance score - defense industry standard
5. **God Objects**: ≤25 god objects detected - architectural quality threshold
6. **Critical Violations**: ≤50 critical connascence violations - structural quality gate
7. **Coverage**: No regression on changed lines - maintain or improve coverage

### Quality Gates (Warn but Allow):
1. **Lint**: Zero errors preferred - warnings allowed with justification
2. **MECE Score**: ≥0.75 duplication score - architectural consolidation opportunities
3. **Total Violations**: <1000 connascence violations - overall quality threshold
4. **Architecture Hotspots**: ≤5 hotspots detected - refactoring guidance provided
5. **Coupling Quality**: ≤0.5 coupling score - architectural health monitoring
6. **Cache Performance**: ≥0.80 cache health score - performance optimization
7. **Performance Efficiency**: ≥0.70 resource efficiency - monitoring and optimization

### Budget Constraints by Operation Type:
- **Micro-edits**: ≤25 LOC, ≤2 files, isolated changes only
- **Planned fixes**: ≤25 LOC per checkpoint, unlimited checkpoints
- **Architecture changes**: No fixed limits, require impact analysis

### SPEK-AUGMENT CTQ Thresholds:
- **Test Reliability**: 100% pass rate, no flaky tests
- **Type Safety**: Complete TypeScript coverage, strict configuration
- **Security Compliance**: Zero critical vulnerabilities, OWASP alignment
- **Defense Industry Standards**: NASA POT10 ≥90% compliance, full Power of Ten rules
- **Architectural Quality**: ≤25 god objects, ≥0.75 MECE score, low connascence coupling
- **Structural Integrity**: ≤50 critical violations, cross-component analysis
- **Quality Evidence**: SARIF integration, GitHub Security tab reporting

## 🔒 Safety Mechanisms

### Hooks Configuration (`.claude/settings.json`):
```json
{
  "hooks": {
    "preTool": [
      {"match": "codex exec", "cmd": "test -z \"$(git status --porcelain)\" || git stash -k -u"},
      {"match": "codex exec", "cmd": "git checkout -b codex/task-$(date +%s)"}
    ],
    "postTool": [
      {"match": "codex exec", "cmd": "git status --porcelain && echo 'Review with: git diff --stat'"}
    ]
  }
}
```

## 📊 Performance Benefits

- **Concurrent Execution**: 2.8-4.4x speed improvement
- **Token Reduction**: 32.3% efficiency gain  
- **High Success Rate**: 84.8% on SWE-Bench
- **Neural Models**: 27+ specialized models available
- **NEW: Cache Optimization**: 30-50% CI/CD speed improvement through intelligent caching
- **NEW: Detector Pool Performance**: 40-50% faster analysis through reusable detector instances
- **NEW: Architectural Intelligence**: Smart recommendations reduce technical debt and improve maintainability
- **NEW: Unified Memory System**: 67% faster queries, 43% memory reduction, eliminates duplication
- **NEW: Cross-Agent Intelligence**: 2.3x learning acceleration through consolidated pattern recognition
- **NEW: Memory Coordination**: Seamless agent handoffs with unified session state

## 🎯 Best Practices

### Concurrent Operations (MANDATORY):
```bash
# ✅ CORRECT - Single message with all operations
TodoWrite { todos: [multiple items] }
Task("agent1"), Task("agent2"), Task("agent3")
Read("file1"), Read("file2"), Read("file3")
Bash("cmd1"), Bash("cmd2"), Bash("cmd3")

# ❌ WRONG - Multiple messages
Message 1: TodoWrite
Message 2: Task
Message 3: Read
```

### File Organization:
- Source code → `/src`
- Tests → `/tests`  
- Documentation → `/docs`
- QA artifacts → `.claude/.artifacts`
- **NEVER** save working files to root

### Enhanced Quality Workflow:
1. **Cache Optimization**: `/conn:cache --optimize` for performance
2. **Architectural Analysis**: `/conn:arch --hotspots --recommendations` for system health
3. **Enhanced QA**: `/qa:run --architecture --performance-monitor` for comprehensive verification
4. **Smart Failure Analysis**: `/qa:analyze --architecture-context --smart-recommendations` for intelligent triage
5. **Performance Monitoring**: `/conn:monitor --trends --optimization` for system insights
6. **Iterative Improvement**: Loop until all gates pass with architectural guidance
7. **Evidence-Rich Delivery**: `/pr:open` with comprehensive analysis artifacts

### Example Enhanced Workflows:

#### Comprehensive Analysis Pipeline
```bash
# Full architectural intelligence pipeline
/conn:cache --optimize --memory-update && \
/conn:arch --hotspots --detector-pool --cross-component --recommendations && \
/conn:scan --architecture --detector-pools --enhanced-metrics --hotspots && \
/qa:run --architecture --performance-monitor --sequential-thinking
```

#### Performance-Optimized Development
```bash
# Performance-first development workflow
/conn:cache --inspect --cleanup --optimize && \
/conn:monitor --memory --resources --benchmark --trends && \
/qa:run --architecture --performance-monitor && \
/conn:arch --recommendations --memory-update
```

#### Smart Failure Recovery
```bash
# Architecture-aware failure analysis and routing
/qa:analyze --architecture-context --smart-recommendations --coupling-analysis && \
/conn:arch --hotspots --cross-component --recommendations
```

## 🚀 Enhanced Quick Start Workflow

1. **Plan**: Run `/spec:plan` on your SPEC.md
2. **Optimize**: `/conn:cache --optimize` for performance
3. **Analyze**: `/gemini:impact` for complex changes + `/conn:arch --hotspots` for architecture
4. **Implement**: 
   - Small changes: `/codex:micro`
   - Multi-file: `/fix:planned`
   - Architecture changes: Use `/conn:arch` recommendations
5. **Verify**: `/qa:run --architecture --performance-monitor` → comprehensive gates
6. **Monitor**: `/conn:monitor --trends` for performance insights
7. **Fix**: Use `/qa:analyze --architecture-context` for smart routing
8. **Deliver**: `/pr:open` with architectural evidence

## 📚 Reference Links

### Core Documentation
- **Spec Kit**: https://github.com/github/spec-kit
- **Spec-Driven Development**: https://github.com/github/spec-kit/blob/main/spec-driven.md
- **Blog Post**: https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/

### Analyzer Documentation
- **Analyzer Capabilities Matrix**: `docs/ANALYZER-CAPABILITIES.md` - Complete 70-file analysis engine overview
- **CLI Integration Gaps**: `docs/CLI-INTEGRATION-GAPS.md` - Enhancement roadmap and missing features
- **Quality Gates Reference**: Enhanced CI/CD with defense industry standards

---

**Remember**: Claude Flow coordinates, Claude Code executes! 🚀