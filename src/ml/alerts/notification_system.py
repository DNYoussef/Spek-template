"""
ML-Based Alert and Notification System

This module implements intelligent alerting based on ML predictions,
providing proactive notifications for quality issues, theater detection,
and compliance violations. Integrates with monitoring systems.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union, Callable
import logging
from datetime import datetime, timedelta
import json
import asyncio
from pathlib import Path
from enum import Enum
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod

# Import ML models
import sys
sys.path.append(str(Path(__file__).parent.parent))
from quality_predictor import QualityPredictor
from theater_classifier import TheaterClassifier
from compliance_forecaster import ComplianceForecaster

class AlertSeverity(Enum):
    """Alert severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(Enum):
    """Types of alerts."""
    QUALITY_DEGRADATION = "quality_degradation"
    THEATER_DETECTION = "theater_detection"
    COMPLIANCE_VIOLATION = "compliance_violation"
    ANOMALY_DETECTION = "anomaly_detection"
    TREND_WARNING = "trend_warning"
    THRESHOLD_BREACH = "threshold_breach"

@dataclass
class Alert:
    """Alert data structure."""
    id: str
    type: AlertType
    severity: AlertSeverity
    timestamp: datetime
    title: str
    message: str
    details: Dict[str, Any]
    source: str
    tags: List[str]
    resolved: bool = False
    resolution_timestamp: Optional[datetime] = None
    assigned_to: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary."""
        result = asdict(self)
        result['type'] = self.type.value
        result['severity'] = self.severity.value
        result['timestamp'] = self.timestamp.isoformat()
        if self.resolution_timestamp:
            result['resolution_timestamp'] = self.resolution_timestamp.isoformat()
        return result

class AlertChannel(ABC):
    """Abstract base class for alert channels."""

    @abstractmethod
    async def send_alert(self, alert: Alert) -> bool:
        """Send alert through this channel."""
        pass

    @abstractmethod
    def is_enabled(self) -> bool:
        """Check if channel is enabled."""
        pass

class EmailAlertChannel(AlertChannel):
    """Email alert channel."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger('email_alerts')

    async def send_alert(self, alert: Alert) -> bool:
        """Send alert via email."""
        if not self.is_enabled():
            return False

        try:
            # Simulate email sending
            # In practice, integrate with SMTP or email service
            recipients = self.config.get('recipients', [])
            subject = f"[{alert.severity.value.upper()}] {alert.title}"

            email_body = self._format_email_body(alert)

            self.logger.info(f"Email alert sent: {alert.id} to {len(recipients)} recipients")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send email alert {alert.id}: {e}")
            return False

    def is_enabled(self) -> bool:
        """Check if email channel is enabled."""
        return self.config.get('enabled', False)

    def _format_email_body(self, alert: Alert) -> str:
        """Format alert as email body."""
        body = f"""
Alert: {alert.title}

Severity: {alert.severity.value.upper()}
Type: {alert.type.value}
Timestamp: {alert.timestamp.isoformat()}
Source: {alert.source}

Message:
{alert.message}

Details:
"""
        for key, value in alert.details.items():
            body += f"- {key}: {value}\n"

        body += f"\nAlert ID: {alert.id}\n"
        body += f"Tags: {', '.join(alert.tags)}\n"

        return body

