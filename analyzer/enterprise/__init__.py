# SPDX-License-Identifier: MIT
"""
Enterprise Module Package
=========================

Enterprise-grade analysis capabilities for defense industry compliance,
Six Sigma quality management, and supply chain governance.

This package provides non-breaking enterprise enhancements to the analyzer
system while maintaining 92% NASA POT10 compliance.
"""
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set


from typing import Dict, Any, Optional
import logging

from .core.feature_flags import EnterpriseFeatureManager, FeatureState

# Enterprise module version
logger = logging.getLogger(__name__)

__version__ = "1.0.0"

# Global feature manager instance
_feature_manager: Optional[EnterpriseFeatureManager] = None

def initialize_enterprise_features(config_manager) -> EnterpriseFeatureManager:
    """
    Initialize enterprise features with configuration.
    
    Args:
        config_manager: ConfigurationManager instance
        
    Returns:
        EnterpriseFeatureManager instance
    """
    global _feature_manager
    
    # NASA Rule 5: Input validation
    assert config_manager is not None, "config_manager cannot be None"
    
    _feature_manager = EnterpriseFeatureManager(config_manager)
    
    enabled_features = _feature_manager.get_enabled_modules()
    if enabled_features:
        logger.info(f"Enterprise features enabled: {', '.join(enabled_features)}")
    else:
        logger.info("Enterprise features disabled - zero performance impact")
    
    return _feature_manager

def get_feature_manager() -> Optional[EnterpriseFeatureManager]:
    """Get the global enterprise feature manager instance."""
    return _feature_manager

def is_enterprise_enabled() -> bool:
    """Check if any enterprise features are enabled."""
    return _feature_manager is not None and len(_feature_manager.get_enabled_modules()) > 0

def get_enterprise_status() -> Dict[str, Any]:
    """
    Get enterprise module status information.
    
    Returns:
        Dictionary containing enterprise module status
    """
    if not _feature_manager:
        return {
            "initialized": False,
            "enabled_features": [],
            "total_features": 0,
            "performance_impact": "none"
        }
    
    enabled_modules = _feature_manager.get_enabled_modules()
    
    return {
        "initialized": True,
        "enabled_features": enabled_modules,
        "total_features": len(_feature_manager.features),
        "performance_impact": "none" if not enabled_modules else "low",
        "version": __version__
    }

# Conditional imports to avoid loading enterprise modules when not needed
def get_sixsigma_analyzer():
    """Lazy load Six Sigma analyzer when needed."""
    if not _feature_manager or not _feature_manager.is_enabled('sixsigma'):
        return None
        
    try:
        from .sixsigma.dmaic_analyzer import SixSigmaDMAICAnalyzer
        return SixSigmaDMAICAnalyzer
    except ImportError as e:
        logger.warning(f"Six Sigma module not available: {e}")
        return None

def get_dfars_analyzer():
    """Lazy load DFARS compliance analyzer when needed."""
    if not _feature_manager or not _feature_manager.is_enabled('dfars_compliance'):
        return None
        
    try:
        from .compliance.dfars_analyzer import DFARSComplianceAnalyzer
        return DFARSComplianceAnalyzer
    except ImportError as e:
        logger.warning(f"DFARS compliance module not available: {e}")
        return None

def get_supply_chain_analyzer():
    """Lazy load supply chain analyzer when needed."""
    if not _feature_manager or not _feature_manager.is_enabled('supply_chain_governance'):
        return None
        
    try:
        from .supply_chain.sbom_analyzer import SoftwareBillOfMaterialsAnalyzer
        return SoftwareBillOfMaterialsAnalyzer
    except ImportError as e:
        logger.warning(f"Supply chain governance module not available: {e}")
        return None