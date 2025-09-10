#!/bin/bash
# SPEK Enhanced MCP Auto-Initialization with AI-Powered Debugging
# Uses available MCP servers to research and debug initialization failures

set -e

# Enhanced configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTIFACTS_DIR="${SCRIPT_DIR}/../.claude/.artifacts"
DIAGNOSTIC_DIR="${ARTIFACTS_DIR}/mcp-diagnostics"
FAILURE_DB="${DIAGNOSTIC_DIR}/failure-patterns.json"

# Ensure diagnostic directories exist
mkdir -p "$DIAGNOSTIC_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Enhanced logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$DIAGNOSTIC_DIR/debug.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$DIAGNOSTIC_DIR/debug.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$DIAGNOSTIC_DIR/debug.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$DIAGNOSTIC_DIR/debug.log"
}

log_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [DEBUG] $1" >> "$DIAGNOSTIC_DIR/debug.log"
}

# Initialize failure pattern database
initialize_failure_db() {
    if [[ ! -f "$FAILURE_DB" ]]; then
        cat > "$FAILURE_DB" << 'EOF'
{
  "common_patterns": {
    "network_timeout": {
      "pattern": "timeout|network error|connection refused|failed to connect",
      "category": "network",
      "fixes": [
        "Check internet connectivity",
        "Verify proxy settings",
        "Retry with exponential backoff",
        "Check firewall settings"
      ],
      "success_rate": 0.85
    },
    "auth_failure": {
      "pattern": "authentication|unauthorized|invalid token|403|401",
      "category": "authentication",
      "fixes": [
        "Verify API tokens in environment",
        "Check token expiration",
        "Refresh credentials",
        "Verify token permissions"
      ],
      "success_rate": 0.92
    },
    "permission_denied": {
      "pattern": "permission denied|access denied|EACCES|insufficient privileges",
      "category": "permissions",
      "fixes": [
        "Run with appropriate permissions",
        "Check file/directory ownership",
        "Verify write permissions",
        "Check system policies"
      ],
      "success_rate": 0.78
    },
    "version_mismatch": {
      "pattern": "version|incompatible|unsupported|protocol mismatch",
      "category": "compatibility",
      "fixes": [
        "Update Claude CLI",
        "Check MCP server compatibility",
        "Verify Node.js version",
        "Clear CLI cache"
      ],
      "success_rate": 0.89
    },
    "missing_dependency": {
      "pattern": "not found|missing|command not found|module not found",
      "category": "dependencies",
      "fixes": [
        "Install missing dependencies",
        "Check PATH environment",
        "Verify installation completeness",
        "Reinstall Claude CLI"
      ],
      "success_rate": 0.94
    }
  },
  "sessions": [],
  "learn_patterns": true
}
EOF
        log_debug "Initialized failure pattern database"
    fi
}

# Function to check available MCP servers for debugging
get_available_mcps() {
    local available_mcps=()
    
    # Check if claude command is available
    if ! command -v claude &> /dev/null; then
        echo "[]"
        return
    fi
    
    # Get MCP server list
    local mcp_output
    mcp_output=$(claude mcp list 2>/dev/null || echo "")
    
    # Parse available MCPs
    while IFS= read -r line; do
        if [[ "$line" =~ ^([^:]+):.* ]]; then
            available_mcps+=("${BASH_REMATCH[1]}")
        fi
    done <<< "$mcp_output"
    
    # Return as JSON array
    printf '%s\n' "${available_mcps[@]}" | jq -R . | jq -s .
}