class SlackAlertChannel(AlertChannel):
    """Slack alert channel."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger('slack_alerts')

    async def send_alert(self, alert: Alert) -> bool:
        """Send alert to Slack."""
        if not self.is_enabled():
            return False

        try:
            # Simulate Slack integration
            # In practice, use Slack SDK or webhook
            channel = self.config.get('channel', '#alerts')
            webhook_url = self.config.get('webhook_url')

            slack_message = self._format_slack_message(alert)

            self.logger.info(f"Slack alert sent: {alert.id} to {channel}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send Slack alert {alert.id}: {e}")
            return False

    def is_enabled(self) -> bool:
        """Check if Slack channel is enabled."""
        return self.config.get('enabled', False) and self.config.get('webhook_url')

    def _format_slack_message(self, alert: Alert) -> Dict[str, Any]:
        """Format alert as Slack message."""
        color = {
            AlertSeverity.LOW: "good",
            AlertSeverity.MEDIUM: "warning",
            AlertSeverity.HIGH: "danger",
            AlertSeverity.CRITICAL: "danger"
        }.get(alert.severity, "warning")

        return {
            "text": alert.title,
            "attachments": [
                {
                    "color": color,
                    "fields": [
                        {"title": "Severity", "value": alert.severity.value.upper(), "short": True},
                        {"title": "Type", "value": alert.type.value, "short": True},
                        {"title": "Source", "value": alert.source, "short": True},
                        {"title": "Timestamp", "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S"), "short": True},
                        {"title": "Message", "value": alert.message, "short": False}
                    ]
                }
            ]
        }

class WebhookAlertChannel(AlertChannel):
    """Generic webhook alert channel."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger('webhook_alerts')

    async def send_alert(self, alert: Alert) -> bool:
        """Send alert via webhook."""
        if not self.is_enabled():
            return False

        try:
            # Simulate webhook call
            # In practice, use HTTP client to POST to webhook URL
            webhook_url = self.config.get('webhook_url')
            payload = alert.to_dict()

            self.logger.info(f"Webhook alert sent: {alert.id} to {webhook_url}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send webhook alert {alert.id}: {e}")
            return False

    def is_enabled(self) -> bool:
        """Check if webhook channel is enabled."""
        return self.config.get('enabled', False) and self.config.get('webhook_url')

