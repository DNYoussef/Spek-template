"""
Quality Monitor
Real-time data quality monitoring and alerting system
"""

import asyncio
from lib.shared.utilities import get_logger
logger = get_logger(__name__)
        self.validator = DataValidator()

        # Configuration
        self.monitoring_interval = 60.0  # seconds
        self.alert_cooldown = 300.0     # 5 minutes between same alerts
        self.quality_sla = 0.95         # 95% quality SLA

        # Storage
        self.quality_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.active_alerts: Dict[str, QualityAlert] = {}
        self.alert_history: deque = deque(maxlen=10000)

        # Quality rules
        self.quality_rules = self._load_quality_rules()

        # Alert callbacks
        self.alert_callbacks: List[Callable[[QualityAlert], None]] = []

        # Tracking
        self.last_alert_time: Dict[str, datetime] = {}
        self.quality_trends: Dict[str, List[float]] = defaultdict(list)

        # Background tasks
        self.monitoring_task: Optional[asyncio.Task] = None
        self.trending_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None

        self.running = False

    async def start(self):
        """Start quality monitoring"""
        self.logger.info("Starting data quality monitor")
        self.running = True

        # Start background tasks
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        self.trending_task = asyncio.create_task(self._trending_loop())
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop(self):
        """Stop quality monitoring"""
        self.logger.info("Stopping data quality monitor")
        self.running = False

        # Cancel tasks
        for task in [self.monitoring_task, self.trending_task, self.cleanup_task]:
            if task:
                task.cancel()

    async def monitor_data_quality(
        self,
        data: pd.DataFrame,
        source: str,
        symbol: Optional[str] = None,
        data_type: str = "ohlcv"
    ) -> QualityMetrics:
        """
        Monitor data quality for a dataset

        Args:
            data: DataFrame to monitor
            source: Data source name
            symbol: Optional symbol for context
            data_type: Type of data being monitored

        Returns:
            QualityMetrics with current quality assessment
        """
        start_time = time.time()

        try:
            # Validate data
            if data_type == "ohlcv":
                validation_result = self.validator.validate_ohlcv_data(data, symbol or "unknown")
            else:
                # Generic validation for other data types
                validation_result = self._validate_generic_data(data, source, symbol)

            # Calculate quality metrics
            metrics = self._calculate_quality_metrics(
                validation_result, data, source, symbol, data_type
            )

            # Store metrics
            metrics_key = f"{source}_{symbol}" if symbol else source
            self.quality_history[metrics_key].append(metrics)

            # Check for quality issues and generate alerts
            await self._check_quality_alerts(metrics, source, symbol)

            # Update quality trends
            self._update_quality_trends(metrics_key, metrics.overall_score)

            processing_time = (time.time() - start_time) * 1000
            self.logger.debug(f"Quality monitoring completed in {processing_time:.1f}ms")

            return metrics

        except Exception as e:
            self.logger.error(f"Quality monitoring error for {source}/{symbol}: {e}")

            # Return minimal metrics on error
            return QualityMetrics(
                timestamp=datetime.now(),
                source=source,
                symbol=symbol,
                overall_score=0.0,
                record_count=len(data) if not data.empty else 0,
                error_count=1
            )

    def _validate_generic_data(self, data: pd.DataFrame, source: str, symbol: Optional[str]) -> ValidationResult:
        """Generic data validation for non-OHLCV data"""
        issues = []
        metrics = {}

        try:
            # Basic structure checks
            if data.empty:
                issues.append({
                    "severity": "critical",
                    "category": "structure",
                    "description": "Dataset is empty"
                })
            else:
                # Check for missing values
                missing_ratio = data.isnull().sum().sum() / (len(data) * len(data.columns))
                if missing_ratio > 0.1:  # More than 10% missing
                    issues.append({
                        "severity": "warning",
                        "category": "completeness",
                        "description": f"High missing data ratio: {missing_ratio:.1%}"
                    })

                # Check for duplicate rows
                duplicate_ratio = data.duplicated().sum() / len(data)
                if duplicate_ratio > 0.05:  # More than 5% duplicates
                    issues.append({
                        "severity": "warning",
                        "category": "consistency",
                        "description": f"High duplicate ratio: {duplicate_ratio:.1%}"
                    })

            metrics = {
                "row_count": len(data),
                "column_count": len(data.columns),
                "missing_ratio": missing_ratio if not data.empty else 1.0,
                "duplicate_ratio": duplicate_ratio if not data.empty else 0.0
            }

            # Calculate simple score
            score = 1.0 - (len(issues) * 0.2)
            score = max(0.0, min(1.0, score))

            return ValidationResult(
                passed=score >= 0.7,
                score=score,
                issues=issues,
                metrics=metrics
            )

        except Exception as e:
            return ValidationResult(
                passed=False,
                score=0.0,
                issues=[{
                    "severity": "critical",
                    "category": "validation_error",
                    "description": f"Validation failed: {str(e)}"
                }]
            )

    def _calculate_quality_metrics(
        self,
        validation_result: ValidationResult,
        data: pd.DataFrame,
        source: str,
        symbol: Optional[str],
        data_type: str
    ) -> QualityMetrics:
        """Calculate comprehensive quality metrics"""

        # Extract base metrics from validation result
        completeness_score = validation_result.metrics.get("completeness_ratio", 0.0)
        accuracy_score = validation_result.score  # Overall validation score represents accuracy

        # Calculate consistency score
        consistency_score = self._calculate_consistency_score(validation_result.issues)

        # Calculate timeliness score
        timeliness_score = self._calculate_timeliness_score(data, source)

        # Calculate overall score (weighted average)
        weights = {
            "completeness": 0.25,
            "accuracy": 0.35,
            "consistency": 0.25,
            "timeliness": 0.15
        }

        overall_score = (
            completeness_score * weights["completeness"] +
            accuracy_score * weights["accuracy"] +
            consistency_score * weights["consistency"] +
            timeliness_score * weights["timeliness"]
        )

        return QualityMetrics(
            timestamp=datetime.now(),
            source=source,
            symbol=symbol,
            completeness_score=completeness_score,
            accuracy_score=accuracy_score,
            consistency_score=consistency_score,
            timeliness_score=timeliness_score,
            overall_score=overall_score,
            record_count=len(data) if not data.empty else 0,
            error_count=len([issue for issue in validation_result.issues
                           if isinstance(issue, dict) and issue.get("severity") in ["error", "critical"]]),
            validation_issues=validation_result.issues[:10]  # Store first 10 issues
        )

    def _calculate_consistency_score(self, issues: List[Dict[str, Any]]) -> float:
        """Calculate consistency score based on validation issues"""
        consistency_issues = [
            issue for issue in issues
            if isinstance(issue, dict) and issue.get("category") in ["ohlcv_integrity", "temporal", "business_rules"]
        ]

        if not consistency_issues:
            return 1.0

        # Penalize based on number and severity of consistency issues
        penalty = 0.0
        severity_weights = {"info": 0.01, "warning": 0.05, "error": 0.15, "critical": 0.30}

        for issue in consistency_issues:
            severity = issue.get("severity", "warning")
            penalty += severity_weights.get(severity, 0.05)

        return max(0.0, 1.0 - penalty)

    def _calculate_timeliness_score(self, data: pd.DataFrame, source: str) -> float:
        """Calculate timeliness score based on data freshness"""
        if data.empty or not isinstance(data.index, pd.DatetimeIndex):
            return 0.5  # Neutral score if no timestamp data

        try:
            latest_timestamp = data.index.max()
            current_time = datetime.now()

            # Handle timezone-aware timestamps
            if latest_timestamp.tz is not None:
                current_time = current_time.replace(tzinfo=latest_timestamp.tz)

            age_hours = (current_time - latest_timestamp).total_seconds() / 3600

            # Score based on data age (fresher data gets higher score)
            if age_hours <= 1:
                return 1.0
            elif age_hours <= 24:
                return 0.8
            elif age_hours <= 168:  # 1 week
                return 0.6
            elif age_hours <= 720:  # 1 month
                return 0.4
            else:
                return 0.2

        except Exception as e:
            self.logger.warning(f"Timeliness calculation error: {e}")
            return 0.5

    async def _check_quality_alerts(self, metrics: QualityMetrics, source: str, symbol: Optional[str]):
        """Check for quality issues and generate alerts"""
        current_time = datetime.now()
        alert_key = f"{source}_{symbol}" if symbol else source

        # Check if we're in cooldown period for this source
        if alert_key in self.last_alert_time:
            time_since_last = (current_time - self.last_alert_time[alert_key]).total_seconds()
            if time_since_last < self.alert_cooldown:
                return

        alerts_generated = []

        # Overall quality threshold alert
        if metrics.overall_score < self.quality_rules["min_overall_quality"]:
            alert = QualityAlert(
                id=f"quality_degradation_{alert_key}_{int(time.time())}",
                alert_type="quality_degradation",
                severity="warning" if metrics.overall_score > 0.5 else "critical",
                title=f"Data Quality Degradation - {source}",
                description=f"Overall quality score ({metrics.overall_score:.2f}) below threshold ({self.quality_rules['min_overall_quality']})",
                timestamp=current_time,
                source=source,
                symbol=symbol,
                metric_value=metrics.overall_score,
                threshold=self.quality_rules["min_overall_quality"]
            )
            alerts_generated.append(alert)

        # Completeness alert
        if metrics.completeness_score < self.quality_rules["min_completeness"]:
            alert = QualityAlert(
                id=f"completeness_{alert_key}_{int(time.time())}",
                alert_type="completeness_issue",
                severity="warning",
                title=f"Data Completeness Issue - {source}",
                description=f"Completeness score ({metrics.completeness_score:.2f}) below threshold",
                timestamp=current_time,
                source=source,
                symbol=symbol,
                metric_value=metrics.completeness_score,
                threshold=self.quality_rules["min_completeness"]
            )
            alerts_generated.append(alert)

        # High error count alert
        error_ratio = metrics.error_count / max(metrics.record_count, 1)
        if error_ratio > self.quality_rules["max_error_ratio"]:
            alert = QualityAlert(
                id=f"high_errors_{alert_key}_{int(time.time())}",
                alert_type="high_error_rate",
                severity="error",
                title=f"High Error Rate - {source}",
                description=f"Error ratio ({error_ratio:.2%}) exceeds threshold",
                timestamp=current_time,
                source=source,
                symbol=symbol,
                metric_value=error_ratio,
                threshold=self.quality_rules["max_error_ratio"]
            )
            alerts_generated.append(alert)

        # Process generated alerts
        for alert in alerts_generated:
            await self._process_alert(alert)
            self.last_alert_time[alert_key] = current_time

    async def _process_alert(self, alert: QualityAlert):
        """Process and distribute quality alert"""
        # Store alert
        self.active_alerts[alert.id] = alert
        self.alert_history.append(alert)

        # Log alert
        self.logger.warning(f"Quality Alert: {alert.title} - {alert.description}")

        # Notify callbacks
        for callback in self.alert_callbacks:
            try:
                await asyncio.get_event_loop().run_in_executor(None, callback, alert)
            except Exception as e:
                self.logger.error(f"Alert callback error: {e}")

    def _update_quality_trends(self, metrics_key: str, quality_score: float):
        """Update quality trends for analysis"""
        self.quality_trends[metrics_key].append(quality_score)

        # Keep only recent trends (last 100 measurements)
        if len(self.quality_trends[metrics_key]) > 100:
            self.quality_trends[metrics_key] = self.quality_trends[metrics_key][-100:]

    async def _monitoring_loop(self):
        """Background monitoring loop"""
        while self.running:
            try:
                await self._check_trending_quality()
                await self._update_sla_metrics()
                await asyncio.sleep(self.monitoring_interval)
            except Exception as e:
                self.logger.error(f"Monitoring loop error: {e}")

    async def _trending_loop(self):
        """Background trend analysis loop"""
        while self.running:
            try:
                await self._analyze_quality_trends()
                await asyncio.sleep(600)  # 10 minutes
            except Exception as e:
                self.logger.error(f"Trending loop error: {e}")

    async def _cleanup_loop(self):
        """Background cleanup loop"""
        while self.running:
            try:
                await self._cleanup_old_data()
                await asyncio.sleep(3600)  # 1 hour
            except Exception as e:
                self.logger.error(f"Cleanup loop error: {e}")

    async def _check_trending_quality(self):
        """Check for trending quality issues"""
        for metrics_key, trend_data in self.quality_trends.items():
            if len(trend_data) < 10:  # Need minimum data points
                continue

            # Calculate trend slope
            x = np.arange(len(trend_data))
            z = np.polyfit(x, trend_data, 1)
            slope = z[0]

            # Alert on negative trends
            if slope < -0.01:  # Quality declining by 1% per measurement
                alert = QualityAlert(
                    id=f"quality_trend_{metrics_key}_{int(time.time())}",
                    alert_type="quality_trend",
                    severity="warning",
                    title=f"Declining Quality Trend - {metrics_key}",
                    description=f"Quality score trending downward (slope: {slope:.4f})",
                    timestamp=datetime.now(),
                    source=metrics_key.split('_')[0],
                    symbol=metrics_key.split('_')[1] if '_' in metrics_key else None,
                    metadata={"trend_slope": slope, "data_points": len(trend_data)}
                )
                await self._process_alert(alert)

    async def _analyze_quality_trends(self):
        """Analyze long-term quality trends"""
        # This could include more sophisticated trend analysis
        pass

    async def _update_sla_metrics(self):
        """Update SLA tracking metrics"""
        # Calculate SLA compliance for each source
        for metrics_key, history in self.quality_history.items():
            if not history:
                continue

            # Recent metrics (last 24 hours)
            cutoff_time = datetime.now() - timedelta(hours=24)
            recent_metrics = [m for m in history if m.timestamp >= cutoff_time]

            if recent_metrics:
                sla_compliance = sum(1 for m in recent_metrics if m.overall_score >= self.quality_sla) / len(recent_metrics)

                if sla_compliance < 0.95:  # Below 95% SLA compliance
                    self.logger.warning(f"SLA compliance for {metrics_key}: {sla_compliance:.1%}")

    async def _cleanup_old_data(self):
        """Clean up old monitoring data"""
        cutoff_time = datetime.now() - timedelta(days=7)  # Keep 7 days

        # Clean up old alerts
        self.alert_history = deque([
            alert for alert in self.alert_history
            if alert.timestamp >= cutoff_time
        ], maxlen=10000)

        # Clean up resolved active alerts
        expired_alerts = [
            alert_id for alert_id, alert in self.active_alerts.items()
            if alert.timestamp < cutoff_time
        ]

        for alert_id in expired_alerts:
            del self.active_alerts[alert_id]

    def _load_quality_rules(self) -> Dict[str, Any]:
        """Load quality monitoring rules"""
        return {
            "min_overall_quality": 0.80,
            "min_completeness": 0.90,
            "min_accuracy": 0.85,
            "min_consistency": 0.85,
            "min_timeliness": 0.70,
            "max_error_ratio": 0.05,  # 5% error rate threshold
            "sla_threshold": self.quality_sla
        }

    def add_alert_callback(self, callback: Callable[[QualityAlert], None]):
        """Add callback for quality alerts"""
        self.alert_callbacks.append(callback)

    def get_quality_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get quality summary for dashboard"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        # Collect recent metrics
        all_recent_metrics = []
        for metrics_list in self.quality_history.values():
            recent = [m for m in metrics_list if m.timestamp >= cutoff_time]
            all_recent_metrics.extend(recent)

        if not all_recent_metrics:
            return {"status": "no_data", "timeframe_hours": hours}

        # Calculate summary statistics
        overall_scores = [m.overall_score for m in all_recent_metrics]
        completeness_scores = [m.completeness_score for m in all_recent_metrics]
        accuracy_scores = [m.accuracy_score for m in all_recent_metrics]

        # Recent alerts
        recent_alerts = [alert for alert in self.alert_history if alert.timestamp >= cutoff_time]

        return {
            "timeframe_hours": hours,
            "total_datasets_monitored": len(all_recent_metrics),
            "average_quality_score": np.mean(overall_scores),
            "min_quality_score": np.min(overall_scores),
            "max_quality_score": np.max(overall_scores),
            "average_completeness": np.mean(completeness_scores),
            "average_accuracy": np.mean(accuracy_scores),
            "total_alerts": len(recent_alerts),
            "critical_alerts": len([a for a in recent_alerts if a.severity == "critical"]),
            "warning_alerts": len([a for a in recent_alerts if a.severity == "warning"]),
            "sources_monitored": len(self.quality_history),
            "sla_compliance": sum(1 for score in overall_scores if score >= self.quality_sla) / len(overall_scores),
            "last_update": datetime.now().isoformat()
        }

    def get_source_quality(self, source: str, symbol: Optional[str] = None) -> Dict[str, Any]:
        """Get quality metrics for specific source/symbol"""
        metrics_key = f"{source}_{symbol}" if symbol else source

        if metrics_key not in self.quality_history:
            return {"error": "No data found for specified source/symbol"}

        recent_metrics = list(self.quality_history[metrics_key])[-10:]  # Last 10 measurements

        if not recent_metrics:
            return {"error": "No recent data found"}

        latest = recent_metrics[-1]

        return {
            "source": source,
            "symbol": symbol,
            "latest_quality_score": latest.overall_score,
            "latest_completeness": latest.completeness_score,
            "latest_accuracy": latest.accuracy_score,
            "latest_consistency": latest.consistency_score,
            "latest_timeliness": latest.timeliness_score,
            "record_count": latest.record_count,
            "error_count": latest.error_count,
            "trend": self._calculate_short_term_trend(metrics_key),
            "validation_issues": latest.validation_issues,
            "last_update": latest.timestamp.isoformat()
        }

    def _calculate_short_term_trend(self, metrics_key: str) -> str:
        """Calculate short-term quality trend"""
        if metrics_key not in self.quality_trends or len(self.quality_trends[metrics_key]) < 5:
            return "insufficient_data"

        recent_scores = self.quality_trends[metrics_key][-5:]

        # Simple trend calculation
        first_half = np.mean(recent_scores[:2])
        second_half = np.mean(recent_scores[-2:])

        if second_half > first_half + 0.05:
            return "improving"
        elif second_half < first_half - 0.05:
            return "declining"
        else:
            return "stable"

    def get_active_alerts(self, severity: Optional[str] = None) -> List[QualityAlert]:
        """Get current active alerts"""
        alerts = list(self.active_alerts.values())

        if severity:
            alerts = [alert for alert in alerts if alert.severity == severity]

        # Sort by timestamp (newest first)
        alerts.sort(key=lambda x: x.timestamp, reverse=True)

        return alerts

    def __del__(self):
        """Cleanup on destruction"""
        if self.running:
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(self.stop())
            except Exception:
                pass