/**
 * NIST-SSDF v1.1 Practice Alignment and Validation Engine
 * Implements comprehensive NIST Secure Software Development Framework practice validation
 *
 * Task: EC-003 - NIST-SSDF v1.1 practice alignment and implementation tier validation
 */

import { EventEmitter } from 'events';
import { ComplianceEvidence, ControlAssessment } from '../types';

interface NISTSSFDConfig {
  version: string;
  implementationTiers: string[];
  practiceValidation: boolean;
  automatedAlignment: boolean;
  maturityAssessment: boolean;
  gapAnalysis: boolean;
}

interface NISTSSFDPractice {
  id: string;
  function: NISTSSFDFunction;
  category: NISTSSFDCategory;
  title: string;
  description: string;
  implementation: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
    tier4: string[];
  };
  outcomes: string[];
  references: string[];
  assessmentCriteria: string[];
  evidenceRequirements: string[];
  automatedTests: string[];
  relatedPractices: string[];
}

type NISTSSFDFunction = 'prepare' | 'protect' | 'produce' | 'respond';
type NISTSSFDCategory = 'po' | 'ps' | 'pw' | 'rv';

interface NISTSSFDAssessment {
  assessmentId: string;
  timestamp: Date;
  version: string;
  currentTier: number;
  targetTier: number;
  practices: PracticeAssessment[];
  functionResults: FunctionAssessment[];
  maturityLevel: number;
  complianceScore: number;
  gapAnalysis: GapAnalysisResult;
  improvementPlan: ImprovementPlan;
  findings: NISTSSFDFinding[];
  recommendations: string[];
  evidencePackage: ComplianceEvidence[];
  status: 'completed' | 'in-progress' | 'failed';
}

interface PracticeAssessment extends ControlAssessment {
  practice: NISTSSFDPractice;
  currentTier: number;
  targetTier: number;
  maturityScore: number;
  gapIdentified: boolean;
}

interface FunctionAssessment {
  function: NISTSSFDFunction;
  practices: PracticeAssessment[];
  overallScore: number;
  maturityLevel: number;
  gaps: string[];
  recommendations: string[];
}

interface GapAnalysisResult {
  identifiedGaps: Gap[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  effortEstimate: string;
  resourceRequirements: string[];
}

interface Gap {
  practiceId: string;
  currentState: string;
  desiredState: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effortEstimate: string;
  dependencies: string[];
}

interface ImprovementPlan {
  phases: ImprovementPhase[];
  timeline: string;
  resources: string[];
  milestones: Milestone[];
}

interface ImprovementPhase {
  phase: number;
  name: string;
  practices: string[];
  duration: string;
  dependencies: string[];
  deliverables: string[];
}

interface Milestone {
  id: string;
  name: string;
  targetDate: Date;
  criteria: string[];
  status: 'planned' | 'in-progress' | 'completed';
}

interface NISTSSFDFinding {
  id: string;
  practice: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  finding: string;
  currentTier: number;
  requiredTier: number;
  recommendation: string;
  status: 'open' | 'closed' | 'in-progress';
}

export class NISTSSFDValidator extends EventEmitter {
  private config: NISTSSFDConfig;
  private practices: Map<string, NISTSSFDPractice> = new Map();
  private assessmentHistory: NISTSSFDAssessment[] = [];
  private activeAssessment: NISTSSFDAssessment | null = null;

  constructor(config: NISTSSFDConfig) {
    super();
    this.config = config;
    this.initializeNISTSSFDPractices();
  }

