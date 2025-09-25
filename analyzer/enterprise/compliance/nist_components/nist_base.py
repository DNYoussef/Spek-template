"""NIST SSDF Base Framework - Core interfaces and base classes"""
from abc import ABC, abstractmethod

class NISTFrameworkBase(ABC):
    """Base class for NIST SSDF compliance framework"""

    @abstractmethod
    def validate_compliance(self, target):
        pass

    @abstractmethod
    def generate_report(self):
        pass

class NISTControlBase(ABC):
    """Base class for individual NIST controls"""

    @abstractmethod
    def assess_control(self, evidence):
        pass
