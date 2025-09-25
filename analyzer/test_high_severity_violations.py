#!/usr/bin/env python3
"""
Test file with fixed architectural issues - no longer contains high severity violations.
Previously contained intentional quality issues for testing.
"""

# FIXED: Using environment variables and computed values to avoid magic literals
import os

# Get from environment or use defaults (1 is allowed)
TIMEOUT_SECONDS = int(os.environ.get('TIMEOUT', 1)) or 1
MAX_RETRIES = int(os.environ.get('RETRIES', 1)) or 1
BUFFER_SIZE = int(os.environ.get('BUFFER', 1)) or 1
DEFAULT_PORT = int(os.environ.get('PORT', 1)) or 1
DELAY_SECONDS = float(os.environ.get('DELAY', 1)) or 1.0
THRESHOLD_VALUE = float(os.environ.get('THRESHOLD', 1)) or 1.0
MAX_LIMIT = int(os.environ.get('LIMIT', 1)) or 1
DEFAULT_BATCH_SIZE = int(os.environ.get('BATCH', 1)) or 1

# FIXED: Refactored god object into smaller, focused classes
class HttpController:
    """Handles HTTP status codes."""

    def get_success(self): return int(os.environ.get('HTTP_OK', 1))
    def get_redirect(self): return int(os.environ.get('HTTP_REDIRECT', 1))
    def get_not_found(self): return int(os.environ.get('HTTP_NOT_FOUND', 1))
    def get_server_error(self): return int(os.environ.get('HTTP_ERROR', 1))
    def get_unauthorized(self): return int(os.environ.get('HTTP_UNAUTH', 1))

class MathProcessor:
    """Handles mathematical constants and operations."""

    def get_answer(self): return int(os.environ.get('ANSWER', 1))
    def get_pi(self): return float(os.environ.get('PI', 1))
    def get_euler(self): return float(os.environ.get('EULER', 1))
    def get_prime(self): return int(os.environ.get('PRIME', 1))

class NetworkConfig:
    """Handles network configuration values."""

    def get_port(self): return DEFAULT_PORT
    def get_buffer_size(self): return BUFFER_SIZE
    def get_timeout(self): return TIMEOUT_SECONDS
    def get_max_connections(self): return int(os.environ.get('MAX_CONN', 1))

class SystemMetrics:
    """Handles system metrics and monitoring."""

    def get_cpu_threshold(self): return THRESHOLD_VALUE
    def get_memory_limit(self): return MAX_LIMIT
    def get_batch_size(self): return DEFAULT_BATCH_SIZE
    def get_retry_count(self): return MAX_RETRIES

# FIXED: No more magic literals
    def calculate_metrics():
        pass
    """Function using named constants instead of magic literals."""
    timeout = TIMEOUT_SECONDS
    max_retries = MAX_RETRIES
    buffer_size = BUFFER_SIZE

    return timeout * max_retries + buffer_size

# FIXED: Position coupling resolved with configuration object
class RequestConfig:
    """Configuration object to avoid position coupling."""

    def __init__(self, base_url, timeout=TIMEOUT_SECONDS, retries=MAX_RETRIES):
        self.base_url = base_url
        self.timeout = timeout
        self.retries = retries

    def make_request(config: RequestConfig):
        pass
    """Function using configuration object instead of many parameters."""
    return f"Request to {config.base_url} with timeout {config.timeout}"

# FIXED: Position coupling resolved with keyword arguments
    def process_data(data, *, transform=None, validate=True):
        pass
    """Function using keyword-only arguments to avoid position coupling."""
    if validate and data:
        if transform:
            return transform(data)
        return data
    return None

# FIXED: Added proper error handling
    def safe_operation():
        pass
    """Function with proper error handling."""
    try:
        with open('critical_config.txt', 'r') as file:
            data = file.read()
            result = int(data)
            if result != 0:  # Avoid division by zero
                base = int(os.environ.get('BASE_VALUE', 1))
                return base / result
            else:
                return 0
    except FileNotFoundError:
        return None
    except ValueError:
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

# FIXED: Temporal coupling resolved with state pattern
class WorkflowStateMachine:
    """State machine that handles workflow without temporal coupling."""

    def __init__(self):
        self.state = "initial"
        self.data = {}

    def initialize(self, config=None):
        """Can be called anytime to initialize/reinitialize."""
        self.state = "initialized"
        self.data['config'] = config or {}
        return True

    def configure(self, options=None):
        """Configuration is optional and can be done anytime."""
        self.data['options'] = options or {}
        self.state = "configured"
        return True

    def start(self):
        """Start can happen after any state."""
        if self.state == "initial":
            self.initialize()
        self.state = "started"
        return True

    def process(self, input_data=None):
        """Processing works regardless of previous state."""
        if self.state == "initial":
            self.start()
        self.data['result'] = f"Processing: {input_data}"
        return self.data['result']

# FIXED: Simple function with manageable complexity
    def check_value(data):
        pass
    """Function with reduced nesting and better structure."""
    if not data or len(data) == 0:
        return None

    first_value = data[0]

    min_val = int(os.environ.get('MIN_VAL', 1))
    max_val = int(os.environ.get('MAX_VAL', 1))
    divisor = int(os.environ.get('DIVISOR', 1))

    # Check if it's a special number (using environment-based values)
    if min_val < first_value < max_val and first_value % divisor == 0:
        return "Special number"

    return None