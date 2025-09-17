from lib.shared.utilities import path_exists
"""
Refactored Unified Analyzer - Breaking God Object into Single Responsibility Classes
Each class now has a focused purpose with <15 methods.
"""

import ast
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import json


# ============================================================================
# 1. CONFIGURATION MANAGER - Handles all configuration
# ============================================================================

class AnalyzerConfiguration:
    """Manages analyzer configuration - Single Responsibility: Configuration"""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize configuration manager."""
        self.config_path = config_path
        self.config = self._load_default_config()
        if config_path:
            self._load_custom_config()

    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration."""
        return {
            'max_file_size': 1_000_000,
            'skip_patterns': ['__pycache__', '.git', 'node_modules'],
            'file_extensions': ['.py'],
            'enable_caching': True,
            'max_cache_size': 100,
            'timeout': 30,
            'parallel_processing': True,
            'max_workers': 4
        }

    def _load_custom_config(self):
        """Load custom configuration from file."""
        if self.config_path and path_exists(self.config_path):
            with open(self.config_path, 'r') as f:
                custom = json.load(f)
                self.config.update(custom)

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        return self.config.get(key, default)

    def set(self, key: str, value: Any):
        """Set configuration value."""
        self.config[key] = value

    def validate(self) -> bool:
        """Validate configuration."""
        required_keys = ['max_file_size', 'skip_patterns', 'file_extensions']
        return all(key in self.config for key in required_keys)


# ============================================================================
# 2. CACHE MANAGER - Handles all caching logic
# ============================================================================

class AnalysisCache:
    """Manages analysis caching - Single Responsibility: Caching"""

    def __init__(self, max_size: int = 100):
        """Initialize cache manager."""
        self.max_size = max_size
        self.cache = {}
        self.access_count = {}

    def get(self, key: str) -> Optional[Any]:
        """Get cached value."""
        if key in self.cache:
            self.access_count[key] = self.access_count.get(key, 0) + 1
            return self.cache[key]
        return None

    def set(self, key: str, value: Any):
        """Set cached value."""
        if len(self.cache) >= self.max_size:
            self._evict_least_used()
        self.cache[key] = value
        self.access_count[key] = 0

    def _evict_least_used(self):
        """Evict least recently used item."""
        if self.access_count:
            least_used = min(self.access_count, key=self.access_count.get)
            del self.cache[least_used]
            del self.access_count[least_used]

    def clear(self):
        """Clear entire cache."""
        self.cache.clear()
        self.access_count.clear()

    def size(self) -> int:
        """Get cache size."""
        return len(self.cache)

    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total_accesses = sum(self.access_count.values())
        if total_accesses == 0:
            return 0.0
        return len(self.cache) / total_accesses


# ============================================================================
# 3. DETECTOR MANAGER - Manages detector instances
# ============================================================================

class DetectorManager:
    """Manages detector instances - Single Responsibility: Detector Management"""

    def __init__(self):
        """Initialize detector manager."""
        self.detectors = {}
        self.detector_stats = {}
        self._load_detectors()

    def _load_detectors(self):
        """Load available detectors."""
        # In real implementation, would dynamically load detector classes
        self.detectors = {
            'magic_literal': 'MagicLiteralDetector',
            'position': 'PositionDetector',
            'god_object': 'GodObjectDetector',
            'type': 'TypeDetector',
            'name': 'NameDetector'
        }

    def get_detector(self, name: str):
        """Get detector instance."""
        if name in self.detectors:
            # In real implementation, would instantiate detector
            return self.detectors[name]
        return None

    def get_all_detectors(self) -> List[str]:
        """Get all available detector names."""
        return list(self.detectors.keys())

    def register_detector(self, name: str, detector_class: str):
        """Register new detector."""
        self.detectors[name] = detector_class

    def unregister_detector(self, name: str):
        """Unregister detector."""
        if name in self.detectors:
            del self.detectors[name]

    def get_stats(self, detector_name: str) -> Dict[str, Any]:
        """Get detector statistics."""
        return self.detector_stats.get(detector_name, {})

    def update_stats(self, detector_name: str, stats: Dict[str, Any]):
        """Update detector statistics."""
        if detector_name not in self.detector_stats:
            self.detector_stats[detector_name] = {}
        self.detector_stats[detector_name].update(stats)


# ============================================================================
# 4. FILE PROCESSOR - Handles file operations
# ============================================================================

