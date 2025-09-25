"""
Enterprise Error Handling

Comprehensive error handling system with enterprise-grade logging,
recovery mechanisms, and audit trail capabilities.
"""

from lib.shared.utilities import get_logger

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ErrorCategory(Enum):
    """Error categories for classification"""
    SYSTEM = "system"
    SECURITY = "security"
    COMPLIANCE = "compliance"
    TELEMETRY = "telemetry"
    INTEGRATION = "integration"
    CONFIGURATION = "configuration"
    VALIDATION = "validation"
    EXTERNAL = "external"

@dataclass
class ErrorContext:
    """Contextual information for error handling"""
    error_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.now)
    component: str = ""
    operation: str = ""
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ErrorRecord:
    """Complete error record for audit and analysis"""
    context: ErrorContext
    exception_type: str
    exception_message: str
    severity: ErrorSeverity
    category: ErrorCategory
    stack_trace: str
    recovery_attempted: bool = False
    recovery_successful: bool = False
    resolved: bool = False
    resolution_notes: Optional[str] = None

class EnterpriseError(Exception):
    """Base enterprise exception with enhanced context"""
    
    def __init__(self, message: str, 
                severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                category: ErrorCategory = ErrorCategory.SYSTEM,
                context: Optional[ErrorContext] = None,
                cause: Optional[Exception] = None,
                recoverable: bool = True):
        super().__init__(message)
        self.message = message
        self.severity = severity
        self.category = category
        self.context = context or ErrorContext()
        self.cause = cause
        self.recoverable = recoverable
        self.timestamp = datetime.now()
        
    def __str__(self):
        return f"[{self.severity.value.upper()}] {self.category.value}: {self.message}"
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for serialization"""
        return {
            'error_id': self.context.error_id,
            'timestamp': self.timestamp.isoformat(),
            'message': self.message,
            'severity': self.severity.value,
            'category': self.category.value,
            'component': self.context.component,
            'operation': self.context.operation,
            'recoverable': self.recoverable,
            'cause': str(self.cause) if self.cause else None,
            'metadata': self.context.metadata
        }

class SecurityError(EnterpriseError):
    """Security-related errors"""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message, 
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.SECURITY,
            **kwargs
        )

class ComplianceError(EnterpriseError):
    """Compliance-related errors"""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message,
            severity=ErrorSeverity.HIGH, 
            category=ErrorCategory.COMPLIANCE,
            **kwargs
        )

class ConfigurationError(EnterpriseError):
    """Configuration-related errors"""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message,
            severity=ErrorSeverity.MEDIUM,
            category=ErrorCategory.CONFIGURATION,
            **kwargs
        )

class ValidationError(EnterpriseError):
    """Validation-related errors"""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message,
            severity=ErrorSeverity.MEDIUM,
            category=ErrorCategory.VALIDATION,
            **kwargs
        )

class ErrorHandler:
    """
    Enterprise error handler with comprehensive logging, recovery,
    and audit trail capabilities.
    """
    
    def __init__(self, error_log_file: Optional[Path] = None):
        self.error_records: List[ErrorRecord] = []
        self.recovery_strategies: Dict[Type[Exception], Callable] = {}
        self.error_log_file = error_log_file or Path("enterprise-errors.json")
        
        # Create error log directory
        self.error_log_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Configure structured error logging
        self.error_logger = get_logger("\1")
        if not self.error_logger.handlers:
            handler = logging.FileHandler(str(self.error_log_file).replace('.json', '.log'))
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.error_logger.addHandler(handler)
            self.error_logger.setLevel(logging.ERROR)
            
    def register_recovery_strategy(self, exception_type: Type[Exception], 
                                strategy: Callable):
        """Register recovery strategy for specific exception type"""
        self.recovery_strategies[exception_type] = strategy
        
    def handle_error(self, error: Exception, 
                    context: Optional[ErrorContext] = None) -> ErrorRecord:
        """Handle error with comprehensive logging and recovery"""
        # Create context if not provided
        if context is None:
            context = ErrorContext()
            
        # Determine error classification
        if isinstance(error, EnterpriseError):
            severity = error.severity
            category = error.category
            context = error.context
        else:
            severity = self._classify_severity(error)
            category = self._classify_category(error)
            
        # Create error record
        error_record = ErrorRecord(
            context=context,
            exception_type=type(error).__name__,
            exception_message=str(error),
            severity=severity,
            category=category,
            stack_trace=traceback.format_exc()
        )
        
        # Log error
        self._log_error(error_record)
        
        # Attempt recovery if applicable
        if severity != ErrorSeverity.CRITICAL and isinstance(error, EnterpriseError) and error.recoverable:
            error_record.recovery_attempted = True
            error_record.recovery_successful = self._attempt_recovery(error, error_record)
            
        # Store error record
        self.error_records.append(error_record)
        
        # Persist error record
        self._persist_error_record(error_record)
        
        # Send alerts for high/critical errors
        if severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
            self._send_alert(error_record)
            
        return error_record
        
    def _classify_severity(self, error: Exception) -> ErrorSeverity:
        """Classify error severity based on type and context"""
        if isinstance(error, (SecurityError, ComplianceError)):
            return ErrorSeverity.HIGH
        elif isinstance(error, (KeyboardInterrupt, SystemExit, MemoryError)):
            return ErrorSeverity.CRITICAL
        elif isinstance(error, (FileNotFoundError, PermissionError)):
            return ErrorSeverity.MEDIUM
        else:
            return ErrorSeverity.LOW
            
    def _classify_category(self, error: Exception) -> ErrorCategory:
        """Classify error category based on type"""
        if isinstance(error, SecurityError):
            return ErrorCategory.SECURITY
        elif isinstance(error, ComplianceError):
            return ErrorCategory.COMPLIANCE
        elif isinstance(error, ConfigurationError):
            return ErrorCategory.CONFIGURATION
        elif isinstance(error, ValidationError):
            return ErrorCategory.VALIDATION
        elif isinstance(error, (ConnectionError, TimeoutError)):
            return ErrorCategory.EXTERNAL
        else:
            return ErrorCategory.SYSTEM
            
    def _log_error(self, error_record: ErrorRecord):
        """Log error with appropriate level and formatting"""
        log_message = (
            f"[{error_record.context.error_id}] "
            f"{error_record.exception_type}: {error_record.exception_message}"
        )
        
        if error_record.severity == ErrorSeverity.CRITICAL:
            self.error_logger.critical(log_message)
        elif error_record.severity == ErrorSeverity.HIGH:
            self.error_logger.error(log_message)
        elif error_record.severity == ErrorSeverity.MEDIUM:
            self.error_logger.warning(log_message)
        else:
            self.error_logger.info(log_message)
            
        # Log additional context
        if error_record.context.metadata:
            self.error_logger.debug(f"Context: {error_record.context.metadata}")
            
    def _attempt_recovery(self, error: Exception, error_record: ErrorRecord) -> bool:
        """Attempt error recovery using registered strategies"""
        try:
            error_type = type(error)
            
            # Try exact type match first
            if error_type in self.recovery_strategies:
                strategy = self.recovery_strategies[error_type]
                strategy(error, error_record)
                return True
                
            # Try parent class matches
            for registered_type, strategy in self.recovery_strategies.items():
                if isinstance(error, registered_type):
                    strategy(error, error_record)
                    return True
                    
            return False
            
        except Exception as recovery_error:
            self.error_logger.error(f"Recovery failed for {error_record.context.error_id}: {recovery_error}")
            return False
            
    def _persist_error_record(self, error_record: ErrorRecord):
        """Persist error record to file"""
        try:
            # Load existing records
            if self.error_log_file.exists():
                with open(self.error_log_file, 'r') as f:
                    existing_records = json.load(f)
            else:
                existing_records = []
                
            # Add new record
            record_dict = {
                'error_id': error_record.context.error_id,
                'timestamp': error_record.context.timestamp.isoformat(),
                'component': error_record.context.component,
                'operation': error_record.context.operation,
                'exception_type': error_record.exception_type,
                'exception_message': error_record.exception_message,
                'severity': error_record.severity.value,
                'category': error_record.category.value,
                'recovery_attempted': error_record.recovery_attempted,
                'recovery_successful': error_record.recovery_successful,
                'resolved': error_record.resolved,
                'metadata': error_record.context.metadata
            }
            
            existing_records.append(record_dict)
            
            # Keep only last 10000 records
            if len(existing_records) > 10000:
                existing_records = existing_records[-10000:]
                
            # Save updated records
            with open(self.error_log_file, 'w') as f:
                json.dump(existing_records, f, indent=2)
                
        except Exception as e:
            self.error_logger.error(f"Failed to persist error record: {e}")
            
    def _send_alert(self, error_record: ErrorRecord):
        """Send alert for high/critical errors"""
        # Placeholder for alert system integration
        logger.warning(
            f"ALERT: {error_record.severity.value.upper()} error in "
            f"{error_record.context.component}: {error_record.exception_message}"
        )
        
    def get_error_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get error statistics for specified period"""
        from datetime import timedelta
        
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_errors = [
            e for e in self.error_records 
            if e.context.timestamp >= cutoff_date
        ]
        
        if not recent_errors:
            return {"period_days": days, "total_errors": 0}
            
        # Calculate statistics
        severity_counts = {}
        category_counts = {}
        component_counts = {}
        recovery_stats = {
            'attempted': 0,
            'successful': 0,
            'failed': 0
        }
        
        for error in recent_errors:
            # Severity distribution
            severity = error.severity.value
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            # Category distribution
            category = error.category.value
            category_counts[category] = category_counts.get(category, 0) + 1
            
            # Component distribution
            component = error.context.component or 'unknown'
            component_counts[component] = component_counts.get(component, 0) + 1
            
            # Recovery statistics
            if error.recovery_attempted:
                recovery_stats['attempted'] += 1
                if error.recovery_successful:
                    recovery_stats['successful'] += 1
                else:
                    recovery_stats['failed'] += 1
                    
        return {
            'period_days': days,
            'total_errors': len(recent_errors),
            'severity_distribution': severity_counts,
            'category_distribution': category_counts,
            'component_distribution': component_counts,
            'recovery_statistics': recovery_stats,
            'error_rate': len(recent_errors) / days,  # errors per day
            'critical_errors': severity_counts.get('critical', 0),
            'unresolved_errors': len([e for e in recent_errors if not e.resolved])
        }
        
    def resolve_error(self, error_id: str, resolution_notes: str):
        """Mark error as resolved"""
        for error_record in self.error_records:
            if error_record.context.error_id == error_id:
                error_record.resolved = True
                error_record.resolution_notes = resolution_notes
                self._persist_error_record(error_record)
                break

