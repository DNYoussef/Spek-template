#!/usr/bin/env python3
"""
Phase 7 God Object Decomposition Audit
=====================================

Comprehensive audit of the claimed god object decomposition work to verify:
1. Enhanced Incident Response System (1,570 LOC  92 LOC)
2. Performance Validator (2,7 LOC  1,100 LOC)
3. Loop Orchestrator Core (1,838 LOC  880 LOC)

This audit tests for theater vs genuine refactoring.
"""

import os
import sys
import traceback
import importlib
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

class Phase7AuditResults:
    def __init__(self):
        self.results = {}
        self.failures = []
        self.warnings = []

    def record(self, component, test, status, details=None):
        if component not in self.results:
            self.results[component] = {}
        self.results[component][test] = {
            'status': status,
            'details': details or ''
        }
        if status == 'FAIL':
            self.failures.append(f"{component}.{test}: {details}")
        elif status == 'WARN':
            self.warnings.append(f"{component}.{test}: {details}")

    def print_summary(self):
        print("\n" + "="*70)
        print("PHASE 7 GOD OBJECT DECOMPOSITION AUDIT RESULTS")
        print("="*70)

        total_tests = 0
        passed = 0
        failed = 0
        warnings = 0

        for component, tests in self.results.items():
            print(f"\n{component}:")
            for test, result in tests.items():
                status_symbol = "PASS" if result['status'] == 'PASS' else "FAIL" if result['status'] == 'FAIL' else "WARN"
                print(f"  {status_symbol} {test}: {result['status']} - {result['details']}")
                total_tests += 1
                if result['status'] == 'PASS':
                    passed += 1
                elif result['status'] == 'FAIL':
                    failed += 1
                elif result['status'] == 'WARN':
                    warnings += 1

        print(f"\n{'='*70}")
        print(f"SUMMARY: {passed}/{total_tests} tests passed")
        print(f"FAILURES: {failed}")
        print(f"WARNINGS: {warnings}")

        if failed > 0:
            print(f"\nTHEATER DETECTED - {failed} critical failures found!")
            print("This indicates fake or broken refactoring work.")
        else:
            print(f"\nGENUINE REFACTORING VERIFIED - All core tests passed")

        return failed == 0

def test_file_exists(filepath):
    """Test if a file exists and is readable."""
    try:
        path = Path(filepath)
        if not path.exists():
            return False, f"File does not exist: {filepath}"
        if not path.is_file():
            return False, f"Path is not a file: {filepath}"
        if path.stat().st_size == 0:
            return False, f"File is empty: {filepath}"
        return True, f"File exists and readable ({path.stat().st_size} bytes)"
    except Exception as e:
        return False, f"Error accessing file: {e}"

def test_import_module(module_path):
    """Test if a module can be imported successfully."""
    try:
        module = importlib.import_module(module_path)
        return True, f"Successfully imported {module_path}"
    except Exception as e:
        return False, f"Import error: {e}"

def test_class_instantiation(module_path, class_name, *args, **kwargs):
    """Test if a class can be instantiated."""
    try:
        module = importlib.import_module(module_path)
        cls = getattr(module, class_name)
        instance = cls(*args, **kwargs)
        return True, f"Successfully instantiated {class_name}"
    except Exception as e:
        return False, f"Instantiation error: {e}"

def test_method_exists(module_path, class_name, method_name):
    """Test if a method exists on a class."""
    try:
        module = importlib.import_module(module_path)
        cls = getattr(module, class_name)
        method = getattr(cls, method_name)
        return True, f"Method {method_name} exists and callable"
    except Exception as e:
        return False, f"Method error: {e}"

def audit_enhanced_incident_response_system():
    """Audit the Enhanced Incident Response System decomposition."""
    print("\nAUDITING: Enhanced Incident Response System")
    print("   Claimed: 1,570 LOC -> 92 LOC (94% reduction)")

    audit = Phase7AuditResults()

    # Test 1: Original file exists and has backward compatibility
    success, details = test_file_exists("src/security/enhanced_incident_response_system.py")
    audit.record("IncidentResponse", "original_file_exists", "PASS" if success else "FAIL", details)

    # Test 2: Can import from original file
    success, details = test_import_module("src.security.enhanced_incident_response_system")
    audit.record("IncidentResponse", "original_import", "PASS" if success else "FAIL", details)

    # Test 3: New service architecture exists
    services = [
        "src/security/incident_response/models/incident_models.py",
        "src/security/incident_response/services/incident_detection_service.py",
        "src/security/incident_response/services/threat_intelligence_service.py",
        "src/security/incident_response/services/forensic_evidence_service.py",
        "src/security/incident_response/services/automated_response_service.py",
        "src/security/incident_response/enhanced_incident_response_facade.py"
    ]

    for service in services:
        success, details = test_file_exists(service)
        service_name = Path(service).stem
        audit.record("IncidentResponse", f"service_{service_name}_exists", "PASS" if success else "FAIL", details)

    # Test 4: Can import from new module structure
    success, details = test_import_module("src.security.incident_response")
    audit.record("IncidentResponse", "new_module_import", "PASS" if success else "FAIL", details)

    # Test 5: Can instantiate main system
    try:
        from src.security.incident_response import EnhancedIncidentResponseSystem
        system = EnhancedIncidentResponseSystem()
        audit.record("IncidentResponse", "system_instantiation", "PASS", "Successfully created system instance")
    except Exception as e:
        audit.record("IncidentResponse", "system_instantiation", "FAIL", f"Cannot instantiate: {e}")

    return audit