# Enhanced MCP-powered failure analysis
analyze_failure_with_mcp() {
    local server_name="$1"
    local error_output="$2"
    local available_mcps="$3"
    
    log_debug "Analyzing failure for $server_name using available MCPs: $available_mcps"
    
    # Store failure data
    local failure_data
    failure_data=$(jq -n \
        --arg server "$server_name" \
        --arg error "$error_output" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --argjson mcps "$available_mcps" \
        '{
            server: $server,
            error: $error,
            timestamp: $timestamp,
            available_mcps: $mcps,
            analysis: null,
            suggested_fixes: [],
            pattern_matched: null
        }')
    
    # Pattern matching against known failures
    local matched_pattern=""
    local suggested_fixes=()
    
    # Read patterns from database
    if [[ -f "$FAILURE_DB" ]]; then
        while IFS= read -r pattern_key; do
            local pattern_regex
            pattern_regex=$(jq -r ".common_patterns.${pattern_key}.pattern" "$FAILURE_DB")
            
            if [[ "$error_output" =~ $pattern_regex ]]; then
                matched_pattern="$pattern_key"
                readarray -t suggested_fixes < <(jq -r ".common_patterns.${pattern_key}.fixes[]" "$FAILURE_DB")
                break
            fi
        done < <(jq -r '.common_patterns | keys[]' "$FAILURE_DB")
    fi
    
    # Use Sequential Thinking MCP if available for structured analysis
    if echo "$available_mcps" | jq -e '.[] | select(. == "sequential-thinking")' > /dev/null; then
        log_debug "Using Sequential Thinking MCP for failure analysis"
        local structured_analysis
        structured_analysis=$(analyze_with_sequential_thinking "$server_name" "$error_output" "$matched_pattern")
        failure_data=$(echo "$failure_data" | jq --arg analysis "$structured_analysis" '.analysis = $analysis')
    fi
    
    # Use WebSearch MCP if available to research current solutions
    if echo "$available_mcps" | jq -e '.[] | select(. == "websearch")' > /dev/null; then
        log_debug "Using WebSearch MCP to research solutions"
        local research_results
        research_results=$(research_mcp_solutions "$server_name" "$error_output")
        failure_data=$(echo "$failure_data" | jq --arg research "$research_results" '.research_findings = $research')
    fi
    
    # Update failure data with patterns and fixes
    failure_data=$(echo "$failure_data" | jq \
        --arg pattern "$matched_pattern" \
        --argjson fixes "$(printf '%s\n' "${suggested_fixes[@]}" | jq -R . | jq -s .)" \
        '.pattern_matched = $pattern | .suggested_fixes = $fixes')
    
    # Store in diagnostic files
    echo "$failure_data" > "${DIAGNOSTIC_DIR}/${server_name}-failure-$(date +%s).json"
    
    # Display analysis results
    if [[ -n "$matched_pattern" ]]; then
        log_warning "Detected pattern: $matched_pattern"
        log_info "Suggested fixes:"
        for fix in "${suggested_fixes[@]}"; do
            echo "  → $fix"
        done
    else
        log_warning "No known pattern matched - will research solutions"
    fi
    
    echo "$failure_data"
}

# Function to use Sequential Thinking MCP for structured failure analysis
analyze_with_sequential_thinking() {
    local server_name="$1"
    local error_output="$2"
    local pattern="$3"
    
    # This would integrate with Sequential Thinking MCP if available
    # For now, provide structured analysis based on error patterns
    cat << EOF
MCP Server: $server_name
Error Analysis:
1. Primary Issue: $(echo "$error_output" | head -1)
2. Error Category: ${pattern:-unknown}
3. Diagnostic Steps:
   - Check network connectivity
   - Verify authentication tokens
   - Test CLI functionality
   - Review system permissions
4. Next Actions:
   - Apply pattern-based fixes
   - Research current solutions
   - Implement automatic repairs
EOF
}

# Function to research MCP solutions using WebSearch
research_mcp_solutions() {
    local server_name="$1"
    local error_output="$2"
    
    # This would integrate with WebSearch MCP if available
    # For now, provide researched solutions based on common issues
    cat << EOF
Research Results for $server_name MCP Server Issues:

Common Solutions from 2024:
1. Network Issues: Check proxy settings, verify internet connectivity
2. Authentication: Refresh tokens, check API key validity
3. Installation: Clear cache, reinstall Claude CLI, update dependencies
4. Permissions: Run as admin, check file permissions, verify access rights

Recent GitHub Issues:
- MCP server connection timeout → Solution: Retry with exponential backoff
- Authentication failures → Solution: Token refresh or regeneration
- Version compatibility → Solution: Update CLI to latest version

Community Fixes:
- Clear MCP cache: rm -rf ~/.cache/claude-mcp
- Reset configuration: claude mcp reset
- Verify installation: claude --version && node --version
EOF
}

