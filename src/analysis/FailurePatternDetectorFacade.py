"""
FailurePatternDetectorFacade - Backward compatible interface
Maintains API compatibility while delegating to decomposed components
Part of god object decomposition (Day 3-5)
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Set
import hashlib
import json
import os

from dataclasses import dataclass, field

# Import decomposed components
from .core.PatternMatcher import PatternMatcher, FailurePattern
from .core.RootCauseAnalyzer import RootCauseAnalyzer, RootCause, CausalChain
from .services.FixGenerator import FixGenerator, FixStrategy

# Keep original dataclasses for backward compatibility
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

class FailurePatternDetector:
    """
    Facade for Failure Pattern Detection Engine.

    Original: 1, 281 LOC god object
    Refactored: ~150 LOC facade + 3 specialized components (~750 LOC total)

    Maintains 100% backward compatibility while delegating to:
    - PatternMatcher: Pattern recognition and matching
    - RootCauseAnalyzer: Root cause analysis and causal chains
    - FixGenerator: Fix strategy generation and validation
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the failure pattern detector with decomposed components."""
        self.config_path = config_path
        self.config = self._load_config()

        # Initialize decomposed components
        self.pattern_matcher = PatternMatcher()
        self.root_cause_analyzer = RootCauseAnalyzer()
        self.fix_generator = FixGenerator()

        # Maintain original state for compatibility
        self.failure_signatures: List[FailureSignature] = []
        self.root_cause_cache: Dict[str, RootCauseAnalysis] = {}
        self.pattern_evolution_history: List[Dict[str, Any]] = []

        # Load historical data if available
        self._load_historical_data()

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file."""
        if self.config_path and Path(self.config_path).exists():
            try:
                with open(self.config_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load config: {e}")
        return {}

    def _load_historical_data(self) -> None:
        """Load historical failure data."""
        history_file = self.config.get("history_file")
        if history_file and Path(history_file).exists():
            try:
                with open(history_file, 'r') as f:
                    data = json.load(f)
                    # Import patterns into matcher
                    if "patterns" in data:
                        self.pattern_matcher.import_patterns(data["patterns"])
                    # Load failure signatures
                    if "signatures" in data:
                        for sig_data in data["signatures"]:
                            self.failure_signatures.append(FailureSignature(**sig_data))
            except Exception as e:
                logger.error(f"Failed to load history: {e}")

    def detect_pattern(self,
                        error_message: str,
                        step_name: str,
                        context: Optional[Dict[str, Any]] = None) -> FailureSignature:
        """Detect failure pattern from error message (original API)."""
        # Use PatternMatcher to find pattern
        pattern = self.pattern_matcher.match_pattern(error_message, context)

        # Create FailureSignature for backward compatibility
        if pattern:
            signature = FailureSignature(
                category=pattern.pattern_type,
                step_name=step_name,
                error_pattern=pattern.regex,
                frequency=pattern.frequency,
                confidence_score=pattern.confidence,
                affected_files=context.get("files", []) if context else [],
                context_hash=hashlib.sha256(error_message.encode()).hexdigest()[:12],
                root_cause_hypothesis="",  # Will be filled by root cause analysis
                fix_difficulty="medium",
                similar_patterns=pattern.examples[:3]
            )
        else:
            # Unknown pattern
            signature = FailureSignature(
                category="unknown",
                step_name=step_name,
                error_pattern=error_message[:100],
                frequency=1,
                confidence_score=0.3,
                affected_files=context.get("files", []) if context else [],
                context_hash=hashlib.sha256(error_message.encode()).hexdigest()[:12],
                root_cause_hypothesis="Unknown failure pattern",
                fix_difficulty="high"
            )

        self.failure_signatures.append(signature)
        return signature

    def analyze_root_cause(self,
                            failure_signature: FailureSignature,
                            historical_context: Optional[List[Dict[str, Any]]] = None) -> RootCauseAnalysis:
        """Perform root cause analysis (original API)."""
        # Check cache
        cache_key = failure_signature.context_hash
        if cache_key in self.root_cause_cache:
            return self.root_cause_cache[cache_key]

        # Prepare failure data for analyzer
        failure_data = {
            "error_message": failure_signature.error_pattern,
            "test_name": failure_signature.step_name,
            "files": failure_signature.affected_files,
            "category": failure_signature.category
        }

        # Use RootCauseAnalyzer
        root_cause = self.root_cause_analyzer.analyze_failure(
            failure_data,
            historical_context
        )

        # Get fix strategy from FixGenerator
        fix_strategy = self.fix_generator.generate_strategy(
            root_cause.cause_type,
            root_cause.evidence
        )

        # Convert to RootCauseAnalysis for backward compatibility
        analysis = RootCauseAnalysis(
            primary_cause=root_cause.description,
            contributing_factors=root_cause.contributing_factors,
            confidence_score=root_cause.confidence,
            affected_components=root_cause.affected_components,
            fix_strategy=fix_strategy.strategy_name if fix_strategy else "manual_fix",
            verification_method=fix_strategy.verification_method if fix_strategy else "manual_test",
            estimated_effort_hours=fix_strategy.estimated_hours if fix_strategy else 4,
            risk_level=self._calculate_risk_level(root_cause.confidence)
        )

        # Update signature with root cause
        failure_signature.root_cause_hypothesis = root_cause.description

        # Cache result
        self.root_cause_cache[cache_key] = analysis

        return analysis

    def _calculate_risk_level(self, confidence: float) -> str:
        """Calculate risk level based on confidence."""
        if confidence >= 0.8:
            return "low"
        elif confidence >= 0.6:
            return "medium"
        else:
            return "high"

    def generate_fix_strategy(self,
                            root_cause_analysis: RootCauseAnalysis,
                            context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate fix strategy (original API)."""
        # Use FixGenerator
        strategy = self.fix_generator.generate_comprehensive_fix(
            cause_type=root_cause_analysis.primary_cause,
            affected_components=root_cause_analysis.affected_components,
            context=context
        )

        return {
            "strategy": strategy.get("primary_strategy", "unknown"),
            "steps": strategy.get("steps", []),
            "estimated_time": root_cause_analysis.estimated_effort_hours,
            "risk": root_cause_analysis.risk_level,
            "verification": root_cause_analysis.verification_method,
            "fallback_strategies": strategy.get("fallback_strategies", [])
        }

    def evolve_patterns(self) -> None:
        """Evolve patterns based on learning (original API)."""
        # Delegate to PatternMatcher
        evolved = self.pattern_matcher.evolve_patterns()

        # Track evolution history
        self.pattern_evolution_history.append({
            "timestamp": datetime.now().isoformat(),
            "patterns_evolved": len(evolved),
            "total_patterns": len(self.pattern_matcher.patterns)
        })

        logger.info(f"Evolved {len(evolved)} patterns")

    def get_pattern_statistics(self) -> Dict[str, Any]:
        """Get pattern statistics (original API)."""
        # Get stats from PatternMatcher
        matcher_stats = self.pattern_matcher.get_pattern_statistics()

        # Get stats from RootCauseAnalyzer
        analyzer_stats = self.root_cause_analyzer.get_analysis_summary()

        # Combine statistics
        return {
            "total_signatures": len(self.failure_signatures),
            "pattern_stats": matcher_stats,
            "root_cause_stats": analyzer_stats,
            "cache_size": len(self.root_cause_cache),
            "evolution_history": len(self.pattern_evolution_history)
        }

    def save_state(self, output_path: str) -> None:
        """Save detector state for persistence."""
        state = {
            "patterns": self.pattern_matcher.export_patterns(),
            "signatures": [
                {
                    "category": sig.category,
                    "step_name": sig.step_name,
                    "error_pattern": sig.error_pattern,
                    "frequency": sig.frequency,
                    "confidence_score": sig.confidence_score
                }
                for sig in self.failure_signatures[-100:]  # Keep last 100
            ],
            "evolution_history": self.pattern_evolution_history,
            "timestamp": datetime.now().isoformat()
        }

        with open(output_path, 'w') as f:
            json.dump(state, f, indent=2)

    def load_state(self, input_path: str) -> None:
        """Load detector state from file."""
        with open(input_path, 'r') as f:
            state = json.load(f)

        # Import patterns
        if "patterns" in state:
            self.pattern_matcher.import_patterns(state["patterns"])

        # Load signatures
        if "signatures" in state:
            self.failure_signatures = [
                FailureSignature(**sig_data)
                for sig_data in state["signatures"]
            ]

        # Load history
        if "evolution_history" in state:
            self.pattern_evolution_history = state["evolution_history"]

    # Additional methods for backward compatibility
    def get_similar_failures(self,
                            signature: FailureSignature,
                            limit: int = 5) -> List[FailureSignature]:
        """Get similar historical failures."""
        similar = []

        for historical in self.failure_signatures:
            if historical.category == signature.category:
                similar.append(historical)
                if len(similar) >= limit:
                    break

        return similar

    def get_failure_trends(self) -> Dict[str, Any]:
        """Analyze failure trends over time."""
        # Group signatures by category
        from collections import Counter
        category_counts = Counter(sig.category for sig in self.failure_signatures)

        return {
            "total_failures": len(self.failure_signatures),
            "category_distribution": dict(category_counts),
            "top_failures": category_counts.most_common(5),
            "evolution_count": len(self.pattern_evolution_history)
        }