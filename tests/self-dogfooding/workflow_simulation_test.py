from src.constants.base import DAYS_RETENTION_PERIOD

import json
import os
import sys
import tempfile
import subprocess

def create_test_results_structure():
    """Create the expected directory structure for test results."""
    os.makedirs("analyzer/test_results", exist_ok=True)
    
def simulate_workflow_step(step_name, test_data_file):
    """Simulate a workflow step with the given test data."""
    print(f"\n=== WORKFLOW STEP: {step_name} ===")
    
    # Copy test data to expected location
    result_file = f"analyzer/test_results/{test_data_file}"
    os.makedirs(os.path.dirname(result_file), exist_ok=True)
    
    # Use appropriate test data based on step
    if "success" in step_name.lower():
        source_file = "self_analysis_success.json"
    elif "failure" in step_name.lower():
        source_file = "self_analysis_failure.json"
    elif "edge" in step_name.lower():
        source_file = "self_analysis_edge_case.json"
    else:
        source_file = "self_analysis_success.json"  # default
    
    with open(source_file, 'r') as src:
        test_data = json.load(src)
    
    with open(result_file, 'w') as dst:
        json.dump(test_data, dst, indent=2)
    
    return result_file

def extract_metrics_from_file(file_path):
    """Extract metrics using the exact Python commands from the workflow."""
    print(f"\nExtracting metrics from: {file_path}")
    
    # The exact commands from the workflow (properly escaped)
    commands = [
        f'python -c "import json; data=json.load(open(\'{file_path}\')); print(f\'Total violations: {{len(data.get(\\\"violations\\\", []))}}\')"',
        f'python -c "import json; data=json.load(open(\'{file_path}\')); critical=[v for v in data.get(\'violations\',[]) if v.get(\'severity\')==\'critical\']; print(f\'Critical: {{len(critical)}}\')"',
        f'python -c "import json; data=json.load(open(\'{file_path}\')); nasa_score=data.get(\'nasa_compliance\',{{}}).get(\'score\', 0); print(f\'NASA: {{nasa_score:.1%}}\')"',
        f'python -c "import json; data=json.load(open(\'{file_path}\')); god_objects=len(data.get(\'god_objects\',[])); print(f\'God objects: {{god_objects}}\')"',
        f'python -c "import json; data=json.load(open(\'{file_path}\')); mece_score=data.get(\'mece_analysis\',{{}}).get(\'score\', 0); print(f\'MECE: {{mece_score:.1%}}\')"'
    ]
    
    results = []
    for cmd in commands:
        try:
            result = subprocess.run(cmd, shell=False, capture_output=True, text=True, check=True)
            output = result.stdout.strip()
            print(f"  {output}")
            results.append(output)
        except subprocess.CalledProcessError as e:
            print(f"  ERROR: {e.stderr.strip()}")
            results.append("ERROR")
    
    return results

def simulate_quality_gates(file_path):
    """Simulate the quality gate assessment from the workflow."""
    print(f"\n=== QUALITY GATE ASSESSMENT ===")
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Extract values as in workflow
        nasa_score = data.get('nasa_compliance', {}).get('score', 0.0)
        total_violations = len(data.get('violations', []))
        critical_violations = len([v for v in data.get('violations', []) if v.get('severity') == 'critical'])
        god_objects = len(data.get('god_objects', []))
        mece_score = data.get('mece_analysis', {}).get('score', 0.0)
        
        print(f"NASA Compliance Score: {nasa_score}")
        print(f"Total Violations: {total_violations}")
        print(f"Critical Violations: {critical_violations}")
        print(f"God Objects: {god_objects}")
        print(f"MECE Score: {mece_score}")
        
        # Workflow thresholds (more lenient for development)
        SELF_NASA_THRESHOLD = 0.85
        SELF_MAX_CRITICAL = 50
        SELF_MAX_GOD_OBJECTS = 15
        SELF_MECE_THRESHOLD = 0.7
        
        passed = True
        warnings = []
        
        if nasa_score < SELF_NASA_THRESHOLD:
            warnings.append(f"WARNING: NASA Compliance below threshold ({nasa_score:.1%} < {SELF_NASA_THRESHOLD:.1%})")
            passed = False
        
        if critical_violations > SELF_MAX_CRITICAL:
            warnings.append(f"WARNING: Too many critical violations ({critical_violations} > {SELF_MAX_CRITICAL})")
            passed = False
        
        if god_objects > SELF_MAX_GOD_OBJECTS:
            warnings.append(f"WARNING: Too many god objects ({god_objects} > {SELF_MAX_GOD_OBJECTS})")
            passed = False
        
        if mece_score < SELF_MECE_THRESHOLD:
            warnings.append(f"WARNING: MECE score below threshold ({mece_score:.1%} < {SELF_MECE_THRESHOLD:.1%})")
            passed = False
        
        print(f"\n=== QUALITY GATE RESULTS ===")
        if passed:
            print("SUCCESS: Self-analysis quality gates passed!")
        else:
            print("WARNING: Self-analysis identified improvement opportunities")
            for warning in warnings:
                print(f"  {warning}")
        
        return passed, warnings
        
    except Exception as e:
        print(f"ERROR: Failed to assess quality gates: {e}")
        return False, [f"Assessment failed: {e}"]

def run_complete_workflow_test():
    """Run the complete workflow test with both success and failure scenarios."""
    print("=" * 60)
    print("COMPLETE SELF-DOGFOODING WORKFLOW VALIDATION")
    print("=" * 60)
    
    # Test scenarios
    scenarios = [
        ("Success Path", "self_analysis_success.json", True),
        ("Failure Path", "self_analysis_failure.json", False),
        ("Edge Case", "self_analysis_edge_case.json", False)
    ]
    
    results = []
    
    for scenario_name, test_file, expected_pass in scenarios:
        print(f"\n{'='*20} {scenario_name.upper()} {'='*20}")
        
        # Create test results structure
        create_test_results_structure()
        
        # Simulate workflow step
        result_file = simulate_workflow_step(scenario_name, "self_analysis_nasa.json")
        
        # Extract metrics
        metric_results = extract_metrics_from_file(result_file)
        
        # Run quality gates
        passed, warnings = simulate_quality_gates(result_file)
        
        # Validate expectations (ASCII-only output)
        if passed == expected_pass:
            print(f"[OK] EXPECTED RESULT: {'PASS' if passed else 'FAIL'}")
            result_status = "PASS"
        else:
            print(f"[FAIL] UNEXPECTED RESULT: Expected {'PASS' if expected_pass else 'FAIL'}, got {'PASS' if passed else 'FAIL'}")
            result_status = "UNEXPECTED"
        
        results.append({
            "scenario": scenario_name,
            "expected": expected_pass,
            "actual": passed,
            "status": result_status,
            "warnings": warnings
        })
    
    # Final summary
    print("\n" + "=" * 60)
    print("WORKFLOW VALIDATION SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for result in results:
        status_icon = "[OK]" if result["status"] == "PASS" else "[FAIL]"
        print(f"{status_icon} {result['scenario']}: {result['status']}")
        if result["warnings"]:
            for warning in result["warnings"][:3]:  # Show first 3 warnings
                print(f"    - {warning}")
        if result["status"] != "PASS":
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        pass
    else:
        pass
    print("=" * 60)
    
    return all_passed

if __name__ == "__main__":
    success = run_complete_workflow_test()
    sys.exit(0 if success else 1)