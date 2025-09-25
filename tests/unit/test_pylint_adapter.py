from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock

from src.adapters.pylint_adapter import PylintAdapter
from src.models.linter_models import LinterConfig, StandardSeverity, ViolationType

class TestPylintAdapter:
    """Test cases for PylintAdapter."""
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return LinterConfig(
            tool_name="pylint",
            executable_path="pylint"
        )
    
    @pytest.fixture
    def adapter(self, config):
        """Create PylintAdapter instance."""
        return PylintAdapter(config)
    
    def test_get_command_args(self, adapter):
        """Test command arguments generation."""
        target_paths = ["src/", "tests/"]
        cmd = adapter.get_command_args(target_paths)
        
        expected = [
            "pylint",
            "--output-format", "json",
            "--reports", "no",
            "src/",
            "tests/"
        ]
        
        assert cmd == expected
    
    def test_get_command_args_with_config_file(self, config):
        """Test command arguments with config file."""
        config.config_file = ".pylintrc"
        adapter = PylintAdapter(config)
        
        cmd = adapter.get_command_args(["src/"])
        assert "--rcfile" in cmd
        assert ".pylintrc" in cmd
    
    def test_parse_json_output(self, adapter):
        """Test parsing Pylint JSON output."""
        json_output = [
            {
                "type": "error",
                "module": "test",
                "obj": "function_name",
                "line": 10,
                "column": 5,
                "endLine": 10,
                "endColumn": 15,
                "path": "test.py",
                "symbol": "undefined-variable",
                "message": "Undefined variable 'x'",
                "message-id": "E1101",
                "category": "basic",
                "confidence": "HIGH"
            },
            {
                "type": "warning",
                "module": "test",
                "obj": "",
                "line": 20,
                "column": 0,
                "path": "test.py",
                "symbol": "unused-import",
                "message": "Unused import sys",
                "message-id": "W0611",
                "category": "imports",
                "confidence": "INFERENCE"
            }
        ]
        
        # Mock the safe_json_parse method to return our test data
        with patch.object(adapter, 'safe_json_parse', return_value=json_output):
            violations = adapter.parse_output(json.dumps(json_output))
        
        assert len(violations) == 2
        
        # Test first violation (error)
        v1 = violations[0]
        assert v1.rule_id == "undefined-variable"
        assert v1.message == "Undefined variable 'x'"
        assert v1.file_path == "test.py"
        assert v1.position.line == 10
        assert v1.position.column == 5
        assert v1.position.end_line == MAXIMUM_FUNCTION_PARAMETERS
        assert v1.position.end_column == 15
        assert v1.severity == StandardSeverity.ERROR
        assert v1.confidence == "HIGH"
        assert v1.rule_description == "function_name"
        
        # Test second violation (warning)
        v2 = violations[1]
        assert v2.rule_id == "unused-import"
        assert v2.message == "Unused import sys"
        assert v2.severity == StandardSeverity.WARNING
        assert v2.confidence == "INFERENCE"
    
    def test_normalize_severity(self, adapter):
        """Test severity normalization."""
        # Test message type strings
        assert adapter.normalize_severity("fatal") == StandardSeverity.FATAL
        assert adapter.normalize_severity("error") == StandardSeverity.ERROR
        assert adapter.normalize_severity("warning") == StandardSeverity.WARNING
        assert adapter.normalize_severity("refactor") == StandardSeverity.INFO
        assert adapter.normalize_severity("convention") == StandardSeverity.INFO
        assert adapter.normalize_severity("information") == StandardSeverity.INFO
        
        # Test single letter codes
        assert adapter.normalize_severity("F") == StandardSeverity.FATAL
        assert adapter.normalize_severity("E") == StandardSeverity.ERROR
        assert adapter.normalize_severity("W") == StandardSeverity.WARNING
        assert adapter.normalize_severity("R") == StandardSeverity.INFO
        assert adapter.normalize_severity("C") == StandardSeverity.INFO
        assert adapter.normalize_severity("I") == StandardSeverity.INFO
        
        # Test unknown severity
        assert adapter.normalize_severity("unknown") == StandardSeverity.WARNING
    
    def test_get_violation_type(self, adapter):
        """Test violation type determination."""
        # Test by rule ID prefix
        assert adapter.get_violation_type("C0103") == ViolationType.CONVENTION
        assert adapter.get_violation_type("R0903") == ViolationType.REFACTOR
        assert adapter.get_violation_type("W0611") == ViolationType.STYLE
        assert adapter.get_violation_type("E1101") == ViolationType.LOGIC
        assert adapter.get_violation_type("F0401") == ViolationType.SYNTAX
        
        # Test by category
        assert adapter.get_violation_type("", "typecheck") == ViolationType.TYPE
        assert adapter.get_violation_type("", "basic") == ViolationType.LOGIC
        assert adapter.get_violation_type("", "classes") == ViolationType.LOGIC
        assert adapter.get_violation_type("", "design") == ViolationType.REFACTOR
        assert adapter.get_violation_type("", "exceptions") == ViolationType.LOGIC
        assert adapter.get_violation_type("", "format") == ViolationType.STYLE
        assert adapter.get_violation_type("", "imports") == ViolationType.IMPORT
        assert adapter.get_violation_type("", "logging") == ViolationType.LOGIC
        assert adapter.get_violation_type("", "miscellaneous") == ViolationType.STYLE
        assert adapter.get_violation_type("", "newstyle") == ViolationType.CONVENTION
        assert adapter.get_violation_type("", "raw_metrics") == ViolationType.COMPLEXITY
        assert adapter.get_violation_type("", "refactoring") == ViolationType.REFACTOR
        assert adapter.get_violation_type("", "similarities") == ViolationType.REFACTOR
        assert adapter.get_violation_type("", "spelling") == ViolationType.CONVENTION
        assert adapter.get_violation_type("", "stdlib") == ViolationType.LOGIC
        assert adapter.get_violation_type("", "string") == ViolationType.LOGIC
        assert adapter.get_violation_type("", "variables") == ViolationType.LOGIC
        
        # Test unknown category
        assert adapter.get_violation_type("", "unknown") == ViolationType.STYLE
    
    def test_empty_output(self, adapter):
        """Test handling of empty output."""
        violations = adapter.parse_output("")
        assert violations == []
        
        violations = adapter.parse_output("[]")
        assert violations == []
    
    def test_malformed_json(self, adapter):
        """Test handling of malformed JSON."""
        with patch.object(adapter, 'safe_json_parse', return_value=[]):
            violations = adapter.parse_output('{"malformed": json')
            assert violations == []
    
    def test_rule_filtering(self, config):
        """Test rule enabling/disabling."""
        config.disabled_rules = ["unused-import"]
        adapter = PylintAdapter(config)
        
        json_output = [{
            "type": "warning",
            "path": "test.py",
            "line": 1,
            "column": 0,
            "symbol": "unused-import",
            "message": "Unused import sys"
        }]
        
        with patch.object(adapter, 'safe_json_parse', return_value=json_output):
            violations = adapter.parse_output(json.dumps(json_output))
        
        assert len(violations) == 0  # Rule should be filtered out
    
    def test_severity_overrides(self, config):
        """Test severity overrides."""
        config.severity_overrides = {"unused-import": StandardSeverity.ERROR}
        adapter = PylintAdapter(config)
        
        # Test override is applied
        severity = adapter.normalize_severity("warning", "unused-import")
        assert severity == StandardSeverity.ERROR
        
        # Test non-overridden rule
        severity = adapter.normalize_severity("warning", "unused-variable")
        assert severity == StandardSeverity.WARNING
    
    @pytest.mark.asyncio
    async def test_run_linter_success(self, adapter):
        """Test successful linter execution."""
        json_output = [{
            "type": "warning",
            "path": "test.py",
            "line": 1,
            "column": 0,
            "symbol": "unused-import",
            "message": "Unused import sys"
        }]
        
        mock_output = json.dumps(json_output)
        
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            # Mock successful process
            mock_process = AsyncMock()
            mock_process.communicate.return_value = (mock_output.encode(), b"")
            mock_process.returncode = 0
            mock_subprocess.return_value = mock_process
            
            # Mock version method
            adapter._version_cache = "2.15.0"
            
            result = await adapter.run_linter(["test.py"])
            
            assert result.tool == "pylint"
            assert result.exit_code == 0
            assert len(result.violations) == 1
            assert result.execution_time > 0
            assert result.files_analyzed == ["test.py"]
            assert result.version == "2.15.0"
    
    def test_confidence_level_mapping(self, adapter):
        """Test confidence level normalization."""
        assert adapter._get_confidence_level("HIGH") == "high"
        assert adapter._get_confidence_level("INFERENCE") == "medium"
        assert adapter._get_confidence_level("INFERENCE_FAILURE") == "low"
        assert adapter._get_confidence_level("UNDEFINED") == "unknown"
        assert adapter._get_confidence_level("other") == "other"
    
    def test_missing_required_fields(self, adapter):
        """Test handling of JSON with missing required fields."""
        json_output = [{
            "type": "warning",
            "path": "test.py",
            # Missing required fields like 'symbol', 'message', etc.
        }]
        
        with patch.object(adapter, 'safe_json_parse', return_value=json_output):
            violations = adapter.parse_output(json.dumps(json_output))
        
        # Should handle missing fields gracefully
        assert len(violations) == 0  # No rule_id means it gets filtered out
    
    def test_non_dict_json_items(self, adapter):
        """Test handling of non-dictionary items in JSON array."""
        json_output = [
            "not a dict",
            {"type": "warning", "symbol": "test", "path": "test.py", "line": 1, "message": "test"}
        ]
        
        with patch.object(adapter, 'safe_json_parse', return_value=json_output):
            violations = adapter.parse_output(json.dumps(json_output))
        
        # Should skip non-dict items and process valid ones
        assert len(violations) == 1