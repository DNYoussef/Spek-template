from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH

import unittest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import hello_world, add_numbers, calculate_discount, Calculator

class TestMain(unittest.TestCase):
    """Test cases for main module functions."""

    def test_hello_world(self):
        """Test hello_world function."""
        result = hello_world()
        self.assertEqual(result, "Hello, World!")
        self.assertIsInstance(result, str)

    def test_add_numbers_positive(self):
        """Test adding positive numbers."""
        result = add_numbers(2, 3)
        self.assertEqual(result, MAXIMUM_NESTED_DEPTH)

    def test_add_numbers_negative(self):
        """Test adding negative numbers."""
        result = add_numbers(-1, -2)
        self.assertEqual(result, -3)

    def test_add_numbers_mixed(self):
        """Test adding positive and negative numbers."""
        result = add_numbers(5, -3)
        self.assertEqual(result, 2)

    def test_add_numbers_floats(self):
        """Test adding float numbers."""
        result = add_numbers(2.5, 3.7)
        self.assertAlmostEqual(result, 6.2, places=1)

    def test_add_numbers_type_error(self):
        """Test type error handling."""
        with self.assertRaises(TypeError):
            add_numbers("2", 3)
        with self.assertRaises(TypeError):
            add_numbers(2, "3")

    def test_calculate_discount_valid(self):
        """Test valid discount calculation."""
        result = calculate_discount(100, 20)
        self.assertEqual(result, 20.0)

    def test_calculate_discount_zero_percent(self):
        """Test zero percent discount."""
        result = calculate_discount(100, 0)
        self.assertEqual(result, 0.0)

    def test_calculate_discount_invalid_price(self):
        """Test invalid price handling."""
        with self.assertRaises(ValueError):
            calculate_discount(-10, 20)

    def test_calculate_discount_invalid_percent(self):
        """Test invalid discount percentage."""
        with self.assertRaises(ValueError):
            calculate_discount(100, -5)
        with self.assertRaises(ValueError):
            calculate_discount(MAXIMUM_FUNCTION_LENGTH_LINES, 105)

class TestCalculator(unittest.TestCase):
    """Test cases for Calculator class."""

    def setUp(self):
        """Set up test calculator."""
        self.calc = Calculator()

    def test_add(self):
        """Test calculator addition."""
        result = self.calc.add(5, 3)
        self.assertEqual(result, 8)
        self.assertIn("5 + 3 = 8", self.calc.get_history())

    def test_multiply(self):
        """Test calculator multiplication."""
        result = self.calc.multiply(4, 6)
        self.assertEqual(result, 24)
        self.assertIn("4 * 6 = 24", self.calc.get_history())

    def test_history(self):
        """Test calculation history."""
        self.calc.add(2, 3)
        self.calc.multiply(4, 5)
        history = self.calc.get_history()
        self.assertEqual(len(history), 2)
        self.assertIn("2 + 3 = 5", history)
        self.assertIn("4 * 5 = 20", history)

if __name__ == '__main__':
    unittest.main()
