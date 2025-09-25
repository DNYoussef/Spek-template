"""Trading State Machine Implementation.

Implements Observer + State Machine patterns for trading systems.
Provides state management and observers for trading system coordination.
"""

from datetime import datetime
from typing import Dict, List, Any, Optional, Callable
import logging

from dataclasses import dataclass
from decimal import Decimal

from src.patterns.base.observer_pattern import (
    State, StateMachine, Observer, Event, EventType, EventBus,
    ObservableStateMachine
)

logger = logging.getLogger(__name__)

class TradingEventType(EventType):
    """Trading-specific event types."""
    POSITION_OPENED = "position_opened"
    POSITION_CLOSED = "position_closed"
    RISK_LIMIT_BREACHED = "risk_limit_breached"
    MARKET_DATA_UPDATED = "market_data_updated"
    ORDER_FILLED = "order_filled"
    ORDER_REJECTED = "order_rejected"

@dataclass
class TradingContext:
    """Trading context data."""
    account_balance: Decimal
    positions: Dict[str, Decimal]
    open_orders: List[Dict[str, Any]]
    risk_metrics: Dict[str, float]
    market_conditions: Dict[str, Any]
    last_trade_time: Optional[datetime] = None

class IdleState(State):
    """Idle trading state - waiting for signals."""

    def enter(self, context: 'TradingStateMachine') -> None:
        """Enter idle state."""
        logger.info("Entering IDLE state")
        context.set_context_data('last_state_change', datetime.now())

    def exit(self, context: 'TradingStateMachine') -> None:
        """Exit idle state."""
        logger.info("Exiting IDLE state")

    def handle_event(self, context: 'TradingStateMachine', event: Event) -> Optional['State']:
        """Handle events in idle state."""
        if event.event_type == TradingEventType.MARKET_DATA_UPDATED:
            # Analyze if we should move to analyzing state
            market_data = event.data
            if self._should_analyze_market(market_data):
                return AnalyzingState()
        
        elif event.event_type == TradingEventType.RISK_LIMIT_BREACHED:
            return RiskManagementState()
        
        return None

    def _should_analyze_market(self, market_data: Dict[str, Any]) -> bool:
        """Determine if market conditions warrant analysis."""
        # Simple logic - analyze if volatility is above threshold
        volatility = market_data.get('volatility', 0.0)
        return volatility > 0.2  # 2% volatility threshold

class AnalyzingState(State):
    """Analyzing market conditions for trading opportunities."""

    def enter(self, context: 'TradingStateMachine') -> None:
        """Enter analyzing state."""
        logger.info("Entering ANALYZING state")
        context.set_context_data('analysis_start_time', datetime.now())

    def exit(self, context: 'TradingStateMachine') -> None:
        """Exit analyzing state."""
        logger.info("Exiting ANALYZING state")

    def handle_event(self, context: 'TradingStateMachine', event: Event) -> Optional['State']:
        """Handle events in analyzing state."""
        if event.event_type == TradingEventType.MARKET_DATA_UPDATED:
            # Continue analysis or move to trading
            analysis_result = self._analyze_opportunity(event.data)
            
            if analysis_result['trade_signal']:
                return TradingState()
            elif analysis_result['no_opportunity']:
                return IdleState()
        
        elif event.event_type == TradingEventType.RISK_LIMIT_BREACHED:
            return RiskManagementState()
        
        return None

    def _analyze_opportunity(self, market_data: Dict[str, Any]) -> Dict[str, bool]:
        """Analyze trading opportunity."""
        # Simplified analysis logic
        price_change = market_data.get('price_change_pct', 0.0)
        volume = market_data.get('volume', 0)
        
        trade_signal = abs(price_change) > 0.1 and volume > 10000
        no_opportunity = abs(price_change) < 0.5
        
        return {
            'trade_signal': trade_signal,
            'no_opportunity': no_opportunity
        }

