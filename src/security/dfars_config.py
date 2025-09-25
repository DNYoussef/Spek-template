from src.constants.base import API_TIMEOUT_SECONDS

import json
import os
from datetime import timedelta
from enum import Enum
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

class ComplianceLevel(Enum):
    """DFARS compliance levels"""
    BASIC = "BASIC"
    ENHANCED = "ENHANCED"
    CRITICAL = "CRITICAL"

class SecurityClassification(Enum):
    """Security classification levels"""
    PUBLIC = "PUBLIC"
    CONTROLLED = "CONTROLLED"
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"

@dataclass
class EncryptionConfig:
    """Encryption configuration for CUI protection"""
    algorithm: str = "AES-256-GCM"
    key_rotation_interval: int = 90  # days
    at_rest_encryption: bool = True
    in_transit_encryption: bool = True
    key_escrow_required: bool = True
    fips_140_2_required: bool = True

@dataclass
class AccessControlConfig:
    """Access control configuration"""
    multi_factor_auth_required: bool = True
    session_timeout_minutes: int = 60
    max_failed_attempts: int = 3
    account_lockout_duration: int = 30  # minutes
    password_complexity_required: bool = True
    min_password_length: int = 12
    privilege_escalation_monitoring: bool = True
    role_based_access_control: bool = True

@dataclass
class AuditConfig:
    """Audit trail configuration"""
    audit_retention_days: int = 2555  # 7 years as per DFARS
    real_time_monitoring: bool = True
    cryptographic_integrity: bool = True
    tamper_detection: bool = True
    log_all_access_attempts: bool = True
    log_privileged_operations: bool = True
    log_cui_access: bool = True
    automated_log_analysis: bool = True

@dataclass
class IncidentResponseConfig:
    """Incident response configuration"""
    reporting_deadline_hours: int = 72
    automated_containment: bool = True
    forensic_preservation: bool = True
    escalation_matrix: Dict[str, List[str]] = None
    notification_endpoints: List[str] = None
    response_team_contacts: List[str] = None

def __post_init__(self):
        if self.escalation_matrix is None:
            self.escalation_matrix = {
                "CRITICAL": ["CISO", "DoD_CIO", "Legal"],
                "HIGH": ["Security_Manager", "IT_Manager"],
                "MEDIUM": ["Security_Team"],
                "LOW": ["System_Admin"]
            }
        if self.notification_endpoints is None:
            self.notification_endpoints = [
                "security@company.com",
                "incident-response@company.com"
            ]
        if self.response_team_contacts is None:
            self.response_team_contacts = [
                "security-oncall@company.com",
                "legal@company.com"
            ]

@dataclass
class CUIProtectionConfig:
    """CUI protection configuration"""
    auto_classification: bool = True
    real_time_scanning: bool = True
    data_loss_prevention: bool = True
    access_logging: bool = True
    encryption_required: bool = True
    retention_policies: Dict[str, int] = None  # Classification -> days
    handling_procedures: Dict[str, str] = None
    marking_requirements: bool = True

def __post_init__(self):
        if self.retention_policies is None:
            self.retention_policies = {
                "CUI//BASIC": 1095,      # 3 years
                "CUI//SP-PRIV": 2555,   # 7 years
                "CUI//SP-PROP": 1825,   # 5 years
                "CUI//SP-EXPT": 3650    # 10 years
            }
        if self.handling_procedures is None:
            self.handling_procedures = {
                "CUI//BASIC": "Standard CUI handling procedures apply",
                "CUI//SP-PRIV": "Enhanced privacy protection required - GDPR/CCPA compliance",
                "CUI//SP-PROP": "Proprietary information - trade secret protection",
                "CUI//SP-EXPT": "Export controlled - ITAR/EAR compliance required"
            }

@dataclass
class MonitoringConfig:
    """Continuous monitoring configuration"""
    real_time_monitoring: bool = True
    monitoring_interval_seconds: int = 60
    baseline_learning_period_days: int = 30
    anomaly_detection_threshold: float = 2.0  # standard deviations
    automated_response: bool = True
    alert_escalation_enabled: bool = True
    performance_monitoring: bool = True
    network_monitoring: bool = True

