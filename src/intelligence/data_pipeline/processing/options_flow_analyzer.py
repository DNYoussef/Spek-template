"""
Options Flow Analyzer
Real-time options flow analysis for unusual activity detection
"""

import asyncio
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

        # Configuration
self.unusual_volume_threshold = 3.0  # Standard deviations
        self.large_trade_threshold = config.processing.options_flow_threshold  # $1M
        self.iv_spike_threshold = 20.0  # Percent change
        self.flow_analysis_window = timedelta(hours=1)

        # Data storage
        self.options_data: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.volume_baselines: Dict[str, Dict[str, float]] = {}
        self.iv_baselines: Dict[str, Dict[str, float]] = {}
        self.unusual_activities: deque = deque(maxlen=10000)

        # Flow tracking
        self.flow_metrics: Dict[str, FlowMetrics] = {}
        self.sweep_detector = SweepDetector()

        # Performance tracking
        self.processed_contracts = 0
        self.alerts_generated = 0
        self.processing_times = deque(maxlen=1000)

        # Background tasks
        self.analysis_task: Optional[asyncio.Task] = None
        self.baseline_task: Optional[asyncio.Task] = None
        self.running = False

    async def start(self):
        """Start options flow analyzer"""
        self.logger.info("Starting options flow analyzer")
        self.running = True

        # Start background tasks
        self.analysis_task = asyncio.create_task(self._analysis_loop())
        self.baseline_task = asyncio.create_task(self._baseline_calculation_loop())

    async def stop(self):
        """Stop options flow analyzer"""
        self.logger.info("Stopping options flow analyzer")
        self.running = False

        if self.analysis_task:
            self.analysis_task.cancel()
        if self.baseline_task:
            self.baseline_task.cancel()

    async def process_options_data(self, options_data: List[OptionContract]):
        """Process batch of options data"""
        if not options_data:
            return

        start_time = time.time()
        alerts = []

        for contract in options_data:
            try:
                # Store contract data
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                self.options_data[contract.underlying].append({
                "timestamp": datetime.now(),
                    "contract": contract,
                    "volume": contract.volume,
                    "premium": contract.premium,
                    "iv": contract.implied_volatility))

                # Analyze for unusual activity
                contract_alerts = await self._analyze_contract(contract)
                alerts.extend(contract_alerts)

                self.processed_contracts += 1

            except Exception as e:
                self.logger.error(f"Error processing contract {contract.symbol): {e)")

        processing_time = (time.time() - start_time) * 1000
        self.processing_times.append(processing_time)

        # Store alerts
        for alert in alerts:
            self.unusual_activities.append(alert)
            self.alerts_generated += 1

        return alerts

    async def _analyze_contract(self, contract: OptionContract) -> List[UnusualActivity]:
        """Analyze individual contract for unusual activity"""
        alerts = []
        current_time = datetime.now()

        # Volume analysis
        volume_alert = self._check_unusual_volume(contract)
        if volume_alert:
            alerts.append(volume_alert)

        # Large trade analysis
        trade_value = contract.volume * contract.premium * 100  # Options multiplier
        if trade_value >= self.large_trade_threshold:
            alert = UnusualActivity(
            id=f"large_trade_{contract.symbol)_{int(time.time())}",
                underlying_symbol=contract.underlying,
                contract_symbol=contract.symbol,
                activity_type="flow",
                severity=self._calculate_severity(trade_value / self.large_trade_threshold),
                description=f"Large ${trade_value:,.0f) options trade detected",
                detected_at=current_time,
                volume=contract.volume,
                price_change_percent=0.0,  # Would need previous price data
                iv_change_percent=0.0,     # Would need previous IV data
                unusual_score=trade_value / self.large_trade_threshold,
                contract_details=contract
            )
            alerts.append(alert)

        # IV spike analysis
        iv_alert = self._check_iv_spike(contract)
        if iv_alert:
            alerts.append(iv_alert)

        # Sweep detection
        sweep_alert = await self.sweep_detector.check_sweep(contract)
        if sweep_alert:
            alerts.append(sweep_alert)

        return alerts

    def _check_unusual_volume(self, contract: OptionContract) -> Optional[UnusualActivity]:
        """Check for unusual volume activity"""
        baseline_key = f"{contract.underlying)_{contract.contract_type)_{contract.strike_price)"

        if baseline_key in self.volume_baselines:
            baseline = self.volume_baselines[baseline_key]
            avg_volume = baseline.get("avg", 0)
            std_volume = baseline.get("std", 0)

            if std_volume > 0:
                z_score = (contract.volume - avg_volume) / std_volume

                if z_score >= self.unusual_volume_threshold:
                    severity = self._calculate_severity(z_score / self.unusual_volume_threshold)

                    return UnusualActivity(
                    id=f"volume_{contract.symbol)_{int(time.time())}",
                        underlying_symbol=contract.underlying,
                        contract_symbol=contract.symbol,
                        activity_type="volume",
                        severity=severity,
                        description=f"Unusual volume: {contract.volume:,} vs avg {avg_volume:.0f) ({z_score:.1f))",
                        detected_at=datetime.now(),
                        volume=contract.volume,
                        price_change_percent=0.0,
                        iv_change_percent=0.0,
                        unusual_score=z_score,
                        contract_details=contract,
                        market_context={"z_score": z_score, "avg_volume": avg_volume)
                    )

        return None

    def _check_iv_spike(self, contract: OptionContract) -> Optional[UnusualActivity]:
        """Check for implied volatility spikes"""
        baseline_key = f"{contract.underlying)_{contract.contract_type)_{contract.strike_price)"

        if baseline_key in self.iv_baselines:
            baseline = self.iv_baselines[baseline_key]
            avg_iv = baseline.get("avg", 0)

            if avg_iv > 0:
                iv_change_percent = ((contract.implied_volatility - avg_iv) / avg_iv) * 100

                if iv_change_percent >= self.iv_spike_threshold:
                    severity = self._calculate_severity(iv_change_percent / self.iv_spike_threshold)

                    return UnusualActivity(
                    id=f"iv_spike_{contract.symbol)_{int(time.time())}",
                        underlying_symbol=contract.underlying,
                        contract_symbol=contract.symbol,
                        activity_type="iv",
                        severity=severity,
                        description=f"IV spike: {contract.implied_volatility:.1f)% vs avg {avg_iv:.1f)% (+{iv_change_percent:.1f)%)",
                        detected_at=datetime.now(),
                        volume=contract.volume,
                        price_change_percent=0.0,
                        iv_change_percent=iv_change_percent,
                        unusual_score=iv_change_percent / self.iv_spike_threshold,
                        contract_details=contract,
                        market_context={"avg_iv": avg_iv)
                    )

        return None

    def _calculate_severity(self, score: float) -> str:
        """Calculate severity based on unusual score"""
        if score >= 5.0:
            return "extreme"
        elif score >= 3.0:
            return "high"
        elif score >= 2.0:
            return "medium"
        else:
            return "low"

    async def _analysis_loop(self):
        """Background analysis loop for flow metrics"""
        while self.running:
            try:
                await self._calculate_flow_metrics()
                await asyncio.sleep(60)  # Update every minute
            except Exception as e:
                self.logger.error(f"Flow analysis loop error: {e)")

    async def _calculate_flow_metrics(self):
        """Calculate flow metrics for all symbols"""
        current_time = datetime.now()
        cutoff_time = current_time - self.flow_analysis_window

        for symbol, data_deque in self.options_data.items():
            if not data_deque:
                continue

            # Filter recent data
            recent_data = [
            item for item in data_deque
            if item["timestamp"] >= cutoff_time
            ]

            if not recent_data:
                continue

            # Calculate metrics
            call_volume = sum(
            item["volume"] for item in recent_data
            if item["contract"].contract_type == "call"
            )

            put_volume = sum(
            item["volume"] for item in recent_data
            if item["contract"].contract_type == "put"
            )

            call_put_ratio = call_volume / put_volume if put_volume > 0 else float('inf')

            total_premium = sum(
            item["volume"] * item["premium"] * 100 for item in recent_data
            )

            iv_values = [item["iv"] for item in recent_data if item["iv"] > 0]
            avg_iv = np.mean(iv_values) if iv_values else 0.0

            # Get recent unusual activities
            recent_alerts = [
            alert for alert in self.unusual_activities
            if (alert.underlying_symbol == symbol and
            alert.detected_at >= cutoff_time)
            ]

            # Store metrics
            self.flow_metrics[symbol] = FlowMetrics(
            symbol=symbol,
                timestamp=current_time,
                call_volume=call_volume,
                put_volume=put_volume,
                call_put_ratio=call_put_ratio,
                total_premium=total_premium,
                avg_iv=avg_iv,
                unusual_activities=recent_alerts
            )

    async def _baseline_calculation_loop(self):
        """Background loop for calculating baselines"""
        while self.running:
            try:
                await self._update_baselines()
                await asyncio.sleep(3600)  # Update hourly
            except Exception as e:
                self.logger.error(f"Baseline calculation error: {e)")

    async def _update_baselines(self):
        """Update volume and IV baselines"""
        lookback_period = timedelta(days=30)
        current_time = datetime.now()
        cutoff_time = current_time - lookback_period

        for symbol, data_deque in self.options_data.items():
            if len(data_deque) < 10:  # Need minimum data
            continue

            # Group by contract characteristics
            contract_groups = defaultdict(list)

            for item in data_deque:
                if item["timestamp"] >= cutoff_time:
                    contract = item["contract"]
                    key = f"{contract.underlying)_{contract.contract_type)_{contract.strike_price)"
                    contract_groups[key].append(item)

            # Calculate baselines for each contract group
            for key, group_data in contract_groups.items():
                if len(group_data) < 5:  # Need minimum samples
                continue

                volumes = [item["volume"] for item in group_data]
                ivs = [item["iv"] for item in group_data if item["iv"] > 0]

                # Volume baseline
                if volumes:
                    self.volume_baselines[key] = {
                    "avg": np.mean(volumes),
                        "std": np.std(volumes),
                        "median": np.median(volumes)
                    }

                # IV baseline
                if ivs:
                    self.iv_baselines[key] = {
                    "avg": np.mean(ivs),
                        "std": np.std(ivs),
                        "median": np.median(ivs)
                    }

    def get_flow_metrics(self, symbol: str) -> Optional[FlowMetrics]:
        """Get flow metrics for a specific symbol"""
        return self.flow_metrics.get(symbol)

    def get_recent_alerts(self, hours: int = 24, symbol: Optional[str] = None) -> List[UnusualActivity]:
        """Get recent unusual activity alerts"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        alerts = [
        alert for alert in self.unusual_activities
        if alert.detected_at >= cutoff_time
        ]

        if symbol:
            alerts = [alert for alert in alerts if alert.underlying_symbol == symbol]

        return sorted(alerts, key=lambda x: x.detected_at, reverse=True)

    def get_top_flow_symbols(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get symbols with highest options flow"""
        symbols_with_flow = []

        for symbol, metrics in self.flow_metrics.items():
            total_volume = metrics.call_volume + metrics.put_volume
            if total_volume > 0:
                symbols_with_flow.append({
                "symbol": symbol,
                    "total_volume": total_volume,
                    "call_put_ratio": metrics.call_put_ratio,
                    "total_premium": metrics.total_premium,
                    "avg_iv": metrics.avg_iv,
                    "unusual_count": len(metrics.unusual_activities),
                    "timestamp": metrics.timestamp))

        # Sort by total premium (dollar flow)
        symbols_with_flow.sort(key=lambda x: x["total_premium"], reverse=True)
        return symbols_with_flow[:limit]

    def get_analytics_summary(self) -> Dict[str, Any]:
        """Get analytics summary"""
        current_time = datetime.now()
        recent_alerts = self.get_recent_alerts(hours=24)

        return {
        "total_contracts_processed": self.processed_contracts,
            "total_alerts_generated": self.alerts_generated,
            "recent_alerts_24h": len(recent_alerts),
            "symbols_tracked": len(self.flow_metrics),
            "average_processing_time_ms": np.mean(self.processing_times) if self.processing_times else 0,
            "alerts_by_severity": self._count_alerts_by_severity(recent_alerts),
            "top_active_symbols": [item["symbol"] for item in self.get_top_flow_symbols(10)],
            "last_update": current_time.isoformat()
        }

    def _count_alerts_by_severity(self, alerts: List[UnusualActivity]) -> Dict[str, int]:
        """Count alerts by severity level"""
        counts = {"low": 0, "medium": 0, "high": 0, "extreme": 0)
        for alert in alerts:
            counts[alert.severity] += 1
        return counts


