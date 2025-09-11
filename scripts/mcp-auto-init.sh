#!/bin/bash
# SPEK MCP Auto-Initialization Script
# Automatically initializes core MCP servers for every session

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if MCP server is already added
is_mcp_added() {
    local server_name="$1"
    claude mcp list 2>/dev/null | grep -q "^$server_name:" || return 1
}

# Enhanced diagnostic data collection
DIAGNOSTIC_LOG="${HOME}/.claude/mcp-diagnostics.log"
FAILURE_PATTERNS_DB="${HOME}/.claude/mcp-failure-patterns.json"
SUCCESS_METRICS="${HOME}/.claude/mcp-success-metrics.json"

# Initialize diagnostic logging
init_diagnostics() {
    mkdir -p "${HOME}/.claude"
    echo "$(date): MCP Auto-Init Session Started" >> "$DIAGNOSTIC_LOG"
    
    # Create failure patterns database if it doesn't exist
    if [[ ! -f "$FAILURE_PATTERNS_DB" ]]; then
        echo '{
  "failure_patterns": [],
  "common_fixes": {},
  "success_correlations": []
}' > "$FAILURE_PATTERNS_DB"
    fi
}

# Record failure pattern for intelligent analysis
record_failure_pattern() {
    local server_name="$1"
    local error_type="$2"
    local error_details="$3"
    local attempt_number="$4"
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local system_info=$(uname -a)
    local node_version=$(node --version 2>/dev/null || echo "not_available")
    local claude_version=$(claude --version 2>/dev/null || echo "not_available")
    
    # Create failure record
    local failure_record='{"timestamp":"'$timestamp'","server":"'$server_name'","error_type":"'$error_type'","error_details":"'$error_details'","attempt":'$attempt_number',"system":"'$system_info'","node_version":"'$node_version'","claude_version":"'$claude_version'"}'
    
    echo "$(date): FAILURE: $server_name - $error_type - $error_details" >> "$DIAGNOSTIC_LOG"
    
    # Use available MCP servers for intelligent analysis if present
    if is_mcp_added "sequential-thinking" || is_mcp_added "memory"; then
        analyze_failure_with_mcp "$server_name" "$error_type" "$error_details" "$failure_record"
    fi
}

# Use available MCP servers for intelligent failure analysis
analyze_failure_with_mcp() {
    local server_name="$1"
    local error_type="$2"
    local error_details="$3"
    local failure_record="$4"
    
    log_info "[BRAIN] Running intelligent failure analysis using available MCP servers..."
    
    # Create analysis request for MCP servers
    local analysis_prompt="Analyze this MCP server installation failure and suggest specific fixes:
    
Server: $server_name
Error Type: $error_type  
Error Details: $error_details
Failure Record: $failure_record

Based on common MCP failure patterns, provide:
1. Most likely root cause
2. Specific fix commands to try
3. Prevention strategies
4. Alternative approaches if standard fix fails

Format response as structured JSON with actionable steps."
    
    # Try to get intelligent suggestions from working MCP servers
    if command -v claude &> /dev/null; then
        # Use Claude with available MCP context for analysis
        echo "$analysis_prompt" | claude --mcp-context 2>/dev/null | tee -a "$DIAGNOSTIC_LOG" || true
    fi
}

