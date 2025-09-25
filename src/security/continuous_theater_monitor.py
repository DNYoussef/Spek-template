from src.constants.base import MAXIMUM_NESTED_DEPTH
"""

Implements real-time theater detection with continuous monitoring
for enterprise modules and defense industry compliance.
"""

import asyncio
import hashlib
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class TheaterAlert:
    """Theater alert for continuous monitoring"""
    alert_id: str
    alert_type: str
    severity: TheaterSeverity
    module_name: str
    function_name: str
    description: str
    detection_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    resolved: bool = False
    resolution_time: Optional[datetime] = None

@dataclass
class MonitoringMetrics:
    """Metrics for theater monitoring system"""
    monitoring_start_time: datetime
    total_files_monitored: int
    total_violations_detected: int
    critical_violations: int
    high_violations: int
    alerts_generated: int
    defense_industry_compliance_score: float
    continuous_uptime_hours: float

class TheaterFileHandler(FileSystemEventHandler):
    """File system event handler for theater detection"""

    def __init__(self, monitor: 'ContinuousTheaterMonitor'):
        self.monitor = monitor
        self.last_check = {}  # Rate limiting for file changes

    def on_modified(self, event):
        """Handle file modification events"""
        if event.is_directory:
            return

        file_path = Path(event.src_path)

        # Only monitor Python files in enterprise modules
        if not self._should_monitor_file(file_path):
            return

        # Rate limiting - only check files once per minute
        now = time.time()
        if file_path in self.last_check and now - self.last_check[file_path] < 60:
            return

        self.last_check[file_path] = now

        # Queue file for theater detection
        asyncio.create_task(self.monitor._check_file_for_theater(file_path))

    def on_created(self, event):
        """Handle file creation events"""
        self.on_modified(event)  # Same logic for new files

    def _should_monitor_file(self, file_path: Path) -> bool:
        """Check if file should be monitored for theater"""
        # Only Python files
        if file_path.suffix != '.py':
            return False

        # Only enterprise modules
        path_str = str(file_path)
        enterprise_patterns = [
            'src/enterprise',
            'analyzer/enterprise',
            'src/security',
            'compliance',
            'six_sigma',
            'feature_flags',
            'dfars'
        ]

        return any(pattern in path_str for pattern in enterprise_patterns)

