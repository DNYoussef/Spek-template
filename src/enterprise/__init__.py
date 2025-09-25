"""
Enterprise Module for SPEK Enhanced Development Platform

This module provides enterprise-grade capabilities including:
- Six Sigma telemetry and quality metrics
- Supply chain security (SBOM/SLSA)
- Compliance matrix generation (SOC2/ISO27001/NIST)
- Feature flag system with decorator patterns
- Non-breaking integration with existing analyzer components

Version: 1.0.0
"""

from .compliance.matrix import ComplianceMatrix, ComplianceFramework
from .flags.feature_flags import FeatureFlag, enterprise_feature, flag_manager
from .integration.analyzer import EnterpriseAnalyzerIntegration
from .security.supply_chain import SupplyChainSecurity, SBOMGenerator, SLSAGenerator
from .telemetry.six_sigma import SixSigmaTelemetry, SixSigmaMetrics

__version__ = "1.0.0"
__all__ = [
    "SixSigmaTelemetry",
    "SixSigmaMetrics", 
    "SupplyChainSecurity",
    "SBOMGenerator",
    "SLSAGenerator",
    "ComplianceMatrix",
    "ComplianceFramework",
    "FeatureFlag",
    "enterprise_feature",
    "flag_manager",
    "EnterpriseAnalyzerIntegration"
]

# Enterprise module initialization
def initialize_enterprise_module(config=None):
    """Initialize enterprise module with configuration"""
    from .config.enterprise_config import EnterpriseConfig
    
    if config is None:
        config = EnterpriseConfig.get_default_config()
    
    # Initialize feature flags
    flag_manager.load_config(config.get('feature_flags', {}))
    
    return True