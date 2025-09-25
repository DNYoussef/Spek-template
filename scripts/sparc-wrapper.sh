#!/bin/bash

# SPARC Wrapper - Cross-platform execution wrapper for SPARC methodology
# Provides intelligent fallback between claude-flow versions and local execution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SPARC_DIR=".roo"
SPARC_CONFIG="$SPARC_DIR/sparc-config.json"
ROOMODES=".roomodes"
ARTIFACTS_DIR="$SPARC_DIR/artifacts"
TEMPLATES_DIR="$SPARC_DIR/templates"
WORKFLOWS_DIR="$SPARC_DIR/workflows"

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check claude-flow version
check_claude_flow() {
    if command_exists npx; then
        # Try alpha version first
        if npx claude-flow@alpha --version 2>/dev/null | grep -q "alpha"; then
            echo "alpha"
            return 0
        fi

        # Try latest stable
        if npx claude-flow@latest --version 2>/dev/null; then
            echo "latest"
            return 0
        fi

        # Try any installed version
        if npx claude-flow --version 2>/dev/null; then
            echo "installed"
            return 0
        fi
    fi

    echo "none"
    return 1
}

# Function to initialize SPARC if not exists
init_sparc() {
    if [ ! -d "$SPARC_DIR" ]; then
        print_color "$YELLOW" "Initializing SPARC environment..."
        mkdir -p "$ARTIFACTS_DIR"
        mkdir -p "$TEMPLATES_DIR"
        mkdir -p "$WORKFLOWS_DIR"
        mkdir -p "$SPARC_DIR/logs"
        print_color "$GREEN" " SPARC directories created"
    fi

    if [ ! -f "$ROOMODES" ] && [ ! -f "$SPARC_CONFIG" ]; then
        print_color "$YELLOW" "SPARC configuration not found. Creating defaults..."

        # Create default .roomodes if not exists
        if [ ! -f "$ROOMODES" ]; then
            node -e "
            const config = {
                version: '2.0.0',
                name: 'SPARC Default Modes',
                modes: {
                    spec: { name: 'Specification', agents: ['specification'] },
                    architect: { name: 'Architecture', agents: ['architecture'] },
                    tdd: { name: 'TDD', agents: ['tester'] },
                    coder: { name: 'Implementation', agents: ['coder'] },
                    review: { name: 'Review', agents: ['reviewer'] }
                }
            };
            require('fs').writeFileSync('.roomodes', JSON.stringify(config, null, 2));
            "
            print_color "$GREEN" " Created .roomodes"
        fi
    fi
}

# Function to execute SPARC with claude-flow
execute_claude_flow() {
    local version=$1
    shift
    local cmd="$@"

    case $version in
        alpha)
            npx claude-flow@alpha sparc $cmd
            ;;
        latest)
            npx claude-flow@latest sparc $cmd
            ;;
        installed)
            npx claude-flow sparc $cmd
            ;;
        *)
            return 1
            ;;
    esac
}

# Function to execute SPARC with local executor
execute_local() {
    local executor="scripts/sparc-executor.js"

    if [ -f "$executor" ]; then
        node "$executor" "$@"
    else
        print_color "$RED" "Error: Local SPARC executor not found at $executor"
        print_color "$YELLOW" "Run 'npm run sparc:setup' to install the executor"
        exit 1
    fi
}

# Function to list available modes
list_modes() {
    print_color "$BLUE" "\n Available SPARC Modes:\n"

    if [ -f "$ROOMODES" ]; then
        node -e "
        const config = JSON.parse(require('fs').readFileSync('.roomodes', 'utf8'));
        const modes = config.modes || {};
        Object.entries(modes).forEach(([key, mode]) => {
            console.log('   ' + key.padEnd(15) + ' - ' + (mode.name || key));
            if (mode.agents) {
                console.log('     Agents: ' + mode.agents.join(', '));
            }
        });
        "
    else
        # Fallback to default modes
        cat <<EOF
   spec           - Specification phase
   architect      - Architecture design
   tdd            - Test-driven development
   coder          - Implementation
   review         - Code review
   test           - Testing
   debug          - Debugging
   optimize       - Optimization
   document       - Documentation
EOF
    fi

    echo
    print_color "$GREEN" "Usage: sparc <mode> \"<task>\""
    print_color "$GREEN" "Example: sparc spec \"User authentication system\""
}

