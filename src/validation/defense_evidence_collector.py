"""
Defense Evidence Collector
Comprehensive evidence collection for defense audits with chain of custody.
"""

import os
import json
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, asdict, field
from pathlib import Path
import logging
import sqlite3
import zipfile
import tempfile
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption

@dataclass
class EvidenceItem:
    """Individual piece of evidence with metadata."""
    evidence_id: str
    evidence_type: str  # 'code_change', 'metric_improvement', 'test_result', 'security_scan'
    timestamp: datetime
    source_location: str
    content_hash: str
    content: Union[str, Dict, bytes]
    metadata: Dict[str, Any]
    chain_of_custody: List[Dict[str, Any]] = field(default_factory=list)
    verification_status: str = "pending"  # 'pending', 'verified', 'rejected'
    digital_signature: Optional[str] = None

@dataclass
class AuditPackage:
    """Complete audit package with all evidence."""
    package_id: str
    creation_timestamp: datetime
    audit_scope: str
    evidence_items: List[EvidenceItem]
    quality_metrics: Dict[str, Any]
    compliance_certifications: List[Dict[str, Any]]
    validation_results: Dict[str, Any]
    package_hash: str
    digital_signature: Optional[str] = None
    chain_verification: Dict[str, Any] = field(default_factory=dict)