  /**
   * Initialize NIST-SSDF v1.1 practices
   */
  private initializeNISTSSFDPractices(): void {
    // Prepare (PO) - Prepare the Organization
    const preparePractices: NISTSSFDPractice[] = [
      {
        id: 'PO.1.1',
        function: 'prepare',
        category: 'po',
        title: 'Define Security Requirements for Software Development',
        description: 'Define and document security requirements for all software development projects',
        implementation: {
          tier1: ['Basic security requirements documented'],
          tier2: ['Standardized security requirements with risk assessment'],
          tier3: ['Risk-based security requirements with threat modeling'],
          tier4: ['Comprehensive security requirements with continuous assessment']
        },
        outcomes: [
          'Security requirements are clearly defined',
          'Requirements are risk-based and measurable',
          'Requirements are integrated into development lifecycle'
        ],
        references: ['NIST SP 800-218', 'OWASP ASVS', 'ISO/IEC 27034'],
        assessmentCriteria: [
          'Security requirements documentation exists',
          'Requirements are risk-based',
          'Requirements are integrated into development process'
        ],
        evidenceRequirements: [
          'Security requirements documents',
          'Risk assessment reports',
          'Development process integration evidence'
        ],
        automatedTests: [
          'validate_security_requirements_docs',
          'check_risk_assessment_completion',
          'verify_process_integration'
        ],
        relatedPractices: ['PO.1.2', 'PO.1.3', 'PS.1.1']
      },
      {
        id: 'PO.1.2',
        function: 'prepare',
        category: 'po',
        title: 'Implement Roles and Responsibilities',
        description: 'Define and implement roles and responsibilities for secure software development',
        implementation: {
          tier1: ['Basic roles defined'],
          tier2: ['Detailed RACI matrix with security responsibilities'],
          tier3: ['Role-based security training and accountability'],
          tier4: ['Continuous role optimization with metrics']
        },
        outcomes: [
          'Security roles and responsibilities are clearly defined',
          'Personnel understand their security obligations',
          'Accountability mechanisms are in place'
        ],
        references: ['NIST SP 800-218', 'BSIMM'],
        assessmentCriteria: [
          'Roles and responsibilities documented',
          'Personnel receive appropriate training',
          'Accountability measures implemented'
        ],
        evidenceRequirements: [
          'Role definition documents',
          'Training completion records',
          'Accountability framework documentation'
        ],
        automatedTests: [
          'validate_role_definitions',
          'check_training_completion',
          'verify_accountability_mechanisms'
        ],
        relatedPractices: ['PO.1.1', 'PO.2.1', 'PS.3.1']
      },
      {
        id: 'PO.1.3',
        function: 'prepare',
        category: 'po',
        title: 'Support Toolchains with Security Features',
        description: 'Implement and maintain secure toolchains for software development',
        implementation: {
          tier1: ['Basic security tools integrated'],
          tier2: ['Comprehensive security toolchain with automation'],
          tier3: ['Advanced security toolchain with continuous monitoring'],
          tier4: ['AI-enhanced security toolchain with predictive capabilities']
        },
        outcomes: [
          'Security tools are integrated into development workflow',
          'Automated security testing is performed',
          'Toolchain security is continuously monitored'
        ],
        references: ['NIST SP 800-218', 'OWASP DevSecOps Guideline'],
        assessmentCriteria: [
          'Security tools integrated into toolchain',
          'Automated security testing implemented',
          'Toolchain security monitoring active'
        ],
        evidenceRequirements: [
          'Toolchain configuration documentation',
          'Automated testing reports',
          'Security monitoring logs'
        ],
        automatedTests: [
          'scan_toolchain_security',
          'validate_automated_testing',
          'check_monitoring_coverage'
        ],
        relatedPractices: ['PO.2.1', 'PW.1.1', 'PW.7.1']
      }
    ];

    // Protect (PS) - Protect the Software
    const protectPractices: NISTSSFDPractice[] = [
      {
        id: 'PS.1.1',
        function: 'protect',
        category: 'ps',
        title: 'Protect All Forms of Code from Unauthorized Access',
        description: 'Implement controls to protect source code, binaries, and related artifacts',
        implementation: {
          tier1: ['Basic access controls for code repositories'],
          tier2: ['Comprehensive code protection with encryption'],
          tier3: ['Advanced code protection with behavioral monitoring'],
          tier4: ['AI-enhanced code protection with predictive threat detection']
        },
        outcomes: [
          'Source code is protected from unauthorized access',
          'Code integrity is maintained throughout development lifecycle',
          'Access to code is logged and monitored'
        ],
        references: ['NIST SP 800-218', 'OWASP Code Review Guide'],
        assessmentCriteria: [
          'Access controls implemented for code repositories',
          'Code integrity verification in place',
          'Access monitoring and logging active'
        ],
        evidenceRequirements: [
          'Access control configuration',
          'Code integrity verification reports',
          'Access monitoring logs'
        ],
        automatedTests: [
          'validate_code_access_controls',
          'check_code_integrity',
          'verify_access_monitoring'
        ],
        relatedPractices: ['PS.2.1', 'PS.3.1', 'PO.1.2']
      },
      {
        id: 'PS.2.1',
        function: 'protect',
        category: 'ps',
        title: 'Provide Developers with Secure Coding Practices',
        description: 'Establish and maintain secure coding practices and guidelines',
        implementation: {
          tier1: ['Basic secure coding guidelines'],
          tier2: ['Comprehensive secure coding standards with training'],
          tier3: ['Advanced secure coding with automated enforcement'],
          tier4: ['AI-assisted secure coding with real-time guidance']
        },
        outcomes: [
          'Secure coding practices are defined and documented',
          'Developers receive secure coding training',
          'Secure coding practices are enforced through automation'
        ],
        references: ['OWASP Secure Coding Practices', 'CERT Secure Coding Standards'],
        assessmentCriteria: [
          'Secure coding guidelines documented',
          'Developer training program in place',
          'Automated enforcement mechanisms active'
        ],
        evidenceRequirements: [
          'Secure coding guidelines',
          'Training program documentation',
          'Automated enforcement reports'
        ],
        automatedTests: [
          'validate_coding_guidelines',
          'check_training_effectiveness',
          'verify_automated_enforcement'
        ],
        relatedPractices: ['PS.1.1', 'PS.3.1', 'PW.2.1']
      }
    ];

    // Produce (PW) - Produce Well-Secured Software
    const producePractices: NISTSSFDPractice[] = [
      {
        id: 'PW.1.1',
        function: 'produce',
        category: 'pw',
        title: 'Design Software to Meet Security Requirements',
        description: 'Incorporate security requirements into software design',
        implementation: {
          tier1: ['Basic security considerations in design'],
          tier2: ['Formal security design review process'],
          tier3: ['Threat modeling integrated into design'],
          tier4: ['AI-enhanced security design with continuous validation']
        },
        outcomes: [
          'Security requirements are incorporated into software design',
          'Security design reviews are conducted',
          'Threat modeling informs design decisions'
        ],
        references: ['NIST SP 800-218', 'OWASP SAMM', 'Microsoft SDL'],
        assessmentCriteria: [
          'Security requirements integrated into design',
          'Security design reviews conducted',
          'Threat modeling performed'
        ],
        evidenceRequirements: [
          'Security design documentation',
          'Design review reports',
          'Threat model artifacts'
        ],
        automatedTests: [
          'validate_security_design',
          'check_design_reviews',
          'verify_threat_modeling'
        ],
        relatedPractices: ['PW.1.2', 'PW.4.1', 'PO.1.1']
      },
      {
        id: 'PW.4.1',
        function: 'produce',
        category: 'pw',
        title: 'Implement Security Testing',
        description: 'Conduct comprehensive security testing throughout development',
        implementation: {
          tier1: ['Basic security testing'],
          tier2: ['Automated security testing in CI/CD'],
          tier3: ['Comprehensive security testing with multiple techniques'],
          tier4: ['AI-enhanced security testing with predictive analysis']
        },
        outcomes: [
          'Security testing is integrated into development process',
          'Multiple security testing techniques are employed',
          'Security testing results inform remediation efforts'
        ],
        references: ['OWASP Testing Guide', 'NIST SP 800-218'],
        assessmentCriteria: [
          'Security testing integrated into development',
          'Multiple testing techniques employed',
          'Test results drive remediation'
        ],
        evidenceRequirements: [
          'Security testing reports',
          'CI/CD integration evidence',
          'Remediation tracking records'
        ],
        automatedTests: [
          'validate_security_testing',
          'check_cicd_integration',
          'verify_remediation_tracking'
        ],
        relatedPractices: ['PW.4.4', 'PW.7.1', 'RV.1.1']
      },
      {
        id: 'PW.4.4',
        function: 'produce',
        category: 'pw',
        title: 'Review and/or Analyze Code for Vulnerabilities',
        description: 'Conduct systematic code review and analysis for security vulnerabilities',
        implementation: {
          tier1: ['Basic code review for security'],
          tier2: ['Automated static analysis integrated'],
          tier3: ['Comprehensive code analysis with multiple tools'],
          tier4: ['AI-enhanced code analysis with behavioral patterns']
        },
        outcomes: [
          'Code reviews include security considerations',
          'Automated vulnerability analysis is performed',
          'Vulnerability findings are tracked and remediated'
        ],
        references: ['OWASP Code Review Guide', 'NIST SP 800-218'],
        assessmentCriteria: [
          'Security code reviews conducted',
          'Automated vulnerability scanning active',
          'Vulnerability remediation tracked'
        ],
        evidenceRequirements: [
          'Code review reports',
          'Static analysis results',
          'Vulnerability remediation records'
        ],
        automatedTests: [
          'validate_code_reviews',
          'check_static_analysis',
          'verify_vulnerability_remediation'
        ],
        relatedPractices: ['PW.4.1', 'PW.7.1', 'PW.7.2']
      }
    ];

    // Respond (RV) - Respond to Vulnerabilities
    const respondPractices: NISTSSFDPractice[] = [
      {
        id: 'RV.1.1',
        function: 'respond',
        category: 'rv',
        title: 'Identify and Confirm Vulnerabilities',
        description: 'Establish processes to identify and confirm vulnerabilities in software',
        implementation: {
          tier1: ['Basic vulnerability identification process'],
          tier2: ['Formal vulnerability management program'],
          tier3: ['Advanced vulnerability intelligence with threat feeds'],
          tier4: ['AI-enhanced vulnerability prediction and confirmation']
        },
        outcomes: [
          'Vulnerabilities are systematically identified',
          'Vulnerability confirmation processes are in place',
          'Vulnerability intelligence informs security decisions'
        ],
        references: ['NIST SP 800-218', 'CVE Database', 'NVD'],
        assessmentCriteria: [
          'Vulnerability identification processes active',
          'Confirmation procedures documented',
          'Threat intelligence integrated'
        ],
        evidenceRequirements: [
          'Vulnerability identification reports',
          'Confirmation procedure documentation',
          'Threat intelligence integration evidence'
        ],
        automatedTests: [
          'validate_vulnerability_identification',
          'check_confirmation_processes',
          'verify_threat_intelligence'
        ],
        relatedPractices: ['RV.1.2', 'RV.2.1', 'PW.4.1']
      },
      {
        id: 'RV.1.2',
        function: 'respond',
        category: 'rv',
        title: 'Assess, Prioritize, and Remediate Vulnerabilities',
        description: 'Implement systematic vulnerability assessment and remediation processes',
        implementation: {
          tier1: ['Basic vulnerability prioritization'],
          tier2: ['Risk-based vulnerability management'],
          tier3: ['Advanced prioritization with business context'],
          tier4: ['AI-enhanced prioritization with predictive impact analysis']
        },
        outcomes: [
          'Vulnerabilities are assessed and prioritized based on risk',
          'Remediation efforts are prioritized appropriately',
          'Remediation progress is tracked and reported'
        ],
        references: ['CVSS', 'NIST SP 800-218', 'OWASP Risk Rating'],
        assessmentCriteria: [
          'Risk-based vulnerability assessment active',
          'Prioritization criteria documented',
          'Remediation tracking implemented'
        ],
        evidenceRequirements: [
          'Vulnerability assessment reports',
          'Prioritization criteria documentation',
          'Remediation tracking records'
        ],
        automatedTests: [
          'validate_risk_assessment',
          'check_prioritization_criteria',
          'verify_remediation_tracking'
        ],
        relatedPractices: ['RV.1.1', 'RV.2.2', 'RV.3.1']
      }
    ];

    // Store all practices
    const allPractices = [
      ...preparePractices,
      ...protectPractices,
      ...producePractices,
      ...respondPractices
    ];

    allPractices.forEach(practice => {
      this.practices.set(practice.id, practice);
    });

    this.emit('practices:initialized', {
      count: allPractices.length,
      functions: ['prepare', 'protect', 'produce', 'respond']
    });
  }

