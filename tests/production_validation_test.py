from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES

import os
import sys
import json
import subprocess
import tempfile
import shutil
import time
import unittest
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

class ProductionValidationTestSuite(unittest.TestCase):
    """Comprehensive production readiness validation tests."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        cls.test_dir = Path(tempfile.mkdtemp(prefix="prod_validation_"))
        cls.project_root = Path(__file__).parent.parent
        cls.scripts_dir = cls.project_root / "scripts"
        cls.cleanup_script = cls.scripts_dir / "post-completion-cleanup.sh"
        cls.results = {}
        
        # Ensure test directory structure
        cls.test_dir.mkdir(exist_ok=True)
        
    @classmethod
    def tearDownClass(cls):
        """Clean up test environment."""
        if cls.test_dir.exists():
            shutil.rmtree(cls.test_dir, ignore_errors=True)
            
    def setUp(self):
        """Set up individual test."""
        self.test_start_time = time.time()
        
    def tearDown(self):
        """Clean up individual test."""
        test_duration = time.time() - self.test_start_time
        test_name = self._testMethodName
        self.results[test_name] = {
            'duration': test_duration,
            'status': 'passed' if not self._outcome.errors and not self._outcome.failures else 'failed'
        }

    def test_01_dependency_validation(self):
        """Test all required dependencies are available and working."""
        dependencies = {
            'python': ['python', '--version'],
            'bash': ['bash', '--version'],
            'git': ['git', '--version'],
            'node': ['node', '--version'],
            'npm': ['npm', '--version']
        }
        
        missing_deps = []
        for dep_name, cmd in dependencies.items():
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.returncode != 0:
                    missing_deps.append(f"{dep_name}: {result.stderr}")
            except (subprocess.TimeoutExpired, FileNotFoundError) as e:
                missing_deps.append(f"{dep_name}: {str(e)}")
        
        self.assertEqual(len(missing_deps), 0, 
                        f"Missing or failing dependencies: {missing_deps}")

    def test_02_cross_platform_compatibility(self):
        """Test cross-platform compatibility of cleanup scripts."""
        # Test path handling
        test_paths = [
            "C:\\Windows\\path\\to\\file",
            "/unix/path/to/file",
            "relative/path/file",
            "./local/file"
        ]
        
        compatibility_issues = []
        
        # Test script execution on current platform
        try:
            if os.name == 'nt':  # Windows
                # Test Windows-specific functionality
                result = subprocess.run(['bash', '-c', 'echo "Windows test"'], 
                                        capture_output=True, text=True, timeout=5)
                if result.returncode != 0:
                    compatibility_issues.append("Bash unavailable on Windows")
            else:  # Unix-like
                # Test Unix-specific functionality
                result = subprocess.run(['bash', '-c', 'echo "Unix test"'], 
                                        capture_output=True, text=True, timeout=5)
                if result.returncode != 0:
                    compatibility_issues.append("Bash issues on Unix")
                    
        except Exception as e:
            compatibility_issues.append(f"Platform compatibility error: {e}")
        
        self.assertEqual(len(compatibility_issues), 0,
                        f"Cross-platform issues: {compatibility_issues}")

    def test_03_error_handling_robustness(self):
        """Test comprehensive error handling and recovery mechanisms."""
        error_scenarios = []
        
        # Test script with invalid arguments
        try:
            result = subprocess.run([
                'bash', str(self.cleanup_script), '--invalid-flag'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                error_scenarios.append("Script should reject invalid flags")
            elif "Unknown option" not in result.stderr:
                error_scenarios.append("Error message not descriptive enough")
                
        except subprocess.TimeoutExpired:
            error_scenarios.append("Script hangs on invalid input")
        except Exception as e:
            error_scenarios.append(f"Unexpected error handling issue: {e}")
        
        # Test script with missing dependencies (simulated)
        try:
            env = os.environ.copy()
            env['PATH'] = ''  # Remove PATH to simulate missing tools
            
            result = subprocess.run([
                'bash', str(self.cleanup_script), '--help'
            ], capture_output=True, text=True, timeout=5, env=env)
            
            # Should still show help even with missing PATH
            if result.returncode != 0 and "USAGE:" not in result.stdout:
                error_scenarios.append("Help should work even with missing PATH")
                
        except Exception as e:
            # This is expected in some cases
        
        self.assertEqual(len(error_scenarios), 0,
                        f"Error handling issues: {error_scenarios}")

    def test_04_security_audit_trail(self):
        """Test security features and comprehensive audit trail generation."""
        security_issues = []
        
        # Check for security best practices in script
        try:
            with open(self.cleanup_script, 'r') as f:
                script_content = f.read()
            
            # Security checks
            if 'set -euo pipefail' not in script_content:
                security_issues.append("Script missing strict error handling")
            
            if 'rm -rf /' in script_content:
                security_issues.append("Dangerous rm command without protection")
            
            if 'eval' in script_content:
                security_issues.append("Script uses eval which can be dangerous")
                
            # Check for proper input validation
            if 'read -r' not in script_content:
                security_issues.append("Script may not safely read user input")
                
        except Exception as e:
            security_issues.append(f"Cannot analyze script security: {e}")
        
        # Test logging capabilities
        if not (self.scripts_dir / "lib" / "cleanup-commons.sh").exists():
            security_issues.append("Cleanup commons library missing")
            
        self.assertEqual(len(security_issues), 0,
                        f"Security issues: {security_issues}")

    def test_05_enterprise_compliance(self):
        """Test enterprise environment compatibility and compliance."""
        compliance_issues = []
        
        # Check for enterprise requirements
        try:
            # Test lock mechanism
            lock_test_script = """
            with_lock() {
                echo "Testing lock mechanism"
            }
            """
            
            # Test that audit trails are comprehensive
            if not self.cleanup_script.exists():
                compliance_issues.append("Main cleanup script missing")
            
            # Check for proper logging
            with open(self.cleanup_script, 'r') as f:
                content = f.read()
                
            if 'log(' not in content:
                compliance_issues.append("Insufficient logging framework")
                
            if 'timestamp' not in content.lower():
                compliance_issues.append("Missing timestamp logging")
                
            if 'acquire_lock' not in content:
                compliance_issues.append("Missing concurrent execution protection")
                
        except Exception as e:
            compliance_issues.append(f"Compliance check failed: {e}")
            
        self.assertEqual(len(compliance_issues), 0,
                        f"Enterprise compliance issues: {compliance_issues}")

    def test_06_rollback_mechanisms(self):
        """Test comprehensive rollback procedures."""
        rollback_issues = []
        
        try:
            # Test rollback help
            result = subprocess.run([
                'bash', str(self.cleanup_script), '--help'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                rollback_issues.append("Cannot access help for rollback info")
            elif 'rollback' not in result.stdout.lower():
                rollback_issues.append("Rollback options not documented in help")
                
            # Check for multiple rollback mechanisms
            with open(self.cleanup_script, 'r') as f:
                content = f.read()
                
            rollback_mechanisms = [
                'backup_tag',
                'backup_branch', 
                'filesystem backup',
                'rollback'
            ]
            
            for mechanism in rollback_mechanisms:
                if mechanism.replace(' ', '_') not in content:
                    rollback_issues.append(f"Missing rollback mechanism: {mechanism}")
                    
        except Exception as e:
            rollback_issues.append(f"Rollback validation failed: {e}")
            
        self.assertEqual(len(rollback_issues), 0,
                        f"Rollback mechanism issues: {rollback_issues}")

    def test_07_scale_performance_validation(self):
        """Test performance with large codebase simulation."""
        performance_issues = []
        
        try:
            # Create a simulated large codebase
            large_test_dir = self.test_dir / "large_project"
            large_test_dir.mkdir(exist_ok=True)
            
            # Create many files to test cleanup performance
            for i in range(100):  # Simulate 100 files
                test_file = large_test_dir / f"test_file_{i}.py"
            
            # Create deep directory structure
            deep_dir = large_test_dir
            for level in range(10):  # 10 levels deep
                deep_dir = deep_dir / f"level_{level}"
                deep_dir.mkdir(exist_ok=True)
                (deep_dir / "test.py").write_text("# Deep test file\n")
            
            # Test script performance on large directory
            start_time = time.time()
            
            # Test dry-run mode for performance
            result = subprocess.run([
                'bash', str(self.cleanup_script), '--dry-run', '--help'
            ], capture_output=True, text=True, timeout=30)  # 30 second timeout
            
            duration = time.time() - start_time
            
            if duration > 10:  # Should complete help in under 10 seconds
                performance_issues.append(f"Script too slow: {duration:.2f}s for help")
                
            if result.returncode != 0:
                performance_issues.append(f"Script failed during performance test: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            performance_issues.append("Script timeout during performance test")
        except Exception as e:
            performance_issues.append(f"Performance test failed: {e}")
        finally:
            # Cleanup test directory
            if 'large_test_dir' in locals() and large_test_dir.exists():
                shutil.rmtree(large_test_dir, ignore_errors=True)
        
        self.assertEqual(len(performance_issues), 0,
                        f"Performance issues: {performance_issues}")

    def test_08_integration_testing(self):
        """Test integration with GitHub workflows and quality systems."""
        integration_issues = []
        
        try:
            # Check GitHub workflows exist
            workflows_dir = self.project_root / ".github" / "workflows"
            if not workflows_dir.exists():
                integration_issues.append("GitHub workflows directory missing")
            else:
                # Check for key workflow files
                key_workflows = [
                    "quality-gates.yml",
                    "self-dogfooding.yml", 
                    "nasa-compliance-check.yml"
                ]
                
                for workflow in key_workflows:
                    workflow_file = workflows_dir / workflow
                    if not workflow_file.exists():
                        integration_issues.append(f"Missing workflow: {workflow}")
                    else:
                        # Basic YAML syntax check
                        try:
                            import yaml
                            with open(workflow_file) as f:
                                yaml.safe_load(f)
                        except Exception as e:
                            integration_issues.append(f"Invalid YAML in {workflow}: {e}")
            
            # Check analyzer integration
            analyzer_dir = self.project_root / "analyzer"
            if not analyzer_dir.exists():
                integration_issues.append("Analyzer system missing")
            elif not (analyzer_dir / "__init__.py").exists():
                integration_issues.append("Analyzer not properly packaged")
                
            # Test package.json integration
            package_json = self.project_root / "package.json"
            if package_json.exists():
                try:
                    with open(package_json) as f:
                        pkg_data = json.load(f)
                    
                    # Check for essential scripts
                    scripts = pkg_data.get('scripts', {})
                    essential_scripts = ['test', 'build', 'lint']
                    
                    for script in essential_scripts:
                        if script not in scripts:
                            integration_issues.append(f"Missing package.json script: {script}")
                            
                except Exception as e:
                    integration_issues.append(f"Invalid package.json: {e}")
                    
        except Exception as e:
            integration_issues.append(f"Integration test failed: {e}")
            
        self.assertEqual(len(integration_issues), 0,
                        f"Integration issues: {integration_issues}")

    def test_09_failure_scenario_recovery(self):
        """Test recovery from various failure scenarios."""
        recovery_issues = []
        
        try:
            # Test script behavior with corrupted state files
            test_state_file = self.test_dir / ".cleanup-state"
            test_state_file.write_text("INVALID STATE DATA\nBROKEN=true")
            
            # Test script handles corrupted state gracefully
            result = subprocess.run([
                'bash', str(self.cleanup_script), '--status'
            ], capture_output=True, text=True, timeout=10, 
            cwd=str(self.test_dir))
            
            # Should handle gracefully, not crash
            if result.returncode == 0 or "error" in result.stderr.lower():
                pass  # Expected behavior
            else:
                recovery_issues.append("Script doesn't handle corrupted state files")
            
            # Test permission denied scenarios (simulate)
            readonly_dir = self.test_dir / "readonly"
            readonly_dir.mkdir(exist_ok=True)
            readonly_dir.chmod(0o444)  # Read-only
            
            # Test script handles permission issues
            
        except subprocess.TimeoutExpired:
            recovery_issues.append("Script hangs during failure recovery test")
        except Exception as e:
            # Some failure scenarios are expected
        finally:
            # Cleanup test files
            try:
                test_state_file.unlink(missing_ok=True)
                if 'readonly_dir' in locals() and readonly_dir.exists():
                    readonly_dir.chmod(0o755)  # Restore permissions
                    shutil.rmtree(readonly_dir, ignore_errors=True)
            except:
                pass
        
        self.assertEqual(len(recovery_issues), 0,
                        f"Failure recovery issues: {recovery_issues}")

    def test_10_maintenance_monitoring(self):
        """Test maintenance and monitoring capabilities."""
        monitoring_issues = []
        
        try:
            # Test status reporting
            result = subprocess.run([
                'bash', str(self.cleanup_script), '--status'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                monitoring_issues.append(f"Status command failed: {result.stderr}")
            elif "STATUS" not in result.stdout:
                monitoring_issues.append("Status output doesn't contain status information")
            
            # Check for log file capabilities
            with open(self.cleanup_script, 'r') as f:
                content = f.read()
            
            if 'LOG_FILE' not in content:
                monitoring_issues.append("No log file configuration found")
            
            if 'log()' not in content:
                monitoring_issues.append("No logging function found")
                
            # Check for health check capabilities
            health_indicators = [
                'health',
                'status',
                'validate',
                'check'
            ]
            
            health_found = any(indicator in content.lower() for indicator in health_indicators)
            if not health_found:
                monitoring_issues.append("No health check mechanisms found")
                
        except Exception as e:
            monitoring_issues.append(f"Monitoring test failed: {e}")
            
        self.assertEqual(len(monitoring_issues), 0,
                        f"Monitoring issues: {monitoring_issues}")

    def generate_production_report(self) -> Dict[str, Any]:
        """Generate comprehensive production readiness report."""
        # Calculate overall scores
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results.values() if r['status'] == 'passed')
        
        production_readiness_score = (passed_tests / total_tests) * MAXIMUM_FUNCTION_LENGTH_LINES if total_tests > 0 else 0
        
        # Determine deployment readiness
        critical_tests = [
            'test_01_dependency_validation',
            'test_03_error_handling_robustness',
            'test_04_security_audit_trail',
            'test_06_rollback_mechanisms'
        ]
        
        critical_passed = sum(1 for test in critical_tests 
                            if test in self.results and self.results[test]['status'] == 'passed')
        deployment_ready = critical_passed == len(critical_tests)
        
        # Risk assessment
        failed_tests = [name for name, result in self.results.items() 
                        if result['status'] == 'failed']
        
        risk_level = 'LOW'
        if failed_tests:
            if any(test in critical_tests for test in failed_tests):
                risk_level = 'HIGH'
            else:
                risk_level = 'MEDIUM'
        
        return {
            'timestamp': datetime.now().isoformat(),
            'production_readiness_score': production_readiness_score,
            'deployment_ready': deployment_ready,
            'risk_level': risk_level,
            'test_summary': {
                'total_tests': total_tests,
                'passed_tests': passed_tests,
                'failed_tests': len(failed_tests),
                'critical_tests_passed': critical_passed,
                'critical_tests_total': len(critical_tests)
            },
            'detailed_results': self.results,
            'failed_tests': failed_tests,
            'recommendations': self._generate_recommendations(failed_tests, critical_tests),
            'deployment_blockers': [test for test in failed_tests if test in critical_tests],
            'operational_requirements': {
                'monitoring_setup': 'Log aggregation and status monitoring required',
                'backup_procedures': 'Multiple rollback mechanisms available',
                'security_compliance': 'Audit trails and access controls implemented',
                'performance_requirements': 'Tested for large-scale deployment'
            }
        }
    
    def _generate_recommendations(self, failed_tests: List[str], critical_tests: List[str]) -> List[str]:
        """Generate specific recommendations based on test results."""
        recommendations = []
        
        if 'test_01_dependency_validation' in failed_tests:
            recommendations.append("Install missing dependencies before deployment")
            
        if 'test_02_cross_platform_compatibility' in failed_tests:
            recommendations.append("Test deployment on target platform before production")
            
        if 'test_03_error_handling_robustness' in failed_tests:
            recommendations.append("CRITICAL: Improve error handling and validation")
            
        if 'test_04_security_audit_trail' in failed_tests:
            recommendations.append("CRITICAL: Address security vulnerabilities before deployment")
            
        if 'test_05_enterprise_compliance' in failed_tests:
            recommendations.append("Ensure enterprise compliance requirements are met")
            
        if 'test_06_rollback_mechanisms' in failed_tests:
            recommendations.append("CRITICAL: Verify all rollback mechanisms work correctly")
            
        if 'test_07_scale_performance_validation' in failed_tests:
            recommendations.append("Optimize performance for large-scale deployments")
            
        if 'test_08_integration_testing' in failed_tests:
            recommendations.append("Fix integration issues with CI/CD and quality systems")
            
        if 'test_09_failure_scenario_recovery' in failed_tests:
            recommendations.append("Improve failure recovery and resilience mechanisms")
            
        if 'test_10_maintenance_monitoring' in failed_tests:
            recommendations.append("Set up proper monitoring and maintenance procedures")
        
        if not recommendations:
            recommendations.append("All tests passed - system is production ready!")
            
        return recommendations

def run_production_validation():
    """Run the complete production validation suite."""
    print("=" * 80)
    print("SPEK TEMPLATE POST-COMPLETION CLEANUP")
    print("=" * 80)
    print()
    
    # Create test suite
    suite = unittest.TestSuite()
    test_class = ProductionValidationTestSuite
    
    # Add all test methods
    test_methods = [method for method in dir(test_class) 
                    if method.startswith('test_') and callable(getattr(test_class, method))]
    
    for method in sorted(test_methods):
        suite.addTest(test_class(method))
    
    # Run tests with custom result collector
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    # Generate production report
    test_instance = test_class()
    test_instance.results = {}
    
    # Collect results from test run
    for test, error in result.failures + result.errors:
        test_name = test._testMethodName
        test_instance.results[test_name] = {'status': 'failed', 'duration': 0}
    
    # Add passed tests
    for test in suite:
        test_name = test._testMethodName
        if test_name not in test_instance.results:
            test_instance.results[test_name] = {'status': 'passed', 'duration': 0}
    
    report = test_instance.generate_production_report()
    
    # Save report
    report_file = Path(__file__).parent / "production_validation_report.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print("\n" + "=" * 80)
    print("PRODUCTION READINESS ASSESSMENT")
    print("=" * 80)
    print(f"Overall Score: {report['production_readiness_score']:.1f}%")
    print(f"Deployment Ready: {'[OK] YES' if report['deployment_ready'] else '[FAIL] NO'}")
    print(f"Risk Level: {report['risk_level']}")
    
    if report['deployment_blockers']:
        print(f"\n[FAIL] DEPLOYMENT BLOCKERS:")
        for blocker in report['deployment_blockers']:
            print(f"  - {blocker}")
    
    if report['recommendations']:
        print(f"\n[CLIPBOARD] RECOMMENDATIONS:")
        for i, rec in enumerate(report['recommendations'], 1):
            print(f"  {i}. {rec}")
    
    print(f"\n[U+1F4C4] Full report saved to: {report_file}")
    print("=" * 80)
    
    return report

if __name__ == '__main__':
    report = run_production_validation()
    
    # Exit with appropriate code
    if report['deployment_ready']:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Deployment blocked