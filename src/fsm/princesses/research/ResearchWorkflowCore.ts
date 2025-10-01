/**
 * ResearchWorkflowCore - Core Research FSM Operations
 * NASA Rule 10 Compliant - Single responsibility for research workflow execution
 * Handles core research pipeline without orchestration complexity
 */

import { EventEmitter } from 'events';
import { ResearchState, ResearchEvent, ResearchContext } from '~types/FSMTypes';
import { ResearchWorkflowOperations } from '../operations/ResearchWorkflowOperations';
import { ResearchAnalysisEngine } from '../analysis/ResearchAnalysisEngine';

export class ResearchWorkflowCore extends EventEmitter {
  private workflowOps: ResearchWorkflowOperations;
  private analysisEngine: ResearchAnalysisEngine;

  constructor() {
    super();
    this.workflowOps = new ResearchWorkflowOperations();
    this.analysisEngine = new ResearchAnalysisEngine();
  }

  /**
   * Execute requirement analysis step
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  async executeRequirementAnalysis(context: ResearchContext): Promise<void> {
    if (!context) {
      throw new Error('Context required for requirement analysis');
    }

    const requirements = await this.workflowOps.analyzeRequirements();
    const completeness = this.workflowOps.validateRequirementsCompleteness(requirements);

    if (completeness.score < 80) {
      this.emit('requirementAnalysisWarning', `Low completeness: ${completeness.score}%`);
    }

    context.requirements = {
      scope: requirements.scope || 'Technology evaluation and analysis',
      objectives: requirements.objectives || [
        'Identify emerging technologies',
        'Analyze implementation patterns',
        'Assess technical risks',
        'Evaluate best practices'
      ],
      constraints: requirements.constraints || ['Timeline constraints', 'Resource limitations'],
      deliverables: requirements.deliverables || ['Technical analysis', 'Recommendations', 'Implementation guide'],
      analyzed: completeness.score >= 80
    };

    this.emit('requirementAnalysisComplete', context.requirements);
  }

  /**
   * Execute source identification step
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  async executeSourceIdentification(context: ResearchContext): Promise<void> {
    if (!context.requirements?.scope) {
      throw new Error('Requirements scope required for source identification');
    }

    const sources = await this.workflowOps.identifyAllSources(context.requirements.scope);
    const sourceValidation = this.workflowOps.validateSourcesQuality(sources);

    if (sourceValidation.totalSources < 10) {
      this.emit('sourceIdentificationWarning', 'Limited sources identified, expanding search scope');
    }

    context.sources = {
      academic: sources.academic,
      industry: sources.industry,
      internal: sources.internal,
      validated: sourceValidation.quality >= 80
    };

    this.emit('sourceIdentificationComplete', context.sources);
  }

  /**
   * Execute data collection step
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  async executeDataCollection(context: ResearchContext): Promise<void> {
    if (!context.sources) {
      throw new Error('Sources required for data collection');
    }

    const collectionResults = await this.workflowOps.collectAllData(context.sources);
    const totalDataPoints = collectionResults.academicPapers +
                           collectionResults.industryReports +
                           collectionResults.interviews;

    if (totalDataPoints < 50) {
      this.emit('dataCollectionWarning', 'Limited data collected, may affect analysis quality');
    }

    context.data.dataCollection = {
      complete: totalDataPoints >= 50,
      ...collectionResults
    };

    this.emit('dataCollectionComplete', context.data.dataCollection);
  }

  /**
   * Execute data analysis step
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  async executeDataAnalysis(context: ResearchContext): Promise<void> {
    if (!context.data.dataCollection) {
      throw new Error('Data collection required for analysis');
    }

    const analysisResults = await this.analysisEngine.performCompleteAnalysis(
      context.data.dataCollection
    );

    if (analysisResults.dataPoints < 20) {
      throw new Error('Insufficient data for meaningful analysis');
    }

    if (analysisResults.confidence < 70) {
      this.emit('dataAnalysisWarning', `Low confidence: ${analysisResults.confidence}%`);
    }

    context.analysis = {
      ...analysisResults,
      completed: analysisResults.confidence >= 70
    };

    this.emit('dataAnalysisComplete', context.analysis);
  }

  /**
   * Execute synthesis step
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  async executeSynthesis(context: ResearchContext): Promise<void> {
    if (!context.analysis?.completed) {
      throw new Error('Complete analysis required for synthesis');
    }

    const findings = await this.analysisEngine.synthesizeFindings(
      context.analysis,
      context.data.dataCollection
    );

    if (findings.confidence < 80) {
      this.emit('synthesisWarning', `Low synthesis confidence: ${findings.confidence}%`);
    }

    context.findings = findings;
    this.emit('synthesisComplete', context.findings);
  }

  /**
   * Get current workflow status
   * NASA Rule 10: ≤60 lines, simple status check
   */
  getWorkflowStatus(context: ResearchContext): Record<string, boolean> {
    if (!context) {
      throw new Error('Context required for status check');
    }

    return {
      requirementsAnalyzed: !!context.requirements?.analyzed,
      sourcesValidated: !!context.sources?.validated,
      dataCollected: !!context.data?.dataCollection?.complete,
      analysisCompleted: !!context.analysis?.completed,
      synthesisCompleted: !!context.findings
    };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: agent076-research-core-decomposition
// inputs: ["src/fsm/princesses/ResearchPrincessFSM.ts"]
// tools_used: ["Read", "Write", "Bash"]
// versions: {"model":"sonnet-4","fsm-design":"1.0.0"}
// === END FOOTER ===

// Backward compatibility
export default ResearchWorkflowCore;
