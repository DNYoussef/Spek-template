#!/bin/bash

# Sandbox Janitor - TTL cleanup and disk management
# CF v2 Alpha integration for sandbox lifecycle

set -euo pipefail

SANDBOX_DIR=".sandboxes"
TTL_HOURS="${SANDBOX_TTL_HOURS:-72}"
MAX_SANDBOXES="${SANDBOX_MAX:-10}"
ARTIFACTS_DIR=".claude/.artifacts"

mkdir -p "$ARTIFACTS_DIR"

# Log function
log() {
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): $*" | tee -a "$ARTIFACTS_DIR/sandbox_janitor.log"
}

# Check disk space
check_disk_space() {
    local disk_free=$(df . | tail -1 | awk '{print 100-$5}' | tr -d '%' || echo 100)
    echo "$disk_free"
}

# Count sandboxes
count_sandboxes() {
    if [[ -d "$SANDBOX_DIR" ]]; then
        ls -1 "$SANDBOX_DIR" 2>/dev/null | wc -l
    else
        echo 0
    fi
}

# Clean expired sandboxes by TTL
cleanup_by_ttl() {
    local cleaned=0
    
    if [[ ! -d "$SANDBOX_DIR" ]]; then
        log "No sandbox directory found"
        return 0
    fi
    
    log "[U+1F9F9] Cleaning sandboxes older than $TTL_HOURS hours..."
    
    # Find directories older than TTL_HOURS
    while IFS= read -r -d '' sandbox; do
        local sandbox_name=$(basename "$sandbox")
        local age_hours=$(( ($(date +%s) - $(stat -c %Y "$sandbox" 2>/dev/null || echo 0)) / 3600 ))
        
        if [[ $age_hours -gt $TTL_HOURS ]]; then
            log "  Removing expired sandbox: $sandbox_name (age: ${age_hours}h)"
            
            # Clean up any associated git branches
            local branch_name="codex/$(echo "$sandbox_name" | cut -d'-' -f2-)"
            if git branch | grep -q "$branch_name" 2>/dev/null; then
                git branch -D "$branch_name" 2>/dev/null || log "    Warning: Failed to delete branch $branch_name"
            fi
            
            # Remove sandbox directory
            rm -rf "$sandbox" && ((cleaned++)) || log "    Warning: Failed to remove $sandbox"
        fi
    done < <(find "$SANDBOX_DIR" -maxdepth 1 -type d -not -name "$(basename "$SANDBOX_DIR")" -print0 2>/dev/null)
    
    log "[OK] Cleaned $cleaned expired sandboxes"
    return 0
}

# Clean oldest sandboxes when count exceeds limit
cleanup_by_count() {
    local current_count=$(count_sandboxes)
    local cleaned=0
    
    if [[ $current_count -le $MAX_SANDBOXES ]]; then
        log "Sandbox count ($current_count) within limit ($MAX_SANDBOXES)"
        return 0
    fi
    
    local excess=$(( current_count - MAX_SANDBOXES ))
    log "[U+1F9F9] Cleaning $excess oldest sandboxes (current: $current_count, limit: $MAX_SANDBOXES)..."
    
    # Get oldest sandboxes by modification time
    while IFS= read -r sandbox; do
        if [[ $excess -le 0 ]]; then
            break
        fi
        
        local sandbox_name=$(basename "$sandbox")
        log "  Removing oldest sandbox: $sandbox_name"
        
        # Clean up associated git branches
        local branch_name="codex/$(echo "$sandbox_name" | cut -d'-' -f2-)"
        if git branch | grep -q "$branch_name" 2>/dev/null; then
            git branch -D "$branch_name" 2>/dev/null || log "    Warning: Failed to delete branch $branch_name"
        fi
        
        # Remove sandbox directory
        rm -rf "$sandbox" && ((cleaned++)) && ((excess--)) || log "    Warning: Failed to remove $sandbox"
    done < <(find "$SANDBOX_DIR" -maxdepth 1 -type d -not -name "$(basename "$SANDBOX_DIR")" -printf '%T@ %p\n' 2>/dev/null | sort -n | cut -d' ' -f2-)
    
    log "[OK] Cleaned $cleaned sandboxes by count"
}

