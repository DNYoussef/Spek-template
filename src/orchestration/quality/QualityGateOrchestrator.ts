/**
 * Quality Gate Orchestrator - Main Interface (Refactored)
 *
 * This file now serves as the main entry point for the refactored Quality Gate system.
 * The original 2,782-line god object has been decomposed into 9 focused components
 * following NASA Rule 10 compliance and FSM-first development principles.
 *
 * Architecture:
 * - QualityGateCore: High-level orchestration and sequence management
 * - QualityGateValidator: Validation and measurement engine
 * - QualityGateProcessor: Sequence execution with checkpoints
 * - QualityGateMonitor: Performance tracking and alerts
 * - QualityGateReporter: Report generation and distribution
 * - QualityGateFacade: Backward compatibility layer (main export)
 * - TransitionHub: Centralized FSM state management
 * - OrchestratorStates: FSM states and events (enum-based)
 * - QualityGateTypes: All type definitions and interfaces
 */

// Import the facade which provides the complete backward-compatible API
import QualityGateOrchestrator from './QualityGateFacade';

// Re-export all types for external consumers
export * from './core/QualityGateTypes';

// Re-export the main orchestrator class
export { QualityGateOrchestrator };

// Default export for backward compatibility
export default QualityGateOrchestrator;

/**
 * Quality Gate System Architecture Summary:
 *
 * BEFORE (God Object):
 * - Single file: 2,782 lines
 * - Mixed responsibilities: validation, execution, monitoring, reporting, state management
 * - No FSM pattern
 * - String-based events
 * - Functions >60 lines
 * - No runtime assertions
 *
 * AFTER (Decomposed System):
 * - 9 focused files: ~400 lines each
 * - Single responsibility per component
 * - FSM-first architecture with centralized transitions
 * - Enum-based events (no string literals)
 * - All functions ≤60 lines
 * - 2+ runtime assertions per function
 * - NASA Rule 10 compliant
 *
 * Usage:
 * ```typescript
 * import { QualityGateOrchestrator } from './QualityGateOrchestrator';
 *
 * const orchestrator = new QualityGateOrchestrator();
 * const execution = await orchestrator.executeQualitySequence('sequence-default');
 * ```
 *
 * The QualityGateFacade maintains 100% backward compatibility while internally
 * delegating to the new decomposed architecture.
 */