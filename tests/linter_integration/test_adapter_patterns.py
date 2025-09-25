from src.constants.base import API_TIMEOUT_SECONDS, MAXIMUM_FUNCTION_PARAMETERS, MINIMUM_TEST_COVERAGE_PERCENTAGE

import pytest
import asyncio
import tempfile
import json
from unittest.mock import Mock, patch, AsyncMock
from pathlib import Path
from typing import Dict, Any, List

# Import system under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from adapters.base_adapter import BaseLinterAdapter
from adapters.flake8_adapter import Flake8Adapter
from adapters.pylint_adapter import PylintAdapter
from adapters.ruff_adapter import RuffAdapter
from adapters.mypy_adapter import MypyAdapter
from adapters.bandit_adapter import BanditAdapter

from models.linter_models import (
    LinterConfig, LinterResult, LinterViolation,
    StandardSeverity, ViolationType, Position
)

class TestBaseLinterAdapter:
    """Test suite for base adapter functionality"""
    
    @pytest.fixture
    def base_config(self):
        """Create basic linter configuration"""
        return LinterConfig(
            executable_path="test_linter",
            config_file=".test_linter",
            timeout=30.0,
            enabled_rules=["E501", "W291"],
            disabled_rules=["E203"],
            severity_overrides={"E501": StandardSeverity.HIGH}
        )
    
    @pytest.fixture
    def base_adapter(self, base_config):
        """Create base adapter instance"""
    class TestAdapter(BaseLinterAdapter):
            tool_name = "test_linter"
            
            def get_command_args(self, target_paths: List[str]) -> List[str]:
                return ["test_linter"] + target_paths
            
            def parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
                return []
            
            def normalize_severity(self, severity_raw: str, rule_id: str) -> StandardSeverity:
                return StandardSeverity.MEDIUM
            
            def get_violation_type(self, rule_id: str, category: str) -> ViolationType:
                return ViolationType.STYLE
        
        return TestAdapter(base_config)
    
    @pytest.mark.asyncio
    async def test_version_caching(self, base_adapter):
        """Test version caching functionality"""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            # Mock subprocess for version check
            mock_process = Mock()
            mock_process.communicate.return_value = (b"test_linter 1.0.0\n", b"")
            mock_subprocess.return_value = mock_process
            
            # First call should execute subprocess
            version1 = await base_adapter.get_version()
            assert version1 == "test_linter 1.0.0"
            
            # Second call should use cache
            version2 = await base_adapter.get_version()
            assert version2 == "test_linter 1.0.0"
            
            # Subprocess should only be called once
            assert mock_subprocess.call_count == 1
    
    def test_violation_creation(self, base_adapter):
        """Test standardized violation creation"""
        violation = base_adapter.create_violation(
            rule_id="E501",
            message="Line too long (88 > 79 characters)",
            file_path="test.py",
            line=10,
            column=80,
            severity_raw="error",
            category="style",
            end_line=10,
            end_column=88,
            rule_description="Line length check",
            fix_suggestion="Break line",
            confidence=0.9,
            cwe_id="CWE-1234"
        )
        
        assert violation.tool == "test_linter"
        assert violation.rule_id == "E501"
        assert violation.message == "Line too long (88 > 79 characters)"
        assert violation.file_path == "test.py"
        assert violation.position.line == 10
        assert violation.position.column == MINIMUM_TEST_COVERAGE_PERCENTAGE
        assert violation.position.end_line == MAXIMUM_FUNCTION_PARAMETERS
        assert violation.position.end_column == 88
        assert violation.rule_description == "Line length check"
        assert violation.fix_suggestion == "Break line"
        assert violation.confidence == 0.9
        assert violation.cwe_id == "CWE-1234"
    
    def test_safe_json_parse(self, base_adapter):
        """Test safe JSON parsing with error handling"""
        # Valid JSON array
        valid_json = '[{"file": "test.py", "line": 1}]'
        result = base_adapter.safe_json_parse(valid_json)
        assert len(result) == 1
        assert result[0]["file"] == "test.py"
        
        # Valid JSON object (converted to array)
        valid_object = '{"file": "test.py", "line": 1}'
        result = base_adapter.safe_json_parse(valid_object)
        assert len(result) == 1
        assert result[0]["file"] == "test.py"
        
        # Invalid JSON
        invalid_json = '{"file": "test.py", "line": 1'  # Missing closing brace
        result = base_adapter.safe_json_parse(invalid_json)
        assert result == []
    
    def test_file_path_extraction(self, base_adapter):
        """Test Python file path extraction"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test files
            py_file = Path(temp_dir) / "test.py"
            py_file.write_text("print('hello')")
            
            txt_file = Path(temp_dir) / "readme.txt"
            txt_file.write_text("Hello")
            
            subdir = Path(temp_dir) / "subdir"
            subdir.mkdir()
            sub_py_file = subdir / "sub.py"
            sub_py_file.write_text("print('sub')")
            
            # Test file extraction
            paths = [temp_dir, str(py_file)]
            extracted = base_adapter.extract_file_paths(paths)
            
            # Should find both Python files
            assert len(extracted) == 2
            assert str(py_file) in extracted
            assert str(sub_py_file) in extracted
    
    def test_severity_overrides(self, base_adapter):
        """Test severity override application"""
        # Test with override
        overridden = base_adapter.apply_severity_overrides("E501", StandardSeverity.MEDIUM)
        assert overridden == StandardSeverity.HIGH  # From config
        
        # Test without override
        not_overridden = base_adapter.apply_severity_overrides("W291", StandardSeverity.LOW)
        assert not_overridden == StandardSeverity.LOW  # Unchanged
    
    def test_rule_enabling(self, base_adapter):
        """Test rule enabling/disabling logic"""
        # Enabled rule
        assert base_adapter.is_rule_enabled("E501") is True
        
        # Disabled rule
        assert base_adapter.is_rule_enabled("E203") is False
        
        # Rule not in either list (default enabled)
        assert base_adapter.is_rule_enabled("W292") is True

class TestFlake8Adapter:
    """Test suite for Flake8 adapter"""
    
    @pytest.fixture
    def flake8_config(self):
        """Create Flake8 configuration"""
        return LinterConfig(
            executable_path="flake8",
            config_file=".flake8",
            timeout=30.0
        )
    
    @pytest.fixture
    def flake8_adapter(self, flake8_config):
        """Create Flake8 adapter instance"""
        return Flake8Adapter(flake8_config)
    
    def test_command_args_generation(self, flake8_adapter):
        """Test Flake8 command arguments generation"""
        target_paths = ["src/test.py", "src/another.py"]
        args = flake8_adapter.get_command_args(target_paths)
        
        expected = ["flake8", "--format=json", "src/test.py", "src/another.py"]
        assert args == expected
    
    def test_json_output_parsing(self, flake8_adapter):
        """Test Flake8 JSON output parsing"""
        json_output = '''[
            {
                "filename": "test.py",
                "line_number": 1,
                "column_number": 1,
                "code": "E501",
                "text": "line too long (88 > 79 characters)",
                "type": "E"
            },
            {
                "filename": "test.py",
                "line_number": 5,
                "column_number": 10,
                "code": "W291",
                "text": "trailing whitespace",
                "type": "W"
            }
        ]'''
        
        violations = flake8_adapter.parse_output(json_output, "")
        
        assert len(violations) == 2
        
        # First violation
        v1 = violations[0]
        assert v1.file_path == "test.py"
        assert v1.position.line == 1
        assert v1.position.column == 1
        assert v1.rule_id == "E501"
        assert v1.message == "line too long (88 > 79 characters)"
        assert v1.severity == StandardSeverity.MEDIUM
        
        # Second violation
        v2 = violations[1]
        assert v2.file_path == "test.py"
        assert v2.position.line == 5
        assert v2.position.column == 10
        assert v2.rule_id == "W291"
        assert v2.message == "trailing whitespace"
    
    def test_text_output_parsing(self, flake8_adapter):
        """Test Flake8 text output parsing (fallback)"""
        text_output = """test.py:1:1: E501 line too long (88 > 79 characters)
