"""Configuration management system for all linter tools."""

from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import json

from dataclasses import dataclass, field
from lib.shared.utilities import get_logger
import configparser
import yaml

@dataclass
class LinterSuiteConfig:
    """Configuration for the complete linter suite."""
    enabled_tools: List[str] = field(default_factory=lambda: ['flake8', 'pylint', 'ruff', 'mypy', 'bandit'])
    concurrent_execution: bool = True
    max_workers: int = 5
    timeout_per_tool: int = 300  # seconds
    
    # Tool-specific configurations
    tool_configs: Dict[str, LinterConfig] = field(default_factory=dict)
    
    # Global overrides
    global_severity_overrides: Dict[str, StandardSeverity] = field(default_factory=dict)
    global_disabled_rules: List[str] = field(default_factory=list)
    
    # Output configuration
    output_format: str = 'json'  # json, text, junit
    output_file: Optional[str] = None
    
    # Filtering
    min_severity: StandardSeverity = StandardSeverity.INFO
    include_patterns: List[str] = field(default_factory=lambda: ['**/*.py'])
    exclude_patterns: List[str] = field(default_factory=lambda: ['__pycache__/**', '.git/**'])

class LinterConfigValidator(ConfigValidator):
    """Validates linter configuration data."""

    def validate(self, config: Dict[str, Any]) -> List[str]:
        """Validate linter configuration."""
        errors = []

        # Validate enabled tools
        if 'enabled_tools' in config:
            supported_tools = {'flake8', 'pylint', 'ruff', 'mypy', 'bandit'}
            for tool in config['enabled_tools']:
                if tool not in supported_tools:
                    errors.append(f"Unsupported linter tool: {tool}")

        # Validate timeout values
        if 'timeout_per_tool' in config and config['timeout_per_tool'] <= 0:
            errors.append("timeout_per_tool must be positive")

        # Validate max_workers
        if 'max_workers' in config and config['max_workers'] <= 0:
            errors.append("max_workers must be positive")

        return errors

    def get_validator_name(self) -> str:
        return "LinterConfigValidator"

class LinterSuiteConfigFactory(ConfigFactory[LinterSuiteConfig]):
    """Factory for creating linter suite configurations."""

    def __init__(self):
        super().__init__()
        self.add_validator(LinterConfigValidator())

    def create_config(self, config_data: Dict[str, Any]) -> LinterSuiteConfig:
        """Create LinterSuiteConfig from validated data."""
        suite_config = LinterSuiteConfig()

        # Apply configuration data
        if 'enabled_tools' in config_data:
            suite_config.enabled_tools = config_data['enabled_tools']
        if 'concurrent_execution' in config_data:
            suite_config.concurrent_execution = config_data['concurrent_execution']
        if 'max_workers' in config_data:
            suite_config.max_workers = config_data['max_workers']
        if 'timeout_per_tool' in config_data:
            suite_config.timeout_per_tool = config_data['timeout_per_tool']

        return suite_config

class LinterConfigManager:
    """Manages configuration for all linter adapters using factory pattern."""

    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file
        self._config_manager = ConfigurationManager()
        self._setup_factories()

        # Initialize with defaults
        default_data = self._get_default_config_data()
        result = self._config_manager.create_configuration('linter_suite', default_data)

        if result.success:
            self.suite_config = result.config
        else:
            logger.error(f"Failed to create default config: {result.errors}")
            self.suite_config = LinterSuiteConfig()

        self._default_configs = self._get_default_tool_configs()

        if config_file:
            self.load_config(config_file)

    def _setup_factories(self):
        """Setup configuration factories."""
        factory = LinterSuiteConfigFactory()
        self._config_manager.register_factory('linter_suite', factory)

    def _get_default_config_data(self) -> Dict[str, Any]:
        """Get default configuration data."""
        return {
            'enabled_tools': ['flake8', 'pylint', 'ruff', 'mypy', 'bandit'],
            'concurrent_execution': True,
            'max_workers': 5,
            'timeout_per_tool': 300
        }
    
def load_config(self, config_file: str) -> None:
        """Load configuration from file."""
        config_path = Path(config_file)
        
        if not config_path.exists():
            logger.warning(f"Config file {config_file} not found, using defaults")
            return
        
        try:
            if config_path.suffix in ['.yml', '.yaml']:
                self._load_yaml_config(config_path)
            elif config_path.suffix == '.json':
                self._load_json_config(config_path)
            else:
                logger.warning(f"Unsupported config format: {config_path.suffix}")
        except Exception as e:
            logger.error(f"Failed to load config from {config_file}: {e}")
    
def _load_yaml_config(self, config_path: Path) -> None:
        """Load YAML configuration."""
        with open(config_path, 'r') as f:
            data = yaml.safe_load(f)
        
        self._apply_config_data(data)
    
def _load_json_config(self, config_path: Path) -> None:
        """Load JSON configuration."""
        with open(config_path, 'r') as f:
            data = json.load(f)
        
        self._apply_config_data(data)
    
def _apply_config_data(self, data: Dict[str, Any]) -> None:
        """Apply configuration data to suite config."""
        if 'enabled_tools' in data:
            self.suite_config.enabled_tools = data['enabled_tools']
        
        if 'concurrent_execution' in data:
            self.suite_config.concurrent_execution = data['concurrent_execution']
        
        if 'max_workers' in data:
            self.suite_config.max_workers = data['max_workers']
        
        if 'timeout_per_tool' in data:
            self.suite_config.timeout_per_tool = data['timeout_per_tool']
        
        if 'min_severity' in data:
            self.suite_config.min_severity = StandardSeverity(data['min_severity'])
        
        # Load tool-specific configurations
        if 'tools' in data:
            for tool_name, tool_config in data['tools'].items():
                self.suite_config.tool_configs[tool_name] = self._create_tool_config(tool_name, tool_config)
    
