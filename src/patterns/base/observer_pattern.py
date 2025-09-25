"""Observer and State Machine Pattern Base Classes.

Provides base classes for implementing observer patterns with state machines
for event-driven architectures and state management.
"""

from typing import Any, Dict, List, Optional, Set, Type, Callable, TypeVar
import logging
import time

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum, auto
import threading

logger = logging.getLogger(__name__)

T = TypeVar('T')

class EventType(Enum):
    """Standard event types."""
    STATE_CHANGED = auto()
    DATA_UPDATED = auto()
    ERROR_OCCURRED = auto()
    SYSTEM_STARTED = auto()
    SYSTEM_STOPPED = auto()
    CUSTOM = auto()

@dataclass
class Event:
    """Event data structure."""
    event_type: EventType
    source: str
    data: Any
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class Observer(ABC):
    """Abstract observer interface."""

    def __init__(self, name: str):
        self.name = name
        self._is_active = True

    @abstractmethod
    def update(self, event: Event) -> None:
        """Handle event notification."""

    def activate(self) -> None:
        """Activate observer."""
        self._is_active = True

    def deactivate(self) -> None:
        """Deactivate observer."""
        self._is_active = False

    def is_active(self) -> bool:
        """Check if observer is active."""
        return self._is_active

    def get_name(self) -> str:
        """Get observer name."""
        return self.name

class ConditionalObserver(Observer):
    """Observer that only responds to events matching condition."""

    def __init__(self, name: str, condition: Callable[[Event], bool]):
        super().__init__(name)
        self.condition = condition
        self._handler: Optional[Callable[[Event], None]] = None

    def set_handler(self, handler: Callable[[Event], None]) -> None:
        """Set event handler."""
        self._handler = handler

    def update(self, event: Event) -> None:
        """Handle event if condition matches."""
        if self._is_active and self.condition(event) and self._handler:
            try:
                self._handler(event)
            except Exception as e:
                logger.error(f"Observer {self.name} handler failed: {e}")

class Subject(ABC):
    """Abstract subject interface."""

    def __init__(self, name: str):
        self.name = name
        self._observers: Set[Observer] = set()
        self._lock = threading.RLock()

    def attach(self, observer: Observer) -> None:
        """Attach observer."""
        with self._lock:
            self._observers.add(observer)
            logger.debug(f"Observer {observer.name} attached to {self.name}")

    def detach(self, observer: Observer) -> None:
        """Detach observer."""
        with self._lock:
            self._observers.discard(observer)
            logger.debug(f"Observer {observer.name} detached from {self.name}")

    def notify(self, event: Event) -> None:
        """Notify all observers."""
        with self._lock:
            active_observers = [obs for obs in self._observers if obs.is_active()]

        for observer in active_observers:
            try:
                observer.update(event)
            except Exception as e:
                logger.error(f"Observer {observer.name} update failed: {e}")

    def get_observer_count(self) -> int:
        """Get number of attached observers."""
        with self._lock:
            return len(self._observers)

    def get_active_observer_count(self) -> int:
        """Get number of active observers."""
        with self._lock:
            return len([obs for obs in self._observers if obs.is_active()])

class EventBus:
    """Central event bus for decoupled communication."""

    def __init__(self):
        self._subscribers: Dict[EventType, List[Observer]] = {}
        self._lock = threading.RLock()
        self._event_history: List[Event] = []
        self._max_history = 1000

    def subscribe(self, event_type: EventType, observer: Observer) -> None:
        """Subscribe observer to event type."""
        with self._lock:
            if event_type not in self._subscribers:
                self._subscribers[event_type] = []
            self._subscribers[event_type].append(observer)
            logger.debug(f"Observer {observer.name} subscribed to {event_type.name}")

    def unsubscribe(self, event_type: EventType, observer: Observer) -> None:
        """Unsubscribe observer from event type."""
        with self._lock:
            if event_type in self._subscribers:
                try:
                    self._subscribers[event_type].remove(observer)
                    logger.debug(f"Observer {observer.name} unsubscribed from {event_type.name}")
                except ValueError:
                    pass

    def publish(self, event: Event) -> None:
        """Publish event to all subscribers."""
        with self._lock:
            # Store in history
            self._event_history.append(event)
            if len(self._event_history) > self._max_history:
                self._event_history.pop(0)

            # Notify subscribers
            subscribers = self._subscribers.get(event.event_type, [])

        for observer in subscribers:
            if observer.is_active():
                try:
                    observer.update(event)
                except Exception as e:
                    logger.error(f"Event handling failed for {observer.name}: {e}")

    def get_event_history(self, event_type: Optional[EventType] = None) -> List[Event]:
        """Get event history."""
        with self._lock:
            if event_type is None:
                return self._event_history.copy()
            return [e for e in self._event_history if e.event_type == event_type]

