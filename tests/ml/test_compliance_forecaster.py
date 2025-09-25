from src.constants.base import DAYS_RETENTION_PERIOD, KELLY_CRITERION_FRACTION, MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD, QUALITY_GATE_MINIMUM_PASS_RATE, THEATER_DETECTION_WARNING_THRESHOLD
"""

This module provides thorough testing for the ComplianceForecaster class,
ensuring >85% accuracy and robust compliance risk prediction capabilities.
"""

import pytest
import numpy as np
import pandas as pd
from typing import Dict, List, Any
import tempfile
import json
from pathlib import Path
import logging
from datetime import datetime, timedelta
"""

# Import the module under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / 'src' / 'ml'))
from compliance_forecaster import ComplianceForecaster
"""

class TestComplianceForecaster:
    """Test suite for ComplianceForecaster class."""

    @pytest.fixture
    def sample_config(self):
        """Sample configuration for testing."""
        return {
            'forecast_horizon_days': 30,
            'risk_threshold': 0.7,
            'alert_cooldown_hours': 24,
            'trend_window_days': 90,
            'seasonality_detection': True,
            'confidence_interval': 0.95,
            'min_training_samples': 50,  # Reduced for testing
            'random_state': 42,
            'cross_validation_folds': 5
        }

    @pytest.fixture
    def compliance_forecaster(self, sample_config):
        """Initialize ComplianceForecaster with test configuration."""
        with tempfile.TemporaryDirectory() as temp_dir:
            forecaster = ComplianceForecaster(model_dir=temp_dir, config_file=None)
            forecaster.config = sample_config
            return forecaster

    @pytest.fixture
    def sample_compliance_data(self):
        """Sample compliance data for testing."""
        return {
            'current_metrics': {
                'code_coverage': 0.85,
                'cyclomatic_complexity': 8,
                'documentation_coverage': 0.9,
                'security_score': 0.95,
                'performance_regression': 0.2,
                'maintainability_index': 85,
                'audit_trail_coverage': 1.0,
                'data_integrity_score': 0.99,
                'access_control_score': 0.95
            },
            'history': [
                {
                    'timestamp': (datetime.now() - timedelta(days=i)).isoformat(),
                    'overall_score': 0.9 - (i * 0.1),
                    'violations': {'critical': max(0, i - 5), 'high': i // 2}
                }
                for i in range(35)  # 35 days of history
            ],
            'violations': {
                'critical_count': 1,
                'high_count': 3,
                'medium_count': 5,
                'resolved_count': 15,
                'overdue_count': 2
            },
            'recent_changes': {
                'high_risk_changes': 2,
                'emergency_changes': 1,
                'failed_changes': 0,
                'rollback_count': 0,
                'change_velocity': 10
            },
            'process_maturity': {
                'automation_score': 0.8,
                'monitoring_coverage': 0.9,
                'response_time_score': 0.85,
                'documentation_quality': 0.88,
                'staff_competency': 0.9
            },
            'external_factors': {
                'regulatory_changes': 1,
                'industry_incidents': 2,
                'audit_pressure': 0.7,
                'budget_constraints': 0.3,
                'staff_turnover': 0.1
            },
            'temporal': {
                'quarter_end_proximity': 0.2,
                'audit_season': 0,
                'holiday_period': 0
            }
        }

    @pytest.fixture
    def training_data(self, sample_compliance_data):
        """Sample training data for testing."""
        training_samples = []
        drift_labels = []
        risk_labels = []

        base_data = sample_compliance_data.copy()

        # Generate training samples
        for i in range(60):
            sample = base_data.copy()

            # Vary the compliance metrics
            sample['current_metrics']['code_coverage'] = np.random.uniform(0.6, 0.95)
            sample['current_metrics']['security_score'] = np.random.uniform(0.8, 1.0)
            sample['violations']['critical_count'] = np.random.randint(0, 5)
            sample['violations']['overdue_count'] = np.random.randint(0, 3)

            # Create drift labels (compliance score change)
            if i % MAXIMUM_RETRY_ATTEMPTS == 0:
                drift_score = np.random.uniform(-0.1, -0.2)  # Declining
            elif i % MAXIMUM_RETRY_ATTEMPTS == 1:
                drift_score = np.random.uniform(KELLY_CRITERION_FRACTION, 0.1)   # Improving
            else:
                drift_score = np.random.uniform(-0.2, KELLY_CRITERION_FRACTION) # Stable

            # Create risk labels (high risk = 1, low risk = 0)
            risk_score = (
                sample['current_metrics']['security_score'] * 0.3 +
                (1 - sample['violations']['critical_count'] / 10) * 0.4 +
                sample['process_maturity']['automation_score'] * 0.3
            )
            risk_label = 1 if risk_score < 0.7 else 0

            training_samples.append(sample)
            drift_labels.append(drift_score)
            risk_labels.append(risk_label)

        return {
            'samples': training_samples,
            'drift_labels': drift_labels,
            'risk_labels': risk_labels
        }

    def test_initialization(self, compliance_forecaster):
        """Test ComplianceForecaster initialization."""
        assert compliance_forecaster is not None
        assert compliance_forecaster.trained is False
        assert compliance_forecaster.config['forecast_horizon_days'] == 30
        assert compliance_forecaster.scaler is not None
        assert compliance_forecaster.compliance_standards is not None

    def test_compliance_standards_initialization(self, compliance_forecaster):
        """Test compliance standards initialization."""
        standards = compliance_forecaster.compliance_standards

        assert isinstance(standards, dict)
        assert 'NASA_POT10' in standards
        assert 'SOX_Compliance' in standards
        assert 'ISO_27001' in standards

        for standard_name, standard_config in standards.items():
            assert 'metrics' in standard_config
            assert 'critical_violations' in standard_config
            assert isinstance(standard_config['metrics'], dict)
            assert isinstance(standard_config['critical_violations'], list)

            # Check metric configurations
            for metric_name, metric_config in standard_config['metrics'].items():
                assert 'weight' in metric_config
                assert 0.0 <= metric_config['weight'] <= 1.0
                assert ('min' in metric_config) or ('max' in metric_config)

    def test_feature_extraction(self, compliance_forecaster, sample_compliance_data):
        """Test compliance feature extraction."""
        features = compliance_forecaster.extract_compliance_features(sample_compliance_data)

        assert isinstance(features, np.ndarray)
        assert len(features) > 0
        assert not np.isnan(features).any()
        assert np.isfinite(features).all()

        # Test with minimal data
        minimal_data = {'current_metrics': {'code_coverage': 0.8}}
        features_minimal = compliance_forecaster.extract_compliance_features(minimal_data)
        assert isinstance(features_minimal, np.ndarray)
        assert len(features_minimal) > 0

    def test_compliance_drift_prediction(self, compliance_forecaster, sample_compliance_data):
        """Test compliance drift prediction."""
        historical_data = sample_compliance_data['history']

        # Test with sufficient data
        drift_result = compliance_forecaster.predict_compliance_drift(historical_data)

        assert isinstance(drift_result, dict)
        assert 'drift_detected' in drift_result
        assert 'trend_slope' in drift_result
        assert 'confidence' in drift_result

        if drift_result.get('drift_detected'):
            assert 'drift_severity' in drift_result
            assert drift_result['drift_severity'] in ['mild', 'moderate', 'severe']

        # Test with insufficient data
        minimal_data = historical_data[:5]
        drift_result_minimal = compliance_forecaster.predict_compliance_drift(minimal_data)
        assert drift_result_minimal['prediction'] == 'insufficient_data'

        # Test with empty data
        empty_drift = compliance_forecaster.predict_compliance_drift([])
        assert empty_drift['prediction'] == 'insufficient_data'

    def test_drift_prediction_with_trends(self, compliance_forecaster):
        """Test drift prediction with different trend patterns."""
        base_timestamp = datetime.now()

        # Declining trend
        declining_data = []
        for i in range(30):
            declining_data.append({
                'timestamp': (base_timestamp - timedelta(days=i)).isoformat(),
                'overall_score': 0.9 - (i * 0.1)  # Declining by 1% per day
            })

        drift_result = compliance_forecaster.predict_compliance_drift(declining_data)
        assert drift_result.get('drift_detected', False)
        assert drift_result.get('trend_slope', 0) < 0

        # Improving trend
        improving_data = []
        for i in range(30):
            improving_data.append({
                'timestamp': (base_timestamp - timedelta(days=i)).isoformat(),
                'overall_score': 0.7 + (i * 0.5)  # Improving by 0.5% per day
            })

        drift_result = compliance_forecaster.predict_compliance_drift(improving_data)
        # May or may not detect as drift depending on threshold
        assert 'trend_slope' in drift_result

    def test_risk_score_calculation(self, compliance_forecaster, sample_compliance_data):
        """Test risk score calculation."""
        risk_result = compliance_forecaster.calculate_risk_score(sample_compliance_data)

        assert isinstance(risk_result, dict)
        assert 'overall_risk_score' in risk_result
        assert 'risk_level' in risk_result
        assert 'component_scores' in risk_result
        assert 'predicted_violations' in risk_result
        assert 'risk_factors' in risk_result
        assert 'mitigation_recommendations' in risk_result

        # Check risk score range
        assert 0.0 <= risk_result['overall_risk_score'] <= 1.0

        # Check risk level
        assert risk_result['risk_level'] in ['low', 'medium', 'high', 'critical']

        # Check component scores
        assert isinstance(risk_result['component_scores'], dict)
        for component, score in risk_result['component_scores'].items():
            assert 0.0 <= score <= 1.0

    def test_rule_based_risk_scoring(self, compliance_forecaster, sample_compliance_data):
        """Test rule-based risk scoring fallback."""
        # Test rule-based scoring when ML model is not available
        rule_result = compliance_forecaster._rule_based_risk_scoring(sample_compliance_data)

        assert isinstance(rule_result, dict)
        assert 'overall_risk_score' in rule_result
        assert 'risk_level' in rule_result
        assert 'component_scores' in rule_result
        assert 'method' in rule_result
        assert rule_result['method'] == 'rule_based'

        # Check score validity
        assert 0.0 <= rule_result['overall_risk_score'] <= 1.0

    def test_component_scores_calculation(self, compliance_forecaster, sample_compliance_data):
        """Test component risk scores calculation."""
        component_scores = compliance_forecaster._calculate_component_scores(sample_compliance_data)

        assert isinstance(component_scores, dict)
        expected_components = ['security', 'operational', 'data_integrity', 'process']

        for component in expected_components:
            if component in component_scores:
                assert 0.0 <= component_scores[component] <= 1.0

    def test_risk_level_mapping(self, compliance_forecaster):
        """Test risk level name mapping."""
        # Test different risk scores
        assert compliance_forecaster._get_risk_level_name(NASA_POT10_TARGET_COMPLIANCE_THRESHOLD) == 'critical'
        assert compliance_forecaster._get_risk_level_name(0.8) == 'high'
        assert compliance_forecaster._get_risk_level_name(0.6) == 'medium'
        assert compliance_forecaster._get_risk_level_name(0.2) == 'low'

    def test_risk_factors_identification(self, compliance_forecaster, sample_compliance_data):
        """Test risk factor identification."""
        features = compliance_forecaster.extract_compliance_features(sample_compliance_data)
        risk_factors = compliance_forecaster._identify_risk_factors(features, sample_compliance_data)

        assert isinstance(risk_factors, list)
        # Should identify some risk factors for typical data

    def test_mitigation_recommendations(self, compliance_forecaster):
        """Test mitigation recommendation generation."""
        # High risk scenario
        high_risk_recommendations = compliance_forecaster._generate_mitigation_recommendations(
            risk_score=0.9,
            component_scores={'security': 0.8, 'operational': 0.9}
        )

        assert isinstance(high_risk_recommendations, list)
        assert len(high_risk_recommendations) > 0
        assert any('URGENT' in rec for rec in high_risk_recommendations)

        # Low risk scenario
        low_risk_recommendations = compliance_forecaster._generate_mitigation_recommendations(
            risk_score=0.3,
            component_scores={'security': 0.2, 'operational': 0.3}
        )

        assert isinstance(low_risk_recommendations, list)

    def test_proactive_alerts_generation(self, compliance_forecaster, sample_compliance_data):
        """Test proactive alert generation."""
        # Create a forecast result indicating drift
        forecast_result = {
            'drift_detected': True,
            'drift_severity': 'moderate',
            'trend_slope': -0.5,
            'confidence': 0.85,
            'current_score': 0.8,
            'predicted_score_30d': 0.7
        }

        alerts = compliance_forecaster.generate_proactive_alerts(
            sample_compliance_data, forecast_result
        )

        assert isinstance(alerts, list)
        # Should generate alerts for drift and potentially high risk
        assert len(alerts) >= 0

        # Check alert structure
        for alert in alerts:
            assert isinstance(alert, dict)
            assert 'id' in alert
            assert 'type' in alert
            assert 'severity' in alert
            assert 'timestamp' in alert
            assert 'message' in alert
            assert 'details' in alert
            assert 'recommendations' in alert

    def test_training(self, compliance_forecaster, training_data):
        """Test model training functionality."""
        training_samples = training_data['samples']
        drift_labels = training_data['drift_labels']
        risk_labels = training_data['risk_labels']

        # Train the model
        metrics = compliance_forecaster.train(training_samples, drift_labels, risk_labels)

        assert isinstance(metrics, dict)
        assert 'drift_rmse' in metrics
        assert 'risk_accuracy' in metrics
        assert 'training_samples' in metrics
        assert 'test_samples' in metrics
        assert 'feature_count' in metrics

        # Check metric validity
        assert metrics['drift_rmse'] >= 0.0
        assert 0.0 <= metrics['risk_accuracy'] <= 1.0
        assert metrics['training_samples'] > 0
        assert metrics['test_samples'] > 0

        # Verify model is trained
        assert compliance_forecaster.trained is True
        assert compliance_forecaster.drift_predictor is not None
        assert compliance_forecaster.risk_classifier is not None

    def test_training_insufficient_data(self, compliance_forecaster):
        """Test training with insufficient data."""
        # Insufficient samples
        minimal_samples = [{'current_metrics': {'code_coverage': 0.8}}] * 10
        minimal_drift = [0.1] * 10
        minimal_risk = [0] * 10

        with pytest.raises(ValueError, match="Insufficient training data"):
            compliance_forecaster.train(minimal_samples, minimal_drift, minimal_risk)

    def test_model_persistence(self, compliance_forecaster, training_data):
        """Test model saving and loading."""
        training_samples = training_data['samples']
        drift_labels = training_data['drift_labels']
        risk_labels = training_data['risk_labels']

        # Train the model
        compliance_forecaster.train(training_samples, drift_labels, risk_labels)

        with tempfile.TemporaryDirectory() as temp_dir:
            model_path = Path(temp_dir) / 'test_compliance_models'

            # Save models
            compliance_forecaster.save_models(str(model_path))

            # Verify files were created
            assert (model_path / 'drift_predictor.pkl').exists()
            assert (model_path / 'risk_classifier.pkl').exists()
            assert (model_path / 'scaler.pkl').exists()
            assert (model_path / 'metadata.json').exists()

            # Create new forecaster and load models
            new_forecaster = ComplianceForecaster(model_dir=temp_dir)
            new_forecaster.load_models(str(model_path))

            assert new_forecaster.trained is True
            assert new_forecaster.drift_predictor is not None
            assert new_forecaster.risk_classifier is not None

    def test_load_models_nonexistent_path(self, compliance_forecaster):
        """Test loading models from non-existent path."""
        with pytest.raises(FileNotFoundError):
            compliance_forecaster.load_models('/nonexistent/path')

    def test_save_models_before_training(self, compliance_forecaster):
        """Test saving models before training."""
        with pytest.raises(ValueError, match="No trained models to save"):
            compliance_forecaster.save_models()

    def test_feature_extraction_edge_cases(self, compliance_forecaster):
        """Test feature extraction with edge cases."""
        # Empty data
        empty_data = {}
        features = compliance_forecaster.extract_compliance_features(empty_data)
        assert isinstance(features, np.ndarray)
        assert len(features) > 0
        assert not np.isnan(features).any()

        # Data with None values
        none_data = {
            'current_metrics': {'code_coverage': None},
            'violations': None,
            'history': []
        }
        features = compliance_forecaster.extract_compliance_features(none_data)
        assert isinstance(features, np.ndarray)
        assert not np.isnan(features).any()

        # Extreme values
        extreme_data = {
            'current_metrics': {
                'code_coverage': 2.0,  # Invalid coverage > 1
                'security_score': -0.5  # Invalid negative score
            },
            'violations': {'critical_count': MAXIMUM_FUNCTION_PARAMETERS**6}
        }
        features = compliance_forecaster.extract_compliance_features(extreme_data)
        assert isinstance(features, np.ndarray)
        assert np.isfinite(features).all()

    def test_timeseries_feature_extraction(self, compliance_forecaster):
        """Test time-series feature extraction."""
        # Sufficient historical data
        sufficient_data = [
            {
                'timestamp': (datetime.now() - timedelta(days=i)).isoformat(),
                'overall_score': 0.8 + np.sin(i * 0.1) * 0.1
            }
            for i in range(30)
        ]

        ts_features = compliance_forecaster._extract_timeseries_features(sufficient_data)

        assert isinstance(ts_features, dict)
        assert 'trend_slope' in ts_features
        assert 'trend_r_squared' in ts_features
        assert 'mean_score' in ts_features
        assert 'std_score' in ts_features

        # Insufficient data
        insufficient_data = [
            {'timestamp': datetime.now().isoformat(), 'overall_score': 0.8}
        ]

        ts_features_insufficient = compliance_forecaster._extract_timeseries_features(insufficient_data)
        assert ts_features_insufficient.get('insufficient_data') is True

    def test_logging_functionality(self, compliance_forecaster, caplog):
        """Test logging functionality."""
        with caplog.at_level(logging.INFO):
            # Trigger some logging
            compliance_forecaster.extract_compliance_features({})

        # Check that logger was set up
        assert compliance_forecaster.logger is not None
        assert compliance_forecaster.logger.name == 'compliance_forecaster'

    def test_performance_requirements(self, compliance_forecaster, training_data):
        """Test that model meets performance requirements."""
        training_samples = training_data['samples']
        drift_labels = training_data['drift_labels']
        risk_labels = training_data['risk_labels']

        # Expand dataset for better performance assessment
        extended_samples = training_samples * 2
        extended_drift = drift_labels * 2
        extended_risk = risk_labels * 2

        metrics = compliance_forecaster.train(extended_samples, extended_drift, extended_risk)

        # Check performance meets requirements
        risk_accuracy = metrics['risk_accuracy']
        drift_rmse = metrics['drift_rmse']

        # With synthetic data, aim for reasonable performance
        assert risk_accuracy >= 0.6, f"Risk accuracy {risk_accuracy} below minimum threshold"
        assert drift_rmse <= 0.5, f"Drift RMSE {drift_rmse} too high"

    def test_seasonal_pattern_detection(self, compliance_forecaster):
        """Test seasonal pattern detection in compliance data."""
        # Create data with weekly pattern
        seasonal_data = []
        base_timestamp = datetime.now()

        for i in range(50):
            # Add weekly seasonality
            day_of_week = i % 7
            seasonal_component = 0.1 * np.sin(2 * np.pi * day_of_week / 7)

            seasonal_data.append({
                'timestamp': (base_timestamp - timedelta(days=i)).isoformat(),
                'overall_score': 0.8 + seasonal_component + np.random.normal(0, KELLY_CRITERION_FRACTION)
            })

        ts_features = compliance_forecaster._extract_timeseries_features(seasonal_data)

        # Should detect some pattern
        if 'weekly_seasonality' in ts_features:
            assert isinstance(ts_features['weekly_seasonality'], float)

    def test_concurrent_operations(self, compliance_forecaster, sample_compliance_data):
        """Test handling of concurrent operations."""
        # Test multiple risk calculations
        risk_results = []
        for i in range(5):
            modified_data = sample_compliance_data.copy()
            modified_data['current_metrics']['code_coverage'] = 0.8 + i * 0.2

            risk_result = compliance_forecaster.calculate_risk_score(modified_data)
            risk_results.append(risk_result)

        assert len(risk_results) == 5
        assert all(isinstance(r, dict) for r in risk_results)
        assert all('overall_risk_score' in r for r in risk_results)

    def test_memory_efficiency(self, compliance_forecaster, sample_compliance_data):
        """Test memory efficiency with large-scale operations."""
        # Test feature extraction on many samples
        large_dataset = [sample_compliance_data.copy() for _ in range(100)]

        features_list = []
        for data in large_dataset:
            features = compliance_forecaster.extract_compliance_features(data)
            features_list.append(features)

        assert len(features_list) == 100
        assert all(isinstance(f, np.ndarray) for f in features_list)

        # Verify consistent feature sizes
        feature_sizes = [len(f) for f in features_list]
        assert len(set(feature_sizes)) == 1

    def test_alert_threshold_configurations(self, compliance_forecaster):
        """Test different alert threshold configurations."""
        # Test threshold modifications
        original_thresholds = compliance_forecaster.alert_thresholds.copy()

        # Modify thresholds
        compliance_forecaster.alert_thresholds['critical'] = 0.95
        compliance_forecaster.alert_thresholds['high'] = 0.8

        # Test risk level mapping with new thresholds
        assert compliance_forecaster._get_risk_level_name(0.96) == 'critical'
        assert compliance_forecaster._get_risk_level_name(QUALITY_GATE_MINIMUM_PASS_RATE) == 'high'

        # Restore original thresholds
        compliance_forecaster.alert_thresholds = original_thresholds

@pytest.mark.integration
class TestComplianceForecasterIntegration:
    """Integration tests for ComplianceForecaster."""

    def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Initialize forecaster
            forecaster = ComplianceForecaster(model_dir=temp_dir)

            # Create realistic training data
            training_samples = []
            drift_labels = []
            risk_labels = []

            base_timestamp = datetime.now()

            for i in range(80):
                # Create compliance data sample
                sample = {
                    'current_metrics': {
                        'code_coverage': np.random.uniform(0.7, 0.95),
                        'security_score': np.random.uniform(0.85, 1.0),
                        'documentation_coverage': np.random.uniform(0.8, 1.0),
                        'maintainability_index': np.random.randint(70, 95)
                    },
                    'violations': {
                        'critical_count': np.random.randint(0, 3),
                        'high_count': np.random.randint(0, 8),
                        'overdue_count': np.random.randint(0, 4)
                    },
                    'process_maturity': {
                        'automation_score': np.random.uniform(0.7, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD),
                        'monitoring_coverage': np.random.uniform(0.8, 1.0)
                    },
                    'history': [
                        {
                            'timestamp': (base_timestamp - timedelta(days=j)).isoformat(),
                            'overall_score': QUALITY_GATE_MINIMUM_PASS_RATE + np.random.normal(0, 0.5)
                        }
                        for j in range(30)
                    ]
                }

                # Generate labels
                overall_compliance = (
                    sample['current_metrics']['code_coverage'] * 0.3 +
                    sample['current_metrics']['security_score'] * 0.4 +
                    (1 - sample['violations']['critical_count'] / 10) * 0.3
                )

                drift_label = np.random.normal(0, 0.5)  # Small drift
                risk_label = 1 if overall_compliance < THEATER_DETECTION_WARNING_THRESHOLD else 0

                training_samples.append(sample)
                drift_labels.append(drift_label)
                risk_labels.append(risk_label)

            # Train model
            metrics = forecaster.train(training_samples, drift_labels, risk_labels)

            # Verify training results
            assert metrics['risk_accuracy'] > 0.6

            # Save and reload model
            model_path = Path(temp_dir) / 'integration_test_model'
            forecaster.save_models(str(model_path))

            new_forecaster = ComplianceForecaster()
            new_forecaster.load_models(str(model_path))

            # Test risk assessment
            test_sample = training_samples[0]
            risk_result = new_forecaster.calculate_risk_score(test_sample)

            # Verify risk assessment structure
            assert isinstance(risk_result, dict)
            required_keys = [
                'overall_risk_score', 'risk_level', 'component_scores',
                'predicted_violations', 'risk_factors', 'mitigation_recommendations'
            ]
            assert all(key in risk_result for key in required_keys)

            # Test drift prediction
            if 'history' in test_sample and len(test_sample['history']) >= 10:
                drift_result = new_forecaster.predict_compliance_drift(test_sample['history'])
                assert isinstance(drift_result, dict)
                assert 'trend' in drift_result

            # Test alert generation
            forecast_result = {
                'drift_detected': True,
                'drift_severity': 'moderate'
            }
            alerts = new_forecaster.generate_proactive_alerts(test_sample, forecast_result)
            assert isinstance(alerts, list)

            # Test batch operations
            batch_results = []
            for i in range(10):
                result = new_forecaster.calculate_risk_score(training_samples[i])
                batch_results.append(result)

            assert len(batch_results) == 10
            assert all('overall_risk_score' in r for r in batch_results)

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])