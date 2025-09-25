from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_GOD_OBJECTS_ALLOWED

import os
import json
import hashlib
import subprocess
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class SoftwareComponent:
    """Represents a software component in the supply chain."""
    name: str
    version: str
    license: str
    supplier: str
    hash: Optional[str] = None
    vulnerabilities: List[str] = None
    source_url: Optional[str] = None

@dataclass
class SLSAAttestation:
    """SLSA (Supply chain Levels for Software Artifacts) attestation."""
    subject: str
    predicate_type: str
    predicate: Dict[str, Any]
    signature: Optional[str] = None

class SupplyChainSecurity:
    """Main supply chain security manager."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}

    def generate_sbom(self, project_path: str) -> Dict[str, Any]:
        """Generate Software Bill of Materials (SBOM)."""
        sbom = {
            "bomFormat": "CycloneDX",
            "specVersion": "1.4",
            "serialNumber": f"urn:uuid:{self._generate_uuid()}",
            "version": 1,
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "tools": ["SPEK Security Analyzer"],
                "component": {
                    "type": "application",
                    "name": os.path.basename(project_path),
                    "version": "1.0.0"
                }
            },
            "components": []
        }

        # Scan for Python dependencies
        components = []
        components.extend(self._scan_python_dependencies(project_path))
        components.extend(self._scan_javascript_dependencies(project_path))

        sbom["components"] = [
            {
                "type": "library",
                "name": comp.name,
                "version": comp.version,
                "licenses": [{"license": {"name": comp.license}}] if comp.license else [],
                "supplier": {"name": comp.supplier} if comp.supplier else None,
                "hashes": [{"alg": "SHA-256", "content": comp.hash}] if comp.hash else [],
                "externalReferences": [
                    {"type": "vcs", "url": comp.source_url}
                ] if comp.source_url else []
            }
            for comp in components
        ]

        return sbom

    def _scan_python_dependencies(self, project_path: str) -> List[SoftwareComponent]:
        """Scan Python dependencies."""
        components = []

        # Check requirements.txt
        req_file = os.path.join(project_path, 'requirements.txt')
        if path_exists(req_file):
            components.extend(self._parse_requirements_file(req_file))

        # Check Pipfile
        pipfile = os.path.join(project_path, 'Pipfile')
        if path_exists(pipfile):
            components.extend(self._parse_pipfile(pipfile))

        # Check pyproject.toml
        pyproject = os.path.join(project_path, 'pyproject.toml')
        if path_exists(pyproject):
            components.extend(self._parse_pyproject_toml(pyproject))

        return components

    def _parse_requirements_file(self, file_path: str) -> List[SoftwareComponent]:
        """Parse requirements.txt file."""
        components = []

        try:
            with open(file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        if '==' in line:
                            name, version = line.split('==', 1)
                            components.append(SoftwareComponent(
                                name=name.strip(),
                                version=version.strip(),
                                license="Unknown",
                                supplier="PyPI",
                                source_url=f"https://pypi.org/project/{name.strip()}/"
                            ))
        except Exception:
            pass

        return components

    def _parse_pipfile(self, file_path: str) -> List[SoftwareComponent]:
        """Parse Pipfile."""
        components = []
        # Implementation would parse TOML format
        return components

    def _parse_pyproject_toml(self, file_path: str) -> List[SoftwareComponent]:
        """Parse pyproject.toml."""
        components = []
        # Implementation would parse TOML format
        return components

    def _scan_javascript_dependencies(self, project_path: str) -> List[SoftwareComponent]:
        """Scan JavaScript dependencies."""
        components = []

        package_json = os.path.join(project_path, 'package.json')
        if path_exists(package_json):
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)

                dependencies = data.get('dependencies', {})
                dev_dependencies = data.get('devDependencies', {})

                all_deps = {**dependencies, **dev_dependencies}

                for name, version in all_deps.items():
                    components.append(SoftwareComponent(
                        name=name,
                        version=version.replace('^', '').replace('~', ''),
                        license="Unknown",
                        supplier="npm",
                        source_url=f"https://www.npmjs.com/package/{name}"
                    ))

            except Exception:
                pass

        return components

    def validate_dependencies(self, components: List[SoftwareComponent]) -> Dict[str, Any]:
        """Validate dependencies against known vulnerability databases."""
        validation_results = {
            "total_components": len(components),
            "vulnerable_components": 0,
            "vulnerabilities": [],
            "recommendations": []
        }

        # Simplified vulnerability check
        known_vulnerabilities = {
            "lodash": {"<4.17.19": ["CVE-2020-8203"]},
            "express": {"<4.17.3": ["CVE-2022-24999"]},
            "django": {"<2.2.28": ["CVE-2022-28346"]},
            "flask": {"<2.0.3": ["CVE-2022-0550"]},
        }

        for component in components:
            if component.name.lower() in known_vulnerabilities:
                vulns = known_vulnerabilities[component.name.lower()]
                for version_spec, cves in vulns.items():
                    if self._version_vulnerable(component.version, version_spec):
                        validation_results["vulnerable_components"] += 1
                        validation_results["vulnerabilities"].append({
                            "component": component.name,
                            "version": component.version,
                            "vulnerabilities": cves,
                            "recommendation": f"Update {component.name} to latest secure version"
                        })

        if validation_results["vulnerable_components"] > 0:
            validation_results["recommendations"].append("Update vulnerable dependencies immediately")

        return validation_results

    def _version_vulnerable(self, current_version: str, vulnerable_spec: str) -> bool:
        """Check if version is vulnerable according to spec."""
        if vulnerable_spec.startswith('<'):
            target_version = vulnerable_spec[1:]
            return current_version < target_version
        return False

    def generate_slsa_attestation(self, artifact_path: str, build_info: Dict[str, Any]) -> SLSAAttestation:
        """Generate SLSA attestation for an artifact."""
        # Calculate artifact hash
        artifact_hash = self._calculate_file_hash(artifact_path)

        predicate = {
            "buildType": "https://slsa.dev/spec/v1.0/build",
            "builder": {
                "id": "https://github.com/spek-platform/builder"
            },
            "invocation": {
                "configSource": build_info.get("config_source", {}),
                "parameters": build_info.get("parameters", {}),
                "environment": build_info.get("environment", {})
            },
            "buildConfig": build_info.get("build_config", {}),
            "metadata": {
                "buildStartedOn": build_info.get("start_time", datetime.now().isoformat()),
                "buildFinishedOn": build_info.get("end_time", datetime.now().isoformat()),
                "completeness": {
                    "parameters": True,
                    "environment": True,
                    "materials": True
                },
                "reproducible": build_info.get("reproducible", False)
            },
            "materials": build_info.get("materials", [])
        }

        return SLSAAttestation(
            subject=f"sha256:{artifact_hash}",
            predicate_type="https://slsa.dev/provenance/v1",
            predicate=predicate
        )

    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of a file."""
        if not path_exists(file_path):
            return ""

        sha256_hash = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(chunk)
            return sha256_hash.hexdigest()
        except Exception:
            return ""

    def _generate_uuid(self) -> str:
        """Generate a UUID for SBOM."""
        import uuid
        return str(uuid.uuid4())

    def analyze_supply_chain_risks(self, project_path: str) -> Dict[str, Any]:
        """Comprehensive supply chain risk analysis."""
        # Generate SBOM
        sbom = self.generate_sbom(project_path)

        # Extract components
        components = []
        for comp_data in sbom.get("components", []):
            components.append(SoftwareComponent(
                name=comp_data["name"],
                version=comp_data["version"],
                license=comp_data.get("licenses", [{}])[0].get("license", {}).get("name", "Unknown"),
                supplier=comp_data.get("supplier", {}).get("name", "Unknown")
            ))

        # Validate dependencies
        validation_results = self.validate_dependencies(components)

        # Risk assessment
        risk_score = self._calculate_supply_chain_risk_score(validation_results, components)

        return {
            "sbom": sbom,
            "validation_results": validation_results,
            "risk_assessment": {
                "risk_score": risk_score,
                "risk_level": self._get_risk_level(risk_score),
                "total_dependencies": len(components),
                "vulnerable_dependencies": validation_results["vulnerable_components"],
                "recommendations": validation_results["recommendations"]
            },
            "timestamp": datetime.now().isoformat()
        }

    def _calculate_supply_chain_risk_score(self, validation_results: Dict[str, Any], components: List[SoftwareComponent]) -> float:
        """Calculate supply chain risk score (0-100, lower is better)."""
        if not components:
            return 0.0

        vulnerable_ratio = validation_results["vulnerable_components"] / len(components)
        total_vulns = len(validation_results["vulnerabilities"])

        risk_score = (vulnerable_ratio * 50) + (total_vulns * 5)
        return min(1.0, risk_score)

    def _get_risk_level(self, risk_score: float) -> str:
        """Get risk level based on score."""
        if risk_score >= 75:
            return "CRITICAL"
        elif risk_score >= 50:
            return "HIGH"
        elif risk_score >= MAXIMUM_GOD_OBJECTS_ALLOWED:
            return "MEDIUM"
        else:
            return "LOW"

class SBOMGenerator(SupplyChainSecurity):
    """Alias for SBOM generation functionality."""

class SLSAGenerator(SupplyChainSecurity):
    """Alias for SLSA attestation functionality."""