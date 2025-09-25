"""Main application module."""

def hello_world():
    """Return a greeting message."""
    return "Hello, World!"

def add_numbers(a, b):
    """Add two numbers and return the result."""
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("Arguments must be numbers")
    return a + b

def calculate_discount(price, discount_percent):
    """Calculate discount amount."""
    if price < 0 or discount_percent < 0 or discount_percent > 100:
        raise ValueError("Invalid price or discount percentage")
    return price * (discount_percent / 100)

class Calculator:
    """Simple calculator class."""

def __init__(self):
        self.history = []

def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result

def multiply(self, a, b):
        result = a * b
        self.history.append(f"{a} * {b} = {result}")
        return result

def get_history(self):
        return self.history.copy()
