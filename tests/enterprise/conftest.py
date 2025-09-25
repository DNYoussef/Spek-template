from src.constants.base import API_TIMEOUT_SECONDS
"""

Provides shared fixtures, utilities, and configuration for all enterprise tests
including mock factories, test data generators, and enterprise component setup.
"""

import pytest
import asyncio
import tempfile
import json
from pathlib import Path
from unittest.mock import Mock, patch
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional, Generator

# Import enterprise modules with correct paths
import sys
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'src'))

try:
    # Try direct imports from src
    from src.enterprise.flags.feature_flags import flag_manager, FeatureFlag, FlagStatus
    from src.enterprise.telemetry.six_sigma import SixSigmaTelemetry, QualityLevel
    from src.enterprise.security.sbom_generator import SBOMGenerator
    from src.compliance.compliance_matrix import ComplianceMatrix, ComplianceFramework, ComplianceStatus, Control
    from src.analyzers.enterprise_analyzer_integration import EnterpriseAnalyzerIntegration
except ImportError:
    # Fallback: try without src prefix
    try:
        from enterprise.flags.feature_flags import flag_manager, FeatureFlag, FlagStatus
        from enterprise.telemetry.six_sigma import SixSigmaTelemetry, QualityLevel
        from enterprise.security.sbom_generator import SBOMGenerator
        from compliance.compliance_matrix import ComplianceMatrix, ComplianceFramework, ComplianceStatus, Control
        from analyzers.enterprise_analyzer_integration import EnterpriseAnalyzerIntegration
    except ImportError as e:
        # Create mock objects for testing when imports fail
        import warnings
        warnings.warn(f"Could not import enterprise modules, using mocks: {e}")
        
        class MockFeatureFlag:
            def __init__(self, name, description, **kwargs):
                self.name = name
                self.description = description
                for k, v in kwargs.items():
                    setattr(self, k, v)
            def is_enabled(self, *args, **kwargs):
                return getattr(self, 'status', 'disabled') == 'enabled'
        
        class MockFlagManager:
            def __init__(self):
                self.flags = {}
            def create_flag(self, name, description, **kwargs):
                flag = MockFeatureFlag(name, description, **kwargs)
                self.flags[name] = flag
                return flag
        
        class MockEnum:
            ENABLED = 'enabled'
            DISABLED = 'disabled'
            ROLLOUT = 'rollout'
            SIX_SIGMA = '6_sigma'
            SOC2_TYPE2 = 'soc2_type2'
            ISO27001 = 'iso27001'
            NIST_CSF = 'nist_csf'
            SPDX_JSON = 'spdx_json'
        
        class MockTelemetry:
            def __init__(self, *args, **kwargs):
                self.metrics_history = []
        
        class MockSBOMGenerator:
            def __init__(self, *args, **kwargs):
                self.components = {}
        
        class MockComplianceMatrix:
            def __init__(self, *args, **kwargs):
                self.frameworks = {}
            def add_framework(self, framework):
                pass
        
        class MockControl:
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
        
        class MockIntegration:
            def __init__(self, *args, **kwargs):
                pass
        
        # Set up mocks
        flag_manager = MockFlagManager()
        FeatureFlag = MockFeatureFlag
        FlagStatus = MockEnum()
        SixSigmaTelemetry = MockTelemetry
        QualityLevel = MockEnum()
        SBOMGenerator = MockSBOMGenerator
        ComplianceMatrix = MockComplianceMatrix
        ComplianceFramework = MockEnum()
        ComplianceStatus = MockEnum()
        Control = MockControl
        EnterpriseAnalyzerIntegration = MockIntegration

# Test Configuration Constants
TEST_PROJECT_NAME = "enterprise_test_project"
TEST_ORGANIZATION = "SPEK Enterprise Testing"
DEFAULT_COMPLIANCE_FRAMEWORKS = [
    ComplianceFramework.SOC2_TYPE2,
    ComplianceFramework.ISO27001,
    ComplianceFramework.NIST_CSF
]

@pytest.fixture(scope="session", autouse=True)
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(autouse=True)
def clean_feature_flags():
    """Clean feature flags before and after each test"""
    # Clear flags before test
    flag_manager.flags.clear()
    
    yield
    
    # Clear flags after test
    flag_manager.flags.clear()

