#!/bin/bash

# Apply pre-mortem improvements to SPEC.md and plan.json
# Usage: apply_improvements.sh <improvements.json>

set -euo pipefail

IMPROVEMENTS_FILE=${1:-".claude/.artifacts/improvements.json"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$IMPROVEMENTS_FILE" ]]; then
    echo "[FAIL] Improvements file not found: $IMPROVEMENTS_FILE"
    exit 1
fi

echo "[TOOL] Applying pre-mortem improvements..."

# Backup existing files
if [[ -f "SPEC.md" ]]; then
    cp "SPEC.md" "SPEC.md.backup.$(date +%s)"
    echo "[CLIPBOARD] Backed up SPEC.md"
fi

if [[ -f "plan.json" ]]; then
    cp "plan.json" "plan.json.backup.$(date +%s)"
    echo "[CLIPBOARD] Backed up plan.json"
fi

# Load improvements
IMPROVEMENTS=$(cat "$IMPROVEMENTS_FILE")

echo "[NOTE] Processing improvements..."

# Apply SPEC.md improvements
SPEC_IMPROVEMENTS=$(echo "$IMPROVEMENTS" | jq -r '.spec_improvements[]? // empty')
if [[ -n "$SPEC_IMPROVEMENTS" ]]; then
    echo ""
    echo "[SEARCH] SPEC.md improvements:"
    
    # Create updated SPEC.md content
    if [[ -f "SPEC.md" ]]; then
        CURRENT_SPEC=$(cat "SPEC.md")
    else
        echo "[WARN] SPEC.md not found, creating from template"
        CURRENT_SPEC="# Project Specification

## Problem Statement
<!-- Enhanced based on pre-mortem analysis -->

## Goals
<!-- Updated with risk mitigation considerations -->

## Acceptance Criteria
<!-- Refined with failure prevention measures -->"
    fi
    
    # Process each improvement
    while IFS= read -r improvement; do
        if [[ -n "$improvement" ]]; then
            echo "  + $improvement"
            
            # Add improvement to appropriate section based on content
            if [[ "$improvement" =~ [Tt]est|[Qq]uality|[Vv]alidation ]]; then
                # Testing/Quality related improvements go to Acceptance Criteria
                CURRENT_SPEC=$(echo "$CURRENT_SPEC" | sed '/## Acceptance Criteria/a\
- [ ] '"$improvement"'')
            elif [[ "$improvement" =~ [Rr]isk|[Mm]itigation|[Ff]ailure ]]; then
                # Risk related improvements go to new Risk Mitigation section
                if ! echo "$CURRENT_SPEC" | grep -q "## Risk Mitigation"; then
                    CURRENT_SPEC="$CURRENT_SPEC

## Risk Mitigation
<!-- Added by pre-mortem analysis -->"
                fi
                CURRENT_SPEC=$(echo "$CURRENT_SPEC" | sed '/## Risk Mitigation/a\
- '"$improvement"'')
            else
                # General improvements go to Goals
                CURRENT_SPEC=$(echo "$CURRENT_SPEC" | sed '/## Goals/a\
- [ ] '"$improvement"'')
            fi
        fi
    done <<< "$SPEC_IMPROVEMENTS"
    
    echo "$CURRENT_SPEC" > "SPEC.md"
fi

# Apply plan.json improvements
PLAN_IMPROVEMENTS=$(echo "$IMPROVEMENTS" | jq -r '.plan_refinements[]? // empty')
if [[ -n "$PLAN_IMPROVEMENTS" ]]; then
    echo ""
    echo "[CLIPBOARD] plan.json improvements:"
    
    # Load existing plan or create template
    if [[ -f "plan.json" ]]; then
        CURRENT_PLAN=$(cat "plan.json")
    else
        echo "[WARN] plan.json not found, creating from template"
        CURRENT_PLAN='{
            "goals": [],
            "tasks": [],
            "risks": [],
            "risk_mitigations": []
        }'
    fi
    
    # Add risk mitigation section if not exists
    if ! echo "$CURRENT_PLAN" | jq -e '.risk_mitigations' >/dev/null 2>&1; then
        CURRENT_PLAN=$(echo "$CURRENT_PLAN" | jq '. + {"risk_mitigations": []}')
    fi
    
    # Process each plan improvement
    while IFS= read -r improvement; do
        if [[ -n "$improvement" ]]; then
            echo "  + $improvement"
            
            # Add as risk mitigation task
            NEW_TASK=$(jq -n \
                --arg imp "$improvement" \
                '{
                    "id": ("risk-mit-" + (now | tostring)),
                    "title": $imp,
                    "type": "small",
                    "category": "risk_mitigation",
                    "priority": "high",
                    "added_by": "premortem_analysis"
                }')
            
            CURRENT_PLAN=$(echo "$CURRENT_PLAN" | jq --argjson task "$NEW_TASK" '.risk_mitigations += [$task]')
        fi
    done <<< "$PLAN_IMPROVEMENTS"
    
    echo "$CURRENT_PLAN" | jq '.' > "plan.json"
