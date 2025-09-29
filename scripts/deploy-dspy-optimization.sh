#!/bin/bash

# DSPy Optimization Deployment Script
# Automated deployment of the Master DSPy Template system for 87 SPEK agents

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INVENTORY_PATH="$PROJECT_ROOT/.claude/.artifacts/agent-inventory-complete.json"
OUTPUT_DIR="$PROJECT_ROOT/output/optimized-agents"
BACKUP_DIR="$PROJECT_ROOT/backups/agent-configs"
LOG_DIR="$PROJECT_ROOT/logs/optimization"
REPORTS_DIR="$PROJECT_ROOT/reports/dspy-optimization"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Create required directories
setup_directories() {
    log "Setting up directory structure..."

    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$PROJECT_ROOT/temp/canary-tests"

    # Set proper permissions
    chmod 755 "$OUTPUT_DIR" "$BACKUP_DIR" "$LOG_DIR" "$REPORTS_DIR"

    log_success "Directory structure created"
}

# Pre-flight system checks
pre_flight_checks() {
    log "Running pre-flight checks..."

    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"

    if ! printf '%s\n%s\n' "$required_version" "$node_version" | sort -V -C; then
        log_error "Node.js version $node_version is too old. Required: $required_version"
        exit 1
    fi

    log_success "Node.js version: $node_version ✓"

    # Check Python version
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version | cut -d' ' -f2)
        log_success "Python version: $python_version ✓"
    else
        log_warning "Python3 not found - DSPy features may be limited"
    fi

    # Check available disk space (require 2GB)
    local available_space=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
    local required_space=$((2 * 1024 * 1024)) # 2GB in KB

    if [ "$available_space" -lt "$required_space" ]; then
        log_error "Insufficient disk space. Required: 2GB, Available: $(( available_space / 1024 / 1024 ))GB"
        exit 1
    fi

    log_success "Disk space: $(( available_space / 1024 / 1024 ))GB available ✓"

    # Check memory (require 4GB)
    local available_memory=$(free -k | grep '^Mem:' | awk '{print $2}')
    local required_memory=$((4 * 1024 * 1024)) # 4GB in KB

    if [ "$available_memory" -lt "$required_memory" ]; then
        log_warning "Low memory detected. Required: 4GB, Available: $(( available_memory / 1024 / 1024 ))GB"
    else
        log_success "Memory: $(( available_memory / 1024 / 1024 ))GB available ✓"
    fi

    # Check agent inventory
    if [ ! -f "$INVENTORY_PATH" ]; then
        log_error "Agent inventory not found: $INVENTORY_PATH"
        exit 1
    fi

    local agent_count=$(node -e "
        const fs = require('fs');
        const inventory = JSON.parse(fs.readFileSync('$INVENTORY_PATH', 'utf-8'));
        console.log(Object.keys(inventory.agents).length);
    ")

    if [ "$agent_count" -ne 87 ]; then
        log_error "Expected 87 agents, found $agent_count in inventory"
        exit 1
    fi

    log_success "Agent inventory: $agent_count agents ✓"

    # Check template system
    if [ ! -f "$PROJECT_ROOT/src/dspy-integration/templates/MasterAgentTemplate.ts" ]; then
        log_error "Master template not found"
        exit 1
    fi

    log_success "Template system files ✓"

    # Test template system loading
    if ! node -e "
        try {
            require('$PROJECT_ROOT/src/dspy-integration/templates/MasterAgentTemplate.ts');
            console.log('Template system loads successfully');
        } catch (error) {
            console.error('Template system error:', error.message);
            process.exit(1);
        }
    " >/dev/null 2>&1; then
        log_error "Template system failed to load"
        exit 1
    fi

    log_success "Template system functionality ✓"

    log_success "All pre-flight checks passed"
}

