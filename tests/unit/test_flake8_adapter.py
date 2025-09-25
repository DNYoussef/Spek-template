from src.constants.base import MAXIMUM_NESTED_DEPTH

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from pathlib import Path

from src.adapters.flake8_adapter import Flake8Adapter
from src.models.linter_models import LinterConfig, StandardSeverity, ViolationType

class TestFlake8Adapter:
    """Test cases for Flake8Adapter."""
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return LinterConfig(
            tool_name="flake8",
            executable_path="flake8",
            extra_args=["--max-line-length=88"]
        )
    
    @pytest.fixture
    def adapter(self, config):
        """Create Flake8Adapter instance."""
        return Flake8Adapter(config)
    
    def test_get_command_args(self, adapter):
        """Test command arguments generation."""
        target_paths = ["src/", "tests/"]
        cmd = adapter.get_command_args(target_paths)
        
        expected = [
            "flake8",
            "--format", 
            '{"file":"%(path)s","line":%(row)d,"column":%(col)d,"code":"%(code)s","text":"%(text)s"}',
            "--max-line-length=88",
            "src/",
            "tests/"
        ]
        
        assert cmd == expected
    
    def test_get_command_args_with_config_file(self, config):
        """Test command arguments with config file."""
        config.config_file = ".flake8"
        adapter = Flake8Adapter(config)
        
        cmd = adapter.get_command_args(["src/"])
        assert "--config" in cmd
        assert ".flake8" in cmd
    
    def test_parse_json_output(self, adapter):
        """Test parsing JSON-formatted output."""
        json_output = '''{"file":"test.py","line":1,"column":5,"code":"E501","text":"line too long"}
{"file":"test.py","line":2,"column":1,"code":"W292","text":"no newline at end of file"}'''
        
        violations = adapter.parse_output(json_output)
        
        assert len(violations) == 2
        
        # Test first violation
        v1 = violations[0]
        assert v1.rule_id == "E501"
        assert v1.message == "line too long"
        assert v1.file_path == "test.py"
        assert v1.position.line == 1
        assert v1.position.column == 5
        assert v1.severity == StandardSeverity.ERROR
        assert v1.violation_type == ViolationType.STYLE
        
        # Test second violation
        v2 = violations[1]
        assert v2.rule_id == "W292"
        assert v2.message == "no newline at end of file"
        assert v2.severity == StandardSeverity.WARNING
    
    def test_parse_text_output(self, adapter):
        """Test parsing standard text output."""
        text_output = """test.py:1:5: E501 line too long (89 > 79 characters)
test.py:2:1: W292 no newline at end of file
other.py:10:15: F401 'os' imported but unused"""
        
        violations = adapter.parse_output(text_output)
        
        assert len(violations) == 3
        
        # Test first violation
        v1 = violations[0]
        assert v1.rule_id == "E501"
        assert v1.file_path == "test.py"
        assert v1.position.line == 1
        assert v1.position.column == MAXIMUM_NESTED_DEPTH
        assert "line too long" in v1.message
        
        # Test third violation
        v3 = violations[2]
        assert v3.rule_id == "F401"
        assert v3.file_path == "other.py"
        assert v3.position.line == 10
        assert v3.position.column == 15
        assert v3.severity == StandardSeverity.ERROR  # F-codes are errors
    
    def test_normalize_severity(self, adapter):
        """Test severity normalization."""
        # Test with rule IDs
        assert adapter.normalize_severity("", "E501") == StandardSeverity.ERROR
        assert adapter.normalize_severity("", "W292") == StandardSeverity.WARNING
        assert adapter.normalize_severity("", "F401") == StandardSeverity.ERROR
        assert adapter.normalize_severity("", "C901") == StandardSeverity.WARNING
        assert adapter.normalize_severity("", "N806") == StandardSeverity.WARNING
        
        # Test with severity strings
        assert adapter.normalize_severity("error") == StandardSeverity.ERROR
        assert adapter.normalize_severity("warning") == StandardSeverity.WARNING
        assert adapter.normalize_severity("fatal") == StandardSeverity.FATAL
    
    def test_get_violation_type(self, adapter):
        """Test violation type determination."""
        assert adapter.get_violation_type("E501") == ViolationType.STYLE
        assert adapter.get_violation_type("W292") == ViolationType.STYLE
        assert adapter.get_violation_type("F401") == ViolationType.LOGIC
        assert adapter.get_violation_type("C901") == ViolationType.COMPLEXITY
        assert adapter.get_violation_type("N806") == ViolationType.CONVENTION
        assert adapter.get_violation_type("B902") == ViolationType.LOGIC
        assert adapter.get_violation_type("S101") == ViolationType.SECURITY
        assert adapter.get_violation_type("I001") == ViolationType.IMPORT
        assert adapter.get_violation_type("D100") == ViolationType.CONVENTION
    
    def test_empty_output(self, adapter):
        """Test handling of empty output."""
        violations = adapter.parse_output("")
        assert violations == []
        
        violations = adapter.parse_output("   \n  \n")
        assert violations == []
    
    def test_malformed_json(self, adapter):
        """Test handling of malformed JSON."""
        malformed_json = '{"file":"test.py","line":1,"code":"E501"'  # Missing closing brace
        
        violations = adapter.parse_output(malformed_json)
        assert violations == []  # Should gracefully handle malformed JSON
    
    def test_rule_filtering(self, config):
        """Test rule enabling/disabling."""
        config.disabled_rules = ["E501"]
        adapter = Flake8Adapter(config)
        
        json_output = '{"file":"test.py","line":1,"column":5,"code":"E501","text":"line too long"}'
        violations = adapter.parse_output(json_output)
        
        assert len(violations) == 0  # Rule should be filtered out
    
    def test_severity_overrides(self, config):
        """Test severity overrides."""
        config.severity_overrides = {"W292": StandardSeverity.ERROR}
        adapter = Flake8Adapter(config)
        
        # Test override is applied
        severity = adapter.normalize_severity("warning", "W292")
        assert severity == StandardSeverity.ERROR
        
        # Test non-overridden rule
        severity = adapter.normalize_severity("warning", "W291")
        assert severity == StandardSeverity.WARNING
    
    @pytest.mark.asyncio
    async def test_run_linter_success(self, adapter):
        """Test successful linter execution."""
        mock_output = '{"file":"test.py","line":1,"column":5,"code":"E501","text":"line too long"}'
        
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            # Mock successful process
            mock_process = AsyncMock()
            mock_process.communicate.return_value = (mock_output.encode(), b"")
            mock_process.returncode = 0
            mock_subprocess.return_value = mock_process
            
            # Mock version method
            adapter._version_cache = "5.0.0"
            
            result = await adapter.run_linter(["test.py"])
            
            assert result.tool == "flake8"
            assert result.exit_code == 0
            assert len(result.violations) == 1
            assert result.execution_time > 0
            assert result.files_analyzed == ["test.py"]
            assert result.version == "5.0.0"
    
    @pytest.mark.asyncio
    async def test_run_linter_timeout(self, config):
        """Test linter timeout handling."""
        config.timeout = 1  # 1 second timeout
        adapter = Flake8Adapter(config)
        
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            # Mock process that times out
            mock_process = AsyncMock()
            mock_process.communicate.side_effect = asyncio.TimeoutError()
            mock_subprocess.return_value = mock_process
            
            result = await adapter.run_linter(["test.py"])
            
            assert result.exit_code == -1
            assert "timed out" in result.error_output.lower()
    
    @pytest.mark.asyncio
    async def test_run_linter_execution_error(self, adapter):
        """Test linter execution error handling."""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            mock_subprocess.side_effect = FileNotFoundError("flake8 not found")
            
            result = await adapter.run_linter(["test.py"])
            
            assert result.exit_code == -1
            assert result.error_output is not None
            assert len(result.violations) == 0
    
    def test_category_mapping(self, adapter):
        """Test category description mapping."""
        assert adapter._get_category_from_code("E501") == "PEP8 Error"
        assert adapter._get_category_from_code("W292") == "PEP8 Warning"
        assert adapter._get_category_from_code("F401") == "PyFlakes"
        assert adapter._get_category_from_code("C901") == "Complexity"
        assert adapter._get_category_from_code("N806") == "Naming"
        assert adapter._get_category_from_code("B902") == "Bugbear"
        assert adapter._get_category_from_code("S101") == "Security"
        assert adapter._get_category_from_code("I001") == "Import"
        assert adapter._get_category_from_code("D100") == "Docstring"
        assert adapter._get_category_from_code("T001") == "Type Hint"
        assert adapter._get_category_from_code("P001") == "Performance"
        assert adapter._get_category_from_code("X999") == "Unknown (X)"
    
    def test_validate_config(self, adapter):
        """Test configuration validation."""
        with patch('shutil.which') as mock_which:
            mock_which.return_value = "/usr/bin/flake8"
            assert adapter.validate_config() is True
            
            mock_which.return_value = None
            assert adapter.validate_config() is False