#!/bin/bash
# Regression Detection Monitor for Assertion Cleanup
# Detects new errors introduced during refactoring

set -e

SAMPLE_FILE=".claude/.artifacts/regression-sample.txt"
BASELINE_FILE=".claude/.artifacts/baseline-errors.json"
CURRENT_FILE=".claude/.artifacts/current-errors.json"
REPORT_FILE=".claude/.artifacts/regression-report.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Regression Detection Monitor"
echo "=========================================="
echo ""

# Function to analyze a single file
analyze_file() {
    local file="$1"
    local output_file="$2"

    if [[ ! -f "$file" ]]; then
        echo "{\"file\":\"$file\",\"errors\":0,\"error_codes\":[],\"status\":\"missing\"}" >> "$output_file"
        return
    fi

    # Run TypeScript compiler on single file
    local errors=$(npx tsc --noEmit "$file" 2>&1 | grep "error TS" || true)
    local error_count=$(echo "$errors" | grep -c "error TS" || echo "0")

    # Extract error codes
    local error_codes=$(echo "$errors" | grep -o "error TS[0-9]*" | sort -u | tr '\n' ',' | sed 's/,$//')

    # Extract specific error messages (first 3)
    local error_msgs=$(echo "$errors" | head -3 | sed 's/"/\\"/g' | tr '\n' '|')

    echo "{\"file\":\"$file\",\"errors\":$error_count,\"error_codes\":\"$error_codes\",\"messages\":\"$error_msgs\",\"status\":\"analyzed\"}" >> "$output_file"
}

# Function to create baseline
create_baseline() {
    echo "Creating baseline from sampled files..."
    echo "[" > "$BASELINE_FILE"

    local count=0
    while IFS= read -r file; do
        ((count++))
        echo "  Analyzing [$count/50]: $file"
        analyze_file "$file" "$BASELINE_FILE"
        if [[ $count -lt 50 ]]; then
            echo "," >> "$BASELINE_FILE"
        fi
    done < "$SAMPLE_FILE"

    echo "]" >> "$BASELINE_FILE"
    echo ""
    echo -e "${GREEN}Baseline created successfully!${NC}"
}

# Function to analyze current state
analyze_current() {
    local tier="${1:-UNKNOWN}"
    echo "Analyzing current state (Tier $tier)..."
    echo "[" > "$CURRENT_FILE"

    local count=0
    while IFS= read -r file; do
        ((count++))
        echo "  Re-analyzing [$count/50]: $file"
        analyze_file "$file" "$CURRENT_FILE"
        if [[ $count -lt 50 ]]; then
            echo "," >> "$CURRENT_FILE"
        fi
    done < "$SAMPLE_FILE"

    echo "]" >> "$CURRENT_FILE"
    echo ""
}

# Function to compare and detect regressions
detect_regressions() {
    local tier="${1:-UNKNOWN}"
    echo "Detecting regressions..."

    python3 - <<EOF
import json
import sys

# Load baseline and current
with open("$BASELINE_FILE", 'r') as f:
    baseline = json.load(f)

with open("$CURRENT_FILE", 'r') as f:
    current = json.load(f)

# Create lookup dictionaries
baseline_dict = {item['file']: item for item in baseline}
current_dict = {item['file']: item for item in current}

# Detect regressions
regressions = []
improvements = []
unchanged = []

for file_path in baseline_dict.keys():
    base = baseline_dict.get(file_path, {})
    curr = current_dict.get(file_path, {})

    base_errors = base.get('errors', 0)
    curr_errors = curr.get('errors', 0)

    base_codes = set(base.get('error_codes', '').split(','))
    curr_codes = set(curr.get('error_codes', '').split(','))

    base_codes.discard('')
    curr_codes.discard('')

    # Check for regressions
    if curr_errors > base_errors:
        new_codes = curr_codes - base_codes
        regressions.append({
            'file': file_path,
            'baseline': base_errors,
            'current': curr_errors,
            'increase': curr_errors - base_errors,
            'new_codes': list(new_codes),
            'messages': curr.get('messages', '')
        })
    elif curr_errors < base_errors:
        fixed_codes = base_codes - curr_codes
        improvements.append({
            'file': file_path,
            'baseline': base_errors,
            'current': curr_errors,
            'decrease': base_errors - curr_errors,
            'fixed_codes': list(fixed_codes)
        })
    else:
        unchanged.append(file_path)

# Generate report
report = []
report.append("=" * 70)
report.append(f"REGRESSION CHECK - TIER {tier}")
report.append("=" * 70)
report.append("")

if regressions:
    report.append("!!! REGRESSION ALERT !!!")
    report.append("")
    for reg in regressions:
        report.append(f"File: {reg['file']}")
        report.append(f"  Baseline errors: {reg['baseline']}")
        report.append(f"  Current errors: {reg['current']}")
        report.append(f"  NEW errors: +{reg['increase']}")
        report.append(f"  NEW error codes: {', '.join(reg['new_codes']) if reg['new_codes'] else 'N/A'}")
        report.append(f"  Sample messages: {reg['messages'][:200]}...")
        report.append(f"  ACTION REQUIRED: Investigate and revert changes to this file")
        report.append("")
    report.append(f"TOTAL REGRESSIONS: {len(regressions)}")
    report.append("")
    sys.exit(1)  # Exit with error code
else:
    report.append("REGRESSION CHECK: PASS")
    report.append("")
    report.append("Summary:")
    report.append(f"- Sample size: 50 files")
    report.append(f"- Regressions detected: 0")
    report.append(f"- Improvements: {len(improvements)}")
    report.append(f"- Unchanged: {len(unchanged)}")
    report.append(f"- Quality maintained: YES")
    report.append("")

if improvements:
    report.append("Improvements detected:")
    for imp in improvements[:10]:  # Show first 10
        report.append(f"  {imp['file']}: {imp['baseline']} -> {imp['current']} (-{imp['decrease']})")
    if len(improvements) > 10:
        report.append(f"  ... and {len(improvements) - 10} more")
    report.append("")

report.append("=" * 70)

# Write report
with open("$REPORT_FILE", 'w') as f:
    f.write('\n'.join(report))

# Print to console
print('\n'.join(report))

sys.exit(0)
EOF

    return $?
}

# Main execution
case "${1:-check}" in
    baseline)
        create_baseline
        ;;
    check)
        TIER="${2:-UNKNOWN}"
        analyze_current "$TIER"
        detect_regressions "$TIER"
        ;;
    report)
        if [[ -f "$REPORT_FILE" ]]; then
            cat "$REPORT_FILE"
        else
            echo "No report found. Run 'check' first."
        fi
        ;;
    *)
        echo "Usage: $0 {baseline|check [TIER]|report}"
        exit 1
        ;;
esac

# Version & Run Log Footer
# v1.0.0 | 2025-09-29 | code-analyzer@sonnet-4 | Regression detection monitor | regression-monitor.sh | OK | SHA:a7b4c9d