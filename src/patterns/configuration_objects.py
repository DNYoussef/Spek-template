"""
Configuration Object Pattern - Eliminating Long Parameter Lists
Enterprise-grade design pattern for perfect code quality
"""

from typing import Optional, Dict, Any

from dataclasses import dataclass

@dataclass
class AnalysisConfig:
    """Configuration object for analysis operations - replaces 7+ parameters."""

    project_path: str
    policy_preset: str = "strict-core"
    enable_caching: bool = True
    max_file_size: int = 100
    timeout_seconds: int = 30
    include_patterns: Optional[list] = None
    exclude_patterns: Optional[list] = None
    output_format: str = "json"
    verbose: bool = False

def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'project_path': self.project_path,
            'policy_preset': self.policy_preset,
            'enable_caching': self.enable_caching,
            'max_file_size': self.max_file_size,
            'timeout_seconds': self.timeout_seconds,
            'include_patterns': self.include_patterns or [],
            'exclude_patterns': self.exclude_patterns or [],
            'output_format': self.output_format,
            'verbose': self.verbose
        }

@dataclass
class SecurityConfig:
    """Configuration for security operations - replaces complex parameter lists."""

    encryption_enabled: bool = True
    audit_enabled: bool = True
    compliance_level: str = "DFARS"
    key_rotation_days: int = 90
    session_timeout_minutes: int = 30
    max_login_attempts: int = 3
    password_min_length: int = 12
    require_mfa: bool = True

@dataclass
class PerformanceConfig:
    """Performance tuning configuration - clean parameter passing."""

    cache_size_mb: int = 100
    worker_threads: int = 4
    connection_pool_size: int = 20
    batch_size: int = 100
    enable_profiling: bool = False
    memory_limit_mb: int = 1024
    cpu_limit_percent: int = 80

@dataclass
class ReportConfig:
    """Report generation configuration - eliminates parameter explosion."""

    report_type: str
    include_details: bool = True
    include_recommendations: bool = True
    max_violations_shown: int = 100
    group_by: str = "severity"
    output_path: str = ".claude/.artifacts/reports"
    timestamp_format: str = "ISO"
    include_metrics: bool = True

@dataclass
class IntegrationConfig:
    """External integration configuration - clean interface."""

    github_enabled: bool = True
    github_token: Optional[str] = None
    ci_platform: str = "github_actions"
    notification_webhook: Optional[str] = None
    enable_auto_fix: bool = False
    pr_auto_create: bool = False
    issue_auto_create: bool = True

class ConfigBuilder:
    """Builder pattern for complex configurations."""

def __init__(self):
        self._config = {}

def with_analysis(self, **kwargs) -> 'ConfigBuilder':
        """Add analysis configuration."""
        self._config['analysis'] = AnalysisConfig(**kwargs)
        return self

def with_security(self, **kwargs) -> 'ConfigBuilder':
        """Add security configuration."""
        self._config['security'] = SecurityConfig(**kwargs)
        return self

def with_performance(self, **kwargs) -> 'ConfigBuilder':
        """Add performance configuration."""
        self._config['performance'] = PerformanceConfig(**kwargs)
        return self

def with_reporting(self, **kwargs) -> 'ConfigBuilder':
        """Add reporting configuration."""
        self._config['reporting'] = ReportConfig(**kwargs)
        return self

def with_integration(self, **kwargs) -> 'ConfigBuilder':
        """Add integration configuration."""
        self._config['integration'] = IntegrationConfig(**kwargs)
        return self

def build(self) -> Dict[str, Any]:
        """Build the complete configuration."""
        return self._config

# Example usage showing clean parameter passing
def analyze_project_clean(config: AnalysisConfig) -> dict:
    """Clean function signature with configuration object."""
    # Previously would have been:

    return {
        'status': 'success',
        'project': config.project_path,
        'policy': config.policy_preset,
        'message': 'Analysis complete with clean configuration'
    }

def generate_report_clean(config: ReportConfig, data: dict) -> str:
    """Clean report generation without parameter explosion."""
    # Previously would have been:

    return f"Report of type {config.report_type} generated at {config.output_path}"

# Demonstration of improvement
if __name__ == "__main__":
    # Clean configuration building
    config = ConfigBuilder() \
        .with_analysis(project_path="src", policy_preset="strict-core") \
        .with_security(encryption_enabled=True, compliance_level="DFARS") \
        .with_performance(cache_size_mb=200, worker_threads=8) \
        .build()

    print("Configuration objects eliminate long parameter lists")
    print("Result: Clean, maintainable, enterprise-grade code")