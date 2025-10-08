# Regression Detection System - Quick Start Guide

## 🚀 System Status: OPERATIONAL ✓

**Deployed**: 2025-09-29
**Status**: Ready for tier-based assertion cleanup monitoring

---

## Quick Commands

### Before Starting Any Work (ONE TIME)
```bash
# Verify baseline exists
test -f .claude/.artifacts/baseline-errors.json && echo "✓ Ready" || bash scripts/regression-monitor.sh baseline
```

### After Each Tier (REQUIRED)
```bash
# Quick check (30 seconds)
bash scripts/quick-regression-check.sh

# Full check (3-5 minutes)
bash scripts/regression-monitor.sh check TIER1

# View report
cat .claude/.artifacts/regression-report.txt
```

### If You See PASS ✓
```bash
# Continue to next tier
echo "Tier complete - no regressions detected"
```

### If You See FAIL ✗
```bash
# STOP and investigate
cat .claude/.artifacts/regression-report.txt
# Review files with regressions
# Fix or revert changes
# Re-run check until PASS
```

---

## What This System Does

1. **Captures Baseline**: Records current error state (50 random files)
2. **Monitors Changes**: Detects NEW errors after each tier
3. **Alerts Regressions**: Warns if error count increases
4. **Tracks Progress**: Documents improvements

---

## Response Protocol

### PASS Example
```
REGRESSION CHECK - TIER 1: PASS
- Sample size: 50 files
- Regressions detected: 0
- Quality maintained: YES

→ ACTION: Proceed to next tier
```

### FAIL Example
```
REGRESSION ALERT - TIER 1:
File: src/example/file.ts
Baseline errors: 3
Current errors: 6
NEW errors: +3
ACTION REQUIRED: Investigate

→ ACTION: STOP, fix regressions, re-check
```

---

## File Locations

### Scripts
- `scripts/regression-monitor.sh` - Full analysis
- `scripts/quick-regression-check.sh` - Fast check
- `scripts/regression-alert.sh` - Real-time alerts

### Reports
- `.claude/.artifacts/regression-report.txt` - Latest detailed report
- `.claude/.artifacts/last-error-count.txt` - Quick check results

### Documentation
- `.claude/.artifacts/REGRESSION-MONITORING.md` - Complete guide
- `.claude/.artifacts/REGRESSION-DEPLOYMENT-COMPLETE.md` - Full details
- `.claude/.artifacts/REGRESSION-QUICK-START.md` - This file

---

## Tier Workflow

```
1. Execute tier fixes
      ↓
2. Quick check (30s)
      ↓
3. Full check (3-5m)
      ↓
4. Review report
      ↓
   PASS? → Next tier
   FAIL? → Fix & retry
```

---

## Current Baseline

- **Files Sampled**: 50
- **Baseline Created**: 2025-09-29 14:21
- **Initial Errors**: 1 error in 1 file
- **Status**: READY

---

## Need Help?

See full documentation:
- `cat .claude/.artifacts/REGRESSION-MONITORING.md`
- `cat .claude/.artifacts/REGRESSION-DEPLOYMENT-COMPLETE.md`

---

**READY TO MONITOR. START TIER 1 WHEN READY.**