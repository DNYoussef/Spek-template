from lib.shared.utilities import get_logger
from src.constants.base import MAXIMUM_NESTED_DEPTH
"""

Comprehensive logging system with structured logging, audit trails,
and compliance-ready log management.
"""

import logging
import logging.handlers
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
import threading
import queue
import traceback
"""

from ..config.enterprise_config import EnterpriseConfig
"""

class LogLevel(Enum):
    """Extended log levels"""
    TRACE = 5
    DEBUG = 10
    INFO = 20
    WARNING = 30
    ERROR = 40
    CRITICAL = 50
    AUDIT = 60  # Special audit level

@dataclass
class LogRecord:
    """Enhanced log record with enterprise context"""
    timestamp: datetime = field(default_factory=datetime.now)
    level: str = "INFO"
    logger_name: str = ""
    message: str = ""
    component: str = ""
    operation: str = ""
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    correlation_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    exception: Optional[str] = None
    stack_trace: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'timestamp': self.timestamp.isoformat(),
            'level': self.level,
            'logger': self.logger_name,
            'message': self.message,
            'component': self.component,
            'operation': self.operation,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'request_id': self.request_id,
            'correlation_id': self.correlation_id,
            'metadata': self.metadata,
            'exception': self.exception,
            'stack_trace': self.stack_trace
        }