  /**
   * Validate NIST-SSDF practices
   */
  async validatePractices(config: any): Promise<NISTSSFDAssessment> {
    const assessmentId = `nist-ssdf-${Date.now()}`;
    const timestamp = new Date();

    this.activeAssessment = {
      assessmentId,
      timestamp,
      version: this.config.version,
      currentTier: config.implementationTiers?.current ? parseInt(config.implementationTiers.current.replace('tier', '')) : 1,
      targetTier: config.implementationTiers?.target ? parseInt(config.implementationTiers.target.replace('tier', '')) : 2,
      practices: [],
      functionResults: [],
      maturityLevel: 0,
      complianceScore: 0,
      gapAnalysis: {
        identifiedGaps: [],
        priority: 'medium',
        effortEstimate: '',
        resourceRequirements: []
      },
      improvementPlan: {
        phases: [],
        timeline: '',
        resources: [],
        milestones: []
      },
      findings: [],
      recommendations: [],
      evidencePackage: [],
      status: 'in-progress'
    };

    try {
      this.emit('assessment:started', { assessmentId, timestamp });

      // Assess practices by function
      for (const func of Object.keys(config.practices) as NISTSSFDFunction[]) {
        const functionPractices = config.practices[func];
        const functionAssessment = await this.assessFunction(func, functionPractices, config);

        this.activeAssessment.practices.push(...functionAssessment.practices);
        this.activeAssessment.functionResults.push(functionAssessment);
      }

      // Calculate overall metrics
      await this.calculateMetrics();

      // Perform gap analysis if enabled
      if (config.practiceAlignment?.gapAnalysis) {
        this.activeAssessment.gapAnalysis = await this.performGapAnalysis();
      }

      // Generate improvement plan if gaps identified
      if (this.activeAssessment.gapAnalysis.identifiedGaps.length > 0) {
        this.activeAssessment.improvementPlan = await this.generateImprovementPlan();
      }

      // Generate recommendations
      this.activeAssessment.recommendations = this.generateRecommendations();

      this.activeAssessment.status = 'completed';
      this.assessmentHistory.push({ ...this.activeAssessment });

      this.emit('assessment:completed', {
        assessmentId,
        maturityLevel: this.activeAssessment.maturityLevel,
        complianceScore: this.activeAssessment.complianceScore
      });

      return { ...this.activeAssessment };

    } catch (error) {
      this.activeAssessment.status = 'failed';
      this.emit('assessment:failed', { assessmentId, error: error.message });
      throw new Error(`NIST-SSDF assessment failed: ${error.message}`);
    }
  }

