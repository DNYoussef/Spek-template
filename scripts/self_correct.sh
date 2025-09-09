#!/usr/bin/env bash
# Self-correct until quality gates pass (bounded attempts)
# Integrates with CF v2 Alpha hive coordination and SPEK-AUGMENT CTQs

set -euo pipefail

BASE_BRANCH="${BASE_BRANCH:-main}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-4}"   # total repair cycles
SHOW_LOGS="${SHOW_LOGS:-1}"
HIVE_NAMESPACE="${HIVE_NAMESPACE:-spek/self-correct/$(date +%Y%m%d)}"
SESSION_ID="${SESSION_ID:-swarm-self-correct-$(date +%s)}"

mkdir -p .claude/.artifacts
attempt=1

note() { echo "[$(date +%H:%M:%S)] $*"; }

# Initialize CF hive coordination if available
init_cf_coordination() {
    if command -v npx >/dev/null 2>&1 && npx claude-flow@alpha --version >/dev/null 2>&1; then
        note "🧠 Initializing CF hive coordination"
        npx claude-flow@alpha swarm init --topology hierarchical --session "$SESSION_ID" --namespace "$HIVE_NAMESPACE" --max-attempts "$MAX_ATTEMPTS" 2>/dev/null || true
        npx claude-flow@alpha memory usage --namespace "$HIVE_NAMESPACE" --restore-session "$SESSION_ID" 2>/dev/null || true
    fi
}

# Log to CF neural training if available
log_attempt_to_cf() {
    local attempt_type="$1"
    local success="$2"
    local context="$3"
    
    if command -v npx >/dev/null 2>&1 && npx claude-flow@alpha --version >/dev/null 2>&1; then
        if [[ "$success" == "true" ]]; then
            npx claude-flow@alpha neural train --model success_patterns --session "$SESSION_ID" --input "$context" 2>/dev/null || true
        else
            npx claude-flow@alpha neural train --model failure_patterns --session "$SESSION_ID" --input "$context" 2>/dev/null || true
        fi
    fi
}

# Generate repair summary for CF memory
export_session_summary() {
    local final_status="$1"
    local total_attempts="$2"
    
    if command -v npx >/dev/null 2>&1 && npx claude-flow@alpha --version >/dev/null 2>&1; then
        local summary="{\"status\":\"$final_status\",\"attempts\":$total_attempts,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"session\":\"$SESSION_ID\"}"
        npx claude-flow@alpha memory store --key "repairs/$(date +%s)" --value "$summary" --namespace "$HIVE_NAMESPACE" 2>/dev/null || true
        npx claude-flow@alpha hooks session-end --export-metrics true --namespace "$HIVE_NAMESPACE" 2>/dev/null || true
    fi
}

# Check operational tripwires before starting
check_tripwires() {
    if [[ -x scripts/ops_tripwires.sh ]]; then
        note "🚨 Checking operational tripwires"
        if ! scripts/ops_tripwires.sh check-limits; then
            note "⚠️  Tripwire violations detected - proceeding with caution"
            # Don't exit, but log for monitoring
        fi
    fi
}

