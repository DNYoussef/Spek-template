"""
DFARS Incident Response System
72-hour reporting capability as required by DFARS 252.204-7012
"""

import json
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from enum import Enum
from pathlib import Path
from typing import List, Dict, Any

class IncidentSeverity(Enum):
    """DFARS incident severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentType(Enum):
    """DFARS incident types"""
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MALWARE = "malware"
    DENIAL_OF_SERVICE = "denial_of_service"
    INSIDER_THREAT = "insider_threat"
    CUI_COMPROMISE = "cui_compromise"

class DFARSIncidentResponse:
    """DFARS-compliant incident response system"""

    def __init__(self, incident_dir: str = ".dfars_incidents"):
        self.incident_dir = Path(incident_dir)
        self.incident_dir.mkdir(exist_ok=True)
        self.notification_emails = [
            "security@company.com",
            "legal@company.com",
            "contracting@company.com"
        ]

    def create_incident(self, incident_type: IncidentType, severity: IncidentSeverity,
                       description: str, affected_systems: List[str] = None,
                       cui_involved: bool = False) -> str:
        """Create new incident record"""

        incident_id = f"INC-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

        incident_record = {
            'incident_id': incident_id,
            'created_at': datetime.now().isoformat(),
            'incident_type': incident_type.value,
            'severity': severity.value,
            'description': description,
            'affected_systems': affected_systems or [],
            'cui_involved': cui_involved,
            'status': 'reported',
            'notifications_sent': [],
            'timeline': [
                {
                    'timestamp': datetime.now().isoformat(),
                    'action': 'incident_created',
                    'details': 'Initial incident report'
                }
            ]
        }

        # Save incident record
        incident_file = self.incident_dir / f"{incident_id}.json"
        with open(incident_file, 'w') as f:
            json.dump(incident_record, f, indent=2)

        # Auto-notify for critical incidents
        if severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]:
            self.send_notifications(incident_record)

        return incident_id

    def send_notifications(self, incident: Dict[str, Any]):
        """Send incident notifications per DFARS requirements"""

        # Check if 72-hour reporting required
        cui_involved = incident.get('cui_involved', False)
        severity = incident.get('severity', 'low')

        if cui_involved or severity == 'critical':
            notification = {
                'incident_id': incident['incident_id'],
                'notification_type': '72_hour_report',
                'sent_at': datetime.now().isoformat(),
                'recipients': self.notification_emails,
                'message': f"DFARS Incident {incident['incident_id']}: {incident['description']}"
            }

            # Log notification (would send email in production)
            print(f"[DFARS NOTIFICATION] {notification['message']}")

            # Update incident record
            incident['notifications_sent'].append(notification)

    def check_72_hour_compliance(self) -> List[Dict]:
        """Check for incidents requiring 72-hour reporting"""

        overdue_incidents = []
        cutoff_time = datetime.now() - timedelta(hours=72)

        for incident_file in self.incident_dir.glob("*.json"):
            try:
                with open(incident_file, 'r') as f:
                    incident = json.load(f)

                created_at = datetime.fromisoformat(incident['created_at'])

                # Check if CUI incident over 72 hours old
                if (incident.get('cui_involved', False) and
                    created_at < cutoff_time and
                    not incident.get('notifications_sent')):

                    overdue_incidents.append({
                        'incident_id': incident['incident_id'],
                        'hours_overdue': (datetime.now() - created_at).total_seconds() / 3600,
                        'description': incident['description']
                    })

            except Exception:
                continue

        return overdue_incidents

# Global incident response system
dfars_incident_response = DFARSIncidentResponse()
