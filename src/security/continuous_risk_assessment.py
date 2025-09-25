from src.constants.base import API_TIMEOUT_SECONDS, DAYS_RETENTION_PERIOD, MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS

import json
import time
import hashlib
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class RiskLevel(Enum):
    """Risk assessment levels."""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ThreatCategory(Enum):
    """Threat categories for risk assessment."""
    MALWARE = "malware"
    INSIDER_THREAT = "insider_threat"
    ADVANCED_PERSISTENT_THREAT = "apt"
    SUPPLY_CHAIN = "supply_chain"
    SOCIAL_ENGINEERING = "social_engineering"
    CYBER_ESPIONAGE = "cyber_espionage"
    RANSOMWARE = "ransomware"
    DATA_EXFILTRATION = "data_exfiltration"
    SYSTEM_COMPROMISE = "system_compromise"
    DENIAL_OF_SERVICE = "denial_of_service"

class VulnerabilitySource(Enum):
    """Vulnerability information sources."""
    NVD = "nvd"  # National Vulnerability Database
    CISA = "cisa"  # Cybersecurity & Infrastructure Security Agency
    CERT = "cert"  # Computer Emergency Response Team
    VENDOR = "vendor"  # Vendor advisories
    INTERNAL = "internal"  # Internal security scanning
    THREAT_INTEL = "threat_intel"  # Commercial threat intelligence

@dataclass
class ThreatIndicator:
    """Threat indicator data structure."""
    indicator_id: str
    indicator_type: str  # ip, domain, hash, url, etc.
    indicator_value: str
    threat_category: ThreatCategory
    confidence_score: float  # 0.0 to 1.0
    severity: RiskLevel
    first_seen: float
    last_seen: float
    source: str
    context: Dict[str, Any]
    ttl: Optional[float]  # Time to live

@dataclass
class VulnerabilityAssessment:
    """Vulnerability assessment result."""
    vulnerability_id: str
    cve_id: Optional[str]
    title: str
    description: str
    affected_systems: List[str]
    cvss_score: float
    risk_level: RiskLevel
    exploit_available: bool
    patch_available: bool
    discovered_at: float
    source: VulnerabilitySource
    remediation_priority: int
    business_impact: str
    technical_impact: str

@dataclass
class RiskAssessment:
    """Comprehensive risk assessment result."""
    assessment_id: str
    timestamp: float
    overall_risk_score: float
    risk_level: RiskLevel
    threat_landscape: Dict[ThreatCategory, float]
    vulnerability_summary: Dict[str, int]
    asset_risk_scores: Dict[str, float]
    risk_trends: Dict[str, float]
    recommendations: List[str]
    mitigating_controls: List[str]
    residual_risks: List[Dict[str, Any]]

