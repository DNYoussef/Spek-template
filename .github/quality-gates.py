#!/usr/bin/env python3
"""
GitHub Quality Gates - Analyzer JSON Checker

Simple script that reads analyzer JSON outputs and checks against quality thresholds.
Loosely coupled design - just reads JSON files and applies thresholds.
"""

import json
import sys
import os
from pathlib import Path


# Quality gate thresholds (can be overridden by environment variables)
QUALITY_THRESHOLDS = {
    "nasa_compliance": {
        "minimum_score": float(os.getenv("NASA_MIN_SCORE", "0.85")),
        "critical_violations": int(os.getenv("NASA_MAX_CRITICAL", "0")),
        "high_violations": int(os.getenv("NASA_MAX_HIGH", "5"))
    },
    "security": {
        "critical_vulnerabilities": int(os.getenv("SEC_MAX_CRITICAL", "0")),
        "high_vulnerabilities": int(os.getenv("SEC_MAX_HIGH", "3")),
        "secrets_detected": int(os.getenv("SEC_MAX_SECRETS", "0"))
    },
    "connascence": {
        "critical_violations": int(os.getenv("CONN_MAX_CRITICAL", "5")),
        "minimum_quality_score": float(os.getenv("CONN_MIN_QUALITY", "0.70")),
        "maximum_god_objects": int(os.getenv("CONN_MAX_GOD_OBJECTS", "3"))
    },
    "cache_optimization": {
        "minimum_health_score": float(os.getenv("CACHE_MIN_HEALTH", "0.75")),
        "minimum_hit_rate": float(os.getenv("CACHE_MIN_HIT_RATE", "0.60")),
        "minimum_efficiency": float(os.getenv("CACHE_MIN_EFFICIENCY", "0.70"))
    },
    "architecture": {
        "minimum_health": float(os.getenv("ARCH_MIN_HEALTH", "0.70")),
        "maximum_coupling": float(os.getenv("ARCH_MAX_COUPLING", "0.60")),
        "maximum_complexity": float(os.getenv("ARCH_MAX_COMPLEXITY", "0.70")),
        "minimum_maintainability": float(os.getenv("ARCH_MIN_MAINTAINABILITY", "0.65"))
    }
}


def load_json_safe(file_path):
    """Safely load JSON file with error handling."""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"WARNING: {file_path} not found")
        return None
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in {file_path}: {e}")
        return None


def check_nasa_compliance(data):
    """Check NASA POT10 compliance thresholds."""
    if not data:
        return False, "NASA compliance data not available"
    
    thresholds = QUALITY_THRESHOLDS["nasa_compliance"]
    
    # Check compliance score
    nasa_score = data.get("nasa_compliance", {}).get("score", 0)
    if nasa_score < thresholds["minimum_score"]:
        return False, f"NASA compliance: {nasa_score:.2%} < {thresholds['minimum_score']:.2%}"
    
    # Check critical violations
    critical_violations = data.get("summary", {}).get("critical_violations", 0)
    if critical_violations > thresholds["critical_violations"]:
        return False, f"Critical violations: {critical_violations} > {thresholds['critical_violations']}"
    
    return True, f"NASA compliance: {nasa_score:.2%} (PASSED)"


def check_security_analysis(data):
    """Check security analysis thresholds."""
    if not data:
        return False, "Security analysis data not available"
    
    thresholds = QUALITY_THRESHOLDS["security"]
    
    # Check critical vulnerabilities
    critical_vulns = len([v for v in data.get("findings", []) if v.get("severity") == "critical"])
    if critical_vulns > thresholds["critical_vulnerabilities"]:
        return False, f"Critical vulnerabilities: {critical_vulns} > {thresholds['critical_vulnerabilities']}"
    
    # Check secrets
    secrets_found = data.get("secrets_detected", 0)
    if secrets_found > thresholds["secrets_detected"]:
        return False, f"Secrets detected: {secrets_found} > {thresholds['secrets_detected']}"
    
    return True, f"Security: {critical_vulns} critical vulnerabilities (PASSED)"


