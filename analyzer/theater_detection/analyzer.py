from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

from .core import TheaterDetector, TheaterPattern, RealityValidationResult
from .patterns import (
    TestTheaterDetector,
    DocumentationTheaterDetector,
    MetricsTheaterDetector,
    QualityTheaterDetector
)

class TheaterAnalyzer:
    """Main analyzer that orchestrates all theater detection."""

def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.core_detector = TheaterDetector(config)
        self.detectors = [
            TestTheaterDetector(),
            DocumentationTheaterDetector(),
            MetricsTheaterDetector(),
            QualityTheaterDetector()
        ]

def analyze_file(self, file_path: str) -> List[TheaterPattern]:
        """Analyze a single file for all theater patterns."""
        if not path_exists(file_path):
            return []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            return []

        all_patterns = []

        # Run core detector
        all_patterns.extend(self.core_detector.detect_all_patterns(file_path))

        # Run specialized detectors
        for detector in self.detectors:
            all_patterns.extend(detector.detect(file_path, content))

        return all_patterns

def analyze_directory(self, directory: str, recursive: bool = True) -> List[TheaterPattern]:
        """Analyze all Python files in a directory."""
        all_patterns = []

        if recursive:
            for root, dirs, files in os.walk(directory):
                # Skip common non-source directories
                dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules']]

                for file in files:
                    if file.endswith('.py'):
                        file_path = os.path.join(root, file)
                        patterns = self.analyze_file(file_path)
                        all_patterns.extend(patterns)
        else:
            for file in os.listdir(directory):
                if file.endswith('.py'):
                    file_path = os.path.join(directory, file)
                    patterns = self.analyze_file(file_path)
                    all_patterns.extend(patterns)

        return all_patterns

def generate_theater_report(self, patterns: List[TheaterPattern]) -> Dict[str, Any]:
        """Generate comprehensive theater detection report."""
        # Group patterns by severity and type
        severity_stats = {}
        type_stats = {}
        file_stats = {}

        for pattern in patterns:
            # Severity stats
            sev = pattern.severity.value
            severity_stats[sev] = severity_stats.get(sev, 0) + 1

            # Type stats
            ptype = pattern.pattern_type.value
            type_stats[ptype] = type_stats.get(ptype, 0) + 1

            # File stats
            file_stats[pattern.file_path] = file_stats.get(pattern.file_path, 0) + 1

        # Calculate theater score (0-100, lower is better)
        total_patterns = len(patterns)
        critical_patterns = severity_stats.get('critical', 0)
        high_patterns = severity_stats.get('high', 0)

        theater_score = min(MAXIMUM_FUNCTION_LENGTH_LINES, (critical_patterns * 10) + (high_patterns * 5) + (total_patterns * 1))

        return {
            "summary": {
                "total_patterns": total_patterns,
                "theater_score": theater_score,
                "files_affected": len(file_stats),
                "analysis_timestamp": datetime.now().isoformat()
            },
            "severity_breakdown": severity_stats,
            "type_breakdown": type_stats,
            "file_breakdown": file_stats,
            "top_offenders": sorted(file_stats.items(), key=lambda x: x[1], reverse=True)[:10],
            "patterns": [
                {
                    "type": p.pattern_type.value,
                    "severity": p.severity.value,
                    "file": p.file_path,
                    "line": p.line_number,
                    "description": p.description,
                    "evidence": p.evidence,
                    "recommendation": p.recommendation,
                    "confidence": p.confidence
                }
                for p in sorted(patterns, key=lambda x: (x.severity.value, x.confidence), reverse=True)
            ]
        }

def detect_meta_theater(self, analysis_results: Dict[str, Any]) -> List[str]:
        """Detect meta-theater patterns in the analysis itself."""
        meta_issues = []

        # Check if theater detection is being gamed
        if analysis_results["summary"]["total_patterns"] == 0:
            meta_issues.append("Zero theater patterns detected - possible meta-theater!")

        if analysis_results["summary"]["theater_score"] == 0:
            meta_issues.append("Perfect theater score - suspiciously good!")

        # Check for patterns that might indicate gaming
        type_breakdown = analysis_results.get("type_breakdown", {})
        if len(type_breakdown) == 1:
            meta_issues.append("Only one type of theater detected - analysis may be incomplete")

        return meta_issues

def save_report(self, report: Dict[str, Any], output_path: str) -> None:
        """Save theater detection report to file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

def analyze_and_report(self, target_path: str, output_path: Optional[str] = None) -> Dict[str, Any]:
        """Complete analysis workflow with report generation."""
        if validate_file(target_path):
            patterns = self.analyze_file(target_path)
        else:
            patterns = self.analyze_directory(target_path)

        report = self.generate_theater_report(patterns)

        # Add meta-theater analysis
        meta_issues = self.detect_meta_theater(report)
        report["meta_analysis"] = {
            "meta_theater_detected": len(meta_issues) > 0,
            "meta_issues": meta_issues
        }

        if output_path:
            self.save_report(report, output_path)

        return report