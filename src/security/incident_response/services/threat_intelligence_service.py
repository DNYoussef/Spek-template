"""
Threat intelligence service.
Extracted from enhanced_incident_response_system.py for focused responsibility.
"""

import time
from typing import Dict, Any, List
from lib.shared.utilities import get_logger

from ..models import SecurityIncident, IncidentSeverity

logger = get_logger(__name__)


class ThreatIntelligenceService:
    """
    Focused service for managing threat intelligence feeds and indicators of compromise (IOCs).
    Handles threat intelligence updates and correlation with current incidents.
    """

    def __init__(self):
        """Initialize the threat intelligence service."""
        self.threat_intelligence: Dict[str, Any] = {}
        self.ioc_database: Dict[str, Any] = {}
        self._initialize_threat_intelligence()

    def _initialize_threat_intelligence(self):
        """Initialize threat intelligence feeds and IOCs."""
        self.threat_intelligence = {
            "apt_groups": {
                "apt1": {"tactics": ["spear_phishing", "privilege_escalation"], "severity": "high"},
                "apt28": {"tactics": ["credential_harvesting", "lateral_movement"], "severity": "critical"},
                "apt29": {"tactics": ["supply_chain", "living_off_land"], "severity": "critical"}
            },
            "malware_families": {
                "backdoor_families": ["cobalt_strike", "metasploit", "empire"],
                "ransomware_families": ["ryuk", "maze", "conti", "lockbit"],
                "banking_trojans": ["emotet", "trickbot", "qakbot"]
            },
            "attack_techniques": {
                "mitre_att&ck": {
                    "T1078": "Valid Accounts",
                    "T1190": "Exploit Public-Facing Application",
                    "T1566": "Phishing",
                    "T1059": "Command and Scripting Interpreter"
                }
            }
        }

        # Initialize IOC database with sample indicators
        self.ioc_database = {
            "malicious_ips": {
                "192.168.100.50": {
                    "type": "command_and_control",
                    "severity": "critical",
                    "first_seen": time.time(),
                    "associated_malware": ["cobalt_strike"]
                },
                "10.0.0.123": {
                    "type": "exfiltration_server",
                    "severity": "high",
                    "first_seen": time.time(),
                    "associated_groups": ["apt28"]
                }
            },
            "malicious_domains": {
                "evil-domain.com": {
                    "type": "phishing",
                    "severity": "medium",
                    "first_seen": time.time(),
                    "campaign": "credential_harvesting_2024"
                }
            },
            "file_hashes": {
                "a1b2c3d4e5f6": {
                    "type": "ransomware",
                    "family": "ryuk",
                    "severity": "critical",
                    "first_seen": time.time()
                }
            }
        }

    def update_threat_intelligence(self):
        """Update threat intelligence feeds with latest data."""
        try:
            # In production, this would connect to real threat intelligence feeds
            # For now, simulate updates
            current_time = time.time()

            # Add new APT group intelligence
            new_apt_data = {
                "apt33": {
                    "tactics": ["watering_hole", "supply_chain"],
                    "severity": "high",
                    "last_updated": current_time
                }
            }

            self.threat_intelligence["apt_groups"].update(new_apt_data)

            # Add new malware family intelligence
            new_malware_families = {
                "new_ransomware_families": ["blackbyte", "hive", "alphv"],
                "infostealer_families": ["redline", "azorult", "raccoon"]
            }

            self.threat_intelligence["malware_families"].update(new_malware_families)

            logger.info("Threat intelligence feeds updated successfully")

        except Exception as e:
            logger.error(f"Failed to update threat intelligence: {e}")

    def update_ioc_database(self):
        """Update indicators of compromise database."""
        try:
            # In production, this would pull from threat intelligence feeds
            # Simulate IOC updates
            current_time = time.time()

            # Add new malicious IPs
            new_ips = {
                "203.0.113.45": {
                    "type": "botnet_controller",
                    "severity": "high",
                    "first_seen": current_time,
                    "associated_malware": ["qakbot"]
                }
            }

            self.ioc_database["malicious_ips"].update(new_ips)

            # Add new malicious domains
            new_domains = {
                "suspicious-site.net": {
                    "type": "malware_distribution",
                    "severity": "high",
                    "first_seen": current_time,
                    "campaign": "trojan_distribution_2024"
                }
            }

            self.ioc_database["malicious_domains"].update(new_domains)

            logger.info("IOC database updated successfully")

        except Exception as e:
            logger.error(f"Failed to update IOC database: {e}")

    def correlate_with_threat_intelligence(self, incidents: Dict[str, SecurityIncident]):
        """Correlate current incidents with threat intelligence."""
        try:
            correlations_found = 0

            for incident_id, incident in incidents.items():
                if incident.status in ["resolved", "closed"]:
                    continue

                correlations = self._find_threat_correlations(incident)

                if correlations:
                    # Update incident with threat intelligence context
                    if "threat_intelligence" not in incident.metadata:
                        incident.metadata["threat_intelligence"] = {}

                    incident.metadata["threat_intelligence"].update(correlations)
                    correlations_found += 1

                    # Enhance incident analysis with threat intelligence
                    enhanced_analysis = self._enhance_analysis_with_intelligence(
                        incident.initial_analysis, correlations
                    )

                    if enhanced_analysis != incident.initial_analysis:
                        incident.initial_analysis = enhanced_analysis

                    logger.info(f"Threat intelligence correlation found for incident: {incident_id}")

            if correlations_found > 0:
                logger.info(f"Updated {correlations_found} incidents with threat intelligence correlations")

        except Exception as e:
            logger.error(f"Failed to correlate incidents with threat intelligence: {e}")

    def _find_threat_correlations(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Find correlations between incident and threat intelligence."""
        correlations = {}

        # Check for IOC matches
        ioc_matches = self._check_ioc_matches(incident)
        if ioc_matches:
            correlations["ioc_matches"] = ioc_matches

        # Check for APT group patterns
        apt_matches = self._check_apt_patterns(incident)
        if apt_matches:
            correlations["apt_correlations"] = apt_matches

        # Check for malware family patterns
        malware_matches = self._check_malware_patterns(incident)
        if malware_matches:
            correlations["malware_correlations"] = malware_matches

        # Check for attack technique matches
        technique_matches = self._check_attack_techniques(incident)
        if technique_matches:
            correlations["attack_techniques"] = technique_matches

        return correlations

    def _check_ioc_matches(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Check for IOC matches in incident data."""
        matches = []

        # Check for malicious IP addresses
        incident_ips = self._extract_ips_from_incident(incident)
        for ip in incident_ips:
            if ip in self.ioc_database.get("malicious_ips", {}):
                ioc_data = self.ioc_database["malicious_ips"][ip]
                matches.append({
                    "type": "malicious_ip",
                    "indicator": ip,
                    "threat_data": ioc_data
                })

        # Check for malicious domains
        incident_domains = self._extract_domains_from_incident(incident)
        for domain in incident_domains:
            if domain in self.ioc_database.get("malicious_domains", {}):
                ioc_data = self.ioc_database["malicious_domains"][domain]
                matches.append({
                    "type": "malicious_domain",
                    "indicator": domain,
                    "threat_data": ioc_data
                })

        # Check for malicious file hashes
        incident_hashes = self._extract_hashes_from_incident(incident)
        for hash_value in incident_hashes:
            if hash_value in self.ioc_database.get("file_hashes", {}):
                ioc_data = self.ioc_database["file_hashes"][hash_value]
                matches.append({
                    "type": "malicious_file",
                    "indicator": hash_value,
                    "threat_data": ioc_data
                })

        return matches

    def _check_apt_patterns(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Check for APT group patterns in incident."""
        matches = []

        # Map incident characteristics to APT tactics
        incident_tactics = self._extract_tactics_from_incident(incident)

        for apt_group, apt_data in self.threat_intelligence["apt_groups"].items():
            common_tactics = set(incident_tactics) & set(apt_data["tactics"])

            if common_tactics:
                matches.append({
                    "apt_group": apt_group,
                    "severity": apt_data["severity"],
                    "matching_tactics": list(common_tactics),
                    "confidence": len(common_tactics) / len(apt_data["tactics"])
                })

        return matches

    def _check_malware_patterns(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Check for malware family patterns in incident."""
        matches = []

        incident_type = incident.incident_type.value

        # Check for ransomware patterns
        if "malware" in incident_type or "encrypt" in incident.description.lower():
            ransomware_families = self.threat_intelligence["malware_families"].get("ransomware_families", [])
            if ransomware_families:
                matches.append({
                    "family_type": "ransomware",
                    "potential_families": ransomware_families,
                    "confidence": 0.7
                })

        # Check for banking trojan patterns
        if "credential" in incident.description.lower() or "banking" in incident.description.lower():
            banking_trojans = self.threat_intelligence["malware_families"].get("banking_trojans", [])
            if banking_trojans:
                matches.append({
                    "family_type": "banking_trojan",
                    "potential_families": banking_trojans,
                    "confidence": 0.6
                })

        return matches

    def _check_attack_techniques(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Check for MITRE ATT&CK technique matches."""
        matches = []

        attack_techniques = self.threat_intelligence["attack_techniques"]["mitre_att&ck"]

        # Simple mapping based on incident type and description
        technique_mapping = {
            "unauthorized_access": ["T1078"],  # Valid Accounts
            "data_breach": ["T1190"],         # Exploit Public-Facing Application
            "malware_detection": ["T1059"],   # Command and Scripting Interpreter
            "intrusion_attempt": ["T1566"]   # Phishing
        }

        incident_type = incident.incident_type.value
        if incident_type in technique_mapping:
            for technique_id in technique_mapping[incident_type]:
                if technique_id in attack_techniques:
                    matches.append({
                        "technique_id": technique_id,
                        "technique_name": attack_techniques[technique_id],
                        "confidence": 0.8
                    })

        return matches

    def _extract_ips_from_incident(self, incident: SecurityIncident) -> List[str]:
        """Extract IP addresses from incident data."""
        ips = []

        # Extract from affected resources
        for resource in incident.affected_resources:
            if "ip:" in resource:
                ips.append(resource.split(":", 1)[1])

        # Extract from indicators
        if "source_ip" in incident.indicators.get("event_data", {}):
            ips.append(incident.indicators["event_data"]["source_ip"])

        return list(set(ips))

    def _extract_domains_from_incident(self, incident: SecurityIncident) -> List[str]:
        """Extract domain names from incident data."""
        domains = []

        # Extract from affected resources
        for resource in incident.affected_resources:
            if "hostname:" in resource:
                hostname = resource.split(":", 1)[1]
                if "." in hostname:
                    domains.append(hostname)

        return list(set(domains))

    def _extract_hashes_from_incident(self, incident: SecurityIncident) -> List[str]:
        """Extract file hashes from incident data."""
        hashes = []

        # Extract from evidence or metadata
        if "file_hashes" in incident.metadata:
            hashes.extend(incident.metadata["file_hashes"])

        return list(set(hashes))

    def _extract_tactics_from_incident(self, incident: SecurityIncident) -> List[str]:
        """Extract tactics from incident characteristics."""
        tactics = []

        incident_type = incident.incident_type.value
        description = incident.description.lower()

        # Map incident characteristics to tactics
        if "unauthorized_access" in incident_type or "credential" in description:
            tactics.append("credential_harvesting")

        if "privilege" in description:
            tactics.append("privilege_escalation")

        if "lateral" in description or "network" in description:
            tactics.append("lateral_movement")

        if "data_breach" in incident_type or "exfiltrat" in description:
            tactics.append("data_exfiltration")

        if "supply_chain" in description:
            tactics.append("supply_chain")

        return tactics

    def _enhance_analysis_with_intelligence(self, original_analysis: str, correlations: Dict[str, Any]) -> str:
        """Enhance incident analysis with threat intelligence context."""
        enhancement_parts = [original_analysis]

        # Add IOC matches
        if "ioc_matches" in correlations:
            ioc_count = len(correlations["ioc_matches"])
            enhancement_parts.append(f"THREAT INTELLIGENCE: {ioc_count} IOC matches found")

        # Add APT correlations
        if "apt_correlations" in correlations:
            apt_groups = [match["apt_group"] for match in correlations["apt_correlations"]]
            enhancement_parts.append(f"APT CORRELATION: Potential connection to {', '.join(apt_groups)}")

        # Add malware correlations
        if "malware_correlations" in correlations:
            malware_types = [match["family_type"] for match in correlations["malware_correlations"]]
            enhancement_parts.append(f"MALWARE CORRELATION: Potential {', '.join(malware_types)} activity")

        # Add attack technique information
        if "attack_techniques" in correlations:
            techniques = [match["technique_name"] for match in correlations["attack_techniques"]]
            enhancement_parts.append(f"MITRE ATT&CK: {', '.join(techniques)}")

        return "; ".join(enhancement_parts)

    def get_threat_intelligence(self) -> Dict[str, Any]:
        """Get current threat intelligence data."""
        return self.threat_intelligence.copy()

    def get_ioc_database(self) -> Dict[str, Any]:
        """Get current IOC database."""
        return self.ioc_database.copy()

    def add_custom_ioc(self, ioc_type: str, indicator: str, metadata: Dict[str, Any]):
        """Add a custom IOC to the database."""
        if ioc_type not in self.ioc_database:
            self.ioc_database[ioc_type] = {}

        self.ioc_database[ioc_type][indicator] = metadata
        logger.info(f"Added custom IOC: {ioc_type} - {indicator}")

    def remove_ioc(self, ioc_type: str, indicator: str):
        """Remove an IOC from the database."""
        if ioc_type in self.ioc_database and indicator in self.ioc_database[ioc_type]:
            del self.ioc_database[ioc_type][indicator]
            logger.info(f"Removed IOC: {ioc_type} - {indicator}")

    def get_threat_summary(self) -> Dict[str, Any]:
        """Get a summary of current threat intelligence."""
        return {
            "apt_groups": len(self.threat_intelligence.get("apt_groups", {})),
            "malware_families": sum(
                len(family_list) if isinstance(family_list, list) else 0
                for family_list in self.threat_intelligence.get("malware_families", {}).values()
            ),
            "attack_techniques": len(self.threat_intelligence.get("attack_techniques", {}).get("mitre_att&ck", {})),
            "malicious_ips": len(self.ioc_database.get("malicious_ips", {})),
            "malicious_domains": len(self.ioc_database.get("malicious_domains", {})),
            "file_hashes": len(self.ioc_database.get("file_hashes", {}))
        }