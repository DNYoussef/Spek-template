#!/usr/bin/env python3
"""
Severity Mapping and Normalization Tests
Comprehensive test suite for the unified severity mapping system and cross-tool violation normalization.
"""

from pathlib import Path
from typing import Dict, Any, List
import json
import tempfile

import pytest
import yaml

# Import system under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from linter_integration.severity_mapping.unified_severity import (
    UnifiedSeverityMapper,
    UnifiedSeverity,
    ViolationCategory,
    SeverityRule,
    unified_mapper
)

class TestUnifiedSeverityMapper:
    """Test suite for unified severity mapping system"""
    
    @pytest.fixture
    def mapper(self):
        """Create fresh mapper instance for each test"""
        return UnifiedSeverityMapper()
    
    @pytest.fixture
    def sample_violations(self):
        """Create sample violations for testing"""
        return [
            {
                "tool_name": "flake8",
                "rule_code": "E501",
                "message": "line too long (88 > 79 characters)",
                "tool_severity": ""
            },
            {
                "tool_name": "pylint",
                "rule_code": "E1120",
                "message": "No value for argument 'param' in function call",
                "tool_severity": "error"
            },
            {
                "tool_name": "bandit",
                "rule_code": "B602",
                "message": "subprocess call with shell=True identified",
                "tool_severity": "HIGH"
            },
            {
                "tool_name": "ruff",
                "rule_code": "S101",
                "message": "Use of assert detected",
                "tool_severity": ""
            },
            {
                "tool_name": "mypy",
                "rule_code": "assignment",
                "message": "Incompatible types in assignment",
                "tool_severity": "error"
            }
        ]
    
    def test_mapper_initialization(self, mapper):
        """Test mapper initializes with default mappings"""
        # Verify default tool mappings loaded
        assert "flake8" in mapper.tool_mappings
        assert "pylint" in mapper.tool_mappings
        assert "ruff" in mapper.tool_mappings
        assert "mypy" in mapper.tool_mappings
        assert "bandit" in mapper.tool_mappings
        
        # Verify each tool has comprehensive mappings
        assert len(mapper.tool_mappings["flake8"]) >= 10
        assert len(mapper.tool_mappings["pylint"]) >= 5
        assert len(mapper.tool_mappings["ruff"]) >= 8
        assert len(mapper.tool_mappings["mypy"]) >= 3
        assert len(mapper.tool_mappings["bandit"]) >= 3
    
    def test_flake8_severity_mapping(self, mapper):
        """Test Flake8-specific severity mappings"""
        # Critical syntax errors
        assert mapper.map_severity("flake8", "E9", "") == UnifiedSeverity.CRITICAL
        assert mapper.map_severity("flake8", "F821", "") == UnifiedSeverity.CRITICAL
        assert mapper.map_severity("flake8", "F822", "") == UnifiedSeverity.CRITICAL
        
        # High severity logical errors
        assert mapper.map_severity("flake8", "F631", "") == UnifiedSeverity.HIGH
        assert mapper.map_severity("flake8", "F405", "") == UnifiedSeverity.HIGH
        
        # Medium severity issues
        assert mapper.map_severity("flake8", "F401", "") == UnifiedSeverity.MEDIUM
        assert mapper.map_severity("flake8", "F841", "") == UnifiedSeverity.MEDIUM
        assert mapper.map_severity("flake8", "E501", "") == UnifiedSeverity.MEDIUM
        
        # Low severity style issues
        assert mapper.map_severity("flake8", "E1", "") == UnifiedSeverity.LOW
        assert mapper.map_severity("flake8", "E2", "") == UnifiedSeverity.LOW
        assert mapper.map_severity("flake8", "W1", "") == UnifiedSeverity.LOW
        assert mapper.map_severity("flake8", "W291", "") == UnifiedSeverity.LOW
    
    def test_pylint_severity_mapping(self, mapper):
        """Test Pylint-specific severity mappings"""
        # Fatal errors
        assert mapper.map_severity("pylint", "F0001", "fatal") == UnifiedSeverity.CRITICAL
        
        # Errors
        assert mapper.map_severity("pylint", "E1120", "error") == UnifiedSeverity.HIGH
        assert mapper.map_severity("pylint", "E", "") == UnifiedSeverity.HIGH
        
        # Warnings
        assert mapper.map_severity("pylint", "W0611", "warning") == UnifiedSeverity.MEDIUM
        assert mapper.map_severity("pylint", "W", "") == UnifiedSeverity.MEDIUM
        
        # Refactoring suggestions
        assert mapper.map_severity("pylint", "R0903", "refactor") == UnifiedSeverity.LOW
        assert mapper.map_severity("pylint", "R", "") == UnifiedSeverity.LOW
        
        # Convention violations
        assert mapper.map_severity("pylint", "C0103", "convention") == UnifiedSeverity.LOW
        assert mapper.map_severity("pylint", "C", "") == UnifiedSeverity.LOW
        
        # Information
        assert mapper.map_severity("pylint", "I0011", "info") == UnifiedSeverity.INFO
        assert mapper.map_severity("pylint", "I", "") == UnifiedSeverity.INFO
    
    def test_ruff_severity_mapping(self, mapper):
        """Test Ruff-specific severity mappings"""
        # Security issues (high priority)
        assert mapper.map_severity("ruff", "S101", "") == UnifiedSeverity.HIGH
        assert mapper.map_severity("ruff", "S102", "") == UnifiedSeverity.HIGH
        
        # Bugbear issues (high priority)
        assert mapper.map_severity("ruff", "B902", "") == UnifiedSeverity.HIGH
        assert mapper.map_severity("ruff", "B901", "") == UnifiedSeverity.HIGH
        
        # Performance issues
        assert mapper.map_severity("ruff", "PERF401", "") == UnifiedSeverity.MEDIUM
        assert mapper.map_severity("ruff", "PERF", "") == UnifiedSeverity.MEDIUM
        
        # Async issues (high priority)
        assert mapper.map_severity("ruff", "ASYNC100", "") == UnifiedSeverity.HIGH
        assert mapper.map_severity("ruff", "ASYNC", "") == UnifiedSeverity.HIGH
        
        # Import sorting
        assert mapper.map_severity("ruff", "I001", "") == UnifiedSeverity.MEDIUM
        assert mapper.map_severity("ruff", "I", "") == UnifiedSeverity.MEDIUM
        
        # Style issues
        assert mapper.map_severity("ruff", "E501", "") == UnifiedSeverity.LOW
        assert mapper.map_severity("ruff", "W291", "") == UnifiedSeverity.LOW
        assert mapper.map_severity("ruff", "D100", "") == UnifiedSeverity.LOW
    
    def test_mypy_severity_mapping(self, mapper):
        """Test MyPy-specific severity mappings"""
        # Errors
        assert mapper.map_severity("mypy", "assignment", "error") == UnifiedSeverity.HIGH
        assert mapper.map_severity("mypy", "return-value", "error") == UnifiedSeverity.HIGH
        
        # Warnings
        assert mapper.map_severity("mypy", "unused-ignore", "warning") == UnifiedSeverity.MEDIUM
        assert mapper.map_severity("mypy", "redundant-cast", "warning") == UnifiedSeverity.MEDIUM
        
        # Notes
        assert mapper.map_severity("mypy", "note", "note") == UnifiedSeverity.INFO
    
    def test_bandit_severity_mapping(self, mapper):
        """Test Bandit-specific severity mappings"""
        # High severity security issues
        assert mapper.map_severity("bandit", "B602", "HIGH") == UnifiedSeverity.CRITICAL
        assert mapper.map_severity("bandit", "B101", "HIGH") == UnifiedSeverity.CRITICAL
        
        # Medium severity security issues
        assert mapper.map_severity("bandit", "B303", "MEDIUM") == UnifiedSeverity.HIGH
        assert mapper.map_severity("bandit", "B104", "MEDIUM") == UnifiedSeverity.HIGH
        
        # Low severity security issues
        assert mapper.map_severity("bandit", "B105", "LOW") == UnifiedSeverity.MEDIUM
        assert mapper.map_severity("bandit", "B106", "LOW") == UnifiedSeverity.MEDIUM
    
    def test_pattern_matching(self, mapper):
        """Test pattern-based severity mapping"""
        # Test prefix matching for flake8
        assert mapper.map_severity("flake8", "E123", "") == UnifiedSeverity.LOW  # E1xx pattern
        assert mapper.map_severity("flake8", "E501", "") == UnifiedSeverity.MEDIUM  # E5xx pattern
        assert mapper.map_severity("flake8", "E999", "") == UnifiedSeverity.CRITICAL  # E9xx pattern
        
        # Test prefix matching for ruff
        assert mapper.map_severity("ruff", "S123", "") == UnifiedSeverity.HIGH  # S prefix
        assert mapper.map_severity("ruff", "B456", "") == UnifiedSeverity.HIGH  # B prefix
        assert mapper.map_severity("ruff", "PERF789", "") == UnifiedSeverity.MEDIUM  # PERF prefix
    
    def test_fallback_behavior(self, mapper):
        """Test fallback behavior for unknown tools/rules"""
        # Unknown tool should default to MEDIUM
        assert mapper.map_severity("unknown_tool", "UNKNOWN", "") == UnifiedSeverity.MEDIUM
        
        # Unknown rule in known tool should default to MEDIUM
        assert mapper.map_severity("flake8", "UNKNOWN999", "") == UnifiedSeverity.MEDIUM
        
        # Empty rule code should default to MEDIUM
        assert mapper.map_severity("flake8", "", "") == UnifiedSeverity.MEDIUM
    
    def test_violation_categorization(self, mapper):
        """Test violation categorization logic"""
        # Security patterns
        assert mapper.categorize_violation("bandit", "B602", "shell injection") == ViolationCategory.SECURITY
        assert mapper.categorize_violation("ruff", "S101", "security vulnerability") == ViolationCategory.SECURITY
        assert mapper.categorize_violation("flake8", "E999", "password in source") == ViolationCategory.SECURITY
        
        # Correctness patterns
        assert mapper.categorize_violation("flake8", "F821", "undefined name") == ViolationCategory.CORRECTNESS
        assert mapper.categorize_violation("mypy", "assignment", "syntax error") == ViolationCategory.CORRECTNESS
        assert mapper.categorize_violation("pylint", "E1120", "exception raised") == ViolationCategory.CORRECTNESS
        
        # Performance patterns
        assert mapper.categorize_violation("ruff", "PERF401", "slow operation") == ViolationCategory.PERFORMANCE
        assert mapper.categorize_violation("pylint", "W0612", "inefficient code") == ViolationCategory.PERFORMANCE
        
        # Style patterns
        assert mapper.categorize_violation("flake8", "E501", "line too long") == ViolationCategory.STYLE
        assert mapper.categorize_violation("ruff", "E203", "whitespace issues") == ViolationCategory.STYLE
        assert mapper.categorize_violation("pylint", "C0103", "naming convention") == ViolationCategory.STYLE
        
        # Documentation patterns
        assert mapper.categorize_violation("ruff", "D100", "missing docstring") == ViolationCategory.DOCUMENTATION
        assert mapper.categorize_violation("flake8", "D101", "documentation required") == ViolationCategory.DOCUMENTATION
        
        # Complexity patterns
        assert mapper.categorize_violation("pylint", "R0903", "too many arguments") == ViolationCategory.COMPLEXITY
        assert mapper.categorize_violation("flake8", "C901", "cyclomatic complexity") == ViolationCategory.COMPLEXITY
        
        # Testing patterns
        assert mapper.categorize_violation("pylint", "W0611", "test assertion") == ViolationCategory.TESTING
        assert mapper.categorize_violation("bandit", "B101", "mock fixture") == ViolationCategory.TESTING
        
        # Default fallback
        assert mapper.categorize_violation("flake8", "UNKNOWN", "some message") == ViolationCategory.MAINTAINABILITY
    
    def test_severity_distribution(self, mapper, sample_violations):
        """Test severity distribution calculation"""
        distribution = mapper.get_severity_distribution(sample_violations)
        
        # Should have all severity levels represented
        for severity in UnifiedSeverity:
            assert severity.value in distribution
            assert isinstance(distribution[severity.value], int)
            assert distribution[severity.value] >= 0
        
        # Total should match input violations
        total_violations = sum(distribution.values())
        assert total_violations == len(sample_violations)
        
        # Verify specific counts based on sample data
        assert distribution[UnifiedSeverity.CRITICAL.value] >= 1  # Bandit B602
        assert distribution[UnifiedSeverity.HIGH.value] >= 2  # Pylint E1120, MyPy error
    
    def test_category_distribution(self, mapper, sample_violations):
        """Test category distribution calculation"""
        distribution = mapper.get_category_distribution(sample_violations)
        
        # Should have all categories represented
        for category in ViolationCategory:
            assert category.value in distribution
            assert isinstance(distribution[category.value], int)
            assert distribution[category.value] >= 0
        
        # Total should match input violations
        total_violations = sum(distribution.values())
        assert total_violations == len(sample_violations)
        
        # Verify specific categories
        assert distribution[ViolationCategory.SECURITY.value] >= 1  # Bandit, Ruff S101
        assert distribution[ViolationCategory.STYLE.value] >= 1  # Flake8 E501
        assert distribution[ViolationCategory.CORRECTNESS.value] >= 2  # Pylint, MyPy
    
    def test_quality_score_calculation(self, mapper, sample_violations):
        """Test quality score calculation"""
        quality_metrics = mapper.calculate_quality_score(sample_violations)
        
        # Verify structure
        assert "quality_score" in quality_metrics
        assert "grade" in quality_metrics
        assert "total_violations" in quality_metrics
        assert "severity_distribution" in quality_metrics
        assert "category_distribution" in quality_metrics
        assert "recommendations" in quality_metrics
        
        # Verify quality score
        score = quality_metrics["quality_score"]
        assert isinstance(score, (int, float))
        assert 0 <= score <= 100
        
        # Verify grade
        grade = quality_metrics["grade"]
        assert grade in ["A", "B", "C", "D", "F"]
        
        # Verify total violations
        assert quality_metrics["total_violations"] == len(sample_violations)
        
        # Verify recommendations are provided
        recommendations = quality_metrics["recommendations"]
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0  # Should have recommendations for sample violations
    
    def test_quality_score_edge_cases(self, mapper):
        """Test quality score calculation edge cases"""
        # Empty violations should give perfect score
        empty_metrics = mapper.calculate_quality_score([])
        assert empty_metrics["quality_score"] == 100.0
        assert empty_metrics["grade"] == "A"
        assert empty_metrics["total_violations"] == 0
        assert len(empty_metrics["recommendations"]) == 0
        
        # High severity violations should significantly impact score
        critical_violations = [
            {
                "tool_name": "bandit",
                "rule_code": "B602",
                "message": "critical security issue",
                "tool_severity": "HIGH"
            }
        ] * 10  # Many critical violations
        
        critical_metrics = mapper.calculate_quality_score(critical_violations)
        assert critical_metrics["quality_score"] < 50  # Should be poor score
        assert critical_metrics["grade"] in ["D", "F"]
    
    def test_recommendation_generation(self, mapper):
        """Test recommendation generation logic"""
        # Critical violations should generate urgent recommendations
        critical_violations = [
            {
                "tool_name": "bandit",
                "rule_code": "B602", 
                "message": "shell injection",
                "tool_severity": "HIGH"
            }
        ]
        
        metrics = mapper.calculate_quality_score(critical_violations)
        recommendations = metrics["recommendations"]
        
        assert any("URGENT" in rec or "critical" in rec for rec in recommendations)
        
        # Many style violations should suggest auto-formatting
        style_violations = [
            {
                "tool_name": "flake8",
                "rule_code": "E501",
                "message": "line too long",
                "tool_severity": ""
            }
        ] * 25  # Many style issues
        
        style_metrics = mapper.calculate_quality_score(style_violations)
        style_recommendations = style_metrics["recommendations"]
        
        assert any("style" in rec or "formatter" in rec for rec in style_recommendations)
    
    def test_config_export(self, mapper):
        """Test configuration export functionality"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Test YAML export
            yaml_path = Path(temp_dir) / "config.yaml"
            mapper.export_config(str(yaml_path), "yaml")
            
            assert yaml_path.exists()
            with open(yaml_path, 'r') as f:
                yaml_config = yaml.safe_load(f)
            
            assert "tool_mappings" in yaml_config
            assert "flake8" in yaml_config["tool_mappings"]
            
            # Test JSON export
            json_path = Path(temp_dir) / "config.json"
            mapper.export_config(str(json_path), "json")
            
            assert json_path.exists()
            with open(json_path, 'r') as f:
                json_config = json.load(f)
            
            assert "tool_mappings" in json_config
            assert "flake8" in json_config["tool_mappings"]
    
    def test_custom_config_loading(self):
        """Test loading custom configuration"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create custom config
            config_path = Path(temp_dir) / "custom.yaml"
            custom_config = {
                "tool_mappings": {
                    "flake8": {
                        "E501": "low",  # Override default
                        "CUSTOM": "high"  # New rule
                    },
                    "custom_tool": {
                        "RULE1": "critical"
                    }
                }
            }
            
            with open(config_path, 'w') as f:
                yaml.dump(custom_config, f)
            
            # Load mapper with custom config
            mapper = UnifiedSeverityMapper(str(config_path))
            
            # Verify overrides applied
            assert mapper.map_severity("flake8", "E501", "") == UnifiedSeverity.LOW
            assert mapper.map_severity("flake8", "CUSTOM", "") == UnifiedSeverity.HIGH
            assert mapper.map_severity("custom_tool", "RULE1", "") == UnifiedSeverity.CRITICAL
    
    def test_thread_safety(self, mapper):
        """Test thread safety of mapper operations"""
        import threading
        import time
        
        results = []
        
        def worker():
            for _ in range(100):
                severity = mapper.map_severity("flake8", "E501", "")
                category = mapper.categorize_violation("flake8", "E501", "line too long")
                results.append((severity, category))
        
        # Run multiple threads
        threads = [threading.Thread(target=worker) for _ in range(5)]
        
        for thread in threads:
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # All results should be consistent
        assert len(results) == 500  # 5 threads * 100 iterations
        for severity, category in results:
            assert severity == UnifiedSeverity.MEDIUM
            assert category == ViolationCategory.STYLE

