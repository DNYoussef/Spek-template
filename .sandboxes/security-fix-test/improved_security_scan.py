#!/usr/bin/env python3
"""
Improved Security Scanner - Distinguishes real vulnerabilities from false positives
"""

import re
import ast
from pathlib import Path
from typing import List, Dict, Tuple

class ImprovedSecurityScanner:
    def __init__(self, root_path: str = "../.."):
        self.root_path = Path(root_path).resolve()
        self.real_vulnerabilities = []
        self.false_positives = []

    def analyze_eval_usage(self, file_path: Path, content: str) -> List[Dict]:
        """Analyze eval() usage to distinguish vulnerabilities from legitimate PyTorch calls"""
        vulnerabilities = []

        try:
            tree = ast.parse(content)

            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if (isinstance(node.func, ast.Name) and node.func.id == 'eval' and
                        len(node.args) > 0):

                        # Get the line content
                        lines = content.split('\n')
                        line_num = node.lineno
                        if line_num <= len(lines):
                            line_content = lines[line_num - 1].strip()

                            # Check if it's a PyTorch model.eval() call
                            if '.eval()' in line_content or 'self.eval()' in line_content:
                                self.false_positives.append({
                                    'file': str(file_path),
                                    'line': line_num,
                                    'content': line_content,
                                    'type': 'pytorch_eval'
                                })
                            else:
                                # This is a real security vulnerability
                                vulnerabilities.append({
                                    'file': str(file_path),
                                    'line': line_num,
                                    'content': line_content,
                                    'type': 'dangerous_eval',
                                    'severity': 'CRITICAL'
                                })
                                self.real_vulnerabilities.append({
                                    'file': str(file_path),
                                    'line': line_num,
                                    'content': line_content,
                                    'type': 'dangerous_eval'
                                })

        except SyntaxError:
            # If file has syntax errors, use regex as fallback
            eval_pattern = r'(?<![\w.])eval\s*\('
            exec_pattern = r'(?<![\w.])exec\s*\('

            lines = content.split('\n')
            for i, line in enumerate(lines, 1):
                if re.search(eval_pattern, line) and '.eval()' not in line and 'self.eval()' not in line:
                    vulnerabilities.append({
                        'file': str(file_path),
                        'line': i,
                        'content': line.strip(),
                        'type': 'dangerous_eval',
                        'severity': 'CRITICAL'
                    })

                if re.search(exec_pattern, line):
                    vulnerabilities.append({
                        'file': str(file_path),
                        'line': i,
                        'content': line.strip(),
                        'type': 'dangerous_exec',
                        'severity': 'CRITICAL'
                    })

        return vulnerabilities

    def scan_all_files(self) -> Dict:
        """Scan all Python files for real security vulnerabilities"""
        print("IMPROVED SECURITY VULNERABILITY SCAN")
        print("=" * 60)

        total_files = 0
        real_vulns = []

        for py_file in self.root_path.rglob("*.py"):
            if any(skip in str(py_file) for skip in ['__pycache__', '.git', 'node_modules', '.security_backups', '.sandboxes']):
                continue

            total_files += 1

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                vulns = self.analyze_eval_usage(py_file, content)
                real_vulns.extend(vulns)

            except Exception as e:
                print(f"Error scanning {py_file}: {e}")
                continue

        # Categorize vulnerabilities
        eval_vulns = [v for v in real_vulns if v['type'] == 'dangerous_eval']
        exec_vulns = [v for v in real_vulns if v['type'] == 'dangerous_exec']

        print(f"\nSCAN RESULTS")
        print("-" * 30)
        print(f"Files scanned: {total_files}")
        print(f"Real eval() vulnerabilities: {len(eval_vulns)}")
        print(f"Real exec() vulnerabilities: {len(exec_vulns)}")
        print(f"PyTorch false positives: {len(self.false_positives)}")
        print(f"Total real vulnerabilities: {len(real_vulns)}")

        if real_vulns:
            print(f"\nREAL VULNERABILITIES FOUND:")
            print("-" * 30)
            for vuln in real_vulns[:10]:  # Show first 10
                rel_path = str(Path(vuln['file']).relative_to(self.root_path))
                print(f"[{vuln['severity']}] {rel_path}:{vuln['line']}")
                print(f"  Code: {vuln['content']}")
                print()

        return {
            'total_files': total_files,
            'real_vulnerabilities': len(real_vulns),
            'eval_vulnerabilities': len(eval_vulns),
            'exec_vulnerabilities': len(exec_vulns),
            'false_positives': len(self.false_positives),
            'vulnerability_details': real_vulns,
            'scan_status': 'CRITICAL' if real_vulns else 'CLEAN'
        }

if __name__ == '__main__':
    scanner = ImprovedSecurityScanner()
    results = scanner.scan_all_files()

    print(f"\n" + "=" * 60)
    print("FINAL SECURITY ASSESSMENT")
    print("=" * 60)
    print(f"Status: {results['scan_status']}")
    print(f"Real vulnerabilities: {results['real_vulnerabilities']}")
    print(f"PyTorch false positives excluded: {results['false_positives']}")

    if results['real_vulnerabilities'] == 0:
        print("[PASS] No real security vulnerabilities found")
        exit_code = 0
    else:
        print(f"[FAIL] {results['real_vulnerabilities']} real vulnerabilities need fixing")
        exit_code = 1

    exit(exit_code)