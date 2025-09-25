"""
Version Log System - Portable version tracking for agent operations
Provides comprehensive audit trails and version management
"""

from .ContentHasher import ContentHasher
from .FooterRenderer import FooterRenderer
from .SemverManager import SemverManager, ChangeType
from .VersionLogManager import VersionLogManager

__version__ = '1.0.0'
__all__ = [
    'VersionLogManager',
    'ContentHasher',
    'SemverManager',
    'ChangeType',
    'FooterRenderer'
]