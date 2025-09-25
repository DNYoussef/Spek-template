"""
Base Constants Module - Single Source of Truth
==============================================

This module contains ALL core constants with NO external imports.
This eliminates circular dependencies by providing a single, import-free
source of constants that all other modules can safely import from.

Organization:
- System Limits
- NASA/Compliance Constants
- Quality Thresholds
- Performance Constants
- Business Rules
- Financial Constants
"""

# ============================================================================
# SYSTEM LIMITS
# ============================================================================

# Core Limits (Most imported - 158+ references)
MAXIMUM_NESTED_DEPTH = 5
MAXIMUM_RETRY_ATTEMPTS = 5
MAXIMUM_FUNCTION_LENGTH_LINES = 60
MAXIMUM_FUNCTION_PARAMETERS = 10
MAXIMUM_FILE_LENGTH_LINES = 500
MAXIMUM_GOD_OBJECTS_ALLOWED = 5

# API and Network
API_TIMEOUT_SECONDS = 30
DEFAULT_TIMEOUT = 30
DEFAULT_PORT = 8080
HTTPS_PORT = 443
HTTP_PORT = 80
LOCALHOST = "127.0.0.1"

# Batch Processing
DEFAULT_BATCH_SIZE = 100
DEFAULT_MAX_ITEMS = 10000
MAX_FILES_PER_BATCH = 100
MAX_CONCURRENT_REQUESTS = 1000

# ============================================================================
# NASA & COMPLIANCE CONSTANTS
# ============================================================================

# NASA Power of Ten Rules
NASA_POT10_TARGET_COMPLIANCE_THRESHOLD = 0.92
NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD = 0.85
NASA_MAX_FUNCTION_LENGTH = 60
NASA_MIN_ASSERTION_DENSITY = 2.0
NASA_PARAMETER_THRESHOLD = 6
NASA_GLOBAL_THRESHOLD = 5
NASA_COMPLIANCE_THRESHOLD = 0.92

# DFARS Compliance
DFARS_RETENTION_DAYS = 2555  # 7 years
DAYS_RETENTION_PERIOD = 90
LOG_RETENTION_DAYS = 30

# Regulatory
REGULATORY_FACTUALITY_REQUIREMENT = 0.90
AUDIT_TRAIL_COMPLETENESS_THRESHOLD = 0.95
SECURITY_SCAN_PASS_THRESHOLD = 0.95

# ============================================================================
# QUALITY THRESHOLDS
# ============================================================================

# Test Coverage
MINIMUM_TEST_COVERAGE_PERCENTAGE = 80.0
MIN_TEST_COVERAGE = 80.0
TARGET_TEST_COVERAGE_PERCENTAGE = 90.0
MIN_DOCUMENTATION_COVERAGE = 90.0

# Quality Gates
QUALITY_GATE_MINIMUM_PASS_RATE = 85.0
OVERALL_QUALITY_THRESHOLD = 0.75
CRITICAL_VIOLATION_LIMIT = 0
HIGH_VIOLATION_LIMIT = 5
MINIMUM_CODE_QUALITY_SCORE = 0.70
MINIMUM_MAINTAINABILITY_INDEX = 65

# Complexity
MAX_CYCLOMATIC_COMPLEXITY = 10
MAX_COGNITIVE_COMPLEXITY = 15
ALGORITHM_COMPLEXITY_THRESHOLD = 10

# Duplication
MAX_DUPLICATION_PERCENTAGE = 5.0
MECE_SIMILARITY_THRESHOLD = 0.8
MECE_QUALITY_THRESHOLD = 0.70
MECE_CLUSTER_MIN_SIZE = 3

# Theater Detection
THEATER_DETECTION_WARNING_THRESHOLD = 0.30
THEATER_DETECTION_FAILURE_THRESHOLD = 0.60

# ============================================================================
# GOD OBJECT DETECTION
# ============================================================================

GOD_OBJECT_METHOD_THRESHOLD = 20
GOD_OBJECT_LOC_THRESHOLD = 500
GOD_OBJECT_PARAMETER_THRESHOLD = 10
CONNASCENCE_SEVERITY_THRESHOLD = 3
CONNASCENCE_ANALYSIS_THRESHOLD = 0.85

# Magic Literals
MAGIC_LITERAL_THRESHOLD = 3
POSITION_COUPLING_THRESHOLD = 4