  /**
   * Assess practices within a function
   */
  private async assessFunction(func: NISTSSFDFunction, functionPractices: any, config: any): Promise<FunctionAssessment> {
    const practices: PracticeAssessment[] = [];
    const gaps: string[] = [];

    for (const category of Object.keys(functionPractices)) {
      const practiceIds = functionPractices[category];

      for (const practiceId of practiceIds) {
        const practice = this.practices.get(practiceId);
        if (practice) {
          const assessment = await this.assessPractice(practice, config);
          practices.push(assessment);

          if (assessment.gapIdentified) {
            gaps.push(`${practiceId}: Gap identified in implementation tier`);
          }
        }
      }
    }

    const overallScore = practices.length > 0
      ? practices.reduce((sum, p) => sum + p.score, 0) / practices.length
      : 0;

    const maturityLevel = this.calculateFunctionMaturityLevel(practices);

    return {
      function: func,
      practices,
      overallScore,
      maturityLevel,
      gaps,
      recommendations: this.generateFunctionRecommendations(func, practices)
    };
  }

  /**
   * Assess individual practice
   */
  private async assessPractice(practice: NISTSSFDPractice, config: any): Promise<PracticeAssessment> {
    const assessment: PracticeAssessment = {
      controlId: practice.id,
      description: practice.description,
      status: 'not-assessed',
      score: 0,
      findings: [],
      evidence: [],
      testResults: [],
      timestamp: new Date(),
      practice,
      currentTier: 1,
      targetTier: config.implementationTiers?.target ? parseInt(config.implementationTiers.target.replace('tier', '')) : 2,
      maturityScore: 0,
      gapIdentified: false
    };

    try {
      // Run automated tests if available
      if (config.practiceValidation && practice.automatedTests.length > 0) {
        const automatedResults = await this.runAutomatedPracticeTests(practice.automatedTests);
        assessment.testResults = automatedResults;
      }

      // Assess current implementation tier
      assessment.currentTier = await this.assessImplementationTier(practice);
      assessment.maturityScore = (assessment.currentTier / 4) * 100;

      // Calculate overall score
      const testScore = assessment.testResults.length > 0
        ? assessment.testResults.filter(t => t.result === 'pass').length / assessment.testResults.length * 100
        : assessment.maturityScore;

      assessment.score = (testScore + assessment.maturityScore) / 2;

      // Check for gaps
      assessment.gapIdentified = assessment.currentTier < assessment.targetTier;

      // Determine status
      if (assessment.currentTier >= assessment.targetTier && assessment.score >= 85) {
        assessment.status = 'compliant';
      } else if (assessment.score >= 70) {
        assessment.status = 'partially-compliant';
      } else {
        assessment.status = 'non-compliant';
      }

      // Collect evidence
      assessment.evidence = await this.collectPracticeEvidence(practice);

      // Generate findings if needed
      if (assessment.gapIdentified) {
        const finding: NISTSSFDFinding = {
          id: `finding-${practice.id}-${Date.now()}`,
          practice: practice.id,
          severity: this.determineFindingSeverity(practice, assessment.currentTier, assessment.targetTier),
          finding: `Practice ${practice.id} is at tier ${assessment.currentTier} but target is tier ${assessment.targetTier}`,
          currentTier: assessment.currentTier,
          requiredTier: assessment.targetTier,
          recommendation: this.generatePracticeRecommendation(practice, assessment),
          status: 'open'
        };

        this.activeAssessment?.findings.push(finding);
      }

      return assessment;

    } catch (error) {
      assessment.status = 'not-assessed';
      assessment.findings.push(`Assessment error: ${error.message}`);
      return assessment;
    }
  }