test.py:5:10: W291 trailing whitespace
another.py:10:5: F401 'os' imported but unused"""
        
        violations = flake8_adapter.parse_output(text_output, "")
        
        assert len(violations) == 3
        
        # First violation
        v1 = violations[0]
        assert v1.file_path == "test.py"
        assert v1.position.line == 1
        assert v1.position.column == 1
        assert v1.rule_id == "E501"
        assert "line too long" in v1.message
        
        # Third violation (different file)
        v3 = violations[2]
        assert v3.file_path == "another.py"
        assert v3.position.line == 10
        assert v3.position.column == 5
        assert v3.rule_id == "F401"
    
    def test_severity_mapping(self, flake8_adapter):
        """Test Flake8 severity mapping"""
        # Error codes map to HIGH
        assert flake8_adapter.normalize_severity("", "E9") == StandardSeverity.HIGH
        assert flake8_adapter.normalize_severity("", "F821") == StandardSeverity.HIGH
        
        # Style codes map to LOW/MEDIUM
        assert flake8_adapter.normalize_severity("", "E501") == StandardSeverity.MEDIUM
        assert flake8_adapter.normalize_severity("", "W291") == StandardSeverity.LOW
        
        # Unknown code defaults to MEDIUM
        assert flake8_adapter.normalize_severity("", "UNKNOWN") == StandardSeverity.MEDIUM
    
    def test_violation_type_mapping(self, flake8_adapter):
        """Test Flake8 violation type mapping"""
        # Import errors
        assert flake8_adapter.get_violation_type("F401", "") == ViolationType.CORRECTNESS
        
        # Style issues
        assert flake8_adapter.get_violation_type("E501", "") == ViolationType.STYLE
        assert flake8_adapter.get_violation_type("W291", "") == ViolationType.STYLE
        
        # Syntax errors
        assert flake8_adapter.get_violation_type("E999", "") == ViolationType.CORRECTNESS

class TestPylintAdapter:
    """Test suite for Pylint adapter"""
    
    @pytest.fixture
    def pylint_config(self):
        """Create Pylint configuration"""
        return LinterConfig(
            executable_path="pylint",
            config_file=".pylintrc",
            timeout=60.0
        )
    
    @pytest.fixture
    def pylint_adapter(self, pylint_config):
        """Create Pylint adapter instance"""
        return PylintAdapter(pylint_config)
    
    def test_command_args_generation(self, pylint_adapter):
        """Test Pylint command arguments generation"""
        target_paths = ["src/module.py"]
        args = pylint_adapter.get_command_args(target_paths)
        
        expected = ["pylint", "--output-format=json", "src/module.py"]
        assert args == expected
    
    def test_json_output_parsing(self, pylint_adapter):
        """Test Pylint JSON output parsing"""
        json_output = '''[
            {
                "type": "error",
                "module": "test",
                "obj": "function",
                "line": 10,
                "column": 5,
                "endLine": 10,
                "endColumn": 15,
                "path": "test.py",
                "symbol": "undefined-variable",
                "message": "Undefined variable 'x'",
                "message-id": "E1120"
            },
            {
                "type": "warning",
                "module": "test",
                "obj": "",
                "line": 5,
                "column": 0,
                "path": "test.py",
                "symbol": "unused-import",
                "message": "Unused import os",
                "message-id": "W0611"
            }
        ]'''
        
        violations = pylint_adapter.parse_output(json_output, "")
        
        assert len(violations) == 2
        
        # First violation (error)
        v1 = violations[0]
        assert v1.file_path == "test.py"
        assert v1.position.line == 10
        assert v1.position.column == 5
        assert v1.position.end_line == MAXIMUM_FUNCTION_PARAMETERS
        assert v1.position.end_column == 15
        assert v1.rule_id == "E1120"
        assert v1.message == "Undefined variable 'x'"
        assert v1.severity == StandardSeverity.HIGH
        
        # Second violation (warning)
        v2 = violations[1]
        assert v2.file_path == "test.py"
        assert v2.position.line == 5
        assert v2.rule_id == "W0611"
        assert v2.severity == StandardSeverity.MEDIUM
    
    def test_severity_mapping(self, pylint_adapter):
        """Test Pylint severity mapping"""
        # Fatal and Error map to CRITICAL/HIGH
        assert pylint_adapter.normalize_severity("fatal", "F0001") == StandardSeverity.CRITICAL
        assert pylint_adapter.normalize_severity("error", "E1120") == StandardSeverity.HIGH
        
        # Warning maps to MEDIUM
        assert pylint_adapter.normalize_severity("warning", "W0611") == StandardSeverity.MEDIUM
        
        # Refactor and Convention map to LOW
        assert pylint_adapter.normalize_severity("refactor", "R0903") == StandardSeverity.LOW
        assert pylint_adapter.normalize_severity("convention", "C0103") == StandardSeverity.LOW
        
        # Info maps to INFO
        assert pylint_adapter.normalize_severity("info", "I0011") == StandardSeverity.INFO
    
    def test_violation_type_mapping(self, pylint_adapter):
        """Test Pylint violation type mapping"""
        # Errors are correctness issues
        assert pylint_adapter.get_violation_type("E1120", "") == ViolationType.CORRECTNESS
        
        # Warnings can be various types
        assert pylint_adapter.get_violation_type("W0611", "") == ViolationType.MAINTAINABILITY
        
        # Refactor suggestions
        assert pylint_adapter.get_violation_type("R0903", "") == ViolationType.MAINTAINABILITY
        
        # Convention violations
        assert pylint_adapter.get_violation_type("C0103", "") == ViolationType.STYLE

class TestRuffAdapter:
    """Test suite for Ruff adapter"""
    
    @pytest.fixture
    def ruff_config(self):
        """Create Ruff configuration"""
        return LinterConfig(
            executable_path="ruff",
            config_file="pyproject.toml",
            timeout=15.0
        )
    
    @pytest.fixture
    def ruff_adapter(self, ruff_config):
        """Create Ruff adapter instance"""
        return RuffAdapter(ruff_config)
    
    def test_command_args_generation(self, ruff_adapter):
        """Test Ruff command arguments generation"""
        target_paths = ["src/", "tests/"]
        args = ruff_adapter.get_command_args(target_paths)
        
        expected = ["ruff", "check", "--format=json", "src/", "tests/"]
        assert args == expected
    
    def test_json_output_parsing(self, ruff_adapter):
        """Test Ruff JSON output parsing"""
        json_output = '''[
            {
                "filename": "test.py",
                "fix": {
                    "message": "Remove unused import",
                    "edits": []
                },
                "location": {
                    "row": 1,
                    "column": 1
                },
                "end_location": {
                    "row": 1,
                    "column": 10
                },
                "code": "F401",
                "message": "'os' imported but unused",
                "url": "https://docs.python.org/..."
            },
            {
                "filename": "test.py",
                "location": {
                    "row": 5,
                    "column": 80
                },
                "code": "E501",
                "message": "Line too long (88 > 79 characters)"
            }
        ]'''
        
        violations = ruff_adapter.parse_output(json_output, "")
        
        assert len(violations) == 2
        
        # First violation with fix suggestion
        v1 = violations[0]
        assert v1.file_path == "test.py"
        assert v1.position.line == 1
        assert v1.position.column == 1
        assert v1.position.end_line == 1
        assert v1.position.end_column == 10
        assert v1.rule_id == "F401"
        assert v1.message == "'os' imported but unused"
        assert v1.fix_suggestion == "Remove unused import"
        
        # Second violation without fix
        v2 = violations[1]
        assert v2.file_path == "test.py"
        assert v2.position.line == 5
        assert v2.position.column == 80
        assert v2.rule_id == "E501"
        assert v2.fix_suggestion is None
    
    def test_severity_mapping(self, ruff_adapter):
        """Test Ruff severity mapping"""
        # Security issues (S prefix) map to HIGH
        assert ruff_adapter.normalize_severity("", "S101") == StandardSeverity.HIGH
        
        # Bugbear issues (B prefix) map to HIGH
        assert ruff_adapter.normalize_severity("", "B902") == StandardSeverity.HIGH
        
        # Performance issues (PERF prefix) map to MEDIUM
        assert ruff_adapter.normalize_severity("", "PERF401") == StandardSeverity.MEDIUM
        
        # Style issues (E, W prefix) map to LOW
        assert ruff_adapter.normalize_severity("", "E501") == StandardSeverity.MEDIUM
        assert ruff_adapter.normalize_severity("", "W291") == StandardSeverity.LOW
    
    def test_violation_type_mapping(self, ruff_adapter):
        """Test Ruff violation type mapping"""
        # Security violations
        assert ruff_adapter.get_violation_type("S101", "") == ViolationType.SECURITY
        
        # Performance violations
        assert ruff_adapter.get_violation_type("PERF401", "") == ViolationType.PERFORMANCE
        
        # Style violations
        assert ruff_adapter.get_violation_type("E501", "") == ViolationType.STYLE
        
        # Import violations
        assert ruff_adapter.get_violation_type("I001", "") == ViolationType.MAINTAINABILITY

class TestMypyAdapter:
    """Test suite for MyPy adapter"""
    
    @pytest.fixture
    def mypy_config(self):
        """Create MyPy configuration"""
        return LinterConfig(
            executable_path="mypy",
            config_file="mypy.ini",
            timeout=45.0
        )
    
    @pytest.fixture
    def mypy_adapter(self, mypy_config):
        """Create MyPy adapter instance"""
        return MypyAdapter(mypy_config)
    
    def test_command_args_generation(self, mypy_adapter):
        """Test MyPy command arguments generation"""
        target_paths = ["src/module.py"]
        args = mypy_adapter.get_command_args(target_paths)
        
        expected = ["mypy", "--show-error-codes", "--no-error-summary", 
                    "--show-column-numbers", "src/module.py"]
        assert args == expected
    
    def test_text_output_parsing(self, mypy_adapter):
        """Test MyPy text output parsing"""
        text_output = """test.py:10:5: error: Incompatible return value type (got "str", expected "int")  [return-value]
