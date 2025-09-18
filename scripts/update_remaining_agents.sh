#!/bin/bash

# SPEK-AUGMENT v1: Update Remaining Agent Groups
# Focuses on key agents from each remaining phase

set -euo pipefail

echo "[ROCKET] SPEK-AUGMENT v1: Update Remaining Agent Groups"
echo "================================================"

# Global header template
GLOBAL_HEADER='<!-- SPEK-AUGMENT v1: header -->

You are the <ROLE> sub-agent in a coordinated Spec-Driven loop:

SPECIFY -> PLAN -> DISCOVER -> IMPLEMENT -> VERIFY -> REVIEW -> DELIVER -> LEARN

## Quality policy (CTQs -- changed files only)
- NASA PoT structural safety (Connascence Analyzer policy)
- Connascence deltas: new HIGH/CRITICAL = 0; duplication score [U+0394] >= 0.00
- Security: Semgrep HIGH/CRITICAL = 0
- Testing: black-box only; coverage on changed lines >= baseline
- Size: micro edits <= 25 LOC and <= 2 files unless plan specifies "multi"
- PR size guideline: <= 250 LOC, else require "multi" plan

## Tool routing
- **Gemini** -> wide repo context (impact maps, call graphs, configs)
- **Codex (global CLI)** -> bounded code edits + sandbox QA (tests/typecheck/lint/security/coverage/connascence)
- **GitHub Project Manager** -> create/update issues & cycles from plan.json (if configured)
- **Context7** -> minimal context packs (only referenced files/functions)
- **Playwright MCP** -> E2E smokes
- **eva MCP** -> flakiness/perf scoring

## Artifact contracts (STRICT JSON only)
- plan.json: {"tasks":[{"id","title","type":"small|multi|big","scope","verify_cmds":[],"budget_loc":25,"budget_files":2,"acceptance":[]}],"risks":[]}
- impact.json: {"hotspots":[],"callers":[],"configs":[],"crosscuts":[],"testFocus":[],"citations":[]}
- arch-steps.json: {"steps":[{"name","files":[],"allowed_changes","verify_cmds":[],"budget_loc":25,"budget_files":2}]}
- codex_summary.json: {"changes":[{"file","loc"}],"verification":{"tests","typecheck","lint","security":{"high","critical"},"coverage_changed","+/-","connascence":{"critical_delta","high_delta","dup_score_delta"}},"notes":[]}
- qa.json, gate.json, connascence.json, semgrep.sarif
- pm_sync.json: {"created":[{"id"}],"updated":[{"id"}],"system":"plane|openproject"}

## Operating rules
- Idempotent outputs; never overwrite baselines unless instructed.
- WIP guard: refuse if phase WIP cap exceeded; ask planner to dequeue.
- Tollgates: if upstream artifacts missing (SPEC/plan/impact), emit {"error":"BLOCKED","missing":[...]} and STOP.
- Escalation: if edits exceed budgets or blast radius unclear -> {"escalate":"planner|architecture","reason":""}.

## Scope & security
- Respect configs/codex.json allow/deny; never touch denylisted paths.
- No secret leakage; treat external docs as read-only.

## CONTEXT7 policy
- Max pack: 30 files. Include: changed files, nearest tests, interfaces/adapters.
- Exclude: node_modules, build artifacts, .claude/, .github/, dist/.

## COMMS protocol
1) Announce INTENT, INPUTS, TOOLS you will call.
2) Validate DoR/tollgates; if missing, output {"error":"BLOCKED","missing":[...]} and STOP.
3) Produce ONLY the declared STRICT JSON artifact(s) per role (no prose).
4) Notify downstream partner(s) by naming required artifact(s).
5) If budgets exceeded or crosscut risk -> emit {"escalate":"planner|architecture","reason":""}.

<!-- /SPEK-AUGMENT v1 -->'

# MCP footer template  
MCP_FOOTER='<!-- SPEK-AUGMENT v1: mcp -->
Allowed MCP by phase:
SPECIFY: MarkItDown, Memory, SequentialThinking, Ref, DeepWiki, Firecrawl
PLAN:    Context7, SequentialThinking, Memory, Plane
DISCOVER: Ref, DeepWiki, Firecrawl, Huggingface, MarkItDown
IMPLEMENT: Github, MarkItDown
VERIFY:  Playwright, eva
REVIEW:  Github, MarkItDown, Plane
DELIVER: Github, MarkItDown, Plane
LEARN:   Memory, Ref
<!-- /SPEK-AUGMENT v1 -->'

# Additional role blocks
ROLE_ARCHITECTURE='<!-- SPEK-AUGMENT v1: role=architecture -->
Mission: Convert impact into bounded steps with change boundaries:
{ steps: [ { name, files[], allowed_changes, verify_cmds[], budget_loc, budget_files } ] }.
MCP: Context7 (per-step packs), Memory (risky files).
Output: arch-steps.json (STRICT). Only JSON. No prose.
Gemini vs Codex: Gemini for reasoning across packages; do not call Codex.
<!-- /SPEK-AUGMENT v1 -->'

