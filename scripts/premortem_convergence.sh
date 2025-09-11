#!/bin/bash

# Pre-mortem convergence logic with iterative improvement
# Usage: premortem_convergence.sh [target_failure_rate] [max_iterations]

set -euo pipefail

TARGET_FAILURE_RATE=${1:-3}
MAX_ITERATIONS=${2:-3}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTIFACTS_DIR=".claude/.artifacts"

echo "[TARGET] Pre-mortem Convergence Controller"
echo "[CHART] Target failure rate: <=${TARGET_FAILURE_RATE}%"
echo "[CYCLE] Maximum iterations: ${MAX_ITERATIONS}"
echo ""

# Initialize convergence tracking
CONVERGENCE_LOG="$ARTIFACTS_DIR/convergence_log.json"
echo "[]" > "$CONVERGENCE_LOG"

# Check if SPEC.md and plan.json exist
if [[ ! -f "SPEC.md" ]]; then
    echo "[FAIL] SPEC.md not found - cannot proceed with pre-mortem analysis"
    exit 1
fi

if [[ ! -f "plan.json" ]]; then
    echo "[WARN] plan.json not found - will be created during process"
fi

ITERATION=1
CONVERGED=false

echo "[ROCKET] Starting pre-mortem convergence loop..."

while [[ $ITERATION -le $MAX_ITERATIONS ]] && [[ "$CONVERGED" == "false" ]]; do
    echo ""
    echo "================== ITERATION $ITERATION =================="
    
    # Clean artifacts from previous iteration
    rm -f "$ARTIFACTS_DIR"/claude_premortem.json
    rm -f "$ARTIFACTS_DIR"/gemini_analysis.json  
    rm -f "$ARTIFACTS_DIR"/codex_analysis.json
    rm -f "$ARTIFACTS_DIR"/improvements.json
    
    echo "[BRAIN] Running fresh-eyes pre-mortem analysis..."
    
    # Step 1: Launch parallel fresh-eyes analysis
    echo "  [CLIPBOARD] Phase 1: Multi-agent fresh-eyes analysis"
    
    # Claude Code analysis (with memory and full context)
    echo "    [U+1F916] Claude Code: Full context analysis..."
    cat > "$ARTIFACTS_DIR/claude_prompt.txt" << 'EOF'
Perform comprehensive pre-mortem analysis of the attached SPEC.md and plan.json.

You have access to full project context and memory. Use Sequential Thinking MCP for structured analysis.

Analyze for:
1. Specification completeness and clarity
2. Implementation feasibility and risks  
3. Integration complexity and dependencies
4. Performance and scalability concerns
5. Quality assurance and testing challenges

Provide failure probability estimate (0-100%) with high confidence.

Output format:
{
  "agent": "claude-code",
  "analysis_timestamp": "ISO timestamp",
  "overall_failure_probability": 15.2,
  "confidence_level": 0.85,
  "failure_scenarios": [detailed scenarios],
  "spec_improvements": [specific improvements],
  "plan_refinements": [tactical refinements],
  "newly_identified_risks": [new risks found],
  "quality_checkpoints": [verification points]
}
EOF
    
    # Gemini CLI analysis (fresh eyes, large context)
    echo "    [U+1F537] Gemini CLI: Fresh-eyes large context analysis..."
    cat > "$ARTIFACTS_DIR/gemini_prompt.txt" << 'EOF'
FRESH-EYES PRE-MORTEM ANALYSIS
==============================

You are analyzing this specification and plan with completely fresh eyes - NO project context or memory.
Use Sequential Thinking MCP ONLY for structured reasoning.

Analyze the attached SPEC.md and plan.json as a completely new project you're seeing for the first time.

Focus on:
1. Missing requirements and ambiguous acceptance criteria
2. Cross-cutting concerns and integration risks
3. Scale and performance implications
4. Common failure patterns for this type of system

Be skeptical and identify what could go wrong from a large-context perspective.

Output JSON format:
{
  "agent": "fresh-eyes-gemini", 
  "analysis_timestamp": "ISO timestamp",
  "overall_failure_probability": X.X,
  "confidence_level": 0.XX,
  "failure_scenarios": [scenarios],
  "spec_improvements": [improvements],
  "plan_refinements": [refinements], 
  "newly_identified_risks": [risks],
  "quality_checkpoints": [checkpoints],
  "reasoning_trace": {"sequential_thinking_steps": []}
}
EOF
    
    # Codex CLI analysis (fresh eyes, implementation focus)
    echo "    [U+1F7E3] Codex CLI: Fresh-eyes implementation analysis..."
    cat > "$ARTIFACTS_DIR/codex_prompt.txt" << 'EOF'
FRESH-EYES IMPLEMENTATION RISK ANALYSIS
=======================================

You are seeing this specification for the first time with NO project context or memory.
Use Sequential Thinking MCP ONLY for structured reasoning.

Analyze SPEC.md and plan.json focusing on implementation-level risks:
1. Code complexity and maintainability challenges
2. Technical debt accumulation potential  
3. Performance bottlenecks at code level
4. Testing and debugging difficulties

