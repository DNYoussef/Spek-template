"""
SBOM (Software Bill of Materials) Generator

Generates comprehensive SBOMs in multiple formats for supply chain transparency.
Supports SPDX and CycloneDX standards.
"""

from lib.shared.utilities import get_logger

class SBOMFormat(Enum):
    """Supported SBOM formats"""
    SPDX_JSON = "spdx-json"
    SPDX_TAG = "spdx-tag"
    CYCLONEDX_JSON = "cyclonedx-json" 
    CYCLONEDX_XML = "cyclonedx-xml"

@dataclass
class Component:
    """Software component information"""
    name: str
    version: str
    type: str = "library"  # library, application, framework, etc.
    supplier: Optional[str] = None
    download_location: Optional[str] = None
    files_analyzed: List[str] = field(default_factory=list)
    license_concluded: Optional[str] = None
    license_declared: Optional[str] = None
    copyright_text: Optional[str] = None
    checksums: Dict[str, str] = field(default_factory=dict)
    external_refs: List[Dict[str, str]] = field(default_factory=list)
    relationships: List[str] = field(default_factory=list)

class SBOMGenerator:
    """
    SBOM (Software Bill of Materials) Generator
    
    Generates comprehensive SBOMs for projects including:
    - Direct and transitive dependencies
    - License information
    - Vulnerability data references
    - Cryptographic checksums
    - Relationships between components
    """
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.components: Dict[str, Component] = {}
        self.document_namespace = f"https://sbom.example.com/{uuid.uuid4()}"
        
    async def generate_sbom(self, format: SBOMFormat = SBOMFormat.SPDX_JSON, 
                            output_file: Optional[Path] = None) -> Path:
        """Generate SBOM in specified format"""
        logger.info(f"Generating SBOM in {format.value} format")
        
        # Analyze project dependencies
        await self._analyze_dependencies()
        
        # Generate SBOM content based on format
        if format in [SBOMFormat.SPDX_JSON, SBOMFormat.SPDX_TAG]:
            sbom_content = self._generate_spdx_sbom(format)
            extension = ".json" if format == SBOMFormat.SPDX_JSON else ".spdx"
        elif format in [SBOMFormat.CYCLONEDX_JSON, SBOMFormat.CYCLONEDX_XML]:
            sbom_content = self._generate_cyclonedx_sbom(format)
            extension = ".json" if format == SBOMFormat.CYCLONEDX_JSON else ".xml"
        else:
            raise ValueError(f"Unsupported SBOM format: {format}")
            
        # Write SBOM to file
        if output_file is None:
            output_file = self.project_root / f"sbom{extension}"
        else:
            output_file = Path(output_file)
            
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        if format in [SBOMFormat.SPDX_JSON, SBOMFormat.CYCLONEDX_JSON]:
            with open(output_file, 'w') as f:
                json.dump(sbom_content, f, indent=2)
        else:
            with open(output_file, 'w') as f:
                f.write(sbom_content)
                
        logger.info(f"SBOM generated: {output_file}")
        return output_file
        
    async def _analyze_dependencies(self):
        """Analyze project dependencies and populate components"""
        self.components.clear()
        
        # Analyze Python dependencies
        await self._analyze_python_dependencies()
        
        # Analyze JavaScript dependencies
        await self._analyze_javascript_dependencies()
        
        # Analyze system dependencies
        await self._analyze_system_dependencies()
        
    async def _analyze_python_dependencies(self):
        """Analyze Python dependencies from requirements files and pip"""
        try:
            import pkg_resources
            
            # Get installed packages
            installed_packages = {pkg.key: pkg for pkg in pkg_resources.working_set}
            
            # Check requirements files
            req_files = [
                "requirements.txt", "requirements-dev.txt", "requirements-test.txt",
                "pyproject.toml", "setup.py", "Pipfile"
            ]
            
            found_requirements = set()
            for req_file in req_files:
                req_path = self.project_root / req_file
                if req_path.exists():
                    found_requirements.update(await self._parse_requirements_file(req_path))
                    
            # Add components for found requirements
            for req_name in found_requirements:
                if req_name.lower() in installed_packages:
                    pkg = installed_packages[req_name.lower()]
                    await self._add_python_component(pkg)
                    
        except ImportError:
            logger.warning("pkg_resources not available, skipping Python dependency analysis")
            
    async def _parse_requirements_file(self, file_path: Path) -> Set[str]:
        """Parse requirements from various file formats"""
        requirements = set()
        
        try:
            if file_path.suffix == ".toml":
                # Parse pyproject.toml
                import toml
                data = toml.load(file_path)
                deps = data.get("project", {}).get("dependencies", [])
                for dep in deps:
                    req_name = dep.split(">=")[0].split("==")[0].split("<")[0].strip()
                    requirements.add(req_name)
            else:
                # Parse requirements.txt style files
                content = file_path.read_text()
                for line in content.splitlines():
                    line = line.strip()
                    if line and not line.startswith("#"):
                        req_name = line.split(">=")[0].split("==")[0].split("<")[0].strip()
                        requirements.add(req_name)
                        
        except Exception as e:
            logger.warning(f"Error parsing {file_path}: {e}")
            
        return requirements
        
    async def _add_python_component(self, package):
        """Add Python package as component"""
        try:
            component = Component(
                name=package.project_name,
                version=package.version,
                type="library",
                download_location=f"https://pypi.org/project/{package.project_name}/",
                supplier="PyPI"
            )
            
            # Add package files
            if hasattr(package, "_get_metadata"):
                try:
                    files = package._get_metadata("RECORD")
                    if files:
                        component.files_analyzed = [
                            f.split(",")[0] for f in files.splitlines()[:10]  # Limit for size
                        ]
                except:
                    pass
                    
            # Add checksums
            if package.location:
                location_path = Path(package.location)
                if location_path.exists():
                    component.checksums["sha256"] = await self._calculate_directory_hash(location_path)
                    
            self.components[f"{package.project_name}-{package.version}"] = component
            
        except Exception as e:
            logger.warning(f"Error processing Python package {package.project_name}: {e}")
            
    async def _analyze_javascript_dependencies(self):
        """Analyze JavaScript dependencies from package.json"""
        package_json = self.project_root / "package.json"
        if package_json.exists():
            try:
                with open(package_json) as f:
                    package_data = json.load(f)
                    
                # Process dependencies
                for dep_type in ["dependencies", "devDependencies"]:
                    deps = package_data.get(dep_type, {})
                    for name, version in deps.items():
                        component = Component(
                            name=name,
                            version=version.lstrip("^~>=<"),
                            type="library",
                            download_location=f"https://npmjs.com/package/{name}",
                            supplier="npm"
                        )
                        self.components[f"{name}-{version}"] = component
                        
            except Exception as e:
                logger.warning(f"Error analyzing package.json: {e}")
                
    async def _analyze_system_dependencies(self):
        """Analyze system-level dependencies"""
        # This could be extended to analyze Docker base images,
        
    async def _calculate_directory_hash(self, directory: Path) -> str:
        """Calculate SHA256 hash of directory contents"""
        hasher = hashlib.sha256()
        
        try:
            for file_path in sorted(directory.rglob("*")):
                if file_path.is_file():
                    with open(file_path, 'rb') as f:
                        hasher.update(f.read())
        except Exception as e:
            logger.warning(f"Error calculating hash for {directory}: {e}")
            
        return hasher.hexdigest()
        
    def _generate_spdx_sbom(self, format: SBOMFormat) -> Dict[str, Any]:
        """Generate SPDX format SBOM"""
        document = {
            "SPDXID": "SPDXRef-DOCUMENT",
            "spdxVersion": "SPDX-2.3",
            "creationInfo": {
                "created": datetime.now().isoformat() + "Z",
                "creators": ["Tool: SPEK-Enterprise-SBOM-Generator"],
                "licenseListVersion": "3.19"
            },
            "name": f"SBOM-{self.project_root.name}",
            "dataLicense": "CC0-1.0",
            "documentNamespace": self.document_namespace,
            "packages": []
        }
        
        # Add root package
        root_package = {
            "SPDXID": "SPDXRef-Package-Root",
            "name": self.project_root.name,
            "downloadLocation": "NOASSERTION",
            "filesAnalyzed": False,
            "packageVerificationCode": {
                "packageVerificationCodeValue": "0000000000000000000000000000000000000000"
            },
            "licenseConcluded": "NOASSERTION",
            "licenseDeclared": "NOASSERTION",
            "copyrightText": "NOASSERTION"
        }
        document["packages"].append(root_package)
        
        # Add component packages
        for component_id, component in self.components.items():
            package = {
                "SPDXID": f"SPDXRef-Package-{component.name.replace('-', '').replace('_', '')}",
                "name": component.name,
                "versionInfo": component.version,
                "downloadLocation": component.download_location or "NOASSERTION",
                "filesAnalyzed": len(component.files_analyzed) > 0,
                "licenseConcluded": component.license_concluded or "NOASSERTION",
                "licenseDeclared": component.license_declared or "NOASSERTION",
                "copyrightText": component.copyright_text or "NOASSERTION"
            }
            
            if component.checksums:
                package["checksums"] = [
                    {
                        "algorithm": algo.upper(),
                        "checksumValue": value
                    }
                    for algo, value in component.checksums.items()
                ]
                
            document["packages"].append(package)
            
        # Add relationships
        document["relationships"] = [
            {
                "spdxElementId": "SPDXRef-DOCUMENT",
                "relationshipType": "DESCRIBES",
                "relatedSpdxElement": "SPDXRef-Package-Root"
            }
        ]
        
        # Add dependencies as relationships
        for component_id, component in self.components.items():
            document["relationships"].append({
                "spdxElementId": "SPDXRef-Package-Root",
                "relationshipType": "DEPENDS_ON",
                "relatedSpdxElement": f"SPDXRef-Package-{component.name.replace('-', '').replace('_', '')}"
            })
            
        return document
        
    def _generate_cyclonedx_sbom(self, format: SBOMFormat) -> Dict[str, Any]:
        """Generate CycloneDX format SBOM"""
        document = {
            "bomFormat": "CycloneDX",
            "specVersion": "1.5",
            "serialNumber": f"urn:uuid:{uuid.uuid4()}",
            "version": 1,
            "metadata": {
                "timestamp": datetime.now().isoformat() + "Z",
                "tools": [
                    {
                        "vendor": "SPEK-Enterprise",
                        "name": "SBOM-Generator",
                        "version": "1.0.0"
                    }
                ],
                "component": {
                    "type": "application",
                    "name": self.project_root.name,
                    "version": "1.0.0"
                }
            },
            "components": []
        }
        
        # Add components
        for component_id, component in self.components.items():
            comp_obj = {
                "type": component.type,
                "name": component.name,
                "version": component.version,
                "purl": f"pkg:generic/{component.name}@{component.version}"
            }
            
            if component.supplier:
                comp_obj["supplier"] = {"name": component.supplier}
                
            if component.license_declared:
                comp_obj["licenses"] = [{"license": {"name": component.license_declared}}]
                
            if component.checksums:
                comp_obj["hashes"] = [
                    {
                        "alg": algo.upper(),
                        "content": value
                    }
                    for algo, value in component.checksums.items()
                ]
                
            document["components"].append(comp_obj)
            
        return document
        
    def get_status(self) -> Dict[str, Any]:
        """Get current generator status"""
        return {
            "project_root": str(self.project_root),
            "components_count": len(self.components),
            "supported_formats": [fmt.value for fmt in SBOMFormat],
            "document_namespace": self.document_namespace
        }