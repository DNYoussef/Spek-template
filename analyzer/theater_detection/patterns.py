from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES

import re
import ast
import json
import os
from typing import List, Dict, Any, Optional
from .core import TheaterPattern, TheaterType, SeverityLevel

class TestTheaterDetector:
    """Detects theater patterns in test code."""

def __init__(self):
        self.suspicious_patterns = [
            r'assert\s+True',
            r'assert\s+1\s*==\s*1',
            r'assert\s+\".*\"\s*==\s*\".*\"',  # Identical string assertions
            r'@pytest\.mark\.skip',
            r'@unittest\.skip',
        ]

def detect(self, file_path: str, content: str) -> List[TheaterPattern]:
        """Detect test theater patterns."""
        patterns = []

        try:
            tree = ast.parse(content)

            # Analyze test functions
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) and node.name.startswith('test_'):
                    patterns.extend(self._analyze_test_function(file_path, node, content))

        except SyntaxError:
            pass  # Skip files with syntax errors

        # Check for suspicious patterns
        for pattern in self.suspicious_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    pattern_type=TheaterType.TEST_GAMING,
                    severity=SeverityLevel.HIGH,
                    file_path=file_path,
                    line_number=line_num,
                    description=f"Suspicious test pattern: {match.group()}",
                    evidence={"pattern": match.group()},
                    recommendation="Replace with meaningful test assertions",
                    confidence=0.8
                ))

        return patterns

def _analyze_test_function(self, file_path: str, node: ast.FunctionDef, content: str) -> List[TheaterPattern]:
        """Analyze individual test function for theater patterns."""
        patterns = []

        # Check for empty test bodies
        if len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
            patterns.append(TheaterPattern(
                pattern_type=TheaterType.TEST_GAMING,
                severity=SeverityLevel.CRITICAL,
                file_path=file_path,
                line_number=node.lineno,
                description="Empty test function provides no validation",
                evidence={"function_name": node.name},
                recommendation="Implement actual test logic or remove",
                confidence=0.99
            ))

        # Check for trivial assertions
        assertion_count = 0
        for stmt in ast.walk(node):
            if isinstance(stmt, ast.Assert):
                assertion_count += 1

        if assertion_count == 0:
            patterns.append(TheaterPattern(
                pattern_type=TheaterType.TEST_GAMING,
                severity=SeverityLevel.HIGH,
                file_path=file_path,
                line_number=node.lineno,
                description="Test function has no assertions",
                evidence={"function_name": node.name, "assertion_count": 0},
                recommendation="Add meaningful assertions to validate behavior",
                confidence=0.9
            ))

        return patterns

class DocumentationTheaterDetector:
    """Detects fake or misleading documentation patterns."""

def __init__(self):
        self.theater_indicators = [
            r'# This function does something',
            r'# Magic happens here',
            r'# Implementation details',
        ]

def detect(self, file_path: str, content: str) -> List[TheaterPattern]:
        """Detect documentation theater patterns."""
        patterns = []

        # Check for theater indicators
        for pattern in self.theater_indicators:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    pattern_type=TheaterType.DOCUMENTATION_THEATER,
                    severity=SeverityLevel.MEDIUM,
                    file_path=file_path,
                    line_number=line_num,
                    description="Placeholder documentation instead of real content",
                    evidence={"match": match.group()},
                    recommendation="Replace with actual documentation",
                    confidence=0.85
                ))

        # Check for empty docstrings
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                    docstring = ast.get_docstring(node)
                    if docstring and len(docstring.strip()) < 10:
                        patterns.append(TheaterPattern(
                            pattern_type=TheaterType.DOCUMENTATION_THEATER,
                            severity=SeverityLevel.LOW,
                            file_path=file_path,
                            line_number=node.lineno,
                            description="Trivial or empty docstring",
                            evidence={"name": node.name, "docstring": docstring},
                            recommendation="Provide meaningful documentation",
                            confidence=0.7
                        ))
        except SyntaxError:
            pass

        return patterns

class MetricsTheaterDetector:
    """Detects inflated or fake metrics."""

def __init__(self):
        self.suspicious_metrics = [
            r'coverage\s*=\s*100',
            r'quality\s*=\s*["\']?perfect["\']?',
            r'score\s*=\s*1\.0',
            r'rating\s*=\s*["\']?A\+?["\']?',
            r'success_rate\s*=\s*100',
        ]

def detect(self, file_path: str, content: str) -> List[TheaterPattern]:
        """Detect metrics theater patterns."""
        patterns = []

        for pattern in self.suspicious_metrics:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    pattern_type=TheaterType.METRICS_INFLATION,
                    severity=SeverityLevel.MEDIUM,
                    file_path=file_path,
                    line_number=line_num,
                    description="Hardcoded perfect metrics detected",
                    evidence={"metric": match.group()},
                    recommendation="Calculate metrics from actual measurements",
                    confidence=0.75
                ))

        return patterns

class QualityTheaterDetector:
    """Detects fake quality improvements and facades."""

def __init__(self):
        self.quality_facades = [
            r'# Quality improved',
            r'# Fixed all issues',
            r'# Perfect code',
            r'# No bugs',
            r'# MAXIMUM_FUNCTION_LENGTH_LINES% tested',
            r'pass\s*#.*implement',
        ]

def detect(self, file_path: str, content: str) -> List[TheaterPattern]:
        """Detect quality theater patterns."""
        patterns = []

        for pattern in self.quality_facades:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    pattern_type=TheaterType.QUALITY_FACADE,
                    severity=SeverityLevel.HIGH,
                    file_path=file_path,
                    line_number=line_num,
                    description="Quality facade comment without actual improvement",
                    evidence={"comment": match.group()},
                    recommendation="Implement actual quality improvements",
                    confidence=0.8
                ))

        # Check for NotImplementedError without proper handling
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.Raise) and isinstance(node.exc, ast.Call):
                    if isinstance(node.exc.func, ast.Name) and node.exc.func.id == 'NotImplementedError':
                        patterns.append(TheaterPattern(
                            pattern_type=TheaterType.QUALITY_FACADE,
                            severity=SeverityLevel.MEDIUM,
                            file_path=file_path,
                            line_number=node.lineno,
                            description="NotImplementedError indicates incomplete functionality",
                            evidence={"type": "NotImplementedError"},
                            recommendation="Implement the functionality or remove the method",
                            confidence=0.9
                        ))
        except SyntaxError:
            pass

        return patterns