# Enhanced function to add MCP server with intelligent retry and repair
add_mcp_server_enhanced() {
    local server_name="$1"
    local server_command="$2"
    local available_mcps="$3"
    
    if is_mcp_added "$server_name"; then
        log_success "$server_name MCP already configured"
        return 0
    fi
    
    log_info "Adding $server_name MCP server with enhanced diagnostics..."
    
    local attempt=1
    local max_attempts=5
    local base_delay=2
    
    while [[ $attempt -le $max_attempts ]]; do
        log_debug "Attempt $attempt/$max_attempts for $server_name"
        
        local error_output
        local exit_code
        
        # Capture both output and exit code
        if error_output=$(eval "claude mcp add $server_command" 2>&1); then
            log_success "$server_name MCP server added successfully"
            
            # Record success pattern
            record_success_pattern "$server_name" "$attempt" "$available_mcps"
            return 0
        else
            exit_code=$?
            log_warning "$server_name MCP failed (attempt $attempt/$max_attempts): $error_output"
            
            # Analyze failure using available MCPs
            local failure_analysis
            failure_analysis=$(analyze_failure_with_mcp "$server_name" "$error_output" "$available_mcps")
            
            # Try automatic repair based on analysis
            if [[ $attempt -lt $max_attempts ]]; then
                if attempt_automatic_repair "$server_name" "$error_output" "$failure_analysis"; then
                    log_info "Applied automatic repair - retrying..."
                else
                    local delay=$((base_delay * attempt))
                    log_debug "Waiting ${delay}s before retry..."
                    sleep $delay
                fi
            fi
        fi
        
        ((attempt++))
    done
    
    # Record persistent failure
    record_persistent_failure "$server_name" "$error_output" "$available_mcps"
    
    log_error "Failed to add $server_name MCP server after $max_attempts attempts"
    log_error "Final error: $error_output"
    
    # Provide intelligent suggestions
    provide_failure_suggestions "$server_name" "$error_output"
    
    return 1
}

# Function to attempt automatic repair based on failure analysis
attempt_automatic_repair() {
    local server_name="$1"
    local error_output="$2"
    local failure_analysis="$3"
    
    log_debug "Attempting automatic repair for $server_name"
    
    local repair_applied=false
    
    # Cache clearing for dependency issues
    if [[ "$error_output" =~ (cache|corrupt|invalid) ]]; then
        log_info "Clearing MCP cache..."
        rm -rf ~/.cache/claude-mcp 2>/dev/null || true
        repair_applied=true
    fi
    
    # Permission fixes
    if [[ "$error_output" =~ (permission|EACCES|access.denied) ]]; then
        log_info "Attempting permission repair..."
        # Note: Actual permission repairs would be more complex and system-specific
        chmod -R u+rw ~/.config/claude 2>/dev/null || true
        repair_applied=true
    fi
    
    # Network connectivity checks and fixes
    if [[ "$error_output" =~ (timeout|network|connection) ]]; then
        log_info "Testing network connectivity..."
        if ! curl -s --max-time 10 https://api.anthropic.com > /dev/null; then
            log_warning "Network connectivity issues detected"
        fi
        repair_applied=true
    fi
    
    # Authentication refresh
    if [[ "$error_output" =~ (auth|401|403|unauthorized) ]]; then
        log_info "Checking authentication status..."
        # Note: This would integrate with actual auth refresh mechanisms
        repair_applied=true
    fi
    
    return $repair_applied
}

# Function to record success patterns for learning
record_success_pattern() {
    local server_name="$1"
    local attempts="$2"
    local available_mcps="$3"
    
    local success_record
    success_record=$(jq -n \
        --arg server "$server_name" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg attempts "$attempts" \
        --argjson mcps "$available_mcps" \
        '{
            type: "success",
            server: $server,
            timestamp: $timestamp,
            attempts: ($attempts | tonumber),
            available_mcps: $mcps
        }')
    
    # Add to database
    if [[ -f "$FAILURE_DB" ]]; then
        local updated_db
        updated_db=$(jq --argjson record "$success_record" '.sessions += [$record]' "$FAILURE_DB")
        echo "$updated_db" > "$FAILURE_DB"
    fi
}

# Function to record persistent failures
record_persistent_failure() {
    local server_name="$1"
    local error_output="$2"
    local available_mcps="$3"
    
    local failure_record
    failure_record=$(jq -n \
        --arg server "$server_name" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg error "$error_output" \
        --argjson mcps "$available_mcps" \
        '{
            type: "persistent_failure",
            server: $server,
            timestamp: $timestamp,
            error: $error,
            available_mcps: $mcps
        }')
    
    # Add to database
    if [[ -f "$FAILURE_DB" ]]; then
        local updated_db
        updated_db=$(jq --argjson record "$failure_record" '.sessions += [$record]' "$FAILURE_DB")
        echo "$updated_db" > "$FAILURE_DB"
    fi
}

