#!/bin/bash
# Simplified Error Quarantine Analysis (No jq required)
# Windows-compatible version

set -e

REPORT_DIR=".claude/.artifacts"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

mkdir -p "$REPORT_DIR"

echo "=== Error Quarantine Analysis ==="
echo "Timestamp: $TIMESTAMP"
echo ""

# Get error distribution
echo "Step 1: Analyzing error distribution..."
npm run typecheck 2>&1 | grep -oE "TS[0-9]{4}" | sort | uniq -c | sort -rn > "$REPORT_DIR/error-dist.txt"

TOTAL_ERRORS=$(npm run typecheck 2>&1 | grep -c "error TS" || echo 0)
echo "Total errors: $TOTAL_ERRORS"
echo ""

# Critical blockers
echo "Step 2: Identifying critical blockers..."
CRITICAL_2307=$(grep "TS2307" "$REPORT_DIR/error-dist.txt" | awk '{print $1}' || echo 0)
CRITICAL_2614=$(grep "TS2614" "$REPORT_DIR/error-dist.txt" | awk '{print $1}' || echo 0)
CRITICAL_TOTAL=$((CRITICAL_2307 + CRITICAL_2614))

echo "  TS2307 (Cannot find module): $CRITICAL_2307"
echo "  TS2614 (No exported member): $CRITICAL_2614"
echo "  TOTAL CRITICAL BLOCKERS: $CRITICAL_TOTAL"
echo ""

# Quarantinable errors
echo "Step 3: Identifying quarantinable errors..."
FACADE_2339=$(grep "TS2339" "$REPORT_DIR/error-dist.txt" | awk '{print $1}' || echo 0)
INTERFACE_2353=$(grep "TS2353" "$REPORT_DIR/error-dist.txt" | awk '{print $1}' || echo 0)
STRICT_2564=$(grep "TS2564" "$REPORT_DIR/error-dist.txt" | awk '{print $1}' || echo 0)
TYPE_7006=$(grep "TS7006" "$REPORT_DIR/error-dist.txt" | awk '{print $1}' || echo 0)
QUARANTINE_TOTAL=$((FACADE_2339 + INTERFACE_2353 + STRICT_2564 + TYPE_7006))

echo "  TS2339 (FACADE_INCOMPLETE): $FACADE_2339"
echo "  TS2353 (INTERFACE_DRIFT): $INTERFACE_2353"
echo "  TS2564 (STRICT_MODE): $STRICT_2564"
echo "  TS7006 (TYPE_ANNOTATION): $TYPE_7006"
echo "  TOTAL QUARANTINABLE: $QUARANTINE_TOTAL"
echo ""

# Generate summary report
cat > "$REPORT_DIR/quarantine-summary.txt" << EOF
Error Quarantine Analysis Summary
Generated: $TIMESTAMP

=== Overall Statistics ===
Total TypeScript Errors: $TOTAL_ERRORS

=== Critical Blockers (MUST FIX - DO NOT QUARANTINE) ===
TS2307 (Cannot find module):     $CRITICAL_2307 errors
TS2614 (No exported member):      $CRITICAL_2614 errors
----------------------------------------
TOTAL CRITICAL:                   $CRITICAL_TOTAL errors ($(echo "scale=1; $CRITICAL_TOTAL * 100 / $TOTAL_ERRORS" | bc 2>/dev/null || echo "?")%)

=== Quarantinable Errors (CAN DEFER WITH TRACKING) ===
TS2339 (FACADE_INCOMPLETE):       $FACADE_2339 errors
TS2353 (INTERFACE_DRIFT):         $INTERFACE_2353 errors
TS2564 (STRICT_MODE):             $STRICT_2564 errors
TS7006 (TYPE_ANNOTATION):         $TYPE_7006 errors
----------------------------------------
TOTAL QUARANTINABLE:              $QUARANTINE_TOTAL errors ($(echo "scale=1; $QUARANTINE_TOTAL * 100 / $TOTAL_ERRORS" | bc 2>/dev/null || echo "?")%)

=== Other Errors ===
OTHER:                            $((TOTAL_ERRORS - CRITICAL_TOTAL - QUARANTINE_TOTAL)) errors

=== Strategy Recommendations ===

PHASE 1 (Week 1): Quarantine Infrastructure
- [x] Create quarantine scripts
- [x] Create incremental CI
- [x] Create issue templates
- [ ] Create 4 GitHub issues for quarantine categories
- [ ] Manual quarantine insertion (code review)

PHASE 2 (Week 2): Fix Critical Blockers
- Target: $CRITICAL_TOTAL errors (TS2307 + TS2614)
- Strategy: Fix import paths and barrel exports
- Batch: Phase 2 Batch 1.3-1.4
- Timeline: 8-12 hours

PHASE 3 (Week 3-4): Resolve Quarantined Errors
- Target: $QUARANTINE_TOTAL errors (4 categories)
- Strategy: Systematic resolution by category
- Batches: Phase 2 Batch 2-4
- Timeline: 26-36 hours

=== Next Actions ===
1. Review this summary: $REPORT_DIR/quarantine-summary.txt
2. Review full distribution: $REPORT_DIR/error-dist.txt
3. Create GitHub issues for 4 quarantine categories
4. Deploy incremental CI: .github/workflows/incremental-ci.yml
5. Begin manual quarantine insertion (with code review)

EOF

echo "=== Summary Report Generated ==="
echo ""
cat "$REPORT_DIR/quarantine-summary.txt"
echo ""
echo "Files created:"
echo "  - $REPORT_DIR/quarantine-summary.txt"
echo "  - $REPORT_DIR/error-dist.txt"
echo ""
echo "Next: Review summary and create GitHub issues"