class DFARSContinuousRiskAssessment:
    """
    Comprehensive continuous risk assessment system implementing DFARS
    requirements for ongoing security risk monitoring and threat intelligence.
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize DFARS continuous risk assessment system."""
        self.config = self._load_config(config_path)
        self.threat_indicators: Dict[str, ThreatIndicator] = {}
        self.vulnerabilities: Dict[str, VulnerabilityAssessment] = {}
        self.risk_history: List[RiskAssessment] = []
        self.asset_inventory: Dict[str, Dict[str, Any]] = {}

        # Threat intelligence feeds
        self.threat_feeds: Dict[str, Dict[str, Any]] = {}
        self.feed_last_update: Dict[str, float] = {}

        # Risk calculation components
        self.risk_metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.baseline_metrics: Dict[str, float] = {}

        # Initialize components
        self.audit_manager = DFARSAuditTrailManager(".claude/.artifacts/risk_audit")
        self.incident_response = DFARSIncidentResponseSystem()

        # Initialize storage
        self.storage_path = Path(".claude/.artifacts/risk_assessment")
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Load existing data
        self._load_existing_data()

        # Initialize threat intelligence feeds
        self._initialize_threat_feeds()

        # Start background tasks
        self.active_monitoring = False

        logger.info("DFARS Continuous Risk Assessment System initialized")

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load risk assessment configuration."""
        default_config = {
            "risk_assessment": {
                "continuous_monitoring": True,
                "assessment_interval": 1800,  # 30 minutes
                "threat_intel_update_interval": 3600,  # 1 hour
                "vulnerability_scan_interval": 86400,  # 24 hours
                "risk_thresholds": {
                    "very_low": 0.2,
                    "low": 0.4,
                    "medium": 0.6,
                    "high": 0.8,
                    "critical": 1.0
                },
                "threat_intelligence": {
                    "feeds_enabled": True,
                    "commercial_feeds": [],
                    "government_feeds": ["cisa", "cert"],
                    "internal_feeds": True,
                    "confidence_threshold": 0.7
                },
                "vulnerability_management": {
                    "auto_discovery": True,
                    "cvss_threshold": 4.0,
                    "exploit_prioritization": True,
                    "patch_management_integration": True
                },
                "asset_management": {
                    "auto_discovery": True,
                    "criticality_assessment": True,
                    "dependency_mapping": True
                },
                "alerting": {
                    "high_risk_threshold": 0.7,
                    "critical_risk_threshold": 0.9,
                    "trend_analysis": True,
                    "predictive_alerting": True
                }
            }
        }

        if config_path and path_exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    loaded_config = json.load(f)
                    default_config.update(loaded_config)
            except Exception as e:
                logger.warning(f"Failed to load config from {config_path}: {e}")

        return default_config

    def _load_existing_data(self):
        """Load existing risk assessment data."""
        # Load threat indicators
        indicator_files = self.storage_path.glob("threat_indicators_*.json")
        for indicator_file in indicator_files:
            try:
                with open(indicator_file, 'r') as f:
                    indicators_data = json.load(f)
                    for indicator_data in indicators_data:
                        indicator = ThreatIndicator(
                            indicator_id=indicator_data['indicator_id'],
                            indicator_type=indicator_data['indicator_type'],
                            indicator_value=indicator_data['indicator_value'],
                            threat_category=ThreatCategory(indicator_data['threat_category']),
                            confidence_score=indicator_data['confidence_score'],
                            severity=RiskLevel(indicator_data['severity']),
                            first_seen=indicator_data['first_seen'],
                            last_seen=indicator_data['last_seen'],
                            source=indicator_data['source'],
                            context=indicator_data['context'],
                            ttl=indicator_data.get('ttl')
                        )
                        self.threat_indicators[indicator.indicator_id] = indicator
            except Exception as e:
                logger.error(f"Failed to load threat indicators from {indicator_file}: {e}")

        # Load vulnerabilities
        vuln_files = self.storage_path.glob("vulnerabilities_*.json")
        for vuln_file in vuln_files:
            try:
                with open(vuln_file, 'r') as f:
                    vulns_data = json.load(f)
                    for vuln_data in vulns_data:
                        vulnerability = VulnerabilityAssessment(
                            vulnerability_id=vuln_data['vulnerability_id'],
                            cve_id=vuln_data.get('cve_id'),
                            title=vuln_data['title'],
                            description=vuln_data['description'],
                            affected_systems=vuln_data['affected_systems'],
                            cvss_score=vuln_data['cvss_score'],
                            risk_level=RiskLevel(vuln_data['risk_level']),
                            exploit_available=vuln_data['exploit_available'],
                            patch_available=vuln_data['patch_available'],
                            discovered_at=vuln_data['discovered_at'],
                            source=VulnerabilitySource(vuln_data['source']),
                            remediation_priority=vuln_data['remediation_priority'],
                            business_impact=vuln_data['business_impact'],
                            technical_impact=vuln_data['technical_impact']
                        )
                        self.vulnerabilities[vulnerability.vulnerability_id] = vulnerability
            except Exception as e:
                logger.error(f"Failed to load vulnerabilities from {vuln_file}: {e}")

        logger.info(f"Loaded {len(self.threat_indicators)} threat indicators and {len(self.vulnerabilities)} vulnerabilities")

    def _initialize_threat_feeds(self):
        """Initialize threat intelligence feeds."""
        if not self.config["risk_assessment"]["threat_intelligence"]["feeds_enabled"]:
            return

        # Government feeds
        gov_feeds = self.config["risk_assessment"]["threat_intelligence"]["government_feeds"]
        for feed in gov_feeds:
            self.threat_feeds[feed] = {
                "type": "government",
                "url": self._get_feed_url(feed),
                "api_key": None,  # Government feeds typically don't require API keys
                "last_update": 0,
                "update_interval": 3600,
                "active": True
            }

        # Commercial feeds (would be configured with API keys)
        commercial_feeds = self.config["risk_assessment"]["threat_intelligence"]["commercial_feeds"]
        for feed in commercial_feeds:
            self.threat_feeds[feed] = {
                "type": "commercial",
                "url": self._get_feed_url(feed),
                "api_key": self._get_api_key(feed),
                "last_update": 0,
                "update_interval": 1800,  # More frequent updates for commercial feeds
                "active": True
            }

        # Internal feeds
        if self.config["risk_assessment"]["threat_intelligence"]["internal_feeds"]:
            self.threat_feeds["internal"] = {
                "type": "internal",
                "url": "internal://threat_intelligence",
                "api_key": None,
                "last_update": 0,
                "update_interval": 300,  # 5 minutes for internal feeds
                "active": True
            }

        logger.info(f"Initialized {len(self.threat_feeds)} threat intelligence feeds")

    def _get_feed_url(self, feed_name: str) -> str:
        """Get URL for threat intelligence feed."""
        feed_urls = {
            "cisa": "https://www.cisa.gov/cybersecurity-advisories/json",
            "cert": "https://kb.cert.org/vuls/json",
            "nvd": "https://services.nvd.nist.gov/rest/json/cves/2.0"
        }
        return feed_urls.get(feed_name, "")

    def _get_api_key(self, feed_name: str) -> Optional[str]:
        """Get API key for commercial threat intelligence feed."""
        # In production, this would retrieve API keys from secure storage
        return None

    async def start_continuous_assessment(self):
        """Start continuous risk assessment monitoring."""
        if self.active_monitoring:
            logger.warning("Continuous risk assessment already active")
            return

        self.active_monitoring = True

        # Start monitoring tasks
        assessment_task = asyncio.create_task(self._continuous_assessment_loop())
        threat_intel_task = asyncio.create_task(self._threat_intelligence_loop())
        vuln_scan_task = asyncio.create_task(self._vulnerability_scanning_loop())
        asset_discovery_task = asyncio.create_task(self._asset_discovery_loop())

        logger.info("Started continuous risk assessment monitoring")

    async def _continuous_assessment_loop(self):
        """Main continuous risk assessment loop."""
        assessment_interval = self.config["risk_assessment"]["assessment_interval"]

        while self.active_monitoring:
            try:
                # Perform comprehensive risk assessment
                risk_assessment = await self.perform_comprehensive_assessment()

                # Check for high-risk conditions
                if risk_assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                    await self._handle_high_risk_condition(risk_assessment)

                # Update risk trends
                self._update_risk_trends(risk_assessment)

                # Generate alerts based on risk changes
                await self._generate_risk_alerts(risk_assessment)

                await asyncio.sleep(assessment_interval)

            except Exception as e:
                logger.error(f"Continuous assessment error: {e}")
                await asyncio.sleep(assessment_interval * 2)

    async def _threat_intelligence_loop(self):
        """Threat intelligence update loop."""
        update_interval = self.config["risk_assessment"]["threat_intel_update_interval"]

        while self.active_monitoring:
            try:
                # Update threat intelligence feeds
                await self._update_threat_intelligence()

                # Process new threat indicators
                await self._process_threat_indicators()

                await asyncio.sleep(update_interval)

            except Exception as e:
                logger.error(f"Threat intelligence update error: {e}")
                await asyncio.sleep(update_interval * 2)

    async def _vulnerability_scanning_loop(self):
        """Vulnerability scanning loop."""
        scan_interval = self.config["risk_assessment"]["vulnerability_scan_interval"]

        while self.active_monitoring:
            try:
                # Perform vulnerability scanning
                await self._perform_vulnerability_scan()

                # Analyze new vulnerabilities
                await self._analyze_new_vulnerabilities()

                await asyncio.sleep(scan_interval)

            except Exception as e:
                logger.error(f"Vulnerability scanning error: {e}")
                await asyncio.sleep(scan_interval * 2)

    async def _asset_discovery_loop(self):
        """Asset discovery and inventory loop."""
        discovery_interval = 21600  # 6 hours

        while self.active_monitoring:
            try:
                # Discover and update asset inventory
                await self._discover_assets()

                # Update asset risk profiles
                await self._update_asset_risk_profiles()

                await asyncio.sleep(discovery_interval)

            except Exception as e:
                logger.error(f"Asset discovery error: {e}")
                await asyncio.sleep(discovery_interval * 2)

    async def _update_threat_intelligence(self):
        """Update threat intelligence from all configured feeds."""
        tasks = []

        for feed_name, feed_config in self.threat_feeds.items():
            if feed_config["active"]:
                # Check if update is needed
                last_update = self.feed_last_update.get(feed_name, 0)
                if time.time() - last_update >= feed_config["update_interval"]:
                    tasks.append(self._update_single_threat_feed(feed_name, feed_config))

        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            successful_updates = sum(1 for r in results if not isinstance(r, Exception))
            logger.info(f"Updated {successful_updates}/{len(tasks)} threat intelligence feeds")

    async def _update_single_threat_feed(self, feed_name: str, feed_config: Dict[str, Any]):
        """Update single threat intelligence feed."""
        try:
            if feed_name == "internal":
                # Process internal threat intelligence
                indicators = await self._get_internal_threat_indicators()
            else:
                # Process external threat intelligence feeds
                indicators = await self._fetch_external_threat_feed(feed_name, feed_config)

            # Process and store indicators
            for indicator_data in indicators:
                indicator = self._create_threat_indicator(indicator_data, feed_name)
                if indicator:
                    self.threat_indicators[indicator.indicator_id] = indicator

            self.feed_last_update[feed_name] = time.time()
            logger.info(f"Updated threat feed {feed_name}: {len(indicators)} indicators")

        except Exception as e:
            logger.error(f"Failed to update threat feed {feed_name}: {e}")
            raise

    async def _get_internal_threat_indicators(self) -> List[Dict[str, Any]]:
        """Get internal threat indicators from security systems."""
        # Simulate internal threat indicator collection
        indicators = []

        # Example: Collect indicators from log analysis
        suspicious_ips = await self._analyze_security_logs_for_indicators()
        for ip in suspicious_ips:
            indicators.append({
                "type": "ip",
                "value": ip,
                "category": "malware",
                "confidence": 0.8,
                "severity": "medium",
                "context": {"source": "log_analysis", "detection_count": 5}
            })

        return indicators

    async def _analyze_security_logs_for_indicators(self) -> List[str]:
        """Analyze security logs for threat indicators."""
        # Simulate security log analysis
        return ["192.168.1.100", "10.0.0.50"]

    async def _fetch_external_threat_feed(self, feed_name: str, feed_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch threat intelligence from external feed."""
        # Simulate external feed fetching

        if feed_name == "cisa":
            return await self._fetch_cisa_advisories()
        elif feed_name == "cert":
            return await self._fetch_cert_advisories()
        elif feed_name == "nvd":
            return await self._fetch_nvd_vulnerabilities()

        return []

    async def _fetch_cisa_advisories(self) -> List[Dict[str, Any]]:
        """Fetch CISA cybersecurity advisories."""
        # Simulate CISA advisory fetching
        return [
            {
                "type": "domain",
                "value": "malicious-example.com",
                "category": "malware",
                "confidence": 0.9,
                "severity": "high",
                "context": {"advisory_id": "CISA-2024-001", "description": "Malicious domain hosting malware"}
            }
        ]

    async def _fetch_cert_advisories(self) -> List[Dict[str, Any]]:
        """Fetch CERT advisories."""
        return []

    async def _fetch_nvd_vulnerabilities(self) -> List[Dict[str, Any]]:
        """Fetch NVD vulnerability data."""
        return []

    def _create_threat_indicator(self, indicator_data: Dict[str, Any], source: str) -> Optional[ThreatIndicator]:
        """Create threat indicator from raw data."""
        try:
            indicator_id = hashlib.sha256(
                f"{indicator_data['type']}:{indicator_data['value']}:{source}".encode()
            ).hexdigest()[:16]

            return ThreatIndicator(
                indicator_id=indicator_id,
                indicator_type=indicator_data["type"],
                indicator_value=indicator_data["value"],
                threat_category=ThreatCategory(indicator_data["category"]),
                confidence_score=indicator_data["confidence"],
                severity=RiskLevel(indicator_data["severity"]),
                first_seen=time.time(),
                last_seen=time.time(),
                source=source,
                context=indicator_data.get("context", {}),
                ttl=indicator_data.get("ttl")
            )

        except Exception as e:
            logger.error(f"Failed to create threat indicator: {e}")
            return None

    async def _process_threat_indicators(self):
        """Process and analyze threat indicators for risk implications."""
        new_indicators = [
            indicator for indicator in self.threat_indicators.values()
            if time.time() - indicator.first_seen < 3600  # Last hour
        ]

        if not new_indicators:
            return

        # Analyze indicators for potential threats to organization
        for indicator in new_indicators:
            await self._analyze_threat_indicator(indicator)

        # Check for indicator clusters or campaigns
        await self._detect_threat_campaigns(new_indicators)

        logger.info(f"Processed {len(new_indicators)} new threat indicators")

    async def _analyze_threat_indicator(self, indicator: ThreatIndicator):
        """Analyze individual threat indicator for organizational risk."""
        # Check if indicator matches organizational assets or traffic
        matches = await self._check_indicator_matches(indicator)

        if matches:
            # Create security incident for matches
            await self.incident_response.create_incident(
                title=f"Threat Indicator Match: {indicator.indicator_value}",
                description=f"Threat indicator {indicator.indicator_value} matched organizational assets",
                severity=IncidentSeverity.HIGH if indicator.severity == RiskLevel.CRITICAL else IncidentSeverity.MEDIUM,
                category=IncidentCategory.SYSTEM_COMPROMISE,
                source_system="threat_intelligence",
                affected_systems=matches,
                indicators={
                    "indicator_id": indicator.indicator_id,
                    "indicator_type": indicator.indicator_type,
                    "indicator_value": indicator.indicator_value,
                    "threat_category": indicator.threat_category.value,
                    "confidence_score": indicator.confidence_score
                }
            )

    async def _check_indicator_matches(self, indicator: ThreatIndicator) -> List[str]:
        """Check if threat indicator matches organizational assets."""
        matches = []

        # Simulate checking indicator against organizational assets

        if indicator.indicator_type == "ip":
            # Check against network logs for IP connections
            if await self._check_ip_in_network_logs(indicator.indicator_value):
                matches.append("network_infrastructure")

        elif indicator.indicator_type == "domain":
            # Check against DNS queries
            if await self._check_domain_in_dns_logs(indicator.indicator_value):
                matches.append("dns_infrastructure")

        elif indicator.indicator_type == "hash":
            # Check against file systems
            if await self._check_hash_in_file_systems(indicator.indicator_value):
                matches.append("file_systems")

        return matches

    async def _check_ip_in_network_logs(self, ip_address: str) -> bool:
        """Check if IP address appears in network logs."""
        # Simulate network log checking
        return False

    async def _check_domain_in_dns_logs(self, domain: str) -> bool:
        """Check if domain appears in DNS query logs."""
        # Simulate DNS log checking
        return False

    async def _check_hash_in_file_systems(self, file_hash: str) -> bool:
        """Check if file hash exists in file systems."""
        # Simulate file system hash checking
        return False

    async def _detect_threat_campaigns(self, indicators: List[ThreatIndicator]):
        """Detect coordinated threat campaigns from indicator patterns."""
        # Group indicators by source and time window
        campaign_threshold = MAXIMUM_NESTED_DEPTH  # Minimum indicators for campaign detection
        time_window = 3600  # 1 hour window

        # Group by threat category and time
        campaigns = defaultdict(list)

        for indicator in indicators:
            campaign_key = f"{indicator.threat_category.value}_{int(indicator.first_seen // time_window)}"
            campaigns[campaign_key].append(indicator)

        # Detect campaigns with sufficient indicators
        for campaign_key, campaign_indicators in campaigns.items():
            if len(campaign_indicators) >= campaign_threshold:
                await self._create_campaign_incident(campaign_key, campaign_indicators)

    async def _create_campaign_incident(self, campaign_key: str, indicators: List[ThreatIndicator]):
        """Create incident for detected threat campaign."""
        threat_category = indicators[0].threat_category

        await self.incident_response.create_incident(
            title=f"Threat Campaign Detected: {threat_category.value.title()}",
            description=f"Detected coordinated threat campaign with {len(indicators)} indicators",
            severity=IncidentSeverity.HIGH,
            category=IncidentCategory.ADVANCED_PERSISTENT_THREAT,
            source_system="threat_intelligence_analysis",
            affected_systems=["threat_intelligence_system"],
            indicators={
                "campaign_key": campaign_key,
                "indicator_count": len(indicators),
                "threat_category": threat_category.value,
                "indicators": [indicator.indicator_id for indicator in indicators]
            }
        )

    async def _perform_vulnerability_scan(self):
        """Perform comprehensive vulnerability scanning."""
        # Simulate vulnerability scanning

        discovered_vulnerabilities = await self._run_vulnerability_scanners()

        for vuln_data in discovered_vulnerabilities:
            vulnerability = self._create_vulnerability_assessment(vuln_data)
            if vulnerability:
                self.vulnerabilities[vulnerability.vulnerability_id] = vulnerability

    async def _run_vulnerability_scanners(self) -> List[Dict[str, Any]]:
        """Run vulnerability scanners on organizational assets."""
        # Simulate vulnerability scanner results
        return [
            {
                "cve_id": "CVE-2024-0001",
                "title": "Example Vulnerability",
                "description": "Example vulnerability for testing",
                "affected_systems": ["web_server", "application_server"],
                "cvss_score": 7.5,
                "exploit_available": False,
                "patch_available": True,
                "source": "internal"
            }
        ]

    def _create_vulnerability_assessment(self, vuln_data: Dict[str, Any]) -> Optional[VulnerabilityAssessment]:
        """Create vulnerability assessment from scan data."""
        try:
            vulnerability_id = vuln_data.get("cve_id", f"VULN-{int(time.time())}")

            # Determine risk level based on CVSS score
            cvss_score = vuln_data["cvss_score"]
            if cvss_score >= 9.0:
                risk_level = RiskLevel.CRITICAL
                remediation_priority = 1
            elif cvss_score >= 7.0:
                risk_level = RiskLevel.HIGH
                remediation_priority = 2
            elif cvss_score >= 4.0:
                risk_level = RiskLevel.MEDIUM
                remediation_priority = 3
            else:
                risk_level = RiskLevel.LOW
                remediation_priority = 4

            return VulnerabilityAssessment(
                vulnerability_id=vulnerability_id,
                cve_id=vuln_data.get("cve_id"),
                title=vuln_data["title"],
                description=vuln_data["description"],
                affected_systems=vuln_data["affected_systems"],
                cvss_score=cvss_score,
                risk_level=risk_level,
                exploit_available=vuln_data["exploit_available"],
                patch_available=vuln_data["patch_available"],
                discovered_at=time.time(),
                source=VulnerabilitySource(vuln_data["source"]),
                remediation_priority=remediation_priority,
                business_impact=self._assess_business_impact(vuln_data["affected_systems"], cvss_score),
                technical_impact=self._assess_technical_impact(cvss_score, vuln_data["exploit_available"])
            )

        except Exception as e:
            logger.error(f"Failed to create vulnerability assessment: {e}")
            return None

    def _assess_business_impact(self, affected_systems: List[str], cvss_score: float) -> str:
        """Assess business impact of vulnerability."""
        # Simplified business impact assessment
        critical_systems = ["database", "authentication", "payment"]

        has_critical_system = any(sys in affected_systems[0] for sys in critical_systems)

        if cvss_score >= 7.0 and has_critical_system:
            return "High - Critical systems affected with significant vulnerability"
        elif cvss_score >= 7.0 or has_critical_system:
            return "Medium - Either high CVSS score or critical system affected"
        else:
            return "Low - Limited business impact expected"

    def _assess_technical_impact(self, cvss_score: float, exploit_available: bool) -> str:
        """Assess technical impact of vulnerability."""
        if cvss_score >= 9.0:
            impact = "Critical technical impact"
        elif cvss_score >= DAYS_RETENTION_PERIOD.0:
            impact = "High technical impact"
        elif cvss_score >= 4.0:
            impact = "Medium technical impact"
        else:
            impact = "Low technical impact"

        if exploit_available:
            impact += " with available exploit"

        return impact

    async def _analyze_new_vulnerabilities(self):
        """Analyze newly discovered vulnerabilities."""
        new_vulnerabilities = [
            vuln for vuln in self.vulnerabilities.values()
            if time.time() - vuln.discovered_at < 3600  # Last hour
        ]

        for vulnerability in new_vulnerabilities:
            # Create incident for critical vulnerabilities
            if vulnerability.risk_level == RiskLevel.CRITICAL:
                await self.incident_response.create_incident(
                    title=f"Critical Vulnerability: {vulnerability.title}",
                    description=f"Critical vulnerability discovered: {vulnerability.description}",
                    severity=IncidentSeverity.CRITICAL,
                    category=IncidentCategory.SYSTEM_COMPROMISE,
                    source_system="vulnerability_scanner",
                    affected_systems=vulnerability.affected_systems,
                    indicators={
                        "vulnerability_id": vulnerability.vulnerability_id,
                        "cve_id": vulnerability.cve_id,
                        "cvss_score": vulnerability.cvss_score,
                        "exploit_available": vulnerability.exploit_available,
                        "patch_available": vulnerability.patch_available
                    }
                )

    async def _discover_assets(self):
        """Discover and inventory organizational assets."""
        # Simulate asset discovery

        discovered_assets = await self._run_asset_discovery()

        for asset_data in discovered_assets:
            asset_id = asset_data["asset_id"]
            self.asset_inventory[asset_id] = asset_data

    async def _run_asset_discovery(self) -> List[Dict[str, Any]]:
        """Run asset discovery tools."""
        # Simulate asset discovery results
        return [
            {
                "asset_id": "web_server_001",
                "asset_type": "web_server",
                "ip_address": "192.168.1.10",
                "hostname": "web01.internal",
                "os": "Ubuntu 22.04",
                "criticality": "high",
                "services": ["http", "https", "ssh"],
                "last_scan": time.time()
            }
        ]

    async def _update_asset_risk_profiles(self):
        """Update risk profiles for discovered assets."""
        for asset_id, asset_data in self.asset_inventory.items():
            risk_score = await self._calculate_asset_risk_score(asset_data)
            asset_data["risk_score"] = risk_score
            asset_data["risk_updated"] = time.time()

    async def _calculate_asset_risk_score(self, asset_data: Dict[str, Any]) -> float:
        """Calculate risk score for individual asset."""
        base_score = 0.0

        # Criticality factor
        criticality_scores = {"low": 0.2, "medium": 0.5, "high": 0.8, "critical": 1.0}
        base_score += criticality_scores.get(asset_data.get("criticality", "medium"), 0.5) * 0.3

        # Vulnerability factor
        asset_vulns = [
            vuln for vuln in self.vulnerabilities.values()
            if asset_data["asset_id"] in vuln.affected_systems
        ]
        if asset_vulns:
            avg_cvss = sum(vuln.cvss_score for vuln in asset_vulns) / len(asset_vulns)
            base_score += (avg_cvss / 10.0) * 0.4

        # Threat exposure factor
        exposed_services = len(asset_data.get("services", []))
        base_score += min(exposed_services * 0.1, 0.3) * 0.3

        return min(base_score, 1.0)

    async def perform_comprehensive_assessment(self) -> RiskAssessment:
        """Perform comprehensive risk assessment."""
        assessment_id = f"assessment_{int(time.time())}"
        timestamp = time.time()

        # Calculate threat landscape
        threat_landscape = self._calculate_threat_landscape()

        # Calculate vulnerability summary
        vulnerability_summary = self._calculate_vulnerability_summary()

        # Calculate asset risk scores
        asset_risk_scores = {
            asset_id: asset_data.get("risk_score", 0.5)
            for asset_id, asset_data in self.asset_inventory.items()
        }

        # Calculate overall risk score
        overall_risk_score = self._calculate_overall_risk_score(
            threat_landscape, vulnerability_summary, asset_risk_scores
        )

        # Determine risk level
        risk_level = self._determine_risk_level(overall_risk_score)

        # Calculate risk trends
        risk_trends = self._calculate_risk_trends()

        # Generate recommendations
        recommendations = self._generate_risk_recommendations(
            threat_landscape, vulnerability_summary, asset_risk_scores
        )

        # Identify mitigating controls
        mitigating_controls = self._identify_mitigating_controls()

        # Calculate residual risks
        residual_risks = self._calculate_residual_risks(
            threat_landscape, vulnerability_summary, mitigating_controls
        )

        risk_assessment = RiskAssessment(
            assessment_id=assessment_id,
            timestamp=timestamp,
            overall_risk_score=overall_risk_score,
            risk_level=risk_level,
            threat_landscape=threat_landscape,
            vulnerability_summary=vulnerability_summary,
            asset_risk_scores=asset_risk_scores,
            risk_trends=risk_trends,
            recommendations=recommendations,
            mitigating_controls=mitigating_controls,
            residual_risks=residual_risks
        )

        # Store assessment
        self.risk_history.append(risk_assessment)
        self._persist_risk_assessment(risk_assessment)

        # Log assessment
        self.audit_manager.log_compliance_check(
            check_type="comprehensive_risk_assessment",
            result="SUCCESS",
            details={
                "assessment_id": assessment_id,
                "overall_risk_score": overall_risk_score,
                "risk_level": risk_level.value,
                "threat_indicators": len(self.threat_indicators),
                "vulnerabilities": len(self.vulnerabilities)
            }
        )

        logger.info(f"Completed comprehensive risk assessment: {assessment_id} (Risk: {risk_level.value})")
        return risk_assessment

    def _calculate_threat_landscape(self) -> Dict[ThreatCategory, float]:
        """Calculate current threat landscape."""
        threat_scores = {}

        for category in ThreatCategory:
            category_indicators = [
                indicator for indicator in self.threat_indicators.values()
                if indicator.threat_category == category
            ]

            if category_indicators:
                # Calculate weighted average based on confidence and recency
                total_score = 0.0
                total_weight = 0.0

                current_time = time.time()
                for indicator in category_indicators:
                    age_factor = max(0.1, 1.0 - ((current_time - indicator.last_seen) / 86400))  # Decay over 24 hours
                    weight = indicator.confidence_score * age_factor

                    severity_scores = {
                        RiskLevel.VERY_LOW: 0.1, RiskLevel.LOW: 0.3,
                        RiskLevel.MEDIUM: 0.5, RiskLevel.HIGH: 0.8,
                        RiskLevel.CRITICAL: 1.0
                    }

                    score = severity_scores.get(indicator.severity, 0.5)
                    total_score += score * weight
                    total_weight += weight

                threat_scores[category] = total_score / total_weight if total_weight > 0 else 0.0
            else:
                threat_scores[category] = 0.0

        return threat_scores

    def _calculate_vulnerability_summary(self) -> Dict[str, int]:
        """Calculate vulnerability summary statistics."""
        summary = {
            "total": len(self.vulnerabilities),
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "with_exploits": 0,
            "patchable": 0
        }

        for vulnerability in self.vulnerabilities.values():
            if vulnerability.risk_level == RiskLevel.CRITICAL:
                summary["critical"] += 1
            elif vulnerability.risk_level == RiskLevel.HIGH:
                summary["high"] += 1
            elif vulnerability.risk_level == RiskLevel.MEDIUM:
                summary["medium"] += 1
            else:
                summary["low"] += 1

            if vulnerability.exploit_available:
                summary["with_exploits"] += 1

            if vulnerability.patch_available:
                summary["patchable"] += 1

        return summary

    def _calculate_overall_risk_score(self, threat_landscape: Dict[ThreatCategory, float],
                                    vulnerability_summary: Dict[str, int],
                                    asset_risk_scores: Dict[str, float]) -> float:
        """Calculate overall organizational risk score."""
        # Threat landscape component (API_TIMEOUT_SECONDS% weight)
        threat_score = sum(threat_landscape.values()) / len(threat_landscape) if threat_landscape else 0.0
        threat_component = threat_score * 0.3

        # Vulnerability component (40% weight)
        total_vulns = vulnerability_summary["total"]
        if total_vulns > 0:
            critical_weight = vulnerability_summary["critical"] * 1.0
            high_weight = vulnerability_summary["high"] * 0.8
            medium_weight = vulnerability_summary["medium"] * 0.5
            low_weight = vulnerability_summary["low"] * 0.2

            vuln_score = (critical_weight + high_weight + medium_weight + low_weight) / total_vulns
        else:
            vuln_score = 0.0

        vuln_component = vuln_score * 0.4

        # Asset risk component (API_TIMEOUT_SECONDS% weight)
        asset_score = sum(asset_risk_scores.values()) / len(asset_risk_scores) if asset_risk_scores else 0.0
        asset_component = asset_score * 0.2

        overall_score = threat_component + vuln_component + asset_component
        return min(overall_score, 1.0)

    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """Determine risk level from overall risk score."""
        thresholds = self.config["risk_assessment"]["risk_thresholds"]

        if risk_score >= thresholds["critical"]:
            return RiskLevel.CRITICAL
        elif risk_score >= thresholds["high"]:
            return RiskLevel.HIGH
        elif risk_score >= thresholds["medium"]:
            return RiskLevel.MEDIUM
        elif risk_score >= thresholds["low"]:
            return RiskLevel.LOW
        else:
            return RiskLevel.VERY_LOW

    def _calculate_risk_trends(self) -> Dict[str, float]:
        """Calculate risk trends over time."""
        trends = {}

        if len(self.risk_history) >= 2:
            current_assessment = self.risk_history[-1]
            previous_assessment = self.risk_history[-2]

            # Overall risk trend
            trends["overall_risk"] = (
                current_assessment.overall_risk_score - previous_assessment.overall_risk_score
            )

            # Threat landscape trends
            for category in ThreatCategory:
                current_score = current_assessment.threat_landscape.get(category, 0.0)
                previous_score = previous_assessment.threat_landscape.get(category, 0.0)
                trends[f"threat_{category.value}"] = current_score - previous_score

        return trends

    def _generate_risk_recommendations(self, threat_landscape: Dict[ThreatCategory, float],
                                    vulnerability_summary: Dict[str, int],
                                    asset_risk_scores: Dict[str, float]) -> List[str]:
        """Generate risk mitigation recommendations."""
        recommendations = []

        # Threat-based recommendations
        high_threat_categories = [
            category for category, score in threat_landscape.items()
            if score >= 0.7
        ]

        for category in high_threat_categories:
            if category == ThreatCategory.MALWARE:
                recommendations.append("Enhance malware protection and endpoint detection capabilities")
            elif category == ThreatCategory.ADVANCED_PERSISTENT_THREAT:
                recommendations.append("Implement advanced threat hunting and behavioral analysis")
            elif category == ThreatCategory.INSIDER_THREAT:
                recommendations.append("Strengthen insider threat monitoring and access controls")

        # Vulnerability-based recommendations
        if vulnerability_summary["critical"] > 0:
            recommendations.append(f"Immediately patch {vulnerability_summary['critical']} critical vulnerabilities")

        if vulnerability_summary["with_exploits"] > 0:
            recommendations.append("Prioritize patching vulnerabilities with available exploits")

        # Asset-based recommendations
        high_risk_assets = [
            asset_id for asset_id, risk_score in asset_risk_scores.items()
            if risk_score >= 0.8
        ]

        if high_risk_assets:
            recommendations.append(f"Review security controls for {len(high_risk_assets)} high-risk assets")

        return recommendations

    def _identify_mitigating_controls(self) -> List[str]:
        """Identify current mitigating security controls."""
        # This would integrate with security control inventory in production
        return [
            "Multi-factor authentication",
            "Network segmentation",
            "Endpoint detection and response",
            "Security awareness training",
            "Incident response plan",
            "Regular vulnerability scanning",
            "Log monitoring and SIEM"
        ]

    def _calculate_residual_risks(self, threat_landscape: Dict[ThreatCategory, float],
                                vulnerability_summary: Dict[str, int],
                                mitigating_controls: List[str]) -> List[Dict[str, Any]]:
        """Calculate residual risks after considering mitigating controls."""
        residual_risks = []

        # Calculate control effectiveness (simplified)
        control_coverage = len(mitigating_controls) / 10.0  # Assume 10 is full coverage
        control_effectiveness = min(control_coverage, 0.9)  # Max 90% effectiveness

        # Calculate residual risk for each threat category
        for category, risk_score in threat_landscape.items():
            residual_score = risk_score * (1.0 - control_effectiveness)

            if residual_score >= 0.3:  # Only include significant residual risks
                residual_risks.append({
                    "category": category.value,
                    "residual_score": residual_score,
                    "original_score": risk_score,
                    "control_effectiveness": control_effectiveness,
                    "description": f"Residual {category.value} risk after controls"
                })

        return residual_risks

    def _persist_risk_assessment(self, assessment: RiskAssessment):
        """Persist risk assessment to storage."""
        assessment_file = self.storage_path / f"assessment_{assessment.assessment_id}.json"

        with open(assessment_file, 'w') as f:
            assessment_dict = asdict(assessment)
            assessment_dict['risk_level'] = assessment.risk_level.value

            # Convert ThreatCategory keys to strings for JSON serialization
            assessment_dict['threat_landscape'] = {
                category.value: score for category, score in assessment.threat_landscape.items()
            }

            json.dump(assessment_dict, f, indent=2)

    async def _handle_high_risk_condition(self, risk_assessment: RiskAssessment):
        """Handle high-risk conditions detected during assessment."""
        # Create incident for high/critical risk conditions
        await self.incident_response.create_incident(
            title=f"High Risk Condition Detected",
            description=f"Risk assessment shows {risk_assessment.risk_level.value} overall risk",
            severity=IncidentSeverity.CRITICAL if risk_assessment.risk_level == RiskLevel.CRITICAL else IncidentSeverity.HIGH,
            category=IncidentCategory.SYSTEM_COMPROMISE,
            source_system="risk_assessment",
            affected_systems=list(risk_assessment.asset_risk_scores.keys()),
            indicators={
                "assessment_id": risk_assessment.assessment_id,
                "overall_risk_score": risk_assessment.overall_risk_score,
                "risk_level": risk_assessment.risk_level.value,
                "top_threats": [
                    category.value for category, score in risk_assessment.threat_landscape.items()
                    if score >= 0.7
                ]
            }
        )

    def _update_risk_trends(self, risk_assessment: RiskAssessment):
        """Update risk trend metrics."""
        # Update risk metrics time series
        self.risk_metrics["overall_risk"].append(risk_assessment.overall_risk_score)

        for category, score in risk_assessment.threat_landscape.items():
            self.risk_metrics[f"threat_{category.value}"].append(score)

        # Update baseline metrics (30-day rolling average)
        if len(self.risk_metrics["overall_risk"]) >= 30:
            self.baseline_metrics["overall_risk"] = np.mean(list(self.risk_metrics["overall_risk"]))

    async def _generate_risk_alerts(self, risk_assessment: RiskAssessment):
        """Generate risk-based alerts and notifications."""
        alert_config = self.config["risk_assessment"]["alerting"]

        # High risk threshold alert
        if (risk_assessment.overall_risk_score >= alert_config["high_risk_threshold"] and
            risk_assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]):

            await self._send_risk_alert(
                alert_type="high_risk_detected",
                risk_assessment=risk_assessment,
                message=f"High risk condition detected: {risk_assessment.risk_level.value}"
            )

        # Trend-based alerts
        if alert_config["trend_analysis"] and risk_assessment.risk_trends:
            significant_increases = [
                trend for trend, change in risk_assessment.risk_trends.items()
                if change >= 0.2  # 20% increase
            ]

            if significant_increases:
                await self._send_risk_alert(
                    alert_type="risk_trend_increase",
                    risk_assessment=risk_assessment,
                    message=f"Significant risk increases detected in: {', '.join(significant_increases)}"
                )

    async def _send_risk_alert(self, alert_type: str, risk_assessment: RiskAssessment, message: str):
        """Send risk alert notification."""
        # Log alert
        self.audit_manager.log_security_event(
            event_type=AuditEventType.SECURITY_ALERT,
            severity=SeverityLevel.HIGH,
            description=f"Risk alert: {alert_type}",
            details={
                "alert_type": alert_type,
                "assessment_id": risk_assessment.assessment_id,
                "message": message,
                "risk_level": risk_assessment.risk_level.value
            }
        )

        logger.warning(f"Risk alert: {message}")

    def stop_continuous_assessment(self):
        """Stop continuous risk assessment monitoring."""
        self.active_monitoring = False
        logger.info("Stopped continuous risk assessment monitoring")

    def get_risk_dashboard_data(self) -> Dict[str, Any]:
        """Get data for risk assessment dashboard."""
        latest_assessment = self.risk_history[-1] if self.risk_history else None

        if not latest_assessment:
            return {"error": "No risk assessments available"}

        return {
            "current_risk": {
                "overall_score": latest_assessment.overall_risk_score,
                "risk_level": latest_assessment.risk_level.value,
                "assessment_time": latest_assessment.timestamp
            },
            "threat_landscape": {
                category.value: score
                for category, score in latest_assessment.threat_landscape.items()
            },
            "vulnerability_summary": latest_assessment.vulnerability_summary,
            "asset_summary": {
                "total_assets": len(latest_assessment.asset_risk_scores),
                "high_risk_assets": len([
                    score for score in latest_assessment.asset_risk_scores.values()
                    if score >= 0.8
                ]),
                "average_risk": (
                    sum(latest_assessment.asset_risk_scores.values()) /
                    len(latest_assessment.asset_risk_scores)
                ) if latest_assessment.asset_risk_scores else 0.0
            },
            "trends": latest_assessment.risk_trends,
            "recommendations": latest_assessment.recommendations[:5],  # Top 5
            "residual_risks": len(latest_assessment.residual_risks),
            "threat_indicators": {
                "total": len(self.threat_indicators),
                "high_confidence": len([
                    ind for ind in self.threat_indicators.values()
                    if ind.confidence_score >= 0.8
                ]),
                "recent": len([
                    ind for ind in self.threat_indicators.values()
                    if time.time() - ind.last_seen < 86400
                ])
            }
        }

# Factory function
def create_continuous_risk_assessment(config_path: Optional[str] = None) -> DFARSContinuousRiskAssessment:
    """Create DFARS continuous risk assessment system."""
    return DFARSContinuousRiskAssessment(config_path)

# Example usage
if __name__ == "__main__":
    async def main():
        # Initialize risk assessment system
        risk_system = create_continuous_risk_assessment()

        print("DFARS Continuous Risk Assessment System")
        print("=" * 45)

        # Perform comprehensive assessment
        assessment = await risk_system.perform_comprehensive_assessment()

        print(f"Assessment ID: {assessment.assessment_id}")
        print(f"Overall Risk: {assessment.risk_level.value} ({assessment.overall_risk_score:.2f})")
        print(f"Top Recommendations:")
        for i, rec in enumerate(assessment.recommendations[:3], 1):
            print(f"  {i}. {rec}")

        # Get dashboard data
        dashboard = risk_system.get_risk_dashboard_data()
        print(f"\nThreat Indicators: {dashboard['threat_indicators']['total']}")
        print(f"High-Risk Assets: {dashboard['asset_summary']['high_risk_assets']}")

        return risk_system

    # Run example
    asyncio.run(main())