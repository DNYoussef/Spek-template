"""Utility functions module."""

from typing import List, Dict, Any
import re

def format_string(text: str) -> str:
    """Format text to uppercase."""
    if not isinstance(text, str):
        raise TypeError("Input must be a string")
    return text.upper().strip()

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def calculate_percentage(part: float, whole: float) -> float:
    """Calculate percentage."""
    if whole == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return (part / whole) * 100

def filter_data(data: List[Dict[str, Any]], key: str, value: Any) -> List[Dict[str, Any]]:
    """Filter list of dictionaries by key-value pair."""
    return [item for item in data if item.get(key) == value]

def safe_divide(a: float, b: float) -> float:
    """Safely divide two numbers."""
    if b == 0:
        raise ZeroDivisionError("Division by zero is not allowed")
    return a / b