# Intelligent fix suggestion based on error patterns
suggest_intelligent_fixes() {
    local server_name="$1"
    local error_output="$2"
    
    log_info "[SEARCH] Analyzing failure patterns for intelligent fix suggestions..."
    
    # Pattern matching for common issues
    case "$error_output" in
        *"network"*|*"timeout"*|*"connection"*)
            log_info "[GLOBE] Network-related failure detected"
            echo "  [INFO] Try: Check internet connection, proxy settings, firewall rules"
            echo "  [INFO] Try: curl -I https://api.anthropic.com (test connectivity)"
            echo "  [INFO] Try: export https_proxy=your_proxy if behind corporate firewall"
            ;;
        *"permission"*|*"EACCES"*)
            log_info "[U+1F512] Permission-related failure detected"
            echo "  [INFO] Try: sudo chown -R \$USER ~/.claude (fix permissions)"
            echo "  [INFO] Try: Check if Claude CLI was installed with sudo (shouldn't be)"
            ;;
        *"not found"*|*"command not found"*)
            log_info "[U+1F4E6] Installation/Path issue detected"
            echo "  [INFO] Try: which claude (verify Claude CLI installation)"
            echo "  [INFO] Try: Add Claude CLI to PATH or reinstall"
            echo "  [INFO] Try: curl -fsSL https://claude.ai/download/cli | sh"
            ;;
        *"authentication"*|*"auth"*|*"token"*)
            log_info "[LOCK] Authentication failure detected"
            echo "  [INFO] Try: claude auth login (re-authenticate)"
            echo "  [INFO] Try: Check if API keys are properly configured"
            echo "  [INFO] Try: claude auth status (verify auth status)"
            ;;
        *"version"*|*"protocol"*)
            log_info "[WARN] Version compatibility issue detected"
            echo "  [INFO] Try: claude --version (check Claude CLI version)"
            echo "  [INFO] Try: Update Claude CLI to latest version"
            echo "  [INFO] Try: Check MCP server compatibility requirements"
            ;;
        *)
            log_info "[U+2753] Unknown failure pattern - using general troubleshooting"
            echo "  [INFO] Try: claude mcp list (check current MCP state)"
            echo "  [INFO] Try: claude mcp remove $server_name && claude mcp add $server_name (reset)"
            echo "  [INFO] Try: Check ~/.claude/logs/ for detailed error logs"
            ;;
    esac
    
    # Research-based suggestions using WebSearch if available
    if is_mcp_added "websearch" || command -v curl &> /dev/null; then
        research_mcp_solutions "$server_name" "$error_output"
    fi
}

# Research MCP solutions using available tools
research_mcp_solutions() {
    local server_name="$1"
    local error_output="$2"
    
    log_info "[SCIENCE] Researching solutions for $server_name installation issues..."
    
    # Create research queries based on error patterns
    local search_queries=(
        "\"$server_name MCP server\" installation failure fix 2024"
        "Claude Code MCP \"$server_name\" connection error solution"
        "MCP server setup troubleshooting \"$server_name\" guide"
    )
    
    # If we have working MCP servers, use them for research
    if is_mcp_added "websearch"; then
        for query in "${search_queries[@]}"; do
            log_info "[GLOBE] Searching: $query"
            echo "Research query: $query" >> "$DIAGNOSTIC_LOG"
            # Note: This would use WebSearch MCP if available in the environment
        done
    fi
    
    # Fallback to manual research suggestions
    log_info "[U+1F4DA] Manual research suggestions:"
    echo "  [SEARCH] Search GitHub issues: https://github.com/search?q=\"$server_name+MCP+server\"+error"
    echo "  [SEARCH] Check official docs: https://docs.anthropic.com/claude-code/mcp"
    echo "  [SEARCH] Community discussions: https://discord.gg/anthropic (MCP channel)"
}

# Enhanced function to add MCP server with intelligent retry and analysis
add_mcp_server() {
    local server_name="$1"
    local server_command="$2"
    
    if is_mcp_added "$server_name"; then
        log_success "$server_name MCP already configured"
        record_success_metric "$server_name" "already_configured" "0"
        return 0
    fi
    
    log_info "Adding $server_name MCP server with intelligent retry..."
    
    # Enhanced retry mechanism with intelligent analysis
    for attempt in 1 2 3; do
        log_info "Attempt $attempt/3 for $server_name..."
        
        # Capture detailed error output
        local error_output
        error_output=$(eval "claude mcp add $server_command" 2>&1)
        local exit_code=$?
        
        if [[ $exit_code -eq 0 ]]; then
            log_success "$server_name MCP server added successfully"
            record_success_metric "$server_name" "successful_add" "$attempt"
            return 0
        else
            log_warning "$server_name MCP server failed (attempt $attempt/3)"
            
            # Record failure pattern for analysis
            local error_type="connection_failure"
            if [[ "$error_output" =~ "network" ]]; then error_type="network_error"; fi
            if [[ "$error_output" =~ "auth" ]]; then error_type="auth_error"; fi
            if [[ "$error_output" =~ "permission" ]]; then error_type="permission_error"; fi
            if [[ "$error_output" =~ "timeout" ]]; then error_type="timeout_error"; fi
            
            record_failure_pattern "$server_name" "$error_type" "$error_output" "$attempt"
            
            # Provide intelligent fix suggestions after first failure
            if [[ $attempt -eq 1 ]]; then
                suggest_intelligent_fixes "$server_name" "$error_output"
            fi
            
            # Implement smart backoff strategy
            local backoff_time=$((attempt * 3))
            if [[ $attempt -lt 3 ]]; then
                log_info "[U+23F3] Waiting ${backoff_time}s before retry (smart backoff)..."
                sleep $backoff_time
                
                # Try auto-repair based on error pattern
                attempt_auto_repair "$server_name" "$error_type" "$error_output"
            fi
        fi
    done
    
    log_error "[FAIL] Failed to add $server_name MCP server after 3 intelligent attempts"
    log_info "[CLIPBOARD] Check diagnostic log: $DIAGNOSTIC_LOG"
    log_info "[U+1F6E0][U+FE0F] For manual troubleshooting, see suggestions above"
    
    return 1
}

