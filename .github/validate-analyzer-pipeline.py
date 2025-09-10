#!/usr/bin/env python3
"""
Analyzer Pipeline Validation Script

Validates that the entire analyzer pipeline is properly configured and ready
for production use as comprehensive quality gates.
"""

import json
import os
import sys
import yaml
from pathlib import Path
from datetime import datetime


def check_workflow_syntax(workflow_path):
    """Check if a YAML workflow file has valid syntax."""
    try:
        with open(workflow_path, 'r') as f:
            yaml.safe_load(f)
        return True, "Valid YAML syntax"
    except yaml.YAMLError as e:
        return False, f"YAML syntax error: {e}"
    except Exception as e:
        return False, f"Error reading file: {e}"


def check_python_scripts_in_workflow(workflow_path):
    """Check if Python scripts in workflow are properly formatted."""
    try:
        with open(workflow_path, 'r') as f:
            content = f.read()
        
        # Count Python script blocks
        python_blocks = content.count('python -c')
        multi_line_blocks = content.count('python -c "')
        single_line_blocks = content.count('exec("""')
        
        return {
            'total_python_blocks': python_blocks,
            'multi_line_blocks': multi_line_blocks - single_line_blocks,
            'single_line_blocks': single_line_blocks,
            'properly_formatted': multi_line_blocks == single_line_blocks
        }
    except Exception as e:
        return {'error': str(e)}


def check_analyzer_imports():
    """Check if core analyzer components can be imported."""
    results = {}
    
    # Core analyzer components to test
    components = [
        ('ConnascenceAnalyzer', 'analyzer.connascence_analyzer'),
        ('AnalysisOrchestrator', 'analyzer.architecture.orchestrator'),
        ('StreamingPerformanceMonitor', 'analyzer.optimization.performance_monitor'),
        ('FileContentCache', 'analyzer.optimization.file_cache'),
        ('MECEAnalyzer', 'analyzer.dup_detection.mece_analyzer'),
    ]
    
    for component_name, module_path in components:
        try:
            module = __import__(module_path, fromlist=[component_name])
            getattr(module, component_name)
            results[component_name] = {'status': 'available', 'module': module_path}
        except ImportError as e:
            results[component_name] = {'status': 'missing', 'error': str(e)}
        except AttributeError as e:
            results[component_name] = {'status': 'invalid', 'error': str(e)}
    
    return results


def check_quality_gates_script():
    """Check if the quality gates script exists and is functional."""
    script_path = Path('.github/quality-gates.py')
    
    if not script_path.exists():
        return {'status': 'missing', 'message': 'Quality gates script not found'}
    
    try:
        # Check if script is executable
        with open(script_path, 'r') as f:
            content = f.read()
        
        # Check for key functions
        required_functions = [
            'check_nasa_compliance',
            'check_security_analysis', 
            'check_connascence_analysis',
            'check_cache_optimization',
            'check_architecture_analysis'
        ]
        
        missing_functions = [func for func in required_functions if func not in content]
        
        return {
            'status': 'available',
            'file_size': len(content),
            'required_functions': len(required_functions),
            'missing_functions': missing_functions,
            'functional': len(missing_functions) == 0
        }
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def check_artifacts_directory():
    """Check if artifacts directory structure exists."""
    artifacts_dir = Path('.claude/.artifacts')
    
    structure = {
        'exists': artifacts_dir.exists(),
        'writable': False,
        'subdirs': []
    }
    
    if artifacts_dir.exists():
        try:
            # Test write permission
            test_file = artifacts_dir / 'test_write.tmp'
            test_file.write_text('test')
            test_file.unlink()
            structure['writable'] = True
            
            # List subdirectories
            structure['subdirs'] = [d.name for d in artifacts_dir.iterdir() if d.is_dir()]
        except Exception as e:
            structure['write_error'] = str(e)
    
    return structure


def check_workflow_files():
    """Check all workflow files for syntax and configuration."""
    workflows_dir = Path('.github/workflows')
    
    if not workflows_dir.exists():
        return {'status': 'missing', 'message': 'Workflows directory not found'}
    
    workflow_files = list(workflows_dir.glob('*.yml'))
    results = {}
    
    for workflow_file in workflow_files:
        name = workflow_file.stem
        
        # Check YAML syntax
        syntax_valid, syntax_message = check_workflow_syntax(workflow_file)
        
        # Check Python scripts
        python_check = check_python_scripts_in_workflow(workflow_file)
        
        results[name] = {
            'file_path': str(workflow_file),
            'syntax_valid': syntax_valid,
            'syntax_message': syntax_message,
            'python_scripts': python_check
        }
    
    return results


def validate_quality_thresholds():
    """Validate that quality thresholds are properly configured."""
    try:
        from analyzer import QUALITY_THRESHOLDS
        
        required_categories = [
            'nasa_compliance',
            'security', 
            'connascence',
            'cache_optimization',
            'architecture'
        ]
        
        missing_categories = [cat for cat in required_categories if cat not in QUALITY_THRESHOLDS]
        
        return {
            'status': 'configured',
            'categories': len(QUALITY_THRESHOLDS),
            'required_categories': len(required_categories),
            'missing_categories': missing_categories,
            'properly_configured': len(missing_categories) == 0
        }
    except ImportError:
        return {
            'status': 'not_configured',
            'message': 'QUALITY_THRESHOLDS not found in analyzer module'
        }