# Main self-correction loop
main() {
    note "🔄 Starting self-correction loop (max attempts: $MAX_ATTEMPTS)"
    init_cf_coordination
    check_tripwires
    
    while (( attempt <= MAX_ATTEMPTS )); do
        note "Attempt $attempt / $MAX_ATTEMPTS: VERIFY → GATE"
        
        # Record attempt start
        echo "{\"attempt\": $attempt, \"start_time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > .claude/.artifacts/current_attempt.json
        
        # 1) VERIFY - Run all quality gates in parallel
        note "🔍 Running verification suite..."
        {
            claude /qa:run &
            claude /sec:scan &  
            claude /conn:scan &
            wait
        } || true
        
        # 2) GATE - Aggregate gate results
        note "🚪 Checking quality gates..."
        claude --output-format json -p "/qa:gate" > .claude/.artifacts/gate.json || echo '{"ok": false, "reason": "gate_command_failed"}' > .claude/.artifacts/gate.json
        
        ok=$(jq -r '.ok // false' .claude/.artifacts/gate.json 2>/dev/null || echo "false")
        
        if [[ "$ok" == "true" ]]; then
            note "✅ All quality gates green - self-correction successful!"
            log_attempt_to_cf "verify" "true" "$(cat .claude/.artifacts/gate.json)"
            export_session_summary "success" "$attempt"
            
            # Update operational metrics
            [[ -x scripts/ops_tripwires.sh ]] && scripts/ops_tripwires.sh update-metrics || true
            exit 0
        fi
        
        # 3) ANALYZE - Determine failure mode and root cause
        note "❌ Gates red → analyzing failure mode"
        
        # Get detailed failure info
        gate_content=$(cat .claude/.artifacts/gate.json 2>/dev/null || echo "{}")
        qa_content=$(cat .claude/.artifacts/qa.json 2>/dev/null || echo "{}")
        
        # Run analysis
        claude --output-format json -p "/qa:analyze '$qa_content'" > .claude/.artifacts/triage.json || echo '{"size":"small","root_causes":["unknown"],"confidence":0.5}' > .claude/.artifacts/triage.json
        
        size=$(jq -r '.size // "small"' .claude/.artifacts/triage.json)
        cause=$(jq -r '.root_causes[0] // "unknown"' .claude/.artifacts/triage.json)
        confidence=$(jq -r '.confidence // 0.5' .claude/.artifacts/triage.json)
        
        # Show logs if requested
        if [[ "$SHOW_LOGS" == "1" ]]; then
            echo "📊 Gate status:"
            jq . .claude/.artifacts/gate.json || echo "Gate results not available"
            echo "🔍 Triage results:"
            jq . .claude/.artifacts/triage.json || echo "Triage results not available"
        fi
        
        # Log failure pattern to CF
        failure_context="{\"attempt\":$attempt,\"size\":\"$size\",\"cause\":\"$cause\",\"confidence\":$confidence}"
        log_attempt_to_cf "analyze" "false" "$failure_context"
        
        # 4) FIX - Route to appropriate repair strategy
        case "$size" in
            small)
                note "🔧 Routing to Codex-optimized agent for surgical fixes"
                # Route to Codex-optimized agent for bounded surgical fixes
                if claude Task --subagent_type coder-codex --description "Surgical fix via Codex" --prompt "Fix identified issue: $cause. Use Codex CLI with sandbox verification. Constraints: ≤25 LOC, ≤2 files. Generate codex_summary.json with verification results and merge readiness."; then
                    note "✅ Codex agent fix completed - verifying results"
                    # Verify the fix was applied successfully
                    if [[ -f .claude/.artifacts/codex_summary.json ]]; then
                        fix_success=$(jq -r '.merge_readiness.ready_to_merge // false' .claude/.artifacts/codex_summary.json 2>/dev/null || echo "false")
                        if [[ "$fix_success" == "true" ]]; then
                            note "🎯 Codex fix verified and ready for merge"
                        else
                            note "⚠️  Codex fix applied but verification issues remain"
                        fi
                    fi
                else
                    note "⚠️  Codex agent fix failed - falling back to direct micro-fix"
                    claude /codex:micro-fix "$cause" || note "Direct micro-fix also failed - will retry in next cycle"
                fi
                ;;
            multi)
                note "🧭 Routing to planned multi-file fix (cause: $cause)"
                if ! claude /fix:planned "$cause"; then
                    note "⚠️  Planned fix failed - will retry in next cycle"
                fi
                ;;
            big)
                note "🗺️  Big impact detected → Gemini-optimized analysis first"
                # Route to Gemini-optimized researcher for comprehensive context analysis
                if claude Task --subagent_type researcher-gemini --description "Large context failure analysis" --prompt "Analyze large-scale failure: $cause. Use Gemini CLI with full codebase context to identify root causes, impact scope, and architectural implications. Generate impact.json with comprehensive analysis."; then
                    note "✅ Gemini analysis completed - validating results"
                    # Validate impact with quickcheck
                    if [[ -x scripts/impact_quickcheck.sh && -f .claude/.artifacts/impact.json ]]; then
                        scripts/impact_quickcheck.sh validate .claude/.artifacts/impact.json > .claude/.artifacts/impact_validation.json || true
                        if [[ "$(jq -r '.valid // false' .claude/.artifacts/impact_validation.json)" == "false" ]]; then
                            note "⚠️  Impact validation failed - using Context7 fallback"
                        fi
                    fi
                    
                    # Attempt repair with context
                    if ! claude /fix:planned "$cause"; then
                        note "⚠️  Context-aware fix failed - will retry in next cycle"
                    fi
                else
                    note "⚠️  Gemini context analysis failed - falling back to micro-fix"
                    claude /codex:micro-fix "$cause" || true
                fi
                ;;
            *)
                note "ℹ️  Unknown failure size '$size' - defaulting to Codex micro-fix"
                claude /codex:micro-fix "$cause" || true
                ;;
        esac
        
        # 5) PREPARE for next iteration
        attempt=$((attempt+1))
        
        # Check if we should escalate before final attempt
        if (( attempt > MAX_ATTEMPTS )); then
            break
        elif (( attempt == MAX_ATTEMPTS )); then
            note "⚠️  Final attempt - will escalate if this fails"
        fi
        
        # Brief pause to allow file system to settle
        sleep 1
    done
    
    # All attempts exhausted
    note "❗ Max attempts ($MAX_ATTEMPTS) reached; gates still red"
    note "📋 Final gate status:"
    jq . .claude/.artifacts/gate.json 2>/dev/null || echo "Gate results not available"
    
    # Log final failure and export session
    log_attempt_to_cf "final" "false" "$(cat .claude/.artifacts/gate.json 2>/dev/null || echo '{}')"
    export_session_summary "failed" "$MAX_ATTEMPTS"
    
    # Escalate to CF task orchestrator if available
    if command -v npx >/dev/null 2>&1 && npx claude-flow@alpha --version >/dev/null 2>&1; then
        note "🚨 Escalating to CF task orchestrator"
        npx claude-flow@alpha task orchestrate --escalate architecture --reason "self-correct-limit-exceeded" --context "$(cat .claude/.artifacts/triage.json)" 2>/dev/null || true
    fi
    
    # Update operational metrics to record failure
    [[ -x scripts/ops_tripwires.sh ]] && scripts/ops_tripwires.sh update-metrics || true
    
    exit 2
}

