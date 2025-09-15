"""
DFARS CUI Protection System
Controlled Unclassified Information handling per DFARS 252.204-7012
"""

import os
import hashlib
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional

class CUICategory(Enum):
    """CUI categories per NIST SP 800-171"""
    BASIC = "CUI//BASIC"
    SPECIFIED = "CUI//SP-"
    PRIVACY = "CUI//SP-PRIV"
    PROPRIETARY = "CUI//SP-PROP"
    EXPORT_CONTROLLED = "CUI//SP-EXPT"

class CUIProtection:
    """CUI protection and handling system"""

    def __init__(self, cui_vault_dir: str = ".cui_vault"):
        self.cui_vault = Path(cui_vault_dir)
        self.cui_vault.mkdir(mode=0o700, exist_ok=True)  # Restricted permissions
        self.access_log = self.cui_vault / "access.log"

    def classify_file(self, file_path: Path, category: CUICategory,
                     rationale: str) -> Dict[str, str]:
        """Classify file as CUI with proper marking"""

        # Create CUI metadata
        metadata = {
            'file_path': str(file_path),
            'cui_category': category.value,
            'classification_date': datetime.now().isoformat(),
            'classifier': os.getenv('USER', 'system'),
            'rationale': rationale,
            'file_hash': self._calculate_file_hash(file_path),
            'access_controls': self._get_access_controls(category)
        }

        # Save CUI metadata
        metadata_file = self.cui_vault / f"{file_path.name}.cui"
        with open(metadata_file, 'w') as f:
            import json
            json.dump(metadata, f, indent=2)

        self._log_cui_access('classification', str(file_path), 'success')

        return metadata

    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash for integrity"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()

    def _get_access_controls(self, category: CUICategory) -> List[str]:
        """Get required access controls for CUI category"""
        base_controls = [
            'role_based_access',
            'encryption_at_rest',
            'audit_logging',
            'access_termination'
        ]

        if category in [CUICategory.PRIVACY, CUICategory.EXPORT_CONTROLLED]:
            base_controls.extend([
                'two_factor_authentication',
                'data_loss_prevention',
                'geographic_restrictions'
            ])

        return base_controls

    def _log_cui_access(self, action: str, resource: str, result: str):
        """Log CUI access events"""
        log_entry = f"{datetime.now().isoformat()}|{action}|{resource}|{result}\n"
        with open(self.access_log, 'a') as f:
            f.write(log_entry)

    def verify_cui_integrity(self, file_path: Path) -> bool:
        """Verify CUI file integrity"""
        metadata_file = self.cui_vault / f"{file_path.name}.cui"

        if not metadata_file.exists():
            return False

        try:
            with open(metadata_file, 'r') as f:
                import json
                metadata = json.load(f)

            stored_hash = metadata.get('file_hash')
            current_hash = self._calculate_file_hash(file_path)

            if stored_hash != current_hash:
                self._log_cui_access('integrity_violation', str(file_path), 'failure')
                return False

            self._log_cui_access('integrity_check', str(file_path), 'success')
            return True

        except Exception:
            self._log_cui_access('integrity_check', str(file_path), 'error')
            return False

# Global CUI protection system
cui_protection = CUIProtection()
