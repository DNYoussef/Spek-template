# Supply Chain Artifacts Generation

## Overview

This module generates comprehensive supply chain security artifacts for enterprise compliance:

- **SBOM Generation**: Software Bill of Materials in SPDX format
- **SLSA Provenance**: Supply-chain Levels for Software Artifacts attestations
- **Dependency Analysis**: Vulnerability scanning and license compliance
- **Attestation Signing**: Cryptographic verification of artifacts

## Architecture

### Core Components

1. **SBOMGenerator** - SPDX-compliant bill of materials
2. **SLSAProvenanceGenerator** - Build provenance attestations
3. **DependencyScanner** - Vulnerability and license analysis
4. **AttestationSigner** - Cryptographic signing pipeline
5. **ComplianceValidator** - Supply chain policy enforcement

## Generated Artifacts

### SBOM (Software Bill of Materials)
- Package inventory with versions
- Dependency relationships
- License information
- Vulnerability mappings
- SPDX 2.3 compliant format

### SLSA Provenance
- Build environment attestations
- Source code provenance
- Build steps verification
- Cryptographic signatures
- SLSA Level 3 compliance

## Feature Flags

```python
ENABLE_SBOM_GENERATION = os.getenv('ENABLE_SBOM_GENERATION', 'false').lower() == 'true'
ENABLE_SLSA_PROVENANCE = os.getenv('ENABLE_SLSA_PROVENANCE', 'false').lower() == 'true'
```

## Usage

```python
from .claude.artifacts.supply_chain.generator import SupplyChainGenerator

generator = SupplyChainGenerator()
sbom = generator.generate_sbom(project_metadata)
slsa_provenance = generator.generate_slsa_provenance(build_context)
compliance_report = generator.validate_compliance(policy_requirements)
```

## Integration Points

- GitHub Actions for automated generation
- npm/pip package analysis
- Docker image scanning
- Artifact signing with cosign
- Policy enforcement with OPA