"""
Supply Chain Artifacts Generator - Phase 3 Artifact Generation
============================================================

Implements SBOM and SLSA provenance generation for enterprise supply chain security.
Feature flag controlled with zero breaking changes to existing functionality.
"""

import os
import json
import logging
import hashlib
import subprocess
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import uuid

# Feature flags for supply chain artifacts
ENABLE_SBOM_GENERATION = os.getenv('ENABLE_SBOM_GENERATION', 'false').lower() == 'true'
ENABLE_SLSA_PROVENANCE = os.getenv('ENABLE_SLSA_PROVENANCE', 'false').lower() == 'true'

@dataclass
class PackageInfo:
    """Package information for SBOM"""
    name: str
    version: str
    license: str
    supplier: str
    download_location: str
    files_analyzed: bool
    license_concluded: str
    license_info_from_files: List[str]
    copyright_text: str
    checksum: str = ""
    vulnerability_count: int = 0
    
    def __post_init__(self):
        if not self.checksum:
            self.checksum = hashlib.sha256(f"{self.name}{self.version}".encode()).hexdigest()

@dataclass
class SLSAProvenance:
    """SLSA provenance attestation"""
    builder_id: str
    build_type: str
    invocation: Dict[str, Any]
    build_config: Dict[str, Any]
    materials: List[Dict[str, Any]]
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