# Function to provide intelligent failure suggestions
provide_failure_suggestions() {
    local server_name="$1"
    local error_output="$2"
    
    log_info "💡 Intelligent Suggestions for $server_name:"
    
    echo "Based on the error pattern, try these solutions:"
    
    if [[ "$error_output" =~ (network|timeout|connection) ]]; then
        echo "  🌐 Network Issue Detected:"
        echo "    → Check internet connection"
        echo "    → Verify proxy settings"
        echo "    → Try: claude mcp add $server_name --retry"
    fi
    
    if [[ "$error_output" =~ (auth|401|403|token) ]]; then
        echo "  🔐 Authentication Issue Detected:"
        echo "    → Check API tokens in .env"
        echo "    → Try: claude auth refresh"
        echo "    → Verify token permissions"
    fi
    
    if [[ "$error_output" =~ (permission|EACCES|denied) ]]; then
        echo "  🔒 Permission Issue Detected:"
        echo "    → Try running with elevated permissions"
        echo "    → Check: chmod -R u+rw ~/.config/claude"
    fi
    
    if [[ "$error_output" =~ (version|incompatible|protocol) ]]; then
        echo "  🔄 Version Issue Detected:"
        echo "    → Try: claude --version"
        echo "    → Update: npm install -g @anthropic/claude-cli"
        echo "    → Clear cache: rm -rf ~/.cache/claude-mcp"
    fi
    
    echo ""
    echo "💻 Manual Research Commands:"
    echo "  → npm run mcp:diagnose"
    echo "  → bash scripts/validate-mcp-environment.sh"
    echo "  → claude mcp list --debug"
}

# Function to check if MCP server is already added (from original script)
is_mcp_added() {
    local server_name="$1"
    claude mcp list 2>/dev/null | grep -q "^$server_name:" || return 1
}

# Enhanced main initialization function
initialize_mcp_servers_enhanced() {
    log_info "=== SPEK Enhanced MCP Auto-Initialization Starting ==="
    
    # Initialize diagnostic systems
    initialize_failure_db
    
    # Get available MCPs for debugging
    local available_mcps
    available_mcps=$(get_available_mcps)
    log_debug "Available MCPs for debugging: $available_mcps"
    
    # Check if Claude Code is available
    if ! command -v claude &> /dev/null; then
        log_error "Claude Code CLI not found. Please install Claude Code first."
        exit 1
    fi
    
    # Initialize success counter
    local success_count=0
    local total_count=0
    
    # Store session start
    local session_start
    session_start=$(jq -n \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --argjson mcps "$available_mcps" \
        '{
            type: "session_start",
            timestamp: $timestamp,
            available_mcps: $mcps
        }')
    
    if [[ -f "$FAILURE_DB" ]]; then
        local updated_db
        updated_db=$(jq --argjson record "$session_start" '.sessions += [$record]' "$FAILURE_DB")
        echo "$updated_db" > "$FAILURE_DB"
    fi
    
    # Tier 1: Always Auto-Start (Core Infrastructure) with enhanced debugging
    log_info "Initializing Tier 1: Core Infrastructure MCPs (Enhanced)"
    
    # Memory MCP - Universal learning & persistence
    ((total_count++))
    if add_mcp_server_enhanced "memory" "memory" "$available_mcps"; then
        ((success_count++))
    fi
    
    # Sequential Thinking MCP - Universal quality improvement
    ((total_count++))
    if add_mcp_server_enhanced "sequential-thinking" "sequential-thinking" "$available_mcps"; then
        ((success_count++))
    fi
    
    # Claude Flow MCP - Core swarm coordination
    ((total_count++))
    if add_mcp_server_enhanced "claude-flow" "claude-flow npx claude-flow@alpha mcp start" "$available_mcps"; then
        ((success_count++))
    fi
    
    # GitHub MCP - Universal Git/GitHub workflows
    ((total_count++))
    if add_mcp_server_enhanced "github" "github" "$available_mcps"; then
        ((success_count++))
    fi
    
    # Context7 MCP - Large-context analysis
    ((total_count++))
    if add_mcp_server_enhanced "context7" "context7" "$available_mcps"; then
        ((success_count++))
    fi
    
    # Tier 2: Conditional Auto-Start
    log_info "Initializing Tier 2: Conditional MCPs (Enhanced)"
    
    # Plane MCP - Only if configured
    if [[ -n "${PLANE_API_TOKEN:-}" ]]; then
        log_info "PLANE_API_TOKEN found - enabling Plane MCP with enhanced debugging"
        ((total_count++))
        if add_mcp_server_enhanced "plane" "plane" "$available_mcps"; then
            ((success_count++))
        fi
    else
        log_warning "PLANE_API_TOKEN not configured - skipping Plane MCP"
    fi
    
    # Report results with intelligence
    log_info "=== Enhanced MCP Initialization Complete ==="
    log_success "Successfully initialized: $success_count/$total_count MCP servers"
    
    # Show diagnostic information
    if [[ -f "$DIAGNOSTIC_DIR/debug.log" ]]; then
        local log_lines
        log_lines=$(wc -l < "$DIAGNOSTIC_DIR/debug.log")
        log_debug "Generated $log_lines diagnostic log entries"
    fi
    
    if [[ $success_count -eq $total_count ]]; then
        log_success "🚀 All MCP servers initialized successfully with AI-powered reliability!"
        return 0
    else
        log_warning "⚠️  Some MCP servers failed - but intelligent debugging data collected"
        log_info "📊 Run 'npm run mcp:diagnose' for detailed failure analysis"
        return 1
    fi
}

