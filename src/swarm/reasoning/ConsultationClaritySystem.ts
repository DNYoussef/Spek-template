import { EventEmitter } from 'events';

/**
 * Consultation Clarity System
 *
 * Provides intelligent requirement clarification, ambiguity detection,
 * and decision logging for swarm coordination and project management.
 * Integrates with GitHub Project Manager and Rationalist Reasoning Engine.
 */

export interface Requirement {
  id: string;
  text: string;
  source: 'spec' | 'plan' | 'issue' | 'pr' | 'conversation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  domain: string[];
  timestamp: Date;
  context: Record<string, any>;
}

export interface Ambiguity {
  id: string;
  requirementId: string;
  type: 'semantic' | 'scope' | 'dependency' | 'acceptance_criteria' | 'technical_detail';
  description: string;
  severity: 'blocking' | 'concerning' | 'minor';
  suggestions: string[];
  examples: string[];
  relatedRequirements: string[];
}

export interface Clarification {
  id: string;
  ambiguityId: string;
  question: string;
  context: string;
  suggestedAnswers: string[];
  decisionCriteria: string[];
  stakeholders: string[];
  urgency: 'immediate' | 'same_day' | 'within_week' | 'non_urgent';
}

export interface Decision {
  id: string;
  clarificationId: string;
  decision: string;
  reasoning: string;
  confidence: number;
  evidence: string[];
  alternatives: string[];
  risks: string[];
  implementationNotes: string[];
  reviewers: string[];
  timestamp: Date;
}

export interface ConsultationSession {
  id: string;
  swarmId: string;
  type: 'development' | 'debug' | 'planning' | 'review';
  requirements: Requirement[];
  ambiguities: Ambiguity[];
  clarifications: Clarification[];
  decisions: Decision[];
  status: 'active' | 'pending_review' | 'completed' | 'blocked';
  participants: string[];
  startTime: Date;
  endTime?: Date;
  summary: string;
}

export interface ClarityMetrics {
  requirementClarity: number;
  ambiguityResolutionRate: number;
  decisionConfidence: number;
  stakeholderAlignment: number;
  implementationReadiness: number;
}

export interface StakeholderPreferences {
  communicationStyle: 'technical' | 'business' | 'mixed';
  detailLevel: 'high' | 'medium' | 'low';
  responseFormat: 'structured' | 'narrative' | 'bullet_points';
  domains: string[];
  decisionAuthority: string[];
}

