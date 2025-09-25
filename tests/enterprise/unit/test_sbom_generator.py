"""
Comprehensive Unit Tests for SBOM Generator

Tests all functionality of the Software Bill of Materials generator including:
- SPDX and CycloneDX format generation
- Dependency analysis (Python, JavaScript, system)
- Component discovery and metadata collection
- Checksum calculation and security validation
- Error handling and edge cases
"""

from datetime import datetime
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock, MagicMock
import hashlib
import json
import tempfile

import asyncio
import pytest

# Import the modules under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent.parent / 'src'))

from enterprise.security.sbom_generator import (
    SBOMGenerator, Component, SBOMFormat
)

class TestComponent:
    """Test Component dataclass"""
    
    def test_component_creation_minimal(self):
        """Test basic component creation with minimal data"""
        component = Component(
            name="test-package",
            version="1.0.0"
        )
        
        assert component.name == "test-package"
        assert component.version == "1.0.0"
        assert component.type == "library"  # Default
        assert component.supplier is None
        assert component.download_location is None
        assert component.files_analyzed == []
        assert component.license_concluded is None
        assert component.license_declared is None
        assert component.copyright_text is None
        assert component.checksums == {}
        assert component.external_refs == []
        assert component.relationships == []
        
    def test_component_creation_full(self):
        """Test component creation with full data"""
        component = Component(
            name="full-package",
            version="2.1.0",
            type="application",
            supplier="Test Supplier",
            download_location="https://example.com/package",
            files_analyzed=["file1.py", "file2.py"],
            license_concluded="MIT",
            license_declared="MIT",
            copyright_text="Copyright 2023 Test",
            checksums={"sha256": "abc123"},
            external_refs=[{"type": "vcs", "url": "https://git.example.com"}],
            relationships=["DEPENDS_ON package-dep"]
        )
        
        assert component.name == "full-package"
        assert component.version == "2.1.0"
        assert component.type == "application"
        assert component.supplier == "Test Supplier"
        assert component.download_location == "https://example.com/package"
        assert len(component.files_analyzed) == 2
        assert component.license_concluded == "MIT"
        assert component.license_declared == "MIT"
        assert component.copyright_text == "Copyright 2023 Test"
        assert component.checksums["sha256"] == "abc123"
        assert len(component.external_refs) == 1
        assert len(component.relationships) == 1

class TestSBOMFormat:
    """Test SBOMFormat enum"""
    
    def test_sbom_format_values(self):
        """Test SBOM format enum values"""
        assert SBOMFormat.SPDX_JSON.value == "spdx-json"
        assert SBOMFormat.SPDX_TAG.value == "spdx-tag"
        assert SBOMFormat.CYCLONEDX_JSON.value == "cyclonedx-json"
        assert SBOMFormat.CYCLONEDX_XML.value == "cyclonedx-xml"

class TestSBOMGeneratorInitialization:
    """Test SBOM generator initialization"""
    
    def test_generator_initialization(self):
        """Test basic generator initialization"""
        with tempfile.TemporaryDirectory() as temp_dir:
            project_root = Path(temp_dir)
            generator = SBOMGenerator(project_root)
            
            assert generator.project_root == project_root
            assert isinstance(generator.components, dict)
            assert len(generator.components) == 0
            assert generator.document_namespace.startswith("https://sbom.example.com/")
            
    def test_generator_initialization_string_path(self):
        """Test generator initialization with string path"""
        with tempfile.TemporaryDirectory() as temp_dir:
            generator = SBOMGenerator(temp_dir)  # String path
            
            assert generator.project_root == Path(temp_dir)
            
class TestDependencyAnalysis:
    """Test dependency analysis functionality"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.project_root = Path(self.temp_dir.name)
        self.generator = SBOMGenerator(self.project_root)
        
    def teardown_method(self):
        """Cleanup after each test"""
        self.temp_dir.cleanup()
        
    @pytest.mark.asyncio
    async def test_analyze_dependencies_empty_project(self):
        """Test dependency analysis on empty project"""
        await self.generator._analyze_dependencies()
        
        assert len(self.generator.components) == 0
        
    @pytest.mark.asyncio
    async def test_analyze_python_dependencies_no_pkg_resources(self):
        """Test Python dependency analysis without pkg_resources"""
        with patch('enterprise.security.sbom_generator.pkg_resources', side_effect=ImportError):
            await self.generator._analyze_python_dependencies()
            
        # Should not crash, but no components found
        assert len(self.generator.components) == 0
        
    @pytest.mark.asyncio
    async def test_analyze_python_dependencies_with_requirements(self):
        """Test Python dependency analysis with requirements.txt"""
        # Create requirements.txt
        requirements_file = self.project_root / "requirements.txt"
        requirements_file.write_text("""
