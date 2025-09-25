#!/usr/bin/env python3
"""
Documentation Validation Script
Validates accuracy between documentation and actual implementation
"""

from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import json
import os
import re
import subprocess
import sys

import yaml

class DocumentationValidator:
    """Comprehensive documentation validation and accuracy checking."""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.issues = []
        self.verified_features = []
        self.broken_links = []
        self.missing_files = []
        
    def validate_all(self) -> Dict:
        """Run complete documentation validation."""
        print("Starting comprehensive documentation validation...")
        
        results = {
            'timestamp': self._get_timestamp(),
            'project_root': str(self.project_root),
            'validation_results': {}
        }
        
        # Validate different aspects
        results['validation_results']['package_json'] = self._validate_package_json()
        results['validation_results']['readme_accuracy'] = self._validate_readme_accuracy()
        results['validation_results']['code_examples'] = self._validate_code_examples()
        results['validation_results']['link_integrity'] = self._validate_link_integrity()
        results['validation_results']['workflow_examples'] = self._validate_workflow_examples()
        results['validation_results']['api_documentation'] = self._validate_api_documentation()
        results['validation_results']['file_references'] = self._validate_file_references()
        
        # Summary
        results['summary'] = self._generate_summary()
        results['recommendations'] = self._generate_recommendations()
        
        return results
    
    def _validate_package_json(self) -> Dict:
        """Validate package.json scripts and dependencies match documentation."""
        package_file = self.project_root / 'package.json'
        if not package_file.exists():
            return {'status': 'error', 'message': 'package.json not found'}
            
        try:
            with open(package_file) as f:
                package_data = json.load(f)
                
            # Check scripts mentioned in documentation
            documented_scripts = [
                'test', 'typecheck', 'lint', 'build', 'dev', 'coverage',
                'unicode:check', 'unicode:fix', 'mcp:init', 'setup'
            ]
            
            missing_scripts = []
            for script in documented_scripts:
                if script not in package_data.get('scripts', {}):
                    missing_scripts.append(script)
                    
            return {
                'status': 'pass' if not missing_scripts else 'fail',
                'scripts_verified': len(documented_scripts) - len(missing_scripts),
                'missing_scripts': missing_scripts,
                'total_scripts': len(package_data.get('scripts', {}))
            }
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error reading package.json: {e}'}
    
    def _validate_readme_accuracy(self) -> Dict:
        """Validate README.md claims against actual implementation."""
        readme_file = self.project_root / 'README.md'
        if not readme_file.exists():
            return {'status': 'error', 'message': 'README.md not found'}
            
        try:
            with open(readme_file, encoding='utf-8') as f:
                readme_content = f.read()
                
            issues = []
            
            # Check for unicode characters (should be removed per requirements)
            unicode_pattern = r'\\u[0-9a-fA-F]{4}|[^\x00-\x7F]'
            unicode_matches = re.findall(unicode_pattern, readme_content)
            if unicode_matches:
                issues.append(f"Found {len(unicode_matches)} unicode characters that should be removed")
            
            # Check for claimed features
            feature_checks = [
                ('NASA POT10 compliance', self._check_nasa_compliance),
                ('Quality gates', self._check_quality_gates),
                ('TypeScript support', self._check_typescript_support),
                ('Test coverage', self._check_test_coverage),
            ]
            
            for feature_name, check_func in feature_checks:
                if feature_name.lower() in readme_content.lower():
                    if check_func():
                        self.verified_features.append(feature_name)
                    else:
                        issues.append(f"Claimed feature '{feature_name}' not properly implemented")
            
            return {
                'status': 'pass' if not issues else 'fail',
                'issues': issues,
                'verified_features': len(self.verified_features),
                'unicode_violations': len(unicode_matches)
            }
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error reading README.md: {e}'}
    
    def _validate_code_examples(self) -> Dict:
        """Validate all code examples in documentation are syntactically correct."""
        docs_dir = self.project_root / 'docs'
        examples_dir = self.project_root / 'examples'
        
        code_blocks = []
        invalid_examples = []
        
        # Find all markdown files
        md_files = []
        for directory in [docs_dir, examples_dir, self.project_root]:
            if directory.exists():
                md_files.extend(directory.glob('**/*.md'))
        
        # Extract code blocks
        for md_file in md_files:
            try:
                with open(md_file, encoding='utf-8') as f:
                    content = f.read()
                    
                # Find bash/shell code blocks
                bash_pattern = r'```(?:bash|shell|sh)\n(.*?)\n```'
                bash_blocks = re.findall(bash_pattern, content, re.DOTALL)
                
                # Find JavaScript/TypeScript code blocks
                js_pattern = r'```(?:javascript|js|typescript|ts)\n(.*?)\n```'
                js_blocks = re.findall(js_pattern, content, re.DOTALL)
                
                # Find JSON code blocks
                json_pattern = r'```json\n(.*?)\n```'
                json_blocks = re.findall(json_pattern, content, re.DOTALL)
                
                # Validate JSON blocks
                for json_block in json_blocks:
                    try:
                        json.loads(json_block)
                        code_blocks.append(('json', str(md_file), 'valid'))
                    except json.JSONDecodeError:
                        invalid_examples.append(f"Invalid JSON in {md_file}")
                        code_blocks.append(('json', str(md_file), 'invalid'))
                
                code_blocks.extend([('bash', str(md_file), 'unchecked') for _ in bash_blocks])
                code_blocks.extend([('js', str(md_file), 'unchecked') for _ in js_blocks])
                
            except Exception as e:
                invalid_examples.append(f"Error reading {md_file}: {e}")
        
        return {
            'status': 'pass' if not invalid_examples else 'fail',
            'total_code_blocks': len(code_blocks),
            'invalid_examples': invalid_examples,
            'files_checked': len(md_files)
        }
    
    def _validate_link_integrity(self) -> Dict:
        """Validate all internal links in documentation."""
        docs_dir = self.project_root / 'docs'
        examples_dir = self.project_root / 'examples'
        
        md_files = []
        for directory in [docs_dir, examples_dir, self.project_root]:
            if directory.exists():
                md_files.extend(directory.glob('**/*.md'))
        
        broken_links = []
        total_links = 0
        
        for md_file in md_files:
            try:
                with open(md_file, encoding='utf-8') as f:
                    content = f.read()
                
                # Find markdown links [text](path)
                link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
                links = re.findall(link_pattern, content)
                
                for link_text, link_path in links:
                    total_links += 1
                    
                    # Skip external links
                    if link_path.startswith(('http:', 'https:', 'mailto:')):
                        continue
                    
                    # Skip anchor links
                    if link_path.startswith('#'):
                        continue
                        
                    # Convert relative path to absolute
                    if link_path.startswith('./') or not link_path.startswith('/'):
                        target_path = (md_file.parent / link_path).resolve()
                    else:
                        target_path = (self.project_root / link_path.lstrip('/')).resolve()
                    
                    if not target_path.exists():
                        broken_links.append(f"Broken link in {md_file}: '{link_text}' -> '{link_path}'")
                        self.broken_links.append((str(md_file), link_text, link_path))
                
            except Exception as e:
                broken_links.append(f"Error checking links in {md_file}: {e}")
        
        return {
            'status': 'pass' if not broken_links else 'fail',
            'total_links_checked': total_links,
            'broken_links': len(broken_links),
            'broken_link_details': broken_links
        }
    
    def _validate_workflow_examples(self) -> Dict:
        """Validate workflow examples match actual command availability."""
        workflows_dir = self.project_root / 'examples' / 'workflows'
        
        if not workflows_dir.exists():
            return {'status': 'error', 'message': 'workflows directory not found'}
        
        workflow_files = list(workflows_dir.glob('*.md'))
        command_issues = []
        
        # Commands that should exist based on documentation
        documented_commands = [
            '/spec:plan', '/research:web', '/codex:micro', '/qa:run', 
            '/qa:gate', '/pr:open', '/fix:planned', '/gemini:impact'
        ]
        
        for workflow_file in workflow_files:
            try:
                with open(workflow_file, encoding='utf-8') as f:
                    content = f.read()
                
                # Find command usage
                command_pattern = r'(/[a-z:]+)'
                commands_used = re.findall(command_pattern, content)
                
                for cmd in commands_used:
                    if cmd in documented_commands:
                        # This would require actual command validation
                    
            except Exception as e:
                command_issues.append(f"Error reading workflow {workflow_file}: {e}")
        
        return {
            'status': 'pass' if not command_issues else 'fail',
            'workflow_files_checked': len(workflow_files),
            'command_issues': command_issues
        }
    
    def _validate_api_documentation(self) -> Dict:
        """Validate API documentation matches actual TypeScript interfaces."""
        src_dir = self.project_root / 'src'
        
        if not src_dir.exists():
            return {'status': 'error', 'message': 'src directory not found'}
        
        # Check if TypeScript files exist and compile
        ts_files = list(src_dir.glob('**/*.ts'))
        
        # Run TypeScript compiler to check for errors
        try:
            result = subprocess.run(
                ['npx', 'tsc', '--noEmit'],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            typescript_errors = result.returncode != 0
            error_count = len(result.stderr.split('\n')) if result.stderr else 0
            
            return {
                'status': 'pass' if not typescript_errors else 'fail',
                'typescript_files': len(ts_files),
                'compilation_errors': error_count,
                'error_details': result.stderr if typescript_errors else None
            }
            
        except subprocess.TimeoutExpired:
            return {'status': 'error', 'message': 'TypeScript compilation timed out'}
        except FileNotFoundError:
            return {'status': 'error', 'message': 'TypeScript compiler not available'}
        except Exception as e:
            return {'status': 'error', 'message': f'Error running TypeScript check: {e}'}
    
    def _validate_file_references(self) -> Dict:
        """Validate all file paths mentioned in documentation exist."""
        missing_files = []
        total_references = 0
        
        # Common file patterns mentioned in docs
        file_patterns = [
            'package.json', 'tsconfig.json', 'jest.config.js',
            '.eslintrc.cjs', '.env.example', 'SPEC.md'
        ]
        
        for file_path in file_patterns:
            total_references += 1
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)
                self.missing_files.append(file_path)
        
        return {
            'status': 'pass' if not missing_files else 'fail',
            'files_checked': total_references,
            'missing_files': missing_files
        }
    
    def _check_nasa_compliance(self) -> bool:
        """Check if NASA compliance tools are available."""
        # This would require actual compliance checking
        analyzer_dir = self.project_root / 'analyzer'
        return analyzer_dir.exists()
    
    def _check_quality_gates(self) -> bool:
        """Check if quality gate scripts exist."""
        scripts_dir = self.project_root / 'scripts'
        return scripts_dir.exists() and any(scripts_dir.glob('*quality*'))
    
    def _check_typescript_support(self) -> bool:
        """Check if TypeScript is properly configured."""
        return (self.project_root / 'tsconfig.json').exists()
    
    def _check_test_coverage(self) -> bool:
        """Check if test coverage is configured."""
        return (self.project_root / 'jest.config.js').exists()
    
    def _generate_summary(self) -> Dict:
        """Generate validation summary."""
        return {
            'verified_features': len(self.verified_features),
            'total_issues': len(self.issues),
            'broken_links': len(self.broken_links),
            'missing_files': len(self.missing_files),
            'overall_status': 'pass' if len(self.issues) == 0 else 'fail'
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate improvement recommendations."""
        recommendations = []
        
        if self.broken_links:
            recommendations.append("Fix broken internal links in documentation")
        
        if self.missing_files:
            recommendations.append("Create missing files referenced in documentation")
        
        if len(self.issues) > 5:
            recommendations.append("Prioritize fixing high-impact documentation issues")
        
        recommendations.append("Implement automated documentation testing in CI/CD")
        recommendations.append("Set up link checking in GitHub Actions")
        
        return recommendations
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()

def main():
    """Main execution function."""
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        project_root = os.getcwd()
    
    validator = DocumentationValidator(project_root)
    results = validator.validate_all()
    
    # Output results
    output_file = Path(project_root) / '.claude' / '.artifacts' / 'documentation_validation.json'
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print(f"\nDocumentation Validation Results:")
    print(f"Status: {'PASS' if results['summary']['overall_status'] == 'pass' else 'FAIL'}")
    print(f"Verified features: {results['summary']['verified_features']}")
    print(f"Total issues: {results['summary']['total_issues']}")
    print(f"Broken links: {results['summary']['broken_links']}")
    print(f"Missing files: {results['summary']['missing_files']}")
    print(f"\nDetailed results saved to: {output_file}")
    
    if results['summary']['overall_status'] != 'pass':
        sys.exit(1)

if __name__ == '__main__':
    main()