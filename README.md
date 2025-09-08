# SPEK-Driven Development Template

## 🚀 Overview

This template integrates **GitHub's Spec Kit** with **Claude Flow**, **Gemini CLI**, **Codex CLI**, and **MCP servers** to create a comprehensive specification-driven development environment.

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

## 🛠️ Tool Integration

**How we map to Spec Kit here**
- **Specify & Plan** → `SPEC.md` + `.claude/commands/spec:plan.md` (produces `plan.json`)  
- **Discover (wide context)** → `/.claude/commands/gemini:impact.md` (Gemini CLI `@dir`)  
- **Implement (micro edits)** → `/.claude/commands/codex:micro*.md` (Codex CLI sandbox)  
- **Verify** → `/.claude/commands/qa:run.md` (tests/typecheck/lint/coverage via Codex)  
- **Review/Deliver** → `/.claude/commands/pr:open.md` + Flow workflows  
- **Learn** → notes persisted via Memory MCP

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

1. **Edit `SPEC.md`** - Define your requirements
2. **Run planning**: `/spec:plan` to generate `plan.json`
3. **Execute workflows**:
   ```bash
   flow run flow/workflows/spec-to-pr.yaml    # Full spec → PR
   flow run flow/workflows/after-edit.yaml    # QA → fix → loop
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

- **`spec-to-pr.yaml`**: Executes complete SPEC → PR cycle
- **`after-edit.yaml`**: Post-edit QA with intelligent triage and routing

## 🎯 Bounded Operations

- **Micro-edits**: ≤25 lines of code, ≤2 files
- **Safe branching**: Auto-stash and branch creation
- **Evidence tracking**: All QA results stored as JSON artifacts

> Tip: If you prefer starting from the official Claude template bundle, grab the latest **`spec-kit-template-claude-*.zip`** from the releases page and layer this repo's Flow/commands on top.

---

**Ready to build with specification-driven development!** 🚀