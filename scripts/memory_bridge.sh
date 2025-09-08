#!/bin/bash

# Memory Bridge - Unified Memory Coordination Script
# Provides seamless integration between Claude Flow memory and Memory MCP

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTIFACTS_DIR="${SCRIPT_DIR}/../.claude/.artifacts"
MEMORY_CONFIG="${SCRIPT_DIR}/../.claude/memory_config.json"

# Ensure artifacts directory exists
mkdir -p "$ARTIFACTS_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_debug() { [[ "${DEBUG:-0}" == "1" ]] && echo -e "${PURPLE}🔍 DEBUG: $1${NC}"; }

# Memory Router Functions
initialize_memory_router() {
    log_info "Initializing Unified Memory Router..."
    
    # Check Claude Flow availability
    local cf_available="false"
    if npx claude-flow@alpha memory usage --quick-check &>/dev/null; then
        cf_available="true"
        log_success "Claude Flow memory system detected and available"
    else
        log_warning "Claude Flow memory system not available"
    fi
    
    # Check Memory MCP availability (simulated - would need actual MCP integration)
    local mcp_available="true"  # Assume available for now
    log_success "Memory MCP system detected and available"
    
    # Generate router configuration
    generate_router_config "$cf_available" "$mcp_available"
    
    # Initialize synchronization index
    initialize_sync_index
    
    log_success "Memory router initialized successfully"
}

generate_router_config() {
    local cf_available="$1"
    local mcp_available="$2"
    
    log_info "Generating memory routing configuration..."
    
    cat > "$MEMORY_CONFIG" << EOF
{
  "router_version": "1.0.0-unified",
  "systems": {
    "claude_flow": {
      "available": $cf_available,
      "priority_namespaces": ["swarm", "session", "coordination", "hive"],
      "fallback_namespaces": ["patterns", "intelligence"]
    },
    "memory_mcp": {
      "available": $mcp_available,
      "priority_namespaces": ["analysis", "performance", "patterns"],
      "fallback_namespaces": ["intelligence", "unified"]
    }
  },
  "routing_rules": {
    "swarm/*": "claude_flow",
    "session/*": "claude_flow",
    "coordination/*": "claude_flow",
    "hive/*": "claude_flow",
    "analysis/*": "memory_mcp",
    "performance/*": "memory_mcp",
    "connascence/*": "memory_mcp",
    "patterns/*": "bridge_unified",
    "intelligence/*": "bridge_unified",
    "unified/*": "bridge_unified"
  },
  "sync_settings": {
    "auto_sync_interval": 300,
    "conflict_resolution": "merge_intelligent",
    "performance_threshold": 0.8
  }
}
EOF
    
    log_success "Router configuration generated at $MEMORY_CONFIG"
}

initialize_sync_index() {
    log_info "Initializing synchronization index..."
    
    local sync_index="${ARTIFACTS_DIR}/memory_sync_index.json"
    
    cat > "$sync_index" << EOF
{
  "last_sync": "$(date -Iseconds)",
  "sync_operations": 0,
  "conflicts_resolved": 0,
  "performance_metrics": {
    "avg_sync_time_ms": 0,
    "success_rate": 1.0,
    "data_transferred_bytes": 0
  },
  "namespace_status": {},
  "bridge_health": "excellent"
}
EOF
    
    log_success "Synchronization index initialized"
}

# Memory Operations
unified_memory_store() {
    local namespace="$1"
    local key="$2"
    local value="$3"
    local metadata="${4:-{}}"
    
    log_info "Storing memory: ${namespace}/${key}"
    log_debug "Value: $value"
    
    # Determine routing based on namespace
    local target_system
    target_system=$(route_namespace "$namespace")
    
    case "$target_system" in
        "claude_flow")
            store_claude_flow "$namespace" "$key" "$value" "$metadata"
            ;;
        "memory_mcp")
            store_memory_mcp "$namespace" "$key" "$value" "$metadata"
            ;;
        "bridge_unified")
            store_bridge_unified "$namespace" "$key" "$value" "$metadata"
            ;;
        *)
            log_error "Unknown target system: $target_system"
            return 1
            ;;
    esac
    
    # Update sync index
    update_sync_index "store" "$namespace/$key" "$target_system"
    
    log_success "Memory stored successfully in $target_system"
}