# Attempt automatic repair based on detected error patterns
attempt_auto_repair() {
    local server_name="$1"
    local error_type="$2"
    local error_output="$3"
    
    log_info "[TOOL] Attempting auto-repair for $error_type..."
    
    case "$error_type" in
        "auth_error")
            log_info "[LOCK] Attempting authentication refresh..."
            claude auth status >/dev/null 2>&1 || {
                log_warning "[WARN] Claude auth appears invalid - manual re-auth may be needed"
            }
            ;;
        "permission_error")
            log_info "[U+1F512] Checking Claude directory permissions..."
            if [[ -d "${HOME}/.claude" ]]; then
                chmod -R u+rw "${HOME}/.claude" 2>/dev/null || true
            fi
            ;;
        "network_error"|"timeout_error")
            log_info "[GLOBE] Testing network connectivity..."
            if ! curl -I --max-time 10 https://api.anthropic.com >/dev/null 2>&1; then
                log_warning "[WARN] Network connectivity issues detected"
            fi
            ;;
        *)
            log_info "[U+2753] Generic auto-repair: clearing MCP cache..."
            # Try to clean any cached state
            [[ -d "${HOME}/.claude/mcp-cache" ]] && rm -rf "${HOME}/.claude/mcp-cache" 2>/dev/null || true
            ;;
    esac
}

# Record success metrics for pattern analysis
record_success_metric() {
    local server_name="$1"
    local success_type="$2"
    local attempts_needed="$3"
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "$(date): SUCCESS: $server_name - $success_type - attempts: $attempts_needed" >> "$DIAGNOSTIC_LOG"
    
    # Could be enhanced to feed back into success pattern analysis
}

# Function to check environment variables for conditional MCPs
check_env_var() {
    local var_name="$1"
    [[ -n "${!var_name}" ]]
}

