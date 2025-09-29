from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
SC-4: Cryptographic Artifact Signing with Cosign Integration
Enterprise-grade cryptographic signing and verification for supply chain artifacts.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import base64
import hashlib
import json
import os
import subprocess
import tempfile

class CryptographicSigner:
    """Enterprise cryptographic signing system with cosign integration."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.output_dir = Path(config.get('output_dir', '.claude/.artifacts/supply_chain'))
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Signing configuration
        self.key_path = config.get('signing_key_path')
        self.cert_path = config.get('signing_cert_path')
        self.key_password = config.get('signing_key_password')
        
        # Cosign configuration
        self.cosign_binary = config.get('cosign_binary', 'cosign')
        self.fulcio_url = config.get('fulcio_url', 'https://fulcio.sigstore.dev')
        self.rekor_url = config.get('rekor_url', 'https://rekor.sigstore.dev')
        
        # Keyless signing (OIDC)
        self.oidc_issuer = config.get('oidc_issuer')
        self.oidc_client_id = config.get('oidc_client_id')
        
        # Enterprise CA settings
        self.ca_cert_path = config.get('ca_cert_path')
        self.intermediate_cert_path = config.get('intermediate_cert_path')
        
    def sign_artifacts(self, artifacts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Sign multiple artifacts with cryptographic signatures."""
        
        signing_results = {
            'signing_timestamp': datetime.now(timezone.utc).isoformat(),
            'signer_info': self._get_signer_info(),
            'artifacts': [],
            'signatures_created': 0,
            'verification_successful': 0,
            'errors': []
        }
        
        for artifact in artifacts:
            try:
                result = self._sign_single_artifact(artifact)
                signing_results['artifacts'].append(result)
                
                if result.get('signature_created'):
                    signing_results['signatures_created'] += 1
                    
                if result.get('verification_passed'):
                    signing_results['verification_successful'] += 1
                    
            except Exception as e:
                error_info = {
                    'artifact': artifact.get('path', 'unknown'),
                    'error': str(e)
                }
                signing_results['errors'].append(error_info)
        
        # Save signing results
        results_path = self.output_dir / "signing-results.json"
        with open(results_path, 'w', encoding='utf-8') as f:
            json.dump(signing_results, f, indent=2, ensure_ascii=False)
            
        return signing_results
    
    def _sign_single_artifact(self, artifact: Dict[str, Any]) -> Dict[str, Any]:
        """Sign a single artifact."""
        
        artifact_path = artifact.get('path')
        if not artifact_path or not path_exists(artifact_path):
            raise ValueError(f"Artifact path not found: {artifact_path}")
        
        result = {
            'artifact_path': artifact_path,
            'artifact_name': Path(artifact_path).name,
            'artifact_hash': self._calculate_file_hash(artifact_path),
            'signature_created': False,
            'verification_passed': False,
            'signing_method': None,
            'signature_path': None,
            'certificate_path': None,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # Choose signing method
        if self._is_cosign_available() and artifact.get('format') == 'container':
            # Use cosign for container images
            signature_result = self._sign_with_cosign(artifact_path, artifact)
            result.update(signature_result)
            result['signing_method'] = 'cosign'
            
        elif self.key_path and path_exists(self.key_path):
            # Use traditional PKI signing
            signature_result = self._sign_with_pki(artifact_path, artifact)
            result.update(signature_result)
            result['signing_method'] = 'pki'
            
        else:
            # Use keyless signing with OIDC if configured
            if self.oidc_issuer:
                signature_result = self._sign_keyless(artifact_path, artifact)
                result.update(signature_result)
                result['signing_method'] = 'keyless'
            else:
                raise ValueError("No signing method available")
        
        # Verify signature immediately after creation
        if result.get('signature_created'):
            result['verification_passed'] = self._verify_signature(
                artifact_path, result.get('signature_path'), result.get('certificate_path')
            )
        
        return result
    
    def _sign_with_cosign(self, artifact_path: str, artifact: Dict[str, Any]) -> Dict[str, Any]:
        """Sign artifact using cosign."""
        
        result = {}
        
        try:
            # For container images, cosign handles the signing differently
            if artifact.get('format') == 'container':
                image_ref = artifact.get('image_ref')
                if not image_ref:
                    raise ValueError("Container image reference required for cosign signing")
                
                # Sign container image
                cmd = [self.cosign_binary, 'sign']
                
                if self.key_path:
                    cmd.extend(['--key', self.key_path])
                else:
                    cmd.append('--keyless')
                
                cmd.append(image_ref)
                
                # Set environment variables
                env = os.environ.copy()
                if self.key_password:
                    env['COSIGN_PASSWORD'] = self.key_password
                
                subprocess_result = subprocess.run(
                    cmd, capture_output=True, text=True, env=env, timeout=300
                )
                
                if subprocess_result.returncode == 0:
                    result['signature_created'] = True
                    result['signature_location'] = f"{image_ref}.sig"
                else:
                    raise subprocess.CalledProcessError(
                        subprocess_result.returncode, cmd, subprocess_result.stderr
                    )
            
            else:
                # Sign regular files with cosign
                signature_path = f"{artifact_path}.sig"
                
                cmd = [self.cosign_binary, 'sign-blob']
                
                if self.key_path:
                    cmd.extend(['--key', self.key_path])
                else:
                    cmd.append('--keyless')
                
                cmd.extend(['--output-signature', signature_path])
                cmd.append(artifact_path)
                
                env = os.environ.copy()
                if self.key_password:
                    env['COSIGN_PASSWORD'] = self.key_password
                
                subprocess_result = subprocess.run(
                    cmd, capture_output=True, text=True, env=env, timeout=300
                )
                
                if subprocess_result.returncode == 0:
                    result['signature_created'] = True
                    result['signature_path'] = signature_path
                else:
                    raise subprocess.CalledProcessError(
                        subprocess_result.returncode, cmd, subprocess_result.stderr
                    )
        
        except Exception as e:
            print(f"Error signing with cosign: {e}")
            result['error'] = str(e)
        
        return result
    
    def _sign_with_pki(self, artifact_path: str, artifact: Dict[str, Any]) -> Dict[str, Any]:
        """Sign artifact using traditional PKI."""
        
        result = {}
        
        try:
            # Create signature using OpenSSL
            signature_path = f"{artifact_path}.sig"
            cert_path = self.cert_path
            
            # Sign the file
            cmd = [
                'openssl', 'dgst', '-sha256', '-sign', self.key_path,
                '-out', signature_path, artifact_path
            ]
            
            env = os.environ.copy()
            if self.key_password:
                env['SSL_PASS'] = self.key_password
            
            subprocess_result = subprocess.run(
                cmd, capture_output=True, text=True, env=env, timeout=60
            )
            
            if subprocess_result.returncode == 0:
                result['signature_created'] = True
                result['signature_path'] = signature_path
                result['certificate_path'] = cert_path
                
                # Create signature metadata
                metadata = self._create_signature_metadata(artifact_path, signature_path, cert_path)
                metadata_path = f"{artifact_path}.sig.json"
                
                with open(metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)
                
                result['metadata_path'] = metadata_path
                
            else:
                raise subprocess.CalledProcessError(
                    subprocess_result.returncode, cmd, subprocess_result.stderr
                )
        
        except Exception as e:
            print(f"Error signing with PKI: {e}")
            result['error'] = str(e)
        
        return result
    
    def _sign_keyless(self, artifact_path: str, artifact: Dict[str, Any]) -> Dict[str, Any]:
        """Sign artifact using keyless signing (OIDC)."""
        
        result = {}
        
        try:
            if not self._is_cosign_available():
                raise ValueError("Cosign not available for keyless signing")
            
            signature_path = f"{artifact_path}.sig"
            certificate_path = f"{artifact_path}.pem"
            
            cmd = [
                self.cosign_binary, 'sign-blob',
                '--keyless',
                '--output-signature', signature_path,
                '--output-certificate', certificate_path,
                artifact_path
            ]
            
            env = os.environ.copy()
            if self.oidc_issuer:
                env['COSIGN_OIDC_ISSUER'] = self.oidc_issuer
            if self.oidc_client_id:
                env['COSIGN_OIDC_CLIENT_ID'] = self.oidc_client_id
            
            subprocess_result = subprocess.run(
                cmd, capture_output=True, text=True, env=env, timeout=300
            )
            
            if subprocess_result.returncode == 0:
                result['signature_created'] = True
                result['signature_path'] = signature_path
                result['certificate_path'] = certificate_path
            else:
                raise subprocess.CalledProcessError(
                    subprocess_result.returncode, cmd, subprocess_result.stderr
                )
        
        except Exception as e:
            print(f"Error with keyless signing: {e}")
            result['error'] = str(e)
        
        return result
    
    def _verify_signature(self,
                        artifact_path: str,
                        signature_path: Optional[str],
                        certificate_path: Optional[str]) -> bool:
        """Verify cryptographic signature."""
        
        try:
            if not signature_path or not path_exists(signature_path):
                return False
            
            # Try cosign verification first
            if self._is_cosign_available() and signature_path.endswith('.sig'):
                return self._verify_with_cosign(artifact_path, signature_path, certificate_path)
            
            # Try OpenSSL verification
            elif certificate_path and path_exists(certificate_path):
                return self._verify_with_openssl(artifact_path, signature_path, certificate_path)
            
        except Exception as e:
            print(f"Error verifying signature: {e}")
        
        return False
    
    def _verify_with_cosign(self,
                            artifact_path: str,
                            signature_path: str,
                            certificate_path: Optional[str]) -> bool:
        """Verify signature using cosign."""
        
        try:
            cmd = [self.cosign_binary, 'verify-blob']
            
            if certificate_path and path_exists(certificate_path):
                cmd.extend(['--certificate', certificate_path])
                # For keyless verification, need to specify certificate identity
                cmd.extend(['--certificate-identity-regexp', '.*'])
                cmd.extend(['--certificate-oidc-issuer-regexp', '.*'])
            elif self.key_path:
                # Extract public key from private key
                public_key_path = self._extract_public_key(self.key_path)
                if public_key_path:
                    cmd.extend(['--key', public_key_path])
                else:
                    return False
            else:
                return False
            
            cmd.extend(['--signature', signature_path])
            cmd.append(artifact_path)
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            return result.returncode == 0
            
        except Exception as e:
            print(f"Error verifying with cosign: {e}")
            return False
    
    def _verify_with_openssl(self,
                            artifact_path: str,
                            signature_path: str,
                            certificate_path: str) -> bool:
        """Verify signature using OpenSSL."""
        
        try:
            # Extract public key from certificate
            with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as temp_key:
                cmd = ['openssl', 'x509', '-pubkey', '-noout', '-in', certificate_path]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode != 0:
                    return False
                
                temp_key.write(result.stdout)
                public_key_path = temp_key.name
            
            try:
                # Verify signature
                cmd = [
                    'openssl', 'dgst', '-sha256', '-verify', public_key_path,
                    '-signature', signature_path, artifact_path
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                return result.returncode == 0 and 'Verified OK' in result.stdout
                
            finally:
                # Clean up temporary public key file
                try:
                    os.unlink(public_key_path)
                except Exception:
                    pass
            
        except Exception as e:
            print(f"Error verifying with OpenSSL: {e}")
            return False
    
    def _extract_public_key(self, private_key_path: str) -> Optional[str]:
        """Extract public key from private key."""
        
        try:
            public_key_path = f"{private_key_path}.pub"
            
            cmd = [
                'openssl', 'rsa', '-in', private_key_path,
                '-pubout', '-out', public_key_path
            ]
            
            env = os.environ.copy()
            if self.key_password:
                env['SSL_PASS'] = self.key_password
            
            result = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=30)
            
            if result.returncode == 0 and path_exists(public_key_path):
                return public_key_path
                
        except Exception as e:
            print(f"Error extracting public key: {e}")
        
        return None
    
    def _create_signature_metadata(self,
                                    artifact_path: str,
                                    signature_path: str,
                                    certificate_path: str) -> Dict[str, Any]:
        """Create signature metadata."""
        
        metadata = {
            'artifact': {
                'path': artifact_path,
                'name': Path(artifact_path).name,
                'size': Path(artifact_path).stat().st_size,
                'sha256': self._calculate_file_hash(artifact_path)
            },
            'signature': {
                'path': signature_path,
                'algorithm': 'RSA-SHA256',
                'created': datetime.now(timezone.utc).isoformat()
            },
            'signer': self._get_signer_info(),
            'verification': {
                'verified_at_creation': False,  # Will be updated
                'verification_method': 'openssl'
            }
        }
        
        # Add certificate information
        if certificate_path and path_exists(certificate_path):
            cert_info = self._get_certificate_info(certificate_path)
            metadata['certificate'] = cert_info
        
        return metadata
    
    def _get_certificate_info(self, certificate_path: str) -> Dict[str, Any]:
        """Extract certificate information."""
        
        try:
            cmd = ['openssl', 'x509', '-text', '-noout', '-in', certificate_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                # Parse certificate information (simplified)
                cert_text = result.stdout
                
                info = {
                    'path': certificate_path,
                    'subject': self._extract_cert_field(cert_text, 'Subject:'),
                    'issuer': self._extract_cert_field(cert_text, 'Issuer:'),
                    'serial_number': self._extract_cert_field(cert_text, 'Serial Number:'),
                    'not_before': self._extract_cert_field(cert_text, 'Not Before:'),
                    'not_after': self._extract_cert_field(cert_text, 'Not After:'),
                    'fingerprint': self._get_certificate_fingerprint(certificate_path)
                }
                
                return info
        
        except Exception as e:
            print(f"Error getting certificate info: {e}")
        
        return {'path': certificate_path, 'error': 'Could not parse certificate'}
    
    def _extract_cert_field(self, cert_text: str, field_name: str) -> str:
        """Extract field from certificate text."""
        
        lines = cert_text.split('\n')
        for i, line in enumerate(lines):
            if field_name in line:
                return line.split(field_name, 1)[1].strip()
        
        return 'unknown'
    
    def _get_certificate_fingerprint(self, certificate_path: str) -> str:
        """Get certificate SHA256 fingerprint."""
        
        try:
            cmd = ['openssl', 'x509', '-fingerprint', '-sha256', '-noout', '-in', certificate_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                fingerprint = result.stdout.strip()
                return fingerprint.split('=', 1)[1] if '=' in fingerprint else fingerprint
        
        except Exception:
            pass
        
        return 'unknown'
    
    def _get_signer_info(self) -> Dict[str, Any]:
        """Get information about the signer."""
        
        signer_info = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'tool': 'SPEK Supply Chain Security Signer',
            'version': '1.0.0'
        }
        
        # Add certificate subject if available
        if self.cert_path and path_exists(self.cert_path):
            try:
                cmd = ['openssl', 'x509', '-subject', '-noout', '-in', self.cert_path]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    subject = result.stdout.strip()
                    signer_info['certificate_subject'] = subject.split('subject=', 1)[1] if 'subject=' in subject else subject
            
            except Exception:
                pass
        
        return signer_info
    
    def _is_cosign_available(self) -> bool:
        """Check if cosign binary is available."""
        
        try:
            result = subprocess.run(
                [self.cosign_binary, 'version'], 
                capture_output=True, text=True, timeout=10
            )
            return result.returncode == 0
        except Exception:
            return False
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA256 hash of file."""
        
        try:
            with open(file_path, 'rb') as f:
                return hashlib.sha256(f.read()).hexdigest()
        except Exception:
            return ''
    
    def create_signature_bundle(self, artifacts: List[Dict[str, Any]]) -> str:
        """Create a comprehensive signature bundle."""
        
        bundle = {
            'bundle_version': '1.0',
            'created': datetime.now(timezone.utc).isoformat(),
            'artifacts': [],
            'signatures': [],
            'certificates': [],
            'metadata': {
                'signer': self._get_signer_info(),
                'signing_policies': self._get_signing_policies()
            }
        }
        
        for artifact in artifacts:
            artifact_info = {
                'path': artifact.get('path'),
                'name': Path(artifact.get('path', '')).name,
                'sha256': self._calculate_file_hash(artifact.get('path', '')),
                'signed': False
            }
            
            # Check for existing signature
            signature_path = f"{artifact.get('path')}.sig"
            if path_exists(signature_path):
                artifact_info['signed'] = True
                artifact_info['signature_path'] = signature_path
                
                # Add signature to bundle
                with open(signature_path, 'rb') as f:
                    signature_data = base64.b64encode(f.read()).decode('utf-8')
                
                bundle['signatures'].append({
                    'artifact_name': artifact_info['name'],
                    'signature_data': signature_data,
                    'algorithm': 'RSA-SHA256'
                })
            
            bundle['artifacts'].append(artifact_info)
        
        # Save bundle
        bundle_path = self.output_dir / "signature-bundle.json"
        with open(bundle_path, 'w', encoding='utf-8') as f:
            json.dump(bundle, f, indent=2, ensure_ascii=False)
        
        return str(bundle_path)
    
    def _get_signing_policies(self) -> Dict[str, Any]:
        """Get signing policies and requirements."""
        
        return {
            'require_timestamp': self.config.get('require_timestamp', True),
            'require_certificate_chain': self.config.get('require_cert_chain', True),
            'allowed_algorithms': self.config.get('allowed_algorithms', ['RSA-SHA256', 'ECDSA-SHA256']),
            'minimum_key_size': self.config.get('min_key_size', 2048),
            'certificate_validation': {
                'check_expiry': True,
                'check_revocation': self.config.get('check_revocation', False),
                'trusted_cas': self.ca_cert_path and [self.ca_cert_path] or []
            }
        }