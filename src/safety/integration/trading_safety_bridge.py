"""
TradingSafetyBridge - Trading Engine Safety Integration
======================================================

Integrates safety systems with trading engines using circuit breakers,
position limits, and automated risk management controls.
"""

import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass, field
import queue


class TradingState(Enum):
    """Trading system states."""
    ACTIVE = "active"
    PAUSED = "paused"
    HALTED = "halted"
    EMERGENCY_STOP = "emergency_stop"
    MAINTENANCE = "maintenance"


class RiskLevel(Enum):
    """Risk assessment levels."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4
    EXTREME = 5


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration."""
    name: str
    failure_threshold: int = 5
    timeout_seconds: float = 300.0  # 5 minutes
    half_open_max_calls: int = 3
    success_threshold: int = 2
    monitoring_window_seconds: float = 60.0


@dataclass
class PositionLimit:
    """Trading position limit configuration."""
    symbol: str
    max_position_size: float
    max_daily_loss: float
    max_exposure: float
    currency: str = "USD"


@dataclass
class TradingMetrics:
    """Trading safety metrics."""
    total_trades: int = 0
    blocked_trades: int = 0
    circuit_breaker_trips: int = 0
    emergency_stops: int = 0
    position_limit_violations: int = 0
    risk_escalations: int = 0
    average_response_time_ms: float = 0.0
    uptime_percentage: float = 0.0