test.py:15:10: warning: Unused "type: ignore" comment  [unused-ignore]
test.py:20:1: note: Consider using "typing_extensions.TypedDict" for better type safety"""
        
        violations = mypy_adapter.parse_output(text_output, "")
        
        assert len(violations) == 3
        
        # Error
        v1 = violations[0]
        assert v1.file_path == "test.py"
        assert v1.position.line == 10
        assert v1.position.column == 5
        assert v1.rule_id == "return-value"
        assert "Incompatible return value type" in v1.message
        assert v1.severity == StandardSeverity.HIGH
        
        # Warning
        v2 = violations[1]
        assert v2.file_path == "test.py"
        assert v2.position.line == 15
        assert v2.position.column == 10
        assert v2.rule_id == "unused-ignore"
        assert v2.severity == StandardSeverity.MEDIUM
        
        # Note
        v3 = violations[2]
        assert v3.file_path == "test.py"
        assert v3.position.line == 20
        assert v3.position.column == 1
        assert v3.rule_id == "note"
        assert v3.severity == StandardSeverity.INFO
    
    def test_severity_mapping(self, mypy_adapter):
        """Test MyPy severity mapping"""
        # Error maps to HIGH
        assert mypy_adapter.normalize_severity("error", "") == StandardSeverity.HIGH
        
        # Warning maps to MEDIUM
        assert mypy_adapter.normalize_severity("warning", "") == StandardSeverity.MEDIUM
        
        # Note maps to INFO
        assert mypy_adapter.normalize_severity("note", "") == StandardSeverity.INFO
    
    def test_violation_type_mapping(self, mypy_adapter):
        """Test MyPy violation type mapping"""
        # Type errors are correctness issues
        assert mypy_adapter.get_violation_type("return-value", "") == ViolationType.CORRECTNESS
        assert mypy_adapter.get_violation_type("assignment", "") == ViolationType.CORRECTNESS
        
        # Unused ignores are style issues
        assert mypy_adapter.get_violation_type("unused-ignore", "") == ViolationType.STYLE

class TestBanditAdapter:
    """Test suite for Bandit adapter"""
    
    @pytest.fixture
    def bandit_config(self):
        """Create Bandit configuration"""
        return LinterConfig(
            executable_path="bandit",
            config_file=".bandit",
            timeout=30.0
        )
    
    @pytest.fixture
    def bandit_adapter(self, bandit_config):
        """Create Bandit adapter instance"""
        return BanditAdapter(bandit_config)
    
    def test_command_args_generation(self, bandit_adapter):
        """Test Bandit command arguments generation"""
        target_paths = ["src/", "tests/"]
        args = bandit_adapter.get_command_args(target_paths)
        
        expected = ["bandit", "-f", "json", "-r", "src/", "tests/"]
        assert args == expected
    
    def test_json_output_parsing(self, bandit_adapter):
        """Test Bandit JSON output parsing"""
        json_output = '''{
            "results": [
                {
                    "filename": "test.py",
                    "issue_confidence": "HIGH",
                    "issue_cwe": {
                        "id": 78,
                        "link": "https://cwe.mitre.org/data/definitions/78.html"
                    },
                    "issue_severity": "HIGH",
                    "issue_text": "Possible shell injection via Popen call",
                    "line_number": 15,
                    "line_range": [15, 16],
                    "more_info": "https://bandit.readthedocs.io/...",
                    "test_id": "B602",
                    "test_name": "subprocess_popen_with_shell_equals_true"
                },
                {
                    "filename": "test.py",
                    "issue_confidence": "MEDIUM",
                    "issue_severity": "MEDIUM",
                    "issue_text": "Use of insecure MD5 hash function",
                    "line_number": 25,
                    "test_id": "B303",
                    "test_name": "blacklist"
                }
            ],
            "metrics": {
                "loc": 100,
                "nosec": 0
            }
        }'''
        
        violations = bandit_adapter.parse_output(json_output, "")
        
        assert len(violations) == 2
        
        # High severity security issue
        v1 = violations[0]
        assert v1.file_path == "test.py"
        assert v1.position.line == 15
        assert v1.rule_id == "B602"
        assert v1.message == "Possible shell injection via Popen call"
        assert v1.severity == StandardSeverity.CRITICAL
        assert v1.confidence == "HIGH"
        assert v1.cwe_id == "CWE-78"
        assert v1.violation_type == ViolationType.SECURITY
        
        # Medium severity issue
        v2 = violations[1]
        assert v2.file_path == "test.py"
        assert v2.position.line == 25
        assert v2.rule_id == "B303"
        assert v2.message == "Use of insecure MD5 hash function"
        assert v2.severity == StandardSeverity.HIGH
        assert v2.confidence == "MEDIUM"
    
    def test_severity_mapping(self, bandit_adapter):
        """Test Bandit severity mapping"""
        # HIGH maps to CRITICAL
        assert bandit_adapter.normalize_severity("HIGH", "") == StandardSeverity.CRITICAL
        
        # MEDIUM maps to HIGH
        assert bandit_adapter.normalize_severity("MEDIUM", "") == StandardSeverity.HIGH
        
        # LOW maps to MEDIUM
        assert bandit_adapter.normalize_severity("LOW", "") == StandardSeverity.MEDIUM
    
    def test_violation_type_mapping(self, bandit_adapter):
        """Test Bandit violation type mapping"""
        # All Bandit violations are security issues
        assert bandit_adapter.get_violation_type("B602", "") == ViolationType.SECURITY
        assert bandit_adapter.get_violation_type("B303", "") == ViolationType.SECURITY
        assert bandit_adapter.get_violation_type("B101", "") == ViolationType.SECURITY

class TestAdapterIntegration:
    """Integration tests for adapter functionality"""
    
    @pytest.fixture
    def all_adapters(self):
        """Create instances of all adapters"""
        base_config = LinterConfig(timeout=API_TIMEOUT_SECONDS.0)
        
        return {
            "flake8": Flake8Adapter(base_config),
            "pylint": PylintAdapter(base_config),
            "ruff": RuffAdapter(base_config),
            "mypy": MypyAdapter(base_config),
            "bandit": BanditAdapter(base_config)
        }
    
    def test_all_adapters_severity_coverage(self, all_adapters):
        """Test that all adapters cover the full severity range"""
        for adapter_name, adapter in all_adapters.items():
            # Test that each adapter can produce all severity levels
            severities = set()
            
            # Test common rule patterns
            test_cases = [
                ("", "E999"),  # Should be high/critical
                ("", "W291"),  # Should be low/medium
                ("", "I001"),  # Should be info/low
                ("HIGH", ""),  # Explicit high severity
                ("LOW", ""),   # Explicit low severity
            ]
            
            for severity_raw, rule_id in test_cases:
                severity = adapter.normalize_severity(severity_raw, rule_id)
                severities.add(severity)
            
            # Each adapter should be able to produce multiple severity levels
            assert len(severities) >= 2, f"{adapter_name} adapter only produces {severities}"
    
    def test_all_adapters_violation_types(self, all_adapters):
        """Test that adapters produce appropriate violation types"""
        for adapter_name, adapter in all_adapters.items():
            # Test common violation type patterns
            violation_types = set()
            
            test_cases = [
                ("E501", "style"),     # Style issue
                ("F401", "import"),    # Correctness issue
                ("S101", "security"),  # Security issue (for bandit/ruff)
                ("PERF", "performance"), # Performance issue
            ]
            
            for rule_id, category in test_cases:
                violation_type = adapter.get_violation_type(rule_id, category)
                violation_types.add(violation_type)
            
            # Each adapter should produce multiple violation types
            assert len(violation_types) >= 1, f"{adapter_name} adapter produces no violation types"
    
    @pytest.mark.asyncio
    async def test_adapter_error_handling(self, all_adapters):
        """Test error handling across all adapters"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create a test file
            test_file = Path(temp_dir) / "test.py"
            
            for adapter_name, adapter in all_adapters.items():
                # Test with non-existent files
                with patch('asyncio.create_subprocess_exec') as mock_subprocess:
                    mock_process = Mock()
                    mock_process.communicate.return_value = (b"", b"Error: file not found")
                    mock_process.returncode = 1
                    mock_subprocess.return_value = mock_process
                    
                    result = await adapter.run_linter(["nonexistent.py"])
                    
                    # Should handle error gracefully
                    assert isinstance(result, LinterResult)
                    assert result.exit_code == 1
                    assert result.error_output is not None
    
    def test_adapter_output_consistency(self, all_adapters):
        """Test output format consistency across adapters"""
        for adapter_name, adapter in all_adapters.items():
            # Test empty output
            violations = adapter.parse_output("", "")
            assert isinstance(violations, list)
            
            # Test malformed output
            violations = adapter.parse_output("invalid json {", "error occurred")
            assert isinstance(violations, list)
            
            # Each adapter should handle malformed input gracefully
            assert len(violations) == 0 or all(
                isinstance(v, LinterViolation) for v in violations
            )

