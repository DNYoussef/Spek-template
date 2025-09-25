"""
PatternMatcher - Extracted from FailurePatternDetector
Handles pattern recognition and matching for CI/CD failures
Part of god object decomposition (Day 3-5)
"""

from collections import defaultdict, Counter
from typing import Dict, List, Optional, Tuple, Any, Set
import hashlib
import logging
import re

from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class FailurePattern:
    """Represents a detected failure pattern."""
    pattern_id: str
    pattern_type: str
    regex: str
    frequency: int
    confidence: float
    examples: List[str] = field(default_factory=list)
    context_hash: str = ""

class PatternMatcher:
    """
    Handles pattern recognition and matching for failures.

    Extracted from FailurePatternDetector god object (1, 281 LOC -> ~250 LOC component).
    Handles:
    - Pattern detection and classification
    - Pattern frequency analysis
    - Similarity matching
    - Pattern evolution tracking
    """

    def __init__(self):
        """Initialize the pattern matcher."""
        self.patterns: Dict[str, FailurePattern] = {}
        self.pattern_cache: Dict[str, str] = {}
        self.pattern_history: List[FailurePattern] = []
        self.similarity_threshold = 0.75

        # Load common failure patterns
        self._load_common_patterns()

    def _load_common_patterns(self) -> None:
        """Load common CI/CD failure patterns."""
        common_patterns = {
            "timeout": r"(timeout|timed out|exceeded|deadline)",
            "undefined": r"(undefined|is not defined|cannot find|not found)",
            "type_error": r"(type error|type mismatch|incompatible types|expected .+ got)",
            "assertion": r"(assert|expect|should|toBe|toEqual|failed assertion)",
            "connection": r"(connection|refused|ECONNREFUSED|network|unreachable)",
            "permission": r"(permission|denied|unauthorized|forbidden|EACCES)",
            "memory": r"(out of memory|heap|stack overflow|allocation failed)",
            "syntax": r"(syntax error|unexpected token|parsing error|invalid syntax)",
            "import": r"(import error|module not found|cannot import|ImportError)",
            "null": r"(null|undefined|NullPointerException|cannot read property)",
            "dependency": r"(dependency|package|module|version conflict|peer dep)",
            "build": r"(build failed|compilation error|webpack|rollup|tsc)",
            "test": r"(test failed|suite failed| |FAIL)",
            "lint": r"(lint error|eslint|tslint|pylint|formatting)",
            "coverage": r"(coverage threshold|below threshold|coverage failed)"
        }

        for pattern_type, regex in common_patterns.items():
            self.patterns[pattern_type] = FailurePattern(
                pattern_id=f"common_{pattern_type}",
                pattern_type=pattern_type,
                regex=regex,
                frequency=0,
                confidence=0.9
            )

    def match_pattern(self,
                    error_message: str,
                    context: Optional[Dict[str, Any]] = None) -> Optional[FailurePattern]:
        """Match error message against known patterns."""
        # Check cache first
        message_hash = hashlib.sha256(error_message.encode()).hexdigest()
        if message_hash in self.pattern_cache:
            pattern_id = self.pattern_cache[message_hash]
            return self.patterns.get(pattern_id)

        # Try to match against known patterns
        best_match = None
        best_score = 0.0

        for pattern in self.patterns.values():
            score = self._calculate_match_score(error_message, pattern)
            if score > best_score and score >= self.similarity_threshold:
                best_score = score
                best_match = pattern

        # Cache the result
        if best_match:
            self.pattern_cache[message_hash] = best_match.pattern_id
            # Update frequency
            best_match.frequency += 1
            # Add to examples if unique
            if error_message not in best_match.examples:
                best_match.examples.append(error_message[:200])  # Store first 200 chars
                if len(best_match.examples) > 10:
                    best_match.examples = best_match.examples[-10:]  # Keep last 10

        return best_match

    def _calculate_match_score(self,
                                message: str,
                                pattern: FailurePattern) -> float:
        """Calculate match score between message and pattern."""
        try:
            # Check regex match
            if re.search(pattern.regex, message, re.IGNORECASE):
                base_score = 0.8

                # Boost score based on pattern confidence
                score = base_score * pattern.confidence

                # Boost for exact matches in examples
                for example in pattern.examples:
                    if self._calculate_similarity(message, example) > 0.9:
                        score = min(1.0, score + 0.1)
                        break

                return score

            # Check fuzzy match against examples
            for example in pattern.examples:
                similarity = self._calculate_similarity(message, example)
                if similarity > self.similarity_threshold:
                    return similarity * 0.7  # Slightly lower score for fuzzy match

        except Exception as e:
            logger.warning(f"Error calculating match score: {e}")

        return 0.0

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings (simplified Jaccard)."""
        # Tokenize
        tokens1 = set(str1.lower().split())
        tokens2 = set(str2.lower().split())

        if not tokens1 or not tokens2:
            return 0.0

        # Jaccard similarity
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)

        return len(intersection) / len(union) if union else 0.0

    def add_pattern(self,
                    pattern_type: str,
                    regex: str,
                    confidence: float = 0.7) -> FailurePattern:
        """Add a new pattern to the matcher."""
        pattern_id = f"custom_{pattern_type}_{len(self.patterns)}"

        pattern = FailurePattern(
            pattern_id=pattern_id,
            pattern_type=pattern_type,
            regex=regex,
            frequency=0,
            confidence=confidence
        )

        self.patterns[pattern_id] = pattern
        return pattern

    def get_pattern_statistics(self) -> Dict[str, Any]:
        """Get statistics about pattern matching."""
        total_matches = sum(p.frequency for p in self.patterns.values())

        # Get top patterns by frequency
        top_patterns = sorted(
            self.patterns.values(),
            key=lambda p: p.frequency,
            reverse=True
        )[:10]

        return {
            "total_patterns": len(self.patterns),
            "total_matches": total_matches,
            "cache_size": len(self.pattern_cache),
            "top_patterns": [
                {
                    "type": p.pattern_type,
                    "frequency": p.frequency,
                    "confidence": p.confidence,
                    "examples": len(p.examples)
                }
                for p in top_patterns
            ]
        }

def evolve_patterns(self) -> List[FailurePattern]:
        """Evolve patterns based on frequency and confidence."""
        evolved = []

        for pattern in self.patterns.values():
            # Increase confidence for frequently matched patterns
            if pattern.frequency > 10:
                old_confidence = pattern.confidence
                pattern.confidence = min(1.0, pattern.confidence + 0.5)
                if pattern.confidence > old_confidence:
                    evolved.append(pattern)

            # Decrease confidence for rarely matched patterns
            elif pattern.frequency == 0 and len(self.pattern_cache) > 100:
                pattern.confidence = max(0.3, pattern.confidence - 0.1)

        return evolved

def export_patterns(self) -> List[Dict[str, Any]]:
        """Export patterns for persistence."""
        return [
            {
                "pattern_id": p.pattern_id,
                "pattern_type": p.pattern_type,
                "regex": p.regex,
                "frequency": p.frequency,
                "confidence": p.confidence,
                "examples": p.examples[:5]  # Limit examples for export
            }
            for p in self.patterns.values()
        ]

def import_patterns(self, patterns_data: List[Dict[str, Any]]) -> None:
        """Import patterns from persistent storage."""
        for data in patterns_data:
            pattern = FailurePattern(
                pattern_id=data["pattern_id"],
                pattern_type=data["pattern_type"],
                regex=data["regex"],
                frequency=data.get("frequency", 0),
                confidence=data.get("confidence", 0.7),
                examples=data.get("examples", [])
            )
            self.patterns[pattern.pattern_id] = pattern