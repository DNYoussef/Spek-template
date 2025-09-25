#!/usr/bin/env python3
"""
YAML Validation Test Suite for Phase 1 Deployment
Tests all workflow files for syntax and GitHub Actions schema compliance
"""

from pathlib import Path
import json
import os
import sys

import yaml

class YAMLValidator:
    def __init__(self, base_path="."):
        self.base_path = Path(base_path)
        self.errors = []
        self.warnings = []
        self.passed = []

    def validate_yaml_syntax(self, file_path):
        """Validate YAML syntax and structure"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                yaml.safe_load(f)
            return True, None
        except yaml.YAMLError as e:
            return False, str(e)
        except Exception as e:
            return False, f"File error: {str(e)}"

    def validate_github_workflow(self, file_path):
        """Validate GitHub Actions workflow structure"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                workflow = yaml.safe_load(f)
            
            issues = []
            
            # Required top-level keys
            required_keys = ['name', 'on', 'jobs']
            for key in required_keys:
                if key not in workflow:
                    issues.append(f"Missing required key: {key}")
            
            # Validate jobs structure
            if 'jobs' in workflow:
                for job_name, job_config in workflow['jobs'].items():
                    if not isinstance(job_config, dict):
                        issues.append(f"Job '{job_name}' must be a dictionary")
                        continue
                    
                    if 'runs-on' not in job_config:
                        issues.append(f"Job '{job_name}' missing 'runs-on'")
                    
                    if 'steps' in job_config:
                        if not isinstance(job_config['steps'], list):
                            issues.append(f"Job '{job_name}' steps must be a list")
            
            return len(issues) == 0, issues
            
        except Exception as e:
            return False, [f"Validation error: {str(e)}"]

    def test_branch_protection_workflow(self):
        """Test branch protection workflow specifically"""
        workflow_path = self.base_path / ".github/workflows/setup-branch-protection.yml"
        
        if not workflow_path.exists():
            return False, "Branch protection workflow not found"
        
        try:
            with open(workflow_path, 'r', encoding='utf-8') as f:
                workflow = yaml.safe_load(f)
            
            issues = []
            
            # Check workflow_dispatch inputs
            if 'on' in workflow and 'workflow_dispatch' in workflow['on']:
                dispatch = workflow['on']['workflow_dispatch']
                if 'inputs' not in dispatch:
                    issues.append("Missing workflow_dispatch inputs")
                else:
                    required_inputs = ['protection_level', 'target_branch']
                    for inp in required_inputs:
                        if inp not in dispatch['inputs']:
                            issues.append(f"Missing input: {inp}")
            
            # Check GitHub script action usage
            jobs = workflow.get('jobs', {})
            found_github_script = False
            for job_name, job_config in jobs.items():
                steps = job_config.get('steps', [])
                for step in steps:
                    if isinstance(step, dict) and step.get('uses', '').startswith('actions/github-script'):
                        found_github_script = True
                        if 'script' not in step.get('with', {}):
                            issues.append("github-script action missing script")
            
            if not found_github_script:
                issues.append("Branch protection logic not found")
            
            return len(issues) == 0, issues
            
        except Exception as e:
            return False, [f"Branch protection test error: {str(e)}"]

    def test_codeowners_syntax(self):
        """Test CODEOWNERS file syntax"""
        codeowners_path = self.base_path / ".github/CODEOWNERS"
        
        if not codeowners_path.exists():
            return False, "CODEOWNERS file not found"
        
        try:
            with open(codeowners_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            issues = []
            
            for line_num, line in enumerate(lines, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                parts = line.split()
                if len(parts) < 2:
                    issues.append(f"Line {line_num}: Invalid format, need pattern and owner")
                    continue
                
                pattern = parts[0]
                owners = parts[1:]
                
                # Validate owner format
                for owner in owners:
                    if not (owner.startswith('@') and ('/' in owner or owner.count('@') == 1)):
                        issues.append(f"Line {line_num}: Invalid owner format '{owner}'")
            
            return len(issues) == 0, issues
            
        except Exception as e:
            return False, [f"CODEOWNERS test error: {str(e)}"]

    def test_working_workflows(self):
        """Test the 5 validated working workflows"""
        working_workflows = [
            "connascence-core-analysis.yml",
            "cache-optimization.yml",
            "performance-monitoring.yml", 
            "mece-duplication-analysis.yml",
            "self-dogfooding.yml"
        ]
        
        results = {}
        
        for workflow in working_workflows:
            workflow_path = self.base_path / ".github/workflows" / workflow
            
            if not workflow_path.exists():
                results[workflow] = {"status": "missing", "issues": ["File not found"]}
                continue
            
            # YAML syntax check
            syntax_ok, syntax_error = self.validate_yaml_syntax(workflow_path)
            if not syntax_ok:
                results[workflow] = {"status": "syntax_error", "issues": [syntax_error]}
                continue
            
            # GitHub workflow structure check
            structure_ok, structure_issues = self.validate_github_workflow(workflow_path)
            if not structure_ok:
                results[workflow] = {"status": "structure_error", "issues": structure_issues}
                continue
            
            results[workflow] = {"status": "valid", "issues": []}
        
        return results

    def run_comprehensive_test(self):
        """Run all validation tests"""
        print("=" * 50)
        
        # Test 1: Branch Protection Workflow
        bp_ok, bp_issues = self.test_branch_protection_workflow()
        if bp_ok:
            print("PASS - Branch protection workflow is valid")
            self.passed.append("Branch Protection Workflow")
        else:
            print("FAIL - Branch protection workflow has issues:")
            for issue in bp_issues:
                print(f"   - {issue}")
            self.errors.extend(bp_issues)
        
        # Test 2: CODEOWNERS File
        co_ok, co_issues = self.test_codeowners_syntax()
        if co_ok:
            print("PASS - CODEOWNERS file is valid")
            self.passed.append("CODEOWNERS File")
        else:
            print("FAIL - CODEOWNERS file has issues:")
            for issue in co_issues:
                print(f"   - {issue}")
            self.errors.extend(co_issues)
        
        # Test 3: Working Workflows
        workflow_results = self.test_working_workflows()
        
        for workflow, result in workflow_results.items():
            if result["status"] == "valid":
                print(f"PASS - {workflow} - Valid")
                self.passed.append(f"Workflow: {workflow}")
            else:
                print(f"FAIL - {workflow} - {result['status']}")
                for issue in result["issues"]:
                    print(f"   - {issue}")
                self.errors.extend([f"{workflow}: {issue}" for issue in result["issues"]])
        
        # Test 4: All Workflow Files YAML Syntax
        workflows_dir = self.base_path / ".github/workflows"
        if workflows_dir.exists():
            yaml_files = list(workflows_dir.glob("*.yml")) + list(workflows_dir.glob("*.yaml"))
            
            for yaml_file in yaml_files:
                syntax_ok, syntax_error = self.validate_yaml_syntax(yaml_file)
                if syntax_ok:
                    print(f"PASS - {yaml_file.name} - Valid YAML")
                else:
                    print(f"FAIL - {yaml_file.name} - YAML Error: {syntax_error}")
                    self.errors.append(f"{yaml_file.name}: {syntax_error}")
        
        return self.generate_report()

    def generate_report(self):
        """Generate comprehensive test report"""
        total_tests = len(self.passed) + len(self.errors)
        success_rate = len(self.passed) / total_tests * 100 if total_tests > 0 else 0
        
        report = {
            "test_summary": {
                "total_components_tested": total_tests,
                "passed": len(self.passed),
                "failed": len(self.errors),
                "success_rate": f"{success_rate:.1f}%"
            },
            "passed_components": self.passed,
            "failed_components": self.errors,
            "phase1_readiness": {
                "ready_for_phase2": len(self.errors) == 0,
                "critical_issues": len([e for e in self.errors if "syntax" in e.lower() or "missing" in e.lower()]),
                "deployment_recommendation": "PROCEED" if len(self.errors) == 0 else "FIX_REQUIRED"
            }
        }
        
        return report

if __name__ == "__main__":
    validator = YAMLValidator()
    report = validator.run_comprehensive_test()
    
    print("\n" + "=" * 50)
    print("=" * 50)
    
    if report['phase1_readiness']['ready_for_phase2']:
        print("\nPHASE 1 READY FOR DEPLOYMENT")
        print("PASS - All critical components validated")
        print("PASS - Phase 2 can proceed safely")
    else:
        print("\nPHASE 1 REQUIRES FIXES")
        print(f"FAIL - {report['phase1_readiness']['critical_issues']} critical issues found")
        print("WARNING - Fix required before Phase 2")
    
    # Save detailed report
    with open("tests/phase1_validation_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    sys.exit(0 if report['phase1_readiness']['ready_for_phase2'] else 1)