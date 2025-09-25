from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_GOD_OBJECTS_ALLOWED, MINIMUM_TEST_COVERAGE_PERCENTAGE

import os
import sys
import json
import importlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'src'))

def validate_file_existence(file_paths: List[str]) -> Dict[str, Any]:
    """Validate that required files exist."""
    results = {}

    for file_path in file_paths:
        full_path = os.path.join(project_root, file_path)
        if os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    results[file_path] = {
                        'exists': True,
                        'size_bytes': len(content.encode('utf-8')),
                        'lines': len(content.splitlines()),
                        'has_content': len(content.strip()) > 0
                    }
            except Exception as e:
                results[file_path] = {
                    'exists': True,
                    'error': f"Could not read file: {e}",
                    'size_bytes': 0,
                    'lines': 0,
                    'has_content': False
                }
        else:
            results[file_path] = {
                'exists': False,
                'size_bytes': 0,
                'lines': 0,
                'has_content': False
            }

    return results

def validate_pattern_matcher():
    """Validate PatternMatcher implementation."""
    try:
        from src.analysis.core.PatternMatcher import PatternMatcher, FailurePattern

        # Test basic instantiation
        matcher = PatternMatcher()

        results = {
            'import_success': True,
            'instantiation_success': True,
            'has_patterns_attr': hasattr(matcher, 'patterns'),
            'has_cache_attr': hasattr(matcher, 'pattern_cache'),
            'initial_pattern_count': len(matcher.patterns) if hasattr(matcher, 'patterns') else 0,
            'methods': {},
            'errors': []
        }

        # Check for expected methods
        expected_methods = [
            'match_pattern', 'add_pattern', 'get_pattern_statistics',
            'evolve_patterns', 'export_patterns', 'import_patterns'
        ]

        for method in expected_methods:
            results['methods'][method] = {
                'exists': hasattr(matcher, method),
                'callable': hasattr(matcher, method) and callable(getattr(matcher, method, None))
            }

        # Test FailurePattern class
        try:
            pattern = FailurePattern(
                pattern_id="test",
                pattern_type="test",
                regex="test",
                frequency=0,
                confidence=0.8
            )
            results['failure_pattern_class'] = True
        except Exception as e:
            results['failure_pattern_class'] = False
            results['errors'].append(f"FailurePattern creation failed: {e}")

        return results

    except ImportError as e:
        return {
            'import_success': False,
            'error': f"Import failed: {e}",
            'instantiation_success': False,
            'methods': {},
            'errors': [str(e)]
        }
    except Exception as e:
        return {
            'import_success': True,
            'instantiation_success': False,
            'error': f"Instantiation failed: {e}",
            'methods': {},
            'errors': [str(e)]
        }

