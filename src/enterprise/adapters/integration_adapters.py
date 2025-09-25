from src.constants.base import DAYS_RETENTION_PERIOD

Adapter pattern implementation for enterprise system integration.
Provides adapters for different enterprise systems (LDAP, ERP, CRM, etc.)
with unified interface for analytics and compliance reporting.

Used for:
- Enterprise system integration (Batch 9)
- Legacy system compatibility
- Multi-vendor analytics platform integration
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union, Protocol, runtime_checkable
from enum import Enum
from dataclasses import dataclass, asdict
import logging
import json
import time
import hashlib
from datetime import datetime, timezone
"""

from ...patterns.command_base import Command, CommandResult
"""

logger = logging.getLogger(__name__)

class IntegrationProtocol(Enum):
    """Supported integration protocols."""
    REST_API = "rest_api"
    SOAP = "soap"
    LDAP = "ldap"
    DATABASE = "database"
    FILE_BASED = "file_based"
    MESSAGE_QUEUE = "message_queue"
    WEBHOOK = "webhook"

class SystemType(Enum):
    """Types of enterprise systems."""
    ERP = "erp"
    CRM = "crm"
    LDAP = "ldap"
    HRMS = "hrms"
    COMPLIANCE = "compliance"
    ANALYTICS = "analytics"
    MONITORING = "monitoring"
    SECURITY = "security"

@dataclass
class IntegrationRequest:
    """Request for enterprise system integration."""
    request_id: str
    system_type: SystemType
    operation: str
    parameters: Dict[str, Any]
    timestamp: datetime
    timeout_seconds: int = 30
    retry_count: int = 0
    max_retries: int = 3

@dataclass
class IntegrationResponse:
    """Response from enterprise system integration."""
    request_id: str
    success: bool
    data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    response_time_ms: float
    timestamp: datetime
    metadata: Dict[str, Any]

