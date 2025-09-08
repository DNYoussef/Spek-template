#!/bin/bash

# Operational Tripwires - CF v2 Alpha Integration
# Auto-action matrix for premortem failure modes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTIFACTS_DIR=".claude/.artifacts"
METRICS_FILE="$ARTIFACTS_DIR/system_metrics.json"
STATUS_FILE="$ARTIFACTS_DIR/system_status.log"

mkdir -p "$ARTIFACTS_DIR"

# Initialize metrics if not exists
init_metrics() {
    if [[ ! -f "$METRICS_FILE" ]]; then
        cat > "$METRICS_FILE" <<EOF
{
  "auto_repair_attempts": 0,
  "ci_p95_minutes": 0,
  "waivers_open": 0,
  "sandbox_count": 0,
  "disk_free_percent": 100,
  "secret_scan_hits": 0,
  "last_update": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    fi
}

# Check system limits against tripwires
check_limits() {
    init_metrics
    
    local violations=0
    local sandbox_count=$(ls -1 .sandboxes 2>/dev/null | wc -l || echo 0)
    local disk_free=$(df . | tail -1 | awk '{print 100-$5}' | tr -d '%' || echo 100)
    local waivers_count=$(find . -name "*.waiver" 2>/dev/null | wc -l || echo 0)
    
    echo "🔍 Checking operational tripwires..."
    
    # Tripwire 1: Auto-repair attempts >= 3
    local repair_attempts=$(jq -r '.auto_repair_attempts // 0' "$METRICS_FILE")
    if [[ $repair_attempts -ge 3 ]]; then
        echo "🚨 TRIPWIRE: Auto-repair attempts >= 3 ($repair_attempts)"
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): ESCALATE to planner - disable auto-repair" >> "$STATUS_FILE"
        export AUTO_REPAIR_DISABLED=true
        ((violations++))
    fi
    
    # Tripwire 2: Sandbox count > 10 or disk < 15%
    if [[ $sandbox_count -gt 10 ]] || [[ $disk_free -lt 15 ]]; then
        echo "🚨 TRIPWIRE: Sandbox limits exceeded (count: $sandbox_count, disk: $disk_free%)"
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): PAUSE auto-repair - cleanup needed" >> "$STATUS_FILE"
        bash "$SCRIPT_DIR/sandbox_janitor.sh" cleanup-now || true
        export AUTO_REPAIR_PAUSED=true
        ((violations++))
    fi
    
    # Tripwire 3: Waivers > 10 or age > 30d
    if [[ $waivers_count -gt 10 ]]; then
        echo "🚨 TRIPWIRE: Too many open waivers ($waivers_count)"
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): RULE PRUNING needed - page security-manager" >> "$STATUS_FILE"
        # Create GitHub issue for rule pruning
        gh issue create --title "Rule Pruning Required" --body "Open waivers: $waivers_count > threshold (10)" --label "security" 2>/dev/null || true
        ((violations++))
    fi
    
    # Tripwire 4: Secret scan hits >= 1
    local secret_hits=$(jq -r '.secret_scan_hits // 0' "$METRICS_FILE")
    if [[ $secret_hits -ge 1 ]]; then
        echo "🚨 TRIPWIRE: Secret scan hits detected ($secret_hits)"
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): SECURITY INCIDENT - block artifacts, rotate keys" >> "$STATUS_FILE"
        # Block artifact upload
        touch "$ARTIFACTS_DIR/.upload_blocked"
        ((violations++))
    fi
    
    # Update metrics
    jq --argjson sandbox "$sandbox_count" \
       --argjson disk "$disk_free" \
       --argjson waivers "$waivers_count" \
       --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.sandbox_count = $sandbox | .disk_free_percent = $disk | .waivers_open = $waivers | .last_update = $timestamp' \
       "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
    
    if [[ $violations -gt 0 ]]; then
        echo "⚠️  Found $violations tripwire violations - check $STATUS_FILE"
        return 1
    else
        echo "✅ All tripwires within limits"
        return 0
    fi
}