class TestSeverityRule:
    """Test suite for SeverityRule data class"""
    
    def test_severity_rule_creation(self):
        """Test SeverityRule object creation"""
        rule = SeverityRule(
            tool_name="flake8",
            rule_pattern="E5*",
            rule_codes=["E501", "E502", "E503"],
            unified_severity=UnifiedSeverity.MEDIUM,
            category=ViolationCategory.STYLE,
            description="Line length violations",
            rationale="Long lines reduce readability",
            examples=["E501: line too long", "E502: the backslash is redundant"]
        )
        
        assert rule.tool_name == "flake8"
        assert rule.rule_pattern == "E5*"
        assert "E501" in rule.rule_codes
        assert rule.unified_severity == UnifiedSeverity.MEDIUM
        assert rule.category == ViolationCategory.STYLE
        assert "readability" in rule.rationale
        assert len(rule.examples) == 2

class TestUnifiedSeverityEnums:
    """Test suite for unified severity and category enums"""
    
    def test_unified_severity_enum(self):
        """Test UnifiedSeverity enum values"""
        # Verify all severity levels exist
        assert UnifiedSeverity.CRITICAL.value == "critical"
        assert UnifiedSeverity.HIGH.value == "high" 
        assert UnifiedSeverity.MEDIUM.value == "medium"
        assert UnifiedSeverity.LOW.value == "low"
        assert UnifiedSeverity.INFO.value == "info"
        
        # Verify enum ordering (for comparison operations)
        severities = list(UnifiedSeverity)
        assert len(severities) == 5
    
    def test_violation_category_enum(self):
        """Test ViolationCategory enum values"""
        # Verify all categories exist
        expected_categories = {
            "security", "correctness", "performance", "maintainability",
            "style", "documentation", "testing", "complexity"
        }
        
        actual_categories = {cat.value for cat in ViolationCategory}
        assert actual_categories == expected_categories

