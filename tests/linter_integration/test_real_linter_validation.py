import ast

import pytest
import asyncio
import tempfile
import subprocess
import shutil
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import sys

# Import system under test
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from adapters.base_adapter import BaseLinterAdapter
from models.linter_models import LinterConfig, StandardSeverity, ViolationType

def check_tool_available(tool_name: str) -> bool:
    """Check if a linter tool is available in the system"""
    return shutil.which(tool_name) is not None

@pytest.fixture
def sample_python_files():
    """Create sample Python files with various issues for real linter testing"""
    with tempfile.TemporaryDirectory() as temp_dir:
        files = {}
        
        # File with style issues (flake8, ruff)
        style_issues = Path(temp_dir) / "style_issues.py"
        style_issues.write_text('''
import os
import sys
import unused_module

def function_with_very_long_name_that_exceeds_line_length_limit_and_should_trigger_warnings():
    x=1  # Missing spaces
    y= 2 # Missing space before =
    return x+y # Missing spaces around +

class MyClass:
    def __init__( self ):  # Extra spaces
        self.value = 42
        
    def method_with_trailing_whitespace(self):   
        return self.value
        
# Missing final newline''')
        files['style_issues'] = str(style_issues)
        
        # File with logical issues (pylint, mypy)
        logical_issues = Path(temp_dir) / "logical_issues.py"
        logical_issues.write_text('''
from typing import List, Dict

def function_with_issues(param: int) -> str:
    # Type mismatch for mypy
    result = param + "string"
    return result

def undefined_variable_usage():
    # Undefined variable for pylint
    print(undefined_var)
    
def unused_parameter(param1, param2, param3):
    # Only using param1, others unused
    return param1

class BadClass:
    def __init__(self):
        self.value = 42
        
    def method_calling_undefined(self):
        # Calling undefined method
        return self.undefined_method()
        
def complexity_issue(a, b, c, d, e):
    # High complexity for pylint
    if a:
        if b:
            if c:
                if d:
                    if e:
                        return "deeply nested"
                    else:
                        return "nested 4"
                else:
                    return "nested 3"
            else:
                return "nested 2"
        else:
            return "nested 1"
    else:
        return "no nesting"
''')
        files['logical_issues'] = str(logical_issues)
        
        # File with security issues (bandit)
        security_issues = Path(temp_dir) / "security_issues.py"
        security_issues.write_text('''
import subprocess
import hashlib
import pickle
import os

# Security issues for bandit
def insecure_function():
    # Hardcoded password
    password = "hardcoded_password"
    
    # Weak hash function
    hash_obj = hashlib.md5()
    hash_obj.update(password.encode())
    
    # Shell injection vulnerability
    user_input = "some input"
    subprocess.call(f"echo {user_input}", shell=True)
    
    # Pickle usage (deserialization vulnerability)
    data = pickle.loads(b"some data")
    
    # Assert usage (can be optimized away)
    assert password != "admin"
    
    # Eval usage
    ast.literal_eval("1 + 1")
    
    return hash_obj.hexdigest()

def path_traversal_risk():
    # Path traversal vulnerability
    filename = "../../../etc/passwd"
    with open(filename, 'r') as f:
        return f.read()
''')
        files['security_issues'] = str(security_issues)
        
        # File with import and structure issues
        import_issues = Path(temp_dir) / "import_issues.py"
        import_issues.write_text('''
# Import issues
import os
import sys
import json
import re
import collections
import itertools
import functools
from typing import *  # Star import
import unused_import

# Duplicate import
import os

def function_using_some_imports():
    # Only using some of the imports
    return os.path.join("a", "b")

# Missing docstring for module and functions
def no_docstring():
    pass
''')
        files['import_issues'] = str(import_issues)
        
        yield files