class SweepDetector:
    """Detector for options sweeps (multi-exchange large orders)"""

    def __init__(self):
        self.recent_trades: deque = deque(maxlen=1000)
        self.sweep_window = timedelta(seconds=30)

    async def check_sweep(self, contract: OptionContract) -> Optional[UnusualActivity]:
        """Check if contract is part of a sweep"""
        current_time = datetime.now()

        # Add to recent trades
        trade = {
        "timestamp": current_time,
            "contract": contract,
            "symbol": contract.symbol,
            "underlying": contract.underlying,
            "volume": contract.volume,
            "premium": contract.premium)
        self.recent_trades.append(trade)

        # Look for sweep pattern
        cutoff_time = current_time - self.sweep_window

        related_trades = [
        t for t in self.recent_trades
        if (t["underlying"] == contract.underlying and
        t["timestamp"] >= cutoff_time)
        ]

        if len(related_trades) >= 3:  # Multiple trades in short window
        total_volume = sum(t["volume"] for t in related_trades)
        total_value = sum(t["volume"] * t["premium"] * 100 for t in related_trades)

            if total_value >= 500000:  # $500K+ sweep
            return UnusualActivity(
            id=f"sweep_{contract.underlying)_{int(time.time())}",
                    underlying_symbol=contract.underlying,
                    contract_symbol=contract.symbol,
                    activity_type="flow",
                    severity="high",
                    description=f"Options sweep detected: {len(related_trades)} trades, ${total_value:,.0f) total",
                    detected_at=current_time,
                    volume=total_volume,
                    price_change_percent=0.0,
                    iv_change_percent=0.0,
                    unusual_score=total_value / 500000,
                    contract_details=contract,
                    market_context={
                    "sweep_trades": len(related_trades),
                        "total_value": total_value)
                )

        return None