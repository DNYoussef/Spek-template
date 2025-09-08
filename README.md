# SPEK-Driven Development Template

## 🚀 Overview

This template integrates **GitHub's Spec Kit** with **Claude Flow**, **Gemini CLI**, **Codex CLI**, **Connascence Analysis**, **Semgrep Security**, and **Plane MCP** to create the most comprehensive AI-driven, quality-gated development environment available.

## 📚 Spec-Driven Development (Spec Kit)

This template follows GitHub's **Spec Kit** process end-to-end (Specify → Plan → Tasks/Discover → Implement → Verify → Review → Deliver → Learn).  
- **Spec Kit repo:** canonical docs, CLI usage, and process overview.  
- **Deep dive:** `spec-driven.md` explains the phases and how agents consume the spec.  
- **Getting started blog:** short intro with examples using Copilot, Claude Code, and Gemini CLI.

**Links**
- Spec Kit repository: https://github.com/github/spec-kit  
- Detailed process (`spec-driven.md`): https://github.com/github/spec-kit/blob/main/spec-driven.md  
- "Get started" blog announcement: https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/

## 🔄 The SPEK Loop

**Spec → Plan → Discover → Implement → Verify → Review → Deliver → Learn**

### How Claude Flow Orchestrates Each Phase:

1. **SPECIFY** (`SPEC.md`) - Define requirements clearly
2. **PLAN** (`/spec:plan`) - Convert spec to structured JSON tasks  
3. **DISCOVER** (`/gemini:impact`) - Wide-context impact analysis
4. **IMPLEMENT** - Route by complexity:
   - `small` → `/codex:micro` (sandboxed, ≤25 LOC, ≤2 files)
   - `multi` → `/fix:planned` (checkpointed steps)
   - `big` → Gemini context → planned approach
5. **VERIFY** (`/qa:run`) - Automated QA gates (tests/typecheck/lint/coverage)
6. **REVIEW** (`/qa:analyze`) - Failure triage → routing strategy
7. **DELIVER** (`/pr:open`) - Evidence-based PR preparation
8. **LEARN** - Memory persistence via MCP

## 🛠️ Comprehensive Tool Integration

### Core Quality Stack
- **Connascence Analyzer** - Structural quality with NASA JPL POT10 compliance
- **Semgrep Security** - OWASP Top 10 + custom security rules
- **TypeScript** - Strict type safety with comprehensive checks
- **ESLint** - Code style + security plugin enforcement
- **Jest** - Test framework with coverage analysis
- **Differential Coverage** - Coverage tracking on changed files only

### AI Agent Coordination
- **Claude Flow** - Orchestrates multi-agent workflows
- **Claude Code** - 17 specialized slash commands for SPEK loop
- **Gemini CLI** - Large-context analysis and impact mapping
- **Codex CLI** - Sandboxed micro-edits with safety constraints
- **Plane MCP** - Project management synchronization

### Quality Gates (All Must Pass)
- ✅ **Tests**: 100% pass rate  
- ✅ **TypeCheck**: Zero compilation errors
- ✅ **Lint**: Zero errors (warnings with justification)
- ✅ **Security**: Zero critical, ≤5 high findings
- ✅ **Connascence**: NASA compliance ≥90%, dup score ≥0.75
- ✅ **Coverage**: No regression on changed lines

### MCP Server Assignments by Phase:

| Phase | MCP Servers | Purpose |
|-------|-------------|---------|
| **PLAN** | Sequential Thinking, Memory, Context7 | Structure reasoning, recall patterns |
| **DISCOVER** | Ref, DeepWiki, Firecrawl, Huggingface, MarkItDown | Research, normalize content |
| **IMPLEMENT** | Github, MarkItDown | Code management, documentation |
| **VERIFY** | Playwright, eva | End-to-end testing, evaluation |
| **REVIEW/DELIVER** | Github, MarkItDown | PR management, release notes |
| **LEARN** | Memory, Ref | Store lessons, reference sources |

## 🎯 Quick Start

1. **Setup Dependencies**:
   ```bash
   npm install                    # Install Node.js dependencies
   pip install -e ./analyzer     # Install connascence analyzer
   pip install semgrep pip-audit # Install security tools
   ```

