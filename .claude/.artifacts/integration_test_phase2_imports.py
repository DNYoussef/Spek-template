#!/usr/bin/env python3
"""
Integration Testing Script for Phase 2 Import Chain Fixes
=========================================================

Validates that Phase 2 surgical fixes actually resolved import chain failures
and enabled real analyzer access. Tests critical integration points between
CLI and analyzer components.

MISSION: Test import chain resolution, CLI connectivity, and cross-component integration.
"""

import sys
import os
import importlib
import traceback
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import json
import time

# Add analyzer to Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

class IntegrationTester:
    """Comprehensive integration testing for Phase 2 import fixes."""
    
    def __init__(self):
        self.results = {
            "import_chain_tests": {},
            "cli_connectivity_tests": {},
            "cross_component_tests": {},
            "surgical_fix_validation": {},
            "overall_status": {"pass": 0, "fail": 0, "error": 0}
        }
        self.start_time = time.time()
    
    def test_critical_imports(self) -> Dict[str, Any]:
        """Test the critical import points identified in Phase 2."""
        print("[PHASE 2] Testing Critical Import Chain Resolution...")
        
        critical_imports = [
            ("analyzer.unified_analyzer", "UnifiedConnascenceAnalyzer"),
            ("analyzer.constants", ["get_policy_thresholds", "is_policy_nasa_compliant", "resolve_policy_name"]),
            ("analyzer.nasa_engine.nasa_analyzer", "NASARuleEngine"),
            ("analyzer.duplication_unified", "UnifiedDuplicationAnalyzer"),
            ("analyzer.detectors.algorithm_detector", "AlgorithmDetector"),
            ("analyzer.core.unified_imports", "IMPORT_MANAGER"),
        ]
        
        results = {}
        
        for module_path, expected_items in critical_imports:
            try:
                print(f"[TEST] Importing {module_path}...")
                module = importlib.import_module(module_path)
                
                # Check if expected items exist
                if isinstance(expected_items, str):
                    expected_items = [expected_items]
                
                available_items = []
                missing_items = []
                
                for item in expected_items:
                    if hasattr(module, item):
                        available_items.append(item)
                        print(f"  [OK] {item} - AVAILABLE")
                    else:
                        missing_items.append(item)
                        print(f"  [FAIL] {item} - MISSING")
                
                # Test functionality of available items
                functionality_tests = []
                for item in available_items:
                    try:
                        obj = getattr(module, item)
                        if callable(obj):
                            # Test if it's callable without errors
                            if item == "get_policy_thresholds":
                                test_result = obj("standard")
                                functionality_tests.append(f"{item}: {type(test_result).__name__}")
                            elif item == "is_policy_nasa_compliant":
                                test_result = obj("nasa-compliance")
                                functionality_tests.append(f"{item}: {test_result}")
                            elif item == "resolve_policy_name":
                                test_result = obj("default")
                                functionality_tests.append(f"{item}: {test_result}")
                            else:
                                functionality_tests.append(f"{item}: callable")
                        elif hasattr(obj, '__class__'):
                            functionality_tests.append(f"{item}: class {obj.__class__.__name__}")
                        else:
                            functionality_tests.append(f"{item}: {type(obj).__name__}")
                    except Exception as e:
                        functionality_tests.append(f"{item}: ERROR - {str(e)}")
                
                results[module_path] = {
                    "status": "SUCCESS" if not missing_items else "PARTIAL",
                    "available_items": available_items,
                    "missing_items": missing_items,
                    "functionality_tests": functionality_tests,
                    "import_successful": True
                }
                
                if not missing_items:
                    self.results["overall_status"]["pass"] += 1
                else:
                    self.results["overall_status"]["fail"] += 1
                    
            except ImportError as e:
                print(f"  [ERROR] IMPORT FAILED: {e}")
                results[module_path] = {
                    "status": "IMPORT_FAILED",
                    "error": str(e),
                    "available_items": [],
                    "missing_items": expected_items,
                    "functionality_tests": [],
                    "import_successful": False
                }
                self.results["overall_status"]["error"] += 1
            except Exception as e:
                print(f"  [WARN] UNEXPECTED ERROR: {e}")
                results[module_path] = {
                    "status": "ERROR",
                    "error": str(e),
                    "available_items": [],
                    "missing_items": expected_items,
                    "functionality_tests": [],
                    "import_successful": False
                }
                self.results["overall_status"]["error"] += 1
        
        self.results["import_chain_tests"] = results
        return results
    
    def test_cli_connectivity(self) -> Dict[str, Any]:
        """Test CLI-to-analyzer connectivity and real component access."""
        print("\n[PHASE 2] Testing CLI-to-Analyzer Connectivity...")
        
        results = {}
        
        # Test 1: Core analyzer module help
        try:
            print("[TEST] Testing analyzer core help functionality...")
            import analyzer.core as analyzer_core
            
            # Check if main function exists and is callable
            if hasattr(analyzer_core, 'main'):
                results["core_main_available"] = True
                print("  [OK] analyzer.core.main - AVAILABLE")
                
                # Try to get help without actually running
                if hasattr(analyzer_core, 'create_parser'):
                    parser = analyzer_core.create_parser()
                    help_text = parser.format_help()
                    results["help_text_length"] = len(help_text)
                    results["help_contains_policy"] = "--policy" in help_text
                    print(f"  [OK] Help text generated ({len(help_text)} chars)")
                else:
                    results["parser_creation"] = False
                    print("  [FAIL] create_parser not available")
            else:
                results["core_main_available"] = False
                print("  [FAIL] analyzer.core.main - NOT AVAILABLE")
                
        except Exception as e:
            results["core_connectivity_error"] = str(e)
            print(f"  [ERROR] Core connectivity failed: {e}")
        
        # Test 2: IMPORT_MANAGER functionality
        try:
            print("[TEST] Testing IMPORT_MANAGER functionality...")
            from analyzer.core.unified_imports import IMPORT_MANAGER
            
            # Test availability summary
            availability = IMPORT_MANAGER.get_availability_summary()
            results["import_manager_summary"] = availability
            print(f"  [OK] Availability score: {availability.get('availability_score', 0):.2%}")
            
            # Test individual import capabilities
            constants_result = IMPORT_MANAGER.import_constants()
            analyzer_result = IMPORT_MANAGER.import_unified_analyzer()
            
            results["constants_import"] = constants_result.has_module
            results["unified_analyzer_import"] = analyzer_result.has_module
            
            print(f"  [OK] Constants available: {constants_result.has_module}")
            print(f"  [OK] Unified analyzer available: {analyzer_result.has_module}")
            
        except Exception as e:
            results["import_manager_error"] = str(e)
            print(f"  [ERROR] IMPORT_MANAGER test failed: {e}")
        
        # Test 3: Module-level execution
        try:
            print("[TEST] Testing python -m analyzer execution path...")
            import analyzer.__main__ as analyzer_main
            
            if hasattr(analyzer_main, 'main_with_fallback'):
                results["main_module_available"] = True
                print("  [OK] __main__.main_with_fallback - AVAILABLE")
            else:
                results["main_module_available"] = False
                print("  [FAIL] __main__.main_with_fallback - NOT AVAILABLE")
                
        except Exception as e:
            results["main_module_error"] = str(e)
            print(f"  [ERROR] Module execution test failed: {e}")
        
        self.results["cli_connectivity_tests"] = results
        return results
    
    def test_cross_component_integration(self) -> Dict[str, Any]:
        """Test cross-component integration and communication paths."""
        print("\n[PHASE 2] Testing Cross-Component Integration...")
        
        results = {}
        
        # Test 1: DetectorPool -> Individual detectors communication
        try:
            print("[TEST] Testing DetectorPool integration...")
            from analyzer.architecture.detector_pool import DetectorPool
            
            pool = DetectorPool()
            available_detectors = pool.get_available_detectors()
            results["detector_pool_detectors"] = available_detectors
            print(f"  [OK] DetectorPool has {len(available_detectors)} detectors")
            
            # Test detector creation
            if available_detectors:
                first_detector = available_detectors[0]
                detector_instance = pool.get_detector(first_detector)
                results["detector_instantiation"] = detector_instance is not None
                print(f"  [OK] Created detector instance: {first_detector}")
            
        except Exception as e:
            results["detector_pool_error"] = str(e)
            print(f"  [ERROR] DetectorPool test failed: {e}")
        
        # Test 2: RecommendationEngine -> Analysis results integration
        try:
            print("[TEST] Testing RecommendationEngine integration...")
            from analyzer.architecture.recommendation_engine import RecommendationEngine
            
            engine = RecommendationEngine()
            
            # Test with mock analysis results
            mock_results = {
                "violations": [],
                "nasa_compliance": {"score": 0.8},
                "duplication_analysis": {"score": 0.9}
            }
            
            recommendations = engine.generate_recommendations(mock_results)
            results["recommendation_generation"] = len(recommendations) if recommendations else 0
            print(f"  [OK] Generated {len(recommendations)} recommendations")
            
        except Exception as e:
            results["recommendation_engine_error"] = str(e)
            print(f"  [ERROR] RecommendationEngine test failed: {e}")
        
        # Test 3: Configuration management -> Policy enforcement
        try:
            print("[TEST] Testing Configuration -> Policy integration...")
            from analyzer.constants import resolve_policy_name, get_policy_thresholds
            
            # Test policy resolution chain
            policies_to_test = ["default", "nasa_jpl_pot10", "strict-core", "standard"]
            policy_results = {}
            
            for policy in policies_to_test:
                resolved = resolve_policy_name(policy)
                thresholds = get_policy_thresholds(resolved)
                policy_results[policy] = {
                    "resolved_to": resolved,
                    "has_thresholds": bool(thresholds),
                    "threshold_count": len(thresholds) if thresholds else 0
                }
                print(f"  [OK] {policy} -> {resolved} ({len(thresholds)} thresholds)")
            
            results["policy_integration"] = policy_results
            
        except Exception as e:
            results["policy_integration_error"] = str(e)
            print(f"  [ERROR] Policy integration test failed: {e}")
        
        self.results["cross_component_tests"] = results
        return results
    

