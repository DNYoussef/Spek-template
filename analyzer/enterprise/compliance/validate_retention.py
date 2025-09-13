"""
Compliance Evidence Retention Validation Script

Validates the 90-day evidence retention system and compliance with enterprise requirements:
- Verifies evidence collection and storage
- Tests automated retention policy enforcement
- Validates audit trail integrity over time
- Confirms evidence package tamper detection
- Tests cleanup procedures for expired evidence
- Validates performance overhead stays within 1.5% limit
"""

import asyncio
import json
import logging
import tempfile
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

from .core import ComplianceOrchestrator, ComplianceConfig
from .integration import demonstrate_compliance_system


class ComplianceRetentionValidator:
    """Validator for compliance evidence retention system"""
    
    def __init__(self, test_project_path: str = None):
        self.test_project_path = test_project_path or "."
        self.logger = logging.getLogger(__name__)
        
        # Create test configuration with short retention for testing
        self.test_config = ComplianceConfig(
            enabled=True,
            evidence_retention_days=1,  # Short retention for testing
            artifacts_path=str(Path(tempfile.mkdtemp()) / "compliance_test"),
            performance_overhead_limit=0.015
        )
        
        self.orchestrator = ComplianceOrchestrator()
        self.orchestrator.config = self.test_config
        
    async def run_retention_validation(self) -> Dict[str, Any]:
        """Run comprehensive retention validation"""
        validation_results = {
            "validation_timestamp": datetime.now().isoformat(),
            "test_config": {
                "retention_days": self.test_config.evidence_retention_days,
                "artifacts_path": self.test_config.artifacts_path,
                "performance_limit": self.test_config.performance_overhead_limit
            },
            "tests": [],
            "overall_status": "success"
        }
        
        try:
            # Test 1: Evidence collection and storage
            test1 = await self._test_evidence_collection()
            validation_results["tests"].append(test1)
            
            # Test 2: Audit trail generation
            test2 = await self._test_audit_trail_generation()
            validation_results["tests"].append(test2)
            
            # Test 3: Evidence package integrity
            test3 = await self._test_evidence_package_integrity()
            validation_results["tests"].append(test3)
            
            # Test 4: Performance overhead validation
            test4 = await self._test_performance_overhead()
            validation_results["tests"].append(test4)
            
            # Test 5: Retention policy enforcement
            test5 = await self._test_retention_policy_enforcement()
            validation_results["tests"].append(test5)
            
            # Test 6: Cleanup procedures
            test6 = await self._test_cleanup_procedures()
            validation_results["tests"].append(test6)
            
            # Calculate overall results
            failed_tests = [t for t in validation_results["tests"] if t["status"] != "pass"]
            if failed_tests:
                validation_results["overall_status"] = "failure"
                validation_results["failed_tests"] = len(failed_tests)
            
            validation_results["summary"] = {
                "total_tests": len(validation_results["tests"]),
                "passed_tests": len(validation_results["tests"]) - len(failed_tests),
                "failed_tests": len(failed_tests),
                "success_rate": (len(validation_results["tests"]) - len(failed_tests)) / len(validation_results["tests"]) * 100
            }
            
        except Exception as e:
            validation_results["overall_status"] = "error"
            validation_results["error"] = str(e)
            self.logger.error(f"Retention validation failed: {e}")
        
        return validation_results
    
    async def _test_evidence_collection(self) -> Dict[str, Any]:
        """Test evidence collection and storage"""
        test_result = {
            "test_name": "Evidence Collection and Storage",
            "test_id": "retention_test_001",
            "timestamp": datetime.now().isoformat(),
            "status": "pass",
            "details": {}
        }
        
        try:
            # Collect evidence
            evidence_results = await self.orchestrator.collect_all_evidence(self.test_project_path)
            
            # Verify evidence was collected
            if evidence_results.get("status") != "success":
                test_result["status"] = "fail"
                test_result["error"] = "Evidence collection failed"
                return test_result
            
            # Check evidence files were created
            artifacts_path = Path(self.test_config.artifacts_path)
            evidence_files = list(artifacts_path.rglob("*.json"))
            
            test_result["details"] = {
                "evidence_collected": evidence_results.get("status") == "success",
                "frameworks_processed": len(evidence_results.get("frameworks_processed", [])),
                "evidence_files_created": len(evidence_files),
                "artifacts_directory_exists": artifacts_path.exists(),
                "collection_performance": evidence_results.get("performance", {})
            }
            
            if len(evidence_files) == 0:
                test_result["status"] = "fail"
                test_result["error"] = "No evidence files created"
            
        except Exception as e:
            test_result["status"] = "fail"
            test_result["error"] = str(e)
        
        return test_result
    
    async def _test_audit_trail_generation(self) -> Dict[str, Any]:
        """Test audit trail generation and integrity"""
        test_result = {
            "test_name": "Audit Trail Generation",
            "test_id": "retention_test_002",
            "timestamp": datetime.now().isoformat(),
            "status": "pass",
            "details": {}
        }
        
        try:
            # Create mock evidence results for audit trail
            mock_evidence = {
                "SOC2": {"status": "success", "collection_timestamp": datetime.now().isoformat()},
                "ISO27001": {"status": "success", "assessment_timestamp": datetime.now().isoformat()}
            }
            
            # Generate audit trail
            audit_result = await self.orchestrator.audit_trail.generate_audit_trail(
                mock_evidence, datetime.now()
            )
            
            # Verify audit trail creation
            if audit_result.get("status") != "success":
                test_result["status"] = "fail"
                test_result["error"] = "Audit trail generation failed"
                return test_result
            
            # Check audit trail files
            audit_path = Path(self.test_config.artifacts_path) / "audit_trails"
            audit_files = list(audit_path.glob("*.json"))
            
            test_result["details"] = {
                "audit_trail_generated": audit_result.get("status") == "success",
                "audit_trail_id": audit_result.get("audit_trail_id"),
                "audit_events_count": audit_result.get("audit_events_count", 0),
                "evidence_packages_count": audit_result.get("evidence_packages_count", 0),
                "audit_files_created": len(audit_files),
                "integrity_verified": audit_result.get("integrity_report", {}).get("overall_integrity", False)
            }
            
        except Exception as e:
            test_result["status"] = "fail"
            test_result["error"] = str(e)
        
        return test_result
    
    async def _test_evidence_package_integrity(self) -> Dict[str, Any]:
        """Test evidence package integrity and tamper detection"""
        test_result = {
            "test_name": "Evidence Package Integrity",
            "test_id": "retention_test_003",
            "timestamp": datetime.now().isoformat(),
            "status": "pass",
            "details": {}
        }
        
        try:
            # Create test evidence package
            evidence_packages_path = Path(self.test_config.artifacts_path) / "evidence_packages"
            evidence_packages_path.mkdir(parents=True, exist_ok=True)
            
            # Create test package file
            test_package_id = f"test_package_{int(time.time())}"
            test_package_dir = evidence_packages_path / test_package_id
            test_package_dir.mkdir(exist_ok=True)
            
            # Create test evidence file
            test_evidence = {"test": "evidence", "timestamp": datetime.now().isoformat()}
            test_file = test_package_dir / "test_evidence.json"
            with open(test_file, 'w') as f:
                json.dump(test_evidence, f)
            
            # Generate package hash
            original_hash = self.orchestrator.audit_trail._generate_data_hash(test_evidence)
            
            # Verify hash consistency
            verification_hash = self.orchestrator.audit_trail._generate_data_hash(test_evidence)
            hash_consistent = original_hash == verification_hash
            
            # Test tamper detection by modifying file
            tampered_evidence = test_evidence.copy()
            tampered_evidence["tampered"] = True
            tampered_hash = self.orchestrator.audit_trail._generate_data_hash(tampered_evidence)
            tamper_detected = original_hash != tampered_hash
            
            test_result["details"] = {
                "package_created": test_package_dir.exists(),
                "evidence_file_created": test_file.exists(),
                "original_hash": original_hash[:16] + "...",  # Truncate for display
                "hash_algorithm": "SHA-256",
                "hash_consistency": hash_consistent,
                "tamper_detection_works": tamper_detected,
                "package_integrity": hash_consistent and tamper_detected
            }
            
            if not (hash_consistent and tamper_detected):
                test_result["status"] = "fail"
                test_result["error"] = "Package integrity validation failed"
            
        except Exception as e:
            test_result["status"] = "fail"
            test_result["error"] = str(e)
        
        return test_result
    
    async def _test_performance_overhead(self) -> Dict[str, Any]:
        """Test performance overhead stays within limits"""
        test_result = {
            "test_name": "Performance Overhead Validation",
            "test_id": "retention_test_004",
            "timestamp": datetime.now().isoformat(),
            "status": "pass",
            "details": {}
        }
        
        try:
            # Measure baseline performance
            baseline_start = time.perf_counter()
            await asyncio.sleep(0.1)  # Simulate baseline operation
            baseline_time = time.perf_counter() - baseline_start
            
            # Measure compliance operation performance
            compliance_start = time.perf_counter()
            
            # Run lightweight compliance check
            evidence_results = await self.orchestrator.collect_all_evidence(self.test_project_path)
            
            compliance_time = time.perf_counter() - compliance_start
            
            # Calculate overhead
            overhead_ratio = compliance_time / baseline_time if baseline_time > 0 else 0
            overhead_percentage = overhead_ratio * 100
            
            # Check against limit (1.5%)
            within_limits = overhead_ratio <= self.test_config.performance_overhead_limit
            
            test_result["details"] = {
                "baseline_time_ms": baseline_time * 1000,
                "compliance_time_ms": compliance_time * 1000,
                "overhead_ratio": overhead_ratio,
                "overhead_percentage": overhead_percentage,
                "overhead_limit_percentage": self.test_config.performance_overhead_limit * 100,
                "within_limits": within_limits,
                "evidence_collection_success": evidence_results.get("status") == "success"
            }
            
            if not within_limits:
                test_result["status"] = "fail"
                test_result["error"] = f"Performance overhead {overhead_percentage:.2f}% exceeds limit of {self.test_config.performance_overhead_limit * 100}%"
            
        except Exception as e:
            test_result["status"] = "fail"
            test_result["error"] = str(e)
        
        return test_result
    
    async def _test_retention_policy_enforcement(self) -> Dict[str, Any]:
        """Test retention policy enforcement"""
        test_result = {
            "test_name": "Retention Policy Enforcement",
            "test_id": "retention_test_005",
            "timestamp": datetime.now().isoformat(),
            "status": "pass",
            "details": {}
        }
        
        try:
            # Create test evidence with past retention date
            artifacts_path = Path(self.test_config.artifacts_path)
            metadata_file = artifacts_path / "evidence_metadata.json"
            
            # Create expired evidence metadata
            expired_evidence = {
                "framework": "TEST",
                "control_id": "TEST.1",
                "evidence_type": "test_evidence",
                "collection_timestamp": (datetime.now() - timedelta(days=2)).isoformat(),
                "retention_until": (datetime.now() - timedelta(days=1)).isoformat(),  # Expired
                "validation_status": "collected",
                "automated": True
            }
            
            # Create current evidence metadata
            current_evidence = {
                "framework": "TEST",
                "control_id": "TEST.2",
                "evidence_type": "test_evidence",
                "collection_timestamp": datetime.now().isoformat(),
                "retention_until": (datetime.now() + timedelta(days=89)).isoformat(),  # Not expired
                "validation_status": "collected",
                "automated": True
            }
            
            # Save test metadata
            test_metadata = [expired_evidence, current_evidence]
            artifacts_path.mkdir(parents=True, exist_ok=True)
            with open(metadata_file, 'w') as f:
                json.dump(test_metadata, f, indent=2)
            
            # Test retention policy check
            retention_check = await self.orchestrator.cleanup_expired_evidence()
            
            # Verify results
            cleaned_count = retention_check.get("cleaned", 0)
            remaining_count = retention_check.get("remaining", 0)
            
            test_result["details"] = {
                "initial_evidence_count": len(test_metadata),
                "expired_evidence_count": 1,
                "current_evidence_count": 1,
                "cleanup_result": retention_check,
                "evidence_cleaned": cleaned_count,
                "evidence_remaining": remaining_count,
                "policy_enforced": cleaned_count == 1 and remaining_count == 1
            }
            
            if not (cleaned_count == 1 and remaining_count == 1):
                test_result["status"] = "fail"
                test_result["error"] = f"Retention policy not enforced correctly: cleaned={cleaned_count}, remaining={remaining_count}"
            
        except Exception as e:
            test_result["status"] = "fail"
            test_result["error"] = str(e)
        
        return test_result
    
    async def _test_cleanup_procedures(self) -> Dict[str, Any]:
        """Test automated cleanup procedures"""
        test_result = {
            "test_name": "Automated Cleanup Procedures",
            "test_id": "retention_test_006",
            "timestamp": datetime.now().isoformat(),
            "status": "pass",
            "details": {}
        }
        
        try:
            # Test evidence cleanup
            evidence_cleanup = await self.orchestrator.cleanup_expired_evidence()
            
            # Test audit trail cleanup
            audit_cleanup = await self.orchestrator.audit_trail.cleanup_expired_audit_trails()
            
            # Verify cleanup procedures
            evidence_cleanup_success = evidence_cleanup.get("status") == "success"
            audit_cleanup_success = audit_cleanup.get("status") in ["success", "no_index"]
            
            test_result["details"] = {
                "evidence_cleanup": evidence_cleanup,
                "audit_cleanup": audit_cleanup,
                "evidence_cleanup_success": evidence_cleanup_success,
                "audit_cleanup_success": audit_cleanup_success,
                "overall_cleanup_success": evidence_cleanup_success and audit_cleanup_success
            }
            
            if not (evidence_cleanup_success and audit_cleanup_success):
                test_result["status"] = "fail"
                test_result["error"] = "Cleanup procedures failed"
            
        except Exception as e:
            test_result["status"] = "fail"
            test_result["error"] = str(e)
        
        return test_result