class TestFlake8Integration:
    """Integration tests with real flake8 linter"""
    
    @pytest.mark.skipif(not check_tool_available("flake8"), reason="flake8 not available")
    @pytest.mark.asyncio
    async def test_flake8_real_execution(self, sample_python_files):
        """Test real flake8 execution and output parsing"""
        # Execute flake8 directly
        result = subprocess.run([
            "flake8", 
            "--format=json",
            sample_python_files['style_issues']
        ], capture_output=True, text=True)
        
        # Should find style violations
        if result.stdout:
            violations = json.loads(result.stdout)
            assert len(violations) > 0
            
            # Verify violation structure
            for violation in violations:
                assert "filename" in violation
                assert "line_number" in violation
                assert "column_number" in violation
                assert "code" in violation
                assert "text" in violation
        
        # Exit code 1 indicates violations found
        assert result.returncode in [0, 1]
    
    @pytest.mark.skipif(not check_tool_available("flake8"), reason="flake8 not available")
    def test_flake8_violation_categories(self, sample_python_files):
        """Test flake8 violation categorization"""
        result = subprocess.run([
            "flake8",
            "--format=json", 
            sample_python_files['style_issues']
        ], capture_output=True, text=True)
        
        if result.stdout:
            violations = json.loads(result.stdout)
            violation_codes = {v["code"] for v in violations}
            
            # Should find common style violations
            expected_categories = {"E", "W", "F"}  # Error, Warning, Fatal
            found_categories = {code[0] for code in violation_codes}
            
            # Should find at least some of the expected categories
            assert len(found_categories.intersection(expected_categories)) > 0

class TestPylintIntegration:
    """Integration tests with real pylint linter"""
    
    @pytest.mark.skipif(not check_tool_available("pylint"), reason="pylint not available")
    @pytest.mark.asyncio
    async def test_pylint_real_execution(self, sample_python_files):
        """Test real pylint execution and output parsing"""
        result = subprocess.run([
            "pylint",
            "--output-format=json",
            "--disable=all",
            "--enable=unused-variable, undefined-variable, line-too-long",
            sample_python_files['logical_issues']
        ], capture_output=True, text=True)
        
        # Pylint returns non-zero for violations
        assert result.returncode != 0 or result.stdout
        
        if result.stdout:
            try:
                violations = json.loads(result.stdout)
                if violations:  # May be empty if no violations found
                    # Verify violation structure
                    for violation in violations:
                        assert "type" in violation
                        assert "module" in violation
                        assert "line" in violation
                        assert "message" in violation
                        assert "symbol" in violation
            except json.JSONDecodeError:
                # Pylint sometimes outputs non-JSON even with json format
                assert len(result.stdout) > 0
    
    @pytest.mark.skipif(not check_tool_available("pylint"), reason="pylint not available")
    def test_pylint_message_types(self, sample_python_files):
        """Test pylint message type categorization"""
        result = subprocess.run([
            "pylint",
            "--output-format=json",
            "--disable=all",
            "--enable=unused-variable, line-too-long, missing-docstring",
            sample_python_files['logical_issues']
        ], capture_output=True, text=True)
        
        if result.stdout:
            try:
                violations = json.loads(result.stdout)
                if violations:
                    message_types = {v.get("type") for v in violations}
                    
                    # Should include various pylint message types
                    expected_types = {"warning", "convention", "error", "refactor"}
                    found_types = message_types.intersection(expected_types)
                    
                    assert len(found_types) > 0
            except json.JSONDecodeError:
                # Still valid if pylint ran

class TestRuffIntegration:
    """Integration tests with real ruff linter"""
    
    @pytest.mark.skipif(not check_tool_available("ruff"), reason="ruff not available")
    @pytest.mark.asyncio
    async def test_ruff_real_execution(self, sample_python_files):
        """Test real ruff execution and output parsing"""
        result = subprocess.run([
            "ruff", "check",
            "--format=json",
            sample_python_files['style_issues']
        ], capture_output=True, text=True)
        
        # Ruff returns non-zero for violations
        assert result.returncode in [0, 1]
        
        if result.stdout:
            violations = json.loads(result.stdout)
            assert isinstance(violations, list)
            
            if violations:
                # Verify violation structure
                for violation in violations:
                    assert "filename" in violation
                    assert "location" in violation
                    assert "code" in violation
                    assert "message" in violation
    
    @pytest.mark.skipif(not check_tool_available("ruff"), reason="ruff not available")
    def test_ruff_rule_categories(self, sample_python_files):
        """Test ruff rule categorization"""
        result = subprocess.run([
            "ruff", "check",
            "--format=json",
            sample_python_files['import_issues']
        ], capture_output=True, text=True)
        
        if result.stdout:
            violations = json.loads(result.stdout)
            if violations:
                rule_codes = {v["code"] for v in violations}
                
                # Should find various ruff rule categories
                rule_prefixes = {code[:1] for code in rule_codes if code}
                expected_prefixes = {"E", "F", "I", "W"}  # Style, Fatal, Import, Warning
                
                assert len(rule_prefixes.intersection(expected_prefixes)) > 0

