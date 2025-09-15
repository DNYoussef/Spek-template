"""
Artifact Manager - Phase 3 Integration Point
==========================================

Central integration point for Phase 3 artifact generation system.
Provides unified interface for Six Sigma, Supply Chain, Compliance, and Workflow artifacts.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime

# Import artifact generators
from .six_sigma.six_sigma_reporter import SixSigmaReporter, generate_six_sigma_report
from .supply_chain.sbom_generator import SupplyChainGenerator, generate_sbom_artifact, generate_slsa_provenance_artifact
from .compliance.compliance_packager import CompliancePackager, generate_compliance_evidence
from .workflows.workflow_orchestrator import WorkflowOrchestrator, create_artifact_workflow, execute_artifact_workflow

# Master feature flag for Phase 3
ENABLE_PHASE3_ARTIFACTS = os.getenv('ENABLE_PHASE3_ARTIFACTS', 'false').lower() == 'true'

class ArtifactManager:
    """Central artifact management system"""
    
    def __init__(self, output_dir: str = ".claude/.artifacts"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger(__name__)
        
        # Initialize subsystem managers
        self.six_sigma_reporter = SixSigmaReporter()
        self.supply_chain_generator = SupplyChainGenerator()
        self.compliance_packager = CompliancePackager()
        self.workflow_orchestrator = WorkflowOrchestrator()
        
        # Artifact registry
        self.artifact_registry = {
            "six_sigma": [],
            "supply_chain": [],
            "compliance": [],
            "workflows": []
        }
    
    def is_enabled(self) -> bool:
        """Check if Phase 3 artifact generation is enabled"""
        return ENABLE_PHASE3_ARTIFACTS
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        if not self.is_enabled():
            return {"status": "disabled", "message": "Phase 3 artifacts disabled"}
        
        return {
            "phase3_artifacts_enabled": True,
            "subsystems": {
                "six_sigma": {
                    "enabled": self.six_sigma_reporter.is_enabled(),
                    "status": "active" if self.six_sigma_reporter.is_enabled() else "disabled"
                },
                "supply_chain": {
                    "sbom_enabled": self.supply_chain_generator.is_sbom_enabled(),
                    "slsa_enabled": self.supply_chain_generator.is_slsa_enabled(),
                    "status": "active" if (self.supply_chain_generator.is_sbom_enabled() or 
                                        self.supply_chain_generator.is_slsa_enabled()) else "disabled"
                },
                "compliance": {
                    "soc2_enabled": self.compliance_packager.is_soc2_enabled(),
                    "iso27001_enabled": self.compliance_packager.is_iso27001_enabled(),
                    "nist_ssdf_enabled": self.compliance_packager.is_nist_ssdf_enabled(),
                    "status": "active" if any([
                        self.compliance_packager.is_soc2_enabled(),
                        self.compliance_packager.is_iso27001_enabled(),
                        self.compliance_packager.is_nist_ssdf_enabled()
                    ]) else "disabled"
                },
                "workflows": {
                    "automation_enabled": self.workflow_orchestrator.is_enabled(),
                    "trigger_processing_enabled": self.workflow_orchestrator.is_trigger_processing_enabled(),
                    "quality_gates_enabled": self.workflow_orchestrator.is_quality_gates_enabled(),
                    "status": "active" if self.workflow_orchestrator.is_enabled() else "disabled"
                }
            },
            "artifact_counts": self._get_artifact_counts(),
            "last_generation": self._get_last_generation_time()
        }
    
    def generate_all_artifacts(self, analysis_results: Dict[str, Any], 
                             project_metadata: Optional[Dict[str, Any]] = None,
                             build_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate all enabled artifacts from analysis results"""
        if not self.is_enabled():
            return {"status": "disabled", "message": "Phase 3 artifacts disabled"}
        
        generation_report = {
            "timestamp": datetime.now().isoformat(),
            "artifacts_generated": {},
            "errors": [],
            "summary": {}
        }
        
        try:
            # Generate Six Sigma artifacts
            if self.six_sigma_reporter.is_enabled():
                try:
                    six_sigma_result = self.six_sigma_reporter.generate_ctq_summary(analysis_results)
                    generation_report["artifacts_generated"]["six_sigma"] = six_sigma_result
                    self.artifact_registry["six_sigma"].append({
                        "timestamp": datetime.now().isoformat(),
                        "type": "ctq_summary",
                        "status": "success"
                    })
                except Exception as e:
                    generation_report["errors"].append(f"Six Sigma generation failed: {e}")
            
            # Generate Supply Chain artifacts
            if project_metadata and (self.supply_chain_generator.is_sbom_enabled() or 
                                   self.supply_chain_generator.is_slsa_enabled()):
                try:
                    if self.supply_chain_generator.is_sbom_enabled():
                        sbom_result = self.supply_chain_generator.generate_sbom(project_metadata)
                        generation_report["artifacts_generated"]["sbom"] = sbom_result
                    
                    if build_context and self.supply_chain_generator.is_slsa_enabled():
                        slsa_result = self.supply_chain_generator.generate_slsa_provenance(build_context)
                        generation_report["artifacts_generated"]["slsa_provenance"] = slsa_result
                    
                    self.artifact_registry["supply_chain"].append({
                        "timestamp": datetime.now().isoformat(),
                        "type": "supply_chain_package",
                        "status": "success"
                    })
                except Exception as e:
                    generation_report["errors"].append(f"Supply Chain generation failed: {e}")
            
            # Generate Compliance artifacts
            if any([self.compliance_packager.is_soc2_enabled(),
                   self.compliance_packager.is_iso27001_enabled(),
                   self.compliance_packager.is_nist_ssdf_enabled()]):
                try:
                    compliance_result = self.compliance_packager.generate_comprehensive_audit_package(analysis_results)
                    generation_report["artifacts_generated"]["compliance"] = compliance_result
                    self.artifact_registry["compliance"].append({
                        "timestamp": datetime.now().isoformat(),
                        "type": "comprehensive_audit",
                        "status": "success"
                    })
                except Exception as e:
                    generation_report["errors"].append(f"Compliance generation failed: {e}")
            
            # Execute workflows if enabled
            if self.workflow_orchestrator.is_enabled():
                try:
                    # Create and execute artifact generation workflow
                    workflow_id = create_artifact_workflow("compliance_audit", {
                        "analysis_results": analysis_results,
                        "project_metadata": project_metadata,
                        "build_context": build_context
                    })
                    
                    if workflow_id:
                        execution_id = execute_artifact_workflow(workflow_id, {
                            "trigger": "artifact_generation",
                            "source": "analyzer_integration"
                        })
                        generation_report["artifacts_generated"]["workflow"] = {
                            "workflow_id": workflow_id,
                            "execution_id": execution_id
                        }
                    
                    self.artifact_registry["workflows"].append({
                        "timestamp": datetime.now().isoformat(),
                        "type": "artifact_workflow",
                        "status": "success"
                    })
                except Exception as e:
                    generation_report["errors"].append(f"Workflow execution failed: {e}")
            
            # Generate summary
            generation_report["summary"] = {
                "total_artifacts": len(generation_report["artifacts_generated"]),
                "successful_generations": len([k for k, v in generation_report["artifacts_generated"].items() 
                                             if isinstance(v, dict) and v.get("status") != "error"]),
                "errors_count": len(generation_report["errors"]),
                "overall_status": "success" if not generation_report["errors"] else "partial_success"
            }
            
            # Save generation report
            output_file = self.output_dir / f"generation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(output_file, 'w') as f:
                json.dump(generation_report, f, indent=2, default=str)
            
            self.logger.info(f"Artifact generation completed: {output_file}")
            return generation_report
            
        except Exception as e:
            self.logger.error(f"Error in artifact generation: {e}")
            generation_report["errors"].append(f"System error: {e}")
            generation_report["summary"] = {"overall_status": "failed"}
            return generation_report
    
    def get_artifact_inventory(self) -> Dict[str, Any]:
        """Get complete artifact inventory"""
        inventory = {
            "timestamp": datetime.now().isoformat(),
            "categories": {},
            "total_artifacts": 0,
            "storage_usage": {}
        }
        
        for category in ["six-sigma", "supply-chain", "compliance", "workflows"]:
            category_dir = self.output_dir / category
            if category_dir.exists():
                artifacts = list(category_dir.rglob("*"))
                files = [f for f in artifacts if f.is_file()]
                
                inventory["categories"][category] = {
                    "file_count": len(files),
                    "total_size": sum(f.stat().st_size for f in files),
                    "recent_files": [
                        {
                            "name": f.name,
                            "size": f.stat().st_size,
                            "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat()
                        }
                        for f in sorted(files, key=lambda x: x.stat().st_mtime, reverse=True)[:5]
                    ]
                }
                inventory["total_artifacts"] += len(files)
        
        return inventory
    
    def cleanup_old_artifacts(self, retention_days: int = 30) -> Dict[str, Any]:
        """Clean up old artifacts based on retention policy"""
        if not self.is_enabled():
            return {"status": "disabled"}
        
        cleanup_report = {
            "timestamp": datetime.now().isoformat(),
            "retention_days": retention_days,
            "files_removed": [],
            "space_freed": 0,
            "errors": []
        }
        
        cutoff_date = datetime.now().timestamp() - (retention_days * 24 * 3600)
        
        try:
            for artifact_file in self.output_dir.rglob("*"):
                if artifact_file.is_file() and artifact_file.stat().st_mtime < cutoff_date:
                    try:
                        file_size = artifact_file.stat().st_size
                        artifact_file.unlink()
                        cleanup_report["files_removed"].append(str(artifact_file))
                        cleanup_report["space_freed"] += file_size
                    except Exception as e:
                        cleanup_report["errors"].append(f"Failed to remove {artifact_file}: {e}")
            
            self.logger.info(f"Cleanup completed: {len(cleanup_report['files_removed'])} files removed")
            return cleanup_report
            
        except Exception as e:
            cleanup_report["errors"].append(f"Cleanup failed: {e}")
            return cleanup_report
    
    def _get_artifact_counts(self) -> Dict[str, int]:
        """Get artifact counts by category"""
        counts = {}
        for category in ["six-sigma", "supply-chain", "compliance", "workflows"]:
            category_dir = self.output_dir / category
            if category_dir.exists():
                counts[category] = len([f for f in category_dir.rglob("*") if f.is_file()])
            else:
                counts[category] = 0
        return counts
    
    def _get_last_generation_time(self) -> Optional[str]:
        """Get timestamp of last artifact generation"""
        try:
            generation_reports = list(self.output_dir.glob("generation_report_*.json"))
            if generation_reports:
                latest_report = max(generation_reports, key=lambda x: x.stat().st_mtime)
                return datetime.fromtimestamp(latest_report.stat().st_mtime).isoformat()
        except Exception:
            pass
        return None

# Global artifact manager instance
_artifact_manager = None

def get_artifact_manager() -> ArtifactManager:
    """Get global artifact manager instance"""
    global _artifact_manager
    if _artifact_manager is None:
        _artifact_manager = ArtifactManager()
    return _artifact_manager

# Integration functions for existing analyzer
def generate_phase3_artifacts(analysis_results: Dict[str, Any], 
                            project_metadata: Optional[Dict[str, Any]] = None,
                            build_context: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Main integration function for Phase 3 artifact generation"""
    if not ENABLE_PHASE3_ARTIFACTS:
        return None
    
    manager = get_artifact_manager()
    return manager.generate_all_artifacts(analysis_results, project_metadata, build_context)

def get_phase3_status() -> Dict[str, Any]:
    """Get Phase 3 system status"""
    manager = get_artifact_manager()
    return manager.get_system_status()

def cleanup_phase3_artifacts(retention_days: int = 30) -> Dict[str, Any]:
    """Cleanup old Phase 3 artifacts"""
    manager = get_artifact_manager()
    return manager.cleanup_old_artifacts(retention_days)