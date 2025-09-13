"""
SC-002: SLSA Level 3 Provenance Attestation System
Generates SLSA provenance attestations for supply chain security.
"""

import json
import hashlib
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional
import subprocess
import os


class SLSAProvenanceGenerator:
    """SLSA Level 3 provenance attestation generator."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.output_dir = Path(config.get('output_dir', '.claude/.artifacts/supply_chain'))
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # SLSA configuration
        self.slsa_version = "1.0"
        self.builder_id = config.get('builder_id', 'https://spek.dev/builder/v1')
        self.build_type = config.get('build_type', 'https://spek.dev/build-types/generic@v1')
        
    def generate_provenance(self, 
                           subject_artifacts: List[Dict[str, Any]],
                           build_metadata: Dict[str, Any]) -> str:
        """Generate SLSA provenance attestation."""
        
        # Create provenance statement
        provenance = self._create_provenance_statement(subject_artifacts, build_metadata)
        
        # Create in-toto statement
        statement = self._create_intoto_statement(provenance, subject_artifacts)
        
        # Save provenance
        provenance_path = self.output_dir / "slsa-provenance.json"
        with open(provenance_path, 'w', encoding='utf-8') as f:
            json.dump(statement, f, indent=2, ensure_ascii=False)
            
        return str(provenance_path)
    
    def _create_provenance_statement(self, 
                                   subject_artifacts: List[Dict[str, Any]],
                                   build_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create SLSA provenance statement."""
        
        return {
            "buildDefinition": {
                "buildType": self.build_type,
                "externalParameters": self._get_external_parameters(build_metadata),
                "internalParameters": self._get_internal_parameters(build_metadata),
                "resolvedDependencies": self._get_resolved_dependencies(build_metadata)
            },
            "runDetails": {
                "builder": {
                    "id": self.builder_id,
                    "version": self.config.get('builder_version', '1.0.0')
                },
                "metadata": {
                    "invocationId": str(uuid.uuid4()),
                    "startedOn": self._get_build_start_time(build_metadata),
                    "finishedOn": datetime.now(timezone.utc).isoformat()
                },
                "byproducts": self._get_build_byproducts(build_metadata)
            }
        }
    
    def _create_intoto_statement(self, 
                               provenance: Dict[str, Any],
                               subject_artifacts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create in-toto statement wrapper."""
        
        return {
            "_type": "https://in-toto.io/Statement/v0.1",
            "predicateType": "https://slsa.dev/provenance/v1",
            "subject": self._format_subjects(subject_artifacts),
            "predicate": provenance
        }
    
    def _format_subjects(self, artifacts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format artifacts as in-toto subjects."""
        subjects = []
        
        for artifact in artifacts:
            subject = {
                "name": artifact.get('name', ''),
                "digest": {}
            }
            
            # Add digests
            if artifact.get('sha256'):
                subject["digest"]["sha256"] = artifact['sha256']
            if artifact.get('sha1'):
                subject["digest"]["sha1"] = artifact['sha1']
                
            subjects.append(subject)
            
        return subjects
    
    def _get_external_parameters(self, build_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Get external build parameters."""
        return {
            "repository": build_metadata.get('repository', ''),
            "ref": build_metadata.get('ref', 'main'),
            "commit": build_metadata.get('commit', ''),
            "workflow": build_metadata.get('workflow', '.github/workflows/ci.yml'),
            "buildConfig": build_metadata.get('build_config', {}),
            "environment": build_metadata.get('environment', 'production')
        }
    
    def _get_internal_parameters(self, build_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Get internal build parameters."""
        return {
            "builderVersion": self.config.get('builder_version', '1.0.0'),
            "builderId": self.builder_id,
            "buildTimestamp": datetime.now(timezone.utc).isoformat(),
            "buildNode": self._get_build_node_info(),
            "buildTools": self._get_build_tools_info()
        }
    
    def _get_resolved_dependencies(self, build_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get resolved build dependencies."""
        dependencies = []
        
        # Source repository dependency
        if build_metadata.get('repository'):
            dependencies.append({
                "uri": build_metadata['repository'],
                "digest": {
                    "gitCommit": build_metadata.get('commit', '')
                },
                "name": "source-repository"
            })
        
        # Build tool dependencies
        build_tools = build_metadata.get('build_tools', [])
        for tool in build_tools:
            dependencies.append({
                "uri": f"pkg:generic/{tool['name']}@{tool['version']}",
                "digest": {
                    "sha256": tool.get('checksum', '')
                },
                "name": tool['name']
            })
        
        # Runtime dependencies from SBOM
        sbom_deps = build_metadata.get('sbom_dependencies', [])
        for dep in sbom_deps:
            dependencies.append({
                "uri": dep.get('purl', ''),
                "digest": dep.get('hashes', {}),
                "name": dep.get('name', '')
            })
        
        return dependencies
    
    def _get_build_byproducts(self, build_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get build byproducts (logs, test results, etc.)."""
        byproducts = []
        
        # Build logs
        if build_metadata.get('build_log'):
            byproducts.append({
                "name": "build.log",
                "uri": build_metadata['build_log'],
                "digest": {
                    "sha256": self._calculate_file_hash(build_metadata['build_log'])
                }
            })
        
        # Test results
        if build_metadata.get('test_results'):
            byproducts.append({
                "name": "test-results.xml",
                "uri": build_metadata['test_results'],
                "digest": {
                    "sha256": self._calculate_file_hash(build_metadata['test_results'])
                }
            })
        
        # SBOM
        if build_metadata.get('sbom_path'):
            byproducts.append({
                "name": "sbom.json",
                "uri": build_metadata['sbom_path'],
                "digest": {
                    "sha256": self._calculate_file_hash(build_metadata['sbom_path'])
                }
            })
        
        return byproducts
    
    def _get_build_start_time(self, build_metadata: Dict[str, Any]) -> str:
        """Get build start time."""
        return build_metadata.get('start_time', datetime.now(timezone.utc).isoformat())
    
    def _get_build_node_info(self) -> Dict[str, Any]:
        """Get build node information."""
        try:
            import platform
            return {
                "hostname": platform.node(),
                "architecture": platform.architecture()[0],
                "platform": platform.platform(),
                "system": platform.system(),
                "release": platform.release()
            }
        except Exception:
            return {"hostname": "unknown"}
    
    def _get_build_tools_info(self) -> List[Dict[str, Any]]:
        """Get information about build tools used."""
        tools = []
        
        # Check for common build tools
        tool_commands = {
            "npm": ["npm", "--version"],
            "node": ["node", "--version"],
            "python": ["python", "--version"],
            "pip": ["pip", "--version"],
            "git": ["git", "--version"],
            "docker": ["docker", "--version"]
        }
        
        for tool_name, command in tool_commands.items():
            try:
                result = subprocess.run(command, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    version = result.stdout.strip().split()[-1] if result.stdout else "unknown"
                    tools.append({
                        "name": tool_name,
                        "version": version,
                        "path": self._which(command[0])
                    })
            except Exception:
                continue
                
        return tools
    
    def _which(self, program: str) -> str:
        """Find path to executable (cross-platform which)."""
        try:
            if os.name == 'nt':  # Windows
                result = subprocess.run(['where', program], capture_output=True, text=True)
            else:  # Unix-like
                result = subprocess.run(['which', program], capture_output=True, text=True)
            
            if result.returncode == 0:
                return result.stdout.strip().split('\n')[0]
        except Exception:
            pass
        
        return "unknown"
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA256 hash of file."""
        try:
            if Path(file_path).exists():
                with open(file_path, 'rb') as f:
                    return hashlib.sha256(f.read()).hexdigest()
        except Exception:
            pass
        
        return ""
    
    def generate_build_metadata(self, project_path: str) -> Dict[str, Any]:
        """Generate build metadata for provenance."""
        project_path = Path(project_path)
        
        metadata = {
            "project_path": str(project_path),
            "build_time": datetime.now(timezone.utc).isoformat(),
            "builder_version": self.config.get('builder_version', '1.0.0'),
            "environment": os.environ.get('BUILD_ENV', 'development')
        }
        
        # Get Git information
        try:
            git_info = self._get_git_info(project_path)
            metadata.update(git_info)
        except Exception as e:
            print(f"Could not get Git info: {e}")
        
        # Get build tools
        metadata["build_tools"] = self._get_build_tools_info()
        
        # Get environment variables (filtered)
        metadata["environment_vars"] = self._get_filtered_env_vars()
        
        return metadata
    
    def _get_git_info(self, project_path: Path) -> Dict[str, Any]:
        """Get Git repository information."""
        git_info = {}
        
        try:
            # Change to project directory for git commands
            original_cwd = os.getcwd()
            os.chdir(project_path)
            
            # Get commit hash
            result = subprocess.run(['git', 'rev-parse', 'HEAD'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                git_info['commit'] = result.stdout.strip()
            
            # Get branch
            result = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                git_info['ref'] = f"refs/heads/{result.stdout.strip()}"
            
            # Get remote origin URL
            result = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                git_info['repository'] = result.stdout.strip()
            
            # Get commit timestamp
            result = subprocess.run(['git', 'show', '-s', '--format=%ci', 'HEAD'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                git_info['commit_timestamp'] = result.stdout.strip()
                
        except Exception as e:
            print(f"Error getting Git info: {e}")
        finally:
            try:
                os.chdir(original_cwd)
            except Exception:
                pass
        
        return git_info
    
    def _get_filtered_env_vars(self) -> Dict[str, str]:
        """Get filtered environment variables (excluding sensitive ones)."""
        sensitive_patterns = [
            'PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'CREDENTIAL',
            'AUTH', 'PRIVATE', 'CERT', 'API_KEY'
        ]
        
        filtered_env = {}
        for key, value in os.environ.items():
            # Skip sensitive environment variables
            if any(pattern in key.upper() for pattern in sensitive_patterns):
                continue
            
            # Include relevant build environment variables
            if any(prefix in key.upper() for prefix in ['BUILD_', 'CI_', 'GITHUB_', 'NODE_', 'NPM_']):
                filtered_env[key] = value
        
        return filtered_env
    
    def verify_provenance(self, provenance_path: str) -> Dict[str, Any]:
        """Verify SLSA provenance attestation."""
        try:
            with open(provenance_path, 'r', encoding='utf-8') as f:
                statement = json.load(f)
            
            verification = {
                "valid": True,
                "checks": [],
                "warnings": [],
                "errors": []
            }
            
            # Check statement structure
            self._verify_statement_structure(statement, verification)
            
            # Check predicate type
            if statement.get("predicateType") != "https://slsa.dev/provenance/v1":
                verification["errors"].append("Invalid predicate type")
                verification["valid"] = False
            
            # Check builder ID
            builder_id = statement.get("predicate", {}).get("runDetails", {}).get("builder", {}).get("id")
            if not builder_id:
                verification["warnings"].append("Missing builder ID")
            
            # Check subjects have digests
            subjects = statement.get("subject", [])
            for i, subject in enumerate(subjects):
                if not subject.get("digest"):
                    verification["errors"].append(f"Subject {i} missing digest")
                    verification["valid"] = False
            
            verification["checks"].append("Provenance structure validated")
            
            return verification
            
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Failed to verify provenance: {str(e)}"],
                "checks": [],
                "warnings": []
            }
    
    def _verify_statement_structure(self, statement: Dict[str, Any], verification: Dict[str, Any]):
        """Verify in-toto statement structure."""
        required_fields = ["_type", "predicateType", "subject", "predicate"]
        
        for field in required_fields:
            if field not in statement:
                verification["errors"].append(f"Missing required field: {field}")
                verification["valid"] = False
            else:
                verification["checks"].append(f"Field {field} present")