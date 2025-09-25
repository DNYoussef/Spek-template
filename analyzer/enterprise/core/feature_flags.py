# SPDX-License-Identifier: MIT
"""
Enterprise Feature Flag System
==============================

Zero-performance-impact feature flag system for enterprise modules.
Enables granular control over enterprise capabilities with complete
backward compatibility.

NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule MAXIMUM_NESTED_DEPTH Compliant: Comprehensive defensive assertions.
"""

from typing import Dict, Any, Optional, List
import logging

from dataclasses import dataclass
from enum import Enum

from src.constants.base import MAXIMUM_NESTED_DEPTH, NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
logger = loggi, NASA_POT10_TARGET_COMPLIANCE_THRESHOLDng.getLogger(__name__)

class FeatureState(Enum):
    """Enterprise feature states."""
    DISABLED = "disabled"
    ENABLED = "enabled"
    BETA = "beta"
    DEPRECATED = "deprecated"

@dataclass
class FeatureFlag:
    """Enterprise feature flag definition."""
    name: str
    state: FeatureState
    description: str
    dependencies: List[str] = None
    performance_impact: str = "none"  # none, low, medium, high
    min_nasa_compliance: float = NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD  # Minimum NASA compliance required
    
def __post_init__(self):
        """Post-initialization validation."""
        if self.dependencies is None:
            self.dependencies = []
        
        # NASA Rule 5: Validate performance impact
        valid_impacts = ["none", "low", "medium", "high"]
        assert self.performance_impact in valid_impacts, f"Invalid performance impact: {self.performance_impact}"
        
        # NASA Rule 5: Validate NASA compliance requirement
        assert 0.0 <= self.min_nasa_compliance <= 1.0, "NASA compliance must be between 0.0 and 1.0"

class EnterpriseFeatureManager:
    """
    Manages enterprise feature flags with zero performance impact.
    
    When features are disabled, method calls have minimal overhead through
    early returns and cached results.
    
    NASA Rule 4 Compliant: All methods under 60 lines.
    """
    
def __init__(self, config_manager):
        """Initialize feature manager with configuration."""
        # NASA Rule 5: Input validation assertions
        assert config_manager is not None, "config_manager cannot be None"
        
        self.config = config_manager
        self.features = self._load_feature_config()
        self._feature_cache = {}  # Performance optimization cache
        self._initialized = True
        
        # Log initialization status
        enabled_count = len(self.get_enabled_modules())
        logger.info(f"Enterprise features initialized: {enabled_count} enabled, {len(self.features)} total")
        
def is_enabled(self, feature_name: str) -> bool:
        """
        Check if enterprise feature is enabled (cached for performance).
        
        Args:
            feature_name: Name of the feature to check
            
        Returns:
            True if feature is enabled, False otherwise
        """
        # NASA Rule 5: Input validation
        assert feature_name is not None, "feature_name cannot be None"
        assert isinstance(feature_name, str), "feature_name must be a string"
        
        # Performance optimization: return cached result if available
        if feature_name in self._feature_cache:
            return self._feature_cache[feature_name]
            
        # Check feature state
        feature = self.features.get(feature_name)
        enabled = feature and feature.state in [FeatureState.ENABLED, FeatureState.BETA]
        
        # Validate dependencies if feature is enabled
        if enabled and feature.dependencies:
            for dependency in feature.dependencies:
                if not self.is_enabled(dependency):
                    logger.warning(f"Feature {feature_name} disabled due to missing dependency: {dependency}")
                    enabled = False
                    break
        
        # Cache result for performance
        self._feature_cache[feature_name] = enabled
        return enabled
    
def get_enabled_modules(self) -> List[str]:
        """
        Get list of enabled enterprise modules.
        
        Returns:
            List of enabled module names
        """
        enabled_modules = []
        
        for name, feature in self.features.items():
            if self.is_enabled(name):
                enabled_modules.append(name)
        
        return enabled_modules
    
def get_feature_info(self, feature_name: str) -> Optional[FeatureFlag]:
        """
        Get detailed information about a feature.
        
        Args:
            feature_name: Name of the feature
            
        Returns:
            FeatureFlag object or None if not found
        """
        # NASA Rule 5: Input validation
        assert feature_name is not None, "feature_name cannot be None"
        
        return self.features.get(feature_name)
    