requests>=2.25.0
pytest==6.2.4
# This is a comment
numpy
scipy>=1.7.0,<2.0.0
""")
        
        # Mock pkg_resources
        mock_package = Mock()
        mock_package.project_name = "requests"
        mock_package.version = "2.25.1"
        mock_package.location = str(self.project_root / "venv" / "lib" / "requests")
        
        mock_working_set = {"requests": mock_package}
        
        with patch('enterprise.security.sbom_generator.pkg_resources') as mock_pkg_resources:
            mock_pkg_resources.working_set = [mock_package]
            
            await self.generator._analyze_python_dependencies()
            
        # Should find and add the requests package
        assert len(self.generator.components) >= 1
        requests_component = None
        for comp_id, comp in self.generator.components.items():
            if comp.name == "requests":
                requests_component = comp
                break
                
        assert requests_component is not None
        assert requests_component.version == "2.25.1"
        assert requests_component.type == "library"
        assert requests_component.supplier == "PyPI"
        
    @pytest.mark.asyncio
    async def test_analyze_python_dependencies_pyproject_toml(self):
        """Test Python dependency analysis with pyproject.toml"""
        # Create pyproject.toml
        pyproject_file = self.project_root / "pyproject.toml"
        pyproject_file.write_text("""
[project]
dependencies = [
    "requests>=2.25.0",
    "click>=8.0.0"
]
""")
        
        # Mock toml import and parsing
        with patch('enterprise.security.sbom_generator.toml') as mock_toml:
            mock_toml.load.return_value = {
                "project": {
                    "dependencies": ["requests>=2.25.0", "click>=8.0.0"]
                }
            }
            
            # Mock pkg_resources with empty working set
            with patch('enterprise.security.sbom_generator.pkg_resources') as mock_pkg_resources:
                mock_pkg_resources.working_set = []
                
                requirements = await self.generator._parse_requirements_file(pyproject_file)
                
        assert "requests" in requirements
        assert "click" in requirements
        
    @pytest.mark.asyncio
    async def test_analyze_javascript_dependencies(self):
        """Test JavaScript dependency analysis"""
        # Create package.json
        package_json = self.project_root / "package.json"
        package_json.write_text(json.dumps({
            "name": "test-project",
            "version": "1.0.0",
            "dependencies": {
                "express": "^4.17.1",
                "lodash": "~4.17.21"
            },
            "devDependencies": {
                "jest": "^27.0.0",
                "eslint": "^8.0.0"
            }
        }))
        
        await self.generator._analyze_javascript_dependencies()
        
        # Should find all dependencies
        assert len(self.generator.components) >= 4
        
        # Check for specific components
        component_names = [comp.name for comp in self.generator.components.values()]
        assert "express" in component_names
        assert "lodash" in component_names
        assert "jest" in component_names
        assert "eslint" in component_names
        
        # Verify component details
        express_component = None
        for comp in self.generator.components.values():
            if comp.name == "express":
                express_component = comp
                break
                
        assert express_component is not None
        assert express_component.version == "4.17.1"  # Should strip ^ prefix
        assert express_component.supplier == "npm"
        assert express_component.download_location == "https://npmjs.com/package/express"
        
    @pytest.mark.asyncio
    async def test_analyze_javascript_dependencies_malformed_json(self):
        """Test JavaScript dependency analysis with malformed JSON"""
        # Create malformed package.json
        package_json = self.project_root / "package.json"
        package_json.write_text("{ invalid json }")
        
        # Should not crash
        await self.generator._analyze_javascript_dependencies()
        assert len(self.generator.components) == 0
        
    @pytest.mark.asyncio
    async def test_parse_requirements_file_invalid_toml(self):
        """Test parsing invalid TOML requirements file"""
        toml_file = self.project_root / "pyproject.toml"
        toml_file.write_text("invalid toml content [[[")
        
        with patch('enterprise.security.sbom_generator.toml', side_effect=ImportError):
            requirements = await self.generator._parse_requirements_file(toml_file)
            
        assert len(requirements) == 0
        
    @pytest.mark.asyncio
    async def test_parse_requirements_file_complex_requirements(self):
        """Test parsing complex requirements file"""
        req_file = self.project_root / "requirements.txt"
        req_file.write_text("""
