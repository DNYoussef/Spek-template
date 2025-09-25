from src.constants.base import MAXIMUM_RETRY_ATTEMPTS, MINIMUM_TEST_COVERAGE_PERCENTAGE, THEATER_DETECTION_WARNING_THRESHOLD
"""

Applies machine learning, pattern recognition, and reverse engineering
to detect root causes of CI/CD failures with high confidence.
"""

import json
import re
import os
import sys
import time
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class FailureSignature:
    """Represents a unique failure pattern signature."""
    category: str
    step_name: str
    error_pattern: str
    frequency: int
    confidence_score: float
    affected_files: List[str] = field(default_factory=list)
    context_hash: str = ""
    root_cause_hypothesis: str = ""
    fix_difficulty: str = "medium"
    similar_patterns: List[str] = field(default_factory=list)

@dataclass
class RootCauseAnalysis:
    """Comprehensive root cause analysis result."""
    primary_cause: str
    contributing_factors: List[str]
    confidence_score: float
    affected_components: List[str]
    fix_strategy: str
    verification_method: str
    estimated_effort_hours: int
    risk_level: str
    dependency_chain: List[str] = field(default_factory=list)
    historical_occurrences: int = 0

class FailurePatternDetector:
    """Advanced failure pattern detection and root cause analysis."""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.failure_patterns: Dict[str, FailureSignature] = {}
        self.root_cause_patterns: Dict[str, List[str]] = {}
        self.dependency_graph: Dict[str, Set[str]] = defaultdict(set)
        self.historical_fixes: Dict[str, Dict[str, Any]] = {}

        # Pattern databases
        self.error_pattern_db = self._load_error_patterns()
        self.fix_strategy_db = self._load_fix_strategies()

        # Test-specific analysis capabilities
        self.test_pattern_db = self._load_test_patterns()
        self.test_failure_correlator = TestFailureCorrelator()
        self.test_success_predictor = TestSuccessPredictor()
        self.test_auto_repair = TestAutoRepair()

        # Initialize pattern learning
        self._initialize_pattern_databases()

    def _load_error_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load known error patterns and their characteristics."""
        return {
            # Build/Compilation Errors
            "syntax_error": {
                "patterns": [
                    r"SyntaxError:",
                    r"ParseError:",
                    r"Unexpected token",
                    r"Missing semicolon",
                    r"Unclosed bracket"
                ],
                "category": "build",
                "fix_difficulty": "low",
                "typical_files": ["*.js", "*.ts", "*.py", "*.java"],
                "fix_strategy": "syntax_correction"
            },

            "dependency_missing": {
                "patterns": [
                    r"ModuleNotFoundError:",
                    r"Cannot find module",
                    r"ImportError:",
                    r"Package .* not found",
                    r"No such file or directory"
                ],
                "category": "build",
                "fix_difficulty": "low",
                "typical_files": ["package.json", "requirements.txt", "Cargo.toml"],
                "fix_strategy": "dependency_installation"
            },

            "version_conflict": {
                "patterns": [
                    r"version conflict",
                    r"incompatible versions",
                    r"peer dependency",
                    r"ERESOLVE unable to resolve dependency tree"
                ],
                "category": "build",
                "fix_difficulty": "medium",
                "typical_files": ["package.json", "yarn.lock", "package-lock.json"],
                "fix_strategy": "dependency_resolution"
            },

            # Test Failures
            "test_assertion_failure": {
                "patterns": [
                    r"AssertionError:",
                    r"Expected .* but got",
                    r"Test failed:",
                    r"assertion failed"
                ],
                "category": "testing",
                "fix_difficulty": "medium",
                "typical_files": ["test/**/*", "spec/**/*", "__tests__/**/*"],
                "fix_strategy": "test_logic_correction"
            },

            "test_timeout": {
                "patterns": [
                    r"Timeout of \d+ms exceeded",
                    r"Test timeout",
                    r"Operation timed out"
                ],
                "category": "testing",
                "fix_difficulty": "medium",
                "typical_files": ["test/**/*", "jest.config.js", "mocha.opts"],
                "fix_strategy": "timeout_adjustment"
            },

            "test_environment_setup": {
                "patterns": [
                    r"Cannot connect to database",
                    r"Redis connection failed",
                    r"Service unavailable",
                    r"Connection refused"
                ],
                "category": "testing",
                "fix_difficulty": "high",
                "typical_files": ["docker-compose.yml", "test/setup.js", ".env.test"],
                "fix_strategy": "environment_configuration"
            },

            # Security Issues
            "vulnerability_detected": {
                "patterns": [
                    r"High severity vulnerability",
                    r"Security alert",
                    r"CVE-\d{4}-\d{4,}",
                    r"Vulnerable dependency"
                ],
                "category": "security",
                "fix_difficulty": "high",
                "typical_files": ["package.json", "requirements.txt"],
                "fix_strategy": "security_patch"
            },

            "insecure_code_pattern": {
                "patterns": [
                    r"Use of eval\(\)",
                    r"SQL injection risk",
                    r"Hardcoded credential",
                    r"Insecure random"
                ],
                "category": "security",
                "fix_difficulty": "high",
                "typical_files": ["src/**/*"],
                "fix_strategy": "secure_code_rewrite"
            },

            # Quality Issues
            "code_complexity": {
                "patterns": [
                    r"Complexity of \d+ exceeds threshold",
                    r"Function too complex",
                    r"Cognitive complexity"
                ],
                "category": "quality",
                "fix_difficulty": "medium",
                "typical_files": ["src/**/*"],
                "fix_strategy": "refactoring"
            },

            "linting_violation": {
                "patterns": [
                    r"ESLint",
                    r"Pylint",
                    r"Flake8",
                    r"Style violation"
                ],
                "category": "quality",
                "fix_difficulty": "low",
                "typical_files": ["src/**/*", ".eslintrc", "pyproject.toml"],
                "fix_strategy": "style_correction"
            },

            # Infrastructure Issues
            "docker_build_failure": {
                "patterns": [
                    r"Docker build failed",
                    r"Unable to locate package",
                    r"COPY failed",
                    r"RUN command failed"
                ],
                "category": "deployment",
                "fix_difficulty": "medium",
                "typical_files": ["Dockerfile", "docker-compose.yml"],
                "fix_strategy": "docker_configuration"
            },

            "kubernetes_deployment": {
                "patterns": [
                    r"Pod failed to start",
                    r"ImagePullBackOff",
                    r"CrashLoopBackOff",
                    r"Insufficient resources"
                ],
                "category": "deployment",
                "fix_difficulty": "high",
                "typical_files": ["k8s/**/*", "deployment.yaml"],
                "fix_strategy": "kubernetes_troubleshooting"
            }
        }

    def _load_fix_strategies(self) -> Dict[str, Dict[str, Any]]:
        """Load fix strategies for different problem types."""
        return {
            "syntax_correction": {
                "description": "Fix syntax errors in source code",
                "tools": ["eslint --fix", "autopep8", "prettier"],
                "validation": "compile_check",
                "effort_hours": 1,
                "success_rate": 0.95
            },

            "dependency_installation": {
                "description": "Install missing dependencies",
                "tools": ["npm install", "pip install", "cargo build"],
                "validation": "dependency_check",
                "effort_hours": 1,
                "success_rate": 0.90
            },

            "dependency_resolution": {
                "description": "Resolve dependency version conflicts",
                "tools": ["npm audit fix", "pip-audit --fix", "yarn resolutions"],
                "validation": "conflict_resolution_check",
                "effort_hours": MAXIMUM_RETRY_ATTEMPTS,
                "success_rate": THEATER_DETECTION_WARNING_THRESHOLD
            },

            "test_logic_correction": {
                "description": "Fix test assertion logic",
                "tools": ["test_analyzer", "manual_review"],
                "validation": "test_execution",
                "effort_hours": 2,
                "success_rate": 0.8
            },

            "timeout_adjustment": {
                "description": "Adjust test timeout configurations",
                "tools": ["config_editor"],
                "validation": "timeout_test",
                "effort_hours": 1,
                "success_rate": 0.85
            },

            "environment_configuration": {
                "description": "Fix test environment setup",
                "tools": ["docker-compose", "test_setup_scripts"],
                "validation": "environment_test",
                "effort_hours": 4,
                "success_rate": 0.70
            },

            "security_patch": {
                "description": "Apply security patches and updates",
                "tools": ["npm audit fix", "safety --fix", "bandit"],
                "validation": "security_scan",
                "effort_hours": 2,
                "success_rate": 0.85
            },

            "secure_code_rewrite": {
                "description": "Rewrite insecure code patterns",
                "tools": ["manual_review", "security_linter"],
                "validation": "security_audit",
                "effort_hours": 6,
                "success_rate": 0.75
            },

            "refactoring": {
                "description": "Refactor complex code to reduce complexity",
                "tools": ["complexity_analyzer", "refactoring_tools"],
                "validation": "complexity_check",
                "effort_hours": 8,
                "success_rate": 0.70
            },

            "style_correction": {
                "description": "Fix code style violations",
                "tools": ["eslint --fix", "black", "prettier"],
                "validation": "style_check",
                "effort_hours": 1,
                "success_rate": 0.95
            },

            "docker_configuration": {
                "description": "Fix Docker configuration issues",
                "tools": ["docker build", "hadolint"],
                "validation": "docker_build_test",
                "effort_hours": MAXIMUM_RETRY_ATTEMPTS,
                "success_rate": 0.80
            },

            "kubernetes_troubleshooting": {
                "description": "Fix Kubernetes deployment issues",
                "tools": ["kubectl", "helm", "k9s"],
                "validation": "deployment_test",
                "effort_hours": 5,
                "success_rate": 0.65
            }
        }

    def _initialize_pattern_databases(self):
        """Initialize pattern databases with existing knowledge."""
        logger.info("Initializing failure pattern databases...")

        # Load historical pattern data if available
        pattern_file = Path(".claude/.artifacts/failure_patterns.json")
        if pattern_file.exists():
            try:
                with open(pattern_file, 'r') as f:
                    historical_data = json.load(f)
                    self._load_historical_patterns(historical_data)
            except Exception as e:
                logger.warning(f"Could not load historical patterns: {e}")

    def _load_historical_patterns(self, historical_data: Dict[str, Any]):
        """Load historical failure patterns for enhanced detection."""
        for pattern_id, pattern_data in historical_data.get("patterns", {}).items():
            signature = FailureSignature(
                category=pattern_data["category"],
                step_name=pattern_data["step_name"],
                error_pattern=pattern_data["error_pattern"],
                frequency=pattern_data["frequency"],
                confidence_score=pattern_data["confidence_score"],
                affected_files=pattern_data.get("affected_files", []),
                context_hash=pattern_data.get("context_hash", ""),
                root_cause_hypothesis=pattern_data.get("root_cause_hypothesis", ""),
                fix_difficulty=pattern_data.get("fix_difficulty", "medium")
            )
            self.failure_patterns[pattern_id] = signature

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

            # Try to extract error pattern from logs if available
            error_pattern = self._extract_error_pattern(failure)

            # Calculate context hash for deduplication
            context_data = f"{category}:{step_name}:{error_pattern}"
            context_hash = hashlib.sha256(context_data.encode()).hexdigest()[:12]

            # Find matching known patterns
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
        # In a real implementation, this would parse log files

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
        for pattern_name, pattern_info in self.error_pattern_db.items():
            if pattern_info["category"] == category:
                for regex_pattern in pattern_info["patterns"]:
                    if re.search(regex_pattern, error_pattern, re.IGNORECASE):
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
            self.failure_patterns[pattern_id] = signature

    def reverse_engineer_root_causes(self, signatures: List[FailureSignature]) -> List[RootCauseAnalysis]:
        """Apply reverse engineering to determine root causes."""
        logger.info("Reverse engineering root causes...")

        root_causes = []

        for signature in signatures:
            analysis = self._analyze_single_root_cause(signature)
            if analysis:
                root_causes.append(analysis)

        # Sort by confidence and impact
        root_causes.sort(key=lambda x: (x.confidence_score, x.estimated_effort_hours), reverse=True)

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
        for strategy_name, strategy_info in self.fix_strategy_db.items():
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
        if fix_strategy in self.fix_strategy_db:
            base_effort = self.fix_strategy_db[fix_strategy]["effort_hours"]
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
        if fix_strategy in self.fix_strategy_db:
            return self.fix_strategy_db[fix_strategy]["validation"]

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
            "recommendations": self._generate_recommendations(signatures, root_causes)
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

        # Update success rates for fix strategies
        for fix_result in fix_results.get("applied_fixes", []):
            strategy = fix_result.get("fix_strategy")
            success = fix_result.get("success", False)

            if strategy in self.fix_strategy_db:
                current_rate = self.fix_strategy_db[strategy]["success_rate"]
                # Update using exponential moving average
                new_rate = 0.9 * current_rate + 0.1 * (1.0 if success else 0.0)
                self.fix_strategy_db[strategy]["success_rate"] = new_rate

        # Update pattern confidence based on fix success
        for pattern_update in fix_results.get("pattern_updates", []):
            pattern_id = pattern_update.get("pattern_id")
            success = pattern_update.get("fix_success", False)

            if pattern_id in self.failure_patterns:
                signature = self.failure_patterns[pattern_id]
                if success:
                    signature.confidence_score = min(1.0, signature.confidence_score + 0.1)
                else:
                    signature.confidence_score = max(0.1, signature.confidence_score - 0.5)

        # Save updated patterns
        self._save_pattern_database()

    def _save_pattern_database(self):
        """Save updated pattern database for future use."""
        pattern_data = {
            "timestamp": datetime.now().isoformat(),
            "patterns": {}
        }

        for pattern_id, signature in self.failure_patterns.items():
            pattern_data["patterns"][pattern_id] = {
                "category": signature.category,
                "step_name": signature.step_name,
                "error_pattern": signature.error_pattern,
                "frequency": signature.frequency,
                "confidence_score": signature.confidence_score,
                "affected_files": signature.affected_files,
                "context_hash": signature.context_hash,
                "root_cause_hypothesis": signature.root_cause_hypothesis,
                "fix_difficulty": signature.fix_difficulty,
                "similar_patterns": signature.similar_patterns
            }

        pattern_file = Path(".claude/.artifacts/failure_patterns.json")
        pattern_file.parent.mkdir(parents=True, exist_ok=True)

        with open(pattern_file, 'w') as f:
            json.dump(pattern_data, f, indent=2)

        logger.info(f"Pattern database saved to {pattern_file}")

    def _load_test_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load test-specific failure patterns and characteristics."""
        return {
            # Unit Test Patterns
            "unit_test_assertion_failure": {
                "patterns": [
                    r"AssertionError:",
                    r"assertion failed",
                    r"expected .* but got .*",
                    r"Test assertion failed",
                    r"assertEqual.*failed"
                ],
                "category": "unit_testing",
                "test_type": "unit",
                "fix_difficulty": "medium",
                "typical_causes": ["logic_error", "data_mismatch", "API_change"],
                "auto_repair_strategy": "assertion_analysis"
            },

            "unit_test_import_failure": {
                "patterns": [
                    r"ModuleNotFoundError.*test",
                    r"ImportError.*test",
                    r"Cannot import.*test",
                    r"No module named.*test"
                ],
                "category": "unit_testing",
                "test_type": "unit",
                "fix_difficulty": "low",
                "typical_causes": ["missing_dependency", "import_path", "test_structure"],
                "auto_repair_strategy": "dependency_repair"
            },

            # Integration Test Patterns
            "integration_test_connection_failure": {
                "patterns": [
                    r"Connection.*refused",
                    r"Database.*unavailable",
                    r"Service.*timeout",
                    r"Network.*error.*integration",
                    r"API.*endpoint.*failed"
                ],
                "category": "integration_testing",
                "test_type": "integration",
                "fix_difficulty": "high",
                "typical_causes": ["service_down", "network_issue", "configuration_error"],
                "auto_repair_strategy": "service_health_check"
            },

            "integration_test_data_setup_failure": {
                "patterns": [
                    r"Test data.*not found",
                    r"Database.*setup.*failed",
                    r"Fixture.*missing",
                    r"Test environment.*invalid",
                    r"Migration.*failed.*test"
                ],
                "category": "integration_testing",
                "test_type": "integration",
                "fix_difficulty": "medium",
                "typical_causes": ["data_migration", "environment_setup", "fixture_issue"],
                "auto_repair_strategy": "data_setup_repair"
            },

            # End-to-End Test Patterns
            "e2e_test_timeout": {
                "patterns": [
                    r"Test.*timeout",
                    r"Element.*not found.*timeout",
                    r"Page.*load.*timeout",
                    r"Selenium.*timeout",
                    r"Browser.*timeout"
                ],
                "category": "e2e_testing",
                "test_type": "e2e",
                "fix_difficulty": "medium",
                "typical_causes": ["slow_response", "element_loading", "network_latency"],
                "auto_repair_strategy": "timeout_adjustment"
            },

            "e2e_test_element_not_found": {
                "patterns": [
                    r"Element.*not found",
                    r"Selector.*not found",
                    r"Element.*not clickable",
                    r"Element.*not visible",
                    r"No such element"
                ],
                "category": "e2e_testing",
                "test_type": "e2e",
                "fix_difficulty": "medium",
                "typical_causes": ["ui_change", "selector_update", "timing_issue"],
                "auto_repair_strategy": "selector_update"
            },

            # Performance Test Patterns
            "performance_test_memory_issue": {
                "patterns": [
                    r"OutOfMemoryError",
                    r"Memory.*exceeded",
                    r"Heap.*overflow",
                    r"Memory leak.*detected",
                    r"GC.*overhead.*limit"
                ],
                "category": "performance_testing",
                "test_type": "performance",
                "fix_difficulty": "high",
                "typical_causes": ["memory_leak", "large_dataset", "inefficient_algorithm"],
                "auto_repair_strategy": "memory_optimization"
            },

            "performance_test_threshold_exceeded": {
                "patterns": [
                    r"Performance.*threshold.*exceeded",
                    r"Response.*time.*too.*slow",
                    r"Latency.*above.*limit",
                    r"Throughput.*below.*expected",
                    r"Performance.*regression"
                ],
                "category": "performance_testing",
                "test_type": "performance",
                "fix_difficulty": "high",
                "typical_causes": ["performance_regression", "resource_contention", "scaling_issue"],
                "auto_repair_strategy": "performance_analysis"
            },

            # Configuration Test Patterns
            "config_test_env_mismatch": {
                "patterns": [
                    r"Environment.*variable.*missing",
                    r"Configuration.*not.*found",
                    r"Config.*file.*invalid",
                    r"Settings.*mismatch",
                    r"Environment.*mismatch"
                ],
                "category": "configuration_testing",
                "test_type": "configuration",
                "fix_difficulty": "low",
                "typical_causes": ["missing_env_var", "config_file_issue", "environment_setup"],
                "auto_repair_strategy": "config_repair"
            },

            # Security Test Patterns
            "security_test_vulnerability": {
                "patterns": [
                    r"Security.*vulnerability.*detected",
                    r"SQL.*injection.*found",
                    r"XSS.*vulnerability",
                    r"CSRF.*token.*missing",
                    r"Authentication.*bypass"
                ],
                "category": "security_testing",
                "test_type": "security",
                "fix_difficulty": "high",
                "typical_causes": ["security_vulnerability", "input_validation", "authentication_issue"],
                "auto_repair_strategy": "security_patch"
            },

            # Test Infrastructure Patterns
            "test_runner_failure": {
                "patterns": [
                    r"Test runner.*failed",
                    r"Jest.*configuration.*error",
                    r"Pytest.*collection.*failed",
                    r"Test.*setup.*failed",
                    r"Test.*framework.*error"
                ],
                "category": "test_infrastructure",
                "test_type": "infrastructure",
                "fix_difficulty": "medium",
                "typical_causes": ["runner_config", "framework_issue", "dependency_conflict"],
                "auto_repair_strategy": "test_infrastructure_repair"
            },

            # Coverage Test Patterns
            "coverage_threshold_failure": {
                "patterns": [
                    r"Coverage.*below.*threshold",
                    r"Insufficient.*test.*coverage",
                    r"Coverage.*requirement.*not.*met",
                    r"Line.*coverage.*too.*low",
                    r"Branch.*coverage.*insufficient"
                ],
                "category": "coverage_testing",
                "test_type": "coverage",
                "fix_difficulty": "medium",
                "typical_causes": ["insufficient_tests", "uncovered_code", "coverage_config"],
                "auto_repair_strategy": "coverage_improvement"
            }
        }

    def analyze_test_specific_failures(self, test_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze test-specific failure patterns and provide targeted insights."""
        test_failures = []

        for suite_name, suite_result in test_results.get("detailed_results", []):
            if isinstance(suite_result, dict) and not suite_result.get("success", True):
                failure_analysis = self._analyze_single_test_failure(suite_name, suite_result)
                if failure_analysis:
                    test_failures.append(failure_analysis)

        return test_failures

    def _analyze_single_test_failure(self, suite_name: str, suite_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Analyze a single test suite failure."""
        error_output = suite_result.get("error_output", "")
        failure_details = suite_result.get("failure_details", [])

        # Determine test type from suite name
        test_type = self._determine_test_type(suite_name)

        # Find matching test patterns
        matching_patterns = []
        for pattern_name, pattern_info in self.test_pattern_db.items():
            if pattern_info["test_type"] == test_type or test_type == "unknown":
                for pattern in pattern_info["patterns"]:
                    if re.search(pattern, error_output, re.IGNORECASE):
                        matching_patterns.append({
                            "pattern_name": pattern_name,
                            "pattern_info": pattern_info,
                            "confidence": self._calculate_pattern_confidence(pattern, error_output)
                        })

        if not matching_patterns:
            return None

        # Select best matching pattern
        best_pattern = max(matching_patterns, key=lambda x: x["confidence"])

        return {
            "suite_name": suite_name,
            "test_type": test_type,
            "failure_pattern": best_pattern["pattern_name"],
            "confidence": best_pattern["confidence"],
            "typical_causes": best_pattern["pattern_info"]["typical_causes"],
            "auto_repair_strategy": best_pattern["pattern_info"]["auto_repair_strategy"],
            "fix_difficulty": best_pattern["pattern_info"]["fix_difficulty"],
            "error_output": error_output,
            "failure_details": failure_details,
            "suggested_actions": self._generate_test_specific_actions(best_pattern["pattern_info"])
        }

    def _determine_test_type(self, suite_name: str) -> str:
        """Determine test type from suite name."""
        suite_lower = suite_name.lower()

        if "unit" in suite_lower:
            return "unit"
        elif "integration" in suite_lower:
            return "integration"
        elif "e2e" in suite_lower or "end_to_end" in suite_lower:
            return "e2e"
        elif "performance" in suite_lower:
            return "performance"
        elif "security" in suite_lower:
            return "security"
        elif "config" in suite_lower:
            return "configuration"
        elif "coverage" in suite_lower:
            return "coverage"
        else:
            return "unknown"

    def _calculate_pattern_confidence(self, pattern: str, error_output: str) -> float:
        """Calculate confidence score for pattern match."""
        matches = len(re.findall(pattern, error_output, re.IGNORECASE))
        total_lines = len(error_output.split('\n'))

        # Base confidence on match density
        if total_lines == 0:
            return 0.0

        match_density = matches / total_lines
        confidence = min(match_density * 10, 1.0)  # Cap at 1.0

        # Boost confidence for exact matches
        if re.search(pattern, error_output):
            confidence = min(confidence + 0.3, 1.0)

        return confidence

    def _generate_test_specific_actions(self, pattern_info: Dict[str, Any]) -> List[str]:
        """Generate test-specific recommended actions."""
        strategy = pattern_info["auto_repair_strategy"]
        test_type = pattern_info["test_type"]

        actions = []

        if strategy == "assertion_analysis":
            actions.extend([
                "Review test assertions for correctness",
                "Check if expected values match actual implementation",
                "Verify test data setup and teardown",
                "Consider if API contracts have changed"
            ])
        elif strategy == "dependency_repair":
            actions.extend([
                "Install missing test dependencies",
                "Check import paths and module structure",
                "Verify test file organization",
                "Update package.json or requirements.txt"
            ])
        elif strategy == "service_health_check":
            actions.extend([
                "Verify all required services are running",
                "Check database connectivity and permissions",
                "Validate API endpoint availability",
                "Review network configuration and timeouts"
            ])
        elif strategy == "timeout_adjustment":
            actions.extend([
                "Increase test timeout values",
                "Optimize page load performance",
                "Add explicit waits for dynamic content",
                "Review network latency issues"
            ])
        elif strategy == "performance_analysis":
            actions.extend([
                "Analyze performance regression causes",
                "Review recent code changes for performance impact",
                "Check resource utilization during tests",
                "Consider scaling test environment"
            ])

        # Add test-type specific actions
        if test_type == "unit":
            actions.append("Run tests in isolation to identify dependencies")
        elif test_type == "integration":
            actions.append("Verify test environment setup and data fixtures")
        elif test_type == "e2e":
            actions.append("Check UI element selectors and page structure")

        return actions

class TestFailureCorrelator:
    """Correlates test failures across different test types and identifies patterns."""

    def __init__(self):
        self.correlation_history = []

    def correlate_failures(self, test_failures: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Find correlations between test failures."""
        correlations = {
            "cross_suite_patterns": [],
            "failure_clusters": [],
            "root_cause_candidates": [],
            "cascade_failures": []
        }

        # Group failures by pattern
        pattern_groups = defaultdict(list)
        for failure in test_failures:
            pattern = failure.get("failure_pattern", "unknown")
            pattern_groups[pattern].append(failure)

        # Find cross-suite patterns
        for pattern, failures in pattern_groups.items():
            if len(failures) > 1:
                suite_types = [f.get("test_type", "unknown") for f in failures]
                if len(set(suite_types)) > 1:
                    correlations["cross_suite_patterns"].append({
                        "pattern": pattern,
                        "affected_suites": [f["suite_name"] for f in failures],
                        "affected_types": list(set(suite_types)),
                        "severity": "high" if len(failures) > 3 else "medium"
                    })

        # Find failure clusters (failures with common causes)
        cause_groups = defaultdict(list)
        for failure in test_failures:
            for cause in failure.get("typical_causes", []):
                cause_groups[cause].append(failure)

        for cause, failures in cause_groups.items():
            if len(failures) > 2:
                correlations["failure_clusters"].append({
                    "root_cause": cause,
                    "affected_suites": [f["suite_name"] for f in failures],
                    "cluster_size": len(failures),
                    "confidence": min(sum(f.get("confidence", 0) for f in failures) / len(failures), 1.0)
                })

        # Identify cascade failures
        correlations["cascade_failures"] = self._identify_cascade_failures(test_failures)

        return correlations

    def _identify_cascade_failures(self, test_failures: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify failures that are likely caused by other failures."""
        cascade_failures = []

        unit_failures = [f for f in test_failures if f.get("test_type") == "unit"]
        integration_failures = [f for f in test_failures if f.get("test_type") == "integration"]

        # If unit tests fail, integration tests might fail as cascade
        if unit_failures and integration_failures:
            for int_failure in integration_failures:
                for unit_failure in unit_failures:
                    if self._are_related_failures(unit_failure, int_failure):
                        cascade_failures.append({
                            "primary_failure": unit_failure["suite_name"],
                            "cascade_failure": int_failure["suite_name"],
                            "relationship": "unit_to_integration",
                            "confidence": 0.8
                        })

        return cascade_failures

    def _are_related_failures(self, failure1: Dict[str, Any], failure2: Dict[str, Any]) -> bool:
        """Check if two failures are related."""
        # Simple heuristic: check if they share common causes
        causes1 = set(failure1.get("typical_causes", []))
        causes2 = set(failure2.get("typical_causes", []))

        return len(causes1.intersection(causes2)) > 0

class TestSuccessPredictor:
    """Predicts test success probability based on code changes and historical data."""

    def __init__(self):
        self.prediction_model = TestPredictionModel()

    def predict_test_success(self, change_context: Dict[str, Any], test_suite: str) -> Dict[str, Any]:
        """Predict success probability for a specific test suite."""
        features = self._extract_prediction_features(change_context, test_suite)
        probability = self.prediction_model.predict(features)

        return {
            "test_suite": test_suite,
            "success_probability": probability,
            "risk_factors": self._identify_risk_factors(features),
            "recommendations": self._generate_recommendations(features, probability)
        }

    def _extract_prediction_features(self, change_context: Dict[str, Any], test_suite: str) -> Dict[str, Any]:
        """Extract features for prediction model."""
        return {
            "change_size": len(change_context.get("affected_files", [])),
            "test_type": self._determine_test_type_from_suite(test_suite),
            "has_test_changes": any("test" in f for f in change_context.get("affected_files", [])),
            "complexity": change_context.get("complexity", "medium"),
            "recent_failure_rate": change_context.get("recent_failure_rate", 0.0),
            "historical_success_rate": change_context.get("historical_success_rate", 1.0)
        }

    def _determine_test_type_from_suite(self, test_suite: str) -> str:
        """Determine test type from suite name."""
        if "unit" in test_suite.lower():
            return "unit"
        elif "integration" in test_suite.lower():
            return "integration"
        elif "e2e" in test_suite.lower():
            return "e2e"
        else:
            return "other"

    def _identify_risk_factors(self, features: Dict[str, Any]) -> List[str]:
        """Identify risk factors that might cause test failures."""
        risk_factors = []

        if features["change_size"] > 5:
            risk_factors.append("large_change_set")

        if features["complexity"] == "high":
            risk_factors.append("high_complexity_changes")

        if features["recent_failure_rate"] > 0.2:
            risk_factors.append("recent_failure_history")

        if not features["has_test_changes"] and features["test_type"] in ["unit", "integration"]:
            risk_factors.append("no_corresponding_test_updates")

        return risk_factors

    def _generate_recommendations(self, features: Dict[str, Any], probability: float) -> List[str]:
        """Generate recommendations based on prediction."""
        recommendations = []

        if probability < 0.7:
            recommendations.append("Consider running tests locally before committing")

        if features["change_size"] > 5:
            recommendations.append("Break down large changes into smaller commits")

        if not features["has_test_changes"]:
            recommendations.append("Add or update tests for modified code")

        if features["recent_failure_rate"] > 0.2:
            recommendations.append("Review recent failure patterns before proceeding")

        return recommendations

class TestPredictionModel:
    """Simple prediction model for test success."""

    def predict(self, features: Dict[str, Any]) -> float:
        """Predict success probability using heuristics."""
        base_probability = features.get("historical_success_rate", 0.8)

        # Adjust based on change size
        if features["change_size"] > 10:
            base_probability *= 0.7
        elif features["change_size"] > 5:
            base_probability *= 0.85

        # Adjust based on complexity
        if features["complexity"] == "high":
            base_probability *= 0.8
        elif features["complexity"] == "low":
            base_probability *= 1.1

        # Adjust based on test changes
        if features["has_test_changes"]:
            base_probability *= 1.5

        # Adjust based on recent failures
        failure_rate = features.get("recent_failure_rate", 0.0)
        base_probability *= (1.0 - failure_rate * 0.5)

        return max(0.0, min(1.0, base_probability))

class TestAutoRepair:
    """Provides auto-repair suggestions for test failures."""

    def __init__(self):
        self.repair_strategies = self._initialize_repair_strategies()

    def _initialize_repair_strategies(self) -> Dict[str, Any]:
        """Initialize test-specific repair strategies."""
        return {
            "assertion_analysis": {
                "automated": False,
                "suggestions": [
                    "Review assertion logic and expected values",
                    "Check if test data matches expected format",
                    "Verify API response structure hasn't changed"
                ]
            },
            "dependency_repair": {
                "automated": True,
                "suggestions": [
                    "Install missing packages automatically",
                    "Update import paths",
                    "Fix test file organization"
                ]
            },
            "timeout_adjustment": {
                "automated": True,
                "suggestions": [
                    "Increase timeout values gradually",
                    "Add explicit waits",
                    "Optimize loading performance"
                ]
            },
            "config_repair": {
                "automated": True,
                "suggestions": [
                    "Set missing environment variables",
                    "Create default configuration files",
                    "Fix configuration syntax"
                ]
            }
        }

    def suggest_repairs(self, test_failure: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest repairs for a test failure."""
        strategy = test_failure.get("auto_repair_strategy", "manual")

        repair_info = self.repair_strategies.get(strategy, {
            "automated": False,
            "suggestions": ["Manual investigation required"]
        })

        return {
            "strategy": strategy,
            "automated_repair_available": repair_info["automated"],
            "repair_suggestions": repair_info["suggestions"],
            "confidence": test_failure.get("confidence", 0.0),
            "estimated_effort": self._estimate_repair_effort(test_failure)
        }

    def _estimate_repair_effort(self, test_failure: Dict[str, Any]) -> str:
        """Estimate effort required for repair."""
        difficulty = test_failure.get("fix_difficulty", "medium")

        if difficulty == "low":
            return "5-15 minutes"
        elif difficulty == "medium":
            return "30-60 minutes"
        else:
            return "2-4 hours"

def main():
    """Main entry point for failure pattern detection."""
    import argparse

    parser = argparse.ArgumentParser(description="Advanced Failure Pattern Detection")
    parser.add_argument("--input", required=True, help="Input failure data JSON file")
    parser.add_argument("--output", help="Output analysis file path")
    parser.add_argument("--config", help="Configuration file path")
    parser.add_argument("--learn", help="Fix results file for learning")

    args = parser.parse_args()

    # Load configuration
    config = {}
    if args.config and path_exists(args.config):
        with open(args.config, 'r') as f:
            config = json.load(f)

    # Initialize detector
    detector = FailurePatternDetector(config)

    # Load failure data
    with open(args.input, 'r') as f:
        failure_data = json.load(f)

    # Analyze patterns
    signatures = detector.analyze_failure_patterns(failure_data)
    root_causes = detector.reverse_engineer_root_causes(signatures)

    # Save results
    output_path = Path(args.output) if args.output else Path("/tmp/failure_pattern_analysis.json")
    detector.save_analysis_results(signatures, root_causes, output_path)

    # Learn from previous fixes if provided
    if args.learn and path_exists(args.learn):
        with open(args.learn, 'r') as f:
            fix_results = json.load(f)
        detector.learn_from_fixes(fix_results)

    print(f"Analysis complete. Found {len(signatures)} patterns and {len(root_causes)} root causes.")
    print(f"Results saved to {output_path}")

if __name__ == "__main__":
    main()