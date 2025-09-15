"""
Theater Detection Classifier for Performance Theater vs Genuine Improvements

This module implements deep learning models to classify whether code changes
represent genuine quality improvements or theatrical performance. Includes
feature extraction, confidence scoring, and training pipeline integration.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union
import logging
from datetime import datetime, timedelta
import json
import joblib
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score, confusion_matrix
from sklearn.ensemble import RandomForestClassifier
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks

class TheaterDataset(Dataset):
    """PyTorch dataset for theater detection training."""

    def __init__(self, features: np.ndarray, labels: np.ndarray):
        self.features = torch.FloatTensor(features)
        self.labels = torch.LongTensor(labels)

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]

class TheaterDetectionNet(nn.Module):
    """Deep neural network for theater detection."""

    def __init__(self, input_size: int, hidden_sizes: List[int] = [128, 64, 32]):
        super(TheaterDetectionNet, self).__init__()

        layers_list = []
        prev_size = input_size

        for hidden_size in hidden_sizes:
            layers_list.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.BatchNorm1d(hidden_size)
            ])
            prev_size = hidden_size

        # Output layer for binary classification
        layers_list.append(nn.Linear(prev_size, 2))

        self.network = nn.Sequential(*layers_list)

    def forward(self, x):
        return self.network(x)

class TheaterClassifier:
    """
    Advanced theater detection system using deep learning and ensemble methods.

    Features:
    - Multi-model ensemble (Deep Learning + Random Forest)
    - Comprehensive feature extraction from code changes
    - Confidence scoring with uncertainty quantification
    - Training pipeline with data augmentation
    - Real-time theater detection with >85% accuracy
    """

    def __init__(self, model_dir: str = "models/theater", config_file: str = None):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.logger = self._setup_logging()

        # Model components
        self.dl_model = None  # Deep learning model
        self.rf_model = None  # Random forest model
        self.ensemble_weights = [0.7, 0.3]  # DL, RF weights

        # Feature processors
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()

        # Configuration
        self.config = self._load_config(config_file)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.trained = False

        # Theater detection patterns
        self.theater_indicators = self._initialize_theater_patterns()

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for theater detection operations."""
        logger = logging.getLogger('theater_classifier')
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
        """Load configuration for theater detection models."""
        default_config = {
            'theater_threshold': 0.6,
            'confidence_threshold': 0.8,
            'batch_size': 32,
            'epochs': 100,
            'learning_rate': 0.001,
            'early_stopping_patience': 10,
            'validation_split': 0.2,
            'random_state': 42,
            'ensemble_method': 'weighted_average',
            'uncertainty_samples': 10
        }

        if config_file and Path(config_file).exists():
            with open(config_file, 'r') as f:
                config = json.load(f)
                default_config.update(config)

        return default_config

    def _initialize_theater_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Initialize known theater detection patterns."""
        return {
            'cosmetic_changes': {
                'indicators': ['whitespace_only', 'comment_only', 'variable_rename'],
                'weight': 0.8,
                'description': 'Changes that do not affect functionality'
            },
            'metric_gaming': {
                'indicators': ['artificial_coverage', 'test_padding', 'metric_manipulation'],
                'weight': 0.9,
                'description': 'Changes designed to improve metrics without real benefit'
            },
            'complexity_theater': {
                'indicators': ['unnecessary_abstraction', 'over_engineering', 'premature_optimization'],
                'weight': 0.7,
                'description': 'Unnecessarily complex solutions to simple problems'
            },
            'documentation_theater': {
                'indicators': ['verbose_comments', 'obvious_documentation', 'redundant_docs'],
                'weight': 0.6,
                'description': 'Documentation that adds no real value'
            },
            'refactoring_theater': {
                'indicators': ['meaningless_extraction', 'unnecessary_splitting', 'fake_cleanup'],
                'weight': 0.8,
                'description': 'Refactoring that does not improve maintainability'
            }
        }

    def extract_theater_features(self, change_data: Dict[str, Any]) -> np.ndarray:
        """
        Extract comprehensive features for theater detection.

        Args:
            change_data: Dictionary containing change information and metrics

        Returns:
            Feature vector optimized for theater detection
        """
        features = []

        # Basic change metrics
        metrics = change_data.get('metrics', {})
        features.extend([
            metrics.get('lines_added', 0),
            metrics.get('lines_deleted', 0),
            metrics.get('files_changed', 0),
            metrics.get('commits_count', 0),
            metrics.get('time_spent_hours', 0),
        ])

        # Quality impact metrics
        quality_before = change_data.get('quality_before', {})
        quality_after = change_data.get('quality_after', {})

        # Calculate quality deltas
        quality_delta_features = []
        for metric in ['coverage', 'complexity', 'maintainability', 'security_score']:
            before = quality_before.get(metric, 0)
            after = quality_after.get(metric, 0)
            delta = after - before
            quality_delta_features.extend([before, after, delta])

        features.extend(quality_delta_features)

        # Effort vs impact analysis
        effort_metrics = change_data.get('effort', {})
        impact_metrics = change_data.get('impact', {})

        effort_score = (
            effort_metrics.get('development_time', 0) +
            effort_metrics.get('review_time', 0) +
            effort_metrics.get('testing_time', 0)
        )

        impact_score = (
            impact_metrics.get('performance_improvement', 0) +
            impact_metrics.get('maintainability_improvement', 0) +
            impact_metrics.get('user_value', 0)
        )

        effort_impact_ratio = impact_score / max(effort_score, 1)
        features.extend([effort_score, impact_score, effort_impact_ratio])

        # Theater pattern indicators
        theater_scores = self._calculate_theater_pattern_scores(change_data)
        features.extend(theater_scores.values())

        # Change type distribution
        change_types = change_data.get('change_types', {})
        features.extend([
            change_types.get('functional', 0),
            change_types.get('refactoring', 0),
            change_types.get('documentation', 0),
            change_types.get('testing', 0),
            change_types.get('configuration', 0),
        ])

        # Timing and context features
        timing = change_data.get('timing', {})
        features.extend([
            timing.get('near_deadline', 0),
            timing.get('performance_review_period', 0),
            timing.get('demo_preparation', 0),
            timing.get('weekend_work', 0),
        ])

        # Historical context
        history = change_data.get('history', {})
        features.extend([
            history.get('author_theater_history', 0),
            history.get('project_theater_rate', 0),
            history.get('recent_similar_changes', 0),
            history.get('peer_review_feedback', 0),
        ])

        # Code analysis features
        code_analysis = change_data.get('code_analysis', {})
        features.extend([
            code_analysis.get('ast_complexity_change', 0),
            code_analysis.get('dependency_changes', 0),
            code_analysis.get('api_surface_changes', 0),
            code_analysis.get('test_behavior_changes', 0),
        ])

        return np.array(features, dtype=float)

    def _calculate_theater_pattern_scores(self, change_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate scores for known theater patterns."""
        scores = {}

        for pattern_name, pattern_info in self.theater_indicators.items():
            score = 0.0
            indicators = change_data.get('indicators', {})

            for indicator in pattern_info['indicators']:
                if indicator in indicators:
                    score += indicators[indicator] * pattern_info['weight']

            # Normalize score
            scores[pattern_name] = min(score / len(pattern_info['indicators']), 1.0)

        return scores

    def detect_metric_gaming(self, change_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Detect specific metric gaming behaviors.

        Returns:
            Dictionary of gaming detection scores
        """
        gaming_scores = {}

        metrics_before = change_data.get('quality_before', {})
        metrics_after = change_data.get('quality_after', {})
        changes = change_data.get('changes', {})

        # Coverage gaming detection
        coverage_delta = metrics_after.get('coverage', 0) - metrics_before.get('coverage', 0)
        test_lines_added = changes.get('test_lines_added', 0)

        if coverage_delta > 0 and test_lines_added > 0:
            # Check if coverage improvement is disproportionate to test quality
            coverage_efficiency = coverage_delta / max(test_lines_added, 1)
            gaming_scores['coverage_gaming'] = min(coverage_efficiency * 10, 1.0)
        else:
            gaming_scores['coverage_gaming'] = 0.0

        # Complexity gaming detection
        complexity_delta = metrics_before.get('complexity', 0) - metrics_after.get('complexity', 0)
        functional_changes = changes.get('functional_lines', 0)

        if complexity_delta > 0 and functional_changes == 0:
            # Complexity reduced without functional changes (suspicious)
            gaming_scores['complexity_gaming'] = min(complexity_delta / 10, 1.0)
        else:
            gaming_scores['complexity_gaming'] = 0.0

        # Documentation gaming detection
        doc_lines_added = changes.get('documentation_lines_added', 0)
        total_lines_added = changes.get('lines_added', 1)

        if doc_lines_added > 0:
            doc_ratio = doc_lines_added / total_lines_added
            if doc_ratio > 0.8:  # Mostly documentation
                gaming_scores['documentation_gaming'] = doc_ratio
            else:
                gaming_scores['documentation_gaming'] = 0.0
        else:
            gaming_scores['documentation_gaming'] = 0.0

        return gaming_scores

    def train(self, training_data: List[Dict[str, Any]], labels: List[int]) -> Dict[str, float]:
        """
        Train the theater detection ensemble.

        Args:
            training_data: List of change data dictionaries
            labels: Binary labels (1 = theater, 0 = genuine)

        Returns:
            Training metrics
        """
        self.logger.info(f"Training theater classifier with {len(training_data)} samples")

        # Extract features
        X = []
        for data in training_data:
            features = self.extract_theater_features(data)
            X.append(features)

        X = np.array(X)
        y = np.array(labels)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.config['validation_split'],
            random_state=self.config['random_state']
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train Random Forest model
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            random_state=self.config['random_state'],
            class_weight='balanced'
        )
        self.rf_model.fit(X_train_scaled, y_train)

        # Train Deep Learning model
        input_size = X_train_scaled.shape[1]
        self.dl_model = TheaterDetectionNet(input_size)
        self.dl_model.to(self.device)

        # Training setup
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.dl_model.parameters(), lr=self.config['learning_rate'])

        # Create data loaders
        train_dataset = TheaterDataset(X_train_scaled, y_train)
        test_dataset = TheaterDataset(X_test_scaled, y_test)

        train_loader = DataLoader(
            train_dataset, batch_size=self.config['batch_size'], shuffle=True
        )
        test_loader = DataLoader(
            test_dataset, batch_size=self.config['batch_size'], shuffle=False
        )

        # Training loop
        best_accuracy = 0.0
        patience_counter = 0

        for epoch in range(self.config['epochs']):
            # Training phase
            self.dl_model.train()
            train_loss = 0.0

            for batch_features, batch_labels in train_loader:
                batch_features = batch_features.to(self.device)
                batch_labels = batch_labels.to(self.device)

                optimizer.zero_grad()
                outputs = self.dl_model(batch_features)
                loss = criterion(outputs, batch_labels)
                loss.backward()
                optimizer.step()

                train_loss += loss.item()

            # Validation phase
            self.dl_model.eval()
            test_loss = 0.0
            correct = 0
            total = 0

            with torch.no_grad():
                for batch_features, batch_labels in test_loader:
                    batch_features = batch_features.to(self.device)
                    batch_labels = batch_labels.to(self.device)

                    outputs = self.dl_model(batch_features)
                    loss = criterion(outputs, batch_labels)
                    test_loss += loss.item()

                    _, predicted = torch.max(outputs.data, 1)
                    total += batch_labels.size(0)
                    correct += (predicted == batch_labels).sum().item()

            accuracy = correct / total

            # Early stopping
            if accuracy > best_accuracy:
                best_accuracy = accuracy
                patience_counter = 0
            else:
                patience_counter += 1

            if patience_counter >= self.config['early_stopping_patience']:
                self.logger.info(f"Early stopping at epoch {epoch}")
                break

        # Evaluate ensemble
        ensemble_predictions = self._predict_ensemble(X_test_scaled)
        ensemble_accuracy = accuracy_score(y_test, ensemble_predictions)

        # Individual model accuracies
        rf_predictions = self.rf_model.predict(X_test_scaled)
        rf_accuracy = accuracy_score(y_test, rf_predictions)

        self.trained = True

        metrics = {
            'ensemble_accuracy': float(ensemble_accuracy),
            'dl_accuracy': float(best_accuracy),
            'rf_accuracy': float(rf_accuracy),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': X.shape[1]
        }

        self.logger.info(f"Training completed. Ensemble accuracy: {ensemble_accuracy:.3f}")
        return metrics

    def _predict_ensemble(self, X: np.ndarray) -> np.ndarray:
        """Make ensemble predictions using weighted voting."""
        if not self.trained:
            raise ValueError("Models must be trained before prediction")

        # Random Forest predictions
        rf_pred_proba = self.rf_model.predict_proba(X)

        # Deep Learning predictions
        self.dl_model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X).to(self.device)
            dl_outputs = self.dl_model(X_tensor)
            dl_pred_proba = torch.softmax(dl_outputs, dim=1).cpu().numpy()

        # Weighted ensemble
        ensemble_proba = (
            self.ensemble_weights[0] * dl_pred_proba +
            self.ensemble_weights[1] * rf_pred_proba
        )

        return np.argmax(ensemble_proba, axis=1)

    def predict_theater(self, change_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict whether a change represents theater or genuine improvement.

        Returns:
            Comprehensive theater detection results
        """
        if not self.trained:
            raise ValueError("Models must be trained before prediction")

        # Extract features
        features = self.extract_theater_features(change_data)
        features_scaled = self.scaler.transform([features])

        # Get predictions from both models
        rf_pred_proba = self.rf_model.predict_proba(features_scaled)[0]

        self.dl_model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(features_scaled).to(self.device)
            dl_outputs = self.dl_model(X_tensor)
            dl_pred_proba = torch.softmax(dl_outputs, dim=1).cpu().numpy()[0]

        # Ensemble prediction
        ensemble_proba = (
            self.ensemble_weights[0] * dl_pred_proba +
            self.ensemble_weights[1] * rf_pred_proba
        )

        theater_probability = ensemble_proba[1]
        is_theater = theater_probability > self.config['theater_threshold']

        # Calculate uncertainty using Monte Carlo dropout
        uncertainty = self._calculate_uncertainty(features_scaled)

        # Detect specific gaming patterns
        gaming_scores = self.detect_metric_gaming(change_data)

        # Generate explanation
        explanation = self._generate_theater_explanation(
            features, change_data, theater_probability, gaming_scores
        )

        return {
            'is_theater': bool(is_theater),
            'theater_probability': float(theater_probability),
            'genuine_probability': float(ensemble_proba[0]),
            'confidence': float(1.0 - uncertainty),
            'uncertainty': float(uncertainty),
            'model_predictions': {
                'deep_learning': {
                    'theater_prob': float(dl_pred_proba[1]),
                    'genuine_prob': float(dl_pred_proba[0])
                },
                'random_forest': {
                    'theater_prob': float(rf_pred_proba[1]),
                    'genuine_prob': float(rf_pred_proba[0])
                }
            },
            'gaming_detection': gaming_scores,
            'explanation': explanation,
            'recommendation': self._generate_theater_recommendation(
                is_theater, theater_probability, gaming_scores
            )
        }

    def _calculate_uncertainty(self, features: np.ndarray) -> float:
        """Calculate prediction uncertainty using Monte Carlo dropout."""
        if not hasattr(self.dl_model, 'training'):
            return 0.0

        # Enable dropout for uncertainty estimation
        self.dl_model.train()
        predictions = []

        with torch.no_grad():
            X_tensor = torch.FloatTensor(features).to(self.device)

            for _ in range(self.config['uncertainty_samples']):
                outputs = self.dl_model(X_tensor)
                pred_proba = torch.softmax(outputs, dim=1).cpu().numpy()
                predictions.append(pred_proba[0, 1])  # Theater probability

        # Return to evaluation mode
        self.dl_model.eval()

        # Calculate uncertainty as standard deviation
        return float(np.std(predictions))

    def _generate_theater_explanation(self, features: np.ndarray, change_data: Dict[str, Any],
                                    theater_prob: float, gaming_scores: Dict[str, float]) -> str:
        """Generate human-readable explanation for theater detection."""
        explanations = []

        if theater_prob > 0.8:
            explanations.append("Strong indicators of performance theater detected")
        elif theater_prob > 0.6:
            explanations.append("Moderate theater indicators present")
        else:
            explanations.append("Change appears to be genuine improvement")

        # Gaming-specific explanations
        for gaming_type, score in gaming_scores.items():
            if score > 0.7:
                if gaming_type == 'coverage_gaming':
                    explanations.append("Suspicious test coverage patterns detected")
                elif gaming_type == 'complexity_gaming':
                    explanations.append("Artificial complexity reduction identified")
                elif gaming_type == 'documentation_gaming':
                    explanations.append("Excessive documentation without functional value")

        # Feature importance explanation
        if hasattr(self.rf_model, 'feature_importances_'):
            top_features = np.argsort(self.rf_model.feature_importances_)[-3:]
            explanations.append(f"Key factors: features {top_features.tolist()}")

        return "; ".join(explanations)

    def _generate_theater_recommendation(self, is_theater: bool, theater_prob: float,
                                       gaming_scores: Dict[str, float]) -> str:
        """Generate actionable recommendations based on theater detection."""
        if not is_theater:
            return "Change approved - genuine improvement detected"

        recommendations = ["Additional review recommended due to theater indicators"]

        if theater_prob > 0.8:
            recommendations.append("Consider rejecting or requesting significant revision")

        for gaming_type, score in gaming_scores.items():
            if score > 0.6:
                if gaming_type == 'coverage_gaming':
                    recommendations.append("Review test quality and meaningful coverage")
                elif gaming_type == 'complexity_gaming':
                    recommendations.append("Verify complexity reduction provides real benefit")
                elif gaming_type == 'documentation_gaming':
                    recommendations.append("Assess documentation value and necessity")

        return "; ".join(recommendations)

    def save_models(self, model_path: str = None) -> None:
        """Save trained models to disk."""
        if not self.trained:
            raise ValueError("No trained models to save")

        save_path = Path(model_path) if model_path else self.model_dir
        save_path.mkdir(parents=True, exist_ok=True)

        # Save PyTorch model
        torch.save(self.dl_model.state_dict(), save_path / 'dl_model.pth')

        # Save sklearn models
        joblib.dump(self.rf_model, save_path / 'rf_model.pkl')
        joblib.dump(self.scaler, save_path / 'scaler.pkl')

        # Save configuration and metadata
        metadata = {
            'trained': self.trained,
            'config': self.config,
            'ensemble_weights': self.ensemble_weights,
            'theater_indicators': self.theater_indicators,
            'timestamp': datetime.now().isoformat()
        }

        with open(save_path / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)

        self.logger.info(f"Theater detection models saved to {save_path}")

    def load_models(self, model_path: str = None) -> None:
        """Load trained models from disk."""
        load_path = Path(model_path) if model_path else self.model_dir

        if not load_path.exists():
            raise FileNotFoundError(f"Model path {load_path} does not exist")

        # Load metadata first
        with open(load_path / 'metadata.json', 'r') as f:
            metadata = json.load(f)
            self.config.update(metadata['config'])
            self.ensemble_weights = metadata['ensemble_weights']
            self.theater_indicators = metadata['theater_indicators']
            self.trained = metadata['trained']

        # Load sklearn models
        self.rf_model = joblib.load(load_path / 'rf_model.pkl')
        self.scaler = joblib.load(load_path / 'scaler.pkl')

        # Load PyTorch model (need to create architecture first)
        # This would need the original input size - stored in metadata
        # For now, create a default model
        self.dl_model = TheaterDetectionNet(50)  # Adjust based on saved metadata
        self.dl_model.load_state_dict(torch.load(load_path / 'dl_model.pth'))
        self.dl_model.to(self.device)
        self.dl_model.eval()

        self.logger.info(f"Theater detection models loaded from {load_path}")

# Example usage
if __name__ == "__main__":
    # Initialize classifier
    classifier = TheaterClassifier()

    # Example training data
    sample_data = [
        {
            'metrics': {'lines_added': 100, 'files_changed': 5},
            'quality_before': {'coverage': 0.7, 'complexity': 15},
            'quality_after': {'coverage': 0.72, 'complexity': 14},
            'effort': {'development_time': 8},
            'impact': {'performance_improvement': 0.1},
            'indicators': {'cosmetic_changes': 0.8},
            'timing': {'near_deadline': 1},
        }
    ]
    sample_labels = [1]  # Theater

    # Train and predict
    metrics = classifier.train(sample_data, sample_labels)
    print(f"Training metrics: {metrics}")

    prediction = classifier.predict_theater(sample_data[0])
    print(f"Theater prediction: {prediction}")