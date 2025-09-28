/**
 * DEPRECATED: Original WorkflowOrchestrator (2,118 lines)
 *
 * This file has been DECOMPOSED into 8 NASA Rule 10 compliant components:
 * - WorkflowTypes.ts: Type definitions (291 lines)
 * - WorkflowStateMachine.ts: FSM implementation (638 lines)
 * - WorkflowCore.ts: Main orchestration (693 lines)
 * - WorkflowValidator.ts: Validation logic (614 lines)
 * - WorkflowExecutor.ts: Execution engine (1,019 lines)
 * - WorkflowScheduler.ts: Queue management (382 lines)
 * - WorkflowMonitor.ts: Health monitoring (629 lines)
 * - WorkflowFacade.ts: Backward compatibility (499 lines)
 *
 * MIGRATION: Import from './WorkflowFacade' or use './index'
 * All NASA Rule 10 requirements met: Functions ≤60 lines, 2+ assertions
 */

// Re-export the facade for backward compatibility
export { WorkflowOrchestrator as default } from './WorkflowFacade';
export * from './WorkflowTypes';

// END OF FILE - All functionality moved to decomposed components