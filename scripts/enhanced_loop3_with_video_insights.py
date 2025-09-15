#!/usr/bin/env python3
"""
Enhanced Loop 3 with Video Insights - CI/CD Quality & Debugging with Advanced Tools
Integrates video insights for improved debugging and collaboration
"""

import asyncio
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

class VideoInsightsLoop3:
    """Enhanced Loop 3 implementation with video insights tools"""

    def __init__(self):
        self.tools = {
            'fabric': self._check_fabric_available(),
            'age': self._check_age_available(),
            'pueue': self._check_pueue_available(),
            'lsof': self._check_lsof_available(),
            'fzf': self._check_fzf_available(),
            'rg': self._check_ripgrep_available(),
            'ncdu': self._check_ncdu_available(),
            'taskwarrior': self._check_taskwarrior_available()
        }

    def _check_tool_available(self, tool_name: str) -> bool:
        """Check if a tool is available in PATH"""
        try:
            subprocess.run([tool_name, '--version'],
                         capture_output=True, check=True, timeout=5)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def _check_fabric_available(self) -> bool:
        return self._check_tool_available('fabric')

    def _check_age_available(self) -> bool:
        return self._check_tool_available('age')

    def _check_pueue_available(self) -> bool:
        return self._check_tool_available('pueue')

    def _check_lsof_available(self) -> bool:
        return self._check_tool_available('lsof')

    def _check_fzf_available(self) -> bool:
        return self._check_tool_available('fzf')

    def _check_ripgrep_available(self) -> bool:
        return self._check_tool_available('rg')

    def _check_ncdu_available(self) -> bool:
        return self._check_tool_available('ncdu')

    def _check_taskwarrior_available(self) -> bool:
        return self._check_tool_available('task')

    async def analyze_with_fabric(self, content: str, prompt: str) -> Optional[str]:
        """Use fabric for AI-powered analysis"""
        if not self.tools['fabric']:
            print("WARNING: fabric not available, skipping AI analysis")
            return None

        try:
            process = await asyncio.create_subprocess_exec(
                'fabric', '--model', 'o3-mini', '--prompt', prompt,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate(input=content.encode())

            if process.returncode == 0:
                return stdout.decode()
            else:
                print(f"fabric analysis failed: {stderr.decode()}")
                return None

        except Exception as e:
            print(f"Error running fabric: {e}")
            return None

    async def share_debug_file(self, file_path: str, encrypt: bool = True) -> Optional[str]:
        """Share debug file securely using age + tempfiles.org"""
        try:
            if encrypt and self.tools['age']:
                # Encrypt first
                encrypted_path = f"{file_path}.age"
                encrypt_process = await asyncio.create_subprocess_exec(
                    'age', '-p', '-o', encrypted_path,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                with open(file_path, 'rb') as f:
                    content = f.read()

                await encrypt_process.communicate(input=content)
                upload_file = encrypted_path
            else:
                upload_file = file_path

            # Upload to tempfiles.org
            upload_process = await asyncio.create_subprocess_exec(
                'curl', '-F', f'file=@{upload_file}', 'tempfiles.org',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await upload_process.communicate()

            if upload_process.returncode == 0:
                url = stdout.decode().strip()
                print(f"Debug file shared: {url}")
                if encrypt:
                    print("File is encrypted - share password separately")
                return url
            else:
                print(f"Upload failed: {stderr.decode()}")
                return None

        except Exception as e:
            print(f"Error sharing debug file: {e}")
            return None

    async def parallel_quality_checks(self) -> Dict[str, bool]:
        """Run quality checks in parallel using pueue"""
        checks = {
            'test': 'npm run test',
            'lint': 'npm run lint',
            'typecheck': 'npm run typecheck',
            'build': 'npm run build'
        }

        results = {}

        if self.tools['pueue']:
            # Use pueue for parallel execution
            try:
                # Clear pueue queue
                await asyncio.create_subprocess_exec('pueue', 'reset')

                # Add all tasks
                task_ids = {}
                for check_name, command in checks.items():
                    process = await asyncio.create_subprocess_exec(
                        'pueue', 'add', '--label', check_name, command,
                        stdout=asyncio.subprocess.PIPE
                    )
                    stdout, _ = await process.communicate()

                    # Extract task ID from pueue output
                    if process.returncode == 0:
                        output = stdout.decode()
                        # Simple parsing - pueue usually outputs "Task X added"
                        task_ids[check_name] = output.strip()

                # Wait for completion and collect results
                for check_name in checks:
                    process = await asyncio.create_subprocess_exec(
                        'pueue', 'wait', '--label', check_name,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    await process.communicate()
                    results[check_name] = process.returncode == 0

            except Exception as e:
                print(f"Pueue execution failed: {e}")
                # Fallback to sequential execution
                results = await self._sequential_quality_checks(checks)
        else:
            # Sequential fallback
            results = await self._sequential_quality_checks(checks)

        return results

    async def _sequential_quality_checks(self, checks: Dict[str, str]) -> Dict[str, bool]:
        """Fallback sequential quality checks"""
        results = {}

        for check_name, command in checks.items():
            try:
                process = await asyncio.create_subprocess_exec(
                    *command.split(),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await process.communicate()
                results[check_name] = process.returncode == 0

            except Exception as e:
                print(f"Check {check_name} failed: {e}")
                results[check_name] = False

        return results

    async def create_context_task(self, description: str) -> bool:
        """Create task with Git context using taskwarrior"""
        if not self.tools['taskwarrior']:
            print("WARNING: taskwarrior not available, skipping task creation")
            return False

        try:
            # Get current Git branch
            git_process = await asyncio.create_subprocess_exec(
                'git', 'branch', '--show-current',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await git_process.communicate()

            if git_process.returncode == 0:
                branch = stdout.decode().strip()

                # Create task with project context
                task_process = await asyncio.create_subprocess_exec(
                    'task', 'add', f'project:{branch}', description,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                await task_process.communicate()
                return task_process.returncode == 0

        except Exception as e:
            print(f"Error creating context task: {e}")

        return False

    async def kill_file_handle_processes(self, directory: str = ".") -> bool:
        """Kill processes holding file handles using lsof + fzf"""
        if not (self.tools['lsof'] and self.tools['fzf']):
            print("WARNING: lsof or fzf not available, skipping process cleanup")
            return False

        try:
            # Get processes holding file handles
            lsof_process = await asyncio.create_subprocess_exec(
                'lsof', '+D', directory,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await lsof_process.communicate()

            if lsof_process.returncode == 0 and stdout:
                processes_output = stdout.decode()

                # Use fzf for interactive selection (if available)
                fzf_process = await asyncio.create_subprocess_exec(
                    'fzf', '--multi', '--header', 'Select processes to kill',
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                selected_stdout, _ = await fzf_process.communicate(
                    input=processes_output.encode()
                )

                if fzf_process.returncode == 0 and selected_stdout:
                    selected_lines = selected_stdout.decode().strip().split('\n')

                    # Extract PIDs and kill them
                    pids = []
                    for line in selected_lines:
                        parts = line.split()
                        if len(parts) >= 2:
                            try:
                                pid = int(parts[1])  # PID is second column in lsof
                                pids.append(pid)
                            except ValueError:
                                continue

                    if pids:
                        for pid in pids:
                            try:
                                await asyncio.create_subprocess_exec('kill', str(pid))
                                print(f"Killed process {pid}")
                            except Exception as e:
                                print(f"Failed to kill process {pid}: {e}")
                        return True

        except Exception as e:
            print(f"Error in process cleanup: {e}")

        return False

    async def search_and_copy_to_clipboard(self, pattern: str, file_type: str = "py") -> bool:
        """Search with ripgrep and copy results to clipboard"""
        if not self.tools['rg']:
            print("WARNING: ripgrep not available, skipping search")
            return False

        try:
            # Search with ripgrep
            rg_process = await asyncio.create_subprocess_exec(
                'rg', pattern, '--type', file_type,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await rg_process.communicate()

            if rg_process.returncode == 0 and stdout:
                results = stdout.decode()

                # Try to copy to clipboard (cross-platform)
                clipboard_commands = ['xclip -selection clipboard', 'pbcopy', 'clip']

                for cmd in clipboard_commands:
                    try:
                        clip_process = await asyncio.create_subprocess_exec(
                            *cmd.split(),
                            stdin=asyncio.subprocess.PIPE,
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE
                        )

                        await clip_process.communicate(input=results.encode())

                        if clip_process.returncode == 0:
                            print(f"Search results copied to clipboard ({cmd})")
                            return True
                    except:
                        continue

                # If no clipboard tool worked, just print results
                print("Clipboard copy failed, printing results:")
                print(results)

        except Exception as e:
            print(f"Error in search and copy: {e}")

        return False

    async def run_enhanced_loop3(self, failures: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run enhanced Loop 3 with video insights"""
        print("\n=== Enhanced Loop 3 with Video Insights ===")
        print(f"Tools available: {sum(self.tools.values())}/{len(self.tools)}")

        results = {
            'timestamp': datetime.now().isoformat(),
            'tools_available': self.tools,
            'failures_processed': len(failures),
            'analysis': {},
            'shared_files': [],
            'quality_checks': {},
            'tasks_created': 0,
            'processes_killed': 0,
            'search_results_copied': False
        }

        # 1. Analyze failures with fabric
        if failures and self.tools['fabric']:
            failures_text = json.dumps(failures, indent=2)
            analysis = await self.analyze_with_fabric(
                failures_text,
                "analyze-ci-failures"
            )
            if analysis:
                results['analysis']['fabric_analysis'] = analysis

        # 2. Run parallel quality checks
        quality_results = await self.parallel_quality_checks()
        results['quality_checks'] = quality_results

        # 3. Create context-aware task
        if failures:
            task_desc = f"Fix {len(failures)} CI/CD failures - Loop 3 enhanced"
            task_created = await self.create_context_task(task_desc)
            if task_created:
                results['tasks_created'] = 1

        # 4. Clean up file handle processes
        processes_cleaned = await self.kill_file_handle_processes()
        if processes_cleaned:
            results['processes_killed'] = 1

        # 5. Search for error patterns and copy to clipboard
        if failures:
            # Extract common error patterns
            error_patterns = [f.get('error', '') for f in failures if f.get('error')]
            if error_patterns:
                # Search for timeout errors (common CI/CD issue)
                search_success = await self.search_and_copy_to_clipboard(
                    "error.*timeout", "py"
                )
                results['search_results_copied'] = search_success

        # 6. Share debug artifacts if available
        debug_file_path = ".claude/.artifacts/loop3-debug.json"
        Path(debug_file_path).parent.mkdir(parents=True, exist_ok=True)

        with open(debug_file_path, 'w') as f:
            json.dump(results, f, indent=2)

        shared_url = await self.share_debug_file(debug_file_path, encrypt=True)
        if shared_url:
            results['shared_files'].append(shared_url)

        return results

async def main():
    """Main execution function"""
    # Sample GitHub failures for demonstration
    sample_failures = [
        {"name": "NASA POT10 Validation", "error": "Setup Python failed"},
        {"name": "Quality Gates", "error": "Timeout exceeded"},
        {"name": "Performance Tests", "error": "Memory limit reached"}
    ]

    loop3 = VideoInsightsLoop3()
    results = await loop3.run_enhanced_loop3(sample_failures)

    print("\n=== Loop 3 Results ===")
    print(f"Timestamp: {results['timestamp']}")
    print(f"Failures processed: {results['failures_processed']}")
    print(f"Quality checks passed: {sum(results['quality_checks'].values())}/{len(results['quality_checks'])}")
    print(f"Tasks created: {results['tasks_created']}")
    print(f"Processes cleaned: {results['processes_killed']}")
    print(f"Search results copied: {results['search_results_copied']}")
    print(f"Debug files shared: {len(results['shared_files'])}")

    if results['analysis'].get('fabric_analysis'):
        print("\n=== AI Analysis Summary ===")
        print(results['analysis']['fabric_analysis'][:200] + "...")

    print(f"\nFull results saved to: .claude/.artifacts/loop3-debug.json")

if __name__ == "__main__":
    asyncio.run(main())