@dataclass
class ComplianceThresholds:
    """DFARS compliance thresholds"""
    minimum_compliance_score: float = 85.0
    critical_findings_threshold: int = 0
    high_findings_threshold: int = 5
    audit_integrity_required: bool = True
    cui_protection_score: float = 100.0
    incident_response_time_hours: int = 4
    vulnerability_remediation_days: int = 30

@dataclass
class DFARSConfiguration:
    """Complete DFARS compliance configuration"""
    compliance_level: ComplianceLevel = ComplianceLevel.ENHANCED
    organization_info: Dict[str, str] = None
    encryption: EncryptionConfig = None
    access_control: AccessControlConfig = None
    audit: AuditConfig = None
    incident_response: IncidentResponseConfig = None
    cui_protection: CUIProtectionConfig = None
    monitoring: MonitoringConfig = None
    thresholds: ComplianceThresholds = None

def __post_init__(self):
        if self.organization_info is None:
            self.organization_info = {
                "company_name": "Defense Contractor Inc.",
                "primary_contact": "security@company.com",
                "compliance_officer": "compliance@company.com"
            }

        # Initialize sub-configurations if not provided
        if self.encryption is None:
            self.encryption = EncryptionConfig()
        if self.access_control is None:
            self.access_control = AccessControlConfig()
        if self.audit is None:
            self.audit = AuditConfig()
        if self.incident_response is None:
            self.incident_response = IncidentResponseConfig()
        if self.cui_protection is None:
            self.cui_protection = CUIProtectionConfig()
        if self.monitoring is None:
            self.monitoring = MonitoringConfig()
        if self.thresholds is None:
            self.thresholds = ComplianceThresholds()

class DFARSConfigManager:
    """DFARS configuration manager"""

def __init__(self, config_path: str = "dfars_config.json"):
        self.config_path = Path(config_path)
        self.config: Optional[DFARSConfiguration] = None
        self.load_config()

def load_config(self) -> DFARSConfiguration:
        """Load DFARS configuration from file"""
        if self.config_path.exists():
            try:
                with open(self.config_path, 'r') as f:
                    config_data = json.load(f)

                # Convert JSON to dataclass
                self.config = self._dict_to_config(config_data)
            except Exception as e:
                print(f"Error loading config: {e}")
                self.config = DFARSConfiguration()
        else:
            # Create default configuration
            self.config = DFARSConfiguration()
            self.save_config()

        return self.config

def save_config(self):
        """Save DFARS configuration to file"""
        if self.config:
            config_dict = self._config_to_dict(self.config)

            # Ensure directory exists
            self.config_path.parent.mkdir(parents=True, exist_ok=True)

            with open(self.config_path, 'w') as f:
                json.dump(config_dict, f, indent=2, default=str)

def _config_to_dict(self, config: DFARSConfiguration) -> Dict[str, Any]:
        """Convert configuration dataclass to dictionary"""
        return {
            'compliance_level': config.compliance_level.value,
            'organization_info': config.organization_info,
            'encryption': asdict(config.encryption),
            'access_control': asdict(config.access_control),
            'audit': asdict(config.audit),
            'incident_response': asdict(config.incident_response),
            'cui_protection': asdict(config.cui_protection),
            'monitoring': asdict(config.monitoring),
            'thresholds': asdict(config.thresholds)
        }

def _dict_to_config(self, config_dict: Dict[str, Any]) -> DFARSConfiguration:
        """Convert dictionary to configuration dataclass"""
        return DFARSConfiguration(
            compliance_level=ComplianceLevel(config_dict.get('compliance_level', 'ENHANCED')),
            organization_info=config_dict.get('organization_info'),
            encryption=EncryptionConfig(**config_dict.get('encryption', {})),
            access_control=AccessControlConfig(**config_dict.get('access_control', {})),
            audit=AuditConfig(**config_dict.get('audit', {})),
            incident_response=IncidentResponseConfig(**config_dict.get('incident_response', {})),
            cui_protection=CUIProtectionConfig(**config_dict.get('cui_protection', {})),
            monitoring=MonitoringConfig(**config_dict.get('monitoring', {})),
            thresholds=ComplianceThresholds(**config_dict.get('thresholds', {}))
        )