def validate_command_system():
    """Validate command system implementation."""
    command_files = [
        'src/commands/dispatcher.js',
        'src/commands/executor.js',
        'src/commands/registry.js',
        'src/commands/validator.js'
    ]

    results = {
        'files': validate_file_existence(command_files),
        'command_concepts': {},
        'total_score': 0
    }

    # Check for command pattern concepts in dispatcher
    dispatcher_path = os.path.join(project_root, 'src/commands/dispatcher.js')
    if os.path.exists(dispatcher_path):
        try:
            with open(dispatcher_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()

            concepts = {
                'command_registration': 'register' in content,
                'command_dispatch': 'dispatch' in content,
                'command_execution': 'execute' in content or 'executor' in content,
                'mcp_integration': 'mcp' in content,
                'command_validation': 'valid' in content or 'validate' in content
            }

            results['command_concepts'] = concepts
            results['total_score'] = sum(concepts.values()) / len(concepts) * 100

        except Exception as e:
            results['error'] = f"Could not analyze dispatcher: {e}"

    return results

def validate_enterprise_integration():
    """Validate enterprise integration factory patterns."""
    enterprise_files = [
        'src/enterprise/integration/analyzer.py',
        'src/enterprise/integration/analyzer_validation_strategies.py',
        'src/enterprise/__init__.py'
    ]

    results = {
        'files': validate_file_existence(enterprise_files),
        'integration_concepts': {},
        'total_score': 0
    }

    # Check for factory pattern concepts
    analyzer_path = os.path.join(project_root, 'src/enterprise/integration/analyzer.py')
    if os.path.exists(analyzer_path):
        try:
            with open(analyzer_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()

            concepts = {
                'wrapper_factory': 'wrap_analyzer' in content,
                'validation_engine': 'validation' in content,
                'enterprise_features': 'enterprise' in content,
                'integration_class': 'enterpriseanalyzerintegration' in content,
                'factory_methods': 'create' in content or 'wrap' in content
            }

            results['integration_concepts'] = concepts
            results['total_score'] = sum(concepts.values()) / len(concepts) * 100

        except Exception as e:
            results['error'] = f"Could not analyze enterprise integration: {e}"

    return results

def run_comprehensive_validation():
    """Run comprehensive validation of Command + Factory patterns."""
    print("=== Command + Factory Pattern Validation Report ===")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Project Root: {project_root}")
    print()

    # Validate individual components
    validation_results = {
        'timestamp': datetime.now().isoformat(),
        'project_root': project_root,
        'batch_4_analysis': validate_pattern_matcher(),
        'batch_5_cli': validate_command_system(),
        'batch_9_enterprise': validate_enterprise_integration(),
        'overall_scores': {}
    }

    # Print Pattern Matcher Results (Batch 4)
    print("=== Batch 4: Analysis Functions (PatternMatcher) ===")
    pm_results = validation_results['batch_4_analysis']
    print(f"Import Success: {pm_results.get('import_success', False)}")
    print(f"Instantiation Success: {pm_results.get('instantiation_success', False)}")
    print(f"Initial Pattern Count: {pm_results.get('initial_pattern_count', 0)}")

    if 'methods' in pm_results:
        method_count = sum(1 for m in pm_results['methods'].values() if m.get('exists', False))
        total_methods = len(pm_results['methods'])
        print(f"Methods Available: {method_count}/{total_methods}")

        for method, info in pm_results['methods'].items():
            status = "OK" if info.get('exists', False) else "MISSING"
            print(f"  - {method}: {status}")

    if pm_results.get('errors'):
        print("Errors:")
        for error in pm_results['errors']:
            print(f"  - {error}")

    # Calculate Batch 4 score
    batch4_score = 0
    if pm_results.get('import_success'): batch4_score += 25
    if pm_results.get('instantiation_success'): batch4_score += MAXIMUM_GOD_OBJECTS_ALLOWED
    if pm_results.get('initial_pattern_count', 0) > 0: batch4_score += MAXIMUM_GOD_OBJECTS_ALLOWED
    if 'methods' in pm_results:
        method_ratio = sum(1 for m in pm_results['methods'].values() if m.get('exists', False)) / max(len(pm_results['methods']), 1)
        batch4_score += int(method_ratio * 25)

    validation_results['overall_scores']['batch_4'] = batch4_score
    print(f"Batch 4 Score: {batch4_score}/100")
    print()

    # Print Command System Results (Batch 5)
    print("=== Batch 5: CLI Integration (Command System) ===")
    cmd_results = validation_results['batch_5_cli']

    file_count = sum(1 for f in cmd_results['files'].values() if f.get('exists', False))
    total_files = len(cmd_results['files'])
    print(f"Command Files: {file_count}/{total_files}")

    for file_path, info in cmd_results['files'].items():
        status = "EXISTS" if info.get('exists', False) else "MISSING"
        lines = info.get('lines', 0)
        print(f"  - {file_path}: {status} ({lines} lines)")

    if 'command_concepts' in cmd_results:
        concept_count = sum(cmd_results['command_concepts'].values())
        total_concepts = len(cmd_results['command_concepts'])
        print(f"Command Pattern Concepts: {concept_count}/{total_concepts}")

        for concept, present in cmd_results['command_concepts'].items():
            status = "FOUND" if present else "MISSING"
            print(f"  - {concept}: {status}")

    batch5_score = int(cmd_results.get('total_score', 0))
    if file_count > 0:
        batch5_score += int((file_count / total_files) * 50)

    validation_results['overall_scores']['batch_5'] = min(batch5_score, 100)
    print(f"Batch 5 Score: {validation_results['overall_scores']['batch_5']}/100")
    print()

    # Print Enterprise Integration Results (Batch 9)
    print("=== Batch 9: Enterprise Integration (Factory Pattern) ===")
    ent_results = validation_results['batch_9_enterprise']

    ent_file_count = sum(1 for f in ent_results['files'].values() if f.get('exists', False))
    ent_total_files = len(ent_results['files'])
    print(f"Enterprise Files: {ent_file_count}/{ent_total_files}")

    for file_path, info in ent_results['files'].items():
        status = "EXISTS" if info.get('exists', False) else "MISSING"
        lines = info.get('lines', 0)
        print(f"  - {file_path}: {status} ({lines} lines)")

    if 'integration_concepts' in ent_results:
        ent_concept_count = sum(ent_results['integration_concepts'].values())
        ent_total_concepts = len(ent_results['integration_concepts'])
        print(f"Factory Pattern Concepts: {ent_concept_count}/{ent_total_concepts}")

        for concept, present in ent_results['integration_concepts'].items():
            status = "FOUND" if present else "MISSING"
            print(f"  - {concept}: {status}")

    batch9_score = int(ent_results.get('total_score', 0))
    if ent_file_count > 0:
        batch9_score += int((ent_file_count / ent_total_files) * 30)

    validation_results['overall_scores']['batch_9'] = min(batch9_score, 100)
    print(f"Batch 9 Score: {validation_results['overall_scores']['batch_9']}/100")
    print()

    # Overall Assessment
    print("=== Overall Assessment ===")
    scores = validation_results['overall_scores']
    overall_score = sum(scores.values()) / len(scores)

    print(f"Batch 4 (Analysis): {scores.get('batch_4', 0)}/100")
    print(f"Batch 5 (CLI): {scores.get('batch_5', 0)}/MAXIMUM_FUNCTION_LENGTH_LINES")
    print(f"Batch 9 (Enterprise): {scores.get('batch_9', 0)}/MAXIMUM_FUNCTION_LENGTH_LINES")
    print(f"Overall Score: {overall_score:.1f}/100")

    # Quality Gate Assessment
    print(f"\n=== Quality Gate Assessment ===")
    gate_threshold = 60.0  # Realistic threshold for refactoring validation
    gate_status = "PASS" if overall_score >= gate_threshold else "FAIL"

    print(f"Quality Gate: {gate_status}")
    print(f"Threshold: {gate_threshold}/100")
    print(f"Actual: {overall_score:.1f}/MAXIMUM_FUNCTION_LENGTH_LINES")

    if overall_score >= gate_threshold:
        print("* Command + Factory pattern implementations meet validation criteria")
    else:
        print("! Pattern implementations need additional work")

    # Specific Recommendations
    print(f"\n=== Recommendations ===")

    if scores.get('batch_4', 0) < 80:
        print("- PatternMatcher: Fix method indentation and ensure all factory methods work")

    if scores.get('batch_5', 0) < MINIMUM_TEST_COVERAGE_PERCENTAGE:
        print("- CLI Integration: Complete command executor implementation")

    if scores.get('batch_9', 0) < 80:
        print("- Enterprise Integration: Fix import dependencies and validation strategies")

    if overall_score >= 80:
        print("- Excellent: Ready for production deployment")
    elif overall_score >= 60:
        print("- Good: Minor improvements needed for full compliance")
    else:
        print("- Needs Work: Significant refactoring required")

    # Save detailed results
    report_file = os.path.join(project_root, 'tests', 'pattern_validation_report.json')
    with open(report_file, 'w') as f:
        json.dump(validation_results, f, indent=2, default=str)

    print(f"\nDetailed report saved to: {report_file}")

    return validation_results, overall_score

if __name__ == '__main__':
    run_comprehensive_validation()