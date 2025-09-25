from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
import re
import sys

# Add security module to path
sys.path.append(str(Path(__file__).parent.parent.parent.parent / 'src'))

try:
    from security.path_validator import PathSecurityValidator, SecurityError
except ImportError:
    # Fallback if security module not available
    PathSecurityValidator = None
    SecurityError = Exception

class SupplyChainConfigLoader:
    """Load and validate supply chain security configuration."""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or self._find_config_file()
        self._config_cache = None

        # Initialize DFARS-compliant path validator
        self.path_validator = None
        if PathSecurityValidator:
            allowed_paths = [
                str(Path.cwd()),
                str(Path.cwd() / "config"),
                str(Path.home() / ".spek"),
                os.path.expanduser("~/.spek")
            ]
            self.path_validator = PathSecurityValidator(allowed_paths)
        
    def _find_config_file(self) -> str:
        """Find enterprise configuration file."""
        
        # Search paths in order of preference
        search_paths = [
            "config/enterprise_config.yaml",
            "enterprise_config.yaml", 
            ".spek/config.yaml",
            os.path.expanduser("~/.spek/config.yaml")
        ]
        
        for path in search_paths:
            if path_exists(path):
                return str(Path(path).resolve())
        
        # Return default path if none found
        return "config/enterprise_config.yaml"
    
    def load_config(self, reload: bool = False) -> Dict[str, Any]:
        """Load enterprise configuration with DFARS-compliant path validation."""

        if self._config_cache and not reload:
            return self._config_cache

        try:
            config_path = Path(self.config_path)

            # DFARS Compliance: Validate configuration file path
            if self.path_validator:
                validation_result = self.path_validator.validate_path(str(config_path), 'read')
                if not validation_result['valid']:
                    print(f"Security Warning: Config path validation failed: {validation_result['security_violations']}")
                    return self._get_default_config()

            if not config_path.exists():
                print(f"Warning: Config file not found at {config_path}, using defaults")
                return self._get_default_config()

            with open(config_path, 'r', encoding='utf-8') as f:
                config_content = f.read()

            # Substitute environment variables with security validation
            config_content = self._substitute_env_vars_secure(config_content)

            # Parse YAML
            config = yaml.safe_load(config_content)

            # Validate and set defaults with security enhancements
            config = self._validate_and_set_defaults_secure(config)

            # Cache the config
            self._config_cache = config

            return config

        except Exception as e:
            print(f"Error loading config from {self.config_path}: {e}")
            return self._get_default_config()
    
    def _substitute_env_vars(self, content: str) -> str:
        """Substitute environment variables in config content."""
        
        def replace_env_var(match):
            var_name = match.group(1)
            default_value = match.group(2) if match.group(2) else ""
            
            # Get environment variable value
            env_value = os.environ.get(var_name)
            
            if env_value is not None:
                return env_value
            elif default_value:
                return default_value
            else:
                # Return empty string for undefined variables
                return ""
        
        # Pattern: ${VAR_NAME} or ${VAR_NAME:default_value}
        pattern = r'\$\{([A-Z_][A-Z0-9_]*?)(?::([^}]*))?\}'
        
        return re.sub(pattern, replace_env_var, content)

    def _substitute_env_vars_secure(self, content: str) -> str:
        """Securely substitute environment variables with validation."""
        # Use existing implementation but add security logging
        result = self._substitute_env_vars(content)

        # Log if sensitive patterns detected in environment substitution
        sensitive_patterns = ['password', 'secret', 'key', 'token']
        for pattern in sensitive_patterns:
            if pattern.lower() in result.lower():
                print(f"Security Notice: Sensitive configuration detected: {pattern}")

        return result

    def _validate_and_set_defaults_secure(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced validation with security controls."""
        # Use existing validation
        config = self._validate_and_set_defaults(config)

        # Add DFARS security enhancements
        if 'supply_chain' not in config:
            config['supply_chain'] = {}

        sc_config = config['supply_chain']

        # DFARS-specific security defaults
        security_defaults = {
            'security_level': 'dfars_compliant',
            'path_validation_enabled': True,
            'crypto_compliance_mode': 'dfars_252_204_7012',
            'audit_trail_enabled': True,
            'tls_min_version': '1.3',
            'require_crypto_validation': True,
            'data_protection_level': 'defense_grade'
        }

        for key, default_value in security_defaults.items():
            if key not in sc_config:
                sc_config[key] = default_value

        # Update cryptographic signing for DFARS compliance
        if 'cryptographic_signing' in sc_config:
            crypto_config = sc_config['cryptographic_signing']
            # Remove SHA1 from allowed algorithms for DFARS compliance
            if 'allowed_algorithms' in crypto_config:
                allowed_algs = crypto_config['allowed_algorithms']
                crypto_config['allowed_algorithms'] = [
                    alg for alg in allowed_algs
                    if 'sha1' not in alg.lower() and 'md5' not in alg.lower()
                ]
                # Ensure strong algorithms are present
                if 'RSA-SHA256' not in crypto_config['allowed_algorithms']:
                    crypto_config['allowed_algorithms'].append('RSA-SHA256')
                if 'ECDSA-SHA256' not in crypto_config['allowed_algorithms']:
                    crypto_config['allowed_algorithms'].append('ECDSA-SHA256')

        return config
    
    def _validate_and_set_defaults(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate configuration and set defaults using validation strategies."""
        from analyzer.enterprise.supply_chain.config_validation_strategies import (
            ConfigStructureStrategy, CryptographicStrategy, ComplianceFrameworkStrategy,
            PerformanceValidationStrategy, SecurityRuleEngine
        )
        from src.utils.validation.validation_framework import ValidationEngine

        if not config:
            return self._get_default_config()

        # Initialize validation engine
        engine = ValidationEngine()
        engine.register_strategy("structure", ConfigStructureStrategy())
        engine.register_strategy("crypto", CryptographicStrategy())
        engine.register_strategy("compliance", ComplianceFrameworkStrategy())
        engine.register_strategy("performance", PerformanceValidationStrategy())

        # Initialize rule engine for security
        rule_engine = SecurityRuleEngine()

        # Apply defaults first
        config = self._apply_configuration_defaults(config)

        # Run validation strategies
        validation_results = self._run_config_validations(engine, config)

        # Run security rules
        security_validation = rule_engine.evaluate(config)

        # Log validation results
        self._log_validation_results(validation_results, security_validation)

        return config

    def _apply_configuration_defaults(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Apply default configuration values."""
        # Ensure supply_chain section exists
        if 'supply_chain' not in config:
            config['supply_chain'] = {}

        sc_config = config['supply_chain']

        # Apply defaults in smaller, focused chunks
        self._apply_supply_chain_defaults(sc_config)
        self._apply_component_defaults(sc_config)
        self._apply_integration_defaults(config)

        return config

    def _apply_supply_chain_defaults(self, sc_config: Dict[str, Any]):
        """Apply supply chain main defaults."""
        sc_defaults = {
            'enabled': True,
            'output_dir': '.claude/.artifacts/supply_chain',
            'performance_overhead_target': 1.8,
            'enable_parallel_processing': True,
            'max_workers': 4,
            'timeout_seconds': 300
        }

        for key, default_value in sc_defaults.items():
            if key not in sc_config:
                sc_config[key] = default_value

    def _apply_component_defaults(self, sc_config: Dict[str, Any]):
        """Apply component-specific defaults."""
        components = {
            'sbom': {
                'formats': ['CycloneDX-1.4', 'SPDX-2.3'],
                'include_dev_dependencies': True,
                'include_system_components': True,
                'tool_name': 'SPEK-Supply-Chain-Analyzer',
                'tool_version': '1.0.0'
            },
            'slsa': {
                'level': 3,
                'builder_id': 'https://spek.dev/builder/v1',
                'builder_version': '1.0.0',
                'build_type': 'https://spek.dev/build-types/generic@v1'
            },
            'vulnerability_scanning': {
                'enabled': True,
                'databases': ['OSV', 'GitHub'],
                'osv_api_url': 'https://api.osv.dev/v1'
            },
            'cryptographic_signing': {
                'enabled': True,
                'signing_method': 'cosign',
                'allowed_algorithms': ['RSA-SHA256', 'ECDSA-SHA256'],
                'min_key_size': 2048
            }
        }

        for component, defaults in components.items():
            if component not in sc_config:
                sc_config[component] = {}
            for key, value in defaults.items():
                if key not in sc_config[component]:
                    sc_config[component][key] = value

    def _apply_integration_defaults(self, config: Dict[str, Any]):
        """Apply integration defaults."""
        if 'integration' not in config:
            config['integration'] = {}

        integration_defaults = {
            'non_breaking': True,
            'priority': 'normal',
            'performance_monitoring': {
                'enabled': True,
                'baseline_duration': MAXIMUM_FUNCTION_PARAMETERS.0,
                'alert_threshold': 2.0
            }
        }

        for key, default_value in integration_defaults.items():
            if key not in config['integration']:
                config['integration'][key] = default_value

    def _run_config_validations(self, engine: ValidationEngine, config: Dict) -> Dict:
        """Run all configuration validation strategies."""
        results = {}

        # Structure validation
        results["structure"] = engine.validate("structure", config)

        # Cryptographic validation
        results["crypto"] = engine.validate("crypto", config)

        # Compliance validation
        results["compliance"] = engine.validate("compliance", config.get('supply_chain', {}))

        # Performance validation
        results["performance"] = engine.validate("performance", config)

        return results

    def _log_validation_results(self, validation_results: Dict, security_validation):
        """Log validation results for debugging."""
        for strategy_name, result in validation_results.items():
            if not result.is_valid:
                print(f"Config validation {strategy_name} failed: {', '.join(result.errors)}")
            if result.warnings:
                print(f"Config validation {strategy_name} warnings: {', '.join(result.warnings)}")

        if not security_validation.is_valid:
            print(f"Security rules failed: {', '.join(security_validation.errors)}")
        if security_validation.warnings:
            print(f"Security warnings: {', '.join(security_validation.warnings)}")
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration when file is not available."""
        
        return {
            'supply_chain': {
                'enabled': True,
                'output_dir': '.claude/.artifacts/supply_chain',
                'performance_overhead_target': 1.8,
                'enable_parallel_processing': True,
                'max_workers': 4,
                'timeout_seconds': 300,
                'sbom': {
                    'formats': ['CycloneDX-1.4', 'SPDX-2.3'],
                    'include_dev_dependencies': True,
                    'include_system_components': True,
                    'tool_name': 'SPEK-Supply-Chain-Analyzer',
                    'tool_version': '1.0.0'
                },
                'slsa': {
                    'level': 3,
                    'builder_id': 'https://spek.dev/builder/v1',
                    'builder_version': '1.0.0',
                    'build_type': 'https://spek.dev/build-types/generic@v1',
                    'fulcio_url': 'https://fulcio.sigstore.dev',
                    'rekor_url': 'https://rekor.sigstore.dev',
                    'reproducible_builds': False
                },
                'vulnerability_scanning': {
                    'enabled': True,
                    'databases': ['OSV', 'GitHub'],
                    'osv_api_url': 'https://api.osv.dev/v1',
                    'severity_thresholds': {
                        'critical': 9.0,
                        'high': 7.0,
                        'medium': 4.0,
                        'low': 0.1
                    }
                },
                'license_compliance': {
                    'enabled': True,
                    'allowed_licenses': ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC'],
                    'restricted_licenses': ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0', 'CDDL-1.0', 'MPL-2.0'],
                    'prohibited_licenses': ['SSPL-1.0', 'Commons-Clause', 'Elastic-2.0', 'BUSL-1.1']
                },
                'cryptographic_signing': {
                    'enabled': True,
                    'signing_method': 'cosign',
                    'cosign_binary': 'cosign',
                    'require_timestamp': True,
                    'require_cert_chain': True,
                    'check_revocation': False,
                    'allowed_algorithms': ['RSA-SHA256', 'ECDSA-SHA256'],
                    'min_key_size': 2048
                },
                'evidence_packaging': {
                    'enabled': True,
                    'package_format': 'zip',
                    'compression_level': 6,
                    'max_file_size_mb': 100,
                    'include_sbom': True,
                    'include_provenance': True,
                    'include_vulnerabilities': True,
                    'include_signatures': True,
                    'include_compliance': True,
                    'include_build_logs': False,
                    'include_source_code': False,
                    'contact_email': 'security@company.com',
                    'reviewer': 'Security Team'
                }
            },
            'integration': {
                'non_breaking': True,
                'priority': 'normal',
                'performance_monitoring': {
                    'enabled': True,
                    'baseline_duration': MAXIMUM_FUNCTION_PARAMETERS.0,
                    'alert_threshold': 2.0
                },
                'quality_gates': {
                    'enabled': True,
                    'fail_on_critical_vulnerabilities': True,
                    'fail_on_prohibited_licenses': True,
                    'fail_on_signing_failures': True,
                    'max_critical_vulnerabilities': 0,
                    'max_high_vulnerabilities': 5
                }
            }
        }
    
    def get_supply_chain_config(self) -> Dict[str, Any]:
        """Get supply chain specific configuration."""
        
        config = self.load_config()
        return config.get('supply_chain', {})
    
    def get_component_config(self, component_name: str) -> Dict[str, Any]:
        """Get configuration for a specific component."""
        
        sc_config = self.get_supply_chain_config()
        
        component_map = {
            'sbom': 'sbom',
            'slsa': 'slsa',
            'vulnerability': 'vulnerability_scanning',
            'license': 'license_compliance',
            'crypto': 'cryptographic_signing',
            'signing': 'cryptographic_signing',
            'evidence': 'evidence_packaging',
            'packaging': 'evidence_packaging'
        }
        
        config_key = component_map.get(component_name, component_name)
        return sc_config.get(config_key, {})
    
    def create_component_config(self, component_name: str) -> Dict[str, Any]:
        """Create configuration dictionary for component initialization."""
        
        sc_config = self.get_supply_chain_config()
        component_config = self.get_component_config(component_name)
        
        # Merge global settings with component-specific settings
        config = {
            'output_dir': sc_config.get('output_dir', '.claude/.artifacts/supply_chain'),
            'performance_overhead_target': sc_config.get('performance_overhead_target', 1.8),
            'enable_parallel_processing': sc_config.get('enable_parallel_processing', True),
            'max_workers': sc_config.get('max_workers', 4),
            'timeout_seconds': sc_config.get('timeout_seconds', 300)
        }
        
        # Add component-specific configuration
        config.update(component_config)
        
        # Add global settings that components might need
        if component_name in ['crypto', 'signing']:
            # Add signing-specific environment variables
            env_vars = {
                'signing_key_path': os.environ.get('SIGNING_KEY_PATH'),
                'signing_cert_path': os.environ.get('SIGNING_CERT_PATH'),
                'signing_key_password': os.environ.get('SIGNING_KEY_PASSWORD'),
                'ca_cert_path': os.environ.get('CA_CERT_PATH'),
                'intermediate_cert_path': os.environ.get('INTERMEDIATE_CERT_PATH'),
                'oidc_issuer': os.environ.get('OIDC_ISSUER'),
                'oidc_client_id': os.environ.get('OIDC_CLIENT_ID')
            }
            
            for key, value in env_vars.items():
                if value:  # Only add non-empty environment variables
                    config[key] = value
        
        elif component_name in ['vulnerability']:
            # Add API keys for vulnerability scanning
            config['nvd_api_key'] = os.environ.get('NVD_API_KEY')
            config['github_api_key'] = os.environ.get('GITHUB_API_KEY')
        
        return config
    
    def validate_config(self) -> Dict[str, Any]:
        """Validate configuration and return validation results."""
        
        validation = {
            'valid': True,
            'warnings': [],
            'errors': [],
            'missing_env_vars': []
        }
        
        try:
            config = self.load_config()
            
            # Check if supply chain is enabled
            sc_config = config.get('supply_chain', {})
            if not sc_config.get('enabled', True):
                validation['warnings'].append('Supply chain security is disabled')
            
            # Validate output directory
            output_dir = Path(sc_config.get('output_dir', '.claude/.artifacts/supply_chain'))
            try:
                output_dir.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                validation['errors'].append(f'Cannot create output directory: {e}')
                validation['valid'] = False
            
            # Check for required environment variables
            required_env_vars = [
                'SIGNING_KEY_PATH',
                'SIGNING_CERT_PATH',
                'NVD_API_KEY',
                'GITHUB_API_KEY'
            ]
            
            for env_var in required_env_vars:
                if not os.environ.get(env_var):
                    validation['missing_env_vars'].append(env_var)
            
            if validation['missing_env_vars']:
                validation['warnings'].append(
                    f"Missing environment variables: {', '.join(validation['missing_env_vars'])}"
                )
            
            # Validate component configurations
            components = ['sbom', 'slsa', 'vulnerability_scanning', 'cryptographic_signing', 'evidence_packaging']
            for component in components:
                if component not in sc_config:
                    validation['warnings'].append(f'No configuration for {component}, using defaults')
            
        except Exception as e:
            validation['errors'].append(f'Configuration validation failed: {e}')
            validation['valid'] = False
        
        return validation
    
    def get_performance_config(self) -> Dict[str, Any]:
        """Get performance-related configuration."""
        
        config = self.load_config()
        sc_config = config.get('supply_chain', {})
        integration_config = config.get('integration', {})
        
        return {
            'performance_overhead_target': sc_config.get('performance_overhead_target', 1.8),
            'enable_parallel_processing': sc_config.get('enable_parallel_processing', True),
            'max_workers': sc_config.get('max_workers', 4),
            'timeout_seconds': sc_config.get('timeout_seconds', 300),
            'baseline_duration': integration_config.get('performance_monitoring', {}).get('baseline_duration', MAXIMUM_FUNCTION_PARAMETERS.0),
            'alert_threshold': integration_config.get('performance_monitoring', {}).get('alert_threshold', 2.0)
        }