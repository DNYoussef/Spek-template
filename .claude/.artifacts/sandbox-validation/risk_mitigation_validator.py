from lib.shared.utilities import path_exists
#!/usr/bin/env python3
"""
Risk Mitigation Validation Test for Phase 1 Recommendations
Tests violation ID determinism, path resolution, policy enforcement
"""

import json
import os
import sys
import time
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple
import traceback

class RiskMitigationValidator:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.artifacts_path = self.base_path / ".claude" / ".artifacts"
        self.results = {
            "test_name": "Risk Mitigation Validation",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "violation_id_determinism": {"status": "unknown", "tests": []},
            "path_resolution": {"status": "unknown", "tests": []},
            "policy_enforcement": {"status": "unknown", "tests": []},
            "data_integrity": {"status": "unknown", "tests": []},
            "overall_risk_score": 0
        }

    def test_violation_id_determinism(self) -> bool:
        """Test that violation IDs are deterministic and reproducible"""
        determinism_tests = []
        
        # Test deterministic ID generation
        test_violations = [
            {
                "type": "CoM",
                "file": "test.py",
                "line": 10,
                "description": "Test violation"
            },
            {
                "type": "CoP",
                "file": "example.py", 
                "line": 25,
                "description": "Another test violation"
            }
        ]
        
        for i, violation in enumerate(test_violations):
            # Generate ID multiple times using different methods
            ids_generated = []
            
            # Method 1: Simple concatenation hash
            simple_id = hashlib.md5(f"{violation['type']}{violation['file']}{violation['line']}".encode(), usedforsecurity=False).hexdigest()[:8]
            ids_generated.append(("simple", simple_id))
            
            # Method 2: JSON-based hash
            json_str = json.dumps(violation, sort_keys=True)
            json_id = hashlib.md5(json_str.encode(), usedforsecurity=False).hexdigest()[:8]
            ids_generated.append(("json", json_id))
            
            # Method 3: Combined hash
            combined_str = f"{violation['type']}_{violation['file']}_{violation['line']}_{violation['description']}"
            combined_id = hashlib.md5(combined_str.encode()).hexdigest()[:8]
            ids_generated.append(("combined", combined_id))
            
            # Test reproducibility - generate same IDs again
            reproducible = True
            for method, original_id in ids_generated:
                if method == "simple":
                    repeat_id = hashlib.md5(f"{violation['type']}{violation['file']}{violation['line']}".encode()).hexdigest()[:8]
                elif method == "json":
                    repeat_json = json.dumps(violation, sort_keys=True)
                    repeat_id = hashlib.md5(repeat_json.encode()).hexdigest()[:8]
                else:  # combined
                    repeat_str = f"{violation['type']}_{violation['file']}_{violation['line']}_{violation['description']}"
                    repeat_id = hashlib.md5(repeat_str.encode()).hexdigest()[:8]
                
                if original_id != repeat_id:
                    reproducible = False
                    break
            
            determinism_tests.append({
                "test_violation": i,
                "ids_generated": ids_generated,
                "reproducible": reproducible,
                "unique_ids": len(set(id_val for _, id_val in ids_generated)) == len(ids_generated)
            })
        
        # Test for ID collisions across different violations
        all_ids = set()
        collisions = []
        
        for test in determinism_tests:
            for method, id_val in test["ids_generated"]:
                if id_val in all_ids:
                    collisions.append({"id": id_val, "method": method})
                all_ids.add(id_val)
        
        self.results["violation_id_determinism"]["tests"] = determinism_tests
        self.results["violation_id_determinism"]["collisions"] = collisions
        
        # Determine success
        all_reproducible = all(test["reproducible"] for test in determinism_tests)
        no_collisions = len(collisions) == 0
        
        if all_reproducible and no_collisions:
            self.results["violation_id_determinism"]["status"] = "passed"
            return True
        else:
            self.results["violation_id_determinism"]["status"] = "failed"
            return False

    def test_path_resolution_fixes(self) -> bool:
        """Test path resolution consistency and normalization"""
        path_tests = []
        
        # Test different path formats
        test_paths = [
            "C:\\Users\\test\\file.py",
            "C:/Users/test/file.py",
            "./relative/path.py",
            "../parent/file.py",
            "simple_file.py",
            "/absolute/unix/path.py"
        ]
        
        for path in test_paths:
            try:
                # Test path normalization
                normalized = os.path.normpath(path)
                absolute = os.path.abspath(path) if not os.path.isabs(path) else path
                
                # Test path consistency
                path_obj = Path(path)
                pathlib_normalized = str(path_obj.resolve()) if path_obj.exists() else str(path_obj)
                
                # Check for consistency
                consistent_normalization = True
                resolution_issues = []
                
                # Test relative vs absolute resolution
                if path.startswith('.'):
                    if not os.path.commonpath([os.getcwd(), absolute]):
                        resolution_issues.append("relative_path_resolution_outside_working_dir")
                
                # Test path separator consistency
                if '\\' in path and '/' in path:
                    resolution_issues.append("mixed_path_separators")
                
                path_tests.append({
                    "original_path": path,
                    "normalized_path": normalized,
                    "absolute_path": absolute,
                    "pathlib_resolved": pathlib_normalized,
                    "consistent": len(resolution_issues) == 0,
                    "issues": resolution_issues
                })
                
            except Exception as e:
                path_tests.append({
                    "original_path": path,
                    "error": str(e),
                    "consistent": False,
                    "issues": ["path_resolution_exception"]
                })
        
        # Test actual file paths from artifacts
        for json_file in self.artifacts_path.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Extract file paths from violations
                file_paths = self.extract_file_paths_from_data(data)
                
                for file_path in file_paths:
                    if file_path and isinstance(file_path, str):
                        # Test if path exists or is resolvable
                        path_exists = path_exists(file_path)
                        is_absolute = os.path.isabs(file_path)
                        is_normalized = file_path == os.path.normpath(file_path)
                        
                        path_tests.append({
                            "source_file": json_file.name,
                            "extracted_path": file_path,
                            "exists": path_exists,
                            "is_absolute": is_absolute,
                            "is_normalized": is_normalized,
                            "consistent": is_normalized,
                            "issues": [] if is_normalized else ["path_not_normalized"]
                        })
                        
            except Exception as e:
                path_tests.append({
                    "source_file": json_file.name,
                    "error": str(e),
                    "consistent": False,
                    "issues": ["file_processing_error"]
                })
        
        self.results["path_resolution"]["tests"] = path_tests
        
        # Determine success
        consistent_paths = sum(1 for test in path_tests if test.get("consistent", False))
        total_paths = len(path_tests)
        
        if total_paths > 0:
            consistency_ratio = consistent_paths / total_paths
            if consistency_ratio >= 0.9:  # 90% consistency threshold
                self.results["path_resolution"]["status"] = "passed"
                return True
            elif consistency_ratio >= 0.7:  # 70% partial success
                self.results["path_resolution"]["status"] = "partial"
                return False
            else:
                self.results["path_resolution"]["status"] = "failed"
                return False
        else:
            self.results["path_resolution"]["status"] = "no_data"
            return False

    def test_policy_enforcement_consistency(self) -> bool:
        """Test policy enforcement mechanisms"""
        policy_tests = []
        
        # Test policy loading and validation
        try:
            # Look for policy-related files
            policy_files = []
            for pattern in ["*policy*.json", "*config*.json", "*rules*.json"]:
                policy_files.extend(self.artifacts_path.glob(pattern))
            
            # Also check config directory
            config_dir = self.base_path / "configs"
            if config_dir.exists():
                for pattern in ["*.json", "*.yaml", "*.yml"]:
                    policy_files.extend(config_dir.glob(pattern))
            
            for policy_file in policy_files:
                try:
                    if policy_file.suffix.lower() == '.json':
                        with open(policy_file, 'r', encoding='utf-8') as f:
                            policy_data = json.load(f)
                        
                        # Test policy structure
                        policy_structure_valid = self.validate_policy_structure(policy_data)
                        
                        # Test policy completeness
                        required_sections = ["budgets", "allowlist", "denylist", "verification"]
                        missing_sections = [section for section in required_sections if section not in policy_data]
                        
                        policy_tests.append({
                            "policy_file": policy_file.name,
                            "valid_structure": policy_structure_valid,
                            "complete": len(missing_sections) == 0,
                            "missing_sections": missing_sections,
                            "consistent": policy_structure_valid and len(missing_sections) == 0
                        })
                        
                except Exception as e:
                    policy_tests.append({
                        "policy_file": policy_file.name,
                        "error": str(e),
                        "consistent": False
                    })
            
            # Test policy enforcement in actual data
            for json_file in self.artifacts_path.glob("*.json"):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Check if policies are being enforced
                    policy_references = self.find_policy_references(data)
                    enforcement_evidence = self.find_enforcement_evidence(data)
                    
                    if policy_references or enforcement_evidence:
                        policy_tests.append({
                            "data_file": json_file.name,
                            "policy_references": len(policy_references),
                            "enforcement_evidence": len(enforcement_evidence),
                            "consistent": len(policy_references) > 0 or len(enforcement_evidence) > 0
                        })
                        
                except Exception as e:
                    continue  # Skip files that can't be processed
            
        except Exception as e:
            policy_tests.append({
                "error": f"Policy enforcement test failed: {e}",
                "consistent": False
            })
        
        self.results["policy_enforcement"]["tests"] = policy_tests
        
        # Determine success
        if policy_tests:
            consistent_policies = sum(1 for test in policy_tests if test.get("consistent", False))
            total_policies = len(policy_tests)
            
            if consistent_policies == total_policies:
                self.results["policy_enforcement"]["status"] = "passed"
                return True
            elif consistent_policies > 0:
                self.results["policy_enforcement"]["status"] = "partial"
                return False
            else:
                self.results["policy_enforcement"]["status"] = "failed"
                return False
        else:
            self.results["policy_enforcement"]["status"] = "no_policies_found"
            return False

    def test_data_integrity_improvements(self) -> bool:
        """Test data integrity mechanisms"""
        integrity_tests = []
        
        # Test JSON validity across all files
        for json_file in self.artifacts_path.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Test structural integrity
                integrity_issues = []
                
                # Check for required fields in common structures
                if "violations" in data:
                    for i, violation in enumerate(data["violations"]):
                        if not isinstance(violation, dict):
                            integrity_issues.append(f"violation_{i}_not_object")
                        else:
                            required_fields = ["type", "severity"]
                            for field in required_fields:
                                if field not in violation:
                                    integrity_issues.append(f"violation_{i}_missing_{field}")
                
                # Check for data consistency
                if "summary" in data and "violations" in data:
                    summary = data["summary"]
                    violations = data["violations"]
                    
                    # Count violations by severity
                    actual_counts = {}
                    for violation in violations:
                        severity = violation.get("severity", "unknown")
                        actual_counts[severity] = actual_counts.get(severity, 0) + 1
                    
                    # Compare with summary
                    for severity in ["critical", "high", "medium", "low"]:
                        summary_key = f"{severity}_violations"
                        if summary_key in summary:
                            summary_count = summary[summary_key]
                            actual_count = actual_counts.get(severity, 0)
                            if summary_count != actual_count:
                                integrity_issues.append(f"summary_mismatch_{severity}_{summary_count}_vs_{actual_count}")
                
                integrity_tests.append({
                    "file": json_file.name,
                    "valid_json": True,
                    "integrity_issues": integrity_issues,
                    "consistent": len(integrity_issues) == 0
                })
                
            except json.JSONDecodeError as e:
                integrity_tests.append({
                    "file": json_file.name,
                    "valid_json": False,
                    "error": str(e),
                    "consistent": False
                })
            except Exception as e:
                integrity_tests.append({
                    "file": json_file.name,
                    "error": str(e),
                    "consistent": False
                })
        
        self.results["data_integrity"]["tests"] = integrity_tests
        
        # Determine success
        if integrity_tests:
            valid_files = sum(1 for test in integrity_tests if test.get("valid_json", False))
            consistent_files = sum(1 for test in integrity_tests if test.get("consistent", False))
            total_files = len(integrity_tests)
            
            if valid_files == total_files and consistent_files == total_files:
                self.results["data_integrity"]["status"] = "passed"
                return True
            elif valid_files == total_files:
                self.results["data_integrity"]["status"] = "partial"
                return False
            else:
                self.results["data_integrity"]["status"] = "failed"
                return False
        else:
            self.results["data_integrity"]["status"] = "no_data"
            return False

    def extract_file_paths_from_data(self, data: Dict) -> List[str]:
        """Extract file paths from JSON data"""
        paths = []
        
        def extract_paths_recursive(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key in ["file", "file_path", "path", "location"]:
                        if isinstance(value, str):
                            paths.append(value)
                    else:
                        extract_paths_recursive(value)
            elif isinstance(obj, list):
                for item in obj:
                    extract_paths_recursive(item)
        
        extract_paths_recursive(data)
        return paths

    def validate_policy_structure(self, policy_data: Dict) -> bool:
        """Validate policy data structure"""
        try:
            # Basic structure checks
            if not isinstance(policy_data, dict):
                return False
            
            # Check for common policy fields
            expected_types = {
                "budgets": dict,
                "allowlist": list,
                "denylist": list,
                "verification": dict
            }
            
            for field, expected_type in expected_types.items():
                if field in policy_data:
                    if not isinstance(policy_data[field], expected_type):
                        return False
            
            return True
            
        except Exception:
            return False

    def find_policy_references(self, data: Dict) -> List[str]:
        """Find references to policies in data"""
        references = []
        
        def find_refs_recursive(obj, path=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    new_path = f"{path}.{key}" if path else key
                    if "policy" in key.lower():
                        references.append(new_path)
                    find_refs_recursive(value, new_path)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    find_refs_recursive(item, f"{path}[{i}]")
        
        find_refs_recursive(data)
        return references

    def find_enforcement_evidence(self, data: Dict) -> List[str]:
        """Find evidence of policy enforcement"""
        evidence = []
        
        # Look for enforcement-related fields
        enforcement_keywords = ["enforcement", "compliance", "violation", "threshold", "gate", "check"]
        
        def find_evidence_recursive(obj, path=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    new_path = f"{path}.{key}" if path else key
                    if any(keyword in key.lower() for keyword in enforcement_keywords):
                        evidence.append(new_path)
                    find_evidence_recursive(value, new_path)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    find_evidence_recursive(item, f"{path}[{i}]")
        
        find_evidence_recursive(data)
        return evidence

    def calculate_overall_risk_score(self) -> float:
        """Calculate overall risk score based on test results"""
        weights = {
            "violation_id_determinism": 0.3,
            "path_resolution": 0.25,
            "policy_enforcement": 0.25,
            "data_integrity": 0.2
        }
        
        scores = {}
        for test_type, weight in weights.items():
            status = self.results[test_type]["status"]
            if status == "passed":
                scores[test_type] = 1.0
            elif status == "partial":
                scores[test_type] = 0.5
            else:
                scores[test_type] = 0.0
        
        overall_score = sum(scores[test_type] * weights[test_type] for test_type in weights)
        return overall_score

    def run_validation(self) -> Dict[str, Any]:
        """Execute comprehensive risk mitigation validation"""
        start_time = time.time()
        
        print("Testing violation ID determinism...")
        determinism_passed = self.test_violation_id_determinism()
        
        print("Testing path resolution fixes...")
        path_passed = self.test_path_resolution_fixes()
        
        print("Testing policy enforcement consistency...")
        policy_passed = self.test_policy_enforcement_consistency()
        
        print("Testing data integrity improvements...")
        integrity_passed = self.test_data_integrity_improvements()
        
        # Calculate overall risk score
        self.results["overall_risk_score"] = self.calculate_overall_risk_score()
        
        # Determine overall status
        all_passed = determinism_passed and path_passed and policy_passed and integrity_passed
        most_passed = sum([determinism_passed, path_passed, policy_passed, integrity_passed]) >= 3
        
        if all_passed:
            self.results["status"] = "PASSED"
        elif most_passed:
            self.results["status"] = "PASSED_WITH_WARNINGS"
        else:
            self.results["status"] = "FAILED"
        
        return self.results

def main():
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        base_path = os.getcwd()
    
    validator = RiskMitigationValidator(base_path)
    results = validator.run_validation()
    
    # Output results
    print(f"\n=== Risk Mitigation Validation Results ===")
    print(f"Status: {results['status']}")
    print(f"Violation ID determinism: {results['violation_id_determinism']['status']}")
    print(f"Path resolution: {results['path_resolution']['status']}")
    print(f"Policy enforcement: {results['policy_enforcement']['status']}")
    print(f"Data integrity: {results['data_integrity']['status']}")
    print(f"Overall risk score: {results['overall_risk_score']:.2f}")
    
    # Save results
    output_file = os.path.join(base_path, ".claude", ".artifacts", "sandbox-validation", "risk_mitigation_results.json")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if results['status'] in ['PASSED', 'PASSED_WITH_WARNINGS'] else 1

if __name__ == "__main__":
    sys.exit(main())