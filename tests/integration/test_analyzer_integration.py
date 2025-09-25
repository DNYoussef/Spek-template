#!/usr/bin/env python3
"""Integration tests for analyzer system components."""

from pathlib import Path
import json
import sys
import tempfile

import pytest

from analyzer.core import UnifiedAnalyzer
from analyzer.detectors.connascence_ast_analyzer import ConnascenceASTAnalyzer
from analyzer.architecture.enhanced_metrics import EnhancedMetrics

class TestAnalyzerIntegration:
    """Integration tests for analyzer components working together."""
    
    def test_full_analysis_pipeline(self):
        """Test complete analysis pipeline from code to results."""
        # Create sample code file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write("""
def calculate_total(items):
    total = 0
    for item in items:
        total += item.price
    return total

class ShoppingCart:
    def __init__(self):
        self.items = []
        
    def add_item(self, item):
        self.items.append(item)
        
    def get_total(self):
        return calculate_total(self.items)
""")
            temp_file = f.name
        
        try:
            # Run full analysis
            analyzer = UnifiedAnalyzer()
            result = analyzer.analyze_file(temp_file)
            
            # Verify results structure
            assert 'metrics' in result
            assert 'violations' in result
            assert 'summary' in result
            
            # Verify metrics calculated
            metrics = result['metrics']
            assert metrics['loc'] > 0
            assert 'complexity' in metrics
            
        finally:
            Path(temp_file).unlink()
    
    def test_connascence_detection_integration(self):
        """Test connascence detection integrated with metrics."""
        code = """
def process_data(data, format_type):
    if format_type == 'json':
        return json.dumps(data)
    elif format_type == 'xml':
        return f'<data>{data}</data>'
    return str(data)

def handle_request(request):
    data = request.get_data()
    fmt = request.get_format()  # Connascence of Name
    return process_data(data, fmt)
"""
        
        analyzer = ConnascenceASTAnalyzer()
        violations = analyzer.detect_violations(code)
        
        # Should detect connascence violations
        assert len(violations) > 0
        
        # Verify violation structure
        for violation in violations:
            assert 'type' in violation
            assert 'severity' in violation
            assert 'line' in violation
    
    def test_metrics_with_violations_correlation(self):
        """Test that metrics correlate with violation counts."""
        simple_code = "def simple(): return 1"
        complex_code = """
def complex_func(a, b, c, d, e):
    if a > b:
        if c > d:
            if e > 0:
                return a + b + c + d + e
            else:
                return a - b - c - d - e
        else:
            return a * b * c * d * e
    else:
        return a / (b or 1)
"""
        
        analyzer = UnifiedAnalyzer()
        
        simple_result = analyzer.analyze_code(simple_code)
        complex_result = analyzer.analyze_code(complex_code)
        
        # Complex code should have higher metrics
        assert complex_result['metrics']['complexity'] > simple_result['metrics']['complexity']
        assert len(complex_result['violations']) >= len(simple_result['violations'])
