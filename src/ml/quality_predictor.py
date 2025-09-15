"""
Quality Predictor ML Model for Enhanced Code Quality Validation

This module implements machine learning models to predict code quality issues,
detect anti-patterns, and perform anomaly detection for unusual code changes.
Integrates with existing validation systems for proactive quality assurance.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
import logging
from datetime import datetime, timedelta
import json
import joblib
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
from sklearn.feature_extraction.text import TfidfVectorizer
import xgboost as xgb
from scipy import stats

class QualityPredictor:
    """
    ML-based code quality predictor with pattern recognition and anomaly detection.

    Features:
    - Predicts quality issues before they occur (>85% accuracy target)
    - Recognizes common anti-patterns in code changes
    - Detects anomalous code changes requiring review
    - Time-series analysis for quality trend prediction
    """

    def __init__(self, model_dir: str = "models/quality", config_file: str = None):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.logger = self._setup_logging()

        # Model components
        self.quality_classifier = None
        self.pattern_detector = None
        self.anomaly_detector = None
        self.trend_analyzer = None

        # Feature processors
        self.scaler = StandardScaler()
        self.text_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.label_encoder = LabelEncoder()

        # Configuration
        self.config = self._load_config(config_file)
        self.feature_columns = []
        self.trained = False

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for quality prediction operations."""
        logger = logging.getLogger('quality_predictor')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """Load configuration for ML models."""
        default_config = {
            'quality_threshold': 0.8,
            'anomaly_threshold': -0.5,
            'pattern_confidence_threshold': 0.7,
            'trend_window_days': 30,
            'max_features': 50,
            'random_state': 42,
            'cv_folds': 5
        }

        if config_file and Path(config_file).exists():
            with open(config_file, 'r') as f:
                config = json.load(f)
                default_config.update(config)

        return default_config

    def extract_features(self, code_data: Dict[str, Any]) -> np.ndarray:
        """
        Extract comprehensive features from code changes for ML prediction.

        Args:
            code_data: Dictionary containing code metrics and change information

        Returns:
            Feature vector for ML models
        """
        features = []

        # Static code metrics
        metrics = code_data.get('metrics', {})
        features.extend([
            metrics.get('lines_of_code', 0),
            metrics.get('cyclomatic_complexity', 0),
            metrics.get('cognitive_complexity', 0),
            metrics.get('maintainability_index', 0),
            metrics.get('halstead_volume', 0),
            metrics.get('class_count', 0),
            metrics.get('method_count', 0),
            metrics.get('parameter_count', 0),
        ])

        # Change-based features
        changes = code_data.get('changes', {})
        features.extend([
            changes.get('lines_added', 0),
            changes.get('lines_deleted', 0),
            changes.get('files_changed', 0),
            changes.get('methods_added', 0),
            changes.get('methods_modified', 0),
            changes.get('classes_added', 0),
            changes.get('imports_added', 0),
        ])

        # Quality indicators
        quality = code_data.get('quality', {})
        features.extend([
            quality.get('test_coverage', 0),
            quality.get('documentation_ratio', 0),
            quality.get('code_duplication', 0),
            quality.get('security_issues', 0),
            quality.get('performance_issues', 0),
            quality.get('bug_density', 0),
        ])

        # Historical context
        history = code_data.get('history', {})
        features.extend([
            history.get('commit_frequency', 0),
            history.get('author_experience', 0),
            history.get('review_participation', 0),
            history.get('previous_issues', 0),
            history.get('time_since_last_change', 0),
        ])

        # Anti-pattern indicators
        patterns = code_data.get('patterns', {})
        features.extend([
            patterns.get('god_class_score', 0),
            patterns.get('long_method_score', 0),
            patterns.get('feature_envy_score', 0),
            patterns.get('data_clump_score', 0),
            patterns.get('code_smell_density', 0),
        ])

        return np.array(features, dtype=float)

    def extract_text_features(self, code_text: str) -> np.ndarray:
        """Extract text-based features from code content."""
        if not hasattr(self.text_vectorizer, 'vocabulary_'):
            # If not fitted, return zeros
            return np.zeros(1000)

        try:
            text_features = self.text_vectorizer.transform([code_text])
            return text_features.toarray()[0]
        except Exception as e:
            self.logger.warning(f"Text feature extraction failed: {e}")
            return np.zeros(1000)

    def detect_anti_patterns(self, features: np.ndarray, code_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Detect common anti-patterns in code using ML and rule-based approaches.

        Returns:
            Dictionary of pattern names and confidence scores
        """
        patterns = {}

        # God Class detection
        if len(features) > 5:  # Ensure we have enough features
            god_class_score = (
                features[5] * 0.3 +  # class_count weight
                features[6] * 0.4 +  # method_count weight
                features[0] * 0.3    # lines_of_code weight
            ) / 1000.0  # Normalize
            patterns['god_class'] = min(god_class_score, 1.0)

        # Long Method detection
        if len(features) > 6:
            long_method_score = (
                features[6] * 0.5 +  # method_count
                features[1] * 0.3 +  # cyclomatic_complexity
                features[2] * 0.2    # cognitive_complexity
            ) / 100.0
            patterns['long_method'] = min(long_method_score, 1.0)

        # Feature Envy detection (high coupling)
        coupling_data = code_data.get('coupling', {})
        patterns['feature_envy'] = min(coupling_data.get('external_calls', 0) / 50.0, 1.0)

        # Data Clump detection
        parameter_groups = code_data.get('parameter_groups', 0)
        patterns['data_clump'] = min(parameter_groups / 10.0, 1.0)

        # Dead Code detection
        usage_data = code_data.get('usage', {})
        patterns['dead_code'] = 1.0 - min(usage_data.get('call_frequency', 0) / 10.0, 1.0)

        return patterns

    def detect_anomalies(self, features: np.ndarray) -> Tuple[bool, float]:
        """
        Detect anomalous code changes using Isolation Forest.

        Returns:
            Tuple of (is_anomaly, anomaly_score)
        """
        if self.anomaly_detector is None:
            self.logger.warning("Anomaly detector not trained")
            return False, 0.0

        try:
            # Reshape for single prediction
            features_scaled = self.scaler.transform([features])
            anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
            is_anomaly = anomaly_score < self.config['anomaly_threshold']

            return is_anomaly, float(anomaly_score)
        except Exception as e:
            self.logger.error(f"Anomaly detection failed: {e}")
            return False, 0.0

    def analyze_quality_trends(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze quality trends over time using time-series analysis.

        Args:
            historical_data: List of historical quality measurements

        Returns:
            Trend analysis results including predictions
        """
        if len(historical_data) < 10:
            return {"trend": "insufficient_data", "prediction": None}

        # Extract time series data
        timestamps = []
        quality_scores = []

        for entry in historical_data:
            timestamps.append(entry.get('timestamp', datetime.now()))
            quality_scores.append(entry.get('quality_score', 0.5))

        # Convert to time series
        df = pd.DataFrame({
            'timestamp': pd.to_datetime(timestamps),
            'quality': quality_scores
        }).sort_values('timestamp')

        # Calculate trend metrics
        quality_values = df['quality'].values
        trend_slope, _, correlation, p_value, _ = stats.linregress(
            range(len(quality_values)), quality_values
        )

        # Detect trend direction
        if p_value < 0.05:  # Significant trend
            if trend_slope > 0:
                trend_direction = "improving"
            else:
                trend_direction = "declining"
        else:
            trend_direction = "stable"

        # Simple future prediction (linear extrapolation)
        future_steps = 7  # Predict 7 periods ahead
        future_quality = quality_values[-1] + (trend_slope * future_steps)
        future_quality = max(0.0, min(1.0, future_quality))  # Clamp to [0,1]

        # Calculate volatility
        volatility = np.std(quality_values[-10:]) if len(quality_values) >= 10 else 0

        return {
            "trend": trend_direction,
            "slope": float(trend_slope),
            "correlation": float(correlation),
            "p_value": float(p_value),
            "current_quality": float(quality_values[-1]),
            "predicted_quality": float(future_quality),
            "volatility": float(volatility),
            "confidence": float(1.0 - p_value) if p_value < 0.05 else 0.5
        }

    def train(self, training_data: List[Dict[str, Any]], labels: List[int]) -> Dict[str, float]:
        """
        Train all ML models with provided data.

        Args:
            training_data: List of code change data dictionaries
            labels: Binary labels (1 = high quality, 0 = low quality)

        Returns:
            Training metrics including accuracy scores
        """
        self.logger.info(f"Training quality predictor with {len(training_data)} samples")

        # Extract features
        X = []
        text_data = []

        for data in training_data:
            features = self.extract_features(data)
            X.append(features)
            text_data.append(data.get('code_text', ''))

        X = np.array(X)
        y = np.array(labels)

        # Handle variable feature sizes
        if len(X) > 0:
            feature_size = X.shape[1]
            self.feature_columns = [f'feature_{i}' for i in range(feature_size)]

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=self.config['random_state']
        )

        # Train text vectorizer
        if text_data:
            self.text_vectorizer.fit(text_data)

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train quality classifier
        self.quality_classifier = xgb.XGBClassifier(
            random_state=self.config['random_state'],
            eval_metric='logloss'
        )
        self.quality_classifier.fit(X_train_scaled, y_train)

        # Train anomaly detector
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=self.config['random_state']
        )
        self.anomaly_detector.fit(X_train_scaled)

        # Evaluate models
        y_pred = self.quality_classifier.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)

        # Cross-validation
        cv_scores = cross_val_score(
            self.quality_classifier, X_train_scaled, y_train,
            cv=self.config['cv_folds']
        )

        self.trained = True

        metrics = {
            'accuracy': float(accuracy),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }

        self.logger.info(f"Training completed. Accuracy: {accuracy:.3f}")
        return metrics

    def predict_quality(self, code_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict code quality for given code changes.

        Returns:
            Comprehensive prediction results
        """
        if not self.trained:
            raise ValueError("Model must be trained before prediction")

        # Extract features
        features = self.extract_features(code_data)

        # Scale features
        features_scaled = self.scaler.transform([features])

        # Quality prediction
        quality_prob = self.quality_classifier.predict_proba(features_scaled)[0]
        quality_prediction = self.quality_classifier.predict(features_scaled)[0]

        # Anti-pattern detection
        patterns = self.detect_anti_patterns(features, code_data)

        # Anomaly detection
        is_anomaly, anomaly_score = self.detect_anomalies(features)

        # Feature importance
        feature_importance = dict(zip(
            self.feature_columns,
            self.quality_classifier.feature_importances_
        )) if hasattr(self.quality_classifier, 'feature_importances_') else {}

        return {
            'quality_prediction': int(quality_prediction),
            'quality_probability': {
                'low_quality': float(quality_prob[0]),
                'high_quality': float(quality_prob[1])
            },
            'confidence': float(max(quality_prob)),
            'anti_patterns': patterns,
            'is_anomaly': is_anomaly,
            'anomaly_score': anomaly_score,
            'feature_importance': feature_importance,
            'recommendation': self._generate_recommendation(
                quality_prediction, patterns, is_anomaly
            )
        }

    def _generate_recommendation(self, quality_pred: int, patterns: Dict[str, float],
                               is_anomaly: bool) -> str:
        """Generate actionable recommendations based on predictions."""
        recommendations = []

        if quality_pred == 0:
            recommendations.append("Code quality concerns detected - thorough review recommended")

        if is_anomaly:
            recommendations.append("Unusual code patterns detected - additional scrutiny needed")

        # Pattern-specific recommendations
        for pattern, score in patterns.items():
            if score > self.config['pattern_confidence_threshold']:
                if pattern == 'god_class':
                    recommendations.append("Consider breaking down large classes into smaller components")
                elif pattern == 'long_method':
                    recommendations.append("Split complex methods into smaller, focused functions")
                elif pattern == 'feature_envy':
                    recommendations.append("Review method placement and reduce external dependencies")
                elif pattern == 'data_clump':
                    recommendations.append("Consider creating dedicated data structures")
                elif pattern == 'dead_code':
                    recommendations.append("Remove unused code to improve maintainability")

        if not recommendations:
            recommendations.append("Code quality appears acceptable - standard review process")

        return "; ".join(recommendations)

    def save_models(self, model_path: str = None) -> None:
        """Save trained models to disk."""
        if not self.trained:
            raise ValueError("No trained models to save")

        save_path = Path(model_path) if model_path else self.model_dir
        save_path.mkdir(parents=True, exist_ok=True)

        # Save models
        joblib.dump(self.quality_classifier, save_path / 'quality_classifier.pkl')
        joblib.dump(self.anomaly_detector, save_path / 'anomaly_detector.pkl')
        joblib.dump(self.scaler, save_path / 'scaler.pkl')
        joblib.dump(self.text_vectorizer, save_path / 'text_vectorizer.pkl')

        # Save metadata
        metadata = {
            'trained': self.trained,
            'feature_columns': self.feature_columns,
            'config': self.config,
            'timestamp': datetime.now().isoformat()
        }

        with open(save_path / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)

        self.logger.info(f"Models saved to {save_path}")

    def load_models(self, model_path: str = None) -> None:
        """Load trained models from disk."""
        load_path = Path(model_path) if model_path else self.model_dir

        if not load_path.exists():
            raise FileNotFoundError(f"Model path {load_path} does not exist")

        # Load models
        self.quality_classifier = joblib.load(load_path / 'quality_classifier.pkl')
        self.anomaly_detector = joblib.load(load_path / 'anomaly_detector.pkl')
        self.scaler = joblib.load(load_path / 'scaler.pkl')
        self.text_vectorizer = joblib.load(load_path / 'text_vectorizer.pkl')

        # Load metadata
        with open(load_path / 'metadata.json', 'r') as f:
            metadata = json.load(f)
            self.trained = metadata['trained']
            self.feature_columns = metadata['feature_columns']

        self.logger.info(f"Models loaded from {load_path}")

# Example usage and integration
if __name__ == "__main__":
    # Initialize predictor
    predictor = QualityPredictor()

    # Example training data structure
    sample_training_data = [
        {
            'metrics': {'lines_of_code': 150, 'cyclomatic_complexity': 5, 'cognitive_complexity': 8},
            'changes': {'lines_added': 20, 'files_changed': 2},
            'quality': {'test_coverage': 0.85, 'documentation_ratio': 0.7},
            'history': {'commit_frequency': 5, 'author_experience': 0.8},
            'patterns': {'god_class_score': 0.2, 'long_method_score': 0.3},
            'code_text': 'def example_function(): pass'
        }
    ]
    sample_labels = [1]  # High quality

    # Train models
    metrics = predictor.train(sample_training_data, sample_labels)
    print(f"Training metrics: {metrics}")

    # Make prediction
    sample_code = sample_training_data[0]
    prediction = predictor.predict_quality(sample_code)
    print(f"Quality prediction: {prediction}")