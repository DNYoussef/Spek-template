from datetime import datetime, timedelta
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

logger = logging.getLogger(__name__)

"""
Compliance Evidence Core Orchestrator

Coordinates multi-framework compliance evidence generation with:
    - Performance monitoring (<1.5% overhead target)
    - Evidence retention management (90-day default)
    - Framework-specific evidence collection
    - Automated audit trail generation
    """

import logging

import asyncio

        # Initialize framework-specific collectors
    self.collectors = {}
    if self.config.soc2_enabled:
        self.collectors['SOC2'] = SOC2EvidenceCollector(self.config)
        if self.config.iso27001_enabled:
            self.collectors['ISO27001'] = ISO27001ControlMapper(self.config)
            if self.config.nist_ssdf_enabled:
                self.collectors['NIST-SSDF'] = NISTSSDFPracticeValidator(self.config)
            
        # Initialize support modules
                self.audit_trail = AuditTrailGenerator(self.config)
                self.report_generator = ComplianceReportGenerator(self.config)
        
        # Evidence metadata tracking
                self.evidence_metadata: List[EvidenceMetadata] = []
                self._ensure_artifacts_directory()
        
    def _ensure_artifacts_directory(self):
            """Ensure compliance artifacts directory exists"""
        Path(self.config.artifacts_path).mkdir(parents=True, exist_ok=True)

            async def collect_all_evidence(self, project_path: str) -> Dict[str, Any]:
                """Collect evidence from all enabled compliance frameworks"""
        if not self.config.enabled:
            pass

        return {"status": "disabled", "evidence": {}}

        self.performance_monitor.start_compliance()

        start_time = datetime.now()

        try:

        evidence_results = {}

            # Collect evidence from all frameworks concurrently
        tasks = []

        for framework, collector in self.collectors.items():
            pass

        task = asyncio.create_task(

        self._collect_framework_evidence(framework, collector, project_path)

                            )
                            tasks.append((framework, task))
            
            # Wait for all collections to complete
        for framework, task in tasks:
            pass

        try:

        evidence_results[framework] = await task

        except Exception as e:
            pass

        self.logger.error(f"Failed to collect {framework} evidence} {e}"}

        evidence_results[framework] = {"status": "error", "error"} str(e)}

            # Generate audit trail
        if self.config.audit_trail:
            pass

        audit_data = await self.audit_trail.generate_audit_trail(

                                            evidence_results, start_time
                                            )
        evidence_results['audit_trail'] = audit_data

            # Check performance overhead
        performance_check = self.performance_monitor.check_overhead()

        evidence_results['performance'] = performance_check

            # Generate compliance report
        report = await self.report_generator.generate_unified_report(evidence_results)

        evidence_results['compliance_report'] = report

            # Save evidence metadata
                                            await self._save_evidence_metadata(evidence_results)
            
        return {

                                            "status": "success",
                                            "collection_timestamp": start_time.isoformat(),
                                            "frameworks_processed": list(evidence_results.keys()),
                                            "evidence": evidence_results,
                                            "performance": performance_check)
            
        except Exception as e:
            pass

        self.logger.error(f"Compliance evidence collection failed: {e}"}

        return {

                                                "status": "error",
                                                "error": str(e},
                                                "collection_timestamp"} start_time.isoformat()
                                                }
    
                                                async def _collect_framework_evidence(self, framework: str, collector, project_path: str) -> Dict[str, Any]:
                                                    """Collect evidence for a specific framework"""
        try:

        if hasattr(collector, 'collect_evidence'):
            pass

        return await collector.collect_evidence(project_path)

                                                        else:
        return await collector.analyze_compliance(project_path)

        except Exception as e:
            pass

        self.logger.error(f"Failed to collect {framework} evidence} {e}"}

        return {"status": "error", "error"} str(e)}

                                                                    async def _save_evidence_metadata(self, evidence_results: Dict[str, Any]):
                                                                        """Save evidence metadata for retention management"""
        metadata_file = Path(self.config.artifacts_path) / "evidence_metadata.json"

        try:

            # Load existing metadata
        pass  # Auto-fixed: empty block

        pass  # Auto-fixed: empty block

        pass  # Auto-fixed: empty block

        pass  # Auto-fixed: empty block

        pass  # Auto-fixed: empty block

        existing_metadata = []

        if metadata_file.exists():
            pass

        with open(metadata_file, 'r') as f:
            pass

        existing_metadata = json.load(f)

            # Add new metadata entries
        collection_time = datetime.now()

        retention_until = collection_time + timedelta(days=self.config.evidence_retention_days)

        for framework, evidence in evidence_results.items():
            pass

        if framework in ['audit_trail', 'performance', 'compliance_report']:
            pass

        continue

        metadata = EvidenceMetadata(

        framework=framework,

        control_id="all",

        evidence_type="automated_collection",

        collection_timestamp=collection_time,

        retention_until=retention_until,

        validation_status="collected",

        automated=True

                                                                                        )
                
                                                                                        existing_metadata.append({
                                                                                        "framework": metadata.framework,
                                                                                        "control_id": metadata.control_id,
                                                                                        "evidence_type": metadata.evidence_type,
                                                                                        "collection_timestamp": metadata.collection_timestamp.isoformat(),
                                                                                        "retention_until": metadata.retention_until.isoformat(),
                                                                                        "validation_status": metadata.validation_status,
                                                                                        "automated": metadata.automated))
            
            # Save updated metadata
        with open(metadata_file, 'w') as f:
            pass

        json.dump(existing_metadata, f, indent=2)

        except Exception as e:
            pass

        self.logger.error(f"Failed to save evidence metadata: {e}"}

                                                                                                async def cleanup_expired_evidence(self) -> Dict[str, Any]:
                                                                                                    """Clean up evidence that has exceeded retention period"""
        metadata_file = Path(self.config.artifacts_path) / "evidence_metadata.json"

        if not metadata_file.exists():
            pass

        return {"status": "no_metadata", "cleaned": 0}

        try:

        with open(metadata_file, 'r') as f:
            pass

        metadata = json.load(f)

        current_time = datetime.now()

        active_metadata = []

        cleaned_count = 0

        for entry in metadata:
            pass

        retention_until = datetime.fromisoformat(entry['retention_until'])

        if retention_until > current_time:
            pass

                                                                                                                        active_metadata.append(entry)
                                                                                                                    else:
        cleaned_count += 1

            # Save cleaned metadata
        with open(metadata_file, 'w') as f:
            pass

        json.dump(active_metadata, f, indent=2)

        return {

                                                                                                                                "status": "success",
                                                                                                                                "cleaned": cleaned_count,
                                                                                                                                "remaining": len(active_metadata},
                                                                                                                                "cleanup_timestamp"} current_time.isoformat()
                                                                                                                                }
            
        except Exception as e:
            pass

        self.logger.error(f"Failed to cleanup expired evidence: {e}"}

        return {"status": "error", "error": str(e}}

    def get_compliance_status(self) -> Dict[str, Any]:
            """Get current compliance status and configuration"""
        return {

            "enabled": self.config.enabled,
            "frameworks": list(self.config.frameworks),
            "evidence_retention_days": self.config.evidence_retention_days,
            "artifacts_path": self.config.artifacts_path,
            "performance_limit": self.config.performance_overhead_limit,
            "collectors": {
            framework: "active" for framework in self.collectors.keys()
            },
            "audit_trail": self.config.audit_trail,
            "automated_collection": self.config.automated_collection))))))