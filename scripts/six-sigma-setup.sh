#!/bin/bash
# Six Sigma CI/CD Setup Script
# Configures repository for Six Sigma metrics integration

set -e

echo "[TARGET] Setting up Six Sigma CI/CD Integration"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_ROOT=$(git rev-parse --show-toplevel)
SIXSIGMA_DIR="$REPO_ROOT/.six-sigma-config"
ARTIFACTS_DIR="$REPO_ROOT/.claude/.artifacts/sixsigma"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create necessary directories
create_directories() {
    print_status "Creating Six Sigma directory structure"

    mkdir -p "$SIXSIGMA_DIR"
    mkdir -p "$ARTIFACTS_DIR"
    mkdir -p "$REPO_ROOT/.six-sigma-metrics/{raw,processed,charts,reports}"

    print_success "Directory structure created"
}

# Generate Six Sigma configuration
generate_config() {
    print_status "Generating Six Sigma configuration"

    cat > "$SIXSIGMA_DIR/config.json" << 'EOF'
{
  "version": "1.0.0",
  "targetSigma": 4.5,
  "dpmoThreshold": 1500,
  "rtyThreshold": 99.8,
  "performanceThreshold": 1.2,
  "executionTimeLimit": 120000,
  "enableSPCCharts": true,
  "enablePerformanceMonitoring": true,
  "enableRealTimeDashboard": true,
  "ctqSpecifications": {
    "codeQuality": {
      "weight": 0.25,
      "target": 90,
      "upperLimit": 100,
      "lowerLimit": 80,
      "category": "quality"
    },
    "testCoverage": {
      "weight": 0.20,
      "target": 90,
      "upperLimit": 100,
      "lowerLimit": 85,
      "category": "quality"
    },
    "securityScore": {
      "weight": 0.20,
      "target": 95,
      "upperLimit": 100,
      "lowerLimit": 90,
      "category": "security"
    },
    "performanceScore": {
      "weight": 0.20,
      "target": 200,
      "upperLimit": 500,
      "lowerLimit": 100,
      "category": "performance"
    },
    "complianceScore": {
      "weight": 0.15,
      "target": 95,
      "upperLimit": 100,
      "lowerLimit": 90,
      "category": "compliance"
    }
  },
  "spcChartConfig": {
    "controlLimits": "3-sigma",
    "trendDetection": true,
    "patternRecognition": true,
    "violationRules": ["nelson-rules", "western-electric"]
  },
  "performanceMonitoring": {
    "overhead": {
      "maxPercentage": 1.2,
      "measurementInterval": 1000
    },
    "executionTime": {
      "maxDuration": 120000,
      "warningThreshold": 90000
    },
    "memoryUsage": {
      "maxHeapUsage": 512,
      "warningThreshold": 400
    }
  },
  "alerting": {
    "thresholdViolations": true,
    "performanceIssues": true,
    "processInstability": true,
    "qualityDegradation": true
  }
}
EOF

    print_success "Six Sigma configuration generated at $SIXSIGMA_DIR/config.json"
}

# Generate environment-specific configurations
generate_environment_configs() {
    print_status "Generating environment-specific configurations"

    # Development environment
    cat > "$SIXSIGMA_DIR/development.json" << 'EOF'
{
  "extends": "./config.json",
  "targetSigma": 4.0,
  "dpmoThreshold": 6210,
  "rtyThreshold": 99.0,
  "performanceThreshold": 2.0,
  "ctqSpecifications": {
    "codeQuality": { "target": 85, "lowerLimit": 75 },
    "testCoverage": { "target": 85, "lowerLimit": 80 },
    "securityScore": { "target": 90, "lowerLimit": 85 },
    "performanceScore": { "target": 300, "upperLimit": 600 },
    "complianceScore": { "target": 90, "lowerLimit": 85 }
  }
}
EOF

    # Staging environment
    cat > "$SIXSIGMA_DIR/staging.json" << 'EOF'
{
  "extends": "./config.json",
  "targetSigma": 4.5,
  "dpmoThreshold": 1500,
  "rtyThreshold": 99.5,
  "performanceThreshold": 1.5,
  "ctqSpecifications": {
    "codeQuality": { "target": 88, "lowerLimit": 83 },
    "testCoverage": { "target": 88, "lowerLimit": 85 },
    "securityScore": { "target": 93, "lowerLimit": 90 },
    "performanceScore": { "target": 250, "upperLimit": 400 },
    "complianceScore": { "target": 93, "lowerLimit": 90 }
  }
}
EOF

    # Production environment
    cat > "$SIXSIGMA_DIR/production.json" << 'EOF'
{
  "extends": "./config.json",
  "targetSigma": 5.0,
  "dpmoThreshold": 233,
  "rtyThreshold": 99.9,
  "performanceThreshold": 1.0,
  "ctqSpecifications": {
    "codeQuality": { "target": 95, "lowerLimit": 90 },
    "testCoverage": { "target": 95, "lowerLimit": 90 },
    "securityScore": { "target": 98, "lowerLimit": 95 },
    "performanceScore": { "target": 150, "upperLimit": 300 },
    "complianceScore": { "target": 98, "lowerLimit": 95 }
  }
}
EOF

    print_success "Environment-specific configurations generated"
}

