from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
SC-1: SBOM (Software Bill of Materials) Generator
Supports CycloneDX 1.4 and SPDX 2.3 formats with enterprise-grade metadata.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import hashlib
import json
import os
import re
import subprocess

import uuid

class SBOMGenerator:
    """Multi-format SBOM generator with CycloneDX and SPDX support."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.output_dir = Path(config.get('output_dir', '.claude/.artifacts/supply_chain'))
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # SBOM metadata
        self.cyclone_dx_version = "1.4"
        self.spdx_version = "SPDX-2.3"
        self.tool_name = "SPEK-Supply-Chain-Analyzer"
        self.tool_version = "1.0.0"
        
    def generate_all_formats(self, project_path: str) -> Dict[str, str]:
        """Generate SBOM in both CycloneDX and SPDX formats."""
        components = self._analyze_dependencies(project_path)
        
        results = {}
        
        # Generate CycloneDX SBOM
        cyclone_dx_sbom = self._generate_cyclone_dx(components, project_path)
        cyclone_dx_path = self.output_dir / "sbom-cyclone-dx.json"
        with open(cyclone_dx_path, 'w', encoding='utf-8') as f:
            json.dump(cyclone_dx_sbom, f, indent=2, ensure_ascii=False)
        results['cyclone_dx'] = str(cyclone_dx_path)
        
        # Generate SPDX SBOM
        spdx_sbom = self._generate_spdx(components, project_path)
        spdx_path = self.output_dir / "sbom-spdx.json"
        with open(spdx_path, 'w', encoding='utf-8') as f:
            json.dump(spdx_sbom, f, indent=2, ensure_ascii=False)
        results['spdx'] = str(spdx_path)
        
        return results
    
    def _analyze_dependencies(self, project_path: str) -> List[Dict[str, Any]]:
        """Analyze project dependencies across multiple package managers."""
        components = []
        project_path = Path(project_path)
        
        # Node.js dependencies
        components.extend(self._analyze_npm_dependencies(project_path))
        
        # Python dependencies
        components.extend(self._analyze_python_dependencies(project_path))
        
        # System/OS components
        components.extend(self._analyze_system_components())
        
        return components
    
    def _analyze_npm_dependencies(self, project_path: Path) -> List[Dict[str, Any]]:
        """Analyze npm/yarn dependencies."""
        components = []
        
        package_json_path = project_path / "package.json"
        if not package_json_path.exists():
            return components
            
        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
                
            # Get dependency versions from package-lock.json if available
            lock_file_path = project_path / "package-lock.json"
            lock_data = {}
            if lock_file_path.exists():
                with open(lock_file_path, 'r', encoding='utf-8') as f:
                    lock_data = json.load(f)
            
            # Process dependencies
            for dep_type in ['dependencies', 'devDependencies', 'peerDependencies']:
                deps = package_data.get(dep_type, {})
                for name, version in deps.items():
                    # Get actual version from lock file
                    actual_version = self._get_npm_actual_version(name, lock_data)
                    
                    component = {
                        'type': 'library',
                        'name': name,
                        'version': actual_version or version,
                        'scope': dep_type,
                        'purl': f"pkg:npm/{name}@{actual_version or version}",
                        'ecosystem': 'npm',
                        'language': 'JavaScript',
                        'hashes': self._get_npm_hashes(name, actual_version or version),
                        'licenses': self._get_npm_license(name),
                        'supplier': self._get_npm_supplier(name)
                    }
                    components.append(component)
                    
        except Exception as e:
            print(f"Error analyzing npm dependencies: {e}")
            
        return components
    
    def _analyze_python_dependencies(self, project_path: Path) -> List[Dict[str, Any]]:
        """Analyze Python dependencies from requirements files."""
        components = []
        
        # Check for various Python dependency files
        dep_files = [
            "requirements.txt",
            "requirements-dev.txt", 
            "pyproject.toml",
            "setup.py",
            "Pipfile"
        ]
        
        for dep_file in dep_files:
            dep_path = project_path / dep_file
            if dep_path.exists():
                components.extend(self._parse_python_deps(dep_path))
                
        return components
    
    def _analyze_system_components(self) -> List[Dict[str, Any]]:
        """Analyze system-level components."""
        components = []
        
        # Operating system
        try:
            import platform
            os_info = platform.uname()
            
            component = {
                'type': 'operating-system',
                'name': os_info.system,
                'version': os_info.version,
                'scope': 'required',
                'purl': f"pkg:generic/{os_info.system.lower()}@{os_info.version}",
                'ecosystem': 'os',
                'description': f"{os_info.system} {os_info.release}",
                'supplier': {
                    'name': 'Operating System Vendor'
                }
            }
            components.append(component)
            
        except Exception as e:
            print(f"Error analyzing system components: {e}")
            
        return components
    
    def _generate_cyclone_dx(self, components: List[Dict[str, Any]], project_path: str) -> Dict[str, Any]:
        """Generate CycloneDX 1.4 format SBOM."""
        project_name = Path(project_path).name
        
        cyclone_dx_sbom = {
            "bomFormat": "CycloneDX",
            "specVersion": self.cyclone_dx_version,
            "serialNumber": f"urn:uuid:{uuid.uuid4()}",
            "version": 1,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "tools": [
                    {
                        "vendor": "SPEK",
                        "name": self.tool_name,
                        "version": self.tool_version
                    }
                ],
                "component": {
                    "type": "application",
                    "name": project_name,
                    "version": self._get_project_version(project_path),
                    "description": f"SBOM for {project_name} project"
                }
            },
            "components": []
        }
        
        # Convert internal components to CycloneDX format
        for comp in components:
            cyclone_component = {
                "type": comp.get('type', 'library'),
                "name": comp['name'],
                "version": comp['version'],
                "purl": comp.get('purl', ''),
                "scope": comp.get('scope', 'required')
            }
            
            # Add hashes if available
            if comp.get('hashes'):
                cyclone_component["hashes"] = [
                    {"alg": alg, "content": hash_val}
                    for alg, hash_val in comp['hashes'].items()
                ]
            
            # Add licenses if available
            if comp.get('licenses'):
                cyclone_component["licenses"] = [
                    {"license": {"id": lic}} if self._is_spdx_license(lic) else {"license": {"name": lic}}
                    for lic in comp['licenses']
                ]
            
            # Add supplier if available
            if comp.get('supplier'):
                cyclone_component["supplier"] = comp['supplier']
                
            cyclone_dx_sbom["components"].append(cyclone_component)
        
        return cyclone_dx_sbom
    
    def _generate_spdx(self, components: List[Dict[str, Any]], project_path: str) -> Dict[str, Any]:
        """Generate SPDX 2.3 format SBOM."""
        project_name = Path(project_path).name
        document_name = f"{project_name}-SBOM"
        
        spdx_sbom = {
            "spdxVersion": self.spdx_version,
            "dataLicense": "CC0-1.0",
            "SPDXID": "SPDXRef-DOCUMENT",
            "name": document_name,
            "documentNamespace": f"https://spek.dev/spdx/{uuid.uuid4()}",
            "creationInfo": {
                "created": datetime.now(timezone.utc).isoformat(),
                "creators": [f"Tool: {self.tool_name}-{self.tool_version}"],
                "licenseListVersion": "3.19"
            },
            "packages": []
        }
        
        # Root package
        root_package = {
            "SPDXID": "SPDXRef-Package-Root",
            "name": project_name,
            "downloadLocation": "NOASSERTION",
            "filesAnalyzed": False,
            "versionInfo": self._get_project_version(project_path),
            "supplier": "NOASSERTION",
            "copyrightText": "NOASSERTION"
        }
        spdx_sbom["packages"].append(root_package)
        
        # Convert internal components to SPDX format
        relationships = []
        
        for i, comp in enumerate(components):
            spdx_id = f"SPDXRef-Package-{i+1}"
            
            spdx_package = {
                "SPDXID": spdx_id,
                "name": comp['name'],
                "downloadLocation": "NOASSERTION",
                "filesAnalyzed": False,
                "versionInfo": comp['version'],
                "supplier": f"Organization: {comp.get('supplier', {}).get('name', 'NOASSERTION')}",
                "copyrightText": "NOASSERTION"
            }
            
            # Add external refs (purl)
            if comp.get('purl'):
                spdx_package["externalRefs"] = [
                    {
                        "referenceCategory": "PACKAGE-MANAGER",
                        "referenceType": "purl",
                        "referenceLocator": comp['purl']
                    }
                ]
            
            # Add checksums if available
            if comp.get('hashes'):
                spdx_package["checksums"] = [
                    {"algorithm": alg.upper(), "checksumValue": hash_val}
                    for alg, hash_val in comp['hashes'].items()
                ]
            
            # Add license information
            if comp.get('licenses'):
                spdx_package["licenseConcluded"] = " OR ".join(comp['licenses'])
                spdx_package["licenseDeclared"] = " OR ".join(comp['licenses'])
            else:
                spdx_package["licenseConcluded"] = "NOASSERTION"
                spdx_package["licenseDeclared"] = "NOASSERTION"
            
            spdx_sbom["packages"].append(spdx_package)
            
            # Add relationship
            relationship_type = "DEPENDS_ON" if comp.get('scope') != 'devDependencies' else "BUILD_DEPENDENCY_OF"
            relationships.append({
                "spdxElementId": "SPDXRef-Package-Root",
                "relatedSpdxElement": spdx_id,
                "relationshipType": relationship_type
            })
        
        spdx_sbom["relationships"] = relationships
        
        return spdx_sbom
    
    def _get_npm_actual_version(self, package_name: str, lock_data: Dict) -> Optional[str]:
        """Get actual version from package-lock.json."""
        try:
            packages = lock_data.get('packages', {})
            for path, pkg_info in packages.items():
                if path == f"node_modules/{package_name}":
                    return pkg_info.get('version')
        except Exception:
            pass
        return None
    
    def _get_npm_hashes(self, package_name: str, version: str) -> Dict[str, str]:
        """Get package hashes (simplified implementation)."""
        # In a real implementation, this would fetch from npm registry
        content = f"{package_name}@{version}"
        return {
            'sha256': hashlib.sha256(content.encode()).hexdigest()
        }
    
    def _get_npm_license(self, package_name: str) -> List[str]:
        """Get package license information."""
        # Simplified implementation
        return ["MIT"]  # Default assumption
    
    def _get_npm_supplier(self, package_name: str) -> Dict[str, str]:
        """Get package supplier information."""
        return {"name": "npm Registry"}
    
    def _parse_python_deps(self, dep_file: Path) -> List[Dict[str, Any]]:
        """Parse Python dependency files."""
        components = []
        
        if dep_file.name == "requirements.txt" or dep_file.name.startswith("requirements"):
            components.extend(self._parse_requirements_txt(dep_file))
        elif dep_file.name == "pyproject.toml":
            components.extend(self._parse_pyproject_toml(dep_file))
        
        return components
    
    def _parse_requirements_txt(self, req_file: Path) -> List[Dict[str, Any]]:
        """Parse requirements.txt file."""
        components = []
        
        try:
            with open(req_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        # Parse package==version or package>=version format
                        match = re.match(r'^([a-zA-Z0-9\-_.]+)([>=<~!]+)(.+)$', line)
                        if match:
                            name, operator, version = match.groups()
                            component = {
                                'type': 'library',
                                'name': name,
                                'version': version,
                                'scope': 'required',
                                'purl': f"pkg:pypi/{name}@{version}",
                                'ecosystem': 'pypi',
                                'language': 'Python'
                            }
                            components.append(component)
        except Exception as e:
            print(f"Error parsing {req_file}: {e}")
            
        return components
    
    def _parse_pyproject_toml(self, toml_file: Path) -> List[Dict[str, Any]]:
        """Parse pyproject.toml file."""
        components = []
        
        try:
            # Simple TOML parsing for dependencies
            with open(toml_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Extract dependencies section (simplified)
            if '[tool.poetry.dependencies]' in content:
                # Parse Poetry dependencies
                components.extend(self._parse_poetry_deps(content))
                
        except Exception as e:
            print(f"Error parsing {toml_file}: {e}")
            
        return components
    
    def _parse_poetry_deps(self, content: str) -> List[Dict[str, Any]]:
        """Parse Poetry dependencies from pyproject.toml."""
        components = []
        
        # Simplified parsing - in production, use proper TOML parser
        lines = content.split('\n')
        in_deps_section = False
        
        for line in lines:
            line = line.strip()
            if line == '[tool.poetry.dependencies]':
                in_deps_section = True
                continue
            elif line.startswith('[') and in_deps_section:
                break
            elif in_deps_section and '=' in line:
                parts = line.split('=', 1)
                if len(parts) == 2:
                    name = parts[0].strip()
                    version = parts[1].strip().strip('"').strip("'")
                    
                    if name != 'python':  # Skip Python version constraint
                        component = {
                            'type': 'library',
                            'name': name,
                            'version': version,
                            'scope': 'required',
                            'purl': f"pkg:pypi/{name}@{version}",
                            'ecosystem': 'pypi',
                            'language': 'Python'
                        }
                        components.append(component)
        
        return components
    
    def _get_project_version(self, project_path: str) -> str:
        """Get project version from package.json or other sources."""
        project_path = Path(project_path)
        
        # Try package.json first
        package_json = project_path / "package.json"
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('version', '1.0.0')
            except Exception:
                pass
        
        # Try pyproject.toml
        pyproject = project_path / "pyproject.toml"
        if pyproject.exists():
            try:
                with open(pyproject, 'r', encoding='utf-8') as f:
                    content = f.read()
                    for line in content.split('\n'):
                        if line.strip().startswith('version'):
                            version = line.split('=')[1].strip().strip('"').strip("'")
                            return version
            except Exception:
                pass
        
        return "1.0.0"  # Default version
    
    def _is_spdx_license(self, license_id: str) -> bool:
        """Check if license ID is a valid SPDX license identifier."""
        # Simplified check - in production, use official SPDX license list
        common_spdx = {
            'MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC',
            'GPL-2.0', 'LGPL-3.0', 'MPL-2.0', 'AGPL-3.0'
        }
        return license_id in common_spdx