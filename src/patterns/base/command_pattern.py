"""Command Pattern Base Classes.

Provides base classes for implementing command patterns with state management
and observers for complex system coordination.
"""

from typing import Any, Dict, List, Optional, Union, Callable, TypeVar
import logging
import time

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum, auto
import threading

logger = logging.getLogger(__name__)

T = TypeVar('T')

class CommandStatus(Enum):
    """Command execution status."""
    PENDING = auto()
    EXECUTING = auto()
    COMPLETED = auto()
    FAILED = auto()
    CANCELLED = auto()

@dataclass
class CommandResult:
    """Result of command execution."""
    command_id: str
    status: CommandStatus
    result: Any = None
    error: Optional[str] = None
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_successful(self) -> bool:
        """Check if command was successful."""
        return self.status == CommandStatus.COMPLETED and self.error is None

class Command(ABC):
    """Abstract base command."""

    def __init__(self, command_id: str, name: str):
        self.command_id = command_id
        self.name = name
        self.status = CommandStatus.PENDING
        self.timestamp = time.time()
        self.metadata: Dict[str, Any] = {}

    @abstractmethod
    def execute(self) -> CommandResult:
        """Execute the command."""

    @abstractmethod
    def undo(self) -> CommandResult:
        """Undo the command (if possible)."""

    @abstractmethod
    def can_undo(self) -> bool:
        """Check if command can be undone."""

    def get_id(self) -> str:
        """Get command ID."""
        return self.command_id

    def get_name(self) -> str:
        """Get command name."""
        return self.name

    def set_metadata(self, key: str, value: Any) -> None:
        """Set metadata."""
        self.metadata[key] = value

    def get_metadata(self, key: str, default: Any = None) -> Any:
        """Get metadata."""
        return self.metadata.get(key, default)

class UndoableCommand(Command):
    """Base class for commands that can be undone."""

    def __init__(self, command_id: str, name: str):
        super().__init__(command_id, name)
        self._backup_state: Optional[Any] = None

    def can_undo(self) -> bool:
        """Most undoable commands can be undone after execution."""
        return self.status == CommandStatus.COMPLETED

    def _save_state(self, state: Any) -> None:
        """Save state for undo operation."""
        self._backup_state = state

    def _restore_state(self) -> Any:
        """Restore saved state."""
        return self._backup_state

class CompositeCommand(Command):
    """Command that contains multiple sub-commands."""

    def __init__(self, command_id: str, name: str):
        super().__init__(command_id, name)
        self.sub_commands: List[Command] = []
        self.executed_commands: List[Command] = []

    def add_command(self, command: Command) -> None:
        """Add sub-command."""
        self.sub_commands.append(command)

    def execute(self) -> CommandResult:
        """Execute all sub-commands."""
        start_time = time.perf_counter()
        results = []

        try:
            self.status = CommandStatus.EXECUTING

            for command in self.sub_commands:
                result = command.execute()
                results.append(result)
                self.executed_commands.append(command)

                if not result.is_successful():
                    # If any command fails, stop execution
                    self.status = CommandStatus.FAILED
                    return CommandResult(
                        command_id=self.command_id,
                        status=self.status,
                        error=f"Sub-command {command.get_name()} failed: {result.error}",
                        execution_time_ms=(time.perf_counter() - start_time) * 1000,
                        metadata={'sub_results': results}
                    )

            self.status = CommandStatus.COMPLETED
            return CommandResult(
                command_id=self.command_id,
                status=self.status,
                result=results,
                execution_time_ms=(time.perf_counter() - start_time) * 1000,
                metadata={'sub_results': results}
            )

        except Exception as e:
            self.status = CommandStatus.FAILED
            logger.error(f"Composite command {self.name} failed: {e}")
            return CommandResult(
                command_id=self.command_id,
                status=self.status,
                error=str(e),
                execution_time_ms=(time.perf_counter() - start_time) * 1000
            )

    def undo(self) -> CommandResult:
        """Undo all executed sub-commands in reverse order."""
        if not self.can_undo():
            return CommandResult(
                command_id=self.command_id,
                status=CommandStatus.FAILED,
                error="Cannot undo composite command"
            )

        results = []
        # Undo in reverse order
        for command in reversed(self.executed_commands):
            if command.can_undo():
                result = command.undo()
                results.append(result)

        return CommandResult(
            command_id=self.command_id,
            status=CommandStatus.COMPLETED,
            result=results,
            metadata={'undo_results': results}
        )

    def can_undo(self) -> bool:
        """Can undo if all executed commands can be undone."""
        return (self.status == CommandStatus.COMPLETED and
                all(cmd.can_undo() for cmd in self.executed_commands))