# Emergency cleanup for critical disk space
emergency_cleanup() {
    local disk_free=$(check_disk_space)
    log "[U+1F6A8] Emergency cleanup - disk space: $disk_free%"
    
    # Remove all sandboxes
    if [[ -d "$SANDBOX_DIR" ]]; then
        local sandbox_count=$(count_sandboxes)
        log "  Removing all $sandbox_count sandboxes..."
        
        # Clean up all codex branches
        git branch | grep "codex/" | xargs -r git branch -D 2>/dev/null || true
        
        # Remove sandbox directory
        rm -rf "$SANDBOX_DIR"/* 2>/dev/null || true
        log "[OK] Emergency cleanup completed"
    fi
    
    # Clean up large artifacts
    find "$ARTIFACTS_DIR" -type f -size +10M -mtime +1 -delete 2>/dev/null || true
    log "  Large artifacts cleaned"
    
    # Verify space recovery
    local new_disk_free=$(check_disk_space)
    log "  Disk space recovered: $disk_free% -> $new_disk_free%"
}

# Generate cleanup report
generate_report() {
    local sandbox_count=$(count_sandboxes)
    local disk_free=$(check_disk_space)
    
    cat <<EOF
[CHART] Sandbox Janitor Report
========================
Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)

Current Status:
  Sandboxes: $sandbox_count / $MAX_SANDBOXES
  Disk Free: $disk_free%
  TTL Hours: $TTL_HOURS

Thresholds:
  Max Sandboxes: $MAX_SANDBOXES
  Min Disk Free: 15%
  Emergency Disk: 10%

Recent Activity:
EOF
    tail -10 "$ARTIFACTS_DIR/sandbox_janitor.log" 2>/dev/null || echo "  No activity logged"
    
    if [[ -d "$SANDBOX_DIR" ]]; then
        echo ""
        echo "Active Sandboxes:"
        find "$SANDBOX_DIR" -maxdepth 1 -type d -not -name "$(basename "$SANDBOX_DIR")" -printf '  %f (age: %A)\n' 2>/dev/null || echo "  None"
    fi
}

# Regular maintenance routine
maintenance() {
    log "[TOOL] Starting regular maintenance..."
    
    # TTL-based cleanup
    cleanup_by_ttl
    
    # Count-based cleanup  
    cleanup_by_count
    
    # Check disk space
    local disk_free=$(check_disk_space)
    if [[ $disk_free -lt 15 ]]; then
        log "[WARN]  Low disk space: $disk_free% - consider emergency cleanup"
    fi
    
    log "[OK] Maintenance completed"
}

# Integration with CF scheduler
schedule_maintenance() {
    log "[U+1F4C5] Scheduling maintenance with CF..."
    
    # Register with CF scheduler if available
    if command -v "npx claude-flow@alpha" >/dev/null 2>&1; then
        npx claude-flow@alpha scheduler manage \
            --job "sandbox-janitor" \
            --schedule "0 */6 * * *" \
            --cmd "bash scripts/sandbox_janitor.sh maintenance" \
            --description "Sandbox TTL cleanup and disk management" \
            2>/dev/null || log "Warning: CF scheduler not available"
    fi
}

# Main command routing
case "${1:-help}" in
    cleanup-now)
        maintenance
        ;;
    cleanup-ttl)
        cleanup_by_ttl
        ;;
    cleanup-count)
        cleanup_by_count
        ;;
    emergency-cleanup)
        emergency_cleanup
        ;;
    maintenance)
        maintenance
        ;;
    report)
        generate_report
        ;;
    schedule)
        schedule_maintenance
        ;;
    *)
        echo "Usage: $0 {cleanup-now|cleanup-ttl|cleanup-count|emergency-cleanup|maintenance|report|schedule}"
        echo ""
        echo "Commands:"
        echo "  cleanup-now       - Run full maintenance (TTL + count)"
        echo "  cleanup-ttl       - Remove sandboxes older than $TTL_HOURS hours"
        echo "  cleanup-count     - Remove oldest sandboxes above limit ($MAX_SANDBOXES)"
        echo "  emergency-cleanup - Remove all sandboxes (disk space critical)"
        echo "  maintenance       - Regular maintenance routine"
        echo "  report           - Generate status report"
        echo "  schedule         - Schedule maintenance with CF"
        exit 1
        ;;
esac