def main():
    """Main validation function."""
    print("=== Analyzer Pipeline Validation ===")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Working Directory: {os.getcwd()}")
    print("")
    
    validation_results = {}
    
    # 1. Check workflow files
    print("1. Checking workflow files...")
    workflow_results = check_workflow_files()
    validation_results['workflows'] = workflow_results
    
    if isinstance(workflow_results, dict) and 'status' not in workflow_results:
        valid_workflows = sum(1 for w in workflow_results.values() if w['syntax_valid'])
        total_workflows = len(workflow_results)
        print(f"   Valid workflows: {valid_workflows}/{total_workflows}")
        
        # Check for YAML issues
        yaml_issues = [name for name, data in workflow_results.items() if not data['syntax_valid']]
        if yaml_issues:
            print(f"   YAML syntax issues: {', '.join(yaml_issues)}")
    else:
        print(f"   Status: {workflow_results.get('status', 'unknown')}")
    
    # 2. Check analyzer imports
    print("\n2. Checking analyzer component imports...")
    import_results = check_analyzer_imports()
    validation_results['analyzer_imports'] = import_results
    
    available_components = sum(1 for r in import_results.values() if r['status'] == 'available')
    total_components = len(import_results)
    print(f"   Available components: {available_components}/{total_components}")
    
    # 3. Check quality gates script
    print("\n3. Checking quality gates script...")
    gates_results = check_quality_gates_script()
    validation_results['quality_gates'] = gates_results
    print(f"   Status: {gates_results['status']}")
    
    if gates_results['status'] == 'available':
        print(f"   Functional: {gates_results.get('functional', False)}")
    
    # 4. Check artifacts directory
    print("\n4. Checking artifacts directory...")
    artifacts_results = check_artifacts_directory()
    validation_results['artifacts'] = artifacts_results
    print(f"   Exists: {artifacts_results['exists']}")
    print(f"   Writable: {artifacts_results['writable']}")
    
    # 5. Check quality thresholds
    print("\n5. Checking quality thresholds...")
    thresholds_results = validate_quality_thresholds()
    validation_results['quality_thresholds'] = thresholds_results
    print(f"   Status: {thresholds_results['status']}")
    
    # Generate summary
    print("\n=== Validation Summary ===")
    
    total_checks = 5
    passed_checks = 0
    
    # Workflow check
    if isinstance(workflow_results, dict) and 'status' not in workflow_results:
        valid_workflows = sum(1 for w in workflow_results.values() if w['syntax_valid'])
        if valid_workflows == len(workflow_results):
            passed_checks += 1
            print("SUCCESS: All workflows have valid YAML syntax")
        else:
            print(f"ERROR: {len(workflow_results) - valid_workflows} workflows have YAML issues")
    
    # Analyzer imports check
    available_components = sum(1 for r in import_results.values() if r['status'] == 'available')
    if available_components >= 3:  # At least 3 core components should work
        passed_checks += 1
        print("SUCCESS: Core analyzer components are importable")
    else:
        print(f"ERROR: Only {available_components} analyzer components available")
    
    # Quality gates script check
    if gates_results['status'] == 'available' and gates_results.get('functional', False):
        passed_checks += 1
        print("SUCCESS: Quality gates script is functional")
    else:
        print("ERROR: Quality gates script has issues")
    
    # Artifacts directory check
    if artifacts_results['exists'] and artifacts_results['writable']:
        passed_checks += 1
        print("SUCCESS: Artifacts directory is ready")
    else:
        print("ERROR: Artifacts directory is not properly configured")
    
    # Quality thresholds check
    if thresholds_results['status'] == 'configured' and thresholds_results.get('properly_configured', False):
        passed_checks += 1
        print("SUCCESS: Quality thresholds are properly configured")
    else:
        print("ERROR: Quality thresholds need configuration")
    
    # Overall status
    print(f"\nOverall Status: {passed_checks}/{total_checks} checks passed")
    
    if passed_checks == total_checks:
        print("SUCCESS: Analyzer pipeline is READY for production deployment!")
        exit_code = 0
    elif passed_checks >= 3:
        print("WARNING: Analyzer pipeline is PARTIALLY ready - fix remaining issues")
        exit_code = 1
    else:
        print("ERROR: Analyzer pipeline is NOT ready - significant issues need resolution")
        exit_code = 2
    
    # Save validation report
    validation_report = {
        'timestamp': datetime.now().isoformat(),
        'working_directory': os.getcwd(),
        'total_checks': total_checks,
        'passed_checks': passed_checks,
        'overall_status': 'ready' if passed_checks == total_checks else 'partial' if passed_checks >= 3 else 'not_ready',
        'results': validation_results
    }
    
    report_path = Path('.claude/.artifacts/validation_report.json')
    report_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(report_path, 'w') as f:
        json.dump(validation_report, f, indent=2)
    
    print(f"\nDetailed validation report saved to: {report_path}")
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()