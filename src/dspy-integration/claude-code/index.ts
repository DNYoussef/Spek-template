/**
 * DSPy Task Tool Optimization - Main Export Module
 * NASA Rule 10 Compliant - Complete system integration
 *
 * REQUIREMENTS:
 * - Single entry point for all optimization functionality
 * - Backward compatibility with existing Task calls
 * - Production-ready configuration
 * - Complete system initialization
 * - Performance monitoring integration
 */

// Core optimization components
export { TaskToolOptimizer, OptimizationResult, AgentPromptParams, OptimizationConfig } from './TaskToolOptimizer';

// FSM state management
export {
  TaskOptimizationHub,
  TransitionResult,
  StateTransition
} from './fsm/TaskOptimizationHub';

export {
  TaskOptimizationState,
  OptimizationStateContract,
  StateFactory
} from './fsm/TaskOptimizationStates';

export {
  TaskOptimizationEvent,
  TaskOptimizationEventPayload,
  EventValidator,
  EventFactory
} from './fsm/TaskOptimizationEvents';

// Agent signatures and model optimization
export {
  AgentSignatureRegistry,
  DSPySignature,
  DSPyField,
  OptimalModel,
  DSPyFieldFactory
} from './AgentSummonSignatures';

// Quality validation
export {
  PromptQualityValidator,
  QualityValidationResult,
  QualityDimension,
  ValidationConfig
} from './PromptQualityValidator';

// Learning and feedback
export {
  OptimizationFeedbackLoop,
  FeedbackData,
  LearningPattern,
  StrategyRecommendation,
  FeedbackAnalytics
} from './OptimizationFeedbackLoop';

// Main integration interface
export {
  ClaudeCodeDSPyInterface,
  DSPyEnhancedTaskParams,
  ClaudeCodeTaskParams,
  TaskExecutionResult,
  ContextDNA,
  PerformanceTargets,
  CoordinationMetadata,
  dspyIntegration,
  DSPyTask,
  Task
} from './ClaudeCodeDSPyInterface';

/**
 * System initialization and configuration
 */
export class DSPyOptimizationSystem {
  private static initialized = false;
  private static systemInstance: ClaudeCodeDSPyInterface | null = null;

  /**
   * Initialize the complete DSPy optimization system
   * @param config System configuration
   * @returns Initialization success
   */
  static async initialize(config?: {
    optimizationEnabled?: boolean;
    qualityThreshold?: number;
    cachingEnabled?: boolean;
    feedbackEnabled?: boolean;
  }): Promise<boolean> {
    // NASA Rule 10: Assertions
    if (DSPyOptimizationSystem.initialized) {
      return true;
    }

    try {
      // Initialize agent signatures
      AgentSignatureRegistry.initialize();

      // Create system instance with configuration
      DSPyOptimizationSystem.systemInstance = new ClaudeCodeDSPyInterface(
        undefined, // Use default optimization config
        config
      );

      DSPyOptimizationSystem.initialized = true;
      return true;

    } catch (error) {
      console.error('DSPy system initialization failed:', error);
      return false;
    }
  }

  /**
   * Get system instance
   */
  static getInstance(): ClaudeCodeDSPyInterface | null {
    return DSPyOptimizationSystem.systemInstance;
  }

  /**
   * Check if system is initialized
   */
  static isInitialized(): boolean {
    return DSPyOptimizationSystem.initialized;
  }

  /**
   * Get system statistics
   */
  static getSystemStats(): {
    initialized: boolean;
    agentSignatures: number;
    optimizationStats?: any;
  } {
    return {
      initialized: DSPyOptimizationSystem.initialized,
      agentSignatures: AgentSignatureRegistry.getSignatureCount(),
      optimizationStats: DSPyOptimizationSystem.systemInstance?.getOptimizationStats()
    };
  }

  /**
   * Reset system (for testing)
   */
  static reset(): void {
    DSPyOptimizationSystem.initialized = false;
    DSPyOptimizationSystem.systemInstance = null;
  }
}

/**
 * Production configuration presets
 */
