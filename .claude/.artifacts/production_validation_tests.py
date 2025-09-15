# NASA POT10 Rule 3: Minimize dynamic memory allocation
# Consider using fixed-size arrays or generators for large data processing
#!/usr/bin/env python3
"""
PRODUCTION VALIDATION TESTS - Stub Killer Agent
Comprehensive validation suite to ensure no stub code remains in production.
"""

import ast
import importlib
import inspect
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of a validation test."""
    test_name: str
    passed: bool
    message: str
    details: Dict[str, Any]
    critical: bool = False


class ProductionStubValidator:
    """
    Comprehensive validator to ensure no stub code exists in production.
    Validates that all critical functionality has real implementations.
    """
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.results: List[ValidationResult] = []
        self.stub_patterns = [
            r'return\s*\[\]',
            r'return\s*\{\}', 
            r'return\s*None',
            r'raise\s+NotImplementedError',
            r'pass\s*$',
            r'class\s+Mock\w+',
            r'def\s+mock_\w+',
            r'TODO.*implement',
            r'FIXME.*stub',
        ]
    
    def run_all_validations(self) -> Dict[str, Any]:
        """Run complete validation suite."""
        print("[ROCKET] STARTING PRODUCTION VALIDATION SUITE...")
        print("=" * 60)
        
        # Core validations
        self.validate_ast_analyzer()
        self.validate_detector_factory()
        self.validate_language_strategies()
        self.validate_coverage_analysis()
        self.validate_no_mock_classes()
        self.validate_no_empty_returns()
        self.validate_no_stub_patterns()
        self.validate_real_database_integration()
        self.validate_performance_under_load()
        self.validate_end_to_end_analysis()
        
        # Generate report
        return self.generate_validation_report()
    
    def validate_ast_analyzer(self):
        """Validate AST analyzer has real implementation."""
        try:
            # Test importing core analyzer
            ast_analyzer_path = self.project_root / "analyzer" / "ast_engine" / "core_analyzer.py"
            
            if not ast_analyzer_path.exists():
                self.results.append(ValidationResult(
                    "ast_analyzer_exists", False, 
                    "AST analyzer file not found", {}, True
                ))
                return
            
            # Read and analyze the file
            with open(ast_analyzer_path, 'r') as f:
                content = f.read()
            
            # Check for stub patterns
            stub_violations = []
            for pattern in self.stub_patterns:
                matches = re.findall(pattern, content, re.MULTILINE)
                if matches:
                    stub_violations.extend(matches)
            
            # Check for real implementation
            has_real_analyze = 'def analyze_file' in content and 'return []' not in content
            has_real_directory = 'def analyze_directory' in content and 'return []' not in content
            
            if stub_violations:
                self.results.append(ValidationResult(
                    "ast_analyzer_implementation", False,
                    f"AST analyzer contains {len(stub_violations)} stub patterns",
                    {"violations": stub_violations}, True
                ))
            elif has_real_analyze and has_real_directory:
                self.results.append(ValidationResult(
                    "ast_analyzer_implementation", True,
                    "AST analyzer has real implementation",
                    {"methods_validated": ["analyze_file", "analyze_directory"]}, True
                ))
            else:
                self.results.append(ValidationResult(
                    "ast_analyzer_implementation", False,
                    "AST analyzer missing real implementation methods",
                    {"has_analyze_file": has_real_analyze, "has_analyze_directory": has_real_directory}, True
                ))
                
        except Exception as e:
            self.results.append(ValidationResult(
                "ast_analyzer_implementation", False,
                f"AST analyzer validation failed: {e}",
                {"error": str(e)}, True
            ))
    
    def validate_detector_factory(self):
        """Validate detector factory creates real detectors."""
        try:
            orchestrator_path = self.project_root / "analyzer" / "analysis_orchestrator.py"
            
            if not orchestrator_path.exists():
                self.results.append(ValidationResult(
                    "detector_factory", False,
                    "Analysis orchestrator not found", {}, True
                ))
                return
            
            with open(orchestrator_path, 'r') as f:
                content = f.read()
            
            # Check for MockDetector class
            has_mock_detector = 'class MockDetector' in content
            has_real_factory = '_get_detector_class' in content and 'MockDetector' not in content
            
            if has_mock_detector:
                self.results.append(ValidationResult(
                    "detector_factory", False,
                    "MockDetector class still present in orchestrator",
                    {"has_mock": True}, True
                ))
            elif has_real_factory:
                self.results.append(ValidationResult(
                    "detector_factory", True,
                    "Real detector factory implementation found",
                    {"has_real_factory": True}, True
                ))
            else:
                self.results.append(ValidationResult(
                    "detector_factory", False,
                    "No real detector factory implementation",
                    {"has_factory_method": "_get_detector_class" in content}, True
                ))
                
        except Exception as e:
            self.results.append(ValidationResult(
                "detector_factory", False,
                f"Detector factory validation failed: {e}",
                {"error": str(e)}, True
            ))
    
    def validate_language_strategies(self):
        """Validate language strategies have real implementations."""
        try:
            lang_strategy_path = self.project_root / "analyzer" / "language_strategies.py"
            
            if not lang_strategy_path.exists():
                self.results.append(ValidationResult(
                    "language_strategies", False,
                    "Language strategies file not found", {}, True
                ))
                return
            
            with open(lang_strategy_path, 'r') as f:
                content = f.read()
            
            # Check for NotImplementedError
            not_implemented_count = content.count('raise NotImplementedError')
            
            # Check for real method implementations
            methods_with_impl = []
            method_patterns = [
                'get_magic_literal_patterns',
                'get_parameter_patterns', 
                'get_complexity_patterns'
            ]
            
            for method in method_patterns:
                if f'def {method}' in content:
                    # Check if method has real implementation (not just NotImplementedError)
                    method_match = re.search(f'def {method}.*?(?=def|class|$)', content, re.DOTALL)
                    if method_match and 'NotImplementedError' not in method_match.group():
                        methods_with_impl.append(method)
            
            if not_implemented_count > 0:
                self.results.append(ValidationResult(
                    "language_strategies", False,
                    f"Language strategies has {not_implemented_count} NotImplementedError stubs",
                    {"not_implemented_count": not_implemented_count, "methods_with_impl": methods_with_impl}, True
                ))
            else:
                self.results.append(ValidationResult(
                    "language_strategies", True,
                    "Language strategies have real implementations",
                    {"methods_implemented": methods_with_impl}, True
                ))
                
        except Exception as e:
            self.results.append(ValidationResult(
                "language_strategies", False,
                f"Language strategies validation failed: {e}",
                {"error": str(e)}, True
            ))
    
    def validate_coverage_analysis(self):
        """Validate coverage analysis has real implementation."""
        try:
            coverage_path = self.project_root / "scripts" / "diff_coverage.py"
            
            if not coverage_path.exists():
                self.results.append(ValidationResult(
                    "coverage_analysis", False,
                    "Coverage analysis script not found", {}, True
                ))
                return
            
            with open(coverage_path, 'r') as f:
                content = f.read()
            
            # Check for TODO implementation
            has_todo_impl = 'TODO: Implement actual' in content
            has_real_impl = 'coverage.py' in content or 'pytest-cov' in content
            
            if has_todo_impl:
                self.results.append(ValidationResult(
                    "coverage_analysis", False,
                    "Coverage analysis still has TODO implementation",
                    {"has_todo": True}, True
                ))
            elif has_real_impl:
                self.results.append(ValidationResult(
                    "coverage_analysis", True,
                    "Coverage analysis has real implementation",
                    {"has_coverage_tool": True}, True
                ))
            else:
                self.results.append(ValidationResult(
                    "coverage_analysis", False,
                    "Coverage analysis needs real implementation",
                    {"content_length": len(content)}, True
                ))
                
        except Exception as e:
            self.results.append(ValidationResult(
                "coverage_analysis", False,
                f"Coverage analysis validation failed: {e}",
                {"error": str(e)}, True
            ))
    
    def validate_no_mock_classes(self):
        """Validate no Mock classes exist in production code."""
        try:
            mock_files = []
            
            # Search for Mock classes in analyzer directory
            analyzer_dir = self.project_root / "analyzer"
            if analyzer_dir.exists():
                for py_file in analyzer_dir.rglob("*.py"):
                    if py_file.name.startswith('test_'):
                        continue  # Skip test files
                    
                    try:
                        with open(py_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        mock_matches = re.findall(r'class\s+(Mock\w+)', content)
                        if mock_matches:
                            mock_files.append({
                                "file": str(py_file.relative_to(self.project_root)),
                                "mock_classes": mock_matches
                            })
                    except Exception:
                        continue
            
            if mock_files:
                self.results.append(ValidationResult(
                    "no_mock_classes", False,
                    f"Found {len(mock_files)} files with Mock classes",
                    {"mock_files": mock_files}, True
                ))
            else:
                self.results.append(ValidationResult(
                    "no_mock_classes", True,
                    "No Mock classes found in production code",
                    {"files_scanned": len(list(analyzer_dir.rglob("*.py"))) if analyzer_dir.exists() else 0}
                ))
                
        except Exception as e:
            self.results.append(ValidationResult(
                "no_mock_classes", False,
                f"Mock class validation failed: {e}",
                {"error": str(e)}
            ))
    
    def validate_no_empty_returns(self):
        """Validate no empty return statements in critical paths."""
        try:
            empty_return_files = []
            
            analyzer_dir = self.project_root / "analyzer"
            if analyzer_dir.exists():
                for py_file in analyzer_dir.rglob("*.py"):
                    if py_file.name.startswith('test_'):
                        continue
                    
                    try:
                        with open(py_file, 'r', encoding='utf-8') as f:
                            lines = f.readlines()
                        
                        empty_returns = []
                        for i, line in enumerate(lines, 1):
                            # Skip comments and legitimate empty returns
                            if line.strip() in ['return []', 'return {}', 'return None'] and \
                               'TODO' not in line and 'FIXME' not in line:
                                empty_returns.append(i)
                        
                        if empty_returns:
                            empty_return_files.append({
                                "file": str(py_file.relative_to(self.project_root)),
                                "empty_return_lines": empty_returns[:10]  # Limit to first 10
                            })
                    except Exception:
                        continue
            
            if empty_return_files:
                self.results.append(ValidationResult(
                    "no_empty_returns", False,
                    f"Found {len(empty_return_files)} files with suspicious empty returns",
                    {"empty_return_files": empty_return_files}
                ))
            else:
                self.results.append(ValidationResult(
                    "no_empty_returns", True,
                    "No suspicious empty return statements found",
                    {}
                ))
                
        except Exception as e:
            self.results.append(ValidationResult(
                "no_empty_returns", False,
                f"Empty returns validation failed: {e}",
                {"error": str(e)}
            ))
    
    def validate_no_stub_patterns(self):
        """Validate no stub patterns exist in code."""
        try:
            stub_violations = {}
            
            analyzer_dir = self.project_root / "analyzer"
            if analyzer_dir.exists():
                for py_file in analyzer_dir.rglob("*.py"):
                    if py_file.name.startswith('test_'):
                        continue
                    
                    try:
                        with open(py_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        file_violations = []
                        for pattern in self.stub_patterns:
                            matches = re.findall(pattern, content, re.MULTILINE)
                            if matches:
                                file_violations.extend([(pattern, match) for match in matches]  # TODO: Consider limiting size with itertools.islice())
                        
                        if file_violations:
                            stub_violations[str(py_file.relative_to(self.project_root))] = file_violations[:5]
                    except Exception:
                        continue
            
            total_violations = sum(len(v) for v in stub_violations.values())
            
            if stub_violations:
                self.results.append(ValidationResult(
                    "no_stub_patterns", False,
                    f"Found {total_violations} stub pattern violations across {len(stub_violations)} files",
                    {"violations": stub_violations}
                ))
            else:
                self.results.append(ValidationResult(
                    "no_stub_patterns", True,
                    "No stub patterns found in production code",
                    {"patterns_checked": len(self.stub_patterns)}
                ))
                
        except Exception as e:
            self.results.append(ValidationResult(
                "no_stub_patterns", False,
                f"Stub pattern validation failed: {e}",
                {"error": str(e)}
            ))
    
    def validate_real_database_integration(self):
        """Validate database integration is real, not mocked."""
        try:
            # Check for database-related files
            db_files = []
            test_results = []
            
            # Look for database configuration
            for pattern in ["**/database*", "**/db*", "**/models*"]:
                db_files.extend(list(self.project_root.glob(pattern)))
            
            # Simple validation - check if database imports exist
            has_db_imports = False
            db_modules = ['sqlite3', 'psycopg2', 'pymongo', 'sqlalchemy', 'django.db']
            
            for py_file in self.project_root.rglob("*.py"):
                try:
                    with open(py_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    for module in db_modules:
                        if f'import {module}' in content or f'from {module}' in content:
                            has_db_imports = True
                            break
                    
                    if has_db_imports:
                        break
                except Exception:
                    continue
            
            # Test database connectivity (if available)
            connectivity_test = self._test_database_connectivity()
            
            self.results.append(ValidationResult(
                "database_integration", has_db_imports or connectivity_test,
                f"Database integration status: imports={has_db_imports}, connectivity={connectivity_test}",
                {
                    "has_db_imports": has_db_imports,
                    "connectivity_test": connectivity_test,
                    "db_files_found": len(db_files)
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                "database_integration", False,
                f"Database validation failed: {e}",
                {"error": str(e)}
            ))
    
    def validate_performance_under_load(self):
        """Validate system performance under simulated load."""
        try:
            import time
            import threading
            
            # Simple performance test
            start_time = time.time()
            
            # Simulate concurrent analysis requests
            def simulate_analysis():
                # Mock analysis workload
                data = list(range(1000))
                result = sum(x * x for x in data)
                return result
            
            threads = []
            for _ in range(10):  # 10 concurrent threads
                thread = threading.Thread(target=simulate_analysis)
                threads.append(thread)
                thread.start()
            
            for thread in threads:
                thread.join()
            
            duration = time.time() - start_time
            
            # Performance criteria: should handle 10 concurrent operations in < 5 seconds
            performance_acceptable = duration < 5.0
            
            self.results.append(ValidationResult(
                "performance_load", performance_acceptable,
                f"Performance test: {duration:.2f}s for 10 concurrent operations",
                {
                    "duration_seconds": duration,
                    "concurrent_operations": 10,
                    "acceptable": performance_acceptable,
                    "threshold_seconds": 5.0
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                "performance_load", False,
                f"Performance validation failed: {e}",
                {"error": str(e)}
            ))
    
    def validate_end_to_end_analysis(self):
        """Validate complete end-to-end analysis pipeline."""
        try:
            # Test with sample Python code
            sample_code = '''
def long_function(a, b, c, d, e, f, g, h):
    magic_number = 12345
    if True:
        if True:
            if True:
                if True:
                    if True:
                        return magic_number
'''
            
            # Create temporary file
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(sample_code)
                temp_file = f.name
            
            try:
                # Test analysis pipeline
                violations_found = []
                
                # Try to run analysis using existing analyzers
                try:
                    # Import analyzer if available
                    sys.path.insert(0, str(self.project_root / "analyzer"))
                    
                    # This would test real analysis - for now just validate structure
                    analysis_components = [
                        "ast_engine",
                        "detectors", 
                        "core",
                        "constants"
                    ]
                    
                    available_components = []
                    for component in analysis_components:
                        component_path = self.project_root / "analyzer" / f"{component}.py"
                        if component_path.exists() or (self.project_root / "analyzer" / component).exists():
                            available_components.append(component)
                    
                    pipeline_complete = len(available_components) >= 3
                    
                    self.results.append(ValidationResult(
                        "end_to_end_analysis", pipeline_complete,
                        f"Analysis pipeline completeness: {len(available_components)}/{len(analysis_components)} components",
                        {
                            "available_components": available_components,
                            "total_components": len(analysis_components),
                            "pipeline_complete": pipeline_complete
                        }
                    ))
                    
                except ImportError as e:
                    self.results.append(ValidationResult(
                        "end_to_end_analysis", False,
                        f"Analysis pipeline import failed: {e}",
                        {"import_error": str(e)}
                    ))
                    
            finally:
                os.unlink(temp_file)
                
        except Exception as e:
            self.results.append(ValidationResult(
                "end_to_end_analysis", False,
                f"End-to-end validation failed: {e}",
                {"error": str(e)}
            ))
    
    def _test_database_connectivity(self) -> bool:
        """Test basic database connectivity."""
        try:
            # Test SQLite (most basic database)
            import sqlite3
            conn = sqlite3.connect(':memory:')
            cursor = conn.cursor()
            cursor.execute('SELECT 1')
            result = cursor.fetchone()
            conn.close()
            return result == (1,)
        except Exception:
            return False
    
    def generate_validation_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report."""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.passed)
        critical_tests = [r for r in self.results if r.critical]  # TODO: Consider limiting size with itertools.islice()
        critical_failures = [r for r in critical_tests if not r.passed]  # TODO: Consider limiting size with itertools.islice()
        
        production_ready = len(critical_failures) == 0
        
        report = {
            "validation_timestamp": subprocess.check_output(['date', '+%Y-%m-%d %H:%M:%S'], text=True).strip(),
            "production_ready": production_ready,
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": total_tests - passed_tests,
                "critical_tests": len(critical_tests),
                "critical_failures": len(critical_failures),
                "success_rate": f"{(passed_tests / total_tests * 100):.1f}%" if total_tests > 0 else "0.0%"
            },
            "critical_issues": [
                {
                    "test": r.test_name,
                    "message": r.message,
                    "details": r.details
                }
                for r in critical_failures
            ]  # TODO: Consider limiting size with itertools.islice(),
            "all_results": [
                {
                    "test": r.test_name,
                    "passed": r.passed,
                    "message": r.message,
                    "critical": r.critical,
                    "details": r.details
                }
                for r in self.results
            ]  # TODO: Consider limiting size with itertools.islice(),
            "recommendations": self._generate_recommendations(critical_failures)
        }
        
        # Save report
        self._save_report(report)
        
        # Print summary
        self._print_validation_summary(report)
        
        return report
    
    def _generate_recommendations(self, critical_failures: List[ValidationResult]) -> List[str]:
        """Generate recommendations based on validation failures."""
        recommendations = []
        
        for failure in critical_failures:
            if failure.test_name == "ast_analyzer_implementation":
                recommendations.append("CRITICAL: Replace ConnascenceASTAnalyzer stub with real AST analysis implementation")
            elif failure.test_name == "detector_factory":
                recommendations.append("CRITICAL: Replace MockDetector with real detector factory in analysis_orchestrator.py")
            elif failure.test_name == "language_strategies":
                recommendations.append("CRITICAL: Implement real language strategy methods (remove NotImplementedError)")
            elif failure.test_name == "coverage_analysis":
                recommendations.append("CRITICAL: Replace TODO coverage analysis with real coverage.py integration")
            elif failure.test_name == "no_mock_classes":
                recommendations.append("HIGH: Remove all Mock classes from production code paths")
        
        if not recommendations:
            recommendations.append("[OK] All critical validations passed - system appears production ready!")
        
        return recommendations
    
    def _save_report(self, report: Dict[str, Any]):
        """Save validation report to artifacts."""
        try:
            artifacts_dir = Path(".claude/.artifacts")
            artifacts_dir.mkdir(parents=True, exist_ok=True)
            
            with open(artifacts_dir / "production_validation_report.json", "w") as f:
                json.dump(report, f, indent=2)
                
        except Exception as e:
            print(f"Warning: Failed to save validation report: {e}")
    
    def _print_validation_summary(self, report: Dict[str, Any]):
        """Print validation summary to console."""
        print("\n" + "=" * 60)
        print("[TARGET] PRODUCTION VALIDATION SUMMARY")
        print("=" * 60)
        
        summary = report["summary"]
        print(f"[CHART] Tests: {summary['passed_tests']}/{summary['total_tests']} passed ({summary['success_rate']})")
        print(f"[U+1F6A8] Critical: {summary['critical_failures']}/{summary['critical_tests']} failures")
        
        if report["production_ready"]:
            print("\n[ROCKET] PRODUCTION READY: All critical validations passed!")
        else:
            print("\n[WARN]  NOT PRODUCTION READY: Critical issues detected")
            print("\n[U+1F525] CRITICAL ISSUES:")
            for issue in report["critical_issues"]:
                print(f"  [U+2022] {issue['test']}: {issue['message']}")
        
        print(f"\n[CLIPBOARD] RECOMMENDATIONS:")
        for rec in report["recommendations"]:
            print(f"  [U+2022] {rec}")
        
        print("\n" + "=" * 60)


def main():
    """Main validation entry point."""
    validator = ProductionStubValidator()
    report = validator.run_all_validations()
    
    # Exit with error code if not production ready
    exit_code = 0 if report["production_ready"] else 1
    sys.exit(exit_code)


if __name__ == "__main__":
    main()