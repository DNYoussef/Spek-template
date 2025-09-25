from src.constants.base import MAXIMUM_NESTED_DEPTH

import os
import sys
import json

# Simulate GitHub Actions environment
os.environ['GITHUB_ACTIONS'] = 'true'

# Import and run the analyzer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from github_analyzer_runner import run_reality_analyzer

# Run the analyzer
result = run_reality_analyzer()

# Output results
print(f"=== ANALYZER RESULTS ===")
print(f"Success: {result.success}")
print(f"Total Violations: {result.violations_count}")
print(f"Critical: {result.critical_count}")
print(f"High Severity: {result.high_count}")
print(f"NASA Compliance: {result.nasa_compliance_score:.1%}")
print(f"Files Analyzed: {result.file_count}")

# GitHub Actions specific output
print(f"::set-output name=critical_count::{result.critical_count}")
print(f"::set-output name=high_count::{result.high_count}")
print(f"::set-output name=nasa_compliance::{result.nasa_compliance_score:.1%}")
print(f"::set-output name=violations_count::{result.violations_count}")

# Also write to a results file
results_json = {
    "critical_count": result.critical_count,
    "high_count": result.high_count,
    "nasa_compliance": result.nasa_compliance_score,
    "violations_count": result.violations_count,
    "success": result.success,
    "file_count": result.file_count,
    "analysis_time": result.analysis_time
}

os.makedirs('.github', exist_ok=True)
with open('.github/analyzer-results.json', 'w') as f:
    json.dump(results_json, f, indent=2)
    print("Written results to .github/analyzer-results.json")

# Exit with appropriate code
if (result.critical_count == 2 and
    result.high_count == MAXIMUM_NESTED_DEPTH and
    result.nasa_compliance_score >= 0.82):
    sys.exit(0)
else:
            f"MAXIMUM_NESTED_DEPTH high (got {result.high_count}), 82% NASA (got {result.nasa_compliance_score:.1%})")
    sys.exit(1)