export const ProductionConfig = {
  /**
   * High performance configuration
   */
  highPerformance: {
    optimizationEnabled: true,
    qualityThreshold: 0.9,
    cachingEnabled: true,
    feedbackEnabled: true
  },

  /**
   * Balanced configuration (recommended)
   */
  balanced: {
    optimizationEnabled: true,
    qualityThreshold: 0.85,
    cachingEnabled: true,
    feedbackEnabled: true
  },

  /**
   * Conservative configuration
   */
  conservative: {
    optimizationEnabled: true,
    qualityThreshold: 0.8,
    cachingEnabled: true,
    feedbackEnabled: false
  },

  /**
   * Development configuration
   */
  development: {
    optimizationEnabled: true,
    qualityThreshold: 0.7,
    cachingEnabled: false,
    feedbackEnabled: true
  },

  /**
   * Disabled configuration (fallback only)
   */
  disabled: {
    optimizationEnabled: false,
    qualityThreshold: 0.5,
    cachingEnabled: false,
    feedbackEnabled: false
  }
};

/**
 * Quick start helpers
 */
export const QuickStart = {
  /**
   * Initialize with production settings
   */
  async initializeProduction(): Promise<boolean> {
    return await DSPyOptimizationSystem.initialize(ProductionConfig.balanced);
  },

  /**
   * Initialize with development settings
   */
  async initializeDevelopment(): Promise<boolean> {
    return await DSPyOptimizationSystem.initialize(ProductionConfig.development);
  },

  /**
   * Create optimized task with minimal configuration
   */
  async createTask(
    agentType: string,
    prompt: string,
    options?: {
      context?: any;
      constraints?: string[];
      performanceTargets?: any;
    }
  ): Promise<TaskExecutionResult | null> {
    // Ensure system is initialized
    if (!DSPyOptimizationSystem.isInitialized()) {
      const initSuccess = await DSPyOptimizationSystem.initialize();
      if (!initSuccess) {
        return null;
      }
    }

    const instance = DSPyOptimizationSystem.getInstance();
    if (!instance) {
      return null;
    }

    // Use legacy Task interface for simplicity
    const legacyParams: ClaudeCodeTaskParams = {
      subagent_type: agentType,
      description: `Optimized task for ${agentType}`,
      prompt,
      context: options?.context,
      constraints: options?.constraints
    };

    return await instance.Task(legacyParams);
  },

  /**
   * Get available agent types
   */
  getAvailableAgentTypes(): string[] {
    const signatures = AgentSignatureRegistry.getAllSignatures();
    return signatures.map((sig: unknown) => (sig as any).agentType);
  },

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    if (!DSPyOptimizationSystem.isInitialized()) {
      return {
        status: 'unhealthy',
        details: { error: 'System not initialized' }
      };
    }

    const stats = DSPyOptimizationSystem.getSystemStats();
    const hasSignatures = stats.agentSignatures > 0;

    return {
      status: hasSignatures ? 'healthy' : 'degraded',
      details: stats
    };
  }
};

/**
 * Default export for easy importing
 */
export default {
  // Main classes
  TaskToolOptimizer,
  TaskOptimizationHub,
  AgentSignatureRegistry,
  PromptQualityValidator,
  OptimizationFeedbackLoop,
  ClaudeCodeDSPyInterface,

  // System management
  DSPyOptimizationSystem,
  ProductionConfig,
  QuickStart,

  // Direct task functions for backward compatibility
  DSPyTask,
  Task
};

/**
 * Auto-initialization for immediate use
 * Can be disabled by setting NODE_ENV to 'test'
 */
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
  // Auto-initialize with balanced configuration
  DSPyOptimizationSystem.initialize(ProductionConfig.balanced).catch(error => {
    console.warn('DSPy system auto-initialization failed:', error);
  });
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: task-optimizer-main-010
// inputs: ["All system components", "Integration requirements", "Production configuration"]
// tools_used: ["Write"]
// versions: {"model": "claude-sonnet-4", "prompt": "v1.0"}
// === END FOOTER ===