class CommandInvoker:
    """Command invoker that executes and manages commands."""

    def __init__(self):
        self.command_history: List[Command] = []
        self.undo_stack: List[Command] = []
        self.redo_stack: List[Command] = []
        self._lock = threading.RLock()

    def execute_command(self, command: Command) -> CommandResult:
        """Execute command and add to history."""
        with self._lock:
            try:
                result = command.execute()

                # Add to history
                self.command_history.append(command)

                # If successful and can be undone, add to undo stack
                if result.is_successful() and command.can_undo():
                    self.undo_stack.append(command)
                    # Clear redo stack on new command
                    self.redo_stack.clear()

                logger.info(f"Executed command {command.get_name()}: {result.status}")
                return result

            except Exception as e:
                logger.error(f"Command execution failed: {e}")
                return CommandResult(
                    command_id=command.get_id(),
                    status=CommandStatus.FAILED,
                    error=str(e)
                )

    def undo_last_command(self) -> Optional[CommandResult]:
        """Undo the last command."""
        with self._lock:
            if not self.undo_stack:
                return None

            command = self.undo_stack.pop()
            try:
                result = command.undo()
                if result.is_successful():
                    self.redo_stack.append(command)
                logger.info(f"Undid command {command.get_name()}")
                return result

            except Exception as e:
                logger.error(f"Undo failed: {e}")
                return CommandResult(
                    command_id=command.get_id(),
                    status=CommandStatus.FAILED,
                    error=str(e)
                )

    def redo_last_command(self) -> Optional[CommandResult]:
        """Redo the last undone command."""
        with self._lock:
            if not self.redo_stack:
                return None

            command = self.redo_stack.pop()
            try:
                result = command.execute()
                if result.is_successful():
                    self.undo_stack.append(command)
                logger.info(f"Redid command {command.get_name()}")
                return result

            except Exception as e:
                logger.error(f"Redo failed: {e}")
                return CommandResult(
                    command_id=command.get_id(),
                    status=CommandStatus.FAILED,
                    error=str(e)
                )

    def can_undo(self) -> bool:
        """Check if undo is available."""
        return len(self.undo_stack) > 0

    def can_redo(self) -> bool:
        """Check if redo is available."""
        return len(self.redo_stack) > 0

    def get_command_history(self) -> List[Command]:
        """Get command execution history."""
        with self._lock:
            return self.command_history.copy()

    def clear_history(self) -> None:
        """Clear all command history."""
        with self._lock:
            self.command_history.clear()
            self.undo_stack.clear()
            self.redo_stack.clear()

class CommandQueue:
    """Queue for asynchronous command execution."""

    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self.queue: List[Command] = []
        self.processing = False
        self._lock = threading.RLock()

    def enqueue_command(self, command: Command) -> bool:
        """Add command to queue."""
        with self._lock:
            if len(self.queue) >= self.max_size:
                return False

            self.queue.append(command)
            command.status = CommandStatus.PENDING
            return True

    def dequeue_command(self) -> Optional[Command]:
        """Get next command from queue."""
        with self._lock:
            if not self.queue:
                return None
            return self.queue.pop(0)

    def peek_next_command(self) -> Optional[Command]:
        """Peek at next command without removing."""
        with self._lock:
            return self.queue[0] if self.queue else None

    def get_queue_size(self) -> int:
        """Get current queue size."""
        with self._lock:
            return len(self.queue)

    def clear_queue(self) -> None:
        """Clear all pending commands."""
        with self._lock:
            self.queue.clear()

    def get_pending_commands(self) -> List[Command]:
        """Get list of pending commands."""
        with self._lock:
            return [cmd for cmd in self.queue if cmd.status == CommandStatus.PENDING]