class StructuredFormatter(logging.Formatter):
    """Structured JSON formatter for enterprise logging"""
    
    def __init__(self, include_context: bool = True):
        super().__init__()
        self.include_context = include_context
        
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON"""
        log_entry = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception information if present
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'stack_trace': traceback.format_exception(*record.exc_info)
            }
            
        # Add custom context if available
        if self.include_context and hasattr(record, 'enterprise_context'):
            context = record.enterprise_context
            log_entry.update({
                'component': getattr(context, 'component', ''),
                'operation': getattr(context, 'operation', ''),
                'user_id': getattr(context, 'user_id', None),
                'session_id': getattr(context, 'session_id', None),
                'request_id': getattr(context, 'request_id', None),
                'correlation_id': getattr(context, 'correlation_id', None),
                'metadata': getattr(context, 'metadata', {})
            })
            
        return json.dumps(log_entry)

class EnterpriseLogFilter(logging.Filter):
    """Filter for enterprise-specific log processing"""
    
    def __init__(self, component: str = "", min_level: int = logging.INFO):
        super().__init__()
        self.component = component
        self.min_level = min_level
        
    def filter(self, record: logging.LogRecord) -> bool:
        """Filter log records based on enterprise criteria"""
        # Apply minimum level filtering
        if record.levelno < self.min_level:
            return False
            
        # Apply component filtering if specified
        if self.component and hasattr(record, 'enterprise_context'):
            context = record.enterprise_context
            if getattr(context, 'component', '') != self.component:
                return False
                
        return True

class AsyncLogHandler(logging.Handler):
    """Asynchronous log handler for high-performance logging"""
    
    def __init__(self, target_handler: logging.Handler, queue_size: int = 10000):
        super().__init__()
        self.target_handler = target_handler
        self.log_queue = queue.Queue(maxsize=queue_size)
        self.worker_thread = None
        self.shutdown_event = threading.Event()
        self._start_worker()
        
    def _start_worker(self):
        """Start worker thread for async log processing"""
        self.worker_thread = threading.Thread(
            target=self._worker_loop,
            name="AsyncLogWorker",
            daemon=True
        )
        self.worker_thread.start()
        
    def _worker_loop(self):
        """Worker thread loop for processing log records"""
        while not self.shutdown_event.is_set():
            try:
                # Get record from queue with timeout
                try:
                    record = self.log_queue.get(timeout=1.0)
                except queue.Empty:
                    continue
                    
                # Process record with target handler
                if record is not None:
                    self.target_handler.emit(record)
                    self.log_queue.task_done()
                    
            except Exception as e:
                # Fallback to stderr for handler errors
                print(f"AsyncLogHandler error: {e}", file=sys.stderr)
                
    def emit(self, record: logging.LogRecord):
        """Emit log record to async queue"""
        try:
            if not self.shutdown_event.is_set():
                self.log_queue.put_nowait(record)
        except queue.Full:
            # Drop record if queue is full (prevents blocking)
            
    def close(self):
        """Shutdown async log handler"""
        self.shutdown_event.set()
        if self.worker_thread and self.worker_thread.is_alive():
            self.worker_thread.join(timeout=MAXIMUM_NESTED_DEPTH.0)
        super().close()

class EnterpriseLogger:
    """
    Enterprise logger with structured logging, context management,
    and audit trail capabilities.
    """
    
    def __init__(self, name: str, config: Optional[EnterpriseConfig] = None):
        self.name = name
        self.config = config
        self.logger = logging.getLogger(name)
        self.context_stack: List[Dict[str, Any]] = []
        self._setup_logger()
        
    def _setup_logger(self):
        """Setup logger with enterprise configuration"""
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Set level from config
        if self.config:
            level = getattr(logging, self.config.logging.level)
            self.logger.setLevel(level)
        else:
            self.logger.setLevel(logging.INFO)
            
        # Add console handler
        console_handler = logging.StreamHandler()
        if self.config and self.config.logging.structured_logging:
            console_formatter = StructuredFormatter()
        else:
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # Add file handler if enabled
        if self.config and self.config.logging.file_logging:
            file_handler = logging.handlers.RotatingFileHandler(
                self.config.logging.log_file,
                maxBytes=self.config.logging.max_file_size_mb * 1024 * 1024,
                backupCount=self.config.logging.backup_count
            )
            
            if self.config.logging.structured_logging:
                file_formatter = StructuredFormatter()
            else:
                file_formatter = logging.Formatter(
                    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                )
            file_handler.setFormatter(file_formatter)
            
            # Use async handler for file logging
            async_handler = AsyncLogHandler(file_handler)
            self.logger.addHandler(async_handler)
            
    def push_context(self, **context):
        """Push context to context stack"""
        self.context_stack.append(context)
        
    def pop_context(self):
        """Pop context from context stack"""
        if self.context_stack:
            return self.context_stack.pop()
        return {}
        
    def _get_merged_context(self, additional_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get merged context from stack and additional context"""
        merged = {}
        for ctx in self.context_stack:
            merged.update(ctx)
        if additional_context:
            merged.update(additional_context)
        return merged
        
    def _log_with_context(self, level: int, message: str, 
                        context: Optional[Dict[str, Any]] = None,
                        exc_info: bool = False):
        """Log message with enterprise context"""
        merged_context = self._get_merged_context(context)
        
        # Create enhanced log record
        record = self.logger.makeRecord(
            self.logger.name, level, "", 0, message, (), exc_info
        )
        
        # Add enterprise context
        if merged_context:
            record.enterprise_context = type('Context', (), merged_context)()
            
        self.logger.handle(record)
        
    def trace(self, message: str, **context):
        """Log trace message"""
        self._log_with_context(LogLevel.TRACE.value, message, context)
        
    def debug(self, message: str, **context):
        """Log debug message"""
        self._log_with_context(logging.DEBUG, message, context)
        
    def info(self, message: str, **context):
        """Log info message"""
        self._log_with_context(logging.INFO, message, context)
        
    def warning(self, message: str, **context):
        """Log warning message"""
        self._log_with_context(logging.WARNING, message, context)
        
    def error(self, message: str, exc_info: bool = False, **context):
        """Log error message"""
        self._log_with_context(logging.ERROR, message, context, exc_info)
        
    def critical(self, message: str, exc_info: bool = False, **context):
        """Log critical message"""
        self._log_with_context(logging.CRITICAL, message, context, exc_info)
        
    def audit(self, message: str, **context):
        """Log audit message"""
        self._log_with_context(LogLevel.AUDIT.value, message, context)
        
