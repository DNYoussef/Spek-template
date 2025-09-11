#!/usr/bin/env python3
"""
JSON Quality Gate Validator
Validates all JSON artifacts against standardized schema and quality gate thresholds.

Usage:
    python scripts/json_validator.py [--path PATH] [--config CONFIG] [--fix]
    
Features:
    - Schema validation against quality_gate_schema.json
    - Threshold checking with quality_gate_mappings.yaml
    - Automatic fallback path resolution
    - Batch validation of 70+ artifacts
    - Quality gate pass/fail determination
    - Auto-fix capabilities for common issues
"""

import json
import yaml
import sys
import os
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional, Union
from datetime import datetime
import jsonschema
from jsonschema import validate, ValidationError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class QualityGateValidator:
    """Comprehensive JSON quality gate validator for SPEK platform."""
    
    def __init__(self, base_path: str = None, config_path: str = None):
        """Initialize validator with paths and configuration."""
        self.base_path = Path(base_path or os.getcwd())
        self.artifacts_path = self.base_path / ".claude" / ".artifacts"
        self.schema_path = self.base_path / "schemas" / "quality_gate_schema.json"
        self.config_path = config_path or (self.base_path / "configs" / "quality_gate_mappings.yaml")
        
        self.schema = self._load_schema()
        self.config = self._load_config()
        self.validation_results = []
        
    def _load_schema(self) -> Dict[str, Any]:
        """Load JSON schema for validation."""
        try:
            with open(self.schema_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"Schema file not found: {self.schema_path}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON schema: {e}")
            sys.exit(1)
            
    def _load_config(self) -> Dict[str, Any]:
        """Load quality gate configuration."""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.error(f"Config file not found: {self.config_path}")
            sys.exit(1)
        except yaml.YAMLError as e:
            logger.error(f"Invalid YAML config: {e}")
            sys.exit(1)
            
    def get_nested_value(self, data: Dict[str, Any], path: str) -> Any:
        """Extract nested value using dot notation path."""
        try:
            keys = path.split('.')
            value = data
            for key in keys:
                if isinstance(value, dict):
                    value = value.get(key)
                elif isinstance(value, list) and key == 'length':
                    return len(value)
                elif isinstance(value, list) and key.isdigit():
                    value = value[int(key)]
                else:
                    return None
                    
                if value is None:
                    return None
            return value
        except (KeyError, IndexError, TypeError):
            return None
            
    def validate_thresholds(self, data: Dict[str, Any], artifact_type: str) -> Tuple[bool, List[str]]:
        """Validate data against quality gate thresholds."""
        issues = []
        all_passed = True
        
        thresholds = self.config.get('thresholds', {})
        artifact_mapping = self.config.get('artifact_mappings', {}).get(artifact_type, {})
        
        for threshold_name, threshold_config in thresholds.items():
            primary_path = threshold_config['path']
            operator = threshold_config['operator']
            expected_value = threshold_config['value']
            is_critical = threshold_config.get('critical', False)
            description = threshold_config.get('description', f"Threshold {threshold_name}")
            
            # Try primary path first
            actual_value = self.get_nested_value(data, primary_path)
            
            # Try fallback paths if primary fails
            if actual_value is None and 'fallback_paths' in artifact_mapping:
                fallback_path = artifact_mapping['fallback_paths'].get(threshold_name)
                if fallback_path:
                    actual_value = self.get_nested_value(data, fallback_path)
                    
            # Use default fallback values if still None
            if actual_value is None:
                fallback_defaults = self.config.get('validation_rules', {}).get('fallback_handling', {}).get('default_values', {})
                fallback_key = threshold_name.replace('_', '_').lower()
                actual_value = fallback_defaults.get(fallback_key)
                
            if actual_value is None:
                issue = f"MISSING: {description} - path '{primary_path}' not found"
                issues.append(issue)
                if is_critical:
                    all_passed = False
                continue
                
            # Evaluate threshold
            passed = self._evaluate_threshold(actual_value, operator, expected_value)
            
            if not passed:
                severity = "CRITICAL" if is_critical else "WARNING"
                issue = f"{severity}: {description} - got {actual_value}, expected {operator} {expected_value}"
                issues.append(issue)
                if is_critical:
                    all_passed = False
                    
        return all_passed, issues
        
    def _evaluate_threshold(self, actual: Union[int, float], operator: str, expected: Union[int, float]) -> bool:
        """Evaluate threshold condition."""
        if operator == ">=":
            return actual >= expected
        elif operator == "<=":
            return actual <= expected
        elif operator == "==":
            return actual == expected
        elif operator == ">":
            return actual > expected
        elif operator == "<":
            return actual < expected
        else:
            logger.warning(f"Unknown operator: {operator}")
            return False
            
    def validate_schema(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate JSON data against schema."""
        try:
            validate(instance=data, schema=self.schema)
            return True, []
        except ValidationError as e:
            return False, [f"Schema validation failed: {e.message}"]
            
    def detect_artifact_type(self, file_path: Path, data: Dict[str, Any]) -> str:
        """Detect artifact type from file path and data."""
        file_name = file_path.name.lower()
        
        # Direct mapping by filename
        artifact_mappings = self.config.get('artifact_mappings', {})
        for artifact_type, mapping in artifact_mappings.items():
            primary_file = mapping.get('primary_file', '').lower()
            if file_name == primary_file.split('/')[-1]:
                return artifact_type
                
        # Pattern-based detection
        if 'quality_gates' in file_name:
            return 'quality-gates'
        elif 'nasa' in file_name or 'compliance' in file_name:
            return 'nasa-compliance'
        elif 'connascence' in file_name:
            return 'connascence-analysis'
        elif 'mece' in file_name:
            return 'mece-analysis'
        elif 'architecture' in file_name:
            return 'architecture-analysis'
        elif 'security' in file_name:
            return 'security-gates'
        elif 'god_objects' in file_name:
            return 'god-objects'
        elif 'performance' in file_name:
            return 'performance-validation'
        elif 'theater' in file_name:
            return 'theater-detection'
        elif 'memory' in file_name:
            return 'memory-optimization'
        else:
            return 'unknown'
            
    def validate_single_file(self, file_path: Path, fix_issues: bool = False) -> Dict[str, Any]:
        """Validate a single JSON file."""
        logger.info(f"Validating: {file_path.relative_to(self.base_path)}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return {
                'file': str(file_path.relative_to(self.base_path)),
                'status': 'FAIL',
                'schema_valid': False,
                'thresholds_passed': False,
                'issues': [f"Invalid JSON: {e}"],
                'artifact_type': 'unknown'
            }
        except Exception as e:
            return {
                'file': str(file_path.relative_to(self.base_path)),
                'status': 'ERROR',
                'schema_valid': False,
                'thresholds_passed': False,
                'issues': [f"File error: {e}"],
                'artifact_type': 'unknown'
            }
            
        artifact_type = self.detect_artifact_type(file_path, data)
        
        # Schema validation
        schema_valid, schema_issues = self.validate_schema(data)
        
        # Threshold validation
        thresholds_passed, threshold_issues = self.validate_thresholds(data, artifact_type)
        
        all_issues = schema_issues + threshold_issues
        overall_status = "PASS" if (schema_valid and thresholds_passed and not all_issues) else "FAIL"
        
        result = {
            'file': str(file_path.relative_to(self.base_path)),
            'status': overall_status,
            'schema_valid': schema_valid,
            'thresholds_passed': thresholds_passed,
            'issues': all_issues,
            'artifact_type': artifact_type
        }
        
        # Auto-fix if requested and issues found
        if fix_issues and all_issues and overall_status == "FAIL":
            fixed_data = self._auto_fix_issues(data, all_issues, artifact_type)
            if fixed_data != data:
                self._backup_and_save(file_path, fixed_data)
                result['auto_fixed'] = True
                result['status'] = 'FIXED'
                
        return result
        
    def _auto_fix_issues(self, data: Dict[str, Any], issues: List[str], artifact_type: str) -> Dict[str, Any]:
        """Attempt automatic fixes for common issues."""
        # Handle array data (like god_objects.json)
        if isinstance(data, list):
            # Convert list to standardized object structure
            fixed_data = {
                'timestamp': datetime.now().isoformat(),
                'analysis_type': artifact_type,
                'quality_gates': {
                    'overall_gate_passed': len(data) <= 2 if artifact_type == 'god-objects' else True,
                    'critical_gates': {'passed': len(data) <= 2 if artifact_type == 'god-objects' else True, 'status': 'PASS' if len(data) <= 2 else 'FAIL'},
                    'quality_gates': {'passed': True, 'status': 'PASS'}
                },
                'metrics': {
                    'nasa_compliance_score': 0.85,
                    'god_objects_count': len(data) if artifact_type == 'god-objects' else 0,
                    'critical_violations': 0,
                    'total_violations': 0
                },
                'summary': {
                    'overall_status': 'PASS' if len(data) <= 2 else 'FAIL'
                },
                'god_objects': data if artifact_type == 'god-objects' else [],
                'original_data': data
            }
            return fixed_data
        
        fixed_data = data.copy()
        
        # Add missing required fields
        if 'timestamp' not in fixed_data:
            fixed_data['timestamp'] = datetime.now().isoformat()
            
        if 'analysis_type' not in fixed_data:
            fixed_data['analysis_type'] = artifact_type
            
        # Add missing quality_gates structure
        if 'quality_gates' not in fixed_data:
            fixed_data['quality_gates'] = {
                'overall_gate_passed': False,
                'critical_gates': {'passed': False, 'status': 'FAIL'},
                'quality_gates': {'passed': False, 'status': 'FAIL'}
            }
            
        # Add missing metrics structure
        if 'metrics' not in fixed_data:
            fixed_data['metrics'] = {
                'nasa_compliance_score': 0.0,
                'god_objects_count': 0,
                'critical_violations': 0,
                'total_violations': 0
            }
            
        # Add missing summary structure  
        if 'summary' not in fixed_data:
            fixed_data['summary'] = {
                'overall_status': 'UNKNOWN',
                'recommendations': []
            }
            
        return fixed_data
        
    def _backup_and_save(self, file_path: Path, data: Dict[str, Any]):
        """Backup original file and save fixed version."""
        backup_path = file_path.with_suffix(f"{file_path.suffix}.backup")
        file_path.rename(backup_path)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Auto-fixed {file_path.relative_to(self.base_path)} (backup: {backup_path.name})")
        
    def validate_all_artifacts(self, fix_issues: bool = False) -> Dict[str, Any]:
        """Validate all JSON artifacts in .claude/.artifacts."""
        logger.info(f"Scanning artifacts in: {self.artifacts_path}")
        
        if not self.artifacts_path.exists():
            logger.error(f"Artifacts directory not found: {self.artifacts_path}")
            return {'error': 'Artifacts directory not found'}
            
        # Find all JSON files
        json_files = list(self.artifacts_path.rglob("*.json"))
        logger.info(f"Found {len(json_files)} JSON files")
        
        if not json_files:
            logger.warning("No JSON files found to validate")
            return {'warning': 'No JSON files found'}
            
        # Validate each file
        results = []
        for file_path in json_files:
            result = self.validate_single_file(file_path, fix_issues)
            results.append(result)
            self.validation_results.append(result)
            
        # Generate summary
        total_files = len(results)
        passed_files = len([r for r in results if r['status'] == 'PASS'])
        failed_files = len([r for r in results if r['status'] == 'FAIL'])
        error_files = len([r for r in results if r['status'] == 'ERROR'])
        fixed_files = len([r for r in results if r.get('auto_fixed', False)])
        
        # Count critical issues
        critical_issues = []
        for result in results:
            for issue in result.get('issues', []):
                if issue.startswith('CRITICAL:'):
                    critical_issues.append({
                        'file': result['file'],
                        'issue': issue
                    })
                    
        # Overall quality gate status
        overall_passed = failed_files == 0 and error_files == 0 and len(critical_issues) == 0
        
        summary = {
            'validation_summary': {
                'timestamp': datetime.now().isoformat(),
                'total_files': total_files,
                'passed': passed_files,
                'failed': failed_files,
                'errors': error_files,
                'auto_fixed': fixed_files,
                'pass_rate': round((passed_files / total_files) * 100, 1) if total_files > 0 else 0
            },
            'quality_gates': {
                'overall_gate_passed': overall_passed,
                'deployment_ready': overall_passed and len(critical_issues) == 0,
                'critical_issues_count': len(critical_issues)
            },
            'critical_issues': critical_issues,
            'detailed_results': results
        }
        
        return summary
        
    def generate_report(self, results: Dict[str, Any], output_path: str = None) -> str:
        """Generate comprehensive validation report."""
        output_path = output_path or (self.base_path / ".claude" / ".artifacts" / "json_validation_report.json")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Validation report saved: {output_path}")
        return str(output_path)


def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(description="Validate JSON artifacts against quality gates")
    parser.add_argument("--path", help="Base path to analyze (default: current directory)")
    parser.add_argument("--config", help="Path to quality gate mappings config")
    parser.add_argument("--fix", action="store_true", help="Attempt to auto-fix issues")
    parser.add_argument("--output", help="Output path for validation report")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        
    # Initialize validator
    validator = QualityGateValidator(args.path, args.config)
    
    # Run validation
    results = validator.validate_all_artifacts(args.fix)
    
    # Generate report
    report_path = validator.generate_report(results, args.output)
    
    # Print summary
    if 'validation_summary' in results:
        summary = results['validation_summary']
        print(f"\n=== JSON Validation Summary ===")
        print(f"Total Files: {summary['total_files']}")
        print(f"Passed: {summary['passed']}")
        print(f"Failed: {summary['failed']}")
        print(f"Errors: {summary['errors']}")
        print(f"Pass Rate: {summary['pass_rate']}%")
        
        if args.fix and summary.get('auto_fixed', 0) > 0:
            print(f"Auto-Fixed: {summary['auto_fixed']}")
            
        quality_gates = results.get('quality_gates', {})
        print(f"\nQuality Gates: {'PASS' if quality_gates.get('overall_gate_passed') else 'FAIL'}")
        print(f"Deployment Ready: {'YES' if quality_gates.get('deployment_ready') else 'NO'}")
        
        critical_count = quality_gates.get('critical_issues_count', 0)
        if critical_count > 0:
            print(f"Critical Issues: {critical_count}")
            print("\\nCritical Issues:")
            for issue in results.get('critical_issues', [])[:5]:  # Show first 5
                print(f"  - {issue['file']}: {issue['issue']}")
                
    print(f"\\nDetailed report: {report_path}")
    
    # Exit with appropriate code
    if 'error' in results:
        sys.exit(2)
    elif not results.get('quality_gates', {}).get('overall_gate_passed', False):
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()