class TestGlobalMapperInstance:
    """Test suite for global unified_mapper instance"""
    
    def test_global_instance_access(self):
        """Test global unified_mapper instance is accessible"""
        assert unified_mapper is not None
        assert isinstance(unified_mapper, UnifiedSeverityMapper)
        
        # Should have default mappings loaded
        assert len(unified_mapper.tool_mappings) >= 5
    
    def test_global_instance_functionality(self):
        """Test global instance works correctly"""
        # Test basic mapping
        severity = unified_mapper.map_severity("flake8", "E501", "")
        assert isinstance(severity, UnifiedSeverity)
        
        # Test categorization
        category = unified_mapper.categorize_violation("bandit", "B602", "security issue")
        assert isinstance(category, ViolationCategory)
        assert category == ViolationCategory.SECURITY

class TestSeverityMappingIntegration:
    """Integration tests for severity mapping with real violation data"""
    
    def test_real_world_violation_mapping(self):
        """Test mapping with realistic violation scenarios"""
        mapper = UnifiedSeverityMapper()
        
        # Real-world violation examples
        real_violations = [
            # Flake8 violations
            {"tool_name": "flake8", "rule_code": "E501", "message": "line too long (88 > 79 characters)"},
            {"tool_name": "flake8", "rule_code": "F401", "message": "'os' imported but unused"},
            {"tool_name": "flake8", "rule_code": "E302", "message": "expected 2 blank lines, found 1"},
            
            # Pylint violations
            {"tool_name": "pylint", "rule_code": "C0103", "message": "Variable name doesn't conform to snake_case naming style"},
            {"tool_name": "pylint", "rule_code": "E1101", "message": "Instance of 'dict' has no 'get' member"},
            {"tool_name": "pylint", "rule_code": "W0613", "message": "Unused argument 'self'"},
            
            # Bandit violations
            {"tool_name": "bandit", "rule_code": "B101", "message": "Test for use of assert"},
            {"tool_name": "bandit", "rule_code": "B602", "message": "subprocess call with shell=True identified"},
            
            # MyPy violations
            {"tool_name": "mypy", "rule_code": "assignment", "message": "Incompatible types in assignment"},
            {"tool_name": "mypy", "rule_code": "attr-defined", "message": "Module has no attribute"},
            
            # Ruff violations
            {"tool_name": "ruff", "rule_code": "F401", "message": "imported but unused"},
            {"tool_name": "ruff", "rule_code": "S101", "message": "Use of assert detected"},
        ]
        
        # Calculate quality metrics
        quality_metrics = mapper.calculate_quality_score(real_violations)
        
        # Should provide reasonable quality assessment
        assert 0 <= quality_metrics["quality_score"] <= 100
        assert quality_metrics["total_violations"] == len(real_violations)
        assert len(quality_metrics["recommendations"]) > 0
        
        # Should categorize violations appropriately
        category_dist = quality_metrics["category_distribution"]
        assert category_dist[ViolationCategory.SECURITY.value] >= 2  # B101, B602, S101
        assert category_dist[ViolationCategory.STYLE.value] >= 2  # E501, E302, C0103
        assert category_dist[ViolationCategory.CORRECTNESS.value] >= 3  # F401, E1101, assignment
    
    def test_severity_consistency_across_tools(self):
        """Test severity consistency for similar violations across tools"""
        mapper = UnifiedSeverityMapper()
        
        # Similar violations from different tools should have similar severities
        import_violations = [
            ("flake8", "F401", "imported but unused"),
            ("ruff", "F401", "imported but unused"),
            ("pylint", "W0611", "unused import")
        ]
        
        severities = []
        for tool, rule, message in import_violations:
            severity = mapper.map_severity(tool, rule, "")
            severities.append(severity)
        
        # Should all be similar severity (MEDIUM range)
        assert all(s in [UnifiedSeverity.LOW, UnifiedSeverity.MEDIUM] for s in severities)
        
        # Security violations should be consistently high across tools
        security_violations = [
            ("bandit", "B602", "shell injection"),
            ("ruff", "S602", "shell injection"),
        ]
        
        for tool, rule, message in security_violations:
            severity = mapper.map_severity(tool, rule, "")
            assert severity in [UnifiedSeverity.HIGH, UnifiedSeverity.CRITICAL]

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short"])