# Install and verify dependencies
install_dependencies() {
    log "Installing dependencies..."

    # Install Node.js dependencies
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        cd "$PROJECT_ROOT"
        npm install --silent
        log_success "Node.js dependencies installed"
    fi

    # Install Python dependencies if requirements exist
    if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
        if command -v pip3 &> /dev/null; then
            pip3 install -r "$PROJECT_ROOT/requirements.txt" --quiet
            log_success "Python dependencies installed"
        else
            log_warning "pip3 not found - Python dependencies not installed"
        fi
    fi
}

# Create configuration files
create_configurations() {
    log "Creating optimization configuration..."

    cat > "$PROJECT_ROOT/config/dspy-optimization-config.json" << 'EOF'
{
  "batchSize": 10,
  "maxRetries": 3,
  "rollbackOnFailure": true,
  "validateBeforeDeployment": true,
  "enableCanaryDeployment": true,
  "phaseDelayMs": 5000,
  "qualityGateThresholds": {
    "nasa_compliance": 100,
    "fsm_pattern_usage": 95,
    "production_quality": 98,
    "theater_score_max": 60,
    "type_safety": 100,
    "test_coverage_min": 80
  },
  "maxOptimizationTimeMs": 300000,
  "maxMemoryUsageMB": 2048,
  "maxConcurrentOptimizations": 3
}
EOF

    log_success "Configuration file created"
}