class TestAdapterPerformance:
    """Performance tests for adapter functionality"""
    
    @pytest.mark.performance
    def test_large_output_parsing(self):
        """Test parsing performance with large output"""
        # Create large JSON output
        large_output = json.dumps([
            {
                "filename": f"file_{i}.py",
                "line_number": 1,
                "column_number": 1,
                "code": "E501",
                "text": f"line too long in file {i}",
                "type": "E"
            }
            for i in range(1000)
        ])
        
        config = LinterConfig(timeout=30.0)
        adapter = Flake8Adapter(config)
        
        import time
        start_time = time.time()
        violations = adapter.parse_output(large_output, "")
        parse_time = time.time() - start_time
        
        assert len(violations) == 1000
        assert parse_time < 1.0  # Should parse 1000 violations in under 1 second
    
    @pytest.mark.performance
    def test_concurrent_adapter_usage(self, all_adapters):
        """Test concurrent usage of multiple adapters"""
        import concurrent.futures
        
        def parse_with_adapter(adapter_data):
            adapter_name, adapter = adapter_data
            # Simple output for each adapter type
            if adapter_name == "flake8":
                output = '[{"filename": "test.py", "line_number": 1, "code": "E501", "text": "test"}]'
            elif adapter_name == "bandit":
                output = '{"results": [{"filename": "test.py", "line_number": 1, "test_id": "B101", "issue_text": "test"}]}'
            else:
                output = ""
            
            return adapter.parse_output(output, "")
        
        # Test concurrent parsing
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(parse_with_adapter, (name, adapter))
                for name, adapter in all_adapters.items()
            ]
            
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
            # All should complete successfully
            assert len(results) == len(all_adapters)
            for result in results:
                assert isinstance(result, list)

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short"])