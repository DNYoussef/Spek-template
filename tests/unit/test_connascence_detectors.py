#!/usr/bin/env python3
"""Unit tests for connascence detector modules."""

from pathlib import Path
import sys

import pytest

from analyzer.detectors.connascence_ast_analyzer import ConnascenceASTAnalyzer
from analyzer.detectors.position_detector import PositionDetector
from analyzer.detectors.timing_detector import TimingDetector

class TestConnascenceASTAnalyzer:
    """Test connascence AST analyzer."""
    
    def test_analyzer_initialization(self):
        """Test analyzer can be initialized."""
        analyzer = ConnascenceASTAnalyzer()
        assert analyzer is not None
        
    def test_detect_simple_connascence(self):
        """Test detection of simple connascence patterns."""
        analyzer = ConnascenceASTAnalyzer()
        code = """
def func1(a, b):
    return a + b

def func2():
    return func1(1, 2)
"""
        violations = analyzer.detect_violations(code)
        assert isinstance(violations, list)

class TestPositionDetector:
    """Test position detector."""
    
    def test_detector_creation(self):
        """Test detector can be created."""
        detector = PositionDetector()
        assert detector is not None
        
    def test_detect_position_violations(self):
        """Test detection of position violations."""
        detector = PositionDetector()
        code = "def func(a, b, c=1, d=2): pass"
        violations = detector.analyze(code)
        assert isinstance(violations, list)

class TestTimingDetector:
    """Test timing detector."""
    
    def test_detector_creation(self):
        """Test detector can be created."""
        detector = TimingDetector()
        assert detector is not None
        
    def test_detect_timing_violations(self):
        """Test detection of timing violations."""
        detector = TimingDetector()
        code = """
import time
def slow_func():
    time.sleep(1)
    return True
"""
        violations = detector.analyze(code)
        assert isinstance(violations, list)
