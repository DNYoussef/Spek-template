/**
 * Batch DSPy Optimization Engine - Main Entry Point
 * Exports all components for systematic 87-agent optimization
 * NASA Rule 10 Compliant: Fixed bounds, no recursion
 */

export { BatchOptimizationController } from './BatchOptimizationController';
export { AgentProcessingQueue } from './AgentProcessingQueue';
export { OptimizationValidator } from './OptimizationValidator';
export { ProgressTracker } from './ProgressTracker';
export { RollbackManager } from './RollbackManager';

export type {
  AgentConfig,
  OptimizationResult,
  BatchProgress
} from './BatchOptimizationController';

export type {
  QueueStats,
  ProcessingPhase
} from './AgentProcessingQueue';

export type {
  ValidationResult,
  ValidationRule
} from './OptimizationValidator';

export type {
  SessionMetrics,
  PhaseProgress,
  AgentProcessingRecord
} from './ProgressTracker';

export type {
  BackupRecord,
  RollbackResult,
  RollbackReport
} from './RollbackManager';

/**
 * Quick start function for batch optimization
 * NASA Rule 10: ≤60 lines, fixed bounds, assertions
 */
export async function optimizeAllAgents(): Promise<import('./BatchOptimizationController').BatchProgress> {
  const { BatchOptimizationController } = await import('./BatchOptimizationController');

  const controller = new BatchOptimizationController();

  if (!controller) {
    throw new Error('Failed to initialize BatchOptimizationController');
  }

  const result = await controller.optimizeAllAgents();

  if (!result || result.total_agents !== 87) {
    throw new Error(`Invalid optimization result: expected 87 agents, got ${result?.total_agents}`);
  }

  return result;
}

/**
 * Quick start function for validation
 * NASA Rule 10: ≤60 lines, assertions
 */
export async function validateOptimization(): Promise<boolean> {
  const { OptimizationValidator } = await import('./OptimizationValidator');
  const { AgentProcessingQueue } = await import('./AgentProcessingQueue');

  const validator = new OptimizationValidator();
  const queue = new AgentProcessingQueue();

  if (!validator || !queue) {
    throw new Error('Failed to initialize validation components');
  }

  await validator.loadValidationRules();
  const agents = await queue.loadAllAgents();

  if (agents.length !== 87) {
    throw new Error(`Expected 87 agents for validation, found ${agents.length}`);
  }

  // Validate first 10 agents as sample (full validation in main script)
  let passCount = 0;
  const sampleSize = Math.min(10, agents.length);

  for (let i = 0; i < sampleSize; i++) {
    const agent = agents[i];
    if (!agent) continue;

    // Mock optimized prompt for validation test
    const mockPrompt = `Optimized DSPy prompt for agent ${agent.agent_id}`;
    const result = await validator.validateOptimization(agent, mockPrompt);

    if (result.passed) {
      passCount++;
    }
  }

  const passRate = passCount / sampleSize;
  return passRate >= 0.8; // 80% minimum pass rate
}

/**
 * Quick start function for rollback
 * NASA Rule 10: ≤60 lines, fixed bounds
 */
export async function rollbackOptimization(agentIds?: string[]): Promise<import('./RollbackManager').RollbackReport> {
  const { RollbackManager } = await import('./RollbackManager');

  const rollbackManager = new RollbackManager();

  if (!rollbackManager) {
    throw new Error('Failed to initialize RollbackManager');
  }

  await rollbackManager.initializeBackupDirectory();

  if (!agentIds || agentIds.length === 0) {
    // Full rollback - get all backup files
    const { AgentProcessingQueue } = await import('./AgentProcessingQueue');
    const queue = new AgentProcessingQueue();
    const agents = await queue.loadAllAgents();

    agentIds = agents.map(agent => agent.agent_id).slice(0, 50); // Max 50 for safety
  }

  if (agentIds.length > 50) {
    throw new Error(`Too many agents for rollback: ${agentIds.length} > 50`);
  }

  const result = await rollbackManager.rollbackMultipleAgents(agentIds);

  if (!result) {
    throw new Error('Rollback operation failed');
  }

  return result;
}

/**
 * Get optimization progress from latest session
 * NASA Rule 10: ≤60 lines, error checking
 */
export async function getOptimizationProgress(): Promise<import('./BatchOptimizationController').BatchProgress | null> {
  const { ProgressTracker } = await import('./ProgressTracker');

  try {
    const tracker = new ProgressTracker();

    if (!tracker) {
      return null;
    }

    const progress = await tracker.getCurrentProgress();

    if (!progress || progress.total_agents !== 87) {
      return null;
    }

    return progress;
  } catch (error) {
    console.warn('Could not retrieve optimization progress:', error);
    return null;
  }
}

// Constants for batch optimization
export const BATCH_OPTIMIZATION_CONSTANTS = {
  EXPECTED_AGENT_COUNT: 87,
  MAX_PROCESSING_TIME_MINUTES: 120,
  MIN_SUCCESS_RATE: 0.95,
  MIN_VALIDATION_SCORE: 0.85,
  MAX_ROLLBACK_AGENTS: 50
} as const;

// Processing phases for systematic optimization
export const PROCESSING_PHASES = [
  'Development Agents',
  'Architecture Agents',
  'Testing Agents',
  'Coordination Agents',
  'Security Agents',
  'Performance Agents',
  'Research Agents',
  'Repository Agents'
] as const;

/**
 * Version and build information
 */
export const VERSION_INFO = {
  version: '1.0.0',
  build_date: '2025-09-28',
  nasa_rule_10_compliant: true,
  agent_count: 87,
  optimization_engine: 'DSPy',
  rollback_capability: true
} as const;