class CommandProcessor:
    """Processor for executing commands from a queue."""

    def __init__(self, invoker: CommandInvoker, queue: CommandQueue):
        self.invoker = invoker
        self.queue = queue
        self.is_running = False
        self.execution_thread: Optional[threading.Thread] = None

    def start_processing(self) -> None:
        """Start processing commands from queue."""
        if self.is_running:
            return

        self.is_running = True
        self.execution_thread = threading.Thread(target=self._process_commands)
        self.execution_thread.daemon = True
        self.execution_thread.start()

    def stop_processing(self) -> None:
        """Stop processing commands."""
        self.is_running = False
        if self.execution_thread:
            self.execution_thread.join(timeout=5.0)

    def _process_commands(self) -> None:
        """Process commands from queue."""
        while self.is_running:
            command = self.queue.dequeue_command()
            if command:
                result = self.invoker.execute_command(command)
                logger.debug(f"Processed command {command.get_name()}: {result.status}")
            else:
                # No commands, wait a bit
                time.sleep(0.1)

class CommandFactory:
    """Factory for creating commands."""

    def __init__(self):
        self._command_types: Dict[str, type] = {}

    def register_command_type(self, name: str, command_class: type) -> None:
        """Register a command type."""
        self._command_types[name] = command_class

    def create_command(self, command_type: str, command_id: str,
                        **kwargs) -> Optional[Command]:
        """Create command of specified type."""
        if command_type not in self._command_types:
            logger.error(f"Unknown command type: {command_type}")
            return None

        try:
            command_class = self._command_types[command_type]
            return command_class(command_id, **kwargs)
        except Exception as e:
            logger.error(f"Failed to create command {command_type}: {e}")
            return None

    def get_available_types(self) -> List[str]:
        """Get available command types."""
        return list(self._command_types.keys())

class MacroCommand(CompositeCommand):
    """Macro command that can record and replay command sequences."""

    def __init__(self, command_id: str, name: str):
        super().__init__(command_id, name)
        self.is_recording = False

    def start_recording(self) -> None:
        """Start recording commands."""
        self.is_recording = True
        self.sub_commands.clear()

    def stop_recording(self) -> None:
        """Stop recording commands."""
        self.is_recording = False

    def record_command(self, command: Command) -> None:
        """Record a command if recording is active."""
        if self.is_recording:
            self.add_command(command)

class CommandScheduler:
    """Scheduler for delayed and scheduled command execution."""

    def __init__(self, invoker: CommandInvoker):
        self.invoker = invoker
        self.scheduled_commands: List[Dict[str, Any]] = []
        self._lock = threading.RLock()

    def schedule_command(self, command: Command, delay_seconds: float) -> None:
        """Schedule command for later execution."""
        with self._lock:
            execute_time = time.time() + delay_seconds
            self.scheduled_commands.append({
                'command': command,
                'execute_time': execute_time
            })

    def process_scheduled_commands(self) -> List[CommandResult]:
        """Process any due scheduled commands."""
        current_time = time.time()
        results = []

        with self._lock:
            due_commands = [
                item for item in self.scheduled_commands
                if item['execute_time'] <= current_time
            ]

            # Remove due commands from schedule
            self.scheduled_commands = [
                item for item in self.scheduled_commands
                if item['execute_time'] > current_time
            ]

        # Execute due commands
        for item in due_commands:
            result = self.invoker.execute_command(item['command'])
            results.append(result)

        return results

    def get_scheduled_count(self) -> int:
        """Get number of scheduled commands."""
        with self._lock:
            return len(self.scheduled_commands)