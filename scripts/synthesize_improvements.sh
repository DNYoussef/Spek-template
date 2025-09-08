#!/bin/bash

# Synthesize improvements from multiple agent analyses
# Usage: synthesize_improvements.sh <iteration_number>

set -euo pipefail

ITERATION=${1:-1}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTIFACTS_DIR=".claude/.artifacts"

echo "🔄 Synthesizing improvements from iteration $ITERATION analysis..."

# Load individual agent analyses
CLAUDE_FILE="$ARTIFACTS_DIR/claude_premortem.json"
GEMINI_FILE="$ARTIFACTS_DIR/gemini_analysis.json"
CODEX_FILE="$ARTIFACTS_DIR/codex_analysis.json"

if [[ ! -f "$CLAUDE_FILE" || ! -f "$GEMINI_FILE" || ! -f "$CODEX_FILE" ]]; then
    echo "❌ Missing agent analysis files - cannot synthesize improvements"
    echo "   Required: claude_premortem.json, gemini_analysis.json, codex_analysis.json"
    exit 1
fi

echo "📋 Loading agent analyses..."
CLAUDE_ANALYSIS=$(cat "$CLAUDE_FILE")
GEMINI_ANALYSIS=$(cat "$GEMINI_FILE")
CODEX_ANALYSIS=$(cat "$CODEX_FILE")

echo "🧠 Extracting improvement categories..."

# Extract spec improvements from all agents
CLAUDE_SPEC_IMPROVEMENTS=$(echo "$CLAUDE_ANALYSIS" | jq -r '.spec_improvements[]? // empty')
GEMINI_SPEC_IMPROVEMENTS=$(echo "$GEMINI_ANALYSIS" | jq -r '.spec_improvements[]? // empty')
CODEX_SPEC_IMPROVEMENTS=$(echo "$CODEX_ANALYSIS" | jq -r '.spec_improvements[]? // empty')

# Extract plan refinements from all agents  
CLAUDE_PLAN_REFINEMENTS=$(echo "$CLAUDE_ANALYSIS" | jq -r '.plan_refinements[]? // empty')
GEMINI_PLAN_REFINEMENTS=$(echo "$GEMINI_ANALYSIS" | jq -r '.plan_refinements[]? // empty')
CODEX_PLAN_REFINEMENTS=$(echo "$CODEX_ANALYSIS" | jq -r '.plan_refinements[]? // empty')

# Extract newly identified risks
CLAUDE_NEW_RISKS=$(echo "$CLAUDE_ANALYSIS" | jq -r '.newly_identified_risks[]? // empty')
GEMINI_NEW_RISKS=$(echo "$GEMINI_ANALYSIS" | jq -r '.newly_identified_risks[]? // empty')
CODEX_NEW_RISKS=$(echo "$CODEX_ANALYSIS" | jq -r '.technical_debt_risks[]? // empty')

# Extract quality checkpoints
CLAUDE_CHECKPOINTS=$(echo "$CLAUDE_ANALYSIS" | jq -r '.quality_checkpoints[]? // empty')
GEMINI_CHECKPOINTS=$(echo "$GEMINI_ANALYSIS" | jq -r '.quality_checkpoints[]? // empty') 
CODEX_CHECKPOINTS=$(echo "$CODEX_ANALYSIS" | jq -r '.quality_checkpoints[]? // empty')

echo "🔍 Consolidating and deduplicating improvements..."

# Combine all improvements into temporary files for processing
{
    echo "$CLAUDE_SPEC_IMPROVEMENTS"
    echo "$GEMINI_SPEC_IMPROVEMENTS"
    echo "$CODEX_SPEC_IMPROVEMENTS"
} | grep -v '^$' | sort | uniq > /tmp/spec_improvements.txt

{
    echo "$CLAUDE_PLAN_REFINEMENTS"
    echo "$GEMINI_PLAN_REFINEMENTS"
    echo "$CODEX_PLAN_REFINEMENTS"
} | grep -v '^$' | sort | uniq > /tmp/plan_refinements.txt

{
    echo "$CLAUDE_NEW_RISKS"
    echo "$GEMINI_NEW_RISKS"
    echo "$CODEX_NEW_RISKS"
} | grep -v '^$' | sort | uniq > /tmp/new_risks.txt

{
    echo "$CLAUDE_CHECKPOINTS"
    echo "$GEMINI_CHECKPOINTS"
    echo "$CODEX_CHECKPOINTS"
} | grep -v '^$' | sort | uniq > /tmp/quality_checkpoints.txt

# Build JSON arrays from deduplicated improvements
SPEC_IMPROVEMENTS_ARRAY="[]"
while IFS= read -r improvement; do
    if [[ -n "$improvement" ]]; then
        SPEC_IMPROVEMENTS_ARRAY=$(echo "$SPEC_IMPROVEMENTS_ARRAY" | jq --arg imp "$improvement" '. += [$imp]')
    fi