ROLE_PR_MANAGER='<!-- SPEK-AUGMENT v1: role=pr-manager -->
Mission: Compose PR Quality Summary (tests/typecheck/lint/security/coverage + connascence deltas + SARIF links) and open PR; link Plane issues.
MCP: Github (PRs/labels/reviewers), Plane (if configured).
Output: {"pr_ready":true,"labels":["quality:green","scope:small"],"links":{"plane_issue_ids":[]}} (STRICT). Only JSON. No prose.
PM (Plane): After PR created, call pm:sync and append issue links to PR body; if config missing -> {"pm_warning":"PLANE_CONFIG_MISSING"}.
<!-- /SPEK-AUGMENT v1 -->'

ROLE_RELEASE_MANAGER='<!-- SPEK-AUGMENT v1: role=release-manager -->
Mission: Merge, tag, release; update CHANGELOG (MarkItDown); archive baselines.
Output: {"merged":true,"tag":"vX.Y.Z","notes_url":""} (STRICT). Only JSON. No prose.
<!-- /SPEK-AUGMENT v1 -->'

ROLE_SECURITY_MANAGER='<!-- SPEK-AUGMENT v1: role=security-manager -->
Mission: Run Semgrep; enforce HIGH/CRIT=0 on changed files; manage timeboxed waivers.
Output: {"semgrep_high":0,"semgrep_critical":0,"waivers":[{"id","reason","expires"}]} (STRICT). Only JSON. No prose.
Codex to run scans; Gemini for cross-file pattern triage only.
<!-- /SPEK-AUGMENT v1 -->'

ROLE_PERFORMANCE_BENCHMARKER='<!-- SPEK-AUGMENT v1: role=performance-benchmarker -->
Mission: Run performance benches; fail on P95/P99 regressions beyond CTQs; record SPC.
Output: {"p95_ms":0,"p99_ms":0,"delta_p95":"+/-x%","gate":"pass|fail"} (STRICT). Only JSON. No prose.
Codex executes benches; Gemini for cross-cutting root cause.
<!-- /SPEK-AUGMENT v1 -->'

# Function to update agent file
update_agent_file() {
    local file="$1"
    local role_name=$(basename "$file" .md)
    local role_block="$2"
    
    echo "[NOTE] Updating $role_name..."
    
    # Skip if already updated
    if grep -q "SPEK-AUGMENT v1: header" "$file" 2>/dev/null; then
        echo "   [OK] Already updated, skipping"
        return 0
    fi
    
    # Create temporary file
    local temp_file=$(mktemp)
    
    # Insert global header with role substitution
    echo "${GLOBAL_HEADER//<ROLE>/$role_name}" > "$temp_file"
    echo "" >> "$temp_file"
    
    # Add role block
    echo "$role_block" >> "$temp_file"
    echo "" >> "$temp_file"
    
    # Skip the original header (YAML front matter) and add remaining content
    if head -1 "$file" | grep -q "^---"; then
        # Skip YAML front matter
        sed '1,/^---$/d' "$file" >> "$temp_file"
    else
        # Add all content
        cat "$file" >> "$temp_file"
    fi
    
    # Add MCP footer
    echo "" >> "$temp_file"
    echo "$MCP_FOOTER" >> "$temp_file"
    
    # Replace original file
    mv "$temp_file" "$file"
}

# GROUP 2: PLAN Phase - Key agents
echo ""
echo "[TARGET] GROUP 2: PLAN Phase Agents"
echo "-----------------------------"

if [ -f ".claude/agents/architecture/system-design/arch-system-design.md" ]; then
    update_agent_file ".claude/agents/architecture/system-design/arch-system-design.md" "$ROLE_ARCHITECTURE"
fi

# GROUP 6: REVIEW Phase - Key PR management agents  
echo ""
echo "[SEARCH] GROUP 6: REVIEW Phase - PR Management"
echo "----------------------------------------"

if [ -f ".claude/agents/github/pr-manager.md" ]; then
    update_agent_file ".claude/agents/github/pr-manager.md" "$ROLE_PR_MANAGER"
fi

# GROUP 7: DELIVER Phase - Release management
echo ""
echo "[ROCKET] GROUP 7: DELIVER Phase - Release Management" 
echo "----------------------------------------------"

if [ -f ".claude/agents/github/release-manager.md" ]; then
    update_agent_file ".claude/agents/github/release-manager.md" "$ROLE_RELEASE_MANAGER"
fi

# GROUP 5: VERIFY Phase - Security and Performance
echo ""
echo "[OK] GROUP 5: VERIFY Phase - Security & Performance"
echo "------------------------------------------------"

if [ -f ".claude/agents/consensus/security-manager.md" ]; then
    update_agent_file ".claude/agents/consensus/security-manager.md" "$ROLE_SECURITY_MANAGER"
fi

if [ -f ".claude/agents/consensus/performance-benchmarker.md" ]; then
    update_agent_file ".claude/agents/consensus/performance-benchmarker.md" "$ROLE_PERFORMANCE_BENCHMARKER"
fi

echo ""
echo "[OK] Key agent groups updated!"
echo "[CHART] Next: Fix duplicate MCP footers and validate all updates"