class MLAlertSystem:
    """
    Comprehensive ML-based alert and notification system.

    Features:
    - Real-time ML prediction monitoring
    - Intelligent alert generation and routing
    - Multi-channel notification delivery
    - Alert deduplication and escalation
    - Performance analytics and optimization
    """

    def __init__(self, config_file: str = "config/ml/alerts_config.json"):
        self.config = self._load_config(config_file)
        self.logger = self._setup_logging()

        # ML models
        self.quality_predictor = None
        self.theater_classifier = None
        self.compliance_forecaster = None

        # Alert management
        self.active_alerts = {}
        self.alert_history = []
        self.alert_rules = self._initialize_alert_rules()

        # Notification channels
        self.channels = self._initialize_channels()

        # Performance tracking
        self.alert_metrics = {
            'total_alerts': 0,
            'alerts_by_severity': {s.value: 0 for s in AlertSeverity},
            'alerts_by_type': {t.value: 0 for t in AlertType},
            'response_times': [],
            'resolution_times': []
        }

    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """Load alert system configuration."""
        default_config = {
            'models': {
                'quality_predictor_path': 'models/quality',
                'theater_classifier_path': 'models/theater',
                'compliance_forecaster_path': 'models/compliance'
            },
            'thresholds': {
                'quality_degradation': 0.8,
                'theater_probability': 0.7,
                'compliance_risk': 0.75,
                'anomaly_score': -0.5
            },
            'channels': {
                'email': {
                    'enabled': False,
                    'recipients': []
                },
                'slack': {
                    'enabled': False,
                    'channel': '#alerts',
                    'webhook_url': None
                },
                'webhook': {
                    'enabled': False,
                    'webhook_url': None
                }
            },
            'alert_rules': {
                'deduplication_window_minutes': 30,
                'escalation_delay_minutes': 60,
                'auto_resolve_hours': 24
            },
            'monitoring': {
                'check_interval_seconds': 300,
                'batch_size': 100,
                'history_retention_days': 30
            }
        }

        if Path(config_file).exists():
            with open(config_file, 'r') as f:
                config = json.load(f)
                # Deep merge with defaults
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
        """Setup logging for alert system."""
        logger = logging.getLogger('ml_alert_system')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _initialize_alert_rules(self) -> Dict[str, Dict[str, Any]]:
        """Initialize alert generation rules."""
        return {
            'quality_degradation': {
                'threshold': self.config['thresholds']['quality_degradation'],
                'severity_mapping': {
                    (0.0, 0.5): AlertSeverity.CRITICAL,
                    (0.5, 0.7): AlertSeverity.HIGH,
                    (0.7, 0.8): AlertSeverity.MEDIUM
                },
                'cooldown_minutes': 15
            },
            'theater_detection': {
                'threshold': self.config['thresholds']['theater_probability'],
                'severity_mapping': {
                    (0.9, 1.0): AlertSeverity.HIGH,
                    (0.7, 0.9): AlertSeverity.MEDIUM,
                    (0.5, 0.7): AlertSeverity.LOW
                },
                'cooldown_minutes': 30
            },
            'compliance_risk': {
                'threshold': self.config['thresholds']['compliance_risk'],
                'severity_mapping': {
                    (0.9, 1.0): AlertSeverity.CRITICAL,
                    (0.75, 0.9): AlertSeverity.HIGH,
                    (0.6, 0.75): AlertSeverity.MEDIUM
                },
                'cooldown_minutes': 60
            },
            'anomaly_detection': {
                'threshold': self.config['thresholds']['anomaly_score'],
                'severity': AlertSeverity.MEDIUM,
                'cooldown_minutes': 45
            }
        }

    def _initialize_channels(self) -> Dict[str, AlertChannel]:
        """Initialize notification channels."""
        channels = {}

        # Email channel
        if self.config['channels']['email']['enabled']:
            channels['email'] = EmailAlertChannel(self.config['channels']['email'])

        # Slack channel
        if self.config['channels']['slack']['enabled']:
            channels['slack'] = SlackAlertChannel(self.config['channels']['slack'])

        # Webhook channel
        if self.config['channels']['webhook']['enabled']:
            channels['webhook'] = WebhookAlertChannel(self.config['channels']['webhook'])

        self.logger.info(f"Initialized {len(channels)} notification channels")
        return channels

    def load_models(self) -> None:
        """Load ML models for prediction."""
        model_paths = self.config['models']

        try:
            # Load quality predictor
            if Path(model_paths['quality_predictor_path']).exists():
                self.quality_predictor = QualityPredictor()
                self.quality_predictor.load_models(model_paths['quality_predictor_path'])
                self.logger.info("Quality predictor loaded")

            # Load theater classifier
            if Path(model_paths['theater_classifier_path']).exists():
                self.theater_classifier = TheaterClassifier()
                self.theater_classifier.load_models(model_paths['theater_classifier_path'])
                self.logger.info("Theater classifier loaded")

            # Load compliance forecaster
            if Path(model_paths['compliance_forecaster_path']).exists():
                self.compliance_forecaster = ComplianceForecaster()
                self.compliance_forecaster.load_models(model_paths['compliance_forecaster_path'])
                self.logger.info("Compliance forecaster loaded")

        except Exception as e:
            self.logger.error(f"Failed to load models: {e}")

    def analyze_and_alert(self, data: Dict[str, Any]) -> List[Alert]:
        """
        Analyze data and generate appropriate alerts.

        Args:
            data: Data to analyze (code changes, metrics, etc.)

        Returns:
            List of generated alerts
        """
        alerts = []
        current_time = datetime.now()

        # Quality analysis
        if self.quality_predictor and 'code_data' in data:
            quality_alerts = self._analyze_quality(data['code_data'], current_time)
            alerts.extend(quality_alerts)

        # Theater detection
        if self.theater_classifier and 'change_data' in data:
            theater_alerts = self._analyze_theater(data['change_data'], current_time)
            alerts.extend(theater_alerts)

        # Compliance analysis
        if self.compliance_forecaster and 'compliance_data' in data:
            compliance_alerts = self._analyze_compliance(data['compliance_data'], current_time)
            alerts.extend(compliance_alerts)

        # Process alerts (deduplication, routing, etc.)
        processed_alerts = self._process_alerts(alerts)

        # Send notifications
        asyncio.create_task(self._send_notifications(processed_alerts))

        return processed_alerts

    def _analyze_quality(self, code_data: Dict[str, Any], timestamp: datetime) -> List[Alert]:
        """Analyze code quality and generate alerts."""
        alerts = []

        try:
            prediction = self.quality_predictor.predict_quality(code_data)

            # Quality degradation alert
            if prediction['quality_prediction'] == 0:
                confidence = prediction['confidence']
                severity = self._determine_severity(
                    confidence,
                    self.alert_rules['quality_degradation']['severity_mapping']
                )

                alert = Alert(
                    id=f"quality_{timestamp.strftime('%Y%m%d_%H%M%S')}_{hash(str(code_data)) % 10000}",
                    type=AlertType.QUALITY_DEGRADATION,
                    severity=severity,
                    timestamp=timestamp,
                    title="Code Quality Degradation Detected",
                    message=f"Low quality code detected with {confidence:.2f} confidence",
                    details={
                        'prediction': prediction['quality_prediction'],
                        'confidence': confidence,
                        'patterns': prediction['anti_patterns'],
                        'recommendation': prediction['recommendation']
                    },
                    source='quality_predictor',
                    tags=['quality', 'ml_prediction']
                )
                alerts.append(alert)

            # Anomaly detection alert
            if prediction['is_anomaly']:
                alert = Alert(
                    id=f"anomaly_{timestamp.strftime('%Y%m%d_%H%M%S')}_{hash(str(code_data)) % 10000}",
                    type=AlertType.ANOMALY_DETECTION,
                    severity=AlertSeverity.MEDIUM,
                    timestamp=timestamp,
                    title="Code Anomaly Detected",
                    message="Unusual code patterns detected requiring review",
                    details={
                        'anomaly_score': prediction['anomaly_score'],
                        'patterns': prediction['anti_patterns']
                    },
                    source='quality_predictor',
                    tags=['anomaly', 'quality']
                )
                alerts.append(alert)

        except Exception as e:
            self.logger.error(f"Quality analysis failed: {e}")

        return alerts

    def _analyze_theater(self, change_data: Dict[str, Any], timestamp: datetime) -> List[Alert]:
        """Analyze for performance theater and generate alerts."""
        alerts = []

        try:
            prediction = self.theater_classifier.predict_theater(change_data)

            if prediction['is_theater']:
                theater_prob = prediction['theater_probability']
                severity = self._determine_severity(
                    theater_prob,
                    self.alert_rules['theater_detection']['severity_mapping']
                )

                alert = Alert(
                    id=f"theater_{timestamp.strftime('%Y%m%d_%H%M%S')}_{hash(str(change_data)) % 10000}",
                    type=AlertType.THEATER_DETECTION,
                    severity=severity,
                    timestamp=timestamp,
                    title="Performance Theater Detected",
                    message=f"Theatrical changes detected with {theater_prob:.2f} probability",
                    details={
                        'theater_probability': theater_prob,
                        'confidence': prediction['confidence'],
                        'gaming_detection': prediction['gaming_detection'],
                        'explanation': prediction['explanation'],
                        'recommendation': prediction['recommendation']
                    },
                    source='theater_classifier',
                    tags=['theater', 'ml_prediction', 'performance']
                )
                alerts.append(alert)

        except Exception as e:
            self.logger.error(f"Theater analysis failed: {e}")

        return alerts

    def _analyze_compliance(self, compliance_data: Dict[str, Any], timestamp: datetime) -> List[Alert]:
        """Analyze compliance and generate alerts."""
        alerts = []

        try:
            # Risk assessment
            risk_result = self.compliance_forecaster.calculate_risk_score(compliance_data)
            risk_score = risk_result['overall_risk_score']

            if risk_score >= self.alert_rules['compliance_risk']['threshold']:
                severity = self._determine_severity(
                    risk_score,
                    self.alert_rules['compliance_risk']['severity_mapping']
                )

                alert = Alert(
                    id=f"compliance_{timestamp.strftime('%Y%m%d_%H%M%S')}_{hash(str(compliance_data)) % 10000}",
                    type=AlertType.COMPLIANCE_VIOLATION,
                    severity=severity,
                    timestamp=timestamp,
                    title="Compliance Risk Detected",
                    message=f"High compliance risk detected (score: {risk_score:.2f})",
                    details={
                        'risk_score': risk_score,
                        'risk_level': risk_result['risk_level'],
                        'component_scores': risk_result['component_scores'],
                        'predicted_violations': risk_result['predicted_violations'],
                        'recommendations': risk_result['mitigation_recommendations']
                    },
                    source='compliance_forecaster',
                    tags=['compliance', 'risk', 'ml_prediction']
                )
                alerts.append(alert)

            # Drift detection
            historical_data = compliance_data.get('history', [])
            if len(historical_data) >= 10:
                drift_result = self.compliance_forecaster.predict_compliance_drift(historical_data)

                if drift_result.get('drift_detected', False):
                    severity_map = {
                        'severe': AlertSeverity.CRITICAL,
                        'moderate': AlertSeverity.HIGH,
                        'mild': AlertSeverity.MEDIUM
                    }
                    severity = severity_map.get(drift_result.get('drift_severity', 'mild'), AlertSeverity.MEDIUM)

                    alert = Alert(
                        id=f"drift_{timestamp.strftime('%Y%m%d_%H%M%S')}_{hash(str(compliance_data)) % 10000}",
                        type=AlertType.TREND_WARNING,
                        severity=severity,
                        timestamp=timestamp,
                        title="Compliance Drift Detected",
                        message=f"Compliance drift trend detected: {drift_result.get('drift_severity', 'unknown')}",
                        details={
                            'drift_severity': drift_result.get('drift_severity'),
                            'trend_slope': drift_result.get('trend_slope'),
                            'confidence': drift_result.get('confidence'),
                            'predicted_score': drift_result.get('predicted_score_30d')
                        },
                        source='compliance_forecaster',
                        tags=['compliance', 'drift', 'trend']
                    )
                    alerts.append(alert)

        except Exception as e:
            self.logger.error(f"Compliance analysis failed: {e}")

        return alerts

    def _determine_severity(self, value: float, severity_mapping: Dict[Tuple[float, float], AlertSeverity]) -> AlertSeverity:
        """Determine alert severity based on value and mapping."""
        for (min_val, max_val), severity in severity_mapping.items():
            if min_val <= value < max_val:
                return severity

        # Default to medium if no mapping found
        return AlertSeverity.MEDIUM

    def _process_alerts(self, alerts: List[Alert]) -> List[Alert]:
        """Process alerts (deduplication, filtering, etc.)."""
        processed_alerts = []

        for alert in alerts:
            # Check for deduplication
            if not self._is_duplicate_alert(alert):
                # Add to active alerts
                self.active_alerts[alert.id] = alert
                processed_alerts.append(alert)

                # Update metrics
                self._update_alert_metrics(alert)

                self.logger.info(f"Alert generated: {alert.id} ({alert.severity.value})")

        return processed_alerts

    def _is_duplicate_alert(self, new_alert: Alert) -> bool:
        """Check if alert is a duplicate within deduplication window."""
        dedup_window = timedelta(minutes=self.config['alert_rules']['deduplication_window_minutes'])
        cutoff_time = new_alert.timestamp - dedup_window

        for existing_alert in self.active_alerts.values():
            if (existing_alert.type == new_alert.type and
                existing_alert.source == new_alert.source and
                existing_alert.timestamp > cutoff_time and
                not existing_alert.resolved):

                # Check if alerts are similar enough to be considered duplicates
                if self._alerts_similar(existing_alert, new_alert):
                    return True

        return False

    def _alerts_similar(self, alert1: Alert, alert2: Alert) -> bool:
        """Check if two alerts are similar enough to be considered duplicates."""
        # Simple similarity check - can be enhanced with more sophisticated logic
        return (alert1.type == alert2.type and
                alert1.severity == alert2.severity and
                alert1.source == alert2.source)

    def _update_alert_metrics(self, alert: Alert) -> None:
        """Update alert performance metrics."""
        self.alert_metrics['total_alerts'] += 1
        self.alert_metrics['alerts_by_severity'][alert.severity.value] += 1
        self.alert_metrics['alerts_by_type'][alert.type.value] += 1

    async def _send_notifications(self, alerts: List[Alert]) -> None:
        """Send notifications for alerts through all enabled channels."""
        for alert in alerts:
            # Determine which channels to use based on severity
            target_channels = self._get_channels_for_severity(alert.severity)

            for channel_name in target_channels:
                if channel_name in self.channels:
                    channel = self.channels[channel_name]
                    try:
                        success = await channel.send_alert(alert)
                        if success:
                            self.logger.info(f"Alert {alert.id} sent via {channel_name}")
                        else:
                            self.logger.warning(f"Failed to send alert {alert.id} via {channel_name}")
                    except Exception as e:
                        self.logger.error(f"Error sending alert {alert.id} via {channel_name}: {e}")

    def _get_channels_for_severity(self, severity: AlertSeverity) -> List[str]:
        """Get notification channels based on alert severity."""
        channel_mapping = {
            AlertSeverity.LOW: ['slack'],
            AlertSeverity.MEDIUM: ['slack', 'webhook'],
            AlertSeverity.HIGH: ['slack', 'webhook', 'email'],
            AlertSeverity.CRITICAL: ['slack', 'webhook', 'email']
        }

        return channel_mapping.get(severity, ['slack'])

    def resolve_alert(self, alert_id: str, resolved_by: str = None) -> bool:
        """Resolve an active alert."""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved = True
            alert.resolution_timestamp = datetime.now()
            alert.assigned_to = resolved_by

            # Move to history
            self.alert_history.append(alert)
            del self.active_alerts[alert_id]

            # Calculate resolution time
            resolution_time = (alert.resolution_timestamp - alert.timestamp).total_seconds() / 60
            self.alert_metrics['resolution_times'].append(resolution_time)

            self.logger.info(f"Alert {alert_id} resolved by {resolved_by}")
            return True

        return False

    def get_active_alerts(self, filter_by: Dict[str, Any] = None) -> List[Alert]:
        """Get list of active alerts with optional filtering."""
        alerts = list(self.active_alerts.values())

        if filter_by:
            # Apply filters
            if 'severity' in filter_by:
                alerts = [a for a in alerts if a.severity.value in filter_by['severity']]

            if 'type' in filter_by:
                alerts = [a for a in alerts if a.type.value in filter_by['type']]

            if 'source' in filter_by:
                alerts = [a for a in alerts if a.source in filter_by['source']]

        return sorted(alerts, key=lambda x: x.timestamp, reverse=True)

    def get_alert_metrics(self) -> Dict[str, Any]:
        """Get alert system performance metrics."""
        metrics = self.alert_metrics.copy()

        # Calculate averages
        if metrics['resolution_times']:
            metrics['avg_resolution_time_minutes'] = np.mean(metrics['resolution_times'])
            metrics['median_resolution_time_minutes'] = np.median(metrics['resolution_times'])

        metrics['active_alerts_count'] = len(self.active_alerts)
        metrics['total_alerts_resolved'] = len(self.alert_history)

        return metrics

    def cleanup_old_alerts(self) -> None:
        """Clean up old resolved alerts based on retention policy."""
        retention_days = self.config['monitoring']['history_retention_days']
        cutoff_time = datetime.now() - timedelta(days=retention_days)

        # Remove old alerts from history
        self.alert_history = [
            alert for alert in self.alert_history
            if alert.resolution_timestamp and alert.resolution_timestamp > cutoff_time
        ]

        # Auto-resolve old unresolved alerts
        auto_resolve_hours = self.config['alert_rules']['auto_resolve_hours']
        auto_resolve_cutoff = datetime.now() - timedelta(hours=auto_resolve_hours)

        auto_resolved = []
        for alert_id, alert in list(self.active_alerts.items()):
            if alert.timestamp < auto_resolve_cutoff:
                self.resolve_alert(alert_id, "auto_resolved")
                auto_resolved.append(alert_id)

        if auto_resolved:
            self.logger.info(f"Auto-resolved {len(auto_resolved)} old alerts")

# Example usage and configuration
if __name__ == "__main__":
    # Initialize alert system
    alert_system = MLAlertSystem()

    # Load ML models
    alert_system.load_models()

    # Example data analysis
    sample_data = {
        'code_data': {
            'metrics': {'lines_of_code': 500, 'cyclomatic_complexity': 15},
            'changes': {'lines_added': 100},
            'quality': {'test_coverage': 0.6}
        },
        'change_data': {
            'effort': {'development_time': 8},
            'impact': {'user_value': 0.1},
            'timing': {'near_deadline': 1}
        },
        'compliance_data': {
            'current_metrics': {'security_score': 0.7},
            'violations': {'critical_count': 2}
        }
    }

    # Analyze and generate alerts
    alerts = alert_system.analyze_and_alert(sample_data)
    print(f"Generated {len(alerts)} alerts")

    # Get alert metrics
    metrics = alert_system.get_alert_metrics()
    print(f"Alert metrics: {metrics}")