class TradingSafetyBridge:
    """
    Safety bridge for trading engine integration.

    Features:
    - Circuit breaker patterns for trading operations
    - Real-time position limit enforcement
    - Risk assessment and escalation
    - Emergency stop mechanisms
    - Performance monitoring
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize TradingSafetyBridge.

        Args:
            config: Bridge configuration dictionary
        """
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Trading state management
        self._trading_state = TradingState.ACTIVE
        self._state_lock = threading.RLock()

        # Circuit breakers
        self._circuit_breakers: Dict[str, Dict] = {}
        self._circuit_breaker_configs: Dict[str, CircuitBreakerConfig] = {}

        # Position tracking
        self._current_positions: Dict[str, float] = {}
        self._position_limits: Dict[str, PositionLimit] = {}
        self._daily_pnl: Dict[str, float] = {}

        # Risk management
        self._current_risk_level = RiskLevel.LOW
        self._risk_callbacks: List[Callable[[RiskLevel], None]] = []

        # Event queues
        self._trade_queue = queue.Queue(maxsize=10000)
        self._alert_queue = queue.Queue(maxsize=1000)

        # Metrics
        self.metrics = TradingMetrics()

        # Threading
        self._processing_thread: Optional[threading.Thread] = None
        self._monitoring_thread: Optional[threading.Thread] = None
        self._shutdown_event = threading.Event()
        self._is_running = False

        # Performance tracking
        self._response_times: List[float] = []
        self._start_time = datetime.utcnow()

        self.logger.info("TradingSafetyBridge initialized")

    def start(self):
        """Start the trading safety bridge."""
        if self._is_running:
            self.logger.warning("TradingSafetyBridge already running")
            return

        self._is_running = True
        self._shutdown_event.clear()

        # Start processing threads
        self._processing_thread = threading.Thread(
            target=self._processing_loop,
            name="TradingSafetyBridge-Processor",
            daemon=True
        )
        self._processing_thread.start()

        self._monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            name="TradingSafetyBridge-Monitor",
            daemon=True
        )
        self._monitoring_thread.start()

        self.logger.info("TradingSafetyBridge started")

    def stop(self):
        """Stop the trading safety bridge."""
        if not self._is_running:
            return

        self._shutdown_event.set()
        self._is_running = False

        if self._processing_thread and self._processing_thread.is_alive():
            self._processing_thread.join(timeout=5.0)

        if self._monitoring_thread and self._monitoring_thread.is_alive():
            self._monitoring_thread.join(timeout=5.0)

        self.logger.info("TradingSafetyBridge stopped")

    def register_circuit_breaker(self, config: CircuitBreakerConfig):
        """Register a circuit breaker configuration."""
        self._circuit_breaker_configs[config.name] = config
        self._circuit_breakers[config.name] = {
            'state': 'closed',  # closed, open, half_open
            'failure_count': 0,
            'last_failure_time': None,
            'success_count': 0,
            'failures_in_window': []
        }
        self.logger.info("Registered circuit breaker: %s", config.name)

    def set_position_limit(self, limit: PositionLimit):
        """Set position limits for a symbol."""
        self._position_limits[limit.symbol] = limit
        if limit.symbol not in self._current_positions:
            self._current_positions[limit.symbol] = 0.0
        if limit.symbol not in self._daily_pnl:
            self._daily_pnl[limit.symbol] = 0.0

        self.logger.info(
            "Set position limit for %s: max_size=%.2f, max_loss=%.2f",
            limit.symbol, limit.max_position_size, limit.max_daily_loss
        )

    def validate_trade(self, symbol: str, size: float, price: float) -> Dict[str, Any]:
        """
        Validate a trade against safety constraints.

        Args:
            symbol: Trading symbol
            size: Position size (positive for long, negative for short)
            price: Trade price

        Returns:
            dict: Validation result with approval status and reasons
        """
        start_time = time.time()
        validation_result = {
            'approved': True,
            'reasons': [],
            'risk_level': self._current_risk_level.name,
            'circuit_breaker_state': {},
            'position_impact': {}
        }

        try:
            # Check trading state
            if self._trading_state != TradingState.ACTIVE:
                validation_result['approved'] = False
                validation_result['reasons'].append(f"Trading state is {self._trading_state.value}")

            # Check circuit breakers
            cb_result = self._check_circuit_breakers(symbol)
            validation_result['circuit_breaker_state'] = cb_result

            if not cb_result.get('all_closed', True):
                validation_result['approved'] = False
                validation_result['reasons'].append("Circuit breaker is open")

            # Check position limits
            position_result = self._check_position_limits(symbol, size, price)
            validation_result['position_impact'] = position_result

            if not position_result.get('within_limits', True):
                validation_result['approved'] = False
                validation_result['reasons'].extend(position_result.get('violations', []))

            # Check risk level
            if self._current_risk_level >= RiskLevel.CRITICAL:
                validation_result['approved'] = False
                validation_result['reasons'].append(f"Risk level too high: {self._current_risk_level.name}")

            # Update metrics
            response_time_ms = (time.time() - start_time) * 1000
            self._response_times.append(response_time_ms)

            if len(self._response_times) > 1000:  # Keep last 1000 samples
                self._response_times = self._response_times[-1000:]

            self.metrics.average_response_time_ms = sum(self._response_times) / len(self._response_times)

            if validation_result['approved']:
                self.metrics.total_trades += 1
            else:
                self.metrics.blocked_trades += 1

            return validation_result

        except Exception as e:
            self.logger.error("Trade validation error: %s", e)
            return {
                'approved': False,
                'reasons': [f"Validation error: {str(e)}"],
                'risk_level': 'UNKNOWN',
                'circuit_breaker_state': {},
                'position_impact': {}
            }

    def execute_trade(self, symbol: str, size: float, price: float, trade_id: str) -> bool:
        """
        Execute a validated trade and update position tracking.

        Args:
            symbol: Trading symbol
            size: Position size
            price: Execution price
            trade_id: Unique trade identifier

        Returns:
            bool: True if trade executed successfully
        """
        try:
            # Update positions
            previous_position = self._current_positions.get(symbol, 0.0)
            new_position = previous_position + size
            self._current_positions[symbol] = new_position

            # Update P&L (simplified calculation)
            pnl_impact = size * price  # This would be more complex in real system
            self._daily_pnl[symbol] = self._daily_pnl.get(symbol, 0.0) + pnl_impact

            # Log trade execution
            self.logger.info(
                "Trade executed: %s %+.4f @ %.4f (position: %.4f -> %.4f)",
                symbol, size, price, previous_position, new_position
            )

            # Queue for processing
            trade_event = {
                'type': 'trade_executed',
                'trade_id': trade_id,
                'symbol': symbol,
                'size': size,
                'price': price,
                'timestamp': datetime.utcnow(),
                'new_position': new_position
            }

            try:
                self._trade_queue.put_nowait(trade_event)
            except queue.Full:
                self.logger.warning("Trade queue full, dropping event")

            return True

        except Exception as e:
            self.logger.error("Trade execution error: %s", e)
            return False

    def set_trading_state(self, state: TradingState, reason: str = ""):
        """Set the trading system state."""
        with self._state_lock:
            previous_state = self._trading_state
            self._trading_state = state

        self.logger.warning(
            "Trading state changed: %s -> %s (%s)",
            previous_state.value, state.value, reason
        )

        # Record emergency stops
        if state == TradingState.EMERGENCY_STOP:
            self.metrics.emergency_stops += 1

        # Queue alert
        alert = {
            'type': 'state_change',
            'previous_state': previous_state.value,
            'new_state': state.value,
            'reason': reason,
            'timestamp': datetime.utcnow()
        }

        try:
            self._alert_queue.put_nowait(alert)
        except queue.Full:
            self.logger.warning("Alert queue full, dropping alert")

    def emergency_stop(self, reason: str):
        """Trigger emergency stop of all trading."""
        self.logger.critical("EMERGENCY STOP triggered: %s", reason)
        self.set_trading_state(TradingState.EMERGENCY_STOP, reason)

        # Notify all risk callbacks
        for callback in self._risk_callbacks:
            try:
                callback(RiskLevel.EXTREME)
            except Exception as e:
                self.logger.error("Risk callback error: %s", e)

    def get_safety_status(self) -> Dict[str, Any]:
        """Get current safety system status."""
        return {
            'timestamp': datetime.utcnow(),
            'trading_state': self._trading_state.value,
            'risk_level': self._current_risk_level.value,
            'circuit_breakers': {
                name: {
                    'state': cb['state'],
                    'failure_count': cb['failure_count']
                } for name, cb in self._circuit_breakers.items()
            },
            'positions': dict(self._current_positions),
            'daily_pnl': dict(self._daily_pnl),
            'metrics': {
                'total_trades': self.metrics.total_trades,
                'blocked_trades': self.metrics.blocked_trades,
                'block_rate': (
                    self.metrics.blocked_trades / max(1, self.metrics.total_trades + self.metrics.blocked_trades)
                ),
                'circuit_breaker_trips': self.metrics.circuit_breaker_trips,
                'emergency_stops': self.metrics.emergency_stops,
                'average_response_time_ms': self.metrics.average_response_time_ms,
                'uptime_percentage': self._calculate_uptime_percentage()
            }
        }

    def _check_circuit_breakers(self, symbol: str) -> Dict[str, Any]:
        """Check circuit breaker states."""
        result = {
            'all_closed': True,
            'open_breakers': [],
            'states': {}
        }

        current_time = datetime.utcnow()

        for name, config in self._circuit_breaker_configs.items():
            breaker = self._circuit_breakers[name]
            state = breaker['state']

            # Handle half-open to open/closed transitions
            if state == 'half_open':
                if breaker['success_count'] >= config.success_threshold:
                    state = 'closed'
                    breaker['state'] = 'closed'
                    breaker['failure_count'] = 0
                    breaker['success_count'] = 0
                    self.logger.info("Circuit breaker %s closed", name)

            # Handle open to half-open transitions
            elif state == 'open':
                if breaker['last_failure_time']:
                    time_since_failure = (current_time - breaker['last_failure_time']).total_seconds()
                    if time_since_failure >= config.timeout_seconds:
                        state = 'half_open'
                        breaker['state'] = 'half_open'
                        breaker['success_count'] = 0
                        self.logger.info("Circuit breaker %s half-open", name)

            result['states'][name] = state

            if state != 'closed':
                result['all_closed'] = False
                if state == 'open':
                    result['open_breakers'].append(name)

        return result

    def _check_position_limits(self, symbol: str, size: float, price: float) -> Dict[str, Any]:
        """Check position limits for a trade."""
        result = {
            'within_limits': True,
            'violations': [],
            'current_position': self._current_positions.get(symbol, 0.0),
            'new_position': 0.0,
            'exposure_impact': 0.0
        }

        if symbol not in self._position_limits:
            return result

        limit = self._position_limits[symbol]
        current_position = self._current_positions.get(symbol, 0.0)
        new_position = current_position + size
        result['new_position'] = new_position

        # Check position size limit
        if abs(new_position) > limit.max_position_size:
            result['within_limits'] = False
            result['violations'].append(
                f"Position size limit exceeded: {abs(new_position):.2f} > {limit.max_position_size:.2f}"
            )

        # Check daily loss limit
        current_pnl = self._daily_pnl.get(symbol, 0.0)
        trade_pnl = size * price  # Simplified P&L calculation
        projected_pnl = current_pnl + trade_pnl

        if projected_pnl < -limit.max_daily_loss:
            result['within_limits'] = False
            result['violations'].append(
                f"Daily loss limit exceeded: {projected_pnl:.2f} < -{limit.max_daily_loss:.2f}"
            )
            self.metrics.position_limit_violations += 1

        # Check exposure limit
        exposure = abs(new_position * price)
        result['exposure_impact'] = exposure

        if exposure > limit.max_exposure:
            result['within_limits'] = False
            result['violations'].append(
                f"Exposure limit exceeded: {exposure:.2f} > {limit.max_exposure:.2f}"
            )

        return result

    def _processing_loop(self):
        """Process trade and alert queues."""
        while not self._shutdown_event.wait(0.1):
            try:
                # Process trades
                while not self._trade_queue.empty():
                    try:
                        trade_event = self._trade_queue.get_nowait()
                        self._process_trade_event(trade_event)
                    except queue.Empty:
                        break

                # Process alerts
                while not self._alert_queue.empty():
                    try:
                        alert = self._alert_queue.get_nowait()
                        self._process_alert(alert)
                    except queue.Empty:
                        break

            except Exception as e:
                self.logger.error("Processing loop error: %s", e)

    def _process_trade_event(self, event: Dict[str, Any]):
        """Process a trade event."""
        # This would implement trade processing logic
        # For now, just log the event
        self.logger.debug("Processed trade event: %s", event['trade_id'])

    def _process_alert(self, alert: Dict[str, Any]):
        """Process an alert."""
        # This would implement alert processing logic
        self.logger.info("Alert: %s", alert.get('type', 'unknown'))

    def _monitoring_loop(self):
        """Monitor system health and risk levels."""
        while not self._shutdown_event.wait(5.0):  # Check every 5 seconds
            try:
                self._update_risk_level()
                self._update_uptime_metrics()
            except Exception as e:
                self.logger.error("Monitoring loop error: %s", e)

    def _update_risk_level(self):
        """Update current risk level based on system state."""
        # Simple risk assessment logic
        risk_factors = 0

        # Check open circuit breakers
        open_breakers = sum(1 for cb in self._circuit_breakers.values() if cb['state'] == 'open')
        risk_factors += open_breakers * 2

        # Check position concentration
        total_exposure = sum(abs(pos) for pos in self._current_positions.values())
        if total_exposure > self.config.get('high_exposure_threshold', 1000000):
            risk_factors += 1

        # Check recent losses
        total_pnl = sum(self._daily_pnl.values())
        if total_pnl < -self.config.get('high_loss_threshold', 50000):
            risk_factors += 2

        # Map risk factors to risk level
        if risk_factors >= 5:
            new_level = RiskLevel.EXTREME
        elif risk_factors >= 4:
            new_level = RiskLevel.CRITICAL
        elif risk_factors >= 2:
            new_level = RiskLevel.HIGH
        elif risk_factors >= 1:
            new_level = RiskLevel.MEDIUM
        else:
            new_level = RiskLevel.LOW

        if new_level != self._current_risk_level:
            previous_level = self._current_risk_level
            self._current_risk_level = new_level

            self.logger.warning(
                "Risk level changed: %s -> %s (factors: %d)",
                previous_level.name, new_level.name, risk_factors
            )

            if new_level >= RiskLevel.CRITICAL:
                self.metrics.risk_escalations += 1

            # Notify callbacks
            for callback in self._risk_callbacks:
                try:
                    callback(new_level)
                except Exception as e:
                    self.logger.error("Risk callback error: %s", e)

    def _update_uptime_metrics(self):
        """Update uptime percentage."""
        total_runtime = datetime.utcnow() - self._start_time
        if total_runtime.total_seconds() > 0:
            # Simplified uptime calculation
            # In real system, this would track actual downtime
            self.metrics.uptime_percentage = 99.9  # Placeholder

    def _calculate_uptime_percentage(self) -> float:
        """Calculate current uptime percentage."""
        return self.metrics.uptime_percentage

    def register_risk_callback(self, callback: Callable[[RiskLevel], None]):
        """Register a callback for risk level changes."""
        self._risk_callbacks.append(callback)
        self.logger.info("Registered risk callback")

    def trip_circuit_breaker(self, breaker_name: str, reason: str):
        """Manually trip a circuit breaker."""
        if breaker_name in self._circuit_breakers:
            breaker = self._circuit_breakers[breaker_name]
            breaker['state'] = 'open'
            breaker['failure_count'] += 1
            breaker['last_failure_time'] = datetime.utcnow()
            self.metrics.circuit_breaker_trips += 1

            self.logger.warning("Circuit breaker %s tripped: %s", breaker_name, reason)
        else:
            self.logger.error("Unknown circuit breaker: %s", breaker_name)