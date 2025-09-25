"""DFARS Deployment Task Builder - Builder Pattern Implementation"""

from typing import List, Optional

from dataclasses import dataclass, field
from enum import Enum

class DeploymentPhase(Enum):
    """Deployment phase stages."""
    PREPARATION = "preparation"
    FOUNDATION = "foundation"
    SECURITY_CONTROLS = "security_controls"
    MONITORING = "monitoring"
    VALIDATION = "validation"
    PRODUCTION = "production"

class DeploymentStatus(Enum):
    """Deployment status indicators."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

@dataclass
class DeploymentTask:
    """Individual deployment task."""
    task_id: str
    name: str
    description: str
    phase: DeploymentPhase
    dependencies: List[str]
    estimated_duration: int
    critical: bool
    status: DeploymentStatus
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    error_message: Optional[str] = None
    output: Optional[str] = None

class DeploymentTaskBuilder:
    """Builder for DFARS deployment tasks."""

    def __init__(self):
        self._task_id: str = ""
        self._name: str = ""
        self._description: str = ""
        self._phase: Optional[DeploymentPhase] = None
        self._dependencies: List[str] = []
        self._duration: int = 10
        self._critical: bool = False

    def with_id(self, task_id: str) -> 'DeploymentTaskBuilder':
        """Set task ID."""
        self._task_id = task_id
        return self

    def with_name(self, name: str) -> 'DeploymentTaskBuilder':
        """Set task name."""
        self._name = name
        return self

    def with_description(self, description: str) -> 'DeploymentTaskBuilder':
        """Set task description."""
        self._description = description
        return self

    def in_phase(self, phase: DeploymentPhase) -> 'DeploymentTaskBuilder':
        """Set deployment phase."""
        self._phase = phase
        return self

    def depends_on(self, *dependencies: str) -> 'DeploymentTaskBuilder':
        """Add task dependencies."""
        self._dependencies.extend(dependencies)
        return self

    def with_duration(self, minutes: int) -> 'DeploymentTaskBuilder':
        """Set estimated duration."""
        self._duration = minutes
        return self

    def as_critical(self) -> 'DeploymentTaskBuilder':
        """Mark task as critical."""
        self._critical = True
        return self

    def build(self) -> DeploymentTask:
        """Build deployment task."""
        if not self._task_id:
            raise ValueError("Task ID is required")
        if not self._name:
            raise ValueError("Task name is required")
        if not self._phase:
            raise ValueError("Deployment phase is required")

        return DeploymentTask(
            task_id=self._task_id,
            name=self._name,
            description=self._description,
            phase=self._phase,
            dependencies=self._dependencies,
            estimated_duration=self._duration,
            critical=self._critical,
            status=DeploymentStatus.PENDING
        )

def _initialize_deployment_tasks() -> List[DeploymentTask]:
    """Initialize deployment tasks using builder."""
    tasks = []

    # Preparation phase
    tasks.append(
        DeploymentTaskBuilder()
        .with_id("prep_001")
        .with_name("Environment Preparation")
        .with_description("Prepare deployment environment and validate prerequisites")
        .in_phase(DeploymentPhase.PREPARATION)
        .with_duration(10)
        .as_critical()
        .build()
    )

    tasks.append(
        DeploymentTaskBuilder()
        .with_id("prep_002")
        .with_name("System Backup")
        .with_description("Create comprehensive system backup before deployment")
        .in_phase(DeploymentPhase.PREPARATION)
        .depends_on("prep_001")
        .with_duration(20)
        .as_critical()
        .build()
    )

    tasks.append(
        DeploymentTaskBuilder()
        .with_id("prep_003")
        .with_name("Dependency Check")
        .with_description("Verify all deployment dependencies")
        .in_phase(DeploymentPhase.PREPARATION)
        .depends_on("prep_002")
        .with_duration(5)
        .build()
    )

    # Foundation phase
    tasks.append(
        DeploymentTaskBuilder()
        .with_id("found_001")
        .with_name("FIPS Crypto Module Deployment")
        .with_description("Deploy FIPS 140-2 Level 3 cryptographic module")
        .in_phase(DeploymentPhase.FOUNDATION)
        .depends_on("prep_003")
        .with_duration(15)
        .as_critical()
        .build()
    )

    return tasks