# Development dependencies
pytest>=6.0.0,<7.0.0
pytest-cov

# Production dependencies  
requests[security]>=2.25.0
django==3.2.13
psycopg2-binary

# VCS dependency
git+https://github.com/user/repo.git@v1.0#egg=custom-package

# Local dependency
-e ./local-package

# Requirements file inclusion
-r requirements-dev.txt
""")
        
        requirements = await self.generator._parse_requirements_file(req_file)
        
        assert "pytest" in requirements
        assert "pytest-cov" in requirements
        assert "requests" in requirements  # Should strip [security]
        assert "django" in requirements
        assert "psycopg2-binary" in requirements
        # VCS and local dependencies might be handled differently
        
    @pytest.mark.asyncio
    async def test_add_python_component_with_metadata(self):
        """Test adding Python component with metadata"""
        # Mock package with metadata
        mock_package = Mock()
        mock_package.project_name = "test-package"
        mock_package.version = "1.0.0"
        mock_package.location = str(self.project_root / "test-package")
        
        # Mock _get_metadata method
        mock_package._get_metadata = Mock(return_value="file1.py, hash1, size1\nfile2.py, hash2, size2")
        
        # Create location directory
        (self.project_root / "test-package").mkdir(exist_ok=True)
        
        await self.generator._add_python_component(mock_package)
        
        # Should have added component
        assert len(self.generator.components) == 1
        
        component_key = "test-package-1.0.0"
        assert component_key in self.generator.components
        
        component = self.generator.components[component_key]
        assert component.name == "test-package"
        assert component.version == "1.0.0"
        assert component.type == "library"
        assert component.supplier == "PyPI"
        assert len(component.files_analyzed) <= 10  # Limited to 10 files
        assert "sha256" in component.checksums
        
    @pytest.mark.asyncio
    async def test_add_python_component_error_handling(self):
        """Test Python component addition with errors"""
        # Mock package that raises exception
        mock_package = Mock()
        mock_package.project_name = "error-package"
        mock_package.version = "1.0.0"
        mock_package.location = None  # Will cause error
        
        # Should not crash
        await self.generator._add_python_component(mock_package)
        
        # No component should be added
        assert len(self.generator.components) == 0

class TestChecksumCalculation:
    """Test checksum calculation functionality"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.project_root = Path(self.temp_dir.name)
        self.generator = SBOMGenerator(self.project_root)
        
    def teardown_method(self):
        """Cleanup after each test"""
        self.temp_dir.cleanup()
        
    @pytest.mark.asyncio
    async def test_calculate_directory_hash_empty_directory(self):
        """Test hash calculation for empty directory"""
        empty_dir = self.project_root / "empty"
        empty_dir.mkdir()
        
        hash_value = await self.generator._calculate_directory_hash(empty_dir)
        
        # Should return a valid SHA256 hash (empty)
        assert len(hash_value) == 64  # SHA256 hex length
        assert all(c in '0123456789abcdef' for c in hash_value)
        
    @pytest.mark.asyncio
    async def test_calculate_directory_hash_with_files(self):
        """Test hash calculation for directory with files"""
        test_dir = self.project_root / "test_package"
        test_dir.mkdir()
        
        # Create test files
        (test_dir / "subdir").mkdir()
        
        hash_value = await self.generator._calculate_directory_hash(test_dir)
        
        # Should return a valid SHA256 hash
        assert len(hash_value) == 64
        assert all(c in '0123456789abcdef' for c in hash_value)
        
        # Same directory should produce same hash
        hash_value2 = await self.generator._calculate_directory_hash(test_dir)
        assert hash_value == hash_value2
        
    @pytest.mark.asyncio
    async def test_calculate_directory_hash_nonexistent(self):
        """Test hash calculation for nonexistent directory"""
        nonexistent = self.project_root / "does_not_exist"
        
        hash_value = await self.generator._calculate_directory_hash(nonexistent)
        
        # Should return empty hash or handle gracefully
        assert isinstance(hash_value, str)
        assert len(hash_value) == 64  # Still valid SHA256 format
        
    @pytest.mark.asyncio
    async def test_calculate_directory_hash_permission_error(self):
        """Test hash calculation with permission errors"""
        test_dir = self.project_root / "restricted"
        test_dir.mkdir()
        
        with patch('builtins.open', side_effect=PermissionError("Access denied")):
            hash_value = await self.generator._calculate_directory_hash(test_dir)
            
        # Should handle error gracefully
        assert isinstance(hash_value, str)
        assert len(hash_value) == 64