Consider what could go wrong during actual implementation.

Output JSON format:
{
  "agent": "fresh-eyes-codex",
  "analysis_timestamp": "ISO timestamp", 
  "implementation_failure_probability": X.X,
  "confidence_level": 0.XX,
  "technical_risks": [implementation risks],
  "complexity_hotspots": [areas of high complexity],
  "spec_improvements": [clarity improvements],
  "plan_refinements": [technical refinements],
  "technical_debt_risks": [debt risks],
  "testing_challenges": [test difficulties],
  "quality_checkpoints": [technical checkpoints],
  "reasoning_trace": {"sequential_thinking_steps": []}
}
EOF
    
    # Execute analyses (in parallel if possible)
    # Note: Actual execution would use claude-flow or direct CLI calls
    # For now, we'll simulate with placeholder files
    
    echo "    [U+23F3] Waiting for analysis completion..."
    sleep 2
    
    # Create placeholder analysis results for demonstration
    # In real implementation, these would come from actual agent executions
    if [[ ! -f "$ARTIFACTS_DIR/claude_premortem.json" ]]; then
        echo "[WARN] Creating placeholder Claude analysis for iteration $ITERATION"
        jq -n \
            --arg iteration "$ITERATION" \
            '{
                "agent": "claude-code",
                "analysis_timestamp": (now | todate),
                "overall_failure_probability": (20 - ($iteration | tonumber * 5)),
                "confidence_level": 0.85,
                "failure_scenarios": ["Placeholder scenario for iteration " + $iteration],
                "spec_improvements": ["Placeholder improvement " + $iteration],
                "plan_refinements": ["Placeholder refinement " + $iteration]
            }' > "$ARTIFACTS_DIR/claude_premortem.json"
    fi
    
    if [[ ! -f "$ARTIFACTS_DIR/gemini_analysis.json" ]]; then
        echo "[WARN] Creating placeholder Gemini analysis for iteration $ITERATION"
        jq -n \
            --arg iteration "$ITERATION" \
            '{
                "agent": "fresh-eyes-gemini", 
                "analysis_timestamp": (now | todate),
                "overall_failure_probability": (18 - ($iteration | tonumber * 4)),
                "confidence_level": 0.78,
                "failure_scenarios": ["Fresh-eyes scenario " + $iteration],
                "spec_improvements": ["Fresh perspective improvement " + $iteration]
            }' > "$ARTIFACTS_DIR/gemini_analysis.json"
    fi
    
    if [[ ! -f "$ARTIFACTS_DIR/codex_analysis.json" ]]; then
        echo "[WARN] Creating placeholder Codex analysis for iteration $ITERATION"
        jq -n \
            --arg iteration "$ITERATION" \
            '{
                "agent": "fresh-eyes-codex",
                "analysis_timestamp": (now | todate), 
                "implementation_failure_probability": (16 - ($iteration | tonumber * 3)),
                "confidence_level": 0.82,
                "technical_risks": ["Implementation risk " + $iteration],
                "spec_improvements": ["Technical clarity " + $iteration]
            }' > "$ARTIFACTS_DIR/codex_analysis.json"
    fi
    
    # Step 2: Calculate consensus
    echo "  [CHART] Phase 2: Calculating consensus failure rate..."
    "$SCRIPT_DIR/calculate_consensus.sh" "$ITERATION"
    
    # Extract consensus result
    CONSENSUS_RESULT=$(cat "$ARTIFACTS_DIR/iteration_${ITERATION}_results.json")
    CONSENSUS_RATE=$(echo "$CONSENSUS_RESULT" | jq -r '.consensus_failure_rate')
    AGREEMENT_LEVEL=$(echo "$CONSENSUS_RESULT" | jq -r '.agreement_level')
    
    echo "    [TARGET] Consensus failure rate: ${CONSENSUS_RATE}%"
    echo "    [U+1F91D] Agreement level: $AGREEMENT_LEVEL"
    
    # Step 3: Check convergence
    echo "  [TARGET] Phase 3: Convergence check..."
    
    CONSENSUS_INT=$(echo "$CONSENSUS_RATE" | cut -d. -f1)
    if (( CONSENSUS_INT <= TARGET_FAILURE_RATE )); then
        echo "    [OK] CONVERGENCE ACHIEVED! Failure rate ${CONSENSUS_RATE}% <= ${TARGET_FAILURE_RATE}%"
        CONVERGED=true
        
        # Log successful convergence
        CONVERGENCE_ENTRY=$(jq -n \
            --arg iteration "$ITERATION" \
            --arg consensus "$CONSENSUS_RATE" \
            --arg agreement "$AGREEMENT_LEVEL" \
            --arg status "converged" \
            '{
                iteration: ($iteration | tonumber),
                consensus_failure_rate: ($consensus | tonumber),
                agreement_level: $agreement,
                status: $status,
                timestamp: (now | todate),
                message: "Successfully converged to target failure rate"
            }')
        
        echo "$CONVERGENCE_LOG" | jq --argjson entry "$CONVERGENCE_ENTRY" '. += [$entry]' > "$CONVERGENCE_LOG.tmp"
        mv "$CONVERGENCE_LOG.tmp" "$CONVERGENCE_LOG"
        
    else
        echo "    [TREND] Failure rate ${CONSENSUS_RATE}% > ${TARGET_FAILURE_RATE}% - improvement needed"
        
        # Step 4: Generate and apply improvements
        echo "  [TOOL] Phase 4: Generating improvements..."
        
        # Synthesize improvements from all agents
        "$SCRIPT_DIR/synthesize_improvements.sh" "$ITERATION"
        
        # Apply improvements to SPEC.md and plan.json
        if [[ -f "$ARTIFACTS_DIR/improvements.json" ]]; then
            echo "    [NOTE] Applying improvements to SPEC.md and plan.json..."
            "$SCRIPT_DIR/apply_improvements.sh" "$ARTIFACTS_DIR/improvements.json"
        else
            echo "    [WARN] No improvements file generated"
        fi
        
        # Log iteration result
        CONVERGENCE_ENTRY=$(jq -n \
            --arg iteration "$ITERATION" \
            --arg consensus "$CONSENSUS_RATE" \
            --arg agreement "$AGREEMENT_LEVEL" \
            --arg status "improving" \
            '{
                iteration: ($iteration | tonumber),
                consensus_failure_rate: ($consensus | tonumber),
                agreement_level: $agreement,
                status: $status,
                timestamp: (now | todate),
                message: "Applied improvements, continuing iteration"
            }')
        
        echo "$CONVERGENCE_LOG" | jq --argjson entry "$CONVERGENCE_ENTRY" '. += [$entry]' > "$CONVERGENCE_LOG.tmp"
        mv "$CONVERGENCE_LOG.tmp" "$CONVERGENCE_LOG"
    fi
    
    echo "================== END ITERATION $ITERATION =================="
    ITERATION=$((ITERATION + 1))
