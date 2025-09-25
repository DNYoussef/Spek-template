#!/usr/bin/env python3
"""End-to-end tests for complete analysis workflow."""

from pathlib import Path
import json
import os
import sys
import tempfile

import pytest

from analyzer.core import UnifiedAnalyzer
from analyzer.utils.config_manager import ConfigManager

class TestCompleteWorkflow:
    """End-to-end tests for complete analysis workflow."""
    
    def test_analyze_real_project_structure(self):
        """Test analysis of realistic project structure."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create realistic project structure
            project_path = Path(temp_dir)
            
            # Create main module
            (project_path / 'src').mkdir()
            (project_path / 'src' / '__init__.py').write_text('')
            (project_path / 'src' / 'main.py').write_text("""
#!/usr/bin/env python3
from .utils import helper_function
from .models import DataModel

def main():
    data = DataModel({'key': 'value'})
    result = helper_function(data)
    return result

if __name__ == '__main__':
    main()
""")
            
            # Create utils module
            (project_path / 'src' / 'utils.py').write_text("""
def helper_function(data_model):
    if hasattr(data_model, 'data'):
        return process_data(data_model.data)
    return None

def process_data(data):
    return {k: v.upper() if isinstance(v, str) else v for k, v in data.items()}
""")
            
            # Create models module
            (project_path / 'src' / 'models.py').write_text("""
class DataModel:
    def __init__(self, data):
        self.data = data
        self.metadata = {'created': True}
    
    def get_data(self):
        return self.data
    
    def update_data(self, new_data):
        self.data.update(new_data)
""")
            
            # Run complete analysis
            analyzer = UnifiedAnalyzer()
            result = analyzer.analyze_directory(str(project_path / 'src'))
            
            # Verify comprehensive results
            assert 'files_analyzed' in result
            assert 'overall_metrics' in result
            assert 'violations_summary' in result
            assert 'recommendations' in result
            
            # Verify multiple files analyzed
            assert result['files_analyzed'] >= 3
            
            # Verify metrics aggregation
            metrics = result['overall_metrics']
            assert metrics['total_loc'] > 0
            assert metrics['total_functions'] > 0
            assert metrics['total_classes'] > 0
    
    def test_configuration_driven_analysis(self):
        """Test analysis with different configuration settings."""
        code = """
def function_with_many_params(a, b, c, d, e, f, g, h):
    return sum([a, b, c, d, e, f, g, h])

class LargeClass:
    def method1(self): pass
    def method2(self): pass
    def method3(self): pass
    def method4(self): pass
    def method5(self): pass
    def method6(self): pass
"""
        
        # Test with strict config
        strict_config = {
            'max_params': 4,
            'max_methods_per_class': 5,
            'max_complexity': 5
        }
        
        analyzer = UnifiedAnalyzer(config=strict_config)
        strict_result = analyzer.analyze_code(code)
        
        # Test with lenient config
        lenient_config = {
            'max_params': 10,
            'max_methods_per_class': 10,
            'max_complexity': 15
        }
        
        analyzer = UnifiedAnalyzer(config=lenient_config)
        lenient_result = analyzer.analyze_code(code)
        
        # Strict config should find more violations
        assert len(strict_result['violations']) >= len(lenient_result['violations'])
    
    def test_output_format_validation(self):
        """Test that output format matches expected schema."""
        code = "def test(): return 'hello'"
        
        analyzer = UnifiedAnalyzer()
        result = analyzer.analyze_code(code)
        
        # Validate required top-level keys
        required_keys = ['metrics', 'violations', 'summary', 'timestamp']
        for key in required_keys:
            assert key in result, f"Missing required key: {key}"
        
        # Validate metrics structure
        metrics = result['metrics']
        metrics_keys = ['loc', 'complexity', 'maintainability', 'quality_score']
        for key in metrics_keys:
            assert key in metrics, f"Missing metric: {key}"
            assert isinstance(metrics[key], (int, float)), f"Metric {key} should be numeric"
        
        # Validate violations structure
        violations = result['violations']
        assert isinstance(violations, list)
        for violation in violations:
            violation_keys = ['type', 'severity', 'line', 'message']
            for key in violation_keys:
                assert key in violation, f"Missing violation key: {key}"
        
        # Validate summary structure
        summary = result['summary']
        summary_keys = ['total_violations', 'critical_violations', 'overall_grade']
        for key in summary_keys:
            assert key in summary, f"Missing summary key: {key}"