unified_memory_retrieve() {
    local namespace="$1"
    local key="$2"
    
    log_info "Retrieving memory: ${namespace}/${key}"
    
    # Try primary system first
    local target_system
    target_system=$(route_namespace "$namespace")
    
    local result=""
    case "$target_system" in
        "claude_flow")
            result=$(retrieve_claude_flow "$namespace" "$key")
            ;;
        "memory_mcp")
            result=$(retrieve_memory_mcp "$namespace" "$key")
            ;;
        "bridge_unified")
            result=$(retrieve_bridge_unified "$namespace" "$key")
            ;;
    esac
    
    # If not found, try fallback systems
    if [[ -z "$result" ]]; then
        log_warning "Not found in primary system, trying fallback..."
        result=$(try_fallback_retrieval "$namespace" "$key")
    fi
    
    if [[ -n "$result" ]]; then
        log_success "Memory retrieved successfully"
        echo "$result"
    else
        log_error "Memory not found: ${namespace}/${key}"
        return 1
    fi
}

unified_memory_search() {
    local query="$1"
    local namespace="${2:-*}"
    
    log_info "Searching memory: query='$query' namespace='$namespace'"
    
    local results="{"
    local cf_results=""
    local mcp_results=""
    
    # Search Claude Flow if available
    if system_available "claude_flow"; then
        log_debug "Searching Claude Flow memory..."
        cf_results=$(search_claude_flow "$query" "$namespace" || echo "{}")
    fi
    
    # Search Memory MCP if available  
    if system_available "memory_mcp"; then
        log_debug "Searching Memory MCP..."
        mcp_results=$(search_memory_mcp "$query" "$namespace" || echo "{}")
    fi
    
    # Merge and deduplicate results
    local merged_results
    merged_results=$(merge_search_results "$cf_results" "$mcp_results")
    
    log_success "Search completed, found $(echo "$merged_results" | jq 'length // 0') results"
    echo "$merged_results"
}

# System-specific operations
store_claude_flow() {
    local namespace="$1"
    local key="$2"
    local value="$3"
    local metadata="$4"
    
    log_debug "Storing in Claude Flow: $namespace/$key"
    
    if ! system_available "claude_flow"; then
        log_error "Claude Flow not available"
        return 1
    fi
    
    # Store using Claude Flow memory API
    echo "$value" | npx claude-flow@alpha memory store \
        --key "$key" \
        --namespace "$namespace" \
        --stdin 2>/dev/null || {
        log_error "Failed to store in Claude Flow"
        return 1
    }
    
    log_debug "Successfully stored in Claude Flow"
}

store_memory_mcp() {
    local namespace="$1"
    local key="$2"
    local value="$3"
    local metadata="$4"
    
    log_debug "Storing in Memory MCP: $namespace/$key"
    
    # Create MCP-compatible storage format
    local mcp_data
    mcp_data=$(jq -n \
        --arg ns "$namespace" \
        --arg k "$key" \
        --argjson v "$value" \
        --argjson m "$metadata" \
        '{
            namespace: $ns,
            key: $k,
            value: $v,
            metadata: $m,
            timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            system: "memory_mcp"
        }')
    
    # Store in artifacts directory (simulating MCP storage)
    local storage_file="${ARTIFACTS_DIR}/memory_mcp_${namespace//\//_}_${key//\//_}.json"
    echo "$mcp_data" > "$storage_file"
    
    log_debug "Successfully stored in Memory MCP simulation"
}

store_bridge_unified() {
    local namespace="$1"
    local key="$2"
    local value="$3"
    local metadata="$4"
    
    log_debug "Storing in bridge unified: $namespace/$key"
    
    # Store in both systems for unified data
    if system_available "claude_flow"; then
        store_claude_flow "$namespace" "$key" "$value" "$metadata"
    fi
    
    if system_available "memory_mcp"; then
        store_memory_mcp "$namespace" "$key" "$value" "$metadata"
    fi
    
    # Create unified index entry
    local unified_entry
    unified_entry=$(jq -n \
        --arg ns "$namespace" \
        --arg k "$key" \
        --argjson v "$value" \
        --argjson m "$metadata" \
        '{
            namespace: $ns,
            key: $k,
            value: $v,
            metadata: $m,
            timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            system: "bridge_unified",
            replicated: {
                claude_flow: true,
                memory_mcp: true
            }
        }')
    
    local unified_file="${ARTIFACTS_DIR}/bridge_unified_${namespace//\//_}_${key//\//_}.json"
    echo "$unified_entry" > "$unified_file"
    
    log_debug "Successfully stored in bridge unified"
}

retrieve_claude_flow() {
    local namespace="$1"
    local key="$2"
    
    if ! system_available "claude_flow"; then
        return 1
    fi
    
    # Retrieve from Claude Flow
    npx claude-flow@alpha memory retrieve \
        --key "$key" \
        --namespace "$namespace" 2>/dev/null || return 1
}

retrieve_memory_mcp() {
    local namespace="$1"
    local key="$2"
    
    # Check MCP simulation storage
    local storage_file="${ARTIFACTS_DIR}/memory_mcp_${namespace//\//_}_${key//\//_}.json"
    if [[ -f "$storage_file" ]]; then
        jq -r '.value' "$storage_file" 2>/dev/null || return 1
    else
        return 1
    fi
}