export class ConsultationClaritySystem extends EventEmitter {
  private sessions: Map<string, ConsultationSession> = new Map();
  private requirements: Map<string, Requirement> = new Map();
  private ambiguities: Map<string, Ambiguity> = new Map();
  private clarifications: Map<string, Clarification> = new Map();
  private decisions: Map<string, Decision> = new Map();
  private stakeholders: Map<string, StakeholderPreferences> = new Map();
  private templates: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeTemplates();
    this.setupEventHandlers();
  }

  /**
   * Initialize consultation session for swarm coordination
   */
  async initializeSession(
    swarmId: string,
    type: 'development' | 'debug' | 'planning' | 'review',
    initialRequirements: Requirement[]
  ): Promise<ConsultationSession> {
    const sessionId = `session_${swarmId}_${Date.now()}`;

    const session: ConsultationSession = {
      id: sessionId,
      swarmId,
      type,
      requirements: initialRequirements,
      ambiguities: [],
      clarifications: [],
      decisions: [],
      status: 'active',
      participants: [],
      startTime: new Date(),
      summary: ''
    };

    this.sessions.set(sessionId, session);

    // Store requirements
    for (const req of initialRequirements) {
      this.requirements.set(req.id, req);
    }

    // Immediate ambiguity detection
    const detectedAmbiguities = await this.detectAmbiguities(initialRequirements);
    session.ambiguities = detectedAmbiguities;

    for (const ambiguity of detectedAmbiguities) {
      this.ambiguities.set(ambiguity.id, ambiguity);
    }

    this.emit('sessionInitialized', { sessionId, session });

    return session;
  }

  /**
   * Detect ambiguities in requirements using multiple analysis techniques
   */
  async detectAmbiguities(requirements: Requirement[]): Promise<Ambiguity[]> {
    const ambiguities: Ambiguity[] = [];

    for (const req of requirements) {
      // Semantic ambiguity detection
      const semanticAmbiguities = this.detectSemanticAmbiguities(req);
      ambiguities.push(...semanticAmbiguities);

      // Scope ambiguity detection
      const scopeAmbiguities = this.detectScopeAmbiguities(req);
      ambiguities.push(...scopeAmbiguities);

      // Dependency ambiguity detection
      const dependencyAmbiguities = this.detectDependencyAmbiguities(req, requirements);
      ambiguities.push(...dependencyAmbiguities);

      // Acceptance criteria ambiguity detection
      const acceptanceAmbiguities = this.detectAcceptanceCriteriaAmbiguities(req);
      ambiguities.push(...acceptanceAmbiguities);

      // Technical detail ambiguity detection
      const technicalAmbiguities = this.detectTechnicalDetailAmbiguities(req);
      ambiguities.push(...technicalAmbiguities);
    }

    // Rank ambiguities by severity and impact
    return this.rankAmbiguities(ambiguities);
  }

  /**
   * Detect semantic ambiguities using NLP-style analysis
   */
  private detectSemanticAmbiguities(requirement: Requirement): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];
    const text = requirement.text.toLowerCase();

    // Vague quantifiers
    const vageQuantifiers = ['some', 'many', 'few', 'several', 'most', 'various', 'multiple'];
    const foundVague = vageQuantifiers.filter(vq => text.includes(vq));

    if (foundVague.length > 0) {
      ambiguities.push({
        id: `amb_semantic_vague_${requirement.id}_${Date.now()}`,
        requirementId: requirement.id,
        type: 'semantic',
        description: `Vague quantifiers detected: ${foundVague.join(', ')}`,
        severity: 'concerning',
        suggestions: [
          'Replace with specific numbers or ranges',
          'Define quantifiers in a glossary',
          'Use percentage-based criteria'
        ],
        examples: [
          '"some users"  "at least 80% of users"',
          '"many features"  "15-20 features"',
          '"few errors"  "< 5 errors per 1000 requests"'
        ],
        relatedRequirements: []
      });
    }

    // Ambiguous pronouns
    const pronouns = ['it', 'this', 'that', 'they', 'them'];
    const pronounPattern = new RegExp(`\\b(${pronouns.join('|')})\\b`, 'gi');
    const pronounMatches = text.match(pronounPattern);

    if (pronounMatches && pronounMatches.length > 2) {
      ambiguities.push({
        id: `amb_semantic_pronouns_${requirement.id}_${Date.now()}`,
        requirementId: requirement.id,
        type: 'semantic',
        description: 'Multiple ambiguous pronouns may create confusion',
        severity: 'minor',
        suggestions: [
          'Replace pronouns with specific nouns',
          'Restructure sentences for clarity',
          'Use bullet points for complex requirements'
        ],
        examples: [
          '"When it processes this"  "When the system processes the user request"'
        ],
        relatedRequirements: []
      });
    }

    // Modal verbs indicating uncertainty
    const modalVerbs = ['should', 'could', 'might', 'may', 'would'];
    const foundModals = modalVerbs.filter(mv => text.includes(mv));

    if (foundModals.length > 0) {
      ambiguities.push({
        id: `amb_semantic_modals_${requirement.id}_${Date.now()}`,
        requirementId: requirement.id,
        type: 'semantic',
        description: `Uncertain modal verbs detected: ${foundModals.join(', ')}`,
        severity: 'concerning',
        suggestions: [
          'Use "must" or "shall" for requirements',
          'Use "will" for definite features',
          'Clarify optional vs required functionality'
        ],
        examples: [
          '"should validate"  "must validate"',
          '"might include"  "will include" or "may optionally include"'
        ],
        relatedRequirements: []
      });
    }

    return ambiguities;
  }

  /**
   * Detect scope ambiguities
   */
  private detectScopeAmbiguities(requirement: Requirement): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];
    const text = requirement.text;

    // Missing boundaries
    if (!text.match(/\b(only|except|excluding|limited to|within|outside)\b/i)) {
      if (text.length > 100 && !text.includes('scope')) {
        ambiguities.push({
          id: `amb_scope_boundaries_${requirement.id}_${Date.now()}`,
          requirementId: requirement.id,
          type: 'scope',
          description: 'No explicit scope boundaries defined',
          severity: 'concerning',
          suggestions: [
            'Define what is included and excluded',
            'Set clear functional boundaries',
            'Specify edge cases and limitations'
          ],
          examples: [
            'Add: "This feature applies only to authenticated users"',
            'Add: "Excluding admin functionality"',
            'Add: "Limited to the first 1000 results"'
          ],
          relatedRequirements: []
        });
      }
    }

    // Cross-cutting concerns
    const crossCuttingKeywords = ['all', 'every', 'entire', 'complete', 'full', 'across'];
    const foundCrossCutting = crossCuttingKeywords.filter(cc => text.toLowerCase().includes(cc));

    if (foundCrossCutting.length > 0) {
      ambiguities.push({
        id: `amb_scope_crosscutting_${requirement.id}_${Date.now()}`,
        requirementId: requirement.id,
        type: 'scope',
        description: `Potentially broad cross-cutting requirement: ${foundCrossCutting.join(', ')}`,
        severity: 'blocking',
        suggestions: [
          'Break into specific component requirements',
          'Define affected modules explicitly',
          'Create phase-based implementation plan'
        ],
        examples: [
          '"All components"  List specific components',
          '"Entire system"  Define system boundaries',
          '"Complete redesign"  Specify affected areas'
        ],
        relatedRequirements: []
      });
    }

    return ambiguities;
  }

  /**
   * Detect dependency ambiguities
   */
  private detectDependencyAmbiguities(requirement: Requirement, allRequirements: Requirement[]): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];

    // Implicit dependencies
    const dependencyKeywords = ['after', 'before', 'once', 'when', 'requires', 'depends', 'assuming'];
    const foundDependencies = dependencyKeywords.filter(dk =>
      requirement.text.toLowerCase().includes(dk)
    );

    if (foundDependencies.length > 0) {
      // Check if dependencies are explicit
      const hasExplicitDeps = requirement.context.dependencies &&
                             Array.isArray(requirement.context.dependencies);

      if (!hasExplicitDeps) {
        ambiguities.push({
          id: `amb_dependency_implicit_${requirement.id}_${Date.now()}`,
          requirementId: requirement.id,
          type: 'dependency',
          description: `Implicit dependencies detected: ${foundDependencies.join(', ')}`,
          severity: 'blocking',
          suggestions: [
            'Explicitly list all dependency requirements',
            'Create dependency graph',
            'Define prerequisite conditions'
          ],
          examples: [
            '"Once login is complete"  Add dependency on REQ-AUTH-001',
            '"When database is ready"  Add dependency on REQ-DB-001'
          ],
          relatedRequirements: []
        });
      }
    }

    // Circular dependency detection
    const relatedReqs = allRequirements.filter(r =>
      requirement.domain.some(d => r.domain.includes(d)) && r.id !== requirement.id
    );

    for (const related of relatedReqs) {
      if (requirement.text.toLowerCase().includes(related.id.toLowerCase()) &&
          related.text.toLowerCase().includes(requirement.id.toLowerCase())) {
        ambiguities.push({
          id: `amb_dependency_circular_${requirement.id}_${related.id}_${Date.now()}`,
          requirementId: requirement.id,
          type: 'dependency',
          description: `Potential circular dependency with ${related.id}`,
          severity: 'blocking',
          suggestions: [
            'Review dependency chain',
            'Refactor to eliminate circular references',
            'Create intermediate requirements'
          ],
          examples: [],
          relatedRequirements: [related.id]
        });
      }
    }

    return ambiguities;
  }

  /**
   * Detect acceptance criteria ambiguities
   */
  private detectAcceptanceCriteriaAmbiguities(requirement: Requirement): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];
    const text = requirement.text;

    // Missing testable criteria
    const testableKeywords = ['verify', 'test', 'validate', 'confirm', 'measure', 'check'];
    const hasTestableLanguage = testableKeywords.some(tk =>
      text.toLowerCase().includes(tk)
    );

    if (!hasTestableLanguage && !requirement.context.acceptanceCriteria) {
      ambiguities.push({
        id: `amb_acceptance_missing_${requirement.id}_${Date.now()}`,
        requirementId: requirement.id,
        type: 'acceptance_criteria',
        description: 'No clear testable acceptance criteria defined',
        severity: 'blocking',
        suggestions: [
          'Define specific, measurable acceptance criteria',
          'Use Given-When-Then format',
          'Include performance and quality criteria'
        ],
        examples: [
          'Given a user login, When they enter valid credentials, Then they access the dashboard within 2 seconds',
          'The system must handle 1000 concurrent users with <200ms response time'
        ],
        relatedRequirements: []
      });
    }

    // Subjective quality terms
    const subjectiveTerms = ['good', 'better', 'best', 'nice', 'clean', 'elegant', 'user-friendly', 'intuitive'];
    const foundSubjective = subjectiveTerms.filter(st =>
      text.toLowerCase().includes(st)
    );

    if (foundSubjective.length > 0) {
      ambiguities.push({
        id: `amb_acceptance_subjective_${requirement.id}_${Date.now()}`,
        requirementId: requirement.id,
        type: 'acceptance_criteria',
        description: `Subjective quality terms detected: ${foundSubjective.join(', ')}`,
        severity: 'concerning',
        suggestions: [
          'Replace with measurable criteria',
          'Define quality metrics',
          'Use user testing criteria'
        ],
        examples: [
          '"user-friendly"  "90% of users complete task in <5 minutes"',
          '"good performance"  "responds within 200ms for 95% of requests"'
        ],
        relatedRequirements: []
      });
    }

    return ambiguities;
  }

  /**
   * Detect technical detail ambiguities
   */
  private detectTechnicalDetailAmbiguities(requirement: Requirement): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];
    const text = requirement.text;

    // Missing technical constraints
    const technicalAreas = ['performance', 'security', 'scalability', 'compatibility', 'infrastructure'];
    const mentionedAreas = technicalAreas.filter(ta =>
      text.toLowerCase().includes(ta)
    );

    if (mentionedAreas.length > 0 && !requirement.context.technicalConstraints) {
      ambiguities.push({
        id: `amb_technical_constraints_${requirement.id}_${Date.now()}`,
        requirementId: requirement.id,
        type: 'technical_detail',
        description: `Technical areas mentioned without specific constraints: ${mentionedAreas.join(', ')}`,
        severity: 'concerning',
        suggestions: [
          'Define specific technical constraints',
          'Specify performance requirements',
          'List compatibility requirements'
        ],
        examples: [
          '"secure"  "AES-256 encryption, HTTPS only"',
          '"scalable"  "Support 10x current load"',
          '"compatible"  "Works with Chrome 90+, Firefox 88+"'
        ],
        relatedRequirements: []
      });
    }

    // Technology stack ambiguity
    const techKeywords = ['database', 'api', 'service', 'framework', 'library', 'platform'];
    const mentionedTech = techKeywords.filter(tk =>
      text.toLowerCase().includes(tk)
    );

    if (mentionedTech.length > 0 && !requirement.context.technologyStack) {
      ambiguities.push({
        id: `amb_technical_stack_${requirement.id}_${Date.now()}`,
        requirementId: requirement.id,
        type: 'technical_detail',
        description: `Technology mentioned without specific implementation details`,
        severity: 'concerning',
        suggestions: [
          'Specify exact technologies to use',
          'Define version requirements',
          'List integration requirements'
        ],
        examples: [
          '"database"  "PostgreSQL 13+"',
          '"API"  "REST API with OpenAPI 3.0 specification"'
        ],
        relatedRequirements: []
      });
    }

    return ambiguities;
  }

  /**
   * Rank ambiguities by severity and impact
   */
  private rankAmbiguities(ambiguities: Ambiguity[]): Ambiguity[] {
    return ambiguities.sort((a, b) => {
      const severityWeight = {
        'blocking': 3,
        'concerning': 2,
        'minor': 1
      };

      const aWeight = severityWeight[a.severity];
      const bWeight = severityWeight[b.severity];

      if (aWeight !== bWeight) {
        return bWeight - aWeight; // Higher severity first
      }

      // Secondary sort by number of suggestions (more suggestions = more complex)
      return b.suggestions.length - a.suggestions.length;
    });
  }

  /**
   * Generate clarification questions for ambiguities
   */
  async generateClarifications(sessionId: string, ambiguityIds: string[]): Promise<Clarification[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const clarifications: Clarification[] = [];

    for (const ambiguityId of ambiguityIds) {
      const ambiguity = this.ambiguities.get(ambiguityId);
      if (!ambiguity) continue;

      const requirement = this.requirements.get(ambiguity.requirementId);
      if (!requirement) continue;

      const clarification = await this.generateClarificationForAmbiguity(ambiguity, requirement);
      clarifications.push(clarification);
      this.clarifications.set(clarification.id, clarification);
    }

    session.clarifications.push(...clarifications);
    this.emit('clarificationsGenerated', { sessionId, clarifications });

    return clarifications;
  }

  /**
   * Generate specific clarification for an ambiguity
   */
  private async generateClarificationForAmbiguity(
    ambiguity: Ambiguity,
    requirement: Requirement
  ): Promise<Clarification> {
    const clarificationId = `clarification_${ambiguity.id}_${Date.now()}`;

    let question: string;
    let suggestedAnswers: string[] = [];
    let decisionCriteria: string[] = [];

    switch (ambiguity.type) {
      case 'semantic':
        question = `In requirement "${requirement.text}", ${ambiguity.description}. How should we interpret this precisely?`;
        suggestedAnswers = ambiguity.examples;
        decisionCriteria = [
          'Precision and measurability',
          'Consistency with other requirements',
          'Implementation feasibility'
        ];
        break;

      case 'scope':
        question = `The scope of requirement "${requirement.text}" needs clarification. ${ambiguity.description}. What are the exact boundaries?`;
        suggestedAnswers = [
          'List specific inclusions and exclusions',
          'Define affected components',
          'Set clear limits and constraints'
        ];
        decisionCriteria = [
          'Business value vs implementation cost',
          'Technical feasibility',
          'Resource availability'
        ];
        break;

      case 'dependency':
        question = `Requirement "${requirement.text}" has ${ambiguity.description}. What are the specific dependencies and their order?`;
        suggestedAnswers = [
          'Create explicit dependency list',
          'Define prerequisite conditions',
          'Map dependency chain'
        ];
        decisionCriteria = [
          'Dependency correctness',
          'Implementation order optimization',
          'Risk mitigation'
        ];
        break;

      case 'acceptance_criteria':
        question = `Requirement "${requirement.text}" needs testable acceptance criteria. ${ambiguity.description}. How will we verify completion?`;
        suggestedAnswers = ambiguity.examples;
        decisionCriteria = [
          'Testability and automation',
          'User value measurement',
          'Quality gates alignment'
        ];
        break;

      case 'technical_detail':
        question = `Requirement "${requirement.text}" mentions technical aspects but ${ambiguity.description}. What are the specific technical requirements?`;
        suggestedAnswers = ambiguity.examples;
        decisionCriteria = [
          'Technical accuracy',
          'Architecture compatibility',
          'Performance implications'
        ];
        break;

      default:
        question = `Requirement "${requirement.text}" has an ambiguity: ${ambiguity.description}. How should we resolve this?`;
        suggestedAnswers = ambiguity.suggestions;
        decisionCriteria = ['Clarity', 'Feasibility', 'Consistency'];
    }

    const urgency = this.determineUrgency(ambiguity, requirement);
    const stakeholders = this.identifyStakeholders(requirement);

    return {
      id: clarificationId,
      ambiguityId: ambiguity.id,
      question,
      context: `Requirement: ${requirement.text}\nAmbiguity: ${ambiguity.description}\nSeverity: ${ambiguity.severity}`,
      suggestedAnswers,
      decisionCriteria,
      stakeholders,
      urgency
    };
  }

  /**
   * Determine urgency level for clarification
   */
  private determineUrgency(ambiguity: Ambiguity, requirement: Requirement): 'immediate' | 'same_day' | 'within_week' | 'non_urgent' {
    if (ambiguity.severity === 'blocking') {
      return requirement.priority === 'critical' ? 'immediate' : 'same_day';
    }

    if (ambiguity.severity === 'concerning') {
      return requirement.priority === 'high' ? 'same_day' : 'within_week';
    }

    return 'non_urgent';
  }

  /**
   * Identify stakeholders for a requirement
   */
  private identifyStakeholders(requirement: Requirement): string[] {
    const stakeholders: string[] = [];

    // Domain-based stakeholder identification
    for (const domain of requirement.domain) {
      switch (domain.toLowerCase()) {
        case 'auth':
        case 'security':
          stakeholders.push('security_team', 'backend_team');
          break;
        case 'ui':
        case 'frontend':
          stakeholders.push('frontend_team', 'design_team', 'product_manager');
          break;
        case 'api':
        case 'backend':
          stakeholders.push('backend_team', 'architecture_team');
          break;
        case 'database':
        case 'data':
          stakeholders.push('backend_team', 'data_team');
          break;
        case 'performance':
          stakeholders.push('architecture_team', 'devops_team');
          break;
        case 'integration':
          stakeholders.push('architecture_team', 'qa_team');
          break;
        default:
          stakeholders.push('product_manager', 'tech_lead');
      }
    }

    // Priority-based stakeholder addition
    if (requirement.priority === 'critical') {
      stakeholders.push('tech_lead', 'product_manager');
    }

    return [...new Set(stakeholders)]; // Remove duplicates
  }

  /**
   * Record decision for a clarification
   */
  async recordDecision(
    clarificationId: string,
    decision: string,
    reasoning: string,
    confidence: number,
    evidence: string[],
    reviewers: string[] = []
  ): Promise<Decision> {
    const clarification = this.clarifications.get(clarificationId);
    if (!clarification) {
      throw new Error(`Clarification ${clarificationId} not found`);
    }

    const decisionId = `decision_${clarificationId}_${Date.now()}`;

    const decisionRecord: Decision = {
      id: decisionId,
      clarificationId,
      decision,
      reasoning,
      confidence: Math.max(0, Math.min(1, confidence)), // Clamp to [0,1]
      evidence,
      alternatives: await this.generateAlternatives(decision, clarification),
      risks: await this.identifyRisks(decision, clarification),
      implementationNotes: await this.generateImplementationNotes(decision, clarification),
      reviewers,
      timestamp: new Date()
    };

    this.decisions.set(decisionId, decisionRecord);

    // Update session
    const sessionId = this.findSessionForClarification(clarificationId);
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.decisions.push(decisionRecord);
        this.emit('decisionRecorded', { sessionId, decision: decisionRecord });
      }
    }

    // Update requirement with resolved ambiguity
    await this.updateRequirementWithDecision(clarification, decisionRecord);

    return decisionRecord;
  }

  /**
   * Generate alternatives for a decision
   */
  private async generateAlternatives(decision: string, clarification: Clarification): Promise<string[]> {
    const alternatives: string[] = [];

    // Use suggested answers as potential alternatives
    for (const suggested of clarification.suggestedAnswers) {
      if (suggested !== decision && !decision.includes(suggested)) {
        alternatives.push(suggested);
      }
    }

    // Generate logical alternatives based on decision type
    if (decision.includes('must')) {
      alternatives.push(decision.replace('must', 'should'));
      alternatives.push(decision.replace('must', 'may'));
    }

    if (decision.includes('all')) {
      alternatives.push(decision.replace('all', 'most'));
      alternatives.push(decision.replace('all', 'some'));
    }

    return alternatives.slice(0, 3); // Limit to top 3 alternatives
  }

  /**
   * Identify risks for a decision
   */
  private async identifyRisks(decision: string, clarification: Clarification): Promise<string[]> {
    const risks: string[] = [];

    const ambiguity = this.ambiguities.get(clarification.ambiguityId);
    if (!ambiguity) return risks;

    // Risk identification based on ambiguity type
    switch (ambiguity.type) {
      case 'scope':
        risks.push('Scope creep if boundaries are too broad');
        risks.push('Missed functionality if boundaries are too narrow');
        break;
      case 'dependency':
        risks.push('Blocked development if dependencies are incorrect');
        risks.push('Integration issues if dependency order is wrong');
        break;
      case 'acceptance_criteria':
        risks.push('Delivery uncertainty without clear criteria');
        risks.push('Quality issues if criteria are insufficient');
        break;
      case 'technical_detail':
        risks.push('Architecture mismatch if technical details are wrong');
        risks.push('Performance issues if constraints are inadequate');
        break;
      case 'semantic':
        risks.push('Misinterpretation leading to wrong implementation');
        risks.push('Rework required if understanding is incorrect');
        break;
    }

    // Add confidence-based risks
    if (clarification.question.includes('critical') || clarification.urgency === 'immediate') {
      risks.push('High impact if decision is incorrect');
    }

    return risks;
  }

  /**
   * Generate implementation notes for a decision
   */
  private async generateImplementationNotes(decision: string, clarification: Clarification): Promise<string[]> {
    const notes: string[] = [];

    const ambiguity = this.ambiguities.get(clarification.ambiguityId);
    if (!ambiguity) return notes;

    // Add implementation guidance based on decision content
    if (decision.includes('test') || decision.includes('verify')) {
      notes.push('Create automated tests for this requirement');
      notes.push('Add validation to acceptance criteria');
    }

    if (decision.includes('performance') || decision.includes('speed')) {
      notes.push('Add performance monitoring');
      notes.push('Create performance benchmarks');
    }

    if (decision.includes('security') || decision.includes('auth')) {
      notes.push('Security review required');
      notes.push('Add to security checklist');
    }

    if (decision.includes('api') || decision.includes('interface')) {
      notes.push('Update API documentation');
      notes.push('Version compatibility check required');
    }

    // Add review notes
    if (clarification.urgency === 'immediate') {
      notes.push('Implement as high priority');
      notes.push('Validate with stakeholders before proceeding');
    }

    return notes;
  }

  /**
   * Update requirement with decision resolution
   */
  private async updateRequirementWithDecision(
    clarification: Clarification,
    decision: Decision
  ): Promise<void> {
    const ambiguity = this.ambiguities.get(clarification.ambiguityId);
    if (!ambiguity) return;

    const requirement = this.requirements.get(ambiguity.requirementId);
    if (!requirement) return;

    // Add decision to requirement context
    if (!requirement.context.decisions) {
      requirement.context.decisions = [];
    }
    requirement.context.decisions.push({
      ambiguityType: ambiguity.type,
      question: clarification.question,
      decision: decision.decision,
      reasoning: decision.reasoning,
      timestamp: decision.timestamp
    });

    // Mark ambiguity as resolved
    if (!requirement.context.resolvedAmbiguities) {
      requirement.context.resolvedAmbiguities = [];
    }
    requirement.context.resolvedAmbiguities.push(ambiguity.id);

    this.emit('requirementUpdated', { requirement, decision });
  }

  /**
   * Find session containing a clarification
   */
  private findSessionForClarification(clarificationId: string): string | null {
    for (const [sessionId, session] of this.sessions) {
      if (session.clarifications.some(c => c.id === clarificationId)) {
        return sessionId;
      }
    }
    return null;
  }

  /**
   * Generate comprehensive session summary with clarity metrics
   */
  async generateSessionSummary(sessionId: string): Promise<ConsultationSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const metrics = this.calculateClarityMetrics(session);
    const summary = this.generateSummaryText(session, metrics);

    session.summary = summary;
    session.status = 'completed';
    session.endTime = new Date();

    this.emit('sessionCompleted', { sessionId, session, metrics });

    return session;
  }

  /**
   * Calculate clarity metrics for a session
   */
  private calculateClarityMetrics(session: ConsultationSession): ClarityMetrics {
    const totalAmbiguities = session.ambiguities.length;
    const resolvedAmbiguities = session.decisions.length;
    const blockingAmbiguities = session.ambiguities.filter(a => a.severity === 'blocking').length;
    const resolvedBlocking = session.decisions.filter(d => {
      const clarification = session.clarifications.find(c => c.id === d.clarificationId);
      if (!clarification) return false;
      const ambiguity = session.ambiguities.find(a => a.id === clarification.ambiguityId);
      return ambiguity?.severity === 'blocking';
    }).length;

    const averageConfidence = session.decisions.length > 0
      ? session.decisions.reduce((sum, d) => sum + d.confidence, 0) / session.decisions.length
      : 0;

    return {
      requirementClarity: totalAmbiguities > 0 ? resolvedAmbiguities / totalAmbiguities : 1,
      ambiguityResolutionRate: totalAmbiguities > 0 ? resolvedAmbiguities / totalAmbiguities : 1,
      decisionConfidence: averageConfidence,
      stakeholderAlignment: blockingAmbiguities > 0 ? resolvedBlocking / blockingAmbiguities : 1,
      implementationReadiness: this.calculateImplementationReadiness(session)
    };
  }

  /**
   * Calculate implementation readiness score
   */
  private calculateImplementationReadiness(session: ConsultationSession): number {
    let readinessScore = 0;
    let totalChecks = 0;

    for (const requirement of session.requirements) {
      totalChecks += 5; // 5 readiness checks per requirement

      // Has clear acceptance criteria
      if (requirement.context.acceptanceCriteria ||
          session.decisions.some(d => d.decision.toLowerCase().includes('test') ||
                                     d.decision.toLowerCase().includes('criteria'))) {
        readinessScore += 1;
      }

      // Has defined dependencies
      if (requirement.context.dependencies ||
          session.decisions.some(d => d.decision.toLowerCase().includes('dependency'))) {
        readinessScore += 1;
      }

      // Has technical constraints
      if (requirement.context.technicalConstraints ||
          session.decisions.some(d => d.decision.toLowerCase().includes('technical'))) {
        readinessScore += 1;
      }

      // Has clear scope
      if (session.decisions.some(d => d.decision.toLowerCase().includes('scope') ||
                                     d.decision.toLowerCase().includes('boundary'))) {
        readinessScore += 1;
      }

      // Has resolved blocking ambiguities
      const blockingAmbiguities = session.ambiguities.filter(a =>
        a.requirementId === requirement.id && a.severity === 'blocking'
      );
      const resolvedBlocking = blockingAmbiguities.filter(a =>
        session.decisions.some(d =>
          session.clarifications.some(c => c.id === d.clarificationId && c.ambiguityId === a.id)
        )
      );

      if (blockingAmbiguities.length === 0 || resolvedBlocking.length === blockingAmbiguities.length) {
        readinessScore += 1;
      }
    }

    return totalChecks > 0 ? readinessScore / totalChecks : 1;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummaryText(session: ConsultationSession, metrics: ClarityMetrics): string {
    const duration = session.endTime
      ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)
      : 0;

    return `
Consultation Session Summary
============================

Session ID: ${session.id}
Swarm Type: ${session.type}
Duration: ${duration} minutes
Participants: ${session.participants.join(', ') || 'Not specified'}

Requirements Analysis:
- Total requirements: ${session.requirements.length}
- Total ambiguities detected: ${session.ambiguities.length}
- Blocking ambiguities: ${session.ambiguities.filter(a => a.severity === 'blocking').length}
- Clarifications generated: ${session.clarifications.length}
- Decisions recorded: ${session.decisions.length}

Clarity Metrics:
- Requirement Clarity: ${(metrics.requirementClarity * 100).toFixed(1)}%
- Ambiguity Resolution Rate: ${(metrics.ambiguityResolutionRate * 100).toFixed(1)}%
- Decision Confidence: ${(metrics.decisionConfidence * 100).toFixed(1)}%
- Stakeholder Alignment: ${(metrics.stakeholderAlignment * 100).toFixed(1)}%
- Implementation Readiness: ${(metrics.implementationReadiness * 100).toFixed(1)}%

Key Decisions:
${session.decisions.map(d => `- ${d.decision} (Confidence: ${(d.confidence * 100).toFixed(1)}%)`).join('\n')}

Remaining Issues:
${session.ambiguities.filter(a =>
  !session.decisions.some(d =>
    session.clarifications.some(c => c.id === d.clarificationId && c.ambiguityId === a.id)
  )
).map(a => `- ${a.type}: ${a.description} (${a.severity})`).join('\n') || 'None'}

Recommendations:
${metrics.implementationReadiness >= 0.8
  ? ' Ready for implementation - all critical ambiguities resolved'
  : ' Additional clarification needed before implementation'
}
${metrics.decisionConfidence < 0.7
  ? ' Low confidence decisions detected - consider additional review'
  : ' High confidence in recorded decisions'
}
`.trim();
  }

  /**
   * Get session status and progress
   */
  getSessionStatus(sessionId: string): { session: ConsultationSession; metrics: ClarityMetrics } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const metrics = this.calculateClarityMetrics(session);
    return { session, metrics };
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ConsultationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  /**
   * Get clarifications pending decision
   */
  getPendingClarifications(sessionId?: string): Clarification[] {
    const sessions = sessionId
      ? [this.sessions.get(sessionId)].filter(Boolean)
      : Array.from(this.sessions.values());

    const pendingClarifications: Clarification[] = [];

    for (const session of sessions) {
      if (!session) continue;

      for (const clarification of session.clarifications) {
        const hasDecision = session.decisions.some(d => d.clarificationId === clarification.id);
        if (!hasDecision) {
          pendingClarifications.push(clarification);
        }
      }
    }

    return pendingClarifications.sort((a, b) => {
      const urgencyWeight = {
        'immediate': 4,
        'same_day': 3,
        'within_week': 2,
        'non_urgent': 1
      };
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    });
  }

  /**
   * Initialize templates for common clarification patterns
   */
  private initializeTemplates(): void {
    this.templates.set('semantic_clarification', {
      question: 'The requirement contains ambiguous language. How should we interpret "{term}" precisely?',
      criteria: ['Precision', 'Measurability', 'Consistency'],
      examples: ['Replace with specific numbers', 'Define in glossary', 'Use standardized terminology']
    });

    this.templates.set('scope_clarification', {
      question: 'The scope boundaries are unclear. What specifically is included and excluded?',
      criteria: ['Business value', 'Technical feasibility', 'Resource constraints'],
      examples: ['List specific components', 'Define edge cases', 'Set clear limits']
    });

    this.templates.set('dependency_clarification', {
      question: 'Dependencies are not explicit. What are the prerequisite requirements?',
      criteria: ['Dependency accuracy', 'Implementation order', 'Risk mitigation'],
      examples: ['Create dependency graph', 'Define prerequisite conditions', 'Map critical path']
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('sessionInitialized', (data) => {
      console.log(`Consultation session ${data.sessionId} initialized with ${data.session.requirements.length} requirements`);
    });

    this.on('clarificationsGenerated', (data) => {
      console.log(`Generated ${data.clarifications.length} clarifications for session ${data.sessionId}`);
    });

    this.on('decisionRecorded', (data) => {
      console.log(`Decision recorded for session ${data.sessionId}: ${data.decision.decision}`);
    });

    this.on('sessionCompleted', (data) => {
      console.log(`Session ${data.sessionId} completed with ${(data.metrics.implementationReadiness * 100).toFixed(1)}% implementation readiness`);
    });
  }

  /**
   * Export session data for external integration
   */
  exportSessionData(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const metrics = this.calculateClarityMetrics(session);

    return {
      session: {
        ...session,
        requirements: session.requirements.map(r => ({ ...r, context: { ...r.context } })),
        ambiguities: session.ambiguities.map(a => ({ ...a })),
        clarifications: session.clarifications.map(c => ({ ...c })),
        decisions: session.decisions.map(d => ({ ...d }))
      },
      metrics,
      exportTimestamp: new Date(),
      version: '1.0.0'
    };
  }

  /**
   * Import session data from external source
   */
  importSessionData(sessionData: any): string {
    const sessionId = sessionData.session.id;

    // Restore session
    this.sessions.set(sessionId, sessionData.session);

    // Restore individual collections
    for (const req of sessionData.session.requirements) {
      this.requirements.set(req.id, req);
    }

    for (const amb of sessionData.session.ambiguities) {
      this.ambiguities.set(amb.id, amb);
    }

    for (const clar of sessionData.session.clarifications) {
      this.clarifications.set(clar.id, clar);
    }

    for (const dec of sessionData.session.decisions) {
      this.decisions.set(dec.id, dec);
    }

    this.emit('sessionImported', { sessionId, session: sessionData.session });

    return sessionId;
  }
}

export default ConsultationClaritySystem;