2. **Configure Environment**:
   - Edit `configs/plane.json` with your Plane API credentials
   - Review `configs/codex.json` for budget constraints
   - Adjust `configs/.semgrep.yml` for custom security rules

3. **Start Development**:
   ```bash
   # 1. Edit SPEC.md with your requirements
   # 2. Generate plan
   /spec:plan
   
   # 3. Execute full workflow  
   flow run flow/workflows/spec-to-pr.yaml
   
   # OR for post-edit quality loop
   flow run flow/workflows/after-edit.yaml
   
   # OR for CI auto-repair
   flow run flow/workflows/ci-auto-repair.yaml
   ```

4. **Available Commands**: 17 specialized slash commands:
   ```bash
   # Planning & Analysis
   /spec:plan          # SPEC.md → structured JSON
   /gemini:impact      # Change impact analysis
   
   # Implementation  
   /codex:micro        # Bounded micro-edits (≤25 LOC, ≤2 files)
   /codex:micro-fix    # Targeted bug fixes
   /fix:planned        # Multi-file planned fixes
   
   # Quality Assurance
   /qa:run             # Comprehensive QA suite
   /qa:gate            # Aggregate all quality gates
   /qa:analyze         # Failure triage and routing
   
   # Security & Structure
   /sec:scan           # Semgrep + package audits  
   /conn:scan          # Connascence analysis
   /conn:gate          # Connascence quality gate
   /conn:fix-hints     # Structural improvement hints
   
   # Project Management
   /pm:sync            # Sync to Plane MCP
   
   # Delivery
   /pr:open            # Evidence-based PR creation
   ```

## 🏗️ Project Structure

```
├── .claude/
│   ├── commands/          # Claude Code slash commands
│   ├── .artifacts/        # QA outputs, analysis results
│   └── settings.json      # Hooks configuration
├── flow/workflows/        # Claude Flow YAML workflows
├── gemini/               # Gemini CLI outputs
├── memory/               # Spec Kit constitution & memory
├── scripts/              # Utility scripts
├── templates/            # Spec Kit templates
├── SPEC.md              # Main specification
└── AGENTS.md            # Codex proof rules & gates
```

## 🚦 Quality Gates

All changes must pass:
- **Tests**: `npm test --silent`
- **Type checking**: `npm run typecheck` 
- **Linting**: `npm run lint --silent`
- **Coverage**: No regression on changed lines

## 🔄 Flow Workflows

- **`spec-to-pr.yaml`**: Complete SPEC → PR cycle with PM sync
- **`after-edit.yaml`**: Post-edit QA with intelligent repair routing
- **`ci-auto-repair.yaml`**: Automated failure analysis and bounded fixes

## 🤖 CI/CD Integration

- **`.github/workflows/quality-gates.yml`**: Comprehensive quality gates on PRs
- **`.github/workflows/auto-repair.yml`**: Automatic repair attempts on failures
- **SARIF integration**: Security findings appear in GitHub Security tab
- **Evidence artifacts**: Complete quality audit trail for every change

## 🎯 Safety & Evidence

### Bounded Operations
- **Micro-edits**: ≤25 LOC, ≤2 files, sandbox execution
- **Safe branching**: Auto-stash, throwaway branches via git worktree
- **Quality gates**: Changed-files-only analysis for efficiency

### Evidence Package (Every Change)
- **qa.json**: Test, typecheck, lint, coverage results
- **semgrep.sarif**: Security findings (GitHub Security integration)  
- **connascence.json**: Structural quality metrics
- **diff_coverage.json**: Coverage analysis on changed lines
- **SPC metrics**: Statistical process control data

### Governance Framework
- **Quality Policy** (`QUALITY.md`): Zero-defect delivery standards
- **CTQ Requirements** (`docs/CTQ.md`): Critical-to-quality metrics  
- **Testing Doctrine** (`tests/README.md`): Black-box testing only
- **SIPOC Process** (`docs/SIPOC.md`): Lean Six Sigma analysis

> Tip: If you prefer starting from the official Claude template bundle, grab the latest **`spec-kit-template-claude-*.zip`** from the releases page and layer this repo's Flow/commands on top.

---

**Ready to build with specification-driven development!** 🚀