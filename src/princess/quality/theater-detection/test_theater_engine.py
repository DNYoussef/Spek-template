#!/usr/bin/env python3
"""
Theater Detection Engine Test Suite
Quality Princess Domain - SPEK Enhanced Development Platform

MISSION: Comprehensive testing of theater detection capabilities
AUTHORITY: Validation testing framework for quality gates
TARGET: 100% test coverage with real-world theater pattern validation
"""

from pathlib import Path
import json
import os
import sys
import tempfile
import unittest

# Add the parent directory to the path to import the theater detection engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from comprehensive_analysis_engine import (
    TheaterDetectionEngine,
    ASTTheaterDetector,
    ComplexityAnalyzer,
    AuthenticityValidator,
    TheaterPattern,
    ComplexityMetrics,
    AuthenticityScore
)

class TestTheaterDetectionEngine(unittest.TestCase):
    """Test suite for theater detection engine"""

    def setUp(self):
        """Set up test environment"""
        self.engine = TheaterDetectionEngine()
        self.test_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test environment"""
        import shutil
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_mock_function_detection(self):
        """Test detection of mock function implementations"""
        mock_code = '''
def process_payment(amount):
    pass

def authenticate_user(username, password):
    return True

def send_email(to, subject, body):
    return "success"
'''
        test_file = os.path.join(self.test_dir, 'mock_service.py')
        with open(test_file, 'w') as f:
            f.write(mock_code)

        results = self.engine.scan_directory(self.test_dir)
        score = results['mock_service.py']

        # Should detect theater patterns
        self.assertLess(score.overall_score, 60, "Mock implementations should fail theater detection")

        # Should detect specific patterns
        pattern_types = [p.pattern_type for p in score.theater_patterns]
        self.assertIn('empty_function', pattern_types)
        self.assertIn('hardcoded_return', pattern_types)

    def test_not_implemented_detection(self):
        """Test detection of NotImplementedError placeholders"""
        not_implemented_code = '''
class PaymentProcessor:
    def process_payment(self, amount):
        raise NotImplementedError("Payment processing not implemented")

    def refund_payment(self, transaction_id):
        raise NotImplementedError()
'''
        test_file = os.path.join(self.test_dir, 'payment_processor.py')
        with open(test_file, 'w') as f:
            f.write(not_implemented_code)

        results = self.engine.scan_directory(self.test_dir)
        score = results['payment_processor.py']

        # Should detect critical theater patterns
        self.assertLess(score.overall_score, 40, "NotImplementedError should fail theater detection")

        # Should detect critical severity patterns
        critical_patterns = [p for p in score.theater_patterns if p.severity == 'critical']
        self.assertGreater(len(critical_patterns), 0, "Should detect critical theater patterns")

    def test_genuine_implementation_recognition(self):
        """Test recognition of genuine implementations"""
        genuine_code = '''
import logging
import hashlib
from typing import Optional

class UserAuthenticator:
    def __init__(self, database_connection):
        self.db = database_connection
        self.logger = logging.getLogger(__name__)

    def authenticate_user(self, username: str, password: str) -> Optional[dict]:
        try:
            # Hash password for comparison
            password_hash = hashlib.sha256(password.encode()).hexdigest()

            # Query database for user
            user = self.db.query("SELECT * FROM users WHERE username = %s", (username,))

            if user and user['password_hash'] == password_hash:
                self.logger.info(f"User {username} authenticated successfully")
                return {
                    'user_id': user['id'],
                    'username': user['username'],
                    'role': user['role']
                }
            else:
                self.logger.warning(f"Authentication failed for user {username}")
                return None

        except Exception as e:
            self.logger.error(f"Authentication error: {str(e)}")
            raise

    def validate_password_strength(self, password: str) -> bool:
        if len(password) < 8:
            return False

        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*" for c in password)

        return has_upper and has_lower and has_digit and has_special
'''
        test_file = os.path.join(self.test_dir, 'user_authenticator.py')
        with open(test_file, 'w') as f:
            f.write(genuine_code)

        results = self.engine.scan_directory(self.test_dir)
        score = results['user_authenticator.py']

        # Should pass theater detection
        self.assertGreaterEqual(score.overall_score, 60, "Genuine implementation should pass theater detection")

        # Should have fewer theater patterns
        self.assertLessEqual(len(score.theater_patterns), 2, "Genuine code should have minimal theater patterns")

    def test_complexity_analysis(self):
        """Test complexity analysis functionality"""
        complex_code = '''
def complex_function(data):
    result = []
    for item in data:
        if item > 0:
            if item % 2 == 0:
                for i in range(item):
                    if i % 3 == 0:
                        result.append(i * 2)
                    elif i % 5 == 0:
                        result.append(i * 3)
                    else:
                        result.append(i)
            else:
                while item > 1:
                    if item % 2 == 0:
                        item = item // 2
                    else:
                        item = item * 3 + 1
                    result.append(item)
        elif item < 0:
            result.append(abs(item))
    return result
'''
        test_file = os.path.join(self.test_dir, 'complex_code.py')
        with open(test_file, 'w') as f:
            f.write(complex_code)

        results = self.engine.scan_directory(self.test_dir)
        score = results['complex_code.py']

        # Should detect high complexity
        complexity = score.complexity_metrics
        self.assertGreater(complexity.cyclomatic, 5, "Should detect high cyclomatic complexity")
        self.assertGreater(complexity.cognitive, 5, "Should detect high cognitive complexity")

    def test_quality_gate_generation(self):
        """Test quality gate report generation"""
        # Create multiple test files with different quality levels
        test_files = {
            'good_code.py': '''
def calculate_total(items):
    """Calculate total price of items with tax."""
    if not items:
        return 0.0

    subtotal = sum(item.price for item in items)
    tax_rate = 0.8
    total = subtotal * (1 + tax_rate)
    return round(total, 2)
''',
            'bad_code.py': '''
def process_order(order):
    pass

def send_confirmation():
    return "OK"
''',
            'mock_code.py': '''
class FakePaymentGateway:
    def charge(self, amount):
        return True

    def refund(self, transaction_id):
        raise NotImplementedError()
'''
        }

        for filename, code in test_files.items():
            test_file = os.path.join(self.test_dir, filename)
            with open(test_file, 'w') as f:
                f.write(code)

        # Scan directory and generate report
        results = self.engine.scan_directory(self.test_dir)
        report = self.engine.generate_quality_report(results)

        # Verify report structure
        self.assertIn('summary', report)
        self.assertIn('pattern_analysis', report)
        self.assertIn('file_scores', report)
        self.assertIn('recommendations', report)

        # Check summary data
        summary = report['summary']
        self.assertEqual(summary['total_files_analyzed'], 3)
        self.assertIn('gate_pass_rate', summary)
        self.assertIn('average_authenticity_score', summary)

        # Check that bad files are identified
        file_scores = report['file_scores']
        self.assertLess(file_scores['bad_code.py'], 60)
        self.assertLess(file_scores['mock_code.py'], 60)

    def test_theater_pattern_types(self):
        """Test detection of different theater pattern types"""
        pattern_examples = {
            'empty_function': 'def empty_func(): pass',
            'hardcoded_return': 'def fake_func(): return "success"',
            'theater_naming': 'def mock_authenticate(): return True',
            'theater_class': 'class MockDatabase: pass'
        }

        for pattern_type, code in pattern_examples.items():
            test_file = os.path.join(self.test_dir, f'{pattern_type}_test.py')
            with open(test_file, 'w') as f:
                f.write(code)

            results = self.engine.scan_directory(self.test_dir, ['.py'])
            score = results[f'{pattern_type}_test.py']

            # Should detect the specific pattern type
            detected_patterns = [p.pattern_type for p in score.theater_patterns]
            self.assertTrue(
                any(pattern_type in dp for dp in detected_patterns),
                f"Should detect {pattern_type} pattern"
            )

    def test_evidence_based_scoring(self):
        """Test evidence-based authenticity scoring"""
        evidence_code = '''
import logging
import json
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class ConfigurationManager:
    """Manages application configuration with validation and error handling."""

    def __init__(self, config_file: str):
        self.config_file = config_file
        self.config_data = {}
        self.load_configuration()

    def load_configuration(self) -> None:
        """Load configuration from file with error handling."""
        try:
            with open(self.config_file, 'r') as f:
                self.config_data = json.load(f)

            self.validate_configuration()
            logger.info(f"Configuration loaded from {self.config_file}")

        except FileNotFoundError:
            logger.error(f"Configuration file not found: {self.config_file}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in configuration file: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error loading configuration: {e}")
            raise

    def validate_configuration(self) -> None:
        """Validate configuration data."""
        required_keys = ['database_url', 'api_key', 'debug_mode']

        for key in required_keys:
            if key not in self.config_data:
                raise ValueError(f"Missing required configuration key: {key}")

        # Validate database URL
        if not self.config_data['database_url'].startswith(('postgresql://', 'mysql://')):
            raise ValueError("Invalid database URL format")

    def get(self, key: str, default=None):
        """Get configuration value with default fallback."""
        return self.config_data.get(key, default)
'''
        test_file = os.path.join(self.test_dir, 'config_manager.py')
        with open(test_file, 'w') as f:
            f.write(evidence_code)

        results = self.engine.scan_directory(self.test_dir)
        score = results['config_manager.py']

        # Should score high due to evidence indicators
        self.assertGreaterEqual(score.overall_score, 75, "Evidence-rich code should score high")

        # Check implementation evidence
        evidence = score.implementation_evidence
        self.assertTrue(evidence['has_error_handling'], "Should detect error handling")
        self.assertTrue(evidence['has_logging'], "Should detect logging")
        self.assertTrue(evidence['has_validation'], "Should detect validation")
        self.assertGreater(evidence['docstring_count'], 0, "Should detect docstrings")

    def test_file_extension_filtering(self):
        """Test file extension filtering"""
        # Create files with different extensions
        test_files = {
            'test.py': 'def test(): pass',
            'test.js': 'function test() { return true; }',
            'test.txt': 'This is a text file',
            'test.json': '{"test": true}'
        }

        for filename, content in test_files.items():
            test_file = os.path.join(self.test_dir, filename)
            with open(test_file, 'w') as f:
                f.write(content)

        # Scan with Python files only
        results = self.engine.scan_directory(self.test_dir, ['.py'])
        self.assertIn('test.py', results)
        self.assertNotIn('test.js', results)
        self.assertNotIn('test.txt', results)

        # Scan with multiple extensions
        results = self.engine.scan_directory(self.test_dir, ['.py', '.js'])
        self.assertIn('test.py', results)
        self.assertIn('test.js', results)
        self.assertNotIn('test.txt', results)

    def test_command_line_interface(self):
        """Test command-line interface functionality"""
        # Create test file
        test_code = '''
def mock_function():
    pass

def another_mock():
    return "fake result"
'''
        test_file = os.path.join(self.test_dir, 'cli_test.py')
        with open(test_file, 'w') as f:
            f.write(test_code)

        # Test CLI through subprocess
        import subprocess
        script_path = os.path.join(os.path.dirname(__file__), 'comprehensive_analysis_engine.py')

        result = subprocess.run([
            sys.executable, script_path, self.test_dir, '--threshold', '60'
        ], capture_output=True, text=True)

        # Should exit with error code due to low quality
        self.assertNotEqual(result.returncode, 0, "Should fail quality gate")

        # Should contain analysis output
        output = result.stdout
        self.assertIn('Files analyzed:', output)
        self.assertIn('Gate status:', output)

class TestASTTheaterDetector(unittest.TestCase):
    """Test suite for AST theater detector"""

    def setUp(self):
        self.detector = ASTTheaterDetector()

    def test_function_analysis(self):
        """Test function-specific theater detection"""
        import ast

        # Test empty function
        code = "def empty(): pass"
        tree = ast.parse(code)
        patterns = []
        for node in ast.walk(tree):
            patterns.extend(self.detector.analyze_ast_node(node, code.splitlines()))

        empty_patterns = [p for p in patterns if p.pattern_type == 'empty_function']
        self.assertGreater(len(empty_patterns), 0, "Should detect empty function")

    def test_class_analysis(self):
        """Test class-specific theater detection"""
        import ast

        # Test mock class
        code = "class MockService: pass"
        tree = ast.parse(code)
        patterns = []
        for node in ast.walk(tree):
            patterns.extend(self.detector.analyze_ast_node(node, code.splitlines()))

        theater_patterns = [p for p in patterns if 'theater' in p.pattern_type]
        self.assertGreater(len(theater_patterns), 0, "Should detect theater class")

class TestComplexityAnalyzer(unittest.TestCase):
    """Test suite for complexity analyzer"""

    def setUp(self):
        self.analyzer = ComplexityAnalyzer()

    def test_cyclomatic_complexity(self):
        """Test cyclomatic complexity calculation"""
        import ast

        complex_code = '''
def complex_func(x):
    if x > 0:
        if x > 10:
            return x * 2
        else:
            return x
    elif x < 0:
        return abs(x)
    else:
        return 0
'''
        tree = ast.parse(complex_code)
        metrics = self.analyzer.analyze_complexity(tree, complex_code.splitlines())

        # Should detect multiple decision points (>=3 is acceptable for this complexity)
        self.assertGreaterEqual(metrics.cyclomatic, 3, "Should detect high cyclomatic complexity")

    def test_function_counting(self):
        """Test function and class counting"""
        import ast

        code = '''
class TestClass:
    def method1(self):
        pass

    def method2(self):
        pass

def standalone_function():
    pass
'''
        tree = ast.parse(code)
        metrics = self.analyzer.analyze_complexity(tree, code.splitlines())

        self.assertEqual(metrics.class_count, 1, "Should count one class")
        self.assertEqual(metrics.function_count, 3, "Should count three functions")

if __name__ == '__main__':
    # Run all tests
    unittest.main(verbosity=2)