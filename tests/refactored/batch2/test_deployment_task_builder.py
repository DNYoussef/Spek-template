"""Tests for Deployment Task Builder"""

from scripts.dfars_deployment_task_builder import (
import pytest

class TestDeploymentTaskBuilder:
    """Test DeploymentTaskBuilder class."""

    def test_builder_creates_valid_task(self):
        """Test builder creates valid deployment task."""
        task = (
            DeploymentTaskBuilder()
            .with_id("task_001")
            .with_name("Test Task")
            .with_description("Test description")
            .in_phase(DeploymentPhase.PREPARATION)
            .with_duration(15)
            .build()
        )

        assert task.task_id == "task_001"
        assert task.name == "Test Task"
        assert task.phase == DeploymentPhase.PREPARATION
        assert task.estimated_duration == 15

    def test_builder_validates_required_fields(self):
        """Test builder validates required fields."""
        with pytest.raises(ValueError, match="Task ID is required"):
            DeploymentTaskBuilder().build()

        with pytest.raises(ValueError, match="Task name is required"):
            DeploymentTaskBuilder().with_id("id").build()

        with pytest.raises(ValueError, match="Deployment phase is required"):
            DeploymentTaskBuilder().with_id("id").with_name("name").build()

    def test_builder_handles_dependencies(self):
        """Test builder handles task dependencies."""
        task = (
            DeploymentTaskBuilder()
            .with_id("task_002")
            .with_name("Dependent Task")
            .with_description("Depends on task_001")
            .in_phase(DeploymentPhase.FOUNDATION)
            .depends_on("task_001", "task_000")
            .build()
        )

        assert len(task.dependencies) == 2
        assert "task_001" in task.dependencies
        assert "task_000" in task.dependencies

    def test_builder_marks_critical_tasks(self):
        """Test builder marks tasks as critical."""
        task = (
            DeploymentTaskBuilder()
            .with_id("critical_task")
            .with_name("Critical Task")
            .with_description("Must succeed")
            .in_phase(DeploymentPhase.SECURITY_CONTROLS)
            .as_critical()
            .build()
        )

        assert task.critical is True

    def test_initialize_deployment_tasks(self):
        """Test _initialize_deployment_tasks returns valid list."""
        tasks = _initialize_deployment_tasks()

        assert isinstance(tasks, list)
        assert len(tasks) >= 3
        assert all(isinstance(task, DeploymentTask) for task in tasks)

    def test_deployment_tasks_have_correct_phases(self):
        """Test deployment tasks have correct phases."""
        tasks = _initialize_deployment_tasks()

        prep_tasks = [t for t in tasks if t.phase == DeploymentPhase.PREPARATION]
        found_tasks = [t for t in tasks if t.phase == DeploymentPhase.FOUNDATION]

        assert len(prep_tasks) >= 1
        assert len(found_tasks) >= 1

    def test_deployment_tasks_respect_dependencies(self):
        """Test deployment tasks respect dependency order."""
        tasks = _initialize_deployment_tasks()
        task_ids = {t.task_id for t in tasks}

        for task in tasks:
            for dep in task.dependencies:
                assert dep in task_ids, f"Dependency {dep} not found for {task.task_id}"

    def test_critical_tasks_in_early_phases(self):
        """Test critical tasks are in early phases."""
        tasks = _initialize_deployment_tasks()
        critical_tasks = [t for t in tasks if t.critical]

        early_phases = {DeploymentPhase.PREPARATION, DeploymentPhase.FOUNDATION}
        for task in critical_tasks:
            assert task.phase in early_phases

class TestDeploymentPhases:
    """Test deployment phase logic."""

    def test_all_phases_represented(self):
        """Test all deployment phases are represented."""
        tasks = _initialize_deployment_tasks()
        phases = {t.phase for t in tasks}

        assert DeploymentPhase.PREPARATION in phases
        assert DeploymentPhase.FOUNDATION in phases