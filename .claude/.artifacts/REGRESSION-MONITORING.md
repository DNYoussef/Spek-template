# Regression Detection & Quality Assurance System

## Overview
Comprehensive monitoring system to detect NEW errors introduced during assertion cleanup process.

## System Components

### 1. Full Regression Monitor (`regression-monitor.sh`)
**Purpose**: Comprehensive baseline and regression detection
**Usage**:
```bash
# Create baseline (run ONCE before starting)
bash scripts/regression-monitor.sh baseline

# Check for regressions after each tier
bash scripts/regression-monitor.sh check TIER1
bash scripts/regression-monitor.sh check TIER2

# View last report
bash scripts/regression-monitor.sh report
```

**Features**:
- Analyzes 50 random sampled files
- Captures error counts and error codes
- Detects new error types
- Generates detailed regression reports
- Tracks improvements and unchanged files
- Python-based comparison engine

### 2. Quick Regression Check (`quick-regression-check.sh`)
**Purpose**: Rapid error count monitoring between tiers
**Usage**:
```bash
bash scripts/quick-regression-check.sh
```

**Features**:
- Fast: checks 25 files only
- Calculates average errors per file
- Stores results for trending
- Lightweight for frequent checks

### 3. Regression Alert System (`regression-alert.sh`)
**Purpose**: Real-time monitoring with alerting
**Usage**:
```bash
# Monitor default sample
bash scripts/regression-alert.sh

# Monitor specific file list
bash scripts/regression-alert.sh custom-files.txt TIER3
```

**Features**:
- Alert threshold: +2 errors triggers alert
- Color-coded output (RED/GREEN/YELLOW)
- Creates baseline automatically
- Shows actual new error messages
- Progress indicators

## Monitoring Strategy

### Phase 1: Pre-Cleanup Baseline
```bash
# 1. Create sample of 50 random files
find src -name "*.ts" | shuf | head -50 > .claude/.artifacts/regression-sample.txt

# 2. Capture baseline error state
bash scripts/regression-monitor.sh baseline

# 3. Record starting metrics
bash scripts/quick-regression-check.sh
```

### Phase 2: During Cleanup (Per Tier)
```bash
# After completing each tier of assertion fixes:

# Quick check (30 seconds)
bash scripts/quick-regression-check.sh

# Full regression check (3-5 minutes)
bash scripts/regression-monitor.sh check TIER1

# If PASS: proceed to next tier
# If FAIL: investigate and fix regressions
```

### Phase 3: Post-Cleanup Validation
```bash
# Final comprehensive check
bash scripts/regression-monitor.sh check FINAL

# Compare metrics
cat .claude/.artifacts/regression-report.txt

# Verify improvements
cat .claude/.artifacts/last-error-count.txt
```

## Alert Response Protocol

### REGRESSION DETECTED
```
1. STOP all tier work immediately
2. Review regression report in .claude/.artifacts/regression-report.txt
3. Identify specific files with regressions
4. Analyze changes made to those files
5. Options:
   a) Revert changes to regressed files
   b) Fix new errors introduced
   c) Document as expected side-effect
6. Re-run regression check
7. Only proceed if PASS
```

### NO REGRESSIONS
```
1. Document tier completion
2. Save regression report
3. Update baseline for next tier
4. Proceed to next tier
```

## Sample Output

### PASS Example
```
==========================================
REGRESSION CHECK - TIER 1
==========================================

REGRESSION CHECK: PASS

Summary:
- Sample size: 50 files
- Regressions detected: 0
- Improvements: 3
- Unchanged: 47
- Quality maintained: YES

Improvements detected:
  src/fsm/services/ServiceFSM.ts: 8 -> 6 (-2)
  src/analysis/core/AnalysisHub.ts: 12 -> 10 (-2)
  src/config/ConfigurationFacade.ts: 5 -> 4 (-1)

==========================================
```

### FAIL Example
```
==========================================
REGRESSION CHECK - TIER 2
==========================================

!!! REGRESSION ALERT !!!

File: src/architecture/langgraph/LangGraphEngine.ts
  Baseline errors: 5
  Current errors: 8
  NEW errors: +3
  NEW error codes: error TS2322, error TS2345
  Sample messages: Property 'assert' does not exist...
  ACTION REQUIRED: Investigate and revert changes to this file

TOTAL REGRESSIONS: 1

==========================================
```

## File Artifacts

### Generated Files
- `.claude/.artifacts/regression-sample.txt` - 50 sampled files
- `.claude/.artifacts/baseline-errors.json` - Baseline state
- `.claude/.artifacts/current-errors.json` - Current state
- `.claude/.artifacts/regression-report.txt` - Latest report
- `.claude/.artifacts/last-error-count.txt` - Quick check results
- `.claude/.artifacts/baseline/*.count` - Per-file baselines

### Report Archive
- Keep reports from each tier: `regression-report-tier1.txt`
- Compare across tiers to track progress
- Use for post-completion analysis

## Best Practices

### DO:
- Run baseline BEFORE starting any cleanup
- Check after EVERY tier completion
- Investigate ALL regressions immediately
- Keep reports for documentation
- Use quick checks for rapid feedback

### DON'T:
- Skip baseline creation
- Ignore regression alerts
- Proceed with regressions unresolved
- Delete artifact files mid-process
- Mix different cleanup efforts

## Integration with Tier System

### Tier Workflow
```bash
# Before Tier 1
bash scripts/regression-monitor.sh baseline

# Execute Tier 1 fixes
# ... (assertion cleanup work)

# After Tier 1
bash scripts/regression-monitor.sh check TIER1

# If PASS -> Tier 2
# If FAIL -> Fix regressions, repeat check

# Repeat for each tier
```

## Troubleshooting

### Issue: Baseline creation fails
**Solution**: Ensure TypeScript and Node.js installed
```bash
npm install -g typescript
npx tsc --version
```

### Issue: Python comparison fails
**Solution**: Ensure Python 3 available
```bash
python3 --version
```

### Issue: Sample files not found
**Solution**: Verify working directory
```bash
cd "C:\Users\17175\Desktop\spek template"
find src -name "*.ts" | wc -l
```

## Success Metrics

### Target Goals
- Regressions detected: 0
- Improvements: >0
- Quality maintained: YES
- Error reduction: >10% per tier

### Quality Gates
- PASS: Zero regressions, proceed
- CONDITIONAL: Minor regressions, review
- FAIL: Major regressions, stop and fix

## Version Log
| Version | Date | Agent | Changes | Status |
|---------|------|-------|---------|--------|
| 1.0.0 | 2025-09-29 | code-analyzer@sonnet-4 | Initial system | OK |

<!-- AGENT FOOTER -->
Receipt: {status: OK, tools: [Write, Bash], files: [REGRESSION-MONITORING.md], hash: d9f4a7c}