fi

# Add new risks to risk register
NEW_RISKS=$(echo "$IMPROVEMENTS" | jq -r '.newly_identified_risks[]? // empty')
if [[ -n "$NEW_RISKS" ]]; then
    echo ""
    echo "[WARN] Newly identified risks:"
    
    # Load existing plan to add risks
    CURRENT_PLAN=$(cat "plan.json" 2>/dev/null || echo '{"risks": []}')
    
    # Add risks section if not exists
    if ! echo "$CURRENT_PLAN" | jq -e '.risks' >/dev/null 2>&1; then
        CURRENT_PLAN=$(echo "$CURRENT_PLAN" | jq '. + {"risks": []}')
    fi
    
    while IFS= read -r risk; do
        if [[ -n "$risk" ]]; then
            echo "  [WARN] $risk"
            
            NEW_RISK=$(jq -n \
                --arg risk "$risk" \
                '{
                    "risk": $risk,
                    "impact": "medium",
                    "probability": "medium",
                    "identified_by": "premortem_analysis",
                    "mitigation": "To be defined",
                    "status": "identified"
                }')
            
            CURRENT_PLAN=$(echo "$CURRENT_PLAN" | jq --argjson risk "$NEW_RISK" '.risks += [$risk]')
        fi
    done <<< "$NEW_RISKS"
    
    echo "$CURRENT_PLAN" | jq '.' > "plan.json"
fi

# Add quality checkpoints
QUALITY_CHECKPOINTS=$(echo "$IMPROVEMENTS" | jq -r '.quality_checkpoints[]? // empty')
if [[ -n "$QUALITY_CHECKPOINTS" ]]; then
    echo ""
    echo "[OK] Quality checkpoints:"
    
    CURRENT_PLAN=$(cat "plan.json" 2>/dev/null || echo '{"quality_gates": []}')
    
    # Add quality gates section if not exists
    if ! echo "$CURRENT_PLAN" | jq -e '.quality_gates' >/dev/null 2>&1; then
        CURRENT_PLAN=$(echo "$CURRENT_PLAN" | jq '. + {"quality_gates": []}')
    fi
    
    while IFS= read -r checkpoint; do
        if [[ -n "$checkpoint" ]]; then
            echo "  [U+2713] $checkpoint"
            
            NEW_CHECKPOINT=$(jq -n \
                --arg cp "$checkpoint" \
                '{
                    "checkpoint": $cp,
                    "type": "quality_gate",
                    "required": true,
                    "added_by": "premortem_analysis"
                }')
            
            CURRENT_PLAN=$(echo "$CURRENT_PLAN" | jq --argjson cp "$NEW_CHECKPOINT" '.quality_gates += [$cp]')
        fi
    done <<< "$QUALITY_CHECKPOINTS"
    
    echo "$CURRENT_PLAN" | jq '.' > "plan.json"
fi

echo ""
echo "[OK] Improvements applied successfully!"
echo "[FOLDER] Backups created with timestamp suffix"
echo "[CLIPBOARD] Updated files:"
echo "   - SPEC.md (enhanced with risk mitigations)"
echo "   - plan.json (updated with preventive measures)"

# Validate JSON structure
if [[ -f "plan.json" ]]; then
    if jq empty plan.json 2>/dev/null; then
        echo "[OK] plan.json structure validated"
    else
        echo "[FAIL] plan.json validation failed, restoring backup"
        if [[ -f "plan.json.backup."* ]]; then
            cp plan.json.backup.* plan.json
        fi
        exit 1
    fi
fi

exit 0