# Help text
show_help() {
    cat <<EOF
Self-Correction Loop - SPEK-AUGMENT + CF v2 Alpha Integration

USAGE:
    $0 [options]

DESCRIPTION:
    Bounded repair cycle: VERIFY → GATE → ANALYZE → FIX → repeat
    Stops when all quality gates pass or max attempts reached.

OPTIONS:
    -h, --help          Show this help
    -v, --verbose       Show detailed logs (default: enabled)
    -q, --quiet         Suppress detailed logs
    -m, --max-attempts  Maximum repair attempts (default: 4)
    -b, --base-branch   Base branch for comparison (default: main)

ENVIRONMENT:
    MAX_ATTEMPTS        Maximum repair cycles (default: 4)
    BASE_BRANCH         Base branch (default: main)
    SHOW_LOGS          Show detailed gate/triage output (default: 1)
    HIVE_NAMESPACE     CF namespace (default: spek/self-correct/YYYYMMDD)
    SESSION_ID         CF session ID (default: swarm-self-correct-TIMESTAMP)

EXAMPLES:
    $0                          # Run with defaults
    $0 -m 6                     # Allow 6 repair attempts
    $0 --quiet                  # Suppress detailed output
    BASE_BRANCH=dev $0          # Compare against dev branch

EXIT CODES:
    0 - All gates passed
    1 - Configuration error
    2 - Max attempts reached, gates still failing

INTEGRATION:
    - CF v2 Alpha: Hive coordination, neural training, memory export
    - SPEK-AUGMENT: Operational tripwires, bounded attempts, escalation
    - Quality Gates: /qa:run, /sec:scan, /conn:scan, /qa:gate
    - Repair Routes: /codex:micro-fix, /fix:planned, /gemini:impact
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            SHOW_LOGS=1
            shift
            ;;
        -q|--quiet)
            SHOW_LOGS=0
            shift
            ;;
        -m|--max-attempts)
            MAX_ATTEMPTS="$2"
            shift 2
            ;;
        -b|--base-branch)
            BASE_BRANCH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
    esac
done

# Validate configuration
if ! [[ "$MAX_ATTEMPTS" =~ ^[0-9]+$ ]] || (( MAX_ATTEMPTS < 1 )) || (( MAX_ATTEMPTS > 10 )); then
    echo "Error: MAX_ATTEMPTS must be between 1 and 10, got: $MAX_ATTEMPTS" >&2
    exit 1
fi

# Run main loop
main