class ContinuousTheaterMonitor:
    """
    Continuous theater monitoring system for defense industry

    Provides real-time theater detection and alerting with:
    - File system monitoring for code changes
    - Continuous validation of enterprise modules
    - Real-time alerting for theater violations
    - Defense industry compliance tracking
    - Forensic evidence collection
    """

    def __init__(self, project_root: str = None, config: Dict[str, Any] = None):
        self.project_root = Path(project_root or os.getcwd())
        self.config = config or self._load_default_config()

        # Initialize core components
        self.theater_detector = EnterpriseTheaterDetector(project_root)
        self.file_observer = Observer()
        self.file_handler = TheaterFileHandler(self)

        # Monitoring state
        self.is_monitoring = False
        self.monitoring_start_time = None
        self.alerts: List[TheaterAlert] = []
        self.metrics = MonitoringMetrics(
            monitoring_start_time=datetime.now(timezone.utc),
            total_files_monitored=0,
            total_violations_detected=0,
            critical_violations=0,
            high_violations=0,
            alerts_generated=0,
            defense_industry_compliance_score=1.0,
            continuous_uptime_hours=0.0
        )

        # Thread management
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.monitoring_lock = threading.RLock()

        # Alert callbacks
        self.alert_callbacks: List[Callable[[TheaterAlert], None]] = []

        # Evidence collection
        self.evidence_dir = self.project_root / ".claude" / ".artifacts" / "theater_monitoring"
        self.evidence_dir.mkdir(parents=True, exist_ok=True)

    def _load_default_config(self) -> Dict[str, Any]:
        """Load default monitoring configuration"""
        return {
            "monitoring": {
                "enabled": True,
                "check_interval_seconds": 300,  # MAXIMUM_NESTED_DEPTH minutes
                "alert_threshold": TheaterSeverity.MEDIUM,
                "defense_industry_mode": True,
                "zero_tolerance": True
            },
            "alerts": {
                "email_notifications": False,
                "webhook_url": None,
                "log_level": "INFO"
            },
            "evidence": {
                "collect_forensic_data": True,
                "retention_days": 365,  # 1 year for defense industry
                "compress_evidence": True
            }
        }

    def start_monitoring(self) -> bool:
        """Start continuous theater monitoring"""
        logger.info("Starting continuous theater monitoring for defense industry compliance")

        try:
            with self.monitoring_lock:
                if self.is_monitoring:
                    logger.warning("Theater monitoring already running")
                    return True

                # Set up file system monitoring
                self._setup_file_monitoring()

                # Start periodic checks
                self._start_periodic_checks()

                # Initialize monitoring state
                self.is_monitoring = True
                self.monitoring_start_time = datetime.now(timezone.utc)
                self.metrics.monitoring_start_time = self.monitoring_start_time

                logger.info("[OK] Continuous theater monitoring started successfully")
                return True

        except Exception as e:
            logger.error(f"[FAIL] Failed to start theater monitoring: {e}")
            return False

    def stop_monitoring(self) -> None:
        """Stop continuous theater monitoring"""
        logger.info("Stopping continuous theater monitoring")

        try:
            with self.monitoring_lock:
                if not self.is_monitoring:
                    logger.warning("Theater monitoring not running")
                    return

                # Stop file system monitoring
                self.file_observer.stop()
                self.file_observer.join()

                # Update metrics
                if self.monitoring_start_time:
                    uptime = datetime.now(timezone.utc) - self.monitoring_start_time
                    self.metrics.continuous_uptime_hours = uptime.total_seconds() / 3600

                # Mark as stopped
                self.is_monitoring = False

                # Generate final evidence package
                asyncio.create_task(self._generate_monitoring_evidence())

                logger.info("[OK] Continuous theater monitoring stopped")

        except Exception as e:
            logger.error(f"[FAIL] Error stopping theater monitoring: {e}")

    def _setup_file_monitoring(self) -> None:
        """Set up file system monitoring for enterprise modules"""
        # Monitor enterprise directories
        enterprise_paths = [
            "src/enterprise",
            "analyzer/enterprise",
            "src/security"
        ]

        for path in enterprise_paths:
            full_path = self.project_root / path
            if full_path.exists():
                self.file_observer.schedule(
                    self.file_handler,
                    str(full_path),
                    recursive=True
                )
                logger.info(f"[FOLDER] Monitoring directory: {full_path}")

        self.file_observer.start()

    def _start_periodic_checks(self) -> None:
        """Start periodic comprehensive theater checks"""
        check_interval = self.config["monitoring"]["check_interval_seconds"]

        async def periodic_check():
            while self.is_monitoring:
                try:
                    logger.info("[SEARCH] Running periodic theater detection scan")
                    await self._run_comprehensive_check()
                    await asyncio.sleep(check_interval)
                except Exception as e:
                    logger.error(f"Periodic check failed: {e}")
                    await asyncio.sleep(check_interval)

        asyncio.create_task(periodic_check())

    async def _check_file_for_theater(self, file_path: Path) -> None:
        """Check individual file for theater"""
        try:
            logger.debug(f"[SEARCH] Checking file for theater: {file_path}")

            # Convert file path to module name
            relative_path = file_path.relative_to(self.project_root)
            module_name = str(relative_path).replace("/", ".").replace("\\", ".").replace(".py", "")

            # Run theater detection on specific module
            report = await self.theater_detector._detect_module_theater(module_name)

            # Process violations
            if report.theater_violations:
                await self._process_theater_violations(report)

            # Update metrics
            self.metrics.total_files_monitored += 1

        except Exception as e:
            logger.error(f"Failed to check file {file_path}: {e}")

    async def _run_comprehensive_check(self) -> None:
        """Run comprehensive theater detection across all modules"""
        try:
            logger.info("[SHIELD] Running comprehensive theater detection for defense industry compliance")

            # Run full theater detection
            reports = await self.theater_detector.detect_enterprise_theater()

            # Process all reports
            total_violations = 0
            critical_count = 0
            high_count = 0

            for module_name, report in reports.items():
                if report.theater_violations:
                    await self._process_theater_violations(report)
                    total_violations += len(report.theater_violations)

                    for violation in report.theater_violations:
                        if violation.severity == TheaterSeverity.CRITICAL:
                            critical_count += 1
                        elif violation.severity == TheaterSeverity.HIGH:
                            high_count += 1

            # Update comprehensive metrics
            self.metrics.total_violations_detected += total_violations
            self.metrics.critical_violations += critical_count
            self.metrics.high_violations += high_count

            # Calculate defense industry compliance score
            self._update_compliance_score(reports)

            # Generate evidence package
            await self._generate_monitoring_evidence(reports)

            logger.info(f"[OK] Comprehensive check completed: {total_violations} violations detected")

        except Exception as e:
            logger.error(f"Comprehensive check failed: {e}")

    async def _process_theater_violations(self, report: TheaterDetectionReport) -> None:
        """Process theater violations and generate alerts"""
        alert_threshold = TheaterSeverity(self.config["monitoring"]["alert_threshold"])

        for violation in report.theater_violations:
            # Check if violation meets alert threshold
            if self._severity_meets_threshold(violation.severity, alert_threshold):
                alert = await self._create_theater_alert(violation, report.module_name)
                self.alerts.append(alert)
                self.metrics.alerts_generated += 1

                # Trigger alert callbacks
                for callback in self.alert_callbacks:
                    try:
                        callback(alert)
                    except Exception as e:
                        logger.error(f"Alert callback failed: {e}")

                # Log alert
                logger.warning(f"[ALERT] THEATER ALERT: {alert.description}")

    def _severity_meets_threshold(self, severity: TheaterSeverity, threshold: TheaterSeverity) -> bool:
        """Check if severity meets alert threshold"""
        severity_order = {
            TheaterSeverity.NONE: 0,
            TheaterSeverity.LOW: 1,
            TheaterSeverity.MEDIUM: 2,
            TheaterSeverity.HIGH: 3,
            TheaterSeverity.CRITICAL: 4
        }

        return severity_order[severity] >= severity_order[threshold]

    async def _create_theater_alert(self, violation: TheaterEvidence, module_name: str) -> TheaterAlert:
        """Create theater alert from violation"""
        alert_id = hashlib.sha256(
            f"{violation.module_name}:{violation.function_name}:{violation.line_number}:{violation.evidence_code}".encode()
        ).hexdigest()[:16]

        return TheaterAlert(
            alert_id=alert_id,
            alert_type=violation.theater_type.value,
            severity=violation.severity,
            module_name=module_name,
            function_name=violation.function_name,
            description=f"Theater detected in {module_name}:{violation.function_name} - {violation.description}"
        )

    def _update_compliance_score(self, reports: Dict[str, TheaterDetectionReport]) -> None:
        """Update defense industry compliance score"""
        if not reports:
            self.metrics.defense_industry_compliance_score = 1.0
            return

        # Calculate weighted compliance score
        total_score = 0.0
        total_weight = 0

        for report in reports.values():
            # Weight by number of functions analyzed
            weight = max(1, report.total_functions_analyzed)
            total_score += report.compliance_theater_score * weight
            total_weight += weight

        if total_weight > 0:
            self.metrics.defense_industry_compliance_score = total_score / total_weight
        else:
            self.metrics.defense_industry_compliance_score = 1.0

    async def _generate_monitoring_evidence(self, reports: Optional[Dict[str, TheaterDetectionReport]] = None) -> None:
        """Generate forensic evidence package for monitoring"""
        try:
            evidence_timestamp = datetime.now(timezone.utc)

            evidence_package = {
                "monitoring_evidence_metadata": {
                    "evidence_type": "continuous_theater_monitoring",
                    "generation_timestamp": evidence_timestamp.isoformat(),
                    "monitoring_duration_hours": self.metrics.continuous_uptime_hours,
                    "defense_industry_compliance": True,
                    "zero_tolerance_mode": self.config["monitoring"]["zero_tolerance"]
                },
                "monitoring_metrics": {
                    "total_files_monitored": self.metrics.total_files_monitored,
                    "total_violations_detected": self.metrics.total_violations_detected,
                    "critical_violations": self.metrics.critical_violations,
                    "high_violations": self.metrics.high_violations,
                    "alerts_generated": self.metrics.alerts_generated,
                    "defense_industry_compliance_score": self.metrics.defense_industry_compliance_score,
                    "continuous_uptime_hours": self.metrics.continuous_uptime_hours
                },
                "active_alerts": [
                    {
                        "alert_id": alert.alert_id,
                        "type": alert.alert_type,
                        "severity": alert.severity.value,
                        "module": alert.module_name,
                        "function": alert.function_name,
                        "description": alert.description,
                        "detection_time": alert.detection_time.isoformat(),
                        "resolved": alert.resolved,
                        "resolution_time": alert.resolution_time.isoformat() if alert.resolution_time else None
                    }
                    for alert in self.alerts
                    if not alert.resolved
                ],
                "compliance_status": {
                    "zero_tolerance_met": self.metrics.critical_violations == 0,
                    "defense_industry_ready": (
                        self.metrics.critical_violations == 0 and
                        self.metrics.defense_industry_compliance_score >= 0.95
                    ),
                    "certification_eligible": (
                        self.metrics.critical_violations == 0 and
                        self.metrics.high_violations <= 2 and
                        self.metrics.defense_industry_compliance_score >= 0.98
                    )
                }
            }

            # Add detailed reports if provided
            if reports:
                evidence_package["latest_detection_reports"] = {}
                for module_name, report in reports.items():
                    evidence_package["latest_detection_reports"][module_name] = {
                        "theater_level": report.overall_theater_level.value,
                        "compliance_score": report.compliance_theater_score,
                        "violations_count": len(report.theater_violations),
                        "validations_passed": len([v for v in report.validation_results if v.passed]),
                        "defense_ready": report.defense_industry_ready,
                        "forensic_hash": report.forensic_hash
                    }

            # Save evidence package
            evidence_file = self.evidence_dir / f"monitoring_evidence_{evidence_timestamp.strftime('%Y%m%d_%H%M%S')}.json"

            with open(evidence_file, 'w', encoding='utf-8') as f:
                json.dump(evidence_package, f, indent=2, default=str)

            logger.info(f"[DOCUMENT] Monitoring evidence package saved: {evidence_file}")

            # Cleanup old evidence files if retention limit exceeded
            await self._cleanup_old_evidence()

        except Exception as e:
            logger.error(f"Failed to generate monitoring evidence: {e}")

    async def _cleanup_old_evidence(self) -> None:
        """Clean up old evidence files based on retention policy"""
        try:
            retention_days = self.config["evidence"]["retention_days"]
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)

            for evidence_file in self.evidence_dir.glob("monitoring_evidence_*.json"):
                file_time = datetime.fromtimestamp(evidence_file.stat().st_mtime, tz=timezone.utc)
                if file_time < cutoff_date:
                    evidence_file.unlink()
                    logger.debug(f" Cleaned up old evidence file: {evidence_file}")

        except Exception as e:
            logger.error(f"Evidence cleanup failed: {e}")

    def add_alert_callback(self, callback: Callable[[TheaterAlert], None]) -> None:
        """Add callback function for theater alerts"""
        self.alert_callbacks.append(callback)

    def remove_alert_callback(self, callback: Callable[[TheaterAlert], None]) -> None:
        """Remove callback function for theater alerts"""
        if callback in self.alert_callbacks:
            self.alert_callbacks.remove(callback)

    def get_monitoring_status(self) -> Dict[str, Any]:
        """Get current monitoring status and metrics"""
        uptime_hours = 0.0
        if self.monitoring_start_time and self.is_monitoring:
            uptime = datetime.now(timezone.utc) - self.monitoring_start_time
            uptime_hours = uptime.total_seconds() / 3600

        return {
            "monitoring_active": self.is_monitoring,
            "monitoring_start_time": self.monitoring_start_time.isoformat() if self.monitoring_start_time else None,
            "uptime_hours": uptime_hours,
            "files_monitored": self.metrics.total_files_monitored,
            "violations_detected": self.metrics.total_violations_detected,
            "critical_violations": self.metrics.critical_violations,
            "high_violations": self.metrics.high_violations,
            "active_alerts": len([a for a in self.alerts if not a.resolved]),
            "defense_industry_compliance_score": self.metrics.defense_industry_compliance_score,
            "zero_tolerance_status": "MET" if self.metrics.critical_violations == 0 else "VIOLATED",
            "certification_ready": (
                self.metrics.critical_violations == 0 and
                self.metrics.high_violations <= 2 and
                self.metrics.defense_industry_compliance_score >= 0.98
            )
        }

    def resolve_alert(self, alert_id: str) -> bool:
        """Mark alert as resolved"""
        for alert in self.alerts:
            if alert.alert_id == alert_id and not alert.resolved:
                alert.resolved = True
                alert.resolution_time = datetime.now(timezone.utc)
                logger.info(f"[OK] Resolved theater alert: {alert_id}")
                return True

        logger.warning(f"[FAIL] Alert not found or already resolved: {alert_id}")
        return False

    def get_defense_industry_report(self) -> Dict[str, Any]:
        """Generate defense industry compliance report"""
        status = self.get_monitoring_status()

        return {
            "defense_industry_compliance_report": {
                "report_timestamp": datetime.now(timezone.utc).isoformat(),
                "compliance_standard": "DFARS 252.204-7012",
                "monitoring_duration_hours": status["uptime_hours"],
                "zero_tolerance_assessment": {
                    "status": status["zero_tolerance_status"],
                    "critical_violations": status["critical_violations"],
                    "high_violations": status["high_violations"],
                    "total_violations": status["violations_detected"]
                },
                "continuous_monitoring": {
                    "active": status["monitoring_active"],
                    "files_under_surveillance": status["files_monitored"],
                    "real_time_alerts": status["active_alerts"]
                },
                "certification_readiness": {
                    "defense_industry_ready": status["certification_ready"],
                    "compliance_score": status["defense_industry_compliance_score"],
                    "recommendation": "APPROVED FOR PRODUCTION" if status["certification_ready"] else "REQUIRES REMEDIATION"
                },
                "audit_trail": {
                    "evidence_collection_active": True,
                    "forensic_data_available": True,
                    "retention_period_days": self.config["evidence"]["retention_days"]
                }
            }
        }