# TODO: NASA POT10 Rule 4 - Refactor validate_surgical_fixes (146 lines > 60 limit)
# Consider breaking into smaller functions:
# - Extract validation logic
# - Separate data processing steps
# - Create helper functions for complex operations

    def validate_surgical_fixes(self) -> Dict[str, Any]:
        """Validate surgical fixes in constants.py and unified_imports.py."""
        print("\n[PHASE 2] Validating Surgical Fix Implementation...")
        
        results = {}
        
        # Test 1: constants.py policy functions
        try:
            print("[TEST] Validating constants.py policy functions...")
            from analyzer import constants
            
            required_functions = [
                "get_policy_thresholds",
                "is_policy_nasa_compliant", 
                "resolve_policy_name",
                "validate_policy_name",
                "list_available_policies"
            ]
            
            function_tests = {}
            for func_name in required_functions:
                if hasattr(constants, func_name):
                    func = getattr(constants, func_name)
                    if callable(func):
                        try:
                            # Test each function with appropriate arguments
                            if func_name == "get_policy_thresholds":
                                result = func("standard")
                                function_tests[func_name] = f"SUCCESS - returned {len(result)} thresholds"
                            elif func_name == "is_policy_nasa_compliant":
                                result = func("nasa-compliance")
                                function_tests[func_name] = f"SUCCESS - returned {result}"
                            elif func_name == "resolve_policy_name":
                                result = func("default")
                                function_tests[func_name] = f"SUCCESS - resolved to {result}"
                            elif func_name == "validate_policy_name":
                                result = func("standard")
                                function_tests[func_name] = f"SUCCESS - validation {result}"
                            elif func_name == "list_available_policies":
                                result = func()
                                function_tests[func_name] = f"SUCCESS - found {len(result)} policies"
                            else:
                                function_tests[func_name] = "SUCCESS - callable"
                        except Exception as e:
                            function_tests[func_name] = f"EXECUTION_ERROR - {str(e)}"
                    else:
                        function_tests[func_name] = "NOT_CALLABLE"
                else:
                    function_tests[func_name] = "MISSING"
            
            results["constants_functions"] = function_tests
            
            # Print results
            for func, status in function_tests.items():
                if "SUCCESS" in status:
                    print(f"  [OK] {func}: {status}")
                else:
                    print(f"  [FAIL] {func}: {status}")
            
        except Exception as e:
            results["constants_validation_error"] = str(e)
            print(f"  [ERROR] Constants validation failed: {e}")
        
        # Test 2: unified_imports.py enhanced dependency injection
        try:
            print("[TEST] Validating unified_imports.py enhancements...")
            from analyzer.core.unified_imports import IMPORT_MANAGER, ImportResult
            
            # Test import manager methods
            manager_methods = [
                "import_constants",
                "import_unified_analyzer", 
                "import_duplication_analyzer",
                "import_analyzer_components",
                "get_availability_summary"
            ]
            
            method_tests = {}
            for method_name in manager_methods:
                if hasattr(IMPORT_MANAGER, method_name):
                    method = getattr(IMPORT_MANAGER, method_name)
                    try:
                        result = method()
                        if isinstance(result, ImportResult):
                            method_tests[method_name] = f"SUCCESS - ImportResult(has_module={result.has_module})"
                        elif isinstance(result, dict):
                            method_tests[method_name] = f"SUCCESS - dict with {len(result)} keys"
                        else:
                            method_tests[method_name] = f"SUCCESS - returned {type(result).__name__}"
                    except Exception as e:
                        method_tests[method_name] = f"EXECUTION_ERROR - {str(e)}"
                else:
                    method_tests[method_name] = "MISSING"
            
            results["import_manager_methods"] = method_tests
            
            # Print results
            for method, status in method_tests.items():
                if "SUCCESS" in status:
                    print(f"  [OK] {method}: {status}")
                else:
                    print(f"  [FAIL] {method}: {status}")
            
        except Exception as e:
            results["import_manager_validation_error"] = str(e)
            print(f"  [ERROR] Import manager validation failed: {e}")
        
        # Test 3: Emergency fallback vs real implementation detection
        try:
            print("[TEST] Testing emergency fallback vs real implementation...")
            
            # Test if we're getting real implementations or just mocks
            from analyzer.core.unified_imports import IMPORT_MANAGER
            
            constants_result = IMPORT_MANAGER.import_constants()
            analyzer_result = IMPORT_MANAGER.import_unified_analyzer()
            
            # Check if constants are real (have proper policy functions)
            real_constants = False
            if constants_result.has_module:
                constants_obj = constants_result.module
                if hasattr(constants_obj, 'resolve_policy_name') and not getattr(constants_obj, 'CI_MODE', False):
                    real_constants = True
            
            # Check if analyzer is real (not mock)
            real_analyzer = False
            if analyzer_result.has_module:
                analyzer_obj = analyzer_result.module
                if hasattr(analyzer_obj, 'analyze_project') and not getattr(analyzer_obj, 'ci_compatible', False):
                    real_analyzer = True
            
            results["implementation_detection"] = {
                "real_constants": real_constants,
                "real_analyzer": real_analyzer,
                "mock_mode": not (real_constants and real_analyzer)
            }
            
            print(f"  [CHART] Real constants: {real_constants}")
            print(f"  [CHART] Real analyzer: {real_analyzer}")
            print(f"  [CHART] Mock mode active: {not (real_constants and real_analyzer)}")
            
        except Exception as e:
            results["implementation_detection_error"] = str(e)
            print(f"  [ERROR] Implementation detection failed: {e}")
        
        self.results["surgical_fix_validation"] = results
        return results
    
    def test_end_to_end_workflow(self) -> Dict[str, Any]:
        """Execute end-to-end analysis workflow testing."""
        print("\n[PHASE 2] Testing End-to-End Analysis Workflow...")
        
        results = {}
        
        # Test 1: Basic analysis workflow
        try:
            print("[TEST] Testing basic analysis workflow...")
            from analyzer.core import ConnascenceAnalyzer
            
            analyzer = ConnascenceAnalyzer()
            
            # Test with current directory
            current_dir = str(Path.cwd())
            analysis_result = analyzer.analyze(current_dir, "standard")
            
            # Validate result structure
            required_keys = [
                "success", "violations", "summary", "nasa_compliance", 
                "mece_analysis", "god_objects"
            ]
            
            missing_keys = [key for key in required_keys if key not in analysis_result]
            
            results["basic_workflow"] = {
                "analysis_completed": True,
                "result_keys": list(analysis_result.keys()),
                "missing_required_keys": missing_keys,
                "success_status": analysis_result.get("success", False),
                "violation_count": len(analysis_result.get("violations", []))
            }
            
            print(f"  [OK] Analysis completed: {analysis_result.get('success', False)}")
            print(f"  [OK] Found {len(analysis_result.get('violations', []))} violations")
            print(f"  [OK] Result has {len(analysis_result.keys())} keys")
            
            if missing_keys:
                print(f"  [WARN] Missing keys: {missing_keys}")
            
        except Exception as e:
            results["basic_workflow_error"] = str(e)
            print(f"  [ERROR] Basic workflow test failed: {e}")
            traceback.print_exc()
        
        # Test 2: CLI integration test
        try:
            print("[TEST] Testing CLI integration...")
            import subprocess
            
            # Test help command
            result = subprocess.run(
                [sys.executable, "-m", "analyzer", "--help"], 
                capture_output=True, text=True, timeout=30, cwd=str(Path.cwd())
            )
            
            cli_success = result.returncode == 0
            help_output_length = len(result.stdout) if result.stdout else 0
            
            results["cli_integration"] = {
                "help_command_success": cli_success,
                "help_output_length": help_output_length,
                "stderr_length": len(result.stderr) if result.stderr else 0,
                "return_code": result.returncode
            }
            
            print(f"  [OK] CLI help command: {'SUCCESS' if cli_success else 'FAILED'}")
            print(f"  [OK] Help output length: {help_output_length} chars")
            
        except subprocess.TimeoutExpired:
            results["cli_integration_error"] = "TIMEOUT"
            print("  [TIMER] CLI test timed out")
        except Exception as e:
            results["cli_integration_error"] = str(e)
            print(f"  [ERROR] CLI integration test failed: {e}")
        
        self.results["end_to_end_tests"] = results
        return results
    
    def generate_integration_report(self) -> Dict[str, Any]:
        """Generate comprehensive integration testing report."""
        print("\n" + "="*80)
        print("PHASE 2 INTEGRATION TESTING REPORT")
        print("="*80)
        
        end_time = time.time()
        test_duration = end_time - self.start_time
        
        # Calculate overall statistics
        total_tests = sum(self.results["overall_status"].values())
        pass_rate = self.results["overall_status"]["pass"] / max(total_tests, 1)
        
        # Production readiness assessment
        critical_components = [
            self.results.get("import_chain_tests", {}).get("analyzer.constants", {}).get("import_successful", False),
            self.results.get("import_chain_tests", {}).get("analyzer.unified_analyzer", {}).get("import_successful", False),
            self.results.get("cli_connectivity_tests", {}).get("core_main_available", False),
            self.results.get("surgical_fix_validation", {}).get("constants_functions", {}).get("resolve_policy_name", "").startswith("SUCCESS")
        ]
        
        production_ready = all(critical_components)
        
        # Generate summary
        summary = {
            "test_execution": {
                "duration_seconds": round(test_duration, 2),
                "total_tests": total_tests,
                "passed": self.results["overall_status"]["pass"],
                "failed": self.results["overall_status"]["fail"],
                "errors": self.results["overall_status"]["error"],
                "pass_rate": round(pass_rate * 100, 1)
            },
            "integration_status": {
                "import_chain_resolution": len([k for k, v in self.results.get("import_chain_tests", {}).items() if v.get("import_successful")]),
                "cli_connectivity": self.results.get("cli_connectivity_tests", {}).get("core_main_available", False),
                "cross_component_communication": bool(self.results.get("cross_component_tests", {}).get("detector_pool_detectors")),
                "surgical_fixes_validated": bool(self.results.get("surgical_fix_validation", {}).get("constants_functions"))
            },
            "production_readiness": {
                "assessment": "READY" if production_ready else "NOT_READY",
                "critical_components_status": {
                    "constants_import": critical_components[0],
                    "unified_analyzer_import": critical_components[1], 
                    "cli_main_available": critical_components[2],
                    "policy_functions_working": critical_components[3]
                },
                "blocking_issues": self._identify_blocking_issues()
            },
            "detailed_results": self.results
        }
        
        # Print summary
        print(f"[TIMER] Test Duration: {test_duration:.2f} seconds")
        print(f"[STATS] Test Results: {self.results['overall_status']['pass']} passed, {self.results['overall_status']['fail']} failed, {self.results['overall_status']['error']} errors")
        print(f"[CHART] Pass Rate: {pass_rate:.1%}")
        print(f"[TARGET] Production Ready: {'[OK] YES' if production_ready else '[FAIL] NO'}")
        
        if not production_ready:
            print("\n[BLOCK] BLOCKING ISSUES:")
            for issue in summary["production_readiness"]["blocking_issues"]:
                print(f"   [U+2022] {issue}")
        
        print("\n[LIST] INTEGRATION STATUS:")
        print(f"   - Import Chain Resolution: {summary['integration_status']['import_chain_resolution']}/6 components")
        print(f"   - CLI Connectivity: {'[OK]' if summary['integration_status']['cli_connectivity'] else '[FAIL]'}")
        print(f"   - Cross-Component Communication: {'[OK]' if summary['integration_status']['cross_component_communication'] else '[FAIL]'}")
        print(f"   - Surgical Fixes Validated: {'[OK]' if summary['integration_status']['surgical_fixes_validated'] else '[FAIL]'}")
        
        return summary
    
    def _identify_blocking_issues(self) -> List[str]:
        """Identify blocking issues preventing production deployment."""
        issues = []
        
        # Check import failures
        import_tests = self.results.get("import_chain_tests", {})
        for module, result in import_tests.items():
            if not result.get("import_successful", False):
                issues.append(f"Import failure: {module}")
        
        # Check CLI connectivity
        cli_tests = self.results.get("cli_connectivity_tests", {})
        if not cli_tests.get("core_main_available", False):
            issues.append("CLI main function not accessible")
        
        # Check surgical fixes
        surgical_tests = self.results.get("surgical_fix_validation", {})
        functions_status = surgical_tests.get("constants_functions", {})
        failed_functions = [func for func, status in functions_status.items() if not status.startswith("SUCCESS")]
        if failed_functions:
            issues.append(f"Policy functions not working: {', '.join(failed_functions)}")
        
        # Check end-to-end workflow
        e2e_tests = self.results.get("end_to_end_tests", {})
        if "basic_workflow_error" in e2e_tests:
            issues.append(f"Basic analysis workflow failed: {e2e_tests['basic_workflow_error']}")
        
        return issues
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all integration tests and generate report."""
        print("[ROCKET] Starting Phase 2 Integration Testing...")
        print(f"[FOLDER] Working directory: {Path.cwd()}")
        print(f"[PYTHON] Python version: {sys.version}")
        
        try:
            # Run all test suites
            self.test_critical_imports()
            self.test_cli_connectivity()
            self.test_cross_component_integration()
            self.validate_surgical_fixes()
            self.test_end_to_end_workflow()
            
            # Generate final report
            report = self.generate_integration_report()
            
            # Save report to file
            report_file = Path(".claude/.artifacts/phase2_integration_report.json")
            report_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            
            print(f"\n[FILE] Full report saved to: {report_file}")
            return report
            
        except Exception as e:
            print(f"\n[ERROR] CRITICAL ERROR during integration testing: {e}")
            traceback.print_exc()
            return {"error": str(e), "results": self.results}


def main():
    """Main entry point for integration testing."""
    tester = IntegrationTester()
    report = tester.run_all_tests()
    
    # Exit with appropriate code
    if report.get("production_readiness", {}).get("assessment") == "READY":
        print("\n[SUCCESS] INTEGRATION TESTING PASSED - System is production ready!")
        return 0
    else:
        print("\n[WARNING] INTEGRATION TESTING FAILED - System needs fixes before production")
        return 1


if __name__ == "__main__":
    sys.exit(main())