# Constants with fallback
try:
    from src.constants.base import NASA_MAX_FUNCTION_LENGTH as MAXIMUM_FUNCTION_LENGTH_LINES
"""

Orchestrates comprehensive supply chain security including SBOM generation,
SLSA attestation, and vulnerability management.
"""

from enum import Enum
import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime
"""

logger = logging.getLogger(__name__)

class SecurityLevel(Enum):
    """Supply chain security levels"""
    BASIC = "basic"
    ENHANCED = "enhanced"
    CRITICAL = "critical"
    TOP_SECRET = "top_secret"

@dataclass
class SecurityReport:
    """Comprehensive security report"""
    timestamp: datetime = field(default_factory=datetime.now)
    security_level: SecurityLevel = SecurityLevel.BASIC
    sbom_generated: bool = False
    slsa_level: Optional[SLSALevel] = None
    vulnerabilities_found: int = 0
    critical_vulnerabilities: int = 0
    dependencies_analyzed: int = 0
    risk_score: float = 0.0
    compliance_status: Dict[str, bool] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)
    artifacts: Dict[str, str] = field(default_factory=dict)

class SupplyChainSecurity:
    """
    Enterprise supply chain security orchestrator
    
    Coordinates SBOM generation, SLSA attestation, vulnerability scanning,
    and dependency analysis to provide comprehensive supply chain security.
    """
    
    def __init__(self, project_root: Path, security_level: SecurityLevel = SecurityLevel.BASIC):
        self.project_root = Path(project_root)
        self.security_level = security_level
        
        # Initialize security components
        self.sbom_generator = SBOMGenerator(project_root)
        self.slsa_generator = SLSAGenerator(project_root)
        self.vulnerability_scanner = VulnerabilityScanner()
        self.dependency_analyzer = DependencyAnalyzer(project_root)
        
        # Security configuration based on level
        self.config = self._get_security_config(security_level)
        
    def _get_security_config(self, level: SecurityLevel) -> Dict[str, Any]:
        """Get security configuration based on level"""
        configs = {
            SecurityLevel.BASIC: {
                "sbom_format": SBOMFormat.SPDX_JSON,
                "slsa_level": SLSALevel.LEVEL_1,
                "vulnerability_scan": True,
                "dependency_analysis": True,
                "require_signatures": False,
                "attestation_required": False
            },
            SecurityLevel.ENHANCED: {
                "sbom_format": SBOMFormat.CYCLONEDX_JSON,
                "slsa_level": SLSALevel.LEVEL_2,
                "vulnerability_scan": True,
                "dependency_analysis": True,
                "require_signatures": True,
                "attestation_required": True
            },
            SecurityLevel.CRITICAL: {
                "sbom_format": SBOMFormat.CYCLONEDX_JSON,
                "slsa_level": SLSALevel.LEVEL_3,
                "vulnerability_scan": True,
                "dependency_analysis": True,
                "require_signatures": True,
                "attestation_required": True,
                "provenance_required": True
            },
            SecurityLevel.TOP_SECRET: {
                "sbom_format": SBOMFormat.CYCLONEDX_JSON,
                "slsa_level": SLSALevel.LEVEL_4,
                "vulnerability_scan": True,
                "dependency_analysis": True,
                "require_signatures": True,
                "attestation_required": True,
                "provenance_required": True,
                "hermetic_builds": True
            }
        }
        return configs.get(level, configs[SecurityLevel.BASIC])
        
    async def generate_comprehensive_security_report(self) -> SecurityReport:
        """Generate comprehensive supply chain security report"""
        report = SecurityReport(security_level=self.security_level)
        
        try:
            # Generate SBOM
            if self.config.get("sbom_format"):
                logger.info("Generating SBOM...")
                sbom_path = await self.sbom_generator.generate_sbom(
                    format=self.config["sbom_format"]
                )
                report.sbom_generated = True
                report.artifacts["sbom"] = str(sbom_path)
                
            # Generate SLSA attestation
            if self.config.get("slsa_level"):
                logger.info("Generating SLSA attestation...")
                attestation_path = await self.slsa_generator.generate_attestation(
                    level=self.config["slsa_level"]
                )
                report.slsa_level = self.config["slsa_level"]
                report.artifacts["slsa_attestation"] = str(attestation_path)
                
            # Vulnerability scanning
            if self.config.get("vulnerability_scan"):
                logger.info("Scanning for vulnerabilities...")
                vuln_results = await self.vulnerability_scanner.scan_project(
                    self.project_root
                )
                report.vulnerabilities_found = len(vuln_results.get("vulnerabilities", []))
                report.critical_vulnerabilities = len([
                    v for v in vuln_results.get("vulnerabilities", [])
                    if v.get("severity") == "critical"
                ])
                report.artifacts["vulnerability_report"] = vuln_results.get("report_path", "")
                
            # Dependency analysis
            if self.config.get("dependency_analysis"):
                logger.info("Analyzing dependencies...")
                dep_results = await self.dependency_analyzer.analyze_dependencies()
                report.dependencies_analyzed = len(dep_results.get("dependencies", []))
                report.artifacts["dependency_report"] = dep_results.get("report_path", "")
                
            # Calculate risk score
            report.risk_score = self._calculate_risk_score(report)
            
            # Check compliance
            report.compliance_status = self._check_compliance(report)
            
            # Generate recommendations
            report.recommendations = self._generate_recommendations(report)
            
        except Exception as e:
            logger.error(f"Error generating security report: {e}")
            report.recommendations.append(f"Security scan failed: {e}")
            
        return report
        
    def _calculate_risk_score(self, report: SecurityReport) -> float:
        """Calculate overall risk score (0-MAXIMUM_FUNCTION_LENGTH_LINES, lower is better)"""
        base_score = 0.0
        
        # Vulnerability risk
        if report.vulnerabilities_found > 0:
            base_score += min(40, report.vulnerabilities_found * 2)
            base_score += report.critical_vulnerabilities * 15
            
        # SBOM risk
        if not report.sbom_generated:
            base_score += 20
            
        # SLSA risk
        if not report.slsa_level or report.slsa_level.value < 2:
            base_score += 15
            
        # Compliance risk
        compliance_failures = len([
            k for k, v in report.compliance_status.items() if not v
        ])
        base_score += compliance_failures * 5
        
        return min(60.0, round(base_score, 1))
        
    def _check_compliance(self, report: SecurityReport) -> Dict[str, bool]:
        """Check compliance with various standards"""
        compliance = {}
        
        # NIST compliance
        compliance["nist_ssdf"] = (
            report.sbom_generated and
            report.slsa_level is not None and
            report.vulnerabilities_found == 0
        )
        
        # CISA compliance
        compliance["cisa_sbom"] = report.sbom_generated
        
        # SLSA compliance
        compliance["slsa_level_2"] = (
            report.slsa_level is not None and
            report.slsa_level.value >= 2
        )
        
        # Zero-trust principles
        compliance["zero_trust"] = (
            report.sbom_generated and
            report.critical_vulnerabilities == 0 and
            report.slsa_level is not None
        )
        
        return compliance
        
    def _generate_recommendations(self, report: SecurityReport) -> List[str]:
        """Generate security recommendations based on report"""
        recommendations = []
        
        if not report.sbom_generated:
            recommendations.append("Generate SBOM for supply chain transparency")
            
        if report.slsa_level is None or report.slsa_level.value < 2:
            recommendations.append("Implement SLSA Level 2+ attestation")
            
        if report.critical_vulnerabilities > 0:
            recommendations.append(
                f"Address {report.critical_vulnerabilities} critical vulnerabilities immediately"
            )
            
        if report.vulnerabilities_found > 0:
            recommendations.append("Update dependencies to resolve known vulnerabilities")
            
        if report.risk_score > 50:
            recommendations.append("Overall risk score is high - prioritize security improvements")
            
        if not report.compliance_status.get("nist_ssdf", False):
            recommendations.append("Achieve NIST SSDF compliance for enterprise readiness")
            
        return recommendations
        
    async def export_security_artifacts(self, output_dir: Path) -> Dict[str, str]:
        """Export all security artifacts to specified directory"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        exported_files = {}
        
        # Generate comprehensive report
        report = await self.generate_comprehensive_security_report()
        
        # Export report as JSON
        report_file = output_dir / "security-report.json"
        with open(report_file, 'w') as f:
            json.dump({
                "timestamp": report.timestamp.isoformat(),
                "security_level": report.security_level.value,
                "sbom_generated": report.sbom_generated,
                "slsa_level": report.slsa_level.value if report.slsa_level else None,
                "vulnerabilities_found": report.vulnerabilities_found,
                "critical_vulnerabilities": report.critical_vulnerabilities,
                "dependencies_analyzed": report.dependencies_analyzed,
                "risk_score": report.risk_score,
                "compliance_status": report.compliance_status,
                "recommendations": report.recommendations,
                "artifacts": report.artifacts
            }, indent=2)
        exported_files["security_report"] = str(report_file)
        
        # Copy artifacts to output directory
        for artifact_type, artifact_path in report.artifacts.items():
            if artifact_path and path_exists(artifact_path):
                dest_path = output_dir / f"{artifact_type}-{Path(artifact_path).name}"
                dest_path.write_bytes(Path(artifact_path).read_bytes())
                exported_files[artifact_type] = str(dest_path)
                
        return exported_files
        
    def get_security_status(self) -> Dict[str, Any]:
        """Get current security status summary"""
        return {
            "security_level": self.security_level.value,
            "project_root": str(self.project_root),
            "components": {
                "sbom_generator": self.sbom_generator.get_status(),
                "slsa_generator": self.slsa_generator.get_status(),
                "vulnerability_scanner": self.vulnerability_scanner.get_status(),
                "dependency_analyzer": self.dependency_analyzer.get_status()
            },
            "configuration": self.config
        }