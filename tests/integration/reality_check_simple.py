from src.constants.base import CONNASCENCE_ANALYSIS_THRESHOLD, MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_RETRY_ATTEMPTS
"""

Focused test that validates the GitHub integration without complex imports.
Tests the actual HTTP functionality and correlation logic.
"""

import sys
import json
import tempfile
import os
from pathlib import Path
from datetime import datetime

# Add analyzer to path
sys.path.append(str(Path(__file__).parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent / "analyzer"))

# Import just what we need for testing
from mock_github_server import MockGitHubServer
import time
"""

def test_github_bridge_reality():
    """Test GitHub Bridge makes real HTTP requests."""
    print(" REALITY CHECK: GitHub Bridge HTTP Requests")
    print("-" * 50)

    # Start mock server
    server = MockGitHubServer(port=8890)
    server.start()
    time.sleep(0.2)

    try:
        # Import GitHub bridge directly
        from analyzer.integrations.github_bridge import GitHubBridge, GitHubConfig, UnifiedAnalysisResult

        # Configure to use mock server
        config = GitHubConfig(
            token="test-token-reality",
            owner="test-owner",
            repo="test-repo",
            base_url="http://localhost:8890"
        )

        bridge = GitHubBridge(config)

        # Create test analysis result
        test_result = UnifiedAnalysisResult(
            success=False,
            violations=[],
            nasa_compliance_score=0.76,
            god_objects_found=2,
            duplication_percentage=16.MAXIMUM_RETRY_ATTEMPTS
        )

        # Test 1: PR Comment posting
        success = bridge.post_pr_comment(42, test_result)
        print(f"  Result: {'[OK] SUCCESS' if success else '[FAIL] FAILED'}")

        # Verify real HTTP request was made
        requests = server.get_requests()
        if len(requests) == 1:
            req = requests[0]
            print(f"  [OK] Real HTTP POST to: {req['path']}")
            print(f"  [OK] Real auth header: {req['headers'].get('Authorization', 'MISSING')[:20]}...")

            # Check for real data in comment
            comment_body = req['data'].get('body', '')
            if '76.0%' in comment_body and 'God Objects Found: 2' in comment_body:
                print(f"  [OK] Real analysis data included in comment")
                data_reality = True
            else:
                print(f"  [FAIL] Fake or missing analysis data")
                data_reality = False
        else:
            print(f"  [FAIL] No HTTP request made - pure theater!")
            data_reality = False

        server.clear_requests()

        # Test 2: Status Check
        success = bridge.update_status_check("abc123", test_result)
        print(f"  Result: {'[OK] SUCCESS' if success else '[FAIL] FAILED'}")

        requests = server.get_requests()
        if len(requests) == 1:
            req = requests[0]
            print(f"  [OK] Real HTTP POST to: {req['path']}")
            status_data = req['data']
            if status_data.get('state') == 'failure' and '2 critical violations' in status_data.get('description', ''):
                print(f"  [OK] Real status based on analysis data")
                status_reality = True
            else:
                print(f"  [FAIL] Fake status data")
                status_reality = False
        else:
            print(f"  [FAIL] No status check HTTP request - theater!")
            status_reality = False

        # Test 3: Authentication validation
        bad_config = GitHubConfig(token="", owner="test", repo="test", base_url="http://localhost:8890")
        bad_bridge = GitHubBridge(bad_config)
        server.clear_requests()

        success = bad_bridge.post_pr_comment(1, test_result)
        if not success:
            print(f"  [OK] Correctly rejected request without auth")
            auth_reality = True
        else:
            print(f"  [FAIL] Accepted request without auth - security theater!")
            auth_reality = False

        # Calculate reality score for GitHub Bridge
        tests_passed = sum([data_reality, status_reality, auth_reality])
        github_reality_score = (tests_passed / 3) * 100

        print(f"\n GitHub Bridge Reality Score: {github_reality_score:.1f}%")

        return github_reality_score >= 80

    finally:
        server.stop()

def test_correlation_logic_reality():
    """Test ToolCoordinator correlation logic is real."""
    print(f"\n REALITY CHECK: Correlation Logic")
    print("-" * 50)

    # Test data with known overlap
    connascence_data = {
        "violations": [
            {"file_path": "src/user.py", "severity": "critical"},      # Overlap 1
            {"file_path": "src/payment.py", "severity": "high"},       # Overlap 2
            {"file_path": "src/auth.py", "severity": "medium"}         # No overlap
        ],
        "nasa_compliance": 0.80,
        "god_objects_found": 1,
        "duplication_percentage": 12.0
    }

    external_data = {
        "issues": [
            {"file": "src/user.py", "severity": "error"},             # Overlap 1
            {"file": "src/payment.py", "severity": "warning"},        # Overlap 2
            {"file": "src/database.py", "severity": "info"}           # No overlap
        ],
        "compliance_score": 0.85
    }

    # Manual calculation of expected results
    expected_overlap = 2  # user.py and payment.py
    expected_total = 6    # 3 + 3 violations
    expected_avg_compliance = 0.825  # (0.80 + 0.85) / 2

    try:
        # Test the correlation without full imports
        from analyzer.integrations.tool_coordinator import ToolCoordinator

        coordinator = ToolCoordinator()
        result = coordinator.correlate_results(connascence_data, external_data)

        # Test overlap calculation
        actual_overlap = result['correlation_analysis']['overlapping_files']
        overlap_correct = actual_overlap == expected_overlap
        print(f" Overlap Calculation: {actual_overlap} == {expected_overlap} {'[OK]' if overlap_correct else '[FAIL]'}")

        # Test total violations
        actual_total = result['consolidated_findings']['total_violations']
        total_correct = actual_total == expected_total
        print(f" Total Violations: {actual_total} == {expected_total} {'[OK]' if total_correct else '[FAIL]'}")

        # Test compliance average
        actual_avg = result['consolidated_findings']['nasa_compliance']
        avg_correct = abs(actual_avg - expected_avg_compliance) < 0.01
        print(f" Compliance Average: {actual_avg:.3f}  {expected_avg_compliance:.3f} {'[OK]' if avg_correct else '[FAIL]'}")

        # Test correlation score bounds
        corr_score = result['correlation_analysis']['correlation_score']
        score_valid = 0.0 <= corr_score <= 1.0
        print(f" Correlation Score Bounds: {corr_score:.3f} in [0, 1] {'[OK]' if score_valid else '[FAIL]'}")

        # Check for hardcoded theater values
        theater_check = corr_score != CONNASCENCE_ANALYSIS_THRESHOLD  # Common theater value
        print(f" Not Hardcoded Theater: {corr_score:.3f} != 0.88 {'[OK]' if theater_check else '[FAIL]'}")

        # Test recommendations generation
        recommendations = result['recommendations']
        has_recommendations = len(recommendations) > 0
        print(f" Recommendations Generated: {len(recommendations)} > 0 {'[OK]' if has_recommendations else '[FAIL]'}")

        tests_passed = sum([overlap_correct, total_correct, avg_correct, score_valid, theater_check, has_recommendations])
        correlation_reality_score = (tests_passed / 6) * 100

        print(f"\n Correlation Logic Reality Score: {correlation_reality_score:.1f}%")

        return correlation_reality_score >= 70

    except Exception as e:
        return False

def test_file_operations_reality():
    """Test that file operations work with real data."""
    print(f"\n REALITY CHECK: File Operations")
    print("-" * 50)

    with tempfile.TemporaryDirectory() as temp_dir:
        connascence_file = Path(temp_dir) / "connascence.json"
        external_file = Path(temp_dir) / "external.json"
        output_file = Path(temp_dir) / "output.json"

        # Create real test data
        test_connascence = {
            "success": False,
            "violations": [{"file_path": "test.py", "severity": "high"}],
            "nasa_compliance": 0.77
        }

        test_external = {
            "issues": [{"file": "test.py", "severity": "error"}],
            "compliance_score": 0.83
        }

        # Write test files
        with open(connascence_file, 'w') as f:
            json.dump(test_connascence, f)

        with open(external_file, 'w') as f:
            json.dump(test_external, f)

        # Test loading and processing
        try:
            from analyzer.integrations.tool_coordinator import ToolCoordinator

            coordinator = ToolCoordinator()

            # Load files
            with open(connascence_file, 'r') as f:
                loaded_conn = json.load(f)

            with open(external_file, 'r') as f:
                loaded_ext = json.load(f)

            # Process data
            result = coordinator.correlate_results(loaded_conn, loaded_ext)

            # Save output
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)

            # Verify output
            if output_file.exists():
                with open(output_file, 'r') as f:
                    saved_result = json.load(f)

                if 'correlation_analysis' in saved_result and 'consolidated_findings' in saved_result:
                    print(f"[OK] File operations completed successfully")
                    print(f"[OK] Output contains expected structure")
                    return True
                else:
                    print(f"[FAIL] Output missing expected data structure")
                    return False
            else:
                print(f"[FAIL] Output file was not created")
                return False

        except Exception as e:
            print(f"[FAIL] File operations failed: {e}")
            return False

def calculate_overall_reality_score():
    """Calculate the final reality score for Phase 2 GitHub integration."""
    print(f"\n" + "=" * 60)
    print(f"PHASE 2 GITHUB INTEGRATION REALITY ASSESSMENT")
    print("=" * 60)

    # Run all tests
    github_real = test_github_bridge_reality()
    correlation_real = test_correlation_logic_reality()
    file_ops_real = test_file_operations_reality()

    # Calculate weighted score
    scores = {
        "GitHub HTTP Integration": (github_real, 40),    # Most critical
        "Correlation Logic": (correlation_real, 35),     # Core functionality
        "File Operations": (file_ops_real, 25)           # Basic requirement
    }

    total_weight = 0
    weighted_score = 0

    print(f"\n COMPONENT SCORES:")
    for component, (passed, weight) in scores.items():
        score = MAXIMUM_FUNCTION_LENGTH_LINES if passed else 0
        weighted_score += score * weight
        total_weight += weight
        status = "[OK] REAL" if passed else "[FAIL] THEATER"
        print(f"  {status} {component}: {score}% (weight: {weight}%)")

    final_reality_score = weighted_score / total_weight

    print(f"\nFINAL REALITY SCORE: {final_reality_score:.1f}%")

    # Determine readiness level
    if final_reality_score >= 85:
        readiness = "PRODUCTION READY"
        description = "Real functionality, minimal theater"
    elif final_reality_score >= 70:
        readiness = "MOSTLY REAL"
        description = "Good foundation, minor issues"
    elif final_reality_score >= 50:
        readiness = "NEEDS WORK"
        description = "Significant theater detected"
    else:
        readiness = "MAJOR THEATER"
        description = "Extensive fake functionality"

    print(f"\n{readiness}")
    print(f"Assessment: {description}")

    # Specific recommendations
    print(f"\nRECOMMENDATIONS:")
    if not github_real:
        print(f"  - Fix GitHub Bridge HTTP integration")
    if not correlation_real:
        print(f"  - Fix correlation logic calculations")
    if not file_ops_real:
        print(f"  - Fix file I/O operations")

    if final_reality_score >= 85:
        print(f"  - Ready for production CI/CD integration")
        print(f"  - Can handle real GitHub API calls")
        print(f"  - Correlation logic produces valid results")

    return final_reality_score

if __name__ == "__main__":
    reality_score = calculate_overall_reality_score()

    print(f"\n" + "=" * 60)
    if reality_score >= 70:
        print(f"PHASE 2 PASSES REALITY CHECK")
        sys.exit(0)
    else:
        print(f"PHASE 2 FAILS REALITY CHECK - THEATER DETECTED")
        sys.exit(1)