def check_connascence_analysis(data):
    """Check connascence analysis thresholds."""
    if not data:
        return False, "Connascence analysis data not available"
    
    thresholds = QUALITY_THRESHOLDS["connascence"]
    
    # Check critical violations
    critical_violations = data.get("summary", {}).get("critical_violations", 0)
    if critical_violations > thresholds["critical_violations"]:
        return False, f"Critical connascence violations: {critical_violations} > {thresholds['critical_violations']}"
    
    # Check quality score
    quality_score = data.get("summary", {}).get("overall_quality_score", 0)
    if quality_score < thresholds["minimum_quality_score"]:
        return False, f"Quality score: {quality_score:.2%} < {thresholds['minimum_quality_score']:.2%}"
    
    # Check god objects
    god_objects = len(data.get("god_objects", []))
    if god_objects > thresholds["maximum_god_objects"]:
        return False, f"God objects: {god_objects} > {thresholds['maximum_god_objects']}"
    
    return True, f"Connascence: {critical_violations} critical violations (PASSED)"


def check_cache_optimization(data):
    """Check cache optimization thresholds."""
    if not data:
        return False, "Cache optimization data not available"
    
    thresholds = QUALITY_THRESHOLDS["cache_optimization"]
    
    # Check health score
    health_score = data.get("cache_health", {}).get("health_score", 0)
    if health_score < thresholds["minimum_health_score"]:
        return False, f"Cache health: {health_score:.2%} < {thresholds['minimum_health_score']:.2%}"
    
    # Check hit rate
    hit_rate = data.get("cache_health", {}).get("hit_rate", 0)
    if hit_rate < thresholds["minimum_hit_rate"]:
        return False, f"Cache hit rate: {hit_rate:.2%} < {thresholds['minimum_hit_rate']:.2%}"
    
    return True, f"Cache: {health_score:.2%} health score (PASSED)"


def check_architecture_analysis(data):
    """Check architecture analysis thresholds."""
    if not data:
        return False, "Architecture analysis data not available"
    
    thresholds = QUALITY_THRESHOLDS["architecture"]
    
    # Check architectural health
    arch_health = data.get("system_overview", {}).get("architectural_health", 0)
    if arch_health < thresholds["minimum_health"]:
        return False, f"Architectural health: {arch_health:.2%} < {thresholds['minimum_health']:.2%}"
    
    # Check coupling
    coupling = data.get("system_overview", {}).get("coupling_score", 1)
    if coupling > thresholds["maximum_coupling"]:
        return False, f"Coupling: {coupling:.2%} > {thresholds['maximum_coupling']:.2%}"
    
    return True, f"Architecture: {arch_health:.2%} health (PASSED)"


def main():
    """Main quality gates checker."""
    artifacts_dir = Path(".claude/.artifacts")
    
    if not artifacts_dir.exists():
        print("ERROR: .claude/.artifacts directory not found")
        sys.exit(1)
    
    # Load analyzer JSON outputs
    connascence_data = load_json_safe(artifacts_dir / "connascence_full.json")
    security_data = load_json_safe(artifacts_dir / "security" / "sast_analysis.json")
    cache_data = load_json_safe(artifacts_dir / "cache_optimization.json")
    architecture_data = load_json_safe(artifacts_dir / "architecture_analysis.json")
    
    # Run quality checks
    checks = [
        ("NASA Compliance", check_nasa_compliance, connascence_data),
        ("Security Analysis", check_security_analysis, security_data),
        ("Connascence Analysis", check_connascence_analysis, connascence_data),
        ("Cache Optimization", check_cache_optimization, cache_data),
        ("Architecture Analysis", check_architecture_analysis, architecture_data),
    ]
    
    # Execute checks
    failed_checks = []
    passed_checks = []
    
    print("=== Quality Gates Assessment ===")
    
    for check_name, check_func, data in checks:
        try:
            passed, message = check_func(data)
            if passed:
                print(f"SUCCESS: {check_name} - {message}")
                passed_checks.append(check_name)
            else:
                print(f"FAILED: {check_name} - {message}")
                failed_checks.append((check_name, message))
        except Exception as e:
            print(f"ERROR: {check_name} - Exception: {e}")
            failed_checks.append((check_name, f"Exception: {e}"))
    
    # Summary
    print(f"\n=== Summary ===")
    print(f"Passed: {len(passed_checks)}")
    print(f"Failed: {len(failed_checks)}")
    
    if failed_checks:
        print(f"\nFailed Checks:")
        for check_name, message in failed_checks:
            print(f"  - {check_name}: {message}")
        print(f"\nQuality gates FAILED - blocking deployment")
        sys.exit(1)
    else:
        print(f"\nAll quality gates PASSED - ready for deployment")
        sys.exit(0)


if __name__ == "__main__":
    main()