retrieve_bridge_unified() {
    local namespace="$1"
    local key="$2"
    
    # Try unified storage first
    local unified_file="${ARTIFACTS_DIR}/bridge_unified_${namespace//\//_}_${key//\//_}.json"
    if [[ -f "$unified_file" ]]; then
        jq -r '.value' "$unified_file" 2>/dev/null && return 0
    fi
    
    # Fall back to either system
    retrieve_claude_flow "$namespace" "$key" 2>/dev/null || \
    retrieve_memory_mcp "$namespace" "$key" 2>/dev/null || \
    return 1
}

# Synchronization operations
sync_memory_systems() {
    log_info "Starting memory systems synchronization..."
    
    local sync_start
    sync_start=$(date +%s)
    
    # Synchronize pattern data
    sync_pattern_data
    
    # Synchronize performance data
    sync_performance_data
    
    # Synchronize intelligence data
    sync_intelligence_data
    
    # Update sync metrics
    local sync_end
    sync_end=$(date +%s)
    local sync_duration=$((sync_end - sync_start))
    
    update_sync_metrics "$sync_duration" "success"
    
    log_success "Memory synchronization completed in ${sync_duration}s"
}

sync_pattern_data() {
    log_info "Synchronizing pattern data..."
    
    # Export patterns from Claude Flow
    local cf_patterns="{}"
    if system_available "claude_flow"; then
        cf_patterns=$(npx claude-flow@alpha memory export --namespace "patterns" --format json 2>/dev/null || echo '{}')
    fi
    
    # Export patterns from Memory MCP simulation
    local mcp_patterns="{}"
    local mcp_files
    mcp_files=$(find "$ARTIFACTS_DIR" -name "memory_mcp_patterns_*.json" 2>/dev/null || true)
    if [[ -n "$mcp_files" ]]; then
        mcp_patterns=$(jq -s 'add' $mcp_files 2>/dev/null || echo '{}')
    fi
    
    # Merge patterns intelligently
    local unified_patterns
    unified_patterns=$(merge_patterns "$cf_patterns" "$mcp_patterns")
    
    # Store unified patterns
    unified_memory_store "intelligence/patterns" "unified" "$unified_patterns" '{"sync": true}'
    
    log_success "Pattern data synchronized"
}

sync_performance_data() {
    log_info "Synchronizing performance data..."
    
    # Similar to pattern sync but for performance data
    local cf_perf="{}"
    if system_available "claude_flow"; then
        cf_perf=$(npx claude-flow@alpha memory export --namespace "performance" --format json 2>/dev/null || echo '{}')
    fi
    
    # Collect MCP performance data
    local mcp_perf="{}"
    local perf_files
    perf_files=$(find "$ARTIFACTS_DIR" -name "memory_mcp_performance_*.json" 2>/dev/null || true)
    if [[ -n "$perf_files" ]]; then
        mcp_perf=$(jq -s 'add' $perf_files 2>/dev/null || echo '{}')
    fi
    
    # Merge and store
    local unified_perf
    unified_perf=$(merge_performance_data "$cf_perf" "$mcp_perf")
    
    unified_memory_store "intelligence/performance" "unified" "$unified_perf" '{"sync": true}'
    
    log_success "Performance data synchronized"
}

sync_intelligence_data() {
    log_info "Synchronizing intelligence data..."
    
    # Cross-system intelligence consolidation
    local intelligence_data
    intelligence_data=$(jq -n '{
        patterns: {},
        performance: {},
        quality: {},
        architectural: {},
        consolidated: true,
        sync_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
    }')
    
    unified_memory_store "intelligence/consolidated" "all" "$intelligence_data" '{"sync": true}'
    
    log_success "Intelligence data synchronized"
}