class DefenseEvidenceCollector:
    """
    Comprehensive evidence collection system for defense industry compliance.
    Provides auditable trail of quality improvements with cryptographic verification.
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._get_default_config()
        self.logger = self._setup_logging()
        self.evidence_db_path = self.config.get('evidence_db_path', '.claude/.artifacts/evidence.db')
        self.evidence_storage = self.config.get('evidence_storage', '.claude/.artifacts/evidence/')
        self.crypto_keys = self._initialize_crypto_keys()
        self._initialize_database()

    def _get_default_config(self) -> Dict:
        """Default configuration for evidence collection."""
        return {
            'evidence_db_path': '.claude/.artifacts/evidence.db',
            'evidence_storage': '.claude/.artifacts/evidence/',
            'retention_days': 2555,  # 7 years for defense compliance
            'audit_standards': ['NASA-POT10', 'ISO-27001', 'NIST-800-53'],
            'verification_requirements': {
                'min_evidence_items': 5,
                'required_evidence_types': [
                    'code_change',
                    'metric_improvement',
                    'test_result',
                    'security_scan'
                ],
                'chain_integrity_threshold': 0.95
            },
            'encryption': {
                'algorithm': 'RSA',
                'key_size': 2048,
                'hash_algorithm': 'SHA256'
            },
            'compliance_mappings': {
                'NASA-POT10': {
                    'section_3_2': 'code_quality_evidence',
                    'section_4_1': 'testing_evidence',
                    'section_5_3': 'security_evidence',
                    'section_6_2': 'performance_evidence'
                },
                'ISO-27001': {
                    'A.12.6.1': 'secure_development_evidence',
                    'A.14.2.1': 'security_testing_evidence'
                },
                'NIST-800-53': {
                    'SA-11': 'developer_security_testing',
                    'SI-10': 'information_input_validation'
                }
            }
        }

    def _setup_logging(self) -> logging.Logger:
        """Setup secure logging for evidence collection."""
        logger = logging.getLogger('DefenseEvidenceCollector')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            # Create evidence directory if it doesn't exist
            os.makedirs(os.path.dirname(self.config.get('evidence_storage', '.claude/.artifacts/evidence/')), exist_ok=True)

            # File handler for audit trail
            file_handler = logging.FileHandler(
                os.path.join(self.config.get('evidence_storage', '.claude/.artifacts/evidence/'), 'audit_trail.log')
            )
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - [AUDIT] %(message)s'
            )
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)

            # Console handler
            console_handler = logging.StreamHandler()
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            console_handler.setFormatter(console_formatter)
            logger.addHandler(console_handler)

        return logger

    def _initialize_crypto_keys(self) -> Dict[str, Any]:
        """Initialize cryptographic keys for evidence signing."""
        keys_dir = os.path.join(self.config.get('evidence_storage', '.claude/.artifacts/evidence/'), 'keys')
        os.makedirs(keys_dir, exist_ok=True)

        private_key_path = os.path.join(keys_dir, 'private_key.pem')
        public_key_path = os.path.join(keys_dir, 'public_key.pem')

        if not os.path.exists(private_key_path):
            # Generate new key pair
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=self.config['encryption']['key_size']
            )

            # Save private key
            with open(private_key_path, 'wb') as f:
                f.write(private_key.private_bytes(
                    encoding=Encoding.PEM,
                    format=PrivateFormat.PKCS8,
                    encryption_algorithm=NoEncryption()
                ))

            # Save public key
            public_key = private_key.public_key()
            with open(public_key_path, 'wb') as f:
                f.write(public_key.public_bytes(
                    encoding=Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ))

            self.logger.info("Generated new cryptographic key pair for evidence signing")

        else:
            # Load existing keys
            with open(private_key_path, 'rb') as f:
                private_key = serialization.load_pem_private_key(f.read(), password=None)

            with open(public_key_path, 'rb') as f:
                public_key = serialization.load_pem_public_key(f.read())

        return {
            'private_key': private_key,
            'public_key': public_key,
            'private_key_path': private_key_path,
            'public_key_path': public_key_path
        }

    def _initialize_database(self):
        """Initialize evidence database."""
        os.makedirs(os.path.dirname(self.evidence_db_path), exist_ok=True)

        conn = sqlite3.connect(self.evidence_db_path)
        cursor = conn.cursor()

        # Evidence items table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS evidence_items (
                evidence_id TEXT PRIMARY KEY,
                evidence_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                source_location TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT NOT NULL,
                chain_of_custody TEXT NOT NULL,
                verification_status TEXT DEFAULT 'pending',
                digital_signature TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Audit packages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_packages (
                package_id TEXT PRIMARY KEY,
                creation_timestamp TEXT NOT NULL,
                audit_scope TEXT NOT NULL,
                quality_metrics TEXT NOT NULL,
                compliance_certifications TEXT NOT NULL,
                validation_results TEXT NOT NULL,
                package_hash TEXT NOT NULL,
                digital_signature TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Chain of custody events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS custody_events (
                event_id TEXT PRIMARY KEY,
                evidence_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                actor TEXT NOT NULL,
                action TEXT NOT NULL,
                metadata TEXT,
                FOREIGN KEY (evidence_id) REFERENCES evidence_items (evidence_id)
            )
        ''')

        conn.commit()
        conn.close()

    def collect_code_change_evidence(self,
                                   change_data: Dict[str, Any],
                                   source_commit: str,
                                   module_name: str) -> EvidenceItem:
        """Collect evidence for code changes."""

        evidence_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)

        # Calculate content hash
        content_str = json.dumps(change_data, sort_keys=True)
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()

        # Create evidence item
        evidence = EvidenceItem(
            evidence_id=evidence_id,
            evidence_type='code_change',
            timestamp=timestamp,
            source_location=f"{module_name}@{source_commit}",
            content_hash=content_hash,
            content=change_data,
            metadata={
                'commit_hash': source_commit,
                'module_name': module_name,
                'file_count': len(change_data.get('files', [])),
                'lines_changed': change_data.get('lines_changed', 0),
                'change_type': change_data.get('change_type', 'modification'),
                'collection_method': 'automated_git_analysis'
            }
        )

        # Add to chain of custody
        self._add_custody_event(evidence, 'collection', 'automated_system', 'Evidence collected from git repository')

        # Sign the evidence
        evidence.digital_signature = self._sign_evidence(evidence)

        # Store in database
        self._store_evidence(evidence)

        self.logger.info(f"Collected code change evidence: {evidence_id} for {module_name}")

        return evidence

    def collect_metric_improvement_evidence(self,
                                          before_metrics: Dict[str, Any],
                                          after_metrics: Dict[str, Any],
                                          improvement_analysis: Dict[str, Any],
                                          module_name: str) -> EvidenceItem:
        """Collect evidence for metric improvements."""

        evidence_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)

        # Compile evidence content
        evidence_content = {
            'before_metrics': before_metrics,
            'after_metrics': after_metrics,
            'improvement_analysis': improvement_analysis,
            'metrics_comparison': self._calculate_metric_deltas(before_metrics, after_metrics)
        }

        content_str = json.dumps(evidence_content, sort_keys=True)
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()

        evidence = EvidenceItem(
            evidence_id=evidence_id,
            evidence_type='metric_improvement',
            timestamp=timestamp,
            source_location=module_name,
            content_hash=content_hash,
            content=evidence_content,
            metadata={
                'module_name': module_name,
                'metrics_analyzed': list(before_metrics.keys()),
                'improvement_count': len([k for k, v in evidence_content['metrics_comparison'].items() if v > 0]),
                'collection_method': 'automated_metrics_analysis',
                'analysis_confidence': improvement_analysis.get('confidence', 0.0)
            }
        )

        self._add_custody_event(evidence, 'collection', 'metrics_analyzer', 'Metrics improvement evidence collected')
        evidence.digital_signature = self._sign_evidence(evidence)
        self._store_evidence(evidence)

        self.logger.info(f"Collected metric improvement evidence: {evidence_id} for {module_name}")

        return evidence

    def collect_test_result_evidence(self,
                                   test_results: Dict[str, Any],
                                   test_coverage: Dict[str, Any],
                                   module_name: str) -> EvidenceItem:
        """Collect evidence for test results."""

        evidence_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)

        evidence_content = {
            'test_results': test_results,
            'test_coverage': test_coverage,
            'test_summary': {
                'total_tests': test_results.get('total', 0),
                'passed_tests': test_results.get('passed', 0),
                'failed_tests': test_results.get('failed', 0),
                'coverage_percentage': test_coverage.get('percentage', 0.0)
            }
        }

        content_str = json.dumps(evidence_content, sort_keys=True)
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()

        evidence = EvidenceItem(
            evidence_id=evidence_id,
            evidence_type='test_result',
            timestamp=timestamp,
            source_location=module_name,
            content_hash=content_hash,
            content=evidence_content,
            metadata={
                'module_name': module_name,
                'test_framework': test_results.get('framework', 'unknown'),
                'execution_time': test_results.get('execution_time', 0),
                'collection_method': 'automated_test_execution',
                'test_quality_score': self._calculate_test_quality_score(test_results, test_coverage)
            }
        )

        self._add_custody_event(evidence, 'collection', 'test_runner', 'Test execution evidence collected')
        evidence.digital_signature = self._sign_evidence(evidence)
        self._store_evidence(evidence)

        self.logger.info(f"Collected test result evidence: {evidence_id} for {module_name}")

        return evidence

    def collect_security_scan_evidence(self,
                                     scan_results: Dict[str, Any],
                                     scan_tool: str,
                                     module_name: str) -> EvidenceItem:
        """Collect evidence for security scans."""

        evidence_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)

        # Sanitize scan results for storage
        sanitized_results = self._sanitize_security_results(scan_results)

        content_str = json.dumps(sanitized_results, sort_keys=True)
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()

        evidence = EvidenceItem(
            evidence_id=evidence_id,
            evidence_type='security_scan',
            timestamp=timestamp,
            source_location=module_name,
            content_hash=content_hash,
            content=sanitized_results,
            metadata={
                'module_name': module_name,
                'scan_tool': scan_tool,
                'scan_version': scan_results.get('tool_version', 'unknown'),
                'vulnerability_count': len(scan_results.get('vulnerabilities', [])),
                'security_score': scan_results.get('security_score', 0),
                'collection_method': 'automated_security_scan'
            }
        )

        self._add_custody_event(evidence, 'collection', f'security_scanner_{scan_tool}', 'Security scan evidence collected')
        evidence.digital_signature = self._sign_evidence(evidence)
        self._store_evidence(evidence)

        self.logger.info(f"Collected security scan evidence: {evidence_id} for {module_name}")

        return evidence

    def _calculate_metric_deltas(self, before: Dict[str, Any], after: Dict[str, Any]) -> Dict[str, float]:
        """Calculate metric deltas between before and after."""
        deltas = {}

        for metric in before.keys():
            if metric in after:
                try:
                    before_val = float(before[metric])
                    after_val = float(after[metric])
                    delta = after_val - before_val
                    deltas[metric] = delta
                except (ValueError, TypeError):
                    deltas[metric] = 0.0

        return deltas

    def _calculate_test_quality_score(self, test_results: Dict, test_coverage: Dict) -> float:
        """Calculate test quality score."""
        total_tests = test_results.get('total', 0)
        passed_tests = test_results.get('passed', 0)
        coverage_pct = test_coverage.get('percentage', 0.0)

        if total_tests == 0:
            return 0.0

        pass_rate = passed_tests / total_tests
        coverage_score = coverage_pct / 100.0

        # Weighted combination
        quality_score = 0.6 * pass_rate + 0.4 * coverage_score

        return min(quality_score, 1.0)

    def _sanitize_security_results(self, scan_results: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize security scan results for safe storage."""
        sanitized = dict(scan_results)

        # Remove potentially sensitive information
        sensitive_fields = ['api_keys', 'passwords', 'tokens', 'secrets']

        def recursive_sanitize(obj):
            if isinstance(obj, dict):
                return {
                    k: recursive_sanitize(v) if k.lower() not in sensitive_fields else '[REDACTED]'
                    for k, v in obj.items()
                }
            elif isinstance(obj, list):
                return [recursive_sanitize(item) for item in obj]
            else:
                return obj

        return recursive_sanitize(sanitized)

    def _add_custody_event(self, evidence: EvidenceItem, event_type: str, actor: str, action: str):
        """Add event to chain of custody."""
        event = {
            'event_id': str(uuid.uuid4()),
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_type': event_type,
            'actor': actor,
            'action': action,
            'metadata': {
                'evidence_hash': evidence.content_hash,
                'verification_status': evidence.verification_status
            }
        }

        evidence.chain_of_custody.append(event)

        # Store in database
        conn = sqlite3.connect(self.evidence_db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO custody_events
            (event_id, evidence_id, event_type, timestamp, actor, action, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            event['event_id'],
            evidence.evidence_id,
            event_type,
            event['timestamp'],
            actor,
            action,
            json.dumps(event['metadata'])
        ))

        conn.commit()
        conn.close()

    def _sign_evidence(self, evidence: EvidenceItem) -> str:
        """Digitally sign evidence for integrity verification."""
        try:
            # Create signature payload
            signature_data = {
                'evidence_id': evidence.evidence_id,
                'content_hash': evidence.content_hash,
                'timestamp': evidence.timestamp.isoformat(),
                'evidence_type': evidence.evidence_type
            }

            payload = json.dumps(signature_data, sort_keys=True).encode()

            # Sign with private key
            signature = self.crypto_keys['private_key'].sign(
                payload,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )

            return signature.hex()

        except Exception as e:
            self.logger.error(f"Failed to sign evidence {evidence.evidence_id}: {e}")
            return ""

    def verify_evidence_signature(self, evidence: EvidenceItem) -> bool:
        """Verify digital signature of evidence."""
        if not evidence.digital_signature:
            return False

        try:
            # Recreate signature payload
            signature_data = {
                'evidence_id': evidence.evidence_id,
                'content_hash': evidence.content_hash,
                'timestamp': evidence.timestamp.isoformat(),
                'evidence_type': evidence.evidence_type
            }

            payload = json.dumps(signature_data, sort_keys=True).encode()
            signature_bytes = bytes.fromhex(evidence.digital_signature)

            # Verify signature
            self.crypto_keys['public_key'].verify(
                signature_bytes,
                payload,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )

            return True

        except Exception as e:
            self.logger.error(f"Failed to verify signature for evidence {evidence.evidence_id}: {e}")
            return False

    def _store_evidence(self, evidence: EvidenceItem):
        """Store evidence in database."""
        conn = sqlite3.connect(self.evidence_db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT OR REPLACE INTO evidence_items
            (evidence_id, evidence_type, timestamp, source_location, content_hash,
             content, metadata, chain_of_custody, verification_status, digital_signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            evidence.evidence_id,
            evidence.evidence_type,
            evidence.timestamp.isoformat(),
            evidence.source_location,
            evidence.content_hash,
            json.dumps(evidence.content),
            json.dumps(evidence.metadata),
            json.dumps(evidence.chain_of_custody),
            evidence.verification_status,
            evidence.digital_signature
        ))

        conn.commit()
        conn.close()

    def create_audit_package(self,
                           evidence_items: List[EvidenceItem],
                           audit_scope: str,
                           quality_metrics: Dict[str, Any],
                           validation_results: Dict[str, Any]) -> AuditPackage:
        """Create comprehensive audit package."""

        package_id = str(uuid.uuid4())
        creation_timestamp = datetime.now(timezone.utc)

        # Generate compliance certifications
        compliance_certifications = self._generate_compliance_certifications(
            evidence_items, quality_metrics, validation_results
        )

        # Calculate package hash
        package_data = {
            'evidence_ids': [e.evidence_id for e in evidence_items],
            'audit_scope': audit_scope,
            'quality_metrics': quality_metrics,
            'validation_results': validation_results
        }
        package_content = json.dumps(package_data, sort_keys=True)
        package_hash = hashlib.sha256(package_content.encode()).hexdigest()

        # Create audit package
        audit_package = AuditPackage(
            package_id=package_id,
            creation_timestamp=creation_timestamp,
            audit_scope=audit_scope,
            evidence_items=evidence_items,
            quality_metrics=quality_metrics,
            compliance_certifications=compliance_certifications,
            validation_results=validation_results,
            package_hash=package_hash
        )

        # Verify chain integrity
        audit_package.chain_verification = self._verify_chain_integrity(evidence_items)

        # Sign the package
        audit_package.digital_signature = self._sign_audit_package(audit_package)

        # Store package
        self._store_audit_package(audit_package)

        self.logger.info(f"Created audit package: {package_id} with {len(evidence_items)} evidence items")

        return audit_package

    def _generate_compliance_certifications(self,
                                          evidence_items: List[EvidenceItem],
                                          quality_metrics: Dict[str, Any],
                                          validation_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate compliance certifications based on evidence."""

        certifications = []

        for standard in self.config['audit_standards']:
            certification = self._assess_compliance_standard(
                standard, evidence_items, quality_metrics, validation_results
            )
            certifications.append(certification)

        return certifications

    def _assess_compliance_standard(self,
                                  standard: str,
                                  evidence_items: List[EvidenceItem],
                                  quality_metrics: Dict[str, Any],
                                  validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Assess compliance with specific standard."""

        evidence_by_type = {}
        for item in evidence_items:
            if item.evidence_type not in evidence_by_type:
                evidence_by_type[item.evidence_type] = []
            evidence_by_type[item.evidence_type].append(item)

        if standard == 'NASA-POT10':
            return self._assess_nasa_pot10_compliance(
                evidence_by_type, quality_metrics, validation_results
            )
        elif standard == 'ISO-27001':
            return self._assess_iso27001_compliance(
                evidence_by_type, quality_metrics, validation_results
            )
        elif standard == 'NIST-800-53':
            return self._assess_nist80053_compliance(
                evidence_by_type, quality_metrics, validation_results
            )
        else:
            return {
                'standard': standard,
                'compliance_status': 'unknown',
                'score': 0.0,
                'requirements_met': [],
                'requirements_missed': ['Assessment not implemented']
            }

    def _assess_nasa_pot10_compliance(self,
                                    evidence_by_type: Dict[str, List[EvidenceItem]],
                                    quality_metrics: Dict[str, Any],
                                    validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Assess NASA POT10 compliance."""

        requirements_met = []
        requirements_missed = []
        score = 0.0

        # Section 3.2: Code Quality Evidence
        if 'code_change' in evidence_by_type and quality_metrics.get('maintainability_index', 0) > 60:
            requirements_met.append('3.2 - Code Quality Standards')
            score += 0.25
        else:
            requirements_missed.append('3.2 - Code Quality Standards')

        # Section 4.1: Testing Evidence
        if 'test_result' in evidence_by_type and quality_metrics.get('test_coverage', 0) > 80:
            requirements_met.append('4.1 - Testing Requirements')
            score += 0.25
        else:
            requirements_missed.append('4.1 - Testing Requirements')

        # Section 5.3: Security Evidence
        if 'security_scan' in evidence_by_type and quality_metrics.get('security_score', 0) > 85:
            requirements_met.append('5.3 - Security Standards')
            score += 0.25
        else:
            requirements_missed.append('5.3 - Security Standards')

        # Section 6.2: Performance Evidence
        if validation_results.get('performance_validated', False):
            requirements_met.append('6.2 - Performance Standards')
            score += 0.25
        else:
            requirements_missed.append('6.2 - Performance Standards')

        compliance_status = 'full' if score >= 0.9 else 'partial' if score >= 0.6 else 'non-compliant'

        return {
            'standard': 'NASA-POT10',
            'compliance_status': compliance_status,
            'score': score,
            'requirements_met': requirements_met,
            'requirements_missed': requirements_missed,
            'assessment_timestamp': datetime.now(timezone.utc).isoformat()
        }

    def _assess_iso27001_compliance(self,
                                  evidence_by_type: Dict[str, List[EvidenceItem]],
                                  quality_metrics: Dict[str, Any],
                                  validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Assess ISO 27001 compliance."""

        requirements_met = []
        requirements_missed = []
        score = 0.0

        # A.12.6.1: Secure Development
        if 'security_scan' in evidence_by_type and len(evidence_by_type['security_scan']) > 0:
            requirements_met.append('A.12.6.1 - Secure Development')
            score += 0.5
        else:
            requirements_missed.append('A.12.6.1 - Secure Development')

        # A.14.2.1: Security Testing
        if 'test_result' in evidence_by_type and quality_metrics.get('security_test_coverage', 0) > 70:
            requirements_met.append('A.14.2.1 - Security Testing')
            score += 0.5
        else:
            requirements_missed.append('A.14.2.1 - Security Testing')

        compliance_status = 'full' if score >= 0.9 else 'partial' if score >= 0.6 else 'non-compliant'

        return {
            'standard': 'ISO-27001',
            'compliance_status': compliance_status,
            'score': score,
            'requirements_met': requirements_met,
            'requirements_missed': requirements_missed,
            'assessment_timestamp': datetime.now(timezone.utc).isoformat()
        }

    def _assess_nist80053_compliance(self,
                                   evidence_by_type: Dict[str, List[EvidenceItem]],
                                   quality_metrics: Dict[str, Any],
                                   validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Assess NIST 800-53 compliance."""

        requirements_met = []
        requirements_missed = []
        score = 0.0

        # SA-11: Developer Security Testing
        if 'security_scan' in evidence_by_type and 'test_result' in evidence_by_type:
            requirements_met.append('SA-11 - Developer Security Testing')
            score += 0.5
        else:
            requirements_missed.append('SA-11 - Developer Security Testing')

        # SI-10: Information Input Validation
        if validation_results.get('input_validation_tested', False):
            requirements_met.append('SI-10 - Information Input Validation')
            score += 0.5
        else:
            requirements_missed.append('SI-10 - Information Input Validation')

        compliance_status = 'full' if score >= 0.9 else 'partial' if score >= 0.6 else 'non-compliant'

        return {
            'standard': 'NIST-800-53',
            'compliance_status': compliance_status,
            'score': score,
            'requirements_met': requirements_met,
            'requirements_missed': requirements_missed,
            'assessment_timestamp': datetime.now(timezone.utc).isoformat()
        }

    def _verify_chain_integrity(self, evidence_items: List[EvidenceItem]) -> Dict[str, Any]:
        """Verify chain of custody integrity for all evidence."""

        total_items = len(evidence_items)
        verified_items = 0
        broken_chains = []

        for evidence in evidence_items:
            if self._verify_single_chain(evidence):
                verified_items += 1
            else:
                broken_chains.append(evidence.evidence_id)

        integrity_score = verified_items / total_items if total_items > 0 else 0.0

        return {
            'integrity_score': integrity_score,
            'total_items': total_items,
            'verified_items': verified_items,
            'broken_chains': broken_chains,
            'verification_timestamp': datetime.now(timezone.utc).isoformat(),
            'meets_threshold': integrity_score >= self.config['verification_requirements']['chain_integrity_threshold']
        }

    def _verify_single_chain(self, evidence: EvidenceItem) -> bool:
        """Verify chain of custody for single evidence item."""

        # Check digital signature
        if not self.verify_evidence_signature(evidence):
            return False

        # Check chain completeness
        if not evidence.chain_of_custody:
            return False

        # Verify chain events are properly ordered
        timestamps = [event['timestamp'] for event in evidence.chain_of_custody]
        sorted_timestamps = sorted(timestamps)

        return timestamps == sorted_timestamps

    def _sign_audit_package(self, audit_package: AuditPackage) -> str:
        """Sign audit package for integrity verification."""

        try:
            package_data = {
                'package_id': audit_package.package_id,
                'package_hash': audit_package.package_hash,
                'creation_timestamp': audit_package.creation_timestamp.isoformat(),
                'evidence_count': len(audit_package.evidence_items)
            }

            payload = json.dumps(package_data, sort_keys=True).encode()

            signature = self.crypto_keys['private_key'].sign(
                payload,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )

            return signature.hex()

        except Exception as e:
            self.logger.error(f"Failed to sign audit package {audit_package.package_id}: {e}")
            return ""

    def _store_audit_package(self, audit_package: AuditPackage):
        """Store audit package in database."""

        conn = sqlite3.connect(self.evidence_db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT OR REPLACE INTO audit_packages
            (package_id, creation_timestamp, audit_scope, quality_metrics,
             compliance_certifications, validation_results, package_hash, digital_signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            audit_package.package_id,
            audit_package.creation_timestamp.isoformat(),
            audit_package.audit_scope,
            json.dumps(audit_package.quality_metrics),
            json.dumps(audit_package.compliance_certifications),
            json.dumps(audit_package.validation_results),
            audit_package.package_hash,
            audit_package.digital_signature
        ))

        conn.commit()
        conn.close()

    def export_audit_package(self, package_id: str, export_path: str) -> str:
        """Export audit package to secure archive."""

        # Retrieve package from database
        audit_package = self._retrieve_audit_package(package_id)
        if not audit_package:
            raise ValueError(f"Audit package {package_id} not found")

        # Create temporary directory for export
        with tempfile.TemporaryDirectory() as temp_dir:
            # Export evidence files
            evidence_dir = os.path.join(temp_dir, 'evidence')
            os.makedirs(evidence_dir)

            for evidence in audit_package.evidence_items:
                evidence_file = os.path.join(evidence_dir, f"{evidence.evidence_id}.json")
                with open(evidence_file, 'w') as f:
                    json.dump(asdict(evidence), f, indent=2, default=str)

            # Export package metadata
            package_file = os.path.join(temp_dir, 'audit_package.json')
            with open(package_file, 'w') as f:
                json.dump(asdict(audit_package), f, indent=2, default=str)

            # Export public key for verification
            public_key_file = os.path.join(temp_dir, 'public_key.pem')
            with open(public_key_file, 'wb') as f:
                f.write(self.crypto_keys['public_key'].public_bytes(
                    encoding=Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ))

            # Create verification instructions
            instructions_file = os.path.join(temp_dir, 'VERIFICATION_INSTRUCTIONS.md')
            with open(instructions_file, 'w') as f:
                f.write(self._generate_verification_instructions(audit_package))

            # Create ZIP archive
            with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arc_path = os.path.relpath(file_path, temp_dir)
                        zipf.write(file_path, arc_path)

        self.logger.info(f"Exported audit package {package_id} to {export_path}")

        return export_path

    def _retrieve_audit_package(self, package_id: str) -> Optional[AuditPackage]:
        """Retrieve audit package from database."""

        conn = sqlite3.connect(self.evidence_db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM audit_packages WHERE package_id = ?
        ''', (package_id,))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        # Get evidence items
        cursor.execute('''
            SELECT * FROM evidence_items WHERE evidence_id IN (
                SELECT json_extract(value, '$') FROM json_each(
                    (SELECT json_extract(validation_results, '$.evidence_ids')
                     FROM audit_packages WHERE package_id = ?)
                )
            )
        ''', (package_id,))

        evidence_rows = cursor.fetchall()
        evidence_items = []

        for evidence_row in evidence_rows:
            evidence = EvidenceItem(
                evidence_id=evidence_row[0],
                evidence_type=evidence_row[1],
                timestamp=datetime.fromisoformat(evidence_row[2]),
                source_location=evidence_row[3],
                content_hash=evidence_row[4],
                content=json.loads(evidence_row[5]),
                metadata=json.loads(evidence_row[6]),
                chain_of_custody=json.loads(evidence_row[7]),
                verification_status=evidence_row[8],
                digital_signature=evidence_row[9]
            )
            evidence_items.append(evidence)

        # Reconstruct audit package
        audit_package = AuditPackage(
            package_id=row[0],
            creation_timestamp=datetime.fromisoformat(row[1]),
            audit_scope=row[2],
            evidence_items=evidence_items,
            quality_metrics=json.loads(row[3]),
            compliance_certifications=json.loads(row[4]),
            validation_results=json.loads(row[5]),
            package_hash=row[6],
            digital_signature=row[7]
        )

        conn.close()
        return audit_package

    def _generate_verification_instructions(self, audit_package: AuditPackage) -> str:
        """Generate verification instructions for audit package."""

        return f"""# Audit Package Verification Instructions

## Package Information
- Package ID: {audit_package.package_id}
- Creation Date: {audit_package.creation_timestamp.isoformat()}
- Audit Scope: {audit_package.audit_scope}
- Evidence Items: {len(audit_package.evidence_items)}

## Verification Steps

### 1. Package Integrity
Verify the package hash matches the calculated hash:
- Expected Hash: {audit_package.package_hash}
- Calculate hash of audit_package.json content (excluding digital_signature field)

### 2. Digital Signatures
Use the provided public_key.pem to verify:
- Package digital signature
- Individual evidence item signatures

### 3. Chain of Custody
For each evidence item, verify:
- All custody events are properly timestamped
- Digital signatures are valid
- Content hashes match actual content

### 4. Compliance Certifications
Review compliance assessments for:
- NASA POT10 requirements
- ISO 27001 requirements
- NIST 800-53 requirements

## Tools Required
- Python cryptography library
- JSON parser
- Hash calculation utility (SHA-256)

## Defense Industry Compliance
This audit package has been generated according to defense industry standards
and provides auditable evidence for quality improvements and security compliance.

Generated by Defense Evidence Collector v1.0.0
"""

    def generate_compliance_report(self, package_id: str) -> Dict[str, Any]:
        """Generate comprehensive compliance report."""

        audit_package = self._retrieve_audit_package(package_id)
        if not audit_package:
            raise ValueError(f"Audit package {package_id} not found")

        # Analyze compliance status
        overall_compliance = self._analyze_overall_compliance(audit_package)

        # Generate detailed findings
        detailed_findings = self._generate_detailed_findings(audit_package)

        # Risk assessment
        risk_assessment = self._perform_risk_assessment(audit_package)

        return {
            'package_id': package_id,
            'report_timestamp': datetime.now(timezone.utc).isoformat(),
            'overall_compliance': overall_compliance,
            'detailed_findings': detailed_findings,
            'risk_assessment': risk_assessment,
            'evidence_summary': {
                'total_evidence_items': len(audit_package.evidence_items),
                'evidence_by_type': self._count_evidence_by_type(audit_package.evidence_items),
                'chain_integrity': audit_package.chain_verification
            },
            'recommendations': self._generate_compliance_recommendations(audit_package)
        }

    def _analyze_overall_compliance(self, audit_package: AuditPackage) -> Dict[str, Any]:
        """Analyze overall compliance status."""

        compliance_scores = []
        standards_status = {}

        for cert in audit_package.compliance_certifications:
            standard = cert['standard']
            score = cert['score']
            compliance_scores.append(score)
            standards_status[standard] = {
                'status': cert['compliance_status'],
                'score': score,
                'requirements_met': len(cert['requirements_met']),
                'requirements_missed': len(cert['requirements_missed'])
            }

        overall_score = sum(compliance_scores) / len(compliance_scores) if compliance_scores else 0

        if overall_score >= 0.9:
            overall_status = 'FULLY_COMPLIANT'
        elif overall_score >= 0.7:
            overall_status = 'MOSTLY_COMPLIANT'
        elif overall_score >= 0.5:
            overall_status = 'PARTIALLY_COMPLIANT'
        else:
            overall_status = 'NON_COMPLIANT'

        return {
            'overall_score': overall_score,
            'overall_status': overall_status,
            'standards_status': standards_status,
            'defense_ready': overall_score >= 0.9 and audit_package.chain_verification['meets_threshold']
        }

    def _count_evidence_by_type(self, evidence_items: List[EvidenceItem]) -> Dict[str, int]:
        """Count evidence items by type."""
        counts = {}
        for evidence in evidence_items:
            evidence_type = evidence.evidence_type
            counts[evidence_type] = counts.get(evidence_type, 0) + 1
        return counts

    def _generate_detailed_findings(self, audit_package: AuditPackage) -> List[Dict[str, Any]]:
        """Generate detailed compliance findings."""

        findings = []

        # Check evidence completeness
        required_types = self.config['verification_requirements']['required_evidence_types']
        available_types = set(e.evidence_type for e in audit_package.evidence_items)
        missing_types = set(required_types) - available_types

        if missing_types:
            findings.append({
                'category': 'evidence_completeness',
                'severity': 'high',
                'finding': f"Missing required evidence types: {', '.join(missing_types)}",
                'recommendation': "Collect missing evidence before deployment"
            })

        # Check chain integrity
        if not audit_package.chain_verification['meets_threshold']:
            findings.append({
                'category': 'chain_integrity',
                'severity': 'critical',
                'finding': f"Chain integrity below threshold: {audit_package.chain_verification['integrity_score']:.2%}",
                'recommendation': "Investigate and repair broken chains of custody"
            })

        # Check signature verification
        unsigned_evidence = [e for e in audit_package.evidence_items if not e.digital_signature]
        if unsigned_evidence:
            findings.append({
                'category': 'digital_signatures',
                'severity': 'high',
                'finding': f"{len(unsigned_evidence)} evidence items lack digital signatures",
                'recommendation': "Ensure all evidence is digitally signed"
            })

        return findings

    def _perform_risk_assessment(self, audit_package: AuditPackage) -> Dict[str, Any]:
        """Perform risk assessment based on compliance status."""

        risk_factors = []
        risk_score = 0.0

        # Compliance risk
        overall_score = sum(cert['score'] for cert in audit_package.compliance_certifications) / len(audit_package.compliance_certifications)
        if overall_score < 0.8:
            risk_factors.append("Low compliance scores")
            risk_score += 0.3

        # Chain integrity risk
        if not audit_package.chain_verification['meets_threshold']:
            risk_factors.append("Compromised chain of custody")
            risk_score += 0.4

        # Evidence completeness risk
        required_count = self.config['verification_requirements']['min_evidence_items']
        if len(audit_package.evidence_items) < required_count:
            risk_factors.append("Insufficient evidence quantity")
            risk_score += 0.2

        # Signature verification risk
        unsigned_count = len([e for e in audit_package.evidence_items if not e.digital_signature])
        if unsigned_count > 0:
            risk_factors.append("Unsigned evidence items")
            risk_score += 0.1

        risk_level = 'HIGH' if risk_score > 0.6 else 'MEDIUM' if risk_score > 0.3 else 'LOW'

        return {
            'risk_score': min(risk_score, 1.0),
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'deployment_recommendation': 'BLOCK' if risk_score > 0.6 else 'CONDITIONAL' if risk_score > 0.3 else 'APPROVE'
        }

    def _generate_compliance_recommendations(self, audit_package: AuditPackage) -> List[str]:
        """Generate compliance recommendations."""

        recommendations = []

        # Evidence recommendations
        evidence_types = set(e.evidence_type for e in audit_package.evidence_items)
        required_types = set(self.config['verification_requirements']['required_evidence_types'])
        missing_types = required_types - evidence_types

        if missing_types:
            recommendations.append(f"Collect missing evidence types: {', '.join(missing_types)}")

        # Chain integrity recommendations
        if not audit_package.chain_verification['meets_threshold']:
            recommendations.append("Strengthen chain of custody procedures and verification")

        # Compliance score recommendations
        low_scoring_standards = [
            cert['standard'] for cert in audit_package.compliance_certifications
            if cert['score'] < 0.8
        ]

        if low_scoring_standards:
            recommendations.append(f"Improve compliance for standards: {', '.join(low_scoring_standards)}")

        # General recommendations
        recommendations.append("Implement continuous compliance monitoring")
        recommendations.append("Regular audit package verification and validation")

        return recommendations