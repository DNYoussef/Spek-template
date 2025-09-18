#!/bin/bash

# SPEK-AUGMENT v1: Agent Prompt Update Script
# Updates all Claude Flow sub-agent prompt files to house standard

set -euo pipefail

BASE_BRANCH="${BASE_BRANCH:-main}"
PM_SYSTEM="${PM_SYSTEM:-plane}"

echo "[TOOL] SPEK-AUGMENT v1: Updating Claude Flow Agent Prompts"
echo "=================================================="

# Count and list agent files
AGENT_FILES=($(find .claude/agents -name "*.md" | sort))
TOTAL_FILES=${#AGENT_FILES[@]}

echo "[CHART] Found ${TOTAL_FILES} agent files to update"

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

# Enhanced MCP footer template with CF v2 Alpha integration
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

## CF v2 Alpha Hive-Mind Integration
- **Swarm coordination**: Each phase initializes with session namespace
- **Neural patterns**: Failure/success patterns feed back to CF models
- **Memory continuity**: Cross-session state preservation via hive backend
- **Risk prediction**: CF neural models influence gate profile selection
- **Auto-healing**: Degraded mode fallbacks when CF components fail

## Risk-Based Behavior
- HIGH risk labels (security, infra, core-module) -> full gates + Context7 validation
- FAST lane labels (docs, chore, test-only) -> light gates + minimal Context7
- Budget escalation -> CF task orchestrate to architecture/planner agents
- Failure patterns -> Neural training for continuous improvement
<!-- /SPEK-AUGMENT v1 -->'

# Function to extract role name from file path
get_role_name() {
    local file="$1"
    basename "$file" .md
}

# Function to update agent file with SPEK-AUGMENT v1
update_agent_file() {
    local file="$1"
    local role_name=$(get_role_name "$file")
    
    echo "[NOTE] Updating $role_name..."
    
    # Create temporary file
    local temp_file=$(mktemp)
    
    # Insert global header with role substitution
    echo "${GLOBAL_HEADER//<ROLE>/$role_name}" > "$temp_file"
    echo "" >> "$temp_file"
    
    # Add existing content (skip if already has SPEK-AUGMENT markers)
    if ! grep -q "SPEK-AUGMENT v1: header" "$file" 2>/dev/null; then
        cat "$file" >> "$temp_file" 2>/dev/null || echo "# $role_name Agent" >> "$temp_file"
    else
        # Skip existing header and content up to closing marker
        sed '/<!-- SPEK-AUGMENT v1: header -->/,/<!-- \/SPEK-AUGMENT v1 -->/d' "$file" >> "$temp_file"
    fi
    
    echo "" >> "$temp_file"
    
    # Add MCP footer
    if ! grep -q "SPEK-AUGMENT v1: mcp" "$temp_file"; then
        echo "$MCP_FOOTER" >> "$temp_file"
    fi
    
    # Replace original file
    mv "$temp_file" "$file"
}

# Update all agent files
UPDATED_COUNT=0
SKIPPED_COUNT=0

for file in "${AGENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        update_agent_file "$file"
        ((UPDATED_COUNT++))
    else
        ((SKIPPED_COUNT++))
    fi
done

echo ""
echo "[CHART] Update Summary:"
echo "   Updated: $UPDATED_COUNT files"
echo "   Skipped: $SKIPPED_COUNT files"
echo "   Total:   $TOTAL_FILES files"
echo ""
echo "[OK] All agent prompts updated to SPEK-AUGMENT v1 standard"

# Validation
echo "[SEARCH] Validating updated files..."
VALIDATION_ERRORS=0

for file in "${AGENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        role_name=$(get_role_name "$file")
        
        # Check for required markers
        if ! grep -q "SPEK-AUGMENT v1: header" "$file"; then
            echo "[FAIL] $role_name: Missing header marker"
            ((VALIDATION_ERRORS++))
        fi
        
        if ! grep -q "SPEK-AUGMENT v1: mcp" "$file"; then
            echo "[FAIL] $role_name: Missing MCP footer marker"
            ((VALIDATION_ERRORS++))
        fi
        
        # Check role substitution
        if grep -q "<ROLE>" "$file"; then
            echo "[FAIL] $role_name: Role placeholder not substituted"
            ((VALIDATION_ERRORS++))
        fi
    fi
done

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo "[OK] All validations passed"
else
    echo "[FAIL] Found $VALIDATION_ERRORS validation errors"
fi

echo ""
echo "[TARGET] Next steps:"
echo "   1. Review sample updated files"
echo "   2. Run lint script to validate JSON contracts"
echo "   3. Test agent responses for STRICT JSON output"
echo "   4. Commit changes to git"