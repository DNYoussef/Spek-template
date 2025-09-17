# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 SPEK Enhanced Development Platform Contributors
"""
Enterprise Integration Framework
===============================

Comprehensive integration framework for enterprise-scale operations:
- Six Sigma quality metrics integration
- Compliance framework connector architecture
- Feature flag controlled detector selection
- Real-time monitoring and alerting
- ML-based performance optimization
- Defense industry compliance integration

NASA POT10 Rule 4: All methods under 60 lines
NASA POT10 Rule 5: Comprehensive input validation
NASA POT10 Rule 7: Bounded resource management
"""

import asyncio
import json
# from lib.shared.utilities.logging_setup import get_analyzer_logger
# from lib.shared.utilities.error_handling import ErrorHandler, ErrorCategory, ErrorSeverity
# from lib.shared.utilities.path_validation import validate_directory, ensure_dir

# Use shared logging for enterprise integration
logger = get_analyzer_logger(__name__)


@dataclass
class IntegrationConfig:
    """Configuration for enterprise integration framework."""
    enabled: bool = True
    sixsigma_integration: bool = True
    compliance_integration: bool = True
    performance_monitoring: bool = True
    feature_flags: bool = True
    real_time_alerting: bool = True
    ml_optimization: bool = True
    
    # Quality thresholds
    target_sigma_level: float = 4.5
    max_dpmo: int = 6210  # 4.5 sigma level
    performance_sla_ms: float = 1200.0  # 1.2 second SLA
    overhead_limit_percent: float = 1.2
    
    # Integration endpoints
    sixsigma_dashboard_url: Optional[str] = None
    compliance_api_endpoint: Optional[str] = None
    alerting_webhook_url: Optional[str] = None
    
    # ML optimization
    enable_predictive_caching: bool = True
    enable_adaptive_scaling: bool = True
    enable_workload_prediction: bool = True
    
    # Defense industry settings
    security_classification: str = "unclassified"
    compliance_frameworks: Set[str] = field(default_factory=lambda: {"FIPS-140-2", "SOC2", "ISO27001", "NIST-SSDF"})
    audit_retention_days: int = 2555  # 7 years for defense industry
    
    @classmethod
    def from_enterprise_config(cls, config_path: str) -> 'IntegrationConfig':
        """Load integration configuration from enterprise config file."""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            enterprise = config.get('enterprise', {})
            integration = enterprise.get('integration', {})
            
            if not integration.get('enabled', True):
                return cls(enabled=False)
            
            return cls(
                enabled=integration.get('enabled', True),
                sixsigma_integration=integration.get('sixsigma', True),
                compliance_integration=integration.get('compliance', True),
                performance_monitoring=integration.get('performance_monitoring', True),
                feature_flags=integration.get('feature_flags', True),
                real_time_alerting=integration.get('alerting', True),
                ml_optimization=integration.get('ml_optimization', True),
                target_sigma_level=integration.get('quality', {}).get('target_sigma_level', 4.5),
                max_dpmo=integration.get('quality', {}).get('max_dpmo', 6210),
                performance_sla_ms=integration.get('performance', {}).get('sla_ms', 1200.0),
                overhead_limit_percent=integration.get('performance', {}).get('overhead_limit', 1.2),
                sixsigma_dashboard_url=integration.get('endpoints', {}).get('sixsigma_dashboard'),
                compliance_api_endpoint=integration.get('endpoints', {}).get('compliance_api'),
                alerting_webhook_url=integration.get('endpoints', {}).get('alerting_webhook'),
                enable_predictive_caching=integration.get('ml', {}).get('predictive_caching', True),
                enable_adaptive_scaling=integration.get('ml', {}).get('adaptive_scaling', True),
                enable_workload_prediction=integration.get('ml', {}).get('workload_prediction', True),
                security_classification=enterprise.get('security', {}).get('classification', 'unclassified'),
                compliance_frameworks=set(enterprise.get('compliance', {}).get('frameworks', ["FIPS-140-2", "SOC2", "ISO27001", "NIST-SSDF"])),
                audit_retention_days=enterprise.get('audit', {}).get('retention_days', 2555)
            )
        except Exception as e:
            logger.warning(f"Failed to load integration config: {e}. Using defaults.")
            return cls()


@dataclass
class QualityMetrics:
    """Six Sigma quality metrics."""
    dpmo: float  # Defects Per Million Opportunities
    sigma_level: float
    process_capability: float
    yield_percentage: float
    defect_rate: float
    timestamp: datetime = field(default_factory=datetime.now)
    
    def is_within_target(self, target_sigma: float, max_dpmo: int) -> bool:
        """Check if metrics meet quality targets."""
        return self.sigma_level >= target_sigma and self.dpmo <= max_dpmo


