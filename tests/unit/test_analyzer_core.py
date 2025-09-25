#!/usr/bin/env python3
"""Unit tests for analyzer core functionality."""

from pathlib import Path
import sys

import pytest

from analyzer.core import UnifiedAnalyzer
from analyzer.ast_engine.core_analyzer import CoreASTAnalyzer
from analyzer.architecture.enhanced_metrics import EnhancedMetrics

class TestUnifiedAnalyzer:
    """Test unified analyzer functionality."""
    
    def test_analyzer_initialization(self):
        """Test analyzer can be initialized."""
        analyzer = UnifiedAnalyzer()
        assert analyzer is not None
        
    def test_analyzer_config_loading(self):
        """Test configuration loading."""
        analyzer = UnifiedAnalyzer()
        config = analyzer.get_config()
        assert isinstance(config, dict)
        
    def test_analyze_empty_codebase(self):
        """Test analysis of empty codebase."""
        analyzer = UnifiedAnalyzer()
        result = analyzer.analyze_codebase([])
        assert 'metrics' in result
        assert 'violations' in result

class TestCoreASTAnalyzer:
    """Test core AST analyzer."""
    
    def test_ast_analyzer_creation(self):
        """Test AST analyzer can be created."""
        analyzer = CoreASTAnalyzer()
        assert analyzer is not None
        
    def test_parse_simple_python_code(self):
        """Test parsing simple Python code."""
        analyzer = CoreASTAnalyzer()
        code = "def hello(): return 'world'"
        result = analyzer.parse_code(code)
        assert result is not None

class TestEnhancedMetrics:
    """Test enhanced metrics calculation."""
    
    def test_metrics_initialization(self):
        """Test metrics can be initialized."""
        metrics = EnhancedMetrics()
        assert metrics is not None
        
    def test_calculate_basic_metrics(self):
        """Test basic metrics calculation."""
        metrics = EnhancedMetrics()
        result = metrics.calculate_metrics([])
        assert isinstance(result, dict)
        assert 'loc' in result
        assert 'complexity' in result