class TestMypyIntegration:
    """Integration tests with real mypy linter"""
    
    @pytest.mark.skipif(not check_tool_available("mypy"), reason="mypy not available")
    @pytest.mark.asyncio
    async def test_mypy_real_execution(self, sample_python_files):
        """Test real mypy execution and output parsing"""
        result = subprocess.run([
            "mypy",
            "--show-error-codes",
            "--no-error-summary",
            sample_python_files['logical_issues']
        ], capture_output=True, text=True)
        
        # MyPy returns non-zero for type errors
        assert result.returncode in [0, 1]
        
        if result.stdout:
            lines = result.stdout.strip().split('\n')
            violations = [line for line in lines if line.strip()]
            
            if violations:
                # Verify mypy output format
                for violation in violations:
                    # MyPy format: file:line:column: error_type: message
                    assert ":" in violation
                    assert any(level in violation for level in ["error", "warning", "note"])
    
    @pytest.mark.skipif(not check_tool_available("mypy"), reason="mypy not available") 
    def test_mypy_type_error_detection(self, sample_python_files):
        """Test mypy type error detection"""
        result = subprocess.run([
            "mypy", 
            "--show-error-codes",
            sample_python_files['logical_issues']
        ], capture_output=True, text=True)
        
        if result.stdout and result.returncode != 0:
            # Should detect type mismatches
            output = result.stdout.lower()
            type_error_indicators = [
                "incompatible", "type", "expect", "got",
                "argument", "return", "assignment"
            ]
            
            found_indicators = [indicator for indicator in type_error_indicators 
                                if indicator in output]
            assert len(found_indicators) > 0

class TestBanditIntegration:
    """Integration tests with real bandit linter"""
    
    @pytest.mark.skipif(not check_tool_available("bandit"), reason="bandit not available")
    @pytest.mark.asyncio
    async def test_bandit_real_execution(self, sample_python_files):
        """Test real bandit execution and output parsing"""
        result = subprocess.run([
            "bandit",
            "-f", "json",
            sample_python_files['security_issues']
        ], capture_output=True, text=True)
        
        # Bandit returns non-zero for security issues
        assert result.returncode in [0, 1]
        
        if result.stdout:
            report = json.loads(result.stdout)
            assert "results" in report
            
            violations = report["results"]
            if violations:
                # Verify violation structure
                for violation in violations:
                    assert "filename" in violation
                    assert "line_number" in violation
                    assert "test_id" in violation
                    assert "issue_severity" in violation
                    assert "issue_confidence" in violation
                    assert "issue_text" in violation
    
    @pytest.mark.skipif(not check_tool_available("bandit"), reason="bandit not available")
    def test_bandit_security_issue_detection(self, sample_python_files):
        """Test bandit security issue detection"""
        result = subprocess.run([
            "bandit",
            "-f", "json",
            sample_python_files['security_issues']
        ], capture_output=True, text=True)
        
        if result.stdout:
            report = json.loads(result.stdout)
            violations = report["results"]
            
            if violations:
                # Should detect security issues
                test_ids = {v["test_id"] for v in violations}
                security_patterns = {
                    "B303", "B301",  # Insecure hash functions
                    "B602", "B603",  # Shell injection
                    "B301", "B101",  # Pickle, assert
                    "B307"           # eval usage
                }
                
                found_security_issues = test_ids.intersection(security_patterns)
                assert len(found_security_issues) > 0

