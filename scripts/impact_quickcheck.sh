#!/bin/bash

# Impact Quickcheck - Validate Gemini impact maps against code reality
# CF v2 Alpha integration for impact validation

set -euo pipefail

ARTIFACTS_DIR=".claude/.artifacts"
GEMINI_DIR="$ARTIFACTS_DIR/gemini"

# Create directories
mkdir -p "$ARTIFACTS_DIR" "$GEMINI_DIR"

# Log function
log() {
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): $*" | tee -a "$ARTIFACTS_DIR/impact_quickcheck.log"
}

# Grep-based caller analysis
analyze_callers() {
    local target_function="$1"
    local target_file="${2:-}"
    
    log "🔍 Analyzing callers for: $target_function"
    
    local callers=()
    
    # Search for function calls across codebase
    while IFS=: read -r file line content; do
        # Skip comments and strings (basic heuristic)
        if echo "$content" | grep -qE '^\s*(//|#|\*|/\*)'; then
            continue
        fi
        
        # Extract calling context
        local caller_function=$(grep -B5 "$line" "$file" 2>/dev/null | grep -E '(function|def|class|const|let|var).*=' | tail -1 | sed 's/.*[[:space:]]\([a-zA-Z_][a-zA-Z0-9_]*\).*/\1/' || echo "unknown")
        
        callers+=("{\"file\":\"$file\",\"line\":$line,\"caller\":\"$caller_function\",\"context\":\"${content//\"/\\\"}\"}")
        
    done < <(grep -rn "\b$target_function\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null | head -50)
    
    # Format as JSON array
    local callers_json=$(printf '%s\n' "${callers[@]}" | jq -s '.')
    echo "$callers_json"
}

# Type-based dependency mapping
analyze_dependencies() {
    local target_file="$1"
    
    log "🔗 Analyzing dependencies for: $target_file"
    
    local imports=()
    local exports=()
    
    if [[ -f "$target_file" ]]; then
        # Extract imports
        while IFS= read -r line; do
            if echo "$line" | grep -qE '^import.*from'; then
                local import_source=$(echo "$line" | sed -n "s/.*from ['\"]([^'\"]*)['\"].*/\1/p")
                local import_names=$(echo "$line" | sed -n 's/import {\([^}]*\)}.*/\1/p' | tr ',' '\n' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
                
                if [[ -n "$import_source" ]]; then
                    imports+=("{\"source\":\"$import_source\",\"names\":\"$import_names\"}")
                fi
            fi
        done < "$target_file"
        
        # Extract exports
        while IFS= read -r line; do
            if echo "$line" | grep -qE '^export'; then
                local export_type="function"
                if echo "$line" | grep -q "class"; then export_type="class"; fi
                if echo "$line" | grep -q "const\|let\|var"; then export_type="variable"; fi
                
                local export_name=$(echo "$line" | sed -n 's/export.*[[:space:]]\([a-zA-Z_][a-zA-Z0-9_]*\).*/\1/p')
                if [[ -n "$export_name" ]]; then
                    exports+=("{\"name\":\"$export_name\",\"type\":\"$export_type\"}")
                fi
            fi
        done < "$target_file"
    fi
    
    # Format as JSON
    local imports_json=$(printf '%s\n' "${imports[@]}" | jq -s '.' 2>/dev/null || echo '[]')
    local exports_json=$(printf '%s\n' "${exports[@]}" | jq -s '.' 2>/dev/null || echo '[]')
    
    jq -n --argjson imports "$imports_json" --argjson exports "$exports_json" \
        '{imports: $imports, exports: $exports}'
}

# Configuration hotspot detection
detect_config_hotspots() {
    local pattern="${1:-config}"
    
    log "⚙️  Detecting configuration hotspots for: $pattern"
    
    local configs=()
    
    # Search configuration files and patterns
    while IFS=: read -r file line content; do
        # Determine config type
        local config_type="unknown"
        case "$file" in
            *.json) config_type="json" ;;
            *.yaml|*.yml) config_type="yaml" ;;
            *.env*) config_type="env" ;;
            *.config.*) config_type="config" ;;
            *) 
                if echo "$content" | grep -qE "(process\.env|CONFIG|settings)"; then
                    config_type="runtime"
                fi
                ;;
        esac
        
        configs+=("{\"file\":\"$file\",\"line\":$line,\"type\":\"$config_type\",\"content\":\"${content//\"/\\\"}\"}")
        
    done < <(grep -rn -i "$pattern" --include="*.json" --include="*.yaml" --include="*.yml" --include="*.env*" --include="*.config.*" --include="*.ts" --include="*.js" . 2>/dev/null | head -20)
    
    # Format as JSON array
    printf '%s\n' "${configs[@]}" | jq -s '.'
}

