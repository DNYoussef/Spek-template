#!/bin/bash
# Quick Regression Check (Lightweight Version)
# For rapid testing between assertion cleanup tiers

set -e

WORK_DIR=".claude/.artifacts"
SAMPLE_SIZE=25  # Reduced for speed

echo "=========================================="
echo "Quick Regression Check"
echo "=========================================="

# Create quick sample
echo "Sampling $SAMPLE_SIZE files..."
find src -name "*.ts" -type f 2>/dev/null | shuf | head -$SAMPLE_SIZE > "$WORK_DIR/quick-sample.txt"

# Quick error count
echo "Counting errors..."
TOTAL_ERRORS=0
FILE_COUNT=0

while IFS= read -r file; do
    if [[ -f "$file" ]]; then
        ERROR_COUNT=$(npx tsc --noEmit "$file" 2>&1 | grep -c "error TS" || echo "0")
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
        FILE_COUNT=$((FILE_COUNT + 1))

        if [[ $ERROR_COUNT -gt 0 ]]; then
            echo "  $file: $ERROR_COUNT errors"
        fi
    fi
done < "$WORK_DIR/quick-sample.txt"

# Calculate average (avoid division by zero)
if [[ $FILE_COUNT -gt 0 ]]; then
    AVG_ERRORS=$((TOTAL_ERRORS / FILE_COUNT))
else
    AVG_ERRORS=0
fi

echo ""
echo "=========================================="
echo "Quick Check Results:"
echo "  Files checked: $FILE_COUNT"
echo "  Total errors: $TOTAL_ERRORS"
echo "  Average errors per file: $AVG_ERRORS"
echo "=========================================="

# Store results
echo "$TOTAL_ERRORS" > "$WORK_DIR/last-error-count.txt"
echo "$FILE_COUNT" >> "$WORK_DIR/last-error-count.txt"

# Version & Run Log Footer
# v1.0.0 | 2025-09-29 | code-analyzer@sonnet-4 | Quick regression check | quick-regression-check.sh | OK | SHA:e3f2a1b