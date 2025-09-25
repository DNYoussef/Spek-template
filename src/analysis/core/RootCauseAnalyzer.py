from src.constants.base import MAXIMUM_RETRY_ATTEMPTS

import json
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import logging

logger = logging.getLogger(__name__)

@dataclass
class RootCause:
    """Represents identified root cause."""
    cause_type: str
    description: str
    confidence: float
    evidence: List[str]
    affected_components: List[str]
    contributing_factors: List[str] = field(default_factory=list)
    remediation_steps: List[str] = field(default_factory=list)

@dataclass
class CausalChain:
    """Represents a chain of causes leading to failure."""
    primary_cause: RootCause
    intermediate_causes: List[RootCause]
    trigger_event: str
    propagation_path: List[str]
    total_confidence: float

class RootCauseAnalyzer:
    """
    Performs deep root cause analysis on failures.

    Extracted from FailurePatternDetector god object (1, 281 LOC -> ~300 LOC component).
    Handles:
    - Root cause identification
    - Causal chain analysis
    - Contributing factor detection
    - Evidence correlation
    - Remediation suggestions
    """

    def __init__(self):
        """Initialize the root cause analyzer."""
        self.cause_database: Dict[str, RootCause] = {}
        self.causal_chains: List[CausalChain] = []
        self.evidence_correlations: Dict[str, List[str]] = defaultdict(list)

        # Analysis configuration
        self.min_confidence_threshold = 0.6
        self.max_chain_depth = 5

        # Load common root causes
        self._load_common_causes()

    def _load_common_causes(self) -> None:
        """Load common root cause patterns."""
        common_causes = {
            "dependency_conflict": {
                "description": "Conflicting package versions or peer dependencies",
                "evidence_patterns": ["version", "conflict", "peer", "dependency"],
                "remediation": ["Update package.json", "Run npm dedupe", "Check peer dependencies"]
            },
            "environment_mismatch": {
                "description": "Differences between local and CI environments",
                "evidence_patterns": ["env", "variable", "config", "missing"],
                "remediation": ["Verify environment variables", "Check CI configuration", "Align environments"]
            },
            "resource_exhaustion": {
                "description": "System resources exceeded (memory, CPU, disk)",
                "evidence_patterns": ["memory", "heap", "timeout", "slow"],
                "remediation": ["Increase resource limits", "Optimize code", "Add caching"]
            },
            "race_condition": {
                "description": "Timing-dependent failures in async operations",
                "evidence_patterns": ["async", "await", "promise", "callback", "timeout"],
                "remediation": ["Add proper awaits", "Implement locks", "Increase timeouts"]
            },
            "configuration_error": {
                "description": "Incorrect or missing configuration",
                "evidence_patterns": ["config", "setting", "option", "parameter"],
                "remediation": ["Review configuration files", "Check defaults", "Validate settings"]
            },
            "api_change": {
                "description": "Breaking changes in external APIs or libraries",
                "evidence_patterns": ["deprecated", "removed", "changed", "breaking"],
                "remediation": ["Check API documentation", "Update integration code", "Pin versions"]
            },
            "test_flakiness": {
                "description": "Non-deterministic test behavior",
                "evidence_patterns": ["flaky", "intermittent", "sometimes", "random"],
                "remediation": ["Add retries", "Fix test isolation", "Mock external dependencies"]
            }
        }

        for cause_type, details in common_causes.items():
            self.cause_database[cause_type] = RootCause(
                cause_type=cause_type,
                description=details["description"],
                confidence=0.0,
                evidence=[],
                affected_components=[],
                remediation_steps=details["remediation"]
            )

    def analyze_failure(self,
                        failure_data: Dict[str, Any],
                        historical_context: Optional[List[Dict[str, Any]]] = None) -> RootCause:
        """Perform root cause analysis on a failure."""
        # Extract evidence from failure data
        evidence = self._extract_evidence(failure_data)

        # Score each potential cause
        cause_scores: Dict[str, float] = {}

        for cause_type, cause in self.cause_database.items():
            score = self._calculate_cause_score(evidence, cause, historical_context)
            if score >= self.min_confidence_threshold:
                cause_scores[cause_type] = score

        # Select most likely cause
        if cause_scores:
            best_cause_type = max(cause_scores, key=cause_scores.get)
            best_cause = self.cause_database[best_cause_type].copy()
            best_cause.confidence = cause_scores[best_cause_type]
            best_cause.evidence = evidence
            best_cause.affected_components = self._identify_affected_components(failure_data)

            # Identify contributing factors
            best_cause.contributing_factors = self._identify_contributing_factors(
                failure_data, best_cause_type, cause_scores
            )

            return best_cause

        # Default to unknown cause
        return RootCause(
            cause_type="unknown",
            description="Unable to determine root cause with sufficient confidence",
            confidence=0.3,
            evidence=evidence,
            affected_components=self._identify_affected_components(failure_data)
        )

    def _extract_evidence(self, failure_data: Dict[str, Any]) -> List[str]:
        """Extract evidence from failure data."""
        evidence = []

        # Extract from error message
        if "error_message" in failure_data:
            evidence.append(f"Error: {failure_data['error_message'][:200]}")

        # Extract from stack trace
        if "stack_trace" in failure_data:
            # Get key lines from stack trace
            lines = failure_data["stack_trace"].split('\n')[:10]
            evidence.extend([f"Stack: {line}" for line in lines if line.strip()])

        # Extract from logs
        if "logs" in failure_data:
            # Get last few log lines
            log_lines = failure_data["logs"][-20:]
            evidence.extend([f"Log: {line}" for line in log_lines])

        # Extract from test results
        if "test_name" in failure_data:
            evidence.append(f"Test: {failure_data['test_name']}")

        return evidence

    def _calculate_cause_score(self,
                                evidence: List[str],
                                cause: RootCause,
                                historical_context: Optional[List[Dict[str, Any]]]) -> float:
        """Calculate likelihood score for a root cause."""
        score = 0.0
        evidence_text = " ".join(evidence).lower()

        # Check for evidence pattern matches
        pattern_matches = 0
        for pattern in self._get_evidence_patterns(cause.cause_type):
            if pattern in evidence_text:
                pattern_matches += 1

        if pattern_matches > 0:
            score = min(0.9, 0.2 + (pattern_matches * 0.15))

        # Boost score based on historical context
        if historical_context:
            historical_matches = sum(
                1 for h in historical_context
                if h.get("root_cause") == cause.cause_type
            )
            if historical_matches > 0:
                score = min(1.0, score + (historical_matches * 0.1))

        return score

    def _get_evidence_patterns(self, cause_type: str) -> List[str]:
        """Get evidence patterns for a cause type."""
        patterns = {
            "dependency_conflict": ["version", "conflict", "peer", "dependency", "incompatible"],
            "environment_mismatch": ["env", "variable", "undefined", "config", "missing"],
            "resource_exhaustion": ["memory", "heap", "timeout", "exceeded", "limit"],
            "race_condition": ["async", "await", "promise", "concurrent", "parallel"],
            "configuration_error": ["config", "invalid", "missing", "required", "option"],
            "api_change": ["deprecated", "removed", "not found", "breaking", "undefined"],
            "test_flakiness": ["flaky", "intermittent", "sometimes", "occasionally", "random"]
        }
        return patterns.get(cause_type, [])

    def _identify_affected_components(self, failure_data: Dict[str, Any]) -> List[str]:
        """Identify components affected by the failure."""
        components = []

        # Extract from file paths
        if "file_path" in failure_data:
            components.append(failure_data["file_path"])

        # Extract from module names
        if "module" in failure_data:
            components.append(failure_data["module"])

        # Extract from stack trace
        if "stack_trace" in failure_data:
            # Parse file paths from stack trace
            import re
            file_pattern = r'File ["\'](.*?)["\']'
            matches = re.findall(file_pattern, failure_data["stack_trace"])
            components.extend(matches[:5])  # Limit to first 5

        return list(set(components))  # Remove duplicates

    def _identify_contributing_factors(self,
                                        failure_data: Dict[str, Any],
                                        primary_cause: str,
                                        cause_scores: Dict[str, float]) -> List[str]:
        """Identify contributing factors to the failure."""
        factors = []

        # Add other high-scoring causes as contributing factors
        for cause_type, score in cause_scores.items():
            if cause_type != primary_cause and score >= 0.5:
                factors.append(f"{cause_type} (confidence: {score:.2f})")

        # Check for environmental factors
        if "environment" in failure_data:
            env = failure_data["environment"]
            if env.get("ci", False):
                factors.append("CI environment")
            if env.get("parallel", False):
                factors.append("Parallel execution")

        # Check timing factors
        if "duration" in failure_data:
            duration = failure_data["duration"]
            if duration > 30:
                factors.append(f"Long execution time ({duration}s)")

        return factors

    def build_causal_chain(self,
                            failures: List[Dict[str, Any]]) -> Optional[CausalChain]:
        """Build a causal chain from multiple related failures."""
        if not failures:
            return None

        # Analyze each failure
        causes = []
        for failure in failures:
            cause = self.analyze_failure(failure)
            causes.append(cause)

        # Identify primary cause (highest confidence)
        primary_cause = max(causes, key=lambda c: c.confidence)

        # Build propagation path
        propagation_path = []
        for i, failure in enumerate(failures):
            if "file_path" in failure:
                propagation_path.append(failure["file_path"])
            elif "test_name" in failure:
                propagation_path.append(failure["test_name"])
            else:
                propagation_path.append(f"step_{i}")

        # Create causal chain
        chain = CausalChain(
            primary_cause=primary_cause,
            intermediate_causes=[c for c in causes if c != primary_cause],
            trigger_event=failures[0].get("trigger", "unknown"),
            propagation_path=propagation_path,
            total_confidence=sum(c.confidence for c in causes) / len(causes)
        )

        self.causal_chains.append(chain)
        return chain

    def suggest_remediation(self, root_cause: RootCause) -> List[str]:
        """Suggest remediation steps for a root cause."""
        suggestions = root_cause.remediation_steps.copy()

        # Add specific suggestions based on evidence
        if "timeout" in " ".join(root_cause.evidence).lower():
            suggestions.append("Consider increasing timeout values")

        if "memory" in " ".join(root_cause.evidence).lower():
            suggestions.append("Check for memory leaks")
            suggestions.append("Increase heap size limits")

        if "async" in " ".join(root_cause.evidence).lower():
            suggestions.append("Review async/await usage")
            suggestions.append("Add proper error handling for promises")

        return suggestions

    def get_analysis_summary(self) -> Dict[str, Any]:
        """Get summary of root cause analyses."""
        cause_frequency = Counter(
            cause.cause_type
            for cause in self.cause_database.values()
            if cause.confidence > 0
        )

        return {
            "total_analyses": len(self.causal_chains),
            "cause_distribution": dict(cause_frequency),
            "average_confidence": sum(
                c.confidence for c in self.cause_database.values()
            ) / len(self.cause_database) if self.cause_database else 0,
            "most_common_causes": cause_frequency.most_common(5)
        }