done < /tmp/spec_improvements.txt

PLAN_REFINEMENTS_ARRAY="[]"
while IFS= read -r refinement; do
    if [[ -n "$refinement" ]]; then
        PLAN_REFINEMENTS_ARRAY=$(echo "$PLAN_REFINEMENTS_ARRAY" | jq --arg ref "$refinement" '. += [$ref]')
    fi
done < /tmp/plan_refinements.txt

NEW_RISKS_ARRAY="[]"
while IFS= read -r risk; do
    if [[ -n "$risk" ]]; then
        NEW_RISKS_ARRAY=$(echo "$NEW_RISKS_ARRAY" | jq --arg risk "$risk" '. += [$risk]')
    fi
done < /tmp/new_risks.txt

QUALITY_CHECKPOINTS_ARRAY="[]"
while IFS= read -r checkpoint; do
    if [[ -n "$checkpoint" ]]; then
        QUALITY_CHECKPOINTS_ARRAY=$(echo "$QUALITY_CHECKPOINTS_ARRAY" | jq --arg cp "$checkpoint" '. += [$cp]')
    fi
done < /tmp/quality_checkpoints.txt

# Clean up temporary files
rm -f /tmp/spec_improvements.txt /tmp/plan_refinements.txt /tmp/new_risks.txt /tmp/quality_checkpoints.txt

echo "📊 Improvement synthesis summary:"
echo "   - Spec improvements: $(echo "$SPEC_IMPROVEMENTS_ARRAY" | jq length)"
echo "   - Plan refinements: $(echo "$PLAN_REFINEMENTS_ARRAY" | jq length)"
echo "   - New risks: $(echo "$NEW_RISKS_ARRAY" | jq length)"
echo "   - Quality checkpoints: $(echo "$QUALITY_CHECKPOINTS_ARRAY" | jq length)"

# Generate synthesized improvements JSON
IMPROVEMENTS_JSON=$(jq -n \
    --argjson spec "$SPEC_IMPROVEMENTS_ARRAY" \
    --argjson plan "$PLAN_REFINEMENTS_ARRAY" \
    --argjson risks "$NEW_RISKS_ARRAY" \
    --argjson checkpoints "$QUALITY_CHECKPOINTS_ARRAY" \
    --arg iteration "$ITERATION" \
    '{
        synthesis_metadata: {
            iteration: ($iteration | tonumber),
            timestamp: (now | todate),
            source_agents: ["claude-code", "fresh-eyes-gemini", "fresh-eyes-codex"],
            synthesis_method: "deduplicated_union",
            improvement_categories: 4
        },
        spec_improvements: $spec,
        plan_refinements: $plan, 
        newly_identified_risks: $risks,
        quality_checkpoints: $checkpoints,
        agent_contributions: {
            claude_code: {
                spec_improvements: (($spec | length) / 3 | floor),
                focus_areas: ["system_integration", "quality_assurance", "architectural_consistency"]
            },
            fresh_eyes_gemini: {
                spec_improvements: (($spec | length) / 3 | floor),
                focus_areas: ["large_context_analysis", "cross_cutting_concerns", "scalability_risks"]
            },
            fresh_eyes_codex: {
                spec_improvements: (($spec | length) / 3 | floor), 
                focus_areas: ["implementation_complexity", "technical_debt", "performance_bottlenecks"]
            }
        },
        application_guidance: {
            priority_order: [
                "Apply spec_improvements to SPEC.md sections",
                "Add plan_refinements as new tasks in plan.json",
                "Register newly_identified_risks in risk management",
                "Incorporate quality_checkpoints in verification plans"
            ],
            backup_policy: "Automatic backup with timestamp suffix before applying changes",
            validation_required: ["JSON structure validation", "git diff review before commit"]
        }
    }')

# Save synthesized improvements
IMPROVEMENTS_FILE="$ARTIFACTS_DIR/improvements.json"
echo "$IMPROVEMENTS_JSON" > "$IMPROVEMENTS_FILE"

echo ""
echo "✅ Improvement synthesis complete!"
echo "📁 Output file: $IMPROVEMENTS_FILE"
echo "🔧 Ready for application using apply_improvements.sh"

# Display summary of what will be applied
echo ""
echo "🎯 Preview of improvements to be applied:"
echo ""
echo "📝 SPEC.md improvements:"
echo "$SPEC_IMPROVEMENTS_ARRAY" | jq -r '.[] | "  + " + .'

echo ""
echo "📋 plan.json refinements:"
echo "$PLAN_REFINEMENTS_ARRAY" | jq -r '.[] | "  + " + .'

echo ""
echo "⚠️ New risks identified:"
echo "$NEW_RISKS_ARRAY" | jq -r '.[] | "  ⚠️ " + .'

echo ""
echo "✅ Quality checkpoints:"
echo "$QUALITY_CHECKPOINTS_ARRAY" | jq -r '.[] | "  ✓ " + .'

exit 0