class TestSBOMGeneration:
    """Test SBOM generation in different formats"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.project_root = Path(self.temp_dir.name)
        self.generator = SBOMGenerator(self.project_root)
        
        # Add some test components
        self.generator.components["test-lib-1.0.0"] = Component(
            name="test-lib",
            version="1.0.0",
            type="library",
            supplier="PyPI",
            download_location="https://pypi.org/project/test-lib/",
            license_declared="MIT",
            checksums={"sha256": "abc123def456"}
        )
        
        self.generator.components["another-lib-2.1.0"] = Component(
            name="another-lib",
            version="2.1.0",
            type="library",
            supplier="npm",
            download_location="https://npmjs.com/package/another-lib",
            license_declared="Apache-2.0"
        )
        
    def teardown_method(self):
        """Cleanup after each test"""
        self.temp_dir.cleanup()
        
    @pytest.mark.asyncio
    async def test_generate_sbom_spdx_json(self):
        """Test SPDX JSON SBOM generation"""
        output_file = await self.generator.generate_sbom(
            format=SBOMFormat.SPDX_JSON,
            output_file=self.project_root / "test.spdx.json"
        )
        
        assert output_file.exists()
        assert output_file.suffix == ".json"
        
        # Validate JSON content
        with open(output_file) as f:
            sbom_data = json.load(f)
            
        assert sbom_data["spdxVersion"] == "SPDX-2.3"
        assert sbom_data["dataLicense"] == "CC0-1.0"
        assert "documentNamespace" in sbom_data
        assert "creationInfo" in sbom_data
        assert "packages" in sbom_data
        
        # Should have root package + components
        assert len(sbom_data["packages"]) == 3  # Root + 2 components
        
        # Verify root package
        root_package = next(pkg for pkg in sbom_data["packages"] if pkg["SPDXID"] == "SPDXRef-Package-Root")
        assert root_package["name"] == self.project_root.name
        
        # Verify component packages
        test_lib_package = next(pkg for pkg in sbom_data["packages"] if "testlib" in pkg["SPDXID"])
        assert test_lib_package["name"] == "test-lib"
        assert test_lib_package["versionInfo"] == "1.0.0"
        assert test_lib_package["licenseDeclared"] == "MIT"
        
        # Verify relationships
        assert "relationships" in sbom_data
        assert len(sbom_data["relationships"]) >= 3  # DESCRIBES + 2 DEPENDS_ON
        
    @pytest.mark.asyncio
    async def test_generate_sbom_cyclonedx_json(self):
        """Test CycloneDX JSON SBOM generation"""
        output_file = await self.generator.generate_sbom(
            format=SBOMFormat.CYCLONEDX_JSON,
            output_file=self.project_root / "test.cyclonedx.json"
        )
        
        assert output_file.exists()
        assert output_file.suffix == ".json"
        
        # Validate JSON content
        with open(output_file) as f:
            sbom_data = json.load(f)
            
        assert sbom_data["bomFormat"] == "CycloneDX"
        assert sbom_data["specVersion"] == "1.5"
        assert "serialNumber" in sbom_data
        assert "metadata" in sbom_data
        assert "components" in sbom_data
        
        # Verify metadata
        metadata = sbom_data["metadata"]
        assert "timestamp" in metadata
        assert "tools" in metadata
        assert metadata["component"]["name"] == self.project_root.name
        
        # Verify components
        components = sbom_data["components"]
        assert len(components) == 2
        
        test_lib_comp = next(comp for comp in components if comp["name"] == "test-lib")
        assert test_lib_comp["version"] == "1.0.0"
        assert test_lib_comp["type"] == "library"
        assert "pkg:generic/test-lib@1.0.0" in test_lib_comp["purl"]
        
    @pytest.mark.asyncio
    async def test_generate_sbom_spdx_tag(self):
        """Test SPDX tag-value format generation"""
        output_file = await self.generator.generate_sbom(
            format=SBOMFormat.SPDX_TAG,
            output_file=self.project_root / "test.spdx"
        )
        
        assert output_file.exists()
        assert output_file.suffix == ".spdx"
        
        # Validate tag-value content
        content = output_file.read_text()
        assert "SPDXVersion: SPDX-2.3" in content
        assert "DataLicense: CC0-1.0" in content
        assert "DocumentNamespace:" in content
        assert "PackageName: test-lib" in content
        
    @pytest.mark.asyncio
    async def test_generate_sbom_cyclonedx_xml(self):
        """Test CycloneDX XML format generation"""
        output_file = await self.generator.generate_sbom(
            format=SBOMFormat.CYCLONEDX_XML,
            output_file=self.project_root / "test.cyclonedx.xml"
        )
        
        assert output_file.exists()
        assert output_file.suffix == ".xml"
        
        # Validate XML content (basic check)
        content = output_file.read_text()
        assert '<?xml version="1.0" encoding="UTF-8"?>' in content or "<bom" in content
        
    @pytest.mark.asyncio
    async def test_generate_sbom_default_output_file(self):
        """Test SBOM generation with default output file"""
        output_file = await self.generator.generate_sbom(format=SBOMFormat.SPDX_JSON)
        
        expected_path = self.project_root / "sbom.json"
        assert output_file == expected_path
        assert output_file.exists()
        
    @pytest.mark.asyncio
    async def test_generate_sbom_unsupported_format(self):
        """Test SBOM generation with unsupported format"""
        # Create mock unsupported format
        with patch.object(SBOMFormat, 'UNSUPPORTED', "unsupported", create=True):
            with pytest.raises(ValueError, match="Unsupported SBOM format"):
                await self.generator.generate_sbom(format=SBOMFormat.UNSUPPORTED)
                
    @pytest.mark.asyncio
    async def test_generate_sbom_creates_output_directory(self):
        """Test SBOM generation creates output directory if needed"""
        nested_output = self.project_root / "nested" / "dir" / "sbom.json"
        
        output_file = await self.generator.generate_sbom(
            format=SBOMFormat.SPDX_JSON,
            output_file=nested_output
        )
        
        assert output_file.exists()
        assert output_file.parent.exists()

class TestSPDXGeneration:
    """Test SPDX format generation details"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.generator = SBOMGenerator(Path("/tmp/test"))
        
    def test_generate_spdx_sbom_minimal(self):
        """Test SPDX SBOM generation with minimal components"""
        sbom_data = self.generator._generate_spdx_sbom(SBOMFormat.SPDX_JSON)
        
        # Basic structure validation
        assert sbom_data["SPDXID"] == "SPDXRef-DOCUMENT"
        assert sbom_data["spdxVersion"] == "SPDX-2.3"
        assert sbom_data["dataLicense"] == "CC0-1.0"
        assert "creationInfo" in sbom_data
        assert "documentNamespace" in sbom_data
        assert "packages" in sbom_data
        assert "relationships" in sbom_data
        
        # Creation info validation
        creation_info = sbom_data["creationInfo"]
        assert "created" in creation_info
        assert "Tool: SPEK-Enterprise-SBOM-Generator" in creation_info["creators"]
        
    def test_generate_spdx_sbom_with_components(self):
        """Test SPDX SBOM generation with components"""
        # Add test component
        self.generator.components["comp-1.0"] = Component(
            name="test-component",
            version="1.0",
            type="library",
            supplier="TestSupplier", 
            download_location="https://example.com/comp",
            license_concluded="MIT",
            license_declared="MIT",
            copyright_text="Copyright 2023",
            checksums={"sha256": "abc123", "md5": "def456"},
            files_analyzed=["file1.py", "file2.py"]
        )
        
        sbom_data = self.generator._generate_spdx_sbom(SBOMFormat.SPDX_JSON)
        
        # Find the component package
        comp_package = None
        for pkg in sbom_data["packages"]:
            if pkg.get("name") == "test-component":
                comp_package = pkg
                break
                
        assert comp_package is not None
        assert comp_package["versionInfo"] == "1.0"
        assert comp_package["downloadLocation"] == "https://example.com/comp"
        assert comp_package["licenseConcluded"] == "MIT"
        assert comp_package["licenseDeclared"] == "MIT" 
        assert comp_package["copyrightText"] == "Copyright 2023"
        assert comp_package["filesAnalyzed"] is True
        
        # Check checksums
        assert "checksums" in comp_package
        checksums = comp_package["checksums"]
        assert len(checksums) == 2
        
        sha256_checksum = next(c for c in checksums if c["algorithm"] == "SHA256")
        assert sha256_checksum["checksumValue"] == "abc123"
        
        # Verify relationships include this component
        depends_on_rels = [r for r in sbom_data["relationships"] 
                            if r["relationshipType"] == "DEPENDS_ON"]
        assert len(depends_on_rels) >= 1