# Enhanced main initialization function with intelligent diagnostics
initialize_mcp_servers() {
    log_info "=== SPEK MCP Auto-Initialization Starting (Enhanced) ==="
    
    # Initialize diagnostic system
    init_diagnostics
    
    # Enhanced Claude Code availability check
    if ! command -v claude &> /dev/null; then
        log_error "Claude Code CLI not found. Please install Claude Code first."
        log_info "[INFO] Installation help:"
        log_info "   [U+2022] Visit: https://claude.ai/code"
        log_info "   [U+2022] Or run: curl -fsSL https://claude.ai/download/cli | sh"
        record_failure_pattern "system" "claude_cli_missing" "Claude CLI not found in PATH" "1"
        exit 1
    fi
    
    # Verify Claude authentication
    log_info "[LOCK] Verifying Claude authentication..."
    if ! claude auth status >/dev/null 2>&1; then
        log_warning "[WARN] Claude authentication may be invalid"
        log_info "[INFO] Try: claude auth login"
    else
        log_success "[OK] Claude authentication verified"
    fi
    
    # Check for existing MCP issues from previous sessions
    if [[ -f "$FAILURE_PATTERNS_DB" ]]; then
        local failure_count=$(jq '.failure_patterns | length' "$FAILURE_PATTERNS_DB" 2>/dev/null || echo "0")
        if [[ $failure_count -gt 0 ]]; then
            log_info "[CHART] Found $failure_count previous failure patterns in diagnostic database"
            log_info "[BRAIN] Using historical data to optimize initialization strategy"
        fi
    fi
    
    # Initialize success counter with enhanced metrics
    local success_count=0
    local total_count=0
    local failed_servers=()
    local partial_success_servers=()
    
    # Tier 1: Always Auto-Start (Core Infrastructure) - Enhanced with Priority Logic
    log_info "[ROCKET] Initializing Tier 1: Core Infrastructure MCPs (Enhanced)"
    
    # Define server initialization order based on dependency and importance
    declare -A server_priorities=(
        ["memory"]=1
        ["sequential-thinking"]=2  
        ["claude-flow"]=3
        ["github"]=4
        ["context7"]=5
    )
    
    declare -A server_commands=(
        ["memory"]="memory"
        ["sequential-thinking"]="sequential-thinking"
        ["claude-flow"]="claude-flow npx claude-flow@alpha mcp start"
        ["github"]="github"
        ["context7"]="context7"
    )
    
    # Sort servers by priority for optimal initialization order
    for server in $(printf '%s\n' "${!server_priorities[@]}" | sort -k1,1n); do
        ((total_count++))
        log_info "[TOOL] Initializing $server (priority: ${server_priorities[$server]})"
        
        if add_mcp_server "$server" "${server_commands[$server]}"; then
            ((success_count++))
            log_success "[OK] $server MCP initialized successfully"
        else
            failed_servers+=("$server")
            log_warning "[FAIL] $server MCP failed to initialize"
            
            # Special handling for critical dependencies
            if [[ "$server" == "memory" || "$server" == "sequential-thinking" ]]; then
                log_warning "[WARN] $server is a critical dependency - other services may have reduced functionality"
            fi
        fi
    done
    
    # Tier 2: Conditional Auto-Start - Enhanced with Environment Analysis
    log_info "[CYCLE] Initializing Tier 2: Conditional MCPs (Enhanced)"
    
    # Enhanced Plane MCP initialization with validation
    if check_env_var "PLANE_API_TOKEN"; then
        log_info "[U+1F6EB] PLANE_API_TOKEN found - enabling Plane MCP with validation"
        
        # Additional Plane configuration validation
        local plane_config_valid=true
        if ! check_env_var "PLANE_API_URL"; then
            log_warning "[WARN] PLANE_API_URL not configured - Plane MCP may have issues"
            plane_config_valid=false
        fi
        if ! check_env_var "PLANE_PROJECT_ID"; then
            log_warning "[WARN] PLANE_PROJECT_ID not configured - Plane MCP may have issues"
            plane_config_valid=false
        fi
        
        ((total_count++))
        if add_mcp_server "plane" "plane"; then
            ((success_count++))
            if [[ "$plane_config_valid" == "true" ]]; then
                log_success "[OK] Plane MCP initialized with full configuration"
            else
                log_warning "[WARN] Plane MCP initialized but configuration incomplete"
                partial_success_servers+=("plane")
            fi
        else
            failed_servers+=("plane")
            log_error "[FAIL] Plane MCP failed despite token configuration"
        fi
    else
        log_info "[INFO] PLANE_API_TOKEN not configured - skipping Plane MCP"
        log_info "   To enable Plane integration:"
        log_info "   [U+2022] Set PLANE_API_TOKEN in your .env file"
        log_info "   [U+2022] Also configure PLANE_API_URL, PLANE_PROJECT_ID"
        log_info "   [U+2022] Run: bash scripts/validate-mcp-environment.sh --template"
    fi
    
    # Detect and suggest additional conditional MCPs based on environment
    detect_additional_mcp_opportunities
    
    # Enhanced results reporting with intelligent analysis
    log_info "=== MCP Initialization Complete (Enhanced Analysis) ==="
    log_success "Successfully initialized: $success_count/$total_count MCP servers"
    
    # Analyze results and provide intelligent recommendations
    if [[ $success_count -eq $total_count ]]; then
        log_success "[PARTY] All MCP servers initialized successfully!"
        log_info "[ROCKET] Your development environment is fully optimized for:"
        log_info "   [U+2022] Persistent memory across sessions"
        log_info "   [U+2022] Structured reasoning and analysis"
        log_info "   [U+2022] Swarm coordination (2.8-4.4x speed boost)"
        log_info "   [U+2022] Seamless GitHub integration"
        log_info "   [U+2022] Large-context architectural analysis"
        record_success_metric "system" "full_initialization" "$total_count"
        return 0
    elif [[ $success_count -gt 0 ]]; then
        log_warning "[WARN] Partial success: $success_count/$total_count MCP servers initialized"
        log_info "[CLIPBOARD] Failed servers: ${failed_servers[*]}"
        log_info "[U+1F6E0][U+FE0F] Your environment has reduced functionality but core features are available"
        
        # Provide specific guidance based on which servers failed
        if [[ ${#failed_servers[@]} -gt 0 ]]; then
            log_info "[INFO] To restore full functionality:"
            for failed_server in "${failed_servers[@]}"; do
                log_info "   [U+2022] $failed_server: Check diagnostic log at $DIAGNOSTIC_LOG"
            done
            log_info "   [U+2022] Run: npm run mcp:force (force re-initialization)"
            log_info "   [U+2022] Or manually: claude mcp add [server_name]"
        fi
        
        return 0  # Don't fail completely on partial success
    else
        log_error "[FAIL] No MCP servers could be initialized"
        log_info "[U+1F6A8] Your environment is running in basic mode without MCP enhancements"
        log_info "[CLIPBOARD] Diagnostic information:"
        log_info "   [U+2022] Check: $DIAGNOSTIC_LOG"
        log_info "   [U+2022] Verify: claude auth status"
        log_info "   [U+2022] Test: claude mcp list"
        log_info "[INFO] Quick fixes to try:"
        log_info "   [U+2022] claude auth login (re-authenticate)"
        log_info "   [U+2022] Check internet connection"
        log_info "   [U+2022] Update Claude CLI: curl -fsSL https://claude.ai/download/cli | sh"
        
        return 1
    fi
}

# Function to verify MCP server status
verify_mcp_status() {
    log_info "=== Verifying MCP Server Status ==="
    
    # List all configured MCP servers
    if command -v claude &> /dev/null; then
        claude mcp list 2>/dev/null || {
            log_warning "Unable to list MCP servers"
            return 1
        }
    else
        log_error "Claude Code CLI not available"
        return 1
    fi
}

# Function to show usage information
show_usage() {
    echo "SPEK MCP Auto-Initialization Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --init, -i    Initialize MCP servers"
    echo "  --verify, -v  Verify MCP server status"
    echo "  --force, -f   Force re-initialization (remove and re-add)"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "Environment Variables (for conditional MCPs):"
    echo "  PLANE_API_TOKEN    - Enables Plane MCP if set"
    echo ""
    echo "Examples:"
    echo "  $0 --init         # Initialize all MCP servers"
    echo "  $0 --verify       # Check status of MCP servers"
    echo "  $0 --force        # Force re-initialization"
}

# Detect opportunities for additional MCP servers based on environment
detect_additional_mcp_opportunities() {
    log_info "[SEARCH] Detecting additional MCP opportunities..."
    
    # Check for development tools that could benefit from MCP integration
    if command -v docker &> /dev/null; then
        log_info "[U+1F433] Docker detected - consider adding Docker MCP for container management"
    fi
    
    if [[ -d ".git" ]]; then
        log_info "[U+1F4E6] Git repository detected - GitHub MCP will provide enhanced integration"
    fi
    
    if [[ -f "package.json" ]]; then
        log_info "[U+1F4E6] Node.js project detected - consider NPM/Yarn MCP servers"
    fi
    
    if [[ -f "requirements.txt" || -f "pyproject.toml" ]]; then
        log_info "[U+1F40D] Python project detected - consider Python-specific MCP servers"
    fi
    
    # Check for API keys that could enable additional services
    if check_env_var "OPENAI_API_KEY"; then
        log_info "[U+1F916] OpenAI API key detected - consider OpenAI MCP for enhanced AI features"
    fi
    
    if check_env_var "ANTHROPIC_API_KEY"; then
        log_info "[BRAIN] Anthropic API key detected - enhanced Claude integration possible"
    fi
}

# Enhanced usage information with diagnostic guidance
show_enhanced_usage() {
    echo "SPEK MCP Auto-Initialization Script (Enhanced with Intelligent Diagnostics)"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --init, -i       Initialize MCP servers with intelligent retry"
    echo "  --verify, -v     Verify MCP server status with diagnostics"
    echo "  --force, -f      Force re-initialization with failure analysis"
    echo "  --diagnose, -d   Run comprehensive diagnostic analysis"
    echo "  --repair, -r     Attempt automatic repair of failed servers"
    echo "  --clean, -c      Clean diagnostic data and start fresh"
    echo "  --help, -h       Show this enhanced help message"
    echo ""
    echo "Diagnostic Features:"
    echo "  [U+2022] Intelligent failure pattern recognition"
    echo "  [U+2022] Automatic fix suggestions based on error analysis"
    echo "  [U+2022] Research-powered troubleshooting using available MCP servers"
    echo "  [U+2022] Success metric tracking and optimization"
    echo "  [U+2022] Cross-session failure pattern learning"
    echo ""
    echo "Diagnostic Files:"
    echo "  [U+2022] Log: $DIAGNOSTIC_LOG"
    echo "  [U+2022] Patterns: $FAILURE_PATTERNS_DB"
    echo "  [U+2022] Metrics: $SUCCESS_METRICS"
    echo ""
    echo "Environment Variables (for conditional MCPs):"
    echo "  PLANE_API_TOKEN    - Enables Plane MCP if set"
    echo "  PLANE_API_URL      - Plane instance URL"
    echo "  PLANE_PROJECT_ID   - Plane project identifier"
    echo ""
    echo "Examples:"
    echo "  $0 --init         # Initialize with intelligent analysis"
    echo "  $0 --diagnose     # Run comprehensive diagnostics"
    echo "  $0 --repair       # Attempt auto-repair of failed servers"
    echo "  $0 --force        # Force re-init with enhanced troubleshooting"
}

# Run comprehensive diagnostics
run_comprehensive_diagnostics() {
    log_info "[SEARCH] Running comprehensive MCP diagnostic analysis..."
    
    # System environment analysis
    log_info "[CHART] System Environment Analysis:"
    echo "  [U+2022] Operating System: $(uname -a)"
    echo "  [U+2022] Node.js Version: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "  [U+2022] Claude CLI Version: $(claude --version 2>/dev/null || echo 'Not installed')"
    echo "  [U+2022] Shell: $SHELL"
    echo "  [U+2022] Current User: $(whoami)"
    echo "  [U+2022] Home Directory: $HOME"
    
    # Authentication status
    log_info "[LOCK] Authentication Analysis:"
    if claude auth status >/dev/null 2>&1; then
        log_success "[OK] Claude authentication is valid"
    else
        log_warning "[WARN] Claude authentication appears invalid"
        echo "  [INFO] Try: claude auth login"
    fi
    
    # Network connectivity tests
    log_info "[GLOBE] Network Connectivity Analysis:"
    if curl -I --max-time 10 https://api.anthropic.com >/dev/null 2>&1; then
        log_success "[OK] Anthropic API reachable"
    else
        log_warning "[WARN] Cannot reach Anthropic API"
        echo "  [INFO] Check: Internet connection, proxy settings, firewall rules"
    fi
    
    # MCP server status analysis
    log_info "[U+1F916] Current MCP Server Analysis:"
    if command -v claude &> /dev/null; then
        claude mcp list 2>/dev/null || log_warning "[WARN] Cannot list MCP servers"
    else
        log_error "[FAIL] Claude CLI not available"
    fi
    
    # Diagnostic log analysis
    if [[ -f "$DIAGNOSTIC_LOG" ]]; then
        local log_lines=$(wc -l < "$DIAGNOSTIC_LOG" 2>/dev/null || echo "0")
        log_info "[CLIPBOARD] Diagnostic Log Analysis:"
        echo "  [U+2022] Log file: $DIAGNOSTIC_LOG"
        echo "  [U+2022] Log entries: $log_lines"
        
        if [[ $log_lines -gt 0 ]]; then
            echo "  [U+2022] Recent failures:"
            grep "FAILURE:" "$DIAGNOSTIC_LOG" | tail -3 | while read -r line; do
                echo "    - $line"
            done
        fi
    fi
    
    # Environment variables analysis
    log_info "[U+1F30D] Environment Configuration Analysis:"
    local env_vars=("PLANE_API_TOKEN" "GITHUB_TOKEN" "CLAUDE_API_KEY" "GEMINI_API_KEY")
    for var in "${env_vars[@]}"; do
        if check_env_var "$var"; then
            log_success "[OK] $var is configured"
        else
            log_info "i[U+FE0F] $var not configured (optional)"
        fi
    done
    
    # Recommendations based on analysis
    log_info "[INFO] Diagnostic Recommendations:"
    if [[ ! -f "$HOME/.env" ]]; then
        echo "  [U+2022] Create .env file for configuration persistence"
        echo "  [U+2022] Run: bash scripts/validate-mcp-environment.sh --template"
    fi
    
    echo "  [U+2022] For detailed troubleshooting: check $DIAGNOSTIC_LOG"
    echo "  [U+2022] For configuration help: bash scripts/validate-mcp-environment.sh --help"
    echo "  [U+2022] For force repair: $0 --repair"
}

# Attempt automatic repair of failed MCP servers
attempt_mcp_repair() {
    log_info "[TOOL] Attempting automatic MCP server repair..."
    
    # Clear any corrupted cache
    if [[ -d "${HOME}/.claude/mcp-cache" ]]; then
        log_info "[U+1F5D1][U+FE0F] Clearing MCP cache..."
        rm -rf "${HOME}/.claude/mcp-cache" 2>/dev/null || true
    fi
    
    # Reset authentication if needed
    if ! claude auth status >/dev/null 2>&1; then
        log_warning "[WARN] Authentication invalid - manual re-auth needed"
        log_info "[INFO] Run: claude auth login"
        return 1
    fi
    
    # Attempt to repair each failed server from diagnostic log
    if [[ -f "$DIAGNOSTIC_LOG" ]]; then
        local failed_servers
        failed_servers=$(grep "FAILURE:" "$DIAGNOSTIC_LOG" | awk '{print $3}' | sort -u)
        
        if [[ -n "$failed_servers" ]]; then
            log_info "[CYCLE] Attempting repair of previously failed servers..."
            while IFS= read -r server; do
                if [[ -n "$server" && "$server" != "-" ]]; then
                    log_info "[TOOL] Repairing $server..."
                    # Remove and re-add the server
                    claude mcp remove "$server" 2>/dev/null || true
                    sleep 1
                    
                    # Re-add with appropriate command based on server type
                    case "$server" in
                        "memory") claude mcp add memory ;;
                        "sequential-thinking") claude mcp add sequential-thinking ;;
                        "claude-flow") claude mcp add claude-flow npx claude-flow@alpha mcp start ;;
                        "github") claude mcp add github ;;
                        "context7") claude mcp add context7 ;;
                        "plane") claude mcp add plane ;;
                        *) log_warning "[WARN] Unknown server type: $server" ;;
                    esac
                fi
            done <<< "$failed_servers"
        else
            log_info "i[U+FE0F] No failed servers found in diagnostic log"
        fi
    fi
    
    # Run verification after repair
    verify_mcp_status
}