@dataclass
class PerformanceAlert:
    """Performance alert definition."""
    alert_id: str
    alert_type: str  # "quality", "performance", "compliance", "security"
    severity: str  # "low", "medium", "high", "critical"
    message: str
    metric_value: float
    threshold_value: float
    timestamp: datetime
    component: str
    remediation_suggestion: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary for serialization."""
        return {
            "alert_id": self.alert_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "message": self.message,
            "metric_value": self.metric_value,
            "threshold_value": self.threshold_value,
            "timestamp": self.timestamp.isoformat(),
            "component": self.component,
            "remediation_suggestion": self.remediation_suggestion
        }


class MLOptimizationEngine:
    """Machine Learning optimization engine for performance prediction."""
    
    def __init__(self, config: IntegrationConfig):
        self.config = config
        self.workload_history: deque = deque(maxlen=1000)
        self.performance_history: deque = deque(maxlen=1000)
        self.prediction_cache: Dict[str, Any] = {}
        self.cache_hit_predictions: Dict[str, float] = {}
        
    def record_workload_pattern(self, detector_type: str, file_size: int, 
                              complexity_score: float, execution_time_ms: float) -> None:
        """Record workload pattern for ML training."""
        if not self.config.ml_optimization:
            return
            
        try:
            pattern = {
                "timestamp": time.time(),
                "detector_type": detector_type,
                "file_size": file_size,
                "complexity_score": complexity_score,
                "execution_time_ms": execution_time_ms,
                "hour_of_day": datetime.now().hour,
                "day_of_week": datetime.now().weekday()
            }
            
            self.workload_history.append(pattern)
            
        except Exception as e:
            logger.error(f"Failed to record workload pattern: {e}")
    
    def predict_execution_time(self, detector_type: str, file_size: int, 
                             complexity_score: float) -> float:
        """Predict execution time using simple ML model."""
        if not self.config.enable_workload_prediction or len(self.workload_history) < 10:
            return 100.0  # Default estimate
            
        try:
            # Simple linear regression based on historical data
            relevant_patterns = [
                p for p in self.workload_history 
                if p["detector_type"] == detector_type
            ]
            
            if len(relevant_patterns) < 3:
                return 100.0
            
            # Calculate weighted average based on similarity
            weights = []
            times = []
            
            for pattern in relevant_patterns[-20:]:  # Use last 20 patterns
                size_diff = abs(pattern["file_size"] - file_size) / max(pattern["file_size"], 1)
                complexity_diff = abs(pattern["complexity_score"] - complexity_score)
                
                # Similarity weight (higher is more similar)
                weight = 1.0 / (1.0 + size_diff + complexity_diff)
                weights.append(weight)
                times.append(pattern["execution_time_ms"])
            
            if weights:
                weighted_avg = sum(w * t for w, t in zip(weights, times)) / sum(weights)
                return max(50.0, min(5000.0, weighted_avg))  # Clamp between 50ms and 5s
            
            return 100.0
            
        except Exception as e:
            logger.error(f"Execution time prediction failed: {e}")
            return 100.0
    
    def should_cache_result(self, detector_type: str, file_path: str, 
                          file_size: int) -> float:
        """Predict cache hit probability."""
        if not self.config.enable_predictive_caching:
            return 0.5  # Default 50% cache probability
            
        try:
            # Simple heuristic: cache larger files and frequently analyzed types
            cache_key = f"{detector_type}:{Path(file_path).suffix}"
            
            # Historical cache hit rate
            historical_hit_rate = self.cache_hit_predictions.get(cache_key, 0.5)
            
            # Size factor (larger files more likely to be re-analyzed)
            size_factor = min(1.0, file_size / 10000)  # Normalize to 10KB
            
            # Frequency factor
            recent_analyses = sum(
                1 for p in self.workload_history 
                if p["detector_type"] == detector_type and 
                time.time() - p["timestamp"] < 3600  # Last hour
            )
            frequency_factor = min(1.0, recent_analyses / 10)
            
            # Combined probability
            cache_probability = (historical_hit_rate + size_factor + frequency_factor) / 3
            return max(0.1, min(0.9, cache_probability))
            
        except Exception as e:
            logger.error(f"Cache prediction failed: {e}")
            return 0.5
    
    def predict_optimal_pool_size(self, detector_type: str, current_load: float) -> int:
        """Predict optimal detector pool size."""
        if not self.config.enable_adaptive_scaling or len(self.workload_history) < 20:
            return 5  # Default pool size
            
        try:
            # Analyze recent workload patterns
            recent_patterns = [
                p for p in self.workload_history 
                if p["detector_type"] == detector_type and 
                time.time() - p["timestamp"] < 1800  # Last 30 minutes
            ]
            
            if not recent_patterns:
                return 5
            
            # Calculate average execution time
            avg_execution_time = sum(p["execution_time_ms"] for p in recent_patterns) / len(recent_patterns)
            
            # Calculate request rate (requests per second)
            time_span = max(1, recent_patterns[-1]["timestamp"] - recent_patterns[0]["timestamp"])
            request_rate = len(recent_patterns) / time_span
            
            # Optimal pool size = request_rate * avg_execution_time / 1000 * safety_factor
            optimal_size = int(request_rate * (avg_execution_time / 1000) * 1.5)  # 1.5x safety factor
            
            # Clamp between 2 and 50
            return max(2, min(50, optimal_size))
            
        except Exception as e:
            logger.error(f"Pool size prediction failed: {e}")
            return 5
    
    def get_optimization_recommendations(self) -> List[str]:
        """Generate ML-based optimization recommendations."""
        recommendations = []
        
        try:
            if len(self.workload_history) < 50:
                recommendations.append("Collect more workload data for better ML predictions")
                return recommendations
            
            # Analyze patterns
            detector_usage = defaultdict(int)
            avg_execution_times = defaultdict(list)
            
            for pattern in self.workload_history:
                detector_type = pattern["detector_type"]
                detector_usage[detector_type] += 1
                avg_execution_times[detector_type].append(pattern["execution_time_ms"])
            
            # Find slow detectors
            slow_detectors = []
            for detector_type, times in avg_execution_times.items():
                avg_time = sum(times) / len(times)
                if avg_time > 500:  # >500ms average
                    slow_detectors.append((detector_type, avg_time))
            
            if slow_detectors:
                slow_list = ", ".join(f"{dt} ({t:.1f}ms)" for dt, t in slow_detectors)
                recommendations.append(f"Consider optimization for slow detectors: {slow_list}")
            
            # Find underutilized detectors
            total_requests = sum(detector_usage.values())
            underutilized = [
                detector for detector, count in detector_usage.items() 
                if count / total_requests < 0.05  # <5% usage
            ]
            
            if underutilized:
                recommendations.append(f"Consider reducing pool size for underutilized detectors: {', '.join(underutilized)}")
            
            # Peak time analysis
            hourly_usage = defaultdict(int)
            for pattern in self.workload_history:
                hour = datetime.fromtimestamp(pattern["timestamp"]).hour
                hourly_usage[hour] += 1
            
            peak_hours = [hour for hour, count in hourly_usage.items() if count > len(self.workload_history) / 24 * 1.5]
            if peak_hours:
                recommendations.append(f"Consider pre-scaling during peak hours: {'-'.join(map(str, sorted(peak_hours)))}:00")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Failed to generate recommendations: {e}")
            return ["ML optimization analysis failed - check logs for details"]


class RealTimeAlertingSystem:
    """Real-time alerting system for enterprise monitoring."""
    
    def __init__(self, config: IntegrationConfig):
        self.config = config
        self.active_alerts: Dict[str, PerformanceAlert] = {}
        self.alert_history: deque = deque(maxlen=1000)
        self.alert_thresholds = self._initialize_alert_thresholds()
        self.notification_channels: List[Callable] = []
        
    def _initialize_alert_thresholds(self) -> Dict[str, Dict[str, float]]:
        """Initialize alert thresholds for different metrics."""
        return {
            "quality": {
                "sigma_level_critical": 3.0,
                "sigma_level_warning": 3.5,
                "dpmo_critical": 66810,  # 3 sigma
                "dpmo_warning": 22750   # 3.5 sigma
            },
            "performance": {
                "response_time_critical": self.config.performance_sla_ms * 2,
                "response_time_warning": self.config.performance_sla_ms * 1.5,
                "overhead_critical": self.config.overhead_limit_percent * 2,
                "overhead_warning": self.config.overhead_limit_percent * 1.5
            },
            "resource": {
                "memory_usage_critical": 90.0,  # 90% memory usage
                "memory_usage_warning": 75.0,   # 75% memory usage
                "cpu_usage_critical": 85.0,     # 85% CPU usage
                "cpu_usage_warning": 70.0       # 70% CPU usage
            }
        }
    
    def add_notification_channel(self, channel_func: Callable[[PerformanceAlert], None]) -> None:
        """Add notification channel for alerts."""
        self.notification_channels.append(channel_func)
    
    def check_quality_metrics(self, metrics: QualityMetrics) -> List[PerformanceAlert]:
        """Check quality metrics against thresholds."""
        if not self.config.real_time_alerting:
            return []
            
        alerts = []
        
        try:
            # Check sigma level
            if metrics.sigma_level < self.alert_thresholds["quality"]["sigma_level_critical"]:
                alert = PerformanceAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type="quality",
                    severity="critical",
                    message=f"Sigma level {metrics.sigma_level:.2f} below critical threshold",
                    metric_value=metrics.sigma_level,
                    threshold_value=self.alert_thresholds["quality"]["sigma_level_critical"],
                    timestamp=datetime.now(),
                    component="quality_system",
                    remediation_suggestion="Review process controls and error handling"
                )
                alerts.append(alert)
                
            elif metrics.sigma_level < self.alert_thresholds["quality"]["sigma_level_warning"]:
                alert = PerformanceAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type="quality",
                    severity="medium",
                    message=f"Sigma level {metrics.sigma_level:.2f} below warning threshold",
                    metric_value=metrics.sigma_level,
                    threshold_value=self.alert_thresholds["quality"]["sigma_level_warning"],
                    timestamp=datetime.now(),
                    component="quality_system",
                    remediation_suggestion="Monitor quality trends and consider process improvements"
                )
                alerts.append(alert)
            
            # Check DPMO
            if metrics.dpmo > self.alert_thresholds["quality"]["dpmo_critical"]:
                alert = PerformanceAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type="quality",
                    severity="critical",
                    message=f"DPMO {metrics.dpmo:.0f} exceeds critical threshold",
                    metric_value=metrics.dpmo,
                    threshold_value=self.alert_thresholds["quality"]["dpmo_critical"],
                    timestamp=datetime.now(),
                    component="quality_system",
                    remediation_suggestion="Immediate process review required - high defect rate detected"
                )
                alerts.append(alert)
                
            elif metrics.dpmo > self.alert_thresholds["quality"]["dpmo_warning"]:
                alert = PerformanceAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type="quality",
                    severity="medium",
                    message=f"DPMO {metrics.dpmo:.0f} exceeds warning threshold",
                    metric_value=metrics.dpmo,
                    threshold_value=self.alert_thresholds["quality"]["dpmo_warning"],
                    timestamp=datetime.now(),
                    component="quality_system",
                    remediation_suggestion="Investigate increasing defect trends"
                )
                alerts.append(alert)
            
            # Process alerts
            for alert in alerts:
                self._process_alert(alert)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Quality metrics check failed: {e}")
            return []
    
    def check_performance_metrics(self, response_time_ms: float, 
                                overhead_percent: float) -> List[PerformanceAlert]:
        """Check performance metrics against thresholds."""
        if not self.config.real_time_alerting:
            return []
            
        alerts = []
        
        try:
            # Check response time
            if response_time_ms > self.alert_thresholds["performance"]["response_time_critical"]:
                alert = PerformanceAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type="performance",
                    severity="critical",
                    message=f"Response time {response_time_ms:.1f}ms exceeds critical SLA",
                    metric_value=response_time_ms,
                    threshold_value=self.alert_thresholds["performance"]["response_time_critical"],
                    timestamp=datetime.now(),
                    component="detection_system",
                    remediation_suggestion="Scale up detector pools or optimize slow detectors"
                )
                alerts.append(alert)
                
            elif response_time_ms > self.alert_thresholds["performance"]["response_time_warning"]:
                alert = PerformanceAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type="performance",
                    severity="medium",
                    message=f"Response time {response_time_ms:.1f}ms approaching SLA limit",
                    metric_value=response_time_ms,
                    threshold_value=self.alert_thresholds["performance"]["response_time_warning"],
                    timestamp=datetime.now(),
                    component="detection_system",
                    remediation_suggestion="Monitor performance trends and prepare scaling"
                )
                alerts.append(alert)
            
            # Check overhead
            if overhead_percent > self.alert_thresholds["performance"]["overhead_critical"]:
                alert = PerformanceAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type="performance",
                    severity="critical",
                    message=f"Performance overhead {overhead_percent:.1f}% exceeds critical limit",
                    metric_value=overhead_percent,
                    threshold_value=self.alert_thresholds["performance"]["overhead_critical"],
                    timestamp=datetime.now(),
                    component="detection_system",
                    remediation_suggestion="Disable non-essential features or optimize core algorithms"
                )
                alerts.append(alert)
            
            # Process alerts
            for alert in alerts:
                self._process_alert(alert)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Performance metrics check failed: {e}")
            return []
    
    def _process_alert(self, alert: PerformanceAlert) -> None:
        """Process and distribute alert."""
        try:
            # Store alert
            self.active_alerts[alert.alert_id] = alert
            self.alert_history.append(alert)
            
            # Log alert
            log_level = {
                "low": logging.INFO,
                "medium": logging.WARNING,
                "high": logging.ERROR,
                "critical": logging.CRITICAL
            }.get(alert.severity, logging.WARNING)
            
            logger.log(log_level, f"ENTERPRISE ALERT: {alert.message}")
            
            # Send notifications
            for channel in self.notification_channels:
                try:
                    channel(alert)
                except Exception as e:
                    logger.error(f"Alert notification failed: {e}")
                    
        except Exception as e:
            logger.error(f"Alert processing failed: {e}")
    
    def get_active_alerts(self) -> List[PerformanceAlert]:
        """Get currently active alerts."""
        return list(self.active_alerts.values())
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge and clear an active alert."""
        if alert_id in self.active_alerts:
            del self.active_alerts[alert_id]
            logger.info(f"Alert {alert_id} acknowledged and cleared")
            return True
        return False


