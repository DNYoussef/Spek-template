"""
Shared Utility Modules

Phase 1A consolidation of duplicate algorithm patterns identified in
deduplication analysis. Reduces Connascence of Algorithm violations
by centralizing common patterns.

Phase 1B additions: Testing, Security, Analysis, Logging, Data utilities.

Modules:
- validation: Validation result processing utilities
- performance: Performance measurement and benchmarking
- cache: Cache health analysis and optimization
- testing: Shared test helpers and fixtures
- security: Security validation and sanitization
- analysis: Analysis helpers and pattern matching
- logging: Structured logging utilities
- data: Data transformation and normalization
"""

# Phase 1A modules
from .cache.health_analyzer import (
    CacheStats,
    CacheHealthStatus,
    CacheHealthMetrics,
    CacheHealthAnalyzer
)
from .performance.measurement import (
    PerformanceMetrics,
    PerformanceMeasurement,
    measure_performance,
    benchmark_function
)
from .validation.result_processor import (
    ValidationResult,
    ValidationStatus,
    ValidationResultProcessor
)

# Phase 1B modules
from .testing.test_helpers import (
    TestProjectBuilder,
    TestDataFactory,
    AsyncTestHelper,
    MockFactory,
    PathHelper
)

from .security.security_utils import (
    InputValidator,
    PathSecurityUtils,
    CryptoUtils,
    SecurityChecker
)

from .analysis.analysis_helpers import (
    AnalysisResult,
    ResultAggregator,
    StatisticalCalculator,
    PatternMatcher,
    RecommendationEngine
)

from .logging.structured_logger import (
    get_logger,
    StructuredFormatter,
    ContextLogger,
    LoggerFactory,
    AuditLogger
)

from .data.data_transformers import (
    DataNormalizer,
    FormatConverter,
    DataValidator,
    DataMerger,
    TimestampHandler
)

__all__ = [
    # Validation
    'ValidationResult',
    'ValidationStatus',
    'ValidationResultProcessor',

    # Performance
    'PerformanceMetrics',
    'PerformanceMeasurement',
    'measure_performance',
    'benchmark_function',

    # Cache
    'CacheStats',
    'CacheHealthStatus',
    'CacheHealthMetrics',
    'CacheHealthAnalyzer',

    # Testing (Phase 1B)
    'TestProjectBuilder',
    'TestDataFactory',
    'AsyncTestHelper',
    'MockFactory',
    'PathHelper',

    # Security (Phase 1B)
    'InputValidator',
    'PathSecurityUtils',
    'CryptoUtils',
    'SecurityChecker',

    # Analysis (Phase 1B)
    'AnalysisResult',
    'ResultAggregator',
    'StatisticalCalculator',
    'PatternMatcher',
    'RecommendationEngine',

    # Logging (Phase 1B)
    'get_logger',
    'StructuredFormatter',
    'ContextLogger',
    'LoggerFactory',
    'AuditLogger',

    # Data (Phase 1B)
    'DataNormalizer',
    'FormatConverter',
    'DataValidator',
    'DataMerger',
    'TimestampHandler',
]