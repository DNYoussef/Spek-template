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

## 🎯 Available Slash Commands

### Core SPEK Commands

#### `/spec:plan`
Read SPEC.md using Spec Kit's section semantics and output structured JSON:
```json
{ 
  "goals":[], 
  "tasks":[{
    "id":"",
    "title":"",
    "type":"small|multi|big",
    "scope":"",
    "verify_cmds":[],
    "budget_loc":25,
    "budget_files":2
  }], 
  "risks":[] 
}
```

#### `/specify` (Spec Kit native)
Define project requirements using Spec Kit templates

#### `/plan` (Spec Kit native)
Specify technical implementation details

#### `/tasks` (Spec Kit native)
Create actionable task list

### Analysis Commands

#### `/gemini:impact`
Generate change-impact map with Gemini CLI:
1. Run: `gemini -p "@$ARGUMENTS Create impact map. Output JSON {hotspots[], callers[], configs[], crosscuts[], testFocus[]} only."`
2. Show raw JSON output

### Implementation Commands

#### `/codex:micro`
Micro-edit via Codex with safety constraints:
- Budget: ≤25 LOC, ≤2 files
- Safety: Auto-stash/branch via hooks
- Verification: Tests + TypeCheck + Lint
- Output: Structured JSON with changes and verification

#### `/codex:micro-fix`
Targeted micro-fix for failing tests or bugs:
- Same constraints as `/codex:micro`
- Prefers find-related-tests flags where supported

#### `/fix:planned`
Multi-file fix with bounded checkpoints:
- Break into steps with file subsets
- Each step: ≤25 LOC budget
- Stop on first failed checkpoint
- Output: JSON summary

### Quality Assurance Commands

#### `/qa:run`
Run comprehensive QA in Codex sandbox:
1. Execute: Tests, TypeCheck, Lint, Coverage
2. Output: Structured JSON to `.claude/.artifacts/qa.json`

#### `/qa:analyze`
Analyze QA failures and route to appropriate fix strategy:
```json
{ 
  "size":"small|multi|big",
  "suspects":["file:line",...],
  "root_causes":["..."],
  "fix_strategy":"codex_micro|codex_seq|claude_plan|gemini_context" 
}
```

### Delivery Commands

#### `/pr:open`
Prepare PR body with evidence and checklists:
- Input: `.claude/.artifacts/qa.json` + analysis results
- Checklist: Gates passed, coverage maintained, risk assessment
- Output: PR body for GitHub MCP

## 🛠️ Build Commands

```bash
npm run build        # Build project
npm run test         # Run tests  
npm run lint         # Linting
npm run typecheck    # Type checking
npm run coverage     # Coverage analysis
```

## 🎭 Agent Capabilities & Constraints

### Codex Agent
- **Scope**: Micro-edits (≤25 LOC, ≤2 files)
- **Safety**: Auto-branch creation, clean working tree
- **Gates**: All QA commands must pass
- **Output**: JSON with changes and verification

### Gemini Agent  
- **Scope**: Large-context analysis
- **Capability**: Impact mapping, architectural analysis
- **Output**: JSON with hotspots, dependencies, test focus areas

### QA Agent
- **Scope**: Comprehensive verification
- **Gates**: Tests, TypeCheck, Lint, Coverage
- **Artifacts**: Results stored as JSON in `.claude/.artifacts/`

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

### Required Gates (All Must Pass):
1. **Tests**: `npm test --silent` → exit code 0
2. **Types**: `npm run typecheck` → exit code 0
3. **Lint**: `npm run lint --silent` → exit code 0
4. **Coverage**: No regression on changed lines

### Budget Constraints:
- `MAX_LOC: 25` (lines of code per operation)
- `MAX_FILES: 2` (files per micro-edit)

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