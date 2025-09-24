#!/usr/bin/env bash

# Comprehensive Security Audit Script
# Scans codebase for CWE-78, CWE-88, CWE-917, CWE-95 vulnerabilities

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT=$(pwd)
REPORT_FILE=".claude/.artifacts/security-audit-report.json"
SARIF_FILE=".claude/.artifacts/semgrep-security.sarif"

echo -e "${BLUE}🛡️  Security Audit - CWE Vulnerability Detection${NC}"
echo "=================================================="

# Initialize report
cat > "$REPORT_FILE" << 'EOF'
{
  "timestamp": "",
  "vulnerabilities": {
    "CWE-78": [],
    "CWE-88": [],
    "CWE-917": [],
    "CWE-95": []
  },
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  }
}
EOF

# Update timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
python3 -c "import json; d=json.load(open('$REPORT_FILE')); d['timestamp']='$TIMESTAMP'; json.dump(d, open('$REPORT_FILE', 'w'), indent=2)"

# CWE-78: OS Command Injection
echo -e "\n${YELLOW}🔍 Scanning for CWE-78: OS Command Injection${NC}"
echo "Dangerous patterns: eval, exec, subprocess with shell=True, os.system"

CWE78_COUNT=0

# Python: os.system, subprocess with shell=True
if command -v rg &> /dev/null; then
  CWE78_PY=$(rg -t py -n "os\.system\(|subprocess\.(call|run|Popen).*shell\s*=\s*True" --json 2>/dev/null | wc -l || echo "0")
  CWE78_COUNT=$((CWE78_COUNT + CWE78_PY))

  # Bash: eval with user input
  CWE78_SH=$(rg -t sh -n "eval.*\$|eval \".*\$" --json 2>/dev/null | wc -l || echo "0")
  CWE78_COUNT=$((CWE78_COUNT + CWE78_SH))
fi

echo "   Found: $CWE78_COUNT potential issues"

# CWE-88: Argument Injection
echo -e "\n${YELLOW}🔍 Scanning for CWE-88: Argument Injection${NC}"
echo "Dangerous patterns: unvalidated path arguments, command-line injection"

CWE88_COUNT=0

if command -v rg &> /dev/null; then
  # Path operations without validation
  CWE88_PATH=$(rg -t py -n "os\.path\.join.*user|open\(user|pathlib\.Path\(user" --json 2>/dev/null | wc -l || echo "0")
  CWE88_COUNT=$((CWE88_COUNT + CWE88_PATH))
fi

echo "   Found: $CWE88_COUNT potential issues"

# CWE-917: Expression Language Injection
echo -e "\n${YELLOW}🔍 Scanning for CWE-917: Expression Language Injection${NC}"
echo "Dangerous patterns: eval(), exec(), compile() with user input"

CWE917_COUNT=0

if command -v rg &> /dev/null; then
  # Python eval/exec
  CWE917_PY=$(rg -t py -n "eval\(|exec\(|compile\(" --json 2>/dev/null | wc -l || echo "0")

  # Filter out safe uses (ast.literal_eval, model.eval())
  CWE917_SAFE=$(rg -t py -n "ast\.literal_eval\(|\.eval\(\)" --json 2>/dev/null | wc -l || echo "0")
  CWE917_COUNT=$((CWE917_PY - CWE917_SAFE))

  # JavaScript eval
  CWE917_JS=$(rg -t js -n "eval\(|Function\(" --json 2>/dev/null | wc -l || echo "0")
  CWE917_COUNT=$((CWE917_COUNT + CWE917_JS))
fi

echo "   Found: $CWE917_COUNT potential issues"

# CWE-95: Code Injection
echo -e "\n${YELLOW}🔍 Scanning for CWE-95: Code Injection${NC}"
echo "Dangerous patterns: dynamic require(), import(), __import__()"

CWE95_COUNT=0

if command -v rg &> /dev/null; then
  # JavaScript dynamic require
  CWE95_JS=$(rg -t js -n "require\(.*\$|require\(.*user" --json 2>/dev/null | wc -l || echo "0")
  CWE95_COUNT=$((CWE95_COUNT + CWE95_JS))

  # Python __import__
  CWE95_PY=$(rg -t py -n "__import__\(|importlib\.import_module\(.*user" --json 2>/dev/null | wc -l || echo "0")
  CWE95_COUNT=$((CWE95_COUNT + CWE95_PY))
fi

echo "   Found: $CWE95_COUNT potential issues"

# Run Semgrep if available
if command -v semgrep &> /dev/null; then
  echo -e "\n${BLUE}🔬 Running Semgrep security rules${NC}"

  semgrep --config=auto \
    --severity=ERROR \
    --severity=WARNING \
    --sarif \
    --output="$SARIF_FILE" \
    . 2>/dev/null || true

  if [ -f "$SARIF_FILE" ]; then
    SEMGREP_CRITICAL=$(cat "$SARIF_FILE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len([r for r in d.get('runs', [{}])[0].get('results', []) if r.get('level') == 'error']))" 2>/dev/null || echo "0")
    SEMGREP_HIGH=$(cat "$SARIF_FILE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len([r for r in d.get('runs', [{}])[0].get('results', []) if r.get('level') == 'warning']))" 2>/dev/null || echo "0")

    echo "   Critical: $SEMGREP_CRITICAL"
    echo "   High: $SEMGREP_HIGH"
  fi
else
  echo -e "${YELLOW}⚠️  Semgrep not installed, skipping${NC}"
  SEMGREP_CRITICAL=0
  SEMGREP_HIGH=0
fi

# Generate summary
TOTAL=$((CWE78_COUNT + CWE88_COUNT + CWE917_COUNT + CWE95_COUNT))

echo -e "\n${BLUE}📊 Security Audit Summary${NC}"
echo "=========================="
echo -e "CWE-78 (Command Injection):    $CWE78_COUNT"
echo -e "CWE-88 (Argument Injection):   $CWE88_COUNT"
echo -e "CWE-917 (Expression Injection): $CWE917_COUNT"
echo -e "CWE-95 (Code Injection):       $CWE95_COUNT"
echo -e "Semgrep Critical:              $SEMGREP_CRITICAL"
echo -e "Semgrep High:                  $SEMGREP_HIGH"
echo "------------------------"
echo -e "Total Issues:                  $TOTAL"

# Update report
python3 << EOF
import json

with open('$REPORT_FILE', 'r') as f:
    report = json.load(f)

report['summary']['total'] = $TOTAL
report['summary']['critical'] = $SEMGREP_CRITICAL
report['summary']['high'] = $SEMGREP_HIGH

with open('$REPORT_FILE', 'w') as f:
    json.dump(report, f, indent=2)
EOF

# Exit status
if [ "$TOTAL" -gt 0 ] || [ "$SEMGREP_CRITICAL" -gt 0 ]; then
  echo -e "\n${RED}❌ Security audit failed: vulnerabilities detected${NC}"
  echo "   Review report: $REPORT_FILE"
  echo "   Run security fixes: npm run security:fix"
  exit 1
else
  echo -e "\n${GREEN}✅ Security audit passed: no vulnerabilities detected${NC}"
  exit 0
fi