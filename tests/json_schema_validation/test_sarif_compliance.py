#!/usr/bin/env python3
"""
SARIF 2.1.0 Compliance Test Suite for Phase 1 Findings

Tests SARIF compliance issues identified in Phase 1:
- SARIF 2.1.0 specification compliance (85/100 score - 3 critical issues)
- Industry integration compatibility 
- Tool metadata completeness
- Location and result object validation
- Fingerprint implementation testing
"""

from pathlib import Path
from typing import Dict, List, Any
from unittest.mock import patch, MagicMock
import json
import unittest

from jsonschema import validate, ValidationError
import jsonschema
import uuid

# Import the actual SARIF reporter to test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent))

from analyzer.reporting.sarif import SARIFReporter
from analyzer.ast_engine.core_analyzer import AnalysisResult, Violation
from analyzer.thresholds import ConnascenceType, Severity

class TestSARIFCompliance(unittest.TestCase):
    """SARIF 2.1.0 compliance validation tests."""

    def setUp(self):
        """Set up test fixtures and SARIF reporter."""
        self.sarif_reporter = SARIFReporter()
        self.fixtures_dir = Path(__file__).parent / "fixtures"
        
        # Create sample violations for testing
        self.sample_violations = [
            self._create_sample_violation("CON_NAME", ConnascenceType.NAME, Severity.MEDIUM, 2.5),
            self._create_sample_violation("CON_TYPE", ConnascenceType.TYPE, Severity.HIGH, 5.0),
            self._create_sample_violation("CON_MEANING", ConnascenceType.MEANING, Severity.CRITICAL, 8.0),
            self._create_sample_violation("CON_EXECUTION", ConnascenceType.EXECUTION, Severity.HIGH, 6.0),
        ]
        
        self.sample_analysis_result = self._create_sample_analysis_result()
        
        # Load SARIF 2.1.0 schema for validation
        self.sarif_schema = self._load_sarif_schema()

    def _create_sample_violation(self, rule_id: str, conn_type: ConnascenceType, 
                                severity: Severity, weight: float) -> Violation:
        """Create a sample violation for testing."""
        return Violation(
            id=f"test_{rule_id}_{uuid.uuid4().hex[:8]}",
            type=conn_type,
            severity=severity,
            weight=weight,
            locality="local",
            file_path="src/example/module.py",
            line_number=15,
            column=8,
            end_line=15,
            end_column=25,
            description=f"Connascence of {conn_type.value} detected",
            recommendation=f"Reduce {conn_type.value} coupling through refactoring",
            function_name="example_function",
            class_name="ExampleClass",
            code_snippet="def example_function(param1, param2):",
            context={"analysis_confidence": 0.95, "locality_score": 0.8}
        )

    def _create_sample_analysis_result(self) -> AnalysisResult:
        """Create a sample analysis result for testing."""
        return AnalysisResult(
            violations=self.sample_violations,
            file_stats={"total_files": 10, "analyzed_files": 10},
            timestamp="2024-1-01T12:00:00",
            project_root="/test/project",
            total_files_analyzed=10,
            analysis_duration_ms=2500,
            policy_preset="default",
            budget_status={"within_budget": True, "budget_used": 0.75},
            baseline_comparison={"improved": True, "regression_count": 0},
            summary_metrics={"total_weight": 21.5, "average_weight": 5.375}
        )

    def _load_sarif_schema(self) -> Dict:
        """Load SARIF 2.1.0 JSON schema for validation."""
        # In a real implementation, this would load the official SARIF schema
        return {
            "type": "object",
            "required": ["$schema", "version", "runs"],
            "properties": {
                "$schema": {"const": "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json"},
                "version": {"const": "2.1.0"},
                "runs": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                        "type": "object",
                        "required": ["tool", "results"],
                        "properties": {
                            "tool": {
                                "type": "object",
                                "required": ["driver"],
                                "properties": {
                                    "driver": {
                                        "type": "object",
                                        "required": ["name", "version", "informationUri", "rules"]
                                    }
                                }
                            },
                            "results": {"type": "array"}
                        }
                    }
                }
            }
        }

    # SARIF 2.1.0 Schema Compliance Tests
    def test_sarif_schema_structure_compliance(self):
        """Test that generated SARIF complies with 2.1.0 schema structure."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        # Validate top-level structure
        self.assertIn("$schema", sarif_dict)
        self.assertEqual(sarif_dict["$schema"], 
                        "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json")
        self.assertEqual(sarif_dict["version"], "2.1.0")
        self.assertIn("runs", sarif_dict)
        self.assertIsInstance(sarif_dict["runs"], list)
        self.assertGreater(len(sarif_dict["runs"]), 0)

    def test_sarif_run_object_compliance(self):
        """Test that SARIF run object complies with specification."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        run = sarif_dict["runs"][0]
        
        # Required run fields
        required_fields = ["tool", "results"]
        for field in required_fields:
            self.assertIn(field, run, f"Missing required run field: {field}")
        
        # Optional but expected fields
        expected_fields = ["automationDetails", "invocations"]
        for field in expected_fields:
            self.assertIn(field, run, f"Missing expected run field: {field}")

    def test_sarif_tool_descriptor_compliance(self):
        """Test that tool descriptor complies with SARIF specification."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        tool = sarif_dict["runs"][0]["tool"]
        self.assertIn("driver", tool)
        
        driver = tool["driver"]
        required_driver_fields = ["name", "version", "informationUri", "rules"]
        for field in required_driver_fields:
            self.assertIn(field, driver, f"Missing required driver field: {field}")
        
        # Validate driver field values
        self.assertEqual(driver["name"], "connascence")
        self.assertEqual(driver["version"], "1.0.0")
        self.assertTrue(driver["informationUri"].startswith("https://"))
        self.assertIsInstance(driver["rules"], list)

    def test_sarif_rule_definitions_compliance(self):
        """Test that rule definitions comply with SARIF specification."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        rules = sarif_dict["runs"][0]["tool"]["driver"]["rules"]
        self.assertGreater(len(rules), 0, "No rules defined")
        
        for rule in rules:
            # Required rule fields
            required_rule_fields = ["id", "name", "shortDescription", "fullDescription"]
            for field in required_rule_fields:
                self.assertIn(field, rule, f"Missing required rule field: {field}")
            
            # Validate rule ID format
            self.assertTrue(rule["id"].startswith("CON_"), 
                            f"Invalid rule ID format: {rule['id']}")
            
            # Validate descriptions
            self.assertIn("text", rule["shortDescription"])
            self.assertIn("text", rule["fullDescription"])

    def test_sarif_result_objects_compliance(self):
        """Test that result objects comply with SARIF specification."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        results = sarif_dict["runs"][0]["results"]
        self.assertGreater(len(results), 0, "No results found")
        
        for result in results:
            # Required result fields
            required_result_fields = ["ruleId", "level", "message", "locations"]
            for field in required_result_fields:
                self.assertIn(field, result, f"Missing required result field: {field}")
            
            # Validate level values
            valid_levels = ["note", "warning", "error"]
            self.assertIn(result["level"], valid_levels, 
                        f"Invalid level: {result['level']}")
            
            # Validate message structure
            message = result["message"]
            self.assertIn("text", message)
            self.assertIsInstance(message["text"], str)
            self.assertGreater(len(message["text"]), 0)

    def test_sarif_location_objects_compliance(self):
        """Test that location objects comply with SARIF specification."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        results = sarif_dict["runs"][0]["results"]
        
        for result in results:
            locations = result["locations"]
            self.assertIsInstance(locations, list)
            self.assertGreater(len(locations), 0, "No locations found in result")
            
            for location in locations:
                self.assertIn("physicalLocation", location)
                physical_location = location["physicalLocation"]
                
                # Required physical location fields
                self.assertIn("artifactLocation", physical_location)
                self.assertIn("region", physical_location)
                
                # Validate artifact location
                artifact_location = physical_location["artifactLocation"]
                self.assertIn("uri", artifact_location)
                self.assertIn("uriBaseId", artifact_location)
                self.assertEqual(artifact_location["uriBaseId"], "%SRCROOT%")
                
                # Validate region (SARIF uses 1-based indexing)
                region = physical_location["region"]
                self.assertIn("startLine", region)
                self.assertIn("startColumn", region)
                self.assertGreaterEqual(region["startLine"], 1)
                self.assertGreaterEqual(region["startColumn"], 1)

    # SARIF Fingerprint Implementation Tests
    def test_sarif_fingerprint_consistency(self):
        """Test that SARIF fingerprints are consistent and deterministic."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        results = sarif_dict["runs"][0]["results"]
        fingerprints = set()
        
        for result in results:
            self.assertIn("partialFingerprints", result)
            partial_fingerprints = result["partialFingerprints"]
            
            # Required fingerprint fields
            self.assertIn("primaryLocationLineHash", partial_fingerprints)
            self.assertIn("connascenceFingerprint", partial_fingerprints)
            
            # Fingerprints should be unique
            fingerprint = partial_fingerprints["connascenceFingerprint"]
            self.assertNotIn(fingerprint, fingerprints, 
                            f"Duplicate fingerprint: {fingerprint}")
            fingerprints.add(fingerprint)

    def test_sarif_fingerprint_determinism(self):
        """Test that fingerprints are deterministic across multiple generations."""
        # Generate SARIF twice
        sarif_output1 = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict1 = json.loads(sarif_output1)
        
        sarif_output2 = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict2 = json.loads(sarif_output2)
        
        # Extract fingerprints from both generations
        results1 = sarif_dict1["runs"][0]["results"]
        results2 = sarif_dict2["runs"][0]["results"]
        
        self.assertEqual(len(results1), len(results2), "Different number of results")
        
        for result1, result2 in zip(results1, results2):
            fingerprints1 = result1["partialFingerprints"]
            fingerprints2 = result2["partialFingerprints"]
            
            self.assertEqual(fingerprints1, fingerprints2, 
                            "Fingerprints are not deterministic")

    # SARIF Severity Mapping Tests
    def test_sarif_severity_mapping_correctness(self):
        """Test that connascence severity maps correctly to SARIF levels."""
        severity_mapping = {
            "low": "note",
            "medium": "warning", 
            "high": "error",
            "critical": "error"
        }
        
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        results = sarif_dict["runs"][0]["results"]
        
        for result in results:
            # Extract original severity from properties
            properties = result.get("properties", {})
            original_severity = properties.get("severity")
            sarif_level = result["level"]
            
            if original_severity:
                expected_level = severity_mapping.get(original_severity)
                self.assertEqual(sarif_level, expected_level,
                                f"Incorrect severity mapping: {original_severity} -> {sarif_level}")

    # SARIF Automation Details Tests
    def test_sarif_automation_details_compliance(self):
        """Test that automation details comply with SARIF specification."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        run = sarif_dict["runs"][0]
        self.assertIn("automationDetails", run)
        
        automation_details = run["automationDetails"]
        
        # Required automation details fields
        required_fields = ["id", "description"]
        for field in required_fields:
            self.assertIn(field, automation_details, 
                        f"Missing automation details field: {field}")
        
        # Validate ID format
        automation_id = automation_details["id"]
        self.assertTrue(automation_id.startswith("connascence/"),
                        f"Invalid automation ID format: {automation_id}")
        
        # Validate description
        description = automation_details["description"]
        self.assertIn("text", description)
        self.assertGreater(len(description["text"]), 0)

    # SARIF Invocation Tests  
    def test_sarif_invocation_compliance(self):
        """Test that invocation details comply with SARIF specification."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        run = sarif_dict["runs"][0]
        self.assertIn("invocations", run)
        
        invocations = run["invocations"]
        self.assertIsInstance(invocations, list)
        self.assertGreater(len(invocations), 0)
        
        for invocation in invocations:
            # Required invocation fields
            required_fields = ["executionSuccessful", "startTimeUtc", "workingDirectory"]
            for field in required_fields:
                self.assertIn(field, invocation, 
                            f"Missing invocation field: {field}")
            
            # Validate execution status
            self.assertIsInstance(invocation["executionSuccessful"], bool)
            
            # Validate timestamp format (should end with Z for UTC)
            start_time = invocation["startTimeUtc"]
            self.assertTrue(start_time.endswith("Z"), 
                            f"Invalid timestamp format: {start_time}")
            
            # Validate working directory URI format
            working_dir = invocation["workingDirectory"]
            self.assertIn("uri", working_dir)
            self.assertTrue(working_dir["uri"].startswith("file://"),
                            f"Invalid working directory URI: {working_dir['uri']}")

    # SARIF Properties Extension Tests
    def test_sarif_properties_extension_compliance(self):
        """Test that custom properties follow SARIF extension guidelines."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        # Check run properties
        run = sarif_dict["runs"][0]
        self.assertIn("properties", run)
        
        run_properties = run["properties"]
        expected_properties = ["analysisType", "totalFilesAnalyzed", "analysisDurationMs"]
        for prop in expected_properties:
            self.assertIn(prop, run_properties, f"Missing run property: {prop}")
        
        # Check result properties
        results = run["results"]
        for result in results:
            self.assertIn("properties", result)
            result_properties = result["properties"]
            
            expected_result_properties = ["connascenceType", "severity", "weight", "locality"]
            for prop in expected_result_properties:
                self.assertIn(prop, result_properties, 
                            f"Missing result property: {prop}")

    # Industry Integration Compatibility Tests
    def test_github_code_scanning_compatibility(self):
        """Test compatibility with GitHub Code Scanning requirements."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        # GitHub requires specific schema version
        self.assertEqual(sarif_dict["$schema"],
                        "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json")
        
        # GitHub requires uriBaseId for relative paths
        results = sarif_dict["runs"][0]["results"]
        for result in results:
            for location in result["locations"]:
                physical_location = location["physicalLocation"]
                artifact_location = physical_location["artifactLocation"]
                self.assertIn("uriBaseId", artifact_location)

    def test_azure_devops_compatibility(self):
        """Test compatibility with Azure DevOps Code Analysis requirements."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        # Azure DevOps requires tool information
        tool = sarif_dict["runs"][0]["tool"]["driver"]
        self.assertIn("name", tool)
        self.assertIn("version", tool)
        self.assertIn("informationUri", tool)
        
        # Azure DevOps prefers helpUri for rules
        rules = tool["rules"]
        for rule in rules:
            self.assertIn("helpUri", rule, f"Rule {rule['id']} missing helpUri")

    def test_sonarqube_compatibility(self):
        """Test compatibility with SonarQube SARIF import requirements."""
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_dict = json.loads(sarif_output)
        
        # SonarQube requires specific rule properties
        rules = sarif_dict["runs"][0]["tool"]["driver"]["rules"]
        for rule in rules:
            properties = rule.get("properties", {})
            self.assertIn("tags", properties, f"Rule {rule['id']} missing tags")
            self.assertIn("precision", properties, f"Rule {rule['id']} missing precision")

if __name__ == "__main__":
    unittest.main()