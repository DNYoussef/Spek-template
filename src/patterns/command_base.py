# SPDX-License-Identifier: MIT
"""
Base Command Pattern Implementation
==================================

Core command pattern classes providing a foundation for all command-based
operations throughout the system. Supports undo, queuing, and logging.

Used by:
- Analysis operations (Batch 4)
- CLI operations (Batch 5)
- Performance monitoring (Batch 7)
- Security operations (Batch 8)
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import json
import logging

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class CommandResult:
    """Command execution result with standardized structure."""
    success: bool
    data: Any = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    execution_time_ms: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary for serialization."""
        return {
            'success': self.success,
            'data': self.data,
            'error': self.error,
            'metadata': self.metadata,
            'execution_time_ms': self.execution_time_ms,
            'timestamp': self.timestamp.isoformat()
        }

class Command(ABC):
    """
    Abstract base class for all commands following Command Pattern.

    Provides standardized interface for execution, validation, and undo operations.
    All commands must implement execute() and may optionally implement undo().
    """

    def __init__(self, command_id: Optional[str] = None):
        self.command_id = command_id or f"{self.__class__.__name__}_{id(self)}"
        self.execution_start: Optional[datetime] = None
        self.execution_result: Optional[CommandResult] = None
        self.can_undo = False

    @abstractmethod
    def execute(self) -> CommandResult:
        """
        Execute the command and return result.

        Returns:
            CommandResult with execution outcome
        """

    def undo(self) -> CommandResult:
        """
        Undo command execution if supported.

        Returns:
            CommandResult indicating undo success/failure
        """
        if not self.can_undo:
            return CommandResult(
                success=False,
                error=f"Command {self.__class__.__name__} does not support undo"
            )

        return self._execute_undo()

    def _execute_undo(self) -> CommandResult:
        """Override in subclasses that support undo."""
        return CommandResult(
            success=False,
            error="Undo not implemented"
        )

    def validate(self) -> CommandResult:
        """
        Validate command parameters before execution.

        Returns:
            CommandResult indicating validation success/failure
        """
        return CommandResult(success=True, data="Validation passed")

    def get_description(self) -> str:
        """Get human-readable description of command."""
        return f"{self.__class__.__name__}({self.command_id})"

    def get_execution_metadata(self) -> Dict[str, Any]:
        """Get metadata about command execution."""
        return {
            'command_id': self.command_id,
            'command_type': self.__class__.__name__,
            'execution_start': self.execution_start.isoformat() if self.execution_start else None,
            'can_undo': self.can_undo,
            'executed': self.execution_result is not None
        }

class CompositeCommand(Command):
    """
    Composite command that executes multiple sub-commands in sequence.

    Useful for complex operations that consist of multiple steps.
    Supports partial rollback on failure.
    """

    def __init__(self, commands: List[Command], command_id: Optional[str] = None):
        super().__init__(command_id)
        self.commands = commands or []
        self.completed_commands: List[Command] = []
        self.can_undo = True

    def execute(self) -> CommandResult:
        """Execute all sub-commands in sequence."""
        self.execution_start = datetime.now()
        start_time = self.execution_start.timestamp()

        try:
            for command in self.commands:
                result = command.execute()

                if not result.success:
                    # Rollback completed commands
                    self._rollback_completed()
                    return CommandResult(
                        success=False,
                        error=f"Command {command.get_description()} failed: {result.error}",
                        metadata={
                            'failed_command': command.command_id,
                            'completed_count': len(self.completed_commands)
                        },
                        execution_time_ms=(datetime.now().timestamp() - start_time) * 1000
                    )

                self.completed_commands.append(command)

            # All commands succeeded
            execution_time = (datetime.now().timestamp() - start_time) * 1000
            self.execution_result = CommandResult(
                success=True,
                data={
                    'commands_executed': len(self.commands),
                    'results': [cmd.execution_result.to_dict() for cmd in self.completed_commands if cmd.execution_result]
                },
                execution_time_ms=execution_time
            )

            return self.execution_result

        except Exception as e:
            self._rollback_completed()
            return CommandResult(
                success=False,
                error=f"Composite command execution failed: {str(e)}",
                execution_time_ms=(datetime.now().timestamp() - start_time) * 1000
            )

    def _rollback_completed(self):
        """Rollback all completed commands in reverse order."""
        for command in reversed(self.completed_commands):
            try:
                if command.can_undo:
                    command.undo()
            except Exception as e:
                logger.error(f"Failed to rollback command {command.command_id}: {e}")

        self.completed_commands.clear()

    def _execute_undo(self) -> CommandResult:
        """Undo all completed commands."""
        self._rollback_completed()
        return CommandResult(success=True, data="Composite command undone")