class SupplyChainGenerator:
    """Main supply chain artifacts generator"""
    
    def __init__(self, output_dir: str = ".claude/.artifacts/supply-chain"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger(__name__)
        
        # SPDX document metadata
        self.spdx_version = "SPDX-2.3"
        self.document_namespace = f"https://spek-analyzer.local/{uuid.uuid4()}"
        self.creation_info = {
            "created": datetime.now().isoformat(),
            "creators": ["Tool: SPEK-Analyzer-v1.0"],
            "license_list_version": "3.19"
        }
    
    def is_sbom_enabled(self) -> bool:
        """Check if SBOM generation is enabled"""
        return ENABLE_SBOM_GENERATION
    
    def is_slsa_enabled(self) -> bool:
        """Check if SLSA provenance is enabled"""
        return ENABLE_SLSA_PROVENANCE
    
    def generate_sbom(self, project_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SPDX-compliant Software Bill of Materials"""
        if not self.is_sbom_enabled():
            return {"status": "disabled", "message": "SBOM generation disabled"}
        
        try:
            # Analyze project dependencies
            packages = self._analyze_dependencies(project_metadata)
            relationships = self._analyze_relationships(packages)
            
            # Create SPDX document
            sbom = {
                "spdxVersion": self.spdx_version,
                "dataLicense": "CC0-1.0",
                "SPDXID": "SPDXRef-DOCUMENT",
                "name": f"{project_metadata.get('name', 'project')}-sbom",
                "documentNamespace": self.document_namespace,
                "creationInfo": self.creation_info,
                "packages": [asdict(pkg) for pkg in packages],
                "relationships": relationships,
                "vulnerabilities": self._scan_vulnerabilities(packages)
            }
            
            # Save SBOM
            output_file = self.output_dir / "sbom.spdx.json"
            with open(output_file, 'w') as f:
                json.dump(sbom, f, indent=2)
            
            self.logger.info(f"SBOM generated: {output_file}")
            return sbom
            
        except Exception as e:
            self.logger.error(f"Error generating SBOM: {e}")
            return {"status": "error", "message": str(e)}
    
    def generate_slsa_provenance(self, build_context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SLSA provenance attestation"""
        if not self.is_slsa_enabled():
            return {"status": "disabled", "message": "SLSA provenance disabled"}
        
        try:
            # Collect build materials
            materials = self._collect_build_materials(build_context)
            
            # Create SLSA provenance
            provenance = SLSAProvenance(
                builder_id="https://github.com/spek-analyzer/builder",
                build_type="https://slsa.dev/provenance/v0.2",
                invocation={
                    "configSource": {
                        "uri": build_context.get('repo_uri', ''),
                        "digest": {
                            "sha1": build_context.get('commit_sha', '')
                        }
                    },
                    "parameters": build_context.get('build_params', {}),
                    "environment": build_context.get('environment', {})
                },
                build_config={
                    "steps": build_context.get('build_steps', []),
                    "platform": build_context.get('platform', {}),
                    "toolchain": build_context.get('toolchain', {})
                },
                materials=materials
            )
            
            # Create full attestation
            attestation = {
                "_type": "https://in-toto.io/Statement/v0.1",
                "subject": [{
                    "name": build_context.get('artifact_name', 'artifact'),
                    "digest": {
                        "sha256": build_context.get('artifact_hash', '')
                    }
                }],
                "predicateType": "https://slsa.dev/provenance/v0.2",
                "predicate": asdict(provenance)
            }
            
            # Save provenance
            output_file = self.output_dir / "slsa_provenance.json"
            with open(output_file, 'w') as f:
                json.dump(attestation, f, indent=2)
            
            self.logger.info(f"SLSA provenance generated: {output_file}")
            return attestation
            
        except Exception as e:
            self.logger.error(f"Error generating SLSA provenance: {e}")
            return {"status": "error", "message": str(e)}
    
    def validate_compliance(self, policy_requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Validate supply chain compliance against policies"""
        try:
            compliance_report = {
                "timestamp": datetime.now().isoformat(),
                "sbom_compliance": False,
                "slsa_compliance": False,
                "vulnerability_compliance": True,
                "license_compliance": True,
                "issues": [],
                "recommendations": []
            }
            
            # Check SBOM compliance
            sbom_file = self.output_dir / "sbom.spdx.json"
            if sbom_file.exists():
                compliance_report["sbom_compliance"] = True
            else:
                compliance_report["issues"].append("SBOM file not found")
            
            # Check SLSA compliance
            slsa_file = self.output_dir / "slsa_provenance.json"
            if slsa_file.exists():
                compliance_report["slsa_compliance"] = True
            else:
                compliance_report["issues"].append("SLSA provenance not found")
            
            # Check vulnerability thresholds
            max_critical = policy_requirements.get('max_critical_vulnerabilities', 0)
            max_high = policy_requirements.get('max_high_vulnerabilities', 5)
            
            if self._count_vulnerabilities('critical') > max_critical:
                compliance_report["vulnerability_compliance"] = False
                compliance_report["issues"].append(f"Critical vulnerabilities exceed limit ({max_critical})")
            
            if self._count_vulnerabilities('high') > max_high:
                compliance_report["vulnerability_compliance"] = False
                compliance_report["issues"].append(f"High vulnerabilities exceed limit ({max_high})")
            
            # Generate recommendations
            if not compliance_report["sbom_compliance"]:
                compliance_report["recommendations"].append("Enable SBOM generation with ENABLE_SBOM_GENERATION=true")
            
            if not compliance_report["slsa_compliance"]:
                compliance_report["recommendations"].append("Enable SLSA provenance with ENABLE_SLSA_PROVENANCE=true")
            
            if not compliance_report["vulnerability_compliance"]:
                compliance_report["recommendations"].append("Update vulnerable dependencies before release")
            
            # Save compliance report
            output_file = self.output_dir / "compliance_report.json"
            with open(output_file, 'w') as f:
                json.dump(compliance_report, f, indent=2)
            
            self.logger.info(f"Compliance report generated: {output_file}")
            return compliance_report
            
        except Exception as e:
            self.logger.error(f"Error validating compliance: {e}")
            return {"status": "error", "message": str(e)}
    
    def _analyze_dependencies(self, project_metadata: Dict[str, Any]) -> List[PackageInfo]:
        """Analyze project dependencies for SBOM"""
        packages = []
        
        # Analyze npm dependencies
        if Path("package.json").exists():
            packages.extend(self._analyze_npm_dependencies())
        
        # Analyze Python dependencies  
        if Path("requirements.txt").exists() or Path("pyproject.toml").exists():
            packages.extend(self._analyze_python_dependencies())
        
        # Add project itself as root package
        project_package = PackageInfo(
            name=project_metadata.get('name', 'spek-analyzer'),
            version=project_metadata.get('version', '1.0.0'),
            license=project_metadata.get('license', 'MIT'),
            supplier=project_metadata.get('supplier', 'NOASSERTION'),
            download_location=project_metadata.get('repository', 'NOASSERTION'),
            files_analyzed=True,
            license_concluded=project_metadata.get('license', 'MIT'),
            license_info_from_files=[project_metadata.get('license', 'MIT')],
            copyright_text=project_metadata.get('copyright', 'NOASSERTION')
        )
        packages.insert(0, project_package)
        
        return packages
    
    def _analyze_npm_dependencies(self) -> List[PackageInfo]:
        """Analyze npm dependencies"""
        packages = []
        try:
            # Read package.json
            with open("package.json", 'r') as f:
                package_json = json.load(f)
            
            # Process dependencies
            deps = {**package_json.get('dependencies', {}), **package_json.get('devDependencies', {})}
            
            for name, version in deps.items():
                packages.append(PackageInfo(
                    name=name,
                    version=version.replace('^', '').replace('~', ''),
                    license="NOASSERTION",
                    supplier="NOASSERTION",
                    download_location=f"https://www.npmjs.com/package/{name}",
                    files_analyzed=False,
                    license_concluded="NOASSERTION",
                    license_info_from_files=["NOASSERTION"],
                    copyright_text="NOASSERTION"
                ))
        except Exception as e:
            self.logger.warning(f"Error analyzing npm dependencies: {e}")
        
        return packages
    
    def _analyze_python_dependencies(self) -> List[PackageInfo]:
        """Analyze Python dependencies"""
        packages = []
        try:
            # Read requirements.txt
            if Path("requirements.txt").exists():
                with open("requirements.txt", 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            parts = line.split('==')
                            name = parts[0].strip()
                            version = parts[1].strip() if len(parts) > 1 else "NOASSERTION"
                            
                            packages.append(PackageInfo(
                                name=name,
                                version=version,
                                license="NOASSERTION",
                                supplier="NOASSERTION",
                                download_location=f"https://pypi.org/project/{name}",
                                files_analyzed=False,
                                license_concluded="NOASSERTION",
                                license_info_from_files=["NOASSERTION"],
                                copyright_text="NOASSERTION"
                            ))
        except Exception as e:
            self.logger.warning(f"Error analyzing Python dependencies: {e}")
        
        return packages
    
    def _analyze_relationships(self, packages: List[PackageInfo]) -> List[Dict[str, str]]:
        """Analyze package relationships"""
        relationships = []
        
        if packages:
            root_package = packages[0]
            # Root package depends on all other packages
            for pkg in packages[1:]:
                relationships.append({
                    "spdxElementId": f"SPDXRef-Package-{root_package.name}",
                    "relationshipType": "DEPENDS_ON",
                    "relatedSpdxElement": f"SPDXRef-Package-{pkg.name}"
                })
        
        return relationships
    
    def _collect_build_materials(self, build_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Collect build materials for SLSA provenance"""
        materials = []
        
        # Source code material
        materials.append({
            "uri": build_context.get('repo_uri', ''),
            "digest": {
                "sha1": build_context.get('commit_sha', '')
            }
        })
        
        # Build configuration materials
        config_files = ['package.json', 'requirements.txt', 'Dockerfile', '.github/workflows']
        for config_file in config_files:
            if Path(config_file).exists():
                materials.append({
                    "uri": f"file://{config_file}",
                    "digest": self._calculate_file_hash(config_file)
                })
        
        return materials
    
    def _calculate_file_hash(self, file_path: str) -> Dict[str, str]:
        """Calculate file hash for integrity verification"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
                return {"sha256": hashlib.sha256(content).hexdigest()}
        except Exception:
            return {"sha256": ""}
    
    def _scan_vulnerabilities(self, packages: List[PackageInfo]) -> List[Dict[str, Any]]:
        """Scan packages for known vulnerabilities"""
        vulnerabilities = []
        
        # Mock vulnerability data for demonstration
        # In production, this would integrate with vulnerability databases
        for pkg in packages:
            if 'vulnerable' in pkg.name.lower():  # Mock condition
                vulnerabilities.append({
                    "id": f"CVE-2023-{hash(pkg.name) % 10000:04d}",
                    "description": f"Mock vulnerability in {pkg.name}",
                    "severity": "HIGH",
                    "package": pkg.name,
                    "version": pkg.version,
                    "fixed_version": "latest"
                })
        
        return vulnerabilities
    
    def _count_vulnerabilities(self, severity: str) -> int:
        """Count vulnerabilities by severity"""
        try:
            sbom_file = self.output_dir / "sbom.spdx.json"
            if sbom_file.exists():
                with open(sbom_file, 'r') as f:
                    sbom = json.load(f)
                return len([v for v in sbom.get('vulnerabilities', []) if v.get('severity', '').lower() == severity.lower()])
        except Exception:
            pass
        return 0

# Integration functions for existing analyzer
def generate_sbom_artifact(project_metadata: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Integration function for SBOM generation"""
    if not ENABLE_SBOM_GENERATION:
        return None
    
    generator = SupplyChainGenerator()
    return generator.generate_sbom(project_metadata)

def generate_slsa_provenance_artifact(build_context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Integration function for SLSA provenance generation"""
    if not ENABLE_SLSA_PROVENANCE:
        return None
    
    generator = SupplyChainGenerator()
    return generator.generate_slsa_provenance(build_context)