# Validate Gemini impact map against reality
validate_impact_map() {
    local impact_file="$1"
    
    if [[ ! -f "$impact_file" ]]; then
        log "❌ Impact file not found: $impact_file"
        echo '{"valid": false, "error": "Impact file not found"}'
        return 1
    fi
    
    log "✅ Validating impact map: $impact_file"
    
    local impact_data=$(cat "$impact_file")
    local validation_results=()
    
    # Validate hotspots
    local hotspots=$(echo "$impact_data" | jq -r '.hotspots[]?' 2>/dev/null || echo "")
    for hotspot in $hotspots; do
        if [[ -f "$hotspot" ]]; then
            validation_results+=("{\"type\":\"hotspot\",\"file\":\"$hotspot\",\"exists\":true}")
        else
            validation_results+=("{\"type\":\"hotspot\",\"file\":\"$hotspot\",\"exists\":false}")
            log "⚠️  Hotspot file missing: $hotspot"
        fi
    done
    
    # Cross-check callers
    local callers=$(echo "$impact_data" | jq -r '.callers[]?' 2>/dev/null || echo "")
    for caller in $callers; do
        local real_callers=$(analyze_callers "$caller" | jq length)
        validation_results+=("{\"type\":\"caller\",\"function\":\"$caller\",\"found_calls\":$real_callers}")
        
        if [[ $real_callers -eq 0 ]]; then
            log "⚠️  No callers found for: $caller"
        fi
    done
    
    # Validate configs
    local configs=$(echo "$impact_data" | jq -r '.configs[]?' 2>/dev/null || echo "")
    for config in $configs; do
        local real_configs=$(detect_config_hotspots "$config" | jq length)
        validation_results+=("{\"type\":\"config\",\"pattern\":\"$config\",\"found_refs\":$real_configs}")
    done
    
    # Generate validation summary
    local validation_json=$(printf '%s\n' "${validation_results[@]}" | jq -s '.')
    local missing_hotspots=$(echo "$validation_json" | jq '[.[] | select(.type=="hotspot" and .exists==false)] | length')
    local missing_callers=$(echo "$validation_json" | jq '[.[] | select(.type=="caller" and .found_calls==0)] | length')
    
    local is_valid=true
    if [[ $missing_hotspots -gt 0 ]] || [[ $missing_callers -gt 2 ]]; then
        is_valid=false
        log "❌ Impact map validation failed - missing files or excessive caller misses"
    else
        log "✅ Impact map validation passed"
    fi
    
    jq -n --argjson results "$validation_json" \
          --argjson valid "$is_valid" \
          --argjson missing_hotspots "$missing_hotspots" \
          --argjson missing_callers "$missing_callers" \
          '{valid: $valid, missing_hotspots: $missing_hotspots, missing_callers: $missing_callers, details: $results}'
}

# Quick impact check for Context7 validation
quick_impact_check() {
    local target="${1:-}"
    
    if [[ -z "$target" ]]; then
        log "❌ No target specified for quick check"
        return 1
    fi
    
    log "⚡ Quick impact check for: $target"
    
    local results="{}"
    
    # If it's a file, analyze it directly
    if [[ -f "$target" ]]; then
        local deps=$(analyze_dependencies "$target")
        local base_name=$(basename "$target" .ts .js .tsx .jsx)
        local callers=$(analyze_callers "$base_name")
        
        results=$(jq -n --argjson deps "$deps" --argjson callers "$callers" \
                     '{file: $ARGS.positional[0], dependencies: $deps, callers: $callers}' \
                     --args "$target")
    else
        # Treat as function/pattern search
        local callers=$(analyze_callers "$target")
        local configs=$(detect_config_hotspots "$target")
        
        results=$(jq -n --argjson callers "$callers" --argjson configs "$configs" \
                     '{pattern: $ARGS.positional[0], callers: $callers, configs: $configs}' \
                     --args "$target")
    fi
    
    echo "$results"
}

# Generate comprehensive impact report
generate_impact_report() {
    local target="${1:-}"
    local output_file="$ARTIFACTS_DIR/impact_quickcheck_report.json"
    
    log "📊 Generating comprehensive impact report..."
    
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local quick_check=$(quick_impact_check "$target")
    
    # Include git blame for context
    local git_context="{}"
    if [[ -f "$target" ]]; then
        local recent_commits=$(git log --oneline -n 5 "$target" 2>/dev/null | jq -R . | jq -s . || echo '[]')
        local contributors=$(git shortlog -sn "$target" 2>/dev/null | head -5 | awk '{print $2" "$3}' | jq -R . | jq -s . || echo '[]')
        
        git_context=$(jq -n --argjson commits "$recent_commits" --argjson contributors "$contributors" \
                         '{recent_commits: $commits, contributors: $contributors}')
    fi
    
    # Combine all analysis
    local report=$(jq -n --arg timestamp "$timestamp" \
                        --arg target "$target" \
                        --argjson quick_check "$quick_check" \
                        --argjson git_context "$git_context" \
                        '{
                            timestamp: $timestamp,
                            target: $target,
                            analysis: $quick_check,
                            git_context: $git_context,
                            recommendations: {
                                context7_files: [],
                                test_focus: [],
                                risk_level: "medium"
                            }
                        }')
    
    # Save report
    echo "$report" > "$output_file"
    log "✅ Impact report saved: $output_file"
    
    echo "$report"
}

# Main command routing
case "${1:-help}" in
    validate)
        validate_impact_map "${2:-$GEMINI_DIR/impact.json}"
        ;;
    quick-check)
        quick_impact_check "${2:-}"
        ;;
    callers)
        analyze_callers "${2:-}" "${3:-}"
        ;;
    deps)
        analyze_dependencies "${2:-}"
        ;;
    configs)
        detect_config_hotspots "${2:-config}"
        ;;
    report)
        generate_impact_report "${2:-}"
        ;;
    *)
        echo "Usage: $0 {validate|quick-check|callers|deps|configs|report} [args...]"
        echo ""
        echo "Commands:"
        echo "  validate <impact.json>     - Validate Gemini impact map against code"
        echo "  quick-check <target>       - Quick impact analysis for file/function"
        echo "  callers <function> [file]  - Find all callers of function"
        echo "  deps <file>                - Analyze file dependencies (imports/exports)"
        echo "  configs <pattern>          - Find configuration references"
        echo "  report <target>            - Generate comprehensive impact report"
        echo ""
        echo "Examples:"
        echo "  $0 validate .claude/.artifacts/gemini/impact.json"
        echo "  $0 quick-check src/user-service.ts"
        echo "  $0 callers calculateTotal src/billing.ts"
        echo "  $0 configs DATABASE"
        exit 1
        ;;
esac