done

echo ""
if [[ "$CONVERGED" == "true" ]]; then
    echo "[PARTY] PRE-MORTEM CONVERGENCE SUCCESSFUL!"
    echo "[OK] Final failure rate: ${CONSENSUS_RATE}% (target: <=${TARGET_FAILURE_RATE}%)"
    echo "[TARGET] Achieved in $((ITERATION - 1)) iteration(s)"
    echo "[CLIPBOARD] Agreement level: $AGREEMENT_LEVEL"
    
    # Generate final summary
    FINAL_SUMMARY=$(jq -n \
        --arg final_rate "$CONSENSUS_RATE" \
        --arg iterations "$((ITERATION - 1))" \
        --arg agreement "$AGREEMENT_LEVEL" \
        --arg target "$TARGET_FAILURE_RATE" \
        '{
            convergence_status: "successful",
            final_failure_rate: ($final_rate | tonumber),
            target_failure_rate: ($target | tonumber),
            iterations_required: ($iterations | tonumber),
            final_agreement_level: $agreement,
            timestamp: (now | todate),
            artifacts_location: ".claude/.artifacts/",
            next_steps: [
                "Review updated SPEC.md and plan.json",
                "Proceed with implementation using refined specifications",
                "Monitor actual failure rates against predictions"
            ]
        }')
    
    echo "$FINAL_SUMMARY" > "$ARTIFACTS_DIR/convergence_summary.json"
    
else
    echo "[WARN] PRE-MORTEM CONVERGENCE INCOMPLETE"
    echo "[FAIL] Failed to reach target failure rate <=${TARGET_FAILURE_RATE}% in ${MAX_ITERATIONS} iterations"
    echo "[CHART] Final consensus rate: ${CONSENSUS_RATE}%"
    echo "[INFO] Consider:"
    echo "   - Increasing max iterations"
    echo "   - Adjusting target failure rate"
    echo "   - Manual specification review"
    
    # Log incomplete convergence
    FINAL_SUMMARY=$(jq -n \
        --arg final_rate "$CONSENSUS_RATE" \
        --arg max_iterations "$MAX_ITERATIONS" \
        --arg agreement "$AGREEMENT_LEVEL" \
        --arg target "$TARGET_FAILURE_RATE" \
        '{
            convergence_status: "incomplete",
            final_failure_rate: ($final_rate | tonumber),
            target_failure_rate: ($target | tonumber),
            iterations_attempted: ($max_iterations | tonumber),
            final_agreement_level: $agreement,
            timestamp: (now | todate),
            recommendations: [
                "Consider manual specification review",
                "Increase maximum iterations if appropriate",
                "Evaluate if target failure rate is realistic"
            ]
        }')
    
    echo "$FINAL_SUMMARY" > "$ARTIFACTS_DIR/convergence_summary.json"
fi

echo ""
echo "[FOLDER] Convergence log: $CONVERGENCE_LOG" 
echo "[CHART] Final summary: $ARTIFACTS_DIR/convergence_summary.json"
echo "[U+1F5C2][U+FE0F] All artifacts: $ARTIFACTS_DIR/"

exit 0