"""
Enterprise Configuration Management

Centralized configuration system for all enterprise features with
environment-specific settings and security controls.
"""

from lib.shared.utilities import get_logger

class EnvironmentType(Enum):
    """Environment types"""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"

@dataclass
class TelemetryConfig:
    """Six Sigma telemetry configuration"""
    enabled: bool = True
    dpmo_threshold: float = 6210.0  # 4-sigma level
    rty_threshold: float = 95.0
    auto_generate_reports: bool = True
    report_interval_hours: int = 24
    store_detailed_metrics: bool = True

@dataclass
class SecurityConfig:
    """Supply chain security configuration"""
    enabled: bool = True
    sbom_format: str = "cyclonedx-json"
    slsa_level: int = 2
    vulnerability_scanning: bool = True
    auto_security_reports: bool = True
    security_level: str = "enhanced"  # basic, enhanced, critical, top_secret

@dataclass
class ComplianceConfig:
    """Compliance framework configuration"""
    enabled: bool = True
    frameworks: List[str] = field(default_factory=lambda: ["soc2-type2", "iso27001", "nist-csf"])
    auto_compliance_checks: bool = True
    evidence_collection: bool = True
    audit_trail_enabled: bool = True

@dataclass
class FeatureFlagConfig:
    """Feature flag system configuration"""
    enabled: bool = True
    config_file: Optional[str] = "feature-flags.json"
    auto_reload: bool = True
    monitoring_enabled: bool = True
    default_rollout_strategy: str = "percentage"

@dataclass
class IntegrationConfig:
    """Analyzer integration configuration"""
    enabled: bool = True
    auto_wrap_analyzers: bool = True
    hook_system_enabled: bool = True
    performance_monitoring: bool = True
    error_recovery_enabled: bool = True

@dataclass
class LoggingConfig:
    """Enterprise logging configuration"""
    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    file_logging: bool = True
    log_file: str = "enterprise.log"
    max_file_size_mb: int = 100
    backup_count: int = 5
    structured_logging: bool = True

