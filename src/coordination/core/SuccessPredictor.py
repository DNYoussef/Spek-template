from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS

import json
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

@dataclass
class PredictionFeatures:
    """Features used for success prediction."""
    test_failure_count: int
    failure_pattern_count: int
    files_affected: int
    coupling_strength: float
    iteration_number: int
    time_elapsed: float
    previous_success_rate: float
    agent_expertise_score: float
    code_complexity: float
    test_coverage: float

@dataclass
class SuccessPrediction:
    """Prediction result for a fix or iteration."""
    probability: float  # 0.0 to 1.0
    confidence: float  # 0.0 to 1.0
    factors: Dict[str, float]
    recommendation: str
    estimated_iterations: int
    risk_level: str  # low, medium, high

class SuccessPredictor:
    """
    Predicts likelihood of success for fixes and iterations.

    Extracted from LoopOrchestrator god object (1, 323 LOC -> ~250 LOC component).
    Handles:
    - Success probability calculation
    - Risk assessment
    - Iteration estimation
    - Historical pattern learning
    - Recommendation generation
    """

def __init__(self,
                history_file: Optional[str] = None,
                learning_rate: float = 0.1):
        """Initialize the success predictor."""
        self.history_file = Path(history_file) if history_file else None
        self.learning_rate = learning_rate

        # Model parameters (simplified for demonstration)
        self.weights = {
            "test_failures": -0.2,
            "failure_patterns": -0.2,
            "files_affected": -0.15,
            "coupling_strength": -0.25,
            "iteration": -0.1,
            "time_elapsed": -0.5,
            "previous_success": 0.4,
            "agent_expertise": 0.3,
            "complexity": -0.2,
            "coverage": 0.25
        }

        # Historical data
        self.history: List[Dict[str, Any]] = []
        self._load_history()

        # Thresholds
        self.success_threshold = 0.7
        self.high_risk_threshold = 0.3

def _load_history(self) -> None:
        """Load historical prediction data."""
        if self.history_file and self.history_file.exists():
            try:
                with open(self.history_file, 'r') as f:
                    self.history = json.load(f)
                logger.info(f"Loaded {len(self.history)} historical records")
            except Exception as e:
                logger.error(f"Failed to load history: {e}")
                self.history = []

def _save_history(self) -> None:
        """Save historical prediction data."""
        if self.history_file:
            try:
                with open(self.history_file, 'w') as f:
                    json.dump(self.history, f, indent=2)
            except Exception as e:
                logger.error(f"Failed to save history: {e}")

def predict_fix_success(self,
                            features: PredictionFeatures,
                            context: Optional[Dict[str, Any]] = None) -> SuccessPrediction:
        """Predict the likelihood of a fix succeeding."""
        # Calculate base probability
        probability = self._calculate_probability(features)

        # Calculate confidence based on historical data
        confidence = self._calculate_confidence(features)

        # Determine factors
        factors = self._analyze_factors(features)

        # Estimate iterations needed
        estimated_iterations = self._estimate_iterations(features, probability)

        # Determine risk level
        risk_level = self._assess_risk(probability, confidence)

        # Generate recommendation
        recommendation = self._generate_recommendation(
            probability, confidence, risk_level, factors
        )

        # Create prediction
        prediction = SuccessPrediction(
            probability=probability,
            confidence=confidence,
            factors=factors,
            recommendation=recommendation,
            estimated_iterations=estimated_iterations,
            risk_level=risk_level
        )

        # Store in history
        self._record_prediction(features, prediction, context)

        return prediction

def _calculate_probability(self, features: PredictionFeatures) -> float:
        """Calculate success probability using weighted features."""
        # Normalize features
        normalized = {
            "test_failures": min(features.test_failure_count / 60.0, 1.0),
            "failure_patterns": min(features.failure_pattern_count / 10.0, 1.0),
            "files_affected": min(features.files_affected / 50.0, 1.0),
            "coupling_strength": features.coupling_strength,
            "iteration": min(features.iteration_number / 10.0, 1.0),
            "time_elapsed": min(features.time_elapsed / 3600.0, 1.0),  # hours
            "previous_success": features.previous_success_rate,
            "agent_expertise": features.agent_expertise_score,
            "complexity": min(features.code_complexity / 100.0, 1.0),
            "coverage": features.test_coverage
        }

        # Calculate weighted sum
        score = 0.5  # Base probability
        for feature, value in normalized.items():
            if feature in self.weights:
                score += self.weights[feature] * value

        # Sigmoid transformation to get probability
        probability = 1.0 / (1.0 + np.exp(-score))

        return min(max(probability, 0.0), 1.0)

def _calculate_confidence(self, features: PredictionFeatures) -> float:
        """Calculate confidence in the prediction."""
        # Base confidence on historical data similarity
        if not self.history:
            return 0.5  # Low confidence without history

        # Find similar historical cases
        similar_cases = self._find_similar_cases(features, top_k=10)

        if not similar_cases:
            return 0.5

        # Calculate confidence based on consistency of outcomes
        outcomes = [case["actual_success"] for case in similar_cases]
        if len(outcomes) > 0:
            # Higher confidence if outcomes are consistent
            success_rate = sum(outcomes) / len(outcomes)
            consistency = 1.0 - abs(success_rate - 0.5) * 2
            confidence = 1.0 - consistency * 0.3  # Max 30% reduction
        else:
            confidence = 0.5

        return confidence

