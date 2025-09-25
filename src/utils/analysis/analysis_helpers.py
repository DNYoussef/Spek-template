"""Analysis Helper Functions

Consolidates common analysis patterns including result aggregation,
statistical calculations, and pattern matching.
Extracted from: src/analysis/core/RootCauseAnalyzer.py, analyzer/context_analyzer.py
"""

from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional, Tuple, Set
import re

from dataclasses import dataclass
import statistics

@dataclass
class AnalysisResult:
    """Standard analysis result structure."""
    status: str
    confidence: float
    findings: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    recommendations: List[str]

class ResultAggregator:
    """Aggregate and consolidate analysis results."""

    @staticmethod
    def merge_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge multiple analysis results."""
        if not results:
            return {"status": "no_data", "findings": []}

        merged = {
            "status": "success",
            "total_results": len(results),
            "findings": [],
            "aggregated_metrics": {},
            "common_patterns": []
        }

        # Collect all findings
        all_findings = []
        for result in results:
            if "findings" in result:
                all_findings.extend(result["findings"])

        merged["findings"] = all_findings

        # Aggregate numeric metrics
        metrics = defaultdict(list)
        for result in results:
            if "metrics" in result:
                for key, value in result["metrics"].items():
                    if isinstance(value, (int, float)):
                        metrics[key].append(value)

        for key, values in metrics.items():
            if values:
                merged["aggregated_metrics"][key] = {
                    "mean": statistics.mean(values),
                    "median": statistics.median(values),
                    "min": min(values),
                    "max": max(values)
                }

        return merged

    @staticmethod
    def calculate_confidence(evidence: List[str], min_evidence: int = 3) -> float:
        """Calculate confidence score based on evidence."""
        if not evidence:
            return 0.0
        
        base_confidence = min(len(evidence) / min_evidence, 1.0)
        
        # Adjust for evidence quality
        quality_boost = 0.0
        high_quality_keywords = {'confirmed', 'verified', 'proven', 'validated'}
        for item in evidence:
            if any(kw in item.lower() for kw in high_quality_keywords):
                quality_boost += 0.1
        
        return min(base_confidence + quality_boost, 1.0)

class StatisticalCalculator:
    """Statistical calculations for analysis."""

    @staticmethod
    def calculate_distribution(
        values: List[float]
    ) -> Dict[str, float]:
        """Calculate statistical distribution."""
        if not values:
            return {}

        return {
            "mean": statistics.mean(values),
            "median": statistics.median(values),
            "stdev": statistics.stdev(values) if len(values) > 1 else 0.0,
            "min": min(values),
            "max": max(values),
            "range": max(values) - min(values)
        }

    @staticmethod
    def detect_outliers(
        values: List[float],
        threshold: float = 2.0
    ) -> List[int]:
        """Detect outliers using standard deviation."""
        if len(values) < 3:
            return []

        mean = statistics.mean(values)
        stdev = statistics.stdev(values)
        
        outliers = []
        for i, value in enumerate(values):
            z_score = abs(value - mean) / stdev if stdev > 0 else 0
            if z_score > threshold:
                outliers.append(i)
        
        return outliers

    @staticmethod
    def calculate_correlation(
        x_values: List[float],
        y_values: List[float]
    ) -> float:
        """Calculate Pearson correlation coefficient."""
        if len(x_values) != len(y_values) or len(x_values) < 2:
            return 0.0

        mean_x = statistics.mean(x_values)
        mean_y = statistics.mean(y_values)
        
        numerator = sum((x - mean_x) * (y - mean_y) 
                        for x, y in zip(x_values, y_values))
        
        denominator = (
            sum((x - mean_x) ** 2 for x in x_values) ** 0.5 *
            sum((y - mean_y) ** 2 for y in y_values) ** 0.5
        )
        
        return numerator / denominator if denominator > 0 else 0.0

class PatternMatcher:
    """Pattern detection and matching."""

    @staticmethod
    def find_common_patterns(
        items: List[str],
        min_occurrences: int = 2
    ) -> List[Tuple[str, int]]:
        """Find common patterns in strings."""
        # Extract words/tokens
        all_tokens = []
        for item in items:
            tokens = re.findall(r'\w+', item.lower())
            all_tokens.extend(tokens)
        
        # Count occurrences
        counter = Counter(all_tokens)
        
        # Filter by minimum occurrences
        patterns = [(token, count) 
                    for token, count in counter.items() 
                    if count >= min_occurrences]
        
        return sorted(patterns, key=lambda x: x[1], reverse=True)

    @staticmethod
    def match_evidence_to_causes(
        evidence: List[str],
        cause_patterns: Dict[str, List[str]]
    ) -> Dict[str, float]:
        """Match evidence to known cause patterns."""
        matches = {}
        
        for cause, patterns in cause_patterns.items():
            match_count = 0
            for evidence_item in evidence:
                evidence_lower = evidence_item.lower()
                for pattern in patterns:
                    if pattern.lower() in evidence_lower:
                        match_count += 1
            
            if match_count > 0:
                # Calculate match score
                score = match_count / (len(patterns) + len(evidence))
                matches[cause] = min(score * 2, 1.0)  # Scale to 0-1
        
        return matches

class RecommendationEngine:
    """Generate recommendations from analysis."""

    @staticmethod
    def prioritize_recommendations(
        recommendations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Prioritize recommendations by impact and effort."""
        def score_recommendation(rec: Dict[str, Any]) -> float:
            impact = rec.get('impact', 0.5)  # 0-1 scale
            effort = rec.get('effort', 0.5)  # 0-1 scale (lower is better)
            # Higher impact, lower effort = higher priority
            return impact / (effort + 0.1)  # Avoid division by zero
        
        return sorted(recommendations, 
                    key=score_recommendation, 
                    reverse=True)

    @staticmethod
    def generate_action_plan(
        findings: List[Dict[str, Any]],
        max_actions: int = 5
    ) -> List[str]:
        """Generate action plan from findings."""
        actions = []
        
        # Group findings by severity
        by_severity = defaultdict(list)
        for finding in findings:
            severity = finding.get('severity', 'medium')
            by_severity[severity].append(finding)
        
        # Prioritize critical and high
        for severity in ['critical', 'high', 'medium', 'low']:
            for finding in by_severity[severity]:
                if len(actions) >= max_actions:
                    break
                action = finding.get('remediation', finding.get('description'))
                if action and action not in actions:
                    actions.append(action)
        
        return actions[:max_actions]