class CommandInvoker:
    """
    Command invoker that manages command execution, queuing, and history.

    Provides centralized command execution with logging, error handling,
    and optional command queuing for batch operations.
    """

    def __init__(self, max_history: int = 100):
        self.max_history = max_history
        self.command_history: List[Command] = []
        self.command_queue: List[Command] = []
        self.is_batch_mode = False

    def execute_command(self, command: Command) -> CommandResult:
        """
        Execute a command with validation and logging.

        Args:
            command: Command to execute

        Returns:
            CommandResult with execution outcome
        """
        logger.info(f"Executing command: {command.get_description()}")

        # Validate command
        validation_result = command.validate()
        if not validation_result.success:
            logger.error(f"Command validation failed: {validation_result.error}")
            return validation_result

        # Execute command
        try:
            result = command.execute()

            # Store in history
            if result.success:
                self._add_to_history(command)
                logger.info(f"Command executed successfully: {command.command_id}")
            else:
                logger.error(f"Command execution failed: {result.error}")

            return result

        except Exception as e:
            error_msg = f"Command execution raised exception: {str(e)}"
            logger.exception(error_msg)
            return CommandResult(success=False, error=error_msg)

    def queue_command(self, command: Command):
        """Add command to execution queue for batch processing."""
        self.command_queue.append(command)
        logger.debug(f"Command queued: {command.get_description()}")

    def execute_queued_commands(self) -> CommandResult:
        """Execute all queued commands as a composite command."""
        if not self.command_queue:
            return CommandResult(success=True, data="No commands in queue")

        composite = CompositeCommand(self.command_queue.copy())
        self.command_queue.clear()

        return self.execute_command(composite)

    def start_batch_mode(self):
        """Start batch mode - queue commands instead of executing immediately."""
        self.is_batch_mode = True
        logger.info("Batch mode started")

    def end_batch_mode(self) -> CommandResult:
        """End batch mode and execute all queued commands."""
        self.is_batch_mode = False
        result = self.execute_queued_commands()
        logger.info("Batch mode ended")
        return result

    def undo_last_command(self) -> CommandResult:
        """Undo the last successfully executed command."""
        if not self.command_history:
            return CommandResult(success=False, error="No commands to undo")

        last_command = self.command_history[-1]
        result = last_command.undo()

        if result.success:
            self.command_history.pop()
            logger.info(f"Command undone: {last_command.command_id}")

        return result

    def get_command_history(self) -> List[Dict[str, Any]]:
        """Get command execution history."""
        return [cmd.get_execution_metadata() for cmd in self.command_history]

    def clear_history(self):
        """Clear command execution history."""
        self.command_history.clear()
        logger.info("Command history cleared")

    def _add_to_history(self, command: Command):
        """Add command to history with size limit."""
        self.command_history.append(command)

        # Maintain history size limit
        if len(self.command_history) > self.max_history:
            self.command_history.pop(0)

# Global command invoker for system-wide use
_global_invoker: Optional[CommandInvoker] = None

def get_command_invoker() -> CommandInvoker:
    """Get global command invoker instance."""
    global _global_invoker
    if _global_invoker is None:
        _global_invoker = CommandInvoker()
    return _global_invoker

def execute_command(command: Command) -> CommandResult:
    """Execute command using global invoker."""
    return get_command_invoker().execute_command(command)

def execute_commands_batch(commands: List[Command]) -> CommandResult:
    """Execute multiple commands as a batch operation."""
    invoker = get_command_invoker()
    composite = CompositeCommand(commands)
    return invoker.execute_command(composite)

# Example command implementations for testing
class LogCommand(Command):
    """Simple command that logs a message."""

    def __init__(self, message: str, level: str = "INFO"):
        super().__init__()
        self.message = message
        self.level = level.upper()

    def execute(self) -> CommandResult:
        log_level = getattr(logging, self.level, logging.INFO)
        logger.log(log_level, self.message)

        return CommandResult(
            success=True,
            data=f"Logged message at {self.level} level",
            metadata={'message': self.message, 'level': self.level}
        )

    def get_description(self) -> str:
        return f"LogCommand('{self.message[:50]}...', {self.level})"

class NoOpCommand(Command):
    """Command that does nothing - useful for testing."""

    def execute(self) -> CommandResult:
        return CommandResult(success=True, data="No operation performed")

    def get_description(self) -> str:
        return "NoOpCommand()"

if __name__ == "__main__":
    # Demonstrate command pattern usage
    invoker = CommandInvoker()

    # Execute individual commands
    cmd1 = LogCommand("Command pattern test message 1")
    cmd2 = LogCommand("Command pattern test message 2", "DEBUG")

    result1 = invoker.execute_command(cmd1)
    result2 = invoker.execute_command(cmd2)

    print(f"Command 1 result: {result1.success}")
    print(f"Command 2 result: {result2.success}")

    # Execute composite command
    composite = CompositeCommand([
        LogCommand("Composite command step 1"),
        NoOpCommand(),
        LogCommand("Composite command step 2", "WARNING")
    ])

    composite_result = invoker.execute_command(composite)
    print(f"Composite result: {composite_result.success}")

    # Display command history
    history = invoker.get_command_history()
    print(f"Commands executed: {len(history)}")
    for cmd_info in history:
        print(f"  - {cmd_info['command_type']}: {cmd_info['command_id']}")