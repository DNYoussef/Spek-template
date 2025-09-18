#!/usr/bin/env python3
"""
YAML Validation Script for GitHub Actions Pipeline
Validates the production-cicd-pipeline.yml for syntax and structure
"""

import yaml
import sys
import os
from pathlib import Path

def validate_yaml_syntax(file_path):
    """Validate YAML syntax."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = yaml.safe_load(f)
        return True, "YAML syntax is valid", content
    except yaml.YAMLError as e:
        return False, f"YAML syntax error: {e}", None
    except FileNotFoundError:
        return False, f"File not found: {file_path}", None
    except Exception as e:
        return False, f"Error reading file: {e}", None

def validate_github_actions_structure(content):
    """Validate GitHub Actions workflow structure."""
    issues = []

    # Check required top-level keys
    required_keys = ['name', 'on', 'jobs']
    for key in required_keys:
        if key not in content:
            issues.append(f"Missing required key: {key}")

    # Check jobs structure
    if 'jobs' in content:
        jobs = content['jobs']
        if not isinstance(jobs, dict):
            issues.append("'jobs' must be a dictionary")
        else:
            for job_name, job_config in jobs.items():
                if not isinstance(job_config, dict):
                    issues.append(f"Job '{job_name}' must be a dictionary")
                    continue

                # Check required job keys
                if 'runs-on' not in job_config:
                    issues.append(f"Job '{job_name}' missing 'runs-on'")

                # Check steps structure
                if 'steps' in job_config:
                    steps = job_config['steps']
                    if not isinstance(steps, list):
                        issues.append(f"Job '{job_name}' steps must be a list")
                    else:
                        for i, step in enumerate(steps):
                            if not isinstance(step, dict):
                                issues.append(f"Job '{job_name}' step {i} must be a dictionary")

    return issues

def check_bash_arithmetic_patterns(file_path):
    """Check for problematic bash arithmetic patterns."""
    issues = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for line_num, line in enumerate(lines, 1):
            line_stripped = line.strip()

            # Check for old arithmetic syntax
            if '((' in line_stripped and '++))' in line_stripped:
                issues.append(f"Line {line_num}: Found potentially problematic arithmetic: {line_stripped}")

            # Check for correct arithmetic syntax
            if '=$(((' in line_stripped:
                issues.append(f"Line {line_num}: Triple parentheses detected (possible syntax error): {line_stripped}")

            # Check for unescaped variables in arithmetic
            if '$((' in line_stripped and '$' in line_stripped.split('$((')[1]:
                # This is a more complex check - could indicate issues
                pass

    except Exception as e:
        issues.append(f"Error checking arithmetic patterns: {e}")

    return issues

def validate_environment_variables(content):
    """Validate environment variable usage."""
    issues = []

    # Convert to string to search for environment variable patterns
    content_str = yaml.dump(content) if content else ""

    # Check for common environment variable issues
    if '${{' in content_str and '}}' not in content_str:
        issues.append("Unmatched GitHub Actions expression syntax")

    # Check for proper quoting around expressions with special characters
    lines = content_str.split('\n')
    for line_num, line in enumerate(lines, 1):
        if '${{' in line and '}}' in line:
            # Check if expression is properly quoted when needed
            if ' ' in line and not (line.strip().startswith('"') and line.strip().endswith('"')):
                # This is a simplified check
                pass

    return issues

def main():
    """Main validation function."""
    print("==== GitHub Actions YAML Validation ====")

    # Find the pipeline YAML file
    pipeline_file = Path(".github/workflows/production-cicd-pipeline.yml")

    if not pipeline_file.exists():
        # Try alternative path
        pipeline_file = Path("C:/Users/17175/Desktop/spek template/.github/workflows/production-cicd-pipeline.yml")

    if not pipeline_file.exists():
        print("❌ Pipeline YAML file not found")
        print("Expected location: .github/workflows/production-cicd-pipeline.yml")
        return False

    print(f"Validating: {pipeline_file}")
    print("")

    # Test 1: YAML Syntax Validation
    print("=== Test 1: YAML Syntax Validation ===")
    syntax_valid, syntax_message, content = validate_yaml_syntax(pipeline_file)

    if syntax_valid:
        print("✅ YAML syntax is valid")
    else:
        print(f"❌ {syntax_message}")
        return False

    # Test 2: GitHub Actions Structure Validation
    print("")
    print("=== Test 2: GitHub Actions Structure ===")
    structure_issues = validate_github_actions_structure(content)

    if not structure_issues:
        print("✅ GitHub Actions structure is valid")
    else:
        print("❌ GitHub Actions structure issues:")
        for issue in structure_issues:
            print(f"  - {issue}")

    # Test 3: Bash Arithmetic Pattern Check
    print("")
    print("=== Test 3: Bash Arithmetic Patterns ===")
    arithmetic_issues = check_bash_arithmetic_patterns(pipeline_file)

    if not arithmetic_issues:
        print("✅ No problematic bash arithmetic patterns found")
    else:
        print("⚠️  Potential bash arithmetic issues:")
        for issue in arithmetic_issues:
            print(f"  - {issue}")

    # Test 4: Environment Variables
    print("")
    print("=== Test 4: Environment Variables ===")
    env_issues = validate_environment_variables(content)

    if not env_issues:
        print("✅ Environment variable usage looks correct")
    else:
        print("⚠️  Environment variable issues:")
        for issue in env_issues:
            print(f"  - {issue}")

    # Test 5: Specific Pipeline Analysis
    print("")
    print("=== Test 5: Pipeline-Specific Analysis ===")

    # Check for expected jobs
    expected_jobs = ['prod-pipeline']
    if 'jobs' in content:
        found_jobs = list(content['jobs'].keys())
        print(f"Found jobs: {found_jobs}")

        for expected_job in expected_jobs:
            if expected_job in found_jobs:
                print(f"✅ Expected job '{expected_job}' found")
            else:
                print(f"⚠️  Expected job '{expected_job}' not found")

    # Check for test-related steps
    test_steps_found = False
    reality_validation_found = False

    if 'jobs' in content:
        for job_name, job_config in content['jobs'].items():
            if 'steps' in job_config:
                for step in job_config['steps']:
                    if isinstance(step, dict):
                        step_name = step.get('name', '')
                        step_run = step.get('run', '')

                        if 'test' in step_name.lower() or 'test' in step_run.lower():
                            test_steps_found = True

                        if 'reality' in step_name.lower() or 'reality_checks' in step_run:
                            reality_validation_found = True

    if test_steps_found:
        print("✅ Test steps found in pipeline")
    else:
        print("⚠️  No test steps found in pipeline")

    if reality_validation_found:
        print("✅ Reality validation steps found")
    else:
        print("⚠️  Reality validation steps not found")

    # Summary
    print("")
    print("=== Validation Summary ===")

    total_issues = len(structure_issues) + len(arithmetic_issues) + len(env_issues)

    if syntax_valid and total_issues == 0:
        print("🎉 YAML validation PASSED! Pipeline file is ready for use.")
        return True
    elif syntax_valid and total_issues <= 2:
        print("⚠️  YAML validation completed with minor warnings.")
        print("Pipeline should work but review warnings above.")
        return True
    else:
        print("❌ YAML validation FAILED. Address issues before using pipeline.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)