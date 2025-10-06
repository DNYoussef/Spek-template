# from lib.shared.utilities.logging_setup import get_security_logger

# Use specialized security logging for supply chain
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set
import logging

logger = logging.getLogger(__name__)
"""
Supply Chain Security Analyzer - Main Orchestrator
Coordinates all supply chain security components and provides unified interface.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional
import json
import time

import asyncio

from .sbom_generator import SBOMGenerator
from .slsa_provenance import SLSAProvenanceGenerator
from .vulnerability_scanner import VulnerabilityScanner
from .crypto_signer import CryptographicSigner
from .evidence_packager import EvidencePackager

class SupplyChainAnalyzer:
    """Main supply chain security analyzer orchestrating all components."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.output_dir = Path(config.get('output_dir', '.claude/.artifacts/supply_chain'))
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Performance tracking
        self.performance_target = config.get('performance_overhead_target', 1.8)  # %
        self.performance_metrics = {
            'start_time': None,
            'end_time': None,
            'duration': 0,
            'overhead_percentage': 0,
            'baseline_duration': config.get('baseline_duration', 10.0)  # seconds
        }
        
        # Initialize components
        self.sbom_generator = SBOMGenerator(config)
        self.slsa_generator = SLSAProvenanceGenerator(config)
        self.vulnerability_scanner = VulnerabilityScanner(config)
        self.crypto_signer = CryptographicSigner(config)
        self.evidence_packager = EvidencePackager(config)
        
        # Analysis configuration
        self.enable_parallel = config.get('enable_parallel_processing', True)
        self.max_workers = config.get('max_workers', 4)
        self.timeout_seconds = config.get('timeout_seconds', 300)
        
    async def analyze_supply_chain(self, project_path: str) -> Dict[str, Any]:
        """Comprehensive supply chain security analysis."""
        
        self.performance_metrics['start_time'] = time.time()
        
        analysis_id = f"sc-analysis-{int(time.time())}"
        
        results = {
            'analysis_id': analysis_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'project_path': project_path,
            'analyzer_version': '1.0.0',
            'configuration': self._get_analysis_config(),
            'sbom': {},
            'provenance': {},
            'vulnerabilities': {},
            'signatures': {},
            'evidence_package': {},
            'performance': {},
            'summary': {},
            'compliance_status': {}
        }
        
        try:
            # Step 1: Generate SBOM
            print("Generating Software Bill of Materials...")
            sbom_results = self.sbom_generator.generate_all_formats(project_path)
            results['sbom'] = sbom_results
            
            # Step 2: Analyze dependencies from SBOM
            components = self._extract_components_from_sbom(sbom_results)
            
            # Step 3: Parallel execution of vulnerability scanning and provenance generation
            if self.enable_parallel:
                tasks = []
                
                # Vulnerability scanning
                tasks.append(self._run_vulnerability_scan(components))
                
                # SLSA provenance generation
                build_metadata = self.slsa_generator.generate_build_metadata(project_path)
                artifacts = self._create_artifact_list(project_path, sbom_results)
                tasks.append(self._run_provenance_generation(artifacts, build_metadata))
                
                # Execute parallel tasks
                vuln_results, provenance_results = await asyncio.gather(*tasks)
                
                results['vulnerabilities'] = vuln_results
                results['provenance'] = provenance_results
                
            else:
                # Sequential execution
                print("Scanning for vulnerabilities...")
                results['vulnerabilities'] = await self._run_vulnerability_scan(components)
                
                print("Generating SLSA provenance...")
                build_metadata = self.slsa_generator.generate_build_metadata(project_path)
                artifacts = self._create_artifact_list(project_path, sbom_results)
                results['provenance'] = await self._run_provenance_generation(artifacts, build_metadata)
            
            # Step 4: Cryptographic signing
            print("Creating cryptographic signatures...")
            artifacts = self._create_artifact_list(project_path, sbom_results)
            signing_results = self.crypto_signer.sign_artifacts(artifacts)
            results['signatures'] = signing_results
            
            # Step 5: Evidence packaging
            print("Creating evidence package...")
            package_results = self.evidence_packager.create_evidence_package(project_path, artifacts)
            results['evidence_package'] = package_results
            
            # Step 6: Generate analysis summary
            results['summary'] = self._generate_analysis_summary(results)
            results['compliance_status'] = self._assess_compliance_status(results)
            
        except Exception as e:
            results['error'] = str(e)
            results['status'] = 'FAILED'
        else:
            results['status'] = 'SUCCESS'
        finally:
            # Calculate performance metrics
            self.performance_metrics['end_time'] = time.time()
            self.performance_metrics['duration'] = (
                self.performance_metrics['end_time'] - self.performance_metrics['start_time']
            )
            self.performance_metrics['overhead_percentage'] = (
                (self.performance_metrics['duration'] - self.performance_metrics['baseline_duration']) 
                / self.performance_metrics['baseline_duration'] * 100
            )
            
            results['performance'] = self.performance_metrics.copy()
        
        # Save comprehensive results
        results_path = self.output_dir / f"supply-chain-analysis-{analysis_id}.json"
        with open(results_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"Supply chain analysis completed. Results saved to: {results_path}")
        
        return results
    
    async def _run_vulnerability_scan(self, components: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run vulnerability scanning asynchronously."""
        try:
            return await self.vulnerability_scanner.scan_vulnerabilities(components)
        except Exception as e:
            return {'error': str(e), 'status': 'FAILED'}
    
    async def _run_provenance_generation(self, 
                                        artifacts: List[Dict[str, Any]], 
                                        build_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Run provenance generation asynchronously."""
        try:
            # Convert to sync call since SLSA generator is not async
            loop = asyncio.get_event_loop()
            provenance_path = await loop.run_in_executor(
                None, 
                self.slsa_generator.generate_provenance,
                artifacts,
                build_metadata
            )
            return {'provenance_path': provenance_path, 'status': 'SUCCESS'}
        except Exception as e:
            return {'error': str(e), 'status': 'FAILED'}
    
    def _extract_components_from_sbom(self, sbom_results: Dict[str, str]) -> List[Dict[str, Any]]:
        """Extract components from generated SBOM files."""
        components = []
        
        # Try to load CycloneDX SBOM first
        cyclone_dx_path = sbom_results.get('cyclone_dx')
        if cyclone_dx_path and path_exists(cyclone_dx_path):
            try:
                with open(cyclone_dx_path, 'r', encoding='utf-8') as f:
                    sbom_data = json.load(f)
                
                for component in sbom_data.get('components', []):
                    comp_data = {
                        'name': component.get('name'),
                        'version': component.get('version'),
                        'type': component.get('type'),
                        'purl': component.get('purl'),
                        'ecosystem': self._extract_ecosystem_from_purl(component.get('purl', '')),
                        'licenses': self._extract_licenses_from_component(component),
                        'hashes': self._extract_hashes_from_component(component)
                    }
                    components.append(comp_data)
                    
            except Exception as e:
                print(f"Error reading CycloneDX SBOM: {e}")
        
        return components
    
    def _extract_ecosystem_from_purl(self, purl: str) -> str:
        """Extract ecosystem from package URL."""
        if purl.startswith('pkg:npm/'):
            return 'npm'
        elif purl.startswith('pkg:pypi/'):
            return 'pypi'
        elif purl.startswith('pkg:maven/'):
            return 'maven'
        elif purl.startswith('pkg:go/'):
            return 'go'
        elif purl.startswith('pkg:cargo/'):
            return 'cargo'
        return 'unknown'
    
    def _extract_licenses_from_component(self, component: Dict[str, Any]) -> List[str]:
        """Extract licenses from CycloneDX component."""
        licenses = []
        
        for license_info in component.get('licenses', []):
            license_data = license_info.get('license', {})
            if 'id' in license_data:
                licenses.append(license_data['id'])
            elif 'name' in license_data:
                licenses.append(license_data['name'])
        
        return licenses
    
    def _extract_hashes_from_component(self, component: Dict[str, Any]) -> Dict[str, str]:
        """Extract hashes from CycloneDX component."""
        hashes = {}
        
        for hash_info in component.get('hashes', []):
            algorithm = hash_info.get('alg', '').lower()
            content = hash_info.get('content', '')
            if algorithm and content:
                hashes[algorithm] = content
        
        return hashes
    
    def _create_artifact_list(self, project_path: str, sbom_results: Dict[str, str]) -> List[Dict[str, Any]]:
        """Create list of artifacts for signing and attestation."""
        artifacts = []
        
        # Add SBOM files as artifacts
        for format_name, sbom_path in sbom_results.items():
            if sbom_path and path_exists(sbom_path):
                artifacts.append({
                    'name': Path(sbom_path).name,
                    'path': sbom_path,
                    'type': 'sbom',
                    'format': format_name,
                    'description': f"SBOM in {format_name} format"
                })
        
        # Add other generated artifacts
        artifact_patterns = [
            (self.output_dir / "slsa-provenance.json", "provenance", "SLSA provenance attestation"),
            (self.output_dir / "vulnerability-scan.json", "vulnerability-report", "Vulnerability scan results"),
            (self.output_dir / "compliance-report.json", "compliance-report", "License compliance report")
        ]
        
        for artifact_path, artifact_type, description in artifact_patterns:
            if artifact_path.exists():
                artifacts.append({
                    'name': artifact_path.name,
                    'path': str(artifact_path),
                    'type': artifact_type,
                    'format': 'json',
                    'description': description
                })
        
        # Add main project artifacts (if they exist)
        project_path = Path(project_path)
        project_artifacts = [
            (project_path / "package.json", "manifest", "Package manifest"),
            (project_path / "requirements.txt", "manifest", "Python requirements"),
            (project_path / "Dockerfile", "build-config", "Docker build configuration")
        ]
        
        for proj_artifact_path, proj_type, description in project_artifacts:
            if proj_artifact_path.exists():
                artifacts.append({
                    'name': proj_artifact_path.name,
                    'path': str(proj_artifact_path),
                    'type': proj_type,
                    'format': 'text',
                    'description': description
                })
        
        return artifacts
    
    def _generate_analysis_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive analysis summary."""
        
        summary = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'overall_status': results.get('status', 'UNKNOWN'),
            'components_analyzed': 0,
            'vulnerabilities_found': 0,
            'critical_vulnerabilities': 0,
            'license_violations': 0,
            'artifacts_signed': 0,
            'evidence_package_created': False,
            'compliance_level': 'UNKNOWN',
            'recommendations': []
        }
        
        # SBOM summary
        sbom_data = results.get('sbom', {})
        if sbom_data:
            summary['sbom_formats'] = list(sbom_data.keys())
        
        # Vulnerability summary
        vuln_data = results.get('vulnerabilities', {})
        if vuln_data and 'summary' in vuln_data:
            vuln_summary = vuln_data['summary']
            summary['vulnerabilities_found'] = vuln_summary.get('total', 0)
            summary['critical_vulnerabilities'] = vuln_summary.get('critical', 0)
            summary['components_analyzed'] = vuln_data.get('total_components', 0)
        
        # License compliance summary
        if vuln_data and 'license_compliance' in vuln_data:
            license_data = vuln_data['license_compliance']
            summary['license_violations'] = license_data.get('non_compliant', 0)
        
        # Signing summary
        signing_data = results.get('signatures', {})
        if signing_data:
            summary['artifacts_signed'] = signing_data.get('signatures_created', 0)
        
        # Evidence package summary
        evidence_data = results.get('evidence_package', {})
        if evidence_data and evidence_data.get('package_path'):
            summary['evidence_package_created'] = True
            summary['evidence_package_size'] = evidence_data.get('package_size', 0)
        
        # Generate recommendations
        summary['recommendations'] = self._generate_recommendations(results)
        
        return summary
    
    def _assess_compliance_status(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Assess overall compliance status."""
        
        compliance = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'overall_grade': 'UNKNOWN',
            'slsa_level': 0,
            'requirements_met': [],
            'requirements_failed': [],
            'score': 0.0,
            'max_score': 100.0
        }
        
        score = 0
        max_score = 100
        
        # SBOM requirement (20 points)
        if results.get('sbom') and len(results['sbom']) >= 2:
            compliance['requirements_met'].append('SBOM generated in multiple formats')
            score += 20
        else:
            compliance['requirements_failed'].append('SBOM generation incomplete')
        
        # SLSA provenance (20 points)
        if results.get('provenance') and results['provenance'].get('status') == 'SUCCESS':
            compliance['requirements_met'].append('SLSA provenance attestation')
            score += 20
        else:
            compliance['requirements_failed'].append('SLSA provenance generation failed')
        
        # Vulnerability scanning (20 points)
        vuln_data = results.get('vulnerabilities', {})
        if vuln_data and vuln_data.get('total_components', 0) > 0:
            compliance['requirements_met'].append('Vulnerability scanning completed')
            score += 20
        else:
            compliance['requirements_failed'].append('Vulnerability scanning incomplete')
        
        # Cryptographic signing (20 points)
        signing_data = results.get('signatures', {})
        if signing_data and signing_data.get('signatures_created', 0) > 0:
            compliance['requirements_met'].append('Cryptographic signatures applied')
            score += 20
        else:
            compliance['requirements_failed'].append('Cryptographic signing incomplete')
        
        # Evidence packaging (20 points)
        if results.get('evidence_package') and results['evidence_package'].get('package_path'):
            compliance['requirements_met'].append('Comprehensive evidence package created')
            score += 20
        else:
            compliance['requirements_failed'].append('Evidence package creation failed')
        
        # Calculate final grade
        compliance['score'] = score
        compliance['max_score'] = max_score
        
        percentage = (score / max_score) * 100
        
        if percentage >= 90:
            compliance['overall_grade'] = 'A'
            compliance['slsa_level'] = 3
        elif percentage >= 80:
            compliance['overall_grade'] = 'B'
            compliance['slsa_level'] = 2
        elif percentage >= 70:
            compliance['overall_grade'] = 'C'
            compliance['slsa_level'] = 1
        else:
            compliance['overall_grade'] = 'F'
            compliance['slsa_level'] = 0
        
        return compliance
    
    def _generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations based on analysis results."""
        
        recommendations = []
        
        # Vulnerability recommendations
        vuln_data = results.get('vulnerabilities', {})
        if vuln_data:
            vuln_summary = vuln_data.get('summary', {})
            
            if vuln_summary.get('critical', 0) > 0:
                recommendations.append(
                    f"CRITICAL: Address {vuln_summary['critical']} critical vulnerabilities immediately"
                )
            
            if vuln_summary.get('high', 0) > 0:
                recommendations.append(
                    f"HIGH PRIORITY: Update {vuln_summary['high']} components with high-severity vulnerabilities"
                )
            
            # License recommendations
            license_data = vuln_data.get('license_compliance', {})
            if license_data.get('non_compliant', 0) > 0:
                recommendations.append(
                    f"Review {license_data['non_compliant']} components with license compliance issues"
                )
        
        # Signing recommendations
        signing_data = results.get('signatures', {})
        if signing_data and signing_data.get('errors'):
            recommendations.append("Address cryptographic signing errors before production deployment")
        
        # Performance recommendations
        performance = results.get('performance', {})
        if performance.get('overhead_percentage', 0) > self.performance_target:
            recommendations.append(
                f"Supply chain analysis overhead ({performance['overhead_percentage']:.1f}%) exceeds target "
                f"({self.performance_target}%). Consider optimizing scan configuration."
            )
        
        # Evidence package recommendations
        if not results.get('evidence_package', {}).get('package_path'):
            recommendations.append("Create comprehensive evidence package for compliance and audit requirements")
        
        if not recommendations:
            recommendations.append("All supply chain security requirements are satisfied")
        
        return recommendations
    
    def _get_analysis_config(self) -> Dict[str, Any]:
        """Get analysis configuration summary."""
        
        return {
            'parallel_processing': self.enable_parallel,
            'max_workers': self.max_workers,
            'timeout_seconds': self.timeout_seconds,
            'performance_target': f"{self.performance_target}%",
            'components_enabled': {
                'sbom_generation': True,
                'slsa_provenance': True,
                'vulnerability_scanning': True,
                'cryptographic_signing': True,
                'evidence_packaging': True
            },
            'output_formats': {
                'sbom': ['CycloneDX-1.4', 'SPDX-2.3'],
                'provenance': ['SLSA-1.0'],
                'evidence_package': self.evidence_packager.package_format
            }
        }
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate detailed performance analysis report."""
        
        report = {
            'report_timestamp': datetime.now(timezone.utc).isoformat(),
            'performance_metrics': self.performance_metrics.copy(),
            'target_overhead': f"{self.performance_target}%",
            'actual_overhead': f"{self.performance_metrics.get('overhead_percentage', 0):.2f}%",
            'performance_status': 'PASS' if self.performance_metrics.get('overhead_percentage', 0) <= self.performance_target else 'FAIL',
            'recommendations': []
        }
        
        # Add performance recommendations
        if self.performance_metrics.get('overhead_percentage', 0) > self.performance_target:
            report['recommendations'].extend([
                'Consider enabling parallel processing to improve performance',
                'Optimize vulnerability scanning by reducing scan scope',
                'Use local vulnerability databases to reduce network latency',
                'Consider async processing for independent components'
            ])
        else:
            report['recommendations'].append(
                'Performance target met. Current configuration is optimal.'
            )
        
        return report
    
    def validate_configuration(self) -> Dict[str, Any]:
        """Validate analyzer configuration and dependencies."""
        
        validation = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'valid': True,
            'checks_passed': [],
            'checks_failed': [],
            'warnings': []
        }
        
        # Check output directory
        if self.output_dir.exists() and self.output_dir.is_dir():
            validation['checks_passed'].append('Output directory accessible')
        else:
            validation['checks_failed'].append(f'Output directory not accessible: {self.output_dir}')
            validation['valid'] = False
        
        # Check component configurations
        components = {
            'SBOM Generator': self.sbom_generator,
            'SLSA Provenance Generator': self.slsa_generator,
            'Vulnerability Scanner': self.vulnerability_scanner,
            'Cryptographic Signer': self.crypto_signer,
            'Evidence Packager': self.evidence_packager
        }
        
        for component_name, component in components.items():
            if hasattr(component, 'config') and component.config:
                validation['checks_passed'].append(f'{component_name} configured')
            else:
                validation['warnings'].append(f'{component_name} may have incomplete configuration')
        
        # Check external dependencies
        try:
            import aiohttp
            validation['checks_passed'].append('aiohttp available for vulnerability scanning')
        except ImportError:
            validation['checks_failed'].append('aiohttp not available - vulnerability scanning may fail')
            validation['valid'] = False
        
        return validation