"""
Supply Chain Security Analyzer - Domain SC
Enterprise-grade supply chain security artifacts and attestation.

Tasks: SC-1 through SC-5
- SC-1: SBOM (Software Bill of Materials) generator in CycloneDX/SPDX formats
- SC-2: SLSA L3 provenance attestation system  
- SC-3: Vulnerability scanning and license compliance engine
- SC-4: Cryptographic artifact signing with cosign integration
- SC-5: Supply chain evidence package generator
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