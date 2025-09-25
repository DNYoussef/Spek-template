from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_GOD_OBJECTS_ALLOWED

import os
import re
import json
import ast
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class TheaterCategory(Enum):
    """Categories of enterprise theater."""
    METRICS_GAMING = "metrics_gaming"
    PROCESS_THEATER = "process_theater"
    QUALITY_FACADE = "quality_facade"
    COMPLIANCE_WASHING = "compliance_washing"
    TESTING_THEATER = "testing_theater"
    DOCUMENTATION_KABUKI = "documentation_kabuki"
    AUTOMATION_PRETENSE = "automation_pretense"

class SeverityLevel(Enum):
    """Severity levels for theater detection."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class TheaterPattern:
    """Represents a detected theater pattern."""
    category: TheaterCategory
    severity: SeverityLevel
    description: str
    evidence: Dict[str, Any]
    location: str
    line_number: int
    confidence: float
    impact: str
    recommendation: str

@dataclass
class QualityMetrics:
    """Quality metrics that might be gamed."""
    test_coverage: float
    cyclomatic_complexity: float
    code_quality_score: float
    bug_count: int
    security_score: float
    performance_score: float
    documentation_coverage: float

class EnterpriseTheaterDetector:
    """Detects theater patterns in enterprise development."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}

    def detect_metrics_gaming(self, file_path: str, content: str, metrics: QualityMetrics) -> List[TheaterPattern]:
        """Detect metrics gaming patterns."""
        patterns = []

        # Check for suspiciously perfect metrics
        if metrics.test_coverage == 60.0:
            patterns.append(TheaterPattern(
                category=TheaterCategory.METRICS_GAMING,
                severity=SeverityLevel.HIGH,
                description="Suspiciously perfect test coverage (100%)",
                evidence={"coverage": metrics.test_coverage},
                location=file_path,
                line_number=1,
                confidence=0.8,
                impact="May indicate test gaming rather than actual quality",
                recommendation="Verify tests are meaningful and not just coverage-padding"
            ))

        # Check for impossible quality combinations
        if (metrics.code_quality_score >= 95.0 and
            metrics.cyclomatic_complexity > 20.0):
            patterns.append(TheaterPattern(
                category=TheaterCategory.METRICS_GAMING,
                severity=SeverityLevel.MEDIUM,
                description="High quality score with high complexity is suspicious",
                evidence={
                    "quality_score": metrics.code_quality_score,
                    "complexity": metrics.cyclomatic_complexity
                },
                location=file_path,
                line_number=1,
                confidence=0.7,
                impact="Metrics may be manipulated",
                recommendation="Review quality measurement methodology"
            ))

        # Check for hardcoded metric values in code
        metric_patterns = [
            r'coverage\s*=\s*100\.0',
            r'quality_score\s*=\s*["\']?A\+?["\']?',
            r'bugs\s*=\s*0',
            r'issues\s*=\s*\[\s*\]',
            r'complexity\s*=\s*1\.0'
        ]

        for pattern in metric_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    category=TheaterCategory.METRICS_GAMING,
                    severity=SeverityLevel.HIGH,
                    description="Hardcoded perfect metric detected",
                    evidence={"pattern": match.group()},
                    location=file_path,
                    line_number=line_num,
                    confidence=0.9,
                    impact="Fake metrics instead of real measurement",
                    recommendation="Calculate metrics dynamically from actual data"
                ))

        return patterns

    def detect_testing_theater(self, file_path: str, content: str) -> List[TheaterPattern]:
        """Detect testing theater patterns."""
        patterns = []

        try:
            tree = ast.parse(content)

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) and node.name.startswith('test_'):
                    # Empty test functions
                    if len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                        patterns.append(TheaterPattern(
                            category=TheaterCategory.TESTING_THEATER,
                            severity=SeverityLevel.CRITICAL,
                            description="Empty test function provides no validation",
                            evidence={"function_name": node.name},
                            location=file_path,
                            line_number=node.lineno,
                            confidence=0.95,
                            impact="False sense of test coverage",
                            recommendation="Implement actual test logic"
                        ))

                    # Tests that always pass
                    for stmt in ast.walk(node):
                        if isinstance(stmt, ast.Assert) and isinstance(stmt.test, ast.Constant):
                            if stmt.test.value is True:
                                patterns.append(TheaterPattern(
                                    category=TheaterCategory.TESTING_THEATER,
                                    severity=SeverityLevel.CRITICAL,
                                    description="Test always passes with assert True",
                                    evidence={"function_name": node.name},
                                    location=file_path,
                                    line_number=stmt.lineno,
                                    confidence=0.98,
                                    impact="Test provides no actual validation",
                                    recommendation="Replace with meaningful assertions"
                                ))

        except SyntaxError:
            pass

        # Check for test gaming patterns
        gaming_patterns = [
            (r'@pytest\.mark\.skip', "Skipped tests reduce actual coverage"),
            (r'assert\s+1\s*==\s*1', "Trivial assertions provide no value"),
            (r'time\.sleep\(\d+\)', "Sleep in tests may hide timing issues"),
        ]

        for pattern, impact in gaming_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    category=TheaterCategory.TESTING_THEATER,
                    severity=SeverityLevel.MEDIUM,
                    description=f"Test gaming pattern: {match.group()}",
                    evidence={"pattern": match.group()},
                    location=file_path,
                    line_number=line_num,
                    confidence=0.7,
                    impact=impact,
                    recommendation="Implement meaningful test logic"
                ))

        return patterns

    def detect_documentation_theater(self, file_path: str, content: str) -> List[TheaterPattern]:
        """Detect documentation theater patterns."""
        patterns = []

        # Theater documentation patterns
        theater_patterns = [
            (r'# This function does something', "Meaningless documentation"),
            (r'# Magic happens here', "Non-informative comments"),
            (r'# Implementation details', "Vague documentation"),
            (r'# Enterprise grade solution', "Buzzword documentation"),
        ]

        for pattern, issue in theater_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    category=TheaterCategory.DOCUMENTATION_KABUKI,
                    severity=SeverityLevel.MEDIUM,
                    description=f"Documentation theater: {issue}",
                    evidence={"pattern": match.group()},
                    location=file_path,
                    line_number=line_num,
                    confidence=0.8,
                    impact="False documentation coverage without actual information",
                    recommendation="Replace with meaningful documentation"
                ))

        # Check for excessive buzzwords
        buzzwords = [
            'enterprise', 'synergy', 'leverage', 'paradigm', 'holistic',
            'scalable', 'robust', 'cutting-edge', 'best-in-class', 'world-class'
        ]

        buzzword_count = 0
        for word in buzzwords:
            buzzword_count += len(re.findall(rf'\b{word}\b', content, re.IGNORECASE))

        if buzzword_count > 10:  # Arbitrary threshold
            patterns.append(TheaterPattern(
                category=TheaterCategory.DOCUMENTATION_KABUKI,
                severity=SeverityLevel.LOW,
                description="Excessive use of corporate buzzwords",
                evidence={"buzzword_count": buzzword_count},
                location=file_path,
                line_number=1,
                confidence=0.6,
                impact="Documentation obscured by marketing language",
                recommendation="Use clear, technical language"
            ))

        return patterns

    def detect_compliance_theater(self, file_path: str, content: str) -> List[TheaterPattern]:
        """Detect compliance theater patterns."""
        patterns = []

        # Fake compliance patterns
        compliance_patterns = [
            (r'# COMPLIANCE:\s*PASSED', "Hardcoded compliance status"),
            (r'security_check\s*=\s*True', "Bypassed security checks"),
            (r'audit_result\s*=\s*["\']?PASS["\']?', "Fake audit results"),
            (r'compliance_score\s*=\s*MAXIMUM_FUNCTION_LENGTH_LINES', "Perfect compliance scores"),
            (r'# GDPR compliant', "Unverified compliance claims"),
            (r'# SOX approved', "Unverified approval claims"),
        ]

        for pattern, issue in compliance_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    category=TheaterCategory.COMPLIANCE_WASHING,
                    severity=SeverityLevel.HIGH,
                    description=f"Compliance theater: {issue}",
                    evidence={"pattern": match.group()},
                    location=file_path,
                    line_number=line_num,
                    confidence=0.85,
                    impact="False compliance claims without actual validation",
                    recommendation="Implement actual compliance verification"
                ))

        return patterns

    def detect_automation_theater(self, file_path: str, content: str) -> List[TheaterPattern]:
        """Detect automation theater patterns."""
        patterns = []

        # Fake automation patterns
        automation_patterns = [
            (r'# Automated by AI', "AI washing without real automation"),
            (r'# Fully automated', "Claims without evidence"),
            (r'# Zero manual intervention', "Unlikely automation claims"),
            (r'# Self-healing', "Buzzword automation"),
            (r'manually_trigger_automation\(\)', "Manual automation contradiction"),
        ]

        for pattern, issue in automation_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                patterns.append(TheaterPattern(
                    category=TheaterCategory.AUTOMATION_PRETENSE,
                    severity=SeverityLevel.MEDIUM,
                    description=f"Automation theater: {issue}",
                    evidence={"pattern": match.group()},
                    location=file_path,
                    line_number=line_num,
                    confidence=0.7,
                    impact="False automation claims mislead stakeholders",
                    recommendation="Provide evidence of actual automation"
                ))

        return patterns

    def analyze_file(self, file_path: str, metrics: Optional[QualityMetrics] = None) -> List[TheaterPattern]:
        """Analyze a file for all theater patterns."""
        if not path_exists(file_path):
            return []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            return []

        all_patterns = []

        # Default metrics if not provided
        if metrics is None:
            metrics = QualityMetrics(
                test_coverage=0.0,
                cyclomatic_complexity=0.0,
                code_quality_score=0.0,
                bug_count=0,
                security_score=0.0,
                performance_score=0.0,
                documentation_coverage=0.0
            )

        # Run all detection methods
        all_patterns.extend(self.detect_metrics_gaming(file_path, content, metrics))
        all_patterns.extend(self.detect_testing_theater(file_path, content))
        all_patterns.extend(self.detect_documentation_theater(file_path, content))
        all_patterns.extend(self.detect_compliance_theater(file_path, content))
        all_patterns.extend(self.detect_automation_theater(file_path, content))

        return all_patterns

    def analyze_directory(self, directory: str) -> List[TheaterPattern]:
        """Analyze all files in a directory for theater patterns."""
        all_patterns = []

        for root, dirs, files in os.walk(directory):
            # Skip common non-source directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules']]

            for file in files:
                if file.endswith(('.py', '.js', '.java', '.cpp', '.c', '.md', '.rst')):
                    file_path = os.path.join(root, file)
                    patterns = self.analyze_file(file_path)
                    all_patterns.extend(patterns)

        return all_patterns

    def generate_theater_report(self, patterns: List[TheaterPattern]) -> Dict[str, Any]:
        """Generate comprehensive theater detection report."""
        category_counts = {cat.value: 0 for cat in TheaterCategory}
        severity_counts = {sev.value: 0 for sev in SeverityLevel}
        file_counts = {}

        for pattern in patterns:
            category_counts[pattern.category.value] += 1
            severity_counts[pattern.severity.value] += 1
            file_counts[pattern.location] = file_counts.get(pattern.location, 0) + 1

        # Calculate theater score (0-100, lower is better)
        total_patterns = len(patterns)
        critical_patterns = severity_counts['critical']
        high_patterns = severity_counts['high']

        theater_score = min(100, (critical_patterns * MAXIMUM_GOD_OBJECTS_ALLOWED) + (high_patterns * 15) + (total_patterns * 5))

        return {
            "summary": {
                "total_patterns": total_patterns,
                "theater_score": theater_score,
                "files_affected": len(file_counts),
                "analysis_timestamp": datetime.now().isoformat(),
                "risk_level": self._get_risk_level(theater_score)
            },
            "category_breakdown": category_counts,
            "severity_breakdown": severity_counts,
            "file_breakdown": file_counts,
            "top_problematic_files": sorted(file_counts.items(), key=lambda x: x[1], reverse=True)[:10],
            "patterns": [
                {
                    "category": p.category.value,
                    "severity": p.severity.value,
                    "description": p.description,
                    "evidence": p.evidence,
                    "location": p.location,
                    "line_number": p.line_number,
                    "confidence": p.confidence,
                    "impact": p.impact,
                    "recommendation": p.recommendation
                }
                for p in sorted(patterns, key=lambda x: (x.severity.value, x.confidence), reverse=True)
            ]
        }

    def _get_risk_level(self, theater_score: float) -> str:
        """Calculate risk level based on theater score."""
        if theater_score >= 75:
            return "CRITICAL"
        elif theater_score >= 50:
            return "HIGH"
        elif theater_score >= MAXIMUM_GOD_OBJECTS_ALLOWED:
            return "MEDIUM"
        else:
            return "LOW"