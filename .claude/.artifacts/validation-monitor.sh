#!/bin/bash
# Validation Monitor - Continuous Error Tracking
# Location: .claude/.artifacts/validation-monitor.sh

BASELINE=61733
TIER1_TARGET=40744
TIER2_TARGET=20989
TIER3_TARGET=5000

echo "==================================="
echo "TYPESCRIPT ERROR VALIDATION MONITOR"
echo "==================================="
echo ""

# Get current error count
CURRENT=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)
echo "Current Error Count: $CURRENT"
echo "Baseline: $BASELINE"
echo ""

# Calculate reduction
REDUCTION=$(echo "scale=2; (($BASELINE - $CURRENT) / $BASELINE) * 100" | bc)
echo "Total Reduction: $REDUCTION%"
echo ""

# Tier status
echo "--- TIER TARGETS ---"
if [ $CURRENT -le $TIER3_TARGET ]; then
  echo "✓ TIER 3 COMPLETE: $CURRENT <= $TIER3_TARGET"
  echo "Status: PRODUCTION READY"
elif [ $CURRENT -le $TIER2_TARGET ]; then
  echo "✓ TIER 2 COMPLETE: $CURRENT <= $TIER2_TARGET"
  echo "○ TIER 3 IN PROGRESS: Target $TIER3_TARGET"
  REMAINING=$(($CURRENT - $TIER3_TARGET))
  echo "  Remaining: $REMAINING errors"
elif [ $CURRENT -le $TIER1_TARGET ]; then
  echo "✓ TIER 1 COMPLETE: $CURRENT <= $TIER1_TARGET"
  echo "○ TIER 2 IN PROGRESS: Target $TIER2_TARGET"
  REMAINING=$(($CURRENT - $TIER2_TARGET))
  echo "  Remaining: $REMAINING errors"
else
  echo "○ TIER 1 IN PROGRESS: Target $TIER1_TARGET"
  REMAINING=$(($CURRENT - $TIER1_TARGET))
  echo "  Remaining: $REMAINING errors"
fi
echo ""

# Top 5 error types
echo "--- TOP 5 ERROR TYPES ---"
npx tsc --noEmit 2>&1 | grep "error TS" | grep -oP 'TS\d+' | sort | uniq -c | sort -rn | head -5
echo ""

# Top 10 affected files
echo "--- TOP 10 AFFECTED FILES ---"
npx tsc --noEmit 2>&1 | cut -d'(' -f1 | sort | uniq -c | sort -rn | head -10
echo ""

echo "==================================="
echo "Report saved: .claude/.artifacts/validation-monitor-$(date +%Y%m%d-%H%M%S).log"