#!/bin/bash
# SPEK MCP Environment Validation Script
# Validates environment configuration for conditional MCP servers

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

# Function to check if environment variable is set and not empty
check_env_var() {
    local var_name="$1"
    local description="$2"
    local required="${3:-false}"
    
    if [[ -n "${!var_name}" ]]; then
        log_success "$var_name is set - $description"
        return 0
    else
        if [[ "$required" == "true" ]]; then
            log_error "$var_name is required but not set - $description"
            return 1
        else
            log_warning "$var_name is not set - $description (optional)"
            return 0
        fi
    fi
}

# Function to validate API key format
validate_api_key() {
    local var_name="$1"
    local expected_prefix="$2"
    local min_length="${3:-20}"
    
    local value="${!var_name}"
    
    if [[ -z "$value" ]]; then
        return 0  # Already handled by check_env_var
    fi
    
    if [[ ${#value} -lt $min_length ]]; then
        log_warning "$var_name appears too short (${#value} chars, expected >= $min_length)"
        return 1
    fi
    
    if [[ -n "$expected_prefix" ]] && [[ ! "$value" =~ ^$expected_prefix ]]; then
        log_warning "$var_name doesn't match expected prefix pattern ($expected_prefix*)"
        return 1
    fi
    
    log_success "$var_name format appears valid"
    return 0
}

# Function to test API endpoint connectivity
test_endpoint() {
    local url="$1"
    local description="$2"
    local timeout="${3:-10}"
    
    if command -v curl &> /dev/null; then
        if curl -s --max-time "$timeout" --head "$url" > /dev/null 2>&1; then
            log_success "$description endpoint is reachable"
            return 0
        else
            log_warning "$description endpoint is not reachable (network/firewall issue?)"
            return 1
        fi
    else
        log_warning "curl not available - skipping endpoint test for $description"
        return 0
    fi
}

# Main validation function
validate_mcp_environment() {
    log_info "=== SPEK MCP Environment Validation ==="
    
    local validation_errors=0
    local validation_warnings=0
    
    # Core AI Services - Required for full functionality
    log_info "Validating Core AI Services..."
    
    # Claude API Key
    if check_env_var "CLAUDE_API_KEY" "Claude Code API access" "false"; then
        validate_api_key "CLAUDE_API_KEY" "" 30 || ((validation_warnings++))
    fi
    
    # Gemini API Key (for large-context analysis)
    if check_env_var "GEMINI_API_KEY" "Gemini API for large-context analysis" "false"; then
        validate_api_key "GEMINI_API_KEY" "" 30 || ((validation_warnings++))
    fi
    
    # Project Management Integration
    log_info "Validating Project Management Integration..."
    
    # GitHub Project Manager Configuration
    if check_env_var "GITHUB_TOKEN" "GitHub Project Manager project management sync" "false"; then
        validate_api_key "GITHUB_TOKEN" "" 20 || ((validation_warnings++))
        
        # Additional Plane configuration
        check_env_var "GITHUB_API_URL" "Plane instance URL" "false"
        check_env_var "GITHUB_PROJECT_NUMBER" "Plane project ID" "false"
        check_env_var "GITHUB_OWNER_SLUG" "Plane workspace slug" "false"
        
        # Test Plane endpoint if configured
        if [[ -n "$GITHUB_API_URL" ]]; then
            test_endpoint "$GITHUB_API_URL/api/health" "Plane API" 5 || ((validation_warnings++))
        fi
    else
        log_info "GitHub Project Manager will be skipped (GITHUB_TOKEN not configured)"
    fi
    
    # GitHub Integration
    log_info "Validating GitHub Integration..."
    
    if check_env_var "GITHUB_TOKEN" "GitHub MCP integration" "false"; then
        validate_api_key "GITHUB_TOKEN" "ghp_" 40 || ((validation_warnings++))
        test_endpoint "https://api.github.com" "GitHub API" 5 || ((validation_warnings++))
    else
        log_warning "GitHub MCP will have limited functionality without GITHUB_TOKEN"
    fi
    
    # Security & Compliance
    log_info "Validating Security & Compliance..."
    
    if check_env_var "SEMGREP_TOKEN" "Semgrep security scanning" "false"; then
        validate_api_key "SEMGREP_TOKEN" "" 30 || ((validation_warnings++))
    fi
    
    # Quality Gates Configuration
    log_info "Validating Quality Gates Configuration..."
    
    check_env_var "GATES_PROFILE" "Quality gates profile (full/light/docs)" "false"
    
    # Development Settings
    log_info "Validating Development Settings..."
    
    check_env_var "NODE_ENV" "Node.js environment" "false"
    
    # Check for .env file
    if [[ -f ".env" ]]; then
        log_success ".env file found"
    else
        log_warning ".env file not found - using system environment variables only"
        ((validation_warnings++))
    fi
    
    # Summary
    log_info "=== Environment Validation Summary ==="
    
    if [[ $validation_errors -eq 0 ]]; then
        if [[ $validation_warnings -eq 0 ]]; then
            log_success "Environment validation passed with no issues!"
        else
            log_warning "Environment validation passed with $validation_warnings warnings"
            log_info "Warnings indicate optional configurations or potential issues"
        fi
    else
        log_error "Environment validation failed with $validation_errors errors and $validation_warnings warnings"
        return 1
    fi
    
    return 0
}

# Function to generate environment template
generate_env_template() {
    log_info "Generating .env template..."
    
    cat > .env.template << 'EOF'
# SPEK Template Environment Configuration

# =====================================
# AI SERVICES - REQUIRED FOR FULL FUNCTIONALITY
# =====================================

# Claude Code API Key (Primary AI engine)
CLAUDE_API_KEY=your_claude_api_key_here

# Gemini API Key (Large-context analysis)  
GEMINI_API_KEY=your_gemini_key_here

# =====================================
# PROJECT MANAGEMENT (CONDITIONAL MCP)
# =====================================

# Plane Project Management (enables GitHub Project Manager)
GITHUB_API_URL=https://your-plane-instance.com
GITHUB_TOKEN=your_plane_token
GITHUB_PROJECT_NUMBER=your_project_id
GITHUB_OWNER_SLUG=your_workspace
GITHUB_MILESTONE_ID=current_cycle_id

# =====================================
# GITHUB INTEGRATION
# =====================================

# GitHub Token (enhanced GitHub MCP functionality)
GITHUB_TOKEN=ghp_your_github_token

# =====================================
# SECURITY & COMPLIANCE
# =====================================

# Semgrep Security Scanning
SEMGREP_TOKEN=your_semgrep_token

# =====================================
# QUALITY GATES CONFIGURATION  
# =====================================

# Quality Gates Profile: full, light, docs
GATES_PROFILE=full

# Auto-repair settings
AUTO_REPAIR_MAX_ATTEMPTS=2
PM_SYNC_BLOCKING=true

# =====================================
# DEVELOPMENT SETTINGS
# =====================================

NODE_ENV=development
EOF
    
    log_success ".env.template created - copy to .env and configure"
}

# Function to show MCP server recommendations based on environment
show_mcp_recommendations() {
    log_info "=== MCP Server Recommendations ==="
    
    echo "Based on your environment configuration:"
    echo ""
    
    echo "[OK] Always Enabled (Core Infrastructure):"
    echo "  [U+2022] memory - Universal learning & persistence"
    echo "  [U+2022] sequential-thinking - Universal quality improvement"  
    echo "  [U+2022] claude-flow - Core swarm coordination"
    echo "  [U+2022] github - Universal Git/GitHub workflows"
    echo "  [U+2022] context7 - Large-context analysis"
    echo ""
    
    echo "[CYCLE] Conditionally Enabled:"
    if [[ -n "$GITHUB_TOKEN" ]]; then
        echo "  [OK] plane - Project management sync (GITHUB_TOKEN configured)"
    else
        echo "  [FAIL] plane - Project management sync (GITHUB_TOKEN not configured)"
    fi
    echo ""
    
    echo "[CLIPBOARD] On-Demand (Phase-Specific):"
    echo "  [U+2022] deepwiki - Research phase only"
    echo "  [U+2022] firecrawl - Research phase only"
    echo "  [U+2022] playwright - Verification phase only"
    echo "  [U+2022] eva - Quality scoring phase only"
}

# Main execution logic
main() {
    case "${1:-}" in
        --validate|-v)
            validate_mcp_environment
            ;;
        --template|-t)
            generate_env_template
            ;;
        --recommendations|-r)
            show_mcp_recommendations
            ;;
        --help|-h)
            echo "SPEK MCP Environment Validation Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --validate, -v       Validate current environment"
            echo "  --template, -t       Generate .env template"
            echo "  --recommendations, -r Show MCP server recommendations"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --validate        # Check environment configuration"
            echo "  $0 --template        # Generate .env template"
            echo "  $0 --recommendations # Show MCP recommendations"
            ;;
        "")
            # Default behavior - validate
            validate_mcp_environment
            echo ""
            show_mcp_recommendations
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"