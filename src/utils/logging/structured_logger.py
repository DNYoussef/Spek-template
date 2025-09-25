"""Structured Logging Utilities

Consolidates logging patterns with structured output, context injection,
and standardized formatting.
Extracted from: Multiple files using get_logger patterns
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import json
import logging
import sys

import traceback

class StructuredFormatter(logging.Formatter):
    """JSON-based structured log formatter."""

def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON."""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }

        # Add extra fields
        if hasattr(record, 'extra_data'):
            log_data['extra'] = record.extra_data

        return json.dumps(log_data)

class ContextLogger:
    """Logger with context injection."""

def __init__(self, name: str, context: Optional[Dict[str, Any]] = None):
        """Initialize context logger.
        
        Args:
            name: Logger name
            context: Default context to include in all logs
        """
        self.logger = logging.getLogger(name)
        self.context = context or {}

def _log_with_context(self, level: int, message: str, **kwargs):
        """Log with merged context."""
        extra_data = {**self.context, **kwargs}
        # Create a LogRecord with extra data
        if extra_data:
            self.logger.log(level, message, extra={'extra_data': extra_data})
        else:
            self.logger.log(level, message)

def debug(self, message: str, **kwargs):
        """Log debug message with context."""
        self._log_with_context(logging.DEBUG, message, **kwargs)

def info(self, message: str, **kwargs):
        """Log info message with context."""
        self._log_with_context(logging.INFO, message, **kwargs)

def warning(self, message: str, **kwargs):
        """Log warning message with context."""
        self._log_with_context(logging.WARNING, message, **kwargs)

def error(self, message: str, **kwargs):
        """Log error message with context."""
        self._log_with_context(logging.ERROR, message, **kwargs)

def critical(self, message: str, **kwargs):
        """Log critical message with context."""
        self._log_with_context(logging.CRITICAL, message, **kwargs)

def add_context(self, **kwargs):
        """Add to context dictionary."""
        self.context.update(kwargs)

def clear_context(self):
        """Clear context dictionary."""
        self.context.clear()

class LoggerFactory:
    """Factory for creating configured loggers."""

    _loggers: Dict[str, logging.Logger] = {}
    _default_level = logging.INFO
    _structured = False

@classmethod
def configure(
        cls,
        level: int = logging.INFO,
        structured: bool = False,
        log_file: Optional[Path] = None
    ):
        """Configure global logging settings."""
        cls._default_level = level
        cls._structured = structured

        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(level)
        root_logger.handlers.clear()

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        
        if structured:
            console_handler.setFormatter(StructuredFormatter())
        else:
            console_handler.setFormatter(logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            ))
        
        root_logger.addHandler(console_handler)

        # File handler if specified
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(level)
            file_handler.setFormatter(
                StructuredFormatter() if structured 
                else logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            )
            root_logger.addHandler(file_handler)

@classmethod
def get_logger(
        cls,
        name: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> ContextLogger:
        """Get or create a context logger.
        
        Args:
            name: Logger name (uses calling module if None)
            context: Initial context dictionary
        
        Returns:
            Configured ContextLogger instance
        """
        logger_name = name or __name__
        
        if logger_name not in cls._loggers:
            logger = logging.getLogger(logger_name)
            logger.setLevel(cls._default_level)
            cls._loggers[logger_name] = logger
        
        return ContextLogger(logger_name, context)

class AuditLogger:
    """Specialized logger for audit trails."""

def __init__(self, audit_file: Path):
        """Initialize audit logger.
        
        Args:
            audit_file: Path to audit log file
        """
        self.logger = logging.getLogger('audit')
        self.logger.setLevel(logging.INFO)
        
        # Audit logs always use structured format
        handler = logging.FileHandler(audit_file)
        handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(handler)

def log_event(
        self,
        event_type: str,
        user: str,
        action: str,
        resource: str,
        outcome: str,
        **details
    ):
        """Log audit event.
        
        Args:
            event_type: Type of event (access, modification, etc.)
            user: User performing action
            action: Action performed
            resource: Resource affected
            outcome: Action outcome (success, failure, etc.)
            **details: Additional event details
        """
        event_data = {
            'event_type': event_type,
            'user': user,
            'action': action,
            'resource': resource,
            'outcome': outcome,
            **details
        }
        
        self.logger.info(
            f"{event_type}: {user} {action} {resource}",
            extra={'extra_data': event_data}
        )

# Convenience function for backward compatibility
def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a configured logger instance.
    
    Args:
        name: Logger name. If None, uses the calling module's name.
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name or __name__)
    
    # Only add handler if logger doesn't already have one
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    
    return logger
