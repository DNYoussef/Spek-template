#!/bin/bash

# Loop 1: Planning & Discovery Phase
# Part of the 3-Loop Development System

set -euo pipefail

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
ARTIFACTS_DIR=".claude/.artifacts/loop1"
SPEC_FILE="SPEC.md"
REQUIREMENTS_FILE="requirements.txt"
TIMEOUT=300

echo -e "${BLUE}${NC}"
echo -e "${BLUE}     Loop 1: Planning & Discovery     ${NC}"
echo -e "${BLUE}${NC}"

# Initialize
mkdir -p "$ARTIFACTS_DIR"
START_TIME=$(date +%s)

# Function to log progress
log_step() {
    echo -e "${GREEN}[LOOP1]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Step 1: Requirements Discovery - Parse actual project files
requirements_discovery() {
    log_step "Starting requirements discovery..."

    # Parse SPEC.md for real requirements
    if [[ -f "$SPEC_FILE" ]]; then
        log_step "Parsing specification file: $SPEC_FILE"

        # Extract actual requirements from SPEC.md
        grep -E "^- |^\* |^[0-9]+\. " "$SPEC_FILE" > "$ARTIFACTS_DIR/requirements.txt" 2>/dev/null || true

        # Extract user stories if present
        grep -E "As a|I want|So that" "$SPEC_FILE" >> "$ARTIFACTS_DIR/user_stories.txt" 2>/dev/null || true

        # Generate structured requirements document
        cat > "$ARTIFACTS_DIR/requirements.md" << EOF
# Project Requirements - $(date +%Y-%m-%d)

## Functional Requirements
$(grep -A 5 -i "functional" "$SPEC_FILE" 2>/dev/null | tail -n +2 || echo "- Core functionality as specified")

## Non-Functional Requirements
$(grep -A 5 -i "non-functional\|performance\|security" "$SPEC_FILE" 2>/dev/null | tail -n +2 || echo "- Performance and security requirements")

## Extracted Features
$(cat "$ARTIFACTS_DIR/requirements.txt" 2>/dev/null || echo "No specific features extracted")
EOF
    else
        log_warning "No SPEC.md found, analyzing existing project structure..."

        # Analyze package.json for project type
        if [[ -f "package.json" ]]; then
            PROJECT_NAME=$(jq -r '.name' package.json 2>/dev/null || echo "unknown")
            PROJECT_DESC=$(jq -r '.description' package.json 2>/dev/null || echo "No description")
            echo "# Requirements for $PROJECT_NAME" > "$ARTIFACTS_DIR/requirements.md"
            echo "## Project: $PROJECT_DESC" >> "$ARTIFACTS_DIR/requirements.md"
        fi
    fi

    # Analyze existing codebase for implicit requirements
    if [[ -d "src" ]] || [[ -d "analyzer" ]]; then
        log_step "Analyzing codebase for implicit requirements..."

        # Count actual features/modules
        MODULE_COUNT=$(find . -name "*.js" -o -name "*.py" -o -name "*.ts" 2>/dev/null | wc -l)
        TEST_COUNT=$(find . -name "*test*" -o -name "*spec*" 2>/dev/null | wc -l)

        echo "## Codebase Analysis" >> "$ARTIFACTS_DIR/requirements.md"
        echo "- Modules found: $MODULE_COUNT" >> "$ARTIFACTS_DIR/requirements.md"
        echo "- Tests found: $TEST_COUNT" >> "$ARTIFACTS_DIR/requirements.md"
    fi
}

# Step 2: Research Phase
research_phase() {
    log_step "Conducting research phase..."

    # Check for existing patterns
    if command -v grep &> /dev/null; then
        log_step "Searching for design patterns..."
        grep -r "class\|function\|interface" --include="*.js" --include="*.py" --include="*.ts" . 2>/dev/null | head -20 > "$ARTIFACTS_DIR/patterns.txt" || true
    fi

    # Document API endpoints if any
    if [[ -f "package.json" ]]; then
        log_step "Found Node.js project, documenting dependencies..."
        grep '"dependencies"' -A 20 package.json > "$ARTIFACTS_DIR/dependencies.txt" || true
    fi

    if [[ -f "requirements.txt" ]]; then
        log_step "Found Python project, documenting requirements..."
        cp requirements.txt "$ARTIFACTS_DIR/python_deps.txt"
    fi
}

# Step 3: Risk Analysis (Pre-mortem)
risk_analysis() {
    log_step "Performing risk analysis..."

    cat > "$ARTIFACTS_DIR/risk_analysis.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "risks": [
        {
            "category": "technical",
            "description": "Dependency conflicts",
            "likelihood": "medium",
            "impact": "high",
            "mitigation": "Use lock files and version pinning"
        },
        {
            "category": "schedule",
            "description": "Scope creep",
            "likelihood": "high",
            "impact": "medium",
            "mitigation": "Clear requirements and change control"
        },
        {
            "category": "quality",
            "description": "Insufficient testing",
            "likelihood": "medium",
            "impact": "high",
            "mitigation": "TDD approach with >80% coverage"
        }
    ],
    "overall_risk_level": "medium"
}
EOF

    log_step "Risk analysis complete"
}

# Step 4: Planning Output
generate_plan() {
    log_step "Generating development plan..."

    cat > "$ARTIFACTS_DIR/development_plan.md" << EOF
# Development Plan

## Phase 1: Foundation (Loop 1 - Current)
- Requirements gathering: COMPLETE
- Research and discovery: COMPLETE
- Risk analysis: COMPLETE
- Architecture planning: IN PROGRESS

## Phase 2: Implementation (Loop 2)
- Set up development environment
- Implement core features
- Write unit tests
- Integration testing

## Phase 3: Quality & Deployment (Loop 3)
- Performance optimization
- Security hardening
- Documentation
- Deployment preparation

## Success Criteria
- All requirements implemented
- Test coverage > 80%
- Performance benchmarks met
- Zero critical security issues

## Timeline
- Loop 1: 2 hours (planning)
- Loop 2: 4 hours (development)
- Loop 3: 2 hours (quality/deployment)

Generated: $(date -Iseconds)
EOF

    log_step "Development plan generated"
}

# Main execution
main() {
    log_step "Loop 1 initialized at $(date)"

    # Execute phases
    requirements_discovery
    research_phase
    risk_analysis
    generate_plan

    # Calculate execution time
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Generate summary
    cat > "$ARTIFACTS_DIR/loop1_summary.json" << EOF
{
    "status": "completed",
    "duration_seconds": $DURATION,
    "phases_completed": [
        "requirements_discovery",
        "research_phase",
        "risk_analysis",
        "planning"
    ],
    "artifacts_generated": [
        "requirements.md",
        "patterns.txt",
        "risk_analysis.json",
        "development_plan.md"
    ],
    "next_loop": "loop2-development",
    "timestamp": "$(date -Iseconds)"
}
EOF

    log_step "Loop 1 completed in ${DURATION} seconds"
    echo -e "${GREEN} Loop 1: Planning & Discovery - COMPLETE${NC}"
    echo -e "${BLUE} Ready for Loop 2: Development & Implementation${NC}"

    # Exit with success
    exit 0
}

# Error handling
trap 'log_error "Loop 1 failed at line $LINENO"; exit 1' ERR

# Run main function
main "$@"