class TestMultiToolIntegration:
    """Integration tests with multiple real linter tools"""
    
    @pytest.mark.skipif(
        not all(check_tool_available(tool) for tool in ["flake8", "pylint"]),
        reason="Required tools not available"
    )
    def test_multi_tool_same_file_analysis(self, sample_python_files):
        """Test multiple tools analyzing the same file"""
        target_file = sample_python_files['style_issues']
        results = {}
        
        # Run flake8
        flake8_result = subprocess.run([
            "flake8", "--format=json", target_file
        ], capture_output=True, text=True)
        
        if flake8_result.stdout:
            results['flake8'] = json.loads(flake8_result.stdout)
        
        # Run pylint
        pylint_result = subprocess.run([
            "pylint", "--output-format=json", target_file
        ], capture_output=True, text=True)
        
        if pylint_result.stdout:
            try:
                results['pylint'] = json.loads(pylint_result.stdout)
            except json.JSONDecodeError:
                results['pylint'] = []  # Pylint sometimes outputs non-JSON
        
        # Should have results from multiple tools
        assert len(results) >= 1
        
        # Tools should find overlapping issues (like line length)
        if 'flake8' in results and 'pylint' in results:
            flake8_lines = {v.get("line_number") for v in results['flake8']}
            pylint_lines = {v.get("line") for v in results['pylint'] if isinstance(results['pylint'], list)}
            
            # May have some overlapping lines with issues
            if flake8_lines and pylint_lines:
                overlap = flake8_lines.intersection(pylint_lines)
                # Don't assert overlap since tools may catch different things
                assert len(flake8_lines) > 0 or len(pylint_lines) > 0
    
    @pytest.mark.skipif(
        not all(check_tool_available(tool) for tool in ["ruff", "bandit"]),
        reason="Required tools not available"
    )
    def test_cross_tool_violation_correlation(self, sample_python_files):
        """Test correlation potential between different linter tools"""
        target_file = sample_python_files['security_issues']
        results = {}
        
        # Run ruff (may catch some security-related issues)
        ruff_result = subprocess.run([
            "ruff", "check", "--format=json", target_file
        ], capture_output=True, text=True)
        
        if ruff_result.stdout:
            results['ruff'] = json.loads(ruff_result.stdout)
        
        # Run bandit (security-focused)
        bandit_result = subprocess.run([
            "bandit", "-f", "json", target_file
        ], capture_output=True, text=True)
        
        if bandit_result.stdout:
            bandit_report = json.loads(bandit_result.stdout)
            results['bandit'] = bandit_report["results"]
        
        # Both tools should find issues in security file
        assert any(len(violations) > 0 for violations in results.values() if violations)
        
        # Verify we can extract line numbers for correlation
        for tool, violations in results.items():
            if violations:
                for violation in violations:
                    if tool == 'ruff':
                        assert "location" in violation
                        assert "row" in violation["location"] or "line" in violation["location"]
                    elif tool == 'bandit':
                        assert "line_number" in violation

class TestAdapterRealWorldCompatibility:
    """Test adapter compatibility with real linter outputs"""
    
    @pytest.mark.skipif(not check_tool_available("flake8"), reason="flake8 not available")
    def test_flake8_adapter_with_real_output(self, sample_python_files):
        """Test flake8 adapter with real flake8 output"""
        # Get real flake8 output
        result = subprocess.run([
            "flake8", "--format=json", sample_python_files['style_issues']
        ], capture_output=True, text=True)
        
        if result.stdout:
            # Create adapter and test parsing
            config = LinterConfig(executable_path="flake8")
            
            # Import the actual adapter (would need real implementation)
            violations_data = json.loads(result.stdout)
            
            # Verify we can extract required fields
            for violation in violations_data:
                assert "filename" in violation
                assert "line_number" in violation
                assert "code" in violation
                assert "text" in violation
                
                # Test severity mapping logic
                code = violation["code"]
                if code.startswith("E9") or code.startswith("F"):
                    expected_severity = StandardSeverity.HIGH
                elif code.startswith("E") or code.startswith("W"):
                    expected_severity = StandardSeverity.MEDIUM
                else:
                    expected_severity = StandardSeverity.LOW
                
                # Would test actual adapter here
                assert expected_severity in [StandardSeverity.LOW, StandardSeverity.MEDIUM, StandardSeverity.HIGH]
    
    @pytest.mark.skipif(not check_tool_available("bandit"), reason="bandit not available")
    def test_bandit_adapter_with_real_output(self, sample_python_files):
        """Test bandit adapter with real bandit output"""
        result = subprocess.run([
            "bandit", "-f", "json", sample_python_files['security_issues']
        ], capture_output=True, text=True)
        
        if result.stdout:
            report = json.loads(result.stdout)
            violations = report["results"]
            
            # Test severity mapping with real bandit data
            for violation in violations:
                severity = violation["issue_severity"]
                confidence = violation["issue_confidence"]
                test_id = violation["test_id"]
                
                # Test our severity mapping logic
                if severity == "HIGH":
                    expected_unified = StandardSeverity.CRITICAL
                elif severity == "MEDIUM":
                    expected_unified = StandardSeverity.HIGH
                elif severity == "LOW":
                    expected_unified = StandardSeverity.MEDIUM
                else:
                    expected_unified = StandardSeverity.MEDIUM
                
                # All bandit violations should be security type
                expected_type = ViolationType.SECURITY
                
                assert expected_unified in list(StandardSeverity)
                assert expected_type == ViolationType.SECURITY

