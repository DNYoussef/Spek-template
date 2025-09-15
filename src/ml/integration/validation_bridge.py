"""
Integration Bridge for ML Models with Existing Validation Systems

This module provides seamless integration between ML models and existing
validation infrastructure, enabling real-time predictions and enhanced
quality gates while maintaining compatibility with current workflows.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union, Callable
import logging
from datetime import datetime, timedelta
import json
import asyncio
from pathlib import Path
from abc import ABC, abstractmethod
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import existing validation components
import sys
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import ML models
sys.path.append(str(Path(__file__).parent.parent))
from quality_predictor import QualityPredictor
from theater_classifier import TheaterClassifier
from compliance_forecaster import ComplianceForecaster
from alerts.notification_system import MLAlertSystem

class ValidationBridge(ABC):
    """Abstract base class for validation system bridges."""

    @abstractmethod
    def integrate_ml_predictions(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Integrate ML predictions into validation workflow."""
        pass

    @abstractmethod
    def enhance_quality_gates(self, gates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enhance existing quality gates with ML insights."""
        pass

class QualityGateBridge(ValidationBridge):
    """Bridge for integrating ML with quality gate systems."""

    def __init__(self, ml_models: Dict[str, Any], config: Dict[str, Any] = None):
        self.ml_models = ml_models
        self.config = config or {}
        self.logger = logging.getLogger('quality_gate_bridge')

    def integrate_ml_predictions(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Integrate ML predictions into quality gate evaluation."""
        enhanced_context = context.copy()

        # Add ML predictions to context
        if 'quality_predictor' in self.ml_models and 'code_data' in context:
            try:
                quality_prediction = self.ml_models['quality_predictor'].predict_quality(
                    context['code_data']
                )
                enhanced_context['ml_quality_prediction'] = quality_prediction

                # Convert to gate-compatible format
                enhanced_context['predicted_quality_score'] = quality_prediction['quality_probability']['high_quality']
                enhanced_context['quality_confidence'] = quality_prediction['confidence']

            except Exception as e:
                self.logger.error(f"Quality prediction failed: {e}")

        if 'theater_classifier' in self.ml_models and 'change_data' in context:
            try:
                theater_prediction = self.ml_models['theater_classifier'].predict_theater(
                    context['change_data']
                )
                enhanced_context['ml_theater_prediction'] = theater_prediction

                # Add theater risk score
                enhanced_context['theater_risk_score'] = theater_prediction['theater_probability']
                enhanced_context['theater_confidence'] = theater_prediction['confidence']

            except Exception as e:
                self.logger.error(f"Theater prediction failed: {e}")

        return enhanced_context

    def enhance_quality_gates(self, gates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enhance quality gates with ML-based checks."""
        enhanced_gates = gates.copy()

        # Add ML-specific quality gates
        ml_gates = [
            {
                'name': 'ML Quality Prediction',
                'type': 'ml_quality',
                'threshold': 0.85,
                'condition': 'predicted_quality_score >= threshold',
                'description': 'ML-predicted code quality score',
                'weight': 0.3,
                'required': False
            },
            {
                'name': 'Theater Detection',
                'type': 'ml_theater',
                'threshold': 0.7,
                'condition': 'theater_risk_score < threshold',
                'description': 'Performance theater detection check',
                'weight': 0.2,
                'required': True
            },
            {
                'name': 'Anomaly Detection',
                'type': 'ml_anomaly',
                'condition': 'not ml_quality_prediction.is_anomaly',
                'description': 'Code anomaly detection check',
                'weight': 0.1,
                'required': False
            }
        ]

        enhanced_gates.extend(ml_gates)
        return enhanced_gates

class CIIntegrationBridge(ValidationBridge):
    """Bridge for CI/CD pipeline integration."""

    def __init__(self, ml_models: Dict[str, Any], config: Dict[str, Any] = None):
        self.ml_models = ml_models
        self.config = config or {}
        self.logger = logging.getLogger('ci_integration_bridge')

    def integrate_ml_predictions(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Integrate ML predictions into CI/CD pipeline."""
        enhanced_context = context.copy()

        # Extract CI-specific data
        pipeline_data = context.get('pipeline_data', {})
        commit_data = context.get('commit_data', {})

        # Prepare ML input from CI context
        ml_input = self._prepare_ml_input_from_ci(pipeline_data, commit_data)

        # Run ML predictions
        ml_results = self._run_all_predictions(ml_input)

        # Format results for CI consumption
        ci_results = self._format_for_ci(ml_results)

        enhanced_context['ml_results'] = ci_results
        enhanced_context['ml_recommendations'] = self._generate_ci_recommendations(ml_results)

        return enhanced_context

    def enhance_quality_gates(self, gates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enhance CI quality gates with ML checks."""
        enhanced_gates = gates.copy()

        # CI-specific ML gates
        ci_ml_gates = [
            {
                'name': 'ML Code Quality Check',
                'stage': 'test',
                'command': 'ml_quality_check',
                'condition': 'exit_code == 0',
                'timeout': 300,
                'required': True
            },
            {
                'name': 'Theater Detection Check',
                'stage': 'analysis',
                'command': 'ml_theater_check',
                'condition': 'theater_score < 0.7',
                'timeout': 180,
                'required': False
            },
            {
                'name': 'Compliance Risk Assessment',
                'stage': 'compliance',
                'command': 'ml_compliance_check',
                'condition': 'risk_score < 0.75',
                'timeout': 240,
                'required': True
            }
        ]

        enhanced_gates.extend(ci_ml_gates)
        return enhanced_gates

    def _prepare_ml_input_from_ci(self, pipeline_data: Dict[str, Any],
                                 commit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare ML input from CI pipeline data."""
        ml_input = {}

        # Extract code changes
        if 'changed_files' in commit_data:
            code_data = {
                'changes': {
                    'files_changed': len(commit_data['changed_files']),
                    'lines_added': commit_data.get('additions', 0),
                    'lines_deleted': commit_data.get('deletions', 0)
                },
                'commit_info': {
                    'message': commit_data.get('message', ''),
                    'author': commit_data.get('author', ''),
                    'timestamp': commit_data.get('timestamp', datetime.now().isoformat())
                }
            }
            ml_input['code_data'] = code_data

        # Extract change context
        if 'build_data' in pipeline_data:
            change_data = {
                'effort': {
                    'development_time': pipeline_data.get('duration_minutes', 0)
                },
                'timing': {
                    'weekend_work': self._is_weekend_work(commit_data.get('timestamp')),
                    'late_night_work': self._is_late_night_work(commit_data.get('timestamp'))
                }
            }
            ml_input['change_data'] = change_data

        return ml_input

    def _run_all_predictions(self, ml_input: Dict[str, Any]) -> Dict[str, Any]:
        """Run all ML predictions on prepared input."""
        results = {}

        # Quality prediction
        if 'quality_predictor' in self.ml_models and 'code_data' in ml_input:
            try:
                quality_result = self.ml_models['quality_predictor'].predict_quality(
                    ml_input['code_data']
                )
                results['quality'] = quality_result
            except Exception as e:
                self.logger.error(f"Quality prediction failed: {e}")
                results['quality'] = {'error': str(e)}

        # Theater detection
        if 'theater_classifier' in self.ml_models and 'change_data' in ml_input:
            try:
                theater_result = self.ml_models['theater_classifier'].predict_theater(
                    ml_input['change_data']
                )
                results['theater'] = theater_result
            except Exception as e:
                self.logger.error(f"Theater detection failed: {e}")
                results['theater'] = {'error': str(e)}

        return results

    def _format_for_ci(self, ml_results: Dict[str, Any]) -> Dict[str, Any]:
        """Format ML results for CI consumption."""
        ci_format = {
            'status': 'success',
            'scores': {},
            'checks': {},
            'recommendations': []
        }

        # Quality results
        if 'quality' in ml_results and 'error' not in ml_results['quality']:
            quality = ml_results['quality']
            ci_format['scores']['quality'] = quality['quality_probability']['high_quality']
            ci_format['checks']['quality_passed'] = quality['quality_prediction'] == 1
            ci_format['checks']['anomaly_detected'] = quality['is_anomaly']

        # Theater results
        if 'theater' in ml_results and 'error' not in ml_results['theater']:
            theater = ml_results['theater']
            ci_format['scores']['theater_risk'] = theater['theater_probability']
            ci_format['checks']['theater_detected'] = theater['is_theater']

        return ci_format

    def _generate_ci_recommendations(self, ml_results: Dict[str, Any]) -> List[str]:
        """Generate CI-specific recommendations based on ML results."""
        recommendations = []

        # Quality recommendations
        if 'quality' in ml_results and 'recommendation' in ml_results['quality']:
            recommendations.append(f"Quality: {ml_results['quality']['recommendation']}")

        # Theater recommendations
        if 'theater' in ml_results and 'recommendation' in ml_results['theater']:
            recommendations.append(f"Theater: {ml_results['theater']['recommendation']}")

        return recommendations

    def _is_weekend_work(self, timestamp_str: str) -> float:
        """Check if work was done on weekend."""
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            return 1.0 if timestamp.weekday() >= 5 else 0.0
        except:
            return 0.0

    def _is_late_night_work(self, timestamp_str: str) -> float:
        """Check if work was done late at night."""
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            hour = timestamp.hour
            return 1.0 if hour < 6 or hour > 22 else 0.0
        except:
            return 0.0

class MonitoringIntegrationBridge(ValidationBridge):
    """Bridge for monitoring and observability systems."""

    def __init__(self, ml_models: Dict[str, Any], alert_system: MLAlertSystem = None,
                 config: Dict[str, Any] = None):
        self.ml_models = ml_models
        self.alert_system = alert_system
        self.config = config or {}
        self.logger = logging.getLogger('monitoring_bridge')

        # Monitoring state
        self.monitoring_active = False
        self.monitoring_thread = None
        self.metrics_history = []

    def integrate_ml_predictions(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Integrate ML predictions into monitoring context."""
        enhanced_context = context.copy()

        # Extract monitoring data
        metrics = context.get('metrics', {})
        events = context.get('events', [])

        # Run ML analysis on monitoring data
        ml_analysis = self._analyze_monitoring_data(metrics, events)

        enhanced_context['ml_analysis'] = ml_analysis
        enhanced_context['ml_insights'] = self._generate_monitoring_insights(ml_analysis)

        # Generate alerts if necessary
        if self.alert_system:
            self._check_and_generate_alerts(ml_analysis)

        return enhanced_context

    def enhance_quality_gates(self, gates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enhance monitoring quality gates with ML insights."""
        enhanced_gates = gates.copy()

        # Monitoring-specific ML gates
        monitoring_gates = [
            {
                'name': 'ML Quality Trend',
                'type': 'trend_analysis',
                'window': '24h',
                'condition': 'quality_trend_slope > -0.05',
                'description': 'Quality degradation trend detection',
                'severity': 'warning'
            },
            {
                'name': 'Theater Activity Monitor',
                'type': 'pattern_detection',
                'threshold': 0.3,
                'condition': 'theater_activity_rate < threshold',
                'description': 'Monitor for performance theater patterns',
                'severity': 'info'
            },
            {
                'name': 'Compliance Drift Alert',
                'type': 'compliance_monitoring',
                'threshold': 0.1,
                'condition': 'compliance_drift_rate < threshold',
                'description': 'Monitor compliance score drift',
                'severity': 'critical'
            }
        ]

        enhanced_gates.extend(monitoring_gates)
        return enhanced_gates

    def start_continuous_monitoring(self) -> None:
        """Start continuous ML-based monitoring."""
        if self.monitoring_active:
            self.logger.warning("Monitoring already active")
            return

        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            daemon=True
        )
        self.monitoring_thread.start()
        self.logger.info("Continuous ML monitoring started")

    def stop_continuous_monitoring(self) -> None:
        """Stop continuous monitoring."""
        self.monitoring_active = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        self.logger.info("Continuous ML monitoring stopped")

    def _monitoring_loop(self) -> None:
        """Main monitoring loop."""
        check_interval = self.config.get('monitoring_interval_seconds', 300)

        while self.monitoring_active:
            try:
                # Collect current metrics
                current_metrics = self._collect_current_metrics()

                # Run ML analysis
                ml_analysis = self._analyze_monitoring_data(current_metrics, [])

                # Store in history
                self.metrics_history.append({
                    'timestamp': datetime.now(),
                    'metrics': current_metrics,
                    'ml_analysis': ml_analysis
                })

                # Cleanup old history
                self._cleanup_metrics_history()

                # Check for alerts
                if self.alert_system:
                    self._check_and_generate_alerts(ml_analysis)

            except Exception as e:
                self.logger.error(f"Monitoring loop error: {e}")

            # Wait for next check
            if self.monitoring_active:
                threading.Event().wait(check_interval)

    def _analyze_monitoring_data(self, metrics: Dict[str, Any],
                                events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze monitoring data with ML models."""
        analysis = {
            'timestamp': datetime.now().isoformat(),
            'quality_analysis': {},
            'theater_analysis': {},
            'compliance_analysis': {}
        }

        # Quality analysis
        if 'quality_predictor' in self.ml_models:
            try:
                quality_data = self._extract_quality_data(metrics)
                if quality_data:
                    quality_result = self.ml_models['quality_predictor'].predict_quality(quality_data)
                    analysis['quality_analysis'] = quality_result
            except Exception as e:
                self.logger.error(f"Quality analysis failed: {e}")

        # Theater pattern analysis
        if 'theater_classifier' in self.ml_models:
            try:
                theater_data = self._extract_theater_data(metrics, events)
                if theater_data:
                    theater_result = self.ml_models['theater_classifier'].predict_theater(theater_data)
                    analysis['theater_analysis'] = theater_result
            except Exception as e:
                self.logger.error(f"Theater analysis failed: {e}")

        # Compliance analysis
        if 'compliance_forecaster' in self.ml_models:
            try:
                compliance_data = self._extract_compliance_data(metrics)
                if compliance_data:
                    compliance_result = self.ml_models['compliance_forecaster'].calculate_risk_score(compliance_data)
                    analysis['compliance_analysis'] = compliance_result
            except Exception as e:
                self.logger.error(f"Compliance analysis failed: {e}")

        return analysis

    def _generate_monitoring_insights(self, ml_analysis: Dict[str, Any]) -> List[str]:
        """Generate actionable insights from ML analysis."""
        insights = []

        # Quality insights
        quality_analysis = ml_analysis.get('quality_analysis', {})
        if quality_analysis and 'quality_prediction' in quality_analysis:
            if quality_analysis['quality_prediction'] == 0:
                insights.append(f"Quality degradation detected with {quality_analysis.get('confidence', 0):.2f} confidence")

        # Theater insights
        theater_analysis = ml_analysis.get('theater_analysis', {})
        if theater_analysis and theater_analysis.get('is_theater', False):
            insights.append(f"Performance theater detected with {theater_analysis.get('theater_probability', 0):.2f} probability")

        # Compliance insights
        compliance_analysis = ml_analysis.get('compliance_analysis', {})
        if compliance_analysis and compliance_analysis.get('overall_risk_score', 0) > 0.7:
            insights.append(f"High compliance risk detected: {compliance_analysis.get('overall_risk_score', 0):.2f}")

        return insights

    def _collect_current_metrics(self) -> Dict[str, Any]:
        """Collect current system metrics."""
        # This would integrate with actual monitoring systems
        # For now, return placeholder metrics
        return {
            'quality_metrics': {
                'test_coverage': 0.85,
                'code_complexity': 12,
                'documentation_coverage': 0.9
            },
            'performance_metrics': {
                'build_time': 300,
                'test_execution_time': 120,
                'deployment_time': 180
            },
            'activity_metrics': {
                'commits_per_day': 15,
                'pull_requests_per_day': 8,
                'code_review_time': 45
            }
        }

    def _extract_quality_data(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Extract quality-relevant data from metrics."""
        quality_metrics = metrics.get('quality_metrics', {})
        return {
            'metrics': quality_metrics,
            'quality': quality_metrics
        }

    def _extract_theater_data(self, metrics: Dict[str, Any],
                             events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract theater-relevant data from metrics and events."""
        activity_metrics = metrics.get('activity_metrics', {})
        performance_metrics = metrics.get('performance_metrics', {})

        return {
            'effort': {
                'development_time': performance_metrics.get('build_time', 0) / 60
            },
            'impact': {
                'user_value': 0.5  # Placeholder
            },
            'metrics': activity_metrics
        }

    def _extract_compliance_data(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Extract compliance-relevant data from metrics."""
        quality_metrics = metrics.get('quality_metrics', {})

        return {
            'current_metrics': {
                'code_coverage': quality_metrics.get('test_coverage', 0),
                'security_score': 0.9,  # Placeholder
                'documentation_coverage': quality_metrics.get('documentation_coverage', 0)
            }
        }

    def _check_and_generate_alerts(self, ml_analysis: Dict[str, Any]) -> None:
        """Check ML analysis results and generate alerts if needed."""
        alert_data = {
            'code_data': ml_analysis.get('quality_analysis', {}),
            'change_data': ml_analysis.get('theater_analysis', {}),
            'compliance_data': ml_analysis.get('compliance_analysis', {})
        }

        try:
            alerts = self.alert_system.analyze_and_alert(alert_data)
            if alerts:
                self.logger.info(f"Generated {len(alerts)} alerts from monitoring")
        except Exception as e:
            self.logger.error(f"Alert generation failed: {e}")

    def _cleanup_metrics_history(self) -> None:
        """Clean up old metrics history."""
        max_history_hours = self.config.get('max_history_hours', 24)
        cutoff_time = datetime.now() - timedelta(hours=max_history_hours)

        self.metrics_history = [
            entry for entry in self.metrics_history
            if entry['timestamp'] > cutoff_time
        ]

class MLValidationOrchestrator:
    """
    Orchestrator for ML integration across all validation systems.

    Features:
    - Coordinated ML model deployment
    - Bridge management and configuration
    - Performance monitoring and optimization
    - Fallback mechanisms for model failures
    """

    def __init__(self, config_file: str = "config/ml/integration_config.json"):
        self.config = self._load_config(config_file)
        self.logger = self._setup_logging()

        # ML models
        self.ml_models = {}
        self.alert_system = None

        # Integration bridges
        self.bridges = {}

        # Performance tracking
        self.integration_metrics = {
            'predictions_count': 0,
            'prediction_times': [],
            'error_count': 0,
            'bridge_usage': {}
        }

    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """Load integration configuration."""
        default_config = {
            'models': {
                'quality_predictor_path': 'models/quality',
                'theater_classifier_path': 'models/theater',
                'compliance_forecaster_path': 'models/compliance'
            },
            'bridges': {
                'quality_gate': {'enabled': True},
                'ci_integration': {'enabled': True},
                'monitoring': {'enabled': True, 'monitoring_interval_seconds': 300}
            },
            'alerts': {
                'enabled': True,
                'config_file': 'config/ml/alerts_config.json'
            },
            'performance': {
                'max_prediction_time_seconds': 30,
                'fallback_on_failure': True,
                'cache_predictions': True
            }
        }

        if Path(config_file).exists():
            with open(config_file, 'r') as f:
                config = json.load(f)
                self._deep_merge(default_config, config)

        return default_config

    def _deep_merge(self, base: Dict, update: Dict) -> None:
        """Deep merge configuration dictionaries."""
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for orchestrator."""
        logger = logging.getLogger('ml_validation_orchestrator')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def initialize(self) -> None:
        """Initialize ML models and integration bridges."""
        self.logger.info("Initializing ML validation orchestrator")

        # Load ML models
        self._load_ml_models()

        # Initialize alert system
        if self.config['alerts']['enabled']:
            self._initialize_alert_system()

        # Initialize bridges
        self._initialize_bridges()

        self.logger.info("ML validation orchestrator initialized successfully")

    def _load_ml_models(self) -> None:
        """Load all ML models."""
        model_paths = self.config['models']

        # Load quality predictor
        try:
            if Path(model_paths['quality_predictor_path']).exists():
                quality_predictor = QualityPredictor()
                quality_predictor.load_models(model_paths['quality_predictor_path'])
                self.ml_models['quality_predictor'] = quality_predictor
                self.logger.info("Quality predictor loaded")
        except Exception as e:
            self.logger.error(f"Failed to load quality predictor: {e}")

        # Load theater classifier
        try:
            if Path(model_paths['theater_classifier_path']).exists():
                theater_classifier = TheaterClassifier()
                theater_classifier.load_models(model_paths['theater_classifier_path'])
                self.ml_models['theater_classifier'] = theater_classifier
                self.logger.info("Theater classifier loaded")
        except Exception as e:
            self.logger.error(f"Failed to load theater classifier: {e}")

        # Load compliance forecaster
        try:
            if Path(model_paths['compliance_forecaster_path']).exists():
                compliance_forecaster = ComplianceForecaster()
                compliance_forecaster.load_models(model_paths['compliance_forecaster_path'])
                self.ml_models['compliance_forecaster'] = compliance_forecaster
                self.logger.info("Compliance forecaster loaded")
        except Exception as e:
            self.logger.error(f"Failed to load compliance forecaster: {e}")

    def _initialize_alert_system(self) -> None:
        """Initialize ML alert system."""
        try:
            alerts_config = self.config['alerts'].get('config_file')
            self.alert_system = MLAlertSystem(alerts_config)
            self.alert_system.load_models()
            self.logger.info("Alert system initialized")
        except Exception as e:
            self.logger.error(f"Failed to initialize alert system: {e}")

    def _initialize_bridges(self) -> None:
        """Initialize integration bridges."""
        bridge_configs = self.config['bridges']

        # Quality gate bridge
        if bridge_configs['quality_gate']['enabled']:
            self.bridges['quality_gate'] = QualityGateBridge(
                self.ml_models, bridge_configs['quality_gate']
            )

        # CI integration bridge
        if bridge_configs['ci_integration']['enabled']:
            self.bridges['ci_integration'] = CIIntegrationBridge(
                self.ml_models, bridge_configs['ci_integration']
            )

        # Monitoring integration bridge
        if bridge_configs['monitoring']['enabled']:
            self.bridges['monitoring'] = MonitoringIntegrationBridge(
                self.ml_models, self.alert_system, bridge_configs['monitoring']
            )

        self.logger.info(f"Initialized {len(self.bridges)} integration bridges")

    def enhance_validation_context(self, context: Dict[str, Any],
                                  bridge_types: List[str] = None) -> Dict[str, Any]:
        """Enhance validation context with ML predictions across specified bridges."""
        if bridge_types is None:
            bridge_types = list(self.bridges.keys())

        enhanced_context = context.copy()

        for bridge_type in bridge_types:
            if bridge_type in self.bridges:
                try:
                    start_time = datetime.now()

                    bridge_enhancement = self.bridges[bridge_type].integrate_ml_predictions(
                        enhanced_context
                    )
                    enhanced_context.update(bridge_enhancement)

                    # Track performance
                    prediction_time = (datetime.now() - start_time).total_seconds()
                    self.integration_metrics['prediction_times'].append(prediction_time)
                    self.integration_metrics['predictions_count'] += 1
                    self.integration_metrics['bridge_usage'][bridge_type] = (
                        self.integration_metrics['bridge_usage'].get(bridge_type, 0) + 1
                    )

                    self.logger.debug(f"Enhanced context with {bridge_type} bridge")

                except Exception as e:
                    self.logger.error(f"Bridge {bridge_type} enhancement failed: {e}")
                    self.integration_metrics['error_count'] += 1

                    # Fallback mechanism
                    if self.config['performance']['fallback_on_failure']:
                        enhanced_context[f'{bridge_type}_ml_fallback'] = True

        return enhanced_context

    def enhance_quality_gates(self, gates: List[Dict[str, Any]],
                             bridge_types: List[str] = None) -> List[Dict[str, Any]]:
        """Enhance quality gates across specified bridges."""
        if bridge_types is None:
            bridge_types = list(self.bridges.keys())

        enhanced_gates = gates.copy()

        for bridge_type in bridge_types:
            if bridge_type in self.bridges:
                try:
                    bridge_gates = self.bridges[bridge_type].enhance_quality_gates(enhanced_gates)
                    enhanced_gates = bridge_gates
                    self.logger.debug(f"Enhanced gates with {bridge_type} bridge")
                except Exception as e:
                    self.logger.error(f"Gate enhancement failed for {bridge_type}: {e}")

        return enhanced_gates

    def start_monitoring(self) -> None:
        """Start continuous monitoring if monitoring bridge is available."""
        if 'monitoring' in self.bridges:
            self.bridges['monitoring'].start_continuous_monitoring()

    def stop_monitoring(self) -> None:
        """Stop continuous monitoring."""
        if 'monitoring' in self.bridges:
            self.bridges['monitoring'].stop_continuous_monitoring()

    def get_integration_metrics(self) -> Dict[str, Any]:
        """Get integration performance metrics."""
        metrics = self.integration_metrics.copy()

        if metrics['prediction_times']:
            metrics['avg_prediction_time'] = np.mean(metrics['prediction_times'])
            metrics['max_prediction_time'] = np.max(metrics['prediction_times'])
            metrics['prediction_time_p95'] = np.percentile(metrics['prediction_times'], 95)

        metrics['error_rate'] = (
            metrics['error_count'] / max(metrics['predictions_count'], 1)
        )

        return metrics

    def health_check(self) -> Dict[str, Any]:
        """Perform health check on all integration components."""
        health = {
            'status': 'healthy',
            'models': {},
            'bridges': {},
            'alert_system': None,
            'timestamp': datetime.now().isoformat()
        }

        # Check ML models
        for model_name, model in self.ml_models.items():
            try:
                # Simple health check - verify model is loaded
                health['models'][model_name] = 'healthy' if model else 'failed'
            except Exception as e:
                health['models'][model_name] = f'error: {e}'

        # Check bridges
        for bridge_name, bridge in self.bridges.items():
            try:
                # Simple health check
                health['bridges'][bridge_name] = 'healthy'
            except Exception as e:
                health['bridges'][bridge_name] = f'error: {e}'

        # Check alert system
        if self.alert_system:
            try:
                health['alert_system'] = 'healthy'
            except Exception as e:
                health['alert_system'] = f'error: {e}'

        # Overall status
        failed_components = []
        for component_type, components in [('models', health['models']), ('bridges', health['bridges'])]:
            for name, status in components.items():
                if status != 'healthy':
                    failed_components.append(f"{component_type}.{name}")

        if failed_components:
            health['status'] = 'degraded'
            health['failed_components'] = failed_components

        return health

# Example usage and configuration
if __name__ == "__main__":
    # Initialize orchestrator
    orchestrator = MLValidationOrchestrator()
    orchestrator.initialize()

    # Example validation context
    validation_context = {
        'code_data': {
            'metrics': {'lines_of_code': 500, 'complexity': 12},
            'changes': {'lines_added': 50, 'files_changed': 3}
        },
        'pipeline_data': {
            'build_time': 300,
            'test_results': {'passed': 45, 'failed': 2}
        }
    }

    # Enhance context with ML predictions
    enhanced_context = orchestrator.enhance_validation_context(validation_context)
    print(f"Enhanced context keys: {list(enhanced_context.keys())}")

    # Health check
    health = orchestrator.health_check()
    print(f"System health: {health['status']}")

    # Get metrics
    metrics = orchestrator.get_integration_metrics()
    print(f"Integration metrics: {metrics}")