# Global error handler instance
_global_error_handler = ErrorHandler()

def error_boundary(component: str = "", operation: str = "", 
                    recoverable: bool = True, re_raise: bool = True):
    """
    Decorator for comprehensive error handling with enterprise context
    
    Usage:
        @error_boundary(component="telemetry", operation="calculate_dpmo")
        def risky_function():
            # Function that might raise errors
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            context = ErrorContext(
                component=component or func.__module__,
                operation=operation or func.__name__
            )
            
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # Handle with global error handler
                error_record = _global_error_handler.handle_error(e, context)
                
                if re_raise:
                    raise
                else:
                    return None
                    
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            context = ErrorContext(
                component=component or func.__module__,
                operation=operation or func.__name__
            )
            
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # Handle with global error handler
                error_record = _global_error_handler.handle_error(e, context)
                
                if re_raise:
                    raise
                else:
                    return None
                    
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
            
    return decorator

def get_global_error_handler() -> ErrorHandler:
    """Get global error handler instance"""
    return _global_error_handler

def handle_enterprise_error(error: Exception, component: str = "", 
                            operation: str = "") -> ErrorRecord:
    """Handle error with global enterprise error handler"""
    context = ErrorContext(component=component, operation=operation)
    return _global_error_handler.handle_error(error, context)