"""
Enterprise Feature Flag System

Provides comprehensive feature flag management with decorator patterns
for non-breaking integration with existing systems.
"""

from lib.shared.utilities import get_logger

class FlagStatus(Enum):
    """Feature flag status"""
    ENABLED = "enabled"
    DISABLED = "disabled"
    ROLLOUT = "rollout"  # Gradual rollout
    AB_TEST = "ab_test"   # A/B testing
    DEPRECATED = "deprecated"

class RolloutStrategy(Enum):
    """Rollout strategies"""
    ALL_USERS = "all_users"
    PERCENTAGE = "percentage"
    USER_LIST = "user_list"
    GRADUAL = "gradual"
    CANARY = "canary"

@dataclass
class FlagMetrics:
    """Feature flag usage metrics"""
    total_calls: int = 0
    enabled_calls: int = 0
    disabled_calls: int = 0
    average_execution_time: float = 0.0
    error_count: int = 0
    last_accessed: Optional[datetime] = None
    performance_impact: Dict[str, float] = field(default_factory=dict)

@dataclass
class FeatureFlag:
    """Feature flag configuration"""
    name: str
    description: str
    status: FlagStatus = FlagStatus.DISABLED
    rollout_percentage: float = 0.0
    rollout_strategy: RolloutStrategy = RolloutStrategy.ALL_USERS
    enabled_for_users: List[str] = field(default_factory=list)
    enabled_for_groups: List[str] = field(default_factory=list)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    owner: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    prerequisites: List[str] = field(default_factory=list)
    metrics: FlagMetrics = field(default_factory=FlagMetrics)
    configuration: Dict[str, Any] = field(default_factory=dict)
    
    def is_enabled(self, user_id: Optional[str] = None, 
                    group_ids: Optional[List[str]] = None,
                    context: Optional[Dict[str, Any]] = None) -> bool:
        """Check if flag is enabled for given context"""
        try:
            # Check date constraints
            now = datetime.now()
            if self.start_date and now < self.start_date:
                return False
            if self.end_date and now > self.end_date:
                return False
                
            # Check prerequisites
            if self.prerequisites:
                # Would check other flags - simplified for demo
                
            if self.status == FlagStatus.DISABLED:
                return False
            elif self.status == FlagStatus.ENABLED:
                return True
            elif self.status == FlagStatus.ROLLOUT:
                return self._check_rollout_eligibility(user_id, group_ids, context)
            elif self.status == FlagStatus.AB_TEST:
                return self._check_ab_test_eligibility(user_id, context)
            elif self.status == FlagStatus.DEPRECATED:
                logger.warning(f"Feature flag {self.name} is deprecated")
                return False
                
            return False
            
        except Exception as e:
            logger.error(f"Error checking flag {self.name}: {e}")
            return False
            
    def _check_rollout_eligibility(self, user_id: Optional[str],
                                group_ids: Optional[List[str]], 
                                context: Optional[Dict[str, Any]]) -> bool:
        """Check rollout eligibility based on strategy"""
        if self.rollout_strategy == RolloutStrategy.ALL_USERS:
            return True
        elif self.rollout_strategy == RolloutStrategy.PERCENTAGE:
            if user_id:
                # Deterministic hash-based percentage
                user_hash = hash(f"{self.name}:{user_id}") % 100
                return user_hash < self.rollout_percentage
            return False
        elif self.rollout_strategy == RolloutStrategy.USER_LIST:
            return user_id in self.enabled_for_users if user_id else False
        elif self.rollout_strategy == RolloutStrategy.GRADUAL:
            # Time-based gradual rollout
            if self.start_date:
                elapsed_days = (datetime.now() - self.start_date).days
                target_percentage = min(100, elapsed_days * 10)  # 10% per day
                return self.rollout_percentage <= target_percentage
            return False
            
        return False
        
    def _check_ab_test_eligibility(self, user_id: Optional[str],
                                context: Optional[Dict[str, Any]]) -> bool:
        """Check A/B test eligibility"""
        if user_id:
            # Simple A/B split based on user ID hash
            user_hash = hash(f"{self.name}:ab:{user_id}") % 100
            return user_hash < 50  # 50/50 split
        return False
        
    def record_usage(self, enabled: bool, execution_time: float = 0.0):
        """Record flag usage metrics"""
        self.metrics.total_calls += 1
        if enabled:
            self.metrics.enabled_calls += 1
        else:
            self.metrics.disabled_calls += 1
            
        # Update average execution time
        if execution_time > 0:
            total_time = (self.metrics.average_execution_time * 
                        (self.metrics.total_calls - 1) + execution_time)
            self.metrics.average_execution_time = total_time / self.metrics.total_calls
            
        self.metrics.last_accessed = datetime.now()