class AuditLogger:
    """
    Specialized audit logger for compliance and security logging
    with tamper-evident log management.
    """
    
    def __init__(self, audit_file: Path, max_size_mb: int = 100):
        self.audit_file = Path(audit_file)
        self.audit_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Setup audit logger
        self.logger = get_logger("\1")
        self.logger.setLevel(LogLevel.AUDIT.value)
        
        # Add rotating file handler for audit logs
        handler = logging.handlers.RotatingFileHandler(
            str(self.audit_file),
            maxBytes=max_size_mb * 1024 * 1024,
            backupCount=10
        )
        
        # Use structured formatter for audit logs
        formatter = StructuredFormatter()
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        
    def log_security_event(self, event_type: str, description: str,
                            user_id: Optional[str] = None,
                            resource: Optional[str] = None,
                            result: str = "success",
                            **metadata):
        """Log security-related event"""
        audit_record = LogRecord(
            level="AUDIT",
            logger_name="security",
            message=f"Security event: {event_type}",
            component="security",
            operation=event_type,
            user_id=user_id,
            metadata={
                'event_type': event_type,
                'description': description,
                'resource': resource,
                'result': result,
                **metadata
            }
        )
        
        record = self.logger.makeRecord(
            self.logger.name, LogLevel.AUDIT.value, "", 0,
            audit_record.message, (), False
        )
        record.enterprise_context = audit_record
        self.logger.handle(record)
        
    def log_compliance_event(self, framework: str, control_id: str,
                            action: str, result: str,
                            user_id: Optional[str] = None,
                            **metadata):
        """Log compliance-related event"""
        audit_record = LogRecord(
            level="AUDIT",
            logger_name="compliance",
            message=f"Compliance action: {action} on {control_id}",
            component="compliance",
            operation=action,
            user_id=user_id,
            metadata={
                'framework': framework,
                'control_id': control_id,
                'action': action,
                'result': result,
                **metadata
            }
        )
        
        record = self.logger.makeRecord(
            self.logger.name, LogLevel.AUDIT.value, "", 0,
            audit_record.message, (), False
        )
        record.enterprise_context = audit_record
        self.logger.handle(record)
        
    def log_access_event(self, user_id: str, resource: str,
                        action: str, result: str,
                        source_ip: Optional[str] = None,
                        **metadata):
        """Log access control event"""
        audit_record = LogRecord(
            level="AUDIT",
            logger_name="access",
            message=f"Access {action} on {resource}",
            component="access_control",
            operation=action,
            user_id=user_id,
            metadata={
                'resource': resource,
                'action': action,
                'result': result,
                'source_ip': source_ip,
                **metadata
            }
        )
        
        record = self.logger.makeRecord(
            self.logger.name, LogLevel.AUDIT.value, "", 0,
            audit_record.message, (), False
        )
        record.enterprise_context = audit_record
        self.logger.handle(record)

class ContextManager:
    """Context manager for enterprise logging context"""
    
    def __init__(self, logger: EnterpriseLogger, **context):
        self.logger = logger
        self.context = context
        
    def __enter__(self):
        self.logger.push_context(**self.context)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.logger.pop_context()

# Global instances
_enterprise_loggers: Dict[str, EnterpriseLogger] = {}
_audit_logger: Optional[AuditLogger] = None

def get_enterprise_logger(name: str, config: Optional[EnterpriseConfig] = None) -> EnterpriseLogger:
    """Get or create enterprise logger"""
    if name not in _enterprise_loggers:
        _enterprise_loggers[name] = EnterpriseLogger(name, config)
    return _enterprise_loggers[name]

def get_audit_logger(audit_file: Optional[Path] = None) -> AuditLogger:
    """Get or create audit logger"""
    global _audit_logger
    if _audit_logger is None:
        audit_file = audit_file or Path("enterprise-audit.log")
        _audit_logger = AuditLogger(audit_file)
    return _audit_logger

def log_context(**context):
    """Context manager decorator for logging context"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            logger = get_enterprise_logger(func.__module__)
            with ContextManager(logger, **context):
                return func(*args, **kwargs)
        return wrapper
    return decorator