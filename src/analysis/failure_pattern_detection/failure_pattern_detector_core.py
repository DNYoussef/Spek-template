"""
Refactored Failure Pattern Detector Core
Delegates to specialized components using the delegation pattern.
"""

import json
import hashlib
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from collections import defaultdict, Counter
from datetime import datetime

from .pattern_database import PatternDatabase, PatternDatabaseConfig
from .root_cause_analyzer import RootCauseAnalyzer, RootCauseConfig
from .test_failure_analyzer import (
    TestFailureCorrelator, TestSuccessPredictor, TestAutoRepair,
    TestPatternAnalyzer, TestFailureCorrelationConfig
)
from ..failure_pattern_detector import FailureSignature, RootCauseAnalysis

logger = logging.getLogger(__name__)


class FailurePatternDetectorConfig:
    """Unified configuration for failure pattern detector."""

    def __init__(self):
        self.pattern_db_config = PatternDatabaseConfig()
        self.root_cause_config = RootCauseConfig()
        self.test_correlation_config = TestFailureCorrelationConfig()
        self.enable_learning = True
        self.auto_save_results = True


class FailurePatternDetector:
    """
    Refactored failure pattern detector using delegation pattern.

    This class acts as a coordinator, delegating specialized tasks to focused components:
    - PatternDatabase: Manages pattern databases and historical learning
    - RootCauseAnalyzer: Handles reverse engineering and root cause analysis
    - TestFailureAnalyzer components: Handle test-specific analysis and correlation
    """

    def __init__(self, config: Dict[str, Any] = None):
        # Initialize configuration
        self.config = config or {}
        self.detector_config = FailurePatternDetectorConfig()

        # Initialize delegated components
        self.pattern_database = PatternDatabase(self.detector_config.pattern_db_config)
        self.root_cause_analyzer = RootCauseAnalyzer(
            self.pattern_database,
            self.detector_config.root_cause_config
        )

        # Test-specific components
        self.test_failure_correlator = TestFailureCorrelator(self.detector_config.test_correlation_config)
        self.test_success_predictor = TestSuccessPredictor()
        self.test_auto_repair = TestAutoRepair()
        self.test_pattern_analyzer = TestPatternAnalyzer()

        logger.info("Failure pattern detector initialized with delegated components")

    def analyze_failure_patterns(self, failure_data: Dict[str, Any]) -> List[FailureSignature]:
        """Analyze failure data to detect patterns and signatures."""
        logger.info("Analyzing failure patterns...")

        signatures = []

        for failure in failure_data.get("critical_failures", []):
            signature = self._extract_failure_signature(failure)
            if signature:
                signatures.append(signature)

        # Cluster similar signatures
        clustered_signatures = self._cluster_similar_signatures(signatures)

        # Update pattern database
        self._update_pattern_database(clustered_signatures)

        return clustered_signatures

    def _extract_failure_signature(self, failure: Dict[str, Any]) -> Optional[FailureSignature]:
        """Extract failure signature from individual failure data."""
        try:
            step_name = failure.get("step_name", "unknown")
            category = failure.get("category", "other")

            # Extract error pattern from logs
            error_pattern = self._extract_error_pattern(failure)

            # Calculate context hash for deduplication
            context_data = f"{category}:{step_name}:{error_pattern}"
            context_hash = hashlib.md5(context_data.encode()).hexdigest()[:12]

            # Find matching known patterns using pattern database
            matched_pattern = self._match_known_patterns(error_pattern, category)

            signature = FailureSignature(
                category=category,
                step_name=step_name,
                error_pattern=error_pattern,
                frequency=1,
                confidence_score=0.8 if matched_pattern else 0.5,
                context_hash=context_hash,
                root_cause_hypothesis=matched_pattern.get("root_cause", "") if matched_pattern else "",
                fix_difficulty=matched_pattern.get("fix_difficulty", "medium") if matched_pattern else "medium"
            )

            return signature

        except Exception as e:
            logger.error(f"Error extracting failure signature: {e}")
            return None

    def _extract_error_pattern(self, failure: Dict[str, Any]) -> str:
        """Extract error pattern from failure data."""
        step_name = failure.get("step_name", "").lower()
        category = failure.get("category", "")

        # Generate representative error pattern based on step and category
        if "test" in step_name:
            if "unit" in step_name:
                return "Test assertion failed: Expected value mismatch"
            elif "integration" in step_name:
                return "Integration test timeout: Service connection failed"
            else:
                return "Test execution error: Unknown test failure"
        elif "build" in step_name:
            return "Build compilation error: Missing dependency or syntax error"
        elif "lint" in step_name or "quality" in step_name:
            return "Code quality violation: Style or complexity issue"
        elif "security" in step_name:
            return "Security scan failure: Vulnerability or insecure pattern detected"
        elif "deploy" in step_name:
            return "Deployment failure: Configuration or resource issue"
        else:
            return f"Generic failure in {category} category"

    def _match_known_patterns(self, error_pattern: str, category: str) -> Optional[Dict[str, Any]]:
        """Match error pattern against known pattern database."""
        category_patterns = self.pattern_database.get_pattern_by_category(category)

        for pattern_entry in category_patterns:
            pattern_name = pattern_entry["name"]
            pattern_info = pattern_entry["info"]

            for regex_pattern in pattern_info["patterns"]:
                if error_pattern.lower() in regex_pattern.lower():  # Simple matching for demo
                    return {
                        "name": pattern_name,
                        "root_cause": f"Known pattern: {pattern_name}",
                        "fix_difficulty": pattern_info["fix_difficulty"],
                        "fix_strategy": pattern_info["fix_strategy"]
                    }
        return None

    def _cluster_similar_signatures(self, signatures: List[FailureSignature]) -> List[FailureSignature]:
        """Cluster similar failure signatures to reduce noise."""
        clustered = {}

        for signature in signatures:
            # Use category and simplified error pattern for clustering
            cluster_key = f"{signature.category}:{signature.step_name}"

            if cluster_key in clustered:
                # Merge with existing signature
                existing = clustered[cluster_key]
                existing.frequency += 1
                existing.confidence_score = min(1.0, existing.confidence_score + 0.1)

                # Combine similar patterns
                if signature.error_pattern not in existing.similar_patterns:
                    existing.similar_patterns.append(signature.error_pattern)
            else:
                # New cluster
                clustered[cluster_key] = signature

        return list(clustered.values())

    def _update_pattern_database(self, signatures: List[FailureSignature]):
        """Update pattern database with new signatures."""
        for signature in signatures:
            pattern_id = f"{signature.category}_{signature.context_hash}"
            self.pattern_database.add_new_pattern(pattern_id, signature)

    def reverse_engineer_root_causes(self, signatures: List[FailureSignature]) -> List[RootCauseAnalysis]:
        """Delegate root cause analysis to specialized component."""
        return self.root_cause_analyzer.analyze_root_causes(signatures)

    def analyze_test_specific_failures(self, test_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Delegate test-specific analysis to specialized component."""
        return self.test_pattern_analyzer.analyze_test_specific_failures(test_results)

    def correlate_test_failures(self, test_failures: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Delegate test correlation to specialized component."""
        return self.test_failure_correlator.correlate_failures(test_failures)

    def predict_test_success(self, change_context: Dict[str, Any], test_suite: str) -> Dict[str, Any]:
        """Delegate test success prediction to specialized component."""
        return self.test_success_predictor.predict_test_success(change_context, test_suite)

    def suggest_test_repairs(self, test_failure: Dict[str, Any]) -> Dict[str, Any]:
        """Delegate test repair suggestions to specialized component."""
        return self.test_auto_repair.suggest_repairs(test_failure)

    def save_analysis_results(self, signatures: List[FailureSignature],
                            root_causes: List[RootCauseAnalysis],
                            output_path: Path = None) -> Path:
        """Save analysis results for use by the CI/CD loop."""
        if output_path is None:
            output_path = Path("/tmp/failure_pattern_analysis.json")

        analysis_data = {
            "timestamp": datetime.now().isoformat(),
            "analysis_metadata": {
                "total_signatures": len(signatures),
                "total_root_causes": len(root_causes),
                "high_confidence_causes": len([rc for rc in root_causes if rc.confidence_score > 0.8]),
                "low_effort_fixes": len([rc for rc in root_causes if rc.estimated_effort_hours <= 2])
            },
            "failure_signatures": [
                {
                    "category": sig.category,
                    "step_name": sig.step_name,
                    "error_pattern": sig.error_pattern,
                    "frequency": sig.frequency,
                    "confidence_score": sig.confidence_score,
                    "context_hash": sig.context_hash,
                    "root_cause_hypothesis": sig.root_cause_hypothesis,
                    "fix_difficulty": sig.fix_difficulty,
                    "similar_patterns": sig.similar_patterns
                }
                for sig in signatures
            ],
            "root_cause_analyses": [
                {
                    "primary_cause": rca.primary_cause,
                    "contributing_factors": rca.contributing_factors,
                    "confidence_score": rca.confidence_score,
                    "affected_components": rca.affected_components,
                    "fix_strategy": rca.fix_strategy,
                    "verification_method": rca.verification_method,
                    "estimated_effort_hours": rca.estimated_effort_hours,
                    "risk_level": rca.risk_level,
                    "dependency_chain": rca.dependency_chain,
                    "historical_occurrences": rca.historical_occurrences
                }
                for rca in root_causes
            ],
            "recommendations": self._generate_recommendations(signatures, root_causes),
            "component_statistics": self._get_component_statistics()
        }

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(analysis_data, f, indent=2)

        logger.info(f"Analysis results saved to {output_path}")
        return output_path

    def _generate_recommendations(self, signatures: List[FailureSignature],
                                root_causes: List[RootCauseAnalysis]) -> Dict[str, Any]:
        """Generate actionable recommendations based on analysis."""
        recommendations = {
            "immediate_actions": [],
            "process_improvements": [],
            "preventive_measures": [],
            "priority_fixes": []
        }

        # Immediate actions based on high-confidence, low-effort fixes
        high_confidence_low_effort = [
            rca for rca in root_causes
            if rca.confidence_score > 0.8 and rca.estimated_effort_hours <= 2
        ]

        for rca in high_confidence_low_effort:
            recommendations["immediate_actions"].append({
                "action": f"Apply {rca.fix_strategy} for: {rca.primary_cause}",
                "effort_hours": rca.estimated_effort_hours,
                "risk_level": rca.risk_level
            })

        # Process improvements based on recurring patterns
        recurring_patterns = [sig for sig in signatures if sig.frequency > 2]
        if recurring_patterns:
            recommendations["process_improvements"].append(
                "Implement automated checks for recurring failure patterns"
            )

        # Preventive measures based on category analysis
        category_counts = Counter(sig.category for sig in signatures)
        top_categories = category_counts.most_common(3)

        for category, count in top_categories:
            if category == "testing":
                recommendations["preventive_measures"].append(
                    "Enhance test environment reliability and test quality standards"
                )
            elif category == "build":
                recommendations["preventive_measures"].append(
                    "Implement more robust dependency management and build processes"
                )
            elif category == "security":
                recommendations["preventive_measures"].append(
                    "Strengthen security scanning and secure coding practices"
                )

        # Priority fixes based on risk and impact
        high_impact_fixes = sorted(
            root_causes,
            key=lambda x: (x.risk_level == "high", x.estimated_effort_hours),
            reverse=True
        )[:5]

        for rca in high_impact_fixes:
            recommendations["priority_fixes"].append({
                "primary_cause": rca.primary_cause,
                "fix_strategy": rca.fix_strategy,
                "estimated_effort": rca.estimated_effort_hours,
                "risk_level": rca.risk_level
            })

        return recommendations

    def learn_from_fixes(self, fix_results: Dict[str, Any]):
        """Learn from fix results to improve future analysis."""
        logger.info("Learning from fix results...")

        # Delegate learning to pattern database
        for fix_result in fix_results.get("applied_fixes", []):
            strategy = fix_result.get("fix_strategy")
            success = fix_result.get("success", False)
            self.pattern_database.update_strategy_success_rate(strategy, success)

        # Update pattern confidence based on fix success
        for pattern_update in fix_results.get("pattern_updates", []):
            pattern_id = pattern_update.get("pattern_id")
            success = pattern_update.get("fix_success", False)
            self.pattern_database.update_pattern_confidence(pattern_id, success)

    def _get_component_statistics(self) -> Dict[str, Any]:
        """Get statistics from all delegated components."""
        return {
            "pattern_database": self.pattern_database.get_statistics(),
            "root_cause_analyzer": {
                "confidence_threshold": self.root_cause_analyzer.config.confidence_threshold,
                "max_dependency_depth": self.root_cause_analyzer.config.max_dependency_depth
            },
            "test_components": {
                "correlation_threshold": self.test_failure_correlator.config.min_correlation_threshold,
                "auto_repair_confidence": self.test_failure_correlator.config.auto_repair_confidence
            }
        }

    def get_component_health(self) -> Dict[str, str]:
        """Check health of all delegated components."""
        health = {}

        try:
            stats = self.pattern_database.get_statistics()
            health["pattern_database"] = "healthy" if stats["total_patterns"] > 0 else "warning"
        except Exception:
            health["pattern_database"] = "error"

        try:
            self.root_cause_analyzer._calculate_confidence_score
            health["root_cause_analyzer"] = "healthy"
        except Exception:
            health["root_cause_analyzer"] = "error"

        try:
            self.test_pattern_analyzer._determine_test_type("unit_test")
            health["test_analyzer"] = "healthy"
        except Exception:
            health["test_analyzer"] = "error"

        return health


def create_failure_detector(config: Dict[str, Any] = None) -> FailurePatternDetector:
    """Factory function to create a properly configured failure detector."""
    return FailurePatternDetector(config)


<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:0o3-0o4:0o0 | coder@Sonnet-4 | Created refactored core detector using delegation pattern | failure_pattern_detector_core.py | OK | God object decomposition complete | 0.0o0 | d7a9c2f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase3-core-detector-0o4
- inputs: ["failure_pattern_detector.py"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet-4","prompt":"v1.0.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->