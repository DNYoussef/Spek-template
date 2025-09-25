"""Constants package for SPEK Enhanced Development Platform.

This package provides centralized access to all system constants,
organized by domain for better maintainability and documentation.

Usage:
    from src.constants import (
        NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD,
        QUALITY_GATE_MINIMUM_PASS_RATE,
        # ... other constants
    )
"""

# Import from the main constants file
try:
    # Try importing from the main constants file
    import sys
    from pathlib import Path

    # Add the parent directory to path to find constants.py
    parent_dir = Path(__file__).parent.parent
    if str(parent_dir) not in sys.path:
        sys.path.insert(0, str(parent_dir))

    # Import from base constants
    from .base import *
except ImportError:
    # Fallback constants if main file not found
    DEFAULT_TIMEOUT = 30
    MAX_RETRIES = 5
    NASA_MAX_FUNCTION_LENGTH = 60
    MIN_TEST_COVERAGE = 80.0
    SUCCESS = 0
    FAILURE = 1
    DEFAULT_BATCH_SIZE = 100
    QUALITY_GATE_MINIMUM_PASS_RATE = 85.0
    MAXIMUM_RETRY_ATTEMPTS = 3

__all__ = [
    # Compliance Thresholds
    'NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD',
    'NASA_POT10_TARGET_COMPLIANCE_THRESHOLD',
    'QUALITY_GATE_MINIMUM_PASS_RATE',
    'REGULATORY_FACTUALITY_REQUIREMENT',
    'CONNASCENCE_ANALYSIS_THRESHOLD',
    'THEATER_DETECTION_WARNING_THRESHOLD',
    'THEATER_DETECTION_FAILURE_THRESHOLD',
    'AUDIT_TRAIL_COMPLETENESS_THRESHOLD',
    'SECURITY_SCAN_PASS_THRESHOLD',
    
    # Quality Gates
    'MINIMUM_TEST_COVERAGE_PERCENTAGE',
    'TARGET_TEST_COVERAGE_PERCENTAGE',
    'MAXIMUM_GOD_OBJECTS_ALLOWED',
    'MAXIMUM_FUNCTION_LENGTH_LINES',
    'MAXIMUM_FILE_LENGTH_LINES',
    'MAXIMUM_FUNCTION_PARAMETERS',
    'MAXIMUM_NESTED_DEPTH',
    'MINIMUM_CODE_QUALITY_SCORE',
    'MAXIMUM_CYCLOMATIC_COMPLEXITY',
    'MINIMUM_MAINTAINABILITY_INDEX',
    
    # Business Rules
    'MAXIMUM_RETRY_ATTEMPTS',
    'RETRY_BACKOFF_MULTIPLIER',
    'DEFAULT_RETRY_DELAY_SECONDS',
    'DAYS_RETENTION_PERIOD',
    'LOG_RETENTION_DAYS',
    'CACHE_EXPIRY_HOURS',
    'API_TIMEOUT_SECONDS',
    'SESSION_TIMEOUT_SECONDS',
    'DATABASE_CONNECTION_TIMEOUT',
    'BATCH_PROCESSING_SIZE',
    'CONCURRENT_TASK_LIMIT',
    'MAXIMUM_QUEUE_SIZE',
    'MAXIMUM_INPUT_SIZE_MB',
    'MINIMUM_PASSWORD_LENGTH',
    'MAXIMUM_LOGIN_ATTEMPTS',
    
    # Financial Constants
    'KELLY_CRITERION_FRACTION',
    'MAXIMUM_POSITION_SIZE_RATIO',
    'MINIMUM_POSITION_SIZE_RATIO',
    'STOP_LOSS_PERCENTAGE',
    'TAKE_PROFIT_PERCENTAGE',
    'MAXIMUM_DRAWDOWN_THRESHOLD',
    'MINIMUM_TRADE_THRESHOLD',
    'VOLATILITY_ADJUSTMENT_FACTOR',
    'MINIMUM_LIQUIDITY_RATIO',
    'RISK_FREE_RATE',
    'BENCHMARK_RETURN_THRESHOLD',
    'SHARPE_RATIO_MINIMUM',
    'MOVING_AVERAGE_PERIODS',
    'VOLATILITY_LOOKBACK_DAYS',
    'CORRELATION_THRESHOLD',
]
