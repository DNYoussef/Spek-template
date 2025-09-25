from src.constants.base import MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS
"""

This script tests the ToolCoordinator in a sandboxed environment
to verify it can actually process real data and correlate results.
"""

import sys
import json
import tempfile
import subprocess
from pathlib import Path
"""

# Add analyzer to path
sys.path.append(str(Path(__file__).parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent / "analyzer"))

from analyzer.integrations.tool_coordinator import ToolCoordinator
"""

def create_test_data():
    """Create realistic test data for correlation testing."""

    connascence_data = {
        "success": False,
        "violations": [
            {
                "file_path": "src/payment/processor.py",
                "line_number": 45,
                "severity": "critical",
                "type": "God Object",
                "description": "Class PaymentProcessor has 892 lines and 47 methods - violates SRP",
                "recommendation": "Split into PaymentValidator, PaymentExecutor, PaymentLogger"
            },
            {
                "file_path": "src/user/manager.py",
                "line_number": 123,
                "severity": "high",
                "type": "High Coupling",
                "description": "Method create_user imports 15 different modules",
                "recommendation": "Use dependency injection and reduce direct imports"
            },
            {
                "file_path": "src/auth/validator.py",
                "line_number": 67,
                "severity": "medium",
                "type": "Data Coupling",
                "description": "Method validate_token accesses 8 different data structures",
                "recommendation": "Create unified AuthContext object"
            },
            {
                "file_path": "src/payment/processor.py",
                "line_number": 234,
                "severity": "high",
                "type": "Content Coupling",
                "description": "Direct manipulation of PaymentStatus._internal_state",
                "recommendation": "Use public API methods instead"
            }
        ],
        "nasa_compliance": 0.74,
        "six_sigma_level": 3.1,
        "mece_score": 0.68,
        "god_objects_found": MAXIMUM_RETRY_ATTEMPTS,
        "duplication_percentage": 19.7
    }

    external_data = {
        "tool": "pylint",
        "version": "2.15.0",
        "timestamp": "2025-1-15T10:30:00Z",
        "issues": [
            {
                "file": "src/payment/processor.py",
                "line": 45,
                "severity": "error",
                "code": "R0904",
                "message": "Too many public methods (52/20)"
            },
            {
                "file": "src/user/manager.py",
                "line": 123,
                "severity": "warning",
                "code": "R0401",
                "message": "Cyclic import detected"
            },
            {
                "file": "src/database/connection.py",
                "line": 89,
                "severity": "error",
                "code": "W0622",
                "message": "Redefining built-in 'id'"
            },
            {
                "file": "src/utils/helpers.py",
                "line": 12,
                "severity": "warning",
                "code": "C0103",
                "message": "Function name doesn't conform to snake_case"
            }
        ],
        "compliance_score": 0.81,
        "overall_rating": "C+",
        "total_issues": 4
    }

    return connascence_data, external_data

def test_correlation_sandbox():
    """Test correlation logic in sandbox environment."""
    print("-" * 50)

    # Create test data
    connascence_data, external_data = create_test_data()

    print(f"  Connascence violations: {len(connascence_data['violations'])}")
    print(f"  External issues: {len(external_data['issues'])}")
    print(f"  NASA compliance: {connascence_data['nasa_compliance']:.1%}")
    print(f"  External compliance: {external_data['compliance_score']:.1%}")

    # Initialize coordinator
    coordinator = ToolCoordinator()

    # Run correlation
    print(f"\n Running correlation analysis...")
    correlation = coordinator.correlate_results(connascence_data, external_data)

    # Analyze results
    print(f"\n Correlation Results:")
    print(f"  Status: {correlation['coordination_status']}")

    correlation_analysis = correlation['correlation_analysis']
    print(f"\n Correlation Analysis:")
    print(f"  Tools integrated: {correlation_analysis['tools_integrated']}")
    print(f"  Correlation score: {correlation_analysis['correlation_score']:.1%}")
    print(f"  Consistency check: {correlation_analysis['consistency_check']}")
    print(f"  Overlapping files: {correlation_analysis['overlapping_files']}")
    print(f"  Unique connascence findings: {correlation_analysis['unique_connascence_findings']}")
    print(f"  Unique external findings: {correlation_analysis['unique_external_findings']}")

    consolidated = correlation['consolidated_findings']
    print(f"\n Consolidated Findings:")
    print(f"  NASA compliance: {consolidated['nasa_compliance']:.1%}")
    print(f"  Total violations: {consolidated['total_violations']}")
    print(f"  Critical violations: {consolidated['critical_violations']}")
    print(f"  Confidence level: {consolidated['confidence_level']}")
    print(f"  Quality score: {consolidated['quality_score']:.1%}")

    print(f"\n Recommendations:")
    for i, rec in enumerate(correlation['recommendations'], 1):
        print(f"  {i}. {rec}")

    # Validate results make sense
    validation_results = validate_correlation_results(correlation, connascence_data, external_data)

    return correlation, validation_results