  /**
   * Assess implementation tier for practice
   */
  private async assessImplementationTier(practice: NISTSSFDPractice): Promise<number> {
    // Mock implementation tier assessment - in production would integrate with various tools
    const mockTierAssessment = {
      'PO.1.1': 2, // Has risk assessment
      'PO.1.2': 3, // Has role-based training
      'PO.1.3': 2, // Has comprehensive toolchain
      'PS.1.1': 3, // Has advanced code protection
      'PS.2.1': 2, // Has comprehensive standards
      'PW.1.1': 2, // Has formal design review
      'PW.4.1': 3, // Has comprehensive testing
      'PW.4.4': 2, // Has automated analysis
      'RV.1.1': 2, // Has formal program
      'RV.1.2': 2  // Has risk-based management
    };

    return mockTierAssessment[practice.id] || 1;
  }

  /**
   * Run automated tests for practice
   */
  private async runAutomatedPracticeTests(tests: string[]): Promise<any[]> {
    const results = [];

    for (const test of tests) {
      try {
        const result = await this.executeAutomatedPracticeTest(test);
        results.push({
          test,
          result: result.passed ? 'pass' : 'fail',
          details: result.details,
          timestamp: new Date()
        });
      } catch (error) {
        results.push({
          test,
          result: 'error',
          details: error.message,
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Execute individual automated practice test
   */
  private async executeAutomatedPracticeTest(testName: string): Promise<any> {
    // Mock test execution - in reality would integrate with DevSecOps tools
    const mockResults = {
      validate_security_requirements_docs: { passed: true, details: 'Security requirements documented' },
      check_risk_assessment_completion: { passed: true, details: 'Risk assessments completed' },
      verify_process_integration: { passed: false, details: 'Integration gaps identified' },
      validate_role_definitions: { passed: true, details: 'Roles clearly defined' },
      check_training_completion: { passed: true, details: 'Training up to date' },
      verify_accountability_mechanisms: { passed: true, details: 'Accountability in place' },
      scan_toolchain_security: { passed: true, details: 'Toolchain secure' },
      validate_automated_testing: { passed: false, details: 'Some tests missing' },
      check_monitoring_coverage: { passed: true, details: 'Monitoring comprehensive' }
    };

    return mockResults[testName] || { passed: false, details: 'Test not implemented' };
  }

  /**
   * Calculate overall assessment metrics
   */
  private async calculateMetrics(): Promise<void> {
    if (!this.activeAssessment) return;

    // Calculate overall compliance score
    const totalPractices = this.activeAssessment.practices.length;
    const compliantPractices = this.activeAssessment.practices.filter(p => p.status === 'compliant').length;
    this.activeAssessment.complianceScore = totalPractices > 0 ? (compliantPractices / totalPractices) * 100 : 0;

    // Calculate overall maturity level
    const totalMaturityScore = this.activeAssessment.practices.reduce((sum, p) => sum + p.maturityScore, 0);
    const avgMaturityScore = totalPractices > 0 ? totalMaturityScore / totalPractices : 0;
    this.activeAssessment.maturityLevel = Math.ceil(avgMaturityScore / 25); // Convert to 1-4 scale
  }

  /**
   * Perform gap analysis
   */
  private async performGapAnalysis(): Promise<GapAnalysisResult> {
    if (!this.activeAssessment) {
      return { identifiedGaps: [], priority: 'low', effortEstimate: '', resourceRequirements: [] };
    }

    const gaps: Gap[] = [];

    for (const practice of this.activeAssessment.practices) {
      if (practice.gapIdentified) {
        gaps.push({
          practiceId: practice.practice.id,
          currentState: `Tier ${practice.currentTier}`,
          desiredState: `Tier ${practice.targetTier}`,
          priority: this.determineFindingSeverity(practice.practice, practice.currentTier, practice.targetTier),
          effortEstimate: this.estimateEffort(practice.currentTier, practice.targetTier),
          dependencies: practice.practice.relatedPractices
        });
      }
    }

    const overallPriority = gaps.some(g => g.priority === 'critical') ? 'critical' :
                           gaps.some(g => g.priority === 'high') ? 'high' :
                           gaps.some(g => g.priority === 'medium') ? 'medium' : 'low';

    return {
      identifiedGaps: gaps,
      priority: overallPriority,
      effortEstimate: this.calculateOverallEffort(gaps),
      resourceRequirements: this.identifyResourceRequirements(gaps)
    };
  }

  /**
   * Generate improvement plan
   */
  private async generateImprovementPlan(): Promise<ImprovementPlan> {
    if (!this.activeAssessment) {
      return { phases: [], timeline: '', resources: [], milestones: [] };
    }

    const gaps = this.activeAssessment.gapAnalysis.identifiedGaps;
    const phases: ImprovementPhase[] = [];

    // Group gaps by priority and create phases
    const criticalGaps = gaps.filter(g => g.priority === 'critical');
    const highGaps = gaps.filter(g => g.priority === 'high');
    const mediumGaps = gaps.filter(g => g.priority === 'medium');

    if (criticalGaps.length > 0) {
      phases.push({
        phase: 1,
        name: 'Critical Gap Remediation',
        practices: criticalGaps.map(g => g.practiceId),
        duration: '3 months',
        dependencies: [],
        deliverables: ['Critical practice implementations', 'Security baseline establishment']
      });
    }

    if (highGaps.length > 0) {
      phases.push({
        phase: phases.length + 1,
        name: 'High Priority Improvements',
        practices: highGaps.map(g => g.practiceId),
        duration: '6 months',
        dependencies: phases.length > 0 ? [`Phase ${phases.length}`] : [],
        deliverables: ['Enhanced security practices', 'Process automation']
      });
    }

    if (mediumGaps.length > 0) {
      phases.push({
        phase: phases.length + 1,
        name: 'Maturity Enhancement',
        practices: mediumGaps.map(g => g.practiceId),
        duration: '9 months',
        dependencies: phases.length > 0 ? [`Phase ${phases.length}`] : [],
        deliverables: ['Advanced security capabilities', 'Continuous improvement']
      });
    }

    const milestones: Milestone[] = phases.map((phase, index) => ({
      id: `milestone-${index + 1}`,
      name: `${phase.name} Completion`,
      targetDate: new Date(Date.now() + (index + 1) * 90 * 24 * 60 * 60 * 1000),
      criteria: phase.deliverables,
      status: 'planned'
    }));

    return {
      phases,
      timeline: `${phases.length * 3} months`,
      resources: this.activeAssessment.gapAnalysis.resourceRequirements,
      milestones
    };
  }

  /**
   * Calculate function maturity level
   */
  private calculateFunctionMaturityLevel(practices: PracticeAssessment[]): number {
    const avgTier = practices.reduce((sum, p) => sum + p.currentTier, 0) / practices.length;
    return Math.round(avgTier);
  }

  /**
   * Determine finding severity
   */
  private determineFindingSeverity(practice: NISTSSFDPractice, currentTier: number, targetTier: number): 'low' | 'medium' | 'high' | 'critical' {
    const gapSize = targetTier - currentTier;

    if (gapSize >= 3) return 'critical';
    if (gapSize >= 2) return 'high';
    if (gapSize >= 1) return 'medium';
    return 'low';
  }

  /**
   * Estimate effort for gap closure
   */
  private estimateEffort(currentTier: number, targetTier: number): string {
    const gapSize = targetTier - currentTier;
    const effortMapping = {
      1: '1-2 months',
      2: '3-6 months',
      3: '6-12 months'
    };
    return effortMapping[gapSize] || '1 month';
  }

  /**
   * Calculate overall effort
   */
  private calculateOverallEffort(gaps: Gap[]): string {
    const totalMonths = gaps.reduce((total, gap) => {
      const months = parseInt(gap.effortEstimate.split('-')[0]) || 1;
      return total + months;
    }, 0);

    return `${totalMonths} person-months`;
  }

  /**
   * Identify resource requirements
   */
  private identifyResourceRequirements(gaps: Gap[]): string[] {
    const requirements = new Set<string>();

    gaps.forEach(gap => {
      requirements.add('Security architects');
      requirements.add('DevSecOps engineers');
      if (gap.priority === 'critical') {
        requirements.add('Security consultants');
      }
      if (gap.practiceId.startsWith('PW')) {
        requirements.add('Software developers');
        requirements.add('Security testing tools');
      }
      if (gap.practiceId.startsWith('RV')) {
        requirements.add('Incident response team');
        requirements.add('Vulnerability management tools');
      }
    });

    return Array.from(requirements);
  }

  /**
   * Generate function-specific recommendations
   */
  private generateFunctionRecommendations(func: NISTSSFDFunction, practices: PracticeAssessment[]): string[] {
    const recommendations: string[] = [];
    const gappedPractices = practices.filter(p => p.gapIdentified);

    if (gappedPractices.length > 0) {
      recommendations.push(`Address ${gappedPractices.length} practice gaps in ${func} function`);
    }

    switch (func) {
      case 'prepare':
        recommendations.push('Enhance organizational security foundation');
        break;
      case 'protect':
        recommendations.push('Strengthen code protection mechanisms');
        break;
      case 'produce':
        recommendations.push('Improve security testing and review processes');
        break;
      case 'respond':
        recommendations.push('Enhance vulnerability response capabilities');
        break;
    }

    return recommendations;
  }

  /**
   * Generate practice-specific recommendation
   */
  private generatePracticeRecommendation(practice: NISTSSFDPractice, assessment: PracticeAssessment): string {
    const targetTierRequirements = practice.implementation[`tier${assessment.targetTier}`] || [];
    return `To reach tier ${assessment.targetTier}: ${targetTierRequirements.join('; ')}`;
  }

  /**
   * Collect evidence for practice
   */
  private async collectPracticeEvidence(practice: NISTSSFDPractice): Promise<string[]> {
    return practice.evidenceRequirements.map(req =>
      `Evidence collected for ${req} - ${practice.title}`
    );
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(): string[] {
    if (!this.activeAssessment) return [];

    const recommendations = [];
    const criticalGaps = this.activeAssessment.gapAnalysis.identifiedGaps.filter(g => g.priority === 'critical');
    const highGaps = this.activeAssessment.gapAnalysis.identifiedGaps.filter(g => g.priority === 'high');

    if (criticalGaps.length > 0) {
      recommendations.push(`Immediately address ${criticalGaps.length} critical practice gaps`);
    }

    if (highGaps.length > 0) {
      recommendations.push(`Prioritize ${highGaps.length} high-priority practice improvements`);
    }

    recommendations.push('Implement continuous NIST-SSDF practice monitoring');
    recommendations.push('Establish regular maturity assessments');
    recommendations.push('Integrate security practices into DevSecOps pipeline');

    return recommendations;
  }

  /**
   * Get assessment history
   */
  getAssessmentHistory(): NISTSSFDAssessment[] {
    return [...this.assessmentHistory];
  }

  /**
   * Get current assessment
   */
  getCurrentAssessment(): NISTSSFDAssessment | null {
    return this.activeAssessment;
  }

  /**
   * Get practices by function
   */
  getPracticesByFunction(func: NISTSSFDFunction): NISTSSFDPractice[] {
    return Array.from(this.practices.values()).filter(p => p.function === func);
  }

  /**
   * Get all practices
   */
  getAllPractices(): NISTSSFDPractice[] {
    return Array.from(this.practices.values());
  }
}

export default NISTSSFDValidator;