# Update metrics post-operation
update_metrics() {
    init_metrics
    
    # Increment auto-repair attempts if in CI
    if [[ "${CI:-}" == "true" ]]; then
        jq '.auto_repair_attempts += 1 | .last_update = now | strftime("%Y-%m-%dT%H:%M:%SZ")' "$METRICS_FILE" > "$METRICS_FILE.tmp"
        mv "$METRICS_FILE.tmp" "$METRICS_FILE"
    fi
    
    # Check CI time (P95 estimation)
    local ci_start="${CI_START_TIME:-$(date +%s)}"
    local ci_duration=$(( $(date +%s) - ci_start ))
    local ci_minutes=$(( ci_duration / 60 ))
    
    if [[ $ci_minutes -gt 15 ]]; then
        echo "🚨 TRIPWIRE: CI P95 > 15 minutes ($ci_minutes)"
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): SWITCH to light gates profile" >> "$STATUS_FILE"
        export GATES_PROFILE=light
        
        jq --argjson minutes "$ci_minutes" \
           '.ci_p95_minutes = $minutes | .last_update = now | strftime("%Y-%m-%dT%H:%M:%SZ")' \
           "$METRICS_FILE" > "$METRICS_FILE.tmp"
        mv "$METRICS_FILE.tmp" "$METRICS_FILE"
    fi
    
    # Reset attempt counter on success
    if [[ "${TASK_SUCCESS:-}" == "true" ]]; then
        jq '.auto_repair_attempts = 0 | .last_update = now | strftime("%Y-%m-%dT%H:%M:%SZ")' "$METRICS_FILE" > "$METRICS_FILE.tmp"
        mv "$METRICS_FILE.tmp" "$METRICS_FILE"
    fi
}

# Health check and auto-heal integration
health_check() {
    echo "🏥 Running CF health check..."
    
    # Check CF components
    if ! npx claude-flow@alpha health check --components all --quiet; then
        echo "🚨 CF components failing - enabling degraded mode"
        export CF_DEGRADED_MODE=true
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): CF_DEGRADED_MODE enabled" >> "$STATUS_FILE"
        
        # Switch to fallback tools
        export GATES_PROFILE=light
        echo "Degraded mode: Using light gates only" >> "$STATUS_FILE"
    fi
    
    # Check disk space
    local disk_free=$(df . | tail -1 | awk '{print 100-$5}' | tr -d '%' || echo 100)
    if [[ $disk_free -lt 10 ]]; then
        echo "🚨 Critical disk space: $disk_free%"
        bash "$SCRIPT_DIR/sandbox_janitor.sh" emergency-cleanup || true
    fi
}

# Risk-based gate profile selection
select_gate_profile() {
    local pr_labels="${1:-}"
    
    # Check for high-risk labels
    if echo "$pr_labels" | grep -qE "(security|infra|core-module)"; then
        echo "full"
        return 0
    fi
    
    # Check for fast-lane labels  
    if echo "$pr_labels" | grep -qE "(docs|chore|test-only)"; then
        echo "light"
        return 0
    fi
    
    # Default based on environment
    echo "${GATES_PROFILE:-full}"
}

# Generate operational report
generate_report() {
    init_metrics
    
    echo "📊 SPEK-AUGMENT Operational Report"
    echo "=================================="
    echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo ""
    echo "Metrics:"
    jq -r 'to_entries[] | "  \(.key): \(.value)"' "$METRICS_FILE"
    echo ""
    echo "Recent Status Events:"
    tail -10 "$STATUS_FILE" 2>/dev/null || echo "  No events logged"
    echo ""
    echo "Environment:"
    echo "  GATES_PROFILE: ${GATES_PROFILE:-full}"
    echo "  CF_DEGRADED_MODE: ${CF_DEGRADED_MODE:-false}"  
    echo "  AUTO_REPAIR_DISABLED: ${AUTO_REPAIR_DISABLED:-false}"
    echo ""
    echo "Sandboxes: $(ls -1 .sandboxes 2>/dev/null | wc -l) / ${SANDBOX_MAX:-10}"
    echo "Disk Free: $(df . | tail -1 | awk '{print 100-$5}')%"
}

# Main command routing
case "${1:-help}" in
    check-limits)
        check_limits
        ;;
    update-metrics)
        update_metrics
        ;;
    health-check)
        health_check
        ;;
    gate-profile)
        select_gate_profile "${2:-}"
        ;;
    report)
        generate_report
        ;;
    *)
        echo "Usage: $0 {check-limits|update-metrics|health-check|gate-profile|report}"
        echo ""
        echo "Commands:"
        echo "  check-limits    - Check all operational tripwires"
        echo "  update-metrics  - Update system metrics"
        echo "  health-check    - CF health check and auto-heal"
        echo "  gate-profile    - Select gate profile based on PR labels"  
        echo "  report          - Generate operational report"
        exit 1
        ;;
esac