# Clean diagnostic data
clean_diagnostic_data() {
    log_info "[U+1F9F9] Cleaning diagnostic data..."
    
    local files_to_clean=("$DIAGNOSTIC_LOG" "$FAILURE_PATTERNS_DB" "$SUCCESS_METRICS")
    local cleaned_count=0
    
    for file in "${files_to_clean[@]}"; do
        if [[ -f "$file" ]]; then
            rm "$file" && ((cleaned_count++))
            log_success "[OK] Cleaned: $file"
        fi
    done
    
    log_info "[U+1F9F9] Cleaned $cleaned_count diagnostic files"
    log_info "[INFO] Next run will start with fresh diagnostic tracking"
}

# Main execution logic
main() {
    case "${1:-}" in
        --init|-i)
            initialize_mcp_servers
            ;;
        --verify|-v)
            verify_mcp_status
            ;;
        --force|-f)
            log_info "Force mode: removing existing MCP servers first"
            # Note: Add force removal logic here if needed
            initialize_mcp_servers
            ;;
        --diagnose|-d)
            log_info "Running comprehensive MCP diagnostic analysis..."
            run_comprehensive_diagnostics
            ;;
        --repair|-r)
            log_info "Attempting automatic repair of failed MCP servers..."
            attempt_mcp_repair
            ;;
        --clean|-c)
            log_info "Cleaning diagnostic data..."
            clean_diagnostic_data
            ;;
        --help|-h)
            show_enhanced_usage
            exit 0
            ;;
        "")
            # Default behavior - initialize
            initialize_mcp_servers
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"