# Function to run a specific mode
run_mode() {
    local mode=$1
    local task=$2
    shift 2
    local options="$@"

    print_color "$BLUE" "\n Executing SPARC Mode: $mode"
    print_color "$BLUE" "   Task: $task"

    # Check claude-flow availability
    local cf_version=$(check_claude_flow)

    if [ "$cf_version" != "none" ]; then
        print_color "$GREEN" "   Using claude-flow ($cf_version)"

        # Try claude-flow execution
        if execute_claude_flow "$cf_version" "run $mode \"$task\" $options"; then
            print_color "$GREEN" " Execution completed successfully"
            return 0
        else
            print_color "$YELLOW" " Claude-flow execution failed, falling back to local executor"
        fi
    else
        print_color "$YELLOW" "   Claude-flow not available, using local executor"
    fi

    # Fallback to local executor
    execute_local "run" "$mode" "$task" $options
}

# Function to run a workflow
run_workflow() {
    local workflow=$1

    print_color "$BLUE" "\n Running SPARC Workflow: $workflow"

    # Check if workflow file exists
    if [ ! -f "$WORKFLOWS_DIR/$workflow.json" ]; then
        print_color "$RED" "Error: Workflow '$workflow' not found"
        print_color "$YELLOW" "Available workflows:"
        ls -1 "$WORKFLOWS_DIR"/*.json 2>/dev/null | xargs -n1 basename | sed 's/\.json$//'
        exit 1
    fi

    # Try with claude-flow first
    local cf_version=$(check_claude_flow)

    if [ "$cf_version" != "none" ]; then
        if execute_claude_flow "$cf_version" "workflow $workflow"; then
            print_color "$GREEN" " Workflow completed successfully"
            return 0
        fi
    fi

    # Fallback to local executor
    execute_local "workflow" "$workflow"
}

# Function to validate quality gates
validate_gates() {
    print_color "$BLUE" "\n Validating Quality Gates..."

    # Try with claude-flow first
    local cf_version=$(check_claude_flow)

    if [ "$cf_version" != "none" ]; then
        if execute_claude_flow "$cf_version" "validate"; then
            return 0
        fi
    fi

    # Fallback to local executor
    execute_local "validate"
}

# Main command handler
main() {
    # Initialize SPARC if needed
    init_sparc

    # Parse command
    case "${1:-help}" in
        modes|list)
            list_modes
            ;;

        run|exec)
            shift
            if [ $# -lt 2 ]; then
                print_color "$RED" "Error: Missing arguments"
                print_color "$YELLOW" "Usage: sparc run <mode> \"<task>\" [options]"
                exit 1
            fi
            run_mode "$@"
            ;;

        workflow)
            shift
            run_workflow "${1:-sparc-tdd}"
            ;;

        validate|gates|quality)
            validate_gates
            ;;

        init|setup)
            print_color "$GREEN" "SPARC environment initialized"
            ;;

        help|--help|-h)
            cat <<EOF
$(print_color "$BLUE" "SPARC Wrapper - Intelligent SPARC methodology executor")

$(print_color "$GREEN" "Usage:")
  sparc <command> [options]

$(print_color "$GREEN" "Commands:")
  modes              List all available SPARC modes
  run <mode> <task>  Execute a specific SPARC mode
  workflow <name>    Run a SPARC workflow
  validate           Check quality gates
  init               Initialize SPARC environment
  help               Show this help message

$(print_color "$GREEN" "Shortcuts:")
  sparc <mode> <task>  Shorthand for 'sparc run <mode> <task>'

$(print_color "$GREEN" "Options:")
  --verbose, -v      Show detailed output
  --parallel, -p     Enable parallel execution
  --dry-run          Simulate execution without making changes

$(print_color "$GREEN" "Examples:")
  sparc modes
  sparc spec "User authentication system"
  sparc run tdd "Payment processing module"
  sparc workflow sparc-tdd
  sparc validate

$(print_color "$GREEN" "Configuration Files:")
  .roomodes               - SPARC modes configuration
  .roo/sparc-config.json  - Main SPARC settings
  .roo/templates/         - Mode templates
  .roo/workflows/         - Workflow definitions

$(print_color "$YELLOW" "Note:")
This wrapper automatically detects and uses the best available SPARC executor:
1. claude-flow@alpha (if available)
2. claude-flow@latest (if alpha unavailable)
3. Local SPARC executor (fallback)
EOF
            ;;

        *)
            # Assume it's a mode shorthand (e.g., "sparc spec 'task'")
            if [ $# -ge 2 ]; then
                run_mode "$@"
            else
                print_color "$RED" "Unknown command: $1"
                print_color "$YELLOW" "Run 'sparc help' for usage information"
                exit 1
            fi
            ;;
    esac
}

# Execute main function
main "$@"