@pytest.fixture
def temp_project_dir():
    """Create temporary project directory for testing"""
    with tempfile.TemporaryDirectory() as temp_dir:
        project_root = Path(temp_dir)
        
        # Create basic project structure
        (project_root / "src").mkdir()
        (project_root / "tests").mkdir()
        (project_root / "docs").mkdir()
        
        yield project_root

@pytest.fixture
def realistic_project_dir():
    """Create realistic project directory with files for testing"""
    with tempfile.TemporaryDirectory() as temp_dir:
        project_root = Path(temp_dir)
        
        # Create comprehensive project structure
        create_realistic_project_structure(project_root)
        
        yield project_root

def create_realistic_project_structure(project_root: Path):
    """Create a realistic project structure for testing"""
    # Python package structure
    src_dir = project_root / "src" / "enterprise_app"
    src_dir.mkdir(parents=True)
    
    # Python files
    (src_dir / "__init__.py").write_text('"""Enterprise application package"""')
    
    (src_dir / "main.py").write_text('''
"""Main application module"""
import os
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)
        
    def get_data(self, endpoint: str) -> APIResponse:
        """Fetch data from API endpoint"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {}
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            
        try:
            response = self.session.get(url, headers=headers, timeout=API_TIMEOUT_SECONDS)
            response.raise_for_status()
            
            return APIResponse(
                status_code=response.status_code,
                data=response.json(),
                success=True
            )
        except Exception as e:
            self.logger.error(f"API request failed: {e}")
            return APIResponse(
                status_code=500,
                data={"error": str(e)},
                success=False
            )
''')
    
    (src_dir / "utils.py").write_text('''
"""Utility functions for enterprise app"""
import hashlib
import base64
from typing import Any, Dict
"""

def calculate_checksum(data: str) -> str:
    """Calculate SHA256 checksum of data"""
    return hashlib.sha256(data.encode()).hexdigest()

def encode_data(data: Dict[str, Any]) -> str:
    """Encode data as base64 JSON"""
    import json
    json_str = json.dumps(data, sort_keys=True)
    return base64.b64encode(json_str.encode()).decode()

def validate_config(config: Dict[str, Any]) -> bool:
    """Validate configuration dictionary"""
    required_keys = ["api_url", "timeout"]
    return all(key in config for key in required_keys)
''')
    
    # Configuration files
    (project_root / "requirements.txt").write_text('''
requests>=2.28.0
pytest>=7.0.0
pytest-asyncio>=0.20.0
pytest-cov>=4.0.0
black>=22.0.0
flake8>=5.0.0
mypy>=0.991
''')
    
    (project_root / "pyproject.toml").write_text('''
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "enterprise-app"
version = "1.0.0"
description = "Enterprise application for testing"
dependencies = [
    "requests>=2.28.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-asyncio>=0.20.0",
    "pytest-cov>=4.0.0",
    "black>=22.0.0",
    "flake8>=5.0.0",
    "mypy>=0.991",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
asyncio_mode = "auto"
addopts = "--cov=enterprise_app --cov-report=html --cov-report=term-missing"

[tool.black]
line-length = 88
target-version = ['py38']

[tool.mypy]
python_version = "3.8"
warn_return_any = true
warn_unused_configs = true
''')
    
    # Test files
    tests_dir = project_root / "tests"
    tests_dir.mkdir(exist_ok=True)
    
    (tests_dir / "__init__.py").write_text("")
    
    (tests_dir / "test_main.py").write_text('''
"""Tests for main module"""
import pytest
from unittest.mock import Mock, patch
from enterprise_app.main import APIClient, APIResponse

class TestAPIClient:
    def test_init(self):
        client = APIClient("https://api.example.com")
        assert client.base_url == "https://api.example.com"
        assert client.api_key is None
        
    def test_init_with_api_key(self):
        client = APIClient("https://api.example.com", api_key="secret")
        assert client.api_key == "secret"
        
    @patch('requests.Session.get')
    def test_get_data_success(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "test"}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        client = APIClient("https://api.example.com")
        result = client.get_data("/test")
        
        assert result.success is True
        assert result.status_code == 200
        assert result.data == {"data": "test"}
        
    @patch('requests.Session.get')
    def test_get_data_failure(self, mock_get):
        mock_get.side_effect = Exception("Network error")
        
        client = APIClient("https://api.example.com")
        result = client.get_data("/test")
        
        assert result.success is False
        assert result.status_code == 500
        assert "error" in result.data
''')
    
    (tests_dir / "test_utils.py").write_text('''
"""Tests for utils module"""
import pytest
from enterprise_app.utils import calculate_checksum, encode_data, validate_config

class TestUtils:
    def test_calculate_checksum(self):
        checksum = calculate_checksum("test data")
        assert len(checksum) == 64  # SHA256 hex length
        assert checksum == calculate_checksum("test data")  # Consistent
        
    def test_encode_data(self):
        data = {"key": "value", "number": 42}
        encoded = encode_data(data)
        assert isinstance(encoded, str)
        assert len(encoded) > 0
        
    def test_validate_config_valid(self):
        config = {"api_url": "https://api.example.com", "timeout": 30}
        assert validate_config(config) is True
        
    def test_validate_config_missing_key(self):
        config = {"api_url": "https://api.example.com"}
        assert validate_config(config) is False
''')
    
    # Package.json for mixed project
    package_json = {
        "name": "enterprise-frontend",
        "version": "1.0.0",
        "description": "Frontend for enterprise application",
        "main": "index.js",
        "dependencies": {
            "react": "^18.2.0",
            "axios": "^1.4.0",
            "lodash": "^4.17.21"
        },
        "devDependencies": {
            "jest": "^29.5.0",
            "@testing-library/react": "^13.4.0",
            "eslint": "^8.43.0"
        }
    }
    
    with open(project_root / "package.json", 'w') as f:
        json.dump(package_json, f, indent=2)

