#!/bin/bash
# Test script to validate the reality validation fixes

set -e  # Exit on error (same as GitHub Actions)

echo "Testing reality validation with bash -e mode..."

# Validate that test results are genuine
REALITY_CHECKS=0
REALITY_PASSED=0

# Check 1: Test files actually contain meaningful assertions
echo "Starting Check 1: Test assertions..."
if find . \( -name "*test*.py" -o -name "*test*.js" \) -type f 2>/dev/null | head -5 | xargs grep -l "assert\|expect" >/dev/null 2>&1; then
  REALITY_PASSED=$((REALITY_PASSED + 1))
  echo "[OK] Tests contain real assertions"
else
  echo "[FAIL] Tests lack meaningful assertions"
fi
REALITY_CHECKS=$((REALITY_CHECKS + 1))

# Check 2: Coverage data corresponds to actual code
echo "Starting Check 2: Coverage data..."
if [[ -f "coverage.xml" ]]; then
  COVERAGE_LINES=$(grep -o 'line-rate="[^"]*"' coverage.xml | head -1 | cut -d'"' -f2)
  if [[ "$COVERAGE_LINES" != "1.0" && "$COVERAGE_LINES" != "0.0" ]]; then
    REALITY_PASSED=$((REALITY_PASSED + 1))
    echo "[OK] Coverage data appears realistic: $COVERAGE_LINES"
  else
    echo "[FAIL] Suspicious coverage data: $COVERAGE_LINES"
  fi
else
  echo "[WARN] No coverage.xml file found (normal for local testing)"
fi
REALITY_CHECKS=$((REALITY_CHECKS + 1))

# Check 3: Actual implementation code exists
echo "Starting Check 3: Source files..."
SOURCE_FILES=$(find . -name "*.py" -o -name "*.js" -o -name "*.ts" | grep -v test | grep -v node_modules | wc -l)
if [[ $SOURCE_FILES -gt 5 ]]; then
  REALITY_PASSED=$((REALITY_PASSED + 1))
  echo "[OK] Substantial implementation code found: $SOURCE_FILES files"
else
  echo "[FAIL] Insufficient implementation code: $SOURCE_FILES files"
fi
REALITY_CHECKS=$((REALITY_CHECKS + 1))

# Calculate reality status
echo ""
echo "Reality validation results: $REALITY_PASSED/$REALITY_CHECKS checks passed"

if [[ $REALITY_PASSED -eq $REALITY_CHECKS ]]; then
  echo "[OK] Reality validation: PASSED ($REALITY_PASSED/$REALITY_CHECKS)"
  exit 0
else
  echo "[FAIL] Reality validation: FAILED ($REALITY_PASSED/$REALITY_CHECKS)"
  exit 1
fi