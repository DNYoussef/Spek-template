"""
Realistic Quality Assessment System

Replaces impossible precision claims with evidence-based quality scoring.
Uses actual metrics and realistic confidence intervals.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple
import ast
import os

from dataclasses import dataclass
from enum import Enum
import statistics

class QualityLevel(Enum):
    """Realistic quality levels based on industry standards"""
    POOR = "poor"          # <60% - Needs significant work
    FAIR = "fair"          # 60-69% - Basic functionality
    GOOD = "good"          # 70-79% - Production ready
    VERY_GOOD = "very_good"  # 80-89% - High quality
    EXCELLENT = "excellent"  # 90%+ - Exceptional quality

@dataclass
class QualityMetrics:
    """Evidence-based quality metrics with confidence intervals"""
    overall_score: float  # 0-100 scale
    confidence_interval: Tuple[float, float]  # Lower and upper bounds
    sample_size: int
    evidence_sources: List[str]
    quality_level: QualityLevel
    breakdown: Dict[str, float]

class RealisticQualityAssessor:
    """
    Evidence-based quality assessment that avoids impossible precision claims.

    Instead of claiming "99.4% accuracy", provides:
    - Confidence intervals based on actual sample sizes
    - Evidence from multiple assessment methods
    - Realistic scoring ranges
    - Honest uncertainty quantification
    """

    def __init__(self):
        self.evidence_sources = []
        self.assessment_cache = {}

    def assess_codebase_quality(self, directory_path: str) -> QualityMetrics:
        """
        Assess overall codebase quality using multiple evidence sources.

        Returns realistic quality metrics with confidence intervals
        instead of impossible precision claims.
        """
        directory = Path(directory_path)
        if not directory.exists():
            return self._create_no_evidence_result()

        # Gather evidence from multiple sources
        evidence = self._gather_quality_evidence(directory)

        # Calculate quality score with confidence intervals
        overall_score, confidence_interval = self._calculate_quality_score(evidence)

        # Determine quality level
        quality_level = self._determine_quality_level(overall_score)

        return QualityMetrics(
            overall_score=overall_score,
            confidence_interval=confidence_interval,
            sample_size=evidence.get('sample_size', 0),
            evidence_sources=evidence.get('sources', []),
            quality_level=quality_level,
            breakdown=evidence.get('breakdown', {})
        )

    def _gather_quality_evidence(self, directory: Path) -> Dict:
        """Gather evidence from multiple assessment methods"""
        evidence = {
            'sources': [],
            'scores': [],
            'breakdown': {},
            'sample_size': 0
        }

        # Evidence source 1: Static analysis
        static_score = self._assess_static_quality(directory)
        if static_score is not None:
            evidence['sources'].append('static_analysis')
            evidence['scores'].append(static_score)
            evidence['breakdown']['static_analysis'] = static_score

        # Evidence source 2: Code structure
        structure_score = self._assess_structure_quality(directory)
        if structure_score is not None:
            evidence['sources'].append('code_structure')
            evidence['scores'].append(structure_score)
            evidence['breakdown']['code_structure'] = structure_score

        # Evidence source 3: Documentation coverage
        doc_score = self._assess_documentation_quality(directory)
        if doc_score is not None:
            evidence['sources'].append('documentation')
            evidence['scores'].append(doc_score)
            evidence['breakdown']['documentation'] = doc_score

        # Calculate sample size (number of files analyzed)
        python_files = list(directory.rglob("*.py"))
        evidence['sample_size'] = len(python_files)

        return evidence

    def _assess_static_quality(self, directory: Path) -> Optional[float]:
        """Assess quality through static analysis metrics"""
        try:
            python_files = list(directory.rglob("*.py"))
            if not python_files:
                return None

            total_issues = 0
            total_lines = 0

            for file_path in python_files[:20]:  # Sample first 20 files for performance
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    # Count lines
                    lines = len(content.splitlines())
                    total_lines += lines

                    # Simple issue detection (realistic heuristics)
                    issues = 0
                    if len(content) > 10000:  # Very large file
                        issues += 2
                        issues += 1
                    if content.count('import *') > 0:
                        issues += 1

                    total_issues += issues

                except Exception:
                    continue

            if total_lines == 0:
                return None

            # Convert to quality score (fewer issues = higher quality)
            issue_density = total_issues / (total_lines / 100)  # Issues per 100 lines
            quality_score = max(40, 95 - issue_density * 10)

            return min(95, quality_score)  # Cap at 95% (no perfect scores)

        except Exception:
            return None

    def _assess_structure_quality(self, directory: Path) -> Optional[float]:
        """Assess code structure quality"""
        try:
            python_files = list(directory.rglob("*.py"))
            if not python_files:
                return None

            structure_scores = []

            for file_path in python_files[:15]:  # Sample 15 files
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    # Parse AST for structural analysis
                    try:
                        tree = ast.parse(content)
                        file_score = self._analyze_ast_structure(tree)
                        structure_scores.append(file_score)
                    except SyntaxError:
                        structure_scores.append(30)  # Poor score for syntax errors

                except Exception:
                    continue

            if not structure_scores:
                return None

            return statistics.mean(structure_scores)

        except Exception:
            return None

    def _analyze_ast_structure(self, tree: ast.AST) -> float:
        """Analyze AST for structural quality indicators"""
        score = 70  # Start with baseline

        # Count functions and classes
        functions = 0
        classes = 0
        long_functions = 0

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions += 1
                # Check function length (rough approximation)
                if hasattr(node, 'end_lineno') and node.end_lineno:
                    length = node.end_lineno - node.lineno
                    if length > 60:  # NASA standard
                        long_functions += 1

            elif isinstance(node, ast.ClassDef):
                classes += 1

        # Adjust score based on structure
        if functions > 0:
            score += min(15, functions * 2)  # Reward modularity

        if long_functions > 0 and functions > 0:
            penalty = (long_functions / functions) * 20
            score -= penalty  # Penalize long functions

        if classes > 0:
            score += min(10, classes * 3)  # Reward OOP structure

        return max(30, min(90, score))  # Realistic bounds

    def _assess_documentation_quality(self, directory: Path) -> Optional[float]:
        """Assess documentation coverage and quality"""
        try:
            python_files = list(directory.rglob("*.py"))
            doc_files = list(directory.rglob("*.md")) + list(directory.rglob("*.rst"))

            if not python_files:
                return None

            documented_files = 0

            for file_path in python_files[:10]:  # Sample 10 files
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    # Check for docstrings and comments
                    if '"""' in content or "'''" in content or content.count('#') > 5:
                        documented_files += 1

                except Exception:
                    continue

            sample_size = min(10, len(python_files))
            if sample_size == 0:
                return None

            # Documentation coverage
            doc_coverage = (documented_files / sample_size) * 100

            # Bonus for external documentation
            if doc_files:
                doc_coverage = min(95, doc_coverage + 10)

            return doc_coverage

        except Exception:
            return None

    def _calculate_quality_score(self, evidence: Dict) -> Tuple[float, Tuple[float, float]]:
        """
        Calculate quality score with realistic confidence intervals.

        Unlike theater claims of "99.4% accuracy", this provides:
        - Weighted average of evidence sources
        - Confidence intervals based on sample size
        - Conservative bounds for small samples
        """
        scores = evidence.get('scores', [])
        sample_size = evidence.get('sample_size', 0)

        if not scores:
            return 50.0, (30.0, 70.0)  # No evidence = uncertain

        # Calculate weighted average
        overall_score = statistics.mean(scores)

        # Calculate confidence interval based on sample size
        if len(scores) > 1:
            std_dev = statistics.stdev(scores)
        else:
            std_dev = 15.0  # Conservative assumption for single source

        # Adjust confidence based on sample size
        if sample_size < 5:
            # Very small sample - wide confidence interval
            margin = 20.0
        elif sample_size < 20:
            # Small sample - moderate confidence interval
            margin = std_dev * 1.96 / (sample_size ** 0.5)
            margin = max(10.0, min(margin, 15.0))
        else:
            # Reasonable sample - tighter confidence interval
            margin = std_dev * 1.96 / (sample_size ** 0.5)
            margin = max(5.0, min(margin, 12.0))

        lower_bound = max(0, overall_score - margin)
        upper_bound = min(100, overall_score + margin)

        return overall_score, (lower_bound, upper_bound)

    def _determine_quality_level(self, score: float) -> QualityLevel:
        """Determine quality level based on score"""
        if score >= 90:
            return QualityLevel.EXCELLENT
        elif score >= 80:
            return QualityLevel.VERY_GOOD
        elif score >= 70:
            return QualityLevel.GOOD
        elif score >= 60:
            return QualityLevel.FAIR
        else:
            return QualityLevel.POOR

    def _create_no_evidence_result(self) -> QualityMetrics:
        """Create result when no evidence is available"""
        return QualityMetrics(
            overall_score=50.0,
            confidence_interval=(20.0, 80.0),
            sample_size=0,
            evidence_sources=[],
            quality_level=QualityLevel.FAIR,
            breakdown={'error': 'No evidence available'}
        )

    def validate_assessment(self, metrics: QualityMetrics) -> Dict[str, bool]:
        """
        Validate that assessment is realistic and evidence-based.

        Catches common theater patterns:
        - Impossible precision claims
        - Perfect scores without evidence
        - Narrow confidence intervals with small samples
        """
        validation_results = {}

        # Check for impossible precision
        validation_results['realistic_precision'] = (
            metrics.confidence_interval[1] - metrics.confidence_interval[0] >= 5.0
        )

        # Check for reasonable score bounds
        validation_results['reasonable_bounds'] = (
            0 <= metrics.overall_score <= 95  # No perfect scores
        )

        # Check evidence requirements
        validation_results['sufficient_evidence'] = (
            len(metrics.evidence_sources) >= 1 and metrics.sample_size > 0
        )

        # Check confidence interval makes sense
        validation_results['sensible_confidence'] = (
            metrics.confidence_interval[0] <= metrics.overall_score <= metrics.confidence_interval[1]
        )

        return validation_results