class TradingState(State):
    """Active trading state - executing trades."""

    def enter(self, context: 'TradingStateMachine') -> None:
        """Enter trading state."""
        logger.info("Entering TRADING state")
        context.set_context_data('trading_start_time', datetime.now())

    def exit(self, context: 'TradingStateMachine') -> None:
        """Exit trading state."""
        logger.info("Exiting TRADING state")

    def handle_event(self, context: 'TradingStateMachine', event: Event) -> Optional['State']:
        """Handle events in trading state."""
        if event.event_type == TradingEventType.ORDER_FILLED:
            # Trade completed successfully
            return MonitoringState()
        
        elif event.event_type == TradingEventType.ORDER_REJECTED:
            # Trade rejected, return to analysis
            return AnalyzingState()
        
        elif event.event_type == TradingEventType.RISK_LIMIT_BREACHED:
            return RiskManagementState()
        
        return None

class MonitoringState(State):
    """Monitoring active positions."""

    def enter(self, context: 'TradingStateMachine') -> None:
        """Enter monitoring state."""
        logger.info("Entering MONITORING state")
        context.set_context_data('monitoring_start_time', datetime.now())

    def exit(self, context: 'TradingStateMachine') -> None:
        """Exit monitoring state."""
        logger.info("Exiting MONITORING state")

    def handle_event(self, context: 'TradingStateMachine', event: Event) -> Optional['State']:
        """Handle events in monitoring state."""
        if event.event_type == TradingEventType.POSITION_CLOSED:
            # Position closed, return to idle
            return IdleState()
        
        elif event.event_type == TradingEventType.RISK_LIMIT_BREACHED:
            return RiskManagementState()
        
        elif event.event_type == TradingEventType.MARKET_DATA_UPDATED:
            # Check if we need to adjust position
            if self._should_adjust_position(event.data):
                return TradingState()
        
        return None

    def _should_adjust_position(self, market_data: Dict[str, Any]) -> bool:
        """Determine if position needs adjustment."""
        # Simple logic for position adjustment
        price_change = market_data.get('price_change_pct', 0.0)
        return abs(price_change) > 0.5  # 5% move triggers adjustment

class RiskManagementState(State):
    """Risk management state - handling risk limit breaches."""

    def enter(self, context: 'TradingStateMachine') -> None:
        """Enter risk management state."""
        logger.warning("Entering RISK_MANAGEMENT state")
        context.set_context_data('risk_management_start_time', datetime.now())

    def exit(self, context: 'TradingStateMachine') -> None:
        """Exit risk management state."""
        logger.info("Exiting RISK_MANAGEMENT state")

    def handle_event(self, context: 'TradingStateMachine', event: Event) -> Optional['State']:
        """Handle events in risk management state."""
        # Risk management always tries to reduce risk first
        if event.event_type == TradingEventType.POSITION_CLOSED:
            # Risk reduced, can return to idle
            return IdleState()
        
        # Stay in risk management until risk is reduced
        return None

class TradingObserver(Observer):
    """Base trading observer."""

    def __init__(self, name: str, callback: Optional[Callable[[Event], None]] = None):
        super().__init__(name)
        self.callback = callback
        self.event_history: List[Event] = []

    def update(self, event: Event) -> None:
        """Handle trading event."""
        self.event_history.append(event)
        
        if self.callback:
            try:
                self.callback(event)
            except Exception as e:
                logger.error(f"Observer {self.name} callback failed: {e}")
        
        logger.info(f"Observer {self.name} received event: {event.event_type}")

class PositionObserver(TradingObserver):
    """Observer for position-related events."""

    def __init__(self):
        super().__init__("position_observer")
        self.positions: Dict[str, Decimal] = {}

    def update(self, event: Event) -> None:
        """Handle position events."""
        super().update(event)
        
        if event.event_type == TradingEventType.POSITION_OPENED:
            symbol = event.data['symbol']
            size = event.data['size']
            self.positions[symbol] = self.positions.get(symbol, Decimal('0')) + size
            logger.info(f"Position opened: {symbol} size {size}")
        
        elif event.event_type == TradingEventType.POSITION_CLOSED:
            symbol = event.data['symbol']
            if symbol in self.positions:
                del self.positions[symbol]
            logger.info(f"Position closed: {symbol}")

class RiskObserver(TradingObserver):
    """Observer for risk-related events."""

    def __init__(self):
        super().__init__("risk_observer")
        self.risk_metrics: Dict[str, float] = {}
        self.risk_alerts: List[Dict[str, Any]] = []

    def update(self, event: Event) -> None:
        """Handle risk events."""
        super().update(event)
        
        if event.event_type == TradingEventType.RISK_LIMIT_BREACHED:
            alert = {
                'timestamp': event.timestamp,
                'risk_type': event.data.get('risk_type'),
                'current_value': event.data.get('current_value'),
                'limit': event.data.get('limit')
            }
            self.risk_alerts.append(alert)
            logger.warning(f"Risk limit breached: {alert}")

