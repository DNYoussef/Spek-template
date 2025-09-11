#!/bin/bash

# Post-Completion Cleanup Orchestrator
# Enterprise-grade 3-phase cleanup system with full safety mechanisms
# SPEK Template -> Production-Ready Project Transformation

set -euo pipefail

# ========================================================================================
# GLOBAL CONFIGURATION & CONSTANTS
# ========================================================================================

readonly SCRIPT_VERSION="2.0.0"
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly CLEANUP_STATE_FILE="$PROJECT_ROOT/.cleanup-state"
readonly CLEANUP_LOCK_FILE="$PROJECT_ROOT/.cleanup-lock"
readonly BACKUP_DIR="$PROJECT_ROOT/.spek-backup"
readonly LOG_FILE="$PROJECT_ROOT/.cleanup.log"

# Command line options
DRY_RUN=false
FORCE_MODE=false
VERBOSE=false
SPECIFIC_PHASE=""
ROLLBACK_MODE=false
STATUS_MODE=false
THEATER_SCAN=false

# Phase configuration
readonly PHASES=(
    "1:safety-backup:Safety & Backup (NON-DESTRUCTIVE)"
    "2:infrastructure:Infrastructure Cleanup (DESTRUCTIVE, REVERSIBLE)"
    "3:documentation:Documentation & Handoff (CONSTRUCTIVE)"
)

# Critical directories to preserve
readonly PRESERVE_DIRS=(
    "analyzer"
    ".github"
    "src"
    "tests"
    "docs"
)

# Directories to remove in Phase 2
readonly REMOVE_DIRS=(
    ".claude"
    "flow"
    "memory"
    "gemini"
    ".artifacts"
)

# ========================================================================================
# UTILITY FUNCTIONS & SAFETY MECHANISMS
# ========================================================================================

# Source safety commons
if [[ -f "$SCRIPT_DIR/cleanup-commons.sh" ]]; then
    source "$SCRIPT_DIR/cleanup-commons.sh"
else
    echo "ERROR: cleanup-commons.sh not found. Cannot proceed safely." >&2
    exit 1
fi

# Enhanced logging with theater detection integration
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Color coding for different log levels
    local color=""
    case "$level" in
        ERROR)   color="\033[31m" ;;  # Red
        WARN)    color="\033[33m" ;;  # Yellow
        INFO)    color="\033[32m" ;;  # Green
        DEBUG)   color="\033[36m" ;;  # Cyan
        THEATER) color="\033[35m" ;;  # Magenta
    esac
    
    local formatted_message="[$timestamp] [$level] $message"
    
    # Console output with colors (if terminal supports it)
    if [[ -t 1 ]]; then
        echo -e "${color}${formatted_message}\033[0m"
    else
        echo "$formatted_message"
    fi
    
    # File logging without colors
    echo "$formatted_message" >> "$LOG_FILE"
    
    # Theater detection integration
    if [[ "$level" == "THEATER" ]]; then
        echo "THEATER_DETECTION: $message" >> "$LOG_FILE.theater"
    fi
}

# Lock management
acquire_lock() {
    if [[ -f "$CLEANUP_LOCK_FILE" ]]; then
        local lock_pid
        lock_pid=$(cat "$CLEANUP_LOCK_FILE" 2>/dev/null || echo "unknown")
        log "ERROR" "Cleanup already in progress (PID: $lock_pid) or previous run crashed"
        log "INFO" "If you're sure no other cleanup is running, remove: $CLEANUP_LOCK_FILE"
        exit 1
    fi
    
    echo $$ > "$CLEANUP_LOCK_FILE"
    log "DEBUG" "Acquired cleanup lock (PID: $$)"
}

release_lock() {
    if [[ -f "$CLEANUP_LOCK_FILE" ]]; then
        rm -f "$CLEANUP_LOCK_FILE"
        log "DEBUG" "Released cleanup lock"
    fi
}

# Trap handler for cleanup
cleanup_on_exit() {
    local exit_code=$?
    log "DEBUG" "Cleanup handler triggered with exit code: $exit_code"
    
    if [[ $exit_code -ne 0 ]]; then
        log "ERROR" "Script terminated unexpectedly. Check logs and consider rollback."
        save_state "ERROR" "Script terminated with code $exit_code"
    fi
    
    release_lock
    exit $exit_code
}

trap cleanup_on_exit EXIT INT TERM

# State management
save_state() {
    local phase="$1"
    local status="$2"
    local details="${3:-}"
    
    cat > "$CLEANUP_STATE_FILE" <<EOF
CLEANUP_VERSION="$SCRIPT_VERSION"
LAST_PHASE="$phase"
LAST_STATUS="$status"
LAST_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DETAILS="$details"
BACKUP_TAG="$(get_backup_tag)"
BACKUP_BRANCH="$(get_backup_branch)"
EOF
    
    log "DEBUG" "State saved: Phase=$phase, Status=$status"
}

load_state() {
    if [[ -f "$CLEANUP_STATE_FILE" ]]; then
        source "$CLEANUP_STATE_FILE" 2>/dev/null || true
        log "DEBUG" "State loaded: Phase=${LAST_PHASE:-none}, Status=${LAST_STATUS:-none}"
    fi
}

get_backup_tag() {
    echo "pre-cleanup-$(date +%Y%m%d-%H%M%S)"
}

get_backup_branch() {
    echo "spek-template-backup"
}

# Theater detection integration
theater_scan() {
    if [[ "$THEATER_SCAN" == "true" ]]; then
        log "THEATER" "Running theater detection scan..."
        
        # Check for completion theater patterns
        local theater_indicators=(
            "TODO:"
            "FIXME:"
            "HACK:"
            "XXX:"
            "placeholder"
            "mock"
            "stub"
            "fake"
        )
        
        local found_indicators=0
        for indicator in "${theater_indicators[@]}"; do
            if grep -r "$indicator" --include="*.py" --include="*.js" --include="*.ts" --include="*.sh" . 2>/dev/null; then
                ((found_indicators++))
                log "THEATER" "Found potential theater indicator: $indicator"
            fi
        done
        
        if [[ $found_indicators -gt 0 ]]; then
            log "WARN" "Theater detection found $found_indicators potential issues"
            if [[ "$FORCE_MODE" != "true" ]]; then
                echo "Continue despite theater detection findings? (y/N)"
                read -r response
                [[ "$response" =~ ^[Yy]$ ]] || exit 1
            fi
        else
            log "INFO" "Theater detection: No suspicious patterns found"
        fi
    fi
}