# Create backup of current agent configurations
create_backup() {
    log "Creating backup of current agent configurations..."

    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_path="$BACKUP_DIR/pre_optimization_$backup_timestamp"

    mkdir -p "$backup_path"

    # Backup agent configuration files
    if [ -d "$PROJECT_ROOT/src/flow/config/agent" ]; then
        cp -r "$PROJECT_ROOT/src/flow/config/agent" "$backup_path/"
        log_success "Agent configurations backed up to $backup_path"
    fi

    # Backup current prompts
    if [ -d "$PROJECT_ROOT/src/flow/prompts" ]; then
        cp -r "$PROJECT_ROOT/src/flow/prompts" "$backup_path/"
        log_success "Agent prompts backed up"
    fi

    # Create backup manifest
    cat > "$backup_path/backup_manifest.json" << EOF
{
  "timestamp": "$backup_timestamp",
  "purpose": "Pre-DSPy optimization backup",
  "agent_count": $(node -e "
    const fs = require('fs');
    const inventory = JSON.parse(fs.readFileSync('$INVENTORY_PATH', 'utf-8'));
    console.log(Object.keys(inventory.agents).length);
  "),
  "backup_path": "$backup_path",
  "restore_command": "./scripts/restore-agent-backup.sh $backup_timestamp"
}
EOF

    echo "$backup_path" > "$PROJECT_ROOT/.last_backup_path"
    log_success "Backup completed: $backup_path"
}

# Run optimization phases
run_optimization() {
    log "Starting DSPy optimization process..."

    local start_time=$(date +%s)
    local log_file="$LOG_DIR/optimization_$(date +%Y%m%d_%H%M%S).log"

    # Create optimization runner
    cat > "$PROJECT_ROOT/temp/run-optimization.js" << 'EOF'
const { BatchOptimizationEngine } = require('../src/dspy-integration/templates/BatchOptimizationEngine');
const fs = require('fs');
const path = require('path');

async function runFullOptimization() {
    const config = JSON.parse(fs.readFileSync('config/dspy-optimization-config.json', 'utf-8'));

    const engine = new BatchOptimizationEngine(config);

    console.log('🚀 Starting batch optimization of 87 SPEK agents...');

    try {
        const result = await engine.optimizeAllAgents(
            '.claude/.artifacts/agent-inventory-complete.json',
            'output/optimized-agents'
        );

        console.log('\n📊 Optimization Results:');
        console.log(`   Total agents: ${result.totalAgents}`);
        console.log(`   Successful: ${result.successfulOptimizations}`);
        console.log(`   Failed: ${result.failedOptimizations}`);
        console.log(`   Rolled back: ${result.rolledBackOptimizations}`);
        console.log(`   Success rate: ${(result.successfulOptimizations / result.totalAgents * 100).toFixed(1)}%`);

        // Save detailed results
        fs.writeFileSync(
            'reports/dspy-optimization/batch-optimization-results.json',
            JSON.stringify(result, null, 2)
        );

        if (result.failedOptimizations > 0) {
            console.error('\n❌ Optimization completed with failures');
            process.exit(1);
        } else {
            console.log('\n✅ Optimization completed successfully');
            process.exit(0);
        }

    } catch (error) {
        console.error('\n💥 Optimization failed:', error.message);
        process.exit(1);
    }
}

runFullOptimization();
EOF

    cd "$PROJECT_ROOT"

    # Run optimization with logging
    if node temp/run-optimization.js 2>&1 | tee "$log_file"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        log_success "Optimization completed successfully in ${duration}s"

        # Clean up temp file
        rm -f temp/run-optimization.js

        return 0
    else
        log_error "Optimization failed - check log: $log_file"
        return 1
    fi
}

# Run comprehensive validation
run_validation() {
    log "Running comprehensive validation..."

    # Create validation runner
    cat > "$PROJECT_ROOT/temp/run-validation.js" << 'EOF'
const { TemplateValidator } = require('../src/dspy-integration/templates/TemplateValidator');
const fs = require('fs');
const path = require('path');

async function runComprehensiveValidation() {
    const validator = new TemplateValidator();
    const outputDir = 'output/optimized-agents';

    console.log('🔍 Running comprehensive validation...');

    try {
        // Get all optimized template files
        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('-optimized.py'));

        console.log(`   Found ${files.length} optimized templates`);

        const results = [];
        let passCount = 0;
        let failCount = 0;
        let totalViolations = 0;

        for (const file of files) {
            const agentId = file.replace('-optimized.py', '');
            const templatePath = path.join(outputDir, file);

            const report = await validator.validateTemplate(templatePath, agentId);
            results.push(report);

            if (report.overallStatus === 'PASS') {
                passCount++;
                console.log(`   ✅ ${agentId}: PASS (${report.overallScore.toFixed(1)}%)`);
            } else {
                failCount++;
                totalViolations += report.criticalViolations;
                console.log(`   ❌ ${agentId}: ${report.overallStatus} (${report.overallScore.toFixed(1)}%) - ${report.criticalViolations} critical violations`);
            }
        }

        // Generate summary report
        const summaryReport = {
            timestamp: new Date().toISOString(),
            totalAgents: results.length,
            passCount,
            failCount,
            successRate: passCount / results.length * 100,
            totalCriticalViolations: totalViolations,
            averageScore: results.reduce((sum, r) => sum + r.overallScore, 0) / results.length,
            detailedResults: results
        };

        // Save validation report
        fs.writeFileSync(
            'reports/dspy-optimization/validation-report.json',
            JSON.stringify(summaryReport, null, 2)
        );

        console.log('\n📊 Validation Summary:');
        console.log(`   Total agents validated: ${results.length}`);
        console.log(`   Passed: ${passCount}`);
        console.log(`   Failed: ${failCount}`);
        console.log(`   Success rate: ${summaryReport.successRate.toFixed(1)}%`);
        console.log(`   Average score: ${summaryReport.averageScore.toFixed(1)}%`);
        console.log(`   Critical violations: ${totalViolations}`);

        // Quality gate evaluation
        const qualityGates = {
            successRate: summaryReport.successRate >= 95,
            averageScore: summaryReport.averageScore >= 95,
            criticalViolations: totalViolations === 0
        };

        console.log('\n🚪 Quality Gates:');
        console.log(`   Success rate ≥95%: ${qualityGates.successRate ? '✅' : '❌'} (${summaryReport.successRate.toFixed(1)}%)`);
        console.log(`   Average score ≥95%: ${qualityGates.averageScore ? '✅' : '❌'} (${summaryReport.averageScore.toFixed(1)}%)`);
        console.log(`   Zero critical violations: ${qualityGates.criticalViolations ? '✅' : '❌'} (${totalViolations})`);

        const allGatesPassed = Object.values(qualityGates).every(passed => passed);

        if (allGatesPassed) {
            console.log('\n🎉 All quality gates passed! System ready for deployment.');
            process.exit(0);
        } else {
            console.log('\n⚠️  Quality gates failed. Review issues before deployment.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 Validation failed:', error.message);
        process.exit(1);
    }
}

runComprehensiveValidation();
EOF

    cd "$PROJECT_ROOT"

    if node temp/run-validation.js; then
        log_success "Validation completed successfully"
        rm -f temp/run-validation.js
        return 0
    else
        log_error "Validation failed"
        return 1
    fi
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."

    local report_file="$REPORTS_DIR/deployment-report-$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# DSPy Optimization Deployment Report

**Date**: $(date)
**System**: SPEK Enhanced Development Platform
**Operation**: Master DSPy Template Deployment

## Summary

- **Total Agents**: 87
- **Optimization Success Rate**: $(cat "$REPORTS_DIR/batch-optimization-results.json" 2>/dev/null | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
    console.log((data.successfulOptimizations / data.totalAgents * 100).toFixed(1) + '%');
  " 2>/dev/null || echo "N/A")
- **Validation Success Rate**: $(cat "$REPORTS_DIR/validation-report.json" 2>/dev/null | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
    console.log(data.successRate.toFixed(1) + '%');
  " 2>/dev/null || echo "N/A")
- **Deployment Status**: $([ -f "$REPORTS_DIR/validation-report.json" ] && echo "✅ SUCCESS" || echo "❌ FAILED")

## Quality Metrics

### NASA Rule 10 Compliance
- **Status**: 100% Required
- **Achievement**: $(cat "$REPORTS_DIR/validation-report.json" 2>/dev/null | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
    const nasaCompliant = data.detailedResults.filter(r => r.categoryScores.nasa_rule_10 >= 100).length;
    console.log((nasaCompliant / data.totalAgents * 100).toFixed(1) + '%');
  " 2>/dev/null || echo "N/A")

### FSM Pattern Usage
- **Status**: ≥95% Required
- **Achievement**: $(cat "$REPORTS_DIR/validation-report.json" 2>/dev/null | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
    const avgFSM = data.detailedResults.reduce((sum, r) => sum + (r.categoryScores.fsm_patterns || 0), 0) / data.totalAgents;
    console.log(avgFSM.toFixed(1) + '%');
  " 2>/dev/null || echo "N/A")

### Production Quality
- **Status**: ≥98% Required
- **Achievement**: $(cat "$REPORTS_DIR/validation-report.json" 2>/dev/null | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
    const avgQuality = data.detailedResults.reduce((sum, r) => sum + (r.categoryScores.production_quality || 0), 0) / data.totalAgents;
    console.log(avgQuality.toFixed(1) + '%');
  " 2>/dev/null || echo "N/A")

### Theater Detection
- **Status**: <60 Required (Lower is Better)
- **Achievement**: $(cat "$REPORTS_DIR/validation-report.json" 2>/dev/null | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
    const avgTheater = data.detailedResults.reduce((sum, r) => sum + (r.categoryScores.theater_detection || 0), 0) / data.totalAgents;
    console.log(avgTheater.toFixed(1));
  " 2>/dev/null || echo "N/A")

## Files Generated

- **Optimized Templates**: $OUTPUT_DIR/
- **Backup Location**: $(cat "$PROJECT_ROOT/.last_backup_path" 2>/dev/null || echo "Not available")
- **Validation Reports**: $REPORTS_DIR/
- **Optimization Logs**: $LOG_DIR/

## Next Steps

1. **If Successful**: Deploy to staging environment for integration testing
2. **If Failed**: Review validation failures and re-run optimization
3. **Monitoring**: Set up continuous monitoring for optimized agents
4. **Documentation**: Update agent documentation with new capabilities

## Rollback Instructions

If rollback is needed:

\`\`\`bash
./scripts/restore-agent-backup.sh $(basename $(cat "$PROJECT_ROOT/.last_backup_path" 2>/dev/null | cut -d'_' -f3-) 2>/dev/null || echo "latest")
\`\`\`

---

*Report generated by DSPy Optimization Deployment Script*
EOF

    log_success "Deployment report generated: $report_file"

    # Display report summary
    echo ""
    echo "==============================================="
    echo "       DEPLOYMENT REPORT SUMMARY"
    echo "==============================================="
    cat "$report_file" | grep -A 20 "## Summary"
}

# Rollback function (in case of failure)
rollback() {
    log_warning "Initiating rollback procedure..."

    if [ -f "$PROJECT_ROOT/.last_backup_path" ]; then
        local backup_path=$(cat "$PROJECT_ROOT/.last_backup_path")

        if [ -d "$backup_path" ]; then
            log "Restoring from backup: $backup_path"

            # Restore agent configurations
            if [ -d "$backup_path/agent" ]; then
                rm -rf "$PROJECT_ROOT/src/flow/config/agent"
                cp -r "$backup_path/agent" "$PROJECT_ROOT/src/flow/config/"
                log_success "Agent configurations restored"
            fi

            # Restore prompts
            if [ -d "$backup_path/prompts" ]; then
                rm -rf "$PROJECT_ROOT/src/flow/prompts"
                cp -r "$backup_path/prompts" "$PROJECT_ROOT/src/flow/"
                log_success "Agent prompts restored"
            fi

            # Clear failed optimization outputs
            rm -rf "$OUTPUT_DIR"/*

            log_success "Rollback completed successfully"
        else
            log_error "Backup path not found: $backup_path"
        fi
    else
        log_error "No backup path available for rollback"
    fi
}

# Main deployment function
main() {
    local start_time=$(date +%s)

    echo "==============================================="
    echo "    DSPy OPTIMIZATION DEPLOYMENT SCRIPT"
    echo "==============================================="
    echo "Target: 87 SPEK Agents"
    echo "System: Master DSPy Template"
    echo "Started: $(date)"
    echo "==============================================="
    echo ""

    # Handle interruption
    trap 'log_error "Deployment interrupted"; rollback; exit 1' INT TERM

    # Execute deployment steps
    setup_directories
    pre_flight_checks
    install_dependencies
    create_configurations
    create_backup

    # Main optimization process
    if run_optimization; then
        if run_validation; then
            generate_report

            local end_time=$(date +%s)
            local total_duration=$((end_time - start_time))

            echo ""
            echo "==============================================="
            echo "        DEPLOYMENT COMPLETED SUCCESSFULLY"
            echo "==============================================="
            log_success "Total deployment time: ${total_duration}s"
            log_success "87 SPEK agents optimized with DSPy templates"
            log_success "All quality gates passed"
            log_success "System ready for staging deployment"

            exit 0
        else
            log_error "Validation failed"
            rollback
            exit 1
        fi
    else
        log_error "Optimization failed"
        rollback
        exit 1
    fi
}

# Execute main function
main "$@"

# End of script
echo ""
echo "==============================================="
echo "  DSPy Optimization Deployment Script End"
echo "==============================================="

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T17:15:00-04:00 | architect@gemini-2.5-pro | DSPy optimization deployment script | deploy-dspy-optimization.sh | OK | Complete automated deployment system | 0.00 | h8i9j0k |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: deployment-script-001
- inputs: ["BatchOptimizationEngine.ts", "TemplateValidator.ts"]
- tools_used: ["filesystem", "memory"]
- versions: {"model":"gemini-2.5-pro","prompt":"deployment-script-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->