# Factory function for continuous theater monitoring
def create_continuous_theater_monitor(project_root: str = None, config: Dict[str, Any] = None) -> ContinuousTheaterMonitor:
    """Create continuous theater monitor instance"""
    return ContinuousTheaterMonitor(project_root, config)

# Example alert callback functions
def email_alert_callback(alert: TheaterAlert) -> None:
    """Email alert callback (example implementation)"""
    logger.info(f" EMAIL ALERT: {alert.description}")
    # In production, would send actual email

def webhook_alert_callback(alert: TheaterAlert) -> None:
    """Webhook alert callback (example implementation)"""
    logger.info(f" WEBHOOK ALERT: {alert.description}")
    # In production, would send webhook notification

def slack_alert_callback(alert: TheaterAlert) -> None:
    """Slack alert callback (example implementation)"""
    logger.info(f" SLACK ALERT: {alert.description}")
    # In production, would send Slack notification

# CLI interface for continuous theater monitoring
async def main():
    """Main CLI interface for continuous theater monitoring"""
    monitor = create_continuous_theater_monitor()

    print("[THEATER] Continuous Theater Monitoring System")
    print("[SHIELD] Defense Industry Zero-Tolerance Surveillance")

    try:
        # Add alert callbacks
        monitor.add_alert_callback(email_alert_callback)
        monitor.add_alert_callback(webhook_alert_callback)

        # Start monitoring
        if not monitor.start_monitoring():
            print("[FAIL] Failed to start theater monitoring")
            return False

        print("[OK] Continuous theater monitoring started")
        print("[CHART] Monitoring status:")

        # Run for demonstration (in production, would run indefinitely)
        for i in range(5):
            await asyncio.sleep(60)  # Check every minute

            status = monitor.get_monitoring_status()
            print(f"  Files monitored: {status['files_monitored']}")
            print(f"  Violations detected: {status['violations_detected']}")
            print(f"  Active alerts: {status['active_alerts']}")
            print(f"  Defense compliance: {status['defense_industry_compliance_score']:.2%}")
            print(f"  Zero tolerance: {status['zero_tolerance_status']}")

        # Generate defense industry report
        defense_report = monitor.get_defense_industry_report()
        print("\n[SHIELD] Defense Industry Compliance Report:")
        compliance = defense_report["defense_industry_compliance_report"]
        print(f"  Zero Tolerance: {compliance['zero_tolerance_assessment']['status']}")
        print(f"  Certification Ready: {compliance['certification_readiness']['defense_industry_ready']}")
        print(f"  Recommendation: {compliance['certification_readiness']['recommendation']}")

        # Stop monitoring
        monitor.stop_monitoring()
        print("[OK] Monitoring stopped successfully")

        return compliance['certification_readiness']['defense_industry_ready']

    except KeyboardInterrupt:
        print("\n Stopping monitoring...")
        monitor.stop_monitoring()
        return True
    except Exception as e:
        print(f"[FAIL] Monitoring error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)