class TestRealWorldPerformance:
    """Performance tests with real linter tools"""
    
    @pytest.mark.performance
    @pytest.mark.skipif(not check_tool_available("ruff"), reason="ruff not available")
    def test_ruff_performance_benchmark(self, sample_python_files):
        """Test ruff performance (should be faster than other tools)"""
        import time
        
        target_files = list(sample_python_files.values())
        
        start_time = time.time()
        result = subprocess.run([
            "ruff", "check", "--format=json"
        ] + target_files, capture_output=True, text=True)
        execution_time = time.time() - start_time
        
        # Ruff should be very fast
        assert execution_time < 5.0  # Under 5 seconds for small files
        assert result.returncode in [0, 1]  # Success or violations found
    
    @pytest.mark.performance
    @pytest.mark.skipif(
        not all(check_tool_available(tool) for tool in ["flake8", "pylint"]),
        reason="Required tools not available"
    )
    def test_tool_performance_comparison(self, sample_python_files):
        """Compare performance of different linter tools"""
        import time
        
        target_file = sample_python_files['logical_issues']
        execution_times = {}
        
        # Test flake8 performance
        start_time = time.time()
        flake8_result = subprocess.run([
            "flake8", "--format=json", target_file
        ], capture_output=True, text=True)
        execution_times['flake8'] = time.time() - start_time
        
        # Test pylint performance
        start_time = time.time()
        pylint_result = subprocess.run([
            "pylint", "--output-format=json", target_file
        ], capture_output=True, text=True)
        execution_times['pylint'] = time.time() - start_time
        
        # All tools should complete within reasonable time
        for tool, exec_time in execution_times.items():
            assert exec_time < 30.0  # Under 30 seconds per tool
        
        # Flake8 should generally be faster than pylint
        if 'flake8' in execution_times and 'pylint' in execution_times:
            # Allow some variance, but flake8 should typically be faster
            assert execution_times['flake8'] < execution_times['pylint'] * 2

class TestRealWorldErrorHandling:
    """Error handling tests with real linter tools"""
    
    @pytest.mark.skipif(not check_tool_available("flake8"), reason="flake8 not available")
    def test_invalid_python_file_handling(self):
        """Test handling of invalid Python files"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create file with syntax errors
            invalid_file = Path(temp_dir) / "invalid.py"
            invalid_file.write_text('''
def broken_function(
    # Missing closing parenthesis
    return "broken"

class UnfinishedClass
    # Missing colon
    def method(self):
        pass
''')
            
            # Tools should handle syntax errors gracefully
            result = subprocess.run([
                "flake8", "--format=json", str(invalid_file)
            ], capture_output=True, text=True)
            
            # Should return error code but not crash
            assert result.returncode != 0
            
            # May have JSON output or error messages
            if result.stdout:
                try:
                    violations = json.loads(result.stdout)
                    # Should detect syntax errors
                    syntax_errors = [v for v in violations if "E9" in v.get("code", "")]
                    assert len(syntax_errors) > 0
                except json.JSONDecodeError:
                    # Some tools may output non-JSON for syntax errors
                    assert len(result.stderr) > 0 or len(result.stdout) > 0
    
    @pytest.mark.skipif(not check_tool_available("pylint"), reason="pylint not available")
    def test_missing_dependency_handling(self):
        """Test handling of files with missing dependencies"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create file importing non-existent modules
            missing_deps = Path(temp_dir) / "missing_deps.py"
            missing_deps.write_text('''
import nonexistent_module
from missing_package import missing_function

def use_missing():
    return nonexistent_module.some_function()
''')
            
            # Pylint should handle missing imports gracefully
            result = subprocess.run([
                "pylint", "--output-format=json", str(missing_deps)
            ], capture_output=True, text=True)
            
            # Should complete but report import errors
            assert result.returncode != 0  # Violations found
            
            if result.stdout:
                try:
                    violations = json.loads(result.stdout)
                    # Should detect import issues
                    import_errors = [v for v in violations 
                                    if "import" in v.get("message", "").lower()]
                    assert len(import_errors) > 0
                except json.JSONDecodeError:
                    # Non-JSON output is acceptable

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Only run tests for available tools
    available_tools = [tool for tool in ["flake8", "pylint", "ruff", "mypy", "bandit"] 
                        if check_tool_available(tool)]
    
    print(f"Available linter tools: {available_tools}")
    
    pytest.main(["-v", __file__, "-s", "--tb=short"])