"""
NIST Secure Software Development Framework (SSDF) v1.1 Practice Alignment and Evidence System (CE-003)

Implements comprehensive NIST-SSDF practice validation across all practice groups:
- PO: Prepare the Organization (PO.1-PO.5)
- PS: Protect the Software (PS.1-PS.3)  
- PW: Produce Well-Secured Software (PW.1-PW.9)
- RV: Respond to Vulnerabilities (RV.1-RV.3)

Evidence collection includes implementation tier assessment (1-4) and practice maturity evaluation.
Aligns with NIST SP 800-218 for secure software development lifecycle integration.
"""

import asyncio
import json
import logging
logger = logging.getLogger(__name__)
        self.assessments: List[PracticeAssessment] = []
        
        # NIST-SSDF practice catalog
        self.ssdf_practices = self._initialize_ssdf_practices()
        
    def _initialize_ssdf_practices(self) -> Dict[str, NISTSSDFPractice]:
        """Initialize NIST-SSDF v1.1 practice catalog"""
        practices = {}
        
        # PO: Prepare the Organization
        po_practices = [
            NISTSSDFPractice(
                "PO.1.1", "PO", "Identify and Document Software Security Requirements",
                "Define the security requirements for the software to be developed, including security functionality and secure development requirements.",
                ["Document security requirements", "Establish security criteria", "Define acceptance criteria"],
                ["Security requirements documentation", "Threat models", "Security acceptance criteria"],
                ["NIST SP 800-160", "ISO/IEC 27034"],
                "medium",
                {1: "Basic security requirements documented", 2: "Comprehensive requirements with threat modeling", 
                 3: "Requirements integrated with architecture", 4: "Continuous requirements validation"}
            ),
            NISTSSDFPractice(
                "PO.1.2", "PO", "Implement Roles and Responsibilities",
                "Establish and maintain well-defined roles and responsibilities for all personnel involved in software development.",
                ["Define security roles", "Assign responsibilities", "Establish accountability"],
                ["RACI matrix", "Security champion program", "Role-based training"],
                ["NIST SP 800-181"],
                "low",
                {1: "Basic roles defined", 2: "Clear responsibilities assigned", 
                 3: "Security roles integrated", 4: "Continuous role optimization"}
            ),
            NISTSSDFPractice(
                "PO.1.3", "PO", "Implement Supporting Toolchains",
                "Implement and maintain secure toolchains for software development, including development, build, and deployment tools.",
                ["Secure development tools", "Build pipeline security", "Supply chain security"],
                ["Secure CI/CD pipelines", "Tool security validation", "Dependency scanning"],
                ["NIST SP 800-218", "SLSA"],
                "high",
                {1: "Basic toolchain security", 2: "Comprehensive tool validation", 
                 3: "Integrated security scanning", 4: "Continuous toolchain monitoring"}
            ),
            NISTSSDFPractice(
                "PO.2.1", "PO", "Provide Awareness Training",
                "Ensure that all personnel involved in software development are aware of software security considerations and are trained in secure software development practices.",
                ["Security awareness training", "Secure coding training", "Regular updates"],
                ["Training programs", "Security awareness campaigns", "Competency assessments"],
                ["NIST SP 800-50"],
                "medium",
                {1: "Basic security training", 2: "Role-specific training", 
                 3: "Continuous education", 4: "Advanced security specialization"}
            ),
            NISTSSDFPractice(
                "PO.3.1", "PO", "Define Verification and Validation Requirements",
                "Define the verification and validation (V&V) activities to be performed for software security throughout the software development lifecycle.",
                ["V&V planning", "Testing requirements", "Validation criteria"],
                ["Test plans", "Security test cases", "V&V procedures"],
                ["IEEE 1012"],
                "high",
                {1: "Basic V&V activities", 2: "Comprehensive testing strategy", 
                 3: "Automated V&V integration", 4: "Continuous validation"}
            ),
            NISTSSDFPractice(
                "PO.4.1", "PO", "Define Development Process Security Requirements",
                "Define the security requirements for the development process itself, including requirements for development environment security and secure coding standards.",
                ["Development environment security", "Secure coding standards", "Process security"],
                ["Secure development environment", "Coding guidelines", "Process documentation"],
                ["OWASP SAMM"],
                "medium",
                {1: "Basic process requirements", 2: "Comprehensive standards", 
                 3: "Integrated security controls", 4: "Continuous process improvement"}
            ),
            NISTSSDFPractice(
                "PO.5.1", "PO", "Implement Configuration Management",
                "Implement configuration management practices for software development, including version control and change management.",
                ["Version control", "Change management", "Configuration baselines"],
                ["Git repositories", "Change approval processes", "Configuration audits"],
                ["IEEE 828"],
                "high",
                {1: "Basic version control", 2: "Comprehensive change management", 
                 3: "Integrated CM practices", 4: "Continuous configuration monitoring"}
            )
        ]
        
        for practice in po_practices:
            practices[practice.practice_id] = practice
            
        # PS: Protect the Software
        ps_practices = [
            NISTSSDFPractice(
                "PS.1.1", "PS", "Protect All Components of Software",
                "Protect all components of the software from tampering and unauthorized access throughout the software development lifecycle.",
                ["Component protection", "Access controls", "Integrity monitoring"],
                ["Software signing", "Access control systems", "Integrity verification"],
                ["NIST SP 800-161"],
                "high",
                {1: "Basic component protection", 2: "Comprehensive access controls", 
                 3: "Automated integrity monitoring", 4: "Continuous protection validation"}
            ),
            NISTSSDFPractice(
                "PS.2.1", "PS", "Provide Authorized Personnel with Secure Access",
                "Provide authorized personnel with access to the software development environment using secure access mechanisms.",
                ["Secure authentication", "Authorization controls", "Access monitoring"],
                ["Multi-factor authentication", "Role-based access", "Access logging"],
                ["NIST SP 800-63"],
                "medium",
                {1: "Basic authentication", 2: "Multi-factor authentication", 
                 3: "Risk-based access", 4: "Continuous access monitoring"}
            ),
            NISTSSDFPractice(
                "PS.3.1", "PS", "Archive and Protect Each Software Release",
                "Archive and protect each software release, including all associated artifacts, in a secure manner.",
                ["Release archiving", "Artifact protection", "Version tracking"],
                ["Secure repositories", "Digital signatures", "Release management"],
                ["ISO/IEC 19770"],
                "high",
                {1: "Basic archiving", 2: "Secure storage", 
                 3: "Comprehensive artifact management", 4: "Continuous integrity validation"}
            )
        ]
        
        for practice in ps_practices:
            practices[practice.practice_id] = practice
            
        # PW: Produce Well-Secured Software
        pw_practices = [
            NISTSSDFPractice(
                "PW.1.1", "PW", "Design Software to Meet Security Requirements",
                "Design the software to meet the security requirements defined in the preparation phase.",
                ["Secure design principles", "Architecture review", "Design validation"],
                ["Security architecture", "Design patterns", "Architecture documentation"],
                ["NIST SP 800-160"],
                "medium",
                {1: "Basic secure design", 2: "Comprehensive architecture review", 
                 3: "Threat-informed design", 4: "Continuous design validation"}
            ),
            NISTSSDFPractice(
                "PW.1.2", "PW", "Review the Software Design",
                "Review the software design to verify that it meets security requirements and follows secure design principles.",
                ["Design reviews", "Security validation", "Peer review"],
                ["Architecture review boards", "Design documentation", "Review checklists"],
                ["IEEE 1028"],
                "medium",
                {1: "Basic design review", 2: "Formal review process", 
                 3: "Automated design analysis", 4: "Continuous design monitoring"}
            ),
            NISTSSDFPractice(
                "PW.2.1", "PW", "Use Secure Coding Practices",
                "Use secure coding practices when implementing the software to prevent the introduction of security vulnerabilities.",
                ["Secure coding standards", "Code review practices", "Static analysis"],
                ["Coding guidelines", "SAST tools", "Code review processes"],
                ["OWASP Secure Coding Practices"],
                "high",
                {1: "Basic secure coding", 2: "Comprehensive standards", 
                 3: "Automated code analysis", 4: "Continuous code quality monitoring"}
            ),
            NISTSSDFPractice(
                "PW.4.1", "PW", "Review Code to Identify Vulnerabilities",
                "Review code, both manually and using automated tools, to identify security vulnerabilities.",
                ["Code review processes", "Static analysis", "Manual review"],
                ["Peer review", "SAST tools", "Security-focused reviews"],
                ["OWASP Code Review Guide"],
                "high",
                {1: "Basic code review", 2: "Tool-assisted review", 
                 3: "Comprehensive analysis", 4: "Continuous security validation"}
            ),
            NISTSSDFPractice(
                "PW.5.1", "PW", "Test Executable Code to Identify Vulnerabilities",
                "Test the executable code to identify security vulnerabilities using various testing techniques.",
                ["Dynamic testing", "Penetration testing", "Fuzz testing"],
                ["DAST tools", "Security testing", "Vulnerability assessment"],
                ["OWASP Testing Guide"],
                "high",
                {1: "Basic security testing", 2: "Comprehensive test suite", 
                 3: "Automated security testing", 4: "Continuous testing validation"}
            ),
            NISTSSDFPractice(
                "PW.6.1", "PW", "Configure Software to Have Secure Settings by Default",
                "Configure the software to have secure settings by default and provide guidance for secure configuration.",
                ["Secure defaults", "Configuration guidance", "Hardening procedures"],
                ["Default configurations", "Configuration guides", "Security baselines"],
                ["NIST SP 800-70"],
                "medium",
                {1: "Basic secure defaults", 2: "Comprehensive configuration", 
                 3: "Automated hardening", 4: "Continuous configuration monitoring"}
            ),
            NISTSSDFPractice(
                "PW.7.1", "PW", "Review and/or Analyze Human-Readable Code",
                "Review and/or analyze human-readable code to identify security issues that cannot be detected by automated tools.",
                ["Manual code review", "Security analysis", "Expert review"],
                ["Security code review", "Expert analysis", "Manual inspection"],
                ["OWASP Code Review Guide"],
                "medium",
                {1: "Basic manual review", 2: "Expert security review", 
                 3: "Comprehensive analysis", 4: "Continuous expert validation"}
            ),
            NISTSSDFPractice(
                "PW.8.1", "PW", "Review and/or Analyze Third-Party Software",
                "Review and/or analyze third-party software components to identify security issues.",
                ["Third-party assessment", "Dependency analysis", "Supply chain security"],
                ["SCA tools", "Vendor assessments", "License compliance"],
                ["NIST SP 800-161"],
                "high",
                {1: "Basic dependency scanning", 2: "Comprehensive third-party review", 
                 3: "Automated supply chain analysis", 4: "Continuous third-party monitoring"}
            ),
            NISTSSDFPractice(
                "PW.9.1", "PW", "Verify Integrity and Authenticity of Software",
                "Verify the integrity and authenticity of the software and its components throughout the development process.",
                ["Integrity verification", "Authenticity validation", "Digital signatures"],
                ["Code signing", "Hash verification", "PKI infrastructure"],
                ["NIST FIPS 186"],
                "high",
                {1: "Basic integrity checks", 2: "Comprehensive verification", 
                 3: "Automated integrity monitoring", 4: "Continuous authenticity validation"}
            )
        ]
        
        for practice in pw_practices:
            practices[practice.practice_id] = practice
            
        # RV: Respond to Vulnerabilities
        rv_practices = [
            NISTSSDFPractice(
                "RV.1.1", "RV", "Identify and Confirm Vulnerabilities on Ongoing Basis",
                "Identify and confirm vulnerabilities in the software on an ongoing basis throughout its lifecycle.",
                ["Vulnerability identification", "Confirmation processes", "Ongoing monitoring"],
                ["Vulnerability scanners", "Bug bounty programs", "Security monitoring"],
                ["NIST SP 800-40"],
                "high",
                {1: "Basic vulnerability identification", 2: "Comprehensive scanning", 
                 3: "Automated vulnerability detection", 4: "Continuous vulnerability monitoring"}
            ),
            NISTSSDFPractice(
                "RV.1.2", "RV", "Assess, Prioritize, and Remediate Vulnerabilities",
                "Assess, prioritize, and remediate identified vulnerabilities in a timely manner based on risk.",
                ["Vulnerability assessment", "Risk prioritization", "Remediation planning"],
                ["CVSS scoring", "Risk matrices", "Patch management"],
                ["NIST SP 800-40"],
                "medium",
                {1: "Basic remediation", 2: "Risk-based prioritization", 
                 3: "Automated assessment", 4: "Continuous remediation optimization"}
            ),
            NISTSSDFPractice(
                "RV.1.3", "RV", "Analyze Vulnerabilities to Identify Their Root Causes",
                "Analyze vulnerabilities to identify their root causes and improve development processes to prevent similar vulnerabilities.",
                ["Root cause analysis", "Process improvement", "Preventive measures"],
                ["Vulnerability analysis", "Process reviews", "Improvement plans"],
                ["NIST SP 800-30"],
                "medium",
                {1: "Basic analysis", 2: "Systematic root cause analysis", 
                 3: "Process integration", 4: "Continuous improvement optimization"}
            ),
            NISTSSDFPractice(
                "RV.2.1", "RV", "Plan and Implement Vulnerability Disclosure",
                "Plan and implement a vulnerability disclosure process for receiving and responding to vulnerability reports.",
                ["Disclosure process", "Response procedures", "Communication plans"],
                ["Vulnerability disclosure policy", "Response teams", "Communication channels"],
                ["ISO/IEC 29147"],
                "low",
                {1: "Basic disclosure process", 2: "Formal disclosure program", 
                 3: "Integrated response", 4: "Continuous disclosure optimization"}
            ),
            NISTSSDFPractice(
                "RV.3.1", "RV", "Analyze Vulnerabilities to Identify Their Root Causes",
                "Analyze vulnerabilities found in software to identify their root causes and implement measures to prevent similar vulnerabilities in the future.",
                ["Vulnerability analysis", "Trend analysis", "Prevention measures"],
                ["Analysis reports", "Trend tracking", "Prevention programs"],
                ["NIST SP 800-30"],
                "medium",
                {1: "Basic trend analysis", 2: "Comprehensive analysis", 
                 3: "Predictive analysis", 4: "Continuous prevention optimization"}
            )
        ]
        
        for practice in rv_practices:
            practices[practice.practice_id] = practice
            
        return practices
    
    async def analyze_compliance(self, project_path: str) -> Dict[str, Any]:
        """Perform comprehensive NIST-SSDF practice compliance analysis"""
        analysis_start = datetime.now()
        
        try:
            # Assess practices by group
            practice_assessments = await self._assess_all_practice_groups(project_path)
            
            # Calculate implementation tiers
            tier_assessment = await self._assess_implementation_tiers(practice_assessments)
            
            # Generate maturity assessment
            maturity_assessment = await self._assess_practice_maturity(practice_assessments)
            
            # Generate compliance matrix
            compliance_matrix = await self._generate_ssdf_compliance_matrix(practice_assessments)
            
            # Generate gap analysis
            gap_analysis = await self._perform_ssdf_gap_analysis(practice_assessments)
            
            # Save assessment results
            await self._save_ssdf_assessment(practice_assessments, tier_assessment, maturity_assessment)
            
            return {
                "status": "success",
                "analysis_timestamp": analysis_start.isoformat(),
                "framework": "NIST_SSDF_v1.1",
                "framework_version": "1.1",
                "practices_assessed": len(practice_assessments),
                "practice_assessments": practice_assessments,
                "implementation_tier": tier_assessment,
                "maturity_assessment": maturity_assessment,
                "compliance_matrix": compliance_matrix,
                "gap_analysis": gap_analysis,
                "overall_compliance_score": self._calculate_ssdf_compliance_score(practice_assessments),
                "recommendations": self._generate_ssdf_recommendations(gap_analysis, tier_assessment)
            }
            
        except Exception as e:
            self.logger.error(f"NIST-SSDF analysis failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "analysis_timestamp": analysis_start.isoformat()
            }
    
    async def _assess_all_practice_groups(self, project_path: str) -> List[Dict[str, Any]]:
        """Assess all NIST-SSDF practice groups"""
        assessments = []
        
        # Assess all practice groups concurrently
        assessment_tasks = [
            self._assess_po_practices(project_path),  # Prepare Organization
            self._assess_ps_practices(project_path),  # Protect Software
            self._assess_pw_practices(project_path),  # Produce Well-Secured Software
            self._assess_rv_practices(project_path)   # Respond to Vulnerabilities
        ]
        
        results = await asyncio.gather(*assessment_tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                self.logger.error(f"Practice group assessment failed: {result}")
            else:
                assessments.extend(result)
        
        return assessments
    
    async def _assess_po_practices(self, project_path: str) -> List[Dict[str, Any]]:
        """Assess PO (Prepare Organization) practices"""
        assessments = []
        
        # PO.1.1 - Security Requirements
        requirements_assessment = await self._assess_security_requirements(project_path)
        assessments.append({
            "practice_id": "PO.1.1",
            "group": "PO",
            "practice_name": "Identify and Document Software Security Requirements",
            "implementation_tier": requirements_assessment["tier"],
            "maturity_level": requirements_assessment["maturity"],
            "implementation_status": requirements_assessment["status"],
            "evidence": requirements_assessment["evidence"],
            "automation_level": requirements_assessment["automation"],
            "gaps": requirements_assessment["gaps"],
            "recommendations": requirements_assessment["recommendations"]
        })
        
        # PO.1.3 - Supporting Toolchains
        toolchain_assessment = await self._assess_toolchain_security(project_path)
        assessments.append({
            "practice_id": "PO.1.3",
            "group": "PO",
            "practice_name": "Implement Supporting Toolchains",
            "implementation_tier": toolchain_assessment["tier"],
            "maturity_level": toolchain_assessment["maturity"],
            "implementation_status": toolchain_assessment["status"],
            "evidence": toolchain_assessment["evidence"],
            "automation_level": toolchain_assessment["automation"],
            "gaps": toolchain_assessment["gaps"],
            "recommendations": toolchain_assessment["recommendations"]
        })
        
        # PO.5.1 - Configuration Management
        cm_assessment = await self._assess_configuration_management(project_path)
        assessments.append({
            "practice_id": "PO.5.1",
            "group": "PO",
            "practice_name": "Implement Configuration Management",
            "implementation_tier": cm_assessment["tier"],
            "maturity_level": cm_assessment["maturity"],
            "implementation_status": cm_assessment["status"],
            "evidence": cm_assessment["evidence"],
            "automation_level": cm_assessment["automation"],
            "gaps": cm_assessment["gaps"],
            "recommendations": cm_assessment["recommendations"]
        })
        
        return assessments
    
    async def _assess_ps_practices(self, project_path: str) -> List[Dict[str, Any]]:
        """Assess PS (Protect Software) practices"""
        assessments = []
        
        # PS.1.1 - Protect Software Components
        protection_assessment = await self._assess_component_protection(project_path)
        assessments.append({
            "practice_id": "PS.1.1",
            "group": "PS",
            "practice_name": "Protect All Components of Software",
            "implementation_tier": protection_assessment["tier"],
            "maturity_level": protection_assessment["maturity"],
            "implementation_status": protection_assessment["status"],
            "evidence": protection_assessment["evidence"],
            "automation_level": protection_assessment["automation"],
            "gaps": protection_assessment["gaps"],
            "recommendations": protection_assessment["recommendations"]
        })
        
        # PS.3.1 - Archive and Protect Releases
        archive_assessment = await self._assess_release_protection(project_path)
        assessments.append({
            "practice_id": "PS.3.1",
            "group": "PS",
            "practice_name": "Archive and Protect Each Software Release",
            "implementation_tier": archive_assessment["tier"],
            "maturity_level": archive_assessment["maturity"],
            "implementation_status": archive_assessment["status"],
            "evidence": archive_assessment["evidence"],
            "automation_level": archive_assessment["automation"],
            "gaps": archive_assessment["gaps"],
            "recommendations": archive_assessment["recommendations"]
        })
        
        return assessments
    
    async def _assess_pw_practices(self, project_path: str) -> List[Dict[str, Any]]:
        """Assess PW (Produce Well-Secured Software) practices"""
        assessments = []
        
        # PW.2.1 - Secure Coding Practices
        coding_assessment = await self._assess_secure_coding(project_path)
        assessments.append({
            "practice_id": "PW.2.1",
            "group": "PW", 
            "practice_name": "Use Secure Coding Practices",
            "implementation_tier": coding_assessment["tier"],
            "maturity_level": coding_assessment["maturity"],
            "implementation_status": coding_assessment["status"],
            "evidence": coding_assessment["evidence"],
            "automation_level": coding_assessment["automation"],
            "gaps": coding_assessment["gaps"],
            "recommendations": coding_assessment["recommendations"]
        })
        
        # PW.4.1 - Code Review for Vulnerabilities
        review_assessment = await self._assess_code_review(project_path)
        assessments.append({
            "practice_id": "PW.4.1",
            "group": "PW",
            "practice_name": "Review Code to Identify Vulnerabilities",
            "implementation_tier": review_assessment["tier"],
            "maturity_level": review_assessment["maturity"],
            "implementation_status": review_assessment["status"],
            "evidence": review_assessment["evidence"],
            "automation_level": review_assessment["automation"],
            "gaps": review_assessment["gaps"],
            "recommendations": review_assessment["recommendations"]
        })
        
        # PW.5.1 - Test Executable Code
        testing_assessment = await self._assess_security_testing(project_path)
        assessments.append({
            "practice_id": "PW.5.1",
            "group": "PW",
            "practice_name": "Test Executable Code to Identify Vulnerabilities",
            "implementation_tier": testing_assessment["tier"],
            "maturity_level": testing_assessment["maturity"],
            "implementation_status": testing_assessment["status"],
            "evidence": testing_assessment["evidence"],
            "automation_level": testing_assessment["automation"],
            "gaps": testing_assessment["gaps"],
            "recommendations": testing_assessment["recommendations"]
        })
        
        # PW.8.1 - Third-Party Software Analysis
        third_party_assessment = await self._assess_third_party_analysis(project_path)
        assessments.append({
            "practice_id": "PW.8.1",
            "group": "PW",
            "practice_name": "Review and/or Analyze Third-Party Software",
            "implementation_tier": third_party_assessment["tier"],
            "maturity_level": third_party_assessment["maturity"],
            "implementation_status": third_party_assessment["status"],
            "evidence": third_party_assessment["evidence"],
            "automation_level": third_party_assessment["automation"],
            "gaps": third_party_assessment["gaps"],
            "recommendations": third_party_assessment["recommendations"]
        })
        
        return assessments
    
    async def _assess_rv_practices(self, project_path: str) -> List[Dict[str, Any]]:
        """Assess RV (Respond to Vulnerabilities) practices"""
        assessments = []
        
        # RV.1.1 - Identify Vulnerabilities
        identification_assessment = await self._assess_vulnerability_identification(project_path)
        assessments.append({
            "practice_id": "RV.1.1",
            "group": "RV",
            "practice_name": "Identify and Confirm Vulnerabilities on Ongoing Basis",
            "implementation_tier": identification_assessment["tier"],
            "maturity_level": identification_assessment["maturity"],
            "implementation_status": identification_assessment["status"],
            "evidence": identification_assessment["evidence"],
            "automation_level": identification_assessment["automation"],
            "gaps": identification_assessment["gaps"],
            "recommendations": identification_assessment["recommendations"]
        })
        
        # RV.2.1 - Vulnerability Disclosure
        disclosure_assessment = await self._assess_vulnerability_disclosure(project_path)
        assessments.append({
            "practice_id": "RV.2.1",
            "group": "RV",
            "practice_name": "Plan and Implement Vulnerability Disclosure",
            "implementation_tier": disclosure_assessment["tier"],
            "maturity_level": disclosure_assessment["maturity"],
            "implementation_status": disclosure_assessment["status"],
            "evidence": disclosure_assessment["evidence"],
            "automation_level": disclosure_assessment["automation"],
            "gaps": disclosure_assessment["gaps"],
            "recommendations": disclosure_assessment["recommendations"]
        })
        
        return assessments
    
    async def _assess_security_requirements(self, project_path: str) -> Dict[str, Any]:
        """Assess PO.1.1 - Security Requirements documentation"""
        evidence = []
        gaps = []
        
        # Check for security requirements documentation
        req_files = [
            "SECURITY.md",
            "docs/security/",
            "requirements/security*",
            "specs/security*"
        ]
        
        requirements_found = False
        comprehensive_docs = False
        
        for pattern in req_files:
            files = list(Path(project_path).glob(pattern))
            if files:
                requirements_found = True
                for file in files:
                    evidence.append({
                        "type": "security_requirements",
                        "file": str(file.relative_to(project_path)),
                        "description": "Security requirements documentation"
                    })
                    
                    # Check if comprehensive (basic heuristic)
                    if file.is_file() and file.stat().st_size > 1000:  # >1KB suggests comprehensive
                        comprehensive_docs = True
        
        if not requirements_found:
            gaps.append("No security requirements documentation found")
        elif not comprehensive_docs:
            gaps.append("Security requirements appear incomplete")
        
        # Determine tier and maturity
        if comprehensive_docs:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif requirements_found:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "manual",
            "gaps": gaps,
            "recommendations": ["Develop comprehensive security requirements documentation"] if not comprehensive_docs else []
        }
    
    async def _assess_toolchain_security(self, project_path: str) -> Dict[str, Any]:
        """Assess PO.1.3 - Supporting Toolchains security"""
        evidence = []
        gaps = []
        
        # Check for CI/CD security measures
        security_tools = 0
        automation_level = "manual"
        
        workflow_dir = Path(project_path) / ".github" / "workflows"
        if workflow_dir.exists():
            for workflow in workflow_dir.glob("*.yml"):
                with open(workflow, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    
                    security_features = []
                    if 'codeql' in content:
                        security_features.append('Static Analysis (CodeQL)')
                        security_tools += 1
                    if any(term in content for term in ['dependency-check', 'snyk', 'safety']):
                        security_features.append('Dependency Scanning')
                        security_tools += 1
                    if any(term in content for term in ['secrets', 'secret-scan']):
                        security_features.append('Secret Scanning')
                        security_tools += 1
                    if any(term in content for term in ['sast', 'sonar']):
                        security_features.append('SAST')
                        security_tools += 1
                    
                    if security_features:
                        evidence.append({
                            "type": "secure_ci_cd",
                            "file": str(workflow.relative_to(project_path)),
                            "security_features": security_features,
                            "description": "Security-integrated CI/CD workflow"
                        })
                        automation_level = "automated"
        
        if security_tools == 0:
            gaps.append("No security tools integrated in CI/CD")
        elif security_tools < 3:
            gaps.append("Limited security tool integration")
        
        # Determine tier and maturity
        if security_tools >= 4:
            tier = 4
            maturity = "optimizing"
            status = "exceeds"
        elif security_tools >= 3:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif security_tools >= 1:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": automation_level,
            "gaps": gaps,
            "recommendations": ["Integrate comprehensive security tools in CI/CD pipeline"] if security_tools < 3 else []
        }
    
    async def _assess_configuration_management(self, project_path: str) -> Dict[str, Any]:
        """Assess PO.5.1 - Configuration Management"""
        evidence = []
        gaps = []
        
        # Check for version control and change management
        git_dir = Path(project_path) / ".git"
        has_git = git_dir.exists()
        
        if has_git:
            evidence.append({
                "type": "version_control",
                "system": "Git",
                "description": "Version control system in place"
            })
        
        # Check for branch protection/change management
        branch_protection = False
        workflow_dir = Path(project_path) / ".github" / "workflows"
        if workflow_dir.exists():
            for workflow in workflow_dir.glob("*.yml"):
                with open(workflow, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    if any(term in content for term in ['pull_request', 'review', 'approval']):
                        branch_protection = True
                        evidence.append({
                            "type": "change_management",
                            "file": str(workflow.relative_to(project_path)),
                            "description": "Change management via PR workflows"
                        })
        
        if not has_git:
            gaps.append("No version control system detected")
        if not branch_protection:
            gaps.append("No change management/review process detected")
        
        # Determine tier and maturity
        if has_git and branch_protection:
            tier = 3
            maturity = "defined"
            status = "implemented"
            automation = "automated"
        elif has_git:
            tier = 2
            maturity = "developing"
            status = "partial"
            automation = "semi_automated"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
            automation = "manual"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": automation,
            "gaps": gaps,
            "recommendations": ["Implement change management processes"] if not branch_protection else []
        }
    
    async def _assess_component_protection(self, project_path: str) -> Dict[str, Any]:
        """Assess PS.1.1 - Component Protection"""
        evidence = []
        gaps = []
        
        # Check for access controls and protection measures
        protection_measures = 0
        
        # Check for GitHub security features
        security_md = Path(project_path) / "SECURITY.md"
        if security_md.exists():
            evidence.append({
                "type": "security_policy",
                "file": "SECURITY.md",
                "description": "Security policy documentation"
            })
            protection_measures += 1
        
        # Check for dependency protection
        dependabot_config = Path(project_path) / ".github" / "dependabot.yml"
        if dependabot_config.exists():
            evidence.append({
                "type": "dependency_protection",
                "file": ".github/dependabot.yml",
                "description": "Automated dependency updates"
            })
            protection_measures += 1
        
        if protection_measures == 0:
            gaps.append("No component protection measures identified")
        elif protection_measures < 2:
            gaps.append("Limited component protection")
        
        # Determine tier and maturity
        if protection_measures >= 3:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif protection_measures >= 1:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "semi_automated" if protection_measures > 0 else "manual",
            "gaps": gaps,
            "recommendations": ["Implement comprehensive component protection"] if protection_measures < 2 else []
        }
    
    async def _assess_release_protection(self, project_path: str) -> Dict[str, Any]:
        """Assess PS.3.1 - Release Protection"""
        evidence = []
        gaps = []
        
        # Check for release management and protection
        release_protection = 0
        
        # Check for GitHub releases
        workflow_dir = Path(project_path) / ".github" / "workflows"
        if workflow_dir.exists():
            for workflow in workflow_dir.glob("*.yml"):
                with open(workflow, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    if 'release' in content:
                        evidence.append({
                            "type": "automated_release",
                            "file": str(workflow.relative_to(project_path)),
                            "description": "Automated release workflow"
                        })
                        release_protection += 1
                    if any(term in content for term in ['sign', 'signature', 'checksum']):
                        evidence.append({
                            "type": "release_signing",
                            "file": str(workflow.relative_to(project_path)),
                            "description": "Release signing/verification"
                        })
                        release_protection += 1
        
        if release_protection == 0:
            gaps.append("No release protection measures identified")
        
        # Determine tier and maturity
        if release_protection >= 2:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif release_protection >= 1:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "automated" if release_protection > 0 else "manual",
            "gaps": gaps,
            "recommendations": ["Implement release protection and signing"] if release_protection < 2 else []
        }
    
    async def _assess_secure_coding(self, project_path: str) -> Dict[str, Any]:
        """Assess PW.2.1 - Secure Coding Practices"""
        evidence = []
        gaps = []
        
        # Check for secure coding practices
        coding_practices = 0
        
        # Check for linting/static analysis
        config_files = [
            ".eslintrc*", ".pylintrc", ".flake8", "pyproject.toml", 
            "sonar-project.properties", ".codeclimate.yml"
        ]
        
        for pattern in config_files:
            files = list(Path(project_path).glob(pattern))
            if files:
                evidence.append({
                    "type": "static_analysis_config",
                    "files": [str(f.relative_to(project_path)) for f in files],
                    "description": "Static analysis/linting configuration"
                })
                coding_practices += 1
                break
        
        # Check for pre-commit hooks
        pre_commit = Path(project_path) / ".pre-commit-config.yaml"
        if pre_commit.exists():
            evidence.append({
                "type": "pre_commit_hooks",
                "file": ".pre-commit-config.yaml",
                "description": "Pre-commit security checks"
            })
            coding_practices += 1
        
        if coding_practices == 0:
            gaps.append("No secure coding practices identified")
        elif coding_practices < 2:
            gaps.append("Limited secure coding enforcement")
        
        # Determine tier and maturity
        if coding_practices >= 3:
            tier = 4
            maturity = "optimizing"
            status = "exceeds"
        elif coding_practices >= 2:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif coding_practices >= 1:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "automated" if coding_practices >= 2 else "semi_automated" if coding_practices >= 1 else "manual",
            "gaps": gaps,
            "recommendations": ["Implement comprehensive secure coding practices"] if coding_practices < 2 else []
        }
    
    async def _assess_code_review(self, project_path: str) -> Dict[str, Any]:
        """Assess PW.4.1 - Code Review for Vulnerabilities"""
        evidence = []
        gaps = []
        
        # Check for code review processes
        review_practices = 0
        
        # Check for PR templates
        pr_templates = [
            ".github/pull_request_template.md",
            ".github/PULL_REQUEST_TEMPLATE.md"
        ]
        
        for template_path in pr_templates:
            template_file = Path(project_path) / template_path
            if template_file.exists():
                evidence.append({
                    "type": "pr_template",
                    "file": template_path,
                    "description": "Pull request template for code review"
                })
                review_practices += 1
                break
        
        # Check for automated security scanning
        workflow_dir = Path(project_path) / ".github" / "workflows"
        if workflow_dir.exists():
            for workflow in workflow_dir.glob("*.yml"):
                with open(workflow, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    if any(term in content for term in ['codeql', 'sast', 'security']):
                        evidence.append({
                            "type": "automated_security_review",
                            "file": str(workflow.relative_to(project_path)),
                            "description": "Automated security code review"
                        })
                        review_practices += 1
                        break
        
        if review_practices == 0:
            gaps.append("No code review process identified")
        elif review_practices < 2:
            gaps.append("Limited security-focused code review")
        
        # Determine tier and maturity
        if review_practices >= 2:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif review_practices >= 1:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "semi_automated" if review_practices > 0 else "manual",
            "gaps": gaps,
            "recommendations": ["Implement security-focused code review process"] if review_practices < 2 else []
        }
    
    async def _assess_security_testing(self, project_path: str) -> Dict[str, Any]:
        """Assess PW.5.1 - Security Testing"""
        evidence = []
        gaps = []
        
        # Check for security testing
        testing_practices = 0
        
        # Check for test files with security focus
        test_dirs = ["test*", "tests*", "spec*"]
        security_tests = False
        
        for pattern in test_dirs:
            test_paths = list(Path(project_path).glob(pattern))
            for test_path in test_paths:
                if test_path.is_dir():
                    security_test_files = list(test_path.glob("**/*security*")) + \
                                        list(test_path.glob("**/*auth*"))
                    if security_test_files:
                        security_tests = True
                        evidence.append({
                            "type": "security_tests",
                            "directory": str(test_path.relative_to(project_path)),
                            "test_files": [str(f.relative_to(project_path)) for f in security_test_files[:3]],
                            "description": "Security-focused test cases"
                        })
                        testing_practices += 1
                        break
        
        # Check for automated security testing in CI/CD
        workflow_dir = Path(project_path) / ".github" / "workflows"
        if workflow_dir.exists():
            for workflow in workflow_dir.glob("*.yml"):
                with open(workflow, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    if any(term in content for term in ['dast', 'zap', 'security-test']):
                        evidence.append({
                            "type": "automated_security_testing",
                            "file": str(workflow.relative_to(project_path)),
                            "description": "Automated security testing in CI/CD"
                        })
                        testing_practices += 1
                        break
        
        if testing_practices == 0:
            gaps.append("No security testing identified")
        elif testing_practices < 2:
            gaps.append("Limited security testing coverage")
        
        # Determine tier and maturity
        if testing_practices >= 2:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif testing_practices >= 1:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "automated" if testing_practices >= 2 else "semi_automated" if testing_practices >= 1 else "manual",
            "gaps": gaps,
            "recommendations": ["Implement comprehensive security testing"] if testing_practices < 2 else []
        }
    
    async def _assess_third_party_analysis(self, project_path: str) -> Dict[str, Any]:
        """Assess PW.8.1 - Third-Party Software Analysis"""
        evidence = []
        gaps = []
        
        # Check for dependency management and analysis
        dependency_analysis = 0
        
        # Check for dependency files
        dep_files = [
            "package.json", "package-lock.json", "yarn.lock",
            "requirements.txt", "Pipfile", "pyproject.toml",
            "Gemfile", "go.mod", "pom.xml"
        ]
        
        for dep_file in dep_files:
            file_path = Path(project_path) / dep_file
            if file_path.exists():
                evidence.append({
                    "type": "dependency_management",
                    "file": dep_file,
                    "description": "Dependency management file"
                })
                dependency_analysis += 1
                break
        
        # Check for dependency scanning
        workflow_dir = Path(project_path) / ".github" / "workflows"
        if workflow_dir.exists():
            for workflow in workflow_dir.glob("*.yml"):
                with open(workflow, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    if any(term in content for term in ['dependency-check', 'snyk', 'audit', 'safety']):
                        evidence.append({
                            "type": "dependency_scanning",
                            "file": str(workflow.relative_to(project_path)),
                            "description": "Automated dependency vulnerability scanning"
                        })
                        dependency_analysis += 1
                        break
        
        # Check for license compliance
        license_file = Path(project_path) / "LICENSE"
        if license_file.exists():
            evidence.append({
                "type": "license_management",
                "file": "LICENSE",
                "description": "Software license documentation"
            })
            dependency_analysis += 1
        
        if dependency_analysis == 0:
            gaps.append("No third-party software analysis identified")
        elif dependency_analysis < 2:
            gaps.append("Limited third-party analysis")
        
        # Determine tier and maturity
        if dependency_analysis >= 3:
            tier = 4
            maturity = "optimizing"
            status = "exceeds"
        elif dependency_analysis >= 2:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif dependency_analysis >= 1:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "automated" if dependency_analysis >= 2 else "semi_automated" if dependency_analysis >= 1 else "manual",
            "gaps": gaps,
            "recommendations": ["Implement comprehensive third-party analysis"] if dependency_analysis < 2 else []
        }
    
    async def _assess_vulnerability_identification(self, project_path: str) -> Dict[str, Any]:
        """Assess RV.1.1 - Vulnerability Identification"""
        evidence = []
        gaps = []
        
        # Check for vulnerability identification processes
        vuln_processes = 0
        
        # Check for automated vulnerability scanning
        workflow_dir = Path(project_path) / ".github" / "workflows"
        if workflow_dir.exists():
            for workflow in workflow_dir.glob("*.yml"):
                with open(workflow, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    
                    vuln_tools = []
                    if 'codeql' in content:
                        vuln_tools.append('CodeQL')
                    if any(term in content for term in ['dependency-check', 'snyk']):
                        vuln_tools.append('Dependency Scanning')
                    if any(term in content for term in ['trivy', 'grype']):
                        vuln_tools.append('Container Scanning')
                    
                    if vuln_tools:
                        evidence.append({
                            "type": "automated_vulnerability_scanning",
                            "file": str(workflow.relative_to(project_path)),
                            "tools": vuln_tools,
                            "description": "Automated vulnerability identification"
                        })
                        vuln_processes += len(vuln_tools)
        
        # Check for security monitoring
        security_md = Path(project_path) / "SECURITY.md"
        if security_md.exists():
            evidence.append({
                "type": "security_policy",
                "file": "SECURITY.md",
                "description": "Security vulnerability reporting policy"
            })
            vuln_processes += 1
        
        if vuln_processes == 0:
            gaps.append("No vulnerability identification process identified")
        elif vuln_processes < 2:
            gaps.append("Limited vulnerability identification capabilities")
        
        # Determine tier and maturity
        if vuln_processes >= 4:
            tier = 4
            maturity = "optimizing"
            status = "exceeds"
        elif vuln_processes >= 3:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif vuln_processes >= 1:
            tier = 2
            maturity = "developing"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "automated" if vuln_processes >= 2 else "semi_automated" if vuln_processes >= 1 else "manual",
            "gaps": gaps,
            "recommendations": ["Implement comprehensive vulnerability identification"] if vuln_processes < 3 else []
        }
    
    async def _assess_vulnerability_disclosure(self, project_path: str) -> Dict[str, Any]:
        """Assess RV.2.1 - Vulnerability Disclosure"""
        evidence = []
        gaps = []
        
        # Check for vulnerability disclosure process
        disclosure_elements = 0
        
        # Check for security policy
        security_md = Path(project_path) / "SECURITY.md"
        if security_md.exists():
            with open(security_md, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()
                
                disclosure_features = []
                if 'report' in content and 'vulnerability' in content:
                    disclosure_features.append('Vulnerability reporting process')
                if any(term in content for term in ['contact', 'email', 'security@']):
                    disclosure_features.append('Contact information')
                if any(term in content for term in ['response', 'timeline', 'sla']):
                    disclosure_features.append('Response timeline')
                
                evidence.append({
                    "type": "vulnerability_disclosure_policy",
                    "file": "SECURITY.md",
                    "features": disclosure_features,
                    "description": "Vulnerability disclosure policy documentation"
                })
                disclosure_elements += len(disclosure_features)
        
        if disclosure_elements == 0:
            gaps.append("No vulnerability disclosure process identified")
        elif disclosure_elements < 2:
            gaps.append("Incomplete vulnerability disclosure process")
        
        # Determine tier and maturity
        if disclosure_elements >= 3:
            tier = 3
            maturity = "defined"
            status = "implemented"
        elif disclosure_elements >= 2:
            tier = 2
            maturity = "developing"
            status = "partial"
        elif disclosure_elements >= 1:
            tier = 1
            maturity = "initial"
            status = "partial"
        else:
            tier = 1
            maturity = "initial"
            status = "not_implemented"
        
        return {
            "tier": tier,
            "maturity": maturity,
            "status": status,
            "evidence": evidence,
            "automation": "manual",
            "gaps": gaps,
            "recommendations": ["Implement comprehensive vulnerability disclosure process"] if disclosure_elements < 3 else []
        }
    
    async def _assess_implementation_tiers(self, assessments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess overall NIST-SSDF implementation tier"""
        tier_scores = [assessment["implementation_tier"] for assessment in assessments]
        
        # Calculate tier distribution
        tier_distribution = {1: 0, 2: 0, 3: 0, 4: 0}
        for tier in tier_scores:
            tier_distribution[tier] += 1
        
        # Determine overall tier (conservative approach - lowest tier with significant presence)
        total_practices = len(tier_scores)
        if tier_distribution[4] >= total_practices * 0.5:
            overall_tier = 4
        elif tier_distribution[3] >= total_practices * 0.4:
            overall_tier = 3
        elif tier_distribution[2] >= total_practices * 0.4:
            overall_tier = 2
        else:
            overall_tier = 1
        
        return {
            "overall_implementation_tier": overall_tier,
            "tier_distribution": tier_distribution,
            "average_tier": sum(tier_scores) / len(tier_scores) if tier_scores else 1,
            "practices_by_tier": {
                tier: [a["practice_id"] for a in assessments if a["implementation_tier"] == tier]
                for tier in [1, 2, 3, 4]
            }
        }
    
    async def _assess_practice_maturity(self, assessments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess practice maturity levels"""
        maturity_levels = ["initial", "developing", "defined", "managed", "optimizing"]
        maturity_scores = [assessment["maturity_level"] for assessment in assessments]
        
        # Calculate maturity distribution
        maturity_distribution = {level: 0 for level in maturity_levels}
        for maturity in maturity_scores:
            if maturity in maturity_distribution:
                maturity_distribution[maturity] += 1
        
        # Determine overall maturity
        total_practices = len(maturity_scores)
        if maturity_distribution["optimizing"] >= total_practices * 0.3:
            overall_maturity = "optimizing"
        elif maturity_distribution["defined"] >= total_practices * 0.5:
            overall_maturity = "defined"
        elif maturity_distribution["developing"] >= total_practices * 0.4:
            overall_maturity = "developing"
        else:
            overall_maturity = "initial"
        
        return {
            "overall_maturity": overall_maturity,
            "maturity_distribution": maturity_distribution,
            "practices_by_maturity": {
                level: [a["practice_id"] for a in assessments if a["maturity_level"] == level]
                for level in maturity_levels
            }
        }
    
    async def _generate_ssdf_compliance_matrix(self, assessments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate NIST-SSDF compliance matrix"""
        practice_groups = ["PO", "PS", "PW", "RV"]
        group_assessments = {group: [] for group in practice_groups}
        
        # Group assessments by practice group
        for assessment in assessments:
            group = assessment["group"]
            if group in group_assessments:
                group_assessments[group].append(assessment)
        
        # Calculate group compliance
        group_compliance = {}
        total_implemented = 0
        total_practices = len(assessments)
        
        for group, group_practices in group_assessments.items():
            if not group_practices:
                group_compliance[group] = {
                    "compliance_percentage": 0,
                    "implemented": 0,
                    "total": 0,
                    "average_tier": 1
                }
                continue
            
            implemented = len([p for p in group_practices if p["implementation_status"] in ["implemented", "exceeds"]])
            total_group = len(group_practices)
            average_tier = sum(p["implementation_tier"] for p in group_practices) / total_group
            
            group_compliance[group] = {
                "compliance_percentage": (implemented / total_group * 100) if total_group > 0 else 0,
                "implemented": implemented,
                "total": total_group,
                "average_tier": round(average_tier, 1)
            }
            
            total_implemented += implemented
        
        overall_compliance = (total_implemented / total_practices * 100) if total_practices > 0 else 0
        
        return {
            "overall_compliance_percentage": round(overall_compliance, 2),
            "total_practices": total_practices,
            "implemented_practices": total_implemented,
            "practice_groups": group_compliance,
            "compliance_level": self._determine_ssdf_compliance_level(overall_compliance),
            "matrix_generation_timestamp": datetime.now().isoformat()
        }
    
    async def _perform_ssdf_gap_analysis(self, assessments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform NIST-SSDF gap analysis"""
        gaps = []
        priority_gaps = {"high": [], "medium": [], "low": []}
        
        for assessment in assessments:
            if assessment["implementation_status"] in ["not_implemented", "partial"]:
                gap_priority = "high" if assessment["implementation_tier"] <= 2 else "medium"
                
                gap = {
                    "practice_id": assessment["practice_id"],
                    "group": assessment["group"],
                    "practice_name": assessment["practice_name"],
                    "current_status": assessment["implementation_status"],
                    "current_tier": assessment["implementation_tier"],
                    "target_tier": 3,  # Target tier 3 for most practices
                    "priority": gap_priority,
                    "gaps": assessment["gaps"],
                    "recommendations": assessment["recommendations"]
                }
                gaps.append(gap)
                priority_gaps[gap_priority].append(gap)
        
        return {
            "total_gaps": len(gaps),
            "gaps_by_priority": {
                priority: len(gap_list) for priority, gap_list in priority_gaps.items()
            },
            "detailed_gaps": gaps,
            "priority_recommendations": priority_gaps,
            "implementation_roadmap": self._generate_implementation_roadmap(priority_gaps),
            "gap_analysis_timestamp": datetime.now().isoformat()
        }
    
    def _calculate_ssdf_compliance_score(self, assessments: List[Dict[str, Any]]) -> float:
        """Calculate overall NIST-SSDF compliance score"""
        if not assessments:
            return 0.0
        
        # Weight by implementation status
        status_weights = {
            "not_implemented": 0.0,
            "partial": 0.5,
            "implemented": 1.0,
            "exceeds": 1.2
        }
        
        total_score = sum(status_weights.get(a["implementation_status"], 0) for a in assessments)
        max_score = len(assessments) * 1.2  # Maximum possible score
        
        return round((total_score / max_score) * 100, 2) if max_score > 0 else 0.0
    
    def _determine_ssdf_compliance_level(self, percentage: float) -> str:
        """Determine SSDF compliance level"""
        if percentage >= 90:
            return "Advanced"
        elif percentage >= 75:
            return "Proficient"
        elif percentage >= 60:
            return "Developing"
        elif percentage >= 40:
            return "Basic"
        else:
            return "Initial"
    
    def _generate_implementation_roadmap(self, priority_gaps: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Generate implementation roadmap for addressing gaps"""
        roadmap = []
        
        # Phase 1: High priority gaps
        if priority_gaps["high"]:
            roadmap.append({
                "phase": 1,
                "title": "Address Critical Security Gaps",
                "duration_weeks": 4,
                "practices": [gap["practice_id"] for gap in priority_gaps["high"]],
                "focus": "Basic security controls and processes",
                "success_criteria": "All high-priority practices at Tier 2+"
            })
        
        # Phase 2: Medium priority gaps
        if priority_gaps["medium"]:
            roadmap.append({
                "phase": 2,
                "title": "Enhance Security Maturity",
                "duration_weeks": 6,
                "practices": [gap["practice_id"] for gap in priority_gaps["medium"]],
                "focus": "Comprehensive security integration",
                "success_criteria": "All practices at Tier 3+"
            })
        
        # Phase 3: Optimization
        roadmap.append({
            "phase": 3,
            "title": "Optimize and Continuous Improvement",
            "duration_weeks": 8,
            "practices": "All practices",
            "focus": "Automation and continuous monitoring",
            "success_criteria": "Target Tier 4 for key practices"
        })
        
        return roadmap
    
    def _generate_ssdf_recommendations(self, gap_analysis: Dict[str, Any], tier_assessment: Dict[str, Any]) -> List[str]:
        """Generate NIST-SSDF specific recommendations"""
        recommendations = []
        
        high_gaps = gap_analysis["gaps_by_priority"]["high"]
        overall_tier = tier_assessment["overall_implementation_tier"]
        
        if high_gaps > 0:
            recommendations.append(f"PRIORITY: Address {high_gaps} high-priority practice gaps immediately")
        
        if overall_tier < 3:
            recommendations.append("Focus on achieving Tier 3 implementation across all practice groups")
        
        # Group-specific recommendations
        po_practices = tier_assessment["practices_by_tier"][1] + tier_assessment["practices_by_tier"][2]
        po_gaps = [p for p in po_practices if p.startswith("PO")]
        if po_gaps:
            recommendations.append("Strengthen organizational preparation practices (PO group)")
        
        pw_practices = tier_assessment["practices_by_tier"][1] + tier_assessment["practices_by_tier"][2]
        pw_gaps = [p for p in pw_practices if p.startswith("PW")]
        if pw_gaps:
            recommendations.append("Enhance secure development practices (PW group)")
        
        return recommendations
    
    async def _save_ssdf_assessment(self, assessments: List[Dict[str, Any]], 
                                   tier_assessment: Dict[str, Any],
                                   maturity_assessment: Dict[str, Any]):
        """Save NIST-SSDF assessment results"""
        artifacts_path = Path(self.config.artifacts_path) / "nist_ssdf"
        artifacts_path.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save practice assessments
        assessments_file = artifacts_path / f"ssdf_assessments_{timestamp}.json"
        with open(assessments_file, 'w') as f:
            json.dump(assessments, f, indent=2, default=str)
        
        # Save tier assessment
        tier_file = artifacts_path / f"ssdf_tier_assessment_{timestamp}.json"
        with open(tier_file, 'w') as f:
            json.dump(tier_assessment, f, indent=2, default=str)
        
        # Save maturity assessment
        maturity_file = artifacts_path / f"ssdf_maturity_assessment_{timestamp}.json"
        with open(maturity_file, 'w') as f:
            json.dump(maturity_assessment, f, indent=2, default=str)
        
        # Save assessment index
        index_file = artifacts_path / "assessment_index.json"
        index_data = {
            "last_assessment": timestamp,
            "assessments_file": str(assessments_file.name),
            "tier_file": str(tier_file.name),
            "maturity_file": str(maturity_file.name),
            "assessment_timestamp": datetime.now().isoformat()
        }
        
        with open(index_file, 'w') as f:
            json.dump(index_data, f, indent=2)