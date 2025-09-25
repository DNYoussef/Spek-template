from src.constants.base import MAXIMUM_NESTED_DEPTH

import json
import time
import hashlib
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class ConfigurationLevel(Enum):
    """Security configuration levels."""
    MINIMAL = "minimal"
    STANDARD = "standard"
    HARDENED = "hardened"
    DFARS_COMPLIANT = "dfars_compliant"

class DriftSeverity(Enum):
    """Configuration drift severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ConfigurationStatus(Enum):
    """Configuration status."""
    COMPLIANT = "compliant"
    DRIFT_DETECTED = "drift_detected"
    REMEDIATION_REQUIRED = "remediation_required"
    CRITICAL_VIOLATION = "critical_violation"

@dataclass
class SecurityBaseline:
    """Security baseline configuration."""
    baseline_id: str
    name: str
    version: str
    description: str
    security_level: ConfigurationLevel
    created_at: float
    updated_at: float
    configurations: Dict[str, Dict[str, Any]]
    compliance_mappings: Dict[str, List[str]]  # Maps to DFARS controls
    validation_rules: List[Dict[str, Any]]

@dataclass
class ConfigurationDrift:
    """Configuration drift detection result."""
    drift_id: str
    component: str
    baseline_id: str
    severity: DriftSeverity
    detected_at: float
    current_value: Any
    expected_value: Any
    drift_description: str
    remediation_actions: List[str]
    compliance_impact: List[str]

class DFARSConfigurationManager:
    """
    Comprehensive configuration management system implementing DFARS
    requirements for security baseline enforcement and drift detection.
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize DFARS configuration management system."""
        self.config = self._load_config(config_path)
        self.baselines: Dict[str, SecurityBaseline] = {}
        self.drift_history: List[ConfigurationDrift] = []
        self.active_monitoring: bool = False

        # Initialize components
        self.audit_manager = DFARSAuditTrailManager(".claude/.artifacts/config_audit")

        # Initialize storage
        self.storage_path = Path(".claude/.artifacts/configuration")
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Load existing baselines
        self._load_existing_baselines()

        # Initialize executor for parallel configuration checks
        self.executor = ThreadPoolExecutor(max_workers=4)

        logger.info("DFARS Configuration Management System initialized")

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration management settings."""
        default_config = {
            "configuration_management": {
                "monitoring_enabled": True,
                "drift_detection_interval": 300,  # MAXIMUM_NESTED_DEPTH minutes
                "auto_remediation": {
                    "enabled": True,
                    "severity_threshold": "medium",
                    "require_approval": True
                },
                "baseline_validation": {
                    "continuous_validation": True,
                    "validation_interval": 3600,  # 1 hour
                    "integrity_checking": True
                },
                "compliance_reporting": {
                    "generate_reports": True,
                    "report_interval": 86400,  # 24 hours
                    "include_remediation_status": True
                },
                "security_controls": {
                    "enforce_encryption": True,
                    "require_authentication": True,
                    "audit_all_changes": True,
                    "prevent_unauthorized_changes": True
                }
            }
        }

        if config_path and path_exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    loaded_config = json.load(f)
                    default_config.update(loaded_config)
            except Exception as e:
                logger.warning(f"Failed to load config from {config_path}: {e}")

        return default_config

    def _load_existing_baselines(self):
        """Load existing security baselines."""
        baseline_files = self.storage_path.glob("baseline_*.json")

        for baseline_file in baseline_files:
            try:
                with open(baseline_file, 'r') as f:
                    baseline_data = json.load(f)

                baseline = SecurityBaseline(
                    baseline_id=baseline_data['baseline_id'],
                    name=baseline_data['name'],
                    version=baseline_data['version'],
                    description=baseline_data['description'],
                    security_level=ConfigurationLevel(baseline_data['security_level']),
                    created_at=baseline_data['created_at'],
                    updated_at=baseline_data['updated_at'],
                    configurations=baseline_data['configurations'],
                    compliance_mappings=baseline_data['compliance_mappings'],
                    validation_rules=baseline_data['validation_rules']
                )

                self.baselines[baseline.baseline_id] = baseline

            except Exception as e:
                logger.error(f"Failed to load baseline from {baseline_file}: {e}")

        if not self.baselines:
            # Create default DFARS baseline if none exist
            self._create_default_dfars_baseline()

        logger.info(f"Loaded {len(self.baselines)} security baselines")

    def _create_default_dfars_baseline(self) -> str:
        """Create default DFARS-compliant security baseline."""
        baseline_id = f"dfars_baseline_{int(time.time())}"

        baseline = SecurityBaseline(
            baseline_id=baseline_id,
            name="DFARS 252.204-7012 Security Baseline",
            version="1.0.0",
            description="Default security baseline for DFARS compliance",
            security_level=ConfigurationLevel.DFARS_COMPLIANT,
            created_at=time.time(),
            updated_at=time.time(),
            configurations={
                "encryption": {
                    "data_at_rest": {
                        "enabled": True,
                        "algorithm": "AES-256",
                        "key_management": "enterprise"
                    },
                    "data_in_transit": {
                        "enabled": True,
                        "tls_version": "1.3",
                        "cipher_suites": ["ECDHE-RSA-AES256-GCM-SHA384", "ECDHE-RSA-CHACHA20-POLY1305"]
                    }
                },
                "access_control": {
                    "multi_factor_authentication": {
                        "enabled": True,
                        "required_factors": 2,
                        "timeout": 900
                    },
                    "privileged_access": {
                        "session_recording": True,
                        "approval_required": True,
                        "time_bounded": True
                    },
                    "password_policy": {
                        "min_length": 12,
                        "complexity": True,
                        "rotation_days": 90,
                        "history_count": 12
                    }
                },
                "audit_logging": {
                    "comprehensive_logging": True,
                    "log_integrity": True,
                    "retention_days": 2555,  # 7 years
                    "real_time_monitoring": True
                },
                "system_integrity": {
                    "file_integrity_monitoring": True,
                    "malware_protection": True,
                    "vulnerability_scanning": True,
                    "patch_management": True
                },
                "network_security": {
                    "firewall_enabled": True,
                    "intrusion_detection": True,
                    "network_segmentation": True,
                    "traffic_monitoring": True
                },
                "incident_response": {
                    "response_plan": True,
                    "forensic_capabilities": True,
                    "backup_recovery": True,
                    "business_continuity": True
                }
            },
            compliance_mappings={
                "3.1.1": ["access_control.multi_factor_authentication"],
                "3.1.2": ["access_control.privileged_access"],
                "3.4.1": ["encryption.data_at_rest", "encryption.data_in_transit"],
                "3.4.2": ["system_integrity.file_integrity_monitoring"],
                "3.6.1": ["incident_response.response_plan"],
                "3.6.2": ["incident_response.forensic_capabilities"],
                "3.8.1": ["audit_logging.comprehensive_logging"],
                "3.8.9": ["audit_logging.log_integrity"],
                "3.13.1": ["network_security.firewall_enabled"],
                "3.13.2": ["network_security.intrusion_detection"]
            },
            validation_rules=[
                {
                    "rule_id": "encryption_algorithms",
                    "description": "Validate approved encryption algorithms",
                    "validation_type": "algorithm_check",
                    "approved_values": ["AES-256", "RSA-4096", "ECDSA-P384"],
                    "severity": "critical"
                },
                {
                    "rule_id": "tls_version",
                    "description": "Ensure minimum TLS version",
                    "validation_type": "version_check",
                    "minimum_version": "1.3",
                    "severity": "high"
                },
                {
                    "rule_id": "audit_retention",
                    "description": "Validate audit log retention period",
                    "validation_type": "numeric_check",
                    "minimum_value": 2555,  # 7 years
                    "severity": "medium"
                },
                {
                    "rule_id": "mfa_enabled",
                    "description": "Ensure multi-factor authentication is enabled",
                    "validation_type": "boolean_check",
                    "required_value": True,
                    "severity": "critical"
                }
            ]
        )

        self.baselines[baseline_id] = baseline
        self._persist_baseline(baseline)

        logger.info(f"Created default DFARS baseline: {baseline_id}")
        return baseline_id

    def _persist_baseline(self, baseline: SecurityBaseline):
        """Persist security baseline to storage."""
        baseline_file = self.storage_path / f"baseline_{baseline.baseline_id}.json"

        with open(baseline_file, 'w') as f:
            baseline_dict = asdict(baseline)
            baseline_dict['security_level'] = baseline.security_level.value
            json.dump(baseline_dict, f, indent=2)

    def create_security_baseline(self, name: str, description: str,
                                security_level: ConfigurationLevel,
                                configurations: Dict[str, Dict[str, Any]],
                                compliance_mappings: Optional[Dict[str, List[str]]] = None,
                                validation_rules: Optional[List[Dict[str, Any]]] = None) -> str:
        """Create new security baseline."""
        baseline_id = f"baseline_{hashlib.sha256(f'{name}{time.time()}'.encode()).hexdigest()[:16]}"

        baseline = SecurityBaseline(
            baseline_id=baseline_id,
            name=name,
            version="1.0.0",
            description=description,
            security_level=security_level,
            created_at=time.time(),
            updated_at=time.time(),
            configurations=configurations,
            compliance_mappings=compliance_mappings or {},
            validation_rules=validation_rules or []
        )

        self.baselines[baseline_id] = baseline
        self._persist_baseline(baseline)

        # Log baseline creation
        self.audit_manager.log_configuration_change(
            change_type="baseline_created",
            component=name,
            old_value=None,
            new_value=baseline_id,
            change_reason="New security baseline created",
            details={
                "baseline_id": baseline_id,
                "security_level": security_level.value,
                "configurations_count": len(configurations)
            }
        )

        logger.info(f"Created security baseline: {baseline_id} ({name})")
        return baseline_id

    async def validate_configuration_compliance(self, baseline_id: str,
                                                target_systems: Optional[List[str]] = None) -> Dict[str, Any]:
        """Validate current configuration against security baseline."""
        if baseline_id not in self.baselines:
            raise ValueError(f"Baseline {baseline_id} not found")

        baseline = self.baselines[baseline_id]
        validation_start = time.time()

        validation_results = {
            "baseline_id": baseline_id,
            "baseline_name": baseline.name,
            "validation_timestamp": validation_start,
            "target_systems": target_systems or ["localhost"],
            "compliance_status": ConfigurationStatus.COMPLIANT,
            "overall_score": 0.0,
            "category_results": {},
            "drift_items": [],
            "validation_errors": []
        }

        try:
            # Validate each configuration category
            total_checks = 0
            passed_checks = 0

            for category, config_items in baseline.configurations.items():
                category_result = await self._validate_category_configuration(
                    category, config_items, baseline.validation_rules
                )

                validation_results["category_results"][category] = category_result
                total_checks += category_result["total_checks"]
                passed_checks += category_result["passed_checks"]

                # Collect drift items
                validation_results["drift_items"].extend(category_result.get("drift_items", []))

            # Calculate overall compliance score
            validation_results["overall_score"] = passed_checks / max(1, total_checks)

            # Determine compliance status
            if validation_results["drift_items"]:
                critical_drifts = [d for d in validation_results["drift_items"]
                                if d["severity"] == DriftSeverity.CRITICAL.value]
                if critical_drifts:
                    validation_results["compliance_status"] = ConfigurationStatus.CRITICAL_VIOLATION
                else:
                    validation_results["compliance_status"] = ConfigurationStatus.DRIFT_DETECTED
            else:
                validation_results["compliance_status"] = ConfigurationStatus.COMPLIANT

            # Log validation results
            self.audit_manager.log_compliance_check(
                check_type="configuration_validation",
                result="SUCCESS",
                details={
                    "baseline_id": baseline_id,
                    "compliance_score": validation_results["overall_score"],
                    "drift_count": len(validation_results["drift_items"]),
                    "validation_duration": time.time() - validation_start
                }
            )

        except Exception as e:
            validation_results["validation_errors"].append(str(e))
            validation_results["compliance_status"] = ConfigurationStatus.CRITICAL_VIOLATION

            logger.error(f"Configuration validation failed for baseline {baseline_id}: {e}")

            # Log validation failure
            self.audit_manager.log_compliance_check(
                check_type="configuration_validation",
                result="FAILURE",
                details={
                    "baseline_id": baseline_id,
                    "error": str(e)
                }
            )

        return validation_results

    async def _validate_category_configuration(self, category: str,
                                            config_items: Dict[str, Any],
                                            validation_rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate specific configuration category."""
        category_result = {
            "category": category,
            "total_checks": 0,
            "passed_checks": 0,
            "drift_items": [],
            "validation_details": {}
        }

        # Get current configuration for category
        current_config = await self._get_current_configuration(category)

        # Validate each configuration item
        for item_name, expected_config in config_items.items():
            category_result["total_checks"] += 1

            current_value = current_config.get(item_name)
            validation_result = self._validate_configuration_item(
                f"{category}.{item_name}", current_value, expected_config, validation_rules
            )

            category_result["validation_details"][item_name] = validation_result

            if validation_result["compliant"]:
                category_result["passed_checks"] += 1
            else:
                # Create drift item
                drift_item = {
                    "drift_id": f"drift_{hashlib.sha256(f'{category}.{item_name}{time.time()}'.encode()).hexdigest()[:12]}",
                    "component": f"{category}.{item_name}",
                    "severity": validation_result["severity"],
                    "current_value": current_value,
                    "expected_value": expected_config,
                    "description": validation_result["description"],
                    "remediation_actions": validation_result["remediation_actions"]
                }
                category_result["drift_items"].append(drift_item)

        return category_result

    async def _get_current_configuration(self, category: str) -> Dict[str, Any]:
        """Get current system configuration for category."""
        # This would integrate with actual system configuration in production
        current_config = {}

        if category == "encryption":
            current_config = await self._get_encryption_configuration()
        elif category == "access_control":
            current_config = await self._get_access_control_configuration()
        elif category == "audit_logging":
            current_config = await self._get_audit_logging_configuration()
        elif category == "system_integrity":
            current_config = await self._get_system_integrity_configuration()
        elif category == "network_security":
            current_config = await self._get_network_security_configuration()
        elif category == "incident_response":
            current_config = await self._get_incident_response_configuration()

        return current_config

    async def _get_encryption_configuration(self) -> Dict[str, Any]:
        """Get current encryption configuration."""
        # Simulate encryption configuration retrieval
        return {
            "data_at_rest": {
                "enabled": True,
                "algorithm": "AES-256",
                "key_management": "enterprise"
            },
            "data_in_transit": {
                "enabled": True,
                "tls_version": "1.3",
                "cipher_suites": ["ECDHE-RSA-AES256-GCM-SHA384"]
            }
        }

    async def _get_access_control_configuration(self) -> Dict[str, Any]:
        """Get current access control configuration."""
        return {
            "multi_factor_authentication": {
                "enabled": True,
                "required_factors": 2,
                "timeout": 900
            },
            "privileged_access": {
                "session_recording": True,
                "approval_required": True,
                "time_bounded": True
            }
        }

    async def _get_audit_logging_configuration(self) -> Dict[str, Any]:
        """Get current audit logging configuration."""
        return {
            "comprehensive_logging": True,
            "log_integrity": True,
            "retention_days": 2555,
            "real_time_monitoring": True
        }

    async def _get_system_integrity_configuration(self) -> Dict[str, Any]:
        """Get current system integrity configuration."""
        return {
            "file_integrity_monitoring": True,
            "malware_protection": True,
            "vulnerability_scanning": True,
            "patch_management": True
        }

    async def _get_network_security_configuration(self) -> Dict[str, Any]:
        """Get current network security configuration."""
        return {
            "firewall_enabled": True,
            "intrusion_detection": True,
            "network_segmentation": True,
            "traffic_monitoring": True
        }

    async def _get_incident_response_configuration(self) -> Dict[str, Any]:
        """Get current incident response configuration."""
        return {
            "response_plan": True,
            "forensic_capabilities": True,
            "backup_recovery": True,
            "business_continuity": True
        }

    def _validate_configuration_item(self, item_path: str, current_value: Any,
                                    expected_config: Any,
                                    validation_rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate individual configuration item."""
        validation_result = {
            "item_path": item_path,
            "compliant": True,
            "severity": "low",
            "description": "",
            "remediation_actions": []
        }

        # Find applicable validation rules
        applicable_rules = [
            rule for rule in validation_rules
            if self._rule_applies_to_item(rule, item_path)
        ]

        # Simple value comparison
        if isinstance(expected_config, dict) and isinstance(current_value, dict):
            # Nested configuration comparison
            for key, expected_value in expected_config.items():
                current_subvalue = current_value.get(key)
                if current_subvalue != expected_value:
                    validation_result["compliant"] = False
                    validation_result["description"] = f"Configuration mismatch in {item_path}.{key}: expected {expected_value}, got {current_subvalue}"
                    validation_result["remediation_actions"].append(f"Set {item_path}.{key} to {expected_value}")
                    break
        else:
            # Direct value comparison
            if current_value != expected_config:
                validation_result["compliant"] = False
                validation_result["description"] = f"Configuration mismatch in {item_path}: expected {expected_config}, got {current_value}"
                validation_result["remediation_actions"].append(f"Set {item_path} to {expected_config}")

        # Apply validation rules
        for rule in applicable_rules:
            rule_result = self._apply_validation_rule(rule, current_value)
            if not rule_result["passed"]:
                validation_result["compliant"] = False
                validation_result["severity"] = rule["severity"]
                validation_result["description"] = rule_result["message"]
                validation_result["remediation_actions"].extend(rule_result["remediation_actions"])

        return validation_result

    def _rule_applies_to_item(self, rule: Dict[str, Any], item_path: str) -> bool:
        """Check if validation rule applies to configuration item."""
        # Simple pattern matching - could be more sophisticated
        rule_pattern = rule.get("applies_to", "")
        return rule_pattern in item_path or not rule_pattern

    def _apply_validation_rule(self, rule: Dict[str, Any], current_value: Any) -> Dict[str, Any]:
        """Apply validation rule to configuration value."""
        rule_result = {
            "passed": True,
            "message": "",
            "remediation_actions": []
        }

        validation_type = rule.get("validation_type", "")

        if validation_type == "boolean_check":
            required_value = rule.get("required_value")
            if current_value != required_value:
                rule_result["passed"] = False
                rule_result["message"] = f"Boolean check failed: expected {required_value}, got {current_value}"
                rule_result["remediation_actions"].append(f"Set value to {required_value}")

        elif validation_type == "numeric_check":
            minimum_value = rule.get("minimum_value")
            if isinstance(current_value, (int, float)) and minimum_value is not None:
                if current_value < minimum_value:
                    rule_result["passed"] = False
                    rule_result["message"] = f"Numeric check failed: value {current_value} below minimum {minimum_value}"
                    rule_result["remediation_actions"].append(f"Increase value to at least {minimum_value}")

        elif validation_type == "version_check":
            minimum_version = rule.get("minimum_version")
            if isinstance(current_value, str) and minimum_version:
                if self._compare_versions(current_value, minimum_version) < 0:
                    rule_result["passed"] = False
                    rule_result["message"] = f"Version check failed: {current_value} below minimum {minimum_version}"
                    rule_result["remediation_actions"].append(f"Upgrade to version {minimum_version} or higher")

        elif validation_type == "algorithm_check":
            approved_values = rule.get("approved_values", [])
            if current_value not in approved_values:
                rule_result["passed"] = False
                rule_result["message"] = f"Algorithm check failed: {current_value} not in approved list {approved_values}"
                rule_result["remediation_actions"].append(f"Use approved algorithm from: {approved_values}")

        return rule_result

    def _compare_versions(self, version1: str, version2: str) -> int:
        """Compare version strings."""
        def version_tuple(v):
            return tuple(map(int, v.split('.')))

        v1_tuple = version_tuple(version1)
        v2_tuple = version_tuple(version2)

        if v1_tuple < v2_tuple:
            return -1
        elif v1_tuple > v2_tuple:
            return 1
        else:
            return 0

    async def start_continuous_monitoring(self, baseline_id: str,
                                        monitoring_interval: int = 300) -> bool:
        """Start continuous configuration monitoring."""
        if self.active_monitoring:
            logger.warning("Configuration monitoring already active")
            return False

        self.active_monitoring = True

        # Start monitoring task
        asyncio.create_task(self._continuous_monitoring_loop(baseline_id, monitoring_interval))

        logger.info(f"Started continuous configuration monitoring for baseline {baseline_id}")
        return True

    async def _continuous_monitoring_loop(self, baseline_id: str, interval: int):
        """Continuous configuration monitoring loop."""
        while self.active_monitoring:
            try:
                # Perform configuration validation
                validation_result = await self.validate_configuration_compliance(baseline_id)

                # Process drift items
                if validation_result["drift_items"]:
                    await self._process_configuration_drift(validation_result["drift_items"])

                # Generate compliance report if configured
                if self.config["configuration_management"]["compliance_reporting"]["generate_reports"]:
                    await self._generate_compliance_report(validation_result)

                await asyncio.sleep(interval)

            except Exception as e:
                logger.error(f"Configuration monitoring error: {e}")
                await asyncio.sleep(interval * 2)  # Back off on error

    async def _process_configuration_drift(self, drift_items: List[Dict[str, Any]]):
        """Process detected configuration drift."""
        for drift_item in drift_items:
            # Create drift record
            drift = ConfigurationDrift(
                drift_id=drift_item["drift_id"],
                component=drift_item["component"],
                baseline_id="",  # Would be set from context
                severity=DriftSeverity(drift_item["severity"]),
                detected_at=time.time(),
                current_value=drift_item["current_value"],
                expected_value=drift_item["expected_value"],
                drift_description=drift_item["description"],
                remediation_actions=drift_item["remediation_actions"],
                compliance_impact=[]  # Would be populated based on compliance mappings
            )

            self.drift_history.append(drift)

            # Log drift detection
            self.audit_manager.log_configuration_change(
                change_type="drift_detected",
                component=drift.component,
                old_value=drift.expected_value,
                new_value=drift.current_value,
                change_reason="Configuration drift detected",
                details={
                    "drift_id": drift.drift_id,
                    "severity": drift.severity.value,
                    "remediation_actions": drift.remediation_actions
                }
            )

            # Trigger auto-remediation if configured
            if (self.config["configuration_management"]["auto_remediation"]["enabled"] and
                self._should_auto_remediate(drift)):
                await self._auto_remediate_drift(drift)

    def _should_auto_remediate(self, drift: ConfigurationDrift) -> bool:
        """Determine if drift should be auto-remediated."""
        severity_threshold = self.config["configuration_management"]["auto_remediation"]["severity_threshold"]
        severity_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}

        drift_level = severity_levels.get(drift.severity.value, 0)
        threshold_level = severity_levels.get(severity_threshold, 2)

        return drift_level >= threshold_level

    async def _auto_remediate_drift(self, drift: ConfigurationDrift):
        """Automatically remediate configuration drift."""
        logger.info(f"Auto-remediating drift: {drift.drift_id}")

        try:
            # Execute remediation actions
            for action in drift.remediation_actions:
                await self._execute_remediation_action(action, drift.component)

            # Log successful remediation
            self.audit_manager.log_configuration_change(
                change_type="auto_remediation",
                component=drift.component,
                old_value=drift.current_value,
                new_value=drift.expected_value,
                change_reason="Automated drift remediation",
                details={
                    "drift_id": drift.drift_id,
                    "remediation_actions": drift.remediation_actions
                }
            )

        except Exception as e:
            logger.error(f"Auto-remediation failed for drift {drift.drift_id}: {e}")

            # Log failed remediation
            self.audit_manager.log_security_event(
                event_type=AuditEventType.CONFIGURATION_ERROR,
                severity=SeverityLevel.HIGH,
                description=f"Auto-remediation failed for drift {drift.drift_id}",
                details={"error": str(e)}
            )

    async def _execute_remediation_action(self, action: str, component: str):
        """Execute remediation action for configuration drift."""
        # This would integrate with actual configuration management systems
        logger.info(f"Executing remediation action for {component}: {action}")

    async def _generate_compliance_report(self, validation_result: Dict[str, Any]):
        """Generate configuration compliance report."""
        report = {
            "report_type": "configuration_compliance",
            "generated_at": time.time(),
            "baseline_info": {
                "baseline_id": validation_result["baseline_id"],
                "baseline_name": validation_result["baseline_name"]
            },
            "compliance_summary": {
                "overall_score": validation_result["overall_score"],
                "compliance_status": validation_result["compliance_status"].value if hasattr(validation_result["compliance_status"], 'value') else validation_result["compliance_status"],
                "drift_count": len(validation_result["drift_items"])
            },
            "category_breakdown": validation_result["category_results"],
            "drift_details": validation_result["drift_items"],
            "remediation_summary": {
                "auto_remediated": 0,  # Would be calculated
                "manual_required": len(validation_result["drift_items"]),
                "pending_approval": 0
            }
        }

        # Save report
        report_file = self.storage_path / f"compliance_report_{int(time.time())}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        logger.info(f"Generated compliance report: {report_file}")

    def stop_continuous_monitoring(self):
        """Stop continuous configuration monitoring."""
        self.active_monitoring = False
        logger.info("Stopped continuous configuration monitoring")

    def get_compliance_status(self, baseline_id: str) -> Dict[str, Any]:
        """Get current compliance status for baseline."""
        if baseline_id not in self.baselines:
            return {"error": f"Baseline {baseline_id} not found"}

        baseline = self.baselines[baseline_id]

        # Get recent drift history
        recent_drifts = [
            drift for drift in self.drift_history
            if time.time() - drift.detected_at < 86400  # Last 24 hours
        ]

        # Count drifts by severity
        drift_summary = {}
        for severity in DriftSeverity:
            drift_summary[severity.value] = len([
                d for d in recent_drifts if d.severity == severity
            ])

        return {
            "baseline_id": baseline_id,
            "baseline_name": baseline.name,
            "security_level": baseline.security_level.value,
            "monitoring_active": self.active_monitoring,
            "total_configurations": len(baseline.configurations),
            "recent_drift_summary": drift_summary,
            "last_validation": max([d.detected_at for d in recent_drifts] + [0]),
            "compliance_mappings": len(baseline.compliance_mappings),
            "validation_rules": len(baseline.validation_rules)
        }

# Factory function
def create_configuration_manager(config_path: Optional[str] = None) -> DFARSConfigurationManager:
    """Create DFARS configuration management system."""
    return DFARSConfigurationManager(config_path)

# Example usage
if __name__ == "__main__":
    async def main():
        # Initialize configuration manager
        config_mgr = create_configuration_manager()

        print("DFARS Configuration Management System")
        print("=" * 40)

        # Get default baseline
        baselines = list(config_mgr.baselines.keys())
        if baselines:
            baseline_id = baselines[0]
            print(f"Using baseline: {baseline_id}")

            # Validate configuration compliance
            validation_result = await config_mgr.validate_configuration_compliance(baseline_id)
            print(f"Compliance status: {validation_result['compliance_status']}")
            print(f"Overall score: {validation_result['overall_score']:.2%}")
            print(f"Drift items: {len(validation_result['drift_items'])}")

            # Get compliance status
            status = config_mgr.get_compliance_status(baseline_id)
            print(f"Security level: {status['security_level']}")
            print(f"Total configurations: {status['total_configurations']}")

        return config_mgr

    # Run example
    asyncio.run(main())