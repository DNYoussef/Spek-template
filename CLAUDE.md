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
Leverage Gemini's large context window for comprehensive change-impact analysis:
- **Input**: Target change description + full codebase context
- **Analysis**: Hotspots, callers, dependencies, cross-cutting concerns
- **Output**: JSON with risk assessment and implementation guidance
- **Use When**: Complex changes, architectural modifications, high-risk updates

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
Comprehensive quality assurance suite with parallel execution:
- **Execution**: Tests, TypeCheck, Lint, Coverage, Security, Connascence
- **Output**: Structured JSON to `.claude/.artifacts/qa.json`
- **Integration**: Feeds into quality gates and fix routing
- **Performance**: Parallel execution, changed-files optimization

#### `/qa:gate`
Apply SPEK-AUGMENT CTQ thresholds for deployment decisions:
- **Critical Gates**: Tests (100% pass), TypeCheck (0 errors), Security (0 high/critical)
- **Quality Gates**: Lint, Coverage, Connascence (warnings but allow)
- **Output**: Pass/fail decision with detailed reasoning and fix recommendations
- **Integration**: Used by PR workflows and deployment pipelines

### Security & Architecture Commands

#### `/sec:scan`
Comprehensive security scanning with Semgrep and OWASP rules:
- **Scope**: Changed files or full codebase analysis
- **Rules**: OWASP Top 10, CWE Top 25, secrets detection
- **Output**: Categorized findings with remediation guidance
- **Integration**: Blocks deployment on critical/high findings

#### `/conn:scan`
Connascence analysis with NASA POT10 compliance metrics:
- **Analysis**: Structural coupling, code quality, architectural debt
- **Metrics**: NASA Program On a Tear (POT10) compliance scoring
- **Output**: Compliance score, technical debt assessment, refactoring priorities
- **Integration**: Architectural quality gates and improvement guidance

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
4. **Coverage**: No regression on changed lines - maintain or improve coverage

### Quality Gates (Warn but Allow):
1. **Lint**: Zero errors preferred - warnings allowed with justification
2. **Connascence**: NASA POT10 compliance ≥90% - architectural quality tracking
3. **Performance**: No significant regressions - monitor key metrics

### Budget Constraints by Operation Type:
- **Micro-edits**: ≤25 LOC, ≤2 files, isolated changes only
- **Planned fixes**: ≤25 LOC per checkpoint, unlimited checkpoints
- **Architecture changes**: No fixed limits, require impact analysis

### SPEK-AUGMENT CTQ Thresholds:
- **Test Reliability**: 100% pass rate, no flaky tests
- **Type Safety**: Complete TypeScript coverage, strict configuration
- **Security Compliance**: Zero critical vulnerabilities, OWASP alignment
- **Architectural Quality**: NASA POT10 ≥90%, low connascence coupling

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

### Quality Workflow:
1. Edit files using appropriate commands
2. Run `/qa:run` for verification
3. If failures: Use `/qa:analyze` for triage
4. Route to appropriate fix strategy
5. Loop until all gates pass
6. Use `/pr:open` for delivery

## 🚀 Quick Start Workflow

1. **Plan**: Run `/spec:plan` on your SPEC.md
2. **Analyze**: Use `/gemini:impact` for complex changes
3. **Implement**: 
   - Small changes: `/codex:micro`
   - Multi-file: `/fix:planned`
4. **Verify**: `/qa:run` → check gates
5. **Fix**: Use analysis routing if needed
6. **Deliver**: `/pr:open` when ready

## 📚 Reference Links

- **Spec Kit**: https://github.com/github/spec-kit
- **Spec-Driven Development**: https://github.com/github/spec-kit/blob/main/spec-driven.md
- **Blog Post**: https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/

---

**Remember**: Claude Flow coordinates, Claude Code executes! 🚀