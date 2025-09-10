#!/bin/bash
# Enhanced State Recovery for Post-Completion Cleanup

set -euo pipefail

# State file validation and recovery
validate_and_recover_state() {
    local state_file="$1"
    local backup_state_file="${state_file}.backup"
    
    # Create backup of current state if it exists
    if [[ -f "$state_file" ]]; then
        cp "$state_file" "$backup_state_file" 2>/dev/null || true
    fi
    
    # Try to validate state file
    if [[ -f "$state_file" ]]; then
        # Check if state file is valid bash
        if ! bash -n "$state_file" 2>/dev/null; then
            echo "WARN: State file corrupted, attempting recovery..."
            
            # Try to recover from backup
            if [[ -f "$backup_state_file" ]] && bash -n "$backup_state_file" 2>/dev/null; then
                echo "INFO: Recovered state from backup"
                cp "$backup_state_file" "$state_file"
                return 0
            fi
            
            # Create minimal valid state
            echo "WARN: Creating minimal state file"
            cat > "$state_file" << 'EOFSTATE'
CLEANUP_VERSION="2.0.0"
LAST_PHASE="0"
LAST_STATUS="RECOVERY"
LAST_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DETAILS="Recovered from corrupted state"
BACKUP_TAG=""
BACKUP_BRANCH=""
EOFSTATE
            return 1
        fi
    fi
    
    return 0
}

# Lock file recovery
recover_stale_locks() {
    local lock_file="$1"
    
    if [[ -f "$lock_file" ]]; then
        local lock_pid
        lock_pid=$(cat "$lock_file" 2>/dev/null || echo "")
        
        if [[ -n "$lock_pid" ]]; then
            # Check if process is still running
            if ! kill -0 "$lock_pid" 2>/dev/null; then
                echo "INFO: Removing stale lock file (PID $lock_pid no longer exists)"
                rm -f "$lock_file"
                return 0
            else
                echo "WARN: Active lock found (PID $lock_pid)"
                return 1
            fi
        else
            echo "INFO: Removing empty lock file"
            rm -f "$lock_file"
            return 0
        fi
    fi
    
    return 0
}

# Export functions
export -f validate_and_recover_state recover_stale_locks