class TradingStateMachine(ObservableStateMachine):
    """Main trading state machine with observers."""

    def __init__(self, event_bus: EventBus, trading_context: TradingContext):
        initial_state = IdleState()
        super().__init__("trading_system", initial_state, event_bus)
        
        self.trading_context = trading_context
        self._setup_observers()
        self._setup_transitions()

    def _setup_observers(self):
        """Setup trading observers."""
        position_observer = PositionObserver()
        risk_observer = RiskObserver()
        
        self.attach(position_observer)
        self.attach(risk_observer)
        
        # Store references for external access
        self._position_observer = position_observer
        self._risk_observer = risk_observer

    def _setup_transitions(self):
        """Setup state transitions."""
        from src.patterns.base.observer_pattern import Transition
        
        # Define transitions
        transitions = [
            Transition(
                "idle", "analyzing",
                condition=lambda e: e.event_type == TradingEventType.MARKET_DATA_UPDATED
            ),
            Transition(
                "analyzing", "trading",
                condition=lambda e: e.event_type == TradingEventType.MARKET_DATA_UPDATED
            ),
            Transition(
                "trading", "monitoring",
                condition=lambda e: e.event_type == TradingEventType.ORDER_FILLED
            ),
            Transition(
                "monitoring", "idle",
                condition=lambda e: e.event_type == TradingEventType.POSITION_CLOSED
            ),
            # Risk management transitions from any state
            Transition(
                "*", "risk_management",
                condition=lambda e: e.event_type == TradingEventType.RISK_LIMIT_BREACHED
            )
        ]
        
        for transition in transitions:
            self.add_transition(transition)

    def update_market_data(self, market_data: Dict[str, Any]) -> None:
        """Update with new market data."""
        event = Event(
            event_type=TradingEventType.MARKET_DATA_UPDATED,
            source="market_data_provider",
            data=market_data
        )
        self.handle_event(event)

    def open_position(self, symbol: str, size: Decimal) -> None:
        """Open a trading position."""
        event = Event(
            event_type=TradingEventType.POSITION_OPENED,
            source="trading_system",
            data={'symbol': symbol, 'size': size}
        )
        self.handle_event(event)

    def close_position(self, symbol: str) -> None:
        """Close a trading position."""
        event = Event(
            event_type=TradingEventType.POSITION_CLOSED,
            source="trading_system",
            data={'symbol': symbol}
        )
        self.handle_event(event)

    def trigger_risk_alert(self, risk_type: str, current_value: float, limit: float) -> None:
        """Trigger risk limit breach."""
        event = Event(
            event_type=TradingEventType.RISK_LIMIT_BREACHED,
            source="risk_monitor",
            data={
                'risk_type': risk_type,
                'current_value': current_value,
                'limit': limit
            }
        )
        self.handle_event(event)

    def get_current_positions(self) -> Dict[str, Decimal]:
        """Get current positions from observer."""
        return self._position_observer.positions.copy()

    def get_risk_alerts(self) -> List[Dict[str, Any]]:
        """Get risk alerts from observer."""
        return self._risk_observer.risk_alerts.copy()

    def get_trading_summary(self) -> Dict[str, Any]:
        """Get trading system summary."""
        return {
            'current_state': self.get_current_state().name,
            'positions_count': len(self.get_current_positions()),
            'risk_alerts_count': len(self.get_risk_alerts()),
            'observer_count': self.get_observer_count(),
            'state_history': self.get_state_history()[-10:],  # Last 10 states
            'context_data': self._context_data.copy()
        }

# Factory function
def create_trading_system(event_bus: EventBus = None) -> TradingStateMachine:
    """Create configured trading state machine."""
    if event_bus is None:
        event_bus = EventBus()
    
    # Initialize trading context
    trading_context = TradingContext(
        account_balance=Decimal('100000'),
        positions={},
        open_orders=[],
        risk_metrics={},
        market_conditions={}
    )
    
    return TradingStateMachine(event_bus, trading_context)