class FeatureFlagManager:
    """
    Enterprise feature flag manager
    
    Manages feature flags with support for:
    - Runtime configuration updates
    - Performance monitoring
    - A/B testing
    - Gradual rollouts
    """
    
    def __init__(self, config_file: Optional[Path] = None):
        self.flags: Dict[str, FeatureFlag] = {}
        self.config_file = config_file
        self._lock = threading.RLock()
        self._load_config()
        
    def _load_config(self):
        """Load feature flag configuration"""
        if self.config_file and self.config_file.exists():
            try:
                with open(self.config_file) as f:
                    config_data = json.load(f)
                    
                for flag_name, flag_config in config_data.get("flags", {}).items():
                    flag = FeatureFlag(
                        name=flag_name,
                        description=flag_config.get("description", ""),
                        status=FlagStatus(flag_config.get("status", "disabled")),
                        rollout_percentage=flag_config.get("rollout_percentage", 0.0),
                        rollout_strategy=RolloutStrategy(
                            flag_config.get("rollout_strategy", "all_users")
                        ),
                        enabled_for_users=flag_config.get("enabled_for_users", []),
                        enabled_for_groups=flag_config.get("enabled_for_groups", []),
                        owner=flag_config.get("owner"),
                        tags=flag_config.get("tags", []),
                        prerequisites=flag_config.get("prerequisites", []),
                        configuration=flag_config.get("configuration", {})
                    )
                    
                    # Parse dates if provided
                    if "start_date" in flag_config:
                        flag.start_date = datetime.fromisoformat(flag_config["start_date"])
                    if "end_date" in flag_config:
                        flag.end_date = datetime.fromisoformat(flag_config["end_date"])
                        
                    self.flags[flag_name] = flag
                    
            except Exception as e:
                logger.error(f"Error loading flag configuration: {e}")
                
    def create_flag(self, name: str, description: str, **kwargs) -> FeatureFlag:
        """Create a new feature flag"""
        with self._lock:
            if name in self.flags:
                raise ValueError(f"Flag {name} already exists")
                
            flag = FeatureFlag(name=name, description=description, **kwargs)
            self.flags[name] = flag
            return flag
            
    def get_flag(self, name: str) -> Optional[FeatureFlag]:
        """Get feature flag by name"""
        return self.flags.get(name)
        
    def is_enabled(self, name: str, user_id: Optional[str] = None,
                    group_ids: Optional[List[str]] = None,
                    context: Optional[Dict[str, Any]] = None) -> bool:
        """Check if feature flag is enabled"""
        flag = self.flags.get(name)
        if not flag:
            logger.warning(f"Feature flag {name} not found, defaulting to disabled")
            return False
            
        start_time = time.time()
        enabled = flag.is_enabled(user_id, group_ids, context)
        execution_time = time.time() - start_time
        
        # Record usage metrics
        flag.record_usage(enabled, execution_time)
        
        return enabled
        
    def update_flag(self, name: str, **updates):
        """Update feature flag configuration"""
        with self._lock:
            if name not in self.flags:
                raise ValueError(f"Flag {name} not found")
                
            flag = self.flags[name]
            for key, value in updates.items():
                if hasattr(flag, key):
                    setattr(flag, key, value)
                    
    def delete_flag(self, name: str):
        """Delete feature flag"""
        with self._lock:
            if name in self.flags:
                del self.flags[name]
                
    def list_flags(self, tag: Optional[str] = None) -> List[FeatureFlag]:
        """List all feature flags, optionally filtered by tag"""
        flags = list(self.flags.values())
        if tag:
            flags = [f for f in flags if tag in f.tags]
        return flags
        
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get metrics summary for all flags"""
        summary = {
            "total_flags": len(self.flags),
            "enabled_flags": len([f for f in self.flags.values() if f.status == FlagStatus.ENABLED]),
            "disabled_flags": len([f for f in self.flags.values() if f.status == FlagStatus.DISABLED]),
            "rollout_flags": len([f for f in self.flags.values() if f.status == FlagStatus.ROLLOUT]),
            "ab_test_flags": len([f for f in self.flags.values() if f.status == FlagStatus.AB_TEST]),
            "flag_details": {}
        }
        
        for name, flag in self.flags.items():
            summary["flag_details"][name] = {
                "status": flag.status.value,
                "total_calls": flag.metrics.total_calls,
                "enabled_calls": flag.metrics.enabled_calls,
                "disabled_calls": flag.metrics.disabled_calls,
                "average_execution_time": flag.metrics.average_execution_time,
                "last_accessed": flag.metrics.last_accessed.isoformat() if flag.metrics.last_accessed else None
            }
            
        return summary
        
    def save_config(self):
        """Save current configuration to file"""
        if not self.config_file:
            return
            
        config_data = {"flags": {}}
        
        for name, flag in self.flags.items():
            config_data["flags"][name] = {
                "description": flag.description,
                "status": flag.status.value,
                "rollout_percentage": flag.rollout_percentage,
                "rollout_strategy": flag.rollout_strategy.value,
                "enabled_for_users": flag.enabled_for_users,
                "enabled_for_groups": flag.enabled_for_groups,
                "start_date": flag.start_date.isoformat() if flag.start_date else None,
                "end_date": flag.end_date.isoformat() if flag.end_date else None,
                "owner": flag.owner,
                "tags": flag.tags,
                "prerequisites": flag.prerequisites,
                "configuration": flag.configuration
            }
            
        with open(self.config_file, 'w') as f:
            json.dump(config_data, f, indent=2)
            
# Global flag manager instance
flag_manager = FeatureFlagManager()

def enterprise_feature(name: str, description: str = "", default: bool = False,
                        user_id_param: str = "user_id",
                        context_param: str = "context"):
    """
    Decorator for enterprise feature flags with non-breaking integration
    
    Usage:
        @enterprise_feature("new_algorithm", "Use new processing algorithm")
    def process_data(data, user_id=None):
            # Implementation with new algorithm
            
        @process_data.fallback
    def process_data_old(data, user_id=None):
            # Original implementation
    """
    def decorator(func: Callable) -> Callable:
        # Ensure flag exists
        if not flag_manager.get_flag(name):
            flag_manager.create_flag(
                name=name,
                description=description,
                status=FlagStatus.ENABLED if default else FlagStatus.DISABLED
            )
            
        # Store original function as fallback
        fallback_func = None
        
        @functools.wraps(func)
    def wrapper(*args, **kwargs):
            # Extract user_id and context from parameters
            user_id = kwargs.get(user_id_param)
            context = kwargs.get(context_param, {})
            
            # Check if feature is enabled
            if flag_manager.is_enabled(name, user_id=user_id, context=context):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    logger.error(f"Error in feature {name}: {e}")
                    # Fall back to original implementation if available
                    if fallback_func:
                        logger.info(f"Falling back to original implementation for {name}")
                        return fallback_func(*args, **kwargs)
                    raise
            else:
                # Use fallback implementation if available
                if fallback_func:
                    return fallback_func(*args, **kwargs)
                else:
                    # If no fallback, log and return None or raise
                    logger.warning(f"Feature {name} is disabled and no fallback provided")
                    return None
                    
        # Add method to register fallback
    def register_fallback(fallback):
            nonlocal fallback_func
            fallback_func = fallback
            return fallback
            
        wrapper.fallback = register_fallback
        wrapper.flag_name = name
        
        return wrapper
        
    return decorator

# Convenience functions for common patterns
def feature_flag(name: str, default: bool = False) -> bool:
    """Simple feature flag check"""
    return flag_manager.is_enabled(name)

def conditional_execution(flag_name: str, user_id: Optional[str] = None):
    """Context manager for conditional execution"""
    class ConditionalExecution:
        def __init__(self, flag_name: str, user_id: Optional[str] = None):
            self.flag_name = flag_name
            self.user_id = user_id
            self.enabled = False
            
        def __enter__(self):
            self.enabled = flag_manager.is_enabled(self.flag_name, user_id=self.user_id)
            return self.enabled
            
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass
            
    return ConditionalExecution(flag_name, user_id)

def enterprise_gate(flags: Union[str, List[str]], require_all: bool = True):
    """
    Decorator that requires one or more feature flags to be enabled
    
    Usage:
        @enterprise_gate("premium_features") 
    def premium_function():
            pass
            
        @enterprise_gate(["feature_a", "feature_b"], require_all=False)
    def multi_flag_function():
            pass
    """
    if isinstance(flags, str):
        flags = [flags]
        
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
    def wrapper(*args, **kwargs):
            user_id = kwargs.get("user_id")
            
            enabled_flags = [
                flag_manager.is_enabled(flag_name, user_id=user_id)
                for flag_name in flags
            ]
            
            if require_all:
                gate_passed = all(enabled_flags)
            else:
                gate_passed = any(enabled_flags)
                
            if gate_passed:
                return func(*args, **kwargs)
            else:
                logger.warning(f"Enterprise gate failed for flags: {flags}")
                return None
                
        return wrapper
    return decorator