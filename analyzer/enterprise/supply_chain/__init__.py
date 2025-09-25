"""
Supply Chain Security Analyzer - Domain SC
Enterprise-grade supply chain security artifacts and attestation.

Tasks: SC-001 through SC-005
- SC-001: SBOM (Software Bill of Materials) generator in CycloneDX/SPDX formats
- SC-002: SLSA L3 provenance attestation system  
- SC-003: Vulnerability scanning and license compliance engine
- SC-004: Cryptographic artifact signing with cosign integration
- SC-005: Supply chain evidence package generator
"""

from .crypto_signer import CryptographicSigner
from .evidence_packager import EvidencePackager
from .sbom_generator import SBOMGenerator
from .slsa_provenance import SLSAProvenanceGenerator
from .supply_chain_analyzer import SupplyChainAnalyzer
from .vulnerability_scanner import VulnerabilityScanner

__all__ = [
    'SBOMGenerator',
    'SLSAProvenanceGenerator', 
    'VulnerabilityScanner',
    'CryptographicSigner',
    'EvidencePackager',
    'SupplyChainAnalyzer'
]

__version__ = "1.0.0"
__domain__ = "SC"