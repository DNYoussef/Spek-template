#!/usr/bin/env python3
"""
JSON Schema Validation Test for Phase 1 Recommendations
Validates schema consistency across all analyzer JSON outputs
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Tuple
import traceback

class JSONSchemaValidator:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.artifacts_path = self.base_path / ".claude" / ".artifacts"
        self.results = {
            "test_name": "JSON Schema Validation",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "total_files": 0,
            "valid_files": 0,
            "invalid_files": 0,
            "schema_issues": [],
            "policy_consistency": {"status": "unknown", "issues": []},
            "violation_consistency": {"status": "unknown", "issues": []},
            "performance": {"load_time": 0, "validation_time": 0}
        }

    def load_json_files(self) -> List[Tuple[str, Dict]]:
        """Load all JSON files from artifacts directory"""
        start_time = time.time()
        json_files = []
        
        try:
            for json_file in self.artifacts_path.glob("*.json"):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        json_files.append((str(json_file), data))
                        self.results["valid_files"] += 1
                except json.JSONDecodeError as e:
                    self.results["schema_issues"].append({
                        "file": str(json_file),
                        "error": f"JSON decode error: {e}",
                        "type": "syntax"
                    })
                    self.results["invalid_files"] += 1
                except Exception as e:
                    self.results["schema_issues"].append({
                        "file": str(json_file),
                        "error": f"Load error: {e}",
                        "type": "access"
                    })
                    self.results["invalid_files"] += 1
                    
            self.results["total_files"] = len(json_files) + self.results["invalid_files"]
            self.results["performance"]["load_time"] = time.time() - start_time
            return json_files
            
        except Exception as e:
            self.results["schema_issues"].append({
                "file": "directory_scan",
                "error": f"Directory scan error: {e}",
                "type": "critical"
            })
            return []

    def validate_policy_field_consistency(self, json_files: List[Tuple[str, Dict]]) -> bool:
        """Test Phase 1 recommendation: Policy field standardization"""
        policy_fields = {}
        consistent = True
        
        for file_path, data in json_files:
            if "policy" in data:
                policy_structure = self.extract_policy_structure(data["policy"])
                file_name = os.path.basename(file_path)
                policy_fields[file_name] = policy_structure
        
        # Check consistency across files
        if len(policy_fields) > 1:
            reference_structure = list(policy_fields.values())[0]
            for file_name, structure in policy_fields.items():
                if structure != reference_structure:
                    self.results["policy_consistency"]["issues"].append({
                        "file": file_name,
                        "expected": reference_structure,
                        "actual": structure,
                        "issue": "policy_structure_mismatch"
                    })
                    consistent = False
        
        self.results["policy_consistency"]["status"] = "consistent" if consistent else "inconsistent"
        return consistent

    def validate_violation_object_consistency(self, json_files: List[Tuple[str, Dict]]) -> bool:
        """Test Phase 1 recommendation: Violation object standardization"""
        violation_schemas = {}
        consistent = True
        
        for file_path, data in json_files:
            violations = self.extract_violations(data)
            if violations:
                schema = self.extract_violation_schema(violations[0])
                file_name = os.path.basename(file_path)
                violation_schemas[file_name] = schema
        
        # Check consistency across files
        if len(violation_schemas) > 1:
            reference_schema = list(violation_schemas.values())[0]
            for file_name, schema in violation_schemas.items():
                if not self.schemas_compatible(schema, reference_schema):
                    self.results["violation_consistency"]["issues"].append({
                        "file": file_name,
                        "expected_fields": reference_schema,
                        "actual_fields": schema,
                        "issue": "violation_schema_mismatch"
                    })
                    consistent = False
        
        self.results["violation_consistency"]["status"] = "consistent" if consistent else "inconsistent"
        return consistent

    def extract_policy_structure(self, policy_data: Any) -> Dict[str, str]:
        """Extract policy structure for comparison"""
        if isinstance(policy_data, dict):
            return {key: type(value).__name__ for key, value in policy_data.items()}
        elif isinstance(policy_data, list):
            return {"type": "list", "length": len(policy_data)}
        else:
            return {"type": type(policy_data).__name__}

    def extract_violations(self, data: Dict) -> List[Dict]:
        """Extract violations from various data structures"""
        violations = []
        
        # Check common violation field names
        for field in ["violations", "violation_list", "findings", "results"]:
            if field in data:
                if isinstance(data[field], list):
                    violations.extend(data[field])
                elif isinstance(data[field], dict):
                    violations.append(data[field])
        
        # Check nested structures
        if "analysis_results" in data and isinstance(data["analysis_results"], dict):
            for key, value in data["analysis_results"].items():
                if isinstance(value, dict) and "violations" in value:
                    if isinstance(value["violations"], list):
                        violations.extend(value["violations"])
        
        return violations

    def extract_violation_schema(self, violation: Dict) -> Dict[str, str]:
        """Extract violation schema for comparison"""
        return {key: type(value).__name__ for key, value in violation.items()}

    def schemas_compatible(self, schema1: Dict, schema2: Dict) -> bool:
        """Check if two schemas are compatible"""
        # All fields in schema1 should exist in schema2 with compatible types
        for field, type_name in schema1.items():
            if field not in schema2:
                return False
            if type_name != schema2[field] and not self.types_compatible(type_name, schema2[field]):
                return False
        return True

    def types_compatible(self, type1: str, type2: str) -> bool:
        """Check if two types are compatible"""
        compatible_pairs = [
            ("int", "float"), ("float", "int"),
            ("str", "NoneType"), ("NoneType", "str"),
            ("list", "NoneType"), ("NoneType", "list"),
            ("dict", "NoneType"), ("NoneType", "dict")
        ]
        return (type1, type2) in compatible_pairs or (type2, type1) in compatible_pairs

    def run_validation(self) -> Dict[str, Any]:
        """Execute comprehensive JSON schema validation"""
        start_time = time.time()
        
        print("Loading JSON files for schema validation...")
        json_files = self.load_json_files()
        
        if not json_files:
            self.results["status"] = "FAILED"
            self.results["error"] = "No valid JSON files found"
            return self.results
        
        print(f"Loaded {len(json_files)} JSON files")
        
        # Test Phase 1 recommendations
        policy_valid = self.validate_policy_field_consistency(json_files)
        violation_valid = self.validate_violation_object_consistency(json_files)
        
        self.results["performance"]["validation_time"] = time.time() - start_time
        
        # Determine overall status
        if len(self.results["schema_issues"]) == 0 and policy_valid and violation_valid:
            self.results["status"] = "PASSED"
        elif len(self.results["schema_issues"]) == 0:
            self.results["status"] = "PASSED_WITH_WARNINGS"
        else:
            self.results["status"] = "FAILED"
        
        return self.results

def main():
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        base_path = os.getcwd()
    
    validator = JSONSchemaValidator(base_path)
    results = validator.run_validation()
    
    # Output results
    print(f"\n=== JSON Schema Validation Results ===")
    print(f"Status: {results['status']}")
    print(f"Total files: {results['total_files']}")
    print(f"Valid files: {results['valid_files']}")
    print(f"Invalid files: {results['invalid_files']}")
    print(f"Policy consistency: {results['policy_consistency']['status']}")
    print(f"Violation consistency: {results['violation_consistency']['status']}")
    
    if results['schema_issues']:
        print(f"\nSchema Issues ({len(results['schema_issues'])}):")
        for issue in results['schema_issues']:
            print(f"  - {issue['file']}: {issue['error']}")
    
    if results['policy_consistency']['issues']:
        print(f"\nPolicy Consistency Issues ({len(results['policy_consistency']['issues'])}):")
        for issue in results['policy_consistency']['issues']:
            print(f"  - {issue['file']}: {issue['issue']}")
    
    if results['violation_consistency']['issues']:
        print(f"\nViolation Consistency Issues ({len(results['violation_consistency']['issues'])}):")
        for issue in results['violation_consistency']['issues']:
            print(f"  - {issue['file']}: {issue['issue']}")
    
    # Save results
    output_file = os.path.join(base_path, ".claude", ".artifacts", "sandbox-validation", "json_schema_validation_results.json")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if results['status'] in ['PASSED', 'PASSED_WITH_WARNINGS'] else 1

if __name__ == "__main__":
    sys.exit(main())