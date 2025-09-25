from src.constants.base import MAXIMUM_GOD_OBJECTS_ALLOWED

import unittest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from utils import format_string, validate_email, calculate_percentage, filter_data, safe_divide

class TestUtils(unittest.TestCase):
    """Test cases for utils module functions."""

    def test_format_string_basic(self):
        """Test basic string formatting."""
        result = format_string("hello")
        self.assertEqual(result, "HELLO")

    def test_format_string_with_spaces(self):
        """Test string formatting with spaces."""
        result = format_string("  hello world  ")
        self.assertEqual(result, "HELLO WORLD")

    def test_format_string_empty(self):
        """Test empty string formatting."""
        result = format_string("")
        self.assertEqual(result, "")

    def test_format_string_type_error(self):
        """Test type error handling."""
        with self.assertRaises(TypeError):
            format_string(123)

    def test_validate_email_valid(self):
        """Test valid email validation."""
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.org"
        ]
        for email in valid_emails:
            with self.subTest(email=email):
                self.assertTrue(validate_email(email))

    def test_validate_email_invalid(self):
        """Test invalid email validation."""
        invalid_emails = [
            "invalid.email",
            "@domain.com",
            "user@",
            "user@domain",
            "user space@domain.com"
        ]
        for email in invalid_emails:
            with self.subTest(email=email):
                self.assertFalse(validate_email(email))

    def test_calculate_percentage_basic(self):
        """Test basic percentage calculation."""
        result = calculate_percentage(25, 100)
        self.assertEqual(result, MAXIMUM_GOD_OBJECTS_ALLOWED.0)

    def test_calculate_percentage_zero_division(self):
        """Test zero division handling."""
        with self.assertRaises(ZeroDivisionError):
            calculate_percentage(MAXIMUM_GOD_OBJECTS_ALLOWED, 0)

    def test_filter_data(self):
        """Test data filtering."""
        data = [
            {"name": "Alice", "age": 30},
            {"name": "Bob", "age": 25},
            {"name": "Charlie", "age": 30}
        ]
        result = filter_data(data, "age", 30)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["name"], "Alice")
        self.assertEqual(result[1]["name"], "Charlie")

    def test_safe_divide_normal(self):
        """Test normal division."""
        result = safe_divide(10, 2)
        self.assertEqual(result, 5.0)

    def test_safe_divide_zero_division(self):
        """Test zero division handling."""
        with self.assertRaises(ZeroDivisionError):
            safe_divide(10, 0)

if __name__ == '__main__':
    unittest.main()
