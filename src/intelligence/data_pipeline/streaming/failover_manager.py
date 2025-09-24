"""
Failover Manager
Intelligent failover management for data sources with health monitoring
"""

import asyncio
from lib.shared.utilities import get_logger
logger = get_logger(__name__)
self.health_metrics: Dict[str, HealthMetrics] = {}
self.failover_rules: List[FailoverRule] = []

        # Primary and fallback sources
self.primary_source: Optional[str] = None
        self.active_source: Optional[str] = None
        self.available_sources: List[str] = []

        # Circuit breaker state
        self.circuit_breakers: Dict[str, Dict] = {}

        # Health check configuration
        self.health_check_interval = 30.0  # seconds
        self.health_check_timeout = 10.0   # seconds

        # Callbacks
        self.failover_callbacks: List[Callable] = []
        self.health_callbacks: List[Callable] = []

        # Background tasks
        self.monitor_task: Optional[asyncio.Task] = None
        self.running = False

        # Initialize default rules
        self._initialize_default_rules()

    async def start(self):
        """Start the failover manager"""
        self.logger.info("Starting failover manager")
        self.running = True

        # Start health monitoring
        self.monitor_task = asyncio.create_task(self._health_monitor_loop())

    async def stop(self):
        """Stop the failover manager"""
        self.logger.info("Stopping failover manager")
        self.running = False

        if self.monitor_task:
            self.monitor_task.cancel()

    def register_source(self, source_name: str, is_primary: bool = False):
        """Register a data source for monitoring"""
        self.health_metrics[source_name] = HealthMetrics(source_name=source_name)
        self.available_sources.append(source_name)

        # Initialize circuit breaker
        self.circuit_breakers[source_name] = {
        "state": "closed",  # closed, open, half_open
        "failure_count": 0,
            "last_failure_time": None,
            "success_count": 0)

        if is_primary or self.primary_source is None:
            self.primary_source = source_name
            self.active_source = source_name

        self.logger.info(f"Registered source: {source_name) (primary: {is_primary))")

    def unregister_source(self, source_name: str):
        """Unregister a data source"""
        if source_name in self.health_metrics:
            del self.health_metrics[source_name]

        if source_name in self.available_sources:
            self.available_sources.remove(source_name)

        if source_name in self.circuit_breakers:
            del self.circuit_breakers[source_name]

        if self.active_source == source_name:
            self.active_source = self._select_best_source()

        if self.primary_source == source_name:
            self.primary_source = None

        self.logger.info(f"Unregistered source: {source_name)")

    def record_request_result(
    self,
        source_name: str,
        success: bool,
        latency_ms: float = 0.0,
        error_message: str = None
    ):
        """Record the result of a request to update health metrics"""
        if source_name not in self.health_metrics:
            return

        metrics = self.health_metrics[source_name]
        current_time = datetime.now()

        # Update basic counters
        metrics.total_requests += 1

        if success:
            metrics.total_successes += 1
            metrics.last_success = current_time
            metrics.consecutive_errors = 0

            # Update circuit breaker
            breaker = self.circuit_breakers[source_name]
            if breaker["state"] == "half_open":
                breaker["success_count"] += 1
                if breaker["success_count"] >= 3:  # Close circuit after 3 successes
                breaker["state"] = "closed"
                breaker["failure_count"] = 0
                self.logger.info(f"Circuit breaker closed for {source_name)")

        else:
            metrics.total_errors += 1
            metrics.last_error = current_time
            metrics.consecutive_errors += 1

            # Update circuit breaker
            breaker = self.circuit_breakers[source_name]
            breaker["failure_count"] += 1
            breaker["last_failure_time"] = current_time

            if breaker["state"] == "closed" and breaker["failure_count"] >= 5:
                breaker["state"] = "open"
                self.logger.warning(f"Circuit breaker opened for {source_name)")

        # Update derived metrics
        if metrics.total_requests > 0:
            metrics.success_rate = metrics.total_successes / metrics.total_requests
            metrics.error_rate = metrics.total_errors / metrics.total_requests

        # Update average latency (exponential moving average)
        if success and latency_ms > 0:
            if metrics.average_latency == 0:
                metrics.average_latency = latency_ms
            else:
                metrics.average_latency = 0.8 * metrics.average_latency + 0.2 * latency_ms

        # Update health status
        self._update_health_status(source_name)

        # Check failover rules
        await self._check_failover_rules(source_name)

    def _update_health_status(self, source_name: str):
        """Update health status based on metrics"""
        metrics = self.health_metrics[source_name]
        breaker = self.circuit_breakers[source_name]

        # Circuit breaker takes precedence
        if breaker["state"] == "open":
            metrics.status = HealthStatus.CRITICAL
            return

        # Check consecutive errors
        if metrics.consecutive_errors >= 10:
            metrics.status = HealthStatus.CRITICAL
        elif metrics.consecutive_errors >= 5:
            metrics.status = HealthStatus.UNHEALTHY
        elif metrics.consecutive_errors >= 3:
            metrics.status = HealthStatus.DEGRADED

        # Check error rate
        elif metrics.total_requests > 10:  # Need sufficient sample size
        if metrics.error_rate > 0.5:
                metrics.status = HealthStatus.CRITICAL
            elif metrics.error_rate > 0.2:
                metrics.status = HealthStatus.UNHEALTHY
            elif metrics.error_rate > 0.1:
                metrics.status = HealthStatus.DEGRADED
            else:
                metrics.status = HealthStatus.HEALTHY

        else:
            # Not enough data, check recent activity
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            if metrics.last_success and (datetime.now() - metrics.last_success).seconds < 60:
                metrics.status = HealthStatus.HEALTHY
            else:
                metrics.status = HealthStatus.OFFLINE

    async def _check_failover_rules(self, source_name: str):
        """Check and apply failover rules"""
        metrics = self.health_metrics[source_name]
        current_time = datetime.now()

        for rule in self.failover_rules:
            # Check cooldown
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            if (rule.last_triggered and
            (current_time - rule.last_triggered).seconds < rule.cooldown_seconds):
                continue

            # Check trigger conditions
            if self._evaluate_rule_conditions(rule, metrics):
                await self._apply_failover_action(rule, source_name)
                rule.last_triggered = current_time

    def _evaluate_rule_conditions(self, rule: FailoverRule, metrics: HealthMetrics) -> bool:
        """Evaluate if rule conditions are met"""
        conditions = rule.trigger_conditions

        for condition, threshold in conditions.items():
            if condition == "consecutive_errors" and metrics.consecutive_errors >= threshold:
                return True
            elif condition == "error_rate" and metrics.error_rate >= threshold:
                return True
            elif condition == "health_status" and metrics.status.value == threshold:
                return True
            elif condition == "average_latency" and metrics.average_latency >= threshold:
                return True

        return False

    async def _apply_failover_action(self, rule: FailoverRule, source_name: str):
        """Apply failover action"""
        self.logger.warning(f"Applying failover rule '{rule.name)' for source {source_name)")

        if rule.action == "switch" and source_name == self.active_source:
            # Switch to next best source
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            new_source = self._select_best_source(exclude=[source_name])
            if new_source and new_source != source_name:
                self.active_source = new_source
                self.logger.info(f"Switched active source from {source_name) to {new_source)")

                # Notify callbacks
                for callback in self.failover_callbacks:
                    try:
                        await callback(source_name, new_source, rule.name)
                    except Exception as e:
                        self.logger.error(f"Failover callback error: {e)")

        elif rule.action == "disable":
            # Temporarily disable source
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            if source_name in self.available_sources:
                self.available_sources.remove(source_name)
                self.logger.info(f"Temporarily disabled source: {source_name)")

    def _select_best_source(self, exclude: List[str] = None) -> Optional[str]:
        """Select the best available source based on health metrics"""
        exclude = exclude or []
        candidates = []

        for source_name in self.available_sources:
            if source_name in exclude:
                continue

            metrics = self.health_metrics.get(source_name)
            if not metrics:
                continue

            breaker = self.circuit_breakers.get(source_name, {})
            if breaker.get("state") == "open":
                # Check if circuit breaker should move to half-open
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                if (breaker.get("last_failure_time") and
                (datetime.now() - breaker["last_failure_time"]).seconds > 60):
                    breaker["state"] = "half_open"
                    breaker["success_count"] = 0
                    self.logger.info(f"Circuit breaker half-opened for {source_name)")
                else:
                    continue  # Skip sources with open circuit breaker

            # Score based on health metrics
            score = self._calculate_source_score(metrics)
            candidates.append((source_name, score, metrics))

        if not candidates:
            return None

        # Sort by score (higher is better)
        candidates.sort(key=lambda x: x[1], reverse=True)

        # Prefer primary source if it's healthy
        if (self.primary_source and
        self.primary_source in [c[0] for c in candidates[:3]] and  # Top 3
        self.health_metrics[self.primary_source].status in [HealthStatus.HEALTHY, HealthStatus.DEGRADED]):
            return self.primary_source

        return candidates[0][0]

    def _calculate_source_score(self, metrics: HealthMetrics) -> float:
        """Calculate health score for source selection"""
        score = 0.0

        # Health status weight
        status_weights = {
        HealthStatus.HEALTHY: 100,
            HealthStatus.DEGRADED: 70,
            HealthStatus.UNHEALTHY: 30,
            HealthStatus.CRITICAL: 10,
            HealthStatus.OFFLINE: 0)
        score += status_weights.get(metrics.status, 0)

        # Success rate weight
        if metrics.total_requests > 0:
            score += metrics.success_rate * 50

        # Latency weight (lower is better)
        if metrics.average_latency > 0:
            latency_score = max(0, 50 - (metrics.average_latency / 100))
            score += latency_score

        # Recency bonus
        if metrics.last_success:
            seconds_since = (datetime.now() - metrics.last_success).total_seconds()
            if seconds_since < 60:
                score += 20
            elif seconds_since < 300:
                score += 10

        return score

    async def _health_monitor_loop(self):
        """Background health monitoring loop"""
        while self.running:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.health_check_interval)
            except Exception as e:
                self.logger.error(f"Health monitor error: {e)")

    async def _perform_health_checks(self):
        """Perform health checks on all sources"""
        current_time = datetime.now()

        for source_name, metrics in self.health_metrics.items():
            # Check for stale sources
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            if (metrics.last_success and
            (current_time - metrics.last_success).seconds > 300):  # 5 minutes
            if metrics.status != HealthStatus.OFFLINE:
                    metrics.status = HealthStatus.OFFLINE
                    self.logger.warning(f"Source {source_name) marked as offline")

            # Try to recover half-open circuit breakers
            breaker = self.circuit_breakers[source_name]
            if breaker["state"] == "half_open":
                # Send test request (implementation specific)
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass

        # Notify health callbacks
        for callback in self.health_callbacks:
            try:
                await callback(dict(self.health_metrics))
            except Exception as e:
                self.logger.error(f"Health callback error: {e)")

    def _initialize_default_rules(self):
        """Initialize default failover rules"""
        self.failover_rules = [
        FailoverRule(
        name="high_error_rate",
                trigger_conditions={"error_rate": 0.3),
                action="switch",
                priority=1,
                cooldown_seconds=180
            ),
            FailoverRule(
            name="consecutive_failures",
                trigger_conditions={"consecutive_errors": 5),
                action="switch",
                priority=2,
                cooldown_seconds=120
            ),
            FailoverRule(
            name="critical_health",
                trigger_conditions={"health_status": "critical"},
                action="switch",
                priority=3,
                cooldown_seconds=300
            ),
            FailoverRule(
            name="high_latency",
                trigger_conditions={"average_latency": 5000),  # 5 seconds
                action="switch",
                priority=4,
                cooldown_seconds=240
            )
        ]

    def add_failover_callback(self, callback: Callable):
        """Add callback for failover events"""
        self.failover_callbacks.append(callback)

    def add_health_callback(self, callback: Callable):
        """Add callback for health updates"""
        self.health_callbacks.append(callback)

    def get_active_source(self) -> Optional[str]:
        """Get currently active source"""
        return self.active_source

    def get_health_status(self) -> Dict[str, Dict[str, Any]]:
        """Get health status of all sources"""
        status = {}

        for name, metrics in self.health_metrics.items():
            breaker = self.circuit_breakers.get(name, {})
            status[name] = {
            "status": metrics.status.value,
                "success_rate": round(metrics.success_rate, 3),
                "error_rate": round(metrics.error_rate, 3),
                "average_latency_ms": round(metrics.average_latency, 2),
                "consecutive_errors": metrics.consecutive_errors,
                "total_requests": metrics.total_requests,
                "circuit_breaker_state": breaker.get("state", "unknown"),
                "last_success": metrics.last_success.isoformat() if metrics.last_success else None,
                "last_error": metrics.last_error.isoformat() if metrics.last_error else None)

        return status

    def force_failover(self, target_source: Optional[str] = None) -> bool:
        """Force failover to specific source or best available"""
        if target_source:
            if target_source in self.available_sources:
                old_source = self.active_source
                self.active_source = target_source
                self.logger.info(f"Forced failover from {old_source) to {target_source)")
                return True
            else:
                self.logger.error(f"Cannot failover to unavailable source: {target_source)")
                return False
        else:
            new_source = self._select_best_source(exclude=[self.active_source] if self.active_source else [])
            if new_source:
                old_source = self.active_source
                self.active_source = new_source
                self.logger.info(f"Forced failover from {old_source) to {new_source)")
                return True
            else:
                self.logger.error("No alternative source available for failover")
                return False

    def __del__(self):
        """Cleanup on destruction"""
        if self.running:
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(self.stop())
            except Exception:
                pass