@runtime_checkable
class EnterpriseSystemProtocol(Protocol):
    """Protocol defining enterprise system interface."""

    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """Authenticate with the enterprise system."""
        ...

    def execute_query(self, query: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute query against the enterprise system."""
        ...

    def get_system_info(self) -> Dict[str, Any]:
        """Get system information and capabilities."""
        ...

class EnterpriseSystemAdapter(ABC):
    """
    Abstract adapter for enterprise systems.

    Provides unified interface for different enterprise systems
    while adapting to their specific APIs and protocols.
    """

    def __init__(self, adapter_name: str, system_type: SystemType, protocol: IntegrationProtocol):
        self.adapter_name = adapter_name
        self.system_type = system_type
        self.protocol = protocol
        self.connection_config: Dict[str, Any] = {}
        self.authenticated = False
        self.metrics = {
            "requests_sent": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_response_time_ms": 0.0,
            "last_request_time": None
        }

    @abstractmethod
    def connect(self, connection_config: Dict[str, Any]) -> bool:
        """Connect to the enterprise system."""

    @abstractmethod
    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """Authenticate with the enterprise system."""

    @abstractmethod
    def execute_request(self, request: IntegrationRequest) -> IntegrationResponse:
        """Execute integration request."""

    @abstractmethod
    def disconnect(self) -> bool:
        """Disconnect from the enterprise system."""

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on the system."""

    def get_adapter_info(self) -> Dict[str, Any]:
        """Get adapter information and metrics."""
        avg_response_time = (
            self.metrics["total_response_time_ms"] / max(1, self.metrics["requests_sent"])
        )

        return {
            "adapter_name": self.adapter_name,
            "system_type": self.system_type.value,
            "protocol": self.protocol.value,
            "authenticated": self.authenticated,
            "connection_status": "connected" if self.authenticated else "disconnected",
            "metrics": {
                **self.metrics,
                "success_rate": self.metrics["successful_requests"] / max(1, self.metrics["requests_sent"]),
                "average_response_time_ms": avg_response_time
            }
        }

    def _update_metrics(self, success: bool, response_time_ms: float):
        """Update adapter metrics."""
        self.metrics["requests_sent"] += 1
        self.metrics["total_response_time_ms"] += response_time_ms
        self.metrics["last_request_time"] = datetime.now()

        if success:
            self.metrics["successful_requests"] += 1
        else:
            self.metrics["failed_requests"] += 1

class LDAPAdapter(EnterpriseSystemAdapter):
    """Adapter for LDAP directory services."""

    def __init__(self):
        super().__init__("LDAPAdapter", SystemType.LDAP, IntegrationProtocol.LDAP)
        self.ldap_connection = None
        self.base_dn = ""
        self.server_url = ""

    def connect(self, connection_config: Dict[str, Any]) -> bool:
        """Connect to LDAP server."""
        try:
            self.server_url = connection_config.get("server_url", "")
            self.base_dn = connection_config.get("base_dn", "")

            # Simulate LDAP connection
            if not self.server_url:
                raise ValueError("Server URL required for LDAP connection")

            self.connection_config = connection_config
            logger.info(f"Connected to LDAP server: {self.server_url}")
            return True

        except Exception as e:
            logger.error(f"LDAP connection failed: {e}")
            return False

    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """Authenticate with LDAP server."""
        try:
            username = credentials.get("username")
            password = credentials.get("password")

            if not username or not password:
                raise ValueError("Username and password required")

            # Simulate LDAP authentication
            if len(password) < 8:
                raise ValueError("Password too weak")

            self.authenticated = True
            logger.info(f"LDAP authentication successful for user: {username}")
            return True

        except Exception as e:
            logger.error(f"LDAP authentication failed: {e}")
            self.authenticated = False
            return False

    def execute_request(self, request: IntegrationRequest) -> IntegrationResponse:
        """Execute LDAP request."""
        start_time = time.time()
        request_id = request.request_id

        try:
            if not self.authenticated:
                raise RuntimeError("Not authenticated with LDAP server")

            operation = request.operation
            parameters = request.parameters

            if operation == "search_users":
                result = self._search_users(parameters)
            elif operation == "get_user_info":
                result = self._get_user_info(parameters)
            elif operation == "get_groups":
                result = self._get_groups(parameters)
            elif operation == "verify_membership":
                result = self._verify_membership(parameters)
            else:
                raise ValueError(f"Unsupported LDAP operation: {operation}")

            response_time = (time.time() - start_time) * 1000
            self._update_metrics(True, response_time)

            return IntegrationResponse(
                request_id=request_id,
                success=True,
                data=result,
                error_message=None,
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                metadata={"operation": operation, "record_count": len(result.get("records", []))}
            )

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self._update_metrics(False, response_time)

            return IntegrationResponse(
                request_id=request_id,
                success=False,
                data=None,
                error_message=str(e),
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                metadata={"operation": request.operation, "error_type": type(e).__name__}
            )

    def _search_users(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Search for users in LDAP directory."""
        search_filter = parameters.get("filter", "*")
        attributes = parameters.get("attributes", ["cn", "mail", "department"])

        # Simulate LDAP search results
        mock_users = [
            {
                "dn": f"cn=user{i},{self.base_dn}",
                "cn": f"User {i}",
                "mail": f"user{i}@company.com",
                "department": "Engineering" if i % 2 == 0 else "Sales",
                "employeeId": f"EMP{i:04d}"
            }
            for i in range(1, 6)  # Return 5 mock users
        ]

        # Filter by search criteria if provided
        if search_filter != "*":
            filtered_users = [
                user for user in mock_users
                if search_filter.lower() in user["cn"].lower()
            ]
            mock_users = filtered_users

        return {
            "records": mock_users,
            "total_count": len(mock_users),
            "search_filter": search_filter,
            "attributes": attributes
        }

    def _get_user_info(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed information for a specific user."""
        username = parameters.get("username")
        if not username:
            raise ValueError("Username parameter required")

        # Simulate user lookup
        mock_user = {
            "dn": f"cn={username},{self.base_dn}",
            "cn": username,
            "mail": f"{username}@company.com",
            "department": "Engineering",
            "title": "Software Engineer",
            "manager": "cn=manager, ou=management, dc=company, dc=com",
            "groups": ["cn=developers, ou=groups, dc=company, dc=com", "cn=employees, ou=groups, dc=company, dc=com"],
            "lastLogin": datetime.now().isoformat(),
            "accountStatus": "active"
        }

        return {"user_info": mock_user}

    def _get_groups(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Get groups from LDAP directory."""
        group_filter = parameters.get("filter", "*")

        mock_groups = [
            {"dn": f"cn=developers, ou=groups,{self.base_dn}", "cn": "developers", "description": "Development team"},
            {"dn": f"cn=admins, ou=groups,{self.base_dn}", "cn": "admins", "description": "System administrators"},
            {"dn": f"cn=employees, ou=groups,{self.base_dn}", "cn": "employees", "description": "All employees"},
        ]

        return {"groups": mock_groups, "total_count": len(mock_groups)}

    def _verify_membership(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Verify user membership in a group."""
        username = parameters.get("username")
        group_name = parameters.get("group")

        if not username or not group_name:
            raise ValueError("Username and group parameters required")

        # Simulate membership verification
        is_member = group_name in ["developers", "employees"]  # Mock logic

        return {
            "username": username,
            "group": group_name,
            "is_member": is_member,
            "verification_timestamp": datetime.now().isoformat()
        }

    def disconnect(self) -> bool:
        """Disconnect from LDAP server."""
        try:
            self.authenticated = False
            self.ldap_connection = None
            logger.info("Disconnected from LDAP server")
            return True
        except Exception as e:
            logger.error(f"LDAP disconnect error: {e}")
            return False

    def health_check(self) -> Dict[str, Any]:
        """Perform LDAP health check."""
        try:
            if not self.authenticated:
                return {"status": "unhealthy", "reason": "Not authenticated"}

            # Simulate health check by attempting a simple search
            health_status = "healthy"
            response_time = 50.0  # Simulated response time

            return {
                "status": health_status,
                "server_url": self.server_url,
                "response_time_ms": response_time,
                "base_dn": self.base_dn,
                "connection_pool_active": True,
                "last_check": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "reason": str(e),
                "last_check": datetime.now().isoformat()
            }

class ERPAdapter(EnterpriseSystemAdapter):
    """Adapter for ERP systems (SAP, Oracle, etc.)."""

    def __init__(self):
        super().__init__("ERPAdapter", SystemType.ERP, IntegrationProtocol.REST_API)
        self.api_endpoint = ""
        self.api_key = ""
        self.tenant_id = ""

    def connect(self, connection_config: Dict[str, Any]) -> bool:
        """Connect to ERP system."""
        try:
            self.api_endpoint = connection_config.get("api_endpoint", "")
            self.tenant_id = connection_config.get("tenant_id", "")

            if not self.api_endpoint:
                raise ValueError("API endpoint required for ERP connection")

            self.connection_config = connection_config
            logger.info(f"Connected to ERP system: {self.api_endpoint}")
            return True

        except Exception as e:
            logger.error(f"ERP connection failed: {e}")
            return False

    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """Authenticate with ERP system."""
        try:
            api_key = credentials.get("api_key")
            username = credentials.get("username")

            if not api_key:
                raise ValueError("API key required for ERP authentication")

            self.api_key = api_key
            self.authenticated = True
            logger.info(f"ERP authentication successful for user: {username}")
            return True

        except Exception as e:
            logger.error(f"ERP authentication failed: {e}")
            self.authenticated = False
            return False

    def execute_request(self, request: IntegrationRequest) -> IntegrationResponse:
        """Execute ERP request."""
        start_time = time.time()
        request_id = request.request_id

        try:
            if not self.authenticated:
                raise RuntimeError("Not authenticated with ERP system")

            operation = request.operation
            parameters = request.parameters

            if operation == "get_financial_data":
                result = self._get_financial_data(parameters)
            elif operation == "get_employee_data":
                result = self._get_employee_data(parameters)
            elif operation == "get_project_data":
                result = self._get_project_data(parameters)
            elif operation == "execute_report":
                result = self._execute_report(parameters)
            else:
                raise ValueError(f"Unsupported ERP operation: {operation}")

            response_time = (time.time() - start_time) * 1000
            self._update_metrics(True, response_time)

            return IntegrationResponse(
                request_id=request_id,
                success=True,
                data=result,
                error_message=None,
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                metadata={"operation": operation, "tenant_id": self.tenant_id}
            )

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self._update_metrics(False, response_time)

            return IntegrationResponse(
                request_id=request_id,
                success=False,
                data=None,
                error_message=str(e),
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                metadata={"operation": request.operation, "error_type": type(e).__name__}
            )

    def _get_financial_data(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Get financial data from ERP system."""
        date_from = parameters.get("date_from", "2024-01-01")
        date_to = parameters.get("date_to", "2024-12-31")
        cost_center = parameters.get("cost_center", "ALL")

        # Simulate financial data
        mock_data = {
            "period": f"{date_from} to {date_to}",
            "cost_center": cost_center,
            "financial_summary": {
                "total_revenue": 5000000.00,
                "total_expenses": 3500000.00,
                "net_profit": 1500000.00,
                "budget_variance": 0.05
            },
            "cost_centers": [
                {"id": "CC001", "name": "Engineering", "budget": 2000000, "actual": 1950000},
                {"id": "CC002", "name": "Sales", "budget": 1000000, "actual": 1100000},
                {"id": "CC003", "name": "Operations", "budget": 500000, "actual": 450000}
            ]
        }

        return mock_data

    def _get_employee_data(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Get employee data from ERP system."""
        department = parameters.get("department", "ALL")
        include_salary = parameters.get("include_salary", False)

        mock_employees = []
        for i in range(1, 11):
            employee = {
                "employee_id": f"EMP{i:04d}",
                "name": f"Employee {i}",
                "department": "Engineering" if i % 2 == 0 else "Sales",
                "position": "Software Engineer" if i % 2 == 0 else "Sales Rep",
                "hire_date": "2020-01-15",
                "status": "active"
            }

            if include_salary:
                employee["salary"] = 75000 + (i * 5000)

            mock_employees.append(employee)

        # Filter by department if specified
        if department != "ALL":
            mock_employees = [emp for emp in mock_employees if emp["department"] == department]

        return {
            "employees": mock_employees,
            "total_count": len(mock_employees),
            "department_filter": department
        }

    def _get_project_data(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Get project data from ERP system."""
        status_filter = parameters.get("status", "ALL")

        mock_projects = [
            {"id": "PRJ001", "name": "Digital Transformation", "status": "active", "budget": 500000, "completion": 0.65},
            {"id": "PRJ002", "name": "Process Automation", "status": "completed", "budget": 300000, "completion": 1.0},
            {"id": "PRJ003", "name": "Security Upgrade", "status": "planning", "budget": 200000, "completion": 0.0}
        ]

        # Filter by status if specified
        if status_filter != "ALL":
            mock_projects = [proj for proj in mock_projects if proj["status"] == status_filter]

        return {
            "projects": mock_projects,
            "total_count": len(mock_projects),
            "status_filter": status_filter
        }

    def _execute_report(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a predefined report in the ERP system."""
        report_name = parameters.get("report_name")
        report_parameters = parameters.get("parameters", {})

        if not report_name:
            raise ValueError("Report name required")

        # Simulate report execution
        mock_report = {
            "report_name": report_name,
            "execution_time": datetime.now().isoformat(),
            "parameters": report_parameters,
            "status": "completed",
            "record_count": 150,
            "download_url": f"/reports/{report_name}/download",
            "expires_at": datetime.now().isoformat()
        }

        return {"report": mock_report}

    def disconnect(self) -> bool:
        """Disconnect from ERP system."""
        try:
            self.authenticated = False
            self.api_key = ""
            logger.info("Disconnected from ERP system")
            return True
        except Exception as e:
            logger.error(f"ERP disconnect error: {e}")
            return False

    def health_check(self) -> Dict[str, Any]:
        """Perform ERP health check."""
        try:
            if not self.authenticated:
                return {"status": "unhealthy", "reason": "Not authenticated"}

            # Simulate API health check
            health_status = "healthy"
            response_time = 120.0

            return {
                "status": health_status,
                "api_endpoint": self.api_endpoint,
                "response_time_ms": response_time,
                "tenant_id": self.tenant_id,
                "api_version": "v2.0",
                "last_check": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "reason": str(e),
                "last_check": datetime.now().isoformat()
            }

class ComplianceAdapter(EnterpriseSystemAdapter):
    """Adapter for compliance management systems."""

    def __init__(self):
        super().__init__("ComplianceAdapter", SystemType.COMPLIANCE, IntegrationProtocol.REST_API)
        self.compliance_frameworks = ["SOX", "GDPR", "HIPAA", "PCI-DSS"]
        self.audit_trail = []

    def connect(self, connection_config: Dict[str, Any]) -> bool:
        """Connect to compliance system."""
        try:
            self.connection_config = connection_config
            logger.info("Connected to compliance management system")
            return True
        except Exception as e:
            logger.error(f"Compliance system connection failed: {e}")
            return False

    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """Authenticate with compliance system."""
        try:
            compliance_token = credentials.get("compliance_token")
            if not compliance_token:
                raise ValueError("Compliance token required")

            self.authenticated = True
            logger.info("Compliance system authentication successful")
            return True

        except Exception as e:
            logger.error(f"Compliance authentication failed: {e}")
            self.authenticated = False
            return False

    def execute_request(self, request: IntegrationRequest) -> IntegrationResponse:
        """Execute compliance request."""
        start_time = time.time()
        request_id = request.request_id

        try:
            if not self.authenticated:
                raise RuntimeError("Not authenticated with compliance system")

            operation = request.operation
            parameters = request.parameters

            if operation == "get_compliance_status":
                result = self._get_compliance_status(parameters)
            elif operation == "create_audit_entry":
                result = self._create_audit_entry(parameters)
            elif operation == "get_violations":
                result = self._get_violations(parameters)
            elif operation == "generate_report":
                result = self._generate_report(parameters)
            else:
                raise ValueError(f"Unsupported compliance operation: {operation}")

            response_time = (time.time() - start_time) * 1000
            self._update_metrics(True, response_time)

            return IntegrationResponse(
                request_id=request_id,
                success=True,
                data=result,
                error_message=None,
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                metadata={"operation": operation, "frameworks": self.compliance_frameworks}
            )

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self._update_metrics(False, response_time)

            return IntegrationResponse(
                request_id=request_id,
                success=False,
                data=None,
                error_message=str(e),
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                metadata={"operation": request.operation, "error_type": type(e).__name__}
            )

    def _get_compliance_status(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Get overall compliance status."""
        framework = parameters.get("framework", "ALL")

        compliance_status = {
            "SOX": {"status": "compliant", "last_audit": "2024-06-01", "score": 95},
            "GDPR": {"status": "compliant", "last_audit": "2024-05-15", "score": 92},
            "HIPAA": {"status": "partially_compliant", "last_audit": "2024-07-01", "score": 85},
            "PCI-DSS": {"status": "compliant", "last_audit": "2024-04-20", "score": 98}
        }

        if framework != "ALL" and framework in compliance_status:
            return {"framework": framework, "compliance": compliance_status[framework]}

        return {"frameworks": compliance_status, "overall_score": 92.5}

    def _create_audit_entry(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Create audit trail entry."""
        entry = {
            "audit_id": f"AUD_{int(time.time())}",
            "timestamp": datetime.now().isoformat(),
            "user": parameters.get("user", "system"),
            "action": parameters.get("action", "unknown"),
            "resource": parameters.get("resource", ""),
            "details": parameters.get("details", {}),
            "risk_level": parameters.get("risk_level", "low")
        }

        self.audit_trail.append(entry)
        return {"audit_entry": entry, "status": "created"}

    def _get_violations(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Get compliance violations."""
        severity = parameters.get("severity", "ALL")
        framework = parameters.get("framework", "ALL")

        mock_violations = [
            {
                "violation_id": "VIO001",
                "framework": "GDPR",
                "severity": "high",
                "description": "Personal data processing without consent",
                "detected_date": "2024-08-15",
                "status": "remediated"
            },
            {
                "violation_id": "VIO002",
                "framework": "SOX",
                "severity": "medium",
                "description": "Insufficient access controls for financial data",
                "detected_date": "2024-08-20",
                "status": "in_progress"
            }
        ]

        # Filter violations
        filtered_violations = mock_violations
        if severity != "ALL":
            filtered_violations = [v for v in filtered_violations if v["severity"] == severity]
        if framework != "ALL":
            filtered_violations = [v for v in filtered_violations if v["framework"] == framework]

        return {"violations": filtered_violations, "total_count": len(filtered_violations)}

    def _generate_report(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate compliance report."""
        report_type = parameters.get("report_type", "summary")
        framework = parameters.get("framework", "ALL")

        report = {
            "report_id": f"RPT_{int(time.time())}",
            "report_type": report_type,
            "framework": framework,
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_controls": 150,
                "compliant_controls": 142,
                "non_compliant_controls": 8,
                "compliance_percentage": 94.DAYS_RETENTION_PERIOD
            },
            "download_url": f"/reports/{report_type}/download"
        }

        return {"report": report}

    def disconnect(self) -> bool:
        """Disconnect from compliance system."""
        try:
            self.authenticated = False
            logger.info("Disconnected from compliance system")
            return True
        except Exception as e:
            logger.error(f"Compliance disconnect error: {e}")
            return False

    def health_check(self) -> Dict[str, Any]:
        """Perform compliance system health check."""
        try:
            if not self.authenticated:
                return {"status": "unhealthy", "reason": "Not authenticated"}

            return {
                "status": "healthy",
                "supported_frameworks": self.compliance_frameworks,
                "audit_trail_entries": len(self.audit_trail),
                "response_time_ms": 80.0,
                "last_check": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "reason": str(e),
                "last_check": datetime.now().isoformat()
            }

# Command integration for adapter operations
class EnterpriseIntegrationCommand(Command):
    """Command for executing enterprise system integration operations."""

    def __init__(self, adapter: EnterpriseSystemAdapter, request: IntegrationRequest):
        self.adapter = adapter
        self.request = request
        self.response: Optional[IntegrationResponse] = None

    def execute(self) -> CommandResult:
        """Execute enterprise integration command."""
        try:
            if not self.adapter.authenticated:
                return CommandResult(
                    success=False,
                    error="Adapter not authenticated",
                    data={"adapter": self.adapter.adapter_name, "system_type": self.adapter.system_type.value}
                )

            self.response = self.adapter.execute_request(self.request)

            return CommandResult(
                success=self.response.success,
                data={
                    "request_id": self.response.request_id,
                    "response_data": self.response.data,
                    "response_time_ms": self.response.response_time_ms,
                    "timestamp": self.response.timestamp.isoformat()
                },
                error=self.response.error_message,
                metadata={
                    "adapter_info": self.adapter.get_adapter_info(),
                    "request_metadata": asdict(self.request),
                    "response_metadata": self.response.metadata
                }
            )

        except Exception as e:
            return CommandResult(
                success=False,
                error=f"Integration command failed: {str(e)}",
                data={
                    "adapter": self.adapter.adapter_name,
                    "request_id": self.request.request_id
                }
            )

    def undo(self) -> CommandResult:
        """Undo enterprise integration operation (limited support)."""
        try:
            if not self.response or not self.response.success:
                return CommandResult(success=False, error="No successful operation to undo")

            # Limited undo capability - mostly for cleanup operations
            cleanup_request = IntegrationRequest(
                request_id=f"undo_{self.request.request_id}",
                system_type=self.request.system_type,
                operation="cleanup",
                parameters={"original_request_id": self.request.request_id},
                timestamp=datetime.now(),
                timeout_seconds=30
            )

            # Some adapters may support cleanup operations
            if hasattr(self.adapter, '_cleanup_operation'):
                cleanup_response = self.adapter._cleanup_operation(cleanup_request)
                return CommandResult(
                    success=cleanup_response.success,
                    data={"cleanup_performed": True, "original_request_id": self.request.request_id}
                )

            return CommandResult(
                success=True,
                data={"message": "Undo not supported for this operation", "original_request_id": self.request.request_id}
            )

        except Exception as e:
            return CommandResult(
                success=False,
                error=f"Undo operation failed: {str(e)}"
            )

    def validate(self) -> CommandResult:
        """Validate integration command parameters."""
        errors = []

        if not self.adapter:
            errors.append("Adapter instance required")

        if not self.request:
            errors.append("Integration request required")

        if self.request and not self.request.operation:
            errors.append("Operation must be specified in request")

        if self.adapter and not self.adapter.authenticated:
            errors.append("Adapter must be authenticated before executing requests")

        # Validate request timeout
        if self.request and self.request.timeout_seconds <= 0:
            errors.append("Request timeout must be positive")

        if errors:
            return CommandResult(success=False, error="; ".join(errors))

        return CommandResult(success=True, data={"validation": "passed"})

# Adapter registry for managing multiple adapters
class EnterpriseAdapterRegistry:
    """Registry for managing enterprise system adapters."""

    def __init__(self):
        self.adapters: Dict[str, EnterpriseSystemAdapter] = {}
        self.connection_pool: Dict[str, Dict[str, Any]] = {}

    def register_adapter(self, name: str, adapter: EnterpriseSystemAdapter) -> bool:
        """Register an adapter in the registry."""
        try:
            self.adapters[name] = adapter
            logger.info(f"Registered adapter: {name} ({adapter.system_type.value})")
            return True
        except Exception as e:
            logger.error(f"Failed to register adapter {name}: {e}")
            return False

    def get_adapter(self, name: str) -> Optional[EnterpriseSystemAdapter]:
        """Get adapter by name."""
        return self.adapters.get(name)

    def get_adapters_by_type(self, system_type: SystemType) -> List[EnterpriseSystemAdapter]:
        """Get all adapters of a specific system type."""
        return [
            adapter for adapter in self.adapters.values()
            if adapter.system_type == system_type
        ]

    def execute_request(self, adapter_name: str, request: IntegrationRequest) -> IntegrationResponse:
        """Execute request using specified adapter."""
        adapter = self.get_adapter(adapter_name)
        if not adapter:
            raise ValueError(f"Adapter not found: {adapter_name}")

        command = EnterpriseIntegrationCommand(adapter, request)
        result = command.execute()

        if not result.success:
            raise RuntimeError(f"Integration failed: {result.error}")

        # Extract response from command result
        return IntegrationResponse(
            request_id=request.request_id,
            success=result.success,
            data=result.data.get("response_data"),
            error_message=result.error,
            response_time_ms=result.data.get("response_time_ms", 0.0),
            timestamp=datetime.fromisoformat(result.data.get("timestamp", datetime.now().isoformat())),
            metadata=result.metadata or {}
        )

    def health_check_all(self) -> Dict[str, Dict[str, Any]]:
        """Perform health check on all registered adapters."""
        health_status = {}

        for name, adapter in self.adapters.items():
            try:
                health_status[name] = adapter.health_check()
            except Exception as e:
                health_status[name] = {
                    "status": "error",
                    "reason": str(e),
                    "last_check": datetime.now().isoformat()
                }

        return health_status

    def get_registry_status(self) -> Dict[str, Any]:
        """Get comprehensive registry status."""
        adapter_summary = {}

        for name, adapter in self.adapters.items():
            adapter_info = adapter.get_adapter_info()
            adapter_summary[name] = {
                "system_type": adapter_info["system_type"],
                "protocol": adapter_info["protocol"],
                "connection_status": adapter_info["connection_status"],
                "success_rate": adapter_info["metrics"]["success_rate"],
                "total_requests": adapter_info["metrics"]["requests_sent"]
            }

        return {
            "total_adapters": len(self.adapters),
            "connected_adapters": len([a for a in self.adapters.values() if a.authenticated]),
            "system_type_distribution": self._get_system_type_distribution(),
            "adapters": adapter_summary
        }

    def _get_system_type_distribution(self) -> Dict[str, int]:
        """Get distribution of adapters by system type."""
        distribution = {}
        for adapter in self.adapters.values():
            system_type = adapter.system_type.value
            distribution[system_type] = distribution.get(system_type, 0) + 1
        return distribution

# Example usage and demonstration
if __name__ == "__main__":
    # Create adapter registry
    registry = EnterpriseAdapterRegistry()

    # Create and register adapters
    ldap_adapter = LDAPAdapter()
    erp_adapter = ERPAdapter()
    compliance_adapter = ComplianceAdapter()

    registry.register_adapter("ldap", ldap_adapter)
    registry.register_adapter("erp", erp_adapter)
    registry.register_adapter("compliance", compliance_adapter)

    print("Enterprise Integration Adapters Demonstration")
    print("=" * 60)

    # Connect and authenticate adapters
    ldap_adapter.connect({"server_url": "ldap://company.com", "base_dn": "dc=company, dc=com"})
    ldap_adapter.authenticate({"username": "admin", "password": "password123"})

    erp_adapter.connect({"api_endpoint": "https://erp.company.com/api", "tenant_id": "tenant123"})
    erp_adapter.authenticate({"api_key": "api_key_123", "username": "erp_user"})

    compliance_adapter.connect({})
    compliance_adapter.authenticate({"compliance_token": "compliance_token_456"})

    # Test LDAP adapter
    ldap_request = IntegrationRequest(
        request_id="ldap_001",
        system_type=SystemType.LDAP,
        operation="search_users",
        parameters={"filter": "User", "attributes": ["cn", "mail"]},
        timestamp=datetime.now()
    )

    ldap_command = EnterpriseIntegrationCommand(ldap_adapter, ldap_request)
    ldap_result = ldap_command.execute()
    print(f"LDAP Result: {ldap_result.success}")
    if ldap_result.success:
        user_count = len(ldap_result.data["response_data"]["records"])
        print(f"Found {user_count} users")

    # Test ERP adapter
    erp_request = IntegrationRequest(
        request_id="erp_001",
        system_type=SystemType.ERP,
        operation="get_financial_data",
        parameters={"cost_center": "Engineering"},
        timestamp=datetime.now()
    )

    erp_command = EnterpriseIntegrationCommand(erp_adapter, erp_request)
    erp_result = erp_command.execute()
    print(f"ERP Result: {erp_result.success}")
    if erp_result.success:
        net_profit = erp_result.data["response_data"]["financial_summary"]["net_profit"]
        print(f"Net Profit: ${net_profit:,.2f}")

    # Health check all adapters
    print("\nAdapter Health Check:")
    health_status = registry.health_check_all()
    for adapter_name, health in health_status.items():
        print(f"{adapter_name}: {health['status']}")

    # Registry status
    print("\nRegistry Status:")
    status = registry.get_registry_status()
    print(f"Total Adapters: {status['total_adapters']}")
    print(f"Connected: {status['connected_adapters']}")
    print(f"System Types: {list(status['system_type_distribution'].keys())}")

    print("\nAdapter pattern demonstration completed.")