"""
Root Cause Analysis Engine Module
Handles reverse engineering and root cause determination for failure patterns.
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

from ..failure_pattern_detector import FailureSignature, RootCauseAnalysis

logger = logging.getLogger(__name__)


@dataclass
class RootCauseConfig:
    """Configuration for root cause analysis."""
    confidence_threshold: float = 0.7
    max_dependency_depth: int = 5
    enable_heuristics: bool = True
    include_historical_data: bool = True


class RootCauseAnalyzer:
    """Analyzes failure signatures to determine root causes using reverse engineering."""

    def __init__(self, pattern_database, config: RootCauseConfig = None):
        self.pattern_database = pattern_database
        self.config = config or RootCauseConfig()

    def analyze_root_causes(self, signatures: List[FailureSignature]) -> List[RootCauseAnalysis]:
        """Apply reverse engineering to determine root causes."""
        logger.info("Reverse engineering root causes...")

        root_causes = []

        for signature in signatures:
            analysis = self._analyze_single_root_cause(signature)
            if analysis:
                root_causes.append(analysis)

        # Sort by confidence and impact
        root_causes.sort(key=lambda x: (x.confidence_score, -x.estimated_effort_hours), reverse=True)

        return root_causes

    def _analyze_single_root_cause(self, signature: FailureSignature) -> Optional[RootCauseAnalysis]:
        """Analyze root cause for a single failure signature."""
        try:
            # Build dependency chain through reverse engineering
            dependency_chain = self._trace_dependency_chain(signature)

            # Determine primary cause
            primary_cause = self._determine_primary_cause(signature, dependency_chain)

            # Identify contributing factors
            contributing_factors = self._identify_contributing_factors(signature, dependency_chain)

            # Select fix strategy
            fix_strategy = self._select_fix_strategy(signature, primary_cause)

            # Calculate confidence based on pattern matching and historical data
            confidence_score = self._calculate_confidence_score(signature, primary_cause)

            # Estimate effort
            effort_hours = self._estimate_fix_effort(signature, fix_strategy)

            analysis = RootCauseAnalysis(
                primary_cause=primary_cause,
                contributing_factors=contributing_factors,
                confidence_score=confidence_score,
                affected_components=self._identify_affected_components(signature),
                fix_strategy=fix_strategy,
                verification_method=self._determine_verification_method(signature, fix_strategy),
                estimated_effort_hours=effort_hours,
                risk_level=self._assess_risk_level(signature, fix_strategy),
                dependency_chain=dependency_chain,
                historical_occurrences=signature.frequency
            )

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing root cause for {signature.category}: {e}")
            return None

    def _trace_dependency_chain(self, signature: FailureSignature) -> List[str]:
        """Trace dependency chain that led to the failure."""
        chain = []

        # Start with the immediate failure point
        chain.append(f"{signature.category}:{signature.step_name}")

        # Trace backwards through likely dependencies
        if signature.category == "testing":
            chain.extend([
                "code_compilation",
                "dependency_resolution",
                "environment_setup"
            ])
        elif signature.category == "build":
            chain.extend([
                "source_code",
                "dependency_management",
                "build_configuration"
            ])
        elif signature.category == "deployment":
            chain.extend([
                "build_artifacts",
                "configuration_management",
                "infrastructure_setup"
            ])
        elif signature.category == "quality":
            chain.extend([
                "source_code_quality",
                "coding_standards",
                "review_process"
            ])
        elif signature.category == "security":
            chain.extend([
                "dependency_vulnerabilities",
                "code_security_patterns",
                "configuration_security"
            ])

        return chain

    def _determine_primary_cause(self, signature: FailureSignature, dependency_chain: List[str]) -> str:
        """Determine the primary root cause."""
        if signature.root_cause_hypothesis:
            return signature.root_cause_hypothesis

        # Use category-based heuristics
        category = signature.category
        step_name = signature.step_name.lower()

        if category == "testing":
            if "unit" in step_name:
                return "Code logic error or test assertion mismatch"
            elif "integration" in step_name:
                return "Service integration failure or environment issue"
            elif "e2e" in step_name or "end-to-end" in step_name:
                return "End-to-end workflow or UI interaction failure"
            else:
                return "Test configuration or environment setup issue"

        elif category == "build":
            if "compile" in step_name:
                return "Source code compilation error"
            elif "dependency" in step_name:
                return "Dependency resolution or installation failure"
            else:
                return "Build configuration or toolchain issue"

        elif category == "quality":
            if "lint" in step_name:
                return "Code style or linting rule violation"
            elif "complexity" in step_name:
                return "Code complexity threshold exceeded"
            elif "coverage" in step_name:
                return "Test coverage requirement not met"
            else:
                return "Code quality standard violation"

        elif category == "security":
            if "vulnerability" in step_name:
                return "Security vulnerability in dependencies or code"
            elif "scan" in step_name:
                return "Security policy violation or insecure pattern"
            else:
                return "Security configuration or access control issue"

        elif category == "deployment":
            if "docker" in step_name:
                return "Container build or configuration issue"
            elif "kubernetes" in step_name:
                return "Kubernetes deployment or resource issue"
            else:
                return "Infrastructure or deployment configuration issue"

        else:
            return "Unknown or complex multi-factor issue"

    def _identify_contributing_factors(self, signature: FailureSignature, dependency_chain: List[str]) -> List[str]:
        """Identify contributing factors to the failure."""
        factors = []

        # Add category-specific contributing factors
        category = signature.category

        if category == "testing":
            factors.extend([
                "Test data management",
                "Environment consistency",
                "Test isolation",
                "Async operation handling"
            ])
        elif category == "build":
            factors.extend([
                "Build tool configuration",
                "Environment variables",
                "File system permissions",
                "Network connectivity"
            ])
        elif category == "quality":
            factors.extend([
                "Code review process",
                "Automated quality gates",
                "Developer tooling",
                "Style guide enforcement"
            ])
        elif category == "security":
            factors.extend([
                "Dependency management process",
                "Security awareness training",
                "Automated security scanning",
                "Secure coding guidelines"
            ])
        elif category == "deployment":
            factors.extend([
                "Infrastructure as Code",
                "Configuration management",
                "Resource allocation",
                "Monitoring and alerting"
            ])

        # Add frequency-based factors
        if signature.frequency > 3:
            factors.append("Recurring pattern indicating systemic issue")

        return factors[:5]  # Limit to top 5 factors

    def _select_fix_strategy(self, signature: FailureSignature, primary_cause: str) -> str:
        """Select appropriate fix strategy based on root cause."""
        # Look for matching fix strategy in database
        for strategy_name, strategy_info in self.pattern_database.fix_strategies.items():
            if any(keyword in primary_cause.lower() for keyword in strategy_name.split("_")):
                return strategy_name

        # Category-based fallback
        category = signature.category

        if category == "testing":
            return "test_logic_correction"
        elif category == "build":
            return "dependency_installation"
        elif category == "quality":
            return "style_correction"
        elif category == "security":
            return "security_patch"
        elif category == "deployment":
            return "docker_configuration"
        else:
            return "manual_investigation"

    def _calculate_confidence_score(self, signature: FailureSignature, primary_cause: str) -> float:
        """Calculate confidence score for root cause analysis."""
        base_score = signature.confidence_score

        # Boost confidence for known patterns
        if signature.root_cause_hypothesis:
            base_score += 0.2

        # Boost confidence for frequent patterns
        if signature.frequency > 2:
            base_score += 0.1

        # Reduce confidence for complex categories
        if signature.category in ["deployment", "security"]:
            base_score -= 0.1

        return min(1.0, max(0.1, base_score))

    def _estimate_fix_effort(self, signature: FailureSignature, fix_strategy: str) -> int:
        """Estimate effort in hours to fix the issue."""
        strategy_info = self.pattern_database.get_fix_strategy(fix_strategy)
        if strategy_info:
            base_effort = strategy_info["effort_hours"]
        else:
            base_effort = 3  # Default estimate

        # Adjust based on difficulty
        difficulty_multiplier = {
            "low": 1.0,
            "medium": 1.5,
            "high": 2.5
        }

        multiplier = difficulty_multiplier.get(signature.fix_difficulty, 1.5)

        # Adjust based on frequency (recurring issues might be easier to fix)
        if signature.frequency > 3:
            multiplier *= 0.8

        return max(1, int(base_effort * multiplier))

    def _identify_affected_components(self, signature: FailureSignature) -> List[str]:
        """Identify components affected by the failure."""
        components = []

        # Add step-specific components
        step_name = signature.step_name.lower()
        category = signature.category

        if category == "testing":
            components.extend(["test suite", "test environment", "test data"])
        elif category == "build":
            components.extend(["build system", "dependencies", "source code"])
        elif category == "quality":
            components.extend(["code quality tools", "style guidelines", "complexity metrics"])
        elif category == "security":
            components.extend(["security scanners", "dependency management", "code patterns"])
        elif category == "deployment":
            components.extend(["deployment pipeline", "infrastructure", "configuration"])

        # Add specific components based on step name
        if "docker" in step_name:
            components.append("Docker configuration")
        if "kubernetes" in step_name:
            components.append("Kubernetes manifests")
        if "npm" in step_name or "node" in step_name:
            components.append("Node.js ecosystem")
        if "python" in step_name or "pip" in step_name:
            components.append("Python environment")

        return list(set(components))

    def _determine_verification_method(self, signature: FailureSignature, fix_strategy: str) -> str:
        """Determine how to verify the fix."""
        strategy_info = self.pattern_database.get_fix_strategy(fix_strategy)
        if strategy_info:
            return strategy_info["validation"]

        # Category-based fallback
        category = signature.category

        if category == "testing":
            return "test_execution"
        elif category == "build":
            return "build_verification"
        elif category == "quality":
            return "quality_check"
        elif category == "security":
            return "security_scan"
        elif category == "deployment":
            return "deployment_test"
        else:
            return "manual_verification"

    def _assess_risk_level(self, signature: FailureSignature, fix_strategy: str) -> str:
        """Assess risk level of applying the fix."""
        # Base risk on fix difficulty
        difficulty = signature.fix_difficulty

        if difficulty == "low":
            base_risk = "low"
        elif difficulty == "medium":
            base_risk = "medium"
        else:
            base_risk = "high"

        # Elevate risk for certain categories
        if signature.category in ["security", "deployment"]:
            if base_risk == "low":
                base_risk = "medium"
            elif base_risk == "medium":
                base_risk = "high"

        # Reduce risk for well-known fix strategies
        known_safe_strategies = ["style_correction", "dependency_installation", "syntax_correction"]
        if fix_strategy in known_safe_strategies:
            if base_risk == "high":
                base_risk = "medium"
            elif base_risk == "medium":
                base_risk = "low"

        return base_risk


<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:0o3-0o4:0o0 | coder@Sonnet-4 | Created root cause analysis engine module | root_cause_analyzer.py | OK | Extracted from god object | 0.10 | b9f2e4a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase3-root-cause-0o2
- inputs: ["failure_pattern_detector.py"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet-4","prompt":"v1.0.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->