def _find_similar_cases(self,
                            features: PredictionFeatures,
                            top_k: int = 10) -> List[Dict[str, Any]]:
        """Find similar historical cases."""
        if not self.history:
            return []

        # Calculate similarity for each historical case
        similarities = []
        for case in self.history:
            if "features" in case:
                similarity = self._calculate_similarity(features, case["features"])
                similarities.append((similarity, case))

        # Sort by similarity and return top k
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [case for _, case in similarities[:top_k]]

def _calculate_similarity(self,
                            features1: PredictionFeatures,
                            features2: Dict[str, Any]) -> float:
        """Calculate similarity between two feature sets."""
        # Simple Euclidean distance (normalized)
        distance = 0.0
        count = 0

        for attr in ["test_failure_count", "files_affected", "coupling_strength"]:
            if hasattr(features1, attr) and attr in features2:
                val1 = getattr(features1, attr)
                val2 = features2[attr]
                # Normalize and calculate distance
                distance += abs(val1 - val2) / max(val1, val2, 1)
                count += 1

        if count > 0:
            similarity = 1.0 - (distance / count)
        else:
            similarity = 0.0

        return similarity

def _analyze_factors(self, features: PredictionFeatures) -> Dict[str, float]:
        """Analyze contributing factors to success probability."""
        factors = {}

        # Test-related factors
        if features.test_failure_count > 20:
            factors["high_test_failures"] = -0.3
        elif features.test_failure_count < 5:
            factors["low_test_failures"] = 0.2

        # Coupling factors
        if features.coupling_strength > 0.7:
            factors["high_coupling"] = -0.25
        elif features.coupling_strength < 0.3:
            factors["low_coupling"] = 0.15

        # Coverage factors
        if features.test_coverage > 0.8:
            factors["high_coverage"] = 0.2
        elif features.test_coverage < 0.4:
            factors["low_coverage"] = -0.2

        # Iteration factors
        if features.iteration_number > 5:
            factors["many_iterations"] = -0.15

        # Agent expertise
        if features.agent_expertise_score > 0.8:
            factors["expert_agent"] = 0.25

        return factors

def _estimate_iterations(self,
                            features: PredictionFeatures,
                            probability: float) -> int:
        """Estimate number of iterations needed."""
        if probability > 0.8:
            return 1
        elif probability > 0.6:
            return 2
        elif probability > 0.4:
            return 3 + int(features.test_failure_count / MAXIMUM_FUNCTION_PARAMETERS)
        else:
            return MAXIMUM_NESTED_DEPTH + int(features.test_failure_count / 5)

def _assess_risk(self, probability: float, confidence: float) -> str:
        """Assess risk level based on probability and confidence."""
        risk_score = (1.0 - probability) * confidence

        if risk_score < 0.3:
            return "low"
        elif risk_score < 0.6:
            return "medium"
        else:
            return "high"

def _generate_recommendation(self,
                                probability: float,
                                confidence: float,
                                risk_level: str,
                                factors: Dict[str, float]) -> str:
        """Generate a recommendation based on prediction."""
        recommendations = []

        if probability > self.success_threshold:
            recommendations.append("Proceed with automatic fix")
        elif probability > 0.5:
            recommendations.append("Proceed with caution and monitoring")
        else:
            recommendations.append("Consider manual intervention")

        # Add factor-based recommendations
        if "high_test_failures" in factors:
            recommendations.append("Focus on reducing test failures first")
        if "high_coupling" in factors:
            recommendations.append("Consider refactoring to reduce coupling")
        if "low_coverage" in factors:
            recommendations.append("Improve test coverage before proceeding")

        if risk_level == "high":
            recommendations.append("High risk - ensure rollback capability")

        return "; ".join(recommendations)

def _record_prediction(self,
                        features: PredictionFeatures,
                        prediction: SuccessPrediction,
                        context: Optional[Dict[str, Any]]) -> None:
        """Record prediction for future learning."""
        record = {
            "timestamp": datetime.now().isoformat(),
            "features": features.__dict__,
            "prediction": {
                "probability": prediction.probability,
                "confidence": prediction.confidence,
                "risk_level": prediction.risk_level
            },
            "context": context or {}
        }

        self.history.append(record)

        # Keep history size manageable
        if len(self.history) > 1000:
            self.history = self.history[-1000:]

        self._save_history()

def update_with_outcome(self,
                            prediction_timestamp: str,
                            actual_success: bool,
                            iterations_used: int) -> None:
        """Update historical record with actual outcome."""
        for record in self.history:
            if record["timestamp"] == prediction_timestamp:
                record["actual_success"] = actual_success
                record["iterations_used"] = iterations_used

                # Update weights based on outcome (simple gradient update)
                self._update_weights(record, actual_success)
                break

        self._save_history()

def _update_weights(self, record: Dict[str, Any], actual_success: bool) -> None:
        """Update model weights based on prediction error."""
        predicted = record["prediction"]["probability"]
        actual = 1.0 if actual_success else 0.0
        error = actual - predicted

        # Simple weight update
        for feature in self.weights:
            if feature in record["features"]:
                feature_value = record["features"][feature]
                self.weights[feature] += self.learning_rate * error * feature_value

        logger.info(f"Updated weights based on prediction error: {error:.3f}")