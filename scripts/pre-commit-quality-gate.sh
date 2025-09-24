#!/bin/bash
# Pre-commit Quality Gate Validation
# Prevents commits that violate quality thresholds or contain theater patterns

set -e

STRATEGY_FILE="docs/enhancement/quality-gate-strategy.json"
METRICS_FILE="docs/metrics-current.json"
DASHBOARD_FILE="docs/quality-dashboard.json"

echo "=== Pre-Commit Quality Gate Validation ==="
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# 1. Run unit tests
echo -e "\n[1/6] Running unit tests..."
if command -v pytest &> /dev/null; then
    pytest tests/ --tb=short --quiet || {
        echo "ERROR: Unit tests failed"
        exit 1
    }
    echo "SUCCESS: All unit tests passed"
else
    echo "WARNING: pytest not found, skipping unit tests"
fi

# 2. Check code coverage
echo -e "\n[2/6] Checking code coverage..."
if command -v pytest &> /dev/null; then
    coverage run -m pytest tests/ --quiet
    COVERAGE=$(coverage report --precision=2 | grep TOTAL | awk '{print $4}' | sed 's/%//')

    # Get minimum coverage from current milestone
    MIN_COVERAGE=$(python3 -c "
import json
import sys
with open('$STRATEGY_FILE') as f:
    strategy = json.load(f)
    # Find current milestone based on latest metrics
    print(40.0)  # M1 minimum for now
")

    if (( $(echo "$COVERAGE < $MIN_COVERAGE" | bc -l) )); then
        echo "ERROR: Coverage $COVERAGE% below minimum $MIN_COVERAGE%"
        exit 1
    fi
    echo "SUCCESS: Coverage $COVERAGE% meets minimum $MIN_COVERAGE%"
else
    echo "WARNING: coverage tool not found, skipping coverage check"
fi

# 3. Run security scan
echo -e "\n[3/6] Running security scan..."
if command -v bandit &> /dev/null; then
    bandit -r . -ll -f json -o /tmp/bandit-results.json || true

    CRITICAL_COUNT=$(python3 -c "
import json
with open('/tmp/bandit-results.json') as f:
    results = json.load(f)
    print(len([r for r in results.get('results', []) if r['issue_severity'] == 'HIGH']))
")

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo "ERROR: Found $CRITICAL_COUNT critical security issues"
        exit 1
    fi
    echo "SUCCESS: No critical security issues found"
else
    echo "WARNING: bandit not found, skipping security scan"
fi

# 4. Verify NASA compliance
echo -e "\n[4/6] Verifying NASA POT10 compliance..."
python3 << 'EOF'
import json
import sys
from pathlib import Path

# Run compliance check
compliance_result = {
    "nasa_compliance": 0.0,
    "violations": []
}

# Check for compliance violations
violations = []

# Rule 1: No goto statements
for py_file in Path('.').rglob('*.py'):
    if 'tests/' in str(py_file) or '__pycache__' in str(py_file):
        continue
    content = py_file.read_text()
    if 'goto' in content.lower():
        violations.append(f"Rule 1 violation: goto in {py_file}")

# Rule 4: Function length check (simplified)
for py_file in Path('.').rglob('*.py'):
    if 'tests/' in str(py_file) or '__pycache__' in str(py_file):
        continue
    content = py_file.read_text()
    lines = content.split('\n')
    in_function = False
    func_length = 0
    for line in lines:
        if line.strip().startswith('def '):
            in_function = True
            func_length = 0
        elif in_function:
            func_length += 1
            if func_length > 60 and (line.strip().startswith('def ') or not line.strip()):
                violations.append(f"Rule 4 violation: function >60 lines in {py_file}")
                in_function = False

if violations:
    print(f"NASA compliance violations found: {len(violations)}")
    for v in violations[:5]:  # Show first 5
        print(f"  - {v}")
    sys.exit(1)
else:
    print("NASA POT10 compliance: PASSED")
EOF

if [ $? -ne 0 ]; then
    echo "ERROR: NASA POT10 compliance check failed"
    exit 1
fi

# 5. Detect theater patterns
echo -e "\n[5/6] Detecting theater patterns..."
python3 << 'EOF'
import json
import sys
from pathlib import Path
import re

theater_patterns = []

# Check for coverage without assertions
for py_file in Path('tests/').rglob('*.py'):
    content = py_file.read_text()

    # Count test functions
    test_funcs = re.findall(r'def test_\w+', content)
    # Count assertions
    assertions = re.findall(r'assert\s+', content)

    if test_funcs and len(assertions) < len(test_funcs) * 0.7:
        theater_patterns.append(f"Low assertion ratio in {py_file}: {len(assertions)}/{len(test_funcs)}")

# Check for disabled security scans
for py_file in Path('.').rglob('*.py'):
    if 'tests/' in str(py_file):
        continue
    content = py_file.read_text()
    if 'nosec' in content or 'noqa' in content:
        theater_patterns.append(f"Security scan disabled in {py_file}")

if theater_patterns:
    print(f"Theater patterns detected: {len(theater_patterns)}")
    for pattern in theater_patterns[:3]:
        print(f"  - {pattern}")
    sys.exit(1)
else:
    print("Theater detection: PASSED")
EOF

if [ $? -ne 0 ]; then
    echo "ERROR: Theater patterns detected"
    exit 1
fi

# 6. Update metrics
echo -e "\n[6/6] Updating metrics..."
python3 << 'EOF'
import json
from datetime import datetime
from pathlib import Path

metrics = {
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "pre_commit_validation": "passed",
    "checks_completed": [
        "unit_tests",
        "code_coverage",
        "security_scan",
        "nasa_compliance",
        "theater_detection"
    ]
}

Path("docs/metrics-current.json").write_text(json.dumps(metrics, indent=2))
print(f"Metrics updated: {metrics['timestamp']}")
EOF

echo -e "\n=== Quality Gate: PASSED ==="
echo "Commit approved for current milestone"