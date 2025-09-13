"""
Compliance Evidence Core Orchestrator

Coordinates multi-framework compliance evidence generation with:
- Performance monitoring (<1.5% overhead target)
- Evidence retention management (90-day default)
- Framework-specific evidence collection
- Automated audit trail generation
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, field
import yaml
import json

from .soc2 import SOC2EvidenceCollector
from .iso27001 import ISO27001ControlMapper
from .nist_ssdf import NISTSSDFPracticeValidator
from .audit_trail import AuditTrailGenerator
from .reporting import ComplianceReportGenerator


@dataclass
class ComplianceConfig:
    """Configuration for compliance evidence generation"""
    enabled: bool = True
    frameworks: Set[str] = field(default_factory=lambda: {"SOC2", "ISO27001", "NIST-SSDF"})
    evidence_retention_days: int = 90
    audit_trail: bool = True
    automated_collection: bool = True
    artifacts_path: str = ".claude/.artifacts/compliance/"
    performance_overhead_limit: float = 0.015  # 1.5%
    
    # Framework-specific settings
    soc2_enabled: bool = True
    iso27001_enabled: bool = True
    nist_ssdf_enabled: bool = True
    
    @classmethod
    def from_enterprise_config(cls, config_path: str) -> 'ComplianceConfig':
        """Load compliance configuration from enterprise_config.yaml"""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            enterprise = config.get('enterprise', {})
            compliance = enterprise.get('compliance', {})
            
            if not compliance.get('enabled', False):
                return cls(enabled=False)
            
            return cls(
                enabled=compliance.get('enabled', True),
                frameworks=set(compliance.get('frameworks', ["SOC2", "ISO27001", "NIST-SSDF"])),
                evidence_retention_days=compliance.get('evidence', {}).get('retention_days', 90),
                audit_trail=compliance.get('evidence', {}).get('audit_trail', True),
                automated_collection=compliance.get('evidence', {}).get('automated_collection', True),
                artifacts_path=enterprise.get('artifacts', {}).get('base_path', ".claude/.artifacts/") + "compliance/",
                soc2_enabled="SOC2" in compliance.get('frameworks', []),
                iso27001_enabled="ISO27001" in compliance.get('frameworks', []),
                nist_ssdf_enabled="NIST-SSDF" in compliance.get('frameworks', [])
            )
        except Exception as e:
            logging.warning(f"Failed to load enterprise config: {e}. Using defaults.")
            return cls()


@dataclass
class EvidenceMetadata:
    """Metadata for compliance evidence"""
    framework: str
    control_id: str
    evidence_type: str
    collection_timestamp: datetime
    retention_until: datetime
    file_hash: Optional[str] = None
    validation_status: str = "pending"
    automated: bool = True


class PerformanceMonitor:
    """Monitor compliance module performance overhead"""
    
    def __init__(self, overhead_limit: float = 0.015):
        self.overhead_limit = overhead_limit
        self.start_time: Optional[float] = None
        self.baseline_time: Optional[float] = None
        
    def start_baseline(self):
        """Start baseline performance measurement"""
        self.baseline_time = time.perf_counter()
        
    def start_compliance(self):
        """Start compliance operation measurement"""
        self.start_time = time.perf_counter()
        
    def check_overhead(self) -> Dict[str, Any]:
        """Check if performance overhead is within limits"""
        if not self.start_time or not self.baseline_time:
            return {"status": "incomplete", "overhead": 0.0}
            
        compliance_time = time.perf_counter() - self.start_time
        overhead_ratio = compliance_time / (self.baseline_time or 1.0)
        
        return {
            "status": "within_limits" if overhead_ratio <= self.overhead_limit else "exceeded",
            "overhead": overhead_ratio,
            "limit": self.overhead_limit,
            "compliance_time_ms": compliance_time * 1000,
            "baseline_time_ms": self.baseline_time * 1000
        }


class ComplianceOrchestrator:
    """Main orchestrator for compliance evidence generation"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config = ComplianceConfig.from_enterprise_config(
            config_path or "./analyzer/config/enterprise_config.yaml"
        )
        self.logger = logging.getLogger(__name__)
        self.performance_monitor = PerformanceMonitor(self.config.performance_overhead_limit)
        
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
            return {"status": "disabled", "evidence": {}}
            
        self.performance_monitor.start_compliance()
        start_time = datetime.now()
        
        try:
            evidence_results = {}
            
            # Collect evidence from all frameworks concurrently
            tasks = []
            for framework, collector in self.collectors.items():
                task = asyncio.create_task(
                    self._collect_framework_evidence(framework, collector, project_path)
                )
                tasks.append((framework, task))
            
            # Wait for all collections to complete
            for framework, task in tasks:
                try:
                    evidence_results[framework] = await task
                except Exception as e:
                    self.logger.error(f"Failed to collect {framework} evidence: {e}")
                    evidence_results[framework] = {"status": "error", "error": str(e)}
            
            # Generate audit trail
            if self.config.audit_trail:
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
                "performance": performance_check
            }
            
        except Exception as e:
            self.logger.error(f"Compliance evidence collection failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "collection_timestamp": start_time.isoformat()
            }
    
    async def _collect_framework_evidence(self, framework: str, collector, project_path: str) -> Dict[str, Any]:
        """Collect evidence for a specific framework"""
        try:
            if hasattr(collector, 'collect_evidence'):
                return await collector.collect_evidence(project_path)
            else:
                return await collector.analyze_compliance(project_path)
        except Exception as e:
            self.logger.error(f"Failed to collect {framework} evidence: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _save_evidence_metadata(self, evidence_results: Dict[str, Any]):
        """Save evidence metadata for retention management"""
        metadata_file = Path(self.config.artifacts_path) / "evidence_metadata.json"
        
        try:
            # Load existing metadata
            existing_metadata = []
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    existing_metadata = json.load(f)
            
            # Add new metadata entries
            collection_time = datetime.now()
            retention_until = collection_time + timedelta(days=self.config.evidence_retention_days)
            
            for framework, evidence in evidence_results.items():
                if framework in ['audit_trail', 'performance', 'compliance_report']:
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
                    "automated": metadata.automated
                })
            
            # Save updated metadata
            with open(metadata_file, 'w') as f:
                json.dump(existing_metadata, f, indent=2)
                
        except Exception as e:
            self.logger.error(f"Failed to save evidence metadata: {e}")
    
    async def cleanup_expired_evidence(self) -> Dict[str, Any]:
        """Clean up evidence that has exceeded retention period"""
        metadata_file = Path(self.config.artifacts_path) / "evidence_metadata.json"
        
        if not metadata_file.exists():
            return {"status": "no_metadata", "cleaned": 0}
        
        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            current_time = datetime.now()
            active_metadata = []
            cleaned_count = 0
            
            for entry in metadata:
                retention_until = datetime.fromisoformat(entry['retention_until'])
                if retention_until > current_time:
                    active_metadata.append(entry)
                else:
                    cleaned_count += 1
            
            # Save cleaned metadata
            with open(metadata_file, 'w') as f:
                json.dump(active_metadata, f, indent=2)
            
            return {
                "status": "success",
                "cleaned": cleaned_count,
                "remaining": len(active_metadata),
                "cleanup_timestamp": current_time.isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Failed to cleanup expired evidence: {e}")
            return {"status": "error", "error": str(e)}
    
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
            "automated_collection": self.config.automated_collection
        }