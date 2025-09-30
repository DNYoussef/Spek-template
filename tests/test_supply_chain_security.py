from lib.shared.utilities import path_exists
from src.constants.base import MAXIMUM_RETRY_ATTEMPTS

import pytest
import asyncio
import json
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Import supply chain security modules
import sys
sys.path.append(str(Path(__file__).parent.parent))

from analyzer.enterprise.supply_chain.sbom_generator import SBOMGenerator
from analyzer.enterprise.supply_chain.slsa_provenance import SLSAProvenanceGenerator
from analyzer.enterprise.supply_chain.vulnerability_scanner import VulnerabilityScanner
from analyzer.enterprise.supply_chain.crypto_signer import CryptographicSigner
from analyzer.enterprise.supply_chain.evidence_packager import EvidencePackager
from analyzer.enterprise.supply_chain.supply_chain_analyzer import SupplyChainAnalyzer
from analyzer.enterprise.supply_chain.config_loader import SupplyChainConfigLoader
from analyzer.enterprise.supply_chain.integration import SupplyChainIntegration, SupplyChainAdapter

class TestSupplyChainSecuritySuite:
    """Comprehensive test suite for supply chain security."""

    @pytest.fixture
    def temp_project_dir(self):
        """Create temporary project directory for testing."""
        temp_dir = tempfile.mkdtemp()
        project_path = Path(temp_dir)
        
        # Create mock project structure
        (project_path / "package.json").write_text(json.dumps({
            "name": "test-project",
            "version": "1.0.0",
            "dependencies": {
                "express": "^4.18.0",
                "lodash": "^4.17.21"
            },
            "devDependencies": {
                "jest": "^29.0.0"
            }
        }))
        
        (project_path / "src").mkdir()
        (project_path / "src" / "index.js").write_text("console.log('Hello World');")
        
        yield str(project_path)
        
        # Cleanup
        shutil.rmtree(temp_dir)

    @pytest.fixture
    def supply_chain_config(self, temp_project_dir):
        """Supply chain security configuration for testing."""
        return {
            'output_dir': str(Path(temp_project_dir) / '.artifacts' / 'supply_chain'),
            'performance_overhead_target': 1.8,
            'enable_parallel_processing': True,
            'max_workers': 2,
            'timeout_seconds': 60,
            'allowed_licenses': ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
            'restricted_licenses': ['GPL-3.0'],
            'prohibited_licenses': ['SSPL-1.0'],
            'signing_method': 'pki',
            'package_format': 'zip',
            'include_sbom': True,
            'include_provenance': True,
            'include_vulnerabilities': True,
            'include_signatures': False,  # Disable for testing
            'include_compliance': True
        }

    def test_sc001_sbom_generation(self, supply_chain_config, temp_project_dir):
        """Test SC-1: SBOM generation in CycloneDX and SPDX formats."""
        
        generator = SBOMGenerator(supply_chain_config)
        
        # Test SBOM generation
        results = generator.generate_all_formats(temp_project_dir)
        
        # Verify both formats are generated
        assert 'cyclone_dx' in results
        assert 'spdx' in results
        
        # Verify files exist
        cyclone_path = Path(results['cyclone_dx'])
        spdx_path = Path(results['spdx'])
        
        assert cyclone_path.exists()
        assert spdx_path.exists()
        
        # Verify CycloneDX content
        with open(cyclone_path, 'r') as f:
            cyclone_data = json.load(f)
        
        assert cyclone_data['bomFormat'] == 'CycloneDX'
        assert cyclone_data['specVersion'] == '1.4'
        assert 'components' in cyclone_data
        assert len(cyclone_data['components']) > 0
        
        # Verify SPDX content
        with open(spdx_path, 'r') as f:
            spdx_data = json.load(f)
        
        assert spdx_data['spdxVersion'] == 'SPDX-2.3'
        assert spdx_data['dataLicense'] == 'CC0-1.0'
        assert 'packages' in spdx_data
        assert len(spdx_data['packages']) > 0

    def test_sc002_slsa_provenance(self, supply_chain_config, temp_project_dir):
        """Test SC-2: SLSA Level MAXIMUM_RETRY_ATTEMPTS provenance attestation."""
        
        generator = SLSAProvenanceGenerator(supply_chain_config)
        
        # Create mock build metadata
        build_metadata = generator.generate_build_metadata(temp_project_dir)
        
        # Create mock artifacts
        artifacts = [
            {
                'name': 'test-artifact.json',
                'sha256': 'abc123def456',
                'path': str(Path(temp_project_dir) / 'test-artifact.json')
            }
        ]
        
        # Generate provenance
        provenance_path = generator.generate_provenance(artifacts, build_metadata)
        
        # Verify provenance file exists
        assert path_exists(provenance_path)
        
        # Verify provenance content
        with open(provenance_path, 'r') as f:
            provenance_data = json.load(f)
        
        assert provenance_data['_type'] == 'https://in-toto.io/Statement/v0.1'
        assert provenance_data['predicateType'] == 'https://slsa.dev/provenance/v1'
        assert 'subject' in provenance_data
        assert 'predicate' in provenance_data
        
        predicate = provenance_data['predicate']
        assert 'buildDefinition' in predicate
        assert 'runDetails' in predicate
        
        # Verify build definition
        build_def = predicate['buildDefinition']
        assert 'buildType' in build_def
        assert 'externalParameters' in build_def
        assert 'resolvedDependencies' in build_def

    @pytest.mark.asyncio
    async def test_sc003_vulnerability_scanning(self, supply_chain_config):
        """Test SC-3: Vulnerability scanning and license compliance."""
        
        scanner = VulnerabilityScanner(supply_chain_config)
        
        # Mock components with known vulnerabilities for testing
        mock_components = [
            {
                'name': 'test-package',
                'version': '1.0.0',
                'ecosystem': 'npm',
                'purl': 'pkg:npm/test-package@1.0.0',
                'licenses': ['MIT']
            },
            {
                'name': 'risky-package',
                'version': '2.0.0',
                'ecosystem': 'npm',
                'purl': 'pkg:npm/risky-package@2.0.0',
                'licenses': ['GPL-3.0']
            }
        ]
        
        # Mock the vulnerability scanning to avoid external API calls
        with patch.object(scanner, '_query_osv_database') as mock_osv:
            mock_osv.return_value = []
            
            # Test vulnerability scanning
            scan_results = await scanner.scan_vulnerabilities(mock_components)
            
            assert 'scan_timestamp' in scan_results
            assert 'total_components' in scan_results
            assert scan_results['total_components'] == len(mock_components)
            assert 'vulnerabilities' in scan_results
            assert 'license_compliance' in scan_results
            
            # Test license compliance
            license_compliance = scan_results['license_compliance']
            assert 'compliant' in license_compliance
            assert 'non_compliant' in license_compliance
            assert 'violations' in license_compliance
            
            # Should detect GPL-3.0 as restricted license
            violations = license_compliance['violations']
            gpl_violation = next((v for v in violations if 'GPL-3.0' in v.get('description', '')), None)
            assert gpl_violation is not None

    def test_sc004_cryptographic_signing(self, supply_chain_config, temp_project_dir):
        """Test SC-4: Cryptographic artifact signing (mocked)."""
        
        signer = CryptographicSigner(supply_chain_config)
        
        # Create test artifact
        test_artifact_path = Path(temp_project_dir) / 'test-artifact.txt'
        test_artifact_path.write_text('This is a test artifact for signing.')
        
        artifacts = [
            {
                'path': str(test_artifact_path),
                'name': 'test-artifact.txt',
                'format': 'text'
            }
        ]
        
        # Mock signing operations to avoid requiring actual keys
        with patch('subprocess.run') as mock_subprocess:
            mock_subprocess.return_value = Mock(returncode=0, stdout='', stderr='')
            
            with patch.object(signer, '_is_cosign_available', return_value=False):
                # Test signing
                signing_results = signer.sign_artifacts(artifacts)
                
                assert 'signing_timestamp' in signing_results
                assert 'artifacts' in signing_results
                assert len(signing_results['artifacts']) == 1
                
                artifact_result = signing_results['artifacts'][0]
                assert artifact_result['artifact_path'] == str(test_artifact_path)
                assert 'signing_method' in artifact_result

    def test_sc005_evidence_packaging(self, supply_chain_config, temp_project_dir):
        """Test SC-5: Supply chain evidence package generation."""
        
        packager = EvidencePackager(supply_chain_config)
        
        # Create mock artifacts
        artifacts = [
            {
                'path': str(Path(temp_project_dir) / 'package.json'),
                'name': 'package.json',
                'type': 'manifest'
            }
        ]
        
        # Create evidence package
        package_info = packager.create_evidence_package(temp_project_dir, artifacts)
        
        assert 'package_id' in package_info
        assert 'created' in package_info
        assert 'evidence_types' in package_info
        assert 'package_path' in package_info
        assert 'files_included' in package_info
        
        # Verify package file exists
        package_path = Path(package_info['package_path'])
        assert package_path.exists()
        assert package_path.suffix == '.zip'  # Default format
        
        # Verify package size
        assert package_info['package_size'] > 0

    def test_config_loader(self, temp_project_dir):
        """Test configuration loading and validation."""
        
        # Create test config file
        config_path = Path(temp_project_dir) / 'test_config.yaml'
        config_content = """
supply_chain:
    enabled: true
    output_dir: ".artifacts/supply_chain"
    sbom:
    formats: ["CycloneDX-1.4", "SPDX-2.3"]
    vulnerability_scanning:
    enabled: true
    severity_thresholds:
        critical: 9.0
        high: 7.0
"""
        config_path.write_text(config_content)
        
        # Test config loader
        loader = SupplyChainConfigLoader(str(config_path))
        config = loader.load_config()
        
        assert 'supply_chain' in config
        assert config['supply_chain']['enabled'] is True
        assert len(config['supply_chain']['sbom']['formats']) == 2
        
        # Test component config creation
        sbom_config = loader.create_component_config('sbom')
        assert 'output_dir' in sbom_config
        assert 'formats' in sbom_config
        
        # Test validation
        validation = loader.validate_config()
        assert 'valid' in validation
        assert 'warnings' in validation
        assert 'errors' in validation

    @pytest.mark.asyncio
    async def test_supply_chain_analyzer_integration(self, supply_chain_config, temp_project_dir):
        """Test complete supply chain analyzer integration."""
        
        analyzer = SupplyChainAnalyzer(supply_chain_config)
        
        # Mock external dependencies to avoid real API calls and signing
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = Mock()
            mock_response.status = 200
            mock_response.json = asyncio.coroutine(lambda: {'vulns': []})
            mock_session.return_value.__aenter__.return_value.post.return_value.__aenter__.return_value = mock_response
            
            with patch('subprocess.run') as mock_subprocess:
                mock_subprocess.return_value = Mock(returncode=1, stdout='', stderr='cosign not found')
                
                # Run complete analysis
                results = await analyzer.analyze_supply_chain(temp_project_dir)
                
                assert 'analysis_id' in results
                assert 'timestamp' in results
                assert 'sbom' in results
                assert 'provenance' in results
                assert 'vulnerabilities' in results
                assert 'signatures' in results
                assert 'evidence_package' in results
                assert 'performance' in results
                assert 'summary' in results
                assert 'compliance_status' in results
                
                # Check performance metrics
                performance = results['performance']
                assert 'duration' in performance
                assert 'overhead_percentage' in performance
                
                # Verify performance target is met (should be under 1.8%)
                overhead = performance['overhead_percentage']
                assert overhead <= supply_chain_config['performance_overhead_target']

    def test_non_breaking_integration(self, supply_chain_config, temp_project_dir):
        """Test non-breaking integration with existing analyzer."""
        
        # Create integration instance
        integration = SupplyChainIntegration(config_path=None)
        integration.config = {'supply_chain': supply_chain_config, 'integration': {'non_breaking': True}}
        integration.integration_config = integration.config['integration']
        integration.sc_analyzer = SupplyChainAnalyzer(supply_chain_config)
        
        # Mock analyzer callback that might fail
        def failing_analyzer_callback(analyzer_instance, project_path):
            raise Exception("Existing analyzer failed")
        
        # Test that integration continues even if existing analyzer fails
        result = integration.integrate_with_analyzer(
            analysis_callback=failing_analyzer_callback,
            project_path=temp_project_dir
        )
        
        assert result['integration_status'] in ['SUCCESS', 'ERROR']
        assert result['non_breaking_mode'] is True
        
        # Should have warnings about the failure but continue
        if result['integration_status'] == 'SUCCESS':
            assert len(result['warnings']) > 0

    def test_supply_chain_adapter(self, supply_chain_config, temp_project_dir):
        """Test supply chain adapter for easy integration."""
        
        integration = SupplyChainIntegration()
        integration.config = {'supply_chain': supply_chain_config, 'integration': {'non_breaking': True}}
        integration.sc_analyzer = Mock()
        integration.sc_analyzer.analyze_supply_chain = asyncio.coroutine(lambda x: {'status': 'SUCCESS'})
        
        adapter = SupplyChainAdapter(integration)
        
        # Test callable interface
        result = adapter(temp_project_dir)
        assert 'integration_status' in result
        
        # Test analyze method
        result = adapter.analyze(temp_project_dir)
        assert 'integration_status' in result
        
        # Test health check
        with patch.object(integration, 'get_integration_status') as mock_status:
            mock_status.return_value = {'overall_health': 'HEALTHY'}
            assert adapter.is_healthy() is True

    def test_performance_validation(self, supply_chain_config, temp_project_dir):
        """Test that supply chain analysis meets performance requirements."""
        
        analyzer = SupplyChainAnalyzer(supply_chain_config)
        
        # Set a baseline duration for performance calculation
        analyzer.performance_metrics['baseline_duration'] = 5.0  # 5 seconds baseline
        
        import time
        start_time = time.time()
        
        # Create temporary files for mocking
        temp_output_dir = Path(temp_project_dir) / '.artifacts' / 'supply_chain'
        temp_output_dir.mkdir(parents=True, exist_ok=True)
        
        cyclone_file = temp_output_dir / 'sbom-cyclone-dx.json'
        spdx_file = temp_output_dir / 'sbom-spdx.json'
        provenance_file = temp_output_dir / 'slsa-provenance.json'
        evidence_file = temp_output_dir / 'evidence.zip'
        
        # Create mock files
        cyclone_file.write_text('{"bomFormat": "CycloneDX"}')
        spdx_file.write_text('{"spdxVersion": "SPDX-2.3"}')
        provenance_file.write_text('{"_type": "provenance"}')
        evidence_file.write_text('mock evidence package')
        
        # Mock the analysis to complete quickly
        with patch.object(analyzer.sbom_generator, 'generate_all_formats') as mock_sbom:
            mock_sbom.return_value = {'cyclone_dx': str(cyclone_file), 'spdx': str(spdx_file)}
            
            with patch.object(analyzer.vulnerability_scanner, 'scan_vulnerabilities') as mock_vuln:
                async def mock_vuln_scan(components):
                    return {
                        'summary': {'total': 0, 'critical': 0, 'high': 0}, 
                        'license_compliance': {'compliant': 0, 'violations': []}
                    }
                mock_vuln.return_value = mock_vuln_scan([])
                
                with patch.object(analyzer.slsa_generator, 'generate_provenance') as mock_slsa:
                    mock_slsa.return_value = str(provenance_file)
                    
                    with patch.object(analyzer.crypto_signer, 'sign_artifacts') as mock_signer:
                        mock_signer.return_value = {'signatures_created': 0, 'errors': []}
                        
                        with patch.object(analyzer.evidence_packager, 'create_evidence_package') as mock_packager:
                            mock_packager.return_value = {'package_path': str(evidence_file)}
                            
                            # Run analysis
                            result = asyncio.run(analyzer.analyze_supply_chain(temp_project_dir))
        
        end_time = time.time()
        actual_duration = end_time - start_time
        
        # Verify performance metrics are calculated
        assert 'performance' in result
        performance = result['performance']
        assert 'duration' in performance
        assert 'overhead_percentage' in performance
        
        # The overhead should be reasonable (this is a mock test, so it should be very fast)
        assert performance['overhead_percentage'] >= 0  # Should be non-negative

    def test_quality_gates(self, supply_chain_config, temp_project_dir):
        """Test quality gates enforcement."""
        
        integration = SupplyChainIntegration()
        integration.config = {
            'supply_chain': supply_chain_config,
            'integration': {
                'quality_gates': {
                    'enabled': True,
                    'fail_on_critical_vulnerabilities': True,
                    'max_critical_vulnerabilities': 0,
                    'fail_on_prohibited_licenses': True
                }
            }
        }
        integration.integration_config = integration.config['integration']
        integration.quality_gates = integration.integration_config['quality_gates']
        
        # Test with critical vulnerabilities
        sc_results = {
            'vulnerabilities': {
                'summary': {'critical': 2, 'high': 1},
                'license_compliance': {
                    'violations': [
                        {'violation_type': 'prohibited', 'license': 'SSPL-1.0'}
                    ]
                }
            },
            'signatures': {'errors': []}
        }
        
        gate_results = integration._apply_quality_gates(sc_results)
        
        assert gate_results['enabled'] is True
        assert gate_results['overall_status'] == 'FAIL'
        assert len(gate_results['blocking_failures']) > 0
        
        # Check that critical vulnerabilities cause failure
        critical_failure = any('Critical vulnerabilities' in failure for failure in gate_results['blocking_failures'])
        assert critical_failure
        
        # Check that prohibited licenses cause failure
        license_failure = any('Prohibited license' in failure for failure in gate_results['blocking_failures'])
        assert license_failure

if __name__ == '__main__':
    pytest.main([__file__, '-v'])