# ============================================================================
# PERFORMANCE CONSTANTS
# ============================================================================

# Caching
CACHE_SIZE_MB = 100
CACHE_EXPIRY_HOURS = 24

# Analysis Performance
MAX_ANALYSIS_TIME_SECONDS = 300
MAX_FILE_SIZE_KB = 1000
MECE_MAX_FILES_CI = 500
MECE_TIMEOUT_SECONDS_CI = 300

# Session and Database
SESSION_TIMEOUT_SECONDS = 3600
DATABASE_CONNECTION_TIMEOUT = 30
BATCH_PROCESSING_SIZE = 100
CONCURRENT_TASK_LIMIT = 10
MAXIMUM_QUEUE_SIZE = 1000

# ============================================================================
# FINANCIAL CONSTANTS
# ============================================================================

# Trading Parameters
MINIMUM_TRADE_THRESHOLD = 100
KELLY_CRITERION_FRACTION = 0.25
MAXIMUM_POSITION_SIZE_RATIO = 0.10
MINIMUM_POSITION_SIZE_RATIO = 0.1

# Risk Management
STOP_LOSS_PERCENTAGE = 2.0
TAKE_PROFIT_PERCENTAGE = 5.0
MAXIMUM_DRAWDOWN_THRESHOLD = 20.0
VOLATILITY_ADJUSTMENT_FACTOR = 1.5
MINIMUM_LIQUIDITY_RATIO = 0.5

# Performance Metrics
RISK_FREE_RATE = 0.2
BENCHMARK_RETURN_THRESHOLD = 0.8
SHARPE_RATIO_MINIMUM = 1.0
MOVING_AVERAGE_PERIODS = 20
VOLATILITY_LOOKBACK_DAYS = 252
CORRELATION_THRESHOLD = 0.7

# ============================================================================
# BUSINESS RULES
# ============================================================================

# Retry Logic
MAX_RETRIES = 5
RETRY_BACKOFF_MULTIPLIER = 2.0
DEFAULT_RETRY_DELAY_SECONDS = 1.0

# Security
MINIMUM_PASSWORD_LENGTH = 12
MAXIMUM_LOGIN_ATTEMPTS = 5
MAXIMUM_INPUT_SIZE_MB = 10

# Status Codes
SUCCESS = 0
FAILURE = 1

# ============================================================================
# CI/CD ADJUSTED THRESHOLDS (TECHNICAL DEBT)
# ============================================================================

# Temporary adjustments for CI/CD pipeline
GOD_OBJECT_METHOD_THRESHOLD_CI = 19
OVERALL_QUALITY_THRESHOLD_CI = 0.55

# ============================================================================
# VIOLATION WEIGHTS
# ============================================================================

VIOLATION_WEIGHTS = {
    "critical": 10,
    "high": 5,
    "medium": 2,
    "low": 1
}

# ============================================================================
# SEVERITY LEVELS
# ============================================================================

SEVERITY_LEVELS = {
    10: "CATASTROPHIC",  # God Objects >1000 LOC
    9: "CRITICAL",      # God Objects, Globals >5
    8: "MAJOR",         # Parameters >10 (NASA)
    7: "SIGNIFICANT",   # Functions >60 LOC
    6: "MODERATE",      # Magic in conditionals
    5: "MINOR",         # Parameters 6-10
    4: "TRIVIAL",       # Basic magic literals
    3: "INFORMATIONAL", # Style violations
    2: "ADVISORY",      # Best practices
    1: "NOTICE",        # Documentation
}

# ============================================================================
# FILE PATTERNS
# ============================================================================

SUPPORTED_EXTENSIONS = {
    "python": [".py", ".pyx", ".pyi"],
    "javascript": [".js", ".mjs", ".jsx", ".ts", ".tsx"],
    "c_cpp": [".c", ".cpp", ".cxx", ".cc", ".h", ".hpp", ".hxx"],
}

DEFAULT_EXCLUSIONS = [
    "__pycache__",
    ".git",
    ".pytest_cache",
    "node_modules",
    ".venv",
    "venv",
    ".env",
    "build",
    "dist",
    "*.egg-info",
    ".tox",
    ".mypy_cache",
    ".ruff_cache",
    ".coverage",
    "htmlcov",
]