def validate_nasa_compliance(self, current_compliance: float) -> Dict[str, Any]:
        """
        Validate that enabled features meet NASA compliance requirements.
        
        Args:
            current_compliance: Current NASA compliance score (0.0-1.0)
            
        Returns:
            Validation result dictionary
        """
        # NASA Rule 5: Input validation
        assert isinstance(current_compliance, (int, float)), "current_compliance must be numeric"
        assert 0.0 <= current_compliance <= 1.0, "current_compliance must be between 0.0 and 1.0"
        
        validation_result = {
            "overall_valid": True,
            "current_compliance": current_compliance,
            "feature_violations": [],
            "recommendations": []
        }
        
        # Check each enabled feature's compliance requirements
        for name, feature in self.features.items():
            if self.is_enabled(name) and current_compliance < feature.min_nasa_compliance:
                validation_result["overall_valid"] = False
                validation_result["feature_violations"].append({
                    "feature": name,
                    "required_compliance": feature.min_nasa_compliance,
                    "current_compliance": current_compliance,
                    "gap": feature.min_nasa_compliance - current_compliance
                })
                
                validation_result["recommendations"].append(
                    f"Disable {name} or improve NASA compliance to {feature.min_nasa_compliance:.1%}"
                )
        
        return validation_result
    
def get_performance_impact_summary(self) -> Dict[str, Any]:
        """
        Get performance impact summary for enabled features.
        
        Returns:
            Performance impact summary
        """
        enabled_features = self.get_enabled_modules()
        
        if not enabled_features:
            return {
                "total_features": 0,
                "performance_impact": "none",
                "impact_breakdown": {},
                "recommendations": ["No enterprise features enabled - zero performance impact"]
            }
        
        impact_counts = {"none": 0, "low": 0, "medium": 0, "high": 0}
        impact_breakdown = {}
        
        for feature_name in enabled_features:
            feature = self.features[feature_name]
            impact = feature.performance_impact
            impact_counts[impact] += 1
            impact_breakdown[feature_name] = impact
        
        # Determine overall impact level
        if impact_counts["high"] > 0:
            overall_impact = "high"
        elif impact_counts["medium"] > 0:
            overall_impact = "medium"  
        elif impact_counts["low"] > 0:
            overall_impact = "low"
        else:
            overall_impact = "none"
        
        return {
            "total_features": len(enabled_features),
            "performance_impact": overall_impact,
            "impact_breakdown": impact_breakdown,
            "impact_counts": impact_counts,
            "recommendations": self._generate_performance_recommendations(impact_counts)
        }
    
def clear_cache(self) -> None:
        """Clear the feature flag cache (useful for testing)."""
        self._feature_cache.clear()
        logger.debug("Enterprise feature cache cleared")
    
def _load_feature_config(self) -> Dict[str, FeatureFlag]:
        """
        Load enterprise feature configuration from config manager.
        
        Returns:
            Dictionary of FeatureFlag objects
        """
        enterprise_config = self.config.get_enterprise_config()
        features = {}
        
        # Load feature definitions
        for name, config in enterprise_config.get('features', {}).items():
            try:
                feature = FeatureFlag(
                    name=name,
                    state=FeatureState(config.get('state', 'disabled')),
                    description=config.get('description', ''),
                    dependencies=config.get('dependencies', []),
                    performance_impact=config.get('performance_impact', 'none'),
                    min_nasa_compliance=config.get('min_nasa_compliance', NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD)
                )
                features[name] = feature
                
                logger.debug(f"Loaded enterprise feature: {name} ({feature.state.value})")
                
            except Exception as e:
                logger.error(f"Failed to load feature config for {name}: {e}")
                # Continue loading other features
                continue
        
        # Load default features if no configuration provided
        if not features:
            features = self._get_default_features()
            logger.info("Using default enterprise feature configuration")
        
        return features
    
def _get_default_features(self) -> Dict[str, FeatureFlag]:
        """Get default enterprise feature definitions."""
        return {
            'sixsigma': FeatureFlag(
                name='sixsigma',
                state=FeatureState.DISABLED,
                description='Six Sigma quality analysis and DMAIC methodology',
                performance_impact='low',
                min_nasa_compliance=NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
            ),
            'dfars_compliance': FeatureFlag(
                name='dfars_compliance', 
                state=FeatureState.DISABLED,
                description='DFARS 252.204-7012 compliance checking',
                performance_impact='medium',
                min_nasa_compliance=NASA_POT10_TARGET_COMPLIANCE_THRESHOLD  # Higher compliance required for defense
            ),
            'supply_chain_governance': FeatureFlag(
                name='supply_chain_governance',
                state=FeatureState.DISABLED,
                description='Supply chain security and SBOM analysis',
                performance_impact='medium',
                min_nasa_compliance=NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
            )
        }
    
def _generate_performance_recommendations(self, impact_counts: Dict[str, int]) -> List[str]:
        """Generate performance optimization recommendations."""
        recommendations = []
        
        if impact_counts["high"] > 0:
            recommendations.append("Consider disabling high-impact features in production")
        
        if impact_counts["medium"] > 2:
            recommendations.append("Multiple medium-impact features may affect performance")
        
        if sum(impact_counts.values()) > 5:
            recommendations.append("Large number of features enabled - monitor performance closely")
        
        if not recommendations:
            recommendations.append("Current feature set has minimal performance impact")
        
        return recommendations