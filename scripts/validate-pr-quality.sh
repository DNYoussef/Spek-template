#!/bin/bash
# PR Quality Validation Script
# Real validation that can fail based on quality degradation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS_DIR="$ROOT_DIR/.claude/.artifacts"
THRESHOLD_NASA=90
THRESHOLD_THEATER=40

echo "=============================================="
echo "PR Quality Gate Validation"
echo "=============================================="

# Create artifacts directory
mkdir -p "$ARTIFACTS_DIR"

# Track overall status
VALIDATION_PASSED=true

# 1. NASA POT10 Compliance Check
echo -e "\n${YELLOW}[1/5] NASA POT10 Compliance Check...${NC}"
if [ -f "analyzer/enterprise/nasa_pot10_analyzer.py" ]; then
    BEFORE_NASA=$(git show HEAD~1:analyzer/nasa_compliance.json 2>/dev/null | jq -r '.compliance_pct // "0"' || echo "0")

    python analyzer/enterprise/nasa_pot10_analyzer.py --path analyzer/enterprise/ --json > "$ARTIFACTS_DIR/nasa-current.json" 2>/dev/null || true
    AFTER_NASA=$(jq -r '.compliance_pct // "0"' "$ARTIFACTS_DIR/nasa-current.json")

    echo "  Previous: ${BEFORE_NASA}%"
    echo "  Current:  ${AFTER_NASA}%"
    echo "  Threshold: >=${THRESHOLD_NASA}%"

    if (( $(echo "$AFTER_NASA < $BEFORE_NASA" | bc -l) )); then
        echo -e "  ${RED}[FAIL] FAIL: NASA compliance degraded${NC}"
        VALIDATION_PASSED=false
    elif (( $(echo "$AFTER_NASA < $THRESHOLD_NASA" | bc -l) )); then
        echo -e "  ${RED}[FAIL] FAIL: Below threshold${NC}"
        VALIDATION_PASSED=false
    else
        echo -e "  ${GREEN}[OK] PASS${NC}"
    fi
else
    echo -e "  ${YELLOW}[WARN]  NASA analyzer not found, skipping${NC}"
fi

# 2. Theater Detection
echo -e "\n${YELLOW}[2/5] Performance Theater Detection...${NC}"
if [ -f "scripts/comprehensive_theater_scan.py" ]; then
    python scripts/comprehensive_theater_scan.py --ci-mode --json > "$ARTIFACTS_DIR/theater-current.json" 2>/dev/null || true
    THEATER_SCORE=$(jq -r '.theater_score // "0"' "$ARTIFACTS_DIR/theater-current.json")

    echo "  Theater Score: ${THEATER_SCORE}/100"
    echo "  Threshold: <=${THRESHOLD_THEATER}/100"

    if (( $(echo "$THEATER_SCORE > $THRESHOLD_THEATER" | bc -l) )); then
        echo -e "  ${RED}[FAIL] FAIL: Theater score too high${NC}"
        VALIDATION_PASSED=false
    else
        echo -e "  ${GREEN}[OK] PASS${NC}"
    fi
else
    echo -e "  ${YELLOW}[WARN]  Theater scanner not found, skipping${NC}"
fi

# 3. God Object Count
echo -e "\n${YELLOW}[3/5] God Object Analysis...${NC}"
BEFORE_GOD=$(git show HEAD~1:.claude/.artifacts/god-object-count.json 2>/dev/null | jq -r '.total_god_objects // "0"' || echo "0")

python scripts/god_object_counter.py --threshold=500 --json > "$ARTIFACTS_DIR/god-object-count.json" 2>/dev/null || true
AFTER_GOD=$(jq -r '.total_god_objects // "0"' "$ARTIFACTS_DIR/god-object-count.json")

echo "  Previous: ${BEFORE_GOD} god objects"
echo "  Current:  ${AFTER_GOD} god objects"

if [ "$AFTER_GOD" -gt "$BEFORE_GOD" ]; then
    echo -e "  ${RED}[FAIL] FAIL: God object count increased${NC}"
    VALIDATION_PASSED=false
elif [ "$AFTER_GOD" -gt 100 ]; then
    echo -e "  ${RED}[FAIL] FAIL: Too many god objects (max: 100)${NC}"
    VALIDATION_PASSED=false
else
    echo -e "  ${GREEN}[OK] PASS${NC}"
fi

# 4. Test Coverage
echo -e "\n${YELLOW}[4/5] Test Coverage Check...${NC}"
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    npm test -- --coverage --coverageReporters=json-summary > /dev/null 2>&1 || true

    if [ -f "coverage/coverage-summary.json" ]; then
        COVERAGE=$(jq -r '.total.lines.pct // "0"' coverage/coverage-summary.json)
        echo "  Coverage: ${COVERAGE}%"
        echo "  Threshold: >=80%"

        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo -e "  ${RED}[FAIL] FAIL: Coverage below threshold${NC}"
            VALIDATION_PASSED=false
        else
            echo -e "  ${GREEN}[OK] PASS${NC}"
        fi
    else
        echo -e "  ${YELLOW}[WARN]  Coverage report not found${NC}"
    fi
else
    echo -e "  ${YELLOW}[WARN]  npm not available, skipping${NC}"
fi

# 5. Security Scan
echo -e "\n${YELLOW}[5/5] Security Scan...${NC}"
if command -v semgrep &> /dev/null; then
    semgrep --config=auto --json --quiet . > "$ARTIFACTS_DIR/security-scan.json" 2>/dev/null || true

    CRITICAL=$(jq '[.results[] | select(.extra.severity == "ERROR")] | length' "$ARTIFACTS_DIR/security-scan.json" 2>/dev/null || echo "0")
    HIGH=$(jq '[.results[] | select(.extra.severity == "WARNING")] | length' "$ARTIFACTS_DIR/security-scan.json" 2>/dev/null || echo "0")

    echo "  Critical Issues: ${CRITICAL}"
    echo "  High Issues: ${HIGH}"

    if [ "$CRITICAL" -gt 0 ]; then
        echo -e "  ${RED}[FAIL] FAIL: Critical security issues found${NC}"
        VALIDATION_PASSED=false
    elif [ "$HIGH" -gt 5 ]; then
        echo -e "  ${RED}[FAIL] FAIL: Too many high-severity issues${NC}"
        VALIDATION_PASSED=false
    else
        echo -e "  ${GREEN}[OK] PASS${NC}"
    fi
else
    echo -e "  ${YELLOW}[WARN]  semgrep not installed, skipping${NC}"
fi

# Final Report
echo -e "\n=============================================="
if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}[OK] PR QUALITY GATE: PASSED${NC}"
    echo "=============================================="
    exit 0
else
    echo -e "${RED}[FAIL] PR QUALITY GATE: FAILED${NC}"
    echo "=============================================="
    echo -e "\n${RED}PR cannot be merged until all quality gates pass.${NC}"
    exit 1
fi