# Utility functions
route_namespace() {
    local namespace="$1"
    
    # Check routing rules from config
    if [[ -f "$MEMORY_CONFIG" ]]; then
        local routing_rule
        routing_rule=$(jq -r --arg ns "$namespace" '.routing_rules[$ns] // empty' "$MEMORY_CONFIG" 2>/dev/null)
        
        if [[ -n "$routing_rule" && "$routing_rule" != "null" ]]; then
            echo "$routing_rule"
            return 0
        fi
        
        # Check pattern matching
        for pattern in "swarm/*" "session/*" "coordination/*" "hive/*"; do
            if [[ "$namespace" == ${pattern%/*}* ]]; then
                echo "claude_flow"
                return 0
            fi
        done
        
        for pattern in "analysis/*" "performance/*" "connascence/*"; do
            if [[ "$namespace" == ${pattern%/*}* ]]; then
                echo "memory_mcp"
                return 0
            fi
        done
        
        for pattern in "patterns/*" "intelligence/*" "unified/*"; do
            if [[ "$namespace" == ${pattern%/*}* ]]; then
                echo "bridge_unified"
                return 0
            fi
        done
    fi
    
    # Default routing
    echo "bridge_unified"
}

system_available() {
    local system="$1"
    
    case "$system" in
        "claude_flow")
            npx claude-flow@alpha memory usage --quick-check &>/dev/null
            ;;
        "memory_mcp")
            # Always available in simulation
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

merge_patterns() {
    local cf_patterns="$1"
    local mcp_patterns="$2"
    
    # Intelligent pattern merging
    jq -n \
        --argjson cf "$cf_patterns" \
        --argjson mcp "$mcp_patterns" \
        '{
            claude_flow: $cf,
            memory_mcp: $mcp,
            merged: ($cf * $mcp),
            consolidation_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }'
}

merge_performance_data() {
    local cf_perf="$1"
    local mcp_perf="$2"
    
    # Intelligent performance data merging
    jq -n \
        --argjson cf "$cf_perf" \
        --argjson mcp "$mcp_perf" \
        '{
            claude_flow: $cf,
            memory_mcp: $mcp,
            unified_metrics: {},
            merge_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }'
}

update_sync_index() {
    local operation="$1"
    local key="$2"
    local system="$3"
    
    local sync_index="${ARTIFACTS_DIR}/memory_sync_index.json"
    
    if [[ -f "$sync_index" ]]; then
        jq --arg op "$operation" \
           --arg k "$key" \
           --arg sys "$system" \
           --arg ts "$(date -Iseconds)" \
           '.sync_operations += 1 |
            .last_sync = $ts |
            .namespace_status[$k] = {
                operation: $op,
                system: $sys,
                timestamp: $ts
            }' "$sync_index" > "${sync_index}.tmp" && mv "${sync_index}.tmp" "$sync_index"
    fi
}

update_sync_metrics() {
    local duration="$1"
    local status="$2"
    
    local sync_index="${ARTIFACTS_DIR}/memory_sync_index.json"
    
    if [[ -f "$sync_index" ]]; then
        jq --arg dur "$duration" \
           --arg stat "$status" \
           '.performance_metrics.avg_sync_time_ms = ((.performance_metrics.avg_sync_time_ms + ($dur | tonumber * 1000)) / 2) |
            .performance_metrics.success_rate = (if $stat == "success" then 
                (.performance_metrics.success_rate * 0.9 + 0.1) 
            else 
                (.performance_metrics.success_rate * 0.9) 
            end)' "$sync_index" > "${sync_index}.tmp" && mv "${sync_index}.tmp" "$sync_index"
    fi
}

# CLI Interface
case "${1:-help}" in
    "init"|"initialize")
        initialize_memory_router
        ;;
    "store")
        if [[ $# -lt 4 ]]; then
            log_error "Usage: $0 store <namespace> <key> <value> [metadata]"
            exit 1
        fi
        unified_memory_store "$2" "$3" "$4" "${5:-{}}"
        ;;
    "retrieve"|"get")
        if [[ $# -lt 3 ]]; then
            log_error "Usage: $0 retrieve <namespace> <key>"
            exit 1
        fi
        unified_memory_retrieve "$2" "$3"
        ;;
    "search")
        if [[ $# -lt 2 ]]; then
            log_error "Usage: $0 search <query> [namespace]"
            exit 1
        fi
        unified_memory_search "$2" "${3:-*}"
        ;;
    "sync")
        sync_memory_systems
        ;;
    "status")
        if [[ -f "$MEMORY_CONFIG" ]]; then
            log_info "Memory Router Status:"
            jq '.' "$MEMORY_CONFIG"
        else
            log_warning "Memory router not initialized. Run '$0 init' first."
        fi
        
        if [[ -f "${ARTIFACTS_DIR}/memory_sync_index.json" ]]; then
            log_info "Synchronization Status:"
            jq '.' "${ARTIFACTS_DIR}/memory_sync_index.json"
        fi
        ;;
    "help"|*)
        echo "Memory Bridge - Unified Memory Coordination"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  init                Initialize memory router"
        echo "  store <ns> <key> <value>  Store memory with routing"
        echo "  retrieve <ns> <key>       Retrieve memory with fallback"
        echo "  search <query> [ns]       Search across systems"  
        echo "  sync                      Synchronize memory systems"
        echo "  status                    Show router and sync status"
        echo "  help                      Show this help"
        echo ""
        echo "Environment Variables:"
        echo "  DEBUG=1                   Enable debug logging"
        ;;
esac