def update_compliance_level(self, level: ComplianceLevel):
        """Update compliance level and adjust configurations"""
        self.config.compliance_level = level

        if level == ComplianceLevel.CRITICAL:
            # Enhance security for critical systems
            self.config.access_control.session_timeout_minutes = 30
            self.config.access_control.max_failed_attempts = 2
            self.config.monitoring.monitoring_interval_seconds = API_TIMEOUT_SECONDS
            self.config.thresholds.minimum_compliance_score = 95.0
            self.config.thresholds.critical_findings_threshold = 0
            self.config.incident_response.reporting_deadline_hours = 24

        elif level == ComplianceLevel.ENHANCED:
            # Standard enhanced security
            self.config.access_control.session_timeout_minutes = 60
            self.config.access_control.max_failed_attempts = 3
            self.config.monitoring.monitoring_interval_seconds = 60
            self.config.thresholds.minimum_compliance_score = 85.0
            self.config.incident_response.reporting_deadline_hours = 72

        elif level == ComplianceLevel.BASIC:
            # Basic compliance requirements
            self.config.access_control.session_timeout_minutes = 120
            self.config.access_control.max_failed_attempts = 5
            self.config.monitoring.monitoring_interval_seconds = 300
            self.config.thresholds.minimum_compliance_score = 75.0

        self.save_config()

def get_control_config(self, control_id: str) -> Dict[str, Any]:
        """Get configuration for specific DFARS control"""
        control_configs = {
            "3.1.1": {  # Access Control
                "config": asdict(self.config.access_control),
                "thresholds": {
                    "max_sessions": 100,
                    "session_timeout": self.config.access_control.session_timeout_minutes
                }
            },
            "3.3.1": {  # Audit and Accountability
                "config": asdict(self.config.audit),
                "thresholds": {
                    "retention_days": self.config.audit.audit_retention_days,
                    "integrity_required": self.config.audit.cryptographic_integrity
                }
            },
            "3.5.1": {  # Identification and Authentication
                "config": {
                    "mfa_required": self.config.access_control.multi_factor_auth_required,
                    "password_complexity": self.config.access_control.password_complexity_required,
                    "min_password_length": self.config.access_control.min_password_length
                }
            },
            "3.6.1": {  # Incident Response
                "config": asdict(self.config.incident_response),
                "thresholds": {
                    "reporting_deadline": self.config.incident_response.reporting_deadline_hours,
                    "response_time": self.config.thresholds.incident_response_time_hours
                }
            },
            "3.13.1": {  # System and Communications Protection
                "config": asdict(self.config.encryption),
                "thresholds": {
                    "encryption_required": self.config.encryption.at_rest_encryption,
                    "fips_140_2": self.config.encryption.fips_140_2_required
                }
            }
        }

        return control_configs.get(control_id, {})

def validate_configuration(self) -> List[str]:
        """Validate DFARS configuration for completeness"""
        issues = []

        # Check organization info
        required_org_fields = ["company_name", "cage_code", "duns_number"]
        for field in required_org_fields:
            if not self.config.organization_info.get(field):
                issues.append(f"Missing organization field: {field}")

        # Check encryption config
        if not self.config.encryption.fips_140_2_required:
            issues.append("FIPS 140-2 encryption not required - may not meet DFARS standards")

        # Check audit retention
        if self.config.audit.audit_retention_days < 2555:  # 7 years
            issues.append("Audit retention period less than 7 years - may not meet DFARS requirements")

        # Check incident response
        if self.config.incident_response.reporting_deadline_hours > 72:
            issues.append("Incident reporting deadline exceeds 72 hours - violates DFARS requirements")

        # Check compliance thresholds
        if self.config.thresholds.minimum_compliance_score < 85.0:
            issues.append("Minimum compliance score below 85% - recommend increasing threshold")

        return issues

