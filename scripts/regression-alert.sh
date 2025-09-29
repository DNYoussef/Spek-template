#!/bin/bash
# Regression Alert System
# Monitors specific files for error increases

set -e

WATCH_FILE="${1:-.claude/.artifacts/regression-sample.txt}"
TIER="${2:-UNKNOWN}"
ALERT_THRESHOLD=2  # Alert if errors increase by this amount

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Regression Alert Monitor - Tier $TIER"
echo "=========================================="
echo ""

ALERT_COUNT=0
CHECK_COUNT=0

while IFS= read -r file; do
    if [[ ! -f "$file" ]]; then
        continue
    fi

    ((CHECK_COUNT++))

    # Get current error count
    CURRENT_ERRORS=$(npx tsc --noEmit "$file" 2>&1 | grep -c "error TS" || echo "0")

    # Check against baseline (if exists)
    BASELINE_FILE=".claude/.artifacts/baseline/${file//\//_}.count"

    if [[ -f "$BASELINE_FILE" ]]; then
        BASELINE_ERRORS=$(cat "$BASELINE_FILE")
        DIFF=$((CURRENT_ERRORS - BASELINE_ERRORS))

        if [[ $DIFF -ge $ALERT_THRESHOLD ]]; then
            echo -e "${RED}ALERT: $file${NC}"
            echo "  Baseline: $BASELINE_ERRORS errors"
            echo "  Current: $CURRENT_ERRORS errors"
            echo "  Increase: +$DIFF errors"
            echo ""

            # Show new errors
            npx tsc --noEmit "$file" 2>&1 | grep "error TS" | head -3
            echo ""

            ((ALERT_COUNT++))
        elif [[ $DIFF -lt 0 ]]; then
            echo -e "${GREEN}IMPROVED: $file ($DIFF errors)${NC}"
        fi
    else
        # Create baseline
        mkdir -p ".claude/.artifacts/baseline"
        echo "$CURRENT_ERRORS" > "$BASELINE_FILE"
    fi

    # Progress indicator
    if [[ $((CHECK_COUNT % 10)) -eq 0 ]]; then
        echo "Checked $CHECK_COUNT files..."
    fi
done < "$WATCH_FILE"

echo ""
echo "=========================================="
if [[ $ALERT_COUNT -eq 0 ]]; then
    echo -e "${GREEN}NO REGRESSIONS DETECTED${NC}"
    echo "  Files checked: $CHECK_COUNT"
    echo "  Alerts: 0"
    echo "  Status: PASS"
else
    echo -e "${RED}REGRESSIONS DETECTED: $ALERT_COUNT${NC}"
    echo "  Files checked: $CHECK_COUNT"
    echo "  Files with regressions: $ALERT_COUNT"
    echo "  Status: FAIL"
    echo ""
    echo "ACTION REQUIRED:"
    echo "  1. Review files listed above"
    echo "  2. Verify assertion changes"
    echo "  3. Consider reverting problematic files"
    exit 1
fi
echo "=========================================="

# Version & Run Log Footer
# v1.0.0 | 2025-09-29 | code-analyzer@sonnet-4 | Regression alert system | regression-alert.sh | OK | SHA:c8d5e2f