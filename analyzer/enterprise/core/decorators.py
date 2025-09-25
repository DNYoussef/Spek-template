from src.constants.base import MAXIMUM_NESTED_DEPTH
"""

Non-breaking decorator patterns for enhancing existing analyzer methods
with enterprise capabilities while maintaining zero performance impact
when features are disabled.

NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule MAXIMUM_NESTED_DEPTH Compliant: Comprehensive defensive assertions.
"""

from functools import wraps
from typing import Callable, Any, Dict, List, Optional
import logging
logger = logging.getLogger(__name__)

class EnterpriseEnhancer:
    """
    Decorates existing analyzer methods with enterprise capabilities.
    
    Uses the decorator pattern to enhance functionality without modifying
    existing code, ensuring zero performance impact when features are disabled.
    """
    
    def __init__(self, feature_manager):
        """Initialize enhancer with feature manager."""
        # NASA Rule 5: Input validation
        assert feature_manager is not None, "feature_manager cannot be None"
        
        self.feature_manager = feature_manager
        self._enhancement_registry = {}
        
    def enhance_violations(self, feature_name: str):
        """
        Decorator to enhance violation analysis with enterprise features.
        
        Args:
            feature_name: Name of the enterprise feature to apply
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs) -> List[Dict]:
                # Execute original method first (maintains existing behavior)
                violations = func(*args, **kwargs)
                
                # Early return if feature disabled (zero performance impact)
                if not self.feature_manager.is_enabled(feature_name):
                    return violations
                
                # Apply enterprise enhancements only when enabled
                try:
                    enhanced_violations = self._apply_enterprise_analysis(
                        violations, feature_name, *args, **kwargs
                    )
                    
                    logger.debug(f"Enterprise enhancement {feature_name} applied: "
                                f"{len(violations)} -> {len(enhanced_violations)} violations")
                    
                    return enhanced_violations
                    
                except Exception as e:
                    logger.error(f"Enterprise enhancement {feature_name} failed: {e}")
                    # Return original violations on failure (graceful degradation)
                    return violations
                    
            return wrapper
        return decorator
    
    def enhance_quality_gates(self, feature_name: str):
        """
        Decorator to add enterprise quality gates.
        
        Args:
            feature_name: Name of the enterprise feature
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs) -> List[Dict]:
                # Execute original quality gates first
                gate_results = func(*args, **kwargs)
                
                # Early return if feature disabled (zero performance impact)
                if not self.feature_manager.is_enabled(feature_name):
                    return gate_results
                
                # Add enterprise quality gates only when enabled
                try:
                    enterprise_gates = self._get_enterprise_gates(
                        feature_name, *args, **kwargs
                    )
                    
                    # Combine original and enterprise gates
                    combined_results = gate_results + enterprise_gates
                    
                    logger.debug(f"Enterprise gates {feature_name} added: "
                                f"{len(gate_results)} -> {len(combined_results)} gates")
                    
                    return combined_results
                    
                except Exception as e:
                    logger.error(f"Enterprise gates {feature_name} failed: {e}")
                    # Return original gates on failure
                    return gate_results
                    
            return wrapper
        return decorator
    
    def enhance_configuration(self, feature_name: str):
        """
        Decorator to enhance configuration loading with enterprise settings.
        
        Args:
            feature_name: Name of the enterprise feature
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs) -> Dict[str, Any]:
                # Load base configuration
                config = func(*args, **kwargs)
                
                # Early return if feature disabled
                if not self.feature_manager.is_enabled(feature_name):
                    return config
                
                # Enhance with enterprise configuration
                try:
                    enterprise_config = self._get_enterprise_config(
                        feature_name, config, *args, **kwargs
                    )
                    
                    # Merge configurations (enterprise settings override base)
                    enhanced_config = {**config, **enterprise_config}
                    
                    logger.debug(f"Configuration enhanced with {feature_name} settings")
                    return enhanced_config
                    
                except Exception as e:
                    logger.error(f"Configuration enhancement {feature_name} failed: {e}")
                    return config
                    
            return wrapper
        return decorator
    
    def monitor_performance(self, feature_name: str):
        """
        Decorator to monitor performance impact of enterprise features.
        
        Args:
            feature_name: Name of the enterprise feature
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs) -> Any:
                # Skip monitoring if feature disabled
                if not self.feature_manager.is_enabled(feature_name):
                    return func(*args, **kwargs)
                
                # Monitor performance when enabled
                start_time = time.perf_counter()
                start_memory = self._get_memory_usage()
                
                try:
                    result = func(*args, **kwargs)
                    
                    # Record performance metrics
                    end_time = time.perf_counter()
                    end_memory = self._get_memory_usage()
                    
                    execution_time = end_time - start_time
                    memory_delta = end_memory - start_memory
                    
                    self._record_performance_metrics(
                        feature_name, execution_time, memory_delta
                    )
                    
                    # Log significant performance impact
                    if execution_time > 0.1:  # > 100ms
                        logger.warning(f"Enterprise feature {feature_name} took {execution_time:.3f}s")
                    
                    return result
                    
                except Exception as e:
                    logger.error(f"Performance monitoring for {feature_name} failed: {e}")
                    # Continue with original function execution
                    return func(*args, **kwargs)
                    
            return wrapper
        return decorator
    
    def _apply_enterprise_analysis(self, violations: List[Dict], feature_name: str, 
                                    *args, **kwargs) -> List[Dict]:
        """
        Apply enterprise analysis to existing violations.
        
        Args:
            violations: Original violation list
            feature_name: Name of enterprise feature
            
        Returns:
            Enhanced violation list
        """
        # NASA Rule 5: Input validation
        assert isinstance(violations, list), "violations must be a list"
        assert feature_name is not None, "feature_name cannot be None"
        
        enhanced_violations = violations.copy()  # Start with original violations
        
        if feature_name == 'sixsigma':
            enhanced_violations.extend(self._apply_sixsigma_analysis(violations, *args, **kwargs))
        elif feature_name == 'dfars_compliance':
            enhanced_violations.extend(self._apply_dfars_analysis(violations, *args, **kwargs))
        elif feature_name == 'supply_chain_governance':
            enhanced_violations.extend(self._apply_supply_chain_analysis(violations, *args, **kwargs))
        else:
            logger.warning(f"Unknown enterprise feature: {feature_name}")
        
        return enhanced_violations
    
    def _get_enterprise_gates(self, feature_name: str, *args, **kwargs) -> List[Dict]:
        """
        Get enterprise-specific quality gates.
        
        Args:
            feature_name: Name of enterprise feature
            
        Returns:
            List of enterprise quality gate results
        """
        enterprise_gates = []
        
        if feature_name == 'sixsigma':
            enterprise_gates.extend(self._get_sixsigma_gates(*args, **kwargs))
        elif feature_name == 'dfars_compliance':
            enterprise_gates.extend(self._get_dfars_gates(*args, **kwargs))
        elif feature_name == 'supply_chain_governance':
            enterprise_gates.extend(self._get_supply_chain_gates(*args, **kwargs))
        
        return enterprise_gates
    
    def _get_enterprise_config(self, feature_name: str, base_config: Dict,
                                *args, **kwargs) -> Dict[str, Any]:
        """
        Get enterprise-specific configuration settings.
        
        Args:
            feature_name: Name of enterprise feature
            base_config: Base configuration dictionary
            
        Returns:
            Enterprise configuration dictionary
        """
        enterprise_config = {}
        
        if feature_name == 'sixsigma':
            enterprise_config.update(self._get_sixsigma_config(base_config))
        elif feature_name == 'dfars_compliance':
            enterprise_config.update(self._get_dfars_config(base_config))
        elif feature_name == 'supply_chain_governance':
            enterprise_config.update(self._get_supply_chain_config(base_config))
        
        return enterprise_config
    
    def _apply_sixsigma_analysis(self, violations: List[Dict], *args, **kwargs) -> List[Dict]:
        """Apply Six Sigma quality analysis to violations."""
        sixsigma_violations = []
        
        # Calculate defect density (violations per 100 LOC)
        total_loc = kwargs.get('total_loc', 1000)  # Default estimate
        defect_density = len(violations) / (total_loc / 100)
        
        # Six Sigma target: < 3.4 defects per million opportunities
        if defect_density > 0.34:
            sixsigma_violations.append({
                'type': 'sixsigma_defect_density',
                'severity': 'high' if defect_density > 1.0 else 'medium',
                'message': f'Defect density {defect_density:.2f} exceeds Six Sigma target (0.34)',
                'context': {'defect_density': defect_density, 'total_loc': total_loc},
                'enterprise_feature': 'sixsigma'
            })
        
        return sixsigma_violations
    
    def _apply_dfars_analysis(self, violations: List[Dict], *args, **kwargs) -> List[Dict]:
        """Apply DFARS compliance analysis to violations."""
        dfars_violations = []
        
        # Check for security-related violations
        security_violations = [v for v in violations if 'security' in v.get('type', '').lower()]
        
        if security_violations:
            dfars_violations.append({
                'type': 'dfars_security_requirement',
                'severity': 'critical',
                'message': f'Security violations found: {len(security_violations)} (DFARS non-compliant)',
                'context': {'security_violation_count': len(security_violations)},
                'enterprise_feature': 'dfars_compliance'
            })
        
        return dfars_violations
    
    def _apply_supply_chain_analysis(self, violations: List[Dict], *args, **kwargs) -> List[Dict]:
        """Apply supply chain governance analysis to violations."""
        supply_chain_violations = []
        
        # Mock supply chain risk analysis
        context = kwargs.get('context', {})
        dependencies = context.get('dependencies', [])
        
        if len(dependencies) > 50:  # Many dependencies = higher risk
            supply_chain_violations.append({
                'type': 'supply_chain_complexity',
                'severity': 'medium',
                'message': f'High dependency count ({len(dependencies)}) increases supply chain risk',
                'context': {'dependency_count': len(dependencies)},
                'enterprise_feature': 'supply_chain_governance'
            })
        
        return supply_chain_violations
    
    def _get_memory_usage(self) -> int:
        """Get current memory usage in bytes."""
        try:
            import psutil
            return psutil.Process().memory_info().rss
        except ImportError:
            return 0
    
    def _record_performance_metrics(self, feature_name: str, execution_time: float, 
                                    memory_delta: int) -> None:
        """Record performance metrics for enterprise feature."""
        if feature_name not in self._enhancement_registry:
            self._enhancement_registry[feature_name] = {
                'call_count': 0,
                'total_time': 0.0,
                'max_time': 0.0,
                'total_memory': 0
            }
        
        metrics = self._enhancement_registry[feature_name]
        metrics['call_count'] += 1
        metrics['total_time'] += execution_time
        metrics['max_time'] = max(metrics['max_time'], execution_time)
        metrics['total_memory'] += memory_delta
        
    def get_performance_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get performance metrics for all enterprise features."""
        return self._enhancement_registry.copy()