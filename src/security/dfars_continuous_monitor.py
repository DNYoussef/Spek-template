from lib.shared.utilities import get_logger
from src.constants.base import MAXIMUM_NESTED_DEPTH

import asyncio
import json

import time
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field
import threading
import queue
import psutil
import hashlib

class MonitoringLevel(Enum):
    """Monitoring intensity levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertType(Enum):
    """Alert types for DFARS compliance"""
    COMPLIANCE_VIOLATION = "COMPLIANCE_VIOLATION"
    CUI_EXPOSURE = "CUI_EXPOSURE"
    ACCESS_ANOMALY = "ACCESS_ANOMALY"
    AUDIT_INTEGRITY = "AUDIT_INTEGRITY"
    INCIDENT_ESCALATION = "INCIDENT_ESCALATION"
    SYSTEM_PERFORMANCE = "SYSTEM_PERFORMANCE"

@dataclass
class ComplianceAlert:
    """Compliance monitoring alert"""
    alert_id: str
    timestamp: datetime
    alert_type: AlertType
    severity: MonitoringLevel
    control_affected: str
    description: str
    metrics: Dict[str, Any]
    automated_response: List[str]
    escalation_required: bool = False

@dataclass
class SystemMetrics:
    """System performance and security metrics"""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_connections: int
    active_sessions: int
    failed_authentications: int
    cui_access_events: int
    audit_records_per_hour: int
    compliance_score: float

class PerformanceBaseline:
    """Performance baseline manager for anomaly detection"""

    def __init__(self):
        self.baselines: Dict[str, Dict] = {}
        self.historical_data: List[SystemMetrics] = []
        self.baseline_window = 24 * 7  # 7 days of hourly data

    def update_baseline(self, metric_name: str, value: float):
        """Update performance baseline"""
        if metric_name not in self.baselines:
            self.baselines[metric_name] = {
                'values': [],
                'mean': 0.0,
                'std_dev': 0.0,
                'min': float('inf'),
                'max': float('-inf')
            }

        baseline = self.baselines[metric_name]
        baseline['values'].append(value)

        # Keep only recent values for baseline
        if len(baseline['values']) > self.baseline_window:
            baseline['values'] = baseline['values'][-self.baseline_window:]

        # Calculate statistics
        values = baseline['values']
        baseline['mean'] = sum(values) / len(values)
        baseline['min'] = min(values)
        baseline['max'] = max(values)

        # Calculate standard deviation
        variance = sum((x - baseline['mean']) ** 2 for x in values) / len(values)
        baseline['std_dev'] = variance ** 0.5

    def is_anomaly(self, metric_name: str, value: float, threshold_std_devs: float = 2.0) -> bool:
        """Detect if a metric value is anomalous"""
        if metric_name not in self.baselines:
            return False

        baseline = self.baselines[metric_name]
        if baseline['std_dev'] == 0:
            return False

        # Check if value is beyond threshold standard deviations
        z_score = abs(value - baseline['mean']) / baseline['std_dev']
        return z_score > threshold_std_devs

    def get_baseline_summary(self) -> Dict[str, Dict]:
        """Get baseline summary for all metrics"""
        return {
            metric: {
                'mean': baseline['mean'],
                'std_dev': baseline['std_dev'],
                'min': baseline['min'],
                'max': baseline['max'],
                'sample_count': len(baseline['values'])
            }
            for metric, baseline in self.baselines.items()
        }

class CUIAccessMonitor:
    """Monitor CUI access patterns for anomalies"""

    def __init__(self):
        self.access_patterns: Dict[str, List[datetime]] = {}
        self.suspicious_patterns: Set[str] = set()
        self.access_thresholds = {
            'max_hourly_access': 50,
            'max_off_hours_access': 10,
            'unusual_time_threshold': 5  # accesses outside 8AM-6PM
        }

    def record_cui_access(self, user_id: str, resource: str, access_time: datetime):
        """Record CUI access for pattern analysis"""
        access_key = f"{user_id}:{resource}"

        if access_key not in self.access_patterns:
            self.access_patterns[access_key] = []

        self.access_patterns[access_key].append(access_time)

        # Keep only recent access records (last 30 days)
        cutoff_time = datetime.now() - timedelta(days=30)
        self.access_patterns[access_key] = [
            t for t in self.access_patterns[access_key] if t > cutoff_time
        ]

        # Check for suspicious patterns
        self._analyze_access_pattern(access_key)

    def _analyze_access_pattern(self, access_key: str):
        """Analyze access pattern for anomalies"""
        accesses = self.access_patterns[access_key]

        # Check hourly access rate
        recent_accesses = [a for a in accesses if a > datetime.now() - timedelta(hours=1)]
        if len(recent_accesses) > self.access_thresholds['max_hourly_access']:
            self.suspicious_patterns.add(f"{access_key}:HIGH_FREQUENCY")

        # Check off-hours access
        off_hours_accesses = [
            a for a in accesses
            if a.hour < 8 or a.hour > 18  # Outside 8AM-6PM
        ]
        if len(off_hours_accesses) > self.access_thresholds['max_off_hours_access']:
            self.suspicious_patterns.add(f"{access_key}:OFF_HOURS")

        # Check weekend access patterns
        weekend_accesses = [
            a for a in accesses
            if a.weekday() >= 5  # Saturday (5) or Sunday (6)
        ]
        if len(weekend_accesses) > self.access_thresholds['unusual_time_threshold']:
            self.suspicious_patterns.add(f"{access_key}:WEEKEND_ACCESS")

    def get_suspicious_patterns(self) -> List[Dict[str, Any]]:
        """Get list of suspicious access patterns"""
        patterns = []
        for pattern in self.suspicious_patterns:
            access_key, pattern_type = pattern.split(':', 1)
            user_id, resource = access_key.split(':', 1)

            patterns.append({
                'user_id': user_id,
                'resource': resource,
                'pattern_type': pattern_type,
                'access_count': len(self.access_patterns.get(access_key, [])),
                'risk_level': 'HIGH' if pattern_type in ['HIGH_FREQUENCY', 'OFF_HOURS'] else 'MEDIUM'
            })

        return patterns

class NetworkSecurityMonitor:
    """Monitor network security for DFARS compliance"""

    def __init__(self):
        self.connection_baselines: Dict[str, int] = {}
        self.suspicious_connections: Set[str] = set()
        self.blocked_ips: Set[str] = set()

    def monitor_network_connections(self) -> Dict[str, Any]:
        """Monitor network connections for anomalies"""
        connections = psutil.net_connections(kind='inet')

        metrics = {
            'total_connections': len(connections),
            'listening_ports': [],
            'established_connections': 0,
            'foreign_addresses': set(),
            'suspicious_activity': []
        }

        for conn in connections:
            if conn.status == 'LISTEN':
                metrics['listening_ports'].append(conn.laddr.port)
            elif conn.status == 'ESTABLISHED':
                metrics['established_connections'] += 1
                if conn.raddr:
                    metrics['foreign_addresses'].add(conn.raddr.ip)

        # Check for suspicious foreign addresses
        for ip in metrics['foreign_addresses']:
            if self._is_suspicious_ip(ip):
                metrics['suspicious_activity'].append({
                    'type': 'SUSPICIOUS_IP',
                    'ip_address': ip,
                    'risk_level': 'HIGH'
                })

        # Convert set to list for JSON serialization
        metrics['foreign_addresses'] = list(metrics['foreign_addresses'])

        return metrics

    def _is_suspicious_ip(self, ip_address: str) -> bool:
        """Check if IP address is suspicious"""
        # Check against blocked IPs
        if ip_address in self.blocked_ips:
            return True

        # Check for known malicious IP patterns (simplified)
        suspicious_patterns = [
            '10.0.0.',  # Internal networks from external
            '172.16.',  # Private ranges from external
            '192.168.'  # Private ranges from external
        ]

        # In production, check against threat intelligence feeds
        return any(ip_address.startswith(pattern) for pattern in suspicious_patterns)

    def add_blocked_ip(self, ip_address: str):
        """Add IP to blocked list"""
        self.blocked_ips.add(ip_address)

class DFARSContinuousMonitor:
    """Main DFARS continuous compliance monitoring system"""

    def __init__(self, dfars_workflow_system):
        self.dfars_system = dfars_workflow_system
        self.logger = get_logger("\1")

        # Monitoring components
        self.performance_baseline = PerformanceBaseline()
        self.cui_monitor = CUIAccessMonitor()
        self.network_monitor = NetworkSecurityMonitor()

        # Alert management
        self.alerts: List[ComplianceAlert] = []
        self.alert_queue = queue.Queue()
        self.monitoring_active = True

        # Monitoring intervals
        self.system_check_interval = 60  # 1 minute
        self.compliance_check_interval = 300  # MAXIMUM_NESTED_DEPTH minutes
        self.cui_scan_interval = 900  # 15 minutes

        # Start monitoring threads
        self._start_monitoring_threads()

    def _start_monitoring_threads(self):
        """Start background monitoring threads"""
        # System metrics monitoring
        self.system_thread = threading.Thread(target=self._system_monitoring_loop)
        self.system_thread.daemon = True
        self.system_thread.start()

        # Compliance monitoring
        self.compliance_thread = threading.Thread(target=self._compliance_monitoring_loop)
        self.compliance_thread.daemon = True
        self.compliance_thread.start()

        # Alert processing
        self.alert_thread = threading.Thread(target=self._alert_processing_loop)
        self.alert_thread.daemon = True
        self.alert_thread.start()

    def _system_monitoring_loop(self):
        """System performance monitoring loop"""
        while self.monitoring_active:
            try:
                metrics = self._collect_system_metrics()
                self._analyze_system_metrics(metrics)
                time.sleep(self.system_check_interval)
            except Exception as e:
                self.logger.error(f"System monitoring error: {e}")

    def _compliance_monitoring_loop(self):
        """DFARS compliance monitoring loop"""
        while self.monitoring_active:
            try:
                self._check_compliance_status()
                time.sleep(self.compliance_check_interval)
            except Exception as e:
                self.logger.error(f"Compliance monitoring error: {e}")

    def _alert_processing_loop(self):
        """Alert processing and response loop"""
        while self.monitoring_active:
            try:
                if not self.alert_queue.empty():
                    alert = self.alert_queue.get()
                    self._process_alert(alert)
                time.sleep(1)
            except Exception as e:
                self.logger.error(f"Alert processing error: {e}")

    def _collect_system_metrics(self) -> SystemMetrics:
        """Collect current system metrics"""
        # System performance metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # Network metrics
        network_metrics = self.network_monitor.monitor_network_connections()

        # DFARS-specific metrics
        active_sessions = len(self.dfars_system.access_manager.authenticated_users)

        # Calculate recent failed authentications
        recent_audit_records = [
            r for r in self.dfars_system.audit_manager.audit_records
            if r.timestamp > datetime.now() - timedelta(hours=1)
        ]
        failed_auths = len([
            r for r in recent_audit_records
            if r.action == "USER_LOGIN" and r.result == "FAILURE"
        ])

        # CUI access events
        cui_events = len([
            r for r in recent_audit_records
            if "CUI" in r.action
        ])

        # Calculate compliance score
        compliance_score = self._calculate_current_compliance_score()

        return SystemMetrics(
            timestamp=datetime.now(),
            cpu_usage=cpu_percent,
            memory_usage=memory.percent,
            disk_usage=disk.percent,
            network_connections=network_metrics['total_connections'],
            active_sessions=active_sessions,
            failed_authentications=failed_auths,
            cui_access_events=cui_events,
            audit_records_per_hour=len(recent_audit_records),
            compliance_score=compliance_score
        )

    def _analyze_system_metrics(self, metrics: SystemMetrics):
        """Analyze system metrics for anomalies"""
        # Update baselines
        metric_values = {
            'cpu_usage': metrics.cpu_usage,
            'memory_usage': metrics.memory_usage,
            'disk_usage': metrics.disk_usage,
            'network_connections': metrics.network_connections,
            'active_sessions': metrics.active_sessions,
            'failed_authentications': metrics.failed_authentications
        }

        for metric_name, value in metric_values.items():
            self.performance_baseline.update_baseline(metric_name, value)

        # Check for anomalies
        anomalies = []
        for metric_name, value in metric_values.items():
            if self.performance_baseline.is_anomaly(metric_name, value):
                anomalies.append({
                    'metric': metric_name,
                    'value': value,
                    'baseline_mean': self.performance_baseline.baselines[metric_name]['mean']
                })

        # Generate alerts for significant anomalies
        if anomalies:
            self._create_alert(
                AlertType.SYSTEM_PERFORMANCE,
                MonitoringLevel.MEDIUM,
                "SYSTEM_PERFORMANCE",
                f"Performance anomalies detected: {len(anomalies)} metrics",
                {'anomalies': anomalies, 'metrics': metric_values}
            )

        # Check specific thresholds
        if metrics.cpu_usage > 90:
            self._create_alert(
                AlertType.SYSTEM_PERFORMANCE,
                MonitoringLevel.HIGH,
                "SYSTEM_PERFORMANCE",
                f"High CPU usage: {metrics.cpu_usage}%",
                {'cpu_usage': metrics.cpu_usage}
            )

        if metrics.failed_authentications > 10:
            self._create_alert(
                AlertType.ACCESS_ANOMALY,
                MonitoringLevel.HIGH,
                "ACCESS_CONTROL",
                f"High number of failed authentications: {metrics.failed_authentications}",
                {'failed_authentications': metrics.failed_authentications}
            )

    def _check_compliance_status(self):
        """Check DFARS compliance status"""
        # Check audit trail integrity
        audit_integrity, audit_errors = self.dfars_system.audit_manager.verify_audit_integrity()
        if not audit_integrity:
            self._create_alert(
                AlertType.AUDIT_INTEGRITY,
                MonitoringLevel.CRITICAL,
                "AUDIT_ACCOUNTABILITY",
                "Audit trail integrity violation detected",
                {'audit_errors': audit_errors}
            )

        # Check for critical incidents exceeding 72-hour reporting
        critical_incidents = [
            incident for incident in self.dfars_system.incident_manager.incidents.values()
            if (incident.severity.value == "CRITICAL" and
                incident.status != "CLOSED" and
                (datetime.now() - incident.timestamp).total_seconds() > 72 * 3600)
        ]

        if critical_incidents:
            self._create_alert(
                AlertType.INCIDENT_ESCALATION,
                MonitoringLevel.CRITICAL,
                "INCIDENT_RESPONSE",
                f"{len(critical_incidents)} critical incidents exceed 72-hour reporting requirement",
                {'incident_ids': [i.incident_id for i in critical_incidents]}
            )

        # Check CUI access patterns
        suspicious_patterns = self.cui_monitor.get_suspicious_patterns()
        if suspicious_patterns:
            high_risk_patterns = [p for p in suspicious_patterns if p['risk_level'] == 'HIGH']
            if high_risk_patterns:
                self._create_alert(
                    AlertType.CUI_EXPOSURE,
                    MonitoringLevel.HIGH,
                    "CUI_PROTECTION",
                    f"Suspicious CUI access patterns detected: {len(high_risk_patterns)}",
                    {'patterns': high_risk_patterns}
                )

    def _calculate_current_compliance_score(self) -> float:
        """Calculate current compliance score"""
        if not hasattr(self.dfars_system.compliance_monitor, 'compliance_status'):
            return 0.0

        total_controls = len(self.dfars_system.compliance_monitor.compliance_status)
        if total_controls == 0:
            return 0.0

        compliant_controls = sum(
            1 for check in self.dfars_system.compliance_monitor.compliance_status.values()
            if check.status.value == "COMPLIANT"
        )

        return (compliant_controls / total_controls) * 100

    def _create_alert(self, alert_type: AlertType, severity: MonitoringLevel,
                    control: str, description: str, metrics: Dict[str, Any]):
        """Create compliance alert"""
        alert_id = f"ALERT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{hash(description) % 10000:04d}"

        # Determine automated response
        automated_response = self._get_automated_response(alert_type, severity)

        # Determine if escalation is required
        escalation_required = severity in [MonitoringLevel.HIGH, MonitoringLevel.CRITICAL]

        alert = ComplianceAlert(
            alert_id=alert_id,
            timestamp=datetime.now(),
            alert_type=alert_type,
            severity=severity,
            control_affected=control,
            description=description,
            metrics=metrics,
            automated_response=automated_response,
            escalation_required=escalation_required
        )

        self.alerts.append(alert)
        self.alert_queue.put(alert)

        self.logger.warning(f"Compliance alert created: {alert_id} - {description}")

    def _get_automated_response(self, alert_type: AlertType, severity: MonitoringLevel) -> List[str]:
        """Get automated response actions for alert"""
        responses = {
            AlertType.COMPLIANCE_VIOLATION: [
                "Log compliance violation",
                "Generate incident report",
                "Notify compliance team"
            ],
            AlertType.CUI_EXPOSURE: [
                "Lock affected CUI assets",
                "Notify security team",
                "Begin containment procedures"
            ],
            AlertType.ACCESS_ANOMALY: [
                "Review access logs",
                "Validate user permissions",
                "Consider account lockout"
            ],
            AlertType.AUDIT_INTEGRITY: [
                "Preserve audit evidence",
                "Begin forensic investigation",
                "Notify incident response team"
            ],
            AlertType.INCIDENT_ESCALATION: [
                "Escalate to management",
                "Prepare DoD notification",
                "Activate incident response team"
            ],
            AlertType.SYSTEM_PERFORMANCE: [
                "Monitor system resources",
                "Check for resource leaks",
                "Consider load balancing"
            ]
        }

        base_responses = responses.get(alert_type, ["Log alert", "Review manually"])

        if severity == MonitoringLevel.CRITICAL:
            base_responses.extend([
                "Immediate escalation required",
                "Activate emergency procedures"
            ])

        return base_responses

    def _process_alert(self, alert: ComplianceAlert):
        """Process and respond to compliance alert"""
        # Log alert processing
        self.logger.info(f"Processing alert {alert.alert_id}: {alert.description}")

        # Execute automated responses
        for response in alert.automated_response:
            self.logger.info(f"Automated response: {response}")

        # Create incident if escalation required
        if alert.escalation_required:
            self.dfars_system.incident_manager.create_incident(
                severity=getattr(self.dfars_system.incident_manager.IncidentSeverity, alert.severity.value,
                                self.dfars_system.incident_manager.IncidentSeverity.MEDIUM),
                control=getattr(self.dfars_system.incident_manager.DFARSControl,
                                alert.control_affected.replace('_', ''),
                                self.dfars_system.incident_manager.DFARSControl.AUDIT_ACCOUNTABILITY),
                description=f"Alert escalation: {alert.description}",
                affected_assets=[f"alert_{alert.alert_id}"]
            )

        # Create audit record
        self.dfars_system.audit_manager.create_audit_record(
            user_id="MONITORING_SYSTEM",
            action="ALERT_PROCESSED",
            resource=alert.alert_id,
            result="SUCCESS"
        )

    def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Get real-time monitoring dashboard"""
        recent_alerts = [
            alert for alert in self.alerts
            if alert.timestamp > datetime.now() - timedelta(hours=24)
        ]

        return {
            'monitoring_status': 'ACTIVE' if self.monitoring_active else 'INACTIVE',
            'last_update': datetime.now().isoformat(),
            'alerts_24h': len(recent_alerts),
            'alerts_by_severity': {
                severity.value: len([a for a in recent_alerts if a.severity == severity])
                for severity in MonitoringLevel
            },
            'alerts_by_type': {
                alert_type.value: len([a for a in recent_alerts if a.alert_type == alert_type])
                for alert_type in AlertType
            },
            'system_health': {
                'baseline_metrics': self.performance_baseline.get_baseline_summary(),
                'suspicious_cui_patterns': len(self.cui_monitor.get_suspicious_patterns()),
                'blocked_ips': len(self.network_monitor.blocked_ips)
            },
            'compliance_score': self._calculate_current_compliance_score()
        }

    def generate_monitoring_report(self) -> Dict[str, Any]:
        """Generate comprehensive monitoring report"""
        # Get recent alerts (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        recent_alerts = [alert for alert in self.alerts if alert.timestamp > week_ago]

        report = {
            'report_period': {
                'start': week_ago.isoformat(),
                'end': datetime.now().isoformat()
            },
            'alert_summary': {
                'total_alerts': len(recent_alerts),
                'critical_alerts': len([a for a in recent_alerts if a.severity == MonitoringLevel.CRITICAL]),
                'high_alerts': len([a for a in recent_alerts if a.severity == MonitoringLevel.HIGH]),
                'escalated_alerts': len([a for a in recent_alerts if a.escalation_required])
            },
            'compliance_trends': {
                'average_compliance_score': self._calculate_current_compliance_score(),
                'compliance_violations': len([
                    a for a in recent_alerts if a.alert_type == AlertType.COMPLIANCE_VIOLATION
                ])
            },
            'security_metrics': {
                'cui_access_anomalies': len(self.cui_monitor.get_suspicious_patterns()),
                'network_security_events': len([
                    a for a in recent_alerts if a.alert_type == AlertType.ACCESS_ANOMALY
                ]),
                'audit_integrity_issues': len([
                    a for a in recent_alerts if a.alert_type == AlertType.AUDIT_INTEGRITY
                ])
            },
            'system_performance': self.performance_baseline.get_baseline_summary(),
            'recommendations': self._generate_monitoring_recommendations(recent_alerts)
        }

        return report

    def _generate_monitoring_recommendations(self, recent_alerts: List[ComplianceAlert]) -> List[str]:
        """Generate monitoring recommendations based on alert patterns"""
        recommendations = []

        # Analyze alert patterns
        critical_count = len([a for a in recent_alerts if a.severity == MonitoringLevel.CRITICAL])
        cui_alerts = len([a for a in recent_alerts if a.alert_type == AlertType.CUI_EXPOSURE])
        access_alerts = len([a for a in recent_alerts if a.alert_type == AlertType.ACCESS_ANOMALY])

        if critical_count > 5:
            recommendations.append("High number of critical alerts - review incident response procedures")

        if cui_alerts > 0:
            recommendations.append("CUI exposure alerts detected - strengthen access controls and monitoring")

        if access_alerts > 10:
            recommendations.append("Multiple access anomalies - consider implementing adaptive authentication")

        # System performance recommendations
        baseline_summary = self.performance_baseline.get_baseline_summary()
        if 'cpu_usage' in baseline_summary and baseline_summary['cpu_usage']['mean'] > 70:
            recommendations.append("High average CPU usage - consider system optimization")

        if not recommendations:
            recommendations.append("No critical issues identified - continue current monitoring practices")

        return recommendations

    def stop_monitoring(self):
        """Stop continuous monitoring"""
        self.monitoring_active = False
        self.logger.info("DFARS continuous monitoring stopped")

# Example usage
async def main():
    """Demo of DFARS continuous monitoring"""
    print("DFARS Continuous Compliance Monitoring")
    print("=" * 50)

    # Mock DFARS system for demo
    class MockDFARSSystem:
        def __init__(self):
            from dfars_workflow_automation import DFARSWorkflowAutomation
            # Initialize with mock components

    # Initialize monitoring system

    print("Monitoring system would run continuously...")
    print("Features:")
    print("- Real-time compliance monitoring")
    print("- Automated alert generation")
    print("- Performance baseline tracking")
    print("- CUI access pattern analysis")
    print("- Network security monitoring")
    print("- Incident escalation automation")

if __name__ == "__main__":
    asyncio.run(main())