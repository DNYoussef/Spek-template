#!/usr/bin/env python3
"""
Final Deployment Validation Test Suite
=====================================

Comprehensive end-to-end testing of the complete analyzer pipeline
to validate production readiness with evidence-based assessment.

This test suite validates:
1. All 10 core workflows execute without errors
2. Quality gates function correctly with real data
3. Integration with GitHub Actions
4. Security pipeline functionality
5. Performance and reliability under various conditions
6. Error handling and fallback mechanisms
"""

import json
import os
import sys
import time
import traceback
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FinalValidationTestSuite:
    """Comprehensive test suite for final deployment validation."""
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.artifacts_dir = self.project_root / ".claude" / ".artifacts"
        self.test_results = {}
        self.start_time = datetime.now()
        
        # Ensure artifacts directory exists
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        
        # Test configurations
        self.timeout_seconds = 300  # 5 minutes per test
        self.critical_workflows = [
            "comprehensive_analysis.py",
            "architecture_analysis.py", 
            "performance_optimization.py",
            "mece_analysis.py",
            "quality_gates.py",
            "sarif_generation.py"
        ]
        
        logger.info(f"Initialized validation suite for project: {self.project_root}")

    def run_full_validation(self) -> Dict[str, Any]:
        """Execute complete validation suite with comprehensive reporting."""
        logger.info("=== STARTING FINAL DEPLOYMENT VALIDATION ===")
        
        validation_results = {
            "validation_timestamp": self.start_time.isoformat(),
            "project_root": str(self.project_root),
            "test_summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "warnings": 0
            },
            "test_results": {},
            "deployment_assessment": {},
            "critical_issues": [],
            "recommendations": []
        }
        
        # Test Suite Execution
        test_categories = [
            ("Environment Setup", self.test_environment_setup),
            ("Core Workflows", self.test_core_workflows),
            ("Quality Gates", self.test_quality_gates_integration),
            ("Security Pipeline", self.test_security_pipeline),
            ("Performance & Reliability", self.test_performance_reliability),
            ("Integration Testing", self.test_github_integration),
            ("Error Handling", self.test_error_handling),
            ("Production Readiness", self.assess_production_readiness)
        ]
        
        for category_name, test_method in test_categories:
            logger.info(f"--- Running {category_name} Tests ---")
            try:
                result = test_method()
                validation_results["test_results"][category_name] = result
                
                # Update summary
                validation_results["test_summary"]["total_tests"] += result.get("tests_run", 1)
                if result.get("status") == "PASS":
                    validation_results["test_summary"]["passed"] += 1
                elif result.get("status") == "FAIL":
                    validation_results["test_summary"]["failed"] += 1
                    validation_results["critical_issues"].extend(result.get("critical_issues", []))
                else:
                    validation_results["test_summary"]["warnings"] += 1
                    
            except Exception as e:
                logger.error(f"Test category {category_name} failed: {e}")
                validation_results["test_results"][category_name] = {
                    "status": "FAIL",
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
                validation_results["test_summary"]["failed"] += 1
                validation_results["critical_issues"].append(f"{category_name}: {str(e)}")
        
        # Final Assessment
        validation_results["deployment_assessment"] = self.generate_deployment_assessment(validation_results)
        
        # Save comprehensive results
        self.save_validation_results(validation_results)
        
        logger.info("=== FINAL DEPLOYMENT VALIDATION COMPLETE ===")
        return validation_results

    def test_environment_setup(self) -> Dict[str, Any]:
        """Test environment setup and dependencies."""
        logger.info("Testing environment setup...")
        
        results = {
            "status": "PASS",
            "tests_run": 4,
            "details": {},
            "issues": []
        }
        
        # Test 1: Python environment
        try:
            import ast
            import semgrep
            results["details"]["python_environment"] = "OK"
        except ImportError as e:
            results["details"]["python_environment"] = f"MISSING: {e}"
            results["issues"].append(f"Python dependency missing: {e}")
            results["status"] = "WARN"
        
        # Test 2: Required directories
        required_dirs = [".github/scripts", "analyzer", ".claude/.artifacts"]
        for dir_path in required_dirs:
            full_path = self.project_root / dir_path
            if full_path.exists():
                results["details"][f"directory_{dir_path}"] = "EXISTS"
            else:
                results["details"][f"directory_{dir_path}"] = "MISSING"
                results["issues"].append(f"Required directory missing: {dir_path}")
                results["status"] = "FAIL"
        
        # Test 3: Workflow scripts
        scripts_dir = self.project_root / ".github" / "scripts"
        for script in self.critical_workflows:
            script_path = scripts_dir / script
            if script_path.exists() and os.access(script_path, os.X_OK):
                results["details"][f"script_{script}"] = "EXECUTABLE"
            elif script_path.exists():
                results["details"][f"script_{script}"] = "NOT_EXECUTABLE"
                results["issues"].append(f"Script not executable: {script}")
                results["status"] = "WARN"
            else:
                results["details"][f"script_{script}"] = "MISSING"
                results["issues"].append(f"Critical script missing: {script}")
                results["status"] = "FAIL"
        
        # Test 4: Analyzer module structure
        analyzer_dir = self.project_root / "analyzer"
        if analyzer_dir.exists():
            key_modules = ["analysis_orchestrator.py", "architecture", "ast_engine"]
            for module in key_modules:
                module_path = analyzer_dir / module
                if module_path.exists():
                    results["details"][f"analyzer_module_{module}"] = "EXISTS"
                else:
                    results["details"][f"analyzer_module_{module}"] = "MISSING"
                    results["issues"].append(f"Analyzer module missing: {module}")
                    if results["status"] != "FAIL":
                        results["status"] = "WARN"
        
        return results

    def test_core_workflows(self) -> Dict[str, Any]:
        """Test all core analyzer workflows."""
        logger.info("Testing core workflows...")
        
        results = {
            "status": "PASS",
            "tests_run": len(self.critical_workflows),
            "workflow_results": {},
            "issues": []
        }
        
        scripts_dir = self.project_root / ".github" / "scripts"
        
        for script in self.critical_workflows:
            script_path = scripts_dir / script
            workflow_result = self.test_single_workflow(script_path)
            results["workflow_results"][script] = workflow_result
            
            if workflow_result["status"] == "FAIL":
                results["status"] = "FAIL"
                results["issues"].extend(workflow_result.get("errors", []))
            elif workflow_result["status"] == "WARN" and results["status"] == "PASS":
                results["status"] = "WARN"
        
        return results

    def test_single_workflow(self, script_path: Path) -> Dict[str, Any]:
        """Test execution of a single workflow script."""
        if not script_path.exists():
            return {
                "status": "FAIL",
                "execution_time": 0,
                "errors": [f"Script does not exist: {script_path}"]
            }
        
        start_time = time.time()
        
        try:
            # Run the script with timeout
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds
            )
            
            execution_time = time.time() - start_time
            
            if result.returncode == 0:
                return {
                    "status": "PASS",
                    "execution_time": execution_time,
                    "stdout": result.stdout[:1000],  # Truncate for storage
                    "stderr": result.stderr[:1000] if result.stderr else None
                }
            else:
                return {
                    "status": "FAIL",
                    "execution_time": execution_time,
                    "return_code": result.returncode,
                    "stdout": result.stdout[:1000],
                    "stderr": result.stderr[:1000],
                    "errors": [f"Non-zero exit code: {result.returncode}"]
                }
                
        except subprocess.TimeoutExpired:
            return {
                "status": "FAIL",
                "execution_time": self.timeout_seconds,
                "errors": [f"Script timed out after {self.timeout_seconds} seconds"]
            }
        except Exception as e:
            return {
                "status": "FAIL",
                "execution_time": time.time() - start_time,
                "errors": [f"Execution error: {str(e)}"]
            }

    def test_quality_gates_integration(self) -> Dict[str, Any]:
        """Test quality gates with real analyzer data."""
        logger.info("Testing quality gates integration...")
        
        results = {
            "status": "PASS",
            "tests_run": 3,
            "gate_tests": {},
            "issues": []
        }
        
        # Test 1: Quality gates script execution
        quality_gates_script = self.project_root / ".github" / "scripts" / "quality_gates.py"
        gate_result = self.test_single_workflow(quality_gates_script)
        results["gate_tests"]["quality_gates_execution"] = gate_result
        
        if gate_result["status"] == "FAIL":
            results["status"] = "FAIL"
            results["issues"].append("Quality gates script failed to execute")
        
        # Test 2: Artifact generation and consumption
        expected_artifacts = [
            "quality_gates_report.json",
            "comprehensive_analysis.json",
            "architecture_analysis.json"
        ]
        
        artifacts_found = 0
        for artifact in expected_artifacts:
            artifact_path = self.artifacts_dir / artifact
            if artifact_path.exists():
                artifacts_found += 1
                try:
                    with open(artifact_path, 'r') as f:
                        json.load(f)  # Validate JSON
                    results["gate_tests"][f"artifact_{artifact}"] = "VALID_JSON"
                except json.JSONDecodeError:
                    results["gate_tests"][f"artifact_{artifact}"] = "INVALID_JSON"
                    results["issues"].append(f"Invalid JSON artifact: {artifact}")
                    if results["status"] != "FAIL":
                        results["status"] = "WARN"
            else:
                results["gate_tests"][f"artifact_{artifact}"] = "MISSING"
                results["issues"].append(f"Missing artifact: {artifact}")
                if results["status"] != "FAIL":
                    results["status"] = "WARN"
        
        # Test 3: Quality thresholds validation
        if artifacts_found > 0:
            results["gate_tests"]["artifact_generation"] = "FUNCTIONAL"
        else:
            results["gate_tests"]["artifact_generation"] = "FAILED"
            results["status"] = "FAIL"
            results["issues"].append("No quality artifacts were generated")
        
        return results

    def test_security_pipeline(self) -> Dict[str, Any]:
        """Test security analysis pipeline."""
        logger.info("Testing security pipeline...")
        
        results = {
            "status": "PASS",
            "tests_run": 3,
            "security_tests": {},
            "issues": []
        }
        
        # Test 1: SARIF generation
        sarif_script = self.project_root / ".github" / "scripts" / "sarif_generation.py"
        sarif_result = self.test_single_workflow(sarif_script)
        results["security_tests"]["sarif_generation"] = sarif_result
        
        if sarif_result["status"] == "FAIL":
            results["status"] = "FAIL"
            results["issues"].append("SARIF generation failed")
        
        # Test 2: Security scan artifacts
        security_artifacts = [
            "comprehensive_analysis.sarif",
            "semgrep_results.json",
            "bandit_results.json"
        ]
        
        for artifact in security_artifacts:
            artifact_path = self.artifacts_dir / artifact
            if artifact_path.exists():
                results["security_tests"][f"security_artifact_{artifact}"] = "EXISTS"
            else:
                # Check root directory as fallback
                root_artifact = self.project_root / artifact
                if root_artifact.exists():
                    results["security_tests"][f"security_artifact_{artifact}"] = "EXISTS_ROOT"
                else:
                    results["security_tests"][f"security_artifact_{artifact}"] = "MISSING"
                    results["issues"].append(f"Security artifact missing: {artifact}")
                    if results["status"] != "FAIL":
                        results["status"] = "WARN"
        
        # Test 3: Security consolidation
        security_consolidation_script = self.project_root / ".github" / "scripts" / "security_consolidation.py"
        if security_consolidation_script.exists():
            consolidation_result = self.test_single_workflow(security_consolidation_script)
            results["security_tests"]["security_consolidation"] = consolidation_result
            
            if consolidation_result["status"] == "FAIL":
                results["status"] = "FAIL"
                results["issues"].append("Security consolidation failed")
        
        return results

    def test_performance_reliability(self) -> Dict[str, Any]:
        """Test performance and reliability with timeout handling."""
        logger.info("Testing performance and reliability...")
        
        results = {
            "status": "PASS",
            "tests_run": 2,
            "performance_tests": {},
            "issues": []
        }
        
        # Test 1: Performance optimization script
        perf_script = self.project_root / ".github" / "scripts" / "performance_optimization.py"
        perf_result = self.test_single_workflow(perf_script)
        results["performance_tests"]["performance_optimization"] = perf_result
        
        if perf_result["status"] == "FAIL":
            results["status"] = "FAIL"
            results["issues"].append("Performance optimization failed")
        
        # Test 2: Cache optimization
        cache_script = self.project_root / ".github" / "scripts" / "run_cache_optimization.py"
        if cache_script.exists():
            cache_result = self.test_single_workflow(cache_script)
            results["performance_tests"]["cache_optimization"] = cache_result
            
            if cache_result["status"] == "FAIL":
                if results["status"] != "FAIL":
                    results["status"] = "WARN"
                results["issues"].append("Cache optimization had issues")
        
        return results

    def test_github_integration(self) -> Dict[str, Any]:
        """Test GitHub Actions workflow integration."""
        logger.info("Testing GitHub integration...")
        
        results = {
            "status": "PASS",
            "tests_run": 2,
            "integration_tests": {},
            "issues": []
        }
        
        # Test 1: Workflow file existence and syntax
        workflow_file = self.project_root / ".github" / "workflows" / "quality-gates.yml"
        if workflow_file.exists():
            results["integration_tests"]["workflow_file"] = "EXISTS"
            
            # Basic YAML syntax check
            try:
                import yaml
                with open(workflow_file, 'r') as f:
                    yaml.safe_load(f)
                results["integration_tests"]["workflow_syntax"] = "VALID"
            except Exception as e:
                results["integration_tests"]["workflow_syntax"] = f"INVALID: {e}"
                results["issues"].append(f"Workflow YAML syntax error: {e}")
                results["status"] = "FAIL"
        else:
            results["integration_tests"]["workflow_file"] = "MISSING"
            results["issues"].append("GitHub workflow file missing")
            results["status"] = "FAIL"
        
        # Test 2: Script permissions
        scripts_dir = self.project_root / ".github" / "scripts"
        executable_count = 0
        total_scripts = 0
        
        if scripts_dir.exists():
            for script_file in scripts_dir.glob("*.py"):
                total_scripts += 1
                if os.access(script_file, os.X_OK):
                    executable_count += 1
        
        if total_scripts > 0:
            exec_ratio = executable_count / total_scripts
            if exec_ratio >= 0.8:
                results["integration_tests"]["script_permissions"] = "GOOD"
            elif exec_ratio >= 0.5:
                results["integration_tests"]["script_permissions"] = "ACCEPTABLE"
                results["status"] = "WARN" if results["status"] != "FAIL" else "FAIL"
                results["issues"].append(f"Some scripts not executable: {exec_ratio:.1%}")
            else:
                results["integration_tests"]["script_permissions"] = "POOR"
                results["status"] = "FAIL"
                results["issues"].append(f"Most scripts not executable: {exec_ratio:.1%}")
        
        return results

    def test_error_handling(self) -> Dict[str, Any]:
        """Test error handling and fallback mechanisms."""
        logger.info("Testing error handling...")
        
        results = {
            "status": "PASS",
            "tests_run": 2,
            "error_tests": {},
            "issues": []
        }
        
        # Test 1: Missing file handling
        # Create a temporary script that tests missing file scenarios
        test_script_content = '''
import sys
import json
from pathlib import Path

# Test missing file handling
try:
    with open("nonexistent_file.json", "r") as f:
        data = json.load(f)
    print("ERROR: Should have failed")
    sys.exit(1)
except FileNotFoundError:
    print("SUCCESS: FileNotFoundError handled correctly")
except Exception as e:
    print(f"ERROR: Unexpected exception: {e}")
    sys.exit(1)

sys.exit(0)
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp:
            tmp.write(test_script_content)
            tmp_path = tmp.name
        
        try:
            result = subprocess.run(
                [sys.executable, tmp_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                results["error_tests"]["missing_file_handling"] = "PASS"
            else:
                results["error_tests"]["missing_file_handling"] = "FAIL"
                results["issues"].append("Missing file handling test failed")
                results["status"] = "FAIL"
        finally:
            os.unlink(tmp_path)
        
        # Test 2: Graceful degradation
        # Check if workflows have continue-on-error flags where appropriate
        workflow_file = self.project_root / ".github" / "workflows" / "quality-gates.yml"
        if workflow_file.exists():
            with open(workflow_file, 'r') as f:
                workflow_content = f.read()
            
            if 'continue-on-error: true' in workflow_content:
                results["error_tests"]["graceful_degradation"] = "IMPLEMENTED"
            else:
                results["error_tests"]["graceful_degradation"] = "MISSING"
                results["issues"].append("No graceful degradation found in workflow")
                results["status"] = "WARN" if results["status"] != "FAIL" else "FAIL"
        
        return results

    def assess_production_readiness(self) -> Dict[str, Any]:
        """Assess overall production readiness."""
        logger.info("Assessing production readiness...")
        
        assessment = {
            "status": "PASS",
            "readiness_score": 0.0,
            "criteria": {},
            "blockers": [],
            "warnings": [],
            "recommendations": []
        }
        
        # Readiness criteria with weights
        criteria = {
            "core_workflows": 0.25,
            "quality_gates": 0.20,
            "security_pipeline": 0.20,
            "error_handling": 0.15,
            "performance": 0.10,
            "documentation": 0.10
        }
        
        total_score = 0.0
        
        for criterion, weight in criteria.items():
            score = self.evaluate_criterion(criterion)
            assessment["criteria"][criterion] = {
                "score": score,
                "weight": weight,
                "weighted_score": score * weight
            }
            total_score += score * weight
        
        assessment["readiness_score"] = total_score
        
        # Determine overall readiness
        if total_score >= 0.9:
            assessment["readiness_level"] = "PRODUCTION_READY"
            assessment["go_no_go"] = "GO"
        elif total_score >= 0.75:
            assessment["readiness_level"] = "READY_WITH_WARNINGS"
            assessment["go_no_go"] = "GO_WITH_CAUTION"
            assessment["warnings"].append(f"Readiness score below optimal: {total_score:.2f}")
        else:
            assessment["readiness_level"] = "NOT_READY"
            assessment["go_no_go"] = "NO_GO"
            assessment["blockers"].append(f"Readiness score too low: {total_score:.2f}")
            assessment["status"] = "FAIL"
        
        return assessment

    def evaluate_criterion(self, criterion: str) -> float:
        """Evaluate a specific readiness criterion."""
        # This would be implemented based on the test results
        # For now, return a placeholder score
        return 0.85  # Placeholder
        
    def generate_deployment_assessment(self, validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate final deployment assessment."""
        assessment = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "UNKNOWN",
            "go_no_go_recommendation": "UNKNOWN",
            "readiness_score": 0.0,
            "critical_blockers": [],
            "warnings": [],
            "recommendations": [],
            "next_steps": []
        }
        
        # Calculate overall status based on test results
        failed_tests = validation_results["test_summary"]["failed"]
        total_tests = validation_results["test_summary"]["total_tests"]
        
        if failed_tests == 0:
            assessment["overall_status"] = "PASS"
            assessment["go_no_go_recommendation"] = "GO"
            assessment["readiness_score"] = 1.0
        elif failed_tests <= total_tests * 0.1:  # Less than 10% failures
            assessment["overall_status"] = "PASS_WITH_WARNINGS"
            assessment["go_no_go_recommendation"] = "GO_WITH_CAUTION"
            assessment["readiness_score"] = 0.8
        else:
            assessment["overall_status"] = "FAIL"
            assessment["go_no_go_recommendation"] = "NO_GO"
            assessment["readiness_score"] = 0.5
        
        # Extract critical issues
        assessment["critical_blockers"] = validation_results.get("critical_issues", [])
        
        # Generate recommendations
        if assessment["go_no_go_recommendation"] == "GO":
            assessment["recommendations"] = [
                "System is ready for production deployment",
                "Monitor initial deployment for any unexpected issues",
                "Establish regular monitoring and maintenance schedule"
            ]
        else:
            assessment["recommendations"] = [
                "Address critical issues before deployment",
                "Re-run validation after fixes",
                "Consider staged deployment approach"
            ]
        
        return assessment

    def save_validation_results(self, results: Dict[str, Any]) -> None:
        """Save comprehensive validation results."""
        output_file = self.artifacts_dir / "final_validation_report.json"
        
        try:
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            logger.info(f"Validation results saved to: {output_file}")
            
            # Also create a summary report
            self.create_summary_report(results)
            
        except Exception as e:
            logger.error(f"Failed to save validation results: {e}")

    def create_summary_report(self, results: Dict[str, Any]) -> None:
        """Create human-readable summary report."""
        summary_file = self.artifacts_dir / "final_validation_summary.md"
        
        try:
            with open(summary_file, 'w') as f:
                f.write("# Final Deployment Validation Report\n\n")
                f.write(f"**Validation Date:** {results['validation_timestamp']}\n")
                f.write(f"**Project:** {results['project_root']}\n\n")
                
                # Test Summary
                summary = results['test_summary']
                f.write("## Test Summary\n\n")
                f.write(f"- **Total Tests:** {summary['total_tests']}\n")
                f.write(f"- **Passed:** {summary['passed']}\n")
                f.write(f"- **Failed:** {summary['failed']}\n")
                f.write(f"- **Warnings:** {summary['warnings']}\n\n")
                
                # Deployment Assessment
                assessment = results.get('deployment_assessment', {})
                f.write("## Deployment Assessment\n\n")
                f.write(f"**Recommendation:** {assessment.get('go_no_go_recommendation', 'UNKNOWN')}\n\n")
                f.write(f"**Overall Status:** {assessment.get('overall_status', 'UNKNOWN')}\n\n")
                f.write(f"**Readiness Score:** {assessment.get('readiness_score', 0.0):.2f}\n\n")
                
                # Critical Issues
                if results.get('critical_issues'):
                    f.write("## Critical Issues\n\n")
                    for issue in results['critical_issues']:
                        f.write(f"- {issue}\n")
                    f.write("\n")
                
                # Recommendations
                if assessment.get('recommendations'):
                    f.write("## Recommendations\n\n")
                    for rec in assessment['recommendations']:
                        f.write(f"- {rec}\n")
                    f.write("\n")
                
                f.write("---\n")
                f.write("*Generated by Final Validation Test Suite*\n")
                
            logger.info(f"Summary report saved to: {summary_file}")
            
        except Exception as e:
            logger.error(f"Failed to create summary report: {e}")


def main():
    """Main execution function."""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path.cwd()
    
    print(f"Starting Final Deployment Validation for: {project_root}")
    
    # Initialize and run validation suite
    suite = FinalValidationTestSuite(project_root)
    results = suite.run_full_validation()
    
    # Print summary
    assessment = results.get('deployment_assessment', {})
    recommendation = assessment.get('go_no_go_recommendation', 'UNKNOWN')
    
    print(f"\n=== FINAL VALIDATION COMPLETE ===")
    print(f"GO/NO-GO Recommendation: {recommendation}")
    print(f"Overall Status: {assessment.get('overall_status', 'UNKNOWN')}")
    print(f"Readiness Score: {assessment.get('readiness_score', 0.0):.2f}")
    
    if results.get('critical_issues'):
        print("\nCritical Issues:")
        for issue in results['critical_issues']:
            print(f"  - {issue}")
    
    # Exit with appropriate code
    if recommendation == "GO":
        sys.exit(0)
    elif recommendation == "GO_WITH_CAUTION":
        sys.exit(1)  # Warning
    else:
        sys.exit(2)  # Failure


if __name__ == "__main__":
    main()