class State(ABC):
    """Abstract state interface."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def enter(self, context: 'StateMachine') -> None:
        """Called when entering state."""

    @abstractmethod
    def exit(self, context: 'StateMachine') -> None:
        """Called when exiting state."""

    @abstractmethod
    def handle_event(self, context: 'StateMachine', event: Event) -> Optional['State']:
        """Handle event and return next state or None."""

    def get_name(self) -> str:
        """Get state name."""
        return self.name

class Transition:
    """State transition definition."""

    def __init__(self, from_state: str, to_state: str,
                condition: Callable[[Event], bool] = None,
                action: Callable[['StateMachine', Event], None] = None):
        self.from_state = from_state
        self.to_state = to_state
        self.condition = condition or (lambda e: True)
        self.action = action

    def can_transition(self, event: Event) -> bool:
        """Check if transition condition is met."""
        try:
            return self.condition(event)
        except Exception as e:
            logger.error(f"Transition condition evaluation failed: {e}")
            return False

    def execute_action(self, context: 'StateMachine', event: Event) -> None:
        """Execute transition action."""
        if self.action:
            try:
                self.action(context, event)
            except Exception as e:
                logger.error(f"Transition action failed: {e}")

class StateMachine(Subject):
    """State machine with observer pattern."""

    def __init__(self, name: str, initial_state: State):
        super().__init__(name)
        self.states: Dict[str, State] = {}
        self.transitions: List[Transition] = []
        self._current_state = initial_state
        self._context_data: Dict[str, Any] = {}
        self._state_history: List[str] = []
        self._max_history = 100

        # Register initial state
        self.add_state(initial_state)
        self._current_state.enter(self)

    def add_state(self, state: State) -> None:
        """Add state to machine."""
        self.states[state.name] = state

    def add_transition(self, transition: Transition) -> None:
        """Add transition to machine."""
        self.transitions.append(transition)

    def get_current_state(self) -> State:
        """Get current state."""
        return self._current_state

    def get_context_data(self, key: str, default: Any = None) -> Any:
        """Get context data."""
        return self._context_data.get(key, default)

    def set_context_data(self, key: str, value: Any) -> None:
        """Set context data."""
        self._context_data[key] = value

    def handle_event(self, event: Event) -> None:
        """Handle event and potentially trigger state transition."""
        current_state_name = self._current_state.name

        # Let current state handle event first
        next_state = self._current_state.handle_event(self, event)

        if next_state:
            self._transition_to_state(next_state, event)
        else:
            # Check for configured transitions
            for transition in self.transitions:
                if (transition.from_state == current_state_name and
                    transition.can_transition(event)):

                    target_state = self.states.get(transition.to_state)
                    if target_state:
                        transition.execute_action(self, event)
                        self._transition_to_state(target_state, event)
                        break

    def _transition_to_state(self, new_state: State, triggering_event: Event) -> None:
        """Transition to new state."""
        old_state = self._current_state

        try:
            # Exit current state
            old_state.exit(self)

            # Change state
            self._current_state = new_state

            # Update history
            self._state_history.append(new_state.name)
            if len(self._state_history) > self._max_history:
                self._state_history.pop(0)

            # Enter new state
            new_state.enter(self)

            # Notify observers of state change
            state_event = Event(
                event_type=EventType.STATE_CHANGED,
                source=self.name,
                data={
                    'old_state': old_state.name,
                    'new_state': new_state.name,
                    'triggering_event': triggering_event
                }
            )
            self.notify(state_event)

            logger.debug(f"State transition: {old_state.name} -> {new_state.name}")

        except Exception as e:
            logger.error(f"State transition failed: {e}")

    def get_state_history(self) -> List[str]:
        """Get state transition history."""
        return self._state_history.copy()

    def get_available_transitions(self) -> List[str]:
        """Get available transitions from current state."""
        current_state_name = self._current_state.name
        return [t.to_state for t in self.transitions
                if t.from_state == current_state_name]

class ObservableStateMachine(StateMachine):
    """State machine that publishes events to event bus."""

    def __init__(self, name: str, initial_state: State, event_bus: EventBus):
        super().__init__(name, initial_state)
        self.event_bus = event_bus

    def notify(self, event: Event) -> None:
        """Notify observers and publish to event bus."""
        super().notify(event)
        self.event_bus.publish(event)