#!/usr/bin/env python3
"""
SARIF 2.1.0 Compliance Validation Test
Tests Phase 1 recommendations for SARIF compliance issues
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import traceback

class SARIFComplianceValidator:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.artifacts_path = self.base_path / ".claude" / ".artifacts"
        self.results = {
            "test_name": "SARIF 2.1.0 Compliance Validation",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "sarif_files_found": 0,
            "compliant_files": 0,
            "compliance_issues": [],
            "severity_mapping": {"status": "unknown", "issues": []},
            "fingerprint_validation": {"status": "unknown", "issues": []},
            "tool_metadata": {"status": "unknown", "issues": []},
            "performance": {"validation_time": 0}
        }

    def find_sarif_files(self) -> List[Tuple[str, Dict]]:
        """Find and load SARIF files"""
        sarif_files = []
        
        # Look for SARIF files
        for pattern in ["*.sarif", "*.sarif.json", "*sarif*.json"]:
            for file_path in self.artifacts_path.glob(pattern):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        sarif_files.append((str(file_path), data))
                except Exception as e:
                    self.results["compliance_issues"].append({
                        "file": str(file_path),
                        "error": f"Failed to load SARIF file: {e}",
                        "type": "load_error"
                    })
        
        # Also check for test_sarif files specifically mentioned in research
        test_sarif_files = list(self.artifacts_path.glob("*test_sarif*.json"))
        for file_path in test_sarif_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    sarif_files.append((str(file_path), data))
            except Exception as e:
                self.results["compliance_issues"].append({
                    "file": str(file_path),
                    "error": f"Failed to load test SARIF file: {e}",
                    "type": "load_error"
                })
        
        self.results["sarif_files_found"] = len(sarif_files)
        return sarif_files

    def validate_sarif_schema(self, sarif_data: Dict) -> List[str]:
        """Validate basic SARIF 2.1.0 schema compliance"""
        issues = []
        
        # Check required top-level fields
        required_fields = ["version", "runs"]
        for field in required_fields:
            if field not in sarif_data:
                issues.append(f"Missing required field: {field}")
        
        # Check version
        if "version" in sarif_data:
            if sarif_data["version"] != "2.1.0":
                issues.append(f"Invalid version: {sarif_data['version']}, expected 2.1.0")
        
        # Check runs structure
        if "runs" in sarif_data:
            if not isinstance(sarif_data["runs"], list):
                issues.append("'runs' field must be an array")
            else:
                for i, run in enumerate(sarif_data["runs"]):
                    run_issues = self.validate_run_structure(run, i)
                    issues.extend(run_issues)
        
        return issues

    def validate_run_structure(self, run: Dict, run_index: int) -> List[str]:
        """Validate individual run structure"""
        issues = []
        
        # Check required run fields
        required_fields = ["tool"]
        for field in required_fields:
            if field not in run:
                issues.append(f"Run {run_index}: Missing required field: {field}")
        
        # Validate tool structure
        if "tool" in run:
            tool_issues = self.validate_tool_metadata(run["tool"], run_index)
            issues.extend(tool_issues)
        
        # Validate results if present
        if "results" in run:
            if isinstance(run["results"], list):
                for j, result in enumerate(run["results"]):
                    result_issues = self.validate_result_structure(result, run_index, j)
                    issues.extend(result_issues)
            else:
                issues.append(f"Run {run_index}: 'results' field must be an array")
        
        return issues

    def validate_tool_metadata(self, tool: Dict, run_index: int) -> List[str]:
        """Test Phase 1 recommendation: Tool metadata completeness"""
        issues = []
        
        # Check required tool fields
        required_fields = ["driver"]
        for field in required_fields:
            if field not in tool:
                issues.append(f"Run {run_index}: Tool missing required field: {field}")
        
        if "driver" in tool:
            driver = tool["driver"]
            
            # Check driver fields
            recommended_fields = ["name", "version", "rules"]
            for field in recommended_fields:
                if field not in driver:
                    issues.append(f"Run {run_index}: Tool driver missing recommended field: {field}")
            
            # Validate rules structure
            if "rules" in driver:
                if isinstance(driver["rules"], list):
                    for k, rule in enumerate(driver["rules"]):
                        if not isinstance(rule, dict):
                            issues.append(f"Run {run_index}: Rule {k} must be an object")
                        elif "id" not in rule:
                            issues.append(f"Run {run_index}: Rule {k} missing required 'id' field")
                else:
                    issues.append(f"Run {run_index}: 'rules' field must be an array")
        
        return issues

    def validate_result_structure(self, result: Dict, run_index: int, result_index: int) -> List[str]:
        """Validate individual result structure"""
        issues = []
        
        # Check required result fields
        required_fields = ["ruleId", "message"]
        for field in required_fields:
            if field not in result:
                issues.append(f"Run {run_index}, Result {result_index}: Missing required field: {field}")
        
        # Check message structure
        if "message" in result:
            if isinstance(result["message"], dict):
                if "text" not in result["message"]:
                    issues.append(f"Run {run_index}, Result {result_index}: Message missing 'text' field")
            else:
                issues.append(f"Run {run_index}, Result {result_index}: Message must be an object")
        
        # Validate locations if present
        if "locations" in result:
            if isinstance(result["locations"], list):
                for m, location in enumerate(result["locations"]):
                    location_issues = self.validate_location_structure(location, run_index, result_index, m)
                    issues.extend(location_issues)
            else:
                issues.append(f"Run {run_index}, Result {result_index}: 'locations' must be an array")
        
        return issues

    def validate_location_structure(self, location: Dict, run_index: int, result_index: int, location_index: int) -> List[str]:
        """Validate location structure"""
        issues = []
        
        if "physicalLocation" in location:
            phys_loc = location["physicalLocation"]
            
            if "artifactLocation" not in phys_loc:
                issues.append(f"Run {run_index}, Result {result_index}, Location {location_index}: Missing artifactLocation")
            
            if "region" in phys_loc:
                region = phys_loc["region"]
                if not isinstance(region, dict):
                    issues.append(f"Run {run_index}, Result {result_index}, Location {location_index}: Region must be an object")
        
        return issues

    def validate_severity_mapping(self, sarif_files: List[Tuple[str, Dict]]) -> bool:
        """Test Phase 1 recommendation: Severity mapping corrections"""
        all_valid = True
        valid_levels = ["error", "warning", "note", "info"]
        
        for file_path, sarif_data in sarif_files:
            file_name = os.path.basename(file_path)
            
            if "runs" in sarif_data:
                for i, run in enumerate(sarif_data["runs"]):
                    if "results" in run:
                        for j, result in enumerate(run["results"]):
                            if "level" in result:
                                level = result["level"]
                                if level not in valid_levels:
                                    self.results["severity_mapping"]["issues"].append({
                                        "file": file_name,
                                        "run": i,
                                        "result": j,
                                        "invalid_level": level,
                                        "valid_levels": valid_levels
                                    })
                                    all_valid = False
        
        self.results["severity_mapping"]["status"] = "valid" if all_valid else "invalid"
        return all_valid

    def validate_fingerprints(self, sarif_files: List[Tuple[str, Dict]]) -> bool:
        """Test Phase 1 recommendation: Fingerprint implementation"""
        has_fingerprints = False
        fingerprint_issues = []
        
        for file_path, sarif_data in sarif_files:
            file_name = os.path.basename(file_path)
            
            if "runs" in sarif_data:
                for i, run in enumerate(sarif_data["runs"]):
                    if "results" in run:
                        for j, result in enumerate(run["results"]):
                            if "fingerprints" in result:
                                has_fingerprints = True
                                fingerprints = result["fingerprints"]
                                
                                if not isinstance(fingerprints, dict):
                                    fingerprint_issues.append({
                                        "file": file_name,
                                        "run": i,
                                        "result": j,
                                        "issue": "fingerprints must be an object"
                                    })
                                else:
                                    # Check for valid fingerprint keys
                                    for key, value in fingerprints.items():
                                        if not isinstance(value, str):
                                            fingerprint_issues.append({
                                                "file": file_name,
                                                "run": i,
                                                "result": j,
                                                "issue": f"fingerprint value for key '{key}' must be a string"
                                            })
        
        self.results["fingerprint_validation"]["issues"] = fingerprint_issues
        
        if has_fingerprints and len(fingerprint_issues) == 0:
            self.results["fingerprint_validation"]["status"] = "implemented"
            return True
        elif has_fingerprints:
            self.results["fingerprint_validation"]["status"] = "implemented_with_issues"
            return False
        else:
            self.results["fingerprint_validation"]["status"] = "not_implemented"
            return False

    def run_validation(self) -> Dict[str, Any]:
        """Execute comprehensive SARIF compliance validation"""
        start_time = time.time()
        
        print("Searching for SARIF files...")
        sarif_files = self.find_sarif_files()
        
        if not sarif_files:
            self.results["status"] = "NO_SARIF_FILES"
            self.results["error"] = "No SARIF files found for validation"
            return self.results
        
        print(f"Found {len(sarif_files)} SARIF files")
        
        # Validate each SARIF file
        for file_path, sarif_data in sarif_files:
            file_name = os.path.basename(file_path)
            schema_issues = self.validate_sarif_schema(sarif_data)
            
            if schema_issues:
                self.results["compliance_issues"].extend([
                    {"file": file_name, "error": issue, "type": "schema"} 
                    for issue in schema_issues
                ])
            else:
                self.results["compliant_files"] += 1
        
        # Test Phase 1 specific recommendations
        severity_valid = self.validate_severity_mapping(sarif_files)
        fingerprint_valid = self.validate_fingerprints(sarif_files)
        
        # Tool metadata is validated as part of schema validation
        tool_metadata_issues = [
            issue for issue in self.results["compliance_issues"] 
            if "tool" in issue.get("error", "").lower()
        ]
        self.results["tool_metadata"]["status"] = "valid" if not tool_metadata_issues else "invalid"
        self.results["tool_metadata"]["issues"] = tool_metadata_issues
        
        self.results["performance"]["validation_time"] = time.time() - start_time
        
        # Determine overall status
        total_issues = len(self.results["compliance_issues"])
        if total_issues == 0 and severity_valid and fingerprint_valid:
            self.results["status"] = "PASSED"
        elif total_issues == 0:
            self.results["status"] = "PASSED_WITH_WARNINGS"
        else:
            self.results["status"] = "FAILED"
        
        return self.results

def main():
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        base_path = os.getcwd()
    
    validator = SARIFComplianceValidator(base_path)
    results = validator.run_validation()
    
    # Output results
    print(f"\n=== SARIF 2.1.0 Compliance Validation Results ===")
    print(f"Status: {results['status']}")
    print(f"SARIF files found: {results['sarif_files_found']}")
    print(f"Compliant files: {results['compliant_files']}")
    print(f"Severity mapping: {results['severity_mapping']['status']}")
    print(f"Fingerprint validation: {results['fingerprint_validation']['status']}")
    print(f"Tool metadata: {results['tool_metadata']['status']}")
    
    if results['compliance_issues']:
        print(f"\nCompliance Issues ({len(results['compliance_issues'])}):")
        for issue in results['compliance_issues']:
            print(f"  - {issue['file']}: {issue['error']}")
    
    if results['severity_mapping']['issues']:
        print(f"\nSeverity Mapping Issues ({len(results['severity_mapping']['issues'])}):")
        for issue in results['severity_mapping']['issues']:
            print(f"  - {issue['file']}: Invalid level '{issue['invalid_level']}'")
    
    if results['fingerprint_validation']['issues']:
        print(f"\nFingerprint Issues ({len(results['fingerprint_validation']['issues'])}):")
        for issue in results['fingerprint_validation']['issues']:
            print(f"  - {issue['file']}: {issue['issue']}")
    
    # Save results
    output_file = os.path.join(base_path, ".claude", ".artifacts", "sandbox-validation", "sarif_compliance_results.json")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if results['status'] in ['PASSED', 'PASSED_WITH_WARNINGS', 'NO_SARIF_FILES'] else 1

if __name__ == "__main__":
    sys.exit(main())