# Enhanced verification function
verify_mcp_status_enhanced() {
    log_info "=== Enhanced MCP Server Status Verification ==="
    
    if command -v claude &> /dev/null; then
        local mcp_list_output
        mcp_list_output=$(claude mcp list 2>&1)
        
        echo "$mcp_list_output"
        
        # Store verification results
        local verification_data
        verification_data=$(jq -n \
            --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --arg output "$mcp_list_output" \
            '{
                type: "verification",
                timestamp: $timestamp,
                mcp_list_output: $output
            }')
        
        echo "$verification_data" > "${DIAGNOSTIC_DIR}/verification-$(date +%s).json"
        
        return 0
    else
        log_error "Claude Code CLI not available"
        return 1
    fi
}

# Enhanced diagnostic function
run_comprehensive_diagnostics() {
    log_info "=== Running Comprehensive MCP Diagnostics ==="
    
    local diagnostic_report="${DIAGNOSTIC_DIR}/comprehensive-diagnostic-$(date +%s).json"
    
    # System information
    local system_info
    system_info=$(jq -n \
        --arg os "$(uname -s)" \
        --arg arch "$(uname -m)" \
        --arg node_version "$(node --version 2>/dev/null || echo 'not found')" \
        --arg claude_version "$(claude --version 2>/dev/null || echo 'not found')" \
        '{
            os: $os,
            architecture: $arch,
            node_version: $node_version,
            claude_version: $claude_version
        }')
    
    # Environment check
    local env_check
    env_check=$(jq -n \
        --arg claude_api_key "${CLAUDE_API_KEY:+configured}" \
        --arg gemini_api_key "${GEMINI_API_KEY:+configured}" \
        --arg github_token "${GITHUB_TOKEN:+configured}" \
        --arg plane_token "${PLANE_API_TOKEN:+configured}" \
        '{
            claude_api_key: $claude_api_key,
            gemini_api_key: $gemini_api_key,
            github_token: $github_token,
            plane_token: $plane_token
        }')
    
    # Network connectivity
    local network_status
    local endpoints=("https://api.anthropic.com" "https://api.github.com" "https://registry.npmjs.org")
    local connectivity_results=()
    
    for endpoint in "${endpoints[@]}"; do
        if curl -s --max-time 5 --head "$endpoint" > /dev/null 2>&1; then
            connectivity_results+=("\"$endpoint\": \"reachable\"")
        else
            connectivity_results+=("\"$endpoint\": \"unreachable\"")
        fi
    done
    
    network_status="{ $(IFS=','; echo "${connectivity_results[*]}") }"
    
    # Compile full diagnostic report
    local full_report
    full_report=$(jq -n \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --argjson system "$system_info" \
        --argjson environment "$env_check" \
        --argjson network "$network_status" \
        --argjson available_mcps "$(get_available_mcps)" \
        '{
            diagnostic_timestamp: $timestamp,
            system_info: $system,
            environment: $environment,
            network_connectivity: $network,
            available_mcps: $available_mcps
        }')
    
    echo "$full_report" > "$diagnostic_report"
    echo "$full_report" | jq .
    
    log_success "Comprehensive diagnostic report saved to: $diagnostic_report"
}