class EnterpriseConfig:
    """
    Enterprise configuration manager
    
    Provides centralized configuration management for all enterprise features
    with support for environment-specific overrides and secure configuration.
    """
    
    def __init__(self, 
                config_file: Optional[Path] = None,
                environment: EnvironmentType = EnvironmentType.DEVELOPMENT):
        self.environment = environment
        self.config_file = config_file or self._get_default_config_file()
        
        # Initialize default configurations
        self.telemetry = TelemetryConfig()
        self.security = SecurityConfig()
        self.compliance = ComplianceConfig()
        self.feature_flags = FeatureFlagConfig()
        self.integration = IntegrationConfig()
        self.logging = LoggingConfig()
        
        # Custom configurations
        self.custom_config: Dict[str, Any] = {}
        
        # Load configuration if file exists
        self._load_config()
        
        # Apply environment-specific overrides
        self._apply_environment_overrides()
        
    def _get_default_config_file(self) -> Path:
        """Get default configuration file path"""
        return Path.cwd() / "enterprise-config.yaml"
        
    def _load_config(self):
        """Load configuration from file"""
        if not self.config_file.exists():
            logger.info(f"Configuration file {self.config_file} not found, using defaults")
            return
            
        try:
            if self.config_file.suffix.lower() in ['.yaml', '.yml']:
                with open(self.config_file) as f:
                    config_data = yaml.safe_load(f)
            else:
                with open(self.config_file) as f:
                    config_data = json.load(f)
                    
            # Update configurations from file
            if 'telemetry' in config_data:
                self._update_dataclass(self.telemetry, config_data['telemetry'])
                
            if 'security' in config_data:
                self._update_dataclass(self.security, config_data['security'])
                
            if 'compliance' in config_data:
                self._update_dataclass(self.compliance, config_data['compliance'])
                
            if 'feature_flags' in config_data:
                self._update_dataclass(self.feature_flags, config_data['feature_flags'])
                
            if 'integration' in config_data:
                self._update_dataclass(self.integration, config_data['integration'])
                
            if 'logging' in config_data:
                self._update_dataclass(self.logging, config_data['logging'])
                
            if 'custom' in config_data:
                self.custom_config = config_data['custom']
                
            logger.info(f"Configuration loaded from {self.config_file}")
            
        except Exception as e:
            logger.error(f"Error loading configuration: {e}")
            
    def _update_dataclass(self, dataclass_instance, config_dict):
        """Update dataclass instance with configuration dictionary"""
        for key, value in config_dict.items():
            if hasattr(dataclass_instance, key):
                setattr(dataclass_instance, key, value)
                
    def _apply_environment_overrides(self):
        """Apply environment-specific configuration overrides"""
        if self.environment == EnvironmentType.DEVELOPMENT:
            # Development overrides
            self.telemetry.store_detailed_metrics = True
            self.security.vulnerability_scanning = True
            self.logging.level = "DEBUG"
            
        elif self.environment == EnvironmentType.TESTING:
            # Testing overrides
            self.telemetry.auto_generate_reports = False
            self.security.auto_security_reports = False
            self.integration.performance_monitoring = True
            
        elif self.environment == EnvironmentType.STAGING:
            # Staging overrides (production-like but with more monitoring)
            self.telemetry.report_interval_hours = 12
            self.security.slsa_level = 3
            self.compliance.audit_trail_enabled = True
            self.logging.level = "INFO"
            
        elif self.environment == EnvironmentType.PRODUCTION:
            # Production overrides (security-focused)
            self.telemetry.store_detailed_metrics = False  # Performance
            self.security.slsa_level = 3
            self.security.security_level = "critical"
            self.compliance.frameworks = ["soc2-type2", "iso27001", "nist-csf", "gdpr"]
            self.logging.level = "WARNING"
            self.logging.structured_logging = True
            
    def get_config_dict(self) -> Dict[str, Any]:
        """Get complete configuration as dictionary"""
        return {
            'environment': self.environment.value,
            'telemetry': asdict(self.telemetry),
            'security': asdict(self.security),
            'compliance': asdict(self.compliance),
            'feature_flags': asdict(self.feature_flags),
            'integration': asdict(self.integration),
            'logging': asdict(self.logging),
            'custom': self.custom_config
        }
        
    def save_config(self, file_path: Optional[Path] = None):
        """Save current configuration to file"""
        output_file = file_path or self.config_file
        config_dict = self.get_config_dict()
        
        try:
            if output_file.suffix.lower() in ['.yaml', '.yml']:
                with open(output_file, 'w') as f:
                    yaml.dump(config_dict, f, default_flow_style=False, indent=2)
            else:
                with open(output_file, 'w') as f:
                    json.dump(config_dict, f, indent=2)
                    
            logger.info(f"Configuration saved to {output_file}")
            
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
            
    def update_config(self, section: str, updates: Dict[str, Any]):
        """Update specific configuration section"""
        if section == 'telemetry':
            self._update_dataclass(self.telemetry, updates)
        elif section == 'security':
            self._update_dataclass(self.security, updates)
        elif section == 'compliance':
            self._update_dataclass(self.compliance, updates)
        elif section == 'feature_flags':
            self._update_dataclass(self.feature_flags, updates)
        elif section == 'integration':
            self._update_dataclass(self.integration, updates)
        elif section == 'logging':
            self._update_dataclass(self.logging, updates)
        elif section == 'custom':
            self.custom_config.update(updates)
        else:
            raise ValueError(f"Unknown configuration section: {section}")
            
        logger.info(f"Updated configuration section: {section}")
        
    def get_environment_config(self, env: EnvironmentType) -> 'EnterpriseConfig':
        """Get configuration for specific environment"""
        # Create a copy of current config
        env_config = EnterpriseConfig(environment=env)
        
        # Copy current settings
        env_config.telemetry = TelemetryConfig(**asdict(self.telemetry))
        env_config.security = SecurityConfig(**asdict(self.security))
        env_config.compliance = ComplianceConfig(**asdict(self.compliance))
        env_config.feature_flags = FeatureFlagConfig(**asdict(self.feature_flags))
        env_config.integration = IntegrationConfig(**asdict(self.integration))
        env_config.logging = LoggingConfig(**asdict(self.logging))
        env_config.custom_config = self.custom_config.copy()
        
        # Apply environment-specific overrides
        env_config._apply_environment_overrides()
        
        return env_config
        
    def validate_config(self) -> List[str]:
        """Validate configuration and return list of issues"""
        issues = []
        
        # Validate telemetry config
        if self.telemetry.dpmo_threshold < 0:
            issues.append("Telemetry DPMO threshold must be positive")
        if self.telemetry.rty_threshold < 0 or self.telemetry.rty_threshold > 100:
            issues.append("Telemetry RTY threshold must be between 0 and 100")
            
        # Validate security config
        if self.security.slsa_level not in [1, 2, 3, 4]:
            issues.append("Security SLSA level must be 1, 2, 3, or 4")
        if self.security.security_level not in ["basic", "enhanced", "critical", "top_secret"]:
            issues.append("Security level must be basic, enhanced, critical, or top_secret")
            
        # Validate compliance config
        valid_frameworks = ["soc2-type1", "soc2-type2", "iso27001", "nist-csf", "gdpr", "hipaa", "pci-dss"]
        for framework in self.compliance.frameworks:
            if framework not in valid_frameworks:
                issues.append(f"Unknown compliance framework: {framework}")
                
        # Validate logging config
        if self.logging.level not in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
            issues.append("Logging level must be DEBUG, INFO, WARNING, ERROR, or CRITICAL")
            
        return issues
        
    @classmethod
    def get_default_config(cls, environment: EnvironmentType = EnvironmentType.DEVELOPMENT) -> Dict[str, Any]:
        """Get default configuration for specified environment"""
        config = cls(environment=environment)
        return config.get_config_dict()
        
    @classmethod
    def from_environment_variables(cls) -> 'EnterpriseConfig':
        """Create configuration from environment variables"""
        env_type = EnvironmentType(os.environ.get('ENTERPRISE_ENV', 'development'))
        config = cls(environment=env_type)
        
        # Override with environment variables
        if 'ENTERPRISE_TELEMETRY_ENABLED' in os.environ:
            config.telemetry.enabled = os.environ['ENTERPRISE_TELEMETRY_ENABLED'].lower() == 'true'
            
        if 'ENTERPRISE_SECURITY_LEVEL' in os.environ:
            config.security.security_level = os.environ['ENTERPRISE_SECURITY_LEVEL']
            
        if 'ENTERPRISE_COMPLIANCE_FRAMEWORKS' in os.environ:
            config.compliance.frameworks = os.environ['ENTERPRISE_COMPLIANCE_FRAMEWORKS'].split(',')
            
        if 'ENTERPRISE_LOG_LEVEL' in os.environ:
            config.logging.level = os.environ['ENTERPRISE_LOG_LEVEL']
            
        return config
        
    def setup_logging(self):
        """Setup logging based on configuration"""
        import logging.handlers
        
        # Create logger
        root_logger = logging.getLogger()
        root_logger.setLevel(getattr(logging, self.logging.level))
        
        # Clear existing handlers
        root_logger.handlers.clear()
        
        # Create formatter
        if self.logging.structured_logging:
            formatter = logging.Formatter(
                '{"timestamp": "%(asctime)s", "name": "%(name)s", '
                '"level": "%(levelname)s", "message": "%(message)s"}'
            )
        else:
            formatter = logging.Formatter(self.logging.format)
            
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
        
        # File handler if enabled
        if self.logging.file_logging:
            file_handler = logging.handlers.RotatingFileHandler(
                self.logging.log_file,
                maxBytes=self.logging.max_file_size_mb * 1024 * 1024,
                backupCount=self.logging.backup_count
            )
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
            
        logger.info(f"Logging configured for {self.environment.value} environment")