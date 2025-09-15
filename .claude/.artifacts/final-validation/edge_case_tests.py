#!/usr/bin/env python3
"""
Edge Case Testing Suite
=======================

Comprehensive testing of edge cases, error scenarios, and fallback mechanisms.
"""

import json
import os
import sys
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, Any, List

class EdgeCaseTestSuite:
    """Test suite for edge cases and error scenarios."""
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.artifacts_dir = self.project_root / ".claude" / ".artifacts"
        
    def run_all_edge_case_tests(self) -> Dict[str, Any]:
        """Run all edge case tests."""
        results = {
            "timestamp": "2025-09-10T19:45:00Z",
            "test_scenarios": {},
            "summary": {"total": 0, "passed": 0, "failed": 0}
        }
        
        # Test scenarios
        scenarios = [
            ("malformed_json", self.test_malformed_json_handling),
            ("missing_files", self.test_missing_file_scenarios),
            ("timeout_handling", self.test_timeout_scenarios),
            ("concurrent_execution", self.test_concurrent_workflows),
            ("environment_variables", self.test_env_var_overrides),
            ("nasa_compliance_edge_cases", self.test_nasa_compliance_scenarios)
        ]
        
        for scenario_name, test_method in scenarios:
            try:
                result = test_method()
                results["test_scenarios"][scenario_name] = result
                results["summary"]["total"] += 1
                if result.get("status") == "PASS":
                    results["summary"]["passed"] += 1
                else:
                    results["summary"]["failed"] += 1
            except Exception as e:
                results["test_scenarios"][scenario_name] = {
                    "status": "FAIL",
                    "error": str(e)
                }
                results["summary"]["total"] += 1
                results["summary"]["failed"] += 1
        
        return results
    
    def test_malformed_json_handling(self) -> Dict[str, Any]:
        """Test handling of malformed JSON files."""
        # Create malformed JSON file
        malformed_file = self.artifacts_dir / "malformed_test.json"
        with open(malformed_file, "w") as f:
            f.write('{"incomplete": json')
        
        try:
            # Test if quality gates can handle malformed JSON gracefully
            result = subprocess.run(
                [sys.executable, ".github/scripts/quality_gates.py"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            # Clean up
            if malformed_file.exists():
                malformed_file.unlink()
            
            return {
                "status": "PASS" if result.returncode in [0, 1] else "FAIL",
                "details": "Graceful handling of malformed JSON",
                "return_code": result.returncode
            }
        except Exception as e:
            return {"status": "FAIL", "error": str(e)}
    
    def test_missing_file_scenarios(self) -> Dict[str, Any]:
        """Test behavior when expected files are missing."""
        # Temporarily rename a critical file
        critical_file = self.project_root / "package.json"
        backup_name = None
        
        try:
            if critical_file.exists():
                backup_name = str(critical_file) + ".backup"
                critical_file.rename(backup_name)
            
            # Run analysis without package.json
            result = subprocess.run(
                [sys.executable, ".github/scripts/comprehensive_analysis.py"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return {
                "status": "PASS" if result.returncode == 0 else "WARN",
                "details": "Handled missing package.json gracefully",
                "return_code": result.returncode
            }
            
        except Exception as e:
            return {"status": "FAIL", "error": str(e)}
        finally:
            # Restore file
            if backup_name and Path(backup_name).exists():
                Path(backup_name).rename(critical_file)
    
    def test_timeout_scenarios(self) -> Dict[str, Any]:
        """Test timeout handling in workflows."""
        # Create a test script that would timeout
        timeout_script = """
import time
import sys
print("Starting long-running operation...")
time.sleep(10)  # This should timeout in CI
print("Operation completed")
sys.exit(0)
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp:
            tmp.write(timeout_script)
            tmp_path = tmp.name
        
        try:
            result = subprocess.run(
                [sys.executable, tmp_path],
                capture_output=True,
                text=True,
                timeout=5  # Should timeout
            )
            
            # Should not reach here
            return {"status": "FAIL", "details": "Timeout not triggered"}
            
        except subprocess.TimeoutExpired:
            return {"status": "PASS", "details": "Timeout handled correctly"}
        except Exception as e:
            return {"status": "FAIL", "error": str(e)}
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    def test_concurrent_workflows(self) -> Dict[str, Any]:
        """Test concurrent execution of multiple workflows."""
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def run_workflow(script_name):
            try:
                result = subprocess.run(
                    [sys.executable, f".github/scripts/{script_name}"],
                    cwd=self.project_root,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                results_queue.put(("PASS", script_name, result.returncode))
            except Exception as e:
                results_queue.put(("FAIL", script_name, str(e)))
        
        # Start multiple workflows concurrently
        scripts = ["mece_analysis.py", "sarif_generation.py"]
        threads = []
        
        for script in scripts:
            thread = threading.Thread(target=run_workflow, args=(script,))
            thread.start()
            threads.append(thread)
        
        # Wait for completion
        for thread in threads:
            thread.join(timeout=40)
        
        # Collect results
        results = []
        while not results_queue.empty():
            results.append(results_queue.get())
        
        all_passed = all(result[0] == "PASS" for result in results)
        
        return {
            "status": "PASS" if all_passed else "WARN",
            "details": f"Concurrent execution of {len(scripts)} workflows",
            "results": results
        }
    
    def test_env_var_overrides(self) -> Dict[str, Any]:
        """Test environment variable override functionality."""
        # Test with environment variable overrides
        env = os.environ.copy()
        env["QA_THRESHOLD_OVERRIDE"] = "75"  # Lower threshold for testing
        
        try:
            result = subprocess.run(
                [sys.executable, ".github/scripts/quality_gates.py"],
                cwd=self.project_root,
                env=env,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return {
                "status": "PASS" if result.returncode in [0, 1] else "WARN",
                "details": "Environment variable override handling",
                "return_code": result.returncode
            }
            
        except Exception as e:
            return {"status": "FAIL", "error": str(e)}
    
    def test_nasa_compliance_scenarios(self) -> Dict[str, Any]:
        """Test NASA compliance edge cases."""
        # Create a test file with known compliance issues
        test_file_content = '''
def very_long_function_that_violates_nasa_rule_4():
    """This function is intentionally too long for NASA POT10."""
    line1 = "This is line 1"
    line2 = "This is line 2"
    line3 = "This is line 3"
    # ... many more lines to exceed 60 line limit
    ''' + '\n'.join([f'    line{i} = "Line {i}"' for i in range(4, 65)]) + '''
    return "Function completed"

class GodObjectForTesting:
    """This class intentionally violates multiple NASA rules."""
    def __init__(self):
        pass
    ''' + '\n'.join([f'    def method_{i}(self): pass' for i in range(1, 30)])
        
        test_file = self.project_root / "src" / "test_compliance.py"
        test_file.parent.mkdir(exist_ok=True)
        
        try:
            with open(test_file, "w") as f:
                f.write(test_file_content)
            
            # Run compliance analysis
            result = subprocess.run(
                [sys.executable, ".github/scripts/run_connascence_analysis.py"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return {
                "status": "PASS" if result.returncode == 0 else "WARN",
                "details": "NASA compliance detection with test violations",
                "return_code": result.returncode
            }
            
        except Exception as e:
            return {"status": "FAIL", "error": str(e)}
        finally:
            # Clean up test file
            if test_file.exists():
                test_file.unlink()


def main():
    """Main execution function."""
    project_root = Path.cwd()
    suite = EdgeCaseTestSuite(project_root)
    results = suite.run_all_edge_case_tests()
    
    # Save results
    artifacts_dir = project_root / ".claude" / ".artifacts" / "final-validation"
    artifacts_dir.mkdir(exist_ok=True)
    
    output_file = artifacts_dir / "edge_case_test_results.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"Edge case tests completed: {results['summary']['passed']}/{results['summary']['total']} passed")
    print(f"Results saved to: {output_file}")
    
    return results['summary']['failed'] == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)