def _create_tool_config(self, tool_name: str, config_data: Dict[str, Any]) -> LinterConfig:
        """Create LinterConfig from configuration data."""
        base_config = self._default_configs.get(tool_name, LinterConfig(tool_name=tool_name))
        
        # Override with provided configuration
        if 'executable_path' in config_data:
            base_config.executable_path = config_data['executable_path']
        
        if 'config_file' in config_data:
            base_config.config_file = config_data['config_file']
        
        if 'extra_args' in config_data:
            base_config.extra_args = config_data['extra_args']
        
        if 'enabled_rules' in config_data:
            base_config.enabled_rules = config_data['enabled_rules']
        
        if 'disabled_rules' in config_data:
            base_config.disabled_rules = config_data['disabled_rules']
        
        if 'severity_overrides' in config_data:
            overrides = {}
            for rule, severity in config_data['severity_overrides'].items():
                overrides[rule] = StandardSeverity(severity)
            base_config.severity_overrides = overrides
        
        if 'timeout' in config_data:
            base_config.timeout = config_data['timeout']
        
        return base_config
    
def get_tool_config(self, tool_name: str) -> LinterConfig:
        """Get configuration for a specific tool."""
        if tool_name in self.suite_config.tool_configs:
            return self.suite_config.tool_configs[tool_name]
        
        # Return default configuration
        return self._default_configs.get(tool_name, LinterConfig(tool_name=tool_name))
    
def get_enabled_tools(self) -> List[str]:
        """Get list of enabled tools."""
        return self.suite_config.enabled_tools
    
def is_tool_enabled(self, tool_name: str) -> bool:
        """Check if a tool is enabled."""
        return tool_name in self.suite_config.enabled_tools
    
def _get_default_tool_configs(self) -> Dict[str, LinterConfig]:
        """Get default configurations for all supported tools."""
        return {
            'flake8': LinterConfig(
                tool_name='flake8',
                config_file=self._find_config_file('flake8', ['.flake8', 'setup.cfg', 'tox.ini']),
                extra_args=['--max-line-length=88', '--extend-ignore=E203, W503']
            ),
            'pylint': LinterConfig(
                tool_name='pylint',
                config_file=self._find_config_file('pylint', ['.pylintrc', 'pylintrc', 'pyproject.toml']),
                extra_args=['--disable=C0114, C0115, C0116']  # Disable missing docstring warnings
            ),
            'ruff': LinterConfig(
                tool_name='ruff',
                config_file=self._find_config_file('ruff', ['ruff.toml', 'pyproject.toml']),
                extra_args=['--line-length=88']
            ),
            'mypy': LinterConfig(
                tool_name='mypy',
                config_file=self._find_config_file('mypy', ['mypy.ini', 'pyproject.toml', 'setup.cfg']),
                extra_args=['--ignore-missing-imports']
            ),
            'bandit': LinterConfig(
                tool_name='bandit',
                config_file=self._find_config_file('bandit', ['.bandit', 'bandit.yaml', 'pyproject.toml']),
                extra_args=['-ll']  # Low verbosity
            )
        }
    
def _find_config_file(self, tool_name: str, possible_files: List[str]) -> Optional[str]:
        """Find configuration file for a tool."""
        for filename in possible_files:
            config_path = Path(filename)
            if config_path.exists():
                # For shared config files, check if they contain tool-specific sections
                if filename in ['setup.cfg', 'pyproject.toml']:
                    if self._config_contains_tool_section(config_path, tool_name):
                        return str(config_path)
                else:
                    return str(config_path)
        
        return None
    
def _config_contains_tool_section(self, config_path: Path, tool_name: str) -> bool:
        """Check if a config file contains a section for the specified tool."""
        try:
            if config_path.suffix == '.toml':
                # Check TOML files for tool sections
                with open(config_path, 'r') as f:
                    content = f.read()
                    return f'[tool.{tool_name}]' in content
            else:
                # Check INI-style files
                config = configparser.ConfigParser()
                config.read(config_path)
                return f'{tool_name}' in config or f'tool:{tool_name}' in config
        except Exception:
            return False
    
def save_config(self, output_file: str) -> None:
        """Save current configuration to file."""
        config_data = {
            'enabled_tools': self.suite_config.enabled_tools,
            'concurrent_execution': self.suite_config.concurrent_execution,
            'max_workers': self.suite_config.max_workers,
            'timeout_per_tool': self.suite_config.timeout_per_tool,
            'min_severity': self.suite_config.min_severity.value,
            'tools': {}
        }
        
        # Export tool-specific configurations
        for tool_name, tool_config in self.suite_config.tool_configs.items():
            config_data['tools'][tool_name] = {
                'executable_path': tool_config.executable_path,
                'config_file': tool_config.config_file,
                'extra_args': tool_config.extra_args,
                'enabled_rules': tool_config.enabled_rules,
                'disabled_rules': tool_config.disabled_rules,
                'severity_overrides': {
                    rule: severity.value 
                    for rule, severity in tool_config.severity_overrides.items()
                },
                'timeout': tool_config.timeout
            }
        
        output_path = Path(output_file)
        if output_path.suffix in ['.yml', '.yaml']:
            with open(output_path, 'w') as f:
                yaml.dump(config_data, f, default_flow_style=False)
        else:
            with open(output_path, 'w') as f:
                json.dump(config_data, f, indent=2)
        
        logger.info(f"Configuration saved to {output_file}")

def create_default_config() -> LinterSuiteConfig:
    """Create a default configuration for the linter suite."""
    config_manager = LinterConfigManager()
    return config_manager.suite_config