# Validate existing Six Sigma components
validate_components() {
    print_status "Validating Six Sigma components"

    local components=(
        "analyzer/enterprise/sixsigma/dpmo-calculator.js"
        "analyzer/enterprise/sixsigma/spc-chart-generator.js"
        "analyzer/enterprise/sixsigma/performance-monitor.js"
        "src/domains/quality-gates/metrics/SixSigmaMetrics.ts"
    )

    local missing_components=()

    for component in "${components[@]}"; do
        if [[ -f "$REPO_ROOT/$component" ]]; then
            print_success "Found: $component"
        else
            print_warning "Missing: $component"
            missing_components+=("$component")
        fi
    done

    if [[ ${#missing_components[@]} -gt 0 ]]; then
        print_error "Missing ${#missing_components[@]} Six Sigma components"
        print_error "Please ensure all components are properly installed"
        return 1
    fi

    print_success "All Six Sigma components validated"
}

# Generate GitHub Actions workflow if missing
check_workflow() {
    print_status "Checking Six Sigma workflow"

    local workflow_file="$REPO_ROOT/.github/workflows/six-sigma-metrics.yml"

    if [[ -f "$workflow_file" ]]; then
        print_success "Six Sigma workflow found at $workflow_file"
    else
        print_warning "Six Sigma workflow not found"
        print_warning "Please run the workflow creation process"
    fi
}

# Set up Git hooks (optional)
setup_git_hooks() {
    print_status "Setting up Git hooks for Six Sigma"

    local hooks_dir="$REPO_ROOT/.git/hooks"

    # Pre-commit hook for basic validation
    cat > "$hooks_dir/pre-commit" << 'EOF'
#!/bin/bash
# Six Sigma Pre-commit Hook

echo "[TARGET] Running Six Sigma pre-commit validation"

# Basic configuration validation
if [[ -f ".six-sigma-config/config.json" ]]; then
    if ! node -e "JSON.parse(require('fs').readFileSync('.six-sigma-config/config.json', 'utf8'))" 2>/dev/null; then
        echo "[FAIL] Invalid Six Sigma configuration JSON"
        exit 1
    fi
    echo "[OK] Six Sigma configuration valid"
fi

echo "[OK] Pre-commit validation passed"
EOF

    chmod +x "$hooks_dir/pre-commit"
    print_success "Git hooks configured"
}

# Generate documentation
generate_documentation() {
    print_status "Generating Six Sigma documentation"

    cat > "$SIXSIGMA_DIR/README.md" << 'EOF'
# Six Sigma Configuration

This directory contains Six Sigma CI/CD integration configuration files.

## Files

- `config.json` - Base Six Sigma configuration
- `development.json` - Development environment overrides
- `staging.json` - Staging environment overrides
- `production.json` - Production environment overrides

## Configuration Schema

### Core Settings
- `targetSigma`: Target sigma level (1.0-6.0)
- `dpmoThreshold`: Maximum DPMO threshold
- `rtyThreshold`: Minimum RTY percentage
- `performanceThreshold`: Maximum performance overhead percentage

### CTQ Specifications
Each CTQ (Critical-to-Quality) characteristic includes:
- `weight`: Relative importance (0.0-1.0)
- `target`: Target value
- `upperLimit`: Upper specification limit
- `lowerLimit`: Lower specification limit
- `category`: CTQ category (quality, security, performance, compliance)

## Usage

The Six Sigma workflow automatically selects the appropriate configuration based on:
1. Workflow dispatch input (`environment` parameter)
2. Branch name pattern matching
3. Default to development environment

## Customization

To customize for your project:
1. Adjust CTQ specifications in `config.json`
2. Modify environment-specific overrides
3. Update threshold values based on historical data
4. Configure alerting preferences

## Monitoring

Six Sigma metrics are collected and stored in:
- `.six-sigma-metrics/raw/` - Raw analysis data
- `.six-sigma-metrics/processed/` - DPMO calculations
- `.six-sigma-metrics/charts/` - SPC charts
- `.six-sigma-metrics/reports/` - Final reports
EOF

    print_success "Documentation generated at $SIXSIGMA_DIR/README.md"
}

# Generate package.json scripts if needed
update_package_scripts() {
    print_status "Checking package.json for Six Sigma scripts"

    if [[ -f "$REPO_ROOT/package.json" ]]; then
        # Check if Six Sigma scripts exist
        if ! grep -q "six-sigma" "$REPO_ROOT/package.json"; then
            print_status "Adding Six Sigma scripts to package.json"

            # This would require jq or similar for proper JSON manipulation
            print_warning "Please manually add these scripts to package.json:"
            cat << 'EOF'
{
  "scripts": {
    "six-sigma:validate": "node scripts/validate-six-sigma-config.js",
    "six-sigma:test": "npm test && node analyzer/enterprise/sixsigma/dpmo-calculator.js",
    "six-sigma:report": "node analyzer/enterprise/sixsigma/report-generator.js",
    "benchmark": "node scripts/performance-benchmark.js"
  }
}
EOF
        else
            print_success "Six Sigma scripts already configured in package.json"
        fi
    fi
}

# Create sample data for testing
create_sample_data() {
    print_status "Creating sample test data"

    mkdir -p "$ARTIFACTS_DIR/samples"

    # Sample DPMO calculation result
    cat > "$ARTIFACTS_DIR/samples/sample-dpmo-result.json" << 'EOF'
{
  "timestamp": "2024-01-01T00:00:00Z",
  "dpmo": {
    "code-quality": {
      "value": 1200,
      "defectRate": 0.12,
      "yieldRate": 99.88,
      "opportunities": 1000,
      "unitsProduced": 1,
      "defectsFound": 1.2
    }
  },
  "rty": {
    "code-quality": {
      "rty": 99.88,
      "fty": 99.88,
      "processSteps": 1,
      "overallYield": 99.88
    }
  },
  "sigmaLevels": {
    "code-quality": {
      "sigmaLevel": 4.8,
      "exactSigma": 4.75,
      "dpmoThreshold": 1200,
      "yieldThreshold": 99.88,
      "classification": "EXCELLENT",
      "improvement": {
        "sigmaGap": 0,
        "improvementNeeded": false,
        "effort": "LOW"
      }
    }
  },
  "processMetrics": {
    "overallDPMO": 1200,
    "overallSigma": 4.75,
    "targetSigma": 4.5,
    "processRTY": 99.88,
    "processYield": 99.88,
    "ctqCount": 1,
    "performanceGap": -0.25,
    "costOfPoorQuality": {
      "percentage": 1.2,
      "category": "LOW",
      "potentialSavings": 0.84
    }
  }
}
EOF

    print_success "Sample data created"
}

# Main setup function
main() {
    echo "[TARGET] Six Sigma CI/CD Integration Setup"
    echo "=================================="
    echo

    # Run setup steps
    create_directories
    generate_config
    generate_environment_configs
    validate_components
    check_workflow
    setup_git_hooks
    generate_documentation
    update_package_scripts
    create_sample_data

    echo
    echo "[OK] Six Sigma CI/CD Integration Setup Complete!"
    echo
    print_success "Configuration files created in: $SIXSIGMA_DIR"
    print_success "Sample data available in: $ARTIFACTS_DIR/samples"
    echo
    print_status "Next steps:"
    echo "1. Review and customize configuration files"
    echo "2. Test the Six Sigma workflow with a commit"
    echo "3. Monitor metrics in GitHub Actions"
    echo "4. Adjust thresholds based on baseline data"
    echo
    print_status "Workflow trigger command:"
    echo "gh workflow run six-sigma-metrics.yml --ref main"
    echo
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi