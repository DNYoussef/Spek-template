/**
 * Quality Princess Facade - Unified Entry Point
 * NASA Rule 10 Compliant: Orchestrates all components
 */

import { QualityState, QualityEvent, QualityTask, QualityContext, QualityConfig, QualityReport } from './QualityPrincessTypes';
import { QualityPrincessCore } from './QualityPrincessCore';
import { QualityTransitionHub } from './QualityPrincessTransitions';
import { QualityValidators } from './QualityPrincessValidators';
import { QualityPrincessActions } from './QualityPrincessActions';

export class QualityPrincessFacade {
  private core: QualityPrincessCore;
  private transitionHub: QualityTransitionHub;
  private validators: QualityValidators;
  private actions: QualityPrincessActions;
  private context: QualityContext;
  private logger: any;

  constructor(config?: Partial<QualityConfig>, logger?: any) {
    // NASA Rule 10: Component initialization
    const defaultConfig: QualityConfig = {
      theaterThreshold: 60,
      realityThreshold: 70,
      maxRetries: 3,
      timeoutMs: 30000
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    this.logger = logger || console;
    
    // Initialize context
    this.context = {
      currentState: QualityState.IDLE,
      validations: [],
      agents: [],
      patterns: [],
      errorCount: 0
    };
    
    // Initialize components
    this.core = new QualityPrincessCore(finalConfig);
    this.transitionHub = new QualityTransitionHub(this.context);
    this.validators = new QualityValidators(finalConfig.theaterThreshold, finalConfig.realityThreshold);
    this.actions = new QualityPrincessActions(this.core, this.validators, this.logger);
  }

  async initialize(): Promise<void> {
    // NASA Rule 10: Initialization sequence
    if (!this.core) throw new Error('Core not initialized');
    if (this.context.currentState !== QualityState.IDLE) return;

    await this.transitionHub.transition(QualityEvent.INITIALIZE);
    await this.core.initialize();
    
    this.logger.info('Quality Princess initialized', {
      component: 'QualityPrincessFacade',
      state: this.context.currentState,
      config: this.core.getConfig()
    });
  }

  async executeTask(task: any): Promise<any> {
    // NASA Rule 10: Main task execution orchestration
    if (!task) throw new Error('Task required');
    if (!this.core.isReady()) await this.initialize();

    this.logger.info('Quality task execution started', {
      taskId: task.id,
      description: task.description
    });

    try {
      // Convert to typed task
      const qualityTask = this.convertToQualityTask(task);
      this.context.task = qualityTask;
      
      // Step 1: Analyze task
      await this.transitionHub.transition(QualityEvent.ANALYZE_TASK);
      const complexity = await this.actions.analyzeTaskComplexity(qualityTask);
      
      // Step 2: Begin validation
      await this.transitionHub.transition(QualityEvent.BEGIN_VALIDATION);
      
      // Step 3: Search patterns and spawn agents
      const patterns = await this.actions.searchSimilarPatterns(qualityTask);
      const agents = await this.actions.spawnQualityAgents(qualityTask);
      
      this.context.patterns = patterns;
      this.context.agents = agents;
      
      // Step 4: Coordinate agents
      await this.transitionHub.transition(QualityEvent.COORDINATE_AGENTS);
      
      // Step 5: Execute validation
      const validation = await this.actions.executeQualityValidation(qualityTask, agents, patterns);
      this.context.validations = [validation];
      
      // Step 6: Generate report
      await this.transitionHub.transition(QualityEvent.GENERATE_REPORT);
      
      const theaterPatterns = this.validators.detectTheaterPatterns(`${task.description} ${task.files?.join(' ')}`);
      const report = await this.actions.generateQualityReport([validation], theaterPatterns);
      
      // Step 7: Store patterns
      await this.actions.storeQualityPatterns(qualityTask, [validation]);
      
      // Step 8: Reset to idle
      await this.transitionHub.transition(QualityEvent.RESET);
      
      return {
        result: 'quality-validation-complete',
        taskId: task.id,
        complexity,
        validation,
        report,
        theaterDetected: theaterPatterns.length > 0,
        theaterPatterns,
        patternsUsed: patterns.length,
        kingLogicApplied: true,
        realityValidated: validation.realityScore >= this.core.getConfig().realityThreshold
      };
      
    } catch (error) {
      await this.handleError(error as Error);
      throw error;
    }
  }

  private convertToQualityTask(task: any): QualityTask {
    // NASA Rule 10: Task conversion
    if (!task) throw new Error('Task required');
    if (!task.id) throw new Error('Task ID required');

    return {
      id: task.id,
      description: task.description || '',
      files: task.files || [],
      priority: task.priority || 'medium',
      type: task.type || 'unit'
    };
  }

  private async handleError(error: Error): Promise<void> {
    // NASA Rule 10: Error handling
    if (!error) throw new Error('Error required');
    
    this.context.lastError = error;
    this.context.errorCount++;
    
    await this.transitionHub.transition(QualityEvent.ERROR_OCCURRED);
    
    this.logger.error('Quality task execution failed', {
      error: error.message,
      errorCount: this.context.errorCount,
      state: this.context.currentState
    });
  }

  getCurrentState(): QualityState {
    // NASA Rule 10: State getter
    if (!this.transitionHub) throw new Error('Transition hub not initialized');
    return this.transitionHub.getCurrentState();
  }

  getMetrics(): any {
    // NASA Rule 10: Metrics getter
    if (!this.core) throw new Error('Core not initialized');
    return this.core.getMetrics();
  }

  getTheaterStats(): any {
    // NASA Rule 10: Theater stats
    if (!this.core?.isReady()) throw new Error('Core not ready');
    return this.core.getQualityMemory().getTheaterStats();
  }

  async searchRealityPatterns(query: string): Promise<any[]> {
    // NASA Rule 10: Pattern search
    if (!query) throw new Error('Query required');
    if (!this.core?.isReady()) throw new Error('Core not ready');

    const config = this.core.getConfig();
    return this.core.getQualityMemory().searchSimilarQuality(
      query,
      5,
      0.7,
      { 
        maxTheaterScore: config.theaterThreshold, 
        minRealityScore: config.realityThreshold 
      }
    );
  }

  getMemoryStats(): any {
    // NASA Rule 10: Memory stats
    if (!this.core?.isReady()) throw new Error('Core not ready');
    return this.core.getQualityMemory().getStats();
  }

  async reset(): Promise<void> {
    // NASA Rule 10: System reset
    if (!this.transitionHub) throw new Error('Transition hub not initialized');
    await this.transitionHub.reset();
  }

  isReady(): boolean {
    // NASA Rule 10: Readiness check
    return this.core?.isReady() && 
           this.transitionHub?.getCurrentState() === QualityState.IDLE;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: quality-princess-fsm-refactor-007
// inputs: ["QualityPrincess.ts"]
// tools_used: ["claude-code", "filesystem"]
// versions: {"model":"sonnet-4","prompt":"quality-fsm-refactor-v1"}
// === END FOOTER ===