def export_policy_document(self) -> str:
        """Export configuration as policy document"""
        policy = f"""
DFARS 252.204-7012 COMPLIANCE POLICY
==================================

Organization: {self.config.organization_info.get('company_name', 'Unknown')}
CAGE Code: {self.config.organization_info.get('cage_code', 'Unknown')}
Compliance Level: {self.config.compliance_level.value}
Generated: {Path(__file__).stat().st_mtime}

SECURITY CONTROLS CONFIGURATION
-----------------------------

1. ACCESS CONTROL (3.1.1)
    - Multi-factor Authentication: {'REQUIRED' if self.config.access_control.multi_factor_auth_required else 'OPTIONAL'}
    - Session Timeout: {self.config.access_control.session_timeout_minutes} minutes
    - Max Failed Attempts: {self.config.access_control.max_failed_attempts}
    - Password Complexity: {'REQUIRED' if self.config.access_control.password_complexity_required else 'OPTIONAL'}

2. AUDIT AND ACCOUNTABILITY (3.3.1)
    - Retention Period: {self.config.audit.audit_retention_days} days
    - Cryptographic Integrity: {'ENABLED' if self.config.audit.cryptographic_integrity else 'DISABLED'}
    - Real-time Monitoring: {'ENABLED' if self.config.audit.real_time_monitoring else 'DISABLED'}

3. INCIDENT RESPONSE (3.6.1)
    - Reporting Deadline: {self.config.incident_response.reporting_deadline_hours} hours
    - Automated Containment: {'ENABLED' if self.config.incident_response.automated_containment else 'DISABLED'}
    - Forensic Preservation: {'ENABLED' if self.config.incident_response.forensic_preservation else 'DISABLED'}

4. ENCRYPTION (3.13.1)
    - Algorithm: {self.config.encryption.algorithm}
    - FIPS 140-2: {'REQUIRED' if self.config.encryption.fips_140_2_required else 'OPTIONAL'}
    - At-rest Encryption: {'ENABLED' if self.config.encryption.at_rest_encryption else 'DISABLED'}
    - In-transit Encryption: {'ENABLED' if self.config.encryption.in_transit_encryption else 'DISABLED'}

5. CUI PROTECTION
    - Auto-classification: {'ENABLED' if self.config.cui_protection.auto_classification else 'DISABLED'}
    - Real-time Scanning: {'ENABLED' if self.config.cui_protection.real_time_scanning else 'DISABLED'}
    - Data Loss Prevention: {'ENABLED' if self.config.cui_protection.data_loss_prevention else 'DISABLED'}

COMPLIANCE THRESHOLDS
-------------------
- Minimum Compliance Score: {self.config.thresholds.minimum_compliance_score}%
- Critical Findings Threshold: {self.config.thresholds.critical_findings_threshold}
- High Findings Threshold: {self.config.thresholds.high_findings_threshold}
- Incident Response Time: {self.config.thresholds.incident_response_time_hours} hours

This policy document defines the DFARS 252.204-7012 compliance configuration
for safeguarding Controlled Unclassified Information (CUI) in accordance with
Defense Federal Acquisition Regulation Supplement requirements.
        """

        return policy.strip()

def create_sample_config() -> DFARSConfiguration:
    """Create a sample DFARS configuration for testing"""
    return DFARSConfiguration(
        compliance_level=ComplianceLevel.ENHANCED,
        organization_info={
            "company_name": "Sample Defense Contractor",
            "cage_code": "12345",
            "duns_number": "123456789",
            "primary_contact": "security@sample.com",
            "compliance_officer": "compliance@sample.com"
        }
    )

# Example usage and testing
def main():
    """Example usage of DFARS configuration management"""
    print("DFARS Configuration Management")
    print("=" * 40)

    # Initialize configuration manager
    config_manager = DFARSConfigManager("sample_dfars_config.json")

    # Display current configuration
    print(f"Compliance Level: {config_manager.config.compliance_level.value}")
    print(f"Organization: {config_manager.config.organization_info.get('company_name')}")

    # Validate configuration
    issues = config_manager.validate_configuration()
    if issues:
        print(f"\nConfiguration Issues:")
        for issue in issues:
            print(f"- {issue}")
    else:
        print("\nConfiguration is valid!")

    # Get control-specific configuration
    access_control_config = config_manager.get_control_config("3.1.1")
    print(f"\nAccess Control Config:")
    print(f"- MFA Required: {access_control_config['config']['multi_factor_auth_required']}")
    print(f"- Session Timeout: {access_control_config['config']['session_timeout_minutes']} minutes")

    # Update compliance level
    print(f"\nUpdating to CRITICAL compliance level...")
    config_manager.update_compliance_level(ComplianceLevel.CRITICAL)
    print(f"New session timeout: {config_manager.config.access_control.session_timeout_minutes} minutes")

    # Export policy document
    policy_doc = config_manager.export_policy_document()
    policy_file = Path("dfars_policy.txt")
    policy_file.write_text(policy_doc)
    print(f"\nPolicy document exported to: {policy_file}")

    print(f"\nConfiguration saved to: {config_manager.config_path}")

if __name__ == "__main__":
    main()