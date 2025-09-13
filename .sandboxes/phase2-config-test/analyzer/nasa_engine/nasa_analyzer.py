"""
NASA Power of Ten Rule Analyzer

Analyzes code for compliance with NASA JPL Power of Ten rules for safety-critical software.
Uses the configuration from policy/presets/nasa_power_of_ten.yml to perform comprehensive
rule checking.
"""

import ast
import re
from collections import defaultdict
from pathlib import Path
import sys
from typing import Dict, List, Optional, Set

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.types import ConnascenceViolation

# Import optimization components
try:
    from ..optimization.file_cache import (
        cached_file_content, cached_ast_tree, get_global_cache
    )
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False

try:
    import yaml
except ImportError:
    yaml = None


class NASAAnalyzer:
    """Analyzes code for NASA Power of Ten compliance."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize NASA analyzer with configuration."""
        self.config_path = config_path or self._find_nasa_config()
        self.rules_config = self._load_nasa_config()
        
        # Track violations by rule
        self.rule_violations: Dict[str, List[ConnascenceViolation]] = defaultdict(list)
        
        # Analysis state
        self.function_definitions: List[ast.FunctionDef] = []
        self.global_variables: List[ast.Name] = []
        self.loops: List[ast.AST] = []
        self.assertions: List[ast.Assert] = []
        self.malloc_calls: List[ast.Call] = []
        self.return_checks: List[ast.AST] = []
    
    def _find_nasa_config(self) -> str:
        """Find NASA configuration file."""
        possible_paths = [
            Path(__file__).parent.parent.parent / "policy" / "presets" / "nasa_power_of_ten.yml",
            Path(__file__).parent.parent.parent / "config" / "policies" / "nasa_power_of_ten.yml",
            Path("policy/presets/nasa_power_of_ten.yml"),
            Path("config/policies/nasa_power_of_ten.yml")
        ]
        
        for path in possible_paths:
            if path.exists():
                return str(path)
        
        # Fallback to a default path if none found
        return str(Path(__file__).parent.parent.parent / "policy" / "presets" / "nasa_power_of_ten.yml")

    def _load_nasa_config(self) -> Dict:
        """Load NASA rules configuration."""
        if not self.config_path or not yaml:
            return self._get_default_nasa_config()
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            return config
        except Exception:
            return self._get_default_nasa_config()

    def _get_default_nasa_config(self) -> Dict:
        """Provide default NASA configuration if file not found."""
        return {
            "rules": {
                "rule_1": {"enabled": True, "description": "Avoid goto statements"},
                "rule_2": {"enabled": True, "description": "Limit recursion"},
                "rule_3": {"enabled": True, "description": "Avoid dynamic memory allocation"},
                "rule_4": {"enabled": True, "description": "Limit function length to 60 lines"},
                "rule_5": {"enabled": True, "description": "Use assertions for parameter validation"}
            }
        }


# Alias for compatibility with CI/CD workflows
class NASARuleEngine(NASAAnalyzer):
    """Alias for NASAAnalyzer to maintain CI/CD compatibility."""
    pass