def validate_correlation_results(correlation, connascence_data, external_data):
    """Validate that correlation results are realistic and not theater."""
    validation = {
        "tests": [],
        "passed": 0,
        "failed": 0,
        "reality_score": 0
    }

    def add_test(name, condition, details=""):
        validation["tests"].append({
            "name": name,
            "passed": condition,
            "details": details
        })
        if condition:
            validation["passed"] += 1
        else:
            validation["failed"] += 1

    # Test 1: Overlapping files calculation
    conn_files = {v["file_path"] for v in connascence_data["violations"]}
    ext_files = {i["file"] for i in external_data["issues"]}
    expected_overlap = len(conn_files & ext_files)
    actual_overlap = correlation["correlation_analysis"]["overlapping_files"]

    add_test(
        "Overlapping files calculation",
        actual_overlap == expected_overlap,
        f"Expected {expected_overlap}, got {actual_overlap}"
    )

    # Test 2: Total violations sum
    expected_total = len(connascence_data["violations"]) + len(external_data["issues"])
    actual_total = correlation["consolidated_findings"]["total_violations"]

    add_test(
        "Total violations sum",
        actual_total == expected_total,
        f"Expected {expected_total}, got {actual_total}"
    )

    # Test 3: NASA compliance average
    expected_avg = (connascence_data["nasa_compliance"] + external_data["compliance_score"]) / 2
    actual_avg = correlation["consolidated_findings"]["nasa_compliance"]

    add_test(
        "NASA compliance average",
        abs(actual_avg - expected_avg) < 0.1,
        f"Expected {expected_avg:.3f}, got {actual_avg:.3f}"
    )

    # Test 4: Critical violations count
    expected_critical = len([v for v in connascence_data["violations"] if v["severity"] == "critical"])
    actual_critical = correlation["consolidated_findings"]["critical_violations"]

    add_test(
        "Critical violations count",
        actual_critical == expected_critical,
        f"Expected {expected_critical}, got {actual_critical}"
    )

    # Test MAXIMUM_NESTED_DEPTH: Correlation score bounds
    corr_score = correlation["correlation_analysis"]["correlation_score"]
    add_test(
        "Correlation score bounds",
        0.0 <= corr_score <= 1.0,
        f"Score {corr_score:.3f} should be between 0.0 and 1.0"
    )

    # Test 6: Recommendations are not empty
    recommendations = correlation["recommendations"]
    add_test(
        "Recommendations generated",
        len(recommendations) > 0,
        f"Got {len(recommendations)} recommendations"
    )

    # Test 7: Timestamp format
    timestamp = correlation["timestamp"]
    try:
        from datetime import datetime
        datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        timestamp_valid = True
    except:
        timestamp_valid = False

    add_test(
        "Valid timestamp format",
        timestamp_valid,
        f"Timestamp: {timestamp}"
    )

    # Calculate reality score
    total_tests = validation["passed"] + validation["failed"]
    validation["reality_score"] = (validation["passed"] / total_tests * 100) if total_tests > 0 else 0

    return validation

def test_command_line_interface():
    """Test the command-line interface of tool_coordinator.py"""
    print("-" * 50)

    with tempfile.TemporaryDirectory() as temp_dir:
        # Create test input files
        connascence_file = Path(temp_dir) / "connascence.json"
        external_file = Path(temp_dir) / "external.json"
        output_file = Path(temp_dir) / "output.json"

        connascence_data, external_data = create_test_data()

        with open(connascence_file, 'w') as f:
            json.dump(connascence_data, f, indent=2)

        with open(external_file, 'w') as f:
            json.dump(external_data, f, indent=2)

        # Test the CLI
        coordinator_script = Path(__file__).parent.parent.parent / "analyzer" / "integrations" / "tool_coordinator.py"

        if not coordinator_script.exists():
            print(f" Script not found: {coordinator_script}")
            return False

        cmd = [
            sys.executable, str(coordinator_script),
            "--connascence-results", str(connascence_file),
            "--external-results", str(external_file),
            "--output", str(output_file)
        ]

        print(f" Running command: {' '.join(cmd)}")

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            print(f" Exit code: {result.returncode}")
            print(f" STDOUT:\n{result.stdout}")
            if result.stderr:
                print(f"  STDERR:\n{result.stderr}")

            # Check output file was created
            if output_file.exists():
                with open(output_file, 'r') as f:
                    output_data = json.load(f)

                print(f" Output file created successfully")
                print(f" Correlation score: {output_data['correlation_analysis']['correlation_score']:.1%}")
                print(f" Quality score: {output_data['consolidated_findings']['quality_score']:.1%}")

                return True
            else:
                print(f" Output file not created")
                return False

        except subprocess.TimeoutExpired:
            print(f" Command timed out after 30 seconds")
            return False
        except Exception as e:
            print(f" Command failed: {e}")
            return False

def main():
    """Main sandbox testing function."""
    print("=" * 60)

    # Test 1: Correlation logic
    try:
        correlation, validation = test_correlation_sandbox()

        print(f"\n VALIDATION RESULTS:")
        print(f"  Reality score: {validation['reality_score']:.1f}%")

        for test in validation["tests"]:
            status = "" if test["passed"] else ""

        correlation_success = validation['reality_score'] >= 70

    except Exception as e:
        correlation_success = False

    # Test 2: Command line interface
    try:
        cli_success = test_command_line_interface()
    except Exception as e:
        cli_success = False

    # Final assessment
    print(f"\n" + "=" * 60)
    print(f"  Correlation Logic: {' PASS' if correlation_success else ' FAIL'}")
    print(f"  CLI Interface: {' PASS' if cli_success else ' FAIL'}")

    overall_success = correlation_success and cli_success
    print(f"\n OVERALL: {' PRODUCTION READY' if overall_success else ' NEEDS WORK'}")

    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)