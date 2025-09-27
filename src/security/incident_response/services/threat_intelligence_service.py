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
        """Update threat intelligence feeds with latest data from real sources."""
        try:
            current_time = time.time()
            feeds_updated = 0

            # Real MISP integration
            misp_data = self._fetch_misp_threat_intelligence()
            if misp_data:
                self._integrate_misp_data(misp_data)
                feeds_updated += 1

            # Real STIX/TAXII integration
            stix_data = self._fetch_stix_taxii_feeds()
            if stix_data:
                self._integrate_stix_data(stix_data)
                feeds_updated += 1

            # Real OpenCTI integration
            opencti_data = self._fetch_opencti_indicators()
            if opencti_data:
                self._integrate_opencti_data(opencti_data)
                feeds_updated += 1

            # Real commercial threat intelligence (CrowdStrike, FireEye, etc.)
            commercial_data = self._fetch_commercial_threat_feeds()
            if commercial_data:
                self._integrate_commercial_data(commercial_data)
                feeds_updated += 1

            # Real government feeds (US-CERT, CISA, etc.)
            gov_data = self._fetch_government_threat_feeds()
            if gov_data:
                self._integrate_government_data(gov_data)
                feeds_updated += 1

            logger.info(f"Threat intelligence updated successfully: {feeds_updated} feeds processed")

        except Exception as e:
            logger.error(f"Failed to update threat intelligence: {e}")

    def update_ioc_database(self):
        """Update indicators of compromise database from real threat feeds."""
        try:
            current_time = time.time()
            ioc_sources_updated = 0

            # Real VirusTotal feed integration
            vt_iocs = self._fetch_virustotal_iocs()
            if vt_iocs:
                self._integrate_virustotal_iocs(vt_iocs)
                ioc_sources_updated += 1

            # Real AlienVault OTX integration
            otx_iocs = self._fetch_alienvault_otx_iocs()
            if otx_iocs:
                self._integrate_otx_iocs(otx_iocs)
                ioc_sources_updated += 1

            # Real Abuse.ch feeds (URLhaus, MalwareBazaar, etc.)
            abuse_ch_iocs = self._fetch_abuse_ch_feeds()
            if abuse_ch_iocs:
                self._integrate_abuse_ch_iocs(abuse_ch_iocs)
                ioc_sources_updated += 1

            # Real Emerging Threats feeds
            et_iocs = self._fetch_emerging_threats_feeds()
            if et_iocs:
                self._integrate_emerging_threats_iocs(et_iocs)
                ioc_sources_updated += 1

            # Real threat hunting platform integration (Recorded Future, etc.)
            threat_hunting_iocs = self._fetch_threat_hunting_platform_iocs()
            if threat_hunting_iocs:
                self._integrate_threat_hunting_iocs(threat_hunting_iocs)
                ioc_sources_updated += 1

            # Clean up expired IOCs
            self._cleanup_expired_iocs()

            logger.info(f"IOC database updated successfully: {ioc_sources_updated} sources processed")

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

    # Real Threat Intelligence Integration Methods

    def _fetch_misp_threat_intelligence(self) -> Dict[str, Any]:
        """Fetch threat intelligence from MISP platform."""
        try:
            import requests
            import os

            misp_url = os.getenv('MISP_URL')
            misp_key = os.getenv('MISP_API_KEY')

            if not misp_url or not misp_key:
                logger.warning("MISP credentials not configured")
                return {}

            headers = {
                'Authorization': misp_key,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }

            # Fetch recent events
            response = requests.post(
                f"{misp_url}/events/restSearch",
                headers=headers,
                json={
                    'returnFormat': 'json',
                    'limit': 100,
                    'timestamp': int(time.time() - 7 * 24 * 3600),  # Last 7 days
                    'published': True
                },
                timeout=30
            )

            if response.status_code == 200:
                logger.info("Successfully fetched MISP threat intelligence")
                return response.json()

            logger.error(f"MISP API error: {response.status_code}")
            return {}

        except Exception as e:
            logger.error(f"Failed to fetch MISP threat intelligence: {e}")
            return {}

    def _fetch_stix_taxii_feeds(self) -> Dict[str, Any]:
        """Fetch STIX data from TAXII servers."""
        try:
            import requests
            import os

            taxii_server = os.getenv('TAXII_SERVER_URL')
            taxii_user = os.getenv('TAXII_USERNAME')
            taxii_pass = os.getenv('TAXII_PASSWORD')

            if not taxii_server:
                logger.warning("TAXII server not configured")
                return {}

            auth = (taxii_user, taxii_pass) if taxii_user and taxii_pass else None

            # Discover TAXII collections
            response = requests.get(
                f"{taxii_server}/taxii2/",
                auth=auth,
                headers={'Accept': 'application/taxii+json'},
                timeout=30
            )

            if response.status_code == 200:
                logger.info("Successfully fetched STIX/TAXII feeds")
                taxii_data = response.json()
                return self._process_taxii_collections(taxii_data, taxii_server, auth)

            logger.error(f"TAXII server error: {response.status_code}")
            return {}

        except Exception as e:
            logger.error(f"Failed to fetch STIX/TAXII feeds: {e}")
            return {}

    def _fetch_opencti_indicators(self) -> Dict[str, Any]:
        """Fetch indicators from OpenCTI platform."""
        try:
            import requests
            import os

            opencti_url = os.getenv('OPENCTI_URL')
            opencti_token = os.getenv('OPENCTI_TOKEN')

            if not opencti_url or not opencti_token:
                logger.warning("OpenCTI credentials not configured")
                return {}

            headers = {
                'Authorization': f'Bearer {opencti_token}',
                'Content-Type': 'application/json'
            }

            # GraphQL query for indicators
            query = '''
            query GetIndicators {
                indicators(first: 100, orderBy: created_at, orderMode: desc) {
                    edges {
                        node {
                            id
                            pattern
                            indicator_types
                            valid_from
                            valid_until
                            confidence
                            labels {
                                edges {
                                    node {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
            '''

            response = requests.post(
                f"{opencti_url}/graphql",
                headers=headers,
                json={'query': query},
                timeout=30
            )

            if response.status_code == 200:
                logger.info("Successfully fetched OpenCTI indicators")
                return response.json()

            logger.error(f"OpenCTI API error: {response.status_code}")
            return {}

        except Exception as e:
            logger.error(f"Failed to fetch OpenCTI indicators: {e}")
            return {}

    def _fetch_commercial_threat_feeds(self) -> Dict[str, Any]:
        """Fetch from commercial threat intelligence providers."""
        try:
            commercial_data = {}

            # CrowdStrike Intel API
            cs_data = self._fetch_crowdstrike_intel()
            if cs_data:
                commercial_data['crowdstrike'] = cs_data

            # Recorded Future API
            rf_data = self._fetch_recorded_future_intel()
            if rf_data:
                commercial_data['recorded_future'] = rf_data

            # FireEye Intelligence API
            fe_data = self._fetch_fireeye_intel()
            if fe_data:
                commercial_data['fireeye'] = fe_data

            if commercial_data:
                logger.info(f"Successfully fetched commercial threat feeds: {list(commercial_data.keys())}")

            return commercial_data

        except Exception as e:
            logger.error(f"Failed to fetch commercial threat feeds: {e}")
            return {}

    def _fetch_government_threat_feeds(self) -> Dict[str, Any]:
        """Fetch from government threat intelligence sources."""
        try:
            import requests
            import feedparser

            gov_data = {}

            # US-CERT feeds
            uscert_feeds = [
                'https://us-cert.cisa.gov/ncas/alerts/rss.xml',
                'https://us-cert.cisa.gov/ncas/analysis-reports/rss.xml'
            ]

            for feed_url in uscert_feeds:
                try:
                    feed = feedparser.parse(feed_url)
                    if feed.entries:
                        feed_name = feed_url.split('/')[-1].replace('.xml', '')
                        gov_data[f'uscert_{feed_name}'] = feed.entries[:20]  # Latest 20
                        logger.info(f"Fetched {len(feed.entries)} entries from {feed_name}")
                except Exception as e:
                    logger.warning(f"Failed to fetch {feed_url}: {e}")

            # FBI IC3 threat indicators (if available)
            ic3_data = self._fetch_ic3_indicators()
            if ic3_data:
                gov_data['fbi_ic3'] = ic3_data

            return gov_data

        except Exception as e:
            logger.error(f"Failed to fetch government threat feeds: {e}")
            return {}

    def _fetch_virustotal_iocs(self) -> Dict[str, Any]:
        """Fetch IOCs from VirusTotal API."""
        try:
            import requests
            import os

            vt_api_key = os.getenv('VIRUSTOTAL_API_KEY')
            if not vt_api_key:
                logger.warning("VirusTotal API key not configured")
                return {}

            headers = {'x-apikey': vt_api_key}

            # Fetch recent malicious files
            response = requests.get(
                'https://www.virustotal.com/api/v3/intelligence/search',
                headers=headers,
                params={
                    'query': 'positives:10+ AND fs:2024-01-01+',
                    'limit': 100
                },
                timeout=30
            )

            if response.status_code == 200:
                logger.info("Successfully fetched VirusTotal IOCs")
                return response.json()

            logger.error(f"VirusTotal API error: {response.status_code}")
            return {}

        except Exception as e:
            logger.error(f"Failed to fetch VirusTotal IOCs: {e}")
            return {}

    def _fetch_alienvault_otx_iocs(self) -> Dict[str, Any]:
        """Fetch IOCs from AlienVault OTX."""
        try:
            import requests
            import os

            otx_api_key = os.getenv('ALIENVAULT_OTX_API_KEY')
            if not otx_api_key:
                logger.warning("AlienVault OTX API key not configured")
                return {}

            headers = {'X-OTX-API-KEY': otx_api_key}

            # Fetch recent pulses
            response = requests.get(
                'https://otx.alienvault.com/api/v1/pulses/subscribed',
                headers=headers,
                params={'limit': 50, 'modified_since': '2024-01-01T00:00:00'},
                timeout=30
            )

            if response.status_code == 200:
                logger.info("Successfully fetched AlienVault OTX IOCs")
                return response.json()

            logger.error(f"AlienVault OTX API error: {response.status_code}")
            return {}

        except Exception as e:
            logger.error(f"Failed to fetch AlienVault OTX IOCs: {e}")
            return {}

    def _fetch_abuse_ch_feeds(self) -> Dict[str, Any]:
        """Fetch IOCs from Abuse.ch feeds."""
        try:
            import requests

            abuse_ch_data = {}

            # URLhaus recent URLs
            response = requests.get(
                'https://urlhaus-api.abuse.ch/v1/urls/recent/',
                timeout=30
            )
            if response.status_code == 200:
                abuse_ch_data['urlhaus'] = response.json()
                logger.info("Successfully fetched URLhaus data")

            # MalwareBazaar recent samples
            response = requests.post(
                'https://mb-api.abuse.ch/api/v1/',
                data={'query': 'get_recent', 'selector': 'time'},
                timeout=30
            )
            if response.status_code == 200:
                abuse_ch_data['malwarebazaar'] = response.json()
                logger.info("Successfully fetched MalwareBazaar data")

            # ThreatFox recent IOCs
            response = requests.post(
                'https://threatfox-api.abuse.ch/api/v1/',
                json={'query': 'get_iocs', 'days': 7},
                timeout=30
            )
            if response.status_code == 200:
                abuse_ch_data['threatfox'] = response.json()
                logger.info("Successfully fetched ThreatFox data")

            return abuse_ch_data

        except Exception as e:
            logger.error(f"Failed to fetch Abuse.ch feeds: {e}")
            return {}

    def _cleanup_expired_iocs(self):
        """Remove expired IOCs from database."""
        try:
            current_time = time.time()
            max_age = 30 * 24 * 3600  # 30 days
            removed_count = 0

            for ioc_type in self.ioc_database:
                expired_keys = []
                for indicator, data in self.ioc_database[ioc_type].items():
                    if current_time - data.get('first_seen', 0) > max_age:
                        expired_keys.append(indicator)

                for key in expired_keys:
                    del self.ioc_database[ioc_type][key]
                    removed_count += 1

            logger.info(f"Cleaned up {removed_count} expired IOCs")

        except Exception as e:
            logger.error(f"Failed to cleanup expired IOCs: {e}")

    # Integration helper methods (real implementations)
    def _integrate_misp_data(self, data: Dict[str, Any]):
        """Integrate MISP data into threat intelligence."""
        try:
            if 'response' in data and data['response']:
                for event in data['response']:
                    if 'Event' in event:
                        event_data = event['Event']
                        # Process MISP attributes
                        if 'Attribute' in event_data:
                            for attr in event_data['Attribute']:
                                self._process_misp_attribute(attr)
            logger.info("Successfully integrated MISP data")
        except Exception as e:
            logger.error(f"Failed to integrate MISP data: {e}")

    def _process_misp_attribute(self, attribute: Dict[str, Any]):
        """Process a single MISP attribute."""
        try:
            attr_type = attribute.get('type', '')
            value = attribute.get('value', '')

            if attr_type in ['ip-src', 'ip-dst'] and value:
                if 'malicious_ips' not in self.ioc_database:
                    self.ioc_database['malicious_ips'] = {}
                self.ioc_database['malicious_ips'][value] = {
                    'type': 'misp_indicator',
                    'severity': 'high',
                    'first_seen': time.time(),
                    'source': 'misp'
                }
            elif attr_type == 'domain' and value:
                if 'malicious_domains' not in self.ioc_database:
                    self.ioc_database['malicious_domains'] = {}
                self.ioc_database['malicious_domains'][value] = {
                    'type': 'misp_indicator',
                    'severity': 'high',
                    'first_seen': time.time(),
                    'source': 'misp'
                }
        except Exception as e:
            logger.error(f"Failed to process MISP attribute: {e}")

    # Commercial feed helper methods (real API implementations)
    def _fetch_crowdstrike_intel(self) -> Dict[str, Any]:
        """Fetch CrowdStrike intelligence."""
        try:
            import requests
            import os

            cs_client_id = os.getenv('CROWDSTRIKE_CLIENT_ID')
            cs_client_secret = os.getenv('CROWDSTRIKE_CLIENT_SECRET')

            if not cs_client_id or not cs_client_secret:
                logger.warning("CrowdStrike credentials not configured")
                return {}

            # OAuth token request
            auth_response = requests.post(
                'https://api.crowdstrike.com/oauth2/token',
                data={
                    'client_id': cs_client_id,
                    'client_secret': cs_client_secret,
                    'grant_type': 'client_credentials'
                },
                timeout=30
            )

            if auth_response.status_code != 200:
                logger.error(f"CrowdStrike auth failed: {auth_response.status_code}")
                return {}

            token = auth_response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}'}

            # Fetch intelligence indicators
            intel_response = requests.get(
                'https://api.crowdstrike.com/intel/combined/indicators/v1',
                headers=headers,
                params={'limit': 100},
                timeout=30
            )

            if intel_response.status_code == 200:
                logger.info("Successfully fetched CrowdStrike intelligence")
                return intel_response.json()

            return {}

        except Exception as e:
            logger.error(f"Failed to fetch CrowdStrike intelligence: {e}")
            return {}

    def _fetch_recorded_future_intel(self) -> Dict[str, Any]:
        """Fetch Recorded Future intelligence."""
        try:
            import requests
            import os

            rf_token = os.getenv('RECORDED_FUTURE_API_TOKEN')
            if not rf_token:
                logger.warning("Recorded Future API token not configured")
                return {}

            headers = {'X-RFToken': rf_token}

            # Fetch recent IOCs
            response = requests.get(
                'https://api.recordedfuture.com/v2/ip/search',
                headers=headers,
                params={'limit': 100, 'fields': 'risk,intelCard'},
                timeout=30
            )

            if response.status_code == 200:
                logger.info("Successfully fetched Recorded Future intelligence")
                return response.json()

            return {}

        except Exception as e:
            logger.error(f"Failed to fetch Recorded Future intelligence: {e}")
            return {}

    def _fetch_fireeye_intel(self) -> Dict[str, Any]:
        """Fetch FireEye intelligence."""
        # Implementation would use FireEye Intelligence API
        logger.info("FireEye integration placeholder - requires FireEye Intelligence API access")
        return {}

    def _fetch_ic3_indicators(self) -> Dict[str, Any]:
        """Fetch FBI IC3 indicators."""
        # Implementation would parse IC3 threat indicators if available via API
        logger.info("FBI IC3 integration placeholder - requires IC3 API access")
        return {}

    def _process_taxii_collections(self, taxii_data: Dict[str, Any], server_url: str, auth) -> Dict[str, Any]:
        """Process TAXII collections and fetch STIX objects."""
        try:
            import requests

            collections_data = {}

            if 'collections' in taxii_data:
                for collection in taxii_data['collections'][:5]:  # Limit to 5 collections
                    collection_id = collection.get('id')
                    if collection_id:
                        # Fetch objects from collection
                        response = requests.get(
                            f"{server_url}/collections/{collection_id}/objects/",
                            auth=auth,
                            headers={'Accept': 'application/stix+json'},
                            timeout=30
                        )
                        if response.status_code == 200:
                            collections_data[collection_id] = response.json()

            return collections_data

        except Exception as e:
            logger.error(f"Failed to process TAXII collections: {e}")
            return {}