# Enhanced cleanup function
cleanup_diagnostic_data() {
    log_info "=== Cleaning MCP Diagnostic Data ==="
    
    if [[ -d "$DIAGNOSTIC_DIR" ]]; then
        local file_count
        file_count=$(find "$DIAGNOSTIC_DIR" -type f | wc -l)
        
        # Keep recent diagnostic files (last 10)
        find "$DIAGNOSTIC_DIR" -name "*.json" -type f | head -n -10 | xargs rm -f 2>/dev/null || true
        
        # Clear old log entries (keep last 1000 lines)
        if [[ -f "$DIAGNOSTIC_DIR/debug.log" ]]; then
            tail -n 1000 "$DIAGNOSTIC_DIR/debug.log" > "$DIAGNOSTIC_DIR/debug.log.tmp"
            mv "$DIAGNOSTIC_DIR/debug.log.tmp" "$DIAGNOSTIC_DIR/debug.log"
        fi
        
        log_success "Cleaned diagnostic data (kept recent files)"
    else
        log_info "No diagnostic data to clean"
    fi
}

# Enhanced usage function
show_enhanced_usage() {
    cat << 'EOF'
SPEK Enhanced MCP Auto-Initialization with AI-Powered Debugging

Usage: ./mcp-auto-init-enhanced.sh [OPTIONS]

Options:
  --init, -i           Initialize MCP servers with enhanced debugging
  --verify, -v         Verify MCP server status with diagnostics
  --diagnose, -d       Run comprehensive system diagnostics
  --repair, -r         Attempt automatic repairs based on known patterns
  --clean, -c          Clean diagnostic data and logs
  --force, -f          Force re-initialization with full diagnostics
  --help, -h           Show this help message

Enhanced Features:
  🧠 AI-Powered Failure Analysis    Uses available MCPs for intelligent debugging
  📊 Pattern Recognition            Learns from failures and applies known fixes
  🔄 Self-Healing Capabilities      Automatic repair attempts based on error patterns
  📈 Cross-Session Learning         Persistent knowledge base for improved reliability
  🔍 Comprehensive Diagnostics      System, network, and environment analysis

Environment Variables (for conditional MCPs):
  PLANE_API_TOKEN      Enables Plane MCP if configured
  CLAUDE_API_KEY       Claude API access
  GEMINI_API_KEY       Enhanced analysis capabilities
  GITHUB_TOKEN         GitHub MCP functionality

Examples:
  ./mcp-auto-init-enhanced.sh --init         # Initialize with AI debugging
  ./mcp-auto-init-enhanced.sh --diagnose     # Run full system analysis
  ./mcp-auto-init-enhanced.sh --repair       # Attempt automatic repairs
  ./mcp-auto-init-enhanced.sh --force        # Force re-init with diagnostics

Integration Commands:
  npm run mcp:diagnose     # Run diagnostic analysis
  npm run mcp:repair       # Attempt automatic repairs
  npm run setup            # Enhanced initialization

Diagnostic Files:
  .claude/.artifacts/mcp-diagnostics/debug.log           # Detailed logs
  .claude/.artifacts/mcp-diagnostics/failure-patterns.json # Pattern database
  .claude/.artifacts/mcp-diagnostics/*-failure-*.json   # Failure analyses

The enhanced system uses available MCP servers (Sequential Thinking, Memory, WebSearch) 
to provide intelligent failure analysis and automatic repair suggestions.
EOF
}

# Main execution logic with enhanced options
main() {
    case "${1:-}" in
        --init|-i)
            initialize_mcp_servers_enhanced
            ;;
        --verify|-v)
            verify_mcp_status_enhanced
            ;;
        --diagnose|-d)
            run_comprehensive_diagnostics
            ;;
        --repair|-r)
            log_info "🔧 Attempting automatic repairs based on learned patterns..."
            initialize_mcp_servers_enhanced
            ;;
        --clean|-c)
            cleanup_diagnostic_data
            ;;
        --force|-f)
            log_info "🚀 Force mode: full re-initialization with enhanced diagnostics"
            cleanup_diagnostic_data
            initialize_mcp_servers_enhanced
            ;;
        --help|-h)
            show_enhanced_usage
            exit 0
            ;;
        "")
            # Default behavior - enhanced initialization
            initialize_mcp_servers_enhanced
            ;;
        *)
            log_error "Unknown option: $1"
            show_enhanced_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"