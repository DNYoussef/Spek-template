"""
ResponseCoordinator - Extracted from EnhancedIncidentResponseSystem
Orchestrates incident response actions and escalation
Part of god object decomposition (Day 3-5)
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
import json
import logging

from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)

class ResponseAction(Enum):
    """Types of response actions."""
    ISOLATE = "isolate"
    BLOCK_IP = "block_ip"
    DISABLE_USER = "disable_user"
    KILL_PROCESS = "kill_process"
    QUARANTINE_FILE = "quarantine_file"
    ALERT_TEAM = "alert_team"
    ESCALATE = "escalate"
    ROLLBACK = "rollback"
    PATCH_SYSTEM = "patch_system"
    MONITOR = "monitor"

class EscalationLevel(Enum):
    """Escalation levels for incidents."""
    LEVEL_1 = "tier1_analyst"
    LEVEL_2 = "security_team"
    LEVEL_3 = "incident_commander"
    LEVEL_4 = "ciso"
    LEVEL_5 = "executive"

@dataclass
class ResponsePlan:
    """Represents an incident response plan."""
    plan_id: str
    incident_id: str
    actions: List[ResponseAction]
    escalation_level: EscalationLevel
    timeline: Dict[str, datetime]
    status: str = "pending"
    executed_actions: List[str] = field(default_factory=list)
    rollback_available: bool = True

class ResponseCoordinator:
    """
    Orchestrates incident response actions and escalation.

    Extracted from EnhancedIncidentResponseSystem (1, 226 LOC -> ~250 LOC component).
    Handles:
    - Response plan generation
    - Action execution coordination
    - Escalation management
    - Containment strategies
    - Response timeline tracking
    """

    def __init__(self):
        """Initialize the response coordinator."""
        self.response_plans: Dict[str, ResponsePlan] = {}
        self.action_queue: List[Tuple[str, ResponseAction]] = []
        self.escalation_history: List[Dict[str, Any]] = []
        self.containment_strategies: Dict[str, List[ResponseAction]] = {}

        # Response configuration
        self.auto_response_enabled = True
        self.max_escalation_time = timedelta(minutes=30)

        # Load containment strategies
        self._load_containment_strategies()

    def _load_containment_strategies(self) -> None:
        """Load predefined containment strategies."""
        self.containment_strategies = {
            "unauthorized_access": [
                ResponseAction.DISABLE_USER,
                ResponseAction.ALERT_TEAM,
                ResponseAction.MONITOR
            ],
            "data_breach": [
                ResponseAction.ISOLATE,
                ResponseAction.BLOCK_IP,
                ResponseAction.ALERT_TEAM,
                ResponseAction.ESCALATE
            ],
            "malware_detection": [
                ResponseAction.ISOLATE,
                ResponseAction.QUARANTINE_FILE,
                ResponseAction.KILL_PROCESS,
                ResponseAction.ALERT_TEAM
            ],
            "intrusion_attempt": [
                ResponseAction.BLOCK_IP,
                ResponseAction.MONITOR,
                ResponseAction.ALERT_TEAM
            ],
            "denial_of_service": [
                ResponseAction.BLOCK_IP,
                ResponseAction.ISOLATE,
                ResponseAction.ESCALATE
            ],
            "compliance_violation": [
                ResponseAction.ALERT_TEAM,
                ResponseAction.MONITOR
            ],
            "system_compromise": [
                ResponseAction.ISOLATE,
                ResponseAction.ROLLBACK,
                ResponseAction.ESCALATE,
                ResponseAction.PATCH_SYSTEM
            ]
        }

    def generate_response_plan(self,
                                incident_id: str,
                                incident_type: str,
                                severity: str,
                                affected_systems: List[str]) -> ResponsePlan:
        """Generate a response plan for an incident."""
        # Select containment strategy
        actions = self.containment_strategies.get(
            incident_type,
            [ResponseAction.ALERT_TEAM, ResponseAction.MONITOR]
        )

        # Determine escalation level based on severity
        escalation_level = self._determine_escalation_level(severity)

        # Create response timeline
        timeline = self._create_response_timeline(len(actions))

        # Create response plan
        plan = ResponsePlan(
            plan_id=self._generate_plan_id(),
            incident_id=incident_id,
            actions=actions,
            escalation_level=escalation_level,
            timeline=timeline
        )

        # Store plan
        self.response_plans[plan.plan_id] = plan

        # Queue actions if auto-response enabled
        if self.auto_response_enabled:
            for action in actions:
                self.action_queue.append((incident_id, action))

        return plan

    def _determine_escalation_level(self, severity: str) -> EscalationLevel:
        """Determine escalation level based on severity."""
        severity_to_escalation = {
            "low": EscalationLevel.LEVEL_1,
            "medium": EscalationLevel.LEVEL_2,
            "high": EscalationLevel.LEVEL_3,
            "critical": EscalationLevel.LEVEL_4,
            "emergency": EscalationLevel.LEVEL_5
        }
        return severity_to_escalation.get(severity, EscalationLevel.LEVEL_2)

    def _create_response_timeline(self, num_actions: int) -> Dict[str, datetime]:
        """Create timeline for response actions."""
        timeline = {}
        base_time = datetime.now()

        # Initial response
        timeline["initial_response"] = base_time

        # Action execution times (5 minutes per action)
        for i in range(num_actions):
            timeline[f"action_{i+1}"] = base_time + timedelta(minutes=5*(i+1))

        # Containment target
        timeline["containment_target"] = base_time + timedelta(minutes=30)

        # Resolution target
        timeline["resolution_target"] = base_time + timedelta(hours=4)

        return timeline

    def _generate_plan_id(self) -> str:
        """Generate unique response plan ID."""
        import uuid
        return f"RESP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}"

    def execute_action(self,
                        incident_id: str,
                        action: ResponseAction) -> Dict[str, Any]:
        """Execute a response action."""
        result = {
            "action": action.value,
            "incident_id": incident_id,
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
            "details": {}
        }

        try:
            # Simulate action execution based on type
            if action == ResponseAction.ISOLATE:
                result["details"] = {"systems_isolated": 1}
                result["status"] = "completed"

            elif action == ResponseAction.BLOCK_IP:
                result["details"] = {"ips_blocked": 1}
                result["status"] = "completed"

            elif action == ResponseAction.ALERT_TEAM:
                result["details"] = {"notifications_sent": 3}
                result["status"] = "completed"

            elif action == ResponseAction.ESCALATE:
                self._perform_escalation(incident_id)
                result["status"] = "escalated"

            else:
                # Generic action execution
                result["status"] = "completed"

            # Update plan status
            for plan in self.response_plans.values():
                if plan.incident_id == incident_id:
                    plan.executed_actions.append(action.value)
                    break

        except Exception as e:
            logger.error(f"Failed to execute action {action}: {e}")
            result["status"] = "failed"
            result["error"] = str(e)

        return result

    def _perform_escalation(self, incident_id: str) -> None:
        """Perform incident escalation."""
        escalation_record = {
            "incident_id": incident_id,
            "timestamp": datetime.now().isoformat(),
            "previous_level": None,
            "new_level": None
        }

        # Find current escalation level
        for plan in self.response_plans.values():
            if plan.incident_id == incident_id:
                current_level = plan.escalation_level

                # Escalate to next level
                level_order = list(EscalationLevel)
                current_index = level_order.index(current_level)

                if current_index < len(level_order) - 1:
                    new_level = level_order[current_index + 1]
                    plan.escalation_level = new_level

                    escalation_record["previous_level"] = current_level.value
                    escalation_record["new_level"] = new_level.value

                break

        self.escalation_history.append(escalation_record)

    def coordinate_containment(self,
                                incident_id: str,
                                affected_systems: List[str]) -> Dict[str, Any]:
        """Coordinate containment actions across systems."""
        containment_result = {
            "incident_id": incident_id,
            "systems_targeted": len(affected_systems),
            "actions_taken": [],
            "containment_time": None,
            "success": False
        }

        start_time = datetime.now()

        # Execute containment actions
        for system in affected_systems:
            # Isolate system
            action_result = self.execute_action(incident_id, ResponseAction.ISOLATE)
            containment_result["actions_taken"].append(action_result)

        # Calculate containment time
        containment_result["containment_time"] = (
            datetime.now() - start_time
        ).total_seconds()

        # Check if all actions succeeded
        containment_result["success"] = all(
            action.get("status") == "completed"
            for action in containment_result["actions_taken"]
        )

        return containment_result

    def get_response_metrics(self) -> Dict[str, Any]:
        """Get response coordination metrics."""
        total_plans = len(self.response_plans)
        executed_actions = sum(
            len(plan.executed_actions)
            for plan in self.response_plans.values()
        )

        return {
            "total_response_plans": total_plans,
            "executed_actions": executed_actions,
            "pending_actions": len(self.action_queue),
            "escalations": len(self.escalation_history),
            "auto_response_enabled": self.auto_response_enabled,
            "containment_strategies": len(self.containment_strategies)
        }