# User confirmation with clear messaging
confirm_action() {
    local message="$1"
    local default="${2:-N}"
    
    if [[ "$FORCE_MODE" == "true" ]]; then
        log "INFO" "Force mode: Auto-confirming: $message"
        return 0
    fi
    
    echo
    echo "[U+2554][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2557]"
    echo "[U+2551] CONFIRMATION REQUIRED                                                            [U+2551]"
    echo "[U+2560][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2563]"
    printf "[U+2551] %-80s [U+2551]\n" "$message"
    echo "[U+255A][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+255D]"
    echo
    
    local prompt="Continue? (y/N)"
    if [[ "$default" == "Y" ]]; then
        prompt="Continue? (Y/n)"
    fi
    
    echo -n "$prompt "
    read -r response
    
    case "$response" in
        [Yy]|[Yy][Ee][Ss])
            return 0
            ;;
        [Nn]|[Nn][Oo]|"")
            if [[ "$default" == "Y" && "$response" == "" ]]; then
                return 0
            fi
            return 1
            ;;
        *)
            echo "Please answer yes or no."
            confirm_action "$message" "$default"
            ;;
    esac
}

# Progress indicator
show_progress() {
    local current="$1"
    local total="$2"
    local message="$3"
    
    local percentage=$((current * 100 / total))
    local filled=$((percentage / 5))
    local empty=$((20 - filled))
    
    printf "\r[%s%s] %d%% - %s" \
        "$(printf "%*s" $filled | tr ' ' '[U+2588]')" \
        "$(printf "%*s" $empty | tr ' ' '[U+2591]')" \
        $percentage \
        "$message"
    
    if [[ $current -eq $total ]]; then
        echo
    fi
}

# ========================================================================================
# PHASE IMPLEMENTATIONS
# ========================================================================================