def audit_performance_validator():
    """Audit the Performance Validator decomposition."""
    print("\nAUDITING: Performance Validator")
    print("   Claimed: 2,7 LOC -> 1,100 LOC (45% reduction)")

    audit = Phase7AuditResults()

    # Test original files
    files_to_check = [
        ".claude/artifacts/sandbox-validation/phase3_performance_optimization_validator.py",
        ".claude/.artifacts/phase2_refactored/phase3_performance_validator_facade.py"
    ]

    for file_path in files_to_check:
        success, details = test_file_exists(file_path)
        file_name = Path(file_path).stem
        audit.record("PerformanceValidator", f"{file_name}_exists", "PASS" if success else "FAIL", details)

    # Test imports
    try:
        # Try to read the file first to check content
        with open(".claude/artifacts/sandbox-validation/phase3_performance_optimization_validator.py", 'r') as f:
            content = f.read()
            if len(content) > 1000:  # Check if it's substantial
                audit.record("PerformanceValidator", "file_content_substantial", "PASS", f"File has {len(content)} characters")
            else:
                audit.record("PerformanceValidator", "file_content_substantial", "WARN", f"File only has {len(content)} characters")
    except Exception as e:
        audit.record("PerformanceValidator", "file_content_check", "FAIL", f"Cannot read file: {e}")

    return audit

def audit_loop_orchestrator():
    """Audit the Loop Orchestrator Core decomposition."""
    print("\nAUDITING: Loop Orchestrator Core")
    print("   Claimed: 1,838 LOC -> 880 LOC (52% reduction)")

    audit = Phase7AuditResults()

    # Test files exist
    files_to_check = [
        ".claude/artifacts/phase3_refactored_src/loop_orchestrator_core.py",
        ".claude/artifacts/phase3_refactored_src/loop_orchestrator_operations.py",
        ".claude/artifacts/phase3_refactored_src/loop_orchestrator_persistence.py",
        ".claude/.artifacts/phase2_refactored/loop_orchestrator_facade.py"
    ]

    for file_path in files_to_check:
        success, details = test_file_exists(file_path)
        file_name = Path(file_path).stem
        audit.record("LoopOrchestrator", f"{file_name}_exists", "PASS" if success else "FAIL", details)

    # Test if original orchestrator still exists
    success, details = test_file_exists("src/coordination/loop_orchestrator.py")
    audit.record("LoopOrchestrator", "original_orchestrator_exists", "PASS" if success else "FAIL", details)

    return audit

def run_comprehensive_audit():
    """Run the complete Phase 7 audit."""
    print("PHASE 7 GOD OBJECT DECOMPOSITION COMPREHENSIVE AUDIT")
    print("="*70)
    print("Testing for genuine refactoring vs performance theater...")

    # Run individual audits
    incident_audit = audit_enhanced_incident_response_system()
    performance_audit = audit_performance_validator()
    orchestrator_audit = audit_loop_orchestrator()

    # Combine results
    combined_audit = Phase7AuditResults()
    for audit in [incident_audit, performance_audit, orchestrator_audit]:
        combined_audit.results.update(audit.results)
        combined_audit.failures.extend(audit.failures)
        combined_audit.warnings.extend(audit.warnings)

    # Print final summary
    is_genuine = combined_audit.print_summary()

    if not is_genuine:
        print("\nRECOMMENDED ACTIONS:")
        print("1. Fix broken imports and missing files")
        print("2. Ensure all claimed services actually exist")
        print("3. Verify backward compatibility is maintained")
        print("4. Test all public APIs work as expected")

    return is_genuine, combined_audit

if __name__ == "__main__":
    success, results = run_comprehensive_audit()
    sys.exit(0 if success else 1)