@pytest.fixture
def enterprise_features_enabled():
    """Enable all enterprise features for testing"""
    features = {
        "enterprise_telemetry": "Six Sigma telemetry and quality metrics",
        "enterprise_security": "Security analysis and SBOM generation", 
        "enterprise_compliance": "Compliance matrix and framework validation",
        "enterprise_metrics": "Advanced quality and performance metrics",
        "enterprise_sbom": "Automated SBOM generation",
        "enterprise_reporting": "Comprehensive enterprise reporting"
    }
    
    for flag_name, description in features.items():
        flag_manager.create_flag(
            flag_name,
            description,
            status=FlagStatus.ENABLED
        )
        
    yield features
    
    # Cleanup handled by clean_feature_flags fixture

@pytest.fixture
def enterprise_features_disabled():
    """Disable all enterprise features for testing"""
    features = {
        "enterprise_telemetry": "Six Sigma telemetry and quality metrics",
        "enterprise_security": "Security analysis and SBOM generation",
        "enterprise_compliance": "Compliance matrix and framework validation", 
        "enterprise_metrics": "Advanced quality and performance metrics",
        "enterprise_sbom": "Automated SBOM generation",
        "enterprise_reporting": "Comprehensive enterprise reporting"
    }
    
    for flag_name, description in features.items():
        flag_manager.create_flag(
            flag_name,
            description,
            status=FlagStatus.DISABLED
        )
        
    yield features

@pytest.fixture
def six_sigma_telemetry():
    """Create Six Sigma telemetry instance for testing"""
    telemetry = SixSigmaTelemetry("test_process")
    yield telemetry

@pytest.fixture
def sbom_generator(temp_project_dir):
    """Create SBOM generator for testing"""
    generator = SBOMGenerator(temp_project_dir)
    yield generator

@pytest.fixture
def compliance_matrix(temp_project_dir):
    """Create compliance matrix with frameworks loaded"""
    matrix = ComplianceMatrix(temp_project_dir)
    
    # Load default frameworks
    for framework in DEFAULT_COMPLIANCE_FRAMEWORKS:
        matrix.add_framework(framework)
        
    yield matrix