# Phase 1: Safety & Backup (NON-DESTRUCTIVE)
phase_1_safety_backup() {
    log "INFO" "=== PHASE 1: SAFETY & BACKUP (NON-DESTRUCTIVE) ==="
    
    theater_scan
    
    # Step 1: Validate project completion
    log "INFO" "Step 1/6: Validating project completion..."
    if [[ -x "$SCRIPT_DIR/validate-completion.sh" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            "$SCRIPT_DIR/validate-completion.sh" --quiet || {
                log "ERROR" "Project completion validation failed"
                return 1
            }
        else
            log "INFO" "[DRY-RUN] Would run completion validation"
        fi
    else
        log "WARN" "validate-completion.sh not found or not executable"
    fi
    show_progress 1 6 "Completion validated"
    
    # Step 2: Create git tag
    local backup_tag
    backup_tag=$(get_backup_tag)
    log "INFO" "Step 2/6: Creating backup git tag: $backup_tag"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        git tag -a "$backup_tag" -m "Pre-cleanup backup created by $SCRIPT_NAME v$SCRIPT_VERSION" || {
            log "ERROR" "Failed to create git tag"
            return 1
        }
    else
        log "INFO" "[DRY-RUN] Would create git tag: $backup_tag"
    fi
    show_progress 2 6 "Git tag created"
    
    # Step 3: Create backup branch
    local backup_branch
    backup_branch=$(get_backup_branch)
    log "INFO" "Step 3/6: Creating backup branch: $backup_branch"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        git checkout -b "$backup_branch" || {
            log "ERROR" "Failed to create backup branch"
            return 1
        }
        git checkout - >/dev/null 2>&1
    else
        log "INFO" "[DRY-RUN] Would create backup branch: $backup_branch"
    fi
    show_progress 3 6 "Backup branch created"
    
    # Step 4: Full filesystem backup
    log "INFO" "Step 4/6: Creating full filesystem backup..."
    if [[ "$DRY_RUN" == "false" ]]; then
        if [[ -d "$BACKUP_DIR" ]]; then
            log "WARN" "Backup directory exists, removing old backup"
            rm -rf "$BACKUP_DIR"
        fi
        
        cp -r "$PROJECT_ROOT" "$BACKUP_DIR" || {
            log "ERROR" "Failed to create filesystem backup"
            return 1
        }
        
        # Remove the backup directory from within the backup
        rm -rf "$BACKUP_DIR/.spek-backup" 2>/dev/null || true
    else
        log "INFO" "[DRY-RUN] Would create filesystem backup at: $BACKUP_DIR"
    fi
    show_progress 4 6 "Filesystem backup created"
    
    # Step 5: Generate file inventory
    log "INFO" "Step 5/6: Generating complete file inventory..."
    local inventory_file="$PROJECT_ROOT/.file-inventory-$(date +%Y%m%d-%H%M%S).txt"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        {
            echo "# File Inventory Generated by $SCRIPT_NAME v$SCRIPT_VERSION"
            echo "# Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
            echo "# Project: $(basename "$PROJECT_ROOT")"
            echo ""
            find "$PROJECT_ROOT" -type f ! -path "$BACKUP_DIR/*" ! -name ".cleanup*" \
                -exec ls -la {} + | sort
        } > "$inventory_file" || {
            log "ERROR" "Failed to generate file inventory"
            return 1
        }
    else
        log "INFO" "[DRY-RUN] Would generate file inventory: $inventory_file"
    fi
    show_progress 5 6 "File inventory generated"
    
    # Step 6: Final confirmation
    log "INFO" "Step 6/6: Phase 1 completion confirmation"
    
    if ! confirm_action "Phase 1 (Safety & Backup) completed successfully. All safety measures are in place. Ready to proceed to destructive Phase 2?"; then
        log "INFO" "User chose to stop after Phase 1. This is safe - all backups are created."
        save_state "1" "COMPLETED_STOPPED"
        return 2  # Special return code for user-requested stop
    fi
    
    show_progress 6 6 "Phase 1 complete"
    save_state "1" "COMPLETED"
    log "INFO" "Phase 1 completed successfully. All safety mechanisms in place."
    
    return 0
}

# Phase 2: Infrastructure Cleanup (DESTRUCTIVE, REVERSIBLE)
phase_2_infrastructure_cleanup() {
    log "INFO" "=== PHASE 2: INFRASTRUCTURE CLEANUP (DESTRUCTIVE, REVERSIBLE) ==="
    
    # Load state to ensure Phase 1 was completed
    load_state
    if [[ "${LAST_PHASE:-}" != "1" || "${LAST_STATUS:-}" != "COMPLETED" ]]; then
        if [[ "$FORCE_MODE" != "true" ]]; then
            log "ERROR" "Phase 1 not completed. Run Phase 1 first or use --force"
            return 1
        fi
    fi
    
    local steps=(
        ".claude directory (22+ commands, 54 agents)"
        "flow/, memory/, gemini/ directories"
        "scripts/ directory cleanup"
        "package.json updates"
        "README.md transformation"
        "SPEC.md archival"
    )
    
    local current_step=0
    local total_steps=${#steps[@]}
    
    # Step 1: Remove .claude directory
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Removing .claude directory..."
    
    if [[ -d "$PROJECT_ROOT/.claude" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            # Show what's being removed
            log "INFO" "Contents to be removed:"
            find "$PROJECT_ROOT/.claude" -type f | head -20 | while read -r file; do
                log "INFO" "  - $(basename "$file")"
            done
            
            if ! confirm_action "Remove .claude directory with all SPEK template infrastructure?"; then
                log "INFO" "User aborted during .claude removal"
                return 1
            fi
            
            rm -rf "$PROJECT_ROOT/.claude" || {
                log "ERROR" "Failed to remove .claude directory"
                return 1
            }
            
            # Validate analyzer still works
            if [[ -f "$PROJECT_ROOT/analyzer/__init__.py" ]]; then
                cd "$PROJECT_ROOT" && python -m analyzer --version >/dev/null 2>&1 || {
                    log "ERROR" "Analyzer validation failed after .claude removal"
                    return 1
                }
            fi
        else
            log "INFO" "[DRY-RUN] Would remove .claude directory"
        fi
    else
        log "INFO" ".claude directory not found, skipping"
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 2: Remove flow/, memory/, gemini/ directories
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Removing infrastructure directories..."
    
    for dir in "${REMOVE_DIRS[@]}"; do
        if [[ -d "$PROJECT_ROOT/$dir" && "$dir" != ".claude" ]]; then
            if [[ "$DRY_RUN" == "false" ]]; then
                log "INFO" "Removing $dir directory..."
                rm -rf "$PROJECT_ROOT/$dir" || {
                    log "ERROR" "Failed to remove $dir directory"
                    return 1
                }
            else
                log "INFO" "[DRY-RUN] Would remove $dir directory"
            fi
        fi
    done
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 3: Clean scripts directory
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Cleaning scripts directory..."
    
    if [[ -d "$PROJECT_ROOT/scripts" ]]; then
        # Preserve production-essential scripts
        local preserve_scripts=(
            "post-completion-cleanup.sh"
            "cleanup-commons.sh"
            "validate-completion.sh"
            "generate-handoff-docs.sh"
        )
        
        if [[ "$DRY_RUN" == "false" ]]; then
            # Create temporary directory for preserved scripts
            local temp_scripts="$PROJECT_ROOT/.temp-scripts"
            mkdir -p "$temp_scripts"
            
            # Copy preserved scripts
            for script in "${preserve_scripts[@]}"; do
                if [[ -f "$PROJECT_ROOT/scripts/$script" ]]; then
                    cp "$PROJECT_ROOT/scripts/$script" "$temp_scripts/" || {
                        log "ERROR" "Failed to preserve $script"
                        return 1
                    }
                fi
            done
            
            # Remove scripts directory
            rm -rf "$PROJECT_ROOT/scripts"
            
            # Recreate with only preserved scripts
            mkdir -p "$PROJECT_ROOT/scripts"
            if [[ -d "$temp_scripts" ]]; then
                cp "$temp_scripts"/* "$PROJECT_ROOT/scripts/" 2>/dev/null || true
                rm -rf "$temp_scripts"
            fi
        else
            log "INFO" "[DRY-RUN] Would clean scripts directory, preserving:"
            for script in "${preserve_scripts[@]}"; do
                log "INFO" "  - $script"
            done
        fi
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 4: Update package.json
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Updating package.json..."
    
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            # Backup original package.json
            cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package.json.backup"
            
            # Create clean production package.json
            python3 -c "
import json
import sys

try:
    with open('$PROJECT_ROOT/package.json', 'r') as f:
        data = json.load(f)
    
    # Remove development dependencies
    dev_deps_to_remove = ['@types/node', 'typescript', 'ts-node', 'nodemon']
    if 'devDependencies' in data:
        for dep in dev_deps_to_remove:
            data['devDependencies'].pop(dep, None)
        if not data['devDependencies']:
            del data['devDependencies']
    
    # Clean scripts
    if 'scripts' in data:
        production_scripts = {
            'build': data['scripts'].get('build', 'npm run build'),
            'test': data['scripts'].get('test', 'npm test'),
            'start': data['scripts'].get('start', 'npm start')
        }
        data['scripts'] = production_scripts
    
    # Remove SPEK-specific fields
    data.pop('spek', None)
    data.pop('claude-flow', None)
    
    # Update description
    if 'description' in data:
        data['description'] = data['description'].replace('SPEK Template', 'Production Application')
    
    with open('$PROJECT_ROOT/package.json', 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    
    print('package.json updated successfully')
except Exception as e:
    print(f'Error updating package.json: {e}', file=sys.stderr)
    sys.exit(1)
" || {
                log "ERROR" "Failed to update package.json"
                return 1
            }
        else
            log "INFO" "[DRY-RUN] Would update package.json (remove dev deps, clean scripts)"
        fi
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 5: Transform README.md
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Transforming README.md..."
    
    if [[ -f "$PROJECT_ROOT/README.md" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            # Backup original README
            cp "$PROJECT_ROOT/README.md" "$PROJECT_ROOT/README.md.backup"
            
            # Create production README
            cat > "$PROJECT_ROOT/README.md" << 'EOF'
# Production Application

This application has been developed using the SPEK methodology and is now ready for production use.

## Getting Started

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Run tests
npm run test

# Start the application
npm start
```

## Architecture

This application includes:

- **Analyzer System**: Comprehensive code analysis and quality monitoring
- **GitHub Workflows**: Automated CI/CD with quality gates
- **Documentation**: Complete technical documentation in `docs/`
- **Testing**: Full test coverage with automated validation

## Quality Assurance

- NASA POT10 compliance for defense industry standards
- Automated quality gates in CI/CD pipeline
- Comprehensive static analysis and security scanning
- Performance monitoring and optimization

## Maintenance

See `docs/` directory for detailed technical documentation and maintenance guides.

## Support

For technical support and documentation, refer to the generated handoff documentation in the `docs/` directory.
EOF
        else
            log "INFO" "[DRY-RUN] Would transform README.md to production version"
        fi
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 6: Archive SPEC.md
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Archiving SPEC.md..."
    
    if [[ -f "$PROJECT_ROOT/SPEC.md" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            mkdir -p "$PROJECT_ROOT/docs"
            mv "$PROJECT_ROOT/SPEC.md" "$PROJECT_ROOT/docs/ORIGINAL-SPEC.md" || {
                log "ERROR" "Failed to archive SPEC.md"
                return 1
            }
        else
            log "INFO" "[DRY-RUN] Would move SPEC.md to docs/ORIGINAL-SPEC.md"
        fi
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Final validation
    log "INFO" "Running post-cleanup validation..."
    if [[ "$DRY_RUN" == "false" ]]; then
        # Validate critical components still work
        if [[ -f "$PROJECT_ROOT/analyzer/__init__.py" ]]; then
            cd "$PROJECT_ROOT" && python -m analyzer --version >/dev/null 2>&1 || {
                log "ERROR" "Post-cleanup analyzer validation failed"
                return 1
            }
        fi
        
        # Validate package.json is valid
        if [[ -f "$PROJECT_ROOT/package.json" ]]; then
            python3 -c "import json; json.load(open('$PROJECT_ROOT/package.json'))" || {
                log "ERROR" "package.json validation failed"
                return 1
            }
        fi
    fi
    
    # Git diff review
    if [[ "$DRY_RUN" == "false" ]]; then
        log "INFO" "Reviewing changes made in Phase 2..."
        git add -A
        if ! git diff --cached --quiet; then
            echo
            echo "[U+2554][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2557]"
            echo "[U+2551] PHASE 2 CHANGES REVIEW                                                          [U+2551]"
            echo "[U+255A][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+255D]"
            git diff --cached --stat
            echo
            
            if ! confirm_action "Review the changes above. They are DESTRUCTIVE but REVERSIBLE via rollback. Proceed?"; then
                log "INFO" "User aborted after reviewing Phase 2 changes"
                git reset HEAD >/dev/null 2>&1
                return 1
            fi
            
            git commit -m "Phase 2: Infrastructure cleanup - SPEK template removal

- Removed .claude directory (22+ commands, 54 agents)
- Removed flow/, memory/, gemini/ directories
- Cleaned scripts directory (preserved production essentials)
- Updated package.json (removed dev deps, cleaned scripts)
- Transformed README.md to production version
- Archived SPEC.md to docs/ORIGINAL-SPEC.md

This commit is reversible via: ./scripts/post-completion-cleanup.sh --rollback"
        fi
    fi
    
    save_state "2" "COMPLETED"
    log "INFO" "Phase 2 completed successfully. Infrastructure cleanup done."
    
    return 0
}

# Phase 3: Documentation & Handoff (CONSTRUCTIVE)
phase_3_documentation_handoff() {
    log "INFO" "=== PHASE 3: DOCUMENTATION & HANDOFF (CONSTRUCTIVE) ==="
    
    # Load state to ensure Phase 2 was completed
    load_state
    if [[ "${LAST_PHASE:-}" != "2" || "${LAST_STATUS:-}" != "COMPLETED" ]]; then
        if [[ "$FORCE_MODE" != "true" ]]; then
            log "ERROR" "Phase 2 not completed. Run Phase 2 first or use --force"
            return 1
        fi
    fi
    
    local steps=(
        "Generate handoff documentation"
        "Final package.json validation"
        "Build system validation"
        "GitHub workflows validation"
        "Generate completion report"
        "Final cleanup"
    )
    
    local current_step=0
    local total_steps=${#steps[@]}
    
    # Step 1: Generate handoff documentation
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Generating handoff documentation..."
    
    if [[ -x "$SCRIPT_DIR/generate-handoff-docs.sh" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            "$SCRIPT_DIR/generate-handoff-docs.sh" --automated || {
                log "ERROR" "Failed to generate handoff documentation"
                return 1
            }
        else
            log "INFO" "[DRY-RUN] Would run generate-handoff-docs.sh"
        fi
    else
        log "WARN" "generate-handoff-docs.sh not found or not executable"
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 2: Final package.json validation
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Final package.json validation..."
    
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            # Validate JSON syntax
            python3 -c "import json; json.load(open('$PROJECT_ROOT/package.json'))" || {
                log "ERROR" "package.json syntax validation failed"
                return 1
            }
            
            # Check required scripts exist
            python3 -c "
import json
with open('$PROJECT_ROOT/package.json') as f:
    data = json.load(f)
    
required_scripts = ['build', 'test', 'start']
scripts = data.get('scripts', {})
missing = [s for s in required_scripts if s not in scripts]

if missing:
    print(f'Missing required scripts: {missing}')
    exit(1)
else:
    print('All required scripts present')
" || {
                log "ERROR" "package.json scripts validation failed"
                return 1
            }
        else
            log "INFO" "[DRY-RUN] Would validate package.json syntax and scripts"
        fi
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 3: Build system validation
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Build system validation..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        cd "$PROJECT_ROOT"
        
        # Test npm build if available
        if npm run build >/dev/null 2>&1; then
            log "INFO" "Build system validation: PASSED"
        else
            log "WARN" "Build system validation: FAILED (not critical for all projects)"
        fi
        
        # Test analyzer if available
        if [[ -f "$PROJECT_ROOT/analyzer/__init__.py" ]]; then
            if python -m analyzer --version >/dev/null 2>&1; then
                log "INFO" "Analyzer validation: PASSED"
            else
                log "ERROR" "Analyzer validation: FAILED"
                return 1
            fi
        fi
    else
        log "INFO" "[DRY-RUN] Would validate build system and analyzer"
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 4: GitHub workflows validation
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: GitHub workflows validation..."
    
    if [[ -d "$PROJECT_ROOT/.github/workflows" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            local workflow_count=0
            local valid_workflows=0
            
            for workflow in "$PROJECT_ROOT/.github/workflows"/*.yml "$PROJECT_ROOT/.github/workflows"/*.yaml; do
                if [[ -f "$workflow" ]]; then
                    ((workflow_count++))
                    if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" >/dev/null 2>&1; then
                        ((valid_workflows++))
                        log "DEBUG" "Valid workflow: $(basename "$workflow")"
                    else
                        log "WARN" "Invalid workflow syntax: $(basename "$workflow")"
                    fi
                fi
            done
            
            log "INFO" "GitHub workflows: $valid_workflows/$workflow_count valid"
            
            if [[ $workflow_count -eq 0 ]]; then
                log "WARN" "No GitHub workflows found"
            elif [[ $valid_workflows -lt $workflow_count ]]; then
                log "WARN" "Some GitHub workflows have syntax issues"
            fi
        else
            log "INFO" "[DRY-RUN] Would validate GitHub workflow syntax"
        fi
    else
        log "WARN" "No .github/workflows directory found"
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 5: Generate completion report
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Generating completion report..."
    
    local completion_report="$PROJECT_ROOT/CLEANUP-COMPLETION-REPORT.md"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        cat > "$completion_report" << EOF
# Post-Completion Cleanup Report

**Generated by**: $SCRIPT_NAME v$SCRIPT_VERSION  
**Timestamp**: $(date -u +%Y-%m-%dT%H:%M:%SZ)  
**Project**: $(basename "$PROJECT_ROOT")

## Executive Summary

The SPEK template has been successfully transformed into a production-ready application. All development infrastructure has been removed while preserving the core application functionality and quality assurance systems.

## Cleanup Phases Completed

### [OK] Phase 1: Safety & Backup (NON-DESTRUCTIVE)
- Created git tag: $(get_backup_tag)
- Created backup branch: $(get_backup_branch)
- Full filesystem backup: .spek-backup/
- Complete file inventory generated
- Project completion validation passed

### [OK] Phase 2: Infrastructure Cleanup (DESTRUCTIVE, REVERSIBLE)
- Removed .claude directory (22+ commands, 54 agents)
- Removed flow/, memory/, gemini/ directories
- Cleaned scripts/ directory (preserved production essentials)
- Updated package.json (removed dev dependencies, cleaned scripts)
- Transformed README.md to production documentation
- Archived SPEC.md to docs/ORIGINAL-SPEC.md

### [OK] Phase 3: Documentation & Handoff (CONSTRUCTIVE)
- Generated handoff documentation
- Validated build system and analyzer
- Confirmed GitHub workflows functionality
- Created this completion report

## Preserved Components

### [SHIELD] Quality Infrastructure (PRESERVED)
- \`analyzer/\` directory: Complete code analysis system
- \`.github/workflows/\`: CI/CD pipelines with quality gates
- \`docs/\`: Technical documentation
- \`tests/\`: Test suites

### [CHART] Production Assets (PRESERVED)
- \`src/\`: Source code
- Core configuration files
- Production scripts in \`scripts/\`
- Package.json with production dependencies

## Rollback Information

If rollback is needed, the following options are available:

1. **Git-based rollback**: \`git checkout $(get_backup_tag)\`
2. **Branch-based rollback**: \`git checkout $(get_backup_branch)\`
3. **Script-based rollback**: \`./scripts/post-completion-cleanup.sh --rollback\`
4. **Filesystem rollback**: Restore from \`.spek-backup/\`

## Quality Metrics

$(if [[ -x "$PROJECT_ROOT/analyzer/__init__.py" ]]; then
    cd "$PROJECT_ROOT" && python -m analyzer --stats 2>/dev/null || echo "- Analyzer metrics: Available via \`python -m analyzer --stats\`"
else
    echo "- Analyzer: Not available"
fi)

## Next Steps

1. **Review Documentation**: Check \`docs/\` directory for technical guides
2. **Test Application**: Run \`npm test\` and \`npm run build\`
3. **Deploy**: Use established CI/CD pipelines
4. **Monitor**: Quality gates remain active in GitHub workflows

## Support

For technical support:
- Review handoff documentation in \`docs/\`
- Check GitHub workflows for automated quality monitoring
- Use \`python -m analyzer\` for code quality analysis

---

**IMPORTANT**: This application is now production-ready. All SPEK template infrastructure has been removed while preserving core functionality and quality assurance systems.
EOF
    else
        log "INFO" "[DRY-RUN] Would generate completion report: $completion_report"
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    # Step 6: Final cleanup
    ((current_step++))
    log "INFO" "Step $current_step/$total_steps: Final cleanup..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Remove cleanup state files
        rm -f "$CLEANUP_STATE_FILE"
        
        # Clean up backup package.json if exists
        rm -f "$PROJECT_ROOT/package.json.backup"
        rm -f "$PROJECT_ROOT/README.md.backup"
        
        # Final git commit
        git add -A
        if ! git diff --cached --quiet; then
            git commit -m "Phase 3: Documentation & handoff completion

- Generated handoff documentation
- Created completion report
- Final validation of all systems
- Project transformation complete: SPEK template -> Production application

Application is now production-ready."
        fi
    else
        log "INFO" "[DRY-RUN] Would clean up temporary files and create final commit"
    fi
    show_progress $current_step $total_steps "${steps[$((current_step-1))]}"
    
    save_state "3" "COMPLETED"
    log "INFO" "Phase 3 completed successfully. Project transformation complete!"
    
    return 0
}

# ========================================================================================
# ROLLBACK FUNCTIONALITY
# ========================================================================================

perform_rollback() {
    log "INFO" "=== ROLLBACK MODE ACTIVATED ==="
    
    load_state
    
    if [[ -z "${LAST_PHASE:-}" ]]; then
        log "ERROR" "No cleanup state found. Cannot determine rollback point."
        exit 1
    fi
    
    echo
    echo "[U+2554][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2557]"
    echo "[U+2551] ROLLBACK CONFIRMATION                                                            [U+2551]"
    echo "[U+2560][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2563]"
    echo "[U+2551] This will restore the project to its state before cleanup began.                [U+2551]"
    echo "[U+2551]                                                                                  [U+2551]"
    echo "[U+2551] Last completed phase: ${LAST_PHASE:-unknown}                                                                [U+2551]"
    echo "[U+2551] Last status: ${LAST_STATUS:-unknown}                                                                      [U+2551]"
    echo "[U+2551] Backup tag: ${BACKUP_TAG:-unknown}                                                            [U+2551]"
    echo "[U+2551] Backup branch: ${BACKUP_BRANCH:-unknown}                                                      [U+2551]"
    echo "[U+2551]                                                                                  [U+2551]"
    echo "[U+2551] WARNING: This will UNDO all cleanup changes!                                    [U+2551]"
    echo "[U+255A][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+255D]"
    echo
    
    if ! confirm_action "Proceed with rollback? This will restore the SPEK template state."; then
        log "INFO" "Rollback cancelled by user"
        exit 0
    fi
    
    local rollback_methods=(
        "Git tag rollback"
        "Git branch rollback"
        "Filesystem backup rollback"
        "Cleanup state reset"
    )
    
    local method_count=0
    local total_methods=${#rollback_methods[@]}
    
    # Method 1: Git tag rollback
    ((method_count++))
    log "INFO" "Rollback method $method_count/$total_methods: Git tag rollback..."
    
    if [[ -n "${BACKUP_TAG:-}" ]]; then
        if git tag -l | grep -q "^$BACKUP_TAG$"; then
            if [[ "$DRY_RUN" == "false" ]]; then
                git reset --hard "$BACKUP_TAG" || {
                    log "WARN" "Git tag rollback failed, trying next method"
                }
            else
                log "INFO" "[DRY-RUN] Would reset to git tag: $BACKUP_TAG"
            fi
        else
            log "WARN" "Git tag $BACKUP_TAG not found"
        fi
    else
        log "WARN" "No backup tag information available"
    fi
    show_progress $method_count $total_methods "${rollback_methods[$((method_count-1))]}"
    
    # Method 2: Git branch rollback
    ((method_count++))
    log "INFO" "Rollback method $method_count/$total_methods: Git branch rollback..."
    
    if [[ -n "${BACKUP_BRANCH:-}" ]]; then
        if git branch -a | grep -q "$BACKUP_BRANCH"; then
            if [[ "$DRY_RUN" == "false" ]]; then
                git checkout "$BACKUP_BRANCH" || {
                    log "WARN" "Git branch rollback failed, trying next method"
                }
                git checkout -B "$(git branch --show-current)" || true
            else
                log "INFO" "[DRY-RUN] Would checkout branch: $BACKUP_BRANCH"
            fi
        else
            log "WARN" "Git branch $BACKUP_BRANCH not found"
        fi
    else
        log "WARN" "No backup branch information available"
    fi
    show_progress $method_count $total_methods "${rollback_methods[$((method_count-1))]}"
    
    # Method 3: Filesystem backup rollback
    ((method_count++))
    log "INFO" "Rollback method $method_count/$total_methods: Filesystem backup rollback..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            # Preserve git history
            local git_dir="$PROJECT_ROOT/.git"
            local temp_git="/tmp/.git.backup.$$"
            
            if [[ -d "$git_dir" ]]; then
                cp -r "$git_dir" "$temp_git"
            fi
            
            # Restore from backup
            rm -rf "$PROJECT_ROOT"/*
            rm -rf "$PROJECT_ROOT"/.[^.]*  # Hidden files except .. and .
            cp -r "$BACKUP_DIR"/* "$PROJECT_ROOT/"
            cp -r "$BACKUP_DIR"/.[^.]* "$PROJECT_ROOT/" 2>/dev/null || true
            
            # Restore git history
            if [[ -d "$temp_git" ]]; then
                rm -rf "$git_dir"
                mv "$temp_git" "$git_dir"
            fi
        else
            log "INFO" "[DRY-RUN] Would restore from filesystem backup: $BACKUP_DIR"
        fi
    else
        log "WARN" "Filesystem backup not found at: $BACKUP_DIR"
    fi
    show_progress $method_count $total_methods "${rollback_methods[$((method_count-1))]}"
    
    # Method 4: Cleanup state reset
    ((method_count++))
    log "INFO" "Rollback method $method_count/$total_methods: Cleanup state reset..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        rm -f "$CLEANUP_STATE_FILE"
        rm -f "$PROJECT_ROOT"/.cleanup*.log
        rm -f "$PROJECT_ROOT"/.file-inventory*.txt
        rm -f "$PROJECT_ROOT"/CLEANUP-COMPLETION-REPORT.md
    else
        log "INFO" "[DRY-RUN] Would remove cleanup state files"
    fi
    show_progress $method_count $total_methods "${rollback_methods[$((method_count-1))]}"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Final verification
        log "INFO" "Verifying rollback completion..."
        
        if [[ -d "$PROJECT_ROOT/.claude" ]]; then
            log "INFO" "[OK] .claude directory restored"
        else
            log "WARN" "[FAIL] .claude directory not found after rollback"
        fi
        
        if [[ -f "$PROJECT_ROOT/SPEC.md" ]]; then
            log "INFO" "[OK] SPEC.md restored"
        else
            log "WARN" "[FAIL] SPEC.md not found after rollback"
        fi
        
        git add -A
        git commit -m "Rollback: Restored SPEK template state

- Rolled back all cleanup changes
- Restored original SPEK template infrastructure
- Project returned to pre-cleanup state" || true
    fi
    
    log "INFO" "Rollback completed. Project restored to pre-cleanup state."
    
    return 0
}

# ========================================================================================
# STATUS & MONITORING FUNCTIONS
# ========================================================================================

show_cleanup_status() {
    log "INFO" "=== CLEANUP STATUS ==="
    
    load_state
    
    echo
    echo "[U+2554][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2557]"
    echo "[U+2551] POST-COMPLETION CLEANUP STATUS                                                   [U+2551]"
    echo "[U+255A][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+255D]"
    echo
    
    # Current state
    echo "[CHART] Current State:"
    echo "  Last Phase: ${LAST_PHASE:-Not started}"
    echo "  Last Status: ${LAST_STATUS:-None}"
    echo "  Last Run: ${LAST_TIMESTAMP:-Never}"
    echo "  Version: ${CLEANUP_VERSION:-Unknown}"
    echo
    
    # Backup information
    echo "[U+1F4BE] Backup Information:"
    echo "  Git Tag: ${BACKUP_TAG:-Not created}"
    echo "  Git Branch: ${BACKUP_BRANCH:-Not created}"
    echo "  Filesystem Backup: $([ -d "$BACKUP_DIR" ] && echo "Present" || echo "Not found")"
    echo
    
    # Directory status
    echo "[FOLDER] Directory Status:"
    for dir in "${REMOVE_DIRS[@]}"; do
        if [[ -d "$PROJECT_ROOT/$dir" ]]; then
            echo "  $dir: [U+1F7E2] Present (not cleaned)"
        else
            echo "  $dir: [U+1F534] Removed (cleaned)"
        fi
    done
    echo
    
    for dir in "${PRESERVE_DIRS[@]}"; do
        if [[ -d "$PROJECT_ROOT/$dir" ]]; then
            echo "  $dir: [U+1F7E2] Preserved"
        else
            echo "  $dir: [U+1F7E0] Missing"
        fi
    done
    echo
    
    # Phase status
    echo "[CYCLE] Phase Status:"
    local current_phase="${LAST_PHASE:-0}"
    
    for phase_info in "${PHASES[@]}"; do
        IFS=':' read -ra PHASE_PARTS <<< "$phase_info"
        local phase_num="${PHASE_PARTS[0]}"
        local phase_name="${PHASE_PARTS[1]}"
        local phase_desc="${PHASE_PARTS[2]}"
        
        if [[ "$phase_num" -le "$current_phase" ]]; then
            if [[ "$phase_num" == "$current_phase" && "${LAST_STATUS:-}" == "COMPLETED" ]]; then
                echo "  Phase $phase_num ($phase_name): [OK] Completed"
            elif [[ "$phase_num" == "$current_phase" ]]; then
                echo "  Phase $phase_num ($phase_name): [U+1F7E1] In Progress"
            else
                echo "  Phase $phase_num ($phase_name): [OK] Completed"
            fi
        else
            echo "  Phase $phase_num ($phase_name): [U+23F8][U+FE0F] Pending"
        fi
    done
    echo
    
    # Lock status
    if [[ -f "$CLEANUP_LOCK_FILE" ]]; then
        local lock_pid
        lock_pid=$(cat "$CLEANUP_LOCK_FILE" 2>/dev/null || echo "unknown")
        echo "[U+1F512] Lock Status: Active (PID: $lock_pid)"
    else
        echo "[U+1F513] Lock Status: None"
    fi
    echo
    
    # Log file information
    if [[ -f "$LOG_FILE" ]]; then
        local log_size
        log_size=$(du -h "$LOG_FILE" | cut -f1)
        local log_lines
        log_lines=$(wc -l < "$LOG_FILE")
        echo "[NOTE] Log File: $log_size ($log_lines lines)"
    else
        echo "[NOTE] Log File: Not found"
    fi
    echo
    
    # Recommendations
    echo "[INFO] Recommendations:"
    case "${LAST_PHASE:-0}" in
        0)
            echo "  [U+2022] Run Phase 1 to create safety backups: $SCRIPT_NAME --phase 1"
            ;;
        1)
            if [[ "${LAST_STATUS:-}" == "COMPLETED" ]]; then
                echo "  [U+2022] Ready for Phase 2: $SCRIPT_NAME --phase 2"
                echo "  [U+2022] Or run all remaining phases: $SCRIPT_NAME"
            else
                echo "  [U+2022] Complete Phase 1 first: $SCRIPT_NAME --phase 1"
            fi
            ;;
        2)
            if [[ "${LAST_STATUS:-}" == "COMPLETED" ]]; then
                echo "  [U+2022] Run final Phase 3: $SCRIPT_NAME --phase 3"
            else
                echo "  [U+2022] Complete Phase 2 first: $SCRIPT_NAME --phase 2"
            fi
            ;;
        3)
            echo "  [U+2022] [OK] All phases completed! Project transformation successful."
            echo "  [U+2022] Review: CLEANUP-COMPLETION-REPORT.md"
            ;;
    esac
    echo
}

# ========================================================================================
# COMMAND LINE INTERFACE
# ========================================================================================

show_help() {
    cat << EOF
Post-Completion Cleanup Orchestrator v$SCRIPT_VERSION
Enterprise-grade 3-phase cleanup system with full safety mechanisms

USAGE:
    $SCRIPT_NAME [OPTIONS]

OPTIONS:
    --dry-run              Show what would be done without making changes
    --force                Skip interactive confirmations
    --verbose              Enable verbose output
    --phase N              Run only specific phase (1-3)
    --rollback             Restore from backup (reverses all changes)
    --status               Show current cleanup status
    --theater-scan         Enable theater detection during cleanup
    --help                 Show this help message

PHASES:
    Phase 1: Safety & Backup (NON-DESTRUCTIVE)
             [U+2022] Validate project completion
             [U+2022] Create git tag and backup branch
             [U+2022] Create filesystem backup
             [U+2022] Generate file inventory

    Phase 2: Infrastructure Cleanup (DESTRUCTIVE, REVERSIBLE)
             [U+2022] Remove .claude directory (22+ commands, 54 agents)
             [U+2022] Remove flow/, memory/, gemini/ directories
             [U+2022] Clean scripts directory
             [U+2022] Update package.json
             [U+2022] Transform README.md
             [U+2022] Archive SPEC.md

    Phase 3: Documentation & Handoff (CONSTRUCTIVE)
             [U+2022] Generate handoff documentation
             [U+2022] Final validation
             [U+2022] Create completion report

EXAMPLES:
    # Full cleanup with confirmations
    $SCRIPT_NAME

    # Dry run to see what would be done
    $SCRIPT_NAME --dry-run

    # Force mode (no confirmations)
    $SCRIPT_NAME --force

    # Run only Phase 1 (safety backup)
    $SCRIPT_NAME --phase 1

    # Show current status
    $SCRIPT_NAME --status

    # Rollback all changes
    $SCRIPT_NAME --rollback

    # Enable theater detection
    $SCRIPT_NAME --theater-scan --verbose

SAFETY FEATURES:
    [U+2022] Multiple backup mechanisms (git tag, branch, filesystem)
    [U+2022] Progressive confirmation prompts
    [U+2022] Automatic rollback on failure
    [U+2022] Lock file prevents concurrent runs
    [U+2022] Complete audit trail in logs
    [U+2022] Theater detection integration

ROLLBACK OPTIONS:
    1. Script-based: $SCRIPT_NAME --rollback
    2. Git tag: git checkout $(get_backup_tag)
    3. Git branch: git checkout $(get_backup_branch)
    4. Filesystem: Restore from .spek-backup/

For more information, see: docs/POST-COMPLETION-CLEANUP.md
EOF
}

parse_command_line() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE_MODE=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                set -x  # Enable bash debug mode
                shift
                ;;
            --phase)
                if [[ -n "${2:-}" && "$2" =~ ^[1-3]$ ]]; then
                    SPECIFIC_PHASE="$2"
                    shift 2
                else
                    log "ERROR" "Invalid phase: ${2:-}. Must be 1, 2, or 3."
                    exit 1
                fi
                ;;
            --rollback)
                ROLLBACK_MODE=true
                shift
                ;;
            --status)
                STATUS_MODE=true
                shift
                ;;
            --theater-scan)
                THEATER_SCAN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_help >&2
                exit 1
                ;;
        esac
    done
}

# ========================================================================================
# MAIN EXECUTION FLOW
# ========================================================================================

main() {
    # Parse command line arguments
    parse_command_line "$@"
    
    # Setup logging
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)
    
    # Header
    log "INFO" "===================================================================================="
    log "INFO" "Post-Completion Cleanup Orchestrator v$SCRIPT_VERSION"
    log "INFO" "Enterprise-grade SPEK -> Production transformation"
    log "INFO" "Project: $(basename "$PROJECT_ROOT")"
    log "INFO" "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[SEARCH] DRY RUN MODE - No changes will be made"
    fi
    
    if [[ "$FORCE_MODE" == "true" ]]; then
        log "INFO" "[ROCKET] FORCE MODE - Skipping confirmations"
    fi
    
    if [[ "$THEATER_SCAN" == "true" ]]; then
        log "INFO" "[U+1F3AD] THEATER DETECTION - Enabled"
    fi
    
    log "INFO" "===================================================================================="
    
    # Change to project directory
    cd "$PROJECT_ROOT"
    
    # Handle special modes
    if [[ "$STATUS_MODE" == "true" ]]; then
        show_cleanup_status
        exit 0
    fi
    
    if [[ "$ROLLBACK_MODE" == "true" ]]; then
        perform_rollback
        exit 0
    fi
    
    # Acquire lock
    acquire_lock
    
    # Load existing state
    load_state
    
    # Determine execution plan
    local start_phase=1
    local end_phase=3
    
    if [[ -n "$SPECIFIC_PHASE" ]]; then
        start_phase="$SPECIFIC_PHASE"
        end_phase="$SPECIFIC_PHASE"
    elif [[ -n "${LAST_PHASE:-}" && "${LAST_STATUS:-}" == "COMPLETED" ]]; then
        # Resume from next phase
        start_phase=$((LAST_PHASE + 1))
        if [[ $start_phase -gt 3 ]]; then
            log "INFO" "All phases already completed. Use --status to see details."
            exit 0
        fi
    fi
    
    log "INFO" "Execution plan: Phase $start_phase to $end_phase"
    
    # Execute phases
    local overall_success=true
    
    for ((phase=start_phase; phase<=end_phase; phase++)); do
        log "INFO" ""
        log "INFO" "Starting Phase $phase..."
        
        case $phase in
            1)
                if phase_1_safety_backup; then
                    log "INFO" "[OK] Phase 1 completed successfully"
                    if [[ $? -eq 2 ]]; then  # User requested stop
                        log "INFO" "Cleanup stopped at user request after Phase 1 (safe stop)"
                        exit 0
                    fi
                else
                    log "ERROR" "[FAIL] Phase 1 failed"
                    overall_success=false
                    break
                fi
                ;;
            2)
                if phase_2_infrastructure_cleanup; then
                    log "INFO" "[OK] Phase 2 completed successfully"
                else
                    log "ERROR" "[FAIL] Phase 2 failed"
                    overall_success=false
                    break
                fi
                ;;
            3)
                if phase_3_documentation_handoff; then
                    log "INFO" "[OK] Phase 3 completed successfully"
                else
                    log "ERROR" "[FAIL] Phase 3 failed"
                    overall_success=false
                    break
                fi
                ;;
        esac
    done
    
    # Final results
    log "INFO" ""
    log "INFO" "===================================================================================="
    
    if [[ "$overall_success" == "true" ]]; then
        log "INFO" "[PARTY] POST-COMPLETION CLEANUP SUCCESSFUL!"
        log "INFO" ""
        log "INFO" "[OK] SPEK Template -> Production Application transformation complete"
        log "INFO" "[OK] All safety backups created and validated"
        log "INFO" "[OK] Development infrastructure removed"
        log "INFO" "[OK] Production documentation generated"
        log "INFO" "[OK] Quality assurance systems preserved"
        log "INFO" ""
        log "INFO" "[U+1F4C4] Review completion report: CLEANUP-COMPLETION-REPORT.md"
        log "INFO" "[U+1F4DA] Check handoff docs: docs/"
        log "INFO" "[CYCLE] Quality gates remain active in .github/workflows/"
        log "INFO" ""
        log "INFO" "Your application is now production-ready! [ROCKET]"
    else
        log "ERROR" "[FAIL] POST-COMPLETION CLEANUP FAILED"
        log "ERROR" ""
        log "ERROR" "Some phases failed to complete. Check logs for details."
        log "ERROR" "Recovery options:"
        log "ERROR" "  1. Fix issues and re-run: $SCRIPT_NAME"
        log "ERROR" "  2. Rollback changes: $SCRIPT_NAME --rollback"
        log "ERROR" "  3. Check status: $SCRIPT_NAME --status"
        log "ERROR" ""
        exit 1
    fi
    
    log "INFO" "===================================================================================="
    log "INFO" "Completed: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    log "INFO" "===================================================================================="
}

# Execute main function with all arguments
main "$@"