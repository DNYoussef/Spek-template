"""
Analyzer Module
Main entry point for the SPEK analyzer system
"""

# Import core analysis modules for enhanced analyzer
try:
    from .violation_remediation import ViolationRemediationEngine, ViolationSuppression, FixSuggestion
    from .nasa_compliance_calculator import NASAComplianceCalculator, ComplianceConfig, ComplianceResult
    from .github_analyzer_runner import AnalyzerResult
    from .github_status_reporter import GitHubStatusReporter
    ENHANCED_ANALYZER_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Enhanced analyzer imports failed: {e}")
    ENHANCED_ANALYZER_AVAILABLE = False

# Core types and classes for Phase 1 implementation
try:
    from .utils.types import ConnascenceViolation, ConnascenceType, SeverityLevel, AnalysisResult
    from .detectors import DetectorBase, MagicLiteralDetector
    from .integrations.github_bridge import GitHubBridge, GitHubConfig
    CORE_IMPORTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Core imports failed: {e}")
    CORE_IMPORTS_AVAILABLE = False

# Import with fallback for missing modules
try:
    from .core import IMPORT_MANAGER, UNIFIED_IMPORTS_AVAILABLE
except ImportError as e:
    print(f"CRITICAL: Core imports failed: {e}")
    IMPORT_MANAGER = None
    UNIFIED_IMPORTS_AVAILABLE = False

# Import UnifiedAnalyzer with proper error handling
try:
    from .unified_analyzer import UnifiedAnalyzer
    UNIFIED_ANALYZER_AVAILABLE = True
except ImportError as e:
    print(f"CRITICAL: UnifiedAnalyzer import failed: {e}")
    UnifiedAnalyzer = None
    UNIFIED_ANALYZER_AVAILABLE = False

# Import critical modules and report failures
CRITICAL_MODULES_STATUS = {}

try:
    from .theater_detection import TheaterDetector
    CRITICAL_MODULES_STATUS['theater_detection'] = True
except ImportError as e:
    print(f"CRITICAL: TheaterDetector import failed: {e}")
    CRITICAL_MODULES_STATUS['theater_detection'] = False

try:
    from .enterprise_security import SecurityScanner
    CRITICAL_MODULES_STATUS['enterprise_security'] = True
except ImportError as e:
    print(f"CRITICAL: SecurityScanner import failed: {e}")
    CRITICAL_MODULES_STATUS['enterprise_security'] = False

try:
    from .validation import InputValidator
    CRITICAL_MODULES_STATUS['validation'] = True
except ImportError as e:
    print(f"CRITICAL: InputValidator import failed: {e}")
    CRITICAL_MODULES_STATUS['validation'] = False

try:
    from .ml_modules import QualityPredictor
    CRITICAL_MODULES_STATUS['ml_modules'] = True
except ImportError as e:
    print(f"CRITICAL: QualityPredictor import failed: {e}")
    CRITICAL_MODULES_STATUS['ml_modules'] = False

# Report overall status
failed_modules = [name for name, status in CRITICAL_MODULES_STATUS.items() if not status]
if failed_modules:
    print(f"CRITICAL: {len(failed_modules)} critical modules failed to load: {', '.join(failed_modules)}")
    print("This indicates real problems that need to be fixed, not hidden!")
else:
    print("SUCCESS: All critical modules loaded successfully")

__version__ = '1.0.0'

__all__ = [
    'ConnascenceViolation', 'ConnascenceType', 'SeverityLevel', 'AnalysisResult',
    'DetectorBase', 'MagicLiteralDetector', 'GitHubBridge', 'GitHubConfig',
    'UnifiedAnalyzer',
    'connascence_scanner',
    'architecture_analyzer',
    'quality_metrics',
    'compliance_manager',
    'quality_validation',
    'risk_assessment',
    'real_time_monitor',
    'performance_tracker',
    'cache_manager',
    'performance_optimizer',
    'semgrep_scanner',
    'vulnerability_analyzer'
]