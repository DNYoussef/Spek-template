from src.constants.base import QUALITY_GATE_MINIMUM_PASS_RATE

"""Consolidates common test setup, teardown, fixtures, and data generation patterns.
Extracted from: tests/cache_analyzer/, tests/enterprise/conftest.py
"""

import tempfile
import json
import asyncio
from pathlib import Path
from typing import Dict, List, Any, Optional, Generator
from unittest.mock import Mock, MagicMock
from datetime import datetime, timedelta
import sys

class TestProjectBuilder:
    """Build realistic project structures for testing."""

    @staticmethod
    def create_temp_project(name: str = "test_project") -> Path:
        """Create temporary project directory with basic structure."""
        temp_dir = tempfile.mkdtemp(prefix=f"{name}_")
        project_root = Path(temp_dir)
        
        # Create standard directories
        (project_root / "src").mkdir()
        (project_root / "tests").mkdir()
        (project_root / "docs").mkdir()
        (project_root / "config").mkdir(exist_ok=True)
        
        return project_root

    @staticmethod
    def create_python_files(project_root: Path, file_configs: List[Dict[str, str]]) -> List[Path]:
        """Create Python files with specified content.
        
        Args:
            project_root: Root directory for files
            file_configs: List of {"path": str, "content": str} dicts
        """
        created_files = []
        for config in file_configs:
            file_path = project_root / config["path"]
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(config["content"])
            created_files.append(file_path)
        return created_files

    @staticmethod
    def create_test_files(project_root: Path) -> Dict[str, Path]:
        """Create standard test files."""
        test_configs = {
            "simple.py": "print('hello world')\n",
            "complex.py": '''
class TestClass:
    def __init__(self):
        self.value = 42
    
    def method(self):
        return self.value * 2

def function():
    tc = TestClass()
    return tc.method()
''',
            "syntax_error.py": "def incomplete_function(\n",  # Intentional error
        }
        
        files = {}
        for filename, content in test_configs.items():
            file_path = project_root / filename
            file_path.write_text(content)
            files[filename] = file_path
        return files

class TestDataFactory:
    """Generate common test data structures."""

    @staticmethod
    def create_mock_results(count: int = 5, success_rate: float = 0.8) -> List[Dict[str, Any]]:
        """Create mock test results."""
        results = []
        for i in range(count):
            results.append({
                "test_id": f"test_{i}",
                "status": "passed" if i / count < success_rate else "failed",
                "duration": 0.1 + (i * 0.5),
                "timestamp": datetime.now().isoformat(),
                "data": {"input": f"data_{i}", "output": f"result_{i}"}
            })
        return results

    @staticmethod
    def create_telemetry_data(
        units: int = 100,
        defect_rate: float = 0.1,
        opportunities_per_unit: int = 5
    ) -> Dict[str, int]:
        """Create Six Sigma telemetry data."""
        defects = int(units * defect_rate)
        passed_units = units - defects
        total_opportunities = units * opportunities_per_unit
        
        return {
            "units_processed": units,
            "units_passed": passed_units,
            "defects": defects + defects,
            "opportunities": total_opportunities
        }

    @staticmethod
    def create_sample_metrics(metric_type: str = "performance") -> Dict[str, float]:
        """Create sample metric data."""
        if metric_type == "performance":
            return {
                "health_score": QUALITY_GATE_MINIMUM_PASS_RATE,
                "hit_rate": 0.75,
                "efficiency": 0.80,
                "utilization": 0.70
            }
        elif metric_type == "quality":
            return {
                "coverage": 0.85,
                "complexity": 5.2,
                "duplication": 0.3,
                "maintainability": 0.78
            }
        return {}

class AsyncTestHelper:
    """Utilities for async testing."""

    @staticmethod
    async def run_concurrent(
        coroutines: List,
        max_concurrent: int = 10
    ) -> List[Any]:
        """Run coroutines with limited concurrency."""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def limited_coroutine(coro):
            async with semaphore:
                return await coro
        
        limited = [limited_coroutine(coro) for coro in coroutines]
        return await asyncio.gather(*limited, return_exceptions=True)

    @staticmethod
    async def run_with_timeout(
        coroutine,
        timeout_seconds: float
    ) -> Any:
        """Run coroutine with timeout."""
        return await asyncio.wait_for(coroutine, timeout=timeout_seconds)

class MockFactory:
    """Create common mock objects."""

    @staticmethod
    def create_analyzer_mock(results: Optional[Dict] = None) -> Mock:
        """Create mock analyzer."""
        mock = MagicMock()
        mock.analyze.return_value = results or {"status": "success"}
        return mock

    @staticmethod
    def create_cache_mock(hit_rate: float = 0.75) -> Mock:
        """Create mock cache with stats."""
        mock = MagicMock()
        mock.get_cache_stats.return_value = MagicMock(
            hits=75,
            misses=25,
            hit_rate=lambda: hit_rate
        )
        return mock

class PathHelper:
    """Path management for tests."""

    @staticmethod
    def setup_python_path(project_root: Path) -> None:
        """Add project to Python path."""
        root_str = str(project_root.absolute())
        if root_str not in sys.path:
            sys.path.insert(0, root_str)

    @staticmethod
    def cleanup_path(project_root: Path) -> None:
        """Remove project from Python path."""
        root_str = str(project_root.absolute())
        if root_str in sys.path:
            sys.path.remove(root_str)
