# 3-Loop System Quick Start Guide

## What is the 3-Loop System?

The 3-Loop System is an iterative development methodology that combines planning, implementation, and quality assurance into a continuous improvement cycle. It supports both new development and existing codebase remediation through two distinct flow patterns.

## Installation & Setup

### Prerequisites
```bash
# Ensure scripts are executable
chmod +x scripts/3-loop-orchestrator.sh
chmod +x scripts/codebase-remediation.sh
chmod +x scripts/loop-feedback/*.sh

# Install dependencies
npm install
python -m pip install -r requirements.txt
```

### Configuration
```bash
# Initialize loop configuration
cp .roo/loops/loop-config.json.example .roo/loops/loop-config.json

# Edit quality gates (optional)
vim .roo/loops/loop-config.json
```

## Quick Start by Use Case

### 1. Starting a New Project (Forward Flow)

**Use when:** Building from scratch, new features, prototypes

```bash
# Automatic execution with quality gates
./scripts/3-loop-orchestrator.sh forward

# What happens:
# Loop 1: Generates specs, researches solutions, analyzes risks
# Loop 2: Implements with swarm agents, detects theater
# Loop 3: Validates quality, runs tests, checks compliance
```

**Manual step-by-step:**
```bash
# Step 1: Planning & Research
npx claude-flow sparc run spec "Build user authentication system"
npx claude-flow sparc run research "OAuth2 best practices"
./scripts/pre-mortem-loop.sh

# Step 2: Development
npx claude-flow sparc tdd "authentication"
./scripts/theater-detection.sh

# Step 3: Quality Validation
./scripts/simple_quality_loop.sh
```

### 2. Fixing an Existing Codebase (Reverse Flow)

**Use when:** Technical debt, legacy code, bug fixes

```bash
# Automatic remediation with convergence
./scripts/codebase-remediation.sh . progressive 10

# What happens:
# Loop 3: Analyzes current problems
# Loop 1: Creates improvement specifications
# Loop 2: Implements fixes
# Loop 3: Validates improvements
# Repeats until quality gates pass (max 10 iterations)
```

**Manual analysis-first approach:**
```bash
# Step 1: Analyze current state
./scripts/simple_quality_loop.sh
cat .claude/.artifacts/analysis-results.json

# Step 2: Convert to specifications
./scripts/loop-feedback/analyze-to-spec.sh

# Step 3: Generate task list
./scripts/loop-feedback/spec-to-tasks.sh

# Step 4: Execute improvements
./scripts/3-loop-orchestrator.sh forward
```

### 3. Continuous Improvement Mode

**Use when:** Ongoing development, maintaining quality

```bash
# Set up continuous mode
export MAX_ITERATIONS=-1  # Run indefinitely
export CONVERGENCE_QUALITY="excellent"

# Run with monitoring
./scripts/3-loop-orchestrator.sh reverse

# Stop with Ctrl+C when satisfied
```

## Understanding Quality Gates

Each loop has specific quality requirements that must pass:

### Loop 1 Quality Gates (Planning)
```json
{
  "spec_completeness": 0.9,      // 90% of requirements documented
  "risk_mitigation_coverage": 0.8 // 80% of risks addressed
}
```

### Loop 2 Quality Gates (Development)
```json
{
  "test_coverage": 0.8,           // 80% code coverage
  "theater_score": 60,            // Theater detection < 60/100
  "lint_clean": true,             // No lint errors
  "security_clean": true          // No security vulnerabilities
}
```

### Loop 3 Quality Gates (Quality)
```json
{
  "overall_quality": "good",      // Quality assessment
  "critical_issues": 0,           // Zero critical problems
  "test_passing": true            // All tests pass
}
```

## Monitoring Progress

### Real-time Monitoring
```bash
# Watch loop execution
tail -f .claude/.artifacts/loop-progress.log

# Check current status
cat .claude/.artifacts/session-state.json
```

### Generated Reports
- `3loop-report-${SESSION_ID}.md` - Overall execution summary
- `quality-analysis-${SESSION_ID}.json` - Detailed metrics
- `remediation/final-report-${SESSION_ID}.md` - Improvement summary

## Common Patterns

### Pattern 1: Quick Fix
```bash
# For a specific bug or small improvement
./scripts/simple_quality_loop.sh  # Identify issue
vim src/problematic-file.js       # Manual fix
./scripts/simple_quality_loop.sh  # Verify fix
```

### Pattern 2: Major Refactoring
```bash
# For large-scale improvements
./scripts/codebase-remediation.sh . aggressive 20
# Aggressive mode with up to 20 iterations
```

### Pattern 3: Pre-commit Hook
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
./scripts/simple_quality_loop.sh --quick
if [ $? -ne 0 ]; then
  echo "Quality gates failed. Fix issues before committing."
  exit 1
fi
```

## Troubleshooting

### Issue: Scripts not executing
```bash
chmod +x scripts/*.sh
chmod +x scripts/loop-feedback/*.sh
```

### Issue: Quality gates failing repeatedly
```bash
# Lower thresholds temporarily
export TEST_COVERAGE_THRESHOLD=0.6
export LINT_ERRORS_ALLOWED=10
./scripts/3-loop-orchestrator.sh
```

### Issue: Analysis taking too long
```bash
# Use quick mode for faster feedback
./scripts/simple_quality_loop.sh --quick
```

### Issue: Not converging
```bash
# Check convergence metrics
cat .claude/.artifacts/convergence-metrics.json

# Force manual review
./scripts/3-loop-orchestrator.sh --max-iterations=1
```

## Best Practices

1. **Start Small**: Begin with a single module or feature
2. **Set Realistic Gates**: Adjust quality thresholds to your project
3. **Monitor Theater Score**: Keep production theater below 60/100
4. **Use Session IDs**: Track progress across multiple runs
5. **Review Reports**: Check generated reports for insights
6. **Iterate Gradually**: Use progressive mode for large codebases
7. **Validate Evidence**: Ensure all improvements are measurable

## Advanced Configuration

### Custom Convergence Criteria
```bash
# Edit .roo/loops/loop-config.json
{
  "convergence_criteria": {
    "quality_improvement": {
      "min_score_increase": 20,
      "max_iterations": 10,
      "target_quality": "excellent"
    }
  }
}
```

### Parallel Execution
```bash
export PARALLEL_EXECUTION=true
export MAX_AGENTS=8
./scripts/3-loop-orchestrator.sh
```

### Integration with CI/CD
```yaml
# .github/workflows/3loop.yml
name: 3-Loop Quality Check
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: ./scripts/3-loop-orchestrator.sh forward
      - run: ./scripts/simple_quality_loop.sh
```

## Next Steps

1. Read [Complete 3-Loop Documentation](3-LOOP-SYSTEM.md)
2. Explore [Loop Configuration](.roo/loops/loop-config.json)
3. Review [Example Reports](.claude/.artifacts/)
4. Join the community discussions on GitHub

## Support

- **Documentation**: [docs/3-LOOP-SYSTEM.md](3-LOOP-SYSTEM.md)
- **Issues**: GitHub Issues
- **Examples**: See `scripts/` directory for implementation details

---

Remember: The 3-Loop System ensures **genuine quality improvements**, not production theater. Every validation is real, every test can fail, and every improvement is measurable.