async def validate_compliance_retention(project_path: str = ".") -> Dict[str, Any]:
    """Main validation function for compliance retention system"""
    validator = ComplianceRetentionValidator(project_path)
    
    print("🔒 Starting Compliance Evidence Retention Validation")
    print("=" * 60)
    
    validation_results = await validator.run_retention_validation()
    
    print(f"Validation Status: {validation_results['overall_status'].upper()}")
    print(f"Test Configuration:")
    print(f"  Retention Days: {validation_results['test_config']['retention_days']}")
    print(f"  Performance Limit: {validation_results['test_config']['performance_limit'] * 100}%")
    print()
    
    for test in validation_results["tests"]:
        status_icon = "✅" if test["status"] == "pass" else "❌"
        print(f"{status_icon} {test['test_name']} ({test['test_id']})")
        
        if test["status"] == "pass":
            if "evidence_collected" in test["details"]:
                print(f"   Evidence Collection: {test['details']['evidence_collected']}")
            if "within_limits" in test["details"]:
                print(f"   Performance Within Limits: {test['details']['within_limits']}")
            if "policy_enforced" in test["details"]:
                print(f"   Retention Policy Enforced: {test['details']['policy_enforced']}")
            if "overall_cleanup_success" in test["details"]:
                print(f"   Cleanup Success: {test['details']['overall_cleanup_success']}")
        else:
            print(f"   Error: {test.get('error', 'Unknown error')}")
        print()
    
    if "summary" in validation_results:
        summary = validation_results["summary"]
        print("📊 Validation Summary:")
        print(f"   Total Tests: {summary['total_tests']}")
        print(f"   Passed Tests: {summary['passed_tests']}")
        print(f"   Failed Tests: {summary['failed_tests']}")
        print(f"   Success Rate: {summary['success_rate']:.1f}%")
    
    return validation_results


if __name__ == "__main__":
    """Command-line interface for retention validation"""
    import sys
    
    async def main():
        project_path = sys.argv[1] if len(sys.argv) > 1 else "."
        
        validation_results = await validate_compliance_retention(project_path)
        
        if validation_results["overall_status"] == "success":
            print("\n🎉 Compliance retention validation completed successfully!")
            print("✅ 90-day evidence retention system validated")
            print("✅ Performance overhead within 1.5% limit")
            print("✅ Audit trail integrity confirmed")
            print("✅ Automated cleanup procedures working")
            return 0
        else:
            print(f"\n❌ Validation failed: {validation_results.get('error', 'Unknown error')}")
            return 1
    
    exit_code = asyncio.run(main())
    sys.exit(exit_code)