class TestCycloneDXGeneration:
    """Test CycloneDX format generation details"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.generator = SBOMGenerator(Path("/tmp/test"))
        
    def test_generate_cyclonedx_sbom_minimal(self):
        """Test CycloneDX SBOM generation with minimal components"""
        sbom_data = self.generator._generate_cyclonedx_sbom(SBOMFormat.CYCLONEDX_JSON)
        
        # Basic structure validation
        assert sbom_data["bomFormat"] == "CycloneDX"
        assert sbom_data["specVersion"] == "1.5"
        assert "serialNumber" in sbom_data
        assert sbom_data["version"] == 1
        assert "metadata" in sbom_data
        assert "components" in sbom_data
        
        # Metadata validation
        metadata = sbom_data["metadata"]
        assert "timestamp" in metadata
        assert "tools" in metadata
        assert "component" in metadata
        
        tool = metadata["tools"][0]
        assert tool["vendor"] == "SPEK-Enterprise"
        assert tool["name"] == "SBOM-Generator"
        
    def test_generate_cyclonedx_sbom_with_components(self):
        """Test CycloneDX SBOM generation with components"""
        # Add test component
        self.generator.components["comp-1.0"] = Component(
            name="test-component",
            version="1.0", 
            type="library",
            supplier="TestSupplier",
            license_declared="Apache-2.0",
            checksums={"sha256": "abc123", "md5": "def456"}
        )
        
        sbom_data = self.generator._generate_cyclonedx_sbom(SBOMFormat.CYCLONEDX_JSON)
        
        # Find the component
        components = sbom_data["components"]
        assert len(components) == 1
        
        component = components[0]
        assert component["name"] == "test-component"
        assert component["version"] == "1.0"
        assert component["type"] == "library"
        assert "pkg:generic/test-component@1.0" in component["purl"]
        
        # Check supplier
        assert "supplier" in component
        assert component["supplier"]["name"] == "TestSupplier"
        
        # Check license
        assert "licenses" in component
        assert len(component["licenses"]) == 1
        assert component["licenses"][0]["license"]["name"] == "Apache-2.0"
        
        # Check hashes
        assert "hashes" in component
        hashes = component["hashes"]
        assert len(hashes) == 2
        
        sha256_hash = next(h for h in hashes if h["alg"] == "SHA256")
        assert sha256_hash["content"] == "abc123"

class TestGeneratorStatus:
    """Test generator status and utility methods"""
    
    def test_get_status_empty_generator(self):
        """Test status with empty generator"""
        generator = SBOMGenerator(Path("/tmp/test"))
        status = generator.get_status()
        
        assert status["project_root"] == "/tmp/test"
        assert status["components_count"] == 0
        assert "supported_formats" in status
        assert len(status["supported_formats"]) == 4  # All SBOMFormat values
        assert "document_namespace" in status
        
        # Verify all formats are included
        formats = status["supported_formats"]
        assert "spdx-json" in formats
        assert "spdx-tag" in formats
        assert "cyclonedx-json" in formats
        assert "cyclonedx-xml" in formats
        
    def test_get_status_with_components(self):
        """Test status with components"""
        generator = SBOMGenerator(Path("/tmp/test"))
        
        # Add test components
        generator.components["comp1"] = Component("comp1", "1.0")
        generator.components["comp2"] = Component("comp2", "2.0") 
        generator.components["comp3"] = Component("comp3", "3.0")
        
        status = generator.get_status()
        
        assert status["components_count"] == 3
        assert status["project_root"] == "/tmp/test"

class TestErrorHandlingAndEdgeCases:
    """Test error handling and edge cases"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.project_root = Path(self.temp_dir.name)
        self.generator = SBOMGenerator(self.project_root)
        
    def teardown_method(self):
        """Cleanup after each test"""
        self.temp_dir.cleanup()
        
    @pytest.mark.asyncio
    async def test_generate_sbom_write_permission_error(self):
        """Test SBOM generation with write permission error"""
        # Try to write to read-only location (simulated)
        readonly_file = self.project_root / "readonly.json"
        
        with patch('builtins.open', side_effect=PermissionError("Access denied")):
            with pytest.raises(PermissionError):
                await self.generator.generate_sbom(
                    format=SBOMFormat.SPDX_JSON,
                    output_file=readonly_file
                )
                
    @pytest.mark.asyncio
    async def test_analyze_dependencies_with_exceptions(self):
        """Test dependency analysis with various exceptions"""
        # Mock methods to raise different exceptions
        with patch.object(self.generator, '_analyze_python_dependencies', side_effect=Exception("Python error")):
            with patch.object(self.generator, '_analyze_javascript_dependencies', side_effect=Exception("JS error")):
                with patch.object(self.generator, '_analyze_system_dependencies', side_effect=Exception("System error")):
                    
                    # Should not crash despite all methods failing
                    await self.generator._analyze_dependencies()
                    
                    # Components dict should still be valid
                    assert isinstance(self.generator.components, dict)
                    
    @pytest.mark.asyncio
    async def test_parse_requirements_file_with_various_formats(self):
        """Test parsing requirements files with various edge cases"""
        req_file = self.project_root / "edge_cases.txt"
        req_file.write_text("""
# Empty lines and comments should be ignored

# Package with extras
requests[security, socks]>=2.25.0

# Package with environment markers
pytest; python_version >= '3.6'

# URL dependencies
git+https://github.com/user/repo.git

# Editable installs
-e git+https://github.com/user/repo.git#egg=package

# Include other files
-r other-requirements.txt

# Package with complex version specifiers
package>=1.0,!=1.2,<2.0

""")
        
        requirements = await self.generator._parse_requirements_file(req_file)
        
        # Should extract package names properly
        assert "requests" in requirements
        assert "pytest" in requirements  
        assert "package" in requirements
        
    def test_component_with_unicode_names(self):
        """Test components with unicode names"""
        unicode_component = Component(
            name="",
            version="1.0.0",
            description="Unicode test package [ROCKET]",
            supplier=""
        )
        
        self.generator.components["unicode-test"] = unicode_component
        
        # Should handle unicode properly
        status = self.generator.get_status()
        assert status["components_count"] == 1
        
        # SPDX generation should handle unicode
        spdx_data = self.generator._generate_spdx_sbom(SBOMFormat.SPDX_JSON)
        assert isinstance(spdx_data, dict)
        
    def test_component_with_very_long_names(self):
        """Test components with very long names"""
        long_name = "very-" + "long-" * 100 + "package-name"
        long_component = Component(
            name=long_name,
            version="1.0.0"
        )
        
        self.generator.components["long-test"] = long_component
        
        # Should handle long names gracefully
        spdx_data = self.generator._generate_spdx_sbom(SBOMFormat.SPDX_JSON)
        cyclonedx_data = self.generator._generate_cyclonedx_sbom(SBOMFormat.CYCLONEDX_JSON)
        
        assert isinstance(spdx_data, dict)
        assert isinstance(cyclonedx_data, dict)
        
    @pytest.mark.asyncio
    async def test_empty_project_generates_valid_sbom(self):
        """Test that empty project generates valid SBOM"""
        output_file = await self.generator.generate_sbom(format=SBOMFormat.SPDX_JSON)
        
        assert output_file.exists()
        
        with open(output_file) as f:
            sbom_data = json.load(f)
            
        # Should have minimal valid SBOM structure
        assert "spdxVersion" in sbom_data
        assert "packages" in sbom_data
        assert len(sbom_data["packages"]) >= 1  # At least root package
        
    def test_namespace_generation_uniqueness(self):
        """Test that document namespaces are unique"""
        generator1 = SBOMGenerator(Path("/tmp/test1"))
        generator2 = SBOMGenerator(Path("/tmp/test2"))
        
        assert generator1.document_namespace != generator2.document_namespace
        
        # Both should be valid URLs
        assert generator1.document_namespace.startswith("https://sbom.example.com/")
        assert generator2.document_namespace.startswith("https://sbom.example.com/")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])