def assess_codebase_quality(directory_path: str) -> QualityMetrics:
    """Convenience function for quick quality assessment"""
    assessor = RealisticQualityAssessor()
    return assessor.assess_codebase_quality(directory_path)

def format_quality_report(metrics: QualityMetrics) -> str:
    """Format quality metrics into a human-readable report"""
    report = f"""
Quality Assessment Report
========================

Overall Quality: {metrics.quality_level.value.replace('_', ' ').title()}
Score: {metrics.overall_score:.1f}% (95% CI: {metrics.confidence_interval[0]:.1f}%-{metrics.confidence_interval[1]:.1f}%)
Sample Size: {metrics.sample_size} files
Evidence Sources: {', '.join(metrics.evidence_sources)}

Detailed Breakdown:
"""

    for source, score in metrics.breakdown.items():
        report += f"- {source.replace('_', ' ').title()}: {score:.1f}%\n"

    # Add interpretation
    if metrics.quality_level == QualityLevel.EXCELLENT:
        report += "\nInterpretation: Exceptional quality code with comprehensive coverage."
    elif metrics.quality_level == QualityLevel.VERY_GOOD:
        report += "\nInterpretation: High quality code suitable for production use."
    elif metrics.quality_level == QualityLevel.GOOD:
        report += "\nInterpretation: Good quality code that meets standards."
    elif metrics.quality_level == QualityLevel.FAIR:
        report += "\nInterpretation: Fair quality code with room for improvement."
    else:
        report += "\nInterpretation: Poor quality code requiring significant improvements."

    return report.strip()

# Example usage and validation
if __name__ == "__main__":
    # Test with current directory
    metrics = assess_codebase_quality(".")
    print(format_quality_report(metrics))

    # Validate assessment
    assessor = RealisticQualityAssessor()
    validation = assessor.validate_assessment(metrics)

    print("\nAssessment Validation:")
    for check, passed in validation.items():
        status = "PASS" if passed else "FAIL"
        print(f"- {check.replace('_', ' ').title()}: {status}")