class FileProcessor:
    """Processes files for analysis - Single Responsibility: File Processing"""

    def __init__(self, config: AnalyzerConfiguration):
        """Initialize file processor."""
        self.config = config
        self.processed_files = []

    def should_process(self, file_path: Path) -> bool:
        """Check if file should be processed."""
        # Check skip patterns
        for pattern in self.config.get('skip_patterns', []):
            if pattern in str(file_path):
                return False

        # Check file extension
        extensions = self.config.get('file_extensions', ['.py'])
        if not any(str(file_path).endswith(ext) for ext in extensions):
            return False

        # Check file size
        max_size = self.config.get('max_file_size', 1_000_000)
        if file_path.stat().st_size > max_size:
            return False

        return True

    def read_file(self, file_path: Path) -> Optional[str]:
        """Read file content."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return None

    def parse_ast(self, source: str, filename: str) -> Optional[ast.AST]:
        """Parse source code to AST."""
        try:
            return ast.parse(source, filename=filename)
        except Exception as e:
            return None

    def find_python_files(self, directory: Path) -> List[Path]:
        """Find all Python files in directory."""
        files = []
        for pattern in ['**/*.py']:
            for file_path in directory.glob(pattern):
                if self.should_process(file_path):
                    files.append(file_path)
        return files

    def get_processed_count(self) -> int:
        """Get count of processed files."""
        return len(self.processed_files)

    def mark_processed(self, file_path: Path):
        """Mark file as processed."""
        self.processed_files.append(file_path)


# ============================================================================
# 5. RESULT AGGREGATOR - Aggregates analysis results
# ============================================================================

class ResultAggregator:
    """Aggregates analysis results - Single Responsibility: Result Aggregation"""

    def __init__(self):
        """Initialize result aggregator."""
        self.results = []
        self.summary = {}

    def add_result(self, file_path: str, violations: List[Dict[str, Any]]):
        """Add analysis result."""
        self.results.append({
            'file': file_path,
            'violations': violations,
            'count': len(violations)
        })

    def aggregate(self) -> Dict[str, Any]:
        """Aggregate all results."""
        total_violations = sum(r['count'] for r in self.results)
        violations_by_type = {}

        for result in self.results:
            for violation in result['violations']:
                vtype = violation.get('type', 'Unknown')
                violations_by_type[vtype] = violations_by_type.get(vtype, 0) + 1

        return {
            'total_files': len(self.results),
            'total_violations': total_violations,
            'violations_by_type': violations_by_type,
            'files_with_violations': len([r for r in self.results if r['count'] > 0])
        }

    def get_top_violators(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get files with most violations."""
        sorted_results = sorted(self.results, key=lambda x: x['count'], reverse=True)
        return sorted_results[:limit]

    def clear(self):
        """Clear all results."""
        self.results.clear()
        self.summary.clear()

    def export_json(self) -> str:
        """Export results as JSON."""
        return json.dumps({
            'summary': self.aggregate(),
            'details': self.results
        }, indent=2)


# ============================================================================
# 6. MAIN ANALYZER - Orchestrates the analysis
# ============================================================================

class RefactoredAnalyzer:
    """Main analyzer that orchestrates components - Single Responsibility: Orchestration"""

    def __init__(self, project_path: str = ".", config_path: Optional[str] = None):
        """Initialize analyzer with component managers."""
        self.project_path = Path(project_path)

        # Initialize components (Dependency Injection)
        self.config = AnalyzerConfiguration(config_path)
        self.cache = AnalysisCache(self.config.get('max_cache_size', 100))
        self.detectors = DetectorManager()
        self.file_processor = FileProcessor(self.config)
        self.aggregator = ResultAggregator()

    def analyze(self) -> Dict[str, Any]:
        """Main analysis method - orchestrates the process."""
        if self.project_path.is_file():
            return self._analyze_file(self.project_path)
        else:
            return self._analyze_directory(self.project_path)

    def _analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyze single file."""
        # Check cache
        cache_key = str(file_path)
        if self.config.get('enable_caching'):
            cached = self.cache.get(cache_key)
            if cached:
                return cached

        # Process file
        source = self.file_processor.read_file(file_path)
        if not source:
            return {'error': 'Could not read file'}

        tree = self.file_processor.parse_ast(source, str(file_path))
        if not tree:
            return {'error': 'Could not parse file'}

        # Run detectors (simplified for example)
        violations = self._run_detectors(tree, str(file_path), source.splitlines())

        # Aggregate results
        self.aggregator.add_result(str(file_path), violations)
        result = {
            'file': str(file_path),
            'violations': violations,
            'total': len(violations)
        }

        # Cache result
        if self.config.get('enable_caching'):
            self.cache.set(cache_key, result)

        return result

    def _analyze_directory(self, dir_path: Path) -> Dict[str, Any]:
        """Analyze directory."""
        files = self.file_processor.find_python_files(dir_path)

        for file_path in files:
            self._analyze_file(file_path)
            self.file_processor.mark_processed(file_path)

        return self.aggregator.aggregate()

    def _run_detectors(self, tree: ast.AST, file_path: str, source_lines: List[str]) -> List[Dict[str, Any]]:
        """Run all detectors on AST."""
        violations = []

        # Simplified detector execution
        for detector_name in self.detectors.get_all_detectors():
            # In real implementation, would instantiate and run detector
            # For now, just return sample violations
            violations.append({
                'type': detector_name,
                'severity': 'medium',
                'file': file_path,
                'line': 1,
                'description': f'Sample violation from {detector_name}'
            })

        return violations

    def get_statistics(self) -> Dict[str, Any]:
        """Get analysis statistics."""
        return {
            'files_processed': self.file_processor.get_processed_count(),
            'cache_size': self.cache.size(),
            'cache_hit_rate': self.cache.hit_rate(),
            'available_detectors': len(self.detectors.get_all_detectors()),
            'results': self.aggregator.aggregate()
        }


# ============================================================================
# USAGE EXAMPLE - Shows how the refactored components work together
# ============================================================================

def analyze_project(project_path: str = ".", config_path: Optional[str] = None) -> Dict[str, Any]:
    """Convenience function to analyze a project."""
    analyzer = RefactoredAnalyzer(project_path, config_path)
    return analyzer.analyze()