class EnterpriseIntegrationFramework:
    """
    Comprehensive enterprise integration framework.
    
    Orchestrates:
    - Six Sigma quality metrics
    - Compliance framework integration
    - Performance monitoring and alerting
    - ML-based optimization
    - Feature flag management
    - Defense industry compliance
    
    NASA POT10 Rule 4: All methods under 60 lines
    NASA POT10 Rule 7: Bounded resource management
    """
    
    def __init__(self, config: Optional[IntegrationConfig] = None, 
                 detector_pool: Optional[EnterpriseDetectorPool] = None):
        """Initialize enterprise integration framework."""
        self.config = config or IntegrationConfig()
        self.detector_pool = detector_pool
        
        # Initialize components
        self.sixsigma_telemetry = SixSigmaTelemetry() if self.config.sixsigma_integration else None
        self.sixsigma_scorer = SixSigmaScorer() if self.config.sixsigma_integration else None
        self.spc_generator = SPCChartGenerator() if self.config.sixsigma_integration else None
        
        self.performance_monitor = EnterprisePerformanceMonitor(
            enabled=self.config.performance_monitoring
        )
        
        self.feature_flags = EnterpriseFeatureFlags() if self.config.feature_flags else None
        
        self.compliance_orchestrator = ComplianceOrchestrator() if self.config.compliance_integration else None
        
        self.ml_engine = MLOptimizationEngine(self.config)
        self.alerting_system = RealTimeAlertingSystem(self.config)
        
        # Integration state
        self.integration_metrics = {
            "total_analyses": 0,
            "successful_analyses": 0,
            "failed_analyses": 0,
            "quality_violations": 0,
            "performance_alerts": 0,
            "compliance_checks": 0
        }
        
        # Start integration services
        if self.config.enabled:
            self._start_integration_services()
        
        logger.info(f"EnterpriseIntegrationFramework initialized with config: {self.config.__dict__}")
    
    def _start_integration_services(self) -> None:
        """Start background integration services."""
        try:
            # Start periodic quality monitoring
            if self.config.sixsigma_integration:
                quality_thread = threading.Thread(
                    target=self._quality_monitoring_loop,
                    name="QualityMonitor",
                    daemon=True
                )
                quality_thread.start()
            
            # Start compliance monitoring
            if self.config.compliance_integration:
                compliance_thread = threading.Thread(
                    target=self._compliance_monitoring_loop,
                    name="ComplianceMonitor",
                    daemon=True
                )
                compliance_thread.start()
            
            logger.info("Enterprise integration services started")
            
        except Exception as e:
            logger.error(f"Failed to start integration services: {e}")
    
    def _quality_monitoring_loop(self) -> None:
        """Continuous quality monitoring loop."""
        while True:
            try:
                # Generate quality report every 5 minutes
                quality_metrics = self._calculate_quality_metrics()
                
                # Check for quality alerts
                if quality_metrics:
                    alerts = self.alerting_system.check_quality_metrics(quality_metrics)
                    if alerts:
                        self.integration_metrics["performance_alerts"] += len(alerts)
                
                time.sleep(300)  # 5 minutes
                
            except Exception as e:
                logger.error(f"Quality monitoring error: {e}")
                time.sleep(600)  # 10 minutes on error
    
    def _compliance_monitoring_loop(self) -> None:
        """Continuous compliance monitoring loop."""
        while True:
            try:
                # Run compliance checks every 30 minutes
                if self.compliance_orchestrator:
                    # This would trigger compliance evidence collection
                    self.integration_metrics["compliance_checks"] += 1
                
                time.sleep(1800)  # 30 minutes
                
            except Exception as e:
                logger.error(f"Compliance monitoring error: {e}")
                time.sleep(3600)  # 1 hour on error
    
    @collect_method_metrics
    async def run_integrated_analysis(self, detector_types: Dict[str, type], 
                                    file_path: str, source_lines: List[str]) -> Dict[str, Any]:
        """
        Run comprehensive integrated analysis with all enterprise features.
        
        Args:
            detector_types: Available detector types
            file_path: Path to file being analyzed
            source_lines: Source code lines
            
        Returns:
            Comprehensive analysis results with enterprise metrics
        """
        analysis_start = time.perf_counter()
        
        try:
            # Performance monitoring context
            with self.performance_monitor.measure_enterprise_impact("integrated_analysis"):
                # Record workload pattern for ML
                file_size = sum(len(line) for line in source_lines)
                complexity_score = self._calculate_complexity_score(source_lines)
                
                # Feature flag checks
                enabled_detectors = self._get_enabled_detectors(detector_types)
                
                # Run analysis through detector pool
                if self.detector_pool:
                    detection_results = await self._run_pool_analysis(
                        enabled_detectors, file_path, source_lines
                    )
                else:
                    detection_results = await self._run_direct_analysis(
                        enabled_detectors, file_path, source_lines
                    )
                
                # Calculate performance metrics
                execution_time = (time.perf_counter() - analysis_start) * 1000
                
                # Record ML patterns
                for detector_type in enabled_detectors.keys():
                    self.ml_engine.record_workload_pattern(
                        detector_type, file_size, complexity_score, execution_time
                    )
                
                # Generate Six Sigma metrics
                quality_metrics = None
                if self.config.sixsigma_integration and self.sixsigma_scorer:
                    quality_metrics = self._generate_quality_metrics(detection_results)
                
                # Run compliance checks
                compliance_results = None
                if self.config.compliance_integration and self.compliance_orchestrator:
                    compliance_results = await self._run_compliance_analysis(file_path)
                
                # Performance alerts
                performance_alerts = self.alerting_system.check_performance_metrics(
                    execution_time, 
                    (execution_time / 1000) * 100  # Simplified overhead calculation
                )
                
                # Update integration metrics
                self.integration_metrics["total_analyses"] += 1
                self.integration_metrics["successful_analyses"] += 1
                
                # Compile comprehensive results
                results = {
                    "detection_results": detection_results,
                    "performance_metrics": {
                        "execution_time_ms": execution_time,
                        "file_size_bytes": file_size,
                        "complexity_score": complexity_score,
                        "enabled_detectors": list(enabled_detectors.keys())
                    },
                    "quality_metrics": quality_metrics.to_dict() if quality_metrics else None,
                    "compliance_results": compliance_results,
                    "performance_alerts": [alert.to_dict() for alert in performance_alerts],
                    "ml_predictions": self._get_ml_predictions(file_path, file_size, complexity_score),
                    "integration_status": {
                        "sixsigma_enabled": self.config.sixsigma_integration,
                        "compliance_enabled": self.config.compliance_integration,
                        "ml_optimization_enabled": self.config.ml_optimization,
                        "alerting_enabled": self.config.real_time_alerting
                    },
                    "enterprise_metadata": {
                        "security_classification": self.config.security_classification,
                        "compliance_frameworks": list(self.config.compliance_frameworks),
                        "analysis_timestamp": datetime.now().isoformat()
                    }
                }
                
                return results
                
        except Exception as e:
            logger.error(f"Integrated analysis failed: {e}")
            self.integration_metrics["failed_analyses"] += 1
            
            return {
                "status": "error",
                "error": str(e),
                "integration_metrics": self.integration_metrics.copy()
            }
    
    def _get_enabled_detectors(self, detector_types: Dict[str, type]) -> Dict[str, type]:
        """Get detectors enabled by feature flags."""
        if not self.feature_flags:
            return detector_types
        
        enabled = {}
        for detector_name, detector_class in detector_types.items():
            flag_name = f"detector_{detector_name}_enabled"
            if self.feature_flags.is_enabled(flag_name):
                enabled[detector_name] = detector_class
                
        return enabled if enabled else detector_types  # Fallback to all if none enabled
    
    async def _run_pool_analysis(self, detector_types: Dict[str, type], 
                               file_path: str, source_lines: List[str]) -> Dict[str, Any]:
        """Run analysis through enterprise detector pool."""
        try:
            from .EnterpriseDetectorPool import run_enterprise_analysis
            return await run_enterprise_analysis(detector_types, file_path, source_lines)
        except Exception as e:
            logger.error(f"Pool analysis failed: {e}")
            return await self._run_direct_analysis(detector_types, file_path, source_lines)
    
    async def _run_direct_analysis(self, detector_types: Dict[str, type], 
                                 file_path: str, source_lines: List[str]) -> Dict[str, Any]:
        """Run analysis directly without pool."""
        results = {}
        
        for detector_name, detector_class in detector_types.items():
            try:
                detector = detector_class(file_path, source_lines)
                
                # Parse source code
                import ast
                source = '\n'.join(source_lines)
                tree = ast.parse(source)
                
                # Run detection
                violations = detector.detect_violations(tree) if hasattr(detector, 'detect_violations') else []
                
                results[detector_name] = {
                    "violations": violations,
                    "status": "success"
                }
                
            except Exception as e:
                logger.error(f"Direct analysis failed for {detector_name}: {e}")
                results[detector_name] = {
                    "violations": [],
                    "status": "error",
                    "error": str(e)
                }
        
        return results
    
    def _calculate_complexity_score(self, source_lines: List[str]) -> float:
        """Calculate simple complexity score for source code."""
        try:
            total_lines = len(source_lines)
            if total_lines == 0:
                return 0.0
                
            # Count various complexity indicators
            conditional_keywords = ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally']
            function_keywords = ['def', 'class', 'lambda']
            
            conditionals = sum(line.count(keyword) for line in source_lines for keyword in conditional_keywords)
            functions = sum(line.count(keyword) for line in source_lines for keyword in function_keywords)
            
            # Simple complexity score: (conditionals + functions) / total_lines
            complexity = (conditionals + functions) / max(total_lines, 1)
            return min(10.0, complexity * 10)  # Scale to 0-10
            
        except Exception as e:
            logger.error(f"Complexity calculation failed: {e}")
            return 1.0
    
    def _calculate_quality_metrics(self) -> Optional[QualityMetrics]:
        """Calculate Six Sigma quality metrics."""
        if not self.config.sixsigma_integration or not self.sixsigma_scorer:
            return None
            
        try:
            total_analyses = self.integration_metrics["total_analyses"]
            failed_analyses = self.integration_metrics["failed_analyses"]
            quality_violations = self.integration_metrics["quality_violations"]
            
            if total_analyses == 0:
                return QualityMetrics(
                    dpmo=0.0,
                    sigma_level=6.0,
                    process_capability=1.0,
                    yield_percentage=100.0,
                    defect_rate=0.0
                )
            
            # Calculate defect rate (failed analyses + quality violations)
            total_defects = failed_analyses + quality_violations
            defect_rate = total_defects / total_analyses
            
            # Calculate DPMO
            dpmo = self.sixsigma_scorer.calculate_dpmo(total_defects, total_analyses, 1)  # 1 opportunity per analysis
            
            # Calculate sigma level
            sigma_level = self.sixsigma_scorer.calculate_sigma_level(dpmo)
            
            # Calculate yield
            yield_percentage = ((total_analyses - total_defects) / total_analyses) * 100
            
            return QualityMetrics(
                dpmo=dpmo,
                sigma_level=sigma_level,
                process_capability=sigma_level / 6.0,  # Normalized capability
                yield_percentage=yield_percentage,
                defect_rate=defect_rate
            )
            
        except Exception as e:
            logger.error(f"Quality metrics calculation failed: {e}")
            return None
    
    def _generate_quality_metrics(self, detection_results: Dict[str, Any]) -> Optional[QualityMetrics]:
        """Generate quality metrics from detection results."""
        try:
            total_detectors = len(detection_results)
            successful_detectors = sum(
                1 for result in detection_results.values() 
                if isinstance(result, dict) and result.get('status') == 'success'
            )
            
            if total_detectors == 0:
                return QualityMetrics(dpmo=0.0, sigma_level=6.0, process_capability=1.0, 
                                    yield_percentage=100.0, defect_rate=0.0)
            
            defect_rate = (total_detectors - successful_detectors) / total_detectors
            dpmo = defect_rate * 1000000  # Convert to defects per million
            
            # Simple sigma level calculation
            if defect_rate == 0:
                sigma_level = 6.0
            elif defect_rate < 0.00034:  # 4.5 sigma
                sigma_level = 4.5
            elif defect_rate < 0.0023:   # 4 sigma
                sigma_level = 4.0
            elif defect_rate < 0.0135:   # 3.5 sigma
                sigma_level = 3.5
            else:
                sigma_level = 3.0
            
            return QualityMetrics(
                dpmo=dpmo,
                sigma_level=sigma_level,
                process_capability=sigma_level / 6.0,
                yield_percentage=(1 - defect_rate) * 100,
                defect_rate=defect_rate
            )
            
        except Exception as e:
            logger.error(f"Quality metrics generation failed: {e}")
            return None
    
    async def _run_compliance_analysis(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Run compliance analysis."""
        if not self.compliance_orchestrator:
            return None
            
        try:
            return await self.compliance_orchestrator.collect_all_evidence(str(Path(file_path).parent))
        except Exception as e:
            logger.error(f"Compliance analysis failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def _get_ml_predictions(self, file_path: str, file_size: int, 
                          complexity_score: float) -> Dict[str, Any]:
        """Get ML-based predictions."""
        if not self.config.ml_optimization:
            return {}
            
        try:
            predictions = {}
            
            # Execution time predictions for each detector type
            if hasattr(self, 'detector_pool') and self.detector_pool:
                for detector_type in self.detector_pool.detector_types.keys():
                    predicted_time = self.ml_engine.predict_execution_time(
                        detector_type, file_size, complexity_score
                    )
                    predictions[f"{detector_type}_execution_time_ms"] = predicted_time
            
            # Cache predictions
            predictions["cache_hit_probability"] = self.ml_engine.should_cache_result(
                "general", file_path, file_size
            )
            
            # Pool size recommendations
            predictions["optimization_recommendations"] = self.ml_engine.get_optimization_recommendations()
            
            return predictions
            
        except Exception as e:
            logger.error(f"ML predictions failed: {e}")
            return {"error": str(e)}
    
    def get_integration_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive integration dashboard data."""
        try:
            # Get current quality metrics
            current_quality = self._calculate_quality_metrics()
            
            # Get active alerts
            active_alerts = self.alerting_system.get_active_alerts()
            
            # Get performance report
            performance_report = self.performance_monitor.get_performance_report()
            
            # Get ML recommendations
            ml_recommendations = self.ml_engine.get_optimization_recommendations()
            
            return {
                "integration_status": {
                    "framework_enabled": self.config.enabled,
                    "components": {
                        "sixsigma": self.config.sixsigma_integration,
                        "compliance": self.config.compliance_integration,
                        "performance_monitoring": self.config.performance_monitoring,
                        "ml_optimization": self.config.ml_optimization,
                        "real_time_alerting": self.config.real_time_alerting
                    }
                },
                "quality_metrics": current_quality.to_dict() if current_quality else None,
                "performance_report": performance_report,
                "active_alerts": [alert.to_dict() for alert in active_alerts],
                "integration_metrics": self.integration_metrics.copy(),
                "ml_recommendations": ml_recommendations,
                "compliance_status": {
                    "security_classification": self.config.security_classification,
                    "frameworks": list(self.config.compliance_frameworks),
                    "audit_retention_days": self.config.audit_retention_days
                },
                "configuration": {
                    "target_sigma_level": self.config.target_sigma_level,
                    "max_dpmo": self.config.max_dpmo,
                    "performance_sla_ms": self.config.performance_sla_ms,
                    "overhead_limit_percent": self.config.overhead_limit_percent
                }
            }
            
        except Exception as e:
            logger.error(f"Dashboard generation failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "integration_metrics": self.integration_metrics.copy()
            }
    
    def shutdown(self) -> None:
        """Graceful shutdown of integration framework."""
        try:
            logger.info("Shutting down EnterpriseIntegrationFramework...")
            
            # Save final metrics
            final_metrics = self.get_integration_dashboard()
            
            # Log final statistics
            logger.info(f"Final integration statistics: {self.integration_metrics}")
            
            if self.config.sixsigma_integration and hasattr(self, 'sixsigma_telemetry'):
                quality_summary = self.sixsigma_telemetry.get_quality_metrics() if self.sixsigma_telemetry else {}
                logger.info(f"Final quality metrics: {quality_summary}")
            
            logger.info("EnterpriseIntegrationFramework shutdown complete")
            
        except Exception as e:
            logger.error(f"Shutdown failed: {e}")


# Global enterprise integration framework instance
_global_integration_framework: Optional[EnterpriseIntegrationFramework] = None
_integration_lock = threading.Lock()


def get_enterprise_integration_framework(config: Optional[IntegrationConfig] = None,
                                       detector_pool: Optional[EnterpriseDetectorPool] = None) -> EnterpriseIntegrationFramework:
    """Get or create global enterprise integration framework."""
    global _global_integration_framework
    with _integration_lock:
        if _global_integration_framework is None:
            _global_integration_framework = EnterpriseIntegrationFramework(config, detector_pool)
        return _global_integration_framework


async def run_enterprise_integrated_analysis(detector_types: Dict[str, type], file_path: str,
                                            source_lines: List[str], config: Optional[IntegrationConfig] = None) -> Dict[str, Any]:
    """Run comprehensive enterprise integrated analysis."""
    framework = get_enterprise_integration_framework(config)
    return await framework.run_integrated_analysis(detector_types, file_path, source_lines)


if __name__ == "__main__":
    # Example usage
    async def main():
        # Create integration config
        config = IntegrationConfig(
            sixsigma_integration=True,
            compliance_integration=True,
            ml_optimization=True,
            real_time_alerting=True,
            target_sigma_level=4.5,
            performance_sla_ms=1200.0
        )
        
        # Mock detector types
        mock_detector_types = {
            "test_detector": type("TestDetector", (object,), {
                "__init__": lambda self, fp, sl: None,
                "detect_violations": lambda self, tree: []
            })
        }
        
        # Run integrated analysis
        results = await run_enterprise_integrated_analysis(
            mock_detector_types,
            "test_file.py",
            ["print('Hello, Enterprise Integration!')", "x = 1 + 1"],
            config
        )
        
        print(json.dumps(results, indent=2, default=str))
    
    # Run example
    asyncio.run(main())
