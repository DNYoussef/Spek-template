#!/usr/bin/env python3
"""
Quality Gate Threshold Logic Test
Tests the self-dogfooding workflow quality gate logic with ASCII-only output.
"""

import json
import sys

def load_analysis_data(file_path):
    """Load and parse analysis data."""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"ERROR: Failed to load {file_path}: {e}")
        return None

def extract_metrics(data):
    """Extract all metrics as in the workflow."""
    if not data:
        return None
        
    metrics = {}
    
    # Total violations
    metrics['total_violations'] = len(data.get('violations', []))
    
    # Critical violations 
    critical = [v for v in data.get('violations', []) if v.get('severity') == 'critical']
    metrics['critical_violations'] = len(critical)
    
    # NASA compliance score
    metrics['nasa_score'] = data.get('nasa_compliance', {}).get('score', 0)
    
    # God objects count
    metrics['god_objects'] = len(data.get('god_objects', []))
    
    # MECE score
    metrics['mece_score'] = data.get('mece_analysis', {}).get('score', 0)
    
    # Overall quality score
    metrics['overall_score'] = data.get('overall_quality_score', 0)
    
    return metrics

def check_quality_gates(metrics):
    """Apply quality gate thresholds."""
    if not metrics:
        return False, ["No metrics available"]
    
    failures = []
    
    # NASA compliance >= 90%
    nasa_score = metrics['nasa_score']
    if nasa_score is not None and nasa_score < 0.90:
        failures.append(f"NASA compliance {nasa_score:.1%} < 90%")
    elif nasa_score is None:
        failures.append("NASA compliance: No data available")
    
    # Critical violations = 0
    if metrics['critical_violations'] > 0:
        failures.append(f"Critical violations: {metrics['critical_violations']} > 0")
    
    # God objects <= 2
    if metrics['god_objects'] > 2:
        failures.append(f"God objects: {metrics['god_objects']} > 2")
    
    # MECE score >= 75%
    mece_score = metrics['mece_score']
    if mece_score is not None and mece_score < 0.75:
        failures.append(f"MECE score {mece_score:.1%} < 75%")
    elif mece_score is None:
        failures.append("MECE score: No data available")
    
    # Overall quality >= 80%
    overall_score = metrics['overall_score']
    if overall_score is not None and overall_score < 0.80:
        failures.append(f"Overall quality {overall_score:.1%} < 80%")
    elif overall_score is None:
        failures.append("Overall quality: No data available")
    
    return len(failures) == 0, failures

def print_metrics(metrics):
    """Print metrics in ASCII-only format (no Unicode)."""
    if not metrics:
        print("No metrics available")
        return
        
    print("=== EXTRACTED METRICS ===")
    print(f"Total violations: {metrics['total_violations']}")
    print(f"Critical violations: {metrics['critical_violations']}")
    
    # Handle None values safely
    nasa_score = metrics['nasa_score']
    if nasa_score is not None:
        print(f"NASA compliance: {nasa_score:.1%}")
    else:
        print("NASA compliance: N/A")
        
    print(f"God objects: {metrics['god_objects']}")
    
    mece_score = metrics['mece_score']  
    if mece_score is not None:
        print(f"MECE score: {mece_score:.1%}")
    else:
        print("MECE score: N/A")
        
    overall_score = metrics['overall_score']
    if overall_score is not None:
        print(f"Overall quality: {overall_score:.1%}")
    else:
        print("Overall quality: N/A")

def main():
    """Main test execution."""
    if len(sys.argv) != 2:
        sys.exit(1)
    
    file_path = sys.argv[1]
    print("=" * 50)
    
    # Load data
    data = load_analysis_data(file_path)
    if not data:
        sys.exit(1)
    
    # Extract metrics
    metrics = extract_metrics(data)
    print_metrics(metrics)
    
    # Check quality gates
    passed, failures = check_quality_gates(metrics)
    
    print("\n=== QUALITY GATE RESULTS ===")
    if passed:
        print("STATUS: PASSED - All quality gates met")
        print("Ready for production deployment")
    else:
        print("STATUS: FAILED - Quality gate violations detected")
        print("Blocking issues:")
        for failure in failures:
            print(f"  - {failure}")
    
    print("=" * 50)
    return 0 if passed else 1

if __name__ == "__main__":
    sys.exit(main())