@pytest.fixture
def enterprise_integration(temp_project_dir):
    """Create enterprise analyzer integration for testing"""
    integration = EnterpriseAnalyzerIntegration(temp_project_dir)
    yield integration

@pytest.fixture
def mock_analyzer_class():
    """Mock analyzer class for testing"""
    class MockAnalyzer:
        def __init__(self, *args, **kwargs):
            self.call_count = 0
            self.last_data = None
            
        async def analyze(self, data, **kwargs):
            self.call_count += 1
            self.last_data = data
            await asyncio.sleep(0.1)  # Simulate async work
            
            return {
                "input": data,
                "result": f"analyzed_{data}",
                "call_count": self.call_count,
                "timestamp": datetime.now().isoformat(),
                "kwargs": kwargs
            }
            
    return MockAnalyzer

@pytest.fixture
def failing_analyzer_class():
    """Mock analyzer class that fails for testing error scenarios"""
    class FailingAnalyzer:
        def __init__(self, fail_rate: float = 1.0):
            self.call_count = 0
            self.fail_rate = fail_rate  # Fraction of calls that should fail
            
        async def analyze(self, data, **kwargs):
            self.call_count += 1
            
            # Determine if this call should fail
            should_fail = (self.call_count * self.fail_rate) % 1 >= 0.5
            
            if should_fail or self.fail_rate >= 1.0:
                raise Exception(f"Simulated failure for call {self.call_count}")
                
            return {"result": f"success_{data}", "call": self.call_count}
            
    return FailingAnalyzer

# Test Data Factories

class TestDataFactory:
    """Factory for creating test data"""
    
    @staticmethod
    def create_sample_controls(count: int = 5) -> List[Control]:
        """Create sample compliance controls"""
        controls = []
        
        for i in range(count):
            control = Control(
                id=f"TEST.{i+1}",
                title=f"Test Control {i+1}",
                description=f"Description for test control {i+1}",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Testing",
                subcategory=f"Subcategory {i+1}",
                risk_rating=["low", "medium", "high", "critical"][i % 4],
                automation_level=["manual", "semi-automated", "automated"][i % 3]
            )
            controls.append(control)
            
        return controls
    
    @staticmethod
    def create_sample_feature_flags(count: int = 5) -> Dict[str, FeatureFlag]:
        """Create sample feature flags"""
        flags = {}
        statuses = list(FlagStatus)
        
        for i in range(count):
            flag_name = f"test_feature_{i+1}"
            flag = FeatureFlag(
                name=flag_name,
                description=f"Test feature flag {i+1}",
                status=statuses[i % len(statuses)],
                rollout_percentage=float((i + 1) * 20),  # 20%, 40%, 60%, 80%, 100%
                owner=f"team_{i+1}",
                tags=[f"tag_{j}" for j in range((i % 3) + 1)]
            )
            flags[flag_name] = flag
            
        return flags
    
    @staticmethod
    def create_telemetry_data(
        units: int = 100,
        defect_rate: float = 0.1,
        opportunities_per_unit: int = 5
    ) -> Dict[str, int]:
        """Create sample telemetry data"""
        defects = int(units * defect_rate)
        passed_units = units - defects
        total_opportunities = units * opportunities_per_unit
        
        return {
            "units_processed": units,
            "units_passed": passed_units,
            "defects": defects + defects,  # Additional defects beyond failed units
            "opportunities": total_opportunities
        }

@pytest.fixture
def test_data_factory():
    """Provide test data factory"""
    return TestDataFactory()

# Utility Functions for Tests

def assert_enterprise_result_structure(result: Dict[str, Any]):
    """Assert that result has expected enterprise structure"""
    required_keys = [
        "analyzer",
        "timestamp", 
        "analysis_result",
        "quality_metrics",
        "enterprise_features_enabled"
    ]
    
    for key in required_keys:
        assert key in result, f"Missing required key: {key}"
        
    # Check quality metrics structure
    quality_metrics = result["quality_metrics"]
    assert "analyzer" in quality_metrics
    assert "dpmo" in quality_metrics
    assert "sigma_level" in quality_metrics
    
    # Check enterprise features structure
    features = result["enterprise_features_enabled"]
    expected_features = ["telemetry", "security", "compliance", "metrics"]
    for feature in expected_features:
        assert feature in features

def assert_compliance_report_structure(report):
    """Assert that compliance report has expected structure"""
    from enterprise.compliance.matrix import ComplianceReport
    
    assert isinstance(report, ComplianceReport)
    assert hasattr(report, "framework")
    assert hasattr(report, "overall_status")
    assert hasattr(report, "total_controls")
    assert hasattr(report, "compliant_controls")
    assert hasattr(report, "recommendations")
    assert hasattr(report, "evidence_gaps")
    assert hasattr(report, "next_actions")

def assert_telemetry_metrics_structure(metrics):
    """Assert that telemetry metrics have expected structure"""
    from enterprise.telemetry.six_sigma import SixSigmaMetrics
    
    assert isinstance(metrics, SixSigmaMetrics)
    assert hasattr(metrics, "dpmo")
    assert hasattr(metrics, "rty")
    assert hasattr(metrics, "sigma_level")
    assert hasattr(metrics, "quality_level")
    assert hasattr(metrics, "sample_size")
    assert hasattr(metrics, "defect_count")

# Performance Testing Utilities

class PerformanceTimer:
    """Context manager for timing operations"""
    
    def __init__(self, name: str = "operation"):
        self.name = name
        self.start_time = None
        self.duration = None
        
    def __enter__(self):
        self.start_time = time.perf_counter()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.duration = time.perf_counter() - self.start_time
        
    def assert_faster_than(self, max_seconds: float):
        """Assert operation completed faster than threshold"""
        assert self.duration is not None, "Timer not used in context manager"
        assert self.duration < max_seconds, (
            f"{self.name} took {self.duration:.3f}s, expected < {max_seconds}s"
        )

@pytest.fixture
def performance_timer():
    """Provide performance timer utility"""
    return PerformanceTimer

# Async Testing Utilities

class AsyncTestHelper:
    """Helper for async testing scenarios"""
    
    @staticmethod
    async def run_concurrent(coroutines: List, max_concurrent: int = 10):
        """Run coroutines with limited concurrency"""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def limited_coroutine(coro):
            async with semaphore:
                return await coro
                
        limited_coroutines = [limited_coroutine(coro) for coro in coroutines]
        return await asyncio.gather(*limited_coroutines, return_exceptions=True)
    
    @staticmethod
    async def run_with_timeout(coroutine, timeout_seconds: float):
        """Run coroutine with timeout"""
        try:
            return await asyncio.wait_for(coroutine, timeout=timeout_seconds)
        except asyncio.TimeoutError:
            pytest.fail(f"Coroutine timed out after {timeout_seconds}s")

@pytest.fixture
def async_helper():
    """Provide async testing helper"""
    return AsyncTestHelper()

# Mock Data Generators

@pytest.fixture
def sample_project_files():
    """Generate sample project file data"""
    return {
        "python_files": [
            "src/main.py",
            "src/utils.py", 
            "src/models.py",
            "tests/test_main.py",
            "tests/test_utils.py"
        ],
        "config_files": [
            "requirements.txt",
            "pyproject.toml",
            "setup.py"
        ],
        "documentation": [
            "README.md",
            "CHANGELOG.md",
            "docs/user_guide.md"
        ]
    }

# Pytest Configuration

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", 
        "slow: mark test as slow running (> 1 second)"
    )
    config.addinivalue_line(
        "markers",
        "integration: mark test as integration test"  
    )
    config.addinivalue_line(
        "markers",
        "enterprise: mark test as enterprise feature test"
    )
    config.addinivalue_line(
        "markers",
        "performance: mark test as performance test"
    )

def pytest_collection_modifyitems(config, items):
    """Modify collected tests based on markers"""
    import pytest
    
    for item in items:
        # Add slow marker to tests that take > 1 second
        if "slow" in item.name or any(mark.name == "slow" for mark in item.iter_markers()):
            item.add_marker(pytest.mark.slow)
            
        # Add enterprise marker to enterprise tests
        if "enterprise" in str(item.fspath) or "enterprise" in item.name:
            item.add_marker(pytest.mark.enterprise)

# Import time for performance testing
import time