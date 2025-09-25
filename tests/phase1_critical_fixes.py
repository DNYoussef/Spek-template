#!/usr/bin/env python3
"""
Phase 1 Critical YAML Fixes
Fixes the identified YAML syntax errors in workflow files
"""

from pathlib import Path
import os

import yaml

class YAMLFixer:
    def __init__(self, base_path="."):
        self.base_path = Path(base_path)
        self.fixes_applied = []
        
    def fix_architecture_analysis(self):
        """Fix architecture-analysis.yml YAML syntax error at line 55-56"""
        file_path = self.base_path / ".github/workflows/architecture-analysis.yml"
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # The issue is likely with multiline Python code in YAML
            lines = content.split('\n')
            
            # Find the problematic section around line 55
            fixed_lines = []
            in_python_block = False
            
            for i, line in enumerate(lines):
                if 'python -c "' in line:
                    in_python_block = True
                    # Fix the Python block indentation
                    fixed_lines.append('        python -c "')
                    fixed_lines.append('import sys')
                    fixed_lines.append('sys.path.insert(0, \".\")')
                    fixed_lines.append('')
                    fixed_lines.append('try:')
                    fixed_lines.append('    from analyzer.architecture.orchestrator import AnalysisOrchestrator as ArchitectureOrchestrator')
                    fixed_lines.append('    import json')
                    # Skip original problematic lines
                    continue
                elif in_python_block and line.strip().startswith('import'):
                    continue  # Skip, already added
                elif in_python_block and line.strip() == '':
                    continue  # Skip empty lines in Python block
                elif in_python_block and 'except' in line:
                    fixed_lines.append('except Exception as e:')
                    fixed_lines.append('    print(f\"Error: {e}\")')
                    fixed_lines.append('    sys.exit(1)')
                    fixed_lines.append('"')
                    in_python_block = False
                elif not in_python_block:
                    fixed_lines.append(line)
            
            # Write fixed content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(fixed_lines))
            
            self.fixes_applied.append(f"Fixed architecture-analysis.yml Python block syntax")
            return True
            
        except Exception as e:
            print(f"Error fixing architecture-analysis.yml: {e}")
            return False
    
    def fix_working_workflows_missing_on(self):
        """Fix the 5 working workflows that are missing 'on' key"""
        working_workflows = [
            "connascence-core-analysis.yml",
            "cache-optimization.yml", 
            "performance-monitoring.yml",
            "mece-duplication-analysis.yml",
            "self-dogfooding.yml"
        ]
        
        for workflow in working_workflows:
            file_path = self.base_path / ".github/workflows" / workflow
            
            if not file_path.exists():
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check if 'on:' is missing
                if 'on:' not in content or content.find('on:') == -1:
                    lines = content.split('\n')
                    fixed_lines = []
                    
                    # Add 'on:' trigger after 'name:'
                    for line in lines:
                        fixed_lines.append(line)
                        if line.startswith('name:'):
                            fixed_lines.append('')
                            fixed_lines.append('on:')
                            fixed_lines.append('  push:')
                            fixed_lines.append('    branches: [main]')
                            fixed_lines.append('  pull_request:')
                            fixed_lines.append('    branches: [main]')
                            fixed_lines.append('  workflow_dispatch:')
                            fixed_lines.append('')
                    
                    # Write fixed content
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write('\n'.join(fixed_lines))
                    
                    self.fixes_applied.append(f"Added missing 'on:' trigger to {workflow}")
                
            except Exception as e:
                print(f"Error fixing {workflow}: {e}")
                continue
    
    def fix_yaml_syntax_errors(self):
        """Fix specific YAML syntax errors identified"""
        error_files = [
            "connascence-analysis.yml",
            "enhanced-quality-gates.yml", 
            "nasa-compliance-check.yml",
            "quality-gates.yml",
            "quality-orchestrator.yml",
            "security-pipeline.yml"
        ]
        
        for filename in error_files:
            file_path = self.base_path / ".github/workflows" / filename
            
            if not file_path.exists():
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Apply common YAML fixes
                lines = content.split('\n')
                fixed_lines = []
                
                for line in lines:
                    # Fix common YAML issues
                    if line.strip() and not line.startswith(' ') and ':' not in line and not line.startswith('#') and not line.startswith('-'):
                        # Likely a key without colon
                        line = line + ':'
                    
                    # Fix indentation issues
                    if line.strip().endswith(':') and not line.startswith(' ') and not line.startswith('name:') and not line.startswith('on:') and not line.startswith('jobs:'):
                        # Ensure proper indentation for job keys
                        if not line.startswith('  '):
                            line = '  ' + line.strip()
                    
                    fixed_lines.append(line)
                
                # Write fixed content
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(fixed_lines))
                
                # Validate the fix
                try:
                    yaml.safe_load('\n'.join(fixed_lines))
                    self.fixes_applied.append(f"Fixed YAML syntax in {filename}")
                except yaml.YAMLError:
                    print(f"Warning: {filename} still has YAML issues after attempted fix")
                
            except Exception as e:
                print(f"Error fixing {filename}: {e}")
                continue
    
    def apply_all_fixes(self):
        """Apply all critical fixes for Phase 1"""
        print("Applying Phase 1 Critical Fixes...")
        
        # Fix 1: Architecture analysis Python block
        self.fix_architecture_analysis()
        
        # Fix 2: Missing 'on:' triggers in working workflows  
        self.fix_working_workflows_missing_on()
        
        # Fix 3: General YAML syntax errors
        self.fix_yaml_syntax_errors()
        
        print(f"\nFixes Applied ({len(self.fixes_applied)}):")
        for fix in self.fixes_applied:
            print(f"  - {fix}")
        
        return len(self.fixes_applied)

if __name__ == "__main__":
    fixer = YAMLFixer()
    fixes_count = fixer.